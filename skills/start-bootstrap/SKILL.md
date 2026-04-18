---
name: start-bootstrap
description: >
  Mechanical session setup for pipeline skills. Invoke this skill at the start of any
  pipeline skill that needs a sprint context — config reading, sprint naming, directory
  creation, task reset, and thinking history initialization. Called by design-experimental
  and execute-write (standalone).
---

# Session Bootstrap

Sets up the sprint context that pipeline skills need before they can do their actual work.
This is mechanical infrastructure — no design decisions, no creative work. The calling
skill resumes with a fully prepared sprint environment.

## When to Call

- **Always:** `design-experimental` (starts fresh sprints)
- **Standalone only:** `execute-write` (when invoked without a prior
  design phase, it needs sprint context created; when invoked mid-pipeline, sprint
  context already exists)

## What It Does

### Step 1: Read Project Config

```bash
eval "$(chester-config-read)"
```

If `CHESTER_CONFIG_PATH` is `none`, warn: "No Chester config found. Run setup-start
first or accept defaults." Use defaults from `util-artifact-schema`.

### Step 2: Run Budget Guard

Follow the procedure in `util-budget-guard`.

### Step 3: Reset Tasks

Clear any tasks left over from a previous skill:

1. Call `TaskList`
2. If any tasks exist, delete them all via `TaskUpdate` with status `deleted`

This is housekeeping — the calling skill will create its own tasks after bootstrap completes.

### Step 4: Establish Sprint Name

Derive a three-word verb-noun-noun sprint name from the user's intent (lowercase,
hyphenated — the verb is the action, the two nouns are the target). Construct the
sprint subdirectory name following `util-artifact-schema`:

**Format:** `YYYYMMDD-##-verb-noun-noun`

Find the next sequence number:
```bash
ls "$CHESTER_WORKING_DIR/" 2>/dev/null | grep "^$(date +%Y%m%d)" | sort | tail -1
```

If no directories exist for today, use `01`.

### Step 5: Create Working Directory

```bash
mkdir -p "{CHESTER_WORKING_DIR}/{sprint-subdir}/design" \
         "{CHESTER_WORKING_DIR}/{sprint-subdir}/spec" \
         "{CHESTER_WORKING_DIR}/{sprint-subdir}/plan" \
         "{CHESTER_WORKING_DIR}/{sprint-subdir}/summary"
```

### Step 5b: Write Active Sprint Breadcrumb

Write the sprint subdirectory name to a breadcrumb file so that compaction hooks can discover the active sprint without conversation context:

```bash
echo "{sprint-subdir}" > "{CHESTER_WORKING_DIR}/.active-sprint"
```

This file is read by `pre-compact.sh` and `post-compact.sh` to locate MCP state files during compaction events.

### Step 6: Initialize Thinking History

1. Call `clear_thinking_history()` to reset structured thinking for the session
2. Read `~/.chester/thinking.md` if it exists — identify the top 5 highest-scoring
   lessons. These are held in memory for per-turn lesson injection during the interview
   (see "Per-Turn Lesson Injection" in the design skills). If the file has fewer than 5
   entries, use all of them. If the file does not exist, continue without it.

## What It Returns

After bootstrap completes, the calling skill has:

- `CHESTER_WORKING_DIR` — absolute path to gitignored working directory
- `CHESTER_PLANS_DIR` — relative path to tracked plans directory
- Sprint subdirectory name (e.g., `20260407-01-strip-console-reports`)
- Sprint name (three-word portion: `strip-console-reports`)
- Clean task list
- Fresh thinking history with lessons loaded
- `.active-sprint` breadcrumb file pointing to the current sprint

The calling skill is responsible for creating its own tasks and beginning its work.
