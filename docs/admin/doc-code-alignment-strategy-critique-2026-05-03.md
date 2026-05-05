# Critique — `doc-code-alignment-strategy-2026-05-01.md`

**Date:** 2026-05-03
**Author:** Mike (with Claude Opus 4.7)
**Status:** Critique — companion to the parent strategy. Not a counter-recommendation.
**Form:** Discussion + critique. No build sequence. Open questions at the end.
**Reading order assumed:** parent strategy doc plus its companion `doc-code-alignment-claude-md-action-plan-2026-05-01.md`.

## Context

The parent strategy doc surveys industry doc-code alignment patterns and lands on a hybrid for StoryDesigner. It is well-researched, citation-dense, and structurally clean. The hybrid is plausible. What follows is what doesn't hold up under pressure — internal contradictions, undefended claims, and load-bearing assumptions the doc doesn't surface as assumptions.

The point is not to reject the strategy. The point is to expose the seams before they become the failure modes the doc itself catalogs in §2.4.

## A. Internal contradiction: ground-truth loader vs stale-grounding

§2.4 names "stale-grounding poisoning" as a top-tier AI-agent failure mode: RAG retrieves a doc accurate six sprints ago; agent generates new content with high confidence on rotten foundation.

§4.5 then proposes a Chester skill `load-ground-truth` that pre-loads TDR plus wiki pages by topic-tag at the start of every `design-*` or `plan-build` session. With no freshness signal. No staleness gate. No "this TDR has not been re-validated since sprint X" warning.

The skill, as proposed, is the failure mode wearing a different hat. The doc warns about the trap on page 3 and walks into it on page 8.

Either the loader needs a freshness contract (don't load TDRs whose `last-validated` is older than N sprints; or refuse to load when the cited fitness test is failing), or the recommendation is unsafe in its current shape.

## B. Fitness-test ceiling, never quantified

§4.1 makes fitness-test extension the spine of "Code is Source." §2.2 admits the ceiling: "structural and static only — cannot verify behavioral semantics or runtime contracts."

The doc never audits the existing TDR set against that ceiling. How many of the 30-or-so TDRs are *expressible* as a compiled assertion? If 30% are rationale or behavior, the leverage ceiling on this layer is 30% — and §5's first sequenced cut ("promote 5–7 currently-unverified TDR claims to fitness tests") is sampling from an unmeasured pool.

The "5–7" number is a guess dressed as a recommendation. Without an inventory pass, we don't know whether the next 5 are easy or whether the easy 5 are already done.

## C. Sequencing claims independence the cuts don't have

§5 presents six first cuts ranked by ROI and implies they are independently mergeable. They are not.

- Cut #1 (TDR fitness tests) has limited value without cut #5 (TDR-link-checker) — a renamed TDR file silently invalidates the assertion's `[Test(Description=…)]` attribute message.
- Cut #3 (`audit-doc-drift` skill) has nothing to drift *against* until cuts #1, #2, #5, #6 land — the skill's job is to find broken references, but those references don't exist yet in machine-checkable form.
- Cut #4 (CLAUDE.md refactor) requires the generator (cut not on this list, deferred to companion action plan §4). Sequence as written has #4 before its prerequisite.

The companion action plan partially fixes this for the CLAUDE.md slice — it explicitly declares Steps 1-4 independent and 5-8 composing. The parent strategy doc inherits none of that discipline. Reader takes the §5 sequence at face value and ships in the wrong order.

## D. Theater is the largest risk and gets the smallest mitigation budget

§2.6 names documentation theater the structurally hardest failure mode: "indistinguishable from accurate documentation to automated tooling. Detector requires human comprehension."

The strategy responds with: more automated tooling.

The only non-mechanical detector named is "sub-agent doc reviewer" — one paragraph in §4.5, dispatched once per sub-sprint merge, against `docs/chester/plans/<master>/<sub>/spec/`. That is a narrow window. Wiki theater, TDR theater, CLAUDE.md theater (the actual transitional-prose problem the companion action plan exists to fix) all sit outside the reviewer's scope.

The asymmetry is undefended. If theater is the hardest failure, the mitigation deserves more than one bullet of a longer list.

## E. No measurement plan

The strategy is confident about leverage rankings ("highest leverage", "biggest agent-misleading risk") with no proposal for how to *verify* improvement after adoption.

Missing: a baseline. Missing: success metrics. Missing: a way to tell, six months in, whether the six cuts paid off or whether the team just shipped 13 hours of tooling that nothing changed.

Plausible measurements the doc skips:
- Hallucination rate on agent-authored docs, sampled before/after.
- TDR-reference resolution rate (catches §5 cut #5's value).
- CLAUDE.md "wrong instruction" incidents per sprint.
- Wiki snippet rot — count of backticked symbols in wiki that no longer exist in solution (catches §4.3's value).

Without baselines, retrospective will be vibes.

## F. `last-validated` is honor-system theater

§4.4 proposes frontmatter `last-validated: YYYY-MM-DD` on `intents/*.md` and `concepts/*.md`. Quarterly Chester session reads pages older than 90 days and re-validates.

The mechanism it relies on — that the human re-stamping the date actually re-read the page and confirmed accuracy — is exactly the theater pattern the strategy critiques elsewhere. A re-stamp is cheap; a faithful re-read is not. Nothing distinguishes them.

The strategy applies fitness-test rigor to the structural side and stops at the rationale boundary. But rationale rot is the failure mode the strategy identifies as least-mechanizable. Leaving it on the honor system means the layer with the worst tooling gets the weakest discipline.

A cheap fix the doc misses: at re-validation, agent reads the stamped page *and* the linked code/spec, asks "does the page still describe this code?", logs a reasoning trace. Same shape as the existing reasoning audit. Theater-resistant because the trace is inspectable.

## G. Per-fact-class authority is the strongest idea but underspecified

§2.5 names the spine: source-of-truth direction is per fact-class, and choosing the wrong direction for a fact-class is *the* structural mistake. §4's layer split is the operationalization.

But the assignment rule is given by example, not by rule:
- "API surface naturally code-source."
- "Architectural intent naturally doc-source."
- "Dependency rules naturally bidirectional bridged by fitness tests."

What happens at the boundaries the examples don't cover?

- A dependency rule that includes rationale (e.g., "Story.Compiler must not reference Story.Application.Logic *because* span isolation").
- A type vocabulary decision that is also an architectural intent (e.g., "no shared mutable state in DTO layer").
- A naming convention that exists for an architectural reason (e.g., `*Reader`/`*Writer` interfaces).

Strategy says "bidirectional bridged by fitness tests" but doesn't say which side wins on conflict. Without a tiebreaker, "per fact-class authority" leaks back into "wherever the original writer happened to put it" — which is the current state §3 critiques.

The spine needs a conflict-resolution rule, not just a category list.

## H. Cross-repo scope embedded silently

The strategy is framed as "for StoryDesigner." But several recommendations are Chester-side:

- `load-ground-truth` skill (§4.5).
- `audit-doc-drift` skill (§4.5, §5 cut #3).
- Sub-agent doc reviewer (§4.5).
- `last-validated` decay management quarterly session (§4.4).
- Cold-tier archive convention for `docs/chester/plans/` (§4.5).

Skill changes apply to every project that uses Chester, not just StoryDesigner. The doc never acknowledges this. A reader implementing the strategy in StoryDesigner does not realize they are also prescribing a Chester upgrade that affects unrelated repos.

This matters because the cost-benefit shifts. A skill that costs N hours but pays back across M Chester users is leveraged differently than a skill that pays back only inside StoryDesigner. The strategy doesn't see the leverage because it doesn't see the scope.

## I. Strategy is additive only — no prune doctrine

Every layer in §4 adds: more fitness tests, more snippet bindings, more generators, more skills, more frontmatter fields, more sub-agent dispatches.

Pruning gets one mention: §6 "do not chase 100% coverage." That is a negative constraint, not a positive doctrine.

Missing positive guidance:
- When does an old TDR get archived (and stop binding fitness tests)?
- When does a wiki page get retired vs maintained?
- When does a fitness test itself become stale (asserting a rule no longer canonical)?
- What is the deletion criterion?

Documentation surface area grows monotonically under this strategy. The agent context budget that §4.5 carefully tiers will be re-eaten by Year 2 of accumulated additions. The strategy plans for growth and not for contraction.

## J. Smaller items

- **§3 Diátaxis claim is unaudited.** "StoryDesigner's wiki structure is a natural Diátaxis instantiation." No file-by-file check. Could be true; doc doesn't verify.
- **§7 "60% built" is undefended.** No methodology for arriving at the percentage.
- **§4.3 MarkdownSnippets pick is single-language.** No inventory of wiki code-block languages first; .NET-native pick may underserve bash/JSON/XML examples.
- **§2.1 SDD critique is sharper than §4.5 deserves.** The strategy critiques SDD for "spec doesn't update when implementation discovers reality" and then proposes Chester-side ground-truth loading without addressing how Chester avoids that exact failure.

## Open questions

- **Q1.** What fraction of the existing TDR set is expressible as compiled assertions? Until measured, "extend fitness tests" has unknown ceiling.
- **Q2.** Is there a freshness signal `load-ground-truth` could rely on, or should the skill be deferred until one exists? Without one, the skill is the stale-grounding failure mode.
- **Q3.** What is the cheapest theater detector that isn't "load a sub-agent and hope"? Sample-and-challenge on `last-validated` re-stamps? Wiki/code symbol diff? Spec-vs-shipped-test cross-check?
- **Q4.** What is the conflict-resolution rule for fact-classes that straddle layers? Per-fact-class authority needs a tiebreaker.
- **Q5.** Should the strategy be split: a StoryDesigner-internal portion and a Chester-roadmap portion that lands in this repo separately?
- **Q6.** What is the prune doctrine? When does the strategy *remove* a binding rather than add one?
- **Q7.** What's the measurement plan? Without baselines, the six first cuts can't be retrospected honestly.

## Suggested next move (if any)

If the answers to Q1, Q2, Q4, Q7 land cleanly, the strategy can survive as-is with surgical edits. If they land messily, the strategy probably needs a v2 that splits scope (Chester vs StoryDesigner) and adds a measurement section.

The companion CLAUDE.md action plan is sound on its own narrow slice — it doesn't depend on resolving these critiques. It can ship while the parent strategy gets a second pass.
