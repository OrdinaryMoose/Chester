import { describe, it, expect } from 'vitest';
import { DerivedPositionalIndex } from '../DerivedPositionalIndex.js';
import { factKey } from '../utils.js';

describe('DerivedPositionalIndex', () => {
  it('addFact with single arity-1 fact populates one bucket', () => {
    const idx = new DerivedPositionalIndex();
    idx.addFact('p', ['a']);
    expect(idx.bucketFor('p', 1, 0, 'a')).toEqual(new Set([factKey('p', ['a'])]));
  });

  it('addFact with multiple facts populates correct buckets per position', () => {
    const idx = new DerivedPositionalIndex();
    idx.addFact('p', ['a', 'x']);
    idx.addFact('p', ['a', 'y']);
    idx.addFact('p', ['b', 'x']);
    expect(idx.bucketFor('p', 2, 0, 'a')).toEqual(new Set([factKey('p', ['a', 'x']), factKey('p', ['a', 'y'])]));
    expect(idx.bucketFor('p', 2, 0, 'b')).toEqual(new Set([factKey('p', ['b', 'x'])]));
    expect(idx.bucketFor('p', 2, 1, 'x')).toEqual(new Set([factKey('p', ['a', 'x']), factKey('p', ['b', 'x'])]));
    expect(idx.bucketFor('p', 2, 1, 'y')).toEqual(new Set([factKey('p', ['a', 'y'])]));
  });

  it('addFact is idempotent at the bucket level (Set semantics)', () => {
    const idx = new DerivedPositionalIndex();
    idx.addFact('p', ['a']);
    idx.addFact('p', ['a']);
    expect(idx.bucketFor('p', 1, 0, 'a').size).toBe(1);
  });

  it('bucketFor with no facts asserted returns an empty Set', () => {
    const idx = new DerivedPositionalIndex();
    expect(idx.bucketFor('p', 1, 0, 'a')).toEqual(new Set());
  });

  it('bucketFor with a value that has no bucket returns an empty Set', () => {
    const idx = new DerivedPositionalIndex();
    idx.addFact('p', ['a']);
    expect(idx.bucketFor('p', 1, 0, 'b')).toEqual(new Set());
  });

  it('bucketFor with a position out of range returns an empty Set', () => {
    const idx = new DerivedPositionalIndex();
    idx.addFact('p', ['a']);
    expect(idx.bucketFor('p', 1, 5, 'a')).toEqual(new Set());
  });

  it('bucketFor with an unknown predicate returns an empty Set', () => {
    const idx = new DerivedPositionalIndex();
    idx.addFact('p', ['a']);
    expect(idx.bucketFor('q', 1, 0, 'a')).toEqual(new Set());
  });

  it('different (predicate, arity) pairs are stored separately', () => {
    const idx = new DerivedPositionalIndex();
    idx.addFact('p', ['a']);
    idx.addFact('p', ['a', 'b']);
    expect(idx.bucketFor('p', 1, 0, 'a').size).toBe(1);
    expect(idx.bucketFor('p', 2, 0, 'a').size).toBe(1);
  });
});
