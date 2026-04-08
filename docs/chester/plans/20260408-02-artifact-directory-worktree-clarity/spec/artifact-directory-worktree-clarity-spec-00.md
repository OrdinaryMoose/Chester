# Spec: Artifact Directory Worktree Clarity

**Sprint:** 20260408-02-artifact-directory-worktree-clarity
**Date:** 2026-04-08
**Architecture:** Pragmatic (3-file documentation rewrite at authority level)

## Overview

The mechanical behavior of Chester's artifact directory model is already correct — every pipeline skill writes to `CHESTER_WORKING_DIR` and `finish-archive-artifacts` is the sole writer of `CHESTER_PLANS_DIR`. The problem is that the *descriptions* in the three authority files teach a symmetric "two-directory model" when the reality is asymmetric: one active scratch space, one merge-time archive. This spec defines the exact text changes to align the documentation with the actual behavior.

## Architecture

**Approach:** Update the three files that define and describe the directory model. Downstream skills already contain correct language ("stays in working dir, `finish-archive-artifacts` archives it") and do not need changes. The authority files propagate the correct mental model; downstream skills reinforce it.

**Files to change (3):**
1. `chester-util-config/chester-config-read.sh` — comment block (lines 6-8)
2. `skills/util-artifact-schema/SKILL.md` — Config Resolution section (lines 25-39)
3. `skills/setup-start/SKILL.md` — first-run explanation (lines 42-57)

**Files verified correct, not changing:**
- `skills/design-figure-out/SKILL.md` — closure says "Design artifacts stay in the working directory"
- `skills/design-specify/SKILL.md` — says "spec is NOT committed here"
- `skills/plan-build/SKILL.md` — says "plan is NOT committed here"
- `skills/execute-write/SKILL.md` — finish sequence is correct
- `skills/finish-archive-artifacts/SKILL.md` — behavior is correct
- `skills/finish-close-worktree/SKILL.md` — no document handling
- `skills/finish-write-records/SKILL.md` — writes to working dir
- `skills/execute-verify-complete/SKILL.md` — empty checkpoint is code-only marker
- `.gitignore` — `docs/chester/working/` already listed

## Components

### Component 1: chester-config-read.sh comment block

**File:** `chester-util-config/chester-config-read.sh`
**Lines:** 6-8

**Current:**
```bash
# Two-directory model:
#   CHESTER_WORKING_DIR — absolute path, gitignored, for active design/spec/plan work
#   CHESTER_PLANS_DIR   — relative to repo root, tracked in git, for final artifacts merged with code
```

**Replace with:**
```bash
# Directory model:
#   CHESTER_WORKING_DIR — absolute path, gitignored; all pipeline skills write here
#   CHESTER_PLANS_DIR   — relative to repo root, tracked in git; populated once at merge
#                         time by finish-archive-artifacts (no other skill writes here)
```

**No code changes.** Variable names, resolution logic, and export format are unchanged.

### Component 2: util-artifact-schema Config Resolution section

**File:** `skills/util-artifact-schema/SKILL.md`
**Lines:** 25-39

**Current:**
```markdown
This exports two variables:

| Variable | Meaning | Example |
|----------|---------|---------|
| `CHESTER_WORKING_DIR` | Absolute path to gitignored scratch space | `/home/user/project/docs/chester/working` |
| `CHESTER_PLANS_DIR` | Relative path to tracked plans directory | `docs/chester/plans` |

- **Working directory** — where artifacts live while you're actively working. Gitignored.
  Design briefs, specs, and plans are written here during development. This directory
  lives outside worktrees so documents are always in the same place during review.
- **Plans directory** — where finished artifacts are committed alongside code. Tracked in git.
  The `finish-archive-artifacts` skill copies from working to plans when work is complete.

If `CHESTER_CONFIG_PATH` is `none`, no Chester config exists for this project. Either
run `setup-start` first or use the defaults (`docs/chester/working/` and `docs/chester/plans/`).
```

**Replace with:**
```markdown
This exports two variables:

| Variable | Meaning | Example |
|----------|---------|---------|
| `CHESTER_WORKING_DIR` | Absolute path to gitignored scratch space — **all skills write here** | `/home/user/project/docs/chester/working` |
| `CHESTER_PLANS_DIR` | Relative path to archive target — **populated only at merge time** | `docs/chester/plans` |

**Directory model:** All artifact writes during a sprint go exclusively to `CHESTER_WORKING_DIR`.
No skill other than `finish-archive-artifacts` writes to `CHESTER_PLANS_DIR`.

- **Working directory** — the single write target for all pipeline work. Gitignored.
  Every skill in the design → spec → plan → execute → summary pipeline writes here.
  This directory lives outside worktrees so documents persist across branch switches
  and remain in the same location throughout the session.
- **Plans directory** — a merge-time archive, not an active destination. Tracked in git.
  `finish-archive-artifacts` copies the entire sprint subdirectory from working to plans
  exactly once, immediately before closing the worktree. No other skill touches this
  directory. Do not write artifact files here directly.

If `CHESTER_CONFIG_PATH` is `none`, no Chester config exists for this project. Run
`setup-start` first or use the defaults (`docs/chester/working/` and `docs/chester/plans/`).
```

### Component 3: setup-start (three independent edit sites)

**File:** `skills/setup-start/SKILL.md`

All three edits are independent (non-overlapping). Line numbers refer to the file before any edits.

#### Edit 3a: First-run explanation (lines 42-58)

**Current:**
```markdown
   b. Explain the two-directory model and ask for both paths:
   ```
   Chester uses two directories during development:

   1. **Working directory** — a gitignored scratch space where design briefs, specs,
      and plans live while you're actively working on them. This stays outside of
      worktrees so you always know where to find your documents during review.

   2. **Plans directory** — a tracked directory inside your repository where finished
      artifacts are committed alongside your code, creating a permanent record of the
      design and planning process.

   Working directory (gitignored): docs/chester/working/
   Plans directory (tracked in git): docs/chester/plans/

   Accept defaults? Or enter custom paths.
   ```
```

**Replace with:**
```markdown
   b. Explain the directory model and present defaults:
   ```
   Chester uses one active directory and one archive:

   1. **Working directory** — a gitignored scratch space where all documents live during
      active work (design briefs, specs, plans, summaries). This stays outside worktrees
      so documents are always in the same place regardless of which branch is checked out.
      Every pipeline skill writes here. Nothing is committed from here mid-sprint.

   2. **Plans directory** — a tracked directory where documents are archived at merge time.
      You never write here directly. When a sprint closes, `finish-archive-artifacts`
      copies the working directory's sprint folder into plans and commits it alongside
      the code, creating a permanent record.

   Working directory (gitignored): docs/chester/working/
   Plans directory (archive, tracked): docs/chester/plans/

   Accept defaults? Or enter custom paths.
   ```
```

#### Edit 3b: First-run announcement (lines 107-112)

**Current:**
```markdown
   h. Announce — use exactly this format:
   ```
   Chester is configured.
   - Working directory: {CHESTER_WORKING_DIR} (gitignored)
   - Plans directory: {CHESTER_PLANS_DIR} (tracked)
   ```
```

**Replace with:**
```markdown
   h. Announce — use exactly this format:
   ```
   Chester is configured.
   - Working directory: {CHESTER_WORKING_DIR} (gitignored)
   - Plans directory: {CHESTER_PLANS_DIR} (archive, tracked)
   ```
```

#### Edit 3c: Returning-session echo (lines 151-157)

**Current:**
```markdown
   **After checks, always echo BOTH resolved paths to the user — exactly this format:**

   ```
   Chester is configured.
   - Working directory: {CHESTER_WORKING_DIR} (gitignored)
   - Plans directory: {CHESTER_PLANS_DIR} (tracked)
   ```
```

**Replace with:**
```markdown
   **After checks, always echo BOTH resolved paths to the user — exactly this format:**

   ```
   Chester is configured.
   - Working directory: {CHESTER_WORKING_DIR} (gitignored)
   - Plans directory: {CHESTER_PLANS_DIR} (archive, tracked)
   ```
```

## Data Flow (Confirmed, Unchanged)

```
design-figure-out    → CHESTER_WORKING_DIR/{sprint}/design/
design-specify       → CHESTER_WORKING_DIR/{sprint}/spec/
plan-build           → CHESTER_WORKING_DIR/{sprint}/plan/
execute-write        → code in worktree; deferred items in CHESTER_WORKING_DIR/{sprint}/plan/
execute-verify-complete → empty checkpoint commit in worktree (code boundary only)
finish-write-records → CHESTER_WORKING_DIR/{sprint}/summary/
finish-archive-artifacts → cp working/{sprint}/ → worktree/plans/{sprint}/ → git commit
finish-close-worktree → merge/PR/keep/discard
```

`CHESTER_PLANS_DIR` is touched exactly once: by `finish-archive-artifacts`.

## Error Handling

No new error handling. The existing verification checks in `setup-start` (Check 0-3) remain correct:
- Check 2 (working dir IS gitignored) — still valid
- Check 3 (plans dir is NOT gitignored) — still valid, plans must be tracked for archive commits

## Testing Strategy

1. Run `bash tests/test-chester-config.sh` — verify config script still exports correct variables
2. Manual verification: read each changed file and confirm the new language matches the design brief's six decisions
3. Grep for any remaining "Two-directory model" or "two directories" phrasing in skills/ that would contradict the new framing

## Constraints

- Variable names (`CHESTER_WORKING_DIR`, `CHESTER_PLANS_DIR`) must not change — every skill uses `eval "$(chester-config-read)"`
- Config JSON schema (`working_dir`, `plans_dir` keys) must not change
- Export format of chester-config-read.sh must not change
- No behavioral changes to any skill — this is purely a documentation/framing correction

## Non-Goals

- Plugin cache staleness (separate concern)
- Changing when worktrees are created
- Adding enforcement mechanisms for the "don't write to plans/" rule
- Changing the first-run interactive flow (still asks for both paths)
- Modifying downstream skills that already describe the model correctly
