#!/usr/bin/env bash
set -euo pipefail

ERRORS=0

SKILL="skills/execute-write/SKILL.md"
IMPLEMENTER="skills/execute-write/references/implementer.md"
SPEC_REVIEWER="skills/execute-write/references/spec-reviewer.md"

for f in "$SKILL" "$IMPLEMENTER" "$SPEC_REVIEWER"; do
  if [ ! -f "$f" ]; then
    echo "FAIL: $f does not exist"
    ERRORS=$((ERRORS + 1))
  fi
done

if [ "$ERRORS" -gt 0 ]; then
  echo "FAIL: $ERRORS errors — required files missing"
  exit 1
fi

# (a) SKILL.md Section 2.1 contains a Decision-Record Trigger Check and Propagation step
if ! grep -qi 'Decision-Record Trigger Check and Propagation' "$SKILL"; then
  echo "FAIL: $SKILL missing 'Decision-Record Trigger Check and Propagation' step"
  ERRORS=$((ERRORS + 1))
fi

# (b-i) skip for non-code tasks (docs-producing / config-producing)
if ! grep -qi 'docs-producing' "$SKILL"; then
  echo "FAIL: $SKILL trigger step must document skip for docs-producing tasks"
  ERRORS=$((ERRORS + 1))
fi
if ! grep -qi 'config-producing' "$SKILL"; then
  echo "FAIL: $SKILL trigger step must document skip for config-producing tasks"
  ERRORS=$((ERRORS + 1))
fi

# (b-ii) skeleton-coverage diff
if ! grep -qi 'skeleton-coverage diff\|skeleton coverage' "$SKILL"; then
  echo "FAIL: $SKILL trigger step must document skeleton-coverage diff"
  ERRORS=$((ERRORS + 1))
fi

# (b-iii) dr_capture on FIRE
if ! grep -q 'dr_capture' "$SKILL"; then
  echo "FAIL: $SKILL trigger step must document dr_capture on FIRE"
  ERRORS=$((ERRORS + 1))
fi
if ! grep -qi 'FIRE' "$SKILL"; then
  echo "FAIL: $SKILL trigger step must mention FIRE condition"
  ERRORS=$((ERRORS + 1))
fi

# (b-iv) propagation per propagation-procedure.md
if ! grep -q 'propagation-procedure.md' "$SKILL"; then
  echo "FAIL: $SKILL trigger step must reference propagation-procedure.md"
  ERRORS=$((ERRORS + 1))
fi

# (b-v) post-commit dr_finalize_refs call before DONE
if ! grep -q 'dr_finalize_refs' "$SKILL"; then
  echo "FAIL: $SKILL trigger step must document dr_finalize_refs call"
  ERRORS=$((ERRORS + 1))
fi
if ! grep -qi 'before task.*DONE\|before.*marked DONE\|before.*done in TodoWrite' "$SKILL"; then
  echo "FAIL: $SKILL trigger step must document finalize happens before task marked DONE"
  ERRORS=$((ERRORS + 1))
fi

# (c) Red Flags includes trigger-check entry
if ! grep -qi 'trigger check\|trigger-check\|decision-record trigger' "$SKILL"; then
  echo "FAIL: $SKILL Red Flags must contain a trigger-check entry"
  ERRORS=$((ERRORS + 1))
fi

# (d) implementer.md requires observable-behaviors.md artifact with canonical form
if ! grep -q 'observable-behaviors.md' "$IMPLEMENTER"; then
  echo "FAIL: $IMPLEMENTER must require observable-behaviors.md artifact"
  ERRORS=$((ERRORS + 1))
fi
if ! grep -qi 'canonical form\|canonical-form' "$IMPLEMENTER"; then
  echo "FAIL: $IMPLEMENTER must document canonical form for observable behaviors"
  ERRORS=$((ERRORS + 1))
fi
if ! grep -qi 'skeleton coverage\|skeleton-coverage\|skeleton manifest' "$IMPLEMENTER"; then
  echo "FAIL: $IMPLEMENTER must document skeleton coverage check"
  ERRORS=$((ERRORS + 1))
fi

# (e) spec-reviewer.md verifies record alignment: Spec Update matches clause, Test has SHA
if ! grep -qi 'decision.record alignment\|decision-record alignment' "$SPEC_REVIEWER"; then
  echo "FAIL: $SPEC_REVIEWER must include decision-record alignment verification"
  ERRORS=$((ERRORS + 1))
fi
if ! grep -qi 'Spec Update' "$SPEC_REVIEWER"; then
  echo "FAIL: $SPEC_REVIEWER must verify Spec Update field matches spec clause"
  ERRORS=$((ERRORS + 1))
fi
if ! grep -qi 'SHA' "$SPEC_REVIEWER"; then
  echo "FAIL: $SPEC_REVIEWER must verify Test field carries SHA suffix"
  ERRORS=$((ERRORS + 1))
fi
if ! grep -q 'dr_finalize_refs' "$SPEC_REVIEWER"; then
  echo "FAIL: $SPEC_REVIEWER must reference dr_finalize_refs (flag if implementer forgot to call)"
  ERRORS=$((ERRORS + 1))
fi

if [ "$ERRORS" -gt 0 ]; then
  echo "FAIL: $ERRORS errors in execute-write update"
  exit 1
fi

echo "PASS: execute-write SKILL.md + implementer + spec-reviewer updates present"
exit 0
