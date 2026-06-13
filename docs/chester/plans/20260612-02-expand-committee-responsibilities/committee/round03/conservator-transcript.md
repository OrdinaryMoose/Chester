# Conservator Transcript — Round 03

**Member:** Conservator  
**Question (reframe):** The designer proposes splitting design-specify into spec-build (writes) + spec-harden (hardens). Does the seam exist cleanly? Is splitting worth it? What breaks if it happens? Does Round 02 Path B become obsolete?

---

## Does the Seam Exist Cleanly?

Partially. The checklist boundary is real — steps 1–4 produce the spec artifact, steps 5–7 harden it. But the seam is not clean in one critical place: **the adversarial spec review (step 6) is explicitly designed to run inline because it carries context from the authoring session.** The design-specify SKILL.md states the rationale directly: "The dispatcher already holds the architect choice, prior-art findings, and brief intent — losing that context to a subagent would degrade the review."

That sentence is a coupling declaration across the proposed split boundary. The adversarial pass is not a pure consumer of the spec artifact — it uses knowledge from the process that produced the spec. If spec-build and spec-harden become separate skills, spec-harden must either re-acquire that context (from disk, from a handoff artifact) or the adversarial pass loses the information that justifies its current design.

This is not a fatal objection. It is an engineering problem: you can serialize the authoring context into a handoff artifact. But it means the seam is not free — it costs a new artifact type (an authoring-context record) or a weakened adversarial pass.

---

## Is Splitting Worth It?

The stated benefit of splitting is that it enables committee to author the spec body by calling spec-build's template capability. But this benefit is narrower than it looks on examination.

**What the split buys:** Committee can fill out the spec template and hand a completed spec artifact to spec-harden. The CF1 category objection dissolves because "committee writes spec" no longer means "two terminal states in one skill."

**What the split does not buy:** The token-waste problem from round 02 is not fixed by the split. If committee calls spec-build, spec-build still has its front half (competing architectures, prior art, architecture selection) — those steps are in the write half, not the harden half. The redundancy is still there unless spec-build gains a conditional entry path (Path B from round 02). The split creates the architectural structure for committee to author specs but does not eliminate the waste by itself. Path B is still needed.

**What fragmentation costs:**

- **Two skill contracts instead of one.** design-specify has one entry condition, one output artifact, one version counter, one provenance trailer command. Splitting it requires two SKILL.md files, two version histories, two integration sections, two entry conditions, two sets of callers that must be updated (design-small-task Integration section, design-committee exclusion list, plan-build's invocation context, util-artifact-schema).

- **Migration cost against a v0004 proven skill.** design-specify has an archived track record across 25+ sprints. Its artifact naming, the ground-truth report format, the spec provenance trailer — all of these are stable contracts referenced in archived artifacts. Splitting requires either a migration of all these references or a compatibility shim.

- **The adversarial context coupling requires a new artifact.** Passing the authoring context (architect choice, prior-art findings, brief intent) from spec-build to spec-harden requires either a structured handoff artifact (new artifact type, new naming convention, new schema) or accepting a weaker adversarial pass. Neither is free.

---

## What the Split Gets Right

The designer's diagnosis has real force: design-specify does fuse two concerns, and fusing them is what makes committee spec-authorship architecturally awkward (CF1's category argument depends on it). Separating write from harden is a coherent design move with a sound conceptual basis.

But the benefit is unlocking committee spec-authorship — and the evidence from rounds 01 and 02 says committee should not author specs (CF1, 4-0). If CF1 still holds, the split's primary benefit is not realized. The split would impose fragmentation cost in exchange for a capability the committee should not have.

If the designer is reconsidering CF1 — if the premise is that committee-authored specs are now desirable — that is a different question, and it changes the calculus. But CF1 was a 4-0 convergence on evidence and logic; the round 03 reframe has not presented new evidence against CF1, only a structural change that makes committee spec-authorship *possible*.

---

## Does Round 02 Path B Become Obsolete?

No. If the split happens, spec-build still needs Path B to avoid re-deriving architecture the committee already settled. Path B is an entry condition that eliminates the front-half waste — that waste exists in the write phase regardless of whether write and harden live in one skill or two.

If the split does not happen, Path B is the minimal fix: design-specify gains a conditional entry, committee scope is unchanged, no fragmentation.

---

## Conservator Verdict on the Split Proposal

The split is premature. It imposes real fragmentation cost (two contracts, migration burden, adversarial context coupling requiring a new artifact) in exchange for a capability (committee spec-authorship) that the committee should not use per CF1. The seam is not clean at the adversarial pass. Path B is still needed whether or not the split happens.

The right sequence: resolve the Path B bridge question first (B1 vs B2 from round 02), close A3 (adversarial independence). If, after those fixes are shipped and operating, the committee's spec-authorship capability emerges as a live need the system cannot serve, revisit the split then — with a real requirement driving it.

---

## Final Position

**Position:** Oppose the split now. The seam is not clean (adversarial pass couples across the boundary), the split's primary benefit (committee spec-authorship) is blocked by CF1, and the fragmentation cost is real. Path B from Round 02 remains necessary regardless of split outcome.

**Rationale:** design-specify is a proven v0004 skill with 25+ sprint archive. The adversarial pass's inline rationale is an explicit cross-seam coupling. The split dissolves CF1's category argument but does not overturn it — CF1 stands on evidence and logic independent of the structural arrangement. Impose fragmentation cost only when the benefit is live, not hypothetical.

**Blocking risk:** Splitting without resolving the adversarial context coupling produces a weaker spec-harden skill than exists today. That is a quality regression in the hardening chain — the one chain with a track record of catching HIGH errors before plan-build.

**Warrant:** {type: evidence, source: design-specify SKILL.md adversarial-pass inline rationale (explicit cross-seam coupling declaration); researcher-findings.md Pair F (ground-truth + adversarial caught 5 HIGH FK errors, 2 HIGH DI errors — the hardening chain must not be weakened); round01 alignment-map CF1 (4-0, not overturned by round03 structural reframe alone).}
