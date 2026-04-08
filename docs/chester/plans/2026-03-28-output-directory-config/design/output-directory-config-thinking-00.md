# Thinking Summary — Output Directory Config

## Decision History

### Decision 1: Two-layer problem identification
**Stage:** Problem Definition | **Confidence:** 0.85

Identified two distinct problems: (1) no persistent metadata — each skill independently determines output directory through conversation context, frontmatter, or heuristics; (2) no user-level default — every session starts from scratch with the same directory prompt. A solution needs both layers: a user config for the default output root and per-sprint metadata for the active session.

### Decision 2: First-run detection modeled on Claude's trust prompt
**Stage:** Analysis | **Confidence:** 0.90

Chester-start checks for chester-config.json — if missing, this is a new project. Chester asks the user for their working directory with a sensible default. This is per-project by nature since the config is project-scoped. The three-option prompt in figure-out changes: instead of asking every time, it reads the configured default and only speaks up if something's wrong.

### Decision 3: Project-scoped config under Claude's path
**Stage:** Analysis | **Confidence:** 0.88

Follow Claude's own pattern: project-scoped config under `~/.claude/projects/<project-hash>/chester-config.json`. Keeps Chester config out of the repo while being per-project. The existing global `~/.claude/chester-config.json` becomes the fallback for user-wide defaults like budget guard threshold.

### Decision 4: SuperPowers has the same gap
**Stage:** Analysis | **Confidence:** 0.87

SuperPowers solves directory management the same way Chester currently does — frontmatter cascade and a per-session directory choice prompt. No persistent project-level config, no first-run detection. Chester's opportunity is to go beyond both systems.

### Decision 5: One-time selection, silent sprint creation
**Stage:** Design Decision | **Confidence:** 0.92

User picks the output root once per project. Figure-out silently creates sprint subdirectories and informs the user. No confirmation prompt each time. This kills the per-session directory prompt entirely.

### Decision 6: Dual-write with gitignored staging directory
**Stage:** Design Decision | **Confidence:** 0.95

Worktrees isolate code but bury documentation at unpredictable paths. Solution: docs committed to worktree branch (authoritative record) AND mirrored to a gitignored planning directory in the main tree (predictable path for user access). Chester-finish purges the staging copy. Avoids: premature commits to main, merge conflicts, git clean risk, abandoned-sprint docs in history.

### Decision 7: User rejected committed-to-main and uncommitted options
**Stage:** Analysis | **Confidence:** 0.87

Three options evaluated: (A) committed to main — risk of docs for abandoned work in history, unexpected main movement; (B) uncommitted on disk — vulnerable to git clean, potential untracked file conflicts on merge; (C) gitignored staging directory — no risk to main, protected from git clean, cleaned up by chester-finish. User proposed option C.

### Decision 8: First-run setup creates staging directory
**Stage:** Design Decision | **Confidence:** 0.90

The docs-planning directory and its gitignore entry are created during first-run setup, not on first worktree use. Keeps initialization in one place.

### Decision 9: Configurable work and planning directories
**Stage:** Design Decision | **Confidence:** 0.93

First-run config asks for both directories separately. Planning directory defaults to `{work-directory}-planning`. User can customize either or both. Only requirement: planning must be gitignored. Planning directory organized by sprint subdirectories to support multiple concurrent Claude sessions.
