// Unit tests for the architectural-tenets scoring engine.
// Pure-function tests — no MCP server, no I/O.

import { describe, it, expect } from 'vitest';
import {
  TENETS,
  PROBLEM_TYPES,
  WEIGHT_PROFILES,
  EVENT_MULTIPLIERS,
  TENET_FLOOR,
  validateEntry,
  validateRoundSubmission,
  resolveEntryMultiplier,
  resolvePredictionMultiplier,
  computeTenetScore,
  computeOverallScore,
  findWeakestTenet,
  computePredictionCalibration,
  checkTransitionReady,
  currentHitRateFloor,
  detectSuspiciousPatterns,
} from '../scoring.js';

describe('Tenet definitions', () => {
  it('has exactly six tenets', () => {
    expect(TENETS).toHaveLength(6);
  });

  it('every problem type has weights summing to ~1.0', () => {
    for (const type of PROBLEM_TYPES) {
      const profile = WEIGHT_PROFILES[type];
      const sum = TENETS.reduce((acc, t) => acc + profile[t], 0);
      expect(sum).toBeCloseTo(1.0, 5);
    }
  });

  it('every problem type weights every tenet', () => {
    for (const type of PROBLEM_TYPES) {
      for (const tenet of TENETS) {
        expect(WEIGHT_PROFILES[type][tenet]).toBeGreaterThan(0);
      }
    }
  });
});

describe('Event multipliers', () => {
  it('REVISE pays 1.4x', () => {
    expect(EVENT_MULTIPLIERS.REVISE).toBe(1.4);
  });

  it('CONTRADICT pays 1.6x', () => {
    expect(EVENT_MULTIPLIERS.CONTRADICT).toBe(1.6);
  });

  it('CONFIRM and EXTEND pay base rate', () => {
    expect(EVENT_MULTIPLIERS.CONFIRM).toBe(1.0);
    expect(EVENT_MULTIPLIERS.EXTEND).toBe(1.0);
  });

  it('density cap downgrades REVISE to 1.0x', () => {
    const entry = { event_type: 'REVISE' };
    expect(resolveEntryMultiplier(entry, false)).toBe(1.4);
    expect(resolveEntryMultiplier(entry, true)).toBe(1.0);
  });
});

describe('Prediction multipliers', () => {
  it('HIT at low confidence pays 1.5x', () => {
    const m = resolvePredictionMultiplier({ confidence: 0.5 }, { outcome: 'HIT' });
    expect(m).toBe(1.5);
  });

  it('HIT at high confidence pays 0.7x (penalized)', () => {
    const m = resolvePredictionMultiplier({ confidence: 0.9 }, { outcome: 'HIT' });
    expect(m).toBe(0.7);
  });

  it('MISS with model_update pays 1.5x', () => {
    const m = resolvePredictionMultiplier({ confidence: 0.7 }, { outcome: 'MISS', model_update: 'will revise X' });
    expect(m).toBe(1.5);
  });

  it('MISS without update pays 0.5x', () => {
    const m = resolvePredictionMultiplier({ confidence: 0.7 }, { outcome: 'MISS' });
    expect(m).toBe(0.5);
  });
});

describe('Entry validation', () => {
  it('rejects entry without event_type', () => {
    const errors = validateEntry({ system_id: 'x', disposition: 'KILL' }, 'existing_system_disposition');
    expect(errors.some(e => e.includes('event_type'))).toBe(true);
  });

  it('rejects REVISE without revises_element_id', () => {
    const errors = validateEntry({ event_type: 'REVISE' }, 'reach_profile');
    expect(errors.some(e => e.includes('revises_element_id'))).toBe(true);
  });

  it('rejects KILL disposition without sunset rationale', () => {
    const errors = validateEntry(
      { event_type: 'CONFIRM', system_id: 'old_module', disposition: 'KILL' },
      'existing_system_disposition'
    );
    expect(errors.some(e => e.includes('replacement_path or sunset_rationale'))).toBe(true);
  });

  it('accepts KILL with replacement_path', () => {
    const errors = validateEntry(
      { event_type: 'CONFIRM', system_id: 'old_module', disposition: 'KILL', replacement_path: 'new_module' },
      'existing_system_disposition'
    );
    expect(errors).toHaveLength(0);
  });

  it('rejects DEVIATES without justification', () => {
    const errors = validateEntry(
      { event_type: 'CONFIRM', architectural_move: 'X', alignment: 'DEVIATES' },
      'vision_alignment'
    );
    expect(errors.some(e => e.includes('deviation_justification'))).toBe(true);
  });

  it('rejects evolvability aspect without future change scenario', () => {
    const errors = validateEntry(
      { event_type: 'CONFIRM', aspect: 'evolvability', evidence: 'some' },
      'maintainability_forecast'
    );
    expect(errors.some(e => e.includes('future_change_scenario'))).toBe(true);
  });

  it('rejects fragility signal without evidence handle', () => {
    const errors = validateEntry(
      { event_type: 'CONFIRM', system_id: 'x', fragility_signals: [{ type: 'low-test-coverage' }] },
      'fragility_coupling_map'
    );
    expect(errors.some(e => e.includes('evidence_handle'))).toBe(true);
  });

  it('rejects reach_profile missing breadth/depth/scale', () => {
    const errors = validateEntry({ event_type: 'CONFIRM', breadth: 5 }, 'reach_profile');
    expect(errors.some(e => e.includes('breadth, depth, and scale'))).toBe(true);
  });
});

describe('Round submission validation', () => {
  it('requires negative_evidence', () => {
    const result = validateRoundSubmission({ frame_falsifiers: [{}, {}, {}] }, {});
    expect(result.errors.some(e => e.includes('negative_evidence'))).toBe(true);
  });

  it('requires exactly 3 falsifiers', () => {
    const result = validateRoundSubmission({
      negative_evidence: { evidence: 'x' },
      frame_falsifiers: [{ statement: 'a', target_element_id: 'e1' }],
    }, {});
    expect(result.errors.some(e => e.includes('exactly 3'))).toBe(true);
  });

  it('rejects same-element-repeat falsifiers', () => {
    const result = validateRoundSubmission({
      negative_evidence: { evidence: 'x' },
      frame_falsifiers: [
        { statement: 'a', target_element_id: 'same' },
        { statement: 'b', target_element_id: 'same' },
        { statement: 'c', target_element_id: 'same' },
      ],
    }, {});
    expect(result.errors.some(e => e.includes('three distinct'))).toBe(true);
  });

  it('flags REVISE density above 30%', () => {
    const result = validateRoundSubmission({
      negative_evidence: { evidence: 'x' },
      frame_falsifiers: [
        { statement: 'a', target_element_id: 'e1' },
        { statement: 'b', target_element_id: 'e2' },
        { statement: 'c', target_element_id: 'e3' },
      ],
      reach_profile: [{ event_type: 'REVISE', breadth: 1, depth: 1, scale: 1, revises_element_id: 'r1', evidence_post_dates: 't' }],
      existing_system_disposition: [{ event_type: 'CONFIRM', system_id: 's1', disposition: 'ADAPT' }],
    }, {});
    expect(result.warnings.some(w => w.includes('density'))).toBe(true);
  });
});

describe('Score computation', () => {
  it('computes overall as weighted sum of tenets', () => {
    const tenetScores = {
      reach_profile: 1.0,
      existing_system_disposition: 1.0,
      fragility_coupling_map: 1.0,
      pattern_principle_lineage: 1.0,
      vision_alignment: 1.0,
      maintainability_forecast: 1.0,
    };
    const overall = computeOverallScore(tenetScores, 'default');
    expect(overall).toBeCloseTo(1.0, 3);
  });

  it('applies reclassify penalty', () => {
    const tenetScores = TENETS.reduce((acc, t) => { acc[t] = 1.0; return acc; }, {});
    const overall = computeOverallScore(tenetScores, 'default', 0.10);
    expect(overall).toBeCloseTo(0.9, 3);
  });

  it('finds weakest tenet by contribution (score × weight)', () => {
    const tenetScores = {
      reach_profile: 0.8, existing_system_disposition: 0.8,
      fragility_coupling_map: 0.8, pattern_principle_lineage: 0.8,
      vision_alignment: 0.1, maintainability_forecast: 0.8,
    };
    const weakest = findWeakestTenet(tenetScores, 'default');
    expect(weakest.tenet).toBe('vision_alignment');
  });
});

describe('Prediction calibration', () => {
  it('returns zero state when no predictions', () => {
    const result = computePredictionCalibration([], []);
    expect(result.locked_count).toBe(0);
    expect(result.hit_rate).toBe(0);
  });

  it('counts disconfirming predictions as confidence ≤ 0.55', () => {
    const predictions = [
      { id: 'p1', confidence: 0.5, locked: true },
      { id: 'p2', confidence: 0.9, locked: true },
      { id: 'p3', confidence: 0.4, locked: true },
    ];
    const result = computePredictionCalibration(predictions, []);
    expect(result.disconfirming_count).toBe(2);
  });

  it('computes hit rate over resolved predictions', () => {
    const predictions = [
      { id: 'p1', confidence: 0.5, locked: true },
      { id: 'p2', confidence: 0.6, locked: true },
    ];
    const resolutions = [
      { prediction_id: 'p1', outcome: 'HIT' },
      { prediction_id: 'p2', outcome: 'MISS' },
    ];
    const result = computePredictionCalibration(predictions, resolutions);
    expect(result.hit_rate).toBe(0.5);
  });
});

describe('Transition gate', () => {
  it('rejects transition with tenet below floor', () => {
    const state = {
      problemType: 'default',
      tenetScores: {
        reach_profile: 0.8, existing_system_disposition: 0.8,
        fragility_coupling_map: 0.2, // below floor
        pattern_principle_lineage: 0.8,
        vision_alignment: 0.8, maintainability_forecast: 0.8,
      },
      predictions: [
        { id: 'p1', confidence: 0.5, locked: true },
        { id: 'p2', confidence: 0.6, locked: true },
        { id: 'p3', confidence: 0.4, locked: true },
      ],
      predictionResolutions: [
        { prediction_id: 'p1', outcome: 'HIT' },
        { prediction_id: 'p2', outcome: 'HIT' },
        { prediction_id: 'p3', outcome: 'HIT' },
      ],
      architectural_target_artifact_present: true,
      round: 4,
    };
    const result = checkTransitionReady(state);
    expect(result.ready).toBe(false);
    expect(result.reasons.some(r => r.includes('fragility_coupling_map'))).toBe(true);
  });

  it('rejects transition without architectural target artifact', () => {
    const state = {
      problemType: 'default',
      tenetScores: TENETS.reduce((acc, t) => { acc[t] = 0.8; return acc; }, {}),
      predictions: [
        { id: 'p1', confidence: 0.5, locked: true },
        { id: 'p2', confidence: 0.6, locked: true },
        { id: 'p3', confidence: 0.4, locked: true },
      ],
      predictionResolutions: [
        { prediction_id: 'p1', outcome: 'HIT' },
        { prediction_id: 'p2', outcome: 'HIT' },
        { prediction_id: 'p3', outcome: 'HIT' },
      ],
      architectural_target_artifact_present: false,
      round: 4,
    };
    const result = checkTransitionReady(state);
    expect(result.reasons.some(r => r.includes('artifact'))).toBe(true);
  });
});

describe('Hit rate floor rises with rounds', () => {
  it('round 1 floor is 0.40', () => {
    expect(currentHitRateFloor(1)).toBe(0.40);
  });
  it('round 4 floor is 0.60', () => {
    expect(currentHitRateFloor(4)).toBe(0.60);
  });
  it('round 7 floor is 0.70', () => {
    expect(currentHitRateFloor(7)).toBe(0.70);
  });
});

describe('Suspicious pattern detection', () => {
  it('flags too-clean predictions', () => {
    const state = {
      round: 5,
      predictions: Array.from({ length: 6 }, (_, i) => ({ id: `p${i}`, confidence: 0.7, locked: true })),
      predictionResolutions: Array.from({ length: 6 }, (_, i) => ({ prediction_id: `p${i}`, outcome: 'HIT' })),
    };
    const flags = detectSuspiciousPatterns(state);
    expect(flags.some(f => f.type === 'too_clean_predictions')).toBe(true);
  });

  it('flags silent alignment in process_meta_design', () => {
    const state = { round: 4, problemType: 'process_meta_design', divergences: [] };
    const flags = detectSuspiciousPatterns(state);
    expect(flags.some(f => f.type === 'silent_alignment')).toBe(true);
  });
});
