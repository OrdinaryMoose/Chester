import { describe, it, expect, vi } from 'vitest';
import { createInMemorySubstrate } from './_fixtures/inMemorySubstrate.js';
import { collapseTest, queryWithout, queryWith } from '../counterfactual.js';

describe('counterfactual', () => {
  it('collapseTest restores state on completion', () => {
    const s = createInMemorySubstrate();
    s.facts.assertFact('approved', ['prop_1', 'designer', 'x']);
    const before = s.snapshot.snapshot();
    collapseTest({ propId: 'prop_1' }, { query: s.query, explain: s.explain, snapshot: s.snapshot, facts: s.facts });
    expect(s.snapshot.snapshot()).toBe(before);
    // Positive: post-restore, the original fact is still present.
    expect(s.facts.factExists('approved', ['prop_1', 'designer', 'x'])).toBe(true);
  });

  it('collapseTest retracts matching facts inside snapshot scope before restore', () => {
    const s = createInMemorySubstrate();
    s.facts.assertFact('approved', ['prop_1', 'designer', 'x']);
    s.facts.assertFact('approved', ['prop_1', 'reviewer', 'y']);
    s.facts.assertFact('approved', ['prop_2', 'designer', 'z']);  // must NOT be retracted

    // Spy on retractFact to confirm the query-then-retract loop hits both prop_1 matches
    // with concrete args (not wildcards).
    const retractSpy = vi.spyOn(s.facts, 'retractFact');
    collapseTest({ propId: 'prop_1' }, { query: s.query, explain: s.explain, snapshot: s.snapshot, facts: s.facts });

    // Two retract calls, both with prop_1 and concrete (non-wildcard) args.
    const prop1Retracts = retractSpy.mock.calls.filter((c) => c[0] === 'approved' && c[1][0] === 'prop_1');
    expect(prop1Retracts.length).toBe(2);
    for (const [, args] of prop1Retracts) {
      expect(args.every((a) => a !== '_')).toBe(true);
    }
    // prop_2 must not have been retracted.
    const prop2Retracts = retractSpy.mock.calls.filter((c) => c[0] === 'approved' && c[1][0] === 'prop_2');
    expect(prop2Retracts.length).toBe(0);

    // After restore, all three original facts are present again.
    expect(s.facts.factExists('approved', ['prop_1', 'designer', 'x'])).toBe(true);
    expect(s.facts.factExists('approved', ['prop_1', 'reviewer', 'y'])).toBe(true);
    expect(s.facts.factExists('approved', ['prop_2', 'designer', 'z'])).toBe(true);
  });

  it('collapseTest restores state on throw mid-call', () => {
    const s = createInMemorySubstrate();
    s.facts.assertFact('approved', ['prop_1', 'designer', 'x']);
    const before = s.snapshot.snapshot();
    const badPorts = {
      query: { query: () => { throw new Error('INJECTED'); }, derive: s.query.derive, exists: s.query.exists, count: s.query.count },
      explain: s.explain, snapshot: s.snapshot, facts: s.facts,
    };
    expect(() => collapseTest({ propId: 'prop_1' }, badPorts)).toThrow(/INJECTED/);
    expect(s.snapshot.snapshot()).toBe(before);
  });

  it('queryWithout lowers wildcards via query-then-retract then restores', () => {
    const s = createInMemorySubstrate();
    s.facts.assertFact('approved', ['prop_1', 'designer', 'x']);
    s.facts.assertFact('approved', ['prop_1', 'reviewer', 'y']);
    const ports = { query: s.query, explain: s.explain, snapshot: s.snapshot, facts: s.facts };

    expect(() => queryWithout({ retract: [['approved', ['prop_1', '_', '_']]], pattern: ['closure_permitted', []] }, ports)).not.toThrow();
    // Restored.
    expect(s.facts.factExists('approved', ['prop_1', 'designer', 'x'])).toBe(true);
    expect(s.facts.factExists('approved', ['prop_1', 'reviewer', 'y'])).toBe(true);
  });

  it('queryWith asserts facts inside snapshot scope and restores', () => {
    const s = createInMemorySubstrate();
    const ports = { query: s.query, explain: s.explain, snapshot: s.snapshot, facts: s.facts };
    expect(() => queryWith({ assert: [['evidence', ['e1', 'src', 'c']]], pattern: ['evidence', [{ var: 'I' }, { var: 'S' }, { var: 'C' }]] }, ports)).not.toThrow();
    // Hypothetical fact does not persist post-restore.
    expect(s.facts.factExists('evidence', ['e1', 'src', 'c'])).toBe(false);
  });
});
