// MCP server for understanding scoring discipline.
// Thin wiring layer — all logic lives in scoring.js and state.js.

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { validateUnderstandingSubmission, computeGroupSaturation, computeOverallSaturation, findWeakestDimension, collectGaps, checkTransitionReady } from './scoring.js';
import { initializeState, updateState, saveState, loadState } from './state.js';

const server = new Server(
  { name: 'chester-understanding', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// ── Tool Definitions ─────────────────────────────────────────────

const TOOLS = [
  {
    name: 'initialize_understanding',
    description: 'Initialize a new understanding session with nine dimensions',
    inputSchema: {
      type: 'object',
      properties: {
        user_prompt: { type: 'string', description: 'The user\'s initial request' },
        context_type: { type: 'string', enum: ['greenfield', 'brownfield'], description: 'Project context type' },
        state_file: { type: 'string', description: 'Absolute path to persist state JSON' },
      },
      required: ['user_prompt', 'context_type', 'state_file'],
    },
  },
  {
    name: 'submit_understanding',
    description: 'Submit understanding dimension scores for the current round',
    inputSchema: {
      type: 'object',
      properties: {
        state_file: { type: 'string', description: 'Absolute path to state JSON' },
        scores: {
          type: 'object',
          description: 'Scores keyed by dimension, each with score, justification, and gap',
          additionalProperties: {
            type: 'object',
            properties: {
              score: { type: 'number' },
              justification: { type: 'string' },
              gap: { type: 'string' },
            },
            required: ['score', 'justification'],
          },
        },
      },
      required: ['state_file', 'scores'],
    },
  },
  {
    name: 'get_understanding_state',
    description: 'Load current understanding state and check transition readiness',
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
      case 'initialize_understanding':
        return handleInitialize(args);
      case 'submit_understanding':
        return handleSubmitUnderstanding(args);
      case 'get_understanding_state':
        return handleGetState(args);
      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
    }
  } catch (err) {
    return { content: [{ type: 'text', text: err.message }], isError: true };
  }
});

// ── Tool Handlers ────────────────────────────────────────────────

function handleInitialize({ user_prompt, context_type, state_file }) {
  const state = initializeState(context_type, user_prompt);
  saveState(state, state_file);

  const DIMENSION_GROUPS = {
    landscape: ['surface_coverage', 'relationship_mapping', 'constraint_discovery', 'risk_topology'],
    human_context: ['stakeholder_impact', 'prior_art'],
    foundations: ['temporal_context', 'problem_boundary', 'assumption_inventory'],
  };

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        status: 'initialized',
        context_type,
        dimensions: Object.keys(state.scores),
        dimension_groups: DIMENSION_GROUPS,
        state_file,
      }),
    }],
  };
}

function handleSubmitUnderstanding({ state_file, scores }) {
  let state = loadState(state_file);

  // Build previousScores flat map for jump detection
  const previousScores = {};
  for (const [dim, entry] of Object.entries(state.scores)) {
    previousScores[dim] = entry.score;
  }

  // validateUnderstandingSubmission expects an array of { dimension, score, justification, gap }
  const scoresArray = Object.entries(scores).map(([dimension, entry]) => ({
    dimension,
    ...entry,
  }));

  const validation = validateUnderstandingSubmission(scoresArray, previousScores);
  if (!validation.valid) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ status: 'rejected', errors: validation.errors, warnings: validation.warnings }),
      }],
      isError: true,
    };
  }

  // Update state with new scores
  state = updateState(state, scores);

  // Persist
  saveState(state, state_file);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        status: 'accepted',
        round: state.round,
        overall_saturation: state.overallSaturation,
        group_saturation: state.groupSaturation,
        weakest_group: state.weakest?.group ?? null,
        weakest_dimension: state.weakest?.dimension ?? null,
        gaps_summary: state.gapsSummary.slice(0, 5),
        transition_ready: state.transition.ready,
        transition_reasons: state.transition.reasons,
        warnings: validation.warnings,
      }),
    }],
  };
}

function handleGetState({ state_file }) {
  const state = loadState(state_file);

  const groupSaturation = computeGroupSaturation(state.scores);
  const overall = computeOverallSaturation(groupSaturation);
  const transition = checkTransitionReady(state);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        ...state,
        overall_saturation: overall,
        group_saturation: groupSaturation,
        transition_ready: transition.ready,
        transition_reasons: transition.reasons,
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
