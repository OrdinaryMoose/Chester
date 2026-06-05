# Session Summary: Complete the design-large-task Reference Removal

**Date:** 2026-06-05
**Session type:** Full implementation (documentation + test refactor), subagent execution mode
**Plan:** `20260605-01-remove-largetask-references-plan-00.md`

## Goal

Finish the ratified removal of the deprecated `design-large-task` skill by scrubbing every live reference across the Chester skill, agent, and documentation corpus; archiving the one orphaned agent and the one orphaned test; bumping the eight modified skills; and removing `design-figure-out`/DFO from the user instructions — all while keeping the full test suite green after every commit. `design-large-task` is **removed, not renamed**; `design-small-task` is a distinct surviving skill, never a continuation.

## What Was Completed

The plan's by-commit-unit decomposition (each task = one lockstep-safe commit pairing a file scrub with the tests that pin it) was executed task-by-task in subagent mode. Each task ran a fresh implementer, a mandatory spec-compliance review, and (where the skip gate did not apply) a quality review.

### Per-task outcome

| Task | Target | Result |
|------|--------|--------|
| 1 | plan-build | 5 refs scrubbed, `v0006`, two tests lockstepped; a 6th residual found in a test comment and fixed |
| 2 | util-artifact-schema | 5 entries deleted, `v0003`, two tests lockstepped; orphaned thinking/process refs the deletion created were fixed in-file |
| 3 | fork-policy.md | step-b pole rows 1a–1g deleted; pinning test archived out of the suite glob |
| 4 | start-bootstrap + util-design-partner-role | design-small-task **inserted** as start-bootstrap's always-caller, `v0003`/`v0005`, three tests lockstepped (one commit) |
| 5 | design-specify | entry-path dead member dropped, `v0004`, stamping test lockstepped |
| 6 | execute-write | worktree-creation + canonical sequence re-pointed, `v0008`, stamping test lockstepped |
| 7 | util-worktree + agent + 2 reference files | scrub + bump `v0002`; agent archived; upsize block deleted (no gap comment); record-formats per-occurrence rulings incl. L68 surgical removal |
| 8 | setup-start | AC-1.7 gate confirmed already-satisfied; skill-index sync was a no-op; precautionary `v0002` |
| 9 | docs/instructions.md | four-zone rewrite; design-large-task + design-figure-out sections/rows/inline-mentions removed; dead MCP setup blocks removed |
| 10 | capstone | full suite green |

### Version bumps

Eight skills bumped: plan-build `v0006`, util-artifact-schema `v0003`, start-bootstrap `v0003`, util-design-partner-role `v0005`, design-specify `v0004`, execute-write `v0008`, util-worktree `v0002`, setup-start `v0002`. `design-small-task` (`v0003`) and `finish-write-records` (`v0004`) were deliberately **not** bumped — their reference files were edited but the spec excludes the parent skills (reference files ride the parent's bump, and the parents are not bumping this sprint).

### Archives

- `agents/agent-industry-explorer.md` → `_archive/design-large-task/agent-industry-explorer.md` (pure rename; no surviving skill dispatches it — verified by repo-wide grep).
- `tests/test-ac-4-1-fork-policy-pole-rows.sh` → `_archive/design-large-task/tests/` (moved out of the `tests/test-*.sh` suite glob; its subject — the step-b pole rows — was deleted, so it cannot be edited to stay meaningful).

### Review outcome

Every per-task spec-compliance review passed. The quality reviewer ran on the six script-bearing tasks (changesets containing `.sh` files) and was correctly skipped via the prose-only path on the four pure-markdown tasks. The **mandatory final integration code review** caught two Important truth-defects that per-task review structurally could not (per-task review verifies presence at an observable boundary; only the whole-sprint pass reads across files to check whether a claim is *true*):

1. The util-design-partner-role re-point invented a `design-specify` reader — design-specify does not read that file (only design-small-task does among the design-pipeline skills).
2. The start-bootstrap session-meta prose claimed the metadata script hashes `design-small-task` — the script (`write-session-metadata.sh`, deferred) actually still hashes `design-large-task`, so the claim was false.

Both were corrected (commit `a33bbe4`) as drop-dead-member corrections rather than stand-in substitutions — closing exactly the hard-constraint failure mode the spec's framing note warns against.

## Verification Results

| Check | Result |
|-------|--------|
| Full suite at HEAD (`bafbf98`) | 27 / 27 pass, 0 failures |
| Test count reconciliation | 28 at BASE `5a800e5` − 1 archived = 27 at HEAD (delta fully explained) |
| Pre-existing failures | none (baseline all-green per round-04 researcher; HEAD has zero failures) |
| Sprint-introduced failures | none |
| `design-large-task` in active skills/ | 0 files |
| `design-large-task` in active agents/ | 0 files |
| `design-large-task` / `design-figure-out` in docs/instructions.md | 0 / 0 |

## Known Remaining Items

Six deferred items recorded in `plan/remove-largetask-references-deferred-00.md`:

- **DI-1** — root `CLAUDE.md` still lists the removed `thinking` artifact type (stale after Task 2's schema-row deletion); out of scoped files.
- **DI-2** — `fork-policy.md:48` count summary stale (pre-existing miscount, unrelated to design-large-task).
- **DI-3** — `design-large-task` survives in historical/append-only docs (decision-record, feature-definition briefs) — deliberately out of scope.
- **DI-4** — skill-index design-small-task entry describes the old design-small-task→plan-build flow (pre-existing drift; the corrected flow is design-small-task→design-specify→plan-build).
- **DI-5** — `README.md` references dead design-large-task/proof-mcp install paths (spec excluded README).
- **DI-6** — the spec's pre-declared **Open Scope Decision**: `chester-util-config/write-session-metadata.sh` still hashes design-large-task (`LARGE_TASK_VERSION`) and emits a `designLargeTask` field. The field is to be **deleted** (not renamed). The I-B fix narrowed the start-bootstrap prose to stay truthful pending this script fix.

## Files Changed

Skills (8 SKILL.md): plan-build, util-artifact-schema, start-bootstrap, util-design-partner-role, design-specify, execute-write, util-worktree, setup-start. Reference files (2): design-small-task/references/design-brief-small-template.md, finish-write-records/references/record-formats.md. Docs (2): docs/fork-policy.md, docs/instructions.md. Tests (6): test-plan-build-heuristic, test-stamping-plan-build, test-artifact-schema, test-artifact-schema-provenance, test-info-packet-style-version-bumps, test-partner-role-overlay-section, test-stamping-design-specify, test-stamping-execute-write. Archives (2 moves): agents/agent-industry-explorer.md, tests/test-ac-4-1-fork-policy-pole-rows.sh.

## Commits

```
ecb7058 refactor(plan-build): scrub design-large-task refs; bump v0006; lockstep tests
0eeb064 docs(test): drop dead design-large-task leg from heuristic test comment
724336f refactor(util-artifact-schema): delete design-large-task entries; bump v0003; lockstep tests
8681e13 docs(util-artifact-schema): drop orphaned thinking/process refs after row deletion
1d2dc8d refactor(fork-policy): delete dead step-b pole rows; archive pinning test
ddca0aa refactor(start-bootstrap,partner-role): scrub design-large-task; bump versions; lockstep tests
83cf711 refactor(design-specify): re-point entry path to design-small-task; bump v0004; lockstep test
a27eb50 refactor(execute-write): re-point worktree-creation to design-small-task; bump v0008; lockstep test
b1668d2 refactor: scrub util-worktree + reference files; archive agent-industry-explorer
dd035d2 docs(setup-start): bump version; sync skill-index entries if stale
ef3be29 docs(instructions): rewrite design section to current state; drop design-large-task + design-figure-out
a33bbe4 fix(docs): correct false reader/hash claims from re-points
bafbf98 checkpoint: execution complete
```

## Handoff Notes

- Work is on branch `20260605-01-remove-largetask-references` in worktree `.worktrees/20260605-01-remove-largetask-references`, HEAD `bafbf98`, tree clean.
- The branch is **not yet integrated** — `finish-close-worktree` (the four-option merge/PR/keep/discard menu) is the remaining finish step.
- The one deferred item that is genuine follow-up work (not just out-of-scope historical docs) is **DI-6** — the `write-session-metadata.sh` `designLargeTask` field deletion. It is the spec's Open Scope Decision and a clean candidate for a small follow-up sprint; DI-4 (skill-index flow staleness) pairs naturally with it.
- Test fixtures in `test-trailer-*.sh` and `test-decision-record-*.sh` intentionally retain `design-large-task` as an arbitrary token — a deliberate spec Non-Goal, not debt.

## Session Skill Versions

*(real provenance trailers harvested from the sprint's pipeline artifacts; see `util-artifact-schema` `## Provenance Trailers`)*

<!-- produced-by plan-build@v0005 -->
<!-- produced-by execute-write@v0007 -->

**Harvest note.** `chester-trailer-write harvest` also surfaced `design-large-task@vNNNN` and `design-specify@vNNNN` placeholder lines. These are **not** real provenance — they are the example fixture trailer (the record-formats `Session Skill Versions` example block) quoted inside the `committee/` deliberation transcripts, which the harvest walker matched as if they were live trailers. They are excluded from the ledger above. The design brief and spec were authored by the design-committee (a deliberation primitive that does not stamp), so they carry no `produced-by` trailer; the genuine stamped artifacts this sprint are the plan + threat report (`plan-build@v0005`) and the deferred-items file (`execute-write@v0007`).
<!-- produced-by finish-write-records@v0004 -->
