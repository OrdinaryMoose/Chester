import { describe, it, expect } from 'vitest';
import { initializeState, updateState } from '../state.js';

// ── Initialize ───────────────────────────────────────────────────

describe('initializeState', () => {
  it('creates state with nine dimensions at score 0', () => {
    const state = initializeState('brownfield', 'Fix the cache staleness issue');
    expect(Object.keys(state.scores)).toHaveLength(9);
    for (const entry of Object.values(state.scores)) {
      expect(entry.score).toBe(0);
    }
  });

  it('sets context type and user prompt', () => {
    const state = initializeState('greenfield', 'Build a new auth system');
    expect(state.contextType).toBe('greenfield');
    expect(state.userPrompt).toBe('Build a new auth system');
  });

  it('starts at round 0 with empty histories', () => {
    const state = initializeState('brownfield', 'test');
    expect(state.round).toBe(0);
    expect(state.scoreHistory).toHaveLength(0);
    expect(state.saturationHistory).toHaveLength(0);
  });

  it('includes all expected dimension names', () => {
    const state = initializeState('brownfield', 'test');
    const dims = Object.keys(state.scores);
    expect(dims).toContain('surface_coverage');
    expect(dims).toContain('relationship_mapping');
    expect(dims).toContain('constraint_discovery');
    expect(dims).toContain('risk_topology');
    expect(dims).toContain('stakeholder_impact');
    expect(dims).toContain('prior_art');
    expect(dims).toContain('temporal_context');
    expect(dims).toContain('problem_boundary');
    expect(dims).toContain('assumption_inventory');
  });
});

// ── Update ───────────────────────────────────────────────────────

describe('updateState', () => {
  it('increments round', () => {
    const state = initializeState('brownfield', 'test');
    const updated = updateState(state, {
      surface_coverage: { score: 0.4, justification: 'Explored core', gap: 'Need edge services' },
    });
    expect(updated.round).toBe(1);
  });

  it('does not mutate original state', () => {
    const state = initializeState('brownfield', 'test');
    const updated = updateState(state, {
      surface_coverage: { score: 0.5, justification: 'test', gap: 'test' },
    });
    expect(state.round).toBe(0);
    expect(state.scores.surface_coverage.score).toBe(0);
    expect(updated.round).toBe(1);
    expect(updated.scores.surface_coverage.score).toBe(0.5);
  });

  it('computes group saturation after update', () => {
    const state = initializeState('brownfield', 'test');
    const updated = updateState(state, {
      surface_coverage: { score: 0.8, justification: 'j', gap: 'g' },
      relationship_mapping: { score: 0.6, justification: 'j', gap: 'g' },
      constraint_discovery: { score: 0.4, justification: 'j', gap: 'g' },
      risk_topology: { score: 0.2, justification: 'j', gap: 'g' },
    });
    // (0.8 + 0.6 + 0.4 + 0.2) / 4 = 0.5
    expect(updated.groupSaturation.landscape).toBe(0.5);
  });

  it('computes overall saturation after update', () => {
    const state = initializeState('brownfield', 'test');
    const updated = updateState(state, {
      surface_coverage: { score: 0.8, justification: 'j', gap: 'g' },
      relationship_mapping: { score: 0.8, justification: 'j', gap: 'g' },
      constraint_discovery: { score: 0.8, justification: 'j', gap: 'g' },
      risk_topology: { score: 0.8, justification: 'j', gap: 'g' },
      stakeholder_impact: { score: 0.6, justification: 'j', gap: 'g' },
      prior_art: { score: 0.6, justification: 'j', gap: 'g' },
      temporal_context: { score: 0.4, justification: 'j', gap: 'g' },
      problem_boundary: { score: 0.4, justification: 'j', gap: 'g' },
      assumption_inventory: { score: 0.4, justification: 'j', gap: 'g' },
    });
    // landscape: 0.8, human_context: 0.6, foundations: 0.4
    // 0.8*0.4 + 0.6*0.3 + 0.4*0.3 = 0.32 + 0.18 + 0.12 = 0.62
    expect(updated.overallSaturation).toBe(0.62);
  });

  it('records saturation history', () => {
    let state = initializeState('brownfield', 'test');
    state = updateState(state, {
      surface_coverage: { score: 0.3, justification: 'j', gap: 'g' },
    });
    state = updateState(state, {
      surface_coverage: { score: 0.5, justification: 'j', gap: 'g' },
    });
    expect(state.saturationHistory).toHaveLength(2);
    expect(state.saturationHistory[1]).toBeGreaterThan(state.saturationHistory[0]);
  });

  it('identifies weakest dimension', () => {
    const state = initializeState('brownfield', 'test');
    const updated = updateState(state, {
      surface_coverage: { score: 0.8, justification: 'j', gap: 'g' },
      relationship_mapping: { score: 0.7, justification: 'j', gap: 'g' },
      constraint_discovery: { score: 0.7, justification: 'j', gap: 'g' },
      risk_topology: { score: 0.6, justification: 'j', gap: 'g' },
      stakeholder_impact: { score: 0.1, justification: 'j', gap: 'g' },
      prior_art: { score: 0.2, justification: 'j', gap: 'g' },
      temporal_context: { score: 0.5, justification: 'j', gap: 'g' },
      problem_boundary: { score: 0.5, justification: 'j', gap: 'g' },
      assumption_inventory: { score: 0.5, justification: 'j', gap: 'g' },
    });
    // human_context (0.15) < foundations (0.5) < landscape (0.7)
    expect(updated.weakest.group).toBe('human_context');
    expect(updated.weakest.dimension.name).toBe('stakeholder_impact');
  });

  it('checks transition readiness', () => {
    let state = initializeState('brownfield', 'test');
    // Round 1 — too few rounds
    state = updateState(state, {
      surface_coverage: { score: 0.8, justification: 'j', gap: '' },
    });
    expect(state.transition.ready).toBe(false);
  });
});
