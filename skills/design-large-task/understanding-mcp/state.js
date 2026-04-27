// State management for the understanding MCP server.
// Manages understanding state lifecycle — init, update, persist, load.

import { readFileSync, writeFileSync } from 'fs';
import { computeGroupSaturation, computeOverallSaturation, findWeakestDimension, collectGaps, checkTransitionReady } from './scoring.js';

const DIMENSIONS = [
  'surface_coverage', 'relationship_mapping', 'constraint_discovery', 'risk_topology',
  'stakeholder_impact', 'prior_art',
  'temporal_context', 'problem_boundary', 'assumption_inventory',
];

// ── Initialize ────────────────────────────────────────────────────

export function initializeState(contextType, userPrompt) {
  const scores = {};
  for (const dim of DIMENSIONS) {
    scores[dim] = { score: 0, justification: '', gap: '' };
  }

  return {
    contextType,
    round: 0,
    userPrompt,
    scores,
    scoreHistory: [],
    saturationHistory: [],
    groupSaturationHistory: [],
    transitionHistory: [],
    warningsHistory: [],
  };
}

// ── Update ────────────────────────────────────────────────────────

export function updateState(state, newScores, warnings = []) {
  const next = structuredClone(state);
  next.round += 1;

  // Update scores
  for (const [dim, entry] of Object.entries(newScores)) {
    if (next.scores[dim]) {
      next.scores[dim] = { ...entry };
    }
  }

  // Compute saturation
  const groupSaturation = computeGroupSaturation(next.scores);
  const overall = computeOverallSaturation(groupSaturation);
  next.saturationHistory.push(overall);

  // Record score history snapshot
  next.scoreHistory.push(structuredClone(next.scores));

  // Compute derived fields
  next.groupSaturation = groupSaturation;
  next.overallSaturation = overall;
  next.weakest = findWeakestDimension(next.scores, groupSaturation);
  next.gapsSummary = collectGaps(next.scores);
  next.transition = checkTransitionReady(next);

  // Defensive init — in-flight state files written before this change lack these arrays
  next.groupSaturationHistory ??= [];
  next.transitionHistory ??= [];
  next.warningsHistory ??= [];

  next.groupSaturationHistory.push(structuredClone(groupSaturation));
  next.transitionHistory.push(structuredClone(next.transition));
  next.warningsHistory.push(structuredClone(warnings));

  return next;
}

// ── Persistence ───────────────────────────────────────────────────

export function saveState(state, filePath) {
  writeFileSync(filePath, JSON.stringify(state, null, 2));
}

export function loadState(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}
