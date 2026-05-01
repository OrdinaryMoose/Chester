#!/usr/bin/env bash
# test-decision-record-emission.sh — verify Decision Record Format conformance
set -euo pipefail

TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT
CORPUS="$TMPDIR/decision-record.md"

# Build a fixture corpus with two records matching the spec shape.
cat > "$CORPUS" <<'EOF'
---
id: dr-20260501-01-fork-pattern-emission
date: 2026-05-01
sprint: 20260501-01-fix-decision-record
stage: design-large-task
title: Audit-time records emission via parallel fork
decision: Records are emitted at finish-write-records Step 3 via a second forked subagent.
rationale: The audit fork already discriminates substantive decisions from the JSONL transcript. Forking a second subagent reuses the machinery.
alternatives:
  - Per-decision MCP capture — rejected because MCP is forbidden by RULE-9.
tags: [architecture, capture]
supersedes: null
artifact_refs:
  - working/20260501-01-fix-decision-record/spec/fix-decision-record-spec-00.md
---

---
id: dr-20260501-02-mcp-removal
date: 2026-05-01
sprint: 20260501-01-fix-decision-record
stage: design-large-task
title: Remove chester-decision-record MCP package
decision: The chester-decision-record MCP server is removed entirely, including all dr_* tools.
rationale: RULE-9 forbids MCP usage for capture. The package was inverse-coupled to good upstream design and never fired in production.
alternatives:
  - Soft-disable via flag — rejected because silent inertness is dangerous (industry pattern).
tags: [mcp, revert, capture]
supersedes: null
artifact_refs:
  - working/20260501-01-fix-decision-record/design/fix-decision-record-design-00.md
---
EOF

# Assertion 1: file is well-formed (each record bounded by --- markers).
DELIM_COUNT=$(grep -c '^---$' "$CORPUS")
if [ "$DELIM_COUNT" -ne 4 ]; then
  echo "FAIL: expected 4 '---' delimiters (2 records × 2 each), got $DELIM_COUNT" >&2
  exit 1
fi

# Assertion 2: each record contains all 11 required fields.
REQUIRED_FIELDS=(id date sprint stage title decision rationale alternatives tags supersedes artifact_refs)
RECORD_COUNT=$((DELIM_COUNT / 2))
for field in "${REQUIRED_FIELDS[@]}"; do
  # grep -c exits non-zero when zero matches; trap with || true so set -e doesn't abort before the diagnostic.
  field_count=$(grep -c "^${field}:" "$CORPUS" || true)
  if [ "$field_count" -ne "$RECORD_COUNT" ]; then
    echo "FAIL: field '$field' appears $field_count times, expected $RECORD_COUNT (one per record)" >&2
    exit 1
  fi
done

# Assertion 3: append-only invariant — append a third record and verify the first two are unchanged byte-for-byte.
ORIG_HASH=$(sha256sum "$CORPUS" | cut -d' ' -f1)
ORIG_BYTES=$(wc -c < "$CORPUS")

cat >> "$CORPUS" <<'EOF'

---
id: dr-20260501-03-cooperative-coexistence
date: 2026-05-01
sprint: 20260501-01-fix-decision-record
stage: design-large-task
title: Records cooperate with session artifacts, do not replace
decision: The records corpus and session artifacts both exist; both can contain duplicate information.
rationale: Session artifacts serve session-internal recall; records serve cross-sprint trend-finding. Different purposes, complementary surfaces.
alternatives:
  - Records replace audit — rejected because audit is session-recall-anchored and tunable independently.
tags: [architecture, capture]
supersedes: null
artifact_refs: []
---
EOF

# Verify the original two records are still present byte-for-byte at the start of the file.
# (Pipe head -c directly to sha256sum — command substitution would strip trailing newlines
# and break the byte-for-byte comparison.)
PREFIX_HASH=$(head -c "$ORIG_BYTES" "$CORPUS" | sha256sum | cut -d' ' -f1)
if [ "$PREFIX_HASH" != "$ORIG_HASH" ]; then
  echo "FAIL: append modified the prefix (append-only invariant violated)" >&2
  exit 1
fi

# Assertion 4: id format conforms to dr-YYYYMMDD-NN-<slug>.
while IFS= read -r line; do
  if ! [[ "$line" =~ ^id:\ dr-[0-9]{8}-[0-9]{2}-[a-z0-9-]+$ ]]; then
    echo "FAIL: id line does not match format: $line" >&2
    exit 1
  fi
done < <(grep '^id:' "$CORPUS")

echo "PASS: emission format conformance verified"
