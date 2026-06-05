#!/usr/bin/env bash
# AC-1.5: Round 5 specifies parallel synthesis attacks
set -euo pipefail
FLOW="skills/design-large-task/references/team-interview-flow.md"
ERRORS=0
SECTION=$(awk '/^### Round 5|^## Round 5|## R5/,/^## /' "$FLOW" | sed '$d')
[ -n "$SECTION" ] || { echo "FAIL: Round 5 / Synthesis section missing"; exit 1; }
echo "$SECTION" | grep -E -i "all four|four poles attack" > /dev/null || { echo "FAIL: all-four-poles-attack semantics missing"; ERRORS=$((ERRORS+1)); }
echo "$SECTION" | grep -E -i "parallel" > /dev/null || { echo "FAIL: parallel attack semantics missing in Round 5"; ERRORS=$((ERRORS+1)); }
[ $ERRORS -eq 0 ] && echo "AC-1.5: PASS" || { echo "AC-1.5: $ERRORS check(s) failed"; exit 1; }
