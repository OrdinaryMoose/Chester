# Thinking Summary: Artifact Directory Worktree Clarity

**Sprint:** 20260408-02-artifact-directory-worktree-clarity
**Date:** 2026-04-08

## Problem Discovery

The investigation began with the user reporting that the artifact directory experience "changes on different sessions and is confusing." Exploration revealed a half-completed migration (commit 72ebaa9) from a dual-directory model (working + plans) to a single-directory model. The system was in a contradictory state:

- Memory files described a single gitignored directory
- Config still exported two paths (CHESTER_WORKING_DIR and CHESTER_PLANS_DIR)
- .gitignore only covered working/, not plans/
- Different skills wrote to different directories inconsistently
- The finish-archive-artifacts step copied between directories, but the source/destination semantics varied

## Incidental Discovery: Stale Plugin Cache

During setup, we discovered the plugin cache at `~/.claude/plugins/cache/ordinarymoose/chester/1.0.0/` was 2 days stale. The cache still had `design-architect` (removed from source), old monolithic `finish` skill, and was missing newer skills like `finish-archive-artifacts`, `util-artifact-schema`, etc. This was resolved by rsync from source and `/reload-plugins`.

## Key Reasoning Shifts

### Shift 1: Documents and worktrees are orthogonal
Initial framing assumed the directory model and worktree model were coupled. The user clarified they are independent: working/ is for documents (always), worktree is for code (always). They only converge at merge time.

### Shift 2: No checkpoint commits needed
The current system commits document checkpoints in the worktree (e.g., "checkpoint: design complete"). The user stated these have no value — working/ is the source of truth during active work. This eliminates complexity from multiple skills.

### Shift 3: "Present" means "save to disk"
The original request mentioned "present documents to the user." This was clarified as imprecise wording — no UI or display concern, purely about where files are written.

### Shift 4: Working directory is acceptable debris
No cleanup automation needed. The user deletes working/{sprint}/ when they choose. This eliminates any lifecycle management complexity.

## Decision Sequence

1. **Single write target** (user stated directly) — all skills write to working/, never plans/
2. **Worktree timing unchanged** (user confirmed) — created at end of design-figure-out as today
3. **Archive at merge only** (user stated directly) — plans/ created only when closing worktree
4. **No checkpoint commits** (user confirmed) — documents don't enter worktree until merge
5. **User manages cleanup** (user confirmed) — working/ persists, deleted at user discretion

## Interview Characteristics

- 4 questions asked before design was complete
- User had a clear pre-formed vision — the interview extracted and validated it rather than discovering it
- No rejected alternatives or course corrections — design was additive, not iterative
- All decisions were user-stated constraints, not agent recommendations
