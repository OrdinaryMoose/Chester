import { describe, it, expect } from 'vitest';
import { REQUIRED_FIELDS_REGISTRY } from '../restructure-schema.js';

describe('REQUIRED_FIELDS_REGISTRY', () => {
  const B1_CATEGORIES = ['EVIDENCE', 'RULE', 'PERMISSION', 'NECESSARY_CONDITION', 'RISK', 'Concern'];

  it('contains an entry for each B.1-admittable category', () => {
    for (const category of B1_CATEGORIES) {
      expect(REQUIRED_FIELDS_REGISTRY[category]).toBeDefined();
    }
  });

  it('omits FRICTION from the registry', () => {
    expect(REQUIRED_FIELDS_REGISTRY.FRICTION).toBeUndefined();
  });

  it('omits RESOLVE_CONDITION from the registry (added post-open via existing tools)', () => {
    expect(REQUIRED_FIELDS_REGISTRY.RESOLVE_CONDITION).toBeUndefined();
  });

  it('every category has non-empty required and optional arrays', () => {
    for (const category of B1_CATEGORIES) {
      const entry = REQUIRED_FIELDS_REGISTRY[category];
      expect(Array.isArray(entry.required)).toBe(true);
      expect(Array.isArray(entry.optional)).toBe(true);
      expect(entry.required.length).toBeGreaterThan(0);
    }
  });

  it('every required field has a non-empty justification string', () => {
    for (const category of B1_CATEGORIES) {
      for (const field of REQUIRED_FIELDS_REGISTRY[category].required) {
        expect(typeof field.name).toBe('string');
        expect(field.name.length).toBeGreaterThan(0);
        expect(typeof field.justification).toBe('string');
        expect(field.justification.length).toBeGreaterThan(0);
      }
    }
  });
});
