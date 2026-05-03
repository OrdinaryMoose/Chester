import { computeCompleteness, computeGroundingCoverage, checkClosure } from './metrics.js';
import { UNCLASSIFIED_DISPOSITION } from './proof.js';

export function deriveClosingArgument(state) {
  const elementsArr = [...state.elements.values()];

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

  const completeness = computeCompleteness(state.elements);
  const groundingCoverage = computeGroundingCoverage(state.elements);
  const closure = checkClosure(state);

  return {
    derivedAtRound: state.round,
    problemStatement: state.problemStatement,
    lockedConcerns: state.concernsLocked ? [...state.concerns] : [],
    resolveConditions,
    phantomNCs,
    phantomRCs,
    liveFriction,
    phantomFriction,
    compositeScore: { ...completeness, groundingCoverage },
    closurePermitted: closure.permitted,
    closureReasons: closure.reasons,
  };
}
