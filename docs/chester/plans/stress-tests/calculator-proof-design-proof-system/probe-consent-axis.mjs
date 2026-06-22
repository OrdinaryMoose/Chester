// probe-consent-axis.mjs
// Verifies Finding #3 fix: per-category authority lookup wired into runOperation.
// Five tests cover the matrix of {category × consent.source} for ADD.

import { Engine } from '../../../../../skills/design-proof-system/references/engine/Engine.js';
import { createDomainBridge } from '../../../../../skills/design-proof-system/references/domain/domain-bridge.js';
import {
  CONSENT_SOURCES, ELEMENT_CATEGORIES, FRICTION_SHAPES,
} from '../../../../../skills/design-proof-system/references/domain/tags.js';

function freshBridge() {
  const engine = new Engine();
  let counter = 0;
  return createDomainBridge({
    engine,
    clock: { now: () => 1700000000 },
    idAllocator: { next: (s) => `${s}_${++counter}` },
    consentVerification: { verify: () => true },
    persistenceRepo: { saveState: () => {} },
  });
}

function probe(label, fn) {
  try {
    const r = fn();
    console.log(`  PASS ${label} =>`, JSON.stringify(r));
  } catch (e) {
    console.log(`  THROW ${label} =>`, e.code || 'NoCode', '-', e.message);
  }
}

console.log('--- Test 1: FRICTION + SYSTEM consent (was Finding #3 failure) ---');
{
  const bridge = freshBridge();
  probe('addElement(FRICTION, SYSTEM)', () =>
    bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.FRICTION, shape: FRICTION_SHAPES.OVERLAP, description: 'system-detected overlap' },
      { source: CONSENT_SOURCES.SYSTEM },
    )
  );
}

console.log('\n--- Test 2: FRICTION + DESIGNER consent (should still work) ---');
{
  const bridge = freshBridge();
  probe('addElement(FRICTION, DESIGNER)', () =>
    bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.FRICTION, shape: FRICTION_SHAPES.COVERAGE_GAP, description: 'designer-flagged gap' },
      { source: CONSENT_SOURCES.DESIGNER },
    )
  );
}

console.log('\n--- Test 3: EVIDENCE + SYSTEM consent (must STILL be rejected) ---');
{
  const bridge = freshBridge();
  probe('addElement(EVIDENCE, SYSTEM)', () =>
    bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'design-decision', claim: 'x' },
      { source: CONSENT_SOURCES.SYSTEM },
    )
  );
}

console.log('\n--- Test 4: EVIDENCE + DESIGNER consent (should still work) ---');
{
  const bridge = freshBridge();
  probe('addElement(EVIDENCE, DESIGNER)', () =>
    bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'design-decision', claim: 'x' },
      { source: CONSENT_SOURCES.DESIGNER },
    )
  );
}

console.log('\n--- Test 5: FRICTION + DESIGN_PARTNER consent (not in allowlist — must reject) ---');
{
  const bridge = freshBridge();
  probe('addElement(FRICTION, DESIGN_PARTNER)', () =>
    bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.FRICTION, shape: FRICTION_SHAPES.OVERLAP, description: 'wrong-source attempt' },
      { source: CONSENT_SOURCES.DESIGN_PARTNER },
    )
  );
}

console.log('\n--- Test 6: presentClosingArgument under SYSTEM consent (no per-action authority — must use spec.consentCategory=DESIGNER) ---');
{
  const bridge = freshBridge();
  probe('presentClosingArgument(SYSTEM)', () =>
    bridge.presentClosingArgument(
      { source: 'system', claim: 'x' },
      { source: CONSENT_SOURCES.SYSTEM },
    )
  );
}

console.log('\nExpected outcomes:');
console.log('  Test 1: PASS (was failing pre-fix)');
console.log('  Test 2: PASS');
console.log('  Test 3: THROW CONSENT_INVALID');
console.log('  Test 4: PASS');
console.log('  Test 5: THROW CONSENT_INVALID');
console.log('  Test 6: THROW CONSENT_INVALID');
