import { computeCompleteness, computeGroundingCoverage, checkClosure } from './metrics.js';
import { UNCLASSIFIED_DISPOSITION, entityType } from './proof.js';

/**
 * Extract a ratification descriptor for a cited element. Returns whatever
 * ratification metadata is in scope on the element; null if none. Does not
 * fabricate or normalize beyond a shallow read.
 * @param {object} _state - Reserved for future ratification-log lookups; unused for now.
 * @param {object} el
 * @returns {*} Ratification metadata, or null.
 */
function extractRatification(_state, el) {
  // NCs carry ratificationStatus ('draft' | 'ratified').
  if (el?.ratificationStatus !== undefined) return el.ratificationStatus;
  // RCs carry a ratification object ({ ratifiedAtRound, text }) or null.
  if (el?.ratification !== undefined) return el.ratification;
  // Concerns and Definitions carry status; surface it when ratified.
  if (el?.status === 'ratified') return 'ratified';
  return null;
}

export function deriveClosingArgument(state) {
  const elementsArr = [...state.elements.values()];

  // Concerns (excluding withdrawn) when locked; phantom Concerns when withdrawn.
  const concernsList = state.concerns ?? [];
  const lockedConcerns = state.concernsLocked
    ? concernsList.filter(c => c.status !== 'withdrawn')
    : [];
  const phantomConcerns = concernsList.filter(c => c.status === 'withdrawn');

  const resolveConditions = elementsArr
    .filter(el => el.type === 'RESOLVE_CONDITION' && el.status === 'active')
    .map(el => ({
      id: el.id,
      statement: el.statement,
      problem_anchor: el.problem_anchor ?? null,
      ratification: el.ratification ?? null,
      groundingNCs: (el.grounding ?? [])
        .map(refId => state.elements.get(refId))
        .filter(ref => ref && ref.type === 'NECESSARY_CONDITION')
        .map(nc => ({ id: nc.id, statement: nc.statement, collapse_test: nc.collapse_test ?? null })),
    }));

  const phantomNCs = elementsArr
    .filter(el => el.type === 'NECESSARY_CONDITION' && el.status === 'withdrawn')
    .map(el => ({ id: el.id, statement: el.statement, dispositionTag: el.withdrawal_disposition ?? UNCLASSIFIED_DISPOSITION }));

  const phantomRCs = elementsArr
    .filter(el => el.type === 'RESOLVE_CONDITION' && el.status === 'withdrawn')
    .map(el => ({ id: el.id, statement: el.statement, dispositionTag: el.withdrawal_disposition ?? UNCLASSIFIED_DISPOSITION }));

  const liveFriction = elementsArr
    .filter(el => el.type === 'FRICTION' && el.status === 'active')
    .map(el => ({
      id: el.id, friction_shape: el.friction_shape, anchor_a: el.anchor_a, anchor_b: el.anchor_b,
      disposition: el.disposition, statement: el.statement,
    }));

  const phantomFriction = elementsArr
    .filter(el => el.type === 'FRICTION' && el.status === 'withdrawn')
    .map(el => ({
      // FRICTION.disposition is required by createElement and validated by overrideFrictionDisposition,
      // so dispositionTag is always populated for live and phantom alike — no fallback needed.
      id: el.id, friction_shape: el.friction_shape, anchor_a: el.anchor_a, anchor_b: el.anchor_b,
      dispositionTag: el.disposition, statement: el.statement,
    }));

  // Standalone NC partitions (active + ratificationStatus split).
  const activeNCs = elementsArr
    .filter(el => el.type === 'NECESSARY_CONDITION' && el.status === 'active' && el.ratificationStatus === 'ratified');
  const draftNCs = elementsArr
    .filter(el => el.type === 'NECESSARY_CONDITION' && el.status === 'active' && el.ratificationStatus === 'draft');

  // Standalone active partitions for other typed elements.
  const activeRules = elementsArr.filter(el => el.type === 'RULE' && el.status === 'active');
  const activePermissions = elementsArr.filter(el => el.type === 'PERMISSION' && el.status === 'active');
  const activeRisks = elementsArr.filter(el => el.type === 'RISK' && el.status === 'active');

  // Definitions partitioned by status.
  const definitions = state.definitions ?? [];
  const ratifiedDefinitions = definitions.filter(d => d.status === 'ratified');
  const phantomDefinitions = definitions.filter(d => d.status === 'deprecated' || d.status === 'withdrawn');

  // Closure provenance: every cited element gets a derivation chain from operationLog.
  // Cited set is the union of active typed elements, live RCs, live frictions, locked
  // concerns, and ratified definitions — anything that participates in the proof envelope.
  const cited = [
    ...activeNCs,
    ...activeRules,
    ...activePermissions,
    ...activeRisks,
    ...resolveConditions,   // these are mapped objects, not raw elements; they still carry .id
    ...liveFriction,        // mapped objects with .id
    ...lockedConcerns,      // raw concern objects with .id
    ...ratifiedDefinitions, // raw definition objects with .id
  ];
  const operationLog = state.operationLog ?? [];
  const closureProvenance = cited.map(el => {
    let resolvedType = el.type ?? null;
    if (!resolvedType && el.id) {
      try { resolvedType = entityType(el.id); } catch { resolvedType = null; }
    }
    return {
      entityId: el.id,
      type: resolvedType,
      source: el.source ?? null,
      derivationChain: operationLog.filter(e => e.entityId === el.id),
      ratification: extractRatification(state, el),
      restructuringActionLabel: el.restructuring?.restructuring_action_label ?? el.restructuring?.action ?? el.restructuring_action_label ?? null,
    };
  });

  const completeness = computeCompleteness(state.elements, state);
  const groundingCoverage = computeGroundingCoverage(state.elements);
  const closure = checkClosure(state);

  return {
    derivedAtRound: state.round,
    problemStatement: state.problemStatement,
    lockedConcerns,
    phantomConcerns,
    resolveConditions,
    phantomRCs,
    activeNCs,
    draftNCs,
    phantomNCs,
    activeRules,
    activePermissions,
    activeRisks,
    liveFriction,
    phantomFriction,
    ratifiedDefinitions,
    phantomDefinitions,
    closureProvenance,
    compositeScore: { ...completeness, groundingCoverage },
    closurePermitted: closure.permitted,
    closureReasons: closure.reasons,
  };
}
