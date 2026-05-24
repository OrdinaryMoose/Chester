import { describe, it, expect } from 'vitest';
import { detectPermissionRiskLinkage, detectNcNcOpposingPull, detectRcRuleConflict, detectConcernConcernCompetition, runFrictionDetection } from '../friction-detection.js';
import { initializeState, applyOperations } from '../state.js';

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

describe('friction detection wired into applyOperations', () => {
  it('auto-creates permission-risk-linkage FRICTION on next applyOperations call', () => {
    let state = initializeState('test');
    let r = applyOperations(state, [
      { op: 'add', type: 'RULE', statement: 'must not Z', source: 'designer' },
    ], { source: 'designer', rationale: 'test' });
    state = r.state;
    r = applyOperations(state, [
      { op: 'add', type: 'PERMISSION', statement: 'allow Z', source: 'designer', relieves: 'RULE-1' },
      { op: 'add', type: 'RISK', statement: 'Z is dangerous', basis: ['RULE-1'] },
    ], { source: 'designer', rationale: 'test' });
    state = r.state;
    const fric = [...state.elements.values()].find(el => el.type === 'FRICTION');
    expect(fric).toBeDefined();
    expect(fric.friction_shape).toBe('permission-risk-linkage');
  });

  it('returns friction_hints[] in payload for heuristic shapes', () => {
    let state = initializeState('test');
    let r = applyOperations(state, [
      { op: 'add', type: 'EVIDENCE', statement: 'fact', source: 'codebase' },
    ], { source: 'designer', rationale: 'test' });
    state = r.state;
    r = applyOperations(state, [
      { op: 'add', type: 'NECESSARY_CONDITION', statement: 'must X', collapse_test: 'a', grounding: ['EVID-1'], reasoning_chain: 'IF X' },
      { op: 'add', type: 'NECESSARY_CONDITION', statement: 'must not X', collapse_test: 'b', grounding: ['EVID-1'], reasoning_chain: 'IF not X' },
    ], { source: 'designer', rationale: 'test' });
    expect(r.friction_hints).toBeDefined();
    expect(r.friction_hints.some(h => h.friction_shape === 'nc-nc-opposing-pull')).toBe(true);
  });

  it('does not re-create a permission-risk-linkage FRICTION after the designer dismisses it', async () => {
    const { overrideFrictionDisposition, manageFriction } = await import('../state.js');
    let state = initializeState('test');
    let r = applyOperations(state, [
      { op: 'add', type: 'RULE', statement: 'must not Z', source: 'designer' },
    ], { source: 'designer', rationale: 'test' });
    state = r.state;
    r = applyOperations(state, [
      { op: 'add', type: 'PERMISSION', statement: 'allow Z', source: 'designer', relieves: 'RULE-1' },
      { op: 'add', type: 'RISK', statement: 'Z is dangerous', basis: ['RULE-1'] },
    ], { source: 'designer', rationale: 'test' });
    state = r.state;
    const fric = [...state.elements.values()].find(el => el.type === 'FRICTION');
    expect(fric).toBeDefined();
    const fricId = fric.id;

    // Designer dismisses the auto-created friction.
    const [s2] = overrideFrictionDisposition(state, { elementId: fricId, disposition: 'not-really-friction' }, { source: 'designer', rationale: 'test' });
    expect(s2.elements.get(fricId).status).toBe('withdrawn');

    // Next mutation must NOT re-create the same anchor pair as a new FRIC element.
    r = applyOperations(s2, [
      { op: 'add', type: 'EVIDENCE', statement: 'unrelated fact', source: 'codebase' },
    ], { source: 'designer', rationale: 'test' });
    const frictions = [...r.state.elements.values()].filter(el => el.type === 'FRICTION');
    expect(frictions.length).toBe(1);
    expect(frictions[0].id).toBe(fricId);
    expect(frictions[0].status).toBe('withdrawn');
  });
});
