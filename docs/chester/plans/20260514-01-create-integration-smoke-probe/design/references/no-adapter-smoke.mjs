// no-adapter-smoke.mjs — proves createDomainBridge accepts a raw Engine directly,
// no manual port-adapter shim required. This is the end-user surface that sprint-03
// (and anyone wiring Domain to Engine) gets after the engine-port-adapter fix.

import { Engine } from '../../../../../../skills/design-large-task/engine/Engine.js';
import { createDomainBridge } from '../../../../../../skills/design-large-task/domain/domain-bridge.js';
import { CONSENT_SOURCES, ELEMENT_CATEGORIES } from '../../../../../../skills/design-large-task/domain/tags.js';

let counter = 0;
const bridge = createDomainBridge({
  engine: new Engine(),                         // <-- raw Engine, no adapter
  clock: { now: () => 1700000000 },
  idAllocator: { next: (s) => `${s}_${++counter}` },
  consentVerification: { verify: () => true },
  persistenceRepo: { saveState: () => {} },
});

const consent = { source: CONSENT_SOURCES.DESIGNER };
const ev = bridge.addElement({ idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 's', claim: 'c' }, consent);
const risk = bridge.addElement({ idShape: ELEMENT_CATEGORIES.RISK, statement: 'div-by-zero' }, consent);
const res = bridge.addElement({
  idShape: ELEMENT_CATEGORIES.RESOLUTION,
  statement: 'return Error sentinel',
  addresses: risk.id,
}, consent);
bridge.ratifyElement({ elementId: risk.id, source: 'designer', source_field: 'designer', claim: 'r' }, consent);
bridge.ratifyElement({ elementId: res.id, source: 'designer', source_field: 'designer', claim: 'r' }, consent);
bridge.presentClosingArgument({ source: 'designer', claim: 'c' }, consent);
bridge.confirmClosureGo({ source: 'designer', claim: 'c' }, consent);

console.log('OK — full pipeline ran against raw Engine without any adapter shim');
console.log('elements:', ev.id, risk.id, res.id);
console.log('closure_permitted:', bridge.queryProof({ pattern: ['closure_permitted', []] }).length, 'row(s)');
console.log('unaddressed_concern:', bridge.queryProof({ pattern: ['unaddressed_concern', [{ var: 'C' }]] }));
