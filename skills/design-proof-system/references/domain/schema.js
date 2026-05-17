// Per-category required fields, authority, render section. Canonical definitions: ./VOCABULARY.md.
import { ELEMENT_CATEGORIES, CONSENT_SOURCES, RENDER_SECTIONS, INFERENCE_PATTERNS, FRICTION_SHAPES, FRICTION_DISPOSITIONS, assertExhaustive } from './tags.js';

export const CATEGORY_REGISTRY = Object.freeze({
  [ELEMENT_CATEGORIES.EVIDENCE]: Object.freeze({
    requiredFields: ['source', 'claim'],
    optionalFields: ['url', 'citation'],
    nonEmptyStringFields: [],
    sourceConstraint: CONSENT_SOURCES.DESIGNER,
    idShape: ELEMENT_CATEGORIES.EVIDENCE,
    renderSection: RENDER_SECTIONS.GIVENS,
    closedEnumFields: {},
    authority: { add: [CONSENT_SOURCES.DESIGNER], revise: [CONSENT_SOURCES.DESIGNER], withdraw: [CONSENT_SOURCES.DESIGNER], ratify: [CONSENT_SOURCES.DESIGNER] },
  }),
  [ELEMENT_CATEGORIES.RULE]: Object.freeze({
    requiredFields: ['statement'],
    optionalFields: ['rationale'],
    nonEmptyStringFields: [],
    sourceConstraint: CONSENT_SOURCES.DESIGNER,
    idShape: ELEMENT_CATEGORIES.RULE,
    renderSection: RENDER_SECTIONS.INFERENTIAL_FRAMEWORK,
    closedEnumFields: {},
    authority: { add: [CONSENT_SOURCES.DESIGNER], revise: [CONSENT_SOURCES.DESIGNER], withdraw: [CONSENT_SOURCES.DESIGNER], ratify: [CONSENT_SOURCES.DESIGNER] },
  }),
  [ELEMENT_CATEGORIES.PERMISSION]: Object.freeze({
    requiredFields: ['statement'],
    optionalFields: ['rationale'],
    nonEmptyStringFields: [],
    sourceConstraint: CONSENT_SOURCES.DESIGNER,
    idShape: ELEMENT_CATEGORIES.PERMISSION,
    renderSection: RENDER_SECTIONS.INFERENTIAL_FRAMEWORK,
    closedEnumFields: {},
    authority: { add: [CONSENT_SOURCES.DESIGNER], revise: [CONSENT_SOURCES.DESIGNER], withdraw: [CONSENT_SOURCES.DESIGNER], ratify: [CONSENT_SOURCES.DESIGNER] },
  }),
  [ELEMENT_CATEGORIES.PROPOSITION]: Object.freeze({
    requiredFields: ['statement', 'grounding', 'collapse_test', 'inference_pattern', 'reasoning_chain'],
    optionalFields: ['scope', 'rejected_alternatives'],
    nonEmptyStringFields: ['reasoning_chain'],
    sourceConstraint: CONSENT_SOURCES.DESIGNER,
    idShape: ELEMENT_CATEGORIES.PROPOSITION,
    renderSection: RENDER_SECTIONS.LEMMAS,
    closedEnumFields: { inference_pattern: INFERENCE_PATTERNS },
    authority: { add: [CONSENT_SOURCES.DESIGNER], revise: [CONSENT_SOURCES.DESIGNER], withdraw: [CONSENT_SOURCES.DESIGNER], ratify: [CONSENT_SOURCES.DESIGNER, CONSENT_SOURCES.DESIGN_PARTNER] },
  }),
  [ELEMENT_CATEGORIES.RISK]: Object.freeze({
    requiredFields: ['statement'],
    optionalFields: ['severity'],
    nonEmptyStringFields: [],
    sourceConstraint: CONSENT_SOURCES.DESIGNER,
    idShape: ELEMENT_CATEGORIES.RISK,
    renderSection: RENDER_SECTIONS.PROBLEM,
    closedEnumFields: {},
    authority: { add: [CONSENT_SOURCES.DESIGNER], revise: [CONSENT_SOURCES.DESIGNER], withdraw: [CONSENT_SOURCES.DESIGNER], ratify: [CONSENT_SOURCES.DESIGNER] },
  }),
  [ELEMENT_CATEGORIES.RESOLUTION]: Object.freeze({
    requiredFields: ['statement', 'addresses'],
    optionalFields: [],
    nonEmptyStringFields: [],
    sourceConstraint: CONSENT_SOURCES.DESIGNER,
    idShape: ELEMENT_CATEGORIES.RESOLUTION,
    renderSection: RENDER_SECTIONS.THEOREMS,
    closedEnumFields: {},
    authority: { add: [CONSENT_SOURCES.DESIGNER], revise: [CONSENT_SOURCES.DESIGNER], withdraw: [CONSENT_SOURCES.DESIGNER], ratify: [CONSENT_SOURCES.DESIGNER, CONSENT_SOURCES.DESIGN_PARTNER] },
  }),
  [ELEMENT_CATEGORIES.FRICTION]: Object.freeze({
    requiredFields: ['shape', 'description'],
    optionalFields: ['disposition'],
    nonEmptyStringFields: [],
    sourceConstraint: CONSENT_SOURCES.SYSTEM,
    idShape: ELEMENT_CATEGORIES.FRICTION,
    renderSection: RENDER_SECTIONS.FRICTIONS,
    closedEnumFields: { shape: FRICTION_SHAPES, disposition: FRICTION_DISPOSITIONS },
    authority: { add: [CONSENT_SOURCES.SYSTEM, CONSENT_SOURCES.DESIGNER], revise: [CONSENT_SOURCES.DESIGNER], withdraw: [CONSENT_SOURCES.DESIGNER], ratify: [CONSENT_SOURCES.DESIGNER] },
  }),
  [ELEMENT_CATEGORIES.CONCERN]: Object.freeze({
    requiredFields: ['label'],
    optionalFields: ['description'],
    nonEmptyStringFields: [],
    sourceConstraint: CONSENT_SOURCES.DESIGNER,
    idShape: ELEMENT_CATEGORIES.CONCERN,
    renderSection: RENDER_SECTIONS.PROBLEM,
    closedEnumFields: {},
    authority: { add: [CONSENT_SOURCES.DESIGNER], revise: [CONSENT_SOURCES.DESIGNER], withdraw: [CONSENT_SOURCES.DESIGNER], ratify: [CONSENT_SOURCES.DESIGNER, CONSENT_SOURCES.DESIGN_PARTNER] },
  }),
  [ELEMENT_CATEGORIES.DEFINITION]: Object.freeze({
    requiredFields: ['term', 'definition'],
    optionalFields: ['scope'],
    nonEmptyStringFields: [],
    sourceConstraint: CONSENT_SOURCES.DESIGNER,
    idShape: ELEMENT_CATEGORIES.DEFINITION,
    renderSection: RENDER_SECTIONS.DEFINITIONS,
    closedEnumFields: {},
    authority: { add: [CONSENT_SOURCES.DESIGNER], revise: [CONSENT_SOURCES.DESIGNER], withdraw: [CONSENT_SOURCES.DESIGNER], ratify: [CONSENT_SOURCES.DESIGNER, CONSENT_SOURCES.DESIGN_PARTNER] },
  }),
});

/**
 * @param {object} args
 * @param {string|{requiredFields?: string[], closedEnumFields?: object, label?: string}} shapeOrDescriptor
 *   String → looked up in CATEGORY_REGISTRY (element-category shape, original behavior).
 *   Object → inline descriptor, used by operations whose arg shape is not an element-category
 *   shape (e.g. MANAGE_FRICTION takes {frictionId, disposition}, not the FRICTION element shape).
 */
export function verifyArgsShape(args, shapeOrDescriptor) {
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
  return args;
}
