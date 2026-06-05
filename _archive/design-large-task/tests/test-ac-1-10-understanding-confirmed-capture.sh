#!/usr/bin/env bash
# AC-1.10: understanding-confirmed thought capture step specified
set -euo pipefail
FLOW="skills/design-large-task/references/team-interview-flow.md"
ERRORS=0
grep -F 'understanding-confirmed' "$FLOW" > /dev/null || { echo "FAIL: understanding-confirmed tag not present"; ERRORS=$((ERRORS+1)); }
grep -F 'capture_thought' "$FLOW" > /dev/null || { echo "FAIL: capture_thought call not specified"; ERRORS=$((ERRORS+1)); }
grep -E -i "round 5|R5" "$FLOW" > /dev/null && \
  awk '/round 5|R5/,/^## /I' "$FLOW" | grep -F 'understanding-confirmed' > /dev/null \
  || { echo "FAIL: understanding-confirmed not tied to Round 5 ratification"; ERRORS=$((ERRORS+1)); }
[ $ERRORS -eq 0 ] && echo "AC-1.10: PASS" || { echo "AC-1.10: $ERRORS check(s) failed"; exit 1; }
