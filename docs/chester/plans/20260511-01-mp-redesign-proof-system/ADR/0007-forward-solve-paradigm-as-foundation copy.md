---
status: Accepted
date: 2026-05-10
deciders: [M]
related_docs: [01-vision, 04-engine-spec, 05-domain-spec]
---

# ADR-0007: Forward-solve paradigm as foundation

## Status

Accepted.

## Context

The existing proof MCP implements proof construction as a procedural pattern: typed-object records validated by hand-written checkers. The agent submits a Proposition; code checks that grounding refs exist, the collapse_test field is non-empty, the reasoning_chain is present, and so on. Closure is computed by aggregating ratification flags and counting per-Concern coverage. Cascade on revision is procedural: code looks up dependents and clears their ratifications.

The procedural pattern works at scale, but it has a structural cost: the *shape* of an inference (this Proposition follows from that grounding) is invisible to the system. The grounding chain is a list of references, not a logical relation. Counterfactual reasoning ("would closure still hold without this Proposition?") requires bespoke code. Cascade requires bespoke code. Each integrity check is its own procedural method.

Three architectural options were genuinely considered:

**Option A: Stay procedural.** Keep the typed-record + hand-written-checker pattern. Refactor for clarity but don't change the inference paradigm.

**Option B: Backward-chain (Prolog-style).** The agent asks the system "is this Proposition supported?", and the system attempts to derive it from facts via backward chaining. SLD resolution; goals decomposed into subgoals.

**Option C: Forward-chain (Datalog-style).** Facts are asserted into a knowledge base; rules forward-chain to fixed point; the proof is the derived knowledge base.

Option A's cost: every additional capability (counterfactual collapse_test, cascade on revision, alternate inference paths via OR composition, ad-hoc Designer queries) requires bespoke implementation. The architecture grows by accretion of single-purpose modules.

Option B's cost: backward-chaining requires Turing-complete logic programming. Termination is not guaranteed; the agent's queries might not return. This is a poor fit for a system that must always answer "is closure permitted?" in bounded time.

Option C's cost: building the engine, translating proof concepts to Datalog rules and facts, retraining the agent's interaction patterns. But: termination guaranteed (stratified Datalog is decidable), cascade-on-revision is free, counterfactuals are first-class, ad-hoc queries are native.

The deeper observation: a design proof *is* a derivation. The grounding chain is the rule body. Approval is a body literal. The closure check is a query. The procedural pattern is implementing this derivation by hand; Datalog implements it directly.

This is more than an implementation choice. It is a commitment to a specific theory of what a design proof is. In the procedural model, a design proof is a database of typed records validated by code. In the forward-solve model, a design proof is a derived knowledge base — the fixed point of a Datalog program whose base facts are evidence and whose rules are inferences. The proof's "what is it?" answer changes.

## Decision

**Adopt forward-chaining stratified Datalog as the inference foundation.** All proof concepts that admit derivation (Propositions, Resolutions, friction shapes, integrity rules, closure conditions) become Engine rules. Facts are the proof's base content (Evidence, Rules, Permissions, Concerns, approval, status). Closure is a query against the fixed point.

The Engine layer (ADR-0001, ADR-0002) provides the Datalog evaluator. The Domain layer translates schema-level concepts into Engine facts and rules.

Approval becomes a body literal (ADR-0003). Cascade follows from ordinary fixed-point semantics. Counterfactual queries use snapshot/restore (Engine Spec §4.6).

Restructuring stays pre-engine (ADR-0005). Render stays in the Domain (ADR-0006). The Engine is the inference core; everything else surrounds.

## Consequences

**Positive:**
- **Cascade is free.** Revising an element retracts dependent approvals via fixed-point re-evaluation. No bespoke cascade code.
- **Counterfactuals are first-class.** Snapshot + retract + derive + query + restore is the universal pattern. Mechanical collapse_test verification (Domain Spec §11) drops out.
- **Ad-hoc queries.** The Designer or Adversary can issue arbitrary queries against the proof's knowledge base.
- **OR composition native.** A claim supported by alternative grounding paths is naturally expressed as multiple clauses of one rule.
- **Engine reusable.** A clean Datalog evaluator can ship as a library; this is a transferable component.
- **Theory of proof becomes load-bearing.** The system's commitment to "a design proof is a derivation" is concrete in the architecture, not aspirational.

**Negative:**
- **Implementation cost.** The Engine must be built (ADR-0002 chooses custom over third-party). The Domain must learn Datalog translation. Procedural code must be retired or rewritten. Migration spans Phases 0–5.
- **Paradigm learning curve.** Contributors familiar with procedural code must absorb Datalog semantics; this is real cognitive cost.
- **Some edge cases require care.** Stratified negation, well-formed rule bodies, snapshot fidelity — these are non-trivial implementation concerns.
- **Debugging shifts.** Failures in derivation are not always step-throughable in the way procedural code is. The `explain()` operation (Engine Spec §4.5) mitigates by producing derivation trees, but learning to read these is a skill.
- **Performance characteristics differ.** Fixed-point evaluation has different cost shape than direct procedural validation. At expected scale (low thousands of facts), forward-chaining is comparable or faster; at much larger scale, optimizations are required.

**Neutral:**
- The user-visible behavior of the system is largely unchanged. Agents and Designers interact with the same MCP tools (with minor unifications). The paradigm shift is internal.
- The decision is reversible only at high cost. Backing out forward-solve after migration would require rewriting the Engine-resident logic procedurally — effectively the inverse migration. This is a long-term commitment.

## Alternatives considered

- **Option A (stay procedural)**: rejected. The capabilities the forward-solve paradigm makes free (cascade, counterfactual, ad-hoc query) would otherwise require bespoke implementation, and each additional capability would compound the maintenance burden.
- **Option B (backward-chaining)**: rejected because termination is not guaranteed; closure answers might not return. Backward-chaining is the right paradigm for goal-directed search; forward-chaining is the right paradigm for "compute the consequences of these facts and rules," which is what a closed proof is.
- **Hybrid (some operations procedural, others Datalog)**: rejected. The architectural cohesion comes from one paradigm; mixing them creates two mental models contributors must hold simultaneously.

## References

- Vision §6 (Forward-solve paradigm)
- Engine Spec §1, §3
- Domain Spec §2 (Domain-Engine translation principle)
- ADR-0001, ADR-0002, ADR-0003, ADR-0005, ADR-0006
