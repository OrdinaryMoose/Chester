// evolution-rate-limiter-simulation.mjs
// Stress test option 2: revision and supersession evolution. Drive a long-running
// design session through revise/withdraw/re-ratify cycles to surface dark code
// in the lifecycle module, the REVISE operation, and the supersession machinery.
//
// Domain: an API rate-limiter design that evolves over time:
//   v1: token-bucket, global limit
//   v2: token-bucket, per-user buckets         (revision of v1)
//   v3: sliding-window log                     (replaces v1+v2 entirely — withdrawal)
//
// What's exercised that prior simulations didn't:
//   - bridge.reviseElement (never previously called)
//   - lifecycle round-counter advancement (every clearsTwoYes verb)
//   - superseded / two_yes predicates (in EDB list but no emitter — confirm dark)
//   - per-element rule template behavior on revision (does instantiateTemplate fire?)
//   - whether renderStructuredProof shows latest or carries history
//   - rule-store growth across many operations
//
// Phases:
//   1. Bootstrap + baseline state inspection (round=0?, two_yes empty?, rule count)
//   2. v1 design: definitions, evidence, propositions, risks, resolutions
//   3. Ratify v1
//   4. Probe REVISE shape-check (mirror the WITHDRAW probe from before)
//   5. Revise the central proposition to v2; inspect what happened
//   6. Try to ratify the revised proposition; check whether it derives
//   7. Withdraw v1+v2; add v3 from scratch; inspect superseded/withdrew state
//   8. Lifecycle inspection at each stage (round, rule count, fact count)
//   9. Final render — does it show v1, v2, v3, or all three?
//  10. Findings dump

import { Engine } from '../../../../../skills/design-proof-system/references/engine/Engine.js';
import { createDomainBridge } from '../../../../../skills/design-proof-system/references/domain/domain-bridge.js';
import {
  CONSENT_SOURCES, ELEMENT_CATEGORIES, INFERENCE_PATTERNS,
} from '../../../../../skills/design-proof-system/references/domain/tags.js';

const findings = [];
let attemptIdx = 0;
function attempt(label, fn) {
  attemptIdx++;
  const tag = String(attemptIdx).padStart(2, '0');
  try {
    const r = fn();
    const tail = r !== undefined ? ` => ${JSON.stringify(r).slice(0, 140)}` : '';
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

// ---------------------------------------------------------------------------
// Phase 1: bootstrap
// ---------------------------------------------------------------------------
logHeader('Phase 1: bootstrap + baseline');

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

// State-inspection helpers
function snapshotState(label) {
  const round  = bridge.queryProof({ pattern: ['round',     [{ var: 'N' }]] });
  const phase  = bridge.queryProof({ pattern: ['phase',     [{ var: 'P' }]] });
  const twoYes = bridge.queryProof({ pattern: ['two_yes',   [{ var: 'I' }, { var: 'S' }]] });
  const sup    = bridge.queryProof({ pattern: ['superseded',[{ var: 'A' }, { var: 'B' }]] });
  const wd     = bridge.queryProof({ pattern: ['withdrew',  [{ var: 'I' }]] });
  // Approximate "rule count" by counting derived-rule heads referenced in datalog projection.
  const dl = bridge.renderDatalogProjection({});
  console.log(`  [${label}]`);
  console.log(`    round:        ${JSON.stringify(round)}`);
  console.log(`    phase:        ${JSON.stringify(phase)}`);
  console.log(`    two_yes:      ${JSON.stringify(twoYes)}`);
  console.log(`    superseded:   ${JSON.stringify(sup)}`);
  console.log(`    withdrew:     ${JSON.stringify(wd)}`);
  console.log(`    facts.length: ${dl.facts?.length}`);
  console.log(`    rules.length: ${dl.rules?.length ?? 'n/a'}`);
}

snapshotState('immediately after boot — expected round 0/1, two_yes/superseded/withdrew empty');

// ---------------------------------------------------------------------------
// Phase 2: v1 design — token-bucket, global
// ---------------------------------------------------------------------------
logHeader('Phase 2: v1 design — token-bucket, global');

const defRateLimiter = attempt('addDefinition: RateLimiter', () =>
  bridge.addDefinition({
    term: 'RateLimiter',
    definition: 'A component that constrains the number of API requests a client may issue per time window.',
  }, consent)
);
const defTokenBucket = attempt('addDefinition: TokenBucket', () =>
  bridge.addDefinition({
    term: 'TokenBucket',
    definition: 'An algorithm that issues tokens at a constant rate; each request consumes one token, and excess requests are rejected.',
  }, consent)
);

const evTraffic = attempt('addElement (EVIDENCE): traffic patterns', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'design-decision',
    claim: 'Peak traffic shows bursts up to 10x average for sub-second windows; sustained over-rate is rare.',
  }, consent)
);

const propV1 = attempt('addElement (PROPOSITION v1): global token-bucket', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.PROPOSITION,
    statement: 'A single global token-bucket at 1000 req/sec capped at 10000 burst protects the API.',
    grounding: evTraffic.id,
    collapse_test: 'If the bucket is too small, legitimate bursts are rejected; if too large, abuse goes undetected.',
    inference_pattern: INFERENCE_PATTERNS.GROUNDS_IMPLY_CONCLUSION,
  }, consent)
);

const riskFlood = attempt('addElement (RISK): single-user flood', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.RISK,
    statement: 'A single misbehaving client can consume the entire global bucket and starve all other users.',
    severity: 'high',
  }, consent)
);

const resV1 = attempt('addElement (RESOLUTION v1): per-IP secondary cap', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.RESOLUTION,
    statement: 'In addition to the global bucket, enforce a per-client-IP cap of 100 req/sec.',
    addresses: riskFlood.id,
  }, consent)
);

snapshotState('after v1 adds — round should have advanced ~6 times');

// ---------------------------------------------------------------------------
// Phase 3: ratify v1
// ---------------------------------------------------------------------------
logHeader('Phase 3: ratify v1');

for (const el of [defRateLimiter, defTokenBucket, propV1, resV1]) {
  attempt(`ratifyElement: ${el.id}`, () =>
    bridge.ratifyElement({ elementId: el.id, source: CONSENT_SOURCES.DESIGNER, source_field: 'designer', claim: 'r' }, consent)
  );
}

// Confirm v1 propositions/resolutions derive
attempt('queryProof: proposition (derived)', () =>
  bridge.queryProof({ pattern: ['proposition', [{ var: 'I' }, { var: 'S' }]] })
);
attempt('queryProof: resolution (derived)', () =>
  bridge.queryProof({ pattern: ['resolution', [{ var: 'I' }, { var: 'S' }]] })
);

snapshotState('after v1 ratify');

// ---------------------------------------------------------------------------
// Phase 4: probe REVISE shape-check (mirror the WITHDRAW probe pattern)
// ---------------------------------------------------------------------------
logHeader('Phase 4: probe REVISE shape-check');

// Probe A: minimal args (just an id reference) — like the WITHDRAW pre-fix expectation.
// We expect this to fail because REVISE *should* require the new field values.
attempt('reviseElement({id: propV1.id}) — expect SHAPE_INVALID without idShape', () =>
  bridge.reviseElement({ id: propV1.id }, consent)
);

// Probe B: pass {idShape: PROPOSITION, supersedes: <prior id>, ...new field values}.
// The supersedes field is the contract enforced after the Issue-#1 fix — REVISE
// records the new→old link so the supersession chain is queryable downstream.
const propV2Result = attempt('reviseElement(PROPOSITION, supersedes: propV1.id) — produces a NEW id linked via superseded', () =>
  bridge.reviseElement({
    idShape: ELEMENT_CATEGORIES.PROPOSITION,
    supersedes: propV1.id,
    statement: 'A token-bucket per user-id with global ceiling of 100 buckets active concurrently.',
    grounding: evTraffic.id,
    collapse_test: 'Per-user buckets prevent single-user starvation while preserving aggregate cap.',
    inference_pattern: INFERENCE_PATTERNS.GROUNDS_IMPLY_CONCLUSION,
  }, consent)
);

console.log(`\n  REVISE result: ${JSON.stringify(propV2Result)}`);
console.log(`  v1 proposition id: ${propV1.id}`);
console.log(`  v2 (revised) id:   ${propV2Result?.id}`);
console.log(`  Same id?           ${propV1.id === propV2Result?.id ? 'YES' : 'NO — REVISE generated a fresh id'}`);

// ---------------------------------------------------------------------------
// Phase 5: inspect what REVISE actually did
// ---------------------------------------------------------------------------
logHeader('Phase 5: inspect REVISE state');

attempt('queryProof: ALL proposition_decl rows (do v1 AND v2 coexist?)', () =>
  bridge.queryProof({ pattern: ['proposition_decl', [{ var: 'I' }, { var: 'S' }, { var: 'P' }]] })
);
attempt('queryProof: superseded predicate (was anything emitted?)', () =>
  bridge.queryProof({ pattern: ['superseded', [{ var: 'A' }, { var: 'B' }]] })
);
attempt('queryProof: grounding rows (does v2 have its own grounding fact?)', () =>
  bridge.queryProof({ pattern: ['grounding', [{ var: 'P' }, { var: 'E' }]] })
);

// Did the rule template fire for v2's id? The per-element rule's id format is
// `${elementId}_approved_implies_proposition`. We can't grep rules directly via
// the bridge, but we can check whether ratifying v2 ever produces a derived
// `proposition(v2_id, _)` row.

// ---------------------------------------------------------------------------
// Phase 6: ratify v2 and check whether it derives
// ---------------------------------------------------------------------------
logHeader('Phase 6: ratify v2 and check derivation');

if (propV2Result?.id) {
  attempt(`ratifyElement: ${propV2Result.id} (the revised proposition)`, () =>
    bridge.ratifyElement({ elementId: propV2Result.id, source: CONSENT_SOURCES.DESIGNER, source_field: 'designer', claim: 'r' }, consent)
  );

  attempt('queryProof: proposition (derived) — does v2 appear?', () =>
    bridge.queryProof({ pattern: ['proposition', [{ var: 'I' }, { var: 'S' }]] })
  );
  attempt(`queryProof: approved(${propV2Result.id}, _, _)`, () =>
    bridge.queryProof({ pattern: ['approved', [propV2Result.id, { var: 'S' }, { var: 'T' }]] })
  );

  // The crucial question: did the rule fire?
  console.log('\n  KEY QUESTION: if v2 is in proposition_decl AND approved, does proposition(v2_id, ...) derive?');
  console.log('  Answer: see "proposition (derived)" above — should contain v2_id only if instantiateTemplate fired on REVISE.');
}

snapshotState('after revising + ratifying v2');

// ---------------------------------------------------------------------------
// Phase 7: v3 — withdraw v1 and v2, add sliding-window from scratch
// ---------------------------------------------------------------------------
logHeader('Phase 7: v3 — withdraw v1 and v2, replace with sliding-window');

attempt(`withdrawElement: ${propV1.id} (v1)`, () =>
  bridge.withdrawElement({ id: propV1.id }, consent)
);
if (propV2Result?.id) {
  attempt(`withdrawElement: ${propV2Result.id} (v2)`, () =>
    bridge.withdrawElement({ id: propV2Result.id }, consent)
  );
}

const defSlidingWindow = attempt('addDefinition: SlidingWindow', () =>
  bridge.addDefinition({
    term: 'SlidingWindow',
    definition: 'An algorithm that counts requests over the trailing N seconds and rejects when count exceeds limit.',
  }, consent)
);

const propV3 = attempt('addElement (PROPOSITION v3): sliding-window', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.PROPOSITION,
    statement: 'A 60-second sliding-window log per user-id (max 6000 entries) with 100 req/sec ceiling.',
    grounding: evTraffic.id,
    collapse_test: 'Sliding-window gives per-user fairness AND smooth burst handling without bucket-state per user.',
    inference_pattern: INFERENCE_PATTERNS.GROUNDS_IMPLY_CONCLUSION,
  }, consent)
);

attempt(`ratifyElement: ${defSlidingWindow.id}`, () =>
  bridge.ratifyElement({ elementId: defSlidingWindow.id, source: CONSENT_SOURCES.DESIGNER, source_field: 'designer', claim: 'r' }, consent)
);
attempt(`ratifyElement: ${propV3.id}`, () =>
  bridge.ratifyElement({ elementId: propV3.id, source: CONSENT_SOURCES.DESIGNER, source_field: 'designer', claim: 'r' }, consent)
);

snapshotState('after withdraw v1+v2 and add+ratify v3');

// ---------------------------------------------------------------------------
// Phase 8: examine end state — what does the proof actually contain?
// ---------------------------------------------------------------------------
logHeader('Phase 8: end-state inventory');

attempt('queryProof: ALL proposition_decl', () =>
  bridge.queryProof({ pattern: ['proposition_decl', [{ var: 'I' }, { var: 'S' }, { var: 'P' }]] })
);
attempt('queryProof: derived proposition (only ratified+derivable)', () =>
  bridge.queryProof({ pattern: ['proposition', [{ var: 'I' }, { var: 'S' }]] })
);
attempt('queryProof: withdrew (which ids are marked withdrawn?)', () =>
  bridge.queryProof({ pattern: ['withdrew', [{ var: 'I' }]] })
);
attempt('queryProof: approved (which ids have approval?)', () =>
  bridge.queryProof({ pattern: ['approved', [{ var: 'I' }, { var: 'S' }, { var: 'T' }]] })
);

attempt('detectFrictions (any new ones from the evolution?)', () =>
  bridge.detectFrictions()
);

// ---------------------------------------------------------------------------
// Phase 9: render — does it show v3 only? Or all three? Or v1+v3?
// ---------------------------------------------------------------------------
logHeader('Phase 9: final render');

const finalRender = attempt('renderStructuredProof', () => bridge.renderStructuredProof({}));
if (typeof finalRender === 'string') {
  console.log('--- Rendered proof (first 1600 chars) ---');
  console.log(finalRender.slice(0, 1600));
  console.log('--- end render preview ---');
}

attempt('renderClosingArgument', () => bridge.renderClosingArgument({}));

// ---------------------------------------------------------------------------
// Findings dump
// ---------------------------------------------------------------------------
logHeader('Findings summary');
console.log(`Total attempts: ${attemptIdx}`);
console.log(`Failures:       ${findings.length}`);
if (findings.length > 0) {
  console.log('\n--- failures (JSON) ---');
  console.log(JSON.stringify(findings, null, 2));
}
