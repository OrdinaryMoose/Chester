# Design Brief: Chester Fork Structure

**Sprint:** singlecontext-executor-fork
**Date:** 2026-03-28
**Status:** Approved

## Problem

Chester needs to exist as two independent variants — one using subagent dispatch for task execution, one using inline single-context execution. The current repo at `~/.claude/skills` needs to become two separate, independently maintained codebases.

## Design Decisions

### Fork Model: Clean Break

Both variants start from the current Chester codebase. They diverge independently after the fork. No shared directories, no mode flags, no coexistence in a single repo. You install one or the other.

### Filesystem Layout

| Variant | Path | GitHub Remote |
|---------|------|---------------|
| Subagent | `~/.claude/skills-chester-subagent/` | OrdinaryMoose/Chester (original) |
| Singlecontext | `~/.claude/skills-chester-singlecontext/` | New repo (TBD) |

### Origin of Each Variant

- **Subagent:** The current `~/.claude/skills/` directory, renamed. Keeps the original Git history and remote. No code changes — this IS current Chester at a new path.
- **Singlecontext:** Copied from the subagent variant at fork time. Gets a new GitHub remote. Starts identical, then gets reworked in subsequent sprints.

### Switching Between Variants

Edit the session-start hook path in `~/.claude/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "type": "command",
        "command": "~/.claude/skills-chester-subagent/chester-hooks/session-start"
      }
    ]
  }
}
```

Change `skills-chester-subagent` to `skills-chester-singlecontext` to switch. Manual edit, no tooling.

### What This Sprint Delivers

1. Rename `~/.claude/skills/` to `~/.claude/skills-chester-subagent/`
2. Copy to `~/.claude/skills-chester-singlecontext/`
3. Update `settings.json` hook path to point at the active variant
4. Create new GitHub repo for singlecontext variant and set as remote
5. Verify both variants work independently

### What This Sprint Does NOT Deliver

- Any changes to skill behavior in the singlecontext variant
- The inline executor design (separate figure-out cycle)
- The self-review checklist design (separate figure-out cycle)

## Constraints

- Internal paths in skills are relative to the skills directory — they should work without changes after rename
- The config reader (`chester-hooks/chester-config-read.sh`) derives paths from the skills directory location — verify it works at the new path
- Any absolute paths referencing `~/.claude/skills/` (in CLAUDE.md, hook scripts, etc.) must be updated to use the variant-specific path
