import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  initializeState,
  applyOperations,
  addConcern,
  lockConcerns,
  ratifyConcern,
  ratifyResolveCondition,
  recordClosingArgPresented,
  recordDesignerGo,
  reopenProof,
  saveState,
} from '../state.js';
import { deriveClosingArgument } from '../closing-argument.js';
import { handleReopenProof } from '../server.js';

const consent = { source: 'designer', rationale: 'amend' };

/**
 * Build a state with proofStatus='closed' via the full happy path.
 * Mirrors the closing-argument-end-to-end fixture so envelope contents are
 * realistic.
 */
function buildClosedState() {
  let s = initializeState('p');
  let [, sa] = addConcern(s, { label: 'concern X', description: 'd' }, consent);
  s = sa;
  [s] = lockConcerns(s, consent);
  [s] = ratifyConcern(s, 'CERN-1', consent);
  let r = applyOperations(s, [
    { op: 'add', type: 'EVIDENCE', statement: 'fact', source: 'codebase' },
    { op: 'add', type: 'NECESSARY_CONDITION', statement: 'must Q', collapse_test: 'breaks if no Q', grounding: ['EVID-1'], reasoning_chain: 'IF fact THEN must Q', rejected_alternatives: ['alt1'] },
    { op: 'add', type: 'RESOLVE_CONDITION', statement: 'system Qs', problem_anchor: 'CERN-1', grounding: ['NCON-1'] },
  ], consent);
  s = r.state;
  r = applyOperations(s, [{ op: 'revise', target: 'NCON-1', collapse_test: 'breaks if no Q at all' }], consent);
  s = r.state;
  [s] = ratifyResolveCondition(s, { elementId: 'RCON-1', ratificationText: 'ratified' }, consent);
  while (s.round < 3) { r = applyOperations(s, [], consent); s = r.state; }
  [s] = recordClosingArgPresented(s, consent);
  [s] = recordDesignerGo(s, consent);
  return s;
}

describe('reopenProof', () => {
  it('rejects when proofStatus !== closed', () => {
    const s = initializeState('p');
    const [, err] = reopenProof(s, consent);
    expect(err).toMatch(/^NOT_CLOSED:/);
    expect(err).toMatch(/unopen/);
  });

  it('rejects when proofStatus is open (not closed)', () => {
    const s = initializeState('p');
    s.proofStatus = 'open';
    const [, err] = reopenProof(s, consent);
    expect(err).toMatch(/^NOT_CLOSED: proofStatus is open/);
  });

  it('captures closure envelope into lastClosureArtifact', () => {
    const closed = buildClosedState();
    expect(closed.proofStatus).toBe('closed');
    const expectedEnvelope = deriveClosingArgument(closed);
    const [reopened, err] = reopenProof(closed, consent);
    expect(err).toBeNull();
    expect(reopened.lastClosureArtifact).toEqual(expectedEnvelope);
  });

  it('resets closingArgPresentedRound and closingArgGoRound to null', () => {
    const closed = buildClosedState();
    expect(closed.closingArgPresentedRound).not.toBeNull();
    expect(closed.closingArgGoRound).not.toBeNull();
    const [reopened, err] = reopenProof(closed, consent);
    expect(err).toBeNull();
    expect(reopened.closingArgPresentedRound).toBeNull();
    expect(reopened.closingArgGoRound).toBeNull();
  });

  it('sets proofStatus to open', () => {
    const closed = buildClosedState();
    const [reopened, err] = reopenProof(closed, consent);
    expect(err).toBeNull();
    expect(reopened.proofStatus).toBe('open');
  });

  it('preserves concernsLocked', () => {
    const closed = buildClosedState();
    expect(closed.concernsLocked).toBe(true);
    const [reopened, err] = reopenProof(closed, consent);
    expect(err).toBeNull();
    expect(reopened.concernsLocked).toBe(true);
  });

  it('appends operationLog entry op: reopen', () => {
    const closed = buildClosedState();
    const before = closed.operationLog.length;
    const [reopened, err] = reopenProof(closed, consent);
    expect(err).toBeNull();
    expect(reopened.operationLog.length).toBe(before + 1);
    const last = reopened.operationLog[reopened.operationLog.length - 1];
    expect(last.op).toBe('reopen');
    expect(last.entityId).toBeNull();
    expect(last.type).toBeNull();
    expect(last.consent).toEqual(consent);
    expect(last.changedFields).toEqual(['proofStatus']);
    expect(last.provenance).toEqual({ from: 'closed', to: 'open' });
    expect(last.round).toBe(reopened.round);
  });

  it('rejects without consent', () => {
    const closed = buildClosedState();
    const [, err] = reopenProof(closed, null);
    expect(err).toMatch(/^INVALID_CONSENT:/);
  });

  it('rejects with malformed consent', () => {
    const closed = buildClosedState();
    const [, err] = reopenProof(closed, { rationale: 'no source' });
    expect(err).toMatch(/^INVALID_CONSENT:/);
  });

  it('does not mutate the input state', () => {
    const closed = buildClosedState();
    const beforeStatus = closed.proofStatus;
    const beforeLastClosure = closed.lastClosureArtifact;
    const beforeLogLen = closed.operationLog.length;
    reopenProof(closed, consent);
    expect(closed.proofStatus).toBe(beforeStatus);
    expect(closed.lastClosureArtifact).toBe(beforeLastClosure);
    expect(closed.operationLog.length).toBe(beforeLogLen);
  });

  it('second close cycle does NOT update lastClosureArtifact unless reopen runs again', () => {
    // First close
    const firstClosed = buildClosedState();
    // First reopen captures envelope_1
    const [afterFirstReopen, err1] = reopenProof(firstClosed, consent);
    expect(err1).toBeNull();
    const envelope1 = afterFirstReopen.lastClosureArtifact;
    expect(envelope1).not.toBeNull();

    // Drive a second close: present + go again. After reopen, flags are
    // null but proofStatus is 'open' and other proof state is intact, so we
    // can present_closing_argument and confirm_closure_go again.
    let s = afterFirstReopen;
    [s] = recordClosingArgPresented(s, consent);
    [s] = recordDesignerGo(s, consent);
    expect(s.proofStatus).toBe('closed');

    // Without a second reopen, lastClosureArtifact should still be envelope_1.
    expect(s.lastClosureArtifact).toEqual(envelope1);
  });

  it('second reopen captures the latest closure envelope (not a stale envelope_1)', () => {
    // First cycle: close → reopen captures envelope_1
    const firstClosed = buildClosedState();
    const [afterFirstReopen, e1] = reopenProof(firstClosed, consent);
    expect(e1).toBeNull();
    const envelope1 = afterFirstReopen.lastClosureArtifact;
    expect(envelope1).not.toBeNull();

    // Second cycle: present + go → close again
    let s = afterFirstReopen;
    [s] = recordClosingArgPresented(s, consent);
    [s] = recordDesignerGo(s, consent);

    // Snapshot what the second envelope must equal — the live state at the
    // moment reopenProof is called.
    const expected2 = deriveClosingArgument(s);
    const [afterSecondReopen, e2] = reopenProof(s, consent);
    expect(e2).toBeNull();
    const envelope2 = afterSecondReopen.lastClosureArtifact;

    // Reopen captured the second-close state (not stale envelope_1).
    expect(envelope2).toEqual(expected2);
  });
});

describe('handleReopenProof (server layer)', () => {
  let dir;
  beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'proof-reopen-')); });
  afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

  it('success path: returns reopened payload and persists state', async () => {
    const path = join(dir, 'state.json');
    const closed = buildClosedState();
    saveState(closed, path);

    const result = handleReopenProof({ state_file: path, consent });
    expect(result.isError).toBeFalsy();
    const payload = JSON.parse(result.content[0].text);
    expect(payload).toEqual({ reopened: true, proofStatus: 'open' });

    // Re-load and verify persistence
    const { loadState } = await import('../state.js');
    const reloaded = loadState(path);
    expect(reloaded.proofStatus).toBe('open');
    expect(reloaded.lastClosureArtifact).not.toBeNull();
    expect(reloaded.closingArgPresentedRound).toBeNull();
    expect(reloaded.closingArgGoRound).toBeNull();
  });

  it('NOT_CLOSED error path: returns isError with code NOT_CLOSED', () => {
    const path = join(dir, 'state.json');
    const s = initializeState('p');
    s.proofStatus = 'open';
    saveState(s, path);

    const result = handleReopenProof({ state_file: path, consent });
    expect(result.isError).toBe(true);
    const payload = JSON.parse(result.content[0].text);
    expect(payload.code).toBe('NOT_CLOSED');
    expect(payload.message).toMatch(/proofStatus is open/);
  });

  it('INVALID_CONSENT error path: returns isError with code INVALID_CONSENT', () => {
    const path = join(dir, 'state.json');
    const closed = buildClosedState();
    saveState(closed, path);

    const result = handleReopenProof({ state_file: path, consent: null });
    expect(result.isError).toBe(true);
    const payload = JSON.parse(result.content[0].text);
    expect(payload.code).toBe('INVALID_CONSENT');
  });
});
