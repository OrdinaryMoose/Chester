# Session Summary: Master Plan Sprint Mode — Design (Stopped Mid-Interview)

**Date:** 2026-04-25
**Session type:** Small-task design conversation (stopped before closure)
**Plan:** *(none — design phase only)*

---

## Goal

Run `design-small-task` against the predecessor brief at `docs/feature-definition/Pending/master-plan-sprint-mode/master-plan-sprint-mode-00.md`. The predecessor proposed promoting StoryDesigner's hand-rolled "Master Plan Mode" `CLAUDE.md` override into a first-class Chester capability with three new top-level skills, three skill modifiers, a schema extension, and a reference doc — covering eight pain points (P1-P8) surfaced during seven days of usage. The session's purpose was to test that scope and arrive at a brief Chester would actually want to ship.

## What Was Decided

### Scope shape

The original brief's eight pain points re-clustered into three categories:

- **Cluster 1** (overlay activation, sub-sprint placement, archive expansion) — genuine Chester capability gap, generalizes to any multi-month refactor
- **Cluster 2** (versioning lockstep, deferred elevation) — narrower, fits inside finish-time write flow
- **Cluster 3** (lockfile, JSONL churn, fitness rerun, drift scan) — one-project incident remediation, doesn't generalize

Cluster-3 ruled out of scope entirely. Defer until pattern repeats outside StoryDesigner.

### Activation mechanism

Promotion shrinks from "three new skills + three modifiers" to **three skill modifiers + one reference doc + one template header**. No new top-level skills. Existing `master-plan-generator` (still in Pending) ships as-is with minor naming-form update.

| Component | Type | What changes |
|-----------|------|--------------|
| `master-plan-generator` | existing skill (Pending) | Install from current location. Update template to use runtime sub-sprint naming form. |
| `start-bootstrap` | existing skill | Add `.active-master` detection branch. Auto-derive sub-sprint placement from master-plan body. |
| `finish-archive-artifacts` | existing skill | Add `.active-master` detection branch. Full master-subtree copy on each sub-sprint merge. |
| `finish-write-records` | existing skill | Add `.active-master` detection branch. Atomically write master-plan version bump + change-log entry + reassessment + deferred-items append. |
| Master-plan template | content | Add "How To Use This Plan" header documenting workflow, closure protocol. |
| `docs/master-plan-mode.md` | new doc | Canonical reference at known Chester location. |
| `.active-master` breadcrumb | spec | Single line at `{CHESTER_WORKING_DIR}/.active-master` containing master-sprint name. |

### Directory shape

Designer ruling: master-sprint dir holds `master-plan.md` at root + sub-sprint dirs as the only children. Each sub-sprint dir holds the standard 4 artifact subfolders. **No master-level `{design,spec,plan,summary}/` subfolders.** Cross-sub-sprint artifacts (deferred items, reassessments) append into master-plan body.

### Sub-sprint naming

Runtime form chosen: `sprint-<a1|b1|b2|...>-<slug>` for implementation, `lbd-<nn>-<slug>` for design-only. LBD prefix encodes a real behavioral distinction — design-only sub-sprints have no execute phase.

### Closure protocol

Designer-initiated, conversation-driven, no skill. Designer signals close intent → agent reads `master-plan.md` and assesses readiness from sub-sprint statuses, unresolved decision gates, deferred items, endstate criteria → reports findings → designer approves → agent runs `rm .active-master`. Master-plan stays load-bearing through entire lifecycle.

### Lockstep collapse

Designer revealed that master-plan version bumps happen at Chester finish time, not as ad-hoc mid-sprint edits. This collapsed the proposed `master-plan-body-edit` skill entirely — `finish-write-records` mode-aware branch writes version + change-log + reassessment + deferred-items as one atomic operation. Lockstep is by-construction, not by-enforcement.

### Discoverability model

Three independent paths, no single point of failure:

1. Skill tool surfaces `master-plan-generator` on trigger phrases ("master plan", "long refactor", "multi-session")
2. Master-plan template's "How To Use This Plan" header — self-instructing because the document is the working artifact
3. `docs/master-plan-mode.md` canonical reference at known Chester location

## What Was Produced

- `docs/chester/working/20260424-02-design-masterplan-mode/design/design-masterplan-mode-design-00.md` — six-section design brief (mid-interview snapshot)

No spec, plan, or implementation artifacts. Sprint stopped before closure phase of `design-small-task`.

## Known Remaining Items

Not explored before stop:

- Concrete content of `docs/master-plan-mode.md`
- Concrete content of master-plan template's "How To Use This Plan" header
- How `master-plan-generator` template should be updated to match runtime naming form (currently `Sprint[NNN]a/b/c`)
- Criteria for revisiting cluster-3 decisions (when pattern repeats outside one project)
- Whether existing StoryDesigner project migrates from current `CLAUDE.md` override to new breadcrumb-only mode, or runs both simultaneously

## Files Changed

- `docs/chester/working/20260424-02-design-masterplan-mode/design/design-masterplan-mode-design-00.md` — Created
- `docs/chester/working/20260424-02-design-masterplan-mode/summary/design-masterplan-mode-summary-00.md` — Created (this file)
- `docs/chester/working/20260424-02-design-masterplan-mode/summary/design-masterplan-mode-audit-00.md` — Created
- `docs/chester/working/.active-sprint` — Created (points to sprint subdir)

No code changes. No commits during session — finish-archive-artifacts will commit.

## Handoff Notes

Brief is a mid-interview snapshot, not a finalized handoff to spec stage. Conversation reached convergence on every topic addressed, but some derivation work (concrete reference doc text, template header text, naming-form updates) was left unexplored before the designer signaled stop.

Next session can either resume the design conversation (load brief, continue with the unexplored items above) or treat the brief as complete and proceed to `design-specify`. The brief's "Status at Stop" section in its preamble flags that decision explicitly.

The `master-plan-generator` skill is the natural first thing to ship if execution begins — it's already mature in Pending, just needs installation and the template naming-form fix. The three skill modifiers can ship in any order once the breadcrumb spec is locked.
