# Alignment Map — Round 03

## Refined question
Is design-specify itself the problem — should it split into spec-build (writes the spec per spec-template) and spec-harden (controls the subagent reviews + revisions), so the committee can author the spec via spec-template and hand it to spec-harden?

## Answer shape
**Preserved split that resolves to a single designer pivot, with conditional convergence on each branch.** The headline count (1 adopt / 3 oppose) is misleading and must NOT be reported as "the committee rejects the split" — see below.

## The count is not the finding (Authority Guard: count-not-a-warrant)
Nominal vote: Innovator adopts; Conservator, Pragmatist, Purist oppose-now. But the three "opposers" do not share a reason, and two of them affirm the split is *correct or cleaner*:
- **Purist:** the split is "architecturally cleaner than Round 02's Path B"; authoring and hardening are "genuinely distinct categories." Opposes only the *unconditional* form.
- **Pragmatist:** "If the designer intends to reverse CF1, the split is the right mechanism and Path B becomes the wrong answer." Opposes only *absent that reversal*.
- **Conservator:** the only robust opponent — opposes on a quality-regression risk (seam coupling), and even then says "oppose the split *now*," not never.
So the real structure is not 1-3. It is: all four agree the worth of the split turns on one decision the designer has not made.

## The pivot (the gap the committee cannot close)
**Does the designer intend to reverse CF1 — i.e. authorize the committee to actually author specs?** Pragmatist names it exactly: the Round 03 premise "opens that door but does not walk through it." Everything downstream forks on it.
- Warrant (logic, verified): Pragmatist + Purist both make the split's value strictly conditional on CF1's status; Innovator's adopt-case assumes CF1 dissolved; Conservator's oppose-case assumes CF1 stands. The four positions are consistent once the pivot is set — they only appear split because the pivot is unset.

## Branch A — designer reverses CF1 (committee should author specs)
**Then the split is the right mechanism; Path B becomes the wrong answer.** Convergence of Innovator + Pragmatist + Purist (conditional).
- spec-build = template-fill authorship (no reviews); spec-harden = the three-pass chain, callable by any author. Committee scribe calls spec-build with settled architecture from the verdict, then spec-harden runs.
- Advantage: makes hardening *universal* (any author hands off), not a patch on a monolith; dissolves CF1 cleanly; retires Path B (the committee-fed flow simply never invokes architecture-selection — absence is structural, not a conditional gate).
- Disadvantage: 8+ files, ~15-20 edit points (Pragmatist); a cross-skill seam; call-discipline risk.
- Warrant (logic + evidence, verified): Innovator (decomposition makes new callers first-class); Purist (construction vs verification = distinct categories, distinct invariants/failure modes); Pragmatist (break-even reached once CF1 reverses).

## Branch B — CF1 stands (committee never authors specs)
**Then the split is over-engineering; Round 02 Path B is the answer.** Convergence of Conservator + Pragmatist.
- Path B eliminates the same token waste at ~15-20x less edit surface and no new seam (Pragmatist).
- The split's only unique residual benefit is spec-harden standalone reuse — which has *zero confirmed callers* beyond design-specify today (Pragmatist).
- Warrant (evidence, verified): Pragmatist caller grep; Round 02 CF3 (Path B already converged 4-0); Conservator fragmentation-cost argument.

## Conditions IF the split proceeds (convergent guardrails, uncontested)
1. **Post-verdict invocation only** (Purist, load-bearing): the committee must invoke spec-build *after* its verdict, as a downstream consumer — never inside its own closure / before TeamDelete. Invoke-before-teardown and CF1's category-collapse re-applies. This is the precise shape that keeps the committee's terminal state singular.
2. **Resolve the adversarial cross-seam coupling** (Conservator, load-bearing): the adversarial hardening pass's rationale explicitly depends on holding the authoring context. Split naively and spec-harden is *weaker* than today's chain — a quality regression in the one chain with a track record of catching HIGH errors. Must be resolved before the cut.
3. **Make spec-template author-agnostic** (Purist): its architecture field currently encodes a design-specify-authored precondition; it must be neutral for the shared contract to be real.
4. **Hard-gate hardening** (Innovator): any spec-build caller can forget spec-harden, yielding an unhardened spec; spec-harden needs a convention that wrapping paths must include.

## Cross-round status
- Round 01 CF1 — NOT overturned by the structural reframe alone (Conservator: "the split dissolves CF1's category *argument* but does not overturn it — CF1 stands on evidence and logic independent of the structural arrangement"). Only a designer decision reverses it.
- Round 02 Path B — survives as the answer on Branch B; retired on Branch A. Not yet obsolete.
- A3 adversarial-independence (H/M/L) — still decoupled; on Branch A it relocates into spec-harden's design.

## Designer value-judgment required
Make the pivot explicit: **do you want the committee to author specs (reverse CF1), or not?** That single answer selects Branch A (split) or Branch B (Path B). The committee cannot make this call — it is an intent decision, not a fact.

<!-- created-at: 2026-06-12T11:39:58Z -->
<!-- produced-by design-committee@v0022 -->
