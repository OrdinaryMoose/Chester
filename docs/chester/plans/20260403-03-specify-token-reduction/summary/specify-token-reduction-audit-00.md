# Reasoning Audit: Review Sequence Redesign for Pipeline Token Efficiency

**Date:** 2026-04-03
**Session:** `00`
**Plan:** `specify-token-reduction-plan-00.md`

---

## Executive Summary

The session started with a request to reduce the token cost of the specify skill and ended with a redesign of the entire review sequence across two skills. The most consequential decision was reframing from "make one skill cheaper" to "review for purpose at the right stage" — driven by the user identifying duplication across the specify-to-plan transition. Implementation stayed on-plan with one addition (deleting dead spec-reviewer.md copies) surfaced by the hardening agents.

---

## Plan Development

The plan emerged from a 15-round architect interview that progressively widened scope. The initial problem statement ("reduce API spend on specify") survived only 5 rounds before the user expanded it to include plan-build's review layers. The user's three-stage model (goals/framework/execution) provided the organizing principle. The plan was written, reviewed by a subagent (approved first pass with one advisory fix), then hardened through 10 parallel agents. One actionable finding (duplicate spec-reviewer.md files) was incorporated as Task 5 before the plan was approved.

---

## Decision Log

---

### Problem Reframing from Single-Skill to Cross-Stage

**Context:**
The initial request was to reduce the token cost of the chester-design-specify skill. After 5 rounds exploring specify internals (review iterations, Think tool usage, subagent cost), the conversation stalled — the user valued the review but couldn't pinpoint what was expensive.

**Information used:**
- `chester-design-specify/SKILL.md` — review loop structure, 3 max iterations
- `chester-design-specify/spec-reviewer.md` — 5-category checklist
- `chester-plan-build/SKILL.md` — plan review loop, plan hardening with attack + smell
- `chester-plan-build/plan-reviewer.md` — 4-category checklist with overlap on completeness

**Alternatives considered:**
- `Optimize within specify only` — reduce iterations, lighter subagent. Abandoned when user expanded scope.
- `Eliminate the spec stage entirely` — explored via contrarian challenge. User hadn't questioned the stage but wasn't ready to. Parked.

**Decision:** Reframe the problem as cross-stage review placement, not single-skill optimization.

**Rationale:** The user volunteered "lets pull in a second system also which is build plan which contains another round of review. Maybe that is what I am sensing that we are maybe duplicating work?" This was the user's own insight — the agent's role was to create the space for it via the ontologist reframe.

**Confidence:** High — user explicitly drove this expansion.

---

### Aggregate Effectiveness as Constraint

**Context:**
After establishing the three-stage model, the agent tried to get pre-approval for moving individual checks between stages ("if an issue that used to get caught at spec stage now gets caught at plan stage, is that fine?"). The user pushed back twice.

**Information used:**
- User's statement: "not what I said. The overarching process is the sum of its parts and the whole is effective"
- User's correction: "dont take my statement as a fact, may have been a less than perfect recollection" — about spec review catching real issues individually

**Alternatives considered:**
- `Treat reviews as independently movable parts` — rejected by user twice
- `Treat the pipeline as monolithic` — too restrictive, user was open to restructuring

**Decision:** Adopt the constraint that restructuring must preserve the aggregate effectiveness, not just relocate individual checks.

**Rationale:** The user's pushback established that the pipeline works as an emergent whole. Individual reviews contribute to aggregate quality in ways that may not be obvious from their stated purpose alone.

**Confidence:** High — user stated this directly and reinforced it.

---

### Spec Review Iteration Reduction (3→2)

**Context:**
The spec reviewer currently allows up to 3 review iterations. The user reported that in practice, review typically runs once.

**Information used:**
- User: "i am only presented the findings once and then they are incorporated into the plan. From the ui perspective this process only happens once"
- Spec analysis showing spec review is narrowing from 5 categories to 4

**Alternatives considered:**
- `Keep at 3 iterations` — unnecessary overhead for a narrower review
- `Reduce to 1 iteration` — too aggressive; the review does find real issues

**Decision:** Reduce to max 2 iterations — one pass plus one fix-and-verify.

**Rationale:** A narrower review (design-alignment only) should produce fewer findings per pass. Two iterations provides a safety margin while cutting the theoretical max dispatch count. (inferred)

**Confidence:** Medium — the reduction follows logically but wasn't explicitly discussed with the user.

---

### Deletion of Duplicate spec-reviewer.md Files

**Context:**
Plan hardening (assumptions agent) discovered three identical copies of spec-reviewer.md across chester-design-specify, chester-design-figure-out, and chester-design-architect. The plan only updated one.

**Information used:**
- `md5sum` verification confirmed all three copies were identical
- Grep across all SKILL.md files confirmed neither figure-out nor architect referenced their copies
- Only `chester-design-specify/SKILL.md:126` and `chester-execute-write/SKILL.md:112` dispatch spec reviewers

**Alternatives considered:**
- `Update all three copies` — initial assumption, but investigation revealed two were dead files
- `Leave them in place` — would create inconsistency with no benefit

**Decision:** Delete the unreferenced copies in figure-out and architect. Keep the execute-write copy (different content, different purpose).

**Rationale:** The user asked "why are there copies?" which prompted investigation revealing they were artifacts from an earlier structure. Dead files should be removed, not updated.

**Confidence:** High — verified via grep that no references exist.

---

### Skipping Per-Task Code Review for Markdown Changes

**Context:**
The execute-write skill prescribes spec-compliance and code-quality reviewer dispatches after each implementer task. This plan modifies only markdown files.

**Information used:**
- Plan tech stack: "Markdown (skill definitions), no code changes"
- All 5 tasks modify or delete .md files only

**Alternatives considered:**
- `Run full review pipeline per task` — would consume tokens reviewing prose against code-quality criteria that don't apply
- *(No alternatives visible in context)*

**Decision:** Dispatch implementer subagents but skip spec-compliance and code-quality reviewer dispatches. Verify changes manually between tasks.

**Rationale:** The review pipeline is designed for code changes. Markdown prose doesn't benefit from code-quality review. This is itself an example of the "review for purpose at the right stage" principle the sprint implements. (inferred)

**Confidence:** Medium — pragmatic choice, not explicitly discussed with user.
