import { describe, it, expect } from 'vitest';
import { buildProvenance, extractMetadata, restructure } from '../restructure.js';

describe('buildProvenance', () => {
  it('builds provenance with non-null reasoning_chain for non-verbatim actions', () => {
    const prov = buildProvenance({
      sourceCitation: 'submission.elements[0].label',
      actionLabel: 'reshape',
      reasoningChain: 'trim whitespace from caller string',
    });
    expect(prov).toEqual({
      source_citation: 'submission.elements[0].label',
      action_label: 'reshape',
      reasoning_chain: 'trim whitespace from caller string',
      field_provenance: [],
    });
  });

  it('allows null reasoning_chain when action is verbatim-preserve', () => {
    const prov = buildProvenance({
      sourceCitation: 'submission.elements[0].label',
      actionLabel: 'verbatim-preserve',
      reasoningChain: null,
    });
    expect(prov.reasoning_chain).toBe(null);
  });

  it('throws when non-verbatim action has null reasoning_chain', () => {
    expect(() => buildProvenance({
      sourceCitation: 'submission.elements[0].label',
      actionLabel: 'reshape',
      reasoningChain: null,
    })).toThrow(/reasoning_chain/);
  });

  it('includes field_provenance array when supplied (smell #2 — per-field detail)', () => {
    const fp = [
      { field_name: 'statement', action_label: 'verbatim-preserve', reasoning_chain: null },
      { field_name: 'source', action_label: 'reshape', reasoning_chain: 'normalized casing' },
    ];
    const prov = buildProvenance({
      sourceCitation: 'submission.elements[0]',
      actionLabel: 'reshape',
      reasoningChain: 'normalized casing',
      fieldProvenance: fp,
    });
    expect(prov.field_provenance).toEqual(fp);
  });

  it('field_provenance defaults to empty array when not supplied', () => {
    const prov = buildProvenance({
      sourceCitation: 'x',
      actionLabel: 'verbatim-preserve',
      reasoningChain: null,
    });
    expect(prov.field_provenance).toEqual([]);
  });
});

describe('extractMetadata', () => {
  it('routes caller fields not in registry to metadata channel keyed by field name', () => {
    const result = extractMetadata({
      callerCandidate: { label: 'Foo', description: 'bar', caller_note: 'extra', author: 'Mike' },
      registryEntry: { required: [{ name: 'label', justification: '' }], optional: ['description'] },
    });
    expect(result).toEqual({ caller_note: 'extra', author: 'Mike' });
  });

  it('returns empty object when no caller fields are unmapped', () => {
    const result = extractMetadata({
      callerCandidate: { label: 'Foo' },
      registryEntry: { required: [{ name: 'label', justification: '' }], optional: [] },
    });
    expect(result).toEqual({});
  });
});

describe('restructure (top-level)', () => {
  it('returns rejection diagnostic when problem_statement absent', () => {
    const result = restructure({});
    expect(result.rejection_diagnostic).toMatch(/problem_statement/);
    expect(result.problem_statement).toBeUndefined();
  });

  it('extracts problem_statement when present', () => {
    const result = restructure({ problem_statement: 'a one-sentence problem.' });
    expect(result.problem_statement).toBe('a one-sentence problem.');
  });

  it('returns admitted/rejected/report shape', () => {
    const result = restructure({
      problem_statement: 'test',
      elements: [
        { category: 'RULE', statement: 'A real rule.', source: 'designer' },
      ],
    });
    expect(Array.isArray(result.admitted)).toBe(true);
    expect(Array.isArray(result.rejected)).toBe(true);
    expect(typeof result.report).toBe('string');
    expect(result.report.length).toBeGreaterThan(0);
  });

  it('admits a candidate with all required fields and assigns labels', () => {
    const result = restructure({
      problem_statement: 'test',
      elements: [
        { category: 'RULE', statement: 'A real rule.', source: 'designer' },
      ],
    });
    expect(result.admitted.length).toBe(1);
    expect(result.admitted[0].restructuring_action_label).toBeDefined();
    expect(result.admitted[0].provenance).toBeDefined();
  });

  it('rejects a candidate with missing required field', () => {
    const result = restructure({
      problem_statement: 'test',
      elements: [
        { category: 'RULE', source: 'designer' },  // missing statement
      ],
    });
    expect(result.rejected.length).toBe(1);
    expect(result.rejected[0].missing_fields).toContain('statement');
  });

  it('routes unknown caller fields into per-element metadata', () => {
    const result = restructure({
      problem_statement: 'test',
      elements: [
        { category: 'RULE', statement: 'A rule.', source: 'designer', caller_note: 'extra' },
      ],
    });
    expect(result.admitted[0].metadata.caller_note).toBe('extra');
  });

  it('rejected entry diagnostic identifies field name AND failure mode (AC-3.2)', () => {
    const result = restructure({
      problem_statement: 'test',
      elements: [
        { label: 'TODO', category: 'Concern' },
      ],
    });
    expect(result.rejected.length).toBe(1);
    expect(result.rejected[0].diagnostic).toContain('label');
    expect(result.rejected[0].diagnostic.toLowerCase()).toMatch(/placeholder|empty|redirect/);
  });

  it('admitted element provenance.action_label equals restructuring_action_label (AC-4.1)', () => {
    const result = restructure({
      problem_statement: 'test',
      elements: [
        { category: 'RULE', statement: 'A rule.', source: 'designer' },
      ],
    });
    expect(result.admitted.length).toBe(1);
    expect(result.admitted[0].provenance.action_label).toBe(result.admitted[0].restructuring_action_label);
  });
});
