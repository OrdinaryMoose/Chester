import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  initializeState,
  generateId,
  applyOperations,
  saveState,
  loadState,
  addConcern,
  ratifyConcern,
  ratifyResolveCondition,
  recordDesignerGo,
  recordClosingArgPresented,
  manageFriction,
  overrideFrictionDisposition,
  manageDefinitions,
  withdrawElement,
  withdrawConcern,
  withdrawDefinition,
} from '../state.js';
import { createElement } from '../proof.js';

describe('initializeState', () => {
  it('creates clean state with all required fields', () => {
    const state = initializeState('Design a widget');
    expect(state.round).toBe(0);
    expect(state.problemStatement).toBe('Design a widget');
    expect(state.elements).toBeInstanceOf(Map);
    expect(state.elements.size).toBe(0);
    expect(state.elementCounters).toEqual({
      EVIDENCE: 0, RULE: 0, PERMISSION: 0, NECESSARY_CONDITION: 0, RISK: 0, RESOLVE_CONDITION: 0, FRICTION: 0,
    });
    expect(state.revisionLog).toEqual([]);
    expect(state.phaseTransitionRound).toBe(0);
  });

  it('includes RESOLVE_CONDITION in elementCounters', () => {
    const state = initializeState('Design a widget');
    expect(state.elementCounters).toEqual({
      EVIDENCE: 0, RULE: 0, PERMISSION: 0, NECESSARY_CONDITION: 0, RISK: 0, RESOLVE_CONDITION: 0, FRICTION: 0,
    });
  });

  it('generates RCON- prefixed IDs for RESOLVE_CONDITION', () => {
    const state = initializeState('test');
    const [id] = generateId(state, 'RESOLVE_CONDITION');
    expect(id).toBe('RCON-1');
  });

  it('initializes Concerns lifecycle fields (no concernsLocked; AC-2.2)', () => {
    const state = initializeState('test');
    expect(state.concerns).toEqual([]);
    expect(state).not.toHaveProperty('concernsLocked');
    expect(state.concernCounter).toBe(0);
  });

  it('initializes ratificationLog as empty array', () => {
    const state = initializeState('test');
    expect(state.ratificationLog).toEqual([]);
  });
});

describe('ratifyResolveCondition', () => {
  it('ratifies a single active RESOLVE_CONDITION', () => {
    let state = initializeState('test');
    [, state] = addConcern(state, { label: 'C1' }, { source: 'designer', rationale: 'test' });
    const result = applyOperations(state, [
      { op: 'add', type: 'RESOLVE_CONDITION', statement: 'X', problem_anchor: 'CERN-1' },
    ], { source: 'designer', rationale: 'test' });
    state = result.state;
    const [newState, , err] = ratifyResolveCondition(state, { elementId: 'RCON-1', ratificationText: 'PM approves' }, { source: 'designer', rationale: 'test' });
    expect(err).toBeNull();
    const rc = newState.elements.get('RCON-1');
    expect(rc.ratification).toEqual({ ratifiedAtRound: state.round, text: 'PM approves' });
    expect(newState.ratificationLog).toHaveLength(1);
    expect(newState.ratificationLog[0]).toMatchObject({
      event: 'ratified', target: 'RCON-1', ratificationText: 'PM approves',
    });
  });

  it('rejects ratification of a non-RC element', () => {
    let state = initializeState('test');
    const result = applyOperations(state, [
      { op: 'add', type: 'EVIDENCE', statement: 'fact', source: 'codebase' },
    ], { source: 'designer', rationale: 'test' });
    state = result.state;
    const [sameState, , err] = ratifyResolveCondition(state, { elementId: 'EVID-1', ratificationText: 'X' }, { source: 'designer', rationale: 'test' });
    expect(err).toMatch(/RESOLVE_CONDITION/);
    expect(sameState).toBe(state);
  });

  it('rejects ratification of unknown element', () => {
    const state = initializeState('test');
    const [, , err] = ratifyResolveCondition(state, { elementId: 'RCON-99', ratificationText: 'X' }, { source: 'designer', rationale: 'test' });
    expect(err).toMatch(/not found/i);
  });

  it('rejects empty ratificationText', () => {
    let state = initializeState('test');
    [, state] = addConcern(state, { label: 'C1' }, { source: 'designer', rationale: 'test' });
    const result = applyOperations(state, [
      { op: 'add', type: 'RESOLVE_CONDITION', statement: 'X', problem_anchor: 'CERN-1' },
    ], { source: 'designer', rationale: 'test' });
    state = result.state;
    const [, , err] = ratifyResolveCondition(state, { elementId: 'RCON-1', ratificationText: '' }, { source: 'designer', rationale: 'test' });
    expect(err).toMatch(/required/i);
  });
});

describe('addConcern', () => {
  it('appends Concern with sequential CERN- ID', () => {
    let state = initializeState('test');
    const [id1, state1, , err1] = addConcern(state, { label: 'First', description: 'D1' }, { source: 'designer', rationale: 'test' });
    expect(err1).toBeNull();
    expect(id1).toBe('CERN-1');
    expect(state1.concerns).toHaveLength(1);
    expect(state1.concerns[0]).toEqual({ id: 'CERN-1', label: 'First', description: 'D1', status: 'draft' });
    expect(state1.concernCounter).toBe(1);

    const [id2, state2, , err2] = addConcern(state1, { label: 'Second' }, { source: 'designer', rationale: 'test' });
    expect(err2).toBeNull();
    expect(id2).toBe('CERN-2');
    expect(state2.concerns).toHaveLength(2);
    expect(state2.concerns[1].description).toBeNull();
    expect(state2.concernCounter).toBe(2);
  });

  it('always succeeds when adding additional Concerns (lock retired AC-2.2)', () => {
    let state = initializeState('test');
    [, state] = addConcern(state, { label: 'A' }, { source: 'designer', rationale: 'test' });
    [state] = ratifyConcern(state, 'CERN-1', { source: 'designer', rationale: 'test' });
    const [id, newState, , err] = addConcern(state, { label: 'B' }, { source: 'designer', rationale: 'test' });
    expect(err).toBeNull();
    expect(id).toBe('CERN-2');
    expect(newState.concerns).toHaveLength(2);
    expect(newState.concernCounter).toBe(2);
  });
});

describe('generateId', () => {
  it('generates correct ID format for each type', () => {
    const prefixMap = {
      EVIDENCE: 'EVID-', RULE: 'RULE-', PERMISSION: 'PERM-',
      NECESSARY_CONDITION: 'NCON-', RISK: 'RISK-',
    };
    for (const [type, prefix] of Object.entries(prefixMap)) {
      const state = initializeState('test');
      const [id, newState] = generateId(state, type);
      expect(id).toBe(`${prefix}1`);
      expect(newState.elementCounters[type]).toBe(1);
    }
  });

  it('increments counter on successive calls', () => {
    let state = initializeState('test');
    const [id1, s1] = generateId(state, 'EVIDENCE');
    const [id2, s2] = generateId(s1, 'EVIDENCE');
    const [id3, s3] = generateId(s2, 'EVIDENCE');
    expect(id1).toBe('EVID-1');
    expect(id2).toBe('EVID-2');
    expect(id3).toBe('EVID-3');
    expect(s3.elementCounters.EVIDENCE).toBe(3);
  });

  it('does not mutate the original state', () => {
    const state = initializeState('test');
    const [, newState] = generateId(state, 'RISK');
    expect(state.elementCounters.RISK).toBe(0);
    expect(newState.elementCounters.RISK).toBe(1);
  });

  it('tracks counters independently per type', () => {
    let state = initializeState('test');
    const [id1, s1] = generateId(state, 'EVIDENCE');
    const [id2, s2] = generateId(s1, 'RULE');
    const [id3, s3] = generateId(s2, 'EVIDENCE');
    expect(id1).toBe('EVID-1');
    expect(id2).toBe('RULE-1');
    expect(id3).toBe('EVID-2');
  });
});

describe('applyOperations', () => {
  let state;

  beforeEach(() => {
    state = initializeState('Test problem');
  });

  describe('add operation', () => {
    it('adds an EVIDENCE element', () => {
      const result = applyOperations(state, [
        { op: 'add', type: 'EVIDENCE', statement: 'Pipeline has 1481 lines', source: 'codebase' },
      ], { source: 'designer', rationale: 'test' });
      expect(result.added).toHaveLength(1);
      expect(result.added[0]).toBe('EVID-1');
      expect(result.state.elements.get('EVID-1')).toBeDefined();
      expect(result.state.elements.get('EVID-1').statement).toBe('Pipeline has 1481 lines');
      expect(result.errors).toHaveLength(0);
    });

    it('adds a RULE element', () => {
      const result = applyOperations(state, [
        { op: 'add', type: 'RULE', statement: 'Must not favor any consumer', source: 'designer' },
      ], { source: 'designer', rationale: 'test' });
      expect(result.added[0]).toBe('RULE-1');
      expect(result.state.elements.get('RULE-1').source).toBe('designer');
    });

    it('adds a NECESSARY_CONDITION with grounding', () => {
      const r1 = applyOperations(state, [
        { op: 'add', type: 'EVIDENCE', statement: 'Text is native to one consumer', source: 'codebase' },
        { op: 'add', type: 'RULE', statement: 'Five consumers planned', source: 'designer' },
      ], { source: 'designer', rationale: 'test' });
      const r2 = applyOperations(r1.state, [
        {
          op: 'add', type: 'NECESSARY_CONDITION',
          statement: 'Canonical form must be consumer-neutral',
          grounding: ['EVID-1', 'RULE-1'],
          collapse_test: 'Four consumers pay translation tax',
          reasoning_chain: 'IF five consumers AND text native to one THEN cannot be text',
        },
      ], { source: 'designer', rationale: 'test' });
      expect(r2.added[0]).toBe('NCON-1');
      const nc = r2.state.elements.get('NCON-1');
      expect(nc.grounding).toEqual(['EVID-1', 'RULE-1']);
      expect(nc.collapse_test).toContain('translation tax');
    });

    it('rejects add with non-existent grounding reference', () => {
      const result = applyOperations(state, [
        {
          op: 'add', type: 'NECESSARY_CONDITION',
          statement: 'x',
          grounding: ['NONEXISTENT'],
          collapse_test: 'y',
          reasoning_chain: 'z',
        },
      ], { source: 'designer', rationale: 'test' });
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toMatch(/NONEXISTENT/);
      expect(result.added).toHaveLength(0);
    });

    it('increments round', () => {
      const result = applyOperations(state, [
        { op: 'add', type: 'EVIDENCE', statement: 'Fact', source: 'codebase' },
      ], { source: 'designer', rationale: 'test' });
      expect(result.state.round).toBe(1);
    });
  });

  describe('revise operation', () => {
    it('revises an active element', () => {
      const r1 = applyOperations(state, [
        { op: 'add', type: 'EVIDENCE', statement: 'Original', source: 'codebase' },
      ], { source: 'designer', rationale: 'test' });
      const r2 = applyOperations(r1.state, [
        { op: 'revise', target: 'EVID-1', statement: 'Updated statement' },
      ], { source: 'designer', rationale: 'test' });
      expect(r2.revised).toHaveLength(1);
      expect(r2.revised[0]).toBe('EVID-1');
      const el = r2.state.elements.get('EVID-1');
      expect(el.statement).toBe('Updated statement');
      expect(el.revision).toBe(1);
      expect(el.revisedInRound).toBe(2);
    });

    it('revises NC grounding and collapse_test', () => {
      const r1 = applyOperations(state, [
        { op: 'add', type: 'EVIDENCE', statement: 'fact', source: 'codebase' },
        { op: 'add', type: 'RULE', statement: 'rule', source: 'designer' },
      ], { source: 'designer', rationale: 'test' });
      const r2 = applyOperations(r1.state, [
        {
          op: 'add', type: 'NECESSARY_CONDITION',
          statement: 'original',
          grounding: ['EVID-1'],
          collapse_test: 'old test',
          reasoning_chain: 'IF a THEN b',
        },
      ], { source: 'designer', rationale: 'test' });
      const r3 = applyOperations(r2.state, [
        {
          op: 'revise', target: 'NCON-1',
          grounding: ['EVID-1', 'RULE-1'],
          collapse_test: 'new test',
          rejected_alternatives: ['alt-a'],
        },
      ], { source: 'designer', rationale: 'test' });
      const nc = r3.state.elements.get('NCON-1');
      expect(nc.grounding).toEqual(['EVID-1', 'RULE-1']);
      expect(nc.collapse_test).toBe('new test');
      expect(nc.rejected_alternatives).toEqual(['alt-a']);
    });

    it('rejects revising a withdrawn element', () => {
      const r1 = applyOperations(state, [
        { op: 'add', type: 'EVIDENCE', statement: 'To be removed', source: 'codebase' },
      ], { source: 'designer', rationale: 'test' });
      const r2 = applyOperations(r1.state, [
        { op: 'withdraw', target: 'EVID-1' },
      ], { source: 'designer', rationale: 'test' });
      const r3 = applyOperations(r2.state, [
        { op: 'revise', target: 'EVID-1', statement: 'New' },
      ], { source: 'designer', rationale: 'test' });
      expect(r3.errors.length).toBeGreaterThan(0);
      expect(r3.revised).toHaveLength(0);
    });

    it('logs revision to revisionLog', () => {
      const r1 = applyOperations(state, [
        { op: 'add', type: 'EVIDENCE', statement: 'Original', source: 'codebase' },
      ], { source: 'designer', rationale: 'test' });
      const r2 = applyOperations(r1.state, [
        { op: 'revise', target: 'EVID-1', statement: 'Changed' },
      ], { source: 'designer', rationale: 'test' });
      expect(r2.state.revisionLog.length).toBeGreaterThan(0);
      expect(r2.state.revisionLog[0].target).toBe('EVID-1');
    });
  });

  describe('withdraw operation', () => {
    it('withdraws an active element', () => {
      const r1 = applyOperations(state, [
        { op: 'add', type: 'RISK', statement: 'Might fail' },
      ], { source: 'designer', rationale: 'test' });
      const r2 = applyOperations(r1.state, [
        { op: 'withdraw', target: 'RISK-1' },
      ], { source: 'designer', rationale: 'test' });
      expect(r2.withdrawn).toHaveLength(1);
      expect(r2.withdrawn[0]).toBe('RISK-1');
      expect(r2.state.elements.get('RISK-1').status).toBe('withdrawn');
    });

    it('rejects withdrawing a non-existent element', () => {
      const r1 = applyOperations(state, [
        { op: 'withdraw', target: 'NONEXISTENT' },
      ], { source: 'designer', rationale: 'test' });
      expect(r1.errors.length).toBeGreaterThan(0);
    });
  });

  describe('batch processing', () => {
    it('add with grounding referencing element added in same batch', () => {
      const r1 = applyOperations(state, [
        { op: 'add', type: 'EVIDENCE', statement: 'Fact A', source: 'codebase' },
        { op: 'add', type: 'RULE', statement: 'Must respect A', source: 'designer' },
      ], { source: 'designer', rationale: 'test' });
      expect(r1.added).toEqual(['EVID-1', 'RULE-1']);
      expect(r1.errors).toHaveLength(0);
    });

    it('NC can reference elements added earlier in same batch', () => {
      const r1 = applyOperations(state, [
        { op: 'add', type: 'EVIDENCE', statement: 'fact', source: 'codebase' },
        {
          op: 'add', type: 'NECESSARY_CONDITION',
          statement: 'condition',
          grounding: ['EVID-1'],
          collapse_test: 'breaks',
          reasoning_chain: 'IF fact THEN condition',
        },
      ], { source: 'designer', rationale: 'test' });
      expect(r1.added).toEqual(['EVID-1', 'NCON-1']);
      expect(r1.errors).toHaveLength(0);
    });
  });

  describe('no resolve operation', () => {
    it('rejects resolve as unknown operation', () => {
      const r1 = applyOperations(state, [
        { op: 'resolve', target: 'X', resolved_by: 'Y' },
      ], { source: 'designer', rationale: 'test' });
      expect(r1.errors).toContainEqual(expect.stringContaining('Unknown operation'));
    });
  });

  describe('immutability', () => {
    it('does not mutate the input state', () => {
      const original = initializeState('test');
      const originalRound = original.round;
      const originalSize = original.elements.size;
      applyOperations(original, [
        { op: 'add', type: 'EVIDENCE', statement: 'New fact', source: 'codebase' },
      ], { source: 'designer', rationale: 'test' });
      expect(original.round).toBe(originalRound);
      expect(original.elements.size).toBe(originalSize);
    });
  });

  describe('result metadata', () => {
    it('returns completeness, integrityWarnings, closure fields', () => {
      const result = applyOperations(state, [
        { op: 'add', type: 'EVIDENCE', statement: 'Fact', source: 'codebase' },
      ], { source: 'designer', rationale: 'test' });
      expect(result.completeness).toBeDefined();
      expect(result.integrityWarnings).toBeDefined();
      expect(Array.isArray(result.integrityWarnings)).toBe(true);
      expect(result.closure).toBeDefined();
      expect(typeof result.closure.permitted).toBe('boolean');
      expect(result.bodyAdvancement).toBeDefined();
      expect(typeof result.bodyAdvancement.advanced).toBe('boolean');
      expect(typeof result.bodyAdvancement.addCount).toBe('number');
      expect(typeof result.bodyAdvancement.reviseCount).toBe('number');
      expect(typeof result.bodyAdvancement.withdrawCount).toBe('number');
      expect(result).not.toHaveProperty('challengeTrigger');
      expect(result).not.toHaveProperty('stallDetected');
    });

  });
});

describe('applyOperations — RESOLVE_CONDITION add anchor validation', () => {
  it('accepts RESOLVE_CONDITION add when problem_anchor matches a Concern', () => {
    let state = initializeState('test');
    [, state] = addConcern(state, { label: 'C1' }, { source: 'designer', rationale: 'test' });
    const result = applyOperations(state, [
      { op: 'add', type: 'RESOLVE_CONDITION', statement: 'X', problem_anchor: 'CERN-1' },
    ], { source: 'designer', rationale: 'test' });
    expect(result.errors).toEqual([]);
    expect(result.added).toEqual(['RCON-1']);
  });

  it('rejects RESOLVE_CONDITION add when problem_anchor does not match any Concern', () => {
    const state = initializeState('test');
    const result = applyOperations(state, [
      { op: 'add', type: 'RESOLVE_CONDITION', statement: 'X', problem_anchor: 'CERN-99' },
    ], { source: 'designer', rationale: 'test' });
    expect(result.errors.some(e => /CERN-99/.test(e) && /Concern/i.test(e))).toBe(true);
    expect(result.added).toEqual([]);
  });
});

describe('saveState / loadState', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'state-test-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('round-trips state through save and load', () => {
    let state = initializeState('Round-trip test');
    const r1 = applyOperations(state, [
      { op: 'add', type: 'EVIDENCE', statement: 'Fact', source: 'codebase' },
      { op: 'add', type: 'RULE', statement: 'Rule', source: 'designer' },
    ], { source: 'designer', rationale: 'test' });

    const filePath = join(tmpDir, 'state.json');
    saveState(r1.state, filePath);
    const loaded = loadState(filePath);

    expect(loaded.round).toBe(r1.state.round);
    expect(loaded.problemStatement).toBe('Round-trip test');
    expect(loaded.elements).toBeInstanceOf(Map);
    expect(loaded.elements.size).toBe(2);
    expect(loaded.elements.get('EVID-1').statement).toBe('Fact');
    expect(loaded.elementCounters.EVIDENCE).toBe(1);
    expect(loaded.elementCounters.RULE).toBe(1);
  });

  it('preserves generateId counters after load', () => {
    let state = initializeState('Counter test');
    const [, s1] = generateId(state, 'EVIDENCE');
    const [, s2] = generateId(s1, 'EVIDENCE');

    const filePath = join(tmpDir, 'state.json');
    saveState(s2, filePath);
    const loaded = loadState(filePath);

    const [id,] = generateId(loaded, 'EVIDENCE');
    expect(id).toBe('EVID-3');
  });

  it('writes valid JSON to disk', () => {
    const state = initializeState('JSON test');
    const filePath = join(tmpDir, 'state.json');
    saveState(state, filePath);
    const raw = readFileSync(filePath, 'utf-8');
    expect(() => JSON.parse(raw)).not.toThrow();
  });
});

describe('applyOperations — revise on RESOLVE_CONDITION clears ratification', () => {
  function buildRatifiedRC() {
    let state = initializeState('test');
    [, state] = addConcern(state, { label: 'C1' }, { source: 'designer', rationale: 'test' });
    [, state] = addConcern(state, { label: 'C2' }, { source: 'designer', rationale: 'test' });
    const result = applyOperations(state, [
      { op: 'add', type: 'RESOLVE_CONDITION', statement: 'original', problem_anchor: 'CERN-1' },
    ], { source: 'designer', rationale: 'test' });
    state = result.state;
    [state] = ratifyResolveCondition(state, { elementId: 'RCON-1', ratificationText: 'PM approves' }, { source: 'designer', rationale: 'test' });
    return state;
  }

  it('clears ratification and logs when statement is revised', () => {
    const state = buildRatifiedRC();
    const result = applyOperations(state, [
      { op: 'revise', target: 'RCON-1', statement: 'updated' },
    ], { source: 'designer', rationale: 'test' });
    const rc = result.state.elements.get('RCON-1');
    expect(rc.statement).toBe('updated');
    expect(rc.ratification).toBeNull();
    const lastLog = result.state.ratificationLog[result.state.ratificationLog.length - 1];
    expect(lastLog).toMatchObject({ event: 'cleared-on-revise', target: 'RCON-1' });
    expect(lastLog.fields).toContain('statement');
  });

  it('clears ratification and logs when problem_anchor is revised', () => {
    const state = buildRatifiedRC();
    const result = applyOperations(state, [
      { op: 'revise', target: 'RCON-1', problem_anchor: 'CERN-2' },
    ], { source: 'designer', rationale: 'test' });
    const rc = result.state.elements.get('RCON-1');
    expect(rc.problem_anchor).toBe('CERN-2');
    expect(rc.ratification).toBeNull();
    const lastLog = result.state.ratificationLog[result.state.ratificationLog.length - 1];
    expect(lastLog).toMatchObject({ event: 'cleared-on-revise', target: 'RCON-1' });
    expect(lastLog.fields).toContain('problem_anchor');
  });

  it('preserves ratification when revise touches no semantic field', () => {
    const state = buildRatifiedRC();
    const ratificationLogLength = state.ratificationLog.length;
    const result = applyOperations(state, [
      { op: 'revise', target: 'RCON-1', grounding: [] },
    ], { source: 'designer', rationale: 'test' });
    const rc = result.state.elements.get('RCON-1');
    expect(rc.ratification).toEqual({ ratifiedAtRound: 1, text: 'PM approves' });
    expect(result.state.ratificationLog).toHaveLength(ratificationLogLength);
  });
});

// Build a state ready for confirm_closure_go where every NC and RC is already
// ratified, no draft Concerns/Definitions remain, presentation/go round
// aligned with current round.
function buildClosableState() {
  const s = initializeState('p');
  s.round = 5;
  s.concerns = [{ id: 'CERN-1', label: 'C', description: null, status: 'ratified' }];
  s.concernCounter = 1;
  s.proofStatus = 'planning';
  s.closingArgPresentedRound = 5;

  const evid = createElement(
    { type: 'EVIDENCE', statement: 'fact', source: 'codebase' },
    'EVID-1', 5,
  );
  s.elements.set('EVID-1', evid);
  s.elementCounters.EVIDENCE = 1;

  const nc = createElement(
    {
      type: 'NECESSARY_CONDITION',
      statement: 'NC1',
      collapse_test: 'a',
      grounding: ['EVID-1'],
      reasoning_chain: 'IF fact THEN NC1',
    },
    'NCON-1', 5,
  );
  nc.ratificationStatus = 'ratified';
  s.elements.set('NCON-1', nc);
  s.elementCounters.NECESSARY_CONDITION = 1;

  const rc = createElement(
    {
      type: 'RESOLVE_CONDITION',
      statement: 'RC1',
      problem_anchor: 'CERN-1',
      grounding: ['NCON-1'],
    },
    'RCON-1', 5,
  );
  rc.ratification = { ratifiedAtRound: 5, text: 'pre-ratified' };
  s.elements.set('RCON-1', rc);
  s.elementCounters.RESOLVE_CONDITION = 1;
  return s;
}

const goConsent = { source: 'designer', rationale: 'test' };

describe('AC-2.4: recordDesignerGo closure does not bulk-ratify', () => {
  it('appends exactly one close log entry, no bulk-ratify entries', () => {
    const s = buildClosableState();
    const beforeLogLen = s.operationLog.length;
    const [after, err] = recordDesignerGo(s, goConsent);
    expect(err).toBeNull();
    expect(after.proofStatus).toBe('finish');
    const newEntries = after.operationLog.slice(beforeLogLen);
    expect(newEntries.length).toBe(1);
    expect(newEntries[0].op).toBe('close');
    expect(newEntries[0].provenance).toEqual({ from: 'planning', to: 'finish' });
    // No bulk-ratify entry written
    expect(newEntries.find(e => e.op === 'bulk-ratify')).toBeUndefined();
  });

  it('preserves closingArgPresentedRound and sets closingArgGoRound', () => {
    const s = buildClosableState();
    const [after, err] = recordDesignerGo(s, goConsent);
    expect(err).toBeNull();
    expect(after.closingArgPresentedRound).toBe(5);
    expect(after.closingArgGoRound).toBe(5);
  });
});

describe('AC-7.1: post-finish mutations refused', () => {
  function finishedState() {
    const s = buildClosableState();
    const [after, err] = recordDesignerGo(s, goConsent);
    expect(err).toBeNull();
    expect(after.proofStatus).toBe('finish');
    return after;
  }

  const PROOF_FINISHED = /^PROOF_FINISHED:/;

  it('recordDesignerGo refuses', () => {
    const s = finishedState();
    const [, err] = recordDesignerGo(s, goConsent);
    expect(err).toMatch(PROOF_FINISHED);
  });

  it('addConcern refuses', () => {
    const s = finishedState();
    const [id, , , err] = addConcern(s, { label: 'X' }, goConsent);
    expect(id).toBeNull();
    expect(err).toMatch(PROOF_FINISHED);
  });

  it('ratifyConcern refuses', () => {
    const s = finishedState();
    const [, err] = ratifyConcern(s, 'CERN-1', goConsent);
    expect(err).toMatch(PROOF_FINISHED);
  });

  it('ratifyResolveCondition refuses', () => {
    const s = finishedState();
    const [, hints, err] = ratifyResolveCondition(s, { elementId: 'RCON-1', ratificationText: 'x' }, goConsent);
    expect(hints).toEqual([]);
    expect(err).toMatch(PROOF_FINISHED);
  });

  it('applyOperations refuses', () => {
    const s = finishedState();
    const result = applyOperations(s, [
      { op: 'add', type: 'EVIDENCE', statement: 'late', source: 'codebase' },
    ], goConsent);
    expect(result.errors.some(e => PROOF_FINISHED.test(e))).toBe(true);
    expect(result.added).toEqual([]);
    expect(result.revised).toEqual([]);
    expect(result.withdrawn).toEqual([]);
  });

  it('manageFriction refuses', () => {
    const s = finishedState();
    const [id, , hints, err] = manageFriction(s, {
      op: 'add', friction_shape: 'permission-risk-linkage',
      anchor_a: 'EVID-1', anchor_b: 'NCON-1', disposition: 'lived-with',
    }, goConsent);
    expect(id).toBeNull();
    expect(hints).toEqual([]);
    expect(err).toMatch(PROOF_FINISHED);
  });

  it('overrideFrictionDisposition refuses', () => {
    const s = finishedState();
    const [, hints, err] = overrideFrictionDisposition(s, { elementId: 'EVID-1', disposition: 'lived-with' }, goConsent);
    expect(hints).toEqual([]);
    expect(err).toMatch(PROOF_FINISHED);
  });

  it('manageDefinitions refuses (mutating ops)', () => {
    const s = finishedState();
    const [first, , err] = manageDefinitions(s, 'add', { canonical_name: 'X', definition: 'd', sense_constraints: 's' }, goConsent);
    expect(first).toBeNull();
    expect(err).toMatch(PROOF_FINISHED);
  });

  it('withdrawElement refuses', () => {
    const s = finishedState();
    const [, err] = withdrawElement(s, 'EVID-1', 'unclassified', goConsent);
    expect(err).toMatch(PROOF_FINISHED);
  });

  it('withdrawConcern refuses', () => {
    const s = finishedState();
    const [, err] = withdrawConcern(s, 'CERN-1', 'unclassified', goConsent);
    expect(err).toMatch(PROOF_FINISHED);
  });

  it('withdrawDefinition refuses', () => {
    const s = finishedState();
    // Add a definition before finish so we have something to attempt withdrawing.
    // (Build alt state with a definition then finish.)
    const base = buildClosableState();
    base.definitions = [{
      id: 'DEFN-1',
      canonical_name: 'thing',
      aliases: [], definition: 'd', sense_constraints: 's',
      status: 'ratified', source: 'designer', revision: 0, history: [],
    }];
    base.definitionCounter = 1;
    const [finished, err1] = recordDesignerGo(base, goConsent);
    expect(err1).toBeNull();
    const [, err] = withdrawDefinition(finished, 'DEFN-1', 'unclassified', goConsent);
    expect(err).toMatch(PROOF_FINISHED);
    // (use s param to avoid unused-var lint)
    expect(s.proofStatus).toBe('finish');
  });

  it('recordClosingArgPresented refuses', () => {
    const s = finishedState();
    const [, err] = recordClosingArgPresented(s, goConsent);
    expect(err).toMatch(PROOF_FINISHED);
  });
});
