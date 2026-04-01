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

# Must have diagnostic logging section
if ! grep -q "Diagnostic Logging" "$SKILL"; then
  echo "FAIL: missing Diagnostic Logging section"
  ERRORS=$((ERRORS + 1))
fi

# Must reference chester-debug.json for diagnostic mode detection
if ! grep -q "chester-debug.json" "$SKILL"; then
  echo "FAIL: does not reference chester-debug.json"
  ERRORS=$((ERRORS + 1))
fi

# Must reference token-usage-log
if ! grep -q "token-usage-log" "$SKILL"; then
  echo "FAIL: does not reference token-usage-log"
  ERRORS=$((ERRORS + 1))
fi

if [ "$ERRORS" -gt 0 ]; then
  echo "FAIL: $ERRORS errors"
  exit 1
fi

echo "PASS: chester-execute-write has budget guard and diagnostic logging"
exit 0
