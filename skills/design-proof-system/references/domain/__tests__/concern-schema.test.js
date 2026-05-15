import { describe, it, expect } from 'vitest';
import { ELEMENT_CATEGORIES, assertExhaustive } from '../tags.js';

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
