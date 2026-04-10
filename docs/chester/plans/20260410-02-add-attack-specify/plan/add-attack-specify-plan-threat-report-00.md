# Plan Threat Report: Ground-Truth Review in Specify Stage

**Plan:** add-attack-specify-plan-00.md
**Date:** 2026-04-10
**Sources:** plan-attack (10 findings), plan-smell (5 findings)

## Combined Risk Level: Moderate

Core architecture is clean — the plan follows established patterns (reviewer template, subagent dispatch, artifact registration) and touches the right files. The findings are about workflow logic gaps and behavioral ambiguity in edge cases, not structural problems with the approach.

### Why Moderate:

1. Two workflow logic gaps need fixing before implementation: the escalation path offers ground-truth review after fidelity has *failed* (contradicting its own precondition), and the ground-truth re-review loop has no iteration cap (breaking the pattern set by the fidelity loop)
2. Behavioral ambiguity around re-offer on user revision loops will produce inconsistent agent behavior if left unspecified
3. Two CLAUDE.md-mandated sync items (setup-start description, frontmatter description) are missing from the plan
4. No finding threatens the core architecture; all fixes are additive (extra sentences in the skill, extra edits in the plan)

---

## Findings

### MEDIUM — Escalation path offers ground-truth before fidelity passes

**Sources:** Attack F9, Smell F3 (related)

The plan's process flow routes `"Escalate to user" -> "Offer ground-truth review"`. But the ground-truth review's stated precondition is "after fidelity review passes." In the escalation path, fidelity has failed twice and been escalated — it has NOT passed. Offering ground-truth review at this point contradicts the precondition.

**Evidence:** `skills/design-specify/SKILL.md:66-67` (current escalation edge), plan lines 269, 289

**Fix:** Route escalation to "Present to user" (preserving current behavior). The user resolves fidelity issues, and ground-truth is offered only after fidelity subsequently passes.

### MEDIUM — No iteration cap for ground-truth re-review

**Source:** Attack F7

The plan says "HIGH findings: Fix the spec... Re-run the ground-truth review only" but defines no cap on iterations. The fidelity review has an explicit 2-iteration cap with user escalation (`skills/design-specify/SKILL.md:149`). The ground-truth review should follow the same pattern.

**Evidence:** `skills/design-specify/SKILL.md:149` (fidelity cap pattern), plan lines 303-304 (no cap)

**Fix:** Add "If ground-truth review loop exceeds 2 iterations, escalate to user for guidance" — matching the fidelity pattern.

### MEDIUM — Re-offer behavior on user revision loops is unspecified

**Sources:** Attack F2, Smell F5

When the user requests changes at the user review gate, the flow loops back to "Write spec document" and traverses the entire review chain again. The plan doesn't specify whether the ground-truth offer should re-fire on subsequent passes. For a feature pitched as opt-in to manage cost, silently re-offering (or silently re-running) on every revision loop is a behavioral gap.

**Evidence:** Plan lines 214-229 (checklist), plan line 278 (flow diagram loop-back edge)

**Fix:** Add a clarifying sentence: "If the ground-truth review already ran in this session, re-offer only if the user's changes affect code references. Otherwise, skip to user review gate."

### MEDIUM — Asymmetric re-review creates silent assumption

**Source:** Smell F3

The plan says ground-truth fixes skip the fidelity reviewer because "the fix targets codebase accuracy, not brief alignment." This assumes ground-truth fixes never change the spec enough to violate design brief constraints. That's usually true, but a HIGH finding like "the API you reference doesn't exist, use this different one instead" could change the architecture.

**Evidence:** Plan lines 303-306 (re-review logic)

**Fix:** Acknowledge the edge case: "If a ground-truth fix changes the spec's architectural approach (not just correcting a reference), re-run the fidelity review as well."

### LOW — setup-start and frontmatter descriptions not updated

**Sources:** Attack F4, F5

CLAUDE.md requires: "If you change what a skill does, update both [the SKILL.md description and setup-start's available skills list]." The plan modifies design-specify but doesn't update the YAML frontmatter description (`skills/design-specify/SKILL.md:3`) or the setup-start entry (`skills/setup-start/SKILL.md:248`).

**Evidence:** `CLAUDE.md` (sync convention), `skills/design-specify/SKILL.md:3`, `skills/setup-start/SKILL.md:248`

**Fix:** Add a task or steps to update both descriptions. Suggested wording: "Formalize approved designs into spec documents with automated fidelity and optional codebase verification review."

### LOW — Forward reference to plan-build with no mechanism

**Source:** Attack F8

Plan line 311 says "the plan-attack reviewer can reference [the ground-truth report] to avoid re-verifying claims." But the plan explicitly marks modifying plan-build as out of scope, and no mechanism passes the report path to plan-attack during plan-build.

**Evidence:** `skills/plan-build/SKILL.md:175-186` (plan-attack dispatch), plan design brief line 54 (out of scope)

**Fix:** Reword as a future consideration: "In a future iteration, plan-build could pass the ground-truth report to plan-attack to reduce redundant verification."

### LOW — Duplicated review discipline without shared abstraction

**Source:** Smell F1

The ground-truth reviewer template replicates plan-attack's evidence standard, severity model, and output format as independent prose. Changes to the review discipline would need to be made in both places.

**Evidence:** `skills/plan-attack/SKILL.md:79-88` vs plan lines 78-84

**Assessment:** Acceptable for prompt templates. These are prose instructions, not code — the drift risk is low and a shared abstraction would add complexity without clear benefit at this scale.

### LOW — Dispatch mechanism clarity

**Source:** Attack F3

The template uses "Task tool (general-purpose)" dispatch (matching spec-reviewer.md and plan-reviewer.md patterns), while the design brief says "reuse plan-attack." An implementer might use Agent dispatch instead. The template and plan are consistent with each other, but the design brief's framing creates tension.

**Evidence:** `skills/design-specify/spec-reviewer.md:10` (Task tool pattern), design brief line 29

**Assessment:** The plan is correct — it follows the reviewer template pattern. No fix needed, but the design brief's "reuse plan-attack" language could be clarified if it causes confusion.

### LOW — Verification step landmarks and grep patterns

**Sources:** Attack F1, F10

Task 2's verification greps for `plan-threat-report` instead of the `spec` row it's inserting near. Task 4's step numbering check (`^[0-9]+\.`) matches all numbered lists in the file, not just the checklist. Neither will cause implementation failure — an implementer will figure it out.

---

## Verified Assumptions

- The reviewer template pattern (separate .md file in skill directory, dispatched as general-purpose subagent) is established by both `spec-reviewer.md` and `plan-reviewer.md` — the plan correctly follows this convention
- The artifact schema table format and insertion point are correct
- The "Does NOT invoke: plan-attack" boundary is preserved — the ground-truth reviewer is an independent dispatch, not a plan-attack invocation
- The `spec/` directory placement follows the `plan-threat-report` in `plan/` precedent (review artifact co-located with reviewed artifact)
