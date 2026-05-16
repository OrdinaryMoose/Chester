import { FRICTION_SHAPES } from './tags.js';

export function registerStatic(rulePorts) {
  // effective_grounding(P) holds when P has at least one grounding fact pointing at
  // a non-withdrawn evidence id. Negation operates on a derived predicate so
  // stratification works (pure Datalog can't combine 'grounding(P,E) AND not withdrew(E)'
  // in a single negative literal — that join must be reified into an intermediate).
  rulePorts.defineRule('effective_grounding_rule',
    ['effective_grounding', ['P']],
    [['grounding', ['P', 'E']], ['not', ['withdrew', ['E']]]],
    { domain_concept: 'effective_grounding', module: 'friction-policy' });
  // A proposition is ungrounded when no effective grounding exists for it. This now
  // catches both the structural case (no grounding fact at all — currently unreachable
  // through the public addElement API since schema requires the field) AND the
  // dynamic case (every grounding fact points at withdrawn evidence). The latter is
  // the load-bearing use case: it lets the friction system surface propositions that
  // have lost their evidential support without the operator having to manually
  // re-audit each one after a withdrawal.
  rulePorts.defineRule('ungrounded_proposition_rule',
    ['ungrounded_proposition', ['P']],
    [['proposition_decl', ['P', '_', '_']], ['not', ['effective_grounding', ['P']]]],
    { domain_concept: FRICTION_SHAPES.UNGROUNDED, module: 'friction-policy' });
  // coverage_gap_detected fires when a non-withdrawn risk has no live (= non-withdrawn)
  // addressing resolution. Uses effective_addresses (defined in closure-policy.js) so
  // withdrawing a resolution correctly reopens its risk's coverage gap. Excluding
  // withdrawn risks (`not withdrew(C)`) prevents stale risks from generating noise.
  rulePorts.defineRule('coverage_gap_rule',
    ['coverage_gap_detected', ['C']],
    [['risk', ['C', '_', '_']], ['not', ['effective_addresses', ['_', 'C']]], ['not', ['withdrew', ['C']]]],
    { domain_concept: FRICTION_SHAPES.COVERAGE_GAP, module: 'friction-policy' });
  // overlap_detected fires only when two distinct definitions share BOTH the term AND
  // the scope. Same term + different scope is treated as intentional dual-use; same id
  // (reflexive match) is filtered via not definition_self(T1, T2) — the Datalog-
  // inequality trick (DEFINITION translator emits definition_self(id, id) at add time;
  // the negation excludes T1=T2 bindings since they're the only ones for which a
  // matching self-fact exists).
  rulePorts.defineRule('overlap_rule',
    ['overlap_detected', ['T1', 'T2']],
    [
      ['definition_decl', ['T1', 'TERM', '_']],
      ['definition_decl', ['T2', 'TERM', '_']],
      ['definition_scope', ['T1', 'SCOPE']],
      ['definition_scope', ['T2', 'SCOPE']],
      ['not', ['definition_self', ['T1', 'T2']]],
    ],
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
 *
 * One entry per distinct semantic friction. For symmetric pair-shaped frictions
 * (overlap, conflict) the engine's pure-Datalog rules emit the full N² cross-product
 * — reflexive matches (T,T) and both directions of every pair (A,B)+(B,A) — because
 * Datalog without inequality predicates can't constrain the relation at the rule
 * level. This helper post-processes those into the canonical (T1<T2) form so each
 * underlying overlap/conflict produces exactly one finding.
 */
export function detectFrictions(readPorts) {
  const out = [];
  for (const row of readPorts.query.query(['ungrounded_proposition', [{ var: 'P' }]])) out.push({ shape: FRICTION_SHAPES.UNGROUNDED, args: [row.P] });
  for (const row of readPorts.query.query(['coverage_gap_detected', [{ var: 'C' }]])) out.push({ shape: FRICTION_SHAPES.COVERAGE_GAP, args: [row.C] });
  for (const row of canonicalizeSymmetricPairs(readPorts.query.query(['overlap_detected', [{ var: 'T1' }, { var: 'T2' }]]), 'T1', 'T2')) out.push({ shape: FRICTION_SHAPES.OVERLAP, args: [row.T1, row.T2] });
  for (const row of canonicalizeSymmetricPairs(readPorts.query.query(['conflict_detected', [{ var: 'R1' }, { var: 'R2' }]]), 'R1', 'R2')) out.push({ shape: FRICTION_SHAPES.CONFLICT, args: [row.R1, row.R2] });
  return out;
}

// Drop reflexive rows (a===b) and keep only the lexicographically-first direction
// of each symmetric pair. Stable: input order of distinct pairs is preserved.
function canonicalizeSymmetricPairs(rows, k1, k2) {
  const seen = new Set();
  const out = [];
  for (const row of rows) {
    const a = row[k1], b = row[k2];
    if (a === b) continue;
    const [lo, hi] = a < b ? [a, b] : [b, a];
    const key = `${lo}\x1f${hi}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ [k1]: lo, [k2]: hi });
  }
  return out;
}
