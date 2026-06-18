# Deferred Items — 20260617-01-codify-committee-design

Items surfaced during execute-write that fall outside the current task scope. Reviewed at finish.

---

## DI-1 — Stale "verdict" terminology in hand-authored skill-index flow lines

> **RESOLVED** in this sprint (commit `b09b8de`). Fixed at source: `agents/sources/catalog-template.md` L37/L53 reworded to "complete-design document" and the catalog regenerated, propagating to `skill-index.md` L37/L53. Folded in together with DI-2 per designer decision at finish.


- **Date:** 2026-06-18
- **Source task:** Task 6 (spec-write/SKILL.md + catalog regen)
- **Description:** Two hand-authored flow/routing lines in `skills/setup-start/references/skill-index.md` still phrase the committee→specify handoff in terms of "verdict":
  - L37: `Committee → \`design-committee\` → (designer routes verdict) → \`spec-write\` → \`spec-harden\` → \`plan-build\`.`
  - L53: `"Already have settled architecture or committee verdict" → skip to \`spec-write\`.`
  After this sprint, the designer-facing artifact the committee routes into `spec-write` is the **complete-design document**, not a bare verdict. Candidate rewordings: L37 `(designer routes complete-design document)`; L53 `"Already have a settled architecture or committee complete-design document"`.
- **Why deferred:** Out of plan scope — Task 6 named only four files and the catalog regen is mechanical (these lines are in the hand-authored flow/priority sections, not the generated description block). The plan's Task 9 residual sweep does not cover `skills/setup-start`. The term "verdict" is also defensibly still correct at routing-summary altitude (the committee's internal `verdict.md` survives this sprint), so this is a polish/consistency nicety, not a contradiction. These lines were authored in the pre-sprint prep commit `6d46a6e` ("rewrite skill catalog to reflect current spec-phase flow"); editing them unilaterally would reach outside the approved edit surface into a file the designer just hand-wrote.
- **Suggested disposition:** Low-priority follow-up — fold into a future terminology pass, or wave off if "verdict" is preferred at this altitude. Designer's call.

---

## DI-2 — Two artifact-sense "committee verdict" residuals outside the Task 8 sweep scope

> **RESOLVED** in this sprint (commit `b09b8de`). `spec-write/references/spec-template.md:18` and `agents/sources/catalog-template.md:53` reworded to "committee complete-design document"; catalog regenerated. Full suite 38/38 green; zero artifact-sense verdict/decision-packet residuals remain across the skill/agent surfaces.


- **Date:** 2026-06-18
- **Source task:** Task 9 / Section 4 full code review
- **Description:** The full cross-task review found two active-contract surfaces still naming the committee output "committee verdict" in the **artifact sense** (the sense this sprint renamed to "complete-design document"):
  - `skills/spec-write/references/spec-template.md:18` — `satisfied identically by a committee verdict or a spec-architect output`. Candidate: `... by a committee complete-design document or a spec-architect output`.
  - `agents/sources/catalog-template.md:53` — `Already have settled architecture or committee verdict`. Candidate: `Already have a settled architecture or committee complete-design document`. NOTE: `skills/setup-start/references/skill-index.md:53` (DI-1) is **generated from this template line** — fixing the template and regenerating the catalog resolves both in one move.
- **Why deferred:** Out of plan scope — Task 8's edit surface was a fixed eight-file list that did not include `spec-template.md` or `catalog-template.md`, and Task 9 is verification-only (no edits). Both residuals are **pre-existing** (not introduced by this sprint; neither file is in the `6d46a6e..41e4cc6` diff). The code review rated them **Minor** and explicitly "out of scope for approving this sprint." Editing them now would reach outside the approved edit surface mid-execution — the same discipline that produced DI-1.
- **Suggested disposition:** Fold into a short follow-up terminology pass together with DI-1 (they share the catalog-regen mechanic via `catalog-template.md`). A clean closure would be: edit `spec-template.md:18` + `catalog-template.md:53`, regenerate `skill-index.md`, stage all three in one `docs:` commit. Designer's call whether to do this before or after merging this sprint.

## DI-3 — Doc-discipline contrast language in fac-complete-design-contract.md quote-back section

- **Date:** 2026-06-18
- **Source task:** Task 9 / Section 4 full code review
- **Description:** `skills/spec-write/references/fac-complete-design-contract.md:22` (the `## Mandatory architecture quote-back` section) carries before/after contrast language — "this is **now** a structured read … **rather than** a mine of narrative prose … **simpler than before**, not eliminated" — inside a declarative contract section. The dedicated `## Why a structured committee document (D9 reversed)` section just below (L24-26) is the proper home for the before/after narrative. Per `feedback_standalone_documentation`, Chester artifacts describe current state declaratively; history/rationale belongs in the change-log/rationale section.
- **Why deferred:** Minor severity (code review). The content is in already-committed, already-spec-and-quality-reviewed Task 5 work; it reads correctly and breaks nothing. Tightening L22 to a present-tense statement of the read contract is polish, not a fix.
- **Suggested disposition:** Optional polish — reword L22 to drop the past-state contrast (the D9-reversed section already carries it). Wave off if the inline contrast is judged to aid comprehension at the point of use. Designer's call.

<!-- created-at: 2026-06-18T09:52:45Z -->
<!-- produced-by execute-write@v0008 -->
