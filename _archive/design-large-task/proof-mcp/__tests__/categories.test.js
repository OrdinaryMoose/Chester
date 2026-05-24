import { describe, it, expect } from 'vitest';
import {
  CATEGORIES,
  DISPOSITIONS_BY_CATEGORY,
  entityType,
  WITHDRAWAL_DISPOSITIONS,
  FRICTION_DISPOSITIONS,
} from '../proof.js';

describe('CATEGORIES + entityType', () => {
  it('CATEGORIES has 9 entries including CONCERN and DEFINITION', () => {
    expect(CATEGORIES).toEqual([
      'EVIDENCE', 'RULE', 'PERMISSION', 'NECESSARY_CONDITION', 'RISK',
      'RESOLVE_CONDITION', 'FRICTION', 'CONCERN', 'DEFINITION',
    ]);
  });

  it('DISPOSITIONS_BY_CATEGORY covers every CATEGORIES entry', () => {
    expect(Object.keys(DISPOSITIONS_BY_CATEGORY).sort()).toEqual([...CATEGORIES].sort());
  });

  it('DISPOSITIONS_BY_CATEGORY maps every non-FRICTION category to WITHDRAWAL_DISPOSITIONS', () => {
    for (const cat of CATEGORIES) {
      if (cat === 'FRICTION') continue;
      expect(DISPOSITIONS_BY_CATEGORY[cat]).toEqual(WITHDRAWAL_DISPOSITIONS);
    }
  });

  it('DISPOSITIONS_BY_CATEGORY.FRICTION points to FRICTION_DISPOSITIONS', () => {
    expect(DISPOSITIONS_BY_CATEGORY.FRICTION).toEqual(FRICTION_DISPOSITIONS);
  });

  it('entityType derives category from ID prefix', () => {
    expect(entityType('NCON-1')).toBe('NECESSARY_CONDITION');
    expect(entityType('EVID-7')).toBe('EVIDENCE');
    expect(entityType('CERN-2')).toBe('CONCERN');
    expect(entityType('DEFN-4')).toBe('DEFINITION');
    expect(entityType('FRIC-9')).toBe('FRICTION');
    expect(entityType('RULE-3')).toBe('RULE');
    expect(entityType('PERM-1')).toBe('PERMISSION');
    expect(entityType('RISK-5')).toBe('RISK');
    expect(entityType('RCON-2')).toBe('RESOLVE_CONDITION');
  });

  it('entityType throws on unknown prefix', () => {
    expect(() => entityType('XXXX-1')).toThrowError(/unknown id prefix/i);
    expect(() => entityType('malformed')).toThrowError();
  });
});
