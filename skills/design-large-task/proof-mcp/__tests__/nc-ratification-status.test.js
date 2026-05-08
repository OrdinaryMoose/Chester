import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { createElement } from '../proof.js';
import { initializeState, applyOperations, loadState } from '../state.js';

const consent = { source: 'designer', rationale: 'test' };

describe('NC ratificationStatus — createElement', () => {
  it('createElement for NC sets ratificationStatus to "draft"', () => {
    const nc = createElement({
      type: 'NECESSARY_CONDITION',
      statement: 's',
      source: 'codebase',
      grounding: ['EVID-1'],
      collapse_test: 'ct',
      reasoning_chain: 'rc',
      rejected_alternatives: [],
    }, 'NCON-1', 0);
    expect(nc.ratificationStatus).toBe('draft');
  });

  it('createElement for non-NC element does not set ratificationStatus', () => {
    const ev = createElement({
      type: 'EVIDENCE',
      statement: 'fact',
      source: 'codebase',
    }, 'EVID-1', 0);
    expect(ev.ratificationStatus).toBeUndefined();
  });
});

describe('NC ratificationStatus — loadState backfill', () => {
  let dir;
  beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'proof-')); });
  afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

  it('backfills ratificationStatus="draft" on legacy NC entries', () => {
    const path = join(dir, 'state.json');
    const legacy = {
      round: 0, problemStatement: 'p',
      elements: {
        'EVID-1': {
          id: 'EVID-1', type: 'EVIDENCE', statement: 'fact', source: 'codebase',
          status: 'active', addedInRound: 0, revisedInRound: null, revision: 0,
        },
        'NCON-1': {
          id: 'NCON-1', type: 'NECESSARY_CONDITION', statement: 'must',
          source: 'designer', grounding: ['EVID-1'], collapse_test: 'ct',
          reasoning_chain: 'rc', rejected_alternatives: [],
          status: 'active', addedInRound: 0, revisedInRound: null, revision: 0,
        },
      },
      elementCounters: { EVIDENCE: 1, RULE: 0, PERMISSION: 0, NECESSARY_CONDITION: 1, RISK: 0, RESOLVE_CONDITION: 0, FRICTION: 0 },
      conditionCountHistory: [], elementCountHistory: [],
      challengeModesUsed: [], challengeLog: [], revisionLog: [],
      phaseTransitionRound: 0, concerns: [],
      concernCounter: 0, ratificationLog: [], frictionLog: [],
    };
    writeFileSync(path, JSON.stringify(legacy));
    const loaded = loadState(path);
    const nc = loaded.elements.get('NCON-1');
    expect(nc.ratificationStatus).toBe('draft');
    const ev = loaded.elements.get('EVID-1');
    expect(ev.ratificationStatus).toBeUndefined();
  });

  it('preserves ratificationStatus="ratified" when present in legacy NC', () => {
    const path = join(dir, 'state.json');
    const legacy = {
      round: 0, problemStatement: 'p',
      elements: {
        'EVID-1': {
          id: 'EVID-1', type: 'EVIDENCE', statement: 'fact', source: 'codebase',
          status: 'active', addedInRound: 0, revisedInRound: null, revision: 0,
        },
        'NCON-1': {
          id: 'NCON-1', type: 'NECESSARY_CONDITION', statement: 'must',
          source: 'designer', grounding: ['EVID-1'], collapse_test: 'ct',
          reasoning_chain: 'rc', rejected_alternatives: [],
          status: 'active', addedInRound: 0, revisedInRound: null, revision: 0,
          ratificationStatus: 'ratified',
        },
      },
      elementCounters: { EVIDENCE: 1, RULE: 0, PERMISSION: 0, NECESSARY_CONDITION: 1, RISK: 0, RESOLVE_CONDITION: 0, FRICTION: 0 },
      conditionCountHistory: [], elementCountHistory: [],
      challengeModesUsed: [], challengeLog: [], revisionLog: [],
      phaseTransitionRound: 0, concerns: [],
      concernCounter: 0, ratificationLog: [], frictionLog: [],
    };
    writeFileSync(path, JSON.stringify(legacy));
    const loaded = loadState(path);
    const nc = loaded.elements.get('NCON-1');
    expect(nc.ratificationStatus).toBe('ratified');
  });
});

describe('NC ratificationStatus — revise resets to draft', () => {
  function buildRatifiedNC() {
    let state = initializeState('test');
    const result = applyOperations(state, [
      { op: 'add', type: 'EVIDENCE', statement: 'fact', source: 'codebase' },
      {
        op: 'add', type: 'NECESSARY_CONDITION', statement: 'original',
        source: 'designer', grounding: ['EVID-1'],
        collapse_test: 'ct', reasoning_chain: 'rc', rejected_alternatives: [],
      },
    ], consent);
    state = result.state;
    // Manually mark as ratified to simulate post-bulk-ratify state.
    const nc = state.elements.get('NCON-1');
    nc.ratificationStatus = 'ratified';
    return state;
  }

  it('revising NC statement resets ratificationStatus to draft', () => {
    const state = buildRatifiedNC();
    const result = applyOperations(state, [
      { op: 'revise', target: 'NCON-1', statement: 'updated' },
    ], consent);
    const nc = result.state.elements.get('NCON-1');
    expect(nc.statement).toBe('updated');
    expect(nc.ratificationStatus).toBe('draft');
  });

  it('revising NC grounding resets ratificationStatus to draft', () => {
    let state = buildRatifiedNC();
    // Add another EVIDENCE so we can revise grounding.
    const result1 = applyOperations(state, [
      { op: 'add', type: 'EVIDENCE', statement: 'fact2', source: 'codebase' },
    ], consent);
    state = result1.state;
    // Re-mark ratified after that round (revise of unrelated element didn't touch NC,
    // but applyOperations rounds increment regardless — keep ratified).
    state.elements.get('NCON-1').ratificationStatus = 'ratified';
    const result = applyOperations(state, [
      { op: 'revise', target: 'NCON-1', grounding: ['EVID-1', 'EVID-2'] },
    ], consent);
    const nc = result.state.elements.get('NCON-1');
    expect(nc.grounding).toEqual(['EVID-1', 'EVID-2']);
    expect(nc.ratificationStatus).toBe('draft');
  });

  it('revising NC non-semantic fields preserves ratificationStatus', () => {
    const state = buildRatifiedNC();
    const result = applyOperations(state, [
      { op: 'revise', target: 'NCON-1', collapse_test: 'new ct' },
    ], consent);
    const nc = result.state.elements.get('NCON-1');
    expect(nc.collapse_test).toBe('new ct');
    expect(nc.ratificationStatus).toBe('ratified');
  });

  it('revising a non-NC element does not introduce a ratificationStatus field', () => {
    const state = buildRatifiedNC();
    const result = applyOperations(state, [
      { op: 'revise', target: 'EVID-1', statement: 'updated fact' },
    ], consent);
    const ev = result.state.elements.get('EVID-1');
    expect(ev.ratificationStatus).toBeUndefined();
  });
});
