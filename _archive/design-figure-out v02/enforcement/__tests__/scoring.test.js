import { describe, it, expect } from 'vitest';
import {
  computeCompositeAmbiguity,
  validateScoreSubmission,
  computeStagePriority,
  detectStall,
  detectChallengeTrigger,
  checkClosure,
} from '../scoring.js';

// ── 2a: Composite Ambiguity Formula ────────────────────────────────

describe('computeCompositeAmbiguity', () => {
  it('returns 1.0 when all scores are 0', () => {
    const scores = { intent: 0, outcome: 0, scope: 0, constraints: 0, success: 0 };
    expect(computeCompositeAmbiguity(scores, 'greenfield')).toBe(1.0);
  });

  it('returns 0.0 when all scores are 1.0', () => {
    const scores = { intent: 1, outcome: 1, scope: 1, constraints: 1, success: 1 };
    expect(computeCompositeAmbiguity(scores, 'greenfield')).toBe(0.0);
  });

  it('computes greenfield formula: 1 - (intent×0.30 + outcome×0.25 + scope×0.20 + constraints×0.15 + success×0.10)', () => {
    const scores = { intent: 0.8, outcome: 0.6, scope: 0.4, constraints: 0.2, success: 0.1 };
    // 1 - (0.8*0.30 + 0.6*0.25 + 0.4*0.20 + 0.2*0.15 + 0.1*0.10)
    // 1 - (0.24 + 0.15 + 0.08 + 0.03 + 0.01) = 1 - 0.51 = 0.49
    expect(computeCompositeAmbiguity(scores, 'greenfield')).toBe(0.49);
  });

  it('computes brownfield formula: 1 - (intent×0.25 + outcome×0.20 + scope×0.20 + constraints×0.15 + success×0.10 + context×0.10)', () => {
    const scores = { intent: 0.8, outcome: 0.6, scope: 0.4, constraints: 0.2, success: 0.1, context: 0.5 };
    // 1 - (0.8*0.25 + 0.6*0.20 + 0.4*0.20 + 0.2*0.15 + 0.1*0.10 + 0.5*0.10)
    // 1 - (0.20 + 0.12 + 0.08 + 0.03 + 0.01 + 0.05) = 1 - 0.49 = 0.51
    expect(computeCompositeAmbiguity(scores, 'brownfield')).toBe(0.51);
  });

  it('ignores context dimension for greenfield', () => {
    const scores = { intent: 0.5, outcome: 0.5, scope: 0.5, constraints: 0.5, success: 0.5, context: 1.0 };
    const withoutContext = { intent: 0.5, outcome: 0.5, scope: 0.5, constraints: 0.5, success: 0.5 };
    expect(computeCompositeAmbiguity(scores, 'greenfield'))
      .toBe(computeCompositeAmbiguity(withoutContext, 'greenfield'));
  });
});

// ── 2b: Input Validation ───────────────────────────────────────────

describe('validateScoreSubmission', () => {
  const validScores = [
    { dimension: 'intent', score: 0.5, justification: 'Some reasoning', gap: 'Need more info' },
  ];

  it('accepts valid scores', () => {
    const result = validateScoreSubmission(validScores, null);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects empty justification', () => {
    const scores = [
      { dimension: 'intent', score: 0.5, justification: '', gap: 'Need more info' },
    ];
    const result = validateScoreSubmission(scores, null);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toMatch(/justification/i);
  });

  it('rejects empty gap when score < 0.9', () => {
    const scores = [
      { dimension: 'intent', score: 0.5, justification: 'Valid reason', gap: '' },
    ];
    const result = validateScoreSubmission(scores, null);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toMatch(/gap/i);
  });

  it('allows empty gap when score >= 0.9', () => {
    const scores = [
      { dimension: 'intent', score: 0.9, justification: 'Clear intent', gap: '' },
    ];
    const result = validateScoreSubmission(scores, null);
    expect(result.valid).toBe(true);
  });

  it('flags score jump > 0.3 as warning (not error)', () => {
    const scores = [
      { dimension: 'intent', score: 0.8, justification: 'Improved', gap: 'Minor gap' },
    ];
    const previous = { intent: 0.4 };
    const result = validateScoreSubmission(scores, previous);
    expect(result.valid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toMatch(/0\.4/);
    expect(result.warnings[0]).toMatch(/0\.8/);
  });

  it('does not flag score jump <= 0.3', () => {
    const scores = [
      { dimension: 'intent', score: 0.7, justification: 'Improved', gap: 'Minor gap' },
    ];
    const previous = { intent: 0.4 };
    const result = validateScoreSubmission(scores, previous);
    expect(result.warnings).toHaveLength(0);
  });
});

// ── 2c: Stage Priority ────────────────────────────────────────────

describe('computeStagePriority', () => {
  it('returns intent-first stage when intent/outcome/scope are weak', () => {
    const scores = {
      intent: { score: 0.3 },
      outcome: { score: 0.4 },
      scope: { score: 0.2 },
      constraints: { score: 0.8 },
      success: { score: 0.9 },
    };
    const result = computeStagePriority(scores, 'greenfield');
    expect(result.stage).toBe('intent-first');
    expect(result.weakest.name).toBe('scope');
    expect(result.weakest.score).toBe(0.2);
  });

  it('moves to feasibility when intent-first dimensions are strong (>= 0.7)', () => {
    const scores = {
      intent: { score: 0.8 },
      outcome: { score: 0.7 },
      scope: { score: 0.9 },
      constraints: { score: 0.3 },
      success: { score: 0.4 },
    };
    const result = computeStagePriority(scores, 'greenfield');
    expect(result.stage).toBe('feasibility');
    expect(result.weakest.name).toBe('constraints');
    expect(result.weakest.score).toBe(0.3);
  });

  it('moves to brownfield-grounding for brownfield when earlier stages strong', () => {
    const scores = {
      intent: { score: 0.8 },
      outcome: { score: 0.9 },
      scope: { score: 0.7 },
      constraints: { score: 0.8 },
      success: { score: 0.7 },
      context: { score: 0.3 },
    };
    const result = computeStagePriority(scores, 'brownfield');
    expect(result.stage).toBe('brownfield-grounding');
    expect(result.weakest.name).toBe('context');
    expect(result.weakest.score).toBe(0.3);
  });

  it('skips brownfield-grounding for greenfield', () => {
    const scores = {
      intent: { score: 0.8 },
      outcome: { score: 0.9 },
      scope: { score: 0.7 },
      constraints: { score: 0.8 },
      success: { score: 0.7 },
    };
    const result = computeStagePriority(scores, 'greenfield');
    // All stages satisfied — should not return brownfield-grounding
    expect(result.stage).not.toBe('brownfield-grounding');
  });
});

// ── 2d: Challenge Triggers and Stall Detection ────────────────────

describe('detectStall', () => {
  it('returns false with fewer than 3 rounds of history', () => {
    expect(detectStall([0.5, 0.48])).toBe(false);
  });

  it('returns false when ambiguity is changing', () => {
    expect(detectStall([0.8, 0.6, 0.4])).toBe(false);
  });

  it('returns true when ambiguity stalls (< ±0.05 change) for 3 consecutive rounds', () => {
    expect(detectStall([0.5, 0.52, 0.51, 0.50])).toBe(true);
  });

  it('returns false when stall breaks', () => {
    // stall at 0.50-0.52 then breaks with 0.3
    expect(detectStall([0.5, 0.52, 0.51, 0.3])).toBe(false);
  });
});

describe('detectChallengeTrigger', () => {
  it('returns none when no trigger conditions met (round 1)', () => {
    const state = {
      round: 1,
      ambiguityHistory: [0.8],
      scores: { scope: { score: 0.3 }, outcome: { score: 0.3 } },
      previousScores: null,
      challengeModesUsed: [],
    };
    const result = detectChallengeTrigger(state);
    expect(result.mode).toBeNull();
  });

  it('triggers contrarian at round 2+', () => {
    const state = {
      round: 2,
      ambiguityHistory: [0.8, 0.7],
      scores: { scope: { score: 0.3 }, outcome: { score: 0.3 } },
      previousScores: { scope: { score: 0.2 }, outcome: { score: 0.2 } },
      challengeModesUsed: [],
    };
    const result = detectChallengeTrigger(state);
    expect(result.mode).toBe('contrarian');
    expect(result.reason).toBeTruthy();
  });

  it('does not re-trigger used challenge mode', () => {
    const state = {
      round: 2,
      ambiguityHistory: [0.8, 0.7],
      scores: { scope: { score: 0.3 }, outcome: { score: 0.3 } },
      previousScores: { scope: { score: 0.2 }, outcome: { score: 0.2 } },
      challengeModesUsed: ['contrarian'],
    };
    const result = detectChallengeTrigger(state);
    expect(result.mode).not.toBe('contrarian');
  });

  it('triggers simplifier when scope grows faster than outcome', () => {
    const state = {
      round: 3,
      ambiguityHistory: [0.8, 0.7, 0.6],
      scores: { scope: { score: 0.6 }, outcome: { score: 0.3 } },
      previousScores: { scope: { score: 0.3 }, outcome: { score: 0.2 } },
      challengeModesUsed: ['contrarian'],
    };
    // scopeGrowth = 0.6 - 0.3 = 0.3 > 0.2 AND 0.3 > (0.3 - 0.2) * 2 = 0.2 ✓
    const result = detectChallengeTrigger(state);
    expect(result.mode).toBe('simplifier');
    expect(result.reason).toBeTruthy();
  });

  it('triggers ontologist on stall', () => {
    const state = {
      round: 5,
      ambiguityHistory: [0.8, 0.7, 0.53, 0.52, 0.51, 0.50],
      scores: { scope: { score: 0.5 }, outcome: { score: 0.5 } },
      previousScores: { scope: { score: 0.5 }, outcome: { score: 0.5 } },
      challengeModesUsed: ['contrarian', 'simplifier'],
    };
    const result = detectChallengeTrigger(state);
    expect(result.mode).toBe('ontologist');
    expect(result.reason).toBeTruthy();
  });
});

// ── 2e: Closure Check ─────────────────────────────────────────────

describe('checkClosure', () => {
  it('permits closure when all conditions met', () => {
    const state = {
      ambiguity: 0.15,
      gates: { allDimensionsScored: true, noOpenGaps: true },
      pressurePassComplete: true,
    };
    const result = checkClosure(state);
    expect(result.permitted).toBe(true);
    expect(result.reasons).toHaveLength(0);
  });

  it('blocks closure when ambiguity above threshold', () => {
    const state = {
      ambiguity: 0.25,
      gates: { allDimensionsScored: true, noOpenGaps: true },
      pressurePassComplete: true,
    };
    const result = checkClosure(state);
    expect(result.permitted).toBe(false);
    expect(result.reasons.length).toBeGreaterThan(0);
    expect(result.reasons[0]).toMatch(/ambiguity/i);
  });

  it('blocks closure when gates unsatisfied', () => {
    const state = {
      ambiguity: 0.15,
      gates: { allDimensionsScored: false, noOpenGaps: true },
      pressurePassComplete: true,
    };
    const result = checkClosure(state);
    expect(result.permitted).toBe(false);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it('blocks closure when pressure pass incomplete', () => {
    const state = {
      ambiguity: 0.15,
      gates: { allDimensionsScored: true, noOpenGaps: true },
      pressurePassComplete: false,
    };
    const result = checkClosure(state);
    expect(result.permitted).toBe(false);
    expect(result.reasons.length).toBeGreaterThan(0);
    expect(result.reasons[0]).toMatch(/pressure/i);
  });
});
