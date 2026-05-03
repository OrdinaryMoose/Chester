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
  RESOLVE_CONDITION: 'RCON-',
  FRICTION: 'FRIC-',
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
      EVIDENCE: 0, RULE: 0, PERMISSION: 0, NECESSARY_CONDITION: 0, RISK: 0, RESOLVE_CONDITION: 0, FRICTION: 0,
    },
    conditionCountHistory: [],
    elementCountHistory: [],
    challengeModesUsed: [],
    challengeLog: [],
    revisionLog: [],
    phaseTransitionRound: 0,
    concerns: [],
    concernsLocked: false,
    concernCounter: 0,
    ratificationLog: [],
  };
}

/**
 * Append a Concern to state. Refuses if Concerns list is locked.
 * @param {object} state
 * @param {{label: string, description?: string}} input
 * @returns {[string|null, object, string|null]} [concernId, newState, error]
 */
export function addConcern(state, { label, description }) {
  if (state.concernsLocked) {
    return [null, state, 'Concerns are locked; cannot add'];
  }
  const newState = structuredClone(state);
  newState.elements = cloneElements(state.elements);
  newState.concernCounter++;
  const id = `CERN-${newState.concernCounter}`;
  newState.concerns.push({ id, label, description: description ?? null });
  return [id, newState, null];
}

/**
 * Lock the Concerns list. Refuses on empty list or already-locked list.
 * @param {object} state
 * @returns {[object, string|null]} [newState, error]
 */
export function lockConcerns(state) {
  if (state.concernsLocked) {
    return [state, 'Concerns already locked'];
  }
  if (state.concerns.length === 0) {
    return [state, 'Cannot lock empty Concerns list'];
  }
  const newState = structuredClone(state);
  newState.elements = cloneElements(state.elements);
  newState.concernsLocked = true;
  return [newState, null];
}

/**
 * Ratify a single Resolve Condition. Refuses non-RC, withdrawn, unknown, or empty text.
 * Sequential by design — caller passes a single elementId.
 * @param {object} state
 * @param {{elementId: string, ratificationText: string}} input
 * @returns {[object, string|null]} [newState, error]
 */
export function ratifyResolveCondition(state, { elementId, ratificationText }) {
  const target = state.elements.get(elementId);
  if (!target) {
    return [state, `Element "${elementId}" not found`];
  }
  if (target.type !== 'RESOLVE_CONDITION') {
    return [state, `Element "${elementId}" is not a RESOLVE_CONDITION`];
  }
  if (target.status !== 'active') {
    return [state, `Element "${elementId}" is not active`];
  }
  if (!ratificationText || typeof ratificationText !== 'string') {
    return [state, 'Ratification text is required'];
  }
  const newState = structuredClone(state);
  newState.elements = cloneElements(state.elements);
  const updatedTarget = newState.elements.get(elementId);
  updatedTarget.ratification = { ratifiedAtRound: state.round, text: ratificationText };
  newState.ratificationLog.push({
    event: 'ratified',
    target: elementId,
    round: state.round,
    ratificationText,
  });
  return [newState, null];
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
        // RESOLVE_CONDITION: validate problem_anchor references an existing Concern
        if (op.type === 'RESOLVE_CONDITION' && op.problem_anchor) {
          const anchorExists = current.concerns.some(c => c.id === op.problem_anchor);
          if (!anchorExists) {
            errors.push(`Resolve Condition problem_anchor "${op.problem_anchor}" does not reference an existing Concern`);
            break;
          }
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
        // Detect ratification-clearing fields BEFORE applying changes
        const semanticFieldsChanged = [];
        if (op.statement !== undefined && target.statement !== op.statement) {
          semanticFieldsChanged.push('statement');
        }
        if (op.problem_anchor !== undefined && target.problem_anchor !== op.problem_anchor) {
          semanticFieldsChanged.push('problem_anchor');
        }
        if (op.statement !== undefined) target.statement = op.statement;
        if (op.problem_anchor !== undefined) target.problem_anchor = op.problem_anchor;
        if (op.grounding !== undefined) target.grounding = op.grounding;
        if (op.basis !== undefined) target.basis = op.basis;
        if (op.collapse_test !== undefined) target.collapse_test = op.collapse_test;
        if (op.reasoning_chain !== undefined) target.reasoning_chain = op.reasoning_chain;
        if (op.rejected_alternatives !== undefined) target.rejected_alternatives = op.rejected_alternatives;
        if (op.relieves !== undefined) target.relieves = op.relieves;
        // Clear ratification if a ratified RESOLVE_CONDITION had statement or problem_anchor revised
        if (
          target.type === 'RESOLVE_CONDITION' &&
          target.ratification !== null &&
          semanticFieldsChanged.length > 0
        ) {
          target.ratification = null;
          current.ratificationLog.push({
            event: 'cleared-on-revise',
            target: op.target,
            round: current.round,
            fields: semanticFieldsChanged,
          });
        }
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
  // Backfill cluster-A fields when loading pre-cluster-A state files
  raw.concerns ??= [];
  raw.concernsLocked ??= false;
  raw.concernCounter ??= 0;
  raw.ratificationLog ??= [];
  raw.elementCounters.RESOLVE_CONDITION ??= 0;
  for (const [, el] of raw.elements) {
    el.problem_anchor ??= null;
    el.ratification ??= null;
  }
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
