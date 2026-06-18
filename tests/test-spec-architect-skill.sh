#!/usr/bin/env bash
set -euo pipefail
SKILL="skills/spec-architect/SKILL.md"
ERRORS=0
fail() { echo "FAIL: $1" >&2; ERRORS=$((ERRORS + 1)); }

[ -f "$SKILL" ] || fail "spec-architect/SKILL.md does not exist"
grep -q '^name: spec-architect$' "$SKILL" || fail "frontmatter name not spec-architect"
grep -q '^version: v0002$' "$SKILL" || fail "version not v0002"
grep -qi 'feature-dev:code-architect' "$SKILL" || fail "no architect dispatch"
grep -qi 'Feasib' "$SKILL" || fail "no F-A-C feasibility precondition"
grep -qi 'spec-write' "$SKILL" || fail "does not transition to spec-write"
grep -q 'Transitions to' "$SKILL" || fail "no Integration transition line"
grep -q 'design-specify' "$SKILL" && fail "still references design-specify"

if [ "$ERRORS" -gt 0 ]; then echo "FAIL: $ERRORS"; exit 1; fi
echo "PASS: spec-architect wired"
