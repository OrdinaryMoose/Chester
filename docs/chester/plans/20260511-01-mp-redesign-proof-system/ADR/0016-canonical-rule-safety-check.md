---
status: Accepted
date: 2026-05-12
deciders: [M]
related_docs: [04-engine-spec]
related_adrs: [0017]
---

# ADR-0016: Canonical Rule-Safety Check at RuleStore.defineRule

## Status

Accepted.

## Context

Sprint-01's plan-prescribed `Evaluator.fireRule` substituted head-atom arguments using bindings produced by `matchBodyAtom` against the rule body. For a rule whose head contains a variable not bound by any non-negated body atom (e.g., `q(X, Y) :- p(X)` — the head variable `Y` appears nowhere in the body), `substituteArgs` returned `undefined` for that head-variable position. The downstream fact-key encoding then ran `JSON.stringify(['a', undefined])`, which produces `'["a",null]'` — colliding with the legitimate fact `q('a', null)`. The IDB became silently poisoned: two structurally distinct derivations collapsed to the same key.

A closely-related case: a head variable that appears in the body only inside a negated atom (e.g., `q(X) :- ¬p(X)`). Standard Datalog semantics treat unbound variables in negated atoms as existentially quantified (see ADR-0017), so a variable appearing only there is not "bound" at fire time — the same `undefined` collision applies.

Sprint-01 added a defense-in-depth guard at `Evaluator.fireRule` that detected `undefined` head args and threw `UNBOUND_HEAD_VARIABLE` at derive time. That backstop closed the corruption class but pushed the error to the wrong layer: the rule registry — not the evaluator — is the canonical entry point for rule definitions. Catching the violation at definition time (rather than at the first derivation that happens to fire it) gives a clearer error site, surfaces the problem earlier, and removes the need for the evaluator to carry the check at all.

## Decision

Add a `checkSafety(rule)` helper to `RuleStore.js`, called from `defineRule()` immediately after `validateRule(rule)` and before the duplicate-id check. The check computes the set of variable names bound by non-negated body atoms; if any head variable is not in that set, it throws `{ code: 'UNSAFE_RULE', ruleId, unboundVars }`. Variables appearing only in negated atoms do not count as bound (existential-quantification semantics — see ADR-0017).

Ordering rationale: `validateRule` runs first so a structurally malformed rule still produces `MALFORMED_RULE`; `checkSafety` runs next so a well-shaped but semantically unsafe rule produces `UNSAFE_RULE` before the bookkeeping-level `DUPLICATE_RULE_ID` check. Structural errors dominate over bookkeeping errors.

The defense-in-depth guard at `Evaluator.fireRule` is removed as redundant. The `UNBOUND_HEAD_VARIABLE` error code is retired from the engine surface.

## Rationale

The rule registry is the only entry point into the evaluator's rule set; defense-in-depth at the evaluator adds reader confusion without operational benefit. A canonical-layer check is also strictly more informative: it can report the specific unbound variable names (`unboundVars` array) at definition time, which the evaluator-side guard cannot do as cleanly (the evaluator only sees `undefined` in a substituted args array).

The structured error code `UNSAFE_RULE` (rather than overloading `MALFORMED_RULE`) lets downstream tooling — and Domain-layer callers — distinguish structural malformedness (wrong shape) from semantic unsafety (well-shaped but unbound). They are different concerns and deserve different signals.

## Consequences

**Positive:**
- Silent IDB corruption via the undefined-as-null collision is closed at the canonical boundary.
- The error is structured and carries `unboundVars`, letting downstream tooling distinguish unsafe-rule rejection from other definition errors.
- The defense-in-depth `UNBOUND_HEAD_VARIABLE` guard at `Evaluator.fireRule` is removed as part of this decision; the error code is retired from the engine surface. The `fireRule` path is simpler with no defense-in-depth guard to maintain.
- Failures surface at definition time rather than at the first derivation that happens to fire them.

**Negative:**
- A Domain caller programmatically generating rules must ensure safety up front. The previous defense-in-depth behavior caught some violations late, after the rule was already in the store.
- Sprint-01 test cases that defined cyclic-negation rules with negation-only body atoms (legal under the old check, illegal under the new) had to be updated to include a positive binding atom for the head variable.

**Neutral:**
- Sprint-01's existing tests for malformed rules and cyclic negation continue to pass unchanged in shape (only their rule bodies were widened to bind the head variable positively).
- `UNSAFE_RULE` is a new error code, not a renamed existing one — the engine error catalog grows from nine to ten codes (per spec AC-12.1's amended catalog).

## Alternatives considered

- **Keep both layers as defense-in-depth.** Rejected because the rule-registry is the only entry point into the evaluator's rule set; defense-in-depth here adds reader confusion without operational benefit.
- **Extend `MALFORMED_RULE` to cover safety.** Rejected because structural malformedness (wrong shape) and semantic unsafety (well-shaped but unbound) are different concerns and deserve different error codes for downstream tooling.
- **Defer the check to `derive()`.** Rejected because the failure should surface at definition time, when the offending rule is in the developer's hand, not at the first derive that happens to fire it.

## What would change the decision

A future evaluator-bypass path (e.g., a faster direct-IDB-write API that constructs derivations without going through `fireRule`) would re-introduce the need for an evaluator-side guard. Not in scope.

## References

- `04-engine-spec.md §4.2 defineRule` (post-pass-2 amendment)
- Sprint-01 deferment doc D2 entry
- ADR-0017 (existential-quantification semantics referenced by the safety check)
- Code: `RuleStore.js` (checkSafety, defineRule), `Evaluator.js` (guard removed)
