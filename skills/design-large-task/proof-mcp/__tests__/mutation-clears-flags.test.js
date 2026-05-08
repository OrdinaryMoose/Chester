import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { initializeState, applyOperations, addConcern, ratifyConcern, ratifyResolveCondition, manageFriction, overrideFrictionDisposition, manageDefinitions, withdrawElement, withdrawConcern, withdrawDefinition, recordClosingArgPresented, recordDesignerGo, loadState, resetFirstYesIfFired } from '../state.js';

function withFlagsSet(state) {
  state.closingArgPresentedRound = 3;
  state.closingArgGoRound = 3;
  return state;
}

describe('mutation-clears-flags', () => {
  it('applyOperations clears flags', () => {
    let s = withFlagsSet(initializeState('p'));
    let r = applyOperations(s, [{ op: 'add', type: 'EVIDENCE', statement: 'e', source: 'codebase' }], { source: 'designer', rationale: 'test' });
    s = r.state;
    s.closingArgPresentedRound = 3; s.closingArgGoRound = 3;
    r = applyOperations(s, [{ op: 'add', type: 'NECESSARY_CONDITION', statement: 'NC', collapse_test: 'a', grounding: ['EVID-1'], reasoning_chain: 'IF e THEN NC' }], { source: 'designer', rationale: 'test' });
    expect(r.state.closingArgPresentedRound).toBeNull();
    expect(r.state.closingArgGoRound).toBeNull();
  });

  it('addConcern clears flags', () => {
    let s = withFlagsSet(initializeState('p'));
    const [, newS] = addConcern(s, { label: 'C', description: 'd' }, { source: 'designer', rationale: 'test' });
    expect(newS.closingArgPresentedRound).toBeNull();
    expect(newS.closingArgGoRound).toBeNull();
  });

  it('ratifyResolveCondition clears flags', () => {
    let s = initializeState('p');
    const [, sa] = addConcern(s, { label: 'C', description: 'd' }, { source: 'designer', rationale: 'test' });
    s = sa;
    let r = applyOperations(s, [{ op: 'add', type: 'EVIDENCE', statement: 'e', source: 'codebase' }], { source: 'designer', rationale: 'test' });
    s = r.state;
    r = applyOperations(s, [
      { op: 'add', type: 'NECESSARY_CONDITION', statement: 'NC', collapse_test: 'a', grounding: ['EVID-1'], reasoning_chain: 'IF e THEN NC' },
      { op: 'add', type: 'RESOLVE_CONDITION', statement: 'RC', problem_anchor: 'CERN-1', grounding: ['NCON-1'] },
    ], { source: 'designer', rationale: 'test' });
    s = withFlagsSet(r.state);
    const [newS] = ratifyResolveCondition(s, { elementId: 'RCON-1', ratificationText: 'ok' }, { source: 'designer', rationale: 'test' });
    expect(newS.closingArgPresentedRound).toBeNull();
    expect(newS.closingArgGoRound).toBeNull();
  });

  it('manageFriction add clears flags', () => {
    let s = initializeState('p');
    let r = applyOperations(s, [{ op: 'add', type: 'EVIDENCE', statement: 'e', source: 'codebase' }], { source: 'designer', rationale: 'test' });
    s = r.state;
    r = applyOperations(s, [
      { op: 'add', type: 'NECESSARY_CONDITION', statement: 'NC1', collapse_test: 'a', grounding: ['EVID-1'], reasoning_chain: 'IF e THEN NC1' },
      { op: 'add', type: 'NECESSARY_CONDITION', statement: 'NC2', collapse_test: 'b', grounding: ['EVID-1'], reasoning_chain: 'IF e THEN NC2' },
    ], { source: 'designer', rationale: 'test' });
    s = withFlagsSet(r.state);
    const [, newS] = manageFriction(s, {
      op: 'add', friction_shape: 'nc-nc-opposing-pull',
      anchor_a: 'NCON-1', anchor_b: 'NCON-2',
      disposition: 'lived-with', statement: 'x',
    }, { source: 'designer', rationale: 'test' });
    expect(newS.closingArgPresentedRound).toBeNull();
    expect(newS.closingArgGoRound).toBeNull();
  });

  it('overrideFrictionDisposition clears flags', () => {
    let s = initializeState('p');
    let r = applyOperations(s, [{ op: 'add', type: 'EVIDENCE', statement: 'e', source: 'codebase' }], { source: 'designer', rationale: 'test' });
    s = r.state;
    r = applyOperations(s, [
      { op: 'add', type: 'NECESSARY_CONDITION', statement: 'NC1', collapse_test: 'a', grounding: ['EVID-1'], reasoning_chain: 'IF e THEN NC1' },
      { op: 'add', type: 'NECESSARY_CONDITION', statement: 'NC2', collapse_test: 'b', grounding: ['EVID-1'], reasoning_chain: 'IF e THEN NC2' },
    ], { source: 'designer', rationale: 'test' });
    s = r.state;
    [, s] = manageFriction(s, {
      op: 'add', friction_shape: 'nc-nc-opposing-pull',
      anchor_a: 'NCON-1', anchor_b: 'NCON-2',
      disposition: 'lived-with', statement: 'x',
    }, { source: 'designer', rationale: 'test' });
    s = withFlagsSet(s);
    const [newS] = overrideFrictionDisposition(s, { elementId: 'FRIC-1', disposition: 'relieved-by-exception' }, { source: 'designer', rationale: 'test' });
    expect(newS.closingArgPresentedRound).toBeNull();
    expect(newS.closingArgGoRound).toBeNull();
  });

  it('ratifyConcern (manage_concerns ratify) clears flags', () => {
    let s = initializeState('p');
    const [, sa] = addConcern(s, { label: 'C', description: 'd' }, { source: 'designer', rationale: 'test' });
    s = sa;
    s = withFlagsSet(s);
    const [newS] = ratifyConcern(s, 'CERN-1', { source: 'designer', rationale: 'test' });
    expect(newS.closingArgPresentedRound).toBeNull();
    expect(newS.closingArgGoRound).toBeNull();
  });

  it('manageDefinitions add clears flags', () => {
    let s = withFlagsSet(initializeState('p'));
    const [, newS] = manageDefinitions(s, 'add', { canonical_name: 'X', definition: 'd' }, { source: 'designer', rationale: 'test' });
    expect(newS.closingArgPresentedRound).toBeNull();
    expect(newS.closingArgGoRound).toBeNull();
  });

  it('manageDefinitions revise clears flags', () => {
    let s = initializeState('p');
    let [id, sa] = manageDefinitions(s, 'add', { canonical_name: 'X', definition: 'old' }, { source: 'designer', rationale: 'test' });
    s = withFlagsSet(sa);
    const [, newS] = manageDefinitions(s, 'revise', { id, definition: 'new' }, { source: 'designer', rationale: 'test' });
    expect(newS.closingArgPresentedRound).toBeNull();
    expect(newS.closingArgGoRound).toBeNull();
  });

  it('manageDefinitions ratify clears flags', () => {
    let s = initializeState('p');
    let [id, sa] = manageDefinitions(s, 'add', { canonical_name: 'X', definition: 'd' }, { source: 'designer', rationale: 'test' });
    s = withFlagsSet(sa);
    const [, newS] = manageDefinitions(s, 'ratify', { id }, { source: 'designer', rationale: 'test' });
    expect(newS.closingArgPresentedRound).toBeNull();
    expect(newS.closingArgGoRound).toBeNull();
  });

  it('withdrawElement clears flags', () => {
    let s = initializeState('p');
    let r = applyOperations(s, [{ op: 'add', type: 'EVIDENCE', statement: 'e', source: 'codebase' }], { source: 'designer', rationale: 'test' });
    s = r.state;
    r = applyOperations(s, [
      { op: 'add', type: 'NECESSARY_CONDITION', statement: 'NC', collapse_test: 'a', grounding: ['EVID-1'], reasoning_chain: 'IF e THEN NC' },
    ], { source: 'designer', rationale: 'test' });
    s = withFlagsSet(r.state);
    const [newS, err] = withdrawElement(s, 'NCON-1', 'superseded', { source: 'designer', rationale: 'test' });
    expect(err).toBeNull();
    expect(newS.closingArgPresentedRound).toBeNull();
    expect(newS.closingArgGoRound).toBeNull();
  });

  it('withdrawConcern clears flags', () => {
    let s = initializeState('p');
    const [, sa] = addConcern(s, { label: 'C', description: 'd' }, { source: 'designer', rationale: 'test' });
    s = withFlagsSet(sa);
    const [newS, err] = withdrawConcern(s, 'CERN-1', 'scope-removed', { source: 'designer', rationale: 'test' });
    expect(err).toBeNull();
    expect(newS.closingArgPresentedRound).toBeNull();
    expect(newS.closingArgGoRound).toBeNull();
  });

  it('withdrawDefinition clears flags', () => {
    let s = initializeState('p');
    let [id, sa] = manageDefinitions(s, 'add', { canonical_name: 'X', definition: 'd' }, { source: 'designer', rationale: 'test' });
    s = withFlagsSet(sa);
    const [newS, err] = withdrawDefinition(s, id, 'consolidated', { source: 'designer', rationale: 'test' });
    expect(err).toBeNull();
    expect(newS.closingArgPresentedRound).toBeNull();
    expect(newS.closingArgGoRound).toBeNull();
  });

  // Task 14 invariant: recordDesignerGo is the documented exception that does NOT
  // clear the closing flags — closure must remain observable. recordDesignerGo
  // itself sets closingArgGoRound = round (it does not clear), and preserves the
  // existing closingArgPresentedRound.
  it('recordDesignerGo does NOT clear flags (Task 14 invariant)', () => {
    const consent = { source: 'designer', rationale: 'test' };
    let s = initializeState('p');
    const [, sa] = addConcern(s, { label: 'concern X', description: 'd' }, consent);
    s = sa;
    [s] = ratifyConcern(s, 'CERN-1', consent);
    let r = applyOperations(s, [
      { op: 'add', type: 'EVIDENCE', statement: 'fact', source: 'codebase' },
      { op: 'add', type: 'NECESSARY_CONDITION', statement: 'must Q', collapse_test: 'breaks', grounding: ['EVID-1'], reasoning_chain: 'IF fact THEN must Q', rejected_alternatives: ['alt1'] },
      { op: 'add', type: 'RESOLVE_CONDITION', statement: 'system Qs', problem_anchor: 'CERN-1', grounding: ['NCON-1'] },
    ], consent);
    s = r.state;
    [s] = ratifyResolveCondition(s, { elementId: 'RCON-1', ratificationText: 'ok' }, consent);
    while (s.round < 3) { r = applyOperations(s, [], consent); s = r.state; }
    [s] = recordClosingArgPresented(s, consent);
    // Pre-go: presentedRound is current round, goRound is null.
    const presentedBefore = s.closingArgPresentedRound;
    expect(presentedBefore).toBe(s.round);
    expect(s.closingArgGoRound).toBeNull();
    const [newS, err] = recordDesignerGo(s, consent);
    expect(err).toBeNull();
    // recordDesignerGo PRESERVES presentedRound and SETS goRound — neither becomes null.
    expect(newS.closingArgPresentedRound).toBe(presentedBefore);
    expect(newS.closingArgGoRound).toBe(newS.round);
    expect(newS.closingArgPresentedRound).not.toBeNull();
    expect(newS.closingArgGoRound).not.toBeNull();
  });

  describe('resetFirstYesIfFired', () => {
    it('clears both two-yes flags on a passed state', () => {
      const s = { closingArgPresentedRound: 5, closingArgGoRound: 5 };
      resetFirstYesIfFired(s);
      expect(s.closingArgPresentedRound).toBeNull();
      expect(s.closingArgGoRound).toBeNull();
    });
  });

  // Read-only invariant of AC-5.5: get_proof_state / loadState do not mutate flags
  describe('read-only paths do NOT clear flags', () => {
    let dir;
    beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'proof-')); });
    afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

    it('loadState preserves both flag values from disk', () => {
      const path = join(dir, 'state.json');
      const s = withFlagsSet(initializeState('p'));
      writeFileSync(path, JSON.stringify({ ...s, elements: Object.fromEntries(s.elements) }));
      const loaded = loadState(path);
      expect(loaded.closingArgPresentedRound).toBe(3);
      expect(loaded.closingArgGoRound).toBe(3);
    });
  });
});
