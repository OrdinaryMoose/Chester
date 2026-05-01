# Session Summary: Artifact Skill-Version Provenance

**Date:** 2026-05-01
**Session type:** Full-stack implementation — design, plan, execute, verify
**Plan:** `add-artifact-skill-versions-plan-00.md`

## Goal

Add an HTML-comment provenance trailer convention to every Chester artifact, plus a session-summary ledger consolidating skill versions across the sprint. The mechanism: a shared bash helper (`chester-trailer-write` with `stamp` and `harvest` subcommands), uniform invocation across stamping skills, and a `## Session Skill Versions` section in the session summary that aggregates the deduped chain.

## What Was Completed

### New helper script

A single bash helper at `bin/chester-trailer-write` (PATH wrapper) → `chester-util-config/chester-trailer-write.sh` (script body) implements two subcommands:

- **`stamp <skill>@<version> <artifact-path>`** — append-only trailer manager with `(skill, version)` dedupe and frozen `created-at`. Anchors trailer-block detection to the last 20 lines of the file so column-0 examples in mid-file fenced code blocks (e.g., the schema docs of the trailer format) don't false-match.
- **`harvest <sprint-dir>`** — walks all `.md` files, extracts `produced-by` lines, deduplicates by `(skill, version)`, sorts by `(created-at, file-path, in-file-position)`. File-path secondary sort guarantees deterministic ordering when `created-at` collides at 1-second granularity.

### Convention documented authoritatively

`skills/util-artifact-schema/SKILL.md` `## Provenance Trailers` documents the full convention: trailer format, helper script signature, stamping skill list (D10 — corrected during plan hardening), non-stamping skill list, sidecar isolation rule, manual-edit rule, and session-wide ledger pointer. Each stamping skill cites this section by name; no skill restates the convention.

### Six skills wired

| Skill | Version bump | Artifact write sites stamped |
|-------|-------------|------------------------------|
| `design-large-task` | v0008 → v0009 | brief, thinking summary, process evidence (3 stamps) |
| `design-small-task` | v0001 → v0002 | brief (1 stamp) |
| `design-specify` | v0001 → v0002 | spec, ground-truth report, skeleton manifest (3 stamps) |
| `plan-build` | v0002 → v0003 | plan, threat report (2 stamps; plan-build owns threat-report chain because plan-attack/plan-smell are inline-only skills) |
| `execute-write` | v0002 → v0003 | deferred items file (1 stamp) |
| `finish-write-records` | v0001 → v0002 | summary, audit, refactor brief, optional cache analysis (4 stamps) + harvest call producing `## Session Skill Versions` |

`finish-archive-artifacts` was modified to document its bytewise-copy invariant (preserving trailer chains intact) but was kept in the non-stamping list. Version bumped v0001 → v0002.

### Plan hardening caught a structural error

Brief D10 originally listed `plan-attack` and `plan-smell` as stamping skills, with the assumption flagged UNTESTED. Plan-attack verified the assumption was false: both skills' SKILL.md files state "This skill does not write files. All output is inline in the conversation." The brief was corrected mid-hardening, both skills moved to the non-stamping list, and the threat-report chain ownership transferred to `plan-build` (which actually writes the file). The plan was restructured 12 tasks → 10 tasks. This was the load-bearing fix of the hardening pass.

### Mitigations applied

After hardening's recommended-changes review, three mitigations were accepted (a, d, f from a six-option menu):

- (a) Deterministic harvest order — file-path as secondary sort key in `do_harvest`. Eliminates filesystem-dependent ordering when two artifacts share a `created-at` second.
- (d) Robust trailer-block detection — anchor regex to last 20 lines of file rather than anywhere. Prevents column-0 example lines inside fenced code blocks from being misidentified as the artifact's own trailer.
- (f) Brief filename rename — corrected the design brief filename from the full sprint-name prefix (`20260430-03-add-artifact-skill-versions-design-00.md`) to the words-only prefix (`add-artifact-skill-versions-design-00.md`) per `util-artifact-schema`.

Skipped (b, c, e): split helper into two scripts, parameterize per-skill tests, compute-relative version assertion. Smell-only signals; current state is fine.

### Mixed execution mode

Plan header `Execution mode: subagent` (safe-default fallback for execute-write's single-mode contract). Per-task `Execution mode:` field added to each task block: tasks 1, 2, 9 ran via subagent dispatch (novel logic); tasks 3-8, 10 ran inline (mechanical SKILL.md inserts). This is a parent-orchestrated extension of the single-mode contract — execute-write's contract was not modified.

## Verification Results

| Check | Result |
|-------|--------|
| `tests/test-trailer-write.sh` | PASS (9 cases) |
| `tests/test-trailer-harvest.sh` | PASS (6 cases) |
| `tests/test-artifact-schema-provenance.sh` | PASS |
| `tests/test-artifact-schema.sh` (pre-existing) | PASS |
| `tests/test-stamping-design-large-task.sh` | PASS |
| `tests/test-stamping-design-small-task.sh` | PASS |
| `tests/test-stamping-design-specify.sh` | PASS |
| `tests/test-stamping-plan-build.sh` | PASS |
| `tests/test-stamping-execute-write.sh` | PASS |
| `tests/test-finish-write-records-provenance.sh` | PASS |
| `tests/test-archive-bytewise.sh` | PASS |
| `tests/test-subagents-no-stamping.sh` | PASS |
| `tests/test-ac-6-2-untouched-phases.sh` (regression — fixed) | PASS |
| **Full suite (excluding 5 pre-existing decision-record failures)** | **57/57 PASS** |

The 5 excluded decision-record tests fail with `ERR_MODULE_NOT_FOUND` on both this branch and `main` — pre-existing infrastructure breakage. Documented in deferred items and a separate bug report at `bug-decision-record-mcp-tests.md`.

## Known Remaining Items

Documented in `add-artifact-skill-versions-deferred-00.md`:

- **Task 1 cosmetic:** dead `created-at` branch in trailer-block detection regex (functionally correct, comment overstates).
- **Task 2 latent:** `trap RETURN` scope-leak in `do_harvest` (not triggered today; future risk if dispatcher is wrapped in a function).
- **Task 2 test gap:** no test for empty sprint directory (works correctly but unpinned).
- **Task 9 test gap:** harvest-before-summary ordering not asserted (presence-only check).
- **Pre-existing:** 5 decision-record MCP tests crash with `ERR_MODULE_NOT_FOUND` before assertions run. Bug report filed.

## Files Changed

### Created (12 files)

- `bin/chester-trailer-write` — PATH wrapper
- `chester-util-config/chester-trailer-write.sh` — script body (stamp + harvest)
- `tests/test-trailer-write.sh`, `tests/test-trailer-harvest.sh`
- `tests/test-artifact-schema-provenance.sh`
- `tests/test-stamping-design-large-task.sh`, `test-stamping-design-small-task.sh`, `test-stamping-design-specify.sh`, `test-stamping-plan-build.sh`, `test-stamping-execute-write.sh`
- `tests/test-finish-write-records-provenance.sh`
- `tests/test-archive-bytewise.sh`, `tests/test-subagents-no-stamping.sh`

### Modified (8 files)

- `skills/util-artifact-schema/SKILL.md` — added `## Provenance Trailers` section; v0001 → v0002
- `skills/design-large-task/SKILL.md` — stamp at Closure Step 5 with STAMP-BLOCK markers; v0008 → v0009
- `skills/design-small-task/SKILL.md` — stamp at Artifact Handoff; v0001 → v0002
- `skills/design-specify/SKILL.md` — stamp at spec, ground-truth, skeleton sites; v0001 → v0002
- `skills/plan-build/SKILL.md` — stamp at plan + threat report; v0002 → v0003
- `skills/execute-write/SKILL.md` — stamp at deferred items; v0002 → v0003
- `skills/finish-write-records/SKILL.md` — harvest sub-step + 4 stamp invocations + Session Skill Versions reference; v0001 → v0002
- `skills/finish-write-records/references/record-formats.md` — added `## Session Skill Versions` template section
- `skills/finish-archive-artifacts/SKILL.md` — bytewise-preservation prose; v0001 → v0002
- `tests/test-ac-6-2-untouched-phases.sh` — extended strip awk to handle STAMP-BLOCK

## Commits

- `b2d84bc` feat(util): add chester-trailer-write stamp subcommand for artifact provenance
- `fed3bb1` feat(util): add chester-trailer-write harvest subcommand for sprint-wide chain
- `04e8872` docs(util-artifact-schema): document provenance trailer convention (v0001 → v0002)
- `0ae20ad` feat(design-large-task): stamp provenance trailers on artifact writes
- `fb9ffbb` feat(design-small-task): stamp provenance trailers on brief writes
- `50856d5` feat(design-specify): stamp provenance on spec ground-truth-report skeleton writes
- `4f4187c` feat(plan-build): stamp provenance on plan and threat-report writes
- `c7a2786` feat(execute-write): stamp provenance on plan amendments
- `daaabfa` feat(finish-write-records): harvest sprint chain into Session Skill Versions section
- `9863fe1` test: regression guards for archive bytewise (AC-7) and subagent non-stamping (AC-5)
- `14cb07d` fix(test-ac-6-2): strip STAMP-BLOCK markers from Phase 5 comparison
- `009565c` checkpoint: execution complete

## Handoff Notes

- The provenance convention is forward-only. Existing archived artifacts in `docs/chester/plans/` carry no trailers and won't get them retroactively. First sprint to stamp end-to-end will be the next sprint that runs after this one merges.
- `harvest` against this sprint's working dir returns empty — none of the artifacts here were stamped because the wiring landed during this sprint, not before it. Future sprints will populate `## Session Skill Versions` with real entries.
- The `STAMP-BLOCK` markers around Phase 5 stamp prose in `design-large-task/SKILL.md` are needed because `tests/test-ac-6-2-untouched-phases.sh` (a regression guard from a prior sprint) compares Phase 5 against `main`. The strip awk treats the marked block as known-intentional.
- Plan-attack and plan-smell remain inline-only skills. They do NOT stamp anything. The threat-report chain belongs to `plan-build` because plan-build is the entity that writes the threat-report file.
- 5 decision-record MCP tests fail pre-existing on `main` — Node `ERR_MODULE_NOT_FOUND`. Bug report at `bug-decision-record-mcp-tests.md` (alongside this summary). Filter out of full-suite verification until fixed.

## Decision-Record Audit

- Records audited: 0
- Drift findings: 0
- Kinds checked: sha-missing

No decision records were created during this sprint (the loop fires only on code-producing tasks with FIRE-status skeleton-coverage diffs; no FIRE conditions arose). Note: `dr_audit` itself works — only 5 of the 8 decision-record TEST SCRIPTS crash (the bash test harnesses spawning separate Node processes), not the MCP tools the running session uses.

## Session Skill Versions

*(populated by `chester-trailer-write harvest`; see `util-artifact-schema` `## Provenance Trailers`)*

*Empty for this sprint — the stamping convention was added DURING this sprint, so the artifacts produced before the wiring landed (brief, plan, threat report, deferred items) carry no `produced-by` trailers. Future sprints will populate this section with real entries. The summary itself is the first artifact stamped under the new convention; once stamped, subsequent re-runs of harvest against this directory will include `finish-write-records@v0002`.*

<!-- created-at: 2026-05-01T09:42:56Z -->
<!-- produced-by finish-write-records@v0002 -->
