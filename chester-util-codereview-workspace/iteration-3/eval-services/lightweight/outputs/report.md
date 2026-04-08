# Code Review: Services Directory

**Scope:** `Story.Application.Desktop/Services/` (28 C# files)

**Context:** Avalonia desktop application for a story/narrative design tool. The Services directory contains DI-registered services for application state, file dialogs, tree data loading, editor content management, diagnostics, navigation, and user settings.

---

## Structural Concerns

### 1. Flat-provider duplication (High)

**Files:**
- `Providers/CharactersTreeDataProvider.cs` (lines 17-58)
- `Providers/LocationsTreeDataProvider.cs` (lines 17-58)
- `Providers/FactsTreeDataProvider.cs` (lines 17-58)

These three classes are structurally identical. Each has the same constructor signature (`ITreeDataService`, `ILogger<T>`), the same `LoadRootInternalAsync` body (call `_treeDataService.LoadRootAsync`, filter by kind, map with `ToDesktopNode`), the same no-op `LoadChildrenAsync`, and the same `ToDesktopNode` helper. The only difference is the `TreeNodeKind` filter predicate (Character, Location, Fact/Effect).

All three could be a single `FlatTreeDataProvider` parameterized on the kind filter, or a shared base with the kind injected at construction. As-is, a change to the load/map logic (e.g., adding error handling or changing the `TreeNode` constructor) must be replicated across three files.

`StructureTreeDataProvider` is meaningfully different (it implements `LoadChildrenAsync`) so it correctly remains separate.

### 2. `StoryScopeFactory` holds an unused dependency (Medium)

**File:** `StoryScopeFactory.cs`, lines 11-12, 22-26

`StoryScopeFactory` injects `IApplicationStateService` but never reads from it. The comment on line 22-25 explains the intent ("ensures this factory is aware of the application state") but the dependency is decorative -- it does not influence `CreateScope()`. This is misleading: a reader expects injected dependencies to be used, and the comment is rationalizing rather than explaining.

Either the factory should actually use `_applicationStateService` (e.g., to guard that a database is open before creating a scope), or the dependency should be removed.

### 3. `ITreeLoader` and `TreeLoader.cs` are dead code (High)

**Files:**
- `ITreeLoader.cs` (lines 1-36) -- live interface with four methods
- `TreeLoader.cs` (lines 1-163) -- entire file is commented out

The `TreeLoader` implementation is 100% commented out. The interface `ITreeLoader` still exists but has no live implementation in this directory. If the codebase has migrated to the `ITreeDataProvider`/`ITreeDataProviderFactory` pattern (which it clearly has, given the four providers and the factory), then both `ITreeLoader` and `TreeLoader.cs` are dead code. The interface misleads anyone reading the Services directory into thinking there is a synchronous tree-loading path.

### 4. `EditorContentLoader` has too many responsibilities (Medium)

**File:** `Editor/EditorContentLoader.cs` (354 lines, 7 injected dependencies)

This class manages:
- Text resolution (dirty > cached > needs-load)
- Navigation cache (`_navigationCache` dictionary)
- Dirty state tracking (delegates to `SolutionDirtyState`)
- Load lifecycle (cancel pending, prepare navigation, mark complete)
- Three distinct async loading strategies (single, composite, category)
- Workspace reset

Seven constructor dependencies is a signal. The three private `Load*` methods (lines 231-352) share a near-identical structure: create CTS, assign to `_loadCts`, `Task.Run`, try/catch/finally with the same dispose pattern. That shared pattern could be extracted.

The text resolution and caching concern (`ResolveText`, `SaveCurrentState`, `SeedCache`, `ClearCache`) is a distinct responsibility from the async load orchestration and could be a separate class.

---

## Practical Concerns

### 5. CTS race condition in `EditorContentLoader` (High)

**File:** `Editor/EditorContentLoader.cs`, lines 244-275 (and identical pattern at lines 280-312, 317-352)

The `_loadCts` field is accessed from both the UI thread and background threads without synchronization. Consider this sequence:

1. `LoadSingleEntityContent` sets `_loadCts = cts` (line 245)
2. Background task begins on thread pool
3. `CancelPendingLoad()` is called from UI thread -- does `Interlocked.Exchange(ref _loadCts, null)`, cancels, disposes (lines 162-167)
4. The background task's `finally` block checks `ReferenceEquals(_loadCts, cts)` (line 269) -- this is now false because step 3 nulled it, so the CTS is NOT disposed by the finally block
5. But step 3 already disposed it -- so this path is fine

However, consider the reverse race: two rapid navigations. `LoadSingleEntityContent` is called, sets `_loadCts = cts1`. Before cts1's task starts, `PrepareNavigation` calls `CancelPendingLoad` (disposes cts1), then `LoadCompositeContent` sets `_loadCts = cts2`. Now cts1's finally block runs: `ReferenceEquals(_loadCts, cts1)` is false, so cts1 is not disposed -- but `CancelPendingLoad` already disposed it. This works but is fragile. A single load method that encapsulates the CTS lifecycle would eliminate the risk.

### 6. `DialogService` throws on null window instead of graceful handling (Low)

**File:** `DialogService.cs`, lines 23, 31, 40

All three methods throw `InvalidOperationException` if `_windowAccessor.Current` is null. This is a startup timing issue -- if any code path triggers a dialog before the main window is set, the exception message ("Main window is not initialized") is clear, but the throw could crash the app. The same pattern appears in `FileService.cs` lines 20 and 38. Whether this is a problem depends on whether callers guard against early invocation, but there is no compile-time protection.

### 7. `FileService` is not sealed (Low)

**File:** `FileService.cs`, line 8

`FileService` is `public class` while every other concrete service in this directory is `sealed` (`ApplicationStateService`, `DialogService`, `NavigationStackService`, `StoryScopeFactory`, `TreeDataProviderFactory`, all four providers, all Editor services). This is a style inconsistency rather than a bug, but sealed classes communicate intent and enable minor compiler optimizations.

`UserSettingsService` (line 13) is also `public class` without `sealed`.

### 8. `UserSettingsService.LastAccessedDirectory` reads from disk on every get (Low)

**File:** `UserSettingsService.cs`, lines 67-72

The getter calls `LoadInternal()` which reads and deserializes the JSON file from disk on every access. `FileService.GetStartLocationAsync` (FileService.cs line 60) reads this property, so every file-open or file-save dialog triggers a disk read. This is unlikely to be a performance issue in practice (it is a small file, and dialogs are infrequent), but it is worth noting that the property behaves more like a method than a cached value.

### 9. `DiagnosticDumpService.ResolveDumpDirectory` walks from `AppContext.BaseDirectory` (Low)

**File:** `DiagnosticDumpService.cs`, lines 191-209

This static method walks up the directory tree looking for `StoryDesigner.sln`. In a deployed/published build, `AppContext.BaseDirectory` points to the publish output directory, which will not have the `.sln` file as an ancestor. This method would throw `InvalidOperationException` in production. It appears to be a development-only diagnostic tool, but there is no guard or documentation marking it as such.

---

## Assessment

The code is generally well-structured: interfaces are clean, DI patterns are consistent, and the Editor subdirectory shows thoughtful decomposition (CompositeDocumentManager, DiagnosticMarkerService, EditorLanguageClient each own a clear concern). The two most actionable findings are the dead `TreeLoader`/`ITreeLoader` code that should be removed, and the flat-provider duplication in Providers/ that turns a single-line change into a three-file edit. The `EditorContentLoader` is the largest class and carries the most complexity; its CTS lifecycle pattern works but is the most fragile code in the directory.
