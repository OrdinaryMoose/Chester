#!/usr/bin/env bash
set -euo pipefail

CONFIG="$HOME/.claude/.chester/.settings.chester.json"

if [ ! -f "$CONFIG" ]; then
  echo "FAIL: .settings.chester.json does not exist"
  exit 1
fi

THRESHOLD=$(jq -r '.budget_guard.threshold_percent' "$CONFIG")
ENABLED=$(jq -r '.budget_guard.enabled' "$CONFIG")

ERRORS=0

if [ "$THRESHOLD" != "85" ]; then
  echo "FAIL: threshold_percent expected 85, got $THRESHOLD"
  ERRORS=$((ERRORS + 1))
fi

if [ "$ENABLED" != "true" ]; then
  echo "FAIL: enabled expected true, got $ENABLED"
  ERRORS=$((ERRORS + 1))
fi

if [ "$ERRORS" -gt 0 ]; then
  echo "FAIL: $ERRORS errors"
  exit 1
fi

echo "PASS: .settings.chester.json valid"
exit 0
