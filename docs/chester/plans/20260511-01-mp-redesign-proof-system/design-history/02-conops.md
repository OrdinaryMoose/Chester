---
status: Draft
last_reviewed: 2026-05-10
related_docs: [00-glossary, 01-vision, 03-architecture]
---

# Concept of Operations

This document describes how the proof system operates from the outside. It names actors, lifecycle phases, typical workflows, and failure modes. It does not describe how the system is built; that lives in Architecture and the Specs. A non-technical reader should be able to follow this end-to-end.

---

## 1. Purpose in operation

The system is used to construct a design proof for a software design problem. A design proof is not the design itself; it is the rationale that justifies the design. The proof is built collaboratively between an LLM Agent and a human Designer, channeled by the system's structural disciplines, terminating when the Designer ratifies the closing argument.

Use the proof system when a software design problem benefits from rationale-before-implementation. Skip it for problems that are too small to merit rationale, too well-understood to need argument, or too speculative to admit grounding.

---

## 2. Actors

### 2.1 Designer
The human who:
- Authors the problem statement
- Asserts the inferential framework (Rules, Permissions)
- Ratifies elements proposed by the agent
- Confirms closure

The Designer's authority is structurally distinct and load-bearing. The Designer does not hand-author every Proposition; the Agent does that. The Designer's role is to assert the framework within which the Agent works, and to ratify the work as it accumulates.

### 2.2 Agent
The LLM that:
- Proposes Propositions, Resolutions, Definitions
- Walks grounding chains, fills collapse_tests, considers alternatives
- Identifies Frictions and proposes dispositions
- Presents the closing argument

The Agent's behavior is shaped by the channeling architecture. Its completion drive is redirected toward proof construction rather than implementation.

### 2.3 Adversary (future role)
A separate process — a second LLM, an external solver, or a different agent context — whose job is to attack a presented proof. The Adversary looks for cheap-path failures: thin rejected_alternatives, formulaic collapse_tests, content-empty grounding leaves. The Adversary is not yet implemented in the engine but is anticipated by the architecture (see Architecture §6).

The Adversary exists to address the Goodhart-on-the-gate risk: once "close the proof" is the Agent's goal, the gates become precisely what gets optimized. The Adversary's structural independence catches what the gates miss.

---

## 3. Lifecycle phases

The proof advances through named phases. Each phase has entry conditions and an associated set of legitimate moves. The Agent and Designer can read the phase at any time; this is the system's primary signal of "where are we?"

### 3.1 Empty
The state before `open_proof` has been called. No state file exists, or the state file exists but is structurally invalid.

**Entry from:** initial creation, or post-finish re-open
**Legitimate moves:** open_proof
**Exit:** Successful open_proof

### 3.2 Concerns Enumeration
The proof has been opened with a problem statement and a seed of restructured elements. Concerns may exist as drafts; Propositions do not yet meaningfully exist.

**Entry from:** open_proof success
**Legitimate moves:** add Concerns, ratify Concerns, add Definitions, ratify Definitions, add early Evidence/Rule/Permission elements, withdraw any of the above
**Exit:** All Concerns ratified, at least one Concern present

### 3.3 Conditions Building
Concerns are ratified. The Agent constructs Propositions with their grounding chains. Resolutions may be drafted but are typically ratified later.

**Entry from:** Concerns Enumeration, after at least one Concern is ratified
**Legitimate moves:** add Propositions, revise Propositions, withdraw Propositions; add/revise/withdraw Resolutions; add/revise/withdraw Evidence, Rules, Permissions; manage Friction
**Exit:** All Propositions grounded, all Propositions ratified

### 3.4 Conditions Ratified
Propositions are grounded and ratified. The proof's proposition layer is complete. Resolutions may still be in flight.

**Entry from:** Conditions Building, when all active Propositions are ratified
**Legitimate moves:** add/revise/ratify Resolutions; manage Friction; withdraw any element (which may revert phase)
**Exit:** Per-Concern coverage achieved with ratified Resolutions

### 3.5 Closing-Ready
The proof's structural conditions are met. The trigger gate clears. The first-yes precondition holds. A closing argument can be presented.

**Entry from:** Conditions Ratified, when per-Concern coverage and integrity-zero hold
**Legitimate moves:** present_closing_argument; any mutation (which clears closing flags and may revert phase)
**Exit:** Designer go-choice confirmed in the same round as presentation

### 3.6 Finished
The proof has closed. The Designer has confirmed go-choice. The closing argument is final.

**Entry from:** Closing-Ready, on confirm_closure_go in the same round as presentation
**Legitimate moves:** read-only operations (rendering, querying)
**Exit:** Explicit re-open (creates a new proof from this one as seed)

The phase is observable to both Agent and Designer. The Agent uses it to know what moves are legitimate next; the Designer uses it to track progress.

---

## 4. Canonical workflows

### 4.1 Opening a proof

The Designer authors a submission packet: a problem statement, a seed of Concerns, possibly seed Rules and Permissions, possibly a few Evidence elements. The seed represents the Designer's framing of the problem.

The system restructures the submission: validates each candidate element, assigns action labels per field, builds provenance, runs the open gate. If the gate passes, the proof opens; the seed becomes the initial typed elements.

The Designer is now in **Concerns Enumeration** phase. The Agent reads the proof state and begins work.

### 4.2 Building Propositions

The Agent identifies a Proposition the design must satisfy. It writes the statement in design-language form. It identifies grounding: which Evidence elements support it factually, which Rules constrain it normatively, which Permissions might license relaxation. It writes a collapse_test: what fails if this Proposition is removed. It writes a reasoning_chain: the IF/THEN inference. It enumerates rejected_alternatives: options considered and their reasons for rejection.

The agent submits the Proposition via the appropriate operation. The system validates structural completeness (required fields present, grounding refs exist, action labels valid) and writes the Proposition to state.

The Proposition is now `draft`. It does not yet enter the proof's derived set; in the forward-solve paradigm, its rule's body includes an `approved` literal that has not yet been satisfied.

### 4.3 Designer ratification

The Designer reads the proof state — typically through the structured-proof render, which presents elements in geometric-proof form. The Designer audits the Proposition's grounding, its collapse_test, its rejected_alternatives. Either:

- Ratifies: the Designer issues `ratify` with text. The `approved` fact is asserted. The Proposition enters the derived set. Anything depending on it (Resolutions, downstream Propositions) becomes derivable.
- Refuses (implicitly, by withdrawing): the Designer issues `withdraw` with a disposition. The Proposition is moved to phantom partition. Cascade: anything that depended on it retracts.
- Asks for revision: in conversation, the Designer signals what is missing. The Agent revises. Revision retracts the prior `approved` fact (if any); the Proposition returns to draft.

### 4.4 Friction emergence and disposition

As the proof grows, the Agent notices tensions: a Proposition that pulls one way against another that pulls the other; a Permission that relieves a Rule a Risk grounds in; a Resolution that conflicts with a Rule. The Agent declares a Friction: anchor pair, friction shape, initial disposition.

Dispositions are closed-set: `lived-with` (the tension is acknowledged and accepted), `relieved-by-exception` (a new Permission addresses it), `dissolved-by-revision` (a revision to one anchor removes the tension), `dissolved-by-scope-cut` (a Concern is withdrawn or a Proposition is removed), `not-really-friction` (the Agent retracts the friction claim).

The Designer ratifies dispositions for `lived-with` and `relieved-by-exception`. The terminal dispositions move the friction to phantom partition automatically.

### 4.5 Resolutions and Concern coverage

The Agent constructs Resolutions that address Concerns. Each Resolution declares a `problem_anchor` Concern and a grounding chain through ratified Propositions. The Designer ratifies Resolutions with text describing the rationale for closure ("Approved 2026-04-29; matches PRR review §3").

When every Concern has at least one ratified Resolution anchored to it, per-Concern coverage holds.

### 4.6 Presenting the closing argument

When the trigger gate clears (all Propositions grounded with collapse_test, all Propositions ratified, all Resolutions ratified, per-Concern coverage, integrity-zero, body advancement post-transition, round ≥ minimum), the Agent presents the closing argument.

The closing argument is a structured artifact: problem statement, givens (Evidence), vocabulary (ratified Definitions), inferential framework (Rules and Permissions), ratified Propositions with their grounding and reasoning, ratified Resolutions with their problem_anchors, frictions with dispositions, rejected register (phantom partition), closure status.

Presentation sets the `closingArgPresentedRound` flag to the current round.

### 4.7 Designer go-choice

The Designer reads the closing argument. If the proof is satisfactory, the Designer issues `confirm_closure_go`. The `closingArgGoRound` flag is set to the current round. Closure permits.

Crucially: any mutation (add, revise, withdraw, ratify) clears both flags. A Designer who reads the closing argument, asks for a revision, and accepts the revision must re-present the closing argument and re-confirm. This prevents a stale closing argument from being signed off.

### 4.8 Reading the proof at any phase

The Designer can read the proof at any time. The render shows current state in geometric-proof form: what's settled, what's open, what's pending ratification. The closing argument can be derived at any phase (it's a pure function of state); it just doesn't *permit closure* until the gate clears.

The Agent can also read the proof. Its rendering surfaces "what's the next move?" — which gate is closest to clearing, which obligation is unmet, which Friction is undispositioned.

---

## 5. Failure modes

The architecture's failure modes are part of the operational concept; reading the proof at the right time means catching them.

### 5.1 Cheap-path closure
The proof clears the structural gates with content-empty fields: trivial rejected_alternatives, formulaic collapse_tests, grounding leaves whose statements say nothing. The structural gates pass; the proof closes; the underlying design is not actually rationalized.

**Mitigation:** Designer review of content during ratification; Adversary role (future) probing for thin content; the structured-proof render surfacing field length and shape so the Designer can spot anemic claims.

### 5.2 Closed proof of the wrong design
The proof closes with internally consistent reasoning that does not actually solve the problem. This is the most dangerous failure: a perfectly closed proof of the wrong thing.

**Mitigation:** Designer authority over Concerns (the proof's link to the problem); Mode-2 reasoning support (the constraint-itself-is-the-problem path); explicit re-open semantics that don't feel like failure.

### 5.3 Stalled proof
The proof opens, the Agent constructs some Propositions, the Designer doesn't ratify, work pauses. Body-advancement is zero round-over-round. The proof never closes but never explicitly fails.

**Mitigation:** Body-advancement metric is observable; the Designer can see "no progress in N rounds" and decide whether to engage, re-frame, or close-without-finish.

### 5.4 Race-to-presentation
The Agent rushes the closing argument, presenting before all gates are genuinely cleared. The trigger gate refuses; the Agent proposes thin elements to clear it; the proof's content quality drops in service of gate-clearance.

**Mitigation:** Graduated phase signaling (the Agent sees which phase it's in and what's needed next); the first-yes precondition (no draft elements when presenting); the two-yes flag pattern (closing argument is invalidated by any mutation).

### 5.5 Authority drift
The Designer ratifies without reading. The structural gates do their job, but ratification becomes mechanical. Cheap-path failures slip through.

**Mitigation:** This is fundamentally a Designer-discipline failure, not an architectural failure. The system can render thin elements legibly so the Designer notices, but cannot force attention. The Adversary role is the architectural answer.

---

## 6. Reading the proof

The proof state is queryable at any phase. Several distinct views:

### 6.1 Structured-proof render
A geometric-proof-form rendering showing problem, givens, vocabulary, framework, Propositions, Resolutions, frictions, rejected register, closure status. Suitable for human reading; produces something a careful engineer would read top-to-bottom.

### 6.2 Element deep render
A single element with all its fields: statement, grounding, collapse_test, reasoning_chain, rejected_alternatives, ratification status, history. Used when the Designer wants to dive into one claim.

### 6.3 Datalog projection
The proof state expressed as a Datalog knowledge base. Suitable for ad-hoc queries, independent verification by external engines, and adversarial scrutiny.

### 6.4 Closing argument
The full structured artifact of a presented or pending closing argument. Includes phantom partition, closure provenance, body advancement signal, integrity status.

### 6.5 Operation log
The audit trail of every mutation: round, op, entity, consent, action labels, provenance. Used post-hoc to understand how the proof reached its current state.

---

## 7. What an operator should expect

When the system is running well:
- The Agent fills typed fields without drifting into implementation prose
- Frictions surface and get dispositioned without lingering
- Each round shows body advancement
- The Designer's ratifications follow legible review of ratifiable artifacts
- Closing arguments are presented when the gates genuinely clear
- The structured-proof render reads like an engineering proof, not a database dump

When something is wrong:
- Long stretches without body advancement (stalled or stuck)
- Repeated trigger-gate failures with shallow attempts to clear them (race-to-presentation)
- Ratifications without legible review (authority drift)
- Closure achieved but the Designer is uncertain whether the design solves the problem (closed proof of the wrong design)
- Many friction shapes rendered as `lived-with` without disposition discussion (friction accumulation)

The operational concept is that the operator (typically the Designer) is responsible for noticing these signals. The system surfaces them; the operator interprets.

---

## 8. Out-of-scope operational concerns

This document does not address:
- Multi-Designer proofs (one Designer per proof for now)
- Multi-Agent proofs (one Agent per proof for now)
- Proof-to-implementation handoff (the proof's downstream consumers are out of scope; the proof closes and that ends this system's involvement)
- Long-running organizational use (the proof is a session artifact, not an organizational deliverable)
- Performance at scale (proofs are bounded; performance optimizations are deferred until proofs grow large enough to need them)

These are addressable; they are deferred until the system's core operation is stable.
