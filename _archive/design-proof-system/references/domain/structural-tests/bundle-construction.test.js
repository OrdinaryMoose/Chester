// bundle-construction.test.js
// Implements: AC-10.1
import { describe, it, expect } from 'vitest';
import { readSource, countMatches } from './source-scanner.js';

describe('bundle-construction', () => {
  const NON_BRIDGE = ['tags.js', 'schema.js', 'translation.js', 'authority.js', 'lifecycle.js', 'closure-policy.js', 'friction-policy.js', 'restructuring.js', 'render.js', 'counterfactual.js', 'mutations.js', 'boot-validators.js'];

  it('readPorts/writePorts/probePorts/fullPorts construction appears in domain-bridge.js and nowhere else', () => {
    // Spec AC-10.1: bundles are constructed only in domain-bridge.js. The bridge may legitimately
    // construct them more than once (e.g., production createDomainBridge + test-only createDomainBridgeWith
    // both construct port bundles). The "only in bridge file" rule is the load-bearing constraint.
    const bridgeSrc = readSource('domain-bridge.js');
    for (const name of ['readPorts', 'writePorts', 'probePorts', 'fullPorts']) {
      expect(countMatches(bridgeSrc, new RegExp(`const ${name} = Object\\.freeze`, 'g'))).toBeGreaterThanOrEqual(1);
    }
    for (const f of NON_BRIDGE) {
      const src = readSource(f);
      // Plan regex used `/gs` (dotall) which made `.*` span the entire file and false-matched
      // any non-bridge file containing the words "query" and "explain" anywhere (e.g., render.js
      // and mutations.js both reference ports.query.* and use Object.freeze on unrelated specs).
      // The load-bearing constraint per AC-10.1 is "no port-bundle CONSTRUCTION outside bridge"
      // — port bundles are constructed as one-line frozen objects like
      // `Object.freeze({ query, explain, ... })`. Dropping the `s` flag scopes the match to a
      // single line, which is the actual shape of bundle construction in domain-bridge.js.
      expect(countMatches(src, /Object\.freeze\(\{.*query.*explain.*\}/g)).toBe(0);
    }
  });
});
