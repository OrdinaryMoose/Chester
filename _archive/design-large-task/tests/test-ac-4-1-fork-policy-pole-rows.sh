#!/usr/bin/env bash
# AC-4.1: docs/fork-policy.md documents pole subagent dispatch sites
set -euo pipefail
POLICY="docs/fork-policy.md"
ERRORS=0
for pole in innovator conservator purist pragmatist; do
  AGENT_REF="chester:design-large-task-step-b-${pole}"
  grep -F "$AGENT_REF" "$POLICY" > /dev/null || { echo "FAIL: $POLICY does not document $AGENT_REF dispatch"; ERRORS=$((ERRORS+1)); }
done
ROW_COUNT=$(grep -c 'step-b' "$POLICY" || true)
[ "$ROW_COUNT" -ge 4 ] || { echo "FAIL: expected >=4 rows mentioning step-b, found $ROW_COUNT"; ERRORS=$((ERRORS+1)); }
grep -E -i "framing.side|framing-side|framing dispatch" "$POLICY" > /dev/null || { echo "FAIL: framing-side rationale not present"; ERRORS=$((ERRORS+1)); }
[ $ERRORS -eq 0 ] && echo "AC-4.1: PASS" || { echo "AC-4.1: $ERRORS check(s) failed"; exit 1; }
