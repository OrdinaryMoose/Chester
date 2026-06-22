// probe-ungrounded-proposition.mjs
// Verifies Adversarial-Finding #2 fix: ungrounded_proposition_rule now fires when
// a proposition's only grounding evidence is withdrawn.
//
// Workaround: bridge.withdrawElement still has the SHAPE_INVALID bug
// (Adversarial Finding #3, not yet fixed). Pass filler {source, claim} fields so
// verifyArgsShape's EVIDENCE-schema check passes; the WITHDRAW translator only
// consumes args.id.

import { Engine } from '../../../../../skills/design-proof-system/references/engine/Engine.js';
import { createDomainBridge } from '../../../../../skills/design-proof-system/references/domain/domain-bridge.js';
import { detectFrictions } from '../../../../../skills/design-proof-system/references/domain/friction-policy.js';
import { normalizeEngine } from '../../../../../skills/design-proof-system/references/domain/engine-port-adapter.js';
import { CONSENT_SOURCES, ELEMENT_CATEGORIES, INFERENCE_PATTERNS }
  from '../../../../../skills/design-proof-system/references/domain/tags.js';

function freshSetup() {
  const engine = new Engine();
  let counter = 0;
  const bridge = createDomainBridge({
    engine,
    clock: { now: () => 1700000000 },
    idAllocator: { next: (s) => `${s}_${++counter}` },
    consentVerification: { verify: () => true },
    persistenceRepo: { saveState: () => {} },
  });
  const portBundled = normalizeEngine(engine);
  const readPorts = { query: portBundled.query, explain: portBundled.explain };
  return { bridge, readPorts };
}

const consent = { source: CONSENT_SOURCES.DESIGNER };
const show = (label, val) => console.log(`  ${label.padEnd(50)} ${JSON.stringify(val)}`);

// ---------------------------------------------------------------------------
console.log('--- Test 1: bridge boots with effective_grounding_rule registered ---');
const { bridge, readPorts } = freshSetup();
console.log('  PASS — no DomainBootError\n');

// ---------------------------------------------------------------------------
console.log('--- Test 2: baseline — grounded proposition is NOT flagged ---');
const ev1 = bridge.addElement({
  idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'design-decision',
  claim: 'Live evidential grounding for the proposition.',
}, consent);
const prop1 = bridge.addElement({
  idShape: ELEMENT_CATEGORIES.PROPOSITION,
  statement: 'Proposition that should remain grounded.',
  grounding: ev1.id,
  collapse_test: 'If the grounding evidence vanishes, this loses support.',
  inference_pattern: INFERENCE_PATTERNS.GROUNDS_IMPLY_CONCLUSION,
}, consent);

show('grounding(P, E)',           bridge.queryProof({ pattern: ['grounding', [{ var: 'P' }, { var: 'E' }]] }));
show('effective_grounding(P)',    bridge.queryProof({ pattern: ['effective_grounding', [{ var: 'P' }]] }));
show('ungrounded_proposition(P)', bridge.queryProof({ pattern: ['ungrounded_proposition', [{ var: 'P' }]] }));
console.log('  expected: grounding=1, effective_grounding=1, ungrounded_proposition=[]\n');

// ---------------------------------------------------------------------------
console.log('--- Test 3: withdraw evidence; proposition becomes ungrounded ---');
bridge.withdrawElement({ id: ev1.id, source: 'designer', claim: 'withdrawal' }, consent);

show('withdrew(E)',                                bridge.queryProof({ pattern: ['withdrew', [{ var: 'E' }]] }));
show('grounding(P, E) — still in EDB',             bridge.queryProof({ pattern: ['grounding', [{ var: 'P' }, { var: 'E' }]] }));
show('effective_grounding(P) — should be []',      bridge.queryProof({ pattern: ['effective_grounding', [{ var: 'P' }]] }));
const detected = bridge.queryProof({ pattern: ['ungrounded_proposition', [{ var: 'P' }]] });
show('ungrounded_proposition(P) — should be [P1]', detected);
const t3 = detected.length === 1 && detected[0].P === prop1.id;
console.log(`  detected proposition matches prop1.id (${prop1.id})?`, t3 ? 'YES — PASS' : 'NO — FAIL\n');
console.log();

// ---------------------------------------------------------------------------
console.log('--- Test 4: independently-grounded proposition is unaffected ---');
const ev2 = bridge.addElement({
  idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'design-decision',
  claim: 'A second, independent live evidence.',
}, consent);
const prop2 = bridge.addElement({
  idShape: ELEMENT_CATEGORIES.PROPOSITION,
  statement: 'Proposition with its own grounding.',
  grounding: ev2.id,
  collapse_test: 'Independent grounding, independent fate.',
  inference_pattern: INFERENCE_PATTERNS.STRUCTURAL,
}, consent);

const after = bridge.queryProof({ pattern: ['ungrounded_proposition', [{ var: 'P' }]] });
show('ungrounded_proposition(P)', after);
const t4 = after.length === 1 && after[0].P === prop1.id;
console.log(`  expected only prop1 (${prop1.id}); prop2 (${prop2.id}) stays grounded`);
console.log('  result:', t4 ? 'PASS' : 'FAIL\n');

// ---------------------------------------------------------------------------
console.log('--- Test 5: detectFrictions helper surfaces it as a typed UNGROUNDED finding ---');
const findings = detectFrictions(readPorts);
const ungrounded = findings.filter(f => f.shape === 'ungrounded');
show('detectFrictions ungrounded findings', ungrounded);
const t5 = ungrounded.length === 1 && ungrounded[0].args[0] === prop1.id;
console.log('  result:', t5 ? 'PASS' : 'FAIL\n');

// ---------------------------------------------------------------------------
console.log('--- Summary ---');
console.log('  Test 3:', t3 ? 'PASS' : 'FAIL', '(withdrawal triggers ungrounded detection)');
console.log('  Test 4:', t4 ? 'PASS' : 'FAIL', '(unaffected props stay grounded)');
console.log('  Test 5:', t5 ? 'PASS' : 'FAIL', '(helper aggregation)');
console.log('  Overall:', (t3 && t4 && t5) ? 'PASS' : 'FAIL');
