/**
 * mid-review-revision.test.js — AC-4.3 invariant regression lock.
 *
 * After a successful present_closing_argument (and optionally a designer first-yes),
 * any subsequent mutating tool call MUST clear both closingArgPresentedRound and
 * closingArgGoRound on state. This test exercises every mutating function with both
 * flags pre-set to the current round (simulating a successful presentation+first-yes)
 * and asserts both clear post-mutation.
 *
 * Companion to two-yes-flags.test.js (per-flag semantics) and
 * eleventh-closure-condition.test.js (closure-side gate). This file's purpose is to
 * lock the rewiring done in Task 3 against future regression — especially the
 * deletions in Tasks 10-13.
 *
 * Important: consent.source must be 'designer' or 'agent-proposed-designer-confirmed'
 * (per CONSENT_SOURCES in proof.js). 'designer-question' is NOT valid.
 */
import { describe, it, expect } from 'vitest';
import {
  initializeState,
  applyOperations,
  addConcern,
  ratifyConcern,
  manageDefinitions,
  manageFriction,
  overrideFrictionDisposition,
  ratifyResolveCondition,
  withdrawElement,
  withdrawConcern,
  withdrawDefinition,
} from '../state.js';

const consent = { source: 'designer', rationale: 'mid-review-revision-test' };

/**
 * Pre-set both two-yes closing flags on a state to simulate the scenario this
 * AC governs: a successful present_closing_argument has fired (and optionally a
 * designer first-yes followed). Any mutating call that follows must clear both.
 */
function withFlagsSet(state) {
  state.closingArgPresentedRound = state.round;
  state.closingArgGoRound = state.round;
  return state;
}

function expectFlagsCleared(state) {
  expect(state.closingArgPresentedRound).toBeNull();
  expect(state.closingArgGoRound).toBeNull();
}

describe('mid-review revision flag reset (AC-4.3)', () => {
  it('applyOperations (submit_proof_update) resets both flags', () => {
    let s = initializeState('p');
    s.round = 5;
    withFlagsSet(s);
    const r = applyOperations(
      s,
      [{ op: 'add', type: 'EVIDENCE', statement: 'E', source: 'codebase' }],
      consent,
    );
    expect(r.errors).toEqual([]);
    expectFlagsCleared(r.state);
  });

  it('addConcern resets both flags', () => {
    let s = initializeState('p');
    s.round = 5;
    withFlagsSet(s);
    const [, after, , err] = addConcern(s, { label: 'C1' }, consent);
    expect(err).toBeNull();
    expectFlagsCleared(after);
  });

  it('ratifyConcern resets both flags', () => {
    let s = initializeState('p');
    const [, sa] = addConcern(s, { label: 'C1' }, consent);
    s = sa;
    s.round = 5;
    withFlagsSet(s);
    const [after, err] = ratifyConcern(s, 'CERN-1', consent);
    expect(err).toBeNull();
    expectFlagsCleared(after);
  });

  it('ratifyResolveCondition resets both flags', () => {
    let s = initializeState('p');
    const [, sa] = addConcern(s, { label: 'C1' }, consent);
    s = sa;
    let r = applyOperations(
      s,
      [
        { op: 'add', type: 'EVIDENCE', statement: 'E', source: 'codebase' },
        { op: 'add', type: 'NECESSARY_CONDITION', statement: 'NC', collapse_test: 'a', grounding: ['EVID-1'], reasoning_chain: 'IF E THEN NC' },
        { op: 'add', type: 'RESOLVE_CONDITION', statement: 'RC', problem_anchor: 'CERN-1', grounding: ['NCON-1'] },
      ],
      consent,
    );
    s = r.state;
    withFlagsSet(s);
    const [after, , err] = ratifyResolveCondition(
      s,
      { elementId: 'RCON-1', ratificationText: 'ok' },
      consent,
    );
    expect(err).toBeNull();
    expectFlagsCleared(after);
  });

  it('manageFriction (add) resets both flags', () => {
    let s = initializeState('p');
    let r = applyOperations(
      s,
      [
        { op: 'add', type: 'EVIDENCE', statement: 'E', source: 'codebase' },
        { op: 'add', type: 'NECESSARY_CONDITION', statement: 'NC1', collapse_test: 'a', grounding: ['EVID-1'], reasoning_chain: 'IF E THEN NC1' },
        { op: 'add', type: 'NECESSARY_CONDITION', statement: 'NC2', collapse_test: 'b', grounding: ['EVID-1'], reasoning_chain: 'IF E THEN NC2' },
      ],
      consent,
    );
    s = r.state;
    withFlagsSet(s);
    const [, after, , err] = manageFriction(
      s,
      {
        op: 'add',
        friction_shape: 'nc-nc-opposing-pull',
        anchor_a: 'NCON-1',
        anchor_b: 'NCON-2',
        disposition: 'lived-with',
        statement: 'tension',
      },
      consent,
    );
    expect(err).toBeNull();
    expectFlagsCleared(after);
  });

  it('overrideFrictionDisposition resets both flags', () => {
    let s = initializeState('p');
    let r = applyOperations(
      s,
      [
        { op: 'add', type: 'EVIDENCE', statement: 'E', source: 'codebase' },
        { op: 'add', type: 'NECESSARY_CONDITION', statement: 'NC1', collapse_test: 'a', grounding: ['EVID-1'], reasoning_chain: 'IF E THEN NC1' },
        { op: 'add', type: 'NECESSARY_CONDITION', statement: 'NC2', collapse_test: 'b', grounding: ['EVID-1'], reasoning_chain: 'IF E THEN NC2' },
      ],
      consent,
    );
    s = r.state;
    let mfErr;
    [, s, , mfErr] = manageFriction(
      s,
      {
        op: 'add',
        friction_shape: 'nc-nc-opposing-pull',
        anchor_a: 'NCON-1',
        anchor_b: 'NCON-2',
        disposition: 'lived-with',
        statement: 'tension',
      },
      consent,
    );
    expect(mfErr).toBeNull();
    withFlagsSet(s);
    const [after, , err] = overrideFrictionDisposition(
      s,
      { elementId: 'FRIC-1', disposition: 'relieved-by-exception' },
      consent,
    );
    expect(err).toBeNull();
    expectFlagsCleared(after);
  });

  it('manageDefinitions add resets both flags', () => {
    let s = initializeState('p');
    s.round = 5;
    withFlagsSet(s);
    const [, after, err] = manageDefinitions(
      s,
      'add',
      { canonical_name: 'X', definition: 'd' },
      consent,
    );
    expect(err).toBeNull();
    expectFlagsCleared(after);
  });

  it('manageDefinitions revise resets both flags', () => {
    let s = initializeState('p');
    let [id, sa] = manageDefinitions(
      s,
      'add',
      { canonical_name: 'X', definition: 'old' },
      consent,
    );
    s = sa;
    withFlagsSet(s);
    const [, after, err] = manageDefinitions(
      s,
      'revise',
      { id, definition: 'new' },
      consent,
    );
    expect(err).toBeNull();
    expectFlagsCleared(after);
  });

  it('manageDefinitions ratify resets both flags', () => {
    let s = initializeState('p');
    let [id, sa] = manageDefinitions(
      s,
      'add',
      { canonical_name: 'X', definition: 'd' },
      consent,
    );
    s = sa;
    withFlagsSet(s);
    const [, after, err] = manageDefinitions(s, 'ratify', { id }, consent);
    expect(err).toBeNull();
    expectFlagsCleared(after);
  });

  it('withdrawElement resets both flags', () => {
    let s = initializeState('p');
    let r = applyOperations(
      s,
      [
        { op: 'add', type: 'EVIDENCE', statement: 'E', source: 'codebase' },
        { op: 'add', type: 'NECESSARY_CONDITION', statement: 'NC', collapse_test: 'a', grounding: ['EVID-1'], reasoning_chain: 'IF E THEN NC' },
      ],
      consent,
    );
    s = r.state;
    withFlagsSet(s);
    const [after, err] = withdrawElement(s, 'NCON-1', 'superseded', consent);
    expect(err).toBeNull();
    expectFlagsCleared(after);
  });

  it('withdrawConcern resets both flags', () => {
    let s = initializeState('p');
    const [, sa] = addConcern(s, { label: 'C1' }, consent);
    s = sa;
    withFlagsSet(s);
    const [after, err] = withdrawConcern(s, 'CERN-1', 'scope-removed', consent);
    expect(err).toBeNull();
    expectFlagsCleared(after);
  });

  it('withdrawDefinition resets both flags', () => {
    let s = initializeState('p');
    let [id, sa] = manageDefinitions(
      s,
      'add',
      { canonical_name: 'X', definition: 'd' },
      consent,
    );
    s = sa;
    withFlagsSet(s);
    const [after, err] = withdrawDefinition(s, id, 'consolidated', consent);
    expect(err).toBeNull();
    expectFlagsCleared(after);
  });
});
