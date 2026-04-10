# Reasoning Audit: Ground-Truth Review in Specify Stage

**Date:** 2026-04-10
**Session:** 01
**Plan:** `add-attack-specify-plan-00.md`

## Executive Summary

The session implemented an opt-in ground-truth review step for Chester's `design-specify` skill, driven by evidence from a StoryDesigner sprint where plan-attack found 10 codebase-reality issues that the spec fidelity reviewer structurally could not catch. The most significant decision was reusing plan-attack's discipline via a reviewer template rather than creating a new skill or invoking plan-attack directly — this preserved the architectural boundary ("Does NOT invoke: plan-attack") while eliminating duplication of the core verification approach. Implementation stayed on-plan with two post-review fixes to the flow diagram.

## Plan Development

The plan was developed after a feature brief review that identified five gaps in the original proposal. Two design decisions were pre-seeded from the review (prompt variant over new skill, opt-in over default-on). The plan went through one review iteration (approved first pass), then parallel plan-attack and plan-smell hardening that returned 4 MEDIUM findings — all incorporated as mitigations before implementation began.

## Decision Log

### Prompt variant over separate skill

**Context:**
The feature brief's first open question asked whether the ground-truth review should be a separate skill or a mode of plan-attack. The design brief from the review discussion had already leaned toward a variant.

**Information used:**
- `skills/plan-attack/SKILL.md` — evidence standard, severity model, reviewer dimensions
- `skills/design-specify/spec-reviewer.md` — existing reviewer template pattern
- `skills/plan-build/plan-reviewer.md` — confirming the template dispatch pattern

**Alternatives considered:**
- `Separate skill` — would duplicate the evidence standard, severity model, reviewer dimensions, and output format with no functional gain
- `Invoke plan-attack directly` — would violate design-specify's "Does NOT invoke: plan-attack" boundary and couple the two skills

**Decision:** Create a reviewer prompt template (`ground-truth-reviewer.md`) in the design-specify skill directory, dispatched as a general-purpose subagent.

**Rationale:** The template pattern is already established by `spec-reviewer.md` and `plan-reviewer.md`. It shares plan-attack's intellectual discipline without creating a dependency. The two can evolve independently.

**Confidence:** High — design brief stated this explicitly, codebase patterns confirmed it.

---

### Escalation path routing fix

**Context:**
Plan-attack found that the process flow diagram routed fidelity escalation → ground-truth offer, but the ground-truth review's precondition is "after fidelity passes." In the escalation path, fidelity has failed twice — offering ground-truth contradicts the precondition.

**Information used:**
- `skills/design-specify/SKILL.md:66-67` — original escalation edge
- Plan-attack finding F9 — cited the specific contradiction

**Alternatives considered:**
- `Route escalation → ground-truth offer anyway` — contradicts the stated precondition; would run codebase verification on a spec that hasn't passed document fidelity
- `Route escalation → "Present to user"` — preserves original behavior; user resolves fidelity first

**Decision:** Route escalation to "Present to user", preserving the original diagram behavior.

**Rationale:** The ground-truth review's value depends on the spec being document-correct first. Running codebase verification on a spec with known fidelity issues wastes tokens on a document that will change.

**Confidence:** High — plan-attack cited the specific flow edges and the precondition text.

---

### Opt-in over default-on

**Context:**
The feature definition brief proposed default-on with explicit opt-out for greenfield specs. The review challenged this as backwards for cost reasons.

**Information used:**
- Feature brief evidence: ~80K tokens per ground-truth review
- Feature brief's own statement: "value is proportional to how many verifiable claims the spec makes"

**Alternatives considered:**
- `Default-on with opt-out` — adds ~80K token cost to every spec regardless of value; feature brief's own evidence argues against this
- `Opt-in for v1` — lets the feature prove itself; can be promoted to default after validation

**Decision:** Opt-in for v1. The design-specify skill offers the review with a recommendation note, and the user accepts or declines.

**Rationale:** Skills that prove their value get adopted faster than skills that must be disabled. The cost (~80K tokens) is non-trivial, and greenfield specs gain nothing from codebase verification.

**Confidence:** High — explicitly discussed and decided during feature brief review.

---

### Adding iteration cap to ground-truth re-review

**Context:**
Plan-attack found that the ground-truth review's HIGH-finding re-review loop had no iteration cap, breaking the pattern established by the fidelity review loop (max 2 iterations).

**Information used:**
- `skills/design-specify/SKILL.md:149` — fidelity review's 2-iteration cap pattern
- Plan-attack finding F7

**Alternatives considered:**
- `No cap` — risks infinite loop on a spec that fundamentally misunderstands a subsystem
- `1 iteration` — too strict; some HIGH findings genuinely need a second pass after fix
- `2 iterations with escalation` — matches fidelity pattern, provides escape hatch

**Decision:** 2-iteration cap with user escalation, matching the fidelity review pattern.

**Rationale:** Consistency with the fidelity pattern. If ground-truth issues can't be resolved in 2 passes, the spec likely needs human judgment about how to proceed.

**Confidence:** High — plan-attack cited the specific existing pattern; the cap value follows directly.

---

### Flow diagram loop-back target fix

**Context:**
Code review found the "changes requested" edge in the flow diagram pointed to "Write spec document" (step 4) instead of "Dispatch spec reviewer" (step 5). This was a pre-existing bug in the original diagram that was faithfully reproduced.

**Information used:**
- `skills/design-specify/SKILL.md` line 33 — checklist says "loop back to step 5"
- `skills/design-specify/SKILL.md` line 81 — diagram edge targeted step 4
- Code reviewer finding at confidence 92

**Alternatives considered:**
- `Leave as-is` — technically a pre-existing bug not introduced by this change
- `Fix it` — we're touching the diagram anyway, and the inconsistency affects the new ground-truth path

**Decision:** Fix the loop-back to target "Dispatch spec reviewer" (step 5).

**Rationale:** The prose and checklist both say step 5. Leaving a known diagram inconsistency in code we're actively editing would be negligent. The fix is one edge change.

**Confidence:** High — checklist text, prose description, and code review finding all agree.

---

### Split "Write GT report" into separate diagram node

**Context:**
Code review found the clean GT path (no findings) bypassed the "Fix HIGH/MEDIUM findings\nWrite report" node, meaning a clean review produced no artifact. The prose says reports are always written.

**Information used:**
- Prose step 3: "Write the ground-truth report" — unconditional
- Diagram edge: `GT findings? -> Present to user [label="clean"]` — skipped the write node
- Code reviewer finding at confidence 88

**Alternatives considered:**
- `Route both paths through existing combined node` — misleading label ("Fix HIGH/MEDIUM findings") for clean reviews
- `Split into separate "Fix findings" and "Write GT report" nodes` — both paths flow through write, clean path skips fix

**Decision:** Split the node. "Fix HIGH/MEDIUM findings" only on findings path; "Write GT report" shared by both paths.

**Rationale:** The report documents verified claims even when there are no findings — that's valuable to the implementer. The combined node's label implied writing only happens when there are findings to fix.

**Confidence:** High — prose is unambiguous ("write the report"), diagram was missing the path.

---

### Worktree cd hazard (operational)

**Context:**
During test verification, `cd` to the main repo root to run tests against main silently changed the git context. The subsequent `git commit --allow-empty` for the execution checkpoint landed on `main` instead of the feature branch.

**Information used:**
- `git branch --show-current` showed `main` after the commit
- The commit was empty (checkpoint marker), so no code was at risk

**Alternatives considered:**
- *(No alternatives visible in context)* — this was an error, not a choice

**Decision:** Reversed with `git reset HEAD~1`, re-committed on correct branch, saved feedback memory for future sessions.

**Rationale:** Git worktrees are separate checkouts sharing one object store. The shell's working directory determines which branch git operates on. Cross-tree `cd` without returning is a latent hazard in every worktree session.

**Confidence:** High — error was directly observed and corrected.
