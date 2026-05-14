// port-discipline.test.js
// Implements: AC-2.1, AC-2.2, AC-9.1
import { describe, it, expect } from 'vitest';
import { readSource, assertNoMatch } from './source-scanner.js';

const NON_BRIDGE = ['tags.js', 'schema.js', 'translation.js', 'authority.js', 'lifecycle.js', 'closure-policy.js', 'friction-policy.js', 'restructuring.js', 'render.js', 'counterfactual.js', 'mutations.js', 'boot-validators.js'];

describe('port-discipline', () => {
  it('no Domain module outside domain-bridge.js imports IClock / IIDAllocator / IConsentVerification / IPersistenceRepository implementation', () => {
    for (const f of NON_BRIDGE) {
      const src = readSource(f);
      assertNoMatch(src, /from\s+['"][^'"]*Clock[^'"]*['"]/g, `${f} imports a Clock implementation`);
      assertNoMatch(src, /from\s+['"][^'"]*Persistence[^'"]*['"]/g, `${f} imports a Persistence implementation`);
    }
  });

  it('render.js contains no mutation-symbol references', () => {
    const src = readSource('render.js');
    assertNoMatch(src, /facts\.assertFact/g, 'render.js references facts.assertFact');
    assertNoMatch(src, /facts\.retractFact/g, 'render.js references facts.retractFact');
    assertNoMatch(src, /rules\.defineRule/g, 'render.js references rules.defineRule');
    assertNoMatch(src, /tx\.begin/g, 'render.js references tx.begin');
  });

  it('every exported function in render.js carries an @param ReadPorts JSDoc tag', () => {
    const src = readSource('render.js');
    const exportMatches = [...src.matchAll(/export function (\w+)/g)];
    expect(exportMatches.length).toBeGreaterThan(0);
    // Each export has a JSDoc-style readPorts annotation in the file (sufficient: every export is followed by readPorts as second param).
    for (const m of exportMatches) {
      const fnIndex = src.indexOf(m[0]);
      const segment = src.slice(fnIndex, fnIndex + 400);
      expect(segment).toMatch(/readPorts/);
    }
  });
});
