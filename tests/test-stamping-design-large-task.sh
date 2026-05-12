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

# 3. Version frontmatter at current pinned value.
# Stamping wiring landed at v0009. Post-sprint legitimate bumps:
#   v0009 → v0010 (f5bd820, FRICTION routing) → v0011 (359df3f, open_proof rename) → ... → v0014 (add-interview-instructions, info-packet style handshake step).
# Re-pin when skill bumps for reasons unrelated to stamp wiring.
CUR_VER="$(awk '/^version:/ {print $2; exit}' "$SKILL")"
[ "$CUR_VER" = "v0014" ] || fail "version not at v0014 (got $CUR_VER)"

if [ "$ERRORS" -gt 0 ]; then echo "FAIL: $ERRORS"; exit 1; fi
echo "PASS: design-large-task wired"
