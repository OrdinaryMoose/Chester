#!/usr/bin/env bash
# AC-5.2: flow file specifies orchestrator-side dispatch/completion printing for pole subagent dispatches
set -euo pipefail
FLOW="skills/design-large-task/references/team-interview-flow.md"
ERRORS=0
grep -E -i "orchestrator.side|dispatch.*completion|completion.*dispatch" "$FLOW" > /dev/null || { echo "FAIL: orchestrator-side dispatch/completion convention not referenced"; ERRORS=$((ERRORS+1)); }
SECTION=$(awk '/^## Per-Round Phases/{f=1;next} /^## /{if(f)exit} f' "$FLOW")
echo "$SECTION" | grep -E -i "dispatch.*completion|completion.*dispatch|orchestrator.side" > /dev/null || { echo "FAIL: dispatch/completion convention not tied to Per-Round Phases pole-dispatch instructions"; ERRORS=$((ERRORS+1)); }
grep -F "2026-03-31" "$FLOW" > /dev/null || { echo "FAIL: source sprint reference (2026-03-31) missing"; ERRORS=$((ERRORS+1)); }
[ $ERRORS -eq 0 ] && echo "AC-5.2: PASS" || { echo "AC-5.2: $ERRORS check(s) failed"; exit 1; }
