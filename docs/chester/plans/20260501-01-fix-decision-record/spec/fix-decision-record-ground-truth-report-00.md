# Ground-Truth Review Report — fix-decision-record spec

**Sprint:** `20260501-01-fix-decision-record`
**Spec reviewed:** `spec/fix-decision-record-spec-00.md`
**Date:** 2026-05-01
**Reviewer:** `general-purpose` subagent (independent context)

## Status

**Initial: Findings.** **Post-fix: Clean** (HIGH and MEDIUM addressed; one LOW noted).

## Verified Claims

- `mcp/chester-decision-record/` package contents: `server.js`, `handlers.js`, `schema.js`, `store.js`, `package.json`, `package-lock.json`, `node_modules/`, `__tests__/` — CONFIRMED.
- `.claude-plugin/mcp.json` registers exactly four servers — CONFIRMED.
- All eight `tests/test-decision-record-*.sh` scripts exist with the exact filenames listed — CONFIRMED.
- `tests/test-execute-write-update.sh` and `tests/test-skeleton-manifest-path-convention.sh` exist — CONFIRMED.
- `agents/execute-write-test-generator.md` exists — CONFIRMED.
- Commit `96ea360` net diff: SKILL.md (+23/−6), `references/implementer.md` (+16), `references/spec-reviewer.md` (+16), `tests/test-execute-write-update.sh` (+114) — CONFIRMED.
- JSONL path-resolution snippet at `skills/finish-write-records/SKILL.md:160-161` — CONFIRMED.
- `finish-write-records` SKILL.md current step structure (Step 1 → Step 7) and the proposed Step 4 deletion → renumber — CONFIRMED.
- `dr_query` references in `plan-build/SKILL.md` (lines 24, 58, 62, 77, 79, 345) and `plan-template.md` (lines 36, 40) — CONFIRMED.
- `dr_verify_tests` in `execute-verify-complete/SKILL.md` (lines 45, 64) — CONFIRMED.
- `dr_audit` / `dr_abandon` block in `finish-write-records/SKILL.md` (lines 236-269) — CONFIRMED.
- All eight keep-bucket items findable in codebase post-04-24 — CONFIRMED:
  - Provenance trailer stamping at `skills/finish-write-records/SKILL.md:116, 123, 129, 151, 185, 209, 233`.
  - Named subagents under `agents/` (design-large-task-step-b-*, plan-build-*, execute-write-quality-reviewer.md, execute-write-spec-reviewer.md).
  - Pluggable Understanding-MCP swap line at `skills/design-large-task/SKILL.md:77, 80, 98`.
  - Automatic ground-truth review at `skills/design-specify/SKILL.md:34, 199, 207`.
  - Brief-to-spec AC seeding at `skills/design-specify/SKILL.md:159`.
  - Session Skill Versions harvest at `skills/finish-write-records/SKILL.md:117, 132`.
  - Heuristic execution-mode selection in `execute-write` (post-04-24 form).
  - Cluster-a Resolve Conditions in proof-mcp tests.

## Findings (with disposition)

### HIGH — `skeleton-generator.md` path wrong in Components/Deleted

**Spec said:** `skills/execute-write/references/skeleton-generator.md (verify file exists before deleting; if absent in current tree, no-op).`

**Code shows:** the file lives at `skills/design-specify/references/skeleton-generator.md`. There is no `skills/execute-write/references/skeleton-generator.md`. Verified at `skills/design-specify/SKILL.md:163` which references `references/skeleton-generator.md` (relative to design-specify).

**Impact:** An implementer following the spec literally would no-op (path doesn't exist where stated), and the actual `skeleton-generator.md` under `design-specify/references/` would survive the revert — leaving a dead reference behind.

**Fix applied:** Components/Deleted list now reads `skills/design-specify/references/skeleton-generator.md`. AC-4.3 was already correct (it inspected `skills/design-specify/`); only the Deleted list contradicted itself with AC-4.3.

### MEDIUM — `must-remain-green` token not present in plan-build

**Spec said:** `drop ... must-remain-green references that depend on dr_query output` and AC-4.4 said `the file contains no ... must-remain-green reference`.

**Code shows:** `grep -n "must-remain-green"` over `skills/plan-build/SKILL.md` and `skills/plan-build/references/plan-template.md` returned zero matches.

**Impact:** The token in the brief's RCON-4 was a vocabulary inheritance from earlier discussion; it is not a literal string in the codebase. AC-4.4 would trivially pass for that clause without verifying anything substantive.

**Fix applied:** Components/Modified entry for plan-build clarifies that `must-remain-green` is a brief-side name for the `dr_query`-driven prior-decisions block; AC-4.4 updated to verify removal of `dr_query` invocations and decision-record-corpus consultation instructions in both `SKILL.md` and `references/plan-template.md`. The literal-token check is dropped because it is vacuous.

### LOW — `23-line block` in execute-write SKILL.md is non-contiguous

**Spec said:** `(23 lines added in commit 96ea360.)`

**Code shows:** `git show 96ea360 -- skills/execute-write/SKILL.md` reveals the +23 lines are spread across two regions: a new section near the Step-2/Step-3 boundary, and a smaller bullet block under "From the decision-record loop:" later in the file.

**Impact:** An implementer searching for a single contiguous block could miss the late-file bullet.

**Fix applied:** Components/Modified entry now reads `+23/−6 lines in commit 96ea360, spread across two non-contiguous regions ... both regions must be removed`.

## Risk Assessment

The spec is implementable as written after the three fixes. The HIGH finding was a directory misattribution that contradicted the spec's own AC-4.3. The MEDIUM was a brief-inherited vocabulary artifact corrected to point at the actual operative construct. The LOW added a directional hint for the implementer. No further factual errors detected. Path correctness, line-count claims, file existence, MCP registration, step structure, and keep-bucket presence all verified against the live codebase.

<!-- created-at: 2026-05-01T13:37:58Z -->
<!-- produced-by design-specify@v0002 -->
