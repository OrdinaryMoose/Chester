import { describe, it, expect } from 'vitest';
import { buildProvenance, extractMetadata } from '../restructure.js';

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
