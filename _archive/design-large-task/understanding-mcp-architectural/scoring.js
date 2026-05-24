// Scoring engine for the architectural-tenets understanding MCP.
// Pure functions — all computation, no I/O.
//
// Six tenets, flat-weighted per problem type, asymmetric event multipliers.
// Anti-game machinery requiring transcript access or LLM-judge dispatch is
// stamped TODO and lives in a follow-up sprint.

// ── Tenets ────────────────────────────────────────────────────────

export const TENETS = [
  'reach_profile',
  'existing_system_disposition',
  'fragility_coupling_map',
  'pattern_principle_lineage',
  'vision_alignment',
  'maintainability_forecast',
];

// ── Problem Types and Weight Profiles ─────────────────────────────

export const PROBLEM_TYPES = [
  'default',
  'greenfield_architecture',
  'brownfield_refactor',
  'process_meta_design',
  'bounded_fix_optimization',
];

export const WEIGHT_PROFILES = {
  default: {
    reach_profile: 0.20,
    existing_system_disposition: 0.20,
    fragility_coupling_map: 0.15,
    pattern_principle_lineage: 0.15,
    vision_alignment: 0.15,
    maintainability_forecast: 0.15,
  },
  greenfield_architecture: {
    reach_profile: 0.15,
    existing_system_disposition: 0.15,
    fragility_coupling_map: 0.10,
    pattern_principle_lineage: 0.25,
    vision_alignment: 0.20,
    maintainability_forecast: 0.15,
  },
  brownfield_refactor: {
    reach_profile: 0.20,
    existing_system_disposition: 0.25,
    fragility_coupling_map: 0.25,
    pattern_principle_lineage: 0.10,
    vision_alignment: 0.05,
    maintainability_forecast: 0.15,
  },
  process_meta_design: {
    reach_profile: 0.20,
    existing_system_disposition: 0.15,
    fragility_coupling_map: 0.05,
    pattern_principle_lineage: 0.20,
    vision_alignment: 0.25,
    maintainability_forecast: 0.15,
  },
  bounded_fix_optimization: {
    reach_profile: 0.25,
    existing_system_disposition: 0.20,
    fragility_coupling_map: 0.30,
    pattern_principle_lineage: 0.05,
    vision_alignment: 0.05,
    maintainability_forecast: 0.15,
  },
};

// ── Asymmetric Event Multipliers ──────────────────────────────────

export const EVENT_MULTIPLIERS = {
  CONFIRM: 1.0,
  EXTEND: 1.0,
  REVISE: 1.4,
  CONTRADICT: 1.6,
};

// Prediction-specific multipliers
export const PREDICTION_MULTIPLIERS = {
  HIT_LOW_CONFIDENCE: 1.5,    // confidence ≤ 0.55 and HIT
  HIT_HIGH_CONFIDENCE: 0.7,   // confidence ≥ 0.85 and HIT
  HIT_DEFAULT: 1.0,           // mid-confidence HIT
  MISS_WITH_UPDATE: 1.5,      // MISS plus model_update field present
  MISS_NO_UPDATE: 0.5,
  PARTIAL: 0.8,
};

// ── Constants ─────────────────────────────────────────────────────

export const TENET_FLOOR = 0.40;
export const DEFAULT_OVERALL_THRESHOLD = 0.70;
export const MIN_LOCKED_PREDICTIONS = 3;
export const RECLASSIFY_PENALTY = 0.10;
export const REVISE_DENSITY_CAP = 0.30; // 30% of round entries

export const RISING_HITRATE_FLOOR = {
  // round number → minimum cumulative hit rate
  1: 0.40,
  4: 0.60,
  7: 0.70,
};

// ── Per-Entry Validation ──────────────────────────────────────────

// Schema-level structural validation. Semantic checks (LLM-as-judge)
// are TODO and live in an enhancement sprint.

export function validateEntry(entry, tenet) {
  const errors = [];

  if (!entry.event_type) {
    errors.push(`${tenet}: event_type required (CONFIRM | EXTEND | REVISE | CONTRADICT)`);
  } else if (!Object.keys(EVENT_MULTIPLIERS).includes(entry.event_type)) {
    errors.push(`${tenet}: event_type must be one of ${Object.keys(EVENT_MULTIPLIERS).join(', ')}`);
  }

  if (entry.event_type === 'REVISE' || entry.event_type === 'CONTRADICT') {
    if (!entry.revises_element_id) {
      errors.push(`${tenet}: ${entry.event_type} requires revises_element_id`);
    }
    if (!entry.evidence_post_dates) {
      errors.push(`${tenet}: ${entry.event_type} requires evidence_post_dates (turn_id or timestamp)`);
    }
  }

  // Tenet-specific schema rules
  switch (tenet) {
    case 'reach_profile':
      if (entry.breadth === undefined || entry.depth === undefined || entry.scale === undefined) {
        errors.push('reach_profile: requires breadth, depth, and scale (numeric)');
      }
      break;
    case 'existing_system_disposition':
      if (!entry.system_id || !entry.disposition) {
        errors.push('existing_system_disposition: requires system_id and disposition');
      } else if (!['REPURPOSE', 'ADAPT', 'KEEP-AS-IS', 'DEPRECATE', 'KILL', 'BIRTH-NEW'].includes(entry.disposition)) {
        errors.push('existing_system_disposition: invalid disposition');
      } else if (['KILL', 'DEPRECATE'].includes(entry.disposition) && !entry.replacement_path && !entry.sunset_rationale) {
        errors.push(`existing_system_disposition: ${entry.disposition} requires replacement_path or sunset_rationale`);
      }
      break;
    case 'fragility_coupling_map':
      if (!entry.system_id) {
        errors.push('fragility_coupling_map: requires system_id');
      }
      if (entry.fragility_signals && entry.fragility_signals.some(s => !s.evidence_handle)) {
        errors.push('fragility_coupling_map: every fragility signal must include evidence_handle');
      }
      break;
    case 'pattern_principle_lineage':
      if (!entry.subfield || !['established_patterns', 'principles_honored', 'prior_attempts'].includes(entry.subfield)) {
        errors.push('pattern_principle_lineage: requires subfield (established_patterns | principles_honored | prior_attempts)');
      }
      break;
    case 'vision_alignment':
      if (!entry.architectural_move || !entry.alignment) {
        errors.push('vision_alignment: requires architectural_move and alignment (ALIGNED | NEUTRAL | DEVIATES)');
      } else if (entry.alignment === 'DEVIATES' && !entry.deviation_justification) {
        errors.push('vision_alignment: DEVIATES requires non-empty deviation_justification');
      }
      break;
    case 'maintainability_forecast':
      if (!entry.aspect || !entry.evidence) {
        errors.push('maintainability_forecast: requires aspect and evidence');
      } else if (entry.aspect === 'evolvability' && !entry.future_change_scenario) {
        errors.push('maintainability_forecast: evolvability aspect requires named future_change_scenario');
      }
      break;
  }

  return errors;
}

// ── Per-Round Validation ──────────────────────────────────────────

export function validateRoundSubmission(submission, state) {
  const errors = [];
  const warnings = [];

  if (!submission.negative_evidence || !submission.negative_evidence.evidence) {
    errors.push('negative_evidence required: each round must submit one piece of evidence that weakens the current architectural target');
  }

  if (!submission.frame_falsifiers || submission.frame_falsifiers.length !== 3) {
    errors.push('frame_falsifiers: exactly 3 falsifier entries required per round');
  } else {
    const targets = new Set();
    for (const f of submission.frame_falsifiers) {
      if (!f.target_element_id) errors.push('frame_falsifier missing target_element_id');
      if (!f.statement) errors.push('frame_falsifier missing statement');
      if (f.target_element_id) targets.add(f.target_element_id);
    }
    if (targets.size < 3) {
      errors.push('frame_falsifiers must target three distinct load-bearing elements (no same-element repeats)');
    }
  }

  // Per-tenet entry validation
  for (const tenet of TENETS) {
    const entries = submission[tenet] ?? [];
    for (const entry of entries) {
      const entryErrors = validateEntry(entry, tenet);
      errors.push(...entryErrors);
    }
  }

  // REVISE/CONTRADICT density cap
  const allEntries = TENETS.flatMap(t => submission[t] ?? []);
  const reviseCount = allEntries.filter(e => ['REVISE', 'CONTRADICT'].includes(e.event_type)).length;
  if (allEntries.length > 0 && reviseCount / allEntries.length > REVISE_DENSITY_CAP) {
    warnings.push(`REVISE/CONTRADICT density exceeds ${REVISE_DENSITY_CAP * 100}% — overflow entries default to 1.0x multiplier`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ── Multiplier Resolution ─────────────────────────────────────────

// Applies declared event_type multiplier. Honest-mismatch detection
// (declared vs actual via LLM-judge) is TODO — for now, declarations are trusted
// at the multiplier level but semantic validation runs separately.

export function resolveEntryMultiplier(entry, densityCapped = false) {
  if (densityCapped && ['REVISE', 'CONTRADICT'].includes(entry.event_type)) {
    return 1.0; // density cap overflow
  }
  return EVENT_MULTIPLIERS[entry.event_type] ?? 1.0;
}

export function resolvePredictionMultiplier(prediction, resolution) {
  if (resolution.outcome === 'HIT') {
    if (prediction.confidence <= 0.55) return PREDICTION_MULTIPLIERS.HIT_LOW_CONFIDENCE;
    if (prediction.confidence >= 0.85) return PREDICTION_MULTIPLIERS.HIT_HIGH_CONFIDENCE;
    return PREDICTION_MULTIPLIERS.HIT_DEFAULT;
  }
  if (resolution.outcome === 'MISS') {
    return resolution.model_update ? PREDICTION_MULTIPLIERS.MISS_WITH_UPDATE : PREDICTION_MULTIPLIERS.MISS_NO_UPDATE;
  }
  if (resolution.outcome === 'PARTIAL') return PREDICTION_MULTIPLIERS.PARTIAL;
  return 1.0;
}

// ── Per-Tenet Score Computation ───────────────────────────────────

// Each tenet's raw score is computed from validated × multiplier counts,
// normalized into [0, 1]. Normalization saturates at a per-tenet target count
// so density of evidence diminishes returns past adequate coverage.

const TENET_TARGET_ENTRIES = {
  reach_profile: 1,           // single profile per round
  existing_system_disposition: 5,
  fragility_coupling_map: 3,
  pattern_principle_lineage: 4,
  vision_alignment: 3,
  maintainability_forecast: 3,
};

export function computeTenetScore(entries, tenet, densityCapHit = false) {
  if (!entries || entries.length === 0) return 0;

  let weightedSum = 0;
  for (const entry of entries) {
    if (entry._validation_passed === false) continue;
    const multiplier = resolveEntryMultiplier(entry, densityCapHit);
    weightedSum += multiplier; // base score per validated entry = 1.0; multiplier scales
  }

  const target = TENET_TARGET_ENTRIES[tenet] ?? 3;
  const raw = weightedSum / target;
  return Math.min(1.0, Math.round(raw * 1000) / 1000);
}

// ── Overall Score ─────────────────────────────────────────────────

export function computeOverallScore(tenetScores, problemType, reclassifyPenaltyAccrued = 0) {
  const profile = WEIGHT_PROFILES[problemType] ?? WEIGHT_PROFILES.default;
  let weighted = 0;
  for (const tenet of TENETS) {
    weighted += (tenetScores[tenet] ?? 0) * profile[tenet];
  }
  const adjusted = Math.max(0, weighted - reclassifyPenaltyAccrued);
  return Math.round(adjusted * 1000) / 1000;
}

// ── Weakest Tenet ─────────────────────────────────────────────────

export function findWeakestTenet(tenetScores, problemType) {
  const profile = WEIGHT_PROFILES[problemType] ?? WEIGHT_PROFILES.default;
  let weakest = null;
  let lowestContribution = Infinity;

  for (const tenet of TENETS) {
    const score = tenetScores[tenet] ?? 0;
    const contribution = score * profile[tenet];
    if (contribution < lowestContribution) {
      lowestContribution = contribution;
      weakest = { tenet, score, weight: profile[tenet], contribution };
    }
  }

  return weakest;
}

// ── Prediction Calibration State ──────────────────────────────────

export function computePredictionCalibration(predictions, resolutions) {
  if (!predictions || predictions.length === 0) {
    return { locked_count: 0, hit_rate: 0, disconfirming_count: 0 };
  }

  const locked = predictions.filter(p => p.locked);
  const lockedIds = new Set(locked.map(p => p.id));
  const resolved = (resolutions ?? []).filter(r => lockedIds.has(r.prediction_id));

  let hits = 0;
  let weightedSum = 0;
  for (const r of resolved) {
    const p = locked.find(pr => pr.id === r.prediction_id);
    if (!p) continue;
    if (r.outcome === 'HIT') hits += 1;
    weightedSum += resolvePredictionMultiplier(p, r);
  }

  const disconfirming = locked.filter(p => p.confidence <= 0.55).length;

  return {
    locked_count: locked.length,
    resolved_count: resolved.length,
    hits,
    hit_rate: resolved.length > 0 ? Math.round((hits / resolved.length) * 1000) / 1000 : 0,
    weighted_sum: Math.round(weightedSum * 1000) / 1000,
    disconfirming_count: disconfirming,
  };
}

// ── Transition Gate ───────────────────────────────────────────────

export function checkTransitionReady(state) {
  const reasons = [];
  const tenetScores = state.tenetScores ?? {};
  const profile = WEIGHT_PROFILES[state.problemType ?? 'default'];
  const overallThreshold = state.overallThreshold ?? DEFAULT_OVERALL_THRESHOLD;
  const round = state.round ?? 0;

  // Floor check
  for (const tenet of TENETS) {
    const score = tenetScores[tenet] ?? 0;
    if (score < TENET_FLOOR) {
      reasons.push(`${tenet} below floor (${score} < ${TENET_FLOOR})`);
    }
  }

  // Overall threshold
  const overall = computeOverallScore(tenetScores, state.problemType ?? 'default', state.reclassifyPenaltyAccrued ?? 0);
  if (overall < overallThreshold) {
    reasons.push(`overall ${overall} below threshold ${overallThreshold}`);
  }

  // Prediction calibration
  const calib = computePredictionCalibration(state.predictions ?? [], state.predictionResolutions ?? []);
  if (calib.locked_count < MIN_LOCKED_PREDICTIONS) {
    reasons.push(`only ${calib.locked_count} locked predictions (need ${MIN_LOCKED_PREDICTIONS})`);
  }
  const hitRateFloor = currentHitRateFloor(round);
  if (calib.resolved_count > 0 && calib.hit_rate < hitRateFloor) {
    reasons.push(`prediction hit rate ${calib.hit_rate} below floor ${hitRateFloor} (round ${round})`);
  }
  if (calib.disconfirming_count < 1) {
    reasons.push('no disconfirming prediction (need ≥ 1 with confidence ≤ 0.55)');
  }

  // Architectural target artifact present
  if (!state.architectural_target_artifact_present) {
    reasons.push('architectural target artifact not yet present');
  }

  // Open divergences
  const openDivergences = (state.divergences ?? []).filter(d => d.status === 'OPEN' && !d.designer_disposition);
  if (openDivergences.length > 0) {
    reasons.push(`${openDivergences.length} open divergence(s) without designer disposition`);
  }

  // Suspicious patterns at ERROR severity
  const errorFlags = (state.suspicionFlags ?? []).filter(f => f.severity === 'ERROR' && !f.resolved);
  if (errorFlags.length > 0) {
    reasons.push(`${errorFlags.length} unresolved ERROR-severity suspicion flag(s)`);
  }

  return { ready: reasons.length === 0, reasons, overall };
}

export function currentHitRateFloor(round) {
  if (round >= 7) return RISING_HITRATE_FLOOR[7];
  if (round >= 4) return RISING_HITRATE_FLOOR[4];
  return RISING_HITRATE_FLOOR[1];
}

// ── Suspicious Pattern Detection ──────────────────────────────────

// Returns array of { type, severity, message, round } flags. Designer-visible.
export function detectSuspiciousPatterns(state) {
  const flags = [];
  const round = state.round ?? 0;

  const calib = computePredictionCalibration(state.predictions ?? [], state.predictionResolutions ?? []);
  if (calib.resolved_count >= 5 && calib.hit_rate > 0.95) {
    flags.push({
      type: 'too_clean_predictions',
      severity: 'WARNING',
      message: `prediction hit rate ${calib.hit_rate} over ${calib.resolved_count} resolutions — predictions may be too easy`,
      round,
    });
  }

  // Zero divergence in Process / Meta type over 3+ rounds
  if (state.problemType === 'process_meta_design' && round >= 3) {
    const recentDivergences = (state.divergences ?? []).filter(d => (d.opened_round ?? 0) > round - 3);
    if (recentDivergences.length === 0) {
      flags.push({
        type: 'silent_alignment',
        severity: 'WARNING',
        message: 'no divergence recorded in last 3 rounds in Process/Meta sprint — verify agent is not silently aligning',
        round,
      });
    }
  }

  // TODO: engagement decay (designer turn word count + hit rate) requires transcript access
  // TODO: corpus narrowing (all citations from one source) requires citation enumeration
  // TODO: strategic reclassification (type shift after low-scoring round) requires history scan

  return flags;
}
