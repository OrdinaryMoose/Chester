import { describe, it, expect, vi } from 'vitest';
import { translate, RULE_TEMPLATES, registerRuleTemplates, instantiateTemplate, getDeclaredEDBPredicates } from '../translation.js';
import { ELEMENT_CATEGORIES } from '../tags.js';

describe('translation', () => {
  it('translate(Evidence) returns baseFacts with predicate "evidence"', () => {
    const out = translate(ELEMENT_CATEGORIES.EVIDENCE, { source: 'codebase', statement: 'x' }, 'evid_1', 1700000000);
    expect(out.baseFacts.some(f => f[0] === 'evidence')).toBe(true);
    expect(Array.isArray(out.rules)).toBe(true);
    expect(Array.isArray(out.metaFacts)).toBe(true);
  });

  it('translate(Proposition) returns approval-gated rule shape', () => {
    const out = translate(ELEMENT_CATEGORIES.PROPOSITION,
      { statement: 's', grounding: ['g'], collapse_test: 'ct', inference_pattern: 'grounds_imply_conclusion', reasoning_chain: 'IF X THEN Y' },
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

  it('PERMISSION translator emits permission/3, permission_scope/2 (conditional), and permission_decl/2', () => {
    const args = { statement: 'P statement', relieves: 'rule_1', scope_constraint: 'top-level only' };
    const result = translate(ELEMENT_CATEGORIES.PERMISSION, args, 'perm_1', 1700000000);
    const facts = result.baseFacts;
    // permission_decl/2 preserved
    expect(facts).toContainEqual(['permission_decl', ['perm_1', 'P statement']]);
    // permission/3 new linkage fact
    expect(facts).toContainEqual(['permission', ['perm_1', 'P statement', 'rule_1']]);
    // permission_scope/2 conditional
    expect(facts).toContainEqual(['permission_scope', ['perm_1', 'top-level only']]);
  });

  it('PERMISSION translator omits permission_scope when scope_constraint is absent', () => {
    const args = { statement: 'P', relieves: 'rule_1' };
    const result = translate(ELEMENT_CATEGORIES.PERMISSION, args, 'perm_2', 1700000000);
    const scopes = result.baseFacts.filter(f => f[0] === 'permission_scope');
    expect(scopes.length).toBe(0);
  });

  it('RISK translator spreads basis into one risk_basis/2 fact per element id', () => {
    const args = { statement: 'R statement', basis: ['evid_1', 'prop_2'] };
    const result = translate(ELEMENT_CATEGORIES.RISK, args, 'risk_1', 1700000000);
    const facts = result.baseFacts;
    // risk/3 preserved
    expect(facts).toContainEqual(['risk', ['risk_1', 'R statement', 'unspecified']]);
    // risk_basis/2 spread
    expect(facts).toContainEqual(['risk_basis', ['risk_1', 'evid_1']]);
    expect(facts).toContainEqual(['risk_basis', ['risk_1', 'prop_2']]);
    expect(facts.filter(f => f[0] === 'risk_basis').length).toBe(2);
  });

  it('RISK translator preserves severity when provided', () => {
    const args = { statement: 'R', basis: ['evid_1'], severity: 'high' };
    const result = translate(ELEMENT_CATEGORIES.RISK, args, 'risk_2', 1700000000);
    expect(result.baseFacts).toContainEqual(['risk', ['risk_2', 'R', 'high']]);
  });
});
