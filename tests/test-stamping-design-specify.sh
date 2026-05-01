#!/usr/bin/env bash
set -euo pipefail
SKILL="skills/design-specify/SKILL.md"
ERRORS=0
fail() { echo "FAIL: $1" >&2; ERRORS=$((ERRORS + 1)); }

# Must invoke stamp for each of: spec, ground-truth report, skeleton manifest
COUNT=$(grep -c 'chester-trailer-write stamp' "$SKILL" || true)
[ "$COUNT" -ge 3 ] || fail "expected ≥3 stamp invocations (spec, ground-truth, skeleton); got $COUNT"

grep -q 'util-artifact-schema' "$SKILL" || fail "does not cite util-artifact-schema"
grep -qi 'Provenance Trailers' "$SKILL" || fail "does not reference Provenance Trailers"
# Pre-sprint baseline: design-specify is at v0001 → bump to v0002.
CUR_VER="$(awk '/^version:/ {print $2; exit}' "$SKILL")"
[ "$CUR_VER" = "v0002" ] || fail "version not bumped to v0002 (got $CUR_VER)"

if [ "$ERRORS" -gt 0 ]; then echo "FAIL: $ERRORS"; exit 1; fi
echo "PASS: design-specify wired"
