/**
 * Stratifier — compute stratum assignment for a rule set.
 * Builds the predicate dependency graph (edges marked positive/negated).
 * Cycles through any negated edge ⇒ CYCLIC_NEGATION rejection.
 * Otherwise assigns each rule the smallest stratum N where all negated body
 * predicates are fully evaluated in strata 0..N-1.
 */

const predKey = (p) => `${p.predicate}/${p.arity}`;

export function stratify(rules) {
  // Build directed graph: head -> body atom (each edge marked positive or negated).
  // Map<predKey, Array<{ to: predKey, negated: boolean }>>
  const graph = new Map();
  const rulesByHead = new Map();
  for (const r of rules) {
    const hk = predKey(r.head);
    if (!rulesByHead.has(hk)) rulesByHead.set(hk, []);
    rulesByHead.get(hk).push(r);
    if (!graph.has(hk)) graph.set(hk, []);
    for (const b of r.body) {
      const bk = predKey(b);
      graph.get(hk).push({ to: bk, negated: !!b.negated });
      if (!graph.has(bk)) graph.set(bk, []);
    }
  }

  // Detect cycle through negation via DFS with edge-marking.
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map();
  for (const node of graph.keys()) color.set(node, WHITE);

  function dfs(node, pathHasNegation) {
    color.set(node, GRAY);
    for (const edge of graph.get(node) || []) {
      const childPathNeg = pathHasNegation || edge.negated;
      if (color.get(edge.to) === GRAY) {
        if (childPathNeg) {
          throw { code: 'CYCLIC_NEGATION', cycle: [node, edge.to], message: `cycle through negation: ${node} → ${edge.to}` };
        }
      } else if (color.get(edge.to) === WHITE) {
        dfs(edge.to, childPathNeg);
      }
    }
    color.set(node, BLACK);
  }

  for (const node of graph.keys()) {
    if (color.get(node) === WHITE) dfs(node, false);
  }

  // Assign strata: iterate until fixed point. A rule's stratum = max over its negated body predicates of (their stratum + 1), or 0 if no negated body atom.
  const predStratum = new Map();
  for (const k of graph.keys()) predStratum.set(k, 0);
  const ruleStratum = new Map();

  let changed = true;
  let iterations = 0;
  const maxIterations = rules.length * 2 + 2;
  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;
    for (const r of rules) {
      let s = 0;
      for (const b of r.body) {
        const bk = predKey(b);
        const bs = predStratum.get(bk) ?? 0;
        if (b.negated) {
          s = Math.max(s, bs + 1);
        } else {
          s = Math.max(s, bs);
        }
      }
      const prev = ruleStratum.get(r.ruleId);
      if (prev !== s) {
        ruleStratum.set(r.ruleId, s);
        const hk = predKey(r.head);
        const hs = predStratum.get(hk) ?? 0;
        if (s > hs) {
          predStratum.set(hk, s);
          changed = true;
        }
      }
    }
  }

  return ruleStratum;
}
