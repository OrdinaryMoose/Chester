#!/usr/bin/env bash
set -euo pipefail
SKILL="skills/plan-build/SKILL.md"
ERRORS=0
fail() { echo "FAIL: $1" >&2; ERRORS=$((ERRORS + 1)); }

# At least 2 stamp invocations: plan + threat report
COUNT=$(grep -c 'chester-trailer-write stamp' "$SKILL" || true)
[ "$COUNT" -ge 2 ] || fail "expected ≥2 stamp invocations (plan, threat report); got $COUNT"

grep -q 'util-artifact-schema' "$SKILL" || fail "does not cite util-artifact-schema"
grep -qi 'Provenance Trailers' "$SKILL" || fail "does not reference Provenance Trailers"
# plan-build is at v0004 (post dr_query revert).
CUR_VER="$(awk '/^version:/ {print $2; exit}' "$SKILL")"
[ "$CUR_VER" = "v0004" ] || fail "version not at v0004 (got $CUR_VER)"

if [ "$ERRORS" -gt 0 ]; then echo "FAIL: $ERRORS"; exit 1; fi
echo "PASS: plan-build wired"
