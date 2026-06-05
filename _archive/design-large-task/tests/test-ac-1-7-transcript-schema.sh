#!/usr/bin/env bash
# AC-1.7: per-round transcript schema is specified
set -euo pipefail
FLOW="skills/design-large-task/references/team-interview-flow.md"
ERRORS=0
for field in "opening argument" "opposing arguments" "counter-arguments" "idea collapse" "recommendation"; do
  grep -i "$field" "$FLOW" > /dev/null || { echo "FAIL: transcript field '$field' missing"; ERRORS=$((ERRORS+1)); }
done
[ $ERRORS -eq 0 ] && echo "AC-1.7: PASS" || { echo "AC-1.7: $ERRORS check(s) failed"; exit 1; }
