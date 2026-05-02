# Reasoning Audit: Decision Record System Replacement

**Date:** 2026-05-01
**Session:** `00`
**Plan:** `fix-decision-record-plan-00.md`

## Executive Summary

The session replaced an inverse-coupled trigger-driven decision-record system with a retrospective audit-time emission, surgically reverting the 2026-04-24 build-decision-loop merge while preserving every post-04-24 keep-bucket change. The most consequential decision was the architecture pivot from a discriminator-on-primary plus single-fork shape to a parent-orchestrated parallel two-fork pattern over a single shared JSONL read — that pattern is what this very audit fork is executing under. The implementation stayed largely on-plan; deviations were limited to inline corrections for caught issues (path-displacement HIGH, two CRITICAL plan-attack findings, and one defended-without-fix calibration call on a test that was RED-by-design through the revert sequence).

## Plan Development

The plan was developed through the full Chester pipeline: design-large-task produced a 9-section proof envelope (6 NCs, 13 Rules, 4 RCONs, 2 Risks) ratified at round 7; design-specify formalized 22 acceptance criteria across 4 RCON groups under three review passes (fidelity, adversarial inline, ground-truth subagent); plan-build emitted 15 tasks with per-task complexity annotations and ran plan-attack + plan-smell in parallel during the hardening gate. Three findings (1 HIGH from ground-truth, 2 CRITICAL + 1 HIGH from plan-attack/smell) were caught and addressed inline before execute-write began. Execution then ran in mixed inline/subagent mode (operator override of the pure-subagent header recommendation) across 23 commits, with one mid-execution calibration call that defended a deliberately-RED revert-clean test against a reviewer false-positive.

## Decision Log

### Architecture pivot to parent-orchestrated parallel fork

**Context:**
The original brief NC-01 read "during the same agent pass producing the reasoning audit," implying a single agent that ran both filters. After the brief was approved, the user asked whether one read of the JSONL on the primary followed by two forked subagents inheriting that context could do the two independent tasks instead. A subsequent user turn clarified: no first subagent — primary reads then forks directly.

**Information used:**
- The existing `CLAUDE_CODE_FORK_SUBAGENT=1` mechanism (named subagents inherit parent transcript by construction)
- NC-01's intent ("single JSONL read, both surfaces derive from same source") versus its surface wording ("agent pass")
- The existing path-resolution snippet at lines 160-161 of `finish-write-records/SKILL.md`

**Alternatives considered:**
- `Single agent runs both filters sequentially` — rejected as the original brief shape; coupling the two filters to one context window forces sequential discrimination over the same transcript and burns tokens twice for the same inheritance work.
- `Primary precursor subagent reads JSONL then re-dispatches two forks` — rejected at user direction ("just read the session jsonl on primary and then fork; no first subagent").
- `Two independent skill calls each re-reading the JSONL` — implicitly rejected; duplicates the read and breaks the "shared source" intent.

**Decision:** Parent reads JSONL once via existing snippet, then forks two named subagents in parallel via a single message issuing both Agent calls; both forks inherit transcript context; each fork carries its own discrimination filter file.

**Rationale:** Symmetric two-fork pattern preserves NC-01's intent (single read, parallel filters), uses the existing fork inheritance mechanism cleanly, and lets each filter be tuned independently without context coupling. The brief's "agent pass" wording was carried as soft reinterpretation in the spec rather than amending the brief.

**Confidence:** High — explicitly negotiated across user turns 789 and 801, then re-stated by the agent at turn 805 with the spec-level reinterpretation flagged for the user.

---

### Surgical revert ordering with deliberately-RED revert-clean test

**Context:**
Reverting the 2026-04-24 build-decision-loop merge required removing scattered code across many files (MCP package, skill files, references, agents, bash tests). Plan-build had to choose between landing all reverts atomically or staging them so partial reverts could be tested.

**Information used:**
- AC-4.7's grep-token list (`dr_capture`, `dr_audit`, `dr_query`, `dr_supersede`, `dr_finalize_refs`, `dr_abandon`, `dr_verify_tests`, `chester-decision-record`, `must-remain-green`, `skeleton-generator`, `propagation-procedure`, `observable-behaviors`)
- The cross-cutting nature of the surface area (15 files modified, 14 files deleted)
- TDD discipline requiring a failing test before each implementation change

**Alternatives considered:**
- `One atomic revert commit` — rejected; defeats per-step verification and gives no granularity for catching residue between steps.
- `One revert task per file with its own validator test` — rejected as too granular for the scope; would multiply task count past the heuristic ceiling.
- `Single revert-clean baseline test that is RED until all reverts land, with per-task surgical commits` — chosen.

**Decision:** Task 6 writes a token-scan revert-clean baseline test that is RED from Task 6 through Task 13 by design and goes GREEN only at Task 14, with the plan explicitly documenting the RED-by-design window.

**Rationale:** Single global validator catches every residue token in one pass; per-task commits preserve granularity and bisectability; the RED-by-design window is a known cost paid in exchange for a single source of truth on revert completeness. Documented as such so future readers and reviewers understand the test is not broken when failing during the window.

**Confidence:** High — the calibration call at turn 1857 defended this exact design choice against a reviewer who flagged the failing test as a CRITICAL finding without the multi-task context.

---

### Mixed inline/subagent execution mode

**Context:**
Plan-build's execution-mode heuristic recommended `subagent` (all four conditions failed: 15 tasks, Significant threat risk, ~18 decision-budget, multiple multi-file tasks). The user overrode the pure-subagent recommendation with "use mixed inline and subagent depending on complexity."

**Information used:**
- Per-task `Complexity:` annotations (5 complex / 4 moderate / 6 simple)
- The plan header's standing guidance that simple tasks tolerate inline mode at operator discretion
- Token budget pragmatics — review-independence overhead on simple docs tasks is not worth the token cost

**Alternatives considered:**
- `Pure subagent for all 15 tasks` — rejected per user override; over-spends review-independence on simple docs/test tasks.
- `Pure inline for all 15 tasks` — implicitly rejected; the complex tasks (T4 fork-restructure, T7 execute-write SKILL revert, T9 design-specify revert, T10 plan-build revert) genuinely benefit from independent review.
- `Subagent for all code-producing, inline for docs/tests` — close to what was chosen but reformulated by complexity tag rather than artifact type.

**Decision:** Inline for T1, T2, T5, T6, T13, T14, T15 (simple); subagent for T3, T4, T7, T8, T9, T10, T11, T12 (moderate or complex).

**Rationale:** The complexity annotation on the plan was designed exactly for this runtime routing. Inline tasks are simple docs/tests where reviewer overhead exceeds value; subagent tasks are multi-file or contract-shifting changes where independence catches drift.

**Confidence:** High — explicitly stated at turn 1583 with the routing list.

---

### Soft-reinterpretation of NC-01 in spec rather than amending the brief

**Context:**
The fork-pattern architecture pivot meant NC-01's "during the same agent pass" no longer matched the implementation literally — there was now a parent read plus two parallel forks, not one agent pass. The agent had to choose whether to amend the approved brief or carry the reinterpretation in the spec.

**Information used:**
- The brief was already approved at round 7 ratification; amending an approved brief is normally avoided
- NC-01's intent ("single JSONL read, both surfaces derive from same source") was preserved by the new architecture
- Spec is the natural place for implementation-reality phrasing; brief is the proof envelope

**Alternatives considered:**
- `Hard amendment — note in spec that NC-01's "same agent pass" is satisfied by "shared JSONL read on parent followed by parallel fork dispatch."` — rejected as cleaner-feeling but heavier; modifies the brief surface.
- `Soft reinterpretation — spec text says "during the reasoning-audit dispatch" rather than "during the same agent pass"; brief stays untouched.` — chosen.

**Decision:** Soft reinterpretation; brief NC-01 wording preserved verbatim; spec carries the fork-explicit phrasing.

**Rationale:** "Brief stays untouched; spec carries the implementation reality" — the agent's stated rule (turn 805). Brief is the contract envelope; spec is the buildable surface; reinterpretation lives at the buildable layer.

**Confidence:** High — flagged explicitly to the user before spec writing began.

---

### Three new bash tests over a unit-test-style harness

**Context:**
The implementation was primarily configuration-and-prose changes (skill markdown, reference files, package deletions). The spec needed to define a test surface for the records emission, supersession discovery, and revert completeness.

**Information used:**
- Existing test conventions in `tests/test-*.sh` (self-contained bash scripts)
- The MCP that previously held the validation logic (`chester-decision-record`) was being deleted, so MCP-mediated tests were not available
- The acceptance criteria expressed observable boundaries as files, file content, or token presence/absence

**Alternatives considered:**
- `Inline procedural verification per task with no committed tests` — rejected; loses regression coverage.
- `New JS test harness paralleling MCP package tests` — rejected; the package is being deleted; adding JS infrastructure for prose-level checks is overkill.
- `Three bash tests: emission format-conformance, supersession-by-forward-scan, revert-clean token-scan` — chosen.

**Decision:** Three new bash tests, each scoped to one observable invariant.

**Rationale:** Bash tests match existing repo conventions, are self-contained, and exercise the observable boundaries directly (YAML parse, grep over corpus, token-scan over skill corpus). Skeleton scaffolding deliberately skipped per the spec's explicit reasoning ("scaffolding stubs against a system being torn out would be artifacts of a transitional state that exits before the stubs are exercised").

**Confidence:** High — Testing Strategy section of the spec states the choice and its rationale.

---

### Spec-stage HIGH-finding correction: skeleton-generator path

**Context:**
Ground-truth review caught a HIGH finding: the spec listed `skills/execute-write/references/skeleton-generator.md` as a deletion target, but `skeleton-generator.md` actually lives under `skills/design-specify/references/`, not `skills/execute-write/references/`. The brief's NC-05 collapse test had named "skeleton-generator / propagation-procedure / test-generator" as a single trio, homogenizing paths that were in fact split across two directories.

**Information used:**
- `ls skills/design-specify/references/` and `ls skills/execute-write/references/` directly
- The brief's collapse-test wording (which conflated the three references)
- Reviewer's grep returning zero matches for `must-remain-green` (a separate MEDIUM finding)

**Alternatives considered:**
- `Defer fix to plan-build` — rejected; would carry the wrong path into the plan and propagate to execution.
- `Amend the brief to fix path` — rejected; the brief's collapse-test wording is structurally fine, the error was in the spec's binding step.
- `Correct spec inline before plan-build runs` — chosen.

**Decision:** Spec amended to bind `skeleton-generator.md` to the `design-specify/references/` directory; the other two references stay under `execute-write/references/`.

**Rationale:** Path-displacement bug from spec-writing fatigue. The fix is a one-line correction at the spec layer; deferring would propagate the displaced path into the plan, the implementer dispatches, and possibly merge before catching.

**Confidence:** High — narrated explicitly as a path-displacement bug at turn 987.

---

### Defending the revert-clean RED-by-design window against CRITICAL finding

**Context:**
Mid-execution, a quality reviewer flagged the revert-clean test as broken because it failed at task boundary. The reviewer did not have the multi-task plan context.

**Information used:**
- The plan's explicit documentation that revert-clean is RED from Task 6 through Task 13 and goes GREEN at Task 14
- The reviewer's report content (test failed; called CRITICAL)
- The other two findings (`spec-template.md:3` "skeleton-stub reference" intro residue, `util-artifact-schema/SKILL.md` "spec-skeleton" artifact-type entry) which were genuine T9 residue

**Alternatives considered:**
- `Accept the CRITICAL finding and re-design the test` — rejected; the test is fine, the report is wrong.
- `Defer all three findings together` — rejected; mixes a false-positive with two real bugs.
- `Defend the false-positive without fix; clean up the two real residue items inline` — chosen.

**Decision:** Defended the revert-clean RED window without modification; cleaned up the two genuine residue findings (`spec-template.md` intro line, `util-artifact-schema` artifact-type entry) immediately.

**Rationale:** Calibration discipline — a CRITICAL flag is a signal, not a verdict. The plan's RED-by-design documentation is the authoritative context; reviewer dispatched without it cannot distinguish broken-by-bug from broken-by-design. Accepting the false-positive would either delay the sprint or compromise the test's design.

**Confidence:** High — explicit calibration call narrated at turn 1857.

---

### Keep-bucket verification scope expansion

**Context:**
Task 15 (manual keep-bucket preservation check) initially grepped `design-large-task/SKILL.md` for "Resolve Conditions" and found zero matches, raising a false alarm that cluster-a's contribution had been lost.

**Information used:**
- The actual location of the Resolve Conditions feature: `proof-mcp/` (10 files), not `design-large-task/SKILL.md`
- A broader scan over the proof-mcp package
- Pre-existing test failure in `test-brief-template-structure.sh` — re-ran against sprint-start commit `5f07c64` and got identical failure, confirming pre-existing

**Alternatives considered:**
- `Treat the zero match as a failure and trigger a recovery investigation` — rejected after broader scan; the feature is intact in the right location.
- `Narrow the scope to just SKILL.md and report partial coverage` — rejected; under-checks the keep-bucket invariant.
- `Broaden the scan to the package level and verify all eight keep-items` — chosen.

**Decision:** Broadened verification to package-level scan; confirmed all eight keep-bucket items intact; classified the unrelated `test-brief-template-structure.sh` failure as pre-existing-out-of-scope.

**Rationale:** A grep miss on a SKILL.md doesn't mean the feature is gone — features can live in adjacent code (here, the MCP package). Verifying at the right altitude prevents false-recovery panics. Pre-existing test failures must be confirmed by replaying against the sprint baseline before declaring scope.

**Confidence:** High — narrated at turn 2114.

<!-- created-at: 2026-05-01T14:30:00Z -->

<!-- created-at: 2026-05-01T18:11:26Z -->
<!-- produced-by finish-write-records@v0003 -->
