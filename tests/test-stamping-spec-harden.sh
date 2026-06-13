#!/usr/bin/env bash
set -euo pipefail
SKILL="skills/spec-harden/SKILL.md"
ERRORS=0
fail() { echo "FAIL: $1" >&2; ERRORS=$((ERRORS + 1)); }

COUNT=$(grep -c 'chester-trailer-write stamp' "$SKILL" || true)
[ "$COUNT" -ge 1 ] || fail "expected >=1 stamp invocation (ground-truth report); got $COUNT"
grep -q 'spec-harden@' "$SKILL" || fail "stamp does not use spec-harden identity"
grep -q 'util-artifact-schema' "$SKILL" || fail "does not cite util-artifact-schema"
grep -qi 'Provenance Trailers' "$SKILL" || fail "does not reference Provenance Trailers"
CUR_VER="$(awk '/^version:/ {print $2; exit}' "$SKILL")"
[ "$CUR_VER" = "v0001" ] || fail "version not at v0001 (got $CUR_VER)"

if [ "$ERRORS" -gt 0 ]; then echo "FAIL: $ERRORS"; exit 1; fi
echo "PASS: spec-harden stamping wired"
