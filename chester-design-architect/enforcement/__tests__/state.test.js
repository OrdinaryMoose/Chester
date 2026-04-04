import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  initializeState,
  updateState,
  markChallengeUsed,
  saveState,
  loadState,
} from '../state.js';

// ── initializeState ───────────────────────────────────────────────

describe('initializeState', () => {
  it('creates greenfield state with correct dimensions (5 dims, no context, round=0, gates false, arrays empty)', () => {
    const state = initializeState('greenfield', 'Build a task manager');

    expect(state.type).toBe('greenfield');
    expect(state.round).toBe(0);
    expect(state.problemStatement).toBe('Build a task manager');
    expect(state.problemStatementRevised).toBe(false);

    // 5 greenfield dimensions
    const dims = Object.keys(state.scores);
    expect(dims).toEqual(['intent', 'outcome', 'scope', 'constraints', 'success']);
    expect(dims).not.toContain('context');

    // Each dimension initialized
    for (const dim of dims) {
      expect(state.scores[dim]).toEqual({ score: 0, justification: '', gap: '' });
    }

    // Gates
    expect(state.gates).toEqual({
      nonGoalsExplicit: false,
      decisionBoundariesExplicit: false,
    });

    // Arrays and flags
    expect(state.pressurePassComplete).toBe(false);
    expect(state.challengeModesUsed).toEqual([]);
    expect(state.ambiguityHistory).toEqual([]);
    expect(state.scoreHistory).toEqual([]);
    expect(state.challengeLog).toEqual([]);
    expect(state.pressureTracking).toEqual([]);
  });

  it('creates brownfield state with context dimension (6 dims)', () => {
    const state = initializeState('brownfield', 'Refactor auth module');

    expect(state.type).toBe('brownfield');

    const dims = Object.keys(state.scores);
    expect(dims).toEqual(['intent', 'outcome', 'scope', 'constraints', 'success', 'context']);
    expect(dims).toHaveLength(6);

    expect(state.scores.context).toEqual({ score: 0, justification: '', gap: '' });
  });
});

// ── updateState ───────────────────────────────────────────────────

describe('updateState', () => {
  it('increments round and updates scores', () => {
    const state = initializeState('greenfield', 'Build a CLI');
    const newScores = {
      intent: { score: 0.7, justification: 'Clear goal', gap: 'edge cases' },
      outcome: { score: 0.5, justification: 'Partial', gap: 'metrics unclear' },
      scope: { score: 0.3, justification: 'Vague', gap: 'boundaries missing' },
      constraints: { score: 0.2, justification: 'Unknown', gap: 'no constraints stated' },
      success: { score: 0.1, justification: 'None', gap: 'no criteria' },
    };

    const updated = updateState(state, newScores, {});

    expect(updated.round).toBe(1);
    expect(updated.scores.intent.score).toBe(0.7);
    expect(updated.scores.outcome.score).toBe(0.5);
    // Original state is not mutated
    expect(state.round).toBe(0);
    expect(state.scores.intent.score).toBe(0);
  });

  it('updates gate evidence (nonGoalsAddressed → gates.nonGoalsExplicit = true)', () => {
    const state = initializeState('greenfield', 'Build a CLI');
    const newScores = {
      intent: { score: 0.5, justification: 'j', gap: 'g' },
      outcome: { score: 0.5, justification: 'j', gap: 'g' },
      scope: { score: 0.5, justification: 'j', gap: 'g' },
      constraints: { score: 0.5, justification: 'j', gap: 'g' },
      success: { score: 0.5, justification: 'j', gap: 'g' },
    };

    const updated = updateState(state, newScores, { nonGoalsAddressed: true });

    expect(updated.gates.nonGoalsExplicit).toBe(true);
    expect(updated.gates.decisionBoundariesExplicit).toBe(false);
  });

  it('records pressure pass when follow-up provided', () => {
    const state = initializeState('greenfield', 'Build a CLI');
    const newScores = {
      intent: { score: 0.5, justification: 'j', gap: 'g' },
      outcome: { score: 0.5, justification: 'j', gap: 'g' },
      scope: { score: 0.5, justification: 'j', gap: 'g' },
      constraints: { score: 0.5, justification: 'j', gap: 'g' },
      success: { score: 0.5, justification: 'j', gap: 'g' },
    };

    const updated = updateState(state, newScores, {
      pressureFollowUp: { originalRound: 0 },
    });

    expect(updated.pressureTracking).toHaveLength(1);
    expect(updated.pressureTracking[0].originalRound).toBe(0);
    expect(updated.pressureTracking[0].followUpRound).toBe(1);
  });
});

// ── saveState / loadState ─────────────────────────────────────────

describe('saveState / loadState', () => {
  let testDir;

  beforeEach(() => {
    testDir = join(tmpdir(), `state-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('round-trips state through file (save then load, expect deep equal)', () => {
    const state = initializeState('greenfield', 'Build a widget');
    const filePath = join(testDir, 'state.json');

    saveState(state, filePath);
    const loaded = loadState(filePath);

    expect(loaded).toEqual(state);
  });

  it('throws on missing file', () => {
    const filePath = join(testDir, 'nonexistent.json');

    expect(() => loadState(filePath)).toThrow();
  });
});
