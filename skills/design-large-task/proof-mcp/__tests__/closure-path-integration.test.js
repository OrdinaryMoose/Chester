import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  initializeState,
  applyOperations,
  saveState,
  loadState,
  addConcern,
  ratifyConcern,
  ratifyResolveCondition,
  ratifyNecessaryCondition,
  manageDefinitions,
} from '../state.js';
import {
  handlePresentClosingArgument,
  handleConfirmClosureGo,
} from '../server.js';

const validConsent = { source: 'designer', rationale: 'integration test' };

describe('closure path integration', () => {
  let dir, statePath;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'closure-path-'));
    statePath = join(dir, 'state.json');
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  function buildFullState() {
    let state = initializeState();
    state.problemStatement = 'integration test problem';
    // Seed: 1 Evidence, 1 Rule, 2 NCs.
    const ops = [
      { op: 'add', type: 'EVIDENCE', statement: 'codebase fact', source: 'codebase' },
      { op: 'add', type: 'RULE', statement: 'designer rule', source: 'designer' },
      { op: 'add', type: 'NECESSARY_CONDITION',
        statement: 'NC1', grounding: ['EVID-1'], reasoning_chain: 'IF X THEN Y',
        collapse_test: 'breaks if removed' },
      { op: 'add', type: 'NECESSARY_CONDITION',
        statement: 'NC2', grounding: ['RULE-1'], reasoning_chain: 'IF P THEN Q',
        collapse_test: 'breaks if removed', rejected_alternatives: ['considered Z'] },
    ];
    let opResult = applyOperations(state, ops, validConsent);
    state = opResult.state;

    // Add Concern — addConcern returns [id, newState, hints, error].
    let cernId, hints, err;
    [cernId, state, hints, err] = addConcern(state, { label: 'C1', description: 'concern 1' }, validConsent);

    // Add RC anchored to the new Concern.
    opResult = applyOperations(state, [
      { op: 'add', type: 'RESOLVE_CONDITION', statement: 'RC1', problem_anchor: cernId },
    ], validConsent);
    state = opResult.state;

    // Add Definition — manageDefinitions(state, op:string, payload, consent), returns [id, newState, error].
    let defId;
    [defId, state] = manageDefinitions(state, 'add', { canonical_name: 'TestTerm', definition: 'def text' }, validConsent);

    // Advance round to >= 3 for closure-readiness.
    state.round = 3;
    return { state, cernId, defId };
  }

  it('full closure path succeeds when every element is ratified', () => {
    let { state, cernId, defId } = buildFullState();

    // Ratify all NCs (2-tuple return).
    [state] = ratifyNecessaryCondition(state, { elementId: 'NCON-1', ratificationText: 'ok1' }, validConsent);
    [state] = ratifyNecessaryCondition(state, { elementId: 'NCON-2', ratificationText: 'ok2' }, validConsent);

    // Ratify RC (3-tuple return — first element is newState).
    [state] = ratifyResolveCondition(state, { elementId: 'RCON-1', ratificationText: 'rcon-ok' }, validConsent);

    // Ratify Concern (2-tuple return).
    [state] = ratifyConcern(state, cernId, validConsent);

    // Ratify Definition — manageDefinitions(state, 'ratify', { id }, consent) returns [null, newState, error].
    let defErr;
    [, state, defErr] = manageDefinitions(state, 'ratify', { id: defId }, validConsent);
    expect(defErr).toBeNull();

    saveState(state, statePath);

    // Present
    const present = handlePresentClosingArgument({ state_file: statePath, consent: validConsent });
    expect(present.isError).toBeFalsy();

    // Confirm go
    const go = handleConfirmClosureGo({ state_file: statePath, consent: validConsent });
    expect(go.isError).toBeFalsy();
    const finalState = loadState(statePath);
    expect(finalState.proofStatus).toBe('finish');
  });

  it('present_closing_argument refuses with FIRST_YES_GATE_FAILED when NCs are draft', () => {
    let { state, cernId, defId } = buildFullState();

    // Ratify everything except NCs.
    [state] = ratifyResolveCondition(state, { elementId: 'RCON-1', ratificationText: 'rcon-ok' }, validConsent);
    [state] = ratifyConcern(state, cernId, validConsent);
    [, state] = manageDefinitions(state, 'ratify', { id: defId }, validConsent);
    saveState(state, statePath);

    const result = handlePresentClosingArgument({ state_file: statePath, consent: validConsent });
    expect(result.isError).toBe(true);
    const payload = JSON.parse(result.content[0].text);
    expect(payload.code).toBe('FIRST_YES_GATE_FAILED');
    expect(payload.unratified_ids).toEqual(expect.arrayContaining(['NCON-1', 'NCON-2']));
  });

  it('mid-revision cycle resets ratificationStatus to draft and forces re-ratify', () => {
    let { state } = buildFullState();
    [state] = ratifyNecessaryCondition(state, { elementId: 'NCON-1', ratificationText: 'first' }, validConsent);
    expect(state.elements.get('NCON-1').ratificationStatus).toBe('ratified');

    // Revise the NC's statement → resets to draft (state.js:531 logic).
    const reviseResult = applyOperations(state, [
      { op: 'revise', target: 'NCON-1', statement: 'NC1 revised text' },
    ], validConsent);
    state = reviseResult.state;
    expect(state.elements.get('NCON-1').ratificationStatus).toBe('draft');

    // Re-ratify should succeed.
    const [newState, err] = ratifyNecessaryCondition(
      state,
      { elementId: 'NCON-1', ratificationText: 'second' },
      validConsent,
    );
    expect(err).toBeNull();
    expect(newState.elements.get('NCON-1').ratificationStatus).toBe('ratified');
  });

  it('closing-argument refuses when one NC is draft and the other is ratified (partition correctness)', () => {
    let { state, cernId, defId } = buildFullState();
    // Only ratify NCON-1, leave NCON-2 draft to test partition split.
    [state] = ratifyNecessaryCondition(state, { elementId: 'NCON-1', ratificationText: 'ok' }, validConsent);
    [state] = ratifyResolveCondition(state, { elementId: 'RCON-1', ratificationText: 'rcon-ok' }, validConsent);
    [state] = ratifyConcern(state, cernId, validConsent);
    [, state] = manageDefinitions(state, 'ratify', { id: defId }, validConsent);
    saveState(state, statePath);

    // Present should fail because NCON-2 is still draft — gate refuses with NCON-2 in unratified_ids; NCON-1 is excluded since it ratified.
    const present = handlePresentClosingArgument({ state_file: statePath, consent: validConsent });
    expect(present.isError).toBe(true);
    const payload = JSON.parse(present.content[0].text);
    expect(payload.unratified_ids).toContain('NCON-2');
    expect(payload.unratified_ids).not.toContain('NCON-1');
  });
});
