---
name: plan-build
description: Use when you have a spec or requirements for a multi-step task, before touching code
version: v0001
---

# Chester Build Plan

## Overview

Write comprehensive implementation plans assuming the engineer has zero context for our codebase and questionable taste. Document everything they need to know: which files to touch for each task, code, testing, docs they might need to check, how to test it. Give them the whole plan as bite-sized tasks. DRY. YAGNI. TDD.

Assume they are a skilled developer, but know almost nothing about our toolset or problem domain. Assume they don't know good test design very well.

## Dynamic Progress Tracking

Use TaskCreate/TaskUpdate to give the user real-time visibility into your progress. This is for user awareness only — it does not constrain your workflow.

**Task reset (do first, do not track):** Before creating any tasks, call TaskList. If any tasks exist from a previous skill (e.g., design-large-task), delete them all via TaskUpdate with status: `deleted`. This is housekeeping — do not create a tracked task for it.

**Starting tasks:** After the reset, create one task for each of these phases via TaskCreate:

1. **Read spec and extract metadata** — read the spec document, read project config via chester-config-read.sh
2. **Query decision store (plan-start)** — invoke `dr_query` on the `chester-decision-record` MCP to retrieve active decisions for this sprint; holds the content for the plan's `## Prior Decisions` section
3. **Scope check** — verify single-plan scope; flag for decomposition if multiple independent subsystems
4. **Explore existing codebase** — read files referenced in spec to understand current state
5. **Map file structure** — design which files get created, modified, and tested; lock in decomposition
6. **Write plan tasks** — write each task with TDD steps, file paths, code, and commands; derive per-task `Must remain green` from Prior Decisions whose Code touches the task's files
7. **Plan review loop** — dispatch plan-reviewer subagent; iterate until approved (max 3)
8. **Plan hardening** — run plan-attack + plan-smell reviews, incorporate findings
9. **Save plan document** — write to correct output path based on project config

**As you work:**
- Mark each task `in_progress` when you begin it, `completed` when you finish
- If complexity demands it, add new tasks to reflect reality (e.g., "Write Task 3: Auth middleware" as a sub-task of "Write plan tasks")
- Never delete or remove tasks — once created, a task stays on the list and must reach `completed`
- Task subjects should be short, descriptive actions

**Granularity guidance:**
- The 9 starting tasks are the baseline
- When writing plan tasks, you may optionally create one sub-task per plan task if the plan has many tasks, to give finer-grained progress — use your judgment based on plan size

**Context:** This should be run in a dedicated worktree (created by `design-large-task` or `design-small-task` during their Archival / closure stage).

**Save plans to:** the `plan/` subdirectory. Inherit the sprint subdirectory from the spec's directory path. See `util-artifact-schema` for naming and path conventions.

The plan is NOT committed here — `finish-archive-artifacts` copies all artifacts into the worktree for merge.

## Prior Decisions — Plan-Start Prerequisite

Before writing any task blocks, consult the decision store. This step is
mandatory — it carries forward decisions from prior sprints that still bind
this sprint's implementation and test surface.

**Procedure (at plan-start, right after reading the spec):**

1. Invoke `dr_query` via the `chester-decision-record` MCP with the current
   sprint subject and an active-only filter:

   ```
   dr_query({ sprint_subject: "<sprint-name>", status: "Active" })
   ```

   Use the spec's sprint name (e.g. `20260424-01-build-decision-loop`) as the
   `sprint_subject` match term. The call returns decision records whose
   subject or shared-component tags match this sprint.

2. Populate the plan's `## Prior Decisions` section (see
   [`references/plan-template.md`](references/plan-template.md)) with the
   returned records. Each record is written as one bullet of the form:

   ```
   **[YYYYMMDD-XXXXX]** {title} — see spec {AC-ID}. Must-remain-green: `{test_name}`.
   ```

3. If `dr_query` returns zero records, write `None.` under the section. Do
   not omit the section — its absence is indistinguishable from "forgot to
   run `dr_query`."

**Per-task field derivation.** When writing each task block, use the Prior
Decisions list as the input to the task's `Must remain green` field: any
decision whose `Code` field touches a file listed in this task's `Files`
block contributes its test name to that task's `Must remain green` list.
Each task also declares:

- **Task ID** — a stable identifier (`Task 1`, `Task 2`, …) used by
  execute-write for progress tracking and by plan-attack for cross-referencing.
- **Type** — one of `code-producing`, `docs-producing`, or `config-producing`.
  execute-write's trigger-checks key off this field (different task types
  warrant different verification gates).
- **Implements** — the list of spec acceptance-criterion IDs (e.g. `AC-1.2`,
  `AC-3.1`) this task satisfies. This is the trace back to the spec; every
  AC in the spec must be implemented by at least one task.
- **Decision budget** — an estimated count of ambiguities the implementer
  will face while executing this task. `plan-attack` flags high-budget tasks
  (roughly, > 3) as indicators of an underspecified spec — the budget lives
  in the plan so adversarial review can see it.
- **Must remain green** — test names inherited from Prior Decisions whose
  `Code` touches this task's files, plus the task's own new test.

## Scope Check

If the brief covers multiple independent subsystems, it should have been broken into sub-project briefs during the design phase (design-large-task's proof loop, or design-small-task's conversation). If it wasn't, suggest breaking this into separate plans — one per subsystem. Each plan should produce working, testable software on its own.

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

## Plan Document Structure

Read [`references/plan-template.md`](references/plan-template.md) for the exact Markdown template the plan document follows. Two parts: the document header (once at the top) and the per-task structure (repeated for each task in the plan). The reference also documents the conventions execute-write and plan-attack rely on — checkbox syntax, exact file paths, five-step TDD shape, one-commit-per-task — so changes to the template should go through that file rather than diverging here.

## Remember
- Exact file paths always
- Complete code in plan (not "add validation")
- Exact commands with expected output
- Reference relevant skills with @ syntax
- DRY, YAGNI, TDD

## Plan Review Loop

**Review purpose: Spec Fidelity** — does the plan faithfully implement the spec's requirements?

After writing the complete plan:

1. Dispatch a single `chester:plan-build-plan-reviewer` subagent (see plan-reviewer.md) with precisely crafted review context — never your session history. This keeps the reviewer focused on the plan, not your thought process. The reviewer is a named subagent and never forks — spec-fidelity review requires independence from the planner's framing.
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
2. Match case-insensitively against the five trigger categories defined in [`references/smell-triggers.md`](references/smell-triggers.md) (DI registrations, new abstractions, async/concurrency primitives, new persistence pathways, new contract surfaces). If any trigger matches, `plan-smell` fires in parallel with `plan-attack`. If no match, `plan-smell` is skipped and `plan-attack` runs alone.
3. Include the list of matched triggers verbatim in the combined threat report so the designer sees why smell fired (or didn't).

Add new triggers in the reference file, not here — this section owns the decision procedure; the reference owns the pattern library.

---

## Ground-Truth Report Cascade

`design-specify` runs ground-truth review automatically (skipped only for greenfield
specs), so the `spec/` subdirectory normally contains a report verifying spec claims
against the codebase. The report is a trusted input at the plan stage — `plan-attack`
does not need to re-verify what design-specify already verified.

`design-large-task` no longer produces a design-stage ground-truth report
(architecture choice and ground-truth verification are owned by `design-specify`).
The cascade reads only the spec-stage report when present.

### Input Contract

If the current sprint's `spec/` subdirectory contains files matching
`*-spec-ground-truth-report-*.md`, read the **highest-numbered version** (the latest
revision per `util-artifact-schema` versioning — `-01.md` wins over `-00.md`, etc.).
Extract the list of verified anchors — file paths, type names, method names that
the ground-truth-reviewer confirmed exist as the spec describes. This list becomes
the **verified-anchor skip-list**.

If no spec-stage ground-truth report exists (greenfield spec with no existing code
references, or the spec was authored outside the standard design-specify flow), skip
this cascade. `plan-attack` performs its own full codebase verification in that
case.

**Error-path handling.** If the report exists but contains zero verified anchors
(all findings are NOT-FOUND or UNVERIFIABLE, or all anchors are `null`), pass an
empty skip-list to `plan-attack`. Do not skip the cascade entirely — the empty
skip-list tells `plan-attack` that ground-truth ran but produced no trusted
anchors, which is different from "no ground-truth was performed." Note this
condition in the combined threat report so the designer sees that the spec-stage
pass produced no usable trust boundary.

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

1. Consult the Smell Heuristic Pre-Check result. If smell did NOT trigger, dispatch
   only the plan-attacker. If smell DID trigger, dispatch attacker and smeller
   in parallel in a single message.

   For each dispatched subagent:
   - Use the named Chester subagents — `chester:plan-build-plan-attacker` and (if smell triggered) `chester:plan-build-plan-smeller`. Their system prompts are loaded from their plugin definitions; you do not embed skill instructions into the Agent prompt.
   - Include the plan file path so the subagent knows what to review
   - For `chester:plan-build-plan-attacker`: include the verified-anchor skip-list (from the Ground-Truth Report Cascade above) and the trust-boundary instruction
   - **Fork policy: isolated.** Both are named subagents and never fork — adversarial review and forward-looking smell analysis require fresh, independent perspectives. Do NOT downgrade to `general-purpose`; that would silently fork these critics under `CLAUDE_CODE_FORK_SUBAGENT=1` and defeat the whole hardening gate.

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

- **Invoked by:** `design-specify` (primary — with spec input; cascades the spec-stage ground-truth report from `design-specify` when present, which is the default for non-greenfield specs), or user directly (standalone, when a spec already exists)
- **Calls:** `chester:plan-build-plan-reviewer` (Plan Review Loop), `chester:plan-build-plan-attacker` (Plan Hardening, unconditional), `chester:plan-build-plan-smeller` (Plan Hardening, conditional — only when Smell Heuristic Pre-Check matches), `dr_query` on the `chester-decision-record` MCP (at plan-start, to populate `## Prior Decisions`). All three reviewer subagents are named — none fork.
- **Reads:** `util-artifact-schema` (naming/paths), the spec from upstream `spec/` subdirectory, the spec-stage ground-truth report from upstream `spec/` subdirectory (when present)
- **Transitions to:** `execute-write` (subagent or inline mode)
- **Does NOT call:** `start-bootstrap` (inherits sprint context from upstream design and spec stages)
- **Spec compatibility:** reads spec documents written by `design-specify`, regardless of whether the upstream brief came from `design-large-task` (nine-section) or `design-small-task` (six-section) — design-specify normalizes both into the spec contract
