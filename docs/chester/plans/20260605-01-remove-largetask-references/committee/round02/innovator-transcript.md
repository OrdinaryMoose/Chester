# Innovator Transcript — Round 02

**Committee:** design-committee, remove-largetask-references
**Date:** 2026-06-05
**Dimension:** Goal paragraph, Components section, AC grouping sanity check

---

## Goal Paragraph

Complete the intentional removal of design-large-task by scrubbing its twelve live references and moving the orphaned test and agent to archive, leaving the surviving design-small-task pipeline coherent and internally consistent.

That is the whole goal. One sentence is sufficient because the sprint is a completion act, not a design act — the decisions were made when the skill was archived; this sprint follows through. The goal paragraph should not name the twelve files, describe the four action categories, or explain why design-large-task was removed. Those belong in Components and rationale sections. The goal is: carry the removal to completion.

---

## Components — Grouped by Action

The natural grouping for Components is by action category, not by file. Four action categories cover all twelve live references plus the two orphans:

**Re-point** — drop `design-large-task`, keep `design-small-task` as the surviving entry:
- The worktree-creation parenthetical in execute-write Common Setup
- The entry condition and invoked-by section of design-specify
- The canonical-sequence mentions in plan-build context and Integration
- The When-to-Call section and description field of start-bootstrap
- The intro line of util-design-partner-role
- The caller note in util-worktree Integration

**Delete** — behavior or role that no surviving skill exhibits; no valid re-point exists:
- The producer-table entry, stamping-list entry, and thinking/process artifact-type rows in util-artifact-schema
- The capture-thought behavioral description in util-design-partner-role
- The session-meta hash of the removed skill file in start-bootstrap
- The reads-reference to the absent large-task template path in design-specify
- The use-the-full-template rows pointing at the absent path in design-brief-small-template
- The stage-enum entry in finish-write-records/record-formats
- The step-b pole rows (1c–1g) in docs/fork-policy

**Deliberate rewrite** — text dense enough with hits that line-by-line scrub leaves partial truths:
- The design section of docs/instructions — rewrite as current-state description of design-small-task as the sole design entry

**Archive** — files whose only live connection was to the removed skill:
- agents/agent-industry-explorer.md → move to _archive/design-large-task/ alongside the pole agents

**Test lockstep** — each test change lands in the same commit as its paired file change:
- test-plan-build-heuristic: remove large-task grep; update assertion to verify cascade concept via design-specify reference
- test-artifact-schema: drop large-task from producer loop; surviving producers remain
- test-artifact-schema-provenance: drop large-task from stamping-skill loop; surviving skills remain
- test-ac-4-1-fork-policy-pole-rows: archive alongside design-large-task tests (Path A decision)

---

## Why Action-Category Grouping, Not File Grouping

The Purist's AC grouping (from round 01) sorts references by category — canonical-sequence re-points, producer-list deletes, unique-behavior deletes, fork-policy deletes, test lockstep. That is the same action-category grouping I am proposing for Components.

The alternative — grouping by file or subsystem — would give plan-build its own component, util-artifact-schema its own, fork-policy its own, etc. That produces twelve or more components for a sprint whose complexity is not in the individual file changes but in the consistency constraint across all of them: every action must apply the same rule to the same category.

**The argument for action-category grouping:**

- It makes the consistency constraint visible and testable at the component level. Plan-build reads as "re-point the canonical-sequence mentions" — a plan-build author can verify that rule has been applied by reading the diff.
- It makes the scope of each action obvious. The "Delete" component enumerates everything that gets removed; a reviewer checking for missed deletes has one place to look.
- It maps directly to the governing three-rule sort from round 01. Each component is one rule applied to its full set. A spec that groups by file instead of by rule makes it harder to see whether the rule was applied uniformly — the key risk the brief named.

**The argument for file/subsystem grouping:**

- plan-build is buildable on its own; util-artifact-schema is buildable on its own; a file-grouped spec lets an implementer pick up one file at a time without reading the whole spec.
- File grouping matches how the implementation actually proceeds — you open a file, make changes, move on.

**My read:** File grouping is more buildable for a single-implementer sprint where tasks proceed file-by-file. Action-category grouping is more auditable — it makes uniform rule application visible. For this sprint, the primary risk is inconsistent application (some re-pointed, some deleted with no visible logic), not implementation complexity. The consistency risk is the one the brief flagged and the committee spent round 01 resolving. A spec structured to make that risk visible is better than one that is easy to execute but easy to misapply.

However — and this matters for plan-build — the implementation tasks within each action-category component should still be enumerated file-by-file. The component heading is the category; the task body lists the files. That gives plan-build the file-level granularity it needs without losing the category-level auditability.

**Conclusion:** Action-category grouping for Components headings, file enumeration within each component. This is what I am proposing above.

---

## Sanity Check on Purist's AC Grouping

Purist's round-01 position sorted references into four categories (A through D) that map cleanly onto the action categories above. In a spec context, those four categories should produce four to five AC groups:

1. **Canonical-sequence re-points complete** — every instance of "design-large-task | design-small-task" as paired entry point is reduced to "design-small-task" across all six re-point targets. The surviving pipeline framing is internally consistent.

2. **Stale references deleted** — all delete targets are gone from live files: producer table, stamping list, thinking/process rows, capture-thought text, session-meta hash, template path references, stage-enum entry, fork-policy pole rows.

3. **docs/instructions coherent** — design section describes design-small-task as the sole design entry in current-state prose, no partial-truth remnants.

4. **Orphans archived** — agent-industry-explorer.md moved to _archive/design-large-task/; test-ac-4-1-fork-policy-pole-rows moved to _archive/design-large-task/tests/ (Path A).

5. **Test suite green** — three modified tests pass with updated assertions; no other test newly broken by the scrub; full suite runs clean.

6. **Version bumps applied** — plan-build, util-artifact-schema, design-specify, util-design-partner-role, start-bootstrap, execute-write each carry a version bump; reference files under a skill ride the parent's bump.

Purist's grouping by action-category is sound. The one thing to watch: AC group 5 (test suite green) is a verification criterion, not a per-file acceptance criterion. It should be stated as a gate on the whole sprint, not as an AC on a specific component. Mixing a global green-suite gate into a per-file AC group risks it being skipped during implementation (treated as someone else's concern) or double-counted. Keep it as a sprint-level gate separate from the component-level ACs.

---

## Peer DM

Sent to Purist: one question about AC structure (see below).

**Purist reply:** Sprint-level gate confirmed. Adds a load-bearing distinction: AC-4.x (test lockstep) carries per-test pass assertions — those check "did I update the right grep." The sprint-level full-suite gate checks "did updating this test break something adjacent." Neither subsumes the other. Two-level structure: per-test pass assertions inside the lockstep component, full-suite green as the sprint-level capstone.

---

## Summary

- Goal: one sentence — complete the removal, leave the pipeline coherent.
- Components: four action-category headings (re-point, delete, deliberate rewrite, archive) plus test lockstep, with file enumeration inside each.
- AC grouping: action-category grouping is the right choice for this sprint because the primary risk is inconsistent rule application, not implementation complexity. File enumeration inside each component gives plan-build the granularity it needs.
- Test-suite criterion: two levels — per-test pass assertions inside the lockstep component (AC-4.x), full-suite sweep as a sprint-level capstone (AC-6.1 or equivalent). Both must exist; neither subsumes the other (confirmed with Purist).
