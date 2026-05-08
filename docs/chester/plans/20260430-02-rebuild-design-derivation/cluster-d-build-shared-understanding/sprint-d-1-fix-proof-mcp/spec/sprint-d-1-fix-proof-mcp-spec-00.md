# Spec: Sprint D-1 Fix Proof MCP

**Sprint:** 20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp
**Parent brief:** `docs/chester/working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp/design/sprint-d-1-fix-proof-mcp-design-00.md`
**Architecture:** Hybrid (principled-merge from design-specify) — purpose-built modules for the two pieces of new logic where module separation earns its keep (`body-advancement.js`, `first-yes-gate.js`); rename-in-place of `clearClosingFlags` to `resetFirstYesIfFired` within `state.js`; conservative deletion discipline on every existing-module retirement; mandatory correctness fixes applied where the deletion forces them (`closing-argument.js`, `applyOperations`, `loadState`).

## Goal

Run the maintenance pass on the proof MCP module that the d.2 design session's friction report demanded. Two structural retirements carry the work — collapse the proof lifecycle to a binary (planning, gate, finish; no reopen) and remove the structural challenge-mode machinery in favor of agent conduct discipline. Several smaller items ride alongside — a response-size cap on `get_proof_state`, a verification test for the universal withdraw routing on the open-questions class, and a first-yes precondition that gates closing-argument presentation on full per-element ratification. The change set is bounded to the proof-mcp module under `skills/design-large-task/proof-mcp/` plus targeted updates to the consuming SKILL.md. No element-type vocabulary changes, no master-plan rule amendments, no architectural rethink.

## Components

### New Files

- **`proof-mcp/body-advancement.js`** — pure-function module exporting `computeBodyAdvancement(prevSnapshot, currentState)`. Returns `{ advanced: boolean, addCount: number, reviseCount: number, withdrawCount: number }`. The signal counts adds, revises (revision counter incremented this round), and withdrawals across all load-bearing element types plus Concerns and Definitions. Bookkeeping operations (ratification flips, friction-disposition flips) do not count as advancement. No I/O, no imports from `state.js` or `server.js`.
- **`proof-mcp/first-yes-gate.js`** — pure-function module exporting `checkFirstYesGate(state)`. Returns `{ passed: boolean, unratifiedIds: string[] }`. Iterates active elements (NCs with `ratificationStatus === 'draft'`, RCs with `ratification === null`, Concerns with `status === 'draft'`, Definitions with `status === 'draft'`) and lists every identifier in working state. No I/O.
- **`proof-mcp/__tests__/body-advancement.test.js`** — focused tests for the body-advancement signal.
- **`proof-mcp/__tests__/first-yes-gate.test.js`** — focused tests for the first-yes precondition check.
- **`proof-mcp/__tests__/concern-withdraw-routing.test.js`** — end-to-end test verifying the universal withdraw tool routes `category: 'CONCERN'` to `withdrawConcern` correctly.
- **`proof-mcp/__tests__/get-proof-state-summary.test.js`** — covers the summary-mode flag on `get_proof_state` for the response-size cap.
- **`proof-mcp/__tests__/mid-review-revision.test.js`** — verifies that any create/revise/withdraw between presentation and second yes resets `closingArgPresentedRound` and forces re-derivation.
- **`proof-mcp/__tests__/first-yes-precondition.test.js`** — server-level test that `present_closing_argument` refuses with structured error when working elements exist.

### Modified Files

- **`proof-mcp/state.js`**
  - Replace `clearClosingFlags` with `resetFirstYesIfFired` and rewire every surviving inline reset site to call it. The d.1 codebase ships `clearClosingFlags` at `state.js:98-102` as exported but unused by production paths. Every mutating function uses an inline two-line pattern (`newState.closingArgPresentedRound = null; newState.closingArgGoRound = null;`). The codebase carries 16 inline reset pairs total; four disappear with the function deletions this sprint already lists (`clearClosingFlags` body at 99-100, `reopenProof` body at 234-235, `lockConcerns` body at 357-358, `markChallengeUsed` body at 729-730). The remaining **12 surviving inline sites** are converted to single calls of `resetFirstYesIfFired(newState)` (or `resetFirstYesIfFired(current)` / `resetFirstYesIfFired(withId)` matching the local clone variable name): `state.js:320-321` (addConcern), `state.js:394-395` (ratifyConcern), `state.js:443-444` (ratifyResolveCondition), `state.js:511-512` (applyOperations), `state.js:842-843` (manageFriction), `state.js:904-905` (overrideFrictionDisposition), `state.js:983-984` (manageDefinitions op:add), `state.js:1028-1029` (manageDefinitions op:revise), `state.js:1094-1095` (manageDefinitions op:ratify), `state.js:1152-1153` (withdrawElement), `state.js:1203-1204` (withdrawConcern), `state.js:1254-1255` (withdrawDefinition). The new function body is the existing two-line pattern in a named helper. `recordDesignerGo` continues to NOT call this reset — the closure path is the documented exception per `state.js:140-142`.
  - `initializeState`: remove fields `conditionCountHistory`, `elementCountHistory`, `challengeModesUsed`, `challengeLog`, `concernsLocked`, `lastClosureArtifact`. Change `proofStatus: 'unopen'` to `proofStatus: 'planning'`.
  - Delete functions: `lockConcerns`, `reopenProof`, `markChallengeUsed`.
  - `addConcern`: remove the `if (state.concernsLocked) { ... }` guard at lines 315-317.
  - `recordDesignerGo`: remove the NC and RC bulk-ratify loops. Remove the bulk-ratify operation log entries. Change the status transition value from `'closed'` to `'finish'`. Remove `lastClosureArtifact` assignment. Reject the call with structured error if `proofStatus === 'finish'` (no path back from finish).
  - `applyOperations`: remove the `conditionCountHistory.push(activeConditions)` line and the `elementCountHistory.push(...)` line. Remove `challengeTrigger` and `stallDetected` from the return object. Add `bodyAdvancement` to the return object computed by calling `computeBodyAdvancement` on a pre-mutation snapshot and the post-mutation state.
  - `loadState`: change default `proofStatus` from `'unopen'` to `'planning'`. Add backfill mapping legacy values (`'open' → 'planning'`, `'closed' → 'finish'`, `'unopen' → 'planning'`) for state files that predate this sprint. Remove backfills for `concernsLocked`, `lastClosureArtifact`, `conditionCountHistory`, `elementCountHistory`, `challengeModesUsed`, `challengeLog`. Remove the `defaultConcernStatus = raw.concernsLocked ? 'ratified' : 'draft'` block at `state.js:783` and replace with an unconditional `'draft'` default for unset concern status fields — under the new model, every concern starts in working state regardless of any prior lock value.
  - Imports: remove `detectChallenge` and `detectStall` from the import of `metrics.js` (these exports are deleted from `metrics.js`). Add `import { computeBodyAdvancement } from './body-advancement.js'`.

- **`proof-mcp/metrics.js`** — `concernsLocked` is read at four sites; each gets its own treatment:
  - Delete functions: `detectChallenge`, `detectStall`.
  - Delete constant: `STALL_WINDOW`.
  - `checkClosure` condition 7 (`metrics.js:346`, `if (state.concerns && ... && !state.concernsLocked)`): remove the entire condition (the lock concept is retired). Closure permissibility no longer checks lock state.
  - `checkClosure` condition 10 (`metrics.js:368`, `if (state.concernsLocked) { checkConcernCoverage... }`): change from `if (state.concernsLocked)` to `if (state.concerns && state.concerns.length > 0)`. Per-Concern coverage check fires unconditionally when concerns exist — the lock gate is gone, but coverage validation remains a closure precondition.
  - `concernsRatificationGate` (`metrics.js:399-417`): remove the `if (!state || !state.concernsLocked)` early return at line 400. Simplify the function body to draft-count check only. The `CONCERNS_UNLOCKED` error code path is retired entirely. The function now returns `{ passed: true }` or `{ passed: false, code: 'CONCERNS_UNRATIFIED', message }`.
  - `evaluateTrigger` (`metrics.js:423-470`): remove the entire `concernsRatificationGate` call at `metrics.js:457` and the `gate.code === 'CONCERNS_UNLOCKED'` branch at `metrics.js:459-461`. The first-yes precondition at the server tool handler (`handlePresentClosingArgument` via `checkFirstYesGate`) supersedes both gates inside `evaluateTrigger` — by the time `evaluateTrigger` runs (closing-argument score derivation), every element is already ratified by precondition, so the score-time gate is redundant.
  - `evaluateTrigger` coverage check (`metrics.js:466`, `if (state.concernsLocked) { checkConcernCoverage... }`): change from `if (state.concernsLocked)` to `if (state.concerns && state.concerns.length > 0)`. Same rationale as condition 10 — coverage validation remains, lock gate goes.

- **`proof-mcp/server.js`**
  - Remove `reopen_proof` from the `TOOLS` array. Remove `handleReopenProof` handler. Remove the dispatcher case for `reopen_proof`.
  - Remove the `op === 'lock'` branch from `handleManageConcerns`. Update the tool schema's `op` enum from `['add', 'lock', 'ratify']` to `['add', 'ratify']`.
  - Remove the `challenge_used` parameter from the `submit_proof_update` tool schema. Remove the `challenge_used` handling block from `handleSubmitProofUpdate`. Remove `challenge_trigger` and `stall_detected` from the response payload. Add `body_advancement` to the response payload (sourced from the `bodyAdvancement` field on the `applyOperations` return).
  - `handlePresentClosingArgument`: replace the `concernsRatificationGate(state)` call with a `checkFirstYesGate(state)` call from `first-yes-gate.js`. On gate failure, return a structured error with shape `{ code: 'FIRST_YES_GATE_FAILED', unratified_ids: [...] }` and `isError: true`. Existing post-gate derivation logic is preserved.
  - `handleGetProofState`: add support for an optional `summary_mode` boolean parameter on the tool schema. When `summary_mode === true`, the response carries `{ proofStatus, round, counts, closurePermitted, closureReasons, bodyAdvancement, elements: { [id]: { type, status } }, concerns: [{ id, status }], definitions: [{ id, status }] }` — counts and IDs only, no element bodies, no operation log. When the flag is absent or false, the response is unchanged from the current full-body shape.
  - Imports: remove `reopenProof`, `lockConcerns`, `markChallengeUsed` from the `state.js` import. Remove `detectChallenge` from the `metrics.js` import. Add `import { checkFirstYesGate } from './first-yes-gate.js'`.
  - Update every literal `proofStatus: 'open'` and `proofStatus: 'closed'` in response payload constructors to `'planning'` and `'finish'` respectively.
  - **Mandatory correctness fix at `server.js:413`** — `handleGetProofState` reads `if (state.concernsLocked) { response.concernCoverage = checkConcernCoverage(state); }` to gate the `concernCoverage` attachment on the response. With `concernsLocked` removed from state, this read becomes always-falsy and the response silently drops `concernCoverage`. Replace the gate with `if (state.concerns && state.concerns.length > 0) { ... }` so coverage is reported whenever concerns exist. Parallel rationale to the `closing-argument.js:27` fix and the `metrics.js:368` and `metrics.js:466` updates above.

- **`proof-mcp/closing-argument.js`**
  - Update the `lockedConcerns` partition condition from `state.concernsLocked` to `state.proofStatus === 'finish'`. This is a mandatory correctness fix — without it, removing `concernsLocked` from state would silently produce an always-empty `lockedConcerns` partition.
  - No other changes.

- **`proof-mcp/__tests__/reopen.test.js`** — delete the file.

- **`proof-mcp/__tests__/bulk-ratify.test.js`** — delete the file (covers the retired bulk-ratify hook).

- **`proof-mcp/__tests__/metrics.test.js`** — delete the `detectStall` and `detectChallenge` describe blocks. Delete the `concernsRatificationGate.CONCERNS_UNLOCKED` test cases. Update `checkClosure` and `evaluateTrigger` test fixtures to remove `concernsLocked` references.

- **`proof-mcp/__tests__/mutation-clears-flags.test.js`** — delete test cases for `lockConcerns`, `markChallengeUsed`, and `reopenProof`. Update remaining test cases to reference `resetFirstYesIfFired` where they previously referenced `clearClosingFlags`.

- **`proof-mcp/__tests__/state.test.js`** — remove tests covering `concernsLocked`, `challengeModesUsed`, `conditionCountHistory`, `lastClosureArtifact` initialization. Update tests that asserted `proofStatus: 'unopen'` initialization to assert `'planning'`. Add tests for the legacy-value backfill in `loadState`.

- **`proof-mcp/__tests__/concerns.test.js`** — remove tests covering `op:lock`. Verify add/ratify/withdraw operations remain green.

- **`proof-mcp/__tests__/server.test.js`** — remove tests for `reopen_proof`, `manage_concerns op:lock`, and the `challenge_used` parameter. Add tests for the first-yes precondition refusal shape, the summary-mode flag on `get_proof_state`, and the body-advancement signal in the submit response.

- **`proof-mcp/__tests__/two-yes-flags.test.js`** — update fixture vocabulary from `closed` to `finish`. Tests of the flag-clearing invariant remain (the rename of `clearClosingFlags` to `resetFirstYesIfFired` doesn't change the invariant, only the function name).

- **`skills/design-large-task/SKILL.md`**
  - Remove every reference to the `reopen_proof` tool, the `op:lock` operation on `manage_concerns`, the `challenge_used` parameter on `submit_proof_update`, and the three challenge mode personalities.
  - Remove the post-round procedure item that consumes `stall_detected` and `challenge_trigger` from the `submit_proof_update` response.
  - Add a brief description of the `body_advancement` field — agent-internal context only, never surfaced into designer-facing turn output.
  - Update the `present_closing_argument` description to reference the first-yes precondition and the `FIRST_YES_GATE_FAILED` error shape with `unratified_ids` listing.
  - Update the `manage_concerns` tool description to drop `op:lock` from the operation list.
  - Update the `get_proof_state` description to mention the optional `summary_mode` flag for long sessions.
  - Preserve every other instruction unchanged.

## Data Flow

### Round Mutation Flow

1. Agent calls `submit_proof_update` with `state_file`, `operations[]`, and `consent`.
2. Server handler validates consent shape, loads state, captures pre-mutation snapshot for body-advancement (element revision counters, active counts).
3. State-layer `applyOperations` runs the operation list. Each operation is dispatched, validated, applied, and recorded in the operation log. Every successful mutation calls `resetFirstYesIfFired` on the cloned state — if `closingArgPresentedRound` was set, both round flags clear.
4. After all operations apply, `applyOperations` calls `computeBodyAdvancement(snapshot, currentState)` and attaches the result to its return object as `bodyAdvancement`.
5. State-layer returns `{ state, applied[], withdrawn[], errors[], bodyAdvancement }`.
6. Server handler persists state via `saveState` (existing atomic write-tmp-then-rename pattern). Response payload includes the per-operation results plus the `body_advancement` field at the top level. Removed: `challenge_trigger`, `stall_detected`.

### First-Yes Precondition Flow

1. Agent calls `present_closing_argument` with `state_file` and `consent`.
2. Server handler validates consent, loads state.
3. Server handler calls `checkFirstYesGate(state)`. The pure check iterates every active element across every lane and returns `{ passed: boolean, unratifiedIds: string[] }`.
4. If `passed === false`, server handler returns `{ code: 'FIRST_YES_GATE_FAILED', unratified_ids: [...], message: 'Closing argument cannot be presented while elements are in working state' }` with `isError: true`. State is unchanged.
5. If `passed === true`, derivation runs unchanged via `deriveClosingArgument`. The closing argument is returned in the response and `closingArgPresentedRound` is recorded on state. State persists via the existing path.

### Mid-Review Revision Flow

1. Agent has previously called `present_closing_argument` successfully; `closingArgPresentedRound = currentRound`. Designer may have issued first yes — `closingArgGoRound` may be set or null.
2. Agent calls any mutating tool (`submit_proof_update`, `manage_concerns add/ratify`, `manage_definitions`, `manage_friction`, `override_friction_disposition`, `ratify_resolve_condition`, `withdraw`).
3. Tool handler dispatches into state layer; state-layer function calls `resetFirstYesIfFired(newState)` as part of its existing mutation discipline. Both `closingArgPresentedRound` and `closingArgGoRound` clear to null.
4. The agent must call `present_closing_argument` again to re-derive against the now-mutated body. The first-yes precondition runs fresh; if any element is now in working state due to a revise (revise resets ratification), presentation refuses.
5. Agent ratifies any newly-working elements, then re-presents.
6. Designer issues first yes again. If a further revision occurs, the cycle repeats. The second yes only succeeds when `closingArgGoRound === currentRound` per the existing eleventh-condition gate.

### Closure Flow

1. Agent calls `confirm_closure_go` with `state_file` and `consent`.
2. Server handler validates consent, loads state, calls `recordDesignerGo`.
3. State-layer `recordDesignerGo` checks the eleventh condition (designer go-choice in current round); refuses with `GO_REQUIRES_VIEW_THIS_ROUND` if `closingArgGoRound !== currentRound`.
4. On pass: `proofStatus = 'finish'`, append a single `op: 'close'` operation log entry with `provenance: { from: 'planning', to: 'finish' }`. No bulk-ratify loops execute (every element is already ratified by precondition). State persists.
5. After this point, every mutating tool refuses with `PROOF_FINISHED` structured error. No reopen path exists.

### Universal Withdraw on Concerns

1. Agent calls `withdraw` with `category: 'CONCERN'`, `element_id: 'CERN-N'`, `disposition`, `consent`.
2. Server handler validates consent. The `entityType()` helper in `proof.js` derives `'CONCERN'` from the `'CERN-'` prefix; the handler verifies the supplied `category` matches.
3. Handler dispatches to `withdrawConcern(state, concernId, disposition, consent)`.
4. State-layer function applies the withdrawal, appends an operation log entry, calls `resetFirstYesIfFired`, returns the new state.
5. Server persists. Response confirms the withdrawal. The verification test `concern-withdraw-routing.test.js` exercises this path end-to-end and asserts the operation log entry shape.

### Summary-Mode Response Shape

When `get_proof_state` is called with `summary_mode: true`:

```
{
  proofStatus: 'planning' | 'finish',
  round: number,
  counts: { ncs: number, rcs: number, rules: number, permissions: number,
            evidence: number, risks: number, frictions: number,
            concerns: number, definitions: number,
            ratified: { ncs, rcs, concerns, definitions } },
  closurePermitted: boolean,
  closureReasons: string[],
  bodyAdvancement: { advanced, addCount, reviseCount, withdrawCount } | null,
  elements: { [id]: { type, status } },
  concerns: [{ id, status }],
  definitions: [{ id, status }]
}
```

No element bodies, no operation log, no friction details, no closing-argument retention. The response stays under the 25K token limit even for sessions with 100+ elements.

## Error Handling

- **Consent validation failures.** Every mutating tool calls `validateConsentToken(consent)` before mutation. On invalid shape, return `{ code: 'INVALID_CONSENT', message }` with `isError: true`. State unchanged. No round increment. No flag clearing.
- **First-yes precondition failure.** `present_closing_argument` returns `{ code: 'FIRST_YES_GATE_FAILED', unratified_ids: [...], message }` with `isError: true`. State unchanged.
- **Post-finish mutation attempt.** Every mutating tool checks `proofStatus === 'finish'` before applying changes. On match, return `{ code: 'PROOF_FINISHED', message: 'Proof is finished; no further mutations permitted' }` with `isError: true`. State unchanged.
- **Closing argument re-presentation needed.** If a mutation between presentation and second yes resets the flags, the next `confirm_closure_go` call returns `GO_REQUIRES_VIEW_THIS_ROUND` (existing error) because `closingArgGoRound !== currentRound`. Caller re-presents.
- **Legacy `proofStatus` values on disk.** `loadState` backfills `'open' → 'planning'`, `'closed' → 'finish'`, `'unopen' → 'planning'` silently. No error surfaced to caller; the backfill persists when the next mutation triggers `saveState`.
- **Removed error codes.** `CONCERNS_UNLOCKED` is retired (no caller surface depends on it; the lock concept is gone). `STALL_DETECTED` and challenge-mode trigger codes are retired (no caller surface depends on them).
- **Persistence failures.** Existing `PERSIST_FAILED` envelope unchanged. The atomic write-tmp-then-rename pattern in `saveState` continues to provide all-or-nothing semantics.

## Testing Strategy

- **Vitest** is the existing harness. Every new test file follows the existing per-module convention (one source module ⇄ one test file).
- **New test coverage:** body-advancement signal computation across every operation type; first-yes-gate iteration across every lane and every state value; mid-review revision behavior end-to-end (present, mutate, observe flag reset); concern withdraw routing end-to-end; summary-mode response-size verification with a large fixture (40+ elements).
- **Removed test coverage:** `reopen.test.js` (entire file), `bulk-ratify.test.js` (entire file), the `detectStall` and `detectChallenge` describe blocks in `metrics.test.js`, and per-mechanism cases in `mutation-clears-flags.test.js`, `state.test.js`, `concerns.test.js`, `server.test.js`.
- **Updated test coverage:** every fixture using `proofStatus: 'closed'` updates to `'finish'`; every fixture using `concernsLocked: true` is retired; every test referencing `clearClosingFlags` updates the function name to `resetFirstYesIfFired`.
- **Baseline guarantee:** the test suite passes after every commit. No skipped tests, no disabled tests. If a retired mechanism's test cannot be cleanly removed (because it interleaves with preserved behavior), the test is rewritten against the preserved behavior.
- **Test count is not load-bearing.** Suite passing is. Retired-mechanism tests are removed alongside their mechanisms; new-mechanism tests are added; the absolute count after the sprint is incidental.
- **Verification at sprint close:** `npm test` from `proof-mcp/` returns 0 failures, 0 skipped tests.

## Constraints

- **Vocabulary lock honored verbatim.** Element type names, the term `ratified`, `closing argument`, `two-yes`, `first yes`, and the master-plan rule numbers are unchanged. The new vocabulary settled in `vocabulary-lock-list.md` (`planning`, `finish`, `working`, `body-advancement signal`, `first-yes precondition`, `mid-review revision`) is used consistently across all artifacts in scope.
- **Eight element types and their lanes preserved.** Designer-directed (Rules, Permissions), designer-explicit (Concerns, Necessary Conditions, Resolve Conditions, Definitions), agent-ratified (Evidence, Risks, Friction). No type changes, no lane reassignments.
- **Friction-detection logic unchanged.** `friction-detection.js` is not in the change set.
- **`proofStatus` field name preserved.** Only the value set changes (three values to two).
- **Per-element ratify motions for the designer-explicit lane preserved.** `ratifyConcern`, `ratifyResolveCondition`, `manageDefinitions op:ratify`, NC ratification — all untouched.
- **Minimal-surface discipline on retirement.** Existing-file edits delete what the brief names, apply the three mandatory correctness fixes both architects converged on, and stop. No opportunistic refactoring of unrelated areas.
- **Module-separation discipline on new logic.** New logic lives in two purpose-built modules (`body-advancement.js`, `first-yes-gate.js`). The third concept (mid-review reset) is handled by renaming `clearClosingFlags` to `resetFirstYesIfFired` in place within `state.js` rather than creating a third new module.
- **No external dependencies added.** No `npm install` of new packages.
- **Existing code patterns reused.** Pure-function module pattern (consistent with `metrics.js`, `proof.js`, `open-gate.js`); `structuredClone` + `cloneElements` defensive clone; `appendOperationLog` mutation discipline; vitest test structure.
- **Skill prompt synchronization.** `SKILL.md` is updated alongside the implementation in the same sprint commit set so the agent's instructions never reference retired surfaces.

## Non-Goals

- **No master-plan vocabulary changes.** Element type names stay as locked.
- **No architectural rethink of the proof system altitude.** That belongs in the cluster-D charter, not in this fix sprint.
- **No friction-detection logic changes.** Friction's auto-create logic and the four shapes (`permission-risk-linkage` and three hint-only) are unchanged.
- **No definitions G1 promotion path work.** The d.1 known-remaining item is deferred.
- **No documentation-only friction items addressed.** D-11 (rule-add semantics), D-12 (withdrawn-elements visibility) are deferred to a future documentation sweep.
- **No interview-cadence skill changes.** The presentation-layer fold-in document `challenge-personalities-fold-into-round-prompts.md` exists for a future presentation-layer sprint to consume; this sprint does not implement the round-prompt conduct items.
- **No renames of code-level identifiers not named in the retired-vocabulary list.** Variable names, comment text, and doc strings adjacent to retired mechanisms are not touched if they are not directly broken by the retirement.
- **No new abstractions beyond the two new modules.** The change is a maintenance pass, not a redesign.

## Acceptance Criteria

### AC-1.1 — proofStatus binary value set

**Observable boundary:**
- A call to `get_proof_state` after `initializeState` returns `proofStatus: 'planning'`.
- A call to `get_proof_state` after `confirm_closure_go` succeeds returns `proofStatus: 'finish'`.
- No code path produces any other value for `proofStatus`.

**Given:** A fresh proof state created via `initializeState`.
**When:** The state is read via `get_proof_state` before any closure has occurred.
**Then:** The returned `proofStatus` is the literal string `'planning'`. After a successful `confirm_closure_go`, the value is the literal string `'finish'`. The values `'unopen'`, `'open'`, and `'closed'` do not appear in the codebase as `proofStatus` values.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-1.2 — loadState backfills legacy proofStatus values

**Observable boundary:**
- A state file on disk with `proofStatus: 'open'` loads as a state with `proofStatus: 'planning'`.
- A state file with `proofStatus: 'closed'` loads as `proofStatus: 'finish'`.
- A state file with `proofStatus: 'unopen'` loads as `proofStatus: 'planning'`.

**Given:** A persisted state file written before this sprint shipped.
**When:** `loadState` reads the file.
**Then:** The returned in-memory state carries the new value-set; legacy values are mapped silently. No error is raised. The original file is unchanged on disk until the next mutation triggers `saveState`.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-2.1 — reopen motion fully removed

**Observable boundary:**
- The `reopen_proof` tool is not present in the tool catalog returned by the MCP server.
- The `reopenProof` function is not exported from `state.js`.
- The `lastClosureArtifact` field is not present on state objects returned by `initializeState` or `get_proof_state`.

**Given:** The proof MCP server is started.
**When:** A client lists tools or attempts to call `reopen_proof`.
**Then:** The tool does not appear in the catalog. An attempt to call it returns a tool-not-found error from the MCP harness. No code path inside the proof system can transition `proofStatus` from `'finish'` back to `'planning'`.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-2.2 — manage_concerns op:lock fully removed

**Observable boundary:**
- The `op` enum on the `manage_concerns` tool schema is exactly `['add', 'ratify']`.
- A call with `op: 'lock'` returns a schema-validation error.
- The `concernsLocked` field is not present on state objects.
- The `lockConcerns` function is not exported from `state.js`.

**Given:** The proof MCP server is running with the new tool surface.
**When:** A client inspects the `manage_concerns` schema or attempts `op: 'lock'`.
**Then:** The schema does not include `'lock'` in the enum. A `'lock'` call is rejected at schema validation. State objects carry no `concernsLocked` field. Adding a Concern at any time during the planning phase succeeds regardless of how many Concerns previously existed.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-2.3 — three challenge personalities removed

**Observable boundary:**
- The `detectChallenge` and `detectStall` functions are not exported from `metrics.js`. The `STALL_WINDOW` constant is removed.
- The `markChallengeUsed` function is not exported from `state.js`.
- The fields `challengeModesUsed`, `conditionCountHistory`, `elementCountHistory`, `challengeLog` do not appear on state objects.
- The `challenge_used` parameter is not present on the `submit_proof_update` tool schema.
- The response of `submit_proof_update` does not include `challenge_trigger` or `stall_detected` fields.

**Given:** The proof MCP server is running with the new surface.
**When:** A client inspects the `submit_proof_update` schema, calls the tool, or reads state.
**Then:** No challenge-mode personality artifact (function, field, parameter, response key, log entry, error code) appears in the surface or in the state.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-2.4 — bulk-ratify hook removed from second yes

**Observable boundary:**
- A successful `confirm_closure_go` call does not transition any draft NC or RC to ratified status as a side effect.
- The operation log records exactly one entry for the closure: `op: 'close'` with `provenance: { from: 'planning', to: 'finish' }`.

**Given:** A proof state where the first-yes precondition has passed (every element ratified) and the second yes is being recorded.
**When:** `confirm_closure_go` succeeds.
**Then:** The proofStatus transitions to `'finish'` and exactly one operation log entry is appended. No additional entries with `op: 'bulk-ratify-nc'` or `op: 'bulk-ratify-rc'` are appended. Element ratification states are unchanged from their pre-closure values.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-3.1 — body-advancement signal computed on every round

**Observable boundary:**
- The response of `submit_proof_update` includes a top-level `body_advancement` object with shape `{ advanced: boolean, addCount: number, reviseCount: number, withdrawCount: number }`.
- A round that adds at least one load-bearing element returns `advanced: true` with `addCount >= 1`.
- A round that performs only ratifications or disposition flips returns `advanced: false` with all counters at 0.

**Given:** A proof state at any round.
**When:** `submit_proof_update` is called with one or more operations.
**Then:** The response carries the body-advancement object computed by `computeBodyAdvancement` against a pre-mutation snapshot and the post-mutation state. Bookkeeping operations (ratification flips, friction-disposition flips) do not increment any counter.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-3.2 — body-advancement signal not surfaced to designer

**Observable boundary:**
- The skill SKILL.md instructions explicitly state that `body_advancement` is consumed by the agent's working context only and is not echoed into the designer-facing turn output.
- No tool description, no error message, and no closing-argument envelope field references `body_advancement`.

**Given:** The skill prompt and the proof MCP tool surfaces are both updated for this sprint.
**When:** A designer reads the agent's turn output across the full design conversation.
**Then:** The body-advancement signal does not appear in any designer-visible surface. It exists only in the agent's own context as a discipline signal for the round-prompt conduct items.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-4.1 — first-yes precondition refuses on working elements

**Observable boundary:**
- A call to `present_closing_argument` returns a structured error with `code: 'FIRST_YES_GATE_FAILED'` when any active element is in working state across any of the four affected lanes (NCs with `ratificationStatus: 'draft'`, RCs with `ratification: null`, Concerns with `status: 'draft'`, Definitions with `status: 'draft'`).
- The error response includes a `unratified_ids` array listing every working-state element identifier.
- State is unchanged after the refusal.

**Given:** A proof state with at least one working-state element.
**When:** `present_closing_argument` is called.
**Then:** The handler returns `{ code: 'FIRST_YES_GATE_FAILED', unratified_ids: [<list of ids>], message: <human text> }` with `isError: true`. The closing argument is not derived. State is not persisted (or is persisted with no change). No round flags are set or cleared.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-4.2 — first-yes precondition passes when all elements ratified

**Observable boundary:**
- A call to `present_closing_argument` against a fully-ratified body returns the closing argument envelope.
- `closingArgPresentedRound` is set to the current round value on state.

**Given:** A proof state where every active element across every lane is ratified.
**When:** `present_closing_argument` is called.
**Then:** The closing argument is derived and returned. State is mutated to record the presentation round. No error is raised.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-4.3 — mid-review revision resets first-yes flags

**Observable boundary:**
- After a successful `present_closing_argument` (and optionally a first yes recorded by the designer), any subsequent mutating tool call clears both `closingArgPresentedRound` and `closingArgGoRound` on state.
- The next `confirm_closure_go` call refuses with `GO_REQUIRES_VIEW_THIS_ROUND` until `present_closing_argument` is called again.

**Given:** A proof state with `closingArgPresentedRound = N` (and optionally `closingArgGoRound = N`).
**When:** Any mutating operation runs (`submit_proof_update`, `manage_concerns add/ratify`, `manage_definitions`, `manage_friction`, `override_friction_disposition`, `ratify_resolve_condition`, `withdraw`).
**Then:** Both flags are reset to null on the post-mutation state. The closing argument must be re-presented before the second yes can be recorded.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-4.4 — Inline flag-reset pattern replaced by named helper

**Observable boundary:**
- The function `clearClosingFlags` is not exported from `state.js` (dead code retired).
- The function `resetFirstYesIfFired` is exported from `state.js` with the two-line body that clears `closingArgPresentedRound` and `closingArgGoRound` to null.
- Every surviving mutating function that previously cleared the flags inline invokes `resetFirstYesIfFired(...)` instead. The 12 surviving inline reset sites become single function calls: `state.js:320-321` (addConcern), `394-395` (ratifyConcern), `443-444` (ratifyResolveCondition), `511-512` (applyOperations), `842-843` (manageFriction), `904-905` (overrideFrictionDisposition), `983-984`/`1028-1029`/`1094-1095` (manageDefinitions add/revise/ratify), `1152-1153` (withdrawElement), `1203-1204` (withdrawConcern), `1254-1255` (withdrawDefinition).
- The four inline sites that disappeared along with retired functions (`clearClosingFlags` body at 99-100, `reopenProof` at 234-235, `lockConcerns` at 357-358, `markChallengeUsed` at 729-730) are gone with their containing functions; no rewiring needed for those.
- `recordDesignerGo` continues to NOT call `resetFirstYesIfFired` — the closure path is the documented exception per the existing doc comment at `state.js:140-142`.

**Given:** The post-sprint codebase.
**When:** Any reader greps for inline `closingArgPresentedRound = null` patterns across `state.js`.
**Then:** Inline assignments survive only inside the body of `resetFirstYesIfFired` itself. Every other mutating function calls the named helper. `clearClosingFlags` is not present anywhere in the file.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-5.1 — universal withdraw routes Concerns end-to-end

**Observable boundary:**
- A call to `withdraw` with `category: 'CONCERN'`, a valid `CERN-N` identifier, a valid disposition for Concerns, and a valid consent token transitions the Concern to `status: 'withdrawn'`.
- The operation log records an entry with the withdrawal payload.
- A subsequent `get_proof_state` call shows the Concern in withdrawn state.

**Given:** A proof state with at least one active Concern.
**When:** `withdraw({ state_file, category: 'CONCERN', element_id: 'CERN-N', disposition, consent })` is called.
**Then:** The Concern's status flips to `'withdrawn'`. The operation log carries the entry. The body-advancement signal returned in the response increments `withdrawCount`. The verification test exercises the full round trip.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-5.2 — get_proof_state summary mode caps response size

**Observable boundary:**
- A call to `get_proof_state` with `summary_mode: true` returns a payload whose serialized JSON length is bounded by counts and identifiers, not by element body content.
- For a fixture state with 40+ elements, the summary-mode response stays under the 25K token MCP harness limit.
- The full response shape (without the flag or with `summary_mode: false`) is unchanged from the d.1 implementation.

**Given:** A proof state with at least 40 elements.
**When:** `get_proof_state` is called with `summary_mode: true`.
**Then:** The response carries the summary shape (counts, IDs, statuses, no element bodies, no operation log). The serialized JSON fits comfortably within the harness limit.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-6.1 — closing-argument lockedConcerns partition uses proofStatus

**Observable boundary:**
- The `lockedConcerns` field in the closing argument envelope is non-empty only when `state.proofStatus === 'finish'`.
- During the planning phase, `lockedConcerns` is an empty array.

**Given:** A proof state with active Concerns.
**When:** `deriveClosingArgument` runs during the planning phase versus during the finish phase.
**Then:** During planning, `lockedConcerns: []`. During finish, `lockedConcerns` carries every active Concern. (The closing argument is derived only during planning per the existing flow; this AC ensures the partition logic is correct after the `concernsLocked` field is removed.)

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-6.2 — applyOperations does not crash on retired history fields

**Observable boundary:**
- A successful `submit_proof_update` call against a state initialized post-sprint does not throw `TypeError: Cannot read properties of undefined`.
- The `conditionCountHistory.push(...)` and `elementCountHistory.push(...)` calls are removed from `applyOperations`.

**Given:** A fresh proof state created via `initializeState` (post-sprint shape).
**When:** `submit_proof_update` is called with any valid operation.
**Then:** The call succeeds without runtime errors. No code path attempts to push onto a removed array field.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-7.1 — post-finish mutations refused

**Observable boundary:**
- After a successful `confirm_closure_go`, any subsequent call to a mutating tool returns a structured error with `code: 'PROOF_FINISHED'`.
- State is unchanged on every refused call.

**Given:** A proof state where `proofStatus === 'finish'`.
**When:** Any state-touching tool is called (`submit_proof_update`, `manage_concerns`, `manage_definitions`, `manage_friction`, `override_friction_disposition`, `ratify_resolve_condition`, `withdraw`, `present_closing_argument`). `present_closing_argument` is included because it sets `closingArgPresentedRound` on success — under the binary lifecycle, even that derivation-plus-flag step must be refused once the proof is finished. `get_proof_state` is read-only and remains available.
**Then:** The handler refuses with `{ code: 'PROOF_FINISHED', message }` and `isError: true`. State is not mutated. The `proofStatus` value remains `'finish'` and is the terminal state.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-8.1 — SKILL.md updated alongside implementation

**Observable boundary:**
- `skills/design-large-task/SKILL.md` does not reference `reopen_proof`, `op:lock`, `challenge_used`, the three challenge mode personalities, `stall_detected`, or `challenge_trigger`.
- `SKILL.md` references `body_advancement` (agent-internal only), the first-yes precondition with `FIRST_YES_GATE_FAILED` error shape, and the optional `summary_mode` flag on `get_proof_state`.

**Given:** The post-sprint repository.
**When:** A reader inspects `SKILL.md` against the proof MCP tool surface.
**Then:** Every tool reference in `SKILL.md` matches a tool in the new surface; every retired surface is absent from the document; the new surfaces are described with the discipline they require.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-8.2 — full test suite passes after sprint

**Observable boundary:**
- `npm test` from `proof-mcp/` returns 0 failures and 0 skipped tests.
- Tests covering retired mechanisms (reopen, bulk-ratify, lock, three personalities, count-based stall) are removed from the suite, not skipped.
- Tests covering new mechanisms (body-advancement, first-yes-gate, mid-review revision, summary mode, concern withdraw routing) are present and passing.

**Given:** The post-sprint codebase.
**When:** The test suite is executed.
**Then:** All tests pass. No test is marked `.skip` or `.todo`. The retired-mechanism tests are deleted from their files (or whole files are deleted).

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

<!-- created-at: 2026-05-08T15:11:22Z -->
<!-- produced-by design-specify@v0003 -->
