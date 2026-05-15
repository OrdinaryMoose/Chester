import { describe, it, expect } from 'vitest';
import { ELEMENT_CATEGORIES, CONSENT_SOURCES, RENDER_SECTIONS, assertExhaustive } from '../tags.js';
import { CATEGORY_REGISTRY, verifyArgsShape } from '../schema.js';
import { translate, RULE_TEMPLATES, getDeclaredEDBPredicates } from '../translation.js';

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
