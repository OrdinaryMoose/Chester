import { describe, it, expect, beforeEach } from 'vitest';
import { initializeState, applyOperations, manageFriction, overrideFrictionDisposition } from '../state.js';
import { deriveClosingArgument } from '../closing-argument.js';

describe('friction lifecycle', () => {
  let state;
  beforeEach(() => {
    state = initializeState('test problem');
    let r = applyOperations(state, [
      { op: 'add', type: 'EVIDENCE', statement: 'codebase fact', source: 'codebase' },
    ], { source: 'designer', rationale: 'test' });
    state = r.state;
    r = applyOperations(state, [
      { op: 'add', type: 'NECESSARY_CONDITION', statement: 'NC1', collapse_test: 'breaks if X', grounding: ['EVID-1'], reasoning_chain: 'IF X holds THEN NC1' },
      { op: 'add', type: 'NECESSARY_CONDITION', statement: 'NC2', collapse_test: 'breaks if Y', grounding: ['EVID-1'], reasoning_chain: 'IF Y holds THEN NC2' },
    ], { source: 'designer', rationale: 'test' });
    state = r.state;
  });

  it('manageFriction add creates a FRICTION element with FRIC-N id and appends to frictionLog', () => {
    const [id, newState, , err] = manageFriction(state, {
      op: 'add',
      friction_shape: 'nc-nc-opposing-pull',
      anchor_a: 'NCON-1',
      anchor_b: 'NCON-2',
      disposition: 'lived-with',
      statement: 'NC1 and NC2 pull against each other',
    }, { source: 'designer', rationale: 'test' });
    expect(err).toBeNull();
    expect(id).toBe('FRIC-1');
    expect(newState.elements.get('FRIC-1').type).toBe('FRICTION');
    expect(newState.frictionLog.length).toBeGreaterThan(0);
    expect(newState.frictionLog[0].event).toBe('added');
    expect(newState.frictionLog[0].frictionId).toBe('FRIC-1');
  });

  it('manageFriction add rejects unknown anchor', () => {
    const [id, , , err] = manageFriction(state, {
      op: 'add', friction_shape: 'nc-nc-opposing-pull',
      anchor_a: 'NCON-1', anchor_b: 'NCON-99',
      disposition: 'lived-with', statement: 'bad',
    }, { source: 'designer', rationale: 'test' });
    expect(id).toBeNull();
    expect(err).toMatch(/unknown element id|NCON-99/);
  });

  it('overrideFrictionDisposition with not-really-friction transitions to withdrawn', () => {
    let [, s] = manageFriction(state, {
      op: 'add', friction_shape: 'nc-nc-opposing-pull',
      anchor_a: 'NCON-1', anchor_b: 'NCON-2',
      disposition: 'lived-with', statement: 'noise',
    }, { source: 'designer', rationale: 'test' });
    [s] = overrideFrictionDisposition(s, { elementId: 'FRIC-1', disposition: 'not-really-friction' }, { source: 'designer', rationale: 'test' });
    expect(s.elements.get('FRIC-1').status).toBe('withdrawn');
    expect(s.elements.get('FRIC-1').disposition).toBe('not-really-friction');
    const events = s.frictionLog.map(e => e.event);
    expect(events).toContain('disposition-changed');
    expect(events).toContain('dismissed');
  });

  it('overrideFrictionDisposition rejects non-FRICTION element', () => {
    const [, , err] = overrideFrictionDisposition(state, { elementId: 'NCON-1', disposition: 'lived-with' }, { source: 'designer', rationale: 'test' });
    expect(err).toMatch(/must be FRICTION/);
  });

  it('overrideFrictionDisposition rejects unknown element id', () => {
    const [, , err] = overrideFrictionDisposition(state, { elementId: 'FRIC-99', disposition: 'lived-with' }, { source: 'designer', rationale: 'test' });
    expect(err).toMatch(/unknown element id|FRIC-99/);
  });

  it('overrideFrictionDisposition rejects invalid disposition value', () => {
    const [, s] = manageFriction(state, {
      op: 'add', friction_shape: 'nc-nc-opposing-pull',
      anchor_a: 'NCON-1', anchor_b: 'NCON-2',
      disposition: 'lived-with', statement: 'noise',
    }, { source: 'designer', rationale: 'test' });
    const [, , err] = overrideFrictionDisposition(s, { elementId: 'FRIC-1', disposition: 'fixed-it' }, { source: 'designer', rationale: 'test' });
    expect(err).toMatch(/disposition must be one of/);
  });

  it('applyOperations refuses to add FRICTION (must use manage_friction)', () => {
    let s = initializeState('p');
    let r = applyOperations(s, [
      { op: 'add', type: 'EVIDENCE', statement: 'fact', source: 'codebase' },
    ], { source: 'designer', rationale: 'test' });
    s = r.state;
    r = applyOperations(s, [
      { op: 'add', type: 'NECESSARY_CONDITION', statement: 'NCa', collapse_test: 'a', grounding: ['EVID-1'], reasoning_chain: 'IF fact THEN NCa' },
      { op: 'add', type: 'NECESSARY_CONDITION', statement: 'NCb', collapse_test: 'b', grounding: ['EVID-1'], reasoning_chain: 'IF fact THEN NCb' },
    ], { source: 'designer', rationale: 'test' });
    s = r.state;
    r = applyOperations(s, [
      { op: 'add', type: 'FRICTION', friction_shape: 'nc-nc-opposing-pull', anchor_a: 'NCON-1', anchor_b: 'NCON-2', disposition: 'lived-with' },
    ], { source: 'designer', rationale: 'test' });
    expect(r.errors.some(e => /FRICTION via submit_proof_update/.test(e))).toBe(true);
    expect([...r.state.elements.values()].some(el => el.type === 'FRICTION' && el.id !== 'FRIC-1' && !el.id.startsWith('FRIC-'))).toBe(false);
  });

  it('applyOperations refuses to withdraw FRICTION (must use override_friction_disposition)', () => {
    let s = initializeState('p');
    let r = applyOperations(s, [
      { op: 'add', type: 'EVIDENCE', statement: 'fact', source: 'codebase' },
    ], { source: 'designer', rationale: 'test' });
    s = r.state;
    r = applyOperations(s, [
      { op: 'add', type: 'NECESSARY_CONDITION', statement: 'NCa', collapse_test: 'a', grounding: ['EVID-1'], reasoning_chain: 'IF fact THEN NCa' },
      { op: 'add', type: 'NECESSARY_CONDITION', statement: 'NCb', collapse_test: 'b', grounding: ['EVID-1'], reasoning_chain: 'IF fact THEN NCb' },
    ], { source: 'designer', rationale: 'test' });
    s = r.state;
    let [, withFric] = manageFriction(s, {
      op: 'add', friction_shape: 'nc-nc-opposing-pull',
      anchor_a: 'NCON-1', anchor_b: 'NCON-2',
      disposition: 'lived-with', statement: 'tension',
    }, { source: 'designer', rationale: 'test' });
    s = withFric;
    r = applyOperations(s, [{ op: 'withdraw', target: 'FRIC-1' }], { source: 'designer', rationale: 'test' });
    expect(r.errors.some(e => /override_friction_disposition/.test(e))).toBe(true);
    expect(r.state.elements.get('FRIC-1').status).toBe('active');
  });

  it('full lifecycle: auto-create from detection, override disposition, dismiss to phantom, surface in closing argument', () => {
    let s = initializeState('p');
    let r = applyOperations(s, [
      { op: 'add', type: 'RULE', statement: 'must not Z', source: 'designer' },
      { op: 'add', type: 'PERMISSION', statement: 'allow Z', source: 'designer', relieves: 'RULE-1' },
      { op: 'add', type: 'RISK', statement: 'Z dangerous', basis: ['RULE-1'] },
    ], { source: 'designer', rationale: 'test' });
    s = r.state;
    const auto = [...s.elements.values()].find(el => el.type === 'FRICTION');
    expect(auto).toBeDefined();
    const [s2] = overrideFrictionDisposition(s, { elementId: auto.id, disposition: 'not-really-friction' }, { source: 'designer', rationale: 'test' });
    expect(s2.elements.get(auto.id).status).toBe('withdrawn');
    const argument = deriveClosingArgument(s2);
    expect(argument.phantomFriction.some(f => f.id === auto.id)).toBe(true);
  });
});
