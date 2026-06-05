#!/usr/bin/env bash
# AC-3.1: design-large-task SKILL.md swap-line declares team-interview as a valid option
set -euo pipefail
ERRORS=0
SKILL="skills/design-large-task/SKILL.md"

if [ ! -f "$SKILL" ]; then
  echo "FAIL: $SKILL does not exist"
  exit 1
fi

# Variable name unchanged
if ! grep -q 'ACTIVE_UNDERSTANDING_MCP:' "$SKILL"; then
  echo "FAIL: ACTIVE_UNDERSTANDING_MCP variable not present"
  ERRORS=$((ERRORS + 1))
fi

# team-interview listed as an option in the swap-line block
if ! grep -q 'team-interview' "$SKILL"; then
  echo "FAIL: team-interview option not present in SKILL.md"
  ERRORS=$((ERRORS + 1))
fi

# Existing options preserved
for opt in classic problemfocused architectural; do
  if ! grep -q "$opt" "$SKILL"; then
    echo "FAIL: existing option $opt no longer present"
    ERRORS=$((ERRORS + 1))
  fi
done

# architectural still marked ARCHIVED
if ! grep -q 'ARCHIVED' "$SKILL"; then
  echo "FAIL: ARCHIVED marker on architectural option missing"
  ERRORS=$((ERRORS + 1))
fi

if [ $ERRORS -gt 0 ]; then
  echo "AC-3.1: $ERRORS check(s) failed"
  exit 1
fi
echo "AC-3.1: PASS"
