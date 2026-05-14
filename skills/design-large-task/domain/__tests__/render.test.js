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
});
