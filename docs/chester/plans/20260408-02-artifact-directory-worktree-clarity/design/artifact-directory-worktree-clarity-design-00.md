# Design Brief: Artifact Directory Worktree Clarity

**Sprint:** 20260408-02-artifact-directory-worktree-clarity
**Date:** 2026-04-08
**Status:** Approved

## Problem

Chester's artifact directory model behaves inconsistently across sessions. Skills write to different locations, the config exports two directory paths that are used interchangeably, and a half-completed migration left the system in a contradictory state. The user can't reliably predict where documents are.

## Design Decisions

### D1: Single write target during active work

All skills write exclusively to `docs/chester/working/{sprint}/` (gitignored). No skill writes to `plans/` during any phase of active work — design, spec, plan, execute, or summary. Working/ is the one source of truth for the user.

**Rationale:** Eliminates the "where is my document?" question entirely. There is exactly one answer at every point in the pipeline.

### D2: Worktree is for code only

The worktree is created at its current timing (end of design-figure-out) and is used exclusively for code changes during execution. No documents are committed to the worktree until merge time.

**Rationale:** Documents and worktrees are orthogonal concerns. Coupling them created confusion about what lives where.

### D3: Archive is a single atomic operation at merge time

When the user is ready to close the worktree and merge, all documents are copied from `working/{sprint}/` into the worktree's `plans/{sprint}/` directory and committed. This is the only moment `plans/` is created or written to.

**Rationale:** Single point of document-to-git transfer. No intermediate states, no partial commits, no ambiguity.

### D4: No mid-pipeline checkpoint commits of documents

Current checkpoint commits (e.g., "checkpoint: design complete" in the worktree) are eliminated. Documents exist only in working/ until the archive step.

**Rationale:** Working/ is the source of truth during active work. Checkpoint commits added complexity without value.

### D5: Working directory is user-managed scratch

After merge, `working/{sprint}/` remains on disk as acceptable debris. The user deletes it when they choose. No automated cleanup.

**Rationale:** Simplicity. No lifecycle management, no retention policies, no cleanup automation.

### D6: Plans directory is the permanent git record

`plans/{sprint}/` exists only in git history, created at merge time. It's the committed copy of what was in `working/`.

**Rationale:** Git history is the permanent record. Plans/ is a commit artifact, not a working artifact.

## What Changes

- **Config system**: Skills only need `CHESTER_WORKING_DIR` during active work. `CHESTER_PLANS_DIR` is only relevant to the archive step.
- **Every skill that writes artifacts**: Must write to `working/`, never to `plans/`.
- **Checkpoint commits in worktree**: Removed from design-figure-out and any other skill that commits documents mid-pipeline.
- **finish-archive-artifacts**: Becomes the single point where documents enter the worktree — copy from `working/` to worktree's `plans/`, commit, then proceed to merge.

## What Doesn't Change

- Worktree creation timing
- Sprint naming convention (YYYYMMDD-##-word-word-word-word)
- Document naming convention (design-00.md, spec-00.md, etc.)
- Subdirectory structure within a sprint (design/, spec/, plan/, summary/)

## Scope Boundary

This design covers the directory model and document lifecycle only. It does not address:
- Plugin cache staleness (separate operational concern)
- Skill content beyond artifact path references
- Config variable naming or API changes beyond what's needed for the directory model
