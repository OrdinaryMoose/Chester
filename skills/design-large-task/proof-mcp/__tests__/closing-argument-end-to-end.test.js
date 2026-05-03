import { describe, it, expect } from 'vitest';
import { initializeState, applyOperations, addConcern, lockConcerns, ratifyResolveCondition, recordClosingArgPresented, recordDesignerGo } from '../state.js';
import { evaluateTrigger, checkClosure } from '../metrics.js';
import { deriveClosingArgument } from '../closing-argument.js';

describe('closing-argument end-to-end', () => {
  it('happy path: build proof, present argument, confirm go, closure permitted', () => {
    let s = initializeState('p');
    let [, sa] = addConcern(s, { label: 'concern X', description: 'd' });
    s = sa;
    [s] = lockConcerns(s);
    let r = applyOperations(s, [
      { op: 'add', type: 'EVIDENCE', statement: 'fact', source: 'codebase' },
      { op: 'add', type: 'NECESSARY_CONDITION', statement: 'must Q', collapse_test: 'breaks if no Q', grounding: ['EVID-1'], reasoning_chain: 'IF fact THEN must Q', rejected_alternatives: ['alt1'] },
      { op: 'add', type: 'RESOLVE_CONDITION', statement: 'system Qs', problem_anchor: 'CERN-1', grounding: ['NCON-1'] },
    ]);
    s = r.state;
    r = applyOperations(s, [{ op: 'revise', target: 'NCON-1', collapse_test: 'breaks if no Q at all' }]);
    s = r.state;
    [s] = ratifyResolveCondition(s, { elementId: 'RCON-1', ratificationText: 'ratified' });
    while (s.round < 3) { r = applyOperations(s, []); s = r.state; }

    const trigger = evaluateTrigger(s);
    expect(trigger.permitted).toBe(true);

    const argument = deriveClosingArgument(s);
    expect(argument.resolveConditions.length).toBeGreaterThan(0);

    s = recordClosingArgPresented(s);
    expect(s.closingArgPresentedRound).toBe(s.round);

    [s] = recordDesignerGo(s);
    expect(s.closingArgGoRound).toBe(s.round);

    const closure = checkClosure(s);
    expect(closure.permitted).toBe(true);
  });

  it('mutation after go invalidates closure', () => {
    let s = initializeState('p');
    s.round = 5;
    s.closingArgPresentedRound = 5;
    s.closingArgGoRound = 5;
    s.concerns = [{ id: 'CERN-1', label: 'C' }];
    s.concernsLocked = true;
    const r = applyOperations(s, [{ op: 'add', type: 'EVIDENCE', statement: 'mid-ratification mutation', source: 'codebase' }]);
    expect(r.state.closingArgPresentedRound).toBeNull();
    expect(r.state.closingArgGoRound).toBeNull();
    const closure = checkClosure(r.state);
    expect(closure.permitted).toBe(false);
    expect(closure.reasons.some(rs => /Designer go-choice/.test(rs))).toBe(true);
  });
});
