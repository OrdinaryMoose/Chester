# Spec: Cluster B.2 — Phase 4b Closing-Argument Materialization

**Sprint:** `cluster-b-2-define-solve-closing` (under master `20260430-02-rebuild-design-derivation`)
**Parent brief:** `docs/chester/working/20260430-02-rebuild-design-derivation/cluster-b-2-define-solve-closing/design/cluster-b-2-define-solve-closing-design-00.md`
**Architecture:** Hybrid principled merge — structured-object output (rendering layer composes display) + hybrid friction creation (auto-create on structurally-exact detection rule, agent-confirms on heuristic rules) + round-stamped two-yes flags (same-round semantics intrinsic to field shape) + cluster-A six-touchpoint element-type pattern for FRICTION.

---

## Goal

Add a sixth deferred-design-decision-resolution layer to the proof MCP at `plugins/chester/skills/design-large-task/proof-mcp/` that materializes the closing argument as a deterministic structured-object derivation over current proof state, gates closure on a round-stamped two-yes designer choice, tracks friction as a first-class element type with hybrid agent-detection / designer-override semantics, and surfaces phantom NCs/RCs/Friction with closed-set disposition tags. The seven RCs in the brief become seven coverage axes for the spec; every AC traces back to at least one RC, and every brief-listed handoff item is implemented by at least one AC.

---

## Components

**New files** (under `plugins/chester/skills/design-large-task/proof-mcp/`):

- `closing-argument.js` — pure function `deriveClosingArgument(state) → object` returning a structured closing-argument object; ~150 lines.
- `friction-detection.js` — pure-functions module exporting four detection functions (`detectNcNcOpposingPull`, `detectRcRuleConflict`, `detectPermissionRiskLinkage`, `detectConcernConcernCompetition`) plus a `runFrictionDetection(state)` master export; ~150 lines.

**Modified files** (under `plugins/chester/skills/design-large-task/proof-mcp/`):

- `proof.js` — add `'FRICTION'` to `ELEMENT_TYPES`; add FRICTION validation block in `createElement`; add `checkUngroundedFrictionAnchors` integrity check; register in `checkAllIntegrity`.
- `state.js` — add `FRICTION: 'FRIC-'` to `ID_PREFIX`; add `FRICTION: 0` to `elementCounters`; add `closingArgPresentedRound: null` and `closingArgGoRound: null` to `initializeState`; add `frictionLog: []` to `initializeState`; extend `applyOperations` withdraw case to accept optional `withdrawal_disposition` field (defaults to `'unclassified'`); add anchor validation for FRICTION in `applyOperations` add case; add `clearClosingFlags(state)` helper; call `clearClosingFlags` at top of every state-mutating exported function (`applyOperations`, `addConcern`, `lockConcerns`, `ratifyResolveCondition`, `markChallengeUsed`, and the new `manageFriction` and `overrideFrictionDisposition`); add `recordClosingArgPresented`, `recordDesignerGo`, `manageFriction`, `overrideFrictionDisposition` exports; extend `loadState` backfill block.
- `metrics.js` — add `friction_count` (total FRICTION elements regardless of status) and `live_friction_count` (active only) to `computeCompleteness` (note: existing per-type counters in `computeCompleteness` skip non-active via the early `continue` at metrics.js:37, so a "total" counter requires either an early branch or a separate iteration); add `evaluateTrigger(state)` exporting `CLOSING_ARG_FLOORS` constants — `evaluateTrigger` must call BOTH `computeCompleteness(state.elements)` AND `computeGroundingCoverage(state.elements)` (a separate exported function at metrics.js:84) to obtain the `groundingCoverage` value; merge them via spread the same way `applyOperations` does at state.js:256-259; add eleventh condition to `checkClosure` (`state.closingArgGoRound === state.round`).
- `server.js` — add `'FRICTION'` to local `ELEMENT_TYPES`; add `present_closing_argument`, `confirm_closure_go`, `manage_friction`, `override_friction_disposition` tool definitions and handlers; import new state functions and `closing-argument.js`.

**No changes required** to: `package.json` (no new dependencies), existing element-type validation blocks (NC, RULE, PERMISSION, EVIDENCE, RISK, RESOLVE_CONDITION untouched), `manage_concerns`, `ratify_resolve_condition`, or `submit_proof_update` core handlers.

---

## Data Flow

1. **Round mechanics.** Designer issues a state-mutating tool call (`submit_proof_update`, `manage_concerns`, `ratify_resolve_condition`, `manage_friction`, `override_friction_disposition`). Handler entry calls `clearClosingFlags(state)` before any structural work. Handler does its work. After mutating operations complete, every state-mutating exported function (`applyOperations`, `addConcern`, `lockConcerns`, `ratifyResolveCondition`, `manageFriction`, `overrideFrictionDisposition`) invokes `runFrictionDetection(state)` at the tail of its mutation path, which runs all four detection functions and (a) auto-creates FRICTION elements with `disposition: 'lived-with'` for any new `permission-risk-linkage` candidates not already present (matched by deduplication key `${minId(anchor_a, anchor_b)}::${maxId(anchor_a, anchor_b)}::${audit_rule}`), and (b) returns hint candidates for the other three rules in the response payload for the agent to evaluate. `markChallengeUsed` also calls `clearClosingFlags` but does not invoke detection (challenge-mode marks do not change element relationships).

2. **Friction confirmation.** Agent sees hint candidates in tool response. Agent evaluates each hint and, when persisting one as real friction, calls `manage_friction` with `op: 'add'`, supplying `friction_shape`, `anchor_a`, `anchor_b`, initial `disposition` (defaults to `lived-with`), and a free-text `statement`. `manage_friction` validates anchors, creates the FRICTION element with a `FRIC-N` ID, appends to `frictionLog`, clears the two-yes flags. Returns the new element.

3. **Friction override / dismiss.** Designer asks agent to override a friction disposition or dismiss it. Agent calls `override_friction_disposition` with `element_id` and new `disposition`. If new disposition is `dissolved-by-revision`, `dissolved-by-scope-cut`, or `not-really-friction`, the element transitions to `status: 'withdrawn'` (becomes a phantom). Handler appends to `frictionLog` and clears two-yes flags.

4. **Trigger evaluation.** Agent calls `present_closing_argument`. Handler invokes `evaluateTrigger(state)` which computes (a) per-signal floors (grounding coverage, ratified RC count equals total RC count, Concerns locked, Concern coverage zero-uncovered, round ≥ 3, all NCs have collapse_test, at least one NC has rejected_alternatives), (b) aggregate composite score `(ratified_rc_count / max(rc_count, 1)) * 0.4 + groundingCoverage * 0.4 + (conditions_with_alternatives / max(condition_count, 1)) * 0.2 ≥ 0.8`, (c) `checkAllIntegrity(state.elements).length === 0`. If any of the three arms fails, returns a structured rejection naming each failed signal. If all clear, proceeds to step 5.

5. **Closing-argument derivation.** Handler invokes `deriveClosingArgument(state)`, a pure function returning a structured object: `{ derivedAtRound, problemStatement, lockedConcerns[], resolveConditions[], phantomNCs[], phantomRCs[], liveFriction[], phantomFriction[], compositeScore, closurePermitted, closureReasons }`. Handler calls `recordClosingArgPresented(state)` (sets `closingArgPresentedRound = state.round`), saves state, returns the structured object as the tool response.

6. **Designer review and close decision.** Agent presents the structured object to the designer (rendering shape is the SKILL.md presentation layer's responsibility, not the proof MCP's). Designer issues "go" or "back to solve."

7. **Close act.** Designer's "go" is conveyed by agent calling `confirm_closure_go`. Handler validates `state.closingArgPresentedRound === state.round` (presented-this-round check) — if not, returns rejection. Otherwise calls `recordDesignerGo(state)` (sets `closingArgGoRound = state.round`), saves state, returns the updated `checkClosure` result with `closure_permitted: true` (assuming the prior ten conditions still hold). The proof is now closure-eligible.

8. **Back-to-solve path.** Designer rejects the argument; agent does not call `confirm_closure_go`. The next state-mutating call (any of the existing mutating handlers) clears both flags via `clearClosingFlags`. Cycle restarts.

9. **Mutation invalidation.** If the designer ratifies "go" but a state-mutating call follows (e.g., agent revises an NC), `clearClosingFlags` resets both flags. The eleventh condition (`closingArgGoRound === state.round`) fails on the next `checkClosure` call. Closure cannot proceed on stale ratification.

---

## Error Handling

- **Trigger gate rejection.** `present_closing_argument` returns a structured rejection object listing every failed signal: `{ permitted: false, failures: [{ signal: 'grounding_coverage', actual: 0.7, floor: 0.9 }, ...] }`. No mutation occurs. Handler does not throw.
- **Same-round violation.** `confirm_closure_go` called when `closingArgPresentedRound !== state.round` returns `{ permitted: false, reason: 'closing argument was not presented in current round; call present_closing_argument first' }`. No mutation.
- **Anchor validation failure on FRICTION.** `manage_friction add` with `anchor_a` or `anchor_b` referencing a non-existent element ID returns `{ error: 'unknown element id: FRIC-X', valid_ids_sample: [...] }`. No element created.
- **Disposition override on non-FRICTION.** `override_friction_disposition` called with an element_id that does not point to a FRICTION element returns `{ error: 'element_id must be FRICTION; got NCON-3 (type: NECESSARY_CONDITION)' }`. No mutation.
- **Disposition outside closed set.** `manage_friction add` or `override_friction_disposition` with a disposition value outside the five-member closed set returns `{ error: 'disposition must be one of: lived-with, relieved-by-exception, dissolved-by-revision, dissolved-by-scope-cut, not-really-friction; got X' }`. No mutation.
- **friction_shape outside closed set.** `manage_friction add` with a friction_shape outside the four-member closed set returns `{ error: 'friction_shape must be one of: nc-nc-opposing-pull, rc-rule-conflict, permission-risk-linkage, concern-concern-competition; got X' }`. No mutation.
- **Withdrawal disposition outside closed set.** Withdraw operation on NC or RC with `withdrawal_disposition` value outside the five-member closed set (`consolidated, superseded, found-redundant, found-incorrect, scope-removed`) returns `{ error: 'withdrawal_disposition must be one of [list]; got X' }`. Withdraw operation with no `withdrawal_disposition` field defaults to `'unclassified'` and proceeds (backward-compatible).
- **State load failure.** Existing `loadState` error handling preserved; new fields backfill via `??=` operator on missing keys.
- **Integrity warnings during trigger.** Integrity-zero arm of trigger fails with a list of integrity warnings naming each (e.g., `ungrounded_friction_anchors: [FRIC-3]`). Designer must resolve via mutating calls before retry; flags will be cleared by those calls regardless.

---

## Testing Strategy

Test framework is **vitest** per `proof-mcp/package.json` (`"test": "vitest run"`). Tests live under `proof-mcp/__tests__/*.test.js` using `import { describe, it, expect } from 'vitest'` (precedent: existing `state.test.js`, `metrics.test.js`, `proof.test.js`, `server.test.js`, `acceptance.test.js`, `concerns.test.js`).

**Unit test files** (new, under `proof-mcp/__tests__/`):

- `friction-element-type.test.js` — FRICTION element creation, validation (anchor existence, disposition closed set, friction_shape closed set), ID prefix `FRIC-N`, counter increment, withdrawal transition to phantom.
- `friction-detection.test.js` — each of four detection functions with positive and negative cases; `permission-risk-linkage` exact-match auto-creation; other three return hints; deduplication on anchor-pair + audit_rule.
- `closing-argument.test.js` — `deriveClosingArgument(state)` returns structured object; idempotency (same state → identical object via deep equality); object includes all required keys; phantom sections include withdrawn NCs/RCs/Friction with disposition tags; live friction section includes only `status: 'active'` FRICTION elements.
- `trigger-evaluator.test.js` — `evaluateTrigger` with each per-signal floor failing in isolation; aggregate-score boundary (0.79, 0.80, 0.81); integrity-zero with one warning vs zero warnings; all-pass case clears.
- `two-yes-flags.test.js` — `present_closing_argument` sets `closingArgPresentedRound`; `confirm_closure_go` validates same-round; mutation clears both flags; eleventh closure condition checks `closingArgGoRound === state.round`.
- `mutation-clears-flags.test.js` — every mutating exported function (`applyOperations`, `addConcern`, `lockConcerns`, `ratifyResolveCondition`, `markChallengeUsed`, `manageFriction`, `overrideFrictionDisposition`) clears flags at entry; `get_proof_state` does not clear.
- `eleventh-closure-condition.test.js` — `checkClosure` with ten prior conditions met but `closingArgGoRound !== state.round` returns `permitted: false` with a reasons-list entry matching `/Designer go-choice/`; with all eleven met returns `permitted: true`.
- `withdrawal-disposition.test.js` — withdraw with valid disposition, withdraw with no disposition (defaults to `'unclassified'`), withdraw with invalid disposition (rejected); closing-argument render surfaces unclassified phantoms with that tag.
- `loadstate-backfill.test.js` — load state file lacking `closingArgPresentedRound`, `closingArgGoRound`, `frictionLog`, `elementCounters.FRICTION`; verify all backfill correctly to defaults.

**Integration test files** (new, under `proof-mcp/__tests__/`):

- `closing-argument-end-to-end.test.js` — full happy path: build a proof to closure-readiness, call `present_closing_argument`, verify structured object, call `confirm_closure_go`, verify `checkClosure` returns `permitted: true`. Then call a mutating tool, verify `checkClosure` reverts to `permitted: false` with the eleventh-condition reason.
- `friction-lifecycle.test.js` — friction auto-created via permission-risk detection, designer override changes disposition, then dismisses (transitions to phantom), phantom appears in closing argument's `phantomFriction[]`.

**Coverage expectations:**

- 100% branch coverage on `closing-argument.js` and `friction-detection.js` (pure functions; tractable to fully cover).
- 100% branch coverage on `evaluateTrigger`, `clearClosingFlags`, `recordClosingArgPresented`, `recordDesignerGo`.
- ≥ 90% branch coverage on modified `proof.js` / `state.js` paths.
- Idempotency test (in `closing-argument.test.js`) deep-equality-compares two consecutive `deriveClosingArgument(state)` calls against unchanged state via `JSON.stringify` comparison; failure indicates non-determinism leak.

---

## Constraints

- **RULE-1 (master-inherited five-element lock).** Cluster A added a sixth element type (RESOLVE_CONDITION); cluster B.2 adds a seventh (FRICTION). Both extensions are additive — no validation block for the original five types may be modified.
- **RULE-6 (Phase 4b preservation default).** All changes are additive. No existing tool schema may be removed or have its behavior altered. `submit_proof_update`, `manage_concerns`, `ratify_resolve_condition`, `get_proof_state` keep their existing input/output contracts; new fields appear only in extended response payloads.
- **NCON-3 (read-only idempotent derivation).** `deriveClosingArgument` must be pure: no I/O, no LLM call, no `Date.now()`, no `Math.random()`, no closure over mutable state. Idempotency is testable via deep-equality of two consecutive calls.
- **NCON-4 (mutation-clears-flags).** Every state-mutating exported function in `state.js` must call `clearClosingFlags(state)` at entry. New mutating exports added in this sprint inherit this discipline. No silent exemption. Note: `applyOperations` increments `state.round` as part of its mutation, so the same-round check `closingArgGoRound === state.round` would intrinsically fail after that call even without the explicit clear. The other mutating exports (`addConcern`, `lockConcerns`, `ratifyResolveCondition`, `markChallengeUsed`, `manageFriction`, `overrideFrictionDisposition`) do NOT bump `round`, so `clearClosingFlags` is the sole mechanism that invalidates the flags after those calls. Implementer must not "optimize away" the clear under round-bump-already-protects reasoning.
- **S-RULE-10 (RC = solution).** The closing-argument structured object's `resolveConditions[]` walk is the spine. Other arrays (NCs, Rules, Permissions, Evidence) appear only as grounding references inside RC entries, not as top-level walks.
- **Designer-facing language plain.** The brief template (or SKILL.md prompt layer) renders the structured object for designer display; that rendering uses canonical glossary terms and avoids code vocabulary. The proof MCP's structured object uses snake_case field names internal to code; the rendering layer translates.
- **Marketplace plugin cache assumption.** The proof MCP loaded at session bootstrap predates cluster A's additions. Implementation runs in the OrdinaryMoose source tree at `/home/mike/Documents/CodeProjects/OrdinaryMoose/plugins/chester/skills/design-large-task/proof-mcp/`; the marketplace cache will be refreshed before this spec's plan executes. Spec assumes cluster-A additions are present.
- **Closure-baseline audit (deferred).** The cluster-B handover names a 10–15 historic-proof audit as foundational empirical work. Not performed in this sprint. `CLOSING_ARG_FLOORS` constants in `metrics.js` are spec-author best-guess; the audit will inform calibration in a future sprint.
- **Industry closure-pattern survey (deferred).** Cluster B's entry-side survey is the precedent; closure-side survey (Event-B QED, NASA close-out, Coq QED, BDD, TLA+) deferred to keep this sprint focused.

---

## Non-Goals

- **Renaming or refactoring existing element types.** NC, RULE, PERMISSION, EVIDENCE, RISK, RESOLVE_CONDITION, Concern remain as-is.
- **Editing the brief template's render shape.** The brief template (`design-brief-template.md` or equivalent in design-large-task references) consumes the structured object; updating the template's rendering instructions is a downstream task in design-large-task, not this spec.
- **SKILL.md prose generation logic.** How the agent composes designer-facing prose from the structured object at presentation time is presentation-layer concern, not proof-MCP concern. SKILL.md instructions for the agent fall outside this spec.
- **Calibrating `CLOSING_ARG_FLOORS` empirically.** Initial constants are best-guess. The closure-baseline audit (deferred) will inform calibration.
- **Implementing the closure-baseline audit itself.** Out of sprint scope; flagged as deferred work.
- **Implementing the closure-pattern industry survey.** Out of sprint scope.
- **Backporting `withdrawal_disposition` to historic withdrawn elements in existing state files.** `loadState` backfills defaults; historic withdrawn elements appear in closing arguments with `'unclassified'` disposition.
- **Auto-creating friction for the three heuristic detection rules.** Only `permission-risk-linkage` (structurally exact) auto-creates. Other three return hints; agent confirms.
- **Tooling for designer to query the friction list outside of the closing-argument flow.** `get_proof_state` already returns full state including FRICTION elements; no new query tool added.
- **CN/CERN naming sweep across non-spec artifacts.** Sprint-finish housekeeping per the brief; not part of code spec.

---

## Acceptance Criteria

### AC-1.1 — FRICTION element type registered

**Source RC:** RC7 (friction agent-detected, proof-tracked, designer-overridable).
**Source NC:** NCON-7.

**Observable boundary:**
- Calling `createElement` with `type: 'FRICTION'`, valid `friction_shape`, valid `disposition`, and valid `anchor_a` / `anchor_b` → returns an element with `id` matching `/^FRIC-\d+$/`, `type: 'FRICTION'`, `status: 'active'`, and the supplied fields.
- Calling `createElement` with `type: 'FRICTION'` and a missing `friction_shape` field → throws or returns error with `{ error: /friction_shape required/ }`.
- `ELEMENT_TYPES` array in `proof.js` includes `'FRICTION'` as the seventh entry.
- `ID_PREFIX` map in `state.js` includes `FRICTION: 'FRIC-'`.
- `elementCounters` initial state in `initializeState` includes `FRICTION: 0`.
- After creating the first FRICTION element via `manage_friction add`, `state.elementCounters.FRICTION === 1` and the new element's id is `'FRIC-1'`.

**Given:** an initialized proof state with no FRICTION elements.
**When:** `manage_friction` is called with `op: 'add'`, `friction_shape: 'permission-risk-linkage'`, `anchor_a: 'PERM-1'`, `anchor_b: 'RISK-2'`, `disposition: 'relieved-by-exception'`, `statement: 'Permission-1 relieves Rule-3 which Risk-2 is grounded in'`.
**Then:** the response contains a new FRICTION element with id `'FRIC-1'`, all supplied fields stored, `status: 'active'`, `addedInRound: state.round`, and `state.elementCounters.FRICTION === 1`.

**Implementing tasks:** *(populated by plan-build)*
**Decisions:** *(populated by execute-write)*

---

### AC-1.2 — FRICTION anchor validation rejects unknown ids

**Source RC:** RC7.
**Source NC:** NCON-7.

**Observable boundary:**
- `manage_friction` with `op: 'add'` and `anchor_a` referencing a non-existent element id → returns `{ error: /unknown element id/ }`; no FRICTION element is created; `state.elementCounters.FRICTION` does not increment.
- `manage_friction` with `op: 'add'` and `anchor_b` referencing a non-existent element id → same rejection.
- `manage_friction` with both anchors valid → succeeds.

**Given:** an initialized proof state containing `NCON-1` and `NCON-2`.
**When:** `manage_friction` is called with `op: 'add'`, `anchor_a: 'NCON-1'`, `anchor_b: 'NCON-99'` (does not exist).
**Then:** the call returns an error naming the unknown id; `state.elements` is unchanged; `state.elementCounters.FRICTION === 0`.

**Implementing tasks:**
**Decisions:**

---

### AC-1.3 — FRICTION disposition closed-set enforcement

**Source RC:** RC7.
**Source NC:** NCON-7.

**Observable boundary:**
- `manage_friction add` with disposition outside `{lived-with, relieved-by-exception, dissolved-by-revision, dissolved-by-scope-cut, not-really-friction}` → returns error naming the closed set.
- `override_friction_disposition` with disposition outside the closed set → returns error naming the closed set.
- All five members of the closed set accepted on both paths.

**Given:** an active FRICTION element `FRIC-1` with disposition `lived-with`.
**When:** `override_friction_disposition` is called with `element_id: 'FRIC-1'`, `disposition: 'fixed-it'` (not a member).
**Then:** the call returns an error naming the closed set; `FRIC-1`'s disposition remains `lived-with`.

**Implementing tasks:**
**Decisions:**

---

### AC-1.4 — FRICTION friction_shape closed-set enforcement

**Source RC:** RC7.
**Source NC:** NCON-7.

**Observable boundary:**
- `manage_friction add` with `friction_shape` outside `{nc-nc-opposing-pull, rc-rule-conflict, permission-risk-linkage, concern-concern-competition}` → returns error naming the closed set.
- All four members of the closed set accepted.

**Given:** an initialized proof state with `NCON-1` and `NCON-2`.
**When:** `manage_friction add` is called with `friction_shape: 'logical-tension'` (not a member), `anchor_a: 'NCON-1'`, `anchor_b: 'NCON-2'`.
**Then:** the call returns an error naming the closed set; no FRICTION element created.

**Implementing tasks:**
**Decisions:**

---

### AC-2.1 — Friction detection runs on every state mutation

**Source RC:** RC7.
**Source NC:** NCON-7.

**Observable boundary:**
- After every state-mutating exported function that touches elements or Concerns (`applyOperations`, `addConcern`, `lockConcerns`, `ratifyResolveCondition`, `manageFriction`, `overrideFrictionDisposition`), `runFrictionDetection(state)` is invoked at the tail of the mutation path. `markChallengeUsed` is excluded — it does not change element relationships and detection over its result is a no-op.
- The response payload from a mutating call includes a `friction_hints[]` array containing detected candidates not already persisted as FRICTION elements.
- For `permission-risk-linkage` candidates that are not already persisted, `runFrictionDetection` auto-creates them as FRICTION elements with `disposition: 'lived-with'` before returning, so they appear in `state.elements` rather than in `friction_hints[]`.

**Given:** a proof state where `PERM-1` relieves `RULE-3`, `RISK-2` has `basis: ['RULE-3']`, and no FRICTION element exists for that pair.
**When:** any state-mutating call (e.g., `submit_proof_update` adding new evidence) executes.
**Then:** the response payload contains either a new FRICTION element with `friction_shape: 'permission-risk-linkage'`, `anchor_a: 'PERM-1'`, `anchor_b: 'RISK-2'`, `disposition: 'lived-with'`, OR (if already persisted) the element is not duplicated. The `friction_hints[]` array does not include this same pair.

**Implementing tasks:**
**Decisions:**

---

### AC-2.2 — Heuristic detection rules return hints, not auto-create

**Source RC:** RC7.
**Source NC:** NCON-7.

**Observable boundary:**
- `runFrictionDetection` for `nc-nc-opposing-pull`, `rc-rule-conflict`, `concern-concern-competition` returns hint objects; does not auto-create FRICTION elements.
- Hints appear in the response payload as `friction_hints[]: [{ friction_shape, anchor_a, anchor_b, statement, confidence }, ...]`.
- After a heuristic-rule hint is returned, `state.elements` contains no new FRICTION element corresponding to that hint until the agent calls `manage_friction add`.

**Given:** a proof state containing two NCs whose statements contain "must X" and "must not X" patterns matching the `nc-nc-opposing-pull` heuristic, with no existing FRICTION between them.
**When:** any state-mutating call executes.
**Then:** the response payload's `friction_hints[]` includes one entry with `friction_shape: 'nc-nc-opposing-pull'` and the two NC ids as anchors; `state.elements` contains no new FRICTION element; `state.elementCounters.FRICTION` is unchanged.

**Implementing tasks:**
**Decisions:**

---

### AC-2.3 — Friction detection deduplication

**Source RC:** RC7.
**Source NC:** NCON-7.

**Observable boundary:**
- The deduplication key for friction candidates is `${minId(anchor_a, anchor_b)}::${maxId(anchor_a, anchor_b)}::${audit_rule}` (alphabetical anchor ordering, then audit_rule).
- Candidates whose dedup key matches an existing active FRICTION element in `state.elements` are not re-emitted as hints and not auto-created.
- Withdrawn FRICTION elements (status `'withdrawn'`) do not block re-detection — a re-emergence of the same friction pair after a phantom dismissal can be re-detected.

**Given:** an active FRICTION element `FRIC-1` with `friction_shape: 'permission-risk-linkage'`, `anchor_a: 'PERM-1'`, `anchor_b: 'RISK-2'`.
**When:** `runFrictionDetection` is called against the same state.
**Then:** no new FRICTION element is auto-created for the same pair+rule; `state.elementCounters.FRICTION` is unchanged.

**Implementing tasks:**
**Decisions:**

---

### AC-2.4 — Override-to-dismiss transitions FRICTION to phantom

**Source RC:** RC7.
**Source NC:** NCON-7, NCON-6.

**Observable boundary:**
- `override_friction_disposition` with new disposition in `{dissolved-by-revision, dissolved-by-scope-cut, not-really-friction}` sets the element's `status` to `'withdrawn'` and updates its disposition.
- `override_friction_disposition` with new disposition in `{lived-with, relieved-by-exception}` updates the disposition but does NOT change `status` (remains `'active'`).
- After dismissal, the element appears in the closing argument's `phantomFriction[]` and not in `liveFriction[]`.

**Given:** an active FRICTION element `FRIC-1`.
**When:** `override_friction_disposition` is called with `element_id: 'FRIC-1'`, `disposition: 'not-really-friction'`.
**Then:** `FRIC-1.status === 'withdrawn'`, `FRIC-1.disposition === 'not-really-friction'`, `frictionLog` includes `{ event: 'disposition-changed', frictionId: 'FRIC-1', round, ... }`, and a subsequent `present_closing_argument` returns a structured object where `liveFriction[]` excludes `FRIC-1` and `phantomFriction[]` includes it with the disposition tag.

**Implementing tasks:**
**Decisions:**

---

### AC-3.1 — `deriveClosingArgument` returns structured object

**Source RC:** RC1, RC3.
**Source NC:** NCON-1, NCON-3.

**Observable boundary:**
- `deriveClosingArgument(state)` returns an object with at minimum these keys: `derivedAtRound`, `problemStatement`, `lockedConcerns`, `resolveConditions`, `phantomNCs`, `phantomRCs`, `liveFriction`, `phantomFriction`, `compositeScore`, `closurePermitted`, `closureReasons`. Additional keys may be present in future revisions; tests assert presence of required keys, not strict closure.
- `resolveConditions[]` is the live RC walk: each entry includes `{ id, statement, problem_anchor, ratification, groundingNCs: [...] }`. `groundingNCs[]` resolves each grounding link to the corresponding NC entry by id and includes the NC's `statement`, `collapse_test`, and id.
- `derivedAtRound === state.round`.
- The function performs no I/O, no random, no time, no LLM call.

**Given:** a proof state containing one ratified RC `RCON-1` grounded by `NCON-1` and `NCON-2`, two locked Concerns, no friction.
**When:** `deriveClosingArgument(state)` is called.
**Then:** the returned object contains `resolveConditions: [{ id: 'RCON-1', statement: ..., problem_anchor: 'CN-1', ratification: ..., groundingNCs: [{ id: 'NCON-1', ... }, { id: 'NCON-2', ... }] }]`, `lockedConcerns` has length 2, `liveFriction: []`, `phantomFriction: []`.

**Implementing tasks:**
**Decisions:**

---

### AC-3.2 — `deriveClosingArgument` is idempotent

**Source RC:** RC3.
**Source NC:** NCON-3.

**Observable boundary:**
- Two consecutive calls of `deriveClosingArgument(state)` against the same `state` (no mutation between calls) return objects deeply equal under `JSON.stringify` comparison.
- A third call after applying `JSON.parse(JSON.stringify(state))` (a clone) returns an object deeply equal to the previous two.
- The function has no side effects: `state` after the call is byte-equal to `state` before the call.

**Given:** any non-trivial closure-eligible proof state `S`.
**When:** `r1 = deriveClosingArgument(S)`, then `r2 = deriveClosingArgument(S)`, then `S' = structuredClone(S)`, then `r3 = deriveClosingArgument(S')`.
**Then:** `JSON.stringify(r1) === JSON.stringify(r2) === JSON.stringify(r3)` and `JSON.stringify(S) === JSON.stringify(S')`.

**Implementing tasks:**
**Decisions:**

---

### AC-3.3 — Phantoms surface with closed-set disposition tags

**Source RC:** RC6.
**Source NC:** NCON-6.

**Observable boundary:**
- Withdrawn NCs appear in `phantomNCs[]` with their stored `withdrawal_disposition` value.
- Withdrawn RCs appear in `phantomRCs[]` with their stored `withdrawal_disposition` value.
- Withdrawn FRICTION elements appear in `phantomFriction[]` with their (terminal) `disposition` value (`dissolved-by-revision`, `dissolved-by-scope-cut`, or `not-really-friction`).
- Withdrawn elements with no `withdrawal_disposition` set surface with `'unclassified'`.
- The closing-argument render does NOT silently omit any phantom; every withdrawn element of type NC, RC, or FRICTION appears in the corresponding phantom array.

**Given:** a proof state with one withdrawn NC `NCON-3` (withdrawal_disposition `'superseded'`), one withdrawn RC `RCON-2` (withdrawal_disposition `'scope-removed'`), one withdrawn FRICTION `FRIC-2` (disposition `'not-really-friction'`), and one withdrawn NC `NCON-4` with no withdrawal_disposition stored.
**When:** `deriveClosingArgument(state)` is called.
**Then:** `phantomNCs[]` includes `{ id: 'NCON-3', statement: ..., dispositionTag: 'superseded' }` and `{ id: 'NCON-4', statement: ..., dispositionTag: 'unclassified' }`; `phantomRCs[]` includes `{ id: 'RCON-2', ..., dispositionTag: 'scope-removed' }`; `phantomFriction[]` includes `{ id: 'FRIC-2', ..., dispositionTag: 'not-really-friction' }`.

**Implementing tasks:**
**Decisions:**

---

### AC-3.4 — Live friction surfaces in closing argument

**Source RC:** RC7.
**Source NC:** NCON-7.

**Observable boundary:**
- `liveFriction[]` includes every active FRICTION element (status `'active'`) with `{ id, friction_shape, anchor_a, anchor_b, disposition, statement }`.
- `liveFriction[]` excludes withdrawn FRICTION elements.
- Order within `liveFriction[]` is insertion order (creation round ascending).

**Given:** a proof state with active `FRIC-1` (`lived-with`), active `FRIC-2` (`relieved-by-exception`), withdrawn `FRIC-3`.
**When:** `deriveClosingArgument(state)` is called.
**Then:** `liveFriction[]` is `[{ id: 'FRIC-1', ... }, { id: 'FRIC-2', ... }]`; `phantomFriction[]` is `[{ id: 'FRIC-3', ... }]`.

**Implementing tasks:**
**Decisions:**

---

### AC-4.1 — Composite trigger evaluates per-signal floors

**Source RC:** RC2.
**Source NC:** NCON-2.

**Observable boundary:**
- `evaluateTrigger(state)` returns `{ permitted: boolean, reasons: string[] }`.
- Per-signal floors checked: grounding coverage ≥ 0.9, ratified_rc_count === resolve_condition_count, resolve_condition_count ≥ 1, all NCs have non-empty `collapse_test`, at least one NC has non-empty `rejected_alternatives`, `concernsLocked === true`, Concern coverage uncovered count === 0, `state.round >= 3`.
- If any floor fails, `permitted: false` and `reasons[]` includes a string naming each failed signal with actual vs floor values.

**Given:** a proof state with grounding coverage 0.7 and all other floors passing.
**When:** `evaluateTrigger(state)` is called.
**Then:** returned object is `{ permitted: false, reasons: ['grounding_coverage 0.7 below floor 0.9'] }` (or equivalent structured naming).

**Implementing tasks:**
**Decisions:**

---

### AC-4.2 — Composite trigger evaluates aggregate score

**Source RC:** RC2.
**Source NC:** NCON-2.

**Observable boundary:**
- Aggregate score formula: `(ratified_rc_count / max(rc_count, 1)) * 0.4 + groundingCoverage * 0.4 + (conditions_with_alternatives / max(condition_count, 1)) * 0.2`.
- Score must be ≥ 0.8 (`AGGREGATE_SCORE_FLOOR`).
- Score < 0.8 → `permitted: false` with a `reasons[]` entry naming the actual score and the floor.
- The 0.4 / 0.4 / 0.2 weights and 0.8 floor are exported as named constants in `CLOSING_ARG_FLOORS` so tests can override.

**Given:** a state where all per-signal floors pass but the aggregate score computes to 0.78.
**When:** `evaluateTrigger(state)` is called.
**Then:** returned object is `{ permitted: false, reasons: ['aggregate_score 0.78 below floor 0.8'] }`.

**Implementing tasks:**
**Decisions:**

---

### AC-4.3 — Composite trigger enforces integrity-zero

**Source RC:** RC2.
**Source NC:** NCON-2.

**Observable boundary:**
- `evaluateTrigger` calls `checkAllIntegrity(state.elements)` and requires its return array to have length zero.
- Non-zero integrity warnings → `permitted: false` with `reasons[]` entry naming the warning count and listing each warning.
- Includes the new `checkUngroundedFrictionAnchors` warning class.

**Given:** a state where all per-signal floors pass, aggregate score 0.85, but one FRICTION element has an `anchor_a` pointing to a withdrawn element id.
**When:** `evaluateTrigger(state)` is called.
**Then:** returned object is `{ permitted: false, reasons: [/integrity_warnings/, /ungrounded_friction_anchors/] }`.

**Implementing tasks:**
**Decisions:**

---

### AC-4.4 — Composite trigger all-pass returns permitted

**Source RC:** RC2.
**Source NC:** NCON-2.

**Observable boundary:**
- All per-signal floors pass AND aggregate ≥ 0.8 AND integrity warnings empty → returns `{ permitted: true, reasons: [] }`.
- No other case returns `permitted: true`.

**Given:** a state where all per-signal floors pass, aggregate score 0.92, integrity warnings empty.
**When:** `evaluateTrigger(state)` is called.
**Then:** returned object is `{ permitted: true, reasons: [] }`.

**Implementing tasks:**
**Decisions:**

---

### AC-5.1 — `present_closing_argument` requires trigger pass

**Source RC:** RC2, RC3.
**Source NC:** NCON-2, NCON-3.

**Observable boundary:**
- `present_closing_argument` calls `evaluateTrigger` first.
- If `permitted: false`, returns `{ permitted: false, reasons: [...] }`. Does not call `deriveClosingArgument`. Does not set `closingArgPresentedRound`.
- If `permitted: true`, calls `deriveClosingArgument`, calls `recordClosingArgPresented(state)`, saves state, returns the structured object.

**Given:** a state with `evaluateTrigger` returning `{ permitted: false, reasons: ['grounding_coverage 0.7 below floor 0.9'] }`.
**When:** `present_closing_argument` is called.
**Then:** returned payload is `{ permitted: false, reasons: ['grounding_coverage 0.7 below floor 0.9'] }`; `state.closingArgPresentedRound` remains `null`; state file is not modified by this call.

**Implementing tasks:**
**Decisions:**

---

### AC-5.2 — `present_closing_argument` sets presented-round flag

**Source RC:** RC4.
**Source NC:** NCON-4.

**Observable boundary:**
- After successful `present_closing_argument`, `state.closingArgPresentedRound === state.round`.
- `state.closingArgGoRound` is unchanged (`null` if not previously set).
- The state file on disk reflects the new flag value.

**Given:** a state where trigger passes, `state.round === 5`, `closingArgPresentedRound === null`.
**When:** `present_closing_argument` is called.
**Then:** `state.closingArgPresentedRound === 5`; `state.closingArgGoRound === null`; subsequent `get_proof_state` returns the updated value.

**Implementing tasks:**
**Decisions:**

---

### AC-5.3 — `confirm_closure_go` requires same-round presentation

**Source RC:** RC4.
**Source NC:** NCON-4.

**Observable boundary:**
- `confirm_closure_go` validates `state.closingArgPresentedRound === state.round`.
- If not equal (or if `closingArgPresentedRound === null`), returns `{ permitted: false, reason: /not presented/ }`. Does not set `closingArgGoRound`.
- If equal, calls `recordDesignerGo`, saves state, returns updated `checkClosure` result.

**Given:** state with `closingArgPresentedRound: 5`, `state.round: 6` (a mutating call has incremented round between presentation and go).
**When:** `confirm_closure_go` is called.
**Then:** returned payload is `{ permitted: false, reason: /presented in round 5, current round 6/ }`; `state.closingArgGoRound` remains `null`.

**Implementing tasks:**
**Decisions:**

---

### AC-5.4 — `confirm_closure_go` sets go-round flag

**Source RC:** RC4.
**Source NC:** NCON-4.

**Observable boundary:**
- After successful `confirm_closure_go`, `state.closingArgGoRound === state.round`.
- The state file on disk reflects the new flag value.
- The returned `checkClosure` result includes the eleventh condition as passing.

**Given:** state with `closingArgPresentedRound: 5`, `state.round: 5`, ten existing closure conditions all met.
**When:** `confirm_closure_go` is called.
**Then:** `state.closingArgGoRound === 5`; returned `checkClosure` payload has `permitted: true`.

**Implementing tasks:**
**Decisions:**

---

### AC-5.5 — Mutation clears both two-yes flags

**Source RC:** RC4.
**Source NC:** NCON-4.

**Observable boundary:**
- Every state-mutating exported function (`applyOperations`, `addConcern`, `lockConcerns`, `ratifyResolveCondition`, `manageFriction`, `overrideFrictionDisposition`) calls `clearClosingFlags(state)` at entry, before any other work.
- After a mutating call, `state.closingArgPresentedRound === null` AND `state.closingArgGoRound === null`, regardless of prior values.
- `get_proof_state` (read-only) does NOT clear the flags.

**Given:** state with `closingArgPresentedRound: 5`, `closingArgGoRound: 5`, `state.round: 5`.
**When:** any state-mutating tool is called (e.g., `submit_proof_update` adding evidence).
**Then:** after the call, `state.closingArgPresentedRound === null` AND `state.closingArgGoRound === null`; the eleventh condition fails on the next `checkClosure`.

**Implementing tasks:**
**Decisions:**

---

### AC-6.1 — Eleventh closure condition added to `checkClosure`

**Source RC:** RC4.
**Source NC:** NCON-4.

**Observable boundary:**
- `checkClosure(state)` evaluates an eleventh condition: `state.closingArgGoRound === state.round`.
- If false, the returned `reasons[]` array includes a string matching `/Designer go-choice/` (canonical text: `'Designer go-choice not given against a presented closing argument — call present_closing_argument then confirm_closure_go'`); tests assert via regex match, not literal string equality.
- The ten prior conditions remain unchanged in identity, order, and reason text.
- `permitted: true` requires all eleven conditions to hold.

**Given:** state with all ten prior conditions met, `closingArgGoRound: null`.
**When:** `checkClosure(state)` is called.
**Then:** returned payload is `{ permitted: false, reasons: [...prior conditions empty..., /Designer go-choice/ ...] }`.

**Implementing tasks:**
**Decisions:**

---

### AC-6.2 — Eleventh condition passes only with same-round go

**Source RC:** RC4.
**Source NC:** NCON-4.

**Observable boundary:**
- `closingArgGoRound === state.round` → eleventh condition passes.
- `closingArgGoRound !== state.round` (including `null`, prior round number, or future) → fails with the eleventh-condition reason.

**Given:** state with all ten prior conditions met, `closingArgGoRound: 4`, `state.round: 5`.
**When:** `checkClosure(state)` is called.
**Then:** returned payload includes the eleventh-condition failure reason.

**Implementing tasks:**
**Decisions:**

---

### AC-7.1 — Withdraw operation accepts optional `withdrawal_disposition`

**Source RC:** RC6.
**Source NC:** NCON-6.

**Observable boundary:**
- `submit_proof_update` operation `{ op: 'withdraw', element_id: ..., withdrawal_disposition: 'consolidated' }` succeeds and stores the disposition on the element.
- Withdraw with no `withdrawal_disposition` field succeeds and stores `'unclassified'` on the element.
- Withdraw with `withdrawal_disposition` outside the closed set (`{consolidated, superseded, found-redundant, found-incorrect, scope-removed}`) returns an error naming the closed set; element is not withdrawn.

**Given:** an active NC `NCON-3`.
**When:** `submit_proof_update` is called with `{ op: 'withdraw', element_id: 'NCON-3', withdrawal_disposition: 'superseded' }`.
**Then:** `state.elements.get('NCON-3').status === 'withdrawn'` AND `state.elements.get('NCON-3').withdrawal_disposition === 'superseded'`.

**Implementing tasks:**
**Decisions:**

---

### AC-7.2 — Closing argument surfaces `'unclassified'` for missing disposition

**Source RC:** RC6.
**Source NC:** NCON-6.

**Observable boundary:**
- A withdrawn NC with no `withdrawal_disposition` stored appears in `phantomNCs[]` with `dispositionTag: 'unclassified'`.
- Same for withdrawn RCs in `phantomRCs[]`.
- Withdrawn FRICTION elements always carry a disposition (set at withdraw time via `override_friction_disposition`); if for some reason the disposition is missing, surface as `'unclassified'`.

**Given:** a withdrawn NC `NCON-4` whose stored shape lacks the `withdrawal_disposition` field (e.g., legacy state from before this sprint).
**When:** `deriveClosingArgument(state)` is called.
**Then:** `phantomNCs[]` includes `{ id: 'NCON-4', dispositionTag: 'unclassified', ... }`.

**Implementing tasks:**
**Decisions:**

---

### AC-8.1 — `loadState` backfills new state fields

**Source RC:** RC4, RC7.
**Source NC:** NCON-4, NCON-7.

**Observable boundary:**
- A state file written before this sprint (lacking `closingArgPresentedRound`, `closingArgGoRound`, `frictionLog`, `elementCounters.FRICTION`) loads without error.
- Missing fields backfill: `closingArgPresentedRound: null`, `closingArgGoRound: null`, `frictionLog: []`, `elementCounters.FRICTION: 0`.
- An existing legacy state file is not modified on load until a subsequent mutating call triggers a save.

**Given:** a JSON state file lacking all four new fields.
**When:** `loadState(path)` is called.
**Then:** the returned state object has all four fields with their default values; the file on disk is not modified.

**Implementing tasks:**
**Decisions:**

---

### AC-8.2 — `frictionLog` records lifecycle events

**Source RC:** RC7.
**Source NC:** NCON-7.

**Observable boundary:**
- `manage_friction add` appends `{ event: 'added', frictionId, round, friction_shape, disposition }` to `frictionLog`.
- `override_friction_disposition` appends `{ event: 'disposition-changed', frictionId, round, oldDisposition, newDisposition }` to `frictionLog`.
- Disposition changes that transition the element to `'withdrawn'` also append `{ event: 'dismissed', frictionId, round }`.
- `frictionLog` is append-only — entries are never removed or modified.

**Given:** an empty `frictionLog`.
**When:** the agent runs `manage_friction add` (creates `FRIC-1`), then `override_friction_disposition` to change `FRIC-1` from `lived-with` to `not-really-friction`.
**Then:** `frictionLog` length is at least 3 (added, disposition-changed, dismissed) with the events in that order.

**Implementing tasks:**
**Decisions:**

---

## Coverage Map

Every brief Concern and every brief RC traces to ACs:

| Brief construct | Covered by AC(s) |
|------------------|------------------|
| RC1 — Composition (live RC walk) | AC-3.1 |
| RC2 — Trigger (composite objective measures) | AC-4.1, AC-4.2, AC-4.3, AC-4.4, AC-5.1 |
| RC3 — Derivation (read-only idempotent) | AC-3.1, AC-3.2 |
| RC4 — Closure gate (two-yes same-round) | AC-5.2, AC-5.3, AC-5.4, AC-5.5, AC-6.1, AC-6.2 |
| RC5 — Engagement (gestalt single-read on self-contained artifact) | AC-3.1 (structured object completeness ensures self-contained-ness; rendering-layer responsibility for layout) |
| RC6 — Phantoms (closed-set dispositions) | AC-3.3, AC-7.1, AC-7.2 |
| RC7 — Friction (agent-detected, proof-tracked, designer-overridable) | AC-1.1, AC-1.2, AC-1.3, AC-1.4, AC-2.1, AC-2.2, AC-2.3, AC-2.4, AC-3.4, AC-8.2 |
| Brief §8 handoff: derivation function | AC-3.1, AC-3.2 |
| Brief §8 handoff: friction element type / store | AC-1.1, AC-1.2, AC-1.3, AC-1.4 |
| Brief §8 handoff: friction detection rules | AC-2.1, AC-2.2, AC-2.3 |
| Brief §8 handoff: composite trigger evaluator | AC-4.1, AC-4.2, AC-4.3, AC-4.4 |
| Brief §8 handoff: two-yes flag store + mutation hooks | AC-5.2, AC-5.3, AC-5.4, AC-5.5 |
| Brief §8 handoff: layout choices | AC-3.1 (sectioned arrays in structured object) |
| Brief §8 handoff: structured-data-vs-prose | AC-3.1 (structured-object output chosen) |

---

## Provenance Trailer

*(stamped after spec approval — see Post-Approval section in design-specify SKILL.md)*

<!-- created-at: 2026-05-03T02:10:19Z -->
<!-- produced-by design-specify@v0003 -->
