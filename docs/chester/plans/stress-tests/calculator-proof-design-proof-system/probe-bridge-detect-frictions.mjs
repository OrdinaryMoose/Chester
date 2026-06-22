// probe-bridge-detect-frictions.mjs
// Verifies Adversarial-Finding #4 fix: bridge.detectFrictions exposed on facade,
// returns canonicalized findings across all four detection shapes, and the
// read-only audit adapter exposes it too.

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
  return { engine, bridge };
}
const consent = { source: CONSENT_SOURCES.DESIGNER };
const show = (label, val) => console.log(`  ${label.padEnd(48)} ${JSON.stringify(val)}`);

// ---------------------------------------------------------------------------
console.log('--- Test 1: bridge.detectFrictions is a function ---');
{
  const { bridge } = freshSetup();
  const t = typeof bridge.detectFrictions;
  console.log(`  typeof bridge.detectFrictions = '${t}' — ${t === 'function' ? 'PASS' : 'FAIL'}`);
}

// ---------------------------------------------------------------------------
console.log('\n--- Test 2: empty proof yields empty findings list ---');
{
  const { bridge } = freshSetup();
  const f = bridge.detectFrictions();
  show('detectFrictions()', f);
  console.log(`  expected []; got length ${f.length} — ${f.length === 0 ? 'PASS' : 'FAIL'}`);
}

// ---------------------------------------------------------------------------
console.log('\n--- Test 3: detects coverage_gap, overlap, ungrounded — across all reachable shapes ---');
{
  const { bridge } = freshSetup();

  // Set up a state that provokes three of the four shapes.
  // (CONFLICT is a documented stub — requires conflict_decl base fact that no public API asserts.)

  // Two definitions sharing the term 'X' → 1 canonical OVERLAP.
  bridge.addDefinition({ term: 'X', definition: 'first sense' }, consent);
  bridge.addDefinition({ term: 'X', definition: 'second sense' }, consent);

  // A risk with no resolution → 1 COVERAGE_GAP.
  bridge.addElement(
    { idShape: ELEMENT_CATEGORIES.RISK, statement: 'unaddressed risk', severity: 'medium' },
    consent
  );

  // A grounded proposition whose evidence we then withdraw → 1 UNGROUNDED.
  const ev = bridge.addElement(
    { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'design-decision', claim: 'live evidence' },
    consent
  );
  const prop = bridge.addElement({
    idShape: ELEMENT_CATEGORIES.PROPOSITION,
    statement: 'will lose grounding',
    grounding: ev.id,
    collapse_test: 'tested',
    inference_pattern: INFERENCE_PATTERNS.STRUCTURAL,
  }, consent);
  bridge.withdrawElement({ id: ev.id }, consent); // works thanks to Finding #3 fix

  const findings = bridge.detectFrictions();
  show('detectFrictions()', findings);

  const byShape = {};
  for (const f of findings) byShape[f.shape] = (byShape[f.shape] || 0) + 1;
  console.log('  shape histogram:', JSON.stringify(byShape));

  const ok =
    (byShape.overlap === 1) &&
    (byShape.coverage_gap === 1) &&
    (byShape.ungrounded === 1) &&
    !('conflict' in byShape);
  console.log('  expected: {overlap:1, coverage_gap:1, ungrounded:1}, no conflict — ',
    ok ? 'PASS' : 'FAIL');
}

// ---------------------------------------------------------------------------
console.log('\n--- Test 4: overlap output is canonical (no reflexive, no symmetric dup) ---');
{
  const { bridge } = freshSetup();
  // 3 defs sharing a term → C(3,2) = 3 canonical pairs from the helper, vs 9 raw rows.
  bridge.addDefinition({ term: 'Y', definition: 'a' }, consent);
  bridge.addDefinition({ term: 'Y', definition: 'b' }, consent);
  bridge.addDefinition({ term: 'Y', definition: 'c' }, consent);

  const findings = bridge.detectFrictions();
  const overlaps = findings.filter(f => f.shape === 'overlap');
  show('overlaps', overlaps);

  const reflexive = overlaps.filter(o => o.args[0] === o.args[1]).length;
  const keys = new Set(overlaps.map(o => [o.args[0], o.args[1]].sort().join('|')));
  const ok = overlaps.length === 3 && reflexive === 0 && keys.size === 3;
  console.log(`  reflexive: ${reflexive}, distinct pairs: ${keys.size}, total: ${overlaps.length}`);
  console.log(`  expected: 3 distinct, 0 reflexive — ${ok ? 'PASS' : 'FAIL'}`);
}

// ---------------------------------------------------------------------------
console.log('\n--- Test 5: read-only audit adapter also exposes detectFrictions ---');
{
  // Single bridge construction to set up the engine state, then build the audit
  // adapter from the SAME normalized engine handle. (Constructing a second bridge
  // would re-run Phase A registerStatic and crash on duplicate-rule registration —
  // an incidental finding, but separate from what this probe targets.)
  const { engine, bridge } = freshSetup();
  bridge.addElement(
    { idShape: ELEMENT_CATEGORIES.RISK, statement: 'audit-visible risk', severity: 'low' },
    consent
  );

  const audit = createReadOnlyAudit(normalizeEngine(engine));
  const t = typeof audit.detectFrictions;
  console.log(`  typeof audit.detectFrictions = '${t}'`);
  if (t === 'function') {
    const findings = audit.detectFrictions();
    show('audit.detectFrictions()', findings);
    const ok = findings.some(f => f.shape === 'coverage_gap');
    console.log(`  finds the coverage_gap from the audit-side too — ${ok ? 'PASS' : 'FAIL'}`);
  } else {
    console.log('  FAIL — not exposed on read-only audit');
  }
}
