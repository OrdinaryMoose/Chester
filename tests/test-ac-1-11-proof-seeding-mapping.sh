#!/usr/bin/env bash
# AC-1.11: handoff to proof-seeding mapping documented
set -euo pipefail
FLOW="skills/design-large-task/references/team-interview-flow.md"
ERRORS=0
grep -F 'EVIDENCE' "$FLOW" > /dev/null || { echo "FAIL: EVIDENCE element not referenced"; ERRORS=$((ERRORS+1)); }
grep -F 'RULE' "$FLOW" > /dev/null || { echo "FAIL: RULE element not referenced"; ERRORS=$((ERRORS+1)); }
grep -F 'RISK' "$FLOW" > /dev/null || { echo "FAIL: RISK element not referenced"; ERRORS=$((ERRORS+1)); }
grep -E -i "designer.{0,30}authority|ratification.{0,30}designer" "$FLOW" > /dev/null || { echo "FAIL: designer-authority-via-ratification rationale missing"; ERRORS=$((ERRORS+1)); }
for src in '"codebase"' '"industry"' '"friction"' '"designer"'; do
  grep -F "$src" "$FLOW" > /dev/null || { echo "FAIL: source $src not present in mapping"; ERRORS=$((ERRORS+1)); }
done
[ $ERRORS -eq 0 ] && echo "AC-1.11: PASS" || { echo "AC-1.11: $ERRORS check(s) failed"; exit 1; }
