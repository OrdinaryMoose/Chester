# Design Brief — Chester Output Directory Management

## Problem

Chester has no persistent mechanism for skills to know where to write files, no way for the user to set a preferred default, and worktrees bury documentation at unpredictable paths. Each skill independently resolves output paths through conversation context, YAML frontmatter, heuristic searches, or hardcoded values — creating inconsistency, fragility, and silent failures when the pipeline doesn't run in perfect sequence. Multiple concurrent sessions can collide.

## Design

### 1. First-run detection in chester-start

When no project-scoped chester-config.json exists, Chester prompts the user to configure two directories:

- **Work directory** — where committed artifacts live (design, spec, plan, summary). Default: `docs/chester/`
- **Planning directory** — gitignored staging area for reading docs during active sprints. Default: `{work-directory}-planning` (e.g., `docs/chester-planning/`)

User can accept both defaults, customize either or both. Only requirement: planning directory must be gitignored.

First-run also creates the planning directory and adds it to .gitignore.

### 2. Project-scoped config

Stored under `~/.claude/projects/<project-hash>/chester-config.json`, following Claude's own pattern for project-level settings. Not in the repo. Contains both directory paths plus existing settings like budget guard threshold.

### 3. One-time selection

User picks both directories once per project. All skills read from this config instead of independently resolving paths through frontmatter, conversation context, or heuristics.

### 4. Silent sprint creation

Figure-out creates sprint subdirectories (`YYYY-MM-DD-word-word-word/`) under the configured work directory automatically. User is informed, not asked.

### 5. Dual-write with gitignored staging

Docs are committed to the worktree branch (authoritative record) and mirrored to the planning directory (gitignored, predictable path). User always reads docs at the same location regardless of which worktree is active.

### 6. Planning directory organized by sprint

Planning directory contains sprint subdirectories matching the worktree sprints. Multiple concurrent Claude sessions on different sprints each get their own subfolder — no collisions.

```
docs/chester-planning/
├── 2026-03-28-output-directory-config/
│   ├── design/
│   ├── spec/
│   └── plan/
└── 2026-03-29-auth-refactor/
    ├── design/
    └── spec/
```

### 7. Chester-finish purges the sprint's planning copy

When a sprint resolves (merge, PR, or discard), chester-finish removes that sprint's subfolder from the planning directory. Other active sprints are untouched.

## What This Replaces

- The three-option directory prompt in figure-out (asked every session)
- Frontmatter-based metadata propagation as the primary path-passing mechanism
- Per-skill heuristic searches for the output directory
- The hardcoded deferred items path in write-code

## Constraints

- Planning directory must always be gitignored
- Work directory path is relative to project root
- Config follows Claude's project-scoped pattern (`~/.claude/projects/<project-hash>/`)
- Sprint subdirectory naming: `YYYY-MM-DD-word-word-word`
