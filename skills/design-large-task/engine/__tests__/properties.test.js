import { describe, it, expect } from 'vitest';
import { Engine } from '../Engine.js';
import { V } from '../Unifier.js';

describe('Cross-cutting properties', () => {
  it('monotonicity: adding facts never reduces IDB', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    e.defineRule({
      ruleId: 'r',
      head: { predicate: 'q', arity: 1, args: [V('X')] },
      body: [{ predicate: 'p', arity: 1, args: [V('X')], negated: false }]
    });
    const initialSize = e.query(['q', [V('X')]]).length;
    e.assertFact('p', ['b']);
    expect(e.query(['q', [V('X')]]).length).toBeGreaterThanOrEqual(initialSize);
  });

  it('set semantics: asserting same fact twice produces one EDB entry', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    e.assertFact('p', ['a']);
    expect(e.query(['p', [V('X')]])).toEqual([{ X: 'a' }]);
  });

  it('termination: 100-element transitive closure terminates within bounded time', { timeout: 20000 }, () => {
    const e = new Engine();
    for (let i = 0; i < 100; i++) e.assertFact('parent', [`n${i}`, `n${i + 1}`]);
    e.defineRule({
      ruleId: 'anc1',
      head: { predicate: 'ancestor', arity: 2, args: [V('X'), V('Y')] },
      body: [{ predicate: 'parent', arity: 2, args: [V('X'), V('Y')], negated: false }]
    });
    e.defineRule({
      ruleId: 'anc2',
      head: { predicate: 'ancestor', arity: 2, args: [V('X'), V('Y')] },
      body: [
        { predicate: 'parent', arity: 2, args: [V('X'), V('Z')], negated: false },
        { predicate: 'ancestor', arity: 2, args: [V('Z'), V('Y')], negated: false }
      ]
    });
    const start = Date.now();
    const count = e.count(['ancestor', [V('X'), V('Y')]]);
    const elapsed = Date.now() - start;
    expect(count).toBe(100 * 101 / 2); // n*(n+1)/2 = 5050
    // 15s bound while matchBodyAtom does an O(IDB-size) linear scan per body atom
    // per iteration (yielding O(N^3) on an N-element chain). Tightening this bound
    // requires the per-predicate IDB index proposed for Task 15 — see D5 in
    // plan/sprint-01-proof-backend-deferred-00.md.
    expect(elapsed).toBeLessThan(15000);
  });
});
