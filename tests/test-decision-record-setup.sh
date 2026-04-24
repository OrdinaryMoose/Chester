#!/usr/bin/env bash
set -euo pipefail

ERRORS=0

DECISION_RECORD_DIR="docs/chester/decision-record"
MCP_DIR="mcp/chester-decision-record"
MCP_PKG="$MCP_DIR/package.json"
PROOF_PKG="skills/design-large-task/proof-mcp/package.json"

# (a) decision-record directory exists (pre-provisioned)
if [ ! -d "$DECISION_RECORD_DIR" ]; then
  echo "FAIL: $DECISION_RECORD_DIR does not exist as a directory"
  ERRORS=$((ERRORS + 1))
fi

# (b) mcp package directory exists
if [ ! -d "$MCP_DIR" ]; then
  echo "FAIL: $MCP_DIR does not exist as a directory"
  ERRORS=$((ERRORS + 1))
fi

# package.json exists
if [ ! -f "$MCP_PKG" ]; then
  echo "FAIL: $MCP_PKG does not exist"
  echo "FAIL: 1 or more errors (missing package.json — remaining assertions skipped)"
  exit 1
fi

# Valid JSON
if ! jq empty "$MCP_PKG" >/dev/null 2>&1; then
  echo "FAIL: $MCP_PKG is not valid JSON"
  exit 1
fi

# type = "module"
TYPE=$(jq -r '.type // ""' "$MCP_PKG")
if [ "$TYPE" != "module" ]; then
  echo "FAIL: $MCP_PKG .type is '$TYPE', expected 'module'"
  ERRORS=$((ERRORS + 1))
fi

# @modelcontextprotocol/sdk dependency exists
SDK_DEP=$(jq -r '.dependencies["@modelcontextprotocol/sdk"] // ""' "$MCP_PKG")
if [ -z "$SDK_DEP" ]; then
  echo "FAIL: $MCP_PKG missing @modelcontextprotocol/sdk in dependencies"
  ERRORS=$((ERRORS + 1))
fi

# proper-lockfile dependency exists (for Task 3 file locking)
LOCK_DEP=$(jq -r '.dependencies["proper-lockfile"] // ""' "$MCP_PKG")
if [ -z "$LOCK_DEP" ]; then
  echo "FAIL: $MCP_PKG missing proper-lockfile in dependencies"
  ERRORS=$((ERRORS + 1))
fi

# vitest devDependency exists and matches proof-mcp
VITEST_DEP=$(jq -r '.devDependencies.vitest // ""' "$MCP_PKG")
if [ -z "$VITEST_DEP" ]; then
  echo "FAIL: $MCP_PKG missing vitest in devDependencies"
  ERRORS=$((ERRORS + 1))
fi

if [ -f "$PROOF_PKG" ]; then
  PROOF_VITEST=$(jq -r '.devDependencies.vitest // ""' "$PROOF_PKG")
  if [ -n "$PROOF_VITEST" ] && [ "$VITEST_DEP" != "$PROOF_VITEST" ]; then
    echo "FAIL: $MCP_PKG vitest='$VITEST_DEP' does not match proof-mcp vitest='$PROOF_VITEST'"
    ERRORS=$((ERRORS + 1))
  fi
  PROOF_SDK=$(jq -r '.dependencies["@modelcontextprotocol/sdk"] // ""' "$PROOF_PKG")
  if [ -n "$PROOF_SDK" ] && [ "$SDK_DEP" != "$PROOF_SDK" ]; then
    echo "FAIL: $MCP_PKG @modelcontextprotocol/sdk='$SDK_DEP' does not match proof-mcp='$PROOF_SDK'"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo "WARN: $PROOF_PKG not found — skipping version-parity checks"
fi

if [ "$ERRORS" -gt 0 ]; then
  echo "FAIL: $ERRORS errors in decision-record setup"
  exit 1
fi

echo "PASS: decision-record MCP scaffold correct"
exit 0
