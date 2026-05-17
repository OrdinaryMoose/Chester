import { describe, it, expect } from 'vitest';
import { ELEMENT_CATEGORIES, CONSENT_SOURCES, INFERENCE_PATTERNS } from '../tags.js';
import { CATEGORY_REGISTRY, verifyArgsShape } from '../schema.js';

const validProposition = Object.freeze({
  statement: 'S',
  grounding: ['evid_1'],
  collapse_test: 'T',
  inference_pattern: INFERENCE_PATTERNS.GROUNDS_IMPLY_CONCLUSION,
  reasoning_chain: 'IF X THEN Y',
});

describe('PROPOSITION — schema descriptor (AC-1.x)', () => {
  it('AC-1.1: requiredFields equals [statement, grounding, collapse_test, inference_pattern, reasoning_chain] in cascade order', () => {
    expect(CATEGORY_REGISTRY[ELEMENT_CATEGORIES.PROPOSITION].requiredFields).toEqual([
      'statement', 'grounding', 'collapse_test', 'inference_pattern', 'reasoning_chain',
    ]);
  });

  it('AC-1.2: optionalFields contains scope and rejected_alternatives', () => {
    const opt = CATEGORY_REGISTRY[ELEMENT_CATEGORIES.PROPOSITION].optionalFields;
    expect(opt).toContain('scope');
    expect(opt).toContain('rejected_alternatives');
  });

  it('AC-1.3: nonEmptyStringFields equals [reasoning_chain]', () => {
    expect(CATEGORY_REGISTRY[ELEMENT_CATEGORIES.PROPOSITION].nonEmptyStringFields).toEqual(['reasoning_chain']);
  });
});

describe('PROPOSITION — verifyArgsShape (AC-2.x)', () => {
  it('AC-2.1: valid args pass unchanged', () => {
    expect(verifyArgsShape({ ...validProposition }, 'proposition')).toEqual({ ...validProposition });
  });

  it('AC-2.2: missing reasoning_chain throws SHAPE_INVALID with field reasoning_chain', () => {
    const { reasoning_chain, ...partial } = validProposition;
    let captured = null;
    try { verifyArgsShape(partial, 'proposition'); } catch (e) { captured = e; }
    expect(captured).not.toBeNull();
    expect(captured.code).toBe('SHAPE_INVALID');
    expect(captured.field).toBe('reasoning_chain');
  });

  it('AC-2.3: empty-string and whitespace-only reasoning_chain throws SHAPE_INVALID', () => {
    for (const bad of ['', '   ', '\t\n']) {
      let captured = null;
      try { verifyArgsShape({ ...validProposition, reasoning_chain: bad }, 'proposition'); } catch (e) { captured = e; }
      expect(captured).not.toBeNull();
      expect(captured.code).toBe('SHAPE_INVALID');
      expect(captured.field).toBe('reasoning_chain');
    }
  });

  it('AC-2.4: non-string reasoning_chain throws SHAPE_INVALID', () => {
    let captured = null;
    try { verifyArgsShape({ ...validProposition, reasoning_chain: 42 }, 'proposition'); } catch (e) { captured = e; }
    expect(captured).not.toBeNull();
    expect(captured.code).toBe('SHAPE_INVALID');
    expect(captured.field).toBe('reasoning_chain');
  });

  it('AC-2.5: rejected_alternatives optional — absent, empty, and populated all accepted', () => {
    expect(verifyArgsShape({ ...validProposition }, 'proposition')).toBeTruthy();
    expect(verifyArgsShape({ ...validProposition, rejected_alternatives: [] }, 'proposition')).toBeTruthy();
    expect(verifyArgsShape({ ...validProposition, rejected_alternatives: [{ statement: 'A1', rejection_reason: 'R1' }] }, 'proposition')).toBeTruthy();
  });
});
