# Plan Threat Report — cluster-d-1

**Plan:** `cluster-d-1-plan-00.md`
**Smell triggers matched:** `async`, `await`, `persistence`, `boundary contract` — both attacker and smeller dispatched.
**Combined implementation risk:** **Significant**

## Why Significant (not Moderate, not High)

- Five Critical findings concentrated in a small set of tasks (Tasks 2, 3, 13). Each is a localized mistake (wrong field name, wrong serialization helper, wrong destructure shape, missing test-fixture ratification step) — fixable by directed plan revision, not by architecture rework.
- One ESM-specific testing-tool gap (`vi.spyOn` on `fs` won't intercept) blocks Task 2's atomic-persistence test from working as written. Cleanly addressable via `vi.mock`.
- No structural defects in task ordering, dependency graph, or AC coverage. Fidelity reviewer approved the plan.
- Smell findings are mostly long-term ergonomic notes (poor-man's discriminated union on `provenance`, three deletion paths sharing logic, `clearClosingFlags` anti-pattern) — not blockers.

The risk is "Significant" because shipping the plan as-written would produce a Task 2 commit that silently corrupts state files (every subsequent task's tests run on broken `loadState`), then Task 3 would surface mid-implementation API decisions the plan didn't make (return shape of `applyOperations`), then Task 13 would fail its own AC checks (`problemStatement: undefined` and `lockedConcerns: []`). Three failure points in three different places before the plan reaches execute-verify-complete.

## Critical Findings (block execute-write until addressed)

### C-1 — Task 2 saveState serialization format mismatch
**Plan says** (Task 2 Step 3): `elements: Array.from(state.elements.entries())`
**Code shows:** existing `state.js:439-440` uses `Object.fromEntries(state.elements)`; existing `loadState` at `state.js:451` deserializes via `new Map(Object.entries(raw.elements))`.
**Impact:** plan's serialization writes a JSON array of `[key, value]` pairs; existing loader expects an object. Result: silent state corruption — `Object.entries(arrayOfPairs)` produces wrong keys (`"0"`, `"1"`, ...) with wrong values. Every test that round-trips state breaks after Task 2.
**Fix required:** Task 2 must keep `Object.fromEntries(state.elements)` for the elements field, change only the persistence path to write-tmp-then-rename.

### C-2 — applyOperations return shape: object today, plan uses tuple
**Plan says** (Tasks 3, 4 test snippets): `[s] = applyOperations(s, ops, consent)` — tuple destructure.
**Code shows:** `state.js:400-412` returns plain object `{ state, added, revised, withdrawn, errors, integrityWarnings, completeness, challengeTrigger, stallDetected, closure, friction_hints }`. `server.js:230` destructures `result.state`, `result.added`, etc.
**Impact:** if implementer follows plan literally, `applyOperations` becomes a tuple, breaking every server handler call site and 9+ existing test files that destructure the object form. If implementer keeps object shape, plan's test snippets fail.
**Fix required:** plan must commit to object-shape preservation (`const result = applyOperations(state, ops, consent); state = result.state; ...`) and update Task 3/4 test snippets accordingly. Alternative — full tuple refactor — is more disruptive and not in scope for this sprint.

### C-3 — Task 13 uses snake_case field name
**Plan says** (Task 13 Step 3): `problemStatement: state.problem_statement`
**Code shows:** existing `state.js:35` stores field as `problemStatement`; existing `closing-argument.js:50` reads `state.problemStatement`.
**Impact:** plan's snippet would produce `problemStatement: undefined` in the closure envelope, failing AC-4.1's "no field is undefined" requirement and any test asserting on the field's content.
**Fix required:** s/`state.problem_statement`/`state.problemStatement`/ in Task 13.

### C-4 — Task 13 lockedConcerns filter breaks existing test fixtures
**Plan says** (Task 13 Step 3): `const lockedConcerns = (state.concerns ?? []).filter(c => c.status === 'ratified');`
**Code shows:** existing `closing-argument.test.js`'s `build()` helper calls `addConcern` then `lockConcerns(s)` without intervening `ratifyConcern` calls. After Task 5, `addConcern` sets `status: 'draft'`; `lockConcerns` does not auto-ratify.
**Impact:** the existing test fixture would yield `lockedConcerns: []` after Task 13's filter, failing the test assertion that `lockedConcerns` contains the test Concerns. The plan's "Must remain green" list for Task 13 includes `closing-argument.test.js`.
**Fix required:** either (a) Task 5 also extends `lockConcerns` to bulk-ratify all draft Concerns at lock time (most aligned with RULE-9 "Concerns ratify mid-round individually" or equivalently at lock time), OR (b) Task 13's `lockedConcerns` filter checks `state.concernsLocked && c.status !== 'withdrawn'` (preserves existing semantic), OR (c) update fixture in `closing-argument.test.js` to call `ratifyConcern` for each Concern before lock. Option (a) is cleanest but changes RULE-6 semantics; option (b) preserves existing behavior; option (c) is a fixture patch.

### C-5 — Task 2 vi.spyOn pattern won't intercept fs in ESM modules
**Plan says** (Task 2 Step 1 test):
```js
const fs = await import('fs');
const renameSpy = vi.spyOn(fs, 'renameSync');
```
**Code shows:** package is `"type": "module"`; `state.js:12` does `import { writeFileSync, renameSync } from 'fs'` — named imports are live bindings captured at import time. `vi.spyOn` modifies the namespace object property but `state.js`'s binding doesn't re-read it.
**Impact:** the spy doesn't intercept `state.js`'s `renameSync` call. The "rename failure" test gives false results: `toHaveBeenCalled()` fails for the success case (spy never called), and the failure-injection test doesn't simulate failure (real `renameSync` runs).
**Fix required:** Task 2 must use `vi.mock('fs', async () => { const actual = await vi.importActual('fs'); return { ...actual, renameSync: vi.fn(actual.renameSync) }; })` at the top of the test file, OR refactor `saveState` to accept an injected fs-like object for testability. Plan must specify which.

## Important Findings (address inline; not gating)

- **I-1** Task 3 bulk-patch incomplete enumeration. 9 additional test files beyond the 6 listed call mutating state functions (`closing-argument-end-to-end.test.js`, `withdrawal-disposition.test.js`, `friction-detection.test.js`, `eleventh-closure-condition.test.js`, `friction-element-type.test.js`, `two-yes-flags.test.js`, `mutation-clears-flags.test.js`, `trigger-evaluator.test.js`, plus `acceptance.test.js`). Plan must enumerate the full set or instruct implementer to grep for mutating function calls.

- **I-2** Task 14 RC ratification shape divergence. Existing `ratifyResolveCondition` writes `{ ratifiedAtRound, text }`; bulk-ratify uses `{ round, by }`. If any closing-argument test reads `.ratification.ratifiedAtRound`, bulk-ratified RCs break that assertion. Plan should standardize on the existing shape.

- **I-3** Task 11 `persistRejectedOpen` re-open guard collision. `initializeState()` resets `proofStatus` to `'unopen'`; if `persistRejectedOpen` runs against a state file with an existing successful open, it could overwrite `proofStatus: 'open'` with `'unopen'`. Plan must guard `persistRejectedOpen` to load-existing-or-init and never reset proofStatus.

- **I-4** Task 1's tests + Tasks 3/4/8 use `initializeState()` no-arg; signature accepts `problemStatement` argument. Field becomes `undefined` in state. Not breaking but downstream (Task 13 closing-argument purity test) may catch undefined `problemStatement` propagating into envelope. Plan should pass a placeholder string to `initializeState` in test boilerplate.

- **I-5** Task 12 must-remain-green list omits `closing-argument-end-to-end.test.js` for the gate-failure-now-isError change.

- **I-6** Server.js handler call sites (`handleManageConcerns`, etc.) must thread consent to state-layer fns — plan covers this in Task 3 file list, but ordering of test patches and handler patches conflated. Patch handlers and tests in same commit.

## Minor Findings (advisory; defer)

- **M-1** Three withdraw-* function bodies (Task 10) share logic without a helper. Future contract change requires three identical edits. Refactor candidate post-D.1.
- **M-2** `operationLog` `provenance` field is a poor-man's discriminated union. Could become typed in a future schemaVersion bump.
- **M-3** `clearClosingFlags` anti-pattern (exported with "do not call" doc comment). Discipline maintained by inline pattern + Task 16 regression net.
- **M-4** `lastClosureArtifact` size unbounded — will grow with proof complexity. Eviction policy out of D.1 scope.
- **M-5** `state.js` responsibility overload — module will be ~700 lines post-D.1.
- **M-6** ID prefix routing currently consistent. Future ID format changes need `entityType` map update.

## Smell-Heuristic Triggers Matched

- `async` — handler signatures (`async function handleX`)
- `await` — test code in Task 13 + others
- `persistence` — atomic persistence section
- `boundary contract` — brief §10 D.2 inheritance language

Smell ran in parallel with attack; combined-report findings above.

## Recommendation

**Proceed with directed mitigations.** Apply Critical fixes (C-1 through C-5) inline before invoking execute-write. Important findings (I-1 through I-6) addressed in same revision pass. Minor findings noted for future work.

Estimated revision time: focused edits to Tasks 2, 3, 4, 11, 13, 14 — no architectural rework. After fixes land, plan can ship to execute-write at Significant→Moderate risk.

Alternative paths:

- **Proceed as-written (not recommended):** plan ships with known Critical bugs; implementer hits them as test failures during Tasks 2 and 13; recovery via in-flight plan amendments. Adds session friction; no permanent damage.
- **Return to design (overkill):** spec is sound; the issues are plan-text precision. No design rework needed.
- **Stop:** preserves plan-00 + this threat report as a record. Resume later with directed revisions.

<!-- chester-trailer-end -->

<!-- created-at: 2026-05-07T10:24:35Z -->
<!-- produced-by plan-build@v0004 -->
