---
status: Draft
last_reviewed: 2026-05-10
related_docs: [03-architecture, 04-engine-spec, 05-domain-spec, 06-interface-spec, 07-migration-plan]
---

# Test Strategy

This document describes how testing is organized across the three layers, what each layer's test suite covers, and how integration tests span layers. It complements each spec's "Test obligations" section by giving the integrated picture.

---

## 1. Principles

- **Tests target the lowest layer that can produce the failure.** Engine bugs caught in Engine tests; Domain bugs caught in Domain tests; Interface bugs caught in Interface tests. Don't catch Engine bugs through Interface integration tests.
- **No mocking of the layer below.** Domain tests use the real Engine. Interface tests use the real Domain (and the real Engine through it). Mocking creates parallel test code that drifts from the system.
- **Test corpus is preserved during migration.** Existing tests port forward into appropriate layers. Removing a test requires a recorded justification.
- **Property tests where they pay off.** Datalog has natural properties (monotonicity, determinism, termination); state machines have natural invariants (mutation-clears-flags, cascade correctness).
- **Each layer's tests are runnable in isolation.** Engine tests run without Domain or Interface; Domain tests run without Interface. This makes failures localizable.

---

## 2. Engine tests

### 2.1 Suite shape
A standalone test suite living in `engine/__tests__/`. No Domain or Interface concepts. Generic predicate names (`p`, `q`, `parent`, `ancestor`).

### 2.2 Canonical Datalog programs
- **Transitive closure**: ancestor relation, given a parent fact set
- **Reachability**: directed graph reachability with cycles
- **Stratified negation**: same-generation cousins
- **Multiple clauses per head**: alternative derivation paths for one head
- **Self-referential rules**: identity (`p(X) :- p(X)`) and non-progressing recursion
- **Empty programs**: empty fact set, empty rule set, fact-only programs

Each test:
- Loads facts and rules
- Calls `derive()`
- Asserts expected bindings via `query`

### 2.3 Property tests
- **Monotonicity**: adding facts (without retracting) never reduces the derived set
- **Idempotency**: `derive(); derive();` produces the same state as a single `derive();`
- **Determinism**: same fact + rule set produces same fixed point on repeated runs
- **Termination**: every well-stratified program terminates
- **Snapshot fidelity**: snapshot, mutate, restore returns to bit-equal state
- **In-transaction read-own-writes**: `begin(); assertFact(p); derive(); query(p)` returns the asserted fact; `rollback()` discards it; post-rollback state is bit-equal to pre-`begin()` state (per ADR-0013, Part 2)
- **In-transaction commit visibility**: facts and rules buffered inside a tx are observable to queries after `commit()` exactly as if asserted/defined outside a tx

### 2.4 Failure modes
- **Cyclic negation refused at rule-define time** with structured error
- **Cyclic negation refused at `defineRule` inside an open transaction** — rejected at the call that introduced the cycle, not deferred to commit (per ADR-0013, Part 3); rest of the tx remains usable; subsequent `rollback` discards buffered mutations cleanly
- **Malformed rules rejected** (head not positive atom, body atoms with wrong shape)
- **Type errors caught** when fact arguments are not constants
- **Nested transactions refused**: `begin()` while a transaction is open raises an error

### 2.5 Stress
- 10k facts, 100 rules: full derivation completes within budget
- Deep recursion (transitive closure on 1000-element chains)
- Many clauses per head (50+ alternative paths)

### 2.6 Runtime
Engine tests should run in seconds, not minutes. They are exercised on every change.

---

## 3. Domain tests

### 3.1 Suite shape
Tests live in `domain/__tests__/`, organized per module:
- `schema.test.js`: element shape and translation
- `mutations.test.js`: each mutation operation
- `authority.test.js`: consent and ratification
- `lifecycle.test.js`: round, phase, body advancement
- `closure.test.js`: closure conditions
- `integrity.test.js`: each integrity rule
- `friction.test.js`: detection and disposition
- `restructuring.test.js`: open-proof pipeline
- `render.test.js`: each render shape
- `counterfactual.test.js`: collapse_test verification

### 3.2 Test fixtures
A library of synthetic proof states for testing. Each fixture is a tagged function that takes a fresh Engine and asserts a specific configuration (e.g., "proof with one ratified Concern, one draft Proposition, no Resolutions"). Tests build on these fixtures.

### 3.3 Schema tests
Per element category:
- Required fields enforced (creation refused without them)
- Optional fields admitted
- Source constraints honored (RULE source = designer; EVIDENCE source ≠ designer)
- Closed-set enums validated (action labels, dispositions, friction shapes)
- Element-to-engine round-trip (asserting then querying retrieves the same data)

### 3.4 Mutation tests
Per operation:
- Pre-conditions enforced (operation refused when state doesn't permit)
- Post-conditions verified (operation result is correctly reflected in state)
- Operation log appended with correct entry shape
- Round counter incremented on success
- Cascade-on-revision: revising an element retracts its approval and any dependents
- Mutation-clears-flags: every mutation clears `closing_arg_presented` and `closing_arg_go`

### 3.5 Closure and integrity tests
- Each closure condition tested individually: positive case clears, negative case returns specific reason
- Composite closure: clears only when all conditions hold simultaneously
- Each integrity rule: positive case (clean state) returns no bindings; negative case (synthetic violation) returns expected bindings
- Aggregated integrity-zero: clean state returns no violations; any single violation surfaces

### 3.6 Authority tests
- Consent token shape validation at Domain boundary
- Source semantics: designer-required operations refused with non-designer source
- Ratification: approval cascades correctly through dependent elements
- Revision retracts approval; subsequent re-ratify restores

### 3.7 Friction tests
- Each detection rule fires on synthetic state matching its pattern
- Anchor-pair dedup: re-running detection does not produce duplicate hints
- Auto-create: permission-risk-linkage creates Friction element
- Hint-only: other shapes produce hints for review
- Disposition lifecycle: terminal dispositions trigger withdrawal cascade

### 3.8 Restructuring tests
- Open gate: each gate condition triggers expected gate failure
- Action label assignment: each label-trigger condition exercised
- Reject path: malformed submissions persist rejected-open in operation log
- Successful open: all admitted elements appear as engine facts/rules

### 3.9 Render tests
- Structured-proof render: each section produced for synthetic state
- Phantom partition rendered with disposition tags
- Closing argument: all expected fields populated; phantom and active sections distinct
- Element deep render: all sub-fields included; idempotent

### 3.10 Counterfactual tests
- Mechanical collapse_test: Proposition retraction produces expected closure-failure on synthetic state
- Snapshot/restore fidelity at the Domain level: state bit-equal pre/post counterfactual
- Edge case: Proposition removal that does not break closure (counterfactual reveals Proposition is not load-bearing)

### 3.11 Runtime
Domain tests are larger and slower than Engine tests but should still run within a minute. Slow tests get tagged for selective runs.

---

## 4. Interface tests

### 4.1 Suite shape
Tests in `interface/__tests__/`, focused on wire format, persistence, and dispatch.

### 4.2 Wire format
- Each tool's input schema validates correct inputs
- Each tool's input schema rejects malformed inputs with structured errors
- Each tool's output is a valid JSON Schema-conforming response
- Error responses carry the documented code and details

### 4.3 Persistence
- State file write → read round-trip preserves equivalent state
- Atomic write under simulated crash: the file is either pre-write or post-write, never partial
- Schema versioning: older-version files load with backfill applied
- Newer-version files refused with clear error
- Concurrent writes (in test): exactly one wins; no corruption

### 4.4 Tool dispatch
- Each tool name routes to its handler
- Unknown tool names return structured error
- Domain exceptions translated correctly to MCP error codes
- Read-only tools: no state mutation observed (file mtime unchanged)

### 4.5 Runtime
Interface tests should be fast; most are pure shape checks.

---

## 5. Integration tests

### 5.1 Purpose
Verify end-to-end flows across all three layers. These tests use real MCP calls (or the equivalent local entry point) to exercise the system as a whole.

### 5.2 Canonical workflows
Each workflow from ConOps §4 has a test:
- Open a proof with valid submission material → state is created
- Submit a single mutation → state advances by one round
- Build a complete proof → ratify → present → confirm go → closure permits
- Close a proof, then re-open: previous proof is preserved as input seed
- Friction emerges, gets dispositioned, terminal disposition cascades

### 5.3 Failure-mode workflows
- Cheap-path-attempted: thin rejected_alternatives clear closure (validates that the structural gates pass; the test doesn't assert the proof is "good," only that the gates correctly evaluate it)
- Stalled proof: no body advancement for several rounds; trigger gate refuses
- Race-to-presentation: present, mutate, attempt go → refused (state shifted)
- Authority drift: agent-only consent attempts ratification → refused

### 5.4 Schema migration
- Old-format state file loads, gets backfilled, operates normally
- After migration, the file is in the new format
- Round-trip stable

---

## 6. Test corpus migration from existing system

The existing 40 test files port forward as follows:

| Existing test | New layer | New file (approx) |
|---------------|-----------|-------------------|
| proof.test.js | Domain (schema) | schema.test.js |
| state.test.js | Domain (mutations) | mutations.test.js |
| metrics.test.js | Domain (closure) | closure.test.js |
| categories.test.js | Domain (schema) | schema.test.js |
| acceptance.test.js | Integration | integration.test.js |
| open-gate.test.js | Domain (restructuring) | restructuring.test.js |
| friction-detection.test.js | Domain (friction) | friction.test.js |
| friction-lifecycle.test.js | Domain (friction) | friction.test.js |
| closing-argument.test.js | Domain (render) | render.test.js |
| ratify-necessary-condition.test.js | Domain (mutations) | mutations.test.js |
| concerns.test.js | Domain (mutations) | mutations.test.js |
| consent.test.js | Domain (authority) | authority.test.js |
| restructure.test.js | Domain (restructuring) | restructuring.test.js |
| operation-log.test.js | Domain (lifecycle) | lifecycle.test.js |
| schema-version.test.js | Interface (persistence) | persistence.test.js |
| atomic-persistence.test.js | Interface (persistence) | persistence.test.js |
| server.test.js | Interface (dispatch) | dispatch.test.js |
| ... (additional tests) | (mapped per content) | ... |

The migration plan's Phase 7 includes the test reorganization. Until then, tests can stay where they are; only the per-layer test directories get populated as the layers are extracted.

---

## 7. Test infrastructure

### 7.1 Test runner
The current proof MCP uses Vitest. This is appropriate for all three layers; no test-runner change is needed.

### 7.2 Fixtures and helpers
A shared `test-fixtures/` directory holding:
- Synthetic proof states (see Domain §3.2)
- Sample submission materials for restructuring tests
- Canonical Datalog programs for Engine tests
- Fixed Concern + Proposition + Resolution sets for closure tests

### 7.3 Property test framework
A small property-test helper (or a library like `fast-check`) for the Engine's property tests. Optional for Domain; most Domain properties are tested via specific cases.

### 7.4 Coverage targets
- Engine: 95%+ statement coverage, 100% on the evaluator core
- Domain: 90%+ statement coverage, 100% on closure and integrity rules
- Interface: 80%+ (boilerplate handlers don't need exhaustive coverage)

These are guidelines, not gates. Quality of tests matters more than coverage percentage.

---

## 8. Continuous validation

During migration:
- Each phase's exit criteria includes "test corpus passes" — both the existing suite and any new tests added in that phase
- Side-by-side: a phase that replaces a procedural checker with an engine query runs both and asserts equality on a sample of the corpus before retiring the procedural code
- New behavior gets new tests in the appropriate layer; tests at the wrong layer are flagged in code review

After migration:
- Per-layer suites runnable independently
- An aggregate "all tests" runner exists for the final go/no-go signal
- Slow tests are tagged so the fast-feedback loop stays fast

---

## 9. What this strategy doesn't cover

- **Performance benchmarks**: deferred to operations doc when the system needs them
- **Security testing**: not applicable at the current threat model (single-user, file-system-bounded)
- **Fuzz testing**: deferred; could be valuable for the Engine's parser if one is added
- **Mutation testing**: a strong validator for test quality; defer until coverage is stable
- **End-to-end tests against real MCP clients**: relies on the broader Chester pipeline being available; defer

These are addressable when the system or threat model warrants. They are not part of the initial migration's test obligations.
