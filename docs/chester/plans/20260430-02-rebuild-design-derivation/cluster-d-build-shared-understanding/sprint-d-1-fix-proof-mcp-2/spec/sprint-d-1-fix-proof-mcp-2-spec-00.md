# Spec: Sprint D-1 Fix Proof MCP 2

**Sprint:** `20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp-2`
**Parent brief:** `docs/chester/working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp-2/design/proof-mcp-problems-report-02.md`
**Architecture:** Hybrid principled-merge — Block A's dedicated-tool mechanism (one new state function + tool + handler mirroring `ratify_resolve_condition` line-for-line) plus Block B's lightly-broad summary-document scope (proposed PERM-2 revised text and NCON-15 pending-decision note authored in the fix-sprint summary, no extra code work). Optimization target: ship the unblock fast (half-day code work) while leaving sprint-d-2 resume with everything needed to land PERM-2 alignment in one ratify-readback turn.

## Goal

Restore the closure path of the proof MCP. Sprint-d-1-fix-proof-mcp introduced a per-element first-yes precondition gate (`first-yes-gate.js`) that requires every active Necessary Condition to have `ratificationStatus === 'ratified'` before `present_closing_argument` can fire — and removed the only existing code path that ever flipped that field (the bulk-ratify hook in `recordDesignerGo`). The result: NCs are unratifiable, the gate is unreachable, formal closure cannot occur, and the closing-argument envelope cannot be produced. This sprint ships a dedicated `ratify_necessary_condition` tool mirroring `ratify_resolve_condition` exactly, fixes the resulting downstream contamination (stale comment, closing-argument partition), adds an integration test exercising the full closure path so this class of cross-AC interaction miss is caught in CI, updates the SKILL.md tool list, and produces summary-document deliverables for sprint-d-2 resume to act on (proposed PERM-2 revised text aligning with the new tool surface; NCON-15 lifecycle-gap note as a pending sprint-d-2 design decision). Scope is bounded to `skills/design-large-task/proof-mcp/` plus targeted SKILL.md edits and the fix-sprint summary; no element-type vocabulary changes, no master-plan amendments, no PERM-2 mutation in any live proof state.

## Components

### New Files

- **`proof-mcp/__tests__/ratify-necessary-condition.test.js`** — focused unit tests for the new state function and server handler. Coverage: happy-path mutation (ratificationStatus → 'ratified'), consent-token rejection, post-finish guard refusal, non-NC element rejection, withdrawn-NC rejection, ALREADY_RATIFIED guard, `resetFirstYesIfFired` invariant verified, ratificationLog entry shape verified, operationLog entry shape verified.
- **`proof-mcp/__tests__/closure-path-integration.test.js`** — end-to-end test exercising the full closure path. Build state with N active NCs + 1 active RC + 1 Concern + 1 Definition; ratify each via dedicated tools; advance round to ≥ 3; call `present_closing_argument` (expect success, no FIRST_YES_GATE_FAILED); call `confirm_closure_go` (expect proofStatus → 'finish'); verify closing-argument envelope `activeNCs` non-empty and `draftNCs` empty; verify mid-revision cycle (revise NC statement → ratificationStatus reverts to draft → first-yes gate fails → re-ratify → first-yes passes).

### Modified Files

- **`proof-mcp/state.js`** — add `export function ratifyNecessaryCondition(state, { elementId, ratificationText }, consent)` after `ratifyResolveCondition` (insertion point around line 365). The function mirrors `ratifyResolveCondition` line-for-line in structure: validate consent token, refuse if `state.proofStatus === 'finish'`, look up element by `elementId` (return NOT_FOUND on miss), refuse if `target.type !== 'NECESSARY_CONDITION'`, refuse if `target.status !== 'active'`, refuse with `ALREADY_RATIFIED` if `target.ratificationStatus === 'ratified'`, refuse if `ratificationText` missing or empty, `structuredClone(state)` + `cloneElements(state.elements)`, call `resetFirstYesIfFired(newState)`, set `updatedTarget.ratificationStatus = 'ratified'`, push `{ event: 'ratified', target: elementId, round: state.round, ratificationText }` to `newState.ratificationLog`, append operationLog entry `{ round, op: 'ratify', entityId: elementId, type: 'NECESSARY_CONDITION', consent, changedFields: ['ratificationStatus'], provenance: { ratificationText } }`, return `[newState, null]`. The two-tuple return shape matches `ratifyConcern`'s pattern (no friction processing — NC ratification is not a friction trigger).

- **`proof-mcp/server.js`** — three changes:
  1. Add `ratifyNecessaryCondition` to the named imports from `'./state.js'` (existing import line near top of file).
  2. Add `ratify_necessary_condition` tool definition to the `TOOLS` array immediately after the `ratify_resolve_condition` entry. Schema mirrors `ratify_resolve_condition`: `state_file` (string), `element_id` (string, NCON-N), `ratification` (string, sign-off text), `consent` (CONSENT_SCHEMA). Required: all four fields. Description: "Ratify a single Necessary Condition. Sequential by design — accepts one element_id per call; batch shapes are not supported. Refused when proof is finished, when the NC is not active (withdrawn), when the NC is already ratified, or when consent token is invalid."
  3. Add `case 'ratify_necessary_condition': return handleRatifyNecessaryCondition(args);` to the dispatcher switch.
  4. Add `handleRatifyNecessaryCondition({ state_file, element_id, ratification, consent })` function after `handleRatifyResolveCondition`. Mirrors `handleRatifyResolveCondition` structure: load state, post-finish guard returns `proofFinishedResponse()`, call `ratifyNecessaryCondition(state, { elementId: element_id, ratificationText: ratification }, consent)`, on error return `classifyStateError(err)` with `isError: true`, on success `saveState(newState, state_file)` then return `{ status: 'accepted', element_id, ratificationStatus: 'ratified', closure_permitted, closure_reasons }` from `checkClosure(newState)`.

- **`proof-mcp/proof.js`** — update the comment at line 245. Before: `// NC-only ratificationStatus (NC-18, RULE-8): bulk-ratified at confirm_closure_go;`. After: `// NC-only ratificationStatus (NC-18, RULE-8): per-element ratify via ratify_necessary_condition; reset to 'draft' on revise of statement or grounding.`

- **`proof-mcp/__tests__/mutation-clears-flags.test.js`** — add one `it()` case verifying that `ratifyNecessaryCondition` clears both `closingArgPresentedRound` and `closingArgGoRound` when they were set on the input state. Pattern mirrors existing test cases for the other ratify mutators.

- **`skills/design-large-task/SKILL.md`** — insert one bullet in the proof-MCP toolset section immediately after the `ratify_resolve_condition` bullet (around line 434). Bullet text: `- **\`ratify_necessary_condition\`** — designer's sign-off on a single Necessary Condition. Sequential by design; one element_id (NCON-N) per call. Sets ratificationStatus to 'ratified' on success. Refused when proof is finished, when the NC is withdrawn, when the NC is already ratified, or when consent token is invalid.`

- **Cross-sprint decision-record corpus** — append a new entry. Filename and location follow the established pattern from sprint-d-1-fix-proof-mcp's decision-record commits (commit 84ef381 references "append 7 sprint-d-1-fix-proof-mcp records to cross-sprint corpus"). The entry records: the cross-AC interaction miss between AC-2.4 (bulk-ratify removal) and AC-4.1 (first-yes precondition addition); the chosen fix path (per-element dedicated tool, mirroring `ratify_resolve_condition`); the closure-path integration test added to catch this class of miss in CI; lessons applicable to future maintenance sprints (whenever a gate is added, verify a write path exists for every element type the gate references).

### Summary-Document Deliverables (Authored at Finish-Phase)

These are content additions to the fix-sprint summary file `summary/sprint-d-1-fix-proof-mcp-2-summary-00.md`. They produce no code change, but they are first-class deliverables of this sprint and have their own ACs.

- **Proposed PERM-2 revised text** — section in summary file under heading `## Proposed PERM-2 Revised Text (for sprint-d-2 resume)`. Contains: (a) the current PERM-2 statement (verbatim from `sprint-d-2-proof-state.json`); (b) the proposed revised statement aligned with the new tool surface; (c) rationale paragraph explaining why Rules / Permissions / Evidence / Risks are excluded from ratify-bundle scope (they carry provenance via the `source` field, not a ratify lifecycle); (d) coordination note describing how sprint-d-2 resume should land the change (designer ratify-readback turn; `submit_proof_update op:revise` against PERM-2 with consent source `designer`).

- **NCON-15 pending-decision note** — section in summary file under heading `## NCON-15 Lifecycle Gap (sprint-d-2 owned)`. Contains: (a) the current NCON-15 statement (verbatim); (b) observation that NCON-15 describes draft-then-review for NC text authoring but is silent on the orthogonal `ratificationStatus` lifecycle; (c) the two paths sprint-d-2 can take (revise NCON-15 to add a sentence about the ratify step, or author a new NC covering the ratify lifecycle as a separate concern); (d) explicit deferral statement: "This is a sprint-d-2 design decision; the fix sprint does not touch the proof state."

## Data Flow

### Ratify Necessary Condition Flow

1. Agent calls `ratify_necessary_condition` with `{ state_file, element_id: 'NCON-N', ratification: '<sign-off text>', consent: { source, rationale? } }`.
2. Server dispatcher routes to `handleRatifyNecessaryCondition`.
3. Handler calls `loadState(state_file)` — JSON deserialized; `state.elements` reconstructed as Map; `loadState` legacy backfill at `state.js:693` runs (no change to backfill logic — `ratificationStatus ??= 'draft'` already idempotent for any input).
4. Post-finish guard: if `state.proofStatus === 'finish'`, handler returns `proofFinishedResponse()` with `isError: true`. State unchanged.
5. Handler calls `ratifyNecessaryCondition(state, { elementId: element_id, ratificationText: ratification }, consent)`.
6. State function validates consent via `validateConsentToken(consent)` — error path returns `[state, INVALID_CONSENT_ERROR]`.
7. Defense-in-depth: state function checks `state.proofStatus === 'finish'`; returns PROOF_FINISHED on miss.
8. Element lookup: `state.elements.get(elementId)`. Miss returns NOT_FOUND.
9. Type guard: `target.type === 'NECESSARY_CONDITION'`. Miss returns TYPE_MISMATCH.
10. Status guard: `target.status === 'active'`. Miss returns ELEMENT_NOT_ACTIVE.
11. Already-ratified guard: `target.ratificationStatus !== 'ratified'`. Miss returns ALREADY_RATIFIED (new error code; falls through `classifyStateError` to DOMAIN_ERROR until the classifier is extended).
12. Ratification text guard: non-empty string required. Miss returns INVALID_RATIFICATION_TEXT.
13. Clone: `newState = structuredClone(state)`; `newState.elements = cloneElements(state.elements)`.
14. First-yes flag reset: `resetFirstYesIfFired(newState)` clears both `closingArgPresentedRound` and `closingArgGoRound` to null when either is set.
15. Mutation: `updatedTarget = newState.elements.get(elementId)`; `updatedTarget.ratificationStatus = 'ratified'`.
16. Logs: ratificationLog push `{ event: 'ratified', target: elementId, round, ratificationText }`; operationLog append per shape above.
17. Return `[newState, null]`.
18. Handler persists via `saveState(newState, state_file)` (atomic write-tmp-then-rename).
19. Handler computes `closure_permitted, closure_reasons` via `checkClosure(newState)`.
20. Handler returns `{ status: 'accepted', element_id, ratificationStatus: 'ratified', closure_permitted, closure_reasons }`.

### Mid-Revision Cycle

1. NC ratifies via `ratify_necessary_condition` — `ratificationStatus = 'ratified'`.
2. Designer issues a revision: `submit_proof_update` with `{ op: 'revise', target: 'NCON-N', statement: '<new text>' }` (or `grounding: [...]`).
3. State function `applyOperations` clones state, processes revise, reaches the existing reset at `state.js:531` which detects `op:revise` of `statement` or `grounding` and sets `target.ratificationStatus = 'draft'`.
4. `present_closing_argument` now refuses with FIRST_YES_GATE_FAILED listing this NC's id.
5. Designer ratifies again via `ratify_necessary_condition` — gate clears.

### Closure Path End-to-End

1. State has N NCs (active, all ratified), 1 RC (active, ratified), 1 Concern (status: ratified), 1 Definition (status: ratified). Round ≥ 3.
2. Agent calls `present_closing_argument`.
3. Handler calls `checkFirstYesGate(state)`. Iterator visits each active NC; every `ratificationStatus === 'ratified'` so none push to `unratifiedIds`. RC has non-null `ratification`. Concern and Definition have `status === 'ratified'`. Gate returns `{ passed: true, unratifiedIds: [] }`.
4. `evaluateTrigger` runs (existing); aggregate score check passes.
5. `deriveClosingArgument` builds envelope. `closing-argument.js:71` partitions active NCs: every NC has `ratificationStatus === 'ratified'` so all land in `activeNCs`; `draftNCs` is empty. Other partitions populate per existing logic.
6. State records `closingArgPresentedRound = currentRound`. Response returns full closing-argument envelope.
7. Agent calls `confirm_closure_go`. Handler verifies `closingArgGoRound !== currentRound` precondition is satisfiable (state hasn't shifted since presentation), then `recordDesignerGo` flips `proofStatus = 'finish'` and appends close operationLog entry.
8. After this point, every mutating tool refuses with PROOF_FINISHED. The proof is sealed.

## Error Handling

- **`INVALID_CONSENT`** — consent token missing, malformed, or fails source validation. Existing pattern; no new behavior.
- **`PROOF_FINISHED`** — call attempted post-finish. Existing pattern from `proofFinishedResponse()`. Returned from both handler-layer and state-layer pre-flight.
- **`NOT_FOUND`** — element_id does not exist in state. Existing pattern; `classifyStateError` routes to structured error.
- **`TYPE_MISMATCH`** — element exists but is not an NC. Returned by state function with message naming the actual type for forensic clarity.
- **`ELEMENT_NOT_ACTIVE`** — element is withdrawn. Returned by state function.
- **`ALREADY_RATIFIED`** — element is an NC, active, but already ratified. New error code. State function returns the string `ALREADY_RATIFIED: NC <id> is already ratified`. `classifyStateError` falls through to DOMAIN_ERROR (acceptable per Architect A's analysis; can be promoted to a coded error in a future sprint without contract break).
- **`INVALID_RATIFICATION_TEXT`** — `ratification` parameter missing or empty string. Returned by state function.
- State remains unchanged on every error path (no clone applied, no save called).

## Testing Strategy

- **Unit tests** in `__tests__/ratify-necessary-condition.test.js` cover every error path and the happy path. Patterns inherit from existing `ratify-resolve-condition.test.js` (verify by reading the existing file and matching scaffold). Approximately 9 `it()` cases.
- **Integration test** in `__tests__/closure-path-integration.test.js` exercises the full closure path (NC create → NC ratify → RC ratify → Concern ratify → Definition ratify → present_closing_argument → confirm_closure_go) and the mid-revision cycle. Approximately 4–6 `it()` cases.
- **Mutation-clears-flags coverage** extended in `__tests__/mutation-clears-flags.test.js` — one new `it()` case for the NC ratify path.
- **Existing test suite** (509 tests pre-fix per sprint-d-1-fix-proof-mcp summary) must remain green. No existing test exercises a write path to NC `ratificationStatus = 'ratified'`, so no existing test should change behavior.
- Final test count target: 509 + 9 (unit) + 5 (integration mean) + 1 (flags) = ~524 tests. Number is approximate; the AC requires "all green," not a specific count.

## Constraints

- **No element-type vocabulary changes.** Master plan vocabulary lock holds. No new element types; no renames.
- **No master-plan amendments.** Master plan §5 (Evidence Inheritance), §6 (Rules Inheritance), §11 (set-aside R1–R10 for cluster D) all unchanged.
- **No mutation of any live proof state file.** PERM-2 in `sprint-d-2-proof-state.json` is unchanged by this sprint; the proposed revised text lands in the fix-sprint summary only. Sprint-d-2 resume owns the live mutation.
- **No NCON-15 mutation.** Same rule — NCON-15 is in `sprint-d-2-proof-state.json`; the fix-sprint summary documents the pending decision but does not touch the proof state.
- **Consent token discipline preserved.** Every mutating tool requires `{ source, rationale? }` consent. The new `ratify_necessary_condition` tool follows this pattern.
- **Post-finish refusal universally applied.** AC-7.1 from sprint-d-1-fix-proof-mcp ships post-finish mutation refusal across all mutators. The new tool adheres.
- **Single-op-per-call discipline preserved.** RULE-16 hook 3 (one op per state-mutating tool call) applies to the new tool: single `element_id`, no batch shape.
- **Tool surface grows by one.** Pre-fix proof MCP has 11 tools (per Architect A's count). Post-fix has 12. Acceptable per the dedicated-tool axis chosen.

## Non-Goals

- **Mutation of live proof state.** PERM-2 text revision and NCON-15 lifecycle revision are explicitly deferred to sprint-d-2 resume.
- **Bulk NC ratify.** No tool ships that batches NC ratifications. Per-element discipline is the chosen architecture.
- **Ratify concept for Rules / Permissions / Evidence / Risks.** Out of scope. These elements carry provenance via `source` field; ratify lifecycle does not apply.
- **Removal or relaxation of the first-yes gate.** The gate stays exactly as sprint-d-1-fix-proof-mcp shipped it; this sprint adds the missing write path the gate requires.
- **Reintroduction of bulk-ratify-on-go.** `recordDesignerGo` does not gain bulk-ratify behavior; closure proceeds only when every element is already individually ratified.
- **Refactor or relocation of `ratify_resolve_condition` / `manage_concerns op:ratify` / `manage_definitions op:ratify`.** Existing ratify tools are unchanged structurally.
- **Schema version bump.** No state-file schema change. The `ratificationStatus` field has always existed on NCs (`proof.js:248` writes it on creation). The only change is that the field now has a write path to `'ratified'`.

## Acceptance Criteria

### AC-1.1 — `ratifyNecessaryCondition` state function exported

**Observable boundary:**
- `import { ratifyNecessaryCondition } from '<state.js path>'` resolves to a function with arity 3
- Calling the function with valid arguments mutates a cloned state's NC `ratificationStatus` to `'ratified'`
- Calling with invalid arguments returns an error tuple; original state unchanged

**Given:** A proof state in `proofStatus === 'planning'` containing an active NC with `ratificationStatus === 'draft'` and a valid consent token with `source: 'designer'` and a rationale string
**When:** `ratifyNecessaryCondition(state, { elementId: 'NCON-N', ratificationText: '<text>' }, consent)` is called
**Then:** Returns `[newState, null]`; `newState !== state` (clone, not mutation); `newState.elements.get('NCON-N').ratificationStatus === 'ratified'`; `newState.ratificationLog` contains a new entry `{ event: 'ratified', target: 'NCON-N', round, ratificationText: '<text>' }`; `newState.operationLog` contains a new entry with `op: 'ratify'`, `entityId: 'NCON-N'`, `type: 'NECESSARY_CONDITION'`

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-1.2 — `ratify_necessary_condition` tool registered and dispatched

**Observable boundary:**
- The MCP `tools/list` response includes a tool named `ratify_necessary_condition`
- Calling the tool via the MCP server dispatcher invokes `handleRatifyNecessaryCondition`
- The tool's input schema requires `state_file`, `element_id`, `ratification`, `consent`

**Given:** The proof MCP server is running
**When:** A client requests `tools/list`
**Then:** The response array contains one entry whose `name === 'ratify_necessary_condition'`, whose `inputSchema.required` contains exactly `['state_file', 'element_id', 'ratification', 'consent']`, and whose description names the per-call single-element_id constraint

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-1.3 — Post-finish guard refuses NC ratify

**Observable boundary:**
- Calling `ratify_necessary_condition` against a state with `proofStatus === 'finish'` returns a structured error
- State is not modified

**Given:** A proof state with `proofStatus === 'finish'`
**When:** `ratify_necessary_condition` is invoked with otherwise-valid arguments
**Then:** The handler returns an error response with `code: 'PROOF_FINISHED'` and `isError: true`; `saveState` is not called; the state file on disk is unchanged

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-1.4 — `ALREADY_RATIFIED` guard refuses double-ratify

**Observable boundary:**
- Calling `ratify_necessary_condition` against an NC with `ratificationStatus === 'ratified'` returns a structured error
- State is not modified

**Given:** A proof state containing an active NC whose `ratificationStatus === 'ratified'`
**When:** `ratify_necessary_condition` is invoked targeting that NC
**Then:** The handler returns an error response whose error message contains `ALREADY_RATIFIED` (currently routes through `classifyStateError` to `DOMAIN_ERROR` until the classifier is extended); `isError: true`; the state file on disk is unchanged

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-1.5 — Status guard refuses ratifying withdrawn NCs

**Observable boundary:**
- Calling `ratify_necessary_condition` against an NC with `status !== 'active'` returns a structured error
- State is not modified

**Given:** A proof state containing an NC whose `status === 'withdrawn'` (regardless of `ratificationStatus`)
**When:** `ratify_necessary_condition` is invoked targeting that NC
**Then:** The handler returns an error response whose error message names the inactive status; `isError: true`; the state file on disk is unchanged

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-2.1 — Mid-revision reset preserved end-to-end

**Observable boundary:**
- After ratifying an NC, revising its statement or grounding via `submit_proof_update op:revise` resets `ratificationStatus` to `'draft'`
- The first-yes gate then reports the NC's id in `unratified_ids`
- A subsequent `ratify_necessary_condition` call clears the gate again

**Given:** An NC ratified via `ratify_necessary_condition` (`ratificationStatus === 'ratified'`)
**When:** `submit_proof_update` is called with `{ op: 'revise', target: 'NCON-N', statement: '<new text>' }`
**Then:** After the revise applies, `state.elements.get('NCON-N').ratificationStatus === 'draft'`; `checkFirstYesGate(state).unratifiedIds` includes `'NCON-N'`; calling `ratify_necessary_condition` again on `'NCON-N'` returns to `'ratified'` and removes the id from `unratified_ids`

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-3.1 — `resetFirstYesIfFired` invariant on NC ratify

**Observable boundary:**
- Calling `ratify_necessary_condition` on a state where `closingArgPresentedRound !== null` clears both closing-argument round flags

**Given:** A proof state with `closingArgPresentedRound = N` and optionally `closingArgGoRound = N` (post-presentation, possibly post-first-yes)
**When:** `ratifyNecessaryCondition` is called for any active draft NC
**Then:** The returned `newState` has `closingArgPresentedRound === null` and `closingArgGoRound === null`; an agent attempting `confirm_closure_go` afterwards must re-present first

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-4.1 — Stale comment at `proof.js:245` updated

**Observable boundary:**
- The line at `proof.js:245` no longer contains the substring `bulk-ratified at confirm_closure_go`
- The replacement comment names the new write path

**Given:** The pre-fix `proof.js:245` reads `// NC-only ratificationStatus (NC-18, RULE-8): bulk-ratified at confirm_closure_go;`
**When:** The fix is applied
**Then:** The line at `proof.js:245` reads `// NC-only ratificationStatus (NC-18, RULE-8): per-element ratify via ratify_necessary_condition; reset to 'draft' on revise of statement or grounding.` (text exact)

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-5.1 — Closure-path integration test exists and passes

**Observable boundary:**
- `__tests__/closure-path-integration.test.js` exists in the proof-mcp test directory
- The test exercises every step of the closure path with N NCs in scope
- The test passes as part of `npm test` (or whatever vitest runner is wired)

**Given:** The fix sprint's code changes are applied
**When:** The proof-mcp test suite runs
**Then:** `closure-path-integration.test.js` is included in the suite, contains at least 4 `it()` cases covering full-path success / mid-revision cycle / first-yes-gate failure on draft / closing-argument envelope partition correctness, and every case passes

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-6.1 — `SKILL.md` toolset section names the new tool

**Observable boundary:**
- The proof-MCP toolset section in `skills/design-large-task/SKILL.md` contains a bullet for `ratify_necessary_condition`
- The bullet sits immediately after the `ratify_resolve_condition` bullet
- The bullet names the per-call single-element_id constraint and the refusal conditions

**Given:** The pre-fix SKILL.md toolset section contains a `ratify_resolve_condition` bullet but no `ratify_necessary_condition` bullet
**When:** The fix is applied
**Then:** The toolset section contains a bullet of the form `- **\`ratify_necessary_condition\`** — designer's sign-off on a single Necessary Condition. Sequential by design; one element_id (NCON-N) per call. Sets ratificationStatus to 'ratified' on success. Refused when proof is finished, when the NC is withdrawn, when the NC is already ratified, or when consent token is invalid.` placed directly after the `ratify_resolve_condition` bullet

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-7.1 — Decision-record entry appended to cross-sprint corpus

**Observable boundary:**
- A new decision-record entry exists in the cross-sprint corpus
- The entry names the AC-2.4 / AC-4.1 interaction miss, the chosen fix path, and the integration-test lesson

**Given:** The cross-sprint decision-record corpus exists with prior entries from sprint-d-1-fix-proof-mcp
**When:** The fix is applied
**Then:** The corpus contains one new entry whose body names: (a) the cross-AC interaction miss between AC-2.4 (bulk-ratify removal) and AC-4.1 (first-yes precondition addition); (b) the chosen fix path (per-element dedicated tool mirroring `ratify_resolve_condition`); (c) the lesson — when adding a gate, verify a write path exists for every element type the gate references; (d) the integration test added (`closure-path-integration.test.js`) that catches this class of miss in CI

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-8.1 — PERM-2 proposed revised text in fix-sprint summary

**Observable boundary:**
- The fix-sprint summary contains a section headed `## Proposed PERM-2 Revised Text (for sprint-d-2 resume)`
- The section contains the verbatim current PERM-2 statement, the proposed revised statement, a rationale paragraph, and a coordination note

**Given:** The fix-sprint reaches the finish phase and `finish-write-records` runs
**When:** The summary file is composed
**Then:** The summary contains a section with the heading above. The section's content is: (1) verbatim current PERM-2 statement (from `sprint-d-2-proof-state.json` `elements['PERM-2'].statement`); (2) proposed revised statement scoping ratify-bundle to ratifiable lanes only — RC, Concern, Definition, NC; (3) rationale paragraph stating that Rules / Permissions / Evidence / Risks carry provenance via `source` field and have no ratify lifecycle; (4) coordination note describing how sprint-d-2 resume should land the change (designer ratify-readback turn followed by `submit_proof_update op:revise` against PERM-2 with consent source `designer`)

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-9.1 — NCON-15 pending-decision note in fix-sprint summary

**Observable boundary:**
- The fix-sprint summary contains a section headed `## NCON-15 Lifecycle Gap (sprint-d-2 owned)`
- The section names the gap, the two paths sprint-d-2 can take, and the explicit deferral

**Given:** The fix-sprint reaches the finish phase
**When:** The summary file is composed
**Then:** The summary contains a section with the heading above. The section's content is: (1) verbatim current NCON-15 statement (from `sprint-d-2-proof-state.json` `elements['NCON-15'].statement`); (2) observation that NCON-15 describes draft-then-review for NC text authoring but is silent on the orthogonal `ratificationStatus` lifecycle; (3) two paths sprint-d-2 can take — revise NCON-15 to add a sentence about the ratify step, or author a new NC covering the ratify lifecycle as a separate concern; (4) explicit deferral statement: "This is a sprint-d-2 design decision; the fix sprint does not touch the proof state."

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

<!-- created-at: 2026-05-09T01:48:06Z -->
<!-- produced-by design-specify@v0003 -->
