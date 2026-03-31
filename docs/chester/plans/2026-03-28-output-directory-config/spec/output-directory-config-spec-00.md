# Specification — Chester Output Directory Management

## Overview

Replace Chester's ad-hoc, per-skill output directory resolution with a centralized, project-scoped configuration established once during first-run setup. Add a gitignored planning directory that mirrors worktree documents so users can always find active sprint docs at a predictable path.

## Architecture

### Two-tier configuration

**Global config** (`~/.claude/chester-config.json`): User-wide defaults — budget guard threshold, any future cross-project settings. Unchanged from current behavior.

**Project config** (`~/.claude/projects/<project-hash>/chester-config.json`): Project-specific settings — work directory, planning directory. Created during first-run detection. Project config values override global config values when both exist.

### Config schema

```json
{
  "work_dir": "docs/chester",
  "planning_dir": "docs/chester-planning",
  "budget_guard": {
    "threshold_percent": 85,
    "enabled": true
  }
}
```

- `work_dir`: Relative path from project root. Where committed artifacts live (design/, spec/, plan/, summary/ subdirectories per sprint). Default: `docs/chester`
- `planning_dir`: Relative path from project root. Gitignored staging area mirroring active sprint docs. Default: `{work_dir}-planning`

### Project hash resolution

Claude Code uses the working directory path with `/` replaced by `-` and leading `-` stripped as the project identifier. For example, `/home/mike/.claude/skills` becomes `-home-mike--claude-skills`. Chester uses this same convention to locate the project-scoped config at `~/.claude/projects/<project-hash>/chester-config.json`.

## Components

### 1. First-run detection (chester-start)

**Trigger:** chester-start checks for `~/.claude/projects/<project-hash>/chester-config.json` after existing housekeeping (debug flag cleanup, jq verification).

**When config is missing:**

1. Announce: "This looks like a new project for Chester. Let's set up your output directories."
2. Present defaults and ask for confirmation or customization:
   ```
   Chester needs two directories for this project:

   Work directory (committed artifacts): docs/chester/
   Planning directory (gitignored, for reading active docs): docs/chester-planning/

   Accept defaults? Or enter custom paths.
   ```
3. User accepts defaults or provides custom paths for either or both.
4. Create the planning directory on disk.
5. Ensure planning directory is in `.gitignore`. If not present, append it. If `.gitignore` doesn't exist, create it with the entry.
6. Write the project config to `~/.claude/projects/<project-hash>/chester-config.json`.
7. Announce: "Chester configured. Artifacts will be written to `{work_dir}`, planning docs at `{planning_dir}`."

**When config exists:** Read silently and proceed. No announcement unless there's a problem (e.g., planning directory missing from .gitignore).

### 2. Config reader (shared utility)

A standardized way for any skill to resolve the output directories. Not a separate file — a documented pattern that each skill follows:

1. Read `~/.claude/projects/<project-hash>/chester-config.json`
2. If missing, fall back to `~/.claude/chester-config.json`
3. If both missing, use hardcoded defaults: `work_dir: "docs/chester"`, `planning_dir: "docs/chester-planning"`
4. Return resolved `work_dir` and `planning_dir`

The project hash is derived from the current working directory using the same convention Claude Code uses.

### 3. Sprint directory creation (chester-figure-out)

**Current behavior:** Asks user to choose between three directory options every session.

**New behavior:**
1. Read config to get `work_dir` and `planning_dir`
2. Construct sprint subdirectory name: `YYYY-MM-DD-word-word-word`
3. Create sprint subdirectory structure under `work_dir` (in worktree):
   ```
   {work_dir}/{sprint-subdir}/
   ├── design/
   ├── spec/
   ├── plan/
   └── summary/
   ```
4. Create matching sprint subdirectory structure under `planning_dir` (in main tree):
   ```
   {planning_dir}/{sprint-subdir}/
   ├── design/
   ├── spec/
   ├── plan/
   └── summary/
   ```
5. Inform user: "Sprint docs at `{planning_dir}/{sprint-subdir}/`"

No directory choice prompt. No confirmation. Just inform.

### 4. Dual-write pattern (all skills that write artifacts)

When a skill writes an artifact to the worktree:
1. Write the file to `{worktree-path}/{work_dir}/{sprint-subdir}/{artifact-type}/{filename}`
2. Copy the same file to `{main-tree}/{planning_dir}/{sprint-subdir}/{artifact-type}/{filename}`

Both writes happen atomically from the skill's perspective — write, then copy. The worktree copy is the authoritative version (committed to the sprint branch). The planning copy is the convenience version (gitignored, for user reading).

**Skills affected:** chester-figure-out, chester-build-spec, chester-build-plan, chester-write-code (deferred items), chester-write-summary, chester-trace-reasoning, chester-doc-sync.

### 5. Planning directory cleanup (chester-finish-plan)

When a sprint resolves (merge, PR, or discard):
1. Remove the sprint's subfolder from the planning directory: `rm -rf {planning_dir}/{sprint-subdir}/`
2. If the planning directory is now empty, leave it in place (it's still configured for future sprints)

Only the resolved sprint's folder is removed. Other active sprint folders are untouched.

### 6. Deferred items path fix (chester-write-code)

**Current behavior:** Hardcoded to `docs/chester/deferred/`.

**New behavior:** Read `work_dir` from config. Write deferred items to `{work_dir}/{sprint-subdir}/deferred/` in the worktree, mirror to `{planning_dir}/{sprint-subdir}/deferred/`.

## Data Flow

```
chester-start
  ├── First run? → prompt user → write project config
  └── Config exists? → read silently

chester-figure-out
  ├── Read config → get work_dir, planning_dir
  ├── Create sprint subdirs in worktree (work_dir)
  ├── Create sprint subdirs in main tree (planning_dir)
  └── Write design artifacts → dual-write to both

chester-build-spec
  ├── Read config → get work_dir, planning_dir
  └── Write spec → dual-write to both

chester-build-plan
  ├── Read config → get work_dir, planning_dir
  └── Write plan → dual-write to both

chester-write-code
  ├── Read config → get work_dir, planning_dir
  └── Write deferred items → dual-write to both

chester-write-summary / chester-trace-reasoning / chester-doc-sync
  ├── Read config → get work_dir, planning_dir
  └── Write summary/audit/report → dual-write to both

chester-finish-plan
  ├── Read config → get planning_dir
  └── Remove sprint subfolder from planning_dir
```

## Error Handling

- **Config read failure:** Fall back to defaults silently. No error shown unless writes fail.
- **Planning directory missing:** Recreate it. Log a note.
- **Planning directory not in .gitignore:** Add it. Warn user.
- **Dual-write copy fails:** Warn user that planning copy is stale, continue with worktree write (authoritative copy must not be blocked).
- **Sprint subfolder already exists in planning_dir:** Reuse it — this handles session resumption for an in-progress sprint.

## Testing Strategy

This is a skill-level change (SKILL.md modifications) with one new config file and one new bash pattern. Testing is manual verification:

1. **First-run flow:** Delete project config, start session, verify prompt appears, verify config written, verify planning directory created, verify .gitignore updated
2. **Existing config flow:** Start session with config present, verify no prompt, verify config read correctly
3. **Sprint creation:** Run figure-out, verify both directory trees created, verify dual-write works
4. **Planning directory access:** Verify docs readable at planning path during active sprint
5. **Finish cleanup:** Run finish-plan, verify sprint subfolder removed from planning, verify other sprints untouched
6. **Concurrent sprints:** Two sessions with different sprint names, verify no collision in planning directory

## Constraints

- Planning directory must always be gitignored
- Work directory path is relative to project root
- Config follows Claude's project-scoped pattern
- Sprint subdirectory naming: `YYYY-MM-DD-word-word-word`
- Dual-write never blocks on planning copy failure — worktree is authoritative

## Non-Goals

- Migration of existing sprint directories to new config pattern
- GUI or interactive config editor
- Automatic detection of stale planning copies
- Cross-project config synchronization
- Changing the sprint naming convention
