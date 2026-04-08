# Artifact Directory Worktree Clarity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use execute-write (recommended) or execute-write in inline mode to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the directory model documentation in three authority files with the actual behavior — working/ is the sole active write target, plans/ is a merge-time archive.

**Architecture:** Three-file documentation rewrite at the authority level. No behavioral changes. Downstream skills already describe the model correctly and are not modified.

**Tech Stack:** Markdown, Bash (comment only)

---

### Task 1: Update chester-config-read.sh comment block

**Files:**
- Modify: `chester-util-config/chester-config-read.sh:6-8`

- [ ] **Step 1: Apply the edit**

Replace lines 6-8:

```bash
# Two-directory model:
#   CHESTER_WORKING_DIR — absolute path, gitignored, for active design/spec/plan work
#   CHESTER_PLANS_DIR   — relative to repo root, tracked in git, for final artifacts merged with code
```

With:

```bash
# Directory model:
#   CHESTER_WORKING_DIR — absolute path, gitignored; all pipeline skills write here
#   CHESTER_PLANS_DIR   — relative to repo root, tracked in git; populated once at merge
#                         time by finish-archive-artifacts (no other skill writes here)
```

- [ ] **Step 2: Verify config script still works**

Run: `bash tests/test-chester-config.sh`
Expected: All tests pass. The comment change has no effect on exported variables.

- [ ] **Step 3: Verify no "Two-directory" references remain in this file**

Run: `grep -n "Two-directory" chester-util-config/chester-config-read.sh`
Expected: No matches.

- [ ] **Step 4: Commit**

```bash
git add chester-util-config/chester-config-read.sh
git commit -m "docs: update config script comment — working is sole active target, plans is merge-time archive"
```

---

### Task 2: Rewrite util-artifact-schema Config Resolution section

**Files:**
- Modify: `skills/util-artifact-schema/SKILL.md:25-39`

- [ ] **Step 1: Apply the edit**

Replace lines 25-39 (from `This exports two variables:` through the `If CHESTER_CONFIG_PATH` paragraph):

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

With:

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

- [ ] **Step 2: Verify the rest of the file is unchanged**

Run: `head -24 skills/util-artifact-schema/SKILL.md` — should show the unchanged frontmatter and Config Resolution header.

Run: `tail -n +40 skills/util-artifact-schema/SKILL.md | head -5` — should show `## Sprint Naming` section starting (the line number will shift due to the replacement being longer, so verify by content not line number).

- [ ] **Step 3: Verify no "two-directory" or symmetric framing remains**

Run: `grep -in "two.directory\|where finished artifacts are committed alongside" skills/util-artifact-schema/SKILL.md`
Expected: No matches.

- [ ] **Step 4: Commit**

```bash
git add skills/util-artifact-schema/SKILL.md
git commit -m "docs: rewrite artifact schema — working is sole write target, plans is merge-time archive"
```

---

### Task 3: Update setup-start first-run explanation

**Files:**
- Modify: `skills/setup-start/SKILL.md:42-58`

- [ ] **Step 1: Apply the edit**

Replace lines 42-58 (from `b. Explain the two-directory model` through the closing triple-backtick of the fenced code block):

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

With:

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

- [ ] **Step 2: Verify no "two directories" framing remains in the first-run block**

Run: `grep -n "two.director\|two directories" skills/setup-start/SKILL.md`
Expected: No matches.

- [ ] **Step 3: Commit**

```bash
git add skills/setup-start/SKILL.md
git commit -m "docs: rewrite setup-start first-run explanation — one active dir, one archive"
```

---

### Task 4: Update setup-start announcement formats

**Files:**
- Modify: `skills/setup-start/SKILL.md:111` (first-run announcement)
- Modify: `skills/setup-start/SKILL.md:156` (returning-session echo)

Note: line numbers assume Task 3's edit has already been applied. The replacement in Task 3 is the same length (17 lines), so downstream line numbers are unchanged. If the replacement shifts lines, locate by content (`(tracked)`) not line number.

- [ ] **Step 1: Update first-run announcement**

Find (in the `h. Announce` block):
```
   - Plans directory: {CHESTER_PLANS_DIR} (tracked)
```

Replace with:
```
   - Plans directory: {CHESTER_PLANS_DIR} (archive, tracked)
```

- [ ] **Step 2: Update returning-session echo**

Find (in the `After checks, always echo BOTH` block):
```
   - Plans directory: {CHESTER_PLANS_DIR} (tracked)
```

Replace with:
```
   - Plans directory: {CHESTER_PLANS_DIR} (archive, tracked)
```

- [ ] **Step 3: Verify both echo formats are consistent**

Run: `grep -n "(tracked)" skills/setup-start/SKILL.md`
Expected: All remaining matches should say `(archive, tracked)`, not bare `(tracked)`.

- [ ] **Step 4: Commit**

```bash
git add skills/setup-start/SKILL.md
git commit -m "docs: update setup-start echo formats — plans dir labeled as archive"
```

---

### Task 5: Final verification

- [ ] **Step 1: Run config tests**

Run: `bash tests/test-chester-config.sh`
Expected: All tests pass. No behavioral changes were made.

- [ ] **Step 2: Grep for stale "two-directory" framing across all skills**

Run: `grep -rn "Two-directory\|two.directory\|two directories" skills/ chester-util-config/`
Expected: No matches.

- [ ] **Step 3: Grep for bare "(tracked)" without "archive" in setup-start**

Run: `grep -n "PLANS_DIR.*tracked" skills/setup-start/SKILL.md`
Expected: All matches include "archive".

- [ ] **Step 4: Verify CHESTER_PLANS_DIR is only referenced by finish-archive-artifacts among pipeline skills**

Run: `grep -rn "CHESTER_PLANS_DIR" skills/ --include="*.md" | grep -v "util-artifact-schema\|setup-start\|finish-archive\|start-bootstrap\|util-budget"`
Expected: No matches from pipeline skills (design-figure-out, design-specify, plan-build, execute-write, finish-write-records). These skills should only reference `CHESTER_WORKING_DIR`.
