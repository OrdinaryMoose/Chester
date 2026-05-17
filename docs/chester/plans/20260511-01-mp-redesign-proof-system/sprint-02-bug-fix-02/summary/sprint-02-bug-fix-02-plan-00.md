# Plan: Close PERMISSION.relieves and RISK.basis silent-drop gaps; add INVALID_REFERENCE existence validation

**Sprint:** sprint-02-bug-fix-02 (under master plan `20260511-01-mp-redesign-proof-system`)
**Spec:** `docs/chester/working/20260511-01-mp-redesign-proof-system/sprint-02-bug-fix-02/spec/sprint-02-bug-fix-02-spec-01.md`
**Execution mode:** subagent

> **For agentic workers:** Use execute-write to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The `Execution mode` field selects which execute-write section runs — Section 2 (subagent-driven) or Section 3 (inline). plan-build sets this field at handoff based on the Execution Mode Selection heuristic, with human confirm/override.

## Goal

Close two cascade-vs-implementation silent-drop gaps in the design-proof-system domain layer: PERMISSION submissions silently lose the `relieves` field (no `permission/3` linkage fact reaches the EDB); RISK submissions silently lose the `basis` array (no `risk_basis/2` facts reach the EDB). Add domain-side existence validation for both fields with a new `INVALID_REFERENCE` error code. Fix two pre-existing arity-table mismatches (`PROJECTION_ARITIES.risk: 2 → 3` and `_ARITIES.risk: 2 → 3`) surfaced by adversarial spec review.

## Architecture

Hybrid Recommendation from competing-architecture review. Declarative-directive spine: add two new directives (`referenceFields` for existence-checking, `nonEmptyArrayFields` for empty-array rejection) to `CATEGORY_REGISTRY` descriptors, consumed by an extended `verifyArgsShape` that takes an optional third argument (`readPort`). The single call site in `runOperation` is updated to pass `ports.query` for ADD and REVISE verbs. The PERMISSION translator emits `permission(id, statement, relieves)` as the new linkage fact alongside the existing `permission_decl(id, statement)` declaration (preserving `permission_decl` keeps `_CATEGORY_PROBES` in `mutations.js` unchanged and avoids cross-cutting RATIFY-path disturbance). The RISK translator spreads `basis` into per-element `risk_basis(id, elementId)` facts using the RESOLUTION.addresses spread idiom. Render layer gets new sub-line blocks per ADR-0006 precedent.

## Tech Stack

- **Language:** JavaScript (ESM), Node 18+
- **Test runner:** Vitest (`npm test`)
- **System under change:** `skills/design-proof-system/references/domain/`
- **Test discipline:** Real-import (no mocks per dr-20260514-06)

## Implementer Watch-Items

Read before starting any task.

1. **`_ARITIES.risk` and `PROJECTION_ARITIES.risk` both need 2 → 3.** Two parallel arity tables in `render.js` (one at module-scope around line 52 for `renderElementDeep`; one inside `renderDatalogProjection` around line 146 for the Datalog projection). Both currently say `risk: 2` and both must be corrected to `risk: 3` in Task 4. Missing either leaves a subtle regression — Datalog projection drops severity OR `renderElementDeep` returns null for risks.

2. **Keep `permission_decl/2` emission unchanged.** The translator now emits BOTH `permission_decl/2` (preserve) and `permission/3` (new). Do NOT replace one with the other. `_CATEGORY_PROBES` in `mutations.js:13-22` references `permission_decl/2` for category resolution during RATIFY; replacing it would force a cross-cutting probe-table edit with broader blast radius.

3. **`boot-validators.js` is intentionally not edited.** Ground-truth verified that `validateCategoryRegistry` at lines 50-64 positively asserts only four specific fields (`requiredFields`, `sourceConstraint`, `idShape`, `renderSection`) and has no known-properties allow-list. New directives pass through silently like `closedEnumFields` already does. AC-9.2 verifies the no-edit assumption holds; do not edit the file.

4. **`verifyArgsShape` gains a third optional positional parameter (`readPort = null`).** Backward compatible with every existing two-arg caller. The only call site that passes a non-null third arg is `mutations.js:231`, and only for ADD or REVISE verbs (RATIFY, WITHDRAW, MANAGE_FRICTION pass null and short-circuit the referenceFields loop).

5. **`INVALID_REFERENCE` is a new domain-layer error code.** Existing codes are `SHAPE_INVALID` and `TYPE_ERROR`. Use the existing throw pattern from `schema.js:107-128` — `throw Object.assign(new Error(msg), { code, field, referencedId })` — Error instances with code/field/referencedId properties attached. This is consistent with every other throw in `verifyArgsShape` and the `translate` UNKNOWN_CATEGORY throw at `translation.js:90`. Do NOT throw plain object literals (e.g. `throw { code: ... }`) — that diverges from the file's established convention and produces errors without `.stack` or `instanceof Error` semantics. The error object must include `referencedId` (the first failing id) so callers can diagnose.

6. **`_CATEGORY_PROBES_SCHEMA` is a private constant inside `schema.js`.** Architect A flagged the circular import: `schema.js` cannot import `_CATEGORY_PROBES` from `mutations.js` because `mutations.js` imports from `schema.js`. The schema-side probe table is a small private duplicate keyed by category name → declaration predicate name + arity. At spec-writing time only `rule` and wildcard are needed; future descriptors that declare new category constraints extend it.

7. **Wildcard reference check iterates probes.** For `RISK.basis` with `referenceFields: { basis: '*' }`, the existence check iterates every entry in `_CATEGORY_PROBES_SCHEMA` and accepts the first match. For typical proof sizes (tens to low hundreds of elements, 9 category probes) this is negligible.

8. **Spec AC-6.4 says `at least these properties`** on the error object — assertions must use `toMatchObject` or property-presence checks, not deep equality on the full error (would fail on `stack`).

9. **Spec AC-7.3 says `set-equality` for the Basis sub-line** — assertions on the rendered Markdown must split the basis sub-line by `, ` and assert the resulting set, not the full string (EDB query order is not stable).

---

## Task 1: Extend `verifyArgsShape` with `nonEmptyArrayFields` and `referenceFields` directives

**Type:** code-producing
**Implements:** mechanism for AC-3.3, AC-6.3, AC-6.4 (the directives themselves; descriptor declarations land in Tasks 2 and 3)
**Decision budget:** 2 (loop order — where to insert the two new loops in `verifyArgsShape`; private probe table location/shape inside `schema.js`)
**Must remain green:** all existing `schema.test.js` tests; the new mechanism test added here. All other existing test suites — descriptors don't declare the new directives yet so behavior is unchanged.

**Files:**
- Modify: `skills/design-proof-system/references/domain/schema.js` (add private `_CATEGORY_PROBES_SCHEMA` constant near top; extend `verifyArgsShape` signature + body around lines 94-115; add `referenceFields: {}` empty default to all nine category descriptors for self-documentation)
- Modify: `skills/design-proof-system/references/domain/mutations.js` (line 231 call-site)
- Modify: `skills/design-proof-system/references/domain/__tests__/schema.test.js` (add two mechanism tests — one for `nonEmptyArrayFields`, one for `referenceFields`)

**Steps (TDD):**

- [ ] **Step 1: Write the failing tests in `schema.test.js`**

Add these two test cases inside the existing `describe('schema', ...)` block:

```javascript
  it('verifyArgsShape throws SHAPE_INVALID when a nonEmptyArrayFields entry is empty or non-array', () => {
    const stubDescriptor = {
      label: 'stub',
      requiredFields: ['xs'],
      nonEmptyArrayFields: ['xs'],
      closedEnumFields: {},
    };
    // Empty array
    let captured = null;
    try { verifyArgsShape({ xs: [] }, stubDescriptor); } catch (e) { captured = e; }
    expect(captured).not.toBeNull();
    expect(captured.code).toBe('SHAPE_INVALID');
    expect(captured.field).toBe('xs');

    // Non-array
    captured = null;
    try { verifyArgsShape({ xs: 'not-an-array' }, stubDescriptor); } catch (e) { captured = e; }
    expect(captured).not.toBeNull();
    expect(captured.code).toBe('SHAPE_INVALID');
    expect(captured.field).toBe('xs');

    // Valid non-empty array passes
    expect(() => verifyArgsShape({ xs: ['a', 'b'] }, stubDescriptor)).not.toThrow();
  });

  it('verifyArgsShape throws INVALID_REFERENCE when a referenceFields entry points at a non-existent id', () => {
    const stubDescriptor = {
      label: 'stub',
      requiredFields: ['ref'],
      referenceFields: { ref: 'rule' },
      closedEnumFields: {},
    };
    // Read port stub — returns false for all existence queries
    const noPort = { exists: () => false };
    // Without a read port, the referenceFields loop short-circuits (backward compat)
    expect(() => verifyArgsShape({ ref: 'rule_999' }, stubDescriptor)).not.toThrow();

    // With a read port, the loop runs and throws on miss
    let captured = null;
    try { verifyArgsShape({ ref: 'rule_999' }, stubDescriptor, noPort); } catch (e) { captured = e; }
    expect(captured).not.toBeNull();
    expect(captured.code).toBe('INVALID_REFERENCE');
    expect(captured.field).toBe('ref');
    expect(captured.referencedId).toBe('rule_999');

    // With a read port that returns true, the loop passes
    const yesPort = { exists: () => true };
    expect(() => verifyArgsShape({ ref: 'rule_1' }, stubDescriptor, yesPort)).not.toThrow();
  });
```

- [ ] **Step 2: Run the tests and confirm they fail**

```bash
cd skills/design-proof-system/references/domain && npx vitest run __tests__/schema.test.js
```

Expected: the two new tests fail (the loops don't exist yet).

- [ ] **Step 3: Implement the changes in `schema.js`**

Near the top of the file, after the imports, add the private probe constant. Use `ELEMENT_CATEGORIES.*` symbol keys to match the existing `_CATEGORY_PROBES` convention in `mutations.js:13-22` (smell finding S2 mitigation — same key convention across both probe tables). `ELEMENT_CATEGORIES` is already imported at the top of `schema.js:1` for use in `CATEGORY_REGISTRY`.

```javascript
// Private partial mirror of mutations.js's _CATEGORY_PROBES. Cannot import directly
// (circular: mutations.js imports verifyArgsShape from schema.js). Keyed by
// ELEMENT_CATEGORIES symbol → [declaration predicate, arity], matching the key
// convention of _CATEGORY_PROBES in mutations.js. Wildcard '*' iterates all entries.
const _CATEGORY_PROBES_SCHEMA = Object.freeze({
  [ELEMENT_CATEGORIES.EVIDENCE]: ['evidence', 3],
  [ELEMENT_CATEGORIES.RULE]: ['rule_decl', 2],
  [ELEMENT_CATEGORIES.PERMISSION]: ['permission_decl', 2],
  [ELEMENT_CATEGORIES.PROPOSITION]: ['proposition_decl', 3],
  [ELEMENT_CATEGORIES.RISK]: ['risk', 3],            // NOTE: arity 3, not 2 — see render.js arity correction in Task 4
  [ELEMENT_CATEGORIES.RESOLUTION]: ['resolution_decl', 2],
  [ELEMENT_CATEGORIES.FRICTION]: ['friction', 4],
  [ELEMENT_CATEGORIES.CONCERN]: ['concern', 3],
  [ELEMENT_CATEGORIES.DEFINITION]: ['definition_decl', 3],
});

function _existsAnyCategory(readPort, id) {
  for (const [pred, arity] of Object.values(_CATEGORY_PROBES_SCHEMA)) {
    const pattern = [id, ...Array(arity - 1).fill('_')];
    if (readPort.exists([pred, pattern])) return true;
  }
  return false;
}

function _existsCategory(readPort, id, categoryKey) {
  if (categoryKey === '*') return _existsAnyCategory(readPort, id);
  // categoryKey is an ELEMENT_CATEGORIES.* string value (e.g. 'rule', 'permission')
  // — looking up by the string value matches the symbol-key-via-computed-property
  // convention in mutations.js where ELEMENT_CATEGORIES.PERMISSION === 'permission'.
  const probe = _CATEGORY_PROBES_SCHEMA[categoryKey];
  if (!probe) return false;
  const [pred, arity] = probe;
  const pattern = [id, ...Array(arity - 1).fill('_')];
  return readPort.exists([pred, pattern]);
}
```

Update the `verifyArgsShape` signature and body. After the existing `nonEmptyStringFields` loop and before the function returns, add:

```javascript
export function verifyArgsShape(args, shapeOrDescriptor, readPort = null) {
  const desc = typeof shapeOrDescriptor === 'string'
    ? CATEGORY_REGISTRY[shapeOrDescriptor]
    : shapeOrDescriptor;
  if (!desc) throw { code: 'SHAPE_INVALID', message: `unknown shape: ${shapeOrDescriptor}` };

  // ... existing presence-check loop ...
  // ... existing closedEnumFields loop ...
  // ... existing nonEmptyStringFields loop ...

  // NEW: nonEmptyArrayFields loop
  for (const f of (desc.nonEmptyArrayFields ?? [])) {
    if (f in args) {
      const v = args[f];
      if (!Array.isArray(v) || v.length === 0) {
        throw Object.assign(
          new Error(`field "${f}" must be a non-empty array for ${desc.label ?? '<unknown>'}`),
          { code: 'SHAPE_INVALID', field: f }
        );
      }
    }
  }

  // NEW: referenceFields loop (only runs when a read port is provided)
  if (readPort) {
    for (const [field, categoryConstraint] of Object.entries(desc.referenceFields ?? {})) {
      if (!(field in args)) continue;
      const raw = args[field];
      const ids = Array.isArray(raw) ? raw : [raw];
      for (const id of ids) {
        if (!_existsCategory(readPort, id, categoryConstraint)) {
          throw Object.assign(
            new Error(`field "${field}" references non-existent ${categoryConstraint === '*' ? 'element' : categoryConstraint} "${id}"`),
            { code: 'INVALID_REFERENCE', field, referencedId: id }
          );
        }
      }
    }
  }

  return args;
}
```

Add `referenceFields: {}` to all nine category descriptors at lines 4-86 for self-documentation (matches the established empty-default pattern of `closedEnumFields: {}` and `nonEmptyStringFields: []`). This is a no-op at runtime — the loop iterates zero entries — but keeps the descriptor shape uniform.

- [ ] **Step 4: Update the mutations.js call site**

At line 231 (or wherever `verifyArgsShape(args, argShapeTarget);` lives), change to:

```javascript
const isAddOrRevise = verbName === ACTION_LABELS.ADD || verbName === ACTION_LABELS.REVISE;
verifyArgsShape(args, argShapeTarget, isAddOrRevise ? ports.query : null);
```

`ACTION_LABELS` is already imported at the top of `mutations.js`; if not, add it from `./tags.js`. `verbName` is the local variable already in scope at this point in `runOperation`. `ports` (and `ports.query`) is also already in scope.

- [ ] **Step 5: Run the tests and confirm they pass**

```bash
cd skills/design-proof-system/references/domain && npx vitest run
```

Expected: all 130+ tests pass (the existing 131-passing baseline from bug-fix-01 plus the two new mechanism tests).

- [ ] **Step 6: Commit**

```bash
git add skills/design-proof-system/references/domain/schema.js \
        skills/design-proof-system/references/domain/mutations.js \
        skills/design-proof-system/references/domain/__tests__/schema.test.js
git commit -m "feat(schema): add nonEmptyArrayFields and referenceFields directives to verifyArgsShape; thread read port through ADD/REVISE call site"
```

---

## Task 2: PERMISSION end-to-end — descriptor, translator, EDB whitelist, existing-fixture repairs

**Type:** code-producing
**Implements:** AC-1.1, AC-1.2, AC-1.3, AC-2.1, AC-2.2, AC-2.3, AC-5.1 (partial — adds `permission` and `permission_scope` entries)
**Decision budget:** 2 (which existing tests submit PERMISSION without `relieves` — must be grep'd and repaired; emission order in translator's baseFacts return)
**Must remain green:** existing PERMISSION tests after fixture repairs; existing Task 1 mechanism tests; all unrelated tests.

**Files:**
- Modify: `skills/design-proof-system/references/domain/schema.js` (PERMISSION descriptor: extend requiredFields, optionalFields, add referenceFields)
- Modify: `skills/design-proof-system/references/domain/translation.js` (PERMISSION translator at lines 23-27; extend EDB_PREDICATES at lines 184-193)
- Modify any existing test files that submit PERMISSION without `relieves`: candidates include `__tests__/translation.test.js`, `__tests__/bridge-integration.test.js`, `__tests__/mutations.test.js`. Run `grep -rn "ELEMENT_CATEGORIES.PERMISSION\|idShape: 'permission'" __tests__/` to enumerate.

**Steps (TDD):**

- [ ] **Step 1: Survey existing PERMISSION fixtures**

```bash
cd skills/design-proof-system/references/domain && grep -rn "ELEMENT_CATEGORIES.PERMISSION\|idShape: 'permission'\|addElement.*permission" __tests__/
```

Note every line. Each must either receive a `relieves: <existing rule id>` field, or the fixture must arrange for a RULE to be created beforehand. Most fixtures already create rules; the question is whether they currently use the rule id elsewhere. Common pattern: `const rule1 = bridge.addElement({...RULE...}, consent)` → then `bridge.addElement({...PERMISSION..., relieves: rule1.id}, consent)`.

- [ ] **Step 2: Write the failing test in translation.test.js**

Add to the `describe('translation', ...)` block:

Use the exported `translate(category, args, id, ts)` function — `TRANSLATORS` is not exported from `translation.js` (it's a module-private `const TRANSLATORS = Object.freeze({...})`). The public surface is `translate`, which returns the full `{baseFacts, rules, metaFacts}` object.

```javascript
  it('PERMISSION translator emits permission/3, permission_scope/2 (conditional), and permission_decl/2', () => {
    const args = { statement: 'P statement', relieves: 'rule_1', scope_constraint: 'top-level only' };
    const result = translate(ELEMENT_CATEGORIES.PERMISSION, args, 'perm_1', 1700000000);
    const facts = result.baseFacts;
    // permission_decl/2 preserved
    expect(facts).toContainEqual(['permission_decl', ['perm_1', 'P statement']]);
    // permission/3 new linkage fact
    expect(facts).toContainEqual(['permission', ['perm_1', 'P statement', 'rule_1']]);
    // permission_scope/2 conditional
    expect(facts).toContainEqual(['permission_scope', ['perm_1', 'top-level only']]);
  });

  it('PERMISSION translator omits permission_scope when scope_constraint is absent', () => {
    const args = { statement: 'P', relieves: 'rule_1' };
    const result = translate(ELEMENT_CATEGORIES.PERMISSION, args, 'perm_2', 1700000000);
    const scopes = result.baseFacts.filter(f => f[0] === 'permission_scope');
    expect(scopes.length).toBe(0);
  });
```

```bash
npx vitest run __tests__/translation.test.js
```

Expected: the two new tests fail (translator doesn't emit `permission/3` or `permission_scope/2` yet).

- [ ] **Step 3: Update PERMISSION descriptor in `schema.js`**

Find the PERMISSION block (around lines 24-33). Change:

```javascript
  [ELEMENT_CATEGORIES.PERMISSION]: Object.freeze({
    requiredFields: ['statement', 'relieves'],
    optionalFields: ['rationale', 'scope_constraint'],
    nonEmptyStringFields: [],
    sourceConstraint: CONSENT_SOURCES.DESIGNER,
    idShape: ELEMENT_CATEGORIES.PERMISSION,
    renderSection: RENDER_SECTIONS.INFERENTIAL_FRAMEWORK,
    closedEnumFields: {},
    referenceFields: { relieves: 'rule' },
    authority: { add: [CONSENT_SOURCES.DESIGNER], revise: [CONSENT_SOURCES.DESIGNER], withdraw: [CONSENT_SOURCES.DESIGNER], ratify: [CONSENT_SOURCES.DESIGNER] },
  }),
```

- [ ] **Step 4: Update PERMISSION translator in `translation.js`**

Find the PERMISSION translator (lines 23-27). Replace with:

```javascript
  [ELEMENT_CATEGORIES.PERMISSION]: (args, id, ts) => ({
    baseFacts: [
      ['permission_decl', [id, args.statement]],
      ['permission', [id, args.statement, args.relieves]],
      ...(typeof args.scope_constraint === 'string' && args.scope_constraint.length > 0
        ? [['permission_scope', [id, args.scope_constraint]]]
        : []),
    ],
    rules: [],
    metaFacts: [['created_at', [id, ts]]],
  }),
```

Extend `EDB_PREDICATES` (around line 184-193) **incrementally** — do not replace the whole Set literal, just add two new entries.

The current set at `translation.js:184-193` contains entries like `'phase'`, `'two_yes'`, `'closure_committed'`, etc. that are easy to drop accidentally with a full replacement. Use a minimal-touch edit: locate the existing `'permission_decl'` line and add `'permission'`, `'permission_scope'` adjacent to it (or anywhere within the Set literal — order does not matter for a Set, but placement near related entries aids readers).

Example minimal-diff edit (find `'permission_decl'` in the Set, append the two new names after it on the same line or the next):

```diff
 export const EDB_PREDICATES = new Set([
-  'evidence', 'rule_decl', 'permission_decl', 'proposition_decl',
+  'evidence', 'rule_decl', 'permission_decl', 'permission', 'permission_scope', 'proposition_decl',
   'grounding', 'collapse_test', 'reasoning_chain', 'rejected_alternative',
   ...
 ]);
```

Leave every other entry in the set untouched.

- [ ] **Step 5: Repair fixtures in existing tests**

For each location surfaced in Step 1, add `relieves: <rule-id>` to the PERMISSION submission. If the test does not already create a RULE, add one. Pattern:

```javascript
const rule = bridge.addElement({ idShape: ELEMENT_CATEGORIES.RULE, statement: 'R' }, designerConsent);
const perm = bridge.addElement({ idShape: ELEMENT_CATEGORIES.PERMISSION, statement: 'P', relieves: rule.id }, designerConsent);
```

- [ ] **Step 6: Run all tests and confirm they pass**

```bash
npx vitest run
```

Expected: all tests pass including the two new translator tests and all repaired fixture tests.

- [ ] **Step 7: Commit**

```bash
git add skills/design-proof-system/references/domain/schema.js \
        skills/design-proof-system/references/domain/translation.js \
        skills/design-proof-system/references/domain/__tests__/translation.test.js \
        skills/design-proof-system/references/domain/__tests__/*.test.js
git commit -m "feat(permission): require relieves; emit permission/3 + conditional permission_scope/2; preserve permission_decl/2; extend EDB whitelist"
```

---

## Task 3: RISK end-to-end — descriptor, translator, EDB whitelist, existing-fixture repairs

**Type:** code-producing
**Implements:** AC-3.1, AC-3.2, AC-3.3, AC-3.4, AC-4.1, AC-5.1 (completes — adds `risk_basis` entry)
**Decision budget:** 2 (which existing tests submit RISK without `basis`; spread idiom edge cases — empty array prevented by directive but defense-in-depth fallback shape)
**Must remain green:** existing RISK tests after fixture repairs; Task 1 + Task 2 tests; all unrelated tests.

**Files:**
- Modify: `skills/design-proof-system/references/domain/schema.js` (RISK descriptor extend)
- Modify: `skills/design-proof-system/references/domain/translation.js` (RISK translator + EDB_PREDICATES)
- Modify existing test files that submit RISK without `basis`: enumerate via `grep -rn "ELEMENT_CATEGORIES.RISK\|idShape: 'risk'" __tests__/`

**Steps (TDD):**

- [ ] **Step 1: Survey existing RISK fixtures** (same pattern as Task 2 Step 1).

- [ ] **Step 2: Write the failing translator tests**

Add to `translation.test.js`:

Use `translate(category, args, id, ts)` — `TRANSLATORS` is not exported.

```javascript
  it('RISK translator spreads basis into one risk_basis/2 fact per element id', () => {
    const args = { statement: 'R statement', basis: ['evid_1', 'prop_2'] };
    const result = translate(ELEMENT_CATEGORIES.RISK, args, 'risk_1', 1700000000);
    const facts = result.baseFacts;
    // risk/3 preserved
    expect(facts).toContainEqual(['risk', ['risk_1', 'R statement', 'unspecified']]);
    // risk_basis/2 spread
    expect(facts).toContainEqual(['risk_basis', ['risk_1', 'evid_1']]);
    expect(facts).toContainEqual(['risk_basis', ['risk_1', 'prop_2']]);
    expect(facts.filter(f => f[0] === 'risk_basis').length).toBe(2);
  });

  it('RISK translator preserves severity when provided', () => {
    const args = { statement: 'R', basis: ['evid_1'], severity: 'high' };
    const result = translate(ELEMENT_CATEGORIES.RISK, args, 'risk_2', 1700000000);
    expect(result.baseFacts).toContainEqual(['risk', ['risk_2', 'R', 'high']]);
  });
```

Run and confirm failure.

- [ ] **Step 3: Update RISK descriptor in `schema.js`**

Find the RISK block (around lines 44-53). Change:

```javascript
  [ELEMENT_CATEGORIES.RISK]: Object.freeze({
    requiredFields: ['statement', 'basis'],
    optionalFields: ['severity'],
    nonEmptyStringFields: [],
    nonEmptyArrayFields: ['basis'],
    sourceConstraint: CONSENT_SOURCES.DESIGNER,
    idShape: ELEMENT_CATEGORIES.RISK,
    renderSection: RENDER_SECTIONS.PROBLEM,
    closedEnumFields: {},
    referenceFields: { basis: '*' },
    authority: { add: [CONSENT_SOURCES.DESIGNER], revise: [CONSENT_SOURCES.DESIGNER], withdraw: [CONSENT_SOURCES.DESIGNER], ratify: [CONSENT_SOURCES.DESIGNER] },
  }),
```

- [ ] **Step 4: Update RISK translator in `translation.js`**

Find the RISK translator (lines 41-45). Replace with:

```javascript
  [ELEMENT_CATEGORIES.RISK]: (args, id, ts) => ({
    baseFacts: [
      ['risk', [id, args.statement, args.severity ?? 'unspecified']],
      ...(Array.isArray(args.basis) ? args.basis.map(eid => ['risk_basis', [id, eid]]) : []),
    ],
    rules: [],
    metaFacts: [['created_at', [id, ts]]],
  }),
```

Extend `EDB_PREDICATES` **incrementally** with `'risk_basis'` — locate the existing `'risk'` entry and add `'risk_basis'` near it, leaving every other entry untouched (same minimal-touch convention as Task 2).

- [ ] **Step 5: Repair fixtures in existing tests**

For each location surfaced in Step 1, add `basis: [<existing element id>]` to the RISK submission. The element id can be an existing evidence, proposition, or any element id created earlier in the test fixture.

- [ ] **Step 6: Run all tests and confirm they pass**

```bash
npx vitest run
```

- [ ] **Step 7: Commit**

```bash
git add skills/design-proof-system/references/domain/schema.js \
        skills/design-proof-system/references/domain/translation.js \
        skills/design-proof-system/references/domain/__tests__/translation.test.js \
        skills/design-proof-system/references/domain/__tests__/*.test.js
git commit -m "feat(risk): require basis (non-empty array, referenceFields wildcard); spread risk_basis/2 per element; extend EDB whitelist"
```

---

## Task 4: Render layer — PROJECTION_ARITIES, _ARITIES correction, new render blocks

**Type:** code-producing
**Implements:** AC-5.2, AC-5.3, AC-5.5, AC-7.1, AC-7.3. (AC-7.2's negative side — "zero `Scope:` sub-lines when scope_constraint is absent" — lands in Task 5's permission-schema.test.js. Task 4 covers AC-7.2's positive side only.)
**Decision budget:** 3 (insertion point for PERMISSION block in renderStructuredProof — under inferential_framework section; insertion point for RISK block — under problem section; sub-line formatting consistency with ADR-0006 PROPOSITION sub-lines)
**Must remain green:** existing render.test.js; AC-5.5 renderElementDeep on RISK now returns non-null (previously returned null).

**Files:**
- Modify: `skills/design-proof-system/references/domain/render.js` (`_ARITIES` table around line 52; `PROJECTION_ARITIES` around line 146; `renderStructuredProof` body)
- Modify: `skills/design-proof-system/references/domain/__tests__/render.test.js`

**Steps (TDD):**

- [ ] **Step 1: Write failing tests in render.test.js**

Follow the existing `render.test.js` pattern: raw `createInMemorySubstrate()` from `_fixtures/inMemorySubstrate.js`, assert facts directly via `s.facts.assertFact(predicate, args)`, call render functions with `(args, { query: s.query, explain: s.explain })`. No bridge — render.test.js does not use the bridge facade.

```javascript
**Note on `out.facts` format.** `renderDatalogProjection` returns `{ facts, rules }` where `facts` is an array of `[predicate, argsArray]` tuples, not strings. Per the existing `render.test.js` pattern (e.g. line 75-80 of bug-fix-01's added tests use `out.facts.filter(f => f[0] === 'reasoning_chain')`), assertions use tuple-index access.

```javascript
  it('AC-5.3: PROJECTION_ARITIES.risk is arity 3 (severity preserved in projection)', () => {
    const s = createInMemorySubstrate();
    s.facts.assertFact('risk', ['risk_1', 'R statement', 'high']);
    const out = renderDatalogProjection({}, { query: s.query, explain: s.explain });
    // Find the risk fact tuple — must include the severity (third positional)
    const riskTuple = out.facts.find(f => f[0] === 'risk');
    expect(riskTuple).toBeDefined();
    expect(riskTuple[1]).toEqual(['risk_1', 'R statement', 'high']);
  });

  it('AC-5.2: PROJECTION_ARITIES includes permission/3, permission_scope/2, risk_basis/2', () => {
    const s = createInMemorySubstrate();
    s.facts.assertFact('permission', ['perm_1', 'P statement', 'rule_1']);
    s.facts.assertFact('permission_scope', ['perm_1', 'top-level only']);
    s.facts.assertFact('risk_basis', ['risk_1', 'evid_1']);
    const out = renderDatalogProjection({}, { query: s.query, explain: s.explain });
    expect(out.facts.some(f => f[0] === 'permission' && f[1][2] === 'rule_1')).toBe(true);
    expect(out.facts.some(f => f[0] === 'permission_scope' && f[1][1] === 'top-level only')).toBe(true);
    expect(out.facts.some(f => f[0] === 'risk_basis')).toBe(true);
  });

  it('AC-5.5: renderElementDeep on a RISK id returns a record at arity 3 (was null when _ARITIES.risk was 2)', () => {
    const s = createInMemorySubstrate();
    s.facts.assertFact('risk', ['risk_1', 'R statement', 'high']);
    const out = renderElementDeep({ id: 'risk_1' }, { query: s.query, explain: s.explain });
    expect(out).not.toBeNull();
    expect(out.predicate).toBe('risk');
  });

  it('AC-7.1/AC-7.2 (positive): renderStructuredProof emits Relieves and optional Scope sub-lines per permission', () => {
    const s = createInMemorySubstrate();
    s.facts.assertFact('permission_decl', ['perm_1', 'P statement']);
    s.facts.assertFact('permission', ['perm_1', 'P statement', 'rule_2']);
    s.facts.assertFact('permission_scope', ['perm_1', 'top-level only']);
    const out = renderStructuredProof({}, { query: s.query, explain: s.explain });
    expect(out).toContain('P statement');
    expect(out).toMatch(/Relieves: rule_2/);
    expect(out).toContain('Scope: top-level only');
  });

  it('AC-7.3: renderStructuredProof emits Basis sub-line per risk (set-equality on comma-split ids)', () => {
    const s = createInMemorySubstrate();
    s.facts.assertFact('risk', ['risk_1', 'R statement', 'high']);
    s.facts.assertFact('risk_basis', ['risk_1', 'evid_1']);
    s.facts.assertFact('risk_basis', ['risk_1', 'prop_2']);
    const out = renderStructuredProof({}, { query: s.query, explain: s.explain });
    const basisLine = out.split('\n').find(l => l.includes('Basis:'));
    expect(basisLine).toBeDefined();
    // Set-equality per AC-7.3 and Watch-Item 9 — EDB query order is not stable
    const ids = basisLine.replace(/^.*Basis: /, '').split(', ').sort();
    expect(ids).toEqual(['evid_1', 'prop_2'].sort());
  });
```

- [ ] **Step 2: Run and confirm failure.**

- [ ] **Step 3: Update `_ARITIES` table in `render.js`**

Find the `_ARITIES` object (around line 52). Change `risk: 2` to `risk: 3`. No other entries change in this table.

- [ ] **Step 4: Update `PROJECTION_ARITIES` table**

Find the `PROJECTION_ARITIES` object inside `renderDatalogProjection` (around line 146). Make three changes:

```javascript
const PROJECTION_ARITIES = {
  evidence: 3, rule_decl: 2, permission_decl: 2, permission: 3, permission_scope: 2,
  proposition_decl: 3,
  grounding: 2, collapse_test: 2, reasoning_chain: 2, rejected_alternative: 3,
  risk: 3, risk_basis: 2,  // risk corrected from 2 to 3; risk_basis added
  resolution_decl: 2, addresses: 2,
  friction: 4, friction_disposition: 2, definition_decl: 3, definition_scope: 2, definition_self: 2,
  concern: 3, concern_status: 2,
  approved: 3, two_yes: 2,
  closure_committed: 0, closure_pending: 0, round: 1,
  created_at: 2, withdrew: 1, superseded: 2,
};
```

- [ ] **Step 5: Add PERMISSION render block to `renderStructuredProof`**

Locate the Inferential Framework section in `renderStructuredProof`. After the existing permission listing (if any) — or under a new "## Permissions" sub-header — add per-permission sub-lines. Pattern (mirrors ADR-0006 PROPOSITION sub-line idiom from bug-fix-01):

```javascript
const permissions = readPorts.query.query(['permission_decl', [{ var: 'I' }, { var: 'S' }]]);
if (permissions.length) {
  const lines = ['## Permissions'];
  for (const p of permissions) {
    lines.push(`- ${p.I}: ${p.S}`);
    const linkages = readPorts.query.query(['permission', [p.I, { var: 'S2' }, { var: 'R' }]]);
    for (const l of linkages) {
      lines.push(`  - Relieves: ${l.R}`);
    }
    const scopes = readPorts.query.query(['permission_scope', [p.I, { var: 'T' }]]);
    for (const s of scopes) {
      lines.push(`  - Scope: ${s.T}`);
    }
  }
  sections.push(lines.join('\n') + '\n');
}
```

- [ ] **Step 6: Add RISK render block to `renderStructuredProof`**

Locate the Problem section in `renderStructuredProof`. After (or alongside) the existing risk listing, add per-risk sub-lines:

```javascript
const risks = readPorts.query.query(['risk', [{ var: 'I' }, { var: 'S' }, { var: 'V' }]]);
if (risks.length) {
  const lines = ['## Risks'];
  for (const r of risks) {
    lines.push(`- ${r.I}: ${r.S} (${r.V})`);
    const basisRows = readPorts.query.query(['risk_basis', [r.I, { var: 'E' }]]);
    if (basisRows.length) {
      lines.push(`  - Basis: ${basisRows.map(b => b.E).join(', ')}`);
    }
  }
  sections.push(lines.join('\n') + '\n');
}
```

If the existing Problem section already enumerates risks at arity 2 (because `_ARITIES.risk: 2` led the code to query at arity 2), update that query to arity 3 as part of this task.

- [ ] **Step 7: Run all tests and confirm they pass.**

- [ ] **Step 8: Commit**

```bash
git add skills/design-proof-system/references/domain/render.js \
        skills/design-proof-system/references/domain/__tests__/render.test.js
git commit -m "feat(render): correct _ARITIES.risk and PROJECTION_ARITIES.risk to arity 3; add permission and risk sub-line render blocks per ADR-0006"
```

---

## Task 5: New per-category test files (permission-schema.test.js, risk-schema.test.js) + bridge round-trip

**Type:** code-producing
**Implements:** AC-5.4, AC-6.1, AC-6.2, AC-6.3 (end-to-end via bridge), AC-9.2; also confirms AC-1.x through AC-4.x via end-to-end bridge round-trips
**Decision budget:** 1 (test-file organization — descriptor section first, then translator, then bridge round-trip, mirroring proposition-schema.test.js precedent from bug-fix-01)
**Must remain green:** all prior tests; the two new files' tests added here.

**Files:**
- Create: `skills/design-proof-system/references/domain/__tests__/permission-schema.test.js`
- Create: `skills/design-proof-system/references/domain/__tests__/risk-schema.test.js`

**Steps (TDD):**

- [ ] **Step 1: Create permission-schema.test.js**

Mirror the structure of `proposition-schema.test.js` from bug-fix-01. Include:

- **AC-1.x descriptor tests** — read `CATEGORY_REGISTRY[PERMISSION]` and assert each field per spec.
- **AC-2.x translator tests** — call `translate(ELEMENT_CATEGORIES.PERMISSION, args, id, ts)` with valid args; assert `permission_decl/2`, `permission/3`, `permission_scope/2` baseFacts in the returned `result.baseFacts` array. (`TRANSLATORS` is a module-private const in `translation.js` — use the exported `translate` function.)
- **AC-6.1 bridge round-trip** — create a bridge with no RULE; submit PERMISSION with `relieves: 'rule_does_not_exist'`; assert `INVALID_REFERENCE` throw with `field: 'relieves'`, `referencedId: 'rule_does_not_exist'`.
- **AC-6.4 error shape** — use `expect.objectContaining` (or property-presence assertions) so the test doesn't fail on `stack` per Watch-Item 8.
- **AC-7.1 / AC-7.2 render** — assert sub-lines in `renderStructuredProof` output for a permission with and without `scope_constraint`.
- **Bridge round-trip happy path** — submit a valid PERMISSION (relieves resolves to an existing RULE); assert `permission/3` fact lands in EDB via `queryProof`.

- [ ] **Step 2: Create risk-schema.test.js**

Mirror structure. Include:

- **AC-3.x descriptor tests** — assert `requiredFields`, `optionalFields`, `nonEmptyArrayFields`, `referenceFields` on `CATEGORY_REGISTRY[RISK]`.
- **AC-4.1 translator test** — call `translate(ELEMENT_CATEGORIES.RISK, args, id, ts)` and assert the `risk_basis/2` spread in `result.baseFacts`.
- **AC-6.2 bridge round-trip** — create bridge with `evid_1` asserted; submit RISK with `basis: ['evid_1', 'missing']`; assert `INVALID_REFERENCE` with `field: 'basis'`, `referencedId: 'missing'`.
- **AC-6.3 empty array** — submit RISK with `basis: []`; assert `SHAPE_INVALID` with `field: 'basis'`.
- **AC-6.4 error shape** — property-presence assertions.
- **AC-7.3 render** — `Basis:` sub-line; set-equality on comma-split ids per Watch-Item 9.
- **Bridge round-trip happy path** — submit valid RISK with multi-element basis; assert N `risk_basis/2` facts land via `queryProof`.

- [ ] **Step 3: Add AC-5.4 validPredicates auto-flow test**

In `risk-schema.test.js` (or in a shared bridge test):

```javascript
  it('AC-5.4: queryProof works against new EDB predicates without explicit validPredicates edit', () => {
    // Submit valid elements
    const evid = bridge.addElement({ idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'industry', claim: 'C' }, designerConsent);
    const risk = bridge.addElement({ idShape: ELEMENT_CATEGORIES.RISK, statement: 'R', basis: [evid.id] }, designerConsent);

    // queryProof on each new predicate must execute without throwing
    expect(() => bridge.queryProof({ pattern: ['risk_basis', [{ var: 'R' }, { var: 'E' }]] })).not.toThrow();
    expect(() => bridge.queryProof({ pattern: ['permission', [{ var: 'P' }, { var: 'S' }, { var: 'R' }]] })).not.toThrow();
    expect(() => bridge.queryProof({ pattern: ['permission_scope', [{ var: 'P' }, { var: 'T' }]] })).not.toThrow();
  });
```

- [ ] **Step 4: Add AC-9.2 boot-validator no-op test**

In either test file:

```javascript
  it('AC-9.2: CATEGORY_REGISTRY boot validation passes with the new directives declared', () => {
    // Importing CATEGORY_REGISTRY and running validateCategoryRegistry should not throw.
    // PERMISSION declares referenceFields, RISK declares referenceFields + nonEmptyArrayFields.
    expect(() => validateCategoryRegistry(CATEGORY_REGISTRY, tags)).not.toThrow();
  });
```

- [ ] **Step 5: Run all tests and confirm they pass**

```bash
npx vitest run
```

- [ ] **Step 6: Commit**

```bash
git add skills/design-proof-system/references/domain/__tests__/permission-schema.test.js \
        skills/design-proof-system/references/domain/__tests__/risk-schema.test.js
git commit -m "test(permission,risk): per-category test files covering schema, translator, EDB round-trip, INVALID_REFERENCE existence checks, render blocks"
```

---

## Task 6: Probe regression — extend cascade-spec-probe-simulation.mjs

**Type:** code-producing
**Implements:** AC-8.1
**Decision budget:** 1 (probe assertion shape — assert linkage facts present vs. assert specific field values)
**Must remain green:** running the probe produces no new failures; H-2 / H-3 attempts now show linkage facts in the EDB.

**Files:**
- Modify: `docs/chester/working/stress-tests/20260517-01/cascade-spec-probe-simulation.mjs`

**Steps:**

- [ ] **Step 1: Read the probe and locate the H-2 (PERMISSION) and H-3 (RISK) attempts**

Open `docs/chester/working/stress-tests/20260517-01/cascade-spec-probe-simulation.mjs`. Locate the H-2 PERMISSION attempts (around lines 183-198) and H-3 RISK attempts (around lines 253-267). **Note** that the probe already submits `relieves` (e.g. `relieves: rulePrecedence?.id ?? 'rule_1'`) and `basis` (e.g. `basis: [propSixOps?.id].filter(Boolean)`) per the spec-shape submissions written when the probe was authored. The H-2 / H-3 attempts were spec-shaped but failed pre-sprint because the implementation did not require those fields. After the sprint they succeed and produce linkage facts; the probe needs new assertions to verify the linkage facts actually landed.

- [ ] **Step 2: Ensure H-3 fixture uses a multi-element basis array, and update the probe header comment**

Inspect the H-3 RISK submissions. If `basis` is a single-element array (e.g. `basis: [propSixOps?.id].filter(Boolean)`), extend it to two elements (e.g. `basis: [propSixOps?.id, evInput?.id].filter(Boolean)`) so the `risk_basis/2` spread is genuinely exercised. Whatever final array length you pick becomes the `expectedCount` value used in Step 4.

Update the probe header comment (the block comment at the top of the file describing what each Hxx attempt tests) to note: H-2 and H-3 are now closure-regression assertions verifying that `permission/3` and `risk_basis/2` linkage facts land after submission. Pre-sprint the same submissions appeared to succeed but lost the linkage silently; post-sprint they produce the facts the cascade specifies.

- [ ] **Step 3: Add the H-2 permission/3 linkage assertion**

After the successful PERMISSION addElement (the one with `relieves`), query for `permission/3` and assert one row with the expected relieves id:

```javascript
const permLinkRows = attempt('AC-H2: queryProof permission/3 after PERMISSION add', () =>
  bridge.queryProof({ pattern: ['permission', [permClear.id, { var: 'S' }, { var: 'R' }]] })
);
if (permLinkRows && permLinkRows.length === 1 && permLinkRows[0].R === rulePrecedence.id) {
  console.log(`         OK: permission/3 fact landed with relieves=${permLinkRows[0].R}`);
} else {
  findings.push({ attempt: 'H-2-assert', label: 'permission/3 not landed correctly', message: JSON.stringify(permLinkRows) });
}
```

Adjust variable names (`permClear`, `rulePrecedence`) to match the actual identifiers used at the H-2 site.

- [ ] **Step 4: Add the H-3 risk_basis/2 linkage assertion with the concrete expectedCount**

After the successful RISK addElement, query for `risk_basis/2` and assert the row count matches the basis array length you chose in Step 2:

```javascript
const riskBasisRows = attempt('AC-H3: queryProof risk_basis/2 after RISK add', () =>
  bridge.queryProof({ pattern: ['risk_basis', [riskDivByZero.id, { var: 'E' }]] })
);
const expectedCount = 2; // matches the basis array length from Step 2
if (riskBasisRows && riskBasisRows.length === expectedCount) {
  console.log(`         OK: risk_basis/2 facts landed (${riskBasisRows.length} rows)`);
} else {
  findings.push({ attempt: 'H-3-assert', label: 'risk_basis/2 count mismatch', message: JSON.stringify(riskBasisRows) });
}
```

Adjust the literal `2` to match your Step 2 choice. Adjust `riskDivByZero` to match the actual identifier used at the H-3 site.

- [ ] **Step 5: Run the probe**

```bash
cd /home/mike/Documents/CodeProjects/Chester && node docs/chester/working/stress-tests/20260517-01/cascade-spec-probe-simulation.mjs
```

Confirm: zero new failures; H-2 and H-3 linkage assertions pass.

- [ ] **Step 6: Commit**

```bash
git add docs/chester/working/stress-tests/20260517-01/cascade-spec-probe-simulation.mjs
git commit -m "test(probe): extend cascade-spec-probe-simulation.mjs to assert permission/3 and risk_basis/2 linkage facts post-submission"
```

---

## Post-task verification

After all six tasks land, `execute-verify-complete` will:

1. Run `npx vitest run` in the domain layer. All tests must pass.
2. Verify clean working tree.
3. Run the cascade-spec-probe-simulation.mjs and confirm zero H-2 / H-3 failures.
4. Verify `git diff --name-only main...HEAD` is confined to `skills/design-proof-system/references/domain/` and `docs/chester/working/stress-tests/20260517-01/` (AC-9.1).
5. Checkpoint commit.

---

<!-- produced-by plan-build@v0004 -->
