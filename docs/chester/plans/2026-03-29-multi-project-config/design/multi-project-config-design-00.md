# Multi-Project Config ��� Design Brief

## Problem

Chester's configuration system doesn't cleanly separate project-specific settings (directory paths) from user-wide settings (budget guard, future global preferences). A flat merge of both config layers means directory paths can leak across projects. Old migration code adds unnecessary complexity.

## Design Decisions

### 1. Config File Locations

Follow Claude Code conventions — Chester config lives alongside Claude's own config files:

| Level | Path | Gitignored | Contents |
|-------|------|------------|----------|
| User | `~/.claude/settings.chester.json` | N/A (home dir) | Cross-project settings: `budget_guard`, future global prefs |
| Project | `{project-root}/.claude/settings.chester.local.json` | Yes (`.claude/` is gitignored) | Directory paths + project-specific overrides |

### 2. Key Scoping

- **Project-local only:** `working_dir`, `plans_dir` — never read from or written to user config
- **Mergeable:** Everything else — read from both layers, project overrides user on conflict

### 3. Config Resolution

1. Read user config (`~/.claude/settings.chester.json`) if it exists
2. Read project config (`{project-root}/.claude/settings.chester.local.json`) if it exists
3. For directory paths: use project config values, fall back to defaults — ignore user config
4. For everything else: deep merge, project wins on conflict
5. Defaults: `working_dir` = `docs/chester/working`, `plans_dir` = `docs/chester/plans`

### 4. First-Run Setup

When `CHESTER_CONFIG_PATH` is `none` (no project config found):

1. Announce: "This looks like a new project for Chester. Let's set up your output directories."
2. Present defaults for **both** directories; user accepts or customizes
3. Create both directories
4. Ensure working directory is in `.gitignore`
5. Write config to `{project-root}/.claude/settings.chester.local.json` (directory paths only)
6. Create user config at `~/.claude/settings.chester.json` if it doesn't exist (empty `{}`)
7. Announce completion

### 5. Removed

- All migration code (old config path detection, key renaming, file moves)
- `.chester/` directory at project root (config moves into `.claude/`)
- Old config path constants and migration functions from `chester-config-read.sh`

## Naming Convention

`settings.chester.json` / `settings.chester.local.json` — the `.chester` infix distinguishes Chester config from Claude Code's own `settings.json` / `settings.local.json`. The `.local` suffix marks project-scoped files.