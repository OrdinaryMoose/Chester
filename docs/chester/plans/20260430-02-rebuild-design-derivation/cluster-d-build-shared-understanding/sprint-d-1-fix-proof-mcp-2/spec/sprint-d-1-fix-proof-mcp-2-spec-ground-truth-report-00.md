# Ground-Truth Review — Sprint D-1 Fix Proof MCP 2

**Date:** 2026-05-08
**Spec reviewed:** `spec/sprint-d-1-fix-proof-mcp-2-spec-00.md`
**Brief reference:** `design/proof-mcp-problems-report-02.md`
**Reviewer:** independent ground-truth subagent (general-purpose dispatch)

## Status

**Findings — all LOW severity.** No HIGH or MEDIUM. Spec's load-bearing codebase claims (file paths, line numbers, function signatures, comment text, behavioral contracts) all verify cleanly.

## Verified Claims

- `ratifyResolveCondition` at `state.js:320-364` — CONFIRMED
- `ratifyConcern` at `state.js:278+` — CONFIRMED at line 278
- Mid-revision NC reset to `'draft'` at `state.js:531` — CONFIRMED (inside the revise branch of `applyOperations`, lines 525-532)
- `loadState` legacy backfill `ratificationStatus ??= 'draft'` at `state.js:693` — CONFIRMED
- `resetFirstYesIfFired` exported from `state.js:91` — CONFIRMED
- `cloneElements` (file-local) and `validateConsentToken` (imported from `proof.js:12`) — CONFIRMED; spec's mutator template internally consistent
- `server.js` `TOOLS` array has 11 entries; `ratify_resolve_condition` tool entry at line 202; `handleRatifyResolveCondition` at line 586; `classifyStateError` at line 52; `proofFinishedResponse` at line 62; dispatcher switch with `case 'ratify_resolve_condition'` at line 301 — all CONFIRMED
- `proof.js:248` writes `element.ratificationStatus = 'draft'` on NC creation; stale comment at `proof.js:245` reads exactly `// NC-only ratificationStatus (NC-18, RULE-8): bulk-ratified at confirm_closure_go;` — CONFIRMED verbatim
- `closing-argument.js:71` partitions `activeNCs` by `ratificationStatus === 'ratified'`; `draftNCs` partition at line 73 by `'draft'` — CONFIRMED
- `first-yes-gate.js:18` checks `el.type === 'NECESSARY_CONDITION' && el.ratificationStatus === 'draft'` — CONFIRMED
- `SKILL.md:434` is the `ratify_resolve_condition` bullet in the proof-MCP toolset section — CONFIRMED
- `recordDesignerGo` (`state.js:146-179`) does NOT bulk-ratify; comment at lines 165-166 explicitly states the first-yes precondition makes bulk-ratify unnecessary — CONFIRMED
- `sprint-d-2-proof-state.json` contains `elements['PERM-2']` and `elements['NCON-15']` with non-trivial statements suitable for verbatim quoting in summary deliverables — CONFIRMED

## Findings

### LOW-1: Reference to non-existent `ratify-resolve-condition.test.js`

**Spec says** (Testing Strategy, around line 101): "Patterns inherit from existing `ratify-resolve-condition.test.js` (verify by reading the existing file and matching scaffold)."

**Code shows:** No such file exists. The `__tests__/` directory contains 37 test files; coverage for `ratifyResolveCondition` is distributed across `acceptance.test.js`, `mid-review-revision.test.js`, `closing-argument.test.js`, `state.test.js`, `concerns.test.js`, `consent.test.js`, `server.test.js`. The closest analog for a focused per-mutator file is `nc-ratification-status.test.js`.

**Impact:** Implementer following the spec's "verify by reading the existing file" instruction will hit a dead-end search. Recommended pattern source: `nc-ratification-status.test.js` for NC-specific scaffolding; supplemented by per-mutator coverage embedded in `acceptance.test.js` and `mid-review-revision.test.js`.

**Note for implementer:** when writing `ratify-necessary-condition.test.js`, model the scaffold on `nc-ratification-status.test.js` and the per-mutator slices in `acceptance.test.js` rather than searching for a non-existent pattern file.

### LOW-2: Handler return shape divergences are intentional but worth noting

**Spec says** (Components — server.js, around line 26): handler returns `{ status: 'accepted', element_id, ratificationStatus: 'ratified', closure_permitted, closure_reasons }`.

**Code shows:** existing `handleRatifyResolveCondition` at `server.js:598-609` returns `{ status: 'accepted', element_id, ratification: target.ratification, closure_permitted, closure_reasons, friction_hints }`.

**Impact:** Spec's shape (a) substitutes `ratificationStatus` (string) for `ratification` (object) — correct, different field on NC vs RC; (b) drops `friction_hints` — justified at spec line 20 ("no friction processing — NC ratification is not a friction trigger"). Both divergences are intentional and the spec captures them.

**Note for implementer:** the "mirrors `ratifyResolveCondition` line-for-line" phrasing in the spec is slightly aspirational. The new function is structurally similar but legitimately omits the friction-detection arms (lines 361-363 of `ratifyResolveCondition`). Plan-build should not blindly copy-paste; it should preserve the omission.

### LOW-3: ALREADY_RATIFIED guard ordering interacts with status-active guard

**Spec says** (Components — state.js, around line 20): order is `type → status (active) → ALREADY_RATIFIED → ratificationText`.

**Code shows:** existing `ratifyResolveCondition` orders as `type → status === 'active' → text` and has no ALREADY_RATIFIED guard (RC ratification is idempotent — re-ratifying overwrites with new text) — `state.js:332-340`.

**Impact:** The new ALREADY_RATIFIED guard is an intentional difference from the RC ratify mirror. The spec calls it out at Error Handling (around line 95): "New error code... falls through to DOMAIN_ERROR."

**Note for implementer:** because status-active guard fires before ALREADY_RATIFIED, a withdrawn-then-formerly-ratified NC will surface ELEMENT_NOT_ACTIVE, never ALREADY_RATIFIED — intuitive behavior. No fix needed; preserve this contract subtlety.

### LOW-4: `mutation-clears-flags.test.js` already has the scaffold the new case slots into

**Spec says** (Components — mutation-clears-flags, around line 30): "add one `it()` case verifying that `ratifyNecessaryCondition` clears both `closingArgPresentedRound` and `closingArgGoRound` when they were set on the input state."

**Code shows:** `__tests__/mutation-clears-flags.test.js` has the existing scaffold with one `it()` per mutating function plus a `recordDesignerGo` "does NOT clear" case (lines 14-180). 13 `it()` cases total.

**Impact:** Pattern is well-established and the new case will fit naturally. Confirmed assumption — no risk.

**Note for implementer:** model the new case on the `ratifyConcern` test at `mutation-clears-flags.test.js:85` (closest sibling — both 2-tuple-returning ratify mutators).

## Risk Assessment

The spec's claims about the existing codebase are uniformly accurate at the level of file paths, line numbers, function signatures, comment text, and behavioral contracts. Every load-bearing reference verifies cleanly. The only soft spot is the reference to a non-existent `ratify-resolve-condition.test.js` pattern file — implementers will use `nc-ratification-status.test.js` instead (LOW-1).

No HIGH or MEDIUM risk. Implementation can proceed against the cited line numbers without surprise. Plan-build can plan tasks against the spec without ground-truth-driven revisions.

<!-- created-at: 2026-05-09T01:54:52Z -->
<!-- produced-by design-specify@v0003 -->
