#!/usr/bin/env bash
set -euo pipefail
SKILL="skills/finish-write-records/SKILL.md"
FORMATS="skills/finish-write-records/references/record-formats.md"
ERRORS=0
fail() { echo "FAIL: $1" >&2; ERRORS=$((ERRORS + 1)); }

# 1. Skill invokes harvest before writing summary
grep -q 'chester-trailer-write harvest' "$SKILL" || fail "no harvest invocation"

# 1b. Both feature-mode and refactor-mode harvest paths are mentioned (D8 applies
# to both modes; refactor mode harvests the slug directory under docs/refactor/)
grep -q 'CHESTER_WORKING_DIR' "$SKILL" || fail "feature-mode harvest path not specified"
grep -q 'docs/refactor' "$SKILL" || fail "refactor-mode harvest path not specified"

# 2. Skill invokes stamp on summary, audit, and (refactor) brief
COUNT=$(grep -c 'chester-trailer-write stamp' "$SKILL" || true)
[ "$COUNT" -ge 3 ] || fail "expected ≥3 stamp invocations (summary, audit, brief); got $COUNT"

# 3. Skill cites the convention
grep -q 'util-artifact-schema' "$SKILL" || fail "does not cite util-artifact-schema"
grep -qi 'Provenance Trailers' "$SKILL" || fail "does not reference Provenance Trailers"

# 4. Summary template includes Session Skill Versions section
grep -q 'Session Skill Versions' "$FORMATS" || fail "record-formats.md missing Session Skill Versions section"

# 5. Skill mentions Session Skill Versions in summary-write step
grep -q 'Session Skill Versions' "$SKILL" || fail "skill text missing Session Skill Versions"

# 6. Version is at v0003 (post fork-pattern restructure)
CUR_VER="$(awk '/^version:/ {print $2; exit}' "$SKILL")"
[ "$CUR_VER" = "v0003" ] || fail "version not at v0003 (got $CUR_VER)"

if [ "$ERRORS" -gt 0 ]; then echo "FAIL: $ERRORS"; exit 1; fi
echo "PASS: finish-write-records wired with harvest"
