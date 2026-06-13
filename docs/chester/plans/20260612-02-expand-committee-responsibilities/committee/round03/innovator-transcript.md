# Innovator Transcript — Round 03

**Question:** Does the designer's proposed split of design-specify into spec-build (author) + spec-harden (review chain) represent the deepest structural win? What is the new composition graph, does it make Path B obsolete, and what is the cost of the decomposition?

**Round 03 readdress:** The designer has proposed splitting design-specify into two skills. I treat this as an in-scope structural proposal and assess it from the Innovator lens: structure is re-makeable, chase the deepest win.

---

## Whether the split dissolves the prior tensions

Round 01 CF1 (committee should not author specs) rested on a category objection: a committee that both deliberates AND writes a spec has two terminal states, collapsing the primitive's integrity. The Purist supplied this warrant.

The split dissolves this cleanly. If spec-build is a shared template-fill callable, then "committee writes a spec" becomes "committee calls spec-build" — one terminal state (verdict), one tool call (spec-build). The committee's primitive contract stays intact: it still terminates at verdict. spec-build is the thing that authors the artifact, and it is callable by any actor (design-specify, committee scribe, a human). The category objection evaporates.

Round 02 CF3 (Path B — skip design-specify's front half when committee has settled architecture) is also dissolved but differently. If the split is adopted, Path B as designed no longer makes sense. Path B was a conditional entry point inside design-specify to skip its front half when architecture is already settled. But if design-specify is decomposed into spec-build + spec-harden, there is no monolith with a "front half" to skip. The front half — architecture selection, competing architects, prior-art — would live in spec-build (or rather, its absence is precisely what makes committee-authored specs viable: the committee ran the architecture work, then hands a settled architecture to spec-build which writes the doc). Path B dissolves not because it was wrong but because the structure it was patching no longer exists.

---

## The new composition graph

The split produces the following callsites and callers:

**spec-build** — receives: design brief + chosen architecture (settled). Outputs: spec document per spec-template. Contains: no reviews, no competing-architect dispatch, no prior-art. Pure authorship.
- Called by: design-specify (after its front-half architecture selection concludes), OR committee scribe (when committee deliberation has settled architecture), OR any other authorized caller with a settled-architecture input.

**spec-harden** — receives: spec path + design brief path (optionally: committee transcripts for fidelity context). Runs: fidelity subagent (Pass 1), adversarial review (Pass 2 — inline or committee-dispatched per the A3 decision), ground-truth subagent (Pass 3). Outputs: hardened spec + ground-truth report.
- Called by: anyone who holds a spec that needs hardening. design-specify calls it after writing; committee-authored spec path calls it after the scribe produces the spec.

**design-specify** (rump skill after split) — retains: the front-half architecture work (competing architects, prior-art, architecture selection). After architecture is chosen, calls spec-build, then calls spec-harden. Terminal state: hardened spec + user gate.

**Committee-authored spec path** — committee deliberates design question, settles architecture in verdict. Scribe calls spec-build with: design brief + settled architecture from verdict. Then caller (team-lead, or a wrapping skill) calls spec-harden with the spec the scribe produced. Terminal state: hardened spec. The committee itself still terminates at verdict; spec-build and spec-harden are downstream callables, not committee internals.

---

## Whether this is the deepest structural win

Yes. Here is why.

Round 01's Option H was a quality gain (replace a non-independent pass). Round 02's B2 (spec-precursor) was an efficiency gain (skip redundant front half). The split is a **capability unlock**: it is the first proposal that makes committee-authored specs structurally coherent, not just possible via a workaround.

More precisely: the B1/B2 debate from Round 02 was fundamentally about how to route existing committee artifacts into a monolith that wasn't designed to receive them. The split eliminates that routing problem entirely. Both B1 and B2 were patches on design-specify's internal structure to accommodate a new caller. The split makes new callers first-class by externalizing authorship.

The split also handles the token-waste problem more cleanly than Path B did. Path B was a conditional skip inside a monolith. The split means there is nothing to skip: a committee-fed flow simply never calls the architecture-selection work because that work was already done in deliberation. The absence is structural, not conditional.

---

## The cost of the decomposition

**C1: Two new skills instead of one split.** spec-build and spec-harden must each be well-specified — not as halves of design-specify but as standalone callables with their own entry conditions and output contracts. This is non-trivial authoring work. The risk is that the split produces two under-specified skills that are only correct when called in the sequence design-specify previously enforced.

**C2: Call-discipline enforcement.** Currently design-specify enforces the chain (write → fidelity → adversarial → ground-truth → gate) by construction. After the split, any caller of spec-build must also call spec-harden or the spec ships unhardened. There is no automatic enforcement. A committee-authored spec path that calls spec-build but forgets spec-harden is structurally invisible to Chester — it would produce an unhardened spec with no warning. The hard-gate in design-specify currently prevents exactly this.

**C3: Front-half orphaning.** After the split, design-specify retains the front-half architecture-selection work. But the front half's value proposition is "when architecture is unsettled, settle it." If the committee is doing this work for committee-convened sprints (which is the whole premise of this question), the front half in design-specify becomes the thing you call only when you did NOT use the committee. That is a valid use case (many sprints don't use the committee), but it means design-specify becomes a "non-committee path" skill rather than the universal spec skill. That is a naming and mental-model concern, not a blocking risk.

**C4: spec-harden's adversarial pass identity.** The A3 problem (adversarial pass is non-independent) is still unresolved by the split. spec-harden will have to make the same decision design-specify currently defers: run the adversarial pass inline (current trade-off) or dispatch to a committee. The split does not resolve A3; it just moves the decision into spec-harden's design.

---

## Does this make Path B obsolete?

Yes. Path B was a conditional branch inside a monolith designed to skip the front half when committee architecture was already settled. If the monolith is decomposed, there is no front half to skip — the committee-fed path calls spec-build directly with settled architecture. The problem Path B was solving does not exist in the split design. B1/B2 sub-split from Round 02 becomes irrelevant.

---

## Innovator recommendation on the split

Adopt the split. The structural gain — making authorship a shared template-fill callable rather than a gate only design-specify can trigger — is the deepest win available in this problem space. It dissolves CF1, obsoletes Path B, and unlocks committee-authored specs without a workaround.

The call-discipline risk (C2) is real but manageable: spec-harden should carry its own hard-gate language ("spec produced by any author MUST pass spec-harden before plan-build"), and the committee-authored spec path (whether a wrapping skill or a scribe directive) should call spec-harden as its mandatory second step.

The A3 adversarial-independence question (Option H from Round 01) remains a live, separable decision about spec-harden's internal design. The split creates the right container for resolving it.

---

## Final Position

**Position:** Adopt the split — design-specify decomposes into spec-build (template-fill authorship, no reviews) and spec-harden (three-pass hardening chain, callable by any spec author). This dissolves CF1's category objection by making authorship a shared callable, not a committee-internal state. It dissolves Path B because the committee-fed flow simply never calls the architecture-selection work — the absence is structural, not conditional. The composition graph: committee scribe calls spec-build with settled architecture from verdict, then spec-harden runs the three passes. design-specify retains the front-half architecture work for non-committee paths and calls spec-build + spec-harden in sequence. The deepest structural win is making hardening universal rather than patching a monolith.

**Rationale:** B1/B2 from Round 02 were patches on design-specify's internals to admit a new caller. The split makes new callers first-class. Round 01 Option H was a quality gain inside the same monolith. The split makes quality (hardening) a separable callable, which is a more durable answer than a better inline pass.

**Blocking risk:** Call-discipline: any caller of spec-build can forget to call spec-harden, producing an unhardened spec with no automatic enforcement. spec-harden needs a hard-gate preamble that any wrapping path must include by convention. Also: A3 (adversarial pass independence) is deferred into spec-harden's design — not resolved by the split.

**Warrant:** `{type: logic, source: decomposition eliminates the routing-into-a-monolith problem that B1 and B2 both attempted to solve; CF1 category objection dissolves because authorship becomes a shared callable — verified against SKILL.md "process-agnostic primitive / Transitions to: none" contract which the split preserves.}`
