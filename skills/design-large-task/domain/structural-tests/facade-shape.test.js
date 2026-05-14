// facade-shape.test.js
// Implements: AC-6.1 (grep half)
import { describe, it, expect } from 'vitest';
import { readSource } from './source-scanner.js';

describe('facade-shape', () => {
  it('each facade method body in domain-bridge.js is one expression', () => {
    const src = readSource('domain-bridge.js');
    // Each facade is of the form: methodName: (args, consent) => runOperation(...) or render.x(...) etc.
    const methodMatches = [...src.matchAll(/(\w+):\s*\((args[,)]\s*consent?)?\)\s*=>\s*([^,\n;}]+)[,\n}]/g)];
    expect(methodMatches.length).toBeGreaterThanOrEqual(7);
    for (const m of methodMatches) {
      // The body (m[3]) must not contain a semicolon (which would mean multiple statements).
      expect(m[3]).not.toMatch(/;/);
    }
  });
});
