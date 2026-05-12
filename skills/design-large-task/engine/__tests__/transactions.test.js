import { describe, it, expect } from 'vitest';
import { Engine } from '../Engine.js';
import { V } from '../Unifier.js';

describe('Engine transactions', () => {
  it('begin/commit applies buffered mutations atomically', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    const h = e.begin();
    e.assertFact('p', ['b']);
    expect(e.factExists('p', ['b'])).toBe(true); // read-own-writes
    e.commit(h);
    expect(e.factExists('p', ['b'])).toBe(true); // post-commit visible
  });

  it('begin/rollback discards buffered mutations', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    const h = e.begin();
    e.assertFact('p', ['b']);
    e.rollback(h);
    expect(e.factExists('p', ['b'])).toBe(false);
    expect(e.factExists('p', ['a'])).toBe(true);
  });

  it('read-own-writes: query inside tx sees buffered assertions and rules', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    const h = e.begin();
    e.defineRule({
      ruleId: 'r',
      head: { predicate: 'q', arity: 1, args: [V('X')] },
      body: [{ predicate: 'p', arity: 1, args: [V('X')], negated: false }]
    });
    expect(e.query(['q', [V('X')]])).toEqual([{ X: 'a' }]); // in-tx query sees buffered rule
    e.rollback(h);
    expect(e.getRule('r')).toBeUndefined(); // post-rollback rule is gone
  });

  it('nested begin raises NESTED_TRANSACTION', () => {
    const e = new Engine();
    const h = e.begin();
    expect(() => e.begin()).toThrow(expect.objectContaining({ code: 'NESTED_TRANSACTION' }));
    e.rollback(h);
  });

  it('stale handle: double commit raises STALE_HANDLE', () => {
    const e = new Engine();
    const h = e.begin();
    e.commit(h);
    expect(() => e.commit(h)).toThrow(expect.objectContaining({ code: 'STALE_HANDLE' }));
    expect(() => e.rollback(h)).toThrow(expect.objectContaining({ code: 'STALE_HANDLE' }));
  });

  it('post-rollback state is bit-equal to pre-begin', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    const before = e.snapshot();
    const h = e.begin();
    e.assertFact('p', ['b']);
    e.assertFact('p', ['c']);
    e.rollback(h);
    const after = e.snapshot();
    expect(JSON.stringify(after)).toBe(JSON.stringify(before));
  });
});
