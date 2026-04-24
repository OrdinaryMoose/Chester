#!/usr/bin/env bash
set -euo pipefail

SKILL="skills/plan-build/SKILL.md"
ERRORS=0

# Smell heuristic section
if ! grep -q -i "smell heuristic\|smell pre-check\|Smell Trigger" "$SKILL"; then
  echo "FAIL: $SKILL missing smell heuristic pre-check section"
  ERRORS=$((ERRORS + 1))
fi

# Trigger categories
for category in "DI" "abstraction" "async" "persistence" "contract"; do
  if ! grep -q -i "$category" "$SKILL"; then
    echo "FAIL: $SKILL missing smell trigger category: $category"
    ERRORS=$((ERRORS + 1))
  fi
done

# Specific keywords
for keyword in "AddScoped" "SemaphoreSlim" "DbContext"; do
  if ! grep -q "$keyword" "$SKILL"; then
    echo "FAIL: $SKILL missing specific trigger keyword: $keyword"
    ERRORS=$((ERRORS + 1))
  fi
done

# Ground-truth cascade
if ! grep -q -i "ground-truth" "$SKILL"; then
  echo "FAIL: $SKILL does not reference ground-truth report cascade"
  ERRORS=$((ERRORS + 1))
fi

# Scope-narrowing description
if ! grep -q -i "verified anchor\|skip-list\|plan-specific additions" "$SKILL"; then
  echo "FAIL: $SKILL does not describe plan-attack scope narrowing"
  ERRORS=$((ERRORS + 1))
fi

# Must list design-specify as the primary invoker (canonical sequence:
# design-experimental | design-small-task -> design-specify -> plan-build)
if ! grep -q "Invoked by.*design-specify" "$SKILL"; then
  echo "FAIL: $SKILL does not list design-specify as invoker"
  ERRORS=$((ERRORS + 1))
fi

# Must reference design-experimental in the ground-truth cascade context
# (the cascade survives through design-specify because both write into the same
# sprint subdirectory)
if ! grep -q "design-experimental" "$SKILL"; then
  echo "FAIL: $SKILL does not reference design-experimental in cascade context"
  ERRORS=$((ERRORS + 1))
fi

if [ "$ERRORS" -gt 0 ]; then
  echo "FAIL: $ERRORS errors in plan-build"
  exit 1
fi

echo "PASS: plan-build heuristic and cascade structure correct"
exit 0
