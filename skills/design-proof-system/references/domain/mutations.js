import { ACTION_LABELS, CONSENT_SOURCES, ELEMENT_CATEGORIES } from './tags.js';
import { verifyArgsShape } from './schema.js';
import { translate, instantiateTemplate } from './translation.js';
import { verifyConsent } from './authority.js';
import { advance } from './lifecycle.js';
import { triggerGate as closureTriggerGate } from './closure-policy.js';

export class DomainError extends Error {
  constructor(payload) {
    super(payload.message ?? payload.code);
    this.name = 'DomainError';
    Object.assign(this, payload);
  }
}

export class POST_COMMIT_SAVE_FAILED extends DomainError {
  constructor(cause) {
    super({ code: 'POST_COMMIT_SAVE_FAILED', message: 'POST_COMMIT_SAVE_FAILED: Engine committed but save failed', engineCommitted: true, cause });
    this.name = 'POST_COMMIT_SAVE_FAILED';
  }
}

// Eight OperationSpec records. customPostCheck appears on 3 (manageFriction, presentClosingArgument, confirmClosureGo).
export const OPERATION_SPECS = Object.freeze({
  [ACTION_LABELS.OPEN_PROOF]: {
    consentCategory: CONSENT_SOURCES.DESIGNER,
    preconditions: [],
    idShape: ELEMENT_CATEGORIES.EVIDENCE, // Open-proof submission expands to addElement calls; the verb itself does not allocate an id.
    translate: () => ({ baseFacts: [], rules: [], metaFacts: [] }),
    postconditions: [],
    clearsTwoYes: true,
    resultShape: {},
  },
  [ACTION_LABELS.ADD]: {
    consentCategory: CONSENT_SOURCES.DESIGNER,
    preconditions: [],
    idShape: ELEMENT_CATEGORIES.EVIDENCE, // overridden by args.idShape at runtime — actual category dispatch happens in translate.
    translate: (args, id, ts) => translate(args.idShape, args, id, ts),
    postconditions: [],
    clearsTwoYes: true,
    resultShape: { id: 'string' },
  },
  [ACTION_LABELS.REVISE]: {
    consentCategory: CONSENT_SOURCES.DESIGNER,
    preconditions: [],
    idShape: ELEMENT_CATEGORIES.EVIDENCE,
    translate: (args, id, ts) => translate(args.idShape, args, id, ts),
    postconditions: [],
    clearsTwoYes: true,
    resultShape: { id: 'string' },
  },
  [ACTION_LABELS.WITHDRAW]: {
    consentCategory: CONSENT_SOURCES.DESIGNER,
    preconditions: [],
    idShape: ELEMENT_CATEGORIES.EVIDENCE,
    translate: (args) => ({ baseFacts: [['withdrew', [args.id]]], rules: [], metaFacts: [] }),
    postconditions: [],
    clearsTwoYes: true,
    resultShape: {},
  },
  [ACTION_LABELS.RATIFY]: {
    consentCategory: CONSENT_SOURCES.DESIGNER, // Authorities for ratify are looked up per element category via authority.lookupAuthority.
    preconditions: [{ predicate: 'evidence', arity: 3 }], // weak: just confirms an element exists pre-derivation.
    idShape: ELEMENT_CATEGORIES.EVIDENCE,
    translate: (args, _, ts) => ({ baseFacts: [['approved', [args.elementId, args.source ?? CONSENT_SOURCES.DESIGNER, ts]]], rules: [], metaFacts: [] }),
    postconditions: [],
    clearsTwoYes: true,
    resultShape: {},
  },
  [ACTION_LABELS.MANAGE_FRICTION]: {
    consentCategory: CONSENT_SOURCES.DESIGNER,
    preconditions: [],
    idShape: ELEMENT_CATEGORIES.FRICTION,
    translate: (args, id, ts) => ({ baseFacts: [['friction_disposition', [args.frictionId, args.disposition]]], rules: [], metaFacts: [] }),
    postconditions: [],
    customPostCheck: (args, readPorts) => null, // friction-policy.applyDisposition; placeholder returns null.
    clearsTwoYes: true,
    resultShape: {},
  },
  [ACTION_LABELS.PRESENT_CLOSING_ARGUMENT]: {
    consentCategory: CONSENT_SOURCES.DESIGNER,
    preconditions: [],
    idShape: ELEMENT_CATEGORIES.EVIDENCE,
    translate: () => ({ baseFacts: [['closure_pending', []]], rules: [], metaFacts: [] }),
    postconditions: [],
    customPostCheck: (args, readPorts) => closureTriggerGate(args, readPorts),
    clearsTwoYes: true,
    resultShape: {},
  },
  [ACTION_LABELS.CONFIRM_CLOSURE_GO]: {
    consentCategory: CONSENT_SOURCES.DESIGNER,
    preconditions: [],
    idShape: ELEMENT_CATEGORIES.EVIDENCE,
    translate: () => ({ baseFacts: [['closure_committed', []]], rules: [], metaFacts: [] }),
    postconditions: [],
    customPostCheck: (args, readPorts) => closureTriggerGate(args, readPorts),
    clearsTwoYes: false,
    resultShape: {},
  },
});

/**
 * runOperation implements Domain Spec §6.1 line-by-line.
 * @param {string} verbName
 * @param {object} args
 * @param {{source: string}} consent
 * @param {object} ports FullPorts
 */
export function runOperation(verbName, args, consent, ports) {
  // §6.1 step 1: read spec
  const spec = OPERATION_SPECS[verbName];
  if (!spec) throw new DomainError({ code: 'UNKNOWN_VERB', verbName });

  // §6.1 step 2: verify consent
  verifyConsent(spec.consentCategory, consent, ports.consent);

  // §6.1 step 3: verify shape
  const targetShape = args.idShape ?? spec.idShape;
  verifyArgsShape(args, targetShape);

  // §6.1 step 4: begin tx
  const tx = ports.tx.begin();
  let id = null;
  try {
    // §6.1 step 5: assert facts + define rules
    id = ports.ids.next(targetShape);
    const ts = ports.clock.now();
    const { baseFacts, rules, metaFacts } = spec.translate(args, id, ts);
    for (const [pred, a] of baseFacts) ports.facts.assertFact(pred, a);
    for (const r of rules) ports.rules.defineRule(r.ruleId, r.headAtom, r.bodyAtoms, r.metadata);
    for (const [pred, a] of metaFacts) ports.facts.assertFact(pred, a);
    // Phase-C template instantiation for approval-gated categories.
    if ([ELEMENT_CATEGORIES.PROPOSITION, ELEMENT_CATEGORIES.RESOLUTION, ELEMENT_CATEGORIES.DEFINITION, ELEMENT_CATEGORIES.CONCERN].includes(targetShape) && verbName === ACTION_LABELS.ADD) {
      instantiateTemplate(targetShape, id, ports.rules);
    }

    // §6.1 step 6: derive (queries auto-trigger; explicit for clarity)
    ports.query.derive();

    // §6.1 step 7: preconditions
    const readView = { query: ports.query, explain: ports.explain };
    for (const pat of spec.preconditions) {
      if (!ports.query.exists([pat.predicate, Array(pat.arity).fill('_')])) {
        throw new DomainError({ code: 'PRECONDITION_FAILED', predicate: pat.predicate });
      }
    }

    // §6.1 step 8: postconditions
    for (const pat of spec.postconditions) {
      if (!ports.query.exists([pat.predicate, Array(pat.arity).fill('_')])) {
        throw new DomainError({ code: 'POSTCONDITION_FAILED', predicate: pat.predicate });
      }
    }

    // §6.1 step 9: customPostCheck if present
    if (spec.customPostCheck) {
      const err = spec.customPostCheck(args, readView);
      if (err) throw new DomainError(err);
    }

    // §6.1 step 10: commit
    ports.tx.commit(tx);
  } catch (err) {
    // saveState (step 11) is OUTSIDE this try block, so POST_COMMIT_SAVE_FAILED can never
    // reach this catch. Any error here is a transaction-scoped failure (steps 5–9); always
    // rollback and re-throw.
    ports.tx.rollback(tx);
    throw err;
  }

  // §6.1 step 11: save (outside tx; divergence is a typed Domain error)
  try {
    ports.persist.saveState({ /* serialized log entry */ verb: verbName, args, ts: ports.clock.now() });
  } catch (cause) {
    throw new POST_COMMIT_SAVE_FAILED(cause);
  }

  // §6.1 step 12: build result
  const result = spec.resultShape && 'id' in spec.resultShape ? { id } : {};

  // §6.1 step 13: advance round if applicable
  if (spec.clearsTwoYes) advance(ports);

  // §6.1 step 14: return
  return result;
}
