# Plan Threat Report — Sprint D-1 Fix Proof MCP

**Plan:** `plan/sprint-d-1-fix-proof-mcp-plan-00.md`
**Spec:** `spec/sprint-d-1-fix-proof-mcp-spec-00.md`
**Plan-attack:** ran (always)
**Plan-smell:** ran (heuristic matched: new abstractions — `body-advancement.js`, `first-yes-gate.js`; new contract surfaces — `summary_mode`, `body_advancement`, `FIRST_YES_GATE_FAILED`)

## Combined Implementation Risk Level: **Significant**

Five reasons:

1. **A whole class of test-file collateral was not enumerated.** Plan-attack F1 found five test files (`acceptance.test.js`, `closing-argument.test.js`, `trigger-evaluator.test.js`, `consent.test.js`, `operation-log.test.js`) that directly import or call `lockConcerns` / `markChallengeUsed`. None are listed in the file lists for Tasks 10-12. Without enumerated updates the deletion tasks land a red commit, and the plan's "Must remain green" assertion fails verbatim.

2. **Three additional pre-existing assertions in already-listed files contradict the new vocabulary** (F3, F4, F5): `closing-argument-end-to-end.test.js:37` (`'closed'` literal), `trigger-evaluator.test.js:82-87` (asserts `'Concerns must be locked'` reason from a now-removed gate), and `server.test.js:448-492` (entire `concernsRatificationGate (NC-9)` describe block asserting `CONCERNS_UNLOCKED`/`CONCERNS_UNRATIFIED` codes). The plan acknowledges some failures will appear and instructs the implementer to handle them ad-hoc, but does not direct specific edits.

3. **One concrete correctness defect in plan instructions** (F6): the PROOF_FINISHED refusal table for `ratifyResolveCondition` claims a 2-element return shape (`[newState, error]`) — the actual shape is 3-element (`[newState, friction_hints, error]`). An implementer copying the table verbatim breaks `handleRatifyResolveCondition`'s destructuring in production code.

4. **Two semantic gaps that violate ACs** (F7, S5):
   - `handleOpenProof` writes `state.proofStatus = 'open'` at `server.js:829` and `865` and reads `existingState.proofStatus === 'open'` at `server.js:760`; `persistRejectedOpen` at `server.js:639` reads `'open'`/`'closed'`. Task 4 only addresses response-payload constructors. AC-1.1's "No code path produces any other value for `proofStatus`" is not honored — `'open'` survives in disk-written state, then gets backfilled on load.
   - `handleSubmitProofUpdate` does not call `classifyStateError`; it reads `result.errors[]` directly. Task 13's PROOF_FINISHED string in `applyOperations`' error array will not surface as `code: 'PROOF_FINISHED'` with `isError: true` — AC-7.1's "structured error with `code: 'PROOF_FINISHED'`" is violated for the most-called mutating tool.

5. **One smell-class issue with concrete user-visible impact** (F8 / S1): the summary-mode response includes `bodyAdvancement: state.bodyAdvancement ?? null`, but `bodyAdvancement` is a transient field on the `applyOperations` return — never persisted to disk by any task. The summary-mode field will always be null, producing a meaningless surface that suggests "no advancement yet" when the truth is "we don't track this here." Either persist it on state at submit time or drop it from the summary shape.

The remaining findings (F2, F9, F10, F11, F12, S2, S3, S4, S6) are minor — plan ambiguities and dead-code carry-overs that the implementer can navigate, or future-maintenance debt that doesn't break this sprint.

The plan does not need a redesign. It needs a directed plan-text patch that:
- Enumerates the five missing test files in Tasks 11/12 with specific edit instructions
- Adds explicit edits for `closing-argument-end-to-end.test.js:37`, the `concernsRatificationGate (NC-9)` describe block in `server.test.js`, and the `trigger-evaluator.test.js` lock-floor case
- Corrects the `ratifyResolveCondition` tuple shape in Task 13's table
- Extends Task 4 to cover `handleOpenProof` (lines 760, 829, 865) and `persistRejectedOpen` (line 639)
- Either persists `bodyAdvancement` on state at submit time (Task 5) or removes it from the summary-mode shape (Task 9)
- Routes `PROOF_FINISHED` through `classifyStateError` for `handleSubmitProofUpdate` (Task 13) — either via a wrapper in the handler or a `code:`/`isError:` pre-flight check before falling through to the existing rejected-response path
- Looks up a valid `WITHDRAWAL_DISPOSITIONS` value for the Task 14 scaffold (e.g. `'superseded'`) instead of the placeholder `'designer-decision'`

---

## Findings — Plan-Attack (12)

### CRITICAL — F1: Five test files import retired functions; not in plan file lists
- `__tests__/acceptance.test.js` imports `lockConcerns` (line 3); calls it at lines 89, 92, 101, 112, 144, 155, 170, 188, 232, 254, 275
- `__tests__/closing-argument.test.js` imports `lockConcerns` (line 4); calls at 10, 108, 146, 167, 237
- `__tests__/trigger-evaluator.test.js` imports `lockConcerns` (line 4); calls at 10
- `__tests__/consent.test.js` imports `lockConcerns` (line 4); calls at 53-67, 137; entire `describe('lockConcerns with consent')` block exists
- `__tests__/operation-log.test.js` imports `lockConcerns` and `markChallengeUsed` (line 2); test cases at line 24 (`'lockConcerns appends entry with op:lock'`) and line 63 (`'markChallengeUsed appends entry'`)

Tasks 11 and 12 delete these functions. The plan's file lists for both tasks omit all five files. Each will fail with import error after the respective deletion commit.

### HIGH — F2: `two-yes-flags.test.js` `clearClosingFlags` import not directly named in Task 3 instructions
Line 2 imports `clearClosingFlags`; lines 44-48 call it. Task 3 lists the file in commit set but does not direct the implementer to update line 2 + test body.

### HIGH — F3: `closing-argument-end-to-end.test.js:37` asserts `proofStatus === 'closed'`
Task 4 changes `recordDesignerGo` to emit `'finish'`. File is not in Task 4's edit list. Test fails after Task 4 commit.

### HIGH — F4: `trigger-evaluator.test.js:82-87` asserts `evaluateTrigger` produces "Concerns must be locked" reason
That reason came from `concernsRatificationGate`. Task 11 removes the call from `evaluateTrigger`. Test fails after Task 11.

### HIGH — F5: `server.test.js:448-492` `describe('handlePresentClosingArgument — concernsRatificationGate (NC-9)')` block asserts `CONCERNS_UNLOCKED`/`CONCERNS_UNRATIFIED` codes
Task 6 replaces the gate with `checkFirstYesGate`. Codes change to `FIRST_YES_GATE_FAILED`. Plan instructs ad-hoc fixture updates, no specific edit for this block.

### HIGH — F6: Task 13 PROOF_FINISHED tuple table wrong for `ratifyResolveCondition`
Plan claims `[newState, error]`. Actual shape (state.js:426, 430, 433, 435, 439, 464): `[newState, friction_hints, error]`. PROOF_FINISHED refusal `[state, 'PROOF_FINISHED: ...']` would emit a 2-element tuple; `handleRatifyResolveCondition` destructures three. Production breakage.

### MEDIUM — F7: `handleOpenProof` writes `state.proofStatus = 'open'` after Task 4
Sites: `server.js:829`, `server.js:865` (writes); `server.js:760` (read); `server.js:639` `persistRejectedOpen` (read). AC-1.1 violated. The disk-written state carries `'open'`; load-time backfill silently maps it to `'planning'`, but `server.test.js:185` reads the file and asserts `'open'` directly.

### MEDIUM — F8: `state.bodyAdvancement` never persisted (also S1)
Summary-mode handler reads `state.bodyAdvancement ?? null`. Field is set on `applyOperations` return, never on state. Summary always returns `null`.

### MEDIUM — F9: Snapshot capture vs flag-clear ordering ambiguity in Task 5
Task 3 inserts `resetFirstYesIfFired(current)` at lines 511-512. Task 5 inserts snapshot capture "after the `current` clone, around line 510-514." If implementer puts snapshot AFTER the helper call, snapshot captures already-cleared flags. (Functionally body-advancement doesn't read flags, so impact is subtle — but ordering should be pinned.)

### MEDIUM — F10: Task 6 test scaffold issues
Uses `await handlePresentClosingArgument(...)` — function is sync (harmless await). `const [, newState] = addConcern(state, ...)` — actual return is 4-element `[id, newState, friction_hints, error]`; second element is correct, but error is silently discarded.

### LOW — F11: `loadstate-backfill.test.js:18-19` legacy fixture includes retired field names
Fixture passes `concernsLocked: false`, `challengeModesUsed: []`, `challengeLog: []` directly into JSON. After backfill removal in Task 11/12, these fields pass through `loadState` unmolested. Not a runtime failure — informational.

### LOW — F12: Task 14 scaffold uses `disposition: 'designer-decision'` which isn't in `WITHDRAWAL_DISPOSITIONS`
`proof.js:43-45` lists `['consolidated', 'superseded', 'found-redundant', 'found-incorrect', 'scope-removed']`. Plan acknowledges in prose but template hardcodes invalid value.

---

## Findings — Plan-Smell (6)

### MEDIUM — S1: Same as F8 (bodyAdvancement never persisted)

### LOW-MEDIUM — S2: `concernsRatificationGate` becomes dead export
After Task 6 (server.js no longer calls it) + Task 11 (`evaluateTrigger` no longer calls it), function survives in metrics.js with no production caller. Test cases for `CONCERNS_UNRATIFIED` path remain. Maintenance trap.

### LOW — S3: `evaluateTrigger` RC ratification check structurally redundant after first-yes precondition
`metrics.js:441-443` checks `ratified_rc_count !== resolve_condition_count`. After `checkFirstYesGate` passes, this is impossible. Future cleanup needed; plan defers (per spec Non-Goals).

### LOW — S4: `body-advancement.js` snapshot vs full-state asymmetry not documented
`computeBodyAdvancement(prevSnapshot, currentState)` accepts a 3-field snapshot vs full state. Works today but is a future-extension trap.

### LOW — S5: `PROOF_FINISHED` won't surface as structured error in `submit_proof_update`
`handleSubmitProofUpdate` doesn't call `classifyStateError` (server.js:333-362). Reads `result.errors[]` directly. AC-7.1 violated for this tool — error appears as plain string, not `{ code: 'PROOF_FINISHED', isError: true }`.

### LOW — S6: Gate logic split between `first-yes-gate.js` and `evaluateTrigger`
`first-yes-gate.js` covers ratification gates (NCs/RCs/Concerns/Definitions). `evaluateTrigger` retains NC quality gates (`collapse_test`, `rejected_alternatives`). Spec comment "supersedes both gates" overstates; documentation debt.

---

## Verified Anchor Skip-List Provenance

The spec-stage ground-truth report verified the full enumerated anchor set. Plan-attack treated `proof.js:90` (entityType) and `state.js:140-142` (recordDesignerGo doc-comment exception) as trusted (untouched). All other anchors were re-verified because the plan modifies them.

<!-- created-at: 2026-05-08T16:00:00Z -->
<!-- produced-by plan-build@v0004 -->
