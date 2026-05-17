import { describe, it, expect } from 'vitest';
import * as tags from '../tags.js';
import { ELEMENT_CATEGORIES, CONSENT_SOURCES } from '../tags.js';
import { CATEGORY_REGISTRY } from '../schema.js';
import { translate } from '../translation.js';
import { validateCategoryRegistry } from '../boot-validators.js';
import { createDomainBridge } from '../domain-bridge.js';

// PERMISSION end-to-end: descriptor → translator → bridge round-trip + render.
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

describe('PERMISSION — schema descriptor (AC-1.x)', () => {
  it('AC-1.1: requiredFields equals [statement, relieves] in exact order', () => {
    expect(CATEGORY_REGISTRY[ELEMENT_CATEGORIES.PERMISSION].requiredFields).toEqual([
      'statement', 'relieves',
    ]);
  });

  it('AC-1.2: optionalFields contains rationale and scope_constraint', () => {
    const opt = CATEGORY_REGISTRY[ELEMENT_CATEGORIES.PERMISSION].optionalFields;
    expect(opt).toContain('rationale');
    expect(opt).toContain('scope_constraint');
  });

  it('AC-1.3: referenceFields equals { relieves: "rule" }', () => {
    expect(CATEGORY_REGISTRY[ELEMENT_CATEGORIES.PERMISSION].referenceFields).toEqual({
      relieves: 'rule',
    });
  });
});

describe('PERMISSION — translator (AC-2.x)', () => {
  it('AC-2.1: permission/3 emitted always', () => {
    const out = translate(
      ELEMENT_CATEGORIES.PERMISSION,
      { statement: 'P', relieves: 'rule_1' },
      'perm_1',
      1700000000,
    );
    expect(out.baseFacts).toEqual(expect.arrayContaining([
      ['permission', ['perm_1', 'P', 'rule_1']],
    ]));
  });

  it('AC-2.2: permission_scope/2 emitted when scope_constraint is supplied', () => {
    const out = translate(
      ELEMENT_CATEGORIES.PERMISSION,
      { statement: 'P', relieves: 'rule_1', scope_constraint: 'top-level only' },
      'perm_1',
      1700000000,
    );
    expect(out.baseFacts).toEqual(expect.arrayContaining([
      ['permission_scope', ['perm_1', 'top-level only']],
    ]));
  });

  it('AC-2.2: permission_scope/2 ABSENT when scope_constraint is not supplied', () => {
    const out = translate(
      ELEMENT_CATEGORIES.PERMISSION,
      { statement: 'P', relieves: 'rule_1' },
      'perm_1',
      1700000000,
    );
    const scopes = out.baseFacts.filter(f => f[0] === 'permission_scope');
    expect(scopes).toEqual([]);
  });

  it('AC-2.3: permission_decl/2 preserved', () => {
    const out = translate(
      ELEMENT_CATEGORIES.PERMISSION,
      { statement: 'P', relieves: 'rule_1' },
      'perm_1',
      1700000000,
    );
    expect(out.baseFacts).toEqual(expect.arrayContaining([
      ['permission_decl', ['perm_1', 'P']],
    ]));
  });
});

describe('PERMISSION — bridge round-trip (AC-6.1)', () => {
  it('AC-6.1: INVALID_REFERENCE thrown when relieves points at non-existent rule', async () => {
    const bridge = await makeRealBridge();
    let captured = null;
    try {
      bridge.addElement(
        { idShape: ELEMENT_CATEGORIES.PERMISSION, statement: 'P', relieves: 'rule_does_not_exist' },
        designerConsent,
      );
    } catch (e) { captured = e; }
    expect(captured).not.toBeNull();
    expect(captured).toEqual(expect.objectContaining({
      code: 'INVALID_REFERENCE',
      field: 'relieves',
      referencedId: 'rule_does_not_exist',
    }));
  });

  it('AC-6.4: INVALID_REFERENCE error shape uses property-presence assertion (does not trip on stack)', async () => {
    const bridge = await makeRealBridge();
    let captured = null;
    try {
      bridge.addElement(
        { idShape: ELEMENT_CATEGORIES.PERMISSION, statement: 'P', relieves: 'missing_rule' },
        designerConsent,
      );
    } catch (e) { captured = e; }
    expect(captured).not.toBeNull();
    expect(captured.code).toBe('INVALID_REFERENCE');
    expect(captured.field).toBe('relieves');
    expect(captured.referencedId).toBe('missing_rule');
  });

  it('happy path: addElement with valid relieves lands permission/3 fact in EDB', async () => {
    const bridge = await makeRealBridge();
    const rule = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.RULE, statement: 'R1' },
      designerConsent,
    );
    const perm = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.PERMISSION, statement: 'P', relieves: rule.id },
      designerConsent,
    );
    const rows = bridge.queryProof({
      pattern: ['permission', [perm.id, { var: 'S' }, { var: 'R' }]],
    });
    expect(rows.length).toBe(1);
    expect(rows[0].S).toBe('P');
    expect(rows[0].R).toBe(rule.id);
  });
});

describe('PERMISSION — render via bridge (AC-7.1, AC-7.2)', () => {
  it('AC-7.1/AC-7.2 positive: permission with scope_constraint renders Relieves and Scope sub-lines', async () => {
    const bridge = await makeRealBridge();
    const rule = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.RULE, statement: 'R1' },
      designerConsent,
    );
    const perm = bridge.addElement(
      {
        idShape: ELEMENT_CATEGORIES.PERMISSION,
        statement: 'P-with-scope',
        relieves: rule.id,
        scope_constraint: 'top-level only',
      },
      designerConsent,
    );
    const md = bridge.renderStructuredProof({});
    expect(md).toContain(`Relieves: ${rule.id}`);
    expect(md).toContain('Scope: top-level only');
    // Cross-check the perm id is present so we know we're looking at the right block.
    expect(md).toContain(perm.id);
  });

  it('AC-7.2 negative: permission without scope_constraint emits zero Scope sub-lines for that permission', async () => {
    const bridge = await makeRealBridge();
    const rule = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.RULE, statement: 'R1' },
      designerConsent,
    );
    bridge.addElement(
      {
        idShape: ELEMENT_CATEGORIES.PERMISSION,
        statement: 'P-no-scope',
        relieves: rule.id,
      },
      designerConsent,
    );
    const md = bridge.renderStructuredProof({});
    expect(md).toContain(`Relieves: ${rule.id}`);
    // No permission scope_constraint was supplied to any permission, so zero Scope: lines.
    const scopeLines = md.split('\n').filter(l => l.includes('Scope:'));
    expect(scopeLines).toEqual([]);
  });
});

describe('PERMISSION — boot validator (AC-9.2)', () => {
  it('AC-9.2: CATEGORY_REGISTRY boot validation passes with PERMISSION referenceFields declared', () => {
    expect(() => validateCategoryRegistry(CATEGORY_REGISTRY, tags)).not.toThrow();
  });
});
