# Pass-3 Framing — Sprint-01 Proof Backend, Pass-3

**Status:** Seed/context document. Input to `design-small-task` (not `design-large-task`).
**Sprint:** 20260511-01-mp-redesign-proof-system / sprint-01-proof-backend-pass-3
**Predecessor:** sprint-01-proof-backend-pass-2 (merged 2026-05-12 via commit `a064b42`).

## Purpose of this document

This document seeds the pass-3 design conversation. It is NOT a design brief — `design-small-task` produces the brief through the interactive Q&A loop. This document is the context the design conversation starts from: the work that pass-3 must close, the artifacts it inherits from prior sub-sprints, the architectural sketch already on record, and the carry-over items pass-3 could optionally pick up.

The operator has elected to use `design-small-task` for pass-3, not `design-large-task`, despite the sprint-01 deferment doc's recommendation that D5 "would require a fresh design-large-task pass with adversarial review." The reasoning: pass-2's careful canonicalization plus the OQ-1 entry have de-risked the architectural question — the fix shape is well-sketched, the failure mode is well-characterized, and the partial-attempt diary is on record. Pass-3 is a focused implementation of a known-shape architectural change, not an open-ended design exploration. `design-small-task` is the correct container for that.

---

## What pass-3 must close

**OQ-1 (Evaluator IDB Indexing Architecture).** The Engine's evaluator currently performs a full linear scan over the derived set per body atom per iteration of semi-naive evaluation. For recursive transitive-closure workloads, this scales nonlinearly to the point of unusability: 100-element chain takes ~9 seconds; 1000-element chain extrapolates to hours. AC-11.2 (the 1000-element transitive-closure stress test) is currently marked `it.skip` because of this. Pass-3 closes this gap.

Full architectural context lives in:

- `docs/chester/plans/20260511-01-mp-redesign-proof-system/design-documents/engine-open-questions.md` — OQ-1 entry (problem shape, why-it-matters-now, what-is-known-about-the-resolution, closure-channel, acceptance-for-closure).
- `docs/chester/plans/20260511-01-mp-redesign-proof-system/sprint-01-proof-backend/plan/sprint-01-proof-backend-deferred-00.md` — D5 entry (the deeper architectural sketch, the partial-attempt diary, the risk catalog).

**Acceptance for pass-3 closure (lifted from the OQ-1 entry):**

1. AC-11.2 unskipped and passing within its 60-second budget. Expected runtime well under 1 second after the fix.
2. The 100-element termination test (`properties.test.js`) tightened back to its original 5000ms bound and passing.
3. The OQ-1 entry removed from `engine-open-questions.md` (the document becomes empty until the next open question arises).
4. A new ADR (likely ADR-0019) records the decision and supersedes OQ-1 in the cascade.
5. Engine spec §3.1 amended to record the indexing contract (or an ADR-only home accepted, per the design conversation).
6. All previously-passing tests continue to pass (no regression to the existing 87/1/0 baseline).
7. The negation branch (D3's existential-quantification semantics, ADR-0017) continues to behave correctly under the new lookup path — all AC-9.* tests stay green.

---

## Architectural sketch (already on record)

The fix shape is well-defined. From OQ-1's "What is known about the resolution" plus the D5 deferment entry:

### Data structure

Replace the current IDB shape (`Map<factKey, fact>`) with a per-position positional index that mirrors `FactStore._positionalIndex` exactly. Concretely:

```
derivedPositionalIndex: Map<predKey, Array<Map<value, Set<factKey>>>>
```

- Outer Map keyed by `${predicate}/${arity}`.
- Inner array length = arity.
- Each `Map<value, Set<factKey>>` indexes facts whose `args[position] === value`.

### Maintenance in `fireRule`

Every `derived.set(fk, fact)` is paired with a positional-index update: for each `i in [0..arity)`, insert `fk` into `positions[i].get(args[i])`'s bucket.

### Lookup in `matchBodyAtom`

Before falling back to a full predicate-bucket scan:

1. Identify atom-arg positions that are already bound (either a constant in the pattern, or a variable bound in `currentBindings`).
2. For each such (position, value) pair, look up `positions[position].get(value)` to get a `Set<factKey>` candidate set.
3. Intersect the candidate sets across bound positions. Iterate only the intersection.
4. Fall back to predicate-bucket scan if no positions are bound.

### Apply to the EDB side too

`matchBodyAtom`'s EDB path currently calls `factStore.allFacts(...)` and filters via `unify`. The same bound-position analysis should call `factStore.factsMatching(predicate, arity, position, value)` for each bound position and intersect. FactStore's positional index already exists; the Evaluator just isn't using it.

### Estimated size

~85 lines of code across `Evaluator.js`. Medium correctness risk on the negation branch (D3's existential-quantification semantics from ADR-0017 must continue to hold under the new lookup path) and on the intersection logic for repeated variables.

---

## Risks pass-3 should weigh during the design conversation

Lifted from the sprint-01 deferment doc D5 entry's risk catalog:

| Risk | Severity | Mitigation hint |
|---|---|---|
| Bucket intersection edge cases (empty set, single-bucket, all-wildcard atom) | High — subtle correctness | Property tests + targeted unit tests for intersection logic |
| Repeated variables in atom (`p(X, X)`) | Medium — could under- or over-filter | Defer index lookup when same variable appears twice; let `unify` handle equality |
| Negation branch existential-quantification semantics (ADR-0017) | High — different "any match" vs "all match" pattern | Reuse positional lookup for "is there ANY consistent match" via `bucket.size > 0` shortcut |
| Duplicates FactStore's positional-index design | Medium — code duplication, two parallel implementations | Audit may recommend factoring out a shared `PositionalIndex` utility |
| Evaluator becomes stateful across `fireRule` and `matchBodyAtom` boundaries | Low — index lives inside one `derive()` call | Pass index as a parameter; do not store as instance field |
| Memory cost of carrying the positional index per `derive()` call | Low — same shape as FactStore | Budget into existing AC-11.2 cost analysis |
| Sprint-02 Domain layer may want a different access pattern | Medium — Domain hasn't been built yet | Argument for letting design-small-task confirm the design against the existing engine workload rather than speculating |

---

## Carry-over items from pass-2 that pass-3 may optionally address

These are non-blocking deferred items captured during pass-2's per-task reviews. Pass-3's design conversation may decide to bundle any of them into pass-3's scope, defer further, or leave permanently:

1. **`unboundVars` array deduplication.** The `UNSAFE_RULE` error throw from `RuleStore.checkSafety` produces `unboundVars: ['X', 'X']` if a head has repeated unbound variables (e.g., `q(X, X) :- p(Y)`). No existing test exercises this shape. Fix: deduplicate via a `Set` collection inside `checkSafety`. Pass-2 Task 2 quality reviewer flagged, confidence 83, Minor.

2. **`04-engine-spec.md` frontmatter `related_adrs` staleness.** The YAML frontmatter lists `[0002, 0007, 0009, 0013, 0014]` and was not extended to include 0015-0018 during pass-2. Pre-existing pattern (the frontmatter was already stale before pass-2). Pass-3 introduces ADR-0019 (or later), so this field's drift compounds. Worth bundling a frontmatter-refresh into pass-3's scope or a future docs-only cleanup pass.

3. **ADR-0017 off-by-three line reference.** ADR-0017's References section cites `Evaluator.js:23-43` for "the negation branch in `matchBodyAtom`." The branch actually ends at line 40. Lines 42-43 begin the unrelated positive-match path. Trivial fix.

4. **`FactStore.js` `TYPE_ERROR` message text doesn't distinguish "non-finite number" from "non-number".** ADR-0015's Negative consequences section names this obligation: "The error message text must clearly distinguish 'non-finite number' from 'non-number' so the caller knows which constraint was violated." The current message is `non-constant argument: ${String(a)}` — a single message for all non-constant types. If pass-3 touches the engine error model anyway (it may not), bundling this in is cheap.

5. **Test repair pattern observed in pass-2.** Pre-existing cyclic-negation tests in `failures.test.js`, `transactions.test.js`, `operations.test.js` used rule patterns where the head variable appeared only in a negated body atom (e.g., `p(X) :- ¬q(X)`). These violated the new `UNSAFE_RULE` check and were repaired by adding a positive binding atom (`base(X)`) to each rule body. Pass-3 may discover analogous patterns when adding stress tests or expanding coverage — if so, the same surgical repair pattern applies. The pre-existing test files now serve as reference examples.

---

## Existing code anchors pass-3 will touch or reference

Confirmed live at HEAD (commit `a064b42`):

- `skills/design-large-task/engine/Evaluator.js` — primary target. `matchBodyAtom` (lines ~18-69) is where positional lookup integrates. `fireRule` (inside `derive()`'s inner loop) is where the new positional index updates happen.
- `skills/design-large-task/engine/FactStore.js` — pre-existing `_positionalIndex` field and `factsMatching(predicate, arity, position, value)` method are the model. The Evaluator's new index mirrors their shape.
- `skills/design-large-task/engine/__tests__/stress.test.js` — AC-11.2 currently `it.skip`. Pass-3 unskips it.
- `skills/design-large-task/engine/__tests__/properties.test.js` — termination test currently uses 15000ms bound for the 100-element case. Pass-3 tightens this back to 5000ms.
- `docs/chester/plans/20260511-01-mp-redesign-proof-system/design-documents/04-engine-spec.md` — §3.1 (semi-naive evaluation) may need amendment to record the indexing contract.
- `docs/chester/plans/20260511-01-mp-redesign-proof-system/design-documents/engine-open-questions.md` — OQ-1 entry will be removed at pass-3 closure.

---

## Procedural reminders for the design conversation

These are recurring rules from the cascade that pass-3 must honor (lifted from pass-2's experience):

- **Sub-sprint as the unit of supersession.** Pass-3 produces its own fresh `-00` artifacts inside `sprint-01-proof-backend-pass-3/`. Pass-2's folder stays frozen as historical record. Do not edit pass-2's artifacts.
- **Pass-3's spec is a full canonical successor to pass-2's spec.** Carry forward all still-applicable acceptance criteria; amend in place where the indexing change adds or modifies contract surface.
- **ADR convention.** New ADR uses kebab-case filename, no " copy" suffix. Next available number is 0019.
- **Engine-spec citation format.** Use canonical `(See ADR-NNNN.)` form (capital S, parentheses, trailing period inside).
- **Breadcrumb format.** If pass-3 adds new code sites worth annotating, single-line `// ADR-NNNN: <4-8 word failure-mode>` form.
- **Test discipline.** Any new rule definitions in tests must respect the safety condition (head variables bound by at least one non-negated body atom). The Task 2 deviation in pass-2 is the cautionary tale.

---

## Inputs for `design-small-task` to consume

When `design-small-task` runs against this seed:

1. The brief source is this document plus the OQ-1 entry and the D5 deferment doc entry.
2. The design conversation should confirm scope (the architectural sketch above, plus which carry-over items are bundled in), surface considerations the seed glosses over, and decide whether engine-spec §3.1 gets an amendment or whether the ADR is the sole home of the indexing contract.
3. Out of scope by default: the carry-over items 1-4 above (each is opt-in). The Task 2 test-repair pattern (item 5) is not a follow-up item; it's a precedent.

The conversation produces a design brief in `sprint-01-proof-backend-pass-3/design/sprint-01-proof-backend-pass-3-design-00.md`, then transitions to `design-specify` which formalizes the brief into a spec.

---

## Why `design-small-task` and not `design-large-task`

The operator's call. The seed makes the case:

- The architectural shape is settled (per-position index mirroring FactStore's existing pattern).
- The failure mode is well-characterized (linear scan dominates at scale).
- A partial fix was already attempted and reverted in sprint-01 — the failure path is documented.
- Pass-3's primary work is implementation of a known shape, not exploration of competing architectures.
- The risk catalog is on record; the design conversation can address each risk without rebuilding the analysis.

`design-large-task` is heavier than this work warrants. `design-small-task`'s information-package + commentary loop is the right container for confirming scope, surfacing the carry-over decisions, and producing a focused brief.
