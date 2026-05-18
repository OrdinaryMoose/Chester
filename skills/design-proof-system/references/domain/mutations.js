import { ACTION_LABELS, CONSENT_SOURCES, ELEMENT_CATEGORIES, FRICTION_DISPOSITIONS, ID_PREFIXES } from './tags.js';
import { verifyArgsShape, _existsAnyCategory } from './schema.js';
import { translate, instantiateTemplate } from './translation.js';
import { verifyConsent, lookupAuthority } from './authority.js';
import { advance } from './lifecycle.js';
import { triggerGate as closureTriggerGate } from './closure-policy.js';
import * as render from './render.js';

// Each entry probes whether `id` belongs to that category by checking the EDB
// representation predicate at its declared arity. Order matters only for ambiguity
// (no element id should match multiple predicates by construction — id allocator
// uses category as the prefix). Used by RATIFY to resolve the target element's
// category at call time so per-category authority lookup can run.
const _CATEGORY_PROBES = [
  [ELEMENT_CATEGORIES.EVIDENCE,    'evidence',         3],
  [ELEMENT_CATEGORIES.RULE,        'rule_decl',        2],
  [ELEMENT_CATEGORIES.PERMISSION,  'permission_decl',  2],
  [ELEMENT_CATEGORIES.PROPOSITION, 'proposition_decl', 3],
  [ELEMENT_CATEGORIES.RISK,        'risk',             3],
  [ELEMENT_CATEGORIES.RESOLUTION,  'resolution_decl',  2],
  [ELEMENT_CATEGORIES.FRICTION,    'friction',         5],
  [ELEMENT_CATEGORIES.CONCERN,     'concern',          3],
  [ELEMENT_CATEGORIES.DEFINITION,  'definition_decl',  3],
];

function _resolveElementCategory(id, queryPort) {
  if (typeof id !== 'string' || id.length === 0) return null;
  for (const [category, pred, arity] of _CATEGORY_PROBES) {
    const pattern = [id, ...Array(arity - 1).fill('_')];
    if (queryPort.exists([pred, pattern])) return category;
  }
  return null;
}

// D11 pre-ratify vocabulary lint gate. Reads ratified `definition/3` rows (derived
// once a Definition element is ratified by per-element RULE_TEMPLATES). For each
// canonical term, scans the target element's string-valued fields for a case-insensitive
// substring match that is NOT the exact canonical form — i.e. a case variant — and
// returns the first violation it finds. Returns null when no definitions are ratified
// (AC-11.3) or when every field is clean.
function _vocabularyLintCheck(elementId, ports) {
  const ratifiedDefs = ports.query.query(['definition', [{ var: 'D' }, { var: 'T' }, { var: 'X' }]]);
  if (ratifiedDefs.length === 0) return null;
  const canonicalTerms = ratifiedDefs.map(r => r.T).filter(t => typeof t === 'string' && t.length > 0);
  if (canonicalTerms.length === 0) return null;

  const readPorts = { query: ports.query, explain: ports.explain };
  const record = render.renderElementDeep({ id: elementId }, readPorts);
  if (!record) return null;

  for (const [field, value] of Object.entries(record)) {
    if (typeof value !== 'string' || value.length === 0) continue;
    for (const term of canonicalTerms) {
      if (term === value) continue; // exact match of the entire field — skip (likely the Definition's own canonical_name field)
      const lowerValue = value.toLowerCase();
      const lowerTerm = term.toLowerCase();
      const idx = lowerValue.indexOf(lowerTerm);
      if (idx === -1) continue;
      const matchedSubstring = value.slice(idx, idx + term.length);
      if (matchedSubstring !== term) {
        return { field, value: matchedSubstring, canonicalTerm: term };
      }
    }
  }
  return null;
}

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

// Ten OperationSpec records. customPostCheck appears on 3 (manageFriction, presentClosingArgument, confirmClosureGo).
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
    resultShape: { id: true, fullRecord: true },
  },
  [ACTION_LABELS.REVISE]: {
    consentCategory: CONSENT_SOURCES.DESIGNER,
    preconditions: [],
    idShape: ELEMENT_CATEGORIES.EVIDENCE,
    // REVISE creates a NEW element (fresh id) and links it to the original via a
    // `superseded(new_id, args.supersedes)` metaFact. The original element is left
    // extant — operators who want to retire it should call withdrawElement separately.
    // The per-category translator runs first to produce the new element's facts;
    // we then append the supersession link.
    translate: (args, id, ts) => {
      const inner = translate(args.idShape, args, id, ts);
      return {
        baseFacts: inner.baseFacts,
        rules: inner.rules,
        metaFacts: [...inner.metaFacts, ['superseded', [id, args.supersedes]]],
      };
    },
    postconditions: [],
    clearsTwoYes: true,
    resultShape: { id: true, fullRecord: true },
  },
  // D12 — REVISE_PROPOSITION: atomic add+ratify for wording cleanup on Propositions.
  // Creates a NEW Proposition (fresh id) linked to the prior via `superseded` metaFact,
  // and emits BOTH DESIGNER and DESIGN_PARTNER approval+two_yes facts in the same
  // transaction so two_yes_complete derives for the new element without a separate
  // ratify call. The original element is left extant (no automatic retract/withdraw).
  // Operators who want to retire the old element should call withdrawElement separately.
  // Per-category authority routes through PROPOSITION.authority.ratify (DESIGNER ∪
  // DESIGN_PARTNER); see runOperation step 2 dispatch.
  [ACTION_LABELS.REVISE_PROPOSITION]: {
    consentCategory: [CONSENT_SOURCES.DESIGNER, CONSENT_SOURCES.DESIGN_PARTNER],
    preconditions: [],
    idShape: ELEMENT_CATEGORIES.PROPOSITION,
    translate: (args, id, ts) => {
      const inner = translate(ELEMENT_CATEGORIES.PROPOSITION, args, id, ts);
      return {
        baseFacts: [
          ...inner.baseFacts,
          ['approved', [id, CONSENT_SOURCES.DESIGNER, ts]],
          ['approved', [id, CONSENT_SOURCES.DESIGN_PARTNER, ts]],
          ['two_yes', [id, CONSENT_SOURCES.DESIGNER]],
          ['two_yes', [id, CONSENT_SOURCES.DESIGN_PARTNER]],
        ],
        rules: inner.rules,
        metaFacts: [...(inner.metaFacts ?? []), ['superseded', [id, args.supersedes]]],
      };
    },
    postconditions: [],
    clearsTwoYes: false,
    resultShape: { id: true, fullRecord: true },
  },
  // D3 (sprint-02-bug-fix-08) — REVISE_RESOLUTION: atomic add+designer-ratify for
  // wording cleanup on Resolutions. Designer-only consent per D1+D3 (Resolution is
  // a framing category; DESIGN_PARTNER is not licensed to ratify it). Only the
  // DESIGNER approval+two_yes facts are emitted in the same transaction — DESIGN_PARTNER
  // facts are NOT emitted. As a result, `two_yes_complete` does not derive for the
  // revised resolution; the `resolution(id, S)` derivation still fires from the single
  // DESIGNER approval row (approval-gated rule requires only one `approved` row).
  // Per-category authority routes through RESOLUTION.authority.ratify (DESIGNER-only).
  [ACTION_LABELS.REVISE_RESOLUTION]: {
    consentCategory: [CONSENT_SOURCES.DESIGNER],
    preconditions: [],
    idShape: ELEMENT_CATEGORIES.RESOLUTION,
    translate: (args, id, ts) => {
      const inner = translate(ELEMENT_CATEGORIES.RESOLUTION, args, id, ts);
      return {
        baseFacts: [
          ...inner.baseFacts,
          ['approved', [id, CONSENT_SOURCES.DESIGNER, ts]],
          ['two_yes', [id, CONSENT_SOURCES.DESIGNER]],
        ],
        rules: inner.rules,
        metaFacts: [...(inner.metaFacts ?? []), ['superseded', [id, args.supersedes]]],
      };
    },
    postconditions: [],
    clearsTwoYes: false,
    resultShape: { id: true, fullRecord: true },
  },
  [ACTION_LABELS.WITHDRAW]: {
    consentCategory: CONSENT_SOURCES.DESIGNER,
    preconditions: [],
    idShape: ELEMENT_CATEGORIES.EVIDENCE,
    // The verb's args are operation-shaped — only `id` matters. argShape overrides the
    // default idShape→CATEGORY_REGISTRY lookup in runOperation so verifyArgsShape checks
    // the actual args the WITHDRAW translator consumes, not EVIDENCE's element shape.
    // (Note: the per-category authority lookup in runOperation step 2 still defaults to
    // EVIDENCE here. Today this is harmless because every category's authority.withdraw
    // allowlist contains DESIGNER; a future category with a non-DESIGNER WITHDRAW source
    // would need this verb to discover the target element's actual category at call time.)
    argShape: {
      label: 'withdraw',
      requiredFields: ['id'],
      closedEnumFields: {},
    },
    translate: (args) => ({ baseFacts: [['withdrew', [args.id]]], rules: [], metaFacts: [] }),
    postconditions: [],
    clearsTwoYes: true,
    resultShape: {},
  },
  [ACTION_LABELS.RATIFY]: {
    consentCategory: CONSENT_SOURCES.DESIGNER, // Authorities for ratify are looked up per element category via authority.lookupAuthority.
    preconditions: [{ predicate: 'evidence', arity: 3 }], // weak: just confirms an element exists pre-derivation.
    idShape: ELEMENT_CATEGORIES.EVIDENCE,
    // RATIFY's args are operation-shaped ({elementId, source, idShape?}) — not element-shaped.
    // argShape overrides the default idShape→CATEGORY_REGISTRY lookup in runOperation so
    // verifyArgsShape checks only the fields RATIFY actually consumes. Without this, the
    // generic per-category requiredFields check throws SHAPE_INVALID on category-specific
    // fields the ratify caller has no reason to supply (e.g., 'label' for CONCERN, 'statement'
    // for PROPOSITION). Mirrors the WITHDRAW (line 101) and MANAGE_FRICTION (line 141) precedents.
    argShape: {
      label: 'ratify',
      requiredFields: ['elementId'],
      closedEnumFields: {},
    },
    // Writes two facts: `approved` (consumed by per-element rule templates for derivation,
    // existing semantics) and `two_yes` (purely observability — lets the two_yes_complete
    // derived predicate detect when both DESIGNER and DESIGN_PARTNER have ratified an
    // element, without altering existing single-source approval semantics).
    translate: (args, _, ts) => {
      const source = args.source ?? CONSENT_SOURCES.DESIGNER;
      return {
        baseFacts: [
          ['approved', [args.elementId, source, ts]],
          ['two_yes', [args.elementId, source]],
        ],
        rules: [],
        metaFacts: [],
      };
    },
    postconditions: [],
    clearsTwoYes: true,
    resultShape: {},
  },
  [ACTION_LABELS.MANAGE_FRICTION]: {
    consentCategory: CONSENT_SOURCES.DESIGNER,
    preconditions: [],
    idShape: ELEMENT_CATEGORIES.FRICTION,
    // The verb's args are operation-shaped (frictionId, disposition), not element-shaped
    // (shape, description). argShape overrides the default idShape→CATEGORY_REGISTRY lookup
    // in runOperation so verifyArgsShape checks the actual args the translator consumes.
    argShape: {
      label: 'manage_friction',
      requiredFields: ['frictionId', 'disposition'],
      closedEnumFields: { disposition: FRICTION_DISPOSITIONS },
    },
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
    argShape: { requiredFields: [], closedEnumFields: {}, label: 'present_closing_argument' },
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
  // For verbs whose target element category is determinable from args (ADD/REVISE/WITHDRAW),
  // consult CATEGORY_REGISTRY[idShape].authority[action] — that's the authoritative per-category
  // allowlist. It's how FRICTION admits SYSTEM-source consent for automated detection while
  // keeping DESIGNER-only on most other categories. RATIFY's target category is determined
  // by looking up the existing element via _resolveElementCategory (the spec comment on the
  // RATIFY OperationSpec records this design intent). For verbs without per-action authority
  // mapping (manage_friction, present_closing_argument, confirm_closure_go, open_proof),
  // fall back to spec.consentCategory.
  const targetShape = args.idShape ?? spec.idShape;
  let perCategoryAuthority = [];
  if (verbName === ACTION_LABELS.ADD || verbName === ACTION_LABELS.REVISE || verbName === ACTION_LABELS.WITHDRAW) {
    perCategoryAuthority = lookupAuthority(targetShape, verbName);
  } else if (verbName === ACTION_LABELS.RATIFY) {
    const resolved = _resolveElementCategory(args.elementId, ports.query);
    if (resolved) perCategoryAuthority = lookupAuthority(resolved, ACTION_LABELS.RATIFY);
  } else if (verbName === ACTION_LABELS.REVISE_PROPOSITION || verbName === ACTION_LABELS.REVISE_RESOLUTION) {
    // D12: route through the per-category ratify authority — these verbs perform
    // an atomic add+ratify on the new element.
    perCategoryAuthority = lookupAuthority(targetShape, ACTION_LABELS.RATIFY);
  }
  const allowedSources = perCategoryAuthority.length > 0 ? perCategoryAuthority : spec.consentCategory;
  verifyConsent(allowedSources, consent, ports.consent);

  // §6.1 step 2b: REVISE requires args.idShape so the per-category shape-check resolves
  // to the correct schema. Without this guard, REVISE without idShape silently defaults
  // to spec.idShape (EVIDENCE) and produces a misleading "missing source for evidence"
  // error when the operator passed e.g. a proposition id. Run before step 3 so the
  // shape-check sees a meaningful targetShape.
  if (verbName === ACTION_LABELS.REVISE && !args.idShape) {
    throw Object.assign(new Error('SHAPE_INVALID: REVISE requires args.idShape (one of ELEMENT_CATEGORIES) so the shape-check resolves to the correct per-category schema'), { code: 'SHAPE_INVALID', field: 'idShape' });
  }

  // §6.1 step 3: verify shape
  // spec.argShape (when present) is an inline operation-arg descriptor used by verbs whose
  // args don't match an element-category shape (e.g. MANAGE_FRICTION). When absent, fall back
  // to the same targetShape (element-category shape) used for consent lookup.
  // ADD/REVISE thread the query port through so the referenceFields directive can verify
  // referenced ids exist in the EDB. Other verbs pass null — the loop short-circuits.
  const argShapeTarget = spec.argShape ?? targetShape;
  const isAddOrRevise = verbName === ACTION_LABELS.ADD
    || verbName === ACTION_LABELS.REVISE
    || verbName === ACTION_LABELS.REVISE_PROPOSITION
    || verbName === ACTION_LABELS.REVISE_RESOLUTION;
  verifyArgsShape(args, argShapeTarget, isAddOrRevise ? ports.query : null);

  // §6.1 step 3b: REVISE requires args.supersedes naming the prior element id. Validated
  // here rather than in argShape because REVISE also needs the per-category fields (which
  // argShape would short-circuit if it were the only descriptor used).
  if (verbName === ACTION_LABELS.REVISE
      || verbName === ACTION_LABELS.REVISE_PROPOSITION
      || verbName === ACTION_LABELS.REVISE_RESOLUTION) {
    if (typeof args.supersedes !== 'string' || args.supersedes.length === 0) {
      throw Object.assign(new Error('SHAPE_INVALID: revise verbs require args.supersedes (string) naming the element being revised'), { code: 'SHAPE_INVALID', field: 'supersedes' });
    }
  }

  // §6.1 step 4: begin tx
  const tx = ports.tx.begin();
  let id = null;
  try {
    // §6.1 step 5: assert facts + define rules
    // D1 invariant: RATIFY MUST NOT advance the ID allocator. The ratify translate path
    // uses args.elementId directly (already known); the allocator slot would be discarded.
    // Counter-parity: after N add+ratify cycles for a single category, idAllocator.highWater
    // equals N (not 2N).
    // D2: ADD accepts an optional caller-supplied id, validated for prefix-match against
    // ID_PREFIXES and uniqueness against the EDB. Task 12 will extend the ADD-only check
    // below to also cover REVISE_PROPOSITION and REVISE_RESOLUTION once those ACTION_LABELS
    // entries land in tags.js.
    if (verbName !== ACTION_LABELS.RATIFY) {
      if ((verbName === ACTION_LABELS.ADD
           || verbName === ACTION_LABELS.REVISE_PROPOSITION
           || verbName === ACTION_LABELS.REVISE_RESOLUTION) && args.id) {
        const expectedPrefix = ID_PREFIXES[targetShape];
        if (!expectedPrefix || !args.id.startsWith(expectedPrefix)) {
          throw new DomainError({ code: 'ID_PREFIX_MISMATCH', suppliedId: args.id, expectedPrefix: expectedPrefix ?? '<unknown>' });
        }
        if (_existsAnyCategory(ports.query, args.id)) {
          throw new DomainError({ code: 'DUPLICATE_ID', suppliedId: args.id });
        }
        id = args.id;
      } else {
        id = ports.ids.next(targetShape);
      }
    }
    const ts = ports.clock.now();
    const { baseFacts, rules, metaFacts } = spec.translate(args, id, ts);
    for (const [pred, a] of baseFacts) ports.facts.assertFact(pred, a);
    for (const r of rules) ports.rules.defineRule(r.ruleId, r.headAtom, r.bodyAtoms, r.metadata);
    for (const [pred, a] of metaFacts) ports.facts.assertFact(pred, a);
    // Phase-C template instantiation for approval-gated categories. Fires for both ADD
    // and REVISE: REVISE produces a new element with its own id, which needs its own
    // per-element approval rule installed so that ratification can later derive the
    // public predicate (proposition/resolution/definition/concern_status) for it.
    if ([ELEMENT_CATEGORIES.PROPOSITION, ELEMENT_CATEGORIES.RESOLUTION, ELEMENT_CATEGORIES.DEFINITION, ELEMENT_CATEGORIES.CONCERN].includes(targetShape)
        && (verbName === ACTION_LABELS.ADD
            || verbName === ACTION_LABELS.REVISE
            || verbName === ACTION_LABELS.REVISE_PROPOSITION
            || verbName === ACTION_LABELS.REVISE_RESOLUTION)) {
      instantiateTemplate(targetShape, id, ports.rules);
    }

    // CONCERN ratification cleanup: addElement(CONCERN) writes concern_status(id, 'draft')
    // as EDB; the CONCERN per-element rule template derives concern_status(id, 'ratified')
    // once approved. Without retracting the 'draft' row at ratify time, both rows coexist
    // — concern_status queries return mixed-state results and renderDatalogProjection
    // includes the obsolete 'draft' row. Retract on ratify so concern_status reflects
    // only the current lifecycle state. Safe on non-CONCERN ratifications: retractFact
    // returns false on missing facts (no throw). Gated on the resolved category to keep
    // intent explicit.
    if (verbName === ACTION_LABELS.RATIFY) {
      const ratifyTarget = _resolveElementCategory(args.elementId, ports.query);
      if (ratifyTarget === ELEMENT_CATEGORIES.CONCERN) {
        ports.facts.retractFact('concern_status', [args.elementId, 'draft']);
      }
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

    // §6.1 step 8b (D11): pre-ratify vocabulary lint. Blocking gate before customPostCheck.
    if (verbName === ACTION_LABELS.RATIFY) {
      const violation = _vocabularyLintCheck(args.elementId, ports);
      if (violation) {
        throw new DomainError({ code: 'VOCABULARY_LINT_VIOLATION', ...violation });
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
  let result = spec.resultShape && 'id' in spec.resultShape ? { id } : {};
  if (spec.resultShape && spec.resultShape.fullRecord && id) {
    const readPorts = { query: ports.query, explain: ports.explain };
    const deep = render.renderElementDeep({ id }, readPorts);
    if (deep) {
      // Strip render-side artifacts before merging — `predicate` and `withdrawn`
      // belong to the read-side rendering API, not the mutation result contract.
      const { predicate: _p, withdrawn: _w, ...fields } = deep;
      result = { ...result, ...fields };
    }
  }

  // §6.1 step 13: advance round if applicable
  if (spec.clearsTwoYes) advance(ports);

  // §6.1 step 14: return
  return result;
}
