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

import { traverseGroundingChain } from './proof.js';

export const STALL_WINDOW = 3;

/**
 * Compute completeness metrics from the elements map.
 * @param {Map} elements
 * @returns {object}
 */
export function computeCompleteness(elements) {
  let total_elements = 0;
  let active_elements = 0;
  let condition_count = 0;
  let conditions_with_alternatives = 0;
  let conditions_with_collapse_test = 0;
  let rule_count = 0;
  let evidence_count = 0;
  let permission_count = 0;
  let risk_count = 0;
  let revision_count = 0;

  for (const [, el] of elements) {
    total_elements++;
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
    if (el.revisedInRound !== null) revision_count++;
  }

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
    revision_count,
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
 * Check whether closure (finishing the design proof) is permitted.
 * All conditions must pass.
 * @param {object} state - { elements, round, phaseTransitionRound }
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

  return {
    permitted: reasons.length === 0,
    reasons,
  };
}
