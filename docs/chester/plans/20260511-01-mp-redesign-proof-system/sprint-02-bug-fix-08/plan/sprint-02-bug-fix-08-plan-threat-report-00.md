# Combined Threat Report: sprint-02-bug-fix-08-plan-00

**Plan reviewed:** `plan/sprint-02-bug-fix-08-plan-00.md`
**Spec:** `spec/sprint-02-bug-fix-08-spec-00.md`
**Date:** 2026-05-18
**Hardening passes:** plan-attack (unconditional), plan-smell (triggered on `serialize`, `persistence`)

## Combined Implementation Risk: **Moderate** (after inline mitigations)

Before mitigations: **Significant** (3 structural findings: CRITICAL render.js gap; HIGH grep miss; HIGH WITHDRAW emission bug). All three patched in the plan inline before save; threat level drops to Moderate.

## Mitigated Findings (Patched Inline)

### M-Critical-1 — `render.js` PROJECTION_ARITIES not updated for `agent_action`

**Plan-attack found:** `render.js:289–300` carries `PROJECTION_ARITIES` which the file's own comment requires to mirror `EDB_PREDICATES`. Without an entry for `agent_action`, `renderDatalogProjection` silently drops the new fact. AC-2.3 would fail.

**Fix applied:** Task 3 now adds `agent_action: 4` to `PROJECTION_ARITIES` in Step 1b. `render.js` added to Task 3 file list and commit.

### M-High-1 — Task 1 discovery grep misses `authority.ratify` shape assertions

**Plan-attack found:** `concern-schema.test.js:35` asserts `entry.authority.ratify).toEqual([DESIGNER, DESIGN_PARTNER])`. The original Task 1 Step 1 grep targeted call sites (`ratifyElement.*design_partner`) and missed this structural assertion. D1 tightening would cause it to fail without warning.

**Fix applied:** Task 1 Step 1 now runs a second grep for `authority.ratify.*toEqual|toContain|DESIGN_PARTNER` patterns. Records matches from both.

### M-High-2 — WITHDRAW emission emits wrong elementId

**Plan-attack found:** Original `targetId = id ?? args.elementId ?? args.id ?? null` fallback chain silently emits the unused-allocator id for WITHDRAW. The allocator runs for WITHDRAW (no skip), so `id` is non-null but does NOT identify the withdrawn element — that's in `args.id`. Net effect: `agent_action(<unused-id>, 'withdraw', 'design_partner', ts)` instead of the correct withdrawn-element id.

**Fix applied:** Task 4 Step 3 replaced the `??` fallback with explicit verb-aware branching:
- `WITHDRAW` → `args.id`
- `RATIFY` → `args.elementId`
- else (ADD/REVISE/REVISE_PROPOSITION/REVISE_RESOLUTION/MANAGE_FRICTION) → `id`

Spec D2 emission block updated to match.

## Unmitigated Findings (Documented, Not Blocking)

### U-Medium-1 — Stale comment in `sprint-02-bug-fix-07.test.js` after AC-12.3 update

**Plan-attack found:** Line 752 comment `// Both ratified atomically — no separate ratify call needed.` becomes misleading after D3 because only the proposition side is "both ratified". Resolution side becomes designer-only.

**Decision:** Not fixed in plan. Implementer can adjust the comment freely during Task 2 Step 1 if it improves the test's readability. Documentation rot only — does not affect test correctness.

### U-Medium-2 — Implicit arity contract on `agent_action`

**Plan-smell found:** The fact's 4-tuple shape is encoded by convention at the emission site, not by a structural constant. Future query consumers must know the shape by domain knowledge.

**Decision:** Accept for this sprint. The shape is documented in the spec's Data Flow section and in the commit message. `PROJECTION_ARITIES.agent_action = 4` is now a structural anchor (added per M-Critical-1 mitigation). Future structural test could check this entry; out of scope here.

### U-Medium-3 — Silent null emission path (theoretical, currently unreachable)

**Plan-smell found:** With the original `??` fallback, a future verb that admits DESIGN_PARTNER without populating `id`/`args.elementId`/`args.id` would emit `agent_action(null, ...)`. After mitigation M-High-2, the new branching code defaults to `id` for unhandled verbs — if `id` is null, the emission still goes through with a null elementId.

**Decision:** Accept for this sprint. Currently no DESIGN_PARTNER-reachable verb falls through to the else branch with `id === null`. Future verbs added in subsequent sprints must either match WITHDRAW/RATIFY semantics (and get an explicit branch) or rely on the allocator producing `id`.

### U-Low — LOC ceiling watch items

**Plan-attack found:** `domain-bridge.js` is at 197/200 LOC; `mutations.js` is at 330/360. Net additions from this plan: domain-bridge.js untouched (the `getDeclaredEDBPredicates()` path picks up `agent_action` automatically); mutations.js gains ~3 net lines (D2 emission block plus comment, minus D3 removal). Both stay under ceiling.

**Decision:** No mitigation needed. Watch item only.

### U-Low — Pre-existing `validPredicates` divergence between `createDomainBridge` and `createDomainBridgeWith`

**Plan-smell found:** The two factories have slightly different supplemental lists (`concern_note` exists in one but not the other). The new `agent_action` flows through `getDeclaredEDBPredicates()`, so neither needs explicit addition — but the pre-existing divergence is unaddressed.

**Decision:** Pre-existing; not introduced by this plan. `createDomainBridgeWith` was declared out of scope at sprint-02-bug-fix-07. Defer.

### U-Low — Sprint-slug-named test files

**Plan-smell found:** `sprint-02-bug-fix-08.test.js` continues the pattern of slug-named test files. Behavioral coverage for authority is split across multiple files.

**Decision:** Pre-existing convention; not introduced by this plan. Defer to a possible future test-reorganization sprint.

### U-Low — Stale shared block comment on D12 OperationSpecs

**Plan-smell found:** `mutations.js:124` block comment says both REVISE_PROPOSITION and REVISE_RESOLUTION emit dual-partner approval. After D3, that's true only for REVISE_PROPOSITION.

**Decision:** Implementer adjusts the shared comment during Task 2 Step 3 as part of the REVISE_RESOLUTION edit. Minor.

## Matched Smell Triggers

- `serialize`
- `persistence`

Plan-smell fired correctly: D2 introduces a new EDB predicate that participates in serialization. Smeller's findings focused on the persistence-coupling shape (arity contract, null path, divergent lists) — appropriate scope.

## Implementation Risk Summary

After inline mitigation, the three structural findings (Critical + 2 High) are resolved by surgical plan edits totalling ~30 lines of plan text. The remaining findings are documentation issues, theoretical edge cases, or pre-existing structural concerns out of scope for this sub-sprint. The plan is now in a state where execute-write can proceed with subagent mode and reasonable confidence the tests will pass on first run.

<!-- created-at: 2026-05-18T21:35:36Z -->
<!-- produced-by plan-build@v0004 -->
