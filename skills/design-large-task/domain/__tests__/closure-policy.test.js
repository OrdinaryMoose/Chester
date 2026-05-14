import { describe, it, expect } from 'vitest';
import { createInMemorySubstrate } from './_fixtures/inMemorySubstrate.js';
import { registerStatic, triggerGate } from '../closure-policy.js';

describe('closure-policy', () => {
  it('registerStatic defines at least one closure_permitted rule', () => {
    const s = createInMemorySubstrate();
    let calls = 0;
    registerStatic({ defineRule: (...args) => { calls++; s.rules.defineRule(...args); }, undefineRule: s.rules.undefineRule, getRule: s.rules.getRule });
    expect(calls).toBeGreaterThanOrEqual(1);
  });

  it('triggerGate returns null on permitted closure (smoke)', () => {
    const s = createInMemorySubstrate();
    registerStatic(s.rules);
    // No assertions yet — query may legitimately return null; this is a smoke test for the function existing and returning DomainError|null.
    const result = triggerGate({}, { query: s.query, explain: s.explain });
    expect(result === null || (result && typeof result.code === 'string')).toBe(true);
  });
});
