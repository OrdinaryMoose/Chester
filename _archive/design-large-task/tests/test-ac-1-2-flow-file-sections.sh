#!/usr/bin/env bash
# AC-1.2: flow file declares all required structural sections
set -euo pipefail
FLOW="skills/design-large-task/references/team-interview-flow.md"
ERRORS=0

REQUIRED_SECTIONS=(
  "Round Sequence"
  "Per-Round Phases"
  "Transcript Schema"
  "Handoff Artifact"
  "Ratification"
  "Validity"
  "Termination"
  "Resume Protocol"
  "Proof Seeding"
  "Brief-Render Read Shape"
)

for section in "${REQUIRED_SECTIONS[@]}"; do
  if ! grep -q -i "$section" "$FLOW"; then
    echo "FAIL: required section '$section' not found in $FLOW"
    ERRORS=$((ERRORS + 1))
  fi
done

if [ $ERRORS -gt 0 ]; then
  echo "AC-1.2: $ERRORS check(s) failed"
  exit 1
fi
echo "AC-1.2: PASS"
