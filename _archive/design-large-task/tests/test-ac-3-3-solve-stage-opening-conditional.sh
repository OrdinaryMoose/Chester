#!/usr/bin/env bash
# AC-3.3: SKILL.md Solve Stage opening reconciles team-ratified statement
set -euo pipefail
SKILL="skills/design-large-task/SKILL.md"
ERRORS=0
grep -E -i 'Solve Stage Opening' "$SKILL" > /dev/null || { echo "FAIL: Solve Stage Opening section missing"; ERRORS=$((ERRORS+1)); }
grep -E -i 'team.ratif|team consensus' "$SKILL" > /dev/null || { echo "FAIL: team-ratified-statement reconciliation note missing"; ERRORS=$((ERRORS+1)); }
grep -E -i 'confirm or revise|single confirmation' "$SKILL" > /dev/null || { echo "FAIL: single-confirmation prompt language missing"; ERRORS=$((ERRORS+1)); }
[ $ERRORS -eq 0 ] && echo "AC-3.3: PASS" || { echo "AC-3.3: $ERRORS check(s) failed"; exit 1; }
