#!/usr/bin/env bash
set -euo pipefail
REF="skills/spec-write/references/fac-complete-design-contract.md"
ERRORS=0
fail() { echo "FAIL: $1" >&2; ERRORS=$((ERRORS + 1)); }

[ -f "$REF" ] || fail "fac-complete-design-contract.md does not exist"
# Anchor each field to its bold table-cell label (**Field**) so a short term like
# "Goal" cannot false-match "Non-Goals", nor "Constraints" an earlier prose line.
for field in "Goal" "Chosen architecture" "Rejected alternatives" "Prior-art" "Ground-truth" "Constraints" "Acceptance-criteria seed" "Deferred"; do
  grep -qi -- "\*\*$field" "$REF" || fail "contract missing field: $field"
done
grep -qi 'complete-design source' "$REF" || fail "no committee complete-design mapping"
grep -qi 'spec-architect' "$REF" || fail "no spec-architect mapping"
grep -qi 'quote.back\|quote back' "$REF" || fail "no quote-back requirement"

if [ "$ERRORS" -gt 0 ]; then echo "FAIL: $ERRORS"; exit 1; fi
echo "PASS: FAC contract defined"
