# Session Summary: Remove Compaction Hooks

**Date:** 2026-04-24
**Session type:** Targeted cleanup — dead-code removal

## Goal

Remove the compaction hook subsystem from Chester. Compaction is deprecated upstream in Claude Code; the `PreCompact` and `PostCompact` events no longer fire reliably, so the hook scripts and their tests were dead weight — including the `CLAUDE_PLUGIN_ROOT` resolver fix that landed earlier in the same week.

## What Was Completed

### Removed

- `chester-util-config/hooks/pre-compact.sh` (109 lines)
- `chester-util-config/hooks/post-compact.sh` (166 lines)
- `tests/test-compaction-hooks.sh` (~225 lines)
- `PreCompact` and `PostCompact` registrations from `hooks/hooks.json`
- `compact` token from the `SessionStart` matcher (was `startup|clear|compact`, now `startup|clear`)
- Step 4b (`.active-sprint` breadcrumb write) from `skills/start-bootstrap/SKILL.md`
- The `.active-sprint` breadcrumb listing from start-bootstrap's "What It Returns" section
- Orphan `.active-sprint` file from `docs/chester/working/`

### Why the breadcrumb went too

`.active-sprint` was a gitignored file that start-bootstrap wrote so the compaction hooks could locate the active sprint without conversation context. With the hooks gone, nothing read it — a textbook orphan artifact. Dependency-trace confirmed only `pre-compact.sh`, `post-compact.sh`, and the compaction test ever consumed it. Removed from the producer and from disk.

### Memory updates

- `MEMORY.md` — removed the compaction-hooks index entry; updated the feature-briefs entry to note the revert
- `project_feature_briefs.md` — flipped the `compaction-hooks.md` row from "Implemented (merged 2026-04-08)" to "Reverted (removed 2026-04-24)"
- `project_compaction_hooks.md` — now orphan (index no longer points at it); awaiting manual delete since shell `rm` is sandboxed in this environment

## Verification Results

| Check | Result |
|---|---|
| Residual scan for `compact` / `PreCompact` / `PostCompact` / `.active-sprint` in live code | 0 matches |
| Test suite | 8/8 PASS (was 9 — compaction test removed with its subsystem) |

## Net diff

1 insertion, 601 deletions across 5 files.

## Commit

```
4276087 chore: remove compaction hooks and related infrastructure
```

Branch: `20260423-01-refactor-chester-skills` (new worktree on top of main tip `6820e7d`). Commit is local to the branch — not yet merged to main.

## Handoff Notes

- The `CLAUDE_PLUGIN_ROOT` resolver pattern from the earlier hook fix (`29cc0af`) is now gone with the hooks that used it, but the pattern itself is worth remembering if any future plugin subshell needs to call `chester-config-read` — plugin hooks don't inherit PATH the way session shells do.
- The `docs/feature-definition/Pending/compaction-hooks.md` design brief was left in place as historical record of the decision that was later reverted. It belongs to the append-only history of what was tried, not the live inventory of what exists.
- Orphan memory file `project_compaction_hooks.md` can be deleted manually at any time — the index no longer references it, so there's no harm in leaving it either.
