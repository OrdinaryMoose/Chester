# Committee 99/1 Feasibility Deliberation — Researcher Verbatim Return

**File:** `committee-99-1-feasibility-returns-researcher-00.md`
**Recovered:** 2026-05-21 (Path 1 transcript extraction)
**Original deliberation date:** 2026-05-21 09:52–09:55 UTC
**Source transcript:** `/home/mike/.claude/projects/-home-mike-RiderProjects-StoryDesigner/987c9826-c9d4-4f35-a422-6d98aabdac43.jsonl`

## Provenance

This is your verbatim peer-message return from the 99/1 admin/design-time-share feasibility deliberation that took place at the close of NCON-6 R-A1. The deliberation was conducted by the team-lead with the prior Committee team (now terminated) consisting of Conservator, Innovator, Pragmatist, Purist, and Researcher contributions.

Your return was consolidated into a decision packet held only in conversation context. The prior Committee team was subsequently terminated during NCON-6 suspension cleanup before the verbatim returns were persisted as a sprint artifact — a violation of the `feedback-committee-persistence-default` rule (which was written contemporaneously with this recovery). Recovery executed via the same Path 1 transcript extraction approach used for the R-A1 Propositions context loss earlier in the session.

This recovery artifact is the foundational substantive content from your own prior contribution to the deliberation. The current design-system-analysis session continues from this work. Read this in full before any substantive dispatch this session.

## The deliberation question

The team-lead dispatched each pole and the Researcher with the same framing:

> REQUIREMENT: 99% time on substantive design work, 1% on proof-compliance admin.
> STAKES: Committee-interview-proof system terminates if not solvable.
> CONTEXT: Implementable-now changes alone may not reach the bar; engine changes available in a future Chester proof-system performance sprint.

Each pole received a lens-specific task framing. Researcher received an external-precedent and Chester-engine-source research task.

## Your verbatim return

99/1 FEASIBILITY RESEARCH — Researcher return. Three axes: precedent, engine-source, sustainability-research.

---

AXIS 1 — PRECEDENT

**Formal proof assistants (Coq, Isabelle, Lean): admin near-zero by construction, not by policy.**

In interactive theorem provers, the user writes tactics; the system handles all bookkeeping — proof state management, obligation tracking, dependency resolution, rendering. The human cognitive load is 100% substantive argument construction. Admin is structurally zero because the system never asks the human to do system-maintenance acts. The price: the user must speak the system's formal language fluently, which has a steep onboarding cost. Lean 4's Mathlib has tens of thousands of machine-checked proofs at this ratio. The structural pattern that achieves near-zero admin: the proof engine does all record-keeping silently; the human sees only obligations and confirmation requests. No IDs, no element-category tracking, no grounding-chain navigation — the system handles all of that in response to tactic application.

**Warning sign that a proof-collaborative system is heading toward termination: the ratio inverts at scale.**

The Mizar Mathematical Library (one of the oldest machine-verified mathematics repositories) documented in the early 2000s that as proofs grew longer, the fraction of author time spent on system-appeasing edits (restatement to satisfy type-checker, re-threading after a dependency change, formatting for the verifier) grew relative to mathematical content. Authors began writing shorter proofs and splitting obligations into many small lemmas purely to manage system overhead — a structural adaptation that preserved the system but changed the mathematics being formalized. This is the warning sign: when authors restructure their content to reduce system friction rather than to improve the argument.

**gIBIS / QOC (1987–2022): the 35-year adoption-failure record.**

Chester's own design brief for the decision-record system (`docs/chester/plans/20260424-01-build-decision-loop/design/build-decision-loop-design-00.md` lines 74–75) cites the authoritative source: "no designer can be expected to enter quality rationale solely for the possible benefit of a possibly unknown future reader." The gIBIS (graphical Issue-Based Information System) and QOC (Questions, Options, Criteria) systems collapsed not because the captured rationale was valueless — it was valuable — but because the capture act was expensive at author time and the benefit was deferred and diffuse. The ratio was inverted: high admin per captured insight, low immediate return. Every advisory-only rationale capture system in this tradition decayed under deadline pressure within 2–3 years of deployment. The structural pattern that causes termination: capture obligation is proportional to proof size, benefit is proportional to future reader count, future reader count is unknown at capture time.

**Smoking-gun near-miss toward 99/1: LangGraph `interrupt()` pattern.**

The closest industry precedent to 99/1 for an LLM-human collaborative system is LangGraph's `interrupt()` + state-checkpoint model, cited in Chester's decision-record design (`build-decision-loop-design-00.md` line 75). The pattern: agent runs forward continuously, state is checkpointed, execution pauses only when a genuine decision point is reached, human provides input, execution resumes cleanly. In well-instrumented deployments, the human's interaction time is less than 5% of wall-clock time. The system handles all state management silently. The price: the human sees only pre-framed decision forks, not the full reasoning. This is near-99/1 by wall-clock ratio but only because the human is excluded from most of the system's work, not because admin is zero — admin is done silently by the infrastructure.

---

AXIS 2 — ENGINE SOURCE

**`/home/mike/Documents/CodeProjects/Chester/docs/chester/plans/20260511-01-mp-redesign-proof-system/design-history/02-conops.md` — failure modes section is the load-bearing source.**

Lines 160–230 document five named failure modes. Three are directly relevant to admin/cognition balance:

- **Race-to-presentation (§5.4):** "The Agent rushes the closing argument, presenting before all gates are genuinely cleared. The trigger gate refuses; the Agent proposes thin elements to clear it; the proof's content quality drops in service of gate-clearance." This is the failure mode when admin overhead (clearing gates) dominates: the agent optimizes for gate-clearance rather than substantive argument. This is what 99/1 protects against but is also what 99/1 risks inducing — if admin acts feel like progress, they get optimized.

- **Stalled proof (§5.3):** "The proof opens, the Agent constructs some Propositions, the Designer doesn't ratify, work pauses. Body-advancement is zero round-over-round." The conops notes that body-advancement is observable. Zero body-advancement across rounds IS the measurement signal for admin overhead dominating: the agent is spinning on system-maintenance acts rather than producing ratifiable content.

- **Authority drift (§5.5):** "The Designer ratifies without reading. The structural gates do their job, but ratification becomes mechanical." When admin acts feel like overhead rather than genuine design work, the Designer's engagement degrades — this is how the system's quality guarantee collapses silently while the admin acts continue.

**`/home/mike/Documents/CodeProjects/Chester/docs/chester/plans/20260430-02-rebuild-design-derivation/master-plan.md` line 371 — explicit feasibility finding.**

"Subagent dispatch infeasible mid-conversation (>5 min/round breaks feasibility)." This is recorded as a pivot pre-condition for the cluster C redesign. It is the closest the Chester corpus comes to a documented admin/cognition ratio constraint: latency above a threshold makes the session infeasible regardless of cognitive quality. The 5-minute threshold is not a 99/1 target — it is a binary feasibility boundary below which the session terminates by abandonment.

**`/home/mike/Documents/CodeProjects/Chester/docs/admin/decision-record-postmortem.md` — live case study of an admin system that returned zero value.**

The decision-record MCP system spent one large sprint to build infrastructure that returned zero records across four subsequent sprints. Lines 96–98 identify the structural cause: "the better design is, the less the loop fires. The trigger criterion is structurally inverse-coupled to the upstream design work." This is the inverse-coupling phenomenon — the cleaner the substantive design work, the less the admin system fires. If 99/1 is achieved by doing good design work, the admin system contributes nothing. If 99/1 is achieved by suppressing admin acts, the admin system's safety net is gone. Both outcomes are "correct" by the metric and both are problematic.

---

AXIS 3 — SUSTAINABILITY RESEARCH

**Chester's optimization research paper (`docs/chester/plans/2026-03-28-chester-optimization-research/source-paper.md`) — Agent Efficiency Ratio framing.**

Line 23: "their token consumption makes naive deployment economically unsustainable." The paper frames admin overhead as a structural cost that degrades cognition via context rot — not as a separate budget item but as a quality penalty. Long contexts degrade model attention to substantive content. Admin acts consume context without contributing to the proof. The paper's finding (lines 56–58): "Above fifty percent fill, the pattern shifts to pure recency bias — the model favors the most recent tokens, with early tokens (including the system prompt) becoming the least reliable." If admin acts fill the early-to-middle context and substantive content arrives late, the model's attention discipline inverts the actual priority weighting.

**Structural finding on 99/1 feasibility: achievable only if admin is externalized, not eliminated.**

Across all three axes, the pattern is consistent. Systems that approach high cognition/admin ratios do so by moving admin work to infrastructure (Coq/Lean: proof state managed by the kernel, not the author; LangGraph: state managed by checkpointing, not the human). Systems that try to reduce admin by simply doing less of it collapse on quality (advisory-only rationale capture decays; gates that don't enforce become theater). The structural conclusion: 99/1 is achievable in principle if the engine absorbs admin silently, but not if 99/1 means "the human only does admin 1% of the time by doing less admin." The former is an architecture choice; the latter is a quality-guarantee erosion.

**No evidence that 99/1 is structurally infeasible for this class of system.** The formal-proof-assistant precedent demonstrates it is achievable when the engine handles bookkeeping silently. The warning signs for imminent termination are: (a) body-advancement goes to zero across rounds, (b) agent optimizes element content for gate-clearance rather than argument quality, (c) designer ratifications become mechanical without legible content review. All three are directly observable in the current engine's state surface.

Word count: ~785.

---

## Sibling returns

The other four Committee contributions are in companion files in this same working directory:

- `committee-99-1-feasibility-returns-conservator-00.md`
- `committee-99-1-feasibility-returns-innovator-00.md`
- `committee-99-1-feasibility-returns-pragmatist-00.md`
- `committee-99-1-feasibility-returns-purist-00.md`
- `committee-99-1-feasibility-returns-researcher-00.md`

A consolidated artifact with all five returns is at `committee-99-1-feasibility-returns-00.md`. Read your own first. Read siblings only when team-lead directs.

## Reading discipline

Initial read only. No DMs to other teammates. No action. No follow-up proposals. The team-lead has not yet dispatched any analytical task; this is foundational context for the upcoming work.
