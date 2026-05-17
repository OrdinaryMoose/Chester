// Closed-set enums for the domain. Canonical definitions, wire values, and
// naming rules: ./VOCABULARY.md. Every Domain module imports tag values from
// here; no module re-declares an enum.

export const ELEMENT_CATEGORIES = Object.freeze({
  EVIDENCE: 'evidence', RULE: 'rule', PERMISSION: 'permission',
  PROPOSITION: 'proposition', RISK: 'risk', RESOLUTION: 'resolution',
  FRICTION: 'friction', CONCERN: 'concern', DEFINITION: 'definition',
});

export const PHASES = Object.freeze({
  ESTABLISHMENT: 'establishment', LANE_RESOLUTION: 'lane_resolution',
  PRESENTATION: 'presentation', CONFIRMATION: 'confirmation',
});

export const CONSENT_SOURCES = Object.freeze({
  DESIGNER: 'designer', DESIGN_PARTNER: 'design_partner', SYSTEM: 'system',
});

export const INFERENCE_PATTERNS = Object.freeze({
  GROUNDS_IMPLY_CONCLUSION: 'grounds_imply_conclusion',
  ABSENCE_IMPLIES_ABSENCE: 'absence_implies_absence',
  ENABLEMENT: 'enablement',
  STRUCTURAL: 'structural',
});

export const FRICTION_SHAPES = Object.freeze({
  COVERAGE_GAP: 'coverage_gap', OVERLAP: 'overlap',
  CONFLICT: 'conflict', UNGROUNDED: 'ungrounded',
  STAGNATION: 'stagnation',
});

export const FRICTION_DISPOSITIONS = Object.freeze({
  ADDRESS: 'address', DEFER: 'defer', DISMISS: 'dismiss', OVERRIDE: 'override',
});

export const WITHDRAWAL_DISPOSITIONS = Object.freeze({
  EXPLICIT: 'explicit', SUPERSEDED: 'superseded', PHANTOM: 'phantom',
});

export const ACTION_LABELS = Object.freeze({
  ADD: 'add', REVISE: 'revise', WITHDRAW: 'withdraw',
  RATIFY: 'ratify', MANAGE_FRICTION: 'manage_friction',
  PRESENT_CLOSING_ARGUMENT: 'present_closing_argument',
  CONFIRM_CLOSURE_GO: 'confirm_closure_go', OPEN_PROOF: 'open_proof',
});

export const RENDER_SECTIONS = Object.freeze({
  PROBLEM: 'problem', GIVENS: 'givens', DEFINITIONS: 'definitions',
  INFERENTIAL_FRAMEWORK: 'inferential_framework', LEMMAS: 'lemmas',
  THEOREMS: 'theorems', FRICTIONS: 'frictions', REJECTED: 'rejected',
  CLOSURE_STATUS: 'closure_status',
});

export function assertExhaustive(value, set, label) {
  const allowed = new Set(Object.values(set));
  if (!allowed.has(value)) {
    throw new Error(`Unexhausted ${label}: ${JSON.stringify(value)} not in ${JSON.stringify([...allowed])}`);
  }
  return value;
}
