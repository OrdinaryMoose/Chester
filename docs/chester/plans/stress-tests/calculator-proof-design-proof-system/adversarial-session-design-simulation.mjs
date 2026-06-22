// adversarial-session-design-simulation.mjs
// Stress test option 1: provoke the friction-policy auto-detection rules and
// probe whether detected frictions can be promoted to real FRICTION elements
// via the public surface, then dispositioned, then carried to closure.
//
// Domain: Designing a session-authentication system for a web application.
// Chosen for natural overlap (multiple definitions of "Session" / "Token") and
// natural gaps (some security risks deliberately left unaddressed).
//
// What's exercised that the calculator simulation didn't:
//   - friction-policy.js auto-detection rules:
//       * ungrounded_proposition_rule (probe — probably unprovokable; surface as finding)
//       * coverage_gap_rule          (drive: risks with no addresses)
//       * overlap_rule               (drive: two definitions sharing a term value)
//       * conflict_rule              (probe — documented stub; confirm)
//   - SYSTEM-source FRICTION admission via addElement (now possible after Finding #3 fix)
//   - Whether detectFrictions() helper is exposed on the bridge facade (probe)
//   - Closure path with system-detected frictions resolved
//
// Phases:
//   1. Bootstrap
//   2. DEFINITIONs — deliberate term-overlap (Session×2, Token×2)
//   3. EVIDENCE
//   4. PROPOSITIONs (all grounded — to compare with the unprovokable case)
//   5. RISKs — some will get RESOLUTIONs, some deliberately won't
//   6. RESOLUTIONs (partial coverage — leaves coverage gaps)
//   7. Ratify everything
//   8. Probe friction-policy detection predicates
//   9. Probe ungrounded_proposition reachability
//  10. Probe whether detectFrictions / friction-policy is exposed on bridge
//  11. Promote each detected friction → FRICTION element via SYSTEM consent
//  12. Disposition the system-detected frictions
//  13. Closure attempt
//  14. Final renders + findings dump

import { Engine } from '../../../../../skills/design-proof-system/references/engine/Engine.js';
import { createDomainBridge } from '../../../../../skills/design-proof-system/references/domain/domain-bridge.js';
import {
  CONSENT_SOURCES, ELEMENT_CATEGORIES, INFERENCE_PATTERNS,
  FRICTION_SHAPES, FRICTION_DISPOSITIONS,
} from '../../../../../skills/design-proof-system/references/domain/tags.js';

const findings = [];
let attemptIdx = 0;

function attempt(label, fn) {
  attemptIdx++;
  const tag = String(attemptIdx).padStart(2, '0');
  try {
    const result = fn();
    const tail = result !== undefined ? ` => ${JSON.stringify(result).slice(0, 140)}` : '';
    console.log(`[${tag}] OK   ${label}${tail}`);
    return result;
  } catch (e) {
    const message = (e && e.message) || String(e);
    const code = e && e.code;
    console.log(`[${tag}] FAIL ${label}\n         message: ${message}` + (code ? `\n         code:    ${code}` : ''));
    findings.push({
      attempt: tag, label, message, code,
      stack: (e?.stack || '').split('\n').slice(0, 5).join('\n'),
      validator: e?.validator, recordId: e?.recordId, field: e?.field,
    });
    return null;
  }
}

const logHeader = (t) => console.log(`\n===== ${t} =====`);

// ---------------------------------------------------------------------------
// Phase 1: bootstrap
// ---------------------------------------------------------------------------
logHeader('Phase 1: bootstrap');

const engine = new Engine();
let counter = 0;
const bridge = attempt('createDomainBridge', () =>
  createDomainBridge({
    engine,
    clock: { now: () => 1700000000 },
    idAllocator: { next: (s) => `${s}_${++counter}` },
    consentVerification: { verify: () => true },
    persistenceRepo: { saveState: () => {} },
  })
);
if (!bridge) { console.log('BOOT FAIL'); process.exit(1); }

const designerConsent = { source: CONSENT_SOURCES.DESIGNER };
const systemConsent = { source: CONSENT_SOURCES.SYSTEM };

// ---------------------------------------------------------------------------
// Phase 2: DEFINITIONs — deliberate term-overlap
// ---------------------------------------------------------------------------
logHeader('Phase 2: DEFINITIONs (deliberate term overlap)');

const defSessionA = attempt('addDefinition: Session (server-tracked)', () =>
  bridge.addDefinition({
    term: 'Session',
    definition: 'A server-tracked user-identity binding that spans multiple HTTP requests via a server-side store.',
  }, designerConsent)
);
const defSessionB = attempt('addDefinition: Session (self-contained)', () =>
  bridge.addDefinition({
    term: 'Session',
    definition: 'A self-contained signed token carrying identity claims and validity bounds — no server-side state required.',
  }, designerConsent)
);
const defTokenA = attempt('addDefinition: Token (opaque)', () =>
  bridge.addDefinition({
    term: 'Token',
    definition: 'An opaque random string presented by the client to prove a previously-established session.',
  }, designerConsent)
);
const defTokenB = attempt('addDefinition: Token (claims-bearing)', () =>
  bridge.addDefinition({
    term: 'Token',
    definition: 'A signed structure whose payload encodes user identity, role, and expiry as readable claims.',
  }, designerConsent)
);
const defXSS = attempt('addDefinition: XSS', () =>
  bridge.addDefinition({
    term: 'XSS',
    definition: 'Cross-site scripting — execution of attacker-supplied JavaScript inside the victim user-agent.',
  }, designerConsent)
);

// ---------------------------------------------------------------------------
// Phase 3: EVIDENCE
// ---------------------------------------------------------------------------
logHeader('Phase 3: EVIDENCE');

const evUserBehavior = attempt('addElement (EVIDENCE): user session behavior', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'user-research',
    claim: 'Users authenticate once and expect to stay signed in for 14–30 days on trusted devices.',
  }, designerConsent)
);
const evIndustryNorms = attempt('addElement (EVIDENCE): industry timeout norms', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'design-decision',
    claim: 'Industry-standard session timeouts span 15 minutes (banking) to 30 days (social).',
  }, designerConsent)
);
const evComplianceReq = attempt('addElement (EVIDENCE): compliance requirement', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'design-decision',
    claim: 'SOC2 audit requires session revocation within 60 seconds of a credential-compromise event.',
  }, designerConsent)
);

// ---------------------------------------------------------------------------
// Phase 4: PROPOSITIONs (all properly grounded)
// ---------------------------------------------------------------------------
logHeader('Phase 4: PROPOSITIONs');

const propTimeoutConfig = attempt('addElement (PROPOSITION): timeout must be configurable', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.PROPOSITION,
    statement: 'Session timeout must be configurable per-deployment in the range [15min, 30days].',
    grounding: evUserBehavior?.id ?? 'evidence_6',
    collapse_test: 'If timeout is hard-coded, deployments cannot meet user-expected longevity OR compliance-required brevity simultaneously.',
    inference_pattern: INFERENCE_PATTERNS.GROUNDS_IMPLY_CONCLUSION,
  }, designerConsent)
);
const propRevocable = attempt('addElement (PROPOSITION): sessions must be server-revocable', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.PROPOSITION,
    statement: 'Sessions must be revocable server-side within 60 seconds.',
    grounding: evComplianceReq?.id ?? 'evidence_8',
    collapse_test: 'If sessions cannot be revoked, SOC2 fails.',
    inference_pattern: INFERENCE_PATTERNS.STRUCTURAL,
  }, designerConsent)
);

// ---------------------------------------------------------------------------
// Phase 5: RISKs (some will be addressed, some deliberately not)
// ---------------------------------------------------------------------------
logHeader('Phase 5: RISKs');

const riskXSS = attempt('addElement (RISK): session theft via XSS', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.RISK,
    statement: 'A successful XSS attack reads the session token from JS-accessible storage and impersonates the user.',
    severity: 'high',
  }, designerConsent)
);
const riskFixation = attempt('addElement (RISK): session fixation', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.RISK,
    statement: 'Attacker sets a session id via URL parameter or cookie injection, then waits for the victim to authenticate.',
    severity: 'medium',
  }, designerConsent)
);
const riskTokenLeakLogs = attempt('addElement (RISK): token leak via logs (UNADDRESSED)', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.RISK,
    statement: 'Tokens may leak into request-line server logs or third-party telemetry that captures URLs.',
    severity: 'medium',
  }, designerConsent)
);
const riskStorageExhaust = attempt('addElement (RISK): server-side store exhaustion (UNADDRESSED)', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.RISK,
    statement: 'A flood of unauthenticated session-init requests fills the server-side session store.',
    severity: 'low',
  }, designerConsent)
);

// ---------------------------------------------------------------------------
// Phase 6: RESOLUTIONs — partial coverage on purpose
// ---------------------------------------------------------------------------
logHeader('Phase 6: RESOLUTIONs (partial — leaves coverage gaps)');

const resXSS = attempt('addElement (RESOLUTION): httpOnly + SameSite cookies', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.RESOLUTION,
    statement: 'Store the session token in an httpOnly, Secure, SameSite=Lax cookie; never expose to JavaScript.',
    addresses: riskXSS?.id ?? 'risk_X',
  }, designerConsent)
);
const resFixation = attempt('addElement (RESOLUTION): regenerate id on auth boundary', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.RESOLUTION,
    statement: 'Regenerate the session id immediately after successful authentication and after any privilege change.',
    addresses: riskFixation?.id ?? 'risk_Y',
  }, designerConsent)
);
// Deliberately NOT writing a resolution for riskTokenLeakLogs OR riskStorageExhaust.

// ---------------------------------------------------------------------------
// Phase 7: ratify everything
// ---------------------------------------------------------------------------
logHeader('Phase 7: ratifications');

const elementsToRatify = [
  defSessionA, defSessionB, defTokenA, defTokenB, defXSS,
  propTimeoutConfig, propRevocable,
  resXSS, resFixation,
];
for (const el of elementsToRatify) {
  if (!el?.id) continue;
  attempt(`ratifyElement: ${el.id}`, () =>
    bridge.ratifyElement({
      elementId: el.id, source: CONSENT_SOURCES.DESIGNER,
      source_field: 'designer', claim: 'ratification',
    }, designerConsent)
  );
}

// ---------------------------------------------------------------------------
// Phase 8: probe friction-policy detection predicates
// ---------------------------------------------------------------------------
logHeader('Phase 8: probe auto-detection predicates');

const detected = {
  ungrounded: attempt('queryProof: ungrounded_proposition', () =>
    bridge.queryProof({ pattern: ['ungrounded_proposition', [{ var: 'P' }]] })
  ),
  coverageGap: attempt('queryProof: coverage_gap_detected', () =>
    bridge.queryProof({ pattern: ['coverage_gap_detected', [{ var: 'C' }]] })
  ),
  overlap: attempt('queryProof: overlap_detected', () =>
    bridge.queryProof({ pattern: ['overlap_detected', [{ var: 'T1' }, { var: 'T2' }]] })
  ),
  conflict: attempt('queryProof: conflict_detected', () =>
    bridge.queryProof({ pattern: ['conflict_detected', [{ var: 'R1' }, { var: 'R2' }]] })
  ),
};
console.log('         summary:');
console.log(`           ungrounded_proposition rows: ${detected.ungrounded?.length}`);
console.log(`           coverage_gap_detected rows:  ${detected.coverageGap?.length}`);
console.log(`           overlap_detected rows:       ${detected.overlap?.length}`);
console.log(`           conflict_detected rows:      ${detected.conflict?.length}`);

// ---------------------------------------------------------------------------
// Phase 9: probe ungrounded_proposition reachability
// ---------------------------------------------------------------------------
logHeader('Phase 9: probe ungrounded_proposition reachability');

// Try to add a proposition without grounding — schema should reject.
attempt('addElement (PROPOSITION) without grounding (probe)', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.PROPOSITION,
    statement: 'A proposition without grounding (intentionally malformed).',
    collapse_test: 'n/a',
    inference_pattern: INFERENCE_PATTERNS.GROUNDS_IMPLY_CONCLUSION,
  }, designerConsent)
);

// Even if we withdraw the EVIDENCE that grounds a proposition, the grounding fact
// itself isn't retracted. Probe: withdraw evUserBehavior, re-derive, re-query.
if (evUserBehavior?.id) {
  attempt(`withdrawElement: ${evUserBehavior.id} (probe — does this surface its grounded prop as ungrounded?)`, () =>
    bridge.withdrawElement({ id: evUserBehavior.id }, designerConsent)
  );
  attempt('queryProof: ungrounded_proposition AFTER evidence withdrawal', () =>
    bridge.queryProof({ pattern: ['ungrounded_proposition', [{ var: 'P' }]] })
  );
  attempt('queryProof: grounding fact still present?', () =>
    bridge.queryProof({ pattern: ['grounding', [{ var: 'P' }, { var: 'E' }]] })
  );
}

// ---------------------------------------------------------------------------
// Phase 10: probe whether friction-policy helpers are exposed on the bridge
// ---------------------------------------------------------------------------
logHeader('Phase 10: probe friction-policy helper exposure');

attempt('bridge.detectFrictions (probe — should be undefined)', () => {
  if (typeof bridge.detectFrictions !== 'function') {
    throw Object.assign(new Error('bridge.detectFrictions is not exposed on the facade'), { code: 'NOT_EXPOSED' });
  }
  return bridge.detectFrictions();
});

// ---------------------------------------------------------------------------
// Phase 11: promote each DETECTED friction → real FRICTION element via SYSTEM consent
// ---------------------------------------------------------------------------
logHeader('Phase 11: promote detected → real FRICTION elements (SYSTEM consent)');

const promotedFrictions = [];

if (detected.coverageGap?.length) {
  for (const row of detected.coverageGap) {
    const f = attempt(`addElement (FRICTION) for coverage_gap on ${row.C}`, () =>
      bridge.addElement({
        idShape: ELEMENT_CATEGORIES.FRICTION,
        shape: FRICTION_SHAPES.COVERAGE_GAP,
        description: `Risk ${row.C} has no resolution addressing it (auto-detected by friction-policy).`,
      }, systemConsent)
    );
    if (f?.id) promotedFrictions.push({ id: f.id, label: `coverage_gap:${row.C}` });
  }
}

if (detected.overlap?.length) {
  // Dedupe: overlap_rule produces (A,B), (B,A), (A,A), (B,B). Only keep (A,B) where A < B.
  const seen = new Set();
  for (const row of detected.overlap) {
    if (row.T1 === row.T2) continue;
    const key = [row.T1, row.T2].sort().join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    const f = attempt(`addElement (FRICTION) for overlap on (${row.T1}, ${row.T2})`, () =>
      bridge.addElement({
        idShape: ELEMENT_CATEGORIES.FRICTION,
        shape: FRICTION_SHAPES.OVERLAP,
        description: `Definitions ${row.T1} and ${row.T2} share a term value (auto-detected).`,
      }, systemConsent)
    );
    if (f?.id) promotedFrictions.push({ id: f.id, label: `overlap:${row.T1}|${row.T2}` });
  }
}

console.log(`         promoted ${promotedFrictions.length} FRICTION element(s):`);
for (const f of promotedFrictions) console.log(`           ${f.id} (${f.label})`);

// ---------------------------------------------------------------------------
// Phase 12: disposition each promoted friction
// ---------------------------------------------------------------------------
logHeader('Phase 12: disposition promoted frictions');

for (const f of promotedFrictions) {
  attempt(`overrideFrictionDisposition: ${f.id} → DEFER`, () =>
    bridge.overrideFrictionDisposition({
      frictionId: f.id, disposition: FRICTION_DISPOSITIONS.DEFER,
    }, designerConsent)
  );
}

// ---------------------------------------------------------------------------
// Phase 13: closure attempt
// ---------------------------------------------------------------------------
logHeader('Phase 13: closure attempt');

const inv = {
  unresolved_friction: bridge.queryProof({ pattern: ['unresolved_friction', [{ var: 'F' }]] }),
  unaddressed_concern: bridge.queryProof({ pattern: ['unaddressed_concern', [{ var: 'C' }]] }),
  closure_failure_reason: bridge.queryProof({ pattern: ['closure_failure_reason', [{ var: 'R' }]] }),
  closure_permitted: bridge.queryProof({ pattern: ['closure_permitted', []] }),
};
console.log('         closure-state inventory:');
for (const [k, v] of Object.entries(inv)) console.log(`           ${k.padEnd(28)} ${JSON.stringify(v)}`);

attempt('presentClosingArgument', () =>
  bridge.presentClosingArgument({ source: 'designer', claim: 'closure-attempt' }, designerConsent)
);
attempt('confirmClosureGo', () =>
  bridge.confirmClosureGo({ source: 'designer', claim: 'closure-confirm' }, designerConsent)
);

// ---------------------------------------------------------------------------
// Phase 14: final renders + findings dump
// ---------------------------------------------------------------------------
logHeader('Phase 14: final renders');

const finalRender = attempt('renderStructuredProof', () => bridge.renderStructuredProof({}));
if (typeof finalRender === 'string') {
  console.log('--- Rendered proof (first 1400 chars) ---');
  console.log(finalRender.slice(0, 1400));
  console.log('--- end render preview ---');
}
attempt('renderClosingArgument', () => bridge.renderClosingArgument({}));

logHeader('Findings summary');
console.log(`Total attempts: ${attemptIdx}`);
console.log(`Failures:       ${findings.length}`);
if (findings.length > 0) {
  console.log('\n--- failures (JSON) ---');
  console.log(JSON.stringify(findings, null, 2));
}
