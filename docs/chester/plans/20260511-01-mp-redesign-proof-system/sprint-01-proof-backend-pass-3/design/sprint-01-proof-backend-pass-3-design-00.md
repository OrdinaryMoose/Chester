# Evaluator IDB Indexing — Design Brief

## Goal

Pass-3 closes the open architectural question (OQ-1) about the rule-firing engine's IDB indexing. Today the engine performs a full linear scan over the derived-facts collection per body atom per iteration of semi-naive evaluation, which scales nonlinearly on recursive transitive-closure workloads — the thousand-element stress test (AC-11.2) is currently skipped because it does not complete within the test budget. Pass-3 adds per-position lookup tables on the derived-facts side that mirror the base-facts side's existing positional index, intersects bound-position candidate sets to narrow lookup cost, and applies the same discipline on the base-facts side via the existing `factsMatching` method. Pass-3 also bundles two small documentation-cleanup items that pass-2 left deferred and ride naturally on this change. After pass-3 closes, the thousand-element stress test unskips and runs in under five seconds, the hundred-element termination test tightens back from fifteen to five seconds, and a new architectural decision record (ADR-0019 or the next available number) lands recording the indexing decision and superseding OQ-1.

## Prior Art

- **Pass-2's deferment doc D5 entry** is the architectural seed for pass-3. It contains the partial-attempt diary (the per-predicate-only index attempt that was implemented and reverted during pass-1 Task 15), the per-position fix sketch, and the full risk catalog.
- **The engine-tier open-questions document's OQ-1 entry** codifies the closure obligations and acceptance criteria pass-3 inherits.
- **The base-facts store's existing positional index** and its `factsMatching` lookup method are the model for the new derived-side index — they have been stable since pass-2 and remain untouched by pass-3.
- **The engine specification's internal-data-structures section** already gestures at by-position indexing on the derived side via the phrase "same shape as the fact store"; pass-3 promotes that gesture into an enforced contract.
- **The pass-3 framing-00 seed document** inside this sub-sprint records the full operator-level reasoning for why pass-3 uses `design-small-task` rather than `design-large-task`.

## Scope

**In scope:**
- Add a per-position lookup index on the derived-facts side of the rule-firing engine, mirroring the shape of the base-facts side's existing positional index.
- Update the body-atom matching step to perform bound-position intersection on both the base-facts side (via the existing lookup method) and the derived-facts side (via the new index).
- Maintain the new index correctly across rule firings within a single derivation run; the index is derive-local, never an instance field.
- Unskip the thousand-element transitive-closure stress test (AC-11.2) and tighten its budget from sixty seconds to five seconds.
- Tighten the hundred-element termination test budget back from fifteen seconds to five seconds.
- Add a new architectural decision record (ADR-0019 or the next available number) recording the indexing decision and superseding OQ-1 in the cascade.
- Amend the engine specification's internal-data-structures section (§5.3) to promote the implicit "same shape as the fact store" phrasing into an enforced statement that the derived side carries the same by-position lookup machinery, with a cross-reference to the new decision record.
- Bundled documentation cleanup: update the engine specification's front-matter `related_adrs` list to include the records added in pass-2 and the new pass-3 record; correct the off-by-three line reference in ADR-0017's references section to match the post-pass-3 code.
- Remove the OQ-1 entry from the engine-tier open-questions document.

**Out of scope:**
- Any change to the engine's evaluation algorithm beyond indexing — no magic sets, no hash joins, no algorithm-level rework. *Why:* pass-3's mandate is the focused indexing fix; algorithmic alternatives belong in a fresh `design-large-task` pass if motivated by future evidence.
- Any refactor of the base-facts store — pass-3 keeps two parallel positional-index implementations and defers consolidation to the audit task. *Why:* the two sides have meaningfully different requirements (durable mutable versus ephemeral grow-only), and the SOLID lens favors parallel implementations over a shared helper that would carry split responsibility.
- Any anticipatory work for sprint-02's Domain-layer workload. *Why:* the per-position approach is the right foundation regardless of what sprint-02 reveals; additional indexing mechanisms can be added later when motivated by real workload evidence.
- The four optional pass-2 carry-over items that are explicitly deferred: the rule-store unsafe-rule payload-deduplication fix (defers because pass-3 is not otherwise touching the rule-store) and the base-facts store's type-error message disambiguation between "not a number" and "non-finite number" (defers because pass-3 keeps the base-facts side untouched per the parallel-implementations call).
- Reorganization of the engine test suite or test-naming conventions. *Why:* pass-3 adds tests for its named integration risks but inherits the existing test structure as-is.
- Any change to the engine's public API surface. *Why:* the indexing change is internal-only and must not alter observable behavior beyond performance.

## Key Decisions

1. **Indexing contract home.** The indexing contract lives in the engine specification's internal-data-structures section (§5.3). The new architectural decision record carries the reasoning. *Alternative considered:* amending the fixed-point-evaluation section (§3.1) per the framing document's wording. *Why rejected:* §3.1 talks about meaning while §5.3 already gestures at the contract; the chosen home preserves the spec's semantics-versus-mechanics separation and makes the addition trivially small.

2. **Stacking rule as captured constraint, not placement venue.** The stacking rule between bound-position lookup and the existing delta restriction is captured as a constraint in this brief; placement of the discipline (decision record versus code comments) is `design-specify`'s call. *Alternative considered:* posing it as a "decision record versus code comments" venue choice during the design conversation. *Why rejected:* category slip — placement is a specification-formatting concern that belongs in `design-specify`, not design conversation.

3. **Parallel implementations, base-facts side untouched.** Pass-3 ships parallel positional-index implementations on the base-facts side and the derived-facts side; the base-facts side stays untouched. *Alternative considered:* extracting a shared by-position-lookup helper as part of pass-3. *Why rejected:* on SOLID grounds, a shared helper would carry two responsibilities (durable mutable vs. ephemeral grow-only), expose a `retract` method the derived side never uses (ISP violation), and risk a refused-bequest pattern if subclassed (LSP violation); on blast-radius grounds, it would expand pass-3 into a stable component for non-functional reasons. The audit task is the natural channel for any future consolidation.

4. **Carry-over scope.** Bundle the engine specification's front-matter `related_adrs` refresh and the off-by-three line reference correction in ADR-0017's references section; defer the rule-store unsafe-rule payload-deduplication fix and the base-facts store's type-error message disambiguation. *Why bundle the first two:* pass-3 is adding a new record to the cascade (not bundling the front-matter refresh would compound existing drift), and pass-3 rewrites the exact code that ADR-0017's reference points at (the reference must change anyway). *Why defer the other two:* both touch files outside pass-3's natural scope — the rule-store and the base-facts side — and the latter contradicts Decision 3.

5. **Stress test budget.** The thousand-element transitive-closure stress test (AC-11.2) budget moves from sixty seconds to five seconds. *Alternatives considered:* keeping sixty seconds (rejected as residue from the skipped state, which permits a roughly sixty-fold silent regression), and tightening further to two seconds (rejected as risking flake on slow continuous-integration runners). *Why five seconds:* mirrors the hundred-element termination test's tightened bound; sits comfortably above the predicted sub-one-second runtime; matches the existing ten-thousand-fact stress test's budget pattern.

6. **Test obligation discipline.** The brief mandates that every named integration risk be covered by at least one dedicated test; the implementer chooses test shape (unit, property, or other). *Alternatives considered:* mandating three specific unit tests (rejected as prescriptive of mechanics) and mandating no specific tests with the broader stress and canonical tests as the contract (rejected because the historical pattern in this codebase is that "optional targeted tests" become "never-added targeted tests" while the named risks are real silent-trap shapes).

## Constraints

- The new derived-side index must be derive-local — built inside a single derivation run, passed where needed, and discarded when the run finishes. It must not be an instance field on the rule-firing engine.
- Body-atom matching must intersect bound-position candidate sets on both the base-facts side and the derived-facts side; the existing predicate-bucket scan is the fallback when no positions are bound on a given atom.
- When iterating intersected sets, the implementation drives off the smallest set and tests membership in the others.
- When an atom is the delta-restricted atom on a non-first rule-firing pass: if it has bound positions, the candidate set is the intersection of the bound-position buckets with the delta set; if it has no bound positions, the candidate set is the delta set itself. The implementation must not fall back to the full predicate bucket in the second case.
- When an atom contains the same variable in two or more positions, the implementation defers the index lookup for those positions and lets the unification step handle equality.
- The negation branch's existential-quantification semantics (ADR-0017) must continue to hold under the new lookup path; the new code may use a "matching bucket non-empty" shortcut but must still verify consistency with current bindings.
- Each named integration risk — the delta-driver case (delta-restricted atom with no bound positions), the negation branch under the new lookup, and the repeated-variables case — must be covered by at least one dedicated test. Test shape is the implementer's call.
- The base-facts store's positional index implementation and the `factsMatching` method stay untouched; pass-3 consumes them as-is.
- The engine's public API surface and observable semantics (other than performance) must not change.

## Acceptance Criteria

1. The thousand-element transitive-closure stress test (AC-11.2) is unskipped, has its budget tightened from sixty seconds to five seconds, and passes.
2. The hundred-element termination test in the cross-cutting properties suite has its budget tightened from fifteen seconds to five seconds and passes.
3. All previously-passing tests (the eighty-seven test baseline from pass-2's close) continue to pass — no correctness regression.
4. The canonical negation tests (AC-9.1 through AC-9.4) continue to pass under the new lookup path.
5. A new architectural decision record is added at the next available number recording the indexing decision and explicitly superseding OQ-1 in the cascade.
6. The engine specification's internal-data-structures section (§5.3) is amended to promote the implicit "same shape as the fact store" phrasing into an explicit statement that the derived side carries the same by-position lookup machinery, with a cross-reference to the new decision record.
7. The engine specification's front-matter `related_adrs` list is updated to include the records added in pass-2 and the new pass-3 record.
8. ADR-0017's references section has its off-by-three line reference corrected to match the post-pass-3 code.
9. The OQ-1 entry is removed from the engine-tier open-questions document.
10. Each named integration risk — delta-driver, negation under new lookup, repeated variables — has at least one dedicated test in the engine test suite.

<!-- created-at: 2026-05-13T01:28:14Z -->
<!-- produced-by design-small-task@v0003 -->
