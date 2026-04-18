#!/usr/bin/env bash
set -euo pipefail

SKILL="skills/design-experimental/SKILL.md"
ERRORS=0

# Frontmatter description must not contain "experimental" or "fork"
DESC=$(awk '/^description:/,/^---$/' "$SKILL" | head -20)
for word in "experimental" "fork"; do
  if echo "$DESC" | grep -q -i "$word"; then
    echo "FAIL: frontmatter description contains forbidden word: $word"
    ERRORS=$((ERRORS + 1))
  fi
done

# Must not reference archived design-figure-out
if grep -q "design-figure-out" "$SKILL"; then
  echo "FAIL: $SKILL still references archived design-figure-out"
  ERRORS=$((ERRORS + 1))
fi

# Must define the two named boundaries
for boundary in "Envelope Handoff" "Artifact Handoff"; do
  if ! grep -q "$boundary" "$SKILL"; then
    echo "FAIL: $SKILL missing boundary: $boundary"
    ERRORS=$((ERRORS + 1))
  fi
done

# Must have Finalization and Archival stage sections
for stage in "Finalization" "Archival"; do
  if ! grep -q "## $stage\|### $stage\|# $stage" "$SKILL"; then
    echo "FAIL: $SKILL missing stage section: $stage"
    ERRORS=$((ERRORS + 1))
  fi
done

# Must transition to plan-build, not design-specify
if grep -q "Transitions to:.*design-specify\|transition to design-specify\|transition to \`design-specify\`" "$SKILL"; then
  echo "FAIL: $SKILL still transitions to design-specify"
  ERRORS=$((ERRORS + 1))
fi
if ! grep -q "Transitions to:.*plan-build\|transition to plan-build\|transition to \`plan-build\`" "$SKILL"; then
  echo "FAIL: $SKILL does not transition to plan-build"
  ERRORS=$((ERRORS + 1))
fi

# Must reference the five-step Finalization procedure
for step in "Dispatch" "Aggregate" "Recommend" "Reconcile" "Close"; do
  if ! grep -q "$step" "$SKILL"; then
    echo "FAIL: $SKILL missing Finalization step: $step"
    ERRORS=$((ERRORS + 1))
  fi
done

# Must mention ground-truth report as a produced artifact
if ! grep -q -i "ground-truth" "$SKILL"; then
  echo "FAIL: $SKILL does not reference ground-truth report"
  ERRORS=$((ERRORS + 1))
fi

# Must mention three architects with trade-off lenses
for lens in "minimal" "clean" "pragmatic"; do
  if ! grep -q -i "$lens" "$SKILL"; then
    echo "FAIL: $SKILL missing architect lens: $lens"
    ERRORS=$((ERRORS + 1))
  fi
done

if [ "$ERRORS" -gt 0 ]; then
  echo "FAIL: $ERRORS errors in design-experimental"
  exit 1
fi

echo "PASS: design-experimental Finalization stage structure correct"
exit 0
