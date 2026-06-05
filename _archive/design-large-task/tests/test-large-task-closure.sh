#!/usr/bin/env bash
set -euo pipefail

SKILL="skills/design-large-task/SKILL.md"
ERRORS=0

# Frontmatter description must not contain stale "experimental" / "fork" wording
DESC=$(awk '/^description:/,/^---$/' "$SKILL" | head -20)
for word in "experimental" "fork"; do
  if echo "$DESC" | grep -q -i "$word"; then
    echo "FAIL: frontmatter description contains forbidden word: $word"
    ERRORS=$((ERRORS + 1))
  fi
done

# Must not reference archived design-figure-out
if grep -q "design-figure-out" "$SKILL"; then
  echo "FAIL: $SKILL still references archived design-figure-out"
  ERRORS=$((ERRORS + 1))
fi

# Must define the five outer phases as section headers
for phase in "## Phase 1: Bootstrap" "## Phase 2: Parallel Context Exploration" "## Phase 3: Round One" "## Phase 4: Interview Loop" "## Phase 5: Closure"; do
  if ! grep -qF "$phase" "$SKILL"; then
    echo "FAIL: $SKILL missing outer phase header: $phase"
    ERRORS=$((ERRORS + 1))
  fi
done

# Must use stage names (not inner Phase 1/2) for Understand and Solve
for stage in "Understand Stage" "Solve Stage" "Stage Transition"; do
  if ! grep -qF "$stage" "$SKILL"; then
    echo "FAIL: $SKILL missing inner stage marker: $stage"
    ERRORS=$((ERRORS + 1))
  fi
done

# Closure must produce three artifacts (no ground-truth report at design stage anymore)
for artifact in "Design brief" "Thinking summary" "Process evidence"; do
  if ! grep -q "$artifact" "$SKILL"; then
    echo "FAIL: $SKILL missing Closure artifact: $artifact"
    ERRORS=$((ERRORS + 1))
  fi
done

# Must transition to design-specify
if ! grep -q "Transitions to:.*design-specify\|transition to design-specify\|transition to \`design-specify\`" "$SKILL"; then
  echo "FAIL: $SKILL does not transition to design-specify"
  ERRORS=$((ERRORS + 1))
fi

# Must NOT contain Finalization stage machinery (architecture choice moved to design-specify)
for forbidden in "## Finalization Stage" "Acceptance Preconditions (F-A-C)" "Axis Selection (Dispatcher)" "Architect Subagent Contract" "Hybrid Recommendation (Dispatcher)" "Envelope Handoff (Contract Boundary)"; do
  if grep -qF "$forbidden" "$SKILL"; then
    echo "FAIL: $SKILL contains forbidden Finalization-stage machinery: $forbidden"
    ERRORS=$((ERRORS + 1))
  fi
done

# Must NOT produce a design-stage ground-truth report (moved to design-specify spec stage)
if grep -q "ground-truth-report-00.md\|ground-truth report.*produced.*Envelope Handoff" "$SKILL"; then
  echo "FAIL: $SKILL still describes producing a design-stage ground-truth report"
  ERRORS=$((ERRORS + 1))
fi

# Closure procedure must include util-worktree creation
if ! grep -q "util-worktree" "$SKILL"; then
  echo "FAIL: $SKILL Closure does not invoke util-worktree"
  ERRORS=$((ERRORS + 1))
fi

# Closure procedure must include thinking.md lessons table update
if ! grep -q "thinking.md\|Key Reasoning Shifts" "$SKILL"; then
  echo "FAIL: $SKILL Closure does not update lessons table"
  ERRORS=$((ERRORS + 1))
fi

if [ "$ERRORS" -gt 0 ]; then
  echo "FAIL: $ERRORS errors in design-large-task Closure structure"
  exit 1
fi

echo "PASS: design-large-task Closure structure correct (five outer phases, three Closure artifacts, transition to design-specify, no Finalization machinery)"
exit 0
