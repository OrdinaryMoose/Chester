# Session Summary: Engine Public API Alignment (Pass 4)

**Date:** 2026-05-13
**Session type:** Full-stack implementation (strangler-fig API migration)
**Plan:** `sprint-01-proof-backend-pass-4-plan-00.md`

## Goal

Bring the proof-engine's public API into literal compliance with `04-engine-spec.md` §4 by switching `Engine.defineRule(rule)` (1-arg object form) to `Engine.defineRule(ruleId, headAtom, bodyAtoms, metadata)` (4-arg tuple form), switching `Engine.explain(predicate, args)` (2-arg) to `Engine.explain(fact)` (1-arg tuple), and bumping the serialization schema to version 2 with tuple-form rule output. Internal modules (RuleStore, Unifier, Stratifier, Evaluator, Explain, Snapshot, FactStore) had to remain bitwise-identical (AC-10.1) — the public boundary changes only, with translation isolated to a new `RuleAtomTranslator` module.

## What Was Completed

### Production code

- **`RuleAtomTranslator.js`** (new, 95 lines) — single source of truth for tuple ↔ internal-object translation. Three exports: `tupleAtomToInternal`, `tupleRuleToInternal`, `internalRuleToTuple`. Used at two boundaries only: `Engine.js` (defineRule input direction) and `Serializer.js` (serialize output direction + load input direction).
- **`Engine.js`** — `defineRule` switched to 4-arg tuple form; `explain` switched to 1-arg tuple form with `Array.isArray`/length-2 guard returning `null` for malformed input. Translator import added; `explainFact` import preserved.
- **`Serializer.js`** — `serializeEngine` now emits `{ version: 2, ... }` with rules mapped through `internalRuleToTuple`. `loadEngineFrom` runs version check **before** shape validation (corrected during execute-write quality review — see Task 3 fix) so any non-v2 blob receives the structured `actualVersion` payload required by AC-5.3. Replay loop calls 4-arg `defineRule` with `r.metadata ?? {}` default.

### Tests

- **`RuleAtomTranslator.test.js`** (new, 17 tests) — covers both directions, negation wrapper unwrap/wrap, malformed-input paths, head-omits-negated invariant, round-trip identity.
- **`engine-public-api.test.js`** (new, 5 tests) — 4 anchor tests for the new `defineRule`/`explain` contract + 1 AC-8.2 helper-deletion test added in Task 6.
- **`serializer-version.test.js`** (new, 5 tests) — 4 original anchor tests + 1 regression test added during Task 3 fix that uses a realistic v1 blob (non-empty rules in old `head`/`body` field-name shape) to lock in the version-check precedence.
- **`failures.test.js`** — 5 rule-definition callsites migrated directly to tuple form (failure tests bypass the helper per AC-8.0 because the helper's `atomToTuple` would crash on intentionally-malformed input before reaching the public API where the error is expected to fire). Removed unused `V` import.
- **9 test files** (snapshot, properties, explain, lifecycle, query, stress, transactions, evaluator-indexing, evaluation) migrated through a temporary `defineRuleObj` helper in Task 5, then converted to direct tuple form in Task 6 when the helper was deleted. Files also touched in this sequence:
  - `explain.test.js` — 7 `explain()` callsites converted from `(pred, [args])` to `([pred, [args]])` form.
  - `lifecycle.test.js` — 2 hardcoded `version: 1` serializer blobs flipped to `version: 2` (one pure version literal, one AC-7.3 tampered-payload that preserves the NaN/TYPE_ERROR trigger).
  - `transactions.test.js` — 1 `version: 1` blob flipped to `version: 2` at line 166 (AC-8.7); 1 `version: 1` blob retained at line 107 (`NESTED_TRANSACTION_OP_REFUSED` fires before the version check) with an inline annotation comment added in Task 6 explaining why.
  - `evaluation.test.js` and `evaluator-indexing.test.js` — RuleStore-level `rs.defineRule({...})` calls left object-form with `// RuleStore-level: object form intentional` annotations.
- **Migration helper `__tests__/helpers/defineRuleObj.js`** — created in Task 4 as scaffolding for the per-file commit boundaries in Task 5, deleted in Task 6. AC-8.2 test enforces its absence.

### Notable engineering judgment during execution

- **Task 3 fix (Important quality finding).** Quality review on Task 3 flagged that the plan's prescribed `version !== 2` check sat *after* `isValidSerialized`. Because `isValidSerialized` requires `headAtom`/`bodyAtoms` arrays, a real v1 blob (with `head`/`body` internal-object field names) would fail the shape check first and throw a generic `MALFORMED_SERIALIZED_INPUT` without `actualVersion`. Fix moved the version check earlier with a defensive `serialized && typeof serialized === 'object'` guard; added a regression test using a realistic v1 blob shape. Committed as `fix(engine): version check precedes shape check in Serializer.loadEngineFrom` (`254b3d3`).
- **Task 6 annotation fold-in.** Two Minor findings from Task 5's quality review (no inline explanation of the `version: 1` retention in `transactions.test.js`; no RuleStore-level annotation comments in `evaluator-indexing.test.js` matching `evaluation.test.js`'s pattern) were folded into the Task 6 cleanup dispatch rather than deferred, since Task 6 was already sweeping the same files.
- **Plan miscount handling.** Implementer found 4 Engine-level callsites in `lifecycle.test.js` (plan said 3) and 16 mixed callsites in `evaluation.test.js` (plan said "14 mixed"). All Engine-level calls were correctly migrated regardless of plan's stated count; the discrepancies are plan-arithmetic errors, not implementer drift.
- **`evaluation.test.js` `applyRule` lambda.** The pre-migration "insertion-order independence" test shared a single rule literal across two engines. The new positional-args API doesn't bundle as ergonomically, so the Task 6 implementer introduced a small `applyRule` lambda — semantically identical (same rule, same two engines, opposite insertion orders, same final assertion).

## Verification Results

| Check | Result |
|-------|--------|
| `npx vitest run` (engine dir) | 17 files / 134 tests / 0 failing |
| AC-8.2 helper-deletion test | Green |
| AC-10.1 internal-module diff vs main (7 files) | 0 diff lines each — RuleStore.js, Unifier.js, Stratifier.js, Evaluator.js, Explain.js, Snapshot.js, FactStore.js all bitwise-identical to main |
| `grep -rn "defineRuleObj\|explainTuple" __tests__/` | 1 match — only the AC-8.2 test's own path-string literal |
| `grep -rn "engine.defineRule(r)\|engine\.defineRule(\s*{" engine/` | 0 matches |
| Working tree | Clean |

## Files Changed

### Production (engine)
- `skills/design-large-task/engine/RuleAtomTranslator.js` — Create (new module)
- `skills/design-large-task/engine/Engine.js` — Modify (defineRule + explain signatures; translator import)
- `skills/design-large-task/engine/Serializer.js` — Modify (version 2; tuple-form output; version-precedence fix; translator import)

### Tests (engine)
- `__tests__/RuleAtomTranslator.test.js` — Create
- `__tests__/engine-public-api.test.js` — Create
- `__tests__/serializer-version.test.js` — Create
- `__tests__/failures.test.js` — Modify (direct tuple migration; V import removed)
- `__tests__/snapshot.test.js` — Modify (1 callsite)
- `__tests__/properties.test.js` — Modify (3 callsites)
- `__tests__/explain.test.js` — Modify (2 defineRule + 7 explain callsites)
- `__tests__/lifecycle.test.js` — Modify (4 callsites + 2 version blob flips)
- `__tests__/query.test.js` — Modify (3 callsites)
- `__tests__/stress.test.js` — Modify (4 callsites)
- `__tests__/transactions.test.js` — Modify (3 callsites + 1 version blob flip + 1 annotation comment)
- `__tests__/evaluator-indexing.test.js` — Modify (3 Engine-level + 3 RuleStore-level annotations)
- `__tests__/evaluation.test.js` — Modify (8 Engine-level migrations + 8 RuleStore-level intact)
- `__tests__/helpers/defineRuleObj.js` — Create (Task 4) then Delete (Task 6)

### Sprint artifacts (working)
- `plan/sprint-01-proof-backend-pass-4-deferred-00.md` — Create (deferred item from Task 2 quality review)

## Commits

```
30320da feat(engine): RuleAtomTranslator with tuple↔object translation
60c4966 feat(engine): defineRule + explain public signatures match spec §4.2 + §4.5
3fd7625 feat(engine): Serializer schema version 2 + tuple-form rule output
254b3d3 fix(engine): version check precedes shape check in Serializer.loadEngineFrom
5eb9cc1 test(engine): helper + direct migration of failure-mode tests
a5e28a1 test(engine): migrate snapshot to new defineRule signature via helper
c0c93ea test(engine): migrate properties to new defineRule signature via helper
5faad44 test(engine): migrate explain to new defineRule signature via helper
2f672b5 test(engine): migrate lifecycle to new defineRule signature via helper
dbdda91 test(engine): migrate query to new defineRule signature via helper
6921e05 test(engine): migrate stress to new defineRule signature via helper
d6c2afa test(engine): migrate transactions to new defineRule signature via helper
15da77c test(engine): migrate evaluator-indexing to new defineRule signature via helper
f1a22c1 test(engine): migrate evaluation to new defineRule signature via helper
b4c7fb3 test(engine): cleanup — remove migration helper; tests use direct tuple form
4dc323f checkpoint: execution complete
```

16 commits total: 4 feature commits (Tasks 1-3 + fix), 11 test commits (Task 4 + 9 Task-5 file migrations + Task 6 cleanup), 1 checkpoint.

## Known Remaining Items

### Deferred from this sprint

- **`Engine.explain` guard branch test coverage** (`plan/sprint-01-proof-backend-pass-4-deferred-00.md`). The malformed-input guard in `explain(fact)` returns `null` silently but has no test exercising the actual non-array or wrong-length path. The "returns null for absent facts" test passes a well-formed tuple. Adding a one-line case (`expect(e.explain('bad')).toBeNull()`) would lock in the guard's behavior against a future refactor that swapped silent-null for an error throw. Minor severity (confidence 82); deferred because it was out of Task 2's literal scope and the plan didn't include the case.

### Not in this sprint

- The plan and spec both anticipate this sprint as one slice of the broader master plan `20260511-01-mp-redesign-proof-system`. Sub-sprints 02 (proof layer) and 03 (presentation layer) remain pending per `master-plan.md`.

## Handoff Notes

- **The strangler-fig migration is complete and cleanly closed.** The temporary `helpers/defineRuleObj.js` helper served its purpose during Task 5's per-file commit boundaries (each commit produced a fully-green full suite, providing bisectability through the migration) and is now deleted. All test callsites use the new public API directly.
- **AC-10.1 holds strictly.** 7 internal engine modules show 0 diff lines vs main — the public-boundary change was fully contained at `Engine.js` + `Serializer.js` + the new `RuleAtomTranslator.js`. Any future regression check should validate this property continues to hold.
- **Serialization is a hard break, not a migration.** `version: 1` blobs are unconditionally rejected with `MALFORMED_SERIALIZED_INPUT` and `actualVersion: 1`. Any consumer of the engine's serialization output must re-serialize before consuming via the new loader. This was a deliberate design choice (no backward-compat path) consistent with ADR-tier decisions in the master plan.
- **Master Plan Mode is active.** All sprint artifacts live under `docs/chester/working/20260511-01-mp-redesign-proof-system/sprint-01-proof-backend-pass-4/`. `finish-archive-artifacts` will replicate the entire master working tree to `docs/chester/plans/20260511-01-mp-redesign-proof-system/` at sub-sprint merge.
- **Branch:** `sprint-01-proof-backend-pass-4`, worktree at `.worktrees/sprint-01-proof-backend-pass-4`. Ahead of main by 16 commits, clean tree.

## Session Skill Versions

*(populated by `chester-trailer-write harvest`; see `util-artifact-schema` `## Provenance Trailers`)*

<!-- produced-by design-small-task@v0003 -->
<!-- produced-by design-specify@v0003 -->
<!-- produced-by plan-build@v0001 -->
<!-- produced-by execute-write@v0004 -->
<!-- produced-by finish-write-records@v0003 -->
