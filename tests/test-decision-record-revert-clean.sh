#!/usr/bin/env bash
# test-decision-record-revert-clean.sh — verify surgical revert leaves no dangling references
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
TOKENS=(
  dr_capture
  dr_audit
  dr_query
  dr_supersede
  dr_finalize_refs
  dr_abandon
  dr_verify_tests
  chester-decision-record
  must-remain-green
  skeleton-generator
  propagation-procedure
  observable-behaviors
)

EXIT=0
SCAN_DIRS=("$ROOT/skills" "$ROOT/agents" "$ROOT/tests" "$ROOT/.claude-plugin")

for token in "${TOKENS[@]}"; do
  hits=""
  for dir in "${SCAN_DIRS[@]}"; do
    [ -d "$dir" ] || continue
    found=$(grep -rn -- "$token" "$dir" 2>/dev/null | grep -v "/plans/" || true)
    if [ -n "$found" ]; then
      hits="${hits}${found}"$'\n'
    fi
  done
  if [ -n "$hits" ]; then
    echo "FAIL: token '$token' still present:" >&2
    echo "$hits" >&2
    EXIT=1
  fi
done

# Also verify the explicit file-level deletions.
DELETED_PATHS=(
  "$ROOT/mcp/chester-decision-record"
  "$ROOT/skills/design-specify/references/skeleton-generator.md"
  "$ROOT/skills/execute-write/references/propagation-procedure.md"
  "$ROOT/skills/execute-write/references/test-generator.md"
  "$ROOT/agents/execute-write-test-generator.md"
  "$ROOT/tests/test-decision-record-abandon.sh"
  "$ROOT/tests/test-decision-record-ac-mapping.sh"
  "$ROOT/tests/test-decision-record-capture-finalize.sh"
  "$ROOT/tests/test-decision-record-cross-sprint.sh"
  "$ROOT/tests/test-decision-record-registration.sh"
  "$ROOT/tests/test-decision-record-setup.sh"
  "$ROOT/tests/test-decision-record-shared-fixtures.sh"
  "$ROOT/tests/test-decision-record-supersede.sh"
  "$ROOT/tests/test-execute-write-update.sh"
  "$ROOT/tests/test-skeleton-manifest-path-convention.sh"
  "$ROOT/tests/test-finish-write-records-update.sh"
  "$ROOT/tests/test-reference-files.sh"
  "$ROOT/tests/test-plan-build-update.sh"
  "$ROOT/tests/test-execute-verify-complete-update.sh"
)
for path in "${DELETED_PATHS[@]}"; do
  if [ -e "$path" ]; then
    echo "FAIL: path '$path' still exists" >&2
    EXIT=1
  fi
done

if [ "$EXIT" -eq 0 ]; then
  echo "PASS: surgical revert is clean"
else
  echo "FAIL: surgical revert is incomplete"
fi

exit "$EXIT"
