import { describe, it, expect } from 'vitest';
import { checkOpenGate } from '../open-gate.js';

function makeAdmitted(overrides) {
  return {
    category: 'RULE',
    statement: 'A rule.',
    source: 'designer',
    metadata: {},
    restructuring_action_label: 'verbatim-preserve',
    provenance: { source_citation: 'submission.elements[0]', action_label: 'verbatim-preserve', reasoning_chain: null },
    ...overrides,
  };
}

describe('checkOpenGate', () => {
  it('passes when all admitted elements have full artifacts and report is non-empty', () => {
    const result = checkOpenGate([makeAdmitted({})], 'a non-empty report');
    expect(result.permitted).toBe(true);
    expect(result.failures).toEqual([]);
  });

  it('fails when admitted is empty', () => {
    const result = checkOpenGate([], 'a report');
    expect(result.permitted).toBe(false);
    expect(result.failures.some(f => f.missing_artifact === 'admitted_elements')).toBe(true);
  });

  it('fails when restructuring_action_label is missing on an element', () => {
    const broken = makeAdmitted({ restructuring_action_label: undefined });
    const result = checkOpenGate([broken], 'report');
    expect(result.permitted).toBe(false);
    expect(result.failures[0].missing_artifact).toBe('restructuring_action_label');
  });

  it('fails when provenance.source_citation is missing', () => {
    const broken = makeAdmitted({ provenance: { action_label: 'verbatim-preserve', reasoning_chain: null } });
    const result = checkOpenGate([broken], 'report');
    expect(result.permitted).toBe(false);
    expect(result.failures[0].missing_artifact).toBe('source_citation');
  });

  it('fails when non-verbatim action lacks reasoning_chain', () => {
    const broken = makeAdmitted({
      restructuring_action_label: 'reshape',
      provenance: { source_citation: 'x', action_label: 'reshape', reasoning_chain: null },
    });
    const result = checkOpenGate([broken], 'report');
    expect(result.permitted).toBe(false);
    expect(result.failures[0].missing_artifact).toBe('reasoning_chain');
  });

  it('fails when report is empty or missing', () => {
    const result = checkOpenGate([makeAdmitted({})], '');
    expect(result.permitted).toBe(false);
    expect(result.failures.some(f => f.missing_artifact === 'restructuring_report')).toBe(true);
  });

  it('passes when admitted element has empty metadata: {} (AC-2.2 — non-load-bearing)', () => {
    const elementWithEmptyMetadata = makeAdmitted({ metadata: {} });
    const result = checkOpenGate([elementWithEmptyMetadata], 'a non-empty report');
    expect(result.permitted).toBe(true);
    expect(result.failures).toEqual([]);
  });
});
