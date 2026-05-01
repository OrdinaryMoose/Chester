#!/usr/bin/env bash
# tests/test-artifact-schema-provenance.sh — verify provenance section exists
set -euo pipefail

SCHEMA="skills/util-artifact-schema/SKILL.md"
ERRORS=0
fail() { echo "FAIL: $1" >&2; ERRORS=$((ERRORS + 1)); }

# 1. Section heading present
grep -q '^## Provenance Trailers' "$SCHEMA" || fail "missing '## Provenance Trailers' section"

# 2. Convention names the helper script
grep -q 'chester-trailer-write' "$SCHEMA" || fail "convention does not reference chester-trailer-write"

# 3. Convention names both subcommands
grep -q 'stamp' "$SCHEMA" || fail "convention does not mention stamp subcommand"
grep -q 'harvest' "$SCHEMA" || fail "convention does not mention harvest subcommand"

# 4. Trailer format documented
grep -qF '<!-- created-at:' "$SCHEMA" || fail "trailer format missing created-at example"
grep -qF '<!-- produced-by' "$SCHEMA" || fail "trailer format missing produced-by example"

# 5. Stamping-skill list (D10 — corrected) present
for skill in design-large-task design-small-task design-specify plan-build execute-write finish-write-records; do
  grep -q "$skill" "$SCHEMA" || fail "stamping-skill list missing $skill"
done

# 6. Non-stamping list mirrors D10 completely (plan-attack and plan-smell are
# inline-only; they do not write artifacts, so plan-build owns the threat-report
# and smell-report chains)
for nonstamp in 'plan-attack' 'plan-smell' 'finish-archive-artifacts' 'subagents' 'execute-test' 'execute-prove' 'execute-verify-complete' 'start-bootstrap'; do
  grep -qi "$nonstamp" "$SCHEMA" || fail "non-stamping list missing $nonstamp"
done

# 7. version bumped to v0002
grep -q '^version: v0002' "$SCHEMA" || fail "version not bumped to v0002"

if [ "$ERRORS" -gt 0 ]; then
  echo "FAIL: $ERRORS error(s) in provenance docs"
  exit 1
fi
echo "PASS: provenance convention documented"
