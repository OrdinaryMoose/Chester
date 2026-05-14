import { describe, it, expect } from 'vitest';
import { Engine } from '../Engine.js';
import { V } from '../Unifier.js';

describe('Cross-cutting properties', () => {
  it('monotonicity: adding facts never reduces IDB', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    e.defineRule('r', ['q', ['X']], [['p', ['X']]], {});
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

  it('termination: 100-element transitive closure terminates within bounded time', { timeout: 5000 }, () => {
    const e = new Engine();
    for (let i = 0; i < 100; i++) e.assertFact('parent', [`n${i}`, `n${i + 1}`]);
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
    const start = Date.now();
    const count = e.count(['ancestor', [V('X'), V('Y')]]);
    const elapsed = Date.now() - start;
    expect(count).toBe(100 * 101 / 2); // n*(n+1)/2 = 5050
    expect(elapsed).toBeLessThan(5000);
  });
});
