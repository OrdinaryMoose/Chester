// Per-category required fields, authority, render section. Canonical definitions: ./VOCABULARY.md.
import { ELEMENT_CATEGORIES, CONSENT_SOURCES, RENDER_SECTIONS, INFERENCE_PATTERNS, FRICTION_SHAPES, FRICTION_DISPOSITIONS, EVIDENCE_SOURCE_ENUM, assertExhaustive } from './tags.js';

// Private partial mirror of mutations.js's `_CATEGORY_PROBES`. Cannot import directly
// (circular: mutations.js imports verifyArgsShape from schema.js). Keyed by
// ELEMENT_CATEGORIES string value (e.g. 'rule', 'permission') → [declaration
// predicate, arity]. MUST stay synchronized with `_CATEGORY_PROBES` in mutations.js
// AND `declPredsByCategory` in translation.js (the latter used by D5's
// extractAllocatorHighWaterMarks for legacy-snapshot allocator recovery) — any
// time a category's declaration predicate or arity changes, ALL THREE tables
// update in the same commit. Probe-table sync structural test (DEF-7) is
// deferred to a future design pass per sprint-02-bug-fix-0306 spec Non-Goals;
// until that test lands, the discipline is human-enforced.
// Wildcard '*' (handled in _existsCategory) iterates all entries.
const _CATEGORY_PROBES_SCHEMA = Object.freeze({
  [ELEMENT_CATEGORIES.EVIDENCE]: ['evidence', 3],
  [ELEMENT_CATEGORIES.RULE]: ['rule_decl', 2],
  [ELEMENT_CATEGORIES.PERMISSION]: ['permission_decl', 2],
  [ELEMENT_CATEGORIES.PROPOSITION]: ['proposition_decl', 3],
  [ELEMENT_CATEGORIES.RISK]: ['risk', 3],
  [ELEMENT_CATEGORIES.RESOLUTION]: ['resolution_decl', 2],
  [ELEMENT_CATEGORIES.FRICTION]: ['friction', 5],     // was 4 — parallel sync with _CATEGORY_PROBES in mutations.js required (AC-12.3)
  [ELEMENT_CATEGORIES.CONCERN]: ['concern', 3],
  [ELEMENT_CATEGORIES.DEFINITION]: ['definition_decl', 3],
});

export function _existsAnyCategory(readPort, id) {
  for (const [pred, arity] of Object.values(_CATEGORY_PROBES_SCHEMA)) {
    const pattern = [id, ...Array(arity - 1).fill('_')];
    if (readPort.exists([pred, pattern])) return true;
  }
  return false;
}

function _existsCategory(readPort, id, categoryKey) {
  if (categoryKey === '*') return _existsAnyCategory(readPort, id);
  // categoryKey is an ELEMENT_CATEGORIES.* string value (e.g. 'rule', 'permission').
  // Direct table lookup — ELEMENT_CATEGORIES.PERMISSION === 'permission' so this
  // matches both descriptor declarations and the symbol-keyed-via-computed-property
  // construction of _CATEGORY_PROBES_SCHEMA above.
  const probe = _CATEGORY_PROBES_SCHEMA[categoryKey];
  if (!probe) return false;
  const [pred, arity] = probe;
  const pattern = [id, ...Array(arity - 1).fill('_')];
  return readPort.exists([pred, pattern]);
}

// D4: probe membership across multiple candidate categories. Returns true if id exists
// in any of the listed categories. Used by verifyArgsShape for array-valued referenceFields.
function _existsOneOf(readPort, id, categoryKeys) {
  for (const key of categoryKeys) {
    if (_existsCategory(readPort, id, key)) return true;
  }
  return false;
}

export const CATEGORY_REGISTRY = Object.freeze({
  [ELEMENT_CATEGORIES.EVIDENCE]: Object.freeze({
    requiredFields: ['source', 'statement'],
    optionalFields: ['url', 'citation'],
    nonEmptyStringFields: [],
    nonEmptyArrayFields: [],
    sourceConstraint: CONSENT_SOURCES.DESIGNER,
    idShape: ELEMENT_CATEGORIES.EVIDENCE,
    renderSection: RENDER_SECTIONS.GIVENS,
    closedEnumFields: { source: EVIDENCE_SOURCE_ENUM },
    referenceFields: {},
    authority: { add: [CONSENT_SOURCES.DESIGNER], revise: [CONSENT_SOURCES.DESIGNER], withdraw: [CONSENT_SOURCES.DESIGNER], ratify: [CONSENT_SOURCES.DESIGNER] },
  }),
  [ELEMENT_CATEGORIES.RULE]: Object.freeze({
    requiredFields: ['statement'],
    optionalFields: ['rationale'],
    nonEmptyStringFields: [],
    nonEmptyArrayFields: [],
    sourceConstraint: CONSENT_SOURCES.DESIGNER,
    idShape: ELEMENT_CATEGORIES.RULE,
    renderSection: RENDER_SECTIONS.INFERENTIAL_FRAMEWORK,
    closedEnumFields: {},
    referenceFields: {},
    authority: { add: [CONSENT_SOURCES.DESIGNER], revise: [CONSENT_SOURCES.DESIGNER], withdraw: [CONSENT_SOURCES.DESIGNER], ratify: [CONSENT_SOURCES.DESIGNER] },
  }),
  [ELEMENT_CATEGORIES.PERMISSION]: Object.freeze({
    requiredFields: ['statement', 'relieves'],
    optionalFields: ['rationale', 'scope_constraint'],
    nonEmptyStringFields: [],
    nonEmptyArrayFields: [],
    sourceConstraint: CONSENT_SOURCES.DESIGNER,
    idShape: ELEMENT_CATEGORIES.PERMISSION,
    renderSection: RENDER_SECTIONS.INFERENTIAL_FRAMEWORK,
    closedEnumFields: {},
    referenceFields: { relieves: 'rule' },
    authority: { add: [CONSENT_SOURCES.DESIGNER], revise: [CONSENT_SOURCES.DESIGNER], withdraw: [CONSENT_SOURCES.DESIGNER], ratify: [CONSENT_SOURCES.DESIGNER] },
  }),
  [ELEMENT_CATEGORIES.PROPOSITION]: Object.freeze({
    requiredFields: ['statement', 'grounding', 'collapse_test', 'inference_pattern', 'reasoning_chain'],
    optionalFields: ['scope', 'rejected_alternatives'],
    nonEmptyStringFields: ['reasoning_chain'],
    nonEmptyArrayFields: ['grounding'],
    sourceConstraint: CONSENT_SOURCES.DESIGNER,
    idShape: ELEMENT_CATEGORIES.PROPOSITION,
    renderSection: RENDER_SECTIONS.LEMMAS,
    closedEnumFields: { inference_pattern: INFERENCE_PATTERNS },
    referenceFields: { grounding: '*' },
    authority: { add: [CONSENT_SOURCES.DESIGNER], revise: [CONSENT_SOURCES.DESIGNER], withdraw: [CONSENT_SOURCES.DESIGNER], ratify: [CONSENT_SOURCES.DESIGNER, CONSENT_SOURCES.DESIGN_PARTNER] },
  }),
  [ELEMENT_CATEGORIES.RISK]: Object.freeze({
    requiredFields: ['statement', 'basis'],
    optionalFields: ['severity'],
    nonEmptyStringFields: [],
    nonEmptyArrayFields: ['basis'],
    sourceConstraint: CONSENT_SOURCES.DESIGNER,
    idShape: ELEMENT_CATEGORIES.RISK,
    renderSection: RENDER_SECTIONS.PROBLEM,
    closedEnumFields: {},
    referenceFields: { basis: '*' },
    authority: { add: [CONSENT_SOURCES.DESIGNER], revise: [CONSENT_SOURCES.DESIGNER], withdraw: [CONSENT_SOURCES.DESIGNER], ratify: [CONSENT_SOURCES.DESIGNER] },
  }),
  [ELEMENT_CATEGORIES.RESOLUTION]: Object.freeze({
    requiredFields: ['statement', 'problem_anchor', 'grounding'],
    optionalFields: [],
    nonEmptyStringFields: [],
    nonEmptyArrayFields: ['grounding'],
    sourceConstraint: CONSENT_SOURCES.DESIGNER,
    idShape: ELEMENT_CATEGORIES.RESOLUTION,
    renderSection: RENDER_SECTIONS.THEOREMS,
    closedEnumFields: {},
    referenceFields: { problem_anchor: ['concern', 'risk'], grounding: 'proposition' },
    authority: { add: [CONSENT_SOURCES.DESIGNER], revise: [CONSENT_SOURCES.DESIGNER], withdraw: [CONSENT_SOURCES.DESIGNER], ratify: [CONSENT_SOURCES.DESIGNER, CONSENT_SOURCES.DESIGN_PARTNER] },
  }),
  [ELEMENT_CATEGORIES.FRICTION]: Object.freeze({
    requiredFields: ['friction_shape', 'anchor_a', 'anchor_b', 'disposition'],
    optionalFields: ['statement'],
    nonEmptyStringFields: [],
    nonEmptyArrayFields: [],
    sourceConstraint: CONSENT_SOURCES.SYSTEM,
    idShape: ELEMENT_CATEGORIES.FRICTION,
    renderSection: RENDER_SECTIONS.FRICTIONS,
    closedEnumFields: { friction_shape: FRICTION_SHAPES, disposition: FRICTION_DISPOSITIONS },
    referenceFields: { anchor_a: '*', anchor_b: '*' },
    authority: { add: [CONSENT_SOURCES.SYSTEM, CONSENT_SOURCES.DESIGNER], revise: [CONSENT_SOURCES.DESIGNER], withdraw: [CONSENT_SOURCES.DESIGNER], ratify: [CONSENT_SOURCES.DESIGNER] },
  }),
  [ELEMENT_CATEGORIES.CONCERN]: Object.freeze({
    requiredFields: ['label'],
    optionalFields: ['description', 'notes'],
    nonEmptyStringFields: [],
    nonEmptyArrayFields: [],
    sourceConstraint: CONSENT_SOURCES.DESIGNER,
    idShape: ELEMENT_CATEGORIES.CONCERN,
    renderSection: RENDER_SECTIONS.PROBLEM,
    closedEnumFields: {},
    referenceFields: {},
    authority: { add: [CONSENT_SOURCES.DESIGNER], revise: [CONSENT_SOURCES.DESIGNER], withdraw: [CONSENT_SOURCES.DESIGNER], ratify: [CONSENT_SOURCES.DESIGNER, CONSENT_SOURCES.DESIGN_PARTNER] },
  }),
  [ELEMENT_CATEGORIES.DEFINITION]: Object.freeze({
    requiredFields: ['canonical_name', 'definition'],
    optionalFields: ['scope'],
    nonEmptyStringFields: [],
    nonEmptyArrayFields: [],
    sourceConstraint: CONSENT_SOURCES.DESIGNER,
    idShape: ELEMENT_CATEGORIES.DEFINITION,
    renderSection: RENDER_SECTIONS.DEFINITIONS,
    closedEnumFields: {},
    referenceFields: {},
    authority: { add: [CONSENT_SOURCES.DESIGNER], revise: [CONSENT_SOURCES.DESIGNER], withdraw: [CONSENT_SOURCES.DESIGNER], ratify: [CONSENT_SOURCES.DESIGNER, CONSENT_SOURCES.DESIGN_PARTNER] },
  }),
});

/**
 * @param {object} args
 * @param {string|{requiredFields?: string[], closedEnumFields?: object, label?: string}} shapeOrDescriptor
 *   String → looked up in CATEGORY_REGISTRY (element-category shape, original behavior).
 *   Object → inline descriptor, used by operations whose arg shape is not an element-category
 *   shape (e.g. MANAGE_FRICTION takes {frictionId, disposition}, not the FRICTION element shape).
 * @param {object|null} [readPort] Optional read port (must expose `exists([pred, pattern])`).
 *   When provided, the `referenceFields` loop runs and verifies each referenced id exists in
 *   the EDB under the declared category constraint. When null/omitted, the loop short-circuits
 *   so existing two-arg callers retain unchanged behavior.
 */
export function verifyArgsShape(args, shapeOrDescriptor, readPort = null) {
  const isInline = shapeOrDescriptor !== null && typeof shapeOrDescriptor === 'object';
  const desc = isInline ? shapeOrDescriptor : CATEGORY_REGISTRY[shapeOrDescriptor];
  const label = isInline ? (shapeOrDescriptor.label ?? '<inline>') : shapeOrDescriptor;
  if (!desc) throw Object.assign(new Error(`SHAPE_INVALID: unknown idShape ${shapeOrDescriptor}`), { code: 'SHAPE_INVALID' });
  for (const f of (desc.requiredFields ?? [])) {
    if (!(f in args)) throw Object.assign(new Error(`SHAPE_INVALID: missing required field "${f}" for ${label}`), { code: 'SHAPE_INVALID', field: f });
  }
  for (const [field, set] of Object.entries(desc.closedEnumFields ?? {})) {
    if (field in args) {
      try {
        assertExhaustive(args[field], set, field);
      } catch (e) {
        // assertExhaustive throws a plain Error; re-annotate as SHAPE_INVALID so
        // the runOperation catch path treats closed-enum violations identically
        // to missing-required-field violations.
        throw Object.assign(e, { code: 'SHAPE_INVALID', field });
      }
    }
  }
  for (const f of (desc.nonEmptyStringFields ?? [])) {
    if (f in args) {
      const v = args[f];
      if (typeof v !== 'string' || v.trim().length === 0) {
        throw Object.assign(new Error(`SHAPE_INVALID: field "${f}" for ${label} must be a non-empty string`), { code: 'SHAPE_INVALID', field: f });
      }
    }
  }
  // nonEmptyArrayFields: the field's value (when present) must be a non-empty array.
  // Element type is not checked here — categories that need stricter element shape
  // perform that in their per-category check or translator.
  for (const f of (desc.nonEmptyArrayFields ?? [])) {
    if (f in args) {
      const v = args[f];
      if (!Array.isArray(v) || v.length === 0) {
        throw Object.assign(new Error(`SHAPE_INVALID: field "${f}" for ${label} must be a non-empty array`), { code: 'SHAPE_INVALID', field: f });
      }
    }
  }
  // referenceFields: { fieldName: categoryConstraint }. Each id in args[field] must
  // exist in the EDB under the declared category (or any category when constraint === '*').
  // Short-circuits when no readPort is provided so legacy two-arg callers are unaffected.
  if (readPort) {
    for (const [field, categoryConstraint] of Object.entries(desc.referenceFields ?? {})) {
      if (!(field in args)) continue;
      const raw = args[field];
      const ids = Array.isArray(raw) ? raw : [raw];
      const isArrayConstraint = Array.isArray(categoryConstraint);
      for (const id of ids) {
        const ok = isArrayConstraint
          ? _existsOneOf(readPort, id, categoryConstraint)
          : _existsCategory(readPort, id, categoryConstraint);
        if (!ok) {
          throw Object.assign(
            new Error(`INVALID_REFERENCE: field "${field}" for ${label} references non-existent ${categoryConstraint === '*' ? 'element' : (isArrayConstraint ? categoryConstraint.join(' or ') : categoryConstraint)} "${id}"`),
            { code: 'INVALID_REFERENCE', field, referencedId: id }
          );
        }
      }
    }
  }
  return args;
}
