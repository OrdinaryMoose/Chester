#!/usr/bin/env bash
# AC-1.4: sequential chain dispatch is documented for Phase 2
set -euo pipefail
FLOW="skills/design-large-task/references/team-interview-flow.md"
ERRORS=0
SECTION=$(awk '/^## Per-Round Phases/{f=1;next} /^## /{if(f)exit} f' "$FLOW")
[ -n "$SECTION" ] || { echo "FAIL: Per-Round Phases section missing"; exit 1; }
echo "$SECTION" | grep -E -i "phase 2.*opposing arguments|opposing arguments.*phase 2" > /dev/null || { echo "FAIL: Phase 2 / opposing arguments not described"; ERRORS=$((ERRORS+1)); }
echo "$SECTION" | grep -E -i "sequential chain" > /dev/null || { echo "FAIL: 'sequential chain' phrase missing in Per-Round Phases"; ERRORS=$((ERRORS+1)); }
echo "$SECTION" | grep -E -i "opposer.?2|second opposer" > /dev/null || { echo "FAIL: opposer-2 chain semantics not described"; ERRORS=$((ERRORS+1)); }
echo "$SECTION" | grep -E -i "opposer.?3|third opposer" > /dev/null || { echo "FAIL: opposer-3 chain semantics not described"; ERRORS=$((ERRORS+1)); }
echo "$SECTION" | grep -E -i "prior(-| )chain|prior(-| )pole|prior(-| )opposer" > /dev/null || { echo "FAIL: prior-chain content carry-forward not stated"; ERRORS=$((ERRORS+1)); }
[ $ERRORS -eq 0 ] && echo "AC-1.4: PASS" || { echo "AC-1.4: $ERRORS check(s) failed"; exit 1; }
