#!/usr/bin/env bash
set -euo pipefail

echo "=== Token Budget Guard Integration Test ==="
ERRORS=0

# 1. Test statusline writes usage.json
echo "--- Test: statusline data bridge ---"
USAGE_FILE="$HOME/.claude/usage.json"
BACKUP_FILE="$HOME/.claude/usage.json.bak"
[ -f "$USAGE_FILE" ] && cp "$USAGE_FILE" "$BACKUP_FILE"
rm -f "$USAGE_FILE"

SAMPLE_JSON='{"context_window":{"used_percentage":10,"remaining_percentage":90},"model":{"display_name":"Test"},"worktree":{"name":"","branch":""},"rate_limits":{"five_hour":{"used_percentage":50,"resets_at":9999999999},"seven_day":{"used_percentage":1,"resets_at":9999999999}}}'
echo "$SAMPLE_JSON" | bash "$HOME/.claude/statusline-command.sh" > /dev/null 2>&1

if [ -f "$USAGE_FILE" ]; then
  PCT=$(jq -r '.five_hour_used_pct' "$USAGE_FILE")
  if [ "$PCT" = "50" ]; then
    echo "  PASS: usage.json written with correct 5h percentage"
  else
    echo "  FAIL: expected 50, got $PCT"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo "  FAIL: usage.json not created"
  ERRORS=$((ERRORS + 1))
fi
rm -f "$USAGE_FILE"
[ -f "$BACKUP_FILE" ] && mv "$BACKUP_FILE" "$USAGE_FILE"

# 2. Test config file
echo "--- Test: .settings.chester.json ---"
if [ -f "$HOME/.claude/settings.chester.json" ]; then
  T=$(jq -r '.budget_guard.threshold_percent' "$HOME/.claude/settings.chester.json")
  if [ "$T" = "85" ]; then
    echo "  PASS: config has correct default threshold"
  else
    echo "  FAIL: expected 85, got $T"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo "  FAIL: settings.chester.json missing"
  ERRORS=$((ERRORS + 1))
fi

# 3. Test skill files exist and have guard sections
echo "--- Test: skill modifications ---"
GUARD_SKILLS=(
  "chester-design-figure-out/SKILL.md"
  "chester-design-specify/SKILL.md"
  "chester-plan-build/SKILL.md"
  "chester-finish/SKILL.md"
  "chester-execute-write/SKILL.md"
)

for skill in "${GUARD_SKILLS[@]}"; do
  if grep -q "Budget Guard Check" "$skill" 2>/dev/null; then
    echo "  PASS: $skill has budget guard"
  else
    echo "  FAIL: $skill missing budget guard"
    ERRORS=$((ERRORS + 1))
  fi
done

# 4. Test chester-setup-start has session housekeeping
echo "--- Test: chester-setup-start session housekeeping ---"
if grep -q "Session Housekeeping" "chester-setup-start/SKILL.md" 2>/dev/null; then
  echo "  PASS: chester-setup-start has session housekeeping"
else
  echo "  FAIL: chester-setup-start missing session housekeeping"
  ERRORS=$((ERRORS + 1))
fi

echo ""
if [ "$ERRORS" -gt 0 ]; then
  echo "INTEGRATION: $ERRORS failures"
  exit 1
fi

echo "INTEGRATION: all tests passed"
exit 0
