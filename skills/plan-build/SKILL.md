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

**Task reset (do first, do not track):** Before creating any tasks, call TaskList. If any tasks exist from a previous skill (e.g., design-experimental), delete them all via TaskUpdate with status: `deleted`. This is housekeeping — do not create a tracked task for it.

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

**Context:** This should be run in a dedicated worktree (created by `design-experimental` or `design-small-task` during their Archival / closure stage).

**Save plans to:** the `plan/` subdirectory. Inherit the sprint subdirectory from the spec's directory path. See `util-artifact-schema` for naming and path conventions.

The plan is NOT committed here — `finish-archive-artifacts` copies all artifacts into the worktree for merge.

## Scope Check

If the brief covers multiple independent subsystems, it should have been broken into sub-project briefs during the design phase (design-experimental's proof loop, or design-small-task's conversation). If it wasn't, suggest breaking this into separate plans — one per subsystem. Each plan should produce working, testable software on its own.

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

## Smell Heuristic Pre-Check

Before the Plan Hardening dispatch, run a cheap keyword pre-check on the plan text
to decide whether `plan-smell` fires. `plan-attack` is unconditional — it runs every
hardening pass. `plan-smell`'s value is concentrated in sprints that introduce
composition, lifetimes, or persistence pathways (per the 18-sprint retrospective at
`docs/plan-hardening-effectiveness.md`); on mechanical refactors and bounded cleanups
it produces mostly polish. Conditional invocation preserves the signal and saves a
subagent dispatch on non-triggering sprints.

### Procedure

1. Read the plan text.
2. Match case-insensitively against the five trigger categories below. If any match,
   `plan-smell` fires in parallel with `plan-attack`. If no match, `plan-smell` is
   skipped and `plan-attack` runs alone.
3. Include the list of matched triggers verbatim in the combined threat report so
   the designer sees why smell fired (or didn't).

### Trigger Categories

The list is deliberately inclusive. False positives cost one extra parallel dispatch;
misses cost an uncaught real bug. Tune toward over-firing.

**DI registrations:** `AddScoped`, `AddSingleton`, `AddTransient`, `services.Add`,
`IServiceCollection`, `composition root`

**New abstractions:** `new interface`, `abstract class`, `new service class`,
`public interface I[A-Z]`, `public abstract`

**Async / concurrency primitives:** `async`, `await`, `Task.`, `Task<`,
`SemaphoreSlim`, `Semaphore`, `lock (`, `Interlocked.`, `ConcurrentDictionary`,
`ConcurrentBag`, `Channel<`

**New persistence pathways:** `SaveAsync`, `DbContext`, `IRepository`, `Repository`,
`sqlite`, `persistence`, `IDbConnection`, `SqlConnection`, `serialize`, `deserialize`

**New contract surfaces:** `new contract`, `new DTO`, `new record`, `public record`,
`public class.*Dto`, `boundary contract`

When adding new triggers, keep the category split and the inclusive bias.

---

## Ground-Truth Report Cascade

When plan-build is invoked after `design-experimental`, the design directory
contains a ground-truth report produced at Envelope Handoff. The report verifies
EVIDENCE claims the design rests on and is a trusted input at the plan stage.

### Input Contract

If the current sprint's `design/` subdirectory contains files matching
`*-ground-truth-report-*.md`, read the **highest-numbered version** (the latest
revision per `util-artifact-schema` versioning — `-01.md` wins over `-00.md`, etc.).
Extract the list of verified anchors — file paths, type names, method names that
the ground-truth subagent confirmed exist as the design describes. This list
becomes the **verified-anchor skip-list**.

If no ground-truth report exists (e.g., the design came from `design-small-task`),
skip this cascade. `plan-attack` performs its own full codebase verification in
that case.

**Error-path handling.** If the ground-truth report exists but contains zero
verified anchors (all findings are NOT-FOUND or UNVERIFIABLE, or all anchors are
`null`), pass an empty skip-list to `plan-attack`. Do not skip the cascade
entirely — the empty skip-list tells `plan-attack` that the foundation check ran
but produced no trusted anchors, which is different from "no design-stage
verification was performed." Note this condition in the combined threat report so
the designer sees that the ground-truth pass produced no usable trust boundary.

### Passing the Skip-List to plan-attack

When dispatching `plan-attack`, include the verified-anchor skip-list in the prompt
with this instruction: "The following anchors were verified against the codebase at
the design stage. Treat them as trusted (do NOT re-verify) unless the plan text
explicitly modifies them (create, rename, refactor, delete). Anchors the plan
references but does not modify are trusted. Anchors the plan modifies are
re-verified against the plan's claims."

This narrows `plan-attack`'s scope to plan-specific additions without losing
coverage. Anchors introduced or changed by the plan are still re-verified.

If the plan text modifies a verified anchor, note that in the plan-attack prompt
explicitly — the subagent must understand which anchors moved from "trusted" to
"re-verify."

---

## Plan Hardening

**MANDATORY GATE: This step runs automatically after the plan review loop completes. Do not skip.**

After the plan review loop approves the plan:

1. Read the skill files `plan-attack/SKILL.md` and `plan-smell/SKILL.md` from the Chester skills directory
2. Consult the Smell Heuristic Pre-Check result. If smell did NOT trigger, dispatch
   only `plan-attack`. If smell DID trigger, dispatch `plan-attack` and `plan-smell`
   in parallel in a single message.

   For each dispatched subagent:
   - Embed the full skill instructions from the SKILL.md you just read into the Agent prompt
   - Include the plan file path so the subagent knows what to review
   - For `plan-attack`: include the verified-anchor skip-list (from the Ground-Truth
     Report Cascade above) and the trust-boundary instruction
   - Do NOT use `feature-dev:code-reviewer` or any other subagent_type — use the default general-purpose agent with the Chester skill instructions as the prompt

   When `plan-smell` is skipped, note this in the combined threat report: "Smell
   skipped — heuristic matched zero triggers. Plan-attack was sufficient for
   hardening this sprint."
3. Wait for both to complete
4. Read both reports and synthesize a single combined implementation risk level — this is a judgment call, not a formula. Consider how findings from both reports interact and compound.
5. Present to the human:
   - The combined implementation risk level (Low / Moderate / Significant / High)
   - 3-5 statements explaining why this level was chosen
   - The human's four options: proceed, proceed with directed mitigations, return to design with additional requirements, or stop
6. Write the combined threat report to the `plan/` subdirectory as `{sprint-name}-plan-threat-report-00.md` (see `util-artifact-schema`).
7. Wait for the human's decision. Do not auto-trigger any action.

## Save Plan Document

Write the plan to the `plan/` subdirectory (see `util-artifact-schema` for the exact path). The plan remains in the working directory (gitignored). `finish-archive-artifacts` copies all artifacts into the worktree for merge.

## Execution Handoff

Plan complete and hardened. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration. Uses execute-write.

**2. Inline Execution** - Execute tasks in this session with checkpoints. Uses execute-write in inline mode.

Which approach?

## Integration

- **Invoked by:** `design-experimental` (primary — with ground-truth report cascade), `design-small-task` (bounded briefs — no cascade), or user directly (standalone)
- **Calls:** `plan-attack` (unconditional), `plan-smell` (conditional — only when Smell Heuristic Pre-Check matches)
- **Reads:** `util-artifact-schema` (naming/paths), `util-budget-guard`, ground-truth report from upstream `design/` subdirectory (when present)
- **Transitions to:** `execute-write` (subagent or inline mode)
- **Does NOT call:** `start-bootstrap` (inherits sprint context from upstream design)
- **Brief compatibility:** reads nine-section briefs from `design-experimental` and six-section briefs from `design-small-task` by section heading; no branching on source skill
