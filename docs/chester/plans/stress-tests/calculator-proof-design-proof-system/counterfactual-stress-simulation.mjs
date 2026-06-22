// counterfactual-stress-simulation.mjs
// Stress test option 1: counterfactual snapshot/restore discipline.
//
// runCounterfactual is supposed to be a probe — it mutates engine state inside
// a snapshot/restore bracket but the externally-observable state must be bit-
// equal before and after. Every prior simulation called it once, in passing.
// Here we exercise it heavily and assert tight equality.
//
// What's exercised that prior simulations didn't:
//   - Single-call bit-equality (snapshot/restore correctness)
//   - Repeated calls against multiple propositions in sequence
//   - Counterfactual that REVEALS gaps (stillCloses: false) vs preserves closure
//   - Cleanup discipline when the inner block would throw (probed via wrong propId)
//   - Rule-store stability across counterfactual brackets
//   - State drift across N=20 sequential counterfactuals
//   - Counterfactual in presence of withdrawn elements + supersession chains
//   - Counterfactual with an open transaction (does snapshot/restore include tx state?)
//
// Phases:
//   1. Bootstrap; build a coherent closing proof
//   2. Compute baseline fingerprint
//   3. Single counterfactual; check fingerprint identity
//   4. Counterfactual against EVERY ratified proposition; check identity each time
//   5. Counterfactual against a non-existent propId — graceful baseline
//   6. Repeated calls against same propId — drift across N=20
//   7. Counterfactual after withdrawal + revision (full state complexity)
//   8. Probe: snapshot/restore behavior with an open transaction
//   9. Findings dump

import { Engine } from '../../../../../skills/design-proof-system/references/engine/Engine.js';
import { createDomainBridge } from '../../../../../skills/design-proof-system/references/domain/domain-bridge.js';
import { CONSENT_SOURCES, ELEMENT_CATEGORIES, INFERENCE_PATTERNS, FRICTION_DISPOSITIONS, FRICTION_SHAPES }
  from '../../../../../skills/design-proof-system/references/domain/tags.js';

const findings = [];
let attemptIdx = 0;
function attempt(label, fn) {
  attemptIdx++;
  const tag = String(attemptIdx).padStart(2, '0');
  try {
    const r = fn();
    const tail = r !== undefined ? ` => ${JSON.stringify(r).slice(0, 120)}` : '';
    console.log(`[${tag}] OK   ${label}${tail}`);
    return r;
  } catch (e) {
    const message = (e && e.message) || String(e);
    const code = e && e.code;
    console.log(`[${tag}] FAIL ${label}\n         message: ${message}` + (code ? `\n         code:    ${code}` : ''));
    findings.push({ attempt: tag, label, message, code, stack: (e?.stack || '').split('\n').slice(0, 4).join('\n') });
    return null;
  }
}
const logHeader = (t) => console.log(`\n===== ${t} =====`);

// State fingerprint via the (now-faithful) renderDatalogProjection. Sort facts
// and rules by their JSON representation so the ordering doesn't perturb equality.
function fingerprint(bridge) {
  const dl = bridge.renderDatalogProjection({});
  const factsSorted = [...dl.facts].map(f => JSON.stringify(f)).sort();
  const rulesSorted = [...dl.rules].map(r => JSON.stringify(r)).sort();
  return JSON.stringify({ facts: factsSorted, rules: rulesSorted });
}
function fingerprintParts(bridge) {
  const dl = bridge.renderDatalogProjection({});
  return { factsCount: dl.facts.length, rulesCount: dl.rules.length };
}

// ---------------------------------------------------------------------------
// Phase 1: bootstrap; build a coherent closing proof
// ---------------------------------------------------------------------------
logHeader('Phase 1: bootstrap + build coherent proof');

const engine = new Engine();
let counter = 0;
const bridge = attempt('createDomainBridge', () =>
  createDomainBridge({
    engine,
    clock: { now: () => 1700000000 },
    idAllocator: { next: (s) => `${s}_${++counter}` },
    consentVerification: { verify: () => true },
    persistenceRepo: { saveState: () => {} },
  })
);
if (!bridge) { console.log('BOOT FAIL'); process.exit(1); }
const consent = { source: CONSENT_SOURCES.DESIGNER };

// Build a small but non-trivial proof: 2 evidences, 3 propositions (each grounded),
// 2 risks each addressed by a resolution, 1 concern covered by a resolution.
const ev1 = bridge.addElement({ idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'design-decision', claim: 'evidence one' }, consent);
const ev2 = bridge.addElement({ idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'user-research',   claim: 'evidence two' }, consent);
const p1  = bridge.addElement({ idShape: ELEMENT_CATEGORIES.PROPOSITION, statement: 'proposition one', grounding: ev1.id, collapse_test: 't', inference_pattern: INFERENCE_PATTERNS.STRUCTURAL }, consent);
const p2  = bridge.addElement({ idShape: ELEMENT_CATEGORIES.PROPOSITION, statement: 'proposition two', grounding: ev1.id, collapse_test: 't', inference_pattern: INFERENCE_PATTERNS.GROUNDS_IMPLY_CONCLUSION }, consent);
const p3  = bridge.addElement({ idShape: ELEMENT_CATEGORIES.PROPOSITION, statement: 'proposition three', grounding: ev2.id, collapse_test: 't', inference_pattern: INFERENCE_PATTERNS.STRUCTURAL }, consent);
const r1  = bridge.addElement({ idShape: ELEMENT_CATEGORIES.RISK, statement: 'risk one', severity: 'low' }, consent);
const r2  = bridge.addElement({ idShape: ELEMENT_CATEGORIES.RISK, statement: 'risk two', severity: 'low' }, consent);
const res1 = bridge.addElement({ idShape: ELEMENT_CATEGORIES.RESOLUTION, statement: 'resolves r1', addresses: r1.id }, consent);
const res2 = bridge.addElement({ idShape: ELEMENT_CATEGORIES.RESOLUTION, statement: 'resolves r2', addresses: r2.id }, consent);
const c1  = bridge.addElement({ idShape: ELEMENT_CATEGORIES.CONCERN, label: 'concern one', description: 'covered by res3' }, consent);
const res3 = bridge.addElement({ idShape: ELEMENT_CATEGORIES.RESOLUTION, statement: 'resolves c1', addresses: c1.id }, consent);

for (const el of [p1, p2, p3, res1, res2, c1, res3]) {
  bridge.ratifyElement({ elementId: el.id, source: CONSENT_SOURCES.DESIGNER, source_field: 'designer', claim: 'r' }, consent);
}

// Confirm the proof closes
const closurePermitted = bridge.queryProof({ pattern: ['closure_permitted', []] });
console.log(`closure_permitted at start: ${JSON.stringify(closurePermitted)}`);
console.log(`fingerprint parts at start: ${JSON.stringify(fingerprintParts(bridge))}`);
if (closurePermitted.length === 0) {
  console.log('WARNING: proof does not close at start; counterfactual results will all show stillCloses:false');
}

// ---------------------------------------------------------------------------
// Phase 2: compute baseline fingerprint
// ---------------------------------------------------------------------------
logHeader('Phase 2: baseline fingerprint');
const baseline = fingerprint(bridge);
console.log(`baseline length: ${baseline.length} chars`);

// ---------------------------------------------------------------------------
// Phase 3: single counterfactual + bit-equality check
// ---------------------------------------------------------------------------
logHeader('Phase 3: single counterfactual against p1');

const cfP1 = attempt(`runCounterfactual(${p1.id})`, () => bridge.runCounterfactual({ propId: p1.id }));
const fpAfterP1 = fingerprint(bridge);
const equalsBaseline_P1 = fpAfterP1 === baseline;
console.log(`fingerprint equals baseline? ${equalsBaseline_P1 ? 'YES (snapshot/restore is bit-equal)' : 'NO (DRIFT DETECTED)'}`);
if (!equalsBaseline_P1) {
  findings.push({ attempt: 'P3', label: 'snapshot/restore bit-equality after single counterfactual', baseline_len: baseline.length, after_len: fpAfterP1.length });
}

// ---------------------------------------------------------------------------
// Phase 4: counterfactual against EVERY ratified proposition; check identity each time
// ---------------------------------------------------------------------------
logHeader('Phase 4: counterfactual against every ratified proposition');

const propsToProbe = [p1, p2, p3];
for (const prop of propsToProbe) {
  const cf = attempt(`runCounterfactual(${prop.id})`, () => bridge.runCounterfactual({ propId: prop.id }));
  const fpAfter = fingerprint(bridge);
  const equal = fpAfter === baseline;
  console.log(`  result: stillCloses=${cf?.stillCloses}, reasons=${JSON.stringify(cf?.failureReasons)}; fingerprint match=${equal ? 'YES' : 'NO'}`);
  if (!equal) {
    findings.push({ phase: 'P4', propId: prop.id, drift: 'fingerprint mismatch after counterfactual' });
  }
}

// ---------------------------------------------------------------------------
// Phase 5: counterfactual against a NON-EXISTENT propId — graceful baseline
// ---------------------------------------------------------------------------
logHeader('Phase 5: counterfactual against non-existent propId');

const cfNoSuch = attempt(`runCounterfactual({propId: 'no_such_prop'})`, () =>
  bridge.runCounterfactual({ propId: 'no_such_prop' })
);
const fpNoSuch = fingerprint(bridge);
console.log(`fingerprint match? ${fpNoSuch === baseline ? 'YES' : 'NO'}`);

// ---------------------------------------------------------------------------
// Phase 6: repeated calls against same propId — drift across N=20
// ---------------------------------------------------------------------------
logHeader('Phase 6: 20 repeated counterfactuals on p1');

let allEqualP6 = true;
for (let i = 1; i <= 20; i++) {
  bridge.runCounterfactual({ propId: p1.id });
  const fpI = fingerprint(bridge);
  if (fpI !== baseline) {
    console.log(`  iteration ${i}: DRIFT (fingerprint differs from baseline)`);
    findings.push({ phase: 'P6', iteration: i, drift: true });
    allEqualP6 = false;
    break;
  }
}
if (allEqualP6) console.log(`  20/20 iterations: fingerprint identical to baseline`);

// ---------------------------------------------------------------------------
// Phase 7: counterfactual after withdrawal + revision (full state complexity)
// ---------------------------------------------------------------------------
logHeader('Phase 7: state mutations + counterfactual');

bridge.withdrawElement({ id: p1.id }, consent);
const afterWithdraw = fingerprint(bridge);
console.log(`  after withdraw, fingerprint differs from baseline? ${afterWithdraw !== baseline ? 'YES (expected)' : 'NO (suspicious)'}`);

const p4 = bridge.reviseElement({
  idShape: ELEMENT_CATEGORIES.PROPOSITION, supersedes: p2.id,
  statement: 'proposition two revised', grounding: ev1.id, collapse_test: 't',
  inference_pattern: INFERENCE_PATTERNS.STRUCTURAL,
}, consent);
bridge.ratifyElement({ elementId: p4.id, source: CONSENT_SOURCES.DESIGNER, source_field: 'designer', claim: 'r' }, consent);
const newBaseline = fingerprint(bridge);

attempt(`runCounterfactual(${p4.id}) after revise+ratify`, () =>
  bridge.runCounterfactual({ propId: p4.id })
);
const fpAfterCFp4 = fingerprint(bridge);
console.log(`  fingerprint match against new-baseline? ${fpAfterCFp4 === newBaseline ? 'YES' : 'NO'}`);
if (fpAfterCFp4 !== newBaseline) {
  findings.push({ phase: 'P7', drift: 'fingerprint mismatch after counterfactual on revised prop' });
}

// ---------------------------------------------------------------------------
// Phase 8: counterfactual with an OPEN transaction
// Post-B+A fix: runCounterfactual REFUSES at the call site rather than silently
// invalidating the tx. Verify the refusal fires, engine state is untouched, and
// the tx remains valid for the operator to commit or rollback explicitly.
// ---------------------------------------------------------------------------
logHeader('Phase 8: counterfactual with open transaction (refusal contract)');

try {
  const tx = engine.begin();
  console.log(`  opened external tx: ${String(tx)}`);
  const preFp = fingerprint(bridge);

  // Expect refusal — the call should throw COUNTERFACTUAL_REFUSED_DURING_TX.
  let refused = false;
  let refusalCode = null;
  try {
    bridge.runCounterfactual({ propId: p3.id });
    console.log(`  UNEXPECTED — runCounterfactual succeeded despite open tx`);
    findings.push({ phase: 'P8', anomaly: 'counterfactual did not refuse with open tx' });
  } catch (e) {
    refused = true;
    refusalCode = e.code;
    console.log(`  refused at call site: ${e.code} (expected COUNTERFACTUAL_REFUSED_DURING_TX)`);
  }
  if (refused && refusalCode !== 'COUNTERFACTUAL_REFUSED_DURING_TX') {
    findings.push({ phase: 'P8', anomaly: `refused with unexpected code: ${refusalCode}` });
  }

  // Engine state should be untouched (no snapshot/restore was entered).
  const postFp = fingerprint(bridge);
  console.log(`  engine state untouched? ${postFp === preFp ? 'YES (expected — refusal happened before snapshot)' : 'NO'}`);
  if (postFp !== preFp) {
    findings.push({ phase: 'P8', drift: 'engine state changed by a call that supposedly refused' });
  }

  // Tx should still be valid — rollback should succeed cleanly.
  try {
    engine.rollback(tx);
    console.log(`  tx still valid after refusal (rollback succeeded — PASS)`);
  } catch (e) {
    console.log(`  tx invalidated despite refusal: ${e.code} ${e.message}`);
    findings.push({ phase: 'P8', anomaly: 'tx was invalidated even though counterfactual refused' });
  }
} catch (e) {
  console.log(`  tx probe threw outer: ${e.code || ''} ${e.message}`);
  findings.push({ phase: 'P8', error: e.message, code: e.code });
}

// ---------------------------------------------------------------------------
// Phase 9: rule-store stability check via fingerprint counts
// ---------------------------------------------------------------------------
logHeader('Phase 9: rule-store stability across many counterfactuals');

const beforeCounts = fingerprintParts(bridge);
for (let i = 0; i < 50; i++) {
  bridge.runCounterfactual({ propId: p3.id });
}
const afterCounts = fingerprintParts(bridge);
console.log(`  before: ${JSON.stringify(beforeCounts)}`);
console.log(`  after 50 counterfactuals: ${JSON.stringify(afterCounts)}`);
const stable = beforeCounts.factsCount === afterCounts.factsCount && beforeCounts.rulesCount === afterCounts.rulesCount;
console.log(`  rule + fact counts stable? ${stable ? 'YES' : 'NO (LEAK)'}`);
if (!stable) {
  findings.push({ phase: 'P9', drift: 'rule or fact count grew across 50 counterfactuals', before: beforeCounts, after: afterCounts });
}

// ---------------------------------------------------------------------------
// Findings dump
// ---------------------------------------------------------------------------
logHeader('Findings summary');
console.log(`Total attempts:    ${attemptIdx}`);
console.log(`Attempt failures:  ${findings.filter(f => f.attempt).length}`);
console.log(`Drift findings:    ${findings.filter(f => f.phase || f.drift).length}`);
console.log(`Total findings:    ${findings.length}`);
if (findings.length > 0) {
  console.log('\n--- findings (JSON) ---');
  console.log(JSON.stringify(findings, null, 2));
}
