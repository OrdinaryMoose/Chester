# Spec: Chester Fork — Subagent and Singlecontext Variants

**Sprint:** singlecontext-executor-fork
**Date:** 2026-03-28
**Design Brief:** `design/singlecontext-executor-fork-design-00.md`

## 1. Overview

Fork Chester into two independent, fully separate codebases. The current repository becomes the subagent variant at a new filesystem path. A copy becomes the singlecontext variant with its own path and GitHub remote. Both start from the same codebase and diverge independently — no shared code, no merging, no coexistence abstraction.

## 2. Filesystem Layout

| Variant | Directory | GitHub Remote |
|---------|-----------|---------------|
| Subagent | `~/.claude/skills-chester-subagent/` | `OrdinaryMoose/Chester` (original, unchanged) |
| Singlecontext | `~/.claude/skills-chester-singlecontext/` | New repo (user creates on GitHub) |

The current `~/.claude/skills/` directory becomes `~/.claude/skills-chester-subagent/` via rename (preserving Git history and remote).

## 3. Fork Procedure

### 3.1 Rename Current Directory

```
~/.claude/skills/ → ~/.claude/skills-chester-subagent/
```

This is a filesystem rename (`mv`). Git history, remote configuration, and all branch state are preserved.

### 3.2 Copy to Singlecontext

```
~/.claude/skills-chester-subagent/ → ~/.claude/skills-chester-singlecontext/
```

Full recursive copy. The copy inherits the Git repo including history and remote. The remote will be replaced in step 3.4.

### 3.3 Verify Both Directories

After copy, verify:
- Both directories exist and contain the full skill set
- `git status` in each shows a clean working tree (or the same state as before the fork)
- `git remote -v` in subagent still points to `OrdinaryMoose/Chester`

### 3.4 Set Singlecontext Remote

In `~/.claude/skills-chester-singlecontext/`:
- Remove the original remote: `git remote remove origin`
- Add the new remote once the user has created the GitHub repo: `git remote add origin <new-repo-url>`

The user creates the new GitHub repository manually. This spec does not automate GitHub repo creation.

### 3.5 Update Hardcoded Paths

Multiple files reference `~/.claude/skills/` as an absolute path. After the rename, these paths break in both variants. Each variant must update its internal references to point at its own directory.

**In subagent variant:** Replace `~/.claude/skills/` with `~/.claude/skills-chester-subagent/` in all files.

**In singlecontext variant:** Replace `~/.claude/skills/` with `~/.claude/skills-chester-singlecontext/` in all files.

Files requiring update (all `*.md` and `*.sh` files containing the path):
- `chester-hooks/chester-config-read.sh` (usage comment)
- `chester-start/SKILL.md`
- `chester-figure-out/SKILL.md`
- `chester-build-spec/SKILL.md`
- `chester-build-plan/SKILL.md`
- `chester-write-code/SKILL.md`
- `chester-finish-plan/SKILL.md`
- `chester-trace-reasoning/SKILL.md`
- `chester-write-summary/SKILL.md`
- `chester-doc-sync/SKILL.md`
- `chester-doc-sync/subagent-doc-gaps.md`
- `chester-doc-sync/subagent-claude-md.md`
- `chester-doc-sync/subagent-approved-docs.md`
- `CLAUDE.md`
- `README.md`

Sprint-specific docs (in `docs/`) also contain the old path but these are historical records — update only the skill files and project-level docs, not sprint artifacts.

### 3.6 Update settings.json

The session-start hook in `~/.claude/settings.json` currently points at:
```
/home/mike/.claude/skills/chester-hooks/session-start
```

After the fork, update to point at the subagent variant (the natural default, since it preserves current behavior):
```
/home/mike/.claude/skills-chester-subagent/chester-hooks/session-start
```

To switch to singlecontext later:
```
/home/mike/.claude/skills-chester-singlecontext/chester-hooks/session-start
```

### 3.7 Commit in Both Variants

Each variant gets a commit recording the fork:
- **Subagent:** `chore: rename skills directory for chester fork (subagent variant)`
- **Singlecontext:** `chore: rename skills directory for chester fork (singlecontext variant)`

## 4. Switching Between Variants

Edit `~/.claude/settings.json` and change the hook path. No scripts, no tooling, no symlinks. The user edits one line and starts a new session.

## 5. Constraints

- **No symlinks or indirection.** Each variant is a self-contained directory with no external references to the other.
- **No shared files.** After the fork, the two variants are fully independent. Changes in one do not propagate to the other.
- **Sprint artifacts are historical.** Old sprint docs in `docs/chester/` that reference `~/.claude/skills/` are left as-is — they record what was true at the time.
- **Git worktrees.** Any active worktrees under the old `.worktrees/` directory in `~/.claude/skills/` must be pruned before the rename (`git worktree prune`), since the rename invalidates their paths.

## 6. Non-Goals

- Automating GitHub repository creation
- Building a switching script or tool
- Modifying any skill behavior (that's a separate design cycle for the singlecontext variant)
- Supporting running both variants simultaneously in the same session
- Maintaining compatibility between the two variants

## 7. Testing Strategy

- After fork: run `git status` in both variants to verify clean state
- After path updates: `grep -rn '~/.claude/skills/' --include='*.md' --include='*.sh' .` in each variant should return zero matches (excluding sprint artifacts in `docs/`)
- After settings update: start a new Claude Code session and verify Chester loads from the correct variant
- Verify `chester-config-read.sh` works correctly from the new path

## 8. Risk

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Missed hardcoded path | Medium | Low — session-start fails, easy to find and fix | Grep for old path after update |
| Active worktrees break on rename | High if not pruned | Low — recreate as needed | Prune worktrees before rename |
| Singlecontext remote not set | Certain until user acts | Low — local work continues fine | Document as manual step |
