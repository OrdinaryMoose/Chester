# tests/ — CLAUDE.md

Self-contained bash test scripts for Chester components: hooks, config resolution, artifact schema, skill stamping, and integration behavior.

## Running tests

Single test:
```bash
bash tests/test-<name>.sh
```

Full suite:
```bash
for t in tests/test-*.sh; do bash "$t" || echo "FAIL: $t"; done
```

## Test categories (by filename prefix)

- `test-ac-N-M-*.sh` — acceptance criteria tests tied to a numbered spec requirement (cluster N, AC M).
- `test-stamping-*.sh` — skill-stamping discipline (info-packet stamping, version bumps).
- `test-artifact-*.sh` — artifact schema, naming, provenance.
- `test-decision-record-revert-clean.sh` — revert hygiene: guards that the removed decision-record system (MCP server, filter reference, emission/supersession tests) leaves no dangling references.
- `test-trailer-*.sh` — commit-message trailer harvest/write.
- `test-partner-role-*.sh` — design-partner-role overlay discipline.
- `test-finish-*.sh` — finish-phase skills (record writing, archive).
- `test-chester-config-*.sh` — `chester-config-read` resolution.

## Authoring conventions

- Each test is a single bash file. No shared test harness.
- Exit code 0 = pass. Non-zero = fail.
- Tests must clean up after themselves; assume hostile CWD and stray state.
- Print a one-line PASS or FAIL summary at the end so the suite runner's per-file output is grep-able.

## What tests prove

Tests validate **structural and behavioral contracts** of Chester itself — they do not validate the projects Chester is used on. If a test references a project artifact, it stubs or fixtures it.
