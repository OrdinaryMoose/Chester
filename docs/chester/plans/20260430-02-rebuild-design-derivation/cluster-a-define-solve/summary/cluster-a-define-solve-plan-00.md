# Plan: Cluster A — Define Solve

**Sprint:** `cluster-a-define-solve` (under master plan `20260430-02-rebuild-design-derivation`)
**Spec:** `docs/chester/working/20260430-02-rebuild-design-derivation/cluster-a-define-solve/spec/cluster-a-define-solve-spec-01.md`
**Execution mode:** subagent

> **For agentic workers:** Use execute-write to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The `Execution mode` field selects which execute-write section runs — Section 2 (subagent-driven) or Section 3 (inline). plan-build sets this field at handoff based on the Execution Mode Selection heuristic, with human confirm/override.

## Goal

Add `RESOLVE_CONDITION` as the proof MCP's sixth element type with PM-ratified Concern enumeration, per-Concern closure coverage (RC ratified OR Rule-union), sequential ratification, and revise-clears-ratification — all backed by vitest coverage. Brief template and `design-specify/SKILL.md` are updated in the same diff so cluster B inherits no template/specify cleanup work.

## Architecture

Atomic full-stack registration. Eight files touched: four proof MCP sources (`proof.js`, `state.js`, `metrics.js`, `server.js`), the brief template, `design-specify/SKILL.md`, and three test files (existing extended; one new `concerns.test.js`; the auto-scaffolded `acceptance.test.js` filled). New element type follows the existing five-type registration pattern uniformly. Two new MCP tools (`manage_concerns`, `ratify_resolve_condition`) added with singular schemas (NC-05 enforced at API boundary).

## Tech Stack

- JavaScript ES modules (`"type": "module"` in `proof-mcp/package.json`).
- Vitest 3.1.x for tests (`npm test` runs `vitest run`).
- `@modelcontextprotocol/sdk` ^1.12.1 for MCP wiring.
- No new dependencies.

## Prior Decisions

*(populated by plan-build via `dr_query` at plan-start; filter: sprint-subject match OR shared-component match, status=Active)*

None. `dr_query` returned zero records for sprint-subject `cluster-a-define-solve` and tags `[proof-mcp, design-large-task, design-specify]` at plan-start.

## Test-Suite Scoping Note (post-hardening)

`__tests__/acceptance.test.js` was scaffolded by `design-specify` with 24 `throw new Error('pending: ...')` stubs. Those stubs throw on any test run, so an unfiltered `npm test` reports failures unrelated to the task in progress. To keep red/green TDD signal clean, **every `npm test` command in Tasks 1-10 scopes to the file the task touches**. Task 11 fills the stubs and runs the full suite.

Pattern used in this plan:
- Tasks 1-7: `npm test -- proof.test.js state.test.js metrics.test.js` (or the subset relevant to the task)
- Task 8: `npm test -- server.test.js`
- Tasks 9-10: `npm test -- acceptance.test.js` (because they fill specific stubs and verify those pass; the still-pending stubs continue to fail and are tolerated for those steps' assertion scope)
- Task 11: `npm test` (full suite, all stubs filled)

---

## Task 1: Register RESOLVE_CONDITION element type and validation block

**Type:** code-producing
**Implements:** AC-1.1, AC-1.2, AC-1.3, AC-1.4, AC-7.1 (partial — five-type validation paths preserved)
**Decision budget:** 1 (whether `problem_anchor` and `ratification` defaults sit on every element shell or only RC — spec line 22 says universal; resolved)
**Must remain green:** `__tests__/proof.test.js` (existing five-type tests), `__tests__/state.test.js` (existing tests after counter expansion)

**Files:**
- Modify: `skills/design-large-task/proof-mcp/proof.js:13-15` (ELEMENT_TYPES), `skills/design-large-task/proof-mcp/proof.js:24-94` (createElement)
- Modify: `skills/design-large-task/proof-mcp/state.js:16-22` (ID_PREFIX), `skills/design-large-task/proof-mcp/state.js:34-36` (elementCounters)
- Test: `skills/design-large-task/proof-mcp/__tests__/proof.test.js`, `skills/design-large-task/proof-mcp/__tests__/state.test.js`

**Steps (TDD):**

- [ ] **Step 1: Write failing tests** (proof.test.js — extend the `ELEMENT_TYPES` describe block and add a `describe('createElement RESOLVE_CONDITION')` block)

```js
// In proof.test.js — extend the existing ELEMENT_TYPES block
describe('ELEMENT_TYPES', () => {
  it('contains all six types', () => {
    expect(ELEMENT_TYPES).toEqual([
      'EVIDENCE', 'RULE', 'PERMISSION', 'NECESSARY_CONDITION', 'RISK', 'RESOLVE_CONDITION',
    ]);
  });
});

// New describe block in proof.test.js — appended after existing createElement describe blocks
describe('createElement RESOLVE_CONDITION', () => {
  it('creates a RESOLVE_CONDITION with statement and problem_anchor', () => {
    const el = createElement(
      { type: 'RESOLVE_CONDITION', statement: 'System rejects empty input', problem_anchor: 'CERN-1' },
      'RCON-1', 1,
    );
    expect(el.id).toBe('RCON-1');
    expect(el.type).toBe('RESOLVE_CONDITION');
    expect(el.statement).toBe('System rejects empty input');
    expect(el.problem_anchor).toBe('CERN-1');
    expect(el.ratification).toBeNull();
    expect(el.status).toBe('active');
  });

  it('rejects RESOLVE_CONDITION without problem_anchor', () => {
    expect(() => createElement(
      { type: 'RESOLVE_CONDITION', statement: 'X' },
      'RCON-1', 1,
    )).toThrow(/problem_anchor/);
  });

  it('rejects RESOLVE_CONDITION with designer source', () => {
    expect(() => createElement(
      { type: 'RESOLVE_CONDITION', statement: 'X', problem_anchor: 'CERN-1', source: 'designer' },
      'RCON-1', 1,
    )).toThrow(/source/);
  });

  it('initializes problem_anchor and ratification fields to null on non-RC elements', () => {
    const el = createElement(
      { type: 'EVIDENCE', statement: 'x', source: 'codebase' },
      'EVID-1', 1,
    );
    expect(el.problem_anchor).toBeNull();
    expect(el.ratification).toBeNull();
  });
});
```

```js
// In state.test.js — extend the existing initializeState describe block
it('includes RESOLVE_CONDITION in elementCounters', () => {
  const state = initializeState('Design a widget');
  expect(state.elementCounters).toEqual({
    EVIDENCE: 0, RULE: 0, PERMISSION: 0, NECESSARY_CONDITION: 0, RISK: 0, RESOLVE_CONDITION: 0,
  });
});

it('generates RCON- prefixed IDs for RESOLVE_CONDITION', () => {
  const state = initializeState('test');
  const [id] = generateId(state, 'RESOLVE_CONDITION');
  expect(id).toBe('RCON-1');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd skills/design-large-task/proof-mcp && npm test -- proof.test.js state.test.js`
Expected: 6 tests fail (4 in proof.test.js, 2 in state.test.js). Failures reference missing `RESOLVE_CONDITION` in `ELEMENT_TYPES`, missing `problem_anchor`/`ratification` fields on returned element, missing `RESOLVE_CONDITION` key in `elementCounters`, and missing prefix mapping.

- [ ] **Step 3: Write minimal implementation**

Edit `proof.js`:

```js
// Line 13-15 — extend ELEMENT_TYPES
export const ELEMENT_TYPES = [
  'EVIDENCE', 'RULE', 'PERMISSION', 'NECESSARY_CONDITION', 'RISK', 'RESOLVE_CONDITION',
];
```

```js
// Inside createElement — extend destructuring (around line 24-29) to extract problem_anchor + ratification
const {
  type, statement, source,
  grounding, collapse_test, reasoning_chain, rejected_alternatives,
  relieves, basis,
  problem_anchor,
} = input;
```

```js
// Add the RESOLVE_CONDITION validation block — insert after the RISK validation block (after line 76, before the return statement at line 78)
// RESOLVE_CONDITION: agent-proposes-PM-validates — requires problem_anchor; refuses designer source
if (type === 'RESOLVE_CONDITION') {
  if (!problem_anchor) {
    throw new Error('RESOLVE_CONDITION requires problem_anchor (Concern ID)');
  }
  if (source === 'designer') {
    throw new Error('RESOLVE_CONDITION cannot have source "designer" — RC is agent-proposes-PM-validates; ratification is captured via the ratify_resolve_condition tool');
  }
}
```

```js
// Extend the return shape (around line 78-93) — append problem_anchor and ratification to the universal shell
return {
  id,
  type,
  statement,
  source: source ?? null,
  grounding: Array.isArray(grounding) ? grounding : [],
  collapse_test: collapse_test ?? null,
  reasoning_chain: reasoning_chain ?? null,
  rejected_alternatives: Array.isArray(rejected_alternatives) ? rejected_alternatives : [],
  relieves: relieves ?? null,
  basis: Array.isArray(basis) ? basis : [],
  problem_anchor: problem_anchor ?? null,
  ratification: null,
  status: 'active',
  addedInRound: round,
  revisedInRound: null,
  revision: 0,
};
```

Edit `state.js`:

```js
// Line 16-22 — extend ID_PREFIX
const ID_PREFIX = {
  EVIDENCE: 'EVID-',
  RULE: 'RULE-',
  PERMISSION: 'PERM-',
  NECESSARY_CONDITION: 'NCON-',
  RISK: 'RISK-',
  RESOLVE_CONDITION: 'RCON-',
};
```

```js
// Inside initializeState — extend elementCounters (line 34-36)
elementCounters: {
  EVIDENCE: 0, RULE: 0, PERMISSION: 0, NECESSARY_CONDITION: 0, RISK: 0, RESOLVE_CONDITION: 0,
},
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd skills/design-large-task/proof-mcp && npm test -- --exclude="**/acceptance.test.js"`
Expected: full suite passes. New 6 tests pass; existing five-type validation tests pass unchanged. Existing `state.test.js:21-23` shape test passes because the assertion was extended in this task's test file.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/proof.js \
        skills/design-large-task/proof-mcp/state.js \
        skills/design-large-task/proof-mcp/__tests__/proof.test.js \
        skills/design-large-task/proof-mcp/__tests__/state.test.js
git commit -m "feat(proof-mcp): register RESOLVE_CONDITION element type with three-field schema"
```

---

## Task 2: Concerns lifecycle — addConcern + lockConcerns

**Type:** code-producing
**Implements:** AC-2.1, AC-2.2, AC-2.3, AC-2.4
**Decision budget:** 2 (Concern shape — flat array vs nested object; lock-empty refusal vs warning. Both resolved by spec lines 32-46.)
**Must remain green:** existing `state.test.js` tests, Task 1's new tests

**Files:**
- Modify: `skills/design-large-task/proof-mcp/state.js` (extend `initializeState`; add `addConcern`, `lockConcerns` exports)
- Test: `skills/design-large-task/proof-mcp/__tests__/state.test.js`

**Steps (TDD):**

- [ ] **Step 1: Write failing tests**

```js
// state.test.js — extend initializeState describe; add addConcern + lockConcerns describes

// Inside existing 'initializeState' describe:
it('initializes Concerns lifecycle fields', () => {
  const state = initializeState('test');
  expect(state.concerns).toEqual([]);
  expect(state.concernsLocked).toBe(false);
  expect(state.concernCounter).toBe(0);
});

describe('addConcern', () => {
  it('appends Concern with sequential CERN- ID', () => {
    let state = initializeState('test');
    const [id1, state1, err1] = addConcern(state, { label: 'First', description: 'D1' });
    expect(err1).toBeNull();
    expect(id1).toBe('CERN-1');
    expect(state1.concerns).toHaveLength(1);
    expect(state1.concerns[0]).toEqual({ id: 'CERN-1', label: 'First', description: 'D1' });
    expect(state1.concernCounter).toBe(1);

    const [id2, state2, err2] = addConcern(state1, { label: 'Second' });
    expect(err2).toBeNull();
    expect(id2).toBe('CERN-2');
    expect(state2.concerns).toHaveLength(2);
    expect(state2.concerns[1].description).toBeNull();
    expect(state2.concernCounter).toBe(2);
  });

  it('refuses to add when concernsLocked is true', () => {
    let state = initializeState('test');
    [, state] = addConcern(state, { label: 'A' });
    [, state] = lockConcerns(state);
    const [id, sameState, err] = addConcern(state, { label: 'B' });
    expect(id).toBeNull();
    expect(err).toMatch(/locked/i);
    expect(sameState.concerns).toHaveLength(1);
    expect(sameState.concernCounter).toBe(1);
  });
});

describe('lockConcerns', () => {
  it('flips concernsLocked to true after at least one Concern', () => {
    let state = initializeState('test');
    [, state] = addConcern(state, { label: 'A' });
    const [locked, err] = lockConcerns(state);
    expect(err).toBeNull();
    expect(locked.concernsLocked).toBe(true);
  });

  it('refuses to lock an empty Concerns list', () => {
    const state = initializeState('test');
    const [sameState, err] = lockConcerns(state);
    expect(err).toMatch(/empty/i);
    expect(sameState.concernsLocked).toBe(false);
  });

  it('refuses to lock an already-locked list', () => {
    let state = initializeState('test');
    [, state] = addConcern(state, { label: 'A' });
    [state] = lockConcerns(state);
    const [sameState, err] = lockConcerns(state);
    expect(err).toMatch(/already/i);
    expect(sameState.concernsLocked).toBe(true);
  });
});
```

Update the imports at the top of `state.test.js`:

```js
import {
  initializeState,
  generateId,
  applyOperations,
  markChallengeUsed,
  saveState,
  loadState,
  addConcern,
  lockConcerns,
} from '../state.js';
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd skills/design-large-task/proof-mcp && npm test -- state.test.js`
Expected: all addConcern + lockConcerns tests fail with "addConcern is not a function" or "lockConcerns is not a function". The initializeState extension test fails because `concerns`/`concernsLocked`/`concernCounter` are undefined.

- [ ] **Step 3: Write minimal implementation**

Edit `state.js` `initializeState`:

```js
// Add to the returned object in initializeState
concerns: [],
concernsLocked: false,
concernCounter: 0,
```

Add the two new exported functions to `state.js`:

```js
/**
 * Append a Concern to state. Refuses if Concerns list is locked.
 * @param {object} state
 * @param {{label: string, description?: string}} input
 * @returns {[string|null, object, string|null]} [concernId, newState, error]
 */
export function addConcern(state, { label, description }) {
  if (state.concernsLocked) {
    return [null, state, 'Concerns are locked; cannot add'];
  }
  const newState = structuredClone(state);
  newState.elements = cloneElements(state.elements);
  newState.concernCounter++;
  const id = `CERN-${newState.concernCounter}`;
  newState.concerns.push({ id, label, description: description ?? null });
  return [id, newState, null];
}

/**
 * Lock the Concerns list. Refuses on empty list or already-locked list.
 * @param {object} state
 * @returns {[object, string|null]} [newState, error]
 */
export function lockConcerns(state) {
  if (state.concernsLocked) {
    return [state, 'Concerns already locked'];
  }
  if (state.concerns.length === 0) {
    return [state, 'Cannot lock empty Concerns list'];
  }
  const newState = structuredClone(state);
  newState.elements = cloneElements(state.elements);
  newState.concernsLocked = true;
  return [newState, null];
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd skills/design-large-task/proof-mcp && npm test -- --exclude="**/acceptance.test.js"`
Expected: full suite passes; Task 1 tests still green.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/state.js \
        skills/design-large-task/proof-mcp/__tests__/state.test.js
git commit -m "feat(proof-mcp): Concerns lifecycle (addConcern, lockConcerns) with lock invariants"
```

---

## Task 3: Anchor validation on RC add

**Type:** code-producing
**Implements:** AC-1.2 (anchor existence), supports AC-3.x integrity
**Decision budget:** 1 (whether unknown-anchor is rejected at applyOperations vs createElement — spec line 55 places it at applyOperations)
**Must remain green:** Tasks 1-2 tests

**Files:**
- Modify: `skills/design-large-task/proof-mcp/state.js:81-99` (applyOperations `add` branch)
- Test: `skills/design-large-task/proof-mcp/__tests__/state.test.js`

**Steps (TDD):**

- [ ] **Step 1: Write failing tests**

```js
// state.test.js — new describe block
describe('applyOperations — RESOLVE_CONDITION add anchor validation', () => {
  it('accepts RESOLVE_CONDITION add when problem_anchor matches a Concern', () => {
    let state = initializeState('test');
    [, state] = addConcern(state, { label: 'C1' });
    const result = applyOperations(state, [
      { op: 'add', type: 'RESOLVE_CONDITION', statement: 'X', problem_anchor: 'CERN-1' },
    ]);
    expect(result.errors).toEqual([]);
    expect(result.added).toEqual(['RCON-1']);
  });

  it('rejects RESOLVE_CONDITION add when problem_anchor does not match any Concern', () => {
    const state = initializeState('test');
    const result = applyOperations(state, [
      { op: 'add', type: 'RESOLVE_CONDITION', statement: 'X', problem_anchor: 'CERN-99' },
    ]);
    expect(result.errors.some(e => /CERN-99/.test(e) && /Concern/i.test(e))).toBe(true);
    expect(result.added).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd skills/design-large-task/proof-mcp && npm test -- state.test.js`
Expected: anchor-mismatch test fails (error not pushed); accept-test may pass already if Task 1's `createElement` accepts the input — depends on how `applyOperations` flows it through.

- [ ] **Step 3: Write minimal implementation**

Extend the `add` branch in `applyOperations` (around `state.js:83-98`). Insert anchor validation between `validateRefs` and `generateId`:

```js
case 'add': {
  // Validate grounding/basis refs against current elements
  const groundingRefs = op.grounding || [];
  const basisRefs = op.basis || [];
  const allRefs = [...groundingRefs, ...basisRefs];
  const refErrors = validateRefs(allRefs, current.elements);
  if (refErrors.length > 0) {
    errors.push(...refErrors);
    break;
  }
  // RESOLVE_CONDITION: validate problem_anchor references an existing Concern
  if (op.type === 'RESOLVE_CONDITION' && op.problem_anchor) {
    const anchorExists = current.concerns.some(c => c.id === op.problem_anchor);
    if (!anchorExists) {
      errors.push(`Resolve Condition problem_anchor "${op.problem_anchor}" does not reference an existing Concern`);
      break;
    }
  }
  const [id, newState] = generateId(current, op.type);
  current = newState;
  const element = createElement(op, id, current.round);
  current.elements.set(id, element);
  added.push(id);
  break;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd skills/design-large-task/proof-mcp && npm test -- --exclude="**/acceptance.test.js"`
Expected: full suite passes.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/state.js \
        skills/design-large-task/proof-mcp/__tests__/state.test.js
git commit -m "feat(proof-mcp): validate problem_anchor against Concerns on RESOLVE_CONDITION add"
```

---

## Task 4: ratifyResolveCondition + ratificationLog

**Type:** code-producing
**Implements:** AC-4.1, AC-4.3
**Decision budget:** 1 (ratification shape — single-string vs `{ratifiedAtRound, text}` object — spec line 51 says object)
**Must remain green:** Tasks 1-3 tests

**Files:**
- Modify: `skills/design-large-task/proof-mcp/state.js` (`initializeState` adds `ratificationLog`; export `ratifyResolveCondition`)
- Test: `skills/design-large-task/proof-mcp/__tests__/state.test.js`

**Steps (TDD):**

- [ ] **Step 1: Write failing tests**

```js
// state.test.js — extend initializeState assertion + new describe
it('initializes ratificationLog as empty array', () => {
  const state = initializeState('test');
  expect(state.ratificationLog).toEqual([]);
});

describe('ratifyResolveCondition', () => {
  it('ratifies a single active RESOLVE_CONDITION', () => {
    let state = initializeState('test');
    [, state] = addConcern(state, { label: 'C1' });
    [state] = lockConcerns(state);
    const result = applyOperations(state, [
      { op: 'add', type: 'RESOLVE_CONDITION', statement: 'X', problem_anchor: 'CERN-1' },
    ]);
    state = result.state;
    const [newState, err] = ratifyResolveCondition(state, { elementId: 'RCON-1', ratificationText: 'PM approves' });
    expect(err).toBeNull();
    const rc = newState.elements.get('RCON-1');
    expect(rc.ratification).toEqual({ ratifiedAtRound: state.round, text: 'PM approves' });
    expect(newState.ratificationLog).toHaveLength(1);
    expect(newState.ratificationLog[0]).toMatchObject({
      event: 'ratified', target: 'RCON-1', ratificationText: 'PM approves',
    });
  });

  it('rejects ratification of a non-RC element', () => {
    let state = initializeState('test');
    const result = applyOperations(state, [
      { op: 'add', type: 'EVIDENCE', statement: 'fact', source: 'codebase' },
    ]);
    state = result.state;
    const [sameState, err] = ratifyResolveCondition(state, { elementId: 'EVID-1', ratificationText: 'X' });
    expect(err).toMatch(/RESOLVE_CONDITION/);
    expect(sameState).toBe(state);
  });

  it('rejects ratification of unknown element', () => {
    const state = initializeState('test');
    const [, err] = ratifyResolveCondition(state, { elementId: 'RCON-99', ratificationText: 'X' });
    expect(err).toMatch(/not found/i);
  });

  it('rejects empty ratificationText', () => {
    let state = initializeState('test');
    [, state] = addConcern(state, { label: 'C1' });
    [state] = lockConcerns(state);
    const result = applyOperations(state, [
      { op: 'add', type: 'RESOLVE_CONDITION', statement: 'X', problem_anchor: 'CERN-1' },
    ]);
    state = result.state;
    const [, err] = ratifyResolveCondition(state, { elementId: 'RCON-1', ratificationText: '' });
    expect(err).toMatch(/required/i);
  });
});
```

Add `ratifyResolveCondition` to the imports at the top of `state.test.js`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd skills/design-large-task/proof-mcp && npm test -- state.test.js`
Expected: 4 ratify tests fail with `ratifyResolveCondition is not a function`; the initializeState ratificationLog assertion fails because field is undefined.

- [ ] **Step 3: Write minimal implementation**

Edit `initializeState` to add `ratificationLog: []`.

Add the new export to `state.js`:

```js
/**
 * Ratify a single Resolve Condition. Refuses non-RC, withdrawn, unknown, or empty text.
 * Sequential by design — caller passes a single elementId.
 * @param {object} state
 * @param {{elementId: string, ratificationText: string}} input
 * @returns {[object, string|null]} [newState, error]
 */
export function ratifyResolveCondition(state, { elementId, ratificationText }) {
  const target = state.elements.get(elementId);
  if (!target) {
    return [state, `Element "${elementId}" not found`];
  }
  if (target.type !== 'RESOLVE_CONDITION') {
    return [state, `Element "${elementId}" is not a RESOLVE_CONDITION`];
  }
  if (target.status !== 'active') {
    return [state, `Element "${elementId}" is not active`];
  }
  if (!ratificationText || typeof ratificationText !== 'string') {
    return [state, 'Ratification text is required'];
  }
  const newState = structuredClone(state);
  newState.elements = cloneElements(state.elements);
  const updatedTarget = newState.elements.get(elementId);
  updatedTarget.ratification = { ratifiedAtRound: state.round, text: ratificationText };
  newState.ratificationLog.push({
    event: 'ratified',
    target: elementId,
    round: state.round,
    ratificationText,
  });
  return [newState, null];
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd skills/design-large-task/proof-mcp && npm test -- --exclude="**/acceptance.test.js"`
Expected: full suite passes.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/state.js \
        skills/design-large-task/proof-mcp/__tests__/state.test.js
git commit -m "feat(proof-mcp): ratifyResolveCondition with sequential single-element contract"
```

---

## Task 5: Revise-clears-ratification + accept problem_anchor

**Type:** code-producing
**Implements:** AC-5.1, AC-5.2, AC-5.3
**Decision budget:** 1 (whether to clear-and-log or warn-on-stale — spec line 24 commits to clear-and-log; cleared-on-revise approach makes stale structurally impossible)
**Must remain green:** Tasks 1-4 tests

**Files:**
- Modify: `skills/design-large-task/proof-mcp/state.js:100-122` (applyOperations `revise` branch)
- Test: `skills/design-large-task/proof-mcp/__tests__/state.test.js`

**Steps (TDD):**

- [ ] **Step 1: Write failing tests**

```js
// state.test.js — new describe
describe('applyOperations — revise on RESOLVE_CONDITION clears ratification', () => {
  function buildRatifiedRC() {
    let state = initializeState('test');
    [, state] = addConcern(state, { label: 'C1' });
    [, state] = addConcern(state, { label: 'C2' });
    [state] = lockConcerns(state);
    const result = applyOperations(state, [
      { op: 'add', type: 'RESOLVE_CONDITION', statement: 'original', problem_anchor: 'CERN-1' },
    ]);
    state = result.state;
    [state] = ratifyResolveCondition(state, { elementId: 'RCON-1', ratificationText: 'PM approves' });
    return state;
  }

  it('clears ratification and logs when statement is revised', () => {
    const state = buildRatifiedRC();
    const result = applyOperations(state, [
      { op: 'revise', target: 'RCON-1', statement: 'updated' },
    ]);
    const rc = result.state.elements.get('RCON-1');
    expect(rc.statement).toBe('updated');
    expect(rc.ratification).toBeNull();
    const lastLog = result.state.ratificationLog[result.state.ratificationLog.length - 1];
    expect(lastLog).toMatchObject({ event: 'cleared-on-revise', target: 'RCON-1' });
    expect(lastLog.fields).toContain('statement');
  });

  it('clears ratification and logs when problem_anchor is revised', () => {
    const state = buildRatifiedRC();
    const result = applyOperations(state, [
      { op: 'revise', target: 'RCON-1', problem_anchor: 'CERN-2' },
    ]);
    const rc = result.state.elements.get('RCON-1');
    expect(rc.problem_anchor).toBe('CERN-2');
    expect(rc.ratification).toBeNull();
    const lastLog = result.state.ratificationLog[result.state.ratificationLog.length - 1];
    expect(lastLog).toMatchObject({ event: 'cleared-on-revise', target: 'RCON-1' });
    expect(lastLog.fields).toContain('problem_anchor');
  });

  it('preserves ratification when revise touches no semantic field', () => {
    const state = buildRatifiedRC();
    const ratificationLogLength = state.ratificationLog.length;
    const result = applyOperations(state, [
      { op: 'revise', target: 'RCON-1', grounding: [] },
    ]);
    const rc = result.state.elements.get('RCON-1');
    expect(rc.ratification).toEqual({ ratifiedAtRound: 1, text: 'PM approves' });
    expect(result.state.ratificationLog).toHaveLength(ratificationLogLength);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd skills/design-large-task/proof-mcp && npm test -- state.test.js`
Expected: 3 tests fail. Statement-clear test fails because revise doesn't null `ratification`. Anchor-revise test fails because `problem_anchor` isn't in the accepted-fields list. Preserve test may pass trivially or fail on logging — confirm.

- [ ] **Step 3: Write minimal implementation**

Edit the `revise` branch in `applyOperations` (around `state.js:100-122`):

```js
case 'revise': {
  const target = current.elements.get(op.target);
  if (!target || target.status !== 'active') {
    errors.push(`Cannot revise "${op.target}": element not found or not active`);
    break;
  }
  // Detect ratification-clearing fields BEFORE applying changes
  const semanticFieldsChanged = [];
  if (op.statement !== undefined && target.statement !== op.statement) {
    semanticFieldsChanged.push('statement');
  }
  if (op.problem_anchor !== undefined && target.problem_anchor !== op.problem_anchor) {
    semanticFieldsChanged.push('problem_anchor');
  }
  if (op.statement !== undefined) target.statement = op.statement;
  if (op.problem_anchor !== undefined) target.problem_anchor = op.problem_anchor;
  if (op.grounding !== undefined) target.grounding = op.grounding;
  if (op.basis !== undefined) target.basis = op.basis;
  if (op.collapse_test !== undefined) target.collapse_test = op.collapse_test;
  if (op.reasoning_chain !== undefined) target.reasoning_chain = op.reasoning_chain;
  if (op.rejected_alternatives !== undefined) target.rejected_alternatives = op.rejected_alternatives;
  if (op.relieves !== undefined) target.relieves = op.relieves;
  // Clear ratification if a ratified RESOLVE_CONDITION had statement or problem_anchor revised
  if (
    target.type === 'RESOLVE_CONDITION' &&
    target.ratification !== null &&
    semanticFieldsChanged.length > 0
  ) {
    target.ratification = null;
    current.ratificationLog.push({
      event: 'cleared-on-revise',
      target: op.target,
      round: current.round,
      fields: semanticFieldsChanged,
    });
  }
  target.revision++;
  target.revisedInRound = current.round;
  current.revisionLog.push({
    target: op.target,
    round: current.round,
    revision: target.revision,
  });
  revised.push(op.target);
  break;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd skills/design-large-task/proof-mcp && npm test -- --exclude="**/acceptance.test.js"`
Expected: full suite passes.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/state.js \
        skills/design-large-task/proof-mcp/__tests__/state.test.js
git commit -m "feat(proof-mcp): revise-clears-ratification on RC statement or problem_anchor change"
```

---

## Task 6: Integrity checks (checkUnratifiedResolveConditions, checkStaleRatification sentinel)

**Type:** code-producing
**Implements:** AC-1.5
**Decision budget:** 1 (sentinel-vs-active for stale-ratification — spec line 24 commits sentinel)
**Must remain green:** Tasks 1-5 tests

**Files:**
- Modify: `skills/design-large-task/proof-mcp/proof.js` (add 2 exports; extend `checkAllIntegrity`)
- Test: `skills/design-large-task/proof-mcp/__tests__/proof.test.js`

**Steps (TDD):**

- [ ] **Step 1: Write failing tests**

`proof.test.js` does not currently define `makeElement` or `mapOf` helpers (those exist only in `metrics.test.js`). Add them at the top of `proof.test.js` before any new describe block (right after the existing imports):

```js
// Helpers — borrowed from metrics.test.js shape
function makeElement(overrides) {
  return {
    id: 'e1',
    type: 'EVIDENCE',
    statement: 'test',
    source: 'codebase',
    grounding: [],
    collapse_test: null,
    reasoning_chain: null,
    rejected_alternatives: [],
    relieves: null,
    basis: [],
    problem_anchor: null,
    ratification: null,
    status: 'active',
    addedInRound: 0,
    revisedInRound: null,
    revision: 0,
    ...overrides,
  };
}

function mapOf(...elements) {
  const m = new Map();
  for (const el of elements) m.set(el.id, el);
  return m;
}
```

Then add the failing tests:

```js
// proof.test.js — new describes
describe('checkUnratifiedResolveConditions', () => {
  it('flags active unratified RCs', () => {
    const map = mapOf(
      makeElement({ id: 'RCON-1', type: 'RESOLVE_CONDITION', statement: 'X', problem_anchor: 'CERN-1', ratification: null }),
      makeElement({ id: 'RCON-2', type: 'RESOLVE_CONDITION', statement: 'Y', problem_anchor: 'CERN-1', ratification: { ratifiedAtRound: 1, text: 'ok' } }),
    );
    const warnings = checkUnratifiedResolveConditions(map);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatchObject({ type: 'unratified-rc', element_id: 'RCON-1' });
  });

  it('ignores withdrawn RCs', () => {
    const map = mapOf(
      makeElement({ id: 'RCON-1', type: 'RESOLVE_CONDITION', statement: 'X', problem_anchor: 'CERN-1', ratification: null, status: 'withdrawn' }),
    );
    expect(checkUnratifiedResolveConditions(map)).toEqual([]);
  });
});

describe('checkStaleRatification (sentinel)', () => {
  it('returns empty for any element state', () => {
    const ratified = makeElement({ id: 'RCON-1', type: 'RESOLVE_CONDITION', statement: 'X', problem_anchor: 'CERN-1', ratification: { ratifiedAtRound: 1, text: 'ok' } });
    const unratified = makeElement({ id: 'RCON-2', type: 'RESOLVE_CONDITION', statement: 'Y', problem_anchor: 'CERN-1', ratification: null });
    const withdrawn = makeElement({ id: 'RCON-3', type: 'RESOLVE_CONDITION', statement: 'Z', problem_anchor: 'CERN-1', ratification: null, status: 'withdrawn' });
    expect(checkStaleRatification(mapOf(ratified, unratified, withdrawn))).toEqual([]);
  });
});

describe('checkAllIntegrity — Resolve Conditions', () => {
  it('includes checkUnratifiedResolveConditions output', () => {
    const map = mapOf(
      makeElement({ id: 'RCON-1', type: 'RESOLVE_CONDITION', statement: 'X', problem_anchor: 'CERN-1', ratification: null }),
    );
    const warnings = checkAllIntegrity(map);
    expect(warnings.some(w => w.type === 'unratified-rc')).toBe(true);
  });
});
```

Update `makeElement` helper (in `proof.test.js`) to default `problem_anchor: null` and `ratification: null` so it stays compatible with the new universal shell. Update the imports to include `checkUnratifiedResolveConditions` and `checkStaleRatification`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd skills/design-large-task/proof-mcp && npm test -- proof.test.js`
Expected: tests fail with import errors (functions not exported).

- [ ] **Step 3: Write minimal implementation**

Add to `proof.js`:

```js
/**
 * Flag active RESOLVE_CONDITIONs whose ratification field is null.
 * @param {Map} elements
 * @returns {Array<{type: string, element_id: string, message: string}>}
 */
export function checkUnratifiedResolveConditions(elements) {
  const warnings = [];
  for (const [id, el] of elements) {
    if (el.status !== 'active') continue;
    if (el.type !== 'RESOLVE_CONDITION') continue;
    if (el.ratification === null) {
      warnings.push({
        type: 'unratified-rc',
        element_id: id,
        message: `Resolve Condition "${id}" is unratified`,
      });
    }
  }
  return warnings;
}

/**
 * Sentinel — structurally impossible under cleared-on-revise approach (revise nulls
 * ratification at write time). Exists for symmetry and as a tested extension callsite.
 * @param {Map} elements
 * @returns {Array}
 */
export function checkStaleRatification(_elements) {
  return [];
}
```

Extend `checkAllIntegrity`:

```js
export function checkAllIntegrity(elements) {
  return [
    ...checkWithdrawnGrounding(elements),
    ...checkUngrounded(elements),
    ...checkMissingCollapseTest(elements),
    ...checkStaleGrounding(elements),
    ...checkUnratifiedResolveConditions(elements),
    ...checkStaleRatification(elements),
  ];
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd skills/design-large-task/proof-mcp && npm test -- --exclude="**/acceptance.test.js"`
Expected: full suite passes.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/proof.js \
        skills/design-large-task/proof-mcp/__tests__/proof.test.js
git commit -m "feat(proof-mcp): integrity checks for unratified RCs + stale-ratification sentinel"
```

---

## Task 7: Coverage and closure conditions 7-10

**Type:** code-producing
**Implements:** AC-3.1, AC-3.2, AC-3.3, AC-3.4, AC-3.5
**Decision budget:** 2 (Rule-union match: case-insensitive substring on label OR id — spec line 66 picks both; closure ordering of conditions 7-10 — spec lines 68-72 fix the order)
**Must remain green:** Tasks 1-6 tests

**Files:**
- Modify: `skills/design-large-task/proof-mcp/metrics.js` (extend `computeCompleteness`; add `checkConcernCoverage`; extend `checkClosure`)
- Test: `skills/design-large-task/proof-mcp/__tests__/metrics.test.js`

**Steps (TDD):**

- [ ] **Step 1: Write failing tests** — and update existing fixtures that the new code will break

**Fixture update 1 — `metrics.test.js:42-56` (`'returns zeros for an empty map'`):** the existing test uses exact `toEqual` over the full `computeCompleteness` return shape. After adding `resolve_condition_count` and `ratified_rc_count`, this assertion mismatches. Update the expected object to include the two new keys:

```js
expect(result).toEqual({
  total_elements: 0, active_elements: 0, condition_count: 0,
  conditions_with_alternatives: 0, conditions_with_collapse_test: 0,
  rule_count: 0, evidence_count: 0, permission_count: 0,
  risk_count: 0,
  resolve_condition_count: 0, ratified_rc_count: 0,
  revision_count: 0,
});
```

**Fixture update 2 — `metrics.test.js` `closableState()` factory (around lines 306-320):** the existing fixture returns `{ elements, round: 4, phaseTransitionRound: 1 }` with no `concerns` or `concernsLocked`. After Task 7's condition 8 fires on undefined `concerns`, every existing `checkClosure` test using `closableState()` fails. Update the factory to satisfy all ten conditions:

```js
function closableState() {
  // existing element setup that already satisfies conditions 1-6
  const evidence = makeElement({ id: 'EVID-1', type: 'EVIDENCE', statement: 'fact', source: 'codebase' });
  const nc = makeElement({
    id: 'NCON-1', type: 'NECESSARY_CONDITION', statement: 'NC',
    grounding: ['EVID-1'], collapse_test: 'breaks', reasoning_chain: 'IF...THEN',
    rejected_alternatives: ['alt'], revisedInRound: 2,
  });
  // RC + Concern wiring so conditions 7-10 also pass
  const rc = makeElement({
    id: 'RCON-1', type: 'RESOLVE_CONDITION', statement: 'r',
    problem_anchor: 'CERN-1',
    ratification: { ratifiedAtRound: 1, text: 'ok' },
  });
  return {
    round: 4, phaseTransitionRound: 1,
    elements: mapOf(evidence, nc, rc),
    concerns: [{ id: 'CERN-1', label: 'X', description: null }],
    concernsLocked: true,
  };
}
```

The "permits closure when conditions met" test then continues to pass; the failing-reason tests built on `closableState()` continue to exercise their original conditions (1-6) by withdrawing or removing the relevant element from the cloned fixture, not by removing `concerns` (since condition 8 would mask the original failure). When a test wants to assert a condition-1-through-6 failure, it should mutate the relevant field directly (e.g., remove the NC's `collapse_test`, or change the round) rather than removing Concerns/RC wiring.

The "collects all failing reasons at once" test at `metrics.test.js:384-393` (which uses an empty Map, no concerns) now reports more reasons (1-6 unsatisfied + condition 8 + 9). The existing `expect(reasons.length >= 3)` assertion still passes; no edit needed beyond noting the new floor count is higher.

Then add the new tests:

```js
// metrics.test.js — extend existing computeCompleteness describe + new describes
describe('computeCompleteness — Resolve Conditions', () => {
  it('counts active RCs and ratified RCs', () => {
    const ratified = makeElement({ id: 'RCON-1', type: 'RESOLVE_CONDITION', statement: 'X', problem_anchor: 'CERN-1', ratification: { ratifiedAtRound: 1, text: 'ok' } });
    const unratified = makeElement({ id: 'RCON-2', type: 'RESOLVE_CONDITION', statement: 'Y', problem_anchor: 'CERN-1', ratification: null });
    const withdrawn = makeElement({ id: 'RCON-3', type: 'RESOLVE_CONDITION', statement: 'Z', problem_anchor: 'CERN-1', ratification: null, status: 'withdrawn' });
    const m = mapOf(ratified, unratified, withdrawn);
    const c = computeCompleteness(m);
    expect(c.resolve_condition_count).toBe(2);
    expect(c.ratified_rc_count).toBe(1);
  });
});

describe('checkConcernCoverage', () => {
  function buildState({ concerns, elements }) {
    const map = new Map();
    for (const el of elements) map.set(el.id, el);
    return { concerns, concernsLocked: true, elements: map };
  }

  it('marks Concern as covered when a ratified RC anchors to it', () => {
    const state = buildState({
      concerns: [{ id: 'CERN-1', label: 'Performance', description: null }],
      elements: [
        makeElement({ id: 'RCON-1', type: 'RESOLVE_CONDITION', statement: 'fast', problem_anchor: 'CERN-1', ratification: { ratifiedAtRound: 1, text: 'ok' } }),
      ],
    });
    const cov = checkConcernCoverage(state);
    expect(cov.covered).toEqual(['CERN-1']);
    expect(cov.uncovered).toEqual([]);
  });

  it('does NOT mark covered when RC is unratified', () => {
    const state = buildState({
      concerns: [{ id: 'CERN-1', label: 'Performance', description: null }],
      elements: [
        makeElement({ id: 'RCON-1', type: 'RESOLVE_CONDITION', statement: 'fast', problem_anchor: 'CERN-1', ratification: null }),
      ],
    });
    expect(checkConcernCoverage(state).uncovered).toEqual(['CERN-1']);
  });

  it('marks Concern as covered via Rule mentioning the Concern ID', () => {
    const state = buildState({
      concerns: [{ id: 'CERN-1', label: 'Performance', description: null }],
      elements: [
        makeElement({ id: 'RULE-1', type: 'RULE', statement: 'Avoid CERN-1 mitigation paths', source: 'designer' }),
      ],
    });
    expect(checkConcernCoverage(state).covered).toEqual(['CERN-1']);
  });

  it('marks Concern as covered via Rule mentioning the Concern label (case-insensitive)', () => {
    const state = buildState({
      concerns: [{ id: 'CERN-1', label: 'Performance', description: null }],
      elements: [
        makeElement({ id: 'RULE-1', type: 'RULE', statement: 'preserve performance baseline', source: 'designer' }),
      ],
    });
    expect(checkConcernCoverage(state).covered).toEqual(['CERN-1']);
  });

  it('returns uncovered Concern when no RC and no Rule covers it', () => {
    const state = buildState({
      concerns: [{ id: 'CERN-1', label: 'Performance', description: null }, { id: 'CERN-2', label: 'Auditability', description: null }],
      elements: [
        makeElement({ id: 'RCON-1', type: 'RESOLVE_CONDITION', statement: 'fast', problem_anchor: 'CERN-1', ratification: { ratifiedAtRound: 1, text: 'ok' } }),
      ],
    });
    expect(checkConcernCoverage(state).uncovered).toEqual(['CERN-2']);
  });
});

describe('checkClosure — Concerns and Resolve Conditions (conditions 7-10)', () => {
  function baseClosureState() {
    // Build a state that passes the existing six conditions:
    //  - at least one NC, grounded, with collapse_test, with rejected_alternatives,
    //  - at least one element revised post-transition, round >= 3.
    const evidence = makeElement({ id: 'EVID-1', type: 'EVIDENCE', statement: 'fact', source: 'codebase' });
    const nc = makeElement({
      id: 'NCON-1', type: 'NECESSARY_CONDITION', statement: 'NC',
      grounding: ['EVID-1'], collapse_test: 'breaks', reasoning_chain: 'IF...THEN',
      rejected_alternatives: ['alt'], revisedInRound: 2,
    });
    return {
      round: 3, phaseTransitionRound: 1,
      elements: mapOf(evidence, nc),
      concerns: [],
      concernsLocked: false,
    };
  }

  it('condition 8: refuses closure when Concerns list is empty', () => {
    const state = baseClosureState();
    const c = checkClosure(state);
    expect(c.permitted).toBe(false);
    expect(c.reasons).toContain('No Concerns enumerated — at least one Concern required before closure');
  });

  it('condition 7: refuses closure when Concerns are not locked', () => {
    const state = baseClosureState();
    state.concerns = [{ id: 'CERN-1', label: 'X', description: null }];
    state.concernsLocked = false;
    const c = checkClosure(state);
    expect(c.reasons).toContain('Concerns must be locked before closure');
  });

  it('condition 9: refuses closure when an RC is unratified', () => {
    const state = baseClosureState();
    state.concerns = [{ id: 'CERN-1', label: 'X', description: null }];
    state.concernsLocked = true;
    const rc = makeElement({ id: 'RCON-1', type: 'RESOLVE_CONDITION', statement: 'r', problem_anchor: 'CERN-1', ratification: null });
    state.elements.set('RCON-1', rc);
    const c = checkClosure(state);
    expect(c.reasons.some(r => /Unratified Resolve Conditions/.test(r))).toBe(true);
  });

  it('condition 10: lists each uncovered Concern', () => {
    const state = baseClosureState();
    state.concerns = [
      { id: 'CERN-1', label: 'X', description: null },
      { id: 'CERN-2', label: 'Y', description: null },
    ];
    state.concernsLocked = true;
    const rc = makeElement({ id: 'RCON-1', type: 'RESOLVE_CONDITION', statement: 'r', problem_anchor: 'CERN-1', ratification: { ratifiedAtRound: 1, text: 'ok' } });
    state.elements.set('RCON-1', rc);
    const c = checkClosure(state);
    expect(c.reasons.some(r => /CERN-2/.test(r))).toBe(true);
    expect(c.reasons.some(r => /CERN-1/.test(r))).toBe(false);
  });

  it('permits closure when all 10 conditions pass', () => {
    const state = baseClosureState();
    state.concerns = [{ id: 'CERN-1', label: 'X', description: null }];
    state.concernsLocked = true;
    const rc = makeElement({ id: 'RCON-1', type: 'RESOLVE_CONDITION', statement: 'r', problem_anchor: 'CERN-1', ratification: { ratifiedAtRound: 1, text: 'ok' } });
    state.elements.set('RCON-1', rc);
    const c = checkClosure(state);
    expect(c.permitted).toBe(true);
    expect(c.reasons).toEqual([]);
  });
});
```

Update `makeElement` helper in `metrics.test.js` to default `problem_anchor: null`, `ratification: null`. Update imports to include `checkConcernCoverage`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd skills/design-large-task/proof-mcp && npm test -- metrics.test.js`
Expected: counter tests fail with `undefined` properties; coverage tests fail with `checkConcernCoverage is not a function`; closure tests fail because new conditions don't exist.

- [ ] **Step 3: Write minimal implementation**

Edit `metrics.js`:

```js
// Inside computeCompleteness — declare and increment two new counters
let resolve_condition_count = 0;
let ratified_rc_count = 0;
// Inside the loop, alongside existing if-blocks
if (el.type === 'RESOLVE_CONDITION') {
  resolve_condition_count++;
  if (el.ratification !== null) ratified_rc_count++;
}
// Add to the returned object
return {
  total_elements,
  active_elements,
  condition_count,
  conditions_with_alternatives,
  conditions_with_collapse_test,
  rule_count,
  evidence_count,
  permission_count,
  risk_count,
  resolve_condition_count,
  ratified_rc_count,
  revision_count,
};
```

Add `checkConcernCoverage`:

```js
/**
 * Compute per-Concern coverage. Each Concern is covered if:
 *  (RC path) at least one active RESOLVE_CONDITION with matching problem_anchor and ratification !== null, OR
 *  (Rule-union path) at least one active RULE whose statement (case-insensitive) contains the Concern's id or label.
 * @param {object} state — { concerns, elements }
 * @returns {{ covered: string[], uncovered: string[] }}
 */
export function checkConcernCoverage(state) {
  const covered = [];
  const uncovered = [];
  for (const concern of state.concerns) {
    let isCovered = false;
    for (const [, el] of state.elements) {
      if (el.status !== 'active') continue;
      if (el.type === 'RESOLVE_CONDITION' && el.problem_anchor === concern.id && el.ratification !== null) {
        isCovered = true; break;
      }
      if (el.type === 'RULE') {
        const stmt = (el.statement || '').toLowerCase();
        if (stmt.includes(concern.id.toLowerCase()) || stmt.includes(concern.label.toLowerCase())) {
          isCovered = true; break;
        }
      }
    }
    (isCovered ? covered : uncovered).push(concern.id);
  }
  return { covered, uncovered };
}
```

Extend `checkClosure` — append after the existing six-condition logic, before the final return:

```js
// 7. Concerns must be locked before closure (when any are present)
if (state.concerns && state.concerns.length > 0 && !state.concernsLocked) {
  reasons.push('Concerns must be locked before closure');
}

// 8. At least one Concern required
if (!state.concerns || state.concerns.length === 0) {
  reasons.push('No Concerns enumerated — at least one Concern required before closure');
}

// 9. No active RC may be unratified
let anyUnratifiedRc = false;
for (const [, el] of elements) {
  if (el.status === 'active' && el.type === 'RESOLVE_CONDITION' && el.ratification === null) {
    anyUnratifiedRc = true;
    break;
  }
}
if (anyUnratifiedRc) {
  reasons.push('Unratified Resolve Conditions exist — ratify each before closure');
}

// 10. Per-Concern coverage when locked
if (state.concernsLocked) {
  const { uncovered } = checkConcernCoverage(state);
  for (const concernId of uncovered) {
    reasons.push(`Concern "${concernId}" is not covered by any ratified Resolve Condition or Rule`);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd skills/design-large-task/proof-mcp && npm test -- --exclude="**/acceptance.test.js"`
Expected: full suite passes.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/metrics.js \
        skills/design-large-task/proof-mcp/__tests__/metrics.test.js
git commit -m "feat(proof-mcp): per-Concern closure coverage with Rule-union path"
```

---

## Task 8: MCP server tools (manage_concerns, ratify_resolve_condition)

**Type:** code-producing
**Implements:** AC-4.2 (singular schema); server-layer wiring for AC-2.1–2.4 (manage_concerns dispatch) and AC-4.1 (ratify dispatch)
**Decision budget:** 2 (manage_concerns single tool with op enum vs two tools — spec line 80 fixes single tool; whether `concernCoverage` lives on the response when concerns are unlocked — spec line 95 says omit)
**Must remain green:** Tasks 1-7 tests

**Files:**
- Modify: `skills/design-large-task/proof-mcp/server.js:11` (ELEMENT_TYPES); `server.js:43-67` (submit_proof_update schema); `server.js:20-90` (TOOLS array — add 2 tools); `server.js:102-110` (switch dispatch); `server.js:119-134` (handleInitialize); `server.js:187-212` (handleGetProofState)
- Test: `skills/design-large-task/proof-mcp/__tests__/server.test.js` (new)

**Steps (TDD):**

- [ ] **Step 1: Write failing tests**

```js
// __tests__/server.test.js — new file
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverSource = readFileSync(join(__dirname, '../server.js'), 'utf-8');

describe('server.js — RESOLVE_CONDITION wiring', () => {
  it('local ELEMENT_TYPES includes RESOLVE_CONDITION', () => {
    expect(serverSource).toMatch(/ELEMENT_TYPES\s*=\s*\[[^\]]*'RESOLVE_CONDITION'/s);
  });

  it('submit_proof_update schema declares problem_anchor', () => {
    expect(serverSource).toMatch(/problem_anchor:\s*\{\s*type:\s*'string'/);
  });
});

describe('server.js — manage_concerns tool', () => {
  it('declares manage_concerns tool', () => {
    expect(serverSource).toMatch(/name:\s*'manage_concerns'/);
  });

  it('manage_concerns op enum lists add and lock', () => {
    expect(serverSource).toMatch(/op:\s*\{[^}]*enum:\s*\[\s*'add',\s*'lock'\s*\]/s);
  });
});

describe('server.js — ratify_resolve_condition tool', () => {
  it('declares ratify_resolve_condition tool', () => {
    expect(serverSource).toMatch(/name:\s*'ratify_resolve_condition'/);
  });

  it('schema is singular — element_id is type string, not array', () => {
    // Locate the ratify_resolve_condition block and confirm element_id is string
    const m = serverSource.match(/name:\s*'ratify_resolve_condition'[\s\S]*?required:\s*\[([^\]]+)\]/);
    expect(m).not.toBeNull();
    const required = m[1];
    expect(required).toMatch(/'element_id'/);
    expect(required).not.toMatch(/'element_ids'/);
  });

  it('schema does not declare element_ids array property', () => {
    // The ratify block must not contain "element_ids" anywhere
    const ratifyBlock = serverSource.split("name: 'ratify_resolve_condition'")[1] ?? '';
    const blockEnd = ratifyBlock.indexOf('},\n  {') > -1 ? ratifyBlock.indexOf('},\n  {') : ratifyBlock.length;
    expect(ratifyBlock.slice(0, blockEnd)).not.toMatch(/element_ids/);
  });
});

describe('server.js — switch dispatch', () => {
  it('dispatches manage_concerns and ratify_resolve_condition', () => {
    expect(serverSource).toMatch(/case\s+'manage_concerns'/);
    expect(serverSource).toMatch(/case\s+'ratify_resolve_condition'/);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd skills/design-large-task/proof-mcp && npm test -- server.test.js`
Expected: all tests fail (server.js does not yet declare the new tools or update the schema).

- [ ] **Step 3: Write minimal implementation**

Edit `server.js`:

```js
// Line 11
const ELEMENT_TYPES = ['EVIDENCE', 'RULE', 'PERMISSION', 'NECESSARY_CONDITION', 'RISK', 'RESOLVE_CONDITION'];
```

```js
// Line 7 — extend imports from state.js
import {
  initializeState, applyOperations, markChallengeUsed, saveState, loadState,
  addConcern, lockConcerns, ratifyResolveCondition,
} from './state.js';
```

```js
// Line 9 — extend imports from metrics.js
import {
  computeCompleteness, computeGroundingCoverage, detectChallenge, checkClosure,
  checkConcernCoverage,
} from './metrics.js';
```

Update `submit_proof_update` schema's per-operation properties — add `problem_anchor` after the existing `relieves` field (roughly `server.js:60`):

```js
problem_anchor: { type: 'string', description: 'Concern ID anchor (for RESOLVE_CONDITION add/revise)' },
```

Add two new tool definitions to the `TOOLS` array (after `get_proof_state`, around `server.js:90`):

```js
{
  name: 'manage_concerns',
  description: 'Add or lock Concerns attached to the problem statement. Concerns anchor Resolve Conditions for closure coverage.',
  inputSchema: {
    type: 'object',
    properties: {
      state_file: { type: 'string', description: 'Absolute path to state JSON' },
      op: { type: 'string', enum: ['add', 'lock'] },
      label: { type: 'string', description: 'Concern label (required for op=add)' },
      description: { type: 'string', description: 'Optional Concern description (op=add only)' },
    },
    required: ['state_file', 'op'],
  },
},
{
  name: 'ratify_resolve_condition',
  description: 'Ratify a single Resolve Condition. Sequential by design — accepts one element_id per call; batch shapes are not supported.',
  inputSchema: {
    type: 'object',
    properties: {
      state_file: { type: 'string', description: 'Absolute path to state JSON' },
      element_id: { type: 'string', description: 'RCON-N ID of the Resolve Condition to ratify' },
      ratification: { type: 'string', description: "PM's sign-off text" },
    },
    required: ['state_file', 'element_id', 'ratification'],
  },
},
```

Extend the dispatch switch (around `server.js:102-110`):

```js
case 'manage_concerns':
  return handleManageConcerns(args);
case 'ratify_resolve_condition':
  return handleRatifyResolveCondition(args);
```

Add the two handler functions after `handleGetProofState` (around `server.js:212`):

```js
function handleManageConcerns({ state_file, op, label, description }) {
  let state = loadState(state_file);
  if (op === 'add') {
    if (!label) {
      return { content: [{ type: 'text', text: JSON.stringify({ status: 'rejected', error: 'label required for op=add' }) }], isError: true };
    }
    const [concernId, newState, err] = addConcern(state, { label, description });
    if (err) {
      return { content: [{ type: 'text', text: JSON.stringify({ status: 'rejected', error: err }) }], isError: true };
    }
    saveState(newState, state_file);
    return { content: [{ type: 'text', text: JSON.stringify({ status: 'accepted', concern_id: concernId, concerns_count: newState.concerns.length }) }] };
  }
  if (op === 'lock') {
    const [newState, err] = lockConcerns(state);
    if (err) {
      return { content: [{ type: 'text', text: JSON.stringify({ status: 'rejected', error: err }) }], isError: true };
    }
    saveState(newState, state_file);
    return { content: [{ type: 'text', text: JSON.stringify({ status: 'accepted', locked: true, concerns_count: newState.concerns.length }) }] };
  }
  return { content: [{ type: 'text', text: JSON.stringify({ status: 'rejected', error: `Unknown op: ${op}` }) }], isError: true };
}

function handleRatifyResolveCondition({ state_file, element_id, ratification }) {
  let state = loadState(state_file);
  const [newState, err] = ratifyResolveCondition(state, { elementId: element_id, ratificationText: ratification });
  if (err) {
    return { content: [{ type: 'text', text: JSON.stringify({ status: 'rejected', error: err }) }], isError: true };
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
        ratification: target.ratification,
        closure_permitted: closure.permitted,
        closure_reasons: closure.reasons,
      }),
    }],
  };
}
```

Extend `handleInitialize` response (around `server.js:123-133`) to include `tools_added`:

```js
return {
  content: [{
    type: 'text',
    text: JSON.stringify({
      status: 'initialized',
      element_types: ELEMENT_TYPES,
      operations: ['add', 'revise', 'withdraw'],
      concerns: [],
      tools_added: ['manage_concerns', 'ratify_resolve_condition'],
      state_file,
    }),
  }],
};
```

Extend `handleGetProofState` response — include `concerns`, `concernsLocked`, `ratificationLog`, and `concernCoverage` when locked:

```js
function handleGetProofState({ state_file }) {
  const state = loadState(state_file);
  const integrityWarnings = checkAllIntegrity(state.elements);
  const completeness = {
    ...computeCompleteness(state.elements),
    groundingCoverage: computeGroundingCoverage(state.elements),
  };
  const challengeTrigger = detectChallenge(state);
  const closure = checkClosure(state);
  const response = {
    ...state,
    elements: Object.fromEntries(state.elements),
    integrity_warnings: integrityWarnings,
    completeness,
    challenge_trigger: challengeTrigger,
    closure_permitted: closure.permitted,
    closure_reasons: closure.reasons,
  };
  if (state.concernsLocked) {
    response.concernCoverage = checkConcernCoverage(state);
  }
  return { content: [{ type: 'text', text: JSON.stringify(response) }] };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd skills/design-large-task/proof-mcp && npm test -- --exclude="**/acceptance.test.js"`
Expected: full suite passes.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/server.js \
        skills/design-large-task/proof-mcp/__tests__/server.test.js
git commit -m "feat(proof-mcp): manage_concerns + ratify_resolve_condition MCP tools (singular schemas)"
```

---

## Task 9: Brief template — replace Acceptance Criteria with Concerns + Resolve Conditions

**Type:** docs-producing
**Implements:** AC-6.1, AC-6.2
**Decision budget:** 1 (section ordering — flat 8/9 vs 8a/8b — spec line 100 commits flat 8/9)
**Must remain green:** all prior tasks' tests

**Files:**
- Modify: `skills/design-large-task/references/design-brief-template.md:170-180` (replace Section 8 prose+code), `:186-193` (numbered list), `:195` (count prose)
- Test: `skills/design-large-task/proof-mcp/__tests__/acceptance.test.js` (fill `ac-6-1` and `ac-6-2`); the manifest's other AC stubs remain pending until Task 11

**Steps (TDD):**

- [ ] **Step 1: Write failing tests** (fill the two existing stubs in acceptance.test.js)

```js
// acceptance.test.js — replace the AC-6.1 and AC-6.2 it bodies
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve as resolvePath } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = resolvePath(__dirname, '../../references/design-brief-template.md');

describe('AC-6.1 Brief template includes Resolve Conditions section', () => {
  it('ac-6-1-brief-template-has-resolve-conditions', () => {
    const content = readFileSync(TEMPLATE_PATH, 'utf-8');
    expect(content).toMatch(/^### Resolve Conditions/m);
    // The deprecated Section 8 heading must NOT appear
    expect(content).not.toMatch(/^### Acceptance Criteria/m);
    expect(content).not.toMatch(/^## Acceptance Criteria/m);
  });
});

describe('AC-6.2 Brief template includes Concerns section', () => {
  it('ac-6-2-brief-template-has-concerns', () => {
    const content = readFileSync(TEMPLATE_PATH, 'utf-8');
    expect(content).toMatch(/^### Concerns/m);
    expect(content).toMatch(/CERN-/); // sample bullet format references CERN- ID
    expect(content).toMatch(/RCON-/); // resolve conditions section references RCON- ID
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd skills/design-large-task/proof-mcp && npm test -- acceptance.test.js`
Expected: AC-6.1 and AC-6.2 tests fail (template still has old "Acceptance Criteria" heading).

- [ ] **Step 3: Edit `design-brief-template.md`**

**Block 1 (lines 170-180):** replace the existing `### Acceptance Criteria (REQUIRED)` block with:

```markdown
### Concerns (REQUIRED)

PM-ratified enumeration of named aspects of the problem statement. Each Concern
has a stable ID and PM-readable label (and optional one-sentence description).
Concerns are locked at Solve Stage opening; the locked list anchors all subsequent
Resolve Condition coverage and the closure-coverage check.

```markdown
## Concerns

- **CERN-1 — {short label}**: {optional description}
- **CERN-2 — {short label}**
```

### Resolve Conditions (REQUIRED)

Designer-ratified observable outcomes that certify the design space's exit
condition. Each entry carries a `statement` (PM-readable observable), a
`problem_anchor` (Concern ID), and a `ratification` quote. Sequential
ratification: PM signs off on each entry individually. Revising a ratified
RC's statement or anchor invalidates the ratification automatically.

```markdown
## Resolve Conditions

- **RCON-1** — {observable outcome}. Anchored to CERN-1 ({label}). Ratification: "{PM quote}" (round {n}).
```
```

**Block 2 (lines 186-193):** replace the numbered list. Find:

```
1. Goal
2. Necessary Conditions
3. Rules
4. Permissions
5. Evidence
6. Industry Context
7. Risks
8. Acceptance Criteria
```

Replace with:

```
1. Goal
2. Necessary Conditions
3. Rules
4. Permissions
5. Evidence
6. Industry Context
7. Risks
8. Concerns
9. Resolve Conditions
```

**Block 3 (line 195):** replace `All eight sections are required` with `All nine sections are required`.

**Self-containment text scan:** if any inline text references "Acceptance Criteria" in the self-containment-test paragraph (search the file), update to "Resolve Conditions". The "Lightweight Alternative" reference at line 231 ("...Constraints, Acceptance Criteria) optimized for bounded-task briefs...") describes the *small* brief — leave that reference unchanged because design-small-task's six-section brief retains its own AC concept; the cluster-A change only touches the large brief template.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd skills/design-large-task/proof-mcp && npm test -- acceptance.test.js`
Expected: AC-6.1 and AC-6.2 pass.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/references/design-brief-template.md \
        skills/design-large-task/proof-mcp/__tests__/acceptance.test.js
git commit -m "docs(brief-template): replace Acceptance Criteria with Concerns + Resolve Conditions sections"
```

---

## Task 10: design-specify SKILL.md — section count + AC seeding paragraph

**Type:** docs-producing
**Implements:** AC-8.1
**Decision budget:** 1 (whether the seeding paragraph lives near line 147 or in a fresh subsection — spec line 111 says under Writing the Spec near 147)
**Must remain green:** all prior tasks' tests

**Files:**
- Modify: `skills/design-specify/SKILL.md:230` (Reads line); `skills/design-specify/SKILL.md` near line 147 (add seeding paragraph)
- Test: `skills/design-large-task/proof-mcp/__tests__/acceptance.test.js` (fill `ac-8-1` stub)

**Steps (TDD):**

- [ ] **Step 1: Write failing test** (fill the `ac-8-1` stub)

```js
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve as resolvePath } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SPECIFY_PATH = resolvePath(__dirname, '../../../design-specify/SKILL.md');

describe('AC-8.1 design-specify SKILL.md references new sections', () => {
  it('ac-8-1-specify-skill-references-new-sections', () => {
    const content = readFileSync(SPECIFY_PATH, 'utf-8');
    // Reads-line section count is now 9-section
    expect(content).toMatch(/9-section envelope/);
    expect(content).not.toMatch(/8-section envelope/);
    // Mentions Concerns and Resolve Conditions in the brief-reading context
    expect(content).toMatch(/Resolve Conditions/);
    expect(content).toMatch(/Concerns/);
    // Seeding paragraph references RCON- as the seed for AC-{N.M}
    expect(content).toMatch(/RCON-.*AC-/s);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd skills/design-large-task/proof-mcp && npm test -- acceptance.test.js`
Expected: AC-8.1 fails (8-section still present, RCON-/seeding text absent).

- [ ] **Step 3: Edit `skills/design-specify/SKILL.md`**

**Edit line 230:** find:

```
the upstream brief's source template: `../design-large-task/references/design-brief-template.md` (8-section envelope)
```

Replace with:

```
the upstream brief's source template: `../design-large-task/references/design-brief-template.md` (9-section envelope including Concerns and Resolve Conditions)
```

**Add a new paragraph under "## Writing the Spec".** Insert between the existing line 147 bullet and the existing scaffold-skeletons subsection (before `### Scaffold test skeletons (per acceptance criterion)` at line 152). New paragraph:

```markdown
**Brief → spec AC derivation.** Each `AC-{N.M}` block in the spec seeds from a `RCON-N` Resolve Condition statement in the brief's Resolve Conditions section. The brief's locked Concerns section seeds the spec's coverage rationale — every Concern should be covered by at least one acceptance criterion or by a constraint. The spec's `AC-{N.M}` numbering is independent of the brief's `RCON-N` numbering — RC statements provide the seed text, not a renumbering.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd skills/design-large-task/proof-mcp && npm test -- acceptance.test.js`
Expected: AC-8.1 passes.

- [ ] **Step 5: Commit**

```bash
git add skills/design-specify/SKILL.md \
        skills/design-large-task/proof-mcp/__tests__/acceptance.test.js
git commit -m "docs(design-specify): update brief-reading reference + add brief-to-spec AC seeding paragraph"
```

---

## Task 11: Concerns integration test + fill remaining acceptance stubs

**Type:** code-producing
**Implements:** all ACs end-to-end (AC-1.1 through AC-8.1)
**Decision budget:** 0 (each acceptance stub maps directly to an observable boundary already implemented in Tasks 1-10)
**Must remain green:** Tasks 1-10 tests

**Files:**
- Create: `skills/design-large-task/proof-mcp/__tests__/concerns.test.js`
- Modify: `skills/design-large-task/proof-mcp/__tests__/acceptance.test.js` (fill the remaining 22 pending stubs)

**Steps (TDD):**

- [ ] **Step 1: Write the integration test in concerns.test.js**

```js
import { describe, it, expect } from 'vitest';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  initializeState, applyOperations, addConcern, lockConcerns,
  ratifyResolveCondition, saveState, loadState,
} from '../state.js';
import { checkClosure } from '../metrics.js';

describe('Concerns lifecycle — full integration', () => {
  let tmp;
  beforeEach(() => { tmp = mkdtempSync(join(tmpdir(), 'concerns-')); });
  afterEach(() => { rmSync(tmp, { recursive: true, force: true }); });

  it('enumerate → lock → add RC → ratify → close', () => {
    let state = initializeState('How to ensure correctness?');
    [, state] = addConcern(state, { label: 'Correctness', description: 'system rejects invalid input' });
    [, state] = addConcern(state, { label: 'Performance' });
    [state] = lockConcerns(state);

    // Add ratified RC for Concern 1
    let result = applyOperations(state, [
      { op: 'add', type: 'EVIDENCE', statement: 'audit', source: 'codebase' },
      { op: 'add', type: 'NECESSARY_CONDITION', statement: 'must validate', grounding: ['EVID-1'], collapse_test: 'breaks', reasoning_chain: 'IF...THEN', rejected_alternatives: ['skip'] },
      { op: 'add', type: 'RESOLVE_CONDITION', statement: 'invalid input rejected', problem_anchor: 'CERN-1' },
    ]);
    expect(result.errors).toEqual([]);
    state = result.state;
    [state] = ratifyResolveCondition(state, { elementId: 'RCON-1', ratificationText: 'PM approves' });

    // Add Rule covering Concern 2
    result = applyOperations(state, [
      { op: 'add', type: 'RULE', statement: 'preserve performance baseline', source: 'designer' },
      { op: 'revise', target: 'NCON-1', statement: 'must validate inputs robustly' }, // post-transition revision
    ]);
    expect(result.errors).toEqual([]);
    state = result.state;
    state.phaseTransitionRound = 1;

    // Closure should now permit
    const closure = checkClosure(state);
    expect(closure.permitted).toBe(true);
    expect(closure.reasons).toEqual([]);
  });

  it('refuses to add Concern after lock; coverage refuses on uncovered Concern', () => {
    let state = initializeState('test');
    [, state] = addConcern(state, { label: 'A' });
    [, state] = addConcern(state, { label: 'B' });
    [state] = lockConcerns(state);
    const [id, sameState, err] = addConcern(state, { label: 'C' });
    expect(id).toBeNull();
    expect(err).toMatch(/locked/i);
    expect(sameState.concerns).toHaveLength(2);

    // No RC, no Rule — both Concerns uncovered
    state.phaseTransitionRound = 0;
    state.round = 3;
    const result = applyOperations(state, [
      { op: 'add', type: 'EVIDENCE', statement: 'fact', source: 'codebase' },
      { op: 'add', type: 'NECESSARY_CONDITION', statement: 'NC', grounding: ['EVID-1'], collapse_test: 'breaks', reasoning_chain: 'IF...THEN', rejected_alternatives: ['alt'] },
    ]);
    state = result.state;
    state.elements.get('NCON-1').revisedInRound = 2;
    const closure = checkClosure(state);
    expect(closure.permitted).toBe(false);
    expect(closure.reasons.some(r => /CERN-1/.test(r))).toBe(true);
    expect(closure.reasons.some(r => /CERN-2/.test(r))).toBe(true);
  });

  it('round-trips state with concerns + ratificationLog through saveState/loadState', () => {
    let state = initializeState('test');
    [, state] = addConcern(state, { label: 'X', description: 'd' });
    [state] = lockConcerns(state);
    const result = applyOperations(state, [
      { op: 'add', type: 'RESOLVE_CONDITION', statement: 's', problem_anchor: 'CERN-1' },
    ]);
    state = result.state;
    [state] = ratifyResolveCondition(state, { elementId: 'RCON-1', ratificationText: 'ok' });

    const path = join(tmp, 'state.json');
    saveState(state, path);
    const loaded = loadState(path);

    expect(loaded.concerns).toEqual(state.concerns);
    expect(loaded.concernsLocked).toBe(true);
    expect(loaded.ratificationLog).toHaveLength(1);
    expect(loaded.ratificationLog[0]).toMatchObject({ event: 'ratified', target: 'RCON-1' });
    expect(loaded.elements.get('RCON-1').ratification).toEqual({ ratifiedAtRound: 1, text: 'ok' });
  });
});
```

Add `import { beforeEach, afterEach } from 'vitest';` if not implicit.

- [ ] **Step 2: Fill the 22 remaining acceptance stubs in acceptance.test.js**

Replace each `throw new Error('pending: AC-X.Y — ...')` with the actual assertion logic. Each `it` body becomes a thin smoke test that imports the public function and asserts the observable boundary from the corresponding spec AC. This duplicates coverage with the per-module tests but provides one-call-per-AC verification for execute-write's trigger-check coverage diff.

Concrete fill pattern (one example — apply analogous bodies for the rest):

```js
// AC-1.1
import { ELEMENT_TYPES } from '../proof.js';
import { initializeState } from '../state.js';
describe('AC-1.1 RESOLVE_CONDITION element type registered', () => {
  it('ac-1-1-resolve-condition-registered', () => {
    expect(ELEMENT_TYPES).toContain('RESOLVE_CONDITION');
    expect(ELEMENT_TYPES[ELEMENT_TYPES.length - 1]).toBe('RESOLVE_CONDITION');
    const state = initializeState('test');
    expect(state.elementCounters.RESOLVE_CONDITION).toBe(0);
  });
});
```

For ACs with the same observable boundary as a per-module test (e.g. AC-2.1 mirrors `addConcern` describe), the acceptance stub can be a 2-3-line repeat of the simplest assertion. AC-4.2 calls into the server-text-inspection pattern from Task 8's tests. AC-6.1, 6.2, 8.1 are already filled in Tasks 9 and 10.

- [ ] **Step 3: Run all tests**

Run: `cd skills/design-large-task/proof-mcp && npm test`
Expected: full suite passes including the 24 acceptance stubs and the 3 concerns.test.js integration tests.

Run: `cd skills/design-large-task/proof-mcp && npm test -- --reporter=verbose`
Spot-check: confirm AC IDs appear as `it` names in the test output.

- [ ] **Step 4: Update skeleton manifest** — flip `pending` → `filled` for each AC in `docs/chester/working/20260430-02-rebuild-design-derivation/cluster-a-define-solve/spec/cluster-a-define-solve-spec-skeleton-00.md`. Single sed pass:

```bash
sed -i 's/| pending |/| filled  |/g' docs/chester/working/20260430-02-rebuild-design-derivation/cluster-a-define-solve/spec/cluster-a-define-solve-spec-skeleton-00.md
```

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/__tests__/concerns.test.js \
        skills/design-large-task/proof-mcp/__tests__/acceptance.test.js \
        docs/chester/working/20260430-02-rebuild-design-derivation/cluster-a-define-solve/spec/cluster-a-define-solve-spec-skeleton-00.md
git commit -m "test(proof-mcp): Concerns lifecycle integration + fill all acceptance stubs"
```
