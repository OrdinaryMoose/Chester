#!/usr/bin/env bash
# AC-2.2: each pole agent has frontmatter with required fields
set -euo pipefail
ERRORS=0
for pole in innovator conservator purist pragmatist; do
  AGENT="agents/design-large-task-step-b-${pole}.md"
  [ -f "$AGENT" ] || { echo "FAIL: $AGENT missing (precondition for AC-2.2)"; ERRORS=$((ERRORS+1)); continue; }
  head -n 1 "$AGENT" | grep -q '^---$' || { echo "FAIL: $AGENT does not start with frontmatter delimiter"; ERRORS=$((ERRORS+1)); }
  for key in name description tools model; do
    grep -E "^${key}:" "$AGENT" > /dev/null || { echo "FAIL: $AGENT missing key '${key}'"; ERRORS=$((ERRORS+1)); }
  done
  EXPECTED="design-large-task-step-b-${pole}"
  grep -E "^name:[[:space:]]*${EXPECTED}" "$AGENT" > /dev/null || { echo "FAIL: $AGENT name does not match '${EXPECTED}'"; ERRORS=$((ERRORS+1)); }
done
[ $ERRORS -eq 0 ] && echo "AC-2.2: PASS" || { echo "AC-2.2: $ERRORS check(s) failed"; exit 1; }
