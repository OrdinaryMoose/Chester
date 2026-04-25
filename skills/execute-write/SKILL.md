---
name: execute-write
description: Use when you have a written implementation plan to execute — provides subagent-driven (recommended) or inline execution with review checkpoints
---

# execute-write

## Section 1: Common Setup

Before executing in either mode, complete these setup steps.

### 1.1 Read the Plan and Extract Tasks

- Read the implementation plan file referenced by the user
- Extract every numbered task with its full description, acceptance criteria, and dependencies
- Create a TodoWrite with one entry per task, ordered by dependency
- Mark the first task as IN_PROGRESS, all others as TODO

### 1.2 Verify Worktree

- Verify that a worktree already exists. In the canonical sequence
  (`design-large-task` | `design-small-task` → `design-specify` → `plan-build` → execute-write), the worktree is created upstream during the design phase (by `design-large-task` at Archival or `design-small-task` at Closure) and inherited through `design-specify` and `plan-build` unchanged.
- Check: run `git worktree list` and confirm a worktree is active for the current branch.
- If no worktree exists (e.g., execute-write invoked standalone without a prior design phase), invoke `util-worktree` to create one as a fallback.
- All implementation happens in the worktree, not the main tree.

### 1.3 Handle Deferred Items

When implementing a task, if something comes up that is:
- Out of scope for the current task
- A good idea but not in the plan
- A follow-up improvement
- A question for the user that doesn't block current work

**Do not act on it.** Instead:

1. Write it to a deferred items file in the `plan/` subdirectory (see `util-artifact-schema` for path conventions). Determine the sprint subdirectory from the plan file's parent path.
2. Use this format:
   - Date
   - Source task
   - Description of the deferred item
   - Why it was deferred (out of scope / not in plan / needs user input)
4. Continue with the current task

Deferred items are reviewed during finish.

## Section 2: Execution Mode — Subagent-Driven (Recommended)

This is the recommended execution mode. Each task is dispatched to a fresh subagent, then reviewed in two stages.

### 2.1 Dispatch Pattern

For each task in order:

1. **Dispatch implementer subagent** using the template at `execute-write/references/implementer.md`
   - Paste the FULL task text into the prompt — do not make the subagent read a file
   - Include all context: where this fits, dependencies, architectural constraints
   - Record BASE_SHA before dispatch (the commit before the task starts)
   - **Fork policy: forked when `CLAUDE_CODE_FORK_SUBAGENT=1`.** Implementer keeps `general-purpose`. Under fork mode, each implementer auto-forks and inherits the parent's plan + spec via cache prefix — high context fidelity, low marginal token cost across N tasks. With fork mode off, behaves as a normal subagent.

2. **Handle implementer status codes:**
   - **DONE:** Proceed to the decision-record trigger check (step 3)
   - **DONE_WITH_CONCERNS:** Read concerns, decide whether to proceed to the trigger check or re-dispatch
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

3. **Decision-Record Trigger Check and Propagation**
   - Skip if the current task's Type is `docs-producing` or `config-producing` (no skeleton diff runs for non-code tasks).
   - Read the implementer's `observable-behaviors.md` artifact (Mod 2) and the spec's skeleton manifest (`spec-skeleton` artifact type per `util-artifact-schema`).
   - Run the skeleton-coverage diff: for each observable behavior in the artifact, check whether an existing skeleton's declared boundary covers it. Behaviors with no skeleton coverage trigger FIRE.
   - On FIRE: call `dr_capture` via the `chester-decision-record` MCP with the full field set (Test = test name only, Code = file:line only — SHAs appended post-commit). Then run the propagation procedure per `references/propagation-procedure.md` (spec-clause update → spec-driven test generation via the `chester:execute-write-test-generator` subagent → full suite run via `execute-prove`). Task is BLOCKED until the suite passes including the new test(s). **Fork policy for the test generator: isolated — MANDATORY.** Named subagent never forks; forking would defeat the input restriction (no implementer code) that prevents code-fit bias.
   - After the task commits, call `dr_finalize_refs(record_id, test_sha, code_sha)` to append commit SHAs to the record's Test and Code fields. Finalize happens within the same task execution, after commit, before the task is marked DONE in TodoWrite.
   - Backward reach: failing tests on earlier-task code trigger existing BLOCKED-status handling (re-dispatch implementer scoped to failing-test files, updated spec clause as context).

4. **Dispatch spec compliance reviewer** as `chester:execute-write-spec-reviewer` (template at `execute-write/references/spec-reviewer.md`)
   - Provide the full task requirements AND the implementer's report
   - Include BASE_SHA and HEAD_SHA for commit verification
   - If reviewer finds issues: fix them (re-dispatch implementer or fix inline) and re-review
   - **Fork policy: isolated.** Named subagent — never forks. Independence from the implementer's framing is the safeguard.

5. **Dispatch code quality reviewer** as `chester:execute-write-quality-reviewer` (template at `execute-write/references/quality-reviewer.md`)
   - Only dispatch after spec compliance passes
   - Handle severity-based results:
     - **Critical:** Must fix before proceeding
     - **Important:** Should fix; use judgment on whether to fix now or defer
     - **Minor:** Note and move on
   - **Fork policy: isolated.** Named subagent — never forks.

6. **Record HEAD_SHA** after task is complete and all reviews pass
7. **Update TodoWrite** — mark task DONE, move next task to IN_PROGRESS

### 2.2 Model Selection Guidance

- Use the most capable model available for complex tasks (architectural decisions, multi-file changes, integration work)
- Standard models work well for focused, single-file tasks with clear specs
- When an implementer reports BLOCKED or NEEDS_CONTEXT repeatedly, consider re-dispatching with a more capable model

### 2.3 Fresh Subagent Per Task

Each implementer subagent should be fresh — do not reuse a subagent across tasks. This ensures:
- Clean context without accumulated confusion
- Independent verification of each task
- Clear separation of concerns

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

Use the template at `execute-write/references/code-reviewer.md` with:
- WHAT_WAS_IMPLEMENTED: summary of all completed tasks
- PLAN_OR_REQUIREMENTS: reference to the plan file
- BASE_SHA: commit before first task
- HEAD_SHA: current commit
- DESCRIPTION: high-level summary of the implementation

**Fork policy: forked when `CLAUDE_CODE_FORK_SUBAGENT=1`.** Full code review keeps `general-purpose`. Cache-prefix reuse over the BASE_SHA..HEAD_SHA range is high-value; bias risk from inheriting the cumulative "we built it well" narrative is mitigated because the reviewer reads the actual diff.

### 4.3 Severity-Based Action

Handle code reviewer findings by severity:
- **Critical (Must Fix):** Fix before proceeding. These are bugs, security issues, data loss risks, or broken functionality.
- **Important (Should Fix):** Fix now if feasible. Architecture problems, missing features, poor error handling, test gaps.
- **Minor (Nice to Have):** Note for future improvement. Code style, optimization opportunities, documentation.

## Section 5: Completion

**AUTOMATIC — do not ask permission, do not present as a menu.** When all tasks are
complete and reviews pass, immediately begin the finish sequence. Do not list these
steps and ask "Want to proceed?" — just proceed.

1. **Invoke `execute-verify-complete`** — proves tests pass, verifies clean tree, checkpoints.
   This is not optional. Run it now.

2. **Ask the user about session records:**
   ```
   Would you like session records before archiving?

   1. Session summary + reasoning audit
   2. Session summary only
   3. Skip — archive and close
   ```
   If the user chooses 1 or 2, invoke `finish-write-records`. If 3, proceed directly.

3. **Invoke `finish-archive-artifacts`** — copy everything in working dir to plans dir.

4. **Invoke `finish-close-worktree`** — branch integration and cleanup.

## Integration

- **Invoked by:** `plan-build` (primary, end of its Execution Handoff), or user directly (standalone — must point to an existing plan).
- **Transitions to:** Section 5 finish sequence, in order:
  1. `execute-verify-complete` (mandatory — proves tests, clean tree, checkpoint commit)
  2. `finish-write-records` (optional — user-prompted at Section 5 step 2)
  3. `finish-archive-artifacts` (mandatory — copies working dir to plans dir)
  4. `finish-close-worktree` (mandatory — branch integration, worktree cleanup)
- **Required sub-skills:**
  - `util-worktree` — verifies existing worktree; creates one as fallback for standalone invocation
  - `execute-verify-complete` — called after all tasks complete
  - `finish-archive-artifacts` — archives sprint artifacts
  - `finish-close-worktree` — branch integration and cleanup
- **Optional sub-skills:**
  - `finish-write-records` — session summary and reasoning audit
  - `execute-test` — can be invoked per task when TDD is required by the plan
  - `execute-prove` — can be invoked per task for verification checkpoints
- **Reads:** `util-artifact-schema` (for deferred items path)
- **Template files** (in `references/`):
  - `implementer.md` — prompt template for implementer subagents
  - `spec-reviewer.md` — prompt template for spec compliance review subagents
  - `quality-reviewer.md` — prompt template for code quality review subagents
  - `code-reviewer.md` — prompt template for full code review subagents

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

**From completion:**
- Listing the finish sequence steps and asking "Want to proceed?" — the sequence is automatic
- Skipping finish-write-records without asking the user
- Not invoking execute-verify-complete at all

**From the decision-record loop:**
- Marking a task DONE without running the decision-record trigger check step, or without the suite — including any new propagation-generated tests — passing.

**General:**
- Acting on deferred items instead of writing them down
- Continuing past a BLOCKED status without resolving the blocker
- Not committing after each task (makes review and rollback harder)
- Guessing at requirements instead of asking for clarification
