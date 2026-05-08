import { describe, it, expect } from 'vitest';
import { initializeState, addConcern, applyOperations, recordClosingArgPresented, markChallengeUsed } from '../state.js';

const consent = { source: 'designer', rationale: 'test' };

describe('operationLog', () => {
  it('initializeState seeds operationLog as empty array', () => {
    const s = initializeState('test problem');
    expect(s.operationLog).toEqual([]);
  });

  it('addConcern appends entry with op:add type:CONCERN', () => {
    const s = initializeState('test problem');
    const [id, after] = addConcern(s, { label: 'C-1', description: 'd' }, consent);
    expect(after.operationLog).toHaveLength(1);
    expect(after.operationLog[0]).toMatchObject({
      op: 'add',
      type: 'CONCERN',
      entityId: id,
      consent,
    });
  });

  it('applyOperations appends entry per op', () => {
    let s = initializeState('p');
    s.proofStatus = 'planning';
    const ops = [{ op: 'add', type: 'EVIDENCE', statement: 'e1', source: 'codebase' }];
    const result = applyOperations(s, ops, consent);
    s = result.state;
    const adds = s.operationLog.filter(e => e.op === 'add' && e.type === 'EVIDENCE');
    expect(adds).toHaveLength(1);
  });

  it('every entry has round, op, consent, provenance fields', () => {
    let s = initializeState('test problem');
    [, s] = addConcern(s, { label: 'C-1', description: 'd' }, consent);
    const entry = s.operationLog[0];
    expect(entry).toHaveProperty('round');
    expect(entry).toHaveProperty('op');
    expect(entry).toHaveProperty('consent');
    expect(entry).toHaveProperty('provenance');
  });

  it('recordClosingArgPresented appends entry with op:present', () => {
    let s = initializeState('test problem');
    [s] = recordClosingArgPresented(s, consent);
    const entry = s.operationLog.find(e => e.op === 'present');
    expect(entry).toBeDefined();
    expect(entry.consent).toEqual(consent);
    expect(entry.provenance.presentedAtRound).toBe(s.round);
  });

  it('markChallengeUsed appends entry with op:mark-challenge', () => {
    const s = initializeState('test problem');
    const after = markChallengeUsed(s, 'contrarian');
    const entry = after.operationLog.find(e => e.op === 'mark-challenge');
    expect(entry).toBeDefined();
    expect(entry.consent).toBeNull();
    expect(entry.provenance).toEqual({ mode: 'contrarian' });
    expect(entry.changedFields).toEqual(['challengeModesUsed', 'challengeLog']);
  });
});
