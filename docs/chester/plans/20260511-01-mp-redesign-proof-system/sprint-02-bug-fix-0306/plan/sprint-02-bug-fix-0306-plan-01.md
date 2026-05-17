# Plan: Consolidated Cascade-Spec Drift Closure (Bundles 03-06)

**Sprint:** sprint-02-bug-fix-0306 (under master 20260511-01-mp-redesign-proof-system)
**Spec:** docs/chester/working/20260511-01-mp-redesign-proof-system/sprint-02-bug-fix-0306/spec/sprint-02-bug-fix-0306-spec-02.md
**Execution mode:** subagent

> **For agentic workers:** Use execute-write to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The `Execution mode` field selects which execute-write section runs — Section 2 (subagent-driven) here.

## Goal

Close 16 cascade-spec probe failures by extending bug-fix-02's declarative-directive machinery to five more category descriptors (EVIDENCE, PROPOSITION, RESOLUTION, FRICTION, DEFINITION), plus two cascade-document section edits (§3.4 and §3.5), without restructuring the existing inline machinery.

## Architecture

Hybrid: maximal Axis 1 (cascade §3.4 and §3.5 both edited; render adopts D5 inference_pattern verbatim) + inline Axis 2 (no extraction of `_CATEGORY_PROBES_SCHEMA` or `_CATEGORY_PROBES`; bug-fix-02 inline pattern continues; DEF-7 stays deferred for its own design pass). New predicates (`proposition_grounding/2`, `resolution_anchor/2`, `resolution_grounding/2`) follow the per-element-fact spreading pattern established by bug-fix-02's `risk_basis/2`. Legacy `grounding/2` and `addresses/2` predicates are retired (no dual-emission — they had no legitimate callers since the array-arg form was structurally broken). FRICTION goes from arity 4 to arity 5 (`description` field drops; `anchor_a`/`anchor_b` added).

## Tech Stack

- JavaScript (Node.js, ESM modules)
- Vitest (test runner) — `npm test` runs the full suite
- Existing test convention in `skills/design-proof-system/references/domain/__tests__/`: real-import only (no mocks), `createDomainBridge` + real `Engine`, shared `makeRealBridge` factory pattern as established in `permission-schema.test.js` and `risk-schema.test.js`

## Test Scaffolding Template — MANDATORY for all new per-category test files

**Every new test file (`evidence-schema.test.js`, `resolution-schema.test.js`, `friction-schema.test.js`, `definition-schema.test.js`) MUST start with this exact preamble** (copy from `permission-schema.test.js:1-28` verbatim). The plan's per-task test code blocks below show only the `describe(...)` blocks; the preamble shown here is required prepended content.

```javascript
import { describe, it, expect } from 'vitest';
import * as tags from '../tags.js';
import { ELEMENT_CATEGORIES, CONSENT_SOURCES } from '../tags.js';
import { CATEGORY_REGISTRY } from '../schema.js';
import { translate } from '../translation.js';
import { validateCategoryRegistry } from '../boot-validators.js';
import { createDomainBridge } from '../domain-bridge.js';

async function makeRealBridge() {
  const { Engine } = await import('../../engine/Engine.js');
  const counters = new Map();
  const idAllocator = {
    next: (shape) => {
      const n = (counters.get(shape) ?? 0) + 1;
      counters.set(shape, n);
      return `${shape}_${n}`;
    },
  };
  const clock = { now: () => 1700000000 };
  const consentVerification = { verify: () => true };
  const persistenceRepo = { saveState: () => {} };
  return createDomainBridge({ engine: new Engine(), clock, idAllocator, consentVerification, persistenceRepo });
}

const designerConsent = Object.freeze({ source: CONSENT_SOURCES.DESIGNER });
```

**Mandatory consequences (all per-task test code blocks below adhere to these — supersedes any conflicting simplified shape shown in the task's code samples):**

- `makeRealBridge` returns a `Promise<Bridge>`. Every `it(...)` callback that calls it MUST be `async`, and MUST `await` the result: `const bridge = await makeRealBridge();`. Do NOT use the simplified `function makeRealBridge() { return createDomainBridge({ engine }); }` shape — that omits required bridge ports (idAllocator, clock, consentVerification, persistenceRepo).
- Engine is imported via async dynamic import `await import('../../engine/Engine.js')` — there is no `engine/index.js` barrel.
- Substrate queries use `bridge.queryProof({ pattern: [...] })`, not `bridge.queryPort.query(...)`. (The plan's test code blocks already use the correct form.)
- The simplified `function makeRealBridge() { const engine = new Engine(); return createDomainBridge({ engine }); }` stub that appears in some task code blocks below is a PLACEHOLDER — the implementer MUST replace it with the async pattern above when writing the actual file.

---

## Task 1: EVIDENCE field rename + H-4 source enum + fixture migration

**Type:** code-producing
**Implements:** AC-3.1, AC-3.2, AC-3.3, AC-4.1, AC-4.2, AC-4.3
**Decision budget:** 3 (which value to substitute for invalid `source: 'design'` fixtures across 2 files; whether `sourceConstraint` metadata stays unchanged given boot-validators interaction; how many fixture files need touched)
**Must remain green:** `evidence-schema.test.js` (new); `permission-schema.test.js`, `risk-schema.test.js`, `proposition-schema.test.js`, `concern-schema.test.js`, `mutations.test.js`, `translation.test.js`, `bridge-integration.test.js` (must continue passing post-migration)

**Files:**
- Modify: `skills/design-proof-system/references/domain/tags.js` — add `EVIDENCE_SOURCE_ENUM` constant after `CONSENT_SOURCES` block
- Modify: `skills/design-proof-system/references/domain/schema.js:44-55` — EVIDENCE descriptor: `requiredFields: ['source', 'statement']`, `closedEnumFields: { source: EVIDENCE_SOURCE_ENUM }`; import `EVIDENCE_SOURCE_ENUM`; keep `sourceConstraint` unchanged
- Modify: `skills/design-proof-system/references/domain/translation.js:13-17` — EVIDENCE translator: `[id, args.source, args.statement]` (was `args.claim`)
- Create: `skills/design-proof-system/references/domain/__tests__/evidence-schema.test.js`
- Modify: `skills/design-proof-system/references/domain/__tests__/proposition-schema.test.js` lines 144, 170, 194 — `source: 'design', claim: ...` → `source: 'codebase', statement: ...`
- Modify: `skills/design-proof-system/references/domain/__tests__/concern-schema.test.js` lines 241, 257, 269 — same substitution; line 249/259/261 use `claim: '_'` on ratifyElement consent — needs review (different arg shape; ratify args don't use the EVIDENCE descriptor's required fields)
- Modify: `skills/design-proof-system/references/domain/__tests__/risk-schema.test.js` lines 74, 111, 130, 134, 154 (and any others) — `claim:` → `statement:`
- Modify: `skills/design-proof-system/references/domain/__tests__/mutations.test.js` lines 30, 37 — `claim: 'x'` → `statement: 'x'`
- Modify: `skills/design-proof-system/references/domain/__tests__/translation.test.js` line 7 (and any others) — `claim: 'x'` → `statement: 'x'`
- Modify: `skills/design-proof-system/references/domain/__tests__/bridge-integration.test.js` — comprehensive migration of all EVIDENCE-related field references (M5 mitigation — pre-enumerated to prevent missed migrations):
  - **Line 42** — `bridge.addElement({ idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'design', claim: 'baseline' }, consent)` → change `claim:` to `statement:` AND change `source: 'design'` to `source: 'codebase'` (a valid value)
  - **Line 47** — `addresses: risk.id` on the RESOLUTION call — defer to Task 3 migration (this line uses the legacy `addresses` field which is retired in Task 3, not in this task). Task 3's concern-schema fixture migration applies the same pattern here
  - **Line 105** — `evidenceFill` helper definition: `{ source: 'codebase', claim: 'x' }` → `{ source: 'codebase', statement: 'x' }` (source value already valid; only rename `claim:` → `statement:`)
  - **Line 122** — uses `...evidenceFill` (no inline literal needed once helper updates)
  - **Any other lines surfaced by grep:** `grep -n "claim:\|source: 'design'" skills/design-proof-system/references/domain/__tests__/bridge-integration.test.js` — apply same migration to each.

**Steps (TDD):**

- [ ] **Step 1: Write the failing test (new file: evidence-schema.test.js)**

```javascript
import { describe, it, expect } from 'vitest';
import { createDomainBridge } from '../bridge.js';
import { Engine } from '../../engine/index.js';
import { CONSENT_SOURCES, ELEMENT_CATEGORIES } from '../tags.js';
import { CATEGORY_REGISTRY } from '../schema.js';

function makeRealBridge() {
  // Replicate the pattern from permission-schema.test.js:14-28
  const engine = new Engine();
  return createDomainBridge({ engine });
}

describe('EVIDENCE — descriptor shape', () => {
  it('requiredFields contains source and statement (not claim)', () => {
    const desc = CATEGORY_REGISTRY[ELEMENT_CATEGORIES.EVIDENCE];
    expect(desc.requiredFields).toEqual(expect.arrayContaining(['source', 'statement']));
    expect(desc.requiredFields).not.toContain('claim');
  });
  it('closedEnumFields.source contains the four spec-allowed values and excludes designer', () => {
    const desc = CATEGORY_REGISTRY[ELEMENT_CATEGORIES.EVIDENCE];
    const values = Object.values(desc.closedEnumFields.source);
    expect(new Set(values)).toEqual(new Set(['industry', 'codebase', 'prior-record', 'agent-derivation']));
    expect(values).not.toContain('designer');
  });
});

describe('EVIDENCE — positive submissions', () => {
  it.each(['industry', 'codebase', 'prior-record', 'agent-derivation'])('accepts source=%s', (src) => {
    const bridge = makeRealBridge();
    const { id } = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: src, statement: 'e text' },
      { source: CONSENT_SOURCES.DESIGNER }
    );
    const rows = bridge.queryProof({ pattern: ['evidence', [id, src, { var: 'S' }]] });
    expect(rows).toHaveLength(1);
    expect(rows[0].S).toBe('e text');
  });
});

describe('EVIDENCE — H-4 source-authority inversion', () => {
  it('rejects source=designer with SHAPE_INVALID', () => {
    const bridge = makeRealBridge();
    expect(() => bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'designer', statement: 'e text' },
      { source: CONSENT_SOURCES.DESIGNER }
    )).toThrow(expect.objectContaining({ code: 'SHAPE_INVALID', field: 'source' }));
  });
});
```

- [ ] **Step 2: Run the new test to verify it fails**

```
npm test -- evidence-schema --run
```

Expected: descriptor tests fail (closedEnumFields.source not defined; requiredFields contains `claim` not `statement`). Positive tests fail because translator doesn't know `statement`. Negative test may currently PASS-as-false-negative (no source-enum gate; designer succeeds wrongly).

- [ ] **Step 3: Update tags.js to add EVIDENCE_SOURCE_ENUM**

```javascript
// After CONSENT_SOURCES (line 18):
export const EVIDENCE_SOURCE_ENUM = Object.freeze({
  INDUSTRY: 'industry',
  CODEBASE: 'codebase',
  PRIOR_RECORD: 'prior-record',
  AGENT_DERIVATION: 'agent-derivation',
});
```

- [ ] **Step 4: Update schema.js EVIDENCE descriptor**

Add `EVIDENCE_SOURCE_ENUM` to the import on line 2. Update descriptor (line 44-55):

```javascript
[ELEMENT_CATEGORIES.EVIDENCE]: Object.freeze({
  requiredFields: ['source', 'statement'],          // was ['source', 'claim']
  optionalFields: ['url', 'citation'],
  nonEmptyStringFields: [],
  nonEmptyArrayFields: [],
  sourceConstraint: CONSENT_SOURCES.DESIGNER,        // UNCHANGED
  idShape: ELEMENT_CATEGORIES.EVIDENCE,
  renderSection: RENDER_SECTIONS.GIVENS,
  closedEnumFields: { source: EVIDENCE_SOURCE_ENUM }, // NEW — was {}
  referenceFields: {},
  authority: { add: [CONSENT_SOURCES.DESIGNER], revise: [CONSENT_SOURCES.DESIGNER], withdraw: [CONSENT_SOURCES.DESIGNER], ratify: [CONSENT_SOURCES.DESIGNER] },
}),
```

- [ ] **Step 5: Update translation.js EVIDENCE translator**

Line 13-17 → change `args.claim` to `args.statement`:

```javascript
[ELEMENT_CATEGORIES.EVIDENCE]: (args, id, ts) => ({
  baseFacts: [['evidence', [id, args.source, args.statement]]],
  rules: [],
  metaFacts: [['created_at', [id, ts]]],
}),
```

- [ ] **Step 6: Migrate fixtures across all impacted test files**

Use grep to locate every occurrence:

```bash
grep -rn "claim:" skills/design-proof-system/references/domain/__tests__/
grep -rn "source: 'design'" skills/design-proof-system/references/domain/__tests__/
```

Apply replacements:
- `claim: 'X'` → `statement: 'X'` for EVIDENCE arg-shape literals
- `source: 'design'` → `source: 'codebase'` (a valid value) for EVIDENCE submissions
- Leave `source: CONSENT_SOURCES.DESIGNER` (consent-source on second arg of addElement) UNCHANGED — that's the consent path, not the EVIDENCE content `source` field
- Leave `ratifyElement({ elementId, source: 'designer', claim: '_' }, ...)` cases — `ratifyElement` takes a different arg shape; `claim: '_'` is just an arbitrary placeholder. Inspect each ratifyElement call and only update if it actually constructs an EVIDENCE element

For `bridge-integration.test.js`: also check whether there's an `evidenceFill` helper at the top that needs updating (line 122 references `...evidenceFill` so the helper likely defines `claim:`).

- [ ] **Step 7: Run the new evidence test plus all impacted files**

```
npm test -- evidence-schema --run
npm test -- proposition-schema concern-schema risk-schema mutations translation bridge-integration --run
```

Expected: all pass.

- [ ] **Step 8: Run the full test suite to confirm no other regressions**

```
npm test --run
```

Expected: 305 prior tests + new evidence-schema tests all pass.

- [ ] **Step 9: Commit**

```bash
git add skills/design-proof-system/references/domain/tags.js \
        skills/design-proof-system/references/domain/schema.js \
        skills/design-proof-system/references/domain/translation.js \
        skills/design-proof-system/references/domain/__tests__/
git commit -m "fix(domain): EVIDENCE rename claim→statement, add H-4 source enum, migrate fixtures"
```

---

## Task 2: PROPOSITION grounding spread + inference_pattern enum + render + friction-policy rule update

**Type:** code-producing
**Implements:** AC-1.1, AC-1.2, AC-1.3, AC-1.4, AC-1.5, AC-2.1, AC-2.2, AC-2.3, AC-9.1
**Decision budget:** 3 (legacy `grounding/2` predicate retirement vs dual-emission; render query path for `inference_pattern` via `proposition_decl/3` third arg; whether to extend existing proposition-schema.test.js or create new test file)
**Must remain green:** `proposition-schema.test.js` (extended); `permission-schema.test.js`, `risk-schema.test.js`, `evidence-schema.test.js` (from Task 1), `render.test.js`, `bridge-integration.test.js`, any test exercising `ungrounded_proposition` derivation or `closure_permitted` via PROPOSITION (search: `grep -rn "ungrounded_proposition\|effective_grounding" skills/design-proof-system/references/domain/__tests__/`)

**Files:**
- Modify: `skills/design-proof-system/references/domain/tags.js:20-25` — replace INFERENCE_PATTERNS values
- Modify: `skills/design-proof-system/references/domain/schema.js:80-91` — PROPOSITION descriptor: add `nonEmptyArrayFields: ['grounding']`, `referenceFields: { grounding: '*' }`
- Modify: `skills/design-proof-system/references/domain/translation.js:34-46` — PROPOSITION translator: replace `['grounding', [id, args.grounding]]` with spread
- Modify: `skills/design-proof-system/references/domain/translation.js:193-202` — `EDB_PREDICATES`: remove `'grounding'`, add `'proposition_grounding'`
- **Modify: `skills/design-proof-system/references/domain/friction-policy.js:8-11` — `effective_grounding_rule` body atom: replace `['grounding', ['P', 'E']]` with `['proposition_grounding', ['P', 'E']]`** (M1 mitigation — without this, every PROPOSITION becomes `ungrounded` and closure gate breaks silently)
- Modify: `skills/design-proof-system/references/domain/render.js:55-71` — `renderStructuredProof` PROPOSITION block: add `Inference pattern:` + `Grounding:` sub-lines
- Modify: `skills/design-proof-system/references/domain/render.js:174-185` — `PROJECTION_ARITIES`: remove `grounding: 2`, add `proposition_grounding: 2`
- Modify: `skills/design-proof-system/references/domain/__tests__/proposition-schema.test.js` — extend with D2 + D5 coverage

**Steps (TDD):**

- [ ] **Step 1: Write the failing tests (append to proposition-schema.test.js)**

```javascript
describe('PROPOSITION — grounding spread (D2)', () => {
  it('descriptor declares nonEmptyArrayFields and referenceFields for grounding', () => {
    const desc = CATEGORY_REGISTRY[ELEMENT_CATEGORIES.PROPOSITION];
    expect(desc.nonEmptyArrayFields).toContain('grounding');
    expect(desc.referenceFields.grounding).toBe('*');
  });

  it('translator spreads grounding[] into per-element proposition_grounding/2 facts', () => {
    const bridge = makeRealBridge();
    const evA = bridge.addElement({ idShape: 'evidence', source: 'industry', statement: 'A' }, { source: CONSENT_SOURCES.DESIGNER });
    const evB = bridge.addElement({ idShape: 'evidence', source: 'codebase', statement: 'B' }, { source: CONSENT_SOURCES.DESIGNER });
    const { id: pId } = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.PROPOSITION,
        statement: 'p1',
        grounding: [evA.id, evB.id],
        inference_pattern: 'grounds_imply_conclusion',
        collapse_test: 'ct',
        reasoning_chain: 'rc' },
      { source: CONSENT_SOURCES.DESIGNER }
    );
    const rows = bridge.queryProof({ pattern: ['proposition_grounding', [pId, { var: 'E' }]] });
    expect(rows).toHaveLength(2);
    expect(new Set(rows.map(r => r.E))).toEqual(new Set([evA.id, evB.id]));
  });

  it('engine no longer rejects multi-evidence grounding (no TYPE_ERROR)', () => {
    const bridge = makeRealBridge();
    const evA = bridge.addElement({ idShape: 'evidence', source: 'industry', statement: 'A' }, { source: CONSENT_SOURCES.DESIGNER });
    expect(() => bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.PROPOSITION,
        statement: 'p1', grounding: [evA.id], inference_pattern: 'grounds_imply_conclusion',
        collapse_test: 'ct', reasoning_chain: 'rc' },
      { source: CONSENT_SOURCES.DESIGNER }
    )).not.toThrow();
  });

  it('throws INVALID_REFERENCE for non-existent grounding ids', () => {
    const bridge = makeRealBridge();
    expect(() => bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.PROPOSITION,
        statement: 'p1', grounding: ['nonexistent_id'], inference_pattern: 'grounds_imply_conclusion',
        collapse_test: 'ct', reasoning_chain: 'rc' },
      { source: CONSENT_SOURCES.DESIGNER }
    )).toThrow(expect.objectContaining({
      code: 'INVALID_REFERENCE',
      field: 'grounding',
      referencedId: 'nonexistent_id',
    }));
  });
});

describe('PROPOSITION — inference_pattern enum (D5)', () => {
  it.each([
    'grounds_imply_conclusion',
    'rule_applies_to_case',
    'permission_licenses_relaxation',
    'definition_substitution',
    'proposition_composition',
  ])('accepts %s', (pattern) => {
    const bridge = makeRealBridge();
    const evA = bridge.addElement({ idShape: 'evidence', source: 'industry', statement: 'A' }, { source: CONSENT_SOURCES.DESIGNER });
    expect(() => bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.PROPOSITION,
        statement: 'p1', grounding: [evA.id], inference_pattern: pattern,
        collapse_test: 'ct', reasoning_chain: 'rc' },
      { source: CONSENT_SOURCES.DESIGNER }
    )).not.toThrow();
  });

  it.each(['grounds-imply-conclusion', 'structural', 'enablement', 'absence_implies_absence'])('rejects %s with SHAPE_INVALID', (badPattern) => {
    const bridge = makeRealBridge();
    const evA = bridge.addElement({ idShape: 'evidence', source: 'industry', statement: 'A' }, { source: CONSENT_SOURCES.DESIGNER });
    expect(() => bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.PROPOSITION,
        statement: 'p1', grounding: [evA.id], inference_pattern: badPattern,
        collapse_test: 'ct', reasoning_chain: 'rc' },
      { source: CONSENT_SOURCES.DESIGNER }
    )).toThrow(expect.objectContaining({ code: 'SHAPE_INVALID', field: 'inference_pattern' }));
  });
});

describe('PROPOSITION — render sub-lines (AC-9.1)', () => {
  it('renderStructuredProof emits Inference pattern and Grounding sub-lines', () => {
    const bridge = makeRealBridge();
    const evA = bridge.addElement({ idShape: 'evidence', source: 'industry', statement: 'A' }, { source: CONSENT_SOURCES.DESIGNER });
    const { id: pId } = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.PROPOSITION, statement: 'p1', grounding: [evA.id], inference_pattern: 'grounds_imply_conclusion', collapse_test: 'ct', reasoning_chain: 'rc' },
      { source: CONSENT_SOURCES.DESIGNER }
    );
    bridge.ratifyElement({ elementId: pId, source: 'designer', claim: '_' }, { source: CONSENT_SOURCES.DESIGNER });
    // also need second consent for two_yes if approval requires it — adjust per existing bridge behavior
    const out = bridge.renderStructuredProof();
    expect(out).toContain('Inference pattern: grounds_imply_conclusion');
    expect(out).toContain(`Grounding: ${evA.id}`);
  });
});
```

- [ ] **Step 2: Run new tests to verify they fail**

```
npm test -- proposition-schema --run
```

Expected: new tests fail (descriptor missing directives; translator emits broken `grounding/2`; render missing sub-lines).

- [ ] **Step 3: Update tags.js INFERENCE_PATTERNS**

```javascript
// Replace lines 20-25:
export const INFERENCE_PATTERNS = Object.freeze({
  GROUNDS_IMPLY_CONCLUSION: 'grounds_imply_conclusion',
  RULE_APPLIES_TO_CASE: 'rule_applies_to_case',
  PERMISSION_LICENSES_RELAXATION: 'permission_licenses_relaxation',
  DEFINITION_SUBSTITUTION: 'definition_substitution',
  PROPOSITION_COMPOSITION: 'proposition_composition',
});
```

- [ ] **Step 4: Update schema.js PROPOSITION descriptor**

Lines 80-91 — add directives:

```javascript
[ELEMENT_CATEGORIES.PROPOSITION]: Object.freeze({
  requiredFields: ['statement', 'grounding', 'collapse_test', 'inference_pattern', 'reasoning_chain'],
  optionalFields: ['scope', 'rejected_alternatives'],
  nonEmptyStringFields: ['reasoning_chain'],
  nonEmptyArrayFields: ['grounding'],                    // NEW
  sourceConstraint: CONSENT_SOURCES.DESIGNER,
  idShape: ELEMENT_CATEGORIES.PROPOSITION,
  renderSection: RENDER_SECTIONS.LEMMAS,
  closedEnumFields: { inference_pattern: INFERENCE_PATTERNS },
  referenceFields: { grounding: '*' },                   // NEW
  authority: { add: [CONSENT_SOURCES.DESIGNER], revise: [CONSENT_SOURCES.DESIGNER], withdraw: [CONSENT_SOURCES.DESIGNER], ratify: [CONSENT_SOURCES.DESIGNER, CONSENT_SOURCES.DESIGN_PARTNER] },
}),
```

- [ ] **Step 5: Update translation.js PROPOSITION translator**

Line 37 (the broken `['grounding', [id, args.grounding]]`) — replace with spread:

```javascript
[ELEMENT_CATEGORIES.PROPOSITION]: (args, id, ts) => ({
  baseFacts: [
    ['proposition_decl', [id, args.statement, args.inference_pattern]],
    ...args.grounding.map(eid => ['proposition_grounding', [id, eid]]),
    ['collapse_test', [id, args.collapse_test]],
    ['reasoning_chain', [id, args.reasoning_chain]],
    ...(Array.isArray(args.rejected_alternatives)
      ? args.rejected_alternatives.map(alt => ['rejected_alternative', [id, alt.statement, alt.rejection_reason]])
      : []),
  ],
  rules: [],
  metaFacts: [['created_at', [id, ts]]],
}),
```

Note: removed the broken `['grounding', [id, args.grounding]]` line entirely; spread is per-element. `args.grounding` is guaranteed non-empty by `nonEmptyArrayFields` directive in Task 2 Step 4 — no need for `Array.isArray` guard.

- [ ] **Step 5b: Update friction-policy.js `effective_grounding_rule` (M1 mitigation)**

`skills/design-proof-system/references/domain/friction-policy.js:8-11` currently:

```javascript
rulePorts.defineRule('effective_grounding_rule',
  ['effective_grounding', ['P']],
  [['grounding', ['P', 'E']], ['not', ['withdrew', ['E']]]],
  { domain_concept: 'effective_grounding', module: 'friction-policy' });
```

Replace body atom `['grounding', ['P', 'E']]` with `['proposition_grounding', ['P', 'E']]`. Resulting:

```javascript
rulePorts.defineRule('effective_grounding_rule',
  ['effective_grounding', ['P']],
  [['proposition_grounding', ['P', 'E']], ['not', ['withdrew', ['E']]]],
  { domain_concept: 'effective_grounding', module: 'friction-policy' });
```

Rationale: `grounding/2` is removed from EDB_PREDICATES in Step 6 below. The rule body must point at the new predicate name to continue matching real-world facts; without this, `effective_grounding` never derives, `ungrounded_proposition` fires for every PROPOSITION, and `closure_permitted` is permanently blocked. This is silent (no test failure unless the test exercises closure derivation via the bridge path).

- [ ] **Step 6: Update translation.js EDB_PREDICATES**

Line 193-202 — remove `'grounding'`, add `'proposition_grounding'`:

```javascript
const EDB_PREDICATES = Object.freeze(new Set([
  'evidence', 'rule_decl', 'permission_decl', 'permission', 'permission_scope',
  'proposition_decl', 'proposition_grounding',  // grounding removed; proposition_grounding added
  'collapse_test', 'reasoning_chain', 'rejected_alternative',
  'risk', 'risk_basis', 'resolution_decl', 'addresses', 'friction',
  // ... rest unchanged in this task; Tasks 3 and 4 update further
]));
```

- [ ] **Step 7: Update render.js PROJECTION_ARITIES**

Line 174-185 — replace `grounding: 2` with `proposition_grounding: 2`:

```javascript
const PROJECTION_ARITIES = {
  evidence: 3, rule_decl: 2, permission_decl: 2, permission: 3, permission_scope: 2,
  proposition_decl: 3,
  proposition_grounding: 2,                              // was: grounding: 2
  collapse_test: 2, reasoning_chain: 2, rejected_alternative: 3,
  risk: 3, risk_basis: 2,
  resolution_decl: 2, addresses: 2,                       // addresses retired in Task 3
  friction: 4,                                            // arity 5 in Task 4
  // ... rest unchanged
};
```

- [ ] **Step 8: Update render.js renderStructuredProof PROPOSITION block**

Lines 55-71 — add Inference pattern sub-line (queries `proposition_decl/3` third arg) and Grounding sub-line:

```javascript
const propositions = live(readPorts.query.query(['proposition', [{ var: 'I' }, { var: 'S' }]]));
if (propositions.length) {
  const propBlocks = propositions.map(b => {
    const lines = [`- ${b.I}: ${b.S}`];
    const declRows = readPorts.query.query(['proposition_decl', [b.I, { var: '_S' }, { var: 'P' }]]);
    if (declRows.length) lines.push(`  - Inference pattern: ${declRows[0].P}`);
    const groundingRows = readPorts.query.query(['proposition_grounding', [b.I, { var: 'E' }]]);
    if (groundingRows.length) lines.push(`  - Grounding: ${groundingRows.map(r => r.E).join(', ')}`);
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

- [ ] **Step 9: Run all PROPOSITION tests + full suite**

```
npm test -- proposition-schema --run
npm test --run
```

Expected: new PROPOSITION tests pass; existing tests still pass (no test in the wider suite uses removed enum values per Task 1 grep).

- [ ] **Step 10: Commit**

```bash
git add skills/design-proof-system/references/domain/tags.js \
        skills/design-proof-system/references/domain/schema.js \
        skills/design-proof-system/references/domain/translation.js \
        skills/design-proof-system/references/domain/friction-policy.js \
        skills/design-proof-system/references/domain/render.js \
        skills/design-proof-system/references/domain/__tests__/proposition-schema.test.js
git commit -m "fix(domain): PROPOSITION grounding spread, inference_pattern enum, friction-policy rule update, render sub-lines"
```

---

## Task 3: RESOLUTION reshape + DEF-1 + render block + closure-policy rule update

**Type:** code-producing
**Implements:** AC-5.1, AC-5.2, AC-5.3, AC-5.4, AC-5.5, AC-9.2
**Decision budget:** 3 (predicate naming for legacy `addresses/2` retirement; fixture migration in concern-schema.test.js for addresses→problem_anchor+grounding; closure-policy rule rewrite + raw assertFact migration scope)
**Must remain green:** `resolution-schema.test.js` (new); `concern-schema.test.js` (post-fixture-migration including raw assertFact lines); any test exercising `covered` derivation, `unaddressed_concern`, `closure_permitted` via bridge path; all prior task tests

**Files:**
- Modify: `skills/design-proof-system/references/domain/schema.js:104-115` — RESOLUTION descriptor
- Modify: `skills/design-proof-system/references/domain/translation.js:55-62` — RESOLUTION translator
- Modify: `skills/design-proof-system/references/domain/translation.js:193-202` — `EDB_PREDICATES` remove `'addresses'`, add `'resolution_anchor'`, `'resolution_grounding'`
- **Modify: `skills/design-proof-system/references/domain/closure-policy.js:49-54` — `effective_addresses_rule` body atom: replace `['addresses', ['R', 'C']]` with `['resolution_anchor', ['R', 'C']]`** (M2 mitigation — without this, `covered` never derives and the closure gate permanently blocks)
- Modify: `skills/design-proof-system/references/domain/render.js:174-185` — `PROJECTION_ARITIES` remove `addresses: 2`, add `resolution_anchor: 2`, `resolution_grounding: 2`
- Modify: `skills/design-proof-system/references/domain/render.js:72-73` — `renderStructuredProof` RESOLUTION block: add sub-lines
- Create: `skills/design-proof-system/references/domain/__tests__/resolution-schema.test.js`
- Modify: `skills/design-proof-system/references/domain/__tests__/concern-schema.test.js:260` — `addresses: cId` → `problem_anchor: cId, grounding: [propId]` (requires also adding a proposition before the resolution)
- **Modify: `skills/design-proof-system/references/domain/__tests__/concern-schema.test.js:131, 139, 153, 173` — raw `engine.assertFact('addresses', [resId, cId])` calls migrate to `engine.assertFact('resolution_anchor', [resId, cId])`** (M2 mitigation — these tests bypass the bridge and were giving false-green coverage of the broken production path; without migration they would keep passing while the real path stays broken)
- **Modify: `skills/design-proof-system/references/domain/__tests__/bridge-integration.test.js:47` — `addresses: risk.id` on RESOLUTION submission → `problem_anchor: <concern-id>, grounding: [<proposition-id>]`** (M5 mitigation — pre-enumerated; defer to grep-based fallback if the test's existing setup doesn't yield obvious concern/proposition references in the surrounding lines)

**Steps (TDD):**

- [ ] **Step 1: Write the failing test (new file resolution-schema.test.js)**

```javascript
import { describe, it, expect } from 'vitest';
import { createDomainBridge } from '../bridge.js';
import { Engine } from '../../engine/index.js';
import { CONSENT_SOURCES, ELEMENT_CATEGORIES } from '../tags.js';
import { CATEGORY_REGISTRY } from '../schema.js';

function makeRealBridge() {
  const engine = new Engine();
  return createDomainBridge({ engine });
}

describe('RESOLUTION — descriptor shape', () => {
  it('requiredFields are statement/problem_anchor/grounding', () => {
    const desc = CATEGORY_REGISTRY[ELEMENT_CATEGORIES.RESOLUTION];
    expect(new Set(desc.requiredFields)).toEqual(new Set(['statement', 'problem_anchor', 'grounding']));
  });
  it('nonEmptyArrayFields contains grounding; referenceFields targets concern + proposition', () => {
    const desc = CATEGORY_REGISTRY[ELEMENT_CATEGORIES.RESOLUTION];
    expect(desc.nonEmptyArrayFields).toContain('grounding');
    expect(desc.referenceFields).toEqual({ problem_anchor: 'concern', grounding: 'proposition' });
  });
});

describe('RESOLUTION — translator emits anchor and grounding-spread facts', () => {
  it('emits resolution_anchor/2 once and resolution_grounding/2 per element', () => {
    const bridge = makeRealBridge();
    const ev = bridge.addElement({ idShape: 'evidence', source: 'industry', statement: 'A' }, { source: CONSENT_SOURCES.DESIGNER });
    const concern = bridge.addElement({ idShape: 'concern', label: 'C1' }, { source: CONSENT_SOURCES.DESIGNER });
    const pA = bridge.addElement({ idShape: 'proposition', statement: 'pA', grounding: [ev.id], inference_pattern: 'grounds_imply_conclusion', collapse_test: 'ct', reasoning_chain: 'rc' }, { source: CONSENT_SOURCES.DESIGNER });
    const pB = bridge.addElement({ idShape: 'proposition', statement: 'pB', grounding: [ev.id], inference_pattern: 'grounds_imply_conclusion', collapse_test: 'ct', reasoning_chain: 'rc' }, { source: CONSENT_SOURCES.DESIGNER });
    const { id: rId } = bridge.addElement(
      { idShape: 'resolution', statement: 'R1', problem_anchor: concern.id, grounding: [pA.id, pB.id] },
      { source: CONSENT_SOURCES.DESIGNER }
    );
    const anchorRows = bridge.queryProof({ pattern: ['resolution_anchor', [rId, { var: 'C' }]] });
    expect(anchorRows).toHaveLength(1);
    expect(anchorRows[0].C).toBe(concern.id);
    const groundingRows = bridge.queryProof({ pattern: ['resolution_grounding', [rId, { var: 'P' }]] });
    expect(groundingRows).toHaveLength(2);
    expect(new Set(groundingRows.map(r => r.P))).toEqual(new Set([pA.id, pB.id]));
  });
});

describe('RESOLUTION — INVALID_REFERENCE on non-existent refs', () => {
  it('throws INVALID_REFERENCE when problem_anchor missing', () => {
    const bridge = makeRealBridge();
    expect(() => bridge.addElement(
      { idShape: 'resolution', statement: 'R1', problem_anchor: 'nonexistent_concern', grounding: ['ignored'] },
      { source: CONSENT_SOURCES.DESIGNER }
    )).toThrow(expect.objectContaining({ code: 'INVALID_REFERENCE', field: 'problem_anchor' }));
  });
  it('throws INVALID_REFERENCE when grounding references missing proposition', () => {
    const bridge = makeRealBridge();
    const concern = bridge.addElement({ idShape: 'concern', label: 'C1' }, { source: CONSENT_SOURCES.DESIGNER });
    expect(() => bridge.addElement(
      { idShape: 'resolution', statement: 'R1', problem_anchor: concern.id, grounding: ['nonexistent_proposition'] },
      { source: CONSENT_SOURCES.DESIGNER }
    )).toThrow(expect.objectContaining({ code: 'INVALID_REFERENCE', field: 'grounding', referencedId: 'nonexistent_proposition' }));
  });
});
```

- [ ] **Step 2: Run new tests — verify fail**

```
npm test -- resolution-schema --run
```

Expected: descriptor tests fail (requiredFields wrong), translator tests fail (no resolution_anchor/grounding facts), INVALID_REFERENCE tests fail (no referenceFields validation).

- [ ] **Step 3: Update schema.js RESOLUTION descriptor**

Lines 104-115 — replace:

```javascript
[ELEMENT_CATEGORIES.RESOLUTION]: Object.freeze({
  requiredFields: ['statement', 'problem_anchor', 'grounding'],   // was ['statement', 'addresses']
  optionalFields: [],
  nonEmptyStringFields: [],
  nonEmptyArrayFields: ['grounding'],                              // NEW
  sourceConstraint: CONSENT_SOURCES.DESIGNER,
  idShape: ELEMENT_CATEGORIES.RESOLUTION,
  renderSection: RENDER_SECTIONS.THEOREMS,
  closedEnumFields: {},
  referenceFields: { problem_anchor: 'concern', grounding: 'proposition' },  // NEW
  authority: { add: [CONSENT_SOURCES.DESIGNER], revise: [CONSENT_SOURCES.DESIGNER], withdraw: [CONSENT_SOURCES.DESIGNER], ratify: [CONSENT_SOURCES.DESIGNER, CONSENT_SOURCES.DESIGN_PARTNER] },
}),
```

- [ ] **Step 4: Update translation.js RESOLUTION translator**

Lines 55-62 — replace addresses emission with anchor + grounding spread:

```javascript
[ELEMENT_CATEGORIES.RESOLUTION]: (args, id, ts) => ({
  baseFacts: [
    ['resolution_decl', [id, args.statement]],
    ['resolution_anchor', [id, args.problem_anchor]],
    ...args.grounding.map(pid => ['resolution_grounding', [id, pid]]),
  ],
  rules: [],
  metaFacts: [['created_at', [id, ts]]],
}),
```

- [ ] **Step 5: Update EDB_PREDICATES and PROJECTION_ARITIES**

In translation.js EDB_PREDICATES: remove `'addresses'`, add `'resolution_anchor'`, `'resolution_grounding'`.

In render.js PROJECTION_ARITIES: remove `addresses: 2`, add `resolution_anchor: 2`, `resolution_grounding: 2`.

- [ ] **Step 6: Update render.js renderStructuredProof RESOLUTION block**

Line 72-73 currently:

```javascript
const resolutions = live(readPorts.query.query(['resolution', [{ var: 'I' }, { var: 'S' }]]));
if (resolutions.length) sections.push('## Theorems (Resolutions)\n' + resolutions.map(b => `- ${b.I}: ${b.S}`).join('\n') + '\n');
```

Replace with block including sub-lines:

```javascript
const resolutions = live(readPorts.query.query(['resolution', [{ var: 'I' }, { var: 'S' }]]));
if (resolutions.length) {
  const lines = ['## Theorems (Resolutions)'];
  for (const r of resolutions) {
    lines.push(`- ${r.I}: ${r.S}`);
    const anchor = readPorts.query.query(['resolution_anchor', [r.I, { var: 'C' }]]);
    if (anchor.length) lines.push(`  - Problem anchor: ${anchor[0].C}`);
    const grounding = readPorts.query.query(['resolution_grounding', [r.I, { var: 'P' }]]);
    if (grounding.length) lines.push(`  - Grounding: ${grounding.map(g => g.P).join(', ')}`);
  }
  sections.push(lines.join('\n') + '\n');
}
```

- [ ] **Step 6b: Update closure-policy.js `effective_addresses_rule` (M2 mitigation)**

`skills/design-proof-system/references/domain/closure-policy.js:49-54` currently:

```javascript
rulePorts.defineRule(
  'effective_addresses_rule',
  ['effective_addresses', ['R', 'C']],
  [['addresses', ['R', 'C']], ['not', ['withdrew', ['R']]]],
  { domain_concept: 'effective_addresses', module: 'closure-policy' },
);
```

Replace body atom `['addresses', ['R', 'C']]` with `['resolution_anchor', ['R', 'C']]`. Resulting:

```javascript
rulePorts.defineRule(
  'effective_addresses_rule',
  ['effective_addresses', ['R', 'C']],
  [['resolution_anchor', ['R', 'C']], ['not', ['withdrew', ['R']]]],
  { domain_concept: 'effective_addresses', module: 'closure-policy' },
);
```

Rationale: `addresses/2` is removed from EDB_PREDICATES in Step 5 above. The rule body must point at the new predicate name. Without this, `effective_addresses` never derives → `covered` never derives → `unaddressed_concern` fires for every ratified concern → `closure_permitted` permanently blocked.

- [ ] **Step 7: Migrate concern-schema.test.js fixtures (both bridge-path and raw-assertFact)**

**7a. Bridge-path fixture at line 260 (and similar):**

```javascript
// BEFORE:
const { id: rId } = bridge.addElement({ idShape: 'resolution', statement: 'R1', addresses: cId }, { source: CONSENT_SOURCES.DESIGNER });

// AFTER (need a proposition first to ground the resolution):
const { id: pId } = bridge.addElement(
  { idShape: 'proposition', statement: 'p1', grounding: [/* some evidence id from earlier in the test */], inference_pattern: 'grounds_imply_conclusion', collapse_test: 'ct', reasoning_chain: 'rc' },
  { source: CONSENT_SOURCES.DESIGNER }
);
const { id: rId } = bridge.addElement(
  { idShape: 'resolution', statement: 'R1', problem_anchor: cId, grounding: [pId] },
  { source: CONSENT_SOURCES.DESIGNER }
);
```

Verify which existing fixtures already create an evidence/proposition in the same test block; adapt the migration to reuse those rather than re-adding.

**7b. Raw `engine.assertFact` migration at lines 131, 139, 153, 173:**

These four tests bypass the bridge and inject `addresses` facts directly into the engine to test coverage derivation. They were giving false-green coverage of the broken production path. Migrate each call:

```javascript
// BEFORE:
s.facts.assertFact('addresses', [resId, cId]);
// AFTER:
s.facts.assertFact('resolution_anchor', [resId, cId]);
```

Use grep to find every occurrence:

```bash
grep -n "assertFact.*'addresses'" skills/design-proof-system/references/domain/__tests__/concern-schema.test.js
```

Replace each. These tests validate that `covered` and `closure_permitted` derive correctly when the effective_addresses_rule body atom matches — after Step 6b's rule update, the rule body is `resolution_anchor`, so the test fixtures must inject that predicate.

- [ ] **Step 8: Run all tests**

```
npm test -- resolution-schema concern-schema --run
npm test --run
```

Expected: full suite passes.

- [ ] **Step 9: Commit**

```bash
git add skills/design-proof-system/references/domain/schema.js \
        skills/design-proof-system/references/domain/translation.js \
        skills/design-proof-system/references/domain/closure-policy.js \
        skills/design-proof-system/references/domain/render.js \
        skills/design-proof-system/references/domain/__tests__/resolution-schema.test.js \
        skills/design-proof-system/references/domain/__tests__/concern-schema.test.js \
        skills/design-proof-system/references/domain/__tests__/bridge-integration.test.js
git commit -m "fix(domain): RESOLUTION reshape, closure-policy rule update, render sub-lines, DEF-1 closure"
```

---

## Task 4: FRICTION reshape arity 4→5 + new render section + closure-policy rule update

**Type:** code-producing
**Implements:** AC-6.1, AC-6.2, AC-6.3, AC-6.4, AC-6.5, AC-9.3, AC-12.3
**Decision budget:** 3 (whether existing FRICTION-using tests need migration; whether to handle the `statement` optional field in render; whether `friction_disposition` predicate from EDB_PREDICATES (line 197 in current code) becomes orphaned)
**Must remain green:** `friction-schema.test.js` (new); friction-policy tests if any; all prior task tests

**Files:**
- Modify: `skills/design-proof-system/references/domain/schema.js:10-20` — `_CATEGORY_PROBES_SCHEMA.FRICTION` arity 4→5 (entry currently reads `['friction', 4]` and must become `['friction', 5]`)
- Modify: `skills/design-proof-system/references/domain/schema.js:4-9` — strengthen the existing inline cross-reference comment so it explicitly names `_CATEGORY_PROBES` in `mutations.js` as the parallel table and calls out the FRICTION arity sync requirement (AC-12.3 mitigation)
- Modify: `skills/design-proof-system/references/domain/schema.js:116-127` — FRICTION descriptor
- Modify: `skills/design-proof-system/references/domain/mutations.js:13-23` — `_CATEGORY_PROBES.FRICTION` arity 4→5 (parallel update, must stay in sync with `_CATEGORY_PROBES_SCHEMA.FRICTION`)
- Modify: `skills/design-proof-system/references/domain/translation.js:63-67` — FRICTION translator arity 5
- Modify: `skills/design-proof-system/references/domain/render.js:80-89` — `_ARITIES.friction: 5`
- Modify: `skills/design-proof-system/references/domain/render.js:174-185` — `PROJECTION_ARITIES.friction: 5`
- Modify: `skills/design-proof-system/references/domain/render.js:72-75` or thereabouts — add NEW `## Frictions` section in `renderStructuredProof` (after RESOLUTION block from Task 3)
- **Modify: `skills/design-proof-system/references/domain/closure-policy.js:82-91` — `unresolved_friction_rule` body pattern: update arity-4 `['friction', ['F', '_', '_', 'unset']]` to arity-5 `['friction', ['F', '_', '_', '_', 'unset']]`** (M3 mitigation — without this, `unresolved_friction` never derives and the closure gate's friction-blocking arm silently stops working)
- Create: `skills/design-proof-system/references/domain/__tests__/friction-schema.test.js`
- Check & possibly modify: `skills/design-proof-system/references/domain/friction-policy.js` and its tests — see Step 1 below

**Steps (TDD):**

- [ ] **Step 1: Pre-task search — find FRICTION callers that may break**

```bash
grep -rn "addElement.*friction\|args\.shape\|args\.description\|friction(.*4.*arity\|friction-policy" skills/design-proof-system/references/domain/
```

Inspect each match. Determine whether existing FRICTION usage in friction-policy or elsewhere needs migration alongside this task. Document any required adjustments in this task's Files block before proceeding.

- [ ] **Step 2: Write the failing test (new file friction-schema.test.js)**

```javascript
import { describe, it, expect } from 'vitest';
import { createDomainBridge } from '../bridge.js';
import { Engine } from '../../engine/index.js';
import { CONSENT_SOURCES, ELEMENT_CATEGORIES, FRICTION_SHAPES, FRICTION_DISPOSITIONS } from '../tags.js';
import { CATEGORY_REGISTRY } from '../schema.js';

function makeRealBridge() {
  const engine = new Engine();
  return createDomainBridge({ engine });
}

describe('FRICTION — descriptor shape', () => {
  it('requiredFields = [friction_shape, anchor_a, anchor_b, disposition]; optionalFields contains statement', () => {
    const desc = CATEGORY_REGISTRY[ELEMENT_CATEGORIES.FRICTION];
    expect(new Set(desc.requiredFields)).toEqual(new Set(['friction_shape', 'anchor_a', 'anchor_b', 'disposition']));
    expect(desc.optionalFields).toContain('statement');
    expect(desc.requiredFields).not.toContain('shape');
    expect(desc.requiredFields).not.toContain('description');
  });
  it('referenceFields = { anchor_a: *, anchor_b: * }', () => {
    const desc = CATEGORY_REGISTRY[ELEMENT_CATEGORIES.FRICTION];
    expect(desc.referenceFields).toEqual({ anchor_a: '*', anchor_b: '*' });
  });
});

describe('FRICTION — translator emits friction/5', () => {
  it('emits arity-5 friction fact', () => {
    const bridge = makeRealBridge();
    const evA = bridge.addElement({ idShape: 'evidence', source: 'industry', statement: 'A' }, { source: CONSENT_SOURCES.DESIGNER });
    const evB = bridge.addElement({ idShape: 'evidence', source: 'industry', statement: 'B' }, { source: CONSENT_SOURCES.DESIGNER });
    const validShape = Object.values(FRICTION_SHAPES)[0];
    const validDispo = Object.values(FRICTION_DISPOSITIONS)[0];
    const { id: fId } = bridge.addElement(
      { idShape: 'friction', friction_shape: validShape, anchor_a: evA.id, anchor_b: evB.id, disposition: validDispo },
      { source: CONSENT_SOURCES.SYSTEM }
    );
    const rows = bridge.queryProof({ pattern: ['friction', [fId, { var: 'S' }, { var: 'A' }, { var: 'B' }, { var: 'D' }]] });
    expect(rows).toHaveLength(1);
    expect(rows[0].S).toBe(validShape);
    expect(rows[0].A).toBe(evA.id);
    expect(rows[0].B).toBe(evB.id);
    expect(rows[0].D).toBe(validDispo);
  });
});

describe('FRICTION — INVALID_REFERENCE for missing anchors', () => {
  it('throws when anchor_a does not exist', () => {
    const bridge = makeRealBridge();
    const ev = bridge.addElement({ idShape: 'evidence', source: 'industry', statement: 'A' }, { source: CONSENT_SOURCES.DESIGNER });
    const validShape = Object.values(FRICTION_SHAPES)[0];
    const validDispo = Object.values(FRICTION_DISPOSITIONS)[0];
    expect(() => bridge.addElement(
      { idShape: 'friction', friction_shape: validShape, anchor_a: 'nonexistent', anchor_b: ev.id, disposition: validDispo },
      { source: CONSENT_SOURCES.SYSTEM }
    )).toThrow(expect.objectContaining({ code: 'INVALID_REFERENCE', field: 'anchor_a' }));
  });
});

describe('FRICTION — renderStructuredProof emits Frictions section (AC-9.3)', () => {
  it('rendered output contains ## Frictions block with friction_shape + anchor sub-lines', () => {
    const bridge = makeRealBridge();
    const evA = bridge.addElement({ idShape: 'evidence', source: 'industry', statement: 'A' }, { source: CONSENT_SOURCES.DESIGNER });
    const evB = bridge.addElement({ idShape: 'evidence', source: 'industry', statement: 'B' }, { source: CONSENT_SOURCES.DESIGNER });
    const validShape = Object.values(FRICTION_SHAPES)[0];
    const validDispo = Object.values(FRICTION_DISPOSITIONS)[0];
    bridge.addElement(
      { idShape: 'friction', friction_shape: validShape, anchor_a: evA.id, anchor_b: evB.id, disposition: validDispo },
      { source: CONSENT_SOURCES.SYSTEM }
    );
    const out = bridge.renderStructuredProof();
    expect(out).toContain('## Frictions');
    expect(out).toContain(`Friction shape: ${validShape}`);
    expect(out).toContain(`Anchor A: ${evA.id}`);
    expect(out).toContain(`Anchor B: ${evB.id}`);
    expect(out).toContain(`Disposition: ${validDispo}`);
  });
});
```

- [ ] **Step 3: Run new tests — verify fail**

```
npm test -- friction-schema --run
```

- [ ] **Step 4a: Update schema.js `_CATEGORY_PROBES_SCHEMA.FRICTION` arity 4→5**

Lines 10-20:

```javascript
const _CATEGORY_PROBES_SCHEMA = Object.freeze({
  [ELEMENT_CATEGORIES.EVIDENCE]: ['evidence', 3],
  [ELEMENT_CATEGORIES.RULE]: ['rule_decl', 2],
  [ELEMENT_CATEGORIES.PERMISSION]: ['permission_decl', 2],
  [ELEMENT_CATEGORIES.PROPOSITION]: ['proposition_decl', 3],
  [ELEMENT_CATEGORIES.RISK]: ['risk', 3],
  [ELEMENT_CATEGORIES.RESOLUTION]: ['resolution_decl', 2],
  [ELEMENT_CATEGORIES.FRICTION]: ['friction', 5],     // was 4 — parallel sync with _CATEGORY_PROBES in mutations.js required (AC-12.3)
  [ELEMENT_CATEGORIES.CONCERN]: ['concern', 3],
  [ELEMENT_CATEGORIES.DEFINITION]: ['definition_decl', 3],
});
```

- [ ] **Step 4b: Strengthen the inline sync comment above `_CATEGORY_PROBES_SCHEMA` (AC-12.3 mitigation)**

Current comment at lines 4-9 reads "Matches the same (category, predicate, arity) triples used by `_CATEGORY_PROBES` in mutations.js — kept in sync via S2-mitigation discipline." Replace with:

```javascript
// Private partial mirror of mutations.js's `_CATEGORY_PROBES`. Cannot import directly
// (circular: mutations.js imports verifyArgsShape from schema.js). Keyed by
// ELEMENT_CATEGORIES string value (e.g. 'rule', 'permission') → [declaration
// predicate, arity]. MUST stay synchronized with `_CATEGORY_PROBES` in mutations.js —
// any time a category's declaration predicate or arity changes, BOTH tables update
// in the same commit. Probe-table sync structural test (DEF-7) is deferred to a
// future design pass per sprint-02-bug-fix-0306 spec Non-Goals; until that test
// lands, the discipline is human-enforced.
// Wildcard '*' (handled in _existsCategory) iterates all entries.
```

- [ ] **Step 4c: Update mutations.js `_CATEGORY_PROBES.FRICTION` arity 4→5**

Locate the FRICTION entry in `_CATEGORY_PROBES` (mutations.js lines 13-23 approximately). Change the arity from 4 to 5 to match the schema.js update. Verify by grepping that exactly one occurrence of `'friction'.*4` exists in mutations.js before the edit, and zero after.

- [ ] **Step 5: Update schema.js FRICTION descriptor**

Lines 116-127:

```javascript
[ELEMENT_CATEGORIES.FRICTION]: Object.freeze({
  requiredFields: ['friction_shape', 'anchor_a', 'anchor_b', 'disposition'],
  optionalFields: ['statement'],
  nonEmptyStringFields: [],
  nonEmptyArrayFields: [],
  sourceConstraint: CONSENT_SOURCES.SYSTEM,
  idShape: ELEMENT_CATEGORIES.FRICTION,
  renderSection: RENDER_SECTIONS.FRICTIONS,
  closedEnumFields: { friction_shape: FRICTION_SHAPES, disposition: FRICTION_DISPOSITIONS },
  referenceFields: { anchor_a: '*', anchor_b: '*' },
  authority: { add: [CONSENT_SOURCES.SYSTEM, CONSENT_SOURCES.DESIGNER], revise: [CONSENT_SOURCES.DESIGNER], withdraw: [CONSENT_SOURCES.DESIGNER], ratify: [CONSENT_SOURCES.DESIGNER] },
}),
```

- [ ] **Step 6: Update translation.js FRICTION translator**

Lines 63-67 → arity-5:

```javascript
[ELEMENT_CATEGORIES.FRICTION]: (args, id, ts) => ({
  baseFacts: [['friction', [id, args.friction_shape, args.anchor_a, args.anchor_b, args.disposition]]],
  rules: [],
  metaFacts: [['created_at', [id, ts]]],
}),
```

- [ ] **Step 7: Update render.js arity tables**

`_ARITIES` line 87: `friction: 5` (was 4).
`PROJECTION_ARITIES` line 180: `friction: 5` (was 4).

- [ ] **Step 7b: Update closure-policy.js `unresolved_friction_rule` pattern arity (M3 mitigation)**

`skills/design-proof-system/references/domain/closure-policy.js:82-91` currently:

```javascript
rulePorts.defineRule(
  'unresolved_friction_rule',
  ['unresolved_friction', ['F']],
  [
    ['friction', ['F', '_', '_', 'unset']],
    ['not', ['friction_disposition', ['F', '_']]],
    ['not', ['withdrew', ['F']]],
  ],
  { domain_concept: 'unresolved_friction', module: 'closure-policy' },
);
```

The body atom `['friction', ['F', '_', '_', 'unset']]` is arity-4 (F id + 3 wildcards) where the 4th positional is the literal `'unset'` (matching `disposition === 'unset'`). After this task's arity-5 reshape, the fact shape is `friction(id, friction_shape, anchor_a, anchor_b, disposition)`. The disposition moves to the 5th positional. Update the body atom to:

```javascript
['friction', ['F', '_', '_', '_', 'unset']],
```

(4 wildcards in slots 2-4 covering friction_shape + anchor_a + anchor_b; literal `'unset'` in the 5th disposition slot.) Without this update, the body pattern never matches arity-5 facts and `unresolved_friction` permanently stops deriving.

- [ ] **Step 8: Add new Frictions section to renderStructuredProof**

After the RESOLUTION block (post-Task-3) and before `return sections.join('\n')`:

```javascript
const frictions = live(readPorts.query.query(['friction', [{ var: 'I' }, { var: 'S' }, { var: 'A' }, { var: 'B' }, { var: 'D' }]]));
if (frictions.length) {
  const lines = ['## Frictions'];
  for (const f of frictions) {
    lines.push(`- ${f.I}`);
    lines.push(`  - Friction shape: ${f.S}`);
    lines.push(`  - Anchor A: ${f.A}`);
    lines.push(`  - Anchor B: ${f.B}`);
    lines.push(`  - Disposition: ${f.D}`);
  }
  sections.push(lines.join('\n') + '\n');
}
```

Note: `live(...)` filters by withdrawn id. The `I` variable binds to the friction id.

- [ ] **Step 9: Run friction tests + full suite**

```
npm test -- friction-schema --run
npm test --run
```

Expected: friction-schema tests pass; if friction-policy tests reference the old arity-4 shape, fix them inline (this is what Step 1 surveys).

- [ ] **Step 10: Commit**

```bash
git add skills/design-proof-system/references/domain/schema.js \
        skills/design-proof-system/references/domain/mutations.js \
        skills/design-proof-system/references/domain/translation.js \
        skills/design-proof-system/references/domain/closure-policy.js \
        skills/design-proof-system/references/domain/render.js \
        skills/design-proof-system/references/domain/__tests__/friction-schema.test.js
git commit -m "fix(domain): FRICTION reshape arity 4→5, closure-policy rule pattern update, parallel-table sync, new Frictions render section"
```

---

## Task 5: DEFINITION field rename

**Type:** code-producing
**Implements:** AC-7.1, AC-7.2, AC-7.3
**Decision budget:** 1 (whether existing tests use `term:` literal anywhere)
**Must remain green:** `definition-schema.test.js` (new); any existing DEFINITION tests

**Files:**
- Modify: `skills/design-proof-system/references/domain/schema.js:140-151` — DEFINITION descriptor
- Modify: `skills/design-proof-system/references/domain/translation.js:76-95` — DEFINITION translator
- Create: `skills/design-proof-system/references/domain/__tests__/definition-schema.test.js`

**Steps (TDD):**

- [ ] **Step 1: Pre-task search**

```bash
grep -rn "args\.term\|term:\|addElement.*definition" skills/design-proof-system/references/domain/
```

- [ ] **Step 2: Write the failing test (new file definition-schema.test.js)**

```javascript
import { describe, it, expect } from 'vitest';
import { createDomainBridge } from '../bridge.js';
import { Engine } from '../../engine/index.js';
import { CONSENT_SOURCES, ELEMENT_CATEGORIES } from '../tags.js';
import { CATEGORY_REGISTRY } from '../schema.js';

function makeRealBridge() {
  const engine = new Engine();
  return createDomainBridge({ engine });
}

describe('DEFINITION — descriptor shape', () => {
  it('requiredFields = [canonical_name, definition]', () => {
    const desc = CATEGORY_REGISTRY[ELEMENT_CATEGORIES.DEFINITION];
    expect(new Set(desc.requiredFields)).toEqual(new Set(['canonical_name', 'definition']));
    expect(desc.requiredFields).not.toContain('term');
  });
});

describe('DEFINITION — translator emits using canonical_name', () => {
  it('definition_decl carries canonical_name in second positional arg', () => {
    const bridge = makeRealBridge();
    const { id } = bridge.addElement(
      { idShape: 'definition', canonical_name: 'Calculator', definition: 'A device' },
      { source: CONSENT_SOURCES.DESIGNER }
    );
    const rows = bridge.queryProof({ pattern: ['definition_decl', [id, { var: 'N' }, { var: 'D' }]] });
    expect(rows).toHaveLength(1);
    expect(rows[0].N).toBe('Calculator');
    expect(rows[0].D).toBe('A device');
  });
});
```

- [ ] **Step 3: Run test — verify fail**

```
npm test -- definition-schema --run
```

- [ ] **Step 4: Update schema.js DEFINITION descriptor**

Line 141: `requiredFields: ['canonical_name', 'definition']`.

- [ ] **Step 5: Update translation.js DEFINITION translator**

Line 78: `['definition_decl', [id, args.canonical_name, args.definition]]` (was `args.term`).

- [ ] **Step 6: Migrate any existing test fixtures**

From Step 1 grep — if anywhere uses `term: 'X'` for DEFINITION submissions, rename to `canonical_name: 'X'`.

- [ ] **Step 7: Run tests**

```
npm test -- definition-schema --run
npm test --run
```

- [ ] **Step 8: Commit**

```bash
git add skills/design-proof-system/references/domain/schema.js \
        skills/design-proof-system/references/domain/translation.js \
        skills/design-proof-system/references/domain/__tests__/definition-schema.test.js
git commit -m "fix(domain): DEFINITION rename term→canonical_name"
```

---

## Task 6: Cascade document edits (§3.4 and §3.5)

**Type:** docs-producing
**Implements:** AC-8.1, AC-8.2, AC-8.3
**Decision budget:** 1 (how to phrase the §3.4 requiredness flip — "required" vs "must be supplied")
**Must remain green:** no tests affected (docs-only)

**Files:**
- Modify: `docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/05-domain-spec.md` §3.4 main text, §3.4.1, §3.5

**Steps:**

- [ ] **Step 1: Update §3.4.1 — replace five hyphenated inference_pattern values with underscore form**

In `docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/05-domain-spec.md` §3.4.1 (around lines 146-152):

```markdown
### 3.4.1 Inference patterns (closed set)

- `grounds_imply_conclusion`: ordinary modus-ponens-flavored inference from facts to claim
- `rule_applies_to_case`: a Rule's prohibition or obligation extends to this Proposition's case
- `permission_licenses_relaxation`: an exception to a Rule that this Proposition depends on
- `definition_substitution`: the Proposition restates or specializes a Definition
- `proposition_composition`: the Proposition follows from other Propositions (composition through the proposition layer)
```

- [ ] **Step 2: Update §3.4 main text — flip inference_pattern to Required**

In §3.4, locate the `inference_pattern` listing. Currently marked as "Optional but encouraged" or similar. Change to:

```markdown
**Required fields:**
- `inference_pattern`: one of (§3.4.1) — required; the implementation enforces this via `closedEnumFields` and the impl descriptor's `requiredFields` already includes it
```

- [ ] **Step 3: Update §3.5 — risk arity 3 + Severity**

In §3.5 (around line 166):

```markdown
**Engine representation:**
- Fact: `risk(RiskId, Statement, Severity)`
```

(Was `risk(RiskId, Statement)` — arity 2.)

- [ ] **Step 4: Verify**

```bash
grep -n "inference_pattern\|risk(.*Statement" docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/05-domain-spec.md | head -20
```

Confirm no hyphenated inference_pattern values remain; risk arity 3 visible.

- [ ] **Step 5: Commit**

```bash
git add docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/05-domain-spec.md
git commit -m "docs(cascade): align §3.4 inference_pattern (underscore + required) and §3.5 risk arity"
```

---

## Task 7: Probe regression assertions

**Type:** code-producing
**Implements:** AC-10.1, AC-10.2, AC-10.3, AC-8.4 (probe run at finish exercises the Cascade Divergence Gate via downstream archive)
**Decision budget:** 2 (which Phase 12 assertion shape matches bug-fix-02 H-2/H-3 style most closely; how to update existing Phase attempts vs reset)
**Must remain green:** running `node docs/chester/working/stress-tests/20260517-01/cascade-spec-probe-simulation.mjs` exits 0 (or with documented residual)

**Files:**
- Modify: `docs/chester/working/stress-tests/20260517-01/cascade-spec-probe-simulation.mjs` — update existing Phase 2-10b attempts (rename fields, update enum values); append new Phase 12 regression assertions

**Steps:**

- [ ] **Step 1: Read the probe file to refresh on phase structure**

```bash
head -50 docs/chester/working/stress-tests/20260517-01/cascade-spec-probe-simulation.mjs
grep -n "logHeader\|attempt\\[" docs/chester/working/stress-tests/20260517-01/cascade-spec-probe-simulation.mjs | head -40
```

- [ ] **Step 2: Update DEFINITION attempts (Phase 2, attempts [02][03][04])**

Replace `canonical_name` with `term` was the impl-side; spec-side already uses `canonical_name`. Now that impl matches spec, the spec-shape attempts should pass. Verify no source change needed — just confirm attempts use `canonical_name` as already coded in the spec form.

- [ ] **Step 3: Update EVIDENCE attempts (Phase 3, attempts [05]-[09])**

Spec-form attempts use `statement:` — already correct in probe (this is what was failing pre-sprint). After Task 1, these should pass. No source change needed for [05]-[08]. For [09] (must-reject `designer`), assertion of `SHAPE_INVALID` on submission already expected — should now actually fail-as-expected post-Task-1 due to `closedEnumFields`.

- [ ] **Step 4: Update PROPOSITION attempts (Phase 6, attempts [15][16][17] + Phase 10b [30][31])**

Replace hyphenated inference_pattern strings with underscore-form:

```javascript
// inference_pattern: 'grounds-imply-conclusion'  →  inference_pattern: 'grounds_imply_conclusion'
// inference_pattern: 'proposition-composition'   →  inference_pattern: 'proposition_composition'
```

Use `Edit` or `sed` over the probe file.

- [ ] **Step 5: Update RESOLUTION attempts (Phase 9, attempts [25][26])**

These currently submit `problem_anchor` and `grounding[]` (the spec form). After Task 3, they should pass as-is.

- [ ] **Step 6: Update FRICTION attempts (Phase 10, attempt [27])**

Currently submits `friction_shape, anchor_a, anchor_b, disposition`. After Task 4, should pass — but verify the friction_shape value used is one of the impl FRICTION_SHAPES values (cascade enum normalization deferred per Non-Goals). If the probe currently uses a cascade-§3.7.1 hyphenated value like `proposition-proposition-opposing-pull` (which isn't in impl FRICTION_SHAPES), it will still fail post-Task-4. Update to use an impl-valid FRICTION_SHAPES value (e.g., `coverage_gap`) and add a comment noting the residual deferred to a future cascade-alignment sprint.

- [ ] **Step 7: Append Phase 12 regression assertions (M4 mitigation — uses actual probe API)**

The probe file uses `attempt(label, fn)` (probe lines 61-79) as its sole assertion primitive. Failures throw inside `fn()` and the catch path appends to `findings[]`. The bridge facade exposes `bridge.queryProof({ pattern: [...] })` (verified at `domain-bridge.js:138`), NOT `bridge.queryPort.query(...)`. The probe already uses this API for AC-H2 and AC-H3 assertions (lines 234, 339 in the existing probe).

Append at the end of the probe (before the `findings.length` / exit summary):

```javascript
console.log('\n=== Phase 12: Regression assertions (sprint-02-bug-fix-0306) ===\n');

// AC-10.2: PROPOSITION grounding spread — at least one proposition_grounding fact must exist
attempt('AC-10.2 proposition_grounding/2 emitted post-D2 spread', () => {
  const rows = bridge.queryProof({ pattern: ['proposition_grounding', [{ var: 'P' }, { var: 'E' }]] });
  if (rows.length === 0) throw new Error(`expected >=1 proposition_grounding row, got 0`);
  return `rows=${rows.length}`;
});

// AC-10.2: RESOLUTION anchor + grounding emitted
attempt('AC-10.2 resolution_anchor/2 emitted post-D4 reshape', () => {
  const rows = bridge.queryProof({ pattern: ['resolution_anchor', [{ var: 'R' }, { var: 'C' }]] });
  if (rows.length === 0) throw new Error(`expected >=1 resolution_anchor row, got 0`);
  return `rows=${rows.length}`;
});
attempt('AC-10.2 resolution_grounding/2 emitted post-D4 reshape', () => {
  const rows = bridge.queryProof({ pattern: ['resolution_grounding', [{ var: 'R' }, { var: 'P' }]] });
  if (rows.length === 0) throw new Error(`expected >=1 resolution_grounding row, got 0`);
  return `rows=${rows.length}`;
});

// AC-10.2: FRICTION arity 5
attempt('AC-10.2 friction/5 facts emitted post-D4 arity change', () => {
  const rows = bridge.queryProof({ pattern: ['friction', [{ var: 'I' }, { var: 'S' }, { var: 'A' }, { var: 'B' }, { var: 'D' }]] });
  if (rows.length === 0) throw new Error(`expected >=1 friction/5 row, got 0`);
  return `rows=${rows.length}`;
});

// AC-10.2: EVIDENCE source=designer must-reject — wrap in attempt() so the throw is the expected outcome
attempt('AC-10.2 EVIDENCE source=designer rejected with SHAPE_INVALID', () => {
  let rejectedCorrectly = false;
  try {
    bridge.addElement({ idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'designer', statement: 'probe' }, { source: CONSENT_SOURCES.DESIGNER });
  } catch (e) {
    if (e.code === 'SHAPE_INVALID' && e.field === 'source') {
      rejectedCorrectly = true;
    } else {
      throw new Error(`wrong rejection shape: code=${e.code} field=${e.field}`);
    }
  }
  if (!rejectedCorrectly) throw new Error('EVIDENCE source=designer was accepted (expected SHAPE_INVALID)');
  return 'rejected as expected';
});
```

Notes on API verification (do these checks before writing the code):

```bash
grep -n "queryProof\|queryPort" skills/design-proof-system/references/domain/domain-bridge.js
# Should show line 138: queryProof: (args) => render.queryProof(args, readPorts)
# Should show NO queryPort property — confirm bridge.queryProof is the correct API

grep -n "function attempt\|function assert" docs/chester/working/stress-tests/20260517-01/cascade-spec-probe-simulation.mjs
# Should show only `function attempt` at line 61 — no assert helpers
```

Verify both before pasting the Phase 12 block. If either check returns unexpected results, halt and re-spec this step.

- [ ] **Step 8: Run the probe**

```
node docs/chester/working/stress-tests/20260517-01/cascade-spec-probe-simulation.mjs
```

Expected: failure count drops to 0 across the bundles closed. Any remaining failures match the documented Non-Goals (FRICTION enum vocabulary residual, RESOLUTION addresses/3 rule template residual) and are explicitly listed.

- [ ] **Step 9: Commit**

```bash
git add docs/chester/working/stress-tests/20260517-01/cascade-spec-probe-simulation.mjs
git commit -m "test(probe): regression assertions for closed bundles, attempt updates for spec-form alignment"
```

---

## Final Verification (handled by execute-verify-complete)

After Task 7 completes, `execute-verify-complete` runs:

1. Full test suite — `npm test --run` (all 305+ tests pass)
2. Clean tree — `git status --porcelain` empty
3. Checkpoint commit — `git commit --allow-empty -m "checkpoint: execution complete"`

The Cascade Divergence Gate (AC-8.4) runs at `finish-archive-artifacts`, expecting MATCH or PLANS_ONLY auto-sync.


<!-- created-at: 2026-05-17T16:51:03Z -->
<!-- produced-by plan-build@v0006 -->
