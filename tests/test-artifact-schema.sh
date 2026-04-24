#!/usr/bin/env bash
set -euo pipefail

SCHEMA="skills/util-artifact-schema/SKILL.md"
ERRORS=0

# design-specify is reinstated as a producer (spec artifact + spec-ground-truth-report).
# design-figure-out remains archived.
for archived in "design-figure-out"; do
  if grep -q "$archived" "$SCHEMA"; then
    echo "FAIL: $SCHEMA references archived skill: $archived"
    ERRORS=$((ERRORS + 1))
  fi
done

# Canonical sequence producers must all appear
for producer in "design-experimental" "design-small-task" "design-specify" "plan-build" "execute-write" "finish-write-records"; do
  if ! grep -q "$producer" "$SCHEMA"; then
    echo "FAIL: $SCHEMA does not list $producer as producer"
    ERRORS=$((ERRORS + 1))
  fi
done

# Ground-truth artifact now lives at spec/ under design-specify.
if ! grep -q "spec-ground-truth-report\|ground-truth" "$SCHEMA"; then
  echo "FAIL: $SCHEMA missing spec-ground-truth-report artifact type"
  ERRORS=$((ERRORS + 1))
fi

if [ "$ERRORS" -gt 0 ]; then
  echo "FAIL: $ERRORS errors in artifact schema"
  exit 1
fi

echo "PASS: artifact schema correct"
exit 0
