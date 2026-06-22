// probe-overlap-scope.mjs
// Verifies Task #9 fix: overlap_detected requires matching scope. Same-term-
// different-scope is treated as legitimate dual-use (not an overlap).

import { Engine } from '../../../../../skills/design-proof-system/references/engine/Engine.js';
import { createDomainBridge } from '../../../../../skills/design-proof-system/references/domain/domain-bridge.js';
import { CONSENT_SOURCES, ELEMENT_CATEGORIES }
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
const show = (l, v) => console.log(`  ${l.padEnd(50)} ${JSON.stringify(v)}`);

// ---------------------------------------------------------------------------
console.log('--- Test 1: same term, no scope (default "global") — overlap fires (back-compat) ---');
{
  const bridge = freshSetup();
  bridge.addDefinition({ term: 'Session', definition: 'first' }, consent);
  bridge.addDefinition({ term: 'Session', definition: 'second' }, consent);
  const overlaps = bridge.detectFrictions().filter(f => f.shape === 'overlap');
  show('overlaps', overlaps);
  const ok = overlaps.length === 1;
  console.log(`  expected 1 canonical overlap — ${ok ? 'PASS' : 'FAIL'}`);
}

// ---------------------------------------------------------------------------
console.log('\n--- Test 2: same term, DIFFERENT explicit scopes — no overlap (legitimate dual-use) ---');
{
  const bridge = freshSetup();
  bridge.addDefinition({ term: 'Session', definition: 'web session', scope: 'web' }, consent);
  bridge.addDefinition({ term: 'Session', definition: 'os session',  scope: 'os'  }, consent);
  const overlaps = bridge.detectFrictions().filter(f => f.shape === 'overlap');
  show('overlaps', overlaps);
  const ok = overlaps.length === 0;
  console.log(`  expected 0 overlaps — ${ok ? 'PASS' : 'FAIL'}`);
}

// ---------------------------------------------------------------------------
console.log('\n--- Test 3: same term, one scoped + one default — no overlap (different scopes) ---');
{
  const bridge = freshSetup();
  bridge.addDefinition({ term: 'Token', definition: 'auth token', scope: 'auth' }, consent);
  bridge.addDefinition({ term: 'Token', definition: 'unspecified' /* default 'global' */ }, consent);
  const overlaps = bridge.detectFrictions().filter(f => f.shape === 'overlap');
  show('overlaps', overlaps);
  const ok = overlaps.length === 0;
  console.log(`  expected 0 overlaps (different scopes) — ${ok ? 'PASS' : 'FAIL'}`);
}

// ---------------------------------------------------------------------------
console.log('\n--- Test 4: three same-term-same-scope definitions — 3 canonical pairs ---');
{
  const bridge = freshSetup();
  bridge.addDefinition({ term: 'Resource', definition: 'a' }, consent);
  bridge.addDefinition({ term: 'Resource', definition: 'b' }, consent);
  bridge.addDefinition({ term: 'Resource', definition: 'c' }, consent);
  const overlaps = bridge.detectFrictions().filter(f => f.shape === 'overlap');
  show('overlaps', overlaps);
  const ok = overlaps.length === 3;
  console.log(`  expected C(3,2)=3 canonical pairs — ${ok ? 'PASS' : 'FAIL'}`);
}

// ---------------------------------------------------------------------------
console.log('\n--- Test 5: mixed scope partition — only intra-scope pairs detected ---');
{
  const bridge = freshSetup();
  // 2 Session-web + 2 Session-os + 1 Session-other
  bridge.addDefinition({ term: 'Session', definition: 'web 1', scope: 'web' }, consent);
  bridge.addDefinition({ term: 'Session', definition: 'web 2', scope: 'web' }, consent);
  bridge.addDefinition({ term: 'Session', definition: 'os 1',  scope: 'os'  }, consent);
  bridge.addDefinition({ term: 'Session', definition: 'os 2',  scope: 'os'  }, consent);
  bridge.addDefinition({ term: 'Session', definition: 'mobile 1', scope: 'mobile' }, consent);

  const overlaps = bridge.detectFrictions().filter(f => f.shape === 'overlap');
  show('overlaps', overlaps);
  // Expected: 1 web pair + 1 os pair = 2 canonical overlaps; the lone 'mobile' is alone in its scope
  const ok = overlaps.length === 2;
  console.log(`  expected 2 overlaps (web×web, os×os) — ${ok ? 'PASS' : 'FAIL'}`);
}

// ---------------------------------------------------------------------------
console.log('\n--- Test 6: definition_scope fact landed in EDB for projection completeness ---');
{
  const bridge = freshSetup();
  const d = bridge.addDefinition({ term: 'X', definition: 'x', scope: 'custom' }, consent);
  const scopes = bridge.queryProof({ pattern: ['definition_scope', [{ var: 'I' }, { var: 'S' }]] });
  show('definition_scope', scopes);
  const ok = scopes.length === 1 && scopes[0].I === d.id && scopes[0].S === 'custom';
  console.log(`  result: ${ok ? 'PASS' : 'FAIL'}`);
}
