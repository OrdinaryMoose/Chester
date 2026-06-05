# Design Brief: Scrub Dangling design-large-task References

**Status:** Draft
**Date:** 2026-06-05
**Sprint:** 20260605-01-remove-largetask-references

## Problem Statement

`design-large-task` was intentionally removed from the repo — its skill, agents, and (as
of this session) its 27 tests now live under `_archive/design-large-task/`. The removal is
incomplete: twelve live files across `skills/`, `agents/`, and `docs/` still name the
removed skill, and four currently-passing tests actively pin some of those references in
place. The corpus describes a pipeline stage that no longer exists, and the test suite is
green only *because* the stale references are still present — a clean scrub would turn four
green tests red unless the tests move in lockstep.

The canonical sequence `design-large-task | design-small-task → design-specify` appears in
multiple skills as the documented entry path. With the large-task half gone, that sequence
is half-true wherever it is restated.

## Prior Art

This session (`20260605`, on `main`) completed two adjacent pieces, both committed:

- `235b735` — realigned 6 stale skill-contract tests (version pins, the
  finish-write-records summary+audit-only simplification, partner-role rephrase/restructure
  anchors) to current skills.
- `5a800e5` — archived 27 orphaned `design-large-task` AC/stamping/closure tests to
  `_archive/design-large-task/tests/`, mirroring the earlier `design-architect-committee`
  archival. Repo suite went 33 failing → 0 failing.

The `design-architect-committee` retirement is the established precedent for how a removed
skill is handled: skill + supporting files + tests moved under `_archive/`, references in
live skills cleaned up separately.

`design-small-task` (the surviving sibling) is fully live and must remain untouched except
where a shared line currently couples both task skills to one stale phrasing.

## Design Decisions

No design decisions have been made. This brief captures context for the committee design
session. The shape of the scrub — how to re-point the canonical sequence, whether
`util-artifact-schema` should drop `design-large-task` from its producer list or keep it as
a historical producer, how `docs/fork-policy.md` pole-agent rows are handled, and how the
four pinning tests change in lockstep — is exactly what the committee is convened to design
and validate.

## Scope

### In scope

- The twelve live files that reference `design-large-task` (history under
  `docs/chester/plans/` excluded — frozen archives, correctly left alone):
  - `skills/start-bootstrap/SKILL.md`
  - `skills/util-artifact-schema/SKILL.md` — producer list
  - `skills/execute-write/SKILL.md` — "worktree created upstream by design-large-task"
  - `skills/plan-build/SKILL.md` — ground-truth cascade + canonical sequence
  - `skills/util-design-partner-role/SKILL.md`
  - `skills/util-worktree/SKILL.md`
  - `skills/design-specify/SKILL.md` — entry condition
  - `skills/design-small-task/references/design-brief-small-template.md`
  - `skills/finish-write-records/references/record-formats.md`
  - `agents/agent-industry-explorer.md`
  - `docs/fork-policy.md` — `design-large-task-step-b-*` pole-agent rows
  - `docs/instructions.md`
- The four currently-passing tests that pin live references, updated in lockstep:
  - `test-plan-build-heuristic` — asserts plan-build references design-large-task
  - `test-artifact-schema` — expects it in the producer list
  - `test-artifact-schema-provenance` — same producer loop
  - `test-ac-4-1-fork-policy-pole-rows` — greps the step-b pole-agent refs
- Version bumps on every SKILL.md whose behavior/contract text changes.

### Out of scope

- **Archived plan/summary/spec artifacts under `docs/chester/plans/`** — _not needed_:
  these are frozen historical records; they correctly describe the state at their time.
- **Restoring or replacing `design-large-task`** — _not needed_: removal is intentional
  and ratified; this effort completes it, it does not reverse it.
- **Sample-string fixtures** (`test-trailer-write`, `test-trailer-harvest`,
  `test-decision-record-*`) — _not needed_: they use `design-large-task@vNNNN` as an
  arbitrary skill-name to exercise trailer/decision-record machinery; not coupled to the
  skill existing. Re-pointing them is cosmetic, not required for correctness.

## Constraints

- Reference scrub and test updates must land together — scrubbing live refs without
  updating the four pinning tests breaks a green suite _(structural)_.
- Chester artifacts describe current state declaratively; no historical narration in the
  main body of any edited skill _(normative — source: standalone-documentation discipline)_.
- Never `git add -A`/`.`; stage by path _(normative — source: CLAUDE.md staging discipline)_.
- Edits to live skills happen in the sprint worktree; working-dir artifacts stay at the
  main-repo path _(structural — directory model)_.

## Assumptions

- **"All twelve live references are genuinely stale, not load-bearing"** — UNTESTED. Some
  may be describing a contract that should be re-pointed to `design-small-task` rather than
  deleted (e.g., the canonical sequence still has a valid small-task half). The committee
  should distinguish "delete the mention" from "re-point the mention."

## Residual Risks

- Re-pointing the canonical sequence inconsistently across skills (some say
  `design-small-task → design-specify`, others drop the stage entirely) would re-introduce
  the same half-truth in a new form.
- `util-artifact-schema` producer list: dropping `design-large-task` could orphan provenance
  trailers in archived artifacts that legitimately carry `produced-by design-large-task`.

## Acceptance Criteria

Acceptance criteria not yet defined — to be established during design.
