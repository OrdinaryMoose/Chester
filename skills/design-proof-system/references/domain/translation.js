import { ELEMENT_CATEGORIES } from './tags.js';

// Translators — one per element category. Each returns {baseFacts, rules, metaFacts}.
// baseFacts: Array<[predicate, args]> — assertFact inputs.
// rules:     Array<{ruleId, headAtom, bodyAtoms, metadata}> — defineRule inputs (parameterized).
//            Field names align with Engine public surface per spec-02 §"Engine public-surface signatures";
//            headAtom is `[predicate, [...args]]`, bodyAtoms is an array of `[predicate, [...args]]`.
// metaFacts: Array<[predicate, args]> — provenance / lineage / created_at metadata.
//
// Cascade reference: 05-domain-spec.md §2 (translation table), §3.x (per-category schemas), ADR-0003 (approval-as-body-literal).

const TRANSLATORS = Object.freeze({
  [ELEMENT_CATEGORIES.EVIDENCE]: (args, id, ts) => ({
    baseFacts: [['evidence', [id, args.source, args.statement]]],
    rules: [],
    metaFacts: [['created_at', [id, ts]]],
  }),
  [ELEMENT_CATEGORIES.RULE]: (args, id, ts) => ({
    baseFacts: [['rule_decl', [id, args.statement]]],
    rules: [],
    metaFacts: [['created_at', [id, ts]]],
  }),
  [ELEMENT_CATEGORIES.PERMISSION]: (args, id, ts) => ({
    baseFacts: [
      ['permission_decl', [id, args.statement]],
      ['permission', [id, args.statement, args.relieves]],
      ...(typeof args.scope_constraint === 'string' && args.scope_constraint.length > 0
        ? [['permission_scope', [id, args.scope_constraint]]]
        : []),
    ],
    rules: [],
    metaFacts: [['created_at', [id, ts]]],
  }),
  [ELEMENT_CATEGORIES.PROPOSITION]: (args, id, ts) => ({
    baseFacts: [
      ['proposition_decl', [id, args.statement, args.inference_pattern]],
      ...args.grounding.map(eid => ['proposition_grounding', [id, eid]]),
      ['collapse_test', [id, args.collapse_test]],
      ['reasoning_chain', [id, args.reasoning_chain]],
      ...(Array.isArray(args.rejected_alternatives)
        ? args.rejected_alternatives.map(alt => ['rejected_alternative', [id, alt.statement, alt.rejection_reason]])
        : []),
    ],
    rules: [], // The approval-gated rule lives in RULE_TEMPLATES (Phase B); per-element instantiation happens in Phase C via instantiateTemplate.
    metaFacts: [['created_at', [id, ts]]],
  }),
  [ELEMENT_CATEGORIES.RISK]: (args, id, ts) => ({
    baseFacts: [
      ['risk', [id, args.statement, args.severity ?? 'unspecified']],
      ...(Array.isArray(args.basis) ? args.basis.map(eid => ['risk_basis', [id, eid]]) : []),
    ],
    rules: [],
    metaFacts: [['created_at', [id, ts]]],
  }),
  [ELEMENT_CATEGORIES.RESOLUTION]: (args, id, ts) => ({
    baseFacts: [
      ['resolution_decl', [id, args.statement]],
      ['resolution_anchor', [id, args.problem_anchor]],
      ...args.grounding.map(pid => ['resolution_grounding', [id, pid]]),
    ],
    rules: [],
    metaFacts: [['created_at', [id, ts]]],
  }),
  [ELEMENT_CATEGORIES.FRICTION]: (args, id, ts) => ({
    baseFacts: [['friction', [id, args.friction_shape, args.anchor_a, args.anchor_b, args.disposition]]],
    rules: [],
    metaFacts: [['created_at', [id, ts]]],
  }),
  [ELEMENT_CATEGORIES.CONCERN]: (args, id, ts) => {
    const baseFacts = [
      ['concern', [id, args.label, args.description ?? '']],
      ['concern_status', [id, 'draft']],
    ];
    if (Array.isArray(args.notes)) {
      for (const note of args.notes) baseFacts.push(['concern_note', [id, note]]);
    }
    return { baseFacts, rules: [], metaFacts: [['created_at', [id, ts]]] };
  },
  [ELEMENT_CATEGORIES.DEFINITION]: (args, id, ts) => ({
    baseFacts: [
      ['definition_decl', [id, args.canonical_name, args.definition]],
      // definition_scope discriminates legitimate dual-use of a term from real overlaps.
      // overlap_rule (friction-policy.js) requires same term AND same scope to fire, so
      // operators with intentionally-distinct definitions of "Session" can pass
      // scope:'web' vs scope:'os' and avoid the overlap detection. Unspecified scope
      // defaults to 'global' — all unscoped definitions share scope, preserving the
      // pre-fix behavior for callers who don't think about scoping.
      ['definition_scope', [id, args.scope ?? 'global']],
      // definition_self(id, id) is the Datalog-inequality trick: the overlap_rule
      // body negates definition_self(T1, T2) to exclude reflexive matches (T1=T2).
      // Pure Datalog has no inequality predicate, so we materialize self-reference
      // as an EDB fact and negate it. For non-reflexive bindings (T1≠T2),
      // definition_self(T1, T2) doesn't exist and the negation succeeds.
      ['definition_self', [id, id]],
    ],
    rules: [],
    metaFacts: [['created_at', [id, ts]]],
  }),
});

export function translate(category, args, id, ts) {
  const t = TRANSLATORS[category];
  if (!t) throw Object.assign(new Error(`UNKNOWN_CATEGORY: ${category}`), { code: 'UNKNOWN_CATEGORY' });
  return t(args, id, ts);
}

// RULE_TEMPLATES — parameterized rule shapes for approval-gated categories.
// Each template, when instantiated with an element id, produces a defineRule call
// whose body literal includes ['approved', [id, ...]] per ADR-0003.

export const RULE_TEMPLATES = Object.freeze({
  [ELEMENT_CATEGORIES.PROPOSITION]: Object.freeze({
    elementCategory: ELEMENT_CATEGORIES.PROPOSITION,
    build: (elementId) => ({
      ruleId: `${elementId}_approved_implies_proposition`,
      headAtom: ['proposition', [elementId, 'S']],
      bodyAtoms: [
        ['proposition_decl', [elementId, 'S', '_']],
        ['approved', [elementId, '_', '_']],
      ],
      metadata: { domain_concept: 'necessary_condition', element: elementId },
    }),
  }),
  [ELEMENT_CATEGORIES.RESOLUTION]: Object.freeze({
    elementCategory: ELEMENT_CATEGORIES.RESOLUTION,
    build: (elementId) => ({
      ruleId: `${elementId}_approved_implies_resolution`,
      headAtom: ['resolution', [elementId, 'S']],
      bodyAtoms: [
        ['resolution_decl', [elementId, 'S']],
        ['approved', [elementId, '_', '_']],
      ],
      metadata: { domain_concept: 'resolution', element: elementId },
    }),
  }),
  [ELEMENT_CATEGORIES.DEFINITION]: Object.freeze({
    elementCategory: ELEMENT_CATEGORIES.DEFINITION,
    build: (elementId) => ({
      ruleId: `${elementId}_approved_implies_definition`,
      headAtom: ['definition', [elementId, 'T', 'D']],
      bodyAtoms: [
        ['definition_decl', [elementId, 'T', 'D']],
        ['approved', [elementId, '_', '_']],
      ],
      metadata: { domain_concept: 'definition', element: elementId },
    }),
  }),
  [ELEMENT_CATEGORIES.CONCERN]: Object.freeze({
    elementCategory: ELEMENT_CATEGORIES.CONCERN,
    build: (elementId) => ({
      ruleId: `${elementId}_approved_implies_concern_status_ratified`,
      headAtom: ['concern_status', [elementId, 'ratified']],
      bodyAtoms: [
        ['concern', [elementId, '_', '_']],
        ['approved', [elementId, '_', '_']],
      ],
      metadata: { domain_concept: 'concern_status_ratified', element: elementId },
    }),
  }),
});

export function registerRuleTemplates(rulePorts) {
  // Phase B: install one anchor rule per approval-gated category using a sentinel
  // placeholder id. Per-element rules are installed at Phase C via instantiateTemplate.
  // The anchor rule's purpose is to surface stratification failures at boot.
  //
  // Per-template try/catch annotates the throw with `templateId` and `ruleId` so the
  // domain-bridge outer catch can populate DomainBootError({recordId: templateId, ...})
  // — spec AC-4.3 and AC-5.1 require the error payload to carry the failing template id.
  for (const [cat, template] of Object.entries(RULE_TEMPLATES)) {
    const placeholder = `__template_anchor__${cat}`;
    const r = template.build(placeholder);
    try {
      rulePorts.defineRule(r.ruleId, r.headAtom, r.bodyAtoms, { ...r.metadata, isTemplateAnchor: true });
    } catch (innerErr) {
      const err = new Error(`Phase B defineRule failed for template '${cat}' (ruleId='${r.ruleId}'): ${innerErr.message}`);
      err.templateId = cat;
      err.ruleId = r.ruleId;
      err.cause = innerErr;
      throw err;
    }
  }
}

export function instantiateTemplate(idShape, newId, rulePorts) {
  const template = RULE_TEMPLATES[idShape];
  if (!template) return; // Non-approval-gated category — no per-element rule.
  const r = template.build(newId);
  rulePorts.defineRule(r.ruleId, r.headAtom, r.bodyAtoms, r.metadata);
}

// EDB-predicate declaration. Returns the set of base-fact predicate names this module
// emits. Used by boot-validators to construct validPredicates (Phase-A rule heads ∪
// EDB base-fact predicates). Per the spec's Data Flow §"Session boot" step 5.

const EDB_PREDICATES = Object.freeze(new Set([
  'evidence', 'rule_decl', 'permission_decl', 'permission', 'permission_scope', 'proposition_decl', 'proposition_grounding',
  'collapse_test', 'reasoning_chain', 'rejected_alternative',
  'risk', 'risk_basis', 'resolution_decl', 'resolution_anchor', 'resolution_grounding', 'friction',
  'friction_disposition', 'definition_decl', 'definition_scope', 'definition_self',
  'concern', 'concern_status', 'concern_note',
  'approved', 'two_yes',
  'closure_committed', 'closure_pending', 'phase', 'round', 'created_at',
  'withdrew', 'superseded',
]));

export function getDeclaredEDBPredicates() {
  return new Set(EDB_PREDICATES);
}
