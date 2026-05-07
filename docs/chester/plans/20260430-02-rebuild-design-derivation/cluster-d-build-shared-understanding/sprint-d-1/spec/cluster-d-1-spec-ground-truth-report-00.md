# Ground-Truth Review Report — cluster-d-1 spec

**Spec reviewed:** `cluster-d-1-spec-02.md` (fixes folded back; current spec is `cluster-d-1-spec-03.md`)
**Codebase target:** `skills/design-large-task/proof-mcp/`
**Status:** Findings — 0 HIGH, 3 MEDIUM, 4 LOW. All MEDIUM addressed inline in spec-03. LOW noted below for implementer.

## Summary

Spec's factual claims about existing code are highly accurate. File paths, function signatures, current behaviors, and counts of things verified against source files. Three MEDIUM findings — all wording clarifications, none structural — fixed inline before bumping to spec-03. Four LOW findings preserved as implementer-context notes.

## Verified Claims

- `CERN-` prefix for Concerns at `state.js:156`.
- `manage_concerns` op enum currently `['add', 'lock']` at `server.js:102`; test at `server.test.js:25-27` asserts the regex `/op:\s*\{[^}]*enum:\s*\[\s*'add',\s*'lock'\s*\]/s`.
- FRICTION guards in `applyOperations` at `state.js:265-268` (add) and `state.js:349-353` (withdraw).
- `saveState` at `state.js:436-441` uses `writeFileSync` only; no `renameSync` import. Not crash-atomic.
- `processFriction` at `state.js:116` takes single `state` parameter; no consent.
- `deriveClosingArgument` at `closing-argument.js:4-61` produces `resolveConditions`, `phantomNCs`, `phantomRCs`, `liveFriction`, `phantomFriction`, `compositeScore`, `closurePermitted`, `closureReasons`, `problemStatement`, `lockedConcerns`, `derivedAtRound` only. Lacks `activeNCs`, `activeRules`, `activePermissions`, `activeRisks`, `phantomConcerns`, `ratifiedDefinitions`, `phantomDefinitions`, `closureProvenance`, `draftNCs`.
- `ELEMENT_TYPES` in `proof.js:13-15` is 7 entries (no CONCERN, no DEFINITION).
- `evaluateTrigger` at `metrics.js:388-444` checks `!state.concernsLocked` at line 419; no per-element status loop on `state.concerns[]`.
- `handlePresentClosingArgument` at `server.js:395-405` returns non-error response on gate failure (no `isError: true`).
- `clearClosingFlags` at `state.js:69-73` exported but never called; mutation sites inline the two null-assignments at `state.js:153-154, 177-178, 208-209, 250-251, 424-425, 490-491, 531-532`.
- `proofStatus: 'unopen'` initial at `state.js:53`; backfill at `state.js:462`.
- `loadState` `??=` backfill pattern at `state.js:453-466`.
- 21 test files in `__tests__/`. `friction-lifecycle.test.js:81-119` for FRICTION guard tests. `loadstate-backfill.test.js` exists.

## Findings Addressed Inline (MEDIUM)

### MEDIUM-1: server.js error-path line ranges off by 5-7 lines

**Spec said:** "`server.js:444-450`, `server.js:457-465`, `server.js:484-494`"
**Code shows:** Actual ranges `444-453`, `458-467`, `482-494`.
**Fix landed:** spec-03 updates all three references with corrected ranges and short labels for each error path (problem_statement extraction, gate failure, applyOperations errors).

### MEDIUM-2: handlePresentClosingArgument new isError:true behavior not framed as new

**Spec said:** "Both `evaluateTrigger` and `handlePresentClosingArgument` enforce hard gate" — implied gate already errors today.
**Code shows:** Current `handlePresentClosingArgument` returns `{ content: [...] }` with no `isError: true` on gate failure. The error response is genuinely new D.1 behavior.
**Fix landed:** spec-03 adds an explicit "Note on existing behavior" subsection to §Closure hard gate calling out (a) per-element status check is new logic dependent on NC-18 backfill, (b) `isError: true` return is new behavior requiring updates to existing tests in `metrics.test.js` and `trigger-evaluator.test.js`.

### MEDIUM-3: evaluateTrigger Concerns-Ratified gate framed as "consistency", actually new

**Spec said:** "`evaluateTrigger` adds Concerns-Ratified hard gate consistency (NC-9)"
**Code shows:** No per-element status check exists. Concern objects at `state.js:156-157` are `{ id, label, description }` with no `status` field.
**Fix landed:** spec-03's note (above) flags this as new logic dependent on the NC-18 backfill landing first.

## Findings Noted (LOW — for implementer context)

### LOW-1: clearClosingFlags is inlined, not called

`state.js:69-73` exports `clearClosingFlags` but the function is never called at any mutation site. The doc comment explicitly says "Inline-set discipline: do NOT call this helper from outside a mutating function's body." All 7 existing mutation sites inline the two null-assignments. Implementer adding new mutation sites must inline, not call.

**Spec-03 update:** the `confirm_closure_go` extension paragraph now describes the inlined-pair pattern explicitly.

### LOW-2: Two parallel `ELEMENT_TYPES` declarations

`server.js:23` declares its own local `const ELEMENT_TYPES = [...]` (7 entries) used only for the `submit_proof_update` schema enum. `proof.js:13-15` exports `ELEMENT_TYPES` (also 7 entries) used by element validation. These parallel declarations could drift. D.1 adds new `CATEGORIES` constant to `proof.js` (9 entries including CONCERN and DEFINITION).

**Implementer note:** keep the two `ELEMENT_TYPES` constants separate from the new `CATEGORIES` constant. `submit_proof_update` schema enum stays at 7 entries; `withdraw` tool uses the 9-entry `CATEGORIES`. Conflating them would incorrectly accept CONCERN/DEFINITION on `submit_proof_update`.

### LOW-3: server.test.js regex needs full rewrite for op enum

`server.test.js:25-27` regex hard-codes `'add',\s*'lock'` with end-of-array immediately after. Adding `'ratify'` requires updating the regex to match the new three-element enum, not just appending the new value.

**Implementer note:** the test update is two changes (the source enum + the test regex), not just one.

### LOW-4: lastClosureArtifact size is unbounded

`state.lastClosureArtifact` captures the full closure envelope — every active and phantom element across 9 categories with provenance chains. State files can grow significantly across multiple re-open cycles (single artifact replaced each time, but each artifact is large).

**Implementer note:** consider whether a recency policy is needed (e.g., truncate `derivationChain` to most-recent N entries). Out of D.1 scope unless red-team flags performance.

## Risk Assessment

Spec accurately describes the codebase. No HIGH findings. Three MEDIUM findings were spec-text precision issues (line ranges, framing of new behavior) — all fixed inline. Four LOW findings are implementer-context notes that don't require spec changes. Plan-build can proceed against spec-03 with high confidence in factual claims.

<!-- chester-trailer-end -->

<!-- created-at: 2026-05-07T09:51:03Z -->
<!-- produced-by design-specify@v0003 -->
