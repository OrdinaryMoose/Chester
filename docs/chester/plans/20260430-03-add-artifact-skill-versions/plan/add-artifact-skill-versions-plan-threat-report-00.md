# Plan Threat Report: Artifact Skill-Version Provenance

**Sprint:** 20260430-03-add-artifact-skill-versions
**Plan:** `add-artifact-skill-versions-plan-00.md`
**Hardening passes run:** plan-attack (unconditional), plan-smell (heuristic-fired on `task` keyword false positive in async category)

## Smell Heuristic Pre-Check

Triggers matched (case-insensitive):
- Async / concurrency: `task` (English noun in prose, e.g., "task-by-task", "Task 4") — false positive; plan introduces no concurrency primitives.

Per the matching discipline ("tune toward over-firing"), plan-smell was dispatched in parallel with plan-attack despite the trigger being spurious. The smell pass produced useful structural feedback even though the trigger that fired it was noise.

## Combined Findings

### REQUIRED — addressed during hardening

**[plan-attack #1] Tasks 8 and 9 had no real write site.**
plan-attack discovered that `skills/plan-attack/SKILL.md:133` and `skills/plan-smell/SKILL.md:118` both declare: "This skill does not write files. All output is inline in the conversation." The brief's D10 listed both as stamping skills under an UNTESTED assumption. The plan as originally written would have required the implementer to either silently skip the stamp calls (test failure) or add file-writing capability to those skills (significant unplanned scope expansion).

**Resolution applied during hardening:**
- Brief D10 corrected. plan-attack and plan-smell moved from stamping list to non-stamping list, with rationale documented.
- Plan Task 3 test updated: stamping-skill list no longer includes plan-attack/plan-smell; non-stamping list adds both.
- Plan Tasks 8 (plan-attack) and 9 (plan-smell) removed entirely.
- Plan Tasks 10 → 8, 11 → 9, 12 → 10. Final task count: 10.
- Plan Task 7 (plan-build) prose strengthened to confirm plan-build owns the threat-report chain because it writes the file during hardening.

### REQUIRED — execution-mode placeholder unresolved

**[plan-attack #3] Plan header still reads `**Execution mode:** subagent | inline`.**
This is the placeholder. Execution Mode Selection has not yet been performed at the time this report is written. Resolution will happen in the next plan-build phase before the plan is saved. Not blocking review.

### RECOMMENDED — accepted with rationale

**[plan-attack #4] Trailer-block detection regex matches column-0 examples in documentation.**
The schema's `## Provenance Trailers` section (Task 3) contains column-0 example lines inside fenced code blocks. The detection regex `^<!-- (created-at|produced-by) ` would match these if the file were ever stamped. `util-artifact-schema/SKILL.md` is not in the stamping-skill list, so this is not a live defect. Accepted as latent risk; revisit if any future artifact embeds the trailer format verbatim with column-0 unindented examples.

**[plan-attack #5] Harvest clock-collision ordering filesystem-dependent.**
When two artifacts share an identical `created-at` timestamp (1-second granularity), tiebreaker is in-file line number per file, but cross-file ordering falls back to `find` traversal order (filesystem-dependent). Accepted: artifacts are typically created seconds apart by sequential pipeline stages, not concurrently. If determinism becomes important later, add file path as secondary sort key.

**[plan-attack #7] Test threshold for refactor-mode-conditional artifact.**
Task 9 (was 11) test asserts `≥3` stamp invocations expecting summary, audit, and brief. The brief is refactor-mode-only. The SKILL.md text contains stamp invocations at all three artifact-write sites regardless of mode (mode is a runtime branch, not a SKILL.md branch), so the text-level count is consistent. Accepted as written.

**[plan-attack #9] `created-at` collision with manually-written timestamps in non-trailer positions.**
The detection regex anchors on `^<!-- (created-at|produced-by) ` at column 0. Frontmatter timestamps don't match this format. Mid-file HTML comments matching the format would only collide if pre-existing. The brief itself contains a hand-written `<!-- created-at: 2026-04-30T00:00:00Z -->` (line 175 of design brief) — the helper would correctly detect this and not duplicate. Accepted.

**[plan-attack #10] Brief filename uses full sprint name; schema says use words-only prefix.**
The brief at `docs/chester/working/20260430-03-add-artifact-skill-versions/design/20260430-03-add-artifact-skill-versions-design-00.md` uses the full sprint-name prefix; per `util-artifact-schema`, the file prefix should be `add-artifact-skill-versions-design-00.md`. Pre-existing naming inconsistency unrelated to this plan. Note for follow-up; not blocking.

### RECOMMENDED — accepted (smell findings)

**[plan-smell #1] Stamp + harvest in one script.**
The single `chester-trailer-write` script with two subcommands has divergent semantics (stamp = single-file append, harvest = directory walk + dedupe). Smell suggests splitting. Accepted as bundled because: (a) both share the comment-format contract; (b) plugin convention places one helper per concept area (config-read is the precedent); (c) splitting now adds two PATH entries for unclear gain. If the format diverges later, split.

**[plan-smell #2] Eight near-identical test files.**
`tests/test-stamping-{skill}.sh` × 6 (after structural fixes) is duplicative. Accepted because per-task tests give clear pass/fail signal aligned with execute-write's per-task verification. Parameterizing into one test would reduce locality. If maintenance cost becomes real, refactor.

**[plan-smell #3] Hardcoded version assertions.**
Tests embed exact target versions (`v0009`, `v0003`, etc.). Fragile to concurrent skill bumps in parallel sprints. Accepted because (a) plan-build runs once and implementation lands within hours, (b) version conflicts are caught at git merge, (c) "compute current+1" version of the test would itself be brittle if multiple bumps happen between plan-write and implement.

**[plan-smell #4] Helper invocation string duplicated across 6 SKILL.md files.**
Every stamping skill embeds the literal `chester-trailer-write stamp` invocation. Renaming the helper would fan out across 6 SKILL.md + 6 test scripts + the script + the wrapper. Accepted: the helper name is a stable contract; renames should be rare. If a rename becomes desirable, the test fan-out is a finding-and-replace, not a redesign.

**[plan-smell #6] Documentation drift between schema and per-skill citations.**
Schema (Task 3) authoritatively documents the convention; each skill cites it. Tests assert citations exist but don't verify agreement with schema content. Accepted because skills don't restate the convention — they only invoke and cite. The minimal restatement footprint reduces drift surface to near zero.

**[plan-smell #7] Conditional-stamp test gap (was Tasks 8/9).**
Now moot — Tasks 8 and 9 removed.

**[plan-smell #8] Refactor-mode harvest path test gap.**
Addressed during hardening: Task 9 (was 11) test now asserts both `CHESTER_WORKING_DIR` and `docs/refactor` paths are mentioned in the skill text.

## Combined Implementation Risk Level: **Moderate**

Reasoning:
1. The most consequential structural defect (Tasks 8/9 misalignment with skill contracts) was caught and corrected during hardening — the plan no longer asks the implementer to invent missing capabilities.
2. The remaining recommended findings are documented latent risks, not blocking ones. None will cause test failures or implementation surprises during the build.
3. The bash helper script is the load-bearing new contract — its idempotency, dedupe, and no-op semantics are well-tested in Task 1's eight test cases. The harvest subcommand has clean isolation in Task 2 with a separate test file.
4. Documentation-drift exposure is low because skills cite-but-don't-restate the convention. Schema is the single source.
5. The plan touches 6 producer skills uniformly; mechanical wiring is repetitive but each task is small and independently testable.

## Designer Decision Required

Four options:
- **Proceed** — accept moderate risk, hand off to execute-write.
- **Proceed with directed mitigations** — for example, add file-path secondary sort in harvest, or split helper into two scripts.
- **Return to design** — escalate the plan-attack/plan-smell ownership question to design-specify or back to design-large-task.
- **Stop** — abandon the sprint.

Hardening pass complete. Awaiting designer decision.
