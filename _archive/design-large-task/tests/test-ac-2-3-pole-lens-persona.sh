#!/usr/bin/env bash
# AC-2.3: each pole agent declares lens position and Software Architect persona
set -euo pipefail
ERRORS=0
declare -A LENS_KEYWORDS=( \
  [innovator]="change|novel|new system" \
  [conservator]="status quo|stasis|existing" \
  [purist]="philosophy|principle" \
  [pragmatist]="ship|works|outcome" \
)
PERSONA_TRAIT_PATTERN='design history|trade-offs|be opinionated|architecture to intent|boundaries as choices'
for pole in innovator conservator purist pragmatist; do
  AGENT="agents/design-large-task-step-b-${pole}.md"
  [ -f "$AGENT" ] || { echo "FAIL: $AGENT missing"; ERRORS=$((ERRORS+1)); continue; }
  grep -E -i "${LENS_KEYWORDS[$pole]}" "$AGENT" > /dev/null || { echo "FAIL: $AGENT does not declare lens (expect: ${LENS_KEYWORDS[$pole]})"; ERRORS=$((ERRORS+1)); }
  grep -E -i "$PERSONA_TRAIT_PATTERN" "$AGENT" > /dev/null || { echo "FAIL: $AGENT does not inherit Software Architect persona traits"; ERRORS=$((ERRORS+1)); }
done
[ $ERRORS -eq 0 ] && echo "AC-2.3: PASS" || { echo "AC-2.3: $ERRORS check(s) failed"; exit 1; }
