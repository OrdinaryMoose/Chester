import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { loadState } from '../state.js';

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
