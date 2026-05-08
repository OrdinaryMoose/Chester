import { describe, it, expect } from 'vitest';
import { initializeState, recordDesignerGo } from '../state.js';
import { createElement } from '../proof.js';

/**
 * Build a state ready for confirm_closure_go:
 *  - round = 5
 *  - one Concern, locked + ratified
 *  - active draft NC (NCON-1) — should be bulk-ratified
 *  - active ratified NC (NCON-2) — should remain ratified, NOT re-stamped
 *  - withdrawn NC (NCON-3, draft) — should NOT be touched
 *  - active RC without ratification (RCON-1) — should be bulk-ratified
 *  - active RC with prior ratification (RCON-2) — should remain unchanged
 *  - withdrawn RC (RCON-3, no ratification) — should NOT be touched
 *  - closingArgPresentedRound = round (gate passes)
 */
function fixture() {
  const s = initializeState('p');
  s.round = 5;
  s.concerns = [{ id: 'CERN-1', label: 'C', description: null, status: 'ratified' }];
  s.concernCounter = 1;
  s.proofStatus = 'planning';
  s.closingArgPresentedRound = 5;

  const evid = createElement(
    { type: 'EVIDENCE', statement: 'fact', source: 'codebase' },
    'EVID-1', 5
  );
  s.elements.set('EVID-1', evid);
  s.elementCounters.EVIDENCE = 1;

  const nc1 = createElement(
    { type: 'NECESSARY_CONDITION', statement: 'NC1', collapse_test: 'a', grounding: ['EVID-1'], reasoning_chain: 'IF fact THEN NC1' },
    'NCON-1', 5
  );
  // ratificationStatus defaults to 'draft' from createElement for NC

  const nc2 = createElement(
    { type: 'NECESSARY_CONDITION', statement: 'NC2', collapse_test: 'b', grounding: ['EVID-1'], reasoning_chain: 'IF fact THEN NC2' },
    'NCON-2', 5
  );
  nc2.ratificationStatus = 'ratified';

  const nc3 = createElement(
    { type: 'NECESSARY_CONDITION', statement: 'NC3', collapse_test: 'c', grounding: ['EVID-1'], reasoning_chain: 'IF fact THEN NC3' },
    'NCON-3', 5
  );
  nc3.status = 'withdrawn';
  nc3.withdrawal_disposition = 'unclassified';

  const rc1 = createElement(
    { type: 'RESOLVE_CONDITION', statement: 'RC1', problem_anchor: 'CERN-1', grounding: ['NCON-1'] },
    'RCON-1', 5
  );

  const rc2 = createElement(
    { type: 'RESOLVE_CONDITION', statement: 'RC2', problem_anchor: 'CERN-1', grounding: ['NCON-2'] },
    'RCON-2', 5
  );
  rc2.ratification = { ratifiedAtRound: 4, text: 'prior ratification' };

  const rc3 = createElement(
    { type: 'RESOLVE_CONDITION', statement: 'RC3', problem_anchor: 'CERN-1', grounding: ['NCON-1'] },
    'RCON-3', 5
  );
  rc3.status = 'withdrawn';
  rc3.withdrawal_disposition = 'unclassified';

  s.elements.set('NCON-1', nc1);
  s.elements.set('NCON-2', nc2);
  s.elements.set('NCON-3', nc3);
  s.elements.set('RCON-1', rc1);
  s.elements.set('RCON-2', rc2);
  s.elements.set('RCON-3', rc3);
  s.elementCounters.NECESSARY_CONDITION = 3;
  s.elementCounters.RESOLVE_CONDITION = 3;
  return s;
}

const consent = { source: 'designer', rationale: 'test' };

describe('confirm_closure_go bulk-ratify + close (Task 14, RULE-9)', () => {
  it('successful go sets proofStatus to finish', () => {
    const s = fixture();
    expect(s.proofStatus).toBe('planning');
    const [newS, err] = recordDesignerGo(s, consent);
    expect(err).toBeNull();
    expect(newS.proofStatus).toBe('finish');
  });

  it('bulk-ratifies all draft active NCs; withdrawn NCs untouched; ratified NCs unchanged', () => {
    const s = fixture();
    const [newS, err] = recordDesignerGo(s, consent);
    expect(err).toBeNull();
    expect(newS.elements.get('NCON-1').ratificationStatus).toBe('ratified');
    expect(newS.elements.get('NCON-2').ratificationStatus).toBe('ratified');
    // withdrawn NC stays withdrawn and is NOT bulk-ratified
    expect(newS.elements.get('NCON-3').status).toBe('withdrawn');
    expect(newS.elements.get('NCON-3').ratificationStatus).toBe('draft');
  });

  it('bulk-ratifies unratified active RCs; skips withdrawn and already-ratified', () => {
    const s = fixture();
    const [newS, err] = recordDesignerGo(s, consent);
    expect(err).toBeNull();
    const rc1 = newS.elements.get('RCON-1');
    expect(rc1.ratification).not.toBeNull();
    expect(rc1.ratification.ratifiedAtRound).toBe(5);
    expect(rc1.ratification.text).toMatch(/bulk-ratified at confirm_closure_go/);
    // already-ratified RC keeps its prior ratification text/round
    const rc2 = newS.elements.get('RCON-2');
    expect(rc2.ratification.text).toBe('prior ratification');
    expect(rc2.ratification.ratifiedAtRound).toBe(4);
    // withdrawn RC: ratification stays null
    const rc3 = newS.elements.get('RCON-3');
    expect(rc3.status).toBe('withdrawn');
    expect(rc3.ratification).toBeNull();
  });

  it('preserves closingArgPresentedRound (does NOT clear) and sets closingArgGoRound', () => {
    const s = fixture();
    const [newS, err] = recordDesignerGo(s, consent);
    expect(err).toBeNull();
    expect(newS.closingArgPresentedRound).toBe(5);
    expect(newS.closingArgGoRound).toBe(5);
  });

  it('appends exactly one op:close and two op:bulk-ratify (one per type)', () => {
    const s = fixture();
    const beforeCount = s.operationLog.length;
    const [newS, err] = recordDesignerGo(s, consent);
    expect(err).toBeNull();
    const newEntries = newS.operationLog.slice(beforeCount);
    expect(newEntries.length).toBe(3);
    const close = newEntries.find(e => e.op === 'close');
    expect(close).toBeDefined();
    expect(close.changedFields).toEqual(['proofStatus']);
    expect(close.provenance.to).toBe('finish');
    const bulkNC = newEntries.find(e => e.op === 'bulk-ratify' && e.type === 'NECESSARY_CONDITION');
    expect(bulkNC).toBeDefined();
    expect(bulkNC.changedFields).toEqual(['ratificationStatus']);
    expect(bulkNC.provenance.count).toBe(1);
    expect(bulkNC.provenance.elementIds).toEqual(['NCON-1']);
    const bulkRC = newEntries.find(e => e.op === 'bulk-ratify' && e.type === 'RESOLVE_CONDITION');
    expect(bulkRC).toBeDefined();
    expect(bulkRC.changedFields).toEqual(['ratification']);
    expect(bulkRC.provenance.count).toBe(1);
    expect(bulkRC.provenance.elementIds).toEqual(['RCON-1']);
  });

  it('rejects with GO_REQUIRES_VIEW_THIS_ROUND when present round != current round', () => {
    const s = fixture();
    s.closingArgPresentedRound = 4; // mismatch
    const [, err] = recordDesignerGo(s, consent);
    expect(err).toMatch(/GO_REQUIRES_VIEW_THIS_ROUND/);
  });

  it('rejects with GO_REQUIRES_VIEW_THIS_ROUND when never presented', () => {
    const s = fixture();
    s.closingArgPresentedRound = null;
    const [, err] = recordDesignerGo(s, consent);
    expect(err).toMatch(/GO_REQUIRES_VIEW_THIS_ROUND/);
    expect(err).toMatch(/round never/);
  });

  it('rejects with INVALID_CONSENT on missing consent', () => {
    const s = fixture();
    const [, err] = recordDesignerGo(s, undefined);
    expect(err).toMatch(/INVALID_CONSENT/);
  });
});
