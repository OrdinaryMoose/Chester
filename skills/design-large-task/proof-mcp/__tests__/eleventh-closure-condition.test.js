import { describe, it, expect } from 'vitest';
import { checkClosure } from '../metrics.js';
import { initializeState } from '../state.js';

function fullyCompliantState() {
  return {
    ...initializeState('p'),
    round: 5,
    closingArgPresentedRound: 5,
    closingArgGoRound: 5,
    concerns: [{ id: 'CERN-1', label: 'C', description: 'd' }],
    concernsLocked: true,
  };
}

describe('eleventh closure condition', () => {
  it('checkClosure adds reason when closingArgGoRound !== state.round', () => {
    const s = { ...fullyCompliantState(), closingArgGoRound: null };
    const out = checkClosure(s);
    expect(out.reasons.some(r => /Designer go-choice/.test(r))).toBe(true);
  });

  it('checkClosure clears the eleventh-condition reason when go round matches current round', () => {
    const s = { ...fullyCompliantState(), closingArgGoRound: 5 };
    const out = checkClosure(s);
    expect(out.reasons.some(r => /Designer go-choice/.test(r))).toBe(false);
  });
});
