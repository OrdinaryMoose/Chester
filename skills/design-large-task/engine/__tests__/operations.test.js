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

import { RuleStore } from '../RuleStore.js';

describe('RuleStore', () => {
  const r1 = {
    ruleId: 'r1',
    head: { predicate: 'q', arity: 1, args: [{ var: 'X' }] },
    body: [{ predicate: 'p', arity: 2, args: [{ var: 'X' }, { var: 'Y' }], negated: false }],
    metadata: { domain_concept: 'test' }
  };

  it('defineRule stores a rule retrievable via getRule', () => {
    const rs = new RuleStore();
    rs.defineRule(r1);
    const got = rs.getRule('r1');
    expect(got.head).toEqual(r1.head);
    expect(got.body).toEqual(r1.body);
    expect(got.metadata).toEqual(r1.metadata);
  });

  it('defineRule rejects duplicate ruleId with DUPLICATE_RULE_ID', () => {
    const rs = new RuleStore();
    rs.defineRule(r1);
    expect(() => rs.defineRule(r1)).toThrow(expect.objectContaining({ code: 'DUPLICATE_RULE_ID' }));
  });

  it('defineRule rejects malformed head with MALFORMED_RULE', () => {
    const rs = new RuleStore();
    expect(() => rs.defineRule({ ruleId: 'bad', head: 'not-an-object', body: [] })).toThrow(
      expect.objectContaining({ code: 'MALFORMED_RULE' })
    );
  });

  it('defineRule rejects body atom with wrong shape', () => {
    const rs = new RuleStore();
    expect(() => rs.defineRule({
      ruleId: 'bad',
      head: r1.head,
      body: ['not-an-atom']
    })).toThrow(expect.objectContaining({ code: 'MALFORMED_RULE' }));
  });

  it('undefineRule removes a rule', () => {
    const rs = new RuleStore();
    rs.defineRule(r1);
    rs.undefineRule('r1');
    expect(rs.getRule('r1')).toBeUndefined();
  });

  it('undefineRule on non-existent id is idempotent', () => {
    const rs = new RuleStore();
    expect(() => rs.undefineRule('nonexistent')).not.toThrow();
  });

  it('defineRule runs stratification check and rejects cyclic negation', () => {
    const rs = new RuleStore();
    rs.defineRule({
      ruleId: 'r1',
      head: { predicate: 'p', arity: 1, args: [{ var: 'X' }] },
      body: [
        { predicate: 'base', arity: 1, args: [{ var: 'X' }], negated: false },
        { predicate: 'q', arity: 1, args: [{ var: 'X' }], negated: true }
      ]
    });
    expect(() => rs.defineRule({
      ruleId: 'r2',
      head: { predicate: 'q', arity: 1, args: [{ var: 'X' }] },
      body: [
        { predicate: 'base', arity: 1, args: [{ var: 'X' }], negated: false },
        { predicate: 'p', arity: 1, args: [{ var: 'X' }], negated: true }
      ]
    })).toThrow(expect.objectContaining({ code: 'CYCLIC_NEGATION' }));
    expect(rs.getRule('r2')).toBeUndefined();
  });

  it('allRules returns the full rule list', () => {
    const rs = new RuleStore();
    rs.defineRule(r1);
    rs.defineRule({ ...r1, ruleId: 'r2' });
    expect(rs.allRules()).toHaveLength(2);
  });

  it('rulesByStratum groups rules by computed stratum', () => {
    const rs = new RuleStore();
    rs.defineRule({
      ruleId: 'base',
      head: { predicate: 'a', arity: 1, args: [{ var: 'X' }] },
      body: [{ predicate: 'b', arity: 1, args: [{ var: 'X' }], negated: false }]
    });
    rs.defineRule({
      ruleId: 'neg',
      head: { predicate: 'c', arity: 1, args: [{ var: 'X' }] },
      body: [
        { predicate: 'b', arity: 1, args: [{ var: 'X' }], negated: false },
        { predicate: 'a', arity: 1, args: [{ var: 'X' }], negated: true }
      ]
    });
    const byStratum = rs.rulesByStratum();
    expect(byStratum.get(0).map((r) => r.ruleId)).toEqual(['base']);
    expect(byStratum.get(1).map((r) => r.ruleId)).toEqual(['neg']);
    expect(rs.stratumOf('base')).toBe(0);
    expect(rs.stratumOf('neg')).toBe(1);
  });

  it('defineRule rejects unsafe rules with UNSAFE_RULE (head var not bound by non-negated body)', () => {
    const rs1 = new RuleStore();
    // Case 1: q(X, Y) :- p(X)  — head variable Y appears nowhere in the body
    const unsafe1 = {
      ruleId: 'r1',
      head: { predicate: 'q', arity: 2, args: [{ var: 'X' }, { var: 'Y' }] },
      body: [{ predicate: 'p', arity: 1, args: [{ var: 'X' }], negated: false }]
    };
    expect(() => rs1.defineRule(unsafe1)).toThrow(
      expect.objectContaining({
        code: 'UNSAFE_RULE',
        ruleId: 'r1',
        unboundVars: ['Y']
      })
    );
    expect(rs1.getRule('r1')).toBeUndefined();

    // Case 2: q(X) :- ¬p(X)  — head variable X appears only in a negated body atom (does not count as bound)
    const rs2 = new RuleStore();
    const unsafe2 = {
      ruleId: 'r2',
      head: { predicate: 'q', arity: 1, args: [{ var: 'X' }] },
      body: [{ predicate: 'p', arity: 1, args: [{ var: 'X' }], negated: true }]
    };
    expect(() => rs2.defineRule(unsafe2)).toThrow(
      expect.objectContaining({
        code: 'UNSAFE_RULE',
        ruleId: 'r2',
        unboundVars: ['X']
      })
    );
    expect(rs2.getRule('r2')).toBeUndefined();
  });
});
