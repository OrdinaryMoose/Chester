// probe-concern-status-cleanup.mjs
// Verifies Task #6 fix: concern_status EDB/derived overlap resolved by retracting
// the 'draft' EDB row when a CONCERN is ratified. Each concern has exactly one
// concern_status row at any moment.

import { Engine } from '../../../../../skills/design-proof-system/references/engine/Engine.js';
import { createDomainBridge } from '../../../../../skills/design-proof-system/references/domain/domain-bridge.js';
import { CONSENT_SOURCES, ELEMENT_CATEGORIES }
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
const consent = { source: CONSENT_SOURCES.DESIGNER };
const show = (label, val) => console.log(`  ${label.padEnd(50)} ${JSON.stringify(val)}`);

// ---------------------------------------------------------------------------
console.log('--- Test 1: pre-ratify CONCERN has only ("draft") row ---');
{
  const { bridge } = freshSetup();
  const c = bridge.addElement(
    { idShape: ELEMENT_CATEGORIES.CONCERN, label: 'a concern', description: 'x' },
    consent
  );
  const status = bridge.queryProof({ pattern: ['concern_status', [c.id, { var: 'S' }]] });
  show('concern_status (pre-ratify)', status);
  const ok = status.length === 1 && status[0].S === 'draft';
  console.log(`  result: ${ok ? 'PASS' : 'FAIL'}`);
}

// ---------------------------------------------------------------------------
console.log('\n--- Test 2: post-ratify CONCERN has only ("ratified") row, no ("draft") ---');
{
  const { bridge } = freshSetup();
  // Need an evidence to satisfy ratify precondition
  bridge.addElement({ idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'design-decision', claim: 'x' }, consent);
  const c = bridge.addElement(
    { idShape: ELEMENT_CATEGORIES.CONCERN, label: 'a concern', description: 'x' },
    consent
  );
  bridge.ratifyElement({ elementId: c.id, source: CONSENT_SOURCES.DESIGNER, source_field: 'designer', claim: 'r' }, consent);
  const status = bridge.queryProof({ pattern: ['concern_status', [c.id, { var: 'S' }]] });
  show('concern_status (post-ratify)', status);
  const ok = status.length === 1 && status[0].S === 'ratified';
  console.log(`  expected exactly one ratified row, no draft — ${ok ? 'PASS' : 'FAIL'}`);
}

// ---------------------------------------------------------------------------
console.log('\n--- Test 3: ratifying a non-CONCERN element does not throw on missing concern_status ---');
{
  const { bridge } = freshSetup();
  bridge.addElement({ idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'design-decision', claim: 'precondition' }, consent);
  // Use a PROPOSITION — different category, no concern_status fact exists
  const ev2 = bridge.addElement({ idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'design-decision', claim: 'grounding' }, consent);
  const p = bridge.addElement({
    idShape: ELEMENT_CATEGORIES.PROPOSITION, statement: 'x',
    grounding: ev2.id, collapse_test: 't', inference_pattern: 'structural',
  }, consent);
  try {
    bridge.ratifyElement({ elementId: p.id, source: CONSENT_SOURCES.DESIGNER, source_field: 'designer', claim: 'r' }, consent);
    console.log('  PASS — no throw on non-CONCERN ratify');
  } catch (e) {
    console.log(`  FAIL: ${e.code} ${e.message}`);
  }
}

// ---------------------------------------------------------------------------
console.log('\n--- Test 4: renderDatalogProjection no longer includes obsolete draft row ---');
{
  const { bridge } = freshSetup();
  bridge.addElement({ idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'design-decision', claim: 'x' }, consent);
  const c1 = bridge.addElement(
    { idShape: ELEMENT_CATEGORIES.CONCERN, label: 'unratified', description: 'x' },
    consent
  );
  const c2 = bridge.addElement(
    { idShape: ELEMENT_CATEGORIES.CONCERN, label: 'ratified', description: 'x' },
    consent
  );
  bridge.ratifyElement({ elementId: c2.id, source: CONSENT_SOURCES.DESIGNER, source_field: 'designer', claim: 'r' }, consent);

  const dl = bridge.renderDatalogProjection({});
  const csRows = dl.facts.filter(([pred]) => pred === 'concern_status');
  show('projection concern_status rows', csRows);
  // Expect: c1 → 'draft' (still pre-ratify), c2 → 'ratified' (post-ratify, draft retracted)
  const c1Rows = csRows.filter(([, args]) => args[0] === c1.id);
  const c2Rows = csRows.filter(([, args]) => args[0] === c2.id);
  const ok =
    c1Rows.length === 1 && c1Rows[0][1][1] === 'draft' &&
    c2Rows.length === 1 && c2Rows[0][1][1] === 'ratified';
  console.log(`  c1 has only 'draft' (pre-ratify): ${c1Rows.length === 1 && c1Rows[0][1][1] === 'draft'}`);
  console.log(`  c2 has only 'ratified' (post-ratify): ${c2Rows.length === 1 && c2Rows[0][1][1] === 'ratified'}`);
  console.log(`  result: ${ok ? 'PASS' : 'FAIL'}`);
}

// ---------------------------------------------------------------------------
console.log('\n--- Test 5: ratified concern coverage still works (closure-policy non-regression) ---');
{
  const { bridge } = freshSetup();
  bridge.addElement({ idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'design-decision', claim: 'x' }, consent);
  const c = bridge.addElement(
    { idShape: ELEMENT_CATEGORIES.CONCERN, label: 'concern', description: 'x' },
    consent
  );
  const r = bridge.addElement({
    idShape: ELEMENT_CATEGORIES.RESOLUTION, statement: 'covers c', addresses: c.id,
  }, consent);
  bridge.ratifyElement({ elementId: c.id, source: CONSENT_SOURCES.DESIGNER, source_field: 'designer', claim: 'r' }, consent);
  bridge.ratifyElement({ elementId: r.id, source: CONSENT_SOURCES.DESIGNER, source_field: 'designer', claim: 'r' }, consent);

  const covered = bridge.queryProof({ pattern: ['covered', [{ var: 'C' }]] });
  const unaddressed = bridge.queryProof({ pattern: ['unaddressed_concern', [{ var: 'C' }]] });
  show('covered', covered);
  show('unaddressed_concern', unaddressed);
  const ok = covered.length === 1 && covered[0].C === c.id && unaddressed.length === 0;
  console.log(`  covered correctly fires; unaddressed_concern empty — ${ok ? 'PASS' : 'FAIL'}`);
}
