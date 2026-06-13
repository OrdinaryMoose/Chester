#!/usr/bin/env bash
set -euo pipefail
SKILL="skills/finish-write-records/SKILL.md"
FORMATS="skills/finish-write-records/references/record-formats.md"
ERRORS=0
fail() { echo "FAIL: $1" >&2; ERRORS=$((ERRORS + 1)); }

# Contract as of v0004 ("simplify to summary + audit only"): refactor mode and the
# brief stamp were removed; the skill now produces exactly summary + audit.

# 1. Skill invokes harvest before writing summary
grep -q 'chester-trailer-write harvest' "$SKILL" || fail "no harvest invocation"

# 1b. Harvest path is the working-dir sprint subtree (sole mode after simplification)
grep -q 'CHESTER_WORKING_DIR' "$SKILL" || fail "harvest path not specified"

# 2. Skill invokes stamp on the two artifacts it produces: summary + audit
COUNT=$(grep -c 'chester-trailer-write stamp' "$SKILL" || true)
[ "$COUNT" -ge 2 ] || fail "expected ≥2 stamp invocations (summary, audit); got $COUNT"

# 3. Skill cites the convention
grep -q 'util-artifact-schema' "$SKILL" || fail "does not cite util-artifact-schema"

# 4. Summary template includes Session Skill Versions section
grep -q 'Session Skill Versions' "$FORMATS" || fail "record-formats.md missing Session Skill Versions section"

# 5. Skill mentions Session Skill Versions in summary-write step
grep -q 'Session Skill Versions' "$SKILL" || fail "skill text missing Session Skill Versions"

# 6. Version is at v0005 (post summary+audit-only simplification)
CUR_VER="$(awk '/^version:/ {print $2; exit}' "$SKILL")"
[ "$CUR_VER" = "v0005" ] || fail "version not at v0005 (got $CUR_VER)"

if [ "$ERRORS" -gt 0 ]; then echo "FAIL: $ERRORS"; exit 1; fi
echo "PASS: finish-write-records wired with harvest"
