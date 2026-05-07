// MCP server for design proof discipline.
// Thin wiring layer — all logic lives in proof.js, metrics.js, and state.js.

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import {
  initializeState, applyOperations, markChallengeUsed, saveState, loadState,
  addConcern, lockConcerns, ratifyConcern, ratifyResolveCondition,
  manageFriction, overrideFrictionDisposition,
  recordClosingArgPresented, recordDesignerGo,
} from './state.js';
import { checkAllIntegrity, FRICTION_SHAPES, FRICTION_DISPOSITIONS, WITHDRAWAL_DISPOSITIONS, CONSENT_SOURCES } from './proof.js';
import {
  computeCompleteness, computeGroundingCoverage, detectChallenge, checkClosure,
  checkConcernCoverage, evaluateTrigger,
} from './metrics.js';
import { deriveClosingArgument } from './closing-argument.js';
import { restructure } from './restructure.js';
import { checkOpenGate } from './open-gate.js';
import { existsSync } from 'node:fs';

const ELEMENT_TYPES = ['EVIDENCE', 'RULE', 'PERMISSION', 'NECESSARY_CONDITION', 'RISK', 'RESOLVE_CONDITION', 'FRICTION'];

// Shared schema fragment for the consent token required by every mutating tool.
const CONSENT_SCHEMA = {
  type: 'object',
  description: 'Consent token authorizing this mutation. Required by all mutating tools.',
  properties: {
    source: {
      type: 'string',
      enum: CONSENT_SOURCES,
      description: 'Origin of the consent.',
    },
    rationale: { type: 'string', description: 'Optional rationale for the mutation.' },
  },
  required: ['source'],
};

const server = new Server(
  { name: 'chester-design-proof', version: '2.0.0' },
  { capabilities: { tools: {} } }
);

// Classify a state-layer error string into the MCP error response shape.
// INVALID_CONSENT: ... is the only currently-defined coded class; everything else
// is a domain error (e.g. integrity check failure, NOT_FOUND).
function classifyStateError(err) {
  return {
    code: err.startsWith('INVALID_CONSENT') ? 'INVALID_CONSENT' : 'DOMAIN_ERROR',
    message: err,
  };
}

// ── Tool Definitions ─────────────────────────────────────────────

const TOOLS = [
  {
    name: 'submit_proof_update',
    description: 'Submit a batch of proof operations (add, revise, withdraw) for the current round',
    inputSchema: {
      type: 'object',
      properties: {
        state_file: { type: 'string', description: 'Absolute path to state JSON' },
        operations: {
          type: 'array',
          description: 'Array of operations to apply',
          items: {
            type: 'object',
            properties: {
              op: { type: 'string', enum: ['add', 'revise', 'withdraw'] },
              type: { type: 'string', enum: ELEMENT_TYPES, description: 'Element type (for add)' },
              statement: { type: 'string', description: 'Element statement (for add/revise)' },
              source: { type: 'string', description: 'Source: "codebase" for EVIDENCE, "designer" for RULE/PERMISSION' },
              grounding: {
                type: 'array', items: { type: 'string' },
                description: 'Grounding element IDs (for NECESSARY_CONDITION add/revise)',
              },
              collapse_test: { type: 'string', description: 'What breaks if removed (for NECESSARY_CONDITION)' },
              reasoning_chain: { type: 'string', description: 'IF...THEN reasoning (for NECESSARY_CONDITION)' },
              rejected_alternatives: {
                type: 'array', items: { type: 'string' },
                description: 'Alternatives considered and rejected (for NECESSARY_CONDITION)',
              },
              relieves: { type: 'string', description: 'What restriction is relaxed (for PERMISSION)' },
              problem_anchor: { type: 'string', description: 'Concern ID anchor (for RESOLVE_CONDITION add/revise)' },
              basis: {
                type: 'array', items: { type: 'string' },
                description: 'Basis element IDs (for RISK — conditions it attaches to)',
              },
              target: { type: 'string', description: 'Target element ID (for revise/withdraw)' },
              withdrawal_disposition: {
                type: 'string', enum: WITHDRAWAL_DISPOSITIONS,
                description: 'Reason for withdrawal (for withdraw op); defaults to "unclassified" when omitted',
              },
            },
            required: ['op'],
          },
        },
        challenge_used: {
          type: 'string',
          enum: ['contrarian', 'simplifier', 'ontologist'],
          description: 'Optional challenge mode used this round',
        },
        consent: CONSENT_SCHEMA,
      },
      required: ['state_file', 'operations', 'consent'],
    },
  },
  {
    name: 'get_proof_state',
    description: 'Load current proof state and compute derived fields (integrity, completeness, closure)',
    inputSchema: {
      type: 'object',
      properties: {
        state_file: { type: 'string', description: 'Absolute path to state JSON' },
      },
      required: ['state_file'],
    },
  },
  {
    name: 'manage_concerns',
    description: 'Add, lock, or ratify Concerns attached to the problem statement. Concerns anchor Resolve Conditions for closure coverage; ratify transitions a Concern from draft to ratified.',
    inputSchema: {
      type: 'object',
      properties: {
        state_file: { type: 'string', description: 'Absolute path to state JSON' },
        op: { type: 'string', enum: ['add', 'lock', 'ratify'] },
        label: { type: 'string', description: 'Concern label (required for op=add)' },
        description: { type: 'string', description: 'Optional Concern description (op=add only)' },
        concern_id: { type: 'string', description: 'CERN-N id of the Concern to ratify (required for op=ratify)' },
        consent: CONSENT_SCHEMA,
      },
      required: ['state_file', 'op', 'consent'],
    },
  },
  {
    name: 'manage_friction',
    description: 'Add a FRICTION element capturing tension between two existing elements. Anchors must reference existing elements; disposition records the designer\'s stance toward the friction.',
    inputSchema: {
      type: 'object',
      properties: {
        state_file: { type: 'string', description: 'Absolute path to state JSON' },
        op: { type: 'string', enum: ['add'] },
        friction_shape: { type: 'string', enum: FRICTION_SHAPES, description: 'Shape of the friction (which pair-type it captures)' },
        anchor_a: { type: 'string', description: 'First anchor element ID' },
        anchor_b: { type: 'string', description: 'Second anchor element ID' },
        disposition: { type: 'string', enum: FRICTION_DISPOSITIONS, description: 'Designer\'s stance toward this friction' },
        statement: { type: 'string', description: 'Optional human-readable description of the tension' },
        consent: CONSENT_SCHEMA,
      },
      required: ['state_file', 'op', 'friction_shape', 'anchor_a', 'anchor_b', 'disposition', 'consent'],
    },
  },
  {
    name: 'override_friction_disposition',
    description: 'Change the disposition of an existing FRICTION element. Terminal dispositions (dissolved-by-revision, dissolved-by-scope-cut, not-really-friction) also withdraw the element.',
    inputSchema: {
      type: 'object',
      properties: {
        state_file: { type: 'string', description: 'Absolute path to state JSON' },
        element_id: { type: 'string', description: 'FRIC-N ID of the friction to update' },
        disposition: { type: 'string', enum: FRICTION_DISPOSITIONS, description: 'New disposition' },
        consent: CONSENT_SCHEMA,
      },
      required: ['state_file', 'element_id', 'disposition', 'consent'],
    },
  },
  {
    name: 'open_proof',
    description: 'Open a proof from an untrusted caller submission. Restructures submission material into typed proof elements per a 4b-owned schema and writes initial state. Permissive at the boundary; rigor enforced internally.',
    inputSchema: {
      type: 'object',
      properties: {
        state_file: { type: 'string', description: 'Absolute path to write proof state JSON.' },
        submission_material: { type: 'object', description: 'Free-form caller submission. Must include problem_statement (string).' },
      },
      required: ['state_file', 'submission_material'],
    },
  },
  {
    name: 'ratify_resolve_condition',
    description: 'Ratify a single Resolve Condition. Sequential by design — accepts one element_id per call; batch shapes are not supported.',
    inputSchema: {
      type: 'object',
      properties: {
        state_file: { type: 'string', description: 'Absolute path to state JSON' },
        element_id: { type: 'string', description: 'RCON-N ID of the Resolve Condition to ratify' },
        ratification: { type: 'string', description: "PM's sign-off text" },
        consent: CONSENT_SCHEMA,
      },
      required: ['state_file', 'element_id', 'ratification', 'consent'],
    },
  },
  {
    name: 'present_closing_argument',
    description: 'Present the closing argument as a structured object. Refuses if the composite trigger gate is not cleared (per-signal floors, aggregate score, integrity-zero).',
    inputSchema: {
      type: 'object',
      properties: {
        state_file: { type: 'string', description: 'Absolute path to state JSON' },
        consent: CONSENT_SCHEMA,
      },
      required: ['state_file', 'consent'],
    },
  },
  {
    name: 'confirm_closure_go',
    description: "Designer go-choice against the presented closing argument. Refuses if the closing argument was not presented in the current round (state has shifted; re-present first).",
    inputSchema: {
      type: 'object',
      properties: {
        state_file: { type: 'string', description: 'Absolute path to state JSON' },
        consent: CONSENT_SCHEMA,
      },
      required: ['state_file', 'consent'],
    },
  },
];

// ── Request Handlers ─────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'submit_proof_update':
        return handleSubmitProofUpdate(args);
      case 'get_proof_state':
        return handleGetProofState(args);
      case 'manage_concerns':
        return handleManageConcerns(args);
      case 'manage_friction':
        return handleManageFriction(args);
      case 'override_friction_disposition':
        return handleOverrideFrictionDisposition(args);
      case 'ratify_resolve_condition':
        return handleRatifyResolveCondition(args);
      case 'open_proof':
        return handleOpenProof(args);
      case 'present_closing_argument':
        return handlePresentClosingArgument(args);
      case 'confirm_closure_go':
        return handleConfirmClosureGo(args);
      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
    }
  } catch (err) {
    return { content: [{ type: 'text', text: err.message }], isError: true };
  }
});

// ── Tool Handlers ────────────────────────────────────────────────

function handleSubmitProofUpdate({ state_file, operations, challenge_used, consent }) {
  let state = loadState(state_file);

  const result = applyOperations(state, operations, consent);

  const consentRejected = result.errors.some(e => typeof e === 'string' && e.startsWith('INVALID_CONSENT'));
  if (consentRejected) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          code: 'INVALID_CONSENT',
          message: result.errors.find(e => e.startsWith('INVALID_CONSENT')),
        }),
      }],
      isError: true,
    };
  }

  const anySuccess = result.added.length > 0 ||
    result.revised.length > 0 ||
    result.withdrawn.length > 0;

  if (!anySuccess && result.errors.length > 0) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          status: 'rejected',
          errors: result.errors,
        }),
      }],
      isError: true,
    };
  }

  state = result.state;

  if (challenge_used) {
    state = markChallengeUsed(state, challenge_used);
  }

  saveState(state, state_file);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        status: 'accepted',
        round: state.round,
        elements_added: result.added,
        elements_revised: result.revised,
        elements_withdrawn: result.withdrawn,
        errors: result.errors,
        integrity_warnings: result.integrityWarnings,
        completeness: result.completeness,
        challenge_trigger: result.challengeTrigger,
        stall_detected: result.stallDetected,
        closure_permitted: result.closure.permitted,
        closure_reasons: result.closure.reasons,
        friction_hints: result.friction_hints,
      }),
    }],
  };
}

function handleGetProofState({ state_file }) {
  const state = loadState(state_file);

  const integrityWarnings = checkAllIntegrity(state.elements);
  const completeness = {
    ...computeCompleteness(state.elements),
    groundingCoverage: computeGroundingCoverage(state.elements),
  };
  const challengeTrigger = detectChallenge(state);
  const closure = checkClosure(state);
  const response = {
    ...state,
    elements: Object.fromEntries(state.elements),
    integrity_warnings: integrityWarnings,
    completeness,
    challenge_trigger: challengeTrigger,
    closure_permitted: closure.permitted,
    closure_reasons: closure.reasons,
  };
  if (state.concernsLocked) {
    response.concernCoverage = checkConcernCoverage(state);
  }
  return { content: [{ type: 'text', text: JSON.stringify(response) }] };
}

function handleManageConcerns({ state_file, op, label, description, concern_id, consent }) {
  let state = loadState(state_file);
  if (op === 'add') {
    if (!label) {
      return { content: [{ type: 'text', text: JSON.stringify({ status: 'rejected', error: 'label required for op=add' }) }], isError: true };
    }
    const [concernId, newState, friction_hints, err] = addConcern(state, { label, description }, consent);
    if (err) {
      return { content: [{ type: 'text', text: JSON.stringify(classifyStateError(err)) }], isError: true };
    }
    saveState(newState, state_file);
    return { content: [{ type: 'text', text: JSON.stringify({ status: 'accepted', concern_id: concernId, concerns_count: newState.concerns.length, friction_hints }) }] };
  }
  if (op === 'lock') {
    const [newState, friction_hints, err] = lockConcerns(state, consent);
    if (err) {
      return { content: [{ type: 'text', text: JSON.stringify(classifyStateError(err)) }], isError: true };
    }
    saveState(newState, state_file);
    return { content: [{ type: 'text', text: JSON.stringify({ status: 'accepted', locked: true, concerns_count: newState.concerns.length, friction_hints }) }] };
  }
  if (op === 'ratify') {
    if (!concern_id) {
      return { content: [{ type: 'text', text: JSON.stringify({ status: 'rejected', error: 'concern_id required for op=ratify' }) }], isError: true };
    }
    const [newState, err] = ratifyConcern(state, concern_id, consent);
    if (err) {
      return { content: [{ type: 'text', text: JSON.stringify(classifyStateError(err)) }], isError: true };
    }
    saveState(newState, state_file);
    const concern = newState.concerns.find(c => c.id === concern_id);
    return { content: [{ type: 'text', text: JSON.stringify({ status: 'accepted', concern_id, concern_status: concern.status }) }] };
  }
  return { content: [{ type: 'text', text: JSON.stringify({ status: 'rejected', error: `Unknown op: ${op}` }) }], isError: true };
}

function handleManageFriction({ state_file, op, friction_shape, anchor_a, anchor_b, disposition, statement, consent }) {
  let state = loadState(state_file);
  const [fricId, newState, friction_hints, err] = manageFriction(state, { op, friction_shape, anchor_a, anchor_b, disposition, statement }, consent);
  if (err) {
    return { content: [{ type: 'text', text: JSON.stringify(classifyStateError(err)) }], isError: true };
  }
  saveState(newState, state_file);
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        status: 'accepted',
        element_id: fricId,
        friction_shape,
        disposition,
        friction_hints,
      }),
    }],
  };
}

function handleOverrideFrictionDisposition({ state_file, element_id, disposition, consent }) {
  let state = loadState(state_file);
  const [newState, friction_hints, err] = overrideFrictionDisposition(state, { elementId: element_id, disposition }, consent);
  if (err) {
    return { content: [{ type: 'text', text: JSON.stringify(classifyStateError(err)) }], isError: true };
  }
  saveState(newState, state_file);
  const target = newState.elements.get(element_id);
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        status: 'accepted',
        element_id,
        disposition: target.disposition,
        status_after: target.status,
        friction_hints,
      }),
    }],
  };
}

function handleRatifyResolveCondition({ state_file, element_id, ratification, consent }) {
  let state = loadState(state_file);
  const [newState, friction_hints, err] = ratifyResolveCondition(state, { elementId: element_id, ratificationText: ratification }, consent);
  if (err) {
    return { content: [{ type: 'text', text: JSON.stringify(classifyStateError(err)) }], isError: true };
  }
  saveState(newState, state_file);
  const target = newState.elements.get(element_id);
  const closure = checkClosure(newState);
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        status: 'accepted',
        element_id,
        ratification: target.ratification,
        closure_permitted: closure.permitted,
        closure_reasons: closure.reasons,
        friction_hints,
      }),
    }],
  };
}

function handlePresentClosingArgument({ state_file, consent }) {
  let state = loadState(state_file);
  const trigger = evaluateTrigger(state);
  if (!trigger.permitted) {
    return { content: [{ type: 'text', text: JSON.stringify({ permitted: false, reasons: trigger.reasons }, null, 2) }] };
  }
  const argument = deriveClosingArgument(state);
  const [newState, presentErr] = recordClosingArgPresented(state, consent);
  if (presentErr) {
    const code = presentErr.startsWith('INVALID_CONSENT') ? 'INVALID_CONSENT' : 'DOMAIN_ERROR';
    return { content: [{ type: 'text', text: JSON.stringify({ code, message: presentErr }) }], isError: true };
  }
  state = newState;
  saveState(state, state_file);
  return { content: [{ type: 'text', text: JSON.stringify(argument, null, 2) }] };
}

function handleConfirmClosureGo({ state_file, consent }) {
  let state = loadState(state_file);
  const [newState, err] = recordDesignerGo(state, consent);
  if (err) {
    if (err.startsWith('INVALID_CONSENT')) {
      return { content: [{ type: 'text', text: JSON.stringify({ code: 'INVALID_CONSENT', message: err }) }], isError: true };
    }
    return { content: [{ type: 'text', text: JSON.stringify({ permitted: false, reason: err }, null, 2) }] };
  }
  saveState(newState, state_file);
  const closure = checkClosure(newState);
  return { content: [{ type: 'text', text: JSON.stringify(closure, null, 2) }] };
}

export function handleOpenProof({ state_file, submission_material }) {
  // Pre-check: refuse if proof at this state file is already open.
  if (existsSync(state_file)) {
    try {
      const existingState = loadState(state_file);
      if (existingState.proofStatus === 'open') {
        return {
          content: [{ type: 'text', text: JSON.stringify({
            status: 'already_open',
            diagnostic: `Proof at ${state_file} is already open. Use a fresh state_file or initialize a new proof.`,
            proof_open: true,
          })}],
        };
      }
    } catch (_e) {
      // Malformed file: fall through to normal flow (will be overwritten on gate pass).
    }
  }

  // Phase 1 — accept submission as-is. No structural validation.
  const submission = submission_material || {};

  // Phase 2 — restructure into typed proof elements.
  const restructured = restructure(submission);

  // Special case: problem_statement extraction failed.
  if (restructured.rejection_diagnostic) {
    return {
      content: [{ type: 'text', text: JSON.stringify({
        status: 'gate_failed',
        restructuring_report: restructured.report,
        gate_failures: [{ missing_artifact: 'problem_statement', diagnostic: restructured.rejection_diagnostic }],
        rejected: restructured.rejected,
        proof_open: false,
      })}],
    };
  }

  // Phase 3 — check open gate, then initialize and persist state on pass.
  const gate = checkOpenGate(restructured.admitted, restructured.report);
  if (!gate.permitted) {
    return {
      content: [{ type: 'text', text: JSON.stringify({
        status: 'gate_failed',
        restructuring_report: restructured.report,
        gate_failures: gate.failures,
        rejected: restructured.rejected,
        proof_open: false,
      })}],
    };
  }

  // Gate pass: build state, apply elements, save.
  let state = initializeState(restructured.problem_statement);

  // Partition admitted into typed elements (go through applyOperations) and Concerns
  // (go through addConcern; no entry in ELEMENT_TYPES, lives in state.concerns[]).
  const admittedTypedElements = restructured.admitted.filter(a => a.category !== 'Concern');
  const admittedConcerns = restructured.admitted.filter(a => a.category === 'Concern');

  const ops = admittedTypedElements.map(adm => admittedToAddOp(adm));
  // open_proof bridges untrusted submission to typed elements; consent is the
  // open_proof submission itself. Synthesize an internal token here; Task 11
  // will lift consent to the open_proof boundary.
  const openProofConsent = { source: 'agent-proposed-designer-confirmed', rationale: 'open_proof submission gate' };
  const applyResult = applyOperations(state, ops, openProofConsent);

  // Surface applyOperations errors per Plan-Wide Implementation Discipline.
  if (applyResult.errors && applyResult.errors.length > 0) {
    const attemptedCount = admittedTypedElements.length + admittedConcerns.length;
    const actuallyAdmittedCount = (applyResult.added ? applyResult.added.length : 0);
    return {
      content: [{ type: 'text', text: JSON.stringify({
        status: 'partial_write_failure',
        restructuring_report: restructured.report,
        errors: applyResult.errors,
        attempted_admit_count: attemptedCount,
        actually_admitted_count: actuallyAdmittedCount,
        proof_open: false,
      })}],
    };
  }

  state = applyResult.state;

  // Provision admitted Concerns via addConcern (separate path).
  for (const concernCandidate of admittedConcerns) {
    const [, concernState] = addConcern(state, {
      label: concernCandidate.label,
      description: concernCandidate.description,
    }, openProofConsent);
    state = concernState;
  }

  state.proofStatus = 'open';
  try {
    saveState(state, state_file);
  } catch (saveErr) {
    return {
      content: [{ type: 'text', text: JSON.stringify({
        status: 'save_failed',
        restructuring_report: restructured.report,
        diagnostic: `saveState threw: ${saveErr.message}`,
        proof_open: false,
      })}],
    };
  }

  return {
    content: [{ type: 'text', text: JSON.stringify({
      status: 'opened',
      restructuring_report: restructured.report,
      admitted_count: restructured.admitted.length,
      rejected_count: restructured.rejected.length,
      proof_open: true,
    })}],
  };
}

function admittedToAddOp(admitted) {
  const { category, metadata, restructuring_action_label, provenance, ...typedFields } = admitted;
  return {
    op: 'add',
    type: category,
    ...typedFields,
    restructuring: { metadata, restructuring_action_label, provenance },
  };
}

// ── Startup ──────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
