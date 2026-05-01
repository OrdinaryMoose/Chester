# Reasoning Audit: Artifact Skill-Version Provenance

**Date:** 2026-05-01
**Session:** `00`
**Plan:** `add-artifact-skill-versions-plan-00.md`

## Executive Summary

This session designed and shipped a uniform artifact-provenance trailer convention for Chester, then implemented it across six stamping skills plus the schema docs. The most consequential decision was the mid-hardening correction of brief D10: plan-attack and plan-smell were originally listed as stamping skills under an UNTESTED assumption, plan-attack proved the assumption false (both skills' SKILL.md files explicitly state "this skill does not write files"), the plan was restructured 12 tasks → 10, and threat-report chain ownership transferred to plan-build (the entity that actually writes the file). The implementation stayed on-plan after the correction; all 10 tasks landed clean with mixed-mode execution (subagent for novel logic, inline for mechanical SKILL.md edits) per a parent-orchestrated extension of the single-mode contract.

## Plan Development

The plan grew out of a Q&A conversation about how Chester versions itself. The user surveyed options for per-artifact provenance, picked HTML-comment trailers with append-only multi-skill semantics, then narrowed format choices through several rounds (no per-skill timestamp, single artifact-level `created-at`, last-N-lines detection, file-path tiebreak, etc.). The brief was written from this conversation as a post-design snapshot. plan-build was invoked directly off the brief (skipping design-specify) — the plan-review loop and hardening pass caught and corrected the structural error before execute-write started.

## Decision Log

### Brief D10 plan-attack/plan-smell stamping correction

**Context:** Brief D10 listed plan-attack and plan-smell as skills that stamp threat reports and smell reports. The Assumptions section flagged this UNTESTED.

**Information used:**
- `skills/plan-attack/SKILL.md:133` — "This skill does not write files. All output is inline in the conversation."
- `skills/plan-smell/SKILL.md:118` — same statement
- `skills/plan-build/SKILL.md:259` — `plan-build` itself writes the combined threat report during the Plan Hardening phase

**Alternatives considered:**
- `Add file-writing to plan-attack and plan-smell` — significant scope expansion not in brief
- `Silently skip the stamps and proceed` — would fail the plan's tests; would leave the brief and plan internally inconsistent

**Decision:** Reclassify plan-attack and plan-smell as non-stamping skills. plan-build owns the threat-report chain because plan-build is the entity that writes the file. Remove plan tasks 8 (plan-attack) and 9 (plan-smell). Renumber remaining tasks 10 → 8, 11 → 9, 12 → 10. Update brief D10 with explicit correction note.

**Rationale:** The brief's own Assumptions section instructed plan-build to verify the skill list by walking `skills/`. The verification disproved the assumption. Aligning the plan with the actual skill contracts is correct; expanding plan-attack/plan-smell scope is not.

**Confidence:** High — both skills' SKILL.md files have explicit "does not write files" boundary statements at fixed line numbers.

---

### Mixed execution mode via parent orchestration

**Context:** The 10-task plan mixes complex tasks (bash logic, sort/dedupe, harvest+section integration) with mechanical tasks (grep+insert+bump in SKILL.md). execute-write's contract reads one `Execution mode:` field per plan; subagent-everything wastes dispatch overhead on mechanical tasks while inline-everything loses review independence on complex logic.

**Information used:**
- execute-write Section 1.4 routing rule: header field selects Section 2 vs Section 3
- The plan's per-task complexity profile: tasks 1, 2, 9 carry novel decisions; tasks 3-8, 10 are pattern-replicating

**Alternatives considered:**
- `All subagent (heuristic recommendation)` — safe default but extra dispatch cost on mechanical tasks
- `All inline` — fastest but loses review independence on novel-logic tasks
- `Split into two plans (one per mode)` — doubles handoff overhead, scope creep
- `Extend execute-write to honor per-task mode field` — modifies execute-write's contract; this-sprint scope creep
- `Parent-orchestrated mixed mode (chosen)` — plan header set to safe-default `subagent`; per-task `Execution mode:` field documents intent; parent agent dispatches subagent for tasks 1/2/9 and runs inline for 3-8/10

**Decision:** Add per-task `Execution mode:` field to each task block. Plan header reads `subagent` (safe-default fallback). Parent agent honors per-task field at execute time.

**Rationale:** Keeps execute-write's contract small (single field read, no plan-structure parsing) while letting the orchestrating agent route per task. The complexity asymmetry between tasks justified the extra coordination cost.

**Confidence:** High — user explicitly chose this option among (a)/(b)/(c) alternatives.

---

### Mitigation selection: (a), (d), (f) accepted, (b)/(c)/(e) skipped

**Context:** Plan hardening surfaced 6 categories of recommended changes beyond the required structural fix. User asked "what am I deciding and why; recommendation?"

**Information used:**
- plan-attack findings: deterministic harvest order, robust trailer detection
- plan-smell findings: helper bundling, test parameterization, hardcoded versions
- Pre-existing inconsistency: brief filename used full sprint-name prefix instead of words-only

**Alternatives considered:**
- `(a) Deterministic harvest order — file-path secondary sort` — 1-line fix, real bug fix
- `(b) Split helper into two scripts` — smell concern only; precedent (chester-config-read) supports bundling
- `(c) Parameterize per-skill tests` — premature DRY; per-task locality is the value
- `(d) Robust trailer detection — last-N-lines anchor` — 5-line fix, eliminates a class of false positives
- `(e) Compute-relative version assertion` — fragility theoretical; landing happens within hours
- `(f) Brief filename rename` — 30-second fix, schema compliance

**Decision:** Accept (a), (d), (f). Skip (b), (c), (e).

**Rationale:** (a), (d), (f) close real gaps cheaply. (b), (c), (e) are smell-driven theoretical concerns where current state is fine. Provenance ledgers benefit from determinism; defensive trailer detection prevents future surprise; schema compliance is the whole point of util-artifact-schema.

**Confidence:** High — user reviewed each option and confirmed.

---

### Last-N-lines anchor for trailer-block detection

**Context:** Original detection regex matched any column-0 `<!-- (created-at|produced-by)` line anywhere in the file. The schema docs (Task 3) contain example trailer lines inside fenced code blocks at column 0 — same pattern as a real trailer.

**Information used:**
- Task 3 inserts example trailer block in `## Provenance Trailers` section as a markdown fenced code block
- Real trailer block always lives at the bottom of the file
- Files with stamping skills can grow but trailers stay at the tail

**Alternatives considered:**
- `Match anywhere in file (original)` — false-positive risk on docs and self-referential artifacts
- `Anchor to a specific section header` — fragile to markdown structure changes
- `Last 20 lines (chosen)` — bounded false-positive surface; covers any reasonable trailer-block size; cheap

**Decision:** `tail -n 20 "$path" | grep -Eq '^<!-- (created-at|produced-by) '`.

**Rationale:** Trailer blocks are at most ~10 lines even for heavily-stamped artifacts (multiple skills × few entries). 20 lines gives 2x headroom. False-positive surface bounded to the last 20 lines, which never contains documentation examples in normal artifacts.

**Confidence:** High — directly tested in `tests/test-trailer-write.sh` case 9.

---

### Helper bundled into one script with subcommands

**Context:** The helper has two subcommands (`stamp`, `harvest`) with diverging semantics. Smell review suggested splitting into two PATH binaries.

**Information used:**
- `bin/chester-config-read` precedent: single PATH wrapper for one operation
- Both subcommands operate on the trailer-format contract — shared subject, distinct behavior
- Plugin loads scripts from `bin/`; adding a binary doubles wrapper boilerplate

**Alternatives considered:**
- `Split into two scripts (chester-trailer-stamp, chester-trailer-harvest)` — cleaner single-responsibility, two PATH entries
- `Bundle with subcommand dispatcher (chosen)` — one entry point, internal `case` dispatch

**Decision:** Single `chester-trailer-write` with `stamp|harvest` subcommands.

**Rationale:** Bundling is consistent with the existing `chester-config-read` pattern. Splitting now adds two PATH entries for theoretical gain. If `stamp` and `harvest` ever diverge enough to warrant separate maintenance, split then.

**Confidence:** High — user confirmed.

---

### STAMP-BLOCK markers preserve Phase 5 regression guard

**Context:** `tests/test-ac-6-2-untouched-phases.sh` is a regression guard from a prior sprint that compares Phase 5 of `design-large-task/SKILL.md` against `main`. Task 4 of this sprint intentionally adds stamp prose to Phase 5 Step 5, breaking the test.

**Information used:**
- Existing precedent: HARD-GATE markers + `strip_hardgate` awk in the same test handle a previous sprint's intentional patch
- `git diff` showed the failing diff was confined to the new stamp prose

**Alternatives considered:**
- `Delete the regression test` — loses the guard for future sprints
- `Move stamp prose out of Phase 5` — architecturally wrong; Phase 5 IS the artifact-write site
- `Add STAMP-BLOCK markers + extend strip awk (chosen)` — mirrors HARD-GATE pattern, preserves guard, allows the intentional patch

**Decision:** Wrap stamp prose in `<!-- <STAMP-BLOCK> -->` / `<!-- </STAMP-BLOCK> -->` markers. Extend `strip_hardgate` awk to drop both HARD-GATE and STAMP-BLOCK regions. Position markers immediately after the step-5 prose (no leading blank line) so the strip leaves no orphan whitespace.

**Rationale:** Pattern was already established in the test; extending it costs one line of awk plus two HTML comment markers. Preserves the regression guard's value for future sprints.

**Confidence:** High — verified by re-running the full suite.

---

### Filter pre-existing decision-record MCP failures from verify-complete

**Context:** Full test suite reported 6 failures. One was caused by this sprint (test-ac-6-2 — fixed). The other 5 were `ERR_MODULE_NOT_FOUND` crashes in decision-record MCP tests. Confirmed pre-existing by checking out `main`'s tests and running.

**Alternatives considered:**
- `(a) Skip Step 1 strictness, proceed` — quietly accept failures
- `(b) Stop and fix decision-record test infrastructure` — separate scope, unknown cost
- `(c) Filter — re-run excluding the broken tests (chosen)` — explicit filter; document as pre-existing

**Decision:** Filter the 5 broken decision-record tests from the verify-complete suite. Document in deferred items. File a bug report.

**Rationale:** The failures crash before any assertion runs (Node module resolution error), so they couldn't have caught any sprint regression even hypothetically. Verify-complete's intent is "did THIS sprint break anything"; pre-existing infrastructure breakage doesn't engage that question. Fixing it is its own debugging task.

**Confidence:** High — `main` checkout reproduces the failures identically.

---

### Per-task test files retained over parameterization

**Context:** Tasks 4-8 each create a near-identical test file (`tests/test-stamping-{skill}.sh`). Smell review flagged this as 6-way duplication.

**Information used:**
- execute-write's per-task verification gates work better with per-task test files (clear pass/fail signal per task)
- A parameterized test would require a manifest of `(skill, expected_version)` pairs maintained alongside the test driver

**Alternatives considered:**
- `Single parameterized test driver` — DRY, but loses per-task locality and adds a manifest to maintain
- `One test per skill (chosen)` — tracks the per-task contract structurally; refactor only when maintenance pain materializes

**Decision:** Keep separate test files.

**Rationale:** Per-task locality matches execute-write's per-task verification model. Refactoring 6 grep-based test files into one parameterized one is premature DRY — the duplication is mechanical and cheap to update if the contract changes.

**Confidence:** Medium — judgment call between competing principles; either choice is defensible.

<!-- created-at: 2026-05-01T09:42:56Z -->
<!-- produced-by finish-write-records@v0002 -->
