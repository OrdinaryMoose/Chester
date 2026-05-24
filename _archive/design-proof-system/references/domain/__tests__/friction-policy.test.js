import { describe, it, expect } from 'vitest';
import { createInMemorySubstrate } from './_fixtures/inMemorySubstrate.js';
import { registerStatic, detectFrictions } from '../friction-policy.js';

describe('friction-policy', () => {
  it('registerStatic defines at least four friction-detection rules', () => {
    const s = createInMemorySubstrate();
    let count = 0;
    registerStatic({ defineRule: (...a) => { count++; s.rules.defineRule(...a); }, undefineRule: s.rules.undefineRule, getRule: s.rules.getRule });
    expect(count).toBeGreaterThanOrEqual(4);
  });

  it('detectFrictions returns array (possibly empty)', () => {
    const s = createInMemorySubstrate();
    registerStatic(s.rules);
    const fr = detectFrictions({ query: s.query, explain: s.explain });
    expect(Array.isArray(fr)).toBe(true);
  });
});
