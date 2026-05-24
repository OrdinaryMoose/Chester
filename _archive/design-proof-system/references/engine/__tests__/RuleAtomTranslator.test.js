import { describe, it, expect } from 'vitest';
import {
  tupleAtomToInternal,
  tupleRuleToInternal,
  internalRuleToTuple,
} from '../RuleAtomTranslator.js';

describe('RuleAtomTranslator', () => {
  describe('tupleAtomToInternal — positive atoms', () => {
    it('converts uppercase string to {var} variable', () => {
      const r = tupleAtomToInternal(['p', ['X']]);
      expect(r).toEqual({ predicate: 'p', arity: 1, args: [{ var: 'X' }], negated: false });
    });
    it('passes wildcard through unchanged', () => {
      const r = tupleAtomToInternal(['p', ['_']]);
      expect(r).toEqual({ predicate: 'p', arity: 1, args: ['_'], negated: false });
    });
    it('passes ground constants through unchanged (string, number, underscore-prefixed)', () => {
      const r = tupleAtomToInternal(['p', ['hello', 42, '_foo']]);
      expect(r.args).toEqual(['hello', 42, '_foo']);
    });
    it('computes arity from args length', () => {
      expect(tupleAtomToInternal(['p', []]).arity).toBe(0);
      expect(tupleAtomToInternal(['p', ['a', 'b', 'c']]).arity).toBe(3);
    });
  });

  describe('tupleAtomToInternal — negation wrapper', () => {
    it('unwraps ["not", atom] and sets negated:true', () => {
      const r = tupleAtomToInternal(['not', ['p', ['X']]]);
      expect(r).toEqual({ predicate: 'p', arity: 1, args: [{ var: 'X' }], negated: true });
    });
    it('rejects doubly-nested negation as MALFORMED_RULE', () => {
      expect(() => tupleAtomToInternal(['not', ['not', ['p', ['X']]]])).toThrow(
        expect.objectContaining({ code: 'MALFORMED_RULE' })
      );
    });
  });

  describe('tupleAtomToInternal — malformed input', () => {
    it.each([
      ['non-array atom', 'not-an-array'],
      ['non-string predicate', [42, []]],
      ['null in args', ['p', [null]]],
      ['undefined in args', ['p', [undefined]]],
      ['non-array args', ['p', 'not-args']],
    ])('throws MALFORMED_RULE: %s', (_, bad) => {
      expect(() => tupleAtomToInternal(bad)).toThrow(
        expect.objectContaining({ code: 'MALFORMED_RULE', stage: 'translator' })
      );
    });
  });

  describe('tupleRuleToInternal', () => {
    it('translates a full rule with mixed atom kinds', () => {
      const r = tupleRuleToInternal(
        'r1',
        ['p', ['X']],
        [['q', ['X']], ['not', ['r', ['X']]]],
        { source: 'test' }
      );
      expect(r.ruleId).toBe('r1');
      expect(r.head).toEqual({ predicate: 'p', arity: 1, args: [{ var: 'X' }] });
      expect(r.body).toHaveLength(2);
      expect(r.body[0].negated).toBe(false);
      expect(r.body[1].negated).toBe(true);
      expect(r.metadata).toEqual({ source: 'test' });
    });

    it('head atom carries no negated field', () => {
      const r = tupleRuleToInternal('r1', ['p', ['X']], [['q', ['X']]], {});
      expect('negated' in r.head).toBe(false);
    });

    it('rejects ["not", ...] as head with MALFORMED_RULE', () => {
      expect(() => tupleRuleToInternal('r1', ['not', ['p', ['X']]], [['q', ['X']]], {})).toThrow(
        expect.objectContaining({ code: 'MALFORMED_RULE', stage: 'translator', field: 'head' })
      );
    });

    it('preserves metadata reference', () => {
      const meta = { kind: 'inference' };
      const r = tupleRuleToInternal('r1', ['p', ['X']], [['q', ['X']]], meta);
      expect(r.metadata).toBe(meta);
    });
  });

  describe('internalRuleToTuple', () => {
    it('returns tuple form with bare uppercase variables, ["not"] wrapper for negated', () => {
      const internal = {
        ruleId: 'r1',
        head: { predicate: 'p', arity: 1, args: [{ var: 'X' }] },
        body: [
          { predicate: 'q', arity: 1, args: [{ var: 'X' }], negated: false },
          { predicate: 'r', arity: 1, args: [{ var: 'X' }], negated: true },
        ],
        metadata: { source: 'test' },
      };
      const tuple = internalRuleToTuple(internal);
      expect(tuple).toEqual({
        ruleId: 'r1',
        headAtom: ['p', ['X']],
        bodyAtoms: [['q', ['X']], ['not', ['r', ['X']]]],
        metadata: { source: 'test' },
      });
    });
  });

  describe('round-trip fidelity', () => {
    it('internalRuleToTuple ∘ tupleRuleToInternal is identity for valid rules', () => {
      const original = {
        ruleId: 'r1',
        headAtom: ['p', ['X', 'Y']],
        bodyAtoms: [['q', ['X', '_']], ['not', ['r', ['Y']]]],
        metadata: { source: 'test' },
      };
      const internal = tupleRuleToInternal(
        original.ruleId, original.headAtom, original.bodyAtoms, original.metadata
      );
      const roundTripped = internalRuleToTuple(internal);
      expect(roundTripped).toEqual(original);
    });
  });
});
