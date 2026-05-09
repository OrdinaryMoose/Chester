# Plan: Sprint D-1 Fix Proof MCP 2

**Sprint:** `20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp-2`
**Spec:** `docs/chester/working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp-2/spec/sprint-d-1-fix-proof-mcp-2-spec-00.md`
**Execution mode:** subagent

> **For agentic workers:** Use execute-write to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The `Execution mode` field selects which execute-write section runs — Section 2 (subagent-driven) or Section 3 (inline). plan-build sets this field at handoff based on the Execution Mode Selection heuristic, with human confirm/override.

## Goal

Ship a per-element `ratify_necessary_condition` tool that closes the closure-path defect introduced by sprint-d-1-fix-proof-mcp's removal of bulk-ratify (AC-2.4) without shipping a replacement for the first-yes-gate-required NC ratification path (AC-4.1).

## Architecture

Hybrid principled-merge: dedicated tool mechanism (mirrors `ratify_resolve_condition` line-for-line, with `ALREADY_RATIFIED` guard added and friction-detection arms removed since NC ratify is not a friction trigger) plus lightly-broad summary scope (proposed PERM-2 revised text and NCON-15 pending-decision note authored as draft files for the finish phase to merge into the sprint summary). Code work bounded to `skills/design-large-task/proof-mcp/` plus targeted SKILL.md edits.

## Tech Stack

- Node.js MCP server (`@modelcontextprotocol/sdk`)
- Vitest test runner (`vitest run` from `skills/design-large-task/proof-mcp/`)
- ESM modules; `structuredClone` + `cloneElements` for state cloning

---

## Task 1: Add `ratifyNecessaryCondition` state function

**Type:** code-producing
**Implements:** AC-1.1, AC-1.3, AC-1.4, AC-1.5
**Decision budget:** 2
**Must remain green:** `ratify-necessary-condition.test.js`, plus existing tests covering `state.js` (`acceptance.test.js`, `state.test.js`, `nc-ratification-status.test.js`, `consent.test.js`)

**Files:**
- Create: `skills/design-large-task/proof-mcp/__tests__/ratify-necessary-condition.test.js`
- Modify: `skills/design-large-task/proof-mcp/state.js` (insert new export after `ratifyResolveCondition` ends, around line 365)

**Steps (TDD):**

- [ ] **Step 1: Write failing tests**

Pattern source: `__tests__/nc-ratification-status.test.js` (NC-specific scaffold) and `__tests__/mid-review-revision.test.js` (per-mutator slices).

```javascript
// skills/design-large-task/proof-mcp/__tests__/ratify-necessary-condition.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  initializeState,
  applyOperations,
  saveState,
  loadState,
  ratifyNecessaryCondition,
  recordDesignerGo,
} from '../state.js';

const validConsent = { source: 'designer', rationale: 'test ratify' };

function seedStateWithNC(extraSeed = {}) {
  let state = initializeState();
  state.problemStatement = 'test problem';
  // open_proof seed equivalent: add Evidence + Rule + NC via applyOperations
  const seedOps = [
    { op: 'add', type: 'EVIDENCE', statement: 'test evidence', source: 'codebase' },
    { op: 'add', type: 'RULE', statement: 'test rule', source: 'designer' },
    { op: 'add', type: 'NECESSARY_CONDITION',
      statement: 'test NC',
      grounding: ['EVID-1'],
      reasoning_chain: 'IF X THEN Y',
      collapse_test: 'fails if removed',
    },
  ];
  const result = applyOperations(state, seedOps, validConsent);
  state = result.state;
  return state;
}

describe('ratifyNecessaryCondition', () => {
  it('flips active NC ratificationStatus from draft to ratified on happy path', () => {
    const state = seedStateWithNC();
    const [newState, err] = ratifyNecessaryCondition(
      state,
      { elementId: 'NCON-1', ratificationText: 'designer accept' },
      validConsent,
    );
    expect(err).toBeNull();
    expect(newState.elements.get('NCON-1').ratificationStatus).toBe('ratified');
    expect(state.elements.get('NCON-1').ratificationStatus).toBe('draft'); // input unchanged
  });

  it('appends ratificationLog entry with target/round/text', () => {
    const state = seedStateWithNC();
    const [newState] = ratifyNecessaryCondition(
      state,
      { elementId: 'NCON-1', ratificationText: 'sign-off' },
      validConsent,
    );
    const lastLog = newState.ratificationLog[newState.ratificationLog.length - 1];
    expect(lastLog).toMatchObject({
      event: 'ratified',
      target: 'NCON-1',
      round: state.round,
      ratificationText: 'sign-off',
    });
  });

  it('appends operationLog entry with op:ratify, type, changedFields, provenance', () => {
    const state = seedStateWithNC();
    const [newState] = ratifyNecessaryCondition(
      state,
      { elementId: 'NCON-1', ratificationText: 'sign-off' },
      validConsent,
    );
    const lastOp = newState.operationLog[newState.operationLog.length - 1];
    expect(lastOp).toMatchObject({
      op: 'ratify',
      entityId: 'NCON-1',
      type: 'NECESSARY_CONDITION',
      changedFields: ['ratificationStatus'],
      provenance: { ratificationText: 'sign-off' },
    });
  });

  it('rejects invalid consent token', () => {
    const state = seedStateWithNC();
    const [, err] = ratifyNecessaryCondition(
      state,
      { elementId: 'NCON-1', ratificationText: 'x' },
      {}, // missing source
    );
    expect(err).toMatch(/INVALID_CONSENT/);
  });

  it('refuses when proofStatus is finish', () => {
    let state = seedStateWithNC();
    state.proofStatus = 'finish';
    const [, err] = ratifyNecessaryCondition(
      state,
      { elementId: 'NCON-1', ratificationText: 'x' },
      validConsent,
    );
    expect(err).toMatch(/PROOF_FINISHED/);
  });

  it('refuses when element not found', () => {
    const state = seedStateWithNC();
    const [, err] = ratifyNecessaryCondition(
      state,
      { elementId: 'NCON-99', ratificationText: 'x' },
      validConsent,
    );
    expect(err).toMatch(/not found/i);
  });

  it('refuses when element is not a NECESSARY_CONDITION (e.g. EVIDENCE)', () => {
    const state = seedStateWithNC();
    const [, err] = ratifyNecessaryCondition(
      state,
      { elementId: 'EVID-1', ratificationText: 'x' },
      validConsent,
    );
    expect(err).toMatch(/not a NECESSARY_CONDITION/i);
  });

  it('refuses ALREADY_RATIFIED on repeat call', () => {
    const state = seedStateWithNC();
    const [first] = ratifyNecessaryCondition(
      state,
      { elementId: 'NCON-1', ratificationText: 'first' },
      validConsent,
    );
    const [, err] = ratifyNecessaryCondition(
      first,
      { elementId: 'NCON-1', ratificationText: 'second' },
      validConsent,
    );
    expect(err).toMatch(/ALREADY_RATIFIED/);
  });

  it('refuses when NC status is withdrawn', () => {
    let state = seedStateWithNC();
    // Withdraw the NC by direct state mutation (test scaffold; production withdraws via withdraw tool)
    state.elements.get('NCON-1').status = 'withdrawn';
    const [, err] = ratifyNecessaryCondition(
      state,
      { elementId: 'NCON-1', ratificationText: 'x' },
      validConsent,
    );
    expect(err).toMatch(/not active/i);
  });

  it('refuses when ratificationText is empty', () => {
    const state = seedStateWithNC();
    const [, err] = ratifyNecessaryCondition(
      state,
      { elementId: 'NCON-1', ratificationText: '' },
      validConsent,
    );
    expect(err).toMatch(/required/i);
  });

  it('clears closingArgPresentedRound and closingArgGoRound on success', () => {
    let state = seedStateWithNC();
    state.closingArgPresentedRound = state.round;
    state.closingArgGoRound = state.round;
    const [newState] = ratifyNecessaryCondition(
      state,
      { elementId: 'NCON-1', ratificationText: 'x' },
      validConsent,
    );
    expect(newState.closingArgPresentedRound).toBeNull();
    expect(newState.closingArgGoRound).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd skills/design-large-task/proof-mcp && npx vitest run __tests__/ratify-necessary-condition.test.js
```

Expected: FAIL — `SyntaxError: The requested module '../state.js' does not provide an export named 'ratifyNecessaryCondition'`

- [ ] **Step 3: Implement minimal code**

Insert after `ratifyResolveCondition` in `state.js` (around line 365, before the `// Generate a new element ID` block). The function inherits the validation/guard sequence from `ratifyResolveCondition` (lines 320-364) but **the return tuple is 2-element, not 3-element** — matching `ratifyConcern`'s shape (`[newState, error]`) rather than `ratifyResolveCondition`'s 3-tuple (`[newState, frictionHints, error]`). NC ratify also adds an `ALREADY_RATIFIED` guard (RC has no equivalent — RC ratify is idempotent) and omits the `processFriction` call entirely (NC ratify is not a friction trigger). **Use the code block below verbatim — do not copy from `ratifyResolveCondition` and adapt, because that path produces a 3-tuple return that is wrong for this contract.**

```javascript
/**
 * Ratify a single Necessary Condition. Refuses non-NC, withdrawn, unknown, already-ratified, or empty text.
 * Sequential by design — caller passes a single elementId.
 * @param {object} state
 * @param {{elementId: string, ratificationText: string}} input
 * @param {object} consent
 * @returns {[object, string|null]} [newState, error]
 */
export function ratifyNecessaryCondition(state, { elementId, ratificationText }, consent) {
  const consentCheck = validateConsentToken(consent);
  if (!consentCheck.valid) {
    return [state, `INVALID_CONSENT: ${consentCheck.reason}`];
  }
  if (state.proofStatus === 'finish') {
    return [state, 'PROOF_FINISHED: Proof is finished; no further mutations permitted'];
  }
  const target = state.elements.get(elementId);
  if (!target) {
    return [state, `Element "${elementId}" not found`];
  }
  if (target.type !== 'NECESSARY_CONDITION') {
    return [state, `Element "${elementId}" is not a NECESSARY_CONDITION`];
  }
  if (target.status !== 'active') {
    return [state, `Element "${elementId}" is not active`];
  }
  if (target.ratificationStatus === 'ratified') {
    return [state, `ALREADY_RATIFIED: NC "${elementId}" is already ratified`];
  }
  if (!ratificationText || typeof ratificationText !== 'string') {
    return [state, 'Ratification text is required'];
  }
  const newState = structuredClone(state);
  newState.elements = cloneElements(state.elements);
  resetFirstYesIfFired(newState);
  const updatedTarget = newState.elements.get(elementId);
  updatedTarget.ratificationStatus = 'ratified';
  newState.ratificationLog.push({
    event: 'ratified',
    target: elementId,
    round: newState.round,
    ratificationText,
  });
  appendOperationLog(newState, {
    round: newState.round,
    op: 'ratify',
    entityId: elementId,
    type: 'NECESSARY_CONDITION',
    consent,
    changedFields: ['ratificationStatus'],
    provenance: { ratificationText },
  });
  return [newState, null];
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd skills/design-large-task/proof-mcp && npx vitest run __tests__/ratify-necessary-condition.test.js
```

Expected: PASS — 11 tests passing.

Then run full proof-mcp suite to confirm no regression:

```bash
cd skills/design-large-task/proof-mcp && npm test
```

Expected: PASS — 509 + 11 = 520 tests minimum (other tasks add more).

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/state.js skills/design-large-task/proof-mcp/__tests__/ratify-necessary-condition.test.js
git commit -m "feat(proof-mcp): add ratifyNecessaryCondition state function (AC-1.1, AC-1.3, AC-1.4, AC-1.5)"
```

---

## Task 2: Register `ratify_necessary_condition` MCP tool in server.js

**Type:** code-producing
**Implements:** AC-1.2
**Decision budget:** 1
**Must remain green:** `ratify-necessary-condition.test.js` (server-level cases added in this task), `server.test.js`, plus existing server-routing tests

**Files:**
- Modify: `skills/design-large-task/proof-mcp/server.js` — four changes (import line ~9; TOOLS array entry after `ratify_resolve_condition` at line 213; dispatcher case after line 301; new handler function after line 611)
- Modify: `skills/design-large-task/proof-mcp/__tests__/ratify-necessary-condition.test.js` — append server-level describe block

**Steps (TDD):**

- [ ] **Step 1: Write failing server-level tests**

**Important — ESM import placement.** ESM modules require all `import` declarations at the top of the file, before any other statements. Modify the existing import block at the top of `__tests__/ratify-necessary-condition.test.js` (created in Task 1) by:

1. Adding `afterEach` to the existing `vitest` named imports.
2. Adding a new top-level import line: `import { handleRatifyNecessaryCondition } from '../server.js';`

Both edits go at the top of the file, alongside the existing imports. Do NOT place `import { handleRatifyNecessaryCondition }` inside the appended `describe` block — that would be a static syntax error.

Then append the new `describe` block at the bottom of the file (after the existing `describe('ratifyNecessaryCondition', ...)` block):

```javascript
describe('handleRatifyNecessaryCondition (server)', () => {
  let dir, statePath;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'rnc-server-'));
    statePath = join(dir, 'state.json');
  });

  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  function persistSeed() {
    const state = seedStateWithNC();
    saveState(state, statePath);
    return statePath;
  }

  it('returns accepted envelope with ratificationStatus=ratified on success', () => {
    const path = persistSeed();
    const result = handleRatifyNecessaryCondition({
      state_file: path,
      element_id: 'NCON-1',
      ratification: 'designer accept',
      consent: validConsent,
    });
    expect(result.isError).toBeFalsy();
    const payload = JSON.parse(result.content[0].text);
    expect(payload.status).toBe('accepted');
    expect(payload.element_id).toBe('NCON-1');
    expect(payload.ratificationStatus).toBe('ratified');
    expect(payload).toHaveProperty('closure_permitted');
    expect(payload).toHaveProperty('closure_reasons');
  });

  it('returns isError on PROOF_FINISHED', () => {
    let state = seedStateWithNC();
    state.proofStatus = 'finish';
    saveState(state, statePath);
    const result = handleRatifyNecessaryCondition({
      state_file: statePath,
      element_id: 'NCON-1',
      ratification: 'x',
      consent: validConsent,
    });
    expect(result.isError).toBe(true);
  });

  it('persists state to disk on success (saveState called)', () => {
    const path = persistSeed();
    handleRatifyNecessaryCondition({
      state_file: path,
      element_id: 'NCON-1',
      ratification: 'x',
      consent: validConsent,
    });
    const reloaded = loadState(path);
    expect(reloaded.elements.get('NCON-1').ratificationStatus).toBe('ratified');
  });

  it('returns isError on INVALID_CONSENT and does not persist', () => {
    const path = persistSeed();
    const result = handleRatifyNecessaryCondition({
      state_file: path,
      element_id: 'NCON-1',
      ratification: 'x',
      consent: {}, // invalid
    });
    expect(result.isError).toBe(true);
    const reloaded = loadState(path);
    expect(reloaded.elements.get('NCON-1').ratificationStatus).toBe('draft');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd skills/design-large-task/proof-mcp && npx vitest run __tests__/ratify-necessary-condition.test.js -t "handleRatifyNecessaryCondition"
```

Expected: FAIL — `SyntaxError: The requested module '../server.js' does not provide an export named 'handleRatifyNecessaryCondition'`

- [ ] **Step 3: Implement server changes**

Four changes to `skills/design-large-task/proof-mcp/server.js`:

**Change 1 — Import** (existing import line ~9):

Add `ratifyNecessaryCondition` to the named imports from `'./state.js'`:

```javascript
import {
  initializeState, applyOperations, saveState, loadState,
  // ...existing imports...
  ratifyResolveCondition, ratifyNecessaryCondition,
  // ...rest...
} from './state.js';
```

**Change 2 — TOOLS array entry** (after `ratify_resolve_condition` block at line 202-214):

Insert immediately after the closing `},` of the `ratify_resolve_condition` tool object:

```javascript
  {
    name: 'ratify_necessary_condition',
    description: "Ratify a single Necessary Condition. Sequential by design — accepts one element_id per call; batch shapes are not supported. Refused when proof is finished, when the NC is not active (withdrawn), when the NC is already ratified, or when consent token is invalid.",
    inputSchema: {
      type: 'object',
      properties: {
        state_file: { type: 'string', description: 'Absolute path to state JSON' },
        element_id: { type: 'string', description: 'NCON-N ID of the Necessary Condition to ratify' },
        ratification: { type: 'string', description: "PM's sign-off text" },
        consent: CONSENT_SCHEMA,
      },
      required: ['state_file', 'element_id', 'ratification', 'consent'],
    },
  },
```

**Change 3 — Dispatcher case** (in the request-handler switch around line 301):

Add after `case 'ratify_resolve_condition'`:

```javascript
      case 'ratify_necessary_condition':
        return handleRatifyNecessaryCondition(args);
```

**Change 4 — Handler function** (after `handleRatifyResolveCondition` at line 586-611):

Add export:

```javascript
export function handleRatifyNecessaryCondition({ state_file, element_id, ratification, consent }) {
  let state = loadState(state_file);
  if (state.proofStatus === 'finish') {
    return proofFinishedResponse();
  }
  const [newState, err] = ratifyNecessaryCondition(state, { elementId: element_id, ratificationText: ratification }, consent);
  if (err) {
    return { content: [{ type: 'text', text: JSON.stringify(classifyStateError(err)) }], isError: true };
  }
  saveState(newState, state_file);
  const target = newState.elements.get(element_id);
  const closure = checkClosure(newState);
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        status: 'accepted',
        element_id,
        ratificationStatus: target.ratificationStatus,
        closure_permitted: closure.permitted,
        closure_reasons: closure.reasons,
      }),
    }],
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd skills/design-large-task/proof-mcp && npx vitest run __tests__/ratify-necessary-condition.test.js
```

Expected: PASS — 15 tests passing (11 from Task 1 + 4 new server-level).

Then run full suite:

```bash
cd skills/design-large-task/proof-mcp && npm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/server.js skills/design-large-task/proof-mcp/__tests__/ratify-necessary-condition.test.js
git commit -m "feat(proof-mcp): register ratify_necessary_condition tool (AC-1.2)"
```

---

## Task 3: Add NC ratify case to mutation-clears-flags.test.js

**Type:** code-producing
**Implements:** AC-3.1
**Decision budget:** 0
**Must remain green:** `mutation-clears-flags.test.js`

**Files:**
- Modify: `skills/design-large-task/proof-mcp/__tests__/mutation-clears-flags.test.js` — add one `it()` case alongside the existing per-mutator scaffold

**Steps:**

- [ ] **Step 1: Write the failing test case**

The existing `__tests__/mutation-clears-flags.test.js` builds state inline per case (no `seedStateWithNC` helper exists, no file-level `validConsent` constant). Each case constructs its own state via `initializeState` + `applyOperations` and uses an inline consent token. Match that pattern.

First, add `ratifyNecessaryCondition` to the named imports from `'../state.js'` at line 5 (alongside `ratifyResolveCondition`, `ratifyConcern`, etc.).

Then insert a new `it()` block after the existing `ratifyResolveCondition` flag-clear case, modeled inline:

```javascript
  it('ratifyNecessaryCondition clears closingArgPresentedRound and closingArgGoRound', () => {
    let s = initializeState();
    s.problemStatement = 'test';
    const seedOps = [
      { op: 'add', type: 'EVIDENCE', statement: 'e', source: 'codebase' },
      { op: 'add', type: 'NECESSARY_CONDITION',
        statement: 'nc', grounding: ['EVID-1'],
        reasoning_chain: 'IF X THEN Y', collapse_test: 'breaks' },
    ];
    const consent = { source: 'designer', rationale: 'test' };
    const seedResult = applyOperations(s, seedOps, consent);
    s = seedResult.state;
    s.closingArgPresentedRound = s.round;
    s.closingArgGoRound = s.round;
    const [newS] = ratifyNecessaryCondition(s, { elementId: 'NCON-1', ratificationText: 'ok' }, consent);
    expect(newS.closingArgPresentedRound).toBeNull();
    expect(newS.closingArgGoRound).toBeNull();
  });
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd skills/design-large-task/proof-mcp && npx vitest run __tests__/mutation-clears-flags.test.js -t "ratifyNecessaryCondition"
```

Expected: FAIL on the first run if Task 1 wasn't merged; PASS if Task 1 already shipped (since the function exists and clears flags). If Task 1 is already on disk, this test should fail only if the import is wrong or the assertion is wrong.

If Task 1 already on disk and test passes immediately: that's fine — TDD is preserved at the function level by Task 1. This task is the cross-mutator scaffold extension. Proceed to Step 4.

- [ ] **Step 3: (Already implemented in Task 1)**

The implementation lives in `state.js`'s `ratifyNecessaryCondition` (Task 1). No additional implementation here.

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd skills/design-large-task/proof-mcp && npx vitest run __tests__/mutation-clears-flags.test.js
```

Expected: PASS — all existing cases plus the new NC ratify case.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/__tests__/mutation-clears-flags.test.js
git commit -m "test(proof-mcp): add ratifyNecessaryCondition to mutation-clears-flags coverage (AC-3.1)"
```

---

## Task 4: Closure-path integration test

**Type:** code-producing
**Implements:** AC-2.1, AC-5.1
**Decision budget:** 2
**Must remain green:** `closure-path-integration.test.js`, plus all existing tests

**Files:**
- Create: `skills/design-large-task/proof-mcp/__tests__/closure-path-integration.test.js`
- Modify: `skills/design-large-task/proof-mcp/server.js` (add `export` keyword to `handleConfirmClosureGo` declaration at line 651 — see Step 0)

**Important — return-shape contracts (verified against current source):**

- `addConcern(state, payload, consent)` returns **4-tuple** `[id, newState, frictionHints, error]`.
- `manageDefinitions(state, op, payload, consent)` — positional args, **`op` is a string** (`'add'` / `'ratify'` / `'revise'` / etc.); payload uses **snake_case** field names (`canonical_name`, not `canonicalName`). Returns 3-tuple `[id, newState, error]` for `add`; `[null, newState, error]` for `ratify`.
- `ratifyConcern(state, concernId, consent)` returns 2-tuple `[newState, error]`.
- `ratifyResolveCondition(state, payload, consent)` returns 3-tuple `[newState, frictionHints, error]`.
- `ratifyNecessaryCondition(state, payload, consent)` (this sprint, Task 1) returns 2-tuple `[newState, error]`.

The integration test below uses each shape correctly. Do not infer call shapes from `ratifyResolveCondition`'s 3-tuple — most siblings use 2-tuple, and `addConcern` uses 4-tuple.

**Steps (TDD):**

- [ ] **Step 0: Export `handleConfirmClosureGo` from server.js**

The integration test imports `handleConfirmClosureGo` from `'../server.js'`, but the function declaration at `server.js:651` currently lacks the `export` keyword (`function handleConfirmClosureGo(...)`). Without export, the test's top-level import fails with a `SyntaxError` and the entire test file refuses to parse — every `it()` case fails before running.

Modify `skills/design-large-task/proof-mcp/server.js` line 651:

Before: `function handleConfirmClosureGo({ state_file, consent }) {`
After: `export function handleConfirmClosureGo({ state_file, consent }) {`

This is a one-word addition. The dispatcher `case 'confirm_closure_go'` at line ~309 already calls `handleConfirmClosureGo(args)` directly via lexical scope; adding `export` does not change call-site behavior.

Verify:

```bash
grep -n "^export function handleConfirmClosureGo\|^function handleConfirmClosureGo" skills/design-large-task/proof-mcp/server.js
```

Expected: one match starting `export function handleConfirmClosureGo`.

Run the existing test suite to confirm no regression:

```bash
cd skills/design-large-task/proof-mcp && npm test
```

Expected: PASS — all existing tests still green.

- [ ] **Step 1: Write failing integration tests**

Pattern source: `__tests__/first-yes-precondition.test.js` (server-level scaffold for `handlePresentClosingArgument` / `handleConfirmClosureGo`); `__tests__/mutation-clears-flags.test.js` (lines 95-115 for `manageDefinitions` call shape).

```javascript
// skills/design-large-task/proof-mcp/__tests__/closure-path-integration.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  initializeState,
  applyOperations,
  saveState,
  loadState,
  addConcern,
  ratifyConcern,
  ratifyResolveCondition,
  ratifyNecessaryCondition,
  manageDefinitions,
} from '../state.js';
import {
  handlePresentClosingArgument,
  handleConfirmClosureGo,
} from '../server.js';

const validConsent = { source: 'designer', rationale: 'integration test' };

describe('closure path integration', () => {
  let dir, statePath;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'closure-path-'));
    statePath = join(dir, 'state.json');
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  function buildFullState() {
    let state = initializeState();
    state.problemStatement = 'integration test problem';
    // Seed: 1 Evidence, 1 Rule, 2 NCs.
    const ops = [
      { op: 'add', type: 'EVIDENCE', statement: 'codebase fact', source: 'codebase' },
      { op: 'add', type: 'RULE', statement: 'designer rule', source: 'designer' },
      { op: 'add', type: 'NECESSARY_CONDITION',
        statement: 'NC1', grounding: ['EVID-1'], reasoning_chain: 'IF X THEN Y',
        collapse_test: 'breaks if removed' },
      { op: 'add', type: 'NECESSARY_CONDITION',
        statement: 'NC2', grounding: ['RULE-1'], reasoning_chain: 'IF P THEN Q',
        collapse_test: 'breaks if removed', rejected_alternatives: ['considered Z'] },
    ];
    let opResult = applyOperations(state, ops, validConsent);
    state = opResult.state;

    // Add Concern — addConcern returns [id, newState, hints, error].
    let cernId, hints, err;
    [cernId, state, hints, err] = addConcern(state, { label: 'C1', description: 'concern 1' }, validConsent);

    // Add RC anchored to the new Concern.
    opResult = applyOperations(state, [
      { op: 'add', type: 'RESOLVE_CONDITION', statement: 'RC1', problem_anchor: cernId },
    ], validConsent);
    state = opResult.state;

    // Add Definition — manageDefinitions(state, op:string, payload, consent), returns [id, newState, error].
    let defId;
    [defId, state] = manageDefinitions(state, 'add', { canonical_name: 'TestTerm', definition: 'def text' }, validConsent);

    // Advance round to >= 3 for closure-readiness.
    state.round = 3;
    return { state, cernId, defId };
  }

  it('full closure path succeeds when every element is ratified', () => {
    let { state, cernId, defId } = buildFullState();

    // Ratify all NCs (2-tuple return).
    [state] = ratifyNecessaryCondition(state, { elementId: 'NCON-1', ratificationText: 'ok1' }, validConsent);
    [state] = ratifyNecessaryCondition(state, { elementId: 'NCON-2', ratificationText: 'ok2' }, validConsent);

    // Ratify RC (3-tuple return — first element is newState).
    [state] = ratifyResolveCondition(state, { elementId: 'RCON-1', ratificationText: 'rcon-ok' }, validConsent);

    // Ratify Concern (2-tuple return).
    [state] = ratifyConcern(state, cernId, validConsent);

    // Ratify Definition — manageDefinitions(state, 'ratify', { id }, consent) returns [null, newState, error].
    let defErr;
    [, state, defErr] = manageDefinitions(state, 'ratify', { id: defId }, validConsent);
    expect(defErr).toBeNull();

    saveState(state, statePath);

    // Present
    const present = handlePresentClosingArgument({ state_file: statePath, consent: validConsent });
    expect(present.isError).toBeFalsy();

    // Confirm go
    const go = handleConfirmClosureGo({ state_file: statePath, consent: validConsent });
    expect(go.isError).toBeFalsy();
    const finalState = loadState(statePath);
    expect(finalState.proofStatus).toBe('finish');
  });

  it('present_closing_argument refuses with FIRST_YES_GATE_FAILED when NCs are draft', () => {
    let { state, cernId, defId } = buildFullState();

    // Ratify everything except NCs.
    [state] = ratifyResolveCondition(state, { elementId: 'RCON-1', ratificationText: 'rcon-ok' }, validConsent);
    [state] = ratifyConcern(state, cernId, validConsent);
    [, state] = manageDefinitions(state, 'ratify', { id: defId }, validConsent);
    saveState(state, statePath);

    const result = handlePresentClosingArgument({ state_file: statePath, consent: validConsent });
    expect(result.isError).toBe(true);
    const payload = JSON.parse(result.content[0].text);
    expect(payload.code).toBe('FIRST_YES_GATE_FAILED');
    expect(payload.unratified_ids).toEqual(expect.arrayContaining(['NCON-1', 'NCON-2']));
  });

  it('mid-revision cycle resets ratificationStatus to draft and forces re-ratify', () => {
    let { state } = buildFullState();
    [state] = ratifyNecessaryCondition(state, { elementId: 'NCON-1', ratificationText: 'first' }, validConsent);
    expect(state.elements.get('NCON-1').ratificationStatus).toBe('ratified');

    // Revise the NC's statement → resets to draft (state.js:531 logic).
    const reviseResult = applyOperations(state, [
      { op: 'revise', target: 'NCON-1', statement: 'NC1 revised text' },
    ], validConsent);
    state = reviseResult.state;
    expect(state.elements.get('NCON-1').ratificationStatus).toBe('draft');

    // Re-ratify should succeed.
    const [newState, err] = ratifyNecessaryCondition(
      state,
      { elementId: 'NCON-1', ratificationText: 'second' },
      validConsent,
    );
    expect(err).toBeNull();
    expect(newState.elements.get('NCON-1').ratificationStatus).toBe('ratified');
  });

  it('closing-argument refuses when one NC is draft and the other is ratified (partition correctness)', () => {
    let { state, cernId, defId } = buildFullState();
    // Only ratify NCON-1, leave NCON-2 draft to test partition split.
    [state] = ratifyNecessaryCondition(state, { elementId: 'NCON-1', ratificationText: 'ok' }, validConsent);
    [state] = ratifyResolveCondition(state, { elementId: 'RCON-1', ratificationText: 'rcon-ok' }, validConsent);
    [state] = ratifyConcern(state, cernId, validConsent);
    [, state] = manageDefinitions(state, 'ratify', { id: defId }, validConsent);
    saveState(state, statePath);

    // Present should fail because NCON-2 is still draft — gate refuses with NCON-2 in unratified_ids; NCON-1 is excluded since it ratified.
    const present = handlePresentClosingArgument({ state_file: statePath, consent: validConsent });
    expect(present.isError).toBe(true);
    const payload = JSON.parse(present.content[0].text);
    expect(payload.unratified_ids).toContain('NCON-2');
    expect(payload.unratified_ids).not.toContain('NCON-1');
  });
});
```

- [ ] **Step 2: Run test to verify it fails (against incomplete impl)**

```bash
cd skills/design-large-task/proof-mcp && npx vitest run __tests__/closure-path-integration.test.js
```

Expected: depends on prior tasks. If Tasks 1-2 shipped, the integration tests should pass without additional implementation. If they fail, the failure points to a real integration bug to fix in this task.

- [ ] **Step 3: Implement integration fixes (if any)**

If the integration tests reveal an issue (e.g., closing-argument envelope partition logic broken, or closure check wrong), fix in the appropriate file (likely `closing-argument.js`, `metrics.js`, or `state.js`'s `recordDesignerGo`). Most likely scenario per the spec: no implementation changes needed; the integration test verifies that Tasks 1-2 plus the existing first-yes gate shipped in sprint-d-1-fix-proof-mcp produces a working closure path end-to-end.

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd skills/design-large-task/proof-mcp && npx vitest run __tests__/closure-path-integration.test.js
```

Expected: PASS — 4 tests.

Then full suite:

```bash
cd skills/design-large-task/proof-mcp && npm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

Single commit covers both the `export` keyword addition (Step 0) and the new integration test file (Step 1) — they're a coherent unit (the test cannot import the function without the export).

```bash
git add skills/design-large-task/proof-mcp/server.js skills/design-large-task/proof-mcp/__tests__/closure-path-integration.test.js
git commit -m "test(proof-mcp): closure-path integration test exercises NC ratify + present + confirm (AC-2.1, AC-5.1)

- export handleConfirmClosureGo so integration test can import it
- new __tests__/closure-path-integration.test.js with 4 cases (full path success, NC-draft refusal, mid-revision cycle, partition correctness)"
```

---

## Task 5: Update stale comment at proof.js:245

**Type:** docs-producing
**Implements:** AC-4.1
**Decision budget:** 0
**Must remain green:** existing `proof.js`-touching tests (the comment change is a no-op for behavior; tests should be unaffected)

**Files:**
- Modify: `skills/design-large-task/proof-mcp/proof.js:245`

**Steps:**

- [ ] **Step 1: Verify before-state**

```bash
sed -n '245p' skills/design-large-task/proof-mcp/proof.js
```

Expected output: `  // NC-only ratificationStatus (NC-18, RULE-8): bulk-ratified at confirm_closure_go;`

- [ ] **Step 2: Apply edit**

Replace the line at `proof.js:245`. The line currently breaks across `proof.js:245-246` in two parts; per spec AC-4.1, only line 245 changes (the "bulk-ratified at confirm_closure_go" clause), and the spec specifies the exact replacement text including the trailing clause about the revise reset:

Before (line 245): `  // NC-only ratificationStatus (NC-18, RULE-8): bulk-ratified at confirm_closure_go;`
After (line 245): `  // NC-only ratificationStatus (NC-18, RULE-8): per-element ratify via ratify_necessary_condition; reset to 'draft' on revise of statement or grounding.`

Note: line 246 (`  // any revise of statement or grounding resets to 'draft'. Orthogonal to .status.`) becomes redundant after this change since the new line 245 absorbs the revise-reset clause. Either keep line 246 as-is (defensible — adds the "Orthogonal to .status" framing) or delete it (cleaner). Deletion is the simpler choice and aligns with the spec's "(text exact)" directive. Delete line 246.

- [ ] **Step 3: Verify after-state**

```bash
sed -n '245p' skills/design-large-task/proof-mcp/proof.js
```

Expected (text exact per spec AC-4.1): `  // NC-only ratificationStatus (NC-18, RULE-8): per-element ratify via ratify_necessary_condition; reset to 'draft' on revise of statement or grounding.`

Verify line 246 (formerly the redundant orthogonality comment) now contains the next code line:

```bash
sed -n '246p' skills/design-large-task/proof-mcp/proof.js
```

Expected: the line that previously sat at line 247 (the `if (type === 'NECESSARY_CONDITION') {` guard).

- [ ] **Step 4: Run tests to verify no regression**

```bash
cd skills/design-large-task/proof-mcp && npm test
```

Expected: PASS — comment change is a no-op for behavior.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/proof.js
git commit -m "docs(proof-mcp): update stale comment at proof.js:245 (AC-4.1)"
```

---

## Task 6: Add `ratify_necessary_condition` bullet to SKILL.md

**Type:** docs-producing
**Implements:** AC-6.1
**Decision budget:** 0
**Must remain green:** n/a (docs change)

**Files:**
- Modify: `skills/design-large-task/SKILL.md` (insert one bullet after line 434)

**Steps:**

- [ ] **Step 1: Verify insertion point**

```bash
sed -n '434p' skills/design-large-task/SKILL.md
```

Expected output: `- **`ratify_resolve_condition`** — designer's sign-off on a single Resolve Condition. Sequential by design; one element_id per call.`

- [ ] **Step 2: Insert new bullet at line 435**

Insert the following line as a new line 435:

```markdown
- **`ratify_necessary_condition`** — designer's sign-off on a single Necessary Condition. Sequential by design; one element_id (NCON-N) per call. Sets ratificationStatus to 'ratified' on success. Refused when proof is finished, when the NC is withdrawn, when the NC is already ratified, or when consent token is invalid.
```

- [ ] **Step 3: Verify after-state**

```bash
sed -n '434,436p' skills/design-large-task/SKILL.md
```

Expected: line 434 unchanged, line 435 contains the new bullet, line 436 contains the old line 435 content (likely the `manage_definitions` bullet or whatever follows).

- [ ] **Step 4: No tests to run** (docs change)

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/SKILL.md
git commit -m "docs(skill): add ratify_necessary_condition to proof-MCP toolset (AC-6.1)"
```

---

## Task 7: Append decision-record entry to cross-sprint corpus

**Type:** docs-producing
**Implements:** AC-7.1
**Decision budget:** 1
**Must remain green:** n/a (docs)

**Files:**
- Modify: `docs/chester/decision-record/decision-record.md` (append new entry at end)

**Steps:**

- [ ] **Step 1: Read existing corpus structure**

```bash
tail -60 docs/chester/decision-record/decision-record.md
```

Note the entry format the prior sprint-d-1-fix-proof-mcp records used (commit 84ef381 added 7 entries). Match heading style, numbering, sprint-tag conventions.

- [ ] **Step 2: Append new entry**

Append to `docs/chester/decision-record/decision-record.md`:

```markdown
## sprint-d-1-fix-proof-mcp-2: NC ratify path closes first-yes-gate cycle (2026-05-08)

**Sprint:** `cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp-2`

**Context.** sprint-d-1-fix-proof-mcp shipped two interacting changes in the same merge: AC-2.4 removed the bulk-ratify-NCs hook from `recordDesignerGo`, and AC-4.1 / AC-4.2 added a per-element first-yes precondition gate to `present_closing_argument` requiring every active NC to have `ratificationStatus === 'ratified'`. Both ACs were individually correct; their interaction left no code path that could flip an NC's `ratificationStatus` to `'ratified'`. Result: `present_closing_argument` was unreachable, formal closure unreachable, closing-argument envelope unproducable.

**Decision.** Ship a dedicated `ratify_necessary_condition` tool mirroring `ratify_resolve_condition`'s shape (state-layer function + server tool registration + handler), with three intentional divergences: 2-tuple return shape (matches `ratifyConcern` rather than RC's 3-tuple); `ALREADY_RATIFIED` guard (NC ratify is non-idempotent — re-ratifying a ratified NC errors); no `processFriction` arms (NC ratify is not a friction trigger).

**Rationale.** Per-element ratify discipline aligns with the per-element first-yes precondition AC-4.1 was clearly aiming for. Alternative paths (restore bulk-ratify, drop NCs from gate, lazy auto-ratify on RC bundle) all weakened the audit semantic AC-4.1 established. Dedicated tool keeps the ratify-discipline shape symmetric across element types that have ratify lifecycle (RC, Concern, Definition, NC).

**Lesson.** When adding a per-element gate, verify a write path exists for every element type the gate references. The closure-path integration test added by AC-5.1 catches this class of cross-AC interaction miss in CI: NC creation → NC ratify → first-yes gate clearance → present_closing_argument → confirm_closure_go full chain, gated on assertions about each step. Future maintenance sprints that add gates or remove ratify paths will trigger this test if they break the closure path.

**Out of scope (deferred to sprint-d-2 resume).** PERM-2 text alignment with the new tool surface (the live designer-issued PERM-2 in `sprint-d-2-proof-state.json` scopes ratify-bundle over Rules / Permissions / Evidence / Risks which have no ratify concept; revising it requires designer ratification in the active design session). NCON-15 lifecycle revision (NCON-15 describes draft-then-review for NC text authoring but is silent on the orthogonal `ratificationStatus` lifecycle; whether to revise NCON-15 or author a new NC is a sprint-d-2 design decision). Both deferred items are documented as proposed text and pending-decision notes in the fix-sprint summary for sprint-d-2 resume to act on.
```

- [ ] **Step 3: Verify entry landed**

```bash
tail -40 docs/chester/decision-record/decision-record.md
```

Expected: new entry visible at end of file.

- [ ] **Step 4: No tests** (docs change)

- [ ] **Step 5: Commit**

```bash
git add docs/chester/decision-record/decision-record.md
git commit -m "docs(decision-record): append sprint-d-1-fix-proof-mcp-2 record (AC-7.1)"
```

---

## Task 8: Author PERM-2 proposed-text section in fix-sprint summary

**Type:** docs-producing
**Implements:** AC-8.1
**Decision budget:** 1
**Must remain green:** n/a (docs)

**Files:**
- Create: `docs/chester/working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp-2/summary/sprint-d-1-fix-proof-mcp-2-summary-00.md`

**Notes for the implementer:**

Per spec AC-8.1's observable boundary, the deliverable is **a section inside `sprint-d-1-fix-proof-mcp-2-summary-00.md`** with the heading `## Proposed PERM-2 Revised Text (for sprint-d-2 resume)`. The summary file is normally written by `finish-write-records` at the end of the sprint. This task **creates that file early**, populated with only the PERM-2 section. Task 9 appends the NCON-15 section. `finish-write-records`, when it later runs, must **append** further session-summary content (recap, retrospective lessons, etc.) rather than overwriting — the PERM-2 and NCON-15 sections must survive into the final committed summary because the spec's observable boundary is verified against the final file.

Hand-off note for `finish-write-records`: when the summary file already exists at finish-write-records invocation, append rather than recreate. Read the file's existing sections (PERM-2 proposed text, NCON-15 pending decision) and add the standard session-summary content (proofStatus changes, AC-by-AC outcomes, retrospective notes) below them, preserving the PERM-2 and NCON-15 sections intact.

**Steps:**

- [ ] **Step 1: Read current PERM-2 statement from sprint-d-2 proof state**

```bash
jq -r '.elements["PERM-2"].statement' docs/chester/working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-2/design/sprint-d-2-proof-state.json
```

Expected output: full PERM-2 text starting with "When ratifying a Resolve Condition, any proof element in that Resolve Condition's transitive support..."

- [ ] **Step 2: Create the summary file with PERM-2 section**

Create `summary/sprint-d-1-fix-proof-mcp-2-summary-00.md` with this content:

```markdown
# Sprint D-1 Fix Proof MCP 2 — Summary

**Sprint:** `cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp-2`
**Date:** 2026-05-08

This summary file is initialized by execute-write (Tasks 8 and 9) with two sections that satisfy AC-8.1 and AC-9.1. `finish-write-records` will append additional session-summary content (recap, retrospective notes, AC outcomes) below these sections at sprint finish.

## Proposed PERM-2 Revised Text (for sprint-d-2 resume)

### Current PERM-2 Statement (verbatim from sprint-d-2-proof-state.json)

> When ratifying a Resolve Condition, any proof element in that Resolve Condition's transitive support — the anchored Concern, every Necessary Condition cited in the Resolve Condition's reasoning chain, and every Rule, Permission, Evidence, or Definition those Necessary Conditions ground onto, recursively — may be ratified in the same round. Relieves RULE-17 (single-topic discipline) for the duration of the bundled ratify turn. Supersedes PERM-1's narrow 1:1 RC+Concern scope.

### Proposed Revised Statement

> When ratifying a Resolve Condition, any proof element in that Resolve Condition's transitive support that has a ratify lifecycle — the anchored Concern, every Necessary Condition cited in the Resolve Condition's reasoning chain, and any Vocabulary Definition those elements reference — may be ratified in the same round. Rules, Permissions, Evidence, and Risks carry provenance via their `source` field and have no ratify lifecycle; they are excluded from the bundled ratify scope. Relieves RULE-17 (single-topic discipline) for the duration of the bundled ratify turn. Supersedes PERM-1's narrow 1:1 RC+Concern scope.

### Rationale

The original PERM-2 statement scopes ratify-bundle over Rules, Permissions, Evidence, and Risks. The proof MCP tool surface has no ratify concept for these element types — `manage_concerns op:ratify`, `ratify_resolve_condition`, `manage_definitions op:ratify`, and the new `ratify_necessary_condition` (shipped this fix sprint) are the only ratify tools. Rules, Permissions, Evidence, and Risks carry provenance via the `source` field on element creation (`'codebase'`, `'designer'`, `'industry'`, etc.); their authority is established at creation, not via a separate ratify lifecycle.

Aligning PERM-2's text with the implemented tool surface preserves the spirit of the designer's original directive (broad transitive ratify-bundle relief during RC ratify) while restricting the scope to elements the implementation can actually ratify. Any future expansion of ratify discipline to additional element types would require a separate Permission revision.

### Coordination Plan for sprint-d-2 Resume

1. Sprint-d-2 resume session re-enters at round 19 (RCON-2 already added; pending ratify).
2. As the first action of the resume, agent presents the proposed revised PERM-2 text above to the designer via a ratify-readback turn.
3. Designer ratifies, revises, or rejects.
4. On ratify: agent calls `submit_proof_update` with `{ op: 'revise', target: 'PERM-2', statement: '<revised text>' }` and consent source `'designer'` quoting the designer's accept.
5. Sprint-d-2 resume continues from round 20 with the revised PERM-2 governing the ratify-bundle relief.

This deferral is intentional. The fix sprint cannot unilaterally revise a designer-issued Permission in a live proof state — designer consent in the active design session is the only valid path. The fix sprint produces the proposed text to make sprint-d-2 resume's coordination cost minimal.
```

- [ ] **Step 3: Verify section landed**

```bash
grep -n "## Proposed PERM-2 Revised Text" docs/chester/working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp-2/summary/sprint-d-1-fix-proof-mcp-2-summary-00.md
```

Expected: one match, the heading line of the new section.

- [ ] **Step 4: No tests** (docs)

- [ ] **Step 5: Commit**

```bash
git add docs/chester/working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp-2/summary/sprint-d-1-fix-proof-mcp-2-summary-00.md
git commit -m "docs(sprint-d-1-fix-proof-mcp-2): author PERM-2 proposed-text section in summary (AC-8.1)"
```

---

## Task 9: Append NCON-15 pending-decision section to fix-sprint summary

**Type:** docs-producing
**Implements:** AC-9.1
**Decision budget:** 0
**Must remain green:** n/a (docs)

**Files:**
- Modify: `docs/chester/working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp-2/summary/sprint-d-1-fix-proof-mcp-2-summary-00.md` (file created in Task 8; this task appends a new section to it)

**Notes for the implementer:**

Per spec AC-9.1's observable boundary, the deliverable is a section inside `sprint-d-1-fix-proof-mcp-2-summary-00.md` with the heading `## NCON-15 Lifecycle Gap (sprint-d-2 owned)`. Task 8 created the summary file with the PERM-2 section. This task appends the NCON-15 section below it. The same hand-off note from Task 8 applies — `finish-write-records` must append rather than overwrite when it later runs.

**Steps:**

- [ ] **Step 1: Read current NCON-15 statement from sprint-d-2 proof state**

```bash
jq -r '.elements["NCON-15"].statement' docs/chester/working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-2/design/sprint-d-2-proof-state.json
```

Expected output: NCON-15 text starting with "Necessary Conditions are authored by the agent in a draft-then-review cycle..."

- [ ] **Step 2: Append NCON-15 section to summary file**

Append the following content to `summary/sprint-d-1-fix-proof-mcp-2-summary-00.md` (immediately after the PERM-2 coordination plan, separated by a blank line):

```markdown
## NCON-15 Lifecycle Gap (sprint-d-2 owned)

### Current NCON-15 Statement (verbatim from sprint-d-2-proof-state.json)

> Necessary Conditions are authored by the agent in a draft-then-review cycle. Each NC carries five required fields: statement (the must-be-true claim), grounding (pointers to active Evidence/Rule elements), reasoning chain (IF...THEN... structure connecting grounding to statement), collapse test (what breaks if NC removed from proof), rejected alternatives (design-space candidates considered and discarded with reasons). Agent drafts the full NC before designer review per PM-as-decider; designer-facing turn prints the full text of all five fields (not just ID + summary). Designer responds with accept, push back, or revise; revisions cycle until accept. Rejected alternatives field accumulates each refinement pass as paper trail — prior drafts that lost to the landed shape stay recorded with reasons, not deleted. Multi-NC authoring per round prohibited unless Concern coverage requires NC+RC pair (slot 3 sub-state).

### Observation

NCON-15 describes the NC text-authoring lifecycle (draft → review → accept). It is silent on the orthogonal `ratificationStatus` lifecycle now made structurally real by sprint-d-1-fix-proof-mcp's first-yes precondition (AC-4.1) and sprint-d-1-fix-proof-mcp-2's `ratify_necessary_condition` tool (this sprint).

The two lifecycles are independent:

- **Text-authoring lifecycle** (NCON-15 territory) — `state.statement` / `state.grounding` / `state.reasoning_chain` / `state.collapse_test` / `state.rejected_alternatives`. Designer-accept on text closes this cycle.
- **Ratification lifecycle** (new territory) — `state.ratificationStatus`. Designer-attestation closes this cycle. `ratify_necessary_condition` flips draft → ratified; `op:revise` of statement or grounding flips ratified → draft.

NCON-15 currently conflates "designer accept on text" with structural commitment to the NC. With ratify lifecycle now real, that conflation is no longer accurate — designer can text-accept an NC without ratifying it, and the proof MCP's first-yes gate will refuse `present_closing_argument` if any active NC remains in `ratificationStatus: 'draft'` regardless of text-acceptance.

### Two Paths Sprint-D-2 Can Take

1. **Revise NCON-15** to add a sentence about the ratify step. Example revision text: "After designer accept on text, the NC enters `ratificationStatus: 'draft'`. A separate ratify turn (per slot 2 of the round-cycle queue) flips ratificationStatus to 'ratified' via `ratify_necessary_condition`. Revising statement or grounding after ratification reverts ratificationStatus to draft, requiring re-ratification before closure."

2. **Author a new NC** covering the ratify lifecycle as a separate concern. The new NC would name the ratify-cycle invariants (one ratify call per NC; mid-revision reset; first-yes gate dependency) without expanding NCON-15's authoring-cycle scope.

### Deferral

This is a sprint-d-2 design decision; the fix sprint does not touch the proof state. The decision affects sprint-d-2's proof body and closure path; making it requires designer attention in the active design session, not a code-fix sprint.

Sprint-d-2 resume should address this either before or after the PERM-2 alignment turn, at the designer's preference.
```

- [ ] **Step 3: Verify section landed**

```bash
grep -n "## NCON-15 Lifecycle Gap" docs/chester/working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp-2/summary/sprint-d-1-fix-proof-mcp-2-summary-00.md
```

Expected: one match, the heading line of the new section. Both `## Proposed PERM-2 Revised Text` (Task 8) and `## NCON-15 Lifecycle Gap` (this task) should now exist in the same file.

- [ ] **Step 4: No tests** (docs)

- [ ] **Step 5: Commit**

```bash
git add docs/chester/working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp-2/summary/sprint-d-1-fix-proof-mcp-2-summary-00.md
git commit -m "docs(sprint-d-1-fix-proof-mcp-2): append NCON-15 pending-decision section to summary (AC-9.1)"
```

<!-- created-at: 2026-05-09T02:31:54Z -->
<!-- produced-by plan-build@v0004 -->
