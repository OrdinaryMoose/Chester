#!/usr/bin/env bash
set -euo pipefail

SKILL="chester-setup-start/SKILL.md"

# Verify chester-setup-start has session housekeeping
if ! grep -q "Session Housekeeping" "$SKILL"; then
  echo "FAIL: chester-setup-start missing Session Housekeeping"
  exit 1
fi

echo "PASS: chester-setup-start has session housekeeping"
exit 0
