#!/usr/bin/env bash
# AC-1.8: validity-test checklist is specified
set -euo pipefail
FLOW="skills/design-large-task/references/team-interview-flow.md"
ERRORS=0
for category in structural grounding survival handoff; do
  grep -E -i "${category}" "$FLOW" > /dev/null || { echo "FAIL: validity category '$category' missing"; ERRORS=$((ERRORS+1)); }
done
grep -E -i "Validity[ -]Test" "$FLOW" > /dev/null || { echo "FAIL: 'Validity-Test' heading missing"; ERRORS=$((ERRORS+1)); }
[ $ERRORS -eq 0 ] && echo "AC-1.8: PASS" || { echo "AC-1.8: $ERRORS check(s) failed"; exit 1; }
