import { describe, it, expect } from 'vitest';
import { createInMemorySubstrate } from './inMemorySubstrate.js';

describe('inMemorySubstrate', () => {
  it('exposes six substrate ports', () => {
    const s = createInMemorySubstrate();
    expect(s.facts).toBeDefined();
    expect(s.rules).toBeDefined();
    expect(s.query).toBeDefined();
    expect(s.snapshot).toBeDefined();
    expect(s.explain).toBeDefined();
    expect(s.tx).toBeDefined();
  });

  it('assertFact then query round-trips', () => {
    const s = createInMemorySubstrate();
    s.facts.assertFact('p', ['a', 'b']);
    expect(s.query.query(['p', ['_', '_']])).toEqual([{}]);
  });
});
