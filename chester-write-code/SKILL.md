---
name: chester-write-code
description: Use when you have a written implementation plan to execute — provides subagent-driven (recommended) or inline execution with review checkpoints
---

# chester-write-code

## Budget Guard Check

Before proceeding with this skill, check the token budget:

1. Run: `cat ~/.claude/usage.json 2>/dev/null | jq -r '.five_hour_used_pct // empty'`
2. If the file is missing or the command fails: log "Budget guard: usage data unavailable" and continue
3. If the file exists, check staleness via `.timestamp` — if more than 60 seconds old, log "Budget guard: usage data stale" and continue
4. Read threshold: `cat ~/.claude/settings.chester.json 2>/dev/null | jq -r '.budget_guard.threshold_percent // 85'`
5. If `five_hour_used_pct >= threshold`: **STOP** and display the pause-and-report, then wait for user response
6. If below threshold: continue normally

**Pause-and-report format:**

> **Budget Guard — Pausing**
>
> **5-hour usage:** {pct}% (threshold: {threshold}%)
> **Resets in:** {countdown from five_hour_resets_at}
>
> **Completed tasks:** {list}
> **Current task:** {current}
> **Remaining tasks:** {list}
>
> **Options:** (1) Continue anyway, (2) Stop here, (3) Other

**Per-task check:** Also run this budget guard check before dispatching each task's implementer subagent (see Section 2.1 step 0 below). This catches budget breaches between tasks during long implementation runs.

Announce: "I'm using the chester-write-code skill to implement this plan."

## Section 1: Common Setup

Before executing in either mode, complete these setup steps.

### 1.1 Read the Plan and Extract Tasks

- Read the implementation plan file referenced by the user
- Extract every numbered task with its full description, acceptance criteria, and dependencies
- Create a TodoWrite with one entry per task, ordered by dependency
- Mark the first task as IN_PROGRESS, all others as TODO

### 1.2 Verify Worktree

- Verify that a worktree already exists (created by chester-figure-out earlier in the pipeline)
- Check: run `git worktree list` and confirm a worktree is active for the current branch
- If no worktree exists (e.g., chester-write-code invoked standalone without a prior figure-out session), invoke chester-make-worktree to create one as a fallback
- All implementation happens in the worktree, not the main tree

### 1.3 Handle Deferred Items

When implementing a task, if something comes up that is:
- Out of scope for the current task
- A good idea but not in the plan
- A follow-up improvement
- A question for the user that doesn't block current work

**Do not act on it.** Instead:

Read project config:
```bash
eval "$(~/.claude/skills/chester-hooks/chester-config-read.sh)"
```

Determine the sprint subdirectory from the plan file's parent path.

1. Write it to a deferred items file at `{CHESTER_PLANS_DIR}/{sprint-subdir}/plan/{sprint-name}-deferred.md`
2. Copy to `{CHESTER_WORK_DIR}/{sprint-subdir}/plan/{sprint-name}-deferred.md`
3. Use this format:
   - Date
   - Source task
   - Description of the deferred item
   - Why it was deferred (out of scope / not in plan / needs user input)
4. Continue with the current task
5. Print the deferred item to terminal output so the user can see it immediately

Deferred items are reviewed during chester-finish-plan.

## Section 2: Execution Mode — Subagent-Driven (Recommended)

This is the recommended execution mode. Each task is dispatched to a fresh subagent, then reviewed in two stages.

### 2.1 Dispatch Pattern

For each task in order:

0. **Budget guard check** — Before dispatching this task's implementer, run the budget guard check (see Budget Guard Check section above). If PAUSE is triggered, report progress using the current task list and wait for user decision. If CONTINUE, proceed to dispatch.

1. **Dispatch implementer subagent** using the template at `chester-write-code/implementer.md`
   - Paste the FULL task text into the prompt — do not make the subagent read a file
   - Include all context: where this fits, dependencies, architectural constraints
   - Record BASE_SHA before dispatch (the commit before the task starts)

2. **Handle implementer status codes:**
   - **DONE:** Proceed to spec review (step 3)
   - **DONE_WITH_CONCERNS:** Read concerns, decide whether to proceed to review or re-dispatch
   - **NEEDS_CONTEXT:** Provide the requested context and re-dispatch
   - **BLOCKED:** Assess the blocker. Either resolve it and re-dispatch, restructure the task, or escalate to the user

   **think gate (non-DONE status codes only):** Before deciding how to respond
   to BLOCKED, NEEDS_CONTEXT, or DONE_WITH_CONCERNS, ask this question, think about the
   result, and implement the findings:
     "What did the implementer actually attempt before stopping? Is the issue a
      plan flaw (escalate or restructure) or a context gap (provide and
      re-dispatch)? What is the minimum resolution that unblocks this task
      without touching adjacent tasks?"

   Do not default to re-dispatch. The think gate conclusion is the basis for
   the chosen response.

3. **Dispatch spec compliance reviewer** using the template at `chester-write-code/spec-reviewer.md`
   - Provide the full task requirements AND the implementer's report
   - Include BASE_SHA and HEAD_SHA for commit verification
   - If reviewer finds issues: fix them (re-dispatch implementer or fix inline) and re-review

4. **Dispatch code quality reviewer** using the template at `chester-write-code/quality-reviewer.md`
   - Only dispatch after spec compliance passes
   - Handle severity-based results:
     - **Critical:** Must fix before proceeding
     - **Important:** Should fix; use judgment on whether to fix now or defer
     - **Minor:** Note and move on

5. **Record HEAD_SHA** after task is complete and all reviews pass
6. **Update TodoWrite** — mark task DONE, move next task to IN_PROGRESS

### 2.2 Model Selection Guidance

- Use the most capable model available for complex tasks (architectural decisions, multi-file changes, integration work)
- Standard models work well for focused, single-file tasks with clear specs
- When an implementer reports BLOCKED or NEEDS_CONTEXT repeatedly, consider re-dispatching with a more capable model

### 2.3 Fresh Subagent Per Task

Each implementer subagent should be fresh — do not reuse a subagent across tasks. This ensures:
- Clean context without accumulated confusion
- Independent verification of each task
- Clear separation of concerns

### 2.4 Diagnostic Logging (Debug Mode Only)

Use the `~/.claude/chester-log-usage.sh` script to log token usage deltas. The script handles debug flag detection internally — it does nothing if debug mode is not active.

Determine the log path once at skill entry:
- If a sprint directory exists: `LOG="{sprint-dir}/summary/token-usage-log.md"`
- Otherwise: `LOG="$HOME/.claude/chester-usage.log"`

**For each task, run these commands around each dispatch:**

```bash
# Before implementer dispatch
~/.claude/chester-log-usage.sh before "write-code" "task-{N} implementer" "$LOG"
# ... dispatch implementer ...
# After implementer returns
~/.claude/chester-log-usage.sh after "write-code" "task-{N} implementer" "$LOG"

# Before spec review
~/.claude/chester-log-usage.sh before "write-code" "task-{N} spec-review" "$LOG"
# ... dispatch spec reviewer ...
~/.claude/chester-log-usage.sh after "write-code" "task-{N} spec-review" "$LOG"

# Before quality review
~/.claude/chester-log-usage.sh before "write-code" "task-{N} quality-review" "$LOG"
# ... dispatch quality reviewer ...
~/.claude/chester-log-usage.sh after "write-code" "task-{N} quality-review" "$LOG"
```

Replace `{N}` with the task number and `{sprint-dir}` with the actual path.

## Section 3: Execution Mode — Inline

Use this mode when subagent dispatch is not available or for simple plans with few tasks.

### 3.1 Sequential Execution

For each task in order:

1. Read the task description and acceptance criteria
2. Implement the task
3. Write tests (following TDD if the plan requires it)
4. Run tests and verify they pass
5. Run the full build to check for regressions
6. Commit the work
7. Run `git status` to verify all changes are committed
8. Update TodoWrite — mark task DONE, move next to IN_PROGRESS

### 3.2 When to Stop and Ask for Help

**Stop and ask the user when:**
- A task requires architectural decisions with multiple valid approaches
- You encounter code that contradicts the plan's assumptions
- A dependency from a previous task doesn't work as expected
- You're unsure whether your approach matches the plan's intent
- The build breaks in ways unrelated to your current task

### 3.3 When to Revisit Earlier Steps

**Go back and fix earlier work when:**
- A later task reveals a flaw in an earlier implementation
- Tests from a later task fail because of an earlier task's code
- You realize an earlier task's approach won't support upcoming tasks

When revisiting: fix the issue, re-run all tests, update the commit, and note what changed and why.

## Section 4: Code Review Dispatch

After all tasks are complete (or at any checkpoint where you want a full review), dispatch a code review.

### 4.1 Getting SHA Range

```bash
# BASE_SHA: the commit before the first task started
# HEAD_SHA: the current commit after all tasks
git log --oneline BASE_SHA..HEAD_SHA
```

### 4.2 Dispatch Code Reviewer

Use the template at `chester-write-code/code-reviewer.md` with:
- WHAT_WAS_IMPLEMENTED: summary of all completed tasks
- PLAN_OR_REQUIREMENTS: reference to the plan file
- BASE_SHA: commit before first task
- HEAD_SHA: current commit
- DESCRIPTION: high-level summary of the implementation

### 4.3 Severity-Based Action

Handle code reviewer findings by severity:
- **Critical (Must Fix):** Fix before proceeding. These are bugs, security issues, data loss risks, or broken functionality.
- **Important (Should Fix):** Fix now if feasible. Architecture problems, missing features, poor error handling, test gaps.
- **Minor (Nice to Have):** Note for future improvement. Code style, optimization opportunities, documentation.

## Section 5: Completion

After all tasks are complete and reviews pass:

- Invoke chester-finish-plan to finalize the work
- chester-finish-plan handles: final verification, branch cleanup, summary generation

## Integration

- **Required sub-skills:**
  - chester-make-worktree — verifies existing worktree from chester-figure-out; creates one as fallback for standalone invocation
  - chester-finish-plan — called after all tasks complete to finalize work
- **Referenced sub-skills:**
  - chester-test-first — can be invoked per task when TDD is required by the plan
  - chester-prove-work — can be invoked per task for verification checkpoints
- **Template files (in this skill directory):**
  - implementer.md — prompt template for implementer subagents
  - spec-reviewer.md — prompt template for spec compliance review subagents
  - quality-reviewer.md — prompt template for code quality review subagents
  - code-reviewer.md — prompt template for full code review subagents

## Red Flags

**From subagent dispatch:**
- Implementer reporting DONE suspiciously quickly on complex tasks
- Spec reviewer rubber-stamping without reading code
- Skipping spec review and going straight to code quality review
- Reusing a subagent across multiple tasks instead of dispatching fresh
- Implementer splitting or restructuring files without plan guidance

**From plan execution:**
- Skipping tests because "the code is simple"
- Making changes outside the scope of the current task
- Ignoring build failures or test failures from earlier tasks
- Not running the full build after each task
- Silently working around a plan step that doesn't make sense instead of asking

**From code review:**
- Not dispatching a code review at all
- Treating all issues as Minor to avoid fixing them
- Fixing Critical issues without re-running the review
- Skipping the review because "we already reviewed per-task"

**General:**
- Acting on deferred items instead of writing them down
- Continuing past a BLOCKED status without resolving the blocker
- Not committing after each task (makes review and rollback harder)
- Guessing at requirements instead of asking for clarification
