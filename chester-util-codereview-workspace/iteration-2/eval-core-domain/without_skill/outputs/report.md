# Code Smell Review: Story.Core.Domain

**Scope:** `/home/mike/RiderProjects/StoryDesigner/Story.Core.Domain/`  
**Files reviewed:** 22 entity files, 17 structural check files, 1 semantic rule file

---

## 1. Massive Clone Boilerplate Duplication (Bloater / Duplicated Code)

**Severity: High**  
**Affected files:** Every `EntityBase` subclass (Arc, Character, Choice, Condition, Conversation, Effect, Fact, Location, Moment, Outcome, Scene, Segment, Trigger)

Every entity's `Clone()` method manually copies the base properties (`Id`, `RefName`, `Notes`, `TagIds`, `AuthoredFacts`) with identical code. The base class already provides `CloneBaseProperties()`, but **none of the EntityBase subclasses use it**. Instead, each one inlines the same 8-line block:

```csharp
Id = this.Id,
RefName = this.RefName,
Notes = this.Notes,
TagIds = this.TagIds is not null
    ? new List<Guid>(this.TagIds)
    : new List<Guid>(),
AuthoredFacts = this.AuthoredFacts is not null
    ? this.AuthoredFacts.Select(e => new AuthoredFactEntry { FactId = e.FactId, Value = e.Value }).ToList()
    : new List<AuthoredFactEntry>(),
```

This is duplicated verbatim across 13 files. Meanwhile, `CloneBaseProperties()` exists in the base class and is only used by `ConversationElementBase` subtypes. Either all subclasses should call the helper or the helper should not exist.

---

## 2. CloneBaseProperties Exists but Is Bypassed (Dead Code / Inconsistency)

**Severity: Medium**  
**Affected files:** `EntityBase.cs` (lines 82-97), all EntityBase subclass Clone() methods

`EntityBase.CloneBaseProperties()` is defined but never called from any `EntityBase` subclass. The `ConversationElementBase` hierarchy does use its own `CloneBaseProperties()`, but the `EntityBase` version is effectively dead code as currently used. This creates a maintenance trap: if `EntityBase` gains a new field, `CloneBaseProperties()` gets updated but all 13 Clone() methods stay stale.

---

## 3. Defensive Null Checks on Non-Nullable Collections (Unnecessary Complexity)

**Severity: Medium**  
**Affected files:** All Clone() methods, `EntityBase.CloneBaseProperties()`

Every Clone method guards `TagIds` and `AuthoredFacts` with `is not null` checks, even though:
- The constructors always initialize them to non-null empty lists
- The properties are declared as non-nullable `List<Guid>` / `List<AuthoredFactEntry>`
- No code path sets them to null

This is cargo-cult defensiveness. The null checks obscure the actual invariant (these are always non-null) and add noise to every Clone method. If nullability truly needs guarding, it should be enforced once in a setter or the base Clone helper, not repeated 13+ times.

---

## 4. Parallel Inheritance Hierarchies with Duplicated Structure (Parallel Inheritance / Refused Bequest)

**Severity: Medium**  
**Affected files:** `EntityBase.cs`, `ConversationElementBase.cs`

`ConversationElementBase` is a near-clone of `EntityBase` with fields renamed:
- `EntityBase.RefName` becomes `ConversationElementBase.Slug`
- Both have `Id`, `Notes`, `TagIds`, `AuthoredFacts`
- Both have `CloneBaseProperties()` with identical logic
- Both have parameterless constructors with identical initialization

The only structural difference is the property name (`RefName` vs `Slug`). This creates a parallel hierarchy where `ConversationNode`, `ConversationOption`, and `ConversationResponse` cannot share code or polymorphism with the main entity hierarchy. If a field is added to "all entities," it must be added to both base classes independently.

---

## 5. Guid-List Validation Pattern Copied Verbatim Across 17 Structural Checks (Duplicated Code)

**Severity: High**  
**Affected files:** All files in `Validation/Structural/Checks/`

The pattern for validating a `List<Guid>` field (null check, empty-element scan, duplicate detection with three HashSets) is copy-pasted across every structural check that validates a Guid list. The same ~25-line block appears for `ConditionIds`, `EffectIds`, `ParticipantIds`, `ReferencedFactIds`, etc.

For example, this exact structure appears in `StoryArcStructuralCheck`, `StoryConditionStructuralCheck`, `StoryConversationStructuralCheck`, `StoryConversationNodeStructuralCheck`, `StoryConversationResponseStructuralCheck`, `StoryMomentStructuralCheck`, `StoryOutcomeStructuralCheck`, `StorySegmentStructuralCheck`, and `StoryTriggerStructuralCheck`:

```csharp
var seen = new HashSet<Guid>();
var duplicateSet = new HashSet<Guid>();
var duplicates = new List<Guid>();
foreach (var id in list) {
    if (id == Guid.Empty) continue;
    if (!seen.Add(id) && duplicateSet.Add(id)) duplicates.Add(id);
}
foreach (var duplicate in duplicates) { items.Add(Error(...)); }
```

`TagIdsValidator` and `AuthoredFactsValidator` already exist as reusable validators. The same extraction should be done for generic Guid-list validation (null, empty items, duplicates).

---

## 6. Stringly-Typed Domain Concepts (Primitive Obsession)

**Severity: Medium**  
**Affected files:** `Fact.cs`, `Effect.cs`, `Condition.cs`

Several domain-critical values are plain strings where stronger typing would prevent errors:

- **`Fact.Type`** is `string` with allowed values `"bool"`, `"int"`, `"string"`, `"float"` -- this is a classic case for an enum. The validation layer already checks against `FactTypeVocabulary.AllowedTypes`, confirming the closed set.
- **`Effect.Operation`** is `string` described as "Set, Increment, Toggle, EmitSignal" -- another closed vocabulary that would benefit from an enum or at least a constants class.
- **`Effect.Payload`** is `string` described as "often JSON or a simple value" -- no structural validation exists; it is passed around as opaque text.
- **`Condition.Predicate`** is a free-form DSL string with a TODO comment acknowledging the design is unresolved.

---

## 7. ConversationLine Does Not Inherit from ConversationElementBase (Inconsistent Hierarchy)

**Severity: Low-Medium**  
**Affected files:** `ConversationLine.cs`, `ConversationElementBase.cs`

`ConversationLine` is a standalone class with its own `Id`, no `Slug`, no `TagIds`, no `AuthoredFacts`, and a non-override `Clone()` method. Yet it lives alongside `ConversationNode`, `ConversationOption`, and `ConversationResponse`, all of which extend `ConversationElementBase`.

This means `ConversationLine` cannot participate in any generic conversation-element processing (validation dispatch, bulk tagging, etc.). If this is intentional because lines are value-object-like, the doc comment on `ConversationElementBase` should clarify the boundary. Currently it reads as an oversight.

---

## 8. Tag Entity Is Anemic and Inconsistent (Data Class / Refused Bequest)

**Severity: Low**  
**Affected file:** `Tag.cs`

`Tag` does not extend `EntityBase`, has no validation, no `Clone()`, no XML doc on the class, and uses a different namespace style (brace-wrapped `namespace Story.Core.Domain.Entities { }` vs file-scoped). It is a plain data class with just `Id` and `Name`. Every other entity in the project is a sealed class with rich doc comments and clone support. `Tag` stands out as incomplete or vestigial.

---

## 9. AuthoredFactEntry Lacks Value Equality / Clone (Data Class)

**Severity: Low**  
**Affected file:** `AuthoredFactEntry.cs`

`AuthoredFactEntry` is described as a "domain value type" but:
- It has no `Equals`/`GetHashCode` override, so collections of it cannot be compared for equality.
- It has no `Clone()` method; cloning is done inline everywhere via `new AuthoredFactEntry { FactId = e.FactId, Value = e.Value }`.
- It is a mutable class (`set` on both properties), not a record or readonly struct.

If it is truly a value type, making it a `record` would give correct equality semantics and eliminate the inline clone pattern.

---

## 10. `required` Keyword Used Inconsistently (Inconsistent Style)

**Severity: Low**  
**Affected files:** Multiple entity files

Some properties are marked `required` while structurally identical properties on sibling entities are not:

| Entity | Property | Has `required`? |
|--------|----------|-----------------|
| Choice | MomentId | Yes |
| Location | SceneId | Yes |
| Moment | SceneId | Yes |
| Arc | EntryMomentId | No |
| Trigger | ConditionIds | No |
| Conversation | ConditionIds | No |

All of these are semantically required fields initialized to `Guid.Empty` or empty lists in the parameterless constructor. The use of `required` appears driven by when the file was written rather than by a consistent rule.

---

## 11. Structural Check Classes Are Stateless but Instantiated (Dispensable / Speculative Generality)

**Severity: Low**  
**Affected files:** All 17 structural check classes

Every structural check is a `sealed class` with no fields, no constructor, and a single method. These could be static methods or, if polymorphism is needed for dispatch, they could be singletons. Allocating instances of stateless classes is not expensive, but it is a design smell that suggests the class hierarchy may be over-engineered for what is effectively a function registry.

---

## 12. Commented-Out Code in EntityBase and Clone Methods

**Severity: Low**  
**Affected files:** `EntityBase.cs` (line 85: `//target.Id = Id;`), `Arc.cs` (line 55: `//base properties`)

The commented-out `target.Id = Id` line in `CloneBaseProperties` suggests uncertainty about whether clones should share the original Id. Most Clone() methods in subclasses *do* copy `Id` explicitly. This inconsistency between what the helper does (skips Id) and what every caller does (copies Id) would be a bug if anyone ever started using `CloneBaseProperties`.

---

## 13. TODO Comments Indicating Unresolved Design

**Severity: Informational**  
**Affected files:**
- `Condition.cs` line 28: `//todo: Condition.Predicate DSL string system...`
- `Condition.cs` line 42: `//todo: How ReferencedFactIds are these used...`
- `ConversationNode.cs` line 45: `//todo: how are conversations terminated?`
- `ConversationElementBase.cs` line 77: `//todo: add slug name validation`

These indicate unresolved design questions baked into the domain model. They are not code smells per se, but they mark areas where the model may change shape, which amplifies the cost of the duplication smells above.

---

## Summary

| # | Smell | Category | Severity |
|---|-------|----------|----------|
| 1 | Clone boilerplate duplicated across 13 entities | Duplicated Code | High |
| 2 | CloneBaseProperties defined but bypassed | Dead Code | Medium |
| 3 | Defensive null checks on never-null collections | Unnecessary Complexity | Medium |
| 4 | Parallel inheritance (EntityBase / ConversationElementBase) | Parallel Hierarchy | Medium |
| 5 | Guid-list validation pattern copied across 17 checks | Duplicated Code | High |
| 6 | Stringly-typed Fact.Type, Effect.Operation, Condition.Predicate | Primitive Obsession | Medium |
| 7 | ConversationLine outside ConversationElementBase hierarchy | Inconsistent Hierarchy | Low-Medium |
| 8 | Tag is anemic and inconsistent with other entities | Data Class | Low |
| 9 | AuthoredFactEntry is mutable class posing as value type | Data Class | Low |
| 10 | `required` keyword applied inconsistently | Inconsistent Style | Low |
| 11 | Stateless check classes instantiated as objects | Dispensable | Low |
| 12 | Commented-out Id copy in CloneBaseProperties | Dead Code | Low |
| 13 | Unresolved TODO comments in domain model | Informational | Info |
