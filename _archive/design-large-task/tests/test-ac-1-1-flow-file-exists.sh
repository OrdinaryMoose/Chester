#!/usr/bin/env bash
# AC-1.1: flow file exists at canonical path
set -euo pipefail
FLOW="skills/design-large-task/references/team-interview-flow.md"
if [ ! -f "$FLOW" ]; then
  echo "FAIL: $FLOW does not exist"
  exit 1
fi
if [ ! -s "$FLOW" ]; then
  echo "FAIL: $FLOW is empty"
  exit 1
fi
echo "AC-1.1: PASS"
