#!/usr/bin/env bash
# test-decision-record-supersession.sh — verify supersession-by-forward-scan behavior
set -euo pipefail

TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT
CORPUS="$TMPDIR/decision-record.md"

# Seed corpus with record A and record B (B supersedes A).
cat > "$CORPUS" <<'EOF'
---
id: dr-20260101-01-original
date: 2026-01-01
sprint: 20260101-01-original-sprint
stage: design-large-task
title: Original decision
decision: Use approach X.
rationale: Initial reasoning.
alternatives: []
tags: [architecture]
supersedes: null
artifact_refs: []
---

---
id: dr-20260201-01-revised
date: 2026-02-01
sprint: 20260201-01-revised-sprint
stage: design-large-task
title: Revised decision
decision: Use approach Y instead of X.
rationale: New evidence emerged.
alternatives:
  - Approach X — superseded; original reasoning no longer holds.
tags: [architecture, revert]
supersedes: dr-20260101-01-original
artifact_refs: []
---
EOF

# Snapshot the original-record bytes BEFORE the supersession scan.
RECORD_A_HASH_BEFORE=$(sed -n '1,12p' "$CORPUS" | sha256sum | cut -d' ' -f1)

# Forward-scan procedure: given record A's id, find records that supersede it.
# Uses awk because YAML field order places `tags:` immediately before `supersedes:`,
# so `grep -B1 "^supersedes:"` would return `tags:`, not `id:`.
SUPERSEDER=$(awk '
  /^id: / { last_id = $2 }
  $0 == "supersedes: dr-20260101-01-original" { print last_id; exit }
' "$CORPUS")

if [ "$SUPERSEDER" != "dr-20260201-01-revised" ]; then
  echo "FAIL: forward-scan did not find the superseder. Got: '$SUPERSEDER'" >&2
  exit 1
fi

# Verify record A is byte-identical post-scan (read-only operation).
RECORD_A_HASH_AFTER=$(sed -n '1,12p' "$CORPUS" | sha256sum | cut -d' ' -f1)
if [ "$RECORD_A_HASH_BEFORE" != "$RECORD_A_HASH_AFTER" ]; then
  echo "FAIL: record A modified during forward-scan (append-only invariant violated)" >&2
  exit 1
fi

echo "PASS: supersession-by-forward-scan verified, append-only invariant preserved"
