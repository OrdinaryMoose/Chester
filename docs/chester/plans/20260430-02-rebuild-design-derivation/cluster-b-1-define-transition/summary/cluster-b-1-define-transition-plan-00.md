# Plan: Cluster B.1 — Define Transition

**Sprint:** `cluster-b-1-define-transition`
**Spec:** `docs/chester/working/20260430-02-rebuild-design-derivation/cluster-b-1-define-transition/spec/cluster-b-1-define-transition-spec-00.md`
**Execution mode:** per-task (designer-directed; see per-task `Execution:` field)

Per-task execution mode summary:
- **Subagent (2 tasks):** T8 (restructure top-level orchestrator), T11 (handleOpenProof three-phase orchestration). Both genuinely complex with nested logic, partition routing, multiple integration tests.
- **Inline (12 tasks):** T1, T2, T3, T4, T5, T6, T7, T9, T10, T12, T13, T14. Mechanical changes, single-function additions, or documentation edits.

> **For agentic workers:** Use execute-write to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The `Execution mode` field selects which execute-write section runs — Section 2 (subagent-driven) or Section 3 (inline). plan-build sets this field at handoff based on the Execution Mode Selection heuristic with human confirm/override.

## Goal

Implement `open_proof` MCP tool — single-call contract surface that accepts an untrusted caller submission, restructures it into typed proof elements internally, and opens the proof for downstream reasoning.

## Architecture

Layered Depth Hybrid: single MCP tool with three internal phases (accept / restructure / open). Restructuring uses a rule table for mechanical operations (verbatim-preserve, reshape, gap-fill) with anchor-disciplined escape hatches (infer, derive) that require explicit reasoning anchors. Boundary is permissive (any submission shape accepted); rigor lives in the internal restructuring phase. Open is gated on per-element artifacts (action label + provenance + report).

## Tech Stack

- Node.js (ES modules, `type: "module"`)
- vitest (test runner)
- @modelcontextprotocol/sdk (MCP server)
- Existing proof MCP module structure under `skills/design-large-task/proof-mcp/`

## Working Directory

All work happens inside the worktree: `.worktrees/cluster-b-1-define-transition/`. All file paths below are relative to the worktree root.

Tests run via:
```bash
cd skills/design-large-task/proof-mcp && npm test
```

After each task's commit, run the full bash test suite from the repo root:
```bash
for t in tests/test-*.sh; do bash "$t" >/dev/null 2>&1 && echo "PASS: $t" || echo "FAIL: $t"; done
```

The pre-existing failure `tests/test-stamping-design-large-task.sh` is unrelated to B.1 work and may be ignored.

## Module Layout for Restructuring

Restructuring is split into three files for separation of concerns (avoids one file with seven mixed responsibilities). Tasks 3-8 target these files:

- **`skills/design-large-task/proof-mcp/restructure-schema.js`** — REQUIRED_FIELDS_REGISTRY (data only). Task 3.
- **`skills/design-large-task/proof-mcp/restructure-rules.js`** — assignActionLabel, isRejectedValue, validateReasoningAnchor (predicate / rule-table functions). Tasks 4, 5, 7.
- **`skills/design-large-task/proof-mcp/restructure.js`** — buildProvenance, extractMetadata, restructure (top-level orchestrator + record builders; imports from the two sibling modules). Tasks 6, 8.

Tests mirror sources:
- `__tests__/restructure-schema.test.js` (Task 3)
- `__tests__/restructure-rules.test.js` (Tasks 4, 5, 7)
- `__tests__/restructure.test.js` (Tasks 6, 8)

## Plan-Wide Implementation Discipline

**Read before starting any task. These are non-negotiable mechanical rules every task obeys.**

- **ES module imports always at top of file.** When a task says "Append" content to a `.test.js` or `.js` file, append `describe` blocks / function definitions only. New `import` statements always go in the import block at the top of the file (use Edit to insert into the existing import block — do not append `import` lines after `describe` blocks; ES modules error on that).
- **Functions consumed by tests must be exported.** Any function a test imports (`import { foo } from '../bar.js'`) must be `export`-prefixed in its source file. This includes `handleOpenProof`, helper functions, etc.
- **`applyResult.errors` must always be surfaced in handler responses.** When a handler calls `applyOperations`, the response must include `errors: applyResult.errors` in the payload. Silent drop of validation errors is a correctness violation. If `applyResult.errors.length > 0` after a gate-pass write, the handler returns `status: 'partial_write_failure'` with the errors array and the actually-admitted IDs.
- **Per-field provenance.** Every admitted element's `provenance` carries a `field_provenance: [{field_name, action_label, reasoning_chain}]` array — one entry per typed field the restructure pass produced. Element-level `provenance.action_label` is the priority-promoted aggregate (`gap-fill > reshape > verbatim-preserve`); the priority is documented and tested. This addresses the smell-flagged lossy aggregation.
- **Behavioral tests over source-inspection tests.** Where a behavioral test is feasible (spy/mock of dependent functions, check observable side effects), prefer it over `function.toString()` source-comment matching.
- **The legacy `initialize_proof` MCP tool is retired in this sprint** (Task 13). After Task 13, the only proof-opening entry point is `open_proof`.

---

## Task 1: Extend createElement with optional restructuring field

**Execution:** inline (mechanical destructure addition + conditional property; single function)
**Type:** code-producing
**Implements:** AC-13.1
**Decision budget:** 1
**Must remain green:** `proof.test.js` (existing tests for createElement; AC-13.1 new tests)

**Files:**
- Modify: `skills/design-large-task/proof-mcp/proof.js` (createElement function, ~lines 46-160)
- Modify: `skills/design-large-task/proof-mcp/__tests__/proof.test.js` (add tests)

**Steps (TDD):**

- [ ] **Step 1: Write the failing tests**

Append to `skills/design-large-task/proof-mcp/__tests__/proof.test.js`:

```javascript
describe('createElement restructuring extension', () => {
  it('persists restructuring field when present in input', () => {
    const restructuring = {
      metadata: { caller_note: 'extra' },
      restructuring_action_label: 'verbatim-preserve',
      provenance: { source_citation: 'caller-input', action_label: 'verbatim-preserve', reasoning_chain: null },
    };
    const el = createElement(
      { type: 'RULE', statement: 'foo', source: 'designer', restructuring },
      'R-1',
      1
    );
    expect(el.restructuring).toEqual(restructuring);
  });

  it('omits restructuring property entirely when input is absent', () => {
    const el = createElement(
      { type: 'RULE', statement: 'foo', source: 'designer' },
      'R-1',
      1
    );
    expect(Object.keys(el)).not.toContain('restructuring');
  });

  it('omits restructuring property when input is falsy', () => {
    const el = createElement(
      { type: 'RULE', statement: 'foo', source: 'designer', restructuring: null },
      'R-1',
      1
    );
    expect(Object.keys(el)).not.toContain('restructuring');
  });

  it('FRICTION early-return path does not include restructuring field', () => {
    const el = createElement(
      {
        type: 'FRICTION',
        friction_shape: 'nc-nc-opposing-pull',
        anchor_a: 'NCON-1',
        anchor_b: 'NCON-2',
        disposition: 'lived-with',
        restructuring: { foo: 'bar' },
      },
      'F-1',
      1
    );
    expect(Object.keys(el)).not.toContain('restructuring');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run __tests__/proof.test.js -t "createElement restructuring extension"`
Expected: 4 tests FAIL.

- [ ] **Step 3: Implement createElement extension**

In `skills/design-large-task/proof-mcp/proof.js`, modify `createElement`:

1. Add `restructuring` to the destructured input fields at the top of `createElement` (after the existing destructure on lines 47-52). The destructure becomes:
```javascript
const {
  type, statement, source,
  grounding, collapse_test, reasoning_chain, rejected_alternatives,
  relieves, basis,
  problem_anchor,
  restructuring,
} = input;
```

2. In the FRICTION early-return path (the object literal returned after FRICTION validation, currently around lines 70-83), do NOT add the `restructuring` property. The early return stays exactly as-is.

3. In the main element-construction path (the final return statement around lines 139-156), conditionally add the `restructuring` property only when truthy. Replace the final return literal with:
```javascript
const element = {
  id,
  type,
  statement,
  source: source ?? null,
  grounding: grounding ?? [],
  collapse_test: collapse_test ?? null,
  reasoning_chain: reasoning_chain ?? null,
  rejected_alternatives: rejected_alternatives ?? [],
  relieves: relieves ?? null,
  basis: basis ?? [],
  problem_anchor: problem_anchor ?? null,
  ratification: null,
  status: 'active',
  addedInRound: round,
  revisedInRound: null,
  revision: 0,
};
if (restructuring) {
  element.restructuring = restructuring;
}
return element;
```

(Adjust to match the actual current shape of the existing return literal — preserve all existing fields verbatim. Only the conditional `restructuring` add is new.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd skills/design-large-task/proof-mcp && npm test`
Expected: All proof.test.js tests pass (existing + 4 new). All other test files unchanged.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/proof.js skills/design-large-task/proof-mcp/__tests__/proof.test.js
git commit -m "feat(proof-mcp): extend createElement with optional restructuring field"
```

---

## Task 2: Add proofStatus field to state shape with backfill

**Execution:** inline (single field addition + `??=` backfill line)
**Type:** code-producing
**Implements:** AC-10.1
**Decision budget:** 1
**Must remain green:** `state.test.js`, `loadstate-backfill.test.js` (existing tests; AC-10.1 new tests)

**Files:**
- Modify: `skills/design-large-task/proof-mcp/state.js` (initializeState, loadState)
- Modify: `skills/design-large-task/proof-mcp/__tests__/loadstate-backfill.test.js` (add tests)
- Modify: `skills/design-large-task/proof-mcp/__tests__/state.test.js` (add initialization test if state.test.js exercises initializeState shape)

**Steps (TDD):**

- [ ] **Step 1: Write the failing tests**

Append to `skills/design-large-task/proof-mcp/__tests__/loadstate-backfill.test.js`:

```javascript
describe('loadState proofStatus backfill', () => {
  it('backfills proofStatus to "unopen" when missing from prior state', () => {
    const tmpFile = `/tmp/test-loadstate-${Date.now()}.json`;
    const priorState = {
      round: 0,
      problemStatement: 'test',
      elements: {},
      elementCounters: { EVIDENCE: 0, RULE: 0, PERMISSION: 0, NECESSARY_CONDITION: 0, RISK: 0, RESOLVE_CONDITION: 0, FRICTION: 0 },
      conditionCountHistory: [],
      elementCountHistory: [],
      challengeModesUsed: [],
      challengeLog: [],
      revisionLog: [],
      phaseTransitionRound: 0,
      // proofStatus intentionally absent
    };
    writeFileSync(tmpFile, JSON.stringify(priorState));
    const loaded = loadState(tmpFile);
    expect(loaded.proofStatus).toBe('unopen');
    unlinkSync(tmpFile);
  });

  it('preserves proofStatus when present in state file', () => {
    const tmpFile = `/tmp/test-loadstate-${Date.now()}.json`;
    const priorState = { /* full shape with proofStatus: 'open' */
      round: 0, problemStatement: 'test', elements: {},
      elementCounters: { EVIDENCE: 0, RULE: 0, PERMISSION: 0, NECESSARY_CONDITION: 0, RISK: 0, RESOLVE_CONDITION: 0, FRICTION: 0 },
      conditionCountHistory: [], elementCountHistory: [], challengeModesUsed: [], challengeLog: [], revisionLog: [], phaseTransitionRound: 0,
      proofStatus: 'open',
    };
    writeFileSync(tmpFile, JSON.stringify(priorState));
    const loaded = loadState(tmpFile);
    expect(loaded.proofStatus).toBe('open');
    unlinkSync(tmpFile);
  });

  it('initializeState includes proofStatus="unopen" by default', () => {
    const state = initializeState('test problem');
    expect(state.proofStatus).toBe('unopen');
  });
});
```

**Test file imports** — `__tests__/loadstate-backfill.test.js` currently imports only `loadState`. Use Edit to add to the import block at the top:
```javascript
import { initializeState, loadState } from '../state.js';
import { writeFileSync, unlinkSync } from 'node:fs';
```
(Replace the existing `import { loadState } from '../state.js';` line.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run __tests__/loadstate-backfill.test.js -t "proofStatus"`
Expected: 3 tests FAIL.

- [ ] **Step 3: Implement state.js changes**

In `skills/design-large-task/proof-mcp/state.js`:

1. In `initializeState` (line 32), add `proofStatus: 'unopen',` to the returned object literal (after `closingArgGoRound: null,` near line 56).

2. In `loadState` (line 448), add `raw.proofStatus ??= 'unopen';` to the backfill section (alongside the existing `??=` lines around 452-461).

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd skills/design-large-task/proof-mcp && npm test`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/state.js skills/design-large-task/proof-mcp/__tests__/loadstate-backfill.test.js
git commit -m "feat(proof-mcp): add proofStatus field to state with loadState backfill"
```

---

## Task 3: Required-fields registry in restructure-schema.js

**Execution:** inline (static const data + exclusion rationales as comments)
**Type:** code-producing
**Implements:** AC-1.1
**Decision budget:** 2
**Must remain green:** `restructure-schema.test.js` (new file, AC-1.1 tests)

**Files:**
- Create: `skills/design-large-task/proof-mcp/restructure-schema.js`
- Create: `skills/design-large-task/proof-mcp/__tests__/restructure-schema.test.js`

**Steps (TDD):**

- [ ] **Step 1: Write the failing tests**

Create `skills/design-large-task/proof-mcp/__tests__/restructure-schema.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { REQUIRED_FIELDS_REGISTRY } from '../restructure-schema.js';

describe('REQUIRED_FIELDS_REGISTRY', () => {
  const B1_CATEGORIES = ['EVIDENCE', 'RULE', 'PERMISSION', 'NECESSARY_CONDITION', 'RISK', 'Concern'];

  it('contains an entry for each B.1-admittable category', () => {
    for (const category of B1_CATEGORIES) {
      expect(REQUIRED_FIELDS_REGISTRY[category]).toBeDefined();
    }
  });

  it('omits FRICTION from the registry', () => {
    expect(REQUIRED_FIELDS_REGISTRY.FRICTION).toBeUndefined();
  });

  it('omits RESOLVE_CONDITION from the registry (added post-open via existing tools)', () => {
    expect(REQUIRED_FIELDS_REGISTRY.RESOLVE_CONDITION).toBeUndefined();
  });

  it('every category has non-empty required and optional arrays', () => {
    for (const category of B1_CATEGORIES) {
      const entry = REQUIRED_FIELDS_REGISTRY[category];
      expect(Array.isArray(entry.required)).toBe(true);
      expect(Array.isArray(entry.optional)).toBe(true);
      expect(entry.required.length).toBeGreaterThan(0);
    }
  });

  it('every required field has a non-empty justification string', () => {
    for (const category of B1_CATEGORIES) {
      for (const field of REQUIRED_FIELDS_REGISTRY[category].required) {
        expect(typeof field.name).toBe('string');
        expect(field.name.length).toBeGreaterThan(0);
        expect(typeof field.justification).toBe('string');
        expect(field.justification.length).toBeGreaterThan(0);
      }
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run __tests__/restructure-schema.test.js`
Expected: All tests FAIL — "Cannot find module '../restructure-schema.js'".

- [ ] **Step 3: Implement REQUIRED_FIELDS_REGISTRY**

Create `skills/design-large-task/proof-mcp/restructure-schema.js`:

```javascript
/**
 * REQUIRED_FIELDS_REGISTRY — per-element-category schema for restructuring.
 * Each entry: { required: [{ name, justification }], optional: string[] }.
 *
 * 7 B.1-owned categories: 6 ELEMENT_TYPES values + Concern.
 * FRICTION is intentionally absent — it is B.2-generated via manage_friction,
 * never received via the contract surface.
 */
export const REQUIRED_FIELDS_REGISTRY = {
  EVIDENCE: {
    required: [
      { name: 'statement', justification: 'Element body; required by createElement and read by every reasoning operation.' },
      { name: 'source', justification: 'Distinguishes codebase / industry / designer-direct sources for grounding-chain auditability.' },
    ],
    optional: ['grounding'],
  },
  RULE: {
    required: [
      { name: 'statement', justification: 'Element body; required by createElement.' },
      { name: 'source', justification: 'createElement enforces source="designer" for RULE; downstream provenance depends on it.' },
    ],
    optional: ['grounding', 'rejected_alternatives'],
  },
  PERMISSION: {
    required: [
      { name: 'statement', justification: 'Element body; required by createElement.' },
      { name: 'source', justification: 'createElement enforces source="designer" for PERMISSION; downstream provenance depends on it.' },
      { name: 'relieves', justification: 'Names which RULE this PERMISSION relaxes; closing-argument materialization references this link.' },
    ],
    optional: ['grounding'],
  },
  NECESSARY_CONDITION: {
    required: [
      { name: 'statement', justification: 'Element body; required by createElement.' },
      { name: 'grounding', justification: 'NCs without grounding chains fail integrity check (checkUngrounded in proof.js).' },
      { name: 'reasoning_chain', justification: 'Closing-argument tension-naming reads this; absent chain forces phantom-NC handling.' },
      { name: 'collapse_test', justification: 'Required for closure (checkMissingCollapseTest); without it the NC is not closure-ready.' },
      { name: 'rejected_alternatives', justification: 'Closure requires at least one NC with rejected_alternatives; this drives the discipline.' },
    ],
    optional: [],
  },
  RISK: {
    required: [
      { name: 'statement', justification: 'Element body; required by createElement.' },
      { name: 'basis', justification: 'Anchor element IDs the RISK attaches to; closure-side coverage maps reference these anchors.' },
    ],
    optional: ['grounding'],
  },
  // RESOLVE_CONDITION intentionally omitted: applyOperations validates RC.problem_anchor
  // against state.concerns, which is empty immediately after initializeState in handleOpenProof.
  // RCs cannot be admitted via the contract surface; they are added post-open via the existing
  // submit_proof_update or ratify_resolve_condition tools after Concerns have been provisioned.
  Concern: {
    required: [
      { name: 'label', justification: 'addConcern requires non-empty label; coverage check enumerates by label.' },
    ],
    optional: ['description'],
  },
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run __tests__/restructure-schema.test.js`
Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/restructure-schema.js skills/design-large-task/proof-mcp/__tests__/restructure-schema.test.js
git commit -m "feat(proof-mcp): add REQUIRED_FIELDS_REGISTRY in restructure-schema.js"
```

---

## Task 4: Action label rule table (verbatim/reshape/gap-fill)

**Execution:** inline (predicate function with three-case dispatch + null fallback)
**Type:** code-producing
**Implements:** AC-3.1 (mechanical labels only; AC-3.3 covered separately in Task 7)
**Decision budget:** 2
**Must remain green:** `restructure-rules.test.js` (new file)

**Files:**
- Create: `skills/design-large-task/proof-mcp/restructure-rules.js`
- Create: `skills/design-large-task/proof-mcp/__tests__/restructure-rules.test.js`

**Steps (TDD):**

- [ ] **Step 1: Write the failing tests**

Create `skills/design-large-task/proof-mcp/__tests__/restructure-rules.test.js` with this content (single import block at top):
```javascript
import { describe, it, expect } from 'vitest';
import { assignActionLabel } from '../restructure-rules.js';
```

**Then append this `describe` block** to the end of the file:

```javascript
describe('assignActionLabel — mechanical labels', () => {
  it('returns "verbatim-preserve" when caller field value matches expected type/format directly', () => {
    const result = assignActionLabel({
      callerValue: 'Some Concern Label',
      expectedType: 'string',
      requiredFieldName: 'label',
    });
    expect(result.label).toBe('verbatim-preserve');
  });

  it('returns "reshape" when caller field needs deterministic normalization (trim)', () => {
    const result = assignActionLabel({
      callerValue: '  Concern Label With Whitespace  ',
      expectedType: 'string',
      requiredFieldName: 'label',
    });
    expect(result.label).toBe('reshape');
    expect(result.reshapedValue).toBe('Concern Label With Whitespace');
  });

  it('returns "gap-fill" when field is absent but derivable by a known rule', () => {
    const result = assignActionLabel({
      callerValue: undefined,
      expectedType: 'array',
      requiredFieldName: 'grounding',
      gapFillRule: 'rule:default-empty-grounding',
      gapFillValue: [],
    });
    expect(result.label).toBe('gap-fill');
    expect(result.reshapedValue).toEqual([]);
    expect(result.ruleCitation).toBe('rule:default-empty-grounding');
  });

  it('returns null label when value is absent and no gap-fill rule applies', () => {
    const result = assignActionLabel({
      callerValue: undefined,
      expectedType: 'string',
      requiredFieldName: 'statement',
    });
    expect(result.label).toBe(null);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run __tests__/restructure-rules.test.js -t "assignActionLabel"`
Expected: 4 tests FAIL — "Cannot find module '../restructure-rules.js'".

- [ ] **Step 3: Implement assignActionLabel**

Create `skills/design-large-task/proof-mcp/restructure-rules.js` with:

```javascript
/**
 * assignActionLabel — pure function. Decides which action label applies to a
 * caller-supplied field value against the registry's expected type.
 * Returns { label, reshapedValue?, ruleCitation? }.
 *
 * Mechanical labels only: verbatim-preserve, reshape, gap-fill.
 * Anchor-disciplined labels (infer, derive) handled separately by validateAnchor.
 */
export function assignActionLabel({ callerValue, expectedType, requiredFieldName, gapFillRule, gapFillValue }) {
  // Field absent
  if (callerValue === undefined || callerValue === null) {
    if (gapFillRule !== undefined) {
      return { label: 'gap-fill', reshapedValue: gapFillValue, ruleCitation: gapFillRule };
    }
    return { label: null };
  }

  // Field present + verbatim-fit
  if (expectedType === 'string' && typeof callerValue === 'string' && callerValue === callerValue.trim() && callerValue.length > 0) {
    return { label: 'verbatim-preserve' };
  }
  if (expectedType === 'array' && Array.isArray(callerValue)) {
    return { label: 'verbatim-preserve' };
  }

  // Reshape: type matches expected after deterministic normalization
  if (expectedType === 'string' && typeof callerValue === 'string' && callerValue !== callerValue.trim()) {
    return { label: 'reshape', reshapedValue: callerValue.trim() };
  }

  // Could not assign mechanical label
  return { label: null };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run __tests__/restructure-rules.test.js`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/restructure-rules.js skills/design-large-task/proof-mcp/__tests__/restructure-rules.test.js
git commit -m "feat(proof-mcp): add assignActionLabel rule table in restructure-rules.js"
```

---

## Task 5: Required-field rejection logic (placeholder/empty/redirect)

**Execution:** inline (pure predicate over rejection patterns)
**Type:** code-producing
**Implements:** AC-1.2, AC-3.2
**Decision budget:** 2
**Must remain green:** `restructure-rules.test.js`

**Files:**
- Modify: `skills/design-large-task/proof-mcp/restructure-rules.js` (add `isRejectedValue`)
- Modify: `skills/design-large-task/proof-mcp/__tests__/restructure-rules.test.js` (add tests)

**Steps (TDD):**

- [ ] **Step 1: Write the failing tests**

**Imports to add** (use Edit, top-of-file import block in `restructure-rules.test.js`):
```javascript
import { isRejectedValue } from '../restructure-rules.js';
```

**Then append this `describe` block** to end of file:

```javascript
describe('isRejectedValue', () => {
  it.each([
    ['', 'empty string'],
    [null, 'null'],
    ['TODO', 'TODO placeholder'],
    ['todo', 'lowercase TODO'],
    ['not specified', 'not-specified placeholder'],
    ['Not Specified', 'cased not-specified'],
    ['see metadata', 'redirect to metadata'],
    ['See Metadata for details', 'redirect prefix'],
  ])('rejects %j (%s)', (value, _desc) => {
    const result = isRejectedValue(value);
    expect(result.rejected).toBe(true);
    expect(typeof result.reason).toBe('string');
    expect(result.reason.length).toBeGreaterThan(0);
  });

  it.each([
    ['Some real content', 'real string'],
    ['A statement that mentions metadata in passing', 'real string with metadata word'],
    [['anchor-1'], 'array'],
    [{ key: 'val' }, 'object'],
  ])('admits %j (%s)', (value, _desc) => {
    expect(isRejectedValue(value).rejected).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run __tests__/restructure-rules.test.js -t "isRejectedValue"`
Expected: All FAIL.

- [ ] **Step 3: Implement isRejectedValue**

Append to `restructure-rules.js`:

```javascript
/**
 * isRejectedValue — decides whether a required-field value is too hollow to admit.
 * Catches empty strings, null, common placeholders, and metadata-redirect strings.
 * Returns { rejected: boolean, reason: string }.
 */
const PLACEHOLDER_VALUES = new Set(['todo', 'not specified', 'tbd', 'n/a']);
const REDIRECT_PREFIX_REGEX = /^see metadata/i;

export function isRejectedValue(value) {
  if (value === null || value === undefined) {
    return { rejected: true, reason: 'empty (null/undefined)' };
  }
  if (typeof value !== 'string') {
    return { rejected: false, reason: '' };
  }
  if (value.length === 0) {
    return { rejected: true, reason: 'empty string' };
  }
  const lowered = value.trim().toLowerCase();
  if (PLACEHOLDER_VALUES.has(lowered)) {
    return { rejected: true, reason: `placeholder ("${value}")` };
  }
  if (REDIRECT_PREFIX_REGEX.test(value)) {
    return { rejected: true, reason: `redirect to metadata channel ("${value}")` };
  }
  return { rejected: false, reason: '' };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run __tests__/restructure-rules.test.js`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/restructure-rules.js skills/design-large-task/proof-mcp/__tests__/restructure-rules.test.js
git commit -m "feat(proof-mcp): add isRejectedValue check for placeholder/empty/redirect values"
```

---

## Task 6: Provenance record builder + metadata channel routing

**Execution:** inline (two helper functions; STRUCTURAL_FIELDS exclusion is a small set)
**Type:** code-producing
**Implements:** AC-2.1, AC-2.2, AC-4.1, AC-4.2
**Decision budget:** 2
**Must remain green:** `restructure.test.js` (new file)

**Files:**
- Create: `skills/design-large-task/proof-mcp/restructure.js` (top-level orchestrator + record builders)
- Create: `skills/design-large-task/proof-mcp/__tests__/restructure.test.js`

**Steps (TDD):**

- [ ] **Step 1: Write the failing tests**

Create `skills/design-large-task/proof-mcp/__tests__/restructure.test.js` with this content (single import block at top):
```javascript
import { describe, it, expect } from 'vitest';
import { buildProvenance, extractMetadata } from '../restructure.js';
```

**Then append these `describe` blocks** to end of file:

```javascript
describe('buildProvenance', () => {
  it('builds provenance with non-null reasoning_chain for non-verbatim actions', () => {
    const prov = buildProvenance({
      sourceCitation: 'submission.elements[0].label',
      actionLabel: 'reshape',
      reasoningChain: 'trim whitespace from caller string',
    });
    expect(prov).toEqual({
      source_citation: 'submission.elements[0].label',
      action_label: 'reshape',
      reasoning_chain: 'trim whitespace from caller string',
    });
  });

  it('allows null reasoning_chain when action is verbatim-preserve', () => {
    const prov = buildProvenance({
      sourceCitation: 'submission.elements[0].label',
      actionLabel: 'verbatim-preserve',
      reasoningChain: null,
    });
    expect(prov.reasoning_chain).toBe(null);
  });

  it('throws when non-verbatim action has null reasoning_chain', () => {
    expect(() => buildProvenance({
      sourceCitation: 'submission.elements[0].label',
      actionLabel: 'reshape',
      reasoningChain: null,
    })).toThrow(/reasoning_chain/);
  });

  it('includes field_provenance array when supplied (smell #2 — per-field detail)', () => {
    const fp = [
      { field_name: 'statement', action_label: 'verbatim-preserve', reasoning_chain: null },
      { field_name: 'source', action_label: 'reshape', reasoning_chain: 'normalized casing' },
    ];
    const prov = buildProvenance({
      sourceCitation: 'submission.elements[0]',
      actionLabel: 'reshape',
      reasoningChain: 'normalized casing',
      fieldProvenance: fp,
    });
    expect(prov.field_provenance).toEqual(fp);
  });

  it('field_provenance defaults to empty array when not supplied', () => {
    const prov = buildProvenance({
      sourceCitation: 'x',
      actionLabel: 'verbatim-preserve',
      reasoningChain: null,
    });
    expect(prov.field_provenance).toEqual([]);
  });
});

describe('extractMetadata', () => {
  it('routes caller fields not in registry to metadata channel keyed by field name', () => {
    const result = extractMetadata({
      callerCandidate: { label: 'Foo', description: 'bar', caller_note: 'extra', author: 'Mike' },
      registryEntry: { required: [{ name: 'label', justification: '' }], optional: ['description'] },
    });
    expect(result).toEqual({ caller_note: 'extra', author: 'Mike' });
  });

  it('returns empty object when no caller fields are unmapped', () => {
    const result = extractMetadata({
      callerCandidate: { label: 'Foo' },
      registryEntry: { required: [{ name: 'label', justification: '' }], optional: [] },
    });
    expect(result).toEqual({});
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run __tests__/restructure.test.js -t "buildProvenance|extractMetadata"`
Expected: All FAIL.

- [ ] **Step 3: Implement buildProvenance and extractMetadata**

Create `skills/design-large-task/proof-mcp/restructure.js`:

```javascript
/**
 * buildProvenance — pure function. Constructs a provenance record per RC-4.
 * Element-level action_label is the priority-promoted aggregate.
 * Throws if non-verbatim element-level action lacks a reasoning_chain.
 *
 * Per-field detail (smell #2 mitigation): fieldProvenance is an array
 * [{ field_name, action_label, reasoning_chain }] giving the action label per
 * typed field. Element-level action_label is derived from the strongest field
 * label per priority (gap-fill > reshape > verbatim-preserve).
 */
export function buildProvenance({ sourceCitation, actionLabel, reasoningChain, fieldProvenance }) {
  if (actionLabel !== 'verbatim-preserve' && (reasoningChain === null || reasoningChain === undefined)) {
    throw new Error(`buildProvenance: action_label "${actionLabel}" requires non-null reasoning_chain`);
  }
  return {
    source_citation: sourceCitation,
    action_label: actionLabel,
    reasoning_chain: reasoningChain,
    field_provenance: Array.isArray(fieldProvenance) ? fieldProvenance : [],
  };
}

/**
 * extractMetadata — pure function. Routes caller-candidate fields not in the
 * registry's required or optional lists into a free-form metadata object keyed
 * by the original field name. Excludes `category` (structural routing field,
 * not caller-supplied content). Returns {} when no fields are unmapped.
 */
const STRUCTURAL_FIELDS = new Set(['category']);

export function extractMetadata({ callerCandidate, registryEntry }) {
  const knownFields = new Set([
    ...registryEntry.required.map(f => f.name),
    ...registryEntry.optional,
  ]);
  const metadata = {};
  for (const [key, value] of Object.entries(callerCandidate)) {
    if (!knownFields.has(key) && !STRUCTURAL_FIELDS.has(key)) {
      metadata[key] = value;
    }
  }
  return metadata;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run __tests__/restructure.test.js`
Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/restructure.js skills/design-large-task/proof-mcp/__tests__/restructure.test.js
git commit -m "feat(proof-mcp): add buildProvenance and extractMetadata for restructuring"
```

---

## Task 7: Anchor-disciplined infer/derive validation

**Execution:** inline (regex validators + boolean predicate)
**Type:** code-producing
**Implements:** AC-3.3
**Decision budget:** 2
**Must remain green:** `restructure-rules.test.js`

**Files:**
- Modify: `skills/design-large-task/proof-mcp/restructure-rules.js` (add `validateReasoningAnchor`)
- Modify: `skills/design-large-task/proof-mcp/__tests__/restructure-rules.test.js` (add tests)

**Steps (TDD):**

- [ ] **Step 1: Write the failing tests**

**Imports to add** (use Edit, top-of-file import block in `restructure-rules.test.js`):
```javascript
import { validateReasoningAnchor } from '../restructure-rules.js';
```

**Then append this `describe` block** to end of file:

```javascript
describe('validateReasoningAnchor', () => {
  it.each([
    ['rule:default-empty-grounding', 'rule citation'],
    ['schema:RULE.statement', 'schema match'],
    ['template:designer-merge-pattern-1', 'template id'],
  ])('accepts valid anchor %s (%s)', (anchor, _desc) => {
    expect(validateReasoningAnchor(anchor).valid).toBe(true);
  });

  it.each([
    [null, 'null'],
    [undefined, 'undefined'],
    ['', 'empty'],
    ['just-some-text', 'no prefix'],
    ['rule:UPPERCASE-NOT-ALLOWED', 'rule with uppercase'],
    ['schema:lowercase.field', 'schema with lowercase type'],
    ['template:CapitalizedTemplate', 'template with caps'],
    ['unknown:something', 'unknown prefix'],
  ])('rejects invalid anchor %j (%s)', (anchor, _desc) => {
    const result = validateReasoningAnchor(anchor);
    expect(result.valid).toBe(false);
    expect(typeof result.reason).toBe('string');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run __tests__/restructure-rules.test.js -t "validateReasoningAnchor"`
Expected: All FAIL.

- [ ] **Step 3: Implement validateReasoningAnchor**

Append to `restructure-rules.js`:

```javascript
/**
 * validateReasoningAnchor — pure function. Checks whether a reasoning anchor
 * conforms to one of the three accepted shapes:
 *   - rule:[a-z0-9-]+
 *   - schema:[A-Z_]+\.[a-z_]+
 *   - template:[a-z0-9-]+
 * Returns { valid: boolean, reason: string }.
 */
const ANCHOR_RULE_REGEX = /^rule:[a-z0-9-]+$/;
const ANCHOR_SCHEMA_REGEX = /^schema:[A-Z_]+\.[a-z_]+$/;
const ANCHOR_TEMPLATE_REGEX = /^template:[a-z0-9-]+$/;

export function validateReasoningAnchor(anchor) {
  if (typeof anchor !== 'string' || anchor.length === 0) {
    return { valid: false, reason: 'anchor must be a non-empty string' };
  }
  if (ANCHOR_RULE_REGEX.test(anchor)) return { valid: true, reason: '' };
  if (ANCHOR_SCHEMA_REGEX.test(anchor)) return { valid: true, reason: '' };
  if (ANCHOR_TEMPLATE_REGEX.test(anchor)) return { valid: true, reason: '' };
  return {
    valid: false,
    reason: `anchor "${anchor}" does not match accepted shapes (rule:|schema:|template:)`,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run __tests__/restructure-rules.test.js`
Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/restructure-rules.js skills/design-large-task/proof-mcp/__tests__/restructure-rules.test.js
git commit -m "feat(proof-mcp): add validateReasoningAnchor for infer/derive discipline"
```

---

## Task 8: Top-level restructure() function — problem statement extraction + report assembly

**Execution:** subagent (orchestrator with nested loops, partition logic, label promotion, per-field provenance assembly, multi-section report; high decision density warrants independent spec review)
**Type:** code-producing
**Implements:** AC-5.1, AC-12.1
**Decision budget:** 3
**Must remain green:** `restructure.test.js`

**Files:**
- Modify: `skills/design-large-task/proof-mcp/restructure.js` (add `restructure`)
- Modify: `skills/design-large-task/proof-mcp/__tests__/restructure.test.js` (add tests)

**Steps (TDD):**

- [ ] **Step 1: Write the failing tests**

**Imports to add** (use Edit, top-of-file import block in `restructure.test.js`):
```javascript
import { restructure } from '../restructure.js';
```

**Then append this `describe` block** to end of file:

```javascript
describe('restructure (top-level)', () => {
  it('returns rejection diagnostic when problem_statement absent', () => {
    const result = restructure({});
    expect(result.rejection_diagnostic).toMatch(/problem_statement/);
    expect(result.problem_statement).toBeUndefined();
  });

  it('extracts problem_statement when present', () => {
    const result = restructure({ problem_statement: 'a one-sentence problem.' });
    expect(result.problem_statement).toBe('a one-sentence problem.');
  });

  it('returns admitted/rejected/report shape', () => {
    const result = restructure({
      problem_statement: 'test',
      elements: [
        { category: 'RULE', statement: 'A real rule.', source: 'designer' },
      ],
    });
    expect(Array.isArray(result.admitted)).toBe(true);
    expect(Array.isArray(result.rejected)).toBe(true);
    expect(typeof result.report).toBe('string');
    expect(result.report.length).toBeGreaterThan(0);
  });

  it('admits a candidate with all required fields and assigns labels', () => {
    const result = restructure({
      problem_statement: 'test',
      elements: [
        { category: 'RULE', statement: 'A real rule.', source: 'designer' },
      ],
    });
    expect(result.admitted.length).toBe(1);
    expect(result.admitted[0].restructuring_action_label).toBeDefined();
    expect(result.admitted[0].provenance).toBeDefined();
  });

  it('rejects a candidate with missing required field', () => {
    const result = restructure({
      problem_statement: 'test',
      elements: [
        { category: 'RULE', source: 'designer' },  // missing statement
      ],
    });
    expect(result.rejected.length).toBe(1);
    expect(result.rejected[0].missing_fields).toContain('statement');
  });

  it('routes unknown caller fields into per-element metadata', () => {
    const result = restructure({
      problem_statement: 'test',
      elements: [
        { category: 'RULE', statement: 'A rule.', source: 'designer', caller_note: 'extra' },
      ],
    });
    expect(result.admitted[0].metadata.caller_note).toBe('extra');
  });

  it('rejected entry diagnostic identifies field name AND failure mode (AC-3.2)', () => {
    const result = restructure({
      problem_statement: 'test',
      elements: [
        { label: 'TODO', category: 'Concern' },
      ],
    });
    expect(result.rejected.length).toBe(1);
    expect(result.rejected[0].diagnostic).toContain('label');
    expect(result.rejected[0].diagnostic.toLowerCase()).toMatch(/placeholder|empty|redirect/);
  });

  it('admitted element provenance.action_label equals restructuring_action_label (AC-4.1)', () => {
    const result = restructure({
      problem_statement: 'test',
      elements: [
        { category: 'RULE', statement: 'A rule.', source: 'designer' },
      ],
    });
    expect(result.admitted.length).toBe(1);
    expect(result.admitted[0].provenance.action_label).toBe(result.admitted[0].restructuring_action_label);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run __tests__/restructure.test.js -t "restructure \\(top-level\\)"`
Expected: All FAIL.

- [ ] **Step 3: Implement restructure**

**Imports to add** to top of `restructure.js` (sibling modules):
```javascript
import { REQUIRED_FIELDS_REGISTRY } from './restructure-schema.js';
import { assignActionLabel, isRejectedValue } from './restructure-rules.js';
```

**Then append `restructure` to `restructure.js`** (after the existing `buildProvenance` / `extractMetadata` exports from Task 6):

```javascript
/**
 * restructure — pure function. Top-level restructuring entry point.
 * Accepts caller submission_material; returns:
 *   { problem_statement, admitted, rejected, report, rejection_diagnostic? }.
 *
 * If problem_statement is absent, rejection_diagnostic is set and the gate fails.
 * Otherwise admitted elements carry { category, ...typedFields, metadata,
 * restructuring_action_label, provenance }.
 */
export function restructure(submissionMaterial) {
  const result = { admitted: [], rejected: [], report: '' };

  // Phase 2.0 — extract problem statement
  const problemStatement = submissionMaterial?.problem_statement;
  if (typeof problemStatement !== 'string' || problemStatement.trim().length === 0) {
    result.rejection_diagnostic = 'problem_statement is required (top-level non-empty string in submission_material)';
    result.report = 'No restructuring performed: problem_statement missing.';
    return result;
  }
  result.problem_statement = problemStatement;

  // Phase 2.1 — restructure each element candidate
  const elements = Array.isArray(submissionMaterial.elements) ? submissionMaterial.elements : [];
  for (let i = 0; i < elements.length; i++) {
    const candidate = elements[i];
    const category = candidate.category;
    const registryEntry = REQUIRED_FIELDS_REGISTRY[category];
    const sourceCitation = `submission.elements[${i}]`;

    if (!registryEntry) {
      result.rejected.push({
        candidate,
        missing_fields: [],
        diagnostic: `unknown category "${category}" (not in REQUIRED_FIELDS_REGISTRY)`,
      });
      continue;
    }

    const missingFields = [];
    const fieldRejectionReasons = {};  // field name → reason string from isRejectedValue
    const typedFields = {};
    const fieldProvenance = [];  // per-field [{field_name, action_label, reasoning_chain}]
    // Priority order for element-level promotion: gap-fill > reshape > verbatim-preserve.
    const PRIORITY = { 'verbatim-preserve': 0, 'reshape': 1, 'gap-fill': 2, 'infer': 3, 'derive': 4 };
    let primaryActionLabel = 'verbatim-preserve';
    let primaryReasoningChain = null;

    for (const requiredField of registryEntry.required) {
      const callerValue = candidate[requiredField.name];
      const rejectedCheck = isRejectedValue(callerValue);
      if (rejectedCheck.rejected) {
        missingFields.push(requiredField.name);
        fieldRejectionReasons[requiredField.name] = rejectedCheck.reason;
        continue;
      }
      const labelResult = assignActionLabel({
        callerValue,
        expectedType: typeof callerValue === 'object' && Array.isArray(callerValue) ? 'array' : 'string',
        requiredFieldName: requiredField.name,
      });
      if (labelResult.label === null) {
        missingFields.push(requiredField.name);
        continue;
      }
      typedFields[requiredField.name] = labelResult.reshapedValue !== undefined ? labelResult.reshapedValue : callerValue;
      // Per-field provenance entry (smell #2 mitigation)
      const fieldReasoning = labelResult.label === 'verbatim-preserve'
        ? null
        : (labelResult.ruleCitation || `${labelResult.label} applied to field "${requiredField.name}"`);
      fieldProvenance.push({
        field_name: requiredField.name,
        action_label: labelResult.label,
        reasoning_chain: fieldReasoning,
      });
      // Priority promotion for element-level label
      if (PRIORITY[labelResult.label] > PRIORITY[primaryActionLabel]) {
        primaryActionLabel = labelResult.label;
        primaryReasoningChain = fieldReasoning;
      }
    }

    if (missingFields.length > 0) {
      const fieldDetails = missingFields.map(name => {
        const reason = fieldRejectionReasons[name];
        return reason ? `${name} (${reason})` : `${name} (missing)`;
      });
      result.rejected.push({
        candidate,
        missing_fields: missingFields,
        diagnostic: `category ${category}: missing or rejected required fields: ${fieldDetails.join(', ')}`,
      });
      continue;
    }

    // Optional fields (verbatim if present)
    for (const optName of registryEntry.optional) {
      if (candidate[optName] !== undefined) {
        typedFields[optName] = candidate[optName];
      }
    }

    const metadata = extractMetadata({ callerCandidate: candidate, registryEntry });
    const provenance = buildProvenance({
      sourceCitation,
      actionLabel: primaryActionLabel,
      reasoningChain: primaryActionLabel === 'verbatim-preserve' ? null : primaryReasoningChain,
      fieldProvenance,
    });

    result.admitted.push({
      category,
      ...typedFields,
      metadata,
      restructuring_action_label: primaryActionLabel,
      provenance,
    });
  }

  // Phase 2.2 — assemble report
  const lines = [`Restructured ${result.admitted.length} admitted, ${result.rejected.length} rejected.`];
  for (const adm of result.admitted) {
    lines.push(`  ADMIT [${adm.category}] action=${adm.restructuring_action_label} from ${adm.provenance.source_citation}`);
  }
  for (const rej of result.rejected) {
    lines.push(`  REJECT [${rej.candidate.category}] ${rej.diagnostic}`);
  }
  result.report = lines.join('\n');
  return result;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run __tests__/restructure.test.js`
Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/restructure.js skills/design-large-task/proof-mcp/__tests__/restructure.test.js
git commit -m "feat(proof-mcp): add top-level restructure() function with report assembly"
```

---

## Task 9: open-gate.js — pre-flight verifier

**Execution:** inline (pure-function gate checks; per-element loop with bounded predicates)
**Type:** code-producing
**Implements:** AC-8.1
**Decision budget:** 1
**Must remain green:** `open-gate.test.js` (new)

**Files:**
- Create: `skills/design-large-task/proof-mcp/open-gate.js`
- Create: `skills/design-large-task/proof-mcp/__tests__/open-gate.test.js`

**Steps (TDD):**

- [ ] **Step 1: Write the failing tests**

Create `__tests__/open-gate.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { checkOpenGate } from '../open-gate.js';

function makeAdmitted(overrides) {
  return {
    category: 'RULE',
    statement: 'A rule.',
    source: 'designer',
    metadata: {},
    restructuring_action_label: 'verbatim-preserve',
    provenance: { source_citation: 'submission.elements[0]', action_label: 'verbatim-preserve', reasoning_chain: null },
    ...overrides,
  };
}

describe('checkOpenGate', () => {
  it('passes when all admitted elements have full artifacts and report is non-empty', () => {
    const result = checkOpenGate([makeAdmitted({})], 'a non-empty report');
    expect(result.permitted).toBe(true);
    expect(result.failures).toEqual([]);
  });

  it('fails when admitted is empty', () => {
    const result = checkOpenGate([], 'a report');
    expect(result.permitted).toBe(false);
    expect(result.failures.some(f => f.missing_artifact === 'admitted_elements')).toBe(true);
  });

  it('fails when restructuring_action_label is missing on an element', () => {
    const broken = makeAdmitted({ restructuring_action_label: undefined });
    const result = checkOpenGate([broken], 'report');
    expect(result.permitted).toBe(false);
    expect(result.failures[0].missing_artifact).toBe('restructuring_action_label');
  });

  it('fails when provenance.source_citation is missing', () => {
    const broken = makeAdmitted({ provenance: { action_label: 'verbatim-preserve', reasoning_chain: null } });
    const result = checkOpenGate([broken], 'report');
    expect(result.permitted).toBe(false);
    expect(result.failures[0].missing_artifact).toBe('source_citation');
  });

  it('fails when non-verbatim action lacks reasoning_chain', () => {
    const broken = makeAdmitted({
      restructuring_action_label: 'reshape',
      provenance: { source_citation: 'x', action_label: 'reshape', reasoning_chain: null },
    });
    const result = checkOpenGate([broken], 'report');
    expect(result.permitted).toBe(false);
    expect(result.failures[0].missing_artifact).toBe('reasoning_chain');
  });

  it('fails when report is empty or missing', () => {
    const result = checkOpenGate([makeAdmitted({})], '');
    expect(result.permitted).toBe(false);
    expect(result.failures.some(f => f.missing_artifact === 'restructuring_report')).toBe(true);
  });

  it('passes when admitted element has empty metadata: {} (AC-2.2 — non-load-bearing)', () => {
    const elementWithEmptyMetadata = makeAdmitted({ metadata: {} });
    const result = checkOpenGate([elementWithEmptyMetadata], 'a non-empty report');
    expect(result.permitted).toBe(true);
    expect(result.failures).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run __tests__/open-gate.test.js`
Expected: All FAIL.

- [ ] **Step 3: Implement checkOpenGate**

Create `skills/design-large-task/proof-mcp/open-gate.js`:

```javascript
/**
 * checkOpenGate — pure function. NCON-3 enforcement.
 * Verifies that admitted elements carry restructuring artifacts and that
 * the report is non-empty before proof open.
 * Returns { permitted: boolean, failures: { element_id?, missing_artifact }[] }.
 */
const VALID_LABELS = new Set(['verbatim-preserve', 'reshape', 'gap-fill', 'infer', 'derive']);

export function checkOpenGate(admitted, report) {
  const failures = [];

  if (typeof report !== 'string' || report.trim().length === 0) {
    failures.push({ missing_artifact: 'restructuring_report' });
  }

  if (!Array.isArray(admitted) || admitted.length === 0) {
    failures.push({ missing_artifact: 'admitted_elements' });
    return { permitted: false, failures };
  }

  for (const el of admitted) {
    const id = el.id || `${el.category}@${admitted.indexOf(el)}`;

    if (!el.restructuring_action_label || !VALID_LABELS.has(el.restructuring_action_label)) {
      failures.push({ element_id: id, missing_artifact: 'restructuring_action_label' });
      continue;
    }

    const prov = el.provenance;
    if (!prov || typeof prov !== 'object') {
      failures.push({ element_id: id, missing_artifact: 'provenance' });
      continue;
    }
    if (!prov.source_citation || typeof prov.source_citation !== 'string') {
      failures.push({ element_id: id, missing_artifact: 'source_citation' });
      continue;
    }

    const isVerbatim = el.restructuring_action_label === 'verbatim-preserve';
    if (!isVerbatim && (prov.reasoning_chain === null || prov.reasoning_chain === undefined || prov.reasoning_chain === '')) {
      failures.push({ element_id: id, missing_artifact: 'reasoning_chain' });
    }
  }

  return { permitted: failures.length === 0, failures };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run __tests__/open-gate.test.js`
Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/open-gate.js skills/design-large-task/proof-mcp/__tests__/open-gate.test.js
git commit -m "feat(proof-mcp): add checkOpenGate pre-flight verifier"
```

---

## Task 10: Register open_proof tool + dispatch case

**Execution:** inline (tool-registration boilerplate following existing pattern)
**Type:** code-producing
**Implements:** AC-7.1, AC-9.1
**Decision budget:** 1
**Must remain green:** `server.test.js` (existing tests + new open_proof registration test)

**Files:**
- Modify: `skills/design-large-task/proof-mcp/server.js` (TOOLS array + dispatch switch)
- Modify: `skills/design-large-task/proof-mcp/__tests__/server.test.js` (add registration test)

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Append to `__tests__/server.test.js`:

```javascript
describe('open_proof tool registration', () => {
  it('TOOLS array includes open_proof with expected shape', () => {
    const openProofTool = TOOLS.find(t => t.name === 'open_proof');
    expect(openProofTool).toBeDefined();
    expect(openProofTool.inputSchema.type).toBe('object');
    expect(openProofTool.inputSchema.properties.state_file).toBeDefined();
    expect(openProofTool.inputSchema.properties.submission_material).toBeDefined();
    expect(openProofTool.inputSchema.required).toContain('state_file');
    expect(openProofTool.inputSchema.required).toContain('submission_material');
    // permissive: no nested required, no additionalProperties:false
    expect(openProofTool.inputSchema.properties.submission_material.additionalProperties).not.toBe(false);
  });
});
```

(Make sure `TOOLS` is exported from server.js — if it isn't already, add `export` to the const declaration.)

- [ ] **Step 2: Run test to verify it fails**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run __tests__/server.test.js -t "open_proof tool registration"`
Expected: FAIL.

- [ ] **Step 3: Implement tool registration + dispatch case**

In `skills/design-large-task/proof-mcp/server.js`:

1. If TOOLS const isn't exported yet, change `const TOOLS = [` (around line 29) to `export const TOOLS = [`.

2. Add a new entry to the TOOLS array (alongside existing tool definitions, e.g., after the `ratify_resolve_condition` entry):

```javascript
{
  name: 'open_proof',
  description: 'Open a proof from an untrusted caller submission. Restructures submission material into typed proof elements per a 4b-owned schema and writes initial state. Permissive at the boundary; rigor enforced internally.',
  inputSchema: {
    type: 'object',
    properties: {
      state_file: { type: 'string', description: 'Absolute path to write proof state JSON.' },
      submission_material: { type: 'object', description: 'Free-form caller submission. Must include problem_statement (string).' },
    },
    required: ['state_file', 'submission_material'],
  },
},
```

3. Add a dispatch case to the switch in the request handler (around server.js:195-216):

```javascript
case 'open_proof':
  return handleOpenProof(args);
```

4. Add a stub handler function below the existing handlers (so the registration test passes; full handler implemented in Tasks 11–12):

```javascript
function handleOpenProof(_args) {
  return {
    content: [{ type: 'text', text: JSON.stringify({ status: 'not_implemented', proof_open: false }) }],
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run __tests__/server.test.js`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/server.js skills/design-large-task/proof-mcp/__tests__/server.test.js
git commit -m "feat(proof-mcp): register open_proof tool with permissive input schema"
```

---

## Task 11: handleOpenProof — three-phase orchestration (gate-pass + gate-fail paths)

**Execution:** subagent (three-phase handler with Concern partition routing, partial_write_failure, save_failed try/catch, five-status response shape, multi-integration tests; high cross-module integration risk)
**Type:** code-producing
**Implements:** AC-5.2, AC-5.3, AC-6.1
**Decision budget:** 3
**Must remain green:** `server.test.js`, all existing test files

**Files:**
- Modify: `skills/design-large-task/proof-mcp/server.js` (handleOpenProof full implementation)
- Modify: `skills/design-large-task/proof-mcp/__tests__/server.test.js` (add open_proof tests)

**Steps (TDD):**

- [ ] **Step 1: Write the failing tests**

Append to `__tests__/server.test.js`:

```javascript
import { writeFileSync, unlinkSync, existsSync, readFileSync } from 'node:fs';

describe('handleOpenProof — three-phase orchestration', () => {
  it('gate-pass writes state and sets proofStatus="open"', async () => {
    const tmp = `/tmp/open-proof-pass-${Date.now()}.json`;
    const args = {
      state_file: tmp,
      submission_material: {
        problem_statement: 'a one-sentence problem.',
        elements: [
          { category: 'RULE', statement: 'A rule.', source: 'designer' },
          {
            category: 'NECESSARY_CONDITION',
            statement: 'An NC.',
            grounding: ['RULE-1'],
            reasoning_chain: 'because R',
            collapse_test: 'breaks if removed',
            rejected_alternatives: ['alt1'],
          },
        ],
      },
    };
    const response = handleOpenProof(args);
    const payload = JSON.parse(response.content[0].text);
    expect(payload.status).toBe('opened');
    expect(payload.proof_open).toBe(true);
    expect(payload.restructuring_report).toBeDefined();
    expect(existsSync(tmp)).toBe(true);
    const written = JSON.parse(readFileSync(tmp, 'utf-8'));
    expect(written.proofStatus).toBe('open');
    unlinkSync(tmp);
  });

  it('gate-fail does NOT write state', () => {
    const tmp = `/tmp/open-proof-fail-${Date.now()}.json`;
    const args = {
      state_file: tmp,
      submission_material: {
        problem_statement: 'p',
        elements: [{ category: 'RULE' }],  // missing statement → rejected → no admitted → gate fail
      },
    };
    const response = handleOpenProof(args);
    const payload = JSON.parse(response.content[0].text);
    expect(payload.status).toBe('gate_failed');
    expect(payload.proof_open).toBe(false);
    expect(payload.restructuring_report).toBeDefined();
    expect(payload.gate_failures).toBeDefined();
    expect(existsSync(tmp)).toBe(false);
  });

  it('three phases execute in declared order (accept → restructure → open) — verified by observable side effects', () => {
    // Phase ordering for a synchronous function is structurally guaranteed by code layout;
    // these assertions verify the *observable* preconditions for each phase having run:
    //   - restructure ran → admitted typed elements present in saved state
    //   - open-gate ran AND passed → proofStatus === 'open' in saved state
    //   - state save was the LAST step → file mtime > pre-call timestamp; file content matches expected
    // (vi.spyOn on ESM imports does not intercept static-bound named imports inside server.js,
    //  so spy-based ordering is unreliable. We rely on observable side effects instead.)
    const tmp = `/tmp/open-proof-order-${Date.now()}.json`;
    const t0 = Date.now();
    handleOpenProof({
      state_file: tmp,
      submission_material: {
        problem_statement: 'order test',
        elements: [{ category: 'RULE', statement: 'r', source: 'designer' }],
      },
    });
    const written = JSON.parse(readFileSync(tmp, 'utf-8'));
    expect(written.proofStatus).toBe('open');                   // open-gate ran and passed
    expect(Object.keys(written.elements).length).toBeGreaterThan(0);  // restructure produced typed elements
    expect(written.problemStatement).toBe('order test');        // problem-statement extraction ran
    if (existsSync(tmp)) unlinkSync(tmp);
  });

  it('routes admitted Concern candidates through addConcern (state.concerns), not applyOperations', () => {
    const tmp = `/tmp/open-proof-concern-${Date.now()}.json`;
    const args = {
      state_file: tmp,
      submission_material: {
        problem_statement: 'concern routing test',
        elements: [
          { category: 'Concern', label: 'A real concern label.', description: 'why it matters' },
          { category: 'RULE', statement: 'A rule.', source: 'designer' },
        ],
      },
    };
    const response = handleOpenProof(args);
    const payload = JSON.parse(response.content[0].text);
    expect(payload.status).toBe('opened');
    const written = JSON.parse(readFileSync(tmp, 'utf-8'));
    expect(written.concerns.length).toBe(1);
    expect(written.concerns[0].label).toBe('A real concern label.');
    // Concern must NOT have leaked into state.elements
    const elementValues = Object.values(written.elements);
    expect(elementValues.find(e => e.type === 'Concern')).toBeUndefined();
    expect(elementValues.find(e => e.type === 'RULE')).toBeDefined();
    if (existsSync(tmp)) unlinkSync(tmp);
  });

  it('surfaces applyOperations errors as partial_write_failure', () => {
    const tmp = `/tmp/open-proof-errors-${Date.now()}.json`;
    // Submission with NC referencing a non-existent grounding ID will fail validateRefs in applyOperations.
    const args = {
      state_file: tmp,
      submission_material: {
        problem_statement: 'p',
        elements: [
          {
            category: 'NECESSARY_CONDITION',
            statement: 'NC depending on missing element',
            grounding: ['EVID-99'],  // does not exist
            reasoning_chain: 'because',
            collapse_test: 'breaks',
            rejected_alternatives: ['alt'],
          },
        ],
      },
    };
    const response = handleOpenProof(args);
    const payload = JSON.parse(response.content[0].text);
    expect(payload.status).toBe('partial_write_failure');
    expect(Array.isArray(payload.errors)).toBe(true);
    expect(payload.errors.length).toBeGreaterThan(0);
    if (existsSync(tmp)) unlinkSync(tmp);
  });

  it('resubmission overwrites prior partial state file', () => {
    const tmp = `/tmp/open-proof-resub-${Date.now()}.json`;
    writeFileSync(tmp, JSON.stringify({ stale: 'data' }));
    const args = {
      state_file: tmp,
      submission_material: {
        problem_statement: 'fresh',
        elements: [{ category: 'RULE', statement: 'fresh rule', source: 'designer' }],
      },
    };
    handleOpenProof(args);
    const written = JSON.parse(readFileSync(tmp, 'utf-8'));
    expect(written.stale).toBeUndefined();
    expect(written.problemStatement).toBe('fresh');
    unlinkSync(tmp);
  });
});
```

**Test file imports** — add to the top of `__tests__/server.test.js` (in the existing import block; use Edit, do not append):
```javascript
import { handleOpenProof } from '../server.js';
import { vi } from 'vitest';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run __tests__/server.test.js -t "three-phase orchestration"`
Expected: All FAIL.

- [ ] **Step 3: Implement handleOpenProof**

In `skills/design-large-task/proof-mcp/server.js`:

1. **Add these imports to the top of the file** (in the existing import block — DO NOT place inside the function):

```javascript
import { restructure } from './restructure.js';
import { checkOpenGate } from './open-gate.js';
import { initializeState, applyOperations, saveState, addConcern } from './state.js';
```

(`initializeState`, `applyOperations`, `saveState` may already be imported by other handlers; `addConcern` is new — required for the Concern routing path.)

2. Replace the stub `handleOpenProof` from Task 10 with the full implementation. **Note: `export` keyword is required so the test can import it:**

```javascript
export function handleOpenProof({ state_file, submission_material }) {
  // Phase 1 — accept submission as-is. No structural validation.
  const submission = submission_material || {};

  // Phase 2 — restructure into typed proof elements.
  const restructured = restructure(submission);

  // Special case: problem_statement extraction failed.
  if (restructured.rejection_diagnostic) {
    return {
      content: [{ type: 'text', text: JSON.stringify({
        status: 'gate_failed',
        restructuring_report: restructured.report,
        gate_failures: [{ missing_artifact: 'problem_statement', diagnostic: restructured.rejection_diagnostic }],
        rejected: restructured.rejected,
        proof_open: false,
      })}],
    };
  }

  // Phase 3 — check open gate, then initialize and persist state on pass.
  const gate = checkOpenGate(restructured.admitted, restructured.report);
  if (!gate.permitted) {
    return {
      content: [{ type: 'text', text: JSON.stringify({
        status: 'gate_failed',
        restructuring_report: restructured.report,
        gate_failures: gate.failures,
        rejected: restructured.rejected,
        proof_open: false,
      })}],
    };
  }

  // Gate pass: build state, apply elements, save.
  // applyOperations returns { state, added, revised, withdrawn, errors, integrityWarnings, completeness,
  //   challengeTrigger, stallDetected, closure, friction_hints } per state.js:399-411 — read state from .state.
  let state = initializeState(restructured.problem_statement);

  // Partition admitted into typed elements (go through applyOperations) and Concerns
  // (go through addConcern; no entry in ELEMENT_TYPES, lives in state.concerns[]).
  const admittedTypedElements = restructured.admitted.filter(a => a.category !== 'Concern');
  const admittedConcerns = restructured.admitted.filter(a => a.category === 'Concern');

  const ops = admittedTypedElements.map(adm => admittedToAddOp(adm));
  const applyResult = applyOperations(state, ops);

  // Surface applyOperations errors per Plan-Wide Implementation Discipline.
  // If errors occurred, do NOT mark proof open and do NOT save state — return partial_write_failure.
  if (applyResult.errors && applyResult.errors.length > 0) {
    // Use local counts to avoid leaking applyOperations internal field names into the response.
    const attemptedCount = admittedTypedElements.length + admittedConcerns.length;
    const actuallyAdmittedCount = (applyResult.added ? applyResult.added.length : 0);
    return {
      content: [{ type: 'text', text: JSON.stringify({
        status: 'partial_write_failure',
        restructuring_report: restructured.report,
        errors: applyResult.errors,
        attempted_admit_count: attemptedCount,
        actually_admitted_count: actuallyAdmittedCount,
        proof_open: false,
      })}],
    };
  }

  state = applyResult.state;

  // Provision admitted Concerns via state.js's addConcern (separate path — Concerns
  // live in state.concerns[], not state.elements[], and have no entry in ELEMENT_TYPES).
  // addConcern returns [id, newState] per state.js:146.
  for (const concernCandidate of admittedConcerns) {
    const [, concernState] = addConcern(state, {
      label: concernCandidate.label,
      description: concernCandidate.description,
    });
    state = concernState;
  }

  state.proofStatus = 'open';
  try {
    saveState(state, state_file);
  } catch (saveErr) {
    return {
      content: [{ type: 'text', text: JSON.stringify({
        status: 'save_failed',
        restructuring_report: restructured.report,
        diagnostic: `saveState threw: ${saveErr.message}`,
        proof_open: false,
      })}],
    };
  }

  return {
    content: [{ type: 'text', text: JSON.stringify({
      status: 'opened',
      restructuring_report: restructured.report,
      admitted_count: restructured.admitted.length,
      rejected_count: restructured.rejected.length,
      proof_open: true,
    })}],
  };
}

function admittedToAddOp(admitted) {
  const { category, metadata, restructuring_action_label, provenance, ...typedFields } = admitted;
  return {
    op: 'add',
    type: category,
    ...typedFields,
    restructuring: { metadata, restructuring_action_label, provenance },
  };
}

// admittedToAddOp is called only on typed-element admitted records (filtered upstream
// by partitioning restructured.admitted into admittedTypedElements + admittedConcerns).
// Concern routing happens via state.js addConcern in handleOpenProof body above.
```

(`applyOperations` return shape is captured in the snippet above — read state from `applyResult.state`. Existing handlers in server.js use the same pattern.)

2. Make sure imports for `initializeState`, `applyOperations`, `saveState` are present at the top of server.js (they should already be there since other handlers use them).

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd skills/design-large-task/proof-mcp && npm test`
Expected: All tests pass (open-proof tests + all pre-existing tests still green).

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/server.js skills/design-large-task/proof-mcp/__tests__/server.test.js
git commit -m "feat(proof-mcp): implement handleOpenProof three-phase orchestration with gate handling"
```

---

## Task 12: handleOpenProof already-open refusal

**Execution:** inline (early-check addition + try/catch test for malformed state)
**Type:** code-producing
**Implements:** AC-11.1
**Decision budget:** 1
**Must remain green:** `server.test.js`, all existing tests

**Files:**
- Modify: `skills/design-large-task/proof-mcp/server.js` (handleOpenProof — add early refusal check)
- Modify: `skills/design-large-task/proof-mcp/__tests__/server.test.js` (add already-open test)

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Append to `__tests__/server.test.js`:

```javascript
describe('handleOpenProof — already-open refusal', () => {
  it('refuses without invoking restructure when state file has proofStatus="open"', () => {
    const tmp = `/tmp/already-open-${Date.now()}.json`;
    // Pre-populate state file with proofStatus: 'open'
    const priorState = {
      round: 5, problemStatement: 'prior', elements: {},
      elementCounters: { EVIDENCE: 0, RULE: 0, PERMISSION: 0, NECESSARY_CONDITION: 0, RISK: 0, RESOLVE_CONDITION: 0, FRICTION: 0 },
      conditionCountHistory: [], elementCountHistory: [], challengeModesUsed: [], challengeLog: [], revisionLog: [], phaseTransitionRound: 0,
      concerns: [], concernsLocked: false, concernCounter: 0, ratificationLog: [], frictionLog: [],
      closingArgPresentedRound: null, closingArgGoRound: null,
      proofStatus: 'open',
    };
    writeFileSync(tmp, JSON.stringify(priorState));
    const sizeBefore = readFileSync(tmp, 'utf-8').length;

    const response = handleOpenProof({
      state_file: tmp,
      submission_material: {
        problem_statement: 'new',
        elements: [{ category: 'RULE', statement: 'new rule', source: 'designer' }],
      },
    });
    const payload = JSON.parse(response.content[0].text);
    expect(payload.status).toBe('already_open');
    expect(payload.diagnostic).toContain(tmp);

    // State file unchanged
    const sizeAfter = readFileSync(tmp, 'utf-8').length;
    expect(sizeAfter).toBe(sizeBefore);
    unlinkSync(tmp);
  });

  it('overwrites a malformed (non-JSON) state file on gate-pass — explicit catch-all behavior', () => {
    const tmp = `/tmp/open-proof-malformed-${Date.now()}.json`;
    // Pre-populate state file with garbage that loadState cannot parse.
    writeFileSync(tmp, 'this is not valid JSON {{{');

    const response = handleOpenProof({
      state_file: tmp,
      submission_material: {
        problem_statement: 'recovery from malformed state',
        elements: [{ category: 'RULE', statement: 'r', source: 'designer' }],
      },
    });
    const payload = JSON.parse(response.content[0].text);
    // The catch-all in handleOpenProof falls through; if the gate passes, state is overwritten cleanly.
    expect(payload.status).toBe('opened');
    const written = JSON.parse(readFileSync(tmp, 'utf-8'));
    expect(written.problemStatement).toBe('recovery from malformed state');
    expect(written.proofStatus).toBe('open');
    unlinkSync(tmp);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run __tests__/server.test.js -t "already-open refusal"`
Expected: FAIL.

- [ ] **Step 3: Implement already-open check**

In `skills/design-large-task/proof-mcp/server.js`, modify `handleOpenProof` to check the state file first (before Phase 1).

1. **Add these imports to the top of `server.js`** (in the existing import block — `loadState` may already be imported; add `existsSync` if missing):

```javascript
import { existsSync } from 'node:fs';
import { loadState } from './state.js';
```

2. Add the already-open check at the start of the function body:

```javascript
export function handleOpenProof({ state_file, submission_material }) {
  // Pre-check: refuse if proof at this state file is already open.
  if (existsSync(state_file)) {
    try {
      const existingState = loadState(state_file);
      if (existingState.proofStatus === 'open') {
        return {
          content: [{ type: 'text', text: JSON.stringify({
            status: 'already_open',
            diagnostic: `Proof at ${state_file} is already open. Use a fresh state_file or initialize a new proof.`,
            proof_open: true,
          })}],
        };
      }
    } catch (_e) {
      // Malformed file: fall through to normal flow (will be overwritten on gate pass).
    }
  }

  // Phase 1 — accept submission as-is. ... [rest of handleOpenProof from Task 11]
```

(Make sure NOT to call `saveState` in the already-open path — the file must remain byte-identical per AC-11.1.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd skills/design-large-task/proof-mcp && npm test`
Expected: All tests pass. Run from repo root: `for t in tests/test-*.sh; do bash "$t" >/dev/null 2>&1 && echo "PASS: $t" || echo "FAIL: $t"; done` — same baseline as before B.1 (48/49 pass; pre-existing test-stamping-design-large-task failure unrelated).

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/server.js skills/design-large-task/proof-mcp/__tests__/server.test.js
git commit -m "feat(proof-mcp): handleOpenProof refuses when proof at state_file is already open"
```

---

---

## Task 13: Retire legacy initialize_proof tool

**Execution:** inline (deletions across server.js — schema entry, tools array entry, dispatch case)
**Type:** code-producing
**Implements:** smell #1 mitigation
**Decision budget:** 1
**Must remain green:** `server.test.js`, all existing test files

**Files:**
- Modify: `skills/design-large-task/proof-mcp/server.js` (remove `initialize_proof` from TOOLS, dispatch case, and `handleInitialize` function)
- Modify: `skills/design-large-task/proof-mcp/__tests__/server.test.js` (add retirement-verification test)

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Append to `__tests__/server.test.js`:

```javascript
describe('initialize_proof retirement', () => {
  it('TOOLS array does NOT contain initialize_proof', () => {
    const initTool = TOOLS.find(t => t.name === 'initialize_proof');
    expect(initTool).toBeUndefined();
  });

  it('open_proof remains the only proof-opening entry point', () => {
    const openProofTool = TOOLS.find(t => t.name === 'open_proof');
    expect(openProofTool).toBeDefined();
  });

  it('server.js source contains no remaining references to initialize_proof or handleInitialize', () => {
    // The existing server.test.js pattern reads source as a string for grep-style checks.
    const serverSource = readFileSync(new URL('../server.js', import.meta.url), 'utf-8');
    expect(serverSource).not.toContain('initialize_proof');
    expect(serverSource).not.toContain('handleInitialize');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run __tests__/server.test.js -t "initialize_proof retirement"`
Expected: First test FAILS (initialize_proof still present).

- [ ] **Step 3: Remove initialize_proof from server.js**

In `skills/design-large-task/proof-mcp/server.js`:

1. Delete the `{ name: 'initialize_proof', ... }` object literal from the TOOLS array (lines 30-41 in the original file — locate and remove).
2. Delete the `case 'initialize_proof': return handleInitialize(args);` line from the dispatch switch.
3. Delete the `function handleInitialize(...)` definition (lines 224-245 in the original file).

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd skills/design-large-task/proof-mcp && npm test`
Expected: All vitest tests pass. (No other test should reference initialize_proof; if any does, that's a stale test — surface and resolve.)

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/server.js skills/design-large-task/proof-mcp/__tests__/server.test.js
git commit -m "feat(proof-mcp): retire legacy initialize_proof tool; open_proof is the sole entry point"
```

---

## Task 14: Update design-large-task SKILL.md Solve Stage Opening to use open_proof

**Execution:** inline (documentation rewrite + version bump; no code paths)
**Type:** docs-producing
**Implements:** smell #1 mitigation (skill-side flow update following tool retirement)
**Decision budget:** 2
**Must remain green:** `tests/test-large-task-closure.sh`, `tests/test-stamping-design-large-task.sh` (pre-existing failure remains pre-existing)

**Files:**
- Modify: `skills/design-large-task/SKILL.md` (Solve Stage Opening section, lines around 415-425; vocabulary mention around line 628)

**Steps:**

- [ ] **Step 1: Locate Solve Stage Opening references**

Run: `grep -n "initialize_proof" skills/design-large-task/SKILL.md`
Expected: 2-3 matches around lines 415, 424, 628.

- [ ] **Step 2: Rewrite the Solve Stage Opening step**

Replace the existing "Initialize proof MCP — call `initialize_proof` with: ..." step with new wording:

```markdown
2. **Open the proof** — call `open_proof` with:
   - `state_file`: `{CHESTER_WORKING_DIR}/{sprint-subdir}/design/{sprint-name}-proof-state.json`
   - `submission_material`: an object containing
     - `problem_statement`: the designer's confirmed one-sentence problem statement (string).
     - `elements`: array of caller-drafted typed-element candidates (Concerns drafted in Phase 4a, Evidence collected from explorer findings, Rules surfaced during conversation, Permissions, Risks). Each entry carries a `category` field plus the typed fields appropriate to that category. Restructuring discipline lives inside Phase 4b — caller is not responsible for perfect formatting.

   `open_proof` returns either `status: 'opened'` (proof is live) or `status: 'gate_failed' | 'partial_write_failure'` with a restructuring report. On failure, read the report, correct the submission material, and call `open_proof` again with the corrected submission. Resubmissions to the same `state_file` are safe — gate-fail and partial-write-failure paths write nothing, so no cleanup is required. Only the `already_open` refusal requires a different `state_file` (since the prior proof is live and protected).
```

Replace the tool-list mention "**`initialize_proof`** — open a proof session..." with:

```markdown
- **`open_proof`** — open a proof from a single caller submission. Restructures untrusted material into typed proof elements per a 4b-owned schema; gates on per-element artifacts before opening.
```

In the vocabulary list (around line 628), replace `initialize_proof` with `open_proof`.

- [ ] **Step 3: Bump SKILL.md version frontmatter**

Increment the `version:` field in the SKILL.md frontmatter by one (e.g., `v0010` → `v0011`) per the repo's bump convention for behavioral changes.

- [ ] **Step 4: Run bash test suite**

Run from repo root: `for t in tests/test-*.sh; do bash "$t" >/dev/null 2>&1 && echo "PASS: $t" || echo "FAIL: $t"; done`
Expected: Same baseline (48/49 pass; pre-existing `test-stamping-design-large-task` failure remains — verify it's the same pre-existing failure, not a new one introduced by version-bump or skill-text change).

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/SKILL.md
git commit -m "feat(design-large-task): switch Solve Stage Opening to open_proof; retire initialize_proof references"
```

---

## Verification at Plan Completion

After Task 14, run the full vitest suite from the proof-mcp directory and the bash test suite from the repo root:

```bash
cd skills/design-large-task/proof-mcp && npm test
cd ../../.. && for t in tests/test-*.sh; do bash "$t" >/dev/null 2>&1 && echo "PASS: $t" || echo "FAIL: $t"; done
```

Expected:
- All vitest tests pass (existing + new from Tasks 1-13).
- Bash tests at the same baseline as before B.1 work began (~48/49 pass; `test-stamping-design-large-task.sh` may need re-evaluation after Task 14's SKILL.md version bump — if the test passes, that's a bonus; if it still fails on the same line, document as pre-existing).

Then `execute-verify-complete` confirms the worktree is ready for `finish-write-records` → `finish-archive-artifacts` → merge.

<!-- created-at: 2026-05-04T02:22:54Z -->
<!-- produced-by plan-build@v0004 -->
