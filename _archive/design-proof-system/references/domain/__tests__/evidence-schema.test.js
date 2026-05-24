import { describe, it, expect } from 'vitest';
import * as tags from '../tags.js';
import { ELEMENT_CATEGORIES, CONSENT_SOURCES } from '../tags.js';
import { CATEGORY_REGISTRY } from '../schema.js';
import { translate } from '../translation.js';
import { validateCategoryRegistry } from '../boot-validators.js';
import { createDomainBridge } from '../domain-bridge.js';

// EVIDENCE end-to-end: descriptor → translator → bridge round-trip.
// Mirror of permission-schema.test.js. Real imports per dr-20260514-06:
// no mocks of the Engine, bridge, schema, translator, or substrate.
// Bridge runs against the real `../../engine/Engine.js`.

async function makeRealBridge() {
  const { Engine } = await import('../../engine/Engine.js');
  const counters = new Map();
  const idAllocator = {
    next: (shape) => {
      const n = (counters.get(shape) ?? 0) + 1;
      counters.set(shape, n);
      return `${shape}_${n}`;
    },
  };
  const clock = { now: () => 1700000000 };
  const consentVerification = { verify: () => true };
  const persistenceRepo = { saveState: () => {} };
  return createDomainBridge({ engine: new Engine(), clock, idAllocator, consentVerification, persistenceRepo });
}

const designerConsent = Object.freeze({ source: CONSENT_SOURCES.DESIGNER });

describe('EVIDENCE — descriptor shape', () => {
  it('requiredFields contains source and statement (not claim)', () => {
    const desc = CATEGORY_REGISTRY[ELEMENT_CATEGORIES.EVIDENCE];
    expect(desc.requiredFields).toEqual(expect.arrayContaining(['source', 'statement']));
    expect(desc.requiredFields).not.toContain('claim');
  });

  it('closedEnumFields.source contains the four spec-allowed values and excludes designer', () => {
    const desc = CATEGORY_REGISTRY[ELEMENT_CATEGORIES.EVIDENCE];
    const values = Object.values(desc.closedEnumFields.source);
    expect(new Set(values)).toEqual(new Set(['industry', 'codebase', 'prior-record', 'agent-derivation']));
    expect(values).not.toContain('designer');
  });
});

describe('EVIDENCE — positive submissions', () => {
  it.each(['industry', 'codebase', 'prior-record', 'agent-derivation'])('accepts source=%s', async (src) => {
    const bridge = await makeRealBridge();
    const { id } = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: src, statement: 'e text' },
      designerConsent,
    );
    const rows = bridge.queryProof({ pattern: ['evidence', [id, src, { var: 'S' }]] });
    expect(rows).toHaveLength(1);
    expect(rows[0].S).toBe('e text');
  });
});

describe('EVIDENCE — H-4 source-authority inversion', () => {
  it('rejects source=designer with SHAPE_INVALID', async () => {
    const bridge = await makeRealBridge();
    expect(() => bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'designer', statement: 'e text' },
      designerConsent,
    )).toThrow(expect.objectContaining({ code: 'SHAPE_INVALID', field: 'source' }));
  });
});
