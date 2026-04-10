# Session Summary: Ground-Truth Review in Specify Stage

**Date:** 2026-04-10
**Session type:** Feature brief review, planning, and implementation
**Plan:** `add-attack-specify-plan-00.md`

## Goal

Add an opt-in ground-truth review step to Chester's `design-specify` skill that verifies spec claims against the actual codebase — catching false assumptions, incorrect types, impossible guards, and latent bugs that the existing fidelity-only review cannot detect.

## What Was Completed

### Feature Brief Review

Reviewed `docs/feature-definition/Pending/spec-stage-ground-truth-review.md`. Identified five gaps: missing output artifact definition, missing failure/retry behavior, the first open question answering itself (prompt variant, not new skill), cost analysis underselling the tradeoff, and default-on being backwards for v1 rollout.

### Design Brief

Created a context brief capturing the review feedback as prior art, pre-seeding two design decisions: (D1) reuse plan-attack as a prompt variant, not a new skill; (D2) opt-in for v1.

### Plan Build + Hardening

Wrote a 5-task implementation plan. Plan review passed on first iteration. Plan hardening (plan-attack + plan-smell in parallel) returned a **Moderate** combined risk level with 4 MEDIUM and 5 LOW findings. All 4 MEDIUM mitigations were incorporated:

| Mitigation | Fix |
|-----------|-----|
| Escalation path offered ground-truth before fidelity passed | Routed escalation to "Present to user" |
| No iteration cap on ground-truth re-review | Added 2-iteration cap with user escalation |
| Re-offer behavior on revision loops unspecified | Added suppression rule for already-run reviews |
| Asymmetric re-review assumed fixes never affect brief alignment | Added architectural-change exception |

### Implementation

5 tasks executed via subagent-driven mode:

1. Created `ground-truth-reviewer.md` — reviewer prompt template with 5 review dimensions (factual accuracy, behavioral assumptions, contract fidelity, completeness of references, latent interactions)
2. Registered `spec-ground-truth-report` artifact type in `util-artifact-schema`
3. Added ground-truth review step to `design-specify` — checklist, process flow diagram, review section with severity-based handling, integration section
4. Updated YAML frontmatter and setup-start descriptions (CLAUDE.md sync convention)
5. Cross-reference verification across all modified files

### Code Review Fixes

Post-implementation code review found 2 Important issues in the flow diagram:
- Loop-back edge on user changes pointed to "Write spec document" (step 4) instead of "Dispatch spec reviewer" (step 5) — pre-existing bug reproduced
- Clean GT path skipped report writing — split into separate "Fix findings" and "Write GT report" nodes so both paths produce the artifact

## Verification Results

| Check | Result |
|-------|--------|
| test-chester-config.sh | PASS |
| test-compaction-hooks.sh | PASS (8/8) |
| test-config-read-new.sh | PASS (all) |
| test-budget-guard-skills.sh | FAIL (pre-existing, 11 errors on main) |
| test-integration.sh | FAIL (pre-existing, same budget guard issues) |
| test-start-cleanup.sh | FAIL (pre-existing, stale paths) |
| test-statusline-usage.sh | FAIL (pre-existing, runtime dependency) |
| test-write-code-guard.sh | FAIL (pre-existing, stale paths) |
| Clean working tree | PASS |

Zero new test failures introduced.

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `skills/design-specify/ground-truth-reviewer.md` | Created | Reviewer prompt template (86 lines) |
| `skills/design-specify/SKILL.md` | Modified | +52/-6 lines — new step 6, flow diagram, review section, integration |
| `skills/util-artifact-schema/SKILL.md` | Modified | +1 line — artifact type registration |
| `skills/setup-start/SKILL.md` | Modified | +1/-1 — description sync |

## Commits

| Hash | Message |
|------|---------|
| `4f75e13` | feat: add ground-truth reviewer template for spec-stage codebase verification |
| `546a989` | feat: add spec-ground-truth-report artifact type to schema |
| `3006713` | feat: add opt-in ground-truth review step to design-specify |
| `b2a925d` | chore: sync design-specify description with ground-truth review capability |
| `0efc995` | fix: correct flow diagram loop-back target and ensure GT report always written |
| `5db5c5f` | checkpoint: execution complete |

## Handoff Notes

- The feature brief at `docs/feature-definition/Pending/spec-stage-ground-truth-review.md` can be marked as implemented once this branch merges
- The ground-truth review is opt-in — it will not affect existing `design-specify` workflows until a user accepts the offer
- Plan-build's plan-attack is unchanged — a future iteration could pass the ground-truth report to reduce redundant verification, but that is explicitly out of scope
- 4 pre-existing test failures remain unrelated to this work (budget guard and stale path issues)
