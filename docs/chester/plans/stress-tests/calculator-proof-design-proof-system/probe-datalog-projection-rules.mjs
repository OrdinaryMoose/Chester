// probe-datalog-projection-rules.mjs
// Verifies Evolution-Issue #5 fix: renderDatalogProjection now actually projects
// rules (not just facts), in a tuple-format shape that a second engine can
// directly defineRule() against — fulfilling the verification-path contract.
//
// Five tests:
//   1. Empty bridge — projection has zero facts AND zero rules
//   2. Just-booted bridge — boot installed friction-policy + closure-policy rules
//   3. Each projected rule has {ruleId, headAtom, bodyAtoms, metadata} shape
//   4. Per-element rule template fires on addElement for approval-gated category;
//      its rule appears in the projection
//   5. Replay test: a SECOND engine can ingest the projection and produce the same
//      derived facts (the load-bearing verification-path payoff)

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
const consent = { source: CONSENT_SOURCES.DESIGNER };

// ---------------------------------------------------------------------------
console.log('--- Test 1: empty bridge has zero facts; rules.length matches boot count ---');
{
  const { bridge } = freshSetup();
  const dl = bridge.renderDatalogProjection({});
  console.log(`  facts.length = ${dl.facts.length} (expected 0)`);
  console.log(`  rules.length = ${dl.rules.length} (expected > 0 — boot installed closure-policy + friction-policy rules + 4 anchor templates)`);
  const ok = dl.facts.length === 0 && dl.rules.length > 0;
  console.log(`  result: ${ok ? 'PASS' : 'FAIL'}`);
}

// ---------------------------------------------------------------------------
console.log('\n--- Test 2: each projected rule has the tuple-format shape defineRule consumes ---');
{
  const { bridge } = freshSetup();
  const dl = bridge.renderDatalogProjection({});
  const sample = dl.rules[0];
  console.log(`  sample rule (first installed):`);
  console.log(`    ruleId:    ${JSON.stringify(sample.ruleId)}`);
  console.log(`    headAtom:  ${JSON.stringify(sample.headAtom)}`);
  console.log(`    bodyAtoms: ${JSON.stringify(sample.bodyAtoms)}`);
  console.log(`    metadata:  ${JSON.stringify(sample.metadata)}`);
  const allShaped = dl.rules.every(r =>
    typeof r.ruleId === 'string' &&
    Array.isArray(r.headAtom) && r.headAtom.length === 2 &&
    Array.isArray(r.bodyAtoms) &&
    r.metadata && typeof r.metadata === 'object'
  );
  console.log(`  all ${dl.rules.length} rules well-shaped? ${allShaped ? 'PASS' : 'FAIL'}`);
}

// ---------------------------------------------------------------------------
console.log('\n--- Test 3: per-element rule appears after addElement(PROPOSITION) ---');
{
  const { bridge } = freshSetup();
  const baseline = bridge.renderDatalogProjection({}).rules.length;
  const ev = bridge.addElement({ idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'design-decision', claim: 'x' }, consent);
  const p  = bridge.addElement({
    idShape: ELEMENT_CATEGORIES.PROPOSITION, statement: 'x',
    grounding: ev.id, collapse_test: 't', inference_pattern: INFERENCE_PATTERNS.STRUCTURAL,
  }, consent);
  const dl = bridge.renderDatalogProjection({});
  const expectedNew = `${p.id}_approved_implies_proposition`;
  const found = dl.rules.find(r => r.ruleId === expectedNew);
  console.log(`  baseline rules: ${baseline}`);
  console.log(`  after add:      ${dl.rules.length}`);
  console.log(`  expected new rule: ${expectedNew}`);
  console.log(`  found?            ${!!found}`);
  if (found) console.log(`  body uses approved literal? ${JSON.stringify(found.bodyAtoms).includes('approved')}`);
  console.log(`  result: ${found && dl.rules.length === baseline + 1 ? 'PASS' : 'FAIL'}`);
}

// ---------------------------------------------------------------------------
console.log('\n--- Test 4: REPLAY — a second engine ingesting the projection produces the same derived facts ---');
{
  // Build a small proof in engine #1
  const { engine: engine1, bridge: bridge1 } = freshSetup();
  const ev = bridge1.addElement({ idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'design-decision', claim: 'x' }, consent);
  const p  = bridge1.addElement({
    idShape: ELEMENT_CATEGORIES.PROPOSITION, statement: 'x',
    grounding: ev.id, collapse_test: 't', inference_pattern: INFERENCE_PATTERNS.STRUCTURAL,
  }, consent);
  bridge1.ratifyElement({ elementId: p.id, source: CONSENT_SOURCES.DESIGNER, source_field: 'designer', claim: 'r' }, consent);

  const dl1 = bridge1.renderDatalogProjection({});
  const derived1 = bridge1.queryProof({ pattern: ['proposition', [{ var: 'I' }, { var: 'S' }]] });
  console.log(`  engine #1 derived proposition: ${JSON.stringify(derived1)}`);

  // Replay into a fresh engine (no bridge — direct API)
  const engine2 = new Engine();
  for (const r of dl1.rules) engine2.defineRule(r.ruleId, r.headAtom, r.bodyAtoms, r.metadata);
  for (const [pred, args] of dl1.facts) engine2.assertFact(pred, args);
  engine2.derive();
  const derived2 = engine2.query(['proposition', [{ var: 'I' }, { var: 'S' }]]);
  console.log(`  engine #2 derived proposition: ${JSON.stringify(derived2)}`);

  const ok = JSON.stringify(derived1) === JSON.stringify(derived2);
  console.log(`  identical derivations? ${ok ? 'PASS' : 'FAIL'}`);
}

// ---------------------------------------------------------------------------
console.log('\n--- Test 5: rule count grows monotonically with each approval-gated add ---');
{
  const { bridge } = freshSetup();
  const counts = [bridge.renderDatalogProjection({}).rules.length];

  bridge.addElement({ idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'design-decision', claim: 'x' }, consent);
  counts.push(bridge.renderDatalogProjection({}).rules.length); // EVIDENCE — no per-element rule

  bridge.addDefinition({ term: 'X', definition: 'x' }, consent);
  counts.push(bridge.renderDatalogProjection({}).rules.length); // DEFINITION — +1 per-element

  bridge.addDefinition({ term: 'Y', definition: 'y' }, consent);
  counts.push(bridge.renderDatalogProjection({}).rules.length); // +1

  console.log(`  rule counts: ${JSON.stringify(counts)}`);
  // Expected progression: [N, N, N+1, N+2]
  const ok = counts[0] === counts[1] && counts[2] === counts[1] + 1 && counts[3] === counts[2] + 1;
  console.log(`  expected stable on EVIDENCE add, +1 on each DEFINITION — ${ok ? 'PASS' : 'FAIL'}`);
}
