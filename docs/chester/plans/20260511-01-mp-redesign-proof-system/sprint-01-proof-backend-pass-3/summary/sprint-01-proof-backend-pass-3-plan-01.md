# Plan: Evaluator IDB Indexing

**Sprint:** sprint-01-proof-backend-pass-3 (under master 20260511-01-mp-redesign-proof-system)
**Spec:** docs/chester/working/20260511-01-mp-redesign-proof-system/sprint-01-proof-backend-pass-3/spec/sprint-01-proof-backend-pass-3-spec-01.md
**Execution mode:** subagent

> **For agentic workers:** Use execute-write to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The `Execution mode` field selects which execute-write section runs — Section 2 (subagent-driven) is selected here.

**Revision note (-00 → -01, plus post-hardening in-place revisions):**

- Plan-reviewer found two issues in Task 2: Step 3's scaffold returned base-only for the no-bound/no-delta path while Step 4 expected base + derived; and the IMPORTANT note directed adding an `argsFor` method to `DerivedPositionalIndex` which violates AC-5.1's module-surface contract. Resolution: Task 2 now ships the final `candidatesFor` implementation (with the `derivedMap` sixth-parameter shape), so its tests pass on first run and `DerivedPositionalIndex`'s public surface stays at constructor + `addFact` + `bucketFor`. Task 3 reduced to wiring and maintenance only.
- Plan-reviewer iteration 2 caught: AC-1.1 test used `e.evaluator.setCandidateCountObserver(...)` but `Engine.js` does not expose its `Evaluator`. Resolution: AC-1.1 test now constructs `Evaluator` + `FactStore` + `RuleStore` directly to access the hook; `Engine.js` stays untouched.
- Post-hardening (combined plan-attack + plan-smell): applied two directed mitigations from the threat report. **Attack-2 (Medium):** AC-1.1's original workload had iter-2 delta size == full bucket size, so the count assertion could not distinguish delta-driver from full-scan fallback. Resolution: reshape the workload to a 3-iteration recursive chain (`q(X) :- p(X)` plus `q(Y) :- q(X), chain(X, Y)`) so iter-3's delta is meaningfully smaller than the full q-bucket. **Smell-1 (Moderate):** `matchBodyAtom` had a 9-parameter signature. Resolution: drop `candidateCountObserver`, `ruleId`, and `atomIndex` from `matchBodyAtom`'s signature; replace with a single `onCandidates(count)` callback that `fireRule` provides via closure capture. Signature drops from 9 params to 7.

## Goal

Close OQ-1 by adding a per-position lookup index on the derived-facts side of the rule-firing engine, restructuring `matchBodyAtom` to consume from a unified `candidatesFor` helper, unskipping the thousand-element transitive-closure stress test under a 5-second budget, tightening the hundred-element termination test back to 5 seconds, landing the new architectural decision record, and bundling two small documentation cleanups.

## Architecture

Hybrid — extracted `DerivedPositionalIndex` module (data structure + thin per-bucket primitive) plus in-engine `candidatesFor` helper (lookup discipline: bound-position identification, repeated-variable deferral, smallest-set-driver, delta composition, negation/positive routing). The new index is derive-local: constructed at the start of each `derive()` call, threaded through `fireRule` and `matchBodyAtom`, paired with every `derived.set` call, and discarded when `derive()` returns. The base-facts side stays untouched; pass-3 ships two parallel positional-index implementations.

## Tech Stack

- JavaScript (Node, ESM modules)
- Vitest (v3.x) for tests
- Engine code lives under `skills/design-large-task/engine/`
- Test command (run from `skills/design-large-task/engine/`): `npm test`
- Run a single test file: `npx vitest run __tests__/<file>.test.js`
- Run a single test by name: `npx vitest run -t '<test description substring>'`

---

## Task 1: Create `DerivedPositionalIndex` module with unit tests

**Type:** code-producing
**Implements:** AC-5.1
**Decision budget:** 1
**Must remain green:** `__tests__/DerivedPositionalIndex.test.js` plus the full baseline 87 tests (this task adds a new module; no existing files are modified, so the regression risk is only that the new test file itself stays green).

**Files:**
- Create: `skills/design-large-task/engine/DerivedPositionalIndex.js`
- Create: `skills/design-large-task/engine/__tests__/DerivedPositionalIndex.test.js`

**Context (read before starting):**
- `skills/design-large-task/engine/FactStore.js` lines 1-100 — the base-facts store's positional index is the model. Note especially the local `factKey = (args) => JSON.stringify(args)` at line 13 (this is FactStore-local; do NOT use it for the derived side).
- `skills/design-large-task/engine/utils.js` — exports `factKey(predicate, args)` which is the IDB factKey used by `Evaluator.js`'s `derived` Map; this is the function the new module will use to compute fact keys.

**Module surface contract (AC-5.1).** The module exports a single class. The class exposes exactly three public members: the constructor, `addFact(predicate, args)`, and `bucketFor(predicate, arity, position, value)`. No other public methods or properties. Internal helpers may exist but must be module-private.

**Steps (TDD):**

- [ ] **Step 1: Write the failing tests**

Create `skills/design-large-task/engine/__tests__/DerivedPositionalIndex.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { DerivedPositionalIndex } from '../DerivedPositionalIndex.js';
import { factKey } from '../utils.js';

describe('DerivedPositionalIndex', () => {
  it('addFact with single arity-1 fact populates one bucket', () => {
    const idx = new DerivedPositionalIndex();
    idx.addFact('p', ['a']);
    expect(idx.bucketFor('p', 1, 0, 'a')).toEqual(new Set([factKey('p', ['a'])]));
  });

  it('addFact with multiple facts populates correct buckets per position', () => {
    const idx = new DerivedPositionalIndex();
    idx.addFact('p', ['a', 'x']);
    idx.addFact('p', ['a', 'y']);
    idx.addFact('p', ['b', 'x']);
    expect(idx.bucketFor('p', 2, 0, 'a')).toEqual(new Set([factKey('p', ['a', 'x']), factKey('p', ['a', 'y'])]));
    expect(idx.bucketFor('p', 2, 0, 'b')).toEqual(new Set([factKey('p', ['b', 'x'])]));
    expect(idx.bucketFor('p', 2, 1, 'x')).toEqual(new Set([factKey('p', ['a', 'x']), factKey('p', ['b', 'x'])]));
    expect(idx.bucketFor('p', 2, 1, 'y')).toEqual(new Set([factKey('p', ['a', 'y'])]));
  });

  it('addFact is idempotent at the bucket level (Set semantics)', () => {
    const idx = new DerivedPositionalIndex();
    idx.addFact('p', ['a']);
    idx.addFact('p', ['a']);
    expect(idx.bucketFor('p', 1, 0, 'a').size).toBe(1);
  });

  it('bucketFor with no facts asserted returns an empty Set', () => {
    const idx = new DerivedPositionalIndex();
    expect(idx.bucketFor('p', 1, 0, 'a')).toEqual(new Set());
  });

  it('bucketFor with a value that has no bucket returns an empty Set', () => {
    const idx = new DerivedPositionalIndex();
    idx.addFact('p', ['a']);
    expect(idx.bucketFor('p', 1, 0, 'b')).toEqual(new Set());
  });

  it('bucketFor with a position out of range returns an empty Set', () => {
    const idx = new DerivedPositionalIndex();
    idx.addFact('p', ['a']);
    expect(idx.bucketFor('p', 1, 5, 'a')).toEqual(new Set());
  });

  it('bucketFor with an unknown predicate returns an empty Set', () => {
    const idx = new DerivedPositionalIndex();
    idx.addFact('p', ['a']);
    expect(idx.bucketFor('q', 1, 0, 'a')).toEqual(new Set());
  });

  it('different (predicate, arity) pairs are stored separately', () => {
    const idx = new DerivedPositionalIndex();
    idx.addFact('p', ['a']);
    idx.addFact('p', ['a', 'b']);
    expect(idx.bucketFor('p', 1, 0, 'a').size).toBe(1);
    expect(idx.bucketFor('p', 2, 0, 'a').size).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run from `skills/design-large-task/engine/`:

```bash
npx vitest run __tests__/DerivedPositionalIndex.test.js
```

Expected: FAIL — `DerivedPositionalIndex.js` does not exist; import errors.

- [ ] **Step 3: Write minimal implementation**

Create `skills/design-large-task/engine/DerivedPositionalIndex.js`:

```javascript
/**
 * DerivedPositionalIndex — per-position lookup tables for the derived (IDB) facts
 * inside a single Evaluator.derive() call. Mirrors the data-structure shape of
 * FactStore._positionalIndex but is grow-only (no retract) and derive-local.
 * See ADR-0019.
 *
 * Public surface (AC-5.1): constructor, addFact, bucketFor. Nothing else.
 */

import { factKey } from './utils.js';

const predKey = (predicate, arity) => `${predicate}/${arity}`;

export class DerivedPositionalIndex {
  constructor() {
    // Map<"predicate/arity", Array<Map<value, Set<factKey>>>>
    this._positions = new Map();
  }

  addFact(predicate, args) {
    const arity = args.length;
    const pk = predKey(predicate, arity);
    let positions = this._positions.get(pk);
    if (!positions) {
      positions = Array.from({ length: arity }, () => new Map());
      this._positions.set(pk, positions);
    }
    const fk = factKey(predicate, args);
    for (let i = 0; i < arity; i++) {
      let bucket = positions[i].get(args[i]);
      if (!bucket) { bucket = new Set(); positions[i].set(args[i], bucket); }
      bucket.add(fk);
    }
  }

  bucketFor(predicate, arity, position, value) {
    const positions = this._positions.get(predKey(predicate, arity));
    if (!positions || position < 0 || position >= positions.length) return new Set();
    const bucket = positions[position].get(value);
    return bucket || new Set();
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run from `skills/design-large-task/engine/`:

```bash
npx vitest run __tests__/DerivedPositionalIndex.test.js
```

Expected: PASS — all 8 tests green.

Also run the full suite to confirm no regression:

```bash
npm test
```

Expected: 87 passing + 1 skipped (pre-existing baseline) + 8 new = **95 passing, 1 skipped**.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/engine/DerivedPositionalIndex.js skills/design-large-task/engine/__tests__/DerivedPositionalIndex.test.js
git commit -m "feat(engine): add DerivedPositionalIndex module with unit tests"
```

---

## Task 2: Add `candidatesFor` helper as a pure function with unit tests

**Type:** code-producing
**Implements:** AC-1.1, AC-1.2, AC-1.3
**Decision budget:** 3 (bound-position identification including repeated-variable deduplication; smallest-set-driver mechanics; per-position union-then-intersection representation)
**Must remain green:** `__tests__/DerivedPositionalIndex.test.js`, new `__tests__/candidates-for.test.js`, plus the full baseline 87 tests (no consumer change yet — `matchBodyAtom` is not yet wired to the new helper).

**Files:**
- Modify: `skills/design-large-task/engine/Evaluator.js` (add module-scope `candidatesFor` export at the top; do NOT yet change `matchBodyAtom` — wiring is Task 3)
- Create: `skills/design-large-task/engine/__tests__/candidates-for.test.js`

**Context (read before starting):**
- `skills/design-large-task/engine/Evaluator.js` lines 1-66 — `matchBodyAtom` and the imports.
- `skills/design-large-task/engine/Unifier.js` — `unify(patternArgs, factArgs)` returns fresh bindings (Object) for a single atom-match, or `null` for no match. The helper does NOT call `unify`; consumers do.
- `skills/design-large-task/engine/FactStore.js` `factsMatching(predicate, arity, position, value)` returns `Array<args>` for facts matching that one position/value.
- The spec's Data Flow section §3 names the exact rules `candidatesFor` follows.

**Helper contract.** `candidatesFor(atom, currentBindings, factStore, idbIndex, deltaFilter, derivedMap)` returns `Array<{ args, fk }>` where each entry is a candidate that matched the helper's narrowing. Consumers iterate the array and run `unify(atom.args, args)` to extract bindings.

- `atom`: `{ predicate, arity, args, negated }` — body atom shape.
- `currentBindings`: `Object<varName, value>` — variable bindings already made by earlier body atoms in this rule firing.
- `factStore`: instance of `FactStore` — the base side.
- `idbIndex`: instance of `DerivedPositionalIndex` — the derived side.
- `deltaFilter`: `Map<factKey, args>` already pre-filtered to facts matching the atom's predicate/arity, or `null` (no delta restriction). The caller (`matchBodyAtom`) is responsible for performing the predicate/arity filter when wrapping the engine's internal `Set<factKey>` delta into the helper's `Map<factKey, args>` shape.
- `derivedMap`: `Map<factKey, { predicate, args, provenance }>` — the engine's `derived` IDB Map (passed in so the helper can resolve args for derived candidates without needing an `argsFor` method on `DerivedPositionalIndex`, preserving AC-5.1's module surface).

**Steps (TDD):**

- [ ] **Step 1: Write the failing tests**

Create `skills/design-large-task/engine/__tests__/candidates-for.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { candidatesFor } from '../Evaluator.js';
import { DerivedPositionalIndex } from '../DerivedPositionalIndex.js';
import { FactStore } from '../FactStore.js';
import { V } from '../Unifier.js';
import { factKey } from '../utils.js';

function setupBase(...facts) {
  const fs = new FactStore();
  for (const [pred, args] of facts) fs.assertFact(pred, args);
  return fs;
}

function setupIdb(...facts) {
  const idx = new DerivedPositionalIndex();
  for (const [pred, args] of facts) idx.addFact(pred, args);
  return idx;
}

function setupDerivedMap(...facts) {
  const m = new Map();
  for (const [pred, args] of facts) {
    m.set(factKey(pred, args), { predicate: pred, args, provenance: null });
  }
  return m;
}

describe('candidatesFor', () => {
  // First-iteration / nothing-bound case → full base ∪ derived for this predicate.
  it('with no bound positions and no delta, returns base + derived facts for the predicate', () => {
    const atom = { predicate: 'p', arity: 1, args: [V('X')], negated: false };
    const fs = setupBase(['p', ['a']], ['p', ['b']]);
    const idx = setupIdb(['p', ['c']]);
    const derivedMap = setupDerivedMap(['p', ['c']]);
    const out = candidatesFor(atom, {}, fs, idx, null, derivedMap);
    const argSets = out.map(c => c.args);
    expect(argSets).toEqual(expect.arrayContaining([['a'], ['b'], ['c']]));
    expect(out.length).toBe(3);
  });

  // Bound-position lookup (positive branch).
  it('with one bound position via constant in pattern, returns only matching facts from both sides', () => {
    const atom = { predicate: 'p', arity: 2, args: ['a', V('Y')], negated: false };
    const fs = setupBase(['p', ['a', 'x']], ['p', ['b', 'y']]);
    const idx = setupIdb(['p', ['a', 'z']], ['p', ['c', 'w']]);
    const derivedMap = setupDerivedMap(['p', ['a', 'z']], ['p', ['c', 'w']]);
    const out = candidatesFor(atom, {}, fs, idx, null, derivedMap);
    const argSets = out.map(c => c.args);
    expect(argSets).toEqual(expect.arrayContaining([['a', 'x'], ['a', 'z']]));
    expect(out.length).toBe(2);
  });

  it('with one bound position via current bindings, returns only matching facts', () => {
    const atom = { predicate: 'p', arity: 2, args: [V('X'), V('Y')], negated: false };
    const fs = setupBase(['p', ['a', 'x']], ['p', ['b', 'y']]);
    const idx = new DerivedPositionalIndex();
    const derivedMap = new Map();
    const out = candidatesFor(atom, { X: 'a' }, fs, idx, null, derivedMap);
    expect(out.map(c => c.args)).toEqual([['a', 'x']]);
  });

  // Multiple bound positions → intersection.
  it('with two bound positions, intersects across positions', () => {
    const atom = { predicate: 'p', arity: 2, args: ['a', 'x'], negated: false };
    const fs = setupBase(['p', ['a', 'x']], ['p', ['a', 'y']], ['p', ['b', 'x']]);
    const idx = new DerivedPositionalIndex();
    const derivedMap = new Map();
    const out = candidatesFor(atom, {}, fs, idx, null, derivedMap);
    expect(out.map(c => c.args)).toEqual([['a', 'x']]);
  });

  // Repeated variables → deferred to unify (helper uses first occurrence only).
  it('with the same variable in two positions, drives lookup off the first occurrence only', () => {
    const atom = { predicate: 'p', arity: 2, args: [V('X'), V('X')], negated: false };
    const fs = setupBase(['p', ['a', 'a']], ['p', ['a', 'b']], ['p', ['b', 'b']]);
    const idx = new DerivedPositionalIndex();
    const derivedMap = new Map();
    const out = candidatesFor(atom, { X: 'a' }, fs, idx, null, derivedMap);
    // First occurrence (position 0) binds to 'a'. The helper does NOT also require
    // position 1 === 'a' via index — unify checks that downstream. So all facts where
    // args[0] === 'a' are candidates.
    expect(out.map(c => c.args)).toEqual(expect.arrayContaining([['a', 'a'], ['a', 'b']]));
    expect(out.length).toBe(2);
  });

  // Delta-only case (delta-driver: no bound positions, deltaFilter non-null).
  it('with no bound positions and a non-null deltaFilter, returns only delta entries (pre-filtered by caller)', () => {
    const atom = { predicate: 'p', arity: 1, args: [V('X')], negated: false };
    const fs = setupBase(['p', ['a']]);
    const idx = setupIdb(['p', ['b']]);
    const derivedMap = setupDerivedMap(['p', ['b']]);
    // Caller pre-filters delta to entries matching atom's predicate/arity; here just p,['b'].
    const deltaFilter = new Map([[factKey('p', ['b']), ['b']]]);
    const out = candidatesFor(atom, {}, fs, idx, deltaFilter, derivedMap);
    // Delta-driver: candidate set = delta entries only. 'p',['a'] from base is NOT included.
    expect(out.map(c => c.fk)).toEqual([factKey('p', ['b'])]);
    expect(out.length).toBe(1);
  });

  // Bound positions + delta → intersection of both.
  it('with bound positions and delta, intersects bound-position union with delta', () => {
    const atom = { predicate: 'p', arity: 2, args: ['a', V('Y')], negated: false };
    const fs = setupBase(['p', ['a', 'x']]);
    const idx = setupIdb(['p', ['a', 'z']], ['p', ['a', 'w']]);
    const derivedMap = setupDerivedMap(['p', ['a', 'z']], ['p', ['a', 'w']]);
    const deltaFilter = new Map([[factKey('p', ['a', 'z']), ['a', 'z']]]);
    const out = candidatesFor(atom, {}, fs, idx, deltaFilter, derivedMap);
    // Bound-position union for position 0 value 'a': {fk-base-ax, fk-idb-az, fk-idb-aw}.
    // Intersected with delta {fk-idb-az}: just fk-idb-az.
    expect(out.map(c => c.fk)).toEqual([factKey('p', ['a', 'z'])]);
  });

  // Negation routing: helper invoked with deltaFilter = null even on delta-restricted iterations.
  it('with deltaFilter = null and bound positions, returns bound-position-narrowed full set (no delta restriction)', () => {
    const atom = { predicate: 'p', arity: 2, args: ['a', V('Y')], negated: true };
    const fs = setupBase(['p', ['a', 'x']]);
    const idx = setupIdb(['p', ['a', 'z']]);
    const derivedMap = setupDerivedMap(['p', ['a', 'z']]);
    const out = candidatesFor(atom, {}, fs, idx, null, derivedMap);
    expect(out.map(c => c.args)).toEqual(expect.arrayContaining([['a', 'x'], ['a', 'z']]));
    expect(out.length).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run from `skills/design-large-task/engine/`:

```bash
npx vitest run __tests__/candidates-for.test.js
```

Expected: FAIL — `candidatesFor` is not exported from `Evaluator.js`.

- [ ] **Step 3: Write the implementation**

Edit `skills/design-large-task/engine/Evaluator.js`. Add the helper as a module-scope `export` between line 7 (`import { factKey } from './utils.js';`) and the existing `substituteArgs` function at line 9. The body below is the FINAL implementation — no scaffold, no placeholder. Do NOT yet import `DerivedPositionalIndex` — that import lands in Task 3 when the class is actually instantiated.

```javascript
/**
 * candidatesFor — unified candidate-source helper for body-atom matching.
 *
 * Returns Array<{ args, fk }> of candidate facts (from both base and derived sides)
 * narrowed by:
 *   - bound-position intersection (positions where the atom has a constant in the
 *     pattern OR a variable already bound in currentBindings)
 *   - delta filter (when non-null, restricts to delta entries pre-filtered to this
 *     atom's predicate/arity by the caller)
 *
 * The helper does NOT call unify; consumers iterate the returned array and call
 * unify(atom.args, args) themselves to extract bindings.
 *
 * Repeated variables in the atom: only the first occurrence drives bucket lookup;
 * subsequent occurrences are deferred to the unification step.
 *
 * Negation handling: matchBodyAtom passes deltaFilter = null for negated atoms.
 *
 * Parameters:
 *   atom: { predicate, arity, args, negated }
 *   currentBindings: Object<varName, value>
 *   factStore: FactStore
 *   idbIndex: DerivedPositionalIndex
 *   deltaFilter: Map<factKey, args>  // pre-filtered to atom's predicate/arity; or null
 *   derivedMap: Map<factKey, { predicate, args, provenance }>  // the engine's `derived` IDB
 *
 * See spec §Data Flow for the four-case decision table.
 */
export function candidatesFor(atom, currentBindings, factStore, idbIndex, deltaFilter, derivedMap) {
  const { predicate, arity, args } = atom;

  // Step 1: identify bound positions (first occurrence per variable; repeated vars deferred).
  const seenVars = new Set();
  const boundPositions = []; // Array<{ position, value }>
  for (let i = 0; i < arity; i++) {
    const a = args[i];
    if (a && typeof a === 'object' && typeof a.var === 'string') {
      if (seenVars.has(a.var)) continue; // repeated var — defer to unify
      seenVars.add(a.var);
      if (a.var in currentBindings) {
        boundPositions.push({ position: i, value: currentBindings[a.var] });
      }
    } else {
      boundPositions.push({ position: i, value: a }); // constant in pattern
    }
  }

  // Step 2: no bound positions.
  if (boundPositions.length === 0) {
    if (deltaFilter !== null) {
      // Delta-driver case: caller pre-filtered delta to atom's predicate/arity.
      const out = [];
      for (const [fk, fArgs] of deltaFilter) out.push({ args: fArgs, fk });
      return out;
    }
    // No delta, no bound positions: full base ∪ derived for this predicate.
    const out = [];
    for (const bArgs of factStore.allFacts(predicate, arity)) {
      out.push({ args: bArgs, fk: factKey(predicate, bArgs) });
    }
    for (const fact of derivedMap.values()) {
      if (fact.predicate === predicate && fact.args.length === arity) {
        out.push({ args: fact.args, fk: factKey(predicate, fact.args) });
      }
    }
    return out;
  }

  // Step 3: bound positions exist. Compute per-position fact-key unions (base ∪ derived).
  const baseArgsByKey = new Map();
  const perPositionUnions = boundPositions.map(({ position, value }) => {
    const baseFacts = factStore.factsMatching(predicate, arity, position, value);
    for (const bArgs of baseFacts) baseArgsByKey.set(factKey(predicate, bArgs), bArgs);
    const baseKeys = new Set(baseFacts.map(bArgs => factKey(predicate, bArgs)));
    const derivedKeys = idbIndex.bucketFor(predicate, arity, position, value);
    const union = new Set(baseKeys);
    for (const k of derivedKeys) union.add(k);
    return union;
  });

  // Step 4: smallest-set-driver — pick smallest union as iteration driver.
  let driverIdx = 0;
  for (let i = 1; i < perPositionUnions.length; i++) {
    if (perPositionUnions[i].size < perPositionUnions[driverIdx].size) driverIdx = i;
  }
  const driverKeys = new Set(perPositionUnions[driverIdx]);

  // Step 5: intersect driver with other positions' unions.
  for (let i = 0; i < perPositionUnions.length; i++) {
    if (i === driverIdx) continue;
    for (const k of [...driverKeys]) {
      if (!perPositionUnions[i].has(k)) driverKeys.delete(k);
    }
  }

  // Step 6: intersect with delta when present.
  if (deltaFilter !== null) {
    for (const k of [...driverKeys]) {
      if (!deltaFilter.has(k)) driverKeys.delete(k);
    }
  }

  // Step 7: materialize args for each surviving key.
  const out = [];
  for (const k of driverKeys) {
    const fArgs = baseArgsByKey.get(k) || (derivedMap.get(k) && derivedMap.get(k).args);
    if (fArgs) out.push({ args: fArgs, fk: k });
  }
  return out;
}
```

Note: `candidatesFor` references the `DerivedPositionalIndex` type only via its `bucketFor` method on the `idbIndex` parameter — no `new DerivedPositionalIndex()` here. The import lands in Task 3 when `derive()` constructs the index.

- [ ] **Step 4: Run test to verify it passes**

Run from `skills/design-large-task/engine/`:

```bash
npx vitest run __tests__/candidates-for.test.js
```

Expected: PASS — all 8 candidates-for tests green.

Also run the full suite:

```bash
npm test
```

Expected: 87 baseline + 8 (Task 1) + 8 (this task) = **103 passing, 1 skipped**. The 87 baseline tests pass because `matchBodyAtom` is not yet wired to the new helper — its existing behavior is untouched.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/engine/Evaluator.js skills/design-large-task/engine/__tests__/candidates-for.test.js
git commit -m "feat(engine): add candidatesFor helper as a pure function with unit tests"
```

---

## Task 3: Wire `candidatesFor` into `matchBodyAtom` and add `idbIndex` maintenance in `derive()`

**Type:** code-producing
**Implements:** AC-1.1, AC-1.2, AC-1.3, AC-3.1, AC-5.1
**Decision budget:** 3 (where to construct idbIndex in derive, how to expose the per-atom candidate-iteration count for AC-1.1 test instrumentation, how to wrap the engine's internal `Set<factKey>` delta into the helper's `Map<factKey, args>` shape)
**Must remain green:** existing `__tests__/operations.test.js`, `architecture.test.js`, `query.test.js`, `snapshot.test.js`, `lifecycle.test.js`, `explain.test.js`, `failures.test.js`, `transactions.test.js`, `evaluation.test.js`, `properties.test.js`, `stress.test.js` (87 baseline tests), `DerivedPositionalIndex.test.js`, `candidates-for.test.js`, plus new `evaluator-indexing.test.js`.

**Files:**
- Modify: `skills/design-large-task/engine/Evaluator.js`
- Create: `skills/design-large-task/engine/__tests__/evaluator-indexing.test.js`

**Context (read before starting):**
- `skills/design-large-task/engine/Evaluator.js` — full file. Key sites at -01 spec line counts (pre-this-task):
  - Line 7: `import { factKey } from './utils.js'`
  - Lines 18-66: `matchBodyAtom`
  - Line 88-147: `derive()` method
  - Line 95: `let delta = null;`
  - Lines 102-126: `fireRule` closure
  - Line 107: `const filter = (deltaAtomIndex === i && !atom.negated) ? delta : null;`
  - Line 110: `next.push(...matchBodyAtom(atom, this.factStore, derived, b, filter));`
  - Line 119: `derived.set(fk, { ... });` (the single derived.set site)
  - Line 124: `newDelta.add(fk);`
- After Task 2, `candidatesFor` is exported but not yet consumed. The `DerivedPositionalIndex` import lands in Task 3 Step 3 Edit 2 (next to the existing imports), when `derive()` actually instantiates the class.

**Note on `delta` type.** The engine's internal `delta` stays as `Set<factKey>` for backward-compatibility with `iterationStats` and `newDelta`. Inside `matchBodyAtom`, before calling `candidatesFor`, the function wraps the relevant subset of `delta` into a `Map<factKey, args>` by looking up each fact key in `derived` and including only those whose `predicate` and `arity` match the atom. This wrapping is the responsibility of `matchBodyAtom`, not `candidatesFor`.

**Steps (TDD):**

- [ ] **Step 1: Write the failing tests** (integration tests for the three named risks)

Create `skills/design-large-task/engine/__tests__/evaluator-indexing.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { Engine } from '../Engine.js';
import { Evaluator } from '../Evaluator.js';
import { FactStore } from '../FactStore.js';
import { RuleStore } from '../RuleStore.js';
import { V } from '../Unifier.js';

describe('Evaluator IDB indexing — named integration risks', () => {

  // AC-1.1 — Delta-driver case: delta-restricted atom with no bound positions
  // uses the delta as the candidate set, not the full predicate bucket.
  //
  // Workload chosen so that the iteration-3 delta is meaningfully smaller than
  // the full q-bucket — required to distinguish delta-driver from a silent
  // fallback to the full predicate-bucket scan.
  //
  // Chain workload:
  //   base: p(a); chain(a, b); chain(b, c)
  //   r1:  q(X) :- p(X)               — derives q(a) in iter 1
  //   r3:  q(Y) :- q(X), chain(X, Y)  — derives q(b) in iter 1, q(c) in iter 2
  //   r2:  s(X) :- q(X)               — the watched rule (single-atom body, no bound positions)
  //
  // r2's candidate-count trajectory under the delta-driver contract:
  //   iter 1: r2 fires unrestricted; q-bucket holds q(a) (and q(b) if r3 ran before r2).
  //   iter 2: r2 fires with q delta-restricted to iter-1's delta (q(a), q(b)) — count 2.
  //   iter 3: r2 fires with q delta-restricted to iter-2's delta (just q(c)) — count 1.
  //
  // The full q-bucket at iter 3 contains q(a), q(b), q(c) — size 3. A regression that
  // fell back to the full-bucket scan would surface candidateCount 3 at iter 3.
  // Asserting that no r2 invocation reports count 3 catches that regression.
  //
  // Bypasses Engine because Engine.js owns its Evaluator as a transient local inside
  // `derive()` and does NOT expose it (per the spec's "no public API change" non-goal).
  it('AC-1.1: delta-driver case iterates only delta members matching predicate/arity', () => {
    const factStore = new FactStore();
    const ruleStore = new RuleStore();
    factStore.assertFact('p', ['a']);
    factStore.assertFact('chain', ['a', 'b']);
    factStore.assertFact('chain', ['b', 'c']);
    ruleStore.defineRule({
      ruleId: 'r1',
      head: { predicate: 'q', arity: 1, args: [V('X')] },
      body: [{ predicate: 'p', arity: 1, args: [V('X')], negated: false }]
    });
    ruleStore.defineRule({
      ruleId: 'r3',
      head: { predicate: 'q', arity: 1, args: [V('Y')] },
      body: [
        { predicate: 'q', arity: 1, args: [V('X')], negated: false },
        { predicate: 'chain', arity: 2, args: [V('X'), V('Y')], negated: false }
      ]
    });
    ruleStore.defineRule({
      ruleId: 'r2',
      head: { predicate: 's', arity: 1, args: [V('Z')] },
      body: [{ predicate: 'q', arity: 1, args: [V('Z')], negated: false }]
    });

    const evaluator = new Evaluator(factStore, ruleStore);
    const counts = [];
    evaluator.setCandidateCountObserver((ruleId, atomIndex, candidateCount) => {
      counts.push({ ruleId, atomIndex, candidateCount });
    });

    const derived = evaluator.derive();

    // Sanity: q(a), q(b), q(c) and s(a), s(b), s(c) all derived.
    const qFacts = [...derived.values()].filter(f => f.predicate === 'q');
    const sFacts = [...derived.values()].filter(f => f.predicate === 's');
    expect(qFacts.length).toBe(3);
    expect(sFacts.length).toBe(3);

    // r2 has a single body atom (q, no bound positions). Inspect every r2 candidate-count
    // observation. The delta-driver contract forbids ever seeing the full q-bucket size (3)
    // as a candidate count for r2 — every delta-restricted firing must use the iteration-
    // specific delta, which is at most size 2 across the run, and at iter 3 is exactly size 1.
    const r2Counts = counts.filter(c => c.ruleId === 'r2' && c.atomIndex === 0);

    // Iter-3 delta-driver assertion: at least one r2 invocation must report count 1 (iter-3 delta).
    expect(r2Counts.some(c => c.candidateCount === 1)).toBe(true);

    // Regression guard: no r2 invocation may report count 3. A fallback to the full q-bucket
    // at iter 3 (when delta-q has just q(c)) would surface count 3 and fail this assertion.
    expect(r2Counts.every(c => c.candidateCount !== 3)).toBe(true);
  });

  // AC-1.2 — Negation under new lookup preserves existential semantics.
  // Reuses AC-9.4 pattern: leaf(X) :- node(X), ¬ancestor(X, Y).
  it('AC-1.2: negation branch with mixed bound/unbound vars works under new lookup', () => {
    const e = new Engine();
    e.assertFact('node', ['a']);
    e.assertFact('node', ['c']);
    e.assertFact('parent', ['a', 'b']);
    e.defineRule({
      ruleId: 'anc',
      head: { predicate: 'ancestor', arity: 2, args: [V('X'), V('Y')] },
      body: [{ predicate: 'parent', arity: 2, args: [V('X'), V('Y')], negated: false }]
    });
    e.defineRule({
      ruleId: 'leaf',
      head: { predicate: 'leaf', arity: 1, args: [V('X')] },
      body: [
        { predicate: 'node', arity: 1, args: [V('X')], negated: false },
        { predicate: 'ancestor', arity: 2, args: [V('X'), V('Y')], negated: true }
      ]
    });
    e.derive();
    // a has an ancestor → leaf(a) NOT derived.
    expect(e.exists(['leaf', ['a']])).toBe(false);
    // c has no ancestor → leaf(c) IS derived.
    expect(e.exists(['leaf', ['c']])).toBe(true);
  });

  // AC-1.3 — Repeated variables defer to unification.
  it('AC-1.3: repeated variables in body atom yield only matching pairs', () => {
    const e = new Engine();
    e.assertFact('p', ['a', 'a']);
    e.assertFact('p', ['a', 'b']);
    e.assertFact('p', ['b', 'b']);
    e.assertFact('p', ['c', 'd']);
    e.defineRule({
      ruleId: 'r',
      head: { predicate: 'same', arity: 1, args: [V('X')] },
      body: [{ predicate: 'p', arity: 2, args: [V('X'), V('X')], negated: false }]
    });
    e.derive();
    expect(e.exists(['same', ['a']])).toBe(true);
    expect(e.exists(['same', ['b']])).toBe(true);
    expect(e.exists(['same', ['c']])).toBe(false);
    expect(e.exists(['same', ['d']])).toBe(false);
    expect(e.count(['same', [V('X')]])).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run from `skills/design-large-task/engine/`:

```bash
npx vitest run __tests__/evaluator-indexing.test.js
```

Expected: FAIL — `setCandidateCountObserver` does not exist on the Evaluator; `matchBodyAtom` doesn't use the new helper yet; AC-1.1 throws on the `setCandidateCountObserver` call.

- [ ] **Step 3: Write the implementation**

Apply three edits to `skills/design-large-task/engine/Evaluator.js`:

**Edit 1: Replace the existing `matchBodyAtom` function** (current lines 18-66) with a version that consumes `candidatesFor`, wraps the engine's `Set<factKey>` delta into the helper's `Map<factKey, args>` shape, and accepts an optional `onCandidates(count)` callback that the caller (fireRule) supplies via closure capture. The callback parameter keeps the observation wiring out of the signature noise (no `ruleId` / `atomIndex` parameters — those are captured by the closure the caller passes in):

```javascript
function matchBodyAtom(atom, factStore, idbIndex, derivedMap, currentBindings, deltaFilter, onCandidates) {
  const arity = atom.arity;

  // Wrap deltaFilter (Set<factKey>) into Map<factKey, args>, pre-filtered to atom's predicate/arity.
  let deltaMap = null;
  if (deltaFilter !== null) {
    deltaMap = new Map();
    for (const fk of deltaFilter) {
      const fact = derivedMap.get(fk);
      if (fact && fact.predicate === atom.predicate && fact.args.length === arity) {
        deltaMap.set(fk, fact.args);
      }
    }
  }

  const candidates = candidatesFor(atom, currentBindings, factStore, idbIndex, deltaMap, derivedMap);

  if (onCandidates) onCandidates(candidates.length);

  if (atom.negated) {
    // ADR-0017: unbound atom vars are existentially quantified.
    // candidatesFor returned the bound-position-narrowed candidate set (caller passed deltaMap = null
    // for negation; see fireRule). isConsistent verifies consistency with currentBindings.
    const isConsistent = (factArgs) => {
      const fresh = unify(atom.args, factArgs);
      if (fresh === null) return false;
      for (const [k, v] of Object.entries(fresh)) {
        if (k in currentBindings && currentBindings[k] !== v) return false;
      }
      return true;
    };
    const hasMatch = candidates.some(c => isConsistent(c.args));
    return hasMatch ? [] : [{ ...currentBindings }];
  }

  const out = [];
  for (const c of candidates) {
    const fresh = unify(atom.args, c.args);
    if (fresh === null) continue;
    const merged = { ...currentBindings };
    let consistent = true;
    for (const [k, v] of Object.entries(fresh)) {
      if (k in merged && merged[k] !== v) { consistent = false; break; }
      merged[k] = v;
    }
    if (consistent) out.push(merged);
  }
  return out;
}
```

**Edit 2: Modify `derive()`** to construct `idbIndex`, thread it through `fireRule`, and pair `derived.set` with `idbIndex.addFact`.

First, add the import at the top of `Evaluator.js` next to the existing imports:

```javascript
import { DerivedPositionalIndex } from './DerivedPositionalIndex.js';
```

Then, inside `derive()`, after the existing `const derived = new Map();` line, add:

```javascript
const idbIndex = new DerivedPositionalIndex();
```

In `fireRule`, change the `matchBodyAtom` call from:

```javascript
next.push(...matchBodyAtom(atom, this.factStore, derived, b, filter));
```

to:

```javascript
const onCandidates = this._candidateCountObserver
  ? (count) => this._candidateCountObserver(rule.ruleId, i, count)
  : null;
next.push(...matchBodyAtom(atom, this.factStore, idbIndex, derived, b, filter, onCandidates));
```

The closure captures `rule.ruleId` and the body-atom index `i` from `fireRule`'s scope. This keeps `matchBodyAtom`'s signature at seven parameters (atom + four data sources + delta filter + optional observation callback) and concentrates the observation wiring at the call site.

After the existing `derived.set(fk, { ... })` statement (current line 119-123), add:

```javascript
idbIndex.addFact(rule.head.predicate, headArgs);
```

**Edit 3: Add the test-only candidate-count observer hook** to the `Evaluator` class. In the constructor, after the existing `this.iterationStats = [];`:

```javascript
this._candidateCountObserver = null;
```

Add the setter method on the class:

```javascript
setCandidateCountObserver(fn) {
  this._candidateCountObserver = fn;
}
```

The line that computes `filter` (today: `const filter = (deltaAtomIndex === i && !atom.negated) ? delta : null;`) already passes `null` for negated atoms — the negation-branch invariant holds without change.

- [ ] **Step 4: Run tests**

Run from `skills/design-large-task/engine/`:

```bash
npm test
```

Expected: 87 baseline + 8 Task 1 + 8 Task 2 + 3 new = **106 passing, 1 skipped**.

If AC-9.1 through AC-9.4 (existing canonical negation tests in `evaluation.test.js`) fail, the negation routing is wrong — re-examine the `if (atom.negated)` branch and confirm the delta wrap correctly returns `null` for negated atoms (the existing `filter` computation at line 107 should handle this).

If `properties.test.js` 100-element termination test passes much faster than its current 15s bound (closer to 1s or below), that's the expected signal — the indexing works. Task 4 will tighten the bound to 5s.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/engine/Evaluator.js skills/design-large-task/engine/__tests__/evaluator-indexing.test.js
git commit -m "feat(engine): wire candidatesFor into matchBodyAtom; add IDB index maintenance in derive()"
```

---

## Task 4: Unskip AC-11.2 and tighten the 100-element termination test budget

**Type:** code-producing
**Implements:** AC-2.1, AC-2.2
**Decision budget:** 0
**Must remain green:** all 87 baseline tests, Task 1's `DerivedPositionalIndex.test.js`, Task 2's `candidates-for.test.js`, Task 3's `evaluator-indexing.test.js`, plus AC-11.2 (now unskipped) and the tightened termination test.

**Files:**
- Modify: `skills/design-large-task/engine/__tests__/stress.test.js`
- Modify: `skills/design-large-task/engine/__tests__/properties.test.js`

**Steps (TDD note):** This task changes test budgets; the failing-first step is the new tighter budget producing PASS (since Task 3 made the engine fast enough).

- [ ] **Step 1: Apply the changes**

Preflight — confirm exact line numbers before editing (line numbers below are accurate at pass-2 close; verify they have not drifted):

```bash
grep -n "it.skip\|AC-11.2\|Skipped pending D5\|60000" skills/design-large-task/engine/__tests__/stress.test.js
grep -n "timeout: 20000\|toBeLessThan(15000)\|15s bound" skills/design-large-task/engine/__tests__/properties.test.js
```

Expected output (illustrative; verify against actual):
- `stress.test.js`: `25:` D5 comment start, `30: it.skip(...)`, `48: }, 60000);`
- `properties.test.js`: `26:` `{ timeout: 20000 }` arg, `47:` 15s comment start, `50: expect(elapsed).toBeLessThan(15000);`

Then apply the edits using the actual line numbers (if they have drifted, adjust):

In `__tests__/stress.test.js`:
- Remove the comment block starting with `// Skipped pending D5 closure ...` and ending with `... see plan/sprint-01-proof-backend-deferred-00.md (D5).` (the four-line block immediately preceding the test).
- Change `it.skip('AC-11.2: ...` to `it('AC-11.2: ...`.
- Change `, 60000)` at the end of the test definition to `, 5000)`.

In `__tests__/properties.test.js`:
- Change `{ timeout: 20000 }` to `{ timeout: 5000 }`.
- Remove the three-line comment block starting with `// 15s bound while the Evaluator's IDB lacks a per-position index.` (immediately preceding the `expect(elapsed)` line).
- Change `expect(elapsed).toBeLessThan(15000);` to `expect(elapsed).toBeLessThan(5000);`.

- [ ] **Step 2: Run the tests**

From `skills/design-large-task/engine/`:

```bash
npx vitest run __tests__/stress.test.js __tests__/properties.test.js
```

Expected:
- `stress.test.js`: 4 passing (AC-11.1, AC-11.2 now unskipped, AC-11.3, AC-11.4); no skipped.
- `properties.test.js`: 3 passing; the 100-element termination test passes well under 5000ms.

If AC-11.2 exceeds 5000ms: this signals the per-position index is not actually narrowing the recursive lookup. Inspect `candidatesFor`'s bound-position path with two bound positions (Z bound on each recursive iteration of `ancestor(Z, Y)`).

If the 100-element termination test exceeds 5000ms: same root cause; the index is not delivering the expected speedup on the smaller workload either.

- [ ] **Step 3: Run the full suite**

```bash
npm test
```

Expected: **106 + 1 (AC-11.2 unskipped) = 107 passing, 0 skipped**.

- [ ] **Step 4: Commit**

```bash
git add skills/design-large-task/engine/__tests__/stress.test.js skills/design-large-task/engine/__tests__/properties.test.js
git commit -m "test(engine): unskip AC-11.2 and tighten 100-element termination budget to 5s"
```

---

## Task 5: Add ADR-0019 + amend engine spec §5.3 + refresh front-matter `related_adrs`

**Type:** docs-producing
**Implements:** AC-4.1, AC-4.2, AC-4.3
**Decision budget:** 2 (ADR number assignment, exact §5.3 wording)
**Must remain green:** N/A (docs-only); the full 107 test baseline must continue to pass (it should, since this task touches no code).

**Files:**
- Create: `docs/chester/plans/20260511-01-mp-redesign-proof-system/design-documents/ADR/0019-evaluator-idb-positional-indexing.md`
- Modify: `docs/chester/plans/20260511-01-mp-redesign-proof-system/design-documents/04-engine-spec.md` (§5.3 amendment + front-matter `related_adrs`)

**Context (read before starting):**
- Confirm the next available ADR number by listing `docs/chester/plans/20260511-01-mp-redesign-proof-system/design-documents/ADR/`. Expected: 0019. If something else has claimed 0019 in the meantime, use the next available number and adjust the filename + cross-references accordingly.
- Read `docs/chester/plans/20260511-01-mp-redesign-proof-system/design-documents/ADR/0015-finite-constant-constraint.md` and `0016-canonical-rule-safety-check.md` for the established ADR template (Context, Information Used, Alternatives Considered, Decision, Rationale, Consequences, Confidence).
- Read `04-engine-spec.md` §5.3 (lines 160-164) and the front-matter (line 5).

**Steps:**

- [ ] **Step 1: Create ADR-0019**

Create `docs/chester/plans/20260511-01-mp-redesign-proof-system/design-documents/ADR/0019-evaluator-idb-positional-indexing.md` using the existing ADR template (read 0015 or 0016 as the model). Required content:

- **Context** — the Evaluator's `matchBodyAtom` performed a full linear scan over `derived.values()` per body atom per iteration, scaling nonlinearly on recursive transitive-closure workloads. AC-11.2 (1000-element transitive closure) was `it.skip` because of this. OQ-1 in `engine-open-questions.md` codified the closure obligations.
- **Information Used** — sprint-01 D5 deferment entry; OQ-1 entry; pass-3 design brief and spec; the four-architecture comparison in design-specify (Architect A, Architect B, hybrid).
- **Alternatives Considered** —
  - Keep linear scan with `it.skip` (rejected — fails closure).
  - Per-predicate index only (rejected — already attempted in pass-1 Task 15 and reverted; provides zero discrimination on recursive workloads).
  - Per-position index, extracted module + minimal-edit branches (Architect A — viable; gives up consolidation of stacking discipline).
  - Per-position index, inline helpers + restructured pipeline (Architect B — viable; couples data structure and discipline).
  - **Per-position index, extracted module + in-engine unified helper (hybrid, chosen).**
  - Magic sets / hash join (out of scope; would require fresh design-large-task pass).
- **Decision** — adopt the hybrid: extracted `DerivedPositionalIndex` module owns the data structure and a thin `bucketFor` primitive; in-engine `candidatesFor` helper owns the lookup discipline (bound-position identification, repeated-variable deferral, smallest-set-driver, delta composition, negation/positive routing). The new index is derive-local: constructed at the start of each `derive()` call, threaded through `fireRule` and `matchBodyAtom`, paired with `derived.set`, and discarded when `derive()` returns. The base-facts side stays untouched; pass-3 ships parallel implementations and defers any consolidation to the audit task.
- **Rationale** — SOLID alignment (single responsibility per file, ISP-friendly minimal module surface, no LSP risk from a shared hierarchy); blast-radius constraint (no refactor of the stable base-facts store); separation-of-concerns clarity (data structure vs. lookup discipline). Stacking discipline (delta-driver special case, smallest-set-driver, repeated-variables deferral) is documented in the spec's Constraints section; this ADR records the architectural choice and rationale only.
- **Consequences** —
  - Positive: AC-11.2 passes under 5s budget; 100-element termination test tightens to 5s; the named integration risks (delta-driver, negation under new lookup, repeated variables) each have dedicated tests; spec §5.3 enforces a previously-implicit contract.
  - Negative: two parallel positional-index implementations now live in the engine; future readers may not know which is canonical (audit task is the channel for consolidation if motivated).
- **Confidence** — High on the decision; Medium on the long-term consolidation question (depends on sprint-02's actual workload patterns).
- **Supersedes** — OQ-1 (entry removed from `engine-open-questions.md` as part of this sprint's deliverables).
- **References** — `04-engine-spec.md §5.3`; `04-engine-spec.md §3.1`; sprint-01 deferment doc D5 entry; pass-3 design brief at `docs/chester/working/.../sprint-01-proof-backend-pass-3/design/sprint-01-proof-backend-pass-3-design-00.md`; pass-3 spec at `docs/chester/working/.../sprint-01-proof-backend-pass-3/spec/sprint-01-proof-backend-pass-3-spec-01.md`; `Evaluator.js` (the in-engine `candidatesFor` helper and the `matchBodyAtom` consumer); `DerivedPositionalIndex.js` (the new module).

- [ ] **Step 2: Amend `04-engine-spec.md` §5.3**

Locate `### 5.3 Derived set (IDB)` (around line 160-164). Replace the existing three bullets with:

```markdown
### 5.3 Derived set (IDB)
- Same shape as fact store but for facts produced by rule firing
- Carries per-position lookup tables of the same shape as §5.1's positional indexes; these are constructed within each `derive()` call, live for the duration of that call, and are never persisted across calls. (See ADR-0019.)
- Cleared and rebuilt by each `derive()` call
- Per-fact provenance tag (which rule + which body bindings produced this), used by `explain`
```

- [ ] **Step 3: Refresh front-matter `related_adrs`**

At line 5 of `04-engine-spec.md`, change:

```yaml
related_adrs: [0002, 0007, 0009, 0013, 0014]
```

to:

```yaml
related_adrs: [0002, 0007, 0009, 0013, 0014, 0015, 0016, 0017, 0018, 0019]
```

(Use the actual assigned ADR number from Step 1 if it isn't 0019.)

- [ ] **Step 4: Verify docs render and links are valid**

Manually inspect both files:

```bash
ls docs/chester/plans/20260511-01-mp-redesign-proof-system/design-documents/ADR/0019-*.md
grep -n "related_adrs" docs/chester/plans/20260511-01-mp-redesign-proof-system/design-documents/04-engine-spec.md
grep -n "ADR-0019" docs/chester/plans/20260511-01-mp-redesign-proof-system/design-documents/04-engine-spec.md
```

Expected: file exists; front-matter contains the new list; §5.3 cross-references ADR-0019.

- [ ] **Step 5: Commit**

```bash
git add docs/chester/plans/20260511-01-mp-redesign-proof-system/design-documents/ADR/0019-evaluator-idb-positional-indexing.md docs/chester/plans/20260511-01-mp-redesign-proof-system/design-documents/04-engine-spec.md
git commit -m "docs(engine-spec): add ADR-0019 (IDB positional indexing); amend §5.3 and front-matter related_adrs"
```

---

## Task 6: Correct ADR-0017 off-by-three line reference and remove OQ-1 entry

**Type:** docs-producing
**Implements:** AC-4.4, AC-4.5
**Decision budget:** 0
**Must remain green:** N/A (docs-only).

**Files:**
- Modify: `docs/chester/plans/20260511-01-mp-redesign-proof-system/design-documents/ADR/0017-existential-quantification-negation-semantics.md`
- Modify: `docs/chester/plans/20260511-01-mp-redesign-proof-system/design-documents/engine-open-questions.md`

**Context (read before starting):**
- `ADR/0017-existential-quantification-negation-semantics.md` line 62 today reads: `- Code: \`Evaluator.js:23-43\` (the negation branch in \`matchBodyAtom\`)` — the range `23-43` is wrong; the post-pass-3 line range must point at the negation branch's current location.
- `engine-open-questions.md` currently contains the document header plus the OQ-1 entry; removing OQ-1 leaves a header-only document.

**Steps:**

- [ ] **Step 1: Find the post-pass-3 negation-branch line range**

After Tasks 1-3 have landed, the negation branch in `matchBodyAtom` (within `Evaluator.js`) will be at new line numbers. Use:

```bash
grep -n "if (atom.negated)" skills/design-large-task/engine/Evaluator.js
```

The match line is the start of the negation branch. Read forward until the closing `}` that ends the `if (atom.negated) { ... }` block. Record the start-end range.

- [ ] **Step 2: Update ADR-0017's References section**

Edit `docs/chester/plans/20260511-01-mp-redesign-proof-system/design-documents/ADR/0017-existential-quantification-negation-semantics.md`. Find line 62:

```markdown
- Code: `Evaluator.js:23-43` (the negation branch in `matchBodyAtom`)
```

Replace with the post-pass-3 range. Example (substitute actual numbers from Step 1):

```markdown
- Code: `Evaluator.js:NN-MM` (the negation branch in `matchBodyAtom`)
```

- [ ] **Step 3: Remove OQ-1 from `engine-open-questions.md`**

Edit `docs/chester/plans/20260511-01-mp-redesign-proof-system/design-documents/engine-open-questions.md`. Delete the entire `## OQ-1 — Evaluator IDB Indexing Architecture (D5)` section and everything underneath it through to the end of the document (or the next `---` separator if other entries follow, which today there are none).

After this edit, the file contains only the header preamble (the first 6 lines today: the title, the introductory paragraph, the `---` separator).

- [ ] **Step 4: Verify**

```bash
grep -n "23-43\|Evaluator.js:" docs/chester/plans/20260511-01-mp-redesign-proof-system/design-documents/ADR/0017-existential-quantification-negation-semantics.md
grep -c "OQ-1" docs/chester/plans/20260511-01-mp-redesign-proof-system/design-documents/engine-open-questions.md
```

Expected:
- The first command shows the new (corrected) line range and no `23-43`.
- The second command returns `0` — no `OQ-1` mentions remain.

- [ ] **Step 5: Commit**

```bash
git add docs/chester/plans/20260511-01-mp-redesign-proof-system/design-documents/ADR/0017-existential-quantification-negation-semantics.md docs/chester/plans/20260511-01-mp-redesign-proof-system/design-documents/engine-open-questions.md
git commit -m "docs(cascade): correct ADR-0017 line reference; remove closed OQ-1 entry"
```

---

## End-of-plan checklist

After Task 6 commits:

- [ ] `npm test` (from `skills/design-large-task/engine/`) reports **107 passing, 0 skipped**.
- [ ] All twelve spec acceptance criteria (AC-1.1, AC-1.2, AC-1.3, AC-2.1, AC-2.2, AC-3.1, AC-4.1, AC-4.2, AC-4.3, AC-4.4, AC-4.5, AC-5.1) have at least one passing test or one verified artifact change.
- [ ] No additional changes outside the files listed in the per-task `Files` blocks.
- [ ] `git log --oneline` on the branch shows six commits, one per task, in order.
- [ ] Worktree status (`git status`) is clean.

Hand off to `execute-verify-complete` and then `finish-write-records` → `finish-archive-artifacts` → `finish-close-worktree`.

<!-- created-at: 2026-05-13T08:37:13Z -->
<!-- produced-by plan-build@v0004 -->
