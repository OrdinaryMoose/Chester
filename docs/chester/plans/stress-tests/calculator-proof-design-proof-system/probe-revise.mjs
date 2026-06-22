// probe-revise.mjs
// Verifies Evolution-Issue #1 fix: REVISE now requires args.supersedes, emits
// superseded(new, old), and installs the per-element rule template so the new
// element can derive after ratification.

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
const show = (label, val) => console.log(`  ${label.padEnd(46)} ${JSON.stringify(val)}`);

// ---------------------------------------------------------------------------
console.log('--- Test 1: REVISE without args.supersedes is rejected ---');
{
  const bridge = freshSetup();
  const ev = bridge.addElement(
    { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'design-decision', claim: 'x' },
    consent
  );
  const p = bridge.addElement({
    idShape: ELEMENT_CATEGORIES.PROPOSITION, statement: 'original',
    grounding: ev.id, collapse_test: 't', inference_pattern: INFERENCE_PATTERNS.STRUCTURAL,
  }, consent);

  try {
    bridge.reviseElement({
      idShape: ELEMENT_CATEGORIES.PROPOSITION, statement: 'revised',
      grounding: ev.id, collapse_test: 't', inference_pattern: INFERENCE_PATTERNS.STRUCTURAL,
    }, consent);
    console.log('  FAIL — should have thrown');
  } catch (e) {
    console.log(`  THROW (correct): ${e.code} - ${e.message}`);
    console.log(`  result: ${e.message.includes('supersedes') ? 'PASS' : 'FAIL'}`);
  }
}

// ---------------------------------------------------------------------------
console.log('\n--- Test 2: REVISE with supersedes succeeds + emits superseded fact ---');
{
  const bridge = freshSetup();
  const ev = bridge.addElement(
    { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'design-decision', claim: 'x' },
    consent
  );
  const p1 = bridge.addElement({
    idShape: ELEMENT_CATEGORIES.PROPOSITION, statement: 'original',
    grounding: ev.id, collapse_test: 't', inference_pattern: INFERENCE_PATTERNS.STRUCTURAL,
  }, consent);

  const p2 = bridge.reviseElement({
    idShape: ELEMENT_CATEGORIES.PROPOSITION, supersedes: p1.id,
    statement: 'revised', grounding: ev.id, collapse_test: 't',
    inference_pattern: INFERENCE_PATTERNS.STRUCTURAL,
  }, consent);

  show('p1.id', p1.id);
  show('p2.id', p2.id);
  console.log(`  ids differ?  ${p1.id !== p2.id ? 'YES (correct — REVISE creates a new element)' : 'NO (regression)'}`);

  show('superseded(A,B)', bridge.queryProof({ pattern: ['superseded', [{ var: 'A' }, { var: 'B' }]] }));
  const sup = bridge.queryProof({ pattern: ['superseded', [{ var: 'A' }, { var: 'B' }]] });
  const linkOk = sup.length === 1 && sup[0].A === p2.id && sup[0].B === p1.id;
  console.log(`  superseded link new→old correct? ${linkOk ? 'PASS' : 'FAIL'}`);
}

// ---------------------------------------------------------------------------
console.log('\n--- Test 3: ratifying the revised element derives the public predicate ---');
{
  const bridge = freshSetup();
  const ev = bridge.addElement(
    { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'design-decision', claim: 'x' },
    consent
  );
  const p1 = bridge.addElement({
    idShape: ELEMENT_CATEGORIES.PROPOSITION, statement: 'original',
    grounding: ev.id, collapse_test: 't', inference_pattern: INFERENCE_PATTERNS.STRUCTURAL,
  }, consent);
  const p2 = bridge.reviseElement({
    idShape: ELEMENT_CATEGORIES.PROPOSITION, supersedes: p1.id,
    statement: 'revised', grounding: ev.id, collapse_test: 't',
    inference_pattern: INFERENCE_PATTERNS.STRUCTURAL,
  }, consent);

  bridge.ratifyElement({ elementId: p1.id, source: CONSENT_SOURCES.DESIGNER, source_field: 'designer', claim: 'r' }, consent);
  bridge.ratifyElement({ elementId: p2.id, source: CONSENT_SOURCES.DESIGNER, source_field: 'designer', claim: 'r' }, consent);

  const derived = bridge.queryProof({ pattern: ['proposition', [{ var: 'I' }, { var: 'S' }]] });
  show('proposition (derived)', derived);
  const ids = new Set(derived.map(r => r.I));
  const both = ids.has(p1.id) && ids.has(p2.id);
  console.log(`  both p1 (${p1.id}) and p2 (${p2.id}) derive? ${both ? 'PASS' : 'FAIL'}`);
}

// ---------------------------------------------------------------------------
console.log('\n--- Test 4: REVISE works for all four approval-gated categories ---');
{
  const bridge = freshSetup();
  // ratify operation has a precondition `{predicate: 'evidence', arity: 3}` —
  // global check that any evidence fact exists. Add a placeholder so ratify can run.
  bridge.addElement({ idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'design-decision', claim: 'precondition placeholder' }, consent);
  // DEFINITION revision
  const d1 = bridge.addDefinition({ term: 'X', definition: 'original' }, consent);
  const d2 = bridge.reviseDefinition({ supersedes: d1.id, term: 'X', definition: 'revised' }, consent);
  bridge.ratifyDefinition({ elementId: d1.id, source: CONSENT_SOURCES.DESIGNER, source_field: 'designer', claim: 'r', term: 'X', definition: 'r' }, consent);
  bridge.ratifyDefinition({ elementId: d2.id, source: CONSENT_SOURCES.DESIGNER, source_field: 'designer', claim: 'r', term: 'X', definition: 'r' }, consent);

  // CONCERN revision
  const c1 = bridge.addConcern({ label: 'first', description: 'original' }, consent);
  const c2 = bridge.reviseConcern({ supersedes: c1.id, label: 'first', description: 'revised' }, consent);
  bridge.ratifyConcern({ elementId: c1.id, source: CONSENT_SOURCES.DESIGNER, source_field: 'designer', claim: 'r', label: 'first' }, consent);
  bridge.ratifyConcern({ elementId: c2.id, source: CONSENT_SOURCES.DESIGNER, source_field: 'designer', claim: 'r', label: 'first' }, consent);

  show('definition (derived)', bridge.queryProof({ pattern: ['definition', [{ var: 'I' }, { var: 'T' }, { var: 'D' }]] }));
  show('concern_status (ratified)', bridge.queryProof({ pattern: ['concern_status', [{ var: 'I' }, 'ratified']] }));
  show('superseded(A,B)', bridge.queryProof({ pattern: ['superseded', [{ var: 'A' }, { var: 'B' }]] }));

  const def = bridge.queryProof({ pattern: ['definition', [{ var: 'I' }, { var: 'T' }, { var: 'D' }]] });
  const conc = bridge.queryProof({ pattern: ['concern_status', [{ var: 'I' }, 'ratified']] });
  const sup = bridge.queryProof({ pattern: ['superseded', [{ var: 'A' }, { var: 'B' }]] });
  const ok = def.length === 2 && conc.length === 2 && sup.length === 2;
  console.log(`  derived definitions=2, ratified concerns=2, supersession links=2? ${ok ? 'PASS' : 'FAIL'}`);
}

// ---------------------------------------------------------------------------
console.log('\n--- Test 5: REVISE chain (a → b → c) produces 2 supersession links ---');
{
  const bridge = freshSetup();
  const ev = bridge.addElement(
    { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'design-decision', claim: 'x' },
    consent
  );
  const p1 = bridge.addElement({
    idShape: ELEMENT_CATEGORIES.PROPOSITION, statement: 'v1',
    grounding: ev.id, collapse_test: 't', inference_pattern: INFERENCE_PATTERNS.STRUCTURAL,
  }, consent);
  const p2 = bridge.reviseElement({
    idShape: ELEMENT_CATEGORIES.PROPOSITION, supersedes: p1.id,
    statement: 'v2', grounding: ev.id, collapse_test: 't',
    inference_pattern: INFERENCE_PATTERNS.STRUCTURAL,
  }, consent);
  const p3 = bridge.reviseElement({
    idShape: ELEMENT_CATEGORIES.PROPOSITION, supersedes: p2.id,
    statement: 'v3', grounding: ev.id, collapse_test: 't',
    inference_pattern: INFERENCE_PATTERNS.STRUCTURAL,
  }, consent);

  const sup = bridge.queryProof({ pattern: ['superseded', [{ var: 'A' }, { var: 'B' }]] });
  show('superseded chain', sup);
  const expectedLinks = new Set([`${p2.id}|${p1.id}`, `${p3.id}|${p2.id}`]);
  const actualLinks = new Set(sup.map(r => `${r.A}|${r.B}`));
  const ok = expectedLinks.size === actualLinks.size && [...expectedLinks].every(k => actualLinks.has(k));
  console.log(`  expected p2→p1 and p3→p2; got ${[...actualLinks].join(', ')}`);
  console.log(`  result: ${ok ? 'PASS' : 'FAIL'}`);
}
