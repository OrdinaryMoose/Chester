# Plan Threat Report — Sprint D-1 Fix Proof MCP 2

**Date:** 2026-05-08
**Plan:** `plan/sprint-d-1-fix-proof-mcp-2-plan-00.md`
**Spec:** `spec/sprint-d-1-fix-proof-mcp-2-spec-00.md`

## Combined Implementation Risk: **Low**

## Reasoning

- **plan-attack** initially surfaced 2 HIGH and 3 MEDIUM findings. All 5 were verified against the actual codebase, accepted as valid, and fixed inline before this report. Notable HIGH fix: `handleConfirmClosureGo` was not exported from `server.js:651`, which would have killed the entire Task 4 integration test at import time — Task 4 now includes Step 0 to add the `export` keyword as a one-word source change committed alongside the test.
- **plan-smell** was skipped per the Smell Heuristic Pre-Check — zero matches across the five trigger categories (DI registrations, new abstractions, async/concurrency primitives, new persistence pathways, new contract surfaces). The plan introduces one new state function and one new tool registration, both mirroring an existing pattern (`ratifyResolveCondition` / `handleRatifyResolveCondition`); no composition-root, lifetime, or persistence-pathway change.
- **Plan scope** is narrow — 9 tasks across 1 source module (`proof-mcp/`) plus targeted SKILL.md and decision-record edits plus 2 summary-document sections. Net file count: 4 modified source files (state.js, server.js, proof.js, mutation-clears-flags.test.js), 2 new test files, 1 doc file (SKILL.md), 1 cross-sprint corpus file (decision-record.md), 1 summary file with 2 sections. Smaller than sprint-d-1-fix-proof-mcp's 16-AC precedent.
- **Verified-anchor reuse** — every load-bearing claim about `ratifyResolveCondition`, `ratifyConcern`, `manageDefinitions`, `addConcern`, and `mutation-clears-flags.test.js` patterns was checked against the actual source during adversarial review and its fix-up. The plan's call signatures, return shapes, and import patterns now match the codebase exactly.
- **Fork-policy preserved** — `chester:plan-build-plan-attacker` ran as a named subagent (no fork). Independence of the adversarial review is structurally guaranteed.

## Smell Pre-Check Result

**plan-smell skipped.** Heuristic matched zero triggers. Plan-attack alone was sufficient for hardening this sprint.

Triggers checked (none matched):
- DI registrations (`AddScoped`, `IServiceCollection`, etc.)
- New abstractions (`new interface`, `abstract class`, etc.)
- Async / concurrency primitives (`SemaphoreSlim`, `ConcurrentDictionary`, `lock (`, `Interlocked.`, etc.)
- New persistence pathways (`SaveAsync`, `DbContext`, `IRepository`, `serialize`, `deserialize`)
- New contract surfaces (`new contract`, `new DTO`, `public record`, `boundary contract`)

The plan's persistence touch is `saveState` / `loadState` calls inside the new tool handler — but those are existing functions used by every existing tool; this is not a new persistence pathway, just a new caller.

## plan-attack Findings — Status

All findings verified against source and fixed inline. Re-verification confirmed:

### HIGH — Resolved

- **Finding 1: `handleConfirmClosureGo` not exported.** Verified at `server.js:651` (no `export` keyword). Plan now Task 4 Step 0 instructs adding `export` as a one-word change committed alongside the integration test. Fix confirmed in plan diff.
- **Finding 2: `addConcern` returns 4-tuple, not 2-tuple.** Verified at `state.js:241-266` (return shape `[id, newState, fricResult.hints, null]`). Plan's `buildFullState` helper now destructures `[cernId, state, hints, err]` correctly. Fix confirmed in plan diff.

### MEDIUM — Resolved

- **Finding 3: `manageDefinitions` signature wrong.** Verified at `state.js:845` (`manageDefinitions(state, op, payload, consent)` — positional, snake_case payload). Plan now calls `manageDefinitions(state, 'add', { canonical_name: 'TestTerm', definition: 'def text' }, validConsent)` and destructures the 3-tuple `[defId, state]` for add and `[, state]` for ratify. Fix confirmed in plan diff. Field name corrected from `canonicalName` to `canonical_name` per `validateDefinitionInput`'s schema.
- **Finding 4: `seedStateWithNC` helper does not exist in `mutation-clears-flags.test.js`.** Verified — no such helper, no file-level `validConsent`. Plan's Task 3 now uses inline `initializeState` + `applyOperations` matching the existing in-file pattern. Fix confirmed.
- **Finding 5: ESM `import` placement violates static syntax.** Verified — ESM requires top-level imports. Plan's Task 2 Step 1 now explicitly instructs hoisting `handleRatifyNecessaryCondition` import to the top of the file alongside the existing imports, and adds `afterEach` to the `vitest` named imports at the same site. Fix confirmed.

### LOW — Resolved

- **Finding 6: "mirrors line-for-line" prose contradicts 2-tuple return shape.** Verified — prose mismatch with code. Plan's Task 1 Step 3 now explicitly names the two divergences (2-tuple vs 3-tuple, no `processFriction`) and instructs the implementer to use the provided code block verbatim rather than copy from `ratifyResolveCondition`. Fix confirmed.

## Verified Anchors (no re-verification needed at execute-write)

The following spec-stage ground-truth-verified anchors are unchanged by this plan and trusted:

- `state.js:91` — `resetFirstYesIfFired` exported and called by every ratify mutator.
- `state.js:531` — mid-revision NC reset (`ratificationStatus = 'draft'` on revise of statement/grounding) — exercised by Task 4's mid-revision integration test.
- `state.js:693` — `loadState` legacy backfill `ratificationStatus ??= 'draft'`.
- `proof.js:248` — NC creation sets `ratificationStatus = 'draft'`.
- `closing-argument.js:71` / `:73` — activeNCs / draftNCs partition by `ratificationStatus`.
- `first-yes-gate.js:18` — NC draft check.
- `SKILL.md:434` — `ratify_resolve_condition` bullet (Task 6 inserts after this line).

## Anchors the plan modifies (re-verified during fix-up)

- `proof.js:245` — Task 5 replaces with spec-exact text including the trailing clause "reset to 'draft' on revise of statement or grounding." Line 246 deleted to absorb the redundant clause cleanly.
- `state.js` — Task 1 inserts `ratifyNecessaryCondition` export after line 365 (before `generateId` at line 366). Verified no collision.
- `server.js` — Task 2 modifies four sites (import line, TOOLS array, dispatcher case, handler function). Task 4 Step 0 adds `export` to `handleConfirmClosureGo` at line 651. Verified all sites.
- `__tests__/mutation-clears-flags.test.js` — Task 3 appends one inline-state `it()` case modeled on the existing in-file pattern.
- `summary/sprint-d-1-fix-proof-mcp-2-summary-00.md` — Tasks 8 and 9 author two sections; finish-write-records must append rather than overwrite (hand-off note included in both tasks).

## Decision Options

1. **Proceed** — accept the plan as hardened; move to Execution Mode Selection. Recommended: low risk, all critical findings addressed, scope well-bounded.
2. **Proceed with directed mitigations** — accept the plan but specify additional caution at execute-write time (e.g., gate on a particular task's verification before continuing).
3. **Return to design with additional requirements** — the plan or spec needs further work before proceeding.
4. **Stop** — abandon the sprint or pause indefinitely.

<!-- created-at: 2026-05-09T02:15:35Z -->
<!-- produced-by plan-build@v0004 -->
