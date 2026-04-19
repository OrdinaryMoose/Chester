// Scoring engine for the understanding MCP server.
// Pure functions — all computation, no I/O.

// ── Dimension Groups and Weights ─────────────────────────────────

const DIMENSION_GROUPS = {
  landscape: ['surface_coverage', 'relationship_mapping', 'constraint_discovery', 'risk_topology'],
  human_context: ['stakeholder_impact', 'prior_art'],
  foundations: ['temporal_context', 'problem_boundary', 'assumption_inventory'],
};

const GROUP_WEIGHTS = { landscape: 0.40, human_context: 0.30, foundations: 0.30 };

// ── Input Validation ─────────────────────────────────────────────

export function validateUnderstandingSubmission(scores, previousScores) {
  const errors = [];
  const warnings = [];

  for (const entry of scores) {
    if (!entry.justification) {
      errors.push(`${entry.dimension}: justification is required`);
    }
    if (entry.score < 0.9 && !entry.gap) {
      errors.push(`${entry.dimension}: gap is required when score < 0.9`);
    }
    if (previousScores && previousScores[entry.dimension] !== undefined) {
      const jump = Math.abs(entry.score - previousScores[entry.dimension]);
      if (jump > 0.3) {
        warnings.push(
          `${entry.dimension}: score jumped from ${previousScores[entry.dimension]} to ${entry.score} (>${0.3})`
        );
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ── Group Saturation ─────────────────────────────────────────────

export function computeGroupSaturation(scores) {
  const result = {};

  for (const [group, dimensions] of Object.entries(DIMENSION_GROUPS)) {
    let sum = 0;
    let count = 0;
    for (const dim of dimensions) {
      if (scores[dim]) {
        sum += scores[dim].score;
        count += 1;
      }
    }
    result[group] = count > 0 ? Math.round((sum / count) * 1000) / 1000 : 0;
  }

  return result;
}

// ── Overall Saturation ───────────────────────────────────────────

export function computeOverallSaturation(groupSaturation) {
  let weighted = 0;
  for (const [group, weight] of Object.entries(GROUP_WEIGHTS)) {
    weighted += (groupSaturation[group] ?? 0) * weight;
  }
  return Math.round(weighted * 1000) / 1000;
}

// ── Weakest Dimension ────────────────────────────────────────────

export function findWeakestDimension(scores, groupSaturation) {
  // Find the least-saturated group
  let weakestGroup = null;
  let lowestGroupScore = Infinity;

  for (const [group, saturation] of Object.entries(groupSaturation)) {
    if (saturation < lowestGroupScore) {
      lowestGroupScore = saturation;
      weakestGroup = group;
    }
  }

  if (!weakestGroup) return null;

  // Find the lowest-scoring dimension within that group
  const dimensions = DIMENSION_GROUPS[weakestGroup];
  let weakest = null;

  for (const dim of dimensions) {
    const entry = scores[dim];
    if (!entry) continue;
    if (!weakest || entry.score < weakest.score) {
      weakest = { name: dim, score: entry.score };
    }
  }

  return { group: weakestGroup, dimension: weakest };
}

// ── Gaps Summary ─────────────────────────────────────────────────

export function collectGaps(scores) {
  const gaps = [];

  for (const [dim, entry] of Object.entries(scores)) {
    if (entry.gap && entry.score < 0.9) {
      gaps.push({ dimension: dim, gap: entry.gap, score: entry.score });
    }
  }

  // Sort by score ascending (most urgent gaps first)
  gaps.sort((a, b) => a.score - b.score);
  return gaps;
}

// ── Transition Readiness ─────────────────────────────────────────

const OVERALL_THRESHOLD = 0.65;
const GROUP_THRESHOLD = 0.50;
const MIN_ROUNDS = 3;

export function checkTransitionReady(state) {
  const reasons = [];

  const groupSaturation = computeGroupSaturation(state.scores);
  const overall = computeOverallSaturation(groupSaturation);

  if (overall < OVERALL_THRESHOLD) {
    reasons.push(`Overall saturation ${overall} is below threshold ${OVERALL_THRESHOLD}`);
  }

  for (const [group, saturation] of Object.entries(groupSaturation)) {
    if (saturation < GROUP_THRESHOLD) {
      reasons.push(`${group} group saturation ${saturation} is below threshold ${GROUP_THRESHOLD}`);
    }
  }

  if (state.round < MIN_ROUNDS) {
    reasons.push(`Only ${state.round} rounds completed (minimum ${MIN_ROUNDS})`);
  }

  return { ready: reasons.length === 0, reasons };
}
