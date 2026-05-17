import { describe, it, expect } from 'vitest';
import * as tags from '../tags.js';
import { ELEMENT_CATEGORIES, CONSENT_SOURCES } from '../tags.js';
import { CATEGORY_REGISTRY } from '../schema.js';
import { translate } from '../translation.js';
import { validateCategoryRegistry } from '../boot-validators.js';
import { createDomainBridge } from '../domain-bridge.js';

// RISK end-to-end: descriptor → translator → bridge round-trip + render.
// Mirror of proposition-schema.test.js (created in sprint-02-bug-fix-01). Real
// imports per dr-20260514-06: no mocks of the Engine, bridge, schema, translator,
// or substrate. Bridge runs against the real `../../engine/Engine.js`.

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

describe('RISK — schema descriptor (AC-3.x)', () => {
  it('AC-3.1: requiredFields equals [statement, basis] in exact order', () => {
    expect(CATEGORY_REGISTRY[ELEMENT_CATEGORIES.RISK].requiredFields).toEqual([
      'statement', 'basis',
    ]);
  });

  it('AC-3.2: optionalFields contains severity', () => {
    expect(CATEGORY_REGISTRY[ELEMENT_CATEGORIES.RISK].optionalFields).toContain('severity');
  });

  it('AC-3.3: nonEmptyArrayFields equals [basis]', () => {
    expect(CATEGORY_REGISTRY[ELEMENT_CATEGORIES.RISK].nonEmptyArrayFields).toEqual(['basis']);
  });

  it('AC-3.4: referenceFields equals { basis: "*" }', () => {
    expect(CATEGORY_REGISTRY[ELEMENT_CATEGORIES.RISK].referenceFields).toEqual({ basis: '*' });
  });
});

describe('RISK — translator (AC-4.x)', () => {
  it('AC-4.1: basis array of N produces N risk_basis/2 facts plus the preserved risk/3 fact', () => {
    const out = translate(
      ELEMENT_CATEGORIES.RISK,
      { statement: 'R', basis: ['evid_1', 'prop_2'] },
      'risk_1',
      1700000000,
    );
    expect(out.baseFacts).toEqual(expect.arrayContaining([
      ['risk', ['risk_1', 'R', 'unspecified']],
      ['risk_basis', ['risk_1', 'evid_1']],
      ['risk_basis', ['risk_1', 'prop_2']],
    ]));
    const basisFacts = out.baseFacts.filter(f => f[0] === 'risk_basis');
    expect(basisFacts.length).toBe(2);
  });
});

describe('RISK — bridge round-trip (AC-6.2, AC-6.3, AC-6.4)', () => {
  it('AC-6.2: INVALID_REFERENCE thrown when basis contains a non-existent id', async () => {
    const bridge = await makeRealBridge();
    const evid = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'industry', claim: 'C' },
      designerConsent,
    );
    let captured = null;
    try {
      bridge.addElement(
        { idShape: ELEMENT_CATEGORIES.RISK, statement: 'R', basis: [evid.id, 'missing'] },
        designerConsent,
      );
    } catch (e) { captured = e; }
    expect(captured).not.toBeNull();
    expect(captured).toEqual(expect.objectContaining({
      code: 'INVALID_REFERENCE',
      field: 'basis',
      referencedId: 'missing',
    }));
  });

  it('AC-6.3: SHAPE_INVALID thrown when basis is an empty array', async () => {
    const bridge = await makeRealBridge();
    let captured = null;
    try {
      bridge.addElement(
        { idShape: ELEMENT_CATEGORIES.RISK, statement: 'R', basis: [] },
        designerConsent,
      );
    } catch (e) { captured = e; }
    expect(captured).not.toBeNull();
    expect(captured).toEqual(expect.objectContaining({
      code: 'SHAPE_INVALID',
      field: 'basis',
    }));
  });

  it('AC-6.4: error shape uses property-presence assertions (does not trip on stack)', async () => {
    const bridge = await makeRealBridge();
    const evid = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'industry', claim: 'C' },
      designerConsent,
    );
    let captured = null;
    try {
      bridge.addElement(
        { idShape: ELEMENT_CATEGORIES.RISK, statement: 'R', basis: [evid.id, 'gone'] },
        designerConsent,
      );
    } catch (e) { captured = e; }
    expect(captured).not.toBeNull();
    expect(captured.code).toBe('INVALID_REFERENCE');
    expect(captured.field).toBe('basis');
    expect(captured.referencedId).toBe('gone');
  });

  it('happy path: addElement RISK with multi-element basis lands N risk_basis/2 facts in EDB (T3 reviewer Important-84)', async () => {
    const bridge = await makeRealBridge();
    const e1 = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'industry', claim: 'C1' },
      designerConsent,
    );
    const e2 = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'industry', claim: 'C2' },
      designerConsent,
    );
    const risk = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.RISK, statement: 'R', basis: [e1.id, e2.id] },
      designerConsent,
    );
    const rows = bridge.queryProof({
      pattern: ['risk_basis', [risk.id, { var: 'E' }]],
    });
    expect(rows.length).toBe(2);
    const basisIds = new Set(rows.map(r => r.E));
    expect(basisIds).toEqual(new Set([e1.id, e2.id]));
  });
});

describe('RISK — render via bridge (AC-7.3)', () => {
  it('AC-7.3: risk with multi-element basis renders Basis: <ids> sub-line', async () => {
    const bridge = await makeRealBridge();
    const e1 = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'industry', claim: 'C1' },
      designerConsent,
    );
    const e2 = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'industry', claim: 'C2' },
      designerConsent,
    );
    const risk = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.RISK, statement: 'R-with-basis', basis: [e1.id, e2.id] },
      designerConsent,
    );
    const md = bridge.renderStructuredProof({});
    // Find the Basis line for this risk; order of ids inside the comma-joined list is
    // not guaranteed (query result order is engine-internal), so use set-equality on
    // comma-split ids per plan Watch-Item 9.
    const basisLines = md.split('\n').filter(l => l.trim().startsWith('- Basis:'));
    expect(basisLines.length).toBeGreaterThan(0);
    const ids = basisLines[0].split('Basis:')[1].split(',').map(s => s.trim());
    expect(new Set(ids)).toEqual(new Set([e1.id, e2.id]));
    // Cross-check the risk id appears in the rendered block.
    expect(md).toContain(risk.id);
  });
});

describe('RISK — bridge query auto-flow (AC-5.4)', () => {
  it('AC-5.4: queryProof works against new EDB predicates without explicit validPredicates edit', async () => {
    const bridge = await makeRealBridge();
    const evid = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'industry', claim: 'C' },
      designerConsent,
    );
    const rule = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.RULE, statement: 'R' },
      designerConsent,
    );
    bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.PERMISSION, statement: 'P', relieves: rule.id },
      designerConsent,
    );
    bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.RISK, statement: 'Ri', basis: [evid.id] },
      designerConsent,
    );

    // queryProof on each new/extended predicate must execute without throwing.
    expect(() => bridge.queryProof({ pattern: ['risk_basis', [{ var: 'R' }, { var: 'E' }]] })).not.toThrow();
    expect(() => bridge.queryProof({ pattern: ['permission', [{ var: 'P' }, { var: 'S' }, { var: 'R' }]] })).not.toThrow();
    expect(() => bridge.queryProof({ pattern: ['permission_scope', [{ var: 'P' }, { var: 'T' }]] })).not.toThrow();
  });
});

describe('RISK — boot validator (AC-9.2)', () => {
  it('AC-9.2: CATEGORY_REGISTRY boot validation passes with RISK referenceFields + nonEmptyArrayFields declared', () => {
    expect(() => validateCategoryRegistry(CATEGORY_REGISTRY, tags)).not.toThrow();
  });
});
