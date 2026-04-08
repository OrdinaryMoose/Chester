# Review Sequence Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use chester-execute-write (recommended) or chester-execute-write in inline mode to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure reviewer templates and skill descriptions so each review fires with a single, distinct purpose at the right pipeline stage.

**Architecture:** Four markdown files change across two skills. The spec reviewer narrows to design-alignment only and gains the design brief as required input. The plan reviewer narrows to spec-fidelity only and gains an explicit non-responsibility statement. Plan hardening is unchanged. Each task produces a self-contained, committable change.

**Tech Stack:** Markdown (skill definitions), no code changes.

---

### Task 1: Rewrite spec reviewer template

**Files:**
- Modify: `chester-design-specify/spec-reviewer.md`

- [ ] **Step 1: Read current reviewer template**

Read `chester-design-specify/spec-reviewer.md` to confirm current state. The file should contain a 5-category checklist (Completeness, Consistency, Clarity, Scope, YAGNI).

- [ ] **Step 2: Rewrite the reviewer template**

Replace the entire file with the new design-alignment reviewer. Key changes:
- Purpose line changes from "Verify the spec is complete, consistent, and ready for implementation planning" to "Verify the spec faithfully addresses the design brief's goals, constraints, and decisions"
- Add `**Design brief for reference:** [DESIGN_BRIEF_PATH]` as a required input alongside the spec path
- Replace the 5-category "What to Check" table with a 4-item design-alignment checklist:

| Category | What to Look For |
|----------|------------------|
| Goals Coverage | Every goal in the design brief is addressed by the spec |
| Constraints Respected | Spec honors constraints and non-goals from the design brief |
| No Untraceable Additions | Spec does not introduce requirements not traceable to the design |
| Internal Consistency | No contradictions within the spec itself |

- Update calibration guidance to: "Only flag issues where the spec fails to address or contradicts the design brief. Minor wording, stylistic preferences, and sections with varying detail levels are not issues."
- Add a fallback note: "If no design brief is provided (standalone invocation), review for internal consistency only — skip goals coverage, constraints, and traceability checks."
- Output format stays the same (Status, Issues, Recommendations)

Complete file content:

```markdown
# Spec Document Reviewer Prompt Template

Use this template when dispatching a spec document reviewer subagent.

**Purpose:** Verify the spec faithfully addresses the design brief's goals, constraints, and decisions.

**Dispatch after:** Spec document is written to its output directory.

` ` `
Task tool (general-purpose):
  description: "Review spec document"
  prompt: |
    You are a spec document reviewer. Verify this spec faithfully addresses the design brief.

    **Spec to review:** [SPEC_FILE_PATH]
    **Design brief for reference:** [DESIGN_BRIEF_PATH]

    ## What to Check

    | Category | What to Look For |
    |----------|------------------|
    | Goals Coverage | Every goal in the design brief is addressed by the spec |
    | Constraints Respected | Spec honors constraints and non-goals from the design brief |
    | No Untraceable Additions | Spec does not introduce requirements not traceable to the design |
    | Internal Consistency | No contradictions within the spec itself |

    ## Calibration

    **Only flag issues where the spec fails to address or contradicts the design brief.**
    A missing goal, a violated constraint, or an untraceable requirement — those are
    issues. Minor wording, stylistic preferences, and sections with varying detail
    levels are not.

    If no design brief was provided, review for internal consistency only — skip
    goals coverage, constraints, and traceability checks.

    Approve unless there are serious gaps between the spec and the design brief.

    ## Output Format

    ## Spec Review

    **Status:** Approved | Issues Found

    **Issues (if any):**
    - [Section X]: [specific issue] - [how it misaligns with the design brief]

    **Recommendations (advisory, do not block approval):**
    - [suggestions for improvement]
` ` `

**Reviewer returns:** Status, Issues (if any), Recommendations
```

Note: The triple backticks in the template above must be real backticks (not escaped). The outer fencing is for plan readability only.

- [ ] **Step 3: Verify the rewrite**

Read the file back. Confirm:
- Design brief is listed as a required input
- The 4-category alignment checklist is present (Goals Coverage, Constraints Respected, No Untraceable Additions, Internal Consistency)
- The old 5-category checklist (Completeness, Consistency, Clarity, Scope, YAGNI) is gone
- Fallback for standalone invocation is present
- Output format is unchanged

- [ ] **Step 4: Commit**

```bash
git add chester-design-specify/spec-reviewer.md
git commit -m "feat: narrow spec reviewer to design-alignment purpose"
```

---

### Task 2: Update specify skill description

**Files:**
- Modify: `chester-design-specify/SKILL.md:56,122-137`

- [ ] **Step 1: Read current SKILL.md**

Read `chester-design-specify/SKILL.md`. Focus on:
- Line 56: checklist item 4 mentions "max 3 iterations"
- Lines 122-137: "Automated Spec Review Loop" section
- Line 127: "The reviewer checks: completeness, consistency, clarity, scope, YAGNI"

- [ ] **Step 2: Update checklist item 4**

Change line 56 from:
```
4. **Automated spec review loop** — dispatch spec-document-reviewer subagent, Think Tool gate per issue, fix and re-dispatch (max 3 iterations, then escalate to user)
```
To:
```
4. **Automated spec review loop** — dispatch spec-document-reviewer subagent with design brief, Think Tool gate per issue, fix and re-dispatch (max 2 iterations, then escalate to user)
```

- [ ] **Step 3: Update the Automated Spec Review Loop section**

Replace lines 122-137 with:

```markdown
## Automated Spec Review Loop

**Review purpose: Design Alignment** — does the spec faithfully address the design brief's goals, constraints, and decisions?

After writing the spec:

1. Dispatch spec-document-reviewer subagent (see spec-reviewer.md in this skill directory)
   - Provide both the spec path AND the design brief path
   - If no design brief exists (standalone invocation), dispatch with spec only — the reviewer falls back to internal-consistency checking
2. The reviewer checks: goals coverage, constraints respected, no untraceable additions, internal consistency

**think gate (per issue):** When the spec reviewer returns issues, ask this question, think
about the results, and implement the findings:
  "Is this issue valid given the spec's stated intent? What is the minimal fix?
   Does this fix affect any adjacent section of the spec?"

Apply the fix, then move to the next issue. Re-dispatch the reviewer after all issues from the current round are addressed.

3. If loop exceeds 2 iterations, escalate to user for guidance
4. On subsequent iterations, write revised spec as `{sprint-name}-spec-01.md`, `02`, etc.
```

- [ ] **Step 4: Update process flow diagram**

In the process flow `dot` diagram (lines 63-93), make two changes:

Change the node label:
```
Old: "Iteration < 3?" [shape=diamond];
New: "Iteration < 2?" [shape=diamond];
```

Change the edge references:
```
Old: "Iteration < 3?" -> "Dispatch spec reviewer" [label="yes"];
     "Iteration < 3?" -> "Escalate to user" [label="no"];
New: "Iteration < 2?" -> "Dispatch spec reviewer" [label="yes"];
     "Iteration < 2?" -> "Escalate to user" [label="no"];
```

Also update the edge pointing to this node:
```
Old: "Think Tool per issue\nFix issues" -> "Iteration < 3?";
New: "Think Tool per issue\nFix issues" -> "Iteration < 2?";
```

- [ ] **Step 5: Verify the changes**

Read the file back. Confirm:
- Checklist item 4 says "max 2 iterations" and mentions design brief
- Review loop section starts with "Review purpose: Design Alignment"
- Reviewer dispatch mentions providing the design brief path
- Fallback for standalone invocation is present
- Max iterations is 2, not 3
- Think gate is unchanged
- Process flow diagram says "Iteration < 2?"

- [ ] **Step 6: Commit**

```bash
git add chester-design-specify/SKILL.md
git commit -m "feat: update specify skill for design-alignment review purpose"
```

---

### Task 3: Rewrite plan reviewer template

**Files:**
- Modify: `chester-plan-build/plan-reviewer.md`

- [ ] **Step 1: Read current reviewer template**

Read `chester-plan-build/plan-reviewer.md` to confirm current state. The file should contain a 4-item checklist (Completeness, Spec Alignment, Task Decomposition, Buildability).

- [ ] **Step 2: Rewrite the reviewer template**

Replace the entire file with the new spec-fidelity reviewer. Key changes:
- Purpose line changes from "Verify the plan is complete, matches the spec, and has proper task decomposition" to "Verify the plan faithfully implements the spec's requirements with actionable, buildable tasks"
- Replace the 4-item checklist with the spec-fidelity checklist:

| Category | What to Look For |
|----------|------------------|
| Requirement Coverage | Every spec requirement is addressed by at least one plan task |
| Traceability | Each plan task traces back to a spec requirement — no orphan tasks |
| Task Decomposition | Tasks have clear boundaries, steps are actionable |
| Buildability | Could an engineer follow this plan without getting stuck? |

- Add explicit non-responsibility statement: "You are NOT evaluating whether the spec itself is correct or complete — that was settled at spec review. You are evaluating whether the plan faithfully implements what the spec says."
- Update calibration to: "Only flag issues where the plan fails to implement or contradicts the spec."
- Output format stays the same

Complete file content:

```markdown
# Plan Document Reviewer Prompt Template

Use this template when dispatching a plan document reviewer subagent.

**Purpose:** Verify the plan faithfully implements the spec's requirements with actionable, buildable tasks.

**Dispatch after:** The complete plan is written.

` ` `
Task tool (general-purpose):
  description: "Review plan document"
  prompt: |
    You are a plan document reviewer. Verify this plan faithfully implements the spec.

    **Plan to review:** [PLAN_FILE_PATH]
    **Spec for reference:** [SPEC_FILE_PATH]

    You are NOT evaluating whether the spec itself is correct or complete — that was
    settled at spec review. You are evaluating whether the plan faithfully implements
    what the spec says.

    ## What to Check

    | Category | What to Look For |
    |----------|------------------|
    | Requirement Coverage | Every spec requirement is addressed by at least one plan task |
    | Traceability | Each plan task traces back to a spec requirement — no orphan tasks |
    | Task Decomposition | Tasks have clear boundaries, steps are actionable |
    | Buildability | Could an engineer follow this plan without getting stuck? |

    ## Calibration

    **Only flag issues where the plan fails to implement or contradicts the spec.**
    A missing requirement, an orphan task with no spec basis, contradictory steps,
    placeholder content, or tasks so vague they can't be acted on — those are issues.
    Minor wording, stylistic preferences, and "nice to have" suggestions are not.

    Approve unless there are serious gaps between the plan and the spec.

    ## Output Format

    ## Plan Review

    **Status:** Approved | Issues Found

    **Issues (if any):**
    - [Task X, Step Y]: [specific issue] - [why it matters for implementation]

    **Recommendations (advisory, do not block approval):**
    - [suggestions for improvement]
` ` `

**Reviewer returns:** Status, Issues (if any), Recommendations
```

- [ ] **Step 3: Verify the rewrite**

Read the file back. Confirm:
- Non-responsibility statement is present ("You are NOT evaluating whether the spec itself is correct")
- The 4-category spec-fidelity checklist is present (Requirement Coverage, Traceability, Task Decomposition, Buildability)
- The old "Completeness" and "Spec Alignment" categories are replaced
- Calibration references spec-plan alignment, not general completeness
- Output format is unchanged

- [ ] **Step 4: Commit**

```bash
git add chester-plan-build/plan-reviewer.md
git commit -m "feat: narrow plan reviewer to spec-fidelity purpose"
```

---

### Task 4: Update plan-build skill description

**Files:**
- Modify: `chester-plan-build/SKILL.md:180-192`

- [ ] **Step 1: Read current SKILL.md**

Read `chester-plan-build/SKILL.md`. Focus on lines 180-192: "Plan Review Loop" section.

- [ ] **Step 2: Update the Plan Review Loop section**

Replace lines 180-192 with:

```markdown
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
```

- [ ] **Step 3: Verify the changes**

Read the file back. Confirm:
- Plan Review Loop section starts with "Review purpose: Spec Fidelity"
- The dispatch instructions and iteration limit (3) are unchanged
- No changes to Plan Hardening section
- No changes to any other section

- [ ] **Step 4: Commit**

```bash
git add chester-plan-build/SKILL.md
git commit -m "feat: update plan-build skill for spec-fidelity review purpose"
```

---

### Task 5: Remove dead spec-reviewer.md copies

**Files:**
- Delete: `chester-design-figure-out/spec-reviewer.md`
- Delete: `chester-design-architect/spec-reviewer.md`

These are identical copies of the old spec-reviewer.md template that are not referenced by either skill's SKILL.md. Only `chester-design-specify/spec-reviewer.md` (updated in Task 1) is actually dispatched.

- [ ] **Step 1: Verify files are unreferenced**

Search both skills' SKILL.md files for any reference to `spec-reviewer`. Confirm neither mentions it.

- [ ] **Step 2: Delete the dead files**

```bash
rm chester-design-figure-out/spec-reviewer.md
rm chester-design-architect/spec-reviewer.md
```

- [ ] **Step 3: Commit**

```bash
git add chester-design-figure-out/spec-reviewer.md chester-design-architect/spec-reviewer.md
git commit -m "chore: remove unreferenced spec-reviewer.md copies from figure-out and architect"
```
