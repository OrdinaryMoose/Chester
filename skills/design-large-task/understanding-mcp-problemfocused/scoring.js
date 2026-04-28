// Scoring engine for the problem-focused understanding MCP.
// Pure functions — all computation, no I/O.
//
// Nine tenets, single weight profile (solo-dev personal-project default),
// five cross-cutting mechanisms enforced via state.js + server.js wiring.
//
// LLM-judge dispatches are stamped TODO. Lexical/structural validation runs
// natively; semantic verification is a follow-up infra sprint.

// ── Tenets ────────────────────────────────────────────────────────

export const TENETS = [
  'problem_articulation',
  'success_criteria',
  'done_state_vision',
  'constraint_envelope',
  'scope_boundary',
  'personal_use_case_map',
  'cost_energy_budget',
  'project_fit',
  'open_questions_ledger',
];

// ── Weight Profile (single, solo-dev default) ─────────────────────

export const WEIGHTS = {
  problem_articulation: 0.20,
  success_criteria: 0.15,
  done_state_vision: 0.10,
  constraint_envelope: 0.15,
  scope_boundary: 0.10,
  personal_use_case_map: 0.10,
  cost_energy_budget: 0.05,
  project_fit: 0.05,
  open_questions_ledger: 0.10,
};

// ── Constants ─────────────────────────────────────────────────────

export const TENET_FLOOR = 0.40;
export const OVERALL_THRESHOLD = 0.65;
export const REPEAT_BACK_COSINE_FLOOR = 0.7;
export const REPEAT_BACK_REQUIRED_FROM_ROUND = 3;
export const TERM_DRIFT_ROUND_THRESHOLD = 3;

// Tenets eligible for Convention-Break Override Rule
export const OVERRIDE_TARGET_TENETS = [
  'project_fit',
  'constraint_envelope',
  'scope_boundary',
  // open_questions_ledger handled via vocabulary classifier's redefinition path
];

// ── Phase-Vocabulary Classifier (lexical layer) ───────────────────

// Solve-side tokens that should NOT appear as load-bearing nouns in
// problem-side evidence. LLM-judge fallback is TODO; lexical layer covers
// the most common drift vectors.
const SOLVE_VOCABULARY_TOKENS = [
  'payload', 'schema', 'protocol', 'interface', 'endpoint',
  'sync', 'async', 'batch', 'streaming',
  'module', 'layer', 'topology', 'pipeline',
  'verb', 'operation', 'rpc',
  'factory', 'repository', 'adapter', 'facade', 'singleton',
  'observer', 'strategy', 'visitor', 'decorator',
  'hexagonal', 'clean architecture', 'event-driven', 'microservice',
  'pub/sub', 'message bus', 'queue', 'broker',
  'rest', 'graphql', 'grpc',
  'ack semantics', 'sequence semantics',
];

const ARCHITECTURAL_PRESCRIPTION_PHRASES = [
  'should be implemented as',
  'must be designed as',
  'should be structured',
  'will be refactored',
  'split into',
  'extracted into',
  'decoupled from',
  'wrapped in',
];

export function classifyPhaseVocabulary(text) {
  if (!text) return { violation: false, tokens: [] };
  const lowered = text.toLowerCase();
  const found = [];

  for (const token of SOLVE_VOCABULARY_TOKENS) {
    const re = new RegExp(`\\b${token.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\b`, 'i');
    if (re.test(lowered)) found.push({ kind: 'solve_token', token });
  }

  for (const phrase of ARCHITECTURAL_PRESCRIPTION_PHRASES) {
    if (lowered.includes(phrase)) found.push({ kind: 'architectural_prescription', phrase });
  }

  return { violation: found.length > 0, tokens: found };
  // TODO: LLM-judge fallback for borderline cases ("Is this claim about WHAT
  //       we are solving, or HOW we will solve it?")
}

// ── Per-Entry Validation ──────────────────────────────────────────

export function validateEntry(entry, tenet) {
  const errors = [];
  const flags = [];

  if (!entry.text) {
    errors.push(`${tenet}: entry requires text`);
    return { errors, flags };
  }

  // Phase-vocabulary classifier
  const phaseCheck = classifyPhaseVocabulary(entry.text);
  if (phaseCheck.violation) {
    errors.push(
      `${tenet}: phase-vocabulary violation — solve-side tokens: ${phaseCheck.tokens.map(t => t.token || t.phrase).join(', ')}`
    );
  }

  // Tenet-specific shape rules
  switch (tenet) {
    case 'problem_articulation':
      // Must contain observable-behavior framing, not architectural claims
      if (!entry.current_behavior && !entry.desired_behavior) {
        flags.push('problem_articulation: entry missing both current_behavior and desired_behavior — at least one expected');
      }
      break;

    case 'success_criteria':
      if (!entry.measurement && !entry.observable && !entry.anti_goal) {
        errors.push('success_criteria: entry requires measurement, observable, or anti_goal field');
      }
      break;

    case 'done_state_vision':
      if (!entry.imagined_moment) {
        errors.push('done_state_vision: entry requires imagined_moment field — concrete picture, not abstract criterion');
      }
      break;

    case 'constraint_envelope':
      if (!entry.constraint_type || !['hard_limit', 'inheritance'].includes(entry.constraint_type)) {
        errors.push('constraint_envelope: entry requires constraint_type (hard_limit | inheritance)');
      }
      if (!entry.source) {
        errors.push('constraint_envelope: entry requires source citation');
      }
      break;

    case 'scope_boundary':
      if (!entry.placement || !['IN', 'OUT', 'BORDERLINE'].includes(entry.placement)) {
        errors.push('scope_boundary: entry requires placement (IN | OUT | BORDERLINE)');
      }
      if (!entry.source) {
        errors.push('scope_boundary: entry requires source citation');
      }
      break;

    case 'personal_use_case_map':
      if (!entry.role || !['current_me', 'future_me'].includes(entry.role)) {
        errors.push('personal_use_case_map: entry requires role (current_me | future_me)');
      }
      if (!entry.scenario) {
        errors.push('personal_use_case_map: entry requires scenario');
      }
      if (entry.role === 'future_me' && !entry.context_assumed_lost) {
        flags.push('personal_use_case_map: future_me entries should specify context_assumed_lost');
      }
      break;

    case 'cost_energy_budget':
      if (!entry.dimension || !['effort_tolerance', 'complexity_ceiling', 'maintenance_budget', 'why_now'].includes(entry.dimension)) {
        errors.push('cost_energy_budget: entry requires dimension (effort_tolerance | complexity_ceiling | maintenance_budget | why_now)');
      }
      // Walk-away conditions are NOT required (per design — soft, agent commentary only)
      break;

    case 'project_fit':
      if (!entry.alignment || !['ALIGNED', 'NEUTRAL', 'MISFIT'].includes(entry.alignment)) {
        errors.push('project_fit: entry requires alignment (ALIGNED | NEUTRAL | MISFIT)');
      }
      if (entry.alignment === 'MISFIT' && !entry.override_reason) {
        // Convention-Break Override Rule: MISFIT requires override
        flags.push('project_fit: MISFIT entry requires override_reason for Convention-Break Override Rule');
      }
      if (!entry.project_convention_referenced) {
        errors.push('project_fit: entry requires project_convention_referenced (name a project convention/aesthetic/philosophy)');
      }
      break;

    case 'open_questions_ledger':
      if (!entry.question_source || !['designer_hesitation', 'agent_uncertainty', 'ambiguous_term', 'leaked_solve_item'].includes(entry.question_source)) {
        errors.push('open_questions_ledger: entry requires question_source');
      }
      if (!entry.status || !['OPEN', 'RESOLVED-VIA-QUOTE', 'DEFERRED-TO-SOLVE', 'INVALIDATED'].includes(entry.status)) {
        errors.push('open_questions_ledger: entry requires status');
      }
      break;
  }

  return { errors, flags };
}

// ── Vocabulary Lockdown Classifier ────────────────────────────────

export const VOCAB_CLASSIFICATIONS = ['CONSISTENT', 'PROPOSE', 'DEPRECATE', 'DRIFT', 'CONFLICT'];
export const VOCAB_ACTIONS = ['ADD', 'REMOVE', 'RENAME', 'SPLIT', 'MERGE', 'DEFER'];

// Valid actions per classification (the matrix)
export const VOCAB_ACTION_MATRIX = {
  CONSISTENT: [],                                        // no action; entry passes
  PROPOSE: ['ADD', 'DEFER'],
  DEPRECATE: ['REMOVE', 'DEFER'],
  DRIFT: ['RENAME', 'SPLIT', 'REMOVE_AND_ADD', 'DEFER'],
  CONFLICT: ['MERGE', 'RENAME', 'SPLIT', 'DEFER'],
};

// Term extraction is LLM-judge work; placeholder stub returns no terms.
// Server-side can call this; production should replace with a dispatch.
export function extractLoadBearingTerms(_text) {
  // TODO: dispatch LLM-judge to extract load-bearing noun-phrases
  return [];
}

// Classify a term against the active glossary.
// glossary: array of { canonical_name, aliases[], definition, status }
// term: string (extracted load-bearing noun-phrase)
// usage_context: surrounding text where term appeared this round
export function classifyTerm(term, glossary, _usage_context) {
  const lowered = term.toLowerCase();

  // CONSISTENT or DRIFT: term is in glossary as canonical_name or alias
  for (const entry of glossary) {
    const matchCanonical = entry.canonical_name.toLowerCase() === lowered;
    const matchAlias = (entry.aliases ?? []).some(a => a.toLowerCase() === lowered);
    if (matchCanonical || matchAlias) {
      // TODO: LLM-judge — does usage_context match entry.definition's sense?
      //       If yes → CONSISTENT. If no → DRIFT.
      // Placeholder: assume CONSISTENT for now.
      return { classification: 'CONSISTENT', matched_entry: entry.canonical_name };
    }
  }

  // CONFLICT: term not in glossary, but glossary may already cover the same concept
  // TODO: LLM-judge — same-concept check against each glossary entry's definition.
  // Placeholder: assume PROPOSE (no conflict detected without LLM).
  return { classification: 'PROPOSE' };
  // TODO: handle DEPRECATE classification (agent-asserted)
}

export function validateVocabularyAction({ action, classification, target_terms }) {
  const errors = [];
  if (!VOCAB_ACTIONS.concat(['REMOVE_AND_ADD']).includes(action)) {
    errors.push(`unknown vocab action: ${action}`);
    return errors;
  }
  if (classification && !VOCAB_CLASSIFICATIONS.includes(classification)) {
    errors.push(`unknown classification: ${classification}`);
  }
  if (classification && !VOCAB_ACTION_MATRIX[classification].includes(action)) {
    errors.push(`action ${action} not valid for classification ${classification} (allowed: ${VOCAB_ACTION_MATRIX[classification].join(', ')})`);
  }
  if (!target_terms || target_terms.length === 0) {
    errors.push('vocab action requires target_terms');
  }
  if (action === 'MERGE' && (!target_terms || target_terms.length < 2)) {
    errors.push('MERGE requires at least 2 target_terms');
  }
  if (action === 'SPLIT' && (!target_terms || target_terms.length !== 1)) {
    errors.push('SPLIT requires exactly 1 target_term (the term being split)');
  }
  return errors;
}

// ── Per-Round Validation ──────────────────────────────────────────

export function validateRoundSubmission(submission, _state) {
  const errors = [];
  const flags = [];

  if (!submission || typeof submission !== 'object') {
    return { valid: false, errors: ['submission must be an object'], flags: [] };
  }

  // Per-tenet entry validation
  for (const tenet of TENETS) {
    const entries = submission[tenet] ?? [];
    for (const entry of entries) {
      const v = validateEntry(entry, tenet);
      errors.push(...v.errors);
      flags.push(...v.flags);
    }
  }

  // Problem-statement repeat-back: required from round 3+
  // (server.js enforces with state.round; here we just note presence)
  if (submission.repeat_back_statement && !submission.repeat_back_designer_quote) {
    flags.push('repeat_back_statement provided without designer ratification quote');
  }

  return { valid: errors.length === 0, errors, flags };
}

// ── Score Computation ────────────────────────────────────────────

// Each tenet's raw score is computed from validated entry counts,
// normalized into [0, 1] against per-tenet target counts so density
// of evidence diminishes returns past adequate coverage.

const TENET_TARGET_ENTRIES = {
  problem_articulation: 1,        // one sharp statement is enough; multiples fine but one suffices
  success_criteria: 3,
  done_state_vision: 2,
  constraint_envelope: 4,
  scope_boundary: 5,
  personal_use_case_map: 3,       // mix of current_me + future_me
  cost_energy_budget: 2,
  project_fit: 2,
  open_questions_ledger: 3,
};

export function computeTenetScore(entries, tenet) {
  if (!entries || entries.length === 0) return 0;

  let validated = 0;
  for (const entry of entries) {
    if (entry._validation_passed === false) continue;
    if (entry._held_pending_override) continue;  // pending entries don't score
    validated += 1;
  }

  const target = TENET_TARGET_ENTRIES[tenet] ?? 3;
  const raw = validated / target;
  return Math.min(1.0, Math.round(raw * 1000) / 1000);
}

export function computeOverall(tenetScores) {
  let weighted = 0;
  for (const tenet of TENETS) {
    weighted += (tenetScores[tenet] ?? 0) * WEIGHTS[tenet];
  }
  return Math.round(weighted * 1000) / 1000;
}

export function findWeakestTenet(tenetScores) {
  let weakest = null;
  let lowestContribution = Infinity;
  for (const tenet of TENETS) {
    const score = tenetScores[tenet] ?? 0;
    const contribution = score * WEIGHTS[tenet];
    if (contribution < lowestContribution) {
      lowestContribution = contribution;
      weakest = { tenet, score, weight: WEIGHTS[tenet], contribution };
    }
  }
  return weakest;
}

// ── Repeat-Back Stability ─────────────────────────────────────────

// Cosine similarity on bag-of-words. Stub for LLM-judge semantic similarity.
export function repeatBackStability(currentStatement, previousStatement) {
  if (!currentStatement || !previousStatement) return 0;
  const tok = s => s.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  const a = tok(currentStatement);
  const b = tok(previousStatement);
  if (a.length === 0 || b.length === 0) return 0;

  const counts = (toks) => {
    const m = new Map();
    for (const t of toks) m.set(t, (m.get(t) ?? 0) + 1);
    return m;
  };
  const ca = counts(a);
  const cb = counts(b);

  let dot = 0;
  for (const [t, n] of ca) if (cb.has(t)) dot += n * cb.get(t);
  const mag = (m) => Math.sqrt([...m.values()].reduce((s, n) => s + n * n, 0));
  const denom = mag(ca) * mag(cb);
  return denom === 0 ? 0 : Math.round((dot / denom) * 1000) / 1000;
}

// ── Transition Gate ──────────────────────────────────────────────

export function checkTransitionReady(state) {
  const reasons = [];
  const tenetScores = state.tenetScores ?? {};
  const round = state.round ?? 0;

  // Tenet floor
  for (const tenet of TENETS) {
    const score = tenetScores[tenet] ?? 0;
    if (score < TENET_FLOOR) {
      reasons.push(`${tenet} below floor (${score} < ${TENET_FLOOR})`);
    }
  }

  // Overall threshold
  const overall = computeOverall(tenetScores);
  if (overall < OVERALL_THRESHOLD) {
    reasons.push(`overall ${overall} below threshold ${OVERALL_THRESHOLD}`);
  }

  // Repeat-back ratification (required from round 3 onward)
  if (round >= REPEAT_BACK_REQUIRED_FROM_ROUND) {
    const ratifiedRecently = (state.repeatBackHistory ?? [])
      .slice(-2)
      .some(r => r.designer_ratified === true);
    if (!ratifiedRecently) {
      reasons.push('no designer-ratified problem-statement repeat-back in last 2 rounds');
    }

    // Cosine stability across most recent two ratified statements
    const ratified = (state.repeatBackHistory ?? []).filter(r => r.designer_ratified);
    if (ratified.length >= 2) {
      const last = ratified[ratified.length - 1].statement;
      const prev = ratified[ratified.length - 2].statement;
      const cos = repeatBackStability(last, prev);
      if (cos < REPEAT_BACK_COSINE_FLOOR) {
        reasons.push(`repeat-back cosine stability ${cos} below floor ${REPEAT_BACK_COSINE_FLOOR}`);
      }
    }
  }

  // No unresolved Convention-Break Override pending
  const pendingOverrides = (state.pendingOverrides ?? []).filter(p => !p.resolved);
  if (pendingOverrides.length > 0) {
    reasons.push(`${pendingOverrides.length} unresolved Convention-Break Override(s)`);
  }

  // No unresolved vocabulary pending dispositions
  const pendingVocab = (state.pendingVocabDispositions ?? []).filter(p => !p.resolved);
  if (pendingVocab.length > 0) {
    reasons.push(`${pendingVocab.length} unresolved vocabulary disposition(s)`);
  }

  return { ready: reasons.length === 0, reasons, overall };
}

// ── Term-Drift Surfacer ──────────────────────────────────────────

// Surface terms appearing in TERM_DRIFT_ROUND_THRESHOLD+ rounds without
// becoming a DEFINED glossary entry.
export function surfaceTermDriftCandidates(state) {
  const usage = state.termUsageHistory ?? {};
  const glossaryNames = new Set(
    (state.glossary ?? []).flatMap(e => [e.canonical_name, ...(e.aliases ?? [])].map(s => s.toLowerCase()))
  );
  const candidates = [];
  for (const [term, rounds] of Object.entries(usage)) {
    if (glossaryNames.has(term.toLowerCase())) continue;
    if (rounds.length >= TERM_DRIFT_ROUND_THRESHOLD) {
      candidates.push({ term, rounds_seen: rounds, count: rounds.length });
    }
  }
  return candidates;
}
