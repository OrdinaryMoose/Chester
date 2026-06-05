#!/usr/bin/env bash
set -euo pipefail

TPL="$(dirname "$0")/../skills/design-architect-committee/design-brief-template.md"
fail=0

assert_file() {
  if [ -s "$1" ]; then
    echo "PASS: file exists non-empty"
  else
    echo "FAIL: file missing/empty"
    fail=1
  fi
}

assert_contains() {
  if grep -qF -- "$2" "$1"; then
    echo "PASS: contains '$2'"
  else
    echo "FAIL: missing '$2'"
    fail=1
  fi
}

# --- File exists non-empty ---
assert_file "$TPL"

# --- Four required section headings ---
assert_contains "$TPL" "## Concerns"
assert_contains "$TPL" "## Constraint Envelope"
assert_contains "$TPL" "## Resolution Criterion"
assert_contains "$TPL" "## Coverage Map"

# --- Three required worked-example anchor IDs ---
assert_contains "$TPL" "CE-001"
assert_contains "$TPL" "AX-001"
assert_contains "$TPL" "PR-001"

if [ "$fail" -eq 0 ]; then
  echo "template structural tests passed"
  exit 0
else
  exit 1
fi
