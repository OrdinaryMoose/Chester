# Reasoning Audit: Build design-small-task Skill

**Date:** 2026-04-10
**Session:** `01`
**Plan:** `build-small-task-skill-plan-00.md`

## Executive Summary

This session designed and implemented a lightweight Chester design skill to fill the gap between heavyweight design skills (figure-out, experimental) and bypassing design entirely. The most significant decision was the proceed gate design — escalated three times by the designer from advisory language to fully designer-initiated with no agent role in the transition. The implementation stayed on-plan with one scope expansion (adding `util-design-brief-small-template` as a proper reference skill, identified during plan hardening).

## Plan Development

The plan emerged directly from the design brief produced by design-experimental's proof phase. Initial 3-task plan (create SKILL.md, register in setup-start, update budget guard test) was revised during plan hardening: budget guard test task dropped because the test was pre-existing broken, and a new task added for `util-design-brief-small-template` after plan-attack identified the brief format departure as undocumented. The final 4-task plan was approved and executed via subagent dispatch.

## Decision Log

### Proceed gate escalation

**Context:**
The core design problem — LLMs rush through interviews due to completion bias — required a conversation gate mechanism. Three proposals were rejected before the designer settled on the final form.

**Information used:**
- Skill-creator analysis showing 4 lines of advisory prose fail to hold conversation
- Skill-creator's iteration loop succeeds because `feedback.json` physically doesn't exist until user acts
- Design-experimental's MCP-enforced thresholds work but are heavyweight

**Alternatives considered:**
- `Advisory language` ("treat confirmations as continue signals") — rejected: still relies on model judgment to distinguish
- `Explicit checkpoint question` ("Ready for me to write the brief?") — rejected: agent still initiates the transition
- `Magic phrase trigger` — rejected: model still has to decide when to offer
- `Confirmation vs action directive interpretation` — rejected: model still interprets intent

**Decision:** Agent has no role in the transition at all. It never suggests, recommends, or steers. The designer holds the only key.

**Rationale:** Each escalation reflected the designer's direct experience with completion bias overriding advisory instructions. The final form removes the model's agency entirely — it cannot initiate, suggest, or frame toward closure.

**Confidence:** High — designer explicitly directed each escalation with clear reasoning.

---

### Prior Art added to brief format

**Context:**
Initial 5-section brief format (Goal, Scope, Key Decisions, Constraints, Acceptance Criteria) omitted Prior Art. Designer corrected: "things that we do now are shaped by what was done before."

**Information used:**
- Full `util-design-brief-template` has Prior Art as REQUIRED section
- The template's origin story: a correct exclusion was misread as a gap because no rationale was present

**Alternatives considered:**
- `Keep 5 sections without Prior Art` — rejected by designer

**Decision:** Add Prior Art as the second section, making a 6-section format.

**Rationale:** Even bounded tasks are shaped by prior work — existing patterns, previous attempts, codebase conventions. Without Prior Art, a reader can't understand why the design is shaped the way it is.

**Confidence:** High — designer explicitly directed this addition.

---

### Budget guard test dropped from plan

**Context:**
Plan-attack (HIGH severity) and plan-smell (MEDIUM) both found the budget guard test was already broken — references nonexistent `skills/finish/SKILL.md`, grep patterns don't match most listed skills.

**Information used:**
- Running `bash tests/test-budget-guard-skills.sh` produces 11 errors across 4 skills
- Plan originally proposed an HTML comment hack to satisfy grep checks

**Alternatives considered:**
- `HTML comment hack` — proposed in plan, identified as papering over broken test
- `Fix the test properly` — out of scope for this sprint
- `Drop the task entirely` — chosen

**Decision:** Remove budget guard test task from the plan. The broken test is pre-existing tech debt.

**Rationale:** Layering a workaround onto a broken test adds complexity without value. The test needs a broader fix (update file paths, fix grep patterns) that exceeds this sprint's scope.

**Confidence:** High — both hardening reviews independently identified the same issue; designer confirmed the mitigation.

---

### util-design-brief-small-template created as reference skill

**Context:**
Plan-attack (LOW) noted the simplified brief format departs from the canonical 13-section template without documentation. Designer directed creating a proper reference skill rather than just noting the departure.

**Information used:**
- Full `util-design-brief-template` is 541 lines with 13 sections
- Pattern established: "read, don't invoke" reference skills (util-artifact-schema, util-budget-guard)

**Alternatives considered:**
- `One-line note in SKILL.md Integration section` — agent's initial proposal
- `Full reference skill` — designer directed

**Decision:** Create `skills/util-design-brief-small-template/SKILL.md` as a first-class reference skill with explicit omission rationale table.

**Rationale:** Making the simplified format a proper reference skill prevents future maintainers from "fixing" design-small-task to use the full template. The omission table documents which sections were deliberately dropped and why.

**Confidence:** High — designer explicitly directed this approach.

---

### Translation Gate dropped

**Context:**
Design-experimental enforces domain-only language via Translation Gate — no type names, file paths, method names in visible output. Question: does this apply to a lightweight skill for bounded tasks?

**Information used:**
- Translation Gate exists to prevent implementation drift during long (10-20 round) conversations
- For bounded tasks, the designer likely already knows the territory
- Code vocabulary in commentary is useful, not noise

**Alternatives considered:**
- `Keep Translation Gate from design-experimental` — rejected
- `Make Translation Gate optional/configurable` — rejected

**Decision:** Drop Translation Gate entirely. Code vocabulary welcome when it adds clarity.

**Rationale:** For well-bounded tasks, the designer is already thinking in terms of specific files and patterns. Forcing domain-only language adds cognitive overhead without value. (inferred: designer confirmed without elaboration)

**Confidence:** Medium — designer confirmed with single word ("drop the translation gate"), rationale inferred from context.

---

### Three-layer visible surface retained at full weight

**Context:**
Agent proposed simplifying the information package from three components to two (merging "current facts" + "surface analysis" into "current state", renaming "uncomfortable truths" to "considerations"). Designer rejected.

**Information used:**
- Design-experimental's three components: current facts, surface analysis, uncomfortable truths
- Each serves a distinct purpose (facts vs analysis vs pessimist stance)

**Alternatives considered:**
- `Reduce to two components` — rejected by designer

**Decision:** Keep all three information package components unchanged from design-experimental.

**Rationale:** The three-component structure is the presentation style the designer explicitly wanted preserved, regardless of skill weight. The distinction between observation, analysis, and pessimism is the value proposition.

**Confidence:** High — designer explicitly rejected the simplification.
