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
  'EVIDENCE', 'RULE', 'PERMISSION', 'NECESSARY_CONDITION', 'RISK',
];

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
  } = input;

  if (!ELEMENT_TYPES.includes(type)) {
    throw new Error(`Invalid type "${type}". Must be one of: ${ELEMENT_TYPES.join(', ')}`);
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

  return {
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
    status: 'active',
    addedInRound: round,
    revisedInRound: null,
    revision: 0,
  };
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
  ];
}
