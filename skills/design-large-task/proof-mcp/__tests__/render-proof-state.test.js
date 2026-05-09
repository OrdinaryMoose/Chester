import { describe, it, expect } from 'vitest';
import {
  initializeState,
  applyOperations,
  addConcern,
  ratifyConcern,
  ratifyResolveCondition,
  ratifyNecessaryCondition,
} from '../state.js';
import { partitionActiveElements } from '../closing-argument.js';

const consent = { source: 'designer', rationale: 'test render' };

function seedFullProof() {
  let s = initializeState('design problem');
  let [, sa] = addConcern(s, { label: 'concern X', description: 'd' }, consent);
  s = sa;
  [s] = ratifyConcern(s, 'CERN-1', consent);
  let r = applyOperations(s, [
    { op: 'add', type: 'EVIDENCE', statement: 'evidence body', source: 'codebase' },
    { op: 'add', type: 'RULE', statement: 'rule body', source: 'designer' },
    { op: 'add', type: 'PERMISSION', statement: 'permission body', source: 'designer', relieves: 'RULE-1' },
    { op: 'add', type: 'RISK', statement: 'risk body', source: 'agent-derivation', basis: ['EVID-1'] },
    { op: 'add', type: 'NECESSARY_CONDITION',
      statement: 'must Q', collapse_test: 'breaks if no Q',
      grounding: ['EVID-1'], reasoning_chain: 'IF evidence body THEN must Q' },
    { op: 'add', type: 'NECESSARY_CONDITION',
      statement: 'must R (draft)', collapse_test: 'breaks if no R',
      grounding: ['EVID-1'], reasoning_chain: 'IF evidence body THEN must R' },
    { op: 'add', type: 'RESOLVE_CONDITION', statement: 'system Qs',
      problem_anchor: 'CERN-1', grounding: ['NCON-1'] },
  ], consent);
  s = r.state;
  [s] = ratifyNecessaryCondition(s, { elementId: 'NCON-1', ratificationText: 'ok' }, consent);
  [s] = ratifyResolveCondition(s, { elementId: 'RCON-1', ratificationText: 'ratified' }, consent);
  return s;
}

describe('partitionActiveElements', () => {
  it('returns the seven raw active-by-type lanes', () => {
    const s = seedFullProof();
    const p = partitionActiveElements(s);
    expect(Object.keys(p).sort()).toEqual([
      'activeConcerns', 'activeEvidence', 'activeNCsAll',
      'activePermissions', 'activeRCs', 'activeRisks', 'activeRules',
    ]);
    expect(p.activeNCsAll.length).toBe(2);
    expect(p.activeNCsAll).toContain(s.elements.get('NCON-1'));
    expect(p.activeNCsAll).toContain(s.elements.get('NCON-2'));
    expect(p.activeRCs[0]).toBe(s.elements.get('RCON-1'));
    expect(p.activeRules[0]).toBe(s.elements.get('RULE-1'));
    expect(p.activePermissions[0]).toBe(s.elements.get('PERM-1'));
    expect(p.activeEvidence[0]).toBe(s.elements.get('EVID-1'));
    expect(p.activeRisks[0]).toBe(s.elements.get('RISK-1'));
    expect(p.activeConcerns[0]).toBe(s.concerns[0]);
  });
});
