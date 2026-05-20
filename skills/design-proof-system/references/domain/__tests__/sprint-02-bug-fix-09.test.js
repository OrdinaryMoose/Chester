import { describe, it, expect } from 'vitest';
import { createDomainBridge } from '../domain-bridge.js';
import { ELEMENT_CATEGORIES, CONSENT_SOURCES } from '../tags.js';

// D11 contract spans two files. Baseline assertions (AC-11.1, AC-11.2, AC-11.3) live
// in sprint-02-bug-fix-07.test.js. This file holds the sprint-02-bug-fix-09 refinement:
// exempt-category coverage (AC-11.4, AC-11.5).

async function makeRealBridge() {
  const { Engine } = await import('../../engine/Engine.js');
  const counters = new Map();
  const idAllocator = {
    next: (shape) => {
      const n = (counters.get(shape) ?? 0) + 1;
      counters.set(shape, n);
      return `${shape}_${n}`;
    },
    seed: (map) => { counters.clear(); for (const [k, v] of Object.entries(map ?? {})) counters.set(k, v); },
    highWater: (shape) => counters.get(shape) ?? 0,
  };
  const clock = { now: () => 1700000000 };
  const consentVerification = { verify: () => true };
  const persistenceRepo = { saveState: () => {} };
  return createDomainBridge({ engine: new Engine(), clock, idAllocator, consentVerification, persistenceRepo });
}

const designerConsent = Object.freeze({ source: CONSENT_SOURCES.DESIGNER });

describe('sprint-02-bug-fix-09 — Vocabulary discipline refinement', () => {
  it('AC-11.4 Concern element with non-canonical case form is exempt from lint', async () => {
    const bridge = await makeRealBridge();
    bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'industry', statement: 'E' },
      designerConsent,
    );
    const d = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.DEFINITION, canonical_name: 'Reachability', definition: 'the ability to reach a state' },
      designerConsent,
    );
    bridge.ratifyElement(
      { elementId: d.id, source: CONSENT_SOURCES.DESIGNER },
      designerConsent,
    );
    const c = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.CONCERN, label: 'uses reachability here' },
      designerConsent,
    );
    expect(() => bridge.ratifyElement(
      { elementId: c.id, source: CONSENT_SOURCES.DESIGNER },
      designerConsent,
    )).not.toThrow();
  });

  it('AC-11.5 Risk element with non-canonical case form is exempt from lint', async () => {
    const bridge = await makeRealBridge();
    const ev = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'industry', statement: 'E' },
      designerConsent,
    );
    const d = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.DEFINITION, canonical_name: 'Throughput', definition: 'units of work per unit time' },
      designerConsent,
    );
    bridge.ratifyElement(
      { elementId: d.id, source: CONSENT_SOURCES.DESIGNER },
      designerConsent,
    );
    const r = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.RISK, statement: 'throughput may degrade under load', basis: [ev.id] },
      designerConsent,
    );
    expect(() => bridge.ratifyElement(
      { elementId: r.id, source: CONSENT_SOURCES.DESIGNER },
      designerConsent,
    )).not.toThrow();
  });
});
