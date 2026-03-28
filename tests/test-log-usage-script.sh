#!/usr/bin/env bash
set -euo pipefail

SCRIPT="$HOME/.claude/chester-log-usage.sh"
LOG_FILE="/tmp/test-token-usage-log.md"
DEBUG_FLAG="$HOME/.claude/chester-debug.json"
USAGE_FILE="$HOME/.claude/usage.json"

# Backup existing files
BACKUP_DEBUG=""
BACKUP_USAGE=""
[ -f "$DEBUG_FLAG" ] && BACKUP_DEBUG=$(cat "$DEBUG_FLAG")
[ -f "$USAGE_FILE" ] && BACKUP_USAGE=$(cat "$USAGE_FILE")

cleanup() {
  rm -f "$LOG_FILE"
  if [ -n "$BACKUP_DEBUG" ]; then echo "$BACKUP_DEBUG" > "$DEBUG_FLAG"; else rm -f "$DEBUG_FLAG"; fi
  if [ -n "$BACKUP_USAGE" ]; then echo "$BACKUP_USAGE" > "$USAGE_FILE"; else rm -f "$USAGE_FILE"; fi
}
trap cleanup EXIT

ERRORS=0

# --- Test 0: Script exists and is executable ---
if [ ! -f "$SCRIPT" ]; then
  echo "FAIL: $SCRIPT does not exist"
  exit 1
fi
if [ ! -x "$SCRIPT" ]; then
  echo "FAIL: $SCRIPT is not executable"
  ERRORS=$((ERRORS + 1))
fi

# --- Test 1: No output when debug flag is missing ---
rm -f "$DEBUG_FLAG" "$LOG_FILE"
cat <<EOF > "$USAGE_FILE"
{"five_hour_used_pct": 40, "five_hour_resets_at": 9999999999, "context_used_pct": 5, "context_remaining_pct": 95, "timestamp": $(date +%s)}
EOF

RESULT=$("$SCRIPT" before "test-section" "test-step" "$LOG_FILE" 2>&1)
if [ -f "$LOG_FILE" ]; then
  echo "FAIL: log file created when debug flag is missing"
  ERRORS=$((ERRORS + 1))
else
  echo "PASS: no logging when debug flag absent"
fi

# --- Test 2: Logs correctly when debug flag is set ---
cat <<EOF > "$DEBUG_FLAG"
{"mode": "diagnostic", "session_start": $(date +%s)}
EOF

BEFORE_OUT=$("$SCRIPT" before "build-plan" "attack-plan dispatch" "$LOG_FILE" 2>&1)
# Simulate some work (update usage)
cat <<EOF > "$USAGE_FILE"
{"five_hour_used_pct": 45, "five_hour_resets_at": 9999999999, "context_used_pct": 8, "context_remaining_pct": 92, "timestamp": $(date +%s)}
EOF
AFTER_OUT=$("$SCRIPT" after "build-plan" "attack-plan dispatch" "$LOG_FILE" 2>&1)

if [ ! -f "$LOG_FILE" ]; then
  echo "FAIL: log file not created"
  ERRORS=$((ERRORS + 1))
else
  # Check header exists
  if ! grep -q "Token Usage Log" "$LOG_FILE"; then
    echo "FAIL: log missing header"
    ERRORS=$((ERRORS + 1))
  else
    echo "PASS: log has header"
  fi
  # Check row was appended with before/after values
  if grep -q "build-plan" "$LOG_FILE" && grep -q "attack-plan dispatch" "$LOG_FILE"; then
    echo "PASS: log has correct section and step"
  else
    echo "FAIL: log missing section/step data"
    ERRORS=$((ERRORS + 1))
  fi
  # Check delta was computed
  if grep -q "+5" "$LOG_FILE"; then
    echo "PASS: log has correct delta"
  else
    echo "FAIL: log missing or incorrect delta"
    cat "$LOG_FILE"
    ERRORS=$((ERRORS + 1))
  fi
fi

# --- Test 3: Stale debug flag is ignored ---
rm -f "$LOG_FILE"
STALE_TS=$(($(date +%s) - 50000))
cat <<EOF > "$DEBUG_FLAG"
{"mode": "diagnostic", "session_start": $STALE_TS}
EOF

"$SCRIPT" before "test" "test" "$LOG_FILE" 2>&1
if [ -f "$LOG_FILE" ]; then
  echo "FAIL: log created for stale debug flag"
  ERRORS=$((ERRORS + 1))
else
  echo "PASS: stale debug flag ignored"
fi

# --- Test 4: Pipeline skills reference the script ---
SKILLS=(
  "chester-figure-out/SKILL.md"
  "chester-build-spec/SKILL.md"
  "chester-build-plan/SKILL.md"
  "chester-finish-plan/SKILL.md"
  "chester-write-code/SKILL.md"
)

for skill in "${SKILLS[@]}"; do
  if grep -q "chester-log-usage.sh" "$skill" 2>/dev/null; then
    echo "PASS: $skill references logging script"
  else
    echo "FAIL: $skill does not reference logging script"
    ERRORS=$((ERRORS + 1))
  fi
done

echo ""
if [ "$ERRORS" -gt 0 ]; then
  echo "FAIL: $ERRORS errors"
  exit 1
fi

echo "PASS: all logging tests passed"
exit 0
