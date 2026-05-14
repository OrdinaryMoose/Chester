# Session Summary: sprint-01-bug-fix-01 — Engine wildcard + Engine↔Domain shape adapter

**Date:** 2026-05-14
**Session type:** Two-fix bug repair, both surfaced by the calculator-proof stress test
**Origin:** Stress-test report at `docs/chester/working/stress-tests/calculator-proof/simulation-report.md` (findings #1 and #2)
**Branch / worktree:** `sprint-01-bug-fix-01` at `.worktrees/sprint-01-bug-fix-01/`
**Commits:**
- `84d363d` — fix(engine): treat '_' wildcard as match-anything in candidatesFor index lookup
- `cfe659c` — fix(domain): normalize engine shape — accept flat-API Engine + port-bundled fakes

## Goal

Close out the two non-deferred findings from the calculator-proof stress test before they hit downstream work:
1. **Critical** — Engine `Evaluator.candidatesFor` silently miscounted candidates when wildcards (`'_'`) appeared in rule body atoms, defeating every closure-policy and friction-policy rule.
2. **Important** — Engine has no port-bundled API; Domain bridge expects port bundles. Anyone wiring real Engine to Domain would crash on first port access. Sprint-03 (the Interface layer) sits above Domain and would still face this seam if left unresolved.

## What Was Completed

### Fix 1 — Engine wildcard handling (commit `84d363d`)

One conditional at `skills/design-large-task/engine/Evaluator.js:52`:

```js
// Before — '_' is pushed to boundPositions as if it were a constant
} else {
  boundPositions.push({ position: i, value: a }); // constant in pattern
}

// After — '_' is excluded; only real constants narrow the candidate set
} else if (a !== '_') {
  boundPositions.push({ position: i, value: a });
}
```

The Unifier (Unifier.js:30) already special-cased `'_'` correctly; the index-optimization layer (`candidatesFor`) did not. The two layers must agree on what counts as "match anything" — they now do.

**Regression coverage (4 new Engine tests):**
- `__tests__/candidates-for.test.js`: 2 unit cases on the index helper directly.
- `__tests__/evaluation.test.js`: 2 integration cases on the Engine API, including the exact closure-policy `unaddressed_concern` rule shape.

### Fix 2 — Domain engine-shape normalizer (commit `cfe659c`)

New file `skills/design-large-task/domain/engine-port-adapter.js` exports `normalizeEngine(engine)` that:
- Returns the engine unchanged if it's already port-bundled (detection: `engine.facts.assertFact` is a function). The substrate fake and any future port-bundled engine pass through.
- Wraps a flat-API Engine instance (detection: `engine.assertFact` is a function on the engine itself, no `engine.facts` sub-object) into the port-bundled form. The wrap function-binds each Engine method into the matching port slot.
- Throws a named error on any other shape, so a typo-introduced mis-wire fails at boot rather than deep in a transaction.

Wired into both `createDomainBridge` and `createDomainBridgeWith` at the very first step, before any port-bundle construction. Idempotent.

**Regression coverage (3 new Domain integration tests in `bridge-integration.test.js`):**
- `createDomainBridge accepts a flat-API Engine instance and normalizes it to port bundles`
- `createDomainBridge end-to-end against real Engine: boot, addElement, ratify, query, closure`
- `createDomainBridge throws a clear error on an engine shape that is neither port-bundled nor flat`

### Stress-test verification at integration level

Re-ran both calculator stress-test scenarios against the fixed Engine. Also added a third script `no-adapter-smoke.mjs` (gitignored, in `docs/chester/working/stress-tests/calculator-proof/`) proving that `createDomainBridge({engine: new Engine(), ...})` now works **without any manual adapter shim**.

| Scenario | Pre-fix behavior | Post-fix behavior |
|---|---|---|
| Wiring raw `new Engine()` to bridge | Required a 35-line manual `port-adapter.mjs` shim, or crashed on first port access | Works directly; `normalizeEngine` runs at boot |
| Happy-path proof (29 ops) | All ops succeeded; render showed only Givens section | All ops succeed; render now shows Givens + Lemmas + Theorems |
| Failure-path: unaddressed risk | Closure gate silently cleared; `presentClosingArgument` returned `{}` | Closure gate refuses: `CLOSURE_NOT_PERMITTED: Closure failed: risk_3` |
| `queryProof unaddressed_concern` | `[]` (false negative) | `[{C: 'risk_3'}]` ✓ |
| `queryProof closure_permitted` (failure scenario) | `[{}]` (false positive) | `[]` ✓ |

### Knock-on effect on stress-test Finding #4

The original stress-test report flagged `renderStructuredProof` as showing only the Givens section, with a note that it might be downstream of the wildcard bug. **Confirmed downstream**: after the Engine fix, Lemmas (propositions) and Theorems (resolutions) appear in the render. The renderer was rendering whatever derived state the Engine produced — the Engine just wasn't producing anything for approval-gated predicates because their rule templates used wildcards in body atoms.

## Verification Results

| Check | Result |
|-------|--------|
| Engine test suite pre-fix | 134/134 (baseline) |
| Engine test suite with new failing tests, pre-fix | 134 pass + 4 RED (intended TDD failure) |
| Engine test suite post-fix | **138/138 pass, 0 regressions** |
| Domain test suite pre-shape-fix | 81/81 (sprint-02 merge state) |
| Domain test suite post-shape-fix | **84/84 pass, 0 regressions** |
| Structural tests (port-discipline, bundle-construction, module-shape, etc.) | All green; new `engine-port-adapter.js` does not trip any check |
| Calculator stress test — happy path, raw Engine, no shim | 29/29 attempts succeed |
| Calculator stress test — failure path, raw Engine, no shim | `CLOSURE_NOT_PERMITTED: Closure failed: risk_3` thrown correctly |

## Known Remaining Items

Stress-test findings not in this fix:
- **Finding #3 (Important)** — `renderClosingArgument` bypasses the injected `IClock` and calls `Date.now()` directly. Already in sprint-02's `deferred-00.md` as T10 deferred item. Domain-layer fix, scoped to render purity per §10.6.
- **Finding #5 (withdrawn)** — Initial misread of severity-field handling; no actual bug.

The wildcard fix may also incidentally close other deferred items — worth re-evaluating sprint-02's `deferred-00.md` after this lands. In particular, the I-1 entry (`overlap_rule` self-pairing) was speculative pending Engine semantics confirmation; it now correctly fires against `definition_decl` records.

## Files Changed

**Engine (Fix 1):**
- `skills/design-large-task/engine/Evaluator.js` — one-line conditional addition + comment
- `skills/design-large-task/engine/__tests__/candidates-for.test.js` — 2 unit-level regression tests
- `skills/design-large-task/engine/__tests__/evaluation.test.js` — 2 integration-level regression tests

**Domain (Fix 2):**
- `skills/design-large-task/domain/engine-port-adapter.js` — new file (~60 LOC including docstring)
- `skills/design-large-task/domain/domain-bridge.js` — import + 2 normalizeEngine call sites (one in each factory)
- `skills/design-large-task/domain/__tests__/bridge-integration.test.js` — 3 new integration tests

**Stress-test artifacts (gitignored, in worktree):**
- `docs/chester/working/stress-tests/calculator-proof/{port-adapter,calculator-simulation,calculator-failure-simulation,minimal-repro-2}.mjs` — replicas of stress-test scripts
- `docs/chester/working/stress-tests/calculator-proof/no-adapter-smoke.mjs` — proof that raw Engine works without shim

## Commits

```
cfe659c fix(domain): normalize engine shape — accept flat-API Engine + port-bundled fakes
84d363d fix(engine): treat '_' wildcard as match-anything in candidatesFor index lookup
```

## Handoff Notes

- Both fixes are independent and could be cherry-picked separately if needed, but they were surfaced by the same stress-test run and ship together for coherence.
- **Sprint-03 is unblocked.** It can wire its Interface layer to the Domain bridge directly using `createDomainBridge({ engine: new Engine(), clock, ... })`. The Engine↔Domain seam is no longer a sprint-03 concern.
- The original 35-line `port-adapter.mjs` in `docs/chester/working/stress-tests/calculator-proof/` is now obsolete for sprint-03 purposes. It remains in the stress-test directory only as historical evidence of the gap that was closed.
- Recommend cherry-picking Fix 1 into any other branches that touch the Engine — the bug existed in all sprint-01 passes (pass-1 through pass-4 plus main pre-fix).
- The new structural shape — `normalizeEngine` as a Domain-side adapter — establishes a precedent: shape adapters between layers live at the consumer's boundary, isolated in their own file. Future seams (Domain↔Interface, Interface↔transport) can follow the same pattern.

## Why these bugs survived prior testing

**Fix 1 (wildcard):** Engine ships with 134 tests across 17 files; none exercise a rule with `'_'` in a body atom against facts whose position-value isn't literally `'_'`. Two common test patterns hid the bug: rules with named variables throughout (Unifier-correct path) and direct `engine.query` calls with wildcard arguments (Unifier-direct path, not Evaluator). Neither pattern routes through `candidatesFor`'s bound-position filter.

**Fix 2 (shape):** Domain tests use the in-memory substrate fake exclusively (sprint-02 was Domain-only and Engine wasn't a dependency). Sprint-01 tests use the Engine directly. The two layers were tested independently and the shape mismatch only appears when they're integrated — which is exactly what the calculator stress test did.

The new regression tests close both gaps:
- `candidatesFor` is unit-tested for wildcard input.
- `bridge-integration.test.js` now imports the real Engine and wires it through `createDomainBridge`, exercising the actual integration surface.

## Session Skill Versions

*(none — this was an ad-hoc bug fix, not produced through any Chester skill)*
