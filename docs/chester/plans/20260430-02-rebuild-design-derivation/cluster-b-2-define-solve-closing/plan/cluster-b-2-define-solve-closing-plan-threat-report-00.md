# Plan Hardening Threat Report — Cluster B.2

**Plan reviewed:** `plan/cluster-b-2-define-solve-closing-plan-00.md`
**Spec:** `spec/cluster-b-2-define-solve-closing-spec-00.md`
**Codebase target:** `/home/mike/Documents/CodeProjects/OrdinaryMoose/plugins/chester/skills/design-large-task/proof-mcp/`
**Date:** 2026-05-02

## Smell Heuristic Pre-Check

**Smell triggered.** Matched categories:
- *New abstractions* — FRICTION element type, `friction-detection.js`, `closing-argument.js`
- *New persistence pathways* — `frictionLog`, `closingArgPresentedRound`, `closingArgGoRound` persisted to state JSON
- *New contract surfaces* — four new MCP tools (`present_closing_argument`, `confirm_closure_go`, `manage_friction`, `override_friction_disposition`)

Both `plan-attack` and `plan-smell` ran in parallel. `plan-attack` consumed the verified-anchor skip-list from the spec-stage ground-truth report.

---

## Combined Implementation Risk Level: **Significant**

**Why this level (5 statements):**

1. Two HIGH plan-attack findings (PA-1, PA-2) show that multiple test scaffolds in the plan omit required element-creation fields (`source` on RULE/PERM/EVIDENCE; `grounding` and `reasoning_chain` on NECESSARY_CONDITION). `createElement` in proof.js throws synchronously on these omissions. At least six test scaffolds in Tasks 2, 3, 4, 6, 8, and 14 will error at the very first TDD step — implementation cannot proceed until the test code is fixed.
2. PA-8 finds the Task 9 commit stages `acceptance.test.js`, but the two `closure.permitted === true` assertions that the eleventh-condition rollout breaks live in `concerns.test.js:42` and `metrics.test.js:341,603`. After Task 9 lands as currently written, the full test suite breaks even though Step 3a's grep would find the right files.
3. PA-3 and PS-3 surface the `processFriction` mutation pattern hazard — the helper rebinds `state` per loop iteration but mutates the cloned Map directly, and the calling instruction "call `processFriction(current)` and merge" does not explicitly say "replace `current` with the returned state." A literal reading silently drops auto-created friction elements without test failure at the call site.
4. PA-4 and PS-2 surface a contract inconsistency in `clearClosingFlags`: the helper returns a fresh-cloned new state, but the plan's prose for Task 6 Step 3 instructs implementers to inline two null-assignments on existing `newState` clones rather than calling the helper. The helper's existence as an exported function with its own test creates a trap if a future caller uses it expecting old-state-untouched semantics. Either commit to inline-set everywhere and demote the helper, or commit to calling the helper everywhere and remove the per-function clone.
5. PS-1 (Mutable `CLOSING_ARG_FLOORS`) creates real test flakiness — the aggregate-score boundary test mutates the constant in place and restores via a non-`finally` path; if `evaluateTrigger` throws, the floor stays mutated for subsequent tests in the same module. `Object.freeze` at declaration plus a test-side override mechanism (e.g., a `withFloors(...)` helper that returns a synthetic `evaluateTrigger`) would resolve this cleanly.

**Lower-severity findings worth flagging but not blocking:**

- PS-4 — `server.js` duplicates `ELEMENT_TYPES` from `proof.js`; plan extends the duplication rather than consolidating. Pre-existing; latent maintenance smell.
- PA-6 / PS-5 — `closurePermitted: false` always returned by `deriveClosingArgument` because go-flag isn't set at derive time. By design (the field is the live closure check); rendering layer must label it carefully. Worth a one-line comment in `closing-argument.js` to prevent future confusion.
- PS-6 — `manageFriction` tuple shape `[state, error]` differs from `addConcern`'s `[id, state, error]`. Minor inconsistency; consumers must compute the new FRIC-N id from `state.elementCounters.FRICTION`.
- PA-12 / PS-8 — `checkUngroundedFrictionAnchors` returns string warnings while existing integrity checks return objects. Within current callers (only `evaluateTrigger`'s `.length` + `.join` use), no breakage. Future consumers expecting `.type`/`.element_id` would break.
- PA-11 — Task 2 implements `manageFriction` before Task 6 introduces flag fields. Sequencing is correct (fields don't exist yet in Task 2); flag-clear inlined into `manageFriction` happens in Task 6.
- PA-7 / PS-7 — Module dependency layering: `closing-argument.js → metrics.js → proof.js`; `state.js → proof.js + metrics.js + friction-detection.js`. No cycle today. Worth documenting layer order.

---

## All Findings

### plan-attack (HIGH × 4, MEDIUM × 6, LOW × 2)

- **PA-1 HIGH** — Test scaffolds in Tasks 2, 3, 4, 6, 8, 14 add RULE/PERM/EVIDENCE without `source: 'designer'` field; createElement throws.
- **PA-2 HIGH** — Same Task 2 test scaffold adds NECESSARY_CONDITION without `grounding` or `reasoning_chain`; createElement throws.
- **PA-3 HIGH** — Task 4 `processFriction` returns new state but caller instruction does not explicitly say "replace current"; risk of silently-dropped FRICTION auto-creates.
- **PA-4 HIGH** — `clearClosingFlags` exported helper clones state, but Task 6 Step 3 prose says inline-set instead of helper-call; latent inconsistency trap.
- **PA-5 MEDIUM** — `addConcern` 3-tuple destructuring (verified TRUE; non-issue).
- **PA-6 MEDIUM** — `closurePermitted: false` always at derive time (by design; documented as expected).
- **PA-7 MEDIUM** — New `metrics.js → proof.js` import for `checkAllIntegrity` (verified safe; no cycle).
- **PA-8 MEDIUM** — Task 9 Step 5 commit stages wrong file (`acceptance.test.js`); should stage `concerns.test.js` and `metrics.test.js`.
- **PA-9 MEDIUM** — Friction dedup intra-call behavior (verified safe).
- **PA-10 MEDIUM** — `buildClosureReadyState` round-bump via empty applyOperations (verified safe).
- **PA-11 LOW** — Task 2 / Task 6 sequencing (verified safe).
- **PA-12 LOW** — `checkUngroundedFrictionAnchors` returns strings, not objects.

### plan-smell (MEDIUM × 1, LOW-MEDIUM × 4, LOW × 2, INFO × 1)

- **PS-1 MEDIUM** — `CLOSING_ARG_FLOORS` mutable constant; test mutation without `finally` restore is flakiness risk.
- **PS-2 LOW-MEDIUM** — `clearClosingFlags` double-clone if naïvely called inside already-cloned mutating function.
- **PS-3 LOW-MEDIUM** — `processFriction` divergent mutation pattern from rest of state.js.
- **PS-4 LOW** — `server.js` duplicates `ELEMENT_TYPES`; plan reinforces duplication.
- **PS-5 MEDIUM** — `closurePermitted` always false at derive time (overlaps PA-6).
- **PS-6 LOW** — `manageFriction` `[state, err]` tuple vs `addConcern`'s `[id, state, err]`.
- **PS-7 INFO** — Module dependency layering observation.
- **PS-8 LOW** — `processFriction` exception to `clearClosingFlags` discipline (latent only).

---

## Risk Assessment

The plan's architecture is sound and the TDD sequencing is well-organized. The blocking findings are all in the test-scaffold and instruction-text quality of the plan body — they do not invalidate the architectural choices. PA-1 and PA-2 are the most consequential because they will surface as immediate test failures during Step 1 of multiple tasks, but each fix is a one-line addition to the test fixture (add `source: 'designer'` to RULE/PERM/EVIDENCE; add `grounding: ['EVID-N']` and `reasoning_chain: 'reasoning'` to NCs that ground in evidence). PA-8's commit-stage error is a one-line fix in the commit instruction. PA-3 and PA-4 are clarity fixes — explicit "replace `current` with the returned state" prose in Task 4, and a decision in Task 6 between inline-set and helper-call (with the unused path removed). PS-1's `Object.freeze` is a one-line safety addition.

Plan-stage cleanup of these six items moves the risk profile from Significant to Moderate. None of the findings require returning to design or revisiting the spec.

---

## Provenance Trailer

*(stamped after report write — see `chester-trailer-write` invocation in plan-build SKILL.md)*

<!-- created-at: 2026-05-03T02:45:57Z -->
<!-- produced-by plan-build@v0004 -->
