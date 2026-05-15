# Plan: Add Missing CONCERN Element Category to Domain Pipeline

**Sprint:** sprint-02-proof-layer-pass-2 (under master `20260511-01-mp-redesign-proof-system`)
**Spec:** `docs/chester/working/20260511-01-mp-redesign-proof-system/sprint-02-proof-layer-pass-2/spec/sprint-02-proof-layer-pass-2-spec-03.md`
**Execution mode:** subagent

> **For agentic workers:** Use execute-write to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The `Execution mode` field is `subagent`; execute-write Section 2 runs.

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

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Append to `concern-schema.test.js`:

```javascript
import { createInMemorySubstrate } from './_fixtures/inMemorySubstrate.js';
import { registerStatic as registerClosurePolicy } from '../closure-policy.js';

describe('CONCERN — closure-policy rules', () => {
  it('AC-4.3: covered(C) derives when concern_status(C, ratified) + addresses(R, C) + approved(R, _, _)', () => {
    const s = createInMemorySubstrate();
    registerClosurePolicy(s.rules);
    s.facts.assertFact('concern', ['concern_1', 'L1', 'D1']);
    s.facts.assertFact('concern_status', ['concern_1', 'ratified']);
    s.facts.assertFact('resolution_decl', ['resn_1', 'R1-statement']);
    s.facts.assertFact('addresses', ['resn_1', 'concern_1']);
    s.facts.assertFact('approved', ['resn_1', 'designer', 1700000000]);
    s.query.derive();
    expect(s.query.exists(['covered', ['concern_1']])).toBe(true);
  });

  it('AC-4.3: covered(C) does NOT derive when addressing Resolution is unapproved', () => {
    const s = createInMemorySubstrate();
    registerClosurePolicy(s.rules);
    s.facts.assertFact('concern_status', ['concern_1', 'ratified']);
    s.facts.assertFact('addresses', ['resn_1', 'concern_1']);
    // no approved(resn_1, _, _) fact
    s.query.derive();
    expect(s.query.exists(['covered', ['concern_1']])).toBe(false);
  });

  it('AC-4.1: unaddressed_concern(C) derives when ratified Concern has no covering Resolution', () => {
    const s = createInMemorySubstrate();
    registerClosurePolicy(s.rules);
    s.facts.assertFact('concern_status', ['concern_1', 'ratified']);
    s.query.derive();
    expect(s.query.exists(['unaddressed_concern', ['concern_1']])).toBe(true);
  });

  it('AC-4.1: unaddressed_concern(C) does NOT derive when Concern is covered', () => {
    const s = createInMemorySubstrate();
    registerClosurePolicy(s.rules);
    s.facts.assertFact('concern_status', ['concern_1', 'ratified']);
    s.facts.assertFact('addresses', ['resn_1', 'concern_1']);
    s.facts.assertFact('approved', ['resn_1', 'designer', 1700000000]);
    s.query.derive();
    expect(s.query.exists(['unaddressed_concern', ['concern_1']])).toBe(false);
  });

  it('AC-4.1: unaddressed_concern(C) does NOT derive when Concern is draft', () => {
    const s = createInMemorySubstrate();
    registerClosurePolicy(s.rules);
    s.facts.assertFact('concern_status', ['concern_1', 'draft']);
    s.query.derive();
    expect(s.query.exists(['unaddressed_concern', ['concern_1']])).toBe(false);
  });

  it('AC-4.2: closure_permitted is blocked when an unaddressed ratified Concern exists', () => {
    const s = createInMemorySubstrate();
    registerClosurePolicy(s.rules);
    s.facts.assertFact('concern_status', ['concern_1', 'ratified']);
    s.query.derive();
    expect(s.query.exists(['closure_permitted', []])).toBe(false);
  });

  it('AC-4.2: closure_permitted derives when every ratified Concern is covered', () => {
    const s = createInMemorySubstrate();
    registerClosurePolicy(s.rules);
    s.facts.assertFact('concern_status', ['concern_1', 'ratified']);
    s.facts.assertFact('addresses', ['resn_1', 'concern_1']);
    s.facts.assertFact('approved', ['resn_1', 'designer', 1700000000]);
    s.query.derive();
    expect(s.query.exists(['closure_permitted', []])).toBe(true);
  });
});
```

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
    // If validPredicates were missing concern/concern_status/covered, the boot would fail with
    // a validateOperationSpecs throw on the head atoms in covered_rule / unaddressed_concern_rule.
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

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Append to `concern-schema.test.js`:

```javascript
describe('CONCERN — lifecycle integration', () => {
  it('AC-2.3 + AC-1.4: add → ratify produces concern_status(C, ratified) in the engine', () => {
    const bridge = makeTestBridge();
    const { id } = bridge.addConcern({ label: 'C1', description: 'D1' }, { source: 'designer' });
    expect(id).toMatch(/^concern_\d+$/);
    bridge.ratifyElement({ elementId: id, idShape: 'concern' }, { source: 'designer' });
    // Or: bridge.ratifyConcern({ elementId: id }, { source: 'designer' });
    const ratifiedRows = bridge.queryProof({ pattern: ['concern_status', [id, 'ratified']] });
    expect(ratifiedRows.length).toBeGreaterThan(0);
  });

  it('AC-7.1: full add → ratify Resolution that addresses → closure_permitted derives', () => {
    const bridge = makeTestBridge();
    const { id: cId } = bridge.addConcern({ label: 'C1' }, { source: 'designer' });
    bridge.ratifyConcern({ elementId: cId }, { source: 'designer' });
    const { id: rId } = bridge.addElement({ idShape: 'resolution', statement: 'R1', addresses: cId }, { source: 'designer' });
    bridge.ratifyElement({ elementId: rId, idShape: 'resolution' }, { source: 'designer' });
    const coveredRows = bridge.queryProof({ pattern: ['covered', [cId]] });
    expect(coveredRows.length).toBeGreaterThan(0);
  });
});
```

Note: the second test exercises the full chain. If `ratifyConcern` is the preferred surface, replace `bridge.ratifyElement({ elementId: id, idShape: 'concern' }, ...)` with `bridge.ratifyConcern({ elementId: id }, ...)` — execute-write will pick the one that exists and document the choice in the AC's Decisions field.

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
- **Stratification check.** The new `covered_rule` and `unaddressed_concern_rule` (corrected) form a stratification chain: `unaddressed_concern` depends negatively on `covered`; `covered` depends positively on `concern_status`, `addresses`, `approved`. Acyclic. If Phase-A `registerStatic` throws `STRATIFICATION_ERROR` at boot, the implementer should check rule-registration order in `closure-policy.js:registerStatic` — define `covered_rule` BEFORE `unaddressed_concern_rule` so the stratifier sees the producer first.
- **`addresses` arity.** The Resolution translator emits 2-position `addresses(R, C)` (translation.js:45). Cascade §7.2 cites 3-position `addresses(_, C, _)`; the spec adopts the 2-position form against the actual code (per spec AC-4.3).
- **Out-of-scope reminder.** No file under `skills/design-large-task/proof-mcp/` is touched. The new domain bridge surface (`addConcern` et al.) will sit unused by upstream callers until a separate future sub-sprint adopts it. This is a deliberate boundary, not an oversight (spec Non-Goals, line 91).
