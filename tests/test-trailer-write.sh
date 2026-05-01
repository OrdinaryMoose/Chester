#!/usr/bin/env bash
# tests/test-trailer-write.sh — verify stamp subcommand behavior
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TRAILER="$SCRIPT_DIR/bin/chester-trailer-write"

# Sandbox
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

ERRORS=0
fail() { echo "FAIL: $1" >&2; ERRORS=$((ERRORS + 1)); }

# Case 1: stamp on a fresh file appends created-at + produced-by block
echo "# Hello" > "$TMP/a.md"
"$TRAILER" stamp "design-large-task@v0001" "$TMP/a.md"
grep -q '<!-- created-at: ' "$TMP/a.md" || fail "case1: created-at not added"
grep -q '<!-- produced-by design-large-task@v0001 -->' "$TMP/a.md" || fail "case1: produced-by not added"

# Case 2: stamp same skill+version twice → idempotent (no second produced-by line)
"$TRAILER" stamp "design-large-task@v0001" "$TMP/a.md"
COUNT=$(grep -c '<!-- produced-by design-large-task@v0001 -->' "$TMP/a.md")
[ "$COUNT" = "1" ] || fail "case2: dedupe failed (count=$COUNT)"

# Case 3: stamp same skill at new version → both entries kept, in order
"$TRAILER" stamp "design-large-task@v0002" "$TMP/a.md"
grep -q '<!-- produced-by design-large-task@v0001 -->' "$TMP/a.md" || fail "case3: prior version dropped"
grep -q '<!-- produced-by design-large-task@v0002 -->' "$TMP/a.md" || fail "case3: new version not added"
LINE_V1=$(grep -n '<!-- produced-by design-large-task@v0001 -->' "$TMP/a.md" | head -1 | cut -d: -f1)
LINE_V2=$(grep -n '<!-- produced-by design-large-task@v0002 -->' "$TMP/a.md" | head -1 | cut -d: -f1)
[ "$LINE_V1" -lt "$LINE_V2" ] || fail "case3: order wrong (v1=$LINE_V1 v2=$LINE_V2)"

# Case 4: created-at is preserved (frozen) across stamps
CREATED_AT=$(grep '<!-- created-at: ' "$TMP/a.md")
"$TRAILER" stamp "plan-build@v0003" "$TMP/a.md"
CREATED_AT_AFTER=$(grep '<!-- created-at: ' "$TMP/a.md")
[ "$CREATED_AT" = "$CREATED_AT_AFTER" ] || fail "case4: created-at changed across stamps"

# Case 5: multiple skills, in first-touch order
COUNT=$(grep -c '<!-- produced-by ' "$TMP/a.md")
[ "$COUNT" = "3" ] || fail "case5: expected 3 produced-by lines (got $COUNT)"

# Case 6: missing args → exit non-zero
if "$TRAILER" stamp 2>/dev/null; then fail "case6: stamp without args should fail"; fi
if "$TRAILER" 2>/dev/null; then fail "case6: bare invocation should fail"; fi

# Case 7: missing file → exit non-zero
if "$TRAILER" stamp "x@v0001" "$TMP/missing.md" 2>/dev/null; then
  fail "case7: stamping missing file should fail"
fi

# Case 8: trailer block separated from content by blank line
echo "# B" > "$TMP/b.md"
"$TRAILER" stamp "x@v0001" "$TMP/b.md"
# expect: header, blank line, then trailer block at end
TAIL3=$(tail -3 "$TMP/b.md")
echo "$TAIL3" | head -1 | grep -qE '^$' || fail "case8: missing blank line before trailer"

# Case 9: column-0 trailer-format examples mid-file (e.g., inside fenced code
# blocks) must NOT register as the artifact's own trailer block. The detector
# anchors to the last 20 lines of the file.
cat > "$TMP/c.md" <<'EOF'
# Doc with embedded examples

The trailer format looks like:

```
<!-- created-at: 2026-04-30T00:00:00Z -->
<!-- produced-by some-skill@v0001 -->
```

End of body content. Plus 20+ lines of filler so the example is well past
the last-20-lines window the detector looks at.
EOF
# Pad with 25 filler lines so the example is outside the last-20 window.
for i in $(seq 1 25); do echo "filler line $i" >> "$TMP/c.md"; done
"$TRAILER" stamp "doc@v0001" "$TMP/c.md"
# Should add a fresh trailer block (created-at + produced-by) at end,
# NOT have appended only a produced-by under the mid-file example.
LAST_TWO=$(tail -2 "$TMP/c.md")
echo "$LAST_TWO" | grep -q '<!-- created-at: ' || fail "case9: created-at not added (false-positive detection of mid-file example)"
echo "$LAST_TWO" | grep -q '<!-- produced-by doc@v0001 -->' || fail "case9: produced-by not added at end"
# The example block's literal lines remain intact (not modified)
grep -q '<!-- produced-by some-skill@v0001 -->' "$TMP/c.md" || fail "case9: example line was disturbed"

if [ "$ERRORS" -gt 0 ]; then
  echo "FAIL: $ERRORS error(s) in trailer-write stamp"
  exit 1
fi
echo "PASS: trailer-write stamp behavior correct"
