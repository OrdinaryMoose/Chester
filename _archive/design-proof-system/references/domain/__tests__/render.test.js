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

  it('AC-5.3: PROJECTION_ARITIES.risk is arity 3 (severity preserved in projection)', () => {
    const s = createInMemorySubstrate();
    s.facts.assertFact('risk', ['risk_1', 'R statement', 'high']);
    const out = renderDatalogProjection({}, { query: s.query, explain: s.explain });
    // Find the risk fact tuple — must include the severity (third positional)
    const riskTuple = out.facts.find(f => f[0] === 'risk');
    expect(riskTuple).toBeDefined();
    expect(riskTuple[1]).toEqual(['risk_1', 'R statement', 'high']);
  });

  it('AC-5.2: PROJECTION_ARITIES includes permission/3, permission_scope/2, risk_basis/2', () => {
    const s = createInMemorySubstrate();
    s.facts.assertFact('permission', ['perm_1', 'P statement', 'rule_1']);
    s.facts.assertFact('permission_scope', ['perm_1', 'top-level only']);
    s.facts.assertFact('risk_basis', ['risk_1', 'evid_1']);
    const out = renderDatalogProjection({}, { query: s.query, explain: s.explain });
    expect(out.facts.some(f => f[0] === 'permission' && f[1][2] === 'rule_1')).toBe(true);
    expect(out.facts.some(f => f[0] === 'permission_scope' && f[1][1] === 'top-level only')).toBe(true);
    expect(out.facts.some(f => f[0] === 'risk_basis')).toBe(true);
  });

  it('AC-5.5: renderElementDeep on a RISK id returns a record at arity 3 (was null when _ARITIES.risk was 2)', () => {
    const s = createInMemorySubstrate();
    s.facts.assertFact('risk', ['risk_1', 'R statement', 'high']);
    const out = renderElementDeep({ id: 'risk_1' }, { query: s.query, explain: s.explain });
    expect(out).not.toBeNull();
    expect(out.predicate).toBe('risk');
  });

  it('AC-7.1/AC-7.2 (positive): renderStructuredProof emits Relieves and optional Scope sub-lines per permission', () => {
    const s = createInMemorySubstrate();
    s.facts.assertFact('permission_decl', ['perm_1', 'P statement']);
    s.facts.assertFact('permission', ['perm_1', 'P statement', 'rule_2']);
    s.facts.assertFact('permission_scope', ['perm_1', 'top-level only']);
    const out = renderStructuredProof({}, { query: s.query, explain: s.explain });
    expect(out).toContain('P statement');
    expect(out).toMatch(/Relieves: rule_2/);
    expect(out).toContain('Scope: top-level only');
  });

  it('AC-7.3: renderStructuredProof emits Basis sub-line per risk (set-equality on comma-split ids)', () => {
    const s = createInMemorySubstrate();
    s.facts.assertFact('risk', ['risk_1', 'R statement', 'high']);
    s.facts.assertFact('risk_basis', ['risk_1', 'evid_1']);
    s.facts.assertFact('risk_basis', ['risk_1', 'prop_2']);
    const out = renderStructuredProof({}, { query: s.query, explain: s.explain });
    const basisLine = out.split('\n').find(l => l.includes('Basis:'));
    expect(basisLine).toBeDefined();
    // Set-equality per AC-7.3 and Watch-Item 9 — EDB query order is not stable
    const ids = basisLine.replace(/^.*Basis: /, '').split(', ').sort();
    expect(ids).toEqual(['evid_1', 'prop_2'].sort());
  });
});
