# Design Brief: Ground-Truth Review in the Specify Stage

**Status:** Draft
**Date:** 2026-04-10
**Sprint:** 20260410-02-add-attack-specify
**Parent:** docs/feature-definition/Pending/spec-stage-ground-truth-review.md

## Problem Statement

Chester's `design-specify` skill includes an automated spec review loop that checks document fidelity — does the spec match the design brief? This review is structurally blind to codebase reality. It never opens a source file, never verifies that referenced types exist, and never checks that assumed API signatures are correct.

Evidence from the StoryDesigner `20260409-04-validation-bridge-completion` sprint showed the spec review loop approved a spec with zero issues, while `plan-attack` (which reads source files) found 10 findings across 4 severity levels — including impossible null guards on non-nullable returns, type system contradictions between brief and spec, incorrect entity counts, and latent identity-collision bugs.

Every actionable finding came from comparing spec claims against codebase reality — a dimension the spec reviewer cannot check.

## Prior Art

The feature definition brief (`docs/feature-definition/Pending/spec-stage-ground-truth-review.md`) was reviewed in the conversation preceding this session. Key feedback on the brief itself:

- **Cost analysis undersells the tradeoff.** Three automated review passes before any code is written (spec fidelity + ground-truth + plan-attack). The brief should address total pipeline cost and whether plan-build's attack can be reduced in scope.
- **Default-on vs opt-in.** Brief proposes explicit opt-out for greenfield specs. Feedback: opt-in for v1 is safer — skills that prove value get adopted faster than skills requiring disablement.
- **First open question answers itself.** The brief's own analysis points to a plan-attack prompt variant, not a separate skill. Core discipline (file-path citations, severity model, reviewer dimensions) is identical.
- **Missing output artifact definition.** What does the ground-truth review produce? A report? Annotations on the spec? This matters for plan-build — if it should avoid re-checking, it needs to know what was already checked.
- **Missing failure/retry behavior.** What happens after HIGH-severity findings? Does the spec re-run fidelity review after edits, or only the ground-truth review?
- **Latent bug scope ambiguity.** The DiagnosticId collision finding was a pre-existing bug surfaced by the spec's changes, not a spec inaccuracy. Acceptance criteria don't address whether the reviewer should flag latent bugs or only spec errors.

## Design Decisions

### D1 — Reuse plan-attack as a prompt variant, not a new skill

The reviewer dimensions, citation standard, and severity model are identical to plan-attack. Creating a separate skill would duplicate all of this. A prompt variant or mode flag is the right approach.

**Rejected alternatives:**
- Separate skill — duplicates reviewer infrastructure for no functional gain

### D2 — Opt-in for v1

The ground-truth review should be opt-in during initial rollout. Value is proportional to verifiable code claims; greenfield specs gain little. Opt-in avoids adding ceremony where it doesn't help and lets the feature prove itself before becoming default.

**Rejected alternatives:**
- Default-on with opt-out — adds cost to every spec regardless of value; can be reconsidered after v1 proves itself

## Scope

### In scope

- Adding a ground-truth review step to `design-specify` (opt-in)
- Adapting plan-attack's prompt for spec-stage review (verifying spec claims against source files)
- Defining the output artifact the ground-truth review produces
- Defining failure/retry behavior when HIGH-severity issues are found

### Out of scope

- **Modifying plan-build's plan-attack** — _not yet_: may be revisited once spec-stage attack proves itself, to reduce redundant checking
- **Automatic detection of when ground-truth review is needed** — _not needed_: user opt-in is sufficient for v1

## Assumptions

- **"plan-attack's prompt can be adapted with minor changes"** — UNTESTED. The prompt currently targets implementation plans (task ordering, build breakage). Spec-stage review needs different framing (verifying claims, not tasks). Adaptation scope is assumed small but not yet confirmed.

## Residual Risks

- Token cost of running two review passes in specify stage may feel excessive for smaller specs where fidelity review alone is sufficient
- If plan-attack prompt adaptation is larger than expected, the "not a new skill" decision may need revisiting

## Acceptance Criteria

Acceptance criteria not yet defined — to be established during design.
