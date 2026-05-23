#!/usr/bin/env bash
set -euo pipefail

# Usage: lint-skill-files.sh [SKILL_PATH] [RULES_PATH]
# Defaults to canonical paths from repo root.

SKILL_PATH="${1:-skills/design-architect-committee/SKILL.md}"
RULES_PATH="${2:-skills/design-architect-committee/rules.md}"
CAP=200
fail=0

extract_body() {
  # Strip YAML frontmatter delimited by --- on line 1 and a subsequent ---.
  # If no frontmatter, return entire file (rules.md has no Skill-tool frontmatter).
  awk 'NR==1 && /^---$/ { state=1; next }
       state==1 && /^---$/ { state=2; next }
       state==1 { next }
       { print }' "$1"
}

check_word_cap() {
  local path="$1" base count
  base=$(basename "$path")
  count=$(extract_body "$path" | wc -w | tr -d ' ')
  if [ "$count" -gt "$CAP" ]; then
    echo "FAIL: $base body word count $count exceeds cap of $CAP"
    fail=1
  else
    echo "PASS: $base body word count $count"
  fi
}

check_list_ban() {
  local path="$1" base hit
  base=$(basename "$path")
  hit=$(extract_body "$path" | grep -nE '^- |^[0-9]+\. ' || true)
  if [ -n "$hit" ]; then
    echo "FAIL: $base body line matches forbidden list pattern: $(head -1 <<<"$hit")"
    fail=1
  else
    echo "PASS: $base body free of list items"
  fi
}

check_word_cap "$SKILL_PATH"
check_word_cap "$RULES_PATH"
check_list_ban "$SKILL_PATH"
check_list_ban "$RULES_PATH"

[ "$fail" -eq 1 ] && exit 1
echo "lint passed"
