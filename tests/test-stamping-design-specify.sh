#!/usr/bin/env bash
set -euo pipefail
SKILL="skills/design-specify/SKILL.md"
ERRORS=0
fail() { echo "FAIL: $1" >&2; ERRORS=$((ERRORS + 1)); }

# Must invoke stamp for spec and ground-truth report (skeleton manifest stamping was removed when scaffolding mechanism was deleted in v0003).
COUNT=$(grep -c 'chester-trailer-write stamp' "$SKILL" || true)
[ "$COUNT" -ge 2 ] || fail "expected ≥2 stamp invocations (spec, ground-truth); got $COUNT"

grep -q 'util-artifact-schema' "$SKILL" || fail "does not cite util-artifact-schema"
grep -qi 'Provenance Trailers' "$SKILL" || fail "does not reference Provenance Trailers"
# design-specify is at v0003 (post skeleton-manifest scaffolding removal).
CUR_VER="$(awk '/^version:/ {print $2; exit}' "$SKILL")"
[ "$CUR_VER" = "v0003" ] || fail "version not at v0003 (got $CUR_VER)"

if [ "$ERRORS" -gt 0 ]; then echo "FAIL: $ERRORS"; exit 1; fi
echo "PASS: design-specify wired"
