import { describe, it, expect } from 'vitest';
import {
  computeCompleteness,
  computeBasisCoverage,
  detectStall,
  detectChallenge,
  checkClosure,
} from '../metrics.js';

// --- helpers ---

function makeElement(overrides) {
  return {
    id: 'e1',
    type: 'ASSERTION',
    statement: 'test',
    source: null,
    basis: [],
    over: null,
    confidence: 0.8,
    reason: null,
    status: 'active',
    resolvedBy: null,
    addedInRound: 0,
    revisedInRound: null,
    revision: 0,
    ...overrides,
  };
}

function mapOf(...elements) {
  const m = new Map();
  for (const el of elements) m.set(el.id, el);
  return m;
}

// =============================================================================
// computeCompleteness
// =============================================================================
describe('computeCompleteness', () => {
  it('returns zeros for an empty map', () => {
    const result = computeCompleteness(new Map());
    expect(result).toEqual({
      total_elements: 0,
      active_elements: 0,
      open_count: 0,
      boundary_count: 0,
      decisions_with_alternatives: 0,
      revision_count: 0,
    });
  });

  it('counts mixed active and withdrawn elements', () => {
    const elements = mapOf(
      makeElement({ id: 'o1', type: 'OPEN', status: 'active' }),
      makeElement({ id: 'o2', type: 'OPEN', status: 'withdrawn' }),
      makeElement({ id: 'b1', type: 'BOUNDARY', status: 'active', reason: 'r' }),
      makeElement({ id: 'd1', type: 'DECISION', status: 'active', over: ['a', 'b'] }),
      makeElement({ id: 'd2', type: 'DECISION', status: 'active', over: [] }),
      makeElement({ id: 'r1', type: 'ASSERTION', status: 'active', revisedInRound: 2 }),
    );
    const result = computeCompleteness(elements);
    expect(result.total_elements).toBe(6);
    expect(result.active_elements).toBe(5);
    expect(result.open_count).toBe(1);        // only active OPEN
    expect(result.boundary_count).toBe(1);
    expect(result.decisions_with_alternatives).toBe(1); // d1 has over.length > 0
    expect(result.revision_count).toBe(1);
  });

  it('excludes resolved OPENs from open_count', () => {
    const elements = mapOf(
      makeElement({ id: 'o1', type: 'OPEN', status: 'resolved' }),
    );
    const result = computeCompleteness(elements);
    expect(result.open_count).toBe(0);
    expect(result.active_elements).toBe(0);
  });
});

// =============================================================================
// computeBasisCoverage
// =============================================================================
describe('computeBasisCoverage', () => {
  it('returns 1.0 when there are no decisions', () => {
    const elements = mapOf(
      makeElement({ id: 'g1', type: 'GIVEN', source: 'designer' }),
    );
    expect(computeBasisCoverage(elements)).toBe(1.0);
  });

  it('returns 1.0 when all decisions have full coverage', () => {
    const elements = mapOf(
      makeElement({ id: 'g1', type: 'GIVEN', source: 'designer' }),
      makeElement({ id: 'c1', type: 'CONSTRAINT', basis: ['g1'] }),
      makeElement({ id: 'd1', type: 'DECISION', over: ['x'], basis: ['c1'] }),
    );
    expect(computeBasisCoverage(elements)).toBe(1.0);
  });

  it('returns 0.0 when no decisions have full coverage', () => {
    // ASSERTION leaf (not GIVEN or CONSTRAINT) breaks coverage
    const elements = mapOf(
      makeElement({ id: 'a1', type: 'ASSERTION', confidence: 0.5, basis: [] }),
      makeElement({ id: 'd1', type: 'DECISION', over: ['x'], basis: ['a1'] }),
    );
    expect(computeBasisCoverage(elements)).toBe(0.0);
  });

  it('returns partial coverage ratio', () => {
    const elements = mapOf(
      makeElement({ id: 'g1', type: 'GIVEN', source: 'designer' }),
      makeElement({ id: 'a1', type: 'ASSERTION', confidence: 0.5, basis: [] }),
      makeElement({ id: 'd1', type: 'DECISION', over: ['x'], basis: ['g1'] }), // covered
      makeElement({ id: 'd2', type: 'DECISION', over: ['y'], basis: ['a1'] }), // not covered
    );
    expect(computeBasisCoverage(elements)).toBe(0.5);
  });

  it('ignores withdrawn decisions', () => {
    const elements = mapOf(
      makeElement({ id: 'a1', type: 'ASSERTION', confidence: 0.5, basis: [] }),
      makeElement({ id: 'd1', type: 'DECISION', over: ['x'], basis: ['a1'], status: 'withdrawn' }),
    );
    // No active decisions -> 1.0
    expect(computeBasisCoverage(elements)).toBe(1.0);
  });
});

// =============================================================================
// detectStall
// =============================================================================
describe('detectStall', () => {
  it('returns false with fewer than 4 entries', () => {
    expect(detectStall([5, 5, 5])).toBe(false);
  });

  it('returns true when open count unchanged for 3 consecutive rounds', () => {
    expect(detectStall([5, 5, 5, 5])).toBe(true);
  });

  it('returns false when count changes within window', () => {
    expect(detectStall([5, 5, 4, 5])).toBe(false);
  });

  it('checks only the last 4 entries', () => {
    expect(detectStall([3, 2, 5, 5, 5, 5])).toBe(true);
  });

  it('returns false for decreasing counts', () => {
    expect(detectStall([5, 4, 3, 2])).toBe(false);
  });
});

// =============================================================================
// detectChallenge
// =============================================================================
describe('detectChallenge', () => {
  const baseState = {
    round: 3,
    elements: new Map(),
    openCountHistory: [],
    elementCountHistory: [],
    challengeModesUsed: [],
  };

  describe('ontologist trigger', () => {
    it('fires when stall detected and not already used', () => {
      const state = {
        ...baseState,
        openCountHistory: [5, 5, 5, 5],
      };
      const result = detectChallenge(state);
      expect(result.mode).toBe('ontologist');
      expect(result.reason).toBeTruthy();
    });

    it('does not fire when already used', () => {
      const state = {
        ...baseState,
        openCountHistory: [5, 5, 5, 5],
        challengeModesUsed: ['ontologist'],
      };
      const result = detectChallenge(state);
      expect(result.mode).not.toBe('ontologist');
    });
  });

  describe('simplifier trigger', () => {
    it('fires when element count grew by >= 3 and opens did not decrease', () => {
      const state = {
        ...baseState,
        openCountHistory: [2, 2], // not stall (< 4 entries), opens did not decrease
        elementCountHistory: [10, 13],
        challengeModesUsed: [],
      };
      const result = detectChallenge(state);
      expect(result.mode).toBe('simplifier');
    });

    it('does not fire when opens decreased', () => {
      const state = {
        ...baseState,
        openCountHistory: [3, 2],
        elementCountHistory: [10, 13],
        challengeModesUsed: [],
      };
      const result = detectChallenge(state);
      expect(result.mode).not.toBe('simplifier');
    });

    it('does not fire when already used', () => {
      const state = {
        ...baseState,
        openCountHistory: [2, 2],
        elementCountHistory: [10, 13],
        challengeModesUsed: ['simplifier'],
      };
      const result = detectChallenge(state);
      expect(result.mode).not.toBe('simplifier');
    });
  });

  describe('contrarian trigger', () => {
    it('fires when assertion has no designer GIVEN in basis', () => {
      const elements = mapOf(
        makeElement({ id: 'a1', type: 'ASSERTION', confidence: 0.8, basis: ['c1'] }),
        makeElement({ id: 'c1', type: 'CONSTRAINT', basis: [] }),
      );
      const state = {
        ...baseState,
        round: 3,
        elements,
        challengeModesUsed: [],
      };
      const result = detectChallenge(state);
      expect(result.mode).toBe('contrarian');
    });

    it('does not fire when assertion has designer GIVEN in chain', () => {
      const elements = mapOf(
        makeElement({ id: 'g1', type: 'GIVEN', source: 'designer', basis: [] }),
        makeElement({ id: 'a1', type: 'ASSERTION', confidence: 0.8, basis: ['g1'] }),
      );
      const state = {
        ...baseState,
        round: 3,
        elements,
        challengeModesUsed: [],
      };
      const result = detectChallenge(state);
      expect(result.mode).not.toBe('contrarian');
    });

    it('does not fire before round 2', () => {
      const elements = mapOf(
        makeElement({ id: 'a1', type: 'ASSERTION', confidence: 0.8, basis: [] }),
      );
      const state = {
        ...baseState,
        round: 1,
        elements,
        challengeModesUsed: [],
      };
      const result = detectChallenge(state);
      expect(result.mode).not.toBe('contrarian');
    });

    it('does not fire when already used', () => {
      const elements = mapOf(
        makeElement({ id: 'a1', type: 'ASSERTION', confidence: 0.8, basis: [] }),
      );
      const state = {
        ...baseState,
        round: 3,
        elements,
        challengeModesUsed: ['contrarian'],
      };
      const result = detectChallenge(state);
      expect(result.mode).not.toBe('contrarian');
    });
  });

  it('returns null mode when no challenges trigger', () => {
    const result = detectChallenge(baseState);
    expect(result).toEqual({ mode: null, reason: null });
  });
});

// =============================================================================
// checkClosure
// =============================================================================
describe('checkClosure', () => {
  // Build a state that satisfies all conditions
  function closableState() {
    const elements = mapOf(
      makeElement({ id: 'g1', type: 'GIVEN', source: 'designer' }),
      makeElement({ id: 'b1', type: 'BOUNDARY', reason: 'scope', status: 'active' }),
      makeElement({ id: 'd1', type: 'DECISION', over: ['x', 'y'], basis: ['g1'], revisedInRound: 3 }),
    );
    return { elements, round: 4, phaseTransitionRound: 1 };
  }

  it('permits closure when all conditions met', () => {
    const result = checkClosure(closableState());
    expect(result.permitted).toBe(true);
    expect(result.reasons).toEqual([]);
  });

  it('fails when active OPENs remain', () => {
    const state = closableState();
    state.elements.set('o1', makeElement({ id: 'o1', type: 'OPEN', status: 'active' }));
    const result = checkClosure(state);
    expect(result.permitted).toBe(false);
    expect(result.reasons).toContainEqual(expect.stringContaining('OPEN'));
  });

  it('fails when basis coverage is incomplete', () => {
    const state = closableState();
    // Add a decision with an uncovered basis
    state.elements.set('a1', makeElement({ id: 'a1', type: 'ASSERTION', confidence: 0.5, basis: [] }));
    state.elements.set('d2', makeElement({ id: 'd2', type: 'DECISION', over: ['z'], basis: ['a1'] }));
    const result = checkClosure(state);
    expect(result.permitted).toBe(false);
    expect(result.reasons).toContainEqual(expect.stringContaining('basis coverage'));
  });

  it('fails when no active BOUNDARY exists', () => {
    const state = closableState();
    state.elements.delete('b1');
    const result = checkClosure(state);
    expect(result.permitted).toBe(false);
    expect(result.reasons).toContainEqual(expect.stringContaining('BOUNDARY'));
  });

  it('fails when no DECISION has alternatives', () => {
    const state = closableState();
    state.elements.get('d1').over = [];
    const result = checkClosure(state);
    expect(result.permitted).toBe(false);
    expect(result.reasons).toContainEqual(expect.stringContaining('alternatives'));
  });

  it('fails when no element revised after phase transition', () => {
    const state = closableState();
    state.elements.get('d1').revisedInRound = null;
    const result = checkClosure(state);
    expect(result.permitted).toBe(false);
    expect(result.reasons).toContainEqual(expect.stringContaining('revised'));
  });

  it('fails when round < 3', () => {
    const state = closableState();
    state.round = 2;
    const result = checkClosure(state);
    expect(result.permitted).toBe(false);
    expect(result.reasons).toContainEqual(expect.stringContaining('round'));
  });

  it('collects all failing reasons at once', () => {
    const state = {
      elements: new Map(),
      round: 1,
      phaseTransitionRound: 0,
    };
    const result = checkClosure(state);
    expect(result.permitted).toBe(false);
    // Should have multiple reasons
    expect(result.reasons.length).toBeGreaterThanOrEqual(4);
  });
});
