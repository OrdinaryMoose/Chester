#!/usr/bin/env bash
set -euo pipefail

INDEX="skills/setup-start/references/skill-index.md"
ERRORS=0
fail() { echo "FAIL: $1" >&2; ERRORS=$((ERRORS + 1)); }

if ! grep -q "chester-decision-record" "$INDEX"; then
  fail "$INDEX missing chester-decision-record MCP reference"
fi
if ! grep -qi "capture.*propagation\|propagation.*capture\|prospective capture" "$INDEX"; then
  fail "$INDEX does not describe the MCP's capture/propagation role"
fi
if ! grep -qi "persistence\|persistent" "$INDEX"; then
  fail "$INDEX does not describe the MCP's persistence role"
fi

if [ $ERRORS -gt 0 ]; then
  echo "FAIL: $ERRORS error(s)"
  exit 1
fi

echo "PASS: skill-index references chester-decision-record MCP"
