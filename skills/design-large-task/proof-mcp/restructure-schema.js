/**
 * REQUIRED_FIELDS_REGISTRY — per-element-category schema for restructuring.
 * Each entry: { required: [{ name, justification }], optional: string[] }.
 *
 * 6 B.1-admittable categories: 5 ELEMENT_TYPES values + Concern.
 * FRICTION is intentionally absent — it is B.2-generated via manage_friction,
 * never received via the contract surface.
 * RESOLVE_CONDITION is intentionally absent — see Concern entry below.
 */
export const REQUIRED_FIELDS_REGISTRY = {
  EVIDENCE: {
    required: [
      { name: 'statement', justification: 'Element body; required by createElement and read by every reasoning operation.' },
      { name: 'source', justification: 'Distinguishes codebase / industry / designer-direct sources for grounding-chain auditability.' },
    ],
    optional: ['grounding'],
  },
  RULE: {
    required: [
      { name: 'statement', justification: 'Element body; required by createElement.' },
      { name: 'source', justification: 'createElement enforces source="designer" for RULE; downstream provenance depends on it.' },
    ],
    optional: ['grounding', 'rejected_alternatives'],
  },
  PERMISSION: {
    required: [
      { name: 'statement', justification: 'Element body; required by createElement.' },
      { name: 'source', justification: 'createElement enforces source="designer" for PERMISSION; downstream provenance depends on it.' },
      { name: 'relieves', justification: 'Names which RULE this PERMISSION relaxes; closing-argument materialization references this link.' },
    ],
    optional: ['grounding'],
  },
  NECESSARY_CONDITION: {
    required: [
      { name: 'statement', justification: 'Element body; required by createElement.' },
      { name: 'grounding', justification: 'NCs without grounding chains fail integrity check (checkUngrounded in proof.js).' },
      { name: 'reasoning_chain', justification: 'Closing-argument tension-naming reads this; absent chain forces phantom-NC handling.' },
      { name: 'collapse_test', justification: 'Required for closure (checkMissingCollapseTest); without it the NC is not closure-ready.' },
      { name: 'rejected_alternatives', justification: 'Closure requires at least one NC with rejected_alternatives; this drives the discipline.' },
    ],
    optional: [],
  },
  RISK: {
    required: [
      { name: 'statement', justification: 'Element body; required by createElement.' },
      { name: 'basis', justification: 'Anchor element IDs the RISK attaches to; closure-side coverage maps reference these anchors.' },
    ],
    optional: ['grounding'],
  },
  // RESOLVE_CONDITION intentionally omitted: applyOperations validates RC.problem_anchor
  // against state.concerns, which is empty immediately after initializeState in handleOpenProof.
  // RCs cannot be admitted via the contract surface; they are added post-open via the existing
  // submit_proof_update or ratify_resolve_condition tools after Concerns have been provisioned.
  Concern: {
    required: [
      { name: 'label', justification: 'addConcern requires non-empty label; coverage check enumerates by label.' },
    ],
    optional: ['description'],
  },
};
