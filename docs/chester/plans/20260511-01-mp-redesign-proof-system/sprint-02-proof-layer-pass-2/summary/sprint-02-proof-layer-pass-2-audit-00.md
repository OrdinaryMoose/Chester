# Reasoning Audit: Add Missing CONCERN Element Category to Domain Pipeline

**Date:** 2026-05-15
**Session:** `00`
**Plan:** `sprint-02-proof-layer-pass-2-plan-01.md`

## Executive Summary

The session added the missing CONCERN element category to the domain element-schema pipeline at `skills/design-proof-system/references/domain/`, running the full pipeline from design-small-task through execute-write. The most consequential decision was the user-directed scope correction mid-plan-build: the original Hybrid Recommendation (option a) pulled `proof-mcp` rewiring into scope; the user clarified that `proof-mcp` is a separate system and the spec was revised from `-02` to `-03`, dropping four acceptance criteria (AC-5.1, AC-5.2, AC-5.3, AC-6.3) and collapsing scope to Architect A's option (b) — minimum-scope. Plan hardening then surfaced two CRITICAL defects in the test substrate that forced Task 5 and Task 7 to switch to real-Engine imports rather than the in-memory fake. The implementation stayed on the corrected plan; tests landed green (84/84 domain, 138/138 engine).

## Plan Development

The plan was developed through the standard Chester pipeline: design-small-task produced a six-section design brief framing CONCERN omission as accidental pass-1 oversight, design-specify ran two competing architects plus a prior-art explorer, plan-build dispatched a codebase-explorer subagent, and the plan-hardening gate dispatched parallel plan-attacker and plan-smeller subagents. Two non-trivial revisions occurred. First, after spec-02 was approved and plan-build began, the dispatcher's codebase exploration revealed that the Hybrid's proof-mcp rewire surface was substantially larger than spec-02 captured (≈12 source files plus 10 test files plus on-disk persistence schema). The user intervened with the system-boundary clarification, producing spec-03 and a re-grounded plan-00. Second, plan-hardening surfaced two CRITICAL defects (`_runFixedPoint` no-op stub; `verifyArgsShape` SHAPE_INVALID on pinned ratify) that forced revision to plan-01 before execute-write dispatch.

## Decision Log

### Scope correction from option-a Hybrid back to option-b minimum-scope

**Context:**
After spec-02 was approved (Hybrid Recommendation, originally framed as option-a-leaning), plan-build's codebase exploration revealed the `proof-mcp` rewire surface spanned ~12 source files, ~10 test files, plus a persistence schema migration. Spec-02 had no rationale for crossing the system boundary into `proof-mcp`. The user interrupted plan-build mid-flight to ask why `proof-mcp` was in scope when this sub-sprint targets only `skills/design-proof-system/`.

**Information used:**
- User message at JSONL line 703: "why are we concerned with proof-mcp? that is a different system and skill. we are concerned only design-proof-system directory and files"
- Spec-02 §AC-5.1/5.2/5.3/6.3 enumerated proof-mcp rewire targets
- Plan-build dispatcher's codebase report enumerating the full rewire surface (state.js, server.js, metrics.js, friction-detection.js plus ten test files)
- Architect A's original "option (b) — minimum-scope" recommendation from design-specify

**Alternatives considered:**
- `Keep spec-02 Hybrid (option-a flavor) and proceed with full proof-mcp rewire` — rejected because the user's system-boundary statement is dispositive; the proof-mcp is in maintenance mode and is governed by a separate skill.
- `Defer entire sub-sprint and re-run design-specify` — rejected because the Architect A option was already on the table; the correction is a scope contraction, not a fresh design question.

**Decision:** Revise spec to `-03`, drop AC-5.1, AC-5.2, AC-5.3, AC-6.3, remove the "Proof-mcp layer" Components section, remove Data Flow step 5, and tighten Non-Goals with an explicit system-boundary statement. Re-anchor the plan against spec-03.

**Rationale:** Architect A's prior-art-grounded recommendation was correct; the Hybrid synthesis pulled scope that didn't belong. The proof-mcp's `state.concerns` is legacy infrastructure under a different skill and rewiring it from inside a design-proof-system sub-sprint would violate the cross-skill boundary the user is establishing.

**Confidence:** High — user directive is explicit; the spec-03 preamble at line 11 documents the rationale verbatim.

---

### Real-Engine import in Task 5 and Task 7 (substrate `_runFixedPoint` is a no-op)

**Context:**
Plan-hardening's adversarial review discovered that the in-memory test substrate at `domain/__tests__/_fixtures/inMemorySubstrate.js:126` defines `_runFixedPoint` as an empty stub with a comment placeholder, so the `derived` IDB map is never populated. Plan-00's Task 5 six closure-policy derivation tests and Task 7's lifecycle test both relied on `s.query.derive()` against this substrate, meaning every `exists(['covered', ...])`, `exists(['unaddressed_concern', ...])`, and `exists(['closure_permitted', []])` call would return `false` regardless of correctness — false negatives on positive cases, false positives on negative cases.

**Information used:**
- Plan-attacker subagent report (JSONL line 866): "`_runFixedPoint` is a no-op stub — all Task 5 closure-policy derivation tests will produce false-positive passes or false-negative fails"
- Working pattern at `bridge-integration.test.js:37-38` using `import('../../engine/Engine.js')`
- The pre-existing cross-layer real-import test convention recorded in `dr-20260514-06` (the boundary stamp HEAD commit at session start)

**Alternatives considered:**
- `Implement `_runFixedPoint` properly inside the in-memory substrate` — rejected because the substrate is shared test infrastructure; implementing a full fixed-point evaluator is a separate refactor that exceeds the sprint's scope.
- `Stub specific predicates per test fixture` — rejected because the per-fixture stub approach (which the substrate's comment hints at) would test the stub, not the derivation rules.
- `Keep the substrate fake but mark tests as TODO` — rejected because Task 5 and Task 7 are the primary verification surface for AC-4.x; deferring them voids the spec's coverage claim.

**Decision:** Revise Task 5 (all six derivation tests) and Task 7 (lifecycle test) to use the real Engine via `import('../../engine/Engine.js')`, building a small `makeRealEngineBridge` helper that wires the real Engine to the existing test allocator/clock/consent/persistence fakes.

**Rationale:** The real-Engine pattern is already the working convention at `bridge-integration.test.js` and was elevated to a cross-layer convention by `dr-20260514-06` the day before this sprint. Using the real Engine eliminates the false-signal risk and aligns Task 5 and Task 7 with the cross-layer real-import test convention.

**Confidence:** High — defect, resolution, and reference pattern all explicit in the plan-attacker report and the plan-01 revision preamble.

---

### Generic `ratifyElement` with dummy EVIDENCE fields instead of pinned `ratifyConcern` in Task 7

**Context:**
Plan-attacker's second CRITICAL finding identified that `mutations.js:119` runs `verifyArgsShape(args, targetShape)` on every operation including ratify. With `targetShape = 'concern'` (pinned by `ratifyConcern` or `args.idShape: 'concern'`), the check would fail because `CATEGORY_REGISTRY['concern'].requiredFields = ['label']` and the ratify args supply only `{ elementId, idShape }`. The dedicated `ratifyDefinition` wrapper at `domain-bridge.js:92` was discovered to be latently broken in the same way — no existing test exercises it. The Task 7 lifecycle test had to ratify a Concern to drive derivation, and the obvious path (call the new `ratifyConcern` entry point) would throw SHAPE_INVALID before the derivation step.

**Information used:**
- Plan-attacker report identifying the SHAPE_INVALID path at `mutations.js:119` + `schema.js:79-83`
- Working integration test pattern at `bridge-integration.test.js:49-50` using generic `ratifyElement` with dummy `source` + `claim` fields satisfying EVIDENCE's required shape
- The pre-existing `ratifyDefinition` brokenness (no test reaches it; pre-existing pass-1 gap)

**Alternatives considered:**
- `Fix `verifyArgsShape` to skip required-field checks on ratify` — rejected because changing the shape-check contract is out of scope and would affect every ratifiable category.
- `Patch `ratifyConcern` to pass dummy fields internally` — rejected because hiding required-field padding inside the wrapper masks the underlying contract gap and would obscure the latent `ratifyDefinition` bug.
- `Provide a `ratifyConcern` test using `label` field padding` — rejected because EVIDENCE-required fields (`source`, `claim`) are the established working pattern; introducing a Concern-specific shim creates divergence.

**Decision:** Task 7's ratify step calls `bridge.ratifyElement({ elementId, source: 'designer', claim: '_' })` matching the `bridge-integration.test.js:49-50` working pattern, and execute-write records a Decision documenting the latent `ratifyConcern` / `ratifyDefinition` SHAPE_INVALID throw as a known issue inherited from pass-1.

**Rationale:** The working pattern is the lowest-risk path; it exercises real derivation through the bridge while leaving the latent contract gap visible for a future sub-sprint to address.

**Confidence:** High — plan-attacker report names both the defect and the working pattern; plan-01 preamble cites the resolution.

---

### Relocate Domain and Engine out of `design-large-task/` into `design-proof-system/references/`

**Context:**
Early in the session, before design-small-task ran, the user observed that the proof engine and domain were lumped under `skills/design-large-task/` even though they are different systems from the proof MCP. The user requested moving Domain and Engine into `skills/design-proof-system/references/` so design-proof-system can eventually become a skill parallel to design-large-task and design-small-task.

**Information used:**
- User message at JSONL line 164 directing the move
- The clean modular boundary observed during the move: 73 file renames, all tests pass at new locations (84/84 domain, 138/138 engine) because every test import was relative to its own package root and every Engine↔Domain contact went through runtime port injection
- The archived plans under `docs/chester/plans/` retain old paths (historical record)

**Alternatives considered:**
- `Also relocate `proof-mcp/`` — explicitly deferred (flagged for a future decision); the user named only Domain and Engine.
- `Keep current location and add a redirect/symlink` — *(No alternatives visible in context)*; not raised.

**Decision:** Move Domain and Engine to `skills/design-proof-system/references/{domain,engine}/`, preserve git rename detection across 73 renames, commit with message `refactor: relocate Domain and Engine to skills/design-proof-system/references (decouple from design-large-task)`. Defer `proof-mcp/` relocation.

**Rationale:** Aligns directory structure with the system boundary the user is establishing between design-proof-system (the proof stack) and design-large-task (the MCP server consumer). The clean test pass-rate after a pure rename confirms the modular boundary was already crisp.

**Confidence:** High — user directive explicit; outcome (tests green, history preserved) verified before commit.

---

### Architect-A option (b) chosen over option (a) at design-specify

**Context:**
At design-specify, two competing architects plus a prior-art explorer returned. Architect A recommended minimal-scope (option b) with dedicated entry points. Architect B recommended option (a) — retire `state.concerns`, route concern operations through the unified pipeline — plus dedicated entry points. The prior-art explorer recommended option (a) with high confidence based on pass-1 evidence. The user picked "hybrid" at JSONL line 387, which the dispatcher synthesized as a Hybrid Recommendation leaning toward option (a)'s pipeline unification.

**Information used:**
- Architect A report (minimal scope, dedicated entry points)
- Architect B report (option a, dedicated entry points, surfaced missing `approved → concern_status` rule)
- Prior-art explorer report identifying CONCERN omission as accidental pass-1 oversight and recommending option (a)
- Independent discovery by both architects that `closure-policy.js`'s `unaddressed_concern_rule` body reads from `risk(C, _, _)` instead of `concern_status(C, ratified)` — pre-existing pass-1 placeholder bug

**Alternatives considered:**
- `Architect A option (b) — minimum-scope only` — initially deferred via Hybrid; later restored by the scope correction.
- `Architect B option (a) — unified pipeline including proof-mcp` — initially favored by prior-art evidence; rejected after user system-boundary correction.
- `Pure custom synthesis ignoring both architects` — *(No alternatives visible in context)*.

**Decision:** Initially adopt Hybrid Recommendation (option-a-leaning); later reverted to Architect A's option (b) per user direction. The "b" pick at JSONL line 897 confirmed the revised path.

**Rationale:** The Hybrid synthesis followed prior-art evidence that the omission was accidental and option (a) was the canonically-correct fix. The user's system-boundary clarification revealed that the prior-art correctness argument was being applied across a system boundary the user did not want crossed in this sub-sprint.

**Confidence:** High — both choices and their order are explicit in the user-prompt trail and the spec revision history.

---

### Fix existing `unaddressed_concern_rule` bug in this sprint rather than deferring

**Context:**
Both architects independently spotted that `closure-policy.js`'s `unaddressed_concern_rule` body reads from `risk(C, _, _)` instead of `concern_status(C, ratified)`. This is a pre-existing pass-1 placeholder bug, not introduced by this sprint. The question was whether to fix it as part of the CONCERN-addition work or carry it as a known gap into a separate fix-up sub-sprint.

**Information used:**
- Independent identification by both architects (strong-evidence convergence)
- Prior-art explorer's framing that CONCERN was deliberately omitted at pass-1 with stub-quality consumer rules placed in `closure-policy.js`
- The plan's AC-4.x already covered `unaddressed_concern` derivation behavior — fixing the rule body is necessary for those ACs to pass

**Alternatives considered:**
- `Defer the rule-body fix to a separate sub-sprint` — rejected because AC-4.x derivation tests cannot pass without the correct body; the fix is on the critical path.
- `Fix the rule body but only via a new `unaddressed_concern_v2` rule, leaving the broken one in place` — *(No alternatives visible in context)*; not raised.

**Decision:** Replace the `unaddressed_concern_rule` body to read `concern_status(C, ratified)` instead of `risk(C, _, _)`, and add a new `covered_rule` as the producer for the `covered(C)` predicate, in Task 5.

**Rationale:** The rule-body fix is on the AC-4.x critical path and is a one-line correction; deferring it would either leave AC-4.x unverifiable or duplicate the closure-policy module across two sprints.

**Confidence:** High — fix is explicit in plan-01 Task 5 and the spec-03 architecture summary at line 20.

---

### Test allocator helper imports flat-API Engine via `../../engine/Engine.js`

**Context:**
During execute-write Task 5 implementation, the helper function `makeRealEngineBridge` had to construct a real Engine and wire it to existing test allocator/clock/consent/persistence fakes. Two API shapes were available: the flat-API Engine constructor and the port-bundled variant. Import path needed correction from a draft `../../../` to the correct `../../engine/Engine.js`.

**Information used:**
- The working test pattern at `bridge-integration.test.js:37-38` using `import('../../engine/Engine.js')`
- The cross-layer real-import test convention from `dr-20260514-06`
- The pre-existing Engine↔Domain shape normalizer at `cfe659c` accepting flat-API Engine plus port-bundled fakes

**Alternatives considered:**
- `Port-bundled Engine API` — rejected because the working pattern at `bridge-integration.test.js` uses flat-API, and the shape normalizer makes flat-API the canonical path.
- `Three-segment import `../../../engine/Engine.js`` — rejected as incorrect path (off by one directory level given the test file lives at `domain/__tests__/concern-schema.test.js`).

**Decision:** Use flat-API Engine constructor; import path `../../engine/Engine.js` from `domain/__tests__/`.

**Rationale:** Matches the working pattern and the canonical convention; the shape normalizer guarantees the flat-API call site composes with the existing fake ports.

**Confidence:** Medium — implementation detail visible in the plan-01 revision text and the implementer-side adjustment; the precise rejection of the port-bundled variant is inferred from the convergent evidence rather than explicitly narrated.

---

### Execute-write run in subagent mode

**Context:**
After plan-01 was finalized, execute-write needed to be dispatched. The plan's `Execution mode` header field selects between inline execution (the parent agent runs the plan) and subagent execution (one or more named subagents run tasks under review checkpoints).

**Information used:**
- Plan-01 header `Execution mode: subagent`
- User confirmation at JSONL lines 955 ("subagent") and 970 ("proceed with subagents")
- The cross-layer real-import test convention (`dr-20260514-06`) which mandates dedicated subagent review on TDD steps

**Alternatives considered:**
- `Inline execution by the parent agent` — rejected because the plan declared subagent mode; switching would bypass the implementer / quality-reviewer separation the plan assumes.

**Decision:** Run execute-write in subagent mode with the named implementer subagent and the quality reviewer.

**Rationale:** The plan-author chose subagent mode based on the cross-layer real-import test convention requiring an isolated reviewer; user re-confirmed the mode at dispatch.

**Confidence:** High — both the plan header and two user confirmations are explicit.

<!-- end of audit -->

<!-- created-at: 2026-05-15T12:39:41Z -->
<!-- produced-by finish-write-records@v0003 -->
