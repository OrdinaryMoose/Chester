/**
 * proof.js — Element model and integrity checks for the design proof MCP server.
 * Pure-functions module with no I/O.
 */

export const ELEMENT_TYPES = [
  'GIVEN', 'CONSTRAINT', 'ASSERTION', 'DECISION', 'OPEN', 'RISK', 'BOUNDARY',
];

/**
 * Create an element object from input, validating required fields by type.
 * @param {object} input - Element fields from caller
 * @param {string} id - Unique element ID
 * @param {number} round - Round number when element is added
 * @returns {object} The created element
 */
export function createElement(input, id, round) {
  const { type, statement, source, basis, over, confidence, reason } = input;

  if (!ELEMENT_TYPES.includes(type)) {
    throw new Error(`Invalid type "${type}". Must be one of: ${ELEMENT_TYPES.join(', ')}`);
  }
  if (!statement) {
    throw new Error('statement is required and must be non-empty');
  }

  if (type === 'ASSERTION') {
    if (confidence == null || typeof confidence !== 'number' || confidence < 0.0 || confidence > 1.0) {
      throw new Error('ASSERTION requires confidence between 0.0 and 1.0');
    }
  }

  if (type === 'DECISION') {
    if (!Array.isArray(over)) {
      throw new Error('DECISION requires over field (array)');
    }
  }

  if (type === 'BOUNDARY') {
    if (!reason) {
      throw new Error('BOUNDARY requires reason field');
    }
  }

  if (type === 'GIVEN') {
    if (source == null) {
      throw new Error('GIVEN requires explicit source field');
    }
  }

  return {
    id,
    type,
    statement,
    source: source ?? null,
    basis: Array.isArray(basis) ? basis : [],
    over: Array.isArray(over) ? over : null,
    confidence: typeof confidence === 'number' ? confidence : null,
    reason: reason ?? null,
    status: 'active',
    resolvedBy: null,
    addedInRound: round,
    revisedInRound: null,
    revision: 0,
  };
}

/**
 * Check that all IDs in a basis array exist in the elements map.
 * @param {string[]} basis - Array of element IDs
 * @param {Map} elements - Map of id -> element
 * @returns {string[]} Array of error strings for missing refs
 */
export function validateBasisRefs(basis, elements) {
  const errors = [];
  for (const ref of basis) {
    if (!elements.has(ref)) {
      errors.push(`Basis reference "${ref}" does not exist`);
    }
  }
  return errors;
}

/**
 * BFS from startId following basis links. Returns all reachable IDs.
 * Handles cycles (stops at revisited nodes). Skips withdrawn elements.
 * @param {Map} elements - Map of id -> element
 * @param {string} startId - Element to start traversal from
 * @returns {string[]} Array of all reachable element IDs (excluding startId)
 */
export function traverseBasisChain(elements, startId) {
  const visited = new Set([startId]);
  const result = [];
  const startEl = elements.get(startId);
  if (!startEl) return result;

  const queue = [...(startEl.basis || [])];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const el = elements.get(currentId);
    if (!el || el.status === 'withdrawn') continue;

    result.push(currentId);

    if (el.basis) {
      for (const ref of el.basis) {
        if (!visited.has(ref)) {
          queue.push(ref);
        }
      }
    }
  }

  return result;
}

/**
 * Flags active elements citing withdrawn elements in their direct basis.
 * @param {Map} elements
 * @returns {Array<{type: string, element_id: string, cited_id: string, message: string}>}
 */
export function checkWithdrawnBasis(elements) {
  const warnings = [];
  for (const [id, el] of elements) {
    if (el.status !== 'active') continue;
    for (const ref of (el.basis || [])) {
      const cited = elements.get(ref);
      if (cited && cited.status === 'withdrawn') {
        warnings.push({
          type: 'withdrawn-basis',
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
 * Flags DECISIONs whose basis chain overlaps with a BOUNDARY's basis chain.
 * Filters direct basis arrays by element status before building chain sets.
 * @param {Map} elements
 * @returns {Array<{type: string, element_id: string, boundary_id: string, shared_id: string, message: string}>}
 */
export function checkBoundaryCollision(elements) {
  const warnings = [];
  const decisions = [];
  const boundaries = [];

  for (const [, el] of elements) {
    if (el.status !== 'active') continue;
    if (el.type === 'DECISION') decisions.push(el);
    if (el.type === 'BOUNDARY') boundaries.push(el);
  }

  for (const decision of decisions) {
    // Filter direct basis to exclude withdrawn, then traverse
    const activeBasis = (decision.basis || []).filter(ref => {
      const el = elements.get(ref);
      return el && el.status !== 'withdrawn';
    });
    const decisionChain = new Set(activeBasis);
    for (const ref of activeBasis) {
      for (const reachable of traverseBasisChain(elements, ref)) {
        decisionChain.add(reachable);
      }
    }

    for (const boundary of boundaries) {
      const boundaryActiveBasis = (boundary.basis || []).filter(ref => {
        const el = elements.get(ref);
        return el && el.status !== 'withdrawn';
      });
      const boundaryChain = new Set(boundaryActiveBasis);
      for (const ref of boundaryActiveBasis) {
        for (const reachable of traverseBasisChain(elements, ref)) {
          boundaryChain.add(reachable);
        }
      }

      for (const shared of decisionChain) {
        if (boundaryChain.has(shared)) {
          warnings.push({
            type: 'boundary-collision',
            element_id: decision.id,
            boundary_id: boundary.id,
            shared_id: shared,
            message: `Decision "${decision.id}" basis chain overlaps with boundary "${boundary.id}" at "${shared}"`,
          });
          break; // one warning per decision-boundary pair
        }
      }
    }
  }
  return warnings;
}

/**
 * Flags high-confidence (>=0.7) ASSERTIONs built on low-confidence (<0.4)
 * ASSERTIONs in their basis chain.
 * @param {Map} elements
 * @returns {Array<{type: string, element_id: string, low_confidence_id: string, message: string}>}
 */
export function checkConfidenceInversion(elements) {
  const warnings = [];
  for (const [id, el] of elements) {
    if (el.status !== 'active') continue;
    if (el.type !== 'ASSERTION') continue;
    if (el.confidence < 0.7) continue;

    const chain = traverseBasisChain(elements, id);
    for (const reachableId of chain) {
      const dep = elements.get(reachableId);
      if (!dep || dep.type !== 'ASSERTION') continue;
      if (dep.confidence < 0.4) {
        warnings.push({
          type: 'confidence-inversion',
          element_id: id,
          low_confidence_id: reachableId,
          message: `High-confidence assertion "${id}" (${el.confidence}) depends on low-confidence assertion "${reachableId}" (${dep.confidence})`,
        });
      }
    }
  }
  return warnings;
}

/**
 * Flags active downstream elements that cite a revised element but haven't
 * been updated since the revision.
 * @param {Map} elements
 * @returns {Array<{type: string, element_id: string, stale_basis_id: string, message: string}>}
 */
export function checkStaleDependency(elements) {
  const warnings = [];
  for (const [id, el] of elements) {
    if (el.status !== 'active') continue;
    for (const ref of (el.basis || [])) {
      const dep = elements.get(ref);
      if (!dep) continue;
      // dep has been revised (revision > 0)
      if (dep.revision > 0) {
        // downstream hasn't been revised, or was revised before the dep
        const downstreamRound = el.revisedInRound ?? -1;
        const depRound = dep.revisedInRound ?? -1;
        if (downstreamRound < depRound) {
          warnings.push({
            type: 'stale-dependency',
            element_id: id,
            stale_basis_id: ref,
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
    ...checkWithdrawnBasis(elements),
    ...checkBoundaryCollision(elements),
    ...checkConfidenceInversion(elements),
    ...checkStaleDependency(elements),
  ];
}
