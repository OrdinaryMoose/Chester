#!/usr/bin/env bash
# Shared test fixtures for decision-record integration test scripts.
#
# This file is sourced, not executed. It exports helper functions that create
# temp stores, mock sprint directories, and invoke decision-record MCP handlers
# directly via node. Every integration test begins by sourcing this file and
# calling `dr_temp_store_init` to set `CHESTER_DECISION_RECORD_PATH` to a
# per-test temp file — no test may touch the production store.
#
# Usage:
#   source "$(dirname "$0")/test-decision-record-shared-fixtures.sh"
#   dr_temp_store_init
#   dr_mock_sprint my-sprint
#   dr_invoke dr_capture '{"sprint":"...","task":"...",...}'
#
# Helpers:
#   dr_temp_store_init  — create temp file, set env, register EXIT trap
#   dr_mock_sprint NAME — create minimal sprint scratch dir under /tmp
#   dr_cleanup          — teardown (invoked by trap)
#   dr_invoke TOOL JSON — run handler via node, print JSON result to stdout
#
# Sourcing-safety guard: refuses to run when executed directly.

if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
  echo "test-decision-record-shared-fixtures.sh must be sourced, not executed" >&2
  exit 1
fi

# Resolve repo root relative to this file so helpers work regardless of cwd.
_DR_FIXTURES_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
_DR_REPO_ROOT="$(cd "$_DR_FIXTURES_DIR/.." && pwd)"

# Track temp artifacts for cleanup.
_DR_TEMP_STORE=""
_DR_MOCK_SPRINT_DIRS=()

dr_cleanup() {
  if [ -n "$_DR_TEMP_STORE" ] && [ -f "$_DR_TEMP_STORE" ]; then
    rm -f "$_DR_TEMP_STORE" "$_DR_TEMP_STORE.lock" 2>/dev/null || true
    # proper-lockfile may create a .lock directory as well.
    rm -rf "$_DR_TEMP_STORE.lock" 2>/dev/null || true
  fi
  for d in "${_DR_MOCK_SPRINT_DIRS[@]:-}"; do
    [ -n "$d" ] && [ -d "$d" ] && rm -rf "$d" 2>/dev/null || true
  done
  _DR_TEMP_STORE=""
  _DR_MOCK_SPRINT_DIRS=()
}

dr_temp_store_init() {
  _DR_TEMP_STORE="$(mktemp -t chester-dr-XXXXXX)"
  export CHESTER_DECISION_RECORD_PATH="$_DR_TEMP_STORE"
  # Seed an empty file so the first invocation has a predictable state.
  : > "$_DR_TEMP_STORE"
  trap dr_cleanup EXIT
}

dr_mock_sprint() {
  local name="$1"
  if [ -z "$name" ]; then
    echo "dr_mock_sprint: sprint name required" >&2
    return 1
  fi
  local dir
  dir="$(mktemp -d -t "chester-sprint-${name}-XXXXXX")"
  mkdir -p "$dir/spec" "$dir/plan"
  cat > "$dir/spec/${name}-spec-00.md" <<EOF
# Spec: $name

## Acceptance Criteria

### AC-1.1 — First criterion
A first acceptance criterion used for fixture testing.

### AC-1.2 — Second criterion
A second acceptance criterion used for fixture testing.
EOF
  cat > "$dir/plan/${name}-plan-00.md" <<EOF
# Plan: $name

## Task 1: Example task
- skeleton: tests/test-example.sh
EOF
  _DR_MOCK_SPRINT_DIRS+=("$dir")
  echo "$dir"
}

# Invoke an MCP handler directly.
#
# Args: <tool_name> <json_args>
# Prints: the handler's result object as JSON on stdout.
#
# We cd into the repo root for the node call so ES-module relative imports
# resolve predictably regardless of where the test is invoked from.
dr_invoke() {
  local tool="$1"
  local args_json="${2-}"
  [ -z "$args_json" ] && args_json="{}"
  if [ -z "$tool" ]; then
    echo "dr_invoke: tool name required" >&2
    return 1
  fi
  ( cd "$_DR_REPO_ROOT" && \
    DR_TOOL="$tool" DR_ARGS="$args_json" node --input-type=module -e '
      const tool = process.env.DR_TOOL;
      const args = JSON.parse(process.env.DR_ARGS || "{}");
      const { HANDLERS } = await import("./mcp/chester-decision-record/handlers.js");
      const { Store } = await import("./mcp/chester-decision-record/store.js");
      const store = new Store({ storePath: process.env.CHESTER_DECISION_RECORD_PATH });
      const handler = HANDLERS[tool];
      if (!handler) {
        console.error("unknown tool: " + tool);
        process.exit(2);
      }
      const out = await handler(args, store);
      process.stdout.write(JSON.stringify(out));
    '
  )
}
