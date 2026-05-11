import { describe, it, expect } from 'vitest';
import { FactStore } from '../FactStore.js';
import { stratify } from '../Stratifier.js';

describe('FactStore', () => {
  it('assertFact stores and exposes a fact via factExists', () => {
    const fs = new FactStore();
    fs.assertFact('p', ['a', 'b']);
    expect(fs.factExists('p', ['a', 'b'])).toBe(true);
    expect(fs.factExists('p', ['x', 'y'])).toBe(false);
  });

  it('assertFact is idempotent (no duplicate)', () => {
    const fs = new FactStore();
    fs.assertFact('p', ['a', 'b']);
    fs.assertFact('p', ['a', 'b']);
    expect(fs.allFacts('p', 2)).toHaveLength(1);
  });

  it('retractFact removes a fact', () => {
    const fs = new FactStore();
    fs.assertFact('p', ['a', 'b']);
    fs.retractFact('p', ['a', 'b']);
    expect(fs.factExists('p', ['a', 'b'])).toBe(false);
  });

  it('retractFact on absent fact is idempotent', () => {
    const fs = new FactStore();
    expect(() => fs.retractFact('p', ['a', 'b'])).not.toThrow();
  });

  it('treats predicate arity as part of identity', () => {
    const fs = new FactStore();
    fs.assertFact('p', ['a', 'b']);
    fs.assertFact('p', ['a', 'b', 'c']);
    expect(fs.allFacts('p', 2)).toHaveLength(1);
    expect(fs.allFacts('p', 3)).toHaveLength(1);
  });

  it('rejects non-constant arguments with TYPE_ERROR', () => {
    const fs = new FactStore();
    expect(() => fs.assertFact('p', [{}])).toThrow(expect.objectContaining({ code: 'TYPE_ERROR' }));
    expect(() => fs.assertFact('p', [() => {}])).toThrow(expect.objectContaining({ code: 'TYPE_ERROR' }));
    expect(() => fs.assertFact('p', [undefined])).toThrow(expect.objectContaining({ code: 'TYPE_ERROR' }));
    expect(() => fs.assertFact('p', [NaN])).toThrow(expect.objectContaining({ code: 'TYPE_ERROR' }));
    expect(() => fs.assertFact('p', [Infinity])).toThrow(expect.objectContaining({ code: 'TYPE_ERROR' }));
    expect(() => fs.assertFact('p', [-Infinity])).toThrow(expect.objectContaining({ code: 'TYPE_ERROR' }));
  });

  it('accepts string, number, boolean, null as constants', () => {
    const fs = new FactStore();
    expect(() => fs.assertFact('p', ['s', 1, true, null])).not.toThrow();
    expect(fs.factExists('p', ['s', 1, true, null])).toBe(true);
  });
});

describe('Stratifier', () => {
  it('assigns stratum 0 to rules with no negated body literals', () => {
    const rules = [
      { ruleId: 'r1', head: { predicate: 'a', arity: 1 }, body: [{ predicate: 'b', arity: 1, negated: false }] }
    ];
    const strata = stratify(rules);
    expect(strata.get('r1')).toBe(0);
  });

  it('assigns higher strata to rules with negated body atoms referring to lower strata', () => {
    const rules = [
      { ruleId: 'r1', head: { predicate: 'a', arity: 1 }, body: [{ predicate: 'b', arity: 1, negated: false }] },
      { ruleId: 'r2', head: { predicate: 'c', arity: 1 }, body: [{ predicate: 'a', arity: 1, negated: true }] }
    ];
    const strata = stratify(rules);
    expect(strata.get('r1')).toBe(0);
    expect(strata.get('r2')).toBe(1);
  });

  it('rejects cyclic negation with CYCLIC_NEGATION error naming the cycle', () => {
    const rules = [
      { ruleId: 'r1', head: { predicate: 'p', arity: 1 }, body: [{ predicate: 'q', arity: 1, negated: true }] },
      { ruleId: 'r2', head: { predicate: 'q', arity: 1 }, body: [{ predicate: 'p', arity: 1, negated: true }] }
    ];
    expect(() => stratify(rules)).toThrow(expect.objectContaining({ code: 'CYCLIC_NEGATION' }));
  });

  it('allows positive recursion (self-reference without negation)', () => {
    const rules = [
      { ruleId: 'r1', head: { predicate: 'a', arity: 2 }, body: [{ predicate: 'a', arity: 2, negated: false }] }
    ];
    expect(() => stratify(rules)).not.toThrow();
  });
});
