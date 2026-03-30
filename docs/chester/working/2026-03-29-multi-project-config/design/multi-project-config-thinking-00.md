# Multi-Project Config — Thinking Summary

## Decision Timeline

### Stage 1: Problem Definition
**Starting point:** Chester's config system merges user-level and project-level configs with a flat `jq` deep merge. Directory paths (`working_dir`, `plans_dir`) can leak from user config into unrelated projects. Old migration code adds complexity for a completed transition.

**Key realization:** The problem is about separation of concerns — project-specific paths vs. user-wide settings — not just removing migration code.

### Stage 2: First-Run Experience
**Question:** Should first-run ask about one directory or both?
**Initial assumption:** Only plans directory (from earlier plan).
**User correction:** Ask about both directories.
**Resolved:** First-run presents defaults for both plans and working directories; user accepts or customizes either.

### Stage 3: User-Level Config Purpose
**Question:** What belongs in user-level config?
**Answer:** Cross-project settings like `budget_guard`, with more possible in the future.
**Implication:** User config must remain in the merge pipeline — it's not going away. But directory paths are excluded from it.

### Stage 4: Merge Semantics
**Question:** When project and user configs conflict on a shared key, who wins?
**Answer:** Project always wins.
**Resolved:** Deep merge with project overriding user, same as current behavior. The change is only about WHERE directory paths are read from (project-only).

### Stage 5: Config File Location — Project Level
**Question:** Where should project config live?
**Signal:** User said "match how Claude does it."
**Discovery:** Claude Code uses `{project-root}/.claude/settings.local.json` — gitignored, personal.
**Resolved:** Chester project config moves to `{project-root}/.claude/settings.chester.local.json`. Eliminates `.chester/` directory at project root.

### Stage 6: Config File Location — User Level
**Question:** Should user config follow the same flattening?
**Resolved:** Move from `~/.claude/.chester/.settings.chester.json` to `~/.claude/settings.chester.json`. Sits alongside Claude's own `~/.claude/settings.json`. Consistent naming convention: `.chester` infix distinguishes Chester from Claude.

### Stage 7: First-Run Interaction Pattern
**Question:** Should the first-run prompt change?
**Answer:** No — keep the current flow (present defaults, accept or customize).

## Key Reasoning Shifts

| Shift | From | To | Why |
|-------|------|----|-----|
| Directory prompt scope | Plans only | Both directories | User preference for explicit control |
| Config location model | Separate `.chester/` directory | Inside `.claude/` alongside Claude config | "Match how Claude does it" — consistency with host tool |
| User config path | `~/.claude/.chester/.settings.chester.json` | `~/.claude/settings.chester.json` | Same flattening principle applied consistently |

## Confidence Assessment

All decisions resolved with high confidence. No low-confidence items flagged for revisiting. The design is constrained and well-bounded — no speculative elements.