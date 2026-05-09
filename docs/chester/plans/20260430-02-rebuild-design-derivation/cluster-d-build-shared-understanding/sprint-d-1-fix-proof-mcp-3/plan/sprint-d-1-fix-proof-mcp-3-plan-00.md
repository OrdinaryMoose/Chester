# Plan: Render Proof State

**Sprint:** sprint-d-1-fix-proof-mcp-3
**Spec:** docs/chester/working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp-3/spec/sprint-d-1-fix-proof-mcp-3-spec-00.md
**Execution mode:** subagent

> **For agentic workers:** Use execute-write to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The `Execution mode` field selects which execute-write section runs — Section 2 (subagent-driven) or Section 3 (inline). plan-build sets this field at handoff based on the Execution Mode Selection heuristic, with human confirm/override.

## Goal

Add a designer-readable rendering surface to the proof MCP — a new read-only `render_proof_state` tool that produces a markdown recap of active proof contents (or a deep render of one element) so the designer can scan the proof body mid-conversation without parsing raw state JSON.

## Architecture

Hybrid: split-module-with-helpers plus partitioner extraction inside `closing-argument.js` plus multi-storage element lookup scoped to seven types. A new `proof-mcp/state-render.js` module owns markdown primitives, per-type render functions, an outsized-rule heuristic, multi-storage `findElementById`, and the two top-level exports `renderProofRecap` and `renderElementDeep`. The active-by-type partitioner is extracted from `deriveClosingArgument` into a new named export `partitionActiveElements` in `closing-argument.js`, becoming the single source of truth that both closure and recap consume.

## Tech Stack

- Node.js ES modules
- Vitest for tests
- @modelcontextprotocol/sdk for the MCP server surface

## Implementer Notes (read once before starting)

- **Import hoisting.** Tasks 1–5 each show `import` statements at the top of their code snippets to make each snippet self-contained for review. The test file `proof-mcp/__tests__/render-proof-state.test.js` is created in Task 1 and appended in Tasks 2–5. ES modules require all `import` declarations at the top of the file; do NOT paste imports mid-file alongside the `describe` blocks. When a later task introduces a new import, **merge it into the import block at the top of the file** rather than duplicating or repeating it. Same rule applies to the `closing-argument.js`, `state-render.js`, and `server.js` modifications — imports go at the file's top.
- **Existing tests stay green.** No existing test file is edited. After every commit, run the full proof-mcp test suite to confirm nothing regressed.

---

## Task 1: Extract `partitionActiveElements` from `closing-argument.js`

- **Type:** code-producing
- **Implements:** AC-2.3
- **Decision budget:** 2
- **Must remain green:** `closing-argument.test.js`, `closing-argument-end-to-end.test.js`, plus any new tests this task adds
- **Files:**
  - Modify `skills/design-large-task/proof-mcp/closing-argument.js` — extract filter logic into a named export, refactor `deriveClosingArgument` internals so its published shape is byte-identical
  - Test in `skills/design-large-task/proof-mcp/__tests__/render-proof-state.test.js` — new file (first introduction)

### TDD steps

- [ ] **Step 1: Write failing test for the partitioner contract.**

  Create `skills/design-large-task/proof-mcp/__tests__/render-proof-state.test.js` with a first `describe('partitionActiveElements', ...)` block. The test must:

  1. Seed a state with one active ratified NC, one active draft NC (so `activeNCsAll` carries both), one active RC, one active Rule, one active Permission, one active Evidence, one active Risk, and one ratified Concern.
  2. Call `partitionActiveElements(state)` (imported from `../closing-argument.js`).
  3. Assert the return is an object whose keys are exactly `['activeNCsAll', 'activeRCs', 'activeRules', 'activePermissions', 'activeEvidence', 'activeRisks', 'activeConcerns']` (use `Object.keys(partition).sort()` against the sorted expected array).
  4. Assert each lane contains the raw element (or raw concern) objects — not projected shapes. Concretely: `partition.activeNCsAll[0] === state.elements.get('NCON-1')` (referential identity, not deep equal) and `partition.activeNCsAll.length === 2` (both ratified and draft NCs included).
  5. Assert `partition.activeConcerns[0] === state.concerns[0]`.

  Realistic skeleton:

  ```javascript
  import { describe, it, expect, beforeEach, afterEach } from 'vitest';
  import { mkdtempSync, rmSync, writeFileSync } from 'fs';
  import { tmpdir } from 'os';
  import { join } from 'path';
  import {
    initializeState,
    applyOperations,
    addConcern,
    ratifyConcern,
    ratifyResolveCondition,
    ratifyNecessaryCondition,
    saveState,
    loadState,
  } from '../state.js';
  import { partitionActiveElements, deriveClosingArgument } from '../closing-argument.js';

  const consent = { source: 'designer', rationale: 'test render' };

  function seedFullProof() {
    let s = initializeState('design problem');
    let [, sa] = addConcern(s, { label: 'concern X', description: 'd' }, consent);
    s = sa;
    [s] = ratifyConcern(s, 'CERN-1', consent);
    let r = applyOperations(s, [
      { op: 'add', type: 'EVIDENCE', statement: 'evidence body', source: 'codebase' },
      { op: 'add', type: 'RULE', statement: 'rule body', source: 'designer' },
      { op: 'add', type: 'PERMISSION', statement: 'permission body', relieves: 'RULE-1' },
      { op: 'add', type: 'RISK', statement: 'risk body', basis: 'EVID-1' },
      { op: 'add', type: 'NECESSARY_CONDITION',
        statement: 'must Q', collapse_test: 'breaks if no Q',
        grounding: ['EVID-1'], reasoning_chain: 'IF evidence body THEN must Q' },
      { op: 'add', type: 'NECESSARY_CONDITION',
        statement: 'must R (draft)', collapse_test: 'breaks if no R',
        grounding: ['EVID-1'], reasoning_chain: 'IF evidence body THEN must R' },
      { op: 'add', type: 'RESOLVE_CONDITION', statement: 'system Qs',
        problem_anchor: 'CERN-1', grounding: ['NCON-1'] },
    ], consent);
    s = r.state;
    [s] = ratifyNecessaryCondition(s, { elementId: 'NCON-1', ratificationText: 'ok' }, consent);
    [s] = ratifyResolveCondition(s, { elementId: 'RCON-1', ratificationText: 'ratified' }, consent);
    return s;
  }

  describe('partitionActiveElements', () => {
    it('returns the seven raw active-by-type lanes', () => {
      const s = seedFullProof();
      const p = partitionActiveElements(s);
      expect(Object.keys(p).sort()).toEqual([
        'activeConcerns', 'activeEvidence', 'activeNCsAll',
        'activePermissions', 'activeRCs', 'activeRisks', 'activeRules',
      ]);
      expect(p.activeNCsAll.length).toBe(2);
      expect(p.activeNCsAll).toContain(s.elements.get('NCON-1'));
      expect(p.activeNCsAll).toContain(s.elements.get('NCON-2'));
      expect(p.activeRCs[0]).toBe(s.elements.get('RCON-1'));
      expect(p.activeRules[0]).toBe(s.elements.get('RULE-1'));
      expect(p.activePermissions[0]).toBe(s.elements.get('PERM-1'));
      expect(p.activeEvidence[0]).toBe(s.elements.get('EVID-1'));
      expect(p.activeRisks[0]).toBe(s.elements.get('RISK-1'));
      expect(p.activeConcerns[0]).toBe(s.concerns[0]);
    });
  });
  ```

  **Run:** `npx vitest run skills/design-large-task/proof-mcp/__tests__/render-proof-state.test.js`
  **Expected:** test fails with `partitionActiveElements is not a function` (or `... is not exported from closing-argument.js`).

- [ ] **Step 2: Confirm failure mode.**

  **Run:** `npx vitest run skills/design-large-task/proof-mcp/__tests__/render-proof-state.test.js 2>&1 | head -40`
  **Expected:** vitest output shows `SyntaxError: The requested module '../closing-argument.js' does not provide an export named 'partitionActiveElements'` or vitest reports the case as failing on the import resolution.

- [ ] **Step 3: Implement `partitionActiveElements` and refactor `deriveClosingArgument`.**

  Edit `skills/design-large-task/proof-mcp/closing-argument.js`. Add the named export `partitionActiveElements` above `deriveClosingArgument`. Then refactor `deriveClosingArgument` so it calls the partitioner once at its top and reuses every active-by-type lane:

  - Replace lines 32–43 (the `resolveConditions` filter on `RESOLVE_CONDITION + active`) so it iterates `partition.activeRCs` instead of `elementsArr.filter(...)`. The `groundingNCs` sub-mapping (lines 39–42) stays inside `deriveClosingArgument` — the partitioner only emits raw elements.
  - Replace lines 70–73 (`activeNCs` ratified + `draftNCs` draft) with two filters over `partition.activeNCsAll` by `ratificationStatus`. The published key names stay `activeNCs` (ratified-only) and `draftNCs` (draft-only).
  - Replace lines 76–78 (`activeRules`, `activePermissions`, `activeRisks`) with direct destructures from `partition`. Use the same names so the published return shape is unchanged.
  - **Do not move into the partitioner:** the `liveFriction`/`phantomFriction` projections (FRICTION elements), the `phantomNCs`/`phantomRCs` projections (withdrawn elements with disposition tag), the `lockedConcerns` proofStatus-conditional, the `phantomConcerns` derivation, the `ratifiedDefinitions`/`phantomDefinitions` partitions, or the `closureProvenance` derivation. These remain inline inside `deriveClosingArgument`.

  Concrete shape of the partitioner:

  ```javascript
  /**
   * Pure type-and-status partition of the proof state's active elements and concerns.
   * Returns raw element/concern objects in seven lanes — no field projection, no sub-mapping.
   * Both `deriveClosingArgument` and `state-render.js`'s recap path consume this so the
   * two call sites cannot drift on what counts as "active by type".
   *
   * @param {object} state - proof state with `elements: Map` and `concerns: Array`
   * @returns {{
   *   activeNCsAll: object[], activeRCs: object[], activeRules: object[],
   *   activePermissions: object[], activeEvidence: object[], activeRisks: object[],
   *   activeConcerns: object[],
   * }}
   */
  export function partitionActiveElements(state) {
    const elementsArr = [...state.elements.values()];
    const concerns = state.concerns ?? [];
    return {
      activeNCsAll: elementsArr.filter(el => el.type === 'NECESSARY_CONDITION' && el.status === 'active'),
      activeRCs: elementsArr.filter(el => el.type === 'RESOLVE_CONDITION' && el.status === 'active'),
      activeRules: elementsArr.filter(el => el.type === 'RULE' && el.status === 'active'),
      activePermissions: elementsArr.filter(el => el.type === 'PERMISSION' && el.status === 'active'),
      activeEvidence: elementsArr.filter(el => el.type === 'EVIDENCE' && el.status === 'active'),
      activeRisks: elementsArr.filter(el => el.type === 'RISK' && el.status === 'active'),
      activeConcerns: concerns.filter(c => c.status !== 'withdrawn'),
    };
  }
  ```

  Inside `deriveClosingArgument`, the body changes look like:

  ```javascript
  export function deriveClosingArgument(state) {
    const partition = partitionActiveElements(state);
    const elementsArr = [...state.elements.values()];

    const concernsList = state.concerns ?? [];
    const lockedConcerns = state.proofStatus === 'finish'
      ? concernsList.filter(c => c.status !== 'withdrawn')
      : [];
    const phantomConcerns = concernsList.filter(c => c.status === 'withdrawn');

    const resolveConditions = partition.activeRCs.map(el => ({
      id: el.id,
      statement: el.statement,
      problem_anchor: el.problem_anchor ?? null,
      ratification: el.ratification ?? null,
      groundingNCs: (el.grounding ?? [])
        .map(refId => state.elements.get(refId))
        .filter(ref => ref && ref.type === 'NECESSARY_CONDITION')
        .map(nc => ({ id: nc.id, statement: nc.statement, collapse_test: nc.collapse_test ?? null })),
    }));

    // phantomNCs, phantomRCs, liveFriction, phantomFriction stay as-is (filter elementsArr inline).
    // ...

    const activeNCs = partition.activeNCsAll.filter(el => el.ratificationStatus === 'ratified');
    const draftNCs  = partition.activeNCsAll.filter(el => el.ratificationStatus === 'draft');

    const { activeRules, activePermissions, activeRisks } = partition;

    // definitions, closureProvenance, return-shape unchanged.
  }
  ```

  Preserve every published key the existing closing-argument tests assert on. The return-statement key list at lines 118–139 stays byte-identical.

  **Run:** `npx vitest run skills/design-large-task/proof-mcp/__tests__/render-proof-state.test.js`
  **Expected:** the new partitioner test passes.

- [ ] **Step 4: Verify the closing-argument suite still passes.**

  **Run:** `npx vitest run skills/design-large-task/proof-mcp/__tests__/closing-argument.test.js skills/design-large-task/proof-mcp/__tests__/closing-argument-end-to-end.test.js skills/design-large-task/proof-mcp/__tests__/render-proof-state.test.js`
  **Expected:** all three test files green; closing-argument tests untouched.

- [ ] **Step 5: Commit.**

  **Run:** `git add skills/design-large-task/proof-mcp/closing-argument.js skills/design-large-task/proof-mcp/__tests__/render-proof-state.test.js && git commit -m "feat: extract partitionActiveElements from closing-argument.js"`
  **Expected:** one commit on the sub-sprint branch with the new export and the new test file's first test.

---

## Task 2: Create `state-render.js` skeleton with markdown primitives and heuristic helpers

- **Type:** code-producing
- **Implements:** AC-2.2 (partial — `OUTSIZED_RULE_THRESHOLD`, `isOutsizedRule`, `firstSentence`); AC-3.1 (partial — `renderSubBullet` null-and-empty-array guard)
- **Decision budget:** 1
- **Must remain green:** tests added in this task
- **Files:**
  - Create `skills/design-large-task/proof-mcp/state-render.js`
  - Modify `skills/design-large-task/proof-mcp/__tests__/render-proof-state.test.js` (append a new `describe` block)

### TDD steps

- [ ] **Step 1: Write failing tests for the primitives and heuristics.**

  Append a new `describe('state-render primitives and heuristics', ...)` block to the existing test file. Cover all six helpers and the constant.

  ```javascript
  import {
    OUTSIZED_RULE_THRESHOLD,
    isOutsizedRule,
    firstSentence,
    renderHeading,
    renderBullet,
    renderSubBullet,
  } from '../state-render.js';

  describe('state-render primitives and heuristics', () => {
    it('exports OUTSIZED_RULE_THRESHOLD === 3', () => {
      expect(OUTSIZED_RULE_THRESHOLD).toBe(3);
    });

    it('isOutsizedRule returns true at or above threshold of numbered sub-clauses', () => {
      const big = '18. Big rule.\n  18.1 first\n  18.2 second\n  18.3 third';
      const small = 'Just one sentence rule.';
      expect(isOutsizedRule(big, 3)).toBe(true);
      expect(isOutsizedRule(small, 3)).toBe(false);
    });

    it('isOutsizedRule returns false when count is below threshold', () => {
      const two = 'Header.\n  18.1 a\n  18.2 b';
      expect(isOutsizedRule(two, 3)).toBe(false);
    });

    it('firstSentence returns text up to first sentence terminator', () => {
      expect(firstSentence('Hello world. Then more text.')).toBe('Hello world');
      expect(firstSentence('What now? More.')).toBe('What now');
      expect(firstSentence('Wow! Next.')).toBe('Wow');
      expect(firstSentence('No terminator here')).toBe('No terminator here');
    });

    it('renderHeading prints a level-2 heading with newline', () => {
      expect(renderHeading('Necessary Conditions')).toBe('## Necessary Conditions\n');
    });

    it('renderBullet prints id-meta-summary bullet', () => {
      expect(renderBullet('NCON-1', 'ratified', 'must Q')).toBe('- **NCON-1** _(ratified)_ — must Q\n');
    });

    it('renderSubBullet returns empty string for null/undefined/empty array', () => {
      expect(renderSubBullet('reasoning_chain', null)).toBe('');
      expect(renderSubBullet('reasoning_chain', undefined)).toBe('');
      expect(renderSubBullet('rejected_alternatives', [])).toBe('');
    });

    it('renderSubBullet prints two-space indented sub-bullet for non-empty value', () => {
      expect(renderSubBullet('grounding', 'EVID-1')).toBe('  - **grounding:** EVID-1\n');
    });
  });
  ```

  **Run:** `npx vitest run skills/design-large-task/proof-mcp/__tests__/render-proof-state.test.js`
  **Expected:** the new block fails with module-not-found on `../state-render.js`.

- [ ] **Step 2: Confirm failure mode.**

  **Run:** `npx vitest run skills/design-large-task/proof-mcp/__tests__/render-proof-state.test.js 2>&1 | head -30`
  **Expected:** vitest reports `Failed to load url ../state-render.js` or similar resolution error.

- [ ] **Step 3: Implement the primitives and heuristics.**

  Create `skills/design-large-task/proof-mcp/state-render.js`:

  ```javascript
  // proof-mcp/state-render.js
  // Markdown rendering surface for the proof MCP. Read-only; consumes raw state plus
  // the `partitionActiveElements` output from closing-argument.js. No mutations, no I/O.

  /** Numbered sub-clauses at or above this count trigger outsized-rule annotation in recap. */
  export const OUTSIZED_RULE_THRESHOLD = 3;

  /**
   * Counts numbered sub-clauses (lines beginning with `<digit>.<digit>`, e.g. 18.1, 18.2)
   * in a rule statement. The pattern matches per-line so a header line like "18. Big rule"
   * does not count itself.
   */
  export function isOutsizedRule(statement, threshold) {
    if (typeof statement !== 'string') return false;
    // /^\s*\d+\.\d/m matches a line starting with optional whitespace, then digits, dot, digit
    // (e.g. "18.1", "  18.2"). The header-only "18." form does not match because no digit
    // follows the dot.
    const matches = statement.match(/^\s*\d+\.\d/gm) ?? [];
    return matches.length >= threshold;
  }

  /**
   * Returns the first sentence of `text` — text up through (but not including) the first
   * `.`, `!`, or `?` followed by whitespace or end-of-string. Returns the full text when
   * no terminator is present.
   */
  export function firstSentence(text) {
    if (typeof text !== 'string') return '';
    const m = text.match(/^(.+?)[.!?](\s|$)/);
    return m ? m[1] : text;
  }

  export function renderHeading(title) {
    return `## ${title}\n`;
  }

  export function renderBullet(id, meta, summary) {
    return `- **${id}** _(${meta})_ — ${summary}\n`;
  }

  export function renderSubBullet(label, value) {
    if (value === null || value === undefined) return '';
    if (Array.isArray(value) && value.length === 0) return '';
    return `  - **${label}:** ${value}\n`;
  }
  ```

  **Run:** `npx vitest run skills/design-large-task/proof-mcp/__tests__/render-proof-state.test.js`
  **Expected:** the new `state-render primitives and heuristics` block is fully green; previous task's partitioner test still green.

- [ ] **Step 4: Verify the full new test file passes.**

  **Run:** `npx vitest run skills/design-large-task/proof-mcp/__tests__/render-proof-state.test.js`
  **Expected:** every `it` so far passes; no regressions.

- [ ] **Step 5: Commit.**

  **Run:** `git add skills/design-large-task/proof-mcp/state-render.js skills/design-large-task/proof-mcp/__tests__/render-proof-state.test.js && git commit -m "feat: add state-render.js with markdown primitives and heuristic helpers"`
  **Expected:** one commit landing the new module skeleton plus its primitive tests.

---

## Task 3: Add per-type render functions and `findElementById` to `state-render.js`

- **Type:** code-producing
- **Implements:** AC-3.1 (full per-type sub-fields), AC-3.2 (`withdrawal_disposition` surfacing in deep-render metadata), AC-3.3 (multi-storage lookup scoped to seven prefixes; FRIC and DEFN return null)
- **Decision budget:** 2
- **Must remain green:** tests added in this task
- **Files:**
  - Modify `skills/design-large-task/proof-mcp/state-render.js` — add seven per-type render functions and `findElementById`
  - Modify `skills/design-large-task/proof-mcp/__tests__/render-proof-state.test.js` — append per-type and lookup test blocks

### TDD steps

- [ ] **Step 1: Write failing tests for the per-type renderers and the multi-storage lookup.**

  Append two new `describe` blocks to the test file.

  ```javascript
  import { renderNC, renderRule, renderRC, renderConcern, renderEvidence, renderPermission, renderRisk, findElementById } from '../state-render.js';

  describe('per-type render functions', () => {
    it('renderNC includes statement, grounding, reasoning_chain, collapse_test', () => {
      const el = {
        id: 'NCON-1', type: 'NECESSARY_CONDITION', status: 'active',
        ratificationStatus: 'ratified',
        statement: 'must Q',
        grounding: ['EVID-1'],
        reasoning_chain: 'IF evidence THEN must Q',
        collapse_test: 'breaks if no Q',
      };
      const out = renderNC(el);
      expect(out).toContain('NCON-1');
      expect(out).toContain('must Q');
      expect(out).toContain('EVID-1');
      expect(out).toContain('IF evidence THEN must Q');
      expect(out).toContain('breaks if no Q');
      // No rejected_alternatives sub-bullet emitted for absent value.
      expect(out).not.toContain('rejected_alternatives');
    });

    it('renderNC emits rejected_alternatives sub-bullet only when populated', () => {
      const elWith = {
        id: 'NCON-2', statement: 'X', grounding: ['EVID-1'],
        reasoning_chain: 'IF', collapse_test: 'C',
        rejected_alternatives: ['alt one', 'alt two'],
      };
      const elWithout = { ...elWith, id: 'NCON-3', rejected_alternatives: [] };
      expect(renderNC(elWith)).toContain('rejected_alternatives');
      expect(renderNC(elWithout)).not.toContain('rejected_alternatives');
    });

    it('renderRule(el, false) emits the full statement', () => {
      const el = { id: 'RULE-1', statement: 'Single sentence rule.' };
      const out = renderRule(el, false);
      expect(out).toContain('Single sentence rule.');
      expect(out).not.toContain('sub-clauses — request deep render');
    });

    it('renderRule(el, true) truncates to firstSentence and appends parenthetical pointer', () => {
      const el = {
        id: 'RULE-2',
        statement: 'Big rule.\n  18.1 a\n  18.2 b\n  18.3 c\n  18.4 d\n  18.5 e',
      };
      const out = renderRule(el, true);
      expect(out).toContain('Big rule');
      expect(out).toContain('5 sub-clauses — request deep render to view in full');
    });

    it('renderRC includes statement, problem_anchor, ratification, grounding NC IDs', () => {
      const el = {
        id: 'RCON-1', statement: 'system Qs',
        problem_anchor: 'CERN-1',
        ratification: { ratifiedAtRound: 2, text: 'designer ok' },
        grounding: ['NCON-1'],
      };
      const out = renderRC(el);
      expect(out).toContain('RCON-1');
      expect(out).toContain('system Qs');
      expect(out).toContain('CERN-1');
      expect(out).toContain('NCON-1');
    });

    it('renderConcern includes label, description, status', () => {
      const c = { id: 'CERN-1', label: 'concern X', description: 'desc body', status: 'ratified' };
      const out = renderConcern(c);
      expect(out).toContain('CERN-1');
      expect(out).toContain('concern X');
      expect(out).toContain('desc body');
      expect(out).toContain('ratified');
    });

    it('renderEvidence includes statement and source', () => {
      const el = { id: 'EVID-1', statement: 'evidence body', source: 'codebase' };
      const out = renderEvidence(el);
      expect(out).toContain('EVID-1');
      expect(out).toContain('evidence body');
      expect(out).toContain('codebase');
    });

    it('renderPermission includes statement and relieves', () => {
      const el = { id: 'PERM-1', statement: 'permission body', relieves: 'RULE-1' };
      const out = renderPermission(el);
      expect(out).toContain('PERM-1');
      expect(out).toContain('permission body');
      expect(out).toContain('RULE-1');
    });

    it('renderRisk includes statement and basis', () => {
      const el = { id: 'RISK-1', statement: 'risk body', basis: 'EVID-1' };
      const out = renderRisk(el);
      expect(out).toContain('RISK-1');
      expect(out).toContain('risk body');
      expect(out).toContain('EVID-1');
    });

    it('per-type render surfaces withdrawal_disposition for withdrawn elements', () => {
      const el = {
        id: 'NCON-3', type: 'NECESSARY_CONDITION', status: 'withdrawn',
        ratificationStatus: 'ratified',
        statement: 'old NC', grounding: ['EVID-1'],
        reasoning_chain: 'IF', collapse_test: 'C',
        withdrawal_disposition: 'superseded',
      };
      const out = renderNC(el);
      expect(out).toContain('superseded');
    });
  });

  describe('findElementById multi-storage lookup', () => {
    it('returns elements.get for the six in-scope element-Map prefixes', () => {
      const s = seedFullProof();
      expect(findElementById(s, 'NCON-1')).toBe(s.elements.get('NCON-1'));
      expect(findElementById(s, 'RULE-1')).toBe(s.elements.get('RULE-1'));
      expect(findElementById(s, 'PERM-1')).toBe(s.elements.get('PERM-1'));
      expect(findElementById(s, 'EVID-1')).toBe(s.elements.get('EVID-1'));
      expect(findElementById(s, 'RISK-1')).toBe(s.elements.get('RISK-1'));
      expect(findElementById(s, 'RCON-1')).toBe(s.elements.get('RCON-1'));
    });

    it('returns matching concern from concerns array for CERN- prefix', () => {
      const s = seedFullProof();
      expect(findElementById(s, 'CERN-1')).toBe(s.concerns[0]);
    });

    it('returns null for FRIC- (out of scope)', () => {
      const s = seedFullProof();
      expect(findElementById(s, 'FRIC-1')).toBeNull();
    });

    it('returns null for DEFN- (out of scope)', () => {
      const s = seedFullProof();
      expect(findElementById(s, 'DEFN-1')).toBeNull();
    });

    it('returns null for unknown prefix', () => {
      const s = seedFullProof();
      expect(findElementById(s, 'XYZ-1')).toBeNull();
    });

    it('returns null when prefix is in-scope but ID does not exist', () => {
      const s = seedFullProof();
      expect(findElementById(s, 'NCON-999')).toBeNull();
    });
  });
  ```

  **Run:** `npx vitest run skills/design-large-task/proof-mcp/__tests__/render-proof-state.test.js`
  **Expected:** the two new blocks fail because the new exports are missing.

- [ ] **Step 2: Confirm failure mode.**

  **Run:** `npx vitest run skills/design-large-task/proof-mcp/__tests__/render-proof-state.test.js 2>&1 | head -30`
  **Expected:** vitest reports the new exports (`renderNC`, `findElementById`, etc.) are not provided by `state-render.js`.

- [ ] **Step 3: Implement the seven per-type renderers and the multi-storage lookup.**

  Append to `skills/design-large-task/proof-mcp/state-render.js`. Each per-type function returns a top bullet line via `renderBullet` (with a metadata segment that includes withdrawn-element disposition when present), followed by sub-bullet lines via `renderSubBullet`. The `findElementById` function dispatches on ID prefix.

  ```javascript
  /** Build the meta segment for a bullet — includes status and disposition when withdrawn. */
  function elementMeta(el) {
    if (el?.status === 'withdrawn') {
      return `withdrawn — ${el.withdrawal_disposition ?? 'unclassified'}`;
    }
    if (el?.ratificationStatus) return el.ratificationStatus;
    if (el?.ratification && typeof el.ratification === 'object') return 'ratified';
    if (el?.status) return el.status;
    return 'active';
  }

  export function renderNC(el) {
    const meta = elementMeta(el);
    const summary = firstSentence(el.statement ?? '');
    let out = renderBullet(el.id, meta, summary);
    out += renderSubBullet('statement', el.statement);
    out += renderSubBullet('grounding', (el.grounding ?? []).join(', '));
    out += renderSubBullet('reasoning_chain', el.reasoning_chain);
    out += renderSubBullet('collapse_test', el.collapse_test);
    // Explicit join so the sub-bullet renders alternatives separated by ", " rather
    // than relying on Array.toString()'s no-space comma format. renderSubBullet still
    // returns the empty string for an empty array because the join produces an empty
    // string in that case, which renderSubBullet treats as "absent value, no output."
    out += renderSubBullet(
      'rejected_alternatives',
      Array.isArray(el.rejected_alternatives) && el.rejected_alternatives.length > 0
        ? el.rejected_alternatives.join('; ')
        : null
    );
    return out;
  }

  export function renderRule(el, outsized) {
    const meta = elementMeta(el);
    if (outsized) {
      const count = (el.statement ?? '').match(/^\s*\d+\.\d/gm)?.length ?? 0;
      const summary = `${firstSentence(el.statement ?? '')}. (${count} sub-clauses — request deep render to view in full)`;
      return renderBullet(el.id, meta, summary);
    }
    return renderBullet(el.id, meta, el.statement ?? '');
  }

  export function renderRC(el) {
    const meta = elementMeta(el);
    const summary = firstSentence(el.statement ?? '');
    let out = renderBullet(el.id, meta, summary);
    out += renderSubBullet('statement', el.statement);
    out += renderSubBullet('problem_anchor', el.problem_anchor);
    // ratification may be a string ('draft'/'ratified') or an object — render as JSON for objects.
    const ratif = el.ratification && typeof el.ratification === 'object'
      ? JSON.stringify(el.ratification)
      : el.ratification;
    out += renderSubBullet('ratification', ratif);
    out += renderSubBullet('groundingNCs', (el.grounding ?? []).join(', '));
    return out;
  }

  export function renderConcern(c) {
    // Use elementMeta so withdrawn concerns reached via renderElementDeep surface
    // their disposition consistently with other element types (AC-3.2). Concerns
    // do not currently carry a withdrawal_disposition field, so elementMeta will
    // fall back to 'unclassified' for withdrawn concerns; that is the canonical
    // unspecified-disposition string per the proof MCP convention.
    const meta = elementMeta(c);
    let out = renderBullet(c.id, meta, c.label ?? '');
    out += renderSubBullet('label', c.label);
    out += renderSubBullet('description', c.description);
    out += renderSubBullet('status', c.status);
    return out;
  }

  export function renderEvidence(el) {
    const meta = elementMeta(el);
    let out = renderBullet(el.id, meta, firstSentence(el.statement ?? ''));
    out += renderSubBullet('statement', el.statement);
    out += renderSubBullet('source', el.source);
    return out;
  }

  export function renderPermission(el) {
    const meta = elementMeta(el);
    let out = renderBullet(el.id, meta, firstSentence(el.statement ?? ''));
    out += renderSubBullet('statement', el.statement);
    out += renderSubBullet('relieves', el.relieves);
    return out;
  }

  export function renderRisk(el) {
    const meta = elementMeta(el);
    let out = renderBullet(el.id, meta, firstSentence(el.statement ?? ''));
    out += renderSubBullet('statement', el.statement);
    out += renderSubBullet('basis', el.basis);
    return out;
  }

  /**
   * Multi-storage element lookup. Dispatches on the ID's prefix to one of two storages.
   * Returns null for prefixes outside the seven in-scope types — callers translate that
   * to ELEMENT_NOT_FOUND. FRIC- (FRICTION) and DEFN- (DEFINITION) are explicitly out of
   * deep-render scope per the design brief and return null here.
   */
  export function findElementById(state, id) {
    if (typeof id !== 'string') return null;
    const dash = id.indexOf('-');
    if (dash < 0) return null;
    const prefix = id.slice(0, dash + 1);
    switch (prefix) {
      case 'NCON-':
      case 'RULE-':
      case 'PERM-':
      case 'EVID-':
      case 'RISK-':
      case 'RCON-':
        return state.elements.get(id) ?? null;
      case 'CERN-':
        return (state.concerns ?? []).find(c => c.id === id) ?? null;
      default:
        return null;
    }
  }
  ```

  Reuse the test file's `seedFullProof` factory in the `findElementById` block (move the factory above all `describe` blocks if it isn't already).

  **Run:** `npx vitest run skills/design-large-task/proof-mcp/__tests__/render-proof-state.test.js`
  **Expected:** the per-type and `findElementById` blocks are green.

- [ ] **Step 4: Verify the full new test file passes; existing suites untouched.**

  **Run:** `npx vitest run skills/design-large-task/proof-mcp/__tests__/render-proof-state.test.js skills/design-large-task/proof-mcp/__tests__/closing-argument.test.js`
  **Expected:** every test passes.

- [ ] **Step 5: Commit.**

  **Run:** `git add skills/design-large-task/proof-mcp/state-render.js skills/design-large-task/proof-mcp/__tests__/render-proof-state.test.js && git commit -m "feat: add per-type render functions and findElementById to state-render.js"`
  **Expected:** one commit landing the per-type renderers and the lookup helper.

---

## Task 4: Add top-level `renderProofRecap` and `renderElementDeep` exports

- **Type:** code-producing
- **Implements:** AC-2.1 (eight-section recap, ID-ascending order, active-only), AC-2.2 (full integration of outsized-rule annotation in recap), AC-3.1 (deep render dispatch), AC-3.2 (deep-render `withdrawal_disposition` path)
- **Decision budget:** 1
- **Must remain green:** tests added in this task
- **Files:**
  - Modify `skills/design-large-task/proof-mcp/state-render.js` — add `renderProofRecap` and `renderElementDeep` exports
  - Modify `skills/design-large-task/proof-mcp/__tests__/render-proof-state.test.js` — append recap and deep-render test blocks

### TDD steps

- [ ] **Step 1: Write failing tests for the two top-level exports.**

  Append two new `describe` blocks to the test file.

  ```javascript
  import { renderProofRecap, renderElementDeep } from '../state-render.js';
  import { partitionActiveElements } from '../closing-argument.js';

  describe('renderProofRecap', () => {
    it('emits exactly eight section headings in canonical order', () => {
      const s = seedFullProof();
      const out = renderProofRecap(s, partitionActiveElements(s));
      const expectedHeadings = [
        '## Problem Statement',
        '## Concerns',
        '## Rules',
        '## Permissions',
        '## Evidence',
        '## Necessary Conditions',
        '## Resolve Conditions',
        '## Risks',
      ];
      let cursor = 0;
      for (const h of expectedHeadings) {
        const idx = out.indexOf(h, cursor);
        expect(idx).toBeGreaterThanOrEqual(0);
        cursor = idx + h.length;
      }
    });

    it('Problem Statement section presents state.problemStatement text', () => {
      const s = seedFullProof();
      const out = renderProofRecap(s, partitionActiveElements(s));
      expect(out).toContain('design problem');
    });

    it('emits one bulleted line per active element, withdrawn elements absent', () => {
      let s = seedFullProof();
      // Withdraw NCON-2 and verify it does not appear in the recap.
      const r = applyOperations(s, [{ op: 'withdraw', target: 'NCON-2', withdrawal_disposition: 'superseded' }], consent);
      s = r.state;
      const out = renderProofRecap(s, partitionActiveElements(s));
      expect(out).toContain('NCON-1');
      expect(out).not.toMatch(/^- \*\*NCON-2\*\*/m);
    });

    it('orders elements within a section in ID-ascending numeric order', () => {
      let s = seedFullProof();
      // Add NCON-3 then NCON-10 — assert NCON-3 appears before NCON-10.
      let r = applyOperations(s, [
        { op: 'add', type: 'NECESSARY_CONDITION', statement: 'C', collapse_test: 'c', grounding: ['EVID-1'], reasoning_chain: 'IF' },
      ], consent);
      s = r.state;
      // Force a higher numeric ID; insert seven to push counter to 10.
      // (seedFullProof creates NCON-1, NCON-2; the explicit add above creates NCON-3;
      //  this loop creates NCON-4 through NCON-10 across 7 iterations.)
      for (let i = 0; i < 7; i++) {
        r = applyOperations(s, [{ op: 'add', type: 'NECESSARY_CONDITION', statement: `extra ${i}`, collapse_test: 'x', grounding: ['EVID-1'], reasoning_chain: 'IF' }], consent);
        s = r.state;
      }
      const out = renderProofRecap(s, partitionActiveElements(s));
      const ncSection = out.slice(out.indexOf('## Necessary Conditions'));
      const idxNCON3 = ncSection.indexOf('NCON-3');
      const idxNCON10 = ncSection.indexOf('NCON-10');
      expect(idxNCON3).toBeGreaterThanOrEqual(0);
      expect(idxNCON10).toBeGreaterThan(idxNCON3);
    });

    it('renders rules with >= 3 numbered sub-clauses with parenthetical pointer', () => {
      let s = seedFullProof();
      const r = applyOperations(s, [
        { op: 'add', type: 'RULE',
          statement: 'Big rule.\n  21.1 a\n  21.2 b\n  21.3 c',
          source: 'designer' },
      ], consent);
      s = r.state;
      const out = renderProofRecap(s, partitionActiveElements(s));
      expect(out).toContain('3 sub-clauses — request deep render to view in full');
    });

    it('reads from the partition object rather than re-deriving from raw state (AC-2.3 sub-assertion d)', () => {
      // Mutation-probe test: push a fake element into a partition lane after the
      // partition is returned but before recap runs. If the recap reads from the
      // partition, the fake will appear. If the recap re-derives from raw state,
      // the fake will be absent (state.elements does not contain it). This proves
      // the partitioner is the single source of truth for the recap.
      const s = seedFullProof();
      const partition = partitionActiveElements(s);
      const fakeRisk = {
        id: 'RISK-99',
        type: 'RISK',
        status: 'active',
        statement: 'fake risk pushed only into partition lane, not into state.elements',
        basis: [],
      };
      partition.activeRisks.push(fakeRisk);
      const out = renderProofRecap(s, partition);
      expect(out).toContain('RISK-99');
      expect(out).toContain('fake risk pushed only into partition lane');
      // Sanity check: state.elements does NOT contain RISK-99, proving the recap
      // came from the partition lane mutation rather than from raw state.
      expect(s.elements.get('RISK-99')).toBeUndefined();
    });
  });

  describe('renderElementDeep', () => {
    it('returns markdown for an in-scope element with all sub-fields', () => {
      const s = seedFullProof();
      const out = renderElementDeep('NCON-1', s);
      expect(out).toContain('NCON-1');
      expect(out).toContain('must Q');
      expect(out).toContain('breaks if no Q');
    });

    it('surfaces withdrawal_disposition for withdrawn elements', () => {
      let s = seedFullProof();
      const r = applyOperations(s, [{ op: 'withdraw', target: 'NCON-2', withdrawal_disposition: 'superseded' }], consent);
      s = r.state;
      const out = renderElementDeep('NCON-2', s);
      expect(out).toContain('NCON-2');
      expect(out).toContain('superseded');
    });

    it('returns null for an unknown ID (handler will translate to ELEMENT_NOT_FOUND)', () => {
      const s = seedFullProof();
      expect(renderElementDeep('NCON-999', s)).toBeNull();
    });
  });
  ```

  **Run:** `npx vitest run skills/design-large-task/proof-mcp/__tests__/render-proof-state.test.js`
  **Expected:** the two new blocks fail because `renderProofRecap` and `renderElementDeep` are not exported.

- [ ] **Step 2: Confirm failure mode.**

  **Run:** `npx vitest run skills/design-large-task/proof-mcp/__tests__/render-proof-state.test.js 2>&1 | head -30`
  **Expected:** vitest reports the missing exports.

- [ ] **Step 3: Implement `renderProofRecap` and `renderElementDeep`.**

  Append to `skills/design-large-task/proof-mcp/state-render.js`:

  ```javascript
  /**
   * Numeric-suffix comparator. Splits the trailing integer off an ID and compares
   * numerically so NCON-3 sorts before NCON-10. Falls back to lexicographic on prefix.
   */
  function compareById(a, b) {
    const splitId = (id) => {
      const m = (id ?? '').match(/^([A-Z]+-)(\d+)$/);
      return m ? [m[1], Number(m[2])] : [id ?? '', 0];
    };
    const [pa, na] = splitId(a.id);
    const [pb, nb] = splitId(b.id);
    if (pa !== pb) return pa < pb ? -1 : 1;
    return na - nb;
  }

  /**
   * Renders the active proof body as a markdown recap. Eight sections in fixed order:
   * Problem Statement (preamble), Concerns, Rules, Permissions, Evidence,
   * Necessary Conditions, Resolve Conditions, Risks. Reads section contents only from
   * the supplied partition so the partitioner is the single source of truth for
   * active-by-type filtering.
   *
   * @param {object} state - proof state (used for problemStatement only)
   * @param {object} partition - output of partitionActiveElements(state)
   * @returns {string} rendered markdown
   */
  export function renderProofRecap(state, partition) {
    let out = '';
    out += renderHeading('Problem Statement');
    out += `${state.problemStatement ?? ''}\n\n`;

    out += renderHeading('Concerns');
    for (const c of [...partition.activeConcerns].sort(compareById)) {
      out += renderBullet(c.id, c.status ?? 'unknown', c.label ?? '');
    }
    out += '\n';

    out += renderHeading('Rules');
    for (const el of [...partition.activeRules].sort(compareById)) {
      out += renderRule(el, isOutsizedRule(el.statement ?? '', OUTSIZED_RULE_THRESHOLD));
    }
    out += '\n';

    out += renderHeading('Permissions');
    for (const el of [...partition.activePermissions].sort(compareById)) {
      out += renderBullet(el.id, elementMeta(el), firstSentence(el.statement ?? ''));
    }
    out += '\n';

    out += renderHeading('Evidence');
    for (const el of [...partition.activeEvidence].sort(compareById)) {
      out += renderBullet(el.id, elementMeta(el), firstSentence(el.statement ?? ''));
    }
    out += '\n';

    out += renderHeading('Necessary Conditions');
    for (const el of [...partition.activeNCsAll].sort(compareById)) {
      out += renderBullet(el.id, elementMeta(el), firstSentence(el.statement ?? ''));
    }
    out += '\n';

    out += renderHeading('Resolve Conditions');
    for (const el of [...partition.activeRCs].sort(compareById)) {
      out += renderBullet(el.id, elementMeta(el), firstSentence(el.statement ?? ''));
    }
    out += '\n';

    out += renderHeading('Risks');
    for (const el of [...partition.activeRisks].sort(compareById)) {
      out += renderBullet(el.id, elementMeta(el), firstSentence(el.statement ?? ''));
    }
    out += '\n';

    return out;
  }

  /**
   * Renders a single element by ID with full sub-fields. Returns null when the ID is
   * absent in the state's storages. Callers (the server handler) translate null to a
   * structured ELEMENT_NOT_FOUND refusal.
   */
  export function renderElementDeep(elementId, state) {
    const found = findElementById(state, elementId);
    if (!found) return null;
    if (elementId.startsWith('CERN-')) return renderConcern(found);
    switch (found.type) {
      case 'NECESSARY_CONDITION': return renderNC(found);
      case 'RULE':                return renderRule(found, false); // deep mode: no truncation
      case 'PERMISSION':          return renderPermission(found);
      case 'EVIDENCE':            return renderEvidence(found);
      case 'RISK':                return renderRisk(found);
      case 'RESOLVE_CONDITION':   return renderRC(found);
      default:                    return null;
    }
  }
  ```

  **Run:** `npx vitest run skills/design-large-task/proof-mcp/__tests__/render-proof-state.test.js`
  **Expected:** every test in the file passes.

- [ ] **Step 4: Verify the full proof-mcp suite is unaffected.**

  **Run:** `cd skills/design-large-task/proof-mcp && npm test`
  **Expected:** previous 529 + the new render tests all green.

- [ ] **Step 5: Commit.**

  **Run:** `git add skills/design-large-task/proof-mcp/state-render.js skills/design-large-task/proof-mcp/__tests__/render-proof-state.test.js && git commit -m "feat: add renderProofRecap and renderElementDeep top-level exports"`
  **Expected:** one commit landing the two top-level exports plus their tests.

---

## Task 5: Register `render_proof_state` tool in `server.js`

- **Type:** code-producing
- **Implements:** AC-1.1 (TOOLS entry + dispatcher case + handler export), AC-1.2 (no consent token, no `proofStatus` gating), AC-1.3 (inline-only, no filesystem writes), AC-3.4 (`ELEMENT_NOT_FOUND` structured refusal); also closes AC-4.1 (full file passing under `npm test`) and AC-4.2 (no existing test edited).
- **Decision budget:** 2
- **Must remain green:** full proof-mcp test suite — `npm test` reports the prior 529 + the new `render-proof-state.test.js` tests passing
- **Files:**
  - Modify `skills/design-large-task/proof-mcp/server.js` — TOOLS array (around line 290) gains a new entry; dispatcher (around line 327) gains a new `case`; new exported handler `handleRenderProofState` after `handleGetProofState` (around line 478)
  - Modify `skills/design-large-task/proof-mcp/__tests__/render-proof-state.test.js` — append handler test block

### TDD steps

- [ ] **Step 1: Write failing tests for the tool registration and the handler.**

  Append a new `describe('render_proof_state tool', ...)` block. The block exercises the handler end-to-end through the saved-state-file path so it covers `loadState`, partition + recap, deep render, and the `ELEMENT_NOT_FOUND` structured refusal.

  ```javascript
  import { TOOLS, handleRenderProofState } from '../server.js';
  import { readdirSync, statSync } from 'fs';

  function dirSnapshot(dir) {
    return readdirSync(dir).map(name => {
      const st = statSync(join(dir, name));
      return { name, size: st.size, mtimeMs: st.mtimeMs };
    });
  }

  describe('render_proof_state tool', () => {
    let workdir;
    let stateFile;

    beforeEach(() => {
      workdir = mkdtempSync(join(tmpdir(), 'proof-render-'));
      stateFile = join(workdir, 'state.json');
      const s = seedFullProof();
      saveState(s, stateFile);
    });

    afterEach(() => { rmSync(workdir, { recursive: true, force: true }); });

    it('TOOLS array contains a render_proof_state entry with the correct schema', () => {
      const entry = TOOLS.find(t => t.name === 'render_proof_state');
      expect(entry).toBeDefined();
      expect(entry.inputSchema.properties.state_file).toBeDefined();
      expect(entry.inputSchema.properties.element_id).toBeDefined();
      expect(entry.inputSchema.properties.consent).toBeUndefined();
      expect(entry.inputSchema.required).toEqual(['state_file']);
    });

    it('recap mode succeeds against any proofStatus, including finish, with no consent', () => {
      // Force proofStatus = 'finish' on the saved state and re-save.
      const s = loadState(stateFile);
      s.proofStatus = 'finish';
      saveState(s, stateFile);

      const result = handleRenderProofState({ state_file: stateFile });
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toMatch(/^## Problem Statement/);
    });

    it('deep mode returns markdown for an in-scope element', () => {
      const result = handleRenderProofState({ state_file: stateFile, element_id: 'NCON-1' });
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('NCON-1');
      expect(result.content[0].text).toContain('must Q');
    });

    it('returns ELEMENT_NOT_FOUND structured refusal for an unknown ID', () => {
      const result = handleRenderProofState({ state_file: stateFile, element_id: 'NCON-999' });
      expect(result.isError).toBe(true);
      const body = JSON.parse(result.content[0].text);
      expect(body).toEqual({ code: 'ELEMENT_NOT_FOUND', message: 'Element NCON-999 not found in state.' });
    });

    it('returns ELEMENT_NOT_FOUND for FRIC- prefix (out of scope)', () => {
      // Add a friction so FRIC-1 actually exists in elements; the handler must still
      // refuse because findElementById does not route FRIC- prefixes.
      const s = loadState(stateFile);
      // Manually inject a FRICTION element so the storage check is honest.
      s.elements.set('FRIC-1', { id: 'FRIC-1', type: 'FRICTION', status: 'active', friction_shape: 'shape', anchor_a: 'CERN-1', anchor_b: 'CERN-1', disposition: 'no-conflict', statement: 'fric body' });
      saveState(s, stateFile);
      const result = handleRenderProofState({ state_file: stateFile, element_id: 'FRIC-1' });
      expect(result.isError).toBe(true);
      const body = JSON.parse(result.content[0].text);
      expect(body.code).toBe('ELEMENT_NOT_FOUND');
    });

    it('does not write any files in either mode', () => {
      const before = dirSnapshot(workdir);
      handleRenderProofState({ state_file: stateFile });
      handleRenderProofState({ state_file: stateFile, element_id: 'NCON-1' });
      const after = dirSnapshot(workdir);
      expect(after).toEqual(before);
    });
  });
  ```

  **Run:** `npx vitest run skills/design-large-task/proof-mcp/__tests__/render-proof-state.test.js`
  **Expected:** the new block fails because `handleRenderProofState` is not exported and the TOOLS array has no `render_proof_state` entry.

- [ ] **Step 2: Confirm failure mode.**

  **Run:** `npx vitest run skills/design-large-task/proof-mcp/__tests__/render-proof-state.test.js 2>&1 | head -40`
  **Expected:** vitest reports `handleRenderProofState is not a function` (or the import itself fails).

- [ ] **Step 3: Register the tool, add the dispatcher case, and implement the handler.**

  Edit `skills/design-large-task/proof-mcp/server.js`:

  1. **Imports.** At the top, add:

     ```javascript
     import { partitionActiveElements } from './closing-argument.js';
     import { renderProofRecap, renderElementDeep } from './state-render.js';
     ```

  2. **TOOLS array.** Append a new entry inside the `TOOLS = [ ... ]` block, before the closing `];` at line 290:

     ```javascript
     {
       name: 'render_proof_state',
       description: 'Render the active proof body as a markdown recap (no element_id) or render one element with full sub-fields (element_id supplied). Read-only — no consent token, no proofStatus gating, no filesystem writes.',
       inputSchema: {
         type: 'object',
         properties: {
           state_file: { type: 'string', description: 'Absolute path to state JSON' },
           element_id: { type: 'string', description: 'Optional element ID for deep render. Without this, returns the eight-section recap.' },
         },
         required: ['state_file'],
       },
     },
     ```

     Confirm `consent` is **not** included in `properties` and is not in `required`.

  3. **Dispatcher case.** Add a new case to the `switch (name)` block (next to the other read-only handlers, after `case 'get_proof_state':`):

     ```javascript
     case 'render_proof_state':
       return handleRenderProofState(args);
     ```

  4. **Handler.** Add `handleRenderProofState` as a named export, just below `handleGetProofState`:

     ```javascript
     export function handleRenderProofState({ state_file, element_id }) {
       const state = loadState(state_file);

       if (element_id) {
         const rendered = renderElementDeep(element_id, state);
         if (rendered === null) {
           return {
             content: [{
               type: 'text',
               text: JSON.stringify({
                 code: 'ELEMENT_NOT_FOUND',
                 message: `Element ${element_id} not found in state.`,
               }),
             }],
             isError: true,
           };
         }
         return { content: [{ type: 'text', text: rendered }] };
       }

       const partition = partitionActiveElements(state);
       const rendered = renderProofRecap(state, partition);
       return { content: [{ type: 'text', text: rendered }] };
     }
     ```

     The handler does not call `validateConsentToken`, does not branch on `state.proofStatus`, and does not call `saveState`/`writeFileSync`/`renameSync`. The dispatcher's existing top-level `try`/`catch` (lines 330–338) handles `loadState` I/O errors uniformly.

  **Run:** `npx vitest run skills/design-large-task/proof-mcp/__tests__/render-proof-state.test.js`
  **Expected:** every `it` in the file passes.

- [ ] **Step 4: Run the full proof-mcp suite.**

  **Run:** `cd skills/design-large-task/proof-mcp && npm test`
  **Expected:** vitest summary reports the prior 529 tests plus the new `render-proof-state.test.js` cases all passing; no existing test file modified in the diff.

- [ ] **Step 5: Commit.**

  **Run:** `git add skills/design-large-task/proof-mcp/server.js skills/design-large-task/proof-mcp/__tests__/render-proof-state.test.js && git commit -m "feat: register render_proof_state tool in proof MCP"`
  **Expected:** one final commit closing the sprint's implementation work; the sub-sprint branch ready for execute-verify-complete.

<!-- created-at: 2026-05-09T12:27:33Z -->
<!-- produced-by plan-build@v0004 -->
