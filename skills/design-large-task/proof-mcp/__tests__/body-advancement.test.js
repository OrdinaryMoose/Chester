import { describe, it, expect } from 'vitest';
import { computeBodyAdvancement } from '../body-advancement.js';

function snap(elements = [], concerns = [], definitions = []) {
  return {
    elements: new Map(elements.map(e => [e.id, e])),
    concerns,
    definitions,
  };
}

describe('computeBodyAdvancement', () => {
  it('returns all-zero / advanced=false when nothing changed', () => {
    const before = snap([{ id: 'NCON-1', type: 'NECESSARY_CONDITION', status: 'active', revisedInRound: null }]);
    const after = { elements: new Map(before.elements), concerns: [], definitions: [] };
    expect(computeBodyAdvancement(before, after)).toEqual({
      advanced: false, addCount: 0, reviseCount: 0, withdrawCount: 0,
    });
  });

  it('counts an added NC', () => {
    const before = snap();
    const after = snap([{ id: 'NCON-1', type: 'NECESSARY_CONDITION', status: 'active', revisedInRound: null }]);
    const result = computeBodyAdvancement(before, after);
    expect(result.advanced).toBe(true);
    expect(result.addCount).toBe(1);
    expect(result.reviseCount).toBe(0);
    expect(result.withdrawCount).toBe(0);
  });

  it('counts an added Concern', () => {
    const before = { elements: new Map(), concerns: [], definitions: [] };
    const after = { elements: new Map(), concerns: [{ id: 'CERN-1', status: 'draft' }], definitions: [] };
    expect(computeBodyAdvancement(before, after).addCount).toBe(1);
  });

  it('counts an added Definition', () => {
    const before = { elements: new Map(), concerns: [], definitions: [] };
    const after = { elements: new Map(), concerns: [], definitions: [{ id: 'DEFN-1', status: 'draft' }] };
    expect(computeBodyAdvancement(before, after).addCount).toBe(1);
  });

  it('counts a revise via revisedInRound delta', () => {
    const before = snap([{ id: 'NCON-1', type: 'NECESSARY_CONDITION', status: 'active', revisedInRound: null }]);
    const after = snap([{ id: 'NCON-1', type: 'NECESSARY_CONDITION', status: 'active', revisedInRound: 3 }]);
    const result = computeBodyAdvancement(before, after);
    expect(result.reviseCount).toBe(1);
    expect(result.advanced).toBe(true);
  });

  it('counts a withdrawal of an element', () => {
    const before = snap([{ id: 'NCON-1', type: 'NECESSARY_CONDITION', status: 'active', revisedInRound: null }]);
    const after = snap([{ id: 'NCON-1', type: 'NECESSARY_CONDITION', status: 'withdrawn', revisedInRound: null }]);
    expect(computeBodyAdvancement(before, after).withdrawCount).toBe(1);
  });

  it('counts a withdrawal of a Concern', () => {
    const before = { elements: new Map(), concerns: [{ id: 'CERN-1', status: 'draft' }], definitions: [] };
    const after = { elements: new Map(), concerns: [{ id: 'CERN-1', status: 'withdrawn' }], definitions: [] };
    expect(computeBodyAdvancement(before, after).withdrawCount).toBe(1);
  });

  it('does NOT count ratification flips as advancement', () => {
    const before = snap([{ id: 'NCON-1', type: 'NECESSARY_CONDITION', status: 'active', revisedInRound: null, ratificationStatus: 'draft' }]);
    const after = snap([{ id: 'NCON-1', type: 'NECESSARY_CONDITION', status: 'active', revisedInRound: null, ratificationStatus: 'ratified' }]);
    expect(computeBodyAdvancement(before, after)).toEqual({
      advanced: false, addCount: 0, reviseCount: 0, withdrawCount: 0,
    });
  });
});
