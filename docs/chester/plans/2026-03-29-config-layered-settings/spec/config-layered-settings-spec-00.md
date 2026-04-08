# Spec: Layered Chester Configuration

## 1. Problem

Chester's configuration is currently stored in Claude Code's internal project infrastructure (`~/.claude/projects/-{hash}/chester-config.json` and `~/.claude/chester-config.json`). This makes config opaque, non-discoverable, and tightly coupled to Claude Code's directory conventions. The working directory (`docs/chester-planning/`) and archive directory (`docs/chester/`) use confusing names and the relationship between them is unclear.

## 2. Goals

- Establish a layered config system: user-level defaults + project-level overrides with deep merge
- Create dedicated `.chester/` config directories at both user and project level
- Rename and clarify the two artifact directories: `working/` (gitignored drafts) and `plans/` (committed archive)
- Support multiple concurrent sprints in the working directory
- Auto-migrate from the old config locations
- Update all skills that reference config or artifact directories

## 3. Non-Goals

- Team/shared configuration (`.chester/` is gitignored, not committed)
- New config schema fields beyond `working_dir`, `plans_dir`, and `budget_guard`
- Changes to sprint internal structure (`design/`, `spec/`, `plan/`, `summary/`)
- Changes to the dual-write pattern mechanics (only the paths change)

## 4. Config Architecture

### 4.1 File Locations

| File | Location | Purpose |
|------|----------|---------|
| User-level settings | `~/.claude/.chester/.settings.chester.json` | Global defaults for all projects |
| Project-level settings | `{project-root}/.chester/.settings.chester.local.json` | Per-project overrides |

### 4.2 Schema

Both files share the same schema. Project-level values deep-merge over user-level.

```json
{
  "working_dir": "docs/chester/working",
  "plans_dir": "docs/chester/plans",
  "budget_guard": {
    "threshold_percent": 85,
    "enabled": true
  }
}
```

- `working_dir`: relative path from project root to the gitignored drafts directory
- `plans_dir`: relative path from project root to the committed archive directory
- `budget_guard`: token budget guard settings (user-level only in practice)

### 4.3 Deep Merge Rules

- Scalar values: project replaces user
- Objects: project keys merge into user object (one level deep is sufficient for current schema)
- Missing keys in project config: user-level value is used
- Neither file exists: hardcoded defaults (`docs/chester/working`, `docs/chester/plans`)

### 4.4 Gitignore

- `{project-root}/.chester/` is added to `.gitignore`
- `{working_dir}/` is added to `.gitignore` (e.g., `docs/chester/working/`)
- `{plans_dir}/` is NOT gitignored — it is the committed archive

## 5. Directory Model

### 5.1 Three Locations

```
{project-root}/
├── .chester/                              ← gitignored, config only
│   └── .settings.chester.local.json
├── docs/chester/
│   ├── working/                           ← gitignored, active drafts
│   │   ├── config-layered-settings/       ← sprint A (active)
│   │   │   ├── design/
│   │   │   ├── spec/
│   │   │   ├── plan/
│   │   │   └── summary/
│   │   └── another-sprint/                ← sprint B (active)
│   └── plans/                             ← committed, permanent archive
│       └── config-layered-settings/       ← sprint C (completed)
│           ├── design/
│           ├── spec/
│           ├── plan/
│           └── summary/

~/.claude/.chester/                        ← user-level config
└── .settings.chester.json
```

### 5.2 Dual-Write Pattern

During active development, each skill writes artifacts to two locations:

1. **Main tree working directory:** `{working_dir}/{sprint-name}/` — gitignored reference copy accessible without navigating into worktrees
2. **Worktree plans directory:** `{plans_dir}/{sprint-name}/` — committed to the feature branch

### 5.3 Finish-Plan Lifecycle

When `chester-finish-plan` runs:
1. The branch merge brings `{plans_dir}/{sprint-name}/` into main as the permanent archive
2. The working copy at `{working_dir}/{sprint-name}/` is deleted via `rm -rf`

## 6. Config Resolution Script

### 6.1 `chester-config-read.sh` Rewrite

The script resolves config from new locations with auto-migration fallback.

**Resolution order:**
1. Check `{git-root}/.chester/.settings.chester.local.json` (project-level)
2. Check `~/.claude/.chester/.settings.chester.json` (user-level)
3. If both exist: deep merge project over user
4. If only one exists: use that one
5. If neither exists: check for old config locations and auto-migrate (see section 7)
6. If still nothing: use hardcoded defaults

**Exports:**
- `CHESTER_WORK_DIR` — resolved working directory path (was `CHESTER_PLANNING_DIR` in old system)
- `CHESTER_PLANS_DIR` — resolved plans directory path (was `CHESTER_WORK_DIR` in old system)
- `CHESTER_CONFIG_PATH` — path to the project-level config file used, or `"none"`

### 6.2 Deep Merge Implementation

Using `jq`:
```bash
jq -s '.[0] * .[1]' "$USER_CONFIG" "$PROJECT_CONFIG"
```

This performs a shallow object merge which is sufficient for the current single-level-nested schema. If deeper nesting is added later, switch to recursive merge.

## 7. Auto-Migration

### 7.1 Trigger

Migration runs when:
- New config locations do not exist
- Old config locations are detected

### 7.2 Steps

1. **User-level:** If `~/.claude/chester-config.json` exists and `~/.claude/.chester/.settings.chester.json` does not:
   - Create `~/.claude/.chester/`
   - Copy content to `~/.claude/.chester/.settings.chester.json`
   - Remove `~/.claude/chester-config.json`

2. **Project-level:** If `~/.claude/projects/-{hash}/chester-config.json` exists and `{project-root}/.chester/.settings.chester.local.json` does not:
   - Create `{project-root}/.chester/`
   - Copy content to `{project-root}/.chester/.settings.chester.local.json`
   - Remove old project config file
   - Add `.chester/` to `.gitignore` if not already ignored

3. **Key renaming:** During migration, rename keys in the copied config:
   - `work_dir` → `plans_dir` (the old "work dir" is what's now the committed plans dir)
   - `planning_dir` → `working_dir` (the old "planning dir" is what's now the working drafts dir)

### 7.3 Safety

- Never overwrite an existing new-location config
- Log each migration action to stderr for visibility
- If migration fails partway, leave old files in place (don't delete until new file is confirmed written)

## 8. First-Run Setup

### 8.1 Detection

First-run is detected when `chester-config-read.sh` returns `CHESTER_CONFIG_PATH=none` AND no old config locations exist (migration would have handled those).

### 8.2 Flow (in chester-start)

1. Announce: "This looks like a new project for Chester. Let's set up your output directories."
2. Present defaults and ask for confirmation or customization:
   - Working dir: `docs/chester/working/`
   - Plans dir: `docs/chester/plans/`
3. Create `{project-root}/.chester/`
4. Write `{project-root}/.chester/.settings.chester.local.json` with chosen paths
5. Create `~/.claude/.chester/.settings.chester.json` with defaults if it doesn't exist
6. Add `.chester/` and `{working_dir}/` to `.gitignore`
7. Commit `.gitignore` changes: `chore: add chester directories to .gitignore`
8. Create the working and plans directories: `mkdir -p {working_dir} {plans_dir}`

## 9. Skill Updates

### 9.1 Variable Rename

All skills must update their references:
- `CHESTER_PLANNING_DIR` → `CHESTER_WORK_DIR` (the gitignored working directory)
- `CHESTER_WORK_DIR` → `CHESTER_PLANS_DIR` (the committed plans directory)

### 9.2 Skills Requiring Changes

| Skill | Change |
|-------|--------|
| `chester-start` | Rewrite first-run setup to use new locations, add migration trigger |
| `chester-figure-out` | Update dual-write paths: working dir + plans dir |
| `chester-build-spec` | Update dual-write paths |
| `chester-build-plan` | Update dual-write paths |
| `chester-write-code` | Update deferred items path |
| `chester-finish-plan` | Replace planning dir cleanup with `rm -rf {working_dir}/{sprint-name}/`; remove old "promote" logic |
| `chester-write-summary` | Update summary output paths |
| `chester-hooks/chester-config-read.sh` | Complete rewrite (section 6) |

### 9.3 Sprint Directory Naming

The sprint subdirectory naming convention is unchanged: `YYYY-MM-DD-word-word-word` at the directory level, `word-word-word` as the sprint name in file names. The only difference is WHERE these directories are created.

## 10. Testing Strategy

### 10.1 Config Resolution Tests

- User-level only: returns user defaults
- Project-level only: returns project values
- Both exist: deep merge produces correct result (project overrides user scalars, inherits missing keys)
- Neither exists: returns hardcoded defaults
- jq unavailable: falls back to defaults with warning

### 10.2 Migration Tests

- Old user config exists → migrated to new location, old file removed
- Old project config exists → migrated, old file removed, `.gitignore` updated
- New config already exists → old config NOT overwritten, left in place
- Key renaming (`work_dir`→`plans_dir`, `planning_dir`→`working_dir`) verified

### 10.3 First-Run Tests

- No config anywhere → first-run flow triggered
- Config exists → no first-run announcement

### 10.4 Integration Test

- Full pipeline from first-run through figure-out, spec, plan, write-code, finish-plan
- Verify artifacts land in `{working_dir}/{sprint}/` during development
- Verify artifacts land in `{plans_dir}/{sprint}/` after merge
- Verify `{working_dir}/{sprint}/` is cleaned up after finish

## 11. Constraints

- `jq` is required for config resolution (existing dependency)
- The auto-migration is destructive (removes old files) — but old locations are internal and undocumented, so this is acceptable
- `.chester/` directory name is fixed and not configurable
- Config file names (`.settings.chester.json`, `.settings.chester.local.json`) are fixed and not configurable