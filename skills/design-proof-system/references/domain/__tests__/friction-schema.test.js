import { describe, it, expect } from 'vitest';
import * as tags from '../tags.js';
import { ELEMENT_CATEGORIES, CONSENT_SOURCES, FRICTION_SHAPES, FRICTION_DISPOSITIONS } from '../tags.js';
import { CATEGORY_REGISTRY } from '../schema.js';
import { translate } from '../translation.js';
import { validateCategoryRegistry } from '../boot-validators.js';
import { createDomainBridge } from '../domain-bridge.js';

// FRICTION end-to-end: descriptor → translator → bridge round-trip + render.
// Arity 4 → 5 reshape (sprint-02-bug-fix-0306 Task 4). Renames `shape` → `friction_shape`,
// drops required `description`, adds optional `statement`, adds required reference fields
// `anchor_a` and `anchor_b` (any-category). Real imports per dr-20260514-06.

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
const systemConsent = Object.freeze({ source: CONSENT_SOURCES.SYSTEM });

describe('FRICTION — descriptor shape (AC-6.x)', () => {
  it('AC-6.1: requiredFields = [friction_shape, anchor_a, anchor_b, disposition]; optionalFields contains statement', () => {
    const desc = CATEGORY_REGISTRY[ELEMENT_CATEGORIES.FRICTION];
    expect(new Set(desc.requiredFields)).toEqual(new Set(['friction_shape', 'anchor_a', 'anchor_b', 'disposition']));
    expect(desc.optionalFields).toContain('statement');
    expect(desc.requiredFields).not.toContain('shape');
    expect(desc.requiredFields).not.toContain('description');
  });

  it('AC-6.2: closedEnumFields keyed by friction_shape (not shape)', () => {
    const desc = CATEGORY_REGISTRY[ELEMENT_CATEGORIES.FRICTION];
    expect(Object.keys(desc.closedEnumFields)).toContain('friction_shape');
    expect(Object.keys(desc.closedEnumFields)).not.toContain('shape');
    expect(desc.closedEnumFields.friction_shape).toBe(FRICTION_SHAPES);
    expect(desc.closedEnumFields.disposition).toBe(FRICTION_DISPOSITIONS);
  });

  it('AC-6.3: referenceFields = { anchor_a: *, anchor_b: * }', () => {
    const desc = CATEGORY_REGISTRY[ELEMENT_CATEGORIES.FRICTION];
    expect(desc.referenceFields).toEqual({ anchor_a: '*', anchor_b: '*' });
  });

  it('AC-6.4: descriptor passes boot validator', () => {
    expect(() => validateCategoryRegistry(CATEGORY_REGISTRY, tags)).not.toThrow();
  });
});

describe('FRICTION — translator emits friction/5 (AC-6.5)', () => {
  it('translator emits arity-5 baseFact', () => {
    const validShape = Object.values(FRICTION_SHAPES)[0];
    const validDispo = Object.values(FRICTION_DISPOSITIONS)[0];
    const { baseFacts } = translate(ELEMENT_CATEGORIES.FRICTION,
      { friction_shape: validShape, anchor_a: 'evidence_1', anchor_b: 'evidence_2', disposition: validDispo },
      'friction_1', 1700000000);
    expect(baseFacts).toHaveLength(1);
    const [pred, terms] = baseFacts[0];
    expect(pred).toBe('friction');
    expect(terms).toHaveLength(5);
    expect(terms).toEqual(['friction_1', validShape, 'evidence_1', 'evidence_2', validDispo]);
  });

  it('end-to-end: bridge.addElement produces friction/5 fact queryable via queryProof', async () => {
    const bridge = await makeRealBridge();
    const evA = bridge.addElement({ idShape: 'evidence', source: 'industry', statement: 'A' }, designerConsent);
    const evB = bridge.addElement({ idShape: 'evidence', source: 'industry', statement: 'B' }, designerConsent);
    const validShape = Object.values(FRICTION_SHAPES)[0];
    const validDispo = Object.values(FRICTION_DISPOSITIONS)[0];
    const { id: fId } = bridge.addElement(
      { idShape: 'friction', friction_shape: validShape, anchor_a: evA.id, anchor_b: evB.id, disposition: validDispo },
      systemConsent
    );
    const rows = bridge.queryProof({ pattern: ['friction', [fId, { var: 'S' }, { var: 'A' }, { var: 'B' }, { var: 'D' }]] });
    expect(rows).toHaveLength(1);
    expect(rows[0].S).toBe(validShape);
    expect(rows[0].A).toBe(evA.id);
    expect(rows[0].B).toBe(evB.id);
    expect(rows[0].D).toBe(validDispo);
  });
});

describe('FRICTION — INVALID_REFERENCE for missing anchors', () => {
  it('throws INVALID_REFERENCE when anchor_a does not exist', async () => {
    const bridge = await makeRealBridge();
    const ev = bridge.addElement({ idShape: 'evidence', source: 'industry', statement: 'A' }, designerConsent);
    const validShape = Object.values(FRICTION_SHAPES)[0];
    const validDispo = Object.values(FRICTION_DISPOSITIONS)[0];
    expect(() => bridge.addElement(
      { idShape: 'friction', friction_shape: validShape, anchor_a: 'nonexistent_xyz', anchor_b: ev.id, disposition: validDispo },
      systemConsent
    )).toThrow(expect.objectContaining({ code: 'INVALID_REFERENCE', field: 'anchor_a' }));
  });

  it('throws INVALID_REFERENCE when anchor_b does not exist', async () => {
    const bridge = await makeRealBridge();
    const ev = bridge.addElement({ idShape: 'evidence', source: 'industry', statement: 'A' }, designerConsent);
    const validShape = Object.values(FRICTION_SHAPES)[0];
    const validDispo = Object.values(FRICTION_DISPOSITIONS)[0];
    expect(() => bridge.addElement(
      { idShape: 'friction', friction_shape: validShape, anchor_a: ev.id, anchor_b: 'nonexistent_xyz', disposition: validDispo },
      systemConsent
    )).toThrow(expect.objectContaining({ code: 'INVALID_REFERENCE', field: 'anchor_b' }));
  });

  it('accepts anchors referring to elements of any category (e.g. proposition + concern)', async () => {
    const bridge = await makeRealBridge();
    const concern = bridge.addElement({ idShape: 'concern', label: 'c1' }, designerConsent);
    const ev = bridge.addElement({ idShape: 'evidence', source: 'industry', statement: 'A' }, designerConsent);
    const validShape = Object.values(FRICTION_SHAPES)[0];
    const validDispo = Object.values(FRICTION_DISPOSITIONS)[0];
    expect(() => bridge.addElement(
      { idShape: 'friction', friction_shape: validShape, anchor_a: concern.id, anchor_b: ev.id, disposition: validDispo },
      systemConsent
    )).not.toThrow();
  });
});

describe('FRICTION — renderStructuredProof emits Frictions section (AC-9.3)', () => {
  it('rendered output contains ## Frictions block with friction_shape + anchor + disposition sub-lines', async () => {
    const bridge = await makeRealBridge();
    const evA = bridge.addElement({ idShape: 'evidence', source: 'industry', statement: 'A' }, designerConsent);
    const evB = bridge.addElement({ idShape: 'evidence', source: 'industry', statement: 'B' }, designerConsent);
    const validShape = Object.values(FRICTION_SHAPES)[0];
    const validDispo = Object.values(FRICTION_DISPOSITIONS)[0];
    bridge.addElement(
      { idShape: 'friction', friction_shape: validShape, anchor_a: evA.id, anchor_b: evB.id, disposition: validDispo },
      systemConsent
    );
    const out = bridge.renderStructuredProof();
    expect(out).toContain('## Frictions');
    expect(out).toContain(`Friction shape: ${validShape}`);
    expect(out).toContain(`Anchor A: ${evA.id}`);
    expect(out).toContain(`Anchor B: ${evB.id}`);
    expect(out).toContain(`Disposition: ${validDispo}`);
  });

  it('renderStructuredProof omits Frictions section when no frictions exist', async () => {
    const bridge = await makeRealBridge();
    bridge.addElement({ idShape: 'evidence', source: 'industry', statement: 'A' }, designerConsent);
    const out = bridge.renderStructuredProof();
    expect(out).not.toContain('## Frictions');
  });
});
