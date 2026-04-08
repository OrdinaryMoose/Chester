## Code Review: `Story.Core.Domain/`

**Smell Density: Significant**

Agents: Bloaters & Dispensables, Couplers & OO Abusers, Change Preventers.
Scope: `Story.Core.Domain/` (42 files, C# / .NET 10)

### Findings

- **Critical** | `Entities/Arc.cs:58-64`, `Character.cs:45-50`, `Choice.cs:63-68`, `Condition.cs:67-72`, `Effect.cs:65-70`, `Fact.cs:57-62`, `Location.cs:43-48`, `Moment.cs:72-77`, `Outcome.cs:78-83`, `Scene.cs:57-62`, `Segment.cs:70-75`, `Trigger.cs:87-92` | Clone() base-property copying duplicated in all 12 EntityBase subclasses | Every subclass manually copies TagIds and AuthoredFacts with identical 6-line blocks. `EntityBase.CloneBaseProperties()` (EntityBase.cs:82-97) exists to do exactly this but is never called by any EntityBase subclass. Adding a new base field requires synchronized updates to all 12 files. | smell: Duplicate Code + Shotgun Surgery | source: Bloaters & Dispensables, Change Preventers, Couplers & OO Abusers
  > `CloneBaseProperties()` is called correctly by `ConversationElementBase` subclasses (ConversationNode, ConversationOption, ConversationResponse), proving the pattern works. The EntityBase subclasses simply never adopted it. Blast radius for a new base field: 12 files.

- **Serious** | `Validation/Structural/Checks/StoryArcStructuralCheck.cs:60-83`, `StoryConversationStructuralCheck.cs:51-76,96-121`, `StoryConversationNodeStructuralCheck.cs:51-76,96-121`, `StoryConversationResponseStructuralCheck.cs:40-65`, `StoryMomentStructuralCheck.cs:76-101,133-158`, `StoryOutcomeStructuralCheck.cs:72-96`, `StorySegmentStructuralCheck.cs:72-95`, `StorySceneStructuralCheck.cs:61-85`, `StoryTriggerStructuralCheck.cs:59-83,102-126`, `StoryConditionStructuralCheck.cs:70-93` | Guid-list validation pattern (empty-item check + duplicate detection) repeated ~14 times | Each structural check that validates a `List<Guid>` property uses the same two code blocks: a for-loop checking for `Guid.Empty` items, and a three-collection (`seen`/`duplicateSet`/`duplicates`) duplicate-detection pattern. Only the `DiagnosticCode` tokens differ. The codebase already has `TagIdsValidator` and `AuthoredFactsValidator` as reusable utilities, proving the extraction pattern works. | smell: Duplicate Code + Shotgun Surgery | source: Bloaters & Dispensables, Change Preventers
  > Blast radius for a logic change (e.g., reporting duplicate indices): ~14 code blocks across 10 files. A single `GuidListValidator.Validate()` utility could replace all instances.

- **Serious** | All 17 files in `Validation/Structural/Checks/` | Adding a new base-level validation requires updating every structural check | Every check ends with identical `TagIdsValidator.Validate()` and `AuthoredFactsValidator.Validate()` call pairs. There is no base-class `Check()` that runs common validations; each concrete check is responsible for remembering to include them. | smell: Shotgun Surgery (SRP/OCP) | source: Change Preventers
  > Blast radius: 17 files for one new base validation concern. A `RunBaseValidations()` method in the base class (or a composed validation pipeline) would centralize this.

- **Serious** | `Entities/EntityBase.cs:15-98`, `Entities/ConversationElementBase.cs:19-98` | Two parallel base classes with near-identical contracts | `EntityBase` (Id, RefName, Notes, TagIds, AuthoredFacts, CloneBaseProperties) and `ConversationElementBase` (Id, Slug, Notes, TagIds, AuthoredFacts, CloneBaseProperties) share the same fields under different names (RefName vs Slug). Both have identical constructor logic, identical `CloneBaseProperties()` implementations, and identical collection handling. They share no common interface or base. | smell: Alternative Classes with Different Interfaces (ISP) | source: Bloaters & Dispensables, Couplers & OO Abusers
  > This forces validation to use different field path constants (`EntityBaseRefName` vs `ConversationElementSlug`, `EntityBaseTagIds` vs `ConversationElementTagIds`) for semantically identical checks.

- **Serious** | `Validation/Structural/Checks/StoryConversationStructuralCheck.cs:18-242` | Single 243-line Check() method validates 7+ distinct concerns | ParticipantIds (null, empty items, duplicates), ConditionIds (empty items, duplicates), EntryNodeId, WorldChoiceId, Nodes (null, empty, null items, duplicate slugs, terminal node), TagIds, AuthoredFacts — all in one method. | smell: Divergent Change (Long Method) | source: Change Preventers

- **Serious** | `Validation/Structural/Checks/StoryTriggerStructuralCheck.cs:17-176` | Single 176-line Check() method validates 6+ distinct concerns | ConditionIds (null, empty, items, duplicates), EffectIds (items, duplicates), ToMomentId, output-requirement rule, CooldownSeconds, TagIds, AuthoredFacts — all in one method. | smell: Divergent Change (Long Method) | source: Change Preventers

- **Serious** | `Entities/ConversationLine.cs:18` | ConversationLine breaks the type hierarchy | ConversationLine is a plain sealed class with its own Id and Clone(), not extending ConversationElementBase or EntityBase. It lacks Slug, TagIds, AuthoredFacts. Used in the same compositional patterns as other conversation elements but cannot participate in generic entity operations (tagging, fact association, unified identity). | smell: DIP violation / structural gap | source: Couplers & OO Abusers
  > `StoryConversationLineStructuralCheck` inherits `StoryStructuralCheckBase<ConversationLine>` and validates it through the same framework, but ConversationLine lacks the metadata contract other entities share. If intentional, this is undocumented.

- **Minor** | `Entities/ConversationNode.cs:84-101`, `ConversationOption.cs:40-52`, `ConversationResponse.cs:72-87` | Clone() sets Id/Slug in initializer then CloneBaseProperties() overwrites Slug | ConversationElementBase subclasses set Slug in the object initializer (e.g., ConversationNode.cs:88), then call CloneBaseProperties() (line 101) which writes Slug again. Harmless but indicates unclear ownership of cloning responsibility. | smell: Refused Bequest | source: Couplers & OO Abusers

- **Minor** | `Entities/Tag.cs:6-11` | Tag is 11 lines with only Id and Name | No base class, no Clone(), no validation, no equality. Notably thinner than every other entity. | smell: Lazy Class | source: Bloaters & Dispensables

- **Minor** | `Entities/AuthoredFactEntry.cs:10-18` | Value object with no behavior | Two properties (FactId, Value), no Clone(), no value-equality. Its lack of Clone() contributes to the duplication in finding #1 — every Clone() method manually projects AuthoredFactEntry fields. | smell: Lazy Class | source: Bloaters & Dispensables

- **Minor** | `Entities/EntityBase.cs:58-59` | Parameterized constructor exists solely for tests | Comment on line 58: "This constructor is only used by the test class." Infrastructure added for test convenience rather than domain need. | smell: Speculative Generality | source: Bloaters & Dispensables

- **Minor** | `Entities/ConversationNode.cs:45`, `Entities/Condition.cs:28,42` | Unresolved TODO comments on design questions | `ConversationNode.cs:45`: "todo: how are conversations terminated?" `Condition.cs:28`: todo about predicate DSL. `Condition.cs:42`: todo about ReferencedFactIds usage. Open design questions left as comments. | smell: Comments as Crutch | source: Bloaters & Dispensables

- **Minor** | Across all entity files | Extensive use of `List<Guid>` for typed references | ConditionIds, EffectIds, ParticipantIds, TagIds all share the same `List<Guid>` type. No compile-time distinction between a condition reference and an effect reference. | smell: Primitive Obsession | source: Couplers & OO Abusers

- **Minor** | Entity + StructuralCheck pairs across all types | 1:1 parallel hierarchy between entities and structural checks | Each entity has exactly one structural check class. Adding a new entity type requires creating both. Managed through the generic base class but still a coordination cost. | smell: Parallel Inheritance Hierarchies | source: Change Preventers

- **Minor** | `Entities/Effect.cs:28` | Effect.Operation is an unvalidated string discriminator | Unlike Fact.Type (validated against `FactTypeVocabulary`), Effect.Operation has no vocabulary check. Extending or constraining the operation set requires scattered knowledge. | smell: OCP concern | source: Change Preventers

### Risk Rationale

- The Clone() duplication and validation pattern duplication share a common root cause: reusable infrastructure exists (CloneBaseProperties, TagIdsValidator) but is inconsistently adopted. The fix is straightforward — use the utilities that already exist and extract one more (GuidListValidator). This makes the Critical and top Serious findings mechanical to address.
- The parallel EntityBase / ConversationElementBase hierarchies and the ConversationLine escape from the hierarchy are structural decisions that compound the maintenance cost. Any cross-cutting domain change (new metadata field, new validation concern) fans out across both hierarchies and all their subclasses. These are harder to address because they require a design decision about whether to unify the hierarchies.
- The large single-method validation checks (Conversation at 243 lines, Trigger at 176 lines) will become increasingly painful as the domain model grows and new validation rules are added. Extracting shared validation into base-class methods or composable validators would reduce both duplication and per-check complexity.
