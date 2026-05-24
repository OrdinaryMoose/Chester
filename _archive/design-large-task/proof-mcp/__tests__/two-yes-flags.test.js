import { describe, it, expect } from 'vitest';
import { initializeState, recordClosingArgPresented, recordDesignerGo, resetFirstYesIfFired } from '../state.js';

describe('two-yes flags', () => {
  it('initializeState sets both flags to null', () => {
    const s = initializeState('p');
    expect(s.closingArgPresentedRound).toBeNull();
    expect(s.closingArgGoRound).toBeNull();
  });

  it('recordClosingArgPresented sets presented round to current round', () => {
    let s = initializeState('p');
    s.round = 5;
    [s] = recordClosingArgPresented(s, { source: 'designer', rationale: 'test' });
    expect(s.closingArgPresentedRound).toBe(5);
    expect(s.closingArgGoRound).toBeNull();
  });

  it('recordDesignerGo refuses if presented round mismatches current round', () => {
    let s = initializeState('p');
    s.round = 5;
    s.closingArgPresentedRound = 4;
    const [, err] = recordDesignerGo(s, { source: 'designer', rationale: 'test' });
    expect(err).toMatch(/presented in round 4/);
  });

  it('recordDesignerGo sets go round when presented round matches', () => {
    let s = initializeState('p');
    s.round = 5;
    s.closingArgPresentedRound = 5;
    const [newS, err] = recordDesignerGo(s, { source: 'designer', rationale: 'test' });
    expect(err).toBeNull();
    expect(newS.closingArgGoRound).toBe(5);
  });

  it('recordDesignerGo refuses with grammatical "never" message when presented round is null', () => {
    let s = initializeState('p');
    s.round = 5;
    const [, err] = recordDesignerGo(s, { source: 'designer', rationale: 'test' });
    expect(err).toMatch(/presented in round never/);
    expect(err).not.toMatch(/round null/);
  });

  it('resetFirstYesIfFired resets both flags to null (in-place mutation; intended for already-cloned state)', () => {
    let s = initializeState('p');
    s.closingArgPresentedRound = 5;
    s.closingArgGoRound = 5;
    const returned = resetFirstYesIfFired(s);
    expect(returned).toBe(s); // in-place: returns same reference
    expect(s.closingArgPresentedRound).toBeNull();
    expect(s.closingArgGoRound).toBeNull();
  });
});
