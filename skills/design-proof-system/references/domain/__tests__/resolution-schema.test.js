import { describe, it, expect } from 'vitest';
import * as tags from '../tags.js';
import { ELEMENT_CATEGORIES, CONSENT_SOURCES } from '../tags.js';
import { CATEGORY_REGISTRY } from '../schema.js';
import { translate } from '../translation.js';
import { validateCategoryRegistry } from '../boot-validators.js';
import { createDomainBridge } from '../domain-bridge.js';

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

describe('RESOLUTION — descriptor shape', () => {
  it('AC-5.1: requiredFields are statement/problem_anchor/grounding', () => {
    const desc = CATEGORY_REGISTRY[ELEMENT_CATEGORIES.RESOLUTION];
    expect(new Set(desc.requiredFields)).toEqual(new Set(['statement', 'problem_anchor', 'grounding']));
  });

  it('AC-5.1: nonEmptyArrayFields contains grounding; referenceFields targets concern + proposition', () => {
    const desc = CATEGORY_REGISTRY[ELEMENT_CATEGORIES.RESOLUTION];
    expect(desc.nonEmptyArrayFields).toContain('grounding');
    expect(desc.referenceFields).toEqual({ problem_anchor: 'concern', grounding: 'proposition' });
  });
});

describe('RESOLUTION — translator emits anchor and grounding-spread facts', () => {
  it('AC-5.2: emits resolution_anchor/2 once and resolution_grounding/2 per element', async () => {
    const bridge = await makeRealBridge();
    const ev = bridge.addElement(
      { idShape: 'evidence', source: 'industry', statement: 'A' },
      designerConsent,
    );
    const concern = bridge.addElement(
      { idShape: 'concern', label: 'C1' },
      designerConsent,
    );
    const pA = bridge.addElement(
      {
        idShape: 'proposition',
        statement: 'pA',
        grounding: [ev.id],
        inference_pattern: 'grounds_imply_conclusion',
        collapse_test: 'ct',
        reasoning_chain: 'rc',
      },
      designerConsent,
    );
    const pB = bridge.addElement(
      {
        idShape: 'proposition',
        statement: 'pB',
        grounding: [ev.id],
        inference_pattern: 'grounds_imply_conclusion',
        collapse_test: 'ct',
        reasoning_chain: 'rc',
      },
      designerConsent,
    );
    const { id: rId } = bridge.addElement(
      { idShape: 'resolution', statement: 'R1', problem_anchor: concern.id, grounding: [pA.id, pB.id] },
      designerConsent,
    );
    const anchorRows = bridge.queryProof({ pattern: ['resolution_anchor', [rId, { var: 'C' }]] });
    expect(anchorRows).toHaveLength(1);
    expect(anchorRows[0].C).toBe(concern.id);
    const groundingRows = bridge.queryProof({ pattern: ['resolution_grounding', [rId, { var: 'P' }]] });
    expect(groundingRows).toHaveLength(2);
    expect(new Set(groundingRows.map(r => r.P))).toEqual(new Set([pA.id, pB.id]));
  });

  it('AC-5.3: translator unit — translate(RESOLUTION, ...) returns resolution_decl + anchor + per-element grounding facts', () => {
    const result = translate(
      ELEMENT_CATEGORIES.RESOLUTION,
      { statement: 'R1', problem_anchor: 'concern_1', grounding: ['proposition_1', 'proposition_2'] },
      'resolution_1',
      1700000000,
    );
    expect(result.baseFacts).toEqual(expect.arrayContaining([
      ['resolution_decl', ['resolution_1', 'R1']],
      ['resolution_anchor', ['resolution_1', 'concern_1']],
      ['resolution_grounding', ['resolution_1', 'proposition_1']],
      ['resolution_grounding', ['resolution_1', 'proposition_2']],
    ]));
    // No legacy addresses fact should be emitted.
    const predicates = result.baseFacts.map(([p]) => p);
    expect(predicates).not.toContain('addresses');
  });
});

describe('RESOLUTION — INVALID_REFERENCE on non-existent refs', () => {
  it('AC-5.4: throws INVALID_REFERENCE when problem_anchor missing', async () => {
    const bridge = await makeRealBridge();
    // Seed a proposition so grounding ref is valid — isolates the problem_anchor failure.
    const ev = bridge.addElement(
      { idShape: 'evidence', source: 'industry', statement: 'A' },
      designerConsent,
    );
    const p = bridge.addElement(
      {
        idShape: 'proposition',
        statement: 'p1',
        grounding: [ev.id],
        inference_pattern: 'grounds_imply_conclusion',
        collapse_test: 'ct',
        reasoning_chain: 'rc',
      },
      designerConsent,
    );
    let captured = null;
    try {
      bridge.addElement(
        { idShape: 'resolution', statement: 'R1', problem_anchor: 'nonexistent_concern', grounding: [p.id] },
        designerConsent,
      );
    } catch (e) {
      captured = e;
    }
    expect(captured).not.toBeNull();
    expect(captured.code).toBe('INVALID_REFERENCE');
    expect(captured.field).toBe('problem_anchor');
  });

  it('AC-5.4: throws INVALID_REFERENCE when grounding references missing proposition', async () => {
    const bridge = await makeRealBridge();
    const concern = bridge.addElement(
      { idShape: 'concern', label: 'C1' },
      designerConsent,
    );
    let captured = null;
    try {
      bridge.addElement(
        { idShape: 'resolution', statement: 'R1', problem_anchor: concern.id, grounding: ['nonexistent_proposition'] },
        designerConsent,
      );
    } catch (e) {
      captured = e;
    }
    expect(captured).not.toBeNull();
    expect(captured.code).toBe('INVALID_REFERENCE');
    expect(captured.field).toBe('grounding');
    expect(captured.referencedId).toBe('nonexistent_proposition');
  });
});

describe('RESOLUTION — EDB predicate retirement (AC-5.5)', () => {
  it('addresses/2 is removed from EDB_PREDICATES; resolution_anchor + resolution_grounding present', async () => {
    const { getDeclaredEDBPredicates } = await import('../translation.js');
    const edb = getDeclaredEDBPredicates();
    expect(edb.has('addresses')).toBe(false);
    expect(edb.has('resolution_anchor')).toBe(true);
    expect(edb.has('resolution_grounding')).toBe(true);
  });
});

describe('RESOLUTION — CATEGORY_REGISTRY passes validateCategoryRegistry (AC-9.2)', () => {
  it('boot validator does not throw on the updated RESOLUTION descriptor', () => {
    expect(() => validateCategoryRegistry(CATEGORY_REGISTRY, tags)).not.toThrow();
  });
});
