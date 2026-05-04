// MCP server for design proof discipline.
// Thin wiring layer — all logic lives in proof.js, metrics.js, and state.js.

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import {
  initializeState, applyOperations, markChallengeUsed, saveState, loadState,
  addConcern, lockConcerns, ratifyResolveCondition,
  manageFriction, overrideFrictionDisposition,
  recordClosingArgPresented, recordDesignerGo,
} from './state.js';
import { checkAllIntegrity, FRICTION_SHAPES, FRICTION_DISPOSITIONS, WITHDRAWAL_DISPOSITIONS } from './proof.js';
import {
  computeCompleteness, computeGroundingCoverage, detectChallenge, checkClosure,
  checkConcernCoverage, evaluateTrigger,
} from './metrics.js';
import { deriveClosingArgument } from './closing-argument.js';

const ELEMENT_TYPES = ['EVIDENCE', 'RULE', 'PERMISSION', 'NECESSARY_CONDITION', 'RISK', 'RESOLVE_CONDITION', 'FRICTION'];

const server = new Server(
  { name: 'chester-design-proof', version: '2.0.0' },
  { capabilities: { tools: {} } }
);

// ── Tool Definitions ─────────────────────────────────────────────

const TOOLS = [
  {
    name: 'initialize_proof',
    description: 'Initialize a new design proof session with the necessary conditions model',
    inputSchema: {
      type: 'object',
      properties: {
        problem_statement: { type: 'string', description: "The designer's verbatim problem statement" },
        state_file: { type: 'string', description: 'Absolute path to persist state JSON' },
      },
      required: ['problem_statement', 'state_file'],
    },
  },
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
      },
      required: ['state_file', 'operations'],
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
    description: 'Add or lock Concerns attached to the problem statement. Concerns anchor Resolve Conditions for closure coverage.',
    inputSchema: {
      type: 'object',
      properties: {
        state_file: { type: 'string', description: 'Absolute path to state JSON' },
        op: { type: 'string', enum: ['add', 'lock'] },
        label: { type: 'string', description: 'Concern label (required for op=add)' },
        description: { type: 'string', description: 'Optional Concern description (op=add only)' },
      },
      required: ['state_file', 'op'],
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
      },
      required: ['state_file', 'op', 'friction_shape', 'anchor_a', 'anchor_b', 'disposition'],
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
      },
      required: ['state_file', 'element_id', 'disposition'],
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
      },
      required: ['state_file', 'element_id', 'ratification'],
    },
  },
  {
    name: 'present_closing_argument',
    description: 'Present the closing argument as a structured object. Refuses if the composite trigger gate is not cleared (per-signal floors, aggregate score, integrity-zero).',
    inputSchema: {
      type: 'object',
      properties: {
        state_file: { type: 'string', description: 'Absolute path to state JSON' },
      },
      required: ['state_file'],
    },
  },
  {
    name: 'confirm_closure_go',
    description: "Designer go-choice against the presented closing argument. Refuses if the closing argument was not presented in the current round (state has shifted; re-present first).",
    inputSchema: {
      type: 'object',
      properties: {
        state_file: { type: 'string', description: 'Absolute path to state JSON' },
      },
      required: ['state_file'],
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
      case 'initialize_proof':
        return handleInitialize(args);
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

function handleInitialize({ problem_statement, state_file }) {
  const state = initializeState(problem_statement);
  saveState(state, state_file);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        status: 'initialized',
        element_types: ELEMENT_TYPES,
        operations: ['add', 'revise', 'withdraw'],
        concerns: [],
        tools_added: [
          'manage_concerns', 'ratify_resolve_condition',
          'manage_friction', 'override_friction_disposition',
          'present_closing_argument', 'confirm_closure_go',
        ],
        state_file,
      }),
    }],
  };
}

function handleSubmitProofUpdate({ state_file, operations, challenge_used }) {
  let state = loadState(state_file);

  const result = applyOperations(state, operations);

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

function handleManageConcerns({ state_file, op, label, description }) {
  let state = loadState(state_file);
  if (op === 'add') {
    if (!label) {
      return { content: [{ type: 'text', text: JSON.stringify({ status: 'rejected', error: 'label required for op=add' }) }], isError: true };
    }
    const [concernId, newState, friction_hints, err] = addConcern(state, { label, description });
    if (err) {
      return { content: [{ type: 'text', text: JSON.stringify({ status: 'rejected', error: err }) }], isError: true };
    }
    saveState(newState, state_file);
    return { content: [{ type: 'text', text: JSON.stringify({ status: 'accepted', concern_id: concernId, concerns_count: newState.concerns.length, friction_hints }) }] };
  }
  if (op === 'lock') {
    const [newState, friction_hints, err] = lockConcerns(state);
    if (err) {
      return { content: [{ type: 'text', text: JSON.stringify({ status: 'rejected', error: err }) }], isError: true };
    }
    saveState(newState, state_file);
    return { content: [{ type: 'text', text: JSON.stringify({ status: 'accepted', locked: true, concerns_count: newState.concerns.length, friction_hints }) }] };
  }
  return { content: [{ type: 'text', text: JSON.stringify({ status: 'rejected', error: `Unknown op: ${op}` }) }], isError: true };
}

function handleManageFriction({ state_file, op, friction_shape, anchor_a, anchor_b, disposition, statement }) {
  let state = loadState(state_file);
  const [fricId, newState, friction_hints, err] = manageFriction(state, { op, friction_shape, anchor_a, anchor_b, disposition, statement });
  if (err) {
    return { content: [{ type: 'text', text: JSON.stringify({ status: 'rejected', error: err }) }], isError: true };
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

function handleOverrideFrictionDisposition({ state_file, element_id, disposition }) {
  let state = loadState(state_file);
  const [newState, friction_hints, err] = overrideFrictionDisposition(state, { elementId: element_id, disposition });
  if (err) {
    return { content: [{ type: 'text', text: JSON.stringify({ status: 'rejected', error: err }) }], isError: true };
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

function handleRatifyResolveCondition({ state_file, element_id, ratification }) {
  let state = loadState(state_file);
  const [newState, friction_hints, err] = ratifyResolveCondition(state, { elementId: element_id, ratificationText: ratification });
  if (err) {
    return { content: [{ type: 'text', text: JSON.stringify({ status: 'rejected', error: err }) }], isError: true };
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

function handlePresentClosingArgument({ state_file }) {
  let state = loadState(state_file);
  const trigger = evaluateTrigger(state);
  if (!trigger.permitted) {
    return { content: [{ type: 'text', text: JSON.stringify({ permitted: false, reasons: trigger.reasons }, null, 2) }] };
  }
  const argument = deriveClosingArgument(state);
  state = recordClosingArgPresented(state);
  saveState(state, state_file);
  return { content: [{ type: 'text', text: JSON.stringify(argument, null, 2) }] };
}

function handleConfirmClosureGo({ state_file }) {
  let state = loadState(state_file);
  const [newState, err] = recordDesignerGo(state);
  if (err) {
    return { content: [{ type: 'text', text: JSON.stringify({ permitted: false, reason: err }, null, 2) }] };
  }
  saveState(newState, state_file);
  const closure = checkClosure(newState);
  return { content: [{ type: 'text', text: JSON.stringify(closure, null, 2) }] };
}

function handleOpenProof(_args) {
  return {
    content: [{ type: 'text', text: JSON.stringify({ status: 'not_implemented', proof_open: false }) }],
  };
}

// ── Startup ──────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
