# Plan: Cluster D.1 — Build Proof Layer

**Sprint:** cluster-d-build-shared-understanding/sprint-d-1
**Spec:** `docs/chester/working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1/spec/cluster-d-1-spec-03.md`
**Execution mode:** subagent

> **For agentic workers:** Use execute-write to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The `Execution mode` field selects which execute-write section runs.

## Goal

Extend the proof MCP server and skill body so the proof layer becomes a self-contained service delivering commonly understood design requirements to `design-specify`, with provenance on every mutation, designer-consent gating, atomic persistence, schema versioning, hard closure gate, full closure envelope, and explicit re-open.

## Architecture

Architect A — Universal Generic Tool Surface over heterogeneous internal storage. Three new MCP tools (`withdraw`, `manage_definitions`, `reopen_proof`) plus consent threading across existing mutating tools. State stays heterogeneous (`state.concerns[]`, `state.elements: Map`, new `state.definitions[]` slot). Schema additions are additive — no migration. Closing-argument derivation remains a pure server-side function with extended envelope. PERM-1 registered against NC-5 for FRICTION terminal-disposition exception.

## Tech Stack

- Node.js (ES modules) — `proof-mcp/package.json` `"type": "module"`
- vitest — test runner; `npm test` runs `vitest run`
- `@modelcontextprotocol/sdk` — MCP server framework
- `fs` `writeFileSync` + `renameSync` — persistence (atomic write-tmp-rename pattern)

All commands run from `skills/design-large-task/proof-mcp/`.

---

## Task 1: Schema version constant and refusal

**Type:** code-producing
**Implements:** AC-6.2
**Decision budget:** 1
**Must remain green:** new `schema-version.test.js`; existing `loadstate-backfill.test.js`; existing `state.test.js`

**Files:**
- Modify: `skills/design-large-task/proof-mcp/proof.js` — add `SCHEMA_VERSION` export
- Modify: `skills/design-large-task/proof-mcp/state.js:32-55` — `initializeState` sets `schemaVersion: SCHEMA_VERSION`
- Modify: `skills/design-large-task/proof-mcp/state.js:449-469` — `loadState` checks version before backfill, throws `SchemaVersionError` if `raw.schemaVersion > SCHEMA_VERSION`; otherwise backfills `schemaVersion ??= SCHEMA_VERSION`
- Test: `skills/design-large-task/proof-mcp/__tests__/schema-version.test.js`

**Steps (TDD):**

- [ ] **Step 1: Write failing tests**

```js
import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { loadState, initializeState } from '../state.js';
import { SCHEMA_VERSION } from '../proof.js';

function tmpFile(content) {
  const dir = mkdtempSync(join(tmpdir(), 'chester-d1-'));
  const p = join(dir, 'state.json');
  writeFileSync(p, content, 'utf-8');
  return p;
}

describe('schema version', () => {
  it('SCHEMA_VERSION is exported and is 1', () => {
    expect(SCHEMA_VERSION).toBe(1);
  });

  it('initializeState sets schemaVersion to current version', () => {
    const s = initializeState('test problem');
    expect(s.schemaVersion).toBe(SCHEMA_VERSION);
  });

  it('loadState refuses state file with schemaVersion > runtime', () => {
    const p = tmpFile(JSON.stringify({ schemaVersion: 99, round: 0, elements: [], concerns: [] }));
    expect(() => loadState(p)).toThrowError(/schema/i);
  });

  it('loadState backfills missing schemaVersion to current version', () => {
    const p = tmpFile(JSON.stringify({ round: 0, elements: [], concerns: [], elementCounters: {}, concernCounter: 0, revisionLog: [], ratificationLog: [], frictionLog: [] }));
    const s = loadState(p);
    expect(s.schemaVersion).toBe(SCHEMA_VERSION);
  });

  it('loadState accepts schemaVersion: 1', () => {
    const p = tmpFile(JSON.stringify({ schemaVersion: 1, round: 0, elements: [], concerns: [], elementCounters: {}, concernCounter: 0, revisionLog: [], ratificationLog: [], frictionLog: [] }));
    const s = loadState(p);
    expect(s.schemaVersion).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run __tests__/schema-version.test.js`
Expected: FAIL (SCHEMA_VERSION not exported, no version logic in loadState)

- [ ] **Step 3: Write minimal implementation**

In `proof.js` add at top of exports:

```js
export const SCHEMA_VERSION = 1;
```

In `state.js` import `SCHEMA_VERSION` from `./proof.js`. Modify `initializeState` to include `schemaVersion: SCHEMA_VERSION` as first field. Modify `loadState` to check version BEFORE backfill:

```js
export function loadState(filePath) {
  const raw = JSON.parse(readFileSync(filePath, 'utf-8'));
  if (raw.schemaVersion !== undefined && raw.schemaVersion > SCHEMA_VERSION) {
    const err = new Error(`schemaVersion ${raw.schemaVersion} exceeds runtime SCHEMA_VERSION ${SCHEMA_VERSION}`);
    err.code = 'SCHEMA_VERSION_TOO_NEW';
    throw err;
  }
  raw.schemaVersion ??= SCHEMA_VERSION;
  // ... existing backfill ...
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `cd skills/design-large-task/proof-mcp && npm test`
Expected: PASS — schema-version.test.js plus all existing tests still green

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/proof.js skills/design-large-task/proof-mcp/state.js skills/design-large-task/proof-mcp/__tests__/schema-version.test.js
git commit -m "feat(proof-mcp): add schemaVersion field with forward-incompatible refusal (NC-15)"
```

---

## Task 2: Atomic saveState via write-tmp-then-rename

**Type:** code-producing
**Implements:** AC-6.1
**Decision budget:** 1
**Must remain green:** new `atomic-persistence.test.js`; existing `state.test.js`; all existing tests using `saveState`

**Files:**
- Modify: `skills/design-large-task/proof-mcp/state.js:12` — add `renameSync` to fs imports
- Modify: `skills/design-large-task/proof-mcp/state.js:436-441` — rewrite `saveState` to write `<filePath>.tmp` then rename
- Test: `skills/design-large-task/proof-mcp/__tests__/atomic-persistence.test.js`

**Steps (TDD):**

- [ ] **Step 1: Write failing tests**

```js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync, mkdtempSync, existsSync, statSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

// vi.mock must be hoisted to top of test file. Use vi.importActual to keep real fs
// for everything except renameSync, which we wrap as a vi.fn() so we can fail it on demand.
vi.mock('fs', async () => {
  const actual = await vi.importActual('fs');
  return { ...actual, renameSync: vi.fn(actual.renameSync) };
});

import { renameSync } from 'fs';
import { initializeState, saveState } from '../state.js';

function tmpDir() { return mkdtempSync(join(tmpdir(), 'chester-d1-')); }

describe('atomic persistence', () => {
  beforeEach(() => {
    // restore wrapped renameSync to actual implementation between tests
    vi.mocked(renameSync).mockImplementation(async (...args) => {
      const actual = await vi.importActual('fs');
      return actual.renameSync(...args);
    });
  });
  afterEach(() => vi.mocked(renameSync).mockClear());

  it('saveState writes via tmp file then renames', () => {
    const dir = tmpDir();
    const p = join(dir, 'state.json');
    const s = initializeState('test problem');
    saveState(s, p);
    expect(renameSync).toHaveBeenCalled();
    const written = JSON.parse(readFileSync(p, 'utf-8'));
    expect(written.round).toBe(0);
  });

  it('rename failure leaves original state file unchanged', () => {
    const dir = tmpDir();
    const p = join(dir, 'state.json');
    const original = initializeState('test problem');
    original.round = 7;
    saveState(original, p);
    vi.mocked(renameSync).mockImplementation(() => { throw new Error('disk full'); });
    const next = { ...original, round: 99 };
    expect(() => saveState(next, p)).toThrowError(/disk full/);
    const after = JSON.parse(readFileSync(p, 'utf-8'));
    expect(after.round).toBe(7);
  });
});
```

**ESM mocking note:** in `"type": "module"` packages, named imports like `import { renameSync } from 'fs'` create live bindings captured at module-load time. `vi.spyOn(fs, 'renameSync')` after-the-fact does NOT intercept those bindings. The correct pattern is `vi.mock('fs', ...)` at the top of the test file (Vitest hoists this above all imports automatically) so the bindings resolve to the mocked module from the start. The mock wraps `renameSync` in a `vi.fn` that defaults to the real implementation; tests override the implementation per case.

- [ ] **Step 2: Run to verify fail**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run __tests__/atomic-persistence.test.js`
Expected: FAIL (current saveState calls writeFileSync directly, no rename)

- [ ] **Step 3: Implement**

Modify `state.js` import line 12:

```js
import { readFileSync, writeFileSync, renameSync } from 'fs';
```

Replace `saveState` body:

```js
export function saveState(state, filePath) {
  const serializable = { ...state, elements: Object.fromEntries(state.elements) };
  const tmpPath = filePath + '.tmp';
  writeFileSync(tmpPath, JSON.stringify(serializable, null, 2), 'utf-8');
  renameSync(tmpPath, filePath);
}
```

**Note:** keep `Object.fromEntries(state.elements)` for the elements field — existing `loadState` at `state.js:451` deserializes via `new Map(Object.entries(raw.elements))`. Only the persistence pathway changes (write-tmp → rename); the JSON shape is identical to today.

- [ ] **Step 4: Verify pass**

Run: `cd skills/design-large-task/proof-mcp && npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/state.js skills/design-large-task/proof-mcp/__tests__/atomic-persistence.test.js
git commit -m "feat(proof-mcp): atomic saveState via write-tmp-then-rename (NC-17)"
```

---

## Task 3: validateConsentToken and threading through existing mutating tools

**Type:** code-producing
**Implements:** AC-3.1, AC-3.2 (partial — bulk-ratify and auto-friction inheritance covered in later tasks)
**Decision budget:** 3
**Must remain green:** new `consent.test.js`; existing `state.test.js`, `concerns.test.js`, `friction-lifecycle.test.js`, `closing-argument.test.js`, `server.test.js`, `acceptance.test.js`

**Files:**
- Modify: `skills/design-large-task/proof-mcp/proof.js` — add `validateConsentToken` export
- Modify: `skills/design-large-task/proof-mcp/state.js` — every mutating function (`addConcern`, `lockConcerns`, `applyOperations`, `manageFriction`, `overrideFrictionDisposition`, `ratifyResolveCondition`, `recordClosingArgPresented`, `recordDesignerGo`) accepts `consent` arg, validates pre-flight, returns `INVALID_CONSENT` error before any mutation
- Modify: `skills/design-large-task/proof-mcp/server.js` — every mutating handler extracts `consent` from args, passes to state-layer, returns `{ isError: true, content: [{ type: 'text', text: JSON.stringify({ code: 'INVALID_CONSENT', message }) }] }` on failure
- Modify: existing tests in `__tests__/` — add valid consent token to every mutating call. **Full enumeration of files affected** (verified by grep for `addConcern|lockConcerns|applyOperations|manageFriction|overrideFrictionDisposition|ratifyResolveCondition|recordClosingArgPresented|recordDesignerGo`):
  - `state.test.js`, `concerns.test.js`, `friction-lifecycle.test.js`, `closing-argument.test.js`, `server.test.js`, `acceptance.test.js`
  - `closing-argument-end-to-end.test.js`, `withdrawal-disposition.test.js`, `friction-detection.test.js`, `eleventh-closure-condition.test.js`, `friction-element-type.test.js`, `two-yes-flags.test.js`, `mutation-clears-flags.test.js`, `trigger-evaluator.test.js`
  - Run `cd skills/design-large-task/proof-mcp/__tests__ && grep -l "addConcern\|lockConcerns\|applyOperations\|manageFriction\|overrideFrictionDisposition\|ratifyResolveCondition\|recordClosingArgPresented\|recordDesignerGo" *.test.js` to confirm no file missed
- Test: `skills/design-large-task/proof-mcp/__tests__/consent.test.js`

**Note on `applyOperations` return shape.** Current `applyOperations` returns an OBJECT (`{ state, added, revised, withdrawn, errors, integrityWarnings, completeness, challengeTrigger, stallDetected, closure, friction_hints }`), NOT a tuple. This shape is preserved by Task 3 — only the `consent` parameter is added at the front. Callers and tests use object destructure: `const result = applyOperations(state, ops, consent); state = result.state; ...`. Other state-layer functions (`addConcern`, `lockConcerns`, `manageFriction`, `overrideFrictionDisposition`, `ratifyResolveCondition`, `ratifyConcern`, `manageDefinitions`, `withdrawElement`, `withdrawConcern`, `withdrawDefinition`, `recordClosingArgPresented`, `recordDesignerGo`, `reopenProof`) return tuples; these patterns are preserved as well. The `INVALID_CONSENT` error path for `applyOperations` returns `{ ...state-result-shape, errors: [...existing, 'INVALID_CONSENT: ...'] }` — the `errors` field carries it.

**Note on server.js handler patches.** `server.js` handlers must be updated to extract `consent` from args and forward to state-layer functions in the same commit as the state-layer signature change — partial commits leave `acceptance.test.js` red. Patch order within Task 3: (1) state-layer signatures + `validateConsentToken`, (2) server.js handler call sites, (3) bulk-patch existing tests, (4) write `consent.test.js`, (5) run full suite.

**Steps (TDD):**

- [ ] **Step 1: Write failing tests**

```js
import { describe, it, expect } from 'vitest';
import { validateConsentToken } from '../proof.js';
import { initializeState, addConcern } from '../state.js';

const valid = { source: 'designer', rationale: 'test' };
const validNoRationale = { source: 'agent-proposed-designer-confirmed' };

describe('validateConsentToken', () => {
  it('accepts shape with source designer and rationale', () => {
    expect(validateConsentToken(valid)).toEqual({ valid: true });
  });
  it('accepts shape with source agent-proposed-designer-confirmed without rationale', () => {
    expect(validateConsentToken(validNoRationale)).toEqual({ valid: true });
  });
  it('rejects missing token', () => {
    expect(validateConsentToken(undefined).valid).toBe(false);
    expect(validateConsentToken(null).valid).toBe(false);
  });
  it('rejects empty object', () => {
    expect(validateConsentToken({}).valid).toBe(false);
  });
  it('rejects unknown source', () => {
    expect(validateConsentToken({ source: 'unknown' }).valid).toBe(false);
  });
  it('rejects non-string rationale', () => {
    expect(validateConsentToken({ source: 'designer', rationale: 42 }).valid).toBe(false);
  });
});

describe('addConcern with consent', () => {
  it('rejects without consent and leaves state unchanged', () => {
    const s = initializeState('test problem');
    const [id, newState, hints, error] = addConcern(s, { label: 'C-1', description: 'd' }, undefined);
    expect(error).toMatch(/INVALID_CONSENT/);
    expect(newState).toEqual(s);
  });
  it('accepts with valid consent', () => {
    const s = initializeState('test problem');
    const [id, newState, hints, error] = addConcern(s, { label: 'C-1', description: 'd' }, valid);
    expect(error).toBeNull();
    expect(newState.concerns).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run to verify fail**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run __tests__/consent.test.js`
Expected: FAIL

- [ ] **Step 3: Implement**

In `proof.js` add:

```js
export function validateConsentToken(token) {
  if (!token || typeof token !== 'object') {
    return { valid: false, reason: 'consent token missing or not an object' };
  }
  if (token.source !== 'designer' && token.source !== 'agent-proposed-designer-confirmed') {
    return { valid: false, reason: `consent.source must be "designer" or "agent-proposed-designer-confirmed"; got ${token.source}` };
  }
  if (token.rationale !== undefined && typeof token.rationale !== 'string') {
    return { valid: false, reason: 'consent.rationale must be a string when present' };
  }
  return { valid: true };
}
```

In `state.js`, modify each mutating function signature to accept `consent` as final arg. Pre-flight validation:

```js
export function addConcern(state, input, consent) {
  const { valid, reason } = validateConsentToken(consent);
  if (!valid) return [null, state, [], `INVALID_CONSENT: ${reason}`];
  // ... existing logic ...
}
```

Repeat for `lockConcerns`, `applyOperations`, `manageFriction`, `overrideFrictionDisposition`, `ratifyResolveCondition`, `recordClosingArgPresented`, `recordDesignerGo`. Pre-flight returns BEFORE any state mutation, BEFORE any flag clear, BEFORE round increment.

In `server.js` every mutating handler:

```js
async function handleManageConcerns(args) {
  const { state_file, op, label, description, consent } = args;
  let state = loadState(state_file);
  if (op === 'add') {
    const [id, newState, hints, error] = addConcern(state, { label, description }, consent);
    if (error) {
      const code = error.startsWith('INVALID_CONSENT') ? 'INVALID_CONSENT' : 'DOMAIN_ERROR';
      return { isError: true, content: [{ type: 'text', text: JSON.stringify({ code, message: error }) }] };
    }
    saveState(newState, state_file);
    return { content: [{ type: 'text', text: JSON.stringify({ id, friction_hints: hints }) }] };
  }
  // ...
}
```

Bulk-patch existing tests in `__tests__/` to pass `consent: { source: 'designer', rationale: 'test' }` to every mutating call.

- [ ] **Step 4: Verify pass**

Run: `cd skills/design-large-task/proof-mcp && npm test`
Expected: PASS — new consent tests + all existing tests after bulk consent insertion

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/proof.js skills/design-large-task/proof-mcp/state.js skills/design-large-task/proof-mcp/server.js skills/design-large-task/proof-mcp/__tests__/
git commit -m "feat(proof-mcp): consent token validation across mutating tools (NC-8)"
```

---

## Task 4: operationLog field and per-mutation appends

**Type:** code-producing
**Implements:** AC-2.2 (provenance reconstructable), partial AC-2.1
**Decision budget:** 2
**Must remain green:** new `operation-log.test.js`; existing `state.test.js`, `concerns.test.js`, `friction-lifecycle.test.js`

**Files:**
- Modify: `skills/design-large-task/proof-mcp/state.js:32-55` — `initializeState` adds `operationLog: []`
- Modify: `skills/design-large-task/proof-mcp/state.js:449-469` — `loadState` adds `raw.operationLog ??= []`
- Modify: `skills/design-large-task/proof-mcp/state.js` — every mutating function appends to `state.operationLog` after successful mutation, before return
- Test: `skills/design-large-task/proof-mcp/__tests__/operation-log.test.js`

**Steps (TDD):**

- [ ] **Step 1: Write failing tests**

```js
import { describe, it, expect } from 'vitest';
import { initializeState, addConcern, lockConcerns, applyOperations } from '../state.js';

const consent = { source: 'designer', rationale: 'test' };

describe('operationLog', () => {
  it('initializeState seeds operationLog as empty array', () => {
    const s = initializeState('test problem');
    expect(s.operationLog).toEqual([]);
  });

  it('addConcern appends entry with op:add type:CONCERN', () => {
    const s = initializeState('test problem');
    const [id, after] = addConcern(s, { label: 'C-1', description: 'd' }, consent);
    expect(after.operationLog).toHaveLength(1);
    expect(after.operationLog[0]).toMatchObject({
      op: 'add',
      type: 'CONCERN',
      entityId: id,
      consent,
    });
  });

  it('lockConcerns appends entry with op:lock', () => {
    let s = initializeState('test problem');
    [, s] = addConcern(s, { label: 'C-1', description: 'd' }, consent);
    [, s] = addConcern(s, { label: 'C-2', description: 'd' }, consent);
    [s] = lockConcerns(s, consent);
    expect(s.operationLog.find(e => e.op === 'lock')).toBeDefined();
  });

  it('applyOperations appends entry per op', () => {
    let s = initializeState('p');
    s.proofStatus = 'open';
    const ops = [{ op: 'add', type: 'EVIDENCE', statement: 'e1', source: 'codebase' }];
    const result = applyOperations(s, ops, consent);
    s = result.state;
    const adds = s.operationLog.filter(e => e.op === 'add' && e.type === 'EVIDENCE');
    expect(adds.length).toBeGreaterThanOrEqual(1);
  });

  it('every entry has round, op, consent, provenance fields', () => {
    let s = initializeState('test problem');
    [, s] = addConcern(s, { label: 'C-1', description: 'd' }, consent);
    const entry = s.operationLog[0];
    expect(entry).toHaveProperty('round');
    expect(entry).toHaveProperty('op');
    expect(entry).toHaveProperty('consent');
    expect(entry).toHaveProperty('provenance');
  });
});
```

- [ ] **Step 2: Verify fail**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run __tests__/operation-log.test.js`
Expected: FAIL

- [ ] **Step 3: Implement**

In `state.js` `initializeState` add `operationLog: []`. In `loadState` add `raw.operationLog ??= []`.

Add helper:

```js
function appendOperationLog(state, entry) {
  state.operationLog = state.operationLog || [];
  state.operationLog.push({ ...entry, consent: entry.consent ?? null });
}
```

In each mutating function, after the mutation succeeds and before return, append. Examples:

```js
// In addConcern, after pushing to newState.concerns:
appendOperationLog(newState, {
  round: newState.round, op: 'add', entityId: id, type: 'CONCERN',
  consent, changedFields: null,
  provenance: { initialPayload: { label, description: description ?? null } },
});
```

Repeat for: `lockConcerns` (op:'lock', entityId:null, type:null), `applyOperations` per-op (op:add/revise/withdraw with entry per op), `manageFriction` (op:'add', type:'FRICTION'), `overrideFrictionDisposition` (op:'revise', changedFields:['disposition']), `ratifyResolveCondition` (op:'ratify', type:'RESOLVE_CONDITION').

- [ ] **Step 4: Verify pass**

Run: `cd skills/design-large-task/proof-mcp && npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/state.js skills/design-large-task/proof-mcp/__tests__/operation-log.test.js
git commit -m "feat(proof-mcp): operationLog with per-mutation appends (NC-4)"
```

---

## Task 5: Concern status field + ratifyConcern + manage_concerns ratify op

**Type:** code-producing
**Implements:** AC-1.1, AC-2.1 (Concern status), partial AC-3.2
**Decision budget:** 2
**Must remain green:** existing `concerns.test.js`, `acceptance.test.js`, `loadstate-backfill.test.js`; new tests in this task

**Files:**
- Modify: `skills/design-large-task/proof-mcp/state.js:147-161` — `addConcern` sets `status: 'draft'` on new Concern
- Modify: `skills/design-large-task/proof-mcp/state.js:449-469` — `loadState` backfills per-Concern `entry.status`: if `state.concernsLocked === true`, default to `'ratified'`, else `'draft'`
- Modify: `skills/design-large-task/proof-mcp/state.js` — add `ratifyConcern(state, concernId, consent)` function; appends operationLog entry op:'ratify', type:'CONCERN'
- Modify: `skills/design-large-task/proof-mcp/server.js:96-107` — extend `manage_concerns` op enum to `['add', 'lock', 'ratify']`; dispatch ratify
- Modify: `skills/design-large-task/proof-mcp/__tests__/server.test.js:25-27` — update enum regex to `['add', 'lock', 'ratify']`
- Test: extend `__tests__/concerns.test.js`

**Steps (TDD):**

- [ ] **Step 1: Write failing tests** (extend concerns.test.js)

```js
describe('Concern status field', () => {
  const consent = { source: 'designer', rationale: 't' };

  it('addConcern creates Concern with status: draft', () => {
    let s = initializeState('test problem');
    [, s] = addConcern(s, { label: 'C-1', description: 'd' }, consent);
    expect(s.concerns[0].status).toBe('draft');
  });

  it('ratifyConcern transitions status to ratified', () => {
    let s = initializeState('test problem');
    [, s] = addConcern(s, { label: 'C-1', description: 'd' }, consent);
    const id = s.concerns[0].id;
    [s] = ratifyConcern(s, id, consent);
    expect(s.concerns[0].status).toBe('ratified');
  });

  it('ratifyConcern returns NOT_FOUND when id absent', () => {
    let s = initializeState('test problem');
    const [next, error] = ratifyConcern(s, 'CERN-999', consent);
    expect(error).toMatch(/NOT_FOUND/);
  });

  it('loadState backfills draft status on legacy state with concernsLocked: false', () => {
    // legacy fixture: concerns[] entries lacking status field
    const legacy = { round: 0, elements: [], concerns: [{ id: 'CERN-1', label: 'A', description: 'd' }], elementCounters: {}, concernCounter: 1, concernsLocked: false, revisionLog: [], ratificationLog: [], frictionLog: [], operationLog: [] };
    // simulate loadState backfill
    const s = applyConcernStatusBackfill(legacy);
    expect(s.concerns[0].status).toBe('draft');
  });

  it('loadState backfills ratified status on legacy state with concernsLocked: true', () => {
    const legacy = { /* same as above with concernsLocked: true */ };
    const s = applyConcernStatusBackfill(legacy);
    expect(s.concerns[0].status).toBe('ratified');
  });
});
```

(Helper `applyConcernStatusBackfill` may be the loadState path or extracted; choose simplest test boundary.)

Server enum regex update test stays adjacent in `server.test.js`.

- [ ] **Step 2: Verify fail**

Run: `cd skills/design-large-task/proof-mcp && npm test`
Expected: FAIL on new tests

- [ ] **Step 3: Implement**

In `state.js` `addConcern`, after push line:

```js
newState.concerns.push({ id, label, description: description ?? null, status: 'draft' });
```

Add `ratifyConcern`:

```js
export function ratifyConcern(state, concernId, consent) {
  const { valid, reason } = validateConsentToken(consent);
  if (!valid) return [state, `INVALID_CONSENT: ${reason}`];
  const newState = structuredClone(state);
  newState.elements = cloneElements(state.elements);
  const concern = newState.concerns.find(c => c.id === concernId);
  if (!concern) return [state, `NOT_FOUND: concern ${concernId} not found`];
  concern.status = 'ratified';
  newState.closingArgPresentedRound = null;
  newState.closingArgGoRound = null;
  newState.ratificationLog.push({ event: 'concern-ratified', concernId, round: newState.round });
  appendOperationLog(newState, {
    round: newState.round, op: 'ratify', entityId: concernId, type: 'CONCERN',
    consent, changedFields: ['status'],
    provenance: { before: 'draft', after: 'ratified' },
  });
  return [newState, null];
}
```

In `loadState` backfill (after `raw.concerns ??= []`):

```js
const defaultStatus = raw.concernsLocked ? 'ratified' : 'draft';
for (const c of raw.concerns) {
  c.status ??= defaultStatus;
}
```

In `server.js` `manage_concerns` schema, change enum to `['add', 'lock', 'ratify']`. Add concernId arg. Dispatch:

```js
if (op === 'ratify') {
  const [newState, error] = ratifyConcern(state, args.concern_id, consent);
  if (error) return errorResp(error);
  saveState(newState, state_file);
  return { content: [{ type: 'text', text: JSON.stringify({ ratified: args.concern_id }) }] };
}
```

In `__tests__/server.test.js:25-27` update regex:

```js
expect(serverSource).toMatch(/op:\s*\{[^}]*enum:\s*\[\s*'add',\s*'lock',\s*'ratify'\s*\]/s);
```

- [ ] **Step 4: Verify pass**

Run: `cd skills/design-large-task/proof-mcp && npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/state.js skills/design-large-task/proof-mcp/server.js skills/design-large-task/proof-mcp/__tests__/concerns.test.js skills/design-large-task/proof-mcp/__tests__/server.test.js
git commit -m "feat(proof-mcp): per-Concern status field + ratifyConcern + manage_concerns ratify op (NC-18, RULE-6)"
```

---

## Task 6: NC ratificationStatus field + bulk-ratify-via-revise reset

**Type:** code-producing
**Implements:** partial AC-2.1 (NC ratificationStatus visible), preparation for AC-5.1 bulk-ratify
**Decision budget:** 2
**Must remain green:** existing `state.test.js`, `loadstate-backfill.test.js`; new tests

**Files:**
- Modify: `skills/design-large-task/proof-mcp/proof.js` — extend NC element creation in `createElement` to set `ratificationStatus: 'draft'`
- Modify: `skills/design-large-task/proof-mcp/state.js:449-469` — backfill per-element `ratificationStatus` for NCs: `if (el.type === 'NECESSARY_CONDITION') el.ratificationStatus ??= 'draft';`
- Modify: `skills/design-large-task/proof-mcp/state.js` — `applyOperations` revise branch: if revising an NC's `statement` or `grounding`, reset `ratificationStatus` to `'draft'` (mirrors RC ratification-clearing-on-revise)
- Test: extend `__tests__/state.test.js` or add new `nc-ratification-status.test.js`

**Steps (TDD):**

- [ ] **Step 1: Write failing tests**

```js
describe('NC ratificationStatus', () => {
  const consent = { source: 'designer', rationale: 't' };

  it('createElement for NC sets ratificationStatus draft', () => {
    const nc = createElement({
      type: 'NECESSARY_CONDITION', statement: 's', source: 'codebase',
      grounding: ['EVID-1'], collapse_test: 'ct', reasoning_chain: 'rc', rejected_alternatives: 'ra'
    }, 'NCON-1', 0);
    expect(nc.ratificationStatus).toBe('draft');
  });

  it('loadState backfills ratificationStatus on legacy NC entries', () => {
    // legacy fixture missing ratificationStatus
    const legacy = { /* state with one NC element lacking field */ };
    const loaded = applyBackfill(legacy);
    const nc = [...loaded.elements.values()].find(e => e.type === 'NECESSARY_CONDITION');
    expect(nc.ratificationStatus).toBe('draft');
  });

  it('revising NC statement resets ratificationStatus to draft', () => {
    let s = /* state with ratified NC */;
    const ops = [{ op: 'revise', target: 'NCON-1', statement: 'new' }];
    const result = applyOperations(s, ops, consent);
    s = result.state;
    const nc = s.elements.get('NCON-1');
    expect(nc.ratificationStatus).toBe('draft');
  });
});
```

- [ ] **Step 2: Verify fail**

Run: `cd skills/design-large-task/proof-mcp && npm test`
Expected: FAIL

- [ ] **Step 3: Implement**

In `proof.js` `createElement` NC branch (after the existing NC validation):

```js
if (type === 'NECESSARY_CONDITION') {
  // existing checks...
  return {
    id, type, status: 'active', ratificationStatus: 'draft',
    statement, source, grounding, collapse_test, reasoning_chain, rejected_alternatives,
    addedInRound: round, revisedInRound: null, revision: 0,
  };
}
```

In `state.js` `loadState` after element backfill loop:

```js
for (const [id, el] of state.elements) {
  if (el.type === 'NECESSARY_CONDITION') el.ratificationStatus ??= 'draft';
}
```

In `applyOperations` revise branch, after applying NC field changes:

```js
if (target.type === 'NECESSARY_CONDITION' && (op.statement !== undefined || op.grounding !== undefined)) {
  target.ratificationStatus = 'draft';
}
```

- [ ] **Step 4: Verify pass**

Run: `cd skills/design-large-task/proof-mcp && npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/proof.js skills/design-large-task/proof-mcp/state.js skills/design-large-task/proof-mcp/__tests__/
git commit -m "feat(proof-mcp): NC ratificationStatus field with revise-resets-to-draft (NC-18, RULE-8)"
```

---

## Task 7: Friction source field + consent propagation in processFriction

**Type:** code-producing
**Implements:** NC-3 (source on Friction), NC-13 (consent inheritance for auto-Friction), partial AC-3.2
**Decision budget:** 2
**Must remain green:** existing `friction-detection.test.js`, `friction-lifecycle.test.js`, `friction-element-type.test.js`; new tests

**Files:**
- Modify: `skills/design-large-task/proof-mcp/proof.js:71-83` — `createElement` FRICTION branch sets `source` field (passed in via input)
- Modify: `skills/design-large-task/proof-mcp/state.js:116-139` — `processFriction(state, parentConsent, parentOp)` accepts consent + parent-op tag; auto-created FRICTION carries `source: 'agent-derivation'`, `creationConsent: parentConsent`; appends operationLog entry op:`'auto-create-friction'`
- Modify: `skills/design-large-task/proof-mcp/state.js` — every call site of `processFriction` (in `applyOperations`, `addConcern`, `lockConcerns`, `manageFriction`, `overrideFrictionDisposition`, `ratifyResolveCondition`) threads `parentConsent` + parentOp tag
- Test: extend `__tests__/friction-detection.test.js` or new `friction-consent.test.js`

**Steps (TDD):**

- [ ] **Step 1: Write failing tests**

```js
describe('Friction source + consent inheritance', () => {
  const consent = { source: 'designer', rationale: 'add risk' };

  it('user-added FRICTION via manage_friction has source set from input', () => {
    /* set up state with anchor_a and anchor_b elements */
    const [id, after] = manageFriction(s, { friction_shape: 'nc-nc-opposing-pull', anchor_a, anchor_b, disposition: 'lived-with', source: 'session-observation' }, consent);
    expect(after.elements.get(id).source).toBe('session-observation');
  });

  it('auto-created permission-risk-linkage Friction has source agent-derivation', () => {
    /* construct state where applyOperations triggers permission-risk-linkage detection */
    const result = applyOperations(s, ops, consent);
    s = result.state;
    const fric = [...s.elements.values()].find(e => e.type === 'FRICTION' && e.friction_shape === 'permission-risk-linkage');
    expect(fric.source).toBe('agent-derivation');
    expect(fric.creationConsent).toEqual(consent);
  });

  it('operationLog entry for auto-create-friction carries parentConsent', () => {
    const result = applyOperations(s, ops, consent);
    s = result.state;
    const auto = s.operationLog.find(e => e.op === 'auto-create-friction');
    expect(auto.consent).toEqual(consent);
    expect(auto.provenance.parentConsent).toEqual(consent);
  });
});
```

- [ ] **Step 2: Verify fail**

- [ ] **Step 3: Implement**

In `proof.js` FRICTION branch:

```js
if (type === 'FRICTION') {
  // existing validations
  const requiredSource = input.source ?? 'agent-derivation';
  return {
    id, type, status: 'active',
    friction_shape: input.friction_shape, anchor_a: input.anchor_a, anchor_b: input.anchor_b,
    disposition: input.disposition, statement: input.statement ?? '',
    source: requiredSource,
    addedInRound: round, revisedInRound: null, revision: 0,
  };
}
```

In `state.js` `processFriction`:

```js
function processFriction(state, parentConsent, parentOp) {
  const { hints, autoCreate } = runFrictionDetection(state.elements, state.concerns);
  for (const cand of autoCreate) {
    const [id, withId] = generateId(state, 'FRICTION');
    state = withId;
    const fric = createElement({
      type: 'FRICTION',
      friction_shape: cand.friction_shape, anchor_a: cand.anchor_a, anchor_b: cand.anchor_b,
      disposition: cand.disposition, statement: cand.statement,
      source: 'agent-derivation',
    }, id, state.round);
    fric.creationConsent = parentConsent ?? null;
    state.elements.set(id, fric);
    state.frictionLog.push({ event: 'auto-created', frictionId: id, round: state.round, friction_shape: fric.friction_shape, disposition: fric.disposition, parentConsent, parentOp });
    appendOperationLog(state, {
      round: state.round, op: 'auto-create-friction', entityId: id, type: 'FRICTION',
      consent: parentConsent ?? null, changedFields: null,
      provenance: { shape: fric.friction_shape, anchor_a: fric.anchor_a, anchor_b: fric.anchor_b, parentOp, parentConsent },
    });
  }
  return { state, hints };
}
```

Update every `processFriction(state)` call site to pass parentConsent + parentOp tag (e.g., `processFriction(state, consent, 'applyOperations')`).

In `loadState` backfill, ensure FRICTION elements get `source ??= 'agent-derivation'`.

- [ ] **Step 4: Verify pass**

Run: `cd skills/design-large-task/proof-mcp && npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/proof.js skills/design-large-task/proof-mcp/state.js skills/design-large-task/proof-mcp/__tests__/
git commit -m "feat(proof-mcp): Friction source field + consent inheritance via processFriction (NC-3, NC-13)"
```

---

## Task 8: definitions.js module + manage_definitions tool (excluding deprecate)

**Type:** code-producing
**Implements:** NC-7, RULE-5; partial AC-2.1 (Definitions in get_proof_state); excludes deprecate (handled by Task 10's universal withdraw routing)
**Decision budget:** 3
**Must remain green:** new `definitions.test.js`; existing tests

**Files:**
- Create: `skills/design-large-task/proof-mcp/definitions.js`
- Modify: `skills/design-large-task/proof-mcp/state.js:32-55` — `initializeState` adds `definitions: []`, `definitionCounter: 0`, `definitionLog: []`
- Modify: `skills/design-large-task/proof-mcp/state.js:449-469` — `loadState` backfills these fields
- Modify: `skills/design-large-task/proof-mcp/state.js` — `manageDefinitions(state, op, payload, consent)` dispatches add/revise/ratify/query-overlap; `deprecate` op routes to a stub error in this task (becomes the universal withdraw path in Task 10)
- Modify: `skills/design-large-task/proof-mcp/server.js` — add `manage_definitions` tool with op enum `['add', 'revise', 'deprecate', 'ratify', 'query-overlap']`
- Modify: `skills/design-large-task/proof-mcp/server.js` — `handleGetProofState` (verify or update) so the new state fields (`definitions`, `definitionCounter`, `definitionLog`, `operationLog`, `schemaVersion`, `lastClosureArtifact`, `proofStatus`) are exposed in the response. If the existing handler is a pass-through over the full state object, no change needed; if it projects a fixed field set, extend the projection. Spec Components §"Read-only tools" lists these fields as required.
- Modify: `skills/design-large-task/proof-mcp/metrics.js` — `computeCompleteness` adds two Definitions counters: `definition_count` (length of `state.definitions`) and `ratified_definition_count` (count where `status === 'ratified'`). Spec Components §"Modified files" lists this as a D.1 change to `metrics.js`.
- Test: `skills/design-large-task/proof-mcp/__tests__/definitions.test.js`
- Test: extend `skills/design-large-task/proof-mcp/__tests__/server.test.js` to assert `handleGetProofState` response includes `definitions` and `operationLog` fields after calling `manage_definitions add`
- Test: extend `skills/design-large-task/proof-mcp/__tests__/metrics.test.js` to assert `computeCompleteness` returns `definition_count` and `ratified_definition_count` keys

**Steps (TDD):**

- [ ] **Step 1: Write failing tests**

```js
import { describe, it, expect } from 'vitest';
import { createDefinition, validateDefinitionInput, queryOverlapCandidates } from '../definitions.js';
import { initializeState, manageDefinitions } from '../state.js';

const consent = { source: 'designer', rationale: 't' };

describe('definitions', () => {
  it('createDefinition produces shaped object', () => {
    const d = createDefinition({ canonical_name: 'Concern', aliases: ['concern'], definition: 'x', sense_constraints: null }, 'DEFN-1', 0);
    expect(d).toMatchObject({
      id: 'DEFN-1', canonical_name: 'Concern', aliases: ['concern'],
      definition: 'x', status: 'draft', source: 'agent-derivation',
      addedInRound: 0, revision: 0,
    });
  });

  it('validateDefinitionInput requires canonical_name and definition', () => {
    expect(validateDefinitionInput({}).valid).toBe(false);
    expect(validateDefinitionInput({ canonical_name: 'x', definition: 'd' }).valid).toBe(true);
  });

  it('manageDefinitions add succeeds with valid consent', () => {
    let s = initializeState('test problem');
    const [id, after, error] = manageDefinitions(s, 'add', { canonical_name: 'X', definition: 'd' }, consent);
    expect(error).toBeNull();
    expect(after.definitions).toHaveLength(1);
    expect(id).toMatch(/^DEFN-/);
  });

  it('manageDefinitions ratify transitions status', () => {
    let s = initializeState('test problem');
    let id;
    [id, s] = manageDefinitions(s, 'add', { canonical_name: 'X', definition: 'd' }, consent);
    [, s] = manageDefinitions(s, 'ratify', { id }, consent);
    const d = s.definitions.find(x => x.id === id);
    expect(d.status).toBe('ratified');
  });

  it('manageDefinitions revise updates definition + appends history', () => {
    let s = initializeState('test problem');
    let id;
    [id, s] = manageDefinitions(s, 'add', { canonical_name: 'X', definition: 'old' }, consent);
    [, s] = manageDefinitions(s, 'revise', { id, definition: 'new' }, consent);
    const d = s.definitions.find(x => x.id === id);
    expect(d.definition).toBe('new');
    expect(d.history.length).toBeGreaterThan(0);
  });

  it('manageDefinitions query-overlap returns candidates without consent', () => {
    let s = initializeState('test problem');
    [, s] = manageDefinitions(s, 'add', { canonical_name: 'Concern', definition: 'd' }, consent);
    [, s] = manageDefinitions(s, 'add', { canonical_name: 'concern_state', definition: 'd' }, consent);
    const [matches] = manageDefinitions(s, 'query-overlap', { canonical_name: 'concern' }, undefined);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('manageDefinitions add rejects without consent', () => {
    let s = initializeState('test problem');
    const [id, after, error] = manageDefinitions(s, 'add', { canonical_name: 'X', definition: 'd' }, undefined);
    expect(error).toMatch(/INVALID_CONSENT/);
  });
});
```

- [ ] **Step 2: Verify fail**

- [ ] **Step 3: Implement**

Create `definitions.js`:

```js
export function validateDefinitionInput(input) {
  if (!input || typeof input !== 'object') return { valid: false, reason: 'input required' };
  if (!input.canonical_name || typeof input.canonical_name !== 'string') return { valid: false, reason: 'canonical_name required string' };
  if (!input.definition || typeof input.definition !== 'string') return { valid: false, reason: 'definition required string' };
  return { valid: true };
}

export function createDefinition(input, id, round, source = 'agent-derivation') {
  return {
    id,
    canonical_name: input.canonical_name,
    aliases: input.aliases ?? [],
    definition: input.definition,
    sense_constraints: input.sense_constraints ?? null,
    status: 'draft',
    source,
    addedInRound: round,
    revisedInRound: null,
    revision: 0,
    history: [],
  };
}

export function queryOverlapCandidates(definitions, canonical_name) {
  const tokens = (canonical_name ?? '').toLowerCase().split(/\W+/).filter(Boolean);
  const matches = [];
  for (const d of definitions) {
    if (d.status === 'withdrawn' || d.status === 'deprecated') continue;
    const hay = (d.canonical_name + ' ' + (d.aliases ?? []).join(' ')).toLowerCase();
    if (tokens.some(t => hay.includes(t))) matches.push(d);
  }
  return matches;
}
```

In `state.js` `initializeState` add three new fields. `loadState` backfills `raw.definitions ??= []`, `raw.definitionCounter ??= 0`, `raw.definitionLog ??= []`. Backfill per-Definition `entry.status ??= 'draft'`.

Add `manageDefinitions`:

```js
import { createDefinition, validateDefinitionInput, queryOverlapCandidates } from './definitions.js';

export function manageDefinitions(state, op, payload, consent) {
  if (op === 'query-overlap') {
    const matches = queryOverlapCandidates(state.definitions, payload.canonical_name);
    return [matches, state, null];
  }
  const { valid, reason } = validateConsentToken(consent);
  if (!valid) return [null, state, `INVALID_CONSENT: ${reason}`];
  const newState = structuredClone(state);
  newState.elements = cloneElements(state.elements);
  if (op === 'add') {
    const v = validateDefinitionInput(payload);
    if (!v.valid) return [null, state, `DOMAIN_ERROR: ${v.reason}`];
    newState.definitionCounter += 1;
    const id = `DEFN-${newState.definitionCounter}`;
    const d = createDefinition(payload, id, newState.round, consent.source === 'designer' ? 'designer' : 'agent-derivation');
    newState.definitions.push(d);
    newState.closingArgPresentedRound = null;
    newState.closingArgGoRound = null;
    appendOperationLog(newState, { round: newState.round, op: 'add', entityId: id, type: 'DEFINITION', consent, changedFields: null, provenance: { initialPayload: payload } });
    const friction = processFriction(newState, consent, 'manage_definitions:add');
    return [id, friction.state, null];
  }
  if (op === 'revise') {
    const d = newState.definitions.find(x => x.id === payload.id);
    if (!d) return [null, state, `NOT_FOUND: definition ${payload.id}`];
    const before = { ...d };
    if (payload.canonical_name !== undefined) d.canonical_name = payload.canonical_name;
    if (payload.definition !== undefined) d.definition = payload.definition;
    if (payload.aliases !== undefined) d.aliases = payload.aliases;
    if (payload.sense_constraints !== undefined) d.sense_constraints = payload.sense_constraints;
    d.revision += 1;
    d.revisedInRound = newState.round;
    d.history.push({ round: newState.round, before, by: consent.source });
    if (d.status === 'ratified') d.status = 'draft';
    newState.closingArgPresentedRound = null;
    newState.closingArgGoRound = null;
    appendOperationLog(newState, { round: newState.round, op: 'revise', entityId: d.id, type: 'DEFINITION', consent, changedFields: Object.keys(payload).filter(k => k !== 'id'), provenance: { before, after: { ...d } } });
    return [d.id, newState, null];
  }
  if (op === 'ratify') {
    const d = newState.definitions.find(x => x.id === payload.id);
    if (!d) return [null, state, `NOT_FOUND: definition ${payload.id}`];
    d.status = 'ratified';
    appendOperationLog(newState, { round: newState.round, op: 'ratify', entityId: d.id, type: 'DEFINITION', consent, changedFields: ['status'], provenance: { before: 'draft', after: 'ratified' } });
    return [d.id, newState, null];
  }
  if (op === 'deprecate') {
    return [null, state, `DOMAIN_ERROR: use withdraw(category: 'DEFINITION', id, disposition, consent) for deprecation`];
  }
  return [null, state, `DOMAIN_ERROR: unknown op ${op}`];
}
```

In `server.js` add tool:

```js
{
  name: 'manage_definitions',
  description: 'Manage Definitions: add / revise / deprecate / ratify / query-overlap.',
  inputSchema: {
    type: 'object',
    properties: {
      state_file: { type: 'string' },
      op: { type: 'string', enum: ['add', 'revise', 'deprecate', 'ratify', 'query-overlap'] },
      payload: { type: 'object' },
      consent: { type: 'object' },
    },
    required: ['state_file', 'op', 'payload'],
  },
}
```

Add `handleManageDefinitions(args)` dispatching to `manageDefinitions` and saving on success.

**Verify `handleGetProofState` exposes new fields.** Read the existing `handleGetProofState` in `server.js`. If it returns the loaded state object directly (pass-through), no change needed — the new state fields land automatically. If it projects a fixed field set, extend the projection to include `definitions`, `definitionCounter`, `definitionLog`, `operationLog`, `schemaVersion`, `lastClosureArtifact`, and `proofStatus`. Add a server-test assertion confirming the response includes these keys after a `manage_definitions add`.

**Update `computeCompleteness` in `metrics.js`.** Locate `computeCompleteness` and extend the returned object with two new counters:

```js
return {
  ...existing,
  definition_count: (state.definitions ?? []).length,
  ratified_definition_count: (state.definitions ?? []).filter(d => d.status === 'ratified').length,
};
```

Add a metrics-test assertion confirming the two keys appear with correct counts after seeding state with one ratified Definition and one draft Definition.

- [ ] **Step 4: Verify pass**

Run: `cd skills/design-large-task/proof-mcp && npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/definitions.js skills/design-large-task/proof-mcp/state.js skills/design-large-task/proof-mcp/server.js skills/design-large-task/proof-mcp/metrics.js skills/design-large-task/proof-mcp/__tests__/
git commit -m "feat(proof-mcp): definitions.js + manage_definitions + Definitions counters in completeness (NC-7, RULE-5)"
```

---

## Task 9: CATEGORIES + DISPOSITIONS_BY_CATEGORY + entityType helper

**Type:** code-producing
**Implements:** preparation for AC-3.3, NC-2 codification
**Decision budget:** 2
**Must remain green:** existing `proof.test.js`, `state.test.js`; new tests

**Files:**
- Modify: `skills/design-large-task/proof-mcp/proof.js` — add `CATEGORIES` (9 entries), `DISPOSITIONS_BY_CATEGORY` map, `entityType(id)` helper
- Test: extend `__tests__/proof.test.js` or new `categories.test.js`

**Steps (TDD):**

- [ ] **Step 1: Write failing tests**

```js
import { describe, it, expect } from 'vitest';
import { CATEGORIES, DISPOSITIONS_BY_CATEGORY, entityType, WITHDRAWAL_DISPOSITIONS, FRICTION_DISPOSITIONS } from '../proof.js';

describe('CATEGORIES + entityType', () => {
  it('CATEGORIES has 9 entries including CONCERN and DEFINITION', () => {
    expect(CATEGORIES).toEqual([
      'EVIDENCE', 'RULE', 'PERMISSION', 'NECESSARY_CONDITION', 'RISK',
      'RESOLVE_CONDITION', 'FRICTION', 'CONCERN', 'DEFINITION',
    ]);
  });

  it('DISPOSITIONS_BY_CATEGORY maps non-FRICTION categories to WITHDRAWAL_DISPOSITIONS', () => {
    expect(DISPOSITIONS_BY_CATEGORY.NECESSARY_CONDITION).toEqual(WITHDRAWAL_DISPOSITIONS);
    expect(DISPOSITIONS_BY_CATEGORY.CONCERN).toEqual(WITHDRAWAL_DISPOSITIONS);
    expect(DISPOSITIONS_BY_CATEGORY.DEFINITION).toEqual(WITHDRAWAL_DISPOSITIONS);
  });

  it('DISPOSITIONS_BY_CATEGORY.FRICTION points to FRICTION_DISPOSITIONS (read-side reference)', () => {
    expect(DISPOSITIONS_BY_CATEGORY.FRICTION).toEqual(FRICTION_DISPOSITIONS);
  });

  it('entityType derives category from ID prefix', () => {
    expect(entityType('NCON-1')).toBe('NECESSARY_CONDITION');
    expect(entityType('EVID-7')).toBe('EVIDENCE');
    expect(entityType('CERN-2')).toBe('CONCERN');
    expect(entityType('DEFN-4')).toBe('DEFINITION');
    expect(entityType('FRIC-9')).toBe('FRICTION');
    expect(entityType('RULE-3')).toBe('RULE');
    expect(entityType('PERM-1')).toBe('PERMISSION');
    expect(entityType('RISK-5')).toBe('RISK');
    expect(entityType('RCON-2')).toBe('RESOLVE_CONDITION');
  });

  it('entityType throws on unknown prefix', () => {
    expect(() => entityType('XXXX-1')).toThrowError(/unknown id prefix/i);
    expect(() => entityType('malformed')).toThrowError();
  });
});
```

- [ ] **Step 2: Verify fail**

- [ ] **Step 3: Implement** (in `proof.js`)

```js
export const CATEGORIES = [
  'EVIDENCE', 'RULE', 'PERMISSION', 'NECESSARY_CONDITION', 'RISK',
  'RESOLVE_CONDITION', 'FRICTION', 'CONCERN', 'DEFINITION',
];

export const DISPOSITIONS_BY_CATEGORY = {
  EVIDENCE: WITHDRAWAL_DISPOSITIONS,
  RULE: WITHDRAWAL_DISPOSITIONS,
  PERMISSION: WITHDRAWAL_DISPOSITIONS,
  NECESSARY_CONDITION: WITHDRAWAL_DISPOSITIONS,
  RISK: WITHDRAWAL_DISPOSITIONS,
  RESOLVE_CONDITION: WITHDRAWAL_DISPOSITIONS,
  CONCERN: WITHDRAWAL_DISPOSITIONS,
  DEFINITION: WITHDRAWAL_DISPOSITIONS,
  FRICTION: FRICTION_DISPOSITIONS,
};

const ID_PREFIX_TO_CATEGORY = {
  EVID: 'EVIDENCE', RULE: 'RULE', PERM: 'PERMISSION', NCON: 'NECESSARY_CONDITION',
  RISK: 'RISK', RCON: 'RESOLVE_CONDITION', FRIC: 'FRICTION',
  CERN: 'CONCERN', DEFN: 'DEFINITION',
};

export function entityType(id) {
  if (typeof id !== 'string' || !id.includes('-')) {
    throw new Error(`malformed id: ${id}`);
  }
  const prefix = id.split('-')[0];
  const cat = ID_PREFIX_TO_CATEGORY[prefix];
  if (!cat) throw new Error(`unknown id prefix: ${prefix}`);
  return cat;
}
```

- [ ] **Step 4: Verify pass**

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/proof.js skills/design-large-task/proof-mcp/__tests__/
git commit -m "feat(proof-mcp): CATEGORIES enum + DISPOSITIONS_BY_CATEGORY map + entityType helper (NC-2)"
```

---

## Task 10: Universal `withdraw` tool

**Type:** code-producing
**Implements:** AC-3.3; NC-5 universal grammar (with PERM-1 FRICTION exception); NC-6 CRUD-completeness for delete
**Decision budget:** 3
**Must remain green:** new `withdraw.test.js`; existing `friction-lifecycle.test.js:81-119` (FRICTION guards via `submit_proof_update` preserved); existing `state.test.js`, `concerns.test.js`

**Files:**
- Modify: `skills/design-large-task/proof-mcp/state.js` — add `withdrawConcern(state, concernId, disposition, consent)`, `withdrawElement(state, elementId, disposition, consent)`, `withdrawDefinition(state, definitionId, disposition, consent)`
- Modify: `skills/design-large-task/proof-mcp/server.js` — add `withdraw` tool with rejection of `category: 'FRICTION'`
- Test: `skills/design-large-task/proof-mcp/__tests__/withdraw.test.js`

**Steps (TDD):**

- [ ] **Step 1: Write failing tests**

```js
import { describe, it, expect } from 'vitest';
import { initializeState, addConcern, lockConcerns, applyOperations, withdrawElement, withdrawConcern, withdrawDefinition, manageDefinitions } from '../state.js';

const consent = { source: 'designer', rationale: 't' };

describe('universal withdraw', () => {
  it('withdrawElement transitions NC to withdrawn with disposition', () => {
    /* set up state with NCON-1 active */
    [s] = withdrawElement(s, 'NCON-1', 'superseded', consent);
    const nc = s.elements.get('NCON-1');
    expect(nc.status).toBe('withdrawn');
    expect(nc.withdrawal_disposition).toBe('superseded');
  });

  it('withdrawElement preserves source on withdrawal', () => {
    /* set up evidence with source codebase */
    [s] = withdrawElement(s, 'EVID-1', 'consolidated', consent);
    expect(s.elements.get('EVID-1').source).toBe('codebase');
  });

  it('withdrawElement rejects invalid disposition', () => {
    const [next, error] = withdrawElement(s, 'EVID-1', 'not-in-set', consent);
    expect(error).toMatch(/INVALID_DISPOSITION/);
  });

  it('withdrawConcern transitions Concern status to withdrawn', () => {
    let s = initializeState('test problem');
    [, s] = addConcern(s, { label: 'C-1', description: 'd' }, consent);
    const id = s.concerns[0].id;
    [s] = withdrawConcern(s, id, 'scope-removed', consent);
    expect(s.concerns[0].status).toBe('withdrawn');
    expect(s.concerns[0].withdrawal_disposition).toBe('scope-removed');
  });

  it('withdrawDefinition transitions Definition status to withdrawn (deprecated alias)', () => {
    let s = initializeState('test problem');
    let id;
    [id, s] = manageDefinitions(s, 'add', { canonical_name: 'X', definition: 'd' }, consent);
    [s] = withdrawDefinition(s, id, 'superseded', consent);
    const d = s.definitions.find(x => x.id === id);
    expect(d.status).toBe('withdrawn');
  });
});

describe('withdraw tool routing (server)', () => {
  it('rejects category FRICTION with INVALID_CATEGORY referencing PERM-1', async () => {
    const result = await callTool('withdraw', { state_file, category: 'FRICTION', element_id: 'FRIC-1', disposition: 'lived-with', consent });
    expect(result.isError).toBe(true);
    const body = JSON.parse(result.content[0].text);
    expect(body.code).toBe('INVALID_CATEGORY');
    expect(body.message).toMatch(/override_friction_disposition/);
  });

  it('routes CONCERN to withdrawConcern', async () => {
    const result = await callTool('withdraw', { state_file, category: 'CONCERN', element_id: 'CERN-1', disposition: 'scope-removed', consent });
    expect(result.isError).toBeFalsy();
  });

  it('rejects CATEGORY_MISMATCH when ID prefix does not match category', async () => {
    const result = await callTool('withdraw', { state_file, category: 'CONCERN', element_id: 'EVID-1', disposition: 'scope-removed', consent });
    const body = JSON.parse(result.content[0].text);
    expect(result.isError).toBe(true);
    expect(body.code).toBe('CATEGORY_MISMATCH');
  });
});
```

- [ ] **Step 2: Verify fail**

- [ ] **Step 3: Implement**

In `state.js`:

```js
import { entityType, DISPOSITIONS_BY_CATEGORY, validateConsentToken } from './proof.js';

export function withdrawElement(state, elementId, disposition, consent) {
  const { valid, reason } = validateConsentToken(consent);
  if (!valid) return [state, `INVALID_CONSENT: ${reason}`];
  const newState = structuredClone(state);
  newState.elements = cloneElements(state.elements);
  const target = newState.elements.get(elementId);
  if (!target) return [state, `NOT_FOUND: element ${elementId}`];
  if (target.type === 'FRICTION') return [state, `INVALID_CATEGORY: FRICTION uses override_friction_disposition (PERM-1)`];
  if (!DISPOSITIONS_BY_CATEGORY[target.type].includes(disposition)) {
    return [state, `INVALID_DISPOSITION: ${disposition} not in ${DISPOSITIONS_BY_CATEGORY[target.type].join(', ')}`];
  }
  target.status = 'withdrawn';
  target.withdrawal_disposition = disposition;
  newState.closingArgPresentedRound = null;
  newState.closingArgGoRound = null;
  newState.revisionLog.push({ event: 'withdrawn', elementId, round: newState.round, disposition });
  appendOperationLog(newState, { round: newState.round, op: 'withdraw', entityId: elementId, type: target.type, consent, changedFields: ['status', 'withdrawal_disposition'], provenance: { disposition } });
  const friction = processFriction(newState, consent, 'withdraw');
  return [friction.state, null];
}

export function withdrawConcern(state, concernId, disposition, consent) {
  // mirrors withdrawElement but operates on state.concerns[]; preserves source field
  // ... validate + lookup + transition + log + processFriction ...
}

export function withdrawDefinition(state, definitionId, disposition, consent) {
  // mirrors but operates on state.definitions[]
  // ...
}
```

In `server.js` add tool:

```js
{
  name: 'withdraw',
  description: 'Universal withdrawal verb. Transitions an element to status:withdrawn with closed-set disposition. NOTE: FRICTION uses override_friction_disposition instead (see PERM-1). Per-category dispositions: NC/Evidence/Rule/Permission/Risk/RC/Concern/Definition use [consolidated, superseded, found-redundant, found-incorrect, scope-removed].',
  inputSchema: {
    type: 'object',
    properties: {
      state_file: { type: 'string' },
      category: { type: 'string', enum: ['EVIDENCE', 'RULE', 'PERMISSION', 'NECESSARY_CONDITION', 'RISK', 'RESOLVE_CONDITION', 'CONCERN', 'DEFINITION'] },
      element_id: { type: 'string' },
      disposition: { type: 'string' },
      consent: { type: 'object' },
    },
    required: ['state_file', 'category', 'element_id', 'disposition', 'consent'],
  },
}
```

`handleWithdraw(args)`:

```js
async function handleWithdraw(args) {
  const { state_file, category, element_id, disposition, consent } = args;
  if (category === 'FRICTION') {
    return errorResp({ code: 'INVALID_CATEGORY', message: 'FRICTION uses override_friction_disposition; see PERM-1' });
  }
  let state = loadState(state_file);
  let derivedCategory;
  try { derivedCategory = entityType(element_id); }
  catch (err) { return errorResp({ code: 'CATEGORY_MISMATCH', message: err.message }); }
  if (derivedCategory !== category) {
    return errorResp({ code: 'CATEGORY_MISMATCH', message: `id ${element_id} prefix derives ${derivedCategory}, called with ${category}` });
  }
  let newState, error;
  if (category === 'CONCERN') [newState, error] = withdrawConcern(state, element_id, disposition, consent);
  else if (category === 'DEFINITION') [newState, error] = withdrawDefinition(state, element_id, disposition, consent);
  else [newState, error] = withdrawElement(state, element_id, disposition, consent);
  if (error) return errorResp(parseError(error));
  saveState(newState, state_file);
  return { content: [{ type: 'text', text: JSON.stringify({ withdrawn: element_id }) }] };
}
```

- [ ] **Step 4: Verify pass**

Run: `cd skills/design-large-task/proof-mcp && npm test`
Expected: PASS — including preserved FRICTION guards in `friction-lifecycle.test.js:81-119`

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/state.js skills/design-large-task/proof-mcp/server.js skills/design-large-task/proof-mcp/__tests__/withdraw.test.js
git commit -m "feat(proof-mcp): universal withdraw tool with FRICTION rejection (PERM-1, NC-5, NC-6)"
```

---

## Task 11: open_proof consent token + first operationLog entry + INVALID_SEED_PACKET

**Type:** code-producing
**Implements:** AC-1.1, AC-1.2; RC-1
**Decision budget:** 2
**Must remain green:** existing `open-gate.test.js`, `acceptance.test.js`; new tests

**Files:**
- Modify: `skills/design-large-task/proof-mcp/server.js:418-531` — `handleOpenProof` extracts `consent` from `submission_material`; records consent in operationLog as first entry; on existing error paths at `server.js:444-453, 458-467, 482-494` records consent before returning error; returns `INVALID_SEED_PACKET` code on missing required fields
- Modify: `skills/design-large-task/proof-mcp/open-gate.js` — accept submission's consent token (forwarded from handler) for completeness; gate enforces NC-1 shape (problem_statement, ≥1 Concern, ≥1 Evidence, restructuring action labels)
- Test: extend `__tests__/open-gate.test.js`; add tests in new file

**Steps (TDD):**

- [ ] **Step 1: Write failing tests**

```js
describe('open_proof consent + INVALID_SEED_PACKET', () => {
  const consent = { source: 'designer', rationale: 'open directive' };

  it('successful open records consent as operationLog[0] with op:open', async () => {
    const result = await callOpenProof({ state_file, submission_material: { problem_statement: 'p', concerns: [{ label: 'C-1' }], elements: [{ type: 'EVIDENCE', statement: 'e', source: 'codebase', restructuring: { action: 'verbatim-preserve', citation: 'src' } }], consent } });
    const state = loadState(state_file);
    expect(state.operationLog[0]).toMatchObject({ op: 'open', consent });
  });

  it('missing problem_statement returns INVALID_SEED_PACKET', async () => {
    const result = await callOpenProof({ state_file, submission_material: { concerns: [], elements: [], consent } });
    const body = JSON.parse(result.content[0].text);
    expect(result.isError).toBe(true);
    expect(body.code).toBe('INVALID_SEED_PACKET');
    expect(body.message).toMatch(/problem_statement/);
  });

  it('missing Concerns returns INVALID_SEED_PACKET', async () => {
    /* ... */
  });

  it('error-path return still records consent in operationLog before error', async () => {
    /* trigger gate failure; verify the persisted state file contains an op:'open' entry with consent */
  });
});
```

- [ ] **Step 2: Verify fail**

- [ ] **Step 3: Implement**

In `server.js handleOpenProof`:

```js
async function handleOpenProof(args) {
  const { state_file, submission_material } = args;
  const { consent } = submission_material ?? {};
  const consentCheck = validateConsentToken(consent);
  if (!consentCheck.valid) {
    return errorResp({ code: 'INVALID_CONSENT', message: consentCheck.reason });
  }
  // Seed packet shape check
  if (!submission_material.problem_statement) {
    persistRejectedOpen(state_file, consent, 'missing problem_statement');
    return errorResp({ code: 'INVALID_SEED_PACKET', message: 'problem_statement required' });
  }
  if (!Array.isArray(submission_material.concerns) || submission_material.concerns.length === 0) {
    persistRejectedOpen(state_file, consent, 'missing concerns');
    return errorResp({ code: 'INVALID_SEED_PACKET', message: 'at least one Concern required' });
  }
  if (!Array.isArray(submission_material.elements) || !submission_material.elements.some(e => e.type === 'EVIDENCE')) {
    persistRejectedOpen(state_file, consent, 'missing evidence');
    return errorResp({ code: 'INVALID_SEED_PACKET', message: 'at least one Evidence element required' });
  }
  const missingLabels = submission_material.elements.filter(e => !e.restructuring?.action);
  if (missingLabels.length > 0) {
    persistRejectedOpen(state_file, consent, 'missing restructuring labels');
    return errorResp({ code: 'INVALID_SEED_PACKET', message: 'every element must carry restructuring action label' });
  }
  // ... existing restructure / gate / initializeState / applyOperations / addConcern flow ...
  // After initializeState, append op:'open' entry FIRST:
  let state = initializeState('test problem');
  appendOperationLog(state, { round: 0, op: 'open', entityId: null, type: null, consent, changedFields: null, provenance: { source_directive: consent.rationale ?? null } });
  state.proofStatus = 'open';
  // ... continue with restructure + apply ...
  saveState(state, state_file);
  return { content: [{ type: 'text', text: '...' }] };
}

function persistRejectedOpen(state_file, consent, reason) {
  // best-effort: load existing state if any, append rejection entry, save.
  // GUARD: do NOT call initializeState() (which would reset proofStatus to 'unopen') if the file
  // already exists with a successful prior open. If loadState fails (file missing/corrupt), construct
  // a minimal stub with proofStatus 'unopen' but only enough state to record the rejection — do not
  // overwrite an existing proof.
  try {
    let state;
    let isPriorOpen = false;
    try {
      state = loadState(state_file);
      isPriorOpen = state.proofStatus === 'open' || state.proofStatus === 'closed';
    }
    catch {
      // file missing/corrupt — write minimal stub with operationLog entry only
      state = { schemaVersion: SCHEMA_VERSION, round: 0, proofStatus: 'unopen', operationLog: [], elements: new Map(), concerns: [], definitions: [] };
    }
    appendOperationLog(state, { round: state.round, op: 'open', entityId: null, type: null, consent, changedFields: null, provenance: { rejected: true, reason, priorOpen: isPriorOpen } });
    saveState(state, state_file);
  } catch { /* swallow secondary failure; the primary error response is what matters */ }
}
```

Refactor each of the three error blocks at `server.js:444-453, 458-467, 482-494` to call `persistRejectedOpen` before returning their error responses.

- [ ] **Step 4: Verify pass**

Run: `cd skills/design-large-task/proof-mcp && npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/server.js skills/design-large-task/proof-mcp/open-gate.js skills/design-large-task/proof-mcp/__tests__/
git commit -m "feat(proof-mcp): open_proof consent token + INVALID_SEED_PACKET + open-event log (NC-1, RC-1)"
```

---

## Task 12: concernsRatificationGate helper + isError on present_closing_argument

**Type:** code-producing
**Implements:** AC-4.4
**Decision budget:** 2
**Must remain green:** existing `metrics.test.js`, `trigger-evaluator.test.js`, `closing-argument.test.js`, `closing-argument-end-to-end.test.js`, `eleventh-closure-condition.test.js`, `two-yes-flags.test.js` (any test that calls `handlePresentClosingArgument` and asserts on response shape needs audit — gate-failure path now returns `isError: true` instead of plain content); new tests in this task

**Files:**
- Modify: `skills/design-large-task/proof-mcp/metrics.js:388-444` — extract `concernsRatificationGate(state)` helper; export; use inside `evaluateTrigger`
- Modify: `skills/design-large-task/proof-mcp/server.js:395-405` — `handlePresentClosingArgument` calls `concernsRatificationGate`; on failure returns `{ isError: true }` with code `CONCERNS_UNRATIFIED` or `CONCERNS_UNLOCKED`
- Modify: existing tests in `metrics.test.js` and `trigger-evaluator.test.js` that asserted on non-error refusal shape — update to assert `isError: true` shape
- Test: extend `metrics.test.js` with hard-gate assertions (per-Concern status check)

**Steps (TDD):**

- [ ] **Step 1: Write failing tests**

```js
import { concernsRatificationGate } from '../metrics.js';

describe('concernsRatificationGate', () => {
  it('returns { passed: false, reason: CONCERNS_UNLOCKED } when concernsLocked is false', () => {
    const s = { concernsLocked: false, concerns: [{ id: 'CERN-1', status: 'ratified' }] };
    const r = concernsRatificationGate(s);
    expect(r.passed).toBe(false);
    expect(r.code).toBe('CONCERNS_UNLOCKED');
  });

  it('returns { passed: false, code: CONCERNS_UNRATIFIED } when any Concern is draft', () => {
    const s = { concernsLocked: true, concerns: [{ id: 'CERN-1', status: 'ratified' }, { id: 'CERN-2', status: 'draft' }] };
    const r = concernsRatificationGate(s);
    expect(r.passed).toBe(false);
    expect(r.code).toBe('CONCERNS_UNRATIFIED');
  });

  it('returns { passed: true } when both conditions hold', () => {
    const s = { concernsLocked: true, concerns: [{ id: 'CERN-1', status: 'ratified' }] };
    expect(concernsRatificationGate(s).passed).toBe(true);
  });
});

describe('handlePresentClosingArgument hard-gate', () => {
  it('returns isError: true with CONCERNS_UNRATIFIED when one Concern is draft', async () => {
    /* set up state with locked but one draft concern */
    const result = await callPresent({ state_file });
    expect(result.isError).toBe(true);
    const body = JSON.parse(result.content[0].text);
    expect(body.code).toBe('CONCERNS_UNRATIFIED');
  });

  it('returns isError: true with CONCERNS_UNLOCKED when concerns not locked', async () => {
    /* ... */
  });
});
```

- [ ] **Step 2: Verify fail**

- [ ] **Step 3: Implement**

In `metrics.js`:

```js
export function concernsRatificationGate(state) {
  if (!state.concernsLocked) {
    return { passed: false, code: 'CONCERNS_UNLOCKED', message: 'Concerns must be locked' };
  }
  const draft = (state.concerns ?? []).filter(c => c.status === 'draft');
  if (draft.length > 0) {
    return { passed: false, code: 'CONCERNS_UNRATIFIED', message: `Concerns must all be ratified; ${draft.length} draft remain` };
  }
  return { passed: true };
}
```

Use in `evaluateTrigger` (replace existing concernsLocked check at line 419):

```js
const gate = concernsRatificationGate(state);
if (!gate.passed) reasons.push(gate.message);
```

In `server.js handlePresentClosingArgument`:

```js
const gate = concernsRatificationGate(state);
if (!gate.passed) {
  return { isError: true, content: [{ type: 'text', text: JSON.stringify({ code: gate.code, message: gate.message }) }] };
}
const trigger = evaluateTrigger(state);
if (!trigger.permitted) {
  return { isError: true, content: [{ type: 'text', text: JSON.stringify({ code: 'TRIGGER_NOT_MET', reasons: trigger.reasons }) }] };
}
// ... proceed ...
```

Update existing `metrics.test.js` and `trigger-evaluator.test.js` assertions on the refusal shape to expect `isError: true` for the present-closing-argument path. The pure `evaluateTrigger` return shape unchanged; only the handler-level shape changes.

- [ ] **Step 4: Verify pass**

Run: `cd skills/design-large-task/proof-mcp && npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/metrics.js skills/design-large-task/proof-mcp/server.js skills/design-large-task/proof-mcp/__tests__/
git commit -m "feat(proof-mcp): concernsRatificationGate hard gate + isError on present_closing_argument refusal (NC-9)"
```

---

## Task 13: deriveClosingArgument envelope expansion (NC-9 completeness + NC-16 provenance)

**Type:** code-producing
**Implements:** AC-4.1, AC-4.2, AC-4.3
**Decision budget:** 2
**Must remain green:** existing `closing-argument.test.js`, `closing-argument-end-to-end.test.js`, `eleventh-closure-condition.test.js`; new tests

**Files:**
- Modify: `skills/design-large-task/proof-mcp/closing-argument.js:4-61` — `deriveClosingArgument` returns extended object with `phantomConcerns`, `activeNCs`, `draftNCs`, `activeRules`, `activePermissions`, `activeRisks`, `ratifiedDefinitions`, `phantomDefinitions`, `closureProvenance`. Pure function preserved.
- Test: extend `__tests__/closing-argument.test.js`

**Steps (TDD):**

- [ ] **Step 1: Write failing tests**

```js
describe('deriveClosingArgument extended envelope (NC-9 + NC-16)', () => {
  it('includes phantomConcerns array with disposition + preserved source', () => {
    /* state with one withdrawn Concern */
    const env = deriveClosingArgument(s);
    expect(env.phantomConcerns).toBeDefined();
    expect(env.phantomConcerns[0].withdrawal_disposition).toBe('scope-removed');
  });

  it('includes activeNCs (active + ratificationStatus: ratified) standalone', () => {
    const env = deriveClosingArgument(s);
    expect(Array.isArray(env.activeNCs)).toBe(true);
    expect(env.activeNCs.every(nc => nc.status === 'active' && nc.ratificationStatus === 'ratified')).toBe(true);
  });

  it('includes draftNCs (active + ratificationStatus: draft) standalone', () => {
    const env = deriveClosingArgument(s);
    expect(Array.isArray(env.draftNCs)).toBe(true);
  });

  it('includes activeRules / activePermissions / activeRisks standalone', () => {
    const env = deriveClosingArgument(s);
    expect(Array.isArray(env.activeRules)).toBe(true);
    expect(Array.isArray(env.activePermissions)).toBe(true);
    expect(Array.isArray(env.activeRisks)).toBe(true);
  });

  it('includes ratifiedDefinitions and phantomDefinitions', () => {
    const env = deriveClosingArgument(s);
    expect(Array.isArray(env.ratifiedDefinitions)).toBe(true);
    expect(Array.isArray(env.phantomDefinitions)).toBe(true);
  });

  it('includes closureProvenance per cited element with derivationChain', () => {
    const env = deriveClosingArgument(s);
    expect(Array.isArray(env.closureProvenance)).toBe(true);
    const entry = env.closureProvenance[0];
    expect(entry).toHaveProperty('entityId');
    expect(entry).toHaveProperty('source');
    expect(Array.isArray(entry.derivationChain)).toBe(true);
  });

  it('is pure: two consecutive calls produce deep-equal output', () => {
    const a = deriveClosingArgument(s);
    const b = deriveClosingArgument(s);
    expect(a).toEqual(b);
  });
});
```

- [ ] **Step 2: Verify fail**

- [ ] **Step 3: Implement** in `closing-argument.js`:

```js
export function deriveClosingArgument(state) {
  const elements = [...state.elements.values()];
  const isActive = e => e.status === 'active';
  const isWithdrawn = e => e.status === 'withdrawn';
  const ofType = t => e => e.type === t;

  const activeNCs = elements.filter(e => isActive(e) && ofType('NECESSARY_CONDITION')(e) && e.ratificationStatus === 'ratified');
  const draftNCs = elements.filter(e => isActive(e) && ofType('NECESSARY_CONDITION')(e) && e.ratificationStatus === 'draft');
  const phantomNCs = elements.filter(e => isWithdrawn(e) && ofType('NECESSARY_CONDITION')(e));
  const activeRules = elements.filter(e => isActive(e) && ofType('RULE')(e));
  const activePermissions = elements.filter(e => isActive(e) && ofType('PERMISSION')(e));
  const activeRisks = elements.filter(e => isActive(e) && ofType('RISK')(e));
  const resolveConditions = elements.filter(e => isActive(e) && ofType('RESOLVE_CONDITION')(e));
  const phantomRCs = elements.filter(e => isWithdrawn(e) && ofType('RESOLVE_CONDITION')(e));
  const liveFriction = elements.filter(e => isActive(e) && ofType('FRICTION')(e));
  const phantomFriction = elements.filter(e => isWithdrawn(e) && ofType('FRICTION')(e));
  const lockedConcerns = state.concernsLocked
    ? (state.concerns ?? []).filter(c => c.status !== 'withdrawn')
    : [];
  const phantomConcerns = (state.concerns ?? []).filter(c => c.status === 'withdrawn');
  const ratifiedDefinitions = (state.definitions ?? []).filter(d => d.status === 'ratified');
  const phantomDefinitions = (state.definitions ?? []).filter(d => d.status === 'deprecated' || d.status === 'withdrawn');

  // closure provenance: walk operationLog filtered by entityId for each cited element
  const cited = [...activeNCs, ...activeRules, ...activePermissions, ...activeRisks, ...resolveConditions, ...liveFriction, ...lockedConcerns, ...ratifiedDefinitions];
  const closureProvenance = cited.map(el => ({
    entityId: el.id,
    type: el.type ?? entityType(el.id),
    source: el.source ?? null,
    derivationChain: (state.operationLog ?? []).filter(e => e.entityId === el.id),
    ratification: extractRatification(state, el),
    restructuringActionLabel: el.restructuring?.action ?? null,
  }));

  return {
    problemStatement: state.problemStatement,
    lockedConcerns,
    phantomConcerns,
    resolveConditions,
    phantomRCs,
    activeNCs,
    draftNCs,
    phantomNCs,
    activeRules,
    activePermissions,
    activeRisks,
    liveFriction,
    phantomFriction,
    ratifiedDefinitions,
    phantomDefinitions,
    closureProvenance,
    compositeScore: state.compositeScore ?? null,
    closurePermitted: ((state.compositeScore ?? 0) >= 0.7),
    closureReasons: [],
    derivedAtRound: state.round,
  };
}
```

- [ ] **Step 4: Verify pass**

Run: `cd skills/design-large-task/proof-mcp && npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/closing-argument.js skills/design-large-task/proof-mcp/__tests__/closing-argument.test.js
git commit -m "feat(proof-mcp): closing-argument envelope completeness (NC-9, NC-16)"
```

---

## Task 14: confirm_closure_go extensions (proofStatus: closed + bulk-ratify)

**Type:** code-producing
**Implements:** AC-5.1; RULE-9
**Decision budget:** 3
**Must remain green:** existing `closing-argument-end-to-end.test.js`, `two-yes-flags.test.js`, `mutation-clears-flags.test.js`, `state.test.js`; new tests

**Files:**
- Modify: `skills/design-large-task/proof-mcp/state.js:95-104` — `recordDesignerGo(state, consent)` extends to set `proofStatus: 'closed'`, bulk-ratify draft NCs, bulk-ratify unratified active RCs; **does NOT inline-clear closingArgPresentedRound / closingArgGoRound** (the established mutation pattern is bypassed here per RULE-9)
- Modify: `skills/design-large-task/proof-mcp/state.js` — append three operationLog entries: `op:'close'` plus two `op:'bulk-ratify'` entries (one per type)
- Test: extend `__tests__/closing-argument-end-to-end.test.js` or new `bulk-ratify.test.js`

**Steps (TDD):**

- [ ] **Step 1: Write failing tests**

```js
describe('confirm_closure_go extensions', () => {
  const consent = { source: 'designer', rationale: 'go' };

  it('successful go sets proofStatus: closed', () => {
    let s = /* state where present called this round, all concerns ratified, locked */;
    [s] = recordDesignerGo(s, consent);
    expect(s.proofStatus).toBe('closed');
  });

  it('successful go bulk-ratifies all draft NCs (active only)', () => {
    /* state with mixed active draft NCs and active ratified NCs */
    [s] = recordDesignerGo(s, consent);
    const draftRemain = [...s.elements.values()].filter(e => e.type === 'NECESSARY_CONDITION' && e.status === 'active' && e.ratificationStatus === 'draft');
    expect(draftRemain).toHaveLength(0);
  });

  it('bulk-ratifies unratified active RCs (skips withdrawn)', () => {
    [s] = recordDesignerGo(s, consent);
    const unratifiedActive = [...s.elements.values()].filter(e => e.type === 'RESOLVE_CONDITION' && e.status === 'active' && !e.ratification);
    expect(unratifiedActive).toHaveLength(0);
  });

  it('does NOT clear closingArgPresentedRound or closingArgGoRound (sets go round)', () => {
    let s = /* present round 5 */;
    [s] = recordDesignerGo(s, consent);
    expect(s.closingArgPresentedRound).toBe(5);
    expect(s.closingArgGoRound).toBe(5);
  });

  it('appends op: close + two op: bulk-ratify entries to operationLog', () => {
    [s] = recordDesignerGo(s, consent);
    const closeEntry = s.operationLog.find(e => e.op === 'close');
    expect(closeEntry).toBeDefined();
    const bulks = s.operationLog.filter(e => e.op === 'bulk-ratify');
    expect(bulks).toHaveLength(2);
  });

  it('rejects when present round !== current round', () => {
    let s = /* present round 5 */;
    s.round = 6;
    const [next, error] = recordDesignerGo(s, consent);
    expect(error).toMatch(/GO_REQUIRES_VIEW_THIS_ROUND/);
  });
});
```

- [ ] **Step 2: Verify fail**

- [ ] **Step 3: Implement**

In `state.js` rewrite `recordDesignerGo`:

```js
export function recordDesignerGo(state, consent) {
  const { valid, reason } = validateConsentToken(consent);
  if (!valid) return [state, `INVALID_CONSENT: ${reason}`];
  if (state.closingArgPresentedRound !== state.round) {
    return [state, `GO_REQUIRES_VIEW_THIS_ROUND: presented round ${state.closingArgPresentedRound ?? 'never'} !== current ${state.round}`];
  }
  const newState = structuredClone(state);
  newState.elements = cloneElements(state.elements);
  newState.closingArgGoRound = newState.round;
  newState.proofStatus = 'closed';
  // Bulk-ratify NCs
  const ratifiedNCs = [];
  for (const [id, el] of newState.elements) {
    if (el.type === 'NECESSARY_CONDITION' && el.status === 'active' && el.ratificationStatus === 'draft') {
      el.ratificationStatus = 'ratified';
      ratifiedNCs.push(id);
    }
  }
  // Bulk-ratify RCs
  const ratifiedRCs = [];
  for (const [id, el] of newState.elements) {
    if (el.type === 'RESOLVE_CONDITION' && el.status === 'active' && !el.ratification) {
      el.ratification = { ratifiedAtRound: newState.round, text: 'bulk-ratified at confirm_closure_go (RULE-9)' };
      ratifiedRCs.push(id);
    }
  }
  // operationLog: do NOT call clearClosingFlags; do NOT inline the null pair
  appendOperationLog(newState, { round: newState.round, op: 'close', entityId: null, type: null, consent, changedFields: ['proofStatus'], provenance: { from: 'open', to: 'closed' } });
  appendOperationLog(newState, { round: newState.round, op: 'bulk-ratify', entityId: null, type: 'NECESSARY_CONDITION', consent, changedFields: ['ratificationStatus'], provenance: { count: ratifiedNCs.length, elementIds: ratifiedNCs } });
  appendOperationLog(newState, { round: newState.round, op: 'bulk-ratify', entityId: null, type: 'RESOLVE_CONDITION', consent, changedFields: ['ratification'], provenance: { count: ratifiedRCs.length, elementIds: ratifiedRCs } });
  return [newState, null];
}
```

- [ ] **Step 4: Verify pass**

Run: `cd skills/design-large-task/proof-mcp && npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/state.js skills/design-large-task/proof-mcp/__tests__/
git commit -m "feat(proof-mcp): recordDesignerGo sets proofStatus closed + bulk-ratify NCs/RCs (RULE-9, NC-12)"
```

---

## Task 15: reopen_proof tool + reopenProof + lastClosureArtifact retention

**Type:** code-producing
**Implements:** AC-5.2, AC-5.4
**Decision budget:** 2
**Must remain green:** existing tests; new `reopen.test.js`

**Files:**
- Modify: `skills/design-large-task/proof-mcp/state.js:32-55` — `initializeState` adds `lastClosureArtifact: null`
- Modify: `skills/design-large-task/proof-mcp/state.js:449-469` — `loadState` backfills `raw.lastClosureArtifact ??= null`
- Modify: `skills/design-large-task/proof-mcp/state.js` — add `reopenProof(state, consent)` function: validates `proofStatus === 'closed'`; captures envelope into `lastClosureArtifact`; resets two flags; sets `proofStatus: 'open'`; preserves `concernsLocked`; appends operationLog entry op:`'reopen'`
- Modify: `skills/design-large-task/proof-mcp/server.js` — add `reopen_proof` tool + `handleReopenProof`
- Test: `skills/design-large-task/proof-mcp/__tests__/reopen.test.js`

**Steps (TDD):**

- [ ] **Step 1: Write failing tests**

```js
describe('reopen_proof', () => {
  const consent = { source: 'designer', rationale: 'amend' };

  it('rejects when proofStatus !== closed', () => {
    const s = initializeState('test problem'); // proofStatus: unopen
    const [next, error] = reopenProof(s, consent);
    expect(error).toMatch(/NOT_CLOSED/);
  });

  it('captures closure envelope into lastClosureArtifact', () => {
    /* state with proofStatus: closed and rich content */
    const before = deriveClosingArgument(s);
    [s] = reopenProof(s, consent);
    expect(s.lastClosureArtifact).toEqual(before);
  });

  it('resets closingArgPresentedRound and closingArgGoRound to null', () => {
    [s] = reopenProof(s, consent);
    expect(s.closingArgPresentedRound).toBeNull();
    expect(s.closingArgGoRound).toBeNull();
  });

  it('sets proofStatus to open', () => {
    [s] = reopenProof(s, consent);
    expect(s.proofStatus).toBe('open');
  });

  it('preserves concernsLocked', () => {
    /* s has concernsLocked: true */
    [s] = reopenProof(s, consent);
    expect(s.concernsLocked).toBe(true);
  });

  it('appends operationLog entry op: reopen', () => {
    [s] = reopenProof(s, consent);
    const entry = s.operationLog.at(-1);
    expect(entry.op).toBe('reopen');
    expect(entry.consent).toEqual(consent);
  });

  it('second close cycle does NOT update lastClosureArtifact (only re-open does)', () => {
    /* close → reopen → close again */
    /* lastClosureArtifact still equals the FIRST-close envelope */
  });
});
```

- [ ] **Step 2: Verify fail**

- [ ] **Step 3: Implement**

In `state.js` `initializeState` add `lastClosureArtifact: null`. In `loadState` backfill `raw.lastClosureArtifact ??= null`.

```js
import { deriveClosingArgument } from './closing-argument.js';

export function reopenProof(state, consent) {
  const { valid, reason } = validateConsentToken(consent);
  if (!valid) return [state, `INVALID_CONSENT: ${reason}`];
  if (state.proofStatus !== 'closed') {
    return [state, `NOT_CLOSED: proofStatus is ${state.proofStatus}`];
  }
  const newState = structuredClone(state);
  newState.elements = cloneElements(state.elements);
  newState.lastClosureArtifact = deriveClosingArgument(state);
  newState.closingArgPresentedRound = null;
  newState.closingArgGoRound = null;
  newState.proofStatus = 'open';
  appendOperationLog(newState, { round: newState.round, op: 'reopen', entityId: null, type: null, consent, changedFields: ['proofStatus'], provenance: { from: 'closed', to: 'open' } });
  return [newState, null];
}
```

In `server.js` add tool:

```js
{
  name: 'reopen_proof',
  description: 'Re-open a closed proof. Captures current closure artifact into lastClosureArtifact (frozen snapshot), resets closing flags, sets proofStatus open. Concerns remain locked.',
  inputSchema: {
    type: 'object',
    properties: {
      state_file: { type: 'string' },
      consent: { type: 'object' },
    },
    required: ['state_file', 'consent'],
  },
}
```

`handleReopenProof(args)`: load → reopenProof → save → respond.

- [ ] **Step 4: Verify pass**

Run: `cd skills/design-large-task/proof-mcp && npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/state.js skills/design-large-task/proof-mcp/server.js skills/design-large-task/proof-mcp/__tests__/reopen.test.js
git commit -m "feat(proof-mcp): reopen_proof tool + lastClosureArtifact retention (NC-12)"
```

---

## Task 16: Mutation-clears-flags coverage extended for new mutations

**Type:** code-producing
**Implements:** AC-5.3 (extends existing coverage to include new mutating tools)
**Decision budget:** 1
**Must remain green:** existing `mutation-clears-flags.test.js`; extended cases this task adds

**Files:**
- Modify: `skills/design-large-task/proof-mcp/__tests__/mutation-clears-flags.test.js` — add cases for `manage_concerns ratify`, `manage_definitions add | revise | ratify`, universal `withdraw`, `reopen_proof`. Verify each clears `closingArgPresentedRound`. Verify `recordDesignerGo` does NOT clear (Task 14 invariant).

**Steps (TDD):**

- [ ] **Step 1: Write failing tests**

```js
describe('mutation-clears-flags coverage extended for D.1 tools', () => {
  const consent = { source: 'designer', rationale: 't' };

  it('manage_concerns ratify clears closingArgPresentedRound', () => {
    /* state with closingArgPresentedRound: 5 */
    [s] = ratifyConcern(s, 'CERN-1', consent);
    expect(s.closingArgPresentedRound).toBeNull();
  });

  it('manage_definitions add clears closingArgPresentedRound', () => {
    /* state with closingArgPresentedRound: 5 */
    [, s] = manageDefinitions(s, 'add', { canonical_name: 'X', definition: 'd' }, consent);
    expect(s.closingArgPresentedRound).toBeNull();
  });

  it('universal withdraw clears closingArgPresentedRound', () => {
    [s] = withdrawElement(s, 'NCON-1', 'superseded', consent);
    expect(s.closingArgPresentedRound).toBeNull();
  });

  it('reopen_proof clears both flags', () => {
    [s] = reopenProof(s, consent);
    expect(s.closingArgPresentedRound).toBeNull();
    expect(s.closingArgGoRound).toBeNull();
  });

  it('recordDesignerGo does NOT clear flags (sets goRound)', () => {
    /* present round 5 */
    [s] = recordDesignerGo(s, consent);
    expect(s.closingArgPresentedRound).toBe(5);
    expect(s.closingArgGoRound).toBe(5);
  });
});
```

- [ ] **Step 2: Verify fail (or pass) and reconcile**

Most cases should already pass — Tasks 5/8/10/15 implementations inline the null-assignments at the appropriate points. Task 14 explicitly omits them. This task is the regression-net coverage to lock in the invariant.

Run: `cd skills/design-large-task/proof-mcp && npx vitest run __tests__/mutation-clears-flags.test.js`

If any case fails, fix the offending mutation function in the file from the relevant earlier task (each task's "Must remain green" includes mutation-clears-flags coverage; this task forces the reckoning).

- [ ] **Step 3: Adjust implementations if needed**

(Likely no-op if Tasks 5, 8, 10, 14, 15 implemented the inline null pair correctly. Otherwise add the inline pair at the offending site.)

- [ ] **Step 4: Verify pass**

Run: `cd skills/design-large-task/proof-mcp && npm test`
Expected: PASS — full suite

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/__tests__/mutation-clears-flags.test.js
git commit -m "test(proof-mcp): cover new mutating tools in mutation-clears-flags coverage (AC-5.3, NC-11)"
```

---

## Final verification

After Task 16, run the full test suite once more from a clean state:

```bash
cd skills/design-large-task/proof-mcp && npm test
```

All tests must pass. The plan is complete when the suite reports 100% pass with no skips and the new D.1 test files (schema-version, atomic-persistence, consent, operation-log, definitions, withdraw, reopen, plus extensions to existing tests) report passing assertions.

## SKILL.md additions (out-of-band)

Brief §9 also asks for skill-side proof reasoning additions to `skills/design-large-task/SKILL.md` Phase 8 / Phase 9 — consent token construction, NC-1 seed packet shape, brief renderer step. These are documentation additions, not code; they ride along as a final docs commit:

- Add a short paragraph to Phase 8 (Solve stage opening) describing consent-token construction protocol.
- Add a short paragraph to Phase 9 (Closing argument / handoff) describing the brief-renderer step that consumes the server-rendered closure envelope from `present_closing_argument` and writes the design brief to disk.

Commit:

```bash
git add skills/design-large-task/SKILL.md
git commit -m "docs(skill): consent token construction + brief renderer step in Solve/Closing phases (NC-1, NC-8)"
```

This is a final "Task 17" of sorts but is documentation-only and bumps no behavior. plan-attack treats it as a docs-producing task with zero decision budget.

<!-- created-at: 2026-05-07T10:32:22Z -->
<!-- produced-by plan-build@v0004 -->
