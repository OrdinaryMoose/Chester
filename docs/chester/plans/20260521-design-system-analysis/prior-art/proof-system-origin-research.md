# Proof System Origin Research

**Prepared:** 2026-05-21
**Scope:** Chester project at `/home/mike/Documents/CodeProjects/Chester/docs/`
**Purpose:** Trace why the proof system exists, what each generation was designed to solve,
and what the corpus says about the plain-session counterfactual.

---

## 1. The Original Problem: What Was Broken Before Proof-MCP

The pre-proof design session skill (`design-figure-out`) used behavioral prohibitions to prevent
the agent from producing premature output: "don't write code," "don't propose solutions," "don't
produce a problem statement yet." These instructions were stacked instruction layers that fought
the agent's natural completion drive rather than redirecting it.

The sprint `20260408-03-plan-mode-design-guard` (the originating sprint for proof-MCP) names this
as the foundational failure mode:

> "The design interview's behavioral prohibitions fight the agent's natural completion drive rather
> than channeling it. The agent accumulates a rich mental model during codebase exploration and
> feels compelled to produce concrete output — code, finished analyses, implementation plans.
> Stacking 'don't do X' instructions consumes token budget and degrades over long contexts."

The prior sprint (`20260405-01-architect-round-one-fix`) had already established the principle:
*prohibitions lose against the agent's completion drive; redirecting goals works better.* That
sprint applied the principle to the conversation layer (understanding MCP replaced "don't produce
a problem statement" with "score your understanding gaps"). It had not yet applied it to the action
layer — the agent's drive to write concrete, structured output.

**The specific failure that triggered proof-MCP:** The agent would reach Phase 2 (Solve) and,
lacking a structured finishable target, would generate code-flavored prose or implementation plans
that baked in dozens of unstated assumptions. The designer would receive something that *looked*
like design work but was actually the agent's projection of a solution.

**The designer's key insight** (recorded in the thinking document for this sprint):

> "Instead of preventing writing, redirect what the agent writes. If the design itself is the
> 'code' — a concrete, structured, progressively complete artifact — the agent's completion drive
> works for you. The agent gets to build something every turn, but the thing it builds is the
> design, not implementation code."

The original proof-MCP was the answer: give the agent a formal proof language (seven element
types: GIVEN, CONSTRAINT, ASSERTION, DECISION, OPEN, RISK, BOUNDARY) and make "build the proof"
the agent's finishable target. The proof was machine-first — optimized for the agent, not for
human readability. The designer read it only for debugging.

---

## 2. What Was Wrong With Proof-MCP: The Redesign Trigger

The redesign was triggered by a **post-inaugural-run review** after the first real use of
proof-MCP in a StoryDesigner design session (canonical format design, April 2026). The review
surfaced one central finding, named explicitly in the conop document
(`docs/feature-definition/Complete/design-proof-system-conop-00.md`):

> **"The agent was talking to itself through the proof."**

The full finding:

> "The agent authored the problem statement, created questions (OPENs), answered its own
> questions, recorded its own conclusions (ASSERTIONs), synthesized designer statements into
> formal decisions, and drove toward closure by resolving its own elements. The proof tracked the
> agent's internal model of the conversation, not the design itself. The designer interacted
> through natural conversation; the proof was invisible to them. The formal rigor was real — but
> it was the agent being rigorous with itself, not the designer being rigorous with the agent."

Seven specific issues were identified clustering into three themes:

**Element type confusion:** CONSTRAINTs were used as requirements rather than prohibitions;
BOUNDARY and CONSTRAINT overlapped enough that choosing between them was arbitrary; GIVENs
conflated verifiable codebase observations with authoritative designer declarations — treating
them as the same type when they have structurally different epistemic status.

**Agent self-reference (the load-bearing failure):** The problem statement became the agent's
expansion of the designer's words, not the designer's words. OPENs were the agent's own
implementation anxieties parked as design questions, then resolved by the agent to drive the
closure metric. Closure progress was bookkeeping, not design progress.

**Missing logical structure:** The proof tracked element inventory (what facts exist, what
decisions were made) but not reasoning chains. Basis arrays showed "decision D cites elements
G7, G10, G13" without showing how those premises lead to the conclusion. There was no
falsifiability mechanism — no way to ask "if this premise is wrong, which decisions collapse?"

**The net failure:** The proof was structurally valid but designer-invisible. The designer could
have been replaced with a rubber stamp and the proof would have closed identically. The formal
rigor was directed inward at the agent's self-consistency, not outward at the design's grounding
in the designer's intent.

### The Redesign Response

The redesigned proof-MCP (`Necessary Conditions Model`, same sprint document) replaced the
seven types with five: EVIDENCE (codebase facts), RULE (designer-directed restrictions,
designer-sourced only), PERMISSION (designer-directed relief, designer-sourced only), NECESSARY
CONDITION (agent-proposed, requires grounding chain + collapse test + reasoning chain + rejected
alternatives), and RISK. OPEN was removed entirely — the agent can no longer park self-generated
questions that gate closure.

The structural authority split became explicit and load-bearing: the agent proposes necessary
conditions; the designer asserts the rules and permissions that constitute the inferential
framework; the designer ratifies conditions. The proof cannot be closed by one player alone.

---

## 3. The Redesigned Proof-System's Stated Purpose and Design Intent

The Vision document for the redesigned proof-system
(`docs/chester/plans/20260511-01-mp-redesign-proof-system/design-history/01-vision.md`)
states the purpose in one paragraph:

> "The proof system is a structured environment in which an LLM agent constructs a design
> rationale for a software design problem, in collaboration with a human designer, under
> disciplines that channel the agent's completion drive toward feasible solutions rather than
> cheap implementations."

And the motivating problem directly:

> "The motivating problem: an LLM agent given a software design problem will, by default, produce
> code or code-flavored prose that bakes in unstated assumptions. The result looks plausible,
> takes effort to debunk, and resists later re-examination because the assumptions are buried in
> implementation rather than expressed as claims."

The Vision names seven design principles. The most architecturally load-bearing:

- **The channeling principle:** "The standard mitigations — better prompting, more context,
  'plan first' — try to *suppress* the drive. They fight the model. The channeling move is
  different. It accepts the drive as fixed and substitutes the target."

- **Two-player asymmetric authority:** "The Agent and Designer have structurally different
  powers. The Agent proposes, revises, withdraws. The Designer asserts axioms (Rules, Permissions)
  and ratifies. This asymmetry is load-bearing; collapsing it dissolves the architecture's
  authority structure."

- **The structural/semantic gap:** "The architecture distinguishes between what the system can
  mechanically check and what it cannot. Structurally: well-typed elements, terminating grounding
  chains, satisfied closure predicates, integrity-zero, body-advancement signals. Semantically:
  whether a collapse_test is *true*... The Designer's authority — ratification, rule-assertion,
  withdrawal of agent claims — is the architecture's primary semantic mechanism."

The `rebuild-design-derivation` master plan (Cluster A through D, 2026-04-30 through 2026-05-21)
added a third concern on top of the redesign: the proof's closure gate validated element
well-formedness but did not validate *against the problem statement*. The brief's Acceptance
Criteria were authored as agent prose at render time with no upstream structural source.
Cluster A added `Resolve Conditions` (the sixth element type) and `Concerns` to close this gap:
the proof must now explicitly map to the designer's enumerated Concerns and the closure gate must
verify per-Concern coverage.

The Cluster D.1 Vision (`cluster-d-1-design-00.md`) reformulated the purpose at the highest
level with two designer-ratified rules: **"Design is the code"** (the formal language IS the
design medium, not a record of it) and **"The purpose is Shared Understanding"** (the system
exists to produce alignment between agent and designer, not to produce a document).

---

## 4. The Plain-Design-Session Counterfactual

### What the Corpus Claims Plain Sessions Cannot Do

The corpus makes a consistent, multi-generation argument against plain sessions. It is never
expressed as a single empirical test but as accumulated observation across the inception sprint,
the inaugural-run postmortem, and the corpus analysis sprints.

**Claim 1 — Completion drive produces assumptions, not design:**

> "An LLM agent given a software design problem will, by default, produce code or code-flavored
> prose that bakes in unstated assumptions. The result looks plausible, takes effort to debunk,
> and resists later re-examination because the assumptions are buried in implementation rather
> than expressed as claims." (Vision document, §9)

**Claim 2 — The agent was already being rigorous — just with itself:**

The inaugural-run postmortem is the sharpest statement of what plain-session rigor actually
produces. The proof system *was* running. The agent *was* being careful. The result was still
designer-invisible. This means the question is not "does the agent do careful work" but "does
the agent's careful work engage the designer's intent structurally." The plain-session
counterfactual produces the first but not the second.

**Claim 3 — Behavioral prohibitions decay under context pressure:**

From the master plan's genesis section:

> "Investigation revealed that behavioral prohibitions ('don't write code,' 'don't propose
> solutions') fight the agent's completion drive rather than channeling it... Stacking 'don't do
> X' instructions consumes token budget and degrades over long contexts."

The StoryDesigner corpus harvest (`research-storydesigner-harvest-00.md`) confirms this at the
session level: in a long session (a59aaa50), the agent's open-pull questions degraded after the
ninth consecutive instance and the designer shifted to terse "yes / continue / 1 / 2" responses,
suggesting the unstructured conversational surface stops engaging the designer substantively.

**Claim 4 — Plain sessions cannot produce the three artifacts design-specify needs:**

The master plan names what design-specify needs from the design phase: a constraint envelope, a
resolution criterion, and a coverage map. Plain sessions produce none of these structurally.
The brief's Acceptance Criteria section in the pre-Cluster-A world was "agent prose at render
time with no upstream source." That is the plain-session output shape.

### Was the Counterfactual Ever Tested Empirically?

**Directly: no.** There is no document in the Chester corpus that sets up a controlled comparison
between a plain-session design conversation and a proof-driven one, measures output quality on
the same problem, and draws conclusions.

**Indirectly: partially.** The inaugural-run postmortem is the closest thing — it reviewed the
proof-MCP session against the session JSONL and found the proof was agent-self-referential. This
tells us what the original proof-MCP produced, not what a plain session would have produced for
comparison. The session *did* produce a valid design brief through 12 rounds; the postmortem does
not claim the brief was worse than a plain session would have produced, only that the proof was
invisible to the designer.

The master plan's genesis section cites corpus evidence (five prior interview systems failed:
classic, problemfocused, team-interview, lens-architecture-rebuild, and the original
design-experimental), which implies repeated plain or semi-structured sessions with observed
failure modes. But the failure evidence is characterization, not controlled measurement.

**The honest epistemological status of the counterfactual claim:** The claim that plain sessions
cannot produce reliable design rationale is supported by extensive process observation and
repeated system-generation failure, but it has not been tested as a controlled experiment. The
corpus does not document a plain session that produced a result equivalent to what the proof
system is designed to produce. It documents many sessions where plain sessions produced
inadequate results — but those were plain sessions under a weaker framing (design-figure-out
with behavioral prohibitions), not adversarially optimized plain sessions.

---

## 5. Notable Verbatim Quotes

**On the original motivation (plan-mode-design-guard thinking document):**
> "Designer's insight: instead of preventing writing, redirect what the agent writes. If the
> design itself is the 'code' — a concrete, structured, progressively complete artifact — the
> agent's completion drive works for you. The agent gets to build something every turn, but the
> thing it builds is the design, not implementation code."

**On the inaugural-run central finding (conop-00.md):**
> "The agent was talking to itself through the proof. The proof tracked the agent's internal
> model of the conversation, not the design itself. The designer interacted through natural
> conversation; the proof was invisible to them. The formal rigor was real — but it was the agent
> being rigorous with itself, not the designer being rigorous with the agent."

**On the structural/semantic gap (vision.md §4):**
> "The architecture is honest about this gap. Structural checks are mechanical and fast. Semantic
> checks are the Designer's job. The Designer's authority — ratification, rule-assertion,
> withdrawal of agent claims — is the architecture's primary semantic mechanism."

**On what the system is not (vision.md §3.3):**
> "gIBIS, Compendium, and similar argumentation tools are designed for collaborative human
> deliberation. The proof system is designed for an LLM agent's interaction with a human
> designer. The agent's completion drive does the work that human deliberators were never
> reliably motivated to do (filling slots, walking grounding chains, considering alternatives).
> Humans alone find the same workflow tedious."

**On the channeling bargain (vision.md §5):**
> "The architecture trades agent autonomy for structural discipline. The agent's completion drive
> cannot be allowed to roam freely; the system substitutes a finite game with a clear win
> condition... The bargain is paid once at the cost of LLM autonomy. The return is a proof system
> in which the agent cannot easily produce a structurally-valid argument for the wrong design."

**On the altitude correction (cluster-a-thinking-00.md):**
> "Final shift after altitude correction: the failure mode is altitude mismatch — the proof was
> carrying engineer-altitude content the PM couldn't ratify, and the spec layer was rendering AC
> as agent prose because nothing structurally typed reached it from the proof."

**On the corpus harvest (research-storydesigner-harvest-00.md), anti-pattern section:**
> "NC ratification... In b599ccde, the human pushed back on the very vocabulary: 'why are we
> talking in terms of NC-1, NC-2, etc. I thought we decided not to use so much jargon.' The NC
> label leaked proof-MCP vocabulary into designer-facing speech."

---

## 6. Designer Comments

- The **singular purpose** of the design system is to produce the three artifacts needed by the design-specify system
- The method by which the design system accomplishes this purpose is open for deliberation
- A requirement of the design system is to plan at the architectural level
- A prohibition of the design system is to pre-determine any implementation level decisions or options
- The proof system is a design tool, not the main thing
- The proof system guides the agents but does not constrain (how do we solve the right problem, not just any problem)
- The proof system can be eliminated if there is another viable alternative that meets the Vision design principles
- Assume that the committee will continue to be used as the interview technique. The 4x pole agents are fixed.  The other participants or roles of the committee are up for review (does Arbiter become a Clerk, etc)
- Agents dont check their own work
- Design planning is 90% of the work and admin processing can only be 10% of the work 

## 7. Source Citations

All sources from `/home/mike/Documents/CodeProjects/Chester/docs/`:

- **Original proof-MCP design brief:**
  `chester/plans/20260408-03-plan-mode-design-guard/design/plan-mode-design-guard-design-00.md`

- **Original proof-MCP thinking document (designer insight):**
  `chester/plans/20260408-03-plan-mode-design-guard/design/plan-mode-design-guard-thinking-00.md`

- **Inaugural-run postmortem / redesign trigger (the "agent talking to itself" finding):**
  `feature-definition/Complete/design-proof-system-conop-00.md`

- **Redesigned proof-system Vision document:**
  `chester/plans/20260511-01-mp-redesign-proof-system/design-history/01-vision.md`

- **Redesigned proof-system Concept of Operations (failure modes):**
  `chester/plans/20260511-01-mp-redesign-proof-system/design-history/02-conops.md`

- **Rebuild-design-derivation master plan (genesis, endstate, Cluster A-D):**
  `chester/plans/20260430-02-rebuild-design-derivation/master-plan.md`

- **Cluster A design brief (Resolve Conditions, Concerns, altitude correction):**
  `chester/plans/20260430-02-rebuild-design-derivation/cluster-a-define-solve/design/cluster-a-define-solve-design-00.md`

- **Cluster A thinking document (altitude correction narrative):**
  `chester/plans/20260430-02-rebuild-design-derivation/cluster-a-define-solve/design/cluster-a-define-solve-thinking-00.md`

- **Cluster D.1 design brief (one-system architecture, D.1 proof layer):**
  `chester/plans/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1/design/cluster-d-1-design-00.md`

- **StoryDesigner corpus harvest (session Q&A analysis, anti-patterns):**
  `chester/plans/20260430-02-rebuild-design-derivation/cluster-b-define-transition/summary/research-storydesigner-harvest-00.md`
