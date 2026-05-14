import { describe, it, expect } from 'vitest';
import { unify, V, WILDCARD } from '../Unifier.js';

describe('Unifier.unify', () => {
  it('matches ground pattern (all constants)', () => {
    const bindings = unify([1, 'a', true], [1, 'a', true]);
    expect(bindings).toEqual({});
  });

  it('returns null when ground pattern does not match', () => {
    expect(unify([1, 'a'], [2, 'a'])).toBeNull();
  });

  it('binds variables', () => {
    const bindings = unify([V('X'), V('Y')], ['a', 'b']);
    expect(bindings).toEqual({ X: 'a', Y: 'b' });
  });

  it('mixed pattern: returns bindings for variables, constants must match', () => {
    expect(unify(['a', V('X')], ['a', 'b'])).toEqual({ X: 'b' });
    expect(unify(['a', V('X')], ['c', 'b'])).toBeNull();
  });

  it('wildcard matches anything without binding', () => {
    expect(unify([WILDCARD, V('X')], ['a', 'b'])).toEqual({ X: 'b' });
  });

  it('repeated variable name in pattern requires equal values', () => {
    expect(unify([V('X'), V('X')], ['a', 'a'])).toEqual({ X: 'a' });
    expect(unify([V('X'), V('X')], ['a', 'b'])).toBeNull();
  });
});

import { Engine } from '../Engine.js';
import { defineRuleObj } from './helpers/defineRuleObj.js';

describe('Engine — facade & auto-derive', () => {
  it('isDerived transitions correctly', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    expect(e.isDerived()).toBe(false);
    e.derive();
    expect(e.isDerived()).toBe(true);
    e.assertFact('p', ['b']);
    expect(e.isDerived()).toBe(false);
  });

  it('query auto-derives when state is non-derived', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    defineRuleObj(e, {
      ruleId: 'r',
      head: { predicate: 'q', arity: 1, args: [V('X')] },
      body: [{ predicate: 'p', arity: 1, args: [V('X')], negated: false }]
    });
    // No explicit derive() — query should trigger it.
    const result = e.query(['q', [V('X')]]);
    expect(result).toEqual([{ X: 'a' }]);
  });

  it('count and exists are consistent with query', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    e.assertFact('p', ['b']);
    const q = e.query(['p', [V('X')]]);
    expect(e.count(['p', [V('X')]])).toBe(q.length);
    expect(e.exists(['p', [V('X')]])).toBe(q.length > 0);
    expect(e.exists(['p', ['nonexistent']])).toBe(false);
  });

  it('retracting a base fact cascades — derived dependent disappears after next derive', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    defineRuleObj(e, {
      ruleId: 'r',
      head: { predicate: 'q', arity: 1, args: [V('X')] },
      body: [{ predicate: 'p', arity: 1, args: [V('X')], negated: false }]
    });
    expect(e.query(['q', [V('X')]])).toEqual([{ X: 'a' }]);
    e.retractFact('p', ['a']);
    expect(e.query(['q', [V('X')]])).toEqual([]);
  });

  it('undefineRule cascades — facts derived only by that rule disappear', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    defineRuleObj(e, {
      ruleId: 'r',
      head: { predicate: 'q', arity: 1, args: [V('X')] },
      body: [{ predicate: 'p', arity: 1, args: [V('X')], negated: false }]
    });
    expect(e.query(['q', [V('X')]])).toHaveLength(1);
    e.undefineRule('r');
    expect(e.query(['q', [V('X')]])).toEqual([]);
  });

  it('query supports ground patterns (returns [{}] or [])', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    expect(e.query(['p', ['a']])).toEqual([{}]);
    expect(e.query(['p', ['b']])).toEqual([]);
  });
});
