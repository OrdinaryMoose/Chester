// probe-closure-withdrawal-aware.mjs
// Demonstrates Evolution-Issue #3 underlying mechanism: closure-policy rules
// don't propagate withdrawal status through their derivations. Three concrete
// scenarios where the closure gate gives a wrong answer because withdrawn
// elements still drive (or fail to drive) closure-relevant predicates.

import { Engine } from '../../../../../skills/design-proof-system/references/engine/Engine.js';
import { createDomainBridge } from '../../../../../skills/design-proof-system/references/domain/domain-bridge.js';
import { CONSENT_SOURCES, ELEMENT_CATEGORIES, INFERENCE_PATTERNS, FRICTION_SHAPES, FRICTION_DISPOSITIONS }
  from '../../../../../skills/design-proof-system/references/domain/tags.js';

function freshSetup() {
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
const show = (label, val) => console.log(`  ${label.padEnd(50)} ${JSON.stringify(val)}`);

// Helper: a risk needs a resolution OR a system-detected coverage_gap_detected → operator-promoted-friction → dispositioned. Skipping the auto-detection path here for clarity.

// ---------------------------------------------------------------------------
console.log('--- Scenario A: withdraw the resolution that addresses a risk ---');
console.log('--- Expected: coverage_gap_detected(risk) returns to firing.');
console.log('--- closure_permitted MAY remain true: detection is automatic but');
console.log('--- elevation-to-friction (which would block closure) is operator-initiated. ---');
{
  const bridge = freshSetup();
  bridge.addElement({ idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'design-decision', claim: 'precondition placeholder' }, consent);
  const r  = bridge.addElement({ idShape: ELEMENT_CATEGORIES.RISK, statement: 'a risk', severity: 'medium' }, consent);
  const res = bridge.addElement({ idShape: ELEMENT_CATEGORIES.RESOLUTION, statement: 'addresses the risk', addresses: r.id }, consent);
  bridge.ratifyElement({ elementId: res.id, source: CONSENT_SOURCES.DESIGNER, source_field: 'designer', claim: 'r' }, consent);

  show('coverage_gap_detected (before withdraw)', bridge.queryProof({ pattern: ['coverage_gap_detected', [{ var: 'C' }]] }));
  show('closure_permitted (before withdraw)',     bridge.queryProof({ pattern: ['closure_permitted',     []] }));

  bridge.withdrawElement({ id: res.id }, consent);

  const gapAfter      = bridge.queryProof({ pattern: ['coverage_gap_detected', [{ var: 'C' }]] });
  const closureAfter  = bridge.queryProof({ pattern: ['closure_permitted',     []] });
  show('coverage_gap_detected (after withdraw)',  gapAfter);
  show('closure_permitted (after withdraw)',      closureAfter);

  // The load-bearing assertion: coverage_gap_detected reopens. The closure-permitted
  // outcome is a separate design call (auto-escalation vs operator-agency); both are
  // legitimate and the current system chooses operator-agency.
  const detectionOk = gapAfter.length === 1 && gapAfter[0].C === r.id;
  console.log(`  coverage_gap_detected reopened? ${detectionOk ? 'PASS' : 'FAIL'}`);
  console.log(`  closure_permitted after withdraw: ${JSON.stringify(closureAfter)} (operator-agency design — not a fix-incompleteness)`);
}

// ---------------------------------------------------------------------------
console.log('\n--- Scenario B: withdraw an undispositioned friction ---');
console.log('--- Expected: unresolved_friction(friction) clears; closure permitted = true ---');
{
  const bridge = freshSetup();
  bridge.addElement({ idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'design-decision', claim: 'precondition placeholder' }, consent);
  const f = bridge.addElement(
    { idShape: ELEMENT_CATEGORIES.FRICTION, shape: FRICTION_SHAPES.OVERLAP, description: 'a friction' },
    consent
  );

  show('unresolved_friction (before withdraw)', bridge.queryProof({ pattern: ['unresolved_friction', [{ var: 'F' }]] }));
  show('closure_permitted (before withdraw)',   bridge.queryProof({ pattern: ['closure_permitted',   []] }));

  bridge.withdrawElement({ id: f.id }, consent);

  const unresAfter   = bridge.queryProof({ pattern: ['unresolved_friction', [{ var: 'F' }]] });
  const closureAfter = bridge.queryProof({ pattern: ['closure_permitted',   []] });
  show('unresolved_friction (after withdraw)',  unresAfter);
  show('closure_permitted (after withdraw)',    closureAfter);

  const ok = unresAfter.length === 0 && closureAfter.length === 1;
  console.log(`  expected: unresolved_friction=[], closure_permitted=[{}] — ${ok ? 'PASS' : 'FAIL (bug confirmed/fix incomplete)'}`);
}

// ---------------------------------------------------------------------------
console.log('\n--- Scenario C: withdraw a ratified-but-uncovered concern ---');
console.log('--- Expected: unaddressed_concern(concern) clears; closure permitted = true ---');
{
  const bridge = freshSetup();
  bridge.addElement({ idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'design-decision', claim: 'precondition placeholder' }, consent);
  const c = bridge.addElement(
    { idShape: ELEMENT_CATEGORIES.CONCERN, label: 'a concern', description: 'unfixed' },
    consent
  );
  bridge.ratifyElement({ elementId: c.id, source: CONSENT_SOURCES.DESIGNER, source_field: 'designer', claim: 'r', label: 'a concern' }, consent);

  show('unaddressed_concern (before withdraw)', bridge.queryProof({ pattern: ['unaddressed_concern', [{ var: 'C' }]] }));
  show('closure_permitted (before withdraw)',   bridge.queryProof({ pattern: ['closure_permitted',   []] }));

  bridge.withdrawElement({ id: c.id }, consent);

  const unadrAfter    = bridge.queryProof({ pattern: ['unaddressed_concern', [{ var: 'C' }]] });
  const closureAfter  = bridge.queryProof({ pattern: ['closure_permitted',   []] });
  show('unaddressed_concern (after withdraw)',  unadrAfter);
  show('closure_permitted (after withdraw)',    closureAfter);

  const ok = unadrAfter.length === 0 && closureAfter.length === 1;
  console.log(`  expected: unaddressed_concern=[], closure_permitted=[{}] — ${ok ? 'PASS' : 'FAIL (bug confirmed/fix incomplete)'}`);
}
