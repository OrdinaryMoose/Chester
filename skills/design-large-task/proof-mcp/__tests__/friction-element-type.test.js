import { describe, it, expect } from 'vitest';
import { ELEMENT_TYPES, createElement, checkAllIntegrity } from '../proof.js';
import { initializeState, generateId } from '../state.js';

describe('FRICTION element type registration', () => {
  it('includes FRICTION in ELEMENT_TYPES as the seventh entry', () => {
    expect(ELEMENT_TYPES).toContain('FRICTION');
    expect(ELEMENT_TYPES.length).toBe(7);
  });

  it('createElement builds a FRICTION element with required fields', () => {
    const op = {
      type: 'FRICTION',
      friction_shape: 'permission-risk-linkage',
      anchor_a: 'PERM-1',
      anchor_b: 'RISK-2',
      disposition: 'relieved-by-exception',
      statement: 'Permission relieves rule that risk grounds in',
    };
    const el = createElement(op, 'FRIC-1', 5);
    expect(el.type).toBe('FRICTION');
    expect(el.id).toBe('FRIC-1');
    expect(el.status).toBe('active');
    expect(el.friction_shape).toBe('permission-risk-linkage');
    expect(el.disposition).toBe('relieved-by-exception');
    expect(el.anchor_a).toBe('PERM-1');
    expect(el.anchor_b).toBe('RISK-2');
    expect(el.addedInRound).toBe(5);
  });

  it('createElement rejects invalid friction_shape', () => {
    expect(() =>
      createElement(
        { type: 'FRICTION', friction_shape: 'logical-tension', anchor_a: 'X', anchor_b: 'Y', disposition: 'lived-with' },
        'FRIC-1',
        1,
      ),
    ).toThrow(/friction_shape/);
  });

  it('createElement rejects invalid disposition', () => {
    expect(() =>
      createElement(
        { type: 'FRICTION', friction_shape: 'rc-rule-conflict', anchor_a: 'X', anchor_b: 'Y', disposition: 'fixed-it' },
        'FRIC-1',
        1,
      ),
    ).toThrow(/disposition/);
  });

  it('initializeState seeds elementCounters.FRICTION = 0', () => {
    const state = initializeState('test problem');
    expect(state.elementCounters.FRICTION).toBe(0);
  });

  it('generateId returns FRIC-1 for FRICTION', () => {
    const state = initializeState('test problem');
    const [id] = generateId(state, 'FRICTION');
    expect(id).toBe('FRIC-1');
  });

  it('checkUngroundedFrictionAnchors flags FRICTION whose anchors do not exist', () => {
    const elements = new Map();
    elements.set('FRIC-1', {
      id: 'FRIC-1', type: 'FRICTION', status: 'active',
      friction_shape: 'nc-nc-opposing-pull',
      anchor_a: 'NCON-99', anchor_b: 'NCON-1', disposition: 'lived-with',
    });
    elements.set('NCON-1', { id: 'NCON-1', type: 'NECESSARY_CONDITION', status: 'active' });
    const warnings = checkAllIntegrity(elements);
    expect(warnings.some(w => /FRIC-1/.test(w) && /NCON-99/.test(w))).toBe(true);
  });
});
