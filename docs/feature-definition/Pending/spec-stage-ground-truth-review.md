# Feature Definition Brief: Ground-Truth Review in the Specify Stage

## Problem

Chester's `design-specify` skill includes an automated spec review loop that checks whether the spec faithfully addresses the design brief — goals coverage, constraints respected, no untraceable additions, internal consistency. This is a fidelity check: does Document A (spec) align with Document B (brief)?

The review loop structurally cannot catch a different and more dangerous class of defect: specs that don't match the codebase. The reviewer never opens a source file. It never verifies that referenced types exist, that assumed API signatures are correct, or that claimed behavior matches runtime reality.

### Evidence: Validation Bridge Completion Sprint (2026-04-09)

During the `20260409-04-validation-bridge-completion` sprint in the StoryDesigner project, both review types were run against the same spec:

**Spec review loop result:** Approved with zero issues. Two minor advisory recommendations (performance note, DocumentId parsing). Total cost: ~30K tokens, ~30 seconds.

**Plan-attack result:** 10 findings across 4 severity levels. Total cost: ~80K tokens, ~5 minutes.

Findings that only plan-attack caught:

- **HIGH: Impossible null guard.** The spec described a degraded mode guarding against null return from `AssembleAsync`. Plan-attack verified that `ICanonicalFormService.AssembleAsync` returns `Task<CanonicalStoryForm>` (non-nullable) and the assembler always constructs a result. The null guard was dead code based on a false assumption about the contract.

- **HIGH: Design brief contradicted spec on type system.** The brief said "pass DTOs directly to structural checks." Plan-attack verified that structural checks dispatch by `TargetType == typeof(Arc)` (domain entity types), not `typeof(ArcDto)`. The spec correctly used mappers, but the brief — which the spec reviewer validated against — was wrong. The spec reviewer approved the spec as "faithful to the brief" without noticing the brief itself was incorrect.

- **MEDIUM: Mapper count error.** The spec claimed "14 existing static mappers." Plan-attack counted 14 files but identified TagMapper as irrelevant (Tags excluded from canonical form). Correct count: 13. A factual error the spec reviewer could not detect because it never checked the filesystem.

- **MEDIUM: `Add<T>` replace-not-merge semantics.** The spec's testing strategy included a test case for "deduplication across tree walk and Index.All." Plan-attack read `StoryValidationWorkingSet.cs` and found that `Add<T>` replaces the entire set for type T — there is no cross-call deduplication. The test case was misleading.

- **LOW: Pre-existing diagnostic identity collision.** Plan-attack discovered that `DiagnosticId` is computed as `SHA256(code|displayLabel)` without entity ID. Two entities with the same violation produce identical IDs, causing deduplication. This bug was invisible when the bridge produced zero diagnostics but would become user-visible once the spec's changes shipped. The spec reviewer had no mechanism to surface latent bugs exposed by the proposed changes.

Every actionable finding came from comparing spec claims against codebase reality — a dimension the spec reviewer is structurally incapable of checking.

### Why This Matters

Defects caught in the spec stage cost minutes to fix (edit the document). The same defects caught during implementation cost significantly more:

- Dead code from false assumptions creates confusion and misleading contracts
- Type mismatches cause silent zero-output bugs (the exact class of bug this sprint was fixing)
- Incorrect entity counts propagate into test assertions that fail at compile time
- Latent bugs surface as user-visible regressions after merge

The current pipeline runs plan-attack only during `plan-build` (against the implementation plan). By that point, spec defects have already propagated into the plan and may require cascading fixes across both documents.

## Proposed Solution

Add a ground-truth review step to `design-specify` after the automated spec review loop passes. This step runs `plan-attack` (or a spec-specific variant) against the spec with codebase access.

### Pipeline Change

Current:
```
Write spec → Spec review loop (fidelity) → User review gate → plan-build
```

Proposed:
```
Write spec → Spec review loop (fidelity) → Ground-truth review (codebase verification) → User review gate → plan-build
```

### Review Responsibilities

| Reviewer | Question Answered | Evidence Source | Catches |
|----------|-------------------|----------------|---------|
| Spec review loop | Does the spec match the design brief? | Brief + spec (closed world) | Scope drift, missed goals, untraceable additions |
| Ground-truth review | Does the spec match the codebase? | Spec + actual source files | False assumptions, incorrect types, impossible guards, latent bugs |
| Plan-attack (plan-build) | Does the plan match both? | Plan + spec + codebase | Task ordering, build breakage, test coverage gaps |

### Design Considerations

- **Reuse plan-attack or create a new skill?** Plan-attack's review dimensions (structural integrity, execution risk, assumptions, contract completeness, concurrency) map directly to spec verification. The prompt would need minor adaptation (reviewing a spec's claims rather than a plan's tasks), but the core discipline — "every finding must cite a file path" — is identical. A lightweight wrapper or prompt variant may be sufficient.

- **Cost budget.** The ground-truth review consumed ~80K tokens in the StoryDesigner sprint. For specs with extensive codebase references, this is the expected range. For simpler specs with fewer code claims, it would be less. The cost is justified when specs make verifiable claims about existing code — which most specs do.

- **Interaction with plan-build's plan-attack.** If ground-truth issues are caught and fixed in the spec, plan-build's plan-attack can focus on plan-specific concerns (task decomposition, build ordering, test coverage) rather than re-discovering spec-level problems. This should reduce plan-attack findings during plan-build, not increase total review cost.

- **When to skip.** The ground-truth review adds value proportional to how many verifiable claims the spec makes about existing code. A spec for a greenfield feature with no existing code references would gain little. A spec that references specific files, types, API signatures, or runtime behavior (like this one) gains the most.

## Acceptance Criteria

- `design-specify` includes a ground-truth review step after the spec review loop
- The ground-truth reviewer verifies spec claims against actual source files (file paths, type signatures, API contracts, runtime behavior)
- Every finding must cite codebase evidence (same standard as plan-attack)
- Findings are incorporated into the spec before the user review gate
- The spec review loop (fidelity check) is preserved as a separate, preceding step
- The ground-truth review can be skipped for greenfield specs with no existing code references (explicit opt-out, not default)

## Open Questions

- Should the ground-truth review be a separate skill or a mode/variant of plan-attack?
- Should the ground-truth review run automatically (like the spec review loop) or require user opt-in?
- Should the `plan-build` plan-attack be adjusted to avoid re-checking issues already caught at the spec level, or is redundant verification acceptable?
