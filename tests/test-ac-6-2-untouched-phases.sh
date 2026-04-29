#!/usr/bin/env bash
# AC-6.2: SKILL.md Phases 1, 2, 5 sections semantically unchanged
set -euo pipefail
SKILL="skills/design-large-task/SKILL.md"
ERRORS=0

for heading in "## Phase 1: Bootstrap" "## Phase 2: Parallel Context Exploration" "## Phase 5: Closure"; do
  grep -F "$heading" "$SKILL" > /dev/null || { echo "FAIL: heading '$heading' missing or renamed"; ERRORS=$((ERRORS+1)); }
done

extract_section() {
  local file="$1" start="$2" end="$3"
  if [ -n "$end" ]; then
    awk -v s="$start" -v e="$end" '
      $0 ~ s { capture=1 }
      capture && $0 ~ e && $0 != s { exit }
      capture { print }
    ' "$file"
  else
    awk -v s="$start" '
      $0 ~ s { capture=1 }
      capture { print }
    ' "$file"
  fi
}

# The HARD-GATE block inside Phase 2 was deliberately patched per Mitigation A
# (plan-attack HIGH finding — added a team-interview conditional inside the block).
# Strip the HARD-GATE block from Phase 2 comparison so the test verifies
# "Phase 2 not accidentally touched" without flagging the intentional patch.
strip_hardgate() {
  awk '/<HARD-GATE>/{skip=1} !skip{print} /<\/HARD-GATE>/{skip=0}'
}

git show main:"$SKILL" > /tmp/skill-main.md 2>/dev/null || { echo "FAIL: cannot read main:$SKILL"; exit 1; }

for pair in "## Phase 1: Bootstrap|## Phase 2:" "## Phase 2: Parallel Context Exploration|## Phase 3:" "## Phase 5: Closure|"; do
  start="${pair%|*}"
  end="${pair#*|}"
  diff <(extract_section "$SKILL" "$start" "$end" | strip_hardgate) <(extract_section /tmp/skill-main.md "$start" "$end" | strip_hardgate) > /tmp/ac62-section-diff.txt 2>&1 || true
  if [ -s /tmp/ac62-section-diff.txt ]; then
    echo "FAIL: protected section '$start' has semantic changes vs main"
    cat /tmp/ac62-section-diff.txt
    ERRORS=$((ERRORS+1))
  fi
done

[ $ERRORS -eq 0 ] && echo "AC-6.2: PASS" || { echo "AC-6.2: $ERRORS check(s) failed"; exit 1; }
