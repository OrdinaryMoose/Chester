import { describe, it, expect } from 'vitest';
import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { initializeState, saveState, loadState, addConcern } from '../state.js';
import { handleWithdraw } from '../server.js';

describe('AC-5.1: universal withdraw routes CONCERN end-to-end', () => {
  it('flips Concern status to withdrawn and logs the operation', () => {
    const dir = mkdtempSync(join(tmpdir(), 'concern-w-'));
    const file = join(dir, 'state.json');
    const s = initializeState('p');
    const [concernId, withConcern] = addConcern(s, { label: 'Probe' }, { source: 'designer' });
    saveState(withConcern, file);

    const res = handleWithdraw({
      state_file: file,
      category: 'CONCERN',
      element_id: concernId,
      disposition: 'superseded',
      consent: { source: 'designer' },
    });
    expect(res.isError).toBeFalsy();
    const after = loadState(file);
    const c = after.concerns.find(x => x.id === concernId);
    expect(c.status).toBe('withdrawn');
    const last = after.operationLog[after.operationLog.length - 1];
    expect(last.op).toBe('withdraw');
    expect(last.entityId).toBe(concernId);
  });
});
