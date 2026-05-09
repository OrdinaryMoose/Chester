import { describe, it, expect } from 'vitest';
import {
  initializeState,
  applyOperations,
  ratifyNecessaryCondition,
} from '../state.js';

const validConsent = { source: 'designer', rationale: 'test ratify' };

function seedStateWithNC(extraSeed = {}) {
  let state = initializeState();
  state.problemStatement = 'test problem';
  // open_proof seed equivalent: add Evidence + Rule + NC via applyOperations
  const seedOps = [
    { op: 'add', type: 'EVIDENCE', statement: 'test evidence', source: 'codebase' },
    { op: 'add', type: 'RULE', statement: 'test rule', source: 'designer' },
    { op: 'add', type: 'NECESSARY_CONDITION',
      statement: 'test NC',
      grounding: ['EVID-1'],
      reasoning_chain: 'IF X THEN Y',
      collapse_test: 'fails if removed',
    },
  ];
  const result = applyOperations(state, seedOps, validConsent);
  state = result.state;
  return state;
}

describe('ratifyNecessaryCondition', () => {
  it('flips active NC ratificationStatus from draft to ratified on happy path', () => {
    const state = seedStateWithNC();
    const [newState, err] = ratifyNecessaryCondition(
      state,
      { elementId: 'NCON-1', ratificationText: 'designer accept' },
      validConsent,
    );
    expect(err).toBeNull();
    expect(newState.elements.get('NCON-1').ratificationStatus).toBe('ratified');
    expect(state.elements.get('NCON-1').ratificationStatus).toBe('draft'); // input unchanged
  });

  it('appends ratificationLog entry with target/round/text', () => {
    const state = seedStateWithNC();
    const [newState] = ratifyNecessaryCondition(
      state,
      { elementId: 'NCON-1', ratificationText: 'sign-off' },
      validConsent,
    );
    const lastLog = newState.ratificationLog[newState.ratificationLog.length - 1];
    expect(lastLog).toMatchObject({
      event: 'ratified',
      target: 'NCON-1',
      round: state.round,
      ratificationText: 'sign-off',
    });
  });

  it('appends operationLog entry with op:ratify, type, changedFields, provenance', () => {
    const state = seedStateWithNC();
    const [newState] = ratifyNecessaryCondition(
      state,
      { elementId: 'NCON-1', ratificationText: 'sign-off' },
      validConsent,
    );
    const lastOp = newState.operationLog[newState.operationLog.length - 1];
    expect(lastOp).toMatchObject({
      op: 'ratify',
      entityId: 'NCON-1',
      type: 'NECESSARY_CONDITION',
      changedFields: ['ratificationStatus'],
      provenance: { ratificationText: 'sign-off' },
    });
  });

  it('rejects invalid consent token', () => {
    const state = seedStateWithNC();
    const [, err] = ratifyNecessaryCondition(
      state,
      { elementId: 'NCON-1', ratificationText: 'x' },
      {}, // missing source
    );
    expect(err).toMatch(/INVALID_CONSENT/);
  });

  it('refuses when proofStatus is finish', () => {
    let state = seedStateWithNC();
    state.proofStatus = 'finish';
    const [, err] = ratifyNecessaryCondition(
      state,
      { elementId: 'NCON-1', ratificationText: 'x' },
      validConsent,
    );
    expect(err).toMatch(/PROOF_FINISHED/);
  });

  it('refuses when element not found', () => {
    const state = seedStateWithNC();
    const [, err] = ratifyNecessaryCondition(
      state,
      { elementId: 'NCON-99', ratificationText: 'x' },
      validConsent,
    );
    expect(err).toMatch(/not found/i);
  });

  it('refuses when element is not a NECESSARY_CONDITION (e.g. EVIDENCE)', () => {
    const state = seedStateWithNC();
    const [, err] = ratifyNecessaryCondition(
      state,
      { elementId: 'EVID-1', ratificationText: 'x' },
      validConsent,
    );
    expect(err).toMatch(/not a NECESSARY_CONDITION/i);
  });

  it('refuses ALREADY_RATIFIED on repeat call', () => {
    const state = seedStateWithNC();
    const [first] = ratifyNecessaryCondition(
      state,
      { elementId: 'NCON-1', ratificationText: 'first' },
      validConsent,
    );
    const [, err] = ratifyNecessaryCondition(
      first,
      { elementId: 'NCON-1', ratificationText: 'second' },
      validConsent,
    );
    expect(err).toMatch(/ALREADY_RATIFIED/);
  });

  it('refuses when NC status is withdrawn', () => {
    let state = seedStateWithNC();
    // Withdraw the NC by direct state mutation (test scaffold; production withdraws via withdraw tool)
    state.elements.get('NCON-1').status = 'withdrawn';
    const [, err] = ratifyNecessaryCondition(
      state,
      { elementId: 'NCON-1', ratificationText: 'x' },
      validConsent,
    );
    expect(err).toMatch(/not active/i);
  });

  it('refuses when ratificationText is empty', () => {
    const state = seedStateWithNC();
    const [, err] = ratifyNecessaryCondition(
      state,
      { elementId: 'NCON-1', ratificationText: '' },
      validConsent,
    );
    expect(err).toMatch(/required/i);
  });

  it('clears closingArgPresentedRound and closingArgGoRound on success', () => {
    let state = seedStateWithNC();
    state.closingArgPresentedRound = state.round;
    state.closingArgGoRound = state.round;
    const [newState] = ratifyNecessaryCondition(
      state,
      { elementId: 'NCON-1', ratificationText: 'x' },
      validConsent,
    );
    expect(newState.closingArgPresentedRound).toBeNull();
    expect(newState.closingArgGoRound).toBeNull();
  });
});
