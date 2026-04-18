# Spec Document Reviewer Prompt Template

Use this template when dispatching a spec document reviewer subagent.

**Purpose:** Verify the spec faithfully addresses the design brief's goals, constraints, and decisions.

**Dispatch after:** Spec document is written to its output directory.

```
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
```

**Reviewer returns:** Status, Issues (if any), Recommendations
