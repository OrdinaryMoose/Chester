# Plan: Authority Rebalance + Designer-Inform Channel

**Sprint:** sprint-02-bug-fix-08
**Spec:** docs/chester/working/20260511-01-mp-redesign-proof-system/sprint-02-bug-fix-08/spec/sprint-02-bug-fix-08-spec-00.md
**Execution mode:** subagent

> **For agentic workers:** Use execute-write to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax. The `Execution mode` field selects which execute-write section runs.

## Goal

Land three coordinated changes: rewrite per-category authority allowlists (D1), add centralized `agent_action` EDB fact emission for DESIGN_PARTNER actions (D2), revert sprint-02-bug-fix-07 D12 reviseResolution dual-partner approval to designer-only (D3).

## Architecture

Hybrid (per spec): central `agent_action` emission in `runOperation` step-5/6 boundary; minimal-surface schema rewrite for D1; D3 revert in REVISE_RESOLUTION OperationSpec only — `reviseProposition` untouched.

## Tech Stack

- Node.js + ESM modules under `skills/design-proof-system/references/domain/`
- Vitest as test runner; tests in `domain/__tests__/`
- No new external dependencies

## Cross-Cutting Decisions

- **Authority matrix is binding.** Per brief: 5 designer-only (RULE, PERMISSION, DEFINITION, CONCERN, RESOLUTION); 4 designer+agent on add/revise/withdraw (EVIDENCE, PROPOSITION, RISK, FRICTION); PROPOSITION retains DESIGN_PARTNER on ratify.
- **Central emission only.** No translator signature changes. All `agent_action` facts come from a single `runOperation` insertion point.
- **D3 reverts D12 reviseResolution only.** `reviseProposition` retains dual-partner approval.
- **`CONSENT_INVALID` is the error code.** Confirmed at `authority.js:12,16,19`.

---

## Task 1: D1 — Rewrite authority allowlists in `CATEGORY_REGISTRY`

**Type:** code-producing
**Implements:** AC-1.1, AC-1.2, AC-1.3, AC-1.4, AC-1.5
**Decision budget:** 1 (FRICTION's authority shape — pinned: keep `SYSTEM` on add; add `DESIGN_PARTNER` to add/revise/withdraw)
**Must remain green:** `concern-schema.test.js`, `definition-schema.test.js`, `resolution-schema.test.js`, `authority.test.js`, `bridge-integration.test.js`, all existing `domain/__tests__/` files; `sprint-02-bug-fix-08.test.js` (created in Task 4)

**Files:**
- Modify: `skills/design-proof-system/references/domain/schema.js` (CATEGORY_REGISTRY entries for 7 categories — EVIDENCE, PROPOSITION, RISK, FRICTION, RESOLUTION, CONCERN, DEFINITION)
- Modify: any test in `domain/__tests__/` that ratified DEFINITION/CONCERN/RESOLUTION with `DESIGN_PARTNER` source (discovered via grep in Step 1)
- Possibly modify: `domain/__tests__/authority.test.js` and category-schema tests that assert exact authority allowlist shape (add negative guards for tightened ratify)

**Steps (TDD):**

- [ ] **Step 1: Discover existing DESIGN_PARTNER ratify call sites AND authority.ratify shape assertions (pre-implementation grep)**

Two greps — the second catches structural-assertion mismatches the call-site grep misses (e.g. `concern-schema.test.js:35`):

```bash
cd /home/mike/Documents/CodeProjects/Chester/.worktrees/sprint-02-bug-fix-08/skills/design-proof-system/references && \
  grep -rEn "ratifyElement\(.*'design_partner'|ratifyConcern\(.*'design_partner'|source:\s*'design_partner'.*ratif" domain/__tests__/ && \
  grep -rEn "authority\.ratify.*toEqual|authority\.ratify.*toContain|authority\.ratify.*DESIGN_PARTNER" domain/__tests__/
```

Record the file:line of every match from BOTH greps. First grep: call sites needing source-substitution. Second grep: structural assertions on the `authority.ratify` array shape that need updating to match the post-D1 allowlist (DESIGNER-only for DEFINITION/CONCERN/RESOLUTION).

- [ ] **Step 2: Apply the D1 schema rewrite**

In `domain/schema.js`, update the 7 `authority` blocks per the matrix below. Open each entry by `[ELEMENT_CATEGORIES.<NAME>]:` and edit the inner `authority: { ... }` object literal:

- **EVIDENCE** (current line ~68): `add: [CONSENT_SOURCES.DESIGNER, CONSENT_SOURCES.DESIGN_PARTNER], revise: [CONSENT_SOURCES.DESIGNER, CONSENT_SOURCES.DESIGN_PARTNER], withdraw: [CONSENT_SOURCES.DESIGNER, CONSENT_SOURCES.DESIGN_PARTNER], ratify: [CONSENT_SOURCES.DESIGNER]`
- **PROPOSITION** (line ~104): `add: [CONSENT_SOURCES.DESIGNER, CONSENT_SOURCES.DESIGN_PARTNER], revise: [CONSENT_SOURCES.DESIGNER, CONSENT_SOURCES.DESIGN_PARTNER], withdraw: [CONSENT_SOURCES.DESIGNER, CONSENT_SOURCES.DESIGN_PARTNER], ratify: [CONSENT_SOURCES.DESIGNER, CONSENT_SOURCES.DESIGN_PARTNER]`
- **RISK** (line ~116): same pattern as EVIDENCE
- **RESOLUTION** (line ~128): `add: [CONSENT_SOURCES.DESIGNER], revise: [CONSENT_SOURCES.DESIGNER], withdraw: [CONSENT_SOURCES.DESIGNER], ratify: [CONSENT_SOURCES.DESIGNER]` — **tightening** (drop DESIGN_PARTNER)
- **FRICTION** (line ~140): `add: [CONSENT_SOURCES.SYSTEM, CONSENT_SOURCES.DESIGNER, CONSENT_SOURCES.DESIGN_PARTNER], revise: [CONSENT_SOURCES.DESIGNER, CONSENT_SOURCES.DESIGN_PARTNER], withdraw: [CONSENT_SOURCES.DESIGNER, CONSENT_SOURCES.DESIGN_PARTNER], ratify: [CONSENT_SOURCES.DESIGNER]`
- **CONCERN** (line ~152): `add: [CONSENT_SOURCES.DESIGNER], revise: [CONSENT_SOURCES.DESIGNER], withdraw: [CONSENT_SOURCES.DESIGNER], ratify: [CONSENT_SOURCES.DESIGNER]` — **tightening** (DESIGNER-only across all four verbs per brief)
- **DEFINITION** (line ~164): same as CONCERN — DESIGNER-only across all four verbs
- **RULE** and **PERMISSION**: unchanged (already DESIGNER-only)

- [ ] **Step 3: Source-substitute the existing tests surfaced in Step 1**

For each file:line found: if the target element is DEFINITION/CONCERN/RESOLUTION, change `source: 'design_partner'` to `source: 'designer'` (or the equivalent `CONSENT_SOURCES.DESIGNER` constant). If the target is PROPOSITION, leave it untouched. Document each substitution in the commit message.

- [ ] **Step 4: Update authority.test.js and category-schema tests for tightened ratify**

In `domain/__tests__/authority.test.js`, find any test asserting `DESIGN_PARTNER` is allowed on RESOLUTION/CONCERN/DEFINITION ratify; update or replace with the new negative-guard assertion. Same for `concern-schema.test.js`, `definition-schema.test.js`, `resolution-schema.test.js` if any assert the full `authority.ratify` array shape.

- [ ] **Step 5: Run full test suite**

```bash
cd /home/mike/Documents/CodeProjects/Chester/.worktrees/sprint-02-bug-fix-08/skills/design-proof-system/references && npx vitest run
```

Expected: all existing tests pass after the substitutions and assertion updates. No new tests added in this task — those land in Task 4.

- [ ] **Step 6: Commit**

```bash
cd /home/mike/Documents/CodeProjects/Chester/.worktrees/sprint-02-bug-fix-08
git add skills/design-proof-system/references/domain/schema.js \
        skills/design-proof-system/references/domain/__tests__/
git commit -m "feat(design-proof-system): D1 rewrite authority allowlists; tighten DEFINITION/CONCERN/RESOLUTION; open EVIDENCE/PROPOSITION/RISK/FRICTION to agent (sprint-02-bug-fix-08)"
```

---

## Task 2: D3 — Revert reviseResolution dual-partner approval

**Type:** code-producing
**Implements:** AC-3.1, AC-3.2, AC-3.3, AC-3.4
**Decision budget:** 1 (consentCategory shape — pinned: array of one element `[CONSENT_SOURCES.DESIGNER]` for consistency with reviseProposition's array form)
**Must remain green:** `mutations.test.js`, `sprint-02-bug-fix-07.test.js` (lockstep update of AC-12.2 / AC-12.3), `sprint-02-bug-fix-08.test.js`

**Files:**
- Modify: `skills/design-proof-system/references/domain/mutations.js` (REVISE_RESOLUTION OperationSpec around line 154-175)
- Modify: `skills/design-proof-system/references/domain/__tests__/sprint-02-bug-fix-07.test.js` (AC-12.2 line 693-694; AC-12.3 line 754 — replace `two_yes_complete` assertion for Resolution-side with single-source approval + `resolution` derivation)

**Steps (TDD):**

- [ ] **Step 1: Update bug-fix-07 lockstep tests first (failing-then-fix order)**

The existing bug-fix-07 AC-12.2 test at line 693-694 asserts `bridge.queryProof({ pattern: ['two_yes_complete', [revised.id]] })` has length 1. After D3 this becomes length 0. The lockstep update:

```js
// AC-12.2 — replace the two_yes_complete assertion on the revised resolution:
// OLD:
//   const twoYes = bridge.queryProof({ pattern: ['two_yes_complete', [revised.id]] });
//   expect(twoYes.length).toBe(1);
// NEW:
const resolutionDerived = bridge.queryProof({ pattern: ['resolution', [revised.id, { var: 'S' }]] });
expect(resolutionDerived.length).toBe(1);
const approvalRows = bridge.queryProof({ pattern: ['approved', [revised.id, { var: 'SRC' }, { var: 'T' }]] });
expect(approvalRows.length).toBe(1);
expect(approvalRows[0].SRC).toBe('designer');
```

AC-12.3 line 754 asserts `bridge.queryProof({ pattern: ['two_yes_complete', [newRes.id]] }).length).toBe(1)`. Same replacement pattern. Note that AC-12.3 ALSO asserts `two_yes_complete` for `newProp.id` at line 753 — leave that unchanged (Proposition retains dual-partner ratify).

- [ ] **Step 2: Run the updated bug-fix-07 tests to confirm they currently fail (or assert the wrong thing) before D3**

```bash
cd /home/mike/Documents/CodeProjects/Chester/.worktrees/sprint-02-bug-fix-08/skills/design-proof-system/references && \
  npx vitest run domain/__tests__/sprint-02-bug-fix-07.test.js -t "AC-12.2"
```

Expected: the new assertions will fail because pre-D3, the EDB has 2 approved rows for the revised resolution (not 1).

- [ ] **Step 3: Apply D3 in mutations.js**

In `domain/mutations.js`, locate `OPERATION_SPECS[ACTION_LABELS.REVISE_RESOLUTION]` (around line 154-175):

a) Change `consentCategory: [CONSENT_SOURCES.DESIGNER, CONSENT_SOURCES.DESIGN_PARTNER]` to `consentCategory: [CONSENT_SOURCES.DESIGNER]`.

b) In the `translate` function's `baseFacts` array, remove these two lines:

```js
['approved', [id, CONSENT_SOURCES.DESIGN_PARTNER, ts]],
['two_yes', [id, CONSENT_SOURCES.DESIGN_PARTNER]],
```

Retain:
```js
['approved', [id, CONSENT_SOURCES.DESIGNER, ts]],
['two_yes', [id, CONSENT_SOURCES.DESIGNER]],
```

**Do NOT touch `OPERATION_SPECS[ACTION_LABELS.REVISE_PROPOSITION]`.** Proposition retains dual-partner ratify under D1; D12's dual-partner approval pattern stays valid there.

- [ ] **Step 4: Run tests to verify D3 + lockstep updates pass**

```bash
cd /home/mike/Documents/CodeProjects/Chester/.worktrees/sprint-02-bug-fix-08/skills/design-proof-system/references && npx vitest run
```

Expected: all tests pass. AC-12.2 / AC-12.3 Resolution-side assertions pass; AC-12.1 (`reviseProposition` two_yes_complete) continues to pass unchanged.

- [ ] **Step 5: Commit**

```bash
git add skills/design-proof-system/references/domain/mutations.js \
        skills/design-proof-system/references/domain/__tests__/sprint-02-bug-fix-07.test.js
git commit -m "fix(design-proof-system): D3 revert reviseResolution dual-partner approval to designer-only (sprint-02-bug-fix-08)"
```

---

## Task 3: D2 — Register `agent_action` EDB predicate

**Type:** code-producing
**Implements:** AC-2.1, AC-2.2, AC-2.3 (predicate-registration portion; emission lives in Task 4-prep / actually emission is in mutations.js below — Task 3 handles ONLY the EDB_PREDICATES + boot-validator gate)
**Decision budget:** 0
**Must remain green:** `boot-validators.test.js`, `bridge-integration.test.js`, `sprint-02-bug-fix-08.test.js`

**Files:**
- Modify: `skills/design-proof-system/references/domain/translation.js` (EDB_PREDICATES set around line 196-205)
- Modify: `skills/design-proof-system/references/domain/render.js` (PROJECTION_ARITIES map around line 289-300 — add `agent_action: 4` so `renderDatalogProjection` includes the new fact in its projection output)
- Modify: `skills/design-proof-system/references/domain/domain-bridge.js` (validPredicates seed in `createDomainBridge` only; check if `agent_action` needs explicit inclusion or if `getDeclaredEDBPredicates()` already pulls it in)

**Steps (TDD):**

- [ ] **Step 1: Add `agent_action` to EDB_PREDICATES**

In `domain/translation.js`, locate the `EDB_PREDICATES` Set declaration (around line 196-205). Add `'agent_action'` to the Set literal.

- [ ] **Step 1b: Add `agent_action: 4` to PROJECTION_ARITIES in `render.js`**

In `domain/render.js`, locate the `PROJECTION_ARITIES` object literal (around line 289-300). Add `agent_action: 4`. The arity is 4: `(elementId, verb, source, ts)`. Without this entry, `renderDatalogProjection` silently drops `agent_action` facts from its output, and AC-2.3 will fail.

The file's own comment block says PROJECTION_ARITIES MUST mirror EDB_PREDICATES; adding to both is required when introducing a new EDB predicate.

- [ ] **Step 2: Confirm boot path accepts the new predicate**

Read `domain-bridge.js` `createDomainBridge` validPredicates assembly (around line 50). Either:
- `validPredicates` is populated from `getDeclaredEDBPredicates()` (which reads `EDB_PREDICATES`) — no change needed, automatic inclusion;
- OR `validPredicates` has a literal supplemental list. If so, add `'agent_action'` to that list too.

Inspect and decide; add only if needed.

- [ ] **Step 3: Run boot-validator tests + bridge integration**

```bash
cd /home/mike/Documents/CodeProjects/Chester/.worktrees/sprint-02-bug-fix-08/skills/design-proof-system/references && \
  npx vitest run domain/__tests__/boot-validators.test.js domain/__tests__/bridge-integration.test.js
```

Expected: pass — no preconditions or postconditions reference `agent_action`, so the validator accepts the addition silently.

- [ ] **Step 4: Commit**

```bash
git add skills/design-proof-system/references/domain/translation.js \
        skills/design-proof-system/references/domain/render.js \
        skills/design-proof-system/references/domain/domain-bridge.js
git commit -m "feat(design-proof-system): D2 register agent_action EDB predicate + PROJECTION_ARITIES entry (sprint-02-bug-fix-08)"
```

---

## Task 4: D2 — Central emission in `runOperation` + behavioral tests

**Type:** code-producing
**Implements:** AC-2.1, AC-2.2, AC-2.3, plus full behavioral coverage of AC-1.1 through AC-1.5 and AC-3.x via the new test file
**Decision budget:** 2 (targetId fallback chain semantics — pinned: `id ?? args.elementId ?? args.id ?? null`; whether to assert on `agent_action` fact arity in a structural test — pinned: yes, one arity test)
**Must remain green:** `mutations.test.js`, `bridge-integration.test.js`, all `domain/__tests__/`

**Files:**
- Modify: `skills/design-proof-system/references/domain/mutations.js` (`runOperation` — insert D2 emission block at the §6.1 step-5/step-6 boundary around line 375)
- Create: `skills/design-proof-system/references/domain/__tests__/sprint-02-bug-fix-08.test.js` (new file covering all sprint-02-bug-fix-08 ACs)

**Steps (TDD):**

- [ ] **Step 1: Create the new test file with all the AC-1.x, AC-2.x, AC-3.x tests**

Create `domain/__tests__/sprint-02-bug-fix-08.test.js`. Follow the `makeRealBridge` fixture pattern from the adjacent `sprint-02-bug-fix-07.test.js`. Imports at the top:

```js
import { describe, it, expect } from 'vitest';
import { createDomainBridge } from '../domain-bridge.js';
import { lookupAuthority } from '../authority.js';
import { ELEMENT_CATEGORIES, CONSENT_SOURCES, ACTION_LABELS } from '../tags.js';

async function makeRealBridge({ withAllocator = false } = {}) {
  const { Engine } = await import('../../engine/Engine.js');
  const counters = new Map();
  const idAllocator = {
    next: (shape) => {
      const n = (counters.get(shape) ?? 0) + 1;
      counters.set(shape, n);
      return `${shape}_${n}`;
    },
    seed: (map) => { counters.clear(); for (const [k, v] of Object.entries(map)) counters.set(k, v); },
    highWater: (shape) => counters.get(shape) ?? 0,
  };
  const clock = { now: () => 1700000000 };
  const consentVerification = { verify: () => true };
  const persistenceRepo = { saveState: () => {} };
  const bridge = createDomainBridge({ engine: new Engine(), clock, idAllocator, consentVerification, persistenceRepo });
  return withAllocator ? { bridge, idAllocator } : bridge;
}

const designerConsent = Object.freeze({ source: CONSENT_SOURCES.DESIGNER });
const designPartnerConsent = Object.freeze({ source: CONSENT_SOURCES.DESIGN_PARTNER });
```

Then the AC blocks. AC-1.1: positive — agent permitted on add of EVIDENCE/PROPOSITION/RISK/FRICTION via `lookupAuthority` AND via real bridge calls (positive lookup test + 4 positive bridge add tests). AC-1.2: negative — RULE and PERMISSION reject DESIGN_PARTNER (2 lookup + 2 bridge throw tests). AC-1.3: negative — DEFINITION/CONCERN/RESOLUTION ratify reject DESIGN_PARTNER (3 lookup + 3 bridge throw tests; setup needs to first add the draft element with designer consent). AC-1.4: positive — PROPOSITION ratify by agent succeeds (1 test; full chain: add evidence, add+ratify proposition with design_partner). AC-1.5: positive — agent revise/withdraw on each of EVIDENCE/PROPOSITION/RISK/FRICTION (8 tests). AC-2.1: emission on three operations (Evidence add, Risk add, Proposition ratify); query returns 3 rows. AC-2.2: zero emissions for designer / system. AC-2.3: `agent_action` appears in `renderDatalogProjection`. AC-3.x: from Task 2 already implicitly verified, but include explicit confirmation: `reviseResolution` single-source; `two_yes_complete` does not derive for resolution; new resolution derives; agent reject.

Tests can be batched by topic. Write enough tests to cover the matrix without ballooning the file — use loops where the assertion shape repeats.

- [ ] **Step 2: Run the new test file to confirm AC-2.x emission tests fail (D2 emission not yet implemented)**

```bash
cd /home/mike/Documents/CodeProjects/Chester/.worktrees/sprint-02-bug-fix-08/skills/design-proof-system/references && \
  npx vitest run domain/__tests__/sprint-02-bug-fix-08.test.js
```

Expected: AC-1.x tests pass (D1 already landed via Task 1); AC-3.x tests pass (D3 already landed via Task 2); AC-2.x emission tests FAIL — no `agent_action` rows yet.

- [ ] **Step 3: Insert the D2 emission block in `runOperation` with verb-specific targetId resolution**

In `domain/mutations.js` `runOperation`, locate the `for (const [pred, a] of metaFacts) ports.facts.assertFact(pred, a)` loop (around line 374). After the loop and before `ports.query.derive()` (around line 403), insert:

```js
// D2: designer-inform channel — record every DESIGN_PARTNER action as an EDB fact.
// agent_action(elementId, verb, source, ts) — central emission, gated on consent.source.
// targetId resolution is verb-specific because the allocator-produced `id` is meaningless
// for verbs that operate on an existing element (WITHDRAW, RATIFY): for WITHDRAW the
// allocator runs and produces an unused id, so `id` is non-null but does NOT identify
// the withdrawn element — that's in `args.id`. For RATIFY `id` is null (skipped by D1
// gate) and `args.elementId` carries the target. For ADD / REVISE / REVISE_PROPOSITION /
// REVISE_RESOLUTION / MANAGE_FRICTION the allocator-produced `id` IS the target.
if (consent.source === CONSENT_SOURCES.DESIGN_PARTNER) {
  let targetId;
  if (verbName === ACTION_LABELS.WITHDRAW) {
    targetId = args.id;
  } else if (verbName === ACTION_LABELS.RATIFY) {
    targetId = args.elementId;
  } else {
    targetId = id;
  }
  ports.facts.assertFact('agent_action', [targetId, verbName, consent.source, ts]);
}
```

The branching is explicit because the allocator semantics differ across verbs. The earlier draft used a `??` fallback chain which silently emitted the unused allocator id on WITHDRAW — adversarial review caught this.

- [ ] **Step 4: Run the new file again to verify AC-2.x tests pass**

```bash
cd /home/mike/Documents/CodeProjects/Chester/.worktrees/sprint-02-bug-fix-08/skills/design-proof-system/references && \
  npx vitest run domain/__tests__/sprint-02-bug-fix-08.test.js
```

Expected: all sprint-02-bug-fix-08 tests pass.

- [ ] **Step 5: Run the full suite to confirm no regressions**

```bash
npx vitest run
```

Expected: all tests pass across `domain/__tests__/`, `domain/structural-tests/`, `engine/__tests__/`.

- [ ] **Step 6: Commit**

```bash
git add skills/design-proof-system/references/domain/mutations.js \
        skills/design-proof-system/references/domain/__tests__/sprint-02-bug-fix-08.test.js
git commit -m "feat(design-proof-system): D2 central agent_action emission + sprint-02-bug-fix-08 behavioral tests"
```

---

## Task 5: AC-4.1 — Full regression sweep

**Type:** code-producing (test changes only)
**Implements:** AC-4.1
**Decision budget:** 1 (whether any non-test files need adjustment for the broadened authority — pinned: no; D1 + D2 + D3 are self-contained)
**Must remain green:** every test under `domain/__tests__/`, `domain/structural-tests/`, `engine/__tests__/`

**Files:**
- Modify: any test file surfaced by the regression sweep that needs adjustment beyond what Tasks 1–4 already touched.

**Steps:**

- [ ] **Step 1: Run the full test suite across all three test directories**

```bash
cd /home/mike/Documents/CodeProjects/Chester/.worktrees/sprint-02-bug-fix-08/skills/design-proof-system/references && \
  npx vitest run domain/__tests__/ domain/structural-tests/ engine/__tests__/
```

Expected: all tests pass.

- [ ] **Step 2: If any tests fail, triage and fix**

Common failure modes:
- A test asserting the OLD authority shape (DESIGN_PARTNER on DEFINITION/CONCERN/RESOLUTION ratify or DESIGN_PARTNER absent from EVIDENCE/PROPOSITION/RISK/FRICTION add). Fix: mechanical assertion update.
- A test asserting `two_yes_complete` for a reviseResolution output (should have been caught in Task 2's lockstep update; if missed, fix now).
- A structural test asserting `EDB_PREDICATES` count or shape. Fix: update the count to reflect `agent_action` being present.

Document each fix in the commit message.

- [ ] **Step 3: Confirm the new sprint-02-bug-fix-08 tests are present and passing**

```bash
grep -c "^  it(" skills/design-proof-system/references/domain/__tests__/sprint-02-bug-fix-08.test.js
```

Expected: a count matching the AC count (≈ 15–20 it-blocks for the matrix coverage).

- [ ] **Step 4: Commit (skip if no test changes were needed beyond Tasks 1–4)**

```bash
git add skills/design-proof-system/references/domain/__tests__/
git commit -m "test(design-proof-system): AC-4.1 regression sweep (sprint-02-bug-fix-08)"
```

If no additional changes were needed, document that in the report rather than creating an empty commit.

<!-- created-at: 2026-05-18T21:35:36Z -->
<!-- produced-by plan-build@v0004 -->
