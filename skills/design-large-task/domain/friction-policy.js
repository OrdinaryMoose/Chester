import { FRICTION_SHAPES } from './tags.js';

export function registerStatic(rulePorts) {
  rulePorts.defineRule('ungrounded_proposition_rule',
    ['ungrounded_proposition', ['P']],
    [['proposition_decl', ['P', '_', '_']], ['not', ['grounding', ['P', '_']]]],
    { domain_concept: FRICTION_SHAPES.UNGROUNDED, module: 'friction-policy' });
  rulePorts.defineRule('coverage_gap_rule',
    ['coverage_gap_detected', ['C']],
    [['risk', ['C', '_', '_']], ['not', ['addresses', ['_', 'C']]]],
    { domain_concept: FRICTION_SHAPES.COVERAGE_GAP, module: 'friction-policy' });
  rulePorts.defineRule('overlap_rule',
    ['overlap_detected', ['T1', 'T2']],
    [['definition_decl', ['T1', 'TERM', '_']], ['definition_decl', ['T2', 'TERM', '_']]],
    { domain_concept: FRICTION_SHAPES.OVERLAP, module: 'friction-policy' });
  // conflict_rule body requires an explicit `conflict_decl(R1, R2)` base fact rather than
  // generating a Cartesian product of all rule_decl pairs. Nothing in sprint-02 asserts
  // conflict_decl, so this rule is effectively a no-op until real conflict semantics are
  // defined (out of scope for sprint-02). The rule shape is preserved so the structural
  // tests in T15 see 4 friction-policy rules; only the body changed to avoid garbage output.
  rulePorts.defineRule('conflict_rule',
    ['conflict_detected', ['R1', 'R2']],
    [['conflict_decl', ['R1', 'R2']]],
    { domain_concept: FRICTION_SHAPES.CONFLICT, module: 'friction-policy', semantics: 'stub-pending-real-conflict-detection' });
}

/**
 * @param {{query: any, explain: any}} readPorts
 * @returns {Array<{shape: string, args: any[]}>}
 */
export function detectFrictions(readPorts) {
  const out = [];
  for (const row of readPorts.query.query(['ungrounded_proposition', [{ var: 'P' }]])) out.push({ shape: FRICTION_SHAPES.UNGROUNDED, args: [row.P] });
  for (const row of readPorts.query.query(['coverage_gap_detected', [{ var: 'C' }]])) out.push({ shape: FRICTION_SHAPES.COVERAGE_GAP, args: [row.C] });
  for (const row of readPorts.query.query(['overlap_detected', [{ var: 'T1' }, { var: 'T2' }]])) out.push({ shape: FRICTION_SHAPES.OVERLAP, args: [row.T1, row.T2] });
  for (const row of readPorts.query.query(['conflict_detected', [{ var: 'R1' }, { var: 'R2' }]])) out.push({ shape: FRICTION_SHAPES.CONFLICT, args: [row.R1, row.R2] });
  return out;
}
