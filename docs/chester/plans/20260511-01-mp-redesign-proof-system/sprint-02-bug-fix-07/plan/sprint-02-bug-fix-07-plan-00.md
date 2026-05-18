# Plan: Design-Proof-System Utilization Concerns (Live-Run Batch)

**Sprint:** sprint-02-bug-fix-07
**Spec:** docs/chester/working/20260511-01-mp-redesign-proof-system/sprint-02-bug-fix-07/spec/sprint-02-bug-fix-07-spec-00.md
**Execution mode:** subagent

> **For agentic workers:** Use execute-write to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The `Execution mode` field selects which execute-write section runs — Section 2 (subagent-driven) or Section 3 (inline). plan-build sets this field at handoff based on the Execution Mode Selection heuristic, with human confirm/override.

## Goal

Close twelve utilization gaps observed during a live run of `skills/design-proof-system/` — covering allocator/ID lifecycle, per-verb argument shape, schema affordances, cleanup-cycle economics, and adjacent doc/transport observations.

## Architecture

Hybrid (per spec): holistic ID-lifecycle bundle (D1, D2, D5); symmetric full-record return contract on mutation and read (D6, D10); minimal-new-surface for schema and lint changes (D7, D11); doc-only D8; tested utility module for D9; blocking pre-ratify gate for D11. D12 adds two new OperationSpecs (`revise_proposition`, `revise_resolution`) with an embedded probe (AC-12.4) that decides whether the `grounding_updates` parameter is necessary.

## Tech Stack

- Node.js + ESM modules (the codebase uses `import` / `export` syntax)
- Vitest as the test runner (`vitest` in package devDependencies; tests in `domain/__tests__/`)
- All work in `skills/design-proof-system/references/domain/` plus a single new test file
- No new external dependencies

## Cross-Cutting Decisions (Hardening Outcomes)

These decisions resolve threat-report mitigations that span multiple tasks. Implementers should treat them as binding contract for every affected task.

- **Prefix convention:** abbreviated prefixes (`evid_`, `rule_`, `perm_`, `prop_`, `risk_`, `res_`, `fric_`, `cern_`, `defn_`). The fixture allocator's `${shape}_` form is replaced in lockstep — see Task 0 (fixture setup) below. The abbreviated form is the single source of truth.
- **Prefix table location:** export a single `ID_PREFIXES` constant from `tags.js` alongside `ELEMENT_CATEGORIES`. `mutations.js`, `translation.js`, and the fixture allocator all import from there. No parallel encodings.
- **`createDomainBridgeWith` scope:** OUT OF SCOPE for this sub-sprint. Tasks 5, 11, 12 update `createDomainBridge` only. The pre-existing stub at `domain-bridge.js:228` is acknowledged but not addressed here. Tests for new methods exercise `createDomainBridge` exclusively.
- **`grounding_updates` sentinel:** the `['__retract__', ...]` sentinel in D12's draft translator is NOT shipped to committed code. The AC-12.4 probe runs first (as the very first behavioral step inside Task 12) and decides whether `grounding_updates` is needed. If yes, `runOperation` step 5 is extended with explicit retract handling; if no, the parameter is dropped entirely. No string sentinel lands in `metaFacts`.
- **`IIDAllocator.highWater` is required, not optional.** The dual-path branch in `serializeWithAllocatorState` is removed; the bridge throws `ALLOCATOR_MISSING_HIGHWATER` if the supplied allocator lacks the method. The fallback `extractAllocatorHighWaterMarks` is kept only as the load-time legacy-snapshot recovery path (AC-5.3).

---

## Task 0: Prerequisite — fixture allocator surface and ID_PREFIXES constant

**Type:** code-producing
**Implements:** (prerequisite for AC-1.1, AC-2.1, AC-2.3, AC-5.1, AC-5.2)
**Decision budget:** 1 (where to add the allocator to the test fixture — pinned: extend `createInMemorySubstrate` return value with `idAllocator` exposing `next`, `seed`, `highWater`)
**Must remain green:** `bridge-integration.test.js`, `mutations.test.js`, `sprint-02-bug-fix-07.test.js`

**Files:**
- Modify: `skills/design-proof-system/references/domain/tags.js` (add and export `ID_PREFIXES` constant keyed by ELEMENT_CATEGORIES)
- Modify: `skills/design-proof-system/references/domain/__tests__/_fixtures/inMemorySubstrate.js` (add `idAllocator` with `next/seed/highWater` to the substrate return value)
- Modify: `skills/design-proof-system/references/domain/__tests__/bridge-integration.test.js:7` (rename `function makeAdapters` to `export function makeAdapters`; align its allocator to use abbreviated prefixes via `ID_PREFIXES`)

**Steps (TDD):**

- [ ] **Step 1: Add ID_PREFIXES export to tags.js**

```js
export const ID_PREFIXES = Object.freeze({
  [ELEMENT_CATEGORIES.EVIDENCE]:    'evid_',
  [ELEMENT_CATEGORIES.RULE]:        'rule_',
  [ELEMENT_CATEGORIES.PERMISSION]:  'perm_',
  [ELEMENT_CATEGORIES.PROPOSITION]: 'prop_',
  [ELEMENT_CATEGORIES.RISK]:        'risk_',
  [ELEMENT_CATEGORIES.RESOLUTION]:  'res_',
  [ELEMENT_CATEGORIES.FRICTION]:    'fric_',
  [ELEMENT_CATEGORIES.CONCERN]:     'cern_',
  [ELEMENT_CATEGORIES.DEFINITION]:  'defn_',
});
```

- [ ] **Step 2: Extend `createInMemorySubstrate` return value**

In `_fixtures/inMemorySubstrate.js`, build an allocator object: `{ counters: {}, next(shape) { this.counters[shape] = (this.counters[shape] ?? 0) + 1; return ID_PREFIXES[shape] + this.counters[shape]; }, seed(map) { this.counters = { ...map }; }, highWater(shape) { return this.counters[shape] ?? 0; } }`. Include this in the substrate's returned object as `idAllocator`. Construct the bridge with `createDomainBridge({ engine, clock, idAllocator, ... })` so callers see a working allocator.

- [ ] **Step 3: Align `makeAdapters` in `bridge-integration.test.js`**

Refactor `function makeAdapters` to `export function makeAdapters` so plan-test files can import it. Change its allocator to use `ID_PREFIXES` instead of `${shape}_${n}` — abbreviated prefixes are now the convention.

- [ ] **Step 4: Run existing tests; confirm baseline green under new prefixes**

Run: `cd skills/design-proof-system/references/domain && npx vitest run __tests__/`
Expected: all existing tests PASS. Any test that pattern-matches on `evidence_1`-style IDs is updated to the abbreviated form (`evid_1`).

- [ ] **Step 5: Commit**

```bash
git add skills/design-proof-system/references/domain/tags.js skills/design-proof-system/references/domain/__tests__/_fixtures/inMemorySubstrate.js skills/design-proof-system/references/domain/__tests__/bridge-integration.test.js
git commit -m "chore(design-proof-system): pin abbreviated id-prefix convention; extend fixture allocator"
```

---

## Task 1: D8 — Update VOCABULARY.md source enum documentation

**Type:** docs-producing
**Implements:** AC-8.1
**Decision budget:** 0
**Must remain green:** `none` (docs-only)

**Files:**
- Modify: `skills/design-proof-system/references/domain/VOCABULARY.md:50`

**Steps (TDD):**

- [ ] **Step 1: Read current VOCABULARY.md line 50**

Run: `sed -n '48,55p' skills/design-proof-system/references/domain/VOCABULARY.md`
Expected output includes: `` - `source` — on Evidence: the attribution of the factual claim (e.g. `'design-decision'`, `'rfc'`). ``

- [ ] **Step 2: Confirm tags.js EVIDENCE_SOURCE_ENUM values**

Run: `sed -n '20,25p' skills/design-proof-system/references/domain/tags.js`
Expected output shows the four values: `industry`, `codebase`, `prior-record`, `agent-derivation`.

- [ ] **Step 3: Update the line in VOCABULARY.md**

Edit `VOCABULARY.md` line 50. Replace the free-form description with the closed-enum text:

```markdown
- `source` — on Evidence: the closed four-value enum `EVIDENCE_SOURCE_ENUM` from `tags.js`. One of: `'industry'`, `'codebase'`, `'prior-record'`, `'agent-derivation'`. The engine rejects any other value with `SHAPE_INVALID`.
```

- [ ] **Step 4: Verify the four enum values are now present**

Run: `grep -c "'industry'\|'codebase'\|'prior-record'\|'agent-derivation'" skills/design-proof-system/references/domain/VOCABULARY.md`
Expected: ≥ 4 (one or more occurrences of each value).

- [ ] **Step 5: Commit**

```bash
git add skills/design-proof-system/references/domain/VOCABULARY.md
git commit -m "docs(design-proof-system): document closed source enum in VOCABULARY.md (D8)"
```

---

## Task 2: D9 — Payload-channel utilities in domain-bridge.js

**Type:** code-producing
**Implements:** AC-9.1, AC-9.2
**Decision budget:** 1 (sentinel format spelling — pin to `===== PAYLOAD_START =====` / `===== PAYLOAD_END =====`)
**Must remain green:** `bridge-integration.test.js`, `sprint-02-bug-fix-07.test.js` (new)

**Files:**
- Modify: `skills/design-proof-system/references/domain/domain-bridge.js` (append two exported helpers near the top of the file, before `createDomainBridge`)
- Modify: `skills/design-proof-system/references/domain/VOCABULARY.md` (append a short "Structured payload channel" subsection at end of file)
- Create: `skills/design-proof-system/references/domain/__tests__/sprint-02-bug-fix-07.test.js`

**Steps (TDD):**

- [ ] **Step 1: Write the failing test (creates the new test file)**

Create `skills/design-proof-system/references/domain/__tests__/sprint-02-bug-fix-07.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { createPayloadChannel, parsePayloadChannel } from '../domain-bridge.js';

describe('D9 — Payload channel utilities', () => {
  it('AC-9.1 round-trips content through createPayloadChannel + parsePayloadChannel', () => {
    const content = 'evidence claim text with\nmultiple lines\nand "quotes"';
    const wrapped = createPayloadChannel(content);
    expect(wrapped.startsWith('===== PAYLOAD_START =====')).toBe(true);
    expect(wrapped.endsWith('===== PAYLOAD_END =====')).toBe(true);
    expect(parsePayloadChannel(wrapped)).toBe(content);
  });

  it('AC-9.2 returns null when sentinels are missing', () => {
    expect(parsePayloadChannel('no sentinels here')).toBeNull();
    expect(parsePayloadChannel('===== PAYLOAD_START =====\ncontent without end')).toBeNull();
    expect(parsePayloadChannel('content without start =====\n===== PAYLOAD_END =====')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd skills/design-proof-system/references/domain && npx vitest run __tests__/sprint-02-bug-fix-07.test.js`
Expected: FAIL with `SyntaxError` or `ReferenceError: createPayloadChannel is not exported from domain-bridge.js`.

- [ ] **Step 3: Implement the helpers in domain-bridge.js**

Append near the top of `domain-bridge.js` (after the imports block, before `createDomainBridge`):

```js
/**
 * D9 — Stable payload channel for transport-fragile structured content. Wraps a payload
 * in sentinel delimiters so receiving agents can extract the content without depending
 * on markdown rendering.
 *
 * @param {string} content
 * @returns {string} wrapped payload
 */
export function createPayloadChannel(content) {
  return `===== PAYLOAD_START =====\n${content}\n===== PAYLOAD_END =====`;
}

/**
 * D9 — Unwrap a payload channel string. Returns the content between the sentinels,
 * or null if the input is malformed (missing either sentinel).
 *
 * @param {string} raw
 * @returns {string | null}
 */
export function parsePayloadChannel(raw) {
  if (typeof raw !== 'string') return null;
  const startIdx = raw.indexOf('===== PAYLOAD_START =====\n');
  const endIdx = raw.indexOf('\n===== PAYLOAD_END =====');
  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) return null;
  return raw.slice(startIdx + '===== PAYLOAD_START =====\n'.length, endIdx);
}
```

- [ ] **Step 4: Append a "Structured payload channel" subsection to VOCABULARY.md**

Append at end of `VOCABULARY.md`:

```markdown
## Structured payload channel

For payloads whose content is transport-fragile (typed-element addition payloads delivered through agent message envelopes that may strip or hide markdown), use the helpers exported from `domain-bridge.js`:

- `createPayloadChannel(content: string): string` — wraps content in sentinel delimiters
- `parsePayloadChannel(raw: string): string | null` — extracts content between sentinels, or null on malformed input

Format: `===== PAYLOAD_START =====\n<content>\n===== PAYLOAD_END =====`.

Receiving agents call `parsePayloadChannel` on incoming messages whose intended payload may have been transformed. The sentinel format is stable and verified by the D9 round-trip tests.
```

- [ ] **Step 5: Run test to verify the utility tests pass**

Run: `cd skills/design-proof-system/references/domain && npx vitest run __tests__/sprint-02-bug-fix-07.test.js`
Expected: PASS — both `AC-9.1` and `AC-9.2` cases green.

- [ ] **Step 6: Commit**

```bash
git add skills/design-proof-system/references/domain/domain-bridge.js skills/design-proof-system/references/domain/VOCABULARY.md skills/design-proof-system/references/domain/__tests__/sprint-02-bug-fix-07.test.js
git commit -m "feat(design-proof-system): add D9 payload channel utilities + docs"
```

---

## Task 3: D3 — Inline argShape on PRESENT_CLOSING_ARGUMENT

**Type:** code-producing
**Implements:** AC-3.1
**Decision budget:** 1 (whether to also export `CLOSING_ARGUMENT_ARG_SHAPE` as a named constant; pinned: yes, mirror the WITHDRAW pattern at mutations.js:101–105)
**Must remain green:** `mutations.test.js`, `sprint-02-bug-fix-07.test.js`

**Files:**
- Modify: `skills/design-proof-system/references/domain/mutations.js:163-172` (add `argShape` to `PRESENT_CLOSING_ARGUMENT` OperationSpec)
- Modify: `skills/design-proof-system/references/domain/__tests__/sprint-02-bug-fix-07.test.js` (add D3 describe block)

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Add to `sprint-02-bug-fix-07.test.js`:

```js
import { OPERATION_SPECS } from '../mutations.js';
import * as tags from '../tags.js';

describe('D3 — presentClosingArgument has its own argShape', () => {
  it('AC-3.1 OPERATION_SPECS[PRESENT_CLOSING_ARGUMENT] carries an inline argShape with no required fields', () => {
    const spec = OPERATION_SPECS[tags.ACTION_LABELS.PRESENT_CLOSING_ARGUMENT];
    expect(spec.argShape).toBeDefined();
    expect(spec.argShape).toMatchObject({ requiredFields: [], closedEnumFields: {} });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd skills/design-proof-system/references/domain && npx vitest run __tests__/sprint-02-bug-fix-07.test.js -t "D3"`
Expected: FAIL with `expected undefined to be defined` on `spec.argShape`.

- [ ] **Step 3: Add the argShape descriptor to PRESENT_CLOSING_ARGUMENT**

In `mutations.js`, modify lines 163–172 to insert an `argShape` field:

```js
  [ACTION_LABELS.PRESENT_CLOSING_ARGUMENT]: {
    consentCategory: CONSENT_SOURCES.DESIGNER,
    preconditions: [],
    idShape: ELEMENT_CATEGORIES.EVIDENCE,
    // D3: present_closing_argument has no Evidence-shaped args; provide an inline argShape
    // descriptor with no required fields so verifyArgsShape does not pull in Evidence-category
    // requirements (source, statement) at line 234.
    argShape: { requiredFields: [], closedEnumFields: {}, label: 'present_closing_argument' },
    translate: () => ({ baseFacts: [['closure_pending', []]], rules: [], metaFacts: [] }),
    postconditions: [],
    customPostCheck: (args, readPorts) => closureTriggerGate(args, readPorts),
    clearsTwoYes: true,
    resultShape: {},
  },
```

- [ ] **Step 4: Run tests to verify D3 passes and existing mutation tests still pass**

Run: `cd skills/design-proof-system/references/domain && npx vitest run __tests__/sprint-02-bug-fix-07.test.js -t "D3" && npx vitest run __tests__/mutations.test.js`
Expected: D3 PASS; existing `mutations.test.js` continues to pass (the named-verb count is still 8 at this stage).

- [ ] **Step 5: Commit**

```bash
git add skills/design-proof-system/references/domain/mutations.js skills/design-proof-system/references/domain/__tests__/sprint-02-bug-fix-07.test.js
git commit -m "feat(design-proof-system): D3 inline argShape for present_closing_argument"
```

---

## Task 4: D4 — Resolution.problem_anchor accepts concern or risk

**Type:** code-producing
**Implements:** AC-4.1, AC-4.2, AC-4.3
**Decision budget:** 2 (1) update existing `resolution-schema.test.js:36` assertion in lockstep; (2) message-format choice for INVALID_REFERENCE when categoryConstraint is an array — keep default array-stringification, no pretty-print
**Must remain green:** `resolution-schema.test.js`, `bridge-integration.test.js`, `closure-policy.test.js`, `friction-policy.test.js`, `sprint-02-bug-fix-07.test.js`

**Files:**
- Modify: `skills/design-proof-system/references/domain/schema.js:25-35` (add `_existsOneOf` helper); `schema.js:116` (change `problem_anchor: 'concern'` to `['concern', 'risk']`); `schema.js:210-224` (extend `verifyArgsShape` referenceFields loop to handle array values)
- Modify: `skills/design-proof-system/references/domain/__tests__/resolution-schema.test.js:36` (update assertion to `['concern', 'risk']`)
- Modify: `skills/design-proof-system/references/domain/__tests__/sprint-02-bug-fix-07.test.js` (add D4 describe)

**Steps (TDD):**

- [ ] **Step 1: Write failing tests for D4**

Add to `sprint-02-bug-fix-07.test.js`:

```js
import { CATEGORY_REGISTRY, verifyArgsShape } from '../schema.js';
import { createInMemorySubstrate, makeAdapters } from './bridge-integration.test.js'; // assumes existing fixture helpers — adjust import if helpers live elsewhere

describe('D4 — Resolution.problem_anchor accepts concern or risk', () => {
  it('AC-4.1a schema declares array referenceField', () => {
    const desc = CATEGORY_REGISTRY[/* ELEMENT_CATEGORIES.RESOLUTION */ Symbol.for('resolution')]; // adjust per actual symbol access
    // If symbols are not accessible by Symbol.for, iterate keys to find RESOLUTION
    // (the test author will reuse the existing pattern from resolution-schema.test.js)
    expect(desc.referenceFields.problem_anchor).toEqual(['concern', 'risk']);
  });

  it('AC-4.1b addResolution with risk_id problem_anchor succeeds', () => {
    const { bridge } = createInMemorySubstrate();
    // Author a Risk first, then a Resolution that anchors it.
    bridge.addElement({ idShape: 'risk', statement: 'a risk', basis: [] }, { source: 'designer' });
    const result = bridge.addElement({ idShape: 'resolution', statement: 'covers the risk', problem_anchor: /* the risk id from the prior call */, grounding: [/* prop id */] }, { source: 'designer' });
    expect(result.id).toMatch(/^res/);
  });

  it('AC-4.1c addResolution with unknown anchor returns INVALID_REFERENCE', () => {
    const { bridge } = createInMemorySubstrate();
    expect(() => bridge.addElement({ idShape: 'resolution', statement: 'x', problem_anchor: 'no_such_id', grounding: [] }, { source: 'designer' }))
      .toThrow(/INVALID_REFERENCE/);
  });

  it('AC-4.2 closure blocks on unaddressed risk, unblocks when addressed', () => {
    // Author Risk, query closure → expect coverage_gap_detected.
    // Add+ratify Resolution anchoring the Risk, query closure → expect permitted true.
    // (Detailed setup mirrors existing bridge-integration test patterns.)
  });

  it('AC-4.3 closure unaffected when zero active risks exist', () => {
    // Author a Concern (covered) and zero Risks, query closure → permitted true.
  });
});
```

- [ ] **Step 2: Run failing tests**

Run: `cd skills/design-proof-system/references/domain && npx vitest run __tests__/sprint-02-bug-fix-07.test.js -t "D4"`
Expected: FAIL — assertion sees `'concern'` not `['concern', 'risk']`.

- [ ] **Step 3: Apply schema and verifier changes**

In `schema.js`:

1. Add `_existsOneOf` helper (near `_existsCategory` at line 33):

```js
// D4: probe membership across multiple candidate categories. Returns true if id exists in
// any of the listed categories. Used by verifyArgsShape for array-valued referenceFields.
function _existsOneOf(readPort, id, categoryKeys) {
  for (const key of categoryKeys) {
    if (_existsCategory(readPort, id, key)) return true;
  }
  return false;
}
```

2. Change `schema.js:116` (RESOLUTION's referenceFields):

```js
    referenceFields: { problem_anchor: ['concern', 'risk'], grounding: 'proposition' },
```

3. Extend `verifyArgsShape` referenceFields loop (schema.js:210-224) to handle arrays:

```js
  if (readPort) {
    for (const [field, categoryConstraint] of Object.entries(desc.referenceFields ?? {})) {
      if (!(field in args)) continue;
      const raw = args[field];
      const ids = Array.isArray(raw) ? raw : [raw];
      const isArrayConstraint = Array.isArray(categoryConstraint);
      for (const id of ids) {
        const ok = isArrayConstraint
          ? _existsOneOf(readPort, id, categoryConstraint)
          : _existsCategory(readPort, id, categoryConstraint);
        if (!ok) {
          throw Object.assign(
            new Error(`INVALID_REFERENCE: field "${field}" for ${label} references non-existent ${categoryConstraint === '*' ? 'element' : (isArrayConstraint ? categoryConstraint.join(' or ') : categoryConstraint)} "${id}"`),
            { code: 'INVALID_REFERENCE', field, referencedId: id }
          );
        }
      }
    }
  }
```

4. Update `__tests__/resolution-schema.test.js:36` assertion from `'concern'` to `['concern', 'risk']`.

No changes to `closure-policy.js` or `friction-policy.js` — the existing `effective_addresses_rule` is generic on `C` and `coverage_gap_rule` self-corrects (per ground-truth report M1).

- [ ] **Step 4: Run tests to verify D4 passes and no regressions**

Run: `cd skills/design-proof-system/references/domain && npx vitest run __tests__/`
Expected: all `__tests__/*.test.js` PASS, including updated `resolution-schema.test.js` and new D4 cases.

- [ ] **Step 5: Commit**

```bash
git add skills/design-proof-system/references/domain/schema.js skills/design-proof-system/references/domain/__tests__/resolution-schema.test.js skills/design-proof-system/references/domain/__tests__/sprint-02-bug-fix-07.test.js
git commit -m "feat(design-proof-system): D4 problem_anchor accepts concern or risk (schema-only)"
```

---

## Task 5: D7 — Concern carries optional notes array

**Type:** code-producing
**Implements:** AC-7.1, AC-7.2
**Decision budget:** 1 (where `notes` field lives in `args` shape — pinned: top-level optional field, same as `description`)
**Must remain green:** `concern-schema.test.js`, `translation.test.js`, `bridge-integration.test.js`, `sprint-02-bug-fix-07.test.js`

**Files:**
- Modify: `skills/design-proof-system/references/domain/schema.js` (CONCERN entry — add `'notes'` to optionalFields)
- Modify: `skills/design-proof-system/references/domain/translation.js:69-76` (CONCERN translator — emit `concern_note` facts for each entry in `args.notes`); also add `concern_note` to `EDB_PREDICATES` set (lookup the existing set declaration around `translation.js:194`)
- Modify: `skills/design-proof-system/references/domain/domain-bridge.js:50` and `:198` (add `concern_note` to the `validPredicates` augmentation in BOTH `createDomainBridge` and `createDomainBridgeWith`)
- Modify: `skills/design-proof-system/references/domain/__tests__/sprint-02-bug-fix-07.test.js` (add D7 describe)

**Steps (TDD):**

- [ ] **Step 1: Write failing tests**

Add to `sprint-02-bug-fix-07.test.js`:

```js
describe('D7 — Concern carries optional notes array', () => {
  it('AC-7.1 addConcern with notes emits concern_note facts', () => {
    const { bridge, engine } = createInMemorySubstrate();
    const result = bridge.addConcern({ label: 'placement', description: 'where', notes: ['hybrid-case', 'sequencing'] }, { source: 'designer' });
    const notes = engine.query.query(['concern_note', [result.id, { var: 'N' }]]);
    expect(notes).toHaveLength(2);
    expect(notes.map(r => r.N).sort()).toEqual(['hybrid-case', 'sequencing']);
  });

  it('AC-7.1b addConcern without notes emits zero concern_note facts', () => {
    const { bridge, engine } = createInMemorySubstrate();
    const result = bridge.addConcern({ label: 'plain', description: 'x' }, { source: 'designer' });
    const notes = engine.query.query(['concern_note', [result.id, { var: 'N' }]]);
    expect(notes).toHaveLength(0);
  });

  it('AC-7.2 concern_note facts appear in projection', () => {
    const { bridge } = createInMemorySubstrate();
    bridge.addConcern({ label: 'c1', notes: ['n1', 'n2'] }, { source: 'designer' });
    const projection = bridge.renderDatalogProjection({});
    expect(projection.facts.some(f => f[0] === 'concern_note')).toBe(true);
  });
});
```

- [ ] **Step 2: Run failing tests**

Run: `cd skills/design-proof-system/references/domain && npx vitest run __tests__/sprint-02-bug-fix-07.test.js -t "D7"`
Expected: FAIL — concern_note facts not emitted; projection lacks predicate.

- [ ] **Step 3: Apply changes**

1. In `schema.js`, find the CONCERN entry in `CATEGORY_REGISTRY` and add `'notes'` to its `optionalFields` (or add `optionalFields: ['notes']` if absent).

2. In `translation.js:69-76`, extend the CONCERN translator:

```js
  [ELEMENT_CATEGORIES.CONCERN]: (args, id, ts) => {
    const baseFacts = [
      ['concern', [id, args.label, args.description ?? '']],
      ['concern_status', [id, 'draft']],
    ];
    if (Array.isArray(args.notes)) {
      for (const note of args.notes) baseFacts.push(['concern_note', [id, note]]);
    }
    return { baseFacts, rules: [], metaFacts: [['created_at', [id, ts]]] };
  },
```

3. In `translation.js` near line 194 (`EDB_PREDICATES` set declaration), add `'concern_note'` to the set. Also add `concern_note: 2` to `PROJECTION_ARITIES` if a separate arity map is used by `renderDatalogProjection`. **Do NOT add `concern_note` to `_ARITIES` in render.js** — that map is for primary declaration predicates only (per ground-truth report M2). `concern_note` will be added to `_SECONDARY_QUERIES` in Task 6.

4. In `domain-bridge.js`, line 50 (`createDomainBridge`), append `'concern_note'` to the validPredicates seed array. **Do NOT touch `createDomainBridgeWith` (line 198) — it is out of scope per Cross-Cutting Decisions; the unconditional throw at line 228 prevents any new code path from being exercised through that factory.**

- [ ] **Step 4: Run tests**

Run: `cd skills/design-proof-system/references/domain && npx vitest run __tests__/`
Expected: D7 PASS; existing tests still PASS.

- [ ] **Step 5: Commit**

```bash
git add skills/design-proof-system/references/domain/schema.js skills/design-proof-system/references/domain/translation.js skills/design-proof-system/references/domain/domain-bridge.js skills/design-proof-system/references/domain/__tests__/sprint-02-bug-fix-07.test.js
git commit -m "feat(design-proof-system): D7 optional notes field on Concern"
```

---

## Task 6: D10 — renderElementDeep returns full element record via _SECONDARY_QUERIES

**Type:** code-producing
**Implements:** AC-10.1, AC-10.2, AC-10.3, AC-7.3
**Decision budget:** 2 (the satellite-predicate set per category; the array-vs-scalar policy per satellite — pinned in step 3 below)
**Must remain green:** `render.test.js`, `bridge-integration.test.js`, `sprint-02-bug-fix-07.test.js`

**Files:**
- Modify: `skills/design-proof-system/references/domain/render.js:106-131` (add `_SECONDARY_QUERIES` map; extend `renderElementDeep` to run secondary queries after primary match)
- Modify: `skills/design-proof-system/references/domain/__tests__/sprint-02-bug-fix-07.test.js` (add D10 describe)

**Steps (TDD):**

- [ ] **Step 1: Write failing tests**

Add to `sprint-02-bug-fix-07.test.js`:

```js
describe('D10 — renderElementDeep returns full element record', () => {
  it('AC-10.1 Proposition record includes grounding, collapse_test, reasoning_chain, rejected_alternative', () => {
    const { bridge } = createInMemorySubstrate();
    // author Evidence + Rule + Permission first, then author and ratify a Proposition
    const propId = /* setup omitted */ '';
    const record = bridge.renderElementDeep({ id: propId });
    expect(record).toMatchObject({
      id: propId,
      grounding: expect.any(Array),
      collapse_test: expect.any(String),
      reasoning_chain: expect.any(String),
    });
  });

  it('AC-10.2 Resolution record includes problem_anchor and grounding', () => {
    const { bridge } = createInMemorySubstrate();
    // setup omitted
    const record = bridge.renderElementDeep({ id: /* resolution id */ '' });
    expect(record).toMatchObject({ problem_anchor: expect.any(String), grounding: expect.any(Array) });
  });

  it('AC-10.3 / AC-7.3 Concern record includes notes array', () => {
    const { bridge } = createInMemorySubstrate();
    const c1 = bridge.addConcern({ label: 'c1', notes: ['obligation X'] }, { source: 'designer' });
    const c2 = bridge.addConcern({ label: 'c2' }, { source: 'designer' });
    expect(bridge.renderElementDeep({ id: c1.id }).notes).toEqual(['obligation X']);
    expect(bridge.renderElementDeep({ id: c2.id }).notes).toEqual([]);
  });
});
```

- [ ] **Step 2: Run failing tests**

Run: `cd skills/design-proof-system/references/domain && npx vitest run __tests__/sprint-02-bug-fix-07.test.js -t "D10"`
Expected: FAIL — secondary fields missing from returned record.

- [ ] **Step 3: Add `_SECONDARY_QUERIES` map and extend `renderElementDeep`**

In `render.js`, append after the existing `_ARITIES` (around line 115):

```js
// D10: secondary-predicate queries keyed by primary declaration predicate. After
// renderElementDeep matches the primary predicate, each satellite is queried and
// merged into the returned record. multi=true means the satellite produces an array
// (zero or more rows); multi=false means a scalar (zero or one row, undefined or value).
const _SECONDARY_QUERIES = Object.freeze({
  proposition_decl: [
    { pred: 'proposition_grounding', arity: 2, varName: 'E', field: 'grounding', multi: true },
    { pred: 'collapse_test',           arity: 2, varName: 'T', field: 'collapse_test',  multi: false },
    { pred: 'reasoning_chain',         arity: 2, varName: 'T', field: 'reasoning_chain', multi: false },
    { pred: 'rejected_alternative',    arity: 3, varName: ['A','R'], field: 'rejected_alternative', multi: true },
  ],
  resolution_decl: [
    { pred: 'resolution_anchor',   arity: 2, varName: 'C', field: 'problem_anchor', multi: false },
    { pred: 'resolution_grounding', arity: 2, varName: 'E', field: 'grounding',     multi: true },
  ],
  risk: [
    { pred: 'risk_basis', arity: 2, varName: 'E', field: 'basis', multi: true },
  ],
  concern: [
    { pred: 'concern_status', arity: 2, varName: 'S', field: 'status', multi: false },
    { pred: 'concern_note',   arity: 2, varName: 'N', field: 'notes',  multi: true },
  ],
  definition_decl: [
    { pred: 'definition_scope', arity: 2, varName: 'S', field: 'scope', multi: false },
  ],
  permission_decl: [
    { pred: 'permission_scope', arity: 2, varName: 'S', field: 'scope', multi: false },
    { pred: 'permission',       arity: 2, varName: 'R', field: 'relieves', multi: false },
  ],
});
```

**Also add `concern: 3` to the existing `_ARITIES` map** (render.js:106-115) so `renderElementDeep`'s primary-predicate scan matches Concern ids. Without this, all Concern paths through `renderElementDeep` return null silently. Updated `_ARITIES` block:

```js
const _ARITIES = Object.freeze({
  evidence: 3,
  rule_decl: 2,
  permission_decl: 2,
  proposition_decl: 3,
  risk: 3,
  resolution_decl: 2,
  friction: 5,
  definition_decl: 3,
  concern: 3,
});
```

Modify `renderElementDeep` (currently render.js:117-131) to run secondary queries:

```js
export function renderElementDeep(args, readPorts) {
  if (!args || !args.id) return null;
  const { id } = args;
  const withdrawn = _withdrewIdSet(readPorts).has(id);
  for (const [pred, arity] of Object.entries(_ARITIES)) {
    if (arity < 1) continue;
    const pattern = [id, ...Array(arity - 1).fill('_')];
    const rows = readPorts.query.query([pred, pattern]);
    if (rows.length) {
      const base = { id, predicate: pred, withdrawn, ...rows[0] };
      const queries = _SECONDARY_QUERIES[pred] ?? [];
      for (const q of queries) {
        const varBindings = Array.isArray(q.varName) ? q.varName.map(v => ({ var: v })) : [{ var: q.varName }];
        const satellitePattern = [id, ...varBindings];
        const satelliteRows = readPorts.query.query([q.pred, satellitePattern]);
        if (q.multi) {
          // For single-var multi rows, return [row[varName], ...]. For multi-var
          // (e.g. rejected_alternative arity 3), return [[row[v0], row[v1]], ...].
          base[q.field] = satelliteRows.map(r => Array.isArray(q.varName)
            ? q.varName.map(v => r[v])
            : r[q.varName]);
        } else {
          base[q.field] = satelliteRows.length > 0 ? satelliteRows[0][q.varName] : undefined;
        }
      }
      // Default empty array for notes when no facts exist — caller expects `notes: []` not undefined.
      if (pred === 'concern' && !Array.isArray(base.notes)) base.notes = [];
      return base;
    }
  }
  return null;
}
```

- [ ] **Step 4: Run tests**

Run: `cd skills/design-proof-system/references/domain && npx vitest run __tests__/`
Expected: D10 PASS; existing render tests PASS.

- [ ] **Step 5: Commit**

```bash
git add skills/design-proof-system/references/domain/render.js skills/design-proof-system/references/domain/__tests__/sprint-02-bug-fix-07.test.js
git commit -m "feat(design-proof-system): D10 renderElementDeep returns full record via _SECONDARY_QUERIES"
```

---

## Task 7: D1 — RATIFY skips ID allocation

**Type:** code-producing
**Implements:** AC-1.1
**Decision budget:** 1 (whether the JSDoc invariant goes on `generateId`/`ports.ids.next` call site or on the OperationSpec — pinned: on the call site at mutations.js:250, where the gate is)
**Must remain green:** `mutations.test.js`, `bridge-integration.test.js`, `sprint-02-bug-fix-07.test.js`

**Files:**
- Modify: `skills/design-proof-system/references/domain/mutations.js:248-250` (gate `ports.ids.next` to skip on RATIFY)
- Modify: `skills/design-proof-system/references/domain/__tests__/sprint-02-bug-fix-07.test.js` (add D1 describe)

**Steps (TDD):**

- [ ] **Step 1: Write failing test**

Add to `sprint-02-bug-fix-07.test.js`:

```js
describe('D1 — RATIFY does not advance the ID allocator', () => {
  it('AC-1.1 add+ratify advances counter exactly once (the ADD)', () => {
    const { bridge, idAllocator } = createInMemorySubstrate();
    // Author a Concern (advances concernCounter), ratify it (must not advance further).
    const c = bridge.addConcern({ label: 'x' }, { source: 'designer' });
    const before = idAllocator.highWater('concern');
    bridge.ratifyConcern({ elementId: c.id }, { source: 'designer' });
    const after = idAllocator.highWater('concern');
    expect(after).toBe(before);
  });
});
```

(This test depends on `idAllocator.highWater` — that method is added in Task 10. To unblock Task 7's test, the fixture's allocator can implement `highWater` from day 1, since the fixture is test-owned. Plan-build asserts: the fixture's `idAllocator` exposes `highWater(shape)` returning the current counter.)

- [ ] **Step 2: Run failing test**

Run: `cd skills/design-proof-system/references/domain && npx vitest run __tests__/sprint-02-bug-fix-07.test.js -t "D1"`
Expected: FAIL — counter advanced by 1 during ratify (current code at mutations.js:250 calls `ports.ids.next` unconditionally).

- [ ] **Step 3: Gate the allocator call**

In `mutations.js`, modify line 250 (the unconditional `ports.ids.next` call inside the try block):

```js
    // §6.1 step 5: assert facts + define rules
    // D1 invariant: RATIFY MUST NOT advance the ID allocator. The ratify translate path
    // uses args.elementId directly (already known) — the allocator slot would be discarded.
    let id = null;
    if (verbName !== ACTION_LABELS.RATIFY) {
      id = ports.ids.next(targetShape);
    }
    const ts = ports.clock.now();
    const { baseFacts, rules, metaFacts } = spec.translate(args, id, ts);
```

Note: the existing code at line 247 declares `let id = null;` before the try block. Confirm the redundant declaration is removed inside the try (the outer `let id = null` at line 247 stays so the catch block can reference it; the inner branch only reassigns).

- [ ] **Step 4: Run tests**

Run: `cd skills/design-proof-system/references/domain && npx vitest run __tests__/`
Expected: D1 PASS; all existing mutation and bridge tests PASS.

- [ ] **Step 5: Commit**

```bash
git add skills/design-proof-system/references/domain/mutations.js skills/design-proof-system/references/domain/__tests__/sprint-02-bug-fix-07.test.js
git commit -m "feat(design-proof-system): D1 RATIFY skips allocator (counter parity invariant)"
```

---

## Task 8: D2 — Optional caller-supplied id on ADD

**Type:** code-producing
**Implements:** AC-2.1, AC-2.2, AC-2.3
**Decision budget:** 2 (prefix-derivation source — pinned: pin a small `_ID_PREFIXES` map in `mutations.js` keyed by `ELEMENT_CATEGORIES`; export `_existsAnyCategory` from `schema.js` rather than implementing a third copy)
**Must remain green:** `mutations.test.js`, `bridge-integration.test.js`, `sprint-02-bug-fix-07.test.js`

**Files:**
- Modify: `skills/design-proof-system/references/domain/schema.js:25-31` (export the existing private `_existsAnyCategory` helper)
- Modify: `skills/design-proof-system/references/domain/mutations.js` (import `_existsAnyCategory`; add `_ID_PREFIXES` table; insert optional-id check before the allocator call; add `DUPLICATE_ID` and `ID_PREFIX_MISMATCH` error throws)
- Modify: `skills/design-proof-system/references/domain/__tests__/sprint-02-bug-fix-07.test.js` (add D2 describe)

**Steps (TDD):**

- [ ] **Step 1: Write failing tests**

Add to `sprint-02-bug-fix-07.test.js`:

```js
describe('D2 — Optional caller-supplied id', () => {
  it('AC-2.1 supplied unique id is used; counter not advanced', () => {
    const { bridge, idAllocator } = createInMemorySubstrate();
    const before = idAllocator.highWater('evidence');
    const r = bridge.addElement({ idShape: 'evidence', id: 'evid_5', source: 'codebase', statement: 'x' }, { source: 'designer' });
    expect(r.id).toBe('evid_5');
    expect(idAllocator.highWater('evidence')).toBe(before);
  });

  it('AC-2.2 supplied id colliding with existing throws DUPLICATE_ID', () => {
    const { bridge } = createInMemorySubstrate();
    bridge.addElement({ idShape: 'evidence', id: 'evid_5', source: 'codebase', statement: 'x' }, { source: 'designer' });
    expect(() => bridge.addElement({ idShape: 'evidence', id: 'evid_5', source: 'codebase', statement: 'y' }, { source: 'designer' }))
      .toThrow(/DUPLICATE_ID/);
  });

  it('AC-2.3 supplied id with mismatched prefix throws ID_PREFIX_MISMATCH', () => {
    const { bridge } = createInMemorySubstrate();
    expect(() => bridge.addElement({ idShape: 'evidence', id: 'concern_1', source: 'codebase', statement: 'x' }, { source: 'designer' }))
      .toThrow(/ID_PREFIX_MISMATCH/);
  });
});
```

- [ ] **Step 2: Run failing tests**

Run: `cd skills/design-proof-system/references/domain && npx vitest run __tests__/sprint-02-bug-fix-07.test.js -t "D2"`
Expected: FAIL — `args.id` ignored, allocator generates a new id; collision check absent.

- [ ] **Step 3: Apply changes**

1. In `schema.js`, change `function _existsAnyCategory(...)` declaration to `export function _existsAnyCategory(readPort, id) { ... }` (export added; signature otherwise unchanged at schema.js:25-31).

2. In `mutations.js`, import the canonical `ID_PREFIXES` from `tags.js` (added in Task 0); do NOT redefine it:

```js
import { _existsAnyCategory } from './schema.js';
import { ELEMENT_CATEGORIES, ID_PREFIXES } from './tags.js';
```

Per-category prefix lookups use the imported constant directly (`ID_PREFIXES[targetShape]`). No local copy in `mutations.js`.

3. Modify the gated allocator section from Task 7 (mutations.js around line 250) to add the optional-id branch:

```js
    // §6.1 step 5: assert facts + define rules
    let id = null;
    if (verbName !== ACTION_LABELS.RATIFY) {
      // D2: optional caller-supplied id on ADD (and D12 revise verbs once added).
      // Validated for prefix-match and uniqueness; on either failure, throw before commit.
      if ((verbName === ACTION_LABELS.ADD || verbName === ACTION_LABELS.REVISE_PROPOSITION || verbName === ACTION_LABELS.REVISE_RESOLUTION) && args.id) {
        const expectedPrefix = ID_PREFIXES[targetShape];
        if (!expectedPrefix || !args.id.startsWith(expectedPrefix)) {
          throw new DomainError({ code: 'ID_PREFIX_MISMATCH', suppliedId: args.id, expectedPrefix: expectedPrefix ?? '<unknown>' });
        }
        if (_existsAnyCategory(ports.query, args.id)) {
          throw new DomainError({ code: 'DUPLICATE_ID', suppliedId: args.id });
        }
        id = args.id;
      } else {
        id = ports.ids.next(targetShape);
      }
    }
    const ts = ports.clock.now();
```

Note: `ACTION_LABELS.REVISE_PROPOSITION` / `REVISE_RESOLUTION` don't exist yet (they are added in Task 11). For now, the conditional references them via runtime lookup; since `ACTION_LABELS.REVISE_PROPOSITION` is `undefined` at this point, the equality test `verbName === undefined` will never be true and the branch is dead until Task 11 lands the labels. This is intentional — Task 8 lands the structural support so Task 11 only needs to add the labels and OperationSpec entries.

- [ ] **Step 4: Run tests**

Run: `cd skills/design-proof-system/references/domain && npx vitest run __tests__/`
Expected: D2 PASS; existing tests PASS.

- [ ] **Step 5: Commit**

```bash
git add skills/design-proof-system/references/domain/schema.js skills/design-proof-system/references/domain/mutations.js skills/design-proof-system/references/domain/__tests__/sprint-02-bug-fix-07.test.js
git commit -m "feat(design-proof-system): D2 optional caller-supplied id with collision + prefix validation"
```

---

## Task 9: D6 — Mutation result carries full element record

**Type:** code-producing
**Implements:** AC-6.1, AC-6.2
**Decision budget:** 2 (whether to enrich for every mutation or gate by `spec.resultShape.fullRecord` — pinned: gate by flag; preserve `{}` for verbs whose spec.resultShape is empty)
**Must remain green:** `mutations.test.js`, `bridge-integration.test.js`, `sprint-02-bug-fix-07.test.js`

**Files:**
- Modify: `skills/design-proof-system/references/domain/mutations.js:50-183` (set `resultShape: { id: true, fullRecord: true }` on ADD, REVISE OperationSpec entries)
- Modify: `skills/design-proof-system/references/domain/mutations.js:320-321` (step 12: when `spec.resultShape.fullRecord`, call `render.renderElementDeep({ id }, readPorts)` and merge into result)
- Modify: `skills/design-proof-system/references/domain/__tests__/sprint-02-bug-fix-07.test.js` (add D6 describe)

**Steps (TDD):**

- [ ] **Step 1: Write failing tests**

Add to `sprint-02-bug-fix-07.test.js`:

```js
describe('D6 — Mutation result carries full element record', () => {
  it('AC-6.1 addElement EVIDENCE result includes statement and source', () => {
    const { bridge } = createInMemorySubstrate();
    const r = bridge.addElement({ idShape: 'evidence', source: 'codebase', statement: 'observed' }, { source: 'designer' });
    expect(r).toMatchObject({ id: expect.stringMatching(/^evid/), source: 'codebase', statement: 'observed' });
  });

  it('AC-6.2 reviseConcern result includes updated description and notes', () => {
    const { bridge } = createInMemorySubstrate();
    const c = bridge.addConcern({ label: 'X', description: 'Y', notes: [] }, { source: 'designer' });
    const revised = bridge.reviseConcern({ supersedes: c.id, label: 'X', description: 'Z' }, { source: 'designer' });
    expect(revised).toMatchObject({ description: 'Z', notes: [] });
  });
});
```

- [ ] **Step 2: Run failing tests**

Run: `cd skills/design-proof-system/references/domain && npx vitest run __tests__/sprint-02-bug-fix-07.test.js -t "D6"`
Expected: FAIL — result is `{ id }` only.

- [ ] **Step 3: Apply changes**

1. In `mutations.js`, update ADD and REVISE OperationSpec `resultShape` fields:

```js
  [ACTION_LABELS.ADD]: {
    /* ...existing fields... */
    resultShape: { id: true, fullRecord: true },
  },
  [ACTION_LABELS.REVISE]: {
    /* ...existing fields... */
    resultShape: { id: true, fullRecord: true },
  },
```

2. In `mutations.js` step 12 (line 320-321), enrich the result when `fullRecord` is set:

```js
  // §6.1 step 12: build result
  let result = spec.resultShape && 'id' in spec.resultShape ? { id } : {};
  if (spec.resultShape && spec.resultShape.fullRecord && id) {
    const readPorts = { query: ports.query, explain: ports.explain };
    // Import the render module at the top of mutations.js: `import * as render from './render.js';`
    const deep = render.renderElementDeep({ id }, readPorts);
    if (deep) result = { ...result, ...deep };
  }
```

Add the render import at the top of `mutations.js` (alongside existing imports):

```js
import * as render from './render.js';
```

- [ ] **Step 4: Run tests**

Run: `cd skills/design-proof-system/references/domain && npx vitest run __tests__/`
Expected: D6 PASS; existing tests PASS (no shape regressions on tests that destructure `result.id`).

- [ ] **Step 5: Commit**

```bash
git add skills/design-proof-system/references/domain/mutations.js skills/design-proof-system/references/domain/__tests__/sprint-02-bug-fix-07.test.js
git commit -m "feat(design-proof-system): D6 mutation result carries full element record"
```

---

## Task 10: D11 — Pre-ratify vocabulary lint gate

**Type:** code-producing
**Implements:** AC-11.1, AC-11.2, AC-11.3
**Decision budget:** 3 (matching logic strictness — pinned: canonical-term substring match where the substring differs only in case from a ratified Definition's canonical_name; what counts as element "text fields" — pinned: all string-valued fields from `renderElementDeep`; whether to short-circuit on zero ratified Definitions — pinned: yes per AC-11.3)
**Must remain green:** `mutations.test.js`, `bridge-integration.test.js`, `sprint-02-bug-fix-07.test.js`

**Files:**
- Modify: `skills/design-proof-system/references/domain/mutations.js` (add `_vocabularyLintCheck` helper near top of file; invoke from `runOperation` when `verbName === ACTION_LABELS.RATIFY`, after step 8, before step 9)
- Modify: `skills/design-proof-system/references/domain/__tests__/sprint-02-bug-fix-07.test.js` (add D11 describe)

**Steps (TDD):**

- [ ] **Step 1: Write failing tests**

Add to `sprint-02-bug-fix-07.test.js`:

```js
describe('D11 — Pre-ratify vocabulary lint', () => {
  it('AC-11.3 no ratified definitions → ratify passes regardless of text', () => {
    const { bridge } = createInMemorySubstrate();
    const c = bridge.addConcern({ label: 'reachability' }, { source: 'designer' });
    expect(() => bridge.ratifyConcern({ elementId: c.id }, { source: 'designer' })).not.toThrow();
  });

  it('AC-11.1 element using uncapitalized variant of ratified canonical term throws VOCABULARY_LINT_VIOLATION', () => {
    const { bridge } = createInMemorySubstrate();
    const d = bridge.addDefinition({ canonical_name: 'Reachability', definition: 'the ability...' }, { source: 'designer' });
    bridge.ratifyDefinition({ elementId: d.id }, { source: 'designer' });
    // Also need both DESIGN_PARTNER for two-yes? mirror the existing bridge-integration test setup.
    const c = bridge.addConcern({ label: 'uses reachability everywhere' }, { source: 'designer' });
    expect(() => bridge.ratifyConcern({ elementId: c.id }, { source: 'designer' }))
      .toThrow(/VOCABULARY_LINT_VIOLATION/);
  });

  it('AC-11.2 element using canonical form verbatim passes lint', () => {
    const { bridge } = createInMemorySubstrate();
    const d = bridge.addDefinition({ canonical_name: 'Reachability', definition: 'x' }, { source: 'designer' });
    bridge.ratifyDefinition({ elementId: d.id }, { source: 'designer' });
    const c = bridge.addConcern({ label: 'uses Reachability everywhere' }, { source: 'designer' });
    expect(() => bridge.ratifyConcern({ elementId: c.id }, { source: 'designer' })).not.toThrow();
  });
});
```

- [ ] **Step 2: Run failing tests**

Run: `cd skills/design-proof-system/references/domain && npx vitest run __tests__/sprint-02-bug-fix-07.test.js -t "D11"`
Expected: FAIL — no lint runs; all three tests either pass or fail in incorrect ways.

- [ ] **Step 3: Apply changes**

In `mutations.js`, add the lint helper (near `_resolveElementCategory`):

```js
/**
 * D11 — Pre-ratify vocabulary lint. Reads the target element's text fields and compares
 * each ratified Definition's canonical_name against the text. Flags a violation when the
 * text contains a substring that case-insensitively matches the canonical_name but
 * differs in case (i.e., the canonical form's exact-case match is absent).
 *
 * Returns null when clean, or a payload { field, value, canonicalTerm } when violating.
 *
 * Short-circuits on zero ratified definitions (AC-11.3).
 */
function _vocabularyLintCheck(elementId, ports) {
  const ratifiedDefs = ports.query.query(['definition', [{ var: 'D' }, { var: 'T' }, { var: 'X' }]]);
  if (ratifiedDefs.length === 0) return null;
  const canonicalTerms = ratifiedDefs.map(r => r.T).filter(t => typeof t === 'string' && t.length > 0);
  if (canonicalTerms.length === 0) return null;

  const readPorts = { query: ports.query, explain: ports.explain };
  const record = render.renderElementDeep({ id: elementId }, readPorts);
  if (!record) return null;

  for (const [field, value] of Object.entries(record)) {
    if (typeof value !== 'string' || value.length === 0) continue;
    for (const term of canonicalTerms) {
      // Skip the canonical term itself (the Definition that ratified it).
      const lowerValue = value.toLowerCase();
      const lowerTerm = term.toLowerCase();
      const idx = lowerValue.indexOf(lowerTerm);
      if (idx === -1) continue;
      const matchedSubstring = value.slice(idx, idx + term.length);
      if (matchedSubstring !== term) {
        return { field, value: matchedSubstring, canonicalTerm: term };
      }
    }
  }
  return null;
}
```

Invoke the lint in `runOperation` after step 8 (postconditions, line 295) and before step 9 (customPostCheck):

```js
    // §6.1 step 8b (D11): pre-ratify vocabulary lint. Blocking gate before customPostCheck.
    if (verbName === ACTION_LABELS.RATIFY) {
      const violation = _vocabularyLintCheck(args.elementId, ports);
      if (violation) {
        throw new DomainError({ code: 'VOCABULARY_LINT_VIOLATION', ...violation });
      }
    }
```

- [ ] **Step 4: Run tests**

Run: `cd skills/design-proof-system/references/domain && npx vitest run __tests__/`
Expected: D11 PASS; existing tests PASS (no existing ratify path emits text containing case-variant canonical terms).

- [ ] **Step 5: Commit**

```bash
git add skills/design-proof-system/references/domain/mutations.js skills/design-proof-system/references/domain/__tests__/sprint-02-bug-fix-07.test.js
git commit -m "feat(design-proof-system): D11 pre-ratify vocabulary lint gate"
```

---

## Task 11: D5 — Atomic serialize/restore with allocator state

**Type:** code-producing
**Implements:** AC-5.1, AC-5.2, AC-5.3, AC-5.4
**Decision budget:** 3 (where `highWater` and `seed` live — pinned: on the `idAllocator` port the bridge receives; `extractAllocatorHighWaterMarks` location — pinned: `translation.js` next to EDB_PREDICATES; legacy-snapshot detection — pinned: presence/absence of `allocatorState` key)
**Must remain green:** `serializer-version.test.js` (engine), `bridge-integration.test.js`, `sprint-02-bug-fix-07.test.js`

**Files:**
- Modify: `skills/design-proof-system/references/domain/translation.js` (export `extractAllocatorHighWaterMarks(readPorts)`)
- Modify: `skills/design-proof-system/references/domain/domain-bridge.js:73-163` (append `serializeWithAllocatorState` and `loadFromWithAllocatorState` to the frozen facade in BOTH `createDomainBridge` and `createDomainBridgeWith`)
- Modify: any test fixture under `__tests__/` constructing an `idAllocator` — the fixture must implement `next(shape)`, `seed(counters)`, and `highWater(shape)` (the substrate-level fixture is the canonical test allocator)
- Modify: `skills/design-proof-system/references/domain/__tests__/sprint-02-bug-fix-07.test.js` (add D5 describe)

**Steps (TDD):**

- [ ] **Step 1: Write failing tests**

Add to `sprint-02-bug-fix-07.test.js`:

```js
describe('D5 — Atomic serialize/restore with allocator state', () => {
  it('AC-5.1 serializeWithAllocatorState bundles per-category counters', () => {
    const { bridge, idAllocator } = createInMemorySubstrate();
    bridge.addElement({ idShape: 'evidence', source: 'codebase', statement: 'a' }, { source: 'designer' });
    bridge.addElement({ idShape: 'evidence', source: 'codebase', statement: 'b' }, { source: 'designer' });
    const snapshot = bridge.serializeWithAllocatorState({});
    expect(snapshot).toMatchObject({ engine: expect.any(Object), allocatorState: expect.any(Object) });
    expect(snapshot.allocatorState.evidence).toBe(idAllocator.highWater('evidence'));
  });

  it('AC-5.2 / AC-5.4 loadFromWithAllocatorState restores counters; next add does not collide', () => {
    const { bridge: b1 } = createInMemorySubstrate();
    b1.addElement({ idShape: 'evidence', source: 'codebase', statement: 'a' }, { source: 'designer' });
    const snapshot = b1.serializeWithAllocatorState({});
    const { bridge: b2 } = createInMemorySubstrate();
    b2.loadFromWithAllocatorState({}, snapshot);
    const r = b2.addElement({ idShape: 'evidence', source: 'codebase', statement: 'b' }, { source: 'designer' });
    expect(r.id).toBe('evid_2');
  });

  it('AC-5.3 loading a snapshot with empty allocatorState falls back to EDB scan', () => {
    const { bridge: b1 } = createInMemorySubstrate();
    b1.addElement({ idShape: 'evidence', source: 'codebase', statement: 'a' }, { source: 'designer' });
    const snapshot = b1.serializeWithAllocatorState({});
    snapshot.allocatorState = {}; // tamper to legacy shape
    const { bridge: b2 } = createInMemorySubstrate();
    b2.loadFromWithAllocatorState({}, snapshot);
    const r = b2.addElement({ idShape: 'evidence', source: 'codebase', statement: 'b' }, { source: 'designer' });
    expect(r.id).toBe('evid_2');
  });
});
```

- [ ] **Step 2: Run failing tests**

Run: `cd skills/design-proof-system/references/domain && npx vitest run __tests__/sprint-02-bug-fix-07.test.js -t "D5"`
Expected: FAIL — `bridge.serializeWithAllocatorState is not a function`.

- [ ] **Step 3: Apply changes**

1. In `translation.js`, append (after `EDB_PREDICATES`). Imports `ID_PREFIXES` from `tags.js` — no local prefix-table copy:

```js
import { ID_PREFIXES, ELEMENT_CATEGORIES } from './tags.js';

// D5: scan EDB for highest numeric suffix per category prefix; used as the
// load-time fallback when allocatorState is empty (legacy-snapshot recovery, AC-5.3).
export function extractAllocatorHighWaterMarks(readPorts) {
  // Per-predicate arity-correct query patterns (declaration predicates only).
  const declPredsByCategory = [
    [ELEMENT_CATEGORIES.EVIDENCE,    ['evidence',         [{ var: 'I' }, '_', '_']]],
    [ELEMENT_CATEGORIES.RULE,        ['rule_decl',        [{ var: 'I' }, '_']]],
    [ELEMENT_CATEGORIES.PERMISSION,  ['permission_decl',  [{ var: 'I' }, '_']]],
    [ELEMENT_CATEGORIES.PROPOSITION, ['proposition_decl', [{ var: 'I' }, '_', '_']]],
    [ELEMENT_CATEGORIES.RISK,        ['risk',             [{ var: 'I' }, '_', '_']]],
    [ELEMENT_CATEGORIES.RESOLUTION,  ['resolution_decl',  [{ var: 'I' }, '_']]],
    [ELEMENT_CATEGORIES.FRICTION,    ['friction',         [{ var: 'I' }, '_', '_', '_', '_']]],
    [ELEMENT_CATEGORIES.CONCERN,     ['concern',          [{ var: 'I' }, '_', '_']]],
    [ELEMENT_CATEGORIES.DEFINITION,  ['definition_decl',  [{ var: 'I' }, '_', '_']]],
  ];
  const counters = {};
  for (const [shape, pattern] of declPredsByCategory) {
    const prefix = ID_PREFIXES[shape];
    const rows = readPorts.query.query(pattern);
    for (const row of rows) {
      const id = row.I;
      if (typeof id !== 'string' || !id.startsWith(prefix)) continue;
      const n = parseInt(id.slice(prefix.length), 10);
      if (Number.isFinite(n) && (!counters[shape] || n > counters[shape])) counters[shape] = n;
    }
  }
  return counters;
}
```

2. In `domain-bridge.js`, the `idAllocator` parameter MUST expose `seed(counters)` and `highWater(shape)` (per Task 0's fixture extension; production callers must update their allocator implementations to match). At the top of the file add the ESM imports:

```js
import { extractAllocatorHighWaterMarks } from './translation.js';
import { ELEMENT_CATEGORIES } from './tags.js';
```

Then add to the facade (inside `createDomainBridge` only — `createDomainBridgeWith` is out of scope per Cross-Cutting Decisions):

```js
    serializeWithAllocatorState: (args) => {
      if (typeof idAllocator.highWater !== 'function' || typeof idAllocator.seed !== 'function') {
        throw new DomainError({ code: 'ALLOCATOR_MISSING_HIGHWATER', detail: 'IIDAllocator must implement highWater(shape) and seed(counters) for D5 serialize/restore' });
      }
      // Serialize the engine state via the existing snapshot port. This produces a
      // restore-compatible token, distinct from renderDatalogProjection's replay projection.
      const engineToken = engine.snapshot.snapshot();
      const shapes = Object.values(ELEMENT_CATEGORIES);
      const allocatorState = Object.fromEntries(shapes.map(s => [s, idAllocator.highWater(s)]));
      return { engine: engineToken, allocatorState };
    },
    loadFromWithAllocatorState: (args, serialized) => {
      // Restore engine state via the snapshot/restore surface that consumed the token
      // produced by serializeWithAllocatorState.
      engine.snapshot.restore(serialized.engine);
      const counters = serialized.allocatorState ?? {};
      const hasCounters = Object.keys(counters).length > 0;
      // Legacy-snapshot recovery (AC-5.3): when allocatorState is absent or empty,
      // scan the loaded EDB for high-water marks and seed from the scan.
      const effective = hasCounters ? counters : extractAllocatorHighWaterMarks(readPorts);
      idAllocator.seed(effective);
    },
```

Both methods are synchronous. `engine.snapshot.snapshot()` produces the round-trip token consumed by `engine.snapshot.restore()` — confirm the exact API names against `engine-port-adapter.js` during implementation. `renderDatalogProjection` is NOT used here — its replay projection is incompatible with `engine.snapshot.restore()`.

3. The fixture's allocator (`createInMemorySubstrate` or equivalent) must implement `seed(counters)` and `highWater(shape)`. Implementation pattern: store counters as `{ [shape]: n }`; `next(shape)` increments and returns `prefix + n`; `seed({...})` overwrites counters; `highWater(shape)` returns the current counter (the post-last-`next` value).

- [ ] **Step 4: Run tests**

Run: `cd skills/design-proof-system/references/domain && npx vitest run __tests__/`
Expected: D5 PASS; round-trip tests show no id collision after restore.

- [ ] **Step 5: Commit**

```bash
git add skills/design-proof-system/references/domain/translation.js skills/design-proof-system/references/domain/domain-bridge.js skills/design-proof-system/references/domain/__tests__/
git commit -m "feat(design-proof-system): D5 atomic serialize/restore with allocator state"
```

---

## Task 12: D12 — reviseProposition and reviseResolution verbs

**Type:** code-producing
**Implements:** AC-12.1, AC-12.2, AC-12.3, AC-12.4
**Decision budget:** 3 (whether `grounding_updates` parameter is necessary — resolved by AC-12.4 probe; the embedded-approval mechanism — pinned: emit `approved` + `two_yes` facts directly in translate output; how to update mutations.test.js named-verb count assertion 8→10)
**Must remain green:** `mutations.test.js`, `bridge-integration.test.js`, `closure-policy.test.js`, `friction-policy.test.js`, `sprint-02-bug-fix-07.test.js`

**Files:**
- Modify: `skills/design-proof-system/references/domain/tags.js:49-54` (add `REVISE_PROPOSITION: 'revise_proposition'` and `REVISE_RESOLUTION: 'revise_resolution'` to `ACTION_LABELS`)
- Modify: `skills/design-proof-system/references/domain/boot-validators.js:31` (extend `validateOperationSpecs` to accept array-valued `consentCategory`, mirroring `authority.js:10`'s `Array.isArray` pattern)
- Modify: `skills/design-proof-system/references/domain/mutations.js:208-214` (extend consent dispatch to recognize `REVISE_PROPOSITION` / `REVISE_RESOLUTION` and look up authority from `CATEGORY_REGISTRY[targetShape].authority.ratify`)
- Modify: `skills/design-proof-system/references/domain/mutations.js:260` (extend `instantiateTemplate` gate to include the two new verb labels)
- Modify: `skills/design-proof-system/references/domain/mutations.js` (add two new entries to `OPERATION_SPECS`)
- Modify: `skills/design-proof-system/references/domain/domain-bridge.js` (add `reviseProposition` and `reviseResolution` facade methods to `createDomainBridge` only)
- Modify: `skills/design-proof-system/references/domain/__tests__/mutations.test.js` (update named-verb count 8 → 10)
- Modify: `skills/design-proof-system/references/domain/__tests__/sprint-02-bug-fix-07.test.js` (add D12 describe; AC-12.4 probe runs FIRST)

**Steps (TDD):**

- [ ] **Step 1: Write failing tests, including the AC-12.4 probe**

Add to `sprint-02-bug-fix-07.test.js`:

```js
describe('D12 — reviseProposition and reviseResolution', () => {
  it('AC-12.1 reviseProposition is atomic add+ratify', () => {
    const { bridge, engine } = createInMemorySubstrate();
    // Setup: author evidence, rule, prop, ratify prop
    // ... (mirror existing bridge-integration setup)
    const result = bridge.reviseProposition({ supersedes: /* prop id */, statement: 'new text', grounding: [/* evid */], collapse_test: 't', reasoning_chain: 'r', inference_pattern: 'grounds_imply_conclusion', consent_source: 'designer' }, { source: 'designer' });
    expect(result.id).toMatch(/^prop_/);
    const approved = engine.query.query(['approved', [result.id, { var: 'S' }, { var: 'T' }]]);
    expect(approved.length).toBeGreaterThan(0);
  });

  it('AC-12.2 reviseResolution is atomic add+ratify', () => {
    // analogous
  });

  it('AC-12.3 prop+resolution wording cleanup costs ≤ 2 operations', () => {
    // Setup: author and ratify a prop and a resolution that grounds on it.
    // Revise the prop, then revise the resolution updating its grounding.
    // Confirm exactly two engine operations were performed (track via persist.saveState calls).
  });

  it('AC-12.4 PROBE — does rule cascade rewire dependent grounding automatically?', () => {
    // After revising a Proposition that is cited by a Resolution's grounding:
    // 1. Query `proposition(prop_old_id, _)` — should return zero rows (approval retracted).
    // 2. Query `resolution(res_id, _)` — does it still derive given old prop is gone?
    // Expected outcome documented in test comment; implementer interprets and either drops
    // or retains the grounding_updates parameter accordingly.
    // The test is intentionally a recording probe — it logs but does not strictly fail.
  });
});
```

- [ ] **Step 2: Run failing tests**

Run: `cd skills/design-proof-system/references/domain && npx vitest run __tests__/sprint-02-bug-fix-07.test.js -t "D12"`
Expected: FAIL — `bridge.reviseProposition is not a function`.

- [ ] **Step 3: Apply changes**

1. In `tags.js:49-54`:

```js
export const ACTION_LABELS = Object.freeze({
  ADD: 'add', REVISE: 'revise', WITHDRAW: 'withdraw',
  RATIFY: 'ratify', MANAGE_FRICTION: 'manage_friction',
  PRESENT_CLOSING_ARGUMENT: 'present_closing_argument',
  CONFIRM_CLOSURE_GO: 'confirm_closure_go', OPEN_PROOF: 'open_proof',
  REVISE_PROPOSITION: 'revise_proposition',
  REVISE_RESOLUTION: 'revise_resolution',
});
```

2. **Update `boot-validators.js:31` BEFORE adding the D12 OperationSpecs** so bridge construction does not throw on array `consentCategory`:

```js
// boot-validators.js:31 — replace:
//   check(consentSources.has(spec.consentCategory), ...)
// with:
const cc = spec.consentCategory;
if (Array.isArray(cc)) {
  for (const s of cc) check(consentSources.has(s), `OPERATION_SPECS[${verbKey}].consentCategory[*] = ${s} not in CONSENT_SOURCES`);
} else {
  check(consentSources.has(cc), `OPERATION_SPECS[${verbKey}].consentCategory = ${cc} not in CONSENT_SOURCES`);
}
```

3. **Extend `mutations.js:208-214` consent dispatch** to handle the new verbs:

```js
  if (verbName === ACTION_LABELS.ADD || verbName === ACTION_LABELS.REVISE || verbName === ACTION_LABELS.WITHDRAW) {
    perCategoryAuthority = lookupAuthority(targetShape, verbName);
  } else if (verbName === ACTION_LABELS.RATIFY) {
    const resolved = _resolveElementCategory(args.elementId, ports.query);
    if (resolved) perCategoryAuthority = lookupAuthority(resolved, ACTION_LABELS.RATIFY);
  } else if (verbName === ACTION_LABELS.REVISE_PROPOSITION || verbName === ACTION_LABELS.REVISE_RESOLUTION) {
    // D12: route through the per-category ratify authority — these verbs perform
    // an atomic add+ratify on the new element, and the ratify allowlist is the
    // tightest of the two operations.
    perCategoryAuthority = lookupAuthority(targetShape, ACTION_LABELS.RATIFY);
  }
```

This makes future changes to `CATEGORY_REGISTRY[PROPOSITION].authority.ratify` propagate automatically. The verb's own `consentCategory` array remains as a defensive fallback.

4. **Extend the `instantiateTemplate` gate at `mutations.js:260`** so the new verbs install per-element rule templates:

```js
if ([ELEMENT_CATEGORIES.PROPOSITION, ELEMENT_CATEGORIES.RESOLUTION, ELEMENT_CATEGORIES.DEFINITION, ELEMENT_CATEGORIES.CONCERN].includes(targetShape)
    && (verbName === ACTION_LABELS.ADD
        || verbName === ACTION_LABELS.REVISE
        || verbName === ACTION_LABELS.REVISE_PROPOSITION
        || verbName === ACTION_LABELS.REVISE_RESOLUTION)) {
  instantiateTemplate(targetShape, id, ports.rules);
}
```

5. In `mutations.js`, add two new OPERATION_SPECS entries (after the existing REVISE entry around line 70-89). Each spec's translate produces the element's facts via the relevant TRANSLATORS entry, then appends `approved` and `two_yes` facts for atomic ratification. **The `grounding_updates` parameter is conditional on the AC-12.4 probe outcome — see step 6.**

```js
  [ACTION_LABELS.REVISE_PROPOSITION]: {
    consentCategory: [CONSENT_SOURCES.DESIGNER, CONSENT_SOURCES.DESIGN_PARTNER],
    preconditions: [],
    idShape: ELEMENT_CATEGORIES.PROPOSITION,
    argShape: undefined, // falls through to PROPOSITION CATEGORY_REGISTRY shape
    translate: (args, id, ts) => {
      const propFacts = TRANSLATORS[ELEMENT_CATEGORIES.PROPOSITION](args, id, ts);
      const supersedesFact = ['superseded', [id, args.supersedes]];
      // D12 — atomic dual-partner ratification. The verb's per-category authority
      // dispatch (mutations.js:208, REVISE_PROPOSITION branch) checks the caller
      // holds the ratify authority for PROPOSITION (DESIGNER + DESIGN_PARTNER).
      // The translator emits BOTH approval rows so two_yes_complete derives for
      // the new element in the same transaction; otherwise downstream rules that
      // depend on two_yes_complete silently miss the revised element.
      const approvalFacts = [
        ['approved', [id, 'designer', ts]],
        ['approved', [id, 'design_partner', ts]],
        ['two_yes', [id, 'designer']],
        ['two_yes', [id, 'design_partner']],
      ];
      return {
        baseFacts: [...propFacts.baseFacts, supersedesFact, ...approvalFacts],
        rules: propFacts.rules,
        metaFacts: propFacts.metaFacts ?? [],
      };
    },
    postconditions: [],
    customPostCheck: null,
    clearsTwoYes: false,
    resultShape: { id: true, fullRecord: true },
  },
  [ACTION_LABELS.REVISE_RESOLUTION]: {
    /* mirror REVISE_PROPOSITION with ELEMENT_CATEGORIES.RESOLUTION translator */
  },
```

**The `__retract__` sentinel from the prior draft is removed.** No string sentinel ships in `metaFacts`. If the AC-12.4 probe (Step 6) shows `grounding_updates` is needed, it lands as a separate follow-up patch with explicit retract handling in `runOperation` step 5 — not as a sentinel.

6. **Run the AC-12.4 probe FIRST** before claiming D12 done. Add the AC-12.4 test as the literal first test inside the D12 `describe` block. Its output decides whether to ship the new verbs as-is (rule cascade handles rewiring) or to add explicit retract support. If the probe reveals rule cascade is insufficient, file a follow-up task in the plan's deferred-items log and surface the gap to the user before continuing.

3. In `domain-bridge.js`, append facade methods near the existing `reviseElement`:

```js
    reviseProposition: (args, consent) => runOperation('revise_proposition', args, consent, fullPorts),
    reviseResolution: (args, consent) => runOperation('revise_resolution', args, consent, fullPorts),
```

4. In `__tests__/mutations.test.js`, find the named-verb count assertion (currently expects 8) and update to 10.

- [ ] **Step 4: Run tests; record AC-12.4 probe outcome**

Run: `cd skills/design-proof-system/references/domain && npx vitest run __tests__/`
Expected: D12 AC-12.1, AC-12.2, AC-12.3 PASS. AC-12.4 probe records outcome — implementer reads the assertions and decides whether to drop or retain `grounding_updates`.

If the probe shows rule cascade handles dependent rewiring (`proposition(old_id, _)` returns zero rows after revise, AND `resolution(_, _)` continues to derive correctly):
- Remove the `groundingUpdates` flatMap from both new translators (drop the parameter entirely).
- Remove `args.grounding_updates` references from the test.
- Note the decision in the commit message.

Otherwise:
- Retain `grounding_updates` and ensure runOperation step 5 supports the retract sentinel (one-line extension to `for (const [pred, a] of baseFacts)` loop).

- [ ] **Step 5: Commit**

```bash
git add skills/design-proof-system/references/domain/tags.js skills/design-proof-system/references/domain/mutations.js skills/design-proof-system/references/domain/domain-bridge.js skills/design-proof-system/references/domain/__tests__/mutations.test.js skills/design-proof-system/references/domain/__tests__/sprint-02-bug-fix-07.test.js
git commit -m "feat(design-proof-system): D12 reviseProposition + reviseResolution atomic verbs"
```

---

## Task 13: AC-13.1 — Full regression sweep and bare-id pattern-match remediation

**Type:** code-producing
**Implements:** AC-13.1
**Decision budget:** 1 (which bare-id pattern-match tests need updating — discovered by grep across all three test directories)
**Must remain green:** every test under `domain/__tests__/`, `domain/structural-tests/`, `engine/__tests__/`

**Files:**
- Modify: any test files surfaced by the grep below that strictly pattern-match the bare-id mutation result shape (`expect(result).toEqual({ id: ... })` or equivalent)
- No production-code changes — this task is the integration gate.

**Steps (TDD):**

- [ ] **Step 1: Grep for bare-id strict-shape assertions across all three test directories**

Run:
```bash
cd skills/design-proof-system/references && \
  grep -rEn "toEqual\(\s*\{\s*id:" domain/__tests__/ domain/structural-tests/ engine/__tests__/ 2>/dev/null && \
  grep -rEn "Object\.keys\(result\)\.length" domain/__tests__/ domain/structural-tests/ engine/__tests__/ 2>/dev/null
```

Expected output: a list of any tests that strictly assert the mutation result is exactly `{ id }` (no other keys). These tests will break under D6's broadened return shape.

- [ ] **Step 2: Update each matching test to use `toMatchObject` instead of `toEqual` (or update the expected shape to include the broadened fields)**

For each file:line surfaced in Step 1, change the assertion from a strict shape check to a `toMatchObject` (partial match) that asserts only the `id` field is present. Example transformation:

Before:
```js
expect(result).toEqual({ id: 'evid_1' });
```

After:
```js
expect(result).toMatchObject({ id: 'evid_1' }); // D6: result also carries full element record fields
```

If no matching assertions exist (the grep returned zero results), document that in the commit message and proceed.

- [ ] **Step 3: Run the full sweep across all three test directories**

Run:
```bash
cd skills/design-proof-system/references && \
  npx vitest run domain/__tests__/ domain/structural-tests/ engine/__tests__/
```

Expected: ALL tests PASS. If any test fails for shape-related reasons not covered by the grep, repeat Step 2 for that test.

- [ ] **Step 4: Confirm the `mutations.test.js` named-verb-count and `resolution-schema.test.js` referenceField updates from Tasks 4 and 12 are present**

Run:
```bash
grep -n "expect.*OPERATION_SPECS.*8\|expect.*OPERATION_SPECS.*10" skills/design-proof-system/references/domain/__tests__/mutations.test.js
grep -n "problem_anchor" skills/design-proof-system/references/domain/__tests__/resolution-schema.test.js
```

Expected: `mutations.test.js` references `10` (post-Task 12); `resolution-schema.test.js` references the array form `['concern', 'risk']` (post-Task 4).

- [ ] **Step 5: Commit**

```bash
git add skills/design-proof-system/references/domain/__tests__/ skills/design-proof-system/references/domain/structural-tests/ skills/design-proof-system/references/engine/__tests__/
git commit -m "test(design-proof-system): AC-13.1 full regression sweep + bare-id assertion migration"
```

<!-- created-at: 2026-05-18T17:37:11Z -->
<!-- produced-by plan-build@v0004 -->
