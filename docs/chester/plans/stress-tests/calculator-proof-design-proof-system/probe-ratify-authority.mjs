// probe-ratify-authority.mjs
// Verifies Task #4 fix: bridge.ratifyElement now consults the per-category
// authority allowlist for the target element. PROPOSITION/RESOLUTION/DEFINITION/
// CONCERN allow both DESIGNER and DESIGN_PARTNER; EVIDENCE/RULE/PERMISSION/RISK/
// FRICTION allow only DESIGNER.

import { Engine } from '../../../../../skills/design-proof-system/references/engine/Engine.js';
import { createDomainBridge } from '../../../../../skills/design-proof-system/references/domain/domain-bridge.js';
import { CONSENT_SOURCES, ELEMENT_CATEGORIES, INFERENCE_PATTERNS }
  from '../../../../../skills/design-proof-system/references/domain/tags.js';

function freshSetup() {
  const engine = new Engine();
  let counter = 0;
  return {
    engine,
    bridge: createDomainBridge({
      engine,
      clock: { now: () => 1700000000 },
      idAllocator: { next: (s) => `${s}_${++counter}` },
      consentVerification: { verify: () => true },
      persistenceRepo: { saveState: () => {} },
    }),
  };
}
const designer       = { source: CONSENT_SOURCES.DESIGNER };
const designPartner  = { source: CONSENT_SOURCES.DESIGN_PARTNER };
const system         = { source: CONSENT_SOURCES.SYSTEM };
const show = (label, val) => console.log(`  ${label.padEnd(50)} ${JSON.stringify(val)}`);

// ---------------------------------------------------------------------------
console.log('--- Test 1: ratify PROPOSITION as DESIGN_PARTNER (was blocked, now allowed) ---');
{
  const { bridge } = freshSetup();
  const ev = bridge.addElement(
    { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'design-decision', claim: 'x' },
    designer
  );
  const p = bridge.addElement({
    idShape: ELEMENT_CATEGORIES.PROPOSITION, statement: 'x',
    grounding: ev.id, collapse_test: 't', inference_pattern: INFERENCE_PATTERNS.STRUCTURAL,
  }, designer);
  try {
    bridge.ratifyElement({ elementId: p.id, source: CONSENT_SOURCES.DESIGN_PARTNER, source_field: 'design_partner', claim: 'r' }, designPartner);
    console.log(`  PASS — ratifyElement accepted DESIGN_PARTNER consent`);
    const approved = bridge.queryProof({ pattern: ['approved', [{ var: 'I' }, { var: 'S' }, { var: 'T' }]] });
    show('approved', approved);
  } catch (e) {
    console.log(`  FAIL — should have succeeded: ${e.code} ${e.message}`);
  }
}

// ---------------------------------------------------------------------------
console.log('\n--- Test 2: ratify EVIDENCE as DESIGN_PARTNER (must STILL be rejected — schema disallows) ---');
{
  const { bridge } = freshSetup();
  const ev = bridge.addElement(
    { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'design-decision', claim: 'x' },
    designer
  );
  try {
    bridge.ratifyElement({ elementId: ev.id, source: CONSENT_SOURCES.DESIGN_PARTNER, source_field: 'design_partner', claim: 'r' }, designPartner);
    console.log(`  FAIL — should have rejected DESIGN_PARTNER on EVIDENCE`);
  } catch (e) {
    const ok = e.code === 'CONSENT_INVALID';
    console.log(`  ${ok ? 'PASS' : 'FAIL'} — rejected: ${e.code} ${e.message}`);
  }
}

// ---------------------------------------------------------------------------
console.log('\n--- Test 3: end-to-end two_yes_complete via PUBLIC API (no engine.assertFact hack needed) ---');
{
  const { bridge } = freshSetup();
  const ev = bridge.addElement(
    { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'design-decision', claim: 'x' },
    designer
  );
  const p = bridge.addElement({
    idShape: ELEMENT_CATEGORIES.PROPOSITION, statement: 'x',
    grounding: ev.id, collapse_test: 't', inference_pattern: INFERENCE_PATTERNS.STRUCTURAL,
  }, designer);

  bridge.ratifyElement({ elementId: p.id, source: CONSENT_SOURCES.DESIGNER, source_field: 'designer', claim: 'r' }, designer);
  let complete = bridge.queryProof({ pattern: ['two_yes_complete', [{ var: 'I' }]] });
  show('two_yes_complete after DESIGNER ratify', complete);

  bridge.ratifyElement({ elementId: p.id, source: CONSENT_SOURCES.DESIGN_PARTNER, source_field: 'design_partner', claim: 'r' }, designPartner);
  complete = bridge.queryProof({ pattern: ['two_yes_complete', [{ var: 'I' }]] });
  show('two_yes_complete after DESIGN_PARTNER ratify', complete);

  const ok = complete.length === 1 && complete[0].I === p.id;
  console.log(`  result: ${ok ? 'PASS — full multi-author closure path reachable through public API' : 'FAIL'}`);
}

// ---------------------------------------------------------------------------
console.log('\n--- Test 4: ratify with non-existent elementId — falls back to spec.consentCategory ---');
{
  const { bridge } = freshSetup();
  const ev = bridge.addElement(
    { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'design-decision', claim: 'x' },
    designer
  );
  // Ratify a non-existent id — _resolveElementCategory returns null, so we fall back
  // to spec.consentCategory (DESIGNER). DESIGN_PARTNER attempt should be rejected.
  try {
    bridge.ratifyElement({ elementId: 'no_such_id_999', source: CONSENT_SOURCES.DESIGN_PARTNER, source_field: 'design_partner', claim: 'r' }, designPartner);
    console.log(`  FAIL — should have rejected (fallback to DESIGNER-only)`);
  } catch (e) {
    const ok = e.code === 'CONSENT_INVALID';
    console.log(`  ${ok ? 'PASS' : 'FAIL'} — rejected (fallback path): ${e.code}`);
  }
}

// ---------------------------------------------------------------------------
console.log('\n--- Test 5: ratify FRICTION as DESIGNER — works (FRICTION.authority.ratify=[DESIGNER]) ---');
{
  const { bridge } = freshSetup();
  const f = bridge.addElement(
    { idShape: ELEMENT_CATEGORIES.FRICTION, shape: 'overlap', description: 'x' },
    designer
  );
  // Need an evidence to satisfy ratify precondition
  bridge.addElement({ idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'design-decision', claim: 'x' }, designer);
  try {
    bridge.ratifyElement({ elementId: f.id, source: CONSENT_SOURCES.DESIGNER, source_field: 'designer', claim: 'r' }, designer);
    console.log(`  PASS`);
  } catch (e) {
    console.log(`  FAIL: ${e.code} ${e.message}`);
  }
}
