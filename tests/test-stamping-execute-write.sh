#!/usr/bin/env bash
set -euo pipefail
SKILL="skills/execute-write/SKILL.md"
ERRORS=0
fail() { echo "FAIL: $1" >&2; ERRORS=$((ERRORS + 1)); }

grep -q 'chester-trailer-write stamp' "$SKILL" || fail "no stamp invocation"
grep -q 'util-artifact-schema' "$SKILL" || fail "does not cite util-artifact-schema"
grep -qi 'Provenance Trailers' "$SKILL" || fail "does not reference Provenance Trailers"
# execute-write is at v0011 (implementer follows YAGNI and least-code guidance).
CUR_VER="$(awk '/^version:/ {print $2; exit}' "$SKILL")"
[ "$CUR_VER" = "v0011" ] || fail "version not at v0011 (got $CUR_VER)"

if [ "$ERRORS" -gt 0 ]; then echo "FAIL: $ERRORS"; exit 1; fi
echo "PASS: execute-write wired"
