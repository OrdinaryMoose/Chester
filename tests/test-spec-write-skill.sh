#!/usr/bin/env bash
set -euo pipefail
SKILL="skills/spec-write/SKILL.md"
ERRORS=0
fail() { echo "FAIL: $1" >&2; ERRORS=$((ERRORS + 1)); }

[ -f "$SKILL" ] || fail "spec-write/SKILL.md does not exist"
grep -q '^name: spec-write$' "$SKILL" || fail "frontmatter name not spec-write"
grep -q '^version: v0001$' "$SKILL" || fail "version not v0001"
grep -qi 'no review pass\|authors only\|no.*hardening' "$SKILL" || fail "does not declare authoring-only"
grep -qi 'feature-dev:code-architect\|competing.architect' "$SKILL" && fail "spec-write contains an architecture-settling stage (AC-3.1 violation)"
grep -q 'fac-complete-design-contract' "$SKILL" || fail "does not reference FAC contract"
grep -qi 'quote.back\|quote back' "$SKILL" || fail "no architecture quote-back step"
grep -qi 'spec-harden' "$SKILL" || fail "does not transition to spec-harden"
grep -q 'design-specify' "$SKILL" && fail "still references design-specify"

if [ "$ERRORS" -gt 0 ]; then echo "FAIL: $ERRORS"; exit 1; fi
echo "PASS: spec-write wired"
