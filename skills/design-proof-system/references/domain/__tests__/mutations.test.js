import { describe, it, expect, vi } from 'vitest';
import { createInMemorySubstrate } from './_fixtures/inMemorySubstrate.js';
import { OPERATION_SPECS, runOperation, DomainError } from '../mutations.js';
import { ACTION_LABELS, CONSENT_SOURCES } from '../tags.js';

describe('mutations', () => {
  it('OPERATION_SPECS has exactly 10 named verbs', () => {
    expect(Object.keys(OPERATION_SPECS).sort()).toEqual([
      ACTION_LABELS.ADD, ACTION_LABELS.CONFIRM_CLOSURE_GO, ACTION_LABELS.MANAGE_FRICTION,
      ACTION_LABELS.OPEN_PROOF, ACTION_LABELS.PRESENT_CLOSING_ARGUMENT,
      ACTION_LABELS.RATIFY, ACTION_LABELS.REVISE, ACTION_LABELS.WITHDRAW,
      ACTION_LABELS.REVISE_PROPOSITION, ACTION_LABELS.REVISE_RESOLUTION,
    ].sort());
  });

  it('customPostCheck appears on at most 3 of 10 specs', () => {
    const withCustom = Object.values(OPERATION_SPECS).filter(s => 'customPostCheck' in s);
    expect(withCustom.length).toBeLessThanOrEqual(3);
  });

  it('runOperation throws UNKNOWN_VERB on bad name', () => {
    const s = createInMemorySubstrate();
    const ports = _makeFullPorts(s);
    expect(() => runOperation('not_a_verb', {}, { source: CONSENT_SOURCES.DESIGNER }, ports))
      .toThrow(/UNKNOWN_VERB/);
  });

  it('runOperation calls saveState after successful commit', () => {
    const s = createInMemorySubstrate();
    const ports = _makeFullPorts(s);
    runOperation(ACTION_LABELS.ADD, { idShape: 'evidence', source: 'codebase', statement: 'x' }, { source: CONSENT_SOURCES.DESIGNER }, ports);
    expect(ports.persist.saveState).toHaveBeenCalled();
  });

  it('runOperation throws POST_COMMIT_SAVE_FAILED on persist failure', () => {
    const s = createInMemorySubstrate();
    const ports = _makeFullPorts(s, { failSave: true });
    expect(() => runOperation(ACTION_LABELS.ADD, { idShape: 'evidence', source: 'codebase', statement: 'x' }, { source: CONSENT_SOURCES.DESIGNER }, ports))
      .toThrow(/POST_COMMIT_SAVE_FAILED/);
  });
});

function _makeFullPorts(substrate, { failSave = false } = {}) {
  let i = 0;
  return {
    ...substrate,
    clock: { now: () => 1700000000 },
    ids: { next: (prefix) => `${prefix}_${++i}` },
    consent: { verify: () => true },
    persist: { saveState: vi.fn(() => { if (failSave) throw new Error('DISK_FULL'); }) },
  };
}
