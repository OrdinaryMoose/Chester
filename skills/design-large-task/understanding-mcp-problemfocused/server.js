// MCP server for the problem-focused understanding system.
// Nine tenets, single-profile weighting, five cross-cutting mechanisms.
// Thin wiring layer — all logic lives in scoring.js and state.js.

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import {
  TENETS,
  WEIGHTS,
  VOCAB_CLASSIFICATIONS,
  VOCAB_ACTIONS,
  VOCAB_ACTION_MATRIX,
  computeOverall,
  findWeakestTenet,
  surfaceTermDriftCandidates,
} from './scoring.js';
import {
  initializeState,
  seedGlossaryFromExploration,
  applyVocabularyAction,
  submitRoundEvidence,
  resolveOverride,
  saveState,
  loadState,
} from './state.js';

const server = new Server(
  { name: 'chester-design-understanding-problemfocused', version: '0.1.0' },
  { capabilities: { tools: {} } }
);

// ── Tool Definitions ─────────────────────────────────────────────

const TOOLS = [
  {
    name: 'initialize_understanding',
    description: 'Initialize a new problem-focused understanding session. Returns the nine tenets, the single weight profile, and the empty glossary ready for Round-Zero seeding.',
    inputSchema: {
      type: 'object',
      properties: {
        user_prompt: { type: 'string', description: "The designer's initial request" },
        state_file: { type: 'string', description: 'Absolute path to persist state JSON' },
      },
      required: ['user_prompt', 'state_file'],
    },
  },
  {
    name: 'seed_glossary',
    description: 'Round-Zero glossary seed from exploration findings. Each term enters as PROPOSED-PENDING-DESIGNER until ratified.',
    inputSchema: {
      type: 'object',
      properties: {
        state_file: { type: 'string' },
        seed_terms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              canonical_name: { type: 'string' },
              definition: { type: 'string' },
              source: { type: 'object' },
              aliases: { type: 'array', items: { type: 'string' } },
              sense_constraints: { type: 'array', items: { type: 'string' } },
            },
            required: ['canonical_name', 'definition'],
          },
        },
      },
      required: ['state_file', 'seed_terms'],
    },
  },
  {
    name: 'apply_vocabulary_action',
    description: 'Mutate the active glossary. Action is one of ADD | REMOVE | RENAME | SPLIT | MERGE | REMOVE_AND_ADD | DEFER. Validity constrained by classification → action matrix.',
    inputSchema: {
      type: 'object',
      properties: {
        state_file: { type: 'string' },
        action: { type: 'string', enum: [...VOCAB_ACTIONS, 'REMOVE_AND_ADD'] },
        classification: { type: 'string', enum: VOCAB_CLASSIFICATIONS, description: 'Originating classification (CONSISTENT excluded — no action needed)' },
        target_terms: { type: 'array', items: { type: 'string' } },
        new_term: { type: 'object', description: 'For ADD/RENAME/SPLIT: { canonical_name, definition, aliases?, sense_constraints?, split_into? }' },
        reason: { type: 'string' },
        designer_quote: { type: 'string' },
      },
      required: ['state_file', 'action', 'target_terms'],
    },
  },
  {
    name: 'submit_round_evidence',
    description: 'Submit a round of problem-focused understanding evidence across the nine tenets. Phase-vocabulary classifier and Convention-Break Override Rule apply at the API boundary; offending entries route to Solve Leakage Ledger or pending_override.',
    inputSchema: {
      type: 'object',
      properties: {
        state_file: { type: 'string' },
        problem_articulation: { type: 'array', items: { type: 'object' } },
        success_criteria: { type: 'array', items: { type: 'object' } },
        done_state_vision: { type: 'array', items: { type: 'object' } },
        constraint_envelope: { type: 'array', items: { type: 'object' } },
        scope_boundary: { type: 'array', items: { type: 'object' } },
        personal_use_case_map: { type: 'array', items: { type: 'object' } },
        cost_energy_budget: { type: 'array', items: { type: 'object' } },
        project_fit: { type: 'array', items: { type: 'object' } },
        open_questions_ledger: { type: 'array', items: { type: 'object' } },
        repeat_back_statement: { type: 'string', description: 'Agent restated problem statement (designer ratification expected)' },
        repeat_back_designer_quote: { type: 'string', description: 'Designer quote ratifying the restatement' },
      },
      required: ['state_file'],
    },
  },
  {
    name: 'resolve_override',
    description: 'Resolve a pending Convention-Break Override. Disposition: RATIFIED | REJECTED | DEFERRED.',
    inputSchema: {
      type: 'object',
      properties: {
        state_file: { type: 'string' },
        override_index: { type: 'integer' },
        disposition: { type: 'string', enum: ['RATIFIED', 'REJECTED', 'DEFERRED'] },
        designer_quote: { type: 'string' },
      },
      required: ['state_file', 'override_index', 'disposition'],
    },
  },
  {
    name: 'get_understanding_state',
    description: 'Load current understanding state. Returns tenet scores, overall, weakest tenet, full glossary, vocabulary action log, pending overrides, pending vocab dispositions, repeat-back history, solve leakage ledger, term-drift candidates, and transition status.',
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
      case 'seed_glossary': return handleSeedGlossary(args);
      case 'apply_vocabulary_action': return handleApplyVocabAction(args);
      case 'submit_round_evidence': return handleSubmitRound(args);
      case 'resolve_override': return handleResolveOverride(args);
      case 'get_understanding_state': return handleGetState(args);
      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
    }
  } catch (err) {
    return { content: [{ type: 'text', text: err.message }], isError: true };
  }
});

// ── Tool Handlers ────────────────────────────────────────────────

function handleInitialize({ user_prompt, state_file }) {
  const state = initializeState(user_prompt);
  saveState(state, state_file);
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        status: 'initialized',
        tenets: TENETS,
        weights: WEIGHTS,
        vocab_action_matrix: VOCAB_ACTION_MATRIX,
        next_step: 'Optionally call seed_glossary with terms extracted from exploration; then submit_round_evidence may begin.',
        state_file,
      }, null, 2),
    }],
  };
}

function handleSeedGlossary({ state_file, seed_terms }) {
  let state = loadState(state_file);
  state = seedGlossaryFromExploration(state, seed_terms);
  saveState(state, state_file);
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        status: 'glossary_seeded',
        glossary: state.glossary,
        seeded_count: state.glossary.length,
      }, null, 2),
    }],
  };
}

function handleApplyVocabAction({ state_file, action, classification, target_terms, new_term, reason, designer_quote }) {
  let state = loadState(state_file);
  const result = applyVocabularyAction(state, { action, classification, target_terms, new_term, reason, designer_quote });
  if (!result.valid) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ status: 'rejected', errors: result.errors }, null, 2) }],
      isError: true,
    };
  }
  saveState(result.state, state_file);
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        status: 'action_applied',
        action,
        glossary: result.state.glossary,
        action_log_entry: result.state.vocabularyActionLog[result.state.vocabularyActionLog.length - 1],
      }, null, 2),
    }],
  };
}

function handleSubmitRound({ state_file, ...submission }) {
  let state = loadState(state_file);
  const result = submitRoundEvidence(state, submission);
  saveState(result.state, state_file);

  const overall = computeOverall(result.state.tenetScores);
  const weakest = findWeakestTenet(result.state.tenetScores);
  const drift = surfaceTermDriftCandidates(result.state);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        status: 'round_submitted',
        round: result.state.round,
        tenet_scores: result.state.tenetScores,
        overall,
        weakest,
        glossary: result.state.glossary,           // returned every round per design
        pending_overrides: result.state.pendingOverrides.filter(p => !p.resolved),
        pending_vocab_dispositions: result.state.pendingVocabDispositions.filter(p => !p.resolved),
        solve_leakage_this_round: result.leaked_entries,
        solve_leakage_total: result.state.solveLeakageLedger.length,
        term_drift_candidates: drift,
        repeat_back_history: result.state.repeatBackHistory.slice(-3),
        transition: result.state.transition,
        flags: result.flags,
      }, null, 2),
    }],
  };
}

function handleResolveOverride({ state_file, override_index, disposition, designer_quote }) {
  let state = loadState(state_file);
  state = resolveOverride(state, override_index, { disposition, designer_quote });
  saveState(state, state_file);
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        status: 'override_resolved',
        disposition,
        pending_overrides: state.pendingOverrides.filter(p => !p.resolved).length,
        tenet_scores: state.tenetScores,
      }, null, 2),
    }],
  };
}

function handleGetState({ state_file }) {
  const state = loadState(state_file);
  const overall = computeOverall(state.tenetScores);
  const weakest = findWeakestTenet(state.tenetScores);
  const drift = surfaceTermDriftCandidates(state);
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        ...state,
        overall,
        weakest,
        term_drift_candidates: drift,
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
