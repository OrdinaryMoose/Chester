#!/usr/bin/env bash
set -euo pipefail

TPL="skills/design-large-task/references/design-brief-template.md"
ERRORS=0

# Required eight sections, in order. Architecture choice (Chosen Approach,
# Alternatives Considered) moved to design-specify; brief is envelope-only.
REQUIRED_SECTIONS=(
  "## Goal"
  "## Necessary Conditions"
  "## Rules"
  "## Permissions"
  "## Evidence"
  "## Industry Context"
  "## Risks"
  "## Acceptance Criteria"
)

for section in "${REQUIRED_SECTIONS[@]}"; do
  if ! grep -qF "$section" "$TPL"; then
    echo "FAIL: $TPL missing required section: $section"
    ERRORS=$((ERRORS + 1))
  fi
done

# Sections must appear in order
prev_line=0
for section in "${REQUIRED_SECTIONS[@]}"; do
  line=$(grep -nF "$section" "$TPL" | head -1 | cut -d: -f1)
  if [ -z "$line" ]; then continue; fi
  if [ "$line" -le "$prev_line" ]; then
    echo "FAIL: section order violated at: $section (line $line, prev line $prev_line)"
    ERRORS=$((ERRORS + 1))
  fi
  prev_line=$line
done

# design-specify is the consumer of the brief and is referenced intentionally.
# Only design-figure-out remains archived.
for archived in "design-figure-out"; do
  if grep -q "$archived" "$TPL"; then
    echo "FAIL: $TPL still references archived skill: $archived"
    ERRORS=$((ERRORS + 1))
  fi
done

# Brief must reference design-specify as the consumer (self-containment test
# is now framed against design-specify, not plan-build)
if ! grep -q "design-specify" "$TPL"; then
  echo "FAIL: $TPL does not reference design-specify (the brief's consumer)"
  ERRORS=$((ERRORS + 1))
fi

# Line-count sanity — target is roughly 250 lines, allow 180-320 range
line_count=$(wc -l < "$TPL")
if [ "$line_count" -gt 320 ]; then
  echo "FAIL: $TPL has $line_count lines; target <=320 (refactor under-trimmed)"
  ERRORS=$((ERRORS + 1))
fi
if [ "$line_count" -lt 180 ]; then
  echo "FAIL: $TPL has $line_count lines; target >=180 (refactor over-trimmed)"
  ERRORS=$((ERRORS + 1))
fi

if [ "$ERRORS" -gt 0 ]; then
  echo "FAIL: $ERRORS errors in brief template structure"
  exit 1
fi

echo "PASS: brief template structure correct"
exit 0
