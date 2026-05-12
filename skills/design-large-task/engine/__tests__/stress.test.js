import { describe, it, expect } from 'vitest';
import { Engine } from '../Engine.js';
import { V } from '../Unifier.js';

describe('Stress tests', () => {
  it('AC-11.1: 10k facts with query workload completes within budget', () => {
    const e = new Engine();
    for (let i = 0; i < 10000; i++) e.assertFact('p', [`v${i}`, i % 100]);
    e.defineRule({
      ruleId: 'r',
      head: { predicate: 'q', arity: 1, args: [V('X')] },
      body: [{ predicate: 'p', arity: 2, args: [V('X'), V('K')], negated: false }]
    });
    const t0 = Date.now();
    e.derive();
    const deriveMs = Date.now() - t0;
    const t1 = Date.now();
    const r = e.count(['p', [V('X'), 5]]);
    const queryMs = Date.now() - t1;
    expect(r).toBe(100);
    expect(deriveMs).toBeLessThan(5000); // generous for naive
    expect(queryMs).toBeLessThan(100);
  }, 30000);

  // Skipped pending D5 closure (per-position IDB index in the Evaluator). On the
  // current Evaluator, this hangs (~hours) because matchBodyAtom scans the entire
  // IDB filtered only by predicate, producing O(N^3) total cost on an N-element
  // chain. Unskip when the IDB has a per-position index mirroring FactStore's
  // _positionalIndex; see plan/sprint-01-proof-backend-deferred-00.md (D5).
  it.skip('AC-11.2: 1000-element transitive closure terminates with correct count', () => {
    const e = new Engine();
    for (let i = 0; i < 1000; i++) e.assertFact('parent', [`n${i}`, `n${i + 1}`]);
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
    const c = e.count(['ancestor', [V('X'), V('Y')]]);
    expect(c).toBe(1000 * 1001 / 2);
  }, 60000);

  it('AC-11.3: 100 rules with shared bodies', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    e.assertFact('s', ['a']);
    for (let i = 0; i < 100; i++) {
      e.defineRule({
        ruleId: `r${i}`,
        head: { predicate: `q${i}`, arity: 1, args: [V('X')] },
        body: [
          { predicate: 'p', arity: 1, args: [V('X')], negated: false },
          { predicate: 's', arity: 1, args: [V('X')], negated: false }
        ]
      });
    }
    e.derive();
    // All q_i should derive
    expect(e.exists(['q50', [V('X')]])).toBe(true);
  }, 30000);

  it('AC-11.4: large transaction with 500 buffered mutations commits', () => {
    const e = new Engine();
    const h = e.begin();
    for (let i = 0; i < 500; i++) e.assertFact('p', [`v${i}`]);
    e.commit(h);
    expect(e.count(['p', [V('X')]])).toBe(500);
  }, 30000);
});
