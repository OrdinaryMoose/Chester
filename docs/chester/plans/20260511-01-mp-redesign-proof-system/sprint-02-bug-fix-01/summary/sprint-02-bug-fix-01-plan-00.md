# Plan: Restore reasoning_chain, rejected_alternatives, and collapse_test render to PROPOSITION pipeline

**Sprint:** sprint-02-bug-fix-01 (under master plan `20260511-01-mp-redesign-proof-system`)
**Spec:** `docs/chester/working/20260511-01-mp-redesign-proof-system/sprint-02-bug-fix-01/spec/sprint-02-bug-fix-01-spec-01.md`
**Execution mode:** subagent

> **For agentic workers:** Use execute-write to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The `Execution mode` field selects which execute-write section runs — Section 2 (subagent-driven) or Section 3 (inline). plan-build sets this field at handoff based on the Execution Mode Selection heuristic, with human confirm/override.

## Goal

Close the cascade-vs-implementation gap in the PROPOSITION pipeline by restoring the `reasoning_chain` required field, the `rejected_alternatives` optional field, and the structured-proof render lines for `collapse_test`, `reasoning_chain`, and `rejected_alternatives` per ADR-0006 — plus the supporting whitelist extensions and the cross-cutting ratify-path fix the new required-field count surfaces.

## Architecture

Declarative-schema spine: extend the PROPOSITION `CategoryDescriptor` with the two new fields, generalize `verifyArgsShape` with a new declarative `nonEmptyStringFields` directive (so `reasoning_chain: ''` is rejected at the schema layer without introducing PROPOSITION-specific validator code), extend the PROPOSITION translator to emit the corresponding meta-facts using the existing array-spread idiom from the RESOLUTION translator, extend the EDB whitelist atomically with `PROJECTION_ARITIES`, extend `renderStructuredProof` to surface all three ADR-0006 lines, and add the missing `argShape` to RATIFY's `OPERATION_SPECS` entry following the existing WITHDRAW/MANAGE_FRICTION precedent so the ratify path stops checking element-shape required-fields against ratify-shape args.

## Tech Stack

- **Language:** JavaScript (ESM), Node 18+
- **Test runner:** Vitest (`npm test`)
- **System under change:** `skills/design-proof-system/references/domain/`
- **Test discipline:** Real-import (no mocks per dr-20260514-06)

## Implementer Watch-Items

These items came from the plan-attack and plan-smell hardening reviews. Read before starting any task.

1. **`inference_pattern` value.** The spec's example fixtures (AC-2.1, etc.) show `inference_pattern: 'grounds-imply-conclusion'` with a **hyphen**. The actual enum in `tags.js:21` is `INFERENCE_PATTERNS.GROUNDS_IMPLY_CONCLUSION = 'grounds_imply_conclusion'` with an **underscore**. In test fixtures, always use the constant `INFERENCE_PATTERNS.GROUNDS_IMPLY_CONCLUSION`, never a string literal — the spec's hyphen form would fail the closed-enum check in `verifyArgsShape`.

2. **`grounding/2` second argument is array-valued by pre-existing design.** `translation.js` stores `args.grounding` as-is (not spread per element like RESOLUTION's `addresses`). Use `grounding: ['evid_1']` in test fixtures; this matches the existing translator contract.

3. **Static imports for `proposition-schema.test.js`.** When Task 3 adds the AC-3.4 test, the file's top-level imports must include `createDomainBridge` from `../domain-bridge.js` and `createInMemorySubstrate` from `./_fixtures/inMemorySubstrate.js`. The plan lists these explicitly in Task 3 Step 1.

---

## Task 1: Add `nonEmptyStringFields` directive to verifyArgsShape (+ explicit-empty on all descriptors)

**Type:** code-producing
**Implements:** AC-2.6
**Decision budget:** 1 (where in the loop order to insert the new check — after presence, before/after closed-enum)
**Must remain green:** `schema.test.js` (all existing 4 tests), plus the new mechanism test added here. All other test files must remain green — adding `nonEmptyStringFields: []` to other descriptors is a no-op semantically (the `if (f in args)` guard means an empty array iterates zero times).

**Files:**
- Modify: `skills/design-proof-system/references/domain/schema.js` (extend `verifyArgsShape` around lines 94-115; add `nonEmptyStringFields: []` to the eight non-PROPOSITION category descriptors at lines 4-86)
- Modify: `skills/design-proof-system/references/domain/__tests__/schema.test.js` (add one mechanism test)

**Mitigation from plan-smell Finding 3:** to keep `nonEmptyStringFields` self-documenting on every descriptor (matching the established `closedEnumFields: {}` empty-value pattern), add `nonEmptyStringFields: []` to the other eight descriptors — EVIDENCE, RULE, PERMISSION, RISK, RESOLUTION, FRICTION, CONCERN, DEFINITION. PROPOSITION's actual `nonEmptyStringFields: ['reasoning_chain']` value lands in Task 2.

**Steps (TDD):**

- [ ] **Step 1: Write the failing test in `schema.test.js`**

Add this test case at the end of the existing `describe('schema', ...)` block (after the closed-enum test, before the closing `});`):

```javascript
  it('verifyArgsShape throws SHAPE_INVALID when a nonEmptyStringFields entry is empty or whitespace', () => {
    const stubDescriptor = {
      label: 'stub',
      requiredFields: ['foo'],
      nonEmptyStringFields: ['foo'],
      closedEnumFields: {},
    };
    // Presence check passes (foo is present), then nonEmpty check fails on empty string.
    let captured = null;
    try { verifyArgsShape({ foo: '' }, stubDescriptor); } catch (e) { captured = e; }
    expect(captured).not.toBeNull();
    expect(captured.code).toBe('SHAPE_INVALID');
    expect(captured.field).toBe('foo');

    // Same for whitespace-only.
    captured = null;
    try { verifyArgsShape({ foo: '   ' }, stubDescriptor); } catch (e) { captured = e; }
    expect(captured).not.toBeNull();
    expect(captured.code).toBe('SHAPE_INVALID');
    expect(captured.field).toBe('foo');

    // And non-string values.
    captured = null;
    try { verifyArgsShape({ foo: 42 }, stubDescriptor); } catch (e) { captured = e; }
    expect(captured).not.toBeNull();
    expect(captured.code).toBe('SHAPE_INVALID');
    expect(captured.field).toBe('foo');

    // Valid non-empty string passes through unchanged.
    expect(verifyArgsShape({ foo: 'hello' }, stubDescriptor)).toEqual({ foo: 'hello' });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd skills/design-proof-system/references/domain && npm test -- --run schema`
Expected: the new test FAILS (the `nonEmptyStringFields` directive is not yet consumed; `verifyArgsShape({ foo: '' }, stubDescriptor)` returns the args without throwing).

- [ ] **Step 3: Extend `verifyArgsShape` in `schema.js`**

Locate the `verifyArgsShape` function (around lines 94-115). After the existing `closedEnumFields` loop and before the `return args;` line, add a third loop:

```javascript
  for (const f of (desc.nonEmptyStringFields ?? [])) {
    if (f in args) {
      const v = args[f];
      if (typeof v !== 'string' || v.trim().length === 0) {
        throw Object.assign(new Error(`SHAPE_INVALID: field "${f}" for ${label} must be a non-empty string`), { code: 'SHAPE_INVALID', field: f });
      }
    }
  }
```

Note: the `if (f in args)` guard is intentional — `nonEmptyStringFields` operates against the **value** of a field that is *present*. Whether the field is *required* is the `requiredFields` loop's responsibility. This separation lets a field be (e.g.) optional-but-nonempty-when-supplied in some future use.

- [ ] **Step 3b: Add `nonEmptyStringFields: []` to the other eight category descriptors in `schema.js`**

Locate `CATEGORY_REGISTRY` (lines 3-85). For each of the eight non-PROPOSITION descriptors (EVIDENCE, RULE, PERMISSION, RISK, RESOLUTION, FRICTION, CONCERN, DEFINITION), insert a `nonEmptyStringFields: [],` line between `optionalFields` and `sourceConstraint`, matching the placement convention.

Example for EVIDENCE (lines 4-12):

Before:
```javascript
  [ELEMENT_CATEGORIES.EVIDENCE]: Object.freeze({
    requiredFields: ['source', 'claim'],
    optionalFields: ['url', 'citation'],
    sourceConstraint: CONSENT_SOURCES.DESIGNER,
    ...
  }),
```

After:
```javascript
  [ELEMENT_CATEGORIES.EVIDENCE]: Object.freeze({
    requiredFields: ['source', 'claim'],
    optionalFields: ['url', 'citation'],
    nonEmptyStringFields: [],
    sourceConstraint: CONSENT_SOURCES.DESIGNER,
    ...
  }),
```

Apply the same insertion to RULE, PERMISSION, RISK, RESOLUTION, FRICTION, CONCERN, and DEFINITION descriptors. **Do NOT add to PROPOSITION** — Task 2 sets PROPOSITION's `nonEmptyStringFields: ['reasoning_chain']` and would conflict with a placeholder added here.

This is purely self-documenting: the `?? []` guard in `verifyArgsShape` already makes absence equivalent to `[]`, so adding the explicit empty array has no runtime effect. The benefit is discoverability — a developer adding a tenth category will see `nonEmptyStringFields: []` in every existing descriptor and remember the directive exists.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd skills/design-proof-system/references/domain && npm test -- --run schema`
Expected: all 5 tests PASS (the 4 existing + the new mechanism test).

- [ ] **Step 5: Commit**

```bash
git add skills/design-proof-system/references/domain/schema.js skills/design-proof-system/references/domain/__tests__/schema.test.js
git commit -m "feat(schema): add nonEmptyStringFields directive to verifyArgsShape; explicit-empty on all descriptors"
```

---

## Task 2: Extend PROPOSITION schema descriptor + fixture repair + descriptor tests

**Type:** code-producing
**Implements:** AC-1.1, AC-1.2, AC-1.3, AC-2.1, AC-2.2, AC-2.3, AC-2.4, AC-2.5
**Decision budget:** 2 (order of `reasoning_chain` within `requiredFields`; whether to add the closed-enum-test fixture repair atomically or in Task 7)
**Must remain green:** `schema.test.js` (all 5 tests after Task 1), `concern-schema.test.js` (unchanged), all `bridge-integration.test.js` tests (still pass because the comment at line 103 doesn't affect runtime). New tests in `proposition-schema.test.js`.

**Files:**
- Modify: `skills/design-proof-system/references/domain/schema.js` (extend `CATEGORY_REGISTRY[PROPOSITION]` around lines 31-39)
- Modify: `skills/design-proof-system/references/domain/__tests__/schema.test.js` (repair closed-enum fixture at line 29)
- Create: `skills/design-proof-system/references/domain/__tests__/proposition-schema.test.js`

**Steps (TDD):**

- [ ] **Step 1: Write the failing tests in the new file `proposition-schema.test.js`**

Create the file with the following content (covers AC-1.x and AC-2.x; other AC groups are added in later tasks):

```javascript
import { describe, it, expect } from 'vitest';
import { ELEMENT_CATEGORIES, CONSENT_SOURCES, INFERENCE_PATTERNS } from '../tags.js';
import { CATEGORY_REGISTRY, verifyArgsShape } from '../schema.js';

const validProposition = Object.freeze({
  statement: 'S',
  grounding: ['evid_1'],
  collapse_test: 'T',
  inference_pattern: INFERENCE_PATTERNS.GROUNDS_IMPLY_CONCLUSION,
  reasoning_chain: 'IF X THEN Y',
});

describe('PROPOSITION — schema descriptor (AC-1.x)', () => {
  it('AC-1.1: requiredFields equals [statement, grounding, collapse_test, inference_pattern, reasoning_chain] in cascade order', () => {
    expect(CATEGORY_REGISTRY[ELEMENT_CATEGORIES.PROPOSITION].requiredFields).toEqual([
      'statement', 'grounding', 'collapse_test', 'inference_pattern', 'reasoning_chain',
    ]);
  });

  it('AC-1.2: optionalFields contains scope and rejected_alternatives', () => {
    const opt = CATEGORY_REGISTRY[ELEMENT_CATEGORIES.PROPOSITION].optionalFields;
    expect(opt).toContain('scope');
    expect(opt).toContain('rejected_alternatives');
  });

  it('AC-1.3: nonEmptyStringFields equals [reasoning_chain]', () => {
    expect(CATEGORY_REGISTRY[ELEMENT_CATEGORIES.PROPOSITION].nonEmptyStringFields).toEqual(['reasoning_chain']);
  });
});

describe('PROPOSITION — verifyArgsShape (AC-2.x)', () => {
  it('AC-2.1: valid args pass unchanged', () => {
    expect(verifyArgsShape({ ...validProposition }, 'proposition')).toEqual({ ...validProposition });
  });

  it('AC-2.2: missing reasoning_chain throws SHAPE_INVALID with field reasoning_chain', () => {
    const { reasoning_chain, ...partial } = validProposition;
    let captured = null;
    try { verifyArgsShape(partial, 'proposition'); } catch (e) { captured = e; }
    expect(captured).not.toBeNull();
    expect(captured.code).toBe('SHAPE_INVALID');
    expect(captured.field).toBe('reasoning_chain');
  });

  it('AC-2.3: empty-string and whitespace-only reasoning_chain throws SHAPE_INVALID', () => {
    for (const bad of ['', '   ', '\t\n']) {
      let captured = null;
      try { verifyArgsShape({ ...validProposition, reasoning_chain: bad }, 'proposition'); } catch (e) { captured = e; }
      expect(captured).not.toBeNull();
      expect(captured.code).toBe('SHAPE_INVALID');
      expect(captured.field).toBe('reasoning_chain');
    }
  });

  it('AC-2.4: non-string reasoning_chain throws SHAPE_INVALID', () => {
    let captured = null;
    try { verifyArgsShape({ ...validProposition, reasoning_chain: 42 }, 'proposition'); } catch (e) { captured = e; }
    expect(captured).not.toBeNull();
    expect(captured.code).toBe('SHAPE_INVALID');
    expect(captured.field).toBe('reasoning_chain');
  });

  it('AC-2.5: rejected_alternatives optional — absent, empty, and populated all accepted', () => {
    expect(verifyArgsShape({ ...validProposition }, 'proposition')).toBeTruthy(); // absent
    expect(verifyArgsShape({ ...validProposition, rejected_alternatives: [] }, 'proposition')).toBeTruthy(); // empty
    expect(verifyArgsShape({ ...validProposition, rejected_alternatives: [{ statement: 'A1', rejection_reason: 'R1' }] }, 'proposition')).toBeTruthy(); // one
  });
});
```

- [ ] **Step 2: Repair the closed-enum fixture in `schema.test.js`**

Locate the existing test at line 27 (`it('verifyArgsShape throws SHAPE_INVALID on closed-enum violation (PROPOSITION.inference_pattern)', ...)`). The fixture at line 29 currently reads:

```javascript
const argsWithBadEnum = { statement: 's', grounding: 'g', collapse_test: 'c', inference_pattern: 'not_a_valid_pattern' };
```

Replace it with (adding `reasoning_chain: 'IF X THEN Y'` so the test still fails on the enum check, not on the new required-field check):

```javascript
const argsWithBadEnum = { statement: 's', grounding: 'g', collapse_test: 'c', inference_pattern: 'not_a_valid_pattern', reasoning_chain: 'IF X THEN Y' };
```

The test's existing assertions (`captured.code === 'SHAPE_INVALID'`, `captured.field === 'inference_pattern'`) remain unchanged.

- [ ] **Step 3: Run tests to verify the new tests fail and the repaired test still passes**

Run: `cd skills/design-proof-system/references/domain && npm test -- --run schema proposition-schema`
Expected: `schema.test.js` tests all PASS. `proposition-schema.test.js` tests all FAIL (CATEGORY_REGISTRY[PROPOSITION] still has the pre-spec four-field shape).

- [ ] **Step 4: Extend `CATEGORY_REGISTRY[PROPOSITION]` in `schema.js`**

Locate the entry at lines 31-39. Replace:

```javascript
  [ELEMENT_CATEGORIES.PROPOSITION]: Object.freeze({
    requiredFields: ['statement', 'grounding', 'collapse_test', 'inference_pattern'],
    optionalFields: ['scope'],
    sourceConstraint: CONSENT_SOURCES.DESIGNER,
    idShape: ELEMENT_CATEGORIES.PROPOSITION,
    renderSection: RENDER_SECTIONS.LEMMAS,
    closedEnumFields: { inference_pattern: INFERENCE_PATTERNS },
    authority: { add: [CONSENT_SOURCES.DESIGNER], revise: [CONSENT_SOURCES.DESIGNER], withdraw: [CONSENT_SOURCES.DESIGNER], ratify: [CONSENT_SOURCES.DESIGNER, CONSENT_SOURCES.DESIGN_PARTNER] },
  }),
```

with:

```javascript
  [ELEMENT_CATEGORIES.PROPOSITION]: Object.freeze({
    requiredFields: ['statement', 'grounding', 'collapse_test', 'inference_pattern', 'reasoning_chain'],
    optionalFields: ['scope', 'rejected_alternatives'],
    nonEmptyStringFields: ['reasoning_chain'],
    sourceConstraint: CONSENT_SOURCES.DESIGNER,
    idShape: ELEMENT_CATEGORIES.PROPOSITION,
    renderSection: RENDER_SECTIONS.LEMMAS,
    closedEnumFields: { inference_pattern: INFERENCE_PATTERNS },
    authority: { add: [CONSENT_SOURCES.DESIGNER], revise: [CONSENT_SOURCES.DESIGNER], withdraw: [CONSENT_SOURCES.DESIGNER], ratify: [CONSENT_SOURCES.DESIGNER, CONSENT_SOURCES.DESIGN_PARTNER] },
  }),
```

- [ ] **Step 5: Run tests to verify all green**

Run: `cd skills/design-proof-system/references/domain && npm test`
Expected: full suite PASS. The new `proposition-schema.test.js` tests pass; `schema.test.js` tests pass (including the repaired closed-enum test); `concern-schema.test.js` tests pass; `bridge-integration.test.js` tests pass.

- [ ] **Step 6: Commit**

```bash
git add skills/design-proof-system/references/domain/schema.js skills/design-proof-system/references/domain/__tests__/schema.test.js skills/design-proof-system/references/domain/__tests__/proposition-schema.test.js
git commit -m "feat(schema): extend PROPOSITION descriptor with reasoning_chain (required, non-empty) and rejected_alternatives (optional)"
```

---

## Task 3: Extend PROPOSITION translator + EDB_PREDICATES + boot validation

**Type:** code-producing
**Implements:** AC-3.1, AC-3.2, AC-3.3, AC-3.4
**Decision budget:** 2 (whether the rejected_alternatives spread guards on Array.isArray + length>0 or just Array.isArray; how to assert boot-validation success in AC-3.4)
**Must remain green:** all tests from Tasks 1 and 2, `translation.test.js` (all 6 tests after fixture repair), new translator tests in `proposition-schema.test.js`.

**Files:**
- Modify: `skills/design-proof-system/references/domain/translation.js` (extend PROPOSITION translator at lines 28-36; extend `EDB_PREDICATES` at lines 180-188)
- Modify: `skills/design-proof-system/references/domain/__tests__/translation.test.js` (repair line 15 PROPOSITION fixture)
- Modify: `skills/design-proof-system/references/domain/__tests__/proposition-schema.test.js` (add translator/EDB/boot-validation tests)

**Steps (TDD):**

- [ ] **Step 1: Write the failing tests in `proposition-schema.test.js`**

Add these imports at the top of the file (alongside the existing imports from Task 2):

```javascript
import { translate, getDeclaredEDBPredicates } from '../translation.js';
import { createDomainBridge } from '../domain-bridge.js';
import { createInMemorySubstrate } from './_fixtures/inMemorySubstrate.js';
```

Add these new describe blocks at the end of the file (after the AC-2.x block):

```javascript
describe('PROPOSITION — translator (AC-3.x)', () => {
  it('AC-3.1: emits reasoning_chain/2 baseFact with correct id and text', () => {
    const out = translate(ELEMENT_CATEGORIES.PROPOSITION, { ...validProposition }, 'prop_1', 1700000000);
    expect(out.baseFacts).toEqual(expect.arrayContaining([
      ['reasoning_chain', ['prop_1', 'IF X THEN Y']],
    ]));
  });

  it('AC-3.2: emits zero rejected_alternative facts when field is absent', () => {
    const out = translate(ELEMENT_CATEGORIES.PROPOSITION, { ...validProposition }, 'prop_1', 1700000000);
    const ra = out.baseFacts.filter(f => f[0] === 'rejected_alternative');
    expect(ra).toEqual([]);
  });

  it('AC-3.2: emits zero rejected_alternative facts when field is empty array', () => {
    const out = translate(ELEMENT_CATEGORIES.PROPOSITION, { ...validProposition, rejected_alternatives: [] }, 'prop_1', 1700000000);
    const ra = out.baseFacts.filter(f => f[0] === 'rejected_alternative');
    expect(ra).toEqual([]);
  });

  it('AC-3.2: emits one rejected_alternative fact per array element with correct positional values', () => {
    const alts = [
      { statement: 'A1', rejection_reason: 'R1' },
      { statement: 'A2', rejection_reason: 'R2' },
    ];
    const out = translate(ELEMENT_CATEGORIES.PROPOSITION, { ...validProposition, rejected_alternatives: alts }, 'prop_1', 1700000000);
    const ra = out.baseFacts.filter(f => f[0] === 'rejected_alternative');
    expect(ra).toEqual([
      ['rejected_alternative', ['prop_1', 'A1', 'R1']],
      ['rejected_alternative', ['prop_1', 'A2', 'R2']],
    ]);
  });

  it('AC-3.3: EDB_PREDICATES contains reasoning_chain and rejected_alternative', () => {
    const edb = getDeclaredEDBPredicates();
    expect(edb.has('reasoning_chain')).toBe(true);
    expect(edb.has('rejected_alternative')).toBe(true);
  });

  it('AC-3.4: createDomainBridge does not throw DomainBootError after EDB extension', () => {
    const s = createInMemorySubstrate();
    const idCounters = {};
    const idAllocator = { next: (shape) => { idCounters[shape] = (idCounters[shape] || 0) + 1; return `${shape}_${idCounters[shape]}`; } };
    const clock = { now: () => 1700000000 };
    const consentVerification = { verify: () => true };
    const persistenceRepo = { saveState: () => {} };
    expect(() => createDomainBridge({ engine: s, clock, idAllocator, consentVerification, persistenceRepo })).not.toThrow();
  });
});
```

- [ ] **Step 2: Repair the PROPOSITION fixture in `translation.test.js`**

Locate line 15. Change:

```javascript
      { statement: 's', grounding: 'g', collapse_test: 'ct', inference_pattern: 'grounds_imply_conclusion' },
```

to (adding `reasoning_chain`):

```javascript
      { statement: 's', grounding: 'g', collapse_test: 'ct', inference_pattern: 'grounds_imply_conclusion', reasoning_chain: 'IF X THEN Y' },
```

The existing assertion (`out.baseFacts.some(f => f[0] === 'proposition_decl')`) is unaffected; the repair just keeps the fixture self-consistent with the new schema.

- [ ] **Step 3: Run tests to verify the new tests fail**

Run: `cd skills/design-proof-system/references/domain && npm test -- --run translation proposition-schema`
Expected: `translation.test.js` PASSES (fixture repair). `proposition-schema.test.js` AC-3.x tests FAIL (translator does not emit `reasoning_chain` or `rejected_alternative` facts; `EDB_PREDICATES` does not contain them).

- [ ] **Step 4: Extend the PROPOSITION translator and EDB_PREDICATES in `translation.js`**

Locate the PROPOSITION translator at lines 28-36. Replace:

```javascript
  [ELEMENT_CATEGORIES.PROPOSITION]: (args, id, ts) => ({
    baseFacts: [
      ['proposition_decl', [id, args.statement, args.inference_pattern]],
      ['grounding', [id, args.grounding]],
      ['collapse_test', [id, args.collapse_test]],
    ],
    rules: [], // The approval-gated rule lives in RULE_TEMPLATES (Phase B); per-element instantiation happens in Phase C via instantiateTemplate.
    metaFacts: [['created_at', [id, ts]]],
  }),
```

with:

```javascript
  [ELEMENT_CATEGORIES.PROPOSITION]: (args, id, ts) => ({
    baseFacts: [
      ['proposition_decl', [id, args.statement, args.inference_pattern]],
      ['grounding', [id, args.grounding]],
      ['collapse_test', [id, args.collapse_test]],
      ['reasoning_chain', [id, args.reasoning_chain]],
      ...(Array.isArray(args.rejected_alternatives)
        ? args.rejected_alternatives.map(alt => ['rejected_alternative', [id, alt.statement, alt.rejection_reason]])
        : []),
    ],
    rules: [], // The approval-gated rule lives in RULE_TEMPLATES (Phase B); per-element instantiation happens in Phase C via instantiateTemplate.
    metaFacts: [['created_at', [id, ts]]],
  }),
```

Locate `EDB_PREDICATES` at lines 180-188. The current Set contains nine lines of predicate names; add `'reasoning_chain'` and `'rejected_alternative'` to the Set. The cleanest insertion is on the second line (which already contains `collapse_test`), so the related meta-fact predicates stay clustered:

Change:
```javascript
const EDB_PREDICATES = Object.freeze(new Set([
  'evidence', 'rule_decl', 'permission_decl', 'proposition_decl', 'grounding',
  'collapse_test', 'risk', 'resolution_decl', 'addresses', 'friction',
  'friction_disposition', 'definition_decl', 'definition_scope', 'definition_self',
  'concern', 'concern_status',
  'approved', 'two_yes',
  'closure_committed', 'closure_pending', 'phase', 'round', 'created_at',
  'withdrew', 'superseded',
]));
```

to:
```javascript
const EDB_PREDICATES = Object.freeze(new Set([
  'evidence', 'rule_decl', 'permission_decl', 'proposition_decl', 'grounding',
  'collapse_test', 'reasoning_chain', 'rejected_alternative',
  'risk', 'resolution_decl', 'addresses', 'friction',
  'friction_disposition', 'definition_decl', 'definition_scope', 'definition_self',
  'concern', 'concern_status',
  'approved', 'two_yes',
  'closure_committed', 'closure_pending', 'phase', 'round', 'created_at',
  'withdrew', 'superseded',
]));
```

- [ ] **Step 5: Run tests to verify all green**

Run: `cd skills/design-proof-system/references/domain && npm test`
Expected: full suite PASS. All Task 1-3 AC tests pass; no regressions in `translation.test.js`, `bridge-integration.test.js`, `concern-schema.test.js`, or any other test file.

- [ ] **Step 6: Commit**

```bash
git add skills/design-proof-system/references/domain/translation.js skills/design-proof-system/references/domain/__tests__/translation.test.js skills/design-proof-system/references/domain/__tests__/proposition-schema.test.js
git commit -m "feat(translation): emit reasoning_chain/2 and rejected_alternative/3 from PROPOSITION translator; extend EDB whitelist"
```

---

## Task 4: Extend render.js — three-line PROPOSITION block + PROJECTION_ARITIES

**Type:** code-producing
**Implements:** AC-4.2, AC-7.1, AC-7.2, AC-7.3
**Decision budget:** 2 (exact Markdown formatting for the three-line block; whether to emit `Collapse test:` and `Reasoning:` lines unconditionally or only when the EDB fact exists)
**Must remain green:** all tests from Tasks 1-3, `render.test.js` (existing 4 tests), new render tests added here.

**Files:**
- Modify: `skills/design-proof-system/references/domain/render.js` (extend `renderStructuredProof` around lines 27-31; extend `PROJECTION_ARITIES` around lines 131-139)
- Modify: `skills/design-proof-system/references/domain/__tests__/render.test.js` (add render extension tests)

**Steps (TDD):**

- [ ] **Step 1: Write the failing tests in `render.test.js`**

Add these tests at the end of the existing `describe('render', ...)` block (after the `renderElementDeep returns null` test):

```javascript
  it('AC-7.1: renderStructuredProof emits Collapse test / Reasoning / Rejected alternatives lines per proposition', () => {
    const s = createInMemorySubstrate();
    // Seed a derived proposition (the structured-proof view queries the derived predicate).
    s.facts.assertFact('proposition', ['prop_1', 'P1 statement']);
    s.facts.assertFact('collapse_test', ['prop_1', 'CT text']);
    s.facts.assertFact('reasoning_chain', ['prop_1', 'RC text']);
    s.facts.assertFact('rejected_alternative', ['prop_1', 'A1', 'R1']);
    const out = renderStructuredProof({}, { query: s.query, explain: s.explain });
    expect(out).toContain('P1 statement');
    expect(out).toContain('Collapse test: CT text');
    expect(out).toContain('Reasoning: RC text');
    expect(out).toContain('Rejected alternatives:');
    expect(out).toContain('A1');
    expect(out).toContain('R1');
  });

  it('AC-7.2: renderStructuredProof omits Rejected alternatives block when no alternatives exist', () => {
    const s = createInMemorySubstrate();
    s.facts.assertFact('proposition', ['prop_1', 'P1 statement']);
    s.facts.assertFact('collapse_test', ['prop_1', 'CT text']);
    s.facts.assertFact('reasoning_chain', ['prop_1', 'RC text']);
    // no rejected_alternative facts
    const out = renderStructuredProof({}, { query: s.query, explain: s.explain });
    expect(out).toContain('Reasoning: RC text');
    expect(out).not.toContain('Rejected alternatives:');
  });

  it('AC-7.3: renderStructuredProof omits a line gracefully when the corresponding fact is absent', () => {
    const s = createInMemorySubstrate();
    s.facts.assertFact('proposition', ['prop_1', 'P1 statement']);
    // no collapse_test, no reasoning_chain, no rejected_alternative
    const out = renderStructuredProof({}, { query: s.query, explain: s.explain });
    expect(out).toContain('P1 statement');
    expect(out).not.toContain('Collapse test:');
    expect(out).not.toContain('Reasoning:');
    expect(out).not.toContain('Rejected alternatives:');
  });

  it('AC-4.2: renderDatalogProjection includes reasoning_chain and rejected_alternative predicates', () => {
    const s = createInMemorySubstrate();
    s.facts.assertFact('reasoning_chain', ['prop_1', 'RC text']);
    s.facts.assertFact('rejected_alternative', ['prop_1', 'A1', 'R1']);
    s.facts.assertFact('rejected_alternative', ['prop_1', 'A2', 'R2']);
    const out = renderDatalogProjection({}, { query: s.query, explain: s.explain });
    // facts is an array of [predicate, args] tuples
    const reasoningFacts = out.facts.filter(f => f[0] === 'reasoning_chain');
    const rejectedFacts = out.facts.filter(f => f[0] === 'rejected_alternative');
    expect(reasoningFacts).toEqual([['reasoning_chain', ['prop_1', 'RC text']]]);
    expect(rejectedFacts).toEqual([
      ['rejected_alternative', ['prop_1', 'A1', 'R1']],
      ['rejected_alternative', ['prop_1', 'A2', 'R2']],
    ]);
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd skills/design-proof-system/references/domain && npm test -- --run render`
Expected: the four existing render tests PASS; the four new tests FAIL (`renderStructuredProof` does not query the new EDB predicates; `renderDatalogProjection` does not emit them because `PROJECTION_ARITIES` lacks them).

- [ ] **Step 3: Extend `renderStructuredProof` in `render.js`**

Locate the proposition rendering at lines 27-28:

```javascript
  const propositions = live(readPorts.query.query(['proposition', [{ var: 'I' }, { var: 'S' }]]));
  if (propositions.length) sections.push('## Lemmas (Propositions)\n' + propositions.map(b => `- ${b.I}: ${b.S}`).join('\n') + '\n');
```

Replace the single-line `propositions.map(...)` with a per-proposition block that queries the three meta-facts. Use this structure:

```javascript
  const propositions = live(readPorts.query.query(['proposition', [{ var: 'I' }, { var: 'S' }]]));
  if (propositions.length) {
    const propBlocks = propositions.map(b => {
      const lines = [`- ${b.I}: ${b.S}`];
      const ct = readPorts.query.query(['collapse_test', [b.I, { var: 'T' }]]);
      if (ct.length) lines.push(`  - Collapse test: ${ct[0].T}`);
      const rc = readPorts.query.query(['reasoning_chain', [b.I, { var: 'T' }]]);
      if (rc.length) lines.push(`  - Reasoning: ${rc[0].T}`);
      const ra = readPorts.query.query(['rejected_alternative', [b.I, { var: 'A' }, { var: 'R' }]]);
      if (ra.length) {
        lines.push('  - Rejected alternatives:');
        for (const row of ra) lines.push(`    - ${row.A} — ${row.R}`);
      }
      return lines.join('\n');
    });
    sections.push('## Lemmas (Propositions)\n' + propBlocks.join('\n') + '\n');
  }
```

- [ ] **Step 4: Extend `PROJECTION_ARITIES` in `render.js`**

Locate `PROJECTION_ARITIES` at lines 131-139. Add `reasoning_chain: 2` and `rejected_alternative: 3` to the object. The natural insertion is alongside `collapse_test: 2` to keep meta-fact arities clustered:

Change:
```javascript
  const PROJECTION_ARITIES = {
    evidence: 3, rule_decl: 2, permission_decl: 2, proposition_decl: 3,
    grounding: 2, collapse_test: 2, risk: 2, resolution_decl: 2, addresses: 2,
    friction: 4, friction_disposition: 2, definition_decl: 3, definition_scope: 2, definition_self: 2,
    concern: 3, concern_status: 2,
    approved: 3, two_yes: 2,
    closure_committed: 0, closure_pending: 0, round: 1,
    created_at: 2, withdrew: 1, superseded: 2,
  };
```

to:
```javascript
  const PROJECTION_ARITIES = {
    evidence: 3, rule_decl: 2, permission_decl: 2, proposition_decl: 3,
    grounding: 2, collapse_test: 2, reasoning_chain: 2, rejected_alternative: 3,
    risk: 2, resolution_decl: 2, addresses: 2,
    friction: 4, friction_disposition: 2, definition_decl: 3, definition_scope: 2, definition_self: 2,
    concern: 3, concern_status: 2,
    approved: 3, two_yes: 2,
    closure_committed: 0, closure_pending: 0, round: 1,
    created_at: 2, withdrew: 1, superseded: 2,
  };
```

- [ ] **Step 5: Run tests to verify all green**

Run: `cd skills/design-proof-system/references/domain && npm test`
Expected: full suite PASS. The four new render tests pass; the original four render tests pass; no regressions elsewhere.

- [ ] **Step 6: Commit**

```bash
git add skills/design-proof-system/references/domain/render.js skills/design-proof-system/references/domain/__tests__/render.test.js
git commit -m "feat(render): surface collapse_test, reasoning_chain, rejected_alternatives per proposition; extend PROJECTION_ARITIES"
```

---

## Task 5: Fix RATIFY argShape + invert CONCERN known-issue test + PROPOSITION ratify test

**Type:** code-producing
**Implements:** AC-6.1
**Decision budget:** 3 (whether `elementId` is the sole required-field in the ratify argShape; whether `source` is required or optional; how the CONCERN test at lines 266-279 should be reframed — invert assertion vs. delete vs. move to a "fixed-bug regression" suite)
**Must remain green:** all tests from Tasks 1-4, `concern-schema.test.js` (the inverted assertion at lines 266-279 plus all other tests), `bridge-integration.test.js` (the existing RATIFY verb-case at line 119 — still passes because the new argShape's `elementId` requirement is satisfied), new ratify test in `proposition-schema.test.js`.

**Files:**
- Modify: `skills/design-proof-system/references/domain/mutations.js` (add `argShape` to RATIFY's `OPERATION_SPECS` entry at lines 111-133)
- Modify: `skills/design-proof-system/references/domain/__tests__/concern-schema.test.js` (invert the assertion at lines 266-279 — `ratifyConcern` no longer throws)
- Modify: `skills/design-proof-system/references/domain/__tests__/proposition-schema.test.js` (add ratify test)

**Steps (TDD):**

- [ ] **Step 1: Verify the current ratify behavior (pre-fix)**

This task's first action is *observation*, not test-writing. Run a one-off check to confirm `ratifyConcern` currently throws `SHAPE_INVALID`:

Run: `cd skills/design-proof-system/references/domain && npm test -- --run concern-schema`
Expected: all 24 tests PASS, including the test at lines 266-279 which asserts `ratifyConcern({elementId: id})` throws `SHAPE_INVALID` with `field: 'label'`. This confirms the latent bug exists at the codebase's current state.

If this test does NOT pass (`ratifyConcern` works), the AC-6.1 fix is unnecessary — apply only the defensive PROPOSITION test (skipping mutation.js change and the CONCERN-test inversion) and document the unexpected current-state behavior in the commit message.

- [ ] **Step 2: Write the failing PROPOSITION ratify test in `proposition-schema.test.js`**

Add this describe block at the end of the file:

```javascript
describe('PROPOSITION — ratify path (AC-6.1)', () => {
  // Reuses the makeRealBridge helper pattern from concern-schema.test.js
  async function makeRealBridge() {
    const { Engine } = await import('../../engine/Engine.js');
    const idCounters = {};
    const idAllocator = { next: (shape) => { idCounters[shape] = (idCounters[shape] || 0) + 1; return `${shape}_${idCounters[shape]}`; } };
    const clock = { now: () => 1700000000 };
    const consentVerification = { verify: () => true };
    const persistenceRepo = { saveState: () => {} };
    return createDomainBridge({ engine: new Engine(), clock, idAllocator, consentVerification, persistenceRepo });
  }

  it('AC-6.1: ratifyElement({elementId, idShape:proposition}) does not throw SHAPE_INVALID', async () => {
    const bridge = await makeRealBridge();
    // Seed evidence/3 to satisfy RATIFY's weak precondition (mutations.js:113).
    bridge.addElement({ idShape: 'evidence', source: 'design', claim: 'baseline' }, { source: CONSENT_SOURCES.DESIGNER });
    // Add a PROPOSITION to ratify. (RATIFY-shape args, not full element-shape.)
    const { id } = bridge.addElement({
      idShape: 'proposition',
      statement: 'S', grounding: ['evidence_1'], collapse_test: 'T',
      inference_pattern: INFERENCE_PATTERNS.GROUNDS_IMPLY_CONCLUSION,
      reasoning_chain: 'IF X THEN Y',
    }, { source: CONSENT_SOURCES.DESIGNER });
    // The ratify call uses ratify-shape args ({elementId, idShape, source}) — not the
    // five-field element shape. With the AC-6.1 fix, this should NOT throw SHAPE_INVALID.
    expect(() => bridge.ratifyElement({ elementId: id, idShape: 'proposition', source: CONSENT_SOURCES.DESIGNER }, { source: CONSENT_SOURCES.DESIGNER })).not.toThrow();
  });
});
```

- [ ] **Step 3: Run tests to verify the new test fails**

Run: `cd skills/design-proof-system/references/domain && npm test -- --run proposition-schema`
Expected: the AC-6.1 test FAILS with `SHAPE_INVALID: missing required field "statement" for proposition` (or similar) — the pre-fix behavior throws on the first missing required field.

- [ ] **Step 4: Add `argShape` to RATIFY's OPERATION_SPECS entry in `mutations.js`**

Locate the RATIFY entry at lines 111-133. Insert an `argShape` field between `idShape` and `translate`, following the pattern established by WITHDRAW (lines 101-105) and MANAGE_FRICTION (lines 141-145):

Change:
```javascript
  [ACTION_LABELS.RATIFY]: {
    consentCategory: CONSENT_SOURCES.DESIGNER, // Authorities for ratify are looked up per element category via authority.lookupAuthority.
    preconditions: [{ predicate: 'evidence', arity: 3 }], // weak: just confirms an element exists pre-derivation.
    idShape: ELEMENT_CATEGORIES.EVIDENCE,
    // Writes two facts: `approved` (consumed by per-element rule templates for derivation,
    // existing semantics) and `two_yes` (purely observability — lets the two_yes_complete
    // derived predicate detect when both DESIGNER and DESIGN_PARTNER have ratified an
    // element, without altering existing single-source approval semantics).
    translate: (args, _, ts) => {
```

to (inserting the comment + argShape block before `translate`):
```javascript
  [ACTION_LABELS.RATIFY]: {
    consentCategory: CONSENT_SOURCES.DESIGNER, // Authorities for ratify are looked up per element category via authority.lookupAuthority.
    preconditions: [{ predicate: 'evidence', arity: 3 }], // weak: just confirms an element exists pre-derivation.
    idShape: ELEMENT_CATEGORIES.EVIDENCE,
    // RATIFY's args are operation-shaped ({elementId, source, idShape?}) — not element-shaped.
    // argShape overrides the default idShape→CATEGORY_REGISTRY lookup in runOperation so
    // verifyArgsShape checks only the fields RATIFY actually consumes. Without this, the
    // generic per-category requiredFields check throws SHAPE_INVALID on category-specific
    // fields the ratify caller has no reason to supply (e.g., 'label' for CONCERN, 'statement'
    // for PROPOSITION). Mirrors the WITHDRAW (line 101) and MANAGE_FRICTION (line 141) precedents.
    argShape: {
      label: 'ratify',
      requiredFields: ['elementId'],
      closedEnumFields: {},
    },
    // Writes two facts: `approved` (consumed by per-element rule templates for derivation,
    // existing semantics) and `two_yes` (purely observability — lets the two_yes_complete
    // derived predicate detect when both DESIGNER and DESIGN_PARTNER have ratified an
    // element, without altering existing single-source approval semantics).
    translate: (args, _, ts) => {
```

- [ ] **Step 5: Invert the CONCERN known-issue test in `concern-schema.test.js`**

Locate the test at lines 266-279. The current test asserts `ratifyConcern({elementId: id})` throws `SHAPE_INVALID`. With Step 4's fix, that throw no longer fires. Replace the test:

Old (lines 266-279):
```javascript
  it('AC-3.1 surface coverage: ratifyConcern is exported (latent SHAPE_INVALID — see Known Issues)', async () => {
    const bridge = await makeRealBridge();
    expect(typeof bridge.ratifyConcern).toBe('function');
    // Documenting the latent throw: calling ratifyConcern with only {elementId}
    // throws SHAPE_INVALID because verifyArgsShape checks Concern's requiredFields=['label'].
    // This mirrors the pre-existing ratifyDefinition brokenness (domain-bridge.js).
    // Resolution of this latent issue is out of scope for this sprint.
    let captured = null;
    const { id } = bridge.addConcern({ label: 'C1' }, { source: CONSENT_SOURCES.DESIGNER });
    try { bridge.ratifyConcern({ elementId: id }, { source: CONSENT_SOURCES.DESIGNER }); } catch (e) { captured = e; }
    expect(captured).not.toBeNull();
    expect(captured.code).toBe('SHAPE_INVALID');
    expect(captured.field).toBe('label');
  });
```

New (cross-impact regression — confirms the AC-6.1 fix closed the latent SHAPE_INVALID bug on CONCERN as well):
```javascript
  it('AC-6.1 cross-impact: ratifyConcern with only {elementId} no longer throws SHAPE_INVALID (fixed by sprint-02-bug-fix-01)', async () => {
    const bridge = await makeRealBridge();
    expect(typeof bridge.ratifyConcern).toBe('function');
    // Seed evidence/3 to satisfy RATIFY's weak precondition (mutations.js).
    bridge.addElement({ idShape: 'evidence', source: 'design', claim: 'baseline' }, { source: CONSENT_SOURCES.DESIGNER });
    const { id } = bridge.addConcern({ label: 'C1' }, { source: CONSENT_SOURCES.DESIGNER });
    // Previously threw SHAPE_INVALID with field 'label' because verifyArgsShape checked
    // Concern's requiredFields against ratify-shape args. The argShape on RATIFY's
    // OPERATION_SPECS entry (added in sprint-02-bug-fix-01) makes the call shape-correct.
    expect(() => bridge.ratifyConcern({ elementId: id }, { source: CONSENT_SOURCES.DESIGNER })).not.toThrow();
  });
```

- [ ] **Step 6: Run tests to verify all green**

Run: `cd skills/design-proof-system/references/domain && npm test`
Expected: full suite PASS. The new PROPOSITION ratify test passes; the inverted CONCERN test passes; `bridge-integration.test.js` still passes (its RATIFY verb-case at line 119 supplies `elementId` and `source`, both still admissible under the new argShape). No other regressions.

- [ ] **Step 7: Commit**

```bash
git add skills/design-proof-system/references/domain/mutations.js skills/design-proof-system/references/domain/__tests__/concern-schema.test.js skills/design-proof-system/references/domain/__tests__/proposition-schema.test.js
git commit -m "fix(mutations): add argShape to RATIFY OPERATION_SPECS — closes cross-category SHAPE_INVALID on ratify-shape args"
```

---

## Task 6: Bridge round-trip + revise integration tests + validPredicates flow

**Type:** code-producing
**Implements:** AC-4.1, AC-5.1, AC-5.2
**Decision budget:** 1 (test layout — folded into proposition-schema.test.js as a new describe block, vs. a separate proposition-bridge.test.js file)
**Must remain green:** all tests from Tasks 1-5, no source-file modifications in this task — new tests verify existing behavior.

**Files:**
- Modify: `skills/design-proof-system/references/domain/__tests__/proposition-schema.test.js` (add bridge integration describe block)

**Steps (TDD):**

- [ ] **Step 1: Write the bridge integration tests in `proposition-schema.test.js`**

Add this describe block at the end of the file:

```javascript
describe('PROPOSITION — bridge integration (AC-4.x, AC-5.x)', () => {
  // Reuses the makeRealBridge helper pattern from the AC-6.1 describe block above.
  async function makeRealBridge() {
    const { Engine } = await import('../../engine/Engine.js');
    const idCounters = {};
    const idAllocator = { next: (shape) => { idCounters[shape] = (idCounters[shape] || 0) + 1; return `${shape}_${idCounters[shape]}`; } };
    const clock = { now: () => 1700000000 };
    const consentVerification = { verify: () => true };
    const persistenceRepo = { saveState: () => {} };
    return createDomainBridge({ engine: new Engine(), clock, idAllocator, consentVerification, persistenceRepo });
  }

  it('AC-4.1: validPredicates admits reasoning_chain and rejected_alternative via getDeclaredEDBPredicates', () => {
    const edb = getDeclaredEDBPredicates();
    expect(edb.has('reasoning_chain')).toBe(true);
    expect(edb.has('rejected_alternative')).toBe(true);
    // The bridge's hardcoded rule-head additions (domain-bridge.js:50 and :197) do NOT need
    // these names — they flow in via getDeclaredEDBPredicates() automatically. Verified by
    // the createDomainBridge no-throw assertion in AC-3.4.
  });

  it('AC-5.1: bridge round-trip — addElement then query returns reasoning_chain and rejected_alternative facts', async () => {
    const bridge = await makeRealBridge();
    bridge.addElement({ idShape: 'evidence', source: 'design', claim: 'baseline' }, { source: CONSENT_SOURCES.DESIGNER });
    const { id } = bridge.addElement({
      idShape: 'proposition',
      statement: 'S', grounding: ['evidence_1'], collapse_test: 'T',
      inference_pattern: INFERENCE_PATTERNS.GROUNDS_IMPLY_CONCLUSION,
      reasoning_chain: 'IF X THEN Y',
      rejected_alternatives: [
        { statement: 'A1', rejection_reason: 'R1' },
        { statement: 'A2', rejection_reason: 'R2' },
      ],
    }, { source: CONSENT_SOURCES.DESIGNER });
    const rc = bridge.queryProof({ pattern: ['reasoning_chain', [id, { var: 'T' }]] });
    expect(rc.length).toBe(1);
    expect(rc[0].T).toBe('IF X THEN Y');
    const ra = bridge.queryProof({ pattern: ['rejected_alternative', [id, { var: 'S' }, { var: 'R' }]] });
    expect(ra.length).toBe(2);
    const altPairs = ra.map(r => [r.S, r.R]).sort();
    expect(altPairs).toEqual([['A1', 'R1'], ['A2', 'R2']]);
  });

  it('AC-5.2: revise creates new element id; new facts under new id; old facts persist under prior id; superseded link present', async () => {
    const bridge = await makeRealBridge();
    bridge.addElement({ idShape: 'evidence', source: 'design', claim: 'baseline' }, { source: CONSENT_SOURCES.DESIGNER });
    const { id: oldId } = bridge.addElement({
      idShape: 'proposition',
      statement: 'S', grounding: ['evidence_1'], collapse_test: 'T',
      inference_pattern: INFERENCE_PATTERNS.GROUNDS_IMPLY_CONCLUSION,
      reasoning_chain: 'OLD',
      rejected_alternatives: [{ statement: 'OLD_A', rejection_reason: 'OLD_R' }],
    }, { source: CONSENT_SOURCES.DESIGNER });
    const { id: newId } = bridge.reviseElement({
      idShape: 'proposition',
      supersedes: oldId,
      statement: 'S', grounding: ['evidence_1'], collapse_test: 'T',
      inference_pattern: INFERENCE_PATTERNS.GROUNDS_IMPLY_CONCLUSION,
      reasoning_chain: 'NEW',
      rejected_alternatives: [{ statement: 'NEW_A', rejection_reason: 'NEW_R' }],
    }, { source: CONSENT_SOURCES.DESIGNER });

    expect(newId).not.toBe(oldId);

    // New id has new facts
    const newRC = bridge.queryProof({ pattern: ['reasoning_chain', [newId, { var: 'T' }]] });
    expect(newRC).toEqual([{ T: 'NEW' }]);
    const newRA = bridge.queryProof({ pattern: ['rejected_alternative', [newId, { var: 'S' }, { var: 'R' }]] });
    expect(newRA).toEqual([{ S: 'NEW_A', R: 'NEW_R' }]);

    // Old id retains old facts
    const oldRC = bridge.queryProof({ pattern: ['reasoning_chain', [oldId, { var: 'T' }]] });
    expect(oldRC).toEqual([{ T: 'OLD' }]);
    const oldRA = bridge.queryProof({ pattern: ['rejected_alternative', [oldId, { var: 'S' }, { var: 'R' }]] });
    expect(oldRA).toEqual([{ S: 'OLD_A', R: 'OLD_R' }]);

    // Supersession link exists
    const sup = bridge.queryProof({ pattern: ['superseded', [newId, oldId]] });
    expect(sup.length).toBeGreaterThan(0);
  });
});
```

Note: the `makeRealBridge` helper is duplicated between Task 5's and Task 6's describe blocks for self-containment. Hoisting to module scope is a cosmetic refactor and is intentionally not performed in this task — keeps the per-task diff narrow.

- [ ] **Step 2: Run tests to verify all green**

Run: `cd skills/design-proof-system/references/domain && npm test -- --run proposition-schema`
Expected: all PROPOSITION tests PASS. AC-4.1, AC-5.1, AC-5.2 verified end-to-end against the real Engine.

- [ ] **Step 3: Commit**

```bash
git add skills/design-proof-system/references/domain/__tests__/proposition-schema.test.js
git commit -m "test(proposition): bridge round-trip and revise lifecycle integration tests"
```

---

## Task 7: Fixture sweep + bridge-integration comment update + scope verification

**Type:** code-producing
**Implements:** AC-8.1, AC-9.1, AC-9.2
**Decision budget:** 2 (whether the comment update at bridge-integration.test.js:103 needs surrounding context update; how to verify scope discipline mechanically)
**Must remain green:** all tests from Tasks 1-6, `bridge-integration.test.js` (comment-only update has no runtime effect).

**Files:**
- Modify: `skills/design-proof-system/references/domain/__tests__/bridge-integration.test.js` (update PROPOSITION-required-fields comment at line 103)

**Steps:**

This task is mostly verification — the fixture-repair work landed atomically in Tasks 2 and 3. This task closes the cross-cutting ACs.

- [ ] **Step 1: Verify the fixture sweep was complete**

Run a grep across the test suite for stale four-field PROPOSITION fixtures:

```bash
grep -rn "statement.*grounding.*collapse_test.*inference_pattern" skills/design-proof-system/references/domain/__tests__/ | grep -v "reasoning_chain"
```

Expected output: zero lines, OR a small number of lines all of which are:
- comments (e.g., `bridge-integration.test.js:103`), OR
- multi-line object literals where `reasoning_chain` lives on a separate line (false-positives from the regex's single-line scope)

For each non-comment hit, manually inspect to confirm whether the object literal is a real fixture that needs `reasoning_chain` added or a false positive. If real fixtures remain, add `reasoning_chain: 'IF X THEN Y'` and re-run `npm test` to confirm.

- [ ] **Step 2: Update the PROPOSITION-required-fields comment in `bridge-integration.test.js`**

Locate line 103:

```javascript
//   PROPOSITION → ['statement','grounding','collapse_test','inference_pattern']
```

Replace with:

```javascript
//   PROPOSITION → ['statement','grounding','collapse_test','inference_pattern','reasoning_chain']
```

The verb-cases array at lines 114-122 does not construct a PROPOSITION add (it uses EVIDENCE for the `add` and `revise` verbs), so no runtime fixture in this file needs `reasoning_chain` — only the documentation comment.

- [ ] **Step 3: Verify scope discipline — only files under `references/domain/` and `__tests__/` were modified**

Run a git diff scope check:

```bash
git diff --name-only main...HEAD -- skills/design-proof-system/ | sort -u
```

Expected output: every listed path matches one of:
- `skills/design-proof-system/references/domain/schema.js`
- `skills/design-proof-system/references/domain/translation.js`
- `skills/design-proof-system/references/domain/render.js`
- `skills/design-proof-system/references/domain/mutations.js`
- `skills/design-proof-system/references/domain/__tests__/schema.test.js`
- `skills/design-proof-system/references/domain/__tests__/translation.test.js`
- `skills/design-proof-system/references/domain/__tests__/render.test.js`
- `skills/design-proof-system/references/domain/__tests__/concern-schema.test.js`
- `skills/design-proof-system/references/domain/__tests__/bridge-integration.test.js`
- `skills/design-proof-system/references/domain/__tests__/proposition-schema.test.js` (new)

No engine file, no other element-category test file (e.g., no resolution-schema.test.js touch), no cascade document, no MCP file. If any unexpected path appears, investigate before commit.

- [ ] **Step 4: Run the full test suite for a final clean check**

Run: `cd skills/design-proof-system/references/domain && npm test`
Expected: full suite PASS. Aggregate test count is `pre-sprint-count + N_new` where `N_new ≥ 18` (the eighteen new tests across Tasks 1, 2, 3, 4, 5, 6).

- [ ] **Step 5: Commit**

```bash
git add skills/design-proof-system/references/domain/__tests__/bridge-integration.test.js
git commit -m "docs(test): update bridge-integration PROPOSITION required-fields comment to reflect new five-field requirement"
```

---

## Plan Summary

Seven tasks; one commit per task; each task leaves the suite green. The schema mechanism (Task 1) precedes the PROPOSITION schema data (Task 2) so the new directive exists when the data first uses it. The translator extension (Task 3) follows so the EDB facts the render layer needs (Task 4) exist when render starts querying them. The ratify-path fix (Task 5) is a cross-impact change that flips one CONCERN test in the same commit so the suite never goes red. Bridge integration tests (Task 6) validate the full end-to-end behavior. The final task (Task 7) sweeps for any straggler fixtures and verifies scope discipline.

**Implementer skills needed:** familiarity with JavaScript ESM, Vitest's `describe`/`it`/`expect` API, basic Datalog semantics (the Engine treats new predicates as ground atoms — no rule writing needed), and the test-first discipline (`@execute-test`). The Engine's `assertFact(predicate, args)` API treats `args` as a positional array — see `_fixtures/inMemorySubstrate.js` for the test substrate's surface.

**Reference skills:** `@execute-test` (test-first per file change), `@execute-prove` (run tests before claiming green), `@execute-verify-complete` (final clean-tree gate).

<!-- created-at: 2026-05-17T02:10:03Z -->
<!-- produced-by plan-build@v0004 -->
