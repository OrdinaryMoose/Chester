---
status: Accepted
date: 2026-05-12
deciders: [M]
related_docs: [04-engine-spec]
related_adrs: [0016]
---

# ADR-0017: Existential-Quantification Semantics for Unbound Variables in Negated Body Atoms

## Status

Accepted.

## Context

Sprint-01's plan-prescribed `Evaluator.matchBodyAtom` negation branch used `substituteArgs(atom.args, currentBindings)` to materialize the negated atom, then unified the result against each candidate fact. For a negated body atom with unbound variables (e.g., `¬p(X, Y)` with `X` bound but `Y` unbound), the substitution produced `[boundX, undefined]`; the unifier treated `undefined` as a literal constant and failed to match any fact with a non-undefined second position. The negation incorrectly reported "no matching fact" and succeeded — even when an existentially-bound match clearly existed (e.g., `p(boundX, anyValue)`).

Standard Datalog semantics require unbound variables in negated body atoms to be existentially quantified: `¬p(X, Y)` with `X` bound means "there exists no `Y` such that `p(X, Y)` holds." This is a textbook safety property. The substitute-then-unify pattern silently produced unsound derivations whenever a negated body atom carried an unbound variable position.

The defect surfaced during sprint-01 Task 9 (negation tests) when the same-generation cousins program and the negation-with-retraction program both produced wrong fixed points. The corrected unify-then-consistency-check shape was added as a surgical fix during sprint-01; pass-2 canonicalizes the contract.

## Decision

The negation branch in `Evaluator.matchBodyAtom` uses **unify-then-consistency-check** instead of substitute-then-unify. For each candidate fact (drawn from both EDB and IDB), `unify(atom.args, factArgs)` produces fresh bindings that treat the atom's unbound variables as free (matching any value). Those fresh bindings are then checked for consistency with `currentBindings`: any variable bound in both must agree. A consistent match means the inner atom holds for some binding, so the negation fails. If no candidate fact produces a consistent match, the negation succeeds and the current bindings are forwarded.

Unbound variables in a negated body atom are therefore existentially quantified at evaluation time — they do not contribute new bindings to the rule's head (per the safety check in ADR-0016) but they do allow the negation to interpret the inner atom against any candidate match.

## Rationale

Unify-then-consistency-check is the minimal shape that honors the textbook Datalog NAF semantics under stratified negation. Each side of the implementation has a clear meaning: the unifier handles structural matching (constant-vs-constant equality and variable binding generation), and the consistency check handles the semantic invariant that variables shared with the outer rule must agree.

The alternative — substitute-then-unify — collapses two distinct concepts (currently-bound variables and free variables in the atom pattern) into a single substituted argument list, where the only signal distinguishing them is the sentinel `undefined`. That signal interacts badly with the unifier's argument-equality check, producing the silent-collision behavior described in the Context.

## Consequences

**Positive:**
- Negation now matches standard Datalog semantics.
- Programs using negated body atoms with unbound variables (e.g., `leaf(X) :- node(X), ¬ancestor(X, Y)` to compute leaves) compute correct fixed points.
- Tests AC-9.1 (same-generation cousins) and AC-9.4 (negation with retraction) reflect this corrected behavior.

**Negative:**
- The implementation reads slightly more involved than the original substitute-then-unify pattern; a reader unfamiliar with Datalog NAF semantics may need to consult this ADR to understand why the negation branch differs in shape from the positive branch.

**Neutral:**
- Programs whose negated body atoms have no unbound variables (every variable bound by an earlier positive body atom) produce the same result under both implementations. The corrected branch is strictly more general; the substituted form is a degenerate case of the unified form.

## Alternatives considered

- **Forbid unbound variables in negated body atoms.** Rejected — it would constrain Domain-layer rule patterns unnecessarily; existential-quantification is the textbook contract and the safety check (ADR-0016) already ensures unbound variables in negated atoms do not propagate into the head.
- **Implement via skolemization.** Rejected as overkill for the in-scope rule shapes; skolemization introduces fresh constants and metadata that the rest of the engine does not need.

## What would change the decision

Introduction of universal quantification or complex negation patterns (e.g., negation as failure under closed-world assumption with explicit witness binding) would require revisiting the semantics and likely the implementation shape.

## References

- `04-engine-spec.md §2.1 Inclusions` — stratified negation entry (post-pass-2 amended text)
- `04-engine-spec.md §9.1` — negation-with-retraction test obligation (post-pass-2 amended text)
- Sprint-01 deferment doc: D3 entry at `docs/chester/plans/20260511-01-mp-redesign-proof-system/sprint-01-proof-backend/plan/sprint-01-proof-backend-deferred-00.md`
- Code: `Evaluator.js:23-43` (the negation branch in `matchBodyAtom`)
- Related: ADR-0016 (canonical rule-safety check; the safety property that complements this semantic choice)
