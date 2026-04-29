#!/usr/bin/env bash
# AC-2.1: four pole agent files exist at canonical paths
set -euo pipefail
ERRORS=0
for pole in innovator conservator purist pragmatist; do
  AGENT="agents/design-large-task-step-b-${pole}.md"
  if [ ! -f "$AGENT" ]; then
    echo "FAIL: $AGENT does not exist"
    ERRORS=$((ERRORS+1))
  fi
done
[ $ERRORS -eq 0 ] && echo "AC-2.1: PASS" || { echo "AC-2.1: $ERRORS check(s) failed"; exit 1; }
