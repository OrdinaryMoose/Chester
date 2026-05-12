#!/usr/bin/env bash
# Verifies util-design-partner-role carries the Info-Packet Style Overlay section
# and the version + description are updated to reflect it.
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
SKILL="$REPO_ROOT/skills/util-design-partner-role/SKILL.md"
INDEX="$REPO_ROOT/skills/setup-start/references/skill-index.md"
FAIL=0

# Section heading present.
grep -q '^## Info-Packet Style Overlay$' "$SKILL" || {
  echo "FAIL: Info-Packet Style Overlay section heading missing" >&2; FAIL=1; }

# Five contract pieces named in the new section (case-insensitive substring).
for needle in 'verbosity ladder' 'composition' 'memory' 'directive protocol' 'handshake'; do
  grep -qi "$needle" "$SKILL" || { echo "FAIL: section missing '$needle' coverage" >&2; FAIL=1; }
done

# Factory-default-by-reference (no restatement of the literal string).
grep -q 'factory default defined in' "$SKILL" || {
  echo "FAIL: factory default reference language missing" >&2; FAIL=1; }
# Make sure the literal string is NOT restated in the SKILL.md.
if grep -q 'bullet list, normal verbosity, Product Manager voice' "$SKILL"; then
  echo "FAIL: factory default literal restated in SKILL.md (should be by-reference only)" >&2; FAIL=1
fi

# Version bumped to v0002.
grep -q '^version: v0002$' "$SKILL" || { echo "FAIL: version not v0002" >&2; FAIL=1; }

# skill-index entry mentions the overlay so the description stays in sync.
grep -q 'overlay' "$INDEX" || { echo "FAIL: skill-index entry not updated to mention overlay" >&2; FAIL=1; }

[ $FAIL -eq 0 ] && echo "PASS test-partner-role-overlay-section" || exit 1
