import { describe, it, expect } from 'vitest';
import { createInMemorySubstrate } from './_fixtures/inMemorySubstrate.js';
import { getRound, getPhase, advance } from '../lifecycle.js';
import { PHASES } from '../tags.js';

describe('lifecycle', () => {
  it('getRound returns 0 on a fresh substrate (no round fact)', () => {
    const s = createInMemorySubstrate();
    expect(getRound(s)).toBe(0);
  });

  it('advance asserts a round increment', () => {
    const s = createInMemorySubstrate();
    s.facts.assertFact('round', [0]);
    advance(s);
    expect(getRound(s)).toBe(1);
  });

  it('getPhase reads the current phase fact', () => {
    const s = createInMemorySubstrate();
    s.facts.assertFact('phase', [PHASES.ESTABLISHMENT]);
    expect(getPhase(s)).toBe(PHASES.ESTABLISHMENT);
  });
});
