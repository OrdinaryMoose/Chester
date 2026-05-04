#!/usr/bin/env bash
# tests/test-trailer-harvest.sh — verify harvest subcommand behavior
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TRAILER="$SCRIPT_DIR/bin/chester-trailer-write"
# Case 7 invokes the local source directly to bypass the PATH wrapper's
# plugin-cache exec — needed for any case that exercises an un-released fix.
SCRIPT="$SCRIPT_DIR/chester-util-config/chester-trailer-write.sh"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

ERRORS=0
fail() { echo "FAIL: $1" >&2; ERRORS=$((ERRORS + 1)); }

# Build a synthetic sprint dir with three artifacts, varying skill+version chains.
mkdir -p "$TMP/sprint/design" "$TMP/sprint/spec" "$TMP/sprint/plan"

cat > "$TMP/sprint/design/foo-design-00.md" <<'EOF'
# Design

Body.

<!-- created-at: 2026-04-30T10:00:00Z -->
<!-- produced-by design-large-task@v0012 -->
<!-- produced-by design-specify@v0005 -->
EOF

cat > "$TMP/sprint/spec/foo-spec-00.md" <<'EOF'
# Spec

Body.

<!-- created-at: 2026-04-30T11:00:00Z -->
<!-- produced-by design-specify@v0005 -->
EOF

cat > "$TMP/sprint/plan/foo-plan-00.md" <<'EOF'
# Plan

Body.

<!-- created-at: 2026-04-30T12:00:00Z -->
<!-- produced-by plan-build@v0007 -->
<!-- produced-by plan-attack@v0003 -->
EOF

OUT="$("$TRAILER" harvest "$TMP/sprint")"

# Case 1: deduped — design-specify appears once
COUNT=$(echo "$OUT" | grep -c '<!-- produced-by design-specify@v0005 -->')
[ "$COUNT" = "1" ] || fail "case1: design-specify@v0005 not deduped (count=$COUNT)"

# Case 2: all unique (skill, version) tuples present
for tuple in 'design-large-task@v0012' 'design-specify@v0005' 'plan-build@v0007' 'plan-attack@v0003'; do
  echo "$OUT" | grep -q "<!-- produced-by $tuple -->" || fail "case2: missing $tuple"
done

# Case 3: ordered by earliest artifact created-at first-touch
LINE_DLT=$(echo "$OUT" | grep -n 'design-large-task@v0012' | head -1 | cut -d: -f1)
LINE_PB=$(echo "$OUT" | grep -n 'plan-build@v0007' | head -1 | cut -d: -f1)
[ "$LINE_DLT" -lt "$LINE_PB" ] || fail "case3: order wrong (DLT=$LINE_DLT PB=$LINE_PB)"

# Case 4: same skill at different versions — both kept
cat > "$TMP/sprint/plan/foo-plan-01.md" <<'EOF'
# Plan revision

Body.

<!-- created-at: 2026-04-30T13:00:00Z -->
<!-- produced-by plan-build@v0008 -->
EOF
OUT="$("$TRAILER" harvest "$TMP/sprint")"
echo "$OUT" | grep -q 'plan-build@v0007' || fail "case4: plan-build@v0007 lost"
echo "$OUT" | grep -q 'plan-build@v0008' || fail "case4: plan-build@v0008 missing"

# Case 5: missing dir → exit non-zero
if "$TRAILER" harvest "$TMP/missing" 2>/dev/null; then
  fail "case5: harvest of missing dir should fail"
fi

# Case 6: deterministic order when two artifacts share an identical created-at
# (1-second-granularity collision). Tiebreak must be by file path, not by
# filesystem traversal order.
mkdir -p "$TMP/sprint2/design" "$TMP/sprint2/spec"
cat > "$TMP/sprint2/spec/zzz-spec-00.md" <<'EOF'
# Spec
<!-- created-at: 2026-04-30T15:00:00Z -->
<!-- produced-by skill-z@v0001 -->
EOF
cat > "$TMP/sprint2/design/aaa-design-00.md" <<'EOF'
# Design
<!-- created-at: 2026-04-30T15:00:00Z -->
<!-- produced-by skill-a@v0001 -->
EOF
OUT1="$("$TRAILER" harvest "$TMP/sprint2")"
OUT2="$("$TRAILER" harvest "$TMP/sprint2")"
[ "$OUT1" = "$OUT2" ] || fail "case6: harvest output not deterministic across runs"
# Path 'design/aaa-...' sorts before 'spec/zzz-...' alphabetically, so skill-a
# must come before skill-z in the output.
LINE_A=$(echo "$OUT1" | grep -n 'skill-a@v0001' | cut -d: -f1)
LINE_Z=$(echo "$OUT1" | grep -n 'skill-z@v0001' | cut -d: -f1)
[ -n "$LINE_A" ] && [ -n "$LINE_Z" ] && [ "$LINE_A" -lt "$LINE_Z" ] \
  || fail "case6: file-path tiebreak failed (a=$LINE_A z=$LINE_Z)"

# Case 7: tolerate un-stamped artifacts (task-02 bug fix).
# Older artifacts predating the stamping convention have no <!-- created-at: ... -->
# trailer. Without the fix, `set -euo pipefail` plus the no-match grep silently
# aborts the script before the line-80 fallback can run. Invoke local source
# directly (not via wrapper) so the test exercises the in-worktree fix, not
# the plugin-cache copy.
mkdir -p "$TMP/sprint3"
cat > "$TMP/sprint3/unstamped.md" <<'EOF'
# Older artifact predating the stamping convention
content
EOF
cat > "$TMP/sprint3/stamped.md" <<'EOF'
# Stamped
<!-- created-at: 2026-04-30T16:00:00Z -->
<!-- produced-by skill-foo@v0001 -->
EOF
OUT="$(bash "$SCRIPT" harvest "$TMP/sprint3")" \
  || fail "case7: harvest aborted on un-stamped artifact (exit $?)"
echo "$OUT" | grep -Fxq "<!-- produced-by skill-foo@v0001 -->" \
  || fail "case7: stamped artifact's produced-by line missing from output"

if [ "$ERRORS" -gt 0 ]; then
  echo "FAIL: $ERRORS error(s) in trailer-write harvest"
  exit 1
fi
echo "PASS: trailer-write harvest behavior correct"
