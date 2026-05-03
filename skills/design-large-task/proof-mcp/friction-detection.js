export function detectPermissionRiskLinkage(elements) {
  const out = [];
  for (const [, perm] of elements) {
    if (perm.type !== 'PERMISSION' || perm.status !== 'active' || !perm.relieves) continue;
    for (const [, risk] of elements) {
      if (risk.type !== 'RISK' || risk.status !== 'active') continue;
      const basis = Array.isArray(risk.basis) ? risk.basis : [];
      if (basis.includes(perm.relieves)) {
        out.push({
          friction_shape: 'permission-risk-linkage',
          anchor_a: perm.id, anchor_b: risk.id,
          statement: `Permission ${perm.id} relieves ${perm.relieves} which Risk ${risk.id} grounds in`,
          confidence: 'exact',
        });
      }
    }
  }
  return out;
}

export function detectNcNcOpposingPull(elements) {
  const out = [];
  const ncs = [...elements.values()].filter(el => el.type === 'NECESSARY_CONDITION' && el.status === 'active');
  for (let i = 0; i < ncs.length; i++) {
    for (let j = i + 1; j < ncs.length; j++) {
      const a = ncs[i].statement || '';
      const b = ncs[j].statement || '';
      if (/must not/i.test(a) && /must/i.test(b) && !/must not/i.test(b)) {
        out.push({ friction_shape: 'nc-nc-opposing-pull', anchor_a: ncs[i].id, anchor_b: ncs[j].id, statement: 'opposing must/must-not patterns', confidence: 'heuristic' });
      } else if (/must not/i.test(b) && /must/i.test(a) && !/must not/i.test(a)) {
        out.push({ friction_shape: 'nc-nc-opposing-pull', anchor_a: ncs[i].id, anchor_b: ncs[j].id, statement: 'opposing must/must-not patterns', confidence: 'heuristic' });
      }
    }
  }
  return out;
}

export function detectRcRuleConflict(elements) {
  const out = [];
  const rcs = [...elements.values()].filter(el => el.type === 'RESOLVE_CONDITION' && el.status === 'active');
  const rules = [...elements.values()].filter(el => el.type === 'RULE' && el.status === 'active');
  for (const rc of rcs) {
    for (const rule of rules) {
      const rcText = (rc.statement || '').toLowerCase();
      const ruleText = (rule.statement || '').toLowerCase();
      const restrictTokens = ['must not', 'cannot', 'forbidden', 'no '];
      if (restrictTokens.some(t => ruleText.includes(t))) {
        const ruleSubject = ruleText.replace(/^.*?(must not|cannot|forbidden|no )\s*/, '').split(/[.,;]/)[0].trim();
        if (ruleSubject && rcText.includes(ruleSubject)) {
          out.push({ friction_shape: 'rc-rule-conflict', anchor_a: rc.id, anchor_b: rule.id, statement: `RC describes "${ruleSubject}" which Rule restricts`, confidence: 'heuristic' });
        }
      }
    }
  }
  return out;
}

export function detectConcernConcernCompetition(elements, concerns) {
  const out = [];
  if (!Array.isArray(concerns)) return out;
  const rcsByAnchor = new Map();
  for (const [, el] of elements) {
    if (el.type === 'RESOLVE_CONDITION' && el.status === 'active' && el.problem_anchor) {
      if (!rcsByAnchor.has(el.problem_anchor)) rcsByAnchor.set(el.problem_anchor, []);
      rcsByAnchor.get(el.problem_anchor).push(el);
    }
  }
  for (let i = 0; i < concerns.length; i++) {
    for (let j = i + 1; j < concerns.length; j++) {
      const a = concerns[i].label || '';
      const b = concerns[j].label || '';
      const aTokens = new Set(a.toLowerCase().split(/\W+/).filter(t => t.length > 4));
      const bTokens = new Set(b.toLowerCase().split(/\W+/).filter(t => t.length > 4));
      const overlap = [...aTokens].filter(t => bTokens.has(t));
      if (overlap.length >= 2) {
        out.push({ friction_shape: 'concern-concern-competition', anchor_a: concerns[i].id, anchor_b: concerns[j].id, statement: `Concerns share tokens: ${overlap.join(', ')}`, confidence: 'heuristic' });
      }
    }
  }
  return out;
}

function dedupKey(c) {
  const [a, b] = [c.anchor_a, c.anchor_b].sort();
  return `${a}::${b}::${c.friction_shape}`;
}

export function runFrictionDetection(elements, concerns) {
  const existingKeys = new Set();
  for (const [, el] of elements) {
    if (el.type === 'FRICTION' && el.status === 'active') {
      existingKeys.add(dedupKey({ anchor_a: el.anchor_a, anchor_b: el.anchor_b, friction_shape: el.friction_shape }));
    }
  }
  const all = [
    ...detectPermissionRiskLinkage(elements),
    ...detectNcNcOpposingPull(elements),
    ...detectRcRuleConflict(elements),
    ...detectConcernConcernCompetition(elements, concerns),
  ];
  const seen = new Set(existingKeys);
  const filtered = [];
  for (const c of all) {
    const k = dedupKey(c);
    if (seen.has(k)) continue;
    seen.add(k);
    filtered.push(c);
  }
  const autoCreate = filtered.filter(c => c.friction_shape === 'permission-risk-linkage');
  const hints = filtered.filter(c => c.friction_shape !== 'permission-risk-linkage');
  return { hints, autoCreate };
}
