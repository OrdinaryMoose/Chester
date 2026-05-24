import { describe, it, expect } from 'vitest';
import { checkFirstYesGate } from '../first-yes-gate.js';

function makeState({ elements = [], concerns = [], definitions = [] } = {}) {
  return {
    elements: new Map(elements.map(e => [e.id, e])),
    concerns,
    definitions,
  };
}

describe('checkFirstYesGate', () => {
  it('passes on empty state', () => {
    expect(checkFirstYesGate(makeState())).toEqual({ passed: true, unratifiedIds: [] });
  });

  it('passes when every NC is ratified', () => {
    const state = makeState({
      elements: [
        { id: 'NCON-1', type: 'NECESSARY_CONDITION', status: 'active', ratificationStatus: 'ratified' },
      ],
    });
    expect(checkFirstYesGate(state).passed).toBe(true);
  });

  it('fails on draft NC and lists the id', () => {
    const state = makeState({
      elements: [
        { id: 'NCON-1', type: 'NECESSARY_CONDITION', status: 'active', ratificationStatus: 'draft' },
      ],
    });
    expect(checkFirstYesGate(state)).toEqual({ passed: false, unratifiedIds: ['NCON-1'] });
  });

  it('fails on RC with ratification === null', () => {
    const state = makeState({
      elements: [
        { id: 'RCON-1', type: 'RESOLVE_CONDITION', status: 'active', ratification: null },
      ],
    });
    expect(checkFirstYesGate(state).unratifiedIds).toEqual(['RCON-1']);
  });

  it('passes on RC with ratification set', () => {
    const state = makeState({
      elements: [
        { id: 'RCON-1', type: 'RESOLVE_CONDITION', status: 'active', ratification: { round: 2 } },
      ],
    });
    expect(checkFirstYesGate(state).passed).toBe(true);
  });

  it('fails on draft Concern', () => {
    const state = makeState({ concerns: [{ id: 'CERN-1', status: 'draft' }] });
    expect(checkFirstYesGate(state).unratifiedIds).toEqual(['CERN-1']);
  });

  it('fails on draft Definition', () => {
    const state = makeState({ definitions: [{ id: 'DEFN-1', status: 'draft' }] });
    expect(checkFirstYesGate(state).unratifiedIds).toEqual(['DEFN-1']);
  });

  it('skips withdrawn elements/concerns/definitions', () => {
    const state = makeState({
      elements: [
        { id: 'NCON-1', type: 'NECESSARY_CONDITION', status: 'withdrawn', ratificationStatus: 'draft' },
      ],
      concerns: [{ id: 'CERN-1', status: 'withdrawn' }],
      definitions: [{ id: 'DEFN-1', status: 'withdrawn' }],
    });
    expect(checkFirstYesGate(state).passed).toBe(true);
  });

  it('aggregates unratifiedIds across all lanes', () => {
    const state = makeState({
      elements: [
        { id: 'NCON-1', type: 'NECESSARY_CONDITION', status: 'active', ratificationStatus: 'draft' },
        { id: 'RCON-1', type: 'RESOLVE_CONDITION', status: 'active', ratification: null },
      ],
      concerns: [{ id: 'CERN-1', status: 'draft' }],
      definitions: [{ id: 'DEFN-1', status: 'draft' }],
    });
    const result = checkFirstYesGate(state);
    expect(result.passed).toBe(false);
    expect(new Set(result.unratifiedIds)).toEqual(new Set(['NCON-1', 'RCON-1', 'CERN-1', 'DEFN-1']));
  });
});
