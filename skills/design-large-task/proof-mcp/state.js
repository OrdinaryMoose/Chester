/**
 * state.js — State lifecycle and persistence for the design proof MCP server.
 * Orchestrates proof.js (element model, integrity) and metrics.js (completeness,
 * challenges, closure). Uses I/O for save/load.
 *
 * Necessary Conditions Model (v2):
 *   - Longer ID prefixes (EVID-, RULE-, PERM-, NCON-, RISK-) avoid collisions
 *   - No resolve operation (OPENs removed)
 *   - Tracks conditionCountHistory instead of openCountHistory
 */

import { readFileSync, writeFileSync } from 'fs';
import { createElement, validateRefs, checkAllIntegrity } from './proof.js';
import { computeCompleteness, computeGroundingCoverage, detectChallenge, detectStall, checkClosure } from './metrics.js';

const ID_PREFIX = {
  EVIDENCE: 'EVID-',
  RULE: 'RULE-',
  PERMISSION: 'PERM-',
  NECESSARY_CONDITION: 'NCON-',
  RISK: 'RISK-',
};

/**
 * Create a clean initial state.
 * @param {string} problemStatement
 * @returns {object}
 */
export function initializeState(problemStatement) {
  return {
    round: 0,
    problemStatement,
    elements: new Map(),
    elementCounters: {
      EVIDENCE: 0, RULE: 0, PERMISSION: 0, NECESSARY_CONDITION: 0, RISK: 0,
    },
    conditionCountHistory: [],
    elementCountHistory: [],
    challengeModesUsed: [],
    challengeLog: [],
    revisionLog: [],
    phaseTransitionRound: 0,
  };
}

/**
 * Generate a new element ID, incrementing the counter for the given type.
 * Returns [id, updatedState] without mutating the input.
 * @param {object} state
 * @param {string} type
 * @returns {[string, object]}
 */
export function generateId(state, type) {
  const newState = structuredClone(state);
  newState.elements = cloneElements(state.elements);

  newState.elementCounters[type]++;
  const id = `${ID_PREFIX[type]}${newState.elementCounters[type]}`;
  return [id, newState];
}

/**
 * Apply a batch of operations to the state. Processes sequentially so
 * later operations can reference elements added earlier in the batch.
 * Returns result object with updated state and metadata.
 * @param {object} state
 * @param {Array<object>} operations
 * @returns {object}
 */
export function applyOperations(state, operations) {
  let current = structuredClone(state);
  current.elements = cloneElements(state.elements);

  current.round++;

  const added = [];
  const revised = [];
  const withdrawn = [];
  const errors = [];

  for (const op of operations) {
    switch (op.op) {
      case 'add': {
        // Validate grounding/basis refs against current elements
        const groundingRefs = op.grounding || [];
        const basisRefs = op.basis || [];
        const allRefs = [...groundingRefs, ...basisRefs];
        const refErrors = validateRefs(allRefs, current.elements);
        if (refErrors.length > 0) {
          errors.push(...refErrors);
          break;
        }
        const [id, newState] = generateId(current, op.type);
        current = newState;
        const element = createElement(op, id, current.round);
        current.elements.set(id, element);
        added.push(id);
        break;
      }
      case 'revise': {
        const target = current.elements.get(op.target);
        if (!target || target.status !== 'active') {
          errors.push(`Cannot revise "${op.target}": element not found or not active`);
          break;
        }
        if (op.statement !== undefined) target.statement = op.statement;
        if (op.grounding !== undefined) target.grounding = op.grounding;
        if (op.basis !== undefined) target.basis = op.basis;
        if (op.collapse_test !== undefined) target.collapse_test = op.collapse_test;
        if (op.reasoning_chain !== undefined) target.reasoning_chain = op.reasoning_chain;
        if (op.rejected_alternatives !== undefined) target.rejected_alternatives = op.rejected_alternatives;
        if (op.relieves !== undefined) target.relieves = op.relieves;
        target.revision++;
        target.revisedInRound = current.round;
        current.revisionLog.push({
          target: op.target,
          round: current.round,
          revision: target.revision,
        });
        revised.push(op.target);
        break;
      }
      case 'withdraw': {
        const target = current.elements.get(op.target);
        if (!target || target.status !== 'active') {
          errors.push(`Cannot withdraw "${op.target}": element not found or not active`);
          break;
        }
        target.status = 'withdrawn';
        withdrawn.push(op.target);
        break;
      }
      default:
        errors.push(`Unknown operation: ${op.op}`);
    }
  }

  // Record history
  let activeConditions = 0;
  for (const [, el] of current.elements) {
    if (el.status === 'active' && el.type === 'NECESSARY_CONDITION') {
      activeConditions++;
    }
  }
  current.conditionCountHistory.push(activeConditions);
  current.elementCountHistory.push(current.elements.size);

  // Compute post-operation metadata
  const integrityWarnings = checkAllIntegrity(current.elements);
  const completeness = {
    ...computeCompleteness(current.elements),
    groundingCoverage: computeGroundingCoverage(current.elements),
  };
  const challengeTrigger = detectChallenge(current);
  const stallDetected = detectStall(current.conditionCountHistory);
  const closure = checkClosure(current);

  return {
    state: current,
    added,
    revised,
    withdrawn,
    errors,
    integrityWarnings,
    completeness,
    challengeTrigger,
    stallDetected,
    closure,
  };
}

/**
 * Mark a challenge mode as used. Returns new state without mutating input.
 * @param {object} state
 * @param {string} mode
 * @returns {object}
 */
export function markChallengeUsed(state, mode) {
  const newState = structuredClone(state);
  newState.elements = cloneElements(state.elements);
  newState.challengeModesUsed.push(mode);
  newState.challengeLog.push(mode);
  return newState;
}

/**
 * Save state to a JSON file.
 * @param {object} state
 * @param {string} filePath
 */
export function saveState(state, filePath) {
  const serializable = {
    ...state,
    elements: Object.fromEntries(state.elements),
  };
  writeFileSync(filePath, JSON.stringify(serializable, null, 2), 'utf-8');
}

/**
 * Load state from a JSON file.
 * @param {string} filePath
 * @returns {object}
 */
export function loadState(filePath) {
  const raw = JSON.parse(readFileSync(filePath, 'utf-8'));
  raw.elements = new Map(Object.entries(raw.elements));
  return raw;
}

/**
 * Clone a Map of elements (structuredClone doesn't handle Map).
 * @param {Map} elements
 * @returns {Map}
 */
function cloneElements(elements) {
  const cloned = new Map();
  for (const [id, el] of elements) {
    cloned.set(id, structuredClone(el));
  }
  return cloned;
}
