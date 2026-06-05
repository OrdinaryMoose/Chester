#!/usr/bin/env bash
# AC-1.12: brief-render read shape specified
set -euo pipefail
FLOW="skills/design-large-task/references/team-interview-flow.md"
ERRORS=0
grep -E -i "Brief.Render Read Shape|brief render" "$FLOW" > /dev/null || { echo "FAIL: Brief-Render Read Shape section missing"; ERRORS=$((ERRORS+1)); }
grep -E -i "process.evidence|process evidence" "$FLOW" > /dev/null || { echo "FAIL: process-evidence read source not stated"; ERRORS=$((ERRORS+1)); }
grep -E -i "no .{0,10}MCP state|no understanding state|absence of" "$FLOW" > /dev/null || { echo "FAIL: state-file-absence note missing"; ERRORS=$((ERRORS+1)); }
[ $ERRORS -eq 0 ] && echo "AC-1.12: PASS" || { echo "AC-1.12: $ERRORS check(s) failed"; exit 1; }
