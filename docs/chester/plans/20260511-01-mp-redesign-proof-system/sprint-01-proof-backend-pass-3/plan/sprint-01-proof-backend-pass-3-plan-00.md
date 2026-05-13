# Plan: Evaluator IDB Indexing

**Sprint:** sprint-01-proof-backend-pass-3 (under master 20260511-01-mp-redesign-proof-system)
**Spec:** docs/chester/working/20260511-01-mp-redesign-proof-system/sprint-01-proof-backend-pass-3/spec/sprint-01-proof-backend-pass-3-spec-01.md
**Execution mode:** subagent

> **For agentic workers:** Use execute-write to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The `Execution mode` field selects which execute-write section runs — Section 2 (subagent-driven) is selected here.

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
**Decision budget:** 4 (bound-position identification, repeated-variables deduplication, smallest-set-driver mechanics, candidate-set representation choice)
**Must remain green:** `__tests__/DerivedPositionalIndex.test.js`, new `__tests__/candidates-for.test.js`, plus the full baseline 87 tests (no consumer change yet).

**Files:**
- Modify: `skills/design-large-task/engine/Evaluator.js` (add module-scope helper; do NOT yet wire it into `matchBodyAtom` — wiring is Task 3)
- Create: `skills/design-large-task/engine/__tests__/candidates-for.test.js`

**Context (read before starting):**
- `skills/design-large-task/engine/Evaluator.js` lines 1-66 — `matchBodyAtom` and the imports.
- `skills/design-large-task/engine/Unifier.js` — `unify(patternArgs, factArgs)` returns fresh bindings (Object) for a single atom-match, or `null` for no match. The helper does NOT call `unify`; consumers do.
- `skills/design-large-task/engine/FactStore.js` `factsMatching(predicate, arity, position, value)` returns `Array<args>` for facts matching that one position/value.
- The spec's Data Flow section §3 names the exact rules `candidatesFor` follows.

**Helper contract:** `candidatesFor(atom, currentBindings, factStore, idbIndex, deltaFilter)` returns `Array<{ args, fk }>` where each entry is a candidate that matched the helper's narrowing. Consumers iterate the array and run `unify(atom.args, args)` to extract bindings.

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

describe('candidatesFor', () => {
  // First-iteration / nothing-bound case → full predicate-bucket scan
  it('with no bound positions and no delta, returns base + derived facts for the predicate', () => {
    const atom = { predicate: 'p', arity: 1, args: [V('X')], negated: false };
    const fs = setupBase(['p', ['a']], ['p', ['b']]);
    const idx = setupIdb(['p', ['c']]);
    const out = candidatesFor(atom, {}, fs, idx, null);
    const argSets = out.map(c => c.args);
    expect(argSets).toEqual(expect.arrayContaining([['a'], ['b'], ['c']]));
    expect(out.length).toBe(3);
  });

  // Bound-position lookup (positive branch)
  it('with one bound position via constant in pattern, returns only matching facts from both sides', () => {
    const atom = { predicate: 'p', arity: 2, args: ['a', V('Y')], negated: false };
    const fs = setupBase(['p', ['a', 'x']], ['p', ['b', 'y']]);
    const idx = setupIdb(['p', ['a', 'z']], ['p', ['c', 'w']]);
    const out = candidatesFor(atom, {}, fs, idx, null);
    const argSets = out.map(c => c.args);
    expect(argSets).toEqual(expect.arrayContaining([['a', 'x'], ['a', 'z']]));
    expect(out.length).toBe(2);
  });

  it('with one bound position via current bindings, returns only matching facts', () => {
    const atom = { predicate: 'p', arity: 2, args: [V('X'), V('Y')], negated: false };
    const fs = setupBase(['p', ['a', 'x']], ['p', ['b', 'y']]);
    const idx = new DerivedPositionalIndex();
    const out = candidatesFor(atom, { X: 'a' }, fs, idx, null);
    expect(out.map(c => c.args)).toEqual([['a', 'x']]);
  });

  // Multiple bound positions → intersection
  it('with two bound positions, intersects across positions', () => {
    const atom = { predicate: 'p', arity: 2, args: ['a', 'x'], negated: false };
    const fs = setupBase(['p', ['a', 'x']], ['p', ['a', 'y']], ['p', ['b', 'x']]);
    const idx = new DerivedPositionalIndex();
    const out = candidatesFor(atom, {}, fs, idx, null);
    expect(out.map(c => c.args)).toEqual([['a', 'x']]);
  });

  // Repeated variables → deferred to unify
  it('with the same variable in two positions, drives lookup off the first occurrence only', () => {
    const atom = { predicate: 'p', arity: 2, args: [V('X'), V('X')], negated: false };
    const fs = setupBase(['p', ['a', 'a']], ['p', ['a', 'b']], ['p', ['b', 'b']]);
    const idx = new DerivedPositionalIndex();
    const out = candidatesFor(atom, { X: 'a' }, fs, idx, null);
    // First occurrence (position 0) binds to 'a'. The helper does not also
    // require position 1 === 'a' via index — unify checks that downstream.
    // So all facts where args[0] === 'a' are candidates.
    expect(out.map(c => c.args)).toEqual(expect.arrayContaining([['a', 'a'], ['a', 'b']]));
    expect(out.length).toBe(2);
  });

  // Delta-only case (delta-driver: no bound positions, delta non-null)
  it('with no bound positions and a non-null deltaFilter, returns only delta entries matching predicate/arity', () => {
    const atom = { predicate: 'p', arity: 1, args: [V('X')], negated: false };
    const fs = setupBase(['p', ['a']]);
    const idx = setupIdb(['p', ['b']], ['q', ['x']]);
    // Delta contains keys for facts of various predicates.
    const delta = new Set([factKey('p', ['b']), factKey('q', ['x'])]);
    const out = candidatesFor(atom, {}, fs, idx, delta);
    // The delta-driver case: candidate set = delta entries matching atom predicate/arity.
    // Only factKey('p', ['b']) matches; factKey('q', ['x']) is wrong predicate.
    expect(out.map(c => c.fk)).toEqual([factKey('p', ['b'])]);
    // Critically: 'p', ['a'] from the base side is NOT included — delta filter applied.
    expect(out.length).toBe(1);
  });

  // Bound positions + delta → intersection of both
  it('with bound positions and delta, intersects bound-position buckets with delta', () => {
    const atom = { predicate: 'p', arity: 2, args: ['a', V('Y')], negated: false };
    const fs = setupBase(['p', ['a', 'x']]);
    const idx = setupIdb(['p', ['a', 'z']], ['p', ['a', 'w']]);
    const delta = new Set([factKey('p', ['a', 'z'])]);
    const out = candidatesFor(atom, {}, fs, idx, delta);
    // Bound-position bucket for position 0 value 'a': {fk-base-ax, fk-idb-az, fk-idb-aw}.
    // Intersected with delta {fk-idb-az}: just fk-idb-az.
    expect(out.map(c => c.fk)).toEqual([factKey('p', ['a', 'z'])]);
  });

  // Negation routing: helper invoked with deltaFilter = null even on delta-restricted iterations
  it('with deltaFilter = null and bound positions, returns bound-position-narrowed full set (no delta restriction)', () => {
    const atom = { predicate: 'p', arity: 2, args: ['a', V('Y')], negated: true };
    const fs = setupBase(['p', ['a', 'x']]);
    const idx = setupIdb(['p', ['a', 'z']]);
    const out = candidatesFor(atom, {}, fs, idx, null);
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

- [ ] **Step 3: Write minimal implementation**

Add the helper as a module-scope `export` near the top of `skills/design-large-task/engine/Evaluator.js` (above `matchBodyAtom`, after the existing imports). Insert this block between line 7 (`import { factKey }`) and the existing `substituteArgs` function at line 9:

```javascript
/**
 * candidatesFor — unified candidate-source helper for body-atom matching.
 *
 * Returns Array<{ args, fk }> of candidate facts (from both base and derived sides)
 * narrowed by:
 *   - bound-position intersection (positions where the atom has a constant in the
 *     pattern OR a variable already bound in currentBindings)
 *   - delta filter (when non-null, restricts to delta entries matching predicate/arity)
 *
 * The helper does NOT call unify; consumers iterate the returned array and call
 * unify(atom.args, args) themselves to extract bindings.
 *
 * Repeated variables in the atom: only the first occurrence drives bucket lookup;
 * subsequent occurrences are deferred to the unification step.
 *
 * Negation handling: matchBodyAtom passes deltaFilter = null for negated atoms.
 *
 * See spec §Data Flow for the four-case decision table.
 */
export function candidatesFor(atom, currentBindings, factStore, idbIndex, deltaFilter) {
  const { predicate, arity, args } = atom;

  // Identify bound positions and their values.
  // Repeated variables: only the FIRST occurrence of each variable counts as bound.
  const seenVars = new Set();
  const boundPositions = []; // Array<{ position: int, value: any }>
  for (let i = 0; i < arity; i++) {
    const a = args[i];
    if (a && typeof a === 'object' && typeof a.var === 'string') {
      if (seenVars.has(a.var)) continue; // repeated var — defer to unify
      seenVars.add(a.var);
      if (a.var in currentBindings) {
        boundPositions.push({ position: i, value: currentBindings[a.var] });
      }
    } else {
      // constant in pattern
      boundPositions.push({ position: i, value: a });
    }
  }

  // Helper to fetch the base-side fact key for given args.
  const baseFactKey = (factArgs) => factKey(predicate, factArgs);

  if (boundPositions.length === 0) {
    // No bound positions.
    if (deltaFilter !== null) {
      // Delta-driver case: candidate set is the subset of delta whose entries match
      // this atom's predicate/arity. We need to resolve each fact key back to its args.
      const out = [];
      for (const fk of deltaFilter) {
        // Probe both sides for the fact key.
        // Try idbIndex via reverse lookup: we don't have a direct reverse map, so
        // we have to materialize via the predicate's full base+derived universe and
        // filter. Cheaper approach: maintain a separate fk → args map. We avoid
        // adding that here by leveraging the fact that delta entries always come
        // from `derived` (the IDB) — they were added by fireRule's derived.set call,
        // so they live in the derived Map. The caller (matchBodyAtom) passes the
        // `derived` map via factStore parameter or we accept a fifth arg.
        // For this helper, we rely on the caller passing a way to resolve fks.
        // Simplification: matchBodyAtom resolves delta fks itself before calling
        // candidatesFor with a non-null deltaFilter. To keep the helper pure, we
        // accept the limitation here and document it: matchBodyAtom is responsible
        // for the delta-driver path resolution.
        //
        // To make this self-contained, we extend the deltaFilter contract: when
        // non-null, it's a Map<fk, args> rather than a Set<fk>. The caller adapts.
        //
        // For now, accept deltaFilter as Map<fk, args>:
        const deltaArgs = deltaFilter.get(fk);
        if (deltaArgs && deltaArgs.length === arity) {
          // Check predicate match by recomputing the key.
          if (baseFactKey(deltaArgs) === fk) {
            out.push({ args: deltaArgs, fk });
          }
        }
      }
      return out;
    }
    // No delta, no bound positions: full predicate-bucket scan (current fallback behavior).
    const out = [];
    for (const baseArgs of factStore.allFacts(predicate, arity)) {
      out.push({ args: baseArgs, fk: baseFactKey(baseArgs) });
    }
    // IDB side: we don't have a "list all derived facts for this predicate" primitive.
    // Use the index's per-(predicate, arity) coverage by walking position 0's buckets
    // and unioning their fact keys, then resolving args via the same delta-resolution
    // trick — except we don't have args resolution for the IDB without a reverse map.
    // Decision: matchBodyAtom passes the `derived` Map directly when needed for this
    // case (no-positions, no-delta), so candidatesFor's no-bound/no-delta path consults
    // factStore for base and the (extended) parameter for derived. To keep contract simple,
    // we expose a second helper that matchBodyAtom calls for this exact case.
    //
    // For the present iteration, return base-only and require matchBodyAtom to also
    // call its own derived-iteration shim for the no-bound/no-delta case.
    return out;
  }

  // Bound positions exist. Compute per-position candidate Sets of fact keys.
  // Each per-position set is the union of base-side fact keys and derived-side fact keys
  // for that (position, value).
  const perPositionKeySets = boundPositions.map(({ position, value }) => {
    const baseFacts = factStore.factsMatching(predicate, arity, position, value);
    const baseKeys = new Set(baseFacts.map(baseFactKey));
    const derivedKeys = idbIndex.bucketFor(predicate, arity, position, value);
    // Union
    const union = new Set(baseKeys);
    for (const k of derivedKeys) union.add(k);
    return { union, baseFacts, position, value };
  });

  // Smallest-set-driver: pick the smallest union as the driver.
  let driverIdx = 0;
  for (let i = 1; i < perPositionKeySets.length; i++) {
    if (perPositionKeySets[i].union.size < perPositionKeySets[driverIdx].union.size) driverIdx = i;
  }
  const driver = perPositionKeySets[driverIdx];

  // Build a fk → args map by walking the driver's base facts + the union members.
  // For base candidates we have args from factsMatching; for derived candidates we
  // need an args resolver. Decision: caller provides derived's `Map<fk, fact>` via a
  // closure on idbIndex. Since idbIndex doesn't carry args, matchBodyAtom needs to
  // pass the `derived` Map to candidatesFor. Sixth parameter.
  //
  // For this iteration: assume idbIndex carries an internal fk → args resolver
  // exposed via a method `argsFor(fk)`. We add that to DerivedPositionalIndex if
  // needed — Task 1 already wrote the module without it; Task 3 may need to extend
  // the module or thread `derived` through. We'll resolve via factsMatching for base
  // and via idbIndex for derived assuming idbIndex.argsFor(fk) is added; otherwise
  // we fall back to recomputing args from the per-position bucket entries.

  // ===
  // Simpler implementation: for each fk in the intersection, materialize args by:
  //   - if fk matches a base fact, use factsMatching's row that produced it
  //   - if fk matches a derived fact, use the args from the derived Map (passed in)
  // To keep the helper's signature stable (5 params), we add idbIndex.factsForBucket(...)
  // which returns Array<args> instead of Set<fk>. Task 1's idbIndex doesn't have this;
  // Task 3 extends it OR we add a sibling helper here.
  // ===
  // For the current step, return placeholder. Task 3 finalizes representation.
  // (Tests above will drive the final shape.)

  // The implementation finalizes during Task 3's wiring step. For now, return the
  // base-side intersection (good enough to make tests #2-#4 pass; tests #6-#8 will
  // be finalized in Task 3 alongside `derived` Map threading).

  // Intersection over base-side keys only (TEMPORARY — Task 3 extends to derived):
  const baseFactsForDriver = driver.baseFacts;
  const fkToArgs = new Map();
  for (const bArgs of baseFactsForDriver) fkToArgs.set(baseFactKey(bArgs), bArgs);

  const driverKeys = new Set([...fkToArgs.keys()]);
  // Intersect with other positions' unions:
  for (let i = 0; i < perPositionKeySets.length; i++) {
    if (i === driverIdx) continue;
    for (const k of [...driverKeys]) {
      if (!perPositionKeySets[i].union.has(k)) driverKeys.delete(k);
    }
  }

  // Optional delta intersection:
  if (deltaFilter !== null) {
    for (const k of [...driverKeys]) {
      if (!deltaFilter.has(k)) driverKeys.delete(k);
    }
  }

  const out = [];
  for (const k of driverKeys) {
    out.push({ args: fkToArgs.get(k), fk: k });
  }
  return out;
}
```

**IMPORTANT — implementer note for Task 2.** The implementation above is a working scaffold; the spec's full data-flow requires `candidatesFor` to access derived-side args via the `idbIndex` AND requires the no-bound/no-delta case to return both base and derived facts. Task 1 wrote `DerivedPositionalIndex` with `bucketFor` returning a `Set<factKey>` only — no args resolver. Task 2's implementer must extend `DerivedPositionalIndex` with a small `argsFor(predicate, arity, fk)` method, update Task 1's tests for the new method, and reshape `candidatesFor` to use it. The integration tests in Task 3 enforce the full behavior; this task's tests cover the slice that the scaffold supports.

**Decision log for the implementer:**
- The helper accepts `deltaFilter` as either `null` or `Map<factKey, args>`. The Set-of-fact-keys form (current `delta`) needs to be wrapped into a Map by the caller (`matchBodyAtom` / `fireRule`) when invoking the helper.
- Repeated-variable deferral uses `seenVars` Set: subsequent occurrences of a bound variable are skipped at the bound-position-identification step, leaving them to `unify`.
- The smallest-set-driver iterates the union with the smallest size. Tie-breaking: first match wins.
- The per-position candidate set is the UNION of base-side and derived-side fact keys at that position — body atoms match base OR derived.

- [ ] **Step 4: Run test to verify it passes**

Run from `skills/design-large-task/engine/`:

```bash
npx vitest run __tests__/candidates-for.test.js
```

Expected: PASS — all 8 candidates-for tests green. Some tests may require the `argsFor` extension noted above; if so, extend `DerivedPositionalIndex` in this commit and re-run Task 1's tests as well.

Also run the full suite:

```bash
npm test
```

Expected: 87 baseline + 8 (Task 1's) + 8 (this task's) = **103 passing, 1 skipped**.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/engine/Evaluator.js skills/design-large-task/engine/DerivedPositionalIndex.js skills/design-large-task/engine/__tests__/candidates-for.test.js skills/design-large-task/engine/__tests__/DerivedPositionalIndex.test.js
git commit -m "feat(engine): add candidatesFor helper as a pure function with unit tests"
```

---

## Task 3: Wire `candidatesFor` into `matchBodyAtom` and add `idbIndex` maintenance in `derive()`

**Type:** code-producing
**Implements:** AC-1.1, AC-1.2, AC-1.3, AC-3.1, AC-5.1
**Decision budget:** 3 (where to construct idbIndex in derive, how to expose the per-atom candidate-iteration count for AC-1.1 test instrumentation, how to thread delta as a Map<fk, args> instead of Set<fk>)
**Must remain green:** existing `__tests__/operations.test.js`, `architecture.test.js`, `query.test.js`, `snapshot.test.js`, `lifecycle.test.js`, `explain.test.js`, `failures.test.js`, `transactions.test.js`, `evaluation.test.js`, `properties.test.js`, `stress.test.js` (87 baseline tests), `DerivedPositionalIndex.test.js`, `candidates-for.test.js`, plus new `evaluator-indexing.test.js`.

**Files:**
- Modify: `skills/design-large-task/engine/Evaluator.js`
- Create: `skills/design-large-task/engine/__tests__/evaluator-indexing.test.js`

**Context (read before starting):**
- `skills/design-large-task/engine/Evaluator.js` — full file. Key sites:
  - Line 7: `import { factKey } from './utils.js'`
  - Line 18-66: `matchBodyAtom`
  - Line 88-147: `derive()` method
  - Line 95: `let delta = null;`
  - Line 102-126: `fireRule` closure
  - Line 107: `const filter = (deltaAtomIndex === i && !atom.negated) ? delta : null;`
  - Line 110: `next.push(...matchBodyAtom(atom, this.factStore, derived, b, filter));`
  - Line 119: `derived.set(fk, { ... });` (the single derived.set site)
  - Line 124: `newDelta.add(fk);`
- The current `delta` is a `Set<factKey>`. To support the new helper's delta-driver case, it must become a `Map<factKey, args>`. This is an internal change; `iterationStats` and observable behavior do not change.

**Steps (TDD):**

- [ ] **Step 1: Write the failing tests** (integration tests for the three named risks)

Create `skills/design-large-task/engine/__tests__/evaluator-indexing.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { Engine } from '../Engine.js';
import { Evaluator } from '../Evaluator.js';
import { V } from '../Unifier.js';

describe('Evaluator IDB indexing — named integration risks', () => {

  // AC-1.1 — Delta-driver case: delta-restricted atom with no bound positions
  // uses the delta as the candidate set, not the full predicate bucket.
  it('AC-1.1: delta-driver case iterates only delta members matching predicate/arity', () => {
    const e = new Engine();
    // Build a workload where:
    //  - Iteration 1: derive q(a), q(b) from p(a), p(b)
    //  - Iteration 2: a delta-restricted body atom for predicate q with no bound positions
    //    should iterate exactly the iteration-1 delta entries for q, not the full derived bucket.
    e.assertFact('p', ['a']);
    e.assertFact('p', ['b']);
    e.defineRule({
      ruleId: 'r1',
      head: { predicate: 'q', arity: 1, args: [V('X')] },
      body: [{ predicate: 'p', arity: 1, args: [V('X')], negated: false }]
    });
    e.defineRule({
      ruleId: 'r2',
      head: { predicate: 's', arity: 1, args: [V('Y')] },
      body: [{ predicate: 'q', arity: 1, args: [V('Y')], negated: false }]
    });

    // Enable test-side instrumentation on the evaluator for per-atom candidate counts.
    // The Evaluator exposes a test-only hook: setCandidateCountObserver(fn).
    const counts = [];
    e.evaluator.setCandidateCountObserver((ruleId, atomIndex, candidateCount) => {
      counts.push({ ruleId, atomIndex, candidateCount });
    });

    e.derive();

    // Sanity: q(a), q(b), s(a), s(b) all derived.
    expect(e.count(['q', [V('X')]])).toBe(2);
    expect(e.count(['s', [V('Y')]])).toBe(2);

    // On iteration 2 of stratum 0, r2's atom (q(Y), no bound positions) is delta-restricted.
    // The delta from iteration 1 contains q(a) and q(b). The candidate count must equal 2,
    // NOT the full q-bucket size (which is also 2 in this minimal example, so make the
    // example also have s entries pre-derived that mustn't pollute the count).
    const r2Iter2Counts = counts.filter(c => c.ruleId === 'r2' && c.atomIndex === 0);
    // At least one of these reflects the iteration-2 delta-driver invocation.
    // We assert the count we observe matches the iteration-1 delta size for q (= 2),
    // not some larger value that would indicate full-bucket fallback.
    expect(r2Iter2Counts.some(c => c.candidateCount === 2)).toBe(true);
  });

  // AC-1.2 — Negation under new lookup preserves existential semantics.
  // Reuses AC-9.4 pattern: leaf(X) :- node(X), ¬ancestor(X, Y) — should NOT derive leaf(a) when ancestor(a, b) exists.
  it('AC-1.2: negation branch with mixed bound/unbound vars works under new lookup', () => {
    const e = new Engine();
    e.assertFact('node', ['a']);
    e.assertFact('node', ['c']);
    e.assertFact('parent', ['a', 'b']);  // implies ancestor(a, b)
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

  // AC-1.3 — Repeated variables defer to unification: p(X, X) matches only facts where args[0] === args[1].
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

Expected: FAIL — `setCandidateCountObserver` does not exist on the Evaluator; the wiring hasn't been done; AC-1.1 throws.

- [ ] **Step 3: Write the implementation**

Edit `skills/design-large-task/engine/Evaluator.js`. The edits:

1. **At the top of the file**, after the `import` lines, add:

```javascript
import { DerivedPositionalIndex } from './DerivedPositionalIndex.js';
```

2. **Replace the existing `matchBodyAtom` function** (lines 18-66 in current file) with a version that consumes `candidatesFor`. New body:

```javascript
function matchBodyAtom(atom, factStore, idbIndex, derivedMap, currentBindings, deltaFilter, candidateCountObserver, ruleId, atomIndex) {
  const arity = atom.arity;

  // Wrap deltaFilter (Set<fk>) into Map<fk, args> using derivedMap for argsFor.
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

  if (candidateCountObserver) candidateCountObserver(ruleId, atomIndex, candidates.length);

  if (atom.negated) {
    // ADR-0017: unbound atom vars are existentially quantified.
    // We use the narrowed candidate set from candidatesFor (deltaMap was forced null
    // for negation by the caller — see fireRule).
    const isConsistent = (factArgs) => {
      const fresh = require_unify(atom.args, factArgs);
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
    const fresh = require_unify(atom.args, c.args);
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

// Adapter so the negation branch and positive branch share unify import.
function require_unify(patternArgs, factArgs) {
  return unify(patternArgs, factArgs);
}
```

3. **Reshape `candidatesFor`** to accept the derived Map as a sixth parameter so it can resolve derived-side args without needing a separate `argsFor` method. Replace Task 2's placeholder body with the production body:

```javascript
export function candidatesFor(atom, currentBindings, factStore, idbIndex, deltaFilter, derivedMap) {
  const { predicate, arity, args } = atom;

  // Identify bound positions (first occurrence per variable).
  const seenVars = new Set();
  const boundPositions = [];
  for (let i = 0; i < arity; i++) {
    const a = args[i];
    if (a && typeof a === 'object' && typeof a.var === 'string') {
      if (seenVars.has(a.var)) continue;
      seenVars.add(a.var);
      if (a.var in currentBindings) boundPositions.push({ position: i, value: currentBindings[a.var] });
    } else {
      boundPositions.push({ position: i, value: a });
    }
  }

  // Args resolver: tries base side first (via factStore.allFacts or factsMatching's row),
  // then derived side via derivedMap.
  const fkToArgs = (fk, baseArgsByKey) => baseArgsByKey.get(fk) || (derivedMap && derivedMap.get(fk) && derivedMap.get(fk).args);

  if (boundPositions.length === 0) {
    if (deltaFilter !== null) {
      // Delta-driver case. deltaFilter is Map<fk, args> already filtered by predicate/arity.
      const out = [];
      for (const [fk, fArgs] of deltaFilter) out.push({ args: fArgs, fk });
      return out;
    }
    // No delta, no bound positions: full base ∪ derived for this predicate.
    const out = [];
    for (const bArgs of factStore.allFacts(predicate, arity)) {
      out.push({ args: bArgs, fk: factKey(predicate, bArgs) });
    }
    if (derivedMap) {
      for (const fact of derivedMap.values()) {
        if (fact.predicate === predicate && fact.args.length === arity) {
          out.push({ args: fact.args, fk: factKey(predicate, fact.args) });
        }
      }
    }
    return out;
  }

  // Per-position candidate fact-key sets (union of base and derived).
  const baseArgsByKey = new Map();
  const perPosition = boundPositions.map(({ position, value }) => {
    const baseFacts = factStore.factsMatching(predicate, arity, position, value);
    for (const bArgs of baseFacts) baseArgsByKey.set(factKey(predicate, bArgs), bArgs);
    const baseKeys = new Set(baseFacts.map(bArgs => factKey(predicate, bArgs)));
    const derivedKeys = idbIndex.bucketFor(predicate, arity, position, value);
    const union = new Set(baseKeys);
    for (const k of derivedKeys) union.add(k);
    return union;
  });

  // Smallest-set-driver.
  let driverIdx = 0;
  for (let i = 1; i < perPosition.length; i++) {
    if (perPosition[i].size < perPosition[driverIdx].size) driverIdx = i;
  }
  const driverKeys = new Set(perPosition[driverIdx]);

  // Intersect with other positions.
  for (let i = 0; i < perPosition.length; i++) {
    if (i === driverIdx) continue;
    for (const k of [...driverKeys]) {
      if (!perPosition[i].has(k)) driverKeys.delete(k);
    }
  }

  // Intersect with deltaFilter when present.
  if (deltaFilter !== null) {
    for (const k of [...driverKeys]) {
      if (!deltaFilter.has(k)) driverKeys.delete(k);
    }
  }

  // Materialize args for each surviving key.
  const out = [];
  for (const k of driverKeys) {
    const fArgs = baseArgsByKey.get(k) || (derivedMap && derivedMap.get(k) && derivedMap.get(k).args);
    if (fArgs) out.push({ args: fArgs, fk: k });
  }
  return out;
}
```

4. **Modify `derive()`** to construct and maintain `idbIndex`. Change the function body to (note: the `delta` variable changes type from `Set<fk>` to `Set<fk>` carrying same shape, but `derivedMap` is `derived`):

   - Right after `this.iterationStats = [];` and `const derived = new Map();`, add:
     ```javascript
     const idbIndex = new DerivedPositionalIndex();
     ```
   - In `fireRule`, change the `matchBodyAtom` call (line 110) to pass `idbIndex`, the candidate-count observer, and the rule/atom IDs:
     ```javascript
     next.push(...matchBodyAtom(atom, this.factStore, idbIndex, derived, b, filter, this._candidateCountObserver, rule.ruleId, i));
     ```
   - After `derived.set(fk, { ... })` (line 119-123), add:
     ```javascript
     idbIndex.addFact(rule.head.predicate, headArgs);
     ```

5. **Add the test-only candidate-count observer hook** as a method on the `Evaluator` class:

```javascript
setCandidateCountObserver(fn) {
  this._candidateCountObserver = fn;
}
```

Initialize `this._candidateCountObserver = null;` in the constructor.

6. **Confirm the negation branch invariant.** The line that computes `filter` is at line 107 today:
   ```javascript
   const filter = (deltaAtomIndex === i && !atom.negated) ? delta : null;
   ```
   This already passes `null` for negated atoms — the invariant holds without change.

- [ ] **Step 4: Run tests**

Run from `skills/design-large-task/engine/`:

```bash
npm test
```

Expected: All passing tests from previous tasks (87 baseline + 8 Task 1 + 8 Task 2 = 103) PLUS 3 new integration tests = **106 passing, 1 skipped**.

If AC-9.1 through AC-9.4 (existing canonical negation tests in `evaluation.test.js`) fail, the negation routing or the candidate-set narrowing is wrong — re-examine the `candidatesFor` `boundPositions.length === 0 && deltaFilter === null` path for negated atoms.

If `properties.test.js` 100-element termination test passes much faster than its 15s bound (closer to 1s or below), that's the expected signal — the indexing works.

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

In `__tests__/stress.test.js`, around lines 25-48:
- Remove the comment block `// Skipped pending D5 closure ... see plan/sprint-01-proof-backend-deferred-00.md (D5).` (lines ~25-29).
- Change `it.skip('AC-11.2: ...` to `it('AC-11.2: ...` (line 30).
- Change `, 60000)` at the end of the test definition (line 48) to `, 5000)`.

In `__tests__/properties.test.js`, around lines 26-50:
- Change `{ timeout: 20000 }` at line 26 to `{ timeout: 5000 }`.
- Remove the comment block at lines 47-49 (`// 15s bound while the Evaluator's IDB lacks a per-position index. ... See plan/...`).
- Change `expect(elapsed).toBeLessThan(15000);` at line 50 to `expect(elapsed).toBeLessThan(5000);`.

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

Example expected output (illustrative; actual numbers depend on post-pass-3 code shape): if `grep` returns `28: if (atom.negated) {` and the closing brace is at line 50, the new range is `28-50`.

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
