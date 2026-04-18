// State management for the enforcement MCP server.
// Manages interview state lifecycle — init, update, persist, load.

import { readFileSync, writeFileSync } from 'fs';
import { computeCompositeAmbiguity, computeStagePriority, detectStall, detectChallengeTrigger } from './scoring.js';

const DIMENSIONS_GREENFIELD = ['intent', 'outcome', 'scope', 'constraints', 'success'];
const DIMENSIONS_BROWNFIELD = [...DIMENSIONS_GREENFIELD, 'context'];

// ── Initialize ────────────────────────────────────────────────────

export function initializeState(type, problemStatement) {
  const dimensions = type === 'brownfield' ? DIMENSIONS_BROWNFIELD : DIMENSIONS_GREENFIELD;
  const scores = {};
  for (const dim of dimensions) {
    scores[dim] = { score: 0, justification: '', gap: '' };
  }

  return {
    type,
    round: 0,
    problemStatement,
    problemStatementRevised: false,
    scores,
    gates: {
      nonGoalsExplicit: false,
      decisionBoundariesExplicit: false,
    },
    pressurePassComplete: false,
    challengeModesUsed: [],
    ambiguityHistory: [],
    scoreHistory: [],
    challengeLog: [],
    pressureTracking: [],
  };
}

// ── Update ────────────────────────────────────────────────────────

export function updateState(state, newScores, gateEvidence) {
  const next = structuredClone(state);
  next.round += 1;

  // Store previous scores for challenge detection
  const previousScores = {};
  for (const [dim, entry] of Object.entries(next.scores)) {
    previousScores[dim] = entry.score;
  }

  // Update scores
  for (const [dim, entry] of Object.entries(newScores)) {
    if (next.scores[dim]) {
      next.scores[dim] = { ...entry };
    }
  }

  // Compute ambiguity and record history
  const scoreMap = {};
  for (const [dim, entry] of Object.entries(next.scores)) {
    scoreMap[dim] = entry.score;
  }
  const ambiguity = computeCompositeAmbiguity(scoreMap, next.type);
  next.ambiguityHistory.push(ambiguity);

  // Record score history snapshot
  next.scoreHistory.push(structuredClone(next.scores));

  // Update gates from evidence
  if (gateEvidence) {
    if (gateEvidence.nonGoalsAddressed) {
      next.gates.nonGoalsExplicit = true;
    }
    if (gateEvidence.decisionBoundariesAddressed) {
      next.gates.decisionBoundariesExplicit = true;
    }

    // Record pressure follow-up
    if (gateEvidence.pressureFollowUp) {
      next.pressureTracking.push({
        originalRound: gateEvidence.pressureFollowUp.originalRound,
        followUpRound: next.round,
      });
    }
  }

  // Detect stall
  next.stalled = detectStall(next.ambiguityHistory);

  // Compute stage priority
  next.stagePriority = computeStagePriority(next.scores, next.type);

  // Detect challenge triggers
  next.challengeTrigger = detectChallengeTrigger({
    round: next.round,
    ambiguityHistory: next.ambiguityHistory,
    scores: next.scores,
    previousScores,
    challengeModesUsed: next.challengeModesUsed,
  });

  return next;
}

// ── Challenge Tracking ────────────────────────────────────────────

export function markChallengeUsed(state, mode) {
  const next = structuredClone(state);
  next.challengeModesUsed.push(mode);
  next.challengeLog.push({ mode, round: next.round });
  return next;
}

// ── Persistence ───────────────────────────────────────────────────

export function saveState(state, filePath) {
  writeFileSync(filePath, JSON.stringify(state, null, 2));
}

export function loadState(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}
