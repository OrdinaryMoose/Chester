---
status: Draft
last_reviewed: 2026-05-10
related_docs: [00-glossary, 03-architecture, 04-engine-spec, 06-interface-spec]
related_adrs: [0003, 0004, 0005, 0007, 0009, 0010, 0014]
---

# Domain Specification

This document specifies the Domain layer: the proof concepts, schemas, policies, lifecycle, authority enforcement, and rendering. The Domain is the system's identity. It is the largest specification because the Domain is where the system's value lives.

The Domain consumes the Engine through the boundary contract (Architecture §4.1) and exposes typed operations to the Interface (Architecture §4.2).

---

## 1. Module overview

The Domain is organized into modules with clear responsibilities:

- **Schema** (§3): Element type catalogue, field definitions, closed-set enums, element-to-engine translation
- **Mutations** (§4): The operation verbs (open, add, revise, withdraw, ratify, present, go) with pre/post conditions
- **Authority** (§5): Consent validation, source enforcement, ratification semantics
- **Lifecycle** (§6): Round counter, phase transitions, body advancement, two-yes flag management
- **Closure Policy** (§7): The closure conditions as engine queries
- **Integrity Policy** (§7.5): Per-check engine queries
- **Friction Policy** (§8): Friction shape detection and disposition
- **Restructuring** (§9): Submission material → typed elements pipeline
- **Render** (§10): Markdown, structured-proof, Datalog projection, closing argument
- **Counterfactual** (§11): Mechanical collapse_test verification

Modules collaborate but have separable responsibilities. Tests target individual modules.

---

## 2. Domain ↔ Engine translation principle

Every proof concept is expressible as Engine facts and rules. The Domain owns the translation; the Engine is unaware. This principle organizes the spec.

For each element category and concept, the spec names:
- The Engine predicate(s) used
- The shape of facts asserted
- The shape of rules defined
- How approval (ratification) gates the concept

This translation table is the Domain's most important design artifact. Once fixed, integrity rules, closure conditions, and renderers all read from it.

---

## 3. Schema

### 3.1 EVIDENCE

**Purpose:** Factual proposition about codebase / world / record. Axiomatic within the proof.

**Required fields:**
- `id`: string of form `evid_N` (e.g., `evid_3`)
- `statement`: non-empty string
- `source`: one of `codebase`, `industry`, `prior-record`, `agent-derivation` (closed enum, NOT `designer`)

**Optional fields:**
- `grounding`: array of supporting element IDs (typically empty for Evidence)
- `restructuring_action_label`: one of the action labels (§6.2)

**Engine representation:**
- Fact: `evidence(EvId, Statement, Source)`
- Metadata fact: `evidence_action_label(EvId, ActionLabel)` (when applicable)
- No rule needed; Evidence is a base fact.

**Authority constraint:** `source` must NOT be `designer`. If an agent attempts to assert Evidence with source `designer`, the operation is refused with `INVALID_SOURCE`.

### 3.2 RULE

**Purpose:** Designer-asserted normative constraint. The inferential framework's warrant.

**Required fields:**
- `id`: `rule_N`
- `statement`: non-empty string
- `source`: must be `designer`

**Optional fields:**
- `modality`: `obligation` or `prohibition` (recommended addition; see ADR-0004)
- `covers`: array of Concern IDs explicitly declared as covered by this Rule

**Engine representation:**
- Fact: `rule_decl(RuleId, Statement)`
- Modality fact: `rule_modality(RuleId, Modality)` (when supplied)
- Coverage fact: `rule_covers(RuleId, ConcernId)` (when supplied)
- No rule needed; Rules are base facts.

**Authority constraint:** Source must be `designer`. The consent token's source on the operation must be `designer` or `agent-proposed-designer-confirmed`.

### 3.3 PERMISSION

**Purpose:** Designer-granted relief from a specific Rule.

**Required fields:**
- `id`: `perm_N`
- `statement`: non-empty string
- `source`: must be `designer`
- `relieves`: a RULE ID

**Optional fields:**
- `scope_constraint`: prose describing the conditions of relief

**Engine representation:**
- Fact: `permission(PermId, Statement, RuleId)`
- Optional: `permission_scope(PermId, ScopeConstraint)`

**Validation:** `relieves` must reference an existing Rule. The Domain validates this before assertion.

### 3.4 PROPOSITION

**Purpose:** Claim that must hold for design soundness.

**Required fields:**
- `id`: `prop_N`
- `statement`: non-empty string
- `grounding`: non-empty array of element IDs (Evidence, Rules, Permissions, or other Propositions)
- `collapse_test`: prose stating what fails if this Proposition is removed
- `reasoning_chain`: prose IF/THEN inference
- `inference_pattern`: one of the closed-set patterns (§3.4.1) — required; the implementation enforces this via `closedEnumFields` and the impl descriptor's `requiredFields` already includes it

**Optional but encouraged:**
- `rejected_alternatives`: array of `{statement, rejection_reason}` objects

**Engine representation:**
- The Proposition is a *rule*, not a fact. The rule's head is `proposition(PropId, Statement)`; the body is the grounding chain plus an `approved` literal:

```
proposition(PropId, Statement) :- 
  evidence(E1, _, _),     -- one body atom per Evidence in grounding
  rule_decl(R1, _),       -- one per Rule
  permission(P1, _, _),   -- one per Permission
  proposition(N2, _),            -- one per Proposition (recursive grounding)
  approved(PropId, _, _).   -- approval gate
```

- Metadata facts:
  - `collapse_test(PropId, Text)`
  - `reasoning_chain(PropId, Text)`
  - `inference_pattern(PropId, Pattern)`
  - `rejected_alternative(PropId, AltStatement, Reason)` — one per alternative

**Why a rule, not a fact:** The forward-solve paradigm makes Propositions *derivable* rather than asserted. A Proposition enters the proof's derived set only when its grounding is satisfied AND it is approved. Revoking approval automatically retracts the Proposition; cascading consequences follow.

### 3.4.1 Inference patterns (closed set)

- `grounds_imply_conclusion`: ordinary modus-ponens-flavored inference from facts to claim
- `rule_applies_to_case`: a Rule's prohibition or obligation extends to this Proposition's case
- `permission_licenses_relaxation`: an exception to a Rule that this Proposition depends on
- `definition_substitution`: the Proposition restates or specializes a Definition
- `proposition_composition`: the Proposition follows from other Propositions (composition through the proposition layer)

The agent must pick one when asserting a Proposition. The pattern is rendered in the structured-proof view as the inference move's name.

### 3.5 RISK

**Purpose:** Identified hazard attached to specific elements; the proof's rebuttal/reservation layer.

**Required fields:**
- `id`: `risk_N`
- `statement`: non-empty string
- `basis`: array of element IDs the risk attaches to

**Engine representation:**
- Fact: `risk(RiskId, Statement, Severity)`
- For each basis element: `risk_basis(RiskId, ElementId)`

### 3.6 RESOLUTION

**Purpose:** Proposition addressing a specific Concern.

**Required fields:**
- `id`: `reso_N`
- `statement`: non-empty string
- `problem_anchor`: a CONCERN id
- `grounding`: array of Proposition ids (typically; may include Rules)

**Optional:**
- `ratification`: `null` until ratified, then an object `{text, round}`

**Engine representation:**
- Like Propositions, Resolutions are rules:

```
addresses(ResoId, ConcernId, Ratification) :- 
  proposition(N1, _),
  proposition(N2, _),
  approved(ResoId, Ratification, _).
```

- The `addresses/3` predicate is what closure conditions query for coverage.

### 3.7 FRICTION

**Purpose:** Tension between two existing elements.

**Required fields:**
- `id`: `fric_N`
- `friction_shape`: one of (§3.7.1)
- `anchor_a`, `anchor_b`: existing element IDs
- `disposition`: one of (§3.7.2)

**Optional:**
- `statement`: prose description

**Engine representation:**
- Fact: `friction(FricId, Shape, AnchorA, AnchorB, Disposition)`

**Detection rules:** Friction shapes are also detected by Engine rules (§8). When a detection rule fires for an anchor pair not yet covered by an existing Friction (active or withdrawn), a friction *hint* is surfaced for the agent.

### 3.7.1 Friction shapes (closed set)

- `proposition-proposition-opposing-pull`: two Propositions exert opposing claims
- `resolution-rule-conflict`: a Resolution addresses something a Rule prohibits or restricts
- `permission-risk-linkage`: a Permission relieves a Rule that a Risk grounds in
- `concern-concern-competition`: two Concerns compete for the same resolution surface

### 3.7.2 Friction dispositions (closed set)

- `lived-with`: the tension is acknowledged and accepted as a design property
- `relieved-by-exception`: a new Permission addresses the tension
- `dissolved-by-revision`: a revision to one anchor removed the tension (terminal)
- `dissolved-by-scope-cut`: the tension was eliminated by removing one anchor (terminal)
- `not-really-friction`: the friction claim is retracted (terminal)

Terminal dispositions transition the friction to `withdrawn` status automatically.

### 3.8 CONCERN

**Purpose:** A problem the design must address.

**Required fields:**
- `id`: `cern_N`
- `label`: non-empty string

**Optional:**
- `description`: extended prose

**Engine representation:**
- Fact: `concern(ConcernId, Label, Description)`
- Status fact: `concern_status(ConcernId, Status)` where Status ∈ {`draft`, `ratified`, `withdrawn`}

A Concern enters the proof's "covered" predicate only when both ratified and addressed by a ratified Resolution.

### 3.9 DEFINITION

**Purpose:** Vocabulary fixing for the proof.

**Required fields:**
- `id`: `defn_N`
- `canonical_name`: non-empty string
- `definition`: non-empty string

**Optional:**
- `aliases`: array of strings
- `sense_constraints`: prose limiting the definition's applicability
- `status`: `draft` | `ratified` | `withdrawn` | `deprecated`
- `revision`: integer
- `history`: array of prior versions

**Engine representation:**
- Fact: `definition(DefnId, CanonicalName, Definition)`
- Alias facts: one per alias: `definition_alias(DefnId, AliasName)`
- Status: `definition_status(DefnId, Status)`

### 3.10 Withdrawal

Withdrawal is not a category but a status transition with a disposition tag.

**Withdrawal Dispositions (closed set):**
- `consolidated`: merged with another element
- `superseded`: replaced by a newer element
- `found-redundant`: provided no marginal value
- `found-incorrect`: claim was wrong
- `scope-removed`: scope cut eliminated need
- `unclassified`: sentinel (default for backfilled records, never an explicit choice)

**Engine representation:**
- Status fact: `element_status(ElementId, Status, Disposition, WithdrawnInRound)`
- Active query: `active_element(EId) :- element_status(EId, active, _, _).`
- Withdrawn query: `withdrawn_element(EId, Disposition) :- element_status(EId, withdrawn, Disposition, _).`

When an element is withdrawn, its base facts and rules remain in the Engine; the status fact gates whether other rules see it. Cascade follows automatically: rules that required the now-withdrawn element no longer fire.

---

## 4. Lifecycle

### 4.1 Round counter

A monotonic integer incremented on each batch of mutations. `state.round`.

- Round 0: post-open, before any mutations
- Round N+1: increments when any successful mutation operation completes

The round is a Domain concept; in the Engine it appears as a fact argument on the `current_round/1` predicate (singleton, retracted-and-reasserted on increment).

### 4.2 Phase transition round

The round at which the proof transitions from initial open to active mutation. `state.phaseTransitionRound`.

By convention, this is set at round 1 (the first mutation after open). It exists so that closure conditions can require "at least one revision after phase transition" — a body advancement signal that distinguishes initial population from subsequent refinement.

### 4.3 Body advancement

The signal that real work occurred between two states (adds, revisions, withdrawals — not mere ratification flips). Computed as the symmetric difference between consecutive Engine fact sets, projected onto load-bearing predicates.

```
advanced(Round) :- 
  exists prior_round(R0),
  prior_round(R0) < Round,
  delta_facts(R0, Round) > 0.
```

Body advancement is an integrity-zero condition for closure (§7.4).

### 4.4 Operation log

Append-only sequence of every mutation. `state.operationLog`.

Each entry: `{round, op, entityId, type, consent, changedFields, provenance}`.

The log is Domain-owned. The Interface persists it as part of the state file. The Engine never sees the log.

### 4.5 Phase computation

The phase is *derived*, not stored. A query against the Engine produces the current phase:

- `Empty`: no `problem_statement` fact
- `Concerns Enumeration`: at least one concern, but some Concern has `concern_status(_, draft)`
- `Conditions Building`: all Concerns ratified, but some active Proposition is not approved
- `Conditions Ratified`: all Propositions approved, but per-Concern coverage incomplete
- `Closing-Ready`: per-Concern coverage holds, integrity-zero, trigger gate clear
- `Finished`: closure permitted (designer go-choice in current round)

Each phase is one query. The current phase is rendered to the Agent and Designer at every read.

---

## 5. Authority

### 5.1 Consent token

Every mutating operation requires a consent token. The token is validated at two points:
- **Interface**: shape validation — token is present, has `source` field
- **Domain**: semantic validation — source is allowed for this operation, source matches restrictions for the element category

Token shape:
```
{
  source: "designer" | "agent-proposed-designer-confirmed",
  rationale?: string
}
```

Semantic validation rules:
- For RULE/PERMISSION mutations: source must be `designer` (designer-asserted axioms only)
- For all other mutations: either source is acceptable
- Rationale is required when an operation contradicts a recommended pattern (e.g., withdrawing a ratified element)

### 5.2 Ratification (approval)

Approval is structurally a fact:
```
approved(ElementId, Text, Round)
```

The Agent cannot directly assert `approved` facts. Approval is created only by the `ratify` operation, which requires a consent token with `source: "designer"`.

Propositions, Resolutions, Concerns, Definitions all have approval as a body literal in their defining rule. Without approval, they do not enter the derived set.

**Cascade on revision:** When an element is revised, the prior `approved` fact is retracted. The element returns to the derivable-but-not-derived state. Anything that depended on it cascades automatically through the Engine's re-derivation.

This is the central elegance of the forward-solve paradigm: cascade-on-revision is free.

### 5.3 Two-yes flags

Two facts:
```
closing_arg_presented(Round)
closing_arg_go(Round)
```

Closure requires both to equal the current round. Both are cleared by any mutation (the Domain retracts them on every successful mutation operation; the next read sees the cleared state).

Two-yes flags are why a stale closing argument cannot be confirmed: any change between presentation and go invalidates the presentation.

### 5.4 First-yes precondition

Before `present_closing_argument` runs, the Domain queries:
```
first_yes_violations(EId) :- 
  active_element(EId), 
  not approved(EId, _, _).
```

If any binding is returned, presentation is refused with `FIRST_YES_GATE_FAILED` and the unratified IDs.

---

## 6. Mutations

### 6.1 Operation verbs

The Domain exposes these mutation operations:

- `openProof(submissionMaterial, consent)`
- `addElement(elementSpec, consent)` — handles all element categories via dispatch
- `reviseElement(elementId, fieldsToUpdate, consent)`
- `withdrawElement(elementId, disposition, consent)`
- `ratifyElement(elementId, ratificationText, consent)` — unified ratify (replaces separate verbs for Propositions, Resolutions)
- `manageFriction(operation, args, consent)` — add, override-disposition
- `presentClosingArgument(consent)`
- `confirmClosureGo(consent)`

Each operation:
1. Loads state (rebuilds Engine)
2. Validates consent (shape + semantics) using `IConsentVerification`
3. Begins an engine transaction via `ITransaction.begin()`
4. Validates pre-conditions (Engine queries)
5. Applies mutation (Engine assertions/retractions; ID allocation through `IIDAllocator`)
6. Triggers re-derivation
7. Validates post-conditions (Engine queries)
8. On failure: rolls back the transaction (`ITransaction.rollback()`); returns domain-classified error
9. On success: appends to operation log; advances round via `IClock.advanceRound()`; commits transaction (`ITransaction.commit()`); saves state
10. Returns Domain result

The operation pattern is **load → verify → begin → mutate → check → commit-or-rollback → save**. Multi-fact mutations (e.g., adding a Proposition with its citations, action labels, and operation-log entry) are bounded by the transaction; partial-failure leaves the Engine state pre-operation.

The Domain accepts `IClock`, `IIDAllocator`, `IConsentVerification`, and `ITransaction` (via the Engine) as injected dependencies (ADR-0009). No use case calls `Date.now()`, generates IDs inline, or assumes implicit atomicity.

### 6.2 Action labels (closed set)

When an operation supplies field values, each field is tagged with how it came to have that value:

- `verbatim-preserve`: value carried forward from prior input unchanged
- `reshape`: value normalized (whitespace trim, case adjust) without semantic change
- `gap-fill`: value supplied where no prior input existed
- `infer`: value derived from other inputs at the same level
- `derive`: value computed from prior elements

Non-`verbatim-preserve` labels require a `reasoning_chain` field stating how the value was obtained.

The action label is asserted as a metadata fact: `field_action_label(ElementId, FieldName, Label, ReasoningChain)`.

### 6.3 Mutation-clears-flags discipline

After every successful mutation (that is not itself a presentation or go-choice), the Domain retracts:
- `closing_arg_presented(_)`
- `closing_arg_go(_)`

This is the structural enforcement that closing arguments reflect *current* state.

---

## 7. Closure Policy

### 7.1 The closure query

Closure is a single query against the Engine:

```
closure_permitted :-
  all_concerns_covered,
  no_unratified_active_elements,
  no_integrity_violations,
  body_advanced_post_transition,
  closing_arg_presented(Round),
  closing_arg_go(Round),
  current_round(Round).
```

Each conjunct is itself a rule (§7.2 - §7.6). The Engine evaluates the whole query on demand.

### 7.2 Coverage

```
covered(C) :- 
  concern_status(C, ratified), 
  addresses(_, C, _).

covered(C) :- 
  concern_status(C, ratified), 
  rule_covers(_, C),
  approved(_, _, _).  -- the rule must be in the proof, hence the framework

all_concerns_covered :- 
  forall (concern_status(C, ratified), covered(C)).
```

Note: the `rule_covers` path (a Rule explicitly declaring it covers a Concern) is the explicit alternative to the prior architecture's substring-match heuristic.

### 7.3 Ratification status

```
no_unratified_active_elements :- 
  not exists (active_element(E), not approved(E, _, _)).
```

Active elements requiring approval (Propositions, Resolutions, ratifiable Concerns and Definitions) must all be approved.

### 7.4 Body advancement

```
body_advanced_post_transition :-
  current_round(R),
  phase_transition_round(P),
  R > P,
  some_advancement_between(P, R).

some_advancement_between(P, R) :-
  -- holds when at least one element was added/revised/withdrawn between P and R
  ...
```

### 7.5 Integrity policy

Each integrity check is a single rule. Integrity-zero means none of these query patterns return any binding:

```
ungrounded_proposition(N) :- 
  prop_proposed(N), 
  not exists_grounding_leaf(N).

withdrawn_grounding(N, C) :- 
  proposition(N, _), 
  cites(N, C), 
  withdrawn_element(C, _).

stale_grounding(N, C) :- 
  proposition(N, _), 
  cites(N, C), 
  revision_after(C, N).

unground_friction_anchor(F, A) :- 
  friction(F, _, A, _, _), 
  not active_element(A).

unratified_resolve_condition(R) :-
  reso_proposed(R),
  not approved(R, _, _).
```

The integrity-zero condition for closure:
```
no_integrity_violations :-
  not exists ungrounded_proposition(_),
  not exists withdrawn_grounding(_, _),
  not exists stale_grounding(_, _),
  not exists unground_friction_anchor(_, _).
```

The agent and designer can also query individual integrity rules directly, getting bindings showing which elements violate which rule.

### 7.6 Trigger gate

Subset of closure used for "ready to present?":
```
trigger_gate :-
  all_concerns_covered,
  no_unratified_active_elements,
  no_integrity_violations,
  body_advanced_post_transition,
  current_round(R),
  R >= min_rounds.
```

`min_rounds` is a domain constant (currently 3) reflecting the channeling principle's minimum-effort floor.

---

## 8. Friction Policy

### 8.1 Detection rules

Friction shapes are detected by Engine rules. A detection rule fires when its pattern matches; a Friction *hint* is created (a fact in `friction_hint/3` predicate) for review.

```
friction_hint(permission_risk_linkage, P, R) :-
  permission(P, _, RuleId),
  risk(R, _),
  risk_basis(R, RuleId).

friction_hint(rc_rule_conflict, Resolution, RuleId) :-
  addresses(Resolution, _, _),
  rule_decl(RuleId, _),
  rule_modality(RuleId, prohibition),
  rc_rule_topic_overlap(Resolution, RuleId).  -- itself a domain rule

friction_hint(nc_nc_opposing_pull, N1, N2) :-
  proposition(N1, _),
  proposition(N2, _),
  N1 != N2,
  prop_modality(N1, must),
  prop_modality(N2, must_not),
  prop_topic_overlap(N1, N2).

friction_hint(concern_concern_competition, C1, C2) :-
  concern_status(C1, ratified),
  concern_status(C2, ratified),
  C1 != C2,
  concern_topic_overlap(C1, C2).
```

The "topic_overlap" sub-predicates are themselves rules (the design replaces the current architecture's regex-keyword detection with declarative comparison rules; precise definition is in the implementation).

### 8.2 Hint-vs-auto-create

Most hints are surfaced for the agent to review and decide whether to create a Friction. The exception is `permission-risk-linkage`, which is mechanically clear-cut and auto-created.

Anchor-pair dedup is a query: `friction_hint_unsuppressed/3` excludes pairs already covered by an existing Friction (active or withdrawn).

### 8.3 Disposition lifecycle

When a Friction is created, its initial disposition determines its lifecycle:
- `lived-with`: stays active; appears in closing argument
- `relieved-by-exception`: stays active; the relieving Permission is also expected to exist
- `dissolved-by-revision` / `dissolved-by-scope-cut` / `not-really-friction`: terminal; transitions to `withdrawn` immediately

`override_friction_disposition` re-evaluates the disposition; terminal dispositions cause withdrawal.

---

## 9. Restructuring (pre-engine pipeline)

### 9.1 Submission material

Open-proof input:
```
{
  problem_statement: string,
  concerns: Array<{ label: string, description?: string }>,
  elements: Array<{
    type: ELEMENT_CATEGORY,
    ... category-specific fields ...,
    restructuring: { action: ACTION_LABEL, reasoning_chain?: string }
  }>,
  consent: ConsentToken
}
```

### 9.2 Restructuring pipeline

1. Validate problem_statement is non-empty
2. Validate at least one Concern present
3. Validate at least one Evidence element present
4. For each element:
   a. Determine category
   b. Look up required fields per REQUIRED_FIELDS_REGISTRY
   c. Validate required fields present and non-empty (rejecting placeholders like "TBD", "TODO")
   d. Apply per-field action label assignment
   e. Build provenance object (action label, reasoning chain, source citation)
   f. Move to admitted list, or rejected list with diagnostic
5. Run Open Gate: every admitted element must carry a valid restructuring_action_label and provenance with reasoning_chain (for non-verbatim labels)
6. If gate clears: initialize state, assert all admitted elements as Engine facts/rules
7. If gate fails: persist a rejected-open record in operation log, return failure

### 9.3 Action label assignment rules

Per-field rules in priority order:
- Caller-supplied non-empty value matching expected type → `verbatim-preserve`
- Caller-supplied value with whitespace differences → `reshape` (return trimmed)
- Caller-supplied undefined/null with a defined gap-fill rule for this field → `gap-fill`
- Otherwise → reject

Element-level action label is the priority-promoted aggregate of per-field labels. Priority: gap-fill > reshape > verbatim-preserve > infer > derive.

### 9.4 Open gate

Final check before state initialization:
- `restructuring_report` is non-empty
- Every admitted element carries a valid action label
- Every admitted element has provenance with source_citation
- Non-verbatim elements have non-empty reasoning_chain

Failures route to the rejected partition with diagnostics; the proof does not open.

---

## 10. Render Policy

The Domain produces several render shapes:

### 10.1 Structured-proof render
Geometric-proof-form markdown organized as: Problem, Givens (Evidence), Definitions, Inferential Framework (Rules + Permissions), Lemmas (Propositions with grounding/collapse_test/inference_pattern), Theorems (Resolutions addressing Concerns), Frictions, Rejected (phantom partition), Closure status.

This is the primary Designer-facing render. It speaks design language; it does not data-dump.

### 10.2 Element deep render
Single element with all fields, formatted for legibility. Used when the Designer drills into one claim.

### 10.3 Datalog projection
The proof state expressed as Datalog facts and rules. Used for ad-hoc queries and external verification.

### 10.4 Closing argument
The full structured artifact: as §10.1 plus closure provenance, body-advancement signal, integrity status, ratification metadata. Available at any phase (it's a pure function of state); permits closure only when gates clear.

### 10.5 Lane-slice render (planned)
Per-Concern slice of the proof: a single Concern, its ratified Resolutions anchored to it, the Propositions those Resolutions ground in, and the Evidence/Rules/Permissions transitively cited. Used when the Designer or an Adversary wants to review a single concern's argument in isolation.

**Status:** implementable on existing schema. Lane membership is a derived Datalog predicate `in_lane(Proposition, Concern)` defined by a two-clause recursive rule over `addresses(Resolution, Concern)` and `proposition_grounds(_, _)` (see ADR-0011). The render queries `in_lane` and projects the resulting Proposition set plus its transitive grounding.

Multi-lane Propositions (a Proposition serving more than one Concern) appear naturally — the derived predicate produces one `in_lane` fact per Concern the Proposition transitively serves. No schema extension is required; the previously deferred first-class pointer (ADR-0010) is superseded by ADR-0011's derived approach.

### 10.6 Render rules
- All renders are pure: same state produces same output
- Renders never trigger mutations
- Renders read from queries, not from raw state structures (preserves layering)
- Phantom partition is rendered as "Rejected" — visible, with disposition

---

## 11. Counterfactual Module

### 11.1 Mechanical collapse_test

For any Proposition, mechanically verify whether closure would still hold without it:

```
mechanical_collapse_test(PropId):
  snap = engine.snapshot()
  engine.retractFact("approved", [PropId, _, _])
  engine.derive()
  result = engine.query("closure_permitted")
  reasons = engine.query("closure_failure_reason(R)") if not result
  engine.restore(snap)
  return { stillCloses: result, failureReasons: reasons }
```

If `stillCloses` is true, the Proposition's collapse_test claim ("removing this breaks the design") is false — the Proposition is not actually load-bearing for closure. The Domain surfaces this as a counterfactual finding.

### 11.2 Counterfactual queries (general)

The counterfactual machinery generalizes:
- `query_without(facts_to_retract, query)` returns the query result against the snapshot with retractions applied
- `query_with(extra_facts, query)` returns the result with hypothetical facts added

This enables the Designer to ask "what if I withdraw this Rule?" or "what if I add this Permission?" before committing to a mutation.

---

## 12. Test obligations

### 12.1 Schema tests
- Each element category: required fields enforced, optional fields admitted, source constraints honored
- Closed-set enums: invalid values rejected
- Element-to-engine translation: round-trip fidelity

### 12.2 Mutation tests
- Each operation: pre-conditions enforced, post-conditions verified, operation log appended
- Cascade-on-revision: revising an element retracts its approval and any dependents
- Mutation-clears-flags: every mutation clears two-yes flags

### 12.3 Authority tests
- Consent validation: invalid sources refused, designer-only operations enforced
- Ratification: approval cascades correctly, revision retracts approval

### 12.4 Closure tests
- Each closure condition individually: positive case (clears), negative case (specific reason returned)
- Composite: closure permits only when all conditions hold
- Mutation between presentation and go: closure refused, two-yes flags cleared

### 12.5 Friction tests
- Each detection rule: synthetic state triggers expected hint
- Anchor-pair dedup: existing frictions suppress re-detection
- Auto-create vs hint: permission-risk-linkage auto-creates; others surface as hints
- Disposition lifecycle: terminal dispositions trigger withdrawal

### 12.6 Restructuring tests
- Open gate: each gate condition exercised
- Action label assignment: each label-trigger condition exercised
- Reject path: malformed submissions produce diagnostics, persist rejected-open

### 12.7 Render tests
- Structured-proof render: each section produced for synthetic state
- Phantom partition rendered correctly
- Closing argument: fields populated, phases reflected

### 12.8 Counterfactual tests
- Mechanical collapse_test: verifies expected outcome on synthetic Propositions
- Snapshot/restore fidelity: state bit-equal pre/post

The Domain test suite is the largest and most diverse. It exercises the Engine through real assertions and queries (no Engine mocking).

---

## 13. Sizing and structure

The Domain is expected to be 1500-2500 lines of source. Modules:
- `schema.js`: 300-400 lines (the registries and enum definitions)
- `mutations.js`: 400-500 lines (the operation verbs)
- `authority.js`: 100-150 lines (consent + ratification)
- `lifecycle.js`: 150-200 lines (round, phase, body advancement)
- `closure-policy.js`: 200-300 lines (closure + integrity rules)
- `friction-policy.js`: 150-200 lines (detection + dispositions)
- `restructuring.js`: 200-300 lines (open-proof pipeline)
- `render.js`: 300-400 lines (the renders)
- `counterfactual.js`: 100-150 lines

Plus a `domain-engine-bridge.js` (~100 lines) that holds the Engine instance, manages the injected cross-cutting adapters (`IClock`, `IIDAllocator`, `IConsentVerification`, `ITransaction` via the Engine), and translates Domain operations into Engine calls.

All Domain modules are pure functions over the state and Engine plus injected adapters. No I/O, no global state, no implicit time, no implicit ID generation, no implicit atomicity (the Engine is passed as a parameter; the cross-cutting adapters are passed alongside it). See ADR-0009 for the cross-cutting port discipline.
