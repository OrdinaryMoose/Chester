import { describe, it, expect } from 'vitest';
import { createInMemorySubstrate } from './_fixtures/inMemorySubstrate.js';
import { renderStructuredProof, renderDatalogProjection, renderElementDeep, getProofState } from '../render.js';

describe('render', () => {
  it('renderStructuredProof returns a markdown string', () => {
    const s = createInMemorySubstrate();
    const out = renderStructuredProof({}, { query: s.query, explain: s.explain });
    expect(typeof out).toBe('string');
  });

  it('renderDatalogProjection returns serializable {facts, rules}', () => {
    const s = createInMemorySubstrate();
    s.facts.assertFact('evidence', ['evid_1', 'codebase', 'x']);
    const out = renderDatalogProjection({}, { query: s.query, explain: s.explain });
    expect(out).toHaveProperty('facts');
    expect(out).toHaveProperty('rules');
    expect(() => JSON.stringify(out)).not.toThrow();
  });

  it('getProofState returns a JSON-serializable snapshot', () => {
    const s = createInMemorySubstrate();
    const state = getProofState({}, { query: s.query, explain: s.explain });
    expect(() => JSON.stringify(state)).not.toThrow();
  });

  it('renderElementDeep returns null for unknown id', () => {
    const s = createInMemorySubstrate();
    const out = renderElementDeep({ id: 'unknown_42' }, { query: s.query, explain: s.explain });
    expect(out).toBeNull();
  });

  it('AC-7.1: renderStructuredProof emits Collapse test / Reasoning / Rejected alternatives lines per proposition', () => {
    const s = createInMemorySubstrate();
    s.facts.assertFact('proposition', ['prop_1', 'P1 statement']);
    s.facts.assertFact('collapse_test', ['prop_1', 'CT text']);
    s.facts.assertFact('reasoning_chain', ['prop_1', 'RC text']);
    s.facts.assertFact('rejected_alternative', ['prop_1', 'A1', 'R1']);
    const out = renderStructuredProof({}, { query: s.query, explain: s.explain });
    expect(out).toContain('P1 statement');
    expect(out).toContain('Collapse test: CT text');
    expect(out).toContain('Reasoning: RC text');
    expect(out).toContain('Rejected alternatives:');
    expect(out).toContain('A1');
    expect(out).toContain('R1');
  });

  it('AC-7.2: renderStructuredProof omits Rejected alternatives block when no alternatives exist', () => {
    const s = createInMemorySubstrate();
    s.facts.assertFact('proposition', ['prop_1', 'P1 statement']);
    s.facts.assertFact('collapse_test', ['prop_1', 'CT text']);
    s.facts.assertFact('reasoning_chain', ['prop_1', 'RC text']);
    const out = renderStructuredProof({}, { query: s.query, explain: s.explain });
    expect(out).toContain('Reasoning: RC text');
    expect(out).not.toContain('Rejected alternatives:');
  });

  it('AC-7.3: renderStructuredProof omits a line gracefully when the corresponding fact is absent', () => {
    const s = createInMemorySubstrate();
    s.facts.assertFact('proposition', ['prop_1', 'P1 statement']);
    const out = renderStructuredProof({}, { query: s.query, explain: s.explain });
    expect(out).toContain('P1 statement');
    expect(out).not.toContain('Collapse test:');
    expect(out).not.toContain('Reasoning:');
    expect(out).not.toContain('Rejected alternatives:');
  });

  it('AC-4.2: renderDatalogProjection includes reasoning_chain and rejected_alternative predicates', () => {
    const s = createInMemorySubstrate();
    s.facts.assertFact('reasoning_chain', ['prop_1', 'RC text']);
    s.facts.assertFact('rejected_alternative', ['prop_1', 'A1', 'R1']);
    s.facts.assertFact('rejected_alternative', ['prop_1', 'A2', 'R2']);
    const out = renderDatalogProjection({}, { query: s.query, explain: s.explain });
    const reasoningFacts = out.facts.filter(f => f[0] === 'reasoning_chain');
    const rejectedFacts = out.facts.filter(f => f[0] === 'rejected_alternative');
    expect(reasoningFacts).toEqual([['reasoning_chain', ['prop_1', 'RC text']]]);
    expect(rejectedFacts).toEqual([
      ['rejected_alternative', ['prop_1', 'A1', 'R1']],
      ['rejected_alternative', ['prop_1', 'A2', 'R2']],
    ]);
  });
});
