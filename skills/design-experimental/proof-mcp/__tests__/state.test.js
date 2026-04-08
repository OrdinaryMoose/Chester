import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  initializeState,
  generateId,
  applyOperations,
  markChallengeUsed,
  saveState,
  loadState,
} from '../state.js';

describe('initializeState', () => {
  it('creates clean state with all required fields', () => {
    const state = initializeState('Design a widget');
    expect(state.round).toBe(0);
    expect(state.problemStatement).toBe('Design a widget');
    expect(state.elements).toBeInstanceOf(Map);
    expect(state.elements.size).toBe(0);
    expect(state.elementCounters).toEqual({
      GIVEN: 0, CONSTRAINT: 0, ASSERTION: 0, DECISION: 0,
      OPEN: 0, RISK: 0, BOUNDARY: 0,
    });
    expect(state.openCountHistory).toEqual([]);
    expect(state.elementCountHistory).toEqual([]);
    expect(state.challengeModesUsed).toEqual([]);
    expect(state.challengeLog).toEqual([]);
    expect(state.revisionLog).toEqual([]);
    expect(state.phaseTransitionRound).toBe(0);
  });
});

describe('generateId', () => {
  it('generates correct ID format for each type', () => {
    const prefixMap = {
      GIVEN: 'G', CONSTRAINT: 'C', ASSERTION: 'A', DECISION: 'D',
      OPEN: 'O', RISK: 'R', BOUNDARY: 'B',
    };
    for (const [type, prefix] of Object.entries(prefixMap)) {
      const state = initializeState('test');
      const [id, newState] = generateId(state, type);
      expect(id).toBe(`${prefix}1`);
      expect(newState.elementCounters[type]).toBe(1);
    }
  });

  it('increments counter on successive calls', () => {
    let state = initializeState('test');
    const [id1, s1] = generateId(state, 'GIVEN');
    const [id2, s2] = generateId(s1, 'GIVEN');
    const [id3, s3] = generateId(s2, 'GIVEN');
    expect(id1).toBe('G1');
    expect(id2).toBe('G2');
    expect(id3).toBe('G3');
    expect(s3.elementCounters.GIVEN).toBe(3);
  });

  it('does not mutate the original state', () => {
    const state = initializeState('test');
    const [, newState] = generateId(state, 'OPEN');
    expect(state.elementCounters.OPEN).toBe(0);
    expect(newState.elementCounters.OPEN).toBe(1);
  });

  it('tracks counters independently per type', () => {
    let state = initializeState('test');
    const [id1, s1] = generateId(state, 'GIVEN');
    const [id2, s2] = generateId(s1, 'CONSTRAINT');
    const [id3, s3] = generateId(s2, 'GIVEN');
    expect(id1).toBe('G1');
    expect(id2).toBe('C1');
    expect(id3).toBe('G2');
  });
});

describe('applyOperations', () => {
  let state;

  beforeEach(() => {
    state = initializeState('Test problem');
  });

  describe('add operation', () => {
    it('adds a GIVEN element', () => {
      const result = applyOperations(state, [
        { op: 'add', type: 'GIVEN', statement: 'API exists', source: 'docs' },
      ]);
      expect(result.added).toHaveLength(1);
      expect(result.added[0]).toBe('G1');
      expect(result.state.elements.get('G1')).toBeDefined();
      expect(result.state.elements.get('G1').statement).toBe('API exists');
      expect(result.errors).toHaveLength(0);
    });

    it('rejects add with non-existent basis reference', () => {
      const result = applyOperations(state, [
        { op: 'add', type: 'CONSTRAINT', statement: 'Fast', basis: ['NONEXISTENT'] },
      ]);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toMatch(/NONEXISTENT/);
      expect(result.added).toHaveLength(0);
    });

    it('increments round', () => {
      const result = applyOperations(state, [
        { op: 'add', type: 'GIVEN', statement: 'Fact', source: 'user' },
      ]);
      expect(result.state.round).toBe(1);
    });
  });

  describe('resolve operation', () => {
    it('resolves an active OPEN element', () => {
      const r1 = applyOperations(state, [
        { op: 'add', type: 'OPEN', statement: 'How to handle auth?' },
      ]);
      const r2 = applyOperations(r1.state, [
        { op: 'add', type: 'DECISION', statement: 'Use OAuth', over: ['option-a'] },
      ]);
      const r3 = applyOperations(r2.state, [
        { op: 'resolve', target: 'O1', resolved_by: 'D1' },
      ]);
      expect(r3.resolved).toHaveLength(1);
      expect(r3.resolved[0]).toBe('O1');
      expect(r3.state.elements.get('O1').status).toBe('resolved');
      expect(r3.state.elements.get('O1').resolvedBy).toBe('D1');
    });

    it('rejects resolving a non-OPEN element', () => {
      const r1 = applyOperations(state, [
        { op: 'add', type: 'GIVEN', statement: 'Fact', source: 'user' },
      ]);
      const r2 = applyOperations(r1.state, [
        { op: 'resolve', target: 'G1', resolved_by: 'G1' },
      ]);
      expect(r2.errors.length).toBeGreaterThan(0);
      expect(r2.resolved).toHaveLength(0);
    });

    it('rejects resolving with non-existent resolved_by', () => {
      const r1 = applyOperations(state, [
        { op: 'add', type: 'OPEN', statement: 'Question?' },
      ]);
      const r2 = applyOperations(r1.state, [
        { op: 'resolve', target: 'O1', resolved_by: 'NONEXISTENT' },
      ]);
      expect(r2.errors.length).toBeGreaterThan(0);
    });
  });

  describe('revise operation', () => {
    it('revises an active element', () => {
      const r1 = applyOperations(state, [
        { op: 'add', type: 'GIVEN', statement: 'Original', source: 'user' },
      ]);
      const r2 = applyOperations(r1.state, [
        { op: 'revise', target: 'G1', statement: 'Updated statement' },
      ]);
      expect(r2.revised).toHaveLength(1);
      expect(r2.revised[0]).toBe('G1');
      const el = r2.state.elements.get('G1');
      expect(el.statement).toBe('Updated statement');
      expect(el.revision).toBe(1);
      expect(el.revisedInRound).toBe(2);
    });

    it('rejects revising a withdrawn element', () => {
      const r1 = applyOperations(state, [
        { op: 'add', type: 'GIVEN', statement: 'To be removed', source: 'user' },
      ]);
      const r2 = applyOperations(r1.state, [
        { op: 'withdraw', target: 'G1' },
      ]);
      const r3 = applyOperations(r2.state, [
        { op: 'revise', target: 'G1', statement: 'New' },
      ]);
      expect(r3.errors.length).toBeGreaterThan(0);
      expect(r3.revised).toHaveLength(0);
    });

    it('logs revision to revisionLog', () => {
      const r1 = applyOperations(state, [
        { op: 'add', type: 'GIVEN', statement: 'Original', source: 'user' },
      ]);
      const r2 = applyOperations(r1.state, [
        { op: 'revise', target: 'G1', statement: 'Changed' },
      ]);
      expect(r2.state.revisionLog.length).toBeGreaterThan(0);
      expect(r2.state.revisionLog[0].target).toBe('G1');
    });
  });

  describe('withdraw operation', () => {
    it('withdraws an active element', () => {
      const r1 = applyOperations(state, [
        { op: 'add', type: 'RISK', statement: 'Might fail' },
      ]);
      const r2 = applyOperations(r1.state, [
        { op: 'withdraw', target: 'R1' },
      ]);
      expect(r2.withdrawn).toHaveLength(1);
      expect(r2.withdrawn[0]).toBe('R1');
      expect(r2.state.elements.get('R1').status).toBe('withdrawn');
    });

    it('rejects withdrawing a non-existent element', () => {
      const r1 = applyOperations(state, [
        { op: 'withdraw', target: 'NONEXISTENT' },
      ]);
      expect(r1.errors.length).toBeGreaterThan(0);
    });
  });

  describe('batch processing', () => {
    it('processes add then resolve in one batch', () => {
      // First add an OPEN
      const r1 = applyOperations(state, [
        { op: 'add', type: 'OPEN', statement: 'Question?' },
      ]);
      // Now batch: add a decision, then resolve the OPEN with it
      const r2 = applyOperations(r1.state, [
        { op: 'add', type: 'DECISION', statement: 'Answer', over: ['alt-a'] },
        { op: 'resolve', target: 'O1', resolved_by: 'D1' },
      ]);
      expect(r2.added).toContain('D1');
      expect(r2.resolved).toContain('O1');
      expect(r2.state.elements.get('O1').status).toBe('resolved');
    });

    it('add with basis referencing element added in same batch', () => {
      const r1 = applyOperations(state, [
        { op: 'add', type: 'GIVEN', statement: 'Fact A', source: 'user' },
        { op: 'add', type: 'CONSTRAINT', statement: 'Must respect A', basis: ['G1'] },
      ]);
      expect(r1.added).toEqual(['G1', 'C1']);
      expect(r1.errors).toHaveLength(0);
    });
  });

  describe('immutability', () => {
    it('does not mutate the input state', () => {
      const original = initializeState('test');
      const originalRound = original.round;
      const originalSize = original.elements.size;
      applyOperations(original, [
        { op: 'add', type: 'GIVEN', statement: 'New fact', source: 'user' },
      ]);
      expect(original.round).toBe(originalRound);
      expect(original.elements.size).toBe(originalSize);
    });
  });

  describe('result metadata', () => {
    it('returns completeness, integrityWarnings, closure fields', () => {
      const result = applyOperations(state, [
        { op: 'add', type: 'GIVEN', statement: 'Fact', source: 'user' },
      ]);
      expect(result.completeness).toBeDefined();
      expect(result.integrityWarnings).toBeDefined();
      expect(Array.isArray(result.integrityWarnings)).toBe(true);
      expect(result.closure).toBeDefined();
      expect(typeof result.closure.permitted).toBe('boolean');
      expect(result.challengeTrigger).toBeDefined();
      expect(typeof result.stallDetected).toBe('boolean');
    });

    it('records openCountHistory', () => {
      const r1 = applyOperations(state, [
        { op: 'add', type: 'OPEN', statement: 'Q1?' },
      ]);
      expect(r1.state.openCountHistory).toHaveLength(1);
      expect(r1.state.openCountHistory[0]).toBe(1);
    });

    it('records elementCountHistory', () => {
      const r1 = applyOperations(state, [
        { op: 'add', type: 'GIVEN', statement: 'Fact', source: 'user' },
      ]);
      expect(r1.state.elementCountHistory).toHaveLength(1);
      expect(r1.state.elementCountHistory[0]).toBe(1);
    });
  });
});

describe('markChallengeUsed', () => {
  it('adds mode to challengeModesUsed and challengeLog', () => {
    const state = initializeState('test');
    const updated = markChallengeUsed(state, 'ontologist');
    expect(updated.challengeModesUsed).toContain('ontologist');
    expect(updated.challengeLog).toHaveLength(1);
    expect(updated.challengeLog[0]).toBe('ontologist');
  });

  it('does not mutate original state', () => {
    const state = initializeState('test');
    markChallengeUsed(state, 'simplifier');
    expect(state.challengeModesUsed).toHaveLength(0);
  });
});

describe('saveState / loadState', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'state-test-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('round-trips state through save and load', () => {
    let state = initializeState('Round-trip test');
    const r1 = applyOperations(state, [
      { op: 'add', type: 'GIVEN', statement: 'Fact', source: 'docs' },
      { op: 'add', type: 'OPEN', statement: 'Question?' },
    ]);

    const filePath = join(tmpDir, 'state.json');
    saveState(r1.state, filePath);
    const loaded = loadState(filePath);

    expect(loaded.round).toBe(r1.state.round);
    expect(loaded.problemStatement).toBe('Round-trip test');
    expect(loaded.elements).toBeInstanceOf(Map);
    expect(loaded.elements.size).toBe(2);
    expect(loaded.elements.get('G1').statement).toBe('Fact');
    expect(loaded.elementCounters.GIVEN).toBe(1);
    expect(loaded.elementCounters.OPEN).toBe(1);
    expect(loaded.openCountHistory).toEqual(r1.state.openCountHistory);
  });

  it('preserves generateId counters after load', () => {
    let state = initializeState('Counter test');
    const [, s1] = generateId(state, 'GIVEN');
    const [, s2] = generateId(s1, 'GIVEN');

    const filePath = join(tmpDir, 'state.json');
    saveState(s2, filePath);
    const loaded = loadState(filePath);

    const [id, ] = generateId(loaded, 'GIVEN');
    expect(id).toBe('G3');
  });

  it('writes valid JSON to disk', () => {
    const state = initializeState('JSON test');
    const filePath = join(tmpDir, 'state.json');
    saveState(state, filePath);
    const raw = readFileSync(filePath, 'utf-8');
    expect(() => JSON.parse(raw)).not.toThrow();
  });
});
