import { describe, it, expect } from 'vitest';
import { unify, V, WILDCARD } from '../Unifier.js';

describe('Unifier.unify', () => {
  it('matches ground pattern (all constants)', () => {
    const bindings = unify([1, 'a', true], [1, 'a', true]);
    expect(bindings).toEqual({});
  });

  it('returns null when ground pattern does not match', () => {
    expect(unify([1, 'a'], [2, 'a'])).toBeNull();
  });

  it('binds variables', () => {
    const bindings = unify([V('X'), V('Y')], ['a', 'b']);
    expect(bindings).toEqual({ X: 'a', Y: 'b' });
  });

  it('mixed pattern: returns bindings for variables, constants must match', () => {
    expect(unify(['a', V('X')], ['a', 'b'])).toEqual({ X: 'b' });
    expect(unify(['a', V('X')], ['c', 'b'])).toBeNull();
  });

  it('wildcard matches anything without binding', () => {
    expect(unify([WILDCARD, V('X')], ['a', 'b'])).toEqual({ X: 'b' });
  });

  it('repeated variable name in pattern requires equal values', () => {
    expect(unify([V('X'), V('X')], ['a', 'a'])).toEqual({ X: 'a' });
    expect(unify([V('X'), V('X')], ['a', 'b'])).toBeNull();
  });
});
