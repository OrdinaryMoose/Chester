// probe-counterfactual-tx-guard.mjs
// Verifies B+A fix: counterfactual surface refuses when an external transaction
// is open, with a descriptive error citing the JSDoc. Both surfaces (collapseTest
// directly and bridge.runCounterfactual) inherit the guard.

import { Engine } from '../../../../../skills/design-proof-system/references/engine/Engine.js';
import { createDomainBridge, createReadOnlyAudit }
  from '../../../../../skills/design-proof-system/references/domain/domain-bridge.js';
import { normalizeEngine }
  from '../../../../../skills/design-proof-system/references/domain/engine-port-adapter.js';
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
  // Build a small ratifiable proposition so the counterfactual has something to probe.
  const ev = bridge.addElement(
    { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'design-decision', claim: 'x' },
    { source: CONSENT_SOURCES.DESIGNER }
  );
  const p = bridge.addElement({
    idShape: ELEMENT_CATEGORIES.PROPOSITION, statement: 'x',
    grounding: ev.id, collapse_test: 't', inference_pattern: INFERENCE_PATTERNS.STRUCTURAL,
  }, { source: CONSENT_SOURCES.DESIGNER });
  bridge.ratifyElement({ elementId: p.id, source: CONSENT_SOURCES.DESIGNER, source_field: 'designer', claim: 'r' }, { source: CONSENT_SOURCES.DESIGNER });
  return { engine, bridge, p };
}

// ---------------------------------------------------------------------------
console.log('--- Test 1: NO open tx — runCounterfactual succeeds (baseline) ---');
{
  const { bridge, p } = freshSetup();
  try {
    const r = bridge.runCounterfactual({ propId: p.id });
    console.log(`  succeeded: ${JSON.stringify(r)} — PASS`);
  } catch (e) {
    console.log(`  FAIL — should not throw: ${e.code} ${e.message}`);
  }
}

// ---------------------------------------------------------------------------
console.log('\n--- Test 2: OPEN tx — runCounterfactual throws COUNTERFACTUAL_REFUSED_DURING_TX ---');
{
  const { engine, bridge, p } = freshSetup();
  const tx = engine.begin();
  try {
    bridge.runCounterfactual({ propId: p.id });
    console.log('  FAIL — should have thrown');
  } catch (e) {
    const okCode = e.code === 'COUNTERFACTUAL_REFUSED_DURING_TX';
    const okOp = e.op === 'collapseTest';
    const citesJsdoc = /bridge\.runCounterfactual JSDoc|snapshot\/restore bracket/i.test(e.message);
    console.log(`  threw: ${e.code} (op=${e.op})`);
    console.log(`  message: ${e.message}`);
    console.log(`  code correct? ${okCode}, op set? ${okOp}, error cites JSDoc? ${citesJsdoc}`);
    console.log(`  result: ${okCode && okOp && citesJsdoc ? 'PASS' : 'FAIL'}`);
  }
  // Confirm the tx is still alive (refusal didn't perturb it)
  try {
    engine.rollback(tx);
    console.log(`  tx still rollable after refusal — PASS (tx preserved)`);
  } catch (e) {
    console.log(`  tx no longer rollable: ${e.code} ${e.message} — FAIL (refusal should not invalidate tx)`);
  }
}

// ---------------------------------------------------------------------------
console.log('\n--- Test 3: createReadOnlyAudit inherits the same guard ---');
{
  const { engine, bridge, p } = freshSetup();
  // The audit adapter needs the normalized engine
  const audit = createReadOnlyAudit(normalizeEngine(engine));

  // Baseline: works with no tx
  try {
    const r = audit.runCounterfactual({ propId: p.id });
    console.log(`  audit.runCounterfactual no-tx: ${JSON.stringify(r)} — PASS`);
  } catch (e) {
    console.log(`  FAIL — should not throw: ${e.code} ${e.message}`);
  }

  // With open tx: refusal
  const tx = engine.begin();
  try {
    audit.runCounterfactual({ propId: p.id });
    console.log('  FAIL — audit should have thrown with open tx');
  } catch (e) {
    const ok = e.code === 'COUNTERFACTUAL_REFUSED_DURING_TX';
    console.log(`  audit refused: ${e.code} — ${ok ? 'PASS' : 'FAIL'}`);
  }
  engine.rollback(tx);
}

// ---------------------------------------------------------------------------
console.log('\n--- Test 4: refusal fires at call site (cause), not at next tx op (effect) ---');
{
  const { engine, bridge, p } = freshSetup();
  const tx = engine.begin();
  let refusedAtCall = false;
  let txStillValidAfter = false;
  try {
    bridge.runCounterfactual({ propId: p.id });
  } catch (e) {
    refusedAtCall = (e.code === 'COUNTERFACTUAL_REFUSED_DURING_TX');
  }
  // If the call refused, the tx should be untouched and commit should succeed
  try {
    engine.commit(tx);
    txStillValidAfter = true;
  } catch (e) {
    txStillValidAfter = false;
  }
  console.log(`  refused at call site? ${refusedAtCall}`);
  console.log(`  tx still valid after? ${txStillValidAfter}`);
  console.log(`  result: ${refusedAtCall && txStillValidAfter ? 'PASS' : 'FAIL'}`);
}

// ---------------------------------------------------------------------------
console.log('\n--- Test 5: non-regression — stress simulation still passes ---');
{
  const { engine, bridge, p } = freshSetup();
  let allOk = true;
  for (let i = 0; i < 20; i++) {
    try {
      bridge.runCounterfactual({ propId: p.id });
    } catch (e) {
      console.log(`  iteration ${i} FAILED: ${e.code} ${e.message}`);
      allOk = false;
      break;
    }
  }
  console.log(`  20 sequential counterfactuals (no tx) — ${allOk ? 'PASS' : 'FAIL'}`);
}
