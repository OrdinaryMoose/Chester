#!/usr/bin/env bash
set -euo pipefail
echo "=== Config Read (New Locations) Test ==="
ERRORS=0
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT="$SCRIPT_DIR/chester-hooks/chester-config-read.sh"

# Isolate from real HOME to avoid touching user's actual config
TMPDIR=$(mktemp -d)
REAL_HOME="$HOME"
export HOME="$TMPDIR/fakehome"
mkdir -p "$HOME/.claude"
trap 'rm -rf "$TMPDIR"; export HOME="$REAL_HOME"' EXIT
cd "$TMPDIR"
git init -q

# Test 1: No config → hardcoded defaults
echo "--- Test: no config returns defaults ---"
OUTPUT=$(bash "$SCRIPT" 2>/dev/null)
if echo "$OUTPUT" | grep -q "CHESTER_WORK_DIR='docs/chester/working'"; then
  echo "  PASS: default CHESTER_WORK_DIR"
else
  echo "  FAIL: expected docs/chester/working"
  echo "  GOT: $OUTPUT"
  ERRORS=$((ERRORS + 1))
fi
if echo "$OUTPUT" | grep -q "CHESTER_PLANS_DIR='docs/chester/plans'"; then
  echo "  PASS: default CHESTER_PLANS_DIR"
else
  echo "  FAIL: expected docs/chester/plans"
  echo "  GOT: $OUTPUT"
  ERRORS=$((ERRORS + 1))
fi
if echo "$OUTPUT" | grep -q "CHESTER_CONFIG_PATH='none'"; then
  echo "  PASS: config path is none"
else
  echo "  FAIL: expected config path none"
  ERRORS=$((ERRORS + 1))
fi

# Test 2: User-level config only (writes to fake HOME)
echo "--- Test: user-level config only ---"
mkdir -p "$HOME/.claude/.chester"
cat > "$HOME/.claude/.chester/.settings.chester.json" << 'CONF'
{"working_dir": "custom/working", "plans_dir": "custom/plans", "budget_guard": {"threshold_percent": 90, "enabled": true}}
CONF
OUTPUT=$(bash "$SCRIPT" 2>/dev/null)
if echo "$OUTPUT" | grep -q "CHESTER_WORK_DIR='custom/working'"; then
  echo "  PASS: user-level working_dir"
else
  echo "  FAIL: expected custom/working"
  ERRORS=$((ERRORS + 1))
fi
if echo "$OUTPUT" | grep -q "CHESTER_PLANS_DIR='custom/plans'"; then
  echo "  PASS: user-level plans_dir"
else
  echo "  FAIL: expected custom/plans"
  ERRORS=$((ERRORS + 1))
fi

# Test 3: Project-level overrides user-level (deep merge)
echo "--- Test: project overrides user (deep merge) ---"
mkdir -p "$TMPDIR/.chester"
cat > "$TMPDIR/.chester/.settings.chester.local.json" << 'CONF'
{"working_dir": "project/working"}
CONF
OUTPUT=$(bash "$SCRIPT" 2>/dev/null)
if echo "$OUTPUT" | grep -q "CHESTER_WORK_DIR='project/working'"; then
  echo "  PASS: project overrides working_dir"
else
  echo "  FAIL: expected project/working"
  ERRORS=$((ERRORS + 1))
fi
if echo "$OUTPUT" | grep -q "CHESTER_PLANS_DIR='custom/plans'"; then
  echo "  PASS: user plans_dir inherited (not overridden)"
else
  echo "  FAIL: expected custom/plans inherited"
  ERRORS=$((ERRORS + 1))
fi

# No cleanup needed — fake HOME is removed by trap

echo ""
if [ "$ERRORS" -gt 0 ]; then
  echo "CONFIG-READ: $ERRORS failures"
  exit 1
fi
echo "CONFIG-READ: all tests passed"
exit 0
