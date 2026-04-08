# Chester Commit Strategy Specification

## Summary

Redesign how Chester commits to git throughout the pipeline — from design through merge — to produce a readable, structured branch history that tells the story of an effort from start to finish.

## Problem

Chester's current commit strategy has three deficiencies:

1. **No branch framing.** Design, spec, and plan artifacts are committed to whatever branch the user is on (usually main). The worktree/branch isn't created until execution begins, so pipeline artifacts and implementation code are split across different branches.

2. **No phase boundaries.** There are no commits that mark pipeline transitions (design done, spec done, plan done, execution done). The commit log reads as a flat stream of changes with no structure.

3. **No consistent naming.** Commit messages vary in format across skills and subagents. There's no convention that lets a developer scan the log and immediately understand what kind of change each commit represents and which effort it belongs to.

## Scope

This spec covers changes to six Chester skills:

| Skill | Change Type |
|-------|------------|
| `chester-figure-out` | Create worktree/branch; add checkpoint commit |
| `chester-build-spec` | Add checkpoint commit |
| `chester-build-plan` | Add checkpoint commit; update task commit format |
| `chester-write-code` | Remove worktree creation; enforce commit message format |
| `chester-finish-plan` | Use regular merge (`--no-ff`); add checkpoint commits |
| `chester-make-worktree` | No structural changes; already supports earlier invocation |

## Non-Goals

- Squashing, rebasing, or any form of commit consolidation
- Automated commit message generation beyond what's specified here
- Changes to how subagents are dispatched or reviewed
- Changes to the TDD cycle or test-first discipline
- Git hooks or external tooling to enforce conventions

## Architecture

### Branch Lifecycle

The branch spans the entire effort, not just execution:

```
main ─────────────────────────────────────────────────── Merge branch 'sprint-NNN-...' ──▶
       \                                                 /
        checkpoint: design complete          ← figure-out
        checkpoint: spec approved            ← build-spec
        checkpoint: plan approved            ← build-plan
        feat: implement X                    ← write-code (subagent)
        fix: correct Y                       ← write-code (subagent)
        test: add Z tests                    ← write-code (subagent)
        checkpoint: execution complete       ← finish-plan
        docs: session summary                ← finish-plan
        docs: reasoning audit                ← finish-plan
        checkpoint: artifacts saved          ← finish-plan
```

**Branch creation:** `chester-figure-out` invokes `chester-make-worktree` during Phase 4 (Closure), after the design is approved and before committing design artifacts. The branch name follows the existing convention: `sprint-NNN-descriptive-slug`.

**Branch merge:** `chester-finish-plan` merges with `git merge --no-ff` to preserve the branch rail. Default git merge commit message. No squash, no fast-forward.

### Commit Structure

Two tiers of commits exist on the branch:

#### Tier 1: Checkpoint Commits

Checkpoint commits mark pipeline phase transitions. They use the literal word `checkpoint` followed by a colon and a self-documenting description. No sprint prefix — the branch provides that context.

**Format:** `checkpoint: <phase description>`

**Defined checkpoints:**

| Checkpoint | Committed By | When |
|-----------|-------------|------|
| `checkpoint: design complete` | chester-figure-out | After design brief and thinking summary are written |
| `checkpoint: spec approved` | chester-build-spec | After spec passes automated review and user approval |
| `checkpoint: plan approved` | chester-build-plan | After plan passes review, hardening, and user approval |
| `checkpoint: execution complete` | chester-finish-plan | After all tasks pass and tree is verified clean |
| `checkpoint: artifacts saved` | chester-finish-plan | After session summary, reasoning audit, and doc-sync are written |

Checkpoint commits may include multiple files. For example, `checkpoint: design complete` includes both the design brief and the thinking summary. The checkpoint message describes the phase, not the files.

#### Tier 2: Working Commits

Working commits are made by subagents during execution (chester-write-code). They use conventional commit type prefixes followed by a colon, a space, and a description.

**Format:** `<type>: <description>`

**Allowed types:**

| Type | When to Use |
|------|------------|
| `feat` | New functionality or capability |
| `fix` | Bug fix or correction |
| `test` | Adding or updating tests (when test is the primary change) |
| `refactor` | Code restructuring without behavior change |
| `docs` | Documentation changes (non-checkpoint) |
| `chore` | Build, tooling, or maintenance changes |

No sprint prefix on working commits — the branch provides sprint context.

**Naming hierarchy:** Big to small — type first, then description. The type categorizes the change; the description explains what specifically changed.

### Merge Strategy

**Regular merge with `--no-ff` flag** to ensure a merge commit is always created, preserving the branch rail in the commit log even if a fast-forward would be possible.

**Merge commit message:** Default git message: `Merge branch 'sprint-NNN-descriptive-slug'`. No custom message.

**Why `--no-ff`:** Without this flag, git may fast-forward the merge if main hasn't advanced, which would flatten the branch history into a straight line — losing the visual grouping that makes the commit strategy effective.

### Branch Naming

Follows the existing convention: `sprint-NNN-descriptive-slug`

- `NNN`: Zero-padded sprint number, auto-detected by scanning existing branches
- `descriptive-slug`: Lowercase, hyphenated description of the effort

Examples:
- `sprint-040-editor-viewmodel-solid`
- `sprint-041-commit-strategy-design`

## Skill Changes

### chester-figure-out

**Current behavior:** Commits design artifacts to the current branch (usually main) during Phase 4 Closure. Does not create a worktree.

**New behavior:**
1. During Phase 4 Closure, after the user approves the design:
   - Invoke `chester-make-worktree` to create the branch and worktree
   - The branch name uses the sprint naming convention: `sprint-NNN-descriptive-slug`
   - Write design brief and thinking summary to the worktree's output directory
   - Commit both with message: `checkpoint: design complete`
2. Transition to chester-build-spec (unchanged)

**Lines affected:** Phase 4 Closure steps (currently steps 5-6: "Write design brief" and "Commit both documents to git"). Insert worktree creation between user approval and file writing.

### chester-build-spec

**Current behavior:** Writes spec to output directory and commits. No checkpoint message format.

**New behavior:**
1. After spec passes automated review AND user approval:
   - Commit spec document with message: `checkpoint: spec approved`
2. Transition to chester-build-plan (unchanged)

**Addition:** Explicit commit step with checkpoint message format after user approval gate.

### chester-build-plan

**Current behavior:** Writes plan to output directory. Task templates include commit steps with messages like `git commit -m "feat: add specific feature"`. Plan header says "Frequent commits."

**New behavior:**
1. After plan passes review loop, hardening, and user approval:
   - Commit plan document (and hardening findings) with message: `checkpoint: plan approved`
2. Task template commit steps retain conventional prefix format (`feat:`, `fix:`, `test:`, `refactor:`) — this is already the correct format
3. Remove "Frequent commits" from the header and Remember section — the commit cadence is defined by the task structure, not a general directive

**Lines affected:**
- Plan Document Header (line 10): Remove "Frequent commits" from overview
- Task Structure commit step (lines 153-158): Already correct format, no change needed
- Remember section (line 166): Remove "frequent commits"
- Add commit step after plan hardening / user approval

### chester-write-code

**Current behavior:** Section 1.2 invokes `chester-make-worktree` to create an isolated worktree. Subagent implementer template (implementer.md) requires commits but doesn't enforce message format.

**New behavior:**
1. Section 1.2: Remove worktree creation. Instead, verify that a worktree already exists (created by chester-figure-out). If no worktree exists (e.g., write-code invoked standalone), fall back to creating one via chester-make-worktree.
2. Implementer template (implementer.md): Add commit message format guidance. Commit messages must use conventional type prefixes: `feat:`, `fix:`, `test:`, `refactor:`, `docs:`, `chore:`. The type comes first, then a colon, then a space, then a lowercase description.

**Lines affected:**
- Section 1.2 (lines 22-24): Change from "Invoke chester-make-worktree" to "Verify worktree exists; create only if missing"
- implementer.md step 4 (line 35): Add format requirement for commit messages

### chester-finish-plan

**Current behavior:** Verifies tests, verifies clean tree, presents 4 options, executes choice. Option 1 uses `git merge` without `--no-ff`. No checkpoint commits.

**New behavior:**
1. After Step 1 (verify tests) and Step 2 (verify clean tree): Commit with message `checkpoint: execution complete`
2. After Step 7 (session artifacts): If artifacts were produced, commit with message `checkpoint: artifacts saved`
3. Option 1 (Merge Locally): Change `git merge <feature-branch>` to `git merge --no-ff <feature-branch>`

**Lines affected:**
- Insert checkpoint commit between Step 2 and Step 3
- Step 7: Add checkpoint commit after artifacts are saved
- Option 1 (line 108): Add `--no-ff` flag

### chester-make-worktree

**No structural changes needed.** The skill already supports being called by chester-figure-out (listed in its Integration section as a caller). The branch naming convention (`sprint-NNN-descriptive-slug`) is passed in by the calling skill, not determined by make-worktree itself.

## Testing Strategy

This is a skill/documentation change, not a code change. Verification is manual:

1. **Branch lifecycle:** Run a full pipeline (figure-out → build-spec → build-plan → write-code → finish-plan) and confirm the branch is created at figure-out, not at write-code.
2. **Checkpoint commits:** After a full pipeline run, inspect `git log --oneline` on the branch and confirm all five checkpoints appear in order.
3. **Working commit format:** After execution, inspect subagent commits and confirm they all follow `<type>: <description>` format.
4. **Merge rail:** After merging to main, inspect the commit graph (e.g., in a GUI tool or `git log --graph`) and confirm the branch rail is visible.
5. **No-ff merge:** Confirm the merge commit exists even if main hasn't advanced.

## Constraints

- Chester handles all git mechanics — the user should never need to run git commands manually
- Commit conventions are enforced in skill instructions and subagent templates, not external tooling (no git hooks, no linters)
- The design must work with the existing worktree infrastructure
- No changes to the TDD cycle, subagent dispatch, or review process
