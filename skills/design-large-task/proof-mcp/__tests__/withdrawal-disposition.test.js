import { describe, it, expect } from 'vitest';
import { initializeState, applyOperations } from '../state.js';

describe('withdrawal_disposition', () => {
  it('stores withdrawal_disposition on withdrawn element when provided', () => {
    let state = initializeState('test');
    let r = applyOperations(state, [{ op: 'add', type: 'EVIDENCE', statement: 'fact', source: 'codebase' }], { source: 'designer', rationale: 'test' });
    state = r.state;
    r = applyOperations(state, [{ op: 'add', type: 'NECESSARY_CONDITION', statement: 'NC1', collapse_test: 'a', grounding: ['EVID-1'], reasoning_chain: 'IF fact THEN NC1' }], { source: 'designer', rationale: 'test' });
    state = r.state;
    r = applyOperations(state, [{ op: 'withdraw', target: 'NCON-1', withdrawal_disposition: 'superseded' }], { source: 'designer', rationale: 'test' });
    expect(r.state.elements.get('NCON-1').status).toBe('withdrawn');
    expect(r.state.elements.get('NCON-1').withdrawal_disposition).toBe('superseded');
  });

  it('defaults withdrawal_disposition to unclassified when omitted', () => {
    let state = initializeState('test');
    let r = applyOperations(state, [{ op: 'add', type: 'EVIDENCE', statement: 'fact', source: 'codebase' }], { source: 'designer', rationale: 'test' });
    state = r.state;
    r = applyOperations(state, [{ op: 'add', type: 'NECESSARY_CONDITION', statement: 'NC1', collapse_test: 'a', grounding: ['EVID-1'], reasoning_chain: 'IF fact THEN NC1' }], { source: 'designer', rationale: 'test' });
    state = r.state;
    r = applyOperations(state, [{ op: 'withdraw', target: 'NCON-1' }], { source: 'designer', rationale: 'test' });
    expect(r.state.elements.get('NCON-1').withdrawal_disposition).toBe('unclassified');
  });

  it('rejects invalid withdrawal_disposition', () => {
    let state = initializeState('test');
    let r = applyOperations(state, [{ op: 'add', type: 'EVIDENCE', statement: 'fact', source: 'codebase' }], { source: 'designer', rationale: 'test' });
    state = r.state;
    r = applyOperations(state, [{ op: 'add', type: 'NECESSARY_CONDITION', statement: 'NC1', collapse_test: 'a', grounding: ['EVID-1'], reasoning_chain: 'IF fact THEN NC1' }], { source: 'designer', rationale: 'test' });
    state = r.state;
    r = applyOperations(state, [{ op: 'withdraw', target: 'NCON-1', withdrawal_disposition: 'bogus' }], { source: 'designer', rationale: 'test' });
    expect(r.errors.some(e => /withdrawal_disposition/.test(e))).toBe(true);
    expect(r.state.elements.get('NCON-1').status).toBe('active');
  });
});
