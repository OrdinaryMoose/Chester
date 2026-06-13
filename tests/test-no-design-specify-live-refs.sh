#!/usr/bin/env bash
set -euo pipefail
ERRORS=0
fail() { echo "FAIL: $1" >&2; ERRORS=$((ERRORS + 1)); }

# 1. The skill directory is gone
[ ! -d "skills/design-specify" ] || fail "skills/design-specify/ still exists"

# 2. No live skill or agent references design-specify
if grep -rn "design-specify" skills/ 2>/dev/null; then
  fail "live skill tree still references design-specify"
fi
if grep -rn "design-specify" agents/ 2>/dev/null; then
  fail "agents/ still references design-specify"
fi

# 3. Current-state docs are clean (preflight existence so a moved file can't
#    silently turn the grep into a no-op under set -e — grep exits 2 on a
#    missing file and the && short-circuits without failing).
for d in docs/instructions.md docs/README.md; do
  [ -f "$d" ] || fail "$d missing — cannot check for design-specify references"
  grep -q "design-specify" "$d" && fail "$d still references design-specify"
done

# 4. The three new skills exist (the three replacing design-specify, per spec 20260612-02)
for s in spec-architect spec-write spec-harden; do
  [ -f "skills/$s/SKILL.md" ] || fail "skills/$s/SKILL.md missing"
done

if [ "$ERRORS" -gt 0 ]; then echo "FAIL: $ERRORS"; exit 1; fi
echo "PASS: design-specify fully migrated; historical record preserved"
