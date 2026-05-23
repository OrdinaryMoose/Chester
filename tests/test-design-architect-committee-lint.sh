#!/usr/bin/env bash
set -euo pipefail

LINT="$(dirname "$0")/../skills/design-architect-committee/scripts/lint-skill-files.sh"
FIX="$(dirname "$0")/fixtures/design-architect-committee-lint"

assert_pass() {
  local name="$1" skill="$2" rules="$3"
  if bash "$LINT" "$skill" "$rules" >/dev/null 2>&1; then echo "PASS: $name"
  else echo "FAIL: $name — expected pass"; exit 1; fi
}
assert_fail() {
  local name="$1" expect="$2" skill="$3" rules="$4"
  local out
  if out=$(bash "$LINT" "$skill" "$rules" 2>&1); then echo "FAIL: $name — expected fail"; exit 1; fi
  grep -q "$expect" <<<"$out" && echo "PASS: $name" || { echo "FAIL: $name — missing '$expect'"; echo "$out"; exit 1; }
}

assert_pass "clean fixture"       "$FIX/clean/SKILL.md"      "$FIX/clean/rules.md"
assert_fail "over-cap fixture"    "exceeds cap of 200"        "$FIX/over-cap/SKILL.md"   "$FIX/over-cap/rules.md"
assert_fail "list-item fixture"   "forbidden list pattern"    "$FIX/list-item/SKILL.md"  "$FIX/list-item/rules.md"

echo "all lint self-tests passed"
