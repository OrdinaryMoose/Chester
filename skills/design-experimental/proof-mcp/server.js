// MCP server for design proof discipline.
// Thin wiring layer — all logic lives in proof.js, metrics.js, and state.js.

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { initializeState, applyOperations, markChallengeUsed, saveState, loadState } from './state.js';
import { checkAllIntegrity } from './proof.js';
import { computeCompleteness, computeGroundingCoverage, detectChallenge, checkClosure } from './metrics.js';

const ELEMENT_TYPES = ['EVIDENCE', 'RULE', 'PERMISSION', 'NECESSARY_CONDITION', 'RISK'];

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
              basis: {
                type: 'array', items: { type: 'string' },
                description: 'Basis element IDs (for RISK — conditions it attaches to)',
              },
              target: { type: 'string', description: 'Target element ID (for revise/withdraw)' },
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

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        ...state,
        elements: Object.fromEntries(state.elements),
        integrity_warnings: integrityWarnings,
        completeness,
        challenge_trigger: challengeTrigger,
        closure_permitted: closure.permitted,
        closure_reasons: closure.reasons,
      }),
    }],
  };
}

// ── Startup ──────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
