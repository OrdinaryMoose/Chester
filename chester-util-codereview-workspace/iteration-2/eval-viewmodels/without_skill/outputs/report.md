# Code Smell Review: ViewModels Directory

**Target:** `Story.Application.Desktop/ViewModels/` (9 files)

---

## 1. DslEditorViewModel.cs — God Class / Large Class

**Severity: High**

At ~498 lines with 20+ observable properties, 6+ commands, event subscriptions, navigation logic, composite editing, diagnostic management, import handling, dump commands, and content loading, this class has too many responsibilities. It is the single largest concentration of logic in the ViewModels layer.

Responsibilities that could be extracted:
- **Diagnostic presentation** (rows, selection, highlighting) — could be a `DiagnosticPanelViewModel`
- **Dump commands** (DumpSelectedEntity, DumpFullSolution) — could move to a dedicated `DiagnosticDumpViewModel`
- **Import logic** (ImportDslAsync, CanImportDsl, LastImportResult) — could be an `ImportViewModel`
- **Navigation/loading** (NavigateToEntity, ResetWorkspace, bookmark scrolling) — already partially delegated to `EditorContentLoader` but the orchestration still lives here

**Related smell:** Feature Envy — `NavigateToEntity` reaches into `_contentLoader`, `_compositeManager`, `CurrentCompositeDocument.Segments`, and multiple properties to coordinate a navigation. This orchestration logic is doing work that belongs in a dedicated navigation service or the content loader itself.

---

## 2. MainWindowViewModel.cs — Large Constructor / Too Many Dependencies

**Severity: Medium**

The constructor takes 11 parameters. This is a strong signal of too many responsibilities. The class handles:
- Menu commands (New, Open, Save, SaveAs, Exit)
- Window title management
- Recent files management
- DSL validation
- Startup initialization
- Composing child view models

The recent files management (RefreshRecentFilesCollection, OpenRecentFileAsync, the stale-entry pruning) is a self-contained responsibility that could be extracted to a `RecentFilesViewModel` or a service.

---

## 3. Duplicated Code: Open/New/OpenRecent Database Pattern

**Severity: Medium**

`NewAsync()`, `OpenAsync()`, and `OpenRecentFileAsync()` in `MainWindowViewModel.cs` all follow the same pattern:
1. Get a path
2. Call a database service method
3. Check `result.IsValid && !string.IsNullOrWhiteSpace(result.ValidatedPath)`
4. Either `SetCurrentDatabase` or show an error dialog

This validation-and-open logic is duplicated three times with minor variations. A single helper method like `TryOpenOrCreateDatabase(DatabaseOperationResult result, string path)` would eliminate the repetition.

---

## 4. TreePanelViewModel.cs — Duplicate Method: FindNodeById

**Severity: Low-Medium**

There are two `FindNodeById` methods in `TreePanelViewModel.cs`:
- Line 83: `FindNodeById(ObservableCollection<TreeNode> nodes, Guid entityId)` (static)
- Line 219: `FindNodeById(IEnumerable<TreeNode> nodes, Guid id)` (static)

These do the same thing with slightly different parameter types. One of them should be removed and the other generalized to accept `IEnumerable<TreeNode>`.

---

## 5. IconPanelViewModel.cs — Magic Number

**Severity: Low**

Line 29: `if (value < 0 || value > 3)` — the upper bound `3` is a magic number that implicitly encodes the number of `TreeMode` enum values minus one. If `TreeMode` gains a new member, this guard will silently accept or reject wrong values. This should reference `Enum.GetValues<TreeMode>().Length - 1` or similar, or validate by casting and checking `Enum.IsDefined`.

---

## 6. MainWindowViewModel.cs — Anonymous Lambda Event Handler (Memory Leak Risk)

**Severity: Medium**

Line 126-129:
```csharp
_workspaceState.PropertyChanged += (s, e) => {
    if (e.PropertyName == nameof(WorkspaceState.WindowTitle)) {
        OnPropertyChanged(nameof(WindowTitle));
    }
};
```

This anonymous lambda can never be unsubscribed. The `Dispose()` method unsubscribes `OnDatabaseChanged` but cannot unsubscribe this anonymous handler. If `WorkspaceState` outlives `MainWindowViewModel`, this creates a leak. It should be a named method so it can be unsubscribed in `Dispose()`.

---

## 7. Fire-and-Forget Async Calls

**Severity: Low-Medium**

`TreePanelViewModel` uses fire-and-forget `_ = RebuildTreeAsync()` in three places (constructor line 54, OnWorkspaceStateChanged line 61, OnDatabaseChanged line 103) and `_ = LoadChildrenAsync(n)` in the OnExpandRequested callbacks. While exceptions are caught inside those methods, there is no mechanism for the caller to know about failures, and if an unhandled exception somehow escapes the catch blocks, it would become an unobserved task exception. Consider whether at least logging the task's exception at the call site would be prudent.

---

## 8. ViewModelBase.cs — Empty Base Class

**Severity: Low**

`ViewModelBase` is an empty abstract class that simply extends `ObservableObject`. No view model in this directory actually inherits from it — they all inherit directly from `ObservableObject`. This is dead code. Either remove it or use it consistently.

---

## 9. TreeNodeViewModel — Not Actually a ViewModel

**Severity: Low**

`TreeNodeViewModel` is an immutable data class with no observable properties, no commands, and no behavior. It does not extend `ObservableObject` or `ViewModelBase`. The "ViewModel" suffix is misleading — it is a data transfer object or model. Meanwhile, the tree panel uses a separate `TreeNode` model class for actual tree display. The naming creates confusion about which type is the real view model.

---

## 10. SpanVisualizerViewModel.cs — Dead File

**Severity: Low**

The file contains only a comment saying the class "has been replaced by inline diagnostics in DslEditorViewModel." The file should be deleted entirely rather than left as a comment-only placeholder.

---

## 11. DslEditorViewModel — CurrentEntityKind Setter Missing OnPropertyChanged

**Severity: Low**

`CurrentEntityKind` (line 100-108) is a manually implemented property that calls `_languageClient.SetEntityKind(value)` but never calls `OnPropertyChanged(nameof(CurrentEntityKind))` and never checks for value equality before setting. Compare with `CurrentEntityId` (line 82-92) which does check equality and does call `OnPropertyChanged`. The inconsistency suggests the `CurrentEntityKind` setter is missing its property-changed notification, which would break any bindings to it.

---

## 12. EditorViewModel — Disposes Child It Doesn't Own

**Severity: Low-Medium**

`EditorViewModel.Dispose()` (line 115) calls `DslEditor.Dispose()`. Since `DslEditorViewModel` is injected via the constructor (presumably by DI as a singleton or scoped service), the `EditorViewModel` does not own its lifetime. If DI manages the lifetime, double-dispose could occur. Ownership of `DslEditorViewModel` disposal should be clarified.

---

## Summary

| # | Smell | File | Severity |
|---|-------|------|----------|
| 1 | God Class / Large Class | DslEditorViewModel.cs | High |
| 2 | Large Constructor (11 params) | MainWindowViewModel.cs | Medium |
| 3 | Duplicated database open/create pattern | MainWindowViewModel.cs | Medium |
| 4 | Duplicate FindNodeById methods | TreePanelViewModel.cs | Low-Medium |
| 5 | Magic number in bounds check | IconPanelViewModel.cs | Low |
| 6 | Unsubscribable anonymous event handler | MainWindowViewModel.cs | Medium |
| 7 | Fire-and-forget async | TreePanelViewModel.cs | Low-Medium |
| 8 | Unused empty base class | ViewModelBase.cs | Low |
| 9 | Misleading "ViewModel" name on DTO | TreeNodeViewModel.cs | Low |
| 10 | Dead file | SpanVisualizerViewModel.cs | Low |
| 11 | Missing OnPropertyChanged in setter | DslEditorViewModel.cs | Low |
| 12 | Disposing injected dependency | EditorViewModel.cs | Low-Medium |
