# Multi-Project Config — Specification

## Overview

Restructure Chester's configuration system so that directory paths are strictly project-local and config file locations follow Claude Code conventions. Remove all migration code from the previous config layout.

## Scope

### In Scope

1. Move config file locations to match Claude Code conventions
2. Enforce project-only scoping for directory path keys
3. Update config resolution script
4. Update first-run setup in chester-start
5. Remove migration code and migration tests
6. Update existing tests for new paths

### Out of Scope

- Adding new config keys
- Changing default directory values
- Modifying how skills consume `CHESTER_WORK_DIR` / `CHESTER_PLANS_DIR` (the exported interface is unchanged)

## Architecture

### Config File Locations

**Before:**

| Level | Path |
|-------|------|
| User | `~/.claude/.chester/.settings.chester.json` |
| Project | `{project-root}/.chester/.settings.chester.local.json` |

**After:**

| Level | Path |
|-------|------|
| User | `~/.claude/settings.chester.json` |
| Project | `{project-root}/.claude/settings.chester.local.json` |

Both follow the Claude Code naming pattern: `settings.json` / `settings.local.json`, with a `.chester` infix to distinguish Chester config from Claude's own files.

### Key Scoping Rules

| Key | Source | Rationale |
|-----|--------|-----------|
| `working_dir` | Project config only | Each project has its own working directory |
| `plans_dir` | Project config only | Each project has its own plans directory |
| All other keys | Merged (project overrides user) | Cross-project defaults with per-project override |

### Config Resolution Algorithm

`chester-config-read.sh` exports three variables: `CHESTER_WORK_DIR`, `CHESTER_PLANS_DIR`, `CHESTER_CONFIG_PATH`.

Resolution steps:

1. Determine `PROJECT_ROOT` via `git rev-parse --show-toplevel` (fallback: `pwd`)
2. Set paths: `PROJECT_CONFIG="$PROJECT_ROOT/.claude/settings.chester.local.json"`, `USER_CONFIG="$HOME/.claude/settings.chester.json"`
3. If `jq` is unavailable: export defaults, set `CHESTER_CONFIG_PATH=none`, warn on stderr
4. If project config exists:
   - Read `working_dir` and `plans_dir` from project config only (fall back to defaults)
   - For all other exported values (future): deep merge user + project, project wins
   - Set `CHESTER_CONFIG_PATH` to project config path
5. If only user config exists:
   - Use default directory paths (user config is never a source for directories)
   - Set `CHESTER_CONFIG_PATH` to user config path
6. If neither exists:
   - Use defaults for everything
   - Set `CHESTER_CONFIG_PATH=none`

### Exported Interface

Unchanged — all downstream skills continue to use:
```bash
eval "$(~/.claude/skills/chester-hooks/chester-config-read.sh)"
# $CHESTER_WORK_DIR, $CHESTER_PLANS_DIR, $CHESTER_CONFIG_PATH
```

No skill changes required.

## Components

### 1. `chester-hooks/chester-config-read.sh`

**Remove:**
- Old config location constants (lines 18–21)
- `migrate_user_config()` function (lines 24–33)
- `migrate_project_config()` function (lines 35–54)
- Migration invocations (lines 56–57)

**Update:**
- Config path constants to new locations:
  - `PROJECT_CONFIG="$PROJECT_ROOT/.claude/settings.chester.local.json"`
  - `USER_CONFIG="$HOME/.claude/settings.chester.json"`
- Resolution logic: read directory paths only from project config, not from merged result or user config

**Preserve:**
- Defaults (`DEFAULT_WORK_DIR`, `DEFAULT_PLANS_DIR`)
- `PROJECT_ROOT` detection
- `jq` availability check and fallback
- Export format (three `echo export` lines)

### 2. `chester-start/SKILL.md` — Session Housekeeping

**Update the first-run setup block** (currently lines 30–97):

When `CHESTER_CONFIG_PATH` is `none`:

1. Announce: "This looks like a new project for Chester. Let's set up your output directories."
2. Present defaults for both directories:
   ```
   Chester needs two directories for this project:

   Plans directory (committed archive): docs/chester/plans/
   Working directory (gitignored, for active docs): docs/chester/working/

   Accept defaults? Or enter custom paths.
   ```
3. User accepts or provides custom paths
4. Create both directories: `mkdir -p`
5. Ensure working directory is in `.gitignore`:
   ```bash
   if ! git check-ignore -q "$CHESTER_WORK_DIR" 2>/dev/null; then
     echo "$CHESTER_WORK_DIR/" >> .gitignore
     git add .gitignore
     git commit -m "chore: add chester working directory to .gitignore"
   fi
   ```
6. Write project config to `{project-root}/.claude/settings.chester.local.json`:
   ```json
   {
     "working_dir": "<chosen working dir>",
     "plans_dir": "<chosen plans dir>"
   }
   ```
7. Create user config at `~/.claude/settings.chester.json` if it doesn't exist (empty `{}`)
8. Announce: "Chester configured. Plans archived to `{plans_dir}`, working docs at `{working_dir}`."

When `CHESTER_CONFIG_PATH` is not `none`: read silently, proceed. Fix problems if detected (e.g., working dir not gitignored).

**Remove:** All references to `.chester/` directory at project root. No `.chester/` gitignore entry needed — config now lives in `.claude/` which Claude Code already manages.

### 3. `tests/test-config-migration.sh`

**Delete entirely.** This file tests migration behavior that no longer exists.

### 4. `tests/test-config-read-new.sh`

**Update:**
- Change config paths in test setup to new locations
- Ensure directory path tests read only from project config
- Add test: directory paths in user config are ignored (only project config is used for dirs)
- Verify that non-directory keys still merge from both layers

## Error Handling

- `jq` unavailable: use hardcoded defaults, warn on stderr (existing behavior, preserved)
- No git repo: `PROJECT_ROOT` falls back to `pwd` (existing behavior, preserved)
- Missing `.claude/` directory at project root: `mkdir -p` during first-run handles this

## Testing Strategy

1. `bash tests/test-config-read-new.sh` — config resolution with new paths
2. `bash tests/test-chester-config.sh` — schema validation (should still pass)
3. Manual verification: run `eval "$(chester-config-read.sh)"` in a project without config, confirm `CHESTER_CONFIG_PATH=none` and defaults

## Intentional Breaking Change

Directory paths in user-level config are no longer read. Users who previously had `working_dir` or `plans_dir` in their user config (without a project config) will now get defaults instead. This is intentional — directory paths are project-specific and should not leak across projects via user config.

## Constraints

- The exported variable interface (`CHESTER_WORK_DIR`, `CHESTER_PLANS_DIR`, `CHESTER_CONFIG_PATH`) must not change — all 17 skills depend on it
- No new migration code — old `.chester/` directories are left in place, not auto-cleaned
- `jq` remains an optional dependency with graceful fallback

## Non-Goals

- Migrating existing configs from old locations to new locations
- Adding new config keys or capabilities
- Changing default directory values
- Modifying any skill other than chester-start