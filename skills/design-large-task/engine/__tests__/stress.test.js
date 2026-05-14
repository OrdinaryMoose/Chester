import { describe, it, expect } from 'vitest';
import { Engine } from '../Engine.js';
import { V } from '../Unifier.js';

describe('Stress tests', () => {
  it('AC-11.1: 10k facts with query workload completes within budget', () => {
    const e = new Engine();
    for (let i = 0; i < 10000; i++) e.assertFact('p', [`v${i}`, i % 100]);
    e.defineRule('r', ['q', ['X']], [['p', ['X', 'K']]], {});
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

  it('AC-11.2: 1000-element transitive closure terminates with correct count', () => {
    const e = new Engine();
    for (let i = 0; i < 1000; i++) e.assertFact('parent', [`n${i}`, `n${i + 1}`]);
    e.defineRule('anc1', ['ancestor', ['X', 'Y']], [['parent', ['X', 'Y']]], {});
    e.defineRule(
      'anc2',
      ['ancestor', ['X', 'Y']],
      [
        ['parent', ['X', 'Z']],
        ['ancestor', ['Z', 'Y']]
      ],
      {}
    );
    const c = e.count(['ancestor', [V('X'), V('Y')]]);
    expect(c).toBe(1000 * 1001 / 2);
  }, 5000);

  it('AC-11.3: 100 rules with shared bodies', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    e.assertFact('s', ['a']);
    for (let i = 0; i < 100; i++) {
      e.defineRule(
        `r${i}`,
        [`q${i}`, ['X']],
        [
          ['p', ['X']],
          ['s', ['X']]
        ],
        {}
      );
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
