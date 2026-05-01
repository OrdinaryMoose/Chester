#!/usr/bin/env bash
# Verify finish-archive-artifacts uses cp -r (bytewise) so trailer chains are preserved
set -euo pipefail
SKILL="skills/finish-archive-artifacts/SKILL.md"
ERRORS=0
fail() { echo "FAIL: $1" >&2; ERRORS=$((ERRORS + 1)); }

# 1. Skill uses cp -r (bytewise copy)
grep -q 'cp -r' "$SKILL" || fail "finish-archive-artifacts does not use cp -r"

# 2. Skill must NOT invoke chester-trailer-write (D6: archive does not re-stamp)
if grep -q 'chester-trailer-write' "$SKILL"; then
  fail "finish-archive-artifacts must not invoke chester-trailer-write (D6)"
fi

# 3. Skill notes that copy is not a modification (cite the convention or D6 in prose)
grep -qi 'bytewise\|not a modification\|trailer.*intact\|preserves.*chain' "$SKILL" \
  || fail "finish-archive-artifacts does not document bytewise/no-stamp invariant"

if [ "$ERRORS" -gt 0 ]; then echo "FAIL: $ERRORS"; exit 1; fi
echo "PASS: archive preserves trailer chains bytewise"
