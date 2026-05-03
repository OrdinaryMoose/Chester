# Plan: Cluster B.2 — Phase 4b Closing-Argument Materialization

**Sprint:** `cluster-b-2-define-solve-closing` (under master `20260430-02-rebuild-design-derivation`)
**Spec:** `docs/chester/working/20260430-02-rebuild-design-derivation/cluster-b-2-define-solve-closing/spec/cluster-b-2-define-solve-closing-spec-00.md`
**Execution mode:** subagent

**Per-task execution profile (designer override, 2026-05-03):**
- Tasks 1, 2, 3, 4, 6, 8, 10 — subagent (above heuristic; high blast radius and/or budget ≥ 3)
- Task 9 — subagent (borderline; cross-file pre-existing-test backfill makes independent verification worthwhile)
- Tasks 5, 7, 11, 12, 13, 14 — inline-eligible (below heuristic; low budget, narrow file scope, can batch)

The plan-header `Execution mode` field is `subagent` because execute-write today reads a single mode for the whole plan. The per-task profile above records the designer's intent: an executor that supports per-task mode selection should honor the inline-eligible flag for Tasks 5, 7, 11, 12, 13, 14. A current-version executor running everything under subagent mode is correct and safe — the inline-eligible flag is opt-in optimization, not a contract.

> **For agentic workers:** Use execute-write to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The `Execution mode` field selects which execute-write section runs — Section 2 (subagent-driven) or Section 3 (inline). plan-build sets this field at handoff based on the Execution Mode Selection heuristic, with human confirm/override.

## Goal

Materialize the closing argument as a deterministic structured-object derivation over current proof state, gate closure on a round-stamped two-yes designer choice, track friction as a first-class FRICTION element type with hybrid agent-detection / designer-override semantics, and surface phantom NCs/RCs/Friction with closed-set disposition tags.

## Architecture

Hybrid principled merge per spec architecture line: structured-object closing-argument output (the rendering layer composes display from the structured object); hybrid friction creation (auto-create on `permission-risk-linkage` exact-pointer match; agent-confirms-from-hints on the three heuristic detection rules); round-stamped two-yes flags (`closingArgPresentedRound`, `closingArgGoRound`); cluster-A six-touchpoint extension pattern (`ELEMENT_TYPES` + `ID_PREFIX` + `elementCounters` + validation block + integrity check + tool surface).

## Tech Stack

- Node.js ES modules (`"type": "module"` in `proof-mcp/package.json`)
- vitest for testing (`npm test` runs `vitest run`); test files live at `proof-mcp/__tests__/*.test.js` using `import { describe, it, expect, beforeEach } from 'vitest'`
- @modelcontextprotocol/sdk for tool dispatch in `server.js`
- All source paths under `/home/mike/Documents/CodeProjects/OrdinaryMoose/plugins/chester/skills/design-large-task/proof-mcp/`

---

## Task 1: FRICTION element type registration

**Type:** code-producing
**Implements:** AC-1.1, AC-1.3, AC-1.4
**Decision budget:** 2
**Must remain green:** `friction-element-type.test.js`, `proof.test.js`, `state.test.js`

**Files:**
- Modify: `proof-mcp/proof.js` (add to `ELEMENT_TYPES` line 13; add validation block in `createElement`; add `checkUngroundedFrictionAnchors`; register in `checkAllIntegrity`)
- Modify: `proof-mcp/state.js:16-23` (add `FRICTION: 'FRIC-'` to `ID_PREFIX`); `proof-mcp/state.js:35-37` (add `FRICTION: 0` to `elementCounters`)
- Modify: `proof-mcp/metrics.js:21-74` (add `friction_count` total + `live_friction_count` active to `computeCompleteness`)
- Test: `proof-mcp/__tests__/friction-element-type.test.js` (new)

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

```javascript
// proof-mcp/__tests__/friction-element-type.test.js
import { describe, it, expect } from 'vitest';
import { ELEMENT_TYPES, createElement, checkAllIntegrity } from '../proof.js';
import { initializeState, generateId } from '../state.js';

describe('FRICTION element type registration', () => {
  it('includes FRICTION in ELEMENT_TYPES as the seventh entry', () => {
    expect(ELEMENT_TYPES).toContain('FRICTION');
    expect(ELEMENT_TYPES.length).toBe(7);
  });

  it('createElement builds a FRICTION element with required fields', () => {
    const op = {
      type: 'FRICTION',
      friction_shape: 'permission-risk-linkage',
      anchor_a: 'PERM-1',
      anchor_b: 'RISK-2',
      disposition: 'relieved-by-exception',
      statement: 'Permission relieves rule that risk grounds in',
    };
    const el = createElement(op, 'FRIC-1', 5);
    expect(el.type).toBe('FRICTION');
    expect(el.id).toBe('FRIC-1');
    expect(el.status).toBe('active');
    expect(el.friction_shape).toBe('permission-risk-linkage');
    expect(el.disposition).toBe('relieved-by-exception');
    expect(el.anchor_a).toBe('PERM-1');
    expect(el.anchor_b).toBe('RISK-2');
    expect(el.addedInRound).toBe(5);
  });

  it('createElement rejects invalid friction_shape', () => {
    expect(() =>
      createElement(
        { type: 'FRICTION', friction_shape: 'logical-tension', anchor_a: 'X', anchor_b: 'Y', disposition: 'lived-with' },
        'FRIC-1',
        1,
      ),
    ).toThrow(/friction_shape/);
  });

  it('createElement rejects invalid disposition', () => {
    expect(() =>
      createElement(
        { type: 'FRICTION', friction_shape: 'rc-rule-conflict', anchor_a: 'X', anchor_b: 'Y', disposition: 'fixed-it' },
        'FRIC-1',
        1,
      ),
    ).toThrow(/disposition/);
  });

  it('initializeState seeds elementCounters.FRICTION = 0', () => {
    const state = initializeState('test problem');
    expect(state.elementCounters.FRICTION).toBe(0);
  });

  it('generateId returns FRIC-1 for FRICTION', () => {
    const state = initializeState('test problem');
    const [id] = generateId(state, 'FRICTION');
    expect(id).toBe('FRIC-1');
  });

  it('checkUngroundedFrictionAnchors flags FRICTION whose anchors do not exist', () => {
    const elements = new Map();
    elements.set('FRIC-1', {
      id: 'FRIC-1', type: 'FRICTION', status: 'active',
      friction_shape: 'nc-nc-opposing-pull',
      anchor_a: 'NCON-99', anchor_b: 'NCON-1', disposition: 'lived-with',
    });
    elements.set('NCON-1', { id: 'NCON-1', type: 'NECESSARY_CONDITION', status: 'active' });
    const warnings = checkAllIntegrity(elements);
    expect(warnings.some(w => /FRIC-1/.test(w) && /NCON-99/.test(w))).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /home/mike/Documents/CodeProjects/OrdinaryMoose/plugins/chester/skills/design-large-task/proof-mcp && npm test -- friction-element-type`
Expected: FAIL — `ELEMENT_TYPES` does not contain `'FRICTION'`; `createElement` does not handle FRICTION type.

- [ ] **Step 3: Write minimal implementation**

In `proof-mcp/proof.js` line 13, change:
```javascript
export const ELEMENT_TYPES = [
  'EVIDENCE', 'RULE', 'PERMISSION', 'NECESSARY_CONDITION', 'RISK', 'RESOLVE_CONDITION', 'FRICTION',
];
```

In `proof-mcp/proof.js` `createElement`, add a FRICTION validation block before the existing return (alongside the RESOLVE_CONDITION block):
```javascript
if (type === 'FRICTION') {
  const SHAPES = ['nc-nc-opposing-pull', 'rc-rule-conflict', 'permission-risk-linkage', 'concern-concern-competition'];
  const DISPOSITIONS = ['lived-with', 'relieved-by-exception', 'dissolved-by-revision', 'dissolved-by-scope-cut', 'not-really-friction'];
  if (!op.friction_shape || !SHAPES.includes(op.friction_shape)) {
    throw new Error(`FRICTION friction_shape required, must be one of: ${SHAPES.join(', ')}`);
  }
  if (!op.disposition || !DISPOSITIONS.includes(op.disposition)) {
    throw new Error(`FRICTION disposition required, must be one of: ${DISPOSITIONS.join(', ')}`);
  }
  if (!op.anchor_a || !op.anchor_b) {
    throw new Error('FRICTION requires anchor_a and anchor_b element IDs');
  }
  return {
    id, type, status: 'active',
    friction_shape: op.friction_shape,
    anchor_a: op.anchor_a,
    anchor_b: op.anchor_b,
    disposition: op.disposition,
    statement: op.statement ?? '',
    addedInRound: round,
    revisedInRound: null,
    revision: 0,
  };
}
```

Append `checkUngroundedFrictionAnchors` to `proof.js` and register in `checkAllIntegrity`:
```javascript
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
```
In `checkAllIntegrity` (proof.js:317), add `...checkUngroundedFrictionAnchors(elements)` to the spread.

In `proof-mcp/state.js:16-23` `ID_PREFIX`, add `FRICTION: 'FRIC-'`. In line 35-37 `elementCounters`, add `FRICTION: 0`.

In `proof-mcp/metrics.js` `computeCompleteness`, add iteration that counts FRICTION elements (both total and active-only — note this requires bypassing the existing active-only filter at line 37, either via early branch or separate loop):
```javascript
let friction_count = 0;
let live_friction_count = 0;
for (const [, el] of elements) {
  if (el.type === 'FRICTION') {
    friction_count++;
    if (el.status === 'active') live_friction_count++;
  }
}
// ...add friction_count and live_friction_count to the returned object
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /home/mike/Documents/CodeProjects/OrdinaryMoose/plugins/chester/skills/design-large-task/proof-mcp && npm test`
Expected: PASS — all friction-element-type tests green; existing tests still green.

- [ ] **Step 5: Commit**

```bash
git add proof-mcp/proof.js proof-mcp/state.js proof-mcp/metrics.js proof-mcp/__tests__/friction-element-type.test.js
git commit -m "feat: add FRICTION element type to proof MCP"
```

---

## Task 2: manage_friction tool + frictionLog

**Type:** code-producing
**Implements:** AC-1.2, AC-2.4, AC-8.2
**Decision budget:** 2
**Must remain green:** `friction-element-type.test.js`, `friction-lifecycle.test.js`, `state.test.js`, `server.test.js`

**Files:**
- Modify: `proof-mcp/state.js` (add `frictionLog: []` to `initializeState`; add `manageFriction` and `overrideFrictionDisposition` exports)
- Modify: `proof-mcp/server.js` (add `'FRICTION'` to local `ELEMENT_TYPES` line 17; add `manage_friction` and `override_friction_disposition` tool definitions and handlers)
- Test: `proof-mcp/__tests__/friction-lifecycle.test.js` (new)

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

```javascript
// proof-mcp/__tests__/friction-lifecycle.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { initializeState, applyOperations, manageFriction, overrideFrictionDisposition } from '../state.js';

describe('friction lifecycle', () => {
  let state;
  beforeEach(() => {
    state = initializeState('test problem');
    let r = applyOperations(state, [
      { op: 'add', type: 'EVIDENCE', statement: 'codebase fact', source: 'codebase' },
    ]);
    state = r.state;
    r = applyOperations(state, [
      { op: 'add', type: 'NECESSARY_CONDITION', statement: 'NC1', collapse_test: 'breaks if X', grounding: ['EVID-1'], reasoning_chain: 'IF X holds THEN NC1' },
      { op: 'add', type: 'NECESSARY_CONDITION', statement: 'NC2', collapse_test: 'breaks if Y', grounding: ['EVID-1'], reasoning_chain: 'IF Y holds THEN NC2' },
    ]);
    state = r.state;
  });

  it('manageFriction add creates a FRICTION element with FRIC-N id and appends to frictionLog', () => {
    const [newState, err] = manageFriction(state, {
      op: 'add',
      friction_shape: 'nc-nc-opposing-pull',
      anchor_a: 'NCON-1',
      anchor_b: 'NCON-2',
      disposition: 'lived-with',
      statement: 'NC1 and NC2 pull against each other',
    });
    expect(err).toBeNull();
    expect(newState.elements.get('FRIC-1').type).toBe('FRICTION');
    expect(newState.frictionLog.length).toBeGreaterThan(0);
    expect(newState.frictionLog[0].event).toBe('added');
    expect(newState.frictionLog[0].frictionId).toBe('FRIC-1');
  });

  it('manageFriction add rejects unknown anchor', () => {
    const [, err] = manageFriction(state, {
      op: 'add', friction_shape: 'nc-nc-opposing-pull',
      anchor_a: 'NCON-1', anchor_b: 'NCON-99',
      disposition: 'lived-with', statement: 'bad',
    });
    expect(err).toMatch(/unknown element id|NCON-99/);
  });

  it('overrideFrictionDisposition with not-really-friction transitions to withdrawn', () => {
    let [s] = manageFriction(state, {
      op: 'add', friction_shape: 'nc-nc-opposing-pull',
      anchor_a: 'NCON-1', anchor_b: 'NCON-2',
      disposition: 'lived-with', statement: 'noise',
    });
    [s] = overrideFrictionDisposition(s, { elementId: 'FRIC-1', disposition: 'not-really-friction' });
    expect(s.elements.get('FRIC-1').status).toBe('withdrawn');
    expect(s.elements.get('FRIC-1').disposition).toBe('not-really-friction');
    const events = s.frictionLog.map(e => e.event);
    expect(events).toContain('disposition-changed');
    expect(events).toContain('dismissed');
  });

  it('overrideFrictionDisposition rejects non-FRICTION element', () => {
    const [, err] = overrideFrictionDisposition(state, { elementId: 'NCON-1', disposition: 'lived-with' });
    expect(err).toMatch(/must be FRICTION/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /home/mike/Documents/CodeProjects/OrdinaryMoose/plugins/chester/skills/design-large-task/proof-mcp && npm test -- friction-lifecycle`
Expected: FAIL — `manageFriction` not exported.

- [ ] **Step 3: Write minimal implementation**

In `state.js` `initializeState` (line 30-49), add `frictionLog: []` to the returned object.

Append to `state.js`:
```javascript
export function manageFriction(state, input) {
  const { op } = input;
  if (op !== 'add') {
    return [state, `Unknown manage_friction op: ${op}`];
  }
  const newState = structuredClone(state);
  newState.elements = cloneElements(state.elements);
  if (!newState.elements.has(input.anchor_a)) {
    return [state, `unknown element id: ${input.anchor_a}`];
  }
  if (!newState.elements.has(input.anchor_b)) {
    return [state, `unknown element id: ${input.anchor_b}`];
  }
  const [id, withId] = generateId(newState, 'FRICTION');
  let element;
  try {
    element = createElement({ ...input, type: 'FRICTION' }, id, withId.round);
  } catch (e) {
    return [state, e.message];
  }
  withId.elements.set(id, element);
  withId.frictionLog.push({
    event: 'added', frictionId: id, round: withId.round,
    friction_shape: input.friction_shape, disposition: input.disposition,
  });
  return [withId, null];
}

export function overrideFrictionDisposition(state, { elementId, disposition }) {
  const target = state.elements.get(elementId);
  if (!target) return [state, `unknown element id: ${elementId}`];
  if (target.type !== 'FRICTION') {
    return [state, `element_id must be FRICTION; got ${elementId} (type: ${target.type})`];
  }
  const DISPOSITIONS = ['lived-with', 'relieved-by-exception', 'dissolved-by-revision', 'dissolved-by-scope-cut', 'not-really-friction'];
  if (!DISPOSITIONS.includes(disposition)) {
    return [state, `disposition must be one of: ${DISPOSITIONS.join(', ')}; got ${disposition}`];
  }
  const newState = structuredClone(state);
  newState.elements = cloneElements(state.elements);
  const t = newState.elements.get(elementId);
  const oldDisposition = t.disposition;
  t.disposition = disposition;
  newState.frictionLog.push({ event: 'disposition-changed', frictionId: elementId, round: newState.round, oldDisposition, newDisposition: disposition });
  if (['dissolved-by-revision', 'dissolved-by-scope-cut', 'not-really-friction'].includes(disposition)) {
    t.status = 'withdrawn';
    newState.frictionLog.push({ event: 'dismissed', frictionId: elementId, round: newState.round });
  }
  return [newState, null];
}
```

In `server.js`, add `'FRICTION'` to the local `ELEMENT_TYPES` enum at line 17. Add `manage_friction` and `override_friction_disposition` tool definitions and handlers (mirror existing `manage_concerns` / `ratify_resolve_condition` shape).

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /home/mike/Documents/CodeProjects/OrdinaryMoose/plugins/chester/skills/design-large-task/proof-mcp && npm test`
Expected: PASS — friction-lifecycle tests green; all other tests green.

- [ ] **Step 5: Commit**

```bash
git add proof-mcp/state.js proof-mcp/server.js proof-mcp/__tests__/friction-lifecycle.test.js
git commit -m "feat: add manage_friction and override_friction_disposition MCP tools"
```

---

## Task 3: Friction detection module

**Type:** code-producing
**Implements:** AC-2.2, AC-2.3
**Decision budget:** 3
**Must remain green:** `friction-detection.test.js`

**Files:**
- Create: `proof-mcp/friction-detection.js`
- Test: `proof-mcp/__tests__/friction-detection.test.js` (new)

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

```javascript
// proof-mcp/__tests__/friction-detection.test.js
import { describe, it, expect } from 'vitest';
import { detectPermissionRiskLinkage, detectNcNcOpposingPull, detectRcRuleConflict, detectConcernConcernCompetition, runFrictionDetection } from '../friction-detection.js';

function el(id, type, extra = {}) {
  return { id, type, status: 'active', ...extra };
}

describe('friction-detection', () => {
  it('detectPermissionRiskLinkage returns exact match when permission relieves a rule a risk basis in', () => {
    const elements = new Map();
    elements.set('RULE-1', el('RULE-1', 'RULE'));
    elements.set('PERM-1', el('PERM-1', 'PERMISSION', { relieves: 'RULE-1' }));
    elements.set('RISK-1', el('RISK-1', 'RISK', { basis: ['RULE-1'] }));
    const out = detectPermissionRiskLinkage(elements);
    expect(out.length).toBe(1);
    expect(out[0].friction_shape).toBe('permission-risk-linkage');
    expect(out[0].anchor_a).toBe('PERM-1');
    expect(out[0].anchor_b).toBe('RISK-1');
  });

  it('detectPermissionRiskLinkage returns nothing when basis does not match relieves', () => {
    const elements = new Map();
    elements.set('RULE-1', el('RULE-1', 'RULE'));
    elements.set('RULE-2', el('RULE-2', 'RULE'));
    elements.set('PERM-1', el('PERM-1', 'PERMISSION', { relieves: 'RULE-1' }));
    elements.set('RISK-1', el('RISK-1', 'RISK', { basis: ['RULE-2'] }));
    expect(detectPermissionRiskLinkage(elements).length).toBe(0);
  });

  it('runFrictionDetection deduplicates by anchor pair plus audit_rule', () => {
    const elements = new Map();
    elements.set('RULE-1', el('RULE-1', 'RULE'));
    elements.set('PERM-1', el('PERM-1', 'PERMISSION', { relieves: 'RULE-1' }));
    elements.set('RISK-1', el('RISK-1', 'RISK', { basis: ['RULE-1'] }));
    elements.set('FRIC-1', el('FRIC-1', 'FRICTION', { anchor_a: 'PERM-1', anchor_b: 'RISK-1', friction_shape: 'permission-risk-linkage' }));
    const { hints, autoCreate } = runFrictionDetection(elements, []);
    expect(autoCreate.length).toBe(0);
    expect(hints.length).toBe(0);
  });

  it('runFrictionDetection auto-creates only permission-risk-linkage; heuristic shapes go to hints', () => {
    const elements = new Map();
    elements.set('RULE-1', el('RULE-1', 'RULE'));
    elements.set('PERM-1', el('PERM-1', 'PERMISSION', { relieves: 'RULE-1' }));
    elements.set('RISK-1', el('RISK-1', 'RISK', { basis: ['RULE-1'] }));
    elements.set('NCON-1', el('NCON-1', 'NECESSARY_CONDITION', { statement: 'must X' }));
    elements.set('NCON-2', el('NCON-2', 'NECESSARY_CONDITION', { statement: 'must not X' }));
    const { hints, autoCreate } = runFrictionDetection(elements, []);
    expect(autoCreate.find(c => c.friction_shape === 'permission-risk-linkage')).toBeDefined();
    expect(autoCreate.find(c => c.friction_shape === 'nc-nc-opposing-pull')).toBeUndefined();
    expect(hints.find(h => h.friction_shape === 'nc-nc-opposing-pull')).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /home/mike/Documents/CodeProjects/OrdinaryMoose/plugins/chester/skills/design-large-task/proof-mcp && npm test -- friction-detection`
Expected: FAIL — `friction-detection.js` does not exist.

- [ ] **Step 3: Write minimal implementation**

Create `proof-mcp/friction-detection.js`:
```javascript
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /home/mike/Documents/CodeProjects/OrdinaryMoose/plugins/chester/skills/design-large-task/proof-mcp && npm test -- friction-detection`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add proof-mcp/friction-detection.js proof-mcp/__tests__/friction-detection.test.js
git commit -m "feat: add friction detection module with four shape detectors"
```

---

## Task 4: Wire friction detection into mutating exports

**Type:** code-producing
**Implements:** AC-2.1
**Decision budget:** 2
**Must remain green:** `friction-detection.test.js`, `friction-lifecycle.test.js`, `state.test.js`, `server.test.js`

**Files:**
- Modify: `proof-mcp/state.js` (call `runFrictionDetection` at tail of `applyOperations`, `addConcern`, `lockConcerns`, `ratifyResolveCondition`, `manageFriction`, `overrideFrictionDisposition`; auto-persist `permission-risk-linkage` candidates; return `friction_hints[]` in result)
- Modify: `proof-mcp/server.js` (extend mutating tool response payloads to include `friction_hints[]`)

**Steps (TDD):**

- [ ] **Step 1: Write the failing test** — Append to `__tests__/friction-detection.test.js`:

```javascript
import { initializeState, applyOperations } from '../state.js';

describe('friction detection wired into applyOperations', () => {
  it('auto-creates permission-risk-linkage FRICTION on next applyOperations call', () => {
    let state = initializeState('test');
    let r = applyOperations(state, [
      { op: 'add', type: 'RULE', statement: 'must not Z', source: 'designer' },
    ]);
    state = r.state;
    r = applyOperations(state, [
      { op: 'add', type: 'PERMISSION', statement: 'allow Z', source: 'designer', relieves: 'RULE-1' },
      { op: 'add', type: 'RISK', statement: 'Z is dangerous', basis: ['RULE-1'] },
    ]);
    state = r.state;
    const fric = [...state.elements.values()].find(el => el.type === 'FRICTION');
    expect(fric).toBeDefined();
    expect(fric.friction_shape).toBe('permission-risk-linkage');
  });

  it('returns friction_hints[] in payload for heuristic shapes', () => {
    let state = initializeState('test');
    let r = applyOperations(state, [
      { op: 'add', type: 'EVIDENCE', statement: 'fact', source: 'codebase' },
    ]);
    state = r.state;
    r = applyOperations(state, [
      { op: 'add', type: 'NECESSARY_CONDITION', statement: 'must X', collapse_test: 'a', grounding: ['EVID-1'], reasoning_chain: 'IF X' },
      { op: 'add', type: 'NECESSARY_CONDITION', statement: 'must not X', collapse_test: 'b', grounding: ['EVID-1'], reasoning_chain: 'IF not X' },
    ]);
    expect(r.friction_hints).toBeDefined();
    expect(r.friction_hints.some(h => h.friction_shape === 'nc-nc-opposing-pull')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- friction-detection`
Expected: FAIL — auto-persist not wired; `friction_hints` not in payload.

- [ ] **Step 3: Write minimal implementation**

In `state.js`, import `runFrictionDetection` from `./friction-detection.js` at the top.

Add a helper near the top of `state.js`:
```javascript
function processFriction(state) {
  const { hints, autoCreate } = runFrictionDetection(state.elements, state.concerns);
  for (const candidate of autoCreate) {
    const [id, withId] = generateId(state, 'FRICTION');
    state = withId;
    const element = createElement({
      type: 'FRICTION',
      friction_shape: candidate.friction_shape,
      anchor_a: candidate.anchor_a,
      anchor_b: candidate.anchor_b,
      disposition: 'lived-with',
      statement: candidate.statement,
    }, id, state.round);
    state.elements.set(id, element);
    state.frictionLog.push({ event: 'auto-added', frictionId: id, round: state.round, friction_shape: candidate.friction_shape, disposition: 'lived-with' });
  }
  return { state, hints };
}
```

In `applyOperations`, before constructing the return at the tail, call `processFriction(current)` and **rebind `current` to the returned state** before merging `friction_hints` into the return object — `processFriction` returns a new (cloned) state with auto-created FRICTION elements; if the return value is discarded, the auto-creates are silently lost. Concretely:

```javascript
const fricResult = processFriction(current);
current = fricResult.state;        // load-bearing — must rebind
const friction_hints = fricResult.hints;
// ... existing return construction now uses the rebound current and adds friction_hints to payload
```

In `addConcern`, `lockConcerns`, `ratifyResolveCondition`, `manageFriction`, `overrideFrictionDisposition` — call `processFriction(newState)`, **rebind `newState` to the returned state** for the same reason, then attach `friction_hints` to the result tuple where returned.

In `server.js`, extend the response payload of every mutating tool handler to forward `friction_hints` from the function result.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS — auto-persist works; hints surface; existing tests green.

- [ ] **Step 5: Commit**

```bash
git add proof-mcp/state.js proof-mcp/server.js proof-mcp/__tests__/friction-detection.test.js
git commit -m "feat: wire friction detection into all state-mutating exports"
```

---

## Task 5: Withdrawal disposition support

**Type:** code-producing
**Implements:** AC-7.1, AC-7.2
**Decision budget:** 1
**Must remain green:** `withdrawal-disposition.test.js`, `state.test.js`

**Files:**
- Modify: `proof-mcp/state.js:229-238` (extend withdraw case in `applyOperations` to accept optional `withdrawal_disposition`)
- Test: `proof-mcp/__tests__/withdrawal-disposition.test.js` (new)

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

```javascript
// proof-mcp/__tests__/withdrawal-disposition.test.js
import { describe, it, expect } from 'vitest';
import { initializeState, applyOperations } from '../state.js';

describe('withdrawal_disposition', () => {
  it('stores withdrawal_disposition on withdrawn element when provided', () => {
    let state = initializeState('test');
    let r = applyOperations(state, [{ op: 'add', type: 'EVIDENCE', statement: 'fact', source: 'codebase' }]);
    state = r.state;
    r = applyOperations(state, [{ op: 'add', type: 'NECESSARY_CONDITION', statement: 'NC1', collapse_test: 'a', grounding: ['EVID-1'], reasoning_chain: 'IF fact THEN NC1' }]);
    state = r.state;
    r = applyOperations(state, [{ op: 'withdraw', target: 'NCON-1', withdrawal_disposition: 'superseded' }]);
    expect(r.state.elements.get('NCON-1').status).toBe('withdrawn');
    expect(r.state.elements.get('NCON-1').withdrawal_disposition).toBe('superseded');
  });

  it('defaults withdrawal_disposition to unclassified when omitted', () => {
    let state = initializeState('test');
    let r = applyOperations(state, [{ op: 'add', type: 'EVIDENCE', statement: 'fact', source: 'codebase' }]);
    state = r.state;
    r = applyOperations(state, [{ op: 'add', type: 'NECESSARY_CONDITION', statement: 'NC1', collapse_test: 'a', grounding: ['EVID-1'], reasoning_chain: 'IF fact THEN NC1' }]);
    state = r.state;
    r = applyOperations(state, [{ op: 'withdraw', target: 'NCON-1' }]);
    expect(r.state.elements.get('NCON-1').withdrawal_disposition).toBe('unclassified');
  });

  it('rejects invalid withdrawal_disposition', () => {
    let state = initializeState('test');
    let r = applyOperations(state, [{ op: 'add', type: 'EVIDENCE', statement: 'fact', source: 'codebase' }]);
    state = r.state;
    r = applyOperations(state, [{ op: 'add', type: 'NECESSARY_CONDITION', statement: 'NC1', collapse_test: 'a', grounding: ['EVID-1'], reasoning_chain: 'IF fact THEN NC1' }]);
    state = r.state;
    r = applyOperations(state, [{ op: 'withdraw', target: 'NCON-1', withdrawal_disposition: 'bogus' }]);
    expect(r.errors.some(e => /withdrawal_disposition/.test(e))).toBe(true);
    expect(r.state.elements.get('NCON-1').status).toBe('active');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- withdrawal-disposition`
Expected: FAIL — disposition not stored; default not applied.

- [ ] **Step 3: Write minimal implementation**

In `state.js` `applyOperations` withdraw case (line 229), replace with:
```javascript
case 'withdraw': {
  const target = current.elements.get(op.target);
  if (!target || target.status !== 'active') {
    errors.push(`Cannot withdraw "${op.target}": element not found or not active`);
    break;
  }
  const ALLOWED = ['consolidated', 'superseded', 'found-redundant', 'found-incorrect', 'scope-removed'];
  let disposition;
  if (op.withdrawal_disposition === undefined) {
    disposition = 'unclassified';
  } else if (!ALLOWED.includes(op.withdrawal_disposition)) {
    errors.push(`Cannot withdraw "${op.target}": withdrawal_disposition must be one of ${ALLOWED.join(', ')}; got ${op.withdrawal_disposition}`);
    break;
  } else {
    disposition = op.withdrawal_disposition;
  }
  target.status = 'withdrawn';
  target.withdrawal_disposition = disposition;
  withdrawn.push(op.target);
  break;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add proof-mcp/state.js proof-mcp/__tests__/withdrawal-disposition.test.js
git commit -m "feat: extend withdraw operation with withdrawal_disposition closed-set field"
```

---

## Task 6: Two-yes flag store + clearClosingFlags helper

**Type:** code-producing
**Implements:** AC-5.2, AC-5.5
**Decision budget:** 2
**Must remain green:** `two-yes-flags.test.js`, `mutation-clears-flags.test.js`, `state.test.js`

**Files:**
- Modify: `proof-mcp/state.js` (add flag fields to `initializeState`; add `clearClosingFlags`, `recordClosingArgPresented`, `recordDesignerGo`; insert `clearClosingFlags` call at top of every mutating export — `applyOperations`, `addConcern`, `lockConcerns`, `ratifyResolveCondition`, `markChallengeUsed`, `manageFriction`, `overrideFrictionDisposition`)
- Test: `proof-mcp/__tests__/two-yes-flags.test.js` (new)
- Test: `proof-mcp/__tests__/mutation-clears-flags.test.js` (new)

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

```javascript
// proof-mcp/__tests__/two-yes-flags.test.js
import { describe, it, expect } from 'vitest';
import { initializeState, recordClosingArgPresented, recordDesignerGo, clearClosingFlags } from '../state.js';

describe('two-yes flags', () => {
  it('initializeState sets both flags to null', () => {
    const s = initializeState('p');
    expect(s.closingArgPresentedRound).toBeNull();
    expect(s.closingArgGoRound).toBeNull();
  });

  it('recordClosingArgPresented sets presented round to current round', () => {
    let s = initializeState('p');
    s.round = 5;
    s = recordClosingArgPresented(s);
    expect(s.closingArgPresentedRound).toBe(5);
    expect(s.closingArgGoRound).toBeNull();
  });

  it('recordDesignerGo refuses if presented round mismatches current round', () => {
    let s = initializeState('p');
    s.round = 5;
    s.closingArgPresentedRound = 4;
    const [, err] = recordDesignerGo(s);
    expect(err).toMatch(/presented in round 4/);
  });

  it('recordDesignerGo sets go round when presented round matches', () => {
    let s = initializeState('p');
    s.round = 5;
    s.closingArgPresentedRound = 5;
    const [newS, err] = recordDesignerGo(s);
    expect(err).toBeNull();
    expect(newS.closingArgGoRound).toBe(5);
  });

  it('clearClosingFlags resets both flags to null (in-place mutation; intended for already-cloned state)', () => {
    let s = initializeState('p');
    s.closingArgPresentedRound = 5;
    s.closingArgGoRound = 5;
    const returned = clearClosingFlags(s);
    expect(returned).toBe(s); // in-place: returns same reference
    expect(s.closingArgPresentedRound).toBeNull();
    expect(s.closingArgGoRound).toBeNull();
  });
});
```

```javascript
// proof-mcp/__tests__/mutation-clears-flags.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { initializeState, applyOperations, addConcern, lockConcerns, ratifyResolveCondition, markChallengeUsed, manageFriction, overrideFrictionDisposition, loadState } from '../state.js';

function withFlagsSet(state) {
  state.closingArgPresentedRound = 3;
  state.closingArgGoRound = 3;
  return state;
}

describe('mutation-clears-flags', () => {
  it('applyOperations clears flags', () => {
    let s = withFlagsSet(initializeState('p'));
    let r = applyOperations(s, [{ op: 'add', type: 'EVIDENCE', statement: 'e', source: 'codebase' }]);
    s = r.state;
    s.closingArgPresentedRound = 3; s.closingArgGoRound = 3;
    r = applyOperations(s, [{ op: 'add', type: 'NECESSARY_CONDITION', statement: 'NC', collapse_test: 'a', grounding: ['EVID-1'], reasoning_chain: 'IF e THEN NC' }]);
    expect(r.state.closingArgPresentedRound).toBeNull();
    expect(r.state.closingArgGoRound).toBeNull();
  });

  it('addConcern clears flags', () => {
    let s = withFlagsSet(initializeState('p'));
    const [, newS] = addConcern(s, { label: 'C', description: 'd' });
    expect(newS.closingArgPresentedRound).toBeNull();
    expect(newS.closingArgGoRound).toBeNull();
  });

  it('lockConcerns clears flags', () => {
    let s = initializeState('p');
    const [, sa] = addConcern(s, { label: 'C', description: 'd' });
    s = withFlagsSet(sa);
    const [newS] = lockConcerns(s);
    expect(newS.closingArgPresentedRound).toBeNull();
    expect(newS.closingArgGoRound).toBeNull();
  });

  it('ratifyResolveCondition clears flags', () => {
    let s = initializeState('p');
    const [, sa] = addConcern(s, { label: 'C', description: 'd' });
    s = sa;
    [s] = lockConcerns(s);
    let r = applyOperations(s, [{ op: 'add', type: 'EVIDENCE', statement: 'e', source: 'codebase' }]);
    s = r.state;
    r = applyOperations(s, [
      { op: 'add', type: 'NECESSARY_CONDITION', statement: 'NC', collapse_test: 'a', grounding: ['EVID-1'], reasoning_chain: 'IF e THEN NC' },
      { op: 'add', type: 'RESOLVE_CONDITION', statement: 'RC', problem_anchor: 'CERN-1', grounding: ['NCON-1'] },
    ]);
    s = withFlagsSet(r.state);
    const [newS] = ratifyResolveCondition(s, { elementId: 'RCON-1', ratificationText: 'ok' });
    expect(newS.closingArgPresentedRound).toBeNull();
    expect(newS.closingArgGoRound).toBeNull();
  });

  it('markChallengeUsed clears flags', () => {
    let s = withFlagsSet(initializeState('p'));
    const newS = markChallengeUsed(s, 'devil');
    expect(newS.closingArgPresentedRound).toBeNull();
    expect(newS.closingArgGoRound).toBeNull();
  });

  it('manageFriction add clears flags', () => {
    let s = initializeState('p');
    let r = applyOperations(s, [{ op: 'add', type: 'EVIDENCE', statement: 'e', source: 'codebase' }]);
    s = r.state;
    r = applyOperations(s, [
      { op: 'add', type: 'NECESSARY_CONDITION', statement: 'NC1', collapse_test: 'a', grounding: ['EVID-1'], reasoning_chain: 'IF e THEN NC1' },
      { op: 'add', type: 'NECESSARY_CONDITION', statement: 'NC2', collapse_test: 'b', grounding: ['EVID-1'], reasoning_chain: 'IF e THEN NC2' },
    ]);
    s = withFlagsSet(r.state);
    const [newS] = manageFriction(s, {
      op: 'add', friction_shape: 'nc-nc-opposing-pull',
      anchor_a: 'NCON-1', anchor_b: 'NCON-2',
      disposition: 'lived-with', statement: 'x',
    });
    expect(newS.closingArgPresentedRound).toBeNull();
    expect(newS.closingArgGoRound).toBeNull();
  });

  it('overrideFrictionDisposition clears flags', () => {
    let s = initializeState('p');
    let r = applyOperations(s, [{ op: 'add', type: 'EVIDENCE', statement: 'e', source: 'codebase' }]);
    s = r.state;
    r = applyOperations(s, [
      { op: 'add', type: 'NECESSARY_CONDITION', statement: 'NC1', collapse_test: 'a', grounding: ['EVID-1'], reasoning_chain: 'IF e THEN NC1' },
      { op: 'add', type: 'NECESSARY_CONDITION', statement: 'NC2', collapse_test: 'b', grounding: ['EVID-1'], reasoning_chain: 'IF e THEN NC2' },
    ]);
    s = r.state;
    [s] = manageFriction(s, {
      op: 'add', friction_shape: 'nc-nc-opposing-pull',
      anchor_a: 'NCON-1', anchor_b: 'NCON-2',
      disposition: 'lived-with', statement: 'x',
    });
    s = withFlagsSet(s);
    const [newS] = overrideFrictionDisposition(s, { elementId: 'FRIC-1', disposition: 'relieved-by-exception' });
    expect(newS.closingArgPresentedRound).toBeNull();
    expect(newS.closingArgGoRound).toBeNull();
  });

  // Read-only invariant of AC-5.5: get_proof_state / loadState do not mutate flags
  describe('read-only paths do NOT clear flags', () => {
    let dir;
    beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'proof-')); });
    afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

    it('loadState preserves both flag values from disk', () => {
      const path = join(dir, 'state.json');
      const s = withFlagsSet(initializeState('p'));
      writeFileSync(path, JSON.stringify({ ...s, elements: Object.fromEntries(s.elements) }));
      const loaded = loadState(path);
      expect(loaded.closingArgPresentedRound).toBe(3);
      expect(loaded.closingArgGoRound).toBe(3);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- two-yes-flags mutation-clears-flags`
Expected: FAIL — flags not initialized; helpers not exported; mutation does not clear.

- [ ] **Step 3: Write minimal implementation**

In `state.js` `initializeState` (line 30), add:
```javascript
closingArgPresentedRound: null,
closingArgGoRound: null,
```

Add to `state.js`:
```javascript
// Mutates the passed state in-place. Intended to be called on an already-cloned
// `newState` inside a mutating export, after the export's own structuredClone+cloneElements.
// Inline-set discipline: do NOT call this helper from outside a mutating function's body —
// it does not clone, so calling it on shared state will mutate the caller's reference.
// Exported only so tests can verify the flag-clearing invariant on a known clone.
export function clearClosingFlags(state) {
  state.closingArgPresentedRound = null;
  state.closingArgGoRound = null;
  return state;
}

export function recordClosingArgPresented(state) {
  const newState = structuredClone(state);
  newState.elements = cloneElements(state.elements);
  newState.closingArgPresentedRound = newState.round;
  return newState;
}

export function recordDesignerGo(state) {
  if (state.closingArgPresentedRound !== state.round) {
    return [state, `closing argument presented in round ${state.closingArgPresentedRound}, current round ${state.round}; call present_closing_argument first`];
  }
  const newState = structuredClone(state);
  newState.elements = cloneElements(state.elements);
  newState.closingArgGoRound = newState.round;
  return [newState, null];
}
```

At the top of every mutating export (`applyOperations` after the initial clone, `addConcern` after the locked check passes, `lockConcerns` after the locked-empty check, `ratifyResolveCondition` after validation, `markChallengeUsed` at the top, `manageFriction` after the op-validation, `overrideFrictionDisposition` after target validation), set:
```javascript
newState.closingArgPresentedRound = null;
newState.closingArgGoRound = null;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS — flag tests green; existing tests green.

- [ ] **Step 5: Commit**

```bash
git add proof-mcp/state.js proof-mcp/__tests__/two-yes-flags.test.js proof-mcp/__tests__/mutation-clears-flags.test.js
git commit -m "feat: add round-stamped two-yes flags with mutation-clears discipline"
```

---

## Task 7: loadState backfill for new state fields

**Type:** code-producing
**Implements:** AC-8.1
**Decision budget:** 1
**Must remain green:** `loadstate-backfill.test.js`, `state.test.js`

**Files:**
- Modify: `proof-mcp/state.js:310-322` (extend `loadState` backfill block)
- Test: `proof-mcp/__tests__/loadstate-backfill.test.js` (new)

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

```javascript
// proof-mcp/__tests__/loadstate-backfill.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { loadState } from '../state.js';

describe('loadState backfill for cluster B.2 fields', () => {
  let dir;
  beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'proof-')); });
  afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

  it('backfills closingArgPresentedRound, closingArgGoRound, frictionLog, FRICTION counter', () => {
    const path = join(dir, 'state.json');
    const legacy = {
      round: 0, problemStatement: 'p', elements: {},
      elementCounters: { EVIDENCE: 0, RULE: 0, PERMISSION: 0, NECESSARY_CONDITION: 0, RISK: 0, RESOLVE_CONDITION: 0 },
      conditionCountHistory: [], elementCountHistory: [],
      challengeModesUsed: [], challengeLog: [], revisionLog: [],
      phaseTransitionRound: 0, concerns: [], concernsLocked: false,
      concernCounter: 0, ratificationLog: [],
    };
    writeFileSync(path, JSON.stringify(legacy));
    const s = loadState(path);
    expect(s.closingArgPresentedRound).toBeNull();
    expect(s.closingArgGoRound).toBeNull();
    expect(s.frictionLog).toEqual([]);
    expect(s.elementCounters.FRICTION).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- loadstate-backfill`
Expected: FAIL — backfill not in place.

- [ ] **Step 3: Write minimal implementation**

In `state.js` `loadState` after line 318, add:
```javascript
raw.elementCounters.FRICTION ??= 0;
raw.closingArgPresentedRound ??= null;
raw.closingArgGoRound ??= null;
raw.frictionLog ??= [];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add proof-mcp/state.js proof-mcp/__tests__/loadstate-backfill.test.js
git commit -m "feat: backfill cluster B.2 state fields in loadState"
```

---

## Task 8: Composite trigger evaluator

**Type:** code-producing
**Implements:** AC-4.1, AC-4.2, AC-4.3, AC-4.4
**Decision budget:** 3
**Must remain green:** `trigger-evaluator.test.js`, `metrics.test.js`

**Files:**
- Modify: `proof-mcp/metrics.js` (add `CLOSING_ARG_FLOORS` constants + `evaluateTrigger(state)`)
- Test: `proof-mcp/__tests__/trigger-evaluator.test.js` (new)

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

```javascript
// proof-mcp/__tests__/trigger-evaluator.test.js
import { describe, it, expect } from 'vitest';
import { evaluateTrigger, CLOSING_ARG_FLOORS } from '../metrics.js';
import { initializeState, applyOperations, addConcern, lockConcerns, ratifyResolveCondition } from '../state.js';

function buildClosureReadyState() {
  let s = initializeState('p');
  let [, sa] = addConcern(s, { label: 'broad concern X', description: 'd' });
  s = sa;
  [s] = lockConcerns(s);
  let r = applyOperations(s, [
    { op: 'add', type: 'EVIDENCE', statement: 'fact-1', source: 'codebase' },
    { op: 'add', type: 'NECESSARY_CONDITION', statement: 'must Q', collapse_test: 'breaks if no Q', grounding: ['EVID-1'], reasoning_chain: 'IF fact-1 THEN must Q', rejected_alternatives: ['alt'] },
    { op: 'add', type: 'RESOLVE_CONDITION', statement: 'system Qs', problem_anchor: 'CERN-1', grounding: ['NCON-1'] },
  ]);
  s = r.state;
  r = applyOperations(s, [{ op: 'revise', target: 'NCON-1', collapse_test: 'breaks if no Q at all' }]);
  s = r.state;
  [s] = ratifyResolveCondition(s, { elementId: 'RCON-1', ratificationText: 'designer ratified' });
  while (s.round < 3) {
    r = applyOperations(s, []);
    s = r.state;
  }
  return s;
}

describe('evaluateTrigger', () => {
  it('returns permitted=true with all signals clear', () => {
    const s = buildClosureReadyState();
    const out = evaluateTrigger(s);
    expect(out.permitted).toBe(true);
    expect(out.reasons).toEqual([]);
  });

  it('returns permitted=false naming each failed per-signal floor', () => {
    const s = initializeState('p');
    const out = evaluateTrigger(s);
    expect(out.permitted).toBe(false);
    expect(out.reasons.length).toBeGreaterThan(0);
  });

  it('exports CLOSING_ARG_FLOORS for test override', () => {
    expect(CLOSING_ARG_FLOORS.aggregateScoreFloor).toBeDefined();
    expect(CLOSING_ARG_FLOORS.groundingCoverageFloor).toBeDefined();
  });

  // Per-signal-floor isolation tests (AC-4.1)
  it('isolates grounding-coverage floor failure', () => {
    const s = buildClosureReadyState();
    // remove grounding from the NC to drop coverage below floor
    const nc = s.elements.get('NCON-1');
    nc.grounding = [];
    const out = evaluateTrigger(s);
    expect(out.permitted).toBe(false);
    expect(out.reasons.some(r => /grounding_coverage/.test(r))).toBe(true);
  });

  it('isolates unratified-RC floor failure', () => {
    const s = buildClosureReadyState();
    s.elements.get('RCON-1').ratification = null;
    const out = evaluateTrigger(s);
    expect(out.reasons.some(r => /unratified RCs/.test(r))).toBe(true);
  });

  it('isolates collapse_test floor failure', () => {
    const s = buildClosureReadyState();
    s.elements.get('NCON-1').collapse_test = null;
    const out = evaluateTrigger(s);
    expect(out.reasons.some(r => /collapse_test/.test(r))).toBe(true);
  });

  it('isolates rejected_alternatives floor failure', () => {
    const s = buildClosureReadyState();
    for (const [, el] of s.elements) {
      if (el.type === 'NECESSARY_CONDITION') el.rejected_alternatives = [];
    }
    const out = evaluateTrigger(s);
    expect(out.reasons.some(r => /rejected_alternatives/.test(r))).toBe(true);
  });

  it('isolates concerns-locked floor failure', () => {
    const s = buildClosureReadyState();
    s.concernsLocked = false;
    const out = evaluateTrigger(s);
    expect(out.reasons.some(r => /Concerns must be locked/.test(r))).toBe(true);
  });

  it('isolates round-floor failure', () => {
    const s = buildClosureReadyState();
    s.round = 1;
    const out = evaluateTrigger(s);
    expect(out.reasons.some(r => /round/.test(r) && /floor/.test(r))).toBe(true);
  });

  // Aggregate-score boundary tests (AC-4.2) — use the overrides arg, not constant mutation.
  // Object.freeze on CLOSING_ARG_FLOORS prevents accidental in-place mutation that
  // would have leaked between tests; the override arg is the supported test seam.
  it('aggregate-score below override floor fails with aggregate_score reason', () => {
    const s = buildClosureReadyState();
    // Force the aggregate floor to 0.99 (above any realistic baseline) — guaranteed failure
    const out = evaluateTrigger(s, { aggregateScoreFloor: 0.99 });
    expect(out.permitted).toBe(false);
    expect(out.reasons.some(r => /aggregate_score/.test(r))).toBe(true);
  });

  it('aggregate-score at-or-above override floor passes', () => {
    const s = buildClosureReadyState();
    // Force the aggregate floor to 0 — guaranteed pass on the score arm
    const out = evaluateTrigger(s, { aggregateScoreFloor: 0 });
    expect(out.reasons.filter(r => /aggregate_score/.test(r)).length).toBe(0);
  });

  // Integrity-zero isolation test (AC-4.3)
  it('isolates integrity-zero failure (one warning blocks trigger)', () => {
    const s = buildClosureReadyState();
    // inject an ungrounded friction anchor to force one integrity warning
    s.elements.set('FRIC-99', {
      id: 'FRIC-99', type: 'FRICTION', status: 'active',
      friction_shape: 'nc-nc-opposing-pull',
      anchor_a: 'NCON-99-MISSING', anchor_b: 'NCON-1',
      disposition: 'lived-with',
    });
    const out = evaluateTrigger(s);
    expect(out.permitted).toBe(false);
    expect(out.reasons.some(r => /integrity_warnings/.test(r))).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- trigger-evaluator`
Expected: FAIL — `evaluateTrigger` not exported.

- [ ] **Step 3: Write minimal implementation**

In `metrics.js`, add (note `Object.freeze` — prevents in-place mutation that could leak between tests):
```javascript
export const CLOSING_ARG_FLOORS = Object.freeze({
  groundingCoverageFloor: 0.9,
  aggregateScoreFloor: 0.8,
  weights: Object.freeze({ ratifiedRC: 0.4, grounding: 0.4, alternatives: 0.2 }),
  minRound: 3,
});

// Test-only override: pass a partial floors object to evaluateTrigger via the second arg
// so tests can vary thresholds without mutating the frozen module-level constant.
// Production callers always omit the second arg and get the frozen defaults.
// (Implementation detail: evaluateTrigger uses `(floors ?? CLOSING_ARG_FLOORS)` everywhere
// it would have read CLOSING_ARG_FLOORS, with field-by-field fallback for partial overrides.)

export function evaluateTrigger(state, overrides) {
  const floors = {
    groundingCoverageFloor: overrides?.groundingCoverageFloor ?? CLOSING_ARG_FLOORS.groundingCoverageFloor,
    aggregateScoreFloor: overrides?.aggregateScoreFloor ?? CLOSING_ARG_FLOORS.aggregateScoreFloor,
    weights: overrides?.weights ?? CLOSING_ARG_FLOORS.weights,
    minRound: overrides?.minRound ?? CLOSING_ARG_FLOORS.minRound,
  };
  const reasons = [];
  const completeness = computeCompleteness(state.elements);
  const groundingCoverage = computeGroundingCoverage(state.elements);

  // Per-signal floors
  if (groundingCoverage < floors.groundingCoverageFloor) {
    reasons.push(`grounding_coverage ${groundingCoverage.toFixed(2)} below floor ${floors.groundingCoverageFloor}`);
  }
  if (completeness.resolve_condition_count < 1) {
    reasons.push('resolve_condition_count must be >= 1');
  }
  if (completeness.ratified_rc_count !== completeness.resolve_condition_count) {
    reasons.push(`unratified RCs exist: ${completeness.ratified_rc_count}/${completeness.resolve_condition_count} ratified`);
  }
  // Walk NCs: collapse_test populated on all; at least one rejected_alternatives
  let allHaveCollapse = true;
  let anyHasAlt = false;
  for (const [, el] of state.elements) {
    if (el.type !== 'NECESSARY_CONDITION' || el.status !== 'active') continue;
    if (!el.collapse_test) allHaveCollapse = false;
    if (Array.isArray(el.rejected_alternatives) && el.rejected_alternatives.length > 0) anyHasAlt = true;
  }
  if (!allHaveCollapse) reasons.push('not all active NCs have collapse_test');
  if (!anyHasAlt) reasons.push('no NC has rejected_alternatives');
  if (!state.concernsLocked) reasons.push('Concerns must be locked');
  const { uncovered } = checkConcernCoverage(state);
  if (uncovered.length > 0) reasons.push(`Concerns uncovered: ${uncovered.join(', ')}`);
  if (state.round < floors.minRound) reasons.push(`round ${state.round} below floor ${floors.minRound}`);

  // Aggregate
  const conditionsWithAlt = completeness.conditions_with_alternatives ?? 0;
  const conditionCount = Math.max(completeness.condition_count ?? 0, 1);
  const rcCount = Math.max(completeness.resolve_condition_count ?? 0, 1);
  const aggregate = (completeness.ratified_rc_count / rcCount) * floors.weights.ratifiedRC
    + groundingCoverage * floors.weights.grounding
    + (conditionsWithAlt / conditionCount) * floors.weights.alternatives;
  if (aggregate < floors.aggregateScoreFloor) {
    reasons.push(`aggregate_score ${aggregate.toFixed(2)} below floor ${floors.aggregateScoreFloor}`);
  }

  // Integrity-zero
  const integrityWarnings = checkAllIntegrity(state.elements);
  if (integrityWarnings.length > 0) {
    reasons.push(`integrity_warnings: ${integrityWarnings.length} (${integrityWarnings.slice(0, 3).join('; ')})`);
  }

  return { permitted: reasons.length === 0, reasons };
}
```
Add `import { checkAllIntegrity } from './proof.js';` at the top of `metrics.js` if not already present. Note: `checkConcernCoverage` is already defined in `metrics.js:218` (same file as `evaluateTrigger`) — no new import is needed for it. `computeCompleteness` and `computeGroundingCoverage` are also same-file references (defined earlier in `metrics.js`).

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add proof-mcp/metrics.js proof-mcp/__tests__/trigger-evaluator.test.js
git commit -m "feat: add composite trigger evaluator with three-arm gate"
```

---

## Task 9: Eleventh closure condition

**Type:** code-producing
**Implements:** AC-6.1, AC-6.2
**Decision budget:** 1
**Must remain green:** `eleventh-closure-condition.test.js`, `metrics.test.js`, `acceptance.test.js`

**Files:**
- Modify: `proof-mcp/metrics.js:355-358` (extend `checkClosure` return logic with eleventh condition)
- Test: `proof-mcp/__tests__/eleventh-closure-condition.test.js` (new)

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

```javascript
// proof-mcp/__tests__/eleventh-closure-condition.test.js
import { describe, it, expect } from 'vitest';
import { checkClosure } from '../metrics.js';
import { initializeState } from '../state.js';

function fullyCompliantState() {
  return {
    ...initializeState('p'),
    round: 5,
    closingArgPresentedRound: 5,
    closingArgGoRound: 5,
    concerns: [{ id: 'CERN-1', label: 'C', description: 'd' }],
    concernsLocked: true,
  };
}

describe('eleventh closure condition', () => {
  it('checkClosure adds reason when closingArgGoRound !== state.round', () => {
    const s = { ...fullyCompliantState(), closingArgGoRound: null };
    const out = checkClosure(s);
    expect(out.reasons.some(r => /Designer go-choice/.test(r))).toBe(true);
  });

  it('checkClosure clears the eleventh-condition reason when go round matches current round', () => {
    const s = { ...fullyCompliantState(), closingArgGoRound: 5 };
    const out = checkClosure(s);
    expect(out.reasons.some(r => /Designer go-choice/.test(r))).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- eleventh-closure-condition`
Expected: FAIL — eleventh condition not added.

- [ ] **Step 3: Write minimal implementation**

In `metrics.js` `checkClosure` (line 257), before the `return`, add:
```javascript
// 11. Designer go-choice required against a presented closing argument in current round
if (state.closingArgGoRound !== state.round) {
  reasons.push('Designer go-choice not given against a presented closing argument — call present_closing_argument then confirm_closure_go');
}
```

- [ ] **Step 3a: Backfill existing closure-eligible test setups with the eleventh-flag fields**

The existing `acceptance.test.js` (and any other test file with closure assertions) was written before the eleventh condition existed. Tests that assert `closure.permitted === true` will now fail because `closingArgGoRound !== state.round`. Walk every such test setup and add the two-line backfill before the closure assertion:

```javascript
state.closingArgPresentedRound = state.round;
state.closingArgGoRound = state.round;
```

Run: `cd /home/mike/Documents/CodeProjects/OrdinaryMoose/plugins/chester/skills/design-large-task/proof-mcp && npm test 2>&1 | grep -E "FAIL|expected.*permitted.*true"` to find every test that needs the backfill before doing the audit.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS — eleventh-condition tests green; all existing acceptance tests still green after the Step 3a backfill.

- [ ] **Step 5: Commit**

The `closure.permitted === true` assertions live in `concerns.test.js:42`, `metrics.test.js:341`, and `metrics.test.js:603` — NOT in `acceptance.test.js`. Stage whichever of those three actually needed the Step 3a backfill (verify with the grep before committing):

```bash
git add proof-mcp/metrics.js proof-mcp/__tests__/eleventh-closure-condition.test.js proof-mcp/__tests__/concerns.test.js proof-mcp/__tests__/metrics.test.js
git commit -m "feat: add eleventh closure condition (designer go-choice in current round)"
```

---

## Task 10: Closing-argument structured-object derivation

**Type:** code-producing
**Implements:** AC-3.1, AC-3.2, AC-3.3, AC-3.4
**Decision budget:** 3
**Must remain green:** `closing-argument.test.js`

**Files:**
- Create: `proof-mcp/closing-argument.js`
- Test: `proof-mcp/__tests__/closing-argument.test.js` (new)

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

```javascript
// proof-mcp/__tests__/closing-argument.test.js
import { describe, it, expect } from 'vitest';
import { deriveClosingArgument } from '../closing-argument.js';
import { initializeState, applyOperations, addConcern, lockConcerns, ratifyResolveCondition } from '../state.js';

function build() {
  let s = initializeState('design problem');
  let [, sa] = addConcern(s, { label: 'concern X', description: 'd' });
  s = sa;
  [s] = lockConcerns(s);
  let r = applyOperations(s, [
    { op: 'add', type: 'EVIDENCE', statement: 'evidence body', source: 'codebase' },
    { op: 'add', type: 'NECESSARY_CONDITION', statement: 'must Q', collapse_test: 'breaks if no Q', grounding: ['EVID-1'], reasoning_chain: 'IF evidence body THEN must Q' },
    { op: 'add', type: 'RESOLVE_CONDITION', statement: 'system Qs', problem_anchor: 'CERN-1', grounding: ['NCON-1'] },
  ]);
  s = r.state;
  [s] = ratifyResolveCondition(s, { elementId: 'RCON-1', ratificationText: 'ratified' });
  return s;
}

describe('deriveClosingArgument', () => {
  it('returns at minimum the required keys', () => {
    const s = build();
    const out = deriveClosingArgument(s);
    const required = ['derivedAtRound', 'problemStatement', 'lockedConcerns', 'resolveConditions', 'phantomNCs', 'phantomRCs', 'liveFriction', 'phantomFriction', 'compositeScore', 'closurePermitted', 'closureReasons'];
    for (const k of required) expect(out).toHaveProperty(k);
    expect(out.derivedAtRound).toBe(s.round);
  });

  it('walks live RCs with grounding NCs', () => {
    const s = build();
    const out = deriveClosingArgument(s);
    expect(out.resolveConditions.length).toBe(1);
    const rc = out.resolveConditions[0];
    expect(rc.id).toBe('RCON-1');
    expect(rc.problem_anchor).toBe('CERN-1');
    expect(rc.groundingNCs.some(nc => nc.id === 'NCON-1')).toBe(true);
  });

  it('is idempotent — same state produces deeply equal output', () => {
    const s = build();
    const a = deriveClosingArgument(s);
    const b = deriveClosingArgument(s);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('includes phantom NC with disposition tag', () => {
    let s = build();
    let r = applyOperations(s, [{ op: 'add', type: 'NECESSARY_CONDITION', statement: 'NC2', collapse_test: 'a', grounding: ['EVID-1'], reasoning_chain: 'IF evidence body THEN NC2' }]);
    s = r.state;
    r = applyOperations(s, [{ op: 'withdraw', target: 'NCON-2', withdrawal_disposition: 'superseded' }]);
    s = r.state;
    const out = deriveClosingArgument(s);
    expect(out.phantomNCs.some(p => p.id === 'NCON-2' && p.dispositionTag === 'superseded')).toBe(true);
  });

  it('surfaces unclassified disposition for phantoms with no withdrawal_disposition', () => {
    let s = build();
    let r = applyOperations(s, [{ op: 'add', type: 'NECESSARY_CONDITION', statement: 'NC3', collapse_test: 'a', grounding: ['EVID-1'], reasoning_chain: 'IF evidence body THEN NC3' }]);
    s = r.state;
    // simulate a legacy element by deleting withdrawal_disposition
    r = applyOperations(s, [{ op: 'withdraw', target: 'NCON-2' }]);
    s = r.state;
    delete s.elements.get('NCON-2').withdrawal_disposition;
    const out = deriveClosingArgument(s);
    expect(out.phantomNCs.some(p => p.id === 'NCON-2' && p.dispositionTag === 'unclassified')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- closing-argument`
Expected: FAIL — `closing-argument.js` does not exist.

- [ ] **Step 3: Write minimal implementation**

Create `proof-mcp/closing-argument.js`:
```javascript
import { computeCompleteness, computeGroundingCoverage, checkClosure } from './metrics.js';

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
    .map(el => ({ id: el.id, statement: el.statement, dispositionTag: el.withdrawal_disposition ?? 'unclassified' }));

  const phantomRCs = elementsArr
    .filter(el => el.type === 'RESOLVE_CONDITION' && el.status === 'withdrawn')
    .map(el => ({ id: el.id, statement: el.statement, dispositionTag: el.withdrawal_disposition ?? 'unclassified' }));

  const liveFriction = elementsArr
    .filter(el => el.type === 'FRICTION' && el.status === 'active')
    .map(el => ({
      id: el.id, friction_shape: el.friction_shape, anchor_a: el.anchor_a, anchor_b: el.anchor_b,
      disposition: el.disposition, statement: el.statement,
    }));

  const phantomFriction = elementsArr
    .filter(el => el.type === 'FRICTION' && el.status === 'withdrawn')
    .map(el => ({
      id: el.id, friction_shape: el.friction_shape, anchor_a: el.anchor_a, anchor_b: el.anchor_b,
      dispositionTag: el.disposition ?? 'unclassified', statement: el.statement,
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add proof-mcp/closing-argument.js proof-mcp/__tests__/closing-argument.test.js
git commit -m "feat: add deriveClosingArgument structured-object derivation"
```

---

## Task 11: present_closing_argument MCP tool

**Type:** code-producing
**Implements:** AC-5.1
**Decision budget:** 1
**Must remain green:** `server.test.js`, `closing-argument.test.js`, `trigger-evaluator.test.js`

**Files:**
- Modify: `proof-mcp/server.js` (add `present_closing_argument` tool definition + handler; import `evaluateTrigger`, `recordClosingArgPresented`, `deriveClosingArgument`)

**Steps (TDD):**

- [ ] **Step 1: Write the failing test** — Append to `__tests__/server.test.js` (follow existing precedent — server tests grep server.js source for tool registration; behavioral coverage lives in state.js / metrics.js / closing-argument.js unit tests already):

```javascript
describe('server.js — present_closing_argument tool', () => {
  it('declares present_closing_argument tool', () => {
    expect(serverSource).toMatch(/name:\s*'present_closing_argument'/);
  });

  it('dispatches present_closing_argument in switch', () => {
    expect(serverSource).toMatch(/case\s+'present_closing_argument'/);
  });

  it('handler imports evaluateTrigger and deriveClosingArgument', () => {
    expect(serverSource).toMatch(/from\s+['"]\.\/closing-argument\.js['"]/);
    expect(serverSource).toMatch(/evaluateTrigger/);
  });
});
```

Behavioral happy-path coverage (trigger-fail → no mutation; trigger-pass → structured object returned and `closingArgPresentedRound` set) is exercised by the end-to-end test in Task 14.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- present_closing_argument`
Expected: FAIL — handler not registered.

- [ ] **Step 3: Write minimal implementation**

In `server.js`, import:
```javascript
import { evaluateTrigger } from './metrics.js';
import { recordClosingArgPresented } from './state.js';
import { deriveClosingArgument } from './closing-argument.js';
```

Add tool definition (mirror existing tool shape):
```javascript
{
  name: 'present_closing_argument',
  description: 'Present the closing argument as a structured object. Refuses if composite trigger gate not cleared.',
  inputSchema: { type: 'object', properties: {}, required: [] },
}
```

Add handler:
```javascript
case 'present_closing_argument': {
  let state = loadState(state_file);
  const trigger = evaluateTrigger(state);
  if (!trigger.permitted) {
    return { content: [{ type: 'text', text: JSON.stringify({ permitted: false, reasons: trigger.reasons }, null, 2) }] };
  }
  const argument = deriveClosingArgument(state);
  state = recordClosingArgPresented(state);
  saveState(state, state_file);
  return { content: [{ type: 'text', text: JSON.stringify(argument, null, 2) }] };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add proof-mcp/server.js proof-mcp/__tests__/closing-argument.test.js
git commit -m "feat: add present_closing_argument MCP tool"
```

---

## Task 12: confirm_closure_go MCP tool

**Type:** code-producing
**Implements:** AC-5.3, AC-5.4
**Decision budget:** 1
**Must remain green:** `server.test.js`, `eleventh-closure-condition.test.js`

**Files:**
- Modify: `proof-mcp/server.js` (add `confirm_closure_go` tool definition + handler)

**Steps (TDD):**

- [ ] **Step 1: Write the failing test** — Append to `__tests__/server.test.js`:

```javascript
describe('server.js — confirm_closure_go tool', () => {
  it('declares confirm_closure_go tool', () => {
    expect(serverSource).toMatch(/name:\s*'confirm_closure_go'/);
  });

  it('dispatches confirm_closure_go in switch', () => {
    expect(serverSource).toMatch(/case\s+'confirm_closure_go'/);
  });

  it('handler imports recordDesignerGo and checkClosure', () => {
    expect(serverSource).toMatch(/recordDesignerGo/);
    expect(serverSource).toMatch(/checkClosure/);
  });
});
```

Behavioral coverage (same-round → eleventh closure condition passes; mismatched round → rejection with `/presented in round/` reason) lives in `two-yes-flags.test.js` (`recordDesignerGo` unit) and the end-to-end test in Task 14.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- confirm_closure_go`
Expected: FAIL — handler not registered.

- [ ] **Step 3: Write minimal implementation**

In `server.js`:
```javascript
import { recordDesignerGo } from './state.js';
import { checkClosure } from './metrics.js';

case 'confirm_closure_go': {
  let state = loadState(state_file);
  const [newState, err] = recordDesignerGo(state);
  if (err) {
    return { content: [{ type: 'text', text: JSON.stringify({ permitted: false, reason: err }, null, 2) }] };
  }
  saveState(newState, state_file);
  const closure = checkClosure(newState);
  return { content: [{ type: 'text', text: JSON.stringify(closure, null, 2) }] };
}
```

Tool definition: `{ name: 'confirm_closure_go', description: 'Designer go-choice against the presented closing argument; same-round required.', inputSchema: { type: 'object', properties: {}, required: [] } }`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add proof-mcp/server.js proof-mcp/__tests__/server.test.js
git commit -m "feat: add confirm_closure_go MCP tool"
```

---

## Task 13: override_friction_disposition MCP tool

**Type:** code-producing
**Implements:** AC-2.4
**Decision budget:** 1
**Must remain green:** `server.test.js`, `friction-lifecycle.test.js`

**Files:**
- Modify: `proof-mcp/server.js` (add `override_friction_disposition` tool definition + handler)

**Steps (TDD):**

- [ ] **Step 1: Write the failing test** — Append to `__tests__/server.test.js`:

```javascript
describe('server.js — override_friction_disposition tool', () => {
  it('declares override_friction_disposition tool', () => {
    expect(serverSource).toMatch(/name:\s*'override_friction_disposition'/);
  });

  it('dispatches override_friction_disposition in switch', () => {
    expect(serverSource).toMatch(/case\s+'override_friction_disposition'/);
  });

  it('declares element_id and disposition as required inputs', () => {
    const block = serverSource.split("name: 'override_friction_disposition'")[1] ?? '';
    expect(block).toMatch(/element_id/);
    expect(block).toMatch(/disposition/);
  });

  it('handler imports overrideFrictionDisposition', () => {
    expect(serverSource).toMatch(/overrideFrictionDisposition/);
  });
});
```

Behavioral coverage (valid override → disposition updated; non-FRICTION → rejection; invalid disposition → rejection; dismiss-disposition → withdrawn-status transition) is exercised by `friction-lifecycle.test.js` against the `overrideFrictionDisposition` state.js export directly (Task 2).

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- override_friction_disposition`
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

In `server.js`:
```javascript
import { overrideFrictionDisposition } from './state.js';

case 'override_friction_disposition': {
  let state = loadState(state_file);
  const [newState, err] = overrideFrictionDisposition(state, { elementId: args.element_id, disposition: args.disposition });
  if (err) {
    return { content: [{ type: 'text', text: JSON.stringify({ error: err }, null, 2) }] };
  }
  saveState(newState, state_file);
  return { content: [{ type: 'text', text: JSON.stringify({ updated: newState.elements.get(args.element_id) }, null, 2) }] };
}
```

Tool definition includes `element_id` (string, required) and `disposition` (enum, required) in inputSchema.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add proof-mcp/server.js proof-mcp/__tests__/server.test.js
git commit -m "feat: add override_friction_disposition MCP tool"
```

---

## Task 14: End-to-end integration tests

**Type:** code-producing
**Implements:** AC-3.1, AC-3.2, AC-5.5, AC-6.1, AC-6.2 (integration-level composition; per spec Testing Strategy "Integration test files")
**Decision budget:** 1
**Must remain green:** `closing-argument-end-to-end.test.js`, full test suite

**Files:**
- Test: `proof-mcp/__tests__/closing-argument-end-to-end.test.js` (new)
- Test: extension to `proof-mcp/__tests__/friction-lifecycle.test.js`

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

```javascript
// proof-mcp/__tests__/closing-argument-end-to-end.test.js
import { describe, it, expect } from 'vitest';
import { initializeState, applyOperations, addConcern, lockConcerns, ratifyResolveCondition, recordClosingArgPresented, recordDesignerGo } from '../state.js';
import { evaluateTrigger, checkClosure } from '../metrics.js';
import { deriveClosingArgument } from '../closing-argument.js';

describe('closing-argument end-to-end', () => {
  it('happy path: build proof, present argument, confirm go, closure permitted', () => {
    let s = initializeState('p');
    let [, sa] = addConcern(s, { label: 'concern X', description: 'd' });
    s = sa;
    [s] = lockConcerns(s);
    let r = applyOperations(s, [
      { op: 'add', type: 'EVIDENCE', statement: 'fact', source: 'codebase' },
      { op: 'add', type: 'NECESSARY_CONDITION', statement: 'must Q', collapse_test: 'breaks if no Q', grounding: ['EVID-1'], reasoning_chain: 'IF fact THEN must Q', rejected_alternatives: ['alt1'] },
      { op: 'add', type: 'RESOLVE_CONDITION', statement: 'system Qs', problem_anchor: 'CERN-1', grounding: ['NCON-1'] },
    ]);
    s = r.state;
    r = applyOperations(s, [{ op: 'revise', target: 'NCON-1', collapse_test: 'breaks if no Q at all' }]);
    s = r.state;
    [s] = ratifyResolveCondition(s, { elementId: 'RCON-1', ratificationText: 'ratified' });
    while (s.round < 3) { r = applyOperations(s, []); s = r.state; }

    const trigger = evaluateTrigger(s);
    expect(trigger.permitted).toBe(true);

    const argument = deriveClosingArgument(s);
    expect(argument.resolveConditions.length).toBeGreaterThan(0);

    s = recordClosingArgPresented(s);
    expect(s.closingArgPresentedRound).toBe(s.round);

    [s] = recordDesignerGo(s);
    expect(s.closingArgGoRound).toBe(s.round);

    const closure = checkClosure(s);
    expect(closure.permitted).toBe(true);
  });

  it('mutation after go invalidates closure', () => {
    let s = initializeState('p');
    s.round = 5;
    s.closingArgPresentedRound = 5;
    s.closingArgGoRound = 5;
    s.concerns = [{ id: 'CERN-1', label: 'C' }];
    s.concernsLocked = true;
    const r = applyOperations(s, [{ op: 'add', type: 'EVIDENCE', statement: 'mid-ratification mutation' }]);
    expect(r.state.closingArgPresentedRound).toBeNull();
    expect(r.state.closingArgGoRound).toBeNull();
    const closure = checkClosure(r.state);
    expect(closure.permitted).toBe(false);
    expect(closure.reasons.some(rs => /Designer go-choice/.test(rs))).toBe(true);
  });
});
```

Add to `__tests__/friction-lifecycle.test.js`:
```javascript
it('full lifecycle: auto-create from detection, override disposition, dismiss to phantom, surface in closing argument', () => {
  let state = initializeState('p');
  let r = applyOperations(state, [
    { op: 'add', type: 'RULE', statement: 'must not Z', source: 'designer' },
    { op: 'add', type: 'PERMISSION', statement: 'allow Z', source: 'designer', relieves: 'RULE-1' },
    { op: 'add', type: 'RISK', statement: 'Z dangerous', basis: ['RULE-1'] },
  ]);
  state = r.state;
  const auto = [...state.elements.values()].find(el => el.type === 'FRICTION');
  expect(auto).toBeDefined();
  const [s2] = overrideFrictionDisposition(state, { elementId: auto.id, disposition: 'not-really-friction' });
  expect(s2.elements.get(auto.id).status).toBe('withdrawn');
  const argument = deriveClosingArgument(s2);
  expect(argument.phantomFriction.some(f => f.id === auto.id)).toBe(true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- closing-argument-end-to-end friction-lifecycle`
Expected: tests pass if all prior tasks complete; if any prior task missed, this surfaces it.

- [ ] **Step 3: Adjust prior tasks if integration test surfaces gaps**

If integration tests fail, the failure points back to a prior task — fix at the source, not in the integration test. The integration test is the final ratification, not a fix-up shim.

- [ ] **Step 4: Run full suite to verify all green**

Run: `cd /home/mike/Documents/CodeProjects/OrdinaryMoose/plugins/chester/skills/design-large-task/proof-mcp && npm test`
Expected: PASS — every test file green; no skipped tests.

- [ ] **Step 5: Commit**

```bash
git add proof-mcp/__tests__/closing-argument-end-to-end.test.js proof-mcp/__tests__/friction-lifecycle.test.js
git commit -m "test: end-to-end coverage for closing-argument and friction lifecycle"
```

---

<!-- created-at: 2026-05-03T09:15:26Z -->
<!-- produced-by plan-build@v0004 -->
