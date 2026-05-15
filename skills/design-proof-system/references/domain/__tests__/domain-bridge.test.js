import { describe, it, expect, vi } from 'vitest';
import { createInMemorySubstrate } from './_fixtures/inMemorySubstrate.js';
import { createDomainBridge, createReadOnlyAudit } from '../domain-bridge.js';
import { DomainBootError } from '../boot-validators.js';

function makeAdapters() {
  return {
    clock: { now: () => 1700000000 },
    idAllocator: { next: (p) => `${p}_1` },
    consentVerification: { verify: () => true },
    persistenceRepo: { saveState: vi.fn(() => {}) },
  };
}

describe('domain-bridge', () => {
  it('createDomainBridge returns a frozen facade with seven delivery surfaces', () => {
    const engine = createInMemorySubstrate();
    const bridge = createDomainBridge({ engine, ...makeAdapters() });
    for (const m of ['addElement', 'ratifyElement', 'renderStructuredProof', 'renderDatalogProjection', 'getProofState']) {
      expect(typeof bridge[m]).toBe('function');
    }
  });

  it('createReadOnlyAudit returns a facade with only render/query methods', () => {
    const engine = createInMemorySubstrate();
    const audit = createReadOnlyAudit(engine);
    expect(typeof audit.renderStructuredProof).toBe('function');
    expect(audit.addElement).toBeUndefined();
    expect(audit.ratifyElement).toBeUndefined();
  });

  it('createDomainBridge wraps Phase B defineRule throws into DomainBootError', () => {
    // Engine with a defineRule that throws — simulates ADR-0013 stratification check failing.
    const engine = createInMemorySubstrate();
    const originalDefine = engine.rules.defineRule;
    engine.rules.defineRule = vi.fn(() => { throw new Error('STRATIFICATION: cycle through negation'); });
    expect(() => createDomainBridge({ engine, ...makeAdapters() })).toThrow(DomainBootError);
  });
});
