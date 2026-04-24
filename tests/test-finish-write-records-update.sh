#!/usr/bin/env bash
set -euo pipefail

SKILL="skills/finish-write-records/SKILL.md"
ERRORS=0
fail() { echo "FAIL: $1" >&2; ERRORS=$((ERRORS + 1)); }

if ! grep -q "dr_audit" "$SKILL"; then
  fail "$SKILL does not invoke dr_audit at sprint close"
fi
if ! grep -q "dr_abandon" "$SKILL"; then
  fail "$SKILL does not invoke dr_abandon at abandon path"
fi
if ! grep -qi "Decision-Record Audit" "$SKILL"; then
  fail "$SKILL does not declare Decision-Record Audit session-summary section"
fi
if ! grep -qi "chester-decision-record" "$SKILL"; then
  fail "$SKILL does not reference the chester-decision-record MCP"
fi

if [ $ERRORS -gt 0 ]; then
  echo "FAIL: $ERRORS error(s)"
  exit 1
fi

echo "PASS: finish-write-records invokes dr_audit + dr_abandon correctly"
