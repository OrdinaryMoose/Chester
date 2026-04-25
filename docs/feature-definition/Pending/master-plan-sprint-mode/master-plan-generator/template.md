# Sprint [NNN] — [Short Descriptive Title]: Master Refactor Plan

**Date:** [YYYY-MM-DD]
**Sprint:** [NNN]
**Status:** Draft
**Predecessor:** Sprint [NNN-1] ([Short description of what the predecessor established])

---

# Change Log

For each paster plan revision, write:

**vX.X changes (yyyy-mm-dd):** summary of the changes

for example:
**v6.5 changes (2026-04-23):** LBD-5 artifact housing normalized. Four LBD-5 design documents (`phase-b-lbd-05-design-brief.md`, `phase-b-lbd-05-thinking-summary.md`, `phase-b-lbd-05-process-evidence.md`, `phase-b-lbd-05-ground-truth-report.md`) relocated from master `spec/` root into a new sub-sprint folder `lbd-05-cross-consumer-scenarios/design/` to match the LBD-01 / LBD-02 / LBD-09.x / LBD-10 / LBD-13 folder convention. Both `working/` and `plans/` sides moved in lockstep (`git mv` on plans/ side to preserve rename history). Empty peer subdirs `plan/`, `spec/`, `summary/` created per convention. All in-document path references updated. No semantic content change — pure reorganization of a pre-existing artifact set. Plans/ master-plan.md and plans/ lbd-09 summary deliberately left with old path text pending auto-refresh at next archive cycle (archive is immutable institutional memory).

---

## Purpose

[One paragraph describing the problem being solved — duplication, violation, architectural drift, etc.]
[Sprint NNN-1] completed [predecessor outcome]. Sprint [NNN] continues this work by addressing [remaining problem]. The goal is [specific, measurable endstate goal].

---

## How This Plan Works

This master plan is the **north star** — it defines the endstate, the sequencing constraints, and the re-alignment protocol. It is not executed as a single refactoring effort.

Each sub-sprint is a separate session with its own lifecycle:
- The user selects the next sub-sprint to execute
- A concrete **implementation plan** is drafted from the master plan, verified against the actual codebase state, and presented for user review
- Only after user approval does implementation begin
- A session summary is produced, and the master plan's accuracy is re-validated

The master plan shall be updated between sub-sprints as the codebase evolves. The master plan is an in-progress repository of upcoming refactoring work and of work that has been completed.

---

## Guiding Principles

- The consolidation direction is always: [describe canonical direction — what moves where, what stays]
- Types that belong exclusively to [subsystem] internals stay in [subsystem]
- Each sub-sprint must reach a clean build and green tests before the next begins
- Every sub-sprint touches no more than [N] projects and no more than [N] files per step
  - Exception: trivial deletions (dead code, empty stubs) do not count against the project limit — only substantive modifications count
- [Paired sub-sprint rule if applicable, e.g., "026b+c must complete within the same session"]

---

## Governing TDRs

- TDR-[ID] — [The rule this TDR encodes as it applies to this sprint]
- TDR-[ID] — [Description]
- TDR-[ID] — [Description]

## Invariants

-- INV-[ID] - [The inviariant that is applicable]
-- INV-[ID] - [The inviariant that is applicable]
-- INV-[ID] - [The inviariant that is applicable]

---

## Endstate

When Sprint [NNN] is complete:

- [Verifiable condition 1 — e.g., "Zero duplicate type definitions exist across assemblies"]
- [Verifiable condition 2 — e.g., "Every shared type has exactly one canonical definition in the correct assembly per TDR-ARCH-100"]
- [Verifiable condition 3 — assembly-level location: "`X` lives in `Assembly.Y`"]
- [Verifiable condition 4 — negative: "No `OldType` references remain in any `.cs` file"]
- Solution builds clean, all tests pass

---

## Running Plan Estimates

### Master Plan Reassessments

*(None yet — updated after each sub-sprint completes)*

### Sub-Sprint Plan Reassessments

- **Sprint[NNN]a:** *(Not started)*
- **Sprint[NNN]b:** *(Not started)*

---

## Sub-Sprint Overview

```
Sprint[NNN]a — [Name]    (no dependencies, [risk level])
Sprint[NNN]b+c — [Name]  (paired session, depends on [NNN]a — [reason])
  [NNN]b: [Breaking half description]
  [NNN]c: [Mechanical fixup half description]
Sprint[NNN]d — [Name]    (depends on [NNN]b+c — [reason])
```

Dependency graph:

```
[NNN]a (independent)

[NNN]b+c (paired) ──── [NNN]d
```

---

## Sprint[NNN]a — [Short Name]

**Goal:** [One sentence — what this sub-sprint achieves]
**Risk:** [Low | Medium | High] — [brief justification]
**Dependencies:** [None | Sprint[NNN]x — reason]
**Projects touched:** [Comma-separated project names]

### [Problem Area Name]

**Problem:** [Describe the duplication, violation, or inconsistency. Reference the TDR it violates.]

**Current state:**

```
[Optional: paste the actual signatures, code snippet, or structure that shows the problem]
```

**Approach (TDD cycle):**

*Contracts/interfaces (define first):*
- [Interface or contract to write — what it specifies, not how it's implemented]
- [Interface or contract to extend — what method/property is added]

*Tests (write second — red):*
- [Test class and key behaviors to verify — these tests define the specification]
- [Edge cases and error paths to cover]

*Implementation (write third — until green):*
- [Class or method to implement — satisfies the test specifications above]
- [Refactoring targets — existing code to modify]

*Verification:*
- `dotnet build` / `dotnet test` — all green

**Files ([N] total):**

[Project name] ([N]):
- `[Project]/[Path/To/File.cs]` — [reason it changes]
- `[Project]/[Path/To/File.cs]` — [reason it changes]

[Project name] ([N]):
- `[Project]/[Path/To/File.cs]` — [reason it changes]

**Decision gate (if applicable):** [Question that must be resolved before proceeding]
- Option A: [description] — [consequence]
- Option B: [description] — [consequence]
- Recommendation: [Option] — [rationale and TDR reference]
- Downstream impact: [which sub-sprints are affected by this choice]

### Exit Criteria

- [Binary criterion 1 — e.g., "`OldType` no longer exists in `Assembly.Y`"]
- [Binary criterion 2 — e.g., "One definition of `X` in `Assembly.Y`"]
- Solution builds clean, all tests pass

### Mandatory Protocol Gates

**BEFORE any code changes:** Execute the full **Re-Alignment Gate** (see Iterative Re-Alignment Protocol). This is mandatory, not advisory. The gate requires:
- Read this master plan and the previous session summary
- Audit the codebase against this sub-sprint's preconditions (verify with actual grep/build, not assumptions)
- Write a concrete implementation plan (`Sprint[NNN]a-Implementation-Plan.md`) reflecting the actual current state
- Present the implementation plan to the user for review — do not proceed until approved

**AFTER all code changes:** Execute the full **Forward-Looking Validation** and **Plan Reassessment** (see Iterative Re-Alignment Protocol). This is mandatory, not advisory. The validation requires:
- Write the session summary using the session-summary skill
- Assess compliance with both the sub-sprint plan and the master plan endstate
- Update the Running Plan Estimates section in this master plan
- Propose specific updates to the next sub-sprint's section and apply when approved by the user

---

## Risk Summary

- Sprint[NNN]a — [Name]: **[Risk Level]** — [primary risk driver]
- Sprint[NNN]b+c — [Name]: **[Risk Level]** — [primary risk driver]
- Sprint[NNN]d — [Name]: **[Risk Level]** — [primary risk driver]

---

## Decision Gates Summary

- **[NNN]a:** [Question to be resolved?] (Recommend [Option] — [brief rationale])
- **[NNN]b:** [Question?] (Determined by audit — [what the audit should confirm])
- **[NNN]d:** [Question?] (Recommend [Option] per [TDR-ID])

---

## Iterative Re-Alignment Protocol (Mandatory)

**This protocol is not advisory — it is a mandatory execution requirement.** Each sub-sprint section contains a "Mandatory Protocol Gates" block that explicitly triggers the Before and After phases below. Skipping any phase is a protocol violation that must be corrected before the session can be considered complete.

Each sub-sprint is not executed in isolation. The consolidation endstate is the governing objective. Individual sub-sprints are means to that end, not ends in themselves. To prevent drift, every sub-sprint follows this protocol:

### Before Execution: Re-Alignment Gate

At the start of each sub-sprint session, before writing any code:

- **Read this master plan** to refresh the endstate goals
- **Read the session summary of the previous sub-sprint** (if any) to understand what actually changed vs. what was planned
- **Audit the current codebase state** against this sub-sprint's preconditions:
  - Verify that prerequisite sub-sprints are complete (build passes, tests green)
  - Verify that the type/file inventory for this sub-sprint is still accurate — prior sub-sprints may have changed the landscape
  - If a prior sub-sprint introduced an unexpected change (e.g., moved a type to a different assembly than planned, or revealed a new dependency), update this sub-sprint's implementation plan accordingly
- **Rewrite the sub-sprint implementation plan** as a concrete session-scoped document (`Sprint[NNN]x-Implementation-Plan.md`) that reflects the **actual current state**, not the state assumed when this master plan was written. The implementation plan must:
  - Reference the master plan's endstate goals for this sub-sprint
  - List the exact files that need to change (re-verified by codebase search, not copied from this master plan)
  - Note any deviations from the master plan and justify them
  - Confirm that this sub-sprint's work still moves toward the master plan endstate

### During Execution: Deviation Check

If during execution you discover that the codebase does not match what the implementation plan assumed:

- **Stop and re-assess** before continuing
- Update the implementation plan with the new finding
- If the deviation is significant enough to affect downstream sub-sprints, add a note to the session summary flagging which master plan sections need revision

### After Execution: Forward-Looking Validation

At the end of each sub-sprint, the session summary must include:

- **Endstate progress:** Which master plan exit criteria are now satisfied? Which remain?
- **Downstream impact:** Did this sub-sprint's changes affect the assumptions of any future sub-sprint? If so, which sub-sprints and how?
- **Master plan accuracy:** Are any sections of this master plan now outdated or incorrect? List them explicitly so the next session can update before executing
- **Remaining inventory:** How many [duplicate types | violations | items] remain? This count must decrease monotonically across sub-sprints

### After Execution: Plan Reassessment

- Write a detailed sprint work log using the session summary skill
- Write the assessment for compliance with the master plan in the **Master Plan Reassessments** section
- Write an executive summary of the sub-sprint plan changes in the **Sub-Sprint Plan Reassessments** section

### Decision Gate Escalation

If a sub-sprint encounters a decision gate listed in this master plan:

- Document the options and recommendation in the implementation plan
- If the decision affects only the current sub-sprint, proceed with the recommended option and document the rationale
- If the decision affects downstream sub-sprints, document the decision and its downstream implications in the session summary so future sub-sprints can adapt

---

## Step Constraints (Non-Negotiable)

Every session executing a sub-sprint in this plan must:

- Refactoring Constraints
  - Touch no more than [N] projects per step (trivial deletions exempt)
  - Modify no more than [N] files per step
  - Introduce no more than [N] new abstraction(s) per step
  - Leave the build passing and all existing tests green at the end of the step (or end of the paired session for paired sub-sprints)
- Stop work if the refactoring constraints cannot be met and provide a reassessment of the plan
- Produce a session summary in `Documents/Working/[Sprint Folder]/`
- Execute the Re-Alignment Gate before writing any code — this is triggered by the **Mandatory Protocol Gates** block in each sub-sprint section
- Execute the Forward-Looking Validation and Plan Reassessment before concluding the session — this is triggered by the **Mandatory Protocol Gates** block in each sub-sprint section
- Reassess the refactored code against the sprint plan that was just executed and provide a compliance report
- Reassess the refactored code against the master plan and provide a compliance report
- Update the Master Plan work summary section per sprint
- Provide recommendations for changes to the next sprint's plan and update the master plan sprint section when approved by the user
