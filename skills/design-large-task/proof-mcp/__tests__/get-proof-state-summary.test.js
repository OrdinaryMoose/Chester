import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { initializeState, saveState, applyOperations } from '../state.js';
import { handleGetProofState } from '../server.js';

function buildLargeState(file, count = 40) {
  let state = initializeState('p');
  saveState(state, file);
  // add `count` Evidence elements via applyOperations to inflate the body
  const ops = [];
  for (let i = 0; i < count; i++) {
    ops.push({ op: 'add', type: 'EVIDENCE', statement: 'E'.repeat(200), source: 'codebase' });
  }
  const r = applyOperations(state, ops, { source: 'designer' });
  saveState(r.state, file);
}

describe('get_proof_state summary_mode (AC-5.2)', () => {
  let file;
  beforeEach(() => {
    const dir = mkdtempSync(join(tmpdir(), 'gps-summary-'));
    file = join(dir, 'state.json');
    buildLargeState(file, 40);
  });

  it('summary_mode:true returns counts and IDs only', () => {
    const res = handleGetProofState({ state_file: file, summary_mode: true });
    const payload = JSON.parse(res.content[0].text);
    expect(payload.counts).toBeDefined();
    expect(payload.counts.evidence).toBe(40);
    // No element bodies
    for (const [, el] of Object.entries(payload.elements)) {
      expect(el).toEqual(expect.objectContaining({ type: expect.any(String), status: expect.any(String) }));
      expect(el).not.toHaveProperty('statement');
    }
    expect(payload).not.toHaveProperty('operationLog');
  });

  it('summary_mode response stays under 25K chars on a 40-element fixture', () => {
    const res = handleGetProofState({ state_file: file, summary_mode: true });
    expect(res.content[0].text.length).toBeLessThan(25_000);
  });

  it('summary_mode:false (or omitted) returns full body', () => {
    const res = handleGetProofState({ state_file: file });
    const payload = JSON.parse(res.content[0].text);
    expect(payload.elements).toBeDefined();
    // Full elements include statement
    const sampleId = Object.keys(payload.elements)[0];
    expect(payload.elements[sampleId]).toHaveProperty('statement');
  });
});
