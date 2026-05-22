// calculator-failure-simulation.mjs — deliberately leaves an unaddressed risk
// to verify the closure gate fires (CLOSURE_NOT_PERMITTED with reasons).

import { Engine } from '../../../../../../skills/design-large-task/engine/Engine.js';
import { createDomainBridge } from '../../../../../../skills/design-large-task/domain/domain-bridge.js';
import { CONSENT_SOURCES, ELEMENT_CATEGORIES, INFERENCE_PATTERNS } from '../../../../../../skills/design-large-task/domain/tags.js';
import { adaptEngineToPorts } from './port-adapter.mjs';

const findings = [];
let attemptIdx = 0;
function attempt(label, fn) {
  attemptIdx++;
  const tag = String(attemptIdx).padStart(2, '0');
  try {
    const result = fn();
    console.log(`[${tag}] OK   ${label}` + (result !== undefined ? ` => ${JSON.stringify(result).slice(0, 120)}` : ''));
    return result;
  } catch (e) {
    const message = (e && e.message) || String(e);
    const code = e && e.code;
    console.log(`[${tag}] FAIL ${label}\n         message: ${message}` + (code ? `\n         code:    ${code}` : ''));
    findings.push({ attempt: tag, label, message, code });
    return null;
  }
}

const engine = new Engine();
const ports = adaptEngineToPorts(engine);
let counter = 0;
const idAllocator = { next: (s) => `${s}_${++counter}` };
const clock = { now: () => 1700000000 };
const consentVerification = { verify: () => true };
const persistenceRepo = { saveState: () => {} };

const bridge = createDomainBridge({ engine: ports, clock, idAllocator, consentVerification, persistenceRepo });
const consent = { source: CONSENT_SOURCES.DESIGNER };

console.log('===== Build calculator proof, but leave one risk unaddressed =====');

const ev1 = attempt('addElement (evidence)', () => bridge.addElement({
  idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'design', claim: 'Operands are numeric.',
}, consent));

const riskA = attempt('addElement (risk): division by zero', () => bridge.addElement({
  idShape: ELEMENT_CATEGORIES.RISK, statement: 'Division by zero produces undefined.',
}, consent));

const riskB = attempt('addElement (risk): UNADDRESSED — UI freeze on long calc', () => bridge.addElement({
  idShape: ELEMENT_CATEGORIES.RISK, statement: 'Long-running calculations could freeze the UI thread.',
}, consent));

// Only address riskA. riskB is left dangling — this should block closure.
const resA = attempt('addElement (resolution): addresses divByZero', () => bridge.addElement({
  idShape: ELEMENT_CATEGORIES.RESOLUTION,
  statement: 'Return "Error" sentinel and reset state.',
  addresses: riskA?.id,
}, consent));

attempt('ratify riskA', () => bridge.ratifyElement({ elementId: riskA.id, source: 'designer', source_field: 'designer', claim: 'r' }, consent));
attempt('ratify resA',  () => bridge.ratifyElement({ elementId: resA.id,  source: 'designer', source_field: 'designer', claim: 'r' }, consent));

const unaddressed = attempt('queryProof: unaddressed_concern (expect riskB)', () =>
  bridge.queryProof({ pattern: ['unaddressed_concern', [{ var: 'C' }]] }));
console.log(`         unaddressed concerns: ${JSON.stringify(unaddressed)}`);

const closurePermittedBefore = attempt('queryProof: closure_permitted (expect empty)', () =>
  bridge.queryProof({ pattern: ['closure_permitted', []] }));
console.log(`         closure_permitted rows: ${closurePermittedBefore?.length}`);

// Should throw CLOSURE_NOT_PERMITTED via closure-policy.triggerGate
console.log('\n===== Attempt presentClosingArgument with unaddressed risk =====');
attempt('presentClosingArgument (expect CLOSURE_NOT_PERMITTED)', () =>
  bridge.presentClosingArgument({ source: 'designer', claim: 'closure-attempt' }, consent));

console.log(`\nTotal attempts: ${attemptIdx}, Failures: ${findings.length}`);
if (findings.length) console.log(JSON.stringify(findings, null, 2));
