import { describe, it, expect } from 'vitest';
import {
  computeCompleteness,
  computeGroundingCoverage,
  checkClosure,
  checkConcernCoverage,
  concernsRatificationGate,
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
    problem_anchor: null,
    ratification: null,
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
      resolve_condition_count: 0,
      ratified_rc_count: 0,
      revision_count: 0,
      friction_count: 0,
      live_friction_count: 0,
      definition_count: 0,
      ratified_definition_count: 0,
    });
  });

  it('returns definition_count and ratified_definition_count keys', () => {
    const result = computeCompleteness(new Map(), {
      definitions: [
        { id: 'DEFN-1', status: 'draft' },
        { id: 'DEFN-2', status: 'ratified' },
        { id: 'DEFN-3', status: 'ratified' },
      ],
    });
    expect(result.definition_count).toBe(3);
    expect(result.ratified_definition_count).toBe(2);
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
      makeElement({
        id: 'RCON-1', type: 'RESOLVE_CONDITION',
        statement: 'resolves',
        problem_anchor: 'CERN-1',
        ratification: { ratifiedAtRound: 1, text: 'ok' },
      }),
    );
    return {
      elements,
      round: 4,
      phaseTransitionRound: 1,
      concerns: [{ id: 'CERN-1', label: 'X', description: null }],
      closingArgPresentedRound: 4,
      closingArgGoRound: 4,
    };
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

// =============================================================================
// computeCompleteness — Resolve Conditions
// =============================================================================
describe('computeCompleteness — Resolve Conditions', () => {
  it('counts active RCs and ratified RCs', () => {
    const ratified = makeElement({
      id: 'RCON-1', type: 'RESOLVE_CONDITION', statement: 'X',
      problem_anchor: 'CERN-1',
      ratification: { ratifiedAtRound: 1, text: 'ok' },
    });
    const unratified = makeElement({
      id: 'RCON-2', type: 'RESOLVE_CONDITION', statement: 'Y',
      problem_anchor: 'CERN-1',
      ratification: null,
    });
    const withdrawn = makeElement({
      id: 'RCON-3', type: 'RESOLVE_CONDITION', statement: 'Z',
      problem_anchor: 'CERN-1',
      ratification: null,
      status: 'withdrawn',
    });
    const m = mapOf(ratified, unratified, withdrawn);
    const c = computeCompleteness(m);
    expect(c.resolve_condition_count).toBe(2);
    expect(c.ratified_rc_count).toBe(1);
  });
});

// =============================================================================
// checkConcernCoverage
// =============================================================================
describe('checkConcernCoverage', () => {
  function buildState({ concerns, elements }) {
    const map = new Map();
    for (const el of elements) map.set(el.id, el);
    return { concerns, elements: map };
  }

  it('marks Concern as covered when a ratified RC anchors to it', () => {
    const state = buildState({
      concerns: [{ id: 'CERN-1', label: 'Performance', description: null }],
      elements: [
        makeElement({
          id: 'RCON-1', type: 'RESOLVE_CONDITION', statement: 'fast',
          problem_anchor: 'CERN-1',
          ratification: { ratifiedAtRound: 1, text: 'ok' },
        }),
      ],
    });
    const cov = checkConcernCoverage(state);
    expect(cov.covered).toEqual(['CERN-1']);
    expect(cov.uncovered).toEqual([]);
  });

  it('does NOT mark covered when RC is unratified', () => {
    const state = buildState({
      concerns: [{ id: 'CERN-1', label: 'Performance', description: null }],
      elements: [
        makeElement({
          id: 'RCON-1', type: 'RESOLVE_CONDITION', statement: 'fast',
          problem_anchor: 'CERN-1',
          ratification: null,
        }),
      ],
    });
    expect(checkConcernCoverage(state).uncovered).toEqual(['CERN-1']);
  });

  it('marks Concern as covered via Rule mentioning the Concern ID', () => {
    const state = buildState({
      concerns: [{ id: 'CERN-1', label: 'Performance', description: null }],
      elements: [
        makeElement({
          id: 'RULE-1', type: 'RULE',
          statement: 'Avoid CERN-1 mitigation paths',
          source: 'designer',
        }),
      ],
    });
    expect(checkConcernCoverage(state).covered).toEqual(['CERN-1']);
  });

  it('marks Concern as covered via Rule mentioning the Concern label (case-insensitive)', () => {
    const state = buildState({
      concerns: [{ id: 'CERN-1', label: 'Performance', description: null }],
      elements: [
        makeElement({
          id: 'RULE-1', type: 'RULE',
          statement: 'preserve performance baseline',
          source: 'designer',
        }),
      ],
    });
    expect(checkConcernCoverage(state).covered).toEqual(['CERN-1']);
  });

  it('returns uncovered Concern when no RC and no Rule covers it', () => {
    const state = buildState({
      concerns: [
        { id: 'CERN-1', label: 'Performance', description: null },
        { id: 'CERN-2', label: 'Auditability', description: null },
      ],
      elements: [
        makeElement({
          id: 'RCON-1', type: 'RESOLVE_CONDITION', statement: 'fast',
          problem_anchor: 'CERN-1',
          ratification: { ratifiedAtRound: 1, text: 'ok' },
        }),
      ],
    });
    expect(checkConcernCoverage(state).uncovered).toEqual(['CERN-2']);
  });
});

// =============================================================================
// checkClosure — Concerns and Resolve Conditions (conditions 7-10)
// =============================================================================
describe('checkClosure — Concerns and Resolve Conditions (conditions 7-10)', () => {
  function baseClosureState() {
    const evidence = makeElement({ id: 'EVID-1', type: 'EVIDENCE', statement: 'fact', source: 'codebase' });
    const nc = makeElement({
      id: 'NCON-1', type: 'NECESSARY_CONDITION', statement: 'NC',
      grounding: ['EVID-1'], collapse_test: 'breaks', reasoning_chain: 'IF...THEN',
      rejected_alternatives: ['alt'], revisedInRound: 2,
    });
    return {
      round: 3, phaseTransitionRound: 1,
      elements: mapOf(evidence, nc),
      concerns: [],
    };
  }

  it('condition 7: refuses closure when Concerns list is empty', () => {
    const state = baseClosureState();
    const c = checkClosure(state);
    expect(c.permitted).toBe(false);
    expect(c.reasons).toContain('No Concerns enumerated — at least one Concern required before closure');
  });

  it('condition 8: refuses closure when an RC is unratified', () => {
    const state = baseClosureState();
    state.concerns = [{ id: 'CERN-1', label: 'X', description: null }];
    const rc = makeElement({
      id: 'RCON-1', type: 'RESOLVE_CONDITION', statement: 'r',
      problem_anchor: 'CERN-1', ratification: null,
    });
    state.elements.set('RCON-1', rc);
    const c = checkClosure(state);
    expect(c.reasons.some(r => /Unratified Resolve Conditions/.test(r))).toBe(true);
  });

  it('condition 9: lists each uncovered Concern', () => {
    const state = baseClosureState();
    state.concerns = [
      { id: 'CERN-1', label: 'X', description: null },
      { id: 'CERN-2', label: 'Y', description: null },
    ];
    const rc = makeElement({
      id: 'RCON-1', type: 'RESOLVE_CONDITION', statement: 'r',
      problem_anchor: 'CERN-1',
      ratification: { ratifiedAtRound: 1, text: 'ok' },
    });
    state.elements.set('RCON-1', rc);
    const c = checkClosure(state);
    expect(c.reasons.some(r => /CERN-2/.test(r))).toBe(true);
    expect(c.reasons.some(r => /CERN-1/.test(r))).toBe(false);
  });

  it('permits closure when all conditions pass', () => {
    const state = baseClosureState();
    state.concerns = [{ id: 'CERN-1', label: 'X', description: null }];
    state.closingArgPresentedRound = state.round;
    state.closingArgGoRound = state.round;
    const rc = makeElement({
      id: 'RCON-1', type: 'RESOLVE_CONDITION', statement: 'r',
      problem_anchor: 'CERN-1',
      ratification: { ratifiedAtRound: 1, text: 'ok' },
    });
    state.elements.set('RCON-1', rc);
    const c = checkClosure(state);
    expect(c.permitted).toBe(true);
    expect(c.reasons).toEqual([]);
  });
});

// =============================================================================
// concernsRatificationGate (NC-9) — pure gate used by present_closing_argument
// =============================================================================
describe('concernsRatificationGate (lock retired AC-2.2)', () => {
  it('returns CONCERNS_UNRATIFIED when any Concern is draft', () => {
    const s = {
      concerns: [
        { id: 'CERN-1', status: 'ratified' },
        { id: 'CERN-2', status: 'draft' },
      ],
    };
    const r = concernsRatificationGate(s);
    expect(r.passed).toBe(false);
    expect(r.code).toBe('CONCERNS_UNRATIFIED');
    expect(r.message).toMatch(/1 draft/);
  });

  it('returns passed: true when all ratified', () => {
    const s = { concerns: [{ id: 'CERN-1', status: 'ratified' }] };
    expect(concernsRatificationGate(s).passed).toBe(true);
  });

  it('passes when concerns array is empty (gate is structural)', () => {
    const s = { concerns: [] };
    expect(concernsRatificationGate(s).passed).toBe(true);
  });

  it('counts multiple draft Concerns in the message', () => {
    const s = {
      concerns: [
        { id: 'CERN-1', status: 'draft' },
        { id: 'CERN-2', status: 'draft' },
        { id: 'CERN-3', status: 'ratified' },
      ],
    };
    const r = concernsRatificationGate(s);
    expect(r.code).toBe('CONCERNS_UNRATIFIED');
    expect(r.message).toMatch(/2 draft/);
  });
});
