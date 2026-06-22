// probe-revise-shape-error.mjs
// Verifies Evolution-Issue #4 fix: REVISE without args.idShape now produces a
// clear, actionable SHAPE_INVALID error mentioning idShape — not the misleading
// EVIDENCE-shape error that the default fall-through produced.

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

// ---------------------------------------------------------------------------
console.log('--- Test 1: REVISE without idShape — error message mentions idShape, not "evidence" ---');
{
  const bridge = freshSetup();
  try {
    bridge.reviseElement({ id: 'proposition_X' }, consent);
    console.log('  FAIL — should have thrown');
  } catch (e) {
    console.log(`  THROW: ${e.code} - ${e.message}`);
    const ok = e.code === 'SHAPE_INVALID' && /idShape/i.test(e.message) && !/evidence/i.test(e.message);
    console.log(`  result: ${ok ? 'PASS (clear, actionable, no misleading EVIDENCE mention)' : 'FAIL'}`);
  }
}

// ---------------------------------------------------------------------------
console.log('\n--- Test 2: REVISE with idShape but missing supersedes — Issue #1 message still correct ---');
{
  const bridge = freshSetup();
  // Need an evidence to satisfy ratify preconditions later, but more importantly to satisfy
  // the per-category shape check for PROPOSITION revision:
  const ev = bridge.addElement({ idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'design-decision', claim: 'x' }, consent);
  try {
    bridge.reviseElement({
      idShape: ELEMENT_CATEGORIES.PROPOSITION, statement: 'x',
      grounding: ev.id, collapse_test: 't', inference_pattern: INFERENCE_PATTERNS.STRUCTURAL,
    }, consent);
    console.log('  FAIL — should have thrown');
  } catch (e) {
    console.log(`  THROW: ${e.code} - ${e.message}`);
    const ok = e.code === 'SHAPE_INVALID' && /supersedes/i.test(e.message);
    console.log(`  result: ${ok ? 'PASS' : 'FAIL'}`);
  }
}

// ---------------------------------------------------------------------------
console.log('\n--- Test 3: REVISE with idShape + per-category fields missing — per-category error fires ---');
{
  const bridge = freshSetup();
  try {
    bridge.reviseElement({
      idShape: ELEMENT_CATEGORIES.PROPOSITION, supersedes: 'proposition_X',
      // Deliberately missing statement, grounding, collapse_test, inference_pattern
    }, consent);
    console.log('  FAIL — should have thrown');
  } catch (e) {
    console.log(`  THROW: ${e.code} - ${e.message}`);
    // The per-category shape check should fire — message should mention one of
    // the missing PROPOSITION fields, not "idShape" or "supersedes"
    const ok = e.code === 'SHAPE_INVALID' && /proposition/i.test(e.message) && !/idShape/i.test(e.message);
    console.log(`  result: ${ok ? 'PASS (per-category shape-check fires correctly)' : 'FAIL'}`);
  }
}

// ---------------------------------------------------------------------------
console.log('\n--- Test 4: complete REVISE call still succeeds ---');
{
  const bridge = freshSetup();
  const ev = bridge.addElement({ idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'design-decision', claim: 'x' }, consent);
  const p1 = bridge.addElement({
    idShape: ELEMENT_CATEGORIES.PROPOSITION, statement: 'v1',
    grounding: ev.id, collapse_test: 't', inference_pattern: INFERENCE_PATTERNS.STRUCTURAL,
  }, consent);
  try {
    const p2 = bridge.reviseElement({
      idShape: ELEMENT_CATEGORIES.PROPOSITION, supersedes: p1.id,
      statement: 'v2', grounding: ev.id, collapse_test: 't',
      inference_pattern: INFERENCE_PATTERNS.STRUCTURAL,
    }, consent);
    console.log(`  REVISE succeeded with new id: ${p2.id}`);
    const sup = bridge.queryProof({ pattern: ['superseded', [{ var: 'A' }, { var: 'B' }]] });
    const ok = sup.length === 1 && sup[0].A === p2.id && sup[0].B === p1.id;
    console.log(`  superseded link present? ${ok ? 'PASS' : 'FAIL'}`);
  } catch (e) {
    console.log(`  FAIL — should have succeeded: ${e.code} - ${e.message}`);
  }
}
