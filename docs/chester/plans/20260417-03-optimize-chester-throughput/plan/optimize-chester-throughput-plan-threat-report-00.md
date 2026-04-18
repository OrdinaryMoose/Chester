# Optimize Chester Throughput — Plan Threat Report

> Combined findings from `plan-attack` and `plan-smell`, synthesized with on-disk verification. Produced at the Plan Hardening gate before execution. The designer decides whether to proceed, proceed with directed mitigations, return to design, or stop.

## Combined Implementation Risk: **Significant**

## Why this level (3-5 statements)

1. **The plan's scope does not cover all files holding archived-skill references.** The design brief's top two acceptance criteria state `design-specify` and `design-figure-out` must not appear in any active skill file. Verification against the worktree surfaces references in **five additional files** the plan does not touch: `skills/execute-write/SKILL.md` (line 25), `skills/plan-build/SKILL.md` body text (lines 22, 45, 53 — outside the Integration section the plan does update), `skills/start-bootstrap/SKILL.md` (lines 6–7 frontmatter and 18–19 body), and `skills/util-design-brief-small-template/SKILL.md` (lines 13, 21, 26, 155). Task 7's `/reload-plugins` verification is a manual spot-check and does not grep across all skill files, so the gap would not be mechanically caught.

2. **Task 5 has a heading collision that would produce a malformed skill file.** The existing `## Phase 5: Closure` heading at line 544 of `design-experimental/SKILL.md` would persist in the file alongside the new `## Finalization Stage` and `## Archival Stage` headings unless the edit instruction explicitly replaces it. The plan's 5D says "Before the original closure steps (which become part of Archival), insert..." — ambiguous. Without clarification, the resulting SKILL.md has duplicated/overlapping closure sections and the test in 5A passes despite the malformation.

3. **Three implicit contracts span skills without operational definition.** The `feature-dev:code-architect` subagent_type is named in the Integration section but not in the Dispatch step that actually launches the subagents (plan-smell finding 1). The anchor-extraction-from-statement-text convention is specified in prose but not defined with an example, and both `design-experimental` and `plan-build` depend on the same convention (plan-smell finding 2). The verified-anchor skip-list protocol is injected at dispatch-prompt time only; `plan-attack/SKILL.md` itself has no signal that such a skip-list can arrive (plan-smell finding 3).

4. **The verification dimension of plan-attack was falsely positive.** The reviewer reported `## Plan Hardening` heading as absent from plan-build; on-disk verification shows it present at line 169. Disregard plan-attack's C2 finding and related Edit-anchor concerns. The `proof-state.json` naming in Task 3 is also verified correct against the existing `design-experimental` Phase 2 opening (line 247) — H2 resolved.

5. **Structural design is sound; issues are additive, not architectural.** Boundary naming, commit ordering, test-first discipline, parallel-dispatch specifications, and brief template structure are all well-formed. The Significant risk level reflects the scope gap and heading collision — both cheap to fix with targeted amendments — not a structural flaw that would require returning to design.

## Designer Options

1. **Proceed as-written.** Risk: acceptance criteria #1 and #2 fail mechanically once `/reload-plugins` or a grep sweep runs. Implementer would discover the gap mid-sprint and have to scope-expand ad-hoc. Not recommended.

2. **Proceed with directed mitigations.** Apply these targeted amendments before execution:
   - Extend Task 2 (or add a new Task 2b) to scrub archived-skill references from `skills/execute-write/SKILL.md`, `skills/plan-build/SKILL.md` body text (three non-Integration references), `skills/start-bootstrap/SKILL.md`, and `skills/util-design-brief-small-template/SKILL.md`.
   - Add a cross-skill grep assertion in Task 7 that fails if any active `skills/*/SKILL.md` contains `design-figure-out` or `design-specify`.
   - Clarify Task 5 Sub-task 5D: the edit **replaces** the `## Phase 5: Closure` heading and its body content with the new `## Finalization Stage` and `## Archival Stage` sections. No duplicated closure material.
   - Extend Task 5 Sub-task 5D with a concrete example of anchor extraction from an EVIDENCE statement (one worked example is sufficient to lock the convention).
   - Add an explicit `subagent_type: "feature-dev:code-architect"` directive in the Finalization Stage Dispatch step so the Integration-section claim and the procedure agree.
   - Optional: add a small "Trust Input (optional)" section to `plan-attack/SKILL.md` acknowledging that a verified-anchor skip-list may arrive in the dispatch prompt — this closes smell finding 3 but is not blocking.

3. **Return to design with additional requirements.** Only warranted if the scope gap indicates deeper brief omission. My read: the brief is correct; the plan under-enumerated the file set. No return-to-design needed.

4. **Stop.** Reserve for cases where the risk level is unmanageable. Not applicable here.

## Recommendation

**Option 2 — proceed with directed mitigations.** The scope gap is a plan-author omission, not a design flaw, and the fixes are mechanical extensions to existing tasks plus one grep test. Expected amendment work: 15–30 minutes of plan edits, no re-review needed afterward because the amendments are all additive to already-approved task structure.

---

## Full plan-attack Findings

### Critical

- **C1 — Plan under-scopes the archived-reference scrub.** Five+ active skill files contain `design-figure-out` or `design-specify` references outside the scope of current tasks 2 and 3. Listed in "Why this level" point 1. Real. Blocks acceptance criteria.
- **C2 — Plan-build Edit anchors.** Reviewer claimed `## Plan Hardening` absent; grep confirms present at line 169, and "Launch two Agent subagents in parallel" present at line 176. **Disregard.**

### High

- **H1 — Line numbers drift after earlier edits in Task 2.** The `old_string`/`new_string` Edit mechanism handles this, but the plan's line-number hints to the implementer will be stale after earlier edits land. Soft issue, not blocking.
- **H2 — `proof-state.json` naming.** Reviewer could not verify; on-disk verification shows the existing skill already uses `{sprint-name}-proof-state.json` at design-experimental line 247. **Confirmed correct.**
- **H3 — Sub-task ordering hazard in Task 5.** If 5D's insertion happens before 5E's deletions, the implementer lands new sections next to stale "Transition to design-specify" text. Real risk. Mitigated by explicit ordering in amended Task 5.
- **H4 — `Phase 5: Closure` heading persists next to new `Archival Stage`.** Real. Addressed in Option 2 mitigation.
- **H5 — Test does not guard against H4 malformation.** Real. Addressed by adding heading-absence assertion or by relying on the explicit replace instruction.

### Moderate

- **M1 — Section-order test matches first occurrence.** Fragile if template grows inline `## Goal` examples in fences. Accept as-is; structural note.
- **M2 — Template line-count range 180–320.** Test uses numeric gate for a qualitative target. Accept — cheap to adjust if overshoot.
- **M3 — Backtick regex escaping in Task 5 test.** On-disk verification shows the pattern will match the emitted text. Accept.
- **M4 — Ground-truth report glob does not specify "highest-numbered version".** Real correctness gap for the Finalization reopen path. Low frequency (reopen is rare) but should be addressed inline when extending Task 6 — one-line change.
- **M5 — Task 7 does not mechanically guard "no archived refs across all skills".** Real. Addressed by adding a cross-skill grep test in Option 2 mitigation.

### Minor

- **m1 — `.mcp.json` references paths that may no longer exist.** Out of brief scope ("no changes to MCP"). Leave for a follow-up.
- **m2 — YAML frontmatter folded vs inline style.** Accept — both styles render identically in the Skill tool registry.
- **m3 — Frontmatter update removes forbidden words `experimental` and `fork`.** Verified true.

### Verified TRUE Assumptions

- Worktree does not contain `design-figure-out` or `design-specify` skill directories.
- Baseline test suite has 8 tests.
- `util-design-brief-template/SKILL.md` is 548 lines.
- `design-experimental/SKILL.md` is 600 lines.
- `design-experimental`'s frontmatter contains "Experimental" and "Fork".
- `design-experimental`'s Phase 5 Closure transitions to `design-specify`.
- `plan-build`'s Integration lists `design-specify` as primary invoker.
- `feature-dev:code-architect` subagent exists at `~/.claude/plugins/marketplaces/claude-plugins-official/plugins/feature-dev/agents/code-architect.md`.
- `util-artifact-schema` table has rows for `design-figure-out` / `design-specify` at lines 106–110.
- `setup-start` lines 224, 229–231, 247, 250 reference archived skills.

---

## Full plan-smell Findings

### High

- **Smell 1 — Dispatch step does not name the architect subagent_type.** Integration section advertises `feature-dev:code-architect`, Finalization Stage Dispatch step just says "three architect subagents with trade-off lens prompts". Silent contract drift. Mitigation: name the subagent_type in the Dispatch step explicitly.

- **Smell 2 — Anchor extraction contract is implicit.** Plan specifies "extract anchor from statement text" but provides no example, no regex, no heuristic. Two skills (`design-experimental` and `plan-build`) depend on the same extracted-anchor convention. If one session extracts `MyService` and another extracts `src/Application/MyService.cs`, the skip-list lookup silently misses. Mitigation: add a concrete example in Envelope Handoff section.

- **Smell 3 — Skip-list injected at dispatch-prompt time, not in `plan-attack/SKILL.md`.** Future edits to plan-attack can contradict the embedded-prompt instructions because nothing at the skill level signals the protocol exists. Mitigation: small "Trust Input (optional)" section in `plan-attack/SKILL.md`.

### Medium

- **Smell 4 — Task 3 schema test does not assert proof-state entry name.** Narrow test. Accept — the skema row is verified to match elsewhere.

- **Smell 5 — Smell heuristic keyword bleed-through.** Bare words like `async`, `persistence`, `Repository` may match plan text prose (e.g., a plan that says "does NOT introduce async"). Acknowledged in the plan as acceptable over-firing. Accept.

- **Smell 6 — Trigger keyword list duplicated across retrospective + design brief + plan.** Low-cost drift. Accept — retrospective is point-in-time.

- **Smell 7 — Checklist step 9 elides "Envelope Handoff is a boundary, Finalization is a stage".** Prose inconsistency. Minor.

- **Smell 8 — Test over-fits to phrasing.** Fragile if future edits rephrase "Transitions to: plan-build" to "Next skill: plan-build". Accept — cheap tests, cheap fixes.

### Low

- **Smell 9 — Line-count range codifies qualitative target.** Accept.

- **Smell 10 — Shared-prose extraction deferred during a natural convergent edit window.** Acknowledged in the plan. Accept as known deferred work.

- **Smell 11 — No error-path spec for malformed ground-truth subagent output.** Happy-path-only. Real but narrow. Address opportunistically during implementation.

---

## Risk Assessment Summary

Structurally sound plan with one real scope gap (C1) and one real file-malformation risk (H3/H4). Both are mechanical fixes that can be made inline without rework. The implicit contracts flagged by smell (subagent_type, anchor extraction, skip-list) are worth tightening during the same pass because all three involve prose that will be read by future implementers and future skill authors. Recommend Option 2 — proceed with directed mitigations — as the cheapest path to a plan that can execute end-to-end without scope creep mid-sprint.
