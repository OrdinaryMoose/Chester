#!/usr/bin/env bash
set -euo pipefail

ERRORS=0

SCHEMA="skills/util-artifact-schema/SKILL.md"

if [ ! -f "$SCHEMA" ]; then
  echo "FAIL: $SCHEMA does not exist"
  exit 1
fi

# (a) documents spec-skeleton as a new artifact type
if ! grep -q '`spec-skeleton`' "$SCHEMA"; then
  echo "FAIL: $SCHEMA does not mention \`spec-skeleton\` artifact type"
  ERRORS=$((ERRORS + 1))
fi

# (b) documents the skeleton-manifest filename pattern
if ! grep -q 'spec-skeleton-{nn}' "$SCHEMA"; then
  echo "FAIL: $SCHEMA does not document filename pattern 'spec-skeleton-{nn}'"
  ERRORS=$((ERRORS + 1))
fi

# (c) mentions both design-specify (producer) and execute-write (consumer)
# in the context of the spec-skeleton row. Locate the row and check within it.
ROW=$(grep -n '`spec-skeleton`' "$SCHEMA" | head -n 1 | cut -d: -f1 || true)
if [ -z "$ROW" ]; then
  echo "FAIL: could not locate spec-skeleton row for producer/consumer check"
  ERRORS=$((ERRORS + 1))
else
  ROW_CONTENT=$(sed -n "${ROW}p" "$SCHEMA")
  if ! echo "$ROW_CONTENT" | grep -q 'design-specify'; then
    echo "FAIL: spec-skeleton row does not mention design-specify (producer)"
    ERRORS=$((ERRORS + 1))
  fi
  if ! echo "$ROW_CONTENT" | grep -q 'execute-write'; then
    echo "FAIL: spec-skeleton row does not mention execute-write (consumer)"
    ERRORS=$((ERRORS + 1))
  fi
fi

# (d) row is under the spec/ directory
if [ -n "${ROW:-}" ]; then
  ROW_CONTENT=$(sed -n "${ROW}p" "$SCHEMA")
  if ! echo "$ROW_CONTENT" | grep -q '`spec/`'; then
    echo "FAIL: spec-skeleton row does not list directory as \`spec/\`"
    ERRORS=$((ERRORS + 1))
  fi
fi

if [ "$ERRORS" -gt 0 ]; then
  echo "FAIL: $ERRORS errors in skeleton-manifest path convention"
  exit 1
fi

echo "PASS: skeleton-manifest path convention documented in util-artifact-schema"
exit 0
