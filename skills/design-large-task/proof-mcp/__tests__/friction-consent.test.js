import { describe, it, expect } from 'vitest';
import { initializeState, applyOperations, manageFriction, loadState, saveState } from '../state.js';
import { writeFileSync, mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const consent = { source: 'designer', rationale: 'add risk' };

function setupAnchors() {
  let state = initializeState('test');
  const r = applyOperations(state, [
    { op: 'add', type: 'EVIDENCE', statement: 'fact A', source: 'codebase' },
    { op: 'add', type: 'EVIDENCE', statement: 'fact B', source: 'codebase' },
  ], consent);
  return r.state;
}

function setupPermissionRiskLinkage() {
  let state = initializeState('test');
  let r = applyOperations(state, [
    { op: 'add', type: 'RULE', statement: 'must not Z', source: 'designer' },
  ], consent);
  state = r.state;
  return state;
}

describe('Friction source + consent inheritance', () => {
  it('user-added FRICTION via manage_friction has source set from input', () => {
    const s = setupAnchors();
    const [id, after, , err] = manageFriction(
      s,
      {
        op: 'add',
        friction_shape: 'nc-nc-opposing-pull',
        anchor_a: 'EVID-1',
        anchor_b: 'EVID-2',
        disposition: 'lived-with',
        source: 'session-observation',
      },
      consent,
    );
    expect(err).toBeNull();
    expect(after.elements.get(id).source).toBe('session-observation');
  });

  it('user-added FRICTION without explicit source defaults to agent-derivation', () => {
    const s = setupAnchors();
    const [id, after, , err] = manageFriction(
      s,
      {
        op: 'add',
        friction_shape: 'nc-nc-opposing-pull',
        anchor_a: 'EVID-1',
        anchor_b: 'EVID-2',
        disposition: 'lived-with',
      },
      consent,
    );
    expect(err).toBeNull();
    expect(after.elements.get(id).source).toBe('agent-derivation');
  });

  it('auto-created permission-risk-linkage Friction has source agent-derivation and creationConsent', () => {
    let state = setupPermissionRiskLinkage();
    const r = applyOperations(state, [
      { op: 'add', type: 'PERMISSION', statement: 'allow Z', source: 'designer', relieves: 'RULE-1' },
      { op: 'add', type: 'RISK', statement: 'Z is dangerous', basis: ['RULE-1'] },
    ], consent);
    state = r.state;
    const fric = [...state.elements.values()].find(e => e.type === 'FRICTION' && e.friction_shape === 'permission-risk-linkage');
    expect(fric).toBeDefined();
    expect(fric.source).toBe('agent-derivation');
    expect(fric.creationConsent).toEqual(consent);
  });

  it('operationLog entry for auto-create-friction carries parentConsent', () => {
    let state = setupPermissionRiskLinkage();
    const r = applyOperations(state, [
      { op: 'add', type: 'PERMISSION', statement: 'allow Z', source: 'designer', relieves: 'RULE-1' },
      { op: 'add', type: 'RISK', statement: 'Z is dangerous', basis: ['RULE-1'] },
    ], consent);
    state = r.state;
    const auto = state.operationLog.find(e => e.op === 'auto-create-friction');
    expect(auto).toBeDefined();
    expect(auto.consent).toEqual(consent);
    expect(auto.provenance.parentConsent).toEqual(consent);
    expect(auto.provenance.parentOp).toBe('applyOperations');
    expect(auto.type).toBe('FRICTION');
  });

  it('loadState backfills FRICTION.source to agent-derivation when missing', () => {
    const dir = mkdtempSync(join(tmpdir(), 'proof-friction-source-'));
    try {
      const filePath = join(dir, 'state.json');
      // Build a state, then strip source from a FRICTION element to simulate legacy.
      let state = setupPermissionRiskLinkage();
      const r = applyOperations(state, [
        { op: 'add', type: 'PERMISSION', statement: 'allow Z', source: 'designer', relieves: 'RULE-1' },
        { op: 'add', type: 'RISK', statement: 'Z is dangerous', basis: ['RULE-1'] },
      ], consent);
      state = r.state;
      const fric = [...state.elements.values()].find(e => e.type === 'FRICTION');
      delete fric.source;
      delete fric.creationConsent;
      saveState(state, filePath);
      const loaded = loadState(filePath);
      const loadedFric = loaded.elements.get(fric.id);
      expect(loadedFric.source).toBe('agent-derivation');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
