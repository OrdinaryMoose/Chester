// operation-spec.test.js
// Implements: AC-3.1, AC-3.2, AC-3.3, AC-3.4 (source half)
import { describe, it, expect } from 'vitest';
import { readSource, countMatches } from './source-scanner.js';

describe('operation-spec', () => {
  const src = readSource('mutations.js');

  it('exactly one runOperation definition', () => {
    expect(countMatches(src, /\bfunction runOperation\b|\bconst runOperation\b/g)).toBe(1);
  });

  it('exactly one OPERATION_SPECS declaration', () => {
    expect(countMatches(src, /\bOPERATION_SPECS\s*=\s*Object\.freeze\b/g)).toBe(1);
  });

  it('OPERATION_SPECS contains all eight verb keys', () => {
    for (const verb of ['ADD', 'REVISE', 'WITHDRAW', 'RATIFY', 'MANAGE_FRICTION', 'PRESENT_CLOSING_ARGUMENT', 'CONFIRM_CLOSURE_GO', 'OPEN_PROOF']) {
      expect(src).toMatch(new RegExp(`ACTION_LABELS\\.${verb}`));
    }
  });

  it('customPostCheck appears on at most 3 of 8 records', () => {
    expect(countMatches(src, /customPostCheck:/g)).toBeLessThanOrEqual(3);
  });

  it('runOperation body contains §6.1 step labels in order', () => {
    const stepRefs = [...src.matchAll(/§6\.1 step (\d+)/g)].map(m => parseInt(m[1], 10));
    expect(stepRefs.length).toBeGreaterThanOrEqual(8);
    for (let i = 1; i < stepRefs.length; i++) expect(stepRefs[i]).toBeGreaterThanOrEqual(stepRefs[i - 1]);
  });
});
