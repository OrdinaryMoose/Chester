#!/usr/bin/env bash
# Verify no subagent definition invokes chester-trailer-write
set -euo pipefail
ERRORS=0
fail() { echo "FAIL: $1" >&2; ERRORS=$((ERRORS + 1)); }

# Walk all subagent definitions under agents/, fail if any invoke the helper
if grep -rl 'chester-trailer-write' agents/ 2>/dev/null; then
  echo "FAIL: subagent(s) above invoke chester-trailer-write — D4 violated" >&2
  ERRORS=$((ERRORS + 1))
fi

if [ "$ERRORS" -gt 0 ]; then echo "FAIL: $ERRORS"; exit 1; fi
echo "PASS: no subagent invokes chester-trailer-write"
