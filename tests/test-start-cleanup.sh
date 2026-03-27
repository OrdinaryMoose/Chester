#!/usr/bin/env bash
set -euo pipefail

SKILL="chester-start/SKILL.md"

# Verify chester-start references debug flag cleanup
if ! grep -q "chester-debug.json" "$SKILL"; then
  echo "FAIL: chester-start does not reference debug flag cleanup"
  exit 1
fi

# Verify chester-start-debug is in the available skills list
if ! grep -q "chester-start-debug" "$SKILL"; then
  echo "FAIL: chester-start-debug not registered in available skills"
  exit 1
fi

echo "PASS: chester-start has debug flag cleanup and registers debug skill"
exit 0
