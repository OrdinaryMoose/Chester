#!/usr/bin/env bash
# Structural assertions for the Ad-hoc committee context-economy change.
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel)"
SK="$ROOT/skills/design-committee"
AG="$ROOT/agents"
fail=0
_check() { if eval "$2"; then echo "PASS: $1"; else echo "FAIL: $1"; fail=1; fi; }

# === ASSERTION FUNCTIONS — later tasks insert new assert_* functions in this region ===
assert_member_protocol() {
  local f="$SK/references/member-protocol.md"
  _check "member-protocol exists" "[ -f '$f' ]"
  _check "member-protocol defines digest fields" "grep -qi 'headline position' '$f' && grep -qi 'transcript path' '$f' && grep -qi 'confidence' '$f'"
  _check "member-protocol defines write-then-send sequencing" "grep -q '## Write-then-send' '$f'"
  _check "member-protocol names round-folder transcript path" "grep -q 'committee/round' '$f'"
  _check "member-protocol has citable section headings" "grep -q '## Digest shape' '$f' && grep -q '## Committee root resolution' '$f'"
  _check "member-protocol owns committee-root resolution (M1)" "grep -qiE 'sprint-subdir|ask the designer' '$f'"
}
# === END ASSERTION FUNCTIONS ===

# === RUN — later tasks insert new assert_* calls in this region, ABOVE the gate ===
assert_member_protocol
# === END RUN ===

# --- final gate: nothing executable may be added below this line ---
[ "$fail" -eq 0 ] && echo "ALL PASS" || { echo "FAILURES"; exit 1; }
