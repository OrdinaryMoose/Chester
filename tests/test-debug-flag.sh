#!/usr/bin/env bash
set -euo pipefail

SKILL="chester-start-debug/SKILL.md"

if [ ! -f "$SKILL" ]; then
  echo "FAIL: chester-start-debug/SKILL.md does not exist"
  exit 1
fi

# Verify SKILL.md contains debug flag creation instructions
if ! grep -q "chester-debug.json" "$SKILL"; then
  echo "FAIL: SKILL.md does not reference chester-debug.json"
  exit 1
fi

if ! grep -q "diagnostic" "$SKILL"; then
  echo "FAIL: SKILL.md does not mention diagnostic mode"
  exit 1
fi

# Verify YAML frontmatter has name field
if ! head -5 "$SKILL" | grep -q "name: chester-start-debug"; then
  echo "FAIL: SKILL.md frontmatter missing or incorrect name"
  exit 1
fi

echo "PASS: chester-start-debug skill exists with correct structure"
exit 0
