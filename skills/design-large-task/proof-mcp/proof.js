/**
 * proof.js — Element model and integrity checks for the design proof MCP server.
 * Pure-functions module with no I/O.
 *
 * Necessary Conditions Model (v2):
 *   EVIDENCE   — codebase facts, agent-sourced, verifiable
 *   RULE       — designer-directed restrictions on the design space
 *   PERMISSION — designer-directed relief from an existing restriction
 *   NECESSARY_CONDITION — something that must be true for the design to hold
 *   RISK       — identified hazards attached to specific conditions
 */

export const ELEMENT_TYPES = [
  'EVIDENCE', 'RULE', 'PERMISSION', 'NECESSARY_CONDITION', 'RISK', 'RESOLVE_CONDITION', 'FRICTION',
];

export const FRICTION_SHAPES = [
  'nc-nc-opposing-pull', 'rc-rule-conflict', 'permission-risk-linkage', 'concern-concern-competition',
];

export const FRICTION_DISPOSITIONS = [
  'lived-with', 'relieved-by-exception', 'dissolved-by-revision', 'dissolved-by-scope-cut', 'not-really-friction',
];

// Subset of FRICTION_DISPOSITIONS that transition the element to status: 'withdrawn'.
export const TERMINAL_FRICTION_DISPOSITIONS = [
  'dissolved-by-revision', 'dissolved-by-scope-cut', 'not-really-friction',
];

export const WITHDRAWAL_DISPOSITIONS = [
  'consolidated', 'superseded', 'found-redundant', 'found-incorrect', 'scope-removed',
];

// Default-only sentinel for withdrawn elements lacking an explicit withdrawal_disposition.
// Not a member of WITHDRAWAL_DISPOSITIONS — applied by loadState backfill and the withdraw
// branch when the field is omitted; consumed by closing-argument render as the fallback tag.
export const UNCLASSIFIED_DISPOSITION = 'unclassified';

/**
 * Create an element object from input, validating required fields by type.
 * @param {object} input - Element fields from caller
 * @param {string} id - Unique element ID
 * @param {number} round - Round number when element is added
 * @returns {object} The created element
 */
export function createElement(input, id, round) {
  const {
    type, statement, source,
    grounding, collapse_test, reasoning_chain, rejected_alternatives,
    relieves, basis,
    problem_anchor,
    restructuring,
  } = input;

  if (!ELEMENT_TYPES.includes(type)) {
    throw new Error(`Invalid type "${type}". Must be one of: ${ELEMENT_TYPES.join(', ')}`);
  }

  // FRICTION: distinct schema (anchor pair + shape + disposition); statement is optional.
  // Handle as early return so it doesn't trip the shared `statement` requirement below.
  if (type === 'FRICTION') {
    if (!input.friction_shape || !FRICTION_SHAPES.includes(input.friction_shape)) {
      throw new Error(`FRICTION friction_shape required, must be one of: ${FRICTION_SHAPES.join(', ')}`);
    }
    if (!input.disposition || !FRICTION_DISPOSITIONS.includes(input.disposition)) {
      throw new Error(`FRICTION disposition required, must be one of: ${FRICTION_DISPOSITIONS.join(', ')}`);
    }
    if (!input.anchor_a || !input.anchor_b) {
      throw new Error('FRICTION requires anchor_a and anchor_b element IDs');
    }
    return {
      id,
      type,
      status: 'active',
      friction_shape: input.friction_shape,
      anchor_a: input.anchor_a,
      anchor_b: input.anchor_b,
      disposition: input.disposition,
      statement: input.statement ?? '',
      addedInRound: round,
      revisedInRound: null,
      revision: 0,
    };
  }

  if (!statement) {
    throw new Error('statement is required and must be non-empty');
  }

  // EVIDENCE: agent-sourced codebase facts — source must not be "designer"
  if (type === 'EVIDENCE') {
    if (!source) {
      throw new Error('EVIDENCE requires explicit source field');
    }
    if (source === 'designer') {
      throw new Error('EVIDENCE cannot have source "designer" — use RULE for designer declarations');
    }
  }

  // RULE: designer-directed restriction — source must be "designer"
  if (type === 'RULE') {
    if (source !== 'designer') {
      throw new Error('RULE requires source "designer" — only the designer can create rules');
    }
  }

  // PERMISSION: designer-directed relief — source must be "designer", relieves required
  if (type === 'PERMISSION') {
    if (source !== 'designer') {
      throw new Error('PERMISSION requires source "designer" — only the designer can grant permissions');
    }
    if (!relieves) {
      throw new Error('PERMISSION requires relieves field (what restriction is being relaxed)');
    }
  }

  // NECESSARY_CONDITION: must have grounding, collapse_test, reasoning_chain
  if (type === 'NECESSARY_CONDITION') {
    if (!Array.isArray(grounding) || grounding.length === 0) {
      throw new Error('NECESSARY_CONDITION requires grounding (non-empty array of element IDs)');
    }
    if (!collapse_test) {
      throw new Error('NECESSARY_CONDITION requires collapse_test (what breaks if this is removed)');
    }
    if (!reasoning_chain) {
      throw new Error('NECESSARY_CONDITION requires reasoning_chain (IF...THEN structure)');
    }
  }

  // RESOLVE_CONDITION: agent-proposes-PM-validates — requires problem_anchor; refuses designer source
  if (type === 'RESOLVE_CONDITION') {
    if (!problem_anchor) {
      throw new Error('RESOLVE_CONDITION requires problem_anchor (Concern ID)');
    }
    if (source === 'designer') {
      throw new Error('RESOLVE_CONDITION cannot have source "designer" — RC is agent-proposes-PM-validates; ratification is captured via the ratify_resolve_condition tool');
    }
  }

  const element = {
    id,
    type,
    statement,
    source: source ?? null,
    grounding: Array.isArray(grounding) ? grounding : [],
    collapse_test: collapse_test ?? null,
    reasoning_chain: reasoning_chain ?? null,
    rejected_alternatives: Array.isArray(rejected_alternatives) ? rejected_alternatives : [],
    relieves: relieves ?? null,
    basis: Array.isArray(basis) ? basis : [],
    problem_anchor: problem_anchor ?? null,
    ratification: null,
    status: 'active',
    addedInRound: round,
    revisedInRound: null,
    revision: 0,
  };
  if (restructuring) {
    element.restructuring = restructuring;
  }
  return element;
}

/**
 * Check that all IDs in an array exist in the elements map.
 * @param {string[]} refs - Array of element IDs
 * @param {Map} elements - Map of id -> element
 * @returns {string[]} Array of error strings for missing refs
 */
export function validateRefs(refs, elements) {
  const errors = [];
  for (const ref of refs) {
    if (!elements.has(ref)) {
      errors.push(`Reference "${ref}" does not exist`);
    }
  }
  return errors;
}

/**
 * BFS from startId following grounding/basis links. Returns all reachable IDs.
 * Handles cycles (stops at revisited nodes). Skips withdrawn elements.
 * Follows `grounding` for NECESSARY_CONDITIONs, `basis` for others.
 * @param {Map} elements - Map of id -> element
 * @param {string} startId - Element to start traversal from
 * @returns {string[]} Array of all reachable element IDs (excluding startId)
 */
export function traverseGroundingChain(elements, startId) {
  const visited = new Set([startId]);
  const result = [];
  const startEl = elements.get(startId);
  if (!startEl) return result;

  // Use grounding for NCs, basis for others
  const startRefs = startEl.type === 'NECESSARY_CONDITION'
    ? (startEl.grounding || [])
    : (startEl.basis || []);
  const queue = [...startRefs];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const el = elements.get(currentId);
    if (!el || el.status === 'withdrawn') continue;

    result.push(currentId);

    const refs = el.type === 'NECESSARY_CONDITION'
      ? (el.grounding || [])
      : (el.basis || []);
    for (const ref of refs) {
      if (!visited.has(ref)) {
        queue.push(ref);
      }
    }
  }

  return result;
}

/**
 * Flags active elements citing withdrawn elements in their direct grounding/basis.
 * @param {Map} elements
 * @returns {Array<{type: string, element_id: string, cited_id: string, message: string}>}
 */
export function checkWithdrawnGrounding(elements) {
  const warnings = [];
  for (const [id, el] of elements) {
    if (el.status !== 'active') continue;
    const refs = el.type === 'NECESSARY_CONDITION'
      ? (el.grounding || [])
      : (el.basis || []);
    for (const ref of refs) {
      const cited = elements.get(ref);
      if (cited && cited.status === 'withdrawn') {
        warnings.push({
          type: 'withdrawn-grounding',
          element_id: id,
          cited_id: ref,
          message: `Active element "${id}" cites withdrawn element "${ref}"`,
        });
      }
    }
  }
  return warnings;
}

/**
 * Flags NECESSARY_CONDITIONs whose grounding doesn't contain at least one
 * EVIDENCE, RULE, or PERMISSION (directly or through the chain).
 * @param {Map} elements
 * @returns {Array<{type: string, element_id: string, message: string}>}
 */
export function checkUngrounded(elements) {
  const warnings = [];
  const groundingTypes = new Set(['EVIDENCE', 'RULE', 'PERMISSION']);

  for (const [id, el] of elements) {
    if (el.status !== 'active') continue;
    if (el.type !== 'NECESSARY_CONDITION') continue;

    const chain = traverseGroundingChain(elements, id);
    const hasGrounding = chain.some(refId => {
      const dep = elements.get(refId);
      return dep && groundingTypes.has(dep.type);
    });

    if (!hasGrounding) {
      warnings.push({
        type: 'ungrounded-condition',
        element_id: id,
        message: `Necessary condition "${id}" has no EVIDENCE, RULE, or PERMISSION in its grounding chain`,
      });
    }
  }
  return warnings;
}

/**
 * Flags NECESSARY_CONDITIONs that don't have a collapse_test.
 * (Should be caught at creation, but can happen through revise clearing it.)
 * @param {Map} elements
 * @returns {Array<{type: string, element_id: string, message: string}>}
 */
export function checkMissingCollapseTest(elements) {
  const warnings = [];
  for (const [id, el] of elements) {
    if (el.status !== 'active') continue;
    if (el.type !== 'NECESSARY_CONDITION') continue;
    if (!el.collapse_test) {
      warnings.push({
        type: 'missing-collapse-test',
        element_id: id,
        message: `Necessary condition "${id}" has no collapse test — cannot verify necessity`,
      });
    }
  }
  return warnings;
}

/**
 * Flags active downstream elements that cite a revised element but haven't
 * been updated since the revision. Checks grounding for NCs, basis for others.
 * @param {Map} elements
 * @returns {Array<{type: string, element_id: string, stale_id: string, message: string}>}
 */
export function checkStaleGrounding(elements) {
  const warnings = [];
  for (const [id, el] of elements) {
    if (el.status !== 'active') continue;
    const refs = el.type === 'NECESSARY_CONDITION'
      ? (el.grounding || [])
      : (el.basis || []);
    for (const ref of refs) {
      const dep = elements.get(ref);
      if (!dep) continue;
      if (dep.revision > 0) {
        const downstreamRound = el.revisedInRound ?? -1;
        const depRound = dep.revisedInRound ?? -1;
        if (downstreamRound < depRound) {
          warnings.push({
            type: 'stale-grounding',
            element_id: id,
            stale_id: ref,
            message: `Element "${id}" cites revised element "${ref}" (revision ${dep.revision}) but has not been updated since`,
          });
        }
      }
    }
  }
  return warnings;
}

/**
 * Flag active RESOLVE_CONDITIONs whose ratification field is null.
 * @param {Map} elements
 * @returns {Array<{type: string, element_id: string, message: string}>}
 */
export function checkUnratifiedResolveConditions(elements) {
  const warnings = [];
  for (const [id, el] of elements) {
    if (el.status !== 'active') continue;
    if (el.type !== 'RESOLVE_CONDITION') continue;
    if (el.ratification === null) {
      warnings.push({
        type: 'unratified-rc',
        element_id: id,
        message: `Resolve Condition "${id}" is unratified`,
      });
    }
  }
  return warnings;
}

/**
 * Sentinel — structurally impossible under cleared-on-revise approach (revise nulls
 * ratification at write time). Exists for symmetry and as a tested extension callsite.
 * @param {Map} elements
 * @returns {Array}
 */
export function checkStaleRatification(_elements) {
  return [];
}

/**
 * Flag active FRICTION elements whose anchor_a or anchor_b do not reference
 * an existing element in the proof state.
 * @param {Map} elements
 * @returns {string[]}
 */
export function checkUngroundedFrictionAnchors(elements) {
  const warnings = [];
  for (const [, el] of elements) {
    if (el.type !== 'FRICTION' || el.status !== 'active') continue;
    if (!elements.has(el.anchor_a)) {
      warnings.push(`Friction ${el.id} anchor_a "${el.anchor_a}" does not reference an existing element`);
    }
    if (!elements.has(el.anchor_b)) {
      warnings.push(`Friction ${el.id} anchor_b "${el.anchor_b}" does not reference an existing element`);
    }
  }
  return warnings;
}

/**
 * Run all integrity checks and return combined warnings.
 * @param {Map} elements
 * @returns {Array<object>} Combined array of all warning objects
 */
export function checkAllIntegrity(elements) {
  return [
    ...checkWithdrawnGrounding(elements),
    ...checkUngrounded(elements),
    ...checkMissingCollapseTest(elements),
    ...checkStaleGrounding(elements),
    ...checkUnratifiedResolveConditions(elements),
    ...checkStaleRatification(elements),
    ...checkUngroundedFrictionAnchors(elements),
  ];
}
