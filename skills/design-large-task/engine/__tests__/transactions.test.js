import { describe, it, expect } from 'vitest';
import { Engine } from '../Engine.js';
import { V } from '../Unifier.js';
import { defineRuleObj } from './helpers/defineRuleObj.js';

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
    defineRuleObj(e, {
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

describe('Engine transaction edge cases', () => {
  it('cyclic-negation rule inside tx is rejected at defineRule, tx remains usable', () => {
    const e = new Engine();
    const h = e.begin();
    defineRuleObj(e, {
      ruleId: 'r1',
      head: { predicate: 'p', arity: 1, args: [V('X')] },
      body: [
        { predicate: 'base', arity: 1, args: [V('X')], negated: false },
        { predicate: 'q', arity: 1, args: [V('X')], negated: true }
      ]
    });
    expect(() => defineRuleObj(e, {
      ruleId: 'r2',
      head: { predicate: 'q', arity: 1, args: [V('X')] },
      body: [
        { predicate: 'base', arity: 1, args: [V('X')], negated: false },
        { predicate: 'p', arity: 1, args: [V('X')], negated: true }
      ]
    })).toThrow(expect.objectContaining({ code: 'CYCLIC_NEGATION' }));
    expect(e.getRule('r1')).toBeDefined();
    expect(e.getRule('r2')).toBeUndefined();
    e.commit(h);
    expect(e.getRule('r1')).toBeDefined();
  });

  it('clear() inside tx refused with NESTED_TRANSACTION_OP_REFUSED', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    const h = e.begin();
    expect(() => e.clear()).toThrow(expect.objectContaining({ code: 'NESTED_TRANSACTION_OP_REFUSED' }));
    expect(e.factExists('p', ['a'])).toBe(true);
    e.rollback(h);
  });

  it('loadFrom() inside tx refused with NESTED_TRANSACTION_OP_REFUSED', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    const h = e.begin();
    expect(() => e.loadFrom({ version: 1, facts: [], rules: [] })).toThrow(
      expect.objectContaining({ code: 'NESTED_TRANSACTION_OP_REFUSED' })
    );
    expect(e.factExists('p', ['a'])).toBe(true);
    e.rollback(h);
  });

  it('serialize() inside tx returns logical view (committed + buffered)', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    const h = e.begin();
    e.assertFact('p', ['b']);
    const s = e.serialize();
    expect(s.facts.find(f => f.predicate === 'p' && f.args[0] === 'b')).toBeDefined();
    e.rollback(h);
  });

  it('restore() inside tx implicitly rolls back', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    const pre = e.snapshot();
    const h = e.begin();
    e.assertFact('p', ['b']);
    e.restore(pre);
    expect(e.factExists('p', ['a'])).toBe(true);
    expect(e.factExists('p', ['b'])).toBe(false);
    expect(() => e.commit(h)).toThrow(expect.objectContaining({ code: 'STALE_HANDLE' }));
  });

  it('snapshot inside tx captures logical view; restore returns to that view', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    const h = e.begin();
    e.assertFact('p', ['b']);
    const snap = e.snapshot();
    // Even after rollback, restore brings us back to logical view (a + b).
    e.rollback(h);
    expect(e.factExists('p', ['b'])).toBe(false);
    e.restore(snap);
    expect(e.factExists('p', ['a'])).toBe(true);
    expect(e.factExists('p', ['b'])).toBe(true);
  });

  it('AC-8.7 commit-time atomicity: post-commit state = pre-begin + mutations (no halfway state)', () => {
    // The snapshot-rollback implementation makes commit trivially atomic:
    // mutations apply live; commit only clears the active-tx handle.
    // This test verifies the observable invariant: after commit, no halfway state is reachable.
    const e = new Engine();
    e.assertFact('p', ['a']);
    const preBegin = e.snapshot();

    const h = e.begin();
    e.assertFact('p', ['b']);
    e.assertFact('p', ['c']);
    e.commit(h);

    // Post-commit state must match pre-begin + the buffered mutations exactly — no half-applied state.
    const expectedPostCommit = new Engine();
    expectedPostCommit.loadFrom({ version: 2, facts: [
      { predicate: 'p', args: ['a'] },
      { predicate: 'p', args: ['b'] },
      { predicate: 'p', args: ['c'] }
    ], rules: [] });
    expect(e.count(['p', [V('X')]])).toBe(expectedPostCommit.count(['p', [V('X')]]));
    expect(e.factExists('p', ['a'])).toBe(true);
    expect(e.factExists('p', ['b'])).toBe(true);
    expect(e.factExists('p', ['c'])).toBe(true);

    // Inverse property: rolling back to pre-begin via restore returns to exact pre-begin state.
    e.restore(preBegin);
    expect(e.factExists('p', ['b'])).toBe(false);
    expect(e.factExists('p', ['c'])).toBe(false);
    expect(e.factExists('p', ['a'])).toBe(true);
  });
});
