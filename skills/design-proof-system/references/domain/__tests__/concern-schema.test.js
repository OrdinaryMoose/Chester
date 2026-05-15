import { describe, it, expect } from 'vitest';
import { ELEMENT_CATEGORIES, CONSENT_SOURCES, RENDER_SECTIONS, assertExhaustive } from '../tags.js';
import { CATEGORY_REGISTRY, verifyArgsShape } from '../schema.js';

describe('CONCERN — tags', () => {
  it('AC-1.1: ELEMENT_CATEGORIES contains CONCERN with value "concern"', () => {
    expect(ELEMENT_CATEGORIES.CONCERN).toBe('concern');
    expect(Object.values(ELEMENT_CATEGORIES)).toHaveLength(9);
    expect(Object.values(ELEMENT_CATEGORIES)).toContain('concern');
  });

  it('AC-1.1: assertExhaustive accepts "concern" as a valid element category', () => {
    expect(() => assertExhaustive('concern', ELEMENT_CATEGORIES, 'idShape')).not.toThrow();
    expect(assertExhaustive('concern', ELEMENT_CATEGORIES, 'idShape')).toBe('concern');
  });
});

describe('CONCERN — schema', () => {
  it('AC-1.2: CATEGORY_REGISTRY[CONCERN] has expected shape', () => {
    const entry = CATEGORY_REGISTRY[ELEMENT_CATEGORIES.CONCERN];
    expect(entry).toBeDefined();
    expect(entry.requiredFields).toEqual(['label']);
    expect(entry.optionalFields).toEqual(['description']);
    expect(entry.idShape).toBe('concern');
    expect(entry.sourceConstraint).toBe(CONSENT_SOURCES.DESIGNER);
    expect(entry.renderSection).toBe(RENDER_SECTIONS.PROBLEM);
    expect(entry.closedEnumFields).toEqual({});
    expect(entry.authority.add).toEqual([CONSENT_SOURCES.DESIGNER]);
    expect(entry.authority.revise).toEqual([CONSENT_SOURCES.DESIGNER]);
    expect(entry.authority.withdraw).toEqual([CONSENT_SOURCES.DESIGNER]);
    expect(entry.authority.ratify).toEqual([CONSENT_SOURCES.DESIGNER, CONSENT_SOURCES.DESIGN_PARTNER]);
  });

  it('AC-1.3: verifyArgsShape accepts valid args, throws SHAPE_INVALID on missing label', () => {
    expect(verifyArgsShape({ label: 'C1' }, 'concern')).toEqual({ label: 'C1' });
    expect(verifyArgsShape({ label: 'C1', description: 'D1' }, 'concern')).toEqual({ label: 'C1', description: 'D1' });
    let captured = null;
    try { verifyArgsShape({}, 'concern'); } catch (e) { captured = e; }
    expect(captured).not.toBeNull();
    expect(captured.code).toBe('SHAPE_INVALID');
    expect(captured.field).toBe('label');
  });

  it('AC-1.2: schema test (existing): CATEGORY_REGISTRY has 9 descriptors keyed by ELEMENT_CATEGORIES', () => {
    expect(Object.keys(CATEGORY_REGISTRY).sort()).toEqual(Object.values(ELEMENT_CATEGORIES).sort());
  });
});
