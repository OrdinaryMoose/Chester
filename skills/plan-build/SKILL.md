---
name: plan-build
description: Use when you have a spec or requirements for a multi-step task, before touching code
---

# Chester Build Plan

## Budget Guard

Run the budget guard check (see `util-budget-guard`) at skill entry and again before dispatching plan-attack and plan-smell during Plan Hardening — those are expensive parallel subagent calls.

## Overview

Write comprehensive implementation plans assuming the engineer has zero context for our codebase and questionable taste. Document everything they need to know: which files to touch for each task, code, testing, docs they might need to check, how to test it. Give them the whole plan as bite-sized tasks. DRY. YAGNI. TDD.

Assume they are a skilled developer, but know almost nothing about our toolset or problem domain. Assume they don't know good test design very well.

## Dynamic Progress Tracking

Use TaskCreate/TaskUpdate to give the user real-time visibility into your progress. This is for user awareness only — it does not constrain your workflow.

**Task reset (do first, do not track):** Before creating any tasks, call TaskList. If any tasks exist from a previous skill (e.g., design-figure-out), delete them all via TaskUpdate with status: `deleted`. This is housekeeping — do not create a tracked task for it.

**Starting tasks:** After the reset, create one task for each of these phases via TaskCreate:

1. **Read spec and extract metadata** — read the spec document, read project config via chester-config-read.sh
2. **Scope check** — verify single-plan scope; flag for decomposition if multiple independent subsystems
3. **Explore existing codebase** — read files referenced in spec to understand current state
4. **Map file structure** — design which files get created, modified, and tested; lock in decomposition
5. **Write plan tasks** — write each task with TDD steps, file paths, code, and commands
6. **Plan review loop** — dispatch plan-reviewer subagent; iterate until approved (max 3)
7. **Plan hardening** — run plan-attack + plan-smell reviews, incorporate findings
8. **Save plan document** — write to correct output path based on project config

**As you work:**
- Mark each task `in_progress` when you begin it, `completed` when you finish
- If complexity demands it, add new tasks to reflect reality (e.g., "Write Task 3: Auth middleware" as a sub-task of "Write plan tasks")
- Never delete or remove tasks — once created, a task stays on the list and must reach `completed`
- Task subjects should be short, descriptive actions

**Granularity guidance:**
- The 8 starting tasks are the baseline
- When writing plan tasks, you may optionally create one sub-task per plan task if the plan has many tasks, to give finer-grained progress — use your judgment based on plan size

**Context:** This should be run in a dedicated worktree (created by design-figure-out skill).

**Save plans to:** the `plan/` subdirectory. Inherit the sprint subdirectory from the spec's directory path. See `util-artifact-schema` for naming and path conventions.

The plan is NOT committed here — `finish-archive-artifacts` copies all artifacts into the worktree for merge.

## Scope Check

If the spec covers multiple independent subsystems, it should have been broken into sub-project specs during design-figure-out. If it wasn't, suggest breaking this into separate plans — one per subsystem. Each plan should produce working, testable software on its own.

## File Structure

Before defining tasks, map out which files will be created or modified and what each one is responsible for. This is where decomposition decisions get locked in.

- Design units with clear boundaries and well-defined interfaces. Each file should have one clear responsibility.
- You reason best about code you can hold in context at once, and your edits are more reliable when files are focused. Prefer smaller, focused files over large ones that do too much.
- Files that change together should live together. Split by responsibility, not by technical layer.
- In existing codebases, follow established patterns. If the codebase uses large files, don't unilaterally restructure - but if a file you're modifying has grown unwieldy, including a split in the plan is reasonable.

This structure informs the task decomposition. Each task should produce self-contained changes that make sense independently.

## Bite-Sized Task Granularity

**think gate (per task):** Before writing each numbered task block, ask this question,
think about the result, and implement the findings:
  "Does this task's file list match the locked file structure from the mapping
   step? Are the TDD steps granular enough? Does this task assume any output
   from a later task (ordering hazard)? Is the code in the task complete and
   not a stub?"

If any check fails, resolve it before writing the task. Do not rely on the
review loop to catch structural drift that can be caught here.

**Each step is one action (2-5 minutes):**
- "Write the failing test" - step
- "Run it to make sure it fails" - step
- "Implement the minimal code to make the test pass" - step
- "Run the tests and make sure they pass" - step
- "Commit" - step

## Plan Document Header

**Every plan MUST start with this header:**

```markdown
# [Feature Name] Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use execute-write (recommended) or execute-write in inline mode to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

---
```

## Task Structure

````markdown
### Task N: [Component Name]

**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/to/test.py`

- [ ] **Step 1: Write the failing test**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/path/test.py::test_name -v`
Expected: FAIL with "function not defined"

- [ ] **Step 3: Write minimal implementation**

```python
def function(input):
    return expected
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/path/test.py::test_name -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/path/test.py src/path/file.py
git commit -m "feat: add specific feature"
```
````

## Remember
- Exact file paths always
- Complete code in plan (not "add validation")
- Exact commands with expected output
- Reference relevant skills with @ syntax
- DRY, YAGNI, TDD

## Plan Review Loop

**Review purpose: Spec Fidelity** — does the plan faithfully implement the spec's requirements?

After writing the complete plan:

1. Dispatch a single plan-reviewer subagent (see plan-reviewer.md) with precisely crafted review context — never your session history. This keeps the reviewer focused on the plan, not your thought process.
   - Provide: path to the plan document, path to spec document
2. If Issues Found: fix the issues, re-dispatch reviewer for the whole plan
3. If Approved: proceed to plan hardening

**Review loop guidance:**
- Same agent that wrote the plan fixes it (preserves context)
- If loop exceeds 3 iterations, surface to human for guidance
- Reviewers are advisory — explain disagreements if you believe feedback is incorrect

## Plan Hardening

**MANDATORY GATE: This step runs automatically after the plan review loop completes. Do not skip.**

After the plan review loop approves the plan:

1. Launch plan-attack and plan-smell in parallel against the plan
2. Wait for both to complete
3. Read both reports and synthesize a single combined implementation risk level — this is a judgment call, not a formula. Consider how findings from both reports interact and compound.
4. Present to the human:
   - The combined implementation risk level (Low / Moderate / Significant / High)
   - 3-5 statements explaining why this level was chosen
   - The human's four options: proceed, proceed with directed mitigations, return to design with additional requirements, or stop
5. Write the combined threat report to the `plan/` subdirectory as `{sprint-name}-plan-threat-report-00.md` (see `util-artifact-schema`).
6. Wait for the human's decision. Do not auto-trigger any action.

## Save Plan Document

Write the plan to the `plan/` subdirectory (see `util-artifact-schema` for the exact path). The plan remains in the working directory (gitignored). `finish-archive-artifacts` copies all artifacts into the worktree for merge.

## Execution Handoff

Plan complete and hardened. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration. Uses execute-write.

**2. Inline Execution** - Execute tasks in this session with checkpoints. Uses execute-write in inline mode.

Which approach?

## Integration

- **Invoked by:** `design-specify` (primary), or user directly (standalone)
- **Calls:** `plan-attack` + `plan-smell` (parallel, during plan hardening)
- **Reads:** `util-artifact-schema` (naming/paths), `util-budget-guard`
- **Transitions to:** `execute-write` (subagent or inline mode)
- **Does NOT call:** `start-bootstrap` (inherits sprint context from upstream spec)
