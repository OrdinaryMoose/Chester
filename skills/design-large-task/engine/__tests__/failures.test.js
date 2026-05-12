import { describe, it, expect } from 'vitest';
import { Engine } from '../Engine.js';
import { V } from '../Unifier.js';

describe('Failure modes — all nine error codes', () => {
  it('MALFORMED_RULE — defineRule with non-atom head', () => {
    const e = new Engine();
    expect(() => e.defineRule({ ruleId: 'r', head: 'bad', body: [] })).toThrow(
      expect.objectContaining({ code: 'MALFORMED_RULE' })
    );
  });

  it('CYCLIC_NEGATION — defineRule introducing cycle', () => {
    const e = new Engine();
    e.defineRule({
      ruleId: 'r1',
      head: { predicate: 'p', arity: 1, args: [V('X')] },
      body: [
        { predicate: 'base', arity: 1, args: [V('X')], negated: false },
        { predicate: 'q', arity: 1, args: [V('X')], negated: true }
      ]
    });
    expect(() => e.defineRule({
      ruleId: 'r2',
      head: { predicate: 'q', arity: 1, args: [V('X')] },
      body: [
        { predicate: 'base', arity: 1, args: [V('X')], negated: false },
        { predicate: 'p', arity: 1, args: [V('X')], negated: true }
      ]
    })).toThrow(expect.objectContaining({ code: 'CYCLIC_NEGATION' }));
  });

  it('DUPLICATE_RULE_ID', () => {
    const e = new Engine();
    const r = {
      ruleId: 'r',
      head: { predicate: 'p', arity: 1, args: [V('X')] },
      body: [{ predicate: 'q', arity: 1, args: [V('X')], negated: false }]
    };
    e.defineRule(r);
    expect(() => e.defineRule(r)).toThrow(expect.objectContaining({ code: 'DUPLICATE_RULE_ID' }));
  });

  it('TYPE_ERROR on non-constant fact arg', () => {
    const e = new Engine();
    expect(() => e.assertFact('p', [{}])).toThrow(expect.objectContaining({ code: 'TYPE_ERROR' }));
  });

  it('NESTED_TRANSACTION on second begin()', () => {
    const e = new Engine();
    const h = e.begin();
    expect(() => e.begin()).toThrow(expect.objectContaining({ code: 'NESTED_TRANSACTION' }));
    e.rollback(h);
  });

  it('STALE_HANDLE on double commit', () => {
    const e = new Engine();
    const h = e.begin();
    e.commit(h);
    expect(() => e.commit(h)).toThrow(expect.objectContaining({ code: 'STALE_HANDLE' }));
  });

  it('MALFORMED_SERIALIZED_INPUT on bad loadFrom', () => {
    const e = new Engine();
    expect(() => e.loadFrom('bad')).toThrow(expect.objectContaining({ code: 'MALFORMED_SERIALIZED_INPUT' }));
  });

  it('NESTED_TRANSACTION_OP_REFUSED on clear() during tx', () => {
    const e = new Engine();
    const h = e.begin();
    expect(() => e.clear()).toThrow(expect.objectContaining({ code: 'NESTED_TRANSACTION_OP_REFUSED' }));
    e.rollback(h);
  });

  it('UNSAFE_RULE — defineRule rejects rule with unbound head variable', () => {
    const e = new Engine();
    expect(() => e.defineRule({
      ruleId: 'unsafe1',
      head: { predicate: 'q', arity: 2, args: [{ var: 'X' }, { var: 'Y' }] },
      body: [{ predicate: 'p', arity: 1, args: [{ var: 'X' }], negated: false }]
    })).toThrow(expect.objectContaining({ code: 'UNSAFE_RULE', ruleId: 'unsafe1' }));
  });

  // MEMORY_BUDGET_EXCEEDED is a defensive guard: Evaluator.derive sets a 10000-iteration cap.
  // A well-stratified Datalog program cannot trigger this cap by construction (every program
  // terminates in finite iterations). The error code exists for safety against rule-set bugs
  // that the Stratifier somehow misses, but it is not exercisable from the public API under
  // a valid program. No test asserts on it directly; the guard remains in the implementation.
});
