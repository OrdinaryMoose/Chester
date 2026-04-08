# Spec: Review Sequence Redesign for Pipeline Token Efficiency

## Goal

Restructure the review layers across `chester-design-specify` and `chester-plan-build` so that each review fires with a single, distinct purpose at the pipeline stage where its artifact is mature enough to benefit from that scrutiny. Budget savings come from eliminating duplicated purpose, not from cutting scrutiny.

## Architecture

The Chester pipeline has three stages, each producing an artifact at a different maturity level:

| Stage | Role | Artifact | Maturity |
|-------|------|----------|----------|
| Design | Goals | Design brief | Intent and scope decided, no structure |
| Specification | Framework | Spec document | Structure decided, no implementation |
| Plan | Execution | Implementation plan | Concrete files, code, steps |

Each transition between stages gets exactly one review, and each review has exactly one purpose:

| Transition | Review Purpose | Question It Answers |
|------------|---------------|---------------------|
| Design -> Spec | Design alignment | Does the framework address the goals? |
| Spec -> Plan | Spec fidelity | Does the plan implement the framework? |
| At plan level | Codebase risk | Does the plan introduce risk into the codebase? |

## Components

### 1. Spec Review (chester-design-specify)

**Current state:** Dispatches a subagent reviewer checking five dimensions: completeness, consistency, clarity, scope, YAGNI. Up to 3 iterations. Think tool per issue.

**New state:** The spec reviewer's sole purpose becomes **design alignment** — verifying that the spec document faithfully addresses the goals and decisions from the design brief.

**What the reviewer checks:**
- Does the spec cover every goal stated in the design brief?
- Does the spec respect the constraints and non-goals from the design brief?
- Does the spec introduce requirements not traceable to the design?
- Are there internal contradictions within the spec itself?

**What the reviewer does NOT check (moved downstream or removed):**
- Completeness in terms of implementation readiness — premature at spec stage, belongs to plan review
- YAGNI — cannot be meaningfully evaluated until concrete implementation decisions exist in the plan
- Clarity for an implementer — the plan reviewer checks buildability, which subsumes this

**Dispatch model:** Single subagent, single pass. If issues found, fix and re-dispatch once (max 2 iterations, down from 3). The Think tool per-issue gate remains — it prevents overcorrection.

### 2. Plan Review (chester-plan-build)

**Current state:** Dispatches a subagent reviewer checking: completeness, spec alignment, task decomposition, buildability. Up to 3 iterations.

**New state:** The plan reviewer's sole purpose becomes **spec fidelity** — verifying that the implementation plan faithfully implements the framework laid out in the spec.

**What the reviewer checks:**
- Does the plan cover every requirement in the spec?
- Does each plan task trace back to a spec requirement?
- Are the tasks decomposed into actionable, buildable steps?
- Could an engineer follow this plan without getting stuck?

**What the reviewer does NOT check (belongs elsewhere):**
- Whether the spec itself is correct or complete — that was settled at spec review
- Codebase risk — that belongs to plan hardening

**Dispatch model:** Single subagent, up to 3 iterations (unchanged). The Think tool per-task gate in plan-build already exists and remains.

### 3. Plan Hardening (chester-plan-build)

**Current state:** Dispatches plan-attack and plan-smell in parallel after plan review approves.

**New state:** Unchanged. Plan-attack and plan-smell already serve the **codebase risk** purpose and fire at the right stage — when concrete implementation decisions exist.

**What they check:**
- plan-attack: adversarial risks, logical contradictions, migration gaps, concurrency hazards
- plan-smell: code smells the plan would introduce (bloaters, couplers, SOLID violations)

These are already correctly placed and correctly purposed. No changes.

## Data Flow

```
Design Brief
    │
    ▼
┌─────────────────────────┐
│  chester-design-specify  │
│                          │
│  Write spec from brief   │
│         │                │
│         ▼                │
│  Spec Review (1-2 iter)  │──── Purpose: Design Alignment
│  "Does framework         │     "Does spec address goals?"
│   address goals?"        │
│         │                │
│         ▼                │
│  User Review Gate        │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│  chester-plan-build      │
│                          │
│  Write plan from spec    │
│         │                │
│         ▼                │
│  Plan Review (1-3 iter)  │──── Purpose: Spec Fidelity
│  "Does plan implement    │     "Does plan implement framework?"
│   framework?"            │
│         │                │
│         ▼                │
│  Plan Hardening          │──── Purpose: Codebase Risk
│  (attack + smell)        │     "Does plan introduce risk?"
│         │                │
│         ▼                │
│  User Decision Gate      │
└─────────────────────────┘
```

## Changes to Skill Files

### chester-design-specify/SKILL.md

1. Update the "Automated Spec Review Loop" section to describe the design-alignment purpose
2. Reduce max iterations from 3 to 2
3. Keep the Think tool per-issue gate

### chester-design-specify/spec-reviewer.md

Rewrite the reviewer template:
- Replace the five-category checklist (completeness, consistency, clarity, scope, YAGNI) with the design-alignment checklist (goals coverage, constraints respected, no untraceable additions, internal consistency)
- Update calibration guidance: "Only flag issues where the spec fails to address or contradicts the design brief"
- The reviewer must receive the design brief path alongside the spec path
- When no design brief exists (standalone invocation), the reviewer falls back to internal-consistency-only checking — it cannot evaluate design alignment without a brief to align against

### chester-plan-build/SKILL.md

1. Update the "Plan Review Loop" section to describe the spec-fidelity purpose
2. No structural changes — iteration count and dispatch model stay the same

### chester-plan-build/plan-reviewer.md

Rewrite the reviewer template:
- Replace current checklist with spec-fidelity checklist (requirement coverage, traceability, decomposition, buildability)
- Update calibration guidance: "Only flag issues where the plan fails to implement or contradicts the spec"
- Explicitly state that the reviewer does NOT evaluate whether the spec is correct

## Error Handling

- If the spec reviewer finds the design brief is missing or unreadable, surface to user immediately — cannot evaluate design alignment without the brief
- If the plan reviewer finds the spec is missing, same treatment
- If reviewer subagent fails to dispatch, retry once, then escalate to user

## Testing Strategy

### Validation approach

Run 2-3 features through the redesigned pipeline and compare:
1. Do the narrowed reviewers still catch meaningful issues?
2. Has the total number of subagent dispatches decreased?
3. Does the user feel the aggregate review quality is preserved?

This is observational, not automated testing — the reviewers are LLM subagents whose output varies per run.

### Rollback

If the redesigned reviews miss issues that the old reviews caught, the fix is straightforward: widen the reviewer checklist at the appropriate stage. The skill files are the only artifacts that change.

## Constraints

- The aggregate review pipeline must remain at least as effective as the current system
- Each review must have a single stated purpose matched to its stage's artifact maturity
- No two reviews may share the same purpose
- Pipeline stage boundaries (design -> spec -> plan -> execute) do not change
- Plan-attack and plan-smell are unchanged

## Non-Goals

- Eliminating the spec stage entirely
- Adding new pipeline stages
- Changing the design discovery stage (architect/figure-out)
- Automated token-cost measurement or benchmarking
- Changing execution-phase reviews

## Acceptance Criteria

1. Each review in the redesigned sequence has a documented purpose statement in its skill file
2. Each review's purpose is matched to the maturity of the artifact at its stage
3. No two reviews share the same purpose
4. The spec reviewer template requires the design brief as input (currently it does not)
5. Total maximum subagent dispatches across specify-to-plan drops from 7 (3 spec + 3 plan + 1 combined hardening) to 6 (2 spec + 3 plan + 1 combined hardening)
6. Observational validation after 2-3 pipeline runs confirms aggregate quality preserved

## Assumptions

- The spec reviewer's current five-category checklist contains checks that are premature at spec stage (validated by design interview)
- Plan-attack and plan-smell are already correctly placed (validated by user's three-stage model)
- The review pipeline's effectiveness is emergent from the combination of reviews — individual changes must be validated against the aggregate

## Risks

- **Emergent degradation:** Narrowing one review may reduce the aggregate's effectiveness in ways that aren't obvious from the individual review's purpose. Mitigation: observational validation over 2-3 runs.
- **Missing the brief:** The spec reviewer now requires the design brief as input. If the brief doesn't exist (standalone invocation), the design-alignment check degrades. Mitigation: fall back to internal-consistency-only check when no brief exists.
- **Recollection gap:** The design was based on the user's sense that reviews overlap, not on empirical measurement of individual reviewer contributions. Mitigation: the redesign stands on purpose-alignment logic independent of historical effectiveness data.
