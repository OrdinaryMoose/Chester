// Unit tests for the problem-focused scoring engine.
// Pure-function tests — no MCP server, no I/O.

import { describe, it, expect } from 'vitest';
import {
  TENETS,
  WEIGHTS,
  TENET_FLOOR,
  OVERALL_THRESHOLD,
  VOCAB_CLASSIFICATIONS,
  VOCAB_ACTIONS,
  VOCAB_ACTION_MATRIX,
  classifyPhaseVocabulary,
  validateEntry,
  validateRoundSubmission,
  validateVocabularyAction,
  computeTenetScore,
  computeOverall,
  findWeakestTenet,
  repeatBackStability,
  checkTransitionReady,
  surfaceTermDriftCandidates,
} from '../scoring.js';
import {
  initializeState,
  seedGlossaryFromExploration,
  applyVocabularyAction,
  submitRoundEvidence,
  resolveOverride,
} from '../state.js';

describe('Tenet structure', () => {
  it('has exactly nine tenets', () => {
    expect(TENETS).toHaveLength(9);
  });

  it('weights sum to 1.0', () => {
    const sum = TENETS.reduce((acc, t) => acc + WEIGHTS[t], 0);
    expect(sum).toBeCloseTo(1.0, 5);
  });

  it('every tenet has positive weight', () => {
    for (const t of TENETS) expect(WEIGHTS[t]).toBeGreaterThan(0);
  });
});

describe('Phase-vocabulary classifier', () => {
  it('rejects solve-side tokens', () => {
    const result = classifyPhaseVocabulary('the system uses async messaging via a pub/sub broker');
    expect(result.violation).toBe(true);
    expect(result.tokens.length).toBeGreaterThanOrEqual(1);
  });

  it('rejects architectural prescription phrases', () => {
    const result = classifyPhaseVocabulary('this should be implemented as a hexagonal architecture');
    expect(result.violation).toBe(true);
  });

  it('passes problem-side language', () => {
    const result = classifyPhaseVocabulary('users currently cannot complete the task without re-authenticating each time');
    expect(result.violation).toBe(false);
  });

  it('passes done-state vivid language', () => {
    const result = classifyPhaseVocabulary('when I open the working directory I will see the brief already populated with my exploration findings');
    expect(result.violation).toBe(false);
  });
});

describe('Per-entry validation', () => {
  it('rejects problem_articulation entry with solve-side language', () => {
    const entry = { text: 'we need a sync rest endpoint that handles batch payloads' };
    const result = validateEntry(entry, 'problem_articulation');
    expect(result.errors.some(e => e.includes('phase-vocabulary'))).toBe(true);
  });

  it('rejects success_criteria without measurement/observable/anti_goal', () => {
    const entry = { text: 'the system will work well' };
    const result = validateEntry(entry, 'success_criteria');
    expect(result.errors.some(e => e.includes('measurement, observable, or anti_goal'))).toBe(true);
  });

  it('rejects done_state_vision without imagined_moment', () => {
    const entry = { text: 'system is done when complete' };
    const result = validateEntry(entry, 'done_state_vision');
    expect(result.errors.some(e => e.includes('imagined_moment'))).toBe(true);
  });

  it('accepts done_state_vision with imagined_moment', () => {
    const entry = {
      text: 'six months from now I open the brief and immediately remember why',
      imagined_moment: 'reading the brief in 6 months and getting the why instantly',
    };
    const result = validateEntry(entry, 'done_state_vision');
    expect(result.errors).toHaveLength(0);
  });

  it('rejects constraint_envelope without source', () => {
    const entry = { text: 'must support 0..n consumers', constraint_type: 'hard_limit' };
    const result = validateEntry(entry, 'constraint_envelope');
    expect(result.errors.some(e => e.includes('source'))).toBe(true);
  });

  it('rejects scope_boundary without placement', () => {
    const entry = { text: 'something', source: 'designer turn 3' };
    const result = validateEntry(entry, 'scope_boundary');
    expect(result.errors.some(e => e.includes('placement'))).toBe(true);
  });

  it('rejects personal_use_case_map entry without role', () => {
    const entry = { text: 'I will use this when X', scenario: 'when X' };
    const result = validateEntry(entry, 'personal_use_case_map');
    expect(result.errors.some(e => e.includes('role'))).toBe(true);
  });

  it('flags future_me entry without context_assumed_lost', () => {
    const entry = {
      text: 'future me uses this',
      role: 'future_me',
      scenario: 'reading the brief in six months',
    };
    const result = validateEntry(entry, 'personal_use_case_map');
    expect(result.flags.some(f => f.includes('context_assumed_lost'))).toBe(true);
  });

  it('accepts current_me entry with scenario and role', () => {
    const entry = {
      text: 'when starting a sprint I reach for this',
      role: 'current_me',
      scenario: 'starting a new sprint, this lets me re-orient quickly',
    };
    const result = validateEntry(entry, 'personal_use_case_map');
    expect(result.errors).toHaveLength(0);
  });

  it('flags MISFIT project_fit without override_reason', () => {
    const entry = {
      text: 'breaks our skill convention',
      alignment: 'MISFIT',
      project_convention_referenced: 'one-skill-per-phase',
    };
    const result = validateEntry(entry, 'project_fit');
    expect(result.flags.some(f => f.includes('override_reason'))).toBe(true);
  });

  it('rejects project_fit without convention referenced', () => {
    const entry = { text: 'aligns', alignment: 'ALIGNED' };
    const result = validateEntry(entry, 'project_fit');
    expect(result.errors.some(e => e.includes('project_convention_referenced'))).toBe(true);
  });
});

describe('Round submission validation', () => {
  it('accepts empty submission with valid shape', () => {
    const result = validateRoundSubmission({}, {});
    expect(result.valid).toBe(true);
  });

  it('flags repeat_back without designer quote', () => {
    const result = validateRoundSubmission({
      repeat_back_statement: 'we are solving X for Y',
    }, {});
    expect(result.flags.some(f => f.includes('designer ratification'))).toBe(true);
  });
});

describe('Vocabulary action matrix', () => {
  it('CONSISTENT permits no actions', () => {
    expect(VOCAB_ACTION_MATRIX.CONSISTENT).toEqual([]);
  });

  it('PROPOSE permits ADD or DEFER', () => {
    expect(VOCAB_ACTION_MATRIX.PROPOSE).toEqual(['ADD', 'DEFER']);
  });

  it('CONFLICT permits MERGE | RENAME | SPLIT | DEFER', () => {
    expect(VOCAB_ACTION_MATRIX.CONFLICT).toEqual(['MERGE', 'RENAME', 'SPLIT', 'DEFER']);
  });

  it('rejects ADD for CONFLICT classification', () => {
    const errors = validateVocabularyAction({
      action: 'ADD', classification: 'CONFLICT', target_terms: ['x'],
    });
    expect(errors.some(e => e.includes('not valid'))).toBe(true);
  });

  it('accepts MERGE for CONFLICT classification', () => {
    const errors = validateVocabularyAction({
      action: 'MERGE', classification: 'CONFLICT', target_terms: ['x', 'y'],
    });
    expect(errors).toHaveLength(0);
  });

  it('rejects MERGE with fewer than 2 target_terms', () => {
    const errors = validateVocabularyAction({
      action: 'MERGE', classification: 'CONFLICT', target_terms: ['x'],
    });
    expect(errors.some(e => e.includes('MERGE requires'))).toBe(true);
  });

  it('rejects SPLIT with not exactly 1 target_term', () => {
    const errors = validateVocabularyAction({
      action: 'SPLIT', classification: 'DRIFT', target_terms: ['x', 'y'],
    });
    expect(errors.some(e => e.includes('SPLIT requires'))).toBe(true);
  });
});

describe('Glossary actions (state)', () => {
  function freshState() {
    return initializeState('test prompt');
  }

  it('seeds glossary with PROPOSED-PENDING-DESIGNER status', () => {
    let s = freshState();
    s = seedGlossaryFromExploration(s, [
      { canonical_name: 'story', definition: 'top-level narrative unit', source: { kind: 'explorer' } },
    ]);
    expect(s.glossary).toHaveLength(1);
    expect(s.glossary[0].status).toBe('PROPOSED-PENDING-DESIGNER');
  });

  it('ADD action inserts a new term', () => {
    let s = freshState();
    const r = applyVocabularyAction(s, {
      action: 'ADD',
      classification: 'PROPOSE',
      target_terms: ['story'],
      new_term: { canonical_name: 'story', definition: 'top-level narrative unit' },
      designer_quote: 'yes call it story',
    });
    expect(r.valid).toBe(true);
    expect(r.state.glossary).toHaveLength(1);
    expect(r.state.glossary[0].status).toBe('DEFINED');
  });

  it('MERGE action collapses two entries to one canonical', () => {
    let s = freshState();
    s = applyVocabularyAction(s, {
      action: 'ADD', classification: 'PROPOSE', target_terms: ['story'],
      new_term: { canonical_name: 'story', definition: 'narrative unit' },
      designer_quote: 'q1',
    }).state;
    s = applyVocabularyAction(s, {
      action: 'ADD', classification: 'PROPOSE', target_terms: ['narrative'],
      new_term: { canonical_name: 'narrative', definition: 'same as story' },
      designer_quote: 'q2',
    }).state;
    expect(s.glossary).toHaveLength(2);

    const r = applyVocabularyAction(s, {
      action: 'MERGE',
      classification: 'CONFLICT',
      target_terms: ['story', 'narrative'],
      new_term: { canonical_name: 'story' },
      designer_quote: 'merge them, story is canonical',
    });
    expect(r.valid).toBe(true);
    expect(r.state.glossary).toHaveLength(1);
    expect(r.state.glossary[0].canonical_name).toBe('story');
    expect(r.state.glossary[0].aliases).toContain('narrative');
  });

  it('SPLIT action turns one entry into two', () => {
    let s = freshState();
    s = applyVocabularyAction(s, {
      action: 'ADD', classification: 'PROPOSE', target_terms: ['story'],
      new_term: { canonical_name: 'story', definition: 'broad concept' },
      designer_quote: 'yes',
    }).state;
    const r = applyVocabularyAction(s, {
      action: 'SPLIT',
      classification: 'DRIFT',
      target_terms: ['story'],
      new_term: {
        split_into: [
          { canonical_name: 'story', definition: 'top-level narrative unit' },
          { canonical_name: 'storyform', definition: 'structural template' },
        ],
      },
      designer_quote: 'yes split them',
    });
    expect(r.valid).toBe(true);
    expect(r.state.glossary).toHaveLength(2);
    const names = r.state.glossary.map(e => e.canonical_name).sort();
    expect(names).toEqual(['story', 'storyform']);
  });

  it('RENAME action changes canonical_name and preserves former as alias', () => {
    let s = freshState();
    s = applyVocabularyAction(s, {
      action: 'ADD', classification: 'PROPOSE', target_terms: ['story'],
      new_term: { canonical_name: 'story', definition: 'definition' },
      designer_quote: 'yes',
    }).state;
    const r = applyVocabularyAction(s, {
      action: 'RENAME',
      classification: 'DRIFT',
      target_terms: ['story'],
      new_term: { canonical_name: 'narrative_unit' },
      designer_quote: 'rename it',
    });
    expect(r.valid).toBe(true);
    expect(r.state.glossary[0].canonical_name).toBe('narrative_unit');
    expect(r.state.glossary[0].aliases).toContain('story');
  });

  it('REMOVE action deprecates the entry', () => {
    let s = freshState();
    s = applyVocabularyAction(s, {
      action: 'ADD', classification: 'PROPOSE', target_terms: ['story'],
      new_term: { canonical_name: 'story', definition: 'd' },
      designer_quote: 'yes',
    }).state;
    const r = applyVocabularyAction(s, {
      action: 'REMOVE',
      classification: 'DEPRECATE',
      target_terms: ['story'],
      designer_quote: 'remove',
    });
    expect(r.valid).toBe(true);
    expect(r.state.glossary[0].status).toBe('DEPRECATED');
  });

  it('DEFER action queues a pending disposition', () => {
    let s = freshState();
    const r = applyVocabularyAction(s, {
      action: 'DEFER',
      classification: 'CONFLICT',
      target_terms: ['x', 'y'],
      reason: 'unsure',
    });
    expect(r.valid).toBe(true);
    expect(r.state.pendingVocabDispositions).toHaveLength(1);
  });
});

describe('Round submission and Solve Leakage Ledger', () => {
  it('routes solve-side language to leakage ledger', () => {
    let s = initializeState('test');
    const result = submitRoundEvidence(s, {
      problem_articulation: [
        { text: 'we need a sync REST endpoint with batch payloads' },
      ],
    });
    expect(result.state.solveLeakageLedger.length).toBeGreaterThan(0);
    expect(result.state.tenetEntries.problem_articulation).toHaveLength(0);
  });

  it('accepts valid problem-side entry and increments tenet score', () => {
    let s = initializeState('test');
    const result = submitRoundEvidence(s, {
      problem_articulation: [
        { text: 'currently I cannot resume a session without losing context', current_behavior: 'session resume loses context' },
      ],
    });
    expect(result.state.tenetEntries.problem_articulation).toHaveLength(1);
    expect(result.state.tenetScores.problem_articulation).toBeGreaterThan(0);
  });

  it('records repeat_back_statement when provided with quote', () => {
    let s = initializeState('test');
    const result = submitRoundEvidence(s, {
      repeat_back_statement: 'we are solving session-resume context loss for current-me',
      repeat_back_designer_quote: 'yes that\'s right',
    });
    expect(result.state.repeatBackHistory).toHaveLength(1);
    expect(result.state.repeatBackHistory[0].designer_ratified).toBe(true);
  });

  it('surfaces structurally-invalid entries in rejected_entries (no silent drop)', () => {
    let s = initializeState('test');
    const result = submitRoundEvidence(s, {
      open_questions_ledger: [
        // question_source="agent" is invalid — must be one of the four enum values
        { text: 'is the apparatus shape stable?', question_source: 'agent', status: 'OPEN' },
        { text: 'will the brief close cleanly?', question_source: 'agent', status: 'OPEN' },
      ],
    });
    expect(result.rejected_entries).toHaveLength(2);
    expect(result.rejected_entries[0].tenet).toBe('open_questions_ledger');
    expect(result.rejected_entries[0].errors.some(e => e.includes('question_source'))).toBe(true);
    expect(result.state.tenetScores.open_questions_ledger).toBe(0);
    expect(result.accepted_entries.open_questions_ledger).toHaveLength(0);
  });

  it('separates phase-vocab leakage from structural rejection', () => {
    let s = initializeState('test');
    const result = submitRoundEvidence(s, {
      problem_articulation: [
        { text: 'we need a REST endpoint here' },  // phase-vocab → leakage
      ],
      success_criteria: [
        { text: 'criteria with no measurement field' },  // structural → rejected
      ],
    });
    expect(result.leaked_entries.length).toBeGreaterThan(0);
    expect(result.rejected_entries).toHaveLength(1);
    expect(result.rejected_entries[0].tenet).toBe('success_criteria');
  });

  it('flags MISFIT project_fit entry with pending override', () => {
    let s = initializeState('test');
    const result = submitRoundEvidence(s, {
      project_fit: [
        {
          text: 'this breaks the per-skill-MCP convention',
          alignment: 'MISFIT',
          project_convention_referenced: 'per-skill-MCP convention',
        },
      ],
    });
    expect(result.state.pendingOverrides.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Transition gate', () => {
  it('blocks transition when tenets below floor', () => {
    const state = {
      round: 4,
      tenetScores: TENETS.reduce((acc, t) => { acc[t] = 0.2; return acc; }, {}),
    };
    const result = checkTransitionReady(state);
    expect(result.ready).toBe(false);
    expect(result.reasons.some(r => r.includes('below floor'))).toBe(true);
  });

  it('blocks transition without ratified repeat-back from round 3', () => {
    const state = {
      round: 4,
      tenetScores: TENETS.reduce((acc, t) => { acc[t] = 0.8; return acc; }, {}),
      repeatBackHistory: [],
    };
    const result = checkTransitionReady(state);
    expect(result.reasons.some(r => r.includes('repeat-back'))).toBe(true);
  });

  it('blocks transition with pending overrides', () => {
    const state = {
      round: 4,
      tenetScores: TENETS.reduce((acc, t) => { acc[t] = 0.8; return acc; }, {}),
      repeatBackHistory: [
        { round: 4, statement: 'a problem', designer_ratified: true },
        { round: 3, statement: 'a problem here', designer_ratified: true },
      ],
      pendingOverrides: [{ tenet: 'project_fit', resolved: false }],
    };
    const result = checkTransitionReady(state);
    expect(result.reasons.some(r => r.includes('Convention-Break Override'))).toBe(true);
  });

  it('blocks transition with pending vocabulary dispositions', () => {
    const state = {
      round: 4,
      tenetScores: TENETS.reduce((acc, t) => { acc[t] = 0.8; return acc; }, {}),
      repeatBackHistory: [
        { round: 4, statement: 'problem one', designer_ratified: true },
        { round: 3, statement: 'problem one here', designer_ratified: true },
      ],
      pendingVocabDispositions: [{ target_terms: ['x'], resolved: false }],
    };
    const result = checkTransitionReady(state);
    expect(result.reasons.some(r => r.includes('vocabulary'))).toBe(true);
  });
});

describe('Term-drift surfacer', () => {
  it('surfaces terms used in 3+ rounds without DEFINED entry', () => {
    const state = {
      glossary: [],
      termUsageHistory: {
        story: [1, 2, 3],
        ephemeral: [1],
      },
    };
    const candidates = surfaceTermDriftCandidates(state);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].term).toBe('story');
  });

  it('does not surface terms already in glossary', () => {
    const state = {
      glossary: [{ canonical_name: 'story', aliases: [] }],
      termUsageHistory: { story: [1, 2, 3, 4] },
    };
    const candidates = surfaceTermDriftCandidates(state);
    expect(candidates).toHaveLength(0);
  });
});

describe('Repeat-back stability', () => {
  it('returns 1 for identical statements', () => {
    expect(repeatBackStability('the problem is X', 'the problem is X')).toBeCloseTo(1, 3);
  });

  it('returns ~0 for orthogonal statements', () => {
    expect(repeatBackStability('apples bananas cherries', 'unicorns dragons')).toBeCloseTo(0, 3);
  });

  it('returns intermediate for partial overlap', () => {
    const score = repeatBackStability('the problem is session resume context loss', 'session resume context loss is the problem');
    expect(score).toBeGreaterThan(0.7);
  });
});

describe('Score computation', () => {
  it('computes overall as weighted sum', () => {
    const tenetScores = TENETS.reduce((acc, t) => { acc[t] = 1.0; return acc; }, {});
    expect(computeOverall(tenetScores)).toBeCloseTo(1.0, 3);
  });

  it('finds weakest tenet by contribution', () => {
    const tenetScores = TENETS.reduce((acc, t) => { acc[t] = 0.8; return acc; }, {});
    tenetScores.problem_articulation = 0.2;
    const weakest = findWeakestTenet(tenetScores);
    expect(weakest.tenet).toBe('problem_articulation');
  });
});
