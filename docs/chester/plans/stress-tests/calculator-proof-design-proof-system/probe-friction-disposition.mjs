// probe-friction-disposition.mjs
// Narrows finding #2 from the main simulation: overrideFrictionDisposition fails
// because runOperation shape-checks against FRICTION element schema instead of a
// disposition-specific schema. Test: pass shape/description fillers and see if
// the operation succeeds.

import { Engine } from '../../../../../skills/design-proof-system/references/engine/Engine.js';
import { createDomainBridge } from '../../../../../skills/design-proof-system/references/domain/domain-bridge.js';
import {
  CONSENT_SOURCES, ELEMENT_CATEGORIES, FRICTION_SHAPES, FRICTION_DISPOSITIONS,
} from '../../../../../skills/design-proof-system/references/domain/tags.js';

const engine = new Engine();
let counter = 0;
const bridge = createDomainBridge({
  engine,
  clock: { now: () => 1700000000 },
  idAllocator: { next: (s) => `${s}_${++counter}` },
  consentVerification: { verify: () => true },
  persistenceRepo: { saveState: () => {} },
});
const consent = { source: CONSENT_SOURCES.DESIGNER };

// Add a friction
const f = bridge.addElement({
  idShape: ELEMENT_CATEGORIES.FRICTION,
  shape: FRICTION_SHAPES.COVERAGE_GAP,
  description: 'test friction for disposition probe',
}, consent);
console.log('Created friction:', f.id);

// Test A: overrideFrictionDisposition without shape/description — expect SHAPE_INVALID
console.log('\n--- Test A: minimal args (frictionId + disposition only) ---');
try {
  const r = bridge.overrideFrictionDisposition({
    frictionId: f.id,
    disposition: FRICTION_DISPOSITIONS.ADDRESS,
  }, consent);
  console.log('Test A SUCCESS:', JSON.stringify(r));
} catch (e) {
  console.log('Test A FAIL:', e.code, '-', e.message);
}

// Test B: include filler shape + description — expect success (proves the shape-check
// is gating an otherwise-functional operation)
console.log('\n--- Test B: with filler shape + description ---');
try {
  const r = bridge.overrideFrictionDisposition({
    frictionId: f.id,
    disposition: FRICTION_DISPOSITIONS.ADDRESS,
    shape: FRICTION_SHAPES.COVERAGE_GAP,         // filler — should be irrelevant
    description: 'filler to satisfy shape-check', // filler — should be irrelevant
  }, consent);
  console.log('Test B SUCCESS:', JSON.stringify(r));
} catch (e) {
  console.log('Test B FAIL:', e.code, '-', e.message);
}

// Test C: confirm the disposition fact actually got asserted
console.log('\n--- Test C: did friction_disposition fact land? ---');
const dispRows = bridge.queryProof({ pattern: ['friction_disposition', [{ var: 'F' }, { var: 'D' }]] });
console.log('friction_disposition rows:', JSON.stringify(dispRows));

// Test D: with disposition set to ADDRESS, does unresolved_friction now return [] ?
console.log('\n--- Test D: did unresolved_friction clear? ---');
const unresolvedRows = bridge.queryProof({ pattern: ['unresolved_friction', [{ var: 'F' }]] });
console.log('unresolved_friction rows:', JSON.stringify(unresolvedRows));

// Test E: inspect the underlying friction fact — has its 4th arg ('disposition'
// position) been updated, or is the fact still there with disposition='unset'?
console.log('\n--- Test E: raw friction fact ---');
const rawRows = bridge.queryProof({ pattern: ['friction', [{ var: 'I' }, { var: 'Sh' }, { var: 'D' }, { var: 'Di' }]] });
console.log('friction rows:', JSON.stringify(rawRows));
