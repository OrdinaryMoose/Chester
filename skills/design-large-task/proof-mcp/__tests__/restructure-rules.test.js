import { describe, it, expect } from 'vitest';
import { assignActionLabel, isRejectedValue } from '../restructure-rules.js';

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

describe('isRejectedValue', () => {
  it.each([
    ['', 'empty string'],
    [null, 'null'],
    ['TODO', 'TODO placeholder'],
    ['todo', 'lowercase TODO'],
    ['not specified', 'not-specified placeholder'],
    ['Not Specified', 'cased not-specified'],
    ['see metadata', 'redirect to metadata'],
    ['See Metadata for details', 'redirect prefix'],
  ])('rejects %j (%s)', (value, _desc) => {
    const result = isRejectedValue(value);
    expect(result.rejected).toBe(true);
    expect(typeof result.reason).toBe('string');
    expect(result.reason.length).toBeGreaterThan(0);
  });

  it.each([
    ['Some real content', 'real string'],
    ['A statement that mentions metadata in passing', 'real string with metadata word'],
    [['anchor-1'], 'array'],
    [{ key: 'val' }, 'object'],
  ])('admits %j (%s)', (value, _desc) => {
    expect(isRejectedValue(value).rejected).toBe(false);
  });
});
