#!/usr/bin/env bash
set -euo pipefail
TPL="skills/spec-write/references/spec-template.md"
ERRORS=0
fail() { echo "FAIL: $1" >&2; ERRORS=$((ERRORS + 1)); }

[ -f "$TPL" ] || fail "spec-template.md not at spec-write/references/"
grep -q '## Acceptance Criteria' "$TPL" || fail "template lost Acceptance Criteria section"
grep -qi 'Architecture' "$TPL" || fail "template lost Architecture field"
grep -q 'design-specify' "$TPL" && fail "Architecture field still names design-specify"
grep -qi 'design-specify hybrid' "$TPL" && fail "Architecture field still encodes one-producer precondition"

if [ "$ERRORS" -gt 0 ]; then echo "FAIL: $ERRORS"; exit 1; fi
echo "PASS: spec-template producer-neutral"
