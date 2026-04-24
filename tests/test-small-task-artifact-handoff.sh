#!/usr/bin/env bash
set -euo pipefail

SKILL="skills/design-small-task/SKILL.md"
ERRORS=0

if ! grep -q "Artifact Handoff" "$SKILL"; then
  echo "FAIL: $SKILL does not reference Artifact Handoff"
  ERRORS=$((ERRORS + 1))
fi

if ! grep -q "plan-build" "$SKILL"; then
  echo "FAIL: $SKILL does not reference plan-build"
  ERRORS=$((ERRORS + 1))
fi

# design-small-task now transitions to design-specify (which then chains into plan-build)
if ! grep -q "design-specify" "$SKILL"; then
  echo "FAIL: $SKILL does not reference design-specify (the new downstream skill)"
  ERRORS=$((ERRORS + 1))
fi

# design-figure-out remains archived
for archived in "design-figure-out"; do
  if grep -q "$archived" "$SKILL"; then
    echo "FAIL: $SKILL references archived skill: $archived"
    ERRORS=$((ERRORS + 1))
  fi
done

if [ "$ERRORS" -gt 0 ]; then
  echo "FAIL: $ERRORS errors"
  exit 1
fi

echo "PASS: design-small-task uses Artifact Handoff terminology"
exit 0
