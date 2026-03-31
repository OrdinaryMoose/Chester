# Design Brief: Layered Chester Configuration

## Summary

Replace Chester's current config system (scattered across `~/.claude/` internals) with a layered settings architecture using dedicated `.chester/` directories and clearly separated working/archive directories.

## Config Architecture

### Two Config Layers (Deep Merge)

**User-level:** `~/.claude/.chester/.settings.chester.json`
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

**Project-level:** `{project-root}/.chester/.settings.chester.local.json`
```json
{
  "working_dir": "docs/chester/working",
  "plans_dir": "docs/chester/plans"
}
```

- Project-level deep-merges over user-level
- Only overrides fields it explicitly sets; rest inherits
- `.chester/` at project root is **gitignored entirely**

## Directory Model

### Three Locations

| Location | Gitignored | Purpose |
|----------|-----------|---------|
| `.chester/` | Yes | Config files only |
| `docs/chester/working/{sprint-name}/` | Yes | Active drafts, multi-sprint capable |
| `docs/chester/plans/{sprint-name}/` | No | Permanent committed archive |

### Sprint Internal Structure (unchanged)

```
{sprint-name}/
├── design/
├── spec/
├── plan/
└── summary/
```

### Dual-Write Pattern (preserved)

During active development:
1. **Main tree:** `docs/chester/working/{sprint-name}/` — gitignored reference copy, easy to navigate
2. **Worktree:** `docs/chester/plans/{sprint-name}/` — committed to feature branch

On finish-plan:
1. Branch merge brings `plans/{sprint-name}/` to main as permanent archive
2. `working/{sprint-name}/` is deleted from main tree

## Config Resolution

### `chester-config-read.sh` Behavior

1. Check for project-level config: `{git-root}/.chester/.settings.chester.local.json`
2. Check for user-level config: `~/.claude/.chester/.settings.chester.json`
3. Deep merge: project over user
4. Export: `CHESTER_WORK_DIR`, `CHESTER_PLANS_DIR`, `CHESTER_CONFIG_PATH`
5. Defaults if neither exists: `working_dir=docs/chester/working`, `plans_dir=docs/chester/plans`

### Auto-Migration

On first run with old config detected:
- `~/.claude/chester-config.json` → `~/.claude/.chester/.settings.chester.json`
- `~/.claude/projects/-{hash}/chester-config.json` → `{project}/.chester/.settings.chester.local.json`
- Remove old files after successful migration

## First-Run Setup (updated chester-start)

1. Detect no config exists (neither old nor new locations)
2. Announce: "New project for Chester — setting up directories."
3. Present defaults, user confirms or customizes:
   - Working dir: `docs/chester/working/`
   - Plans dir: `docs/chester/plans/`
4. Create `.chester/` in project root
5. Write `.chester/.settings.chester.local.json`
6. Create `~/.claude/.chester/` and `.settings.chester.json` if they don't exist
7. Add to `.gitignore`: `.chester/` and `docs/chester/working/`
8. Commit `.gitignore` changes

## Affected Skills

All skills that call `chester-config-read.sh` or reference `CHESTER_WORK_DIR` / `CHESTER_PLANNING_DIR`:
- `chester-start` — first-run setup, config announcement
- `chester-figure-out` — writes to design/, dual-write
- `chester-build-spec` — writes to spec/, dual-write
- `chester-build-plan` — writes to plan/, dual-write
- `chester-write-code` — writes deferred items, dual-write
- `chester-finish-plan` — promotes working → plans, cleanup
- `chester-write-summary` — writes to summary/
- `chester-hooks/chester-config-read.sh` — complete rewrite