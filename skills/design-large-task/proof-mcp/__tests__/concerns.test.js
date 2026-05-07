import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  initializeState, applyOperations, addConcern, lockConcerns,
  ratifyResolveCondition, saveState, loadState,
} from '../state.js';
import { checkClosure } from '../metrics.js';

describe('Concerns lifecycle — full integration', () => {
  let tmp;
  beforeEach(() => { tmp = mkdtempSync(join(tmpdir(), 'concerns-')); });
  afterEach(() => { rmSync(tmp, { recursive: true, force: true }); });

  it('enumerate → lock → add RC → ratify → close', () => {
    let state = initializeState('How to ensure correctness?');
    [, state] = addConcern(state, { label: 'Correctness', description: 'system rejects invalid input' }, { source: 'designer', rationale: 'test' });
    [, state] = addConcern(state, { label: 'Performance' }, { source: 'designer', rationale: 'test' });
    [state] = lockConcerns(state, { source: 'designer', rationale: 'test' });

    let result = applyOperations(state, [
      { op: 'add', type: 'EVIDENCE', statement: 'audit', source: 'codebase' },
      { op: 'add', type: 'NECESSARY_CONDITION', statement: 'must validate', grounding: ['EVID-1'], collapse_test: 'breaks', reasoning_chain: 'IF...THEN', rejected_alternatives: ['skip'] },
      { op: 'add', type: 'RESOLVE_CONDITION', statement: 'invalid input rejected', problem_anchor: 'CERN-1' },
    ], { source: 'designer', rationale: 'test' });
    expect(result.errors).toEqual([]);
    state = result.state;
    [state] = ratifyResolveCondition(state, { elementId: 'RCON-1', ratificationText: 'PM approves' }, { source: 'designer', rationale: 'test' });

    result = applyOperations(state, [
      { op: 'add', type: 'RULE', statement: 'preserve performance baseline', source: 'designer' },
      { op: 'revise', target: 'NCON-1', statement: 'must validate inputs robustly' },
    ], { source: 'designer', rationale: 'test' });
    expect(result.errors).toEqual([]);
    state = result.state;
    state.phaseTransitionRound = 1;
    // Satisfy closure minimum-rounds gate (round >= 3)
    state.round = 3;
    state.closingArgPresentedRound = state.round;
    state.closingArgGoRound = state.round;

    const closure = checkClosure(state);
    expect(closure.permitted).toBe(true);
    expect(closure.reasons).toEqual([]);
  });

  it('refuses to add Concern after lock; coverage refuses on uncovered Concern', () => {
    let state = initializeState('test');
    [, state] = addConcern(state, { label: 'A' }, { source: 'designer', rationale: 'test' });
    [, state] = addConcern(state, { label: 'B' }, { source: 'designer', rationale: 'test' });
    [state] = lockConcerns(state, { source: 'designer', rationale: 'test' });
    const [id, sameState, , err] = addConcern(state, { label: 'C' }, { source: 'designer', rationale: 'test' });
    expect(id).toBeNull();
    expect(err).toMatch(/locked/i);
    expect(sameState.concerns).toHaveLength(2);

    state.phaseTransitionRound = 0;
    state.round = 3;
    const result = applyOperations(state, [
      { op: 'add', type: 'EVIDENCE', statement: 'fact', source: 'codebase' },
      { op: 'add', type: 'NECESSARY_CONDITION', statement: 'NC', grounding: ['EVID-1'], collapse_test: 'breaks', reasoning_chain: 'IF...THEN', rejected_alternatives: ['alt'] },
    ], { source: 'designer', rationale: 'test' });
    state = result.state;
    state.elements.get('NCON-1').revisedInRound = 2;
    const closure = checkClosure(state);
    expect(closure.permitted).toBe(false);
    expect(closure.reasons.some(r => /CERN-1/.test(r))).toBe(true);
    expect(closure.reasons.some(r => /CERN-2/.test(r))).toBe(true);
  });

  it('round-trips state with concerns + ratificationLog through saveState/loadState', () => {
    let state = initializeState('test');
    [, state] = addConcern(state, { label: 'X', description: 'd' }, { source: 'designer', rationale: 'test' });
    [state] = lockConcerns(state, { source: 'designer', rationale: 'test' });
    const result = applyOperations(state, [
      { op: 'add', type: 'RESOLVE_CONDITION', statement: 's', problem_anchor: 'CERN-1' },
    ], { source: 'designer', rationale: 'test' });
    state = result.state;
    [state] = ratifyResolveCondition(state, { elementId: 'RCON-1', ratificationText: 'ok' }, { source: 'designer', rationale: 'test' });

    const path = join(tmp, 'state.json');
    saveState(state, path);
    const loaded = loadState(path);

    expect(loaded.concerns).toEqual(state.concerns);
    expect(loaded.concernsLocked).toBe(true);
    expect(loaded.ratificationLog).toHaveLength(1);
    expect(loaded.ratificationLog[0]).toMatchObject({ event: 'ratified', target: 'RCON-1' });
    expect(loaded.elements.get('RCON-1').ratification).toEqual({ ratifiedAtRound: 1, text: 'ok' });
  });
});
