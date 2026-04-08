/**
 * metrics.js — Completeness computation, challenge trigger detection,
 * and closure condition checking for the design proof MCP server.
 * Pure-functions module with no I/O.
 */

import { traverseBasisChain } from './proof.js';

export const STALL_WINDOW = 3;

/**
 * Compute completeness metrics from the elements map.
 * @param {Map} elements
 * @returns {object}
 */
export function computeCompleteness(elements) {
  let total_elements = 0;
  let active_elements = 0;
  let open_count = 0;
  let boundary_count = 0;
  let decisions_with_alternatives = 0;
  let revision_count = 0;

  for (const [, el] of elements) {
    total_elements++;
    if (el.status !== 'active') continue;
    active_elements++;

    if (el.type === 'OPEN') open_count++;
    if (el.type === 'BOUNDARY') boundary_count++;
    if (el.type === 'DECISION' && Array.isArray(el.over) && el.over.length > 0) {
      decisions_with_alternatives++;
    }
    if (el.revisedInRound !== null) revision_count++;
  }

  return {
    total_elements,
    active_elements,
    open_count,
    boundary_count,
    decisions_with_alternatives,
    revision_count,
  };
}

/**
 * For each active DECISION, check if all leaf nodes in its basis chain
 * are GIVENs or CONSTRAINTs. Returns ratio of covered decisions to total.
 * Returns 1.0 if no active DECISIONs exist.
 * @param {Map} elements
 * @returns {number} 0.0 - 1.0
 */
export function computeBasisCoverage(elements) {
  const decisions = [];
  for (const [, el] of elements) {
    if (el.status === 'active' && el.type === 'DECISION') {
      decisions.push(el);
    }
  }

  if (decisions.length === 0) return 1.0;

  let covered = 0;
  for (const decision of decisions) {
    const chain = traverseBasisChain(elements, decision.id);
    // Find leaf nodes: elements in chain whose basis is empty or all refs
    // are outside the chain (or don't exist). But simpler: a leaf is an
    // element in the chain that has no basis entries that are also in the chain.
    // Actually, the spec says "all leaf nodes are GIVENs or CONSTRAINTs".
    // A leaf node is one with no basis (empty array) among the reachable set.

    // If decision has no basis at all, it's a leaf itself — check its type.
    if (decision.basis.length === 0) {
      // The decision itself is a leaf; decisions aren't GIVEN/CONSTRAINT
      // so not covered — unless there's nothing to cover (but decision IS
      // a decision, so it must ground in GIVEN/CONSTRAINT to be covered).
      // A decision with no basis is not covered.
      continue; // not covered
    }

    const chainSet = new Set(chain);
    let allLeafsCovered = true;

    // Check each element in chain: if it has no basis entries within the
    // chain, it's a leaf.
    for (const id of chain) {
      const el = elements.get(id);
      if (!el) continue;
      const basisInChain = (el.basis || []).filter(ref => chainSet.has(ref));
      if (basisInChain.length === 0) {
        // This is a leaf node
        if (el.type !== 'GIVEN' && el.type !== 'CONSTRAINT') {
          allLeafsCovered = false;
          break;
        }
      }
    }

    if (allLeafsCovered) covered++;
  }

  return covered / decisions.length;
}

/**
 * Returns true if active OPEN count has not changed for STALL_WINDOW
 * consecutive rounds. Needs STALL_WINDOW + 1 entries in history.
 * @param {number[]} openCountHistory
 * @returns {boolean}
 */
export function detectStall(openCountHistory) {
  if (openCountHistory.length < STALL_WINDOW + 1) return false;

  const recent = openCountHistory.slice(-(STALL_WINDOW + 1));
  const val = recent[0];
  return recent.every(v => v === val);
}

/**
 * Detect if a challenge mode should fire. Checks in priority order:
 * ontologist, simplifier, contrarian.
 * @param {object} state - { round, elements, openCountHistory, elementCountHistory, challengeModesUsed }
 * @returns {{ mode: string|null, reason: string|null }}
 */
export function detectChallenge(state) {
  const { round, elements, openCountHistory, elementCountHistory, challengeModesUsed } = state;

  // Ontologist: stall detected and not used
  if (!challengeModesUsed.includes('ontologist') && detectStall(openCountHistory)) {
    return {
      mode: 'ontologist',
      reason: 'OPEN count has not changed for 3 consecutive rounds — ontologist challenge triggered',
    };
  }

  // Simplifier: element count grew by >= 3 and opens did not decrease
  if (!challengeModesUsed.includes('simplifier') && elementCountHistory.length >= 2) {
    const prev = elementCountHistory[elementCountHistory.length - 2];
    const curr = elementCountHistory[elementCountHistory.length - 1];
    const growth = curr - prev;

    let opensDecreased = false;
    if (openCountHistory.length >= 2) {
      const prevOpen = openCountHistory[openCountHistory.length - 2];
      const currOpen = openCountHistory[openCountHistory.length - 1];
      opensDecreased = currOpen < prevOpen;
    }

    if (growth >= 3 && !opensDecreased) {
      return {
        mode: 'simplifier',
        reason: `Element count grew by ${growth} without reducing OPENs — simplifier challenge triggered`,
      };
    }
  }

  // Contrarian: round >= 2, any active ASSERTION with no designer GIVEN in basis
  if (!challengeModesUsed.includes('contrarian') && round >= 2) {
    for (const [, el] of elements) {
      if (el.status !== 'active' || el.type !== 'ASSERTION') continue;

      const chain = traverseBasisChain(elements, el.id);
      const hasDesignerGiven = chain.some(id => {
        const dep = elements.get(id);
        return dep && dep.type === 'GIVEN' && dep.source === 'designer';
      });

      if (!hasDesignerGiven) {
        return {
          mode: 'contrarian',
          reason: `Assertion "${el.id}" has no designer GIVEN in its basis chain — contrarian challenge triggered`,
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

  // 1. Zero active OPENs
  let activeOpens = 0;
  for (const [, el] of elements) {
    if (el.status === 'active' && el.type === 'OPEN') activeOpens++;
  }
  if (activeOpens > 0) {
    reasons.push(`${activeOpens} active OPEN element(s) remain`);
  }

  // 2. Full basis coverage
  const coverage = computeBasisCoverage(elements);
  if (coverage < 1.0) {
    reasons.push(`Incomplete basis coverage (${(coverage * 100).toFixed(0)}%) — all decisions must ground in GIVENs/CONSTRAINTs`);
  }

  // 3. At least one active BOUNDARY
  let hasBoundary = false;
  for (const [, el] of elements) {
    if (el.status === 'active' && el.type === 'BOUNDARY') {
      hasBoundary = true;
      break;
    }
  }
  if (!hasBoundary) {
    reasons.push('No active BOUNDARY element — at least one required');
  }

  // 4. At least one active DECISION with alternatives
  let hasDecisionWithAlts = false;
  for (const [, el] of elements) {
    if (el.status === 'active' && el.type === 'DECISION' && Array.isArray(el.over) && el.over.length > 0) {
      hasDecisionWithAlts = true;
      break;
    }
  }
  if (!hasDecisionWithAlts) {
    reasons.push('No active DECISION with alternatives — at least one required');
  }

  // 5. At least one element revised after phase transition
  let hasPostTransitionRevision = false;
  for (const [, el] of elements) {
    if (el.revisedInRound !== null && el.revisedInRound > phaseTransitionRound) {
      hasPostTransitionRevision = true;
      break;
    }
  }
  if (!hasPostTransitionRevision) {
    reasons.push('No element has been revised after phase transition');
  }

  // 6. Minimum rounds
  if (round < 3) {
    reasons.push(`Current round (${round}) is below minimum (3)`);
  }

  return {
    permitted: reasons.length === 0,
    reasons,
  };
}
