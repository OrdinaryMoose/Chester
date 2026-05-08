import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { initializeState, loadState } from '../state.js';

describe('loadState backfill for cluster B.2 fields', () => {
  let dir;
  beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'proof-')); });
  afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

  it('backfills closingArgPresentedRound, closingArgGoRound, frictionLog, FRICTION counter', () => {
    const path = join(dir, 'state.json');
    const legacy = {
      round: 0, problemStatement: 'p', elements: {},
      elementCounters: { EVIDENCE: 0, RULE: 0, PERMISSION: 0, NECESSARY_CONDITION: 0, RISK: 0, RESOLVE_CONDITION: 0 },
      conditionCountHistory: [], elementCountHistory: [],
      challengeModesUsed: [], challengeLog: [], revisionLog: [],
      phaseTransitionRound: 0, concerns: [], concernsLocked: false,
      concernCounter: 0, ratificationLog: [],
    };
    writeFileSync(path, JSON.stringify(legacy));
    const s = loadState(path);
    expect(s.closingArgPresentedRound).toBeNull();
    expect(s.closingArgGoRound).toBeNull();
    expect(s.frictionLog).toEqual([]);
    expect(s.elementCounters.FRICTION).toBe(0);
  });
});

describe('loadState proofStatus backfill', () => {
  it("backfills proofStatus to 'planning' when missing from prior state", () => {
    const tmpFile = `/tmp/test-loadstate-${Date.now()}.json`;
    const priorState = {
      round: 0,
      problemStatement: 'test',
      elements: {},
      elementCounters: { EVIDENCE: 0, RULE: 0, PERMISSION: 0, NECESSARY_CONDITION: 0, RISK: 0, RESOLVE_CONDITION: 0, FRICTION: 0 },
      conditionCountHistory: [],
      elementCountHistory: [],
      challengeModesUsed: [],
      challengeLog: [],
      revisionLog: [],
      phaseTransitionRound: 0,
    };
    writeFileSync(tmpFile, JSON.stringify(priorState));
    const loaded = loadState(tmpFile);
    expect(loaded.proofStatus).toBe('planning');
    unlinkSync(tmpFile);
  });

  it("maps legacy proofStatus 'open' to 'planning' when loading", () => {
    const tmpFile = `/tmp/test-loadstate-${Date.now()}.json`;
    const priorState = {
      round: 0, problemStatement: 'test', elements: {},
      elementCounters: { EVIDENCE: 0, RULE: 0, PERMISSION: 0, NECESSARY_CONDITION: 0, RISK: 0, RESOLVE_CONDITION: 0, FRICTION: 0 },
      conditionCountHistory: [], elementCountHistory: [], challengeModesUsed: [], challengeLog: [], revisionLog: [], phaseTransitionRound: 0,
      proofStatus: 'open',
    };
    writeFileSync(tmpFile, JSON.stringify(priorState));
    const loaded = loadState(tmpFile);
    expect(loaded.proofStatus).toBe('planning');
    unlinkSync(tmpFile);
  });

  it("initializeState includes proofStatus='planning' by default", () => {
    const state = initializeState('test problem');
    expect(state.proofStatus).toBe('planning');
  });
});

describe('loadState legacy proofStatus backfill (sprint-d-1-fix)', () => {
  function writeStateFileWith(proofStatusValue) {
    const tmpFile = `/tmp/test-loadstate-legacy-${Date.now()}-${Math.random()}.json`;
    const base = initializeState('legacy-test');
    const raw = {
      ...base,
      elements: {},
      proofStatus: proofStatusValue,
    };
    writeFileSync(tmpFile, JSON.stringify(raw));
    return tmpFile;
  }

  it("maps proofStatus 'open' → 'planning'", () => {
    const file = writeStateFileWith('open');
    expect(loadState(file).proofStatus).toBe('planning');
    unlinkSync(file);
  });

  it("maps proofStatus 'closed' → 'finish'", () => {
    const file = writeStateFileWith('closed');
    expect(loadState(file).proofStatus).toBe('finish');
    unlinkSync(file);
  });

  it("maps proofStatus 'unopen' → 'planning'", () => {
    const file = writeStateFileWith('unopen');
    expect(loadState(file).proofStatus).toBe('planning');
    unlinkSync(file);
  });
});
