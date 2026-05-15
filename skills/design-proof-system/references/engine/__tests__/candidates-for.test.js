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

  // Wildcard handling — the '_' wildcard must be treated as "match anything" by the
  // index layer, identical to its treatment in Unifier (Unifier.js:30). Without this,
  // any rule body atom containing a wildcard produces zero candidates because the
  // index lookup demands the position equal the literal string '_'. This was the
  // root cause of the calculator stress-test closure-gate false positive — every
  // closure-policy / friction-policy rule uses wildcards in body atoms and was
  // silently firing zero times.
  it('with a wildcard in one position, treats wildcard as match-anything (not as a literal constant)', () => {
    const atom = { predicate: 'p', arity: 3, args: [V('X'), '_', '_'], negated: false };
    const fs = setupBase(['p', ['a', 'b', 'c']], ['p', ['d', 'e', 'f']]);
    const idx = new DerivedPositionalIndex();
    const derivedMap = new Map();
    const out = candidatesFor(atom, {}, fs, idx, null, derivedMap);
    // Pre-fix: would return []. Post-fix: returns both facts.
    expect(out.map(c => c.args)).toEqual(expect.arrayContaining([['a', 'b', 'c'], ['d', 'e', 'f']]));
    expect(out.length).toBe(2);
  });

  it('with a wildcard mixed with a real constant, narrows by the constant and ignores the wildcard', () => {
    const atom = { predicate: 'p', arity: 3, args: [V('X'), 'b', '_'], negated: false };
    const fs = setupBase(['p', ['a', 'b', 'c']], ['p', ['d', 'b', 'e']], ['p', ['f', 'g', 'h']]);
    const idx = new DerivedPositionalIndex();
    const derivedMap = new Map();
    const out = candidatesFor(atom, {}, fs, idx, null, derivedMap);
    // Both facts with 'b' in position 1 should be candidates; the wildcard in pos 2
    // must not filter anything out.
    expect(out.map(c => c.args)).toEqual(expect.arrayContaining([['a', 'b', 'c'], ['d', 'b', 'e']]));
    expect(out.length).toBe(2);
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
