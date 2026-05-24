import { describe, it, expect } from 'vitest';
import { unlinkSync } from 'fs';
import {
  initializeState, applyOperations, addConcern, manageFriction, manageDefinitions,
  saveState,
  withdrawElement, withdrawConcern, withdrawDefinition,
} from '../state.js';
import { handleWithdraw } from '../server.js';

const consent = { source: 'designer', rationale: 'test' };

function seedWithEvidenceAndNc() {
  let state = initializeState('test problem');
  let r = applyOperations(state, [
    { op: 'add', type: 'EVIDENCE', statement: 'fact', source: 'codebase' },
  ], consent);
  state = r.state;
  r = applyOperations(state, [
    { op: 'add', type: 'NECESSARY_CONDITION', statement: 'NC1', grounding: ['EVID-1'], collapse_test: 'breaks', reasoning_chain: 'IF fact THEN NC1', rejected_alternatives: ['alt'] },
  ], consent);
  return r.state;
}

describe('withdrawElement (state layer)', () => {
  it('transitions NC to withdrawn with disposition', () => {
    const state = seedWithEvidenceAndNc();
    const [newState, err] = withdrawElement(state, 'NCON-1', 'superseded', consent);
    expect(err).toBeNull();
    const t = newState.elements.get('NCON-1');
    expect(t.status).toBe('withdrawn');
    expect(t.withdrawal_disposition).toBe('superseded');
    // Operation log entry recorded
    expect(newState.operationLog.some(e =>
      e.op === 'withdraw' && e.entityId === 'NCON-1' && e.type === 'NECESSARY_CONDITION'
      && e.provenance && e.provenance.disposition === 'superseded'
    )).toBe(true);
    // revisionLog entry recorded
    expect(newState.revisionLog.some(e =>
      e.event === 'withdrawn' && e.elementId === 'NCON-1' && e.disposition === 'superseded'
    )).toBe(true);
  });

  it('preserves source on withdrawal', () => {
    const state = seedWithEvidenceAndNc();
    // EVID-1 has source: 'codebase'
    const before = state.elements.get('EVID-1').source;
    expect(before).toBe('codebase');
    const [newState, err] = withdrawElement(state, 'EVID-1', 'found-redundant', consent);
    expect(err).toBeNull();
    expect(newState.elements.get('EVID-1').source).toBe('codebase');
    expect(newState.elements.get('EVID-1').status).toBe('withdrawn');
  });

  it('rejects invalid disposition with INVALID_DISPOSITION', () => {
    const state = seedWithEvidenceAndNc();
    const [, err] = withdrawElement(state, 'NCON-1', 'bogus', consent);
    expect(err).toMatch(/^INVALID_DISPOSITION/);
  });

  it('rejects FRICTION target with INVALID_CATEGORY', () => {
    let state = seedWithEvidenceAndNc();
    // Add a RULE so we can frict EVID-1 ↔ RULE-1
    let r = applyOperations(state, [
      { op: 'add', type: 'RULE', statement: 'r', source: 'designer' },
    ], consent);
    state = r.state;
    const [, withFric] = manageFriction(state, {
      op: 'add', friction_shape: 'rc-rule-conflict',
      anchor_a: 'EVID-1', anchor_b: 'RULE-1', disposition: 'lived-with',
    }, consent);
    state = withFric;
    // FRIC-1 should now exist
    expect(state.elements.get('FRIC-1')).toBeDefined();
    const [, err] = withdrawElement(state, 'FRIC-1', 'superseded', consent);
    expect(err).toMatch(/^INVALID_CATEGORY/);
    expect(err).toMatch(/override_friction_disposition/);
  });

  it('returns NOT_FOUND for unknown id', () => {
    const state = seedWithEvidenceAndNc();
    const [, err] = withdrawElement(state, 'NCON-999', 'superseded', consent);
    expect(err).toMatch(/^NOT_FOUND/);
  });

  it('rejects invalid consent', () => {
    const state = seedWithEvidenceAndNc();
    const [, err] = withdrawElement(state, 'NCON-1', 'superseded', undefined);
    expect(err).toMatch(/^INVALID_CONSENT/);
  });

  it('refuses re-withdrawing an already-withdrawn element', () => {
    let state = seedWithEvidenceAndNc();
    [state] = withdrawElement(state, 'NCON-1', 'superseded', consent);
    const [, err] = withdrawElement(state, 'NCON-1', 'superseded', consent);
    expect(err).toMatch(/^DOMAIN_ERROR/);
    expect(err).toMatch(/already/);
  });
});

describe('withdrawConcern (state layer)', () => {
  it('transitions Concern status to withdrawn with disposition', () => {
    let state = initializeState('p');
    [, state] = addConcern(state, { label: 'C1' }, consent);
    const [newState, err] = withdrawConcern(state, 'CERN-1', 'scope-removed', consent);
    expect(err).toBeNull();
    const c = newState.concerns.find(c => c.id === 'CERN-1');
    expect(c.status).toBe('withdrawn');
    expect(c.withdrawal_disposition).toBe('scope-removed');
    expect(newState.operationLog.some(e =>
      e.op === 'withdraw' && e.entityId === 'CERN-1' && e.type === 'CONCERN'
    )).toBe(true);
  });

  it('returns NOT_FOUND for unknown concern id', () => {
    const state = initializeState('p');
    const [, err] = withdrawConcern(state, 'CERN-99', 'scope-removed', consent);
    expect(err).toMatch(/^NOT_FOUND/);
  });

  it('rejects invalid disposition with INVALID_DISPOSITION', () => {
    let state = initializeState('p');
    [, state] = addConcern(state, { label: 'C1' }, consent);
    const [, err] = withdrawConcern(state, 'CERN-1', 'not-in-set', consent);
    expect(err).toMatch(/^INVALID_DISPOSITION/);
  });

  it('refuses re-withdrawing an already-withdrawn concern', () => {
    let state = initializeState('p');
    [, state] = addConcern(state, { label: 'C1' }, consent);
    [state] = withdrawConcern(state, 'CERN-1', 'scope-removed', consent);
    const [, err] = withdrawConcern(state, 'CERN-1', 'scope-removed', consent);
    expect(err).toMatch(/^DOMAIN_ERROR/);
    expect(err).toMatch(/already withdrawn/);
  });
});

describe('withdrawDefinition (state layer)', () => {
  it('transitions Definition status to withdrawn', () => {
    let state = initializeState('p');
    const [, withDef] = manageDefinitions(state, 'add', {
      canonical_name: 'Term', definition: 'A term defined.',
    }, consent);
    state = withDef;
    const [newState, err] = withdrawDefinition(state, 'DEFN-1', 'consolidated', consent);
    expect(err).toBeNull();
    const d = newState.definitions.find(d => d.id === 'DEFN-1');
    expect(d.status).toBe('withdrawn');
    expect(d.withdrawal_disposition).toBe('consolidated');
    expect(newState.operationLog.some(e =>
      e.op === 'withdraw' && e.entityId === 'DEFN-1' && e.type === 'DEFINITION'
    )).toBe(true);
  });

  it('returns NOT_FOUND for unknown definition id', () => {
    const state = initializeState('p');
    const [, err] = withdrawDefinition(state, 'DEFN-99', 'consolidated', consent);
    expect(err).toMatch(/^NOT_FOUND/);
  });

  it('rejects invalid disposition with INVALID_DISPOSITION', () => {
    let state = initializeState('p');
    const [, withDef] = manageDefinitions(state, 'add', {
      canonical_name: 'Term', definition: 'A term defined.',
    }, consent);
    state = withDef;
    const [, err] = withdrawDefinition(state, 'DEFN-1', 'not-in-set', consent);
    expect(err).toMatch(/^INVALID_DISPOSITION/);
  });

  it('writes withdrawal event to definitionLog (not revisionLog)', () => {
    let state = initializeState('p');
    const [, withDef] = manageDefinitions(state, 'add', {
      canonical_name: 'Term', definition: 'A term defined.',
    }, consent);
    state = withDef;
    const revBefore = state.revisionLog.length;
    const [newState] = withdrawDefinition(state, 'DEFN-1', 'consolidated', consent);
    expect(newState.definitionLog.some(e =>
      e.event === 'withdrawn' && e.definitionId === 'DEFN-1' && e.disposition === 'consolidated'
    )).toBe(true);
    expect(newState.revisionLog.length).toBe(revBefore);
  });

  it('refuses re-withdrawing an already-withdrawn definition', () => {
    let state = initializeState('p');
    const [, withDef] = manageDefinitions(state, 'add', {
      canonical_name: 'Term', definition: 'A term defined.',
    }, consent);
    state = withDef;
    [state] = withdrawDefinition(state, 'DEFN-1', 'consolidated', consent);
    const [, err] = withdrawDefinition(state, 'DEFN-1', 'consolidated', consent);
    expect(err).toMatch(/^DOMAIN_ERROR/);
    expect(err).toMatch(/already withdrawn/);
  });
});

describe('handleWithdraw (server layer)', () => {
  it('rejects category FRICTION with INVALID_CATEGORY referencing PERM-1', () => {
    const tmp = `/tmp/withdraw-friction-${Date.now()}.json`;
    saveState(initializeState('p'), tmp);
    const resp = handleWithdraw({
      state_file: tmp, category: 'FRICTION', element_id: 'FRIC-1',
      disposition: 'dissolved-by-revision', consent,
    });
    expect(resp.isError).toBe(true);
    const payload = JSON.parse(resp.content[0].text);
    expect(payload.code).toBe('INVALID_CATEGORY');
    expect(payload.message).toMatch(/PERM-1/);
    expect(payload.message).toMatch(/override_friction_disposition/);
    unlinkSync(tmp);
  });

  it('routes CONCERN to withdrawConcern (success path)', () => {
    const tmp = `/tmp/withdraw-concern-${Date.now()}.json`;
    let state = initializeState('p');
    [, state] = addConcern(state, { label: 'A' }, consent);
    saveState(state, tmp);
    const resp = handleWithdraw({
      state_file: tmp, category: 'CONCERN', element_id: 'CERN-1',
      disposition: 'scope-removed', consent,
    });
    expect(resp.isError).toBeUndefined();
    const payload = JSON.parse(resp.content[0].text);
    expect(payload.withdrawn).toBe('CERN-1');
    unlinkSync(tmp);
  });

  it('rejects CATEGORY_MISMATCH when prefix doesn\'t match category', () => {
    const tmp = `/tmp/withdraw-mismatch-${Date.now()}.json`;
    let state = initializeState('p');
    let r = applyOperations(state, [
      { op: 'add', type: 'EVIDENCE', statement: 'fact', source: 'codebase' },
    ], consent);
    state = r.state;
    saveState(state, tmp);
    // Caller says CONCERN but passes an EVIDENCE id.
    const resp = handleWithdraw({
      state_file: tmp, category: 'CONCERN', element_id: 'EVID-1',
      disposition: 'scope-removed', consent,
    });
    expect(resp.isError).toBe(true);
    const payload = JSON.parse(resp.content[0].text);
    expect(payload.code).toBe('CATEGORY_MISMATCH');
    unlinkSync(tmp);
  });

  it('rejects CATEGORY_MISMATCH on malformed id', () => {
    const tmp = `/tmp/withdraw-malformed-${Date.now()}.json`;
    saveState(initializeState('p'), tmp);
    const resp = handleWithdraw({
      state_file: tmp, category: 'EVIDENCE', element_id: 'NOTANID',
      disposition: 'scope-removed', consent,
    });
    expect(resp.isError).toBe(true);
    const payload = JSON.parse(resp.content[0].text);
    expect(payload.code).toBe('CATEGORY_MISMATCH');
    unlinkSync(tmp);
  });
});
