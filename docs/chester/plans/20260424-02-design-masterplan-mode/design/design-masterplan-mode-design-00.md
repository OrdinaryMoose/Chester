# Master Plan Sprint Mode — Design Brief

**Date:** 2026-04-25
**Status:** Stopped mid-interview. Captured for archive. Sprint will not proceed through spec/plan/execute at this time.

---

## Goal

Promote StoryDesigner's hand-rolled "Master Plan Mode" — a project-level `CLAUDE.md` override that has driven a multi-month architectural refactor for seven days — from prompt-level convention into first-class Chester capability. Do this through the **minimum viable promotion**: extend three existing pipeline skills to become breadcrumb-aware, ship one canonical reference doc, and let the master-plan document teach its own workflow. No new top-level skills.

The override worked, but it depends on the model re-reading project `CLAUDE.md` at every invocation and interpreting redirection rules consistently — a fragile chain that survived seven days because one user was watching closely. Promotion converts that chain into deterministic skill code, while preserving the override mechanism's small surface area.

---

## Prior Art

- **`master-plan-generator` brief** sits in `docs/feature-definition/Pending/master-plan-sprint-mode/master-plan-generator/` alongside this brief's predecessor. Brief + template are mature and ship-ready. Generator produces the master-plan document. This brief covers the runtime infrastructure that wraps it.
- **StoryDesigner's seven-day usage** of CLAUDE.md override: 5 implementation sub-sprints + 6 LBD design sessions across `20260417-01-change-project-architecture`. Override defines breadcrumb (`.active-master`), nested directory layout, sub-sprint naming, archive payload expansion, exit protocol.
- **Eight pain points** surfaced during the seven days, originally clustered in the predecessor brief into one undifferentiated list. Conversation re-clustered them into three categories:
  - Cluster 1 (overlay activation) — genuine Chester gap, generalizes to any multi-month refactor
  - Cluster 2 (document discipline) — narrower, fits inside finish-time write flow
  - Cluster 3 (lockfile/JSONL/fitness/drift incidents) — one-project remediation, doesn't generalize
- **Mike's directory-simplicity feedback (2026-04-07)**: collapsed dual-dir model to single working/. Bias against directory-level indirection. Conversation tested this against master-plan nesting; concluded nesting earns the exception because the parent/child relationship is real, not arbitrary.

---

## Scope

**In scope:**

- `master-plan-generator` skill — installed from current Pending location; minor naming-form update so its template aligns with runtime naming convention
- `start-bootstrap` modifier — detect `.active-master`, parse master-plan for next unstarted sub-sprint, scaffold sub-sprint dir under master root, fall back to ask if parse ambiguous
- `finish-archive-artifacts` modifier — detect `.active-master`, copy entire master subtree to plans/, commit with message naming both master and triggering sub-sprint
- `finish-write-records` modifier — detect `.active-master`, after writing sub-sprint summary/audit, also touch master-plan.md atomically: bump version, prepend change-log entry, append reassessment entry, append any new deferred items
- Master-plan template — gain "How To Use This Plan" header documenting breadcrumb, per-sub-sprint flow, closure protocol, exit
- `docs/master-plan-mode.md` — canonical reference doc in Chester repo
- `.active-master` breadcrumb spec — single line at `{CHESTER_WORKING_DIR}/.active-master` containing master-sprint name; written by activation, read by three modifiers, deleted at closure
- Sub-sprint naming form — `sprint-<a1|b1|b2|...>-<slug>` for implementation, `lbd-<nn>-<slug>` for design-only

**Out of scope:**

- New top-level skills (proposed `master-plan-start`, `master-plan-close`, `master-plan-body-edit` — all dropped)
- Master-level `{design,spec,plan,summary}/` subfolder scaffold — master root holds only `master-plan.md` and sub-sprint dirs
- Separate `master-deferments-current.md` document — deferred items append into master-plan body
- Cluster-3 mechanisms: `.chester-archive-exclude` glob file, opt-in plans-drift self-diff, opt-in post-merge fitness rerun, locked-file pre-stash diagnostic
- Backward-compat fallback to project-level CLAUDE.md override — once promoted, breadcrumb is the activation signal; override text becomes obsolete

---

## Key Decisions

1. **Activation via breadcrumb, not project CLAUDE.md override.** Behavior lives in skill code, not in prompt-readable override that compaction can lose, subagents may skip, or model interpretation can drift. `.active-master` file existence is the deterministic trigger.

2. **Minimum viable surface: three skill modifiers + one reference doc + one template header.** Red-team revealed the original brief inflated scope by bundling cluster-3 incident-remediation work and proposing skill-shaped solutions for problems documentation could solve. Final surface adds zero new top-level skills.

3. **Directory shape: nested only at master altitude.** Master-sprint dir holds `master-plan.md` at root and sub-sprint dirs (each with their own 4 standard subfolders) as the only children. No master-level subfolders. Standard sprints unchanged. Designer's prior simplicity bias bends here because parent/child relationship is structural, not arbitrary.

4. **Sub-sprint naming.** Implementation: `sprint-<letter><number>-<slug>` (e.g., `sprint-b2-1-diagnostic-convergence`). Design-only: `lbd-<nn>-<slug>` (e.g., `lbd-05-cross-consumer-scenarios`). LBD prefix encodes a real behavioral distinction — design-only sub-sprints have no execute phase. Generator template needs minor update to match this form (currently uses `Sprint[NNN]a/b/c`).

5. **Closure assessment driven by master-plan document.** Agent reads master-plan.md when designer signals close intent — assesses sub-sprint statuses, unresolved decision gates, deferred items, endstate criteria — reports findings, designer approves, agent runs `rm .active-master`. Master-plan stays load-bearing through entire lifecycle: activation → sub-sprint scoping → closure.

6. **Version-bump lockstep is by-construction, not by-enforcement.** Original P1 ("master-plan versioning drift") wasn't an enforcement problem — it was an absence-of-finish-automation problem. `finish-write-records` mode-aware branch writes version bump + change-log + reassessment atomically in one invocation. No way to do part of it. No `master-plan-body-edit` skill needed.

7. **Deferred items append into master-plan body, no separate tracker.** Consistent with master-root-holds-only-master-plan rule. Closure assessment reads one document and sees both completion status and outstanding debt. Document grows over master sprint lifetime; that's correct shape, not a smell.

8. **Discoverability via three independent paths.** Future designer (or future-self after a long break) finds the workflow via: (a) Skill tool trigger phrases on `master-plan-generator` description ("master plan", "long refactor", "multi-session"), (b) `master-plan.md` template's self-instructing "How To Use This Plan" header — opened naturally because the document is the working artifact, (c) `docs/master-plan-mode.md` canonical reference at known Chester location. No single point of failure.

9. **Exit is conversation-driven, not skill-driven.** "Close master plan" prompt → agent reads master-plan + assesses closure readiness + reports + asks approval + deletes breadcrumb. No `master-plan-close` skill. Protocol documented in template header and reference doc.

---

## Constraints

- **Backward compatibility** with non-master sprint work. Default Chester pipeline runs unchanged when `.active-master` absent. Mode is overlay, not replacement.
- **No new top-level skills.** All behavior lives in three existing skills' mode-detection branches plus the already-existing `master-plan-generator`.
- **Working dir cross-worktree persistence preserved.** `master-plan.md` edits during an LBD session in one worktree must remain visible from another worktree's sub-sprint work. Already true today; mode must not break it.
- **plans/ remains append-only institutional memory.** Each sub-sprint merge overwrites plans-side master subtree with current working-side state. Path-drift acknowledged but not retroactively rewritten.
- **Master-plan document is the north-star.** Activation reads it for sub-sprint placement; closure reads it for completion assessment; finish writes it atomically with sub-sprint summary. One artifact, three lifecycle touches, all through skill code.
- **Lesson against config dials.** No opt-in flags inside skill bodies. Three flags proposed in original brief (exclude glob, drift scan, fitness rerun) all dropped.

---

## Acceptance Criteria

1. Activating master-plan mode requires writing `master-plan.md` (via `master-plan-generator`) and one breadcrumb file. Two file operations. No project-side CLAUDE.md edits. No skill-side activation ritual.

2. With breadcrumb present, `start-bootstrap` auto-derives next sub-sprint ID from master-plan body and scaffolds the sub-sprint dir under master root. With breadcrumb absent, default flow runs unchanged.

3. With breadcrumb present, `finish-archive-artifacts` copies entire master subtree to plans/, commit message naming both master and triggering sub-sprint. With breadcrumb absent, single-sprint copy unchanged.

4. With breadcrumb present, `finish-write-records` extends its existing per-sprint output with one atomic master-plan touch: version bump, change-log entry, reassessment entry, deferred items append. Either all four happen or none do.

5. Designer signals "close master plan" → agent reads master-plan.md → reports closure readiness (sub-sprint statuses, unresolved decision gates, deferred items, endstate criteria) → designer approves → agent runs `rm .active-master`. No new skill involved.

6. Three discoverability paths verified independently: Skill tool surfaces `master-plan-generator` on relevant trigger phrases; master-plan template's "How To Use This Plan" header is self-explanatory to a designer who never read the reference doc; `docs/master-plan-mode.md` is reachable at known Chester location and links from generator skill body.

7. None of cluster-3 (lockfile, JSONL exclude, fitness rerun, drift scan) ships. Documented as deferred until pattern repeats outside one project.

---

## Status at Stop

Conversation explored: scope clustering, reproducibility/discoverability concerns, directory shape, sub-sprint naming, archive behavior, exit mechanism, version-bump lockstep, deferred items home. Reached convergence on all of these.

Not explored: concrete content of `docs/master-plan-mode.md`; concrete content of master-plan template's "How To Use This Plan" header; how `master-plan-generator`'s template should be updated to match runtime naming form; what triggers cluster-3 promotion in the future (criteria for revisiting).

Next session can resume from here or treat this as complete brief and proceed directly to spec stage.
