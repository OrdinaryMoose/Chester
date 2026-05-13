---
status: Accepted
date: 2026-05-13
deciders: [M]
related_docs: [04-engine-spec]
related_adrs: [0002]
---

# ADR-0019: Evaluator IDB Positional Indexing (with Delta-Driven Join)

## Status

Accepted.

## Context

The Engine's `Evaluator.matchBodyAtom` resolved body atoms against the IDB by performing a full linear scan over `derived.values()` per body atom per iteration. On non-recursive workloads this constant-factor cost stayed acceptable; on recursive workloads — most notably transitive closure over a chain of N elements — the iteration count grows with the IDB size and the scan inside each iteration multiplies it, producing nonlinear scaling that dominates runtime.

AC-11.2 (1000-element transitive closure, originally scheduled for sprint-01 verification) was marked `it.skip` precisely because of this. Sprint-01's deferment entry D5 recorded the gap. The open-questions tracker carried it as OQ-1: "How will the evaluator deliver acceptable asymptotic performance on recursive workloads?" — alongside the explicit constraint that whatever answer landed had to preserve the existing semi-naive semantics, stratification ordering, negation contract, and rule-safety check.

Pass-3 took OQ-1 as its scope. The design-specify phase surveyed four candidate architectures (Architect A's per-position index with extracted module and minimal-edit branches; Architect B's per-position index with inline helpers and a restructured pipeline; a hybrid; and the do-nothing-keep-`it.skip` baseline). The pass-3 design brief and spec carried the hybrid forward.

## Information Used

- Sprint-01 deferment doc, D5 entry.
- `engine-open-questions.md`, OQ-1 entry.
- Pass-3 design brief.
- Pass-3 spec.
- The four-architecture comparison written during design-specify (Architect A, Architect B, hybrid, baseline).

## Alternatives Considered

- **Keep linear scan with `it.skip` on AC-11.2.** Rejected — fails the closure obligation; OQ-1 stays open indefinitely.
- **Per-predicate index only.** Rejected — pass-1 Task 15 already attempted this and it was reverted; on recursive workloads every body atom of a recursive rule shares the head predicate, so a per-predicate index gives zero discrimination.
- **Per-position index, extracted module + minimal-edit branches (Architect A).** Viable; data structure lives in a separate file, but the lookup discipline stays scattered across `matchBodyAtom`'s existing branch structure. Gives up the chance to consolidate stacking discipline in one place.
- **Per-position index, inline helpers + restructured pipeline (Architect B).** Viable; consolidates discipline but couples the data structure to the discipline in one file, expanding blast radius for future index changes.
- **Per-position index, extracted module + in-engine unified helper (hybrid, chosen).** Splits responsibility: the module owns the data structure; the engine owns the lookup discipline.
- **Magic sets / hash join / Datalog-specific bottom-up optimizations.** Out of scope — would require a fresh design-large-task pass and reshape the evaluator. Recorded as a future direction, not a pass-3 candidate.

## Decision

Adopt the hybrid:

1. **Extracted `DerivedPositionalIndex` module.** Owns the per-position-bucket data structure and a thin `bucketFor` primitive that returns the set of derived facts matching a `(predicate, position, value)` triple. No lookup policy lives in this module.
2. **In-engine `candidatesFor` helper.** Owns the lookup discipline: bound-position identification from the current variable substitution, repeated-variable deferral, smallest-set-driver selection across positions and against the delta set, delta composition with the previous-iteration derived set, and negation-vs-positive routing. This helper is the single consumer of `bucketFor`.
3. **Derive-local lifecycle.** The new index is constructed at the start of each `derive()` call, threaded through `fireRule` and `matchBodyAtom`, paired with `derived.set` writes, and discarded when `derive()` returns. It is never persisted across calls; semi-naive evaluation rebuilds it each derive.
4. **Base-facts (EDB) side untouched.** The existing fact-store positional indexes remain as they were. Pass-3 ships parallel implementations (EDB positional index and the new IDB positional index) and defers any consolidation to the audit task.
5. **Delta-driven join in `fireRule`.** A delta-driven join was added during pass-3 execution after measurement showed the per-position index alone was insufficient. When a rule body has an atom that is delta-restricted (the atom whose new bindings drive this iteration's fire) and that atom is not body[0], `fireRule` processes that atom first and propagates its bindings to the remaining body atoms via the positional lookup. This was necessary to achieve the 5-second AC-11.2 budget — without it, body-atom processing in declared order multiplied N parent bindings against O(K) per-atom-1 lookups, leaving the recursive transitive closure at O(N^3). The per-position index alone closed the constant-factor gap but not the algorithmic gap.

## Rationale

The split between the module and the in-engine helper is a SOLID alignment: single responsibility per file (data structure vs. discipline), an ISP-friendly minimal module surface (`bucketFor` is the only export the engine reaches for), and no LSP risk from a shared hierarchy because there is no hierarchy. The blast-radius constraint of pass-3 — do not refactor the stable EDB fact-store side — is honored by construction: the new module touches IDB only.

Separation of concerns is the readability story: a future reader looking for "how does an index bucket get populated?" reads `DerivedPositionalIndex.js`; a future reader looking for "what is the join strategy across body atoms?" reads the in-engine `candidatesFor` and `fireRule`. The two questions never tangle.

The delta-driven join in `fireRule` was necessary to meet the asymptotic performance contract that AC-11.2 encodes. The per-position index by itself would have made each lookup cheaper, but recursive transitive closure produces a workload where the join order matters more than the lookup cost. Processing the delta-restricted atom first cuts the outer loop from N (parent bindings) down to delta-size, and the remaining body atoms are then resolved via constant-time positional lookup against the already-bound variables. The combination — per-position index + delta-driven ordering — is what closes the asymptotic gap.

## Consequences

**Positive:**

- AC-11.2 passes within its 5-second budget (actual: ~2.6s on the reference machine).
- The 100-element transitive-closure termination test tightens to a 5-second budget (actual: ~64ms), making it a useful regression signal rather than a generous ceiling.
- The named integration risks from the design brief — delta-driver correctness, negation behavior under the new lookup path, repeated-variable handling — each have dedicated tests in the pass-3 test suite.
- Engine spec §5.3 now enforces a previously-implicit contract: the IDB carries positional indexes of the same shape as the EDB's, scoped to the lifetime of a single `derive()` call.

**Negative:**

- Two parallel positional-index implementations now live in the engine (one for EDB, one for IDB). Future readers may not know which is canonical or whether they should be consolidated. The audit task is the channel for that question; consolidation is deferred to whenever sprint-02's workload patterns motivate it.
- `fireRule`'s body-atom processing order is no longer the rule's declared order when `deltaAtomIndex > 0`. This is a subtle semantic change for anyone reasoning about evaluation order. The observable model semantics are unchanged — semi-naive evaluation is still producing the same minimal model — but the trace of which atom is matched first inside a fire is no longer "left to right as written."

**Neutral:**

- The new index is rebuilt every `derive()`. On programs with very large derived sets and frequent re-derive cycles, the rebuild cost is nonzero; the alternative (persisting and incrementally updating the index across derives) would couple the index's lifecycle to mutation paths and was deemed not worth the complexity for pass-3.

## Confidence

High on the decision. The hybrid was the architecture that survived the four-way comparison, the delta-driven join is the change that measured into the budget, and the tests cover the integration risks. Medium on the long-term consolidation question — whether the EDB and IDB positional indexes should converge into one shared implementation depends on what sprint-02's actual workload patterns look like, and pass-3 deliberately did not pre-judge that.

## Supersedes

- OQ-1 in `engine-open-questions.md` (entry removed from the open-questions tracker as part of this sprint's deliverables).

## References

- `04-engine-spec.md §5.3` (the contract this ADR establishes).
- `04-engine-spec.md §3.1` (semi-naive evaluation — the context the index lives in).
- Sprint-01 deferment doc, D5 entry.
- Pass-3 design brief.
- Pass-3 spec.
- Code: `Evaluator.js` — the in-engine `candidatesFor` helper, `fireRule`'s delta-driven join, and the `matchBodyAtom` consumer.
- Code: `DerivedPositionalIndex.js` — the new module owning the per-position-bucket data structure and `bucketFor` primitive.
