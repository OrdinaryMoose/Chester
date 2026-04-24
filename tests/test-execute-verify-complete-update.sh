#!/usr/bin/env bash
set -euo pipefail

# Verifies execute-verify-complete/SKILL.md gained the dr_verify_tests linkage
# check between suite-pass (existing Step 1) and clean-tree (existing Step 2).
# The insertion preserves Iron Law ordering: suite-pass first so per-test
# statuses are reliable; clean-tree after so record-fix commits land cleanly.

SKILL="skills/execute-verify-complete/SKILL.md"
ERRORS=0

fail() {
  echo "FAIL: $1" >&2
  ERRORS=$((ERRORS + 1))
}

if [ ! -f "$SKILL" ]; then
  fail "$SKILL not found"
  exit 1
fi

# Step header for the new linkage-verification step.
if ! grep -qi "Verify Decision-Record Linkage" "$SKILL"; then
  fail "$SKILL missing Step: Verify Decision-Record Linkage"
fi

# The step must invoke dr_verify_tests on the chester-decision-record MCP.
if ! grep -q "dr_verify_tests" "$SKILL"; then
  fail "$SKILL does not invoke dr_verify_tests"
fi

# BLOCK behavior on failure must be documented.
if ! grep -qi "aggregate.*fail\|sha_finalized.*false\|Cannot mark sprint complete" "$SKILL"; then
  fail "$SKILL does not document BLOCK behavior on record-test failure"
fi

# Ordering: linkage check AFTER suite-pass (Step 1), BEFORE clean-tree.
# Assert linkage step appears before clean-tree section.
LINKAGE_LINE=$(grep -n "Verify Decision-Record Linkage" "$SKILL" | head -1 | cut -d: -f1)
CLEAN_TREE_LINE=$(grep -n "Verify Clean Tree" "$SKILL" | head -1 | cut -d: -f1)

if [ -z "${LINKAGE_LINE:-}" ] || [ -z "${CLEAN_TREE_LINE:-}" ]; then
  fail "could not locate linkage and clean-tree step lines for ordering check"
elif [ "$LINKAGE_LINE" -ge "$CLEAN_TREE_LINE" ]; then
  fail "linkage step must precede clean-tree step (linkage=$LINKAGE_LINE, clean-tree=$CLEAN_TREE_LINE)"
fi

# Rationale for the insertion order should be explicit.
if ! grep -qi "rationale\|suite-pass must be confirmed first\|per-test status" "$SKILL"; then
  fail "$SKILL does not document rationale for insertion order"
fi

if [ $ERRORS -gt 0 ]; then
  echo "FAIL: $ERRORS error(s)"
  exit 1
fi

echo "PASS: execute-verify-complete correctly invokes dr_verify_tests between suite-pass and clean-tree"
