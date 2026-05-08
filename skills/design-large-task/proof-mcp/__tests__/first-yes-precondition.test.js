import { describe, it, expect } from 'vitest';
import { mkdtempSync, existsSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  initializeState, saveState, loadState, addConcern, ratifyConcern,
  applyOperations, ratifyResolveCondition,
} from '../state.js';
import { handlePresentClosingArgument } from '../server.js';

const CONSENT = { source: 'designer', rationale: 'test' };

function freshStateFile() {
  const dir = mkdtempSync(join(tmpdir(), 'first-yes-'));
  const file = join(dir, 'state.json');
  const s = initializeState('test problem');
  saveState(s, file);
  return file;
}

describe('first-yes precondition on present_closing_argument', () => {
  it('refuses when a draft Concern exists; returns FIRST_YES_GATE_FAILED with unratified_ids', () => {
    const file = freshStateFile();
    const state = loadState(file);
    const [concernId, newState] = addConcern(state, { label: 'C1', description: 'd' }, CONSENT);
    saveState(newState, file);

    const result = handlePresentClosingArgument({ state_file: file, consent: CONSENT });
    const payload = JSON.parse(result.content[0].text);
    expect(result.isError).toBe(true);
    expect(payload.code).toBe('FIRST_YES_GATE_FAILED');
    expect(payload.unratified_ids).toContain(concernId);
    if (existsSync(file)) unlinkSync(file);
  });

  it('refuses when a draft NC exists', () => {
    const file = freshStateFile();
    let s = loadState(file);
    [, s] = addConcern(s, { label: 'C1', description: 'd' }, CONSENT);
    [s] = ratifyConcern(s, 'CERN-1', CONSENT);
    const r = applyOperations(s, [
      { op: 'add', type: 'EVIDENCE', statement: 'fact', source: 'codebase' },
      { op: 'add', type: 'NECESSARY_CONDITION', statement: 'must Q', collapse_test: 'breaks', grounding: ['EVID-1'], reasoning_chain: 'IF fact THEN must Q', rejected_alternatives: ['alt1'] },
    ], CONSENT);
    s = r.state;
    // NC default ratificationStatus is 'draft'.
    saveState(s, file);

    const result = handlePresentClosingArgument({ state_file: file, consent: CONSENT });
    const payload = JSON.parse(result.content[0].text);
    expect(result.isError).toBe(true);
    expect(payload.code).toBe('FIRST_YES_GATE_FAILED');
    expect(payload.unratified_ids).toContain('NCON-1');
    if (existsSync(file)) unlinkSync(file);
  });

  it('refuses when an RC has ratification === null', () => {
    const file = freshStateFile();
    let s = loadState(file);
    [, s] = addConcern(s, { label: 'C1', description: 'd' }, CONSENT);
    [s] = ratifyConcern(s, 'CERN-1', CONSENT);
    const r = applyOperations(s, [
      { op: 'add', type: 'EVIDENCE', statement: 'fact', source: 'codebase' },
      { op: 'add', type: 'NECESSARY_CONDITION', statement: 'must Q', collapse_test: 'breaks', grounding: ['EVID-1'], reasoning_chain: 'IF fact THEN must Q', rejected_alternatives: ['alt1'] },
      { op: 'add', type: 'RESOLVE_CONDITION', statement: 'system Qs', problem_anchor: 'CERN-1', grounding: ['NCON-1'] },
    ], CONSENT);
    s = r.state;
    // Manually ratify the NC so only the RC remains unratified.
    s.elements.get('NCON-1').ratificationStatus = 'ratified';
    saveState(s, file);

    const result = handlePresentClosingArgument({ state_file: file, consent: CONSENT });
    const payload = JSON.parse(result.content[0].text);
    expect(result.isError).toBe(true);
    expect(payload.code).toBe('FIRST_YES_GATE_FAILED');
    expect(payload.unratified_ids).toContain('RCON-1');
    if (existsSync(file)) unlinkSync(file);
  });

  it('passes the gate when every active element is ratified (returns non-error response)', () => {
    const file = freshStateFile();
    let s = loadState(file);
    [, s] = addConcern(s, { label: 'C1', description: 'd' }, CONSENT);
    [s] = ratifyConcern(s, 'CERN-1', CONSENT);
    let r = applyOperations(s, [
      { op: 'add', type: 'EVIDENCE', statement: 'fact', source: 'codebase' },
      { op: 'add', type: 'NECESSARY_CONDITION', statement: 'must Q', collapse_test: 'breaks', grounding: ['EVID-1'], reasoning_chain: 'IF fact THEN must Q', rejected_alternatives: ['alt1'] },
      { op: 'add', type: 'RESOLVE_CONDITION', statement: 'system Qs', problem_anchor: 'CERN-1', grounding: ['NCON-1'] },
    ], CONSENT);
    s = r.state;
    s.elements.get('NCON-1').ratificationStatus = 'ratified';
    [s] = ratifyResolveCondition(s, { elementId: 'RCON-1', ratificationText: 'ratified' }, CONSENT);
    while (s.round < 3) { r = applyOperations(s, [], CONSENT); s = r.state; }
    saveState(s, file);

    const result = handlePresentClosingArgument({ state_file: file, consent: CONSENT });
    // Either success or a non-gate error (e.g. trigger). Must NOT be FIRST_YES_GATE_FAILED.
    if (result.isError) {
      const payload = JSON.parse(result.content[0].text);
      expect(payload.code).not.toBe('FIRST_YES_GATE_FAILED');
    } else {
      const payload = JSON.parse(result.content[0].text);
      // Closing-argument envelope shape: has resolveConditions array.
      expect(payload).toHaveProperty('resolveConditions');
    }
    if (existsSync(file)) unlinkSync(file);
  });
});
