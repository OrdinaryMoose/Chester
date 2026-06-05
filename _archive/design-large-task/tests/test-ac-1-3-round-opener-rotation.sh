#!/usr/bin/env bash
# AC-1.3: round sequence assigns openers in order N, S, E, W, then synthesis
set -euo pipefail
FLOW="skills/design-large-task/references/team-interview-flow.md"
ERRORS=0
SECTION=$(awk '/^## Round Sequence/{f=1;next} /^## /{if(f)exit} f' "$FLOW")
[ -n "$SECTION" ] || { echo "FAIL: Round Sequence section missing"; exit 1; }
echo "$SECTION" | grep -E -i "R1[^0-9].*(innovator|\\(N\\))" > /dev/null || { echo "FAIL: R1 opener (Innovator) not in Round Sequence"; ERRORS=$((ERRORS+1)); }
echo "$SECTION" | grep -E -i "R2[^0-9].*(conservator|\\(S\\))" > /dev/null || { echo "FAIL: R2 opener (Conservator) not in Round Sequence"; ERRORS=$((ERRORS+1)); }
echo "$SECTION" | grep -E -i "R3[^0-9].*(purist|\\(E\\))" > /dev/null || { echo "FAIL: R3 opener (Purist) not in Round Sequence"; ERRORS=$((ERRORS+1)); }
echo "$SECTION" | grep -E -i "R4[^0-9].*(pragmatist|\\(W\\))" > /dev/null || { echo "FAIL: R4 opener (Pragmatist) not in Round Sequence"; ERRORS=$((ERRORS+1)); }
echo "$SECTION" | grep -E -i "R5.*synthesis" > /dev/null || { echo "FAIL: R5 synthesis round not in Round Sequence"; ERRORS=$((ERRORS+1)); }
[ $ERRORS -eq 0 ] && echo "AC-1.3: PASS" || { echo "AC-1.3: $ERRORS check(s) failed"; exit 1; }
