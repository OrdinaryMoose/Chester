# Reasoning Audit: Cluster B.1 — Define Transition

**Date:** 2026-05-04
**Session:** `00`
**Plan:** `cluster-b-1-define-transition-plan-00.md`

## Executive Summary

The session set out to deliver the Phase 4a → Phase 4b transition contract as a single MCP entry point (`open_proof`) replacing `initialize_proof`, working under master plan `20260430-02-rebuild-design-derivation` cluster B.1. The most consequential decision was the permissive-boundary / internal-rigor architecture — accept any caller submission shape at the MCP surface, then restructure into typed proof elements through a 3-module pipeline gated on per-element artifacts before persisting state. This shape originated in the design-large-task understanding rounds (where the designer named the dual pressure of structural validation vs. preserving conversational context) and propagated through every subsequent decision: the 3-module split, per-field provenance array, partition routing for Concerns, and the gated three-phase orchestration in `handleOpenProof`. Implementation stayed on-plan with three rounds of attacker+smeller hardening (Significant → Moderate → Low) folding back into the plan before code was written; the most material plan revision was retiring `initialize_proof` in this sprint rather than deferring, after the smell pass surfaced functional duplication of two parallel proof-opening paths.

## Plan Development

The plan was built incrementally through the standard pipeline: design-large-task produced a design brief naming the permissive-boundary architecture and the six admittable categories (5 element types + Concern); design-specify formalized the contract surface, status responses, and gate criteria into AC-numbered acceptance criteria; plan-build decomposed the spec into 14 implementation tasks with the 3-module restructure split worked out at planning time (not deferred to execution). Three rounds of attacker + smeller review fed structural changes back into the plan before T1 ran — most notably the per-field provenance array (replacing single-label aggregation), explicit Concern partition routing (closing the silent-drop hazard), and `initialize_proof` retirement promoted from out-of-scope to T13. Per-task `Execution: inline | subagent` annotations were added during plan-build as a designer-driven override of the plan-wide heuristic.

## Decision Log

### Permissive Boundary, Internal Rigor — the core architectural commitment

**Context:**
B.1 had to design a contract for caller-supplied transition material. The Phase 4a → 4b boundary has two structural pressures pulling opposite directions: tight typed shapes for validation rigor; loose accommodation for caller-supplied rationale, provenance, and conversational context. Existing MCP tools assumed turn-by-turn agent-driven calls, not a single-transition intake.

**Information used:**
- Master Plan RULE-4 (caller does not pre-validate) and RULE-6 (Phase 4b is presumed valid; cluster B confirms not refactors)
- Designer's understanding-round articulation that "tight typed shapes for validation rigor, loose accommodation for caller-supplied context" are competing pressures
- Existing `proof.js` createElement type discipline — already enforces structure for the 5 element types

**Alternatives considered:**
- `Strict-input MCP schema with required keys + additionalProperties:false` — rejected because it would force the caller to pre-shape material, violating RULE-4 and stripping context
- `Loose ingest with no internal validation` — rejected because it would push rigor failures downstream and silently corrupt proof state
- `Two-phase tool (submit + commit)` — rejected because it doubles the contract surface and reintroduces turn-by-turn assumptions

**Decision:** Single MCP tool with permissive top-level schema (`state_file` + free-form `submission_material`); rigor enforced internally via 3-phase orchestration (accept → restructure → check-gate-then-persist).

**Rationale:** The boundary cannot afford to reject nuance, but the proof structure cannot afford to admit untyped material. Splitting validation across the boundary preserves both — caller flexibility at the surface; proof rigor at persistence.

**Confidence:** High — explicitly stated across the design brief, spec, and plan; the entire 14-task decomposition is downstream of this choice.

---

### Three-Module Restructure Split

**Context:**
The restructure pipeline aggregates seven distinct responsibilities: data registry, action-label rules, value-rejection predicate, anchor validation, provenance assembly, metadata routing, top-level orchestration. The plan needed a module boundary that would not encode a "god file" or force unrelated changes to ripple.

**Information used:**
- Plan-smell finding flagging coupling risk if all responsibilities lived in one file
- Existing proof-mcp module convention (each pure-data file separate from each rule-table file)
- Test-mirroring convention (`__tests__/<source>.test.js`)

**Alternatives considered:**
- `Single restructure.js file with all seven responsibilities` — rejected as a coupling smell that would force every restructure-related change to touch one file
- `One file per function (7 files)` — rejected as over-fragmentation; would scatter cohesive rule tables across multiple files

**Decision:** Three modules: `restructure-schema.js` (REQUIRED_FIELDS_REGISTRY data only), `restructure-rules.js` (the three pure predicates: assignActionLabel, isRejectedValue, validateReasoningAnchor), `restructure.js` (buildProvenance, extractMetadata, top-level orchestrator).

**Rationale:** Boundary tracks the kind-of-change axis: registry edits go to schema, predicate edits to rules, orchestration edits to the entry-point file. Tests mirror sources for navigation.

**Confidence:** High — split is documented at plan top and reflected in the final 4 source / 4 test file layout.

---

### Per-Field Provenance Array vs Single Action Label

**Context:**
Initial plan draft computed one `restructuring_action_label` per element via priority promotion (`gap-fill > reshape > verbatim-preserve`). The smell pass surfaced that this is lossy aggregation — once persisted as a single label, the per-field history is unrecoverable, and the API contract hardens around the lossy form.

**Information used:**
- Plan-smell Finding 2: "Single-Label Promotion Is a Lossy Approximation That Hardens Into API Contract (Medium)"
- Per-element provenance shape already required by AC-7.1 (NCON-3)
- Backward-compatibility constraint — element-level `action_label` consumers should not break

**Alternatives considered:**
- `Single label only (original draft)` — rejected as lossy; future debugging cannot reconstruct which fields were reshaped vs gap-filled
- `Per-field array, no element-level label` — rejected as breaking existing element-level consumers
- `Per-field array on a side channel outside provenance` — rejected as splitting the provenance story across two locations

**Decision:** Both — `provenance.field_provenance: [{field_name, action_label, reasoning_chain}]` per typed field, with element-level `provenance.action_label` as the priority-promoted aggregate.

**Rationale:** Per-field array preserves the audit trail; element-level aggregate keeps existing single-label consumers working. Priority promotion is documented and tested so the aggregate is reproducible from the array.

**Confidence:** High — explicitly called out in the plan's "Plan-Wide Implementation Discipline" section and traced to a smell finding.

---

### Concern Partition Routing through addConcern

**Context:**
Smell pass Finding 1 (High severity): if `restructure()` admits a Concern-category element and `handleOpenProof` passes it directly to `applyOperations`, the op `type === 'Concern'` falls through `generateId`'s `ID_PREFIX` lookup, producing a corrupt ID (`undefinedNaN`) and silently landing a malformed element in state. `applyOperations.errors` would not catch it because the type-validation pass only checks grounding/basis IDs.

**Information used:**
- Smell pass evidence trace through `state.js` `applyOperations` → `generateId` → `ID_PREFIX` (no Concern key)
- Existing `addConcern` handler already in state.js with its own ID scheme
- B.1 admits Concerns as one of six categories (5 element types + Concern)

**Alternatives considered:**
- `Add 'Concern' key to ID_PREFIX and route through applyOperations` — rejected because Concern is structurally not an element (lives in its own state slot, separate ID scheme)
- `Reject Concerns at the boundary` — rejected because the master plan admits Concerns as a transition category
- `Silent drop with a warning` — rejected as the exact failure mode the smell pass flagged

**Decision:** `handleOpenProof` partitions admitted into typed elements (routed through `applyOperations`) and Concerns (routed through `addConcern`). Concerns cannot leak into `state.elements`.

**Rationale:** Concerns have their own state slot and ID scheme; routing them through the wrong handler corrupts state silently. Partition at the orchestrator level keeps the routing explicit and testable.

**Confidence:** High — partition logic is the core of `handleOpenProof`; smell pass evidence is unambiguous.

---

### Retire `initialize_proof` in This Sprint vs Defer to Cluster C

**Context:**
Plan draft initially added `open_proof` alongside the existing `initialize_proof` tool, treating retirement as out-of-scope for B.1. Smell pass Finding 1 flagged this as functional duplication — both tools share a `initializeState` + `saveState` call sequence with subtle asymmetry (`proofStatus` set in one, not the other), invisible without reading both handlers side by side.

**Information used:**
- Smell pass: "Two Parallel Paths for Proof Opening — Functional Duplication (Medium)"
- Master plan handoff to Cluster C: B.1 owns the contract; C consumes it
- Existing test coverage of `initialize_proof` (handleInitialize tests) — replaceable, not foundational

**Alternatives considered:**
- `Keep both tools live; deprecate initialize_proof in cluster C` — rejected as it leaves Cluster C inheriting a duplication smell B.1 created
- `Wrap initialize_proof to call handleOpenProof internally` — rejected as it preserves the dual-entry confusion at the tool-list surface
- `Retire in this sprint as T13` — accepted

**Decision:** Add T13 "Retire initialize_proof tool" to the plan; after T13, the only proof-opening entry point is `open_proof`.

**Rationale:** Cluster C cannot consume a clean transition contract while two opening paths exist. The duplication smell is structural, not cosmetic — every future state-shape change would have to touch both handlers. Better to absorb the retirement cost in B.1.

**Confidence:** High — promotion from out-of-scope to T13 is explicitly traceable to the smell finding.

---

### RESOLVE_CONDITION Excluded from REQUIRED_FIELDS_REGISTRY

**Context:**
The registry enumerates B.1-admittable categories. RESOLVE_CONDITION exists as an element type in the proof MCP but is owned by Cluster A's resolution-claim work; FRICTION exists as an element type but is structurally not a transition category (it represents a relationship between existing elements, not transitionable material).

**Information used:**
- Master plan RULE-7 (resolution-claim attributes locked; cluster A settles naming and shape)
- Existing FRICTION early-return path in `createElement` — structurally distinct
- Cluster sequencing lock: B.1 must not commit a registry shape that pre-empts Cluster A's RC work

**Alternatives considered:**
- `Include both, with B.1-specific required fields` — rejected for FRICTION (no transitionable shape) and RC (would pre-empt Cluster A)
- `Include RC with placeholder fields` — rejected as a forward-compatibility hazard

**Decision:** Registry contains 6 entries (5 element types + Concern); FRICTION and RESOLVE_CONDITION explicitly excluded with rationale comments in the source.

**Rationale:** Excluding with comments documents the intent for the next reader. RC stays out so Cluster A can shape it; FRICTION stays out because it is not a transition input.

**Confidence:** High — exclusion + rationale comments are in the final restructure-schema.js.

---

### Per-Task Execution Mode Override

**Context:**
plan-build's default is a plan-wide execution mode (subagent or inline) chosen by heuristic. B.1 has 14 tasks with widely varying complexity — most are mechanical single-function additions; T8 (restructure orchestrator) and T11 (handleOpenProof three-phase orchestration) have nested logic, partition routing, and multiple integration tests.

**Information used:**
- plan-build heuristic: subagent for complex multi-file tasks; inline for mechanical single-function changes
- Designer judgment that uniform mode would either over-spend (subagent everywhere) or under-spend (inline everywhere)

**Alternatives considered:**
- `All inline` — rejected; T8 and T11 are too entangled for inline execution to stay disciplined
- `All subagent` — rejected; spinning up subagents for mechanical 5-line edits is wasteful

**Decision:** Add a per-task `Execution: inline | subagent` field; T8 and T11 marked subagent, the other 12 inline. execute-write reads the per-task field directly.

**Rationale:** Cost matches complexity. The pattern is precedent-setting (called out in summary handoff notes) — future plans can reuse the per-task override when task complexity is non-uniform.

**Confidence:** High — per-task field is explicit in the plan and called out as precedent in the session summary.

---

### ESM Main-Module Guard for vitest Import

**Context:**
T13's server.js refactoring required importing `server.js` from test files to assert on `TOOLS` and verify `initialize_proof` removal. But `server.js` calls `main()` at module load, which spawns the stdio MCP server — incompatible with vitest's import flow.

**Information used:**
- Node ESM convention `import.meta.url === \`file://${process.argv[1]}\`` for main-module detection
- Existing server.test.js pattern of source-string inspection (suggesting prior reluctance to import the module directly)

**Alternatives considered:**
- `Keep source-string inspection only` — rejected because it can't catch dispatch-case bugs; behavioral test on TOOLS array is stronger
- `Refactor server.js into library + entry point` — rejected as scope creep for this sprint
- `ESM main-module guard` — accepted

**Decision:** Wrap `main()` invocation in `if (import.meta.url === \`file://${process.argv[1]}\`)` so vitest imports do not launch the stdio server.

**Rationale:** Minimal change unlocks behavioral tests on TOOLS and dispatch. Standard ESM idiom; transparent to runtime.

**Confidence:** High — guard is in final server.js; pattern is conventional.

---

### `expected_type` Derived from Caller Value vs Registry

**Context:**
During T8 implementation (restructure orchestrator), the question arose whether `expected_type` (used for type-checking caller submissions against the registry) should be looked up from REQUIRED_FIELDS_REGISTRY or derived from the caller-supplied value's runtime type.

**Information used:**
- Quality-review pass noting `expectedType` in restructure.js is derived from caller value
- Current registry entries — all field expected types happen to match the caller's natural value type for the 6 categories
- Trade-off: registry-driven is explicit but adds a lookup; derive-from-value is implicit but simpler

**Alternatives considered:**
- `Lookup from registry` — would make field-type expectations explicit and centrally controlled
- `Derive from caller value` — simpler; works for current shapes but couples expectation to whatever the caller happens to pass

**Decision:** Derive from caller value (acknowledged as cosmetic for the current registry).

**Rationale:** Current registry shapes are uniform enough that derive-from-value is observationally identical to lookup; switching costs more than it returns. Documented as a Minor finding in the summary's Known Remaining Items, not blocking.

**Confidence:** Medium — decision visible in code; rationale partially inferred from quality-review note flagging it as "cosmetic for current registry."

---

### Five Status Responses for `open_proof`

**Context:**
The contract surface needs to communicate distinct outcomes to the caller. Conflating success and partial-failure paths would break idempotent resubmission semantics.

**Information used:**
- AC-numbered acceptance criteria from the spec defining required response paths
- Existing proof MCP response convention (status string + payload)
- Idempotent-resubmission requirement: gate-fail and partial-write-failure must write nothing so a retry is safe

**Alternatives considered:**
- `Single success/failure boolean with error array` — rejected as it loses the gate-vs-persist distinction
- `Separate tools per outcome` — rejected as it breaks the single-entry-point commitment

**Decision:** Five statuses: `opened`, `gate_failed` (two paths: missing problem_statement, gate-verifier failure), `partial_write_failure`, `save_failed`, `already_open`.

**Rationale:** Each status maps to a distinct caller-observable outcome with distinct retry semantics. `already_open` makes resubmission safe by short-circuiting before any write.

**Confidence:** High — five statuses enumerated in the summary and exercised by handler tests.

<!-- produced-by finish-write-records@v0003 -->
