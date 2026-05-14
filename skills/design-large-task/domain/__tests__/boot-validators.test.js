import { describe, it, expect } from 'vitest';
import { validateOperationSpecs, validateCategoryRegistry, validateRuleTemplates, DomainBootError } from '../boot-validators.js';
import * as tags from '../tags.js';
import { CATEGORY_REGISTRY } from '../schema.js';
import { RULE_TEMPLATES } from '../translation.js';

describe('boot-validators', () => {
  it('validateCategoryRegistry passes a clean CATEGORY_REGISTRY', () => {
    expect(() => validateCategoryRegistry(CATEGORY_REGISTRY, tags)).not.toThrow();
  });

  it('validateCategoryRegistry throws on missing requiredFields', () => {
    const bad = { ...CATEGORY_REGISTRY, [tags.ELEMENT_CATEGORIES.EVIDENCE]: { ...CATEGORY_REGISTRY[tags.ELEMENT_CATEGORIES.EVIDENCE], requiredFields: [] } };
    expect(() => validateCategoryRegistry(bad, tags)).toThrow(DomainBootError);
  });

  it('validateOperationSpecs passes with empty-friendly spec set', () => {
    const validPredicates = new Set(['approved', 'evidence', 'closure_permitted', 'proposition']);
    const cleanSpecs = {
      openProof: { consentCategory: tags.CONSENT_SOURCES.DESIGNER, preconditions: [], idShape: tags.ELEMENT_CATEGORIES.EVIDENCE, translate: () => ({}), postconditions: [], clearsTwoYes: false, resultShape: {} },
    };
    expect(() => validateOperationSpecs(cleanSpecs, tags, validPredicates)).not.toThrow();
  });

  it('validateOperationSpecs throws on unresolved consentCategory', () => {
    const validPredicates = new Set();
    const bad = { x: { consentCategory: 'not_a_source', preconditions: [], idShape: tags.ELEMENT_CATEGORIES.EVIDENCE, translate: () => ({}), postconditions: [], clearsTwoYes: false, resultShape: {} } };
    expect(() => validateOperationSpecs(bad, tags, validPredicates)).toThrow(DomainBootError);
  });

  it('validateRuleTemplates passes a clean RULE_TEMPLATES', () => {
    expect(() => validateRuleTemplates(RULE_TEMPLATES, CATEGORY_REGISTRY)).not.toThrow();
  });

  it('validateRuleTemplates throws on unresolved elementCategory', () => {
    const bad = { ...RULE_TEMPLATES, junk: { elementCategory: 'not_a_category', build: () => ({ ruleId: 'x', headAtom: [], bodyAtoms: [] }) } };
    expect(() => validateRuleTemplates(bad, CATEGORY_REGISTRY)).toThrow(DomainBootError);
  });
});
