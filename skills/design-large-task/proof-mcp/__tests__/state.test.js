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
      EVIDENCE: 0, RULE: 0, PERMISSION: 0, NECESSARY_CONDITION: 0, RISK: 0,
    });
    expect(state.conditionCountHistory).toEqual([]);
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
      EVIDENCE: 'EVID-', RULE: 'RULE-', PERMISSION: 'PERM-',
      NECESSARY_CONDITION: 'NCON-', RISK: 'RISK-',
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
    const [id1, s1] = generateId(state, 'EVIDENCE');
    const [id2, s2] = generateId(s1, 'EVIDENCE');
    const [id3, s3] = generateId(s2, 'EVIDENCE');
    expect(id1).toBe('EVID-1');
    expect(id2).toBe('EVID-2');
    expect(id3).toBe('EVID-3');
    expect(s3.elementCounters.EVIDENCE).toBe(3);
  });

  it('does not mutate the original state', () => {
    const state = initializeState('test');
    const [, newState] = generateId(state, 'RISK');
    expect(state.elementCounters.RISK).toBe(0);
    expect(newState.elementCounters.RISK).toBe(1);
  });

  it('tracks counters independently per type', () => {
    let state = initializeState('test');
    const [id1, s1] = generateId(state, 'EVIDENCE');
    const [id2, s2] = generateId(s1, 'RULE');
    const [id3, s3] = generateId(s2, 'EVIDENCE');
    expect(id1).toBe('EVID-1');
    expect(id2).toBe('RULE-1');
    expect(id3).toBe('EVID-2');
  });
});

describe('applyOperations', () => {
  let state;

  beforeEach(() => {
    state = initializeState('Test problem');
  });

  describe('add operation', () => {
    it('adds an EVIDENCE element', () => {
      const result = applyOperations(state, [
        { op: 'add', type: 'EVIDENCE', statement: 'Pipeline has 1481 lines', source: 'codebase' },
      ]);
      expect(result.added).toHaveLength(1);
      expect(result.added[0]).toBe('EVID-1');
      expect(result.state.elements.get('EVID-1')).toBeDefined();
      expect(result.state.elements.get('EVID-1').statement).toBe('Pipeline has 1481 lines');
      expect(result.errors).toHaveLength(0);
    });

    it('adds a RULE element', () => {
      const result = applyOperations(state, [
        { op: 'add', type: 'RULE', statement: 'Must not favor any consumer', source: 'designer' },
      ]);
      expect(result.added[0]).toBe('RULE-1');
      expect(result.state.elements.get('RULE-1').source).toBe('designer');
    });

    it('adds a NECESSARY_CONDITION with grounding', () => {
      const r1 = applyOperations(state, [
        { op: 'add', type: 'EVIDENCE', statement: 'Text is native to one consumer', source: 'codebase' },
        { op: 'add', type: 'RULE', statement: 'Five consumers planned', source: 'designer' },
      ]);
      const r2 = applyOperations(r1.state, [
        {
          op: 'add', type: 'NECESSARY_CONDITION',
          statement: 'Canonical form must be consumer-neutral',
          grounding: ['EVID-1', 'RULE-1'],
          collapse_test: 'Four consumers pay translation tax',
          reasoning_chain: 'IF five consumers AND text native to one THEN cannot be text',
        },
      ]);
      expect(r2.added[0]).toBe('NCON-1');
      const nc = r2.state.elements.get('NCON-1');
      expect(nc.grounding).toEqual(['EVID-1', 'RULE-1']);
      expect(nc.collapse_test).toContain('translation tax');
    });

    it('rejects add with non-existent grounding reference', () => {
      const result = applyOperations(state, [
        {
          op: 'add', type: 'NECESSARY_CONDITION',
          statement: 'x',
          grounding: ['NONEXISTENT'],
          collapse_test: 'y',
          reasoning_chain: 'z',
        },
      ]);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toMatch(/NONEXISTENT/);
      expect(result.added).toHaveLength(0);
    });

    it('increments round', () => {
      const result = applyOperations(state, [
        { op: 'add', type: 'EVIDENCE', statement: 'Fact', source: 'codebase' },
      ]);
      expect(result.state.round).toBe(1);
    });
  });

  describe('revise operation', () => {
    it('revises an active element', () => {
      const r1 = applyOperations(state, [
        { op: 'add', type: 'EVIDENCE', statement: 'Original', source: 'codebase' },
      ]);
      const r2 = applyOperations(r1.state, [
        { op: 'revise', target: 'EVID-1', statement: 'Updated statement' },
      ]);
      expect(r2.revised).toHaveLength(1);
      expect(r2.revised[0]).toBe('EVID-1');
      const el = r2.state.elements.get('EVID-1');
      expect(el.statement).toBe('Updated statement');
      expect(el.revision).toBe(1);
      expect(el.revisedInRound).toBe(2);
    });

    it('revises NC grounding and collapse_test', () => {
      const r1 = applyOperations(state, [
        { op: 'add', type: 'EVIDENCE', statement: 'fact', source: 'codebase' },
        { op: 'add', type: 'RULE', statement: 'rule', source: 'designer' },
      ]);
      const r2 = applyOperations(r1.state, [
        {
          op: 'add', type: 'NECESSARY_CONDITION',
          statement: 'original',
          grounding: ['EVID-1'],
          collapse_test: 'old test',
          reasoning_chain: 'IF a THEN b',
        },
      ]);
      const r3 = applyOperations(r2.state, [
        {
          op: 'revise', target: 'NCON-1',
          grounding: ['EVID-1', 'RULE-1'],
          collapse_test: 'new test',
          rejected_alternatives: ['alt-a'],
        },
      ]);
      const nc = r3.state.elements.get('NCON-1');
      expect(nc.grounding).toEqual(['EVID-1', 'RULE-1']);
      expect(nc.collapse_test).toBe('new test');
      expect(nc.rejected_alternatives).toEqual(['alt-a']);
    });

    it('rejects revising a withdrawn element', () => {
      const r1 = applyOperations(state, [
        { op: 'add', type: 'EVIDENCE', statement: 'To be removed', source: 'codebase' },
      ]);
      const r2 = applyOperations(r1.state, [
        { op: 'withdraw', target: 'EVID-1' },
      ]);
      const r3 = applyOperations(r2.state, [
        { op: 'revise', target: 'EVID-1', statement: 'New' },
      ]);
      expect(r3.errors.length).toBeGreaterThan(0);
      expect(r3.revised).toHaveLength(0);
    });

    it('logs revision to revisionLog', () => {
      const r1 = applyOperations(state, [
        { op: 'add', type: 'EVIDENCE', statement: 'Original', source: 'codebase' },
      ]);
      const r2 = applyOperations(r1.state, [
        { op: 'revise', target: 'EVID-1', statement: 'Changed' },
      ]);
      expect(r2.state.revisionLog.length).toBeGreaterThan(0);
      expect(r2.state.revisionLog[0].target).toBe('EVID-1');
    });
  });

  describe('withdraw operation', () => {
    it('withdraws an active element', () => {
      const r1 = applyOperations(state, [
        { op: 'add', type: 'RISK', statement: 'Might fail' },
      ]);
      const r2 = applyOperations(r1.state, [
        { op: 'withdraw', target: 'RISK-1' },
      ]);
      expect(r2.withdrawn).toHaveLength(1);
      expect(r2.withdrawn[0]).toBe('RISK-1');
      expect(r2.state.elements.get('RISK-1').status).toBe('withdrawn');
    });

    it('rejects withdrawing a non-existent element', () => {
      const r1 = applyOperations(state, [
        { op: 'withdraw', target: 'NONEXISTENT' },
      ]);
      expect(r1.errors.length).toBeGreaterThan(0);
    });
  });

  describe('batch processing', () => {
    it('add with grounding referencing element added in same batch', () => {
      const r1 = applyOperations(state, [
        { op: 'add', type: 'EVIDENCE', statement: 'Fact A', source: 'codebase' },
        { op: 'add', type: 'RULE', statement: 'Must respect A', source: 'designer' },
      ]);
      expect(r1.added).toEqual(['EVID-1', 'RULE-1']);
      expect(r1.errors).toHaveLength(0);
    });

    it('NC can reference elements added earlier in same batch', () => {
      const r1 = applyOperations(state, [
        { op: 'add', type: 'EVIDENCE', statement: 'fact', source: 'codebase' },
        {
          op: 'add', type: 'NECESSARY_CONDITION',
          statement: 'condition',
          grounding: ['EVID-1'],
          collapse_test: 'breaks',
          reasoning_chain: 'IF fact THEN condition',
        },
      ]);
      expect(r1.added).toEqual(['EVID-1', 'NCON-1']);
      expect(r1.errors).toHaveLength(0);
    });
  });

  describe('no resolve operation', () => {
    it('rejects resolve as unknown operation', () => {
      const r1 = applyOperations(state, [
        { op: 'resolve', target: 'X', resolved_by: 'Y' },
      ]);
      expect(r1.errors).toContainEqual(expect.stringContaining('Unknown operation'));
    });
  });

  describe('immutability', () => {
    it('does not mutate the input state', () => {
      const original = initializeState('test');
      const originalRound = original.round;
      const originalSize = original.elements.size;
      applyOperations(original, [
        { op: 'add', type: 'EVIDENCE', statement: 'New fact', source: 'codebase' },
      ]);
      expect(original.round).toBe(originalRound);
      expect(original.elements.size).toBe(originalSize);
    });
  });

  describe('result metadata', () => {
    it('returns completeness, integrityWarnings, closure fields', () => {
      const result = applyOperations(state, [
        { op: 'add', type: 'EVIDENCE', statement: 'Fact', source: 'codebase' },
      ]);
      expect(result.completeness).toBeDefined();
      expect(result.integrityWarnings).toBeDefined();
      expect(Array.isArray(result.integrityWarnings)).toBe(true);
      expect(result.closure).toBeDefined();
      expect(typeof result.closure.permitted).toBe('boolean');
      expect(result.challengeTrigger).toBeDefined();
      expect(typeof result.stallDetected).toBe('boolean');
    });

    it('records conditionCountHistory', () => {
      const r1 = applyOperations(state, [
        { op: 'add', type: 'EVIDENCE', statement: 'fact', source: 'codebase' },
      ]);
      expect(r1.state.conditionCountHistory).toHaveLength(1);
      expect(r1.state.conditionCountHistory[0]).toBe(0); // no NCs yet

      const r2 = applyOperations(r1.state, [
        {
          op: 'add', type: 'NECESSARY_CONDITION',
          statement: 'nc',
          grounding: ['EVID-1'],
          collapse_test: 'x',
          reasoning_chain: 'y',
        },
      ]);
      expect(r2.state.conditionCountHistory).toHaveLength(2);
      expect(r2.state.conditionCountHistory[1]).toBe(1);
    });

    it('records elementCountHistory', () => {
      const r1 = applyOperations(state, [
        { op: 'add', type: 'EVIDENCE', statement: 'Fact', source: 'codebase' },
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
      { op: 'add', type: 'EVIDENCE', statement: 'Fact', source: 'codebase' },
      { op: 'add', type: 'RULE', statement: 'Rule', source: 'designer' },
    ]);

    const filePath = join(tmpDir, 'state.json');
    saveState(r1.state, filePath);
    const loaded = loadState(filePath);

    expect(loaded.round).toBe(r1.state.round);
    expect(loaded.problemStatement).toBe('Round-trip test');
    expect(loaded.elements).toBeInstanceOf(Map);
    expect(loaded.elements.size).toBe(2);
    expect(loaded.elements.get('EVID-1').statement).toBe('Fact');
    expect(loaded.elementCounters.EVIDENCE).toBe(1);
    expect(loaded.elementCounters.RULE).toBe(1);
    expect(loaded.conditionCountHistory).toEqual(r1.state.conditionCountHistory);
  });

  it('preserves generateId counters after load', () => {
    let state = initializeState('Counter test');
    const [, s1] = generateId(state, 'EVIDENCE');
    const [, s2] = generateId(s1, 'EVIDENCE');

    const filePath = join(tmpDir, 'state.json');
    saveState(s2, filePath);
    const loaded = loadState(filePath);

    const [id,] = generateId(loaded, 'EVIDENCE');
    expect(id).toBe('EVID-3');
  });

  it('writes valid JSON to disk', () => {
    const state = initializeState('JSON test');
    const filePath = join(tmpDir, 'state.json');
    saveState(state, filePath);
    const raw = readFileSync(filePath, 'utf-8');
    expect(() => JSON.parse(raw)).not.toThrow();
  });
});
