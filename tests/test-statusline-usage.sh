#!/usr/bin/env bash
# Test: statusline-command.sh writes usage.json with correct values
set -euo pipefail

SCRIPT="$HOME/.claude/statusline-command.sh"
USAGE_FILE="$HOME/.claude/usage.json"
BACKUP_FILE="$HOME/.claude/usage.json.bak"

# Backup existing usage.json if present
[ -f "$USAGE_FILE" ] && cp "$USAGE_FILE" "$BACKUP_FILE"

# Remove to start clean
rm -f "$USAGE_FILE"

# Sample JSON matching what Claude Code harness provides
SAMPLE_JSON='{
  "context_window": {"used_percentage": 4.2, "remaining_percentage": 95.8},
  "model": {"display_name": "Opus 4.6 (1M context)"},
  "worktree": {"name": "", "branch": ""},
  "rate_limits": {
    "five_hour": {"used_percentage": 42.5, "resets_at": 9999999999},
    "seven_day": {"used_percentage": 2.1, "resets_at": 9999999999}
  }
}'

# Pipe sample JSON to the statusline script (suppress display output)
echo "$SAMPLE_JSON" | bash "$SCRIPT" > /dev/null 2>&1

# Verify usage.json was created
if [ ! -f "$USAGE_FILE" ]; then
  echo "FAIL: $USAGE_FILE was not created"
  [ -f "$BACKUP_FILE" ] && mv "$BACKUP_FILE" "$USAGE_FILE"
  exit 1
fi

# Verify values
FIVE_PCT=$(jq -r '.five_hour_used_pct' "$USAGE_FILE")
CTX_PCT=$(jq -r '.context_used_pct' "$USAGE_FILE")
TIMESTAMP=$(jq -r '.timestamp' "$USAGE_FILE")

ERRORS=0

if [ "$FIVE_PCT" != "43" ] && [ "$FIVE_PCT" != "42" ]; then
  echo "FAIL: five_hour_used_pct expected ~42-43, got $FIVE_PCT"
  ERRORS=$((ERRORS + 1))
fi

if [ "$CTX_PCT" != "4" ]; then
  echo "FAIL: context_used_pct expected 4, got $CTX_PCT"
  ERRORS=$((ERRORS + 1))
fi

if [ "$TIMESTAMP" = "null" ] || [ "$TIMESTAMP" = "0" ] || [ -z "$TIMESTAMP" ]; then
  echo "FAIL: timestamp not set"
  ERRORS=$((ERRORS + 1))
fi

# Restore backup
rm -f "$USAGE_FILE"
[ -f "$BACKUP_FILE" ] && mv "$BACKUP_FILE" "$USAGE_FILE"

if [ "$ERRORS" -gt 0 ]; then
  echo "FAIL: $ERRORS errors"
  exit 1
fi

echo "PASS: usage.json written correctly"
exit 0
