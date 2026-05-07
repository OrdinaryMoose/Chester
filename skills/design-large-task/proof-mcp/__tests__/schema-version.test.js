import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { loadState, initializeState } from '../state.js';
import { SCHEMA_VERSION } from '../proof.js';

function tmpFile(content) {
  const dir = mkdtempSync(join(tmpdir(), 'chester-d1-'));
  const p = join(dir, 'state.json');
  writeFileSync(p, content, 'utf-8');
  return p;
}

describe('schema version', () => {
  it('SCHEMA_VERSION is exported and is 1', () => {
    expect(SCHEMA_VERSION).toBe(1);
  });

  it('initializeState sets schemaVersion to current version', () => {
    const s = initializeState('test problem');
    expect(s.schemaVersion).toBe(SCHEMA_VERSION);
  });

  it('loadState refuses state file with schemaVersion > runtime', () => {
    const p = tmpFile(JSON.stringify({ schemaVersion: 99, round: 0, elements: [], concerns: [] }));
    expect(() => loadState(p)).toThrowError(/schema/i);
  });

  it('loadState backfills missing schemaVersion to current version', () => {
    const p = tmpFile(JSON.stringify({ round: 0, elements: [], concerns: [], elementCounters: {}, concernCounter: 0, revisionLog: [], ratificationLog: [], frictionLog: [] }));
    const s = loadState(p);
    expect(s.schemaVersion).toBe(SCHEMA_VERSION);
  });

  it('loadState accepts schemaVersion: 1', () => {
    const p = tmpFile(JSON.stringify({ schemaVersion: 1, round: 0, elements: [], concerns: [], elementCounters: {}, concernCounter: 0, revisionLog: [], ratificationLog: [], frictionLog: [] }));
    const s = loadState(p);
    expect(s.schemaVersion).toBe(1);
  });
});
