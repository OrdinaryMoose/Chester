#!/usr/bin/env bash
set -euo pipefail

SKILL="chester-execute-write/SKILL.md"
ERRORS=0

# Must have budget guard
if ! grep -q "Budget Guard Check" "$SKILL"; then
  echo "FAIL: missing Budget Guard Check section"
  ERRORS=$((ERRORS + 1))
fi

# Must reference per-task checking
if ! grep -q "usage.json" "$SKILL"; then
  echo "FAIL: does not reference usage.json"
  ERRORS=$((ERRORS + 1))
fi

if [ "$ERRORS" -gt 0 ]; then
  echo "FAIL: $ERRORS errors"
  exit 1
fi

echo "PASS: chester-execute-write has budget guard"
exit 0
