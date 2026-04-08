import { describe, it, expect } from 'vitest';
import {
  validateUnderstandingSubmission,
  computeGroupSaturation,
  computeOverallSaturation,
  findWeakestDimension,
  collectGaps,
  checkTransitionReady,
} from '../scoring.js';

// ── Input Validation ─────────────────────────────────────────────

describe('validateUnderstandingSubmission', () => {
  const validScores = [
    { dimension: 'surface_coverage', score: 0.5, justification: 'Explored main modules', gap: 'Haven\'t checked edge services' },
  ];

  it('accepts valid scores', () => {
    const result = validateUnderstandingSubmission(validScores, null);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects empty justification', () => {
    const scores = [
      { dimension: 'surface_coverage', score: 0.5, justification: '', gap: 'Some gap' },
    ];
    const result = validateUnderstandingSubmission(scores, null);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/justification/i);
  });

  it('rejects empty gap when score < 0.9', () => {
    const scores = [
      { dimension: 'surface_coverage', score: 0.5, justification: 'Valid reason', gap: '' },
    ];
    const result = validateUnderstandingSubmission(scores, null);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/gap/i);
  });

  it('allows empty gap when score >= 0.9', () => {
    const scores = [
      { dimension: 'surface_coverage', score: 0.9, justification: 'Fully explored', gap: '' },
    ];
    const result = validateUnderstandingSubmission(scores, null);
    expect(result.valid).toBe(true);
  });

  it('flags score jump > 0.3 as warning', () => {
    const scores = [
      { dimension: 'surface_coverage', score: 0.8, justification: 'Improved', gap: 'Minor gap' },
    ];
    const previous = { surface_coverage: 0.4 };
    const result = validateUnderstandingSubmission(scores, previous);
    expect(result.valid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toMatch(/0\.4/);
    expect(result.warnings[0]).toMatch(/0\.8/);
  });

  it('does not flag score jump <= 0.3', () => {
    const scores = [
      { dimension: 'surface_coverage', score: 0.7, justification: 'Improved', gap: 'Minor gap' },
    ];
    const previous = { surface_coverage: 0.4 };
    const result = validateUnderstandingSubmission(scores, previous);
    expect(result.warnings).toHaveLength(0);
  });
});

// ── Group Saturation ─────────────────────────────────────────────

describe('computeGroupSaturation', () => {
  it('computes landscape average from four dimensions', () => {
    const scores = {
      surface_coverage: { score: 0.8 },
      relationship_mapping: { score: 0.6 },
      constraint_discovery: { score: 0.4 },
      risk_topology: { score: 0.2 },
      stakeholder_impact: { score: 0 },
      prior_art: { score: 0 },
      temporal_context: { score: 0 },
      problem_boundary: { score: 0 },
      assumption_inventory: { score: 0 },
    };
    const result = computeGroupSaturation(scores);
    // (0.8 + 0.6 + 0.4 + 0.2) / 4 = 0.5
    expect(result.landscape).toBe(0.5);
    expect(result.human_context).toBe(0);
    expect(result.foundations).toBe(0);
  });

  it('computes human_context average from two dimensions', () => {
    const scores = {
      surface_coverage: { score: 0 },
      relationship_mapping: { score: 0 },
      constraint_discovery: { score: 0 },
      risk_topology: { score: 0 },
      stakeholder_impact: { score: 0.6 },
      prior_art: { score: 0.4 },
      temporal_context: { score: 0 },
      problem_boundary: { score: 0 },
      assumption_inventory: { score: 0 },
    };
    const result = computeGroupSaturation(scores);
    expect(result.human_context).toBe(0.5);
  });

  it('computes foundations average from three dimensions', () => {
    const scores = {
      surface_coverage: { score: 0 },
      relationship_mapping: { score: 0 },
      constraint_discovery: { score: 0 },
      risk_topology: { score: 0 },
      stakeholder_impact: { score: 0 },
      prior_art: { score: 0 },
      temporal_context: { score: 0.9 },
      problem_boundary: { score: 0.6 },
      assumption_inventory: { score: 0.3 },
    };
    const result = computeGroupSaturation(scores);
    // (0.9 + 0.6 + 0.3) / 3 = 0.6
    expect(result.foundations).toBe(0.6);
  });
});

// ── Overall Saturation ───────────────────────────────────────────

describe('computeOverallSaturation', () => {
  it('computes weighted average: landscape 0.40, human_context 0.30, foundations 0.30', () => {
    const groups = { landscape: 0.8, human_context: 0.6, foundations: 0.4 };
    // 0.8*0.40 + 0.6*0.30 + 0.4*0.30 = 0.32 + 0.18 + 0.12 = 0.62
    expect(computeOverallSaturation(groups)).toBe(0.62);
  });

  it('returns 0 when all groups are 0', () => {
    const groups = { landscape: 0, human_context: 0, foundations: 0 };
    expect(computeOverallSaturation(groups)).toBe(0);
  });

  it('returns weighted 1.0 when all groups are 1.0', () => {
    const groups = { landscape: 1, human_context: 1, foundations: 1 };
    expect(computeOverallSaturation(groups)).toBe(1);
  });
});

// ── Weakest Dimension ────────────────────────────────────────────

describe('findWeakestDimension', () => {
  it('returns weakest dimension in least-saturated group', () => {
    const scores = {
      surface_coverage: { score: 0.8 },
      relationship_mapping: { score: 0.7 },
      constraint_discovery: { score: 0.6 },
      risk_topology: { score: 0.5 },
      stakeholder_impact: { score: 0.2 },
      prior_art: { score: 0.1 },
      temporal_context: { score: 0.4 },
      problem_boundary: { score: 0.5 },
      assumption_inventory: { score: 0.3 },
    };
    const groups = { landscape: 0.65, human_context: 0.15, foundations: 0.4 };
    const result = findWeakestDimension(scores, groups);
    expect(result.group).toBe('human_context');
    expect(result.dimension.name).toBe('prior_art');
    expect(result.dimension.score).toBe(0.1);
  });

  it('picks lowest score when multiple dimensions tie for weakest group', () => {
    const scores = {
      surface_coverage: { score: 0.9 },
      relationship_mapping: { score: 0.9 },
      constraint_discovery: { score: 0.9 },
      risk_topology: { score: 0.9 },
      stakeholder_impact: { score: 0.3 },
      prior_art: { score: 0.5 },
      temporal_context: { score: 0.3 },
      problem_boundary: { score: 0.3 },
      assumption_inventory: { score: 0.3 },
    };
    const groups = { landscape: 0.9, human_context: 0.4, foundations: 0.3 };
    const result = findWeakestDimension(scores, groups);
    expect(result.group).toBe('foundations');
  });
});

// ── Gaps Summary ─────────────────────────────────────────────────

describe('collectGaps', () => {
  it('collects gaps from dimensions with score < 0.9', () => {
    const scores = {
      surface_coverage: { score: 0.5, gap: 'Haven\'t explored services' },
      stakeholder_impact: { score: 0.1, gap: 'Don\'t know who is affected' },
      prior_art: { score: 0.9, gap: '' },
    };
    const gaps = collectGaps(scores);
    expect(gaps).toHaveLength(2);
    expect(gaps[0].dimension).toBe('stakeholder_impact');
    expect(gaps[1].dimension).toBe('surface_coverage');
  });

  it('returns empty array when no gaps', () => {
    const scores = {
      surface_coverage: { score: 0.95, gap: '' },
    };
    const gaps = collectGaps(scores);
    expect(gaps).toHaveLength(0);
  });

  it('sorts by score ascending (most urgent first)', () => {
    const scores = {
      surface_coverage: { score: 0.5, gap: 'Gap A' },
      stakeholder_impact: { score: 0.1, gap: 'Gap B' },
      prior_art: { score: 0.3, gap: 'Gap C' },
    };
    const gaps = collectGaps(scores);
    expect(gaps[0].score).toBe(0.1);
    expect(gaps[1].score).toBe(0.3);
    expect(gaps[2].score).toBe(0.5);
  });
});

// ── Transition Readiness ─────────────────────────────────────────

describe('checkTransitionReady', () => {
  const fullScores = {
    surface_coverage: { score: 0.8 },
    relationship_mapping: { score: 0.7 },
    constraint_discovery: { score: 0.7 },
    risk_topology: { score: 0.6 },
    stakeholder_impact: { score: 0.7 },
    prior_art: { score: 0.6 },
    temporal_context: { score: 0.7 },
    problem_boundary: { score: 0.6 },
    assumption_inventory: { score: 0.6 },
  };

  it('reports ready when all conditions met', () => {
    const state = { round: 4, scores: fullScores };
    const result = checkTransitionReady(state);
    expect(result.ready).toBe(true);
    expect(result.reasons).toHaveLength(0);
  });

  it('blocks when overall saturation below 0.65', () => {
    const lowScores = {
      surface_coverage: { score: 0.3 },
      relationship_mapping: { score: 0.3 },
      constraint_discovery: { score: 0.3 },
      risk_topology: { score: 0.3 },
      stakeholder_impact: { score: 0.3 },
      prior_art: { score: 0.3 },
      temporal_context: { score: 0.3 },
      problem_boundary: { score: 0.3 },
      assumption_inventory: { score: 0.3 },
    };
    const state = { round: 4, scores: lowScores };
    const result = checkTransitionReady(state);
    expect(result.ready).toBe(false);
    expect(result.reasons.some(r => r.includes('Overall saturation'))).toBe(true);
  });

  it('blocks when any group below 0.50', () => {
    const unevenScores = {
      ...fullScores,
      stakeholder_impact: { score: 0.1 },
      prior_art: { score: 0.1 },
    };
    const state = { round: 4, scores: unevenScores };
    const result = checkTransitionReady(state);
    expect(result.ready).toBe(false);
    expect(result.reasons.some(r => r.includes('human_context'))).toBe(true);
  });

  it('blocks when fewer than 3 rounds', () => {
    const state = { round: 2, scores: fullScores };
    const result = checkTransitionReady(state);
    expect(result.ready).toBe(false);
    expect(result.reasons.some(r => r.includes('rounds'))).toBe(true);
  });

  it('reports multiple reasons when multiple conditions unmet', () => {
    const lowScores = {
      surface_coverage: { score: 0.2 },
      relationship_mapping: { score: 0.2 },
      constraint_discovery: { score: 0.2 },
      risk_topology: { score: 0.2 },
      stakeholder_impact: { score: 0.1 },
      prior_art: { score: 0.1 },
      temporal_context: { score: 0.1 },
      problem_boundary: { score: 0.1 },
      assumption_inventory: { score: 0.1 },
    };
    const state = { round: 1, scores: lowScores };
    const result = checkTransitionReady(state);
    expect(result.ready).toBe(false);
    expect(result.reasons.length).toBeGreaterThan(1);
  });
});
