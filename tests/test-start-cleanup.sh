#!/usr/bin/env bash
set -euo pipefail

SKILL="skills/setup-start/SKILL.md"

# Verify setup-start has session housekeeping
if ! grep -q "Session Housekeeping" "$SKILL"; then
  echo "FAIL: setup-start missing Session Housekeeping"
  exit 1
fi

echo "PASS: setup-start has session housekeeping"
exit 0
