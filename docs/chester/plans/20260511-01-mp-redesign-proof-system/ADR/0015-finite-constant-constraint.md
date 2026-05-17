---
status: Accepted
date: 2026-05-12
deciders: [M]
related_docs: [04-engine-spec]
related_adrs: [0002]
---

# ADR-0015: Finite-Constant Constraint at the EDB Write Path

## Status

Accepted.

## Context

The Engine treats `assertFact` argument values as constants drawn from a small type set: string, number, boolean, null. The original `04-engine-spec.md §2.1` enumerated this set without qualifying "number" — admitting all JavaScript number values, including `NaN`, `+Infinity`, and `-Infinity`.

During sprint-01 Task 2 (FactStore implementation), a quality review surfaced a defect class: `JSON.stringify(NaN)` produces the string `"null"`, as does `JSON.stringify(Infinity)` and `JSON.stringify(-Infinity)`. The fact-key encoding `factKey(args) = JSON.stringify(args)` therefore collapses three distinct numerical sentinels into the same string as a legitimately-null-valued fact. Two unrelated facts — say `p(NaN)` and `p(null)` — would share a key, with the second assertion silently overwriting the first or being treated as a duplicate.

The collision propagates downstream: the evaluator joins against the EDB by matching fact-key tuples, so a poisoned EDB produces wrong-result derivations. This is data corruption, not a clean error.

Sprint-01's plan-prescribed `FactStore.isConstant` did not include a finite-number check. The corrected version, added during sprint-01 as a surgical fix (commit on top of Task 2's original commit), reads:

```js
const isConstant = (v) =>
  typeof v === 'string' ||
  (typeof v === 'number' && Number.isFinite(v)) ||
  typeof v === 'boolean' ||
  v === null;
```

The text of `04-engine-spec.md §2.1` and sprint-01's spec text still describe constants as "string, number, boolean, null" — looser than the corrected code. Pass-2 reconciles the text with the code.

## Decision

Constants accepted at the EDB write path (`assertFact`) are restricted to:

- string
- finite number (`Number.isFinite(v) === true`)
- boolean
- `null`

`NaN`, `+Infinity`, and `-Infinity` are rejected with `TYPE_ERROR`. The check lives in `FactStore.isConstant`; `assertFact` is the only public entry point that consults it.

## Rationale

A finite-number constraint is the minimum surface area that closes the silent-collision class without restricting expressive power for any legitimate Domain-layer use. Datalog programs reason about discrete values; no canonical Datalog example uses `NaN` or infinite values as fact arguments. Rejecting them at the boundary is cheap (one `Number.isFinite` call per arg per assertion) and pushes the failure to the call site rather than letting it propagate into corrupt derivations.

The alternative — accepting non-finite numbers and changing the fact-key encoding to disambiguate them — would require either a custom serializer (heavier than this fix) or living with the collision indefinitely.

## Consequences

**Positive:**
- The silent-collision class for non-finite numerical sentinels is closed at the boundary.
- The error mode is structured (`TYPE_ERROR`) and observable at the call site.
- The contract aligns with the corrected code already in production.

**Negative:**
- A Domain caller that legitimately wants to assert a non-finite numerical sentinel (extremely unusual) must encode it differently (e.g., as a string or a boxed object).
- The error message text must clearly distinguish "non-finite number" from "non-number" so the caller knows which constraint was violated.

**Neutral:**
- This constraint is a strict refinement of sprint-01's text; programs that complied with the spec text already comply with this tightening.

## Alternatives considered

- **Accept non-finite numbers and change the fact-key encoding.** Rejected — heavier change with broader blast radius; the simpler boundary check is sufficient.
- **Document the gap without changing the code.** Rejected — silent data corruption is unacceptable.
- **Bundle this tightening into a generic "well-formedness check" alongside other input validation.** Rejected — premature abstraction for a single sentinel class.

## What would change the decision

If a future Domain workload requires non-finite numerical sentinels as first-class fact arguments, the decision is revisited along with a fact-key encoding change to disambiguate them.

## References

- `04-engine-spec.md §2.1 Inclusions` (post-pass-2 amended text)
- Sprint-01 deferment doc: D1 entry at `docs/chester/plans/20260511-01-mp-redesign-proof-system/sprint-01-proof-backend/plan/sprint-01-proof-backend-deferred-00.md`
- Code: `FactStore.js:6-10`
