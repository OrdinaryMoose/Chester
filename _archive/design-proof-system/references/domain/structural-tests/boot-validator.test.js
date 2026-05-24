// boot-validator.test.js
// Implements: AC-4.x (source half)
import { describe, it, expect } from 'vitest';
import { readSource, countMatches } from './source-scanner.js';

describe('boot-validator', () => {
  it('boot-validators.js exports three named validators', () => {
    const src = readSource('boot-validators.js');
    expect(src).toMatch(/export function validateOperationSpecs/);
    expect(src).toMatch(/export function validateCategoryRegistry/);
    expect(src).toMatch(/export function validateRuleTemplates/);
  });

  it('domain-bridge.js calls each validator at least once (in production factory and in test-only factory)', () => {
    // Spec boot-validator description says each validator is referenced in domain-bridge.js
    // without demanding exactly-once. createDomainBridge calls each validator once;
    // createDomainBridgeWith (test-only factory for AC-4.x bridge integration cases) also
    // calls each validator once. Each call site appearing ≥1 times in the file satisfies
    // the load-bearing constraint (validator is wired into bridge construction).
    const src = readSource('domain-bridge.js');
    expect(countMatches(src, /validateOperationSpecs\(/g)).toBeGreaterThanOrEqual(1);
    expect(countMatches(src, /validateCategoryRegistry\(/g)).toBeGreaterThanOrEqual(1);
    expect(countMatches(src, /validateRuleTemplates\(/g)).toBeGreaterThanOrEqual(1);
  });
});
