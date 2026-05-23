#!/usr/bin/env bash
set -euo pipefail

SCHEMA_DIR="$(dirname "$0")/../skills/design-architect-committee/schema"
fail=0

assert_file() {
  if [ -s "$SCHEMA_DIR/$1" ]; then
    echo "PASS: $1 exists non-empty"
  else
    echo "FAIL: $1 missing/empty"
    fail=1
  fi
}

assert_contains() {
  if grep -qF -- "$2" "$SCHEMA_DIR/$1"; then
    echo "PASS: $1 contains '$2'"
  else
    echo "FAIL: $1 missing '$2'"
    fail=1
  fi
}

# --- Seven schema files exist non-empty ---
assert_file "integrity-rules.md"
assert_file "phases-and-transitions.md"
assert_file "procedures.md"
assert_file "actors.md"
assert_file "constraint-envelope.md"
assert_file "resolution-criterion.md"
assert_file "coverage-map.md"

# --- AC-3.1 constraint-envelope.md: six fields ---
assert_contains "constraint-envelope.md" "concern_id"
assert_contains "constraint-envelope.md" "entry_id"
assert_contains "constraint-envelope.md" "source"
assert_contains "constraint-envelope.md" "body"
assert_contains "constraint-envelope.md" "provenance"
assert_contains "constraint-envelope.md" "status"

# --- AC-3.2 resolution-criterion.md: four fields + IF NOT/THEN + AXIOM exclusion ---
assert_contains "resolution-criterion.md" "concern_id"
assert_contains "resolution-criterion.md" "entry_id"
assert_contains "resolution-criterion.md" "collapse_test"
assert_contains "resolution-criterion.md" "structural_valid"
assert_contains "resolution-criterion.md" "IF NOT"
assert_contains "resolution-criterion.md" "THEN"
assert_contains "resolution-criterion.md" "AXIOM rows have no"

# --- AC-3.3 coverage-map.md: five fields + three ENUM values + close-gate string ---
assert_contains "coverage-map.md" "concern_id"
assert_contains "coverage-map.md" "axiom_ids"
assert_contains "coverage-map.md" "proposition_ids"
assert_contains "coverage-map.md" "evidence_ids"
assert_contains "coverage-map.md" "status"
assert_contains "coverage-map.md" "COVERED"
assert_contains "coverage-map.md" "AXIOM-ONLY"
assert_contains "coverage-map.md" "GAP"
assert_contains "coverage-map.md" "Blocks session close"

# --- AC-3.4 phases-and-transitions.md: five phase names + load-bearing string ---
assert_contains "phases-and-transitions.md" "OPEN"
assert_contains "phases-and-transitions.md" "ANCHORED"
assert_contains "phases-and-transitions.md" "DELIBERATING"
assert_contains "phases-and-transitions.md" "RATIFYING"
assert_contains "phases-and-transitions.md" "CLOSED"
assert_contains "phases-and-transitions.md" "No transition fires automatically"

# --- AC-3.5 procedures.md: all 12 procedure names ---
assert_contains "procedures.md" "Add Concern"
assert_contains "procedures.md" "Add Evidence"
assert_contains "procedures.md" "Add Axiom"
assert_contains "procedures.md" "Initiate Deliberation"
assert_contains "procedures.md" "Propose Proposition"
assert_contains "procedures.md" "Submit Round"
assert_contains "procedures.md" "Lint Batch"
assert_contains "procedures.md" "Ratify Row"
assert_contains "procedures.md" "Re-Ratify Row"
assert_contains "procedures.md" "Revise Row"
assert_contains "procedures.md" "Withdraw Entry"
assert_contains "procedures.md" "Close Session"

# --- AC-3.6 actors.md: five roles + four section headings + caveman ultra ---
assert_contains "actors.md" "Designer"
assert_contains "actors.md" "Pole"
assert_contains "actors.md" "Clerk"
assert_contains "actors.md" "Team-Lead"
assert_contains "actors.md" "Researcher"
assert_contains "actors.md" "Role Inventory"
assert_contains "actors.md" "Procedure-Actor Map"
assert_contains "actors.md" "Designer Surface Per Phase"
assert_contains "actors.md" "Convening-Message Discipline"
assert_contains "actors.md" "caveman ultra"

# --- AC-3.7 integrity-rules.md: sections + key terms ---
assert_contains "integrity-rules.md" "FK Rules"
assert_contains "integrity-rules.md" "Session-Close Gate"
assert_contains "integrity-rules.md" "concern_id"
assert_contains "integrity-rules.md" "GAP"
assert_contains "integrity-rules.md" "REVISED-PENDING"

if [ "$fail" -eq 0 ]; then
  echo "schema structural tests passed"
  exit 0
else
  exit 1
fi
