# Deferred Items — 20260605-01-remove-largetask-references

Items surfaced during execution that are out of scope for the approved spec's
file list. Recorded per execute-write §1.3; reviewed at finish.

## DI-1 — Root CLAUDE.md still references the removed `thinking` artifact type

- **Date:** 2026-06-05
- **Source task:** Task 2 (util-artifact-schema scrub)
- **Item:** The repo-root `CLAUDE.md` "Session Artifact Conventions" block lists
  `<sprint-name>-thinking-NN.md` under `design/` in its directory-layout summary.
  Task 2 deleted the `thinking` (and `process`) artifact rows from
  `skills/util-artifact-schema/SKILL.md` as design-large-task-specific artifact
  types. The schema authority no longer documents a `thinking` artifact, so the
  root `CLAUDE.md` layout summary is now stale against the schema.
- **Why deferred:** Out of spec scope. The approved spec (24 ACs) enumerated the
  exact files to scrub; root `CLAUDE.md` was not among them, and its stale line
  contains no literal `design-large-task` string, so no AC's observable boundary
  covers it. Fixing it is a coherent follow-up, but expanding Task 2 to edit
  `CLAUDE.md` would exceed the ratified scope.
- **Note:** The in-file consequence within util-artifact-schema (the L79 directory
  comment and L229 sidecar enumeration that referenced the deleted rows) WAS fixed
  in this sprint — those lived in the file Task 2 owned. This deferral is only the
  cross-file ripple into the project-root CLAUDE.md.

## DI-2 — fork-policy.md L48 count summary is stale (pre-existing)

- **Date:** 2026-06-05
- **Source task:** Task 3 (fork-policy step-b row deletion) — surfaced by quality review
- **Item:** `docs/fork-policy.md:48` summarizes the table as "the four `general-purpose`
  sites ... and the seven named-subagent sites". Actual current table: 3 general-purpose,
  6 named-subagent. Quality reviewer (confidence 82) confirmed these counts were **already
  wrong at BASE** (base had 3 general-purpose and 13 named vs the claimed "four"/"seven"),
  so the inaccuracy is pre-existing, not introduced by this sprint.
- **Why deferred:** Minor severity + pre-existing + unrelated to design-large-task
  semantics (the "four general-purpose" miscount has no connection to the removed skill).
  AC-2.7's grep-zero boundary on fork-policy.md is fully met. Correcting the counts means
  recounting and asserting new numbers — a different edit class than design-large-task
  removal, and scope creep if folded into Task 3. A future tidy pass should set the
  numbers to "three" and "six".

## DI-3 — `design-large-task` survives in out-of-scope historical docs

- **Date:** 2026-06-05
- **Source task:** Task 7 (orchestrator orphan-sweep after the collapsed deletes)
- **Item:** After Tasks 1–7, an orphan/residual grep across the repo confirms ALL active
  skill and agent files are clean. `design-large-task` still appears in:
  - `docs/instructions.md` — **in scope, handled by Task 9** (AC-2.8). Not deferred.
  - `docs/chester/decision-record/decision-record.md` — append-only decision log; the
    entry records a past decision that legitimately named the skill at the time.
  - `docs/feature-definition/Complete/design-committee-00.md`,
    `docs/feature-definition/Complete/understanding-mcp-lane-2-redesign-00.md`,
    `docs/feature-definition/Pending/design-specify-class-3-re-adjudication-00.md` —
    feature-definition briefs describing feature work as it stood when authored.
- **Why deferred (not acted on):** None of these are in the approved spec's scoped file
  list (24 ACs). They are historical / append-only / planning documents — the same
  archival class as `docs/chester/plans/` records. Rewriting them would alter the
  historical record (decision log) or completed feature briefs, which is out of scope and
  arguably wrong (they describe a past state accurately). Surfaced for designer awareness;
  no runtime or active-workflow reference is affected.

## DI-4 — skill-index design-small-task entry describes the old (pre-design-specify) flow

- **Date:** 2026-06-05
- **Source task:** final integration code review (whole-sprint)
- **Item:** `skills/setup-start/references/skill-index.md` (around the design-small-task
  entry / dispatch-pattern lines) still says design-small-task "produces a brief for
  plan-build. No MCP, no spec step" and "design-small-task first, then plan-build". This
  is the same stale flow model that AC-2.8 corrected in `docs/instructions.md`
  (the real flow is design-small-task → design-specify → plan-build), and it contradicts
  design-small-task's own SKILL.md ("transitions to design-specify").
- **Why deferred:** Pre-existing drift, not widened by this sprint. skill-index was not a
  scrub target (it is grep-zero for design-large-task), and design-small-task's description
  was not an AC-5.1 bump target. The staleness is about the design-small-task→design-specify
  flow, not a literal design-large-task reference, so it falls outside the ratified AC set.
  Track alongside DI-5 / the Open Scope Decision as part of the same "design-small-task feeds
  design-specify, not plan-build" truth this sprint established but did not fully propagate.

## DI-5 — README.md references dead design-large-task / proof-mcp install paths

- **Date:** 2026-06-05
- **Source task:** final integration code review (whole-sprint)
- **Item:** repo-root `README.md` still references `skills/design-large-task/proof-mcp`
  install paths (around lines 27 / 49 / 77), now dead.
- **Why deferred:** The approved spec deliberately excluded README from the scoped file
  list. Surfaced for awareness; no active-workflow reference is affected.

## DI-6 — start-bootstrap session-meta prose intentionally under-describes pending the script fix

- **Date:** 2026-06-05
- **Source task:** Task 4 / final integration code review (I-B fix)
- **Item:** `chester-util-config/write-session-metadata.sh` still hashes
  `skills/design-large-task/SKILL.md` (L35, `LARGE_TASK_VERSION`) and emits a
  `designLargeTask` field (L48). This script is the spec's **Open Scope Decision**
  (deliberately deferred — the `designLargeTask` field gets **deleted**, not renamed).
  Because grep-zero (AC-2.2) forbids naming design-large-task in start-bootstrap's prose,
  the I-B fix narrowed the session-meta prose to name only `util-design-partner-role`
  (truthful). The prose therefore does not enumerate the design-large-task hash the script
  still computes — under-describes but does not lie. When the deferred script fix lands
  (remove `LARGE_TASK_VERSION` + `designLargeTask`), the prose is fully accurate as-is.
- **Why deferred:** This is the spec's pre-declared Open Scope Decision; not in this sprint.

## Non-item — test-fixture `design-large-task` tokens (NOT deferred)

For the record so a future reader does not re-flag it: `design-large-task` still
appears as a fixture/stub token in `test-trailer-write.sh`, `test-trailer-harvest.sh`,
and the `test-decision-record-*.sh` files. This is a **deliberate spec Non-Goal
exclusion** — those are arbitrary fixture tokens exercising the trailer/decision-record
mechanisms, not live references to the skill. The plan threat report confirmed they
are immune to all plan edits. No action; not a deferred item.

<!-- created-at: 2026-06-05T12:36:32Z -->
<!-- produced-by execute-write@v0007 -->
