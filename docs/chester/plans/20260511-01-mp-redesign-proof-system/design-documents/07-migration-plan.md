---
status: Draft
last_reviewed: 2026-05-10
related_docs: [03-architecture, 04-engine-spec, 05-domain-spec, 06-interface-spec]
---

# Migration Plan

This document sequences the build of the new architecture, starting from the existing proof MCP and ending at the three-layer hexagonal system. It is a working document: phases get marked complete as they finish, deviations are recorded inline, and the overall sequence may be adjusted based on discoveries.

The plan assumes the existing proof MCP is the starting point, with its current procedural checker, regex-keyword friction detection, and substring-match coverage. It does not require a clean-room rewrite — each phase is an incremental migration with a checkpoint where the new behavior is validated against the old.

---

## 1. Migration principles

- **Side-by-side validation** at each phase: the new behavior must produce equivalent results to the old on the existing test corpus before the old is removed.
- **One layer at a time** wherever possible: don't migrate Engine, Domain, and Interface simultaneously.
- **No breaking changes to the wire format** until Phase 7: existing state files must continue to load and operate.
- **Decisions captured as ADRs**: every notable choice during migration generates a decision record.
- **Deferrable phases**: Phases 6 and 7 are nice-to-have; the system is functionally complete after Phase 5.

---

## 2. Phase 0: Engine standalone

**Goal:** A working Datalog evaluator, validated independently of any proof concept.

**Tasks:**
- Implement fact store with predicate-keyed indexes
- Implement rule store with stratification metadata
- Implement semi-naive bottom-up evaluator
- Implement stratified negation
- Implement query, count, exists primitives
- Implement explain (derivation trees)
- Implement snapshot / restore
- Build the canonical Datalog test suite (transitive closure, ancestors, reachability, stratified negation, multiple clauses per head)

**Entry criteria:** Engine spec is approved.

**Exit criteria:**
- Canonical test suite passes
- Property tests pass (monotonicity, idempotency, termination)
- Performance budgets met for a sample 1000-fact program

**Deliverable:** `engine/` module with no external dependencies.

**Estimated effort:** 1-2 weeks, single developer.

**Risks:**
- Stratified negation correctness requires careful implementation; a buggy stratifier silently produces wrong fixed points
- Snapshot performance: naive copy is too slow; need at least lazy copying

---

## 3. Phase 1: Datalog as projection (read-only)

**Goal:** Add a `render_datalog` tool to the existing proof MCP. Translate current state into Datalog facts/rules. No behavioral change yet.

**Tasks:**
- Build state-to-Datalog translation in current architecture
- Add `render_datalog` MCP tool returning the projection as text
- Optional: add `query_proof` accepting raw queries and running them via the new Engine against the projection

**Entry criteria:** Phase 0 complete.

**Exit criteria:**
- `render_datalog` returns a faithful projection of state for sample proofs
- The projection, loaded into the Engine, can answer basic queries (`?- proposition(N, _).`, `?- covered(C).`)
- Existing tests still pass; no regressions

**Deliverable:** Read-only Datalog projection capability in the existing system.

**Estimated effort:** 1 week.

**Value gained:** Ad-hoc query capability for the Designer; foundation for adversarial review.

---

## 4. Phase 2: Integrity checks migrate to engine queries

**Goal:** Replace procedural integrity checks (`checkUngrounded`, `checkWithdrawnGrounding`, `checkStaleGrounding`, `checkUngroundedFrictionAnchors`, `checkMissingCollapseTest`) with Datalog queries against the Engine.

**Tasks:**
- For each integrity predicate, define the equivalent Datalog rule
- Build a query-based integrity-check function in the Domain layer
- Validate semantic equivalence by running both procedural and query-based checks on the test corpus
- Once equivalence confirmed, retire the procedural checker

**Entry criteria:** Phase 1 complete and validated.

**Exit criteria:**
- All integrity tests pass against the new query-based checker
- Existing test corpus passes
- The procedural integrity code is removed

**Deliverable:** Domain integrity layer expressed as engine queries.

**Estimated effort:** 1 week.

**Risks:**
- Subtle semantic differences in edge cases (empty grounding, withdrawn but cited, etc.); thorough side-by-side testing required.

---

## 5. Phase 3: Closure gate migrates

**Goal:** Replace `checkClosure` and `evaluateTrigger` with Datalog queries. Consolidate them into one closure predicate.

**Tasks:**
- Express each closure condition as a Datalog rule (per Domain Spec §7)
- Build the consolidated `closure_permitted` query
- Build the trigger-gate subset
- Validate equivalence against the existing procedural check
- Retire the procedural code

**Entry criteria:** Phase 2 complete.

**Exit criteria:**
- All closure tests pass against the new query
- The "closure_reasons" output (when closure is denied) is informative and matches old behavior in spirit
- Aggregate score and per-signal floors removed (or retained as redundant guardrails — to be decided in an ADR)

**Deliverable:** Closure as a single engine query.

**Estimated effort:** 1-2 weeks.

**Risks:**
- The aggregate score's removal may surface failure modes the per-signal floors didn't catch; monitor closely.

---

## 6. Phase 4: Friction detection migrates

**Goal:** Replace regex-keyword friction detection in `friction-detection.js` with Datalog rules.

**Tasks:**
- Define Datalog rules for each friction shape (Domain Spec §8.1)
- Replace `proposition-proposition-opposing-pull` regex with a structural rule (modality-based, not keyword-based)
- Replace `resolution-rule-conflict` regex with a topic-overlap rule (declared, not inferred from substring)
- Replace `concern-concern-competition` regex with a topic-overlap rule
- Anchor-pair dedup as a query
- Auto-create vs hint distinction in Domain layer

**Entry criteria:** Phase 3 complete.

**Exit criteria:**
- All friction tests pass against the new rule-based detection
- New shapes can be added by adding clauses, not by adding regex hunters

**Deliverable:** Declarative friction detection.

**Estimated effort:** 1-2 weeks.

**Risks:**
- The new structural rules may catch different cases than the old regex; some cases may be missed initially. The architecture's openness to new clauses makes this addressable.

---

## 7. Phase 5: Propositions and Resolutions become engine rules

**Goal:** The deepest paradigm shift. Transform Proposition.grounding from a static reference list into a Horn clause body. Approval becomes a body literal.

**Tasks:**
- Define the schema-to-engine translation for Propositions and Resolutions (Domain Spec §3.4, §3.6)
- Build a synthesis layer in the Domain that translates `add Proposition` operations into engine rule definitions
- Implement cascade-on-revision via approval-fact retraction
- Validate that closing-argument output remains equivalent
- Implement counterfactual support (snapshot/retract approval/derive/restore)

**Entry criteria:** Phase 4 complete.

**Exit criteria:**
- The full test corpus passes against the new architecture
- Cascading correctly retracts dependent Propositions and Resolutions on revision
- The mechanical collapse_test verification (counterfactual) is functional
- The agent's MCP interface is unchanged from the previous phase

**Deliverable:** Forward-solve paradigm in operation. The proof's proposition layer is now a derivable knowledge base.

**Estimated effort:** 2-3 weeks.

**Risks:**
- Subtle differences in cascade behavior could break test cases; careful migration with extensive validation
- Performance regression if the engine is rebuilt from scratch on every operation; may need to add an in-memory cache or accept the cost

---

## 8. Phase 6: Counterfactual tools (optional)

**Goal:** Expose the counterfactual capability as MCP tools, adding `run_counterfactual` and `query_proof`.

**Tasks:**
- Add `run_counterfactual` tool wrapping the Domain's mechanical collapse_test
- Add `query_proof` tool exposing read-only ad-hoc engine queries
- Document the query language available to designers

**Entry criteria:** Phase 5 complete.

**Exit criteria:**
- Counterfactual tools work for sample Propositions
- Query tool returns expected bindings for sample queries
- Documentation includes example queries the Designer can copy

**Deliverable:** First-class counterfactual reasoning.

**Estimated effort:** 1 week.

**Value gained:** Mechanical collapse_test verification; the structural-vs-semantic gap narrows.

---

## 9. Phase 7: Architecture refactor (optional)

**Goal:** Reorganize the code into the three-layer hexagonal structure described in Architecture §3, separating Engine / Domain / Interface as clearly modular components.

**Tasks:**
- Extract Engine into its own module with a clean public API
- Reorganize Domain modules per Domain Spec §13
- Trim Interface to handler-thin (move logic to Domain)
- Document the boundary contracts in code comments

**Entry criteria:** Phase 5 complete (Phase 6 optional).

**Exit criteria:**
- The three layers are visually separable in the source tree
- Unit tests can target each layer independently
- The Engine could in principle be packaged as a separate library

**Deliverable:** Clean three-layer code organization matching the architecture document.

**Estimated effort:** 1-2 weeks.

**Risks:**
- Refactoring risk: behavioral regressions during reorganization. Side-by-side validation against the test corpus is essential.

---

## 10. Phase 8: Adversary integration (deferred)

**Goal:** Wire the Adversary role as a separate skill or process invoking the proof MCP. Out of scope for the initial migration but on the roadmap.

This phase is not detailed here; it is anticipated by the architecture but its precise shape depends on how the broader Chester pipeline evolves.

---

## 11. Cross-phase concerns

### 11.1 Test corpus preservation
The existing test corpus (40 test files, ~7000 lines) is the migration's primary safety net. Each phase preserves the corpus and uses it for side-by-side validation. Tests may be reorganized into per-layer suites in Phase 7, but no test is removed without explicit justification recorded in an ADR.

### 11.2 Schema version increments
Phases 5 and 7 may require schema version increments due to changes in state file shape (engine-state serialization in Phase 5; reorganization in Phase 7). Each increment includes a backfill path so existing state files continue to load.

### 11.3 Documentation updates
Each phase updates the relevant cascade documents:
- Phase 0: Engine spec finalized
- Phase 1: Architecture diagrams updated to show projection
- Phase 2-4: Domain spec sections marked as implemented
- Phase 5: ADR-0007 status updated to "Implemented"
- Phase 7: Architecture document updated to reflect realized layering

### 11.4 ADRs as the migration progresses
Notable decisions get captured. Examples likely:
- ADR for whether to remove the aggregate score in Phase 3
- ADR for the exact synthesis pattern for Proposition translation in Phase 5
- ADR for engine-rebuild caching strategy if performance becomes an issue
- ADR for the friction shape rules' topic-overlap semantics in Phase 4

---

## 12. Total estimated timeline

For a single developer working full-time:
- Phase 0: 1-2 weeks
- Phase 1: 1 week
- Phase 2: 1 week
- Phase 3: 1-2 weeks
- Phase 4: 1-2 weeks
- Phase 5: 2-3 weeks
- Phase 6: 1 week (optional)
- Phase 7: 1-2 weeks (optional)

**Critical path (Phases 0-5): 7-11 weeks.**

**Full plan (Phases 0-7): 9-14 weeks.**

These estimates assume no major architectural surprises. Buffer for unknowns: add 25-50%.

---

## 13. Stop conditions

The migration may legitimately stop short of full completion at any of these checkpoints:

- **After Phase 1**: if the projection capability alone provides sufficient value (designer queries, adversarial review) and the procedural engine is acceptable
- **After Phase 4**: if the operational improvements (declarative friction, query-based integrity) suffice and the paradigm shift to forward-solve is not justified by demonstrated need
- **After Phase 5**: if the mechanical counterfactual is not currently a priority and the organizational refactor (Phase 7) is not yet warranted

Each stop point leaves the system in a working, valuable state. The migration is not all-or-nothing.

---

## 14. Deviation tracking

This section is appended to as the migration proceeds. Each entry captures:
- Date
- Phase affected
- What was changed from the plan
- Rationale
- Implication for subsequent phases

(No entries yet; populated during execution.)

---

## 15. Sub-sprint mapping (for Chester's master plan pattern)

If executing this through Chester's master-plan workflow, the natural sub-sprint boundaries are:
- Sprint 1: Phase 0
- Sprint 2: Phases 1 + 2
- Sprint 3: Phases 3 + 4
- Sprint 4: Phase 5 (largest single sprint)
- Sprint 5: Phase 6 + Phase 7 (optional)

Each sprint corresponds to a session or short series of sessions in Claude Code. The reasoning audit and session summary at each sprint boundary feed forward into the next sprint's planning.
