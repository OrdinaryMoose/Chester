import { describe, it, expect } from 'vitest';
import { initializeState, addConcern, lockConcerns, applyOperations } from '../state.js';

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

  it('lockConcerns appends entry with op:lock', () => {
    let s = initializeState('test problem');
    let id1, id2;
    [id1, s] = addConcern(s, { label: 'C-1', description: 'd' }, consent);
    [id2, s] = addConcern(s, { label: 'C-2', description: 'd' }, consent);
    const [locked] = lockConcerns(s, consent);
    s = locked;
    expect(s.operationLog.find(e => e.op === 'lock')).toBeDefined();
  });

  it('applyOperations appends entry per op', () => {
    let s = initializeState('p');
    s.proofStatus = 'open';
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
});
