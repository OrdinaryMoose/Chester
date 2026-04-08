# Code Smell Review: Story.Application.Desktop/Services/

**Scope:** 26 files across `Services/`, `Services/Editor/`, and `Services/Providers/`

---

## 1. Duplicated Code (Copy-Paste Providers)

**Files:** `CharactersTreeDataProvider.cs`, `LocationsTreeDataProvider.cs`, `FactsTreeDataProvider.cs`

**Severity:** High

These three providers are nearly identical. Each one:
- Injects `ITreeDataService` + `ILogger<T>`
- Implements `LoadRootAsync` by calling `_treeDataService.LoadRootAsync()`, filtering by a `TreeNodeKind`, then mapping with the same `ToDesktopNode` method
- Returns `Array.Empty<TreeNode>()` from `LoadChildrenAsync`
- Has an identical `ToDesktopNode` private static method

The only difference between them is the `Where` filter predicate (`TreeNodeKind.Character` vs `TreeNodeKind.Location` vs `TreeNodeKind.Fact/Effect`). This is a textbook case of duplicated code that could be collapsed into a single generic flat-list provider parameterized by the accepted `TreeNodeKind` values.

`StructureTreeDataProvider` also duplicates the `ToDesktopNode` method.

---

## 2. Large Class / Too Many Responsibilities: EditorContentLoader

**File:** `EditorContentLoader.cs` (353 lines)

**Severity:** High

This class has multiple distinct responsibilities bundled together:
1. **Text resolution** (dirty/cached/needs-load three-tier strategy) -- lines 95-109
2. **Navigation cache management** (SeedCache, ClearCache, SaveCurrentState) -- lines 116-146
3. **Load lifecycle management** (CancelPendingLoad, PrepareNavigation, MarkLoadCompleted) -- lines 160-187
4. **Three different async content loading strategies** (single entity, composite, category) -- lines 231-352
5. **Workspace reset** -- lines 209-216

The class header comment acknowledges this: "Also owns the cached and dirty text state... providing a three-tier resolution strategy." The text resolution/caching responsibility is orthogonal to the async load orchestration and could be a separate service.

---

## 3. Duplicated Async Load Pattern in EditorContentLoader

**File:** `EditorContentLoader.cs`

**Severity:** Medium

The three private load methods (`LoadSingleEntityContent`, `LoadCompositeContent`, `LoadCompositeCategoryContent`) share an identical structural pattern:
1. Create `CancellationTokenSource`
2. Assign to `_loadCts`
3. `Task.Run` with try/catch/finally
4. Check cancellation, dispatch to UI thread
5. Identical `catch (OperationCanceledException)` and `catch (Exception)` blocks
6. Identical `finally` block for CTS cleanup

This repeated structure is a maintenance risk -- if the cancellation or cleanup logic needs to change, all three methods must be updated in lockstep.

---

## 4. Dead Code: TreeLoader.cs

**File:** `TreeLoader.cs`

**Severity:** Medium

The entire file (164 lines) is commented out. This is dead code that should either be deleted (it's in version control if needed) or restored. Leaving it commented out adds noise and confusion about whether `ITreeLoader` has a live implementation.

---

## 5. Speculative Generality / Unused Dependency: StoryScopeFactory

**File:** `StoryScopeFactory.cs`

**Severity:** Medium

`StoryScopeFactory` injects `IApplicationStateService` but never uses it. The comment explains: "The IApplicationStateService dependency ensures that this factory is aware of the application state, even if the current implementation of CreateScope simply delegates." This is speculative -- the dependency exists only to justify a future use that may never materialize. The class is currently a pure pass-through wrapper around `IServiceScopeFactory`, providing no additional value.

---

## 6. Bare `catch` Blocks Swallowing All Exceptions

**Files:** `FileService.cs` (lines 68-72, 83-86), `UserSettingsService.cs` (lines 91, 108, 110)

**Severity:** Medium

Multiple catch blocks catch all exceptions with no logging:

```csharp
catch
{
    // Deleted directory, unmounted path, invalid URI -- fall back to OS default
    return null;
}
```

While the comments explain the intent, swallowing all exceptions silently makes debugging difficult. At minimum, these should log at Debug/Trace level so failures are observable when needed. `UserSettingsService` has the same pattern for both Load and Save.

---

## 7. Thread Safety Gap: ApplicationStateService

**File:** `ApplicationStateService.cs`

**Severity:** Medium

`ApplicationStateService` is registered as a shared service (singleton, based on the interface pattern) but has no synchronization. `SetCurrentDatabase` and `CloseDatabase` both write `_currentDatabasePath` and raise `DatabaseChanged`, but there's no lock or interlocked operation. If called from different threads, a reader of `CurrentDatabasePath` could observe a stale value, or `DatabaseChanged` could fire with inconsistent state.

---

## 8. Interface Has Mutable Property: IMainWindowAccessor

**File:** `IMainWindowAccessor.cs`

**Severity:** Low-Medium

The interface exposes `Window? Current { get; set; }` -- a publicly settable property on an interface. Any consumer that receives `IMainWindowAccessor` can overwrite the window reference. This is essentially global mutable state behind an interface. A separate `SetWindow` method restricted to startup code (or a split read/write interface) would make the intent clearer and reduce the mutation surface.

---

## 9. Inconsistent Sealed/Non-Sealed Declarations

**Files:** `FileService.cs`, `UserSettingsService.cs`

**Severity:** Low

Most implementation classes in this directory are `sealed` (`ApplicationStateService`, `DialogService`, `NavigationStackService`, `MainWindowAccessor`, `StoryScopeFactory`, `TreeDataProviderFactory`, all Providers, all Editor services). However, `FileService` and `UserSettingsService` are not sealed. If inheritance isn't intended, they should be sealed for consistency and to signal design intent.

---

## 10. Parallel Interface/Implementation Explosion

**Files:** `ITreeDataProvider.cs`, `ITreeDataProviderFactory.cs`, `ITreeLoader.cs`, `IStoryScopeFactory.cs`

**Severity:** Low

Several interfaces have exactly one implementation and no apparent need for substitution beyond testing:
- `IStoryScopeFactory` -> `StoryScopeFactory` (a trivial pass-through)
- `ITreeDataProviderFactory` -> `TreeDataProviderFactory`
- `ITreeLoader` -> `TreeLoader` (commented out -- possibly zero implementations)

When every class gets a 1:1 interface reflexively, it adds navigation overhead and cognitive load without providing real abstraction value. The interfaces that clearly earn their keep here are `ITreeDataProvider` (polymorphic with 4 implementations), `IDialogService`, `IFileService`, and `IApplicationStateService`.

---

## 11. TreeDataProviderFactory Depends on Concrete Types

**File:** `TreeDataProviderFactory.cs`

**Severity:** Low

The factory constructor takes four concrete provider types rather than `ITreeDataProvider` instances:

```csharp
public TreeDataProviderFactory(
    StructureTreeDataProvider structureProvider,
    CharactersTreeDataProvider charactersProvider,
    LocationsTreeDataProvider locationsProvider,
    FactsTreeDataProvider factsProvider)
```

This couples the factory to the concrete implementations, defeating the purpose of the `ITreeDataProvider` abstraction. DI keyed services or a dictionary-based approach would maintain the abstraction.

---

## 12. Event-Based Coupling Without Unsubscription Guard

**File:** `EditorLanguageClient.cs`

**Severity:** Low

`EditorLanguageClient` subscribes to three events on `_coordinator` in its constructor and unsubscribes in `Dispose()`. If `Dispose()` is not called (e.g., if the object is abandoned without being disposed), the coordinator holds references to the client, preventing garbage collection. The class implements `IDisposable` correctly, but there's no destructor/finalizer safety net, and consumers must be disciplined about disposal.

---

## Summary

| # | Smell | Severity | Files |
|---|-------|----------|-------|
| 1 | Duplicated flat-list providers | High | 3 Providers + StructureTreeDataProvider |
| 2 | Large Class (EditorContentLoader) | High | EditorContentLoader.cs |
| 3 | Duplicated async load pattern | Medium | EditorContentLoader.cs |
| 4 | Dead code (commented-out file) | Medium | TreeLoader.cs |
| 5 | Unused dependency (speculative) | Medium | StoryScopeFactory.cs |
| 6 | Bare catch blocks | Medium | FileService.cs, UserSettingsService.cs |
| 7 | Thread safety gap | Medium | ApplicationStateService.cs |
| 8 | Mutable interface property | Low-Medium | IMainWindowAccessor.cs |
| 9 | Inconsistent sealed declarations | Low | FileService.cs, UserSettingsService.cs |
| 10 | 1:1 interface/impl overhead | Low | Multiple interfaces |
| 11 | Factory depends on concretions | Low | TreeDataProviderFactory.cs |
| 12 | Event subscription leak risk | Low | EditorLanguageClient.cs |
