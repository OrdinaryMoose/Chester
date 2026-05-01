#!/usr/bin/env bash
# tests/test-stamping-design-large-task.sh
set -euo pipefail

SKILL="skills/design-large-task/SKILL.md"
ERRORS=0
fail() { echo "FAIL: $1" >&2; ERRORS=$((ERRORS + 1)); }

# 1. References the helper script at least once
grep -q 'chester-trailer-write stamp' "$SKILL" || fail "no chester-trailer-write stamp invocation"

# 2. Cites the schema convention
grep -q 'util-artifact-schema' "$SKILL" || fail "does not cite util-artifact-schema"
grep -qi 'Provenance Trailers' "$SKILL" || fail "does not reference Provenance Trailers section"

# 3. Version frontmatter bumped to expected next value.
# Pre-sprint baseline: design-large-task is at v0008 → bump to v0009.
CUR_VER="$(awk '/^version:/ {print $2; exit}' "$SKILL")"
[ "$CUR_VER" = "v0009" ] || fail "version not bumped to v0009 (got $CUR_VER)"

if [ "$ERRORS" -gt 0 ]; then echo "FAIL: $ERRORS"; exit 1; fi
echo "PASS: design-large-task wired"
