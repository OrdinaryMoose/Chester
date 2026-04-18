#!/usr/bin/env bash
set -euo pipefail

SCHEMA="skills/util-artifact-schema/SKILL.md"
ERRORS=0

for archived in "design-figure-out" "design-specify"; do
  if grep -q "$archived" "$SCHEMA"; then
    echo "FAIL: $SCHEMA references archived skill: $archived"
    ERRORS=$((ERRORS + 1))
  fi
done

if ! grep -q "design-experimental" "$SCHEMA"; then
  echo "FAIL: $SCHEMA does not list design-experimental as producer"
  ERRORS=$((ERRORS + 1))
fi

if ! grep -q "ground-truth" "$SCHEMA"; then
  echo "FAIL: $SCHEMA missing ground-truth artifact type"
  ERRORS=$((ERRORS + 1))
fi

if [ "$ERRORS" -gt 0 ]; then
  echo "FAIL: $ERRORS errors in artifact schema"
  exit 1
fi

echo "PASS: artifact schema correct"
exit 0
