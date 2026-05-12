---
status: Draft
last_reviewed: 2026-05-10
related_docs: [00-glossary, 02-conops, 03-architecture]
related_adrs: [0007, 0008, 0014]
---

# Vision

The proof system is a structured environment in which an LLM agent constructs a design rationale for a software design problem, in collaboration with a human designer, under disciplines that channel the agent's completion drive toward feasible solutions rather than cheap implementations.

This document names the system's philosophy and load-bearing principles. It is the most stable document in the cascade. Other documents inherit and refine; this one establishes.

---

## 1. What the system is

The system provides three things: a **design language** the agent speaks in, a **solve system** that gives the agent something structural to finish, and a **closure protocol** that determines when the proof is complete. Together these constitute a *geometric proof for a software design problem* — a finite, locally-checkable, hierarchically-organized argument leading from given facts to ratified conclusions.

The geometric proof analogy is precise: axioms (Evidence, Rules) are taken as given; definitions fix vocabulary; lemmas (Propositions) are proved from grounded chains; theorems (Resolutions) address Concerns; the proof closes when all conditions are satisfied and the Designer signs off.

The analogy is *form*, not *semantics*. Geometric proofs deduce in a closed formal system; design proofs do not. There is no automatic prover for "this Proposition follows from its grounding." The closure gate checks structural well-formedness, not entailment. The proof's truth-value lives at the human-judgment boundary, supplied by Designer ratification.

The form trains agent habits. The Designer supplies the semantic weight. The engine guarantees that disagreements will be found, not that agreements are right.

---

## 2. The channeling principle

LLMs come with an unusually strong drive-to-complete: next-token pressure plus reinforcement on "produce visible useful output" combine to make the model want to *finish something* on each turn. Under-specified prompts therefore reliably produce plausible-looking implementations that bake in dozens of unstated assumptions.

The standard mitigations — better prompting, more context, "plan first" — try to *suppress* the drive. They fight the model.

The channeling move is different. It accepts the drive as fixed and substitutes the target. The agent still wants to finish; the proof system gives it something else to finish on. Filling a collapse_test is a finishable task. Picking a Friction Shape from a closed set is a finishable task. Walking the ratification handshake is a finishable task. By the time the closure gate clears, the agent has spent its completion budget on design artifacts instead of on a half-baked implementation.

This is environment-shaping rather than alignment. We do not convince the agent that design discipline matters. We make design discipline the only finishable thing in the room.

### 2.1 The completion drive as fixed input
The system treats the LLM's completion drive as a load-bearing property to design around, not a flaw to suppress. Suppression fights the model; channeling redirects it.

### 2.2 Closed-set vocabularies as move sets
At every decision point, the agent selects from a finite enumeration: nine element categories, four Friction Shapes, five Withdrawal Dispositions, five Action Labels, two Consent Sources. This converts open-ended generation into bounded multiple choice. LLMs are good at bounded multiple choice; they are bad at self-direction.

### 2.3 Typed fields as generative prompts
Each typed field has a known shape: collapse_test asks for the contrapositive; reasoning_chain asks for IF/THEN; rejected_alternatives asks for considered options; relieves asks for a back-pointer. The agent cannot drift into implementation because implementation is not one of the available output shapes.

### 2.4 Cheap-path-vs-feasibility
The architecture tries to close cheap paths through the proof. Some are closed structurally: there is no code-writing primitive; the closure gate requires per-Concern coverage; grounding chain leaves must be typed. Others remain at the human-judgment boundary, where the Designer's ratification is the load-bearing check. This is correct placement — that is where the Designer's time is *intended* to be spent.

### 2.5 The closure gate as the win condition
The agent's drive resolves to "clear the closure gate." Each closure condition is a finishable subgoal. From the agent's perspective the gates are not obstacles but checkpoints toward done. Every action that clears a gate is an action the design needed anyway.

### 2.6 Two-player game with asymmetric authority
The Agent and Designer have structurally different powers. The Agent proposes, revises, withdraws. The Designer asserts axioms (Rules, Permissions) and ratifies. This asymmetry is load-bearing; collapsing it dissolves the architecture's authority structure. The proof game cannot be won by one player alone.

### 2.7 Graduated completion gates
The proof advances through named phases — concerns enumerated, conditions grounded, conditions ratified, Resolutions covering Concerns, trigger gate cleared, closing argument presented, designer go confirmed. Each phase is a finishable subgame. The closure gate is the meta-game tying them together. Visible graduation gives the agent's completion drive shorter pulls between satisfactions, reducing the temptation to race past underspecified earlier phases.

---

## 3. What the system is not

### 3.1 Not a theorem prover
The closure gate checks structural well-formedness, not logical entailment. A "closed proof" means the structure is consistent and the Designer endorsed it — not that the design is provably sound in any formal-methods sense. Readers familiar with Coq, Lean, or Isabelle should not expect those guarantees.

### 3.2 Not a code generator
The system has no implementation primitives. It does not produce code. Its output is rationale: typed elements, grounding chains, ratified resolutions, a closing argument. The implementation is downstream work, performed by whatever system consumes the design proof.

### 3.3 Not a deliberation tool for humans
gIBIS, Compendium, and similar argumentation tools are designed for collaborative human deliberation. The proof system is designed for an LLM agent's interaction with a human designer. The agent's completion drive does the work that human deliberators were never reliably motivated to do (filling slots, walking grounding chains, considering alternatives). Humans alone find the same workflow tedious.

### 3.4 Not a closed system
The design language is sparse by design. Some legitimate design moves do not fit the typed vocabulary; those move into metadata or are dropped. This is a deliberate trade: tight channeling at the cost of expressiveness. Expansion of the vocabulary should be earned by demonstrated need, not assumed necessary.

### 3.5 Not a single-pass build
The proof is multi-round. Each round can add, revise, or withdraw. Revisions clear ratification, forcing re-endorsement. The closing argument can be presented and re-presented. Closure is reached when the structural and authority conditions co-occur in the same round.

---

## 4. The structural-vs-semantic gap

The architecture distinguishes between what the system can mechanically check and what it cannot. Structurally: well-typed elements, terminating grounding chains, satisfied closure predicates, integrity-zero, body-advancement signals. Semantically: whether a collapse_test is *true*; whether rejected_alternatives are *genuine*; whether a Resolution's prose actually addresses its anchor Concern.

The system is honest about this gap. Structural checks are mechanical and fast. Semantic checks are the Designer's job. The Designer's authority — ratification, rule-assertion, withdrawal of agent claims — is the architecture's primary semantic mechanism.

The forward-solve paradigm narrows the gap in one specific place: counterfactual queries make collapse_test mechanically verifiable. Asking "would closure still hold without this Proposition?" is a query the engine can answer. This converts collapse_test from a self-report into a checkable property — the largest single move available toward closing the gap without expanding what the system claims to verify.

---

## 5. The channeling bargain

The architecture trades agent autonomy for structural discipline. The agent's completion drive cannot be allowed to roam freely; the system substitutes a finite game with a clear win condition. This works because:

- Completion drive resolves to closure gate clearance, which means filling typed fields and walking grounding chains
- Cheap paths through the gates are closed where structurally possible
- Remaining cheap paths are concentrated at the Designer's ratification surface, where designer time is intended to be spent
- The Adversary role (future) attacks the proof from outside, catching cheap paths the structural gates miss

The bargain has costs: the agent has fewer expressive moves; some legitimate design considerations don't fit the typed vocabulary; over-tight gates squeeze useful exploration out of the agent. The architecture preserves exploratory slack via FRICTION (registering tension without resolving), the `lived-with` and `relieved-by-exception` dispositions (avoiding forced dissolution), and the rejected_alternatives field (encoding considered options).

The bargain is paid once at the cost of LLM autonomy. The return is a proof system in which the agent cannot easily produce a structurally-valid argument for the wrong design.

---

## 6. The forward-solve paradigm

The system is built on forward-chaining Datalog as the core inference engine. The agent asserts base facts (Evidence, Rules, Permissions, Concerns) and proposes Horn-clause rules (Propositions, Resolutions, Frictions, integrity rules). The engine forward-chains: starts from facts, applies rules to derive new facts, continues until fixed point. Closure is a query against the fixed point.

This is not merely an implementation choice. It commits to a specific theory of what a design proof is: a derivation, not a checked database. Propositions become *derivable* rather than *asserted*. The grounding chain is the rule body. Approval is a body literal. Cascading on revision is automatic. Counterfactual queries are first-class. AND/OR composition of grounding paths is native.

The paradigm preserves the channeling architecture, the closed-set vocabularies, the consent system, and the Designer's authority. It changes how the engine reasons internally, not how the agent or designer interact with the system.

(See ADR-0007 for the decision record, ADR-0003 for approval-as-body-literal, and the Engine Spec for evaluation details.)

---

## 7. Principles in summary

- **Geometric proof for software design problems.** The proof's form trains agent habits; the Designer supplies semantic weight.
- **Formal design language the agent speaks in.** Vocabulary, Grammar, Semantics, Pragmatics — each layer constrains the agent toward design discourse.
- **Channel the agent to feasibility, not to cheap solutions.** Close cheap paths structurally where possible; concentrate the remainder at the Designer's surface.
- **Provide graduated completion gates.** Each phase is a finishable subgame; closure is the meta-game.
- **Argue the logic trail transparently.** Every claim has typed grounding, action-label provenance, and ratification metadata. The closing argument is auditable.
- **Show your work in design language at any phase.** The proof is queryable at any time; rendering speaks in typed terms, not data dumps.
- **The two-player game requires two players.** The Designer's authority is structurally distinct and load-bearing.

---

## 8. What changes (and doesn't change) over time

The Vision is the most stable document. If it changes, almost everything below is re-examined.

What does not change easily:
- The geometric-proof framing
- The channeling principle
- The structural/semantic split between mechanical checks and Designer judgment
- The two-player asymmetric-authority game
- The closed-set vocabulary discipline

What is expected to evolve:
- The size of the design language vocabulary (additions earned by demonstrated need)
- The strength of structural gates (tightening as cheap paths are observed)
- The forward-solve engine's expressiveness (extension predicates, indices, optimizations)
- The Designer-facing rendering (more narrative, more queryable, more graduated)
- The Adversary role and its integration into the proof system

Vision changes are deliberate. Adding a principle is rare; refining a principle's wording is common. The Vision document is the system's slowest-changing layer; ADRs capture the velocity.

---

## 9. Why this exists

The motivating problem: an LLM agent given a software design problem will, by default, produce code or code-flavored prose that bakes in unstated assumptions. The result looks plausible, takes effort to debunk, and resists later re-examination because the assumptions are buried in implementation rather than expressed as claims.

The proof system inverts this. The agent's output becomes typed claims with grounding chains, considered alternatives, identified frictions, and ratified resolutions — all *before* implementation. When the implementation phase begins downstream, it begins from a closed proof rather than from prompt-shaped intentions.

The proof is not the design. The proof is the *argument that the design is sound* — the rationale a careful engineer would have produced anyway, but produced systematically, channelled out of an LLM that left to itself would have produced code.

The proof is what a software design problem deserves before it becomes software.
