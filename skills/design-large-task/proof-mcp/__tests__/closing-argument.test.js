// proof-mcp/__tests__/closing-argument.test.js
import { describe, it, expect } from 'vitest';
import { deriveClosingArgument } from '../closing-argument.js';
import { initializeState, applyOperations, addConcern, lockConcerns, ratifyResolveCondition } from '../state.js';

function build() {
  let s = initializeState('design problem');
  let [, sa] = addConcern(s, { label: 'concern X', description: 'd' });
  s = sa;
  [s] = lockConcerns(s);
  let r = applyOperations(s, [
    { op: 'add', type: 'EVIDENCE', statement: 'evidence body', source: 'codebase' },
    { op: 'add', type: 'NECESSARY_CONDITION', statement: 'must Q', collapse_test: 'breaks if no Q', grounding: ['EVID-1'], reasoning_chain: 'IF evidence body THEN must Q' },
    { op: 'add', type: 'RESOLVE_CONDITION', statement: 'system Qs', problem_anchor: 'CERN-1', grounding: ['NCON-1'] },
  ]);
  s = r.state;
  [s] = ratifyResolveCondition(s, { elementId: 'RCON-1', ratificationText: 'ratified' });
  return s;
}

describe('deriveClosingArgument', () => {
  it('returns at minimum the required keys', () => {
    const s = build();
    const out = deriveClosingArgument(s);
    const required = ['derivedAtRound', 'problemStatement', 'lockedConcerns', 'resolveConditions', 'phantomNCs', 'phantomRCs', 'liveFriction', 'phantomFriction', 'compositeScore', 'closurePermitted', 'closureReasons'];
    for (const k of required) expect(out).toHaveProperty(k);
    expect(out.derivedAtRound).toBe(s.round);
  });

  it('walks live RCs with grounding NCs', () => {
    const s = build();
    const out = deriveClosingArgument(s);
    expect(out.resolveConditions.length).toBe(1);
    const rc = out.resolveConditions[0];
    expect(rc.id).toBe('RCON-1');
    expect(rc.problem_anchor).toBe('CERN-1');
    expect(rc.groundingNCs.some(nc => nc.id === 'NCON-1')).toBe(true);
  });

  it('is idempotent — same state produces deeply equal output', () => {
    const s = build();
    const a = deriveClosingArgument(s);
    const b = deriveClosingArgument(s);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('includes phantom NC with disposition tag', () => {
    let s = build();
    let r = applyOperations(s, [{ op: 'add', type: 'NECESSARY_CONDITION', statement: 'NC2', collapse_test: 'a', grounding: ['EVID-1'], reasoning_chain: 'IF evidence body THEN NC2' }]);
    s = r.state;
    r = applyOperations(s, [{ op: 'withdraw', target: 'NCON-2', withdrawal_disposition: 'superseded' }]);
    s = r.state;
    const out = deriveClosingArgument(s);
    expect(out.phantomNCs.some(p => p.id === 'NCON-2' && p.dispositionTag === 'superseded')).toBe(true);
  });

  it('surfaces unclassified disposition for phantoms with no withdrawal_disposition', () => {
    let s = build();
    let r = applyOperations(s, [{ op: 'add', type: 'NECESSARY_CONDITION', statement: 'NC3', collapse_test: 'a', grounding: ['EVID-1'], reasoning_chain: 'IF evidence body THEN NC3' }]);
    s = r.state;
    // simulate a legacy element by deleting withdrawal_disposition
    r = applyOperations(s, [{ op: 'withdraw', target: 'NCON-2' }]);
    s = r.state;
    delete s.elements.get('NCON-2').withdrawal_disposition;
    const out = deriveClosingArgument(s);
    expect(out.phantomNCs.some(p => p.id === 'NCON-2' && p.dispositionTag === 'unclassified')).toBe(true);
  });
});
