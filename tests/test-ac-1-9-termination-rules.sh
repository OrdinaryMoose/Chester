#!/usr/bin/env bash
# AC-1.9: termination and stage-failure rules are specified
set -euo pipefail
FLOW="skills/design-large-task/references/team-interview-flow.md"
ERRORS=0
grep -E -i "3\+|three or more|3 or more" "$FLOW" > /dev/null || { echo "FAIL: '3+ statements dead' rule missing"; ERRORS=$((ERRORS+1)); }
grep -E -i "all four (dead|die|killed|fail)" "$FLOW" > /dev/null || { echo "FAIL: 'all four dead → stage failure' rule missing"; ERRORS=$((ERRORS+1)); }
grep -E -i "escalat|stage failure" "$FLOW" > /dev/null || { echo "FAIL: escalation language missing"; ERRORS=$((ERRORS+1)); }
[ $ERRORS -eq 0 ] && echo "AC-1.9: PASS" || { echo "AC-1.9: $ERRORS check(s) failed"; exit 1; }
