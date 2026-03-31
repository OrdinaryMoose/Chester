# Chester Commit Strategy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use chester-write-code (recommended) or chester-write-code in inline mode to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign Chester's commit strategy to produce structured branch history with checkpoint commits, conventional message formats, and a branch lifecycle that spans the full pipeline.

**Architecture:** Six skill markdown files are modified to: (1) move branch creation from write-code to figure-out, (2) add checkpoint commits at each pipeline phase transition, (3) enforce conventional commit prefixes on subagent working commits, (4) use `--no-ff` merge to preserve the branch rail. No code, no tests — these are documentation/instruction changes to skill files.

**Tech Stack:** Markdown (skill files), Git

---

### Task 1: Update chester-figure-out — branch creation and checkpoint commit

**Files:**
- Modify: `chester-figure-out/SKILL.md`

This is the most significant change. The branch/worktree creation moves from chester-write-code to here, and the output directory creation is deferred from Phase 1 to Phase 4 (since the worktree doesn't exist yet during Phase 1).

- [ ] **Step 1: Update Phase 1 — defer directory creation**

In the `## Phase 1: Administrative Setup` section, change the directory creation step. The output directory **path** is still chosen in Phase 1, but the directories are **not created on disk** until Phase 4 (after the worktree exists).

Find this text in Phase 1:
```
- Create the root directory with four subdirectories: `design/`, `spec/`, `plan/`, `summary/`
```

Replace with:
```
- Record the chosen output directory path (directories are created in Phase 4 after the worktree is set up)
```

- [ ] **Step 2: Update Phase 4 Closure — insert worktree creation and directory setup**

Replace the current Phase 4 Closure steps (lines 148-156) with the following expanded sequence:

Find:
```markdown
## Phase 4: Closure

1. `get_thinking_summary()` to produce the consolidated decision history
2. Reformat the thinking summary into a clean document and write to `{output_dir}/design/{sprint-name}-thinking-00.md` — this captures HOW decisions were made (stages, revisions, confidence scores, cross-references)
3. Present the completed design brief to the user — each decision with conclusion and rationale
4. "Does this capture what we're building?"
5. Write design brief to `{output_dir}/design/{sprint-name}-design-00.md` — this captures WHAT we're building (resolved decisions, architecture, constraints)
6. Commit both documents to git
7. Transition to chester-build-spec
```

Replace with:
```markdown
## Phase 4: Closure

1. `get_thinking_summary()` to produce the consolidated decision history
2. Reformat the thinking summary into a clean document — this captures HOW decisions were made (stages, revisions, confidence scores, cross-references). Hold in memory; do not write to disk yet.
3. Present the completed design brief to the user — each decision with conclusion and rationale
4. "Does this capture what we're building?"
5. Invoke `chester-make-worktree` to create the branch and worktree. The branch name follows the sprint naming convention: `sprint-NNN-descriptive-slug`. Auto-detect NNN by scanning existing branches for the highest sprint number and incrementing.
6. Create the output directory structure in the worktree: `{output_dir}/design/`, `{output_dir}/spec/`, `{output_dir}/plan/`, `{output_dir}/summary/`
7. Write thinking summary to `{output_dir}/design/{sprint-name}-thinking-00.md`
8. Write design brief to `{output_dir}/design/{sprint-name}-design-00.md` — this captures WHAT we're building (resolved decisions, architecture, constraints)
9. Commit both documents with message: `checkpoint: design complete`
10. Transition to chester-build-spec
```

- [ ] **Step 3: Verify the edit**

Read `chester-figure-out/SKILL.md` and confirm:
- Phase 1 no longer creates directories on disk
- Phase 4 step 5 invokes chester-make-worktree
- Phase 4 step 6 creates directories in the worktree
- Phase 4 step 9 commits with `checkpoint: design complete`
- Phase 4 step 10 transitions to chester-build-spec

- [ ] **Step 4: Commit**

```bash
git add chester-figure-out/SKILL.md
git commit -m "refactor: move branch creation to figure-out Phase 4 and add checkpoint commit"
```

---

### Task 2: Update chester-build-spec — add checkpoint commit

**Files:**
- Modify: `chester-build-spec/SKILL.md`

- [ ] **Step 1: Add checkpoint commit to checklist**

In the `## Checklist` section, the current step 6 is:
```
6. **Transition** — invoke chester-build-plan
```

Insert a new step 6 and renumber:
```
6. **Commit spec** — commit the approved spec with message `checkpoint: spec approved`
7. **Transition** — invoke chester-build-plan
```

- [ ] **Step 2: Add commit instructions after User Review Gate**

After the User Review Gate section (after "Only proceed once the user approves."), add:

```markdown
## Commit Approved Spec

After the user approves the spec:

```bash
git add {output_dir}/spec/{sprint-name}-spec-*.md
git commit -m "checkpoint: spec approved"
```

This checkpoint marks the transition from specification to planning.
```

- [ ] **Step 3: Verify the edit**

Read `chester-build-spec/SKILL.md` and confirm:
- Checklist has 7 steps (was 6)
- Step 6 is the commit step
- Step 7 is the transition to build-plan
- A "Commit Approved Spec" section exists after User Review Gate

- [ ] **Step 4: Commit**

```bash
git add chester-build-spec/SKILL.md
git commit -m "feat: add checkpoint commit after spec approval"
```

---

### Task 3: Update chester-build-plan — remove "frequent commits" and add checkpoint commit

**Files:**
- Modify: `chester-build-plan/SKILL.md`

- [ ] **Step 1: Remove "Frequent commits" from Overview**

Find the overview line:
```
Write comprehensive implementation plans assuming the engineer has zero context for our codebase and questionable taste. Document everything they need to know: which files to touch for each task, code, testing, docs they might need to check, how to test it. Give them the whole plan as bite-sized tasks. DRY. YAGNI. TDD. Frequent commits.
```

Replace with:
```
Write comprehensive implementation plans assuming the engineer has zero context for our codebase and questionable taste. Document everything they need to know: which files to touch for each task, code, testing, docs they might need to check, how to test it. Give them the whole plan as bite-sized tasks. DRY. YAGNI. TDD.
```

- [ ] **Step 2: Remove "frequent commits" from Remember section**

Find:
```
- DRY, YAGNI, TDD, frequent commits
```

Replace with:
```
- DRY, YAGNI, TDD
```

- [ ] **Step 3: Add checkpoint commit to Save Plan Document section**

Find the `## Save Plan Document` section:
```markdown
## Save Plan Document

Write the plan to the correct output path (derived from spec frontmatter, or the default `docs/chester/YYYY-MM-DD-<topic-slug>/` effort directory).

After writing the plan to disk, print the full plan content to the terminal so the user can read it without opening the file.
```

Replace with:
```markdown
## Save Plan Document

Write the plan to the correct output path (derived from spec frontmatter, or the default `docs/chester/YYYY-MM-DD-<topic-slug>/` effort directory).

After writing the plan to disk, print the full plan content to the terminal so the user can read it without opening the file.

Commit the plan document (and any hardening findings) with:

```bash
git add {output_dir}/plan/
git commit -m "checkpoint: plan approved"
```
```

- [ ] **Step 4: Verify the edits**

Read `chester-build-plan/SKILL.md` and confirm:
- Overview line ends with "TDD." not "TDD. Frequent commits."
- Remember section says "DRY, YAGNI, TDD" not "DRY, YAGNI, TDD, frequent commits"
- Save Plan Document section includes the checkpoint commit

- [ ] **Step 5: Commit**

```bash
git add chester-build-plan/SKILL.md
git commit -m "refactor: remove frequent-commits directive and add plan checkpoint commit"
```

---

### Task 4: Update chester-write-code — verify existing worktree

**Files:**
- Modify: `chester-write-code/SKILL.md`

- [ ] **Step 1: Change Section 1.2 from "Set Up Worktree" to "Verify Worktree"**

Find:
```markdown
### 1.2 Set Up Worktree

- Invoke chester-make-worktree to create an isolated worktree for this work
- All implementation happens in the worktree, not the main tree
```

Replace with:
```markdown
### 1.2 Verify Worktree

- Verify that a worktree already exists (created by chester-figure-out earlier in the pipeline)
- Check: run `git worktree list` and confirm a worktree is active for the current branch
- If no worktree exists (e.g., chester-write-code invoked standalone without a prior figure-out session), invoke chester-make-worktree to create one as a fallback
- All implementation happens in the worktree, not the main tree
```

- [ ] **Step 2: Verify the edit**

Read `chester-write-code/SKILL.md` and confirm:
- Section 1.2 is titled "Verify Worktree"
- First bullet says "Verify that a worktree already exists"
- Fallback to chester-make-worktree is documented for standalone invocation

- [ ] **Step 3: Commit**

```bash
git add chester-write-code/SKILL.md
git commit -m "refactor: change write-code to verify existing worktree instead of creating one"
```

---

### Task 5: Update chester-write-code/implementer.md — add commit message format

**Files:**
- Modify: `chester-write-code/implementer.md`

- [ ] **Step 1: Add commit message format requirement to step 4**

Find the current step 4 in the "Your Job" section:
```
    4. Commit your work, then run 'git status' to verify all your changes are in the commit. If any modified files remain uncommitted, stage and commit them before proceeding to self-review.
```

Replace with:
```
    4. Commit your work using a conventional commit message format:
       - Format: `<type>: <description>` (lowercase description)
       - Types: `feat` (new functionality), `fix` (bug fix), `test` (test changes), `refactor` (restructuring), `docs` (documentation), `chore` (build/tooling)
       - Examples: `feat: add validation schema`, `fix: correct null check in handler`, `test: add edge case for empty input`
       - Do NOT include sprint names or task numbers in the commit message — the branch provides that context
       Then run 'git status' to verify all your changes are in the commit. If any modified files remain uncommitted, stage and commit them before proceeding to self-review.
```

- [ ] **Step 2: Verify the edit**

Read `chester-write-code/implementer.md` and confirm:
- Step 4 includes the format requirement
- All six types are listed
- Examples are provided
- Explicit note about not including sprint names

- [ ] **Step 3: Commit**

```bash
git add chester-write-code/implementer.md
git commit -m "feat: add conventional commit message format to implementer template"
```

---

### Task 6: Update chester-finish-plan — add checkpoints and --no-ff merge

**Files:**
- Modify: `chester-finish-plan/SKILL.md`

This task has three independent edits in the same file.

- [ ] **Step 1: Add checkpoint commit after verification steps**

After Step 2 (Verify Clean Tree) and before Step 3 (Determine Base Branch), insert a new step:

Find:
```markdown
**If output is empty or shows only untracked files (`??`):** Continue to Step 3.

### Step 3: Determine Base Branch
```

Replace with:
```markdown
**If output is empty or shows only untracked files (`??`):** Continue to Step 2.5.

### Step 2.5: Checkpoint — Execution Complete

Commit a checkpoint marking execution as complete:

```bash
git commit --allow-empty -m "checkpoint: execution complete"
```

This checkpoint uses `--allow-empty` because all implementation work is already committed — the checkpoint is a marker, not a content commit.

### Step 3: Determine Base Branch
```

- [ ] **Step 2: Change Option 1 merge to use --no-ff**

Find:
```bash
# Merge feature branch
git merge <feature-branch>
```

Replace with:
```bash
# Merge feature branch (--no-ff preserves the branch rail in commit history)
git merge --no-ff <feature-branch>
```

- [ ] **Step 3: Add artifacts checkpoint after Step 7**

Find the end of the Step 7 section:
```markdown
Every artifact produced must be both saved to disk AND written to the terminal. The user should be able to read the full content of each artifact in their terminal output without needing to open the file.

If declined, the skill completes.
```

Replace with:
```markdown
Every artifact produced must be both saved to disk AND written to the terminal. The user should be able to read the full content of each artifact in their terminal output without needing to open the file.

If artifacts were produced (options 1-4), commit them:

```bash
git add {output_dir}/summary/ {output_dir}/plan/
git commit -m "checkpoint: artifacts saved"
```

If declined, the skill completes without the artifacts checkpoint.
```

- [ ] **Step 4: Verify all three edits**

Read `chester-finish-plan/SKILL.md` and confirm:
- Step 2.5 exists with `checkpoint: execution complete` using `--allow-empty`
- Option 1 merge uses `--no-ff`
- Step 7 ends with the artifacts checkpoint commit

- [ ] **Step 5: Commit**

```bash
git add chester-finish-plan/SKILL.md
git commit -m "feat: add checkpoint commits and --no-ff merge to finish-plan"
```
