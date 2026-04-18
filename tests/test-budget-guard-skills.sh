#!/usr/bin/env bash
set -euo pipefail

SKILLS=(
  "skills/design-experimental/SKILL.md"
  "skills/design-small-task/SKILL.md"
  "skills/plan-build/SKILL.md"
  "skills/execute-write/SKILL.md"
)

ERRORS=0

for skill in "${SKILLS[@]}"; do
  # Skill satisfies budget-guard requirement if it either:
  #   (a) has its own Budget Guard section + util-budget-guard reference, or
  #   (b) calls start-bootstrap (which runs util-budget-guard internally)
  has_own_guard=false
  calls_bootstrap=false

  if grep -q -i "budget guard" "$skill" && grep -q "util-budget-guard" "$skill"; then
    has_own_guard=true
  fi
  if grep -q "start-bootstrap" "$skill"; then
    calls_bootstrap=true
  fi

  if ! $has_own_guard && ! $calls_bootstrap; then
    echo "FAIL: $skill missing budget guard (no direct call, no start-bootstrap delegation)"
    ERRORS=$((ERRORS + 1))
  fi
done

# Verify util-budget-guard itself holds the implementation details
GUARD_IMPL="skills/util-budget-guard/SKILL.md"
if ! grep -q "usage.json" "$GUARD_IMPL"; then
  echo "FAIL: $GUARD_IMPL does not reference usage.json"
  ERRORS=$((ERRORS + 1))
fi
if ! grep -q -i "threshold" "$GUARD_IMPL"; then
  echo "FAIL: $GUARD_IMPL does not reference threshold"
  ERRORS=$((ERRORS + 1))
fi

if [ "$ERRORS" -gt 0 ]; then
  echo "FAIL: $ERRORS errors across pipeline skills"
  exit 1
fi

echo "PASS: all pipeline skills call util-budget-guard"
exit 0
