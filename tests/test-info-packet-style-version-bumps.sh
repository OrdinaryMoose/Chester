#!/usr/bin/env bash
# Cross-cutting check: the affected SKILL.md files carry the add-interview-instructions
# edits. The original spec touched four skills; design-large-task was later removed from
# the repo, so its check is dropped here. The live targets' versions have advanced past
# the original floor — these pins track current state.
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

check "skills/util-design-partner-role/SKILL.md" "v0006"
check "skills/start-bootstrap/SKILL.md"           "v0003"
check "skills/design-small-task/SKILL.md"         "v0004"

# Sanity: the design-small-task SKILL.md mentions the handshake step (the test for this task's edit).
grep -qi 'info-packet style handshake' "$REPO_ROOT/skills/design-small-task/SKILL.md" || {
  echo "FAIL: design-small-task SKILL.md missing handshake mention" >&2; FAIL=1; }

[ $FAIL -eq 0 ] && echo "PASS test-info-packet-style-version-bumps" || exit 1
