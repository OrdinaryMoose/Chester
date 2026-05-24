// MCP server for the architectural-tenets understanding system.
// Six tenets, flat-weighted per problem type, asymmetric event multipliers.
// Thin wiring layer — all logic lives in scoring.js and state.js.

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import {
  TENETS,
  PROBLEM_TYPES,
  WEIGHT_PROFILES,
  computePredictionCalibration,
  findWeakestTenet,
  computeOverallScore,
  checkTransitionReady,
} from './scoring.js';
import {
  initializeState,
  confirmProblemType,
  reclassifyProblemType,
  registerPredictions,
  resolvePredictions,
  submitRoundEvidence,
  markFalsifierTriggered,
  saveState,
  loadState,
} from './state.js';

const server = new Server(
  { name: 'chester-design-understanding-architectural', version: '0.1.0' },
  { capabilities: { tools: {} } }
);

// ── Tool Definitions ─────────────────────────────────────────────

const TOOLS = [
  {
    name: 'initialize_understanding',
    description: 'Initialize a new architectural-tenets understanding session. Returns proposed problem type and the six tenets the session will track.',
    inputSchema: {
      type: 'object',
      properties: {
        user_prompt: { type: 'string', description: "The designer's initial request" },
        proposed_type: {
          type: 'string',
          enum: PROBLEM_TYPES,
          description: 'Agent-proposed problem type for designer ratification',
        },
        state_file: { type: 'string', description: 'Absolute path to persist state JSON' },
      },
      required: ['user_prompt', 'state_file'],
    },
  },
  {
    name: 'confirm_problem_type',
    description: "Designer-ratification of the problem type. Locks weight profile.",
    inputSchema: {
      type: 'object',
      properties: {
        state_file: { type: 'string' },
        problem_type: { type: 'string', enum: PROBLEM_TYPES },
        designer_turn_id: { type: 'string' },
      },
      required: ['state_file', 'problem_type', 'designer_turn_id'],
    },
  },
  {
    name: 'reclassify_problem_type',
    description: 'Mid-sprint type shift. Applies 0.10 overall penalty.',
    inputSchema: {
      type: 'object',
      properties: {
        state_file: { type: 'string' },
        new_type: { type: 'string', enum: PROBLEM_TYPES },
        reason: { type: 'string' },
        designer_turn_id: { type: 'string' },
      },
      required: ['state_file', 'new_type', 'reason', 'designer_turn_id'],
    },
  },
  {
    name: 'register_predictions',
    description: 'Lock predictions about designer responses BEFORE asking the corresponding question. Server-timestamped, immutable.',
    inputSchema: {
      type: 'object',
      properties: {
        state_file: { type: 'string' },
        predictions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              expected_response: { type: 'string' },
              confidence: { type: 'number', minimum: 0, maximum: 1 },
              predicted_at_turn: { type: 'string' },
            },
            required: ['question', 'expected_response', 'confidence', 'predicted_at_turn'],
          },
        },
      },
      required: ['state_file', 'predictions'],
    },
  },
  {
    name: 'resolve_predictions',
    description: "Record designer's response and outcome (HIT/PARTIAL/MISS) for previously-locked predictions.",
    inputSchema: {
      type: 'object',
      properties: {
        state_file: { type: 'string' },
        resolutions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              prediction_id: { type: 'string' },
              designer_turn_id: { type: 'string' },
              response_quote: { type: 'string' },
              outcome: { type: 'string', enum: ['HIT', 'PARTIAL', 'MISS'] },
              model_update: { type: 'string', description: 'Optional: text describing how agent will revise its frame given this miss' },
            },
            required: ['prediction_id', 'designer_turn_id', 'response_quote', 'outcome'],
          },
        },
      },
      required: ['state_file', 'resolutions'],
    },
  },
  {
    name: 'submit_round_evidence',
    description: 'Submit a round of architectural understanding evidence across the six tenets. Schema-validated; entries with structural errors are rejected.',
    inputSchema: {
      type: 'object',
      properties: {
        state_file: { type: 'string' },
        reach_profile: { type: 'array', items: { type: 'object' } },
        existing_system_disposition: { type: 'array', items: { type: 'object' } },
        fragility_coupling_map: { type: 'array', items: { type: 'object' } },
        pattern_principle_lineage: { type: 'array', items: { type: 'object' } },
        vision_alignment: { type: 'array', items: { type: 'object' } },
        maintainability_forecast: { type: 'array', items: { type: 'object' } },
        frame_falsifiers: {
          type: 'array',
          minItems: 3,
          maxItems: 3,
          items: {
            type: 'object',
            properties: {
              statement: { type: 'string' },
              target_element_id: { type: 'string' },
            },
            required: ['statement', 'target_element_id'],
          },
        },
        divergences: { type: 'array', items: { type: 'object' } },
        negative_evidence: {
          type: 'object',
          properties: {
            evidence: { type: 'string' },
            weakens_claim_id: { type: 'string' },
          },
          required: ['evidence'],
        },
        architectural_target_artifact_present: { type: 'boolean' },
        architectural_target_artifact_path: { type: 'string' },
      },
      required: ['state_file', 'frame_falsifiers', 'negative_evidence'],
    },
  },
  {
    name: 'mark_falsifier_triggered',
    description: 'Mark a falsifier as activated by a designer turn. Watch next round for frame revision on the falsifier target.',
    inputSchema: {
      type: 'object',
      properties: {
        state_file: { type: 'string' },
        falsifier_id: { type: 'string' },
        designer_turn_id: { type: 'string' },
        quote: { type: 'string' },
      },
      required: ['state_file', 'falsifier_id', 'designer_turn_id', 'quote'],
    },
  },
  {
    name: 'get_understanding_state',
    description: 'Load current understanding state and check transition readiness.',
    inputSchema: {
      type: 'object',
      properties: { state_file: { type: 'string' } },
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
      case 'initialize_understanding': return handleInitialize(args);
      case 'confirm_problem_type': return handleConfirmType(args);
      case 'reclassify_problem_type': return handleReclassifyType(args);
      case 'register_predictions': return handleRegisterPredictions(args);
      case 'resolve_predictions': return handleResolvePredictions(args);
      case 'submit_round_evidence': return handleSubmitRound(args);
      case 'mark_falsifier_triggered': return handleMarkFalsifier(args);
      case 'get_understanding_state': return handleGetState(args);
      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
    }
  } catch (err) {
    return { content: [{ type: 'text', text: err.message }], isError: true };
  }
});

// ── Tool Handlers ────────────────────────────────────────────────

function handleInitialize({ user_prompt, proposed_type = 'default', state_file }) {
  const state = initializeState(user_prompt, proposed_type);
  saveState(state, state_file);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        status: 'initialized',
        proposed_type,
        tenets: TENETS,
        problem_types_available: PROBLEM_TYPES,
        weight_profiles: WEIGHT_PROFILES,
        next_step: "designer must confirm problem type via confirm_problem_type before submit_round_evidence is permitted",
        state_file,
      }, null, 2),
    }],
  };
}

function handleConfirmType({ state_file, problem_type, designer_turn_id }) {
  let state = loadState(state_file);
  state = confirmProblemType(state, problem_type, designer_turn_id);
  saveState(state, state_file);
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        status: 'type_locked',
        problem_type,
        active_weights: WEIGHT_PROFILES[problem_type],
        designer_turn_id,
      }, null, 2),
    }],
  };
}

function handleReclassifyType({ state_file, new_type, reason, designer_turn_id }) {
  let state = loadState(state_file);
  state = reclassifyProblemType(state, new_type, reason, designer_turn_id);
  saveState(state, state_file);
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        status: 'type_reclassified',
        new_type,
        reason,
        penalty_accrued: state.reclassifyPenaltyAccrued,
        type_shift_log: state.typeShiftLog,
      }, null, 2),
    }],
  };
}

function handleRegisterPredictions({ state_file, predictions }) {
  let state = loadState(state_file);
  const result = registerPredictions(state, predictions);
  saveState(result.state, state_file);
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        status: 'predictions_locked',
        registered: result.registered.map(p => ({ id: p.id, question: p.question, confidence: p.confidence })),
      }, null, 2),
    }],
  };
}

function handleResolvePredictions({ state_file, resolutions }) {
  let state = loadState(state_file);
  const result = resolvePredictions(state, resolutions);
  saveState(result.state, state_file);
  const calib = computePredictionCalibration(result.state.predictions, result.state.predictionResolutions);
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        status: 'predictions_resolved',
        resolved_count: result.recorded.length,
        calibration: calib,
      }, null, 2),
    }],
  };
}

function handleSubmitRound({ state_file, ...submission }) {
  let state = loadState(state_file);
  const result = submitRoundEvidence(state, submission);
  if (!result.valid) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ status: 'rejected', errors: result.errors, warnings: result.warnings }, null, 2),
      }],
      isError: true,
    };
  }
  saveState(result.state, state_file);

  const overall = computeOverallScore(result.state.tenetScores, result.state.problemType, result.state.reclassifyPenaltyAccrued);
  const weakest = findWeakestTenet(result.state.tenetScores, result.state.problemType);
  const calib = computePredictionCalibration(result.state.predictions, result.state.predictionResolutions);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        status: 'accepted',
        round: result.state.round,
        tenet_scores: result.state.tenetScores,
        overall,
        weakest,
        prediction_calibration: calib,
        suspicion_flags: result.state.suspicionFlags.filter(f => f.round === result.state.round),
        transition: result.state.transition,
        density_cap_hit: result.densityCapHit,
        warnings: result.warnings,
      }, null, 2),
    }],
  };
}

function handleMarkFalsifier({ state_file, falsifier_id, designer_turn_id, quote }) {
  let state = loadState(state_file);
  state = markFalsifierTriggered(state, falsifier_id, designer_turn_id, quote);
  saveState(state, state_file);
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        status: 'falsifier_triggered',
        falsifier_id,
        triggered_round: state.round,
        next_round_watch: 'agent must revise the falsifier target element next round or trigger is withdrawn',
      }, null, 2),
    }],
  };
}

function handleGetState({ state_file }) {
  const state = loadState(state_file);
  const overall = state.problemType
    ? computeOverallScore(state.tenetScores, state.problemType, state.reclassifyPenaltyAccrued)
    : 0;
  const weakest = state.problemType ? findWeakestTenet(state.tenetScores, state.problemType) : null;
  const calib = computePredictionCalibration(state.predictions ?? [], state.predictionResolutions ?? []);
  const transition = checkTransitionReady(state);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        ...state,
        overall,
        weakest,
        prediction_calibration: calib,
        transition,
      }, null, 2),
    }],
  };
}

// ── Startup ──────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
