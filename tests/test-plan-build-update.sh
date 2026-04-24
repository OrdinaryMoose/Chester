#!/usr/bin/env bash
# Verifies plan-build SKILL.md and plan-template.md are updated for the
# build-decision-loop: plan-build consults the decision store at plan-start,
# and the template carries loop-optimized per-task fields.

set -euo pipefail

ERRORS=0

SKILL="skills/plan-build/SKILL.md"
TEMPLATE="skills/plan-build/references/plan-template.md"

# (a) both files exist
for f in "$SKILL" "$TEMPLATE"; do
  if [ ! -f "$f" ]; then
    echo "FAIL: $f does not exist"
    ERRORS=$((ERRORS + 1))
  fi
done
if [ "$ERRORS" -gt 0 ]; then
  echo "FAIL: $ERRORS errors — required files missing"
  exit 1
fi

# (b) plan-build/SKILL.md references a dr_query call at plan-start
if ! grep -q 'dr_query' "$SKILL"; then
  echo "FAIL: $SKILL does not reference dr_query"
  ERRORS=$((ERRORS + 1))
fi
# The dr_query invocation must be tied to plan-start (the entry step).
if ! grep -qi 'plan.start\|plan-start\|at plan start\|plan start' "$SKILL"; then
  echo "FAIL: $SKILL does not situate dr_query at plan-start"
  ERRORS=$((ERRORS + 1))
fi
# It must mention the chester-decision-record MCP so the reader knows the
# provider, not just the bare tool name.
if ! grep -q 'chester-decision-record' "$SKILL"; then
  echo "FAIL: $SKILL does not reference the chester-decision-record MCP"
  ERRORS=$((ERRORS + 1))
fi
# It must instruct population of the Prior Decisions section from the returned
# records.
if ! grep -q 'Prior Decisions' "$SKILL"; then
  echo "FAIL: $SKILL does not describe populating the Prior Decisions section"
  ERRORS=$((ERRORS + 1))
fi

# (c) plan-template.md contains a Prior Decisions section with a populated-by
# note referencing dr_query.
if ! grep -q '^## Prior Decisions' "$TEMPLATE"; then
  echo "FAIL: $TEMPLATE missing '## Prior Decisions' section"
  ERRORS=$((ERRORS + 1))
fi
# The section must carry a note saying it is populated by dr_query.
if ! grep -qi 'populated by.*dr_query\|dr_query.*populate\|populated.*plan-build.*dr_query\|populated.*dr_query' "$TEMPLATE"; then
  echo "FAIL: $TEMPLATE does not note that Prior Decisions is populated by dr_query"
  ERRORS=$((ERRORS + 1))
fi

# (d) plan-template.md carries the four per-task loop-optimized fields.
for field in '\*\*Type:\*\*' '\*\*Implements:\*\*' '\*\*Decision budget:\*\*' '\*\*Must remain green:\*\*'; do
  if ! grep -q "$field" "$TEMPLATE"; then
    echo "FAIL: $TEMPLATE missing per-task field '$field'"
    ERRORS=$((ERRORS + 1))
  fi
done

if [ "$ERRORS" -gt 0 ]; then
  echo "FAIL: $ERRORS errors in plan-build update"
  exit 1
fi

echo "PASS: plan-build SKILL.md + plan-template.md carry dr_query plan-start step and loop-optimized task fields"
exit 0
