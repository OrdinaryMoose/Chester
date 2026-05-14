import { describe, it, expect, vi } from 'vitest';
import { translate, RULE_TEMPLATES, registerRuleTemplates, instantiateTemplate, getDeclaredEDBPredicates } from '../translation.js';
import { ELEMENT_CATEGORIES } from '../tags.js';

describe('translation', () => {
  it('translate(Evidence) returns baseFacts with predicate "evidence"', () => {
    const out = translate(ELEMENT_CATEGORIES.EVIDENCE, { source: 'codebase', claim: 'x' }, 'evid_1', 1700000000);
    expect(out.baseFacts.some(f => f[0] === 'evidence')).toBe(true);
    expect(Array.isArray(out.rules)).toBe(true);
    expect(Array.isArray(out.metaFacts)).toBe(true);
  });

  it('translate(Proposition) returns approval-gated rule shape', () => {
    const out = translate(ELEMENT_CATEGORIES.PROPOSITION,
      { statement: 's', grounding: 'g', collapse_test: 'ct', inference_pattern: 'grounds_imply_conclusion' },
      'prop_1', 1700000000);
    // Proposition translation emits base facts (proposition_decl etc.) AND
    // a rule that fires when "approved" is asserted (per ADR-0003).
    expect(out.baseFacts.some(f => f[0] === 'proposition_decl')).toBe(true);
  });

  it('RULE_TEMPLATES has entries for approval-gated categories only', () => {
    expect(RULE_TEMPLATES[ELEMENT_CATEGORIES.PROPOSITION]).toBeDefined();
    expect(RULE_TEMPLATES[ELEMENT_CATEGORIES.RESOLUTION]).toBeDefined();
    expect(RULE_TEMPLATES[ELEMENT_CATEGORIES.DEFINITION]).toBeDefined();
    expect(RULE_TEMPLATES[ELEMENT_CATEGORIES.EVIDENCE]).toBeUndefined();
  });

  it('registerRuleTemplates defines a rule per approval-gated category', () => {
    const rulePorts = { defineRule: vi.fn(), undefineRule: vi.fn(), getRule: vi.fn() };
    registerRuleTemplates(rulePorts);
    // Approval-gated categories: Proposition, Resolution, Definition → at least 3 defines
    expect(rulePorts.defineRule.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  it('instantiateTemplate substitutes id and calls defineRule', () => {
    const rulePorts = { defineRule: vi.fn(), undefineRule: vi.fn(), getRule: vi.fn() };
    instantiateTemplate(ELEMENT_CATEGORIES.PROPOSITION, 'prop_42', rulePorts);
    expect(rulePorts.defineRule).toHaveBeenCalledTimes(1);
    const [ruleId] = rulePorts.defineRule.mock.calls[0];
    expect(ruleId).toContain('prop_42');
  });

  it('getDeclaredEDBPredicates returns set of base-fact predicate names', () => {
    const preds = getDeclaredEDBPredicates();
    expect(preds.has('evidence')).toBe(true);
    expect(preds.has('proposition_decl')).toBe(true);
  });
});
