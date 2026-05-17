# Plan Threat Report — sprint-02-bug-fix-0306

**Plan reviewed:** `sprint-02-bug-fix-0306-plan-00.md`
**Date:** 2026-05-17
**Combined risk level:** **Significant**

## Smell Heuristic Pre-Check

Matched triggers (3, all in "Async/concurrency" category):
- "task." matched on plan-text phrases like "task-by-task", "alongside this task's", "task's Files block"

All three are false positives — the codebase is JavaScript/Datalog with synchronous Engine; no actual async primitives in the plan. Plan-smell was invoked per the over-firing-tolerant procedure and produced its findings on structural smell unrelated to the trigger matches.

## Findings — plan-attack (adversarial review)

### CRITICAL-1: `closure-policy.js:52` `effective_addresses_rule` consumes `addresses/2` as EDB body atom; Task 3 retires the predicate without updating the rule

**Spec/plan claim:** Task 3 retires `addresses/2` from `EDB_PREDICATES` and `PROJECTION_ARITIES`; RESOLUTION translator emits `resolution_anchor/2` + `resolution_grounding/2` only.

**Code shows:** `skills/design-proof-system/references/domain/closure-policy.js:50-53` defines `effective_addresses_rule` whose body is `[['addresses', ['R', 'C']], ['not', ['withdrew', ['R']]]]`. The rule head `effective_addresses` is consumed by `covered_rule` (line 104-113), which is in turn consumed by `closure_permitted_rule` (line 65-76).

**Impact:** After Task 3 lands, no RESOLUTION submission produces an `addresses` fact. The `effective_addresses_rule` body never matches. `covered` never derives. `closure_permitted_rule` is permanently blocked by `unaddressed_concern` for every ratified concern. The entire closure gate breaks at the proof-system level for any session that contains a CONCERN element.

**False-green amplification:** `concern-schema.test.js:131, 139, 153, 173` exercise coverage derivation via `engine.assertFact('addresses', ...)` directly, bypassing the bridge. Those four tests continue passing post-Task-3 even though the production path via `bridge.addElement` is broken. The plan's "Must remain green" gates would not catch this silent break.

### CRITICAL-2: Task 7 Phase 12 code is unexecutable — references non-existent bridge API and missing helper functions

**Plan claim:** Task 7 Step 7 appends Phase 12 regression assertions using `bridge.queryPort.query(...)` and helpers `assertCount`, `assert`, `logHeader`.

**Code shows:** `skills/design-proof-system/references/domain/domain-bridge.js:138` exposes `queryProof: (args) => render.queryProof(args, readPorts)` on the bridge facade — there is no `queryPort` property. `bridge.queryPort` is `undefined`; `bridge.queryPort.query(...)` throws `TypeError: Cannot read properties of undefined`.

The probe file likely has its own helpers (`assertCount`, etc.) but they are not the standard JS `assert` module. The plan does not verify their existence before writing the Phase 12 code.

**Impact:** Phase 12 cannot run as written. The implementer either fixes the bridge API call and helper references during Task 7 execution, or the probe crashes at the new Phase 12 block and the regression backstop never lands.

### HIGH-1: `friction-policy.js:10` `effective_grounding_rule` consumes `grounding/2` as EDB body atom; Task 2 retires the predicate without updating the rule

**Code shows:** `skills/design-proof-system/references/domain/friction-policy.js:8-11` defines `effective_grounding_rule` with body `[['grounding', ['P', 'E']], ['not', ['withdrew', ['E']]]]`.

**Impact:** After Task 2 retires `grounding/2`, the rule never matches. `effective_grounding` never derives. `ungrounded_proposition` derives for every PROPOSITION (Datalog `not exists` over `effective_grounding`). `closure_permitted_rule` (closure-policy.js:65-76) negates `ungrounded_proposition` — closure becomes permanently blocked for any session with a PROPOSITION.

### HIGH-2: `closure-policy.js:86` `unresolved_friction_rule` body pattern `['friction', ['F', '_', '_', 'unset']]` is arity-4 while Task 4 changes FRICTION to arity 5

**Code shows:** `closure-policy.js:85-91` defines the rule body matching `friction/4`. After Task 4's arity change, facts are `friction/5` — `(id, friction_shape, anchor_a, anchor_b, disposition)`. The rule pattern at arity 4 never matches arity-5 facts.

**Impact:** `unresolved_friction` never derives. Closure gate's friction-blocking arm silently stops working. The arity table updates in Task 4 (`_ARITIES`, `PROJECTION_ARITIES`, `_CATEGORY_PROBES_SCHEMA`, `_CATEGORY_PROBES`) don't help — Datalog rule bodies have hard-coded arity in their pattern.

### MEDIUM-1: `bridge-integration.test.js:42` and `:47` use `source: 'design'`, `claim:`, and `addresses:` — not enumerated in Task 1 or Task 3 migration lists

**Code shows:** `bridge-integration.test.js:42` calls `bridge.addElement({ idShape: EVIDENCE, source: 'design', claim: 'baseline' }, ...)` and line 47 uses `addresses: risk.id` in a RESOLUTION submission.

**Impact:** Lines 42/47 break after Tasks 1 and 3 respectively. Task 1's grep step (Step 6) surfaces them mechanically, but the plan does not pre-enumerate them in Files blocks — if the implementer applies grep results narrowly, breakage surfaces mid-sprint.

## Findings — plan-smell (forward-looking structural review)

Plan-smell's findings overlap heavily with plan-attack's CRITICAL/HIGH set (closure-policy and friction-policy rule consumers, FRICTION arity-rule mismatch). Independent contributions:

### SMELL-3: Parallel-table FRICTION arity sync requires four-point manual coordination

The plan correctly updates all four arity locations for FRICTION (`_ARITIES`, `PROJECTION_ARITIES`, `_CATEGORY_PROBES_SCHEMA`, `_CATEGORY_PROBES`) in Task 4 and adds an explicit cross-reference comment. The mitigation is comment-only until DEF-7's structural test lands. This sprint does not introduce the smell but continues it.

### SMELL-6: Test factory duplication

Each new per-category test file copies `makeRealBridge`. Pre-existing DEF-5 from bug-fix-02; the plan does not worsen it. Not introduced by this plan.

## Combined Risk Synthesis

Reasons for **Significant** risk level:

- **Three critical Datalog-rule-body consumers of retired/reshaped predicates** are not in any plan task's scope. Without fixing them, the closure gate breaks silently in multiple paths: addresses-based coverage (CRITICAL-1), grounding-based ungrounded-proposition detection (HIGH-1), friction-based closure blocking (HIGH-2). The plan would land with broken proof-system semantics.

- **Test-suite false-green amplification.** Existing closure tests use `engine.assertFact('addresses', ...)` directly, bypassing the bridge — so the rule-body breakage doesn't surface in the plan's "Must remain green" gates. The implementer would believe the sprint succeeded.

- **Phase 12 unexecutable as written.** Task 7's regression backstop cannot run with the plan's specified API calls. The probe doesn't gain its intended regression coverage.

- **Test fixtures not pre-enumerated.** Task 1's grep step relies on the implementer's diligence; bridge-integration.test.js:42/47 are real migration points not in the Files block.

- **The smell-heuristic over-fired (false positives), but the smeller's analysis was substantive.** The structural-coupling concerns plan-smell raised were real even though the trigger matches that fired it were not. This validates the trigger-list's bias toward over-firing.

## Directed Mitigations (if user chooses option B)

These mitigations are surgical additions to the existing plan, not architectural revisions:

**M1 — Add `friction-policy.js:8-11` update to Task 2:**
- Files block adds: `Modify: skills/design-proof-system/references/domain/friction-policy.js:8-11 — replace 'grounding' body atom with 'proposition_grounding' in effective_grounding_rule`
- Add a new step in Task 2 (between current Steps 6 and 7) that performs this rule update
- Must-remain-green adds: any test that exercises ungrounded_proposition derivation (search for `ungrounded_proposition` in test files)

**M2 — Add `closure-policy.js:50-53` update to Task 3:**
- Files block adds: `Modify: skills/design-proof-system/references/domain/closure-policy.js:50-53 — replace 'addresses' body atom with 'resolution_anchor' in effective_addresses_rule`
- Add a new step in Task 3 that performs the rule update + verifies via the closure-permission integration tests
- Migrate the 4 raw `engine.assertFact('addresses', ...)` calls in `concern-schema.test.js:131, 139, 153, 173` to `engine.assertFact('resolution_anchor', ...)`
- Must-remain-green: any test exercising `covered` / `unaddressed_concern` derivation via the bridge path

**M3 — Add `closure-policy.js:85-91` update to Task 4:**
- Files block adds: `Modify: skills/design-proof-system/references/domain/closure-policy.js:85-91 — update unresolved_friction_rule body atom from ['friction', ['F', '_', '_', 'unset']] to ['friction', ['F', '_', '_', '_', 'unset']] for arity-5`
- The body atom's `'unset'` value is the disposition (4th positional arg in arity-4); in arity-5 with anchor_a + anchor_b added, disposition becomes the 5th positional arg. Pattern updates accordingly.

**M4 — Rewrite Task 7 Phase 12 against actual bridge API:**
- Replace `bridge.queryPort.query(...)` with `bridge.queryProof({ pattern: [...] })` per domain-bridge.js:138
- Inspect probe file for actual helper names (likely `assertOk` or similar — not standard `assert`)
- Verify pattern: the implementer should read the probe file at Task 7 Step 1 before writing Step 7

**M5 — Pre-enumerate bridge-integration.test.js migration points in Task 1:**
- Add explicit line references to Task 1's Files block: `bridge-integration.test.js:42` (claim + source='design'), `bridge-integration.test.js:47` (addresses)
- The `addresses:` migration at line 47 also requires Task 3 coordination (the substitute requires a CONCERN + PROPOSITION setup similar to concern-schema.test.js:260)

After applying M1-M5, the plan should be re-attacked to verify residual risk is at Moderate or Low. The four reviewer subagents (plan-reviewer, plan-attacker, plan-smeller, ground-truth) all need fresh dispatch only if the user chooses to validate post-mitigation; otherwise the mitigations land as in-place plan edits and execute-write proceeds against the revised plan.

<!-- created-at: 2026-05-17T16:45:00Z -->

<!-- created-at: 2026-05-17T16:35:31Z -->
<!-- produced-by plan-build@v0006 -->

---

## Pass 2 — Plan-attack re-validation (post-mitigation)

After M1-M5 were applied to `plan-01`, plan-attack re-ran. Verdict: M1-M5 land correctly as plan-time specifications. Four NEW defects surfaced, all in the plan's own test-code boilerplate (not in the underlying mitigations):

- **HIGH-NEW-1:** All 5 new test-file code blocks used `bridge.queryPort.query(...)` — the same bug M4 caught for the probe, but I missed in the test code. Bridge facade exposes `queryProof({ pattern })`, not `queryPort`. Fixed inline via global s/queryPort.query/queryProof + pattern. All test code now uses correct API.
- **HIGH-NEW-2:** Test imports used `'../../engine/index.js'` — no such barrel; existing tests use `await import('../../engine/Engine.js')` inside async `makeRealBridge`. Fixed by adding a Test Scaffolding Template section at the top of plan-01 mandating the exact preamble from `permission-schema.test.js:1-28` and explicitly superseding the simplified inline factory shown in per-task code samples.
- **HIGH-NEW-3:** Task 2 commit block omitted `friction-policy.js` (the M1 mitigation file). Fixed.
- **LOW-NEW-1:** Task 3 commit block omitted `bridge-integration.test.js` (M5 line 47 fix). Fixed.

Pass-2 risk assessment: **Moderate**. Semantic fixes M1-M3 correctly specified; M4-M5 enumeration correct. Mechanical defects in test-code boilerplate corrected inline. Residual risk after corrections: the test scaffolding mandate is documented but relies on the implementer reading the plan's top-of-document Test Scaffolding Template and applying it during execute-write subagent dispatch. A diligent implementer following the existing test patterns (`permission-schema.test.js`, `risk-schema.test.js`) would catch any deviation immediately at TDD step 2.

**Final risk level: Moderate.** Plan is implementable as written with the scaffolding template directive in place.
