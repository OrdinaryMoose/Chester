# Session Summary: Review Sequence Redesign for Pipeline Token Efficiency

**Date:** 2026-04-03
**Session type:** Design discovery, specification, planning, and implementation
**Plan:** `specify-token-reduction-plan-00.md`

---

## Goal

Reduce API token spend across the Chester pipeline's review layers by redesigning when and why each review fires, so that no two reviews duplicate purpose and each fires at the stage where its artifact is mature enough to benefit.

## What Was Completed

### Design Discovery (chester-design-architect)

Conducted a 15-round Socratic interview that reframed the problem from "make the specify skill cheaper" to "review for purpose at the right stage." Key discoveries:

- The user's three-stage model: design = goals, specification = framework, plan = execution
- Each stage transition gets one purpose-driven review: design-alignment, spec-fidelity, codebase-risk
- The review pipeline's effectiveness is emergent from the sum of its parts — individual reviews cannot be freely rearranged without risk to the aggregate
- Plan-attack and plan-smell were already correctly placed (codebase-risk at plan level)

### Specification and Planning

Spec and plan written, reviewed, and hardened through the full pipeline:

- Spec reviewer narrowed from 5 categories to 4 (design-alignment focus)
- Plan reviewer narrowed to spec-fidelity with explicit non-responsibility statement
- Max spec review iterations reduced from 3 to 2
- Spec reviewer now requires design brief as input (with standalone fallback)

### Plan Hardening

10 agents (6 attack + 4 smell) found one actionable issue: three identical copies of `spec-reviewer.md` existed across skills, but only one was referenced. Added Task 5 to delete the dead copies.

### Implementation

5 tasks executed via subagent dispatch:

| Task | File | Change |
|------|------|--------|
| 1 | `chester-design-specify/spec-reviewer.md` | Replaced 5-category checklist with 4-category design-alignment checklist |
| 2 | `chester-design-specify/SKILL.md` | Updated review loop section, iteration limit 3→2, added design brief dispatch |
| 3 | `chester-plan-build/plan-reviewer.md` | Replaced checklist with spec-fidelity focus, added non-responsibility statement |
| 4 | `chester-plan-build/SKILL.md` | Added "Review purpose: Spec Fidelity" to review loop section |
| 5 | `chester-design-figure-out/spec-reviewer.md`, `chester-design-architect/spec-reviewer.md` | Deleted unreferenced dead copies |

### Incidental Findings

- **Enforcement MCP bug:** `pressurePassComplete` is never set to `true` in `updateState()` — the pressure pass gate can never be mechanically satisfied. Not fixed this session.
- **Enforcement MCP dependency:** `@modelcontextprotocol/sdk` was missing from `node_modules`. Fixed with `npm install` at session start.

## Files Changed

| File | Action |
|------|--------|
| `chester-design-specify/spec-reviewer.md` | Modified — design-alignment reviewer |
| `chester-design-specify/SKILL.md` | Modified — review loop, iteration limit, diagram |
| `chester-plan-build/plan-reviewer.md` | Modified — spec-fidelity reviewer |
| `chester-plan-build/SKILL.md` | Modified — review purpose statement |
| `chester-design-figure-out/spec-reviewer.md` | Deleted — unreferenced |
| `chester-design-architect/spec-reviewer.md` | Deleted — unreferenced |
| `docs/chester/plans/20260403-03-specify-token-reduction/design/*` | Created — 3 design artifacts |
| `docs/chester/plans/20260403-03-specify-token-reduction/spec/*` | Created — spec |
| `docs/chester/plans/20260403-03-specify-token-reduction/plan/*` | Created — plan |

## Known Remaining Items

- **Observational validation:** Run 2-3 features through the redesigned pipeline and compare aggregate review quality. The spec's AC6 requires this.
- **Enforcement MCP pressure pass bug:** `state.js:updateState()` never flips `pressurePassComplete` to `true`. Needs a fix to evaluate `pressureTracking` entries.
- **Lessons table updated:** 3 changes applied to `~/.chester/thinking.md` — two score increments, one replacement.

## Handoff Notes

The review sequence redesign is merged to main. Next time you run a feature through the pipeline, pay attention to whether the narrowed spec reviewer (design-alignment only) catches meaningful issues, and whether the plan reviewer (spec-fidelity) picks up anything the old spec reviewer would have caught. This is the observational validation the spec requires.
