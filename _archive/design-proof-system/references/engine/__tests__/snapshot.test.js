import { describe, it, expect } from 'vitest';
import { Engine } from '../Engine.js';
import { V } from '../Unifier.js';

describe('Engine.snapshot / restore', () => {
  it('round-trip preserves all observable state', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    e.defineRule('r', ['q', ['X']], [['p', ['X']]], {});
    e.derive();
    const snap = e.snapshot();

    e.assertFact('p', ['b']);
    e.retractFact('p', ['a']);
    e.undefineRule('r');

    e.restore(snap);
    expect(e.factExists('p', ['a'])).toBe(true);
    expect(e.factExists('p', ['b'])).toBe(false);
    expect(e.getRule('r')).toBeDefined();
    expect(e.query(['q', [V('X')]])).toEqual([{ X: 'a' }]);
  });

  it('out-of-order restore: older snapshot wins', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    const snap1 = e.snapshot();
    e.assertFact('p', ['b']);
    const snap2 = e.snapshot();
    e.assertFact('p', ['c']);

    e.restore(snap1);
    expect(e.factExists('p', ['a'])).toBe(true);
    expect(e.factExists('p', ['b'])).toBe(false);
    expect(e.factExists('p', ['c'])).toBe(false);
  });

  it('snapshot survives clear', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    const snap = e.snapshot();
    e.clear();
    expect(e.factExists('p', ['a'])).toBe(false);
    e.restore(snap);
    expect(e.factExists('p', ['a'])).toBe(true);
  });
});
