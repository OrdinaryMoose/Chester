#!/usr/bin/env bash
set -euo pipefail

# Verifies that the chester-decision-record MCP is registered in the plugin
# manifest so Claude Code can spawn it at session start. Registration makes
# the MCP available to execute-write, plan-build, execute-verify-complete,
# and finish-write-records per spec-05 §Modified Existing Skills.

MANIFEST=".claude-plugin/mcp.json"
ERRORS=0

fail() {
  echo "FAIL: $1" >&2
  ERRORS=$((ERRORS + 1))
}

if [ ! -f "$MANIFEST" ]; then
  fail "manifest not found at $MANIFEST"
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "SKIP: jq not installed — cannot validate manifest structure" >&2
  exit 0
fi

# The manifest must parse as JSON.
if ! jq empty "$MANIFEST" 2>/dev/null; then
  fail "manifest is not valid JSON"
  exit 1
fi

# Entry must exist under mcpServers.chester-decision-record.
if ! jq -e '.mcpServers["chester-decision-record"]' "$MANIFEST" >/dev/null; then
  fail "mcpServers.chester-decision-record entry missing"
fi

# Command must be "node".
CMD=$(jq -r '.mcpServers["chester-decision-record"].command // empty' "$MANIFEST")
if [ "$CMD" != "node" ]; then
  fail "expected command=node, got: $CMD"
fi

# Args[0] must point to the MCP server at the canonical path.
ARG0=$(jq -r '.mcpServers["chester-decision-record"].args[0] // empty' "$MANIFEST")
EXPECTED='${CLAUDE_PLUGIN_ROOT}/mcp/chester-decision-record/server.js'
if [ "$ARG0" != "$EXPECTED" ]; then
  fail "expected args[0]=$EXPECTED, got: $ARG0"
fi

if [ $ERRORS -gt 0 ]; then
  echo "FAIL: $ERRORS error(s)"
  exit 1
fi

echo "PASS: chester-decision-record MCP registered correctly"
