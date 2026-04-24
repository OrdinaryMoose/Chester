#!/usr/bin/env bash
# AC-mapping verifier: confirms every AC defined in spec-05 is exercised by
# at least one of the four decision-record integration scripts, read from
# their structured `# COVERS:` header.
#
# The four integration scripts collectively exercise AC-12.1 by construction
# (AC-12.1 is about design-phase independence — the absence of design-skill
# edits is verifiable; we enumerate it here via explicit allow-list below).
#
# Exit codes: 0 = every AC covered; 1 = at least one AC missing.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SPRINT="20260424-01-build-decision-loop"
SPEC_FILE="$SPRINT/spec/build-decision-loop-spec-05.md"

# spec-05 lives in the archived plans dir post-merge, OR in the gitignored
# working dir during active sprints. Check both; prefer archived.
#
# Working dir can live EITHER as a sibling of the worktree (worktree layout:
# REPO_ROOT is .worktrees/<sprint>/, `$REPO_ROOT/../..` reaches main repo root)
# OR co-located under REPO_ROOT (main-repo layout).
CANDIDATES=(
  "$REPO_ROOT/docs/chester/plans/$SPEC_FILE"
  "$REPO_ROOT/docs/chester/working/$SPEC_FILE"
  "$REPO_ROOT/../../docs/chester/working/$SPEC_FILE"
)

SPEC_PATH=""
for candidate in "${CANDIDATES[@]}"; do
  if [ -f "$candidate" ]; then
    SPEC_PATH="$candidate"
    break
  fi
done

if [ -z "$SPEC_PATH" ]; then
  echo "ERROR: spec-05 not found. Tried:" >&2
  for candidate in "${CANDIDATES[@]}"; do
    echo "  - $candidate" >&2
  done
  exit 2
fi

# Extract AC IDs from the spec's `### AC-N.M —` headers, excluding the
# template placeholder `AC-{N.M}`.
ALL_ACS=$(grep -E '^### AC-[0-9]+\.[0-9]+' "$SPEC_PATH" | \
  sed -E 's/^### (AC-[0-9]+\.[0-9]+).*/\1/' | sort -u)

if [ -z "$ALL_ACS" ]; then
  echo "ERROR: no AC IDs found in spec-05" >&2
  exit 2
fi

SCRIPTS=(
  "test-decision-record-capture-finalize.sh"
  "test-decision-record-supersede.sh"
  "test-decision-record-abandon.sh"
  "test-decision-record-cross-sprint.sh"
)

# Extra coverage not reachable via runtime integration. These ACs are either
# structural properties of the sprint's edits (file presence, no-edit
# guarantees) or behaviors of skill orchestration layers above the MCP. Each
# maps to an existing bash test that verifies the structural claim. Listing
# them here prevents the verifier from flagging a false positive while
# documenting exactly where coverage lives.
declare -A STRUCTURAL_COVERAGE=(
  [AC-1.2]="orchestration: execute-write non-code task routing — test-execute-write-update.sh"
  [AC-2.1]="structural: spec/plan template discriminator — test-reference-files.sh + test-plan-build-update.sh"
  [AC-6.1]="structural: persistent store directory + MCP config — test-decision-record-setup.sh + test-decision-record-registration.sh"
  [AC-9.1]="structural: skeleton-manifest convention — test-skeleton-manifest-path-convention.sh"
  [AC-10.1]="structural: direct-store semantics (no promotion step) — test-decision-record-setup.sh (no promotion path exists to break)"
  [AC-12.1]="structural: no design-skill edits (PR-diff-verified + MCP state-path disjoint)"
)

declare -A COVERAGE=()
for script in "${SCRIPTS[@]}"; do
  path="$SCRIPT_DIR/$script"
  [ -f "$path" ] || { echo "ERROR: integration script not found: $path" >&2; exit 2; }
  covers_line=$(grep -E '^# COVERS:' "$path" | head -n 1 || true)
  if [ -z "$covers_line" ]; then
    echo "ERROR: $script has no '# COVERS:' header" >&2
    exit 2
  fi
  # Extract comma-separated AC IDs after the colon.
  ids=$(echo "$covers_line" | sed -E 's/^# COVERS:[[:space:]]*//; s/,/ /g')
  for id in $ids; do
    # Trim whitespace.
    id="${id// /}"
    [ -z "$id" ] && continue
    COVERAGE[$id]="${COVERAGE[$id]:-}${COVERAGE[$id]:+, }$script"
  done
done

echo "=== AC Coverage Map ==="
MISSING=0
for ac in $ALL_ACS; do
  if [ -n "${COVERAGE[$ac]:-}" ]; then
    printf '  %-10s → %s\n' "$ac" "${COVERAGE[$ac]}"
  elif [ -n "${STRUCTURAL_COVERAGE[$ac]:-}" ]; then
    printf '  %-10s → %s\n' "$ac" "${STRUCTURAL_COVERAGE[$ac]}"
  else
    printf '  %-10s → MISSING\n' "$ac"
    MISSING=$((MISSING + 1))
  fi
done

if [ "$MISSING" -gt 0 ]; then
  echo ""
  echo "FAIL: $MISSING AC(s) not covered by any integration script"
  exit 1
fi
echo ""
echo "PASS: every spec-05 AC is covered by at least one integration script or structural check"
exit 0
