# Adversarial Review: Multi-Project Config Plan

**Plan reviewed:** `docs/chester/plans/2026-03-29-multi-project-config/plan/multi-project-config-plan-00.md`

**Codebase state at review time:** 2026-04-04, branch `main`, commit `c13279c`

---

## Structural Integrity

### FINDING: Plan references wrong script path throughout (HIGH)

The plan consistently references `chester-hooks/chester-config-read.sh` (Task 1 line 28, Task 2 file header, Task 8 smoke test). This path does not exist. The actual script is at `chester-util-config/chester-config-read.sh`.

**Evidence:** `chester-hooks/` directory does not exist at all in the repo. The real file is `/home/mike/.claude/skills/chester-util-config/chester-config-read.sh`. The existing test file (`tests/test-config-read-new.sh` line 6) already correctly points to `chester-util-config/`.

**Impact:** Task 2 would create or overwrite a file in a nonexistent directory. The smoke test in Task 8 would fail. However, Task 1's test file uses the correct path, so the tests themselves would work — but the plan text and Task 2's "modify" instruction target the wrong location.

**Verified:** FALSE — the path `chester-hooks/chester-config-read.sh` does not exist.

### FINDING: Plan references `chester-start/SKILL.md` — file does not exist (HIGH)

Task 4 targets `chester-start/SKILL.md` lines 73-108. The directory `chester-start/` does not exist. The actual skill is `chester-setup-start/SKILL.md`.

**Evidence:** `chester-start/` is not in the repo directory listing. The skill directory is `/home/mike/.claude/skills/chester-setup-start/`.

**Impact:** Task 4 cannot be executed as written. The implementer would need to identify the correct file.

**Verified:** FALSE — `chester-start/SKILL.md` does not exist.

### FINDING: Five skills referenced in Task 5 do not exist (HIGH)

Task 5 claims to update budget guard paths in:
- `chester-figure-out/SKILL.md`
- `chester-build-spec/SKILL.md`
- `chester-build-plan/SKILL.md`
- `chester-write-code/SKILL.md`
- `chester-finish-plan/SKILL.md`

None of these files exist. The actual skill directories with budget guard sections are:
- `chester-design-figure-out/SKILL.md`
- `chester-design-specify/SKILL.md`
- `chester-plan-build/SKILL.md`
- `chester-execute-write/SKILL.md`
- `chester-finish/SKILL.md`
- `chester-design-architect/SKILL.md`

**Evidence:** Glob for each of the five plan-specified paths returned no results. Grep for `Budget Guard` across SKILL.md files found the six actual files listed above.

**Impact:** Task 5 is entirely misdirected. Additionally, the plan names only 5 skills but there are actually 6 skills with budget guard sections (it misses `chester-design-architect/SKILL.md`).

**Verified:** FALSE — all five referenced paths are wrong.

### FINDING: Task 5 replaces a string that does not exist in the codebase (MEDIUM)

Task 5 instructs replacing `cat ~/.claude/.chester/.settings.chester.json` with `cat ~/.claude/settings.chester.json`. Grep for the old path pattern (`\.claude/\.chester/\.settings`) across all `chester-*` directories returns zero matches. The budget guard lines in the actual skill files already use the new path `~/.claude/settings.chester.json`.

**Evidence:** Grep across `chester-*/**` for the old path pattern returned no files.

**Impact:** This task has already been completed in a prior session. The plan is stale — it describes work that was already done.

### FINDING: `visual-companion.md` and its reference already removed (LOW)

Task 7 deletes `chester-figure-out/visual-companion.md` and removes a reference in `chester-figure-out/SKILL.md`. Neither file exists — the directory is actually `chester-design-figure-out/`, and grep for "visual-companion" in that directory returns no matches.

**Evidence:** Glob for `chester-figure-out/visual-companion.md` returned no results. Grep for `visual-companion` in `chester-design-figure-out/` returned no matches.

**Impact:** Task 7 is a no-op. Already completed.

### FINDING: `tests/test-config-migration.sh` already deleted (LOW)

Task 3 deletes `tests/test-config-migration.sh`. This file does not exist.

**Evidence:** Glob for the file returned no results.

**Impact:** Task 3 is a no-op. Already completed.

---

## Execution Risk

### FINDING: Tasks 1 and 2 are already implemented (MEDIUM)

The existing `chester-util-config/chester-config-read.sh` already contains the exact code the plan proposes in Task 2. The existing `tests/test-config-read-new.sh` already contains the exact test code from Task 1. Both match the plan's proposed content character-for-character.

**Evidence:** Diff between plan's proposed code and actual file content shows they are identical.

**Impact:** Tasks 1 and 2 are no-ops. The plan describes work that was already completed.

### FINDING: Task 4 is already implemented (MEDIUM)

`chester-setup-start/SKILL.md` lines 60-86 already contain the exact first-run setup flow the plan proposes — using `.claude/settings.chester.local.json` for project config and `~/.claude/settings.chester.json` for user config, with no references to `.chester/` directory.

**Evidence:** Reading `chester-setup-start/SKILL.md` shows the new config paths are already in place.

**Impact:** Task 4 is a no-op.

### FINDING: Task 6 test updates already applied (MEDIUM)

`tests/test-chester-config.sh` line 4 already reads `CONFIG="$HOME/.claude/settings.chester.json"` (the new path). `tests/test-integration.sh` lines 34-35 already use the new path. Line 43 already says `settings.chester.json missing`.

**Evidence:** Reading both test files confirms they match the plan's "after" state.

**Impact:** Task 6 is a no-op.

---

## Assumptions

### Verified TRUE: Config resolution script uses `chester-util-config/` path
The config script exists at `chester-util-config/chester-config-read.sh` and the test correctly references this path. The plan's internal references to `chester-hooks/` are wrong, but the actual codebase is consistent.

### Verified TRUE: Budget guard paths already updated
All six skills with budget guard sections use `~/.claude/settings.chester.json`, the target path.

### Verified TRUE: Two-file config architecture is in place
Project config at `{root}/.claude/settings.chester.local.json`, user config at `~/.claude/settings.chester.json`, with directory paths from project config only.

---

## Contract and Migration Completeness

No issues found. The migration has already been completed.

---

## Concurrency and Thread Safety

Not applicable — bash scripts, no concurrent access patterns.

---

## Risk Assessment

This plan is entirely stale. Every task it describes has already been implemented in the codebase. The plan also uses wrong directory names throughout (e.g., `chester-hooks/` instead of `chester-util-config/`, `chester-start/` instead of `chester-setup-start/`, `chester-figure-out/` instead of `chester-design-figure-out/`), which suggests it was written against an older or planned directory structure that has since been renamed. Executing this plan would either be a series of no-ops or, if followed literally, could create duplicate files in nonexistent directories. There is nothing to implement — the work is done.
