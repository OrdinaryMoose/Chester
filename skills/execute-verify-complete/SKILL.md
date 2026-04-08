---
name: execute-verify-complete
description: >
  Capstone of the execute phase. Invoke after all implementation tasks are done — proves
  tests pass, verifies a clean tree, and marks execution complete with a checkpoint commit.
  This is the gate between building and finishing. Nothing past this point is about writing
  code. Use when execute-write completes all tasks, or when any implementation work is done
  and you're ready to move to the finish phase.
---

# Verify Execution Complete

The boundary between execution and finishing. After this skill runs, the code is
confirmed correct and the tree is clean. Everything downstream (document production,
archiving, branch integration) starts from this verified state.

## Step 1: Prove Tests Pass

Invoke the `execute-prove` skill. This loads the Iron Law ("no completion claims
without fresh verification evidence") and runs the full test suite.

```bash
# Run project's full test suite (detect from project type)
npm test / cargo test / pytest / go test ./...
```

Read the complete output. Confirm the pass count and zero failures. Do not summarize
or skim.

**If tests fail:** Stop. Report failures. Do not proceed to Step 2.

```
Tests failing ({N} failures). Must fix before completing:

[Show failures]

Cannot proceed until tests pass.
```

**If tests pass:** Continue.

## Step 2: Verify Clean Tree

```bash
git status --porcelain
```

**If output shows modified tracked files** (lines starting with `M`, `A`, `D`, `R`,
`C`, or `U`):

```
Uncommitted changes detected:

[Show git status output]

All implementation changes must be committed before proceeding.
```

Stop. The user must either commit the remaining changes or confirm they are unrelated
to this work. Only proceed after the user responds.

**If output is empty or shows only untracked files (`??`):** Continue.

## Step 3: Checkpoint

Commit a marker that execution is complete:

```bash
git commit --allow-empty -m "checkpoint: execution complete"
```

This uses `--allow-empty` because all implementation work is already committed. The
checkpoint is a boundary marker in the git history, not a content commit.

## What Happens Next

After this skill completes, the calling skill (`execute-write`) continues the finish
sequence automatically. This skill does not stop and ask — it returns control to
the caller which handles the remaining steps.

## Integration

- **Called by:** `execute-write` (after all tasks complete)
- **Calls:** `execute-prove` (Step 1)
- **Returns to:** `execute-write` Section 5, which handles the remaining finish sequence
