import { describe, it, expect } from 'vitest';
import { validateConsentToken } from '../proof.js';
import {
  initializeState, addConcern, applyOperations,
  manageFriction, overrideFrictionDisposition, ratifyResolveCondition,
  recordClosingArgPresented, recordDesignerGo,
} from '../state.js';

const valid = { source: 'designer', rationale: 'test' };
const validNoRationale = { source: 'agent-proposed-designer-confirmed' };

describe('validateConsentToken', () => {
  it('accepts shape with source designer and rationale', () => {
    expect(validateConsentToken(valid)).toEqual({ valid: true });
  });
  it('accepts shape with source agent-proposed-designer-confirmed without rationale', () => {
    expect(validateConsentToken(validNoRationale)).toEqual({ valid: true });
  });
  it('rejects missing token', () => {
    expect(validateConsentToken(undefined).valid).toBe(false);
    expect(validateConsentToken(null).valid).toBe(false);
  });
  it('rejects empty object', () => {
    expect(validateConsentToken({}).valid).toBe(false);
  });
  it('rejects unknown source', () => {
    expect(validateConsentToken({ source: 'unknown' }).valid).toBe(false);
  });
  it('rejects non-string rationale', () => {
    expect(validateConsentToken({ source: 'designer', rationale: 42 }).valid).toBe(false);
  });
});

describe('addConcern with consent', () => {
  it('rejects without consent and leaves state unchanged', () => {
    const s = initializeState('test problem');
    const [id, newState, hints, error] = addConcern(s, { label: 'C-1', description: 'd' }, undefined);
    expect(error).toMatch(/INVALID_CONSENT/);
    expect(id).toBeNull();
    expect(newState).toEqual(s);
    expect(hints).toEqual([]);
  });
  it('accepts with valid consent', () => {
    const s = initializeState('test problem');
    const [id, newState, hints, error] = addConcern(s, { label: 'C-1', description: 'd' }, valid);
    expect(error).toBeNull();
    expect(id).toBe('CERN-1');
    expect(newState.concerns).toHaveLength(1);
    expect(hints).toEqual([]);
  });
});

describe('applyOperations with consent', () => {
  it('rejects without consent — no round increment, no flag clear', () => {
    const s = { ...initializeState('test'), closingArgPresentedRound: 5, closingArgGoRound: 5, round: 5 };
    const result = applyOperations(s, [
      { op: 'add', type: 'EVIDENCE', statement: 'fact', source: 'codebase' },
    ], undefined);
    expect(result.errors.some(e => /INVALID_CONSENT/.test(e))).toBe(true);
    expect(result.added).toEqual([]);
    expect(result.state).toBe(s);
    expect(result.state.round).toBe(5);
    expect(result.state.closingArgPresentedRound).toBe(5);
    expect(result.state.closingArgGoRound).toBe(5);
  });
  it('accepts with valid consent', () => {
    const s = initializeState('test');
    const result = applyOperations(s, [
      { op: 'add', type: 'EVIDENCE', statement: 'fact', source: 'codebase' },
    ], valid);
    expect(result.errors).toEqual([]);
    expect(result.added).toEqual(['EVID-1']);
    expect(result.state.round).toBe(1);
  });
});

describe('manageFriction with consent', () => {
  it('rejects without consent', () => {
    let s = initializeState('test');
    let r = applyOperations(s, [
      { op: 'add', type: 'EVIDENCE', statement: 'a', source: 'codebase' },
      { op: 'add', type: 'EVIDENCE', statement: 'b', source: 'codebase' },
    ], valid);
    s = r.state;
    const [id, newState, , err] = manageFriction(s, {
      op: 'add', friction_shape: 'permission-risk-linkage',
      anchor_a: 'EVID-1', anchor_b: 'EVID-2', disposition: 'lived-with',
    }, undefined);
    expect(err).toMatch(/INVALID_CONSENT/);
    expect(id).toBeNull();
    expect(newState).toEqual(s);
  });
});

describe('overrideFrictionDisposition with consent', () => {
  it('rejects without consent', () => {
    let s = initializeState('test');
    let r = applyOperations(s, [
      { op: 'add', type: 'EVIDENCE', statement: 'a', source: 'codebase' },
      { op: 'add', type: 'EVIDENCE', statement: 'b', source: 'codebase' },
    ], valid);
    s = r.state;
    let [, withFric] = manageFriction(s, {
      op: 'add', friction_shape: 'permission-risk-linkage',
      anchor_a: 'EVID-1', anchor_b: 'EVID-2', disposition: 'lived-with',
    }, valid);
    const [newState, , err] = overrideFrictionDisposition(withFric, {
      elementId: 'FRIC-1', disposition: 'relieved-by-exception',
    }, undefined);
    expect(err).toMatch(/INVALID_CONSENT/);
    expect(newState).toEqual(withFric);
  });
});

describe('ratifyResolveCondition with consent', () => {
  it('rejects without consent', () => {
    let s = initializeState('test');
    [, s] = addConcern(s, { label: 'C' }, valid);
    let r = applyOperations(s, [
      { op: 'add', type: 'RESOLVE_CONDITION', statement: 'rc', problem_anchor: 'CERN-1' },
    ], valid);
    s = r.state;
    const [newState, , err] = ratifyResolveCondition(s, {
      elementId: 'RCON-1', ratificationText: 'ok',
    }, undefined);
    expect(err).toMatch(/INVALID_CONSENT/);
    expect(newState).toEqual(s);
  });
});

describe('recordClosingArgPresented with consent', () => {
  it('rejects without consent', () => {
    const s = initializeState('test');
    const [newState, err] = recordClosingArgPresented(s, undefined);
    expect(err).toMatch(/INVALID_CONSENT/);
    expect(newState).toEqual(s);
  });
  it('accepts with valid consent', () => {
    const s = { ...initializeState('test'), round: 2 };
    const [newState, err] = recordClosingArgPresented(s, valid);
    expect(err).toBeNull();
    expect(newState.closingArgPresentedRound).toBe(2);
  });
});

describe('recordDesignerGo with consent', () => {
  it('rejects without consent', () => {
    const s = { ...initializeState('test'), round: 2, closingArgPresentedRound: 2 };
    const [newState, err] = recordDesignerGo(s, undefined);
    expect(err).toMatch(/INVALID_CONSENT/);
    expect(newState).toEqual(s);
  });
});
