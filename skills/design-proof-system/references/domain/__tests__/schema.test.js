import { describe, it, expect } from 'vitest';
import { CATEGORY_REGISTRY, verifyArgsShape } from '../schema.js';
import { ELEMENT_CATEGORIES } from '../tags.js';

describe('schema', () => {
  it('CATEGORY_REGISTRY has nine descriptors keyed by ELEMENT_CATEGORIES', () => {
    expect(Object.keys(CATEGORY_REGISTRY).sort()).toEqual(Object.values(ELEMENT_CATEGORIES).sort());
  });

  it('each descriptor has non-empty requiredFields and a sourceConstraint', () => {
    for (const d of Object.values(CATEGORY_REGISTRY)) {
      expect(Array.isArray(d.requiredFields)).toBe(true);
      expect(d.requiredFields.length).toBeGreaterThan(0);
      expect(typeof d.sourceConstraint).toBe('string');
    }
  });

  it('verifyArgsShape passes valid args and throws on missing required field', () => {
    const cat = ELEMENT_CATEGORIES.EVIDENCE;
    const desc = CATEGORY_REGISTRY[cat];
    const validArgs = Object.fromEntries(desc.requiredFields.map(f => [f, 'x']));
    expect(() => verifyArgsShape(validArgs, cat)).not.toThrow();
    const { [desc.requiredFields[0]]: _, ...partial } = validArgs;
    expect(() => verifyArgsShape(partial, cat)).toThrow(/SHAPE/);
  });

  it('verifyArgsShape throws SHAPE_INVALID on closed-enum violation (PROPOSITION.inference_pattern)', () => {
    const cat = ELEMENT_CATEGORIES.PROPOSITION;
    const argsWithBadEnum = { statement: 's', grounding: 'g', collapse_test: 'c', inference_pattern: 'not_a_valid_pattern', reasoning_chain: 'IF X THEN Y' };
    let captured = null;
    try { verifyArgsShape(argsWithBadEnum, cat); } catch (e) { captured = e; }
    expect(captured).not.toBeNull();
    expect(captured.code).toBe('SHAPE_INVALID');
    expect(captured.field).toBe('inference_pattern');
  });

  it('verifyArgsShape throws SHAPE_INVALID when a nonEmptyStringFields entry is empty or whitespace', () => {
    const stubDescriptor = {
      label: 'stub',
      requiredFields: ['foo'],
      nonEmptyStringFields: ['foo'],
      closedEnumFields: {},
    };
    let captured = null;
    try { verifyArgsShape({ foo: '' }, stubDescriptor); } catch (e) { captured = e; }
    expect(captured).not.toBeNull();
    expect(captured.code).toBe('SHAPE_INVALID');
    expect(captured.field).toBe('foo');

    captured = null;
    try { verifyArgsShape({ foo: '   ' }, stubDescriptor); } catch (e) { captured = e; }
    expect(captured).not.toBeNull();
    expect(captured.code).toBe('SHAPE_INVALID');
    expect(captured.field).toBe('foo');

    captured = null;
    try { verifyArgsShape({ foo: 42 }, stubDescriptor); } catch (e) { captured = e; }
    expect(captured).not.toBeNull();
    expect(captured.code).toBe('SHAPE_INVALID');
    expect(captured.field).toBe('foo');

    expect(verifyArgsShape({ foo: 'hello' }, stubDescriptor)).toEqual({ foo: 'hello' });
  });

  it('verifyArgsShape throws SHAPE_INVALID when a nonEmptyArrayFields entry is empty or non-array', () => {
    const stubDescriptor = {
      label: 'stub',
      requiredFields: ['xs'],
      nonEmptyArrayFields: ['xs'],
      closedEnumFields: {},
    };
    // Empty array
    let captured = null;
    try { verifyArgsShape({ xs: [] }, stubDescriptor); } catch (e) { captured = e; }
    expect(captured).not.toBeNull();
    expect(captured.code).toBe('SHAPE_INVALID');
    expect(captured.field).toBe('xs');

    // Non-array
    captured = null;
    try { verifyArgsShape({ xs: 'not-an-array' }, stubDescriptor); } catch (e) { captured = e; }
    expect(captured).not.toBeNull();
    expect(captured.code).toBe('SHAPE_INVALID');
    expect(captured.field).toBe('xs');

    // Valid non-empty array passes
    expect(() => verifyArgsShape({ xs: ['a', 'b'] }, stubDescriptor)).not.toThrow();
  });

  it('verifyArgsShape throws INVALID_REFERENCE when a referenceFields entry points at a non-existent id', () => {
    const stubDescriptor = {
      label: 'stub',
      requiredFields: ['ref'],
      referenceFields: { ref: 'rule' },
      closedEnumFields: {},
    };
    // Read port stub — returns false for all existence queries
    const noPort = { exists: () => false };
    // Without a read port, the referenceFields loop short-circuits (backward compat)
    expect(() => verifyArgsShape({ ref: 'rule_999' }, stubDescriptor)).not.toThrow();

    // With a read port, the loop runs and throws on miss
    let captured = null;
    try { verifyArgsShape({ ref: 'rule_999' }, stubDescriptor, noPort); } catch (e) { captured = e; }
    expect(captured).not.toBeNull();
    expect(captured.code).toBe('INVALID_REFERENCE');
    expect(captured.field).toBe('ref');
    expect(captured.referencedId).toBe('rule_999');

    // With a read port that returns true, the loop passes
    const yesPort = { exists: () => true };
    expect(() => verifyArgsShape({ ref: 'rule_1' }, stubDescriptor, yesPort)).not.toThrow();
  });
});
