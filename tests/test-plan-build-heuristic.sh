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

# Must not list archived design-specify as invoker
if grep -q "Invoked by.*design-specify\|design-specify.*invokes" "$SKILL"; then
  echo "FAIL: $SKILL still lists design-specify as invoker"
  ERRORS=$((ERRORS + 1))
fi

# Must list design-experimental or design-small-task
if ! grep -q "design-experimental\|design-small-task" "$SKILL"; then
  echo "FAIL: $SKILL does not list experimental or small-task as invoker"
  ERRORS=$((ERRORS + 1))
fi

if [ "$ERRORS" -gt 0 ]; then
  echo "FAIL: $ERRORS errors in plan-build"
  exit 1
fi

echo "PASS: plan-build heuristic and cascade structure correct"
exit 0
