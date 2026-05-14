// facade-jsdoc.test.js
// Implements: AC-11.2
import { describe, it, expect } from 'vitest';
import { readSource } from './source-scanner.js';

describe('facade-jsdoc', () => {
  it('every facade method has JSDoc with @param, @returns, @throws', () => {
    const src = readSource('domain-bridge.js');
    // Spec AC-11.2: every facade method on domain-bridge.js — mutation-side AND
    // render/query-side — carries JSDoc with @param, @returns, @throws tags.
    const facades = [
      // Mutation surface
      'addElement', 'reviseElement', 'withdrawElement', 'ratifyElement',
      'addFriction', 'overrideFrictionDisposition',
      'addDefinition', 'reviseDefinition', 'ratifyDefinition', 'deprecateDefinition', 'queryOverlap',
      'presentClosingArgument', 'confirmClosureGo',
      // Render surface
      'renderStructuredProof', 'renderElementDeep', 'renderClosingArgument',
      'renderDatalogProjection', 'renderLaneSlice',
      // Query surface
      'getProofState', 'queryProof', 'runCounterfactual',
    ];
    for (const m of facades) {
      // For each facade, expect a JSDoc block in the preceding 400 chars containing @param, @returns, @throws.
      const idx = src.indexOf(`${m}:`);
      expect(idx).toBeGreaterThan(0); // facade must exist in source
      const preceding = src.slice(Math.max(0, idx - 400), idx);
      expect(preceding, `${m} missing @param JSDoc`).toMatch(/@param/);
      expect(preceding, `${m} missing @returns JSDoc`).toMatch(/@returns/);
      expect(preceding, `${m} missing @throws JSDoc`).toMatch(/@throws/);
    }
  });
});
