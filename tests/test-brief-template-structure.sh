#!/usr/bin/env bash
set -euo pipefail

TPL="skills/util-design-brief-template/SKILL.md"
ERRORS=0

# Required nine sections, in order
REQUIRED_SECTIONS=(
  "## Goal"
  "## Necessary Conditions"
  "## Rules"
  "## Permissions"
  "## Evidence"
  "## Chosen Approach"
  "## Alternatives Considered"
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

# Must not reference archived skills
for archived in "design-figure-out" "design-specify"; do
  if grep -q "$archived" "$TPL"; then
    echo "FAIL: $TPL still references archived skill: $archived"
    ERRORS=$((ERRORS + 1))
  fi
done

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
