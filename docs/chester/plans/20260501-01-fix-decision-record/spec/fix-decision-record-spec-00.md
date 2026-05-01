# Spec — Decision Record System

**Sprint:** `20260501-01-fix-decision-record`
**Date:** 2026-05-01
**Parent brief:** `design/fix-decision-record-design-00.md`
**Architecture (locked by designer):** primary reads session JSONL, then forks two subagents that inherit transcript context — one runs the reasoning audit, the other emits records. No primary-resident discriminator, no first subagent, two independent filters over the same source.

## Goal

Replace the inverse-coupled trigger-driven decision-record system shipped 2026-04-24 with a retrospective audit-time emission. The new system captures agent-made decisions across the full session (including design-large-task, design-small-task, design-specify, plan-build, execute-write) into a single append-only markdown corpus at `docs/chester/decision-record/decision-record.md`, written during the same `finish-write-records` pass that produces the reasoning audit. The two outputs (audit + records) are parallel filters over the same JSONL transcript with independent discrimination criteria. The 2026-04-24 build-decision-loop merge is reverted surgically — every change that landed after the merge is preserved.

## Components

### Modified

- `skills/finish-write-records/SKILL.md` — Step 3 (Reasoning Audit) restructured as a parent-orchestrated parallel dispatch: parent resolves the JSONL transcript path, then forks two subagents. Step 4 (the `dr_audit` / `dr_abandon` block) deleted. New "Decision Record Emission" content moved into the Step 3 dispatch itself (one of the two forks).
- `skills/finish-write-records/references/record-formats.md` — append a "Decision Record Format" section specifying the 11-field YAML-frontmatter shape and an entry example. Existing "Reasoning Audit Format" section retained.
- `skills/execute-write/SKILL.md` — surgical revert to pre-04-24 shape: drop trigger-check step, drop propagation procedure step, drop spec-reviewer input-restriction step, drop observable-behaviors implementer artifact step. Restore implementer + spec-reviewer + quality-reviewer per-task chain. (Net +23/−6 lines in commit `96ea360`, spread across two non-contiguous regions: the new "Decision-Record Trigger Check and Propagation" section near the existing Step-2/Step-3 area, and a smaller bullet block under "From the decision-record loop:" later in the file. Both regions must be removed.)
- `skills/execute-write/references/implementer.md` — surgical revert: drop the 16-line observable-behaviors emission block added by `96ea360`. Pre-existing implementer prompt content preserved.
- `skills/execute-write/references/spec-reviewer.md` — surgical revert: drop the 16-line input-restriction directive block added by `96ea360`. Pre-existing spec-reviewer prompt content preserved.
- `skills/finish-write-records/SKILL.md` step renumbering: after Step 4 (`dr_audit` / `dr_abandon`) is deleted, current Step 5 (Copy Implementation Plan), Step 6 (Offer Session State Update), and Step 7 (Commit) renumber to Step 4, Step 5, and Step 6 respectively. The records-emission work is folded into the existing Step 3 (Reasoning Audit), not given its own step.
- `skills/design-specify/SKILL.md` — drop skeleton-manifest scaffolding step ("Scaffold test skeletons" subsection of "Writing the Spec") and remove references to the `skeleton-generator` reference file. Brief-to-spec AC seeding behavior preserved.
- `skills/plan-build/SKILL.md` and `skills/plan-build/references/plan-template.md` — drop the `dr_query` integration block (six matches in SKILL.md at lines 24, 58, 62, 77, 79, 345; two matches in plan-template.md at lines 36, 40). Note: the `must-remain-green` token from the brief's RCON-4 enumeration does not actually appear as a literal string in plan-build files — the brief's phrasing refers to the `dr_query`-driven prior-decisions consultation block; removing the `dr_query` integration removes the operative behavior.
- `skills/execute-verify-complete/SKILL.md` — drop `dr_verify_tests` step.
- `.claude-plugin/mcp.json` — remove `chester-decision-record` server registration.

### New

- `skills/finish-write-records/references/decision-record-filter.md` — discrimination criteria for the records fork (independent of the audit filter); canonical tag list; supersession discovery procedure (forward-scan grep over the corpus).

### Deleted

- `mcp/chester-decision-record/` (entire package: `server.js`, `handlers.js`, `schema.js`, `store.js`, `package.json`, `package-lock.json`, `node_modules/`, `__tests__/`, lockfile dependency).
- `skills/design-specify/references/skeleton-generator.md` (lives under design-specify, not execute-write — the file is invoked from the spec-writing scaffolding step).
- `skills/execute-write/references/propagation-procedure.md`
- `skills/execute-write/references/test-generator.md`
- `agents/execute-write-test-generator.md`
- The eight existing `tests/test-decision-record-*.sh` scripts: `test-decision-record-abandon.sh`, `test-decision-record-ac-mapping.sh`, `test-decision-record-capture-finalize.sh`, `test-decision-record-cross-sprint.sh`, `test-decision-record-registration.sh`, `test-decision-record-setup.sh`, `test-decision-record-shared-fixtures.sh`, `test-decision-record-supersede.sh`.
- `tests/test-execute-write-update.sh` (the propagation/trigger-check test added by `96ea360`).
- `tests/test-skeleton-manifest-path-convention.sh` (the skeleton-manifest path-convention test).

### Created (data file)

- `docs/chester/decision-record/decision-record.md` retains its current `.gitkeep`; the first emission appends the first record. No initialization needed beyond the path already being present.

## Data Flow

```
finish-write-records (primary)
  │
  ├─ resolve session JSONL path  (existing snippet at lines 160-161 of SKILL.md)
  │
  ├─ fork subagent A (reasoning-audit)
  │     │   inherits transcript context via fork mechanics
  │     │   applies audit-altitude filter from record-formats.md
  │     │   writes summary/<sprint>-audit-NN.md
  │     │   stamps trailer (existing behavior)
  │     └── returns status
  │
  ├─ fork subagent B (decision-records)
  │     │   inherits transcript context via fork mechanics
  │     │   applies records-altitude filter from decision-record-filter.md
  │     │   appends YAML-frontmatter blocks to docs/chester/decision-record/decision-record.md
  │     │   does NOT stamp trailer (the corpus is cross-sprint, not a sprint artifact)
  │     └── returns status
  │
  └─ collect both statuses; report partial-success if one fork fails
```

The two forks run in parallel via a single primary message issuing both Agent calls. Both subagents inherit the parent transcript via `CLAUDE_CODE_FORK_SUBAGENT=1`; neither subagent re-reads the JSONL itself. Each fork's filter is documented in its own reference file and is independently tunable.

## Error Handling

- **One fork fails, the other succeeds.** Primary reports partial success: which output exists, which is missing, why the failed fork errored. The succeeded artifact is not rolled back. The user can rerun the failing fork manually.
- **Both forks fail.** Primary reports both errors. No partial state to roll back (audit is missing, corpus has no new records).
- **JSONL transcript path resolution fails.** Primary aborts before forking. Reports the resolution failure. Existing path-resolution snippet is unchanged from current SKILL.md, so this failure mode is unchanged from current behavior.
- **Records corpus file does not exist at append time.** The corpus path is created by the plugin (gitkeep present); if missing, the records fork creates the file with its first record. No directory bootstrapping needed because the parent dir is tracked.
- **Concurrent writes to the records corpus.** Out of scope — Chester is solo-dev (per user-memory), one session at a time. No locking. If the user runs two parallel sessions and both finish at the same instant, one append may overwrite the other; this is documented as accepted operating boundary, not a fixable defect.

## Testing Strategy

The implementation is primarily configuration-and-prose changes (skill markdown, reference files, package deletions). Test surface:

1. **Bash test — emission produces well-formed YAML frontmatter blocks.** Drive the records-fork procedure against a fixture JSONL and assert that the appended content (a) parses as YAML frontmatter blocks, (b) contains all 11 required fields per record, (c) appends rather than rewrites the corpus.
2. **Bash test — surgical revert leaves no dangling references.** After revert, grep the entire skill corpus for `dr_capture`, `dr_audit`, `dr_query`, `dr_supersede`, `dr_finalize_refs`, `dr_abandon`, `dr_verify_tests`, `chester-decision-record`, `must-remain-green`, `skeleton-generator`, `propagation-procedure`, `observable-behaviors`. Each match outside `docs/chester/plans/` (archived prior sprint records) is a failure.
3. **Bash test — supersession discovery via forward scan.** Seed the corpus with two records where record B's `supersedes` field names record A's id. Run a grep procedure that, given record A's id, finds record B. Assert the discovery succeeds without modifying record A.
4. **Manual verification (no automated test) — keep-bucket preservation.** After revert, confirm by file inspection that the eight post-04-24 keep items survive: provenance trailer stamping, named-subagent fork policy, pluggable Understanding-MCP swap line, automatic ground-truth review, brief-to-spec AC seeding, Session Skill Versions harvest, heuristic execution-mode selection, cluster-a Resolve Conditions in design-large-task.

**Skeleton scaffolding deliberately skipped.** This spec describes removing the skeleton-manifest mechanism in design-specify. Scaffolding stubs against a system being torn out would be artifacts of a transitional state that exits before the stubs are exercised. The bash tests above cover the observable behavior directly.

## Constraints

- **C-1 — No MCP.** Capture is implemented via direct file I/O at the `finish-write-records` skill level. No new MCP server is created and the existing `chester-decision-record` server is removed.
- **C-2 — No TDD-loop participation.** Capture does not gate test-first / implement / test-pass discipline anywhere in `execute-write`. The build cadence runs uninterrupted by record writes. Emission fires only at finish time.
- **C-3 — Append-only corpus.** The records corpus at `docs/chester/decision-record/decision-record.md` only grows. Prior records are never modified. Supersession is by reference: a new record names the prior record's id in its `supersedes` field; the prior record stays intact and is read as not-currently-authoritative by future agents who follow the supersession chain.
- **C-4 — Cooperative coexistence with session artifacts.** Records do not replace session-level artifacts (brief, spec, plan, audit, summary). Both surfaces can contain duplicate information. Session artifacts serve session-internal recall; records serve cross-sprint trend-finding.
- **C-5 — Whole-session scope.** Capture covers the entire session JSONL transcript, including design-large-task and design-small-task turns when those skills run in-session. Filter scope is unrestricted to any sprint-stage subset.
- **C-6 — Parallel-filter independence.** The records-fork filter is documented in a separate reference file from the audit filter and is not constrained to be a subset or superset of the audit filter. A decision selected by one filter need not be selected by the other.
- **C-7 — Surgical revert.** Every change that landed in the codebase after merge `96ea360` (2026-04-24) and is independent of the DR system is preserved — provenance trailer stamping, named-subagent fork policy, pluggable Understanding-MCP swap, ground-truth review automation, brief-to-spec AC seeding, Session Skill Versions harvest, heuristic execution-mode selection, cluster-a Resolve Conditions. Wholesale revert is forbidden.
- **C-8 — Records corpus path is fixed.** `docs/chester/decision-record/decision-record.md`. No configurability via project settings. Future-agent grep procedures can hardcode the path.

## Non-Goals

- **NG-1 — No new MCP server.** Per C-1, capture is direct file I/O.
- **NG-2 — No advisory or reconciliation command.** No `/dr:reconcile`, no `/speckit.reconcile`-style post-implementation review pass. The audit-pass emission is the only capture moment.
- **NG-3 — No retroactive backfill of prior records.** When a record supersedes an earlier record, the earlier record is not modified to add a back-pointer. Discovery of "what superseded record X" is by forward-scan grep at query time.
- **NG-4 — No tag validator.** Per C-1 / RULE-9, no server-side validation of tag values. Mitigation is a canonical tag list documented in `decision-record-filter.md` plus existing-tags-first discipline. Tag drift is an accepted risk (RISK-2 in the brief).
- **NG-8 — No cross-fork blind-spot mitigation.** Per the brief's RISK-1 (discriminator inheritance), if both fork filters share a blind spot at their respective altitudes, a substantive decision is missed permanently. The independent-filter design (C-6) lets each filter be tuned to its altitude but does not detect or correct shared blind spots. This is an accepted risk; mitigation would require a third filter or human review pass, which violates C-1 / NG-2 / sprint scope.
- **NG-5 — No mid-stage capture.** No capture step inserted into `design-specify`, `plan-build`, or `execute-write`. Emission fires only once per session at `finish-write-records`.
- **NG-6 — No cross-sprint enforcement.** No skill blocks merge or commit on absence of records, missing tags, or absent supersession. The records corpus is read by future agents; lack of records simply means lack of cross-sprint memory for that sprint.
- **NG-7 — No replacement of the reasoning audit.** The audit continues to be written to `summary/<sprint>-audit-NN.md` per the existing format. Records are an additional output, not a replacement.

## Acceptance Criteria

### AC-1 — Emission timing and source (RCON-1)

#### AC-1.1 — Primary forks two subagents from a single transcript-path resolution

**Observable boundary:** the `finish-write-records` skill execution at Step 3.

**Given** `finish-write-records` is invoked at the end of a sprint,
**When** Step 3 (reasoning-audit dispatch) executes,
**Then** the primary agent resolves the session JSONL path once via the existing path-resolution snippet, dispatches two Agent tool calls in a single message (one for the audit fork, one for the records fork) so both forks run in parallel, and collects both statuses before proceeding to Step 4.

#### AC-1.2 — Audit fork writes the reasoning audit

**Observable boundary:** the file `summary/<sprint>-audit-NN.md` after Step 3 completes.

**Given** the audit fork is dispatched with the parent transcript context inherited via `CLAUDE_CODE_FORK_SUBAGENT=1`,
**When** the fork applies the audit-altitude filter from `record-formats.md`,
**Then** the fork writes `summary/<sprint>-audit-NN.md` containing the existing Reasoning Audit Format (Executive Summary, Plan Development, Decision Log) and stamps a provenance trailer per `util-artifact-schema`.

#### AC-1.3 — Records fork appends to the cross-sprint corpus

**Observable boundary:** the file `docs/chester/decision-record/decision-record.md` after Step 3 completes.

**Given** the records fork is dispatched with the parent transcript context inherited via `CLAUDE_CODE_FORK_SUBAGENT=1`,
**When** the fork applies the records-altitude filter from `decision-record-filter.md`,
**Then** the fork appends one or more YAML-frontmatter record blocks to `docs/chester/decision-record/decision-record.md` and does NOT stamp a provenance trailer on the corpus file (because the corpus is cross-sprint, not a sprint artifact).

#### AC-1.4 — No MCP tool call participates in capture

**Observable boundary:** the conversation transcript of a `finish-write-records` execution.

**Given** an end-to-end run of `finish-write-records`,
**When** the run completes (both forks reported),
**Then** no `mcp__plugin_chester_chester-decision-record__*` tool call appears in either the primary's transcript or either fork's transcript.

#### AC-1.5 — `execute-write` build cadence is independent of capture

**Observable boundary:** the `execute-write` per-task chain.

**Given** any task is implemented in `execute-write`,
**When** the implementer + spec-reviewer + quality-reviewer chain runs,
**Then** no step in the chain reads from, writes to, or queries the decision-record corpus, and no step in the chain blocks on capture state.

### AC-2 — Record format (RCON-2)

#### AC-2.1 — Record carries 11 structured fields

**Observable boundary:** any record block in the corpus.

**Given** a record emitted by the records fork,
**When** the block is parsed as YAML frontmatter,
**Then** the parsed object contains exactly these keys: `id`, `date`, `sprint`, `stage`, `title`, `decision`, `rationale`, `alternatives`, `tags`, `supersedes`, `artifact_refs`. No extra keys, no missing keys.

#### AC-2.2 — YAML frontmatter shape

**Observable boundary:** the corpus file as text.

**Given** the corpus contains N records,
**When** the file is read,
**Then** each record begins with a `---` line, contains the 11 fields, ends with a `---` line, and is separated from neighboring records by exactly one blank line.

#### AC-2.3 — Record id is unique and stable

**Observable boundary:** the `id` field across all records in the corpus.

**Given** the corpus contains N records,
**When** the records fork emits a new record,
**Then** the new record's `id` value is distinct from every prior record's `id`, and the format is `dr-YYYYMMDD-NN-<slug>` where `YYYYMMDD` is the emission date, `NN` is a zero-padded sequence number scoped to that date, and `<slug>` is a short hyphenated noun phrase derived from the decision's title.

#### AC-2.4 — Tag values come from the canonical list when available

**Observable boundary:** the `tags` field on emitted records.

**Given** the records-fork filter selects a decision and assigns it tags,
**When** the canonical tag list in `decision-record-filter.md` contains a tag matching the decision's domain,
**Then** the fork uses the canonical tag verbatim. The fork may add new tags only when no canonical tag fits; new tags must be added to the canonical list in the same emission.

#### AC-2.5 — Supersedes field carries a record id or null

**Observable boundary:** the `supersedes` field on emitted records.

**Given** any emitted record,
**When** the field is parsed,
**Then** the value is either (a) the literal `null`, or (b) a string matching the `id` format `dr-YYYYMMDD-NN-<slug>` of a record that exists earlier in the corpus.

### AC-3 — Corpus location and supersession (RCON-3)

#### AC-3.1 — Corpus path is fixed

**Observable boundary:** the records-fork emission target.

**Given** the records fork executes,
**When** the fork writes records,
**Then** the write target is the literal absolute path `docs/chester/decision-record/decision-record.md` resolved from the repo root. No project-config indirection.

#### AC-3.2 — Append-only invariant

**Observable boundary:** the corpus file's content before and after a records-fork run.

**Given** the corpus before the fork run contains records R1..RN,
**When** the fork emits one or more new records,
**Then** the resulting corpus contains R1..RN unchanged followed by the new records appended at the end. No prior record's text is modified by byte.

#### AC-3.3 — Supersession discovered by forward scan

**Observable boundary:** the records-fork filter's supersession-handling procedure.

**Given** record B supersedes record A,
**When** record B is emitted,
**Then** record B's `supersedes` field carries record A's `id`, AND no edit is made to record A. The discovery procedure documented in `decision-record-filter.md` is: given a record id, grep forward over the corpus for any record whose `supersedes` field matches that id.

### AC-4 — Surgical revert (RCON-4)

#### AC-4.1 — `chester-decision-record` MCP package removed

**Observable boundary:** the `mcp/` directory and `.claude-plugin/mcp.json`.

**Given** the revert is complete,
**When** the repo is inspected,
**Then** `mcp/chester-decision-record/` does not exist as a directory, and `.claude-plugin/mcp.json` contains no entry for `chester-decision-record`.

#### AC-4.2 — `execute-write` reverted to pre-04-24 chain

**Observable boundary:** `skills/execute-write/SKILL.md`, `skills/execute-write/references/implementer.md`, and `skills/execute-write/references/spec-reviewer.md` after revert.

**Given** the revert is complete,
**When** the three files are read,
**Then** none contains any reference to: trigger-check, propagation procedure, observable-behaviors emission/artifact, spec-reviewer input-restriction directive, skeleton-coverage diff, test-generator dispatch. The 16 lines added by `96ea360` to each of `references/implementer.md` and `references/spec-reviewer.md` are removed; the 23-line block added to `SKILL.md` is removed. The implementer + spec-reviewer + quality-reviewer per-task chain is described in `SKILL.md` as the dispatch procedure.

#### AC-4.6a — `finish-write-records` steps renumber after Step 4 deletion

**Observable boundary:** `skills/finish-write-records/SKILL.md` after revert.

**Given** the revert is complete,
**When** the file's step headings are read,
**Then** the sequence is Step 1 (Determine Output Location), Step 2 (Select Source Mode), Step 3 (Write Artifacts — including the new parallel-fork emission), Step 4 (Copy Implementation Plan, feature-mode only), Step 5 (Offer Session State Update), Step 6 (Commit, refactor-mode only). No Step 7 exists. No Decision-Record Audit and Abandonment heading exists at any number.

#### AC-4.3 — `design-specify` skeleton-manifest scaffolding removed

**Observable boundary:** `skills/design-specify/SKILL.md` and its `references/` directory.

**Given** the revert is complete,
**When** `skills/design-specify/` is inspected,
**Then** the SKILL.md contains no "Scaffold test skeletons" subsection and no reference to a skeleton manifest sidecar artifact, AND `references/skeleton-generator.md` does not exist. Brief-to-spec AC seeding text is preserved.

#### AC-4.4 — `plan-build` `dr_query` integration removed

**Observable boundary:** `skills/plan-build/SKILL.md` after revert.

**Given** the revert is complete,
**When** `skills/plan-build/SKILL.md` and `skills/plan-build/references/plan-template.md` are read,
**Then** neither file contains any `dr_query` invocation or any instruction to consult the decision-record corpus during plan composition. (The brief's RCON-4 references "must-remain-green" as a name for the `dr_query`-driven prior-decisions block; the literal token does not appear in the codebase, so its removal is satisfied by removing the `dr_query` integration.)

#### AC-4.5 — `execute-verify-complete` `dr_verify_tests` removed

**Observable boundary:** `skills/execute-verify-complete/SKILL.md` after revert.

**Given** the revert is complete,
**When** `skills/execute-verify-complete/SKILL.md` is read,
**Then** the file contains no `dr_verify_tests` invocation and no instruction to verify decision-record state as part of the verify pass.

#### AC-4.6 — `finish-write-records` `dr_audit` block replaced

**Observable boundary:** `skills/finish-write-records/SKILL.md` after revert.

**Given** the revert is complete,
**When** `skills/finish-write-records/SKILL.md` is read,
**Then** Step 4 (the `dr_audit` / `dr_abandon` block) does not exist, and Step 3 contains the parent-orchestrated parallel dispatch described in AC-1.1.

#### AC-4.7 — Bash tests removed

**Observable boundary:** the `tests/` directory.

**Given** the revert is complete,
**When** `tests/` is listed,
**Then** the eight `test-decision-record-*.sh` scripts, `test-execute-write-update.sh`, and `test-skeleton-manifest-path-convention.sh` do not exist. A recursive grep over `tests/` for any of the tokens `dr_capture`, `dr_audit`, `dr_query`, `dr_supersede`, `dr_finalize_refs`, `dr_abandon`, `dr_verify_tests`, `chester-decision-record`, `must-remain-green`, `skeleton-generator`, `propagation-procedure`, `observable-behaviors` returns zero matches.

#### AC-4.10 — Test-generator named subagent removed

**Observable boundary:** the `agents/` directory.

**Given** the revert is complete,
**When** `agents/` is listed,
**Then** `agents/execute-write-test-generator.md` does not exist, and no `chester:execute-write-test-generator` dispatch reference remains in any skill file.

#### AC-4.8 — Plugin manifest cleaned

**Observable boundary:** `.claude-plugin/mcp.json` after revert.

**Given** the revert is complete,
**When** `.claude-plugin/mcp.json` is read,
**Then** the file lists only `chester-design-understanding-classic`, `chester-design-understanding-problemfocused`, and `chester-design-proof`. No entry for `chester-decision-record`.

#### AC-4.9 — Post-04-24 keep-bucket changes preserved

**Observable boundary:** the eight specific changes named in the brief's NC-05 collapse test.

**Given** the revert is complete,
**When** the repo is inspected,
**Then** all eight survive intact: (1) provenance trailer stamping (`chester-trailer-write` invocations remain in skills that gained them post-04-24), (2) named-subagent fork policy (the `chester:design-large-task-step-b-*` and other named subagents introduced post-04-24 remain registered), (3) pluggable Understanding-MCP swap line in `design-large-task/SKILL.md`, (4) automatic ground-truth review in `design-specify`, (5) brief-to-spec AC seeding text in `design-specify`, (6) Session Skill Versions harvest in `finish-write-records`, (7) heuristic execution-mode selection in `execute-write` (whichever post-04-24 form survives the trigger-check removal), (8) cluster-a Resolve Conditions sections in `design-large-task` proof envelope.

<!-- created-at: 2026-05-01T13:37:58Z -->
<!-- produced-by design-specify@v0002 -->
