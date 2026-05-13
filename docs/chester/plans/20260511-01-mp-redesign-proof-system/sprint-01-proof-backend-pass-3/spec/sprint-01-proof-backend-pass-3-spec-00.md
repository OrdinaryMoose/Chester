# Spec: Evaluator IDB Indexing

**Sprint:** sprint-01-proof-backend-pass-3 (under master 20260511-01-mp-redesign-proof-system)
**Parent brief:** docs/chester/working/20260511-01-mp-redesign-proof-system/sprint-01-proof-backend-pass-3/design/sprint-01-proof-backend-pass-3-design-00.md
**Architecture:** Hybrid — extracted derived-side index module plus unified in-engine candidate-source helper. The module owns the data structure and the per-bucket primitive; the in-engine helper owns the lookup discipline (bound-position identification, repeated-variable deferral, smallest-set-driver, delta composition, negation/positive routing).

## Goal

Add a per-position lookup index on the derived-facts side of the rule-firing engine to eliminate the full linear scan over `derived.values()` that currently runs per body atom per iteration of semi-naive evaluation. Mirror the data-structure shape of the base-facts store's existing positional index but separate it into its own co-located module so its concerns (data structure + thin per-bucket primitive) stay independent of the evaluator's lookup discipline. Restructure `matchBodyAtom` to consume from a single unified candidate-source helper that handles all four candidate-source cases (bound-positions-only, delta-only, both, neither) for both the base-facts side and the derived side, and applies the same discipline to both the positive and the negation branches. Unskip the thousand-element transitive-closure stress test (AC-11.2) and tighten its budget to five seconds; tighten the hundred-element termination test budget back to five seconds. Land a new architectural decision record recording the indexing decision and superseding OQ-1. Bundle two small documentation cleanups (engine spec front-matter `related_adrs` refresh; ADR-0017 off-by-three line reference correction).

## Components

**New units:**

- `skills/design-large-task/engine/DerivedPositionalIndex.js` — module file. Exports one class encapsulating the derived-side lookup index.
  - Constructor — initializes an empty `Map<"predicate/arity", Array<Map<value, Set<factKey>>>>`.
  - `addFact(predicate, args)` — for each position `i` in `[0..arity)`, inserts the corresponding `factKey` into `positions[i].get(args[i])`'s bucket; creates the per-predicate array and the per-value bucket on first use. Mirrors the index-maintenance block of `FactStore.assertFact` (lines ~40-50) but omits the primary-fact map write and `_validateArgs` (both belong to the evaluator's caller path).
  - `bucketFor(predicate, arity, position, value)` — returns the `Set<factKey>` of derived facts whose argument at `position` equals `value`. Returns an empty Set when no facts match the predicate/arity, or when the value has no bucket. This is the thin per-bucket primitive that mirrors the base-facts side's existing `factsMatching` per-position call, minus the conversion back to fact arrays.
  - No `retractFact` method — the derived-side index is grow-only within a single derivation run.

- `skills/design-large-task/engine/__tests__/DerivedPositionalIndex.test.js` — dedicated unit-test file for the new module. Tests `addFact` and `bucketFor` in isolation from the evaluator loop.

- `skills/design-large-task/engine/__tests__/evaluator-indexing.test.js` — new integration test file containing the three named-risk dedicated tests (delta-driver, negation under new lookup, repeated variables). Co-located with existing `__tests__/` files.

- New ADR file: `docs/chester/plans/20260511-01-mp-redesign-proof-system/design-documents/ADR-0019-evaluator-idb-positional-indexing.md` (or the next available number if 0019 is taken). Records the indexing decision and explicitly supersedes OQ-1 in the cascade.

**Modified units:**

- `skills/design-large-task/engine/Evaluator.js` — adds an in-engine module-scope helper `candidatesFor(atom, currentBindings, factStore, idbIndex, deltaFilter)` that returns the candidate iterable for one body atom given current context. Modifies `derive()` to construct an `idbIndex` at the top of each iteration of the inner `while` loop, threads it through `fireRule`, and pairs every `derived.set(fk, fact)` with an `idbIndex.addFact(fact.predicate, fact.args)` call. Modifies `matchBodyAtom` to call `candidatesFor` once instead of constructing its own candidate arrays; both branches (positive and negation) consume from the helper. Imports `DerivedPositionalIndex` at the top.

- `skills/design-large-task/engine/__tests__/stress.test.js` — unskips AC-11.2 (removes `it.skip`, becomes `it`); changes its budget from 60000 ms to 5000 ms; removes the D5 comment block.

- `skills/design-large-task/engine/__tests__/properties.test.js` — changes the 100-element termination test's vitest `timeout` option from 20000 to 5000 and its `toBeLessThan` bound from 15000 to 5000; removes the D5 comment block.

- `docs/chester/plans/20260511-01-mp-redesign-proof-system/design-documents/04-engine-spec.md` — amends §5.3 (Derived set / IDB) to promote the implicit "same shape as fact store" phrasing into an explicit statement that the derived side carries per-position lookup tables of the same shape as §5.1's positional indexes, with the lifecycle constraint that the derived-side index is rebuilt within each `derive()` call and never persisted; adds a `(See ADR-0019.)` cross-reference. Updates front-matter `related_adrs` to include records added in pass-2 (ADR-0015 through ADR-0018) and the new pass-3 ADR.

- `docs/chester/plans/20260511-01-mp-redesign-proof-system/design-documents/ADR-0017-existential-quantification-negation-semantics.md` — corrects the off-by-three line reference in the References section to match the post-pass-3 line numbers in `Evaluator.js`.

- `docs/chester/plans/20260511-01-mp-redesign-proof-system/design-documents/engine-open-questions.md` — removes the OQ-1 entry. The document becomes empty until the next open question arises.

## Data Flow

1. **Construction.** At the top of each iteration of `derive()`'s inner `while` loop (per stratum), the evaluator constructs a fresh `DerivedPositionalIndex` instance. (Choice: per-iteration rebuild vs. per-derive incremental — see §Constraints for the binding choice.)
2. **Maintenance.** Each `derived.set(fk, fact)` call inside `fireRule` is immediately paired with `idbIndex.addFact(fact.predicate, fact.args)`. This pairing happens at the two existing `derived.set` sites in `fireRule`.
3. **Lookup.** When `matchBodyAtom` is invoked on a body atom, it calls `candidatesFor(atom, currentBindings, factStore, idbIndex, deltaFilter)`. The helper:
   - Identifies which atom positions are *bound* — a constant in the pattern, or a variable already in `currentBindings`. Repeated variables (the same variable name appearing at two or more positions in the atom) are deferred: only the *first* occurrence drives bucket lookup; the unification step handles equality.
   - For each bound position, computes the candidate sets from both sides — `factStore.factsMatching(...)` for the base side and `idbIndex.bucketFor(...)` for the derived side — and combines them by union into a per-position candidate set of fact references (since a body atom matches against base OR derived).
   - When two or more positions are bound, intersects the per-position candidate sets across positions, driving iteration off the smallest set and testing membership in the others.
   - When `deltaFilter` is non-null (i.e., this atom is the delta-restricted atom on a non-first pass and is not negated): if the helper computed a bound-position candidate set, intersects it with the delta set; if no positions are bound, the candidate set is the delta set itself (never falls back to the full predicate bucket in this case).
   - When `deltaFilter` is null and no positions are bound, falls back to the full predicate-bucket scan (current behavior preserved for the first-iteration / nothing-bound case).
4. **Negation routing.** When the atom is negated, `matchBodyAtom` invokes `candidatesFor` with `deltaFilter` forced to null (negation never receives a delta restriction). The helper returns the bound-position-narrowed candidate set; the negation branch then iterates and runs the existing `isConsistent` consistency check against `currentBindings`. The branch succeeds (no derivation blocked) when no candidate is consistent — a `bucket.size > 0` shortcut returns "no match" only when the bucket itself is empty.
5. **Positive iteration.** The positive branch iterates the candidate set, runs `unify(atom.args, candidateArgs)`, merges fresh bindings with `currentBindings` (rejecting on inconsistency), and emits a new bindings frame for each consistent candidate.
6. **Discard.** When the inner `while` loop terminates for the stratum, the `idbIndex` local goes out of scope. The next iteration constructs a fresh one. The next `derive()` call constructs a fresh one. The index is never an instance field on `Evaluator`.

## Error Handling

- `addFact` and `bucketFor` are pure data-structure operations; they do not throw. Inputs are pre-validated by the evaluator (arity and predicate are normalized; args are constants per `FactStore`'s contract).
- `candidatesFor` does not throw; an empty candidate set is the natural empty result. The fallback to full-predicate scan triggers only when both `deltaFilter` is null and no positions are bound.
- All existing evaluator error paths are unchanged: `MEMORY_BUDGET_EXCEEDED` (10000-iteration cap), `UNBOUND_HEAD_VARIABLE` (head-args undefined check inside `fireRule`), and the various inherited errors from `FactStore` and `RuleStore`.
- No new error code is introduced by pass-3.

## Testing Strategy

- **Unit tests for the new module** (in `DerivedPositionalIndex.test.js`):
  - `addFact` with single arity-1 fact populates one bucket.
  - `addFact` with multiple facts populates correct buckets per position.
  - `addFact` is idempotent at the bucket level (Set semantics): adding the same fact key twice yields a Set of size one.
  - `bucketFor` with no facts asserted returns an empty Set.
  - `bucketFor` with a position out of range (or a value with no bucket) returns an empty Set.
  - `bucketFor` returns the correct fact-key Set for a known (position, value) pair.
- **Integration tests for named integration risks** (in `evaluator-indexing.test.js`):
  - **Delta-driver case (AC-1.1).** A rule whose delta-restricted atom has no bound positions iterates the delta set as the candidate set, not the full predicate bucket. Observable: total candidate-iteration count matches delta size, not derived-set size. (Verified via test workload designed to exercise this exact path; assertion via test-side instrumentation or via observable timing on a workload calibrated to fail at predicate-bucket-iteration cost.)
  - **Negation under new lookup (AC-1.2).** A rule with a negated body atom containing mixed bound and unbound variables produces the correct derivations under the new lookup path. Reuses the AC-9.4 leaf-of-ancestor pattern from existing tests with additional coverage for the bound-position narrowing case.
  - **Repeated variables (AC-1.3).** A body atom of the form `p(X, X)` (same variable in two positions) produces correct candidate sets — the helper drives lookup off the first occurrence only and lets unification verify equality on subsequent occurrences. Workload: facts asserted with one repeated-value pair and one mismatched-value pair; expectation: only the repeated-value pair derives the head.
- **Regression baseline.** The full 87-test passing baseline from pass-2 continues to pass. AC-9.1 through AC-9.4 (canonical negation tests) continue to pass under the new lookup path. AC-11.1, AC-11.3, AC-11.4 stress tests continue to pass.
- **Stress-test contract.** AC-11.2 (thousand-element transitive closure) unskipped, budget 5000 ms, expected runtime well under one second.
- **Termination-test contract.** The 100-element termination test in `properties.test.js` tightened from 15000 ms to 5000 ms bound and from 20000 ms to 5000 ms vitest timeout.
- **Test shape per Decision 6 of the brief.** Each named integration risk gets at least one dedicated test. The implementer chose unit + integration mix; property tests are not required but may be added if helpful.

## Constraints

- **Derive-local lifecycle.** The `DerivedPositionalIndex` instance is constructed inside `derive()` (specifically at the top of the inner `while` loop, once per iteration), threaded through `fireRule` and `matchBodyAtom`, and discarded when the loop terminates. It is never stored as an instance field on `Evaluator`. No cross-derive persistence.
- **Index-rebuild boundary (binding choice for pass-3).** The index is constructed fresh at the top of each iteration of the inner `while` loop and accumulated incrementally inside that iteration via the `addFact` calls paired with `derived.set`. This binds the hybrid's "incremental maintenance" answer (Architect A's call) to the per-iteration scope. Rationale: at each iteration boundary the `delta` Set already represents new facts; carrying the index across iterations would require also carrying it across boundary-changing events (stratum change, derive() restart) in ways that complicate invariants. The per-iteration scope keeps invariants simple.
- **Bound-position intersection on both sides.** Body-atom matching must intersect bound-position candidate sets from both the base side (via `factStore.factsMatching`) and the derived side (via `idbIndex.bucketFor`). The candidate set is the union of per-side intersections, since a body atom matches against base OR derived facts.
- **Smallest-set-driver.** When multiple bound positions exist, the implementation drives iteration off the smallest per-position candidate set and tests membership in the others.
- **Delta-driver special case.** When an atom is the delta-restricted atom on a non-first pass and has no bound positions, the candidate set is the delta set itself. The implementation must not fall back to the full predicate bucket in this case.
- **Repeated-variables deferral.** When an atom contains the same variable in two or more positions, only the first occurrence drives bucket lookup; the unification step handles equality on subsequent occurrences. The helper performs this deduplication before issuing bucket lookups.
- **Negation branch invariant.** The negation branch never receives a delta restriction. `matchBodyAtom` passes `deltaFilter = null` to `candidatesFor` whenever `atom.negated` is true. The negation branch's existing existential-quantification semantics (ADR-0017) hold under the new lookup path — every candidate the helper returns is still checked via `isConsistent` against `currentBindings`.
- **No base-facts side refactor.** `FactStore`'s positional index implementation, the `factsMatching` method, and all other `FactStore.js` content stay unchanged. Pass-3 consumes the base-facts side as-is.
- **No public API change.** The engine's public surface (`Engine.js`, the six substrate ports, all 17 public methods listed in engine spec §4) stays unchanged. The indexing change is internal-only.
- **Module boundary discipline.** `DerivedPositionalIndex` exposes only the constructor, `addFact`, and `bucketFor`. No lookup-discipline logic (bound-position identification, repeated-variable deferral, delta composition, smallest-set-driver, negation/positive routing) lives in the module — all of that lives in the in-engine `candidatesFor` helper.

## Non-Goals

- **No engine algorithm change beyond indexing.** Semi-naive evaluation, stratification, fixed-point semantics, and forward-chaining remain unchanged. No magic sets, no hash joins, no algorithm-level rework.
- **No base-facts store refactor.** Two parallel positional-index implementations (one in `FactStore.js`, one in `DerivedPositionalIndex.js`) live side by side after pass-3. Consolidation is deferred to the audit task.
- **No anticipatory work for sprint-02's Domain layer.** The per-position approach is the right foundation regardless of what sprint-02 reveals. Additional indexing mechanisms can be added later when motivated by real workload evidence.
- **No fix for the rule-store `UNSAFE_RULE` payload duplicate-entries item** from pass-2's optional carry-over list. Defers to a future docs cleanup or rule-store-touching sprint.
- **No fix for the base-facts store `TYPE_ERROR` message disambiguation between "not a number" and "non-finite number".** Defers because pass-3 keeps the base-facts side untouched per the parallel-implementations call.
- **No test-suite reorganization.** Pass-3 adds new test files (`DerivedPositionalIndex.test.js`, `evaluator-indexing.test.js`) but does not rename, reorganize, or restructure existing test files.
- **No public API surface change.** No new public methods on `Engine.js`. No changes to existing public method signatures.
- **No incremental-rebuild optimization.** The index is constructed fresh per iteration of the inner `while` loop. Cross-iteration incremental maintenance is out of scope; it could be added in a follow-up sprint if profiling shows the per-iteration construction cost is material.

## Acceptance Criteria

### AC-1.1 — Delta-driver case uses delta as candidate set

**Observable boundary:**
- When the delta-restricted atom on a non-first iteration has no bound positions → the candidate-iteration count for that atom equals the delta-set size, not the full predicate-bucket size. Verified via test-side instrumentation: `candidatesFor` (or an equivalent observation hook the implementer exposes for the test only) records a per-atom candidate-iteration count that the test reads after `derive()` returns. Timing-based assertions are explicitly *not* the verification mechanism for this AC.
- When the delta-restricted atom on a non-first iteration has at least one bound position → the candidate-iteration count is bounded by the intersection of bound-position buckets with the delta set (never larger than either input alone). Same instrumentation-based verification.

**Given:** a rule with body atoms positioned such that one atom is the delta-restricted atom and has no bound positions when reached, and test-side instrumentation that captures the per-atom candidate-iteration count.
**When:** `derive()` runs the second or later iteration of the inner `while` loop on the rule's stratum.
**Then:** the captured candidate-iteration count for that atom equals the delta-set size for that predicate (not the full predicate-bucket size on either the base side or the derived side).

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-1.2 — Negation branch under new lookup preserves existential semantics

**Observable boundary:**
- For a negated body atom with at least one bound position → only facts whose bound positions match the bound values are checked for `isConsistent`; unbound positions remain existentially quantified, matching ADR-0017's semantics.
- For a negated body atom with no bound positions → the existing predicate-bucket fallback is used; no behavioral change from pass-2.
- AC-9.1 through AC-9.4 (canonical negation tests, including the leaf-of-ancestor pattern with mixed bound and unbound variables) continue to pass.

**Given:** a rule with a negated body atom and at least one variable already bound by an earlier positive body atom.
**When:** `derive()` runs and reaches the negated atom in `matchBodyAtom`.
**Then:** the candidate set the negation branch checks is narrowed by the bound-position buckets on both sides (base + derived), the existing `isConsistent` check runs against each candidate, and the derivation either succeeds (no consistent match exists) or fails (some consistent match exists), with results matching the canonical-Datalog existential semantics.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-1.3 — Repeated variables defer to unification

**Observable boundary:**
- For a body atom whose same variable appears at two or more positions → only the first occurrence drives bucket lookup; subsequent occurrences are not used for index narrowing.
- Unification produces the correct equality check, rejecting candidates whose corresponding argument positions hold different values.

**Given:** a rule with a body atom of the form `p(X, X)` and a base or derived fact relation `p` containing facts with matching and non-matching argument pairs.
**When:** `derive()` evaluates the rule.
**Then:** only facts where the two argument positions hold the same value contribute to the derivation.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-2.1 — Thousand-element transitive-closure stress test unskipped and within budget

**Observable boundary:**
- The test labeled `AC-11.2` in `__tests__/stress.test.js` is no longer marked `it.skip`.
- The test's vitest timeout option is 5000 ms (down from 60000 ms).
- The test passes within the 5000 ms budget.

**Given:** the test file with AC-11.2 unskipped and budget set to 5000 ms.
**When:** the test suite runs.
**Then:** AC-11.2 completes within 5000 ms with the expected derivation count (`1000 * 1001 / 2 = 500500`).

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-2.2 — Hundred-element termination test tightened back to 5-second bound

**Observable boundary:**
- The termination test in `__tests__/properties.test.js` has its vitest `timeout` option set to 5000 (down from 20000).
- The test's `toBeLessThan` bound is set to 5000 (down from 15000).
- The test passes within the tightened budget.
- The D5 comment block referencing the deferred indexing work is removed.

**Given:** the termination test with both timeout and bound set to 5000.
**When:** the test suite runs.
**Then:** the test completes within 5000 ms with the expected derivation count of 5050.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-3.1 — Regression baseline preserved

**Observable boundary:**
- All 87 previously-passing tests from the pass-2 baseline continue to pass.
- No test that previously passed is failing or skipped after pass-3.

**Given:** the full engine test suite as committed at pass-2's close (commit `a064b42`), minus the skipped AC-11.2 which is unskipped under AC-2.1.
**When:** the test suite runs.
**Then:** all 87 baseline tests pass; the test count after pass-3 is at least 87 passing plus AC-11.2 (now passing) plus the new pass-3 tests.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-4.1 — New ADR records the indexing decision

**Observable boundary:**
- A new ADR file exists at `docs/chester/plans/20260511-01-mp-redesign-proof-system/design-documents/ADR-{next-available-number}-evaluator-idb-positional-indexing.md` (or equivalent kebab-case slug).
- The ADR follows the established template structure (Context, Information Used, Alternatives Considered, Decision, Rationale, Consequences, Confidence).
- The ADR explicitly states it supersedes OQ-1.
- The ADR records the hybrid architecture: extracted module + in-engine unified helper, with separated concerns.
- The ADR records the parallel-implementations rationale and the audit-task referral.

**Given:** the design-documents directory and the pass-3 design brief plus this spec.
**When:** plan-build and execute-write produce the ADR as part of pass-3's deliverables.
**Then:** the ADR exists at the expected path with the expected content shape.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-4.2 — Engine spec §5.3 amended for derived-side positional indexing

**Observable boundary:**
- `docs/chester/plans/20260511-01-mp-redesign-proof-system/design-documents/04-engine-spec.md` §5.3 is amended to explicitly state that the derived-side IDB carries per-position lookup tables of the same shape as §5.1's positional indexes.
- The amendment includes a lifecycle statement that the derived-side index is constructed within each `derive()` call (specifically per iteration of the inner `while` loop) and never persisted across calls.
- A cross-reference `(See ADR-{N}.)` points to the new ADR.

**Given:** the engine spec at its pass-2-end state plus the new ADR.
**When:** execute-write produces the spec amendment as part of pass-3's deliverables.
**Then:** §5.3 reads as the amended version with the contract, the lifecycle statement, and the cross-reference present.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-4.3 — Engine spec front-matter `related_adrs` refreshed

**Observable boundary:**
- `04-engine-spec.md` front-matter `related_adrs` list is updated to include the records added in pass-2 (ADR-0015 through ADR-0018) and the new pass-3 ADR.
- The list is in ascending numeric order.

**Given:** the engine spec front-matter at its pass-2-end state (stale per the framing).
**When:** execute-write produces the front-matter update as part of pass-3's deliverables.
**Then:** the front-matter `related_adrs` list contains all expected ADR numbers.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-4.4 — ADR-0017 off-by-three line reference corrected

**Observable boundary:**
- `docs/chester/plans/20260511-01-mp-redesign-proof-system/design-documents/ADR-0017-existential-quantification-negation-semantics.md` References section line range for `Evaluator.js` matches the post-pass-3 line numbers of the negation branch in `matchBodyAtom`.

**Given:** ADR-0017 with the pre-existing off-by-three line reference and the post-pass-3 `Evaluator.js`.
**When:** execute-write produces the correction as part of pass-3's deliverables.
**Then:** the line range in ADR-0017's References section is accurate to the new line numbers (verifiable by reading the cited range in `Evaluator.js`).

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-4.5 — OQ-1 entry removed from engine-open-questions

**Observable boundary:**
- `docs/chester/plans/20260511-01-mp-redesign-proof-system/design-documents/engine-open-questions.md` no longer contains the OQ-1 entry.

**Given:** the engine-open-questions document at its pass-2-end state.
**When:** execute-write produces the removal as part of pass-3's deliverables.
**Then:** the document contains no OQ-1 section; it may be empty or it may contain only the document-header preamble.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-5.1 — Module boundary discipline enforced

**Observable boundary:**
- `DerivedPositionalIndex.js` exports a class whose public surface consists only of the constructor, `addFact`, and `bucketFor`.
- No lookup-discipline logic (bound-position identification, repeated-variable deferral, delta composition, smallest-set-driver, negation/positive routing) lives inside `DerivedPositionalIndex.js`.
- All lookup-discipline logic lives inside the in-engine `candidatesFor` helper in `Evaluator.js`.

**Given:** the pass-3 codebase at execute-write's completion.
**When:** a reviewer reads `DerivedPositionalIndex.js` and `Evaluator.js`.
**Then:** the module exposes only the three named entry points; the discipline logic is entirely outside the module.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

<!-- created-at: 2026-05-13T01:40:03Z -->
<!-- produced-by design-specify@v0003 -->
