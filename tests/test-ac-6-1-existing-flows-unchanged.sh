#!/usr/bin/env bash
# AC-6.1: classic-mcp-flow.md, problemfocused-mcp-flow.md, architectural-mcp-flow.md unmodified
set -euo pipefail
ERRORS=0
for flow in classic-mcp-flow.md problemfocused-mcp-flow.md architectural-mcp-flow.md; do
  FLOW="skills/design-large-task/references/${flow}"
  [ -f "$FLOW" ] || { echo "FAIL: $FLOW does not exist"; ERRORS=$((ERRORS+1)); continue; }
  if git diff --quiet main -- "$FLOW"; then
    :
  else
    echo "FAIL: $FLOW differs from main"
    git diff --stat main -- "$FLOW" || true
    ERRORS=$((ERRORS+1))
  fi
done
[ $ERRORS -eq 0 ] && echo "AC-6.1: PASS" || { echo "AC-6.1: $ERRORS check(s) failed"; exit 1; }
