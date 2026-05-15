import { describe, it, expect } from 'vitest';
import { ELEMENT_CATEGORIES, CONSENT_SOURCES, RENDER_SECTIONS, assertExhaustive } from '../tags.js';
import { CATEGORY_REGISTRY, verifyArgsShape } from '../schema.js';
import { translate, RULE_TEMPLATES, getDeclaredEDBPredicates, instantiateTemplate } from '../translation.js';
import { registerStatic as registerClosurePolicy } from '../closure-policy.js';

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

describe('CONCERN — schema', () => {
  it('AC-1.2: CATEGORY_REGISTRY[CONCERN] has expected shape', () => {
    const entry = CATEGORY_REGISTRY[ELEMENT_CATEGORIES.CONCERN];
    expect(entry).toBeDefined();
    expect(entry.requiredFields).toEqual(['label']);
    expect(entry.optionalFields).toEqual(['description']);
    expect(entry.idShape).toBe('concern');
    expect(entry.sourceConstraint).toBe(CONSENT_SOURCES.DESIGNER);
    expect(entry.renderSection).toBe(RENDER_SECTIONS.PROBLEM);
    expect(entry.closedEnumFields).toEqual({});
    expect(entry.authority.add).toEqual([CONSENT_SOURCES.DESIGNER]);
    expect(entry.authority.revise).toEqual([CONSENT_SOURCES.DESIGNER]);
    expect(entry.authority.withdraw).toEqual([CONSENT_SOURCES.DESIGNER]);
    expect(entry.authority.ratify).toEqual([CONSENT_SOURCES.DESIGNER, CONSENT_SOURCES.DESIGN_PARTNER]);
  });

  it('AC-1.3: verifyArgsShape accepts valid args, throws SHAPE_INVALID on missing label', () => {
    expect(verifyArgsShape({ label: 'C1' }, 'concern')).toEqual({ label: 'C1' });
    expect(verifyArgsShape({ label: 'C1', description: 'D1' }, 'concern')).toEqual({ label: 'C1', description: 'D1' });
    let captured = null;
    try { verifyArgsShape({}, 'concern'); } catch (e) { captured = e; }
    expect(captured).not.toBeNull();
    expect(captured.code).toBe('SHAPE_INVALID');
    expect(captured.field).toBe('label');
  });

  it('AC-1.2: schema test (existing): CATEGORY_REGISTRY has 9 descriptors keyed by ELEMENT_CATEGORIES', () => {
    expect(Object.keys(CATEGORY_REGISTRY).sort()).toEqual(Object.values(ELEMENT_CATEGORIES).sort());
  });
});

describe('CONCERN — translation', () => {
  it('AC-2.1: translator emits concern/3 and concern_status/2 base facts', () => {
    const result = translate(ELEMENT_CATEGORIES.CONCERN, { label: 'L1', description: 'D1' }, 'concern_1', 1700000000);
    expect(result.baseFacts).toEqual(expect.arrayContaining([
      ['concern', ['concern_1', 'L1', 'D1']],
      ['concern_status', ['concern_1', 'draft']],
    ]));
    expect(result.metaFacts).toEqual(expect.arrayContaining([
      ['created_at', ['concern_1', 1700000000]],
    ]));
    expect(result.rules).toEqual([]);
  });

  it('AC-2.1: translator defaults absent description to empty string', () => {
    const result = translate(ELEMENT_CATEGORIES.CONCERN, { label: 'L1' }, 'concern_2', 1700000000);
    expect(result.baseFacts).toEqual(expect.arrayContaining([
      ['concern', ['concern_2', 'L1', '']],
      ['concern_status', ['concern_2', 'draft']],
    ]));
  });

  it('AC-2.2: EDB_PREDICATES contains concern and concern_status', () => {
    const edb = getDeclaredEDBPredicates();
    expect(edb.has('concern')).toBe(true);
    expect(edb.has('concern_status')).toBe(true);
  });

  it('AC-2.3: RULE_TEMPLATES[CONCERN] builds the approved-implies-ratified rule', () => {
    const tmpl = RULE_TEMPLATES[ELEMENT_CATEGORIES.CONCERN];
    expect(tmpl).toBeDefined();
    expect(tmpl.elementCategory).toBe(ELEMENT_CATEGORIES.CONCERN);
    const built = tmpl.build('concern_1');
    expect(built.ruleId).toBe('concern_1_approved_implies_concern_status_ratified');
    expect(built.headAtom).toEqual(['concern_status', ['concern_1', 'ratified']]);
    expect(built.bodyAtoms).toEqual([
      ['concern', ['concern_1', '_', '_']],
      ['approved', ['concern_1', '_', '_']],
    ]);
    expect(built.metadata.domain_concept).toBe('concern_status_ratified');
    expect(built.metadata.element).toBe('concern_1');
  });
});

describe('CONCERN — Phase-C instantiation', () => {
  it('AC-2.3: instantiateTemplate(CONCERN, id) installs the per-element ratify-derives rule', () => {
    const calls = [];
    const fakeRulePorts = {
      defineRule: (ruleId, headAtom, bodyAtoms, metadata) => {
        calls.push({ ruleId, headAtom, bodyAtoms, metadata });
      },
    };
    instantiateTemplate('concern', 'concern_42', fakeRulePorts);
    expect(calls).toHaveLength(1);
    expect(calls[0].ruleId).toBe('concern_42_approved_implies_concern_status_ratified');
    expect(calls[0].headAtom).toEqual(['concern_status', ['concern_42', 'ratified']]);
  });
});

// Helper: boot a real Engine + closure-policy rules in isolation for derivation tests.
// The substrate fake's _runFixedPoint is a no-op stub (see _fixtures/inMemorySubstrate.js:126),
// so closure-policy rule firing must be verified against the real Engine. Dynamic import
// mirrors the pattern at bridge-integration.test.js:31, 37.
// The real Engine has a flat API: defineRule/assertFact/exists are instance methods.
async function makeRealEngineWithClosurePolicy() {
  const { Engine } = await import('../../engine/Engine.js');
  const engine = new Engine();
  // closure-policy.registerStatic expects rulePorts with {defineRule, undefineRule, getRule}.
  // The Engine instance exposes those methods directly.
  registerClosurePolicy(engine);
  return engine;
}

describe('CONCERN — closure-policy rules', () => {
  it('AC-4.3: covered(C) derives when concern_status(C, ratified) + addresses(R, C) + approved(R, _, _)', async () => {
    const engine = await makeRealEngineWithClosurePolicy();
    engine.assertFact('concern', ['concern_1', 'L1', 'D1']);
    engine.assertFact('concern_status', ['concern_1', 'ratified']);
    engine.assertFact('resolution_decl', ['resn_1', 'R1-statement']);
    engine.assertFact('addresses', ['resn_1', 'concern_1']);
    engine.assertFact('approved', ['resn_1', 'designer', 1700000000]);
    expect(engine.exists(['covered', ['concern_1']])).toBe(true);
  });

  it('AC-4.3: covered(C) does NOT derive when addressing Resolution is unapproved', async () => {
    const engine = await makeRealEngineWithClosurePolicy();
    engine.assertFact('concern_status', ['concern_1', 'ratified']);
    engine.assertFact('addresses', ['resn_1', 'concern_1']);
    // no approved(resn_1, _, _) fact
    expect(engine.exists(['covered', ['concern_1']])).toBe(false);
  });

  it('AC-4.1: unaddressed_concern(C) derives when ratified Concern has no covering Resolution', async () => {
    const engine = await makeRealEngineWithClosurePolicy();
    engine.assertFact('concern_status', ['concern_1', 'ratified']);
    expect(engine.exists(['unaddressed_concern', ['concern_1']])).toBe(true);
  });

  it('AC-4.1: unaddressed_concern(C) does NOT derive when Concern is covered', async () => {
    const engine = await makeRealEngineWithClosurePolicy();
    engine.assertFact('concern_status', ['concern_1', 'ratified']);
    engine.assertFact('addresses', ['resn_1', 'concern_1']);
    engine.assertFact('approved', ['resn_1', 'designer', 1700000000]);
    expect(engine.exists(['unaddressed_concern', ['concern_1']])).toBe(false);
  });

  it('AC-4.1: unaddressed_concern(C) does NOT derive when Concern is draft', async () => {
    const engine = await makeRealEngineWithClosurePolicy();
    engine.assertFact('concern_status', ['concern_1', 'draft']);
    expect(engine.exists(['unaddressed_concern', ['concern_1']])).toBe(false);
  });

  it('AC-4.2: closure_permitted is blocked when an unaddressed ratified Concern exists', async () => {
    const engine = await makeRealEngineWithClosurePolicy();
    engine.assertFact('concern_status', ['concern_1', 'ratified']);
    expect(engine.exists(['closure_permitted', []])).toBe(false);
  });

  it('AC-4.2: closure_permitted derives when every ratified Concern is covered', async () => {
    const engine = await makeRealEngineWithClosurePolicy();
    engine.assertFact('concern_status', ['concern_1', 'ratified']);
    engine.assertFact('addresses', ['resn_1', 'concern_1']);
    engine.assertFact('approved', ['resn_1', 'designer', 1700000000]);
    expect(engine.exists(['closure_permitted', []])).toBe(true);
  });
});
