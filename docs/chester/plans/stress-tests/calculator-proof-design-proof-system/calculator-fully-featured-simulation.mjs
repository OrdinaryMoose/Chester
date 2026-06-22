// calculator-fully-featured-simulation.mjs
// Stress test of the design-proof-system Domain layer driven from the designer's
// perspective. Builds a proof for a fully-featured calculator application that
// exercises EVERY element category in tags.ELEMENT_CATEGORIES:
//
//   EVIDENCE, RULE, PERMISSION, PROPOSITION, RISK, RESOLUTION,
//   FRICTION, CONCERN, DEFINITION
//
// Phases:
//   1. Bootstrap (engine + bridge via design-proof-system)
//   2. DEFINITIONs        — vocabulary anchors
//   3. EVIDENCE           — empirical givens
//   4. RULEs              — inferential framework rules (statements only, EDB)
//   5. PERMISSIONs        — designer-granted allowances (statements only, EDB)
//   6. PROPOSITIONs       — grounded truth claims (approval-gated)
//   7. RISKs              — failure modes
//   8. RESOLUTIONs        — risk handlers (approval-gated)
//   9. CONCERNs           — designer-flagged worries (approval-gated)
//  10. FRICTIONs          — system-shaped detected tensions
//  11. Ratifications      — for every approval-gated element added
//  12. Pre-closure inspection (queries + datalog snapshot)
//  13. presentClosingArgument
//  14. confirmClosureGo
//  15. Final renders
//
// Every move is wrapped in attempt() — errors are logged and recorded without
// stopping the simulation. Findings are dumped at the end.

import { Engine } from '../../../../../skills/design-proof-system/references/engine/Engine.js';
import { createDomainBridge } from '../../../../../skills/design-proof-system/references/domain/domain-bridge.js';
import {
  CONSENT_SOURCES,
  ELEMENT_CATEGORIES,
  INFERENCE_PATTERNS,
  FRICTION_SHAPES,
  FRICTION_DISPOSITIONS,
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
const persistenceRepo = { saveState: (_s) => { /* no-op */ } };

const bridge = attempt('createDomainBridge', () =>
  createDomainBridge({ engine, clock, idAllocator, consentVerification, persistenceRepo })
);

if (!bridge) {
  console.log('\nBOOT FAILED — dumping findings and exiting');
  console.log(JSON.stringify(findings, null, 2));
  process.exit(1);
}

const designerConsent = { source: CONSENT_SOURCES.DESIGNER };
const systemConsent = { source: CONSENT_SOURCES.SYSTEM };

// ---------------------------------------------------------------------------
// Phase 2: DEFINITIONs (4) — vocabulary anchors
// ---------------------------------------------------------------------------
logHeader('Phase 2: DEFINITIONs');

const defCalculator = attempt('addDefinition: Calculator', () =>
  bridge.addDefinition({
    term: 'Calculator',
    definition: 'A single-screen application that evaluates arithmetic expressions composed of operands, operators, and parenthesized sub-expressions, and displays the resulting numeric value.',
  }, designerConsent)
);

const defOperand = attempt('addDefinition: Operand', () =>
  bridge.addDefinition({
    term: 'Operand',
    definition: 'A double-precision floating-point number entered by the user via numeric keys (digits, decimal point, sign).',
  }, designerConsent)
);

const defOperator = attempt('addDefinition: Operator', () =>
  bridge.addDefinition({
    term: 'Operator',
    definition: 'A symbol from {+, -, *, /, ^, %} that combines two operands to produce a new operand.',
  }, designerConsent)
);

const defExpression = attempt('addDefinition: Expression', () =>
  bridge.addDefinition({
    term: 'Expression',
    definition: 'A finite sequence of operands and operators, optionally containing balanced parentheses, that resolves to a single Operand.',
  }, designerConsent)
);

// ---------------------------------------------------------------------------
// Phase 3: EVIDENCE (4) — empirical givens
// ---------------------------------------------------------------------------
logHeader('Phase 3: EVIDENCE');

const evInput = attempt('addElement (EVIDENCE): user-input model', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.EVIDENCE,
    source: 'user-research',
    claim: 'Users enter operands via numeric keys and operators via dedicated buttons; multi-digit operands accumulate until an operator is pressed.',
  }, designerConsent)
);

const evOutput = attempt('addElement (EVIDENCE): output model', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.EVIDENCE,
    source: 'design-decision',
    claim: 'The calculator displays one numeric result at a time on a single-line readout, plus a secondary line for the in-progress expression.',
  }, designerConsent)
);

const evNumberDomain = attempt('addElement (EVIDENCE): number domain', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.EVIDENCE,
    source: 'design-decision',
    claim: 'All operands and intermediate results are IEEE-754 double-precision floating-point numbers.',
  }, designerConsent)
);

const evMemoryFeature = attempt('addElement (EVIDENCE): memory feature requested', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.EVIDENCE,
    source: 'user-research',
    claim: 'Power users requested four memory operations: M+, M-, MR, MC.',
  }, designerConsent)
);

// ---------------------------------------------------------------------------
// Phase 4: RULEs (3) — inferential framework, EDB-only
// ---------------------------------------------------------------------------
logHeader('Phase 4: RULEs');

const rulePrecedence = attempt('addElement (RULE): operator precedence', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.RULE,
    statement: 'Operator precedence follows standard mathematical conventions: ^ binds tighter than {*, /, %}, which bind tighter than {+, -}.',
    rationale: 'Aligns with what users learned in school; surprising precedence is a top complaint in calculator-app reviews.',
  }, designerConsent)
);

const ruleAssociativity = attempt('addElement (RULE): left-associativity for arithmetic', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.RULE,
    statement: 'Operators of equal precedence are evaluated left-to-right, except for ^ which is right-associative.',
    rationale: 'Matches mathematical convention; right-assoc exponentiation matches calculator convention.',
  }, designerConsent)
);

const ruleNoCoercion = attempt('addElement (RULE): no implicit coercion', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.RULE,
    statement: 'No implicit type coercion: every operand and result is a Number; strings and booleans are never accepted as operands.',
    rationale: 'Prevents JavaScript "+" from concatenating instead of adding when input handling has a bug.',
  }, designerConsent)
);

// ---------------------------------------------------------------------------
// Phase 5: PERMISSIONs (3) — designer-granted allowances, EDB-only
// ---------------------------------------------------------------------------
logHeader('Phase 5: PERMISSIONs');

const permClear = attempt('addElement (PERMISSION): clear-all at any time', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.PERMISSION,
    statement: 'The user may press the AC (all-clear) button at any time to reset the calculator to its initial state.',
    rationale: 'Recovery is always available; users should never feel "stuck" in an error state.',
  }, designerConsent)
);

const permKeyboardEntry = attempt('addElement (PERMISSION): keyboard entry', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.PERMISSION,
    statement: 'Operands and operators may be entered via either the on-screen buttons OR the physical keyboard (digits, +-*/, Enter, Backspace, Escape).',
    rationale: 'Accessibility + power-user efficiency.',
  }, designerConsent)
);

const permParenInsertion = attempt('addElement (PERMISSION): parentheses', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.PERMISSION,
    statement: 'The user may insert opening and closing parentheses to override default operator precedence.',
    rationale: 'Required for any non-trivial expression.',
  }, designerConsent)
);

// ---------------------------------------------------------------------------
// Phase 6: PROPOSITIONs (3) — approval-gated truth claims
// ---------------------------------------------------------------------------
logHeader('Phase 6: PROPOSITIONs');

const propSixOps = attempt('addElement (PROPOSITION): six operations supported', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.PROPOSITION,
    statement: 'The calculator supports exactly six binary operations: +, -, *, /, ^, %.',
    grounding: evInput?.id ?? 'evidence_1',
    collapse_test: 'If any of {+, -, *, /, ^, %} is missing, users cannot perform their stated tasks (per user-research evidence).',
    inference_pattern: INFERENCE_PATTERNS.GROUNDS_IMPLY_CONCLUSION,
  }, designerConsent)
);

const propDeterministic = attempt('addElement (PROPOSITION): operations are deterministic', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.PROPOSITION,
    statement: 'For any fixed operand sequence and operator sequence, the calculator produces a single deterministic result.',
    grounding: evNumberDomain?.id ?? 'evidence_3',
    collapse_test: 'If identical input sequences yielded different outputs, the calculator would be unusable as a reference tool.',
    inference_pattern: INFERENCE_PATTERNS.STRUCTURAL,
  }, designerConsent)
);

const propMemoryPersists = attempt('addElement (PROPOSITION): memory persists across clears', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.PROPOSITION,
    statement: 'The memory register persists across AC (all-clear) and is only emptied by MC (memory-clear).',
    grounding: evMemoryFeature?.id ?? 'evidence_4',
    collapse_test: 'If AC wiped memory, the M+/MR workflow would be useless during multi-step calculations.',
    inference_pattern: INFERENCE_PATTERNS.GROUNDS_IMPLY_CONCLUSION,
  }, designerConsent)
);

// ---------------------------------------------------------------------------
// Phase 7: RISKs (3)
// ---------------------------------------------------------------------------
logHeader('Phase 7: RISKs');

const riskDivByZero = attempt('addElement (RISK): division by zero', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.RISK,
    statement: 'Division by zero would produce Infinity or NaN, which is not a meaningful calculator result.',
    severity: 'high',
  }, designerConsent)
);

const riskOverflow = attempt('addElement (RISK): numeric overflow', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.RISK,
    statement: 'Repeated multiplication or large exponentiation can exceed Number.MAX_SAFE_INTEGER and produce silent precision loss.',
    severity: 'medium',
  }, designerConsent)
);

const riskMalformedExpr = attempt('addElement (RISK): malformed expression', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.RISK,
    statement: 'Unbalanced parentheses or two consecutive operators (e.g. "3 + * 4") would crash naive parsers.',
    severity: 'medium',
  }, designerConsent)
);

// ---------------------------------------------------------------------------
// Phase 8: RESOLUTIONs (3) — approval-gated
// ---------------------------------------------------------------------------
logHeader('Phase 8: RESOLUTIONs');

const resDivByZero = attempt('addElement (RESOLUTION): handle div-by-zero', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.RESOLUTION,
    statement: 'When the divisor is zero, display "Error: ÷0" on the readout and require AC before any further input.',
    addresses: riskDivByZero?.id ?? 'risk_1',
  }, designerConsent)
);

const resOverflow = attempt('addElement (RESOLUTION): handle overflow', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.RESOLUTION,
    statement: 'When |result| ≥ 1e16, switch the display to scientific notation (e.g. 1.23e17); on actual Infinity, display "Overflow".',
    addresses: riskOverflow?.id ?? 'risk_2',
  }, designerConsent)
);

const resMalformed = attempt('addElement (RESOLUTION): reject malformed input', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.RESOLUTION,
    statement: 'A keypress that would produce a syntactically invalid expression is silently suppressed and the previous valid input is retained.',
    addresses: riskMalformedExpr?.id ?? 'risk_3',
  }, designerConsent)
);

// ---------------------------------------------------------------------------
// Phase 9: CONCERNs (2) — approval-gated
// ---------------------------------------------------------------------------
logHeader('Phase 9: CONCERNs');

const concernAccessibility = attempt('addElement (CONCERN): accessibility', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.CONCERN,
    label: 'screen-reader friendliness',
    description: 'The single-line readout is great visually but may need ARIA live-region annotations so screen readers announce results without re-reading the entire expression.',
  }, designerConsent)
);

const concernMobileTouch = attempt('addElement (CONCERN): mobile touch targets', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.CONCERN,
    label: 'mobile touch-target size',
    description: 'A 6-operation grid plus parentheses, memory keys, and digits may push individual buttons below the 44pt accessibility minimum on small phones.',
  }, designerConsent)
);

// ---------------------------------------------------------------------------
// Phase 10: FRICTIONs (2) — system-shaped detected tensions.
// FRICTION sourceConstraint is SYSTEM but OPERATION_SPECS.add requires DESIGNER.
// First try designer; if blocked by consent, fall back to system to surface
// the consent-axis collision as a finding.
// ---------------------------------------------------------------------------
logHeader('Phase 10: FRICTIONs');

const frictionPrecedenceOverlap = attempt('addElement (FRICTION): coverage_gap on % semantics', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.FRICTION,
    shape: FRICTION_SHAPES.COVERAGE_GAP,
    description: 'No proposition or rule disambiguates whether "%" means modulo (5 % 3 = 2) or percent (50 % = 0.5). Both interpretations are common in calculator UIs.',
  }, designerConsent)
);

// Probe the consent axis: try the same operation under SYSTEM consent — this should
// fail because OPERATION_SPECS.add.consentCategory is hard-coded to DESIGNER.
const frictionSystemConsentProbe = attempt('addElement (FRICTION) under SYSTEM consent (probe)', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.FRICTION,
    shape: FRICTION_SHAPES.OVERLAP,
    description: 'Probe attempt: the "/" operator overlaps with both "÷" (visual) and "÷ key on mobile keyboards" — naming policy unspecified.',
  }, systemConsent)
);

// ---------------------------------------------------------------------------
// Phase 11: ratifications — every approval-gated element added above
// ---------------------------------------------------------------------------
logHeader('Phase 11: ratifications');

const elementsToRatify = [
  defCalculator, defOperand, defOperator, defExpression,
  propSixOps, propDeterministic, propMemoryPersists,
  resDivByZero, resOverflow, resMalformed,
  concernAccessibility, concernMobileTouch,
];

for (const el of elementsToRatify) {
  if (!el?.id) continue;
  attempt(`ratifyElement: ${el.id}`, () =>
    bridge.ratifyElement({
      elementId: el.id,
      source: CONSENT_SOURCES.DESIGNER,
      // The 'ratify' OPERATION_SPECS shape-checks against EVIDENCE shape (idShape default),
      // so supply filler EVIDENCE fields to satisfy verifyArgsShape.
      source_field: 'designer',
      claim: 'ratification',
    }, designerConsent)
  );
}

// ---------------------------------------------------------------------------
// Phase 12: friction disposition (manage_friction verb) — exercise the
// disposition pathway distinct from element creation.
// ---------------------------------------------------------------------------
logHeader('Phase 12: friction disposition');

if (frictionPrecedenceOverlap?.id) {
  attempt('overrideFrictionDisposition: ADDRESS the % friction', () =>
    bridge.overrideFrictionDisposition({
      frictionId: frictionPrecedenceOverlap.id,
      disposition: FRICTION_DISPOSITIONS.ADDRESS,
    }, designerConsent)
  );
}

// ---------------------------------------------------------------------------
// Phase 13: pre-closure inspection
// ---------------------------------------------------------------------------
logHeader('Phase 13: pre-closure inspection');

const proofState = attempt('getProofState', () => bridge.getProofState({}));
if (proofState) {
  console.log(`         proofState keys: ${Object.keys(proofState).join(', ')}`);
}

const datalog = attempt('renderDatalogProjection', () => bridge.renderDatalogProjection({}));
if (datalog) {
  console.log(`         datalog.facts.length = ${datalog.facts?.length}`);
  console.log(`         datalog.rules.length = ${datalog.rules?.length ?? 'n/a'}`);
}

const closurePermitted = attempt('queryProof: closure_permitted', () =>
  bridge.queryProof({ pattern: ['closure_permitted', []] })
);
const unresolvedFriction = attempt('queryProof: unresolved_friction', () =>
  bridge.queryProof({ pattern: ['unresolved_friction', [{ var: 'F' }]] })
);
const unaddressedConcern = attempt('queryProof: unaddressed_concern', () =>
  bridge.queryProof({ pattern: ['unaddressed_concern', [{ var: 'C' }]] })
);
console.log(`         closure_permitted rows: ${closurePermitted?.length}`);
console.log(`         unresolved_friction rows: ${unresolvedFriction?.length}`);
console.log(`         unaddressed_concern rows: ${unaddressedConcern?.length}`);

// Counter-evidence: directly query the per-category EDB to confirm each
// element category landed at least one fact.
const inventory = attempt('queryProof: inventory all categories', () => ({
  evidence: bridge.queryProof({ pattern: ['evidence', [{ var: 'I' }, { var: 'S' }, { var: 'C' }]] })?.length ?? 0,
  rule_decl: bridge.queryProof({ pattern: ['rule_decl', [{ var: 'I' }, { var: 'S' }]] })?.length ?? 0,
  permission_decl: bridge.queryProof({ pattern: ['permission_decl', [{ var: 'I' }, { var: 'S' }]] })?.length ?? 0,
  proposition_decl: bridge.queryProof({ pattern: ['proposition_decl', [{ var: 'I' }, { var: 'S' }, { var: 'P' }]] })?.length ?? 0,
  proposition_derived: bridge.queryProof({ pattern: ['proposition', [{ var: 'I' }, { var: 'S' }]] })?.length ?? 0,
  risk: bridge.queryProof({ pattern: ['risk', [{ var: 'I' }, { var: 'S' }, { var: 'V' }]] })?.length ?? 0,
  resolution_decl: bridge.queryProof({ pattern: ['resolution_decl', [{ var: 'I' }, { var: 'S' }]] })?.length ?? 0,
  resolution_derived: bridge.queryProof({ pattern: ['resolution', [{ var: 'I' }, { var: 'S' }]] })?.length ?? 0,
  friction: bridge.queryProof({ pattern: ['friction', [{ var: 'I' }, { var: 'Sh' }, { var: 'D' }, { var: 'Di' }]] })?.length ?? 0,
  concern: bridge.queryProof({ pattern: ['concern', [{ var: 'I' }, { var: 'L' }, { var: 'D' }]] })?.length ?? 0,
  definition_decl: bridge.queryProof({ pattern: ['definition_decl', [{ var: 'I' }, { var: 'T' }, { var: 'D' }]] })?.length ?? 0,
  definition_derived: bridge.queryProof({ pattern: ['definition', [{ var: 'I' }, { var: 'T' }, { var: 'D' }]] })?.length ?? 0,
}));
if (inventory) {
  console.log('         per-category EDB inventory:');
  for (const [k, v] of Object.entries(inventory)) console.log(`           ${k.padEnd(20)} ${v}`);
}

// ---------------------------------------------------------------------------
// Phase 14: presentClosingArgument
// ---------------------------------------------------------------------------
logHeader('Phase 14: presentClosingArgument');

attempt('presentClosingArgument', () => bridge.presentClosingArgument({
  source: 'designer', claim: 'closure-attempt',
}, designerConsent));

// ---------------------------------------------------------------------------
// Phase 15: confirmClosureGo + final renders
// ---------------------------------------------------------------------------
logHeader('Phase 15: confirmClosureGo + final renders');

attempt('confirmClosureGo', () => bridge.confirmClosureGo({
  source: 'designer', claim: 'closure-confirm',
}, designerConsent));

const finalRender = attempt('renderStructuredProof', () => bridge.renderStructuredProof({}));
if (typeof finalRender === 'string') {
  console.log('--- Rendered proof (first 1200 chars) ---');
  console.log(finalRender.slice(0, 1200));
  console.log('--- end render preview ---');
} else if (finalRender && typeof finalRender === 'object') {
  console.log(`         renderStructuredProof returned object with keys: ${Object.keys(finalRender).join(', ')}`);
}

const closingArgument = attempt('renderClosingArgument', () => bridge.renderClosingArgument({}));
if (closingArgument) {
  console.log(`         closingArgument: ${JSON.stringify(closingArgument)}`);
}

// Render one element deeply for each approval-gated category
if (defCalculator?.id) {
  attempt(`renderElementDeep: ${defCalculator.id}`, () =>
    bridge.renderElementDeep({ id: defCalculator.id })
  );
}
if (propSixOps?.id) {
  attempt(`renderElementDeep: ${propSixOps.id}`, () =>
    bridge.renderElementDeep({ id: propSixOps.id })
  );
}

// Counterfactual probe: collapse-test a proposition.
if (propSixOps?.id) {
  attempt(`runCounterfactual: ${propSixOps.id}`, () =>
    bridge.runCounterfactual({ propId: propSixOps.id })
  );
}

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
