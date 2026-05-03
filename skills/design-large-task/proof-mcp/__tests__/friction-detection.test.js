import { describe, it, expect } from 'vitest';
import { detectPermissionRiskLinkage, detectNcNcOpposingPull, detectRcRuleConflict, detectConcernConcernCompetition, runFrictionDetection } from '../friction-detection.js';

function el(id, type, extra = {}) {
  return { id, type, status: 'active', ...extra };
}

describe('friction-detection', () => {
  it('detectPermissionRiskLinkage returns exact match when permission relieves a rule a risk basis in', () => {
    const elements = new Map();
    elements.set('RULE-1', el('RULE-1', 'RULE'));
    elements.set('PERM-1', el('PERM-1', 'PERMISSION', { relieves: 'RULE-1' }));
    elements.set('RISK-1', el('RISK-1', 'RISK', { basis: ['RULE-1'] }));
    const out = detectPermissionRiskLinkage(elements);
    expect(out.length).toBe(1);
    expect(out[0].friction_shape).toBe('permission-risk-linkage');
    expect(out[0].anchor_a).toBe('PERM-1');
    expect(out[0].anchor_b).toBe('RISK-1');
  });

  it('detectPermissionRiskLinkage returns nothing when basis does not match relieves', () => {
    const elements = new Map();
    elements.set('RULE-1', el('RULE-1', 'RULE'));
    elements.set('RULE-2', el('RULE-2', 'RULE'));
    elements.set('PERM-1', el('PERM-1', 'PERMISSION', { relieves: 'RULE-1' }));
    elements.set('RISK-1', el('RISK-1', 'RISK', { basis: ['RULE-2'] }));
    expect(detectPermissionRiskLinkage(elements).length).toBe(0);
  });

  it('runFrictionDetection deduplicates by anchor pair plus audit_rule', () => {
    const elements = new Map();
    elements.set('RULE-1', el('RULE-1', 'RULE'));
    elements.set('PERM-1', el('PERM-1', 'PERMISSION', { relieves: 'RULE-1' }));
    elements.set('RISK-1', el('RISK-1', 'RISK', { basis: ['RULE-1'] }));
    elements.set('FRIC-1', el('FRIC-1', 'FRICTION', { anchor_a: 'PERM-1', anchor_b: 'RISK-1', friction_shape: 'permission-risk-linkage' }));
    const { hints, autoCreate } = runFrictionDetection(elements, []);
    expect(autoCreate.length).toBe(0);
    expect(hints.length).toBe(0);
  });

  it('runFrictionDetection auto-creates only permission-risk-linkage; heuristic shapes go to hints', () => {
    const elements = new Map();
    elements.set('RULE-1', el('RULE-1', 'RULE'));
    elements.set('PERM-1', el('PERM-1', 'PERMISSION', { relieves: 'RULE-1' }));
    elements.set('RISK-1', el('RISK-1', 'RISK', { basis: ['RULE-1'] }));
    elements.set('NCON-1', el('NCON-1', 'NECESSARY_CONDITION', { statement: 'must X' }));
    elements.set('NCON-2', el('NCON-2', 'NECESSARY_CONDITION', { statement: 'must not X' }));
    const { hints, autoCreate } = runFrictionDetection(elements, []);
    expect(autoCreate.find(c => c.friction_shape === 'permission-risk-linkage')).toBeDefined();
    expect(autoCreate.find(c => c.friction_shape === 'nc-nc-opposing-pull')).toBeUndefined();
    expect(hints.find(h => h.friction_shape === 'nc-nc-opposing-pull')).toBeDefined();
  });
});
