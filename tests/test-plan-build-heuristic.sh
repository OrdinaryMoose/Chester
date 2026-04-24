#!/usr/bin/env bash
set -euo pipefail

SKILL="skills/plan-build/SKILL.md"
TRIGGERS_REF="skills/plan-build/references/smell-triggers.md"
ERRORS=0

# Smell heuristic section must stay in SKILL.md (decision procedure belongs here,
# not in the reference file)
if ! grep -q -i "smell heuristic\|smell pre-check\|Smell Trigger" "$SKILL"; then
  echo "FAIL: $SKILL missing smell heuristic pre-check section"
  ERRORS=$((ERRORS + 1))
fi

# SKILL.md must cite the reference file (where the trigger list now lives)
if ! grep -q "references/smell-triggers.md" "$SKILL"; then
  echo "FAIL: $SKILL does not cite references/smell-triggers.md"
  ERRORS=$((ERRORS + 1))
fi

# The reference file must exist and carry the trigger library
if [ ! -f "$TRIGGERS_REF" ]; then
  echo "FAIL: $TRIGGERS_REF does not exist"
  ERRORS=$((ERRORS + 1))
else
  # Trigger categories present in the reference
  for category in "DI" "abstraction" "async" "persistence" "contract"; do
    if ! grep -q -i "$category" "$TRIGGERS_REF"; then
      echo "FAIL: $TRIGGERS_REF missing smell trigger category: $category"
      ERRORS=$((ERRORS + 1))
    fi
  done

  # Specific keywords present in the reference
  for keyword in "AddScoped" "SemaphoreSlim" "DbContext"; do
    if ! grep -q "$keyword" "$TRIGGERS_REF"; then
      echo "FAIL: $TRIGGERS_REF missing specific trigger keyword: $keyword"
      ERRORS=$((ERRORS + 1))
    fi
  done
fi

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
# design-large-task | design-small-task -> design-specify -> plan-build)
if ! grep -q "Invoked by.*design-specify" "$SKILL"; then
  echo "FAIL: $SKILL does not list design-specify as invoker"
  ERRORS=$((ERRORS + 1))
fi

# Must reference design-large-task in the ground-truth cascade context
# (the cascade survives through design-specify because both write into the same
# sprint subdirectory)
if ! grep -q "design-large-task" "$SKILL"; then
  echo "FAIL: $SKILL does not reference design-large-task in cascade context"
  ERRORS=$((ERRORS + 1))
fi

if [ "$ERRORS" -gt 0 ]; then
  echo "FAIL: $ERRORS errors in plan-build"
  exit 1
fi

echo "PASS: plan-build heuristic and cascade structure correct"
exit 0
