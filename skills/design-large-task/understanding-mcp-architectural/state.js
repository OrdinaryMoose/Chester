// State management for the architectural-tenets understanding MCP server.
// Manages session lifecycle: initialize → confirm type → register/resolve predictions
// → submit round evidence → check transition.

import { readFileSync, writeFileSync } from 'fs';
import {
  TENETS,
  PROBLEM_TYPES,
  WEIGHT_PROFILES,
  RECLASSIFY_PENALTY,
  REVISE_DENSITY_CAP,
  computeTenetScore,
  computeOverallScore,
  findWeakestTenet,
  computePredictionCalibration,
  checkTransitionReady,
  detectSuspiciousPatterns,
  validateRoundSubmission,
} from './scoring.js';

// ── Initialize ───────────────────────────────────────────────────

export function initializeState(userPrompt, proposedType = 'default') {
  const tenetEntries = {};
  const tenetScores = {};
  for (const tenet of TENETS) {
    tenetEntries[tenet] = [];
    tenetScores[tenet] = 0;
  }

  return {
    schemaVersion: 'architectural-v0.1',
    userPrompt,
    proposedType,
    problemType: null,           // becomes set on confirm_problem_type
    typeLockedAt: null,
    reclassifyPenaltyAccrued: 0,
    overallThreshold: 0.70,
    round: 0,

    // Per-tenet entry ledgers (history of all submitted entries, append-only)
    tenetEntries,

    // Per-tenet computed scores after the latest round
    tenetScores,

    // Round-by-round score snapshots
    scoreHistory: [],

    // Predictions ledger — server-timestamped
    predictions: [],
    predictionResolutions: [],

    // Frame falsifier set (latest round)
    frame_falsifiers: [],

    // Triggered falsifiers
    triggered_falsifiers: [],

    // Architectural divergences
    divergences: [],

    // Negative evidence per round
    negative_evidence_history: [],

    // Suspicion flags
    suspicionFlags: [],

    // Transition state
    transition: { ready: false, reasons: ['session just initialized'] },

    // Architectural target artifact handle (set when designer ratifies the target)
    architectural_target_artifact_present: false,
    architectural_target_artifact_path: null,

    // Telemetry compatible with Lane-1 conventions
    criterionScoreHistory: [],
    transitionHistory: [],
    warningsHistory: [],
  };
}

// ── Type Confirmation ────────────────────────────────────────────

export function confirmProblemType(state, problemType, designerTurnId) {
  if (!PROBLEM_TYPES.includes(problemType)) {
    throw new Error(`unknown problem type: ${problemType}`);
  }
  const next = structuredClone(state);
  next.problemType = problemType;
  next.typeLockedAt = { turn_id: designerTurnId, at: new Date().toISOString() };
  return next;
}

export function reclassifyProblemType(state, newType, reason, designerTurnId) {
  if (!PROBLEM_TYPES.includes(newType)) {
    throw new Error(`unknown problem type: ${newType}`);
  }
  if (!state.problemType) {
    throw new Error('cannot reclassify before initial confirm_problem_type');
  }
  const next = structuredClone(state);
  next.problemType = newType;
  next.reclassifyPenaltyAccrued = (next.reclassifyPenaltyAccrued ?? 0) + RECLASSIFY_PENALTY;
  next.typeShiftLog ??= [];
  next.typeShiftLog.push({
    from: state.problemType,
    to: newType,
    reason,
    turn_id: designerTurnId,
    at: new Date().toISOString(),
    penalty_applied: RECLASSIFY_PENALTY,
  });
  return next;
}

// ── Prediction Lifecycle ─────────────────────────────────────────

let predictionCounter = 0;

export function registerPredictions(state, predictionsInput) {
  const next = structuredClone(state);
  const registered = [];

  for (const p of predictionsInput) {
    if (!p.question || !p.expected_response || p.confidence === undefined) {
      throw new Error('prediction requires question, expected_response, confidence');
    }
    if (p.predicted_at_turn === undefined) {
      throw new Error('prediction requires predicted_at_turn');
    }

    // TODO: refuse if target question already appears in transcript (requires transcript handle)

    predictionCounter += 1;
    const id = `pred_${state.round}_${predictionCounter}`;
    const entry = {
      id,
      question: p.question,
      expected_response: p.expected_response,
      confidence: p.confidence,
      predicted_at_turn: p.predicted_at_turn,
      registered_at: new Date().toISOString(),
      locked: true,
      resolved: false,
    };
    next.predictions.push(entry);
    registered.push(entry);
  }

  return { state: next, registered };
}

export function resolvePredictions(state, resolutionsInput) {
  const next = structuredClone(state);
  const recorded = [];

  for (const r of resolutionsInput) {
    const prediction = next.predictions.find(p => p.id === r.prediction_id);
    if (!prediction) {
      throw new Error(`unknown prediction_id: ${r.prediction_id}`);
    }
    if (prediction.resolved) {
      throw new Error(`prediction ${r.prediction_id} already resolved`);
    }
    if (!r.outcome || !['HIT', 'PARTIAL', 'MISS'].includes(r.outcome)) {
      throw new Error('resolution requires outcome: HIT | PARTIAL | MISS');
    }
    if (!r.designer_turn_id || !r.response_quote) {
      throw new Error('resolution requires designer_turn_id and response_quote');
    }

    // TODO: verify response_quote appears verbatim at designer_turn_id (requires transcript)
    // TODO: dispatch LLM-judge to confirm outcome label matches actual

    prediction.resolved = true;
    prediction.resolution = {
      designer_turn_id: r.designer_turn_id,
      response_quote: r.response_quote,
      outcome: r.outcome,
      model_update: r.model_update ?? null,
      resolved_at: new Date().toISOString(),
    };
    next.predictionResolutions.push({
      prediction_id: r.prediction_id,
      ...prediction.resolution,
    });
    recorded.push(prediction);
  }

  return { state: next, recorded };
}

// ── Round Evidence Submission ────────────────────────────────────

export function submitRoundEvidence(state, submission) {
  if (!state.problemType) {
    throw new Error('submit_round_evidence requires confirm_problem_type first');
  }

  const validation = validateRoundSubmission(submission, state);
  if (!validation.valid) {
    return { valid: false, errors: validation.errors, warnings: validation.warnings };
  }

  const next = structuredClone(state);
  next.round += 1;

  // Compute density cap state for this round
  const allEntries = TENETS.flatMap(t => submission[t] ?? []);
  const reviseCount = allEntries.filter(e => ['REVISE', 'CONTRADICT'].includes(e.event_type)).length;
  const densityCapHit = allEntries.length > 0 && (reviseCount / allEntries.length) > REVISE_DENSITY_CAP;

  // Append entries to per-tenet ledgers
  for (const tenet of TENETS) {
    const entries = submission[tenet] ?? [];
    for (const entry of entries) {
      next.tenetEntries[tenet].push({
        ...entry,
        _validation_passed: true,
        round: next.round,
      });
    }
    // Recompute tenet score based on full ledger
    next.tenetScores[tenet] = computeTenetScore(next.tenetEntries[tenet], tenet, densityCapHit);
  }

  // Frame falsifiers (latest round only — replaces prior set)
  next.frame_falsifiers = (submission.frame_falsifiers ?? []).map(f => ({
    ...f,
    submitted_round: next.round,
  }));

  // Divergences — append
  if (submission.divergences) {
    for (const div of submission.divergences) {
      next.divergences.push({
        ...div,
        opened_round: div.opened_round ?? next.round,
        recorded_at: new Date().toISOString(),
      });
    }
  }

  // Negative evidence — required, captured in history
  if (submission.negative_evidence) {
    next.negative_evidence_history.push({
      ...submission.negative_evidence,
      round: next.round,
      submitted_at: new Date().toISOString(),
    });
  }

  // Architectural target artifact flag
  if (submission.architectural_target_artifact_present) {
    next.architectural_target_artifact_present = true;
    next.architectural_target_artifact_path = submission.architectural_target_artifact_path ?? null;
  }

  // Score history snapshot
  next.scoreHistory.push(structuredClone(next.tenetScores));
  next.criterionScoreHistory.push(structuredClone(next.tenetScores));

  // Suspicion-pattern detection
  const newFlags = detectSuspiciousPatterns(next);
  for (const f of newFlags) {
    if (!next.suspicionFlags.find(existing => existing.type === f.type && existing.round === f.round)) {
      next.suspicionFlags.push(f);
    }
  }

  // Compute transition
  next.transition = checkTransitionReady(next);
  next.transitionHistory.push(structuredClone(next.transition));
  next.warningsHistory.push(validation.warnings);

  return { valid: true, state: next, warnings: validation.warnings, densityCapHit };
}

// ── Falsifier Triggering ─────────────────────────────────────────

export function markFalsifierTriggered(state, falsifierId, designerTurnId, quote) {
  const next = structuredClone(state);
  const falsifier = (next.frame_falsifiers ?? []).find(f => f.target_element_id === falsifierId || f.id === falsifierId);
  if (!falsifier) {
    throw new Error(`unknown falsifier: ${falsifierId}`);
  }
  next.triggered_falsifiers.push({
    falsifier_id: falsifierId,
    designer_turn_id: designerTurnId,
    quote,
    triggered_round: next.round,
    triggered_at: new Date().toISOString(),
    // TODO: verify quote at designer_turn_id matches falsifier statement (LLM-judge)
    // TODO: watch next round for frame revision on the falsifier's target element
  });
  return next;
}

// ── Persistence ──────────────────────────────────────────────────

export function saveState(state, filePath) {
  writeFileSync(filePath, JSON.stringify(state, null, 2));
}

export function loadState(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}
