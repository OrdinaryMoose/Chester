# Plan Threat Report — cluster-a-define-solve

**Plan:** `docs/chester/working/20260430-02-rebuild-design-derivation/cluster-a-define-solve/plan/cluster-a-define-solve-plan-00.md`
**Date:** 2026-04-30
**plan-attack:** complete (1 dispatch)
**plan-smell:** skipped — heuristic matched zero triggers across DI / async / persistence / abstractions / contract-DTO categories. Plan-attack alone was sufficient for hardening this sprint.

## Combined Implementation Risk: **Moderate**

Core architecture and task ordering are sound. Gaps are concentrated in **test-fixture maintenance** — the plan did not audit existing test fixtures (`closableState()`, `metrics.test.js` exact-toEqual, `proof.test.js` helper absence) against the new closure-condition footprint. Mechanical to fix, but real risk if implemented as-is — Task 7 produces broken builds at Step 4. Risk does not extend to the runtime logic, the MCP tool wiring, or the spec contract.

## Why Moderate

1. Two HIGH structural gaps will produce build failures at Task 7 Step 4 unless plan is amended (existing `computeCompleteness` `toEqual` and `closableState()` need updates inside Task 7's scope).
2. One MEDIUM gap in Task 6 (proof.test.js `makeElement`/`mapOf` helpers absent — implementer hits ReferenceError, not assertion failure).
3. One LOW execution friction: acceptance.test.js's 24 pending stubs cause "full suite passes" claims in Tasks 1-10 to be inaccurate; implementer needs to scope `npm test` to exclude acceptance.test.js until Task 11.
4. No findings against runtime logic, MCP tool schemas, ratification semantics, or closure-condition correctness. The architectural claims hold.
5. Spec-stage ground-truth report verified all major code anchors; plan-attack's HIGH findings are in **test fixtures the spec didn't catalog**, not in the source files spec described.

## plan-attack Findings (verbatim severity from subagent)

### HIGH — `metrics.test.js` `toEqual` shape break (Task 7)

`metrics.test.js:42-56` `'returns zeros for an empty map'` uses exact `toEqual` over the full `computeCompleteness` return shape (10 fields). Task 7 adds `resolve_condition_count` and `ratified_rc_count` — the existing assertion now mismatches.

**Mitigation:** Task 7 Step 1 must add the two new keys to that existing test's expected object (zero values for empty map).

### HIGH — `closableState()` and existing `checkClosure` tests break (Task 7)

`metrics.test.js:306-320` `closableState()` returns `{ elements, round, phaseTransitionRound }` with no `concerns` or `concernsLocked`. After Task 7's condition 8 fires on undefined `concerns`, all six existing `checkClosure` tests using `closableState()` fail. The plan does not list `closableState()` as a fixture to update.

**Mitigation:** Task 7 Step 1 must update `closableState()` to include `concerns: [{id: 'CERN-1', label: 'X', description: null}]`, `concernsLocked: true`, plus a ratified RC anchored to CERN-1 (so all conditions 1-10 pass for the existing "permits closure" test). Existing failing-reason tests using `closableState()` need their expected reasons re-derived.

### MEDIUM — `proof.test.js` helpers `makeElement`/`mapOf` not defined (Task 6)

Task 6's tests use `makeElement(...)` and `mapOf(...)` helpers that exist in `metrics.test.js` but not in `proof.test.js`. Plan does not say to add them. Implementer hits ReferenceError on Step 2, not the expected assertion failure.

**Mitigation:** Task 6 Step 1 must explicitly include adding the two helpers at the top of `proof.test.js` before writing the new test bodies.

### MEDIUM — Server handler param-name mapping (verified ok)

`handleRatifyResolveCondition` accepts `ratification` (MCP arg) and maps to `ratificationText` (state-fn arg). Verified intentional. Not a finding; logged for clarity.

### LOW — `proof.test.js:420` description "all four checks" stale (Task 6)

After Task 6, `checkAllIntegrity` calls six checks. Existing test description "combines results from all four checks" becomes inaccurate. Test still passes (no count assertion).

**Mitigation:** optional — implementer may update the description string in pass.

### LOW — `acceptance.test.js` pending stubs cause "full suite passes" misstatement (Tasks 1-10)

24 stubs each `throw new Error('pending: ...')`; vitest treats throws as failures. Plan claims "full suite passes" at every task's Step 4 — incorrect until Task 11 fills the stubs.

**Mitigation:** Tasks 1-10's Step 4 should read `npm test -- --exclude '**/acceptance.test.js'` (or equivalent vitest exclude), or the plan can pre-emptively skip the suite via `it.skip` until Task 11. Task 11 then re-enables and fills.

## Verified Assumptions (no action)

Plan-attack confirmed: clone-then-mutate ordering in Task 5 is safe; `current.ratificationLog` access in revise branch is safe given Task 4 sequencing; MCP server param mapping is intentional; spec-stage ground-truth anchors all hold.

## Heuristic Counts (for execution-mode selection)

- Task count: **11**
- Sum of decision budgets: **0+1+2+1+1+1+1+2+2+1+1 = 13** (Task 1: 1, Task 2: 2, Task 3: 1, Task 4: 1, Task 5: 1, Task 6: 1, Task 7: 2, Task 8: 2, Task 9: 1, Task 10: 1, Task 11: 0)
- Multi-file code-producing tasks: Task 1 (proof.js + state.js), Task 8 (server.js + new server.test.js)
- Combined risk: **Moderate**

## Human Decision

Four options:

1. **Proceed.** Implementer absorbs the test-fixture gaps as part of normal execute-write iteration (failures at Task 7 prompt the implementer to fix `closableState()` and the toEqual; failures at Task 6 prompt them to add helpers). Risk: unstable red/green signal across Tasks 1-10 from acceptance.test.js stubs masks real failures.
2. **Proceed with directed mitigations.** Apply the four mitigations above to the plan (update Task 6 to add helpers; update Task 7 to amend `closableState()` + the toEqual test; update Tasks 1-10 to scope `npm test` away from acceptance.test.js). Lowest residual risk.
3. **Return to design with additional requirements.** Not warranted — gaps are at the plan level, not the spec/design level.
4. **Stop.**

Recommendation: option 2. Mitigations are mechanical, scoped to the plan document, and remove the build-breaking failure at Task 7.
