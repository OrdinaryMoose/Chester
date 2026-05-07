# Master Plan §4.5 Cluster D — Proposed Revision

**Date:** 2026-05-05
**Status:** Proposal for designer review
**Companion:** `rebuild-design-derivation-organizing-principle-research-2026-05-05.md` (research and rationale)
**Action if accepted:** Replace the current §4.5 in `master-plan.md` with the section below.

This document contains a proposed revision of master plan §4.5 (Cluster D — Build Shared Understanding) that incorporates the refined organizing principle and both corrections ratified on 2026-05-05 (implementation drive is structural; PM is not the input source). The revision is presented in two parts: the proposed section text, and notes on what changed and why.

---

## Part 1 — Proposed §4.5 Section Text

### 4.5 Cluster D — Build Shared Understanding

- **Type:** Design + implementation cluster
- **Subdir:** `cluster-d-build-shared-understanding/`
- **Endstate Points:** Reframes points 1–4 under the cluster C one-system pivot. Points 3 and 4 (Phase 4a → 4b transition; Phase 4b solve process confirmed) are retired by the pivot. Points 1 and 2 (design-altitude planning; formalized language for design) collapse into "the design system speaks design at design altitude and produces a single captured artifact for specify." Point 5 (end criteria formalized) remains cluster A's ownership and is consumed read-only.

- **Objective:** Build a unified design system organized around three designer-ratified commitments — solve-drive redirection, agent-supplied venue construction, and PM-as-decider — that delivers commonly understood design requirements to `design-specify`. Reframes cluster C's one-system architecture pivot at higher altitude. Cluster C asked "how do we eliminate the Phase 4a / Phase 4b split"; cluster D asks "how do we create a unified design system in which the agent's implementation drive is structurally channeled into proof closure at design altitude, the agent constructs decision venues for the PM, and the captured artifact reads back as the PM's intent."

- **Organizing principles (designer-ratified 2026-05-05):**
  1. **"Design is the code."** The design system constructs a proof substantial enough to absorb the model's implementation drive at design altitude. The proof is a real solve target — necessary conditions, friction, closure conditions, dispositions, gates — weighted heavily enough that the agent's drive to "complete the task" points at proof closure rather than at implementation. This is structural redirection, not prompt-level gating; the corpus revision history (many revisions of design, few of specify or write) is direct evidence that prompt gating cannot redirect the drive and structural channeling can. Rule-class: every mechanism in the design system either contributes to the proof's structural weight at design altitude or is a candidate for removal.
  2. **"The purpose is to create Shared Understanding."** Through shared understanding the design system delivers a commonly understood set of design requirements to the Specify system. The shared understanding is between PM intent and the captured artifact, with the agent as the instrument that produces the artifact. Rule-class: every mechanism in the design system serves shared-understanding production; nothing in the design system is justified by being clever, complete, or efficient if it does not contribute to PM-intent capture.
  3. **"PM is the decider; the agent is the researcher and venue-builder."** The PM has architectural intent and decision authority but does not have codebase knowledge sufficient to drive the proof forward. The PM's role is judgment on presented venues. The agent's role is to research the codebase, prior art, and project context, and to use that research to construct well-framed decision venues for the architectural choices the PM is in a position to make. The conversation does not advance because the PM volunteers content; it advances because the agent prepares the next decision venue, presents it, and waits. Rule-class: agent generates content (input, framing, drafts, structural placement); PM generates decisions (ratifications, choices, redirects, locks). Agent-generated decisions and PM-supplied technical content are both failure modes.

- **Problem statement (designer-ratified 2026-05-05):** *How do we create a unified design system in which the agent's implementation drive is structurally channeled into proof closure at design altitude, the agent researches and frames architectural decision venues for a PM-shaped designer, and the captured artifact reads back as the PM's intent so that Specify produces architecture matching that intent.*

- **Concerns (designer-drafted 2026-05-05; cluster D internal session ratifies and locks):**
  1. **Initial information available to the skill and how the initial topic and concerns are derived.** What does the agent know at session start? What does it research first? How does the proof's first few necessary conditions get seeded?
  2. **Explorer subagents researching codebase, prior art, and project context to populate decision venues.** The PM cannot supply codebase knowledge, so explorers are the agent's primary mechanism for bringing technical context into the conversation. The design question is *how explorer output is curated to strengthen venue construction without overwriting designer-locked vocabulary or substituting explorer judgment for PM judgment.* This concern is essential, not optional; uncurated explorer dominance is the named root cause of the StoryDesigner corpus's harshest failure moment.
  3. **Presentation layer — how information is provided to the PM to build shared understanding.** Decision venues, not topic surveys. The presentation layer must adapt to whether the PM is supplying high-density novel content (vision-dump turns) or ratifying small decisions in sequence (wizard-form turns); these two modes need different surfaces, and conflating them is documented as a corpus failure pattern.
  4. **Proof layer — how the agent faithfully manages information to build shared understanding, and how the proof's structural weight absorbs the agent's solve-drive at design altitude.** The proof is both the capture mechanism and the solve target; capture and drive collapse into the same machinery. The proof's altitude lock (necessary conditions describe observable problem-altitude states, not implementation properties) is critical and is preserved from cluster A's five-attribute resolution-claim lock.
  5. **Asymmetric advancement — agent does the active labor (research, framing, drafting, structural placement), PM does the decision labor (ratify, choose, redirect, lock).** The labor split must be made explicit so the system does not expect PM-supplied technical content where agent-supplied research is the correct input, and does not let the agent make decisions that should belong to the PM.
  6. **Proof system reporting gaps to direct the next round of agent research.** The agent's drive points at proof closure, so proof-detected gaps direct research because the agent is solving the proof. This concern is the solve-drive in operation and is essential to the principle.
  7. **Decision-substitution detection — what stops the agent from making decisions that should belong to the PM, particularly when the PM cannot detect the substitution because they lack the technical context to recognize implementation-altitude options dressed as architectural choices.** This is the principle's hardest test in practice; without explicit machinery, agent research-and-framing can substitute for PM judgment in ways the PM ratifies without realizing.
  8. **Proper information provided to specify so it creates architecture that correctly addresses PM intent.** Read-back fidelity: the PM reads the captured artifact and ratifies "this is my position" without further correction. CN-7 closure.

- **Inheritance:**
  - **Cluster A + B.1 + B.2 shipped capabilities** — read-only inheritance. Includes proof MCP element types (NC, Rule, Permission, Evidence, Risk), Resolution Claim, Concern, submission_material contract, restructuring + provenance, closing argument, two-yes closure gate, friction, phantoms, dispositions. Cluster D session audits each capability through the refined principle's lens before locking; capabilities found to serve generation-of-content rather than capture-of-PM-intent are candidates for reshaping.
  - **Cluster C session learnings** — carried forward as opening seed. Reframed problem statement, seven concerns, six evidence pieces with reclassified sources, organizing principles. Cluster D session ratifies each through the refined principle before locking.
  - **Master plan R1–R10** — set aside for cluster D internal session per cluster C pivot amendment. Cluster D reauthors the rules it needs. New rules likely required: *the captured artifact is in the designer's locked vocabulary*; *the agent generates content and the PM generates decisions*; *the proof's structural weight is itself the channel for the implementation drive*; *the system measures itself on read-back fidelity, not on coverage scores*.
  - **Vocabulary corpus** at `cluster-a-define-solve/summary/vocabulary-corpus-2026-05-05.md` — read-only inheritance, with cluster D extending the maintenance protocol (designer ratifies, system locks, all later mentions check against locked form) as a model for design-altitude language generally.
  - **Organizing principle research** at `design/rebuild-design-derivation-organizing-principle-research-2026-05-05.md` — opening context for the cluster D internal session. The two corrections (implementation drive is structural; PM is not the input source) are ratified at session start as locked working tenets. The counterfactuals seed the cluster D Risk register.

- **Exit criteria:**
  - Cluster D design brief committed.
  - `design-specify` run; `plan-build` run; `execute-write` delivered.
  - The three organizing principles operationalized in the resulting `design-large-task` skill: structural channel for implementation drive (proof weighted heavily enough at design altitude); agent-supplied venue construction (explorers curated, framing produced, decisions framed for PM judgment); PM-as-decider asymmetry (agent does active labor, PM does decision labor).
  - **Read-back fidelity test:** in a sample design conversation, the PM reads the captured artifact at session end and ratifies "this is my position" without further correction. This is the concrete measurable form of CN-7 closure.
  - **Substitution-prevention test:** in the sample design conversation, decisions captured in the proof trace to PM ratification turns, not to agent commentary turns. The proof's content is mostly agent-supplied; the proof's *decisions* are PM-supplied.
  - **Drive-channel test:** in the sample design conversation, the agent does not produce implementation-altitude content in its commentary blocks beyond a measurable rate; the proof's structural weight visibly absorbs the drive.

- **Depends on:** Cluster A + B.1 + B.2 (all done). Inherits cluster C session as opening seed. Inherits the 2026-05-05 organizing principle research as locked tenets at session start.

- **Status:** pending.

---

## Part 2 — Notes on the Revision

The most consequential changes from the prior draft of §4.5:

**Three principles instead of two.** The earlier draft folded venue-construction and PM-as-decider implicitly into principle #2's "shared understanding" frame. Splitting them into a third explicit principle prevents cluster D from inheriting the ambiguity that produced the early-session organizing-principle reformulation. Each principle now has a single rule-class.

**Principle #1's rationale is rewritten** to name the structural-channel-for-implementation-drive function explicitly, with the corpus revision-history evidence cited. The prior "give the agent and designer a formal language to operate with" framing is replaced. The vocabulary-corpus mechanism is retained as one expression of the principle, not the principle itself.

**Problem statement is expanded** to name the three commitments (drive channel, venue construction, read-back) so the cluster D session has a single sentence that covers the principle's full scope. The "between whom" question is resolved inline.

**Concerns reorganized.** Concern #2 reframed from "research the topic" to "populate decision venues" with explicit curation as the load-bearing constraint. Concern #5 made asymmetric in language. Concern #6 framed as the solve-drive in operation. Concern #7 added (decision substitution). Concern #8 (originally #7) preserved as the end criterion. Eight concerns instead of seven.

**Inheritance audit posture made explicit.** Cluster A and B capabilities are read-only but cluster D ratifies each through the refined principle before locking — capabilities found to serve generation rather than capture are candidates for reshaping. This prevents cluster D from treating shipped capabilities as locked structure when some may have been built under the elicitation-led framing.

**Three exit-criteria tests added** corresponding to the three principles. Each is concrete enough to fail measurably: read-back fidelity (PM ratifies the artifact); substitution prevention (decisions trace to PM turns); drive-channel (implementation-altitude content stays out of commentary). These give the cluster D execute-verify-complete step something to check beyond "the artifacts shipped."

---

## Part 3 — Open Items for Designer Review

Items that the designer should specifically review before this proposal replaces the current §4.5:

1. **Endstate-points reconciliation.** The proposal retires points 3 and 4 under the cluster C pivot and collapses points 1 and 2 into a single "design at design altitude" commitment. Confirm the retirement and collapse, or specify a different mapping.

2. **Three principles versus two.** The proposal splits PM-as-decider into a separate third principle. Confirm this split is the right structural shape, or specify how venue-construction and PM-as-decider should fold into principle #2.

3. **Concern #7 (decision substitution).** This is a new concern not in the prior draft. Confirm it should be in cluster D's scope, or specify whether it belongs in a later cluster.

4. **Three exit-criteria tests.** Read-back fidelity, substitution prevention, and drive-channel. Confirm these are the right tests, or specify alternative measurable forms.

5. **Concern #2 curation framing.** The prior draft said explorers "research information relevant to our topic"; the proposal reframes them as populating decision venues with explicit curation. Confirm the reframing.

6. **Inheritance audit posture.** The proposal asks cluster D to audit cluster A and B capabilities through the refined principle before locking. Confirm this is the right posture, or specify a different inheritance treatment.

If the proposal is accepted as-is, it replaces the current §4.5 in `master-plan.md`. If items above need adjustment, the proposal can be revised before being written into the master plan.
