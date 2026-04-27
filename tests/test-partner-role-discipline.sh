#!/bin/bash
# Tests: AC-1.1, AC-1.2, AC-1.3, AC-1.4, AC-1.5, AC-5.1, AC-5.2
# Partner-role discipline structure
set -e

REPO_ROOT="$(git rev-parse --show-toplevel)"
PARTNER="$REPO_ROOT/skills/util-design-partner-role/SKILL.md"

# AC-1.1: C1 section present with required elements
grep -qE '^## C1: Externalized Coverage' "$PARTNER" || { echo "FAIL AC-1.1: C1 section heading missing"; exit 1; }
grep -q "load-bearing" "$PARTNER" || { echo "FAIL AC-1.1: 'load-bearing' phrase missing"; exit 1; }
grep -qiE 'hidden[ -]premise|silent premise' "$PARTNER" || { echo "FAIL AC-1.1: failure mode (hidden/silent premise) not named"; exit 1; }
grep -qi "single-session" "$PARTNER" || { echo "FAIL AC-1.1: single-session scope not stated"; exit 1; }
grep -qi "would removing this" "$PARTNER" || { echo "FAIL AC-1.1: operational test missing"; exit 1; }

# AC-1.2: C2 section present
grep -qE '^## C2: Fact Default with Marked Departures' "$PARTNER" || { echo "FAIL AC-1.2: C2 section heading missing"; exit 1; }
grep -qi "verifiable" "$PARTNER" || { echo "FAIL AC-1.2: 'verifiable' (Fact definition) missing"; exit 1; }
grep -qi "repeatable" "$PARTNER" || { echo "FAIL AC-1.2: 'repeatable' (Fact definition) missing"; exit 1; }
grep -qE "I'm assuming|I assumed" "$PARTNER" || { echo "FAIL AC-1.2: Assumption natural-phrasing example missing"; exit 1; }
grep -qE "I think|I recommend|My read" "$PARTNER" || { echo "FAIL AC-1.2: Opinion natural-phrasing example missing"; exit 1; }
grep -qi "all recommendations are opinions" "$PARTNER" || { echo "FAIL AC-1.2: hard rule on recommendations missing"; exit 1; }
grep -qi "no source breadcrumb\|no breadcrumb" "$PARTNER" || { echo "FAIL AC-1.2: no-breadcrumb constraint missing"; exit 1; }

# AC-1.3: before/after example block
grep -qiE "^### Before/After|^\*\*Before|^Before \(" "$PARTNER" || { echo "FAIL AC-1.3: Before/After example block missing"; exit 1; }
awk '/Before/,/After/' "$PARTNER" | grep -qiE "Assumption|assuming" || { echo "FAIL AC-1.3: Assumption marker absent in before/after"; exit 1; }
awk '/After/,/^---|^##/' "$PARTNER" | grep -qiE "Opinion|I think|recommend" || { echo "FAIL AC-1.3: Opinion marker absent in after side"; exit 1; }

# AC-1.4: Self-Evaluation extended with 4 sibling checks
# Use exclusive-start awk pattern — naive '/start/,/end/' terminates immediately when start matches the closing pattern
SE_BLOCK=$(awk '/^## Self-Evaluation/{flag=1; next} /^## /{flag=0} flag' "$PARTNER")
echo "$SE_BLOCK" | grep -qi "strategy talk or code talk" || { echo "FAIL AC-1.4: existing strategy/code check removed"; exit 1; }
SIBLING_COUNT=$(echo "$SE_BLOCK" | grep -cE '\((C1|C2)( hard rule)?\)')
if [ "$SIBLING_COUNT" -lt 4 ]; then echo "FAIL AC-1.4: fewer than 4 (C1)/(C2)-tagged sibling checks (got $SIBLING_COUNT)"; exit 1; fi

# AC-1.5: Composition Note present near top, after Interpreter Frame
INTRO_BLOCK=$(awk '/^## The Interpreter Frame/,/^## Private Precision Slot/' "$PARTNER")
echo "$INTRO_BLOCK" | grep -qiE "C1|C2" || { echo "FAIL AC-1.5: Composition Note (mentioning C1 or C2) not found between Interpreter Frame and Private Precision Slot"; exit 1; }

# AC-5.1: Translation Gate compatibility — no obvious code vocabulary in NEW sections
NEW_BLOCK=$(awk '/^## C1: Externalized Coverage/,/^## Option-Naming Rule/' "$PARTNER")
if echo "$NEW_BLOCK" | grep -qE '\`[A-Z][a-zA-Z]*[A-Z][a-zA-Z]*\`'; then echo "FAIL AC-5.1: backticked CamelCase identifier in new sections (Translation Gate violation)"; exit 1; fi
if echo "$NEW_BLOCK" | grep -qE '\`[a-z]+/[a-z]+'; then echo "FAIL AC-5.1: backticked file path in new sections"; exit 1; fi
if echo "$NEW_BLOCK" | grep -qE '\.cs|\.ts|\.py|\.js'; then echo "FAIL AC-5.1: file suffix in new sections"; exit 1; fi

# AC-5.2: Existing sections preserved verbatim
grep -qE '^## The Core Stance' "$PARTNER" || { echo "FAIL AC-5.2: Core Stance section missing"; exit 1; }
grep -qE '^## The Interpreter Frame' "$PARTNER" || { echo "FAIL AC-5.2: Interpreter Frame section missing"; exit 1; }
grep -qE '^## Private Precision Slot' "$PARTNER" || { echo "FAIL AC-5.2: Private Precision Slot section missing"; exit 1; }
grep -qE '^## Option-Naming Rule' "$PARTNER" || { echo "FAIL AC-5.2: Option-Naming Rule section missing"; exit 1; }
grep -qE '^## Self-Evaluation' "$PARTNER" || { echo "FAIL AC-5.2: Self-Evaluation section missing"; exit 1; }
grep -qE '^## Stance Principles' "$PARTNER" || { echo "FAIL AC-5.2: Stance Principles section missing"; exit 1; }

# AC-4.1: design-large-task per-turn flow contains C1+C2 cross-references
LARGE="$REPO_ROOT/skills/design-large-task/SKILL.md"
US_BLOCK=$(awk '/Step 6: Write commentary/,/Step 7:/' "$LARGE" | head -100)
SS_BLOCK=$(awk '/Step 8: Write commentary/,/Step 9:/' "$LARGE" | head -100)
echo "$US_BLOCK" | grep -qE 'C1.*C2|C2.*C1' || { echo "FAIL AC-4.1: Understand Stage Step 6 missing C1/C2 cross-reference"; exit 1; }
echo "$US_BLOCK" | grep -qi "util-design-partner-role" || { echo "FAIL AC-4.1: Understand Stage Step 6 cross-reference does not name util-design-partner-role"; exit 1; }
echo "$SS_BLOCK" | grep -qE 'C1.*C2|C2.*C1' || { echo "FAIL AC-4.1: Solve Stage Step 8 missing C1/C2 cross-reference"; exit 1; }
echo "$SS_BLOCK" | grep -qi "util-design-partner-role" || { echo "FAIL AC-4.1: Solve Stage Step 8 cross-reference does not name util-design-partner-role"; exit 1; }

# AC-4.2: design-small-task per-turn flow contains C1+C2 cross-reference
SMALL="$REPO_ROOT/skills/design-small-task/SKILL.md"
ST_BLOCK=$(awk '/Step 3: Write commentary/,/Step 4:/' "$SMALL" | head -100)
echo "$ST_BLOCK" | grep -qE 'C1.*C2|C2.*C1' || { echo "FAIL AC-4.2: Phase 4 Step 3 missing C1/C2 cross-reference"; exit 1; }
echo "$ST_BLOCK" | grep -qi "util-design-partner-role" || { echo "FAIL AC-4.2: Phase 4 Step 3 cross-reference does not name util-design-partner-role"; exit 1; }

echo "PASS: AC-1.1, AC-1.2, AC-1.3, AC-1.4, AC-1.5, AC-4.1, AC-4.2, AC-5.1, AC-5.2"
