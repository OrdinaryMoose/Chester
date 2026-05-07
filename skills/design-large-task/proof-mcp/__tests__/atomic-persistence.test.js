import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

// vi.mock must be hoisted to top of test file. Use vi.importActual to keep real fs
// for everything except renameSync, which we wrap as a vi.fn() that delegates to the
// real synchronous implementation by default. Tests override per-case.
vi.mock('fs', async () => {
  const actual = await vi.importActual('fs');
  // Wrap so the spy calls the real sync implementation by default. Importantly
  // the mock factory closes over `actual`, so resetting the implementation does
  // not require re-importing fs from a test (which would resolve to the mock
  // and recurse).
  const renameSync = vi.fn((...args) => actual.renameSync(...args));
  return { ...actual, renameSync };
});

import { renameSync } from 'fs';
import { initializeState, saveState } from '../state.js';

function tmpDir() { return mkdtempSync(join(tmpdir(), 'chester-d1-')); }

describe('atomic persistence', () => {
  afterEach(() => {
    // Clear call history but preserve the default implementation captured in the
    // mock factory. mockReset would erase that default and break sibling tests.
    vi.mocked(renameSync).mockClear();
  });

  it('saveState writes via tmp file then renames', () => {
    const dir = tmpDir();
    const p = join(dir, 'state.json');
    const s = initializeState('test problem');
    saveState(s, p);
    expect(renameSync).toHaveBeenCalled();
    const written = JSON.parse(readFileSync(p, 'utf-8'));
    expect(written.round).toBe(0);
  });

  it('rename failure leaves original state file unchanged', () => {
    const dir = tmpDir();
    const p = join(dir, 'state.json');
    const original = initializeState('test problem');
    original.round = 7;
    saveState(original, p);
    // Override only for this test, then restore via mockReset → re-set to default
    // would require recapturing actual; instead use mockImplementationOnce so the
    // factory default returns automatically on subsequent calls (none here).
    vi.mocked(renameSync).mockImplementationOnce(() => { throw new Error('disk full'); });
    const next = { ...original, round: 99 };
    expect(() => saveState(next, p)).toThrowError(/disk full/);
    const after = JSON.parse(readFileSync(p, 'utf-8'));
    expect(after.round).toBe(7);
  });
});
