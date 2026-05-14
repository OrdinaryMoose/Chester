import { describe, it, expect } from 'vitest';
import { CATEGORY_REGISTRY, verifyArgsShape } from '../schema.js';
import { ELEMENT_CATEGORIES } from '../tags.js';

describe('schema', () => {
  it('CATEGORY_REGISTRY has eight descriptors keyed by ELEMENT_CATEGORIES', () => {
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
    const argsWithBadEnum = { statement: 's', grounding: 'g', collapse_test: 'c', inference_pattern: 'not_a_valid_pattern' };
    let captured = null;
    try { verifyArgsShape(argsWithBadEnum, cat); } catch (e) { captured = e; }
    expect(captured).not.toBeNull();
    expect(captured.code).toBe('SHAPE_INVALID');
    expect(captured.field).toBe('inference_pattern');
  });
});
