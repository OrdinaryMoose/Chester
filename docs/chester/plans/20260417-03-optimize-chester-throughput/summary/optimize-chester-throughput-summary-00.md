# Session Summary: Optimize Chester Throughput

**Date:** 2026-04-18
**Session type:** Full-stack refactoring implementation (design-and-plan pipeline)
**Plan:** `optimize-chester-throughput-plan-00.md`

## Goal

Reduce Chester's token cost and felt heaviness while preserving the signal quality of its review gates, based on the 18-sprint retrospective at `docs/plan-hardening-effectiveness.md`. Absorb `design-specify`'s two earning-their-keep functions (ground-truth verification, three-architect comparison) into a new Finalization stage inside `design-experimental`, route experimental directly to `plan-build`, make `plan-smell` conditional via a cheap heuristic pre-check, refactor the main brief template to match experimental's envelope-plus-point output shape, and scrub all archived-skill references from the remaining active skill files.

## What Was Completed

### Pipeline restructure

- `design-experimental` gained a Finalization stage between Phase 2 closure and a new Archival stage, bracketed by two named contract boundaries: Envelope Handoff (proof → finalization) and Artifact Handoff (finalization → archival). The Finalization stage runs a one-shot parallel gate — one ground-truth subagent plus three architect subagents (minimal-changes / clean-architecture / pragmatic-balance lenses, `subagent_type: "feature-dev:code-architect"`, isolated-parallel). Closing-argument approval is the commitment point for the proof; Finalization operates on the settled envelope without re-reviewing it.
- `design-experimental` transitions directly to `plan-build`. The transition to `design-specify` is removed.
- `design-experimental`'s frontmatter description now reflects its role as the default structural design skill (no more "experimental" or "fork of design-figure-out" language).
- `design-small-task` adopted Artifact Handoff terminology at its brief-writing moment. Procedure and six-section brief template unchanged.
- `plan-build` gained a Smell Heuristic Pre-Check with five trigger categories (DI registrations, new abstractions, async/concurrency primitives, new persistence pathways, new contract surfaces) and a Ground-Truth Report Cascade that reads the highest-numbered ground-truth report and passes verified anchors to `plan-attack` as a trust-boundary skip-list. `plan-attack` remains unconditional; `plan-smell` fires only when the heuristic matches.
- `plan-attack` gained an optional Trust Input section documenting the skip-list protocol at the skill level.

### Template refactor

- `util-design-brief-template` refactored from 548 lines to 256 lines. New nine-section structure: Goal, Necessary Conditions, Rules, Permissions, Evidence, Chosen Approach, Alternatives Considered, Risks, Acceptance Criteria. Plain names in the artifact; semantic envelope vocabulary (Foundation, Hazards, Constraints, Relief) lives in skill instructions and architect prompts.
- `util-design-brief-small-template` unchanged structurally; archived-skill references scrubbed.

### Cross-skill scrub

- Removed references to the archived `design-figure-out` and `design-specify` skills from `setup-start`, `execute-write`, `plan-build` body text, `start-bootstrap`, `util-worktree`, `util-artifact-schema`, `util-design-brief-small-template`, `design-small-task`, and `design-experimental`.
- `tests/test-no-archived-refs.sh` added as the authoritative cross-skill grep gate.

### Baseline fixes (pre-plan)

- Updated four test scripts (`test-budget-guard-skills.sh`, `test-start-cleanup.sh`, `test-write-code-guard.sh`, `test-integration.sh`) to reflect the current active skill registry after the pre-sprint archival of `design-figure-out`, `design-specify`, and the monolithic `finish` skill.
- Patched `~/.claude/statusline-command.sh` (user-env file, outside repo) with the `usage.json` writer block per the token-budget-guard spec. Restored the budget guard data bridge.

## Verification Results

| Check | Result |
|-------|--------|
| `tests/test-artifact-schema.sh` | PASS |
| `tests/test-brief-template-structure.sh` | PASS |
| `tests/test-budget-guard-skills.sh` | PASS |
| `tests/test-chester-config.sh` | PASS |
| `tests/test-compaction-hooks.sh` | PASS |
| `tests/test-config-read-new.sh` | PASS |
| `tests/test-experimental-finalization.sh` | PASS |
| `tests/test-integration.sh` | PASS |
| `tests/test-no-archived-refs.sh` | PASS (authoritative gate) |
| `tests/test-plan-build-heuristic.sh` | PASS |
| `tests/test-small-task-artifact-handoff.sh` | PASS |
| `tests/test-start-cleanup.sh` | PASS |
| `tests/test-statusline-usage.sh` | PASS |
| `tests/test-write-code-guard.sh` | PASS |
| **Total** | **14 / 14 pass, 0 fail** |

Clean working tree at checkpoint `f44ca4e`.

## Known Remaining Items

- **Rename `design-experimental`** — skill name no longer accurate now that it's the default structural design path. Deferred to a follow-up sprint because renaming cascades into memory entries, cross-references, and muscle-memory. Options: `design-figure-out` (reclaim retired name), `design-proof` (descriptive of proof MCP), or `design` (simplest).
- **Extract shared commentary prose** (~80 lines duplicated between `design-experimental` and `design-small-task`) into a util skill both reference. Deferred to a follow-up sprint. The natural edit window during Task 5 was not used because of sprint scope containment.
- **`docs/feature-definition/Pending/design-proof-system-conop-00.md`** still exists as a research note; the proof MCP itself is unchanged and the conop is not actively consumed. No action needed; flagged for awareness.
- **`.mcp.json`** at repo root references paths that no longer exist (archived skill directories). Out of brief scope ("no changes to MCP") but worth cleaning up separately.
- **`util-artifact-schema` `spec/` subdirectory reference** in the Directory Layout section remains. No active producer writes to `spec/` after `design-specify`'s archival; harmless but could be cleaned in a follow-up.

## Files Changed

### Skills modified

- `skills/util-design-brief-template/SKILL.md` — full rewrite, 548 → 256 lines
- `skills/setup-start/SKILL.md` — Skill Priority list, Available Chester Skills, example invocations
- `skills/execute-write/SKILL.md` — worktree setup note
- `skills/plan-build/SKILL.md` — body text scrub, new Smell Heuristic Pre-Check section, new Ground-Truth Report Cascade section, Plan Hardening dispatch conditionalization, Integration rewrite
- `skills/start-bootstrap/SKILL.md` — frontmatter + When-to-Call section
- `skills/util-worktree/SKILL.md` — Integration `Called by` list
- `skills/util-artifact-schema/SKILL.md` — Artifact Types table, State Files table
- `skills/util-design-brief-small-template/SKILL.md` — intro prose, When-to-Use, tail note
- `skills/design-small-task/SKILL.md` — frontmatter description, Phase 5 heading, Integration
- `skills/design-experimental/SKILL.md` — frontmatter description, Checklist (8→10 items), Phase 5 Closure replaced with Finalization + Archival stages, Integration rewrite
- `skills/plan-attack/SKILL.md` — new Trust Input (Optional) section

### Tests added

- `tests/test-brief-template-structure.sh` — nine-section assertion, archived-ref guard, 180–320 line-count range
- `tests/test-no-archived-refs.sh` — authoritative cross-skill grep gate
- `tests/test-artifact-schema.sh` — schema table structural assertion
- `tests/test-small-task-artifact-handoff.sh` — Artifact Handoff terminology assertion
- `tests/test-experimental-finalization.sh` — Finalization stage structural assertion
- `tests/test-plan-build-heuristic.sh` — heuristic + cascade structural assertion

### Tests modified (baseline fixes)

- `tests/test-budget-guard-skills.sh`
- `tests/test-start-cleanup.sh`
- `tests/test-write-code-guard.sh`
- `tests/test-integration.sh`

### User-env modified (outside repo)

- `~/.claude/statusline-command.sh` — usage.json writer block appended

## Commits

| Short SHA | Message |
|-----------|---------|
| `69d5c0b` | fix(tests): align baseline with active skill registry |
| `9e182a9` | refactor: util-design-brief-template to 9-section envelope+point |
| `f04f952` | refactor(setup-start): remove references to archived design skills |
| `38d5803` | refactor: scrub archived design-figure-out and design-specify references |
| `839a888` | refactor(util-worktree): remove archived design-figure-out reference |
| `e951df8` | refactor(artifact-schema): update producer table for active pipeline |
| `d8ced35` | refactor(design-small-task): adopt Artifact Handoff terminology |
| `f6c9e82` | feat(design-experimental): add Finalization and Archival stages |
| `0a7fc05` | fix(design-experimental): drop negative design-specify reference |
| `d0c0a1c` | feat(plan-build): smell heuristic pre-check and ground-truth cascade |
| `e9f770d` | docs(plan-attack): document optional verified-anchor skip-list |
| `f44ca4e` | checkpoint: execution complete |

Baseline = `69d5c0b`. HEAD = `f44ca4e`. 12 commits total (11 content + 1 checkpoint).

## Handoff Notes

- The sprint's acceptance criteria are mechanically enforced by `tests/test-no-archived-refs.sh`. Future sprints should not add references to `design-figure-out` or `design-specify` — this test will fail.
- The ground-truth report cascade and skip-list protocol are documented in `plan-attack`'s new Trust Input (Optional) section. When `design-small-task` is the upstream design skill, no skip-list is passed and `plan-attack` performs full codebase verification as before.
- `plan-build` now recognizes two brief shapes (nine-section experimental, six-section small-task) by section heading. No per-skill branching logic.
- The anchor-extraction convention for the ground-truth subagent is defined with a worked example in `design-experimental`'s Envelope Handoff section. The extraction is deliberately simple prose judgment, one anchor per EVIDENCE row; it does not use a regex or deterministic parser.
- The first time `design-experimental` runs under the new pipeline, the Finalization stage will dispatch `feature-dev:code-architect` subagents. That subagent type exists at `~/.claude/plugins/marketplaces/claude-plugins-official/plugins/feature-dev/agents/code-architect.md` and was verified during plan-attack hardening.
- Next sprint may want to address the deferred items list above — in particular, the skill rename and the shared-prose extraction.
