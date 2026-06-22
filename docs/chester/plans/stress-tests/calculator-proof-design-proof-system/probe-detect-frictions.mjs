// probe-detect-frictions.mjs
// Verifies Adversarial-Finding #1 fix: friction-policy.detectFrictions canonicalizes
// symmetric pair frictions (overlap/conflict) so each semantic overlap produces
// exactly one finding rather than N² rows.

import { Engine } from '../../../../../skills/design-proof-system/references/engine/Engine.js';
import { createDomainBridge } from '../../../../../skills/design-proof-system/references/domain/domain-bridge.js';
import { detectFrictions } from '../../../../../skills/design-proof-system/references/domain/friction-policy.js';
import { CONSENT_SOURCES, ELEMENT_CATEGORIES } from '../../../../../skills/design-proof-system/references/domain/tags.js';
import { normalizeEngine } from '../../../../../skills/design-proof-system/references/domain/engine-port-adapter.js';

const engine = new Engine();
let counter = 0;
const bridge = createDomainBridge({
  engine,
  clock: { now: () => 1700000000 },
  idAllocator: { next: (s) => `${s}_${++counter}` },
  consentVerification: { verify: () => true },
  persistenceRepo: { saveState: () => {} },
});
const consent = { source: CONSENT_SOURCES.DESIGNER };

// Build a state with: 2 Session defs, 3 Token defs, 1 standalone def.
// Expected pairs: C(2,2)=1 Session pair + C(3,2)=3 Token pairs = 4 distinct overlaps.
// Raw cross-product: 2² + 3² + 1² = 14 rows; canonical = 4 rows.
const defs = [
  { term: 'Session', definition: 'server-tracked' },
  { term: 'Session', definition: 'self-contained' },
  { term: 'Token', definition: 'opaque' },
  { term: 'Token', definition: 'claims-bearing' },
  { term: 'Token', definition: 'one-time' },
  { term: 'XSS',   definition: 'cross-site scripting' },
];
for (const d of defs) bridge.addDefinition(d, consent);

// Need ReadPorts for the helper. Reproduce them by normalizing the engine the same
// way the bridge does (engine-port-adapter.normalizeEngine), then construct readPorts
// with the same shape the bridge uses internally.
const portBundled = normalizeEngine(engine);
const readPorts = { query: portBundled.query, explain: portBundled.explain };

console.log('--- raw overlap_detected rows (via queryProof) ---');
const raw = bridge.queryProof({ pattern: ['overlap_detected', [{ var: 'T1' }, { var: 'T2' }]] });
console.log(`count: ${raw.length}`);
for (const r of raw) console.log(`  ${r.T1} ↔ ${r.T2}`);

console.log('\n--- canonicalized via detectFrictions(readPorts) ---');
const findings = detectFrictions(readPorts);
const overlaps = findings.filter(f => f.shape === 'overlap');
console.log(`count: ${overlaps.length}`);
for (const f of overlaps) console.log(`  ${f.args[0]} ↔ ${f.args[1]}`);

console.log('\n--- expected ---');
console.log('count: 4   (1 Session-pair + 3 Token-pairs)');
console.log('  no reflexive matches (T1===T2)');
console.log('  no symmetric duplicates (only one of (A,B) / (B,A) per pair)');

const ok = overlaps.length === 4 &&
  overlaps.every(f => f.args[0] !== f.args[1]) &&
  new Set(overlaps.map(f => [f.args[0], f.args[1]].sort().join('|'))).size === 4;
console.log('\nresult:', ok ? 'PASS' : 'FAIL');

// Confirm the raw predicate still emits the noisy form (the engine's expressivity
// limit hasn't changed; only the helper's contract has been tightened).
console.log('\nraw query still noisy?', raw.length === 14 ? 'yes (expected)' : `no (got ${raw.length}, expected 14)`);
