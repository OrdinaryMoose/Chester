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

## Step 2: Verify Decision-Record Linkage

After the suite passes, confirm that every decision record produced during this sprint is fully linked to its test and code. Invoke the `dr_verify_tests(current_sprint)` tool on the `chester-decision-record` MCP.

The tool returns `{sprint, per_record: [{id, test, exists, passes, sha_finalized}], aggregate: "pass" | "fail"}`. `sha_finalized=true` confirms the implementer called `dr_finalize_refs` after commit; `aggregate="pass"` means every record carries the SHA suffix and the test exists.

**If `aggregate="fail"` or any record has `sha_finalized=false` or `passes=false`:**

```
Decision-record linkage failed. Cannot mark sprint complete:

[Show failing record IDs, test names, and missing SHA fields]

Fix required:
- sha_finalized=false → re-run the task that created the record, ensure execute-write called dr_finalize_refs after commit
- passes=false → the linked test is failing; fix the code or the test
- exists=false → the referenced test is missing from the corpus; generate it via propagation-procedure
```

Stop. Resolve every failing record before continuing. Do NOT proceed to the clean-tree check until `aggregate="pass"`.

**Rationale for ordering (step 2 here, not later):** Step 1 must confirm suite-pass first so `dr_verify_tests`'s per-test status is reliable. The clean-tree check (now Step 3) comes after because fixes to broken records may produce uncommitted changes.

**If `aggregate="pass"`:** Continue.

## Step 3: Verify Clean Tree

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

## Step 4: Checkpoint

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
