# Sprint-01-pass-4 Engine API Alignment — Spec Ground-Truth Report

**Subject:** `sprint-01-proof-backend-pass-4-spec-01.md`
**Reviewed against:** `skills/design-large-task/engine/` source code, pass-3 test baseline.
**Status:** Clean

---

## Verified claims

- `Engine.defineRule(rule)` 1-arg object signature — confirmed at `Engine.js:32`.
- `Engine.explain(predicate, args)` 2-arg signature — confirmed at `Engine.js:45`.
- `RuleStore.defineRule(rule)` internal signature is object-input — confirmed at `RuleStore.js:60`; `validateRule` shape requirements at lines 11-22.
- `Serializer.js` calls `engine.defineRule(r)` with old 1-arg form — confirmed at `Serializer.js:50`.
- `Serializer.js` emits `version: 1` — confirmed at `Serializer.js:25`.
- Three exempt test files have zero Engine-level `defineRule` callsites — confirmed. `DerivedPositionalIndex.test.js` and `candidates-for.test.js` have zero `defineRule` references at all. `operations.test.js` has 17 callsites but all are `rs.defineRule` on a RuleStore instance directly, not Engine.
- `failures.test.js:8` MALFORMED_RULE test with `head: 'bad', body: []` — confirmed at `failures.test.js:8`.
- `Unifier.js` handles `'_'` wildcard natively — confirmed at `Unifier.js:13,17,30`; `WILDCARD = '_'` constant; `isWildcard` function; integrated in unification loop.
- 107 baseline tests across 14 files — confirmed by `npx vitest run` from the sprint-1.5 worktree's engine package.

## Findings

None of material consequence.

## Minor observations

- `failures.test.js` raw `defineRule` grep returns 6 matches; spec says 5 distinct callsites. The discrepancy is the DUPLICATE_RULE_ID test calling `e.defineRule(r)` twice with the same literal at lines 40-41. Spec's "5" is the count of distinct rule definitions, which is the meaningful number for migration; not load-bearing.
- `explain.test.js` raw `explain(` grep returns 7; spec says 6. The variance is inline-repetition in the explain test; not load-bearing for migration scope.

## Risk assessment

All ten spec claims about current code state verified. The spec accurately describes the current `Engine.defineRule(rule)` and `Engine.explain(predicate, args)` signatures, the unchanged `RuleStore.defineRule` internal contract, the existing `'_'` wildcard handling, the `version: 1` literal, and the 107-test green baseline. The exempt-file claim is correctly nuanced — `operations.test.js` calls `defineRule` but only on `RuleStore` directly (zero Engine-level callsites as the spec states). No ground-truth risk to the plan. Spec is safe for plan-build.

<!-- created-at: 2026-05-13T21:47:59Z -->
<!-- produced-by design-specify@v0003 -->
