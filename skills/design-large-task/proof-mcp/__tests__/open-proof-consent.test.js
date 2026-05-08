import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { handleOpenProof } from '../server.js';
import { loadState } from '../state.js';
import { unlinkSync, existsSync } from 'fs';

const consent = { source: 'designer', rationale: 'open directive' };

const validSubmission = (overrides = {}) => ({
  problem_statement: 'p',
  concerns: [{ label: 'C-1', description: 'd' }],
  elements: [{
    type: 'EVIDENCE', statement: 'e', source: 'codebase',
    restructuring: { action: 'verbatim-preserve', citation: 'src' },
  }],
  consent,
  ...overrides,
});

describe('open_proof consent + INVALID_SEED_PACKET', () => {
  let state_file;
  beforeEach(() => { state_file = `/tmp/open-proof-${Date.now()}-${Math.random()}.json`; });
  afterEach(() => { if (existsSync(state_file)) unlinkSync(state_file); });

  it('successful open records consent as operationLog[0] with op:open', async () => {
    const result = await handleOpenProof({ state_file, submission_material: validSubmission() });
    expect(result.isError).toBeFalsy();
    const state = loadState(state_file);
    expect(state.operationLog[0]).toMatchObject({ op: 'open', consent });
  });

  it('missing problem_statement returns INVALID_SEED_PACKET and persists rejected entry', async () => {
    const result = await handleOpenProof({ state_file, submission_material: validSubmission({ problem_statement: undefined }) });
    expect(result.isError).toBe(true);
    const body = JSON.parse(result.content[0].text);
    expect(body.code).toBe('INVALID_SEED_PACKET');
    expect(body.message).toMatch(/problem_statement/);
    const state = loadState(state_file);
    const rejected = state.operationLog.find(e => e.op === 'open' && e.provenance?.rejected);
    expect(rejected).toBeDefined();
    expect(rejected.provenance.reason).toMatch(/problem_statement/);
  });

  it('missing concerns returns INVALID_SEED_PACKET and persists rejected entry', async () => {
    const result = await handleOpenProof({ state_file, submission_material: validSubmission({ concerns: [] }) });
    expect(result.isError).toBe(true);
    const body = JSON.parse(result.content[0].text);
    expect(body.code).toBe('INVALID_SEED_PACKET');
    expect(body.message).toMatch(/Concern/i);
    const state = loadState(state_file);
    const rejected = state.operationLog.find(e => e.op === 'open' && e.provenance?.rejected);
    expect(rejected).toBeDefined();
    expect(rejected.provenance.reason).toMatch(/concern/i);
  });

  it('missing Evidence returns INVALID_SEED_PACKET and persists rejected entry', async () => {
    const result = await handleOpenProof({ state_file, submission_material: validSubmission({ elements: [] }) });
    expect(result.isError).toBe(true);
    const body = JSON.parse(result.content[0].text);
    expect(body.code).toBe('INVALID_SEED_PACKET');
    expect(body.message).toMatch(/Evidence/i);
    const state = loadState(state_file);
    const rejected = state.operationLog.find(e => e.op === 'open' && e.provenance?.rejected);
    expect(rejected).toBeDefined();
    expect(rejected.provenance.reason).toMatch(/evidence/i);
  });

  it('missing restructuring action label returns INVALID_SEED_PACKET and persists rejected entry', async () => {
    const result = await handleOpenProof({
      state_file,
      submission_material: validSubmission({
        elements: [{ type: 'EVIDENCE', statement: 'e', source: 'codebase' }],
      }),
    });
    expect(result.isError).toBe(true);
    const body = JSON.parse(result.content[0].text);
    expect(body.code).toBe('INVALID_SEED_PACKET');
    expect(body.message).toMatch(/restructuring/);
    const state = loadState(state_file);
    const rejected = state.operationLog.find(e => e.op === 'open' && e.provenance?.rejected);
    expect(rejected).toBeDefined();
    expect(rejected.provenance.reason).toMatch(/restructuring/i);
  });

  it('invalid consent returns INVALID_CONSENT (not INVALID_SEED_PACKET)', async () => {
    const result = await handleOpenProof({ state_file, submission_material: validSubmission({ consent: undefined }) });
    expect(result.isError).toBe(true);
    const body = JSON.parse(result.content[0].text);
    expect(body.code).toBe('INVALID_CONSENT');
  });

  it('rejected open against already-open file preserves prior proofStatus and appends audit entry with priorOpen=true', async () => {
    // First, open the proof successfully.
    const ok = await handleOpenProof({ state_file, submission_material: validSubmission() });
    expect(ok.isError).toBeFalsy();
    const before = loadState(state_file);
    expect(before.proofStatus).toBe('planning');
    const successLog = before.operationLog.find(e => e.op === 'open' && !e.provenance?.rejected);
    expect(successLog).toBeDefined();

    // An invalid seed packet (missing problem_statement) submitted against the
    // already-open file. Order is shape-check → already-open, so the seed-packet
    // failure fires first and persistRejectedOpen runs against the existing state.
    const reject = await handleOpenProof({ state_file, submission_material: validSubmission({ problem_statement: undefined }) });
    expect(reject.isError).toBe(true);
    const body = JSON.parse(reject.content[0].text);
    expect(body.code).toBe('INVALID_SEED_PACKET');

    const after = loadState(state_file);
    // Prior successful open is preserved.
    expect(after.proofStatus).toBe('planning');
    // Audit entry is appended with priorOpen=true.
    const rejected = after.operationLog.find(e => e.op === 'open' && e.provenance?.rejected);
    expect(rejected).toBeDefined();
    expect(rejected.provenance.priorOpen).toBe(true);
    // Original successful open log entry survives.
    expect(after.operationLog.some(e => e.op === 'open' && !e.provenance?.rejected)).toBe(true);
  });
});
