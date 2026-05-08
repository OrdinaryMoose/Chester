// MCP server for design proof discipline.
// Thin wiring layer — all logic lives in proof.js, metrics.js, and state.js.

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import {
  initializeState, applyOperations, saveState, loadState,
  addConcern, ratifyConcern, ratifyResolveCondition,
  manageFriction, overrideFrictionDisposition,
  recordClosingArgPresented, recordDesignerGo,
  manageDefinitions,
  withdrawElement, withdrawConcern, withdrawDefinition,
  appendOperationLog,
} from './state.js';
import { checkAllIntegrity, FRICTION_SHAPES, FRICTION_DISPOSITIONS, WITHDRAWAL_DISPOSITIONS, CONSENT_SOURCES, SCHEMA_VERSION, validateConsentToken, entityType } from './proof.js';
import {
  computeCompleteness, computeGroundingCoverage, checkClosure,
  checkConcernCoverage, evaluateTrigger,
} from './metrics.js';
import { deriveClosingArgument } from './closing-argument.js';
import { restructure } from './restructure.js';
import { checkOpenGate } from './open-gate.js';
import { checkFirstYesGate } from './first-yes-gate.js';
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
// Coded classes: INVALID_CONSENT, PROOF_FINISHED. Everything else falls through
// to DOMAIN_ERROR (integrity check failure, NOT_FOUND, etc.).
function classifyStateError(err) {
  if (err.startsWith('INVALID_CONSENT')) return { code: 'INVALID_CONSENT', message: err };
  if (err.startsWith('PROOF_FINISHED')) return { code: 'PROOF_FINISHED', message: err };
  return { code: 'DOMAIN_ERROR', message: err };
}

// Pre-flight refusal for mutating handlers: returns an isError MCP response
// when the proof is already finished. Defense-in-depth: handleSubmitProofUpdate
// reads result.errors[] directly rather than going through classifyStateError,
// so handlers must guard before calling the state layer.
function proofFinishedResponse() {
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        code: 'PROOF_FINISHED',
        message: 'Proof is finished; no further mutations permitted',
      }),
    }],
    isError: true,
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
        summary_mode: { type: 'boolean', description: 'When true, return counts and IDs only (no element bodies, no operation log).' },
      },
      required: ['state_file'],
    },
  },
  {
    name: 'manage_concerns',
    description: 'Add or ratify Concerns attached to the problem statement. Concerns anchor Resolve Conditions for closure coverage; ratify transitions a Concern from draft to ratified.',
    inputSchema: {
      type: 'object',
      properties: {
        state_file: { type: 'string', description: 'Absolute path to state JSON' },
        op: { type: 'string', enum: ['add', 'ratify'] },
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
        source: { type: 'string', description: 'Provenance tag (e.g., "session-observation", "agent-derivation"). Defaults to "agent-derivation".' },
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
    description: 'Open a proof from an untrusted caller submission. Restructures submission material into typed proof elements per a 4b-owned schema and writes initial state. Permissive at the boundary; rigor enforced internally. submission_material MUST include problem_statement, ≥1 Concern (top-level concerns array or category:"Concern" elements), ≥1 Evidence element, restructuring action label per element, and a consent token; otherwise INVALID_SEED_PACKET / INVALID_CONSENT.',
    inputSchema: {
      type: 'object',
      properties: {
        state_file: { type: 'string', description: 'Absolute path to write proof state JSON.' },
        submission_material: {
          type: 'object',
          description: 'Caller submission seed packet. Must include problem_statement (string), concerns (array, ≥1), elements (array with ≥1 EVIDENCE entry, every element carrying restructuring.action), and consent (token).',
        },
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
    name: 'manage_definitions',
    description: 'Manage vocabulary Definitions (NC-7, RULE-5). Ops: add (create draft), revise (update; appends history; reverts ratified→draft), ratify (draft→ratified), query-overlap (read-only token search; no consent required), deprecate (routes to universal withdraw — Task 10).',
    inputSchema: {
      type: 'object',
      properties: {
        state_file: { type: 'string', description: 'Absolute path to state JSON' },
        op: { type: 'string', enum: ['add', 'revise', 'deprecate', 'ratify', 'query-overlap'] },
        canonical_name: { type: 'string', description: 'Canonical name (required for op=add; payload for query-overlap)' },
        aliases: { type: 'array', items: { type: 'string' }, description: 'Alias names (op=add/revise)' },
        definition: { type: 'string', description: 'Definition text (required for op=add; optional for revise)' },
        sense_constraints: { type: 'string', description: 'Optional sense constraints (op=add/revise)' },
        id: { type: 'string', description: 'DEFN-N id (required for op=revise/deprecate/ratify)' },
        consent: CONSENT_SCHEMA,
      },
      required: ['state_file', 'op'],
    },
  },
  {
    name: 'withdraw',
    description: 'Universal withdrawal verb. Transitions an element to status:withdrawn with closed-set disposition. NOTE: FRICTION uses override_friction_disposition instead (see PERM-1).',
    inputSchema: {
      type: 'object',
      properties: {
        state_file: { type: 'string', description: 'Absolute path to state JSON' },
        category: {
          type: 'string',
          enum: ['EVIDENCE', 'RULE', 'PERMISSION', 'NECESSARY_CONDITION', 'RISK', 'RESOLVE_CONDITION', 'CONCERN', 'DEFINITION'],
          description: 'Category of the entity being withdrawn (FRICTION excluded — see PERM-1).',
        },
        element_id: { type: 'string', description: 'ID of the entity to withdraw.' },
        disposition: { type: 'string', description: 'Disposition for the withdrawal; must be valid for the category.' },
        consent: CONSENT_SCHEMA,
      },
      required: ['state_file', 'category', 'element_id', 'disposition', 'consent'],
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
      case 'manage_definitions':
        return handleManageDefinitions(args);
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
      case 'withdraw':
        return handleWithdraw(args);
      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
    }
  } catch (err) {
    if (err && err.code) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ code: err.code, message: err.message }) }],
        isError: true,
      };
    }
    return { content: [{ type: 'text', text: err.message }], isError: true };
  }
});

// ── Tool Handlers ────────────────────────────────────────────────

export function handleSubmitProofUpdate({ state_file, operations, consent }) {
  let state = loadState(state_file);

  if (state.proofStatus === 'finish') {
    return proofFinishedResponse();
  }

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
        body_advancement: result.bodyAdvancement,
        closure_permitted: result.closure.permitted,
        closure_reasons: result.closure.reasons,
        friction_hints: result.friction_hints,
      }),
    }],
  };
}

function buildSummaryShape(state) {
  const counts = {
    ncs: 0, rcs: 0, rules: 0, permissions: 0,
    evidence: 0, risks: 0, frictions: 0,
    concerns: (state.concerns || []).filter(c => c.status !== 'withdrawn').length,
    definitions: (state.definitions || []).filter(d => d.status !== 'withdrawn').length,
    ratified: { ncs: 0, rcs: 0, concerns: 0, definitions: 0 },
  };
  const elementsOut = {};
  for (const [id, el] of state.elements) {
    if (el.status !== 'active' && el.status !== 'withdrawn') continue;
    elementsOut[id] = { type: el.type, status: el.status };
    if (el.status !== 'active') continue;
    switch (el.type) {
      case 'NECESSARY_CONDITION':
        counts.ncs++;
        if (el.ratificationStatus === 'ratified') counts.ratified.ncs++;
        break;
      case 'RESOLVE_CONDITION':
        counts.rcs++;
        if (el.ratification !== null) counts.ratified.rcs++;
        break;
      case 'RULE': counts.rules++; break;
      case 'PERMISSION': counts.permissions++; break;
      case 'EVIDENCE': counts.evidence++; break;
      case 'RISK': counts.risks++; break;
      case 'FRICTION': counts.frictions++; break;
    }
  }
  for (const c of state.concerns || []) if (c.status === 'ratified') counts.ratified.concerns++;
  for (const d of state.definitions || []) if (d.status === 'ratified') counts.ratified.definitions++;

  const closure = checkClosure(state);
  return {
    proofStatus: state.proofStatus,
    round: state.round,
    counts,
    closurePermitted: closure.permitted,
    closureReasons: closure.reasons,
    elements: elementsOut,
    concerns: (state.concerns || []).map(c => ({ id: c.id, status: c.status })),
    definitions: (state.definitions || []).map(d => ({ id: d.id, status: d.status })),
  };
}

export function handleGetProofState({ state_file, summary_mode }) {
  const state = loadState(state_file);

  if (summary_mode === true) {
    return { content: [{ type: 'text', text: JSON.stringify(buildSummaryShape(state)) }] };
  }

  const integrityWarnings = checkAllIntegrity(state.elements);
  const completeness = {
    ...computeCompleteness(state.elements, state),
    groundingCoverage: computeGroundingCoverage(state.elements),
  };
  const closure = checkClosure(state);
  const response = {
    ...state,
    elements: Object.fromEntries(state.elements),
    integrity_warnings: integrityWarnings,
    completeness,
    closure_permitted: closure.permitted,
    closure_reasons: closure.reasons,
  };
  if (state.concerns && state.concerns.length > 0) {
    response.concernCoverage = checkConcernCoverage(state);
  }
  return { content: [{ type: 'text', text: JSON.stringify(response) }] };
}

function handleManageConcerns({ state_file, op, label, description, concern_id, consent }) {
  let state = loadState(state_file);
  if (state.proofStatus === 'finish') {
    return proofFinishedResponse();
  }
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

function handleManageFriction({ state_file, op, friction_shape, anchor_a, anchor_b, disposition, statement, source, consent }) {
  let state = loadState(state_file);
  if (state.proofStatus === 'finish') {
    return proofFinishedResponse();
  }
  const [fricId, newState, friction_hints, err] = manageFriction(state, { op, friction_shape, anchor_a, anchor_b, disposition, statement, source }, consent);
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

export function handleManageDefinitions({ state_file, op, canonical_name, aliases, definition, sense_constraints, id, consent }) {
  let state = loadState(state_file);

  // query-overlap is read-only; consent not required, no save.
  if (op === 'query-overlap') {
    const [matches] = manageDefinitions(state, op, { canonical_name }, undefined);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          status: 'accepted',
          matches: (matches ?? []).map(d => ({
            id: d.id, canonical_name: d.canonical_name, aliases: d.aliases, status: d.status,
          })),
        }),
      }],
    };
  }

  if (state.proofStatus === 'finish') {
    return proofFinishedResponse();
  }
  const payload = { canonical_name, aliases, definition, sense_constraints, id };
  const [resultId, newState, err] = manageDefinitions(state, op, payload, consent);
  if (err) {
    return { content: [{ type: 'text', text: JSON.stringify(classifyStateError(err)) }], isError: true };
  }
  saveState(newState, state_file);
  const def = (newState.definitions ?? []).find(d => d.id === resultId);
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        status: 'accepted',
        definition_id: resultId,
        definition_status: def?.status ?? null,
        definitions_count: (newState.definitions ?? []).length,
      }),
    }],
  };
}

function handleOverrideFrictionDisposition({ state_file, element_id, disposition, consent }) {
  let state = loadState(state_file);
  if (state.proofStatus === 'finish') {
    return proofFinishedResponse();
  }
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
  if (state.proofStatus === 'finish') {
    return proofFinishedResponse();
  }
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

export function handlePresentClosingArgument({ state_file, consent }) {
  let state = loadState(state_file);
  if (state.proofStatus === 'finish') {
    return proofFinishedResponse();
  }
  // First-yes precondition (AC-4.1, AC-4.2): every active element across the
  // four lanes (NCs, RCs, Concerns, Definitions) must be ratified before a
  // closing argument can be generated. Gate failure returns FIRST_YES_GATE_FAILED
  // with the list of unratified element ids so the caller can drive ratification.
  const gate = checkFirstYesGate(state);
  if (!gate.passed) {
    return {
      content: [{ type: 'text', text: JSON.stringify({
        code: 'FIRST_YES_GATE_FAILED',
        unratified_ids: gate.unratifiedIds,
        message: 'Closing argument cannot be presented while elements are in working state',
      }) }],
      isError: true,
    };
  }
  const trigger = evaluateTrigger(state);
  if (!trigger.permitted) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ code: 'TRIGGER_NOT_MET', reasons: trigger.reasons }) }],
      isError: true,
    };
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
  if (state.proofStatus === 'finish') {
    return proofFinishedResponse();
  }
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

/**
 * Best-effort persistence of a rejected open attempt so the designer can audit
 * INVALID_SEED_PACKET rejections. Never overwrites a successful prior open:
 * if loadState succeeds it preserves the existing proofStatus and just appends
 * a rejection entry to the operationLog. If load fails (file missing/corrupt),
 * synthesizes a minimal stub state with proofStatus='planning'.
 *
 * Swallows secondary failures — the primary error response is what matters.
 */
function persistRejectedOpen(state_file, consent, reason) {
  try {
    let state;
    let priorOpen = false;
    try {
      state = loadState(state_file);
      priorOpen = state.proofStatus === 'planning' || state.proofStatus === 'finish';
    } catch (_loadErr) {
      state = initializeState(null);
    }
    appendOperationLog(state, {
      round: state.round,
      op: 'open',
      entityId: null,
      type: null,
      consent,
      changedFields: null,
      provenance: { rejected: true, reason, priorOpen },
    });
    saveState(state, state_file);
  } catch (_saveErr) {
    // Swallow — the primary error response is the point.
  }
}

/**
 * Translate a new-shape submission element (with `type` and `restructuring`
 * fields) into the legacy restructure-pipeline shape (`category` + raw fields).
 * Idempotent for old-shape elements (which already have `category`).
 */
function normalizeElementShape(el) {
  if (!el || typeof el !== 'object') return el;
  if (el.category) return el;
  if (el.type) {
    const { type, restructuring: _r, ...rest } = el;
    return { category: type, ...rest };
  }
  return el;
}

export function handleOpenProof({ state_file, submission_material }) {
  const submission = submission_material || {};
  const consent = submission.consent;

  // 1. Consent gate — if invalid we cannot trust the seed, so we do NOT persist
  //    a rejected-open entry (no consent to attribute it to).
  const consentCheck = validateConsentToken(consent);
  if (!consentCheck.valid) {
    return {
      content: [{ type: 'text', text: JSON.stringify({
        code: 'INVALID_CONSENT',
        message: consentCheck.reason,
      })}],
      isError: true,
    };
  }

  // 2. Seed packet shape checks (NC-1). Each writes a rejection entry before returning.
  //    Order: shape check first, then already-open gate. A bad seed packet still
  //    deserves an audit trail entry even if the proof was previously opened
  //    (persistRejectedOpen preserves any existing proofStatus).
  if (typeof submission.problem_statement !== 'string' || submission.problem_statement.trim().length === 0) {
    persistRejectedOpen(state_file, consent, 'missing problem_statement');
    return {
      content: [{ type: 'text', text: JSON.stringify({
        code: 'INVALID_SEED_PACKET',
        message: 'problem_statement required (non-empty string)',
      })}],
      isError: true,
    };
  }

  // Concerns: accept either top-level `concerns` array (new shape) or
  // category:'Concern' entries inside `elements` (legacy shape).
  const topLevelConcerns = Array.isArray(submission.concerns) ? submission.concerns : [];
  const elementsArr = Array.isArray(submission.elements) ? submission.elements : [];
  const inlineConcerns = elementsArr.filter(e => e && (e.category === 'Concern' || e.type === 'Concern'));
  const totalConcerns = topLevelConcerns.length + inlineConcerns.length;
  if (totalConcerns < 1) {
    persistRejectedOpen(state_file, consent, 'missing Concern (at least one required)');
    return {
      content: [{ type: 'text', text: JSON.stringify({
        code: 'INVALID_SEED_PACKET',
        message: 'at least one Concern required',
      })}],
      isError: true,
    };
  }

  // Elements: at least one EVIDENCE entry (matched by either `type` or `category`).
  const hasEvidence = elementsArr.some(e => e && (e.type === 'EVIDENCE' || e.category === 'EVIDENCE'));
  if (!hasEvidence) {
    persistRejectedOpen(state_file, consent, 'missing Evidence (at least one required)');
    return {
      content: [{ type: 'text', text: JSON.stringify({
        code: 'INVALID_SEED_PACKET',
        message: 'at least one Evidence element required',
      })}],
      isError: true,
    };
  }

  // Restructuring action label: every element must carry one. Accept either
  // new-shape `restructuring.action` or legacy `restructuring_action_label`
  // (already-restructured submissions also satisfy via `restructuring.metadata`-bearing shapes).
  const missingLabel = elementsArr.find(e => {
    if (!e || typeof e !== 'object') return true;
    if (e.category === 'Concern' || e.type === 'Concern') return false;
    const newShape = typeof e.restructuring?.action === 'string' && e.restructuring.action.length > 0;
    const legacyShape = typeof e.restructuring_action_label === 'string' && e.restructuring_action_label.length > 0;
    return !(newShape || legacyShape);
  });
  if (missingLabel) {
    persistRejectedOpen(state_file, consent, 'missing restructuring action label on at least one element');
    return {
      content: [{ type: 'text', text: JSON.stringify({
        code: 'INVALID_SEED_PACKET',
        message: 'every element must carry restructuring action label',
      })}],
      isError: true,
    };
  }

  // 3. Already-open pre-check: refuse re-open of a still-open proof.
  if (existsSync(state_file)) {
    try {
      const existingState = loadState(state_file);
      if (existingState.proofStatus === 'planning') {
        return {
          content: [{ type: 'text', text: JSON.stringify({
            status: 'already_open',
            diagnostic: `Proof at ${state_file} is already open. Use a fresh state_file or initialize a new proof.`,
            proof_open: true,
          })}],
        };
      }
    } catch (_e) {
      // Malformed file: fall through; saveState below will overwrite on success.
    }
  }

  // 4. Translate submission into restructure-pipeline shape.
  //    - elements: { type, ... } → { category: type, ... }
  //    - top-level concerns lift into elements as { category: 'Concern' }.
  const normalizedElements = elementsArr.map(normalizeElementShape);
  const liftedConcerns = topLevelConcerns.map(c => ({
    category: 'Concern',
    label: c?.label,
    description: c?.description,
  }));
  const normalizedSubmission = {
    ...submission,
    elements: [...normalizedElements, ...liftedConcerns],
  };

  // 5. Restructure into typed proof elements.
  const restructured = restructure(normalizedSubmission);

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

  // 6. Open gate — NC-1 / NCON-3 enforcement on restructured artifacts.
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

  // 7. Initialize state. Append the op:'open' entry FIRST so it sits at
  //    operationLog[0] regardless of subsequent admit operations.
  let state = initializeState(restructured.problem_statement);
  appendOperationLog(state, {
    round: state.round,
    op: 'open',
    entityId: null,
    type: null,
    consent,
    changedFields: null,
    provenance: { source_directive: consent?.rationale ?? null },
  });
  state.proofStatus = 'planning';

  // 8. Apply admitted typed elements + provision Concerns.
  const admittedTypedElements = restructured.admitted.filter(a => a.category !== 'Concern');
  const admittedConcerns = restructured.admitted.filter(a => a.category === 'Concern');

  const ops = admittedTypedElements.map(adm => admittedToAddOp(adm));
  const applyResult = applyOperations(state, ops, consent);

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

  for (const concernCandidate of admittedConcerns) {
    const [, concernState] = addConcern(state, {
      label: concernCandidate.label,
      description: concernCandidate.description,
    }, consent);
    state = concernState;
  }

  // applyOperations and addConcern create their own clones; reassert proofStatus
  // on the final reference before persistence.
  state.proofStatus = 'planning';
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

export function handleWithdraw({ state_file, category, element_id, disposition, consent }) {
  // FRICTION uses override_friction_disposition (PERM-1). Reject explicitly even
  // though the schema enum already excludes FRICTION — bypass-via-direct-call
  // and looser callers must hit the same guard.
  if (category === 'FRICTION') {
    return {
      content: [{ type: 'text', text: JSON.stringify({
        code: 'INVALID_CATEGORY',
        message: 'FRICTION uses override_friction_disposition (PERM-1)',
      })}],
      isError: true,
    };
  }

  let state = loadState(state_file);

  if (state.proofStatus === 'finish') {
    return proofFinishedResponse();
  }

  let derivedCategory;
  try {
    derivedCategory = entityType(element_id);
  } catch (err) {
    return {
      content: [{ type: 'text', text: JSON.stringify({
        code: 'CATEGORY_MISMATCH',
        message: err.message,
      })}],
      isError: true,
    };
  }
  if (derivedCategory !== category) {
    return {
      content: [{ type: 'text', text: JSON.stringify({
        code: 'CATEGORY_MISMATCH',
        message: `id ${element_id} resolves to category ${derivedCategory}; caller passed ${category}`,
      })}],
      isError: true,
    };
  }

  let result;
  if (category === 'CONCERN') {
    result = withdrawConcern(state, element_id, disposition, consent);
  } else if (category === 'DEFINITION') {
    result = withdrawDefinition(state, element_id, disposition, consent);
  } else {
    result = withdrawElement(state, element_id, disposition, consent);
  }
  const [newState, err] = result;
  if (err) {
    // Map state-layer error string to coded MCP error. classifyStateError covers
    // INVALID_CONSENT and DOMAIN_ERROR; surface our richer codes (NOT_FOUND,
    // INVALID_CATEGORY, INVALID_DISPOSITION) directly.
    let code;
    if (err.startsWith('INVALID_CONSENT')) code = 'INVALID_CONSENT';
    else if (err.startsWith('NOT_FOUND')) code = 'NOT_FOUND';
    else if (err.startsWith('INVALID_CATEGORY')) code = 'INVALID_CATEGORY';
    else if (err.startsWith('INVALID_DISPOSITION')) code = 'INVALID_DISPOSITION';
    else code = classifyStateError(err).code;
    return {
      content: [{ type: 'text', text: JSON.stringify({ code, message: err }) }],
      isError: true,
    };
  }
  saveState(newState, state_file);
  return {
    content: [{ type: 'text', text: JSON.stringify({ withdrawn: element_id }) }],
  };
}

// ── Startup ──────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
