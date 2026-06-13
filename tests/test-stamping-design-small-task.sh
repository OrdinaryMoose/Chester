#!/usr/bin/env bash
set -euo pipefail
SKILL="skills/design-small-task/SKILL.md"
ERRORS=0
fail() { echo "FAIL: $1" >&2; ERRORS=$((ERRORS + 1)); }

grep -q 'chester-trailer-write stamp' "$SKILL" || fail "no stamp invocation"
grep -q 'util-artifact-schema' "$SKILL" || fail "does not cite util-artifact-schema"
grep -qi 'Provenance Trailers' "$SKILL" || fail "does not reference Provenance Trailers"
# Version at v0004 (v0003 = info-packet style handshake step; v0004 = PM-Litmus + Research-Boundary cited to canonical home).
CUR_VER="$(awk '/^version:/ {print $2; exit}' "$SKILL")"
[ "$CUR_VER" = "v0005" ] || fail "version not bumped to v0005 (got $CUR_VER)"

if [ "$ERRORS" -gt 0 ]; then echo "FAIL: $ERRORS"; exit 1; fi
echo "PASS: design-small-task wired"
