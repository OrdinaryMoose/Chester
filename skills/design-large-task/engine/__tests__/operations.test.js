import { describe, it, expect } from 'vitest';
import { FactStore } from '../FactStore.js';

describe('FactStore', () => {
  it('assertFact stores and exposes a fact via factExists', () => {
    const fs = new FactStore();
    fs.assertFact('p', ['a', 'b']);
    expect(fs.factExists('p', ['a', 'b'])).toBe(true);
    expect(fs.factExists('p', ['x', 'y'])).toBe(false);
  });

  it('assertFact is idempotent (no duplicate)', () => {
    const fs = new FactStore();
    fs.assertFact('p', ['a', 'b']);
    fs.assertFact('p', ['a', 'b']);
    expect(fs.allFacts('p', 2)).toHaveLength(1);
  });

  it('retractFact removes a fact', () => {
    const fs = new FactStore();
    fs.assertFact('p', ['a', 'b']);
    fs.retractFact('p', ['a', 'b']);
    expect(fs.factExists('p', ['a', 'b'])).toBe(false);
  });

  it('retractFact on absent fact is idempotent', () => {
    const fs = new FactStore();
    expect(() => fs.retractFact('p', ['a', 'b'])).not.toThrow();
  });

  it('treats predicate arity as part of identity', () => {
    const fs = new FactStore();
    fs.assertFact('p', ['a', 'b']);
    fs.assertFact('p', ['a', 'b', 'c']);
    expect(fs.allFacts('p', 2)).toHaveLength(1);
    expect(fs.allFacts('p', 3)).toHaveLength(1);
  });

  it('rejects non-constant arguments with TYPE_ERROR', () => {
    const fs = new FactStore();
    expect(() => fs.assertFact('p', [{}])).toThrow(expect.objectContaining({ code: 'TYPE_ERROR' }));
    expect(() => fs.assertFact('p', [() => {}])).toThrow(expect.objectContaining({ code: 'TYPE_ERROR' }));
    expect(() => fs.assertFact('p', [undefined])).toThrow(expect.objectContaining({ code: 'TYPE_ERROR' }));
  });

  it('accepts string, number, boolean, null as constants', () => {
    const fs = new FactStore();
    expect(() => fs.assertFact('p', ['s', 1, true, null])).not.toThrow();
    expect(fs.factExists('p', ['s', 1, true, null])).toBe(true);
  });
});
