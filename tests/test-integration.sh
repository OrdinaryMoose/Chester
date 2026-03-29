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
if [ -f "$HOME/.claude/.chester/.settings.chester.json" ]; then
  T=$(jq -r '.budget_guard.threshold_percent' "$HOME/.claude/.chester/.settings.chester.json")
  if [ "$T" = "85" ]; then
    echo "  PASS: config has correct default threshold"
  else
    echo "  FAIL: expected 85, got $T"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo "  FAIL: .settings.chester.json missing"
  ERRORS=$((ERRORS + 1))
fi

# 3. Test skill files exist and have guard sections
echo "--- Test: skill modifications ---"
GUARD_SKILLS=(
  "chester-figure-out/SKILL.md"
  "chester-build-spec/SKILL.md"
  "chester-build-plan/SKILL.md"
  "chester-finish-plan/SKILL.md"
  "chester-write-code/SKILL.md"
)

for skill in "${GUARD_SKILLS[@]}"; do
  if grep -q "Budget Guard Check" "$skill" 2>/dev/null; then
    echo "  PASS: $skill has budget guard"
  else
    echo "  FAIL: $skill missing budget guard"
    ERRORS=$((ERRORS + 1))
  fi
done

# 4. Test chester-start-debug exists
echo "--- Test: chester-start-debug ---"
if [ -f "chester-start-debug/SKILL.md" ]; then
  echo "  PASS: debug skill exists"
else
  echo "  FAIL: chester-start-debug/SKILL.md missing"
  ERRORS=$((ERRORS + 1))
fi

# 5. Test chester-start references debug cleanup
echo "--- Test: chester-start debug cleanup ---"
if grep -q "chester-debug.json" "chester-start/SKILL.md" 2>/dev/null; then
  echo "  PASS: chester-start has debug cleanup"
else
  echo "  FAIL: chester-start missing debug cleanup"
  ERRORS=$((ERRORS + 1))
fi

# 6. Test write-code has diagnostic logging
echo "--- Test: write-code diagnostic logging ---"
if grep -q "Diagnostic Logging" "chester-write-code/SKILL.md" 2>/dev/null; then
  echo "  PASS: write-code has diagnostic logging"
else
  echo "  FAIL: write-code missing diagnostic logging"
  ERRORS=$((ERRORS + 1))
fi

echo ""
if [ "$ERRORS" -gt 0 ]; then
  echo "INTEGRATION: $ERRORS failures"
  exit 1
fi

echo "INTEGRATION: all tests passed"
exit 0
