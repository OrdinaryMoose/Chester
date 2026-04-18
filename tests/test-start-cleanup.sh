#!/usr/bin/env bash
set -euo pipefail

SKILL="skills/setup-start/SKILL.md"

# Verify setup-start has session housekeeping
if ! grep -q "Session Housekeeping" "$SKILL"; then
  echo "FAIL: setup-start missing Session Housekeeping"
  exit 1
fi

# Must not reference archived skills in the available-skills list or priority
for archived in "design-figure-out" "design-specify"; do
  if grep -q "$archived" "$SKILL"; then
    echo "FAIL: $SKILL still references archived skill: $archived"
    exit 1
  fi
done

echo "PASS: setup-start has session housekeeping"
exit 0
