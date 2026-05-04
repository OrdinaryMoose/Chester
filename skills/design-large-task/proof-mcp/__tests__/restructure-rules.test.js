import { describe, it, expect } from 'vitest';
import { assignActionLabel } from '../restructure-rules.js';

describe('assignActionLabel — mechanical labels', () => {
  it('returns "verbatim-preserve" when caller field value matches expected type/format directly', () => {
    const result = assignActionLabel({
      callerValue: 'Some Concern Label',
      expectedType: 'string',
      requiredFieldName: 'label',
    });
    expect(result.label).toBe('verbatim-preserve');
  });

  it('returns "reshape" when caller field needs deterministic normalization (trim)', () => {
    const result = assignActionLabel({
      callerValue: '  Concern Label With Whitespace  ',
      expectedType: 'string',
      requiredFieldName: 'label',
    });
    expect(result.label).toBe('reshape');
    expect(result.reshapedValue).toBe('Concern Label With Whitespace');
  });

  it('returns "gap-fill" when field is absent but derivable by a known rule', () => {
    const result = assignActionLabel({
      callerValue: undefined,
      expectedType: 'array',
      requiredFieldName: 'grounding',
      gapFillRule: 'rule:default-empty-grounding',
      gapFillValue: [],
    });
    expect(result.label).toBe('gap-fill');
    expect(result.reshapedValue).toEqual([]);
    expect(result.ruleCitation).toBe('rule:default-empty-grounding');
  });

  it('returns null label when value is absent and no gap-fill rule applies', () => {
    const result = assignActionLabel({
      callerValue: undefined,
      expectedType: 'string',
      requiredFieldName: 'statement',
    });
    expect(result.label).toBe(null);
  });
});
