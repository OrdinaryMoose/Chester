#!/usr/bin/env bash
set -euo pipefail

ERRORS=0

# design-specify is no longer archived — reinstated as mandatory step between
# design-* and plan-build. design-figure-out remains archived.
for skill in skills/*/SKILL.md; do
  for archived in "design-figure-out"; do
    if grep -q "$archived" "$skill"; then
      echo "FAIL: $skill references archived skill: $archived"
      ERRORS=$((ERRORS + 1))
    fi
  done
done

if [ "$ERRORS" -gt 0 ]; then
  echo "FAIL: $ERRORS archived-skill references across active skills"
  exit 1
fi

echo "PASS: no archived-skill references in any active skill"
exit 0
