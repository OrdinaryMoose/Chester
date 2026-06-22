// cascade-spec-probe-simulation.mjs
//
// Twin of calculator-fully-featured-simulation.mjs, but every entity is shaped
// per the CASCADE SPEC (`docs/chester/.../design-documents/05-domain-spec.md` §3)
// rather than the implementation's schema.js.
//
// Two probe goals (per user request 2026-05-17):
//   (1) Exercise the grounding/2 array-shape concern by passing
//       `grounding: [evid_id, ...]` (non-empty array) per spec §3.4.
//   (2) Submit every category using the SPEC's field names — so any
//       cascade-vs-implementation gap surfaces as MISSING_FIELD,
//       BAD_ENUM, INVALID_SOURCE, or TYPE_ERROR.
//
// All moves are wrapped in attempt(); failures are catalogued.
//
// IMPORTANT: We deliberately pass spec field names even when we KNOW they
// won't match the implementation. The point is enumerating drift, not
// passing the suite. Don't "fix" this file by aliasing fields back.
//
// REGRESSION ASSERTIONS (sprint-02-bug-fix-02, 2026-05-17):
//   H-2 and H-3 are now closure-regression assertions. The PERMISSION
//   submission (Phase 5) and RISK submission (Phase 7) carry `relieves`
//   and `basis` per spec §3.3 / §3.5 respectively. Pre-sprint the same
//   submissions appeared to succeed but lost the linkage silently —
//   `permission/3` and `risk_basis/2` facts never landed in the EDB.
//   Post-sprint the PERMISSION and RISK closures emit those linkage
//   facts; we verify with queryProof immediately after each submission.
//   If a future change regresses the closure emission, those asserts
//   will fail loudly here.

// Skills-root resolution: the probe lives in gitignored working/ at the main
// repo path, but worktree-based sprints want it to load skills/ from the
// worktree (so under-test code is exercised, not main). Override via
// CHESTER_SKILLS_ROOT (absolute path to the directory containing
// design-proof-system/). Default is the main repo's skills/, computed
// relative to this file.
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_SKILLS_ROOT = path.resolve(__dirname, '../../../../../skills');
const SKILLS_ROOT = process.env.CHESTER_SKILLS_ROOT
  ? path.resolve(process.env.CHESTER_SKILLS_ROOT)
  : DEFAULT_SKILLS_ROOT;

const _engineUrl = pathToFileURL(path.join(SKILLS_ROOT, 'design-proof-system/references/engine/Engine.js')).href;
const _bridgeUrl = pathToFileURL(path.join(SKILLS_ROOT, 'design-proof-system/references/domain/domain-bridge.js')).href;
const _tagsUrl   = pathToFileURL(path.join(SKILLS_ROOT, 'design-proof-system/references/domain/tags.js')).href;

const { Engine } = await import(_engineUrl);
const { createDomainBridge } = await import(_bridgeUrl);
const { CONSENT_SOURCES, ELEMENT_CATEGORIES } = await import(_tagsUrl);

console.log(`[probe] SKILLS_ROOT=${SKILLS_ROOT}`);

const findings = [];
let attemptIdx = 0;

function attempt(label, fn) {
  attemptIdx++;
  const tag = String(attemptIdx).padStart(2, '0');
  try {
    const result = fn();
    const tail = result !== undefined ? ` => ${JSON.stringify(result).slice(0, 120)}` : '';
    console.log(`[${tag}] OK   ${label}${tail}`);
    return result;
  } catch (e) {
    const message = (e && e.message) || String(e);
    const code = e && e.code;
    console.log(`[${tag}] FAIL ${label}\n         message: ${message}` + (code ? `\n         code:    ${code}` : ''));
    findings.push({
      attempt: tag, label, message, code,
      validator: e?.validator, recordId: e?.recordId, field: e?.field,
    });
    return null;
  }
}

function logHeader(title) { console.log(`\n===== ${title} =====`); }

// ---------------------------------------------------------------------------
// Phase 1: bootstrap
// ---------------------------------------------------------------------------
logHeader('Phase 1: bootstrap');

const engine = new Engine();
let counter = 0;
const idAllocator = { next: (shape) => `${shape}_${++counter}` };
const clock = { now: () => 1700000000 };
const consentVerification = { verify: () => true };
const persistenceRepo = { saveState: (_s) => {} };

const bridge = attempt('createDomainBridge', () =>
  createDomainBridge({ engine, clock, idAllocator, consentVerification, persistenceRepo })
);
if (!bridge) {
  console.log('\nBOOT FAILED — dumping findings and exiting');
  console.log(JSON.stringify(findings, null, 2));
  process.exit(1);
}

// Designer consent is the framework's operator-identity token. The cascade
// distinguishes that from EVIDENCE.source (codebase|industry|...).
const designerConsent = { source: CONSENT_SOURCES.DESIGNER };

// ---------------------------------------------------------------------------
// Phase 2: DEFINITIONs — spec §3.9 uses `canonical_name` + `definition`
// + optional `aliases`, `sense_constraints`. Implementation uses `term`.
// ---------------------------------------------------------------------------
logHeader('Phase 2: DEFINITIONs (spec shape: canonical_name)');

const defCalculator = attempt('addDefinition (spec): canonical_name=Calculator', () =>
  bridge.addDefinition({
    canonical_name: 'Calculator',
    definition: 'A single-screen application that evaluates arithmetic expressions and displays the resulting numeric value.',
    aliases: ['calc'],
    sense_constraints: 'Restricted to scalar arithmetic — vectors and matrices out of scope.',
  }, designerConsent)
);

const defOperand = attempt('addDefinition (spec): canonical_name=Operand', () =>
  bridge.addDefinition({
    canonical_name: 'Operand',
    definition: 'A double-precision floating-point number entered via numeric keys.',
  }, designerConsent)
);

const defOperator = attempt('addDefinition (spec): canonical_name=Operator', () =>
  bridge.addDefinition({
    canonical_name: 'Operator',
    definition: 'A symbol from {+, -, *, /, ^, %} that combines two operands.',
  }, designerConsent)
);

// ---------------------------------------------------------------------------
// Phase 3: EVIDENCE — spec §3.1 uses `statement` + `source` (closed enum,
// NOT designer). Implementation uses `claim` and has no enum at all.
// ---------------------------------------------------------------------------
logHeader('Phase 3: EVIDENCE (spec shape: statement + closed-enum source)');

const evInput = attempt('addElement EVIDENCE (spec): source=industry, statement=...', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.EVIDENCE,
    source: 'industry',
    statement: 'Users enter operands via numeric keys and operators via dedicated buttons.',
  }, designerConsent)
);

const evOutput = attempt('addElement EVIDENCE (spec): source=codebase, statement=...', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.EVIDENCE,
    source: 'codebase',
    statement: 'The calculator displays one numeric result at a time on a single-line readout.',
  }, designerConsent)
);

const evNumberDomain = attempt('addElement EVIDENCE (spec): source=prior-record, statement=...', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.EVIDENCE,
    source: 'prior-record',
    statement: 'All operands and intermediate results are IEEE-754 doubles.',
  }, designerConsent)
);

const evMemoryFeature = attempt('addElement EVIDENCE (spec): source=agent-derivation, statement=...', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.EVIDENCE,
    source: 'agent-derivation',
    statement: 'Power users requested four memory operations: M+, M-, MR, MC.',
  }, designerConsent)
);

// Authority probe: spec §3.1 says source MUST NOT be `designer`. Post Task 1
// (sprint-02-bug-fix-0306) the impl enforces the spec-form closed enum via
// closedEnumFields, so this submission MUST be rejected. We wrap the call so
// the expected throw is the success path.
const evBadSource = attempt('addElement EVIDENCE (spec authority probe): source=designer (must reject)', () => {
  let rejectedCorrectly = false;
  try {
    bridge.addElement({
      idShape: ELEMENT_CATEGORIES.EVIDENCE,
      source: 'designer',
      statement: 'Probe: designer-sourced evidence must be rejected per spec §3.1 authority.',
    }, designerConsent);
  } catch (e) {
    if (e.code === 'SHAPE_INVALID' && e.field === 'source') {
      rejectedCorrectly = true;
    } else {
      throw new Error(`wrong rejection shape: code=${e.code} field=${e.field}`);
    }
  }
  if (!rejectedCorrectly) throw new Error('EVIDENCE source=designer was accepted (expected SHAPE_INVALID)');
  return 'rejected as expected';
});

// ---------------------------------------------------------------------------
// Phase 4: RULEs — spec §3.2 has optional `modality` (obligation|prohibition)
// and `covers` (array of Concern IDs). Implementation has only `statement`.
// ---------------------------------------------------------------------------
logHeader('Phase 4: RULEs (spec optionals: modality, covers)');

const rulePrecedence = attempt('addElement RULE (spec): statement+modality=obligation', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.RULE,
    statement: 'Operator precedence follows standard mathematical conventions.',
    modality: 'obligation',
    covers: [],
  }, designerConsent)
);

const ruleNoCoercion = attempt('addElement RULE (spec): statement+modality=prohibition', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.RULE,
    statement: 'No implicit type coercion: every operand and result is a Number.',
    modality: 'prohibition',
  }, designerConsent)
);

// ---------------------------------------------------------------------------
// Phase 5: PERMISSIONs — spec §3.3 requires `relieves` (a RULE id);
// optional `scope_constraint`. Implementation has only `statement`.
// ---------------------------------------------------------------------------
logHeader('Phase 5: PERMISSIONs (spec required: relieves)');

const permClear = attempt('addElement PERMISSION (spec): statement + relieves', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.PERMISSION,
    statement: 'The user may press AC at any time to reset the calculator.',
    relieves: rulePrecedence?.id ?? 'rule_1',
    scope_constraint: 'Applies only at top-level state; mid-evaluation AC requires a confirm step.',
  }, designerConsent)
);

const permKeyboard = attempt('addElement PERMISSION (spec): statement + relieves', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.PERMISSION,
    statement: 'Operands and operators may be entered via the physical keyboard.',
    relieves: ruleNoCoercion?.id ?? 'rule_2',
  }, designerConsent)
);

// AC-H2 regression assertion: permission/3 linkage fact must land in EDB after
// the PERMISSION submission. Pre-sprint this fact was silently dropped.
if (permClear && rulePrecedence) {
  const permLinkRows = attempt('AC-H2: queryProof permission/3 after PERMISSION add', () =>
    bridge.queryProof({ pattern: ['permission', [permClear.id, { var: 'S' }, { var: 'R' }]] })
  );
  if (permLinkRows && permLinkRows.length === 1 && permLinkRows[0].R === rulePrecedence.id) {
    console.log(`         OK: permission/3 fact landed with relieves=${permLinkRows[0].R}`);
  } else {
    findings.push({ attempt: 'H-2-assert', label: 'permission/3 not landed correctly', message: JSON.stringify(permLinkRows) });
  }
}

// ---------------------------------------------------------------------------
// Phase 6: PROPOSITIONs — spec §3.4 grounding is a NON-EMPTY ARRAY.
// This is the user's first probe goal — exercise the grounding mismatch.
// inference_pattern is OPTIONAL per spec; required in implementation.
// Spec inference_pattern values use hyphens (e.g. `grounds-imply-conclusion`)
// not underscores like the implementation's INFERENCE_PATTERNS enum.
// ---------------------------------------------------------------------------
logHeader('Phase 6: PROPOSITIONs (spec shape: grounding=ARRAY, inference_pattern hyphenated)');

const propSixOps = attempt('addElement PROPOSITION (spec): grounding=[evid_1,evid_2]', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.PROPOSITION,
    statement: 'The calculator supports exactly six binary operations: +, -, *, /, ^, %.',
    grounding: [evInput?.id, evOutput?.id].filter(Boolean),
    collapse_test: 'If any operation is missing, users cannot perform their stated tasks.',
    reasoning_chain: 'IF user-research evidence shows six operations are used THEN we must support all six.',
    inference_pattern: 'grounds_imply_conclusion',  // impl enum (Task 2 underscore form)
    rejected_alternatives: [
      { statement: 'Support only +, -, *, /', rejection_reason: 'Ignores ^ and % per user-research evidence.' },
    ],
  }, designerConsent)
);

const propDeterministic = attempt('addElement PROPOSITION (spec): grounding=[evid_3]', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.PROPOSITION,
    statement: 'For any fixed input sequence the calculator produces a deterministic result.',
    grounding: [evNumberDomain?.id].filter(Boolean),
    collapse_test: 'If identical inputs yielded different outputs, the calculator is unusable.',
    reasoning_chain: 'IF result is a pure function of inputs THEN the calculator is deterministic.',
    inference_pattern: 'proposition_composition',  // impl enum (Task 2 underscore form)
  }, designerConsent)
);

// Pure-translation grounding probe: a *single-evidence* array — the minimal
// failing case for the grounding/2 array-shape concern.
const propSingleArr = attempt('addElement PROPOSITION (spec): grounding=[single id] (minimal array probe)', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.PROPOSITION,
    statement: 'Memory persists across AC and is only emptied by MC.',
    grounding: [evMemoryFeature?.id].filter(Boolean),
    collapse_test: 'If AC wiped memory, M+/MR workflow is useless.',
    reasoning_chain: 'IF user-research demands persistent memory THEN AC must not wipe it.',
    inference_pattern: 'grounds_imply_conclusion',  // impl enum (Task 2 underscore form)
  }, designerConsent)
);

// ---------------------------------------------------------------------------
// Phase 7: RISKs — spec §3.5 REQUIRES `basis` (array of element IDs).
// Implementation has only `statement` and optional `severity` (not in spec).
// ---------------------------------------------------------------------------
logHeader('Phase 7: RISKs (spec required: basis array)');

// Seed impl-shape EVIDENCE before RISK so the H-3 basis is non-empty even
// though Phase 3's spec-shape EVIDENCE failed schema validation. T3 added
// basis-as-non-empty-array enforcement; without these seeds the RISK
// submission would itself fail SHAPE_INVALID and the H-3 linkage assertion
// would be moot.
// Note: post Task 1 (sprint-02-bug-fix-0306) EVIDENCE uses `statement` not `claim`.
const evForRiskBasisA = attempt('addElement EVIDENCE for RISK basis seed A', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.EVIDENCE,
    source: 'industry',
    statement: 'Seed evidence A for RISK basis (H-3 regression backstop).',
  }, designerConsent)
);

const evForRiskBasisB = attempt('addElement EVIDENCE for RISK basis seed B', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.EVIDENCE,
    source: 'codebase',
    statement: 'Seed evidence B for RISK basis (H-3 regression backstop).',
  }, designerConsent)
);

const riskDivByZero = attempt('addElement RISK (spec): statement + basis array', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.RISK,
    statement: 'Division by zero produces Infinity or NaN.',
    basis: [evForRiskBasisA?.id, evForRiskBasisB?.id].filter(Boolean),
  }, designerConsent)
);

const riskOverflow = attempt('addElement RISK (spec): statement + basis array', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.RISK,
    statement: 'Repeated multiplication can exceed MAX_SAFE_INTEGER.',
    basis: [evForRiskBasisA?.id].filter(Boolean),
  }, designerConsent)
);

// AC-H3 regression assertion: risk_basis/2 linkage facts must land in EDB
// after the RISK submission. The riskDivByZero basis above is a 2-element
// array, so expectedCount=2 — verifies the basis spread is genuinely emitting
// one fact per basis element. Pre-sprint these facts were silently dropped.
if (riskDivByZero) {
  const riskBasisRows = attempt('AC-H3: queryProof risk_basis/2 after RISK add', () =>
    bridge.queryProof({ pattern: ['risk_basis', [riskDivByZero.id, { var: 'E' }]] })
  );
  const expectedCount = 2; // matches the basis array length on riskDivByZero
  if (riskBasisRows && riskBasisRows.length === expectedCount) {
    console.log(`         OK: risk_basis/2 facts landed (${riskBasisRows.length} rows)`);
  } else {
    findings.push({ attempt: 'H-3-assert', label: 'risk_basis/2 count mismatch', message: JSON.stringify(riskBasisRows) });
  }
}

// ---------------------------------------------------------------------------
// Phase 8: CONCERNs — spec §3.8 matches implementation closely.
// Building these BEFORE resolutions because spec §3.6 ties resolutions to
// concerns via `problem_anchor`, not to risks as the original calculator sim did.
// ---------------------------------------------------------------------------
logHeader('Phase 8: CONCERNs');

const concernAccessibility = attempt('addElement CONCERN (spec): label + description', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.CONCERN,
    label: 'screen-reader friendliness',
    description: 'The single-line readout may need ARIA live-region annotations.',
  }, designerConsent)
);

const concernMobileTouch = attempt('addElement CONCERN (spec): label + description', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.CONCERN,
    label: 'mobile touch-target size',
    description: 'A dense button grid may push individual buttons below 44pt minimum.',
  }, designerConsent)
);

// ---------------------------------------------------------------------------
// Phase 9: RESOLUTIONs — spec §3.6 requires `problem_anchor` (CONCERN id)
// AND `grounding` (array of Proposition ids). Implementation conflates the
// two into `addresses`. Per spec, resolutions address CONCERNs (not RISKs as
// the calculator sim does).
// ---------------------------------------------------------------------------
logHeader('Phase 9: RESOLUTIONs (spec required: problem_anchor + grounding[])');

const resAccessibility = attempt('addElement RESOLUTION (spec): statement + problem_anchor + grounding[]', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.RESOLUTION,
    statement: 'Add aria-live="polite" to the result region and aria-hidden to the working-expression region.',
    problem_anchor: concernAccessibility?.id ?? 'cern_1',
    grounding: [propSixOps?.id].filter(Boolean),
  }, designerConsent)
);

const resTouch = attempt('addElement RESOLUTION (spec): statement + problem_anchor + grounding[]', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.RESOLUTION,
    statement: 'Auto-collapse seldom-used keys (M-, MC) into a secondary panel below 360px viewport.',
    problem_anchor: concernMobileTouch?.id ?? 'cern_2',
    grounding: [propDeterministic?.id].filter(Boolean),
  }, designerConsent)
);

// ---------------------------------------------------------------------------
// Phase 10: FRICTIONs — spec §3.7 requires `friction_shape`, `anchor_a`,
// `anchor_b`, `disposition`. Implementation uses `shape` + `description` +
// optional `disposition` (NO anchors). Spec friction_shape values are entirely
// different from implementation's FRICTION_SHAPES enum.
// ---------------------------------------------------------------------------
logHeader('Phase 10: FRICTIONs (spec shape: friction_shape + anchor_a + anchor_b)');

const frictionPropPull = attempt('addElement FRICTION (spec): friction_shape + anchor_a/b + disposition', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.FRICTION,
    // Cascade §3.7.1 uses hyphenated shape values (e.g. proposition-proposition-opposing-pull)
    // that aren't in the impl FRICTION_SHAPES enum yet. Substituting an impl-valid value here;
    // FRICTION enum normalization is deferred per sprint-02-bug-fix-0306 Non-Goals.
    friction_shape: 'coverage_gap',
    anchor_a: propSixOps?.id ?? 'prop_1',
    anchor_b: propDeterministic?.id ?? 'prop_2',
    // Cascade spec disposition vocab ("lived-with" et al.) doesn't match impl
    // DISPOSITION enum (Task 4). Using impl-valid value; vocab alignment deferred.
    disposition: 'address',
    statement: 'Determinism + six operations together imply % means modulo, but UX wants percent.',
  }, designerConsent)
);

// ---------------------------------------------------------------------------
// Phase 10b: isolated grounding/2 array probe.
//
// Phase 6 used spec inference_pattern values, which the schema rejected before
// the translator ran. To reach the engine, use the implementation-valid
// inference_pattern but keep grounding as a NON-EMPTY ARRAY (spec §3.4). If the
// engine's FactStore._validateArgs rejects array-valued constants, this is
// where it fires.
// ---------------------------------------------------------------------------
logHeader('Phase 10b: ISOLATED grounding-array probe (impl-valid inference_pattern)');

// First seed an EVIDENCE using the implementation's `claim` field name so we
// have a real id to put in the grounding array.
// Note: post Task 1 (sprint-02-bug-fix-0306) EVIDENCE uses `statement` not `claim`.
const evForArrayProbe = attempt('addElement EVIDENCE for grounding-array probe', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.EVIDENCE,
    source: 'industry',
    statement: 'Seed evidence for the grounding-array engine probe.',
  }, designerConsent)
);

const evForArrayProbe2 = attempt('addElement EVIDENCE #2 for grounding-array probe', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.EVIDENCE,
    source: 'codebase',
    statement: 'Second seed evidence for the grounding-array engine probe.',
  }, designerConsent)
);

const propArrayGrounding = attempt('addElement PROPOSITION (mixed): impl inference_pattern + spec array grounding', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.PROPOSITION,
    statement: 'Grounding-array engine probe proposition.',
    grounding: [evForArrayProbe?.id, evForArrayProbe2?.id].filter(Boolean),
    collapse_test: 'Probe.',
    reasoning_chain: 'IF grounding is an array per spec §3.4 THEN engine assertFact must accept it.',
    inference_pattern: 'grounds_imply_conclusion',  // impl form, schema-valid
  }, designerConsent)
);

// Single-element array variant — to distinguish "engine rejects arrays at all"
// from "engine rejects multi-element arrays specifically".
const propSingletonArr = attempt('addElement PROPOSITION (mixed): impl inference_pattern + singleton array grounding', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.PROPOSITION,
    statement: 'Singleton-array grounding probe.',
    grounding: [evForArrayProbe?.id].filter(Boolean),
    collapse_test: 'Probe.',
    reasoning_chain: 'IF grounding accepts singleton arrays THEN engine accepts arrays at all.',
    inference_pattern: 'grounds_imply_conclusion',  // impl enum (Task 2)
  }, designerConsent)
);

// Control: same shape but grounding as a single-element array — post Task 2,
// grounding must always be a non-empty array (string is no longer accepted).
const propStringControl = attempt('addElement PROPOSITION (control): impl shape + singleton-array grounding (should pass)', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.PROPOSITION,
    statement: 'Control proposition with singleton-array grounding (impl-typical post-Task-2).',
    grounding: [evForArrayProbe?.id ?? 'evidence_x'],
    collapse_test: 'Probe.',
    reasoning_chain: 'IF grounding is a singleton array per current impl idiom THEN engine accepts it.',
    inference_pattern: 'grounds_imply_conclusion',  // impl enum (Task 2)
  }, designerConsent)
);

// ---------------------------------------------------------------------------
// Phase 11: report & summary
// ---------------------------------------------------------------------------
logHeader('Phase 11: post-build summary');

const proofState = attempt('getProofState', () => bridge.getProofState({}));
if (proofState) {
  console.log(`         proofState keys: ${Object.keys(proofState).join(', ')}`);
}

// ---------------------------------------------------------------------------
// Phase 12: regression assertions (sprint-02-bug-fix-0306)
// AC-10.2 — verify closed-bundle facts genuinely land in the EDB.
// ---------------------------------------------------------------------------
logHeader('Phase 12: Regression assertions (sprint-02-bug-fix-0306)');

// AC-10.2: PROPOSITION grounding spread — at least one proposition_grounding fact must exist
attempt('AC-10.2 proposition_grounding/2 emitted post-D2 spread', () => {
  const rows = bridge.queryProof({ pattern: ['proposition_grounding', [{ var: 'P' }, { var: 'E' }]] });
  if (rows.length === 0) throw new Error(`expected >=1 proposition_grounding row, got 0`);
  return `rows=${rows.length}`;
});

// AC-10.2: RESOLUTION anchor + grounding emitted
attempt('AC-10.2 resolution_anchor/2 emitted post-D4 reshape', () => {
  const rows = bridge.queryProof({ pattern: ['resolution_anchor', [{ var: 'R' }, { var: 'C' }]] });
  if (rows.length === 0) throw new Error(`expected >=1 resolution_anchor row, got 0`);
  return `rows=${rows.length}`;
});
attempt('AC-10.2 resolution_grounding/2 emitted post-D4 reshape', () => {
  const rows = bridge.queryProof({ pattern: ['resolution_grounding', [{ var: 'R' }, { var: 'P' }]] });
  if (rows.length === 0) throw new Error(`expected >=1 resolution_grounding row, got 0`);
  return `rows=${rows.length}`;
});

// AC-10.2: FRICTION arity 5
attempt('AC-10.2 friction/5 facts emitted post-D4 arity change', () => {
  const rows = bridge.queryProof({ pattern: ['friction', [{ var: 'I' }, { var: 'S' }, { var: 'A' }, { var: 'B' }, { var: 'D' }]] });
  if (rows.length === 0) throw new Error(`expected >=1 friction/5 row, got 0`);
  return `rows=${rows.length}`;
});

// AC-10.2: EVIDENCE source=designer must-reject — wrap in attempt() so the throw is the expected outcome
attempt('AC-10.2 EVIDENCE source=designer rejected with SHAPE_INVALID', () => {
  let rejectedCorrectly = false;
  try {
    bridge.addElement({ idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'designer', statement: 'probe' }, { source: CONSENT_SOURCES.DESIGNER });
  } catch (e) {
    if (e.code === 'SHAPE_INVALID' && e.field === 'source') {
      rejectedCorrectly = true;
    } else {
      throw new Error(`wrong rejection shape: code=${e.code} field=${e.field}`);
    }
  }
  if (!rejectedCorrectly) throw new Error('EVIDENCE source=designer was accepted (expected SHAPE_INVALID)');
  return 'rejected as expected';
});

// ---------------------------------------------------------------------------
// Findings dump
// ---------------------------------------------------------------------------
logHeader('Findings summary');
console.log(`Total attempts: ${attemptIdx}`);
console.log(`Failures:       ${findings.length}`);
if (findings.length > 0) {
  console.log('\n--- failures (JSON) ---');
  console.log(JSON.stringify(findings, null, 2));
}

// Print machine-readable drift catalog grouped by category for easy reading.
logHeader('Drift catalog (grouped by failure code)');
const byCode = {};
for (const f of findings) {
  const k = f.code ?? '(no code)';
  (byCode[k] ??= []).push(f);
}
for (const [code, entries] of Object.entries(byCode)) {
  console.log(`\n  ${code}: ${entries.length}`);
  for (const e of entries) {
    console.log(`    [${e.attempt}] ${e.label}`);
    if (e.field) console.log(`           field: ${e.field}`);
    console.log(`           ${e.message.slice(0, 160)}`);
  }
}
