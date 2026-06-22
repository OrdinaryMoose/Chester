// probe-render-withdrawn.mjs
// Verifies Evolution-Issue #2 fix: render surfaces no longer show withdrawn
// elements as if active.
//
// Five tests:
//   1. renderStructuredProof excludes withdrawn evidence from Givens
//   2. renderStructuredProof excludes withdrawn propositions from Lemmas
//   3. renderStructuredProof excludes withdrawn resolutions from Theorems
//   4. getProofState filters withdrawn elements from inventories
//   5. renderElementDeep returns withdrawn:true flag (not null) for withdrawn elements
//   6. renderDatalogProjection STAYS COMPLETE (verification path must be faithful)

import { Engine } from '../../../../../skills/design-proof-system/references/engine/Engine.js';
import { createDomainBridge } from '../../../../../skills/design-proof-system/references/domain/domain-bridge.js';
import { CONSENT_SOURCES, ELEMENT_CATEGORIES, INFERENCE_PATTERNS }
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

// Build one fixture: 2 evidences, 2 propositions, 1 risk, 2 resolutions; ratify all;
// then withdraw 1 evidence, 1 proposition, 1 resolution. Each render path is checked
// against the surviving subset.
function buildFixture() {
  const bridge = freshSetup();
  const ev1 = bridge.addElement({ idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'design-decision', claim: 'live evidence #1' }, consent);
  const ev2 = bridge.addElement({ idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'design-decision', claim: 'evidence to withdraw' }, consent);
  const p1  = bridge.addElement({
    idShape: ELEMENT_CATEGORIES.PROPOSITION, statement: 'live proposition',
    grounding: ev1.id, collapse_test: 't', inference_pattern: INFERENCE_PATTERNS.STRUCTURAL,
  }, consent);
  const p2  = bridge.addElement({
    idShape: ELEMENT_CATEGORIES.PROPOSITION, statement: 'proposition to withdraw',
    grounding: ev1.id, collapse_test: 't', inference_pattern: INFERENCE_PATTERNS.STRUCTURAL,
  }, consent);
  const r1  = bridge.addElement({ idShape: ELEMENT_CATEGORIES.RISK, statement: 'risk', severity: 'medium' }, consent);
  const res1 = bridge.addElement({ idShape: ELEMENT_CATEGORIES.RESOLUTION, statement: 'live resolution', addresses: r1.id }, consent);
  const res2 = bridge.addElement({ idShape: ELEMENT_CATEGORIES.RESOLUTION, statement: 'resolution to withdraw', addresses: r1.id }, consent);

  for (const el of [p1, p2, res1, res2]) {
    bridge.ratifyElement({ elementId: el.id, source: CONSENT_SOURCES.DESIGNER, source_field: 'designer', claim: 'r' }, consent);
  }

  bridge.withdrawElement({ id: ev2.id }, consent);
  bridge.withdrawElement({ id: p2.id  }, consent);
  bridge.withdrawElement({ id: res2.id }, consent);

  return { bridge, live: { ev1, p1, res1 }, withdrawn: { ev2, p2, res2 } };
}

const show = (label, val) => console.log(`  ${label.padEnd(46)} ${JSON.stringify(val)}`);

// ---------------------------------------------------------------------------
console.log('--- Test 1: renderStructuredProof excludes withdrawn elements from all sections ---');
{
  const { bridge, live, withdrawn } = buildFixture();
  const md = bridge.renderStructuredProof({});
  console.log('--- rendered output ---');
  console.log(md);
  console.log('--- end ---');

  const mentions = (id) => md.includes(id);
  const t1a = mentions(live.ev1.id) && !mentions(withdrawn.ev2.id);
  const t1b = mentions(live.p1.id)  && !mentions(withdrawn.p2.id);
  const t1c = mentions(live.res1.id) && !mentions(withdrawn.res2.id);
  console.log(`  evidence:    live=${live.ev1.id} present=${mentions(live.ev1.id)}, withdrawn=${withdrawn.ev2.id} absent=${!mentions(withdrawn.ev2.id)} — ${t1a ? 'PASS' : 'FAIL'}`);
  console.log(`  proposition: live=${live.p1.id} present=${mentions(live.p1.id)}, withdrawn=${withdrawn.p2.id} absent=${!mentions(withdrawn.p2.id)} — ${t1b ? 'PASS' : 'FAIL'}`);
  console.log(`  resolution:  live=${live.res1.id} present=${mentions(live.res1.id)}, withdrawn=${withdrawn.res2.id} absent=${!mentions(withdrawn.res2.id)} — ${t1c ? 'PASS' : 'FAIL'}`);
}

// ---------------------------------------------------------------------------
console.log('\n--- Test 2: getProofState filters withdrawn elements from inventories ---');
{
  const { bridge, live, withdrawn } = buildFixture();
  const state = bridge.getProofState({});
  show('evidence ids',     state.evidence.map(e => e.I));
  show('proposition ids',  state.propositions.map(p => p.I));
  show('resolution ids',   state.resolutions.map(r => r.I));
  const ok =
    state.evidence.every(e => e.I !== withdrawn.ev2.id) &&
    state.propositions.every(p => p.I !== withdrawn.p2.id) &&
    state.resolutions.every(r => r.I !== withdrawn.res2.id) &&
    state.evidence.some(e => e.I === live.ev1.id) &&
    state.propositions.some(p => p.I === live.p1.id) &&
    state.resolutions.some(r => r.I === live.res1.id);
  console.log(`  result: ${ok ? 'PASS' : 'FAIL'}`);
}

// ---------------------------------------------------------------------------
console.log('\n--- Test 3: renderElementDeep returns withdrawn:true flag (not null) ---');
{
  const { bridge, live, withdrawn } = buildFixture();
  const liveDeep      = bridge.renderElementDeep({ id: live.p1.id });
  const withdrawnDeep = bridge.renderElementDeep({ id: withdrawn.p2.id });
  const missingDeep   = bridge.renderElementDeep({ id: 'no-such-id' });

  show('live element',      liveDeep);
  show('withdrawn element', withdrawnDeep);
  show('missing element',   missingDeep);

  const ok =
    liveDeep && liveDeep.withdrawn === false &&
    withdrawnDeep && withdrawnDeep.withdrawn === true &&
    missingDeep === null;
  console.log(`  expected: live.withdrawn=false, withdrawn.withdrawn=true, missing=null — ${ok ? 'PASS' : 'FAIL'}`);
}

// ---------------------------------------------------------------------------
console.log('\n--- Test 4: renderDatalogProjection STAYS COMPLETE (must include withdrawn) ---');
{
  const { bridge, withdrawn } = buildFixture();
  const dl = bridge.renderDatalogProjection({});
  // proposition_decl for the withdrawn id should still be in the projection
  const withdrawnDecl = dl.facts.filter(([pred, args]) => pred === 'proposition_decl' && args[0] === withdrawn.p2.id);
  show(`proposition_decl(${withdrawn.p2.id})`, withdrawnDecl);
  const ok = withdrawnDecl.length === 1;
  console.log(`  expected 1 row (verification path is faithful) — ${ok ? 'PASS' : 'FAIL'}`);
}
