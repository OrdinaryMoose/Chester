# Verdict — Round 03

## Answer shape
Preserved split resolving to a single designer pivot, with conditional convergence on each branch. NOT a 3-1 rejection of the split — the count masks the real finding.

## Verdict
The committee does not reject the split, and the nominal 1-adopt/3-oppose count is not the finding — the three "opposers" disagree on *why*, and two of them (Purist, Pragmatist) hold that the split is architecturally cleaner or outright correct, conditional on one decision the designer has not yet made. That decision is the pivot: **does the designer intend to reverse the standing finding that the committee should not author specs?** Pragmatist states it precisely — the Round 03 premise "opens that door but does not walk through it." Everything forks on it. **Branch A — if the designer reverses it and wants the committee to author specs:** the split into spec-build (template-fill authorship) and spec-harden (the three-pass chain, callable by any author) is the right mechanism, it dissolves the category objection cleanly, and it retires Round 02's Path B — because the committee-fed flow simply never invokes architecture selection (Innovator, Pragmatist, Purist-conditional align here). **Branch B — if that finding stands and the committee never authors specs:** the split is over-engineering, and Round 02's Path B remains the answer, delivering the same token-waste elimination at roughly 15-20x less edit surface with no new cross-skill seam and no confirmed second caller for spec-harden (Conservator, Pragmatist). The committee is unanimous that "author a spec" and "harden a spec" are separable in principle; it divides only on whether separating them is worth the cost, and that worth is fully determined by the pivot. If the split proceeds, four guardrails are load-bearing and uncontested: (1) the committee must invoke spec-build only *after* its verdict, as a downstream consumer, never before teardown — else the category collapse returns; (2) the adversarial pass's cross-seam coupling to the authoring context must be resolved first, or spec-harden ships weaker than today's chain; (3) the spec-template's architecture field must be made author-agnostic to be a true shared contract; (4) spec-harden needs a hard-gate so an author cannot ship an unhardened spec.

## Warrant record (all verified from member Final Positions)
- Pivot (logic): Pragmatist + Purist make the split's value strictly conditional on CF1's status; Innovator's adopt assumes it dissolved; Conservator's oppose assumes it stands — consistent once the pivot is set.
- Branch A (logic + evidence): Innovator (new callers first-class); Purist (construction vs verification = distinct categories); Pragmatist (break-even on CF1 reversal).
- Branch B (evidence): Pragmatist caller grep (8 files, ~15-20 edit points), Round 02 CF3, zero confirmed second caller; Conservator fragmentation cost.
- Guardrails: Purist post-verdict invocation + author-agnostic template; Conservator adversarial cross-seam coupling + Pair F quality track record; Innovator hard-gate.
- CF1 not overturned by structure alone (evidence/logic): Conservator.

## Designer decision required
Make the pivot explicit: do you want the committee to author specs (reverse the no-authorship finding) — Branch A, adopt the split — or not — Branch B, take Path B? Everything else follows from that one answer.

<!-- created-at: 2026-06-12T11:39:58Z -->
<!-- produced-by design-committee@v0022 -->
