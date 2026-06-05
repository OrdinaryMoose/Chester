#!/usr/bin/env bash
# AC-2.4: pole agents enforce Understand-Stage prohibitions
set -euo pipefail
ERRORS=0
for pole in innovator conservator purist pragmatist; do
  AGENT="agents/design-large-task-step-b-${pole}.md"
  [ -f "$AGENT" ] || { echo "FAIL: $AGENT missing"; ERRORS=$((ERRORS+1)); continue; }
  grep -E -i "no solutions|no design alternatives|no architecture suggestions|problem.statement only|Understand.Stage" "$AGENT" > /dev/null || { echo "FAIL: $AGENT does not prohibit solution language / design alternatives"; ERRORS=$((ERRORS+1)); }
done
[ $ERRORS -eq 0 ] && echo "AC-2.4: PASS" || { echo "AC-2.4: $ERRORS check(s) failed"; exit 1; }
