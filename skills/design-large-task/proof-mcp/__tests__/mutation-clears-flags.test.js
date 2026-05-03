import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { initializeState, applyOperations, addConcern, lockConcerns, ratifyResolveCondition, markChallengeUsed, manageFriction, overrideFrictionDisposition, loadState } from '../state.js';

function withFlagsSet(state) {
  state.closingArgPresentedRound = 3;
  state.closingArgGoRound = 3;
  return state;
}

describe('mutation-clears-flags', () => {
  it('applyOperations clears flags', () => {
    let s = withFlagsSet(initializeState('p'));
    let r = applyOperations(s, [{ op: 'add', type: 'EVIDENCE', statement: 'e', source: 'codebase' }]);
    s = r.state;
    s.closingArgPresentedRound = 3; s.closingArgGoRound = 3;
    r = applyOperations(s, [{ op: 'add', type: 'NECESSARY_CONDITION', statement: 'NC', collapse_test: 'a', grounding: ['EVID-1'], reasoning_chain: 'IF e THEN NC' }]);
    expect(r.state.closingArgPresentedRound).toBeNull();
    expect(r.state.closingArgGoRound).toBeNull();
  });

  it('addConcern clears flags', () => {
    let s = withFlagsSet(initializeState('p'));
    const [, newS] = addConcern(s, { label: 'C', description: 'd' });
    expect(newS.closingArgPresentedRound).toBeNull();
    expect(newS.closingArgGoRound).toBeNull();
  });

  it('lockConcerns clears flags', () => {
    let s = initializeState('p');
    const [, sa] = addConcern(s, { label: 'C', description: 'd' });
    s = withFlagsSet(sa);
    const [newS] = lockConcerns(s);
    expect(newS.closingArgPresentedRound).toBeNull();
    expect(newS.closingArgGoRound).toBeNull();
  });

  it('ratifyResolveCondition clears flags', () => {
    let s = initializeState('p');
    const [, sa] = addConcern(s, { label: 'C', description: 'd' });
    s = sa;
    [s] = lockConcerns(s);
    let r = applyOperations(s, [{ op: 'add', type: 'EVIDENCE', statement: 'e', source: 'codebase' }]);
    s = r.state;
    r = applyOperations(s, [
      { op: 'add', type: 'NECESSARY_CONDITION', statement: 'NC', collapse_test: 'a', grounding: ['EVID-1'], reasoning_chain: 'IF e THEN NC' },
      { op: 'add', type: 'RESOLVE_CONDITION', statement: 'RC', problem_anchor: 'CERN-1', grounding: ['NCON-1'] },
    ]);
    s = withFlagsSet(r.state);
    const [newS] = ratifyResolveCondition(s, { elementId: 'RCON-1', ratificationText: 'ok' });
    expect(newS.closingArgPresentedRound).toBeNull();
    expect(newS.closingArgGoRound).toBeNull();
  });

  it('markChallengeUsed clears flags', () => {
    let s = withFlagsSet(initializeState('p'));
    const newS = markChallengeUsed(s, 'devil');
    expect(newS.closingArgPresentedRound).toBeNull();
    expect(newS.closingArgGoRound).toBeNull();
  });

  it('manageFriction add clears flags', () => {
    let s = initializeState('p');
    let r = applyOperations(s, [{ op: 'add', type: 'EVIDENCE', statement: 'e', source: 'codebase' }]);
    s = r.state;
    r = applyOperations(s, [
      { op: 'add', type: 'NECESSARY_CONDITION', statement: 'NC1', collapse_test: 'a', grounding: ['EVID-1'], reasoning_chain: 'IF e THEN NC1' },
      { op: 'add', type: 'NECESSARY_CONDITION', statement: 'NC2', collapse_test: 'b', grounding: ['EVID-1'], reasoning_chain: 'IF e THEN NC2' },
    ]);
    s = withFlagsSet(r.state);
    const [, newS] = manageFriction(s, {
      op: 'add', friction_shape: 'nc-nc-opposing-pull',
      anchor_a: 'NCON-1', anchor_b: 'NCON-2',
      disposition: 'lived-with', statement: 'x',
    });
    expect(newS.closingArgPresentedRound).toBeNull();
    expect(newS.closingArgGoRound).toBeNull();
  });

  it('overrideFrictionDisposition clears flags', () => {
    let s = initializeState('p');
    let r = applyOperations(s, [{ op: 'add', type: 'EVIDENCE', statement: 'e', source: 'codebase' }]);
    s = r.state;
    r = applyOperations(s, [
      { op: 'add', type: 'NECESSARY_CONDITION', statement: 'NC1', collapse_test: 'a', grounding: ['EVID-1'], reasoning_chain: 'IF e THEN NC1' },
      { op: 'add', type: 'NECESSARY_CONDITION', statement: 'NC2', collapse_test: 'b', grounding: ['EVID-1'], reasoning_chain: 'IF e THEN NC2' },
    ]);
    s = r.state;
    [, s] = manageFriction(s, {
      op: 'add', friction_shape: 'nc-nc-opposing-pull',
      anchor_a: 'NCON-1', anchor_b: 'NCON-2',
      disposition: 'lived-with', statement: 'x',
    });
    s = withFlagsSet(s);
    const [newS] = overrideFrictionDisposition(s, { elementId: 'FRIC-1', disposition: 'relieved-by-exception' });
    expect(newS.closingArgPresentedRound).toBeNull();
    expect(newS.closingArgGoRound).toBeNull();
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
