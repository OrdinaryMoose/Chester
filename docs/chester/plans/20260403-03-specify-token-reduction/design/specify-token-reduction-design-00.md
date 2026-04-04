# Design Brief: Review Sequence Redesign for Pipeline Token Efficiency

## Intent

Redesign the review sequence across the Chester specify and plan-build pipeline stages so that each review fires with a clear, distinct purpose at the stage where its artifact is mature enough to benefit from that type of scrutiny.

## Why This Matters

The current pipeline runs multiple review layers across the specify-to-plan transition. Some reviews overlap in purpose (e.g., completeness checking appears in both the spec reviewer and plan reviewer). Some checks may fire before the artifact is mature enough to answer them meaningfully (e.g., YAGNI checking on abstract requirements vs. concrete implementation steps). The result is duplicated API token spend without proportional quality gain.

## Organizing Principle

The pipeline has three stages, each with a distinct role:

| Stage | Role | Artifact |
|-------|------|----------|
| Design | Goals | Design brief |
| Specification | Framework | Spec document |
| Plan | Execution | Implementation plan |

Each transition between stages gets one review with a clear, distinct purpose:

| Transition | Review Purpose |
|------------|---------------|
| Design -> Spec | Does the framework address the goals? |
| Spec -> Plan | Does the plan implement the framework? |
| At plan level | Does the plan introduce risk into the codebase? |

## In Scope

- Spec reviewer (chester-design-specify) -- purpose, timing, and what it checks
- Plan reviewer (chester-plan-build) -- purpose, timing, and what it checks
- Plan-attack and plan-smell (chester-plan-build hardening) -- purpose and timing validation
- The Think-tool-per-issue gate in the specify review loop

## Out of Scope

- The pipeline stage boundaries themselves (design -> spec -> plan -> execute stays)
- The design discovery stage (chester-design-figure-out / chester-design-architect)
- Execution-phase reviews

## Decision Boundaries

- Each review must have a single, stated purpose matched to the maturity level of its artifact
- No two reviews may duplicate purpose
- The aggregate review pipeline must remain at least as effective as the current system -- the whole is the sum of its parts
- Reviews can be merged, moved, or restructured as long as the above conditions hold

## Constraints

- The review pipeline as a whole catches real issues -- this effectiveness must be preserved
- Budget savings come from eliminating duplicated purpose, not from cutting scrutiny
- Each review's purpose must be answerable at the stage where it fires

## Current State (What Exists Today)

### Spec Reviewer (specify stage)
Checks: completeness, consistency, clarity, scope, YAGNI
Dispatch: subagent, up to 3 iterations
Additional: Think tool per issue for fix evaluation

### Plan Reviewer (plan-build stage)
Checks: completeness, spec alignment, task decomposition, buildability
Dispatch: subagent, up to 3 iterations

### Plan Hardening (plan-build stage)
Checks: adversarial risk analysis (plan-attack), code smell prediction (plan-smell)
Dispatch: two parallel subagents

### Overlap Analysis
- "Completeness" appears in both spec and plan reviewers, but means different things at each stage
- "Scope" and "YAGNI" in the spec reviewer may be more meaningful when evaluated against concrete plan tasks
- "Spec alignment" in the plan reviewer overlaps with the spec reviewer's consistency/completeness checks

## Acceptance Criteria

1. Each review in the redesigned sequence has a documented purpose statement
2. Each review's purpose is matched to the maturity of the artifact at its stage
3. No two reviews share the same purpose
4. The aggregate review surface covers the same class of issues as the current pipeline
5. Total subagent dispatches across the specify-to-plan transition are reduced

## Assumptions Tested

- The review loop in specify typically runs one iteration (user observation)
- The user cannot attribute specific findings to individual reviewers -- the value is in the aggregate
- User's earlier statement that "the review catches real issues" may apply to the aggregate pipeline rather than the spec reviewer specifically

## Residual Risks

- Restructuring reviews may shift when certain issues are caught, even if they're still caught before code -- needs monitoring
- The effectiveness of the current pipeline is emergent from the combination of reviews -- restructuring parts may have non-obvious effects on the whole
- No empirical data on which specific issues each reviewer catches individually -- the redesign is based on purpose-alignment logic, not measured contribution

## Incidental Finding

The enforcement MCP server (chester-design-architect) has a bug: `pressurePassComplete` is never set to `true` in `updateState()`. The `pressureTracking` array collects entries but no code evaluates them to flip the flag. Closure can never be fully permitted via the enforcement mechanism.
