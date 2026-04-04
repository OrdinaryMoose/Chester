// MCP server for enforcement scoring discipline.
// Thin wiring layer — all logic lives in scoring.js and state.js.

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { validateScoreSubmission, checkClosure } from './scoring.js';
import { initializeState, updateState, markChallengeUsed, saveState, loadState } from './state.js';

const server = new Server(
  { name: 'chester-enforcement', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// ── Tool Definitions ─────────────────────────────────────────────

const TOOLS = [
  {
    name: 'initialize_interview',
    description: 'Initialize a new architect interview session with scoring dimensions',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['greenfield', 'brownfield'], description: 'Interview type' },
        problem_statement: { type: 'string', description: 'The problem statement to evaluate' },
        state_file: { type: 'string', description: 'Absolute path to persist state JSON' },
      },
      required: ['type', 'problem_statement', 'state_file'],
    },
  },
  {
    name: 'submit_scores',
    description: 'Submit dimension scores for the current interview round',
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
        gate_evidence: {
          type: 'object',
          description: 'Optional gate satisfaction evidence',
          properties: {
            non_goals_addressed: { type: 'boolean' },
            decision_boundaries_addressed: { type: 'boolean' },
            pressure_follow_up: {
              type: ['object', 'null'],
              properties: { original_round: { type: 'number' } },
            },
          },
        },
        challenge_used: {
          type: 'string',
          enum: ['contrarian', 'simplifier', 'ontologist'],
          description: 'Optional challenge mode used this round',
        },
      },
      required: ['state_file', 'scores'],
    },
  },
  {
    name: 'get_state',
    description: 'Load current interview state and check closure eligibility',
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
      case 'initialize_interview':
        return handleInitialize(args);
      case 'submit_scores':
        return handleSubmitScores(args);
      case 'get_state':
        return handleGetState(args);
      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
    }
  } catch (err) {
    return { content: [{ type: 'text', text: err.message }], isError: true };
  }
});

// ── Tool Handlers ────────────────────────────────────────────────

function handleInitialize({ type, problem_statement, state_file }) {
  const state = initializeState(type, problem_statement);
  saveState(state, state_file);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        status: 'initialized',
        type,
        dimensions: Object.keys(state.scores),
        state_file,
      }),
    }],
  };
}

function handleSubmitScores({ state_file, scores, gate_evidence, challenge_used }) {
  let state = loadState(state_file);

  // Build previousScores flat map for jump detection
  const previousScores = {};
  for (const [dim, entry] of Object.entries(state.scores)) {
    previousScores[dim] = entry.score;
  }

  // validateScoreSubmission expects an array of { dimension, score, justification, gap }
  const scoresArray = Object.entries(scores).map(([dimension, entry]) => ({
    dimension,
    ...entry,
  }));

  const validation = validateScoreSubmission(scoresArray, previousScores);
  if (!validation.valid) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ status: 'rejected', errors: validation.errors, warnings: validation.warnings }),
      }],
      isError: true,
    };
  }

  // Map gate_evidence from snake_case to camelCase
  let gateEvidence = null;
  if (gate_evidence) {
    gateEvidence = {
      nonGoalsAddressed: gate_evidence.non_goals_addressed ?? false,
      decisionBoundariesAddressed: gate_evidence.decision_boundaries_addressed ?? false,
      pressureFollowUp: gate_evidence.pressure_follow_up
        ? { originalRound: gate_evidence.pressure_follow_up.original_round }
        : null,
    };
  }

  // Update state with new scores
  state = updateState(state, scores, gateEvidence);

  // Mark challenge if used
  if (challenge_used) {
    state = markChallengeUsed(state, challenge_used);
  }

  // Check closure eligibility
  const ambiguity = state.ambiguityHistory[state.ambiguityHistory.length - 1];
  const closure = checkClosure({
    ambiguity,
    gates: state.gates,
    pressurePassComplete: state.pressurePassComplete,
  });

  // Persist
  saveState(state, state_file);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        status: 'accepted',
        round: state.round,
        composite_ambiguity: ambiguity,
        weakest_dimension: state.stagePriority?.weakest ?? null,
        current_stage: state.stagePriority?.stage ?? null,
        gates: {
          non_goals_explicit: state.gates.nonGoalsExplicit,
          decision_boundaries_explicit: state.gates.decisionBoundariesExplicit,
        },
        challenge_trigger: state.challengeTrigger,
        stall_detected: state.stalled,
        closure_permitted: closure.permitted,
        closure_reasons: closure.reasons,
        warnings: validation.warnings,
      }),
    }],
  };
}

function handleGetState({ state_file }) {
  const state = loadState(state_file);

  const ambiguity = state.ambiguityHistory.length > 0
    ? state.ambiguityHistory[state.ambiguityHistory.length - 1]
    : null;

  const closure = checkClosure({
    ambiguity,
    gates: state.gates,
    pressurePassComplete: state.pressurePassComplete,
  });

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        ...state,
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
