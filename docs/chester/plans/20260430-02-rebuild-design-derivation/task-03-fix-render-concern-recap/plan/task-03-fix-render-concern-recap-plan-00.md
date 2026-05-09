# Plan: Fix render_proof_state Concern Recap

**Sprint:** task-03-fix-render-concern-recap
**Spec:** none — direct from brief at `design/task-03-fix-render-concern-recap-design-00.md`
**Execution mode:** subagent

> **For agentic workers:** Use execute-write to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The `Execution mode` field selects which execute-write section runs — Section 2 (subagent-driven) or Section 3 (inline). plan-build sets this field at handoff based on the Execution Mode Selection heuristic, with human confirm/override.

## Goal

Make `renderProofRecap` print each Concern's `description` field inline alongside its label so the top-level recap matches the discoverability pattern of every other element type.

## Architecture

`state-render.js` already provides `firstSentence` and `renderBullet` primitives, and per-type `renderConcern` correctly emits label, description, and status as sub-bullets in deep mode. Only `renderProofRecap`'s Concern loop deviates from the inline-statement pattern used by Rules / Permissions / Evidence / NCs / RCs / Risks. Fix is a one-line shape change at the recap call site, factored through a small `concernRecapSummary(c)` helper so the format is testable in isolation and the call site stays readable.

## Tech Stack

JavaScript (ES module), Node.js 20+, vitest for tests. Source at `skills/design-large-task/proof-mcp/state-render.js`. Tests at `skills/design-large-task/proof-mcp/__tests__/render-proof-state.test.js`. No build step — vitest reads ES modules directly.

## Acceptance Criteria (synthesized from brief — no spec)

- **AC-1.1** — In recap mode, every active Concern's bullet line includes the `firstSentence` of its `description` field.
- **AC-1.2** — When both `label` and `description` are present on a Concern, both appear in the bullet, with the label preceding the description and a `:` separator.
- **AC-1.3** — When `description` is empty/missing, the bullet shows the label alone (backward-compatible with proofs whose Concerns lack descriptions).
- **AC-1.4** — Deep-render mode (`renderConcern`) is unchanged; it continues to emit label, description, and status as sub-bullets.
- **AC-1.5** — All 40 existing tests in `__tests__/render-proof-state.test.js` continue to pass.

---

## Task 1: Add Concern description to recap rendering

**Type:** code-producing
**Implements:** AC-1.1, AC-1.2, AC-1.3, AC-1.4, AC-1.5
**Decision budget:** 0
**Must remain green:** all 42 tests in `skills/design-large-task/proof-mcp/__tests__/render-proof-state.test.js` (40 existing plus the 2 added in Step 1).

**Files:**
- Modify: `skills/design-large-task/proof-mcp/state-render.js` (insert helper after `renderRisk` around line 139; modify the Concern loop in `renderProofRecap` at lines 193-197)
- Modify: `skills/design-large-task/proof-mcp/__tests__/render-proof-state.test.js` (append two tests at the end of the existing `describe('renderProofRecap', ...)` block, after the "reads from the partition object..." test ending around line 354)

**Steps (TDD):**

- [ ] **Step 1: Write the failing tests**

Add two new `it` blocks at the end of the existing `describe('renderProofRecap', () => { ... })` block (immediately before its closing `});` near line 355):

```javascript
  it('Concerns section includes description firstSentence inline alongside label (AC-1.1, AC-1.2)', () => {
    const s = seedFullProof();
    const out = renderProofRecap(s, partitionActiveElements(s));
    const concernsSection = out.slice(out.indexOf('## Concerns'), out.indexOf('## Rules'));
    expect(concernsSection).toMatch(/^- \*\*CERN-1\*\*.*concern X: d\b/m);
  });

  it('Concerns section falls back to label-only when description is absent (AC-1.3)', () => {
    // Omit description entirely — addConcern stores description ?? null, so this
    // exercises the null-description shape that production legacy concerns carry,
    // not the empty-string shape an explicit '' would produce.
    let s = initializeState('design problem');
    const [, sa] = addConcern(s, { label: 'concern Y' }, consent);
    s = sa;
    const out = renderProofRecap(s, partitionActiveElements(s));
    const concernsSection = out.slice(out.indexOf('## Concerns'), out.indexOf('## Rules'));
    expect(concernsSection).toMatch(/^- \*\*CERN-1\*\*.*concern Y\b/m);
    expect(concernsSection).not.toContain('concern Y:');
  });
```

The first test seeds a Concern with `label: 'concern X', description: 'd'` (matching `seedFullProof`'s existing fixture) and asserts the recap line contains `concern X: d`. The second test seeds a Concern with empty description and asserts the recap line contains `concern Y` without the trailing `:` separator.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run __tests__/render-proof-state.test.js`

Expected: the two new tests FAIL because the current recap line emits only the label (line 195 of `state-render.js` reads `c.label ?? ''`); description text "d" never appears in the recap output. The 40 existing tests continue to pass.

- [ ] **Step 3: Write minimal implementation**

In `skills/design-large-task/proof-mcp/state-render.js`, insert the following helper immediately after the `renderRisk` function (which ends at line 138) and before the `findElementById` JSDoc block (line 140):

```javascript
/**
 * Compose the recap-line summary for a Concern: label and description firstSentence
 * joined with ": " when both are present; one alone when the other is empty.
 * Concerns lack a `statement` field (their primary text lives in `description`),
 * which is why the generic `firstSentence(el.statement)` shape used by every other
 * element type does not apply to this lane.
 */
export function concernRecapSummary(c) {
  const label = (c?.label ?? '').trim();
  const desc = firstSentence(c?.description ?? '').trim();
  if (label && desc) return `${label}: ${desc}`;
  return desc || label || '';
}
```

Then modify the Concern loop in `renderProofRecap`. Replace lines 193-197:

```javascript
  out += renderHeading('Concerns');
  for (const c of [...partition.activeConcerns].sort(compareById)) {
    out += renderBullet(c.id, c.status ?? 'unknown', c.label ?? '');
  }
  out += '\n';
```

With:

```javascript
  out += renderHeading('Concerns');
  for (const c of [...partition.activeConcerns].sort(compareById)) {
    out += renderBullet(c.id, c.status ?? 'unknown', concernRecapSummary(c));
  }
  out += '\n';
```

The status-handling line (`c.status ?? 'unknown'`) is left untouched — it predates this fix and is out of scope per the brief.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd skills/design-large-task/proof-mcp && npx vitest run __tests__/render-proof-state.test.js`

Expected: all 42 tests PASS (40 pre-existing plus the 2 added in Step 1). No regressions.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/proof-mcp/state-render.js skills/design-large-task/proof-mcp/__tests__/render-proof-state.test.js
git commit -m "fix(proof-mcp): include Concern description in renderProofRecap

The recap previously rendered Concerns with label-only summaries, asymmetric
with every other element type. concernRecapSummary now joins label and
firstSentence(description), preserving label-only fallback for proofs without
descriptions.

Closes task-03 brief."
```

<!-- created-at: 2026-05-09T15:58:52Z -->
<!-- produced-by plan-build@v0004 -->
