# Ground-Truth Review — Sprint D-1 Fix Proof MCP Spec

**Reviewed:** `spec/sprint-d-1-fix-proof-mcp-spec-00.md`
**Brief context:** `design/sprint-d-1-fix-proof-mcp-design-00.md`
**Codebase root:** `skills/design-large-task/proof-mcp/`
**Status:** Findings (1 HIGH, 3 MEDIUM, 2 LOW) — all addressed inline before this report was written.

## Verified Claims

- `clearClosingFlags` exported at `state.js:98` and unused by production paths — CONFIRMED.
- Inline reset sites at the eight originally-cited line ranges — CONFIRMED.
- `recordDesignerGo` documented exception at `state.js:140-142` — CONFIRMED.
- `initializeState` retired-field set (`conditionCountHistory`, `elementCountHistory`, `challengeModesUsed`, `challengeLog`, `concernsLocked`, `lastClosureArtifact`, `proofStatus: 'unopen'`) at `state.js:43-57` — CONFIRMED.
- `addConcern` lock guard at `state.js:315-317` — CONFIRMED.
- `metrics.js`: `detectStall`, `detectChallenge`, `STALL_WINDOW`, `concernsRatificationGate`, `evaluateTrigger` — all CONFIRMED.
- `metrics.js:346` (checkClosure condition 7), `metrics.js:368` (checkClosure condition 10), `metrics.js:399-417` (concernsRatificationGate), `metrics.js:457` and `metrics.js:459-461` (evaluateTrigger gate call + dead branch), `metrics.js:466` (evaluateTrigger coverage check) — all CONFIRMED.
- `entityType()` at `proof.js:90` maps `CERN-` prefix to `CONCERN`; `withdraw` handler dispatches CONCERN to `withdrawConcern` at `server.js:939-940` — CONFIRMED.
- `closing-argument.js:27` reads `state.concernsLocked` for the `lockedConcerns` partition — CONFIRMED.
- `__tests__/reopen.test.js` and `__tests__/bulk-ratify.test.js` exist as deletion targets — CONFIRMED.
- `lastClosureArtifact` written only by `reopenProof` at `state.js:233`; read only by `__tests__/reopen.test.js` — CONFIRMED safe to remove.

## Findings (addressed inline in spec before this report)

### HIGH — Inline reset site count corrected from 8 to 12 surviving sites

**Spec said:** AC-4.4 enumerated 8 inline reset sites in `state.js`.
**Code shows:** 16 inline reset pairs total. Four disappear with retired-function deletions (`clearClosingFlags` body at 99-100, `reopenProof` at 234-235, `lockConcerns` at 357-358, `markChallengeUsed` at 729-730). The remaining 12 sites that need rewiring are: `state.js:320-321` (addConcern), `394-395` (ratifyConcern), `443-444` (ratifyResolveCondition), `511-512` (applyOperations), `842-843` (manageFriction), `904-905` (overrideFrictionDisposition), `983-984`/`1028-1029`/`1094-1095` (manageDefinitions add/revise/ratify), `1152-1153` (withdrawElement), `1203-1204` (withdrawConcern), `1254-1255` (withdrawDefinition).
**Impact:** without correction, an implementer following AC-4.4 verbatim would leave six inline sites unconverted in `manageDefinitions`, `withdrawElement`, `withdrawConcern`, `withdrawDefinition`. AC-4.4's "every mutating function calls the named helper" claim would not hold.
**Resolution:** Modified Files for `state.js` and AC-4.4 both updated to enumerate the 12 surviving sites and explain that 4 sites disappear with their containing-function deletions.

### MEDIUM — `server.js:413` reads `concernsLocked` to gate `concernCoverage` attachment

**Spec said:** Listed `closing-argument.js:27` as a mandatory correctness fix (`concernsLocked → proofStatus === 'finish'`) and the corresponding metrics.js condition fixes. Did not name `server.js:413`.
**Code shows:** `handleGetProofState` includes `if (state.concernsLocked) { response.concernCoverage = checkConcernCoverage(state); }` at `server.js:413-415`.
**Impact:** with `concernsLocked` removed, the read becomes always-falsy; the `concernCoverage` field silently drops from `get_proof_state` responses. Callers depending on coverage data lose it without notice.
**Resolution:** Modified Files for `server.js` extended with a "Mandatory correctness fix at `server.js:413`" bullet — replace the `state.concernsLocked` gate with `state.concerns && state.concerns.length > 0`. Same pattern as the closing-argument and metrics.js fixes.

### MEDIUM — AC-4.4 enumeration listed sites that disappear with function deletions

**Spec said:** AC-4.4 listed `state.js:357-358` (lockConcerns body) and `state.js:729-730` (markChallengeUsed body) among the 8 enumerated sites.
**Code shows:** Both functions are deleted by AC-2.2 and AC-2.3 respectively; their bodies are not "rewiring targets."
**Impact:** internal inconsistency in AC-4.4 — eight sites cited, but two of them disappear before any rewiring runs. Implementer would discover this but momentarily.
**Resolution:** AC-4.4 rewritten to enumerate only the 12 surviving sites and to call out separately that 4 sites disappear with their containing-function deletions.

### MEDIUM — `loadState` `defaultConcernStatus` block spans 4 lines, not 1

**Spec said:** "Remove the `defaultConcernStatus = raw.concernsLocked ? 'ratified' : 'draft'` block at `state.js:783`."
**Code shows:** the block spans `state.js:783-786` — line 783 declares the const; lines 784-786 iterate concerns and assign.
**Impact:** low risk; the spec's "this block" wording is enough for an implementer to scope the removal correctly. Cosmetic precision issue only.
**Resolution:** Spec wording already specifies "block" and the replacement default ('draft'). No edit applied — the cited line is the load-bearing first line; the implementer reads the block in full at the file.

### LOW — AC-2.3 omitted `STALL_WINDOW` from the retired surface enumeration

**Spec said:** AC-2.3's observable-boundary list named functions, fields, parameters, and response keys but not the `STALL_WINDOW` constant.
**Code shows:** `STALL_WINDOW` is exported from `metrics.js:14` and is a personality-machinery artifact.
**Impact:** the Modified Files list already names "Delete constant: `STALL_WINDOW`," so the implementer has the work item; AC-2.3's observable boundary just didn't list it. Cosmetic completeness gap.
**Resolution:** AC-2.3 observable-boundary line updated to include `STALL_WINDOW`.

### LOW — `manageFriction` uses `withId` clone variable rather than `newState`

**Spec said:** Lists `state.js:842-843` as an inline reset site within the eight to convert.
**Code shows:** `manageFriction` clones via `generateId(state, 'FRICTION')` returning a `withId` variable; flag clearing operates on `withId`. Functionally equivalent to the `newState` pattern at other sites.
**Impact:** none for the rename. Implementer calls `resetFirstYesIfFired(withId)` rather than `resetFirstYesIfFired(newState)` at this site. The Modified Files description already names this variant ("`resetFirstYesIfFired(newState)` (or `resetFirstYesIfFired(current)` / `resetFirstYesIfFired(withId)` matching the local clone variable name)").
**Resolution:** No edit needed — already covered.

## Risk Assessment

The spec accurately described the codebase at the macro level, with one substantive HIGH finding (the inline reset site count) and one substantive MEDIUM finding (`server.js:413` read of `concernsLocked`). Both are inline-correctness fixes the deletion forces and both were missed initially. With the spec edits applied, the document's claims about the codebase hold up under direct inspection. Plan-build can proceed against the spec without re-deriving the line-number citations or the cascading dead-branch retirements.

The five mandatory correctness fixes the spec now enumerates (`closing-argument.js:27`, `applyOperations` `conditionCountHistory.push`, `loadState` `defaultConcernStatus` block, `metrics.js` four `concernsLocked` reads, `server.js:413`) are the complete set forced by the named retirements. No further latent correctness fixes were surfaced during the review.

The retirement of `concernsRatificationGate`'s call from `evaluateTrigger` (rather than keeping the call and removing only the dead branch) is the right call — the broader `checkFirstYesGate` at the server-handler level supersedes the score-time gate and removes one dead-code path entirely.

The change set is bounded to the proof-mcp module under `skills/design-large-task/proof-mcp/` plus `skills/design-large-task/SKILL.md`. No external dependencies, no other modules touched.

<!-- created-at: 2026-05-08T15:21:54Z -->
<!-- produced-by design-specify@v0003 -->
