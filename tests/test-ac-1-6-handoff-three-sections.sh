#!/usr/bin/env bash
# AC-1.6: three-section handoff artifact spec aligned with Optimize Throughput format
set -euo pipefail
FLOW="skills/design-large-task/references/team-interview-flow.md"
ERRORS=0
grep -E -i "problem statement" "$FLOW" > /dev/null || { echo "FAIL: 'Problem Statement' not named"; ERRORS=$((ERRORS+1)); }
grep -E -i "consensus evidence" "$FLOW" > /dev/null || { echo "FAIL: 'Consensus Evidence' not named"; ERRORS=$((ERRORS+1)); }
grep -E -i "exit criteria" "$FLOW" > /dev/null || { echo "FAIL: 'Exit Criteria' not named"; ERRORS=$((ERRORS+1)); }
for t in codebase friction philosophy industry; do
  grep -i "$t" "$FLOW" > /dev/null || { echo "FAIL: evidence type '$t' missing"; ERRORS=$((ERRORS+1)); }
done
grep -E -i "attribut|source pole" "$FLOW" > /dev/null || { echo "FAIL: source-pole attribution rule missing"; ERRORS=$((ERRORS+1)); }
grep -E -i "single sentence|one sentence" "$FLOW" > /dev/null || { echo "FAIL: single-sentence rule missing"; ERRORS=$((ERRORS+1)); }
grep -E -i "ratification" "$FLOW" > /dev/null || { echo "FAIL: ratification section/block missing"; ERRORS=$((ERRORS+1)); }
[ $ERRORS -eq 0 ] && echo "AC-1.6: PASS" || { echo "AC-1.6: $ERRORS check(s) failed"; exit 1; }
