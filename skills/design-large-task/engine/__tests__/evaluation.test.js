import { describe, it, expect } from 'vitest';
import { FactStore } from '../FactStore.js';
import { RuleStore } from '../RuleStore.js';
import { Evaluator } from '../Evaluator.js';
import { Engine } from '../Engine.js';
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

});

describe('Canonical Datalog programs', () => {
  it('stratified negation — same-generation cousins (canonical AC-9.1)', () => {
    // Build a family tree with same-generation pairs to detect.
    //   a is root; b and c are children of a; d is child of b; e is child of c.
    //   Same-generation pairs (sharing a common ancestor, neither an ancestor of the other):
    //     b/c (both children of a) and d/e (both grandchildren of a).
    const e = new Engine();
    e.assertFact('parent', ['a', 'b']);
    e.assertFact('parent', ['a', 'c']);
    e.assertFact('parent', ['b', 'd']);
    e.assertFact('parent', ['c', 'e']);

    e.defineRule({
      ruleId: 'anc1',
      head: { predicate: 'ancestor', arity: 2, args: [V('X'), V('Y')] },
      body: [{ predicate: 'parent', arity: 2, args: [V('X'), V('Y')], negated: false }]
    });
    e.defineRule({
      ruleId: 'anc2',
      head: { predicate: 'ancestor', arity: 2, args: [V('X'), V('Y')] },
      body: [
        { predicate: 'parent', arity: 2, args: [V('X'), V('Z')], negated: false },
        { predicate: 'ancestor', arity: 2, args: [V('Z'), V('Y')], negated: false }
      ]
    });
    // same_gen(X, Y) :- ancestor(Z, X), ancestor(Z, Y), ¬ancestor(X, Y), ¬ancestor(Y, X)
    // Tests two-sided mutual-exclusion negation per spec AC-9.1.
    e.defineRule({
      ruleId: 'same_gen',
      head: { predicate: 'same_gen', arity: 2, args: [V('X'), V('Y')] },
      body: [
        { predicate: 'ancestor', arity: 2, args: [V('Z'), V('X')], negated: false },
        { predicate: 'ancestor', arity: 2, args: [V('Z'), V('Y')], negated: false },
        { predicate: 'ancestor', arity: 2, args: [V('X'), V('Y')], negated: true },
        { predicate: 'ancestor', arity: 2, args: [V('Y'), V('X')], negated: true }
      ]
    });

    const pairs = e.query(['same_gen', [V('X'), V('Y')]])
      .map(b => [b.X, b.Y].sort().join('-'))
      .sort()
      .filter((v, i, arr) => arr.indexOf(v) === i); // dedup ordered-pair vs unordered-pair
    // Expected unordered pairs: b-c (children of a) and d-e (grandchildren of a)
    expect(pairs).toContain('b-c');
    expect(pairs).toContain('d-e');
  });

  it('determinism: same program, two engines, same results', () => {
    const program = (engine) => {
      engine.assertFact('p', ['a']);
      engine.assertFact('p', ['b']);
      engine.defineRule({
        ruleId: 'r',
        head: { predicate: 'q', arity: 1, args: [V('X')] },
        body: [{ predicate: 'p', arity: 1, args: [V('X')], negated: false }]
      });
    };
    const e1 = new Engine(); program(e1);
    const e2 = new Engine(); program(e2);
    expect(e1.query(['q', [V('X')]]).sort()).toEqual(e2.query(['q', [V('X')]]).sort());
  });

  it('insertion-order independence: facts in different orders produce same fixed point', () => {
    const e1 = new Engine();
    const e2 = new Engine();
    e1.assertFact('p', ['a']);
    e1.assertFact('p', ['b']);
    e2.assertFact('p', ['b']);
    e2.assertFact('p', ['a']);
    const r = {
      ruleId: 'r',
      head: { predicate: 'q', arity: 1, args: [V('X')] },
      body: [{ predicate: 'p', arity: 1, args: [V('X')], negated: false }]
    };
    e1.defineRule(r); e2.defineRule(r);
    const result1 = e1.query(['q', [V('X')]]).map(b => b.X).sort();
    const result2 = e2.query(['q', [V('X')]]).map(b => b.X).sort();
    expect(result1).toEqual(result2);
  });

  it('negation interacting with retraction (AC-9.4)', () => {
    const e = new Engine();
    e.assertFact('parent', ['a', 'b']);
    e.assertFact('node', ['a']);
    e.assertFact('node', ['b']);
    e.defineRule({
      ruleId: 'anc1',
      head: { predicate: 'ancestor', arity: 2, args: [V('X'), V('Y')] },
      body: [{ predicate: 'parent', arity: 2, args: [V('X'), V('Y')], negated: false }]
    });
    e.defineRule({
      ruleId: 'leaf',
      head: { predicate: 'leaf', arity: 1, args: [V('X')] },
      body: [
        { predicate: 'node', arity: 1, args: [V('X')], negated: false },
        { predicate: 'ancestor', arity: 2, args: [V('X'), V('Y')], negated: true }
      ]
    });
    expect(e.query(['leaf', [V('X')]]).map(b => b.X).sort()).toEqual(['b']);
    e.retractFact('parent', ['a', 'b']);
    expect(e.query(['leaf', [V('X')]]).map(b => b.X).sort()).toEqual(['a', 'b']);
  });
});
