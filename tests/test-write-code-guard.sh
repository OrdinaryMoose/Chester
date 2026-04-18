#!/usr/bin/env bash
set -euo pipefail

SKILL="skills/execute-write/SKILL.md"
ERRORS=0

# Must have budget guard section
if ! grep -q -i "budget guard" "$SKILL"; then
  echo "FAIL: missing Budget Guard section"
  ERRORS=$((ERRORS + 1))
fi

# Must reference util-budget-guard (delegation, not embedded implementation)
if ! grep -q "util-budget-guard" "$SKILL"; then
  echo "FAIL: does not reference util-budget-guard"
  ERRORS=$((ERRORS + 1))
fi

# Must mention per-task checking (mid-skill checkpoint before subagent dispatch)
if ! grep -q -i "before dispatching" "$SKILL"; then
  echo "FAIL: does not mention mid-skill checkpoint before subagent dispatch"
  ERRORS=$((ERRORS + 1))
fi

if [ "$ERRORS" -gt 0 ]; then
  echo "FAIL: $ERRORS errors"
  exit 1
fi

echo "PASS: execute-write has budget guard"
exit 0
