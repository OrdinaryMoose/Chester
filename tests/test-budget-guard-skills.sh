#!/usr/bin/env bash
set -euo pipefail

SKILLS=(
  "chester-figure-out/SKILL.md"
  "chester-build-spec/SKILL.md"
  "chester-build-plan/SKILL.md"
  "chester-finish-plan/SKILL.md"
)

ERRORS=0

for skill in "${SKILLS[@]}"; do
  if ! grep -q "Budget Guard Check" "$skill"; then
    echo "FAIL: $skill missing Budget Guard Check section"
    ERRORS=$((ERRORS + 1))
  fi
  if ! grep -q "usage.json" "$skill"; then
    echo "FAIL: $skill does not reference usage.json"
    ERRORS=$((ERRORS + 1))
  fi
  if ! grep -q "threshold" "$skill"; then
    echo "FAIL: $skill does not reference threshold"
    ERRORS=$((ERRORS + 1))
  fi
done

if [ "$ERRORS" -gt 0 ]; then
  echo "FAIL: $ERRORS errors across pipeline skills"
  exit 1
fi

echo "PASS: all pipeline skills have budget guard"
exit 0
