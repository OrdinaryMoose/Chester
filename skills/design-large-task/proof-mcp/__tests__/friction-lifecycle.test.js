import { describe, it, expect, beforeEach } from 'vitest';
import { initializeState, applyOperations, manageFriction, overrideFrictionDisposition } from '../state.js';

describe('friction lifecycle', () => {
  let state;
  beforeEach(() => {
    state = initializeState('test problem');
    let r = applyOperations(state, [
      { op: 'add', type: 'EVIDENCE', statement: 'codebase fact', source: 'codebase' },
    ]);
    state = r.state;
    r = applyOperations(state, [
      { op: 'add', type: 'NECESSARY_CONDITION', statement: 'NC1', collapse_test: 'breaks if X', grounding: ['EVID-1'], reasoning_chain: 'IF X holds THEN NC1' },
      { op: 'add', type: 'NECESSARY_CONDITION', statement: 'NC2', collapse_test: 'breaks if Y', grounding: ['EVID-1'], reasoning_chain: 'IF Y holds THEN NC2' },
    ]);
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
    });
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
    });
    expect(id).toBeNull();
    expect(err).toMatch(/unknown element id|NCON-99/);
  });

  it('overrideFrictionDisposition with not-really-friction transitions to withdrawn', () => {
    let [, s] = manageFriction(state, {
      op: 'add', friction_shape: 'nc-nc-opposing-pull',
      anchor_a: 'NCON-1', anchor_b: 'NCON-2',
      disposition: 'lived-with', statement: 'noise',
    });
    [s] = overrideFrictionDisposition(s, { elementId: 'FRIC-1', disposition: 'not-really-friction' });
    expect(s.elements.get('FRIC-1').status).toBe('withdrawn');
    expect(s.elements.get('FRIC-1').disposition).toBe('not-really-friction');
    const events = s.frictionLog.map(e => e.event);
    expect(events).toContain('disposition-changed');
    expect(events).toContain('dismissed');
  });

  it('overrideFrictionDisposition rejects non-FRICTION element', () => {
    const [, , err] = overrideFrictionDisposition(state, { elementId: 'NCON-1', disposition: 'lived-with' });
    expect(err).toMatch(/must be FRICTION/);
  });

  it('overrideFrictionDisposition rejects unknown element id', () => {
    const [, , err] = overrideFrictionDisposition(state, { elementId: 'FRIC-99', disposition: 'lived-with' });
    expect(err).toMatch(/unknown element id|FRIC-99/);
  });

  it('overrideFrictionDisposition rejects invalid disposition value', () => {
    const [, s] = manageFriction(state, {
      op: 'add', friction_shape: 'nc-nc-opposing-pull',
      anchor_a: 'NCON-1', anchor_b: 'NCON-2',
      disposition: 'lived-with', statement: 'noise',
    });
    const [, , err] = overrideFrictionDisposition(s, { elementId: 'FRIC-1', disposition: 'fixed-it' });
    expect(err).toMatch(/disposition must be one of/);
  });
});
