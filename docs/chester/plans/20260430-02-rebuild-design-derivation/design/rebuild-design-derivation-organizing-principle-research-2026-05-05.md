# Organizing Principle Research — 2026-05-05

**Master plan:** `20260430-02-rebuild-design-derivation`
**Status:** Research input to cluster D framing
**Source dossiers:** `/tmp/chester-interview-prompt-research.md` (recursive corpus), `/tmp/chester-interview-prompt-research-storydesigner.md` (StoryDesigner corpus)

This document consolidates the research, analysis, principle refinement, and cluster D review produced in the 2026-05-05 session. It is intended as input to the cluster D internal proof session — not as cluster D's design brief itself.

---

## 1. Research Summary

### 1.1 Recursive corpus — Chester designs Chester

Sample: ~10 sessions across three skill generations (`design-figure-out`, `design-experimental`, `design-large-task`), Apr 8 – May 4 2026. Almost every session is Chester being used to design Chester or an adjacent skill.

Topic-selection mechanism evolved monotonically: agent-instinct → OPEN-list walk → saturation-score-driven plus designer-injected rules.

Drift frequency by generation: 25% / 25% / 14%. Drift type changed across generations — Gen 1 drift specified the artifact being built; Gen 3 drift hides inside design-vocabulary surface and is caught by the proof MCP's vocabulary-leakage detector rather than by human reading.

Designer behavior shifted from answering questions (Gen 1, Gen 2) to issuing fiat rules (Gen 3). Two new Gen 3 friction patterns absent in earlier generations: navigation loss ("are we in the understand loop or still in round one?") and format pushback ("re-present in bullets without advancing"). The hedge tail "or is there a more fundamental question I'm missing" appeared 7+ times across two Gen 3 sessions; three of seven instances drew rule-injection or compression-demand replies.

### 1.2 StoryDesigner corpus — real third-party product

Sample: 12 sessions across ~16 sprints, Apr 5 – Apr 29 2026. Real product subject (story-authoring, compiler frameworks, validation pipelines), not Chester self-design. Generation 3 dominates the sample. Master-plan accumulation bias replaces recursion bias.

Drift frequency by generation: 14% / 25% / 11%. Generation 1 drift dropped from 25% to 14% versus the recursive corpus — when the design subject is unfamiliar product code, the agent has fewer precise implementation handles to reach for. This supports the recursion-bias hypothesis from the original dossier.

Drift type in Gen 3 differs from the recursive corpus. StoryDesigner Gen 3 drift comes from three mechanisms:

- **Codebase-symbol absorption.** The agent reads a deep file, surfaces specific identifiers (`IDslToDtoMapper`, `BuildGateService`), and those identifiers ride into the closing question.
- **Explorer-report dominance.** The agent's own self-postmortem in `c2968625` named this: three parallel explorers produced ~50KB of context biased toward concrete substrate, and the agent treated dense-as-relevant. This caused two consecutive wrong-altitude turns and the corpus's harshest pushback ("two substantial mistakes in two turns, what is going on with the agent?").
- **Sprint-scope binaries masquerading as design questions.** "Narrow / middle / wide" framings are sprint-management questions wearing design-question clothing.

Designer behavior in StoryDesigner runs hotter on engagement and gentler on rules. Vision-dump replies (7-sentence architectural monologues triggered by an agent's three-concern decomposition) are common. Reframe-via-question (designer answers a binary with a sharper counter-question) appears 6 times — distinctively higher than the recursive corpus. One wholesale-dismissal moment, harder than anything in the recursive corpus.

Patterns conspicuously absent in StoryDesigner versus recursive: hedge tails, compression demands, subagent-fork policy debate. The hedge-tail absence is the strongest indicator that some Gen 3 friction signals are recursion-specific tics, not stable skill behaviors.

### 1.3 Cross-corpus reading

Two narratives are compatible with both corpora.

**Charitable narrative.** Each generation added structural discipline the prior lacked. Topic selection grounded, altitude detection automated, transitions gated, vocabulary policed. The skill matured from "agent uses taste" to "agent operates inside a scored state machine."

**Alternative narrative.** The skill became more elaborate while the work it did got smaller. Generation 2 was the local maximum on engagement-per-mechanism. Generation 3 layered scoring, vocabulary policing, transition gates, and format conventions; each addition solved one problem and opened new failure modes (detector-driven topic priority, navigation loss, rule-injection bypassing prompts, format conventions patched in via memory rather than skill discipline). Drift drop from 25% to 14% rests on small samples and judgment-call labels. Designer engagement-density inflation in StoryDesigner reflects task novelty (architecture being defined for the first time) rather than skill quality. Codebase grounding is detector-driven (parallel-explorer feature) rather than design-skill feature.

The designer chose the alternative narrative as the more accurate read, with a focus on the framing *the skill's value is organizing-surface for content the designer brings*.

---

## 2. Two Corrections to the Alternative Narrative

The first formulation of the organizing principle — *the design system metabolizes designer-supplied content* — was incomplete on two structural axes. The corrections below carry the load for the refined principle.

### 2.1 The implementation drive is structural, not addressable by prompts

The drive to implement is baked into the model's training. It is the path of lowest resistance for an LLM, the shape of "I have completed the task." Prompt-level gating cannot redirect a structural drive; the corpus revision history proves this. Chester's design system has been revised many times because the design system fights the model's nature. Specify and write have been stable because they align with the model's nature. That asymmetry is direct evidence that the drive is structural and cannot be eliminated by "do not write code" instructions.

The "design is the code" philosophy is the only known move that addresses this at the right altitude: do not fight the drive, give it somewhere to go. The proof is constructed as a real solve target — necessary conditions, closure conditions, friction, dispositions — so the model's drive to "complete the task" points at proof closure rather than at implementation. The proof has weight, structure, and a definite end-state, which is what training rewards. The agent gets to solve, but it solves design.

This reframes why specify and write have been stable: those phases let the drive run in its native direction. Design is the only phase where the machinery does load-bearing structural work against the drive, which is also why design has needed many revisions to find a shape that holds.

### 2.2 The product manager is not the input source

The PM has architectural intent and decision authority but does not have codebase knowledge sufficient to drive the proof forward. Treating the PM as the primary input source produces a session that stalls on input drought.

The PM's role is to make decisions on information that is presented to them. That casts two distinct burdens on the agent. The first is to receive PM decisions, place them correctly, and reflect them back faithfully — receiving discipline. The second, and the one the first formulation missed, is to **construct a well-framed decision venue** for each architectural choice the PM is in a position to make. The conversation does not advance because the PM volunteers content; it advances because the agent prepares the next decision venue, presents it, and waits.

The recursive corpus and the StoryDesigner corpus both hide this burden because their designers were expert designers (the same person designing the design system; the system architect with deep codebase knowledge). Both supplied rich content. A pure-PM corpus would expose the venue-construction burden immediately.

---

## 3. The Refined Organizing Principle

**The design system constructs well-framed architectural decision venues for the product manager, populated by agent-supplied research, captured in a proof that the agent solve-drives toward at design altitude.**

Three components carry the principle.

**Solve-drive redirection.** The proof is constructed as a real solve target so the model's implementation drive points at proof closure instead. This is structural, not behavioral. The proof must be substantial enough to absorb the drive — necessary conditions, friction, closure conditions, dispositions, gates. Anything that lightens the proof weakens the channel. The "design is the code" philosophy is one expression of this commitment.

**Venue construction by the agent.** The agent researches the codebase, the prior art, and the project context, and uses that research to frame architectural decisions the PM is in a position to make. The agent does most of the active work in preparing each round; the PM's effort is concentrated at decision points. The output of agent research is a decision venue, not a topic survey.

**PM as decider, not contributor.** The PM ratifies, decides, redirects, and locks. The PM does not supply technical content. When the PM ratifies a vocabulary item, that item locks. When the PM decides between framed options, that decision becomes a Rule. When the PM redirects, the agent rebuilds the venue. The PM's value is judgment on presented venues, not raw input.

The proof captures all of this and is also the agent's solve target. Capture and drive collapse into the same mechanism — the more carefully the proof is structured, the harder it pulls the agent toward design-altitude work.

### 3.1 Consequences

Topic selection follows venue gravity (the next decision the proof needs and the PM is in a position to make), reported by saturation gaps, populated by explorer subagents, and shaped by PM redirects. Saturation reports gaps as a service to topic selection but does not steer it. PM redirects are first-class inputs that rebuild the venue, not interruptions.

Vision dumps, fiat rules, reframe-via-question turns, and ratifications are the PM's primary outputs. Each must have a first-class slot in the proof. A skill without a slot for "designer rule" is structurally incomplete.

Explorer subagents are essential because the PM cannot supply codebase knowledge. Their reports flow into the proof under designer-locked vocabulary. Their job is to populate decision venues, not to survey topics. Curation is the load-bearing constraint — uncurated explorer reports cause the StoryDesigner explorer-dominance failure mode.

The agent's work is mostly research, framing, drafting, and structural placement. The PM's work is judgment. The asymmetry runs *toward* the agent in active labor and *toward* the PM in decision authority. "Cooperative" advancement obscures the asymmetry.

The proof's altitude lock is critical. If necessary conditions name implementation properties (response shapes, function signatures, data structures), the agent's solve-drive points at completing an implementation-altitude proof. The drive is captured but at the wrong altitude. The cluster A resolution-claim five-attribute lock (observable, designer-ratified, problem-statement-anchored, forward-looking, non-restrictive) is the move that holds the proof at the right altitude and must be preserved.

---

## 4. Cluster D Review Through the Refined Principle

The cluster D draft is closer to the refined principle than an earlier review (in the same session) suggested. The earlier review proposed reframing principle #1 toward vocabulary discipline and treating concerns #2 and #6 as risk areas. With both corrections folded in, those positions reverse.

### 4.1 What is correct as drafted

**Principle #1 ("design is the code") is the load-bearing structural innovation.** It addresses the implementation drive at the level the drive operates — structural, not behavioral. Cluster D should keep this principle in its original form. The vocabulary-corpus mechanism from cluster A is one expression of the principle but the principle is broader: it is about constructing a design-altitude solve target weighty enough to absorb the implementation drive.

**Principle #2 ("Shared Understanding is the purpose") is the metabolism component of the refined principle.** It names the output the design system delivers to specify. The "between whom" question (between PM intent and the captured artifact, with the agent as instrument) is worth naming inside cluster D's session for clarity but does not require reframing.

**Concern #2 (explore agents researching information relevant to the topic) is essential, not a Trojan horse.** Under the corrected principle, explorers are the agent's primary mechanism for bringing context into the conversation. The PM cannot supply codebase knowledge; explorers fill that gap. Cluster D should invest heavily in this concern. The design question is not whether explorers should run but *how explorer output is curated to strengthen venue construction without overwriting designer-locked vocabulary or substituting explorer judgment for PM judgment.*

**Concern #6 (proof system directing agent research for the next round presentation) is the solve-drive at work.** The proof is the solve target; the proof's gaps are the structural call for what to research next. Cluster D should keep this concern as drafted.

**Concern #7 (proper information provided to specify so it creates architecture that correctly addresses designer's intent) is the right end criterion.** The principle gives a concrete test: the PM reads the captured artifact and ratifies "this is my position" without further correction. A round-trip read-back is the cleanest measurable form.

### 4.2 What needs minor adjustment

**Concern #5 (agent and designer cooperatively advancing the proof).** The asymmetry should be made explicit inside the cluster D session. The agent does the active work — research, framing, drafting, structural placement; the PM does the decision work — ratify, choose, redirect, lock. "Cooperatively" is fine as the headline framing but the cluster D internal session should resolve which party drives which mechanism so the resulting system does not expect PM-supplied content where agent-supplied research is the correct input.

**Endstate Points 1, 2, 3, 4** carry pre-pivot phrasing from when the master plan still expected a 4a/4b split. Cluster D inherits the cluster C pivot (one-system architecture). Points 3 and 4 collapse into the single output question (does the captured artifact read back?). Points 1 and 2 collapse into the single capture question (does the system speak the designer's vocabulary at design altitude?). Cluster D should restate the points or note the collapse explicitly.

### 4.3 What is missing

**A concern naming the substitution failure mode.** The refined principle's hardest test in practice is whether the agent's research-and-framing work substitutes for PM judgment at decision points. The agent must produce content (otherwise sessions stall on input drought) but must not produce decisions (otherwise the PM is bypassed). Concern in this shape: *what stops the agent from making decisions that should belong to the PM, particularly when the PM cannot detect the substitution because they lack the technical context?* This is structurally distinct from concern #2 (explorers) and concern #6 (proof-driven research) because it is about decision authority, not input provenance.

**Read-back fidelity as a measurable exit criterion.** The handoff to specify needs a concrete test. The principle suggests: the PM reads the captured artifact and ratifies "this is my position" without correction. Cluster D's exit criteria should include this read-back step.

### 4.4 What should not change

The inheritance of cluster A and B shipped capabilities, the inheritance of cluster C session learnings as opening seed (with the cluster D session ratifying each output through the principle's lens before locking), and the master-plan rule reauthoring posture all stand. The cluster D direction overall is sound; the corrections refine which concerns matter most and which mechanisms carry structural weight, but they do not call for a reshape of the cluster's framing.

---

## 5. Counterfactual

The cleanest counterfactual is to build the design system without principle #1 — without the solve-drive redirection — and otherwise keep everything else: strong research, strong framing, strong PM-decision flow, but a lightweight proof.

The result would look superficially excellent. Explorer subagents produce well-curated codebase context. The agent frames decisions cleanly. The PM ratifies and redirects with appropriate judgment. The proof captures decisions. Each individual round looks clean.

By round three or four, the agent starts short-circuiting to solutions. The drive has nowhere to go. The proof, being lightweight, does not hold the agent at design altitude. The agent begins producing implementation framings inside its commentary blocks, then implementation options inside its decision venues, then full implementation proposals masquerading as architectural decisions. The PM cannot reliably distinguish design-altitude options from implementation-altitude options because the PM does not have the codebase knowledge to recognize the difference. The PM ratifies an "architectural decision" that is actually an implementation choice. The proof closes with implementation choices laundered through design vocabulary. Specify reads the proof and produces architecture that reflects implementation choices the PM did not realize they were making.

This is the failure mode the recursive-corpus revision history is direct evidence of. Many revisions of `design-figure-out` and `design-experimental` tried to gate this through prompt-level constraints, vocabulary policing, and translation gates. None of them held. The system that holds is the one with a proof weighty enough to absorb the drive — `design-large-task` with its proof MCP, closure machinery, and saturation engine. Specify and write did not need many revisions because the drive runs in its native direction in those phases; the design phase is the only one where structural work against the drive is required.

### 5.1 Variants

**Counterfactual A — proof shaped at the wrong altitude.** Build the design system with principle #1 but with necessary conditions that name implementation properties (response shapes, function signatures, data structures). The agent's solve-drive points at completing an implementation-altitude proof. The drive is captured but at the wrong altitude. The result is a system that produces implementation under the cover of proof discipline. This was a real risk during cluster A's resolution-claim work; the five-attribute lock prevented it.

**Counterfactual B — PM as input source, not decider.** Build the design system with principle #1 and a properly weighted proof, but treat the PM as the primary input source. Agent does light research, presents thin venues, expects the PM to fill in. The PM cannot, because they do not have the codebase knowledge. Sessions stall on input drought. The proof is well-shaped but never gets populated because no one is bringing input. The principle's solve-drive component holds; the system fails on the venue-construction axis.

**Counterfactual C — explorers as topic surveyors instead of venue populators.** Build the design system with principle #1, a properly weighted proof, and active explorers, but let explorers produce uncurated topic surveys rather than question-scoped retrievals. The StoryDesigner explorer-dominance failure mode generalizes: dense explorer reports displace designer-locked vocabulary, the agent treats dense-as-relevant, and decision venues form around explorer framings rather than PM-held intent. The principle's research-supplies-input component holds, but the curation gap recreates the dominance failure at altitude.

The principle as stated is the conjunction of all three commitments — proof as solve target, agent as researcher and venue-builder, PM as decider — together with the auxiliary commitments that the proof is weighted enough, locked at the right altitude, and that explorers are curated for venue construction. Each counterfactual shows what fails when one of these commitments is dropped.

---

## 6. Inputs to the Cluster D Internal Session

The cluster D internal session can use this document as opening context. Specifically:

- The refined organizing principle (§3) can serve as the cluster D candidate problem-statement anchor, replacing or supplementing the draft problem statement in the master plan §4.5.
- The two corrections (§2.1 and §2.2) should be ratified by the designer at the start of the cluster D session as locked working tenets.
- The cluster D review (§4) flags the concerns and exit criteria that need the most session attention: concern #5 asymmetry, the missing substitution-failure concern, and read-back fidelity exit criteria.
- The counterfactuals (§5) provide the failure-mode evidence for why each principle component is load-bearing. They can seed cluster D's Risk register.

Open items the cluster D session must settle that are not resolved here:

- The mechanism for explorer curation that prevents the dominance failure mode (counterfactual C).
- The mechanism for detecting and preventing agent-decision-substitution (the missing concern in §4.3).
- The concrete shape of the read-back fidelity test (§4.3).
- Whether endstate points 1–4 should be retired, restated, or collapsed under the cluster C one-system pivot (§4.2).

This document is a research input, not a design brief. Cluster D's design brief will be produced by cluster D's own design-large-task → design-specify → plan-build → execute-write cycle.
