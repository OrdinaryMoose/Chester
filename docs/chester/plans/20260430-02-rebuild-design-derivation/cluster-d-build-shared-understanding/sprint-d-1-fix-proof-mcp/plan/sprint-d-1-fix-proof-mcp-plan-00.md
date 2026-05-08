# Plan: Sprint D-1 Fix Proof MCP

**Sprint:** 20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp
**Spec:** `docs/chester/working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp/spec/sprint-d-1-fix-proof-mcp-spec-00.md`
**Execution mode:** subagent

> **For agentic workers:** Use execute-write to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The `Execution mode` field selects which execute-write section runs — Section 2 (subagent-driven) or Section 3 (inline). plan-build sets this field at handoff based on the Execution Mode Selection heuristic, with human confirm/override.

## Goal

Run the d.2 friction-report maintenance pass on the proof MCP module: collapse the proof lifecycle to a binary (`planning`/`finish`, no reopen), retire the structural challenge-mode personality machinery, add a `body_advancement` signal, gate `present_closing_argument` on a per-element first-yes precondition, cap `get_proof_state` response size via summary mode, verify universal-withdraw routing for Concerns, and apply the five mandatory correctness fixes the deletions force.

## Architecture

Hybrid (principled-merge from design-specify) — purpose-built modules for the two pieces of new logic where module separation earns its keep (`body-advancement.js`, `first-yes-gate.js`); rename-in-place of `clearClosingFlags` to `resetFirstYesIfFired` within `state.js`; conservative deletion discipline on every existing-module retirement; mandatory correctness fixes applied where the deletion forces them (`closing-argument.js`, `applyOperations`, `loadState`, `metrics.js`, `server.js:413`).

## Tech Stack

- **Runtime:** Node.js (ESM modules, `import { ... } from './x.js'`)
- **MCP harness:** `@modelcontextprotocol/sdk` (server.js wires StdioServerTransport)
- **Test harness:** vitest (`npm test` from `proof-mcp/`)
- **Module conventions:** pure-function modules with no I/O for `metrics.js`, `proof.js`, `open-gate.js`, `closing-argument.js`; new modules `body-advancement.js` and `first-yes-gate.js` follow the same shape
- **State persistence:** atomic write-tmp-then-rename via `saveState` in `state.js`; `structuredClone` + `cloneElements` defensive clone before every mutation
- **No new dependencies.** No `npm install`.

## File Layout

All paths relative to repo root (`/home/mike/Documents/CodeProjects/Chester/`).

**New files:**
- `skills/design-large-task/proof-mcp/body-advancement.js`
- `skills/design-large-task/proof-mcp/first-yes-gate.js`
- `skills/design-large-task/proof-mcp/__tests__/body-advancement.test.js`
- `skills/design-large-task/proof-mcp/__tests__/first-yes-gate.test.js`
- `skills/design-large-task/proof-mcp/__tests__/concern-withdraw-routing.test.js`
- `skills/design-large-task/proof-mcp/__tests__/get-proof-state-summary.test.js`
- `skills/design-large-task/proof-mcp/__tests__/mid-review-revision.test.js`
- `skills/design-large-task/proof-mcp/__tests__/first-yes-precondition.test.js`

**Modified files:**
- `skills/design-large-task/proof-mcp/state.js`
- `skills/design-large-task/proof-mcp/metrics.js`
- `skills/design-large-task/proof-mcp/server.js`
- `skills/design-large-task/proof-mcp/closing-argument.js`
- `skills/design-large-task/proof-mcp/__tests__/metrics.test.js`
- `skills/design-large-task/proof-mcp/__tests__/mutation-clears-flags.test.js`
- `skills/design-large-task/proof-mcp/__tests__/state.test.js`
- `skills/design-large-task/proof-mcp/__tests__/concerns.test.js`
- `skills/design-large-task/proof-mcp/__tests__/server.test.js`
- `skills/design-large-task/proof-mcp/__tests__/two-yes-flags.test.js`
- `skills/design-large-task/SKILL.md`

**Deleted files:**
- `skills/design-large-task/proof-mcp/__tests__/reopen.test.js`
- `skills/design-large-task/proof-mcp/__tests__/bulk-ratify.test.js`

---

## Task 1: Add `body-advancement.js` pure module

**Type:** code-producing
**Implements:** AC-3.1 (signal computation logic)
**Decision budget:** 1
**Must remain green:** `body-advancement.test.js` (created here)

**Files:**
- Create: `skills/design-large-task/proof-mcp/body-advancement.js`
- Create test: `skills/design-large-task/proof-mcp/__tests__/body-advancement.test.js`

**Module contract:**

```js
// body-advancement.js
// Compares pre-mutation snapshot against post-mutation state; counts adds,
// revises, withdrawals across all load-bearing element types plus Concerns
// and Definitions. Bookkeeping operations (ratification flips,
// friction-disposition flips) do NOT count as advancement.
//
// snapshot shape: { elements: Map<id, {type, status, revisedInRound}>,
//                   concerns: [{id, status}],
//                   definitions: [{id, status}] }

export function computeBodyAdvancement(prevSnapshot, currentState) {
  // returns { advanced, addCount, reviseCount, withdrawCount }
}
```

The signal is computed by diffing IDs and revision counters between the snapshot and the post-mutation state:
- `addCount` = (active IDs in current) − (active IDs in snapshot) for elements + concerns + definitions
- `withdrawCount` = (IDs in snapshot but withdrawn in current) for elements + concerns + definitions
- `reviseCount` = elements whose `revisedInRound` differs between snapshot and current
- `advanced` = `addCount + reviseCount + withdrawCount > 0`

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Create `skills/design-large-task/proof-mcp/__tests__/body-advancement.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { computeBodyAdvancement } from '../body-advancement.js';

function snap(elements = [], concerns = [], definitions = []) {
  return {
    elements: new Map(elements.map(e => [e.id, e])),
    concerns,
    definitions,
  };
}

describe('computeBodyAdvancement', () => {
  it('returns all-zero / advanced=false when nothing changed', () => {
    const before = snap([{ id: 'NCON-1', type: 'NECESSARY_CONDITION', status: 'active', revisedInRound: null }]);
    const after = { elements: new Map(before.elements), concerns: [], definitions: [] };
    expect(computeBodyAdvancement(before, after)).toEqual({
      advanced: false, addCount: 0, reviseCount: 0, withdrawCount: 0,
    });
  });

  it('counts an added NC', () => {
    const before = snap();
    const after = snap([{ id: 'NCON-1', type: 'NECESSARY_CONDITION', status: 'active', revisedInRound: null }]);
    const result = computeBodyAdvancement(before, after);
    expect(result.advanced).toBe(true);
    expect(result.addCount).toBe(1);
    expect(result.reviseCount).toBe(0);
    expect(result.withdrawCount).toBe(0);
  });

  it('counts an added Concern', () => {
    const before = { elements: new Map(), concerns: [], definitions: [] };
    const after = { elements: new Map(), concerns: [{ id: 'CERN-1', status: 'draft' }], definitions: [] };
    expect(computeBodyAdvancement(before, after).addCount).toBe(1);
  });

  it('counts an added Definition', () => {
    const before = { elements: new Map(), concerns: [], definitions: [] };
    const after = { elements: new Map(), concerns: [], definitions: [{ id: 'DEFN-1', status: 'draft' }] };
    expect(computeBodyAdvancement(before, after).addCount).toBe(1);
  });

  it('counts a revise via revisedInRound delta', () => {
    const before = snap([{ id: 'NCON-1', type: 'NECESSARY_CONDITION', status: 'active', revisedInRound: null }]);
    const after = snap([{ id: 'NCON-1', type: 'NECESSARY_CONDITION', status: 'active', revisedInRound: 3 }]);
    const result = computeBodyAdvancement(before, after);
    expect(result.reviseCount).toBe(1);
    expect(result.advanced).toBe(true);
  });

  it('counts a withdrawal of an element', () => {
    const before = snap([{ id: 'NCON-1', type: 'NECESSARY_CONDITION', status: 'active', revisedInRound: null }]);
    const after = snap([{ id: 'NCON-1', type: 'NECESSARY_CONDITION', status: 'withdrawn', revisedInRound: null }]);
    expect(computeBodyAdvancement(before, after).withdrawCount).toBe(1);
  });

  it('counts a withdrawal of a Concern', () => {
    const before = { elements: new Map(), concerns: [{ id: 'CERN-1', status: 'draft' }], definitions: [] };
    const after = { elements: new Map(), concerns: [{ id: 'CERN-1', status: 'withdrawn' }], definitions: [] };
    expect(computeBodyAdvancement(before, after).withdrawCount).toBe(1);
  });

  it('does NOT count ratification flips as advancement', () => {
    const before = snap([{ id: 'NCON-1', type: 'NECESSARY_CONDITION', status: 'active', revisedInRound: null, ratificationStatus: 'draft' }]);
    const after = snap([{ id: 'NCON-1', type: 'NECESSARY_CONDITION', status: 'active', revisedInRound: null, ratificationStatus: 'ratified' }]);
    expect(computeBodyAdvancement(before, after)).toEqual({
      advanced: false, addCount: 0, reviseCount: 0, withdrawCount: 0,
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run __tests__/body-advancement.test.js`
Expected: FAIL — `Failed to resolve import '../body-advancement.js'`

- [ ] **Step 3: Write minimal implementation**

Create `skills/design-large-task/proof-mcp/body-advancement.js`:

```js
/**
 * body-advancement.js — Pure-function module computing the body-advancement
 * signal between a pre-mutation snapshot and the post-mutation state.
 *
 * Counts adds, revises (revisedInRound delta), and withdrawals across all
 * load-bearing element types plus Concerns and Definitions. Bookkeeping
 * operations (ratification flips, friction-disposition flips) do NOT count.
 *
 * No I/O. No imports from state.js or server.js.
 */

function activeElementIds(elements) {
  const ids = new Set();
  for (const [id, el] of elements) {
    if (el.status === 'active') ids.add(id);
  }
  return ids;
}

function activeConcernIds(concerns) {
  const ids = new Set();
  for (const c of concerns || []) {
    if (c.status !== 'withdrawn') ids.add(c.id);
  }
  return ids;
}

function activeDefinitionIds(definitions) {
  const ids = new Set();
  for (const d of definitions || []) {
    if (d.status !== 'withdrawn') ids.add(d.id);
  }
  return ids;
}

export function computeBodyAdvancement(prevSnapshot, currentState) {
  const beforeEl = activeElementIds(prevSnapshot.elements);
  const afterEl = activeElementIds(currentState.elements);
  const beforeC = activeConcernIds(prevSnapshot.concerns);
  const afterC = activeConcernIds(currentState.concerns);
  const beforeD = activeDefinitionIds(prevSnapshot.definitions);
  const afterD = activeDefinitionIds(currentState.definitions);

  let addCount = 0;
  for (const id of afterEl) if (!beforeEl.has(id)) addCount++;
  for (const id of afterC) if (!beforeC.has(id)) addCount++;
  for (const id of afterD) if (!beforeD.has(id)) addCount++;

  let withdrawCount = 0;
  for (const id of beforeEl) if (!afterEl.has(id)) withdrawCount++;
  for (const id of beforeC) if (!afterC.has(id)) withdrawCount++;
  for (const id of beforeD) if (!afterD.has(id)) withdrawCount++;

  let reviseCount = 0;
  for (const [id, after] of currentState.elements) {
    const before = prevSnapshot.elements.get(id);
    if (!before) continue;
    if ((before.revisedInRound ?? null) !== (after.revisedInRound ?? null)) {
      reviseCount++;
    }
  }

  return {
    advanced: addCount + reviseCount + withdrawCount > 0,
    addCount,
    reviseCount,
    withdrawCount,
  };
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run __tests__/body-advancement.test.js`
Expected: PASS — all 7 cases.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/body-advancement.js \
        skills/design-large-task/proof-mcp/__tests__/body-advancement.test.js
git commit -m "feat(proof-mcp): body-advancement.js pure-function signal module (AC-3.1)"
```

---

## Task 2: Add `first-yes-gate.js` pure module

**Type:** code-producing
**Implements:** AC-4.1, AC-4.2 (gate logic)
**Decision budget:** 1
**Must remain green:** `first-yes-gate.test.js` (created here)

**Files:**
- Create: `skills/design-large-task/proof-mcp/first-yes-gate.js`
- Create test: `skills/design-large-task/proof-mcp/__tests__/first-yes-gate.test.js`

**Module contract:**

```js
// first-yes-gate.js
// Iterates active elements across the four affected lanes:
//   - NCs with ratificationStatus === 'draft'
//   - RCs with ratification === null
//   - Concerns with status === 'draft'
//   - Definitions with status === 'draft'
// Returns the aggregate gate result and the unratified ID list.

export function checkFirstYesGate(state) {
  // returns { passed: boolean, unratifiedIds: string[] }
}
```

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Create `skills/design-large-task/proof-mcp/__tests__/first-yes-gate.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { checkFirstYesGate } from '../first-yes-gate.js';

function makeState({ elements = [], concerns = [], definitions = [] } = {}) {
  return {
    elements: new Map(elements.map(e => [e.id, e])),
    concerns,
    definitions,
  };
}

describe('checkFirstYesGate', () => {
  it('passes on empty state', () => {
    expect(checkFirstYesGate(makeState())).toEqual({ passed: true, unratifiedIds: [] });
  });

  it('passes when every NC is ratified', () => {
    const state = makeState({
      elements: [
        { id: 'NCON-1', type: 'NECESSARY_CONDITION', status: 'active', ratificationStatus: 'ratified' },
      ],
    });
    expect(checkFirstYesGate(state).passed).toBe(true);
  });

  it('fails on draft NC and lists the id', () => {
    const state = makeState({
      elements: [
        { id: 'NCON-1', type: 'NECESSARY_CONDITION', status: 'active', ratificationStatus: 'draft' },
      ],
    });
    expect(checkFirstYesGate(state)).toEqual({ passed: false, unratifiedIds: ['NCON-1'] });
  });

  it('fails on RC with ratification === null', () => {
    const state = makeState({
      elements: [
        { id: 'RCON-1', type: 'RESOLVE_CONDITION', status: 'active', ratification: null },
      ],
    });
    expect(checkFirstYesGate(state).unratifiedIds).toEqual(['RCON-1']);
  });

  it('passes on RC with ratification set', () => {
    const state = makeState({
      elements: [
        { id: 'RCON-1', type: 'RESOLVE_CONDITION', status: 'active', ratification: { round: 2 } },
      ],
    });
    expect(checkFirstYesGate(state).passed).toBe(true);
  });

  it('fails on draft Concern', () => {
    const state = makeState({ concerns: [{ id: 'CERN-1', status: 'draft' }] });
    expect(checkFirstYesGate(state).unratifiedIds).toEqual(['CERN-1']);
  });

  it('fails on draft Definition', () => {
    const state = makeState({ definitions: [{ id: 'DEFN-1', status: 'draft' }] });
    expect(checkFirstYesGate(state).unratifiedIds).toEqual(['DEFN-1']);
  });

  it('skips withdrawn elements/concerns/definitions', () => {
    const state = makeState({
      elements: [
        { id: 'NCON-1', type: 'NECESSARY_CONDITION', status: 'withdrawn', ratificationStatus: 'draft' },
      ],
      concerns: [{ id: 'CERN-1', status: 'withdrawn' }],
      definitions: [{ id: 'DEFN-1', status: 'withdrawn' }],
    });
    expect(checkFirstYesGate(state).passed).toBe(true);
  });

  it('aggregates unratifiedIds across all lanes', () => {
    const state = makeState({
      elements: [
        { id: 'NCON-1', type: 'NECESSARY_CONDITION', status: 'active', ratificationStatus: 'draft' },
        { id: 'RCON-1', type: 'RESOLVE_CONDITION', status: 'active', ratification: null },
      ],
      concerns: [{ id: 'CERN-1', status: 'draft' }],
      definitions: [{ id: 'DEFN-1', status: 'draft' }],
    });
    const result = checkFirstYesGate(state);
    expect(result.passed).toBe(false);
    expect(new Set(result.unratifiedIds)).toEqual(new Set(['NCON-1', 'RCON-1', 'CERN-1', 'DEFN-1']));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run __tests__/first-yes-gate.test.js`
Expected: FAIL — `Failed to resolve import '../first-yes-gate.js'`

- [ ] **Step 3: Write minimal implementation**

Create `skills/design-large-task/proof-mcp/first-yes-gate.js`:

```js
/**
 * first-yes-gate.js — Pure-function module checking the per-element first-yes
 * precondition. present_closing_argument refuses if any active element is in
 * working state across the four affected lanes:
 *   - NCs with ratificationStatus === 'draft'
 *   - RCs with ratification === null
 *   - Concerns with status === 'draft'
 *   - Definitions with status === 'draft'
 *
 * No I/O.
 */

export function checkFirstYesGate(state) {
  const unratifiedIds = [];
  if (state.elements) {
    for (const [id, el] of state.elements) {
      if (el.status !== 'active') continue;
      if (el.type === 'NECESSARY_CONDITION' && el.ratificationStatus === 'draft') {
        unratifiedIds.push(id);
      } else if (el.type === 'RESOLVE_CONDITION' && (el.ratification ?? null) === null) {
        unratifiedIds.push(id);
      }
    }
  }
  for (const c of state.concerns || []) {
    if (c.status === 'draft') unratifiedIds.push(c.id);
  }
  for (const d of state.definitions || []) {
    if (d.status === 'draft') unratifiedIds.push(d.id);
  }
  return { passed: unratifiedIds.length === 0, unratifiedIds };
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run __tests__/first-yes-gate.test.js`
Expected: PASS — all 9 cases.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/first-yes-gate.js \
        skills/design-large-task/proof-mcp/__tests__/first-yes-gate.test.js
git commit -m "feat(proof-mcp): first-yes-gate.js pure-function precondition module (AC-4.1, AC-4.2)"
```

---

## Task 3: Rename `clearClosingFlags` → `resetFirstYesIfFired` and rewire 12 surviving inline reset sites

**Type:** code-producing
**Implements:** AC-4.4
**Decision budget:** 2
**Must remain green:** `mutation-clears-flags.test.js`, `two-yes-flags.test.js`, `state.test.js`

**Files:**
- Modify: `skills/design-large-task/proof-mcp/state.js` (rename function at lines 86-102; rewire 12 inline sites at 320-321, 394-395, 443-444, 511-512, 842-843, 904-905, 983-984, 1028-1029, 1094-1095, 1152-1153, 1203-1204, 1254-1255)
- Modify: `skills/design-large-task/proof-mcp/__tests__/mutation-clears-flags.test.js` (update import + every reference from `clearClosingFlags` to `resetFirstYesIfFired`)
- Modify: `skills/design-large-task/proof-mcp/__tests__/two-yes-flags.test.js` — **specifically:**
  - Line 2: change `import { initializeState, recordClosingArgPresented, recordDesignerGo, clearClosingFlags } from '../state.js';` to import `resetFirstYesIfFired` instead of `clearClosingFlags`
  - Line 44: change describe/it text containing `clearClosingFlags` to `resetFirstYesIfFired`
  - Line 48: change `const returned = clearClosingFlags(s);` to `const returned = resetFirstYesIfFired(s);`
  - Vocabulary `closed`→`finish` happens in Task 4 — leave that for now

**Important — sites that DISAPPEAR with their containing functions in later tasks:** the four inline reset pairs at `state.js:99-100` (clearClosingFlags body), `234-235` (reopenProof), `357-358` (lockConcerns), `729-730` (markChallengeUsed) are NOT rewired here. Those entire functions get deleted by Tasks 10, 11, and 12. Leave their inline pairs untouched in this task.

**Important — variable name variant:** `manageFriction` at `state.js:842-843` clones via `generateId(state, 'FRICTION')` returning a `withId` variable. Call `resetFirstYesIfFired(withId)` at that site. Other sites use `newState` or `current` — match the local clone variable name.

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Edit `skills/design-large-task/proof-mcp/__tests__/mutation-clears-flags.test.js`. Find the import line at the top and the test cases that reference `clearClosingFlags`. Replace every occurrence of `clearClosingFlags` with `resetFirstYesIfFired` in this file. Save.

Also append (or update an existing case) one assertion that verifies the new name is exported with the expected behavior:

```js
import { resetFirstYesIfFired } from '../state.js';

describe('resetFirstYesIfFired', () => {
  it('clears both two-yes flags on a passed state', () => {
    const s = { closingArgPresentedRound: 5, closingArgGoRound: 5 };
    resetFirstYesIfFired(s);
    expect(s.closingArgPresentedRound).toBeNull();
    expect(s.closingArgGoRound).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run __tests__/mutation-clears-flags.test.js`
Expected: FAIL — `clearClosingFlags is not a function` or `resetFirstYesIfFired is not exported`.

- [ ] **Step 3: Apply the rename + rewire**

Edit `skills/design-large-task/proof-mcp/state.js`:

(a) **Rename function declaration at line 98.** Replace the function name only; leave the doc comment header intact (the doc comment text stays correct under either name):

```js
// Was: export function clearClosingFlags(state) {
export function resetFirstYesIfFired(state) {
  state.closingArgPresentedRound = null;
  state.closingArgGoRound = null;
  return state;
}
```

(b) **Rewire 12 surviving inline reset pairs.** At each line range below, replace the two-line inline pattern

```js
newState.closingArgPresentedRound = null;
newState.closingArgGoRound = null;
```

with a single call to the helper, using the local clone variable name shown:

| File:Line range | Function | Local clone var | Replacement |
|-----------------|----------|-----------------|-------------|
| `state.js:320-321` | addConcern | `newState` | `resetFirstYesIfFired(newState);` |
| `state.js:394-395` | ratifyConcern | `newState` | `resetFirstYesIfFired(newState);` |
| `state.js:443-444` | ratifyResolveCondition | `newState` | `resetFirstYesIfFired(newState);` |
| `state.js:511-512` | applyOperations | `current` | `resetFirstYesIfFired(current);` |
| `state.js:842-843` | manageFriction | `withId` | `resetFirstYesIfFired(withId);` |
| `state.js:904-905` | overrideFrictionDisposition | `newState` | `resetFirstYesIfFired(newState);` |
| `state.js:983-984` | manageDefinitions op:add | `newState` | `resetFirstYesIfFired(newState);` |
| `state.js:1028-1029` | manageDefinitions op:revise | `newState` | `resetFirstYesIfFired(newState);` |
| `state.js:1094-1095` | manageDefinitions op:ratify | `newState` | `resetFirstYesIfFired(newState);` |
| `state.js:1152-1153` | withdrawElement | `newState` | `resetFirstYesIfFired(newState);` |
| `state.js:1203-1204` | withdrawConcern | `newState` | `resetFirstYesIfFired(newState);` |
| `state.js:1254-1255` | withdrawDefinition | `newState` | `resetFirstYesIfFired(newState);` |

After each edit, re-read the file region to confirm the local clone variable name matched what the surrounding function actually uses. (The `withId` variant is the only outlier.)

(c) **Update any internal cross-references in `state.js`** if `clearClosingFlags` is referenced elsewhere in the file (search for `clearClosingFlags` after edits — every remaining occurrence in `state.js` should be inside the body of the renamed function only).

- [ ] **Step 4: Run the full state-related test suite**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run __tests__/mutation-clears-flags.test.js __tests__/two-yes-flags.test.js __tests__/state.test.js`
Expected: PASS — `resetFirstYesIfFired` test passes, mutation-clears-flags tests pass against the renamed function, two-yes-flags tests pass.

Run the full suite to catch any other test that referenced `clearClosingFlags`:
`cd skills/design-large-task/proof-mcp && npx vitest run`
Expected: PASS or any failures unrelated to this rename. If any test fails because it imported `clearClosingFlags`, update that import to `resetFirstYesIfFired` in the same task.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/state.js \
        skills/design-large-task/proof-mcp/__tests__/mutation-clears-flags.test.js \
        skills/design-large-task/proof-mcp/__tests__/two-yes-flags.test.js
git commit -m "refactor(proof-mcp): rename clearClosingFlags → resetFirstYesIfFired; rewire 12 inline sites (AC-4.4)"
```

---

## Task 4: Lifecycle vocabulary — `planning`/`finish` + `loadState` backfill

**Type:** code-producing
**Implements:** AC-1.1, AC-1.2
**Decision budget:** 2
**Must remain green:** `state.test.js`, `loadstate-backfill.test.js`, `two-yes-flags.test.js`, `eleventh-closure-condition.test.js`, `acceptance.test.js`, `closing-argument-end-to-end.test.js`

**Files:**
- Modify: `skills/design-large-task/proof-mcp/state.js`
  - `initializeState` at line 56: change `proofStatus: 'unopen'` to `proofStatus: 'planning'`
  - `recordDesignerGo` (around `state.js:160-180`): change the closure status assignment from `'closed'` to `'finish'` (find the `newState.proofStatus = 'closed'` line and change to `'finish'`)
  - `loadState` (around `state.js:793`): change default backfill from `'unopen'` to `'planning'`; add legacy mapping
- Modify: `skills/design-large-task/proof-mcp/server.js` — covers BOTH response-payload constructors AND state-mutation sites (per AC-1.1: no code path writes any value other than `'planning'` or `'finish'`):
  - Every literal `proofStatus: 'open'` → `'planning'` and every `proofStatus: 'closed'` → `'finish'` in response payload constructors (use `grep -n "proofStatus: '" server.js`)
  - **Line 829: change `state.proofStatus = 'open';` → `state.proofStatus = 'planning';`** (in `handleOpenProof` after seed-elements applied)
  - **Line 865: change `state.proofStatus = 'open';` → `state.proofStatus = 'planning';`** (`handleOpenProof` reassertion after `applyOperations`/`addConcern` clones)
  - **Line 760: change `existingState.proofStatus === 'open'` → `existingState.proofStatus === 'planning'`** (already-open guard in `handleOpenProof`)
  - **Line 639: in `persistRejectedOpen`, replace any `state.proofStatus === 'open' || state.proofStatus === 'closed'` clause with `state.proofStatus === 'planning' || state.proofStatus === 'finish'`** (search the function for the exact predicate)
  - Run `grep -n "'open'\|'closed'" server.js` after edits — every remaining match should be inside a comment, or unrelated to `proofStatus` (e.g. an integrity-check string)
- Modify: `skills/design-large-task/proof-mcp/__tests__/state.test.js`
- Modify: `skills/design-large-task/proof-mcp/__tests__/two-yes-flags.test.js`
- Modify: `skills/design-large-task/proof-mcp/__tests__/loadstate-backfill.test.js` (update three pre-existing assertions + add legacy-value cases — see Step 1)
- Modify: `skills/design-large-task/proof-mcp/__tests__/closing-argument-end-to-end.test.js` — **line 37: change `expect(s.proofStatus).toBe('closed');` → `expect(s.proofStatus).toBe('finish');`**
- Modify: `skills/design-large-task/proof-mcp/__tests__/server.test.js` — **line 185: change `expect(written.proofStatus).toBe('open');` → `expect(written.proofStatus).toBe('planning');`** (and any sibling assertions reading the on-disk file's proofStatus)

**Note on scope of this task:** lifecycle VOCABULARY only. The `concernsLocked`, `lastClosureArtifact`, history-array, challenge-mode field removals from `initializeState` happen in Tasks 10/11/12. This task changes value strings only.

**Steps (TDD):**

- [ ] **Step 1: Write the failing tests**

Edit `skills/design-large-task/proof-mcp/__tests__/state.test.js`. Find tests that assert `proofStatus: 'unopen'` after `initializeState`. Update each to expect `'planning'`. Find tests that assert `proofStatus: 'closed'` after `recordDesignerGo`. Update each to expect `'finish'`. Save.

Edit `skills/design-large-task/proof-mcp/__tests__/loadstate-backfill.test.js`. Two changes:

(a) **Update the three pre-existing assertions that contradict the new mapping** (the old behavior must move to the new behavior):
- Line 48: change `expect(loaded.proofStatus).toBe('unopen');` → `expect(loaded.proofStatus).toBe('planning');`
- Line 62: change `expect(loaded.proofStatus).toBe('open');` → `expect(loaded.proofStatus).toBe('planning');` (the `'open'` legacy value now backfills to `'planning'`)
- Line 68: change `expect(state.proofStatus).toBe('unopen');` → `expect(state.proofStatus).toBe('planning');`

Optionally update the surrounding test descriptions to reflect the new vocabulary (`"backfills proofStatus to 'planning' when missing"`, etc.) — keeping them accurate avoids reader confusion later.

(b) **Append three new describe-block cases for the legacy-value backfill mapping.** ESM-only — no `require`:

```js
import { writeFileSync as writeFs, mkdtempSync as mkdtempFs } from 'fs';
import { tmpdir as tmpdirOs } from 'os';
import { join as joinPath } from 'path';

describe('loadState legacy proofStatus backfill (sprint-d-1-fix)', () => {
  function writeStateFileWith(proofStatusValue) {
    const dir = mkdtempFs(joinPath(tmpdirOs(), 'proof-mcp-legacy-'));
    const file = joinPath(dir, 'state.json');
    const base = initializeState('test');
    // initializeState returns a state whose `elements` is a Map; saveState
    // serializes Maps via Object.fromEntries. We bypass saveState here and
    // serialize a plain JSON shape so we can override proofStatus precisely.
    const raw = {
      ...base,
      elements: {},
      proofStatus: proofStatusValue,
    };
    writeFs(file, JSON.stringify(raw));
    return file;
  }

  it("maps proofStatus 'open' → 'planning'", () => {
    const file = writeStateFileWith('open');
    expect(loadState(file).proofStatus).toBe('planning');
  });

  it("maps proofStatus 'closed' → 'finish'", () => {
    const file = writeStateFileWith('closed');
    expect(loadState(file).proofStatus).toBe('finish');
  });

  it("maps proofStatus 'unopen' → 'planning'", () => {
    const file = writeStateFileWith('unopen');
    expect(loadState(file).proofStatus).toBe('planning');
  });
});
```

The aliased imports (`writeFs`, `mkdtempFs`, `tmpdirOs`, `joinPath`) avoid colliding with the existing top-of-file imports for `writeFileSync`, `mkdtempSync`, `tmpdir`, `join`. If those names are already bound in the file, you can also just reuse them — verify by reading the import header before adding.

Edit `skills/design-large-task/proof-mcp/__tests__/two-yes-flags.test.js`. Replace any fixture string `'closed'` (in `proofStatus` context) with `'finish'`. Save.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run __tests__/state.test.js __tests__/loadstate-backfill.test.js __tests__/two-yes-flags.test.js`
Expected: FAIL — assertions still see old values.

- [ ] **Step 3: Apply state.js + server.js changes**

In `skills/design-large-task/proof-mcp/state.js`:

(a) Line 56: `proofStatus: 'unopen',` → `proofStatus: 'planning',`

(b) `recordDesignerGo` body: change `newState.proofStatus = 'closed';` (or whichever literal sets the closure status) to `newState.proofStatus = 'finish';`. Search the file for `'closed'` to find the exact line.

(c) `loadState` around line 793: replace

```js
raw.proofStatus ??= 'unopen';
```

with

```js
raw.proofStatus ??= 'planning';
if (raw.proofStatus === 'open' || raw.proofStatus === 'unopen') {
  raw.proofStatus = 'planning';
} else if (raw.proofStatus === 'closed') {
  raw.proofStatus = 'finish';
}
```

In `skills/design-large-task/proof-mcp/server.js`:

Search the file for `proofStatus: 'open'` and `proofStatus: 'closed'` literals in response payload constructors. Replace each `'open'` with `'planning'` and each `'closed'` with `'finish'`. (Use grep first to enumerate sites: `grep -n "proofStatus: '" server.js`.)

- [ ] **Step 4: Run tests to verify pass**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run`
Expected: PASS for the modified tests. Tests covering retired surfaces (reopen, bulk-ratify, lock) are still green at this point — they're deleted in later tasks. Any pre-existing test that asserted the old `'closed'`/`'unopen'` literals must be updated in this task; treat any failure of that shape as part of this task.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/state.js \
        skills/design-large-task/proof-mcp/server.js \
        skills/design-large-task/proof-mcp/__tests__/state.test.js \
        skills/design-large-task/proof-mcp/__tests__/loadstate-backfill.test.js \
        skills/design-large-task/proof-mcp/__tests__/two-yes-flags.test.js
git commit -m "feat(proof-mcp): lifecycle vocabulary planning/finish + loadState legacy backfill (AC-1.1, AC-1.2)"
```

---

## Task 5: Wire body-advancement into `applyOperations`; clean up `submit_proof_update` response

**Type:** code-producing
**Implements:** AC-3.1, AC-3.2 (partial — response shape), AC-6.2
**Decision budget:** 2
**Must remain green:** `body-advancement.test.js`, `server.test.js`, `state.test.js`, `acceptance.test.js`

**Files:**
- Modify: `skills/design-large-task/proof-mcp/state.js`
  - `applyOperations` (around line 491): import `computeBodyAdvancement`; capture pre-mutation snapshot; remove `conditionCountHistory.push(...)` and `elementCountHistory.push(...)` calls; remove `challengeTrigger` and `stallDetected` from return shape (both the success path and the consent-failure early-return at lines 503-504); add `bodyAdvancement` to return shape
- Modify: `skills/design-large-task/proof-mcp/server.js`
  - `handleSubmitProofUpdate`: drop `challenge_used` parameter handling; drop `challenge_trigger` and `stall_detected` from the response payload; add `body_advancement` (sourced from `bodyAdvancement` on `applyOperations` return)
  - `submit_proof_update` tool schema: remove the `challenge_used` parameter property
- Modify: `skills/design-large-task/proof-mcp/__tests__/server.test.js` — update assertions for the new response shape

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Edit `skills/design-large-task/proof-mcp/__tests__/server.test.js`. Find the existing `submit_proof_update` test cases. Add a new case asserting the response shape:

```js
it('submit_proof_update response carries body_advancement and omits retired fields', async () => {
  // ... arrange a state file with one prior round ...
  const response = await callTool('submit_proof_update', {
    state_file: stateFile,
    operations: [{ op: 'add', type: 'NECESSARY_CONDITION', statement: 'X', grounding: ['EVID-1'] }],
    consent: { source: 'designer-question' },
  });
  const payload = JSON.parse(response.content[0].text);
  expect(payload.body_advancement).toBeDefined();
  expect(payload.body_advancement).toMatchObject({
    advanced: expect.any(Boolean),
    addCount: expect.any(Number),
    reviseCount: expect.any(Number),
    withdrawCount: expect.any(Number),
  });
  expect(payload.body_advancement.advanced).toBe(true);
  expect(payload.body_advancement.addCount).toBe(1);
  expect(payload).not.toHaveProperty('challenge_trigger');
  expect(payload).not.toHaveProperty('stall_detected');
});
```

Also update existing tests that asserted `challenge_trigger` or `stall_detected` in the response — remove those expectations (they will be retired). Look for `expect(payload.challenge_trigger)` and `expect(payload.stall_detected)` patterns and remove or invert them.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run __tests__/server.test.js`
Expected: FAIL — `body_advancement` not in payload.

- [ ] **Step 3: Apply state.js + server.js changes**

In `skills/design-large-task/proof-mcp/state.js`:

(a) Add to imports at top of file (alongside the existing `import { computeCompleteness, ...} from './metrics.js';`):

```js
import { computeBodyAdvancement } from './body-advancement.js';
```

(b) `applyOperations` consent-failure early-return (around lines 495-507): remove these two lines:

```js
challengeTrigger: null,
stallDetected: false,
```

and add (in the same return object):

```js
bodyAdvancement: null,
```

(c) `applyOperations` main path: capture the snapshot **immediately after the `current` clone but BEFORE the `resetFirstYesIfFired(current)` call** (Task 3 placed that helper call at the line range 511-512 where the inline two-line flag-clear used to be). Order matters — snapshot first, helper second, so the snapshot represents the true pre-mutation state including any flag values:

```js
let current = structuredClone(state);
current.elements = cloneElements(state.elements);
const snapshot = {                                       // ← NEW (Task 5)
  elements: cloneElements(state.elements),
  concerns: structuredClone(state.concerns || []),
  definitions: structuredClone(state.definitions || []),
};
resetFirstYesIfFired(current);                            // ← from Task 3
current.round++;
```

(d) Find and remove the lines that push to `conditionCountHistory` and `elementCountHistory`. Use grep: `grep -n "conditionCountHistory\|elementCountHistory" state.js`. Remove the `.push(...)` lines inside `applyOperations`.

(e) At the end of `applyOperations`, before the return, compute body advancement:

```js
const bodyAdvancement = computeBodyAdvancement(snapshot, current);
```

Add `bodyAdvancement` to the return object. Remove `challengeTrigger` and `stallDetected` from the return object (replace with `bodyAdvancement`).

In `skills/design-large-task/proof-mcp/server.js`:

(a) `submit_proof_update` tool schema: find and delete the `challenge_used` property in the `inputSchema.properties` block.

(b) `handleSubmitProofUpdate`: remove the destructured `challenge_used` parameter and any code block that handles it (search for `challenge_used` in the file). Update the response payload constructor to drop `challenge_trigger` and `stall_detected` and add:

```js
body_advancement: result.bodyAdvancement,
```

(where `result` is the `applyOperations` return value).

- [ ] **Step 4: Run tests to verify pass**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run`
Expected: PASS for `server.test.js`, `state.test.js`, `body-advancement.test.js`, `acceptance.test.js`. AC-6.2's "no crash on retired history fields" is implicitly covered: a fresh state initialized in Task 4's vocabulary has `conditionCountHistory: []` and `elementCountHistory: []` still present (those fields are removed in Task 12); the `.push` calls are gone, so the path is safe regardless.

If any test still references `markChallengeUsed`-related triggering, that test stays green until Task 12.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/state.js \
        skills/design-large-task/proof-mcp/server.js \
        skills/design-large-task/proof-mcp/__tests__/server.test.js
git commit -m "feat(proof-mcp): wire body_advancement; drop challenge_used/challenge_trigger/stall_detected (AC-3.1, AC-6.2)"
```

---

## Task 6: First-yes precondition in `present_closing_argument`

**Type:** code-producing
**Implements:** AC-4.1, AC-4.2
**Decision budget:** 1
**Must remain green:** `first-yes-gate.test.js`, `first-yes-precondition.test.js`, `closing-argument-end-to-end.test.js`, `server.test.js`

**Files:**
- Modify: `skills/design-large-task/proof-mcp/server.js`
  - Add `import { checkFirstYesGate } from './first-yes-gate.js';`
  - `handlePresentClosingArgument`: replace the existing `concernsRatificationGate(state)` call (and its CONCERNS_UNLOCKED / CONCERNS_UNRATIFIED branches) with a `checkFirstYesGate(state)` call. On gate failure, return `{ code: 'FIRST_YES_GATE_FAILED', unratified_ids: [...], message: ... }` with `isError: true`. State unchanged.
- Create test: `skills/design-large-task/proof-mcp/__tests__/first-yes-precondition.test.js`

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Create `skills/design-large-task/proof-mcp/__tests__/first-yes-precondition.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { initializeState, saveState, applyOperations, addConcern } from '../state.js';

// Import the server-internal handler. If the handler is not exported, route
// through the test scaffold the rest of server.test.js uses.
import { handlePresentClosingArgument } from '../server.js'; // adjust if helper-export shape differs

function freshStateFile() {
  const dir = mkdtempSync(join(tmpdir(), 'first-yes-'));
  const file = join(dir, 'state.json');
  const s = initializeState('test problem');
  saveState(s, file);
  return file;
}

describe('first-yes precondition on present_closing_argument', () => {
  it('refuses when a draft Concern exists', async () => {
    const file = freshStateFile();
    // add a concern (default status: draft)
    let state = (await import('../state.js')).loadState(file);
    const [, newState] = addConcern(state, { label: 'C1' }, { source: 'designer-question' });
    saveState(newState, file);

    const result = await handlePresentClosingArgument({ state_file: file, consent: { source: 'designer-question' } });
    const payload = JSON.parse(result.content[0].text);
    expect(result.isError).toBe(true);
    expect(payload.code).toBe('FIRST_YES_GATE_FAILED');
    expect(payload.unratified_ids).toContain(newState.concerns[0].id);
  });

  it('passes when every element is ratified', async () => {
    // ... build a state with one ratified NC + one ratified Concern + ratified RC ...
    // call handlePresentClosingArgument
    // assert: no isError; payload includes a closing-argument envelope
  });
});
```

If `handlePresentClosingArgument` is not exported from `server.js`, follow the existing pattern in `server.test.js` for invoking server handlers (it currently uses an in-process call shape). Match that shape.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run __tests__/first-yes-precondition.test.js`
Expected: FAIL — current handler still uses `concernsRatificationGate` and either passes when it shouldn't (no draft check across NCs/RCs/Definitions) or returns a different code.

- [ ] **Step 3: Apply server.js change**

In `skills/design-large-task/proof-mcp/server.js`:

(a) Add to imports near the top:

```js
import { checkFirstYesGate } from './first-yes-gate.js';
```

(b) `handlePresentClosingArgument`: find the existing `concernsRatificationGate(state)` invocation. Replace the gate block with:

```js
const gate = checkFirstYesGate(state);
if (!gate.passed) {
  return {
    content: [{ type: 'text', text: JSON.stringify({
      code: 'FIRST_YES_GATE_FAILED',
      unratified_ids: gate.unratifiedIds,
      message: 'Closing argument cannot be presented while elements are in working state',
    }) }],
    isError: true,
  };
}
```

Leave the post-gate derivation logic (`deriveClosingArgument`, `recordClosingArgPresented`, `saveState`) unchanged.

Remove the now-unused `concernsRatificationGate` from the `metrics.js` import line in `server.js` ONLY IF it's no longer used elsewhere in server.js after this change. (The function still lives in `metrics.js` until Task 11 simplifies it.)

**Required test-file edits (in addition to the new file):**

- `skills/design-large-task/proof-mcp/__tests__/server.test.js` — **delete the entire `describe('handlePresentClosingArgument — concernsRatificationGate (NC-9)', ...)` block at approximately lines 448-492.** Every case asserts `payload.code === 'CONCERNS_UNLOCKED'` or `'CONCERNS_UNRATIFIED'` — codes retired by this task. Replace coverage with first-yes-precondition cases (the new test file already covers the gate-failure path; add at least one passing-gate case here if `server.test.js` previously exercised the success path).

- `skills/design-large-task/proof-mcp/__tests__/closing-argument-end-to-end.test.js` — review fixtures: any test that used to call `lockConcerns` or relied on draft elements passing the old gate must be updated to ratify all elements (NCs, RCs, Concerns, Definitions) before invoking `present_closing_argument`. The `lockConcerns` import + calls themselves are removed in Task 11.

- [ ] **Step 4: Run tests to verify pass**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run`
Expected: PASS for `first-yes-precondition.test.js`, `first-yes-gate.test.js`. The deleted `concernsRatificationGate (NC-9)` describe block must be gone. Closing-argument fixtures updated where needed.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/server.js \
        skills/design-large-task/proof-mcp/__tests__/first-yes-precondition.test.js \
        skills/design-large-task/proof-mcp/__tests__/server.test.js \
        skills/design-large-task/proof-mcp/__tests__/closing-argument-end-to-end.test.js
git commit -m "feat(proof-mcp): first-yes precondition on present_closing_argument; FIRST_YES_GATE_FAILED (AC-4.1, AC-4.2)"
```

---

## Task 7: Mid-review revision end-to-end test

**Type:** code-producing
**Implements:** AC-4.3
**Decision budget:** 2
**Must remain green:** `mid-review-revision.test.js`, `two-yes-flags.test.js`, `eleventh-closure-condition.test.js`

**Files:**
- Create test: `skills/design-large-task/proof-mcp/__tests__/mid-review-revision.test.js`

**Steps (TDD):**

- [ ] **Step 1: Write the test**

Create `skills/design-large-task/proof-mcp/__tests__/mid-review-revision.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  initializeState, saveState, loadState,
  recordClosingArgPresented, recordDesignerGo,
  applyOperations, addConcern, ratifyConcern, manageDefinitions,
  manageFriction, overrideFrictionDisposition,
  ratifyResolveCondition, withdrawElement, withdrawConcern, withdrawDefinition,
} from '../state.js';

function freshStateFile() {
  const dir = mkdtempSync(join(tmpdir(), 'mid-review-'));
  const file = join(dir, 'state.json');
  const s = initializeState('test');
  saveState(s, file);
  return file;
}

const consent = { source: 'designer-question' };

describe('mid-review revision flag reset (AC-4.3)', () => {
  function withFlagsSet() {
    // Build a state with closingArgPresentedRound and closingArgGoRound both
    // set to the current round, simulating a successful presentation followed
    // by a designer first-yes.
    const s = initializeState('p');
    s.round = 5;
    s.closingArgPresentedRound = 5;
    s.closingArgGoRound = 5;
    return s;
  }

  it('addConcern resets both flags', () => {
    const before = withFlagsSet();
    const [, after] = addConcern(before, { label: 'C1' }, consent);
    expect(after.closingArgPresentedRound).toBeNull();
    expect(after.closingArgGoRound).toBeNull();
  });

  it('applyOperations resets both flags', () => {
    const before = withFlagsSet();
    const result = applyOperations(before, [{ op: 'add', type: 'EVIDENCE', statement: 'E', source: 'codebase' }], consent);
    expect(result.state.closingArgPresentedRound).toBeNull();
    expect(result.state.closingArgGoRound).toBeNull();
  });

  // Same shape for: ratifyConcern, ratifyResolveCondition, manageFriction,
  // overrideFrictionDisposition, manageDefinitions (add/revise/ratify),
  // withdrawElement, withdrawConcern, withdrawDefinition.
  // Each test sets up a minimal state where the operation can succeed and
  // asserts both flags are null afterward.
});
```

Cover every mutating function listed in the spec's AC-4.3:
`submit_proof_update` (via `applyOperations`), `manage_concerns add/ratify`, `manage_definitions`, `manage_friction`, `override_friction_disposition`, `ratify_resolve_condition`, `withdraw` (via `withdrawElement` / `withdrawConcern` / `withdrawDefinition`).

- [ ] **Step 2: Run test to verify it passes immediately**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run __tests__/mid-review-revision.test.js`
Expected: PASS — the rewiring from Task 3 plus the existing `recordClosingArgPresented`/`recordDesignerGo` discipline already produces this behavior.

This is a verification-only task. The test exists to lock the invariant against future regressions, especially around the deletions in Tasks 10-13. If any case fails, the failure is a real bug in Task 3's rewiring (a missed inline site or a wrong clone-variable name); fix it in this task.

- [ ] **Step 3: (skipped — no impl change)**
- [ ] **Step 4: Run full suite**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/__tests__/mid-review-revision.test.js
git commit -m "test(proof-mcp): mid-review revision resets first-yes flags across every mutating function (AC-4.3)"
```

---

## Task 8: Correctness fixes for `closing-argument.js:27` and `server.js:413`

**Type:** code-producing
**Implements:** AC-6.1, AC-6.2
**Decision budget:** 1
**Must remain green:** `closing-argument.test.js`, `closing-argument-end-to-end.test.js`, `server.test.js`

**Files:**
- Modify: `skills/design-large-task/proof-mcp/closing-argument.js` (line 27 partition gate)
- Modify: `skills/design-large-task/proof-mcp/server.js` (line ~413 `concernCoverage` gate)
- Modify: `skills/design-large-task/proof-mcp/__tests__/closing-argument.test.js`

**Why these fixes precede `concernsLocked` field removal (Task 11):** under the new model, the partition predicate must be `proofStatus === 'finish'` (closing-argument) or `state.concerns && state.concerns.length > 0` (server.js coverage gate). Applying the predicate change here means Task 11 can delete the field without leaving silent-zero reads behind.

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Edit `skills/design-large-task/proof-mcp/__tests__/closing-argument.test.js`. Add:

```js
describe('lockedConcerns partition uses proofStatus (AC-6.1)', () => {
  it('lockedConcerns is empty during planning', () => {
    const state = makeStateWithConcerns({ proofStatus: 'planning', concerns: [{ id: 'CERN-1', status: 'ratified' }] });
    const env = deriveClosingArgument(state);
    expect(env.lockedConcerns).toEqual([]);
  });

  it('lockedConcerns carries every active Concern at finish', () => {
    const state = makeStateWithConcerns({ proofStatus: 'finish', concerns: [{ id: 'CERN-1', status: 'ratified' }] });
    const env = deriveClosingArgument(state);
    expect(env.lockedConcerns.length).toBe(1);
  });
});
```

`makeStateWithConcerns` is the existing test helper in this file or a small one defined inline; align with whatever shape the file uses.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run __tests__/closing-argument.test.js`
Expected: FAIL — the second assertion fails because `state.concernsLocked` is undefined on this fixture (and the existing predicate is `state.concernsLocked`, not the new `state.proofStatus === 'finish'`).

- [ ] **Step 3: Apply correctness fixes**

In `skills/design-large-task/proof-mcp/closing-argument.js` line 27: change `state.concernsLocked` to `state.proofStatus === 'finish'`. (Inspect the file; the read is in the `lockedConcerns` partition computation. Replace the predicate inline.)

In `skills/design-large-task/proof-mcp/server.js` around line 413: change

```js
if (state.concernsLocked) {
  response.concernCoverage = checkConcernCoverage(state);
}
```

to

```js
if (state.concerns && state.concerns.length > 0) {
  response.concernCoverage = checkConcernCoverage(state);
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/closing-argument.js \
        skills/design-large-task/proof-mcp/server.js \
        skills/design-large-task/proof-mcp/__tests__/closing-argument.test.js
git commit -m "fix(proof-mcp): correctness predicates for lockedConcerns/concernCoverage (AC-6.1)"
```

---

## Task 9: `summary_mode` flag for `get_proof_state`

**Type:** code-producing
**Implements:** AC-5.2
**Decision budget:** 2
**Must remain green:** `get-proof-state-summary.test.js`, `server.test.js`

**Files:**
- Modify: `skills/design-large-task/proof-mcp/server.js`
  - `get_proof_state` tool schema: add optional `summary_mode: { type: 'boolean' }` property
  - `handleGetProofState`: when `summary_mode === true`, return the summary shape (counts and IDs only); otherwise return the existing full shape
- Create test: `skills/design-large-task/proof-mcp/__tests__/get-proof-state-summary.test.js`

**Summary response shape:**

```js
{
  proofStatus,
  round,
  counts: { ncs, rcs, rules, permissions, evidence, risks, frictions, concerns, definitions,
            ratified: { ncs, rcs, concerns, definitions } },
  closurePermitted,
  closureReasons,
  elements: { [id]: { type, status } },
  concerns: [{ id, status }],
  definitions: [{ id, status }],
}
```

**Decision — drop `bodyAdvancement` from summary-mode shape.** The spec lists `bodyAdvancement` in the summary response, but `bodyAdvancement` is a transient signal computed by `applyOperations` and returned in the `submit_proof_update` response — it is never persisted to disk. A `state.bodyAdvancement ?? null` read from a freshly loaded state will always be `null`, producing a misleading "no advancement" surface. Drop the field entirely from the summary-mode shape rather than ship a permanent-null. Callers needing the signal read it from the `submit_proof_update` response where it is correctly sourced.

(If the designer wants the field preserved, the alternative is to persist `state.bodyAdvancement = result.bodyAdvancement;` on every `applyOperations` success in `handleSubmitProofUpdate` before `saveState`. That widens the persistence surface for a derived value — preferred decision is to drop.)

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Create `skills/design-large-task/proof-mcp/__tests__/get-proof-state-summary.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { initializeState, saveState, applyOperations } from '../state.js';
// import handler — adjust per server.js export shape
import { handleGetProofState } from '../server.js';

function buildLargeState(file, count = 40) {
  let state = initializeState('p');
  saveState(state, file);
  // add `count` Evidence elements via applyOperations to inflate the body
  const ops = [];
  for (let i = 0; i < count; i++) {
    ops.push({ op: 'add', type: 'EVIDENCE', statement: 'E'.repeat(200), source: 'codebase' });
  }
  const r = applyOperations(state, ops, { source: 'designer-question' });
  saveState(r.state, file);
}

describe('get_proof_state summary_mode (AC-5.2)', () => {
  let file;
  beforeEach(() => {
    const dir = mkdtempSync(join(tmpdir(), 'gps-summary-'));
    file = join(dir, 'state.json');
    buildLargeState(file, 40);
  });

  it('summary_mode:true returns counts and IDs only', async () => {
    const res = await handleGetProofState({ state_file: file, summary_mode: true });
    const payload = JSON.parse(res.content[0].text);
    expect(payload.counts).toBeDefined();
    expect(payload.counts.evidence).toBe(40);
    // No element bodies
    for (const [, el] of Object.entries(payload.elements)) {
      expect(el).toEqual(expect.objectContaining({ type: expect.any(String), status: expect.any(String) }));
      expect(el).not.toHaveProperty('statement');
    }
    expect(payload).not.toHaveProperty('operationLog');
  });

  it('summary_mode response stays under 25K chars on a 40-element fixture', async () => {
    const res = await handleGetProofState({ state_file: file, summary_mode: true });
    expect(res.content[0].text.length).toBeLessThan(25_000);
  });

  it('summary_mode:false (or omitted) returns full body', async () => {
    const res = await handleGetProofState({ state_file: file });
    const payload = JSON.parse(res.content[0].text);
    expect(payload.elements).toBeDefined();
    // Full elements include statement
    const sampleId = Object.keys(payload.elements)[0];
    expect(payload.elements[sampleId]).toHaveProperty('statement');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run __tests__/get-proof-state-summary.test.js`
Expected: FAIL — `summary_mode` parameter not handled; full response is returned.

- [ ] **Step 3: Apply server.js changes**

In `skills/design-large-task/proof-mcp/server.js`:

(a) `get_proof_state` tool schema: add `summary_mode: { type: 'boolean', description: 'When true, return counts and IDs only (no element bodies, no operation log).' }` to the `inputSchema.properties` block.

(b) `handleGetProofState`: at the top of the handler (after `loadState`), branch on the `summary_mode` parameter. When `summary_mode === true`, build and return the compact shape:

```js
function buildSummaryShape(state) {
  const counts = {
    ncs: 0, rcs: 0, rules: 0, permissions: 0,
    evidence: 0, risks: 0, frictions: 0,
    concerns: (state.concerns || []).filter(c => c.status !== 'withdrawn').length,
    definitions: (state.definitions || []).filter(d => d.status !== 'withdrawn').length,
    ratified: { ncs: 0, rcs: 0, concerns: 0, definitions: 0 },
  };
  const elementsOut = {};
  for (const [id, el] of state.elements) {
    if (el.status !== 'active' && el.status !== 'withdrawn') continue;
    elementsOut[id] = { type: el.type, status: el.status };
    if (el.status !== 'active') continue;
    switch (el.type) {
      case 'NECESSARY_CONDITION':
        counts.ncs++;
        if (el.ratificationStatus === 'ratified') counts.ratified.ncs++;
        break;
      case 'RESOLVE_CONDITION':
        counts.rcs++;
        if (el.ratification !== null) counts.ratified.rcs++;
        break;
      case 'RULE': counts.rules++; break;
      case 'PERMISSION': counts.permissions++; break;
      case 'EVIDENCE': counts.evidence++; break;
      case 'RISK': counts.risks++; break;
      case 'FRICTION': counts.frictions++; break;
    }
  }
  for (const c of state.concerns || []) if (c.status === 'ratified') counts.ratified.concerns++;
  for (const d of state.definitions || []) if (d.status === 'ratified') counts.ratified.definitions++;

  const closure = checkClosure(state);
  return {
    proofStatus: state.proofStatus,
    round: state.round,
    counts,
    closurePermitted: closure.permitted,
    closureReasons: closure.reasons,
    elements: elementsOut,
    concerns: (state.concerns || []).map(c => ({ id: c.id, status: c.status })),
    definitions: (state.definitions || []).map(d => ({ id: d.id, status: d.status })),
  };
}
```

In the handler:

```js
if (summary_mode === true) {
  return { content: [{ type: 'text', text: JSON.stringify(buildSummaryShape(state)) }] };
}
// existing full-shape path unchanged
```

- [ ] **Step 4: Run tests to verify pass**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/server.js \
        skills/design-large-task/proof-mcp/__tests__/get-proof-state-summary.test.js
git commit -m "feat(proof-mcp): get_proof_state summary_mode flag for response-size cap (AC-5.2)"
```

---

## Task 10: Remove `reopen` motion (`reopen_proof` tool, `reopenProof` function, `lastClosureArtifact` field)

**Type:** code-producing
**Implements:** AC-2.1
**Decision budget:** 1
**Must remain green:** `state.test.js`, `server.test.js`, `acceptance.test.js`, `loadstate-backfill.test.js`

**Files:**
- Modify: `skills/design-large-task/proof-mcp/state.js` — delete `reopenProof` function (around lines 220-240); remove `lastClosureArtifact: null` from `initializeState` (line 57); remove the `raw.lastClosureArtifact ??= null;` backfill in `loadState` (around line 794)
- Modify: `skills/design-large-task/proof-mcp/server.js` — drop `reopenProof` from the `state.js` import (line 11); remove the `reopen_proof` tool from the `TOOLS` array; remove `handleReopenProof` handler; remove the `reopen_proof` case from the dispatcher
- Modify: `skills/design-large-task/proof-mcp/__tests__/state.test.js` — delete tests asserting `lastClosureArtifact` initialization
- Modify: `skills/design-large-task/proof-mcp/__tests__/server.test.js` — delete tests for `reopen_proof`
- Delete: `skills/design-large-task/proof-mcp/__tests__/reopen.test.js`

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Edit `skills/design-large-task/proof-mcp/__tests__/server.test.js`. Add (or replace one of the existing reopen-related cases with) a removal-assertion test:

```js
describe('reopen_proof retired (AC-2.1)', () => {
  it('reopen_proof is not in the tool catalog', async () => {
    const tools = await listTools(); // existing helper
    expect(tools.find(t => t.name === 'reopen_proof')).toBeUndefined();
  });

  it('reopenProof is not exported from state.js', async () => {
    const stateModule = await import('../state.js');
    expect(stateModule.reopenProof).toBeUndefined();
  });

  it('initializeState does not set lastClosureArtifact', () => {
    const s = initializeState('p');
    expect(s).not.toHaveProperty('lastClosureArtifact');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run __tests__/server.test.js __tests__/state.test.js`
Expected: FAIL — tool/function/field still present.

- [ ] **Step 3: Apply removals**

In `skills/design-large-task/proof-mcp/state.js`:
(a) Delete the entire `reopenProof` export function body.
(b) Line 57: delete `lastClosureArtifact: null,` from `initializeState`.
(c) `loadState`: delete the `raw.lastClosureArtifact ??= null;` line.

In `skills/design-large-task/proof-mcp/server.js`:
(a) Line 11: remove `reopenProof` from the destructured import. (Keep all other imports.)
(b) Find the `reopen_proof` entry in the `TOOLS` array and delete the entire object.
(c) Find `handleReopenProof` and delete the function.
(d) In the request dispatcher (the `switch` on `request.params.name`), delete the `case 'reopen_proof':` clause.

Delete file: `skills/design-large-task/proof-mcp/__tests__/reopen.test.js`.

In `skills/design-large-task/proof-mcp/__tests__/state.test.js`: remove every assertion or describe block referencing `lastClosureArtifact` initialization.

- [ ] **Step 4: Run full suite**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -u skills/design-large-task/proof-mcp/
git rm skills/design-large-task/proof-mcp/__tests__/reopen.test.js
git commit -m "feat(proof-mcp): remove reopen motion (reopen_proof, reopenProof, lastClosureArtifact) (AC-2.1)"
```

---

## Task 11: Remove `op:lock`, `concernsLocked` field, and `metrics.js` lock reads

**Type:** code-producing
**Implements:** AC-2.2
**Decision budget:** 2
**Must remain green:** `concerns.test.js`, `metrics.test.js`, `server.test.js`, `state.test.js`, `closing-argument.test.js`

**Files:**
- Modify: `skills/design-large-task/proof-mcp/state.js`
  - Delete `lockConcerns` function
  - `initializeState` line 50: remove `concernsLocked: false,`
  - `addConcern`: remove the lock guard at lines 315-317 (`if (state.concernsLocked) { ... }`)
  - `loadState`: remove `raw.concernsLocked ??= false;` line; replace the `defaultConcernStatus = raw.concernsLocked ? 'ratified' : 'draft';` block (state.js:783-786) with an unconditional `'draft'` default — `for (const c of raw.concerns) { c.status ??= 'draft'; }`
- Modify: `skills/design-large-task/proof-mcp/metrics.js`
  - `checkClosure` condition 7 (line 346): remove the entire condition (the lock concept is retired; closure permissibility no longer reads lock state)
  - `checkClosure` condition 10 (line 368): change `if (state.concernsLocked)` to `if (state.concerns && state.concerns.length > 0)`
  - `concernsRatificationGate` (lines 399-417): remove the `if (!state || !state.concernsLocked)` early return; simplify body to draft-count check; the `CONCERNS_UNLOCKED` code path is gone; function returns `{ passed: true }` or `{ passed: false, code: 'CONCERNS_UNRATIFIED', message }`
  - `evaluateTrigger` (lines 423-470): remove the `concernsRatificationGate(state)` call at line 457 and the `gate.code === 'CONCERNS_UNLOCKED'` branch at lines 459-461
  - `evaluateTrigger` coverage check at line 466: change `if (state.concernsLocked)` to `if (state.concerns && state.concerns.length > 0)`
- Modify: `skills/design-large-task/proof-mcp/server.js`
  - Drop `lockConcerns` from the `state.js` import (line 9)
  - In `handleManageConcerns`: remove the `op === 'lock'` branch entirely
  - In the `manage_concerns` tool schema: change `op` enum from `['add', 'lock', 'ratify']` to `['add', 'ratify']`
- Modify: `skills/design-large-task/proof-mcp/__tests__/concerns.test.js` — remove tests covering `op: 'lock'`
- Modify: `skills/design-large-task/proof-mcp/__tests__/metrics.test.js` — remove `concernsRatificationGate.CONCERNS_UNLOCKED` test cases; update `checkClosure` and `evaluateTrigger` test fixtures to remove `concernsLocked` references
- Modify: `skills/design-large-task/proof-mcp/__tests__/state.test.js` — remove tests asserting `concernsLocked` initialization
- Modify: `skills/design-large-task/proof-mcp/__tests__/server.test.js` — remove tests for `manage_concerns op:lock`
- Modify: `skills/design-large-task/proof-mcp/__tests__/mutation-clears-flags.test.js` — remove the `lockConcerns` test case
- **Modify: `skills/design-large-task/proof-mcp/__tests__/acceptance.test.js`** — line 3 imports `lockConcerns`; called at lines 89, 92, 101, 112, 144, 155, 170, 188, 232, 254, 275. Strategy: replace every `lockConcerns(state, consent)` call with the equivalent under the new model — directly ratify each Concern via `ratifyConcern(state, concernId, consent)` for every active Concern. Remove the `lockConcerns` import. Tests asserting "lockConcerns is irreversible" or similar lock-semantics behaviors (lines 84, 109) become tests of the new semantics: under the new model there is no lock — the test is either re-targeted to "Concerns can be added at any time during planning" or deleted if the original assertion was lock-specific.
- **Modify: `skills/design-large-task/proof-mcp/__tests__/closing-argument.test.js`** — line 4 imports `lockConcerns`; called at lines 10, 108, 146, 167, 237. Replace each call site with `ratifyConcern` per-Concern (or with a state-builder helper that constructs a fully-ratified body directly). Remove the import.
- **Modify: `skills/design-large-task/proof-mcp/__tests__/trigger-evaluator.test.js`** — line 4 imports `lockConcerns`; called at line 10 in `buildClosureReadyState` helper. Update the helper to ratify Concerns via `ratifyConcern` instead. **Lines 82-87:** delete the entire `it('isolates concerns-locked floor failure', ...)` test case — the "Concerns must be locked" reason no longer exists (the gate was retired). Remove the import.
- **Modify: `skills/design-large-task/proof-mcp/__tests__/consent.test.js`** — line 4 imports `lockConcerns`; lines 53-67 form a `describe('lockConcerns with consent')` block; line 137 calls it. Delete the entire `lockConcerns` describe block (lines 53-67). Delete the call at line 137 and any surrounding test that depends on it. Remove the import.
- **Modify: `skills/design-large-task/proof-mcp/__tests__/operation-log.test.js`** — line 2 imports `lockConcerns` and `markChallengeUsed`. Delete `it('lockConcerns appends entry with op:lock', ...)` at line 24. (The `markChallengeUsed` case at line 63 is removed in Task 12.) Update imports — `lockConcerns` removed in this task; `markChallengeUsed` removed in Task 12 (do that import edit there).

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Edit `skills/design-large-task/proof-mcp/__tests__/server.test.js`. Add:

```js
describe('manage_concerns op:lock retired (AC-2.2)', () => {
  it("op enum is exactly ['add', 'ratify']", async () => {
    const tools = await listTools();
    const tool = tools.find(t => t.name === 'manage_concerns');
    expect(tool.inputSchema.properties.op.enum).toEqual(['add', 'ratify']);
  });

  it('lockConcerns is not exported from state.js', async () => {
    const stateModule = await import('../state.js');
    expect(stateModule.lockConcerns).toBeUndefined();
  });

  it('initializeState does not set concernsLocked', () => {
    const s = initializeState('p');
    expect(s).not.toHaveProperty('concernsLocked');
  });

  it('adding a Concern always succeeds, regardless of prior count', () => {
    let s = initializeState('p');
    for (let i = 0; i < 5; i++) {
      const [, ns] = addConcern(s, { label: `C${i}` }, { source: 'designer-question' });
      s = ns;
    }
    expect(s.concerns.length).toBe(5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run __tests__/server.test.js __tests__/state.test.js`
Expected: FAIL.

- [ ] **Step 3: Apply removals**

Apply every modification listed in the Files block above. Order:

1. `state.js` first (delete `lockConcerns`, remove field from `initializeState`, remove guard in `addConcern`, fix `loadState` defaults).
2. `metrics.js` next (the four lock-read sites).
3. `server.js` (import, schema enum, handler branch).
4. Test files (remove every retired-mechanism case; update fixtures to drop `concernsLocked`).

- [ ] **Step 4: Run full suite**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run`
Expected: PASS. Any test still asserting `concernsLocked: false` or `concernsLocked: true` in a fixture must be updated in this task.

- [ ] **Step 5: Commit**

```bash
git add -u skills/design-large-task/proof-mcp/
git commit -m "feat(proof-mcp): remove manage_concerns op:lock + concernsLocked field + metrics lock reads (AC-2.2)"
```

---

## Task 12: Remove challenge-mode personalities (functions, fields, response keys)

**Type:** code-producing
**Implements:** AC-2.3
**Decision budget:** 3
**Must remain green:** `metrics.test.js`, `state.test.js`, `server.test.js`, `mutation-clears-flags.test.js`, `acceptance.test.js`, `trigger-evaluator.test.js`

**Files:**
- Modify: `skills/design-large-task/proof-mcp/state.js`
  - Delete `markChallengeUsed` function
  - `initializeState`: remove fields `conditionCountHistory`, `elementCountHistory`, `challengeModesUsed`, `challengeLog` (state.js:43-46)
  - `loadState`: remove backfills for those four fields
  - Remove import of `detectChallenge` and `detectStall` from `metrics.js` import line (line 14)
- Modify: `skills/design-large-task/proof-mcp/metrics.js`
  - Delete `detectChallenge` function
  - Delete `detectStall` function
  - Delete `STALL_WINDOW` constant (line 14)
- Modify: `skills/design-large-task/proof-mcp/server.js`
  - Drop `markChallengeUsed` from the `state.js` import (line 8)
  - Drop `detectChallenge` from the `metrics.js` import (line 18)
  - `handleGetProofState`: remove the `const challengeTrigger = detectChallenge(state);` line at server.js:402 and remove `challenge_trigger: challengeTrigger,` from the response object at server.js:409
- Modify: `skills/design-large-task/proof-mcp/__tests__/metrics.test.js` — delete entire `detectStall` and `detectChallenge` describe blocks
- Modify: `skills/design-large-task/proof-mcp/__tests__/mutation-clears-flags.test.js` — delete `markChallengeUsed` test case
- Modify: `skills/design-large-task/proof-mcp/__tests__/state.test.js` — remove tests asserting `challengeModesUsed`, `conditionCountHistory`, `elementCountHistory`, `challengeLog` initialization
- Modify: `skills/design-large-task/proof-mcp/__tests__/server.test.js` — remove tests asserting `challenge_trigger` in `get_proof_state` response
- Modify: `skills/design-large-task/proof-mcp/__tests__/trigger-evaluator.test.js` — remove cases that exercised `detectChallenge` or `detectStall` directly; preserve cases for `evaluateTrigger`'s remaining coverage path (per Task 11's `evaluateTrigger` simplification)
- **Modify: `skills/design-large-task/proof-mcp/__tests__/operation-log.test.js`** — line 2: remove `markChallengeUsed` from the import. Delete `it('markChallengeUsed appends entry with op:mark-challenge', ...)` at line 63 and any surrounding helpers that referenced it.
- **Modify: `skills/design-large-task/proof-mcp/__tests__/acceptance.test.js`** — search the file for any reference to `challengeModesUsed`, `markChallengeUsed`, `challenge_trigger`, `stall_detected`, `conditionCountHistory`, `elementCountHistory`, or `challengeLog`. Delete every test case that asserts those surfaces. (The `lockConcerns` cleanup happened in Task 11; this is the residual challenge-personality cleanup for the same file.)

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Edit `skills/design-large-task/proof-mcp/__tests__/server.test.js`. Add:

```js
describe('challenge mode personalities retired (AC-2.3)', () => {
  it('get_proof_state response does not carry challenge_trigger', async () => {
    const file = freshStateFile();
    const res = await handleGetProofState({ state_file: file });
    const payload = JSON.parse(res.content[0].text);
    expect(payload).not.toHaveProperty('challenge_trigger');
  });

  it('initializeState does not set challenge personality fields', () => {
    const s = initializeState('p');
    expect(s).not.toHaveProperty('challengeModesUsed');
    expect(s).not.toHaveProperty('challengeLog');
    expect(s).not.toHaveProperty('conditionCountHistory');
    expect(s).not.toHaveProperty('elementCountHistory');
  });

  it('detectChallenge / detectStall / STALL_WINDOW retired from metrics.js', async () => {
    const m = await import('../metrics.js');
    expect(m.detectChallenge).toBeUndefined();
    expect(m.detectStall).toBeUndefined();
    expect(m.STALL_WINDOW).toBeUndefined();
  });

  it('markChallengeUsed retired from state.js', async () => {
    const s = await import('../state.js');
    expect(s.markChallengeUsed).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run __tests__/server.test.js`
Expected: FAIL.

- [ ] **Step 3: Apply removals**

Order:
1. `metrics.js`: delete `detectChallenge`, `detectStall`, `STALL_WINDOW`.
2. `state.js`: delete `markChallengeUsed`; remove the four state fields from `initializeState`; remove the four backfills from `loadState`; clean up the `metrics.js` import line.
3. `server.js`: clean up imports; delete the `detectChallenge` call at line 402; delete `challenge_trigger` from the response at line 409.
4. Tests: delete retired describe blocks; update fixtures.

- [ ] **Step 4: Run full suite**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -u skills/design-large-task/proof-mcp/
git commit -m "feat(proof-mcp): remove challenge mode personalities (detectChallenge, detectStall, markChallengeUsed, history fields, challenge_trigger) (AC-2.3)"
```

---

## Task 13: Remove bulk-ratify hook from `recordDesignerGo`; refuse mutations after finish

**Type:** code-producing
**Implements:** AC-2.4, AC-7.1
**Decision budget:** 2
**Must remain green:** `state.test.js`, `eleventh-closure-condition.test.js`, `acceptance.test.js`, `server.test.js`, `closing-argument-end-to-end.test.js`

**Files:**
- Modify: `skills/design-large-task/proof-mcp/state.js`
  - `recordDesignerGo`: remove the NC bulk-ratify loop, the RC bulk-ratify loop, and any bulk-ratify operation log entries; the function appends exactly one operation log entry: `{ op: 'close', provenance: { from: 'planning', to: 'finish' } }`
  - `recordDesignerGo`: at function entry (after consent check), reject with structured error if `state.proofStatus === 'finish'` (no path back from finish)
  - Add a top-of-function `proofStatus === 'finish'` refusal to every other mutating export — `addConcern`, `ratifyConcern`, `ratifyResolveCondition`, `applyOperations`, `manageFriction`, `overrideFrictionDisposition`, `manageDefinitions`, `withdrawElement`, `withdrawConcern`, `withdrawDefinition`, `recordClosingArgPresented`. Each returns the existing `[state, error]` or result-object shape with `PROOF_FINISHED: <message>` in place of any successful mutation.
- Modify: `skills/design-large-task/proof-mcp/server.js`
  - Each handler that calls one of the above mutating functions classifies the `PROOF_FINISHED` error in the response (extend `classifyStateError` or add a dedicated branch so the error code surfaces cleanly with `isError: true`)
- Delete: `skills/design-large-task/proof-mcp/__tests__/bulk-ratify.test.js`
- Modify: `skills/design-large-task/proof-mcp/__tests__/state.test.js` and `__tests__/server.test.js` — add coverage for AC-2.4 (no extra log entries on closure) and AC-7.1 (post-finish mutation refusal)

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Edit `skills/design-large-task/proof-mcp/__tests__/state.test.js`. Add:

```js
describe('AC-2.4: recordDesignerGo closure does not bulk-ratify', () => {
  it('appends exactly one close log entry, no bulk-ratify entries', () => {
    // Build a state where every NC / RC is already ratified and presentation
    // round + go round are aligned with current round.
    const s = buildClosableState(); // helper builds fully-ratified state
    const beforeLogLen = s.operationLog.length;
    const [after, err] = recordDesignerGo(s, { source: 'designer-go' });
    expect(err).toBeNull();
    expect(after.proofStatus).toBe('finish');
    const newEntries = after.operationLog.slice(beforeLogLen);
    expect(newEntries.length).toBe(1);
    expect(newEntries[0].op).toBe('close');
    expect(newEntries[0].provenance).toEqual({ from: 'planning', to: 'finish' });
  });
});

describe('AC-7.1: post-finish mutations refused', () => {
  it.each([
    ['applyOperations', s => applyOperations(s, [], { source: 'designer-question' })],
    ['addConcern', s => addConcern(s, { label: 'X' }, { source: 'designer-question' })],
    // ... cover every mutating export
  ])('%s returns PROOF_FINISHED', (_, fn) => {
    const s = buildFinishedState(); // helper sets proofStatus='finish'
    const result = fn(s);
    // shape varies — applyOperations returns { errors }, others return [state, err]
    if (Array.isArray(result)) {
      expect(result[1]).toMatch(/PROOF_FINISHED/);
    } else {
      expect(result.errors[0]).toMatch(/PROOF_FINISHED/);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run __tests__/state.test.js`
Expected: FAIL.

- [ ] **Step 3: Apply state.js changes**

(a) `recordDesignerGo`:
- Add `proofStatus === 'finish'` refusal at top: returns `[state, 'PROOF_FINISHED: Proof is finished; no further mutations permitted']`.
- Find and delete the NC bulk-ratify loop.
- Find and delete the RC bulk-ratify loop.
- Delete any `appendOperationLog` calls inside those loops.
- Ensure the closure path appends exactly one entry: `appendOperationLog(newState, { round: newState.round, op: 'close', provenance: { from: 'planning', to: 'finish' } })`.
- The status set is `newState.proofStatus = 'finish'` (already done in Task 4).

(b) Add post-finish refusal to every other mutating export. Each function has its own existing return-tuple shape; the refusal must match it position-for-position. Use the table below as the explicit template — do not invent a new shape, and do not leave placeholders:

| Function | Existing return shape | PROOF_FINISHED refusal |
|---|---|---|
| `addConcern` | `[concernId, newState, friction_hints, error]` | `[null, state, [], 'PROOF_FINISHED: Proof is finished; no further mutations permitted']` |
| `ratifyConcern` | `[newState, error]` | `[state, 'PROOF_FINISHED: Proof is finished; no further mutations permitted']` |
| `ratifyResolveCondition` | `[newState, friction_hints, error]` (verified at `state.js:426-464` — three-element tuple, friction_hints in middle slot) | `[state, [], 'PROOF_FINISHED: Proof is finished; no further mutations permitted']` |
| `manageFriction` | `[id, newState, friction_hints, error]` (verified at `state.js:824`) | `[null, state, [], 'PROOF_FINISHED: Proof is finished; no further mutations permitted']` |
| `overrideFrictionDisposition` | `[newState, error]` | `[state, 'PROOF_FINISHED: ...']` |
| `manageDefinitions` | `[definitionId, newState, error]` (or similar — verify) | first slot null, state slot = `state`, error slot = `'PROOF_FINISHED: ...'` |
| `withdrawElement`, `withdrawConcern`, `withdrawDefinition` | `[newState, error]` | `[state, 'PROOF_FINISHED: ...']` |
| `recordClosingArgPresented` | `[newState, error]` | `[state, 'PROOF_FINISHED: ...']` |
| `recordDesignerGo` | `[newState, error]` | `[state, 'PROOF_FINISHED: ...']` |

Before editing any function, **read its current return statements** to confirm the tuple shape. The table is correct as of the d-1 codebase; if any function has changed shape, follow what the file actually returns, not the table.

Pattern (using `addConcern` as the explicit example):

```js
export function addConcern(state, { label, description }, consent) {
  const consentCheck = validateConsentToken(consent);
  if (!consentCheck.valid) {
    return [null, state, [], `INVALID_CONSENT: ${consentCheck.reason}`];
  }
  if (state.proofStatus === 'finish') {
    return [null, state, [], 'PROOF_FINISHED: Proof is finished; no further mutations permitted'];
  }
  // ... existing body unchanged
}
```

For functions returning `{ state, errors, ... }` (like `applyOperations`):

```js
if (state.proofStatus === 'finish') {
  return {
    state, added: [], revised: [], withdrawn: [],
    errors: ['PROOF_FINISHED: Proof is finished; no further mutations permitted'],
    integrityWarnings: [], completeness: null, bodyAdvancement: null,
    closure: { permitted: false, reasons: [] }, friction_hints: [],
  };
}
```

For `recordClosingArgPresented`: include the same refusal — under the binary lifecycle, even derivation-with-flag-set must refuse once finished (per AC-7.1).

(c) `server.js`: extend `classifyStateError` so `PROOF_FINISHED` surfaces as `code: 'PROOF_FINISHED'` rather than `DOMAIN_ERROR`:

```js
function classifyStateError(err) {
  if (err.startsWith('INVALID_CONSENT')) return { code: 'INVALID_CONSENT', message: err };
  if (err.startsWith('PROOF_FINISHED')) return { code: 'PROOF_FINISHED', message: err };
  return { code: 'DOMAIN_ERROR', message: err };
}
```

(c2) **`handleSubmitProofUpdate` does not call `classifyStateError`** — it reads `result.errors[]` directly (server.js:333-362). To make AC-7.1's structured-error contract hold for `submit_proof_update`, add a pre-flight check at the top of the handler (after `loadState` and consent validation, before calling `applyOperations`):

```js
function handleSubmitProofUpdate({ state_file, operations, consent }) {
  // ... existing consent validation ...
  const state = loadState(state_file);
  if (state.proofStatus === 'finish') {
    return {
      content: [{ type: 'text', text: JSON.stringify({
        code: 'PROOF_FINISHED',
        message: 'Proof is finished; no further mutations permitted',
      }) }],
      isError: true,
    };
  }
  // ... existing applyOperations call and response logic unchanged ...
}
```

This pre-flight refuses cleanly before `applyOperations` is called. The state-layer's PROOF_FINISHED early-return remains as a defense-in-depth check — both layers agree on the contract.

Apply the same pattern to every other handler that calls a mutating state function: `handleManageConcerns`, `handleManageDefinitions`, `handleManageFriction`, `handleOverrideFrictionDisposition`, `handleRatifyResolveCondition`, `handleWithdraw`, `handlePresentClosingArgument`, `handleConfirmClosureGo`. Each gets the same pre-flight `state.proofStatus === 'finish'` check returning the structured PROOF_FINISHED error before invoking the state-layer function. The state-layer refusal stays as defense-in-depth.

(`handleGetProofState` is read-only and remains available — no pre-flight check there.)

(d) Delete `skills/design-large-task/proof-mcp/__tests__/bulk-ratify.test.js`.

- [ ] **Step 4: Run full suite**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -u skills/design-large-task/proof-mcp/
git rm skills/design-large-task/proof-mcp/__tests__/bulk-ratify.test.js
git commit -m "feat(proof-mcp): remove bulk-ratify hook; refuse post-finish mutations across all mutators (AC-2.4, AC-7.1)"
```

---

## Task 14: Universal-withdraw concern routing verification test

**Type:** code-producing
**Implements:** AC-5.1
**Decision budget:** 1
**Must remain green:** `concern-withdraw-routing.test.js`, `withdraw.test.js`, `concerns.test.js`

**Files:**
- Create test: `skills/design-large-task/proof-mcp/__tests__/concern-withdraw-routing.test.js`

This task is verification-only: the routing already exists in `server.js` (the withdraw handler dispatches `category: 'CONCERN'` to `withdrawConcern` per the ground-truth report). The test locks the contract.

**Steps (TDD):**

- [ ] **Step 1: Write the test**

Create `skills/design-large-task/proof-mcp/__tests__/concern-withdraw-routing.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { initializeState, saveState, loadState, addConcern } from '../state.js';
// Import the universal withdraw handler.
// Adjust to match server.js's exported helper or in-process invoker shape.

describe('AC-5.1: universal withdraw routes CONCERN end-to-end', () => {
  it('flips Concern status to withdrawn and logs the operation', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'concern-w-'));
    const file = join(dir, 'state.json');
    let s = initializeState('p');
    const [concernId, withConcern] = addConcern(s, { label: 'Probe' }, { source: 'designer-question' });
    saveState(withConcern, file);

    const res = await handleWithdraw({
      state_file: file,
      category: 'CONCERN',
      element_id: concernId,
      disposition: 'superseded', // valid value from WITHDRAWAL_DISPOSITIONS at proof.js:43-45
      consent: { source: 'designer-question' },
    });
    expect(res.isError).toBeFalsy();
    const after = loadState(file);
    const c = after.concerns.find(x => x.id === concernId);
    expect(c.status).toBe('withdrawn');
    const last = after.operationLog[after.operationLog.length - 1];
    expect(last.op).toBe('withdraw');
    expect(last.entityId).toBe(concernId);
  });

  it('body_advancement.withdrawCount increments when Concerns are withdrawn via universal withdraw', async () => {
    // ... run withdraw, then a no-op submit_proof_update, observe body_advancement on the response
  });
});
```

(`'superseded'` is one of the values in `WITHDRAWAL_DISPOSITIONS` at `proof.js:43-45`: `['consolidated', 'superseded', 'found-redundant', 'found-incorrect', 'scope-removed']`. Confirm via `DISPOSITIONS_BY_CATEGORY` that `'superseded'` is valid for `'CONCERN'`; if it isn't, swap for whichever value the map allows.)

- [ ] **Step 2: Run test to verify it passes immediately**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run __tests__/concern-withdraw-routing.test.js`
Expected: PASS.

- [ ] **Step 3: (skipped — no impl change)**
- [ ] **Step 4: Run full suite**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/__tests__/concern-withdraw-routing.test.js
git commit -m "test(proof-mcp): verify universal withdraw routes CONCERN end-to-end (AC-5.1)"
```

---

## Task 15: Update `SKILL.md`; final suite verification

**Type:** docs-producing
**Implements:** AC-3.2 (SKILL.md states body_advancement is agent-internal), AC-8.1, AC-8.2
**Decision budget:** 2
**Must remain green:** every test in `proof-mcp/__tests__/` (the full suite passes)

**Files:**
- Modify: `skills/design-large-task/SKILL.md`

**Edits required:**

1. **Remove every reference to** `reopen_proof`, `op:lock` (manage_concerns), `challenge_used` (submit_proof_update), the three challenge mode personalities (by name), `stall_detected`, `challenge_trigger`. Search the file for each token.
2. **Remove the post-round procedure item** that consumes `stall_detected` and `challenge_trigger` from the `submit_proof_update` response.
3. **Add a brief description of the `body_advancement` field** to the `submit_proof_update` description. Note explicitly: agent-internal context only; never surfaced into designer-facing turn output.
4. **Update `present_closing_argument` description** to reference the first-yes precondition and the `FIRST_YES_GATE_FAILED` error shape with `unratified_ids` listing.
5. **Update `manage_concerns` description** to drop `op:lock` from the operation list. Final list: `op: 'add' | 'ratify'`.
6. **Update `get_proof_state` description** to mention the optional `summary_mode: boolean` flag for long sessions.
7. **Preserve every other instruction unchanged** — vocabulary lock items in the SKILL.md (element type names, `ratified`, `closing argument`, `two-yes`, `first yes`, master-plan rule numbers) stay verbatim.

**Steps (verification + edit):**

- [ ] **Step 1: Audit current SKILL.md against retired surfaces**

Run: `grep -n "reopen_proof\|op:lock\|op: 'lock'\|challenge_used\|stall_detected\|challenge_trigger\|markChallengeUsed\|detectChallenge\|detectStall" skills/design-large-task/SKILL.md`
Expected: a list of lines that need removal/edit.

- [ ] **Step 2: Apply edits**

Use the Edit tool to remove each retired-surface reference and to add the four new descriptions (body_advancement, first-yes precondition, op enum update, summary_mode flag).

- [ ] **Step 3: Verify SKILL.md is clean**

Run: `grep -n "reopen_proof\|op:lock\|op: 'lock'\|challenge_used\|stall_detected\|challenge_trigger\|markChallengeUsed\|detectChallenge\|detectStall" skills/design-large-task/SKILL.md`
Expected: no matches.

Run: `grep -n "body_advancement\|FIRST_YES_GATE_FAILED\|summary_mode" skills/design-large-task/SKILL.md`
Expected: at least one match per term.

- [ ] **Step 4: Run the full proof-mcp test suite**

Run: `cd skills/design-large-task/proof-mcp && npm test`
Expected: 0 failures, 0 skipped tests.

If any test fails, the failure belongs to whichever earlier task introduced the regression — do not paper over it here. Either fix the cause in the originating task's commit (amend if appropriate) or surface the failure to the human.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/SKILL.md
git commit -m "docs(skill): update design-large-task SKILL.md for proof-mcp d-1-fix surface (AC-3.2, AC-8.1)"
```

---

## Coverage Map (AC → Tasks)

- **AC-1.1** (proofStatus binary value set) → Task 4
- **AC-1.2** (loadState backfill) → Task 4
- **AC-2.1** (reopen motion removed) → Task 10
- **AC-2.2** (op:lock removed) → Task 11
- **AC-2.3** (three challenge personalities removed) → Task 12
- **AC-2.4** (bulk-ratify hook removed) → Task 13
- **AC-3.1** (body-advancement signal) → Task 1, Task 5
- **AC-3.2** (body-advancement agent-internal) → Task 5 (response shape), Task 15 (SKILL.md statement)
- **AC-4.1** (first-yes refuses on working elements) → Task 2, Task 6
- **AC-4.2** (first-yes passes when ratified) → Task 2, Task 6
- **AC-4.3** (mid-review revision resets flags) → Task 7
- **AC-4.4** (inline reset rewired to helper) → Task 3
- **AC-5.1** (universal withdraw routes Concerns) → Task 14
- **AC-5.2** (summary_mode flag) → Task 9
- **AC-6.1** (closing-argument lockedConcerns uses proofStatus) → Task 8
- **AC-6.2** (no crash on retired history fields) → Task 5, Task 12
- **AC-7.1** (post-finish mutations refused) → Task 13
- **AC-8.1** (SKILL.md updated) → Task 15
- **AC-8.2** (suite passes after sprint) → Task 15 (verification gate); every preceding task contributes by maintaining green-tree discipline

<!-- created-at: 2026-05-08T16:12:48Z -->
<!-- produced-by plan-build@v0004 -->
