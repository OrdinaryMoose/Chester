import { describe, it, expect } from 'vitest';
import {
  computeCompleteness,
  computeGroundingCoverage,
  detectStall,
  detectChallenge,
  checkClosure,
} from '../metrics.js';

// --- helpers ---

function makeElement(overrides) {
  return {
    id: 'e1',
    type: 'EVIDENCE',
    statement: 'test',
    source: 'codebase',
    grounding: [],
    collapse_test: null,
    reasoning_chain: null,
    rejected_alternatives: [],
    relieves: null,
    basis: [],
    status: 'active',
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
      condition_count: 0,
      conditions_with_alternatives: 0,
      conditions_with_collapse_test: 0,
      rule_count: 0,
      evidence_count: 0,
      permission_count: 0,
      risk_count: 0,
      revision_count: 0,
    });
  });

  it('counts elements by type', () => {
    const elements = mapOf(
      makeElement({ id: 'EVID-1', type: 'EVIDENCE', source: 'codebase' }),
      makeElement({ id: 'RULE-1', type: 'RULE', source: 'designer' }),
      makeElement({ id: 'PERM-1', type: 'PERMISSION', source: 'designer', relieves: 'x' }),
      makeElement({
        id: 'NCON-1', type: 'NECESSARY_CONDITION',
        grounding: ['EVID-1'], collapse_test: 'breaks',
        rejected_alternatives: ['alt-a'],
      }),
      makeElement({
        id: 'NCON-2', type: 'NECESSARY_CONDITION',
        grounding: ['RULE-1'], collapse_test: 'fails',
        rejected_alternatives: [],
        status: 'withdrawn',
      }),
      makeElement({ id: 'RISK-1', type: 'RISK', basis: ['NCON-1'] }),
    );
    const result = computeCompleteness(elements);
    expect(result.total_elements).toBe(6);
    expect(result.active_elements).toBe(5);
    expect(result.condition_count).toBe(1); // only active NC
    expect(result.conditions_with_alternatives).toBe(1);
    expect(result.conditions_with_collapse_test).toBe(1);
    expect(result.rule_count).toBe(1);
    expect(result.evidence_count).toBe(1);
    expect(result.permission_count).toBe(1);
    expect(result.risk_count).toBe(1);
  });

  it('counts revisions', () => {
    const elements = mapOf(
      makeElement({ id: 'EVID-1', type: 'EVIDENCE', revisedInRound: 3 }),
    );
    expect(computeCompleteness(elements).revision_count).toBe(1);
  });
});

// =============================================================================
// computeGroundingCoverage
// =============================================================================
describe('computeGroundingCoverage', () => {
  it('returns 1.0 when there are no conditions', () => {
    const elements = mapOf(
      makeElement({ id: 'EVID-1', type: 'EVIDENCE' }),
    );
    expect(computeGroundingCoverage(elements)).toBe(1.0);
  });

  it('returns 1.0 when all conditions ground in EVIDENCE/RULE/PERMISSION', () => {
    const elements = mapOf(
      makeElement({ id: 'EVID-1', type: 'EVIDENCE' }),
      makeElement({ id: 'RULE-1', type: 'RULE', source: 'designer' }),
      makeElement({
        id: 'NCON-1', type: 'NECESSARY_CONDITION',
        grounding: ['EVID-1', 'RULE-1'], collapse_test: 'x', reasoning_chain: 'y',
      }),
    );
    expect(computeGroundingCoverage(elements)).toBe(1.0);
  });

  it('returns 0.0 when no conditions are grounded', () => {
    // NC grounded only in another NC with no further grounding
    const elements = mapOf(
      makeElement({
        id: 'NCON-1', type: 'NECESSARY_CONDITION',
        grounding: ['NCON-2'], collapse_test: 'x', reasoning_chain: 'y',
      }),
      makeElement({
        id: 'NCON-2', type: 'NECESSARY_CONDITION',
        grounding: [], collapse_test: 'x', reasoning_chain: 'y',
      }),
    );
    expect(computeGroundingCoverage(elements)).toBe(0.0);
  });

  it('returns partial coverage ratio', () => {
    const elements = mapOf(
      makeElement({ id: 'EVID-1', type: 'EVIDENCE' }),
      makeElement({
        id: 'NCON-1', type: 'NECESSARY_CONDITION',
        grounding: ['EVID-1'], collapse_test: 'x', reasoning_chain: 'y',
      }), // covered
      makeElement({
        id: 'NCON-2', type: 'NECESSARY_CONDITION',
        grounding: ['RISK-1'], collapse_test: 'x', reasoning_chain: 'y',
      }), // not covered: RISK is not a grounding type
      makeElement({ id: 'RISK-1', type: 'RISK' }),
    );
    expect(computeGroundingCoverage(elements)).toBe(0.5);
  });

  it('ignores withdrawn conditions', () => {
    const elements = mapOf(
      makeElement({
        id: 'NCON-1', type: 'NECESSARY_CONDITION',
        grounding: ['RISK-1'], collapse_test: 'x', status: 'withdrawn',
      }),
      makeElement({ id: 'RISK-1', type: 'RISK' }),
    );
    expect(computeGroundingCoverage(elements)).toBe(1.0);
  });
});

// =============================================================================
// detectStall
// =============================================================================
describe('detectStall', () => {
  it('returns false with fewer than 4 entries', () => {
    expect(detectStall([2, 2, 2])).toBe(false);
  });

  it('returns true when condition count unchanged for 3 consecutive rounds', () => {
    expect(detectStall([2, 2, 2, 2])).toBe(true);
  });

  it('returns false when count changes within window', () => {
    expect(detectStall([2, 2, 3, 2])).toBe(false);
  });

  it('checks only the last 4 entries', () => {
    expect(detectStall([1, 0, 3, 3, 3, 3])).toBe(true);
  });
});

// =============================================================================
// detectChallenge
// =============================================================================
describe('detectChallenge', () => {
  const baseState = {
    round: 3,
    elements: new Map(),
    conditionCountHistory: [],
    elementCountHistory: [],
    challengeModesUsed: [],
  };

  describe('ontologist trigger', () => {
    it('fires when condition count stalls', () => {
      const state = {
        ...baseState,
        conditionCountHistory: [2, 2, 2, 2],
      };
      const result = detectChallenge(state);
      expect(result.mode).toBe('ontologist');
    });

    it('does not fire when already used', () => {
      const state = {
        ...baseState,
        conditionCountHistory: [2, 2, 2, 2],
        challengeModesUsed: ['ontologist'],
      };
      expect(detectChallenge(state).mode).not.toBe('ontologist');
    });
  });

  describe('simplifier trigger', () => {
    it('fires when condition count grew by >= 2', () => {
      const state = {
        ...baseState,
        conditionCountHistory: [1, 3],
        elementCountHistory: [5, 8],
      };
      const result = detectChallenge(state);
      expect(result.mode).toBe('simplifier');
    });

    it('does not fire when condition growth < 2', () => {
      const state = {
        ...baseState,
        conditionCountHistory: [2, 3],
        elementCountHistory: [5, 8],
      };
      expect(detectChallenge(state).mode).not.toBe('simplifier');
    });

    it('does not fire when already used', () => {
      const state = {
        ...baseState,
        conditionCountHistory: [1, 3],
        challengeModesUsed: ['simplifier'],
      };
      expect(detectChallenge(state).mode).not.toBe('simplifier');
    });
  });

  describe('contrarian trigger', () => {
    it('fires when NC grounded only in EVIDENCE (no RULE)', () => {
      const elements = mapOf(
        makeElement({ id: 'EVID-1', type: 'EVIDENCE' }),
        makeElement({
          id: 'NCON-1', type: 'NECESSARY_CONDITION',
          grounding: ['EVID-1'], collapse_test: 'x', reasoning_chain: 'y',
        }),
      );
      const state = { ...baseState, round: 3, elements };
      const result = detectChallenge(state);
      expect(result.mode).toBe('contrarian');
    });

    it('does not fire when NC has RULE in grounding', () => {
      const elements = mapOf(
        makeElement({ id: 'EVID-1', type: 'EVIDENCE' }),
        makeElement({ id: 'RULE-1', type: 'RULE', source: 'designer' }),
        makeElement({
          id: 'NCON-1', type: 'NECESSARY_CONDITION',
          grounding: ['EVID-1', 'RULE-1'], collapse_test: 'x', reasoning_chain: 'y',
        }),
      );
      const state = { ...baseState, round: 3, elements };
      expect(detectChallenge(state).mode).not.toBe('contrarian');
    });

    it('does not fire before round 2', () => {
      const elements = mapOf(
        makeElement({ id: 'EVID-1', type: 'EVIDENCE' }),
        makeElement({
          id: 'NCON-1', type: 'NECESSARY_CONDITION',
          grounding: ['EVID-1'], collapse_test: 'x', reasoning_chain: 'y',
        }),
      );
      const state = { ...baseState, round: 1, elements };
      expect(detectChallenge(state).mode).not.toBe('contrarian');
    });

    it('does not fire when already used', () => {
      const elements = mapOf(
        makeElement({ id: 'EVID-1', type: 'EVIDENCE' }),
        makeElement({
          id: 'NCON-1', type: 'NECESSARY_CONDITION',
          grounding: ['EVID-1'], collapse_test: 'x', reasoning_chain: 'y',
        }),
      );
      const state = { ...baseState, round: 3, elements, challengeModesUsed: ['contrarian'] };
      expect(detectChallenge(state).mode).not.toBe('contrarian');
    });
  });

  it('returns null mode when no challenges trigger', () => {
    expect(detectChallenge(baseState)).toEqual({ mode: null, reason: null });
  });
});

// =============================================================================
// checkClosure
// =============================================================================
describe('checkClosure', () => {
  function closableState() {
    const elements = mapOf(
      makeElement({ id: 'EVID-1', type: 'EVIDENCE' }),
      makeElement({ id: 'RULE-1', type: 'RULE', source: 'designer' }),
      makeElement({
        id: 'NCON-1', type: 'NECESSARY_CONDITION',
        grounding: ['EVID-1', 'RULE-1'],
        collapse_test: 'design collapses',
        reasoning_chain: 'IF x THEN y',
        rejected_alternatives: ['alt-a', 'alt-b'],
        revisedInRound: 3,
      }),
    );
    return { elements, round: 4, phaseTransitionRound: 1 };
  }

  it('permits closure when all conditions met', () => {
    const result = checkClosure(closableState());
    expect(result.permitted).toBe(true);
    expect(result.reasons).toEqual([]);
  });

  it('fails when conditions are ungrounded', () => {
    const state = closableState();
    state.elements.set('NCON-2', makeElement({
      id: 'NCON-2', type: 'NECESSARY_CONDITION',
      grounding: ['RISK-1'], collapse_test: 'x', reasoning_chain: 'y',
      rejected_alternatives: [],
    }));
    state.elements.set('RISK-1', makeElement({ id: 'RISK-1', type: 'RISK' }));
    const result = checkClosure(state);
    expect(result.permitted).toBe(false);
    expect(result.reasons).toContainEqual(expect.stringContaining('grounded'));
  });

  it('fails when conditions lack collapse tests', () => {
    const state = closableState();
    state.elements.get('NCON-1').collapse_test = null;
    const result = checkClosure(state);
    expect(result.permitted).toBe(false);
    expect(result.reasons).toContainEqual(expect.stringContaining('collapse test'));
  });

  it('fails when no condition has rejected alternatives', () => {
    const state = closableState();
    state.elements.get('NCON-1').rejected_alternatives = [];
    const result = checkClosure(state);
    expect(result.permitted).toBe(false);
    expect(result.reasons).toContainEqual(expect.stringContaining('alternatives'));
  });

  it('fails when no element revised after phase transition', () => {
    const state = closableState();
    state.elements.get('NCON-1').revisedInRound = null;
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

  it('fails when no conditions exist', () => {
    const state = {
      elements: mapOf(makeElement({ id: 'EVID-1', type: 'EVIDENCE' })),
      round: 4,
      phaseTransitionRound: 1,
    };
    const result = checkClosure(state);
    expect(result.permitted).toBe(false);
    expect(result.reasons).toContainEqual(expect.stringContaining('No active necessary conditions'));
  });

  it('collects all failing reasons at once', () => {
    const state = {
      elements: new Map(),
      round: 1,
      phaseTransitionRound: 0,
    };
    const result = checkClosure(state);
    expect(result.permitted).toBe(false);
    expect(result.reasons.length).toBeGreaterThanOrEqual(3);
  });
});
