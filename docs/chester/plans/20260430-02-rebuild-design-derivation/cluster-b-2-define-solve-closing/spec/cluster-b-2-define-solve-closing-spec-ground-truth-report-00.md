# Ground-Truth Review Report — Cluster B.2 Spec

**Spec reviewed:** `spec/cluster-b-2-define-solve-closing-spec-00.md`
**Codebase verified against:** `/home/mike/Documents/CodeProjects/OrdinaryMoose/plugins/chester/skills/design-large-task/proof-mcp/`
**Date:** 2026-05-02

---

## Status

**Findings (1 HIGH, 2 MEDIUM, 3 LOW)** — HIGH and MEDIUM fixes applied inline; LOW findings recorded as implementer context (not fixed per skill convention).

---

## Verified Claims

- `ELEMENT_TYPES` array in `proof.js` — CONFIRMED at proof.js:13-15 (six entries; FRICTION would be seventh).
- `ID_PREFIX` map in `state.js` — CONFIRMED at state.js:16-23.
- `elementCounters` initial shape — CONFIRMED at state.js:35-37.
- `applyOperations` increments `state.round` — CONFIRMED at state.js:149.
- Mutating exports in `state.js` (`applyOperations`, `addConcern`, `lockConcerns`, `ratifyResolveCondition`, `markChallengeUsed`) — CONFIRMED at state.js:57, 74, 94, 145, 284.
- `validateRefs` exists, exported, signature `(refs, elements)` returning string array — CONFIRMED at proof.js:115-123 (reusable for FRICTION anchor validation).
- `checkAllIntegrity` exists at proof.js:317-326 — CONFIRMED (extension by editing the spread list).
- `checkConcernCoverage(state)` returns `{ covered, uncovered }` — CONFIRMED at metrics.js:218-247.
- `computeCompleteness` returns `condition_count`, `conditions_with_alternatives`, `resolve_condition_count`, `ratified_rc_count` — CONFIRMED at metrics.js:60-73.
- `ratificationLog` `cleared-on-revise` event shape `{ event, target, round, fields }` — CONFIRMED at state.js:212-217.
- `loadState` backfill pattern using `??=` — CONFIRMED at state.js:314-322.
- `package.json` `"type": "module"` — CONFIRMED at package.json:4 (ES module syntax assumed by spec is correct).
- Cluster A's RESOLVE_CONDITION pattern touches `proof.js`, `state.js`, `metrics.js`, `server.js` plus brief template and design-specify reference — six touchpoints total; spec's "six-touchpoint pattern" claim consistent.
- `ratifyResolveCondition` does not bump round — CONFIRMED at state.js:94-119.
- `cloneElements` exists as the established immutability helper — CONFIRMED at state.js:331-337 (module-private; new state.js exports use it directly).

---

## Findings

### HIGH — Testing Strategy targeted the wrong test framework and directory

- **Spec said:** "Unit tests (under `tests/`): `test-friction-element-type.sh` ... [bash test scripts]" and "100% branch coverage on `closing-argument.js` and `friction-detection.js`."
- **Code shows:** `package.json` scripts use `vitest` (`"test": "vitest run"`); existing tests live at `proof-mcp/__tests__/*.test.js` (e.g., `state.test.js`, `metrics.test.js`, `proof.test.js`, `server.test.js`, `acceptance.test.js`, `concerns.test.js`) using `import { describe, it, expect } from 'vitest'`. There is no `tests/` directory and no bash test convention in proof-mcp.
- **Impact:** Implementer following the spec literally would create `tests/test-*.sh` bash scripts that cannot be run by the project's `npm test` command and would not exercise the JS modules.
- **Fix applied:** Testing Strategy section rewritten to use vitest with `*.test.js` files in `proof-mcp/__tests__/`. Eleven test files renamed; integration tests renamed to `*.test.js`; convention statement added at the top of the section referencing existing precedent files.

### MEDIUM — AC examples used wrong NC ID prefix

- **Spec said:** AC-1.2 / AC-1.4 / AC-2.2 used `NC-1` / `NC-2` / `NC-99` for NC element IDs.
- **Code shows:** NC IDs use the `NCON-` prefix per `ID_PREFIX.NECESSARY_CONDITION = 'NCON-'` at state.js:20; cluster A spec consistently uses `NCON-N`; spec B.2 itself uses `NCON-3`, `NCON-7` elsewhere.
- **Impact:** Internal inconsistency in test fixtures. Implementer writing tests must use `NCON-N`.
- **Fix applied:** All `NC-N` example references in AC Given/When clauses replaced with `NCON-N`.

### MEDIUM — `groundingCoverage` is not a `computeCompleteness` field

- **Spec said:** Components line for `metrics.js` only mentioned adding fields to `computeCompleteness`; AC-4.1 lists "grounding coverage ≥ 0.9" as one of `evaluateTrigger`'s per-signal floors; AC-4.2 formula uses `groundingCoverage`.
- **Code shows:** `computeCompleteness` (metrics.js:21-74) does NOT include `groundingCoverage`. The grounding coverage value comes from a separate exported function `computeGroundingCoverage(elements)` (metrics.js:84-129). The merge happens at the caller via `{...computeCompleteness(...), groundingCoverage: computeGroundingCoverage(...)}` at state.js:256-259.
- **Impact:** `evaluateTrigger(state)` in `metrics.js` must call BOTH functions. Without this clarification, an implementer reading only `computeCompleteness` would miss the grounding number and the trigger gate would silently be wrong.
- **Fix applied:** Components line for `metrics.js` extended to specify `evaluateTrigger` must call both `computeCompleteness` and `computeGroundingCoverage` and merge them via spread, with code-line precedent reference.

---

## Findings (LOW — implementer context, not fixed)

### LOW — `checkAllIntegrity` is not extensibly composable

- **Spec said:** "register in `checkAllIntegrity`" for the new `checkUngroundedFrictionAnchors`.
- **Code shows:** `checkAllIntegrity` (proof.js:317-326) is a hardcoded array spread of six checks; "register" means edit the function body to add a seventh spread.
- **Impact:** Wording is fine for an implementer; flagged because the prompt asked whether the function is composable via extension hooks (it is not). Direct edit is the only path.

### LOW — `friction_count` / `live_friction_count` modeling does not match existing one-counter pattern

- **Spec said:** "add `friction_count` and `live_friction_count` to `computeCompleteness`."
- **Code shows:** `computeCompleteness` uses one `if (el.type === 'X') count++` block per type with active-status filtering at metrics.js:37 (existing types use a single number per type with active filtering only). For FRICTION the spec wants both total and active counts, which differs from the established pattern.
- **Impact:** A small modeling decision — implementer must decide whether `friction_count` includes withdrawn FRICTION elements (the active-only filter at line 37 currently skips withdrawn entirely). Either move the filter or add an early branch.

### LOW — `markChallengeUsed` `clearClosingFlags` requirement is currently redundant in practice

- **Spec said:** NCON-4 Constraints lists `markChallengeUsed` among "do NOT bump round" functions requiring `clearClosingFlags`.
- **Code shows:** server.js:200-202 calls `markChallengeUsed` only after `applyOperations` has already run (and already cleared flags). Today's runtime order makes the clear-on-`markChallengeUsed` redundant.
- **Impact:** Spec discipline is correct; flagged because the redundancy is a minor footnote — the principle still holds for future use sites and tests, and the cost of always clearing is one assignment.

---

## Risk Assessment

The spec is structurally solid and most code references are accurate. The HIGH finding (test framework mismatch) was the only thing that would have broken implementation outright; the inline rewrite of the Testing Strategy section now matches vitest convention. The two MEDIUM findings (NC vs NCON ID prefix in examples, `groundingCoverage` source) are clarifications that prevent friction during implementation. The three LOW findings are useful context — none invalidate the architecture; none required spec edits per skill convention. Plan stage is safe to proceed.

---

## Provenance Trailer

*(stamped after report write — see `chester-trailer-write` invocation in design-specify SKILL.md)*

<!-- created-at: 2026-05-03T02:19:49Z -->
<!-- produced-by design-specify@v0003 -->
