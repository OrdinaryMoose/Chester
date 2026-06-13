# Split the Spec-Writing Skill, or Keep It Whole? — Round 03 Decision

**Date:** 2026-06-12
**Sprint:** 20260612-02-expand-committee-responsibilities
**Source:** verdict from `committee/round03/verdict.md`; member positions from `committee/round03/consolidator-output.md`

---

## Summary

The committee was asked whether the spec-writing skill should be split into two distinct skills — one that authors the spec (filling in the shared spec template) and one that hardens it (running the three-pass review chain) — so that the committee itself could author the spec, then hand it to the hardening skill. The verdict is not a rejection of the split. The nominal 1-adopt / 3-oppose count is misleading: two of the three "opposers" (Purist and Pragmatist) hold that the split is architecturally cleaner or outright correct, conditional on a decision the designer has not yet made. The real finding is a pivot the committee cannot resolve on its own: does the designer want to reverse the standing finding that the committee should not author specs? Until that question is answered, neither branch can move forward. The committee hands it back to the designer.

## Verdict

The committee does not reject the split, and the nominal 1-adopt/3-oppose count is not the finding — the three "opposers" disagree on *why*, and two of them (Purist, Pragmatist) hold that the split is architecturally cleaner or outright correct, conditional on one decision the designer has not yet made. That decision is the pivot: **does the designer intend to reverse the standing finding that the committee should not author specs?** Pragmatist states it precisely — the Round 03 premise "opens that door but does not walk through it." Everything forks on it. **Branch A — if the designer reverses it and wants the committee to author specs:** the split into spec-build (template-fill authorship) and spec-harden (the three-pass chain, callable by any author) is the right mechanism, it dissolves the category objection cleanly, and it retires Round 02's Path B — because the committee-fed flow simply never invokes architecture selection (Innovator, Pragmatist, Purist-conditional align here). **Branch B — if that finding stands and the committee never authors specs:** the split is over-engineering, and Round 02's Path B remains the answer, delivering the same token-waste elimination at roughly 15-20x less edit surface with no new cross-skill seam and no confirmed second caller for spec-harden (Conservator, Pragmatist). The committee is unanimous that "author a spec" and "harden a spec" are separable in principle; it divides only on whether separating them is worth the cost, and that worth is fully determined by the pivot. If the split proceeds, four guardrails are load-bearing and uncontested: (1) the committee must invoke spec-build only *after* its verdict, as a downstream consumer, never before teardown — else the category collapse returns; (2) the adversarial pass's cross-seam coupling to the authoring context must be resolved first, or spec-harden ships weaker than today's chain; (3) the spec-template's architecture field must be made author-agnostic to be a true shared contract; (4) spec-harden needs a hard-gate so an author cannot ship an unhardened spec.

## Rationale

The question the committee evaluated was whether splitting the spec-writing skill into a spec-authoring step and a spec-hardening step would let the committee become a first-class spec author — handing a filled template directly to the hardening skill rather than patching the existing monolith to admit new callers.

**Why the headline count is not the finding.** The three members who opposed the split did not share a reason. Purist called the split "architecturally cleaner than Round 02's Path B" and said authoring and hardening are "genuinely distinct categories" — the objection was only to adopting it unconditionally. Pragmatist said "if the designer intends to reverse CF1, the split is the right mechanism and Path B becomes the wrong answer" — the objection was only to adopting it absent that reversal. Conservator was the only robust opponent, citing quality-regression risk from seam coupling, not structural objection to the split concept itself. The three positions only appear as a unified block because the underlying pivot is unset.

**The pivot.** The committee identified one question that determines everything: does the designer intend to authorize the committee to author specs, reversing the standing finding that it should not? Pragmatist named it exactly — the Round 03 premise opens that door but does not walk through it. Innovator's adoption assumes the finding is dissolved. Conservator's opposition assumes it stands. Purist and Pragmatist both make the split's value strictly conditional on it. Once the pivot is set, all four positions resolve consistently.

**Branch A — if the designer authorizes committee spec authorship.** The split is the right mechanism. The spec-writing skill becomes template-fill authorship only (no reviews); the spec-hardening skill becomes the three-pass review chain, callable by any author. The committee's scribe calls the spec-writing skill with the settled architecture from the verdict, then the spec-hardening skill runs. This makes hardening universal — any author can hand off — rather than a patch on a monolith. It retires Round 02's Path B structurally, because the committee-fed flow never invokes architecture selection; the absence is structural, not a conditional gate. Innovator, Pragmatist (conditional on the reversal), and Purist (conditional on post-verdict invocation) converge here.

**Branch B — if the standing finding holds and the committee never authors specs.** The split is over-engineering. Round 02's Path B eliminates the same token waste at roughly 15-20x less edit surface, introduces no new cross-skill seam, and requires no confirmed second caller for the hardening skill beyond the spec-writing skill itself. Pragmatist quantified the split's cost: 8+ files, approximately 15-20 edit points. The split's unique residual benefit — standalone reuse of the hardening skill — has zero confirmed callers beyond the spec-writing skill today. Conservator and Pragmatist converge here.

**Four guardrails if the split proceeds.** These are uncontested across all four members.

- The committee must invoke the spec-writing skill only after its verdict, as a downstream consumer, never inside its own closure or before the team is torn down. Invoke-before-teardown and the category-collapse objection reapplies immediately. This is the precise shape that keeps the committee's terminal state singular.
- The adversarial hardening pass's rationale explicitly depends on holding the authoring context. Split the skills naively and the hardening skill ships weaker than today's chain — a quality regression in the one chain with a track record of catching high-severity errors. This must be resolved before the cut.
- The shared spec template's architecture field currently encodes a precondition that the spec-writing skill authored it. The field must be made author-agnostic for the template to serve as a true shared contract.
- Any spec-writing-skill caller can omit the hardening skill and ship an unhardened spec. The hardening skill needs a convention that all wrapping paths must include, functioning as a hard gate.

**Cross-round status.** The standing no-authorship finding is not overturned by the structural reframe alone — it stands on evidence and logic independent of the structural arrangement (Conservator). Only a designer decision reverses it. Round 02's Path B survives as the answer on Branch B; it is retired on Branch A. It is not yet obsolete.

## Dissent Record

**Alignment:** 1-adopt / 3-oppose-conditional — but the count does not represent a shared reason. See the verdict for the precise structure.

**Note on the three "opposing" positions.** Purist and Pragmatist oppose the split only absent the designer's reversal of the no-authorship finding. Both affirm the split is architecturally correct or cleaner given that reversal. Purist represents a partial move from Round 02: previously supplied the category-collapse warrant that was the primary basis for the standing finding; now conditionally dissolves it if the spec-writing skill is invoked after the committee's verdict, narrowing the objection rather than sustaining it fully. Conservator is the only member whose opposition does not depend on the pivot — the seam-coupling risk is independent of whether the designer authorizes authorship.

**Dissenting positions:**

- **Conservator:** Oppose the split now — seam is not clean (adversarial pass couples across the boundary), CF1 blocks the split's primary benefit, fragmentation cost is real, Path B remains necessary regardless of split outcome. — blocking risk: seam is not clean (adversarial pass couples across the boundary), CF1 blocks the split's primary benefit, fragmentation cost is real, Path B remains necessary regardless of split outcome.

- **Pragmatist:** The split is over-engineering unless CF1 is explicitly reversed — Path B achieves the same token-waste elimination at near-zero edit surface (8+ files, 15–20 edit points vs. a conditional entry flag); break-even requires CF1 reversal AND a confirmed near-term caller for spec-harden beyond design-specify itself. — blocking risk: The split is over-engineering unless CF1 is explicitly reversed — Path B achieves the same token-waste elimination at near-zero edit surface (8+ files, 15–20 edit points vs. a conditional entry flag); break-even requires CF1 reversal AND a confirmed near-term caller for spec-harden beyond design-specify itself.

- **Purist (partial move):** "Author a spec" and "harden a spec" are genuinely distinct categories (construction vs. verification); the split is architecturally cleaner than Path B, CF1 dissolves only if spec-build is invoked after the committee's verdict not before TeamDelete, and the spec-template's architecture field must be revised to be author-agnostic. — blocking risk: CF1 dissolves only if spec-build is invoked after the committee's verdict not before TeamDelete, and the spec-template's architecture field must be revised to be author-agnostic.

**Adopting position:**

- **Innovator:** Adopt the split — decomposing into spec-build + spec-harden makes authorship a shared callable, dissolves CF1's category objection, and obsoletes Path B structurally; call-discipline risk (C2) is real but manageable with a hard-gate preamble in spec-harden.

## Deferred / Open

- **Designer pivot (required before any branch executes).** Does the designer intend to reverse the standing finding that the committee should not author specs? This is an intent decision, not a fact the committee can resolve. That single answer selects Branch A (split) or Branch B (Path B). Everything else follows from it.
- **Adversarial cross-seam coupling (Branch A only).** How the adversarial hardening pass retains its authoring context across the skill boundary must be resolved before the split is cut.
- **Spec-template author-agnosticism (Branch A only).** The architecture field in the shared spec template must be revised before the template can serve as a true shared contract.
- **Hard-gate convention for spec-harden (Branch A only).** The mechanism preventing any caller from shipping an unhardened spec has not been designed.

---

<!-- produced-by: scribe / round03 / 2026-06-12 -->

<!-- created-at: 2026-06-12T11:39:58Z -->
<!-- produced-by design-committee@v0022 -->
