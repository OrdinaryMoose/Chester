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

import { readFileSync, writeFileSync, renameSync } from 'fs';
import { createElement, validateRefs, checkAllIntegrity, FRICTION_DISPOSITIONS, TERMINAL_FRICTION_DISPOSITIONS, WITHDRAWAL_DISPOSITIONS, UNCLASSIFIED_DISPOSITION, SCHEMA_VERSION, DISPOSITIONS_BY_CATEGORY, validateConsentToken } from './proof.js';
import { computeCompleteness, computeGroundingCoverage, detectChallenge, detectStall, checkClosure } from './metrics.js';
import { runFrictionDetection } from './friction-detection.js';
import { validateDefinitionInput, createDefinition, queryOverlapCandidates } from './definitions.js';
import { deriveClosingArgument } from './closing-argument.js';

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
    schemaVersion: SCHEMA_VERSION,
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
    frictionLog: [],
    closingArgPresentedRound: null,
    closingArgGoRound: null,
    proofStatus: 'unopen',
    lastClosureArtifact: null,
    operationLog: [],
    definitions: [],
    definitionCounter: 0,
    definitionLog: [],
  };
}

/**
 * Append an entry to state.operationLog. Mutates state in place.
 * Intended use: only inside a mutating export, after state has been cloned and
 * after the mutation has succeeded — this writes to the cloned state, never
 * the caller's reference.
 * @param {object} state - cloned state to append to
 * @param {object} entry - { round, op, entityId?, type?, consent?, changedFields?, provenance? }
 */
export function appendOperationLog(state, entry) {
  state.operationLog = state.operationLog || [];
  state.operationLog.push({
    round: entry.round,
    op: entry.op,
    entityId: entry.entityId ?? null,
    type: entry.type ?? null,
    consent: entry.consent ?? null,
    changedFields: entry.changedFields ?? null,
    provenance: entry.provenance ?? null,
  });
}

/**
 * Mutates the passed state in-place, clearing both two-yes closing flags.
 * Intended to be called on an already-cloned `newState` inside a mutating export,
 * after the export's own structuredClone+cloneElements.
 *
 * Inline-set discipline: do NOT call this helper from outside a mutating function's
 * body — it does not clone, so calling it on shared state will mutate the caller's
 * reference. Exported only so tests can verify the flag-clearing invariant on a
 * known clone.
 * @param {object} state
 * @returns {object} same reference passed in
 */
export function clearClosingFlags(state) {
  state.closingArgPresentedRound = null;
  state.closingArgGoRound = null;
  return state;
}

/**
 * Record that the closing argument was presented in the current round.
 * Returns a new state without mutating input.
 * @param {object} state
 * @param {object} consent - Consent token; validated pre-flight.
 * @returns {[object, string|null]} [newState, error]
 */
export function recordClosingArgPresented(state, consent) {
  const consentCheck = validateConsentToken(consent);
  if (!consentCheck.valid) {
    return [state, `INVALID_CONSENT: ${consentCheck.reason}`];
  }
  const newState = structuredClone(state);
  newState.elements = cloneElements(state.elements);
  newState.closingArgPresentedRound = newState.round;
  return [newState, null];
}

/**
 * Record designer's "go" decision. Refuses if the closing argument was not
 * presented in the current round (mismatch indicates state has shifted since
 * presentation; designer must re-present).
 *
 * On success, this is the proof's closure transition (RULE-9):
 *   - Sets proofStatus = 'closed'
 *   - Bulk-ratifies every active draft NECESSARY_CONDITION
 *   - Bulk-ratifies every active RESOLVE_CONDITION lacking ratification
 *   - Preserves both closingArgPresentedRound and closingArgGoRound (does NOT
 *     clear them — closure must remain observable). All other mutating
 *     functions clear these flags; recordDesignerGo is the documented exception.
 *
 * Withdrawn elements are never touched.
 * @param {object} state
 * @param {object} consent - Consent token; validated pre-flight.
 * @returns {[object, string|null]} [newState, error]
 */
export function recordDesignerGo(state, consent) {
  const consentCheck = validateConsentToken(consent);
  if (!consentCheck.valid) {
    return [state, `INVALID_CONSENT: ${consentCheck.reason}`];
  }
  if (state.closingArgPresentedRound !== state.round) {
    const presentedDesc = state.closingArgPresentedRound ?? 'never';
    return [state, `GO_REQUIRES_VIEW_THIS_ROUND: closing argument presented in round ${presentedDesc}, current round ${state.round}; call present_closing_argument first`];
  }
  const newState = structuredClone(state);
  newState.elements = cloneElements(state.elements);
  newState.closingArgGoRound = newState.round;
  // closure transition (RULE-9): proofStatus -> 'closed'.
  // initializeState seeds 'unopen'; open_proof flips to 'open'; reopenProof returns
  // 'open' after a closed cycle. Both 'open' and 'unopen' are legitimate prior states.
  const fromStatus = newState.proofStatus ?? 'unopen';
  newState.proofStatus = 'closed';
  // bulk-ratify draft NCs (active only)
  const ratifiedNCs = [];
  // bulk-ratify unratified active RCs
  const ratifiedRCs = [];
  for (const [id, el] of newState.elements) {
    if (el.type === 'NECESSARY_CONDITION' && el.status === 'active' && el.ratificationStatus === 'draft') {
      el.ratificationStatus = 'ratified';
      ratifiedNCs.push(id);
    } else if (el.type === 'RESOLVE_CONDITION' && el.status === 'active' && !el.ratification) {
      el.ratification = { ratifiedAtRound: newState.round, text: 'bulk-ratified at confirm_closure_go (RULE-9)' };
      ratifiedRCs.push(id);
    }
  }
  appendOperationLog(newState, {
    round: newState.round,
    op: 'close',
    entityId: null,
    type: null,
    consent,
    changedFields: ['proofStatus'],
    provenance: { from: fromStatus, to: 'closed' },
  });
  appendOperationLog(newState, {
    round: newState.round,
    op: 'bulk-ratify',
    entityId: null,
    type: 'NECESSARY_CONDITION',
    consent,
    changedFields: ['ratificationStatus'],
    provenance: { count: ratifiedNCs.length, elementIds: ratifiedNCs },
  });
  appendOperationLog(newState, {
    round: newState.round,
    op: 'bulk-ratify',
    entityId: null,
    type: 'RESOLVE_CONDITION',
    consent,
    changedFields: ['ratification'],
    provenance: { count: ratifiedRCs.length, elementIds: ratifiedRCs },
  });
  return [newState, null];
}

/**
 * Reopen a closed proof. Captures the pre-reopen closing-argument envelope
 * into `lastClosureArtifact` (load-bearing audit snapshot per AC-5.4),
 * clears both two-yes flags, and transitions proofStatus 'closed' → 'open'.
 *
 * Refuses if proof is not currently closed (NOT_CLOSED) or consent is invalid
 * (INVALID_CONSENT). Preserves `concernsLocked` as-is — reopening does not
 * unlock Concerns.
 * @param {object} state
 * @param {object} consent - Consent token; validated pre-flight.
 * @returns {[object, string|null]} [newState, error]
 */
export function reopenProof(state, consent) {
  const consentCheck = validateConsentToken(consent);
  if (!consentCheck.valid) {
    return [state, `INVALID_CONSENT: ${consentCheck.reason}`];
  }
  if (state.proofStatus !== 'closed') {
    return [state, `NOT_CLOSED: proofStatus is ${state.proofStatus}`];
  }
  const newState = structuredClone(state);
  newState.elements = cloneElements(state.elements);
  // Capture pre-reopen envelope. deriveClosingArgument is pure (Task 13);
  // pass the original (pre-clone) state — it does not mutate.
  newState.lastClosureArtifact = deriveClosingArgument(state);
  newState.closingArgPresentedRound = null;
  newState.closingArgGoRound = null;
  newState.proofStatus = 'open';
  // concernsLocked intentionally preserved as-is.
  appendOperationLog(newState, {
    round: newState.round,
    op: 'reopen',
    entityId: null,
    type: null,
    consent,
    changedFields: ['proofStatus'],
    provenance: { from: 'closed', to: 'open' },
  });
  return [newState, null];
}

/**
 * Run friction detection on state and return [updatedState, hints].
 * Auto-creates FRICTION elements for high-confidence shapes (currently
 * permission-risk-linkage); other shapes flow back as hints for the caller.
 *
 * Critical: callers MUST rebind their state variable from the returned state.
 * Auto-created FRICTION elements live only in the returned state.
 * @param {object} state
 * @returns {{state: object, hints: Array<object>}}
 */
function processFriction(state, parentConsent = null, parentOp = null) {
  const { hints, autoCreate } = runFrictionDetection(state.elements, state.concerns);
  for (const candidate of autoCreate) {
    const [id, withId] = generateId(state, 'FRICTION');
    state = withId;
    const element = createElement({
      type: 'FRICTION',
      friction_shape: candidate.friction_shape,
      anchor_a: candidate.anchor_a,
      anchor_b: candidate.anchor_b,
      disposition: 'lived-with',
      statement: candidate.statement,
      source: 'agent-derivation',
    }, id, state.round);
    element.creationConsent = parentConsent ?? null;
    state.elements.set(id, element);
    state.frictionLog.push({
      event: 'auto-added',
      frictionId: id,
      round: state.round,
      friction_shape: candidate.friction_shape,
      disposition: 'lived-with',
      parentConsent: parentConsent ?? null,
      parentOp: parentOp ?? null,
    });
    appendOperationLog(state, {
      round: state.round,
      op: 'auto-create-friction',
      entityId: id,
      type: 'FRICTION',
      consent: parentConsent ?? null,
      changedFields: null,
      provenance: {
        shape: candidate.friction_shape,
        anchor_a: candidate.anchor_a,
        anchor_b: candidate.anchor_b,
        parentOp: parentOp ?? null,
        parentConsent: parentConsent ?? null,
      },
    });
  }
  return { state, hints };
}

/**
 * Append a Concern to state. Refuses if Concerns list is locked.
 * @param {object} state
 * @param {{label: string, description?: string}} input
 * @returns {[string|null, object, Array<object>, string|null]} [concernId, newState, friction_hints, error]
 */
export function addConcern(state, { label, description }, consent) {
  const consentCheck = validateConsentToken(consent);
  if (!consentCheck.valid) {
    return [null, state, [], `INVALID_CONSENT: ${consentCheck.reason}`];
  }
  if (state.concernsLocked) {
    return [null, state, [], 'Concerns are locked; cannot add'];
  }
  let newState = structuredClone(state);
  newState.elements = cloneElements(state.elements);
  newState.closingArgPresentedRound = null;
  newState.closingArgGoRound = null;
  newState.concernCounter++;
  const id = `CERN-${newState.concernCounter}`;
  newState.concerns.push({ id, label, description: description ?? null, status: 'draft' });
  appendOperationLog(newState, {
    round: newState.round,
    op: 'add',
    entityId: id,
    type: 'CONCERN',
    consent,
    changedFields: null,
    provenance: { initialPayload: { label, description: description ?? null } },
  });
  const fricResult = processFriction(newState, consent, 'addConcern');
  newState = fricResult.state;
  return [id, newState, fricResult.hints, null];
}

/**
 * Lock the Concerns list. Refuses on empty list or already-locked list.
 * @param {object} state
 * @returns {[object, Array<object>, string|null]} [newState, friction_hints, error]
 */
export function lockConcerns(state, consent) {
  const consentCheck = validateConsentToken(consent);
  if (!consentCheck.valid) {
    return [state, [], `INVALID_CONSENT: ${consentCheck.reason}`];
  }
  if (state.concernsLocked) {
    return [state, [], 'Concerns already locked'];
  }
  if (state.concerns.length === 0) {
    return [state, [], 'Cannot lock empty Concerns list'];
  }
  let newState = structuredClone(state);
  newState.elements = cloneElements(state.elements);
  newState.closingArgPresentedRound = null;
  newState.closingArgGoRound = null;
  newState.concernsLocked = true;
  appendOperationLog(newState, {
    round: newState.round,
    op: 'lock',
    entityId: null,
    type: null,
    consent,
    changedFields: ['concernsLocked'],
    provenance: { concernCount: newState.concerns.length },
  });
  const fricResult = processFriction(newState, consent, 'lockConcerns');
  newState = fricResult.state;
  return [newState, fricResult.hints, null];
}

/**
 * Ratify a single Concern. Transitions Concern.status from 'draft' to 'ratified'.
 * Refuses unknown id (NOT_FOUND) or invalid consent (INVALID_CONSENT).
 * Clears two-yes closing flags and appends an operationLog entry.
 * @param {object} state
 * @param {string} concernId
 * @param {object} consent
 * @returns {[object, string|null]} [newState, error]
 */
export function ratifyConcern(state, concernId, consent) {
  const consentCheck = validateConsentToken(consent);
  if (!consentCheck.valid) {
    return [state, `INVALID_CONSENT: ${consentCheck.reason}`];
  }
  const exists = state.concerns.some(c => c.id === concernId);
  if (!exists) {
    return [state, `NOT_FOUND: concern ${concernId} not found`];
  }
  const newState = structuredClone(state);
  newState.elements = cloneElements(state.elements);
  newState.closingArgPresentedRound = null;
  newState.closingArgGoRound = null;
  const concern = newState.concerns.find(c => c.id === concernId);
  const before = concern.status ?? 'draft';
  concern.status = 'ratified';
  newState.ratificationLog.push({
    event: 'concern-ratified',
    concernId,
    round: newState.round,
  });
  appendOperationLog(newState, {
    round: newState.round,
    op: 'ratify',
    entityId: concernId,
    type: 'CONCERN',
    consent,
    changedFields: ['status'],
    provenance: { before, after: 'ratified' },
  });
  return [newState, null];
}

/**
 * Ratify a single Resolve Condition. Refuses non-RC, withdrawn, unknown, or empty text.
 * Sequential by design — caller passes a single elementId.
 * @param {object} state
 * @param {{elementId: string, ratificationText: string}} input
 * @returns {[object, Array<object>, string|null]} [newState, friction_hints, error]
 */
export function ratifyResolveCondition(state, { elementId, ratificationText }, consent) {
  const consentCheck = validateConsentToken(consent);
  if (!consentCheck.valid) {
    return [state, [], `INVALID_CONSENT: ${consentCheck.reason}`];
  }
  const target = state.elements.get(elementId);
  if (!target) {
    return [state, [], `Element "${elementId}" not found`];
  }
  if (target.type !== 'RESOLVE_CONDITION') {
    return [state, [], `Element "${elementId}" is not a RESOLVE_CONDITION`];
  }
  if (target.status !== 'active') {
    return [state, [], `Element "${elementId}" is not active`];
  }
  if (!ratificationText || typeof ratificationText !== 'string') {
    return [state, [], 'Ratification text is required'];
  }
  let newState = structuredClone(state);
  newState.elements = cloneElements(state.elements);
  newState.closingArgPresentedRound = null;
  newState.closingArgGoRound = null;
  const updatedTarget = newState.elements.get(elementId);
  updatedTarget.ratification = { ratifiedAtRound: state.round, text: ratificationText };
  newState.ratificationLog.push({
    event: 'ratified',
    target: elementId,
    round: state.round,
    ratificationText,
  });
  appendOperationLog(newState, {
    round: newState.round,
    op: 'ratify',
    entityId: elementId,
    type: 'RESOLVE_CONDITION',
    consent,
    changedFields: ['ratification'],
    provenance: { ratificationText },
  });
  const fricResult = processFriction(newState, consent, 'ratifyResolveCondition');
  newState = fricResult.state;
  return [newState, fricResult.hints, null];
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
export function applyOperations(state, operations, consent) {
  const consentCheck = validateConsentToken(consent);
  if (!consentCheck.valid) {
    // Preserve return-object shape; do NOT clone, increment round, or clear flags.
    return {
      state,
      added: [],
      revised: [],
      withdrawn: [],
      errors: [`INVALID_CONSENT: ${consentCheck.reason}`],
      integrityWarnings: [],
      completeness: null,
      challengeTrigger: null,
      stallDetected: false,
      closure: { permitted: false, reasons: [] },
      friction_hints: [],
    };
  }
  let current = structuredClone(state);
  current.elements = cloneElements(state.elements);
  current.closingArgPresentedRound = null;
  current.closingArgGoRound = null;

  current.round++;

  const added = [];
  const revised = [];
  const withdrawn = [];
  const errors = [];

  for (const op of operations) {
    switch (op.op) {
      case 'add': {
        // FRICTION elements must come through manage_friction (which pre-validates
        // anchor existence and emits the structured frictionLog 'added' event).
        // Block here to avoid two creation paths with divergent validation.
        if (op.type === 'FRICTION') {
          errors.push('Cannot add FRICTION via submit_proof_update; use manage_friction tool');
          break;
        }
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
        appendOperationLog(current, {
          round: current.round,
          op: 'add',
          entityId: id,
          type: op.type,
          consent,
          changedFields: null,
          provenance: { initialPayload: { ...op } },
        });
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
        const changedFields = [];
        const before = {};
        const after = {};
        const noteChange = (field, value) => {
          before[field] = target[field];
          target[field] = value;
          after[field] = value;
          changedFields.push(field);
        };
        if (op.statement !== undefined) noteChange('statement', op.statement);
        if (op.problem_anchor !== undefined) noteChange('problem_anchor', op.problem_anchor);
        if (op.grounding !== undefined) noteChange('grounding', op.grounding);
        if (op.basis !== undefined) noteChange('basis', op.basis);
        if (op.collapse_test !== undefined) noteChange('collapse_test', op.collapse_test);
        if (op.reasoning_chain !== undefined) noteChange('reasoning_chain', op.reasoning_chain);
        if (op.rejected_alternatives !== undefined) noteChange('rejected_alternatives', op.rejected_alternatives);
        if (op.relieves !== undefined) noteChange('relieves', op.relieves);
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
        // Reset NC ratificationStatus to 'draft' on statement or grounding revise
        // (NC-18, RULE-8). Mirrors RC ratification-clearing-on-revise.
        if (
          target.type === 'NECESSARY_CONDITION' &&
          (op.statement !== undefined || op.grounding !== undefined)
        ) {
          target.ratificationStatus = 'draft';
        }
        target.revision++;
        target.revisedInRound = current.round;
        current.revisionLog.push({
          target: op.target,
          round: current.round,
          revision: target.revision,
        });
        revised.push(op.target);
        appendOperationLog(current, {
          round: current.round,
          op: 'revise',
          entityId: op.target,
          type: target.type,
          consent,
          changedFields,
          provenance: { before, after, revision: target.revision },
        });
        break;
      }
      case 'withdraw': {
        const target = current.elements.get(op.target);
        if (!target || target.status !== 'active') {
          errors.push(`Cannot withdraw "${op.target}": element not found or not active`);
          break;
        }
        // FRICTION elements must come through override_friction_disposition
        // (which uses friction-side disposition vocabulary). Avoid the
        // semantic-collision shape where withdrawal_disposition and FRICTION's
        // own disposition would both apply to the same element.
        if (target.type === 'FRICTION') {
          errors.push(`Cannot withdraw "${op.target}" via submit_proof_update; use override_friction_disposition with a terminal disposition (dissolved-by-revision, dissolved-by-scope-cut, not-really-friction)`);
          break;
        }
        let disposition;
        if (op.withdrawal_disposition === undefined) {
          disposition = UNCLASSIFIED_DISPOSITION;
        } else if (!WITHDRAWAL_DISPOSITIONS.includes(op.withdrawal_disposition)) {
          errors.push(`Cannot withdraw "${op.target}": withdrawal_disposition must be one of ${WITHDRAWAL_DISPOSITIONS.join(', ')}; got ${op.withdrawal_disposition}`);
          break;
        } else {
          disposition = op.withdrawal_disposition;
        }
        target.status = 'withdrawn';
        target.withdrawal_disposition = disposition;
        withdrawn.push(op.target);
        appendOperationLog(current, {
          round: current.round,
          op: 'withdraw',
          entityId: op.target,
          type: target.type,
          consent,
          changedFields: ['status', 'withdrawal_disposition'],
          provenance: { withdrawal_disposition: disposition },
        });
        break;
      }
      default:
        errors.push(`Unknown operation: ${op.op}`);
    }
  }

  // Run friction detection BEFORE history/metrics so auto-created FRICTION
  // elements participate in the post-operation snapshot. Rebinding `current`
  // here is load-bearing — without it, auto-created FRICTION elements vanish.
  const fricResult = processFriction(current, consent, 'applyOperations');
  current = fricResult.state;
  const friction_hints = fricResult.hints;

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
    ...computeCompleteness(current.elements, current),
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
    friction_hints,
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
  newState.closingArgPresentedRound = null;
  newState.closingArgGoRound = null;
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
  const tmpPath = filePath + '.tmp';
  writeFileSync(tmpPath, JSON.stringify(serializable, null, 2), 'utf-8');
  renameSync(tmpPath, filePath);
}

/**
 * Load state from a JSON file.
 * @param {string} filePath
 * @returns {object}
 */
export function loadState(filePath) {
  const raw = JSON.parse(readFileSync(filePath, 'utf-8'));
  // Refuse forward-incompatible state before any backfill — newer schemas may
  // carry fields whose absence we'd silently paper over with `??=` defaults.
  if (raw.schemaVersion !== undefined && raw.schemaVersion > SCHEMA_VERSION) {
    const err = new Error(`schemaVersion ${raw.schemaVersion} exceeds runtime SCHEMA_VERSION ${SCHEMA_VERSION}`);
    err.code = 'SCHEMA_VERSION_TOO_NEW';
    throw err;
  }
  raw.schemaVersion ??= SCHEMA_VERSION;
  raw.elements = new Map(Object.entries(raw.elements));
  // Backfill cluster-A fields when loading pre-cluster-A state files
  raw.concerns ??= [];
  raw.concernsLocked ??= false;
  raw.concernCounter ??= 0;
  // Backfill per-Concern status: locked-list legacy state implies all concerns
  // were already ratified under the prior model; unlocked legacy state defaults
  // each concern to draft.
  const defaultConcernStatus = raw.concernsLocked ? 'ratified' : 'draft';
  for (const c of raw.concerns) {
    c.status ??= defaultConcernStatus;
  }
  raw.ratificationLog ??= [];
  raw.frictionLog ??= [];
  raw.elementCounters.RESOLVE_CONDITION ??= 0;
  raw.elementCounters.FRICTION ??= 0;
  raw.closingArgPresentedRound ??= null;
  raw.closingArgGoRound ??= null;
  raw.proofStatus ??= 'unopen';
  raw.lastClosureArtifact ??= null;
  raw.operationLog ??= [];
  raw.definitions ??= [];
  raw.definitionCounter ??= 0;
  raw.definitionLog ??= [];
  for (const d of raw.definitions) {
    d.status ??= 'draft';
    d.aliases ??= [];
    d.sense_constraints ??= null;
    d.history ??= [];
    d.revision ??= 0;
    d.revisedInRound ??= null;
  }
  for (const [, el] of raw.elements) {
    el.problem_anchor ??= null;
    el.ratification ??= null;
    if (el.status === 'withdrawn') el.withdrawal_disposition ??= UNCLASSIFIED_DISPOSITION;
    // NC-only ratificationStatus (NC-18, RULE-8): legacy NCs default to 'draft'.
    if (el.type === 'NECESSARY_CONDITION') el.ratificationStatus ??= 'draft';
    // FRICTION source (NC-3): legacy frictions default to 'agent-derivation'.
    if (el.type === 'FRICTION') el.source ??= 'agent-derivation';
  }
  return raw;
}

/**
 * Add a FRICTION element. Validates anchors exist before creation.
 * Appends an 'added' entry to frictionLog.
 * @param {object} state
 * @param {object} input - { op: 'add', friction_shape, anchor_a, anchor_b, disposition, statement? }
 * @returns {[string|null, object, Array<object>, string|null]} [id, newState, friction_hints, error] — id is null when error is non-null. Mirrors addConcern.
 */
export function manageFriction(state, input, consent) {
  const consentCheck = validateConsentToken(consent);
  if (!consentCheck.valid) {
    return [null, state, [], `INVALID_CONSENT: ${consentCheck.reason}`];
  }
  const { op } = input;
  if (op !== 'add') {
    return [null, state, [], `Unknown manage_friction op: ${op}`];
  }
  if (!state.elements.has(input.anchor_a)) {
    return [null, state, [], `unknown element id: ${input.anchor_a}`];
  }
  if (!state.elements.has(input.anchor_b)) {
    return [null, state, [], `unknown element id: ${input.anchor_b}`];
  }
  const [id, withId] = generateId(state, 'FRICTION');
  withId.closingArgPresentedRound = null;
  withId.closingArgGoRound = null;
  let element;
  try {
    element = createElement({ ...input, type: 'FRICTION' }, id, withId.round);
  } catch (e) {
    return [null, state, [], e.message];
  }
  withId.elements.set(id, element);
  withId.frictionLog.push({
    event: 'added',
    frictionId: id,
    round: withId.round,
    friction_shape: input.friction_shape,
    disposition: input.disposition,
  });
  appendOperationLog(withId, {
    round: withId.round,
    op: 'add',
    entityId: id,
    type: 'FRICTION',
    consent,
    changedFields: null,
    provenance: {
      initialPayload: {
        friction_shape: input.friction_shape,
        anchor_a: input.anchor_a,
        anchor_b: input.anchor_b,
        disposition: input.disposition,
        statement: input.statement ?? null,
      },
    },
  });
  const fricResult = processFriction(withId, consent, 'manageFriction');
  return [id, fricResult.state, fricResult.hints, null];
}

/**
 * Override a FRICTION element's disposition. Logs the change; for terminal
 * dispositions (dissolved-by-revision, dissolved-by-scope-cut, not-really-friction)
 * also marks the element withdrawn and logs a 'dismissed' event.
 * @param {object} state
 * @param {{elementId: string, disposition: string}} input
 * @returns {[object, Array<object>, string|null]} [newState, friction_hints, error]
 */
export function overrideFrictionDisposition(state, { elementId, disposition }, consent) {
  const consentCheck = validateConsentToken(consent);
  if (!consentCheck.valid) {
    return [state, [], `INVALID_CONSENT: ${consentCheck.reason}`];
  }
  const target = state.elements.get(elementId);
  if (!target) {
    return [state, [], `unknown element id: ${elementId}`];
  }
  if (target.type !== 'FRICTION') {
    return [state, [], `element_id must be FRICTION; got ${elementId} (type: ${target.type})`];
  }
  if (!FRICTION_DISPOSITIONS.includes(disposition)) {
    return [state, [], `disposition must be one of: ${FRICTION_DISPOSITIONS.join(', ')}; got ${disposition}`];
  }
  let newState = structuredClone(state);
  newState.elements = cloneElements(state.elements);
  newState.closingArgPresentedRound = null;
  newState.closingArgGoRound = null;
  const t = newState.elements.get(elementId);
  const oldDisposition = t.disposition;
  t.disposition = disposition;
  newState.frictionLog.push({
    event: 'disposition-changed',
    frictionId: elementId,
    round: newState.round,
    oldDisposition,
    newDisposition: disposition,
  });
  const changedFields = ['disposition'];
  if (TERMINAL_FRICTION_DISPOSITIONS.includes(disposition)) {
    t.status = 'withdrawn';
    changedFields.push('status');
    newState.frictionLog.push({
      event: 'dismissed',
      frictionId: elementId,
      round: newState.round,
    });
  }
  appendOperationLog(newState, {
    round: newState.round,
    op: 'revise',
    entityId: elementId,
    type: 'FRICTION',
    consent,
    changedFields,
    provenance: {
      before: { disposition: oldDisposition },
      after: { disposition },
    },
  });
  const fricResult = processFriction(newState, consent, 'overrideFrictionDisposition');
  newState = fricResult.state;
  return [newState, fricResult.hints, null];
}

/**
 * Manage Definitions (vocabulary entries) on the proof state.
 *
 * Ops:
 *   - 'add'           : create a draft Definition; requires consent
 *   - 'revise'        : update definition/sense_constraints/aliases on an
 *                       existing Definition; appends a history entry; requires consent
 *   - 'ratify'        : transition status draft → ratified; requires consent
 *   - 'query-overlap' : token-overlap search; consent NOT required
 *   - 'deprecate'     : routes to universal withdraw (Task 10); returns DOMAIN_ERROR stub here
 *
 * @param {object} state
 * @param {string} op
 * @param {object} payload
 * @param {object} consent
 * @returns {[any, object, string|null]} [id_or_matches, newState, errorOrNull]
 */
export function manageDefinitions(state, op, payload, consent) {
  // query-overlap is a read-only op — no consent required.
  if (op === 'query-overlap') {
    const matches = queryOverlapCandidates(state.definitions ?? [], payload?.canonical_name ?? '');
    return [matches, state, null];
  }

  const consentCheck = validateConsentToken(consent);
  if (!consentCheck.valid) {
    return [null, state, `INVALID_CONSENT: ${consentCheck.reason}`];
  }

  if (op === 'deprecate') {
    return [null, state, "DOMAIN_ERROR: use withdraw(category: 'DEFINITION', id, disposition, consent) for deprecation"];
  }

  if (op === 'add') {
    const v = validateDefinitionInput(payload);
    if (!v.valid) {
      return [null, state, `DOMAIN_ERROR: ${v.reason}`];
    }
    let newState = structuredClone(state);
    newState.elements = cloneElements(state.elements);
    newState.closingArgPresentedRound = null;
    newState.closingArgGoRound = null;
    newState.definitionCounter++;
    const id = `DEFN-${newState.definitionCounter}`;
    const source = consent.source === 'designer' ? 'designer' : 'agent-derivation';
    const def = createDefinition(payload, id, newState.round, source);
    newState.definitions.push(def);
    newState.definitionLog.push({
      event: 'added',
      definitionId: id,
      round: newState.round,
      canonical_name: def.canonical_name,
    });
    appendOperationLog(newState, {
      round: newState.round,
      op: 'add',
      entityId: id,
      type: 'DEFINITION',
      consent,
      changedFields: null,
      provenance: {
        initialPayload: {
          canonical_name: def.canonical_name,
          aliases: def.aliases,
          definition: def.definition,
          sense_constraints: def.sense_constraints,
        },
      },
    });
    const friction = processFriction(newState, consent, 'manageDefinitions:add');
    return [id, friction.state, null];
  }

  if (op === 'revise') {
    const id = payload?.id;
    if (!id) return [null, state, 'DOMAIN_ERROR: id required for revise'];
    const target = (state.definitions ?? []).find(d => d.id === id);
    if (!target) {
      return [null, state, `NOT_FOUND: definition ${id} not found`];
    }
    if (target.status === 'withdrawn' || target.status === 'deprecated') {
      return [null, state, `DOMAIN_ERROR: cannot revise definition ${id} with status ${target.status}`];
    }
    let newState = structuredClone(state);
    newState.elements = cloneElements(state.elements);
    newState.closingArgPresentedRound = null;
    newState.closingArgGoRound = null;
    const t = newState.definitions.find(d => d.id === id);
    const before = {
      definition: t.definition,
      sense_constraints: t.sense_constraints,
      aliases: [...(t.aliases ?? [])],
    };
    const changedFields = [];
    if (payload.definition !== undefined && payload.definition !== t.definition) {
      t.definition = payload.definition;
      changedFields.push('definition');
    }
    if (payload.sense_constraints !== undefined && payload.sense_constraints !== t.sense_constraints) {
      t.sense_constraints = payload.sense_constraints;
      changedFields.push('sense_constraints');
    }
    if (payload.aliases !== undefined) {
      t.aliases = payload.aliases;
      changedFields.push('aliases');
    }
    t.history = t.history ?? [];
    t.history.push({
      round: newState.round,
      definition: before.definition,
      sense_constraints: before.sense_constraints,
      aliases: before.aliases,
    });
    t.revision = (t.revision ?? 0) + 1;
    t.revisedInRound = newState.round;
    // Revising a ratified Definition reverts it to draft (mirrors NC ratificationStatus pattern).
    if (t.status === 'ratified' && changedFields.length > 0) {
      t.status = 'draft';
      changedFields.push('status');
    }
    newState.definitionLog.push({
      event: 'revised',
      definitionId: id,
      round: newState.round,
      revision: t.revision,
      fields: changedFields,
    });
    appendOperationLog(newState, {
      round: newState.round,
      op: 'revise',
      entityId: id,
      type: 'DEFINITION',
      consent,
      changedFields,
      provenance: { before, after: { definition: t.definition, sense_constraints: t.sense_constraints, aliases: t.aliases }, revision: t.revision },
    });
    return [id, newState, null];
  }

  if (op === 'ratify') {
    const id = payload?.id;
    if (!id) return [null, state, 'DOMAIN_ERROR: id required for ratify'];
    const target = (state.definitions ?? []).find(d => d.id === id);
    if (!target) {
      return [null, state, `NOT_FOUND: definition ${id} not found`];
    }
    if (target.status === 'withdrawn' || target.status === 'deprecated') {
      return [null, state, `DOMAIN_ERROR: cannot ratify definition ${id} with status ${target.status}`];
    }
    let newState = structuredClone(state);
    newState.elements = cloneElements(state.elements);
    newState.closingArgPresentedRound = null;
    newState.closingArgGoRound = null;
    const t = newState.definitions.find(d => d.id === id);
    const before = t.status;
    t.status = 'ratified';
    newState.definitionLog.push({
      event: 'ratified',
      definitionId: id,
      round: newState.round,
    });
    appendOperationLog(newState, {
      round: newState.round,
      op: 'ratify',
      entityId: id,
      type: 'DEFINITION',
      consent,
      changedFields: ['status'],
      provenance: { before, after: 'ratified' },
    });
    return [id, newState, null];
  }

  return [null, state, `DOMAIN_ERROR: unknown manage_definitions op: ${op}`];
}

/**
 * Universal withdraw — typed-element variant.
 * Transitions an active typed element (EVIDENCE/RULE/PERMISSION/NC/RISK/RC) to
 * status: 'withdrawn' with a closed-set disposition. FRICTION is rejected here
 * (PERM-1) — callers must use override_friction_disposition with a terminal
 * disposition instead.
 * @param {object} state
 * @param {string} elementId
 * @param {string} disposition - One of WITHDRAWAL_DISPOSITIONS.
 * @param {object} consent
 * @returns {[object, string|null]} [newState, error]
 */
export function withdrawElement(state, elementId, disposition, consent) {
  const consentCheck = validateConsentToken(consent);
  if (!consentCheck.valid) {
    return [state, `INVALID_CONSENT: ${consentCheck.reason}`];
  }
  const target = state.elements.get(elementId);
  if (!target) {
    return [state, `NOT_FOUND: element ${elementId} not found`];
  }
  if (target.type === 'FRICTION') {
    return [state, 'INVALID_CATEGORY: FRICTION uses override_friction_disposition (PERM-1)'];
  }
  if (target.status !== 'active') {
    return [state, `DOMAIN_ERROR: element ${elementId} is already ${target.status}`];
  }
  const allowed = DISPOSITIONS_BY_CATEGORY[target.type];
  if (!allowed || !allowed.includes(disposition)) {
    return [state, `INVALID_DISPOSITION: disposition must be one of ${(allowed ?? []).join(', ')}; got ${disposition}`];
  }
  let newState = structuredClone(state);
  newState.elements = cloneElements(state.elements);
  newState.closingArgPresentedRound = null;
  newState.closingArgGoRound = null;
  const t = newState.elements.get(elementId);
  t.status = 'withdrawn';
  t.withdrawal_disposition = disposition;
  newState.revisionLog.push({
    event: 'withdrawn',
    elementId,
    round: newState.round,
    disposition,
  });
  appendOperationLog(newState, {
    round: newState.round,
    op: 'withdraw',
    entityId: elementId,
    type: target.type,
    consent,
    changedFields: ['status', 'withdrawal_disposition'],
    provenance: { disposition },
  });
  const friction = processFriction(newState, consent, 'withdraw');
  return [friction.state, null];
}

/**
 * Universal withdraw — Concern variant. Locates by state.concerns[].id and sets
 * status: 'withdrawn' with a closed-set disposition.
 * @param {object} state
 * @param {string} concernId
 * @param {string} disposition - One of WITHDRAWAL_DISPOSITIONS.
 * @param {object} consent
 * @returns {[object, string|null]} [newState, error]
 */
export function withdrawConcern(state, concernId, disposition, consent) {
  const consentCheck = validateConsentToken(consent);
  if (!consentCheck.valid) {
    return [state, `INVALID_CONSENT: ${consentCheck.reason}`];
  }
  const target = state.concerns.find(c => c.id === concernId);
  if (!target) {
    return [state, `NOT_FOUND: concern ${concernId} not found`];
  }
  if (target.status === 'withdrawn') {
    return [state, `DOMAIN_ERROR: concern ${concernId} is already withdrawn`];
  }
  const allowed = DISPOSITIONS_BY_CATEGORY.CONCERN;
  if (!allowed.includes(disposition)) {
    return [state, `INVALID_DISPOSITION: disposition must be one of ${allowed.join(', ')}; got ${disposition}`];
  }
  let newState = structuredClone(state);
  newState.elements = cloneElements(state.elements);
  newState.closingArgPresentedRound = null;
  newState.closingArgGoRound = null;
  const t = newState.concerns.find(c => c.id === concernId);
  t.status = 'withdrawn';
  t.withdrawal_disposition = disposition;
  newState.revisionLog.push({
    event: 'withdrawn',
    elementId: concernId,
    round: newState.round,
    disposition,
  });
  appendOperationLog(newState, {
    round: newState.round,
    op: 'withdraw',
    entityId: concernId,
    type: 'CONCERN',
    consent,
    changedFields: ['status', 'withdrawal_disposition'],
    provenance: { disposition },
  });
  const friction = processFriction(newState, consent, 'withdraw');
  return [friction.state, null];
}

/**
 * Universal withdraw — Definition variant. Locates by state.definitions[].id and
 * sets status: 'withdrawn' with a closed-set disposition.
 * @param {object} state
 * @param {string} definitionId
 * @param {string} disposition - One of WITHDRAWAL_DISPOSITIONS.
 * @param {object} consent
 * @returns {[object, string|null]} [newState, error]
 */
export function withdrawDefinition(state, definitionId, disposition, consent) {
  const consentCheck = validateConsentToken(consent);
  if (!consentCheck.valid) {
    return [state, `INVALID_CONSENT: ${consentCheck.reason}`];
  }
  const target = (state.definitions ?? []).find(d => d.id === definitionId);
  if (!target) {
    return [state, `NOT_FOUND: definition ${definitionId} not found`];
  }
  if (target.status === 'withdrawn' || target.status === 'deprecated') {
    return [state, `DOMAIN_ERROR: definition ${definitionId} is already ${target.status}`];
  }
  const allowed = DISPOSITIONS_BY_CATEGORY.DEFINITION;
  if (!allowed.includes(disposition)) {
    return [state, `INVALID_DISPOSITION: disposition must be one of ${allowed.join(', ')}; got ${disposition}`];
  }
  let newState = structuredClone(state);
  newState.elements = cloneElements(state.elements);
  newState.closingArgPresentedRound = null;
  newState.closingArgGoRound = null;
  const t = newState.definitions.find(d => d.id === definitionId);
  t.status = 'withdrawn';
  t.withdrawal_disposition = disposition;
  newState.definitionLog.push({
    event: 'withdrawn',
    definitionId,
    round: newState.round,
    disposition,
  });
  appendOperationLog(newState, {
    round: newState.round,
    op: 'withdraw',
    entityId: definitionId,
    type: 'DEFINITION',
    consent,
    changedFields: ['status', 'withdrawal_disposition'],
    provenance: { disposition },
  });
  const friction = processFriction(newState, consent, 'withdraw');
  return [friction.state, null];
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
