#!/usr/bin/env bash
set -euo pipefail

SKILL="chester-setup-start/SKILL.md"

# Verify chester-setup-start references debug flag cleanup
if ! grep -q "chester-debug.json" "$SKILL"; then
  echo "FAIL: chester-setup-start does not reference debug flag cleanup"
  exit 1
fi

# Verify chester-setup-start-debug is in the available skills list
if ! grep -q "chester-setup-start-debug" "$SKILL"; then
  echo "FAIL: chester-setup-start-debug not registered in available skills"
  exit 1
fi

echo "PASS: chester-setup-start has debug flag cleanup and registers debug skill"
exit 0
