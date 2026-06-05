#!/usr/bin/env bash
# AC-5.1: flow file applies C1/C2 voice discipline markers
set -euo pipefail
FLOW="skills/design-large-task/references/team-interview-flow.md"
ERRORS=0
grep -E "C1.*Externalized Coverage|Externalized Coverage.*C1" "$FLOW" > /dev/null || { echo "FAIL: C1 (Externalized Coverage) not referenced"; ERRORS=$((ERRORS+1)); }
grep -E "C2.*(Fact Default|Fact/Assumption/Opinion)|(Fact Default|Fact/Assumption/Opinion).*C2" "$FLOW" > /dev/null || { echo "FAIL: C2 (Fact Default / Fact-Assumption-Opinion) not referenced"; ERRORS=$((ERRORS+1)); }
grep -E -i "util-design-partner-role" "$FLOW" > /dev/null || { echo "FAIL: util-design-partner-role not referenced"; ERRORS=$((ERRORS+1)); }
[ $ERRORS -eq 0 ] && echo "AC-5.1: PASS" || { echo "AC-5.1: $ERRORS check(s) failed"; exit 1; }
