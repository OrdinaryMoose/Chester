## Adversarial Review: Multi-Project Config Implementation Plan

**Implementation Risk: High**

Agents: Structural Integrity, Execution Risk, Assumptions & Edge Cases, Contract & Migration, Concurrency & Thread Safety.

### Findings

- **Critical** | `plan Tasks 1-7 (entire plan)` | Plan is stale -- the codebase has already been restructured. The plan references directory names (`chester-hooks/`, `chester-start/`, `chester-figure-out/`, `chester-build-spec/`, `chester-build-plan/`, `chester-write-code/`, `chester-finish-plan/`) that were renamed in a prior sprint (2026-04-01-rename-skill-dirs). The actual directories are `chester-util-config/`, `chester-setup-start/`, `chester-design-figure-out/`, `chester-design-specify/`, `chester-plan-build/`, `chester-execute-write/`, `chester-finish/`. Every task in the plan targets file paths that do not exist. | Evidence: `chester-hooks/` does not exist; `chester-util-config/chester-config-read.sh` exists at the renamed path; rename documented in `docs/chester/plans/2026-04-01-rename-skill-dirs/plan/rename-skill-dirs-plan-01.md:38`. No plan-referenced directories found via glob. | source: Structural Integrity, Execution Risk
- **Critical** | `plan Tasks 1-2, chester-util-config/chester-config-read.sh` | The config resolution rewrite (Task 2) and its tests (Task 1) have already been implemented. The current `chester-util-config/chester-config-read.sh` matches the plan's target code exactly. The current `tests/test-config-read-new.sh` matches the plan's target test code exactly. Executing these tasks would either no-op or fail due to wrong paths. | Evidence: `chester-util-config/chester-config-read.sh:1-43` matches plan Task 2 output; `tests/test-config-read-new.sh:1-149` matches plan Task 1 output; `tests/test-config-read-new.sh:6` correctly references `chester-util-config/chester-config-read.sh` (not the plan's `chester-hooks/` path) | source: Structural Integrity, Execution Risk
- **Critical** | `plan Task 4, chester-setup-start/SKILL.md:60-86` | Plan modifies `chester-start/SKILL.md` which does not exist. The actual file `chester-setup-start/SKILL.md` already contains the updated first-run setup code at lines 60-86, matching the plan's target output. | Evidence: `chester-setup-start/SKILL.md:69-85` already writes to `.claude/settings.chester.local.json` and `~/.claude/settings.chester.json` | source: Structural Integrity, Execution Risk
- **Critical** | `plan Task 3, tests/test-config-migration.sh` | Plan deletes `tests/test-config-migration.sh` but this file does not exist in the codebase. | Evidence: glob for `tests/test-config-migration.sh` returns no results; `tests/` contains 7 files, none named `test-config-migration.sh` | source: Structural Integrity
- **Critical** | `plan Task 7, chester-figure-out/visual-companion.md` | Plan deletes `chester-figure-out/visual-companion.md` but neither the directory nor the file exists. The renamed directory `chester-design-figure-out/` contains only `scripts/` and `SKILL.md`. No reference to `visual-companion` exists in any skill file. | Evidence: glob returns no results for `chester-figure-out/visual-companion.md`; grep for `visual-companion` in `chester-*/SKILL.md` returns no matches | source: Structural Integrity
- **Serious** | `plan Task 5` | Plan lists 5 skills needing budget guard path updates but names them by old directories. The actual codebase has 6 skills with budget guards (plan misses `chester-design-specify` and `chester-design-architect`). All 6 are already migrated to the new path `~/.claude/settings.chester.json`. | Evidence: grep for `budget_guard.threshold_percent` across `chester-*/SKILL.md` returns 6 files: `chester-design-figure-out/SKILL.md:13`, `chester-design-specify/SKILL.md:13`, `chester-plan-build/SKILL.md:15`, `chester-execute-write/SKILL.md:15`, `chester-finish/SKILL.md:15`, `chester-design-architect/SKILL.md:13` -- all already on new path | source: Contract & Migration, Execution Risk
- **Serious** | `plan Task 2, chester-util-config/chester-config-read.sh:22-23,42-43` | Config values from JSON are interpolated into shell commands without sanitization. If a project config contains a `working_dir` with single quotes or shell metacharacters, the jq invocation at lines 22-23 or the echo at lines 42-43 could break or execute unintended commands. The plan does not address input validation. | Evidence: `chester-util-config/chester-config-read.sh:22` -- `jq -r '.working_dir // "'"$DEFAULT_WORK_DIR"'"'` breaks out of single quotes; line 42 -- `echo "export CHESTER_WORK_DIR='$CHESTER_WORK_DIR'"` would break on values containing `'` | source: Assumptions & Edge Cases
- **Minor** | `tests/test-chester-config.sh:7` | Test error message says "FAIL: .settings.chester.json does not exist" (with leading dot) but the actual filename is `settings.chester.json` (no leading dot). Plan Task 6 updates line 4 but does not fix this inconsistent error message at line 7. | Evidence: `tests/test-chester-config.sh:7` | source: Contract & Migration

### Assumptions

| # | Assumption | Status | Evidence |
|---|------------|--------|----------|
| 1 | Directory `chester-hooks/` exists | FALSE | Renamed to `chester-util-config/` in sprint 2026-04-01-rename-skill-dirs |
| 2 | Directory `chester-start/` exists | FALSE | Renamed to `chester-setup-start/` |
| 3 | Directories `chester-figure-out/`, `chester-build-spec/`, `chester-build-plan/`, `chester-write-code/`, `chester-finish-plan/` exist | FALSE | All renamed with `chester-design-`/`chester-plan-`/`chester-execute-`/`chester-finish` prefixes |
| 4 | File `tests/test-config-migration.sh` exists | FALSE | File not present in `tests/` |
| 5 | File `chester-figure-out/visual-companion.md` exists | FALSE | File and directory do not exist |
| 6 | Budget guard paths still use old `~/.claude/.chester/.settings.chester.json` | FALSE | All 6 skills already migrated to `~/.claude/settings.chester.json` |
| 7 | Config resolution script still uses old paths/logic | FALSE | `chester-util-config/chester-config-read.sh` already contains the rewritten code |
| 8 | `jq` is available on the system | TRUE (with fallback) | Script checks `command -v jq` and falls back to defaults |
| 9 | Config values are safe for shell interpolation | UNVERIFIABLE | No validation exists on user-provided JSON values |

### Risk Rationale

- The plan targets a codebase state that no longer exists. Every file path, directory name, and "before" state the plan assumes has already been changed by the 2026-04-01 rename sprint and by prior implementation of this plan's own changes. These are not isolated path typos -- they are systemic, affecting all 8 tasks.
- The plan's changes have already been applied to the codebase. The config script, tests, skill files, and first-run setup all match the plan's intended "after" state. Executing this plan would produce errors (file-not-found) or no-ops, not the intended restructuring.
- The only net-new finding with current relevance is the shell injection risk in config value handling (lines 22-23, 42-43 of the config script), which exists in the already-implemented code and was not addressed by the plan.
