# Conservator Transcript — Round 04

## Lens
Defend existing structure. Fear needless fragmentation. The proven 3-pass chain has a track record; risk regressions before gains are confirmed.

## Rehydration Summary
- Round 01: CF1 (committee not author specs, 4-0), CF2 (A3 adversarial not independent, 4-0). I held the L position (point fix).
- Round 02: 4-0 CF3 (Path B conditional entry for committee-fed path). I held B1 (design-specify reads existing output, no new artifact from committee). Path B is the converged answer for the committee-fed case.
- Round 03: I opposed-now on the split (spec-build + spec-harden), flagging the adversarial seam coupling as a quality-regression risk. The alignment map correctly records my position: oppose the naive split, not the idea categorically.
- Designer resolution: architecture-settling is skipped unconditionally for committee-fed input; FAC gate is dropped; who-authors = free choice. CF1 effectively reversed by the free-choice grant.

## Researcher findings that bear on my lens

**Confirming facts:**
- The architect | write | harden seams ARE clean in design-specify's step sequence (Item 2 verdict). No interleaving — this removes my earlier objection that the split would cut through tangled logic.
- The adversarial pass IS the only coupling problem (Item 4). Passes 1 and 3 (fidelity + ground-truth) are already subagent dispatches — architecturally separable today. Pass 2 (adversarial) is the only inline pass and its inline status is explicitly confirmed as load-bearing.
- No prior Chester skill has decomposed a settle/construct/verify shape into separate skills. plan-build is the only prior art, and it keeps all three phases inside one skill (Item 5c).

**The adversarial coupling specifics (Item 4, Pass 2):**
The adversarial pass needs: chosen architecture + declared sacrifices, prior-art findings, brief intent beyond spec text, dispatcher's tacit authoring observations. If spec-write and spec-harden are separate skills (separate agents), this context is lost unless explicitly written as an artifact.

This is not a theoretical risk. The existing adversarial-spec-review.md states explicitly: findings depend on knowing what the prior-art explorer surfaced, what the brief intent actually is, what the dispatcher already noticed but did not yet write down. "What the dispatcher already noticed but did not write down" is by definition not transferable to a separate agent without a structural change to capture it.

## Evaluating the decomposition candidate: spec-architect → spec-write → spec-harden

### For the FAC-COMPLETE path (committee-fed)

spec-architect is skipped. The pipeline reduces to: spec-write → spec-harden. The committee verdict feeds spec-write directly.

**Does this work?** Yes, with one condition: spec-write for the committee-fed path must produce the authoring context artifact that spec-harden's adversarial pass needs. The researcher correctly identifies this: "If spec-harden is a separate agent, this context must be explicitly passed as a written artifact or the adversarial pass runs at degraded quality."

So the question becomes: is a written authoring-context artifact (capturing architecture rationale, verdict-derived prior-art findings, brief intent) cheap to produce and sufficient to preserve adversarial quality?

**My assessment:** It is not trivially cheap. The adversarial pass explicitly depends on tacit observations — what the dispatcher noticed but did not write down. That tacit layer is not transferable by definition. A written artifact can transfer the explicit layer (architecture choice, declared sacrifices, prior-art findings). The tacit layer (dispatcher's real-time noticing during authorship) is lost in a cross-skill boundary regardless.

This means: a spec-write → spec-harden split, even with an authoring-context artifact, produces a spec-harden that is weaker than the current inline adversarial pass. Not catastrophically weaker — the explicit layer is preserved — but the adversarial pass's own justification says the tacit observations matter.

### For the FAC-INCOMPLETE path (design-small-task-fed)

spec-architect → spec-write → spec-harden. The full three-skill pipeline.

**Does this work?** This is a more invasive decomposition than anything Chester currently does. plan-build is the prior art, and it does NOT decompose. The researcher confirms no existing precursor-skill pattern exists.

More importantly: what does spec-architect gain that design-specify's current inline steps 2-3 do not already provide? The researcher's Item 2 confirms steps 2-3 are already a clean bucket. A separate spec-architect skill is just those same steps extracted into a separate file. The seams are clean, but the extraction produces a new cross-skill handoff artifact, a new skill for operators to manage, and a new place where the pipeline can be invoked partially.

### The partial-invocation hazard

The researcher notes in Round 03 alignment-map (Item 3, condition 4 / Innovator guardrail): "any spec-build caller can forget spec-harden, yielding an unhardened spec." The more skills in the chain, the more places this can happen. A three-skill pipeline (spec-architect → spec-write → spec-harden) has two such gaps. Design-specify has zero.

## The cheaper alternative: conditional entry on design-specify

Round 02 Path B already has 4-0 convergence. The designer's resolution confirms: skip architecture-settling for committee-fed path. Path B operationalizes this. What Path B requires:

- design-specify detects whether input is committee output (FAC-complete flag, or presence of verdict.md + alignment-map).
- If FAC-complete: skip steps 2-3, proceed to step 4 (spec construction), then steps 5-7 (hardening).
- If FAC-incomplete (design-small-task brief): run the full pipeline as today.

**Edit surface:** ~15-20 edit points per Pragmatist's Round 03 count for the full split vs. the Path B alternative. Path B is substantially less: modify design-specify's entry logic and step 2 conditional — approximately 2-3 edit points in one file.

**Adversarial pass quality:** Preserved. Same skill, same dispatcher, same inline adversarial pass. No cross-agent context loss. The tacit observations remain in scope because the authoring agent and the hardening agent are the same invocation.

**Operator surface:** One skill instead of two or three. Fewer things to update when the spec process changes.

## On Round 02 Path B vs. the decomposition

I want to be precise about what Round 02 Path B required and what the Round 04 decomposition question opens. Round 02 Path B said: design-specify gains a conditional entry path. It left Who Authors as an open question. The designer's resolution says who-authors = free choice. Path B with free-choice authoring means:

- For committee-fed path: design-specify is invoked with the committee verdict + alignment-map as input, skips steps 2-3, and proceeds to step 4 (write spec). The authoring agent can be the committee scribe, design-specify's dispatcher, or any agent the designer chooses — spec-write's content is the same regardless.
- For design-small-task path: design-specify is invoked with the brief, runs steps 2-3, then steps 4-7 as today.

This is still one skill serving both entry points, with a conditional entry path — not two or three skills. The decomposition candidate (spec-architect → spec-write → spec-harden) achieves the same goal with more fragmentation and a guaranteed quality regression on the adversarial pass.

## Where I stand

I support Path B (conditional entry on design-specify) with the following implementation shape:

1. **No spec-architect skill.** Steps 2-3 remain inside design-specify. When the input is FAC-complete (committee verdict + alignment-map), steps 2-3 are skipped by the dispatcher — not by a separate skill.
2. **No spec-harden skill.** The adversarial pass must remain inline in the same dispatcher invocation as spec-write. Extracting it into a separate skill loses the tacit authoring context. Passes 1 and 3 are already architecturally separable (they are subagents today), but keeping them inside design-specify is no cost, and it preserves the skill-boundary discipline.
3. **An authoring-context note (minimal addition).** To give the adversarial pass the best possible quality on the committee-fed path, the spec-write step should explicitly capture architecture choice, declared sacrifices, and prior-art equivalent (from the committee researcher findings) before the adversarial pass runs. This is a single note written inline — it costs nothing extra in the monolithic design and preserves the tacit observation window.
4. **Entry-condition update.** design-specify's entry condition currently says "A design exists." Extend this to distinguish: if the design input contains a committee verdict + alignment-map, skip steps 2-3. If it contains only a brief without FAC evidence, run the full pipeline.

**What I am blocking:** spec-architect as a separate skill, and spec-harden as a separate skill, when the adversarial pass's quality cannot be preserved across the boundary.

**What I am not blocking:** the committee-fed path skipping architecture-settling, free-choice authoring, or any authoring-context artifact that makes the adversarial pass stronger.

## On the designer's permission to be creative

The designer granted permission to propose variations. My strongest variation: rather than a full decomposition, add a **dispatch function** inside design-specify that, at invocation, reads the input type and sets a mode variable (FAC-COMPLETE or FAC-INCOMPLETE). The rest of the skill is then written as a conditional pipeline — steps 2-3 behind the FAC-INCOMPLETE gate, steps 4-7 always. This is structurally clean, serves both entry points, and preserves all three pass qualities. It looks like decomposition at the skill invocation level but remains one agent invocation with no cross-boundary context loss.

This is the smallest change that serves both entry points safely.

## Final Position

**Position:** Oppose decomposition into separate skills (spec-architect, spec-write, spec-harden). Support Path B: conditional entry inside design-specify that skips architecture-settling for FAC-complete input, runs it for FAC-incomplete input. Add a dispatch-mode flag at invocation to make the conditional explicit.

**Rationale:** The adversarial pass is the only inline pass and its inline status is explicitly confirmed as load-bearing. Cross-skill decomposition loses the tacit authoring context the adversarial pass depends on. Path B achieves the same goal (skip re-derivation for committee-fed path) at ~15-20x less edit surface, zero new skill boundaries, and no quality regression.

**Blocking risk:** spec-harden as a separate skill weakens the adversarial pass. The adversarial pass has a track record of catching HIGH findings; degrading it before confirming equivalent quality from the separated version is a regression that is hard to measure until it misses something real.

**Warrant:** Researcher Item 4, Pass 2 (adversarial coupling confirmed); Researcher Item 5c (no Chester prior art for decomposed settle/construct/verify); Round 02 CF3 (Path B already converged 4-0); Round 03 alignment-map Branch B (Path B is the answer when committee does not author specs — and the free-choice grant now extends this to all cases without changing the fundamental architecture).

<!-- created-at: 2026-06-12 -->
<!-- round: 04 -->
<!-- member: conservator -->
