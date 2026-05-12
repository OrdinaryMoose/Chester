#!/usr/bin/env bash
# Cross-cutting check: all four affected SKILL.md files have been version-bumped
# per the add-interview-instructions spec.
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
FAIL=0

check() {
  local rel="$1"; local expected="$2"
  local actual
  actual=$(grep -E '^version:' "$REPO_ROOT/$rel" | head -1 | sed -E 's/^version:[[:space:]]*//')
  if [ "$actual" != "$expected" ]; then
    echo "FAIL: $rel expected '$expected', got '$actual'" >&2; FAIL=1
  fi
}

check "skills/util-design-partner-role/SKILL.md" "v0002"
check "skills/start-bootstrap/SKILL.md"           "v0002"
check "skills/design-large-task/SKILL.md"         "v0014"
check "skills/design-small-task/SKILL.md"         "v0003"

# Sanity: the design-small-task SKILL.md mentions the handshake step (the test for this task's edit).
grep -qi 'info-packet style handshake' "$REPO_ROOT/skills/design-small-task/SKILL.md" || {
  echo "FAIL: design-small-task SKILL.md missing handshake mention" >&2; FAIL=1; }

[ $FAIL -eq 0 ] && echo "PASS test-info-packet-style-version-bumps" || exit 1
