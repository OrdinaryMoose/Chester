// probe-withdraw.mjs
// Verifies Adversarial-Finding #3 fix: bridge.withdrawElement now accepts the
// verb's actual arg shape ({id}) instead of demanding EVIDENCE element fields.
// Tests minimal-arg admission across multiple element categories, plus the
// non-regression check that filler-args calls (the previous workaround) still work.

import { Engine } from '../../../../../skills/design-proof-system/references/engine/Engine.js';
import { createDomainBridge } from '../../../../../skills/design-proof-system/references/domain/domain-bridge.js';
import { CONSENT_SOURCES, ELEMENT_CATEGORIES, INFERENCE_PATTERNS, FRICTION_SHAPES }
  from '../../../../../skills/design-proof-system/references/domain/tags.js';

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
const consent = { source: CONSENT_SOURCES.DESIGNER };
const sysConsent = { source: CONSENT_SOURCES.SYSTEM };

function probe(label, fn) {
  try {
    const r = fn();
    console.log(`  PASS ${label} =>`, JSON.stringify(r));
    return true;
  } catch (e) {
    console.log(`  THROW ${label} =>`, e.code || 'NoCode', '-', e.message);
    return false;
  }
}

console.log('--- Test 1: minimal {id} args succeed for EVIDENCE withdrawal ---');
{
  const bridge = freshBridge();
  const ev = bridge.addElement(
    { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'design-decision', claim: 'live evidence' },
    consent
  );
  probe(`withdrawElement({id:'${ev.id}'})`, () =>
    bridge.withdrawElement({ id: ev.id }, consent)
  );
  const w = bridge.queryProof({ pattern: ['withdrew', [{ var: 'E' }]] });
  console.log(`  withdrew(E) = ${JSON.stringify(w)} — should contain ${ev.id}`);
}

console.log('\n--- Test 2: minimal {id} args succeed for PROPOSITION withdrawal ---');
{
  const bridge = freshBridge();
  const ev = bridge.addElement(
    { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'design-decision', claim: 'x' },
    consent
  );
  const p = bridge.addElement({
    idShape: ELEMENT_CATEGORIES.PROPOSITION, statement: 'x', grounding: ev.id,
    collapse_test: 'x', inference_pattern: INFERENCE_PATTERNS.STRUCTURAL,
  }, consent);
  probe(`withdrawElement({id:'${p.id}'})`, () =>
    bridge.withdrawElement({ id: p.id }, consent)
  );
}

console.log('\n--- Test 3: minimal {id} args succeed for FRICTION withdrawal ---');
{
  const bridge = freshBridge();
  const f = bridge.addElement(
    { idShape: ELEMENT_CATEGORIES.FRICTION, shape: FRICTION_SHAPES.OVERLAP, description: 'x' },
    sysConsent  // exercises Calculator-Finding #3 fix path too
  );
  probe(`withdrawElement({id:'${f.id}'})`, () =>
    bridge.withdrawElement({ id: f.id }, consent)
  );
}

console.log('\n--- Test 4: filler-args call still works (back-compat for prior callers) ---');
{
  const bridge = freshBridge();
  const ev = bridge.addElement(
    { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'design-decision', claim: 'x' },
    consent
  );
  // The pre-fix workaround: pass irrelevant filler that also happened to satisfy
  // EVIDENCE shape. Since argShape only requires `id`, extra fields are ignored.
  probe(`withdrawElement({id, source, claim})`, () =>
    bridge.withdrawElement({ id: ev.id, source: 'designer', claim: 'withdrawal' }, consent)
  );
}

console.log('\n--- Test 5: missing id is still correctly rejected ---');
{
  const bridge = freshBridge();
  const ok = probe(`withdrawElement({}) — should THROW`, () =>
    bridge.withdrawElement({}, consent)
  );
  console.log(`  expected THROW; got ${ok ? 'PASS (regression!)' : 'THROW (correct)'}`);
}
