#!/usr/bin/env bash
set -euo pipefail
SKILL="skills/spec-harden/SKILL.md"
ERRORS=0
fail() { echo "FAIL: $1" >&2; ERRORS=$((ERRORS + 1)); }

[ -f "$SKILL" ] || fail "spec-harden/SKILL.md does not exist"
grep -q '^name: spec-harden$' "$SKILL" || fail "frontmatter name not spec-harden"
grep -q '^version: v0001$' "$SKILL" || fail "version not v0001"
grep -qi 'fidelity' "$SKILL" || fail "missing fidelity pass"
grep -qi 'adversarial' "$SKILL" || fail "missing adversarial pass"
grep -qi 'ground-truth' "$SKILL" || fail "missing ground-truth pass"
for r in spec-reviewer adversarial-spec-review ground-truth-reviewer; do
  [ -f "skills/spec-harden/references/$r.md" ] || fail "reference $r.md not moved"
done
grep -qi 'standalone\|ad-hoc\|ad hoc' "$SKILL" || fail "no standalone ad-hoc capability"
grep -qi 'plan-build' "$SKILL" || fail "does not transition to plan-build"
grep -q 'design-specify' "$SKILL" && fail "still references design-specify"

if [ "$ERRORS" -gt 0 ]; then echo "FAIL: $ERRORS"; exit 1; fi
echo "PASS: spec-harden wired"
