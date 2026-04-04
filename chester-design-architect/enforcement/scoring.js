// Scoring engine for the enforcement MCP server.
// Pure functions — all computation, no I/O.

// ── 2a: Composite Ambiguity Formula ────────────────────────────────

const GREENFIELD_WEIGHTS = { intent: 0.30, outcome: 0.25, scope: 0.20, constraints: 0.15, success: 0.10 };
const BROWNFIELD_WEIGHTS = { intent: 0.25, outcome: 0.20, scope: 0.20, constraints: 0.15, success: 0.10, context: 0.10 };

export function computeCompositeAmbiguity(scores, type) {
  const weights = type === 'brownfield' ? BROWNFIELD_WEIGHTS : GREENFIELD_WEIGHTS;
  let weightedSum = 0;
  for (const [dim, weight] of Object.entries(weights)) {
    weightedSum += (scores[dim] ?? 0) * weight;
  }
  return Math.round((1 - weightedSum) * 1000) / 1000;
}

// ── 2b: Input Validation ───────────────────────────────────────────

export function validateScoreSubmission(scores, previousScores) {
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

// ── 2c: Stage Priority ────────────────────────────────────────────

const STAGE_THRESHOLD = 0.7;
const STAGES = {
  'intent-first': ['intent', 'outcome', 'scope'],
  'feasibility': ['constraints', 'success'],
  'brownfield-grounding': ['context'],
};

export function computeStagePriority(scores, type) {
  const stageOrder = type === 'brownfield'
    ? ['intent-first', 'feasibility', 'brownfield-grounding']
    : ['intent-first', 'feasibility'];

  for (const stage of stageOrder) {
    const dims = STAGES[stage];
    let weakest = null;
    for (const dim of dims) {
      const entry = scores[dim];
      if (!entry) continue;
      if (entry.score < STAGE_THRESHOLD) {
        if (!weakest || entry.score < weakest.score) {
          weakest = { name: dim, score: entry.score };
        }
      }
    }
    if (weakest) {
      return { stage, weakest };
    }
  }

  // All stages satisfied
  return { stage: 'complete', weakest: null };
}

// ── 2d: Challenge Triggers and Stall Detection ────────────────────

const STALL_THRESHOLD = 0.05;
const STALL_WINDOW = 3;

export function detectStall(ambiguityHistory) {
  if (ambiguityHistory.length < STALL_WINDOW + 1) return false;

  // Check the last STALL_WINDOW consecutive pairs
  const recent = ambiguityHistory.slice(-STALL_WINDOW - 1);
  for (let i = 1; i < recent.length; i++) {
    if (Math.abs(recent[i] - recent[i - 1]) >= STALL_THRESHOLD) {
      return false;
    }
  }
  return true;
}

export function detectChallengeTrigger(state) {
  const { round, ambiguityHistory, scores, previousScores, challengeModesUsed } = state;
  const used = new Set(challengeModesUsed);

  // Check ontologist: stall condition
  if (!used.has('ontologist') && detectStall(ambiguityHistory)) {
    return { mode: 'ontologist', reason: 'Ambiguity has stalled — reframe the problem space' };
  }

  // Check simplifier: scope grows faster than outcome
  if (!used.has('simplifier') && previousScores) {
    const scopeGrowth = (scores.scope?.score ?? 0) - (previousScores.scope?.score ?? 0);
    const outcomeGrowth = (scores.outcome?.score ?? 0) - (previousScores.outcome?.score ?? 0);
    if (scopeGrowth > 0.2 && scopeGrowth > outcomeGrowth * 2) {
      return { mode: 'simplifier', reason: 'Scope is growing faster than outcome clarity — simplify' };
    }
  }

  // Check contrarian: round 2+
  if (!used.has('contrarian') && round >= 2) {
    return { mode: 'contrarian', reason: 'Round 2+ reached — challenge assumptions' };
  }

  return { mode: null, reason: null };
}

// ── 2e: Closure Check ─────────────────────────────────────────────

const AMBIGUITY_THRESHOLD = 0.20;

export function checkClosure(state) {
  const reasons = [];

  if (state.ambiguity >= AMBIGUITY_THRESHOLD) {
    reasons.push(`Ambiguity ${state.ambiguity} is above threshold ${AMBIGUITY_THRESHOLD}`);
  }

  if (state.gates) {
    for (const [gate, satisfied] of Object.entries(state.gates)) {
      if (!satisfied) {
        reasons.push(`Gate not satisfied: ${gate}`);
      }
    }
  }

  if (!state.pressurePassComplete) {
    reasons.push('Pressure pass is not complete');
  }

  return { permitted: reasons.length === 0, reasons };
}
