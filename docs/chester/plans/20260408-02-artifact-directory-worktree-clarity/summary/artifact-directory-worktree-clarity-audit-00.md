# Reasoning Audit: Artifact Directory Worktree Clarity

**Date:** 2026-04-08
**Session:** 01
**Plan:** `artifact-directory-worktree-clarity-plan-00.md`

## Executive Summary

This session redesigned Chester's artifact directory model from a confusing dual-directory system to a clear asymmetric model: working/ for active work, plans/ for merge-time archival only. The most significant decision was the user's direct statement that documents and worktrees are orthogonal — this eliminated the core complexity. Implementation was straightforward (3-file documentation rewrite) but complicated by discovering the worktree was based on a pre-rename commit, requiring a rebase mid-execution.

## Plan Development

The plan emerged directly from a short Socratic interview (4 questions). The user had a clear pre-formed vision — the interview validated rather than discovered. Three competing architectures were evaluated; the Pragmatic approach (3 files) was selected over Minimal (2, too thin) and Clean (7, unnecessary breadth). Plan hardening rated risk as Low.

## Decision Log

### Plugin cache staleness resolution

**Context:**
During session setup, discovered the plugin cache was 2 days stale — had removed skills (design-architect), old monolithic finish skill, and was missing new skills. This was blocking correct skill invocation.

**Information used:**
- diff of cache skills/ vs source skills/ directories
- Plugin manifest showing directory-based marketplace source
- CLAUDE.md documenting `--plugin-dir` as the dev workflow

**Alternatives considered:**
- `--plugin-dir` flag on restart — correct long-term but requires session restart
- rsync from source to cache — immediate fix, stays in session

**Decision:** rsync from source to cache + /reload-plugins

**Rationale:** Preserves current session context while fixing the immediate problem. The `--plugin-dir` approach is the correct dev workflow but doesn't help mid-session.

**Confidence:** High — both approaches are valid; this was a pragmatic choice to avoid losing session context.

---

### Documents and worktrees as orthogonal concerns

**Context:**
The current system creates worktrees at end of design-figure-out and commits document checkpoints in them. The question was whether to change worktree timing or document handling.

**Information used:**
- User's direct statement: "no change to the worktree... working is .gitignore and the user controls all of the documents"
- Current skill behavior: worktree created for code, documents in working/

**Alternatives considered:**
- Delay worktree creation to after plan phase — rejected by user ("no change to the worktree")
- Keep checkpoint commits — rejected by user ("dont care, working is the one source of truth")

**Decision:** Worktree timing unchanged. Documents never enter worktree until merge. Working/ is the sole source of truth during all active work.

**Rationale:** User had a clear mental model: one place for documents, worktree is for code. Orthogonal concerns should not be coupled.

**Confidence:** High — user stated this directly and confirmed multiple times.

---

### Pragmatic architecture over Minimal and Clean

**Context:**
Three architect agents independently concluded the behavior was already correct — the problem was documentation framing. The question was how many files to update.

**Information used:**
- Architect 1 (Minimal): 2 files — only setup-start and util-artifact-schema
- Architect 2 (Clean): 7 files — every file mentioning the model
- Architect 3 (Pragmatic): 3 files — the three authority files

**Alternatives considered:**
- Minimal (2 files) — too thin, leaves config script saying "Two-directory model"
- Clean (7 files) — adds contract statements to finish skills that already behave correctly

**Decision:** Pragmatic — update chester-config-read.sh, util-artifact-schema, and setup-start.

**Rationale:** The authority files propagate the correct mental model. Downstream skills already say "stays in working dir." Updating them is churn without value.

**Confidence:** High — user selected directly ("3").

---

### Worktree rebase mid-execution

**Context:**
Task 2 subagent reported the worktree was based on commit 15f72fc (pre-skills/ rename). The file `util-artifact-schema/SKILL.md` didn't exist in the worktree. Setup-start was at the old `chester-setup-start/` path with old content.

**Information used:**
- `git worktree list` showing branch base
- `git ls-files` showing tracked paths use `chester-*` convention
- Main has `skills/` on disk (untracked) and `chester-*` tracked

**Alternatives considered:**
- Work with old paths only — would miss util-artifact-schema entirely (never existed at old path)
- Rebase onto main — brings worktree up to date, lets us work with current files

**Decision:** Rebase the worktree branch onto current main, then apply edits.

**Rationale:** The alternative was working with files that don't represent the actual system state. Rebasing ensures our edits land on the current codebase.

**Confidence:** High — without rebase, Task 2 would create a file at a path that doesn't exist in the main codebase's tracked history.

---

### Copying source setup-start into worktree's tracked path

**Context:**
After rebase, the worktree's `chester-setup-start/SKILL.md` was still the old 190-line version. The current source at `skills/setup-start/SKILL.md` (276 lines, never committed) had the content we needed to edit.

**Information used:**
- `wc -l` showing 190 (tracked) vs 276 (source)
- Content comparison showing the "two-directory" text only exists in the source version
- `git ls-files` confirming the `skills/` rename was never committed

**Alternatives considered:**
- Edit the old 190-line version — doesn't have the target text, would require a different edit strategy
- Commit the full skills/ rename first — correct but massive out-of-scope change

**Decision:** Copy current source `skills/setup-start/SKILL.md` content into the tracked `chester-setup-start/SKILL.md` path, then apply our edits.

**Rationale:** This brings the tracked file up to date with the actual source AND applies our directory model fix in one commit. The commit message notes it "brings tracked file up to date with current source version."

**Confidence:** Medium — this is pragmatic but conflates two changes (source update + our edit) in one commit. Acceptable given the skills/ rename is deferred.
