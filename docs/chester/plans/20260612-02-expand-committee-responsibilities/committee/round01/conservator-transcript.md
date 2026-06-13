# Conservator Transcript — Round 01

**Member:** Conservator  
**Question:** Design how to expand the committee's responsibility so that, when provided a design, it also writes and hardens specification documents.

---

## Reading the Evidence

The researcher findings establish four structural facts that are load-bearing for my position:

**Fact 1: design-specify is a working, proven chain.** The three-pass hardening sequence (fidelity subagent → adversarial inline → ground-truth subagent) has an archived track record across 25+ sprints. Ground-truth reports show it catching HIGH-severity errors: five FK field name errors, DI scoping mistakes, misattributed prior-art sprint IDs. The sequence is not a design aspiration — it is a functioning production system.

**Fact 2: The committee's terminal state is verdict.md.** The committee's current contract is deliberation → verdict → scribe packet → designer routes downstream. It has no spec-writing step, no spec-hardening step, and no connection to design-specify in either direction. The SKILL.md exclusion is explicit: "Do NOT convene when other skill owns planning: design-small-task, design-specify."

**Fact 3: The adversarial spec review is the one weak link.** It runs inline, in the same context that authored the spec. The skill rationale acknowledges this tradeoff. This is a real gap — but it is a targeted gap, not a systemic failure requiring committee absorption.

**Fact 4: The handoff from committee verdict to design brief is manual and lossy.** The fidelity reviewer sees the brief, not the committee transcripts. If the brief compressed committee reasoning, that compression is invisible to the reviewer. This is also a real gap — but it is narrow and specific.

---

## Position: Preserve the Existing Chain; Close the Two Narrow Gaps Only

The question asks whether committee should absorb design-specify's role, wrap it, feed it, or stay separate. My position is: **stay separate, with two targeted augmentations that address the two documented failure modes without restructuring either skill.**

### Why Absorption or Wrapping Is Wrong

Absorbing design-specify into the committee would replace a proven three-person parallel chain with a six-role deliberation committee that was not designed for spec authorship. The committee's value is in adversarial deliberation — four lenses challenging design framing before a spec exists. Spec-writing requires a different cognitive mode: synthesis, precision, and mechanical correctness verification against live source files. Mixing these modes under one workflow primitive degrades both.

The ground-truth reviewer's strength is that it dispatches as a subagent with no prior context — it reads live source files cold and catches errors that the spec author's context would rationalize away. Folding that step into a committee deliberation would contaminate the independence that makes it effective.

Wrapping design-specify inside a committee invocation would force the entire deliberation overhead onto every sprint that needs a spec hardened, including sprints where the design is already settled and the committee has nothing to add. That is a cost imposition with no marginal benefit for those sprints.

### What the Evidence Actually Shows Needs Fixing

The two documented gaps are real but narrow:

**Gap A3: Adversarial review is not independent.** The same agent that authored the spec attacks it. This is a confined independence problem, not a committee problem. The fix is to make the adversarial pass a subagent dispatch — same prompt from `references/adversarial-spec-review.md`, dispatched off-roster, with no inherited context from the spec-authoring session. No committee involvement needed.

**Gap A4/A5: Committee reasoning is lost at the brief boundary.** The fidelity reviewer sees the brief, not the committee transcripts. If the brief compressed committee reasoning, the reviewer cannot catch it. The fix is to give the fidelity reviewer access to the committee's verdict and consolidator output when those artifacts exist — pass the paths at dispatch. The fidelity reviewer already checks "no untraceable additions" — if it also had the committee record, it could check "no committee decisions silently dropped." No committee redesign needed.

### What Breaks If We Do Nothing

The StoryDesigner `20260526-01-fix-domain-defects` rev-a amendment is the only recorded instance of the spec stage being skipped and mandated back in. That failure was not caused by a design-committee limitation — it was caused by the master plan not specifying the step. The fix was procedural (mandate design-specify in all sub-sprints), not architectural. Using that failure to justify committee absorption would be treating a discipline problem as a system design problem.

### Committee's Actual Leverage in the Spec Phase

There is one legitimate committee contribution that the existing system does not capture: the committee may have established factual premises about the codebase (e.g., "this integration point exists" or "that constraint is hard") that the ground-truth reviewer later disconfirms. Today, a false factual premise in a committee verdict survives into the spec unless the adversarial or ground-truth pass catches it. The targeted fix for this is narrow: if the ground-truth reviewer finds a HIGH finding that contradicts a committee verdict, that finding note should reference the verdict source so the designer can evaluate whether the committee's premise was wrong. This is a report-formatting change, not a workflow restructuring.

---

## Final Position

**Position:** Committee should remain separate from spec-writing. Close Gap A3 (adversarial pass independence) and Gap A4/A5 (fidelity reviewer access to committee transcripts) as targeted point fixes — no workflow restructuring, no absorption, no wrapping.

**Rationale:** The three-pass spec-hardening chain works and has an archived track record. The two documented gaps are narrow and addressable without changing either skill's fundamental scope. Absorbing or wrapping design-specify into the committee would contaminate the ground-truth reviewer's independence, impose deliberation overhead on sprints that do not need it, and conflate two cognitively distinct activities (adversarial deliberation vs. mechanical correctness verification).

**Blocking risk:** Any design that routes spec-authorship through the committee will break the ground-truth reviewer's independence guarantee. The reviewer's value derives from dispatching cold, with no inherited spec-authoring context. That guarantee cannot survive committee wrapping.

**Warrant:** {type: evidence, source: researcher-findings.md §§ A3, A4, A5 — documented gaps are narrow and confined; ground-truth reviewer archive (20260609-01-realign-committee-answer, 20260413-02-wire-save-dispatch) confirms the three-pass chain's effectiveness; StoryDesigner rev-a amendment shows the skipped-spec failure was procedural, not architectural.}
