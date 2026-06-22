// probe-phase-and-two-yes.mjs
// Verifies Evolution-Issue #6 fix: phase predicate now derives from closure
// state; two_yes is written on each ratification; two_yes_complete fires when
// both DESIGNER and DESIGN_PARTNER have ratified the same element.

import { Engine } from '../../../../../skills/design-proof-system/references/engine/Engine.js';
import { createDomainBridge } from '../../../../../skills/design-proof-system/references/domain/domain-bridge.js';
import { CONSENT_SOURCES, ELEMENT_CATEGORIES, INFERENCE_PATTERNS, PHASES }
  from '../../../../../skills/design-proof-system/references/domain/tags.js';
import { getPhase } from '../../../../../skills/design-proof-system/references/domain/lifecycle.js';
import { normalizeEngine } from '../../../../../skills/design-proof-system/references/domain/engine-port-adapter.js';

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
const designer       = { source: CONSENT_SOURCES.DESIGNER };
const designPartner  = { source: CONSENT_SOURCES.DESIGN_PARTNER };
const show = (label, val) => console.log(`  ${label.padEnd(46)} ${JSON.stringify(val)}`);

// ---------------------------------------------------------------------------
console.log('--- Test 1: phase derives ESTABLISHMENT at boot (no closure_pending, no closure_committed) ---');
{
  const { engine, bridge } = freshSetup();
  const phaseRows = bridge.queryProof({ pattern: ['phase', [{ var: 'P' }]] });
  show('phase (boot)', phaseRows);
  // Also via the lifecycle helper
  const portBundled = normalizeEngine(engine);
  const ports = { query: portBundled.query, facts: portBundled.facts };
  const phase = getPhase(ports);
  console.log(`  lifecycle.getPhase = ${phase}`);
  const ok = phaseRows.length === 1 && phaseRows[0].P === PHASES.ESTABLISHMENT && phase === PHASES.ESTABLISHMENT;
  console.log(`  result: ${ok ? 'PASS' : 'FAIL'}`);
}

// ---------------------------------------------------------------------------
console.log('\n--- Test 2: phase transitions to PRESENTATION on presentClosingArgument ---');
{
  const { bridge } = freshSetup();
  // Need at least one evidence to satisfy ratify preconditions later... actually
  // presentClosingArgument doesn't have that precondition. Just call it.
  bridge.presentClosingArgument({ source: 'designer', claim: 'p' }, designer);
  const phaseRows = bridge.queryProof({ pattern: ['phase', [{ var: 'P' }]] });
  show('phase (after present)', phaseRows);
  const ok = phaseRows.length === 1 && phaseRows[0].P === PHASES.PRESENTATION;
  console.log(`  result: ${ok ? 'PASS' : 'FAIL'}`);
}

// ---------------------------------------------------------------------------
console.log('\n--- Test 3: phase transitions to CONFIRMATION on confirmClosureGo ---');
{
  const { bridge } = freshSetup();
  bridge.presentClosingArgument({ source: 'designer', claim: 'p' }, designer);
  bridge.confirmClosureGo({ source: 'designer', claim: 'c' }, designer);
  const phaseRows = bridge.queryProof({ pattern: ['phase', [{ var: 'P' }]] });
  show('phase (after confirm)', phaseRows);
  const ok = phaseRows.length === 1 && phaseRows[0].P === PHASES.CONFIRMATION;
  console.log(`  result: ${ok ? 'PASS' : 'FAIL'}`);
}

// ---------------------------------------------------------------------------
console.log('\n--- Test 4: ratify writes two_yes(id, source) ---');
{
  const { bridge } = freshSetup();
  const ev = bridge.addElement(
    { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'design-decision', claim: 'x' },
    designer
  );
  const p = bridge.addElement({
    idShape: ELEMENT_CATEGORIES.PROPOSITION, statement: 'x',
    grounding: ev.id, collapse_test: 't', inference_pattern: INFERENCE_PATTERNS.STRUCTURAL,
  }, designer);
  bridge.ratifyElement({ elementId: p.id, source: CONSENT_SOURCES.DESIGNER, source_field: 'designer', claim: 'r' }, designer);

  const tyRows = bridge.queryProof({ pattern: ['two_yes', [{ var: 'I' }, { var: 'S' }]] });
  show('two_yes(I, S)', tyRows);
  const tyComplete = bridge.queryProof({ pattern: ['two_yes_complete', [{ var: 'I' }]] });
  show('two_yes_complete(I)', tyComplete);
  const ok = tyRows.length === 1 && tyRows[0].I === p.id && tyRows[0].S === 'designer' && tyComplete.length === 0;
  console.log(`  expected: 1 two_yes row (designer), 0 two_yes_complete rows — ${ok ? 'PASS' : 'FAIL'}`);
}

// ---------------------------------------------------------------------------
console.log('\n--- Test 5: two_yes_complete fires when both DESIGNER and DESIGN_PARTNER ratify ---');
console.log('--- (drives the second yes via engine.assertFact since bridge.ratifyElement still ---');
console.log('--- requires DESIGNER consent — RATIFY per-category authority is deferred TODO) ---');
{
  const { engine, bridge } = freshSetup();
  const ev = bridge.addElement(
    { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'design-decision', claim: 'x' },
    designer
  );
  const p = bridge.addElement({
    idShape: ELEMENT_CATEGORIES.PROPOSITION, statement: 'x',
    grounding: ev.id, collapse_test: 't', inference_pattern: INFERENCE_PATTERNS.STRUCTURAL,
  }, designer);

  // First ratify by DESIGNER (via bridge — normal path)
  bridge.ratifyElement({ elementId: p.id, source: CONSENT_SOURCES.DESIGNER, source_field: 'designer', claim: 'r' }, designer);
  let complete = bridge.queryProof({ pattern: ['two_yes_complete', [{ var: 'I' }]] });
  show('two_yes_complete after 1 ratify', complete);

  // Second yes by DESIGN_PARTNER — direct engine fact assertion. This is what the
  // RATIFY translator would emit if/when its per-category authority lookup is wired.
  // Probing the rule semantics, not the authority path.
  engine.assertFact('two_yes', [p.id, 'design_partner']);
  engine.derive();
  complete = bridge.queryProof({ pattern: ['two_yes_complete', [{ var: 'I' }]] });
  show('two_yes_complete after 2 yes facts', complete);

  const ok = complete.length === 1 && complete[0].I === p.id;
  console.log(`  expected 1 two_yes_complete row for ${p.id} — ${ok ? 'PASS' : 'FAIL'}`);
}

// ---------------------------------------------------------------------------
console.log('\n--- Test 6: full lifecycle — boot ESTABLISHMENT, after present PRESENTATION, after confirm CONFIRMATION ---');
{
  const { bridge } = freshSetup();
  const phaseAt = (label) => {
    const rows = bridge.queryProof({ pattern: ['phase', [{ var: 'P' }]] });
    console.log(`  [${label.padEnd(20)}] phase = ${JSON.stringify(rows)}`);
    return rows;
  };
  const a = phaseAt('boot');
  bridge.presentClosingArgument({ source: 'designer', claim: 'p' }, designer);
  const b = phaseAt('after present');
  bridge.confirmClosureGo({ source: 'designer', claim: 'c' }, designer);
  const c = phaseAt('after confirm');

  const ok =
    a.length === 1 && a[0].P === PHASES.ESTABLISHMENT &&
    b.length === 1 && b[0].P === PHASES.PRESENTATION &&
    c.length === 1 && c[0].P === PHASES.CONFIRMATION;
  console.log(`  monotonic transition? ${ok ? 'PASS' : 'FAIL'}`);
}
