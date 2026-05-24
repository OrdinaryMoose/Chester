import { FRICTION_SHAPES } from './proof.js';

const SHAPE_PERMISSION_RISK = 'permission-risk-linkage';
const SHAPE_NC_NC = 'nc-nc-opposing-pull';
const SHAPE_RC_RULE = 'rc-rule-conflict';
const SHAPE_CONCERN_CONCERN = 'concern-concern-competition';

// Guard: every local shape constant must appear in the canonical FRICTION_SHAPES set.
// If proof.js renames or removes a shape, this throws at module load instead of silently
// producing FRICTION elements that createElement will reject.
for (const s of [SHAPE_PERMISSION_RISK, SHAPE_NC_NC, SHAPE_RC_RULE, SHAPE_CONCERN_CONCERN]) {
  if (!FRICTION_SHAPES.includes(s)) {
    throw new Error(`friction-detection.js: shape "${s}" not in FRICTION_SHAPES`);
  }
}

export function detectPermissionRiskLinkage(elements) {
  const out = [];
  for (const [, perm] of elements) {
    if (perm.type !== 'PERMISSION' || perm.status !== 'active' || !perm.relieves) continue;
    for (const [, risk] of elements) {
      if (risk.type !== 'RISK' || risk.status !== 'active') continue;
      const basis = Array.isArray(risk.basis) ? risk.basis : [];
      if (basis.includes(perm.relieves)) {
        out.push({
          friction_shape: SHAPE_PERMISSION_RISK,
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
        out.push({ friction_shape: SHAPE_NC_NC, anchor_a: ncs[i].id, anchor_b: ncs[j].id, statement: 'opposing must/must-not patterns', confidence: 'heuristic' });
      } else if (/must not/i.test(b) && /must/i.test(a) && !/must not/i.test(a)) {
        out.push({ friction_shape: SHAPE_NC_NC, anchor_a: ncs[i].id, anchor_b: ncs[j].id, statement: 'opposing must/must-not patterns', confidence: 'heuristic' });
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
          out.push({ friction_shape: SHAPE_RC_RULE, anchor_a: rc.id, anchor_b: rule.id, statement: `RC describes "${ruleSubject}" which Rule restricts`, confidence: 'heuristic' });
        }
      }
    }
  }
  return out;
}

export function detectConcernConcernCompetition(elements, concerns) {
  const out = [];
  if (!Array.isArray(concerns)) return out;
  for (let i = 0; i < concerns.length; i++) {
    for (let j = i + 1; j < concerns.length; j++) {
      const a = concerns[i].label || '';
      const b = concerns[j].label || '';
      const aTokens = new Set(a.toLowerCase().split(/\W+/).filter(t => t.length > 4));
      const bTokens = new Set(b.toLowerCase().split(/\W+/).filter(t => t.length > 4));
      const overlap = [...aTokens].filter(t => bTokens.has(t));
      if (overlap.length >= 2) {
        out.push({ friction_shape: SHAPE_CONCERN_CONCERN, anchor_a: concerns[i].id, anchor_b: concerns[j].id, statement: `Concerns share tokens: ${overlap.join(', ')}`, confidence: 'heuristic' });
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
  // Suppress re-detection for any anchor-pair already covered by a FRICTION
  // element, including withdrawn ones — a dismissed FRICTION is a deliberate
  // designer disposition and must not silently re-emerge on the next mutation.
  const existingKeys = new Set();
  for (const [, el] of elements) {
    if (el.type === 'FRICTION') {
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
  const autoCreate = filtered.filter(c => c.friction_shape === SHAPE_PERMISSION_RISK);
  const hints = filtered.filter(c => c.friction_shape !== SHAPE_PERMISSION_RISK);
  return { hints, autoCreate };
}
