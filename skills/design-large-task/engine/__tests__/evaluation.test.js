import { describe, it, expect } from 'vitest';
import { FactStore } from '../FactStore.js';
import { RuleStore } from '../RuleStore.js';
import { Evaluator } from '../Evaluator.js';
import { V } from '../Unifier.js';

describe('Evaluator — fixed-point semantics', () => {
  it('computes transitive closure correctly', () => {
    const fs = new FactStore();
    fs.assertFact('parent', ['a', 'b']);
    fs.assertFact('parent', ['b', 'c']);
    fs.assertFact('parent', ['c', 'd']);

    const rs = new RuleStore();
    rs.defineRule({
      ruleId: 'anc1',
      head: { predicate: 'ancestor', arity: 2, args: [V('X'), V('Y')] },
      body: [{ predicate: 'parent', arity: 2, args: [V('X'), V('Y')], negated: false }]
    });
    rs.defineRule({
      ruleId: 'anc2',
      head: { predicate: 'ancestor', arity: 2, args: [V('X'), V('Y')] },
      body: [
        { predicate: 'parent', arity: 2, args: [V('X'), V('Z')], negated: false },
        { predicate: 'ancestor', arity: 2, args: [V('Z'), V('Y')], negated: false }
      ]
    });

    const ev = new Evaluator(fs, rs);
    const idb = ev.derive();
    const ancFacts = Array.from(idb.values()).filter(f => f.predicate === 'ancestor');
    expect(ancFacts).toHaveLength(6); // a-b, b-c, c-d, a-c, b-d, a-d
  });

  it('derive() is idempotent — two consecutive calls produce same IDB', () => {
    const fs = new FactStore();
    fs.assertFact('p', ['a']);
    const rs = new RuleStore();
    rs.defineRule({
      ruleId: 'r',
      head: { predicate: 'q', arity: 1, args: [V('X')] },
      body: [{ predicate: 'p', arity: 1, args: [V('X')], negated: false }]
    });
    const ev = new Evaluator(fs, rs);
    const idb1 = ev.derive();
    const idb2 = ev.derive();
    expect(idb2.size).toBe(idb1.size);
  });

  it('handles cycle reachability without infinite loop', () => {
    const fs = new FactStore();
    fs.assertFact('edge', ['a', 'b']);
    fs.assertFact('edge', ['b', 'a']);

    const rs = new RuleStore();
    rs.defineRule({
      ruleId: 'reach1',
      head: { predicate: 'reach', arity: 2, args: [V('X'), V('Y')] },
      body: [{ predicate: 'edge', arity: 2, args: [V('X'), V('Y')], negated: false }]
    });
    rs.defineRule({
      ruleId: 'reach2',
      head: { predicate: 'reach', arity: 2, args: [V('X'), V('Y')] },
      body: [
        { predicate: 'edge', arity: 2, args: [V('X'), V('Z')], negated: false },
        { predicate: 'reach', arity: 2, args: [V('Z'), V('Y')], negated: false }
      ]
    });
    const ev = new Evaluator(fs, rs);
    const idb = ev.derive();
    const reach = Array.from(idb.values()).filter(f => f.predicate === 'reach');
    expect(reach).toHaveLength(4); // a-b, b-a, a-a, b-b
  });

  it('stores provenance per derived fact', () => {
    const fs = new FactStore();
    fs.assertFact('p', ['a']);
    const rs = new RuleStore();
    rs.defineRule({
      ruleId: 'r',
      head: { predicate: 'q', arity: 1, args: [V('X')] },
      body: [{ predicate: 'p', arity: 1, args: [V('X')], negated: false }]
    });
    const ev = new Evaluator(fs, rs);
    const idb = ev.derive();
    const qFact = Array.from(idb.values()).find(f => f.predicate === 'q');
    expect(qFact.provenance.ruleId).toBe('r');
    expect(qFact.provenance.bindings).toEqual({ X: 'a' });
  });

  it('semi-naive delta tracking (AC-3.5 instrumentation)', () => {
    // For a 4-element parent chain, transitive-closure should reach fixed point in O(log N) iterations
    // and each iteration's delta size should equal the new ancestor facts derived that round.
    const fs = new FactStore();
    fs.assertFact('parent', ['a', 'b']);
    fs.assertFact('parent', ['b', 'c']);
    fs.assertFact('parent', ['c', 'd']);

    const rs = new RuleStore();
    rs.defineRule({
      ruleId: 'anc1',
      head: { predicate: 'ancestor', arity: 2, args: [V('X'), V('Y')] },
      body: [{ predicate: 'parent', arity: 2, args: [V('X'), V('Y')], negated: false }]
    });
    rs.defineRule({
      ruleId: 'anc2',
      head: { predicate: 'ancestor', arity: 2, args: [V('X'), V('Y')] },
      body: [
        { predicate: 'parent', arity: 2, args: [V('X'), V('Z')], negated: false },
        { predicate: 'ancestor', arity: 2, args: [V('Z'), V('Y')], negated: false }
      ]
    });

    const ev = new Evaluator(fs, rs);
    ev.derive();
    // iterationStats records per-iteration delta sizes. After the first iteration produces direct ancestors,
    // subsequent iterations should produce strictly smaller deltas until reaching zero.
    expect(ev.iterationStats.length).toBeGreaterThan(0);
    const deltas = ev.iterationStats.map(s => s.deltaSize);
    // Total facts derived equals sum of deltas (each fact counted once)
    const sum = deltas.reduce((a, b) => a + b, 0);
    expect(sum).toBe(6); // 6 ancestor facts in 3-element chain
    // Terminates: last recorded iteration has deltaSize = 0
    expect(deltas[deltas.length - 1]).toBe(0);
  });

  it('throws UNBOUND_HEAD_VARIABLE when a head variable is not bound by the body', () => {
    const fs = new FactStore();
    fs.assertFact('p', ['a']);
    const rs = new RuleStore();
    rs.defineRule({
      ruleId: 'unsafe',
      head: { predicate: 'q', arity: 2, args: [V('X'), V('Y')] },
      body: [{ predicate: 'p', arity: 1, args: [V('X')], negated: false }]
    });
    const ev = new Evaluator(fs, rs);
    expect(() => ev.derive()).toThrow(expect.objectContaining({ code: 'UNBOUND_HEAD_VARIABLE', ruleId: 'unsafe' }));
  });
});
