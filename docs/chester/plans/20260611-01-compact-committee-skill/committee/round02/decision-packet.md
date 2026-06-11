# Plan Validation: 9-Task Compaction Plan — Safe to Execute

**Date:** 2026-06-11

**Sprint:** 20260611-01-compact-committee-skill

**Source:** verdict from `committee/round02/verdict.md`; member positions from `committee/round02/consolidator-output.md`

---

## Summary

The committee was asked whether the 9-task compaction plan is safe to execute as written, with particular attention to Task 6 (team-lead.md Authority-Guard/warrant collapse) and Task 7 (round-format output-surface edit). The verdict is that the plan is safe to execute, with three mandatory factual corrections to wrong line citations in the plan text and one remaining choice for the designer on Task 7's round-format sub-edit.

## Verdict

The 9-task plan is **safe to execute**, with the following bound to it:

1. **Tasks 1–5, 8, 9 — execute as written.** Round01 validated them; round02 surfaced no new risk.
2. **Task 6 — execute, with the Purist's round01 flag now resolved.** Steps 6+7 are disk-write instructions and must NOT be trimmed (4-0). The real collapse targets are §Behavioral Constraints lines **122-123** (not 121 — that bullet is unique content) and §Self-Evaluation lines **343-345**. Adopt the Innovator's precision correction: name those exact lines as the collapse target and mark steps 6+7 as protected, so the plan's "preserve in place if ambiguous" hedge cannot license a zero-byte Task 6.
3. **Task 7 — the SKILL.md half is safe; the round-format half is the one open decision.** A warranted 3-1 split stands: three members say execute the round-format collapse as written; the Conservator shows (corroborated by researcher ground truth) that collapsing the round-format definition strands the antecedent of the disambiguation clause at lines 109-110. This is a designer micro-decision.

**Mandatory before execution (factual, researcher-verified — not a value call):** fix three wrong line citations in the plan text — Task 6 steps "105-106" → **106-107**; Task 6 "§Behavioral Constraints 121-123" → **122-123**; Task 7 "SKILL.md:122" → **139** (line 122 is the roster-only rule, the §Output Surfaces cite lives at 139).

## Rationale

All four members agreed on Task 6: steps 6+7 in team-lead.md are disk-write instructions that name a field schema inside a write-spec, not free-standing restatements of warrant policy. The §Authority Guard section at line 326 is the policy owner and it is untouched by the plan. The round01 concern about those steps does not survive reading the actual lines. The real restatement targets in Task 6 are lines 122-123 (which restate §Authority Guard 323 and a strict premise-scope rule) and lines 343-345 (Self-Evaluation Authority-Guard checks).

On that basis the Innovator added one precision correction: the plan's current "preserve in place if ambiguous" hedge is an unbounded escape hatch — without naming the specific target lines, a cautious executor could skip the cut entirely, producing zero byte savings while nominally complying with the plan. Naming lines 122-123 and 343-345 explicitly closes that gap. This correction is folded into the verdict as a mandatory plan-text fix, not a blocker on execution.

The three mandatory line-citation fixes are factual errors confirmed by direct file inspection. They are not value calls: Task 6 steps are at 106-107, not 105-106; the collapse-eligible span begins at 122, not 121 (line 121 is the unique most-informative-answer bullet and must not be collapsed); the §Output Surfaces cite in SKILL.md is at line 139, not line 122 (line 122 is the roster-only rule).

On Task 7, three members (Pragmatist, Purist, Innovator) concluded the round-format sub-edit is safe with corrected line boundaries, on the grounds that the disambiguation parenthetical at lines 109-110 is syntactically separable and the replacement cite line itself re-names "output-surface split," restoring the antecedent. The Conservator's direct reading found that lines 104-110 form a single bullet and "This output-surface split" at line 109 is anaphoric to the definition at lines 104-108 — if that definition block is collapsed, the antecedent is gone. Researcher ground truth confirmed the single-bullet structure and the anaphoric reference. The counter-position (separable parenthetical) is only valid if the cite line re-names the concept AND the off-by-one boundary is corrected first, making it a partially-verified conditional rather than a clean override. The 3-1 split is preserved and routed to the designer as a micro-decision.

## Dissent Record

**Alignment:** 3-1 (Task 7 round-format sub-edit); 4-0 (Task 6, all mandatory corrections)

**Dissenting positions:**

- **Conservator:** Task 7 round-format sub-edit should be scoped out; execute the SKILL.md half only — blocking risk: "If Task 7 round-format edit proceeds as written, the disambiguation clause at 108-110 loses its grammatical antecedent ('this output-surface split'), weakening the very preservation the plan claims to guarantee. This is a structural break, not a byte risk."
- **Innovator:** Conditional approval on Task 6 — blocking risk: "without naming lines 121-123 explicitly, 'preserve in place if ambiguous' guidance quietly licenses Task 6 to produce zero byte savings; plan's own hedging becomes the defect"

## Deferred / Open

**Designer micro-decision — Task 7 round-format sub-edit:**

Three members say execute the round-format collapse with corrected line boundaries and a concept-naming cite. The Conservator says scope it out and do only the SKILL.md edit (line 139 correction), leaving round-format.md frozen.

The yield from the round-format sub-edit is approximately 100 bytes. The structural concern is verified: the disambiguation clause at lines 109-110 is anaphoric and the single-bullet structure means collapsing lines 104-108 removes the antecedent unless the replacement cite line explicitly re-names the concept. The SKILL.md edit (corrected cite to line 139) is safe regardless of which path you choose here.

(a) Execute the round-format sub-edit with corrected boundaries — the replacement cite line names "output-surface split," restoring the antecedent; ~100b saved.
(b) Scope it out — do the SKILL.md line-139 correction only; round-format.md stays as-is; structural fiddliness avoided entirely.

---

<!-- produced-by: scribe / round02 / 2026-06-11 -->

<!-- created-at: 2026-06-11T10:28:51Z -->
<!-- produced-by design-committee@v0021 -->
