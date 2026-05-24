import { describe, it, expect } from 'vitest';
import * as tags from '../tags.js';
import { ELEMENT_CATEGORIES, CONSENT_SOURCES } from '../tags.js';
import { CATEGORY_REGISTRY } from '../schema.js';
import { translate } from '../translation.js';
import { validateCategoryRegistry } from '../boot-validators.js';
import { createDomainBridge } from '../domain-bridge.js';

// DEFINITION end-to-end: descriptor → translator → bridge round-trip.
// Validates AC-7.1, AC-7.2, AC-7.3 — the `term` → `canonical_name` rename per
// cascade §3.9. Mirror of permission-schema.test.js scaffolding (real Engine,
// no mocks per dr-20260514-06).

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

describe('DEFINITION — descriptor shape', () => {
  it('requiredFields = [canonical_name, definition]', () => {
    const desc = CATEGORY_REGISTRY[ELEMENT_CATEGORIES.DEFINITION];
    expect(new Set(desc.requiredFields)).toEqual(new Set(['canonical_name', 'definition']));
    expect(desc.requiredFields).not.toContain('term');
  });
});

describe('DEFINITION — translator emits using canonical_name', () => {
  it('definition_decl carries canonical_name in second positional arg', async () => {
    const bridge = await makeRealBridge();
    const { id } = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.DEFINITION, canonical_name: 'Calculator', definition: 'A device' },
      designerConsent
    );
    const rows = bridge.queryProof({ pattern: ['definition_decl', [id, { var: 'N' }, { var: 'D' }]] });
    expect(rows).toHaveLength(1);
    expect(rows[0].N).toBe('Calculator');
    expect(rows[0].D).toBe('A device');
  });

  it('definition_decl arity remains 3 (id, canonical_name, definition)', async () => {
    const bridge = await makeRealBridge();
    const { id } = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.DEFINITION, canonical_name: 'Widget', definition: 'A thing' },
      designerConsent
    );
    const rows = bridge.queryProof({ pattern: ['definition_decl', [{ var: 'I' }, { var: 'N' }, { var: 'D' }]] });
    const matching = rows.filter((r) => r.I === id);
    expect(matching).toHaveLength(1);
    expect(matching[0].N).toBe('Widget');
    expect(matching[0].D).toBe('A thing');
  });

  it('definition_scope and definition_self facts continue to emit unchanged', async () => {
    const bridge = await makeRealBridge();
    const { id } = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.DEFINITION, canonical_name: 'Session', definition: 'A login window', scope: 'web' },
      designerConsent
    );
    const scopeRows = bridge.queryProof({ pattern: ['definition_scope', [id, { var: 'S' }]] });
    expect(scopeRows).toHaveLength(1);
    expect(scopeRows[0].S).toBe('web');
    const selfRows = bridge.queryProof({ pattern: ['definition_self', [id, id]] });
    expect(selfRows).toHaveLength(1);
  });
});

describe('DEFINITION — boot validation', () => {
  it('CATEGORY_REGISTRY passes validateCategoryRegistry', () => {
    expect(() => validateCategoryRegistry(CATEGORY_REGISTRY, tags)).not.toThrow();
  });
});
