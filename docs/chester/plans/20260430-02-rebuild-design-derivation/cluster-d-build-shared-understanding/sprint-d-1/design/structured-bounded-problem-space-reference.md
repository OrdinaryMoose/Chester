# The structured-bounded problem space: a working framework

> **Provenance.** Reference document introduced into cluster D vocabulary 2026-05-05 by designer-direct action. Source classification: industry / prior-art aligned (adjacent to Simon 1973 well-defined / ill-defined; Rittel-Webber 1973 wicked problems; Snowden Cynefin). Adoption into cluster D's design subject is **designer-ratified** — the framework now governs how the proof-layer language must reason about problem placement.

## Abstract

Most attempts to characterize problems collapse "hard" into a single dimension. This paper argues that two independent properties — *structure* (how well a problem's internal components are specified) and *bounds* (how clearly its endpoint is defined) — generate a more useful coordinate system for problem classification. The four quadrants of this space correspond to four distinct solution strategies, four distinct failure modes, and two distinct cognitive operations required to move between them. The paper defines both axes, populates the four quadrants with illustrative examples, proposes diagnostic tests for placement, and argues that most useful problem-solving consists of moving problems through this space rather than solving them at fixed coordinates.

## 1. Definitions

### 1.1 Structure

A problem is **structured** to the degree that its components, relationships, and constraints are explicitly known, agreed upon, and decomposable into operable sub-problems. At maximum structure, every relevant entity has a name, every interaction is governed by a stateable rule, and the problem can be partitioned without loss of meaning. At minimum structure, the entities are not yet identified, the relationships are contested or unknown, and any partition risks throwing away the part that mattered.

Structure is a property of the problem's *internal formulation*. It is not the same as difficulty — a chess endgame is highly structured but can be intractable. It is not the same as familiarity — a familiar mess remains a mess.

### 1.2 Bounds

A problem is **bounded** to the degree that it has a finite, definable solution space and explicit, recognizable success criteria. At maximum bounded, the set of candidate solutions is enumerable in principle, and an external check can confirm when a solution has been found. At minimum bounded, success is emergent or self-defining; the criterion for "done" is itself part of the work.

Bounds are a property of the problem's *closure*. A problem can be perfectly bounded with no idea how to begin (a hard math problem with a verifiable answer), or perfectly unbounded with all internals specified (chess, where the game tree is well-defined but inexhaustible).

### 1.3 Independence

The two axes are conceptually independent. A problem can be structured but unbounded (chess: rules complete, exhaustive play impossible), unstructured but bounded (a 3 a.m. production outage with a thirty-minute SLA), structured and bounded (Sudoku), or unstructured and unbounded (open research).

In practice the two properties correlate, because structure tends to bring its own bounds with it — a fully formulated problem usually carries an implicit success criterion. But the correlation is empirical, not definitional, and the off-diagonal quadrants are exactly where the most interesting failures occur.

## 2. The four quadrants

### 2.1 Structured and bounded — Solve it

This is the easy quadrant. Components are named, rules are stated, the endpoint is recognizable. Success means executing the right method on the right inputs.

Illustrative examples include solving a Sudoku puzzle, fixing a bug with a clear reproducer and a passing-test endpoint, computing tax owed from defined inputs, implementing a published algorithm to spec, or compiling a program. The dominant solution mode is *direct execution*. The dominant failure mode is mis-identification — believing one is in this quadrant when one is not.

The defining feature is verifiability. When an answer is produced, it can be checked without argument. If the verification step is itself contested, the problem is not in this quadrant.

### 2.2 Structured and unbounded — Optimize

Here the rules are known but the endpoint is not. The problem has well-defined moves, well-defined evaluation, and no natural stopping point.

Illustrative examples include building a chess engine ("how strong?"), tuning a database for throughput ("how fast?"), refining a compiler's code generation ("how clean is the IR?"), or designing a game mechanic within fixed mechanics ("how interesting?"). The dominant solution mode is *iterative optimization against criteria*. Success is satisficing within a budget — wall-clock time, compute, attention, or willingness to keep iterating.

The dominant failure mode is gold-plating: continuing to optimize past the point of diminishing returns because the rules of the problem do not themselves tell you when to stop. The discipline required is external — a time-box, a target, a competing concern that pulls attention elsewhere.

### 2.3 Unstructured and bounded — Frame and ship

The endpoint is hard, but the problem itself is fuzzy. Decision-under-deadline territory.

Illustrative examples include triaging a production outage with unclear root cause and a tight SLA, picking a vendor by Friday from incomplete information, writing a court-deadline brief on an evolving statute, hiring under a competing-offer deadline, or making a clinical decision in an emergency department before all labs return. The dominant solution mode is *frame, then act*: spend just enough time imposing a working model on the situation to make a defensible move, then execute.

The dominant failure mode is shipping a confidently wrong solution on time. Because the deadline is real, the cost of the deadline is paid whether or not the framing was correct, and a wrong frame produces wrong action with full apparent rigor. The discipline required is humility about the framing — building in feedback loops that can detect a wrong frame quickly.

### 2.4 Unstructured and unbounded — Explore

The wicked quadrant. Vague problem, vague scope.

Illustrative examples include open scientific research, founding a company, designing a narrative system, writing a novel, formulating a policy on a new technology, or "making the product better". The dominant solution mode is *exploratory iteration*: generate hypotheses, prototype against them, learn what the problem actually is, and gradually shape both the structure and the bounds of the problem itself.

The dominant failure mode is drift — months or years of activity that does not converge because no one took responsibility for moving unstructured-and-unbounded into something narrower. Success in this quadrant is rarely a solution; it is a better-formed question. Most of the value of work in this quadrant is its movement of the problem into adjacent quadrants where execution becomes possible.

## 3. Conceptual placement tests

Placing a problem in the space requires diagnosing both axes independently. The diagnostics below are intentionally short — long inventories produce false confidence in the answer.

### 3.1 Structure diagnostics

Four tests apply to the structure axis.

The **decomposition test** asks whether the problem can be partitioned into sub-problems that could be handed to different people working with limited coordination. If a partition cannot be drawn, or if every attempted partition discards something essential, structure is low.

The **rules test** asks whether one can state explicitly the rules governing valid moves or valid states. If the rules are mostly tacit, learnable only through immersion, structure is low.

The **naming test** asks whether the relevant components have agreed-upon names that survive a conversation between two informed parties. Contested or shifting vocabulary is a strong indicator of low structure.

The **transfer test** asks whether explaining the problem to a competent stranger would yield the same problem in their understanding. If the explanation always slides toward something different — if no two re-statements match — the problem is not yet structured enough to talk about.

A problem that fails any one of these tests has a structure deficit at that point. A problem that fails three or four is unstructured.

### 3.2 Bounds diagnostics

Four tests apply to the bounds axis.

The **recognition test** asks whether one would recognize a solution as a solution if it appeared. If "solved" itself remains negotiable after a candidate is presented, the problem is unbounded.

The **verification test** asks whether there is an external check that confirms completion. Self-verification ("I think we're done") is a sign of low bounds. A test suite, a contractual specification, a referee, or a market signal can all serve as external checks.

The **enumeration test** asks whether the space of candidate solutions is finite or finite-in-principle. Open-ended generation, where new candidate solutions can be invented indefinitely, suggests low bounds.

The **agreement test** asks whether two informed people would agree, in advance, on what "solved" means. Disagreement here is the surest sign of an unbounded problem.

As with the structure diagnostics, a single failure marks a deficit; multiple failures place the problem firmly in the unbounded half of the space.

### 3.3 Common misclassifications

Two errors are routine, both of which push problems up and to the right of where they actually are.

**False structure** is the belief that one is in a structured quadrant because the problem has been named, when in fact the names do not carve the underlying reality. Strategy decks, premature ontologies, and roadmaps written before the problem is understood are typical instances. The diagnostic is the transfer test: if explanations of the problem keep mutating across conversations, the structure is performative rather than real.

**False bounds** is the belief that one is in a bounded quadrant because a deadline has been imposed. A deadline narrows the *time* available to the problem; it does not narrow the *problem*. The diagnostic is the agreement test: if no two stakeholders agree in advance on what "done" means, the problem is unbounded regardless of when it is due.

Both errors are expensive. False-structure errors waste execution capacity on the wrong target. False-bounds errors produce confident, on-time shipping of work that does not address the real problem.

## 4. Movement through the space

The most consequential observation about this framework is that most real problem-solving consists of moving problems through the space rather than solving them at fixed coordinates.

A typical trajectory begins in the lower left — a vague concern with no agreed endpoint — and moves through two distinct cognitive operations. The first is the addition of structure: framing, decomposing, naming the components, articulating relationships. This is rightward motion, and its product is a problem one can talk about with another person without slippage. The second is the addition of bounds: scoping, deadlining, choosing a target, defining "done". This is upward motion, and its product is a problem one can declare finished.

These two operations are independent and can be performed in either order. Adding structure first is the research mode: understand the problem before scoping it. Adding bounds first is the engineering mode: scope the problem to force structure to emerge under constraint. Neither is universally correct, and both have failure modes — research drifts, engineering produces sharp answers to wrong questions. The choice of which to add first is itself a strategic decision.

By the time a problem has been moved into the upper right, the difficult intellectual work is mostly done. Skipping the movement — treating an unstructured-unbounded problem as if it were structured-bounded — produces confidently-built wrong things, often at considerable expense. This is the substantive content of the heuristic "concept before implementation".

## 5. Adjacent frameworks

Several existing frameworks address parts of this space and clarify what is and is not novel here.

Herbert Simon's distinction between **well-defined and ill-defined problems** (1973) tracks the structure axis closely, though Simon's "well-defined" implicitly bundles some bounding criteria into structure. Rittel and Webber's **wicked problems** (1973) corresponds almost exactly to the unstructured-unbounded quadrant — their canonical properties of wicked problems can be read as elaborations of low structure plus low bounds. Snowden's **Cynefin framework** is the closest contemporary analogue but is not isomorphic. Cynefin folds in causation (linear vs. nonlinear vs. emergent vs. none), which the structure-bounds framework does not address. Cynefin's clear-to-chaotic gradient runs in the same direction as the difficulty diagonal here, but the two frameworks ask different diagnostic questions.

The specific contribution of the structure-bounds framework is the explicit independence of the two axes and the operationalization of inter-quadrant movement as two distinct cognitive operations rather than one continuous "sense-making" gradient.

## 6. Implications

Three implications follow.

First, problem classification should precede method selection. Bringing structured-bounded methods — planning, decomposition, scheduling — to an unstructured-unbounded problem produces theatrical progress without convergence. Bringing exploratory methods to a structured-bounded problem wastes time on rediscovery.

Second, the cost of misclassification is asymmetric. Treating a hard problem as easy is more expensive than treating an easy problem as hard, because the false confidence of the former produces shipped wrong work, whereas the latter produces only inefficiency.

Third, the cognitive operations of adding structure and adding bounds are themselves first-class skills, distinct from the operation of solving. Most institutional practice rewards solving and underinvests in the framing and bounding work that makes solving possible. The corrective is to recognize movement through the problem space as the actual work, and execution as its consequence.

---

## Cluster D Adoption Note (2026-05-05)

Designer-introduced into cluster D vocabulary on 2026-05-05. Three derived glossary entries:

- **Structured** — see §1.1
- **Bounded** — see §1.2
- **Two-axis problem space** — see §2 (the four-quadrant coordinate system) and §4 (movement)

Adoption raises a load-bearing concern for cluster D's proof-layer language design: how is problem-space placement encoded? The framework gives cluster D coordinates and movement; the proof grammar must decide whether placement is a property of the problem statement, a property of each Concern, a property of Resolve Conditions, or a separate first-class element. See cluster D concerns working list, CN-D-15.
