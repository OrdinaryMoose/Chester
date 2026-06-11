# Design Brief: Compact the design-committee skill's runtime context cost

**Status:** Draft (pre-design snapshot — design and spec phases intentionally skipped; this brief is the direct input to plan-build)
**Date:** 2026-06-11
**Sprint:** 20260611-01-compact-committee-skill

## Problem Statement

The `design-committee` skill loads ~64KB / ~16K tokens of committee files into the
orchestrating agent's context on every invocation. Much of that is the *same concept
restated across multiple files* — each restatement costs tokens at runtime and forms a
maintenance fork (edit one site, the others drift). The goal is to cut the per-invocation
runtime context cost without losing any behavioral contract.

### What loads into the orchestrator's context at runtime (the cost surface)

The calling agent *is* the team-lead, so it reads, every run:

- `skills/design-committee/SKILL.md` — 160 lines / 15KB
- `skills/design-committee/references/team-lead.md` — 348 lines / 31KB
- `skills/design-committee/references/member-protocol.md` — 160 lines / 7KB
- `skills/design-committee/references/committee-analysis-round-format.md` — 226 lines / 11KB
- plus `skills/util-design-partner-role/SKILL.md` (voice)

### What does NOT load into the orchestrator's context (out of scope for token savings)

- `agents/design-committee-*.md` (five files, ~8KB each) — load as each *subagent's own*
  system prompt, in separate context windows. Trimming them saves the orchestrator nothing.
- `references/artifact-template.md` — read by the scribe subagent only.
- `references/skill-contract.md` — author-only; states "NOT runtime reading."

## Prior Art

Direct precedent inside the same skill: `member-protocol.md` already implements the fix
pattern. It declares itself the "single authority" for committee-root resolution and the
Final Position schema, and states that SKILL.md and team-lead.md "cite this section rather
than restating." That dedup discipline is correct — it simply was never applied to four
other concepts that still duplicate.

## Design Decisions

### D1 — Root cause is cross-file (and within-file) restatement, not file count

Four concepts leak across 2–4 files each; one concept duplicates 4× *within* team-lead.md.

- **Per-Round Flow** — 3×: `SKILL.md` Phase 4 §Per-Round Flow (lines 116–123, 8 steps);
  `team-lead.md` §Per-Round Flow (lines 100–110, 11 steps); `round-format` pipeline
  narrative (lines 22–44, 73–87).
- **Translation Gate** — 3×: `SKILL.md` §Translation Gate (36–45); `team-lead.md` §Voice +
  §Translation Gate + §PM Litmus (26–37, 291–303); `round-format` boundary (101–103). All
  summarize `util-design-partner-role`, which already owns the full spec.
- **Output-surface split** — 3×: `SKILL.md` step 7 (122); `team-lead.md` §Output Surfaces
  (152–159); `round-format` conventions (104–110).
- **Standalone / no-sprint** — 3× *inside SKILL.md alone*: §Standalone Invocability (142–147),
  Phase 1 (55–62), Integration "Does NOT call" (159).
- **Ephemeral-off-roster Consolidator/Scribe** — ~4×: `SKILL.md` 92, 96, 156 +
  `team-lead.md` steps 4, 8.
- **Warrant / Authority-Guard rule** — 4× *within* `team-lead.md`: step 6 (105), step 7 (106),
  §Consolidation Authority Guard (319–325), §Self-Evaluation (342–344).
- **Member lenses** — `SKILL.md` §Six Members (29–33) restates each member's lens, which the
  agent files already carry as their system prompts.

### D2 — Fix: extend the "single authority + cite" pattern; pick one owner per concept

- Per-Round Flow → owner `team-lead.md` (the calling agent executes it there). `SKILL.md`
  Phase 4 keeps only the orchestration *calls* it owns (TeamCreate roster, round-folder
  creation, TeamDelete) + a one-line cite. `round-format` keeps only the folder-shape block +
  file templates, drops the narrative.
- Translation Gate → owner `util-design-partner-role` (already). Each file keeps one line:
  its own boundary (applies-here / doesn't-apply-here). Collapse team-lead.md's §Voice +
  §Translation Gate + §PM Litmus + §Research Boundary into one "run util-design-partner-role
  gates" block.
- Output-surface split → owner `team-lead.md` §Output Surfaces. SKILL.md step 7 and
  round-format conventions cite it.
- Standalone → one statement in `SKILL.md` Phase 1; delete §Standalone Invocability; shorten
  the Integration line to a pointer.
- Ephemeral-off-roster → one statement (the Consolidator subsection); scribe + team-lead steps
  cite it.
- `SKILL.md` §Six Members → roster only (names, advocacy-vs-support split, TeamCreate
  membership); drop per-member lens sentences (owned by agent files).
- `team-lead.md` Authority Guard → state once; Self-Evaluation references it instead of
  restating warrant/count/scope.

**Rejected alternatives:**
- Trim the agent files / skill-contract for token savings — rejected: separate context
  windows / author-only; zero orchestrator benefit.
- Merge reference files to reduce file count — rejected: the orchestration / role / protocol /
  format split is sound; the problem is restatement, not file count.
- Cut the Style Exemplar in `team-lead.md` (215–289) — rejected: long but load-bearing; worked
  samples ratify the design-partner discipline better than abstract rules.

## Scope

### In scope

- Dedup the four cross-file concepts and the within-`team-lead.md` Authority-Guard repetition
  to a single authoritative site each, with one-line cites elsewhere.
- Reduce `SKILL.md` §Six Members to roster-only.
- Version-bump every touched skill/reference file per Chester conventions.
- Preserve the cite-graph integrity: no cite may point at deleted text.

### Out of scope

- **Agent files (`agents/design-committee-*.md`)** — _not needed_: separate context windows;
  no orchestrator token savings.
- **`skill-contract.md` / `artifact-template.md`** — _not needed_: author-only / scribe-only;
  not orchestrator runtime context.
- **Merging or splitting reference files** — _not needed_: file decomposition is already sound.
- **Any behavioral / contract change** — _not now_: this is a pure dedup-and-cite pass; the
  committee's observable behavior must be unchanged.

## Constraints

- No behavioral contract may change — observable committee behavior must be identical before
  and after _(structural)_.
- Every deduped concept must end with exactly one authoritative site; all other mentions become
  one-line cites pointing at it _(structural)_.
- Version-bump rule applies to meaningful changes, not typo/comment-only edits _(normative —
  source: CLAUDE.md §Skill File Conventions)_.
- Staging discipline: stage by explicit path, never `git add -A`/`.` _(normative — source:
  CLAUDE.md §Commit Style)_.
- Output formatting for any designer-facing text: bulleted lists, no ASCII tables/charts
  _(normative — source: user memory)_.

## Assumptions

- **"The orchestrator reads all four runtime files in full each invocation."** — UNTESTED at
  the harness level; inferred from team-lead.md's reading-order section (items 1–6) and the
  skill's reference structure. If the harness lazy-loads references, the per-run savings differ
  from the estimate.
- **"~25% / ~4K-token reduction is achievable by dedup alone."** — UNTESTED estimate; depends on
  how much of each restatement is genuinely removable vs. load-bearing context.

## Residual Risks

- Over-aggressive deletion could strip a load-bearing nuance that only *looked* like a
  restatement (e.g., a boundary clause that differs subtly between two sites).
- A cite pointing at a `##` heading that gets renamed during the pass would dangle silently —
  the cite-graph must be re-verified after edits.
- `member-protocol.md` is the authority model and should stay essentially untouched; accidental
  edits there ripple into every citing file.

## Acceptance Criteria

- Each of the named duplicated concepts has exactly one authoritative site; every other mention
  is a one-line cite.
- No cite references deleted or renamed text (cite-graph verified).
- No behavioral contract removed or altered — only restatements collapsed.
- Touched files carry a correct version bump.
- Measured runtime-file byte total is materially reduced (target ~25%); report actual.
