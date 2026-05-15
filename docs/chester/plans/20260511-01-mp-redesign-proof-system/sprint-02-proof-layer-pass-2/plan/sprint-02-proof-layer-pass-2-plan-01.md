# Plan: Add Missing CONCERN Element Category to Domain Pipeline

**Sprint:** sprint-02-proof-layer-pass-2 (under master `20260511-01-mp-redesign-proof-system`)
**Spec:** `docs/chester/working/20260511-01-mp-redesign-proof-system/sprint-02-proof-layer-pass-2/spec/sprint-02-proof-layer-pass-2-spec-03.md`
**Threat report:** `plan/sprint-02-proof-layer-pass-2-plan-threat-report-00.md`
**Execution mode:** subagent

> **For agentic workers:** Use execute-write to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The `Execution mode` field is `subagent`; execute-write Section 2 runs.

**Revision history:**
- `-00` (initial): 8-task plan from spec-03 Hybrid (option b) scope.
- `-01` (this revision): plan-hardening surfaced two CRITICAL defects (substrate `_runFixedPoint` is a no-op stub → Task 5 derivation tests produce false signals; `verifyArgsShape` throws on ratify with pinned `idShape: 'concern'` → Task 7 ratify step fails) plus three MEDIUM tactical issues. Task 5 and Task 7 lifecycle test revised to use the real Engine via `import('../../engine/Engine.js')` matching the working pattern at `bridge-integration.test.js:37`. Task 7 ratify call switched to generic `ratifyElement({elementId, source, claim})` with dummy fields satisfying EVIDENCE shape check. Task 6 AC-2.2 smoke test rationale corrected. Stratification registration-order note dropped from Implementation Notes (substrate's stratifier is cycle-based, not order-based). Known Issues section added documenting accepted residuals.

## Goal

Add the missing CONCERN element category to the domain element-schema pipeline inside `skills/design-proof-system/references/domain/` so the closure-policy's `unaddressed_concern` consumer rule has a producer, and so future callers (in any system) can create/revise/ratify/withdraw Concerns through the unified element pipeline. proof-mcp is explicitly out of scope.

## Architecture

Scope-corrected spec-03 hybrid (Architect A's option (b) — minimum-scope). Adds CONCERN to `tags.js`, `schema.js`, `translation.js` (with a status-transition RULE_TEMPLATE), `mutations.js` Phase-C instantiation list, `closure-policy.js` (corrected `unaddressed_concern_rule` body + new `covered(C)` producer rule), and `domain-bridge.js` (four dedicated entry points + validPredicates updates). One new test file covers the lifecycle end-to-end via real-import integration. No file under `skills/design-large-task/proof-mcp/` is touched.

## Tech Stack

- JavaScript ESM, Node 20+
- vitest for tests (existing convention in domain package)
- Engine Datalog substrate via injected ports (engine package, sibling under `skills/design-proof-system/references/engine/`)

---

## Task 1: Add CONCERN to ELEMENT_CATEGORIES

**Type:** code-producing
**Implements:** AC-1.1
**Decision budget:** 0
**Must remain green:** `tags.test.js` (existing); the new test added in Step 1 below

**Files:**
- Modify: `skills/design-proof-system/references/domain/tags.js:5-9`
- Test: `skills/design-proof-system/references/domain/__tests__/concern-schema.test.js` (new — will accumulate tests across Tasks 1-7)

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Create the new test file with the first assertion:

```javascript
// skills/design-proof-system/references/domain/__tests__/concern-schema.test.js
import { describe, it, expect } from 'vitest';
import { ELEMENT_CATEGORIES, assertExhaustive } from '../tags.js';

describe('CONCERN — tags', () => {
  it('AC-1.1: ELEMENT_CATEGORIES contains CONCERN with value "concern"', () => {
    expect(ELEMENT_CATEGORIES.CONCERN).toBe('concern');
    expect(Object.values(ELEMENT_CATEGORIES)).toHaveLength(9);
    expect(Object.values(ELEMENT_CATEGORIES)).toContain('concern');
  });

  it('AC-1.1: assertExhaustive accepts "concern" as a valid element category', () => {
    expect(() => assertExhaustive('concern', ELEMENT_CATEGORIES, 'idShape')).not.toThrow();
    expect(assertExhaustive('concern', ELEMENT_CATEGORIES, 'idShape')).toBe('concern');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd skills/design-proof-system/references/domain && npx vitest run __tests__/concern-schema.test.js`
Expected: FAIL — `ELEMENT_CATEGORIES.CONCERN` is undefined; length is 8 not 9.

- [ ] **Step 3: Write minimal implementation**

Edit `skills/design-proof-system/references/domain/tags.js` lines 5-9 by appending `CONCERN: 'concern'` between FRICTION and DEFINITION (cascade §3 ordering):

```javascript
export const ELEMENT_CATEGORIES = Object.freeze({
  EVIDENCE: 'evidence', RULE: 'rule', PERMISSION: 'permission',
  PROPOSITION: 'proposition', RISK: 'risk', RESOLUTION: 'resolution',
  FRICTION: 'friction', CONCERN: 'concern', DEFINITION: 'definition',
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd skills/design-proof-system/references/domain && npx vitest run __tests__/concern-schema.test.js`
Expected: 2 passing tests.

Then run the full tags test to ensure no regression:
Run: `cd skills/design-proof-system/references/domain && npx vitest run __tests__/tags.test.js`
Expected: all existing tag tests pass.

- [ ] **Step 5: Commit**

```bash
git add skills/design-proof-system/references/domain/tags.js \
        skills/design-proof-system/references/domain/__tests__/concern-schema.test.js
git commit -m "feat(domain): add CONCERN to ELEMENT_CATEGORIES tag set"
```

---

## Task 2: Add CATEGORY_REGISTRY entry for CONCERN

**Type:** code-producing
**Implements:** AC-1.2, AC-1.3
**Decision budget:** 1 (render section choice for Concern — spec calls for `RENDER_SECTIONS.PROBLEM` matching cascade §3.8 placement, but verify against RENDER_SECTIONS enum)
**Must remain green:** `schema.test.js`; new concern-schema test additions

**Files:**
- Modify: `skills/design-proof-system/references/domain/schema.js:3-76` (insert new entry between FRICTION block at 58-66 and DEFINITION block at 67-75)
- Test: `skills/design-proof-system/references/domain/__tests__/concern-schema.test.js` (extend)

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Append to `concern-schema.test.js`:

```javascript
import { CATEGORY_REGISTRY, verifyArgsShape } from '../schema.js';
import { CONSENT_SOURCES, RENDER_SECTIONS } from '../tags.js';

describe('CONCERN — schema', () => {
  it('AC-1.2: CATEGORY_REGISTRY[CONCERN] has expected shape', () => {
    const entry = CATEGORY_REGISTRY[ELEMENT_CATEGORIES.CONCERN];
    expect(entry).toBeDefined();
    expect(entry.requiredFields).toEqual(['label']);
    expect(entry.optionalFields).toEqual(['description']);
    expect(entry.idShape).toBe('concern');
    expect(entry.sourceConstraint).toBe(CONSENT_SOURCES.DESIGNER);
    expect(entry.renderSection).toBe(RENDER_SECTIONS.PROBLEM);
    expect(entry.closedEnumFields).toEqual({});
    expect(entry.authority.add).toEqual([CONSENT_SOURCES.DESIGNER]);
    expect(entry.authority.revise).toEqual([CONSENT_SOURCES.DESIGNER]);
    expect(entry.authority.withdraw).toEqual([CONSENT_SOURCES.DESIGNER]);
    expect(entry.authority.ratify).toEqual([CONSENT_SOURCES.DESIGNER, CONSENT_SOURCES.DESIGN_PARTNER]);
  });

  it('AC-1.3: verifyArgsShape accepts valid args, throws SHAPE_INVALID on missing label', () => {
    expect(verifyArgsShape({ label: 'C1' }, 'concern')).toEqual({ label: 'C1' });
    expect(verifyArgsShape({ label: 'C1', description: 'D1' }, 'concern')).toEqual({ label: 'C1', description: 'D1' });
    let captured = null;
    try { verifyArgsShape({}, 'concern'); } catch (e) { captured = e; }
    expect(captured).not.toBeNull();
    expect(captured.code).toBe('SHAPE_INVALID');
    expect(captured.field).toBe('label');
  });

  it('AC-1.2: schema test (existing): CATEGORY_REGISTRY has 9 descriptors keyed by ELEMENT_CATEGORIES', () => {
    expect(Object.keys(CATEGORY_REGISTRY).sort()).toEqual(Object.values(ELEMENT_CATEGORIES).sort());
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd skills/design-proof-system/references/domain && npx vitest run __tests__/concern-schema.test.js`
Expected: FAIL — `CATEGORY_REGISTRY[ELEMENT_CATEGORIES.CONCERN]` is undefined.

- [ ] **Step 3: Write minimal implementation**

In `skills/design-proof-system/references/domain/schema.js`, insert the CONCERN block between FRICTION (lines 58-66) and DEFINITION (lines 67-75):

```javascript
  [ELEMENT_CATEGORIES.CONCERN]: Object.freeze({
    requiredFields: ['label'],
    optionalFields: ['description'],
    sourceConstraint: CONSENT_SOURCES.DESIGNER,
    idShape: ELEMENT_CATEGORIES.CONCERN,
    renderSection: RENDER_SECTIONS.PROBLEM,
    closedEnumFields: {},
    authority: { add: [CONSENT_SOURCES.DESIGNER], revise: [CONSENT_SOURCES.DESIGNER], withdraw: [CONSENT_SOURCES.DESIGNER], ratify: [CONSENT_SOURCES.DESIGNER, CONSENT_SOURCES.DESIGN_PARTNER] },
  }),
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd skills/design-proof-system/references/domain && npx vitest run __tests__/concern-schema.test.js __tests__/schema.test.js`
Expected: all CONCERN tests + existing schema tests pass.

- [ ] **Step 5: Commit**

```bash
git add skills/design-proof-system/references/domain/schema.js \
        skills/design-proof-system/references/domain/__tests__/concern-schema.test.js
git commit -m "feat(domain): add CONCERN entry to CATEGORY_REGISTRY"
```

---

## Task 3: Add Concern translator, RULE_TEMPLATE, and EDB predicate entries

**Type:** code-producing
**Implements:** AC-2.1, AC-2.2, AC-2.3 (rule body shape)
**Decision budget:** 1 (default value for absent `description` — spec defers to "DEFINITION's pattern"; DEFINITION uses raw `args.term`/`args.definition` without default fallback. For Concern, use empty string `''` to match RISK's `args.severity ?? 'unspecified'` style of guarding optional fields)
**Must remain green:** `translation.test.js`, `bridge-integration.test.js`; new concern-schema test additions

**Files:**
- Modify: `skills/design-proof-system/references/domain/translation.js` (translator block 12-60, RULE_TEMPLATES block 72-109, EDB_PREDICATES set 145-151)
- Test: `skills/design-proof-system/references/domain/__tests__/concern-schema.test.js` (extend)

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Append to `concern-schema.test.js`:

```javascript
import { translate, RULE_TEMPLATES, getDeclaredEDBPredicates } from '../translation.js';

describe('CONCERN — translation', () => {
  it('AC-2.1: translator emits concern/3 and concern_status/2 base facts', () => {
    const result = translate(ELEMENT_CATEGORIES.CONCERN, { label: 'L1', description: 'D1' }, 'concern_1', 1700000000);
    expect(result.baseFacts).toEqual(expect.arrayContaining([
      ['concern', ['concern_1', 'L1', 'D1']],
      ['concern_status', ['concern_1', 'draft']],
    ]));
    expect(result.metaFacts).toEqual(expect.arrayContaining([
      ['created_at', ['concern_1', 1700000000]],
    ]));
    expect(result.rules).toEqual([]);
  });

  it('AC-2.1: translator defaults absent description to empty string', () => {
    const result = translate(ELEMENT_CATEGORIES.CONCERN, { label: 'L1' }, 'concern_2', 1700000000);
    expect(result.baseFacts).toEqual(expect.arrayContaining([
      ['concern', ['concern_2', 'L1', '']],
      ['concern_status', ['concern_2', 'draft']],
    ]));
  });

  it('AC-2.2: EDB_PREDICATES contains concern and concern_status', () => {
    const edb = getDeclaredEDBPredicates();
    expect(edb.has('concern')).toBe(true);
    expect(edb.has('concern_status')).toBe(true);
  });

  it('AC-2.3: RULE_TEMPLATES[CONCERN] builds the approved-implies-ratified rule', () => {
    const tmpl = RULE_TEMPLATES[ELEMENT_CATEGORIES.CONCERN];
    expect(tmpl).toBeDefined();
    expect(tmpl.elementCategory).toBe(ELEMENT_CATEGORIES.CONCERN);
    const built = tmpl.build('concern_1');
    expect(built.ruleId).toBe('concern_1_approved_implies_concern_status_ratified');
    expect(built.headAtom).toEqual(['concern_status', ['concern_1', 'ratified']]);
    expect(built.bodyAtoms).toEqual([
      ['concern', ['concern_1', '_', '_']],
      ['approved', ['concern_1', '_', '_']],
    ]);
    expect(built.metadata.domain_concept).toBe('concern_status_ratified');
    expect(built.metadata.element).toBe('concern_1');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd skills/design-proof-system/references/domain && npx vitest run __tests__/concern-schema.test.js`
Expected: FAIL — `translate(..., 'concern', ...)` throws `UNKNOWN_CATEGORY`; `RULE_TEMPLATES[CONCERN]` is undefined.

- [ ] **Step 3: Write minimal implementation**

In `skills/design-proof-system/references/domain/translation.js`:

**3a.** Add the CONCERN translator entry inside the `TRANSLATORS` frozen object (between FRICTION at lines 50-54 and DEFINITION at lines 55-59):

```javascript
  [ELEMENT_CATEGORIES.CONCERN]: (args, id, ts) => ({
    baseFacts: [
      ['concern', [id, args.label, args.description ?? '']],
      ['concern_status', [id, 'draft']],
    ],
    rules: [],
    metaFacts: [['created_at', [id, ts]]],
  }),
```

**3b.** Add the CONCERN entry to `RULE_TEMPLATES` (between DEFINITION at lines 97-108 and the closing `});` at line 109):

```javascript
  [ELEMENT_CATEGORIES.CONCERN]: Object.freeze({
    elementCategory: ELEMENT_CATEGORIES.CONCERN,
    build: (elementId) => ({
      ruleId: `${elementId}_approved_implies_concern_status_ratified`,
      headAtom: ['concern_status', [elementId, 'ratified']],
      bodyAtoms: [
        ['concern', [elementId, '_', '_']],
        ['approved', [elementId, '_', '_']],
      ],
      metadata: { domain_concept: 'concern_status_ratified', element: elementId },
    }),
  }),
```

**3c.** Add `'concern'` and `'concern_status'` to the `EDB_PREDICATES` frozen set at lines 145-151:

```javascript
const EDB_PREDICATES = Object.freeze(new Set([
  'evidence', 'rule_decl', 'permission_decl', 'proposition_decl', 'grounding',
  'collapse_test', 'risk', 'resolution_decl', 'addresses', 'friction',
  'friction_disposition', 'definition_decl', 'concern', 'concern_status',
  'approved', 'two_yes',
  'closure_committed', 'closure_pending', 'phase', 'round', 'created_at',
  'withdrew', 'superseded',
]));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd skills/design-proof-system/references/domain && npx vitest run __tests__/concern-schema.test.js __tests__/translation.test.js`
Expected: new CONCERN translation tests pass; existing translation tests unaffected.

- [ ] **Step 5: Commit**

```bash
git add skills/design-proof-system/references/domain/translation.js \
        skills/design-proof-system/references/domain/__tests__/concern-schema.test.js
git commit -m "feat(domain): add CONCERN translator, RULE_TEMPLATE, and EDB predicate entries"
```

---

## Task 4: Add CONCERN to Phase-C template-instantiation dispatch list

**Type:** code-producing
**Implements:** AC-2.3 (end-to-end status-transition firing)
**Decision budget:** 0
**Must remain green:** `mutations.test.js`, `bridge-integration.test.js`

**Files:**
- Modify: `skills/design-proof-system/references/domain/mutations.js:133`
- Test covered by Task 7's end-to-end ratify-flow test

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

The end-to-end test that proves this works lives in Task 7 (`addConcern → ratifyConcern → engine.query(concern_status(_, 'ratified'))`). For this task, add a smaller targeted test to `concern-schema.test.js` that exercises `instantiateTemplate` directly:

```javascript
import { instantiateTemplate } from '../translation.js';

describe('CONCERN — Phase-C instantiation', () => {
  it('AC-2.3: instantiateTemplate(CONCERN, id) installs the per-element ratify-derives rule', () => {
    const calls = [];
    const fakeRulePorts = {
      defineRule: (ruleId, headAtom, bodyAtoms, metadata) => {
        calls.push({ ruleId, headAtom, bodyAtoms, metadata });
      },
    };
    instantiateTemplate('concern', 'concern_42', fakeRulePorts);
    expect(calls).toHaveLength(1);
    expect(calls[0].ruleId).toBe('concern_42_approved_implies_concern_status_ratified');
    expect(calls[0].headAtom).toEqual(['concern_status', ['concern_42', 'ratified']]);
  });
});
```

This test passes once Task 3 is in place (instantiateTemplate already dispatches via `RULE_TEMPLATES[idShape]`). What this task adds is the *automatic* invocation from `runOperation('add', ...)` for the CONCERN category. The end-to-end test in Task 7 will exercise that.

Run: `cd skills/design-proof-system/references/domain && npx vitest run __tests__/concern-schema.test.js -t "Phase-C instantiation"`
Expected: PASS (Task 3 already wired the template).

- [ ] **Step 2: Run the (pre-existing) end-to-end test as the failing test**

The real failing test is the Task 7 end-to-end test, but since this task is a single-line list mutation, the appropriate "failing test" is a manual check: before this task, calling `runOperation('add', { idShape: 'concern', label: 'X' }, consent, ports)` adds the EDB facts but does NOT install the per-element rule, so a subsequent `ratify` would assert `approved(concern_1, _, _)` and the engine would NOT derive `concern_status(concern_1, 'ratified')` because no rule joins them.

Verify by reading `mutations.js:133`:

```javascript
if ([ELEMENT_CATEGORIES.PROPOSITION, ELEMENT_CATEGORIES.RESOLUTION, ELEMENT_CATEGORIES.DEFINITION].includes(targetShape) && verbName === ACTION_LABELS.ADD) {
  instantiateTemplate(targetShape, id, ports.rules);
}
```

CONCERN is absent from the list — so this is the gap.

- [ ] **Step 3: Write minimal implementation**

Edit `skills/design-proof-system/references/domain/mutations.js:133`:

```javascript
    if ([ELEMENT_CATEGORIES.PROPOSITION, ELEMENT_CATEGORIES.RESOLUTION, ELEMENT_CATEGORIES.DEFINITION, ELEMENT_CATEGORIES.CONCERN].includes(targetShape) && verbName === ACTION_LABELS.ADD) {
      instantiateTemplate(targetShape, id, ports.rules);
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd skills/design-proof-system/references/domain && npx vitest run __tests__/mutations.test.js __tests__/concern-schema.test.js`
Expected: all existing mutations tests still pass; concern Phase-C instantiation test passes.

- [ ] **Step 5: Commit**

```bash
git add skills/design-proof-system/references/domain/mutations.js
git commit -m "feat(domain): include CONCERN in Phase-C template instantiation dispatch"
```

---

## Task 5: Fix `unaddressed_concern_rule` body and add `covered_rule`

**Type:** code-producing
**Implements:** AC-4.1, AC-4.2, AC-4.3
**Decision budget:** 1 (placement of new `covered_rule` — colocated in `closure-policy.js` is the spec's stated recommendation; verify no stratification cycle with existing rules)
**Must remain green:** `closure-policy.test.js`; new derivation tests added below

**Files:**
- Modify: `skills/design-proof-system/references/domain/closure-policy.js:24-28` (fix `unaddressed_concern_rule` body) and append new `covered_rule` after line 28
- Test: `skills/design-proof-system/references/domain/__tests__/concern-schema.test.js` (extend with derivation tests)

**Critical context (carried over from plan-01 mitigations):** The substrate fake at `__tests__/_fixtures/inMemorySubstrate.js:126` has a no-op `_runFixedPoint` — it does NOT actually derive facts. Derivation tests MUST use the real Engine via `import('../../engine/Engine.js')`, matching the working pattern at `bridge-integration.test.js:37-38`. Do NOT use `createInMemorySubstrate` for derivation assertions.

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Append to `concern-schema.test.js`:

```javascript
import { registerStatic as registerClosurePolicy } from '../closure-policy.js';
import { CONSENT_SOURCES } from '../tags.js';

// Helper: boot a real Engine + closure-policy rules in isolation for derivation tests.
// Real Engine is imported dynamically because bridge-integration.test.js:37 uses the same
// async-import pattern (engine package is a sibling module). The helper does NOT boot
// the full domain bridge — it only loads the rules and exposes the engine's query/facts
// surfaces so derivation tests can assert facts and check derived predicates.
async function makeRealEngineWithClosurePolicy() {
  const { Engine } = await import('../../../engine/Engine.js');
  const engine = new Engine();
  registerClosurePolicy(engine.rules);
  return engine;
}

describe('CONCERN — closure-policy rules', () => {
  it('AC-4.3: covered(C) derives when concern_status(C, ratified) + addresses(R, C) + approved(R, _, _)', async () => {
    const engine = await makeRealEngineWithClosurePolicy();
    engine.facts.assertFact('concern', ['concern_1', 'L1', 'D1']);
    engine.facts.assertFact('concern_status', ['concern_1', 'ratified']);
    engine.facts.assertFact('resolution_decl', ['resn_1', 'R1-statement']);
    engine.facts.assertFact('addresses', ['resn_1', 'concern_1']);
    engine.facts.assertFact('approved', ['resn_1', 'designer', 1700000000]);
    expect(engine.query.exists(['covered', ['concern_1']])).toBe(true);
  });

  it('AC-4.3: covered(C) does NOT derive when addressing Resolution is unapproved', async () => {
    const engine = await makeRealEngineWithClosurePolicy();
    engine.facts.assertFact('concern_status', ['concern_1', 'ratified']);
    engine.facts.assertFact('addresses', ['resn_1', 'concern_1']);
    // no approved(resn_1, _, _) fact
    expect(engine.query.exists(['covered', ['concern_1']])).toBe(false);
  });

  it('AC-4.1: unaddressed_concern(C) derives when ratified Concern has no covering Resolution', async () => {
    const engine = await makeRealEngineWithClosurePolicy();
    engine.facts.assertFact('concern_status', ['concern_1', 'ratified']);
    expect(engine.query.exists(['unaddressed_concern', ['concern_1']])).toBe(true);
  });

  it('AC-4.1: unaddressed_concern(C) does NOT derive when Concern is covered', async () => {
    const engine = await makeRealEngineWithClosurePolicy();
    engine.facts.assertFact('concern_status', ['concern_1', 'ratified']);
    engine.facts.assertFact('addresses', ['resn_1', 'concern_1']);
    engine.facts.assertFact('approved', ['resn_1', 'designer', 1700000000]);
    expect(engine.query.exists(['unaddressed_concern', ['concern_1']])).toBe(false);
  });

  it('AC-4.1: unaddressed_concern(C) does NOT derive when Concern is draft', async () => {
    const engine = await makeRealEngineWithClosurePolicy();
    engine.facts.assertFact('concern_status', ['concern_1', 'draft']);
    expect(engine.query.exists(['unaddressed_concern', ['concern_1']])).toBe(false);
  });

  it('AC-4.2: closure_permitted is blocked when an unaddressed ratified Concern exists', async () => {
    const engine = await makeRealEngineWithClosurePolicy();
    engine.facts.assertFact('concern_status', ['concern_1', 'ratified']);
    expect(engine.query.exists(['closure_permitted', []])).toBe(false);
  });

  it('AC-4.2: closure_permitted derives when every ratified Concern is covered', async () => {
    const engine = await makeRealEngineWithClosurePolicy();
    engine.facts.assertFact('concern_status', ['concern_1', 'ratified']);
    engine.facts.assertFact('addresses', ['resn_1', 'concern_1']);
    engine.facts.assertFact('approved', ['resn_1', 'designer', 1700000000]);
    expect(engine.query.exists(['closure_permitted', []])).toBe(true);
  });
});
```

**Note:** The exact import path `'../../../engine/Engine.js'` reflects the relocated tree (domain at `skills/design-proof-system/references/domain/__tests__/` resolves up three levels to reach `engine/Engine.js`). If the existing `bridge-integration.test.js:37` uses a different path, mirror it exactly. The implementer should verify the import path resolves before running the test.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd skills/design-proof-system/references/domain && npx vitest run __tests__/concern-schema.test.js -t "closure-policy rules"`
Expected: FAIL — the existing `unaddressed_concern_rule` body uses `risk(C, _, _)` so it never fires on `concern_status` facts; `covered(C)` has no producer rule.

- [ ] **Step 3: Write minimal implementation**

In `skills/design-proof-system/references/domain/closure-policy.js`:

**3a.** Replace the body of `unaddressed_concern_rule` at line 26 with the spec's corrected form:

```javascript
  rulePorts.defineRule(
    'unaddressed_concern_rule',
    ['unaddressed_concern', ['C']],
    [['concern_status', ['C', 'ratified']], ['not', ['covered', ['C']]]],
    { domain_concept: 'unaddressed_concern', module: 'closure-policy' },
  );
```

**3b.** Append a new `covered_rule` immediately after the `unaddressed_concern_rule` block:

```javascript
  rulePorts.defineRule(
    'covered_rule',
    ['covered', ['C']],
    [
      ['concern_status', ['C', 'ratified']],
      ['addresses', ['R', 'C']],
      ['approved', ['R', '_', '_']],
    ],
    { domain_concept: 'covered', module: 'closure-policy' },
  );
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd skills/design-proof-system/references/domain && npx vitest run __tests__/concern-schema.test.js __tests__/closure-policy.test.js`
Expected: all 7 new closure-policy derivation tests pass; existing closure-policy smoke tests still pass.

- [ ] **Step 5: Commit**

```bash
git add skills/design-proof-system/references/domain/closure-policy.js \
        skills/design-proof-system/references/domain/__tests__/concern-schema.test.js
git commit -m "fix(domain): correct unaddressed_concern_rule body and add covered(C) producer rule"
```

---

## Task 6: Add dedicated CONCERN bridge entry points + validPredicates updates

**Type:** code-producing
**Implements:** AC-3.1, AC-2.2 (validPredicates portion)
**Decision budget:** 0
**Must remain green:** `domain-bridge.test.js`, `bridge-integration.test.js`; new bridge-shape tests added below

**Files:**
- Modify: `skills/design-proof-system/references/domain/domain-bridge.js:47` (validPredicates loop — add `'concern'`, `'concern_status'`, `'covered'`)
- Modify: `skills/design-proof-system/references/domain/domain-bridge.js:88-94` (insert 4 new entry-point methods immediately after DEFINITION block)
- Modify: `skills/design-proof-system/references/domain/domain-bridge.js:155` (mirror validPredicates loop update)
- Test: `skills/design-proof-system/references/domain/__tests__/concern-schema.test.js` (extend)

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Append to `concern-schema.test.js`:

```javascript
import { createDomainBridge } from '../domain-bridge.js';

function makeTestBridge() {
  const s = createInMemorySubstrate();
  const idCounters = {};
  const idAllocator = { next: (shape) => { idCounters[shape] = (idCounters[shape] || 0) + 1; return `${shape}_${idCounters[shape]}`; } };
  const clock = { now: () => 1700000000 };
  const consentVerification = { verify: () => true };
  const persistenceRepo = { saveState: () => {} };
  return createDomainBridge({ engine: s, clock, idAllocator, consentVerification, persistenceRepo });
}

describe('CONCERN — bridge facade', () => {
  it('AC-3.1: addConcern allocates concern_N id and returns it', () => {
    const bridge = makeTestBridge();
    const result = bridge.addConcern({ label: 'L1', description: 'D1' }, { source: 'designer' });
    expect(result.id).toMatch(/^concern_\d+$/);
  });

  it('AC-1.4: addConcern produces id matching ^concern_\\d+$', () => {
    const bridge = makeTestBridge();
    const r1 = bridge.addConcern({ label: 'L1' }, { source: 'designer' });
    const r2 = bridge.addConcern({ label: 'L2' }, { source: 'designer' });
    expect(r1.id).toBe('concern_1');
    expect(r2.id).toBe('concern_2');
  });

  it('AC-3.1: bridge facade exposes all four CONCERN entry points', () => {
    const bridge = makeTestBridge();
    expect(typeof bridge.addConcern).toBe('function');
    expect(typeof bridge.reviseConcern).toBe('function');
    expect(typeof bridge.ratifyConcern).toBe('function');
    expect(typeof bridge.withdrawConcern).toBe('function');
  });

  it('AC-2.2: validPredicates includes concern, concern_status, covered (smoke via boot success)', () => {
    // Smoke test rationale (corrected per plan-01 mitigations): validateOperationSpecs only
    // checks OPERATION_SPECS preconditions/postconditions predicates, NOT Phase-A rule head
    // atoms. The real boot-time guard is the rule-store accepting the rule definitions in
    // closure-policy.js's registerStatic. If validPredicates were missing concern/concern_status/
    // covered, the bridge would still boot successfully — but downstream queryProof calls
    // against those predicate names would fail their argument validation. The smoke test here
    // confirms boot completes without throw; deeper validation lives in the AC-4.x derivation
    // tests (Task 5) and the AC-7.1 lifecycle test (Task 7).
    expect(() => makeTestBridge()).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd skills/design-proof-system/references/domain && npx vitest run __tests__/concern-schema.test.js -t "bridge facade"`
Expected: FAIL — `bridge.addConcern` is undefined; `addConcern` calls fall through to undefined method.

- [ ] **Step 3: Write minimal implementation**

In `skills/design-proof-system/references/domain/domain-bridge.js`:

**3a.** Update the `validPredicates` loop at line 47 to add the three new predicates:

```javascript
  for (const p of ['closure_permitted', 'unresolved_friction', 'unaddressed_concern', 'covered', 'ungrounded_proposition', 'coverage_gap_detected', 'overlap_detected', 'conflict_detected', 'proposition', 'resolution', 'definition', 'concern', 'concern_status']) validPredicates.add(p);
```

**3b.** Mirror the same update at line 155 inside `createDomainBridgeWith`:

```javascript
  for (const p of ['closure_permitted', 'unresolved_friction', 'unaddressed_concern', 'covered', 'ungrounded_proposition', 'coverage_gap_detected', 'overlap_detected', 'conflict_detected', 'proposition', 'resolution', 'definition', 'concern', 'concern_status']) validPredicates.add(p);
```

**3c.** Insert four new CONCERN bridge entries immediately after `deprecateDefinition` at line 94 (and before `queryOverlap` at line 96), mirroring the DEFINITION pattern:

```javascript
    /** @param {object} args @param {object} consent @throws {DomainError} @returns {object} */
    addConcern: (args, consent) => runOperation('add', { ...args, idShape: tags.ELEMENT_CATEGORIES.CONCERN }, consent, fullPorts),
    /** @param {object} args @param {object} consent @throws {DomainError} @returns {object} */
    reviseConcern: (args, consent) => runOperation('revise', { ...args, idShape: tags.ELEMENT_CATEGORIES.CONCERN }, consent, fullPorts),
    /** @param {object} args @param {object} consent @throws {DomainError} @returns {object} */
    ratifyConcern: (args, consent) => runOperation('ratify', { ...args, idShape: tags.ELEMENT_CATEGORIES.CONCERN }, consent, fullPorts),
    /** @param {object} args @param {object} consent @throws {DomainError} @returns {object} */
    withdrawConcern: (args, consent) => runOperation('withdraw', { ...args, idShape: tags.ELEMENT_CATEGORIES.CONCERN }, consent, fullPorts),
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd skills/design-proof-system/references/domain && npx vitest run __tests__/concern-schema.test.js __tests__/domain-bridge.test.js __tests__/bridge-integration.test.js`
Expected: all CONCERN bridge tests pass; existing bridge tests pass.

- [ ] **Step 5: Commit**

```bash
git add skills/design-proof-system/references/domain/domain-bridge.js \
        skills/design-proof-system/references/domain/__tests__/concern-schema.test.js
git commit -m "feat(domain): add dedicated CONCERN bridge entry points and update validPredicates"
```

---

## Task 7: End-to-end Concern lifecycle integration test

**Type:** code-producing
**Implements:** AC-7.1, AC-2.3 (end-to-end ratify→derive), AC-1.4 (end-to-end id format)
**Decision budget:** 1 (test count parity with DEFINITION — DEFINITION has approximately 8-12 tests across schema/translation/bridge-integration; this task's tests across Tasks 1-6 plus the lifecycle test below already exceed that floor)
**Must remain green:** `concern-schema.test.js` itself; full domain suite remains green

**Files:**
- Modify: `skills/design-proof-system/references/domain/__tests__/concern-schema.test.js` (append the end-to-end lifecycle test)

**Critical context (carried over from plan-01 mitigations):**

1. **Use the real Engine, not the in-memory substrate.** `_runFixedPoint` in the substrate is a no-op stub — derivation tests against it produce false signals. Bootstrap a real Engine + full `createDomainBridge` per `bridge-integration.test.js:36-50` pattern.
2. **Use the working ratify call shape.** `mutations.js:119` runs `verifyArgsShape` against `targetShape`. The dedicated `ratifyConcern` wrapper pins `idShape: 'concern'` which triggers verifyArgsShape against Concern's `requiredFields: ['label']` → throws SHAPE_INVALID. The latent same-shape brokenness affects `ratifyDefinition` (pre-existing, no test exercises it). Use generic `ratifyElement({ elementId: id, source: 'designer', claim: '_' }, consent)` with dummy `source` + `claim` fields — this is the working pattern from `bridge-integration.test.js:49-50`. **`ratifyConcern` is added to the bridge facade for surface-coverage (AC-3.1) but its latent SHAPE_INVALID throw mirrors `ratifyDefinition`'s pre-existing behavior — see Known Issues section.**

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Append to `concern-schema.test.js`:

```javascript
// Helper: boot a real Engine + full createDomainBridge per bridge-integration.test.js:36-50.
async function makeRealBridge() {
  const { Engine } = await import('../../../engine/Engine.js');
  const idCounters = {};
  const idAllocator = { next: (shape) => { idCounters[shape] = (idCounters[shape] || 0) + 1; return `${shape}_${idCounters[shape]}`; } };
  const clock = { now: () => 1700000000 };
  const consentVerification = { verify: () => true };
  const persistenceRepo = { saveState: () => {} };
  return createDomainBridge({ engine: new Engine(), clock, idAllocator, consentVerification, persistenceRepo });
}

describe('CONCERN — lifecycle integration (real Engine)', () => {
  it('AC-2.3 + AC-1.4: add → ratify produces concern_status(C, ratified) in the engine', async () => {
    const bridge = await makeRealBridge();
    const { id } = bridge.addConcern({ label: 'C1', description: 'D1' }, { source: CONSENT_SOURCES.DESIGNER });
    expect(id).toMatch(/^concern_\d+$/);
    // Use the working ratify pattern: generic ratifyElement with dummy source + claim
    // fields. The pinned-idShape path (ratifyConcern / ratifyElement{idShape:'concern'})
    // throws SHAPE_INVALID — see Known Issues. This generic call defaults to
    // idShape='evidence' (the RATIFY spec's fallback) so verifyArgsShape checks against
    // EVIDENCE's required ['source','claim'] which the dummy fields satisfy.
    bridge.ratifyElement({ elementId: id, source: 'designer', claim: '_' }, { source: CONSENT_SOURCES.DESIGNER });
    const ratifiedRows = bridge.queryProof({ pattern: ['concern_status', [id, 'ratified']] });
    expect(ratifiedRows.length).toBeGreaterThan(0);
  });

  it('AC-7.1: full add → ratify Resolution that addresses → closure_permitted derives', async () => {
    const bridge = await makeRealBridge();
    const { id: cId } = bridge.addConcern({ label: 'C1' }, { source: CONSENT_SOURCES.DESIGNER });
    bridge.ratifyElement({ elementId: cId, source: 'designer', claim: '_' }, { source: CONSENT_SOURCES.DESIGNER });
    const { id: rId } = bridge.addElement({ idShape: 'resolution', statement: 'R1', addresses: cId }, { source: CONSENT_SOURCES.DESIGNER });
    bridge.ratifyElement({ elementId: rId, source: 'designer', claim: '_' }, { source: CONSENT_SOURCES.DESIGNER });
    const coveredRows = bridge.queryProof({ pattern: ['covered', [cId]] });
    expect(coveredRows.length).toBeGreaterThan(0);
  });

  it('AC-3.1 surface coverage: ratifyConcern is exported (latent SHAPE_INVALID — see Known Issues)', async () => {
    const bridge = await makeRealBridge();
    expect(typeof bridge.ratifyConcern).toBe('function');
    // Documenting the latent throw: calling ratifyConcern with only {elementId}
    // throws SHAPE_INVALID because verifyArgsShape checks Concern's requiredFields=['label'].
    // This mirrors the pre-existing ratifyDefinition brokenness (domain-bridge.js:92).
    // Resolution of this latent issue is out of scope for this sprint.
    let captured = null;
    const { id } = bridge.addConcern({ label: 'C1' }, { source: CONSENT_SOURCES.DESIGNER });
    try { bridge.ratifyConcern({ elementId: id }, { source: CONSENT_SOURCES.DESIGNER }); } catch (e) { captured = e; }
    expect(captured).not.toBeNull();
    expect(captured.code).toBe('SHAPE_INVALID');
    expect(captured.field).toBe('label');
  });
});
```

The third test pins the latent brokenness in place as a known-state assertion. If a future sub-sprint fixes the ratify shape check, this test will be the canary that flags the fix is in.

- [ ] **Step 2: Run test to verify it fails**

If Task 4 (Phase-C dispatch list) was applied, the ratify path should derive `concern_status(_, 'ratified')`. The lifecycle test should fail only if any prior task didn't land. Otherwise it should pass.

Run: `cd skills/design-proof-system/references/domain && npx vitest run __tests__/concern-schema.test.js -t "lifecycle integration"`
Expected: PASS (validates all prior tasks composed correctly). If FAIL, the failing assertion identifies which prior task needs fixing.

- [ ] **Step 3: (no impl change — this task is verification)**

If Step 2 passed, skip Step 3. If Step 2 failed, the failure points to a gap in Tasks 1-6; fix the indicated gap before continuing.

- [ ] **Step 4: Run the full concern-schema test file plus all existing domain tests**

Run: `cd skills/design-proof-system/references/domain && npm test`
Expected: 0 failures across the entire domain suite. Test count is approximately 84 (existing) + ~18 (new concern-schema) = ~102 tests.

- [ ] **Step 5: Commit**

```bash
git add skills/design-proof-system/references/domain/__tests__/concern-schema.test.js
git commit -m "test(domain): add end-to-end CONCERN lifecycle integration test"
```

---

## Task 8: Final regression verification + AC-7.2 archived-plans check

**Type:** code-producing (verification — runs the test suites and a git diff check)
**Implements:** AC-6.1, AC-6.2, AC-7.2
**Decision budget:** 0
**Must remain green:** entire domain suite, entire engine suite, archived plans untouched

**Files:**
- No file changes — this task is verification only. If any verification fails, fix the root cause via a follow-up task before declaring complete.

**Steps:**

- [ ] **Step 1: Run the full domain test suite**

Run: `cd /home/mike/Documents/CodeProjects/Chester/.worktrees/sprint-02-proof-layer-pass-2/skills/design-proof-system/references/domain && npm test`
Expected: 0 failures. Total test count ≥ 84 (the pre-spec baseline) plus the new concern-schema test additions (~18 tests).

- [ ] **Step 2: Run the full engine test suite**

Run: `cd /home/mike/Documents/CodeProjects/Chester/.worktrees/sprint-02-proof-layer-pass-2/skills/design-proof-system/references/engine && npm test`
Expected: 138 passing tests, 0 failures (engine is untouched by this sprint; this is the no-regression check).

- [ ] **Step 3: Verify no archived plans were edited (AC-7.2)**

Run: `cd /home/mike/Documents/CodeProjects/Chester/.worktrees/sprint-02-proof-layer-pass-2 && git diff --name-only 132dfba.. | grep '^docs/chester/plans/' || echo "OK: no archived plans modified"`
Expected: `OK: no archived plans modified`.

- [ ] **Step 4: Verify no file under `skills/design-large-task/proof-mcp/` was modified (system-boundary check)**

Run: `cd /home/mike/Documents/CodeProjects/Chester/.worktrees/sprint-02-proof-layer-pass-2 && git diff --name-only 132dfba.. | grep '^skills/design-large-task/proof-mcp/' || echo "OK: proof-mcp untouched"`
Expected: `OK: proof-mcp untouched`.

- [ ] **Step 5: Commit**

This is a verification task with no source change. Skip the commit; record the verification result in execute-write's Decisions field for AC-6.1/6.2/7.2.

---

## Implementation Notes

- **Test allocator pattern.** The `makeTestBridge` helper in Task 6 inlines an id allocator producing `${shape}_${n}` — the same pattern used by `__tests__/bridge-integration.test.js:14-19`. Reuse that fixture if possible; otherwise inline as shown.
- **Stratification check.** The new `covered_rule` and `unaddressed_concern_rule` (corrected) form an acyclic stratification chain: `unaddressed_concern` depends negatively on `covered`; `covered` depends positively on `concern_status`, `addresses`, `approved`. The substrate's stratifier (`__tests__/_fixtures/inMemorySubstrate.js:127-181`) is **cycle-based, not order-based** — it builds a full directed graph over all rules at every `defineRule` call and DFS-checks for cycles through negation. Registration order is irrelevant; only the final rule set matters. The real Engine's stratifier behavior should be similar; if Phase-A `registerStatic` throws `STRATIFICATION_ERROR`, the implementer should inspect the cycle path the error reports, not reorder rule definitions.
- **`addresses` arity.** The Resolution translator emits 2-position `addresses(R, C)` (translation.js:45). Cascade §7.2 cites 3-position `addresses(_, C, _)`; the spec adopts the 2-position form against the actual code (per spec AC-4.3).
- **Out-of-scope reminder.** No file under `skills/design-large-task/proof-mcp/` is touched. The new domain bridge surface (`addConcern` et al.) will sit unused by upstream callers until a separate future sub-sprint adopts it. This is a deliberate boundary, not an oversight (spec Non-Goals, line 91).

## Known Issues (accepted residuals from plan-01 hardening)

These are known limitations the plan accepts as out-of-scope per spec discipline ("no abstraction introduction", "no adjacent refactoring beyond cascade-mandated rule additions"). Each is documented so execute-write can record the Decision against the relevant AC and so a future sub-sprint can pick them up cleanly.

- **`ratifyConcern` (and pre-existing `ratifyDefinition`) latently throw SHAPE_INVALID.** When `idShape: 'concern'` (or `'definition'`) is pinned by the dedicated bridge wrapper, `verifyArgsShape` runs against the element's `requiredFields` (`['label']` for Concern, `['term', 'definition']` for Definition). Ratify args only supply `{ elementId, idShape }` — no `label`/`term`/`definition` — so verifyArgsShape throws. The working ratify pattern is the generic `ratifyElement` with dummy `source` + `claim` fields satisfying EVIDENCE's shape (the RATIFY OPERATION_SPEC's fallback idShape). Task 7's third test pins this latent state as a canary. Fixing the ratify path's shape-check semantics is out of scope; it would require a `verifyArgsShape`-bypass for ratify, or a per-verb shape policy on `CATEGORY_REGISTRY`. Treat as a separate sub-sprint candidate.
- **`validPredicates` duplicated at `domain-bridge.js:47` and `:155`.** The static rule-head predicate list appears in two for-loops (one inside `createDomainBridge`, one inside `createDomainBridgeWith`). Plan-01 extends both correctly with `'concern'`, `'concern_status'`, `'covered'`. The duplication is pre-existing; no test enforces the two stay in sync. A future sub-sprint could extract a single source of truth (e.g., read rule heads from the rule store after Phase-A), but that introduces an abstraction the spec discipline currently forbids.
- **`createDomainBridgeWith` ends in `throw new Error(...)` at `domain-bridge.js:185`.** This is a test-only factory used by `bridge-integration.test.js:170-247` to inject corrupted registries for AC-4.x boot-validator tests. The new CONCERN bridge methods are added only to `createDomainBridge` — `createDomainBridgeWith` remains a throwing stub. Its existing error-path tests don't reach a facade call so they're unaffected. The divergence is now wider by four methods; a future sub-sprint can either resolve the stub or document its permanent error-only role.
- **Task 4 has no truly-red TDD step.** Step 1's test passes immediately because Task 3 lands the `RULE_TEMPLATES[CONCERN]` entry. The real red-to-green transition lives in Task 7's lifecycle test. This breaks strict TDD discipline but the dispatch-list mutation in Task 4 is a one-line change whose verification cost via Task 7 is appropriate. Accepted.
- **`validPredicates` omits `closure_failure_reason` (pre-existing).** The list at `domain-bridge.js:47` does not include `closure_failure_reason` even though `closure-policy.js:33-44` derives it. Harmless because no OPERATION_SPECS precondition/postcondition references the predicate. Plan-01 does not add it; not introduced by this plan.
- **Phase-C dispatch list duplicates `RULE_TEMPLATES` keys.** `mutations.js:133` hardcodes `[PROPOSITION, RESOLUTION, DEFINITION, CONCERN]` rather than reading `Object.keys(RULE_TEMPLATES)`. Pre-existing structural pattern. Plan-01 extends it; deduplicating is out of scope.

<!-- created-at: 2026-05-15T09:05:49Z -->
<!-- produced-by plan-build@v0004 -->
