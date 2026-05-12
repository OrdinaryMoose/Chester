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

# Five contract pieces named as subsection headings in the new section. Pin to
# the H3 heading syntax so the check fails if the subsection is removed, even
# when the bare word appears elsewhere in the file (e.g., the pre-existing
# "Composition Note" H2 and "Composition with Translation Gate" inline bold).
for heading in '### Verbosity Ladder' '### Composition Rule' '### Memory Independence' '### Directive Protocol' '### First-Turn Handshake'; do
  grep -qF "$heading" "$SKILL" || { echo "FAIL: section missing '$heading' subsection" >&2; FAIL=1; }
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
# Pin to the specific phrase used in the SKILL.md description, not just "overlay" —
# that catches description-drift between the two locations.
grep -q 'info-packet style overlay' "$INDEX" || {
  echo "FAIL: skill-index entry missing 'info-packet style overlay' mention" >&2; FAIL=1; }

[ $FAIL -eq 0 ] && echo "PASS test-partner-role-overlay-section" || exit 1
