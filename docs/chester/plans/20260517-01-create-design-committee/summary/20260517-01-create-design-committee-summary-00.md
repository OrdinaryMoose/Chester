# Session Summary: Add design-committee Skill — Six-Role Deliberation Team

**Date:** 2026-05-17
**Session type:** Skill creation via skill-creator (no pipeline)
**Plan:** *(none — skill-creator path bypassed plan-build per session decision)*

## Goal

Implement the `design-committee` Chester skill from the pre-existing feature-definition
brief at `docs/feature-definition/Pending/design-committee-00.md`. The brief specified a
six-role deliberation team (four-pole Cartesian debate plus an Arbiter and a Researcher)
for ad-hoc design consultations distinct from the existing pipeline-staged design skills.
Goal of this session: produce the skill SKILL.md, the six agent files, and the registry
update; validate via inline rehearsal; commit.

## What Was Completed

### Skill and agent files

A new standalone skill landed under `skills/design-committee/`, plus six new agent
definitions under `agents/`:

- `skills/design-committee/SKILL.md` (v0001, flexible-type) — workflow with six steps
  (capture question, convene, dispatch round, consolidate, present, teardown), six-role
  charter, decision-packet format, Translation-Gate enforcement at consolidation,
  scope-of-skill section naming deferred follow-ups.
- `agents/design-committee-conservator.md` — S pole (defends existing structure).
- `agents/design-committee-innovator.md` — N pole (pushes re-framings).
- `agents/design-committee-pragmatist.md` — W pole (weighs cost against benefit).
- `agents/design-committee-purist.md` — E pole (tests compositional integrity).
- `agents/design-committee-arbiter.md` — NEW (no Step-B precursor). Proof-state custodian;
  the sole role authorized to read or mutate the structured state the Committee is bound
  to per invocation. Binds to design-proof-system per this sprint's scope decision.
- `agents/design-committee-researcher.md` — NEW (no Step-B precursor). Research and admin
  agent with absence-finding as a first-class result shape.

### Registry update

`skills/setup-start/references/skill-index.md` gained one Catalog entry under Pipeline
Skills (with a "standalone — not pipeline-staged" note) and one Common Dispatch Pattern
line for the convening triggers ("convene the committee", "ask the committee", "get a
multi-perspective read on X").

### Inline rehearsal against a real design-proof-system question

The Committee was rehearsed inline against Finding #1 from the 2026-05-15 calculator
stress-test report (`docs/chester/working/stress-tests/calculator-proof-design-proof-system/simulation-report.md`)
— a closure-blocking divergence between the manage-friction translator's write target
(the satellite disposition fact) and the closure rule's read target (the friction
fact's fourth slot). All six roles were played inline; the consolidated decision packet
recommended the rule-refactor option (keep friction fact immutable, route closure rule
through the disposition predicate). The Committee's recommendation matched the
recommendation in the simulation report independently. Rehearsal was inline rather than
live-dispatched because the new subagent types do not load until the plugin is reloaded.

### Spec revisions from the rehearsal

Two small revisions came out of what the rehearsal exposed:

- `agents/design-committee-researcher.md` — "Absence findings" added to responsibility
  scope; prior-art-in-project output shape gained explicit "Absences worth naming" and
  "Search scope" fields. The rehearsal made a "no prior brief explicitly chose convention
  X" finding load-bearing in the consolidation, so the result is now a contracted shape
  rather than something the researcher might surface in passing.
- `skills/design-committee/SKILL.md` — Step 4 (Consolidate) gained an "Evidence-weighting
  during consolidation" subsection naming when the Arbiter's counterfactual probe and the
  Researcher's absence-finding are load-bearing for the recommendation.

## Verification Results

| Check | Result |
|-------|--------|
| Skill file YAML frontmatter present (name, description, version) | Pass |
| All six agent files YAML frontmatter present (name, description, tools, model) | Pass |
| Skill registered in `skills/setup-start/references/skill-index.md` | Pass |
| Inline rehearsal end-to-end (capture → convene → dispatch → consolidate → present → teardown) | Pass |
| Rehearsal recommendation aligned with independent stress-test recommendation | Pass |
| Plugin-reload confirmation that new subagent types come live | Pending (manual `/reload-plugins` after merge) |
| Live consultation against a real question (post-reload validation) | Pending |

No formal test suite applies — the skill's deliverables are SKILL.md and agent
definitions, not executable code.

## Known Remaining Items

- **Plugin reload.** New subagent types load when the plugin is reloaded, not from disk.
  After branch merge, `/reload-plugins` (or `/refresh-chester` per the user-scoped
  convention) is required before `chester:design-committee` becomes usable.
- **Multi-round protocol mechanics deferred.** SKILL.md names the shape (R1 + cross-DM,
  R2 + finals, risk-weighted consolidation) but the round-by-round transcript schema and
  the cross-DM authorization rules belong to a follow-up brief.
- **Pole-only sub-invocations deferred.** A designer asking for just-Conservator on a
  single choice is plausible; this version does not expose `--pole=conservator`.
- **Design-proof-system runtime wire-up deferred.** The Arbiter contract is abstract; the
  specific tooling and state-handoff semantics for a live instance are not specified.
- **Mechanical Translation-Gate enforcement deferred.** Recommended in the SKILL.md as a
  pattern but not implemented as a hard automated post-processor.
- **StoryDesigner CLAUDE.md `## The Committee` section.** Now reducible to a one-paragraph
  pointer at `chester:design-committee`; that is a StoryDesigner project task.
- **Live consultation validation.** A real Committee convening (not inline rehearsal)
  against a substantive design question, to surface integration issues the inline play
  could not catch.

## Files Changed

New files (7):
- `skills/design-committee/SKILL.md`
- `agents/design-committee-conservator.md`
- `agents/design-committee-innovator.md`
- `agents/design-committee-pragmatist.md`
- `agents/design-committee-purist.md`
- `agents/design-committee-arbiter.md`
- `agents/design-committee-researcher.md`

Modified files (1):
- `skills/setup-start/references/skill-index.md`

Sprint working-dir artifacts (gitignored until archive):
- `docs/chester/working/20260517-01-create-design-committee/design/20260517-01-create-design-committee-design-00.md`
- `docs/chester/working/20260517-01-create-design-committee/summary/20260517-01-create-design-committee-summary-00.md` (this file)

## Commits

- `d74d72d` — feat(skill): add design-committee — six-role deliberation team

## Handoff Notes

The skill ships in a usable but un-loaded state on its branch. To exercise it for real:

1. Complete the finish pipeline (`finish-archive-artifacts` then `finish-close-worktree`
   with a merge-locally choice).
2. Run `/reload-plugins` (or the user-scoped `/refresh-chester`) to load the new
   subagent types into the registry.
3. Convene the Committee against a real consultation question — a charter call, a
   meta-architecture question, or any decision where independent multi-perspective input
   would reduce framing bias. This is the validation step that the inline rehearsal
   could not perform.

If the live convening surfaces awkwardness in the agent-file output formats, the cheap
revision pattern is the one used in this session: rehearse the workflow, name the
load-bearing reply shape the format failed to make explicit, promote it to a
contracted field.

The Committee skill does not displace the existing pipeline-staged design skills. The
dispatch-pattern table in `setup-start/references/skill-index.md` now lists three
patterns side-by-side; choose the right tool for the consultation shape.

## Session Skill Versions

*(populated by `chester-trailer-write harvest`; see `util-artifact-schema` `## Provenance Trailers`)*

*(No provenance trailers were stamped on artifacts in this session — the sprint
bypassed the pipeline skills that normally stamp trailers and used `skill-creator`
directly. The new artifacts in this session can be retroactively stamped if a future
session wants the skill-version chain populated; for this session the absence is
recorded honestly.)*

<!-- created-at: 2026-05-18T00:29:28Z -->
<!-- produced-by finish-write-records@v0003 -->
