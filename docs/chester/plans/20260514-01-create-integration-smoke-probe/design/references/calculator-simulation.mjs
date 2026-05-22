// calculator-simulation.mjs — stress test of Domain + Engine integration via the
// designer's perspective. Builds a proof for a basic calculator application.
//
// Phases:
//   1. Bootstrap (engine + adapter + bridge)
//   2. Add definitions (Calculator, Operator, Operand)
//   3. Add evidence (input model, output model)
//   4. Add propositions (truth claims, grounded in evidence)
//   5. Add risks + resolutions (failure modes + how we handle them)
//   6. Ratify everything
//   7. Try presentClosingArgument (may fail)
//   8. Inspect state via renders, address any gaps
//   9. confirmClosureGo
//  10. Final render
//
// Every move is wrapped in attempt() — errors are logged and recorded without
// stopping the simulation. This is a stress test; the point is to find gaps.

import { Engine } from '../../../../../../skills/design-large-task/engine/Engine.js';
import { createDomainBridge } from '../../../../../../skills/design-large-task/domain/domain-bridge.js';
import { CONSENT_SOURCES, ELEMENT_CATEGORIES, INFERENCE_PATTERNS } from '../../../../../../skills/design-large-task/domain/tags.js';
import { adaptEngineToPorts } from './port-adapter.mjs';

const findings = [];
let attemptIdx = 0;

function attempt(label, fn) {
  attemptIdx++;
  const tag = String(attemptIdx).padStart(2, '0');
  try {
    const result = fn();
    console.log(`[${tag}] OK   ${label}` + (result !== undefined ? ` => ${JSON.stringify(result).slice(0, 120)}` : ''));
    return result;
  } catch (e) {
    const message = (e && e.message) || String(e);
    const code = e && e.code;
    console.log(`[${tag}] FAIL ${label}\n         message: ${message}` + (code ? `\n         code:    ${code}` : ''));
    findings.push({
      attempt: tag, label, message, code,
      stack: (e?.stack || '').split('\n').slice(0, 4).join('\n'),
      validator: e?.validator, recordId: e?.recordId, field: e?.field,
    });
    return null;
  }
}

function logHeader(title) {
  console.log(`\n===== ${title} =====`);
}

// ---------------------------------------------------------------------------
// Phase 1: bootstrap
// ---------------------------------------------------------------------------
logHeader('Phase 1: bootstrap');

const engine = new Engine();
const ports = adaptEngineToPorts(engine);

let counter = 0;
const idAllocator = { next: (shape) => `${shape}_${++counter}` };
const clock = { now: () => 1700000000 };
const consentVerification = { verify: () => true };
const persistenceRepo = { saveState: (_s) => { /* in-memory persistence */ } };

const bridge = attempt('createDomainBridge', () =>
  createDomainBridge({ engine: ports, clock, idAllocator, consentVerification, persistenceRepo })
);

if (!bridge) {
  console.log('\nBOOT FAILED — dumping findings and exiting');
  console.log(JSON.stringify(findings, null, 2));
  process.exit(1);
}

const consent = { source: CONSENT_SOURCES.DESIGNER };

// ---------------------------------------------------------------------------
// Phase 2: definitions
// ---------------------------------------------------------------------------
logHeader('Phase 2: definitions');

const defCalculator = attempt('addDefinition: Calculator', () =>
  bridge.addDefinition({ term: 'Calculator', definition: 'An application performing arithmetic on two operands using one operator.' }, consent)
);

const defOperator = attempt('addDefinition: Operator', () =>
  bridge.addDefinition({ term: 'Operator', definition: 'A symbol selecting which arithmetic operation to perform (+, -, *, /).' }, consent)
);

const defOperand = attempt('addDefinition: Operand', () =>
  bridge.addDefinition({ term: 'Operand', definition: 'A numeric input provided to the calculator before an operator is applied.' }, consent)
);

// ---------------------------------------------------------------------------
// Phase 3: evidence (the design's empirical givens)
// ---------------------------------------------------------------------------
logHeader('Phase 3: evidence');

const evInput = attempt('addElement (evidence): user-input model', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.EVIDENCE,
    source: 'user-research',
    claim: 'Users enter operands via numeric keys and operators via dedicated buttons.',
  }, consent)
);

const evOutput = attempt('addElement (evidence): output model', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.EVIDENCE,
    source: 'design-decision',
    claim: 'The calculator displays one numeric result at a time on a single-line readout.',
  }, consent)
);

const evNumberDomain = attempt('addElement (evidence): number domain', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.EVIDENCE,
    source: 'design-decision',
    claim: 'All operands and results are double-precision floating-point numbers.',
  }, consent)
);

// ---------------------------------------------------------------------------
// Phase 4: propositions (truth claims, must be grounded in evidence)
// ---------------------------------------------------------------------------
logHeader('Phase 4: propositions');

const propFourOps = attempt('addElement (proposition): four operations supported', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.PROPOSITION,
    statement: 'The calculator supports exactly the four operations: add, subtract, multiply, divide.',
    grounding: evInput?.id ?? 'evidence_1',
    collapse_test: 'If any of {+, -, *, /} is missing, users cannot perform their stated tasks.',
    inference_pattern: INFERENCE_PATTERNS.GROUNDS_IMPLY_CONCLUSION,
  }, consent)
);

const propDeterministic = attempt('addElement (proposition): operations are deterministic', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.PROPOSITION,
    statement: 'For any fixed pair of operands and operator, the calculator produces a single deterministic result.',
    grounding: evNumberDomain?.id ?? 'evidence_3',
    collapse_test: 'If the same inputs yielded different results, the calculator would be unreliable.',
    inference_pattern: INFERENCE_PATTERNS.STRUCTURAL,
  }, consent)
);

// ---------------------------------------------------------------------------
// Phase 5: risks + resolutions
// ---------------------------------------------------------------------------
logHeader('Phase 5: risks and resolutions');

const riskDivByZero = attempt('addElement (risk): division by zero', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.RISK,
    statement: 'Division by zero would produce Infinity or NaN, which is not a meaningful calculator result.',
    severity: 'high',
  }, consent)
);

const riskOverflow = attempt('addElement (risk): numeric overflow', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.RISK,
    statement: 'Repeated multiplication can exceed JavaScript number-precision range.',
    severity: 'low',
  }, consent)
);

const resDivByZero = attempt('addElement (resolution): handle div-by-zero', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.RESOLUTION,
    statement: 'When the divisor is zero, display "Error" and require user to clear before next input.',
    addresses: riskDivByZero?.id ?? 'risk_1',
  }, consent)
);

const resOverflow = attempt('addElement (resolution): handle overflow', () =>
  bridge.addElement({
    idShape: ELEMENT_CATEGORIES.RESOLUTION,
    statement: 'When a result exceeds Number.MAX_SAFE_INTEGER, display in scientific notation; on Infinity, display "Overflow".',
    addresses: riskOverflow?.id ?? 'risk_2',
  }, consent)
);

// ---------------------------------------------------------------------------
// Phase 6: ratifications (turns proposition_decl into proposition, etc.)
// ---------------------------------------------------------------------------
logHeader('Phase 6: ratifications');

const elementsToRatify = [
  defCalculator, defOperator, defOperand,
  propFourOps, propDeterministic,
  resDivByZero, resOverflow,
];

for (const el of elementsToRatify) {
  if (!el?.id) continue;
  attempt(`ratifyElement: ${el.id}`, () =>
    bridge.ratifyElement({
      elementId: el.id,
      source: CONSENT_SOURCES.DESIGNER,
      // Some categories' ratify path still runs verifyArgsShape against the
      // idShape default (EVIDENCE) — supply fillers so shape-check passes.
      source_field: 'designer',
      claim: 'ratification',
    }, consent)
  );
}

// ---------------------------------------------------------------------------
// Phase 7: inspect state before closure attempt
// ---------------------------------------------------------------------------
logHeader('Phase 7: pre-closure inspection');

const proofState = attempt('getProofState', () => bridge.getProofState({}));
const datalog = attempt('renderDatalogProjection', () => bridge.renderDatalogProjection({}));
if (datalog) {
  console.log(`         datalog.facts.length = ${datalog.facts?.length}`);
  console.log(`         datalog.rules.length = ${datalog.rules?.length ?? 'n/a'}`);
}

// Check closure preconditions via direct queries
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

// ---------------------------------------------------------------------------
// Phase 8: presentClosingArgument
// ---------------------------------------------------------------------------
logHeader('Phase 8: presentClosingArgument');

attempt('presentClosingArgument', () => bridge.presentClosingArgument({
  source: 'designer', claim: 'closure-attempt',
}, consent));

// ---------------------------------------------------------------------------
// Phase 9: confirmClosureGo
// ---------------------------------------------------------------------------
logHeader('Phase 9: confirmClosureGo');

attempt('confirmClosureGo', () => bridge.confirmClosureGo({
  source: 'designer', claim: 'closure-confirm',
}, consent));

// ---------------------------------------------------------------------------
// Phase 10: final rendering
// ---------------------------------------------------------------------------
logHeader('Phase 10: final render');

const finalRender = attempt('renderStructuredProof', () => bridge.renderStructuredProof({}));
if (typeof finalRender === 'string') {
  console.log('--- Rendered proof (first 800 chars) ---');
  console.log(finalRender.slice(0, 800));
  console.log('--- end render preview ---');
}

const closingArgument = attempt('renderClosingArgument', () => bridge.renderClosingArgument({}));
if (closingArgument) {
  console.log(`         closingArgument keys: ${Object.keys(closingArgument).join(', ')}`);
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
