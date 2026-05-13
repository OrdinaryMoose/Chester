# Session Summary: Close OQ-1 — Evaluator IDB Positional Indexing

**Date:** 2026-05-13
**Session type:** Full-stack implementation (design → spec → plan → execute), with an in-flight algorithmic extension
**Plan:** `sprint-01-proof-backend-pass-3-plan-01.md`

## Goal

Close the open architectural question OQ-1 — the rule-firing engine's full linear scan over derived facts on every body-atom match was producing nonlinear cost on recursive transitive-closure workloads (the thousand-element stress test AC-11.2 was `it.skip` because it hung). Add per-position lookup tables on the derived-facts side mirroring the existing base-facts positional index, restructure body-atom matching around a unified candidate-source helper, unskip AC-11.2 under a five-second budget, tighten the hundred-element termination test from fifteen seconds back to five seconds, land a new architectural decision record, and bundle two documentation cleanups (engine-spec front-matter refresh; ADR-0017 line-reference correction).

## What Was Completed

### Plan tasks (6/6)

- **Task 1.** Created `DerivedPositionalIndex.js` module with constructor + `addFact(predicate, args)` + `bucketFor(predicate, arity, position, value)` — three-method public surface, no other entry points (AC-5.1). Added 8 unit tests covering single/multi-fact bucketing, Set-semantics idempotence, three safe-miss paths, and arity-namespacing.
- **Task 2.** Added `candidatesFor` as a pure-function `export` from `Evaluator.js` (no `matchBodyAtom` change yet). Helper takes (atom, currentBindings, factStore, idbIndex, deltaFilter, derivedMap) and returns `Array<{ args, fk }>`. Handles all four candidate-source cases (no-bound/no-delta, no-bound/delta, bound/no-delta, bound/delta), repeated-variable deferral via seenVars, smallest-set-driver across position unions. 8 unit tests.
- **Task 3.** Wired `candidatesFor` into `matchBodyAtom`. Threaded `idbIndex` through `derive()` and `fireRule`. Paired the single existing `derived.set` site with `idbIndex.addFact`. Added test-only `setCandidateCountObserver(fn)` hook on the Evaluator class. Added 3 integration tests for the named integration risks (delta-driver, negation under new lookup, repeated variables).
- **Task 3 extensions (authorized during Task 4).** Two perf changes landed in Task 4's territory:
  - `candidatesFor` smallest-set-driver now considers both position-bucket totalSize AND deltaFilter size, choosing whichever is smallest; iterates the driver and checks membership in others (no Set copies).
  - `fireRule` reorders body-atom processing: when an atom is delta-restricted and is not body[0], `fireRule` processes that atom first and propagates bindings to remaining atoms via positional lookup. Drops asymptote from O(N³) to O(N²) on recursive transitive closure. Also lifted the delta `Set→Map` wrap from `matchBodyAtom` into `fireRule` so wrap cost is O(deltaSize) per atom rather than per binding.
- **Task 4.** Unskipped AC-11.2; changed its timeout from 60000 to 5000 ms. Tightened the 100-element termination test from `{ timeout: 20000 }` and `toBeLessThan(15000)` to both 5000. Removed the two D5-reference comment blocks.
- **Task 5.** Created `ADR/0019-evaluator-idb-positional-indexing.md` (Context, Information Used, Alternatives Considered, Decision, Rationale, Consequences, Confidence, Supersedes, References). Decision section records both the hybrid module + helper architecture and the fireRule delta-driven join. Explicitly supersedes OQ-1. Amended engine-spec §5.3 to enforce per-position derived-side indexing as a contract with derive-local lifecycle. Refreshed front-matter `related_adrs` from `[0002, 0007, 0009, 0013, 0014]` to `[0002, 0007, 0009, 0013, 0014, 0015, 0016, 0017, 0018, 0019]`.
- **Task 6.** Corrected ADR-0017's stale `Evaluator.js:23-43` line reference to the post-pass-3 range `153-167`. Removed the OQ-1 entry from `engine-open-questions.md` (file now contains only the preamble).

### Post-review fix

After the full-branch code review, ADR-0019's own `related_adrs` was extended from `[0002]` to `[0002, 0016, 0017]` to include the negation-contract and rule-safety records the body references.

## Verification Results

| Check | Result |
|-------|--------|
| Full engine suite | **107 passing, 0 skipped** (was 87 passing + 1 skipped pre-sprint) |
| AC-11.2 (1000-element transitive closure) | Unskipped; passes in ~2.6-2.9s against 5s budget |
| 100-element termination test | Passes in ~64-165ms against 5s budget |
| AC-9.1 through AC-9.4 (canonical negation) | All pass under new lookup path |
| AC-11.1, AC-11.3, AC-11.4 (other stress) | All pass |
| Spec fidelity review | Pass (Task 3 extensions noted as authorized deviation) |
| Adversarial spec review | 5 findings — all fixed before plan-build |
| Ground-truth review | Clean |
| Plan fidelity review | 3 iterations to Approved |
| Plan hardening (attack + smell) | Combined risk Moderate — both directed mitigations applied (AC-1.1 workload reshape, matchBodyAtom signature reduction from 9 to 7 params via closure-capture) |
| Per-task spec compliance reviews | 6/6 pass |
| Per-task code quality reviews | 6/6 pass (1 inline fix landed: `derivedMap.get` caching in candidatesFor step 7) |
| Full-branch code review | No Critical; 2 Important (1 fixed inline, 1 deferred as pre-existing); 5 Minor (deferred) |

## Known Remaining Items

Six deferred items captured in `plan/sprint-01-proof-backend-pass-3-deferred-00.md`:

- **D1 — EDB/IDB factKey collision not enforced as engine invariant.** Pre-existing concern, not pass-3-introduced. The engine relies on Datalog's implicit EDB/IDB predicate disjointness for join correctness, but neither the spec nor the engine enforces it. Audit task channel.
- **D2 — Body-reorder + negation lacks a targeted regression test.** Correctness argument holds under ADR-0016's safety check, but no test exercises the body shape `[positive_A, negated_B, positive_C_delta]` where the reorder moves the delta atom past a negated atom.
- **D3 — `candidatesFor` step 5 re-queries `derivedMap` for pure-base keys.** Inverted short-circuit micro-optimization.
- **D4 — `DerivedPositionalIndex.bucketFor` allocates `new Set()` on misses.** Hoisting a module-private `EMPTY_SET` would eliminate ~10⁵ allocations per AC-11.2 run.
- **D5 — AC-1.1 test's regression guard depends on implicit rule-iteration ordering.** Could anchor on `iterationStats` directly for robustness.
- **D6 — `engine-open-questions.md` is now a header-only stub.** Operator choice on end state (keep / remove / sentinel line).

## Files Changed

### Engine code (`skills/design-large-task/engine/`)

- Created: `DerivedPositionalIndex.js`
- Modified: `Evaluator.js` (new `candidatesFor` export; replaced `matchBodyAtom`; reordered `fireRule` body-atom processing; added `_candidateCountObserver` + setter; threaded `idbIndex` through `derive()`)

### Engine tests (`skills/design-large-task/engine/__tests__/`)

- Created: `DerivedPositionalIndex.test.js` (8 tests)
- Created: `candidates-for.test.js` (8 tests)
- Created: `evaluator-indexing.test.js` (3 tests: AC-1.1, AC-1.2, AC-1.3)
- Modified: `stress.test.js` (AC-11.2 unskipped, 60000→5000 ms; D5 comment block removed)
- Modified: `properties.test.js` (100-element termination test: 20000→5000 timeout, 15000→5000 bound; D5 comment block removed)

### Design-document cascade (`docs/chester/plans/20260511-01-mp-redesign-proof-system/design-documents/`)

- Created: `ADR/0019-evaluator-idb-positional-indexing.md`
- Modified: `04-engine-spec.md` (§5.3 amendment; front-matter `related_adrs` refresh)
- Modified: `ADR/0017-existential-quantification-negation-semantics.md` (line-reference correction)
- Modified: `engine-open-questions.md` (OQ-1 entry removed)

### Sprint artifacts (`docs/chester/working/20260511-01-mp-redesign-proof-system/sprint-01-proof-backend-pass-3/`)

- Created: `design/sprint-01-proof-backend-pass-3-design-00.md`
- Created: `spec/sprint-01-proof-backend-pass-3-spec-00.md` (initial)
- Created: `spec/sprint-01-proof-backend-pass-3-spec-01.md` (post-adversarial-review)
- Created: `spec/sprint-01-proof-backend-pass-3-spec-ground-truth-report-00.md`
- Created: `plan/sprint-01-proof-backend-pass-3-plan-00.md` (initial)
- Created: `plan/sprint-01-proof-backend-pass-3-plan-01.md` (post-review-loop, with in-place hardening mitigations)
- Created: `plan/sprint-01-proof-backend-pass-3-plan-threat-report-00.md`
- Created: `plan/sprint-01-proof-backend-pass-3-deferred-00.md`

## Commits

```
2f482a3 checkpoint: execution complete
11544fa docs(adr-0019): include ADR-0016 and ADR-0017 in related_adrs front-matter
4d48a8b docs(cascade): correct ADR-0017 line reference; remove closed OQ-1 entry
270fb45 docs(engine-spec): add ADR-0019 (IDB positional indexing); amend §5.3 and front-matter related_adrs
347f36c test(engine): unskip AC-11.2 and tighten 100-element termination budget to 5s
bde3afa perf(engine): delta-driven join in fireRule for recursive workloads
2168a32 perf(engine): drive candidatesFor off smallest of position-unions and delta to avoid O(N^3) on recursive joins
a26f0f7 feat(engine): wire candidatesFor into matchBodyAtom; add IDB index maintenance in derive()
4beee9e refactor(engine): cache derivedMap.get in candidatesFor step 7
8fa340e feat(engine): add candidatesFor helper as a pure function with unit tests
f43e149 feat(engine): add DerivedPositionalIndex module with unit tests
```

## Handoff Notes

- **OQ-1 is closed.** `engine-open-questions.md` no longer contains it; ADR-0019 supersedes it; the spec's §5.3 enforces the contract.
- **Performance gate met.** AC-11.2 passes in ~2.6s within the 5s budget. The fast path is delta-driven join when the delta-restricted atom is not body[0] — this means `fireRule` now reorders body-atom processing in those cases. Anyone reasoning about the engine's evaluation order should note the change (called out in ADR-0019's Negative Consequences).
- **Two parallel positional-index implementations** live in the engine: `FactStore._positionalIndex` (durable, mutable, supports retract) and `DerivedPositionalIndex` (ephemeral, grow-only, derive-local). Consolidation is deferred to the audit task — ADR-0019 records this as Medium confidence on the long-term consolidation question.
- **The 100-element termination test budget went from 15s back to 5s.** Previously loose because the engine couldn't meet it; now passes in ~64-165ms.
- **The threat report (`plan/sprint-01-proof-backend-pass-3-plan-threat-report-00.md`) captured Moderate risk before execution.** Both directed mitigations landed: AC-1.1 workload was reshaped to a 3-iteration recursive chain so the count assertion can distinguish delta-driver from full-bucket fallback; `matchBodyAtom`'s signature was reduced from 9 to 7 parameters via closure capture.
- **The plan-attack threat report's "real performance guard is AC-11.2 timing" assessment was load-bearing.** Tightening the budget surfaced an asymptotic gap (O(N³) in the originally-planned architecture) that neither the spec nor the framing-00 doc had anticipated. Adding the delta-driven join to `fireRule` was the unplanned-but-necessary closure.
- **Sprint-02 (Domain layer) will exercise this engine.** If sprint-02's workload shapes differ materially from chain transitive closure, the delta-driven-join heuristic may need revisiting — currently it always reorders when deltaAtomIndex > 0, regardless of whether that order is actually faster for the rule's specific shape.

## Session Skill Versions

*(populated by `chester-trailer-write harvest`; see `util-artifact-schema` `## Provenance Trailers`)*

<!-- produced-by design-small-task@v0003 -->
<!-- produced-by design-specify@v0003 -->
<!-- produced-by plan-build@v0004 -->
<!-- produced-by execute-write@v0004 -->
<!-- produced-by finish-write-records@v0003 -->
