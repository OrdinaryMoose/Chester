/**
 * metrics.js — Completeness computation, challenge trigger detection,
 * and closure condition checking for the design proof MCP server.
 * Pure-functions module with no I/O.
 *
 * Necessary Conditions Model (v2):
 *   Completeness tracks grounded conditions, not open-question inventory.
 *   Stall detection uses condition count stagnation (no OPENs to count).
 *   Challenges check grounding quality, not bookkeeping coverage.
 */

import { traverseGroundingChain, checkAllIntegrity } from './proof.js';

export const STALL_WINDOW = 3;

/**
 * Compute completeness metrics from the elements map. Optionally accepts state
 * for cross-cutting counters (Definitions live in state.definitions, not in
 * the elements Map). When `state` is omitted, definition counters are zero.
 * @param {Map} elements
 * @param {object} [state]
 * @returns {object}
 */
export function computeCompleteness(elements, state) {
  let total_elements = 0;
  let active_elements = 0;
  let condition_count = 0;
  let conditions_with_alternatives = 0;
  let conditions_with_collapse_test = 0;
  let rule_count = 0;
  let evidence_count = 0;
  let permission_count = 0;
  let risk_count = 0;
  let resolve_condition_count = 0;
  let ratified_rc_count = 0;
  let revision_count = 0;
  let friction_count = 0;
  let live_friction_count = 0;

  for (const [, el] of elements) {
    total_elements++;
    // Friction is counted in two flavors (total + active) and skips the
    // active-only short-circuit below so the total reflects withdrawn frictions too.
    if (el.type === 'FRICTION') {
      friction_count++;
      if (el.status === 'active') live_friction_count++;
    }
    if (el.status !== 'active') continue;
    active_elements++;

    if (el.type === 'NECESSARY_CONDITION') {
      condition_count++;
      if (Array.isArray(el.rejected_alternatives) && el.rejected_alternatives.length > 0) {
        conditions_with_alternatives++;
      }
      if (el.collapse_test) {
        conditions_with_collapse_test++;
      }
    }
    if (el.type === 'RULE') rule_count++;
    if (el.type === 'EVIDENCE') evidence_count++;
    if (el.type === 'PERMISSION') permission_count++;
    if (el.type === 'RISK') risk_count++;
    if (el.type === 'RESOLVE_CONDITION') {
      resolve_condition_count++;
      if (el.ratification !== null) ratified_rc_count++;
    }
    if (el.revisedInRound !== null) revision_count++;
  }

  const definitions = state?.definitions ?? [];
  const definition_count = definitions.length;
  const ratified_definition_count = definitions.filter(d => d.status === 'ratified').length;

  return {
    total_elements,
    active_elements,
    condition_count,
    conditions_with_alternatives,
    conditions_with_collapse_test,
    rule_count,
    evidence_count,
    permission_count,
    risk_count,
    resolve_condition_count,
    ratified_rc_count,
    revision_count,
    friction_count,
    live_friction_count,
    definition_count,
    ratified_definition_count,
  };
}

/**
 * For each active NECESSARY_CONDITION, check if all leaf nodes in its
 * grounding chain are EVIDENCE, RULE, or PERMISSION elements.
 * Returns ratio of grounded conditions to total.
 * Returns 1.0 if no active conditions exist.
 * @param {Map} elements
 * @returns {number} 0.0 - 1.0
 */
export function computeGroundingCoverage(elements) {
  const conditions = [];
  for (const [, el] of elements) {
    if (el.status === 'active' && el.type === 'NECESSARY_CONDITION') {
      conditions.push(el);
    }
  }

  if (conditions.length === 0) return 1.0;

  const leafTypes = new Set(['EVIDENCE', 'RULE', 'PERMISSION']);
  let grounded = 0;

  for (const condition of conditions) {
    if (condition.grounding.length === 0) {
      continue; // no grounding at all — not covered
    }

    const chain = traverseGroundingChain(elements, condition.id);
    const chainSet = new Set(chain);
    let allLeavesGrounded = true;

    for (const refId of chain) {
      const el = elements.get(refId);
      if (!el) continue;

      // Determine if this is a leaf: no refs within the chain
      const refs = el.type === 'NECESSARY_CONDITION'
        ? (el.grounding || [])
        : (el.basis || []);
      const refsInChain = refs.filter(r => chainSet.has(r));

      if (refsInChain.length === 0) {
        // Leaf node — must be a grounding type
        if (!leafTypes.has(el.type)) {
          allLeavesGrounded = false;
          break;
        }
      }
    }

    if (allLeavesGrounded) grounded++;
  }

  return grounded / conditions.length;
}

/**
 * Returns true if active NECESSARY_CONDITION count has not changed for
 * STALL_WINDOW consecutive rounds. Needs STALL_WINDOW + 1 entries in history.
 * @param {number[]} conditionCountHistory
 * @returns {boolean}
 */
export function detectStall(conditionCountHistory) {
  if (conditionCountHistory.length < STALL_WINDOW + 1) return false;

  const recent = conditionCountHistory.slice(-(STALL_WINDOW + 1));
  const val = recent[0];
  return recent.every(v => v === val);
}

/**
 * Detect if a challenge mode should fire. Checks in priority order:
 * ontologist, simplifier, contrarian.
 * @param {object} state - { round, elements, conditionCountHistory, elementCountHistory, challengeModesUsed }
 * @returns {{ mode: string|null, reason: string|null }}
 */
export function detectChallenge(state) {
  const { round, elements, conditionCountHistory, elementCountHistory, challengeModesUsed } = state;

  // Ontologist: condition count stall detected and not used
  if (!challengeModesUsed.includes('ontologist') && detectStall(conditionCountHistory)) {
    return {
      mode: 'ontologist',
      reason: 'Condition count has not changed for 3 consecutive rounds — ontologist challenge triggered',
    };
  }

  // Simplifier: condition count grew by >= 2 without any conditions being consolidated
  if (!challengeModesUsed.includes('simplifier') && conditionCountHistory.length >= 2) {
    const prev = conditionCountHistory[conditionCountHistory.length - 2];
    const curr = conditionCountHistory[conditionCountHistory.length - 1];
    const growth = curr - prev;

    if (growth >= 2) {
      return {
        mode: 'simplifier',
        reason: `Condition count grew by ${growth} without consolidation — simplifier challenge triggered`,
      };
    }
  }

  // Contrarian: round >= 2, any active NC grounded only in EVIDENCE (no RULE)
  if (!challengeModesUsed.includes('contrarian') && round >= 2) {
    for (const [, el] of elements) {
      if (el.status !== 'active' || el.type !== 'NECESSARY_CONDITION') continue;

      const chain = traverseGroundingChain(elements, el.id);
      const hasRule = chain.some(refId => {
        const dep = elements.get(refId);
        return dep && dep.type === 'RULE';
      });
      const hasEvidence = chain.some(refId => {
        const dep = elements.get(refId);
        return dep && dep.type === 'EVIDENCE';
      });

      // Grounded only in EVIDENCE, no RULE — agent deriving requirements from code alone
      if (hasEvidence && !hasRule) {
        return {
          mode: 'contrarian',
          reason: `Necessary condition "${el.id}" is grounded only in EVIDENCE with no RULE — contrarian challenge triggered`,
        };
      }
    }
  }

  return { mode: null, reason: null };
}

/**
 * Compute per-Concern coverage. Each Concern is covered if either:
 *   (RC path) at least one active RESOLVE_CONDITION whose `problem_anchor`
 *     matches the Concern id and whose `ratification` is non-null, OR
 *   (Rule-union path) at least one active RULE whose `statement` contains
 *     (case-insensitive substring) the Concern's id or label.
 * Spec line 66 picks both paths under the union.
 * @param {object} state - { concerns, elements }
 * @returns {{ covered: string[], uncovered: string[] }}
 */
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function checkConcernCoverage(state) {
  if (!state.concerns) return { covered: [], uncovered: [] };
  const covered = [];
  const uncovered = [];
  for (const concern of state.concerns) {
    let isCovered = false;
    for (const [, el] of state.elements) {
      if (el.status !== 'active') continue;
      if (
        el.type === 'RESOLVE_CONDITION' &&
        el.problem_anchor === concern.id &&
        el.ratification !== null
      ) {
        isCovered = true;
        break;
      }
      if (el.type === 'RULE') {
        const stmt = el.statement || '';
        const idRe = new RegExp(`\\b${escapeRegex(concern.id)}\\b`, 'i');
        const labelRe = new RegExp(`\\b${escapeRegex(concern.label)}\\b`, 'i');
        if (idRe.test(stmt) || labelRe.test(stmt)) {
          isCovered = true;
          break;
        }
      }
    }
    (isCovered ? covered : uncovered).push(concern.id);
  }
  return { covered, uncovered };
}

/**
 * Check whether closure (finishing the design proof) is permitted.
 * All ten conditions must pass. Conditions 1-6 cover the necessary-conditions
 * proof; conditions 7-9 cover Concerns presence, RC ratification, and per-Concern
 * coverage (in that fixed order); condition 10 requires the designer go-choice
 * (closingArgGoRound) to match the current round.
 *
 * Lock semantics retired (AC-2.2): per-Concern coverage is checked whenever any
 * Concerns exist, with no separate lock-state gate.
 * @param {object} state - { elements, round, phaseTransitionRound, concerns, closingArgPresentedRound, closingArgGoRound }
 * @returns {{ permitted: boolean, reasons: string[] }}
 */
export function checkClosure(state) {
  const { elements, round, phaseTransitionRound } = state;
  const reasons = [];

  let conditionCount = 0;
  let allGrounded = true;
  let allHaveCollapseTest = true;
  let anyWithAlternatives = false;
  let anyRevisedPostTransition = false;
  let hasIntegrityWarning = false;

  for (const [, el] of elements) {
    if (el.status !== 'active') continue;

    if (el.type === 'NECESSARY_CONDITION') {
      conditionCount++;

      // Check grounding: must have at least one EVIDENCE/RULE/PERMISSION in chain
      const chain = traverseGroundingChain(elements, el.id);
      const groundingTypes = new Set(['EVIDENCE', 'RULE', 'PERMISSION']);
      const isGrounded = chain.some(refId => {
        const dep = elements.get(refId);
        return dep && groundingTypes.has(dep.type);
      });
      if (!isGrounded) allGrounded = false;

      if (!el.collapse_test) allHaveCollapseTest = false;

      if (Array.isArray(el.rejected_alternatives) && el.rejected_alternatives.length > 0) {
        anyWithAlternatives = true;
      }
    }

    if (el.revisedInRound !== null && el.revisedInRound > phaseTransitionRound) {
      anyRevisedPostTransition = true;
    }
  }

  // 1. All necessary conditions are grounded
  if (!allGrounded) {
    reasons.push('Not all necessary conditions are grounded in EVIDENCE, RULE, or PERMISSION');
  }

  // 2. Every condition has a collapse test
  if (!allHaveCollapseTest) {
    reasons.push('Not all necessary conditions have collapse tests');
  }

  // 3. At least one condition has rejected alternatives
  if (!anyWithAlternatives) {
    reasons.push('No necessary condition has rejected alternatives — at least one required');
  }

  // 4. At least one element revised after designer interaction
  if (!anyRevisedPostTransition) {
    reasons.push('No element has been revised after phase transition');
  }

  // 5. Minimum rounds
  if (round < 3) {
    reasons.push(`Current round (${round}) is below minimum (3)`);
  }

  // 6. Must have at least one condition
  if (conditionCount === 0) {
    reasons.push('No active necessary conditions exist');
  }

  // 7. At least one Concern required
  if (!state.concerns || state.concerns.length === 0) {
    reasons.push('No Concerns enumerated — at least one Concern required before closure');
  }

  // 8. No active RC may be unratified
  let anyUnratifiedRc = false;
  for (const [, el] of elements) {
    if (el.status === 'active' && el.type === 'RESOLVE_CONDITION' && el.ratification === null) {
      anyUnratifiedRc = true;
      break;
    }
  }
  if (anyUnratifiedRc) {
    reasons.push('Unratified Resolve Conditions exist — ratify each before closure');
  }

  // 9. Per-Concern coverage (whenever any Concerns exist; lock retired AC-2.2)
  if (state.concerns && state.concerns.length > 0) {
    const { uncovered } = checkConcernCoverage(state);
    for (const concernId of uncovered) {
      reasons.push(`Concern "${concernId}" is not covered by any ratified Resolve Condition or Rule`);
    }
  }

  // 10. Designer go-choice required against a presented closing argument in current round
  if (state.closingArgGoRound !== state.round) {
    reasons.push('Designer go-choice not given against a presented closing argument — call present_closing_argument then confirm_closure_go');
  }

  return {
    permitted: reasons.length === 0,
    reasons,
  };
}

export const CLOSING_ARG_FLOORS = Object.freeze({
  groundingCoverageFloor: 0.9,
  aggregateScoreFloor: 0.8,
  weights: Object.freeze({ ratifiedRC: 0.4, grounding: 0.4, alternatives: 0.2 }),
  minRound: 3,
});

/**
 * Pure gate: tests Concerns ratification readiness for closing-argument flow.
 * Lock semantics retired (AC-2.2) — only ratification status matters.
 * @param {object} state
 * @returns {{ passed: true } | { passed: false, code: string, message: string }}
 */
export function concernsRatificationGate(state) {
  const concerns = Array.isArray(state?.concerns) ? state.concerns : [];
  const draftCount = concerns.filter((c) => c && c.status === 'draft').length;
  if (draftCount > 0) {
    return {
      passed: false,
      code: 'CONCERNS_UNRATIFIED',
      message: `Concerns must all be ratified; ${draftCount} draft remain`,
    };
  }
  return { passed: true };
}

// Test-only override: pass a partial floors object to evaluateTrigger via the second arg
// so tests can vary thresholds without mutating the frozen module-level constant.
// Production callers always omit the second arg and get the frozen defaults.
// Field-by-field fallback supports partial overrides.
export function evaluateTrigger(state, overrides) {
  const floors = {
    groundingCoverageFloor: overrides?.groundingCoverageFloor ?? CLOSING_ARG_FLOORS.groundingCoverageFloor,
    aggregateScoreFloor: overrides?.aggregateScoreFloor ?? CLOSING_ARG_FLOORS.aggregateScoreFloor,
    weights: overrides?.weights ?? CLOSING_ARG_FLOORS.weights,
    minRound: overrides?.minRound ?? CLOSING_ARG_FLOORS.minRound,
  };
  const reasons = [];
  const completeness = computeCompleteness(state.elements, state);
  const groundingCoverage = computeGroundingCoverage(state.elements);

  // Per-signal floors
  if (groundingCoverage < floors.groundingCoverageFloor) {
    reasons.push(`grounding_coverage ${groundingCoverage.toFixed(2)} below floor ${floors.groundingCoverageFloor}`);
  }
  if (completeness.resolve_condition_count < 1) {
    reasons.push('resolve_condition_count must be >= 1');
  }
  if (completeness.ratified_rc_count !== completeness.resolve_condition_count) {
    reasons.push(`unratified RCs exist: ${completeness.ratified_rc_count}/${completeness.resolve_condition_count} ratified`);
  }
  // Walk NCs: collapse_test populated on all; at least one rejected_alternatives
  let allHaveCollapse = true;
  let anyHasAlt = false;
  for (const [, el] of state.elements) {
    if (el.type !== 'NECESSARY_CONDITION' || el.status !== 'active') continue;
    if (!el.collapse_test) allHaveCollapse = false;
    if (Array.isArray(el.rejected_alternatives) && el.rejected_alternatives.length > 0) anyHasAlt = true;
  }
  if (!allHaveCollapse) reasons.push('not all active NCs have collapse_test');
  if (!anyHasAlt) reasons.push('no NC has rejected_alternatives');
  // Concerns ratification gate (draft count only; lock retired AC-2.2) —
  // surfaces as a reason string in this pure-function path.
  const gate = concernsRatificationGate(state);
  if (!gate.passed) {
    reasons.push(gate.message);
  }
  // Per-Concern coverage check whenever any Concerns exist (lock retired AC-2.2).
  if (state.concerns && state.concerns.length > 0) {
    const { uncovered } = checkConcernCoverage(state);
    if (uncovered.length > 0) reasons.push(`Concerns uncovered: ${uncovered.join(', ')}`);
  }
  if (state.round < floors.minRound) reasons.push(`round ${state.round} below floor ${floors.minRound}`);

  // Aggregate
  const conditionsWithAlt = completeness.conditions_with_alternatives ?? 0;
  const conditionCount = Math.max(completeness.condition_count ?? 0, 1);
  const rcCount = Math.max(completeness.resolve_condition_count ?? 0, 1);
  const aggregate = (completeness.ratified_rc_count / rcCount) * floors.weights.ratifiedRC
    + groundingCoverage * floors.weights.grounding
    + (conditionsWithAlt / conditionCount) * floors.weights.alternatives;
  if (aggregate < floors.aggregateScoreFloor) {
    reasons.push(`aggregate_score ${aggregate.toFixed(2)} below floor ${floors.aggregateScoreFloor}`);
  }

  // Integrity-zero
  const integrityWarnings = checkAllIntegrity(state.elements);
  if (integrityWarnings.length > 0) {
    reasons.push(`integrity_warnings: ${integrityWarnings.length} (${integrityWarnings.slice(0, 3).join('; ')})`);
  }

  return { permitted: reasons.length === 0, reasons };
}
