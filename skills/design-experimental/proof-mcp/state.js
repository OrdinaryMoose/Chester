/**
 * state.js — State lifecycle and persistence for the design proof MCP server.
 * Orchestrates proof.js (element model, integrity) and metrics.js (completeness,
 * challenges, closure). Uses I/O for save/load.
 */

import { readFileSync, writeFileSync } from 'fs';
import { createElement, validateBasisRefs, checkAllIntegrity } from './proof.js';
import { computeCompleteness, computeBasisCoverage, detectChallenge, detectStall, checkClosure } from './metrics.js';

const ID_PREFIX = {
  GIVEN: 'G',
  CONSTRAINT: 'C',
  ASSERTION: 'A',
  DECISION: 'D',
  OPEN: 'O',
  RISK: 'R',
  BOUNDARY: 'B',
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
    elementCounters: { GIVEN: 0, CONSTRAINT: 0, ASSERTION: 0, DECISION: 0, OPEN: 0, RISK: 0, BOUNDARY: 0 },
    openCountHistory: [],
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
  // structuredClone converts Map to plain object — rebuild it
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
  // Clone state for immutability
  let current = structuredClone(state);
  current.elements = cloneElements(state.elements);

  current.round++;

  const added = [];
  const resolved = [];
  const revised = [];
  const withdrawn = [];
  const errors = [];

  for (const op of operations) {
    switch (op.op) {
      case 'add': {
        // Validate basis refs against current elements (including ones added earlier in batch)
        const basisErrors = validateBasisRefs(op.basis || [], current.elements);
        if (basisErrors.length > 0) {
          errors.push(...basisErrors);
          break;
        }
        const [id, newState] = generateId(current, op.type);
        current = newState;
        const element = createElement(op, id, current.round);
        current.elements.set(id, element);
        added.push(id);
        break;
      }
      case 'resolve': {
        const target = current.elements.get(op.target);
        if (!target || target.status !== 'active') {
          errors.push(`Cannot resolve "${op.target}": element not found or not active`);
          break;
        }
        if (target.type !== 'OPEN') {
          errors.push(`Cannot resolve "${op.target}": element is ${target.type}, not OPEN`);
          break;
        }
        if (!current.elements.has(op.resolved_by)) {
          errors.push(`Cannot resolve "${op.target}": resolved_by "${op.resolved_by}" does not exist`);
          break;
        }
        target.status = 'resolved';
        target.resolvedBy = op.resolved_by;
        resolved.push(op.target);
        break;
      }
      case 'revise': {
        const target = current.elements.get(op.target);
        if (!target || target.status !== 'active') {
          errors.push(`Cannot revise "${op.target}": element not found or not active`);
          break;
        }
        if (op.statement !== undefined) target.statement = op.statement;
        if (op.basis !== undefined) target.basis = op.basis;
        if (op.over !== undefined) target.over = op.over;
        if (op.confidence !== undefined) target.confidence = op.confidence;
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
  let activeOpens = 0;
  let activeCount = 0;
  for (const [, el] of current.elements) {
    if (el.status === 'active') {
      activeCount++;
      if (el.type === 'OPEN') activeOpens++;
    }
  }
  current.openCountHistory.push(activeOpens);
  current.elementCountHistory.push(current.elements.size);

  // Compute post-operation metadata
  const integrityWarnings = checkAllIntegrity(current.elements);
  const completeness = {
    ...computeCompleteness(current.elements),
    basisCoverage: computeBasisCoverage(current.elements),
  };
  const challengeTrigger = detectChallenge(current);
  const stallDetected = detectStall(current.openCountHistory);
  const closure = checkClosure(current);

  return {
    state: current,
    added,
    resolved,
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
