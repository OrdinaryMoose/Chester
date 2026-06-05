#!/usr/bin/env bash
# AC-3.2: SKILL.md Phase 3/Phase 4 conditional on flow type + all template sites patched + HARD-GATE conditional
set -euo pipefail
SKILL="skills/design-large-task/SKILL.md"
ERRORS=0
grep -F 'team-interview-flow.md' "$SKILL" > /dev/null || { echo "FAIL: team-interview-flow.md not referenced in SKILL.md"; ERRORS=$((ERRORS+1)); }
grep -E -i 'when .{0,30}team.interview|if .{0,30}team.interview' "$SKILL" > /dev/null || { echo "FAIL: conditional on team-interview not present"; ERRORS=$((ERRORS+1)); }
grep -E -i 'no .{0,30}MCP init|no .{0,30}initialize_understanding' "$SKILL" > /dev/null || { echo "FAIL: no-MCP-init clause missing"; ERRORS=$((ERRORS+1)); }
grep -E -i 'context packet|round.zero' "$SKILL" > /dev/null || { echo "FAIL: round-zero context-packet preservation note missing"; ERRORS=$((ERRORS+1)); }
TI_COUNT=$(grep -c 'team-interview-flow.md' "$SKILL" || echo 0)
[ "$TI_COUNT" -ge 4 ] || { echo "FAIL: team-interview-flow.md referenced only $TI_COUNT time(s); expected >=4 (Mitigation A: lines 71, 226, 269, 326 + Phase Map step 3)"; ERRORS=$((ERRORS+1)); }
HARD_GATE_SECTION=$(awk '/<HARD-GATE>/,/<\/HARD-GATE>/' "$SKILL" | head -200)
echo "$HARD_GATE_SECTION" | grep -E -i 'team.interview' > /dev/null || { echo "FAIL: HARD-GATE block has no team-interview conditional"; ERRORS=$((ERRORS+1)); }
echo "$HARD_GATE_SECTION" | grep -E -i 'no .{0,30}initialize_understanding|context packet' > /dev/null || { echo "FAIL: HARD-GATE conditional does not name no-init / context-packet alternative"; ERRORS=$((ERRORS+1)); }
[ $ERRORS -eq 0 ] && echo "AC-3.2: PASS" || { echo "AC-3.2: $ERRORS check(s) failed"; exit 1; }
