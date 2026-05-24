import { describe, it, expect } from 'vitest';
import * as tags from '../tags.js';

describe('tags', () => {
  it('exposes nine frozen closed-set objects', () => {
    for (const name of [
      'INFERENCE_PATTERNS', 'FRICTION_SHAPES', 'FRICTION_DISPOSITIONS',
      'ACTION_LABELS', 'WITHDRAWAL_DISPOSITIONS', 'CONSENT_SOURCES',
      'ELEMENT_CATEGORIES', 'PHASES', 'RENDER_SECTIONS',
    ]) {
      expect(tags[name]).toBeDefined();
      expect(Object.isFrozen(tags[name])).toBe(true);
    }
  });

  it('ELEMENT_CATEGORIES has nine known values', () => {
    expect(new Set(Object.values(tags.ELEMENT_CATEGORIES))).toEqual(
      new Set(['evidence', 'rule', 'permission', 'proposition', 'risk', 'resolution', 'friction', 'concern', 'definition'])
    );
  });

  it('assertExhaustive throws on out-of-set value', () => {
    expect(() => tags.assertExhaustive('not-a-phase', tags.PHASES, 'PHASES')).toThrow(/PHASES/);
  });

  it('assertExhaustive returns the value on in-set value', () => {
    const v = Object.values(tags.PHASES)[0];
    expect(tags.assertExhaustive(v, tags.PHASES, 'PHASES')).toBe(v);
  });
});
