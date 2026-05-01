# Deferred Items

## 2026-05-01 — Task 2 quality findings (deferred)

**Source task:** Task 2 (harvest subcommand)
**Status:** deferred (not blocking; latent only)

### 1. `trap RETURN` scope-leak in `do_harvest`

The implementation uses `trap 'rm -f "$tmp"' RETURN` inside `do_harvest`. Bash 5.x fires RETURN traps at every enclosing function-return level when the function is nested. Today's call site is the top-level dispatcher (`case "$cmd" in harvest)`), not nested in another function, so no double-fire. Latent risk: any future refactor that wraps the dispatcher inside a function would cause the trap to fire twice. Idiomatic mitigation: wrap call in subshell `( do_harvest "$@" )` or use an EXIT trap.

**Why deferred:** the plan code was implemented verbatim; deviating now is scope creep. No live bug.

### 2. No test for empty sprint directory

`tests/test-trailer-harvest.sh` has six cases but no case for "harvest of a sprint dir with zero .md files". `sort` and `awk` on empty input both behave correctly (exit 0, emit nothing), but the contract edge isn't pinned by a test. Adding a one-liner case would close it.

**Why deferred:** the plan's six cases were implemented verbatim. Add when finish-write-records integration in Task 9 reveals a real-world empty-dir scenario.

## 2026-05-01 — Task 1 quality finding (deferred)

**Source task:** Task 1 (stamp subcommand)
**Status:** deferred (cosmetic)

### Dead `created-at` branch in detection regex

The trailer-block detector uses `^<!-- (created-at|produced-by) ` (note: space after group). Actual `created-at` lines are `<!-- created-at: ...` (colon, not space), so the `created-at` alternation never matches. `produced-by` lines always serve as the anchor, and `do_stamp` always writes both lines together, so the branch is dead but harmless.

**Why deferred:** plan code is verbatim; the comment overstates what the regex matches but functional behavior is correct.

## 2026-05-01 — Task 9 quality finding (deferred)

**Source task:** Task 9 (finish-write-records harvest wiring)
**Status:** deferred (test gap)

### Harvest-before-summary ordering not asserted by test

`tests/test-finish-write-records-provenance.sh` asserts that `chester-trailer-write harvest` appears in the SKILL.md but does not assert it appears BEFORE the `### Session Summary` subsection. A future edit that reorders these would pass the presence check while breaking the contract that harvest output must be available when summary is written. Adding a line-number ordering assertion would close the gap.

**Why deferred:** plan's test template did not include the ordering check. Implementer followed the spec faithfully — gap is in the spec, not the implementation.

## 2026-05-01 — Pre-existing decision-record test infrastructure breakage

**Source task:** execute-verify-complete (full-suite verification)
**Status:** deferred (pre-existing on main, not introduced by this sprint)

### Decision-record MCP tests crash with `ERR_MODULE_NOT_FOUND`

5 of 8 `tests/test-decision-record-*.sh` scripts fail with Node module-resolution errors before any assertion runs. Affected:

- `tests/test-decision-record-abandon.sh`
- `tests/test-decision-record-capture-finalize.sh`
- `tests/test-decision-record-cross-sprint.sh`
- `tests/test-decision-record-shared-fixtures.sh`
- `tests/test-decision-record-supersede.sh`

The 3 remaining decision-record tests pass (`ac-mapping`, `registration`, `setup`). Verified pre-existing by running the same tests against `main` — same crash. Likely cause: a missing `node_modules` somewhere under the decision-record MCP server, or a broken ES module import path. Filtered out of the verify-complete suite for this sprint.

**Why deferred:** unrelated to artifact provenance. Needs its own debugging session — possibly a one-line `npm install` fix, possibly deeper. (Update mid-finish: root cause found — worktrees lack `node_modules/`; bug report at `summary/bug-decision-record-mcp-tests.md` recommends symlinking from main as the fix.)

## 2026-05-01 — Harvest helper bugs found at finish time

**Source task:** `finish-write-records` invocation against this sprint
**Status:** bugs found, deferred to follow-up sprint (not blocking sprint close — harvest's empty output for this sprint is acceptable since the wiring landed mid-sprint)

### Harvest crashes on files without a `created-at` line (set -e / pipefail interaction)

`do_harvest` line 79:

```bash
created="$(grep -E '^<!-- created-at: ' "$file" | head -1 | sed -E 's/^<!-- created-at: (.*) -->$/\1/')"
[ -n "$created" ] || created="9999-99-99T99:99:99Z"
```

When a file has no `<!-- created-at: ... -->` line, `grep` exits 1. The pipeline's exit status (under `set -o pipefail`) is 1. `set -e` exits the function before the fallback `[ -n "$created" ] || created="..."` runs. The documented fallback never fires.

In practice this means harvest fails silently (exit 1, no output) on any sprint dir containing at least one `.md` file without a trailer-format `created-at` line — essentially every sprint until the convention is fully adopted, plus any artifact that is a sidecar without yet-stamped state.

**Fix:** absorb grep's non-zero exit. One option:

```bash
created="$(grep -E '^<!-- created-at: ' "$file" 2>/dev/null | head -1 | sed -E 's/^<!-- created-at: (.*) -->$/\1/' || true)"
```

**Why deferred:** real bug discovered at finish time; one-line fix that should land in a follow-up sprint with its own TDD test (case: harvest a sprint dir with mixed files, some without created-at — expect fallback timestamp, no exit-1 crash).

### Harvest does not anchor produced-by detection to last-N-lines

Harvest scans every `.md` file for `^<!-- produced-by ... -->` lines anywhere in the file. The stamp subcommand was hardened (mitigation d) to only check the last 20 lines for trailer-block detection, but harvest was not given the same anchor. Result: any file containing literal trailer-format examples in fenced code blocks (the plan file's task code blocks, the schema docs, the bug report) gets those examples harvested as if they were real stamps.

In this sprint's harvest, the plan file alone produces ~10 false-positive `produced-by` entries that came from test fixture code blocks.

**Fix:** apply the same last-20-lines anchor in `do_harvest`'s awk filter — pre-process each file with `tail -n 20` before scanning for `produced-by` lines.

**Why deferred:** real bug, same follow-up sprint as the previous item — both are harvest-correctness fixes belonging together.

