## Code Review: `Story.Application.Desktop/Services/`

**Smell Density: Significant**

Agents: Bloaters & Dispensables, Couplers & OO Abusers, Change Preventers.
Scope: `Story.Application.Desktop/Services/` (28 files, C# / Avalonia)

### Findings

- **Critical** | `TreeDataProviderFactory.cs:18-28` + `Providers/*.cs` + `EditorContentLoader.cs:221-227` | Adding a new TreeMode requires touching 5+ files (new provider, factory constructor + switch, EditorContentLoader.GetCategoryName, ITreeLoader, TreeMode enum) | The factory depends on four concrete provider types and uses a closed switch expression; no registration or convention-based resolution exists | smell: Shotgun Surgery + OCP/DIP violation | source: Change Preventers, Couplers & OO Abusers

- **Serious** | `Providers/CharactersTreeDataProvider.cs`, `LocationsTreeDataProvider.cs`, `FactsTreeDataProvider.cs` (entire files) | Three provider classes are structurally identical — same constructor, same LoadRootAsync/LoadRootInternalAsync skeleton, same ToDesktopNode helper, same empty LoadChildrenAsync — differing only in the `.Where()` filter predicate (lines 40-41 in each) | A single generic or base class parameterized by `TreeNodeKind` filter would eliminate ~120 lines of duplication | smell: Duplicate Code | source: Bloaters & Dispensables

- **Serious** | `EditorContentLoader.cs:1-353` | Class holds three unrelated responsibilities: text resolution + caching (lines 95-146), navigation lifecycle management (lines 150-216), and three async content loading strategies (lines 231-352); each evolves independently | The three private load methods also duplicate identical CTS lifecycle boilerplate (create, assign, Task.Run, try/catch/finally with Dispatcher marshal and disposal) | smell: Divergent Change + Large Class + Duplicate Code | source: Bloaters & Dispensables, Change Preventers

- **Serious** | `StoryScopeFactory.cs:12,20-27` | Class injects `IApplicationStateService` (line 12) which is never read; `CreateScope()` (line 21) delegates entirely to `_scopeFactory.CreateScope()` with zero added behavior; comment on lines 22-25 acknowledges the unused dependency | The abstraction `IStoryScopeFactory` adds no value over injecting `IServiceScopeFactory` directly | smell: Middle Man + Dead Field | source: Couplers & OO Abusers, Bloaters & Dispensables

- **Serious** | `FileService.cs:22,40` | `OpenFileAsync` and `SaveFileAsync` reach through `_windowAccessor.Current.StorageProvider` to invoke picker methods, coupling file operations to the Avalonia window's concrete `StorageProvider` rather than an injected storage abstraction | smell: Feature Envy / DIP violation | source: Couplers & OO Abusers

- **Serious** | `TreeDataProviderFactory.cs:13-16` | Constructor depends on four concrete types (`StructureTreeDataProvider`, `CharactersTreeDataProvider`, `LocationsTreeDataProvider`, `FactsTreeDataProvider`) rather than `ITreeDataProvider` instances keyed by mode | smell: DIP violation | source: Couplers & OO Abusers
  > Subsumed by the Critical Shotgun Surgery finding above but listed separately because the concrete-type coupling is independently fixable.

- **Serious** | `DiagnosticDumpService.cs:92-93,163-164` | Diagnostic formatting string `"[{severity}] {code}: {message} (offset {startOffset}, length {length}, producer {producer})"` is duplicated in both `DumpEntityAsync` and `DumpSolutionAsync` | smell: Duplicate Code + Shotgun Surgery | source: Change Preventers, Bloaters & Dispensables

- **Minor** | `TreeLoader.cs:1-164` | Entire file is commented out — 164 lines of dead code serving no runtime purpose | smell: Dead Code | source: Bloaters & Dispensables

- **Minor** | `ITreeLoader.cs:1-37` | Interface for the commented-out `TreeLoader` still exists as a live contract with four method signatures; no active implementation exists in scope | smell: Dead Code (Lazy Class) | source: Bloaters & Dispensables

- **Minor** | `DialogService.cs:23,31,41` | All three public methods repeat `var window = _windowAccessor.Current ?? throw new InvalidOperationException(...)` — a trivial extraction to a private helper | smell: Duplicate Code | source: Bloaters & Dispensables

- **Minor** | `IStoryScopeFactory.cs` + `StoryScopeFactory.cs` | Abstraction layer with exactly one consumer and zero behavioral additions over `IServiceScopeFactory` | smell: Speculative Generality | source: Bloaters & Dispensables

### Risk Rationale

- The tree-mode Shotgun Surgery is the dominant structural risk. Every new narrative entity type forces coordinated changes across 5+ files with no compile-time safety net ensuring all touch-points are updated. This is the most likely source of future defects in this scope.
- EditorContentLoader's three-responsibility convergence means unrelated feature work (caching policy changes, new load strategies, navigation behavior) will produce merge conflicts and increase the risk of regressions in sibling concerns.
- The flat-provider duplication (Characters, Locations, Facts) is a maintenance tax that compounds the Shotgun Surgery — each duplicated file is another touch-point when the tree-loading contract changes.
