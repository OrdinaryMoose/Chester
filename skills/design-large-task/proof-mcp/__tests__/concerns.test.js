import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  initializeState, applyOperations, addConcern, lockConcerns,
  ratifyResolveCondition, ratifyConcern, saveState, loadState,
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

describe('Concern status field', () => {
  let tmp;
  beforeEach(() => { tmp = mkdtempSync(join(tmpdir(), 'concern-status-')); });
  afterEach(() => { rmSync(tmp, { recursive: true, force: true }); });

  const consent = { source: 'designer', rationale: 't' };

  it('addConcern creates Concern with status: draft', () => {
    let s = initializeState('test problem');
    [, s] = addConcern(s, { label: 'C-1', description: 'd' }, consent);
    expect(s.concerns[0].status).toBe('draft');
  });

  it('ratifyConcern transitions status to ratified', () => {
    let s = initializeState('test problem');
    [, s] = addConcern(s, { label: 'C-1', description: 'd' }, consent);
    const id = s.concerns[0].id;
    let err;
    [s, err] = ratifyConcern(s, id, consent);
    expect(err).toBeNull();
    expect(s.concerns[0].status).toBe('ratified');
  });

  it('ratifyConcern returns NOT_FOUND when id absent', () => {
    let s = initializeState('test problem');
    const [, err] = ratifyConcern(s, 'CERN-999', consent);
    expect(err).toMatch(/NOT_FOUND/);
  });

  it('ratifyConcern rejects invalid consent', () => {
    let s = initializeState('test problem');
    [, s] = addConcern(s, { label: 'C-1' }, consent);
    const id = s.concerns[0].id;
    const [, err] = ratifyConcern(s, id, { source: 'bogus' });
    expect(err).toMatch(/INVALID_CONSENT/);
  });

  it('ratifyConcern clears two-yes closing flags and appends operationLog entry', () => {
    let s = initializeState('test problem');
    [, s] = addConcern(s, { label: 'C-1' }, consent);
    const id = s.concerns[0].id;
    s.closingArgPresentedRound = 5;
    s.closingArgGoRound = 5;
    const [next] = ratifyConcern(s, id, consent);
    expect(next.closingArgPresentedRound).toBeNull();
    expect(next.closingArgGoRound).toBeNull();
    const lastOp = next.operationLog[next.operationLog.length - 1];
    expect(lastOp.op).toBe('ratify');
    expect(lastOp.type).toBe('CONCERN');
    expect(lastOp.entityId).toBe(id);
    expect(lastOp.changedFields).toEqual(['status']);
    expect(lastOp.provenance).toEqual({ before: 'draft', after: 'ratified' });
  });

  it('loadState backfills draft status on legacy state with concernsLocked: false', () => {
    const legacy = {
      schemaVersion: 1,
      round: 0,
      problemStatement: 't',
      elements: {},
      elementCounters: { EVIDENCE: 0, RULE: 0, PERMISSION: 0, NECESSARY_CONDITION: 0, RISK: 0, RESOLVE_CONDITION: 0, FRICTION: 0 },
      conditionCountHistory: [],
      elementCountHistory: [],
      challengeModesUsed: [],
      challengeLog: [],
      revisionLog: [],
      phaseTransitionRound: 0,
      concerns: [{ id: 'CERN-1', label: 'A', description: 'd' }],
      concernsLocked: false,
      concernCounter: 1,
      ratificationLog: [],
      frictionLog: [],
      closingArgPresentedRound: null,
      closingArgGoRound: null,
      proofStatus: 'open',
      operationLog: [],
    };
    const path = join(tmp, 'legacy-unlocked.json');
    writeFileSync(path, JSON.stringify(legacy));
    const loaded = loadState(path);
    expect(loaded.concerns[0].status).toBe('draft');
  });

  it('loadState backfills ratified status on legacy state with concernsLocked: true', () => {
    const legacy = {
      schemaVersion: 1,
      round: 0,
      problemStatement: 't',
      elements: {},
      elementCounters: { EVIDENCE: 0, RULE: 0, PERMISSION: 0, NECESSARY_CONDITION: 0, RISK: 0, RESOLVE_CONDITION: 0, FRICTION: 0 },
      conditionCountHistory: [],
      elementCountHistory: [],
      challengeModesUsed: [],
      challengeLog: [],
      revisionLog: [],
      phaseTransitionRound: 0,
      concerns: [{ id: 'CERN-1', label: 'A', description: 'd' }],
      concernsLocked: true,
      concernCounter: 1,
      ratificationLog: [],
      frictionLog: [],
      closingArgPresentedRound: null,
      closingArgGoRound: null,
      proofStatus: 'open',
      operationLog: [],
    };
    const path = join(tmp, 'legacy-locked.json');
    writeFileSync(path, JSON.stringify(legacy));
    const loaded = loadState(path);
    expect(loaded.concerns[0].status).toBe('ratified');
  });

  it('loadState preserves explicit status when already present', () => {
    const stateObj = {
      schemaVersion: 1,
      round: 0,
      problemStatement: 't',
      elements: {},
      elementCounters: { EVIDENCE: 0, RULE: 0, PERMISSION: 0, NECESSARY_CONDITION: 0, RISK: 0, RESOLVE_CONDITION: 0, FRICTION: 0 },
      conditionCountHistory: [],
      elementCountHistory: [],
      challengeModesUsed: [],
      challengeLog: [],
      revisionLog: [],
      phaseTransitionRound: 0,
      concerns: [{ id: 'CERN-1', label: 'A', description: 'd', status: 'ratified' }],
      concernsLocked: false,
      concernCounter: 1,
      ratificationLog: [],
      frictionLog: [],
      closingArgPresentedRound: null,
      closingArgGoRound: null,
      proofStatus: 'open',
      operationLog: [],
    };
    const path = join(tmp, 'preserve.json');
    writeFileSync(path, JSON.stringify(stateObj));
    const loaded = loadState(path);
    expect(loaded.concerns[0].status).toBe('ratified');
  });
});
