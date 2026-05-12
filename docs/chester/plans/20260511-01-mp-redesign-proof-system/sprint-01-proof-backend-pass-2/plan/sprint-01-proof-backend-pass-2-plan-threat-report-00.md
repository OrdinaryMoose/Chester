# Plan Threat Report — sprint-01-proof-backend-pass-2

**Plan reviewed:** `sprint-01-proof-backend-pass-2-plan-00.md`
**Hardening passes:** plan-attack (unconditional) + plan-smell (triggered)
**Smell pre-check matched triggers:** `serialize`, `deserialize`, `Serializer.js` references (persistence category — plan touches `Serializer.js` for the atomic-load comment update and ADR-0018 breadcrumb).

**Combined implementation risk level: Low-Moderate.**

The plan is structurally sound and line-number-accurate against all verified anchors. The pass-2 work is documentation-heavy plus one small code addition (canonical rule-safety check at `RuleStore.defineRule`), making it lower-risk than typical engine sprints. The few findings that surfaced are clarifications and edge-case notes, not structural problems. Two findings warrant inline plan amendments before execution; the remainder are implementer-context notes.

## Findings Summary

### Actionable (warrant plan amendment)

**A1 — Task 2 Step 6 failure-shape description is inaccurate (plan-attack Finding 1).** The plan describes the expected failure as `expect(() => ev.derive()).toThrow(...)` failing because `defineRule` rejects the rule before `derive()` can fire the guard. The actual failure shape is different: the test's `rs.defineRule(...)` call (line 133-136 of `evaluation.test.js`) throws `UNSAFE_RULE` synchronously, never reaching the `ev.derive()` line. Vitest still reports one failure (count is correct), but the implementer reading the failure may be confused by the throw site mismatch.
*Fix:* Update Step 6 description to say "the test's `rs.defineRule(...)` call throws UNSAFE_RULE before reaching the `ev.derive()` assertion line; failure count is one."

**A2 — Task 4 Step 4 breadcrumb-placement instruction is ambiguous (plan-attack Finding 10).** The instruction text says "on top of it" (suggesting above the existing 4-line atomic-load comment), but the code example places the breadcrumb between the comment and the `const rollback` line. A careful implementer could insert in either spot.
*Fix:* Tighten the instruction to match the code example explicitly: "Insert the breadcrumb on a new line *immediately above* `const rollback = engine.snapshot();`, *below* the existing four-line atomic-load contract comment."

### Implementer context (no plan amendment; carry into execution)

**C1 — `checkSafety` assumes `rule.head.args` and `atom.args` are arrays (plan-attack Finding 2).** `validateRule` doesn't verify these are arrays, so a structurally malformed rule with missing `args` would crash `checkSafety` with a TypeError instead of producing a clean error. No planned test exercises this edge case; well-formed callers won't hit it. Low-severity latent surface; documented for future hardening.

**C2 — ADR-0016 forward-references ADR-0017 (plan-attack Finding 8).** Task 2 commits ADR-0016 with a reference to ADR-0017, which is created by Task 3. Between Task 2's commit and Task 3's commit there is a one-commit window where ADR-0016 has a dangling reference. Not a functional issue (ADRs are documents); resolved on the next commit.

**C3 — `engine-open-questions.md` has no enforced closure protocol (plan-smell Finding 4).** The document specifies that entries are removed when their question closes via a new ADR, but no skill or AC enforces this. Pass-3 (the closure channel for OQ-1) could ship without removing the entry. For pass-2 specifically the risk is bounded — OQ-1 is the only entry — but the pattern scales badly across future open-questions entries.
*Mitigation:* When pass-3's spec is written, include an explicit AC requiring the OQ-1 entry to be removed from `engine-open-questions.md` as part of D5's closure. The mitigation lives in pass-3, not pass-2.

**C4 — `UNSAFE_RULE` carries `unboundVars`, but no test asserts the field shape (plan-smell Finding 5).** The error object includes `{ code, ruleId, unboundVars }`. The pass-2 tests assert on `code` and `ruleId` only via `expect.objectContaining`. The `unboundVars` field is documented in ADR-0016 but unexercised. A future refactor could rename or remove the field silently. Sprint-02's Domain layer presumably consumes UNSAFE_RULE errors and may rely on `unboundVars` being an array of strings.
*Mitigation:* Optional — strengthen one of the pass-2 tests to assert `unboundVars` is an array containing the expected variable names. Not blocking for pass-2; can be added in pass-3 alongside D5 work if desired.

### Low-severity observations (no action required)

- ADR-0016 breadcrumb is pinned to `defineRule` method entry rather than to the `checkSafety` call (plan-smell Finding 3). Deliberate per the plan's stated rationale ("documents the larger reason"). Mild drift risk if `defineRule` grows new pre-checks.
- `_restore` bypasses both `validateRule` and `checkSafety` (plan-smell Finding 7). Pre-existing pattern; pass-2 doesn't worsen it.
- Module-level helper placement (`validateRule` next to `checkSafety`) introduces an undocumented helper-zone pattern (plan-smell Finding 2). One-time addition; only matters if more pre-admission checks accumulate.
- Serializer comment + breadcrumb stacking creates mild redundancy (plan-smell Finding 6). Deliberate per the plan's distinction between WHAT (existing comment) and WHY (new breadcrumb).
- Test count arithmetic verified correct (87 passing post-pass-2). Line-number drift across tasks verified safe.

## Why Low-Moderate Risk

1. **Pass-2 is largely textual canonicalization.** Four of five tightenings are already in code from sprint-01; pass-2 documents them. Documentation work has bounded blast radius.
2. **The one new code path is narrow.** `checkSafety` is a 15-line pure function with deterministic behavior. It runs early in `defineRule` and rejects via structured throw — no state mutation before the throw.
3. **The plan accurately describes the codebase.** Ground-truth review (clean, zero findings) plus plan-attack's re-verification of modified anchors confirms line numbers, structure, and existing conventions match.
4. **The two MEDIUM smell findings (C3, C4) are forward-looking concerns, not pass-2 defects.** They identify patterns that scale badly across future sprints; pass-2 itself is not affected.
5. **One actionable plan-amendment finding (A1) is a description fix, not a structural fix.** The other (A2) is a clarification of an ambiguous instruction. Both are surface-level.

## Recommendation

Apply the two actionable plan amendments (A1 and A2) inline. Carry C1, C2, C3, C4 as implementer-context notes through execution. No structural changes to the plan are required.

<!-- created-at: 2026-05-12T11:00:00Z -->
<!-- produced-by plan-build@v0004 -->
