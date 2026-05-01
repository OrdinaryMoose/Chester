# Observable Behaviors — Task 1: chester-trailer-write stamp

Produced per execute-write Mod 2 decision-record loop for code-producing tasks.

## Spec skeleton manifest

This sprint skipped design-specify; no spec/ directory exists. Consequently
no spec skeleton manifest is available to cross-reference. The task contract
is defined directly in the plan (`plan/add-artifact-skill-versions-plan-00.md`,
Task 1) by the test cases and the verbatim implementation.

## Behaviors implemented (one per row, mapped to test cases)

| # | Behavior | Test case | AC mapping |
|---|----------|-----------|------------|
| 1 | Fresh file: stamp appends a trailer block with `<!-- created-at: ISO-Z -->` and `<!-- produced-by skill@vNNNN -->`, separated from prior content by a blank line. | case 1, case 8 | AC-1 |
| 2 | Idempotency: stamping the same `(skill, version)` twice does NOT add a second `produced-by` line — exact-line `grep -Fxq` short-circuits. | case 2 | AC-2, AC-6 |
| 3 | Version-change append: stamping the same skill at a NEW version keeps the prior `produced-by` line and appends the new one BELOW it (insertion order preserved). | case 3 | AC-3 |
| 4 | `created-at` is frozen on first stamp and never rewritten by subsequent stamps (no matter how many later skills/versions append). | case 4 | AC-1 |
| 5 | Multiple distinct skills accumulate in first-touch order — three stamps produce three `produced-by` lines. | case 5 | AC-3 |
| 6 | Argument validation: bare invocation, missing args, or wrong subcommand exits non-zero (usage to stderr, exit 2). | case 6 | error path |
| 7 | Missing-file: stamping a nonexistent path exits non-zero (exit 1, error to stderr). | case 7 | error path |
| 8 | Last-20-lines anchor: a column-0 `<!-- created-at -->` / `<!-- produced-by -->` example appearing inside a fenced code block earlier in the file does NOT register as the artifact's own trailer. The detector uses `tail -n 20 | grep` so a fresh trailer block is created at end and the mid-file example is left untouched. | case 9 | AC-1 (anti-false-positive) |

## Subcommand surface

- `stamp <skill>@<version> <path>` — implemented and tested.
- `harvest <sprint-dir>` — stub only (exits 99 with "not yet implemented").
  Body lands in Task 2.

## Validation

- `bash tests/test-trailer-write.sh` → `PASS: trailer-write stamp behavior correct`.
- All 9 cases pass on first impl run after the executable bit was set.

## Concerns / follow-ups

- The dispatcher accepts `harvest` and routes to `do_harvest`, which exits 99.
  Task 2 will replace that body. No external caller wires `harvest` yet, so the
  stub is safe for now.
- Skill-version format validation is intentionally loose (`*@v*`). A
  stricter regex (e.g., `^[a-z][a-z0-9-]*@v[0-9]{4}$`) was not specified in the
  plan; leaving it loose matches the verbatim implementation. If later tasks
  require stricter validation, they can tighten without breaking callers.
- No spec skeleton manifest exists for this sprint (design-specify skipped).
  Behaviors above are reconciled against the plan's test cases instead.
