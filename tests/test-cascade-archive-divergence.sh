#!/usr/bin/env bash
# test-cascade-archive-divergence.sh — verify chester-cascade-diff categorization
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
DIFF="$REPO_ROOT/bin/chester-cascade-diff"

TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

ERRORS=0
fail() { echo "FAIL: $1" >&2; ERRORS=$((ERRORS + 1)); }

# ---------------------------------------------------------------------------
# Scenario 1: MATCH — identical content on both sides → exit 0, MATCH line emitted
# ---------------------------------------------------------------------------
W1="$TMPDIR/s1/working"; P1="$TMPDIR/s1/plans"
mkdir -p "$W1" "$P1"
echo "same content" > "$W1/file-a.md"
echo "same content" > "$P1/file-a.md"
if ! out1=$("$DIFF" "$W1" "$P1"); then
  fail "scenario 1: expected exit 0 (all MATCH), got non-zero"
fi
echo "$out1" | grep -q "^MATCH file-a.md$" || fail "scenario 1: no MATCH line for file-a.md"
if echo "$out1" | grep -qE "^(CONFLICT|PLANS_ONLY|WORKING_ONLY) "; then
  fail "scenario 1: unexpected non-MATCH line"
fi

# ---------------------------------------------------------------------------
# Scenario 2: PLANS_ONLY — file exists only in plans/ → exit 1, PLANS_ONLY line emitted
# ---------------------------------------------------------------------------
W2="$TMPDIR/s2/working"; P2="$TMPDIR/s2/plans"
mkdir -p "$W2" "$P2/ADR"
echo "new ADR content" > "$P2/ADR/0019-new.md"
out2=$("$DIFF" "$W2" "$P2") && fail "scenario 2: expected exit 1, got 0" || true
echo "$out2" | grep -q "^PLANS_ONLY ADR/0019-new.md$" || fail "scenario 2: no PLANS_ONLY line"

# Scenario 2b: apply the auto-sync inline and re-run; expect exit 0 and MATCH
mkdir -p "$W2/ADR"
cp "$P2/ADR/0019-new.md" "$W2/ADR/0019-new.md"
if ! out2b=$("$DIFF" "$W2" "$P2"); then
  fail "scenario 2b: expected exit 0 after auto-sync, got non-zero (output: $out2b)"
fi
echo "$out2b" | grep -q "^MATCH ADR/0019-new.md$" || fail "scenario 2b: no MATCH line after sync"

# ---------------------------------------------------------------------------
# Scenario 3: WORKING_ONLY — file exists only in working/ → exit 1, WORKING_ONLY line emitted
# ---------------------------------------------------------------------------
W3="$TMPDIR/s3/working"; P3="$TMPDIR/s3/plans"
mkdir -p "$W3" "$P3"
echo "stale working content" > "$W3/orphan.md"
out3=$("$DIFF" "$W3" "$P3") && fail "scenario 3: expected exit 1, got 0" || true
echo "$out3" | grep -q "^WORKING_ONLY orphan.md$" || fail "scenario 3: no WORKING_ONLY line"

# ---------------------------------------------------------------------------
# Scenario 4: CONFLICT — file present both sides with differing content → exit 1, CONFLICT line with both hashes
# ---------------------------------------------------------------------------
W4="$TMPDIR/s4/working"; P4="$TMPDIR/s4/plans"
mkdir -p "$W4" "$P4"
echo "old content" > "$W4/conflict.md"
echo "new content" > "$P4/conflict.md"
out4=$("$DIFF" "$W4" "$P4") && fail "scenario 4: expected exit 1, got 0" || true
echo "$out4" | grep -qE "^CONFLICT [a-f0-9]{64} [a-f0-9]{64} conflict\.md$" \
  || fail "scenario 4: no well-formed CONFLICT line with two SHA-256 hashes"

# Scenario 4b: CONFLICT relpath with embedded spaces — must survive emit format
W4b="$TMPDIR/s4b/working"; P4b="$TMPDIR/s4b/plans"
mkdir -p "$W4b" "$P4b"
echo "old" > "$W4b/file with spaces.md"
echo "new" > "$P4b/file with spaces.md"
out4b=$("$DIFF" "$W4b" "$P4b") && fail "scenario 4b: expected exit 1, got 0" || true
echo "$out4b" | grep -qE "^CONFLICT [a-f0-9]{64} [a-f0-9]{64} file with spaces\.md$" \
  || fail "scenario 4b: CONFLICT format must place relpath last so spaces survive (got: $out4b)"
# Verify round-trip parse: relpath should equal "file with spaces.md" when consumed by read
parsed=$(echo "$out4b" | awk 'BEGIN{} /^CONFLICT/{for(i=4;i<=NF;i++) printf "%s%s", (i>4?" ":""), $i; print ""}')
[ "$parsed" = "file with spaces.md" ] || fail "scenario 4b: parsed relpath mismatch (got: $parsed)"

# ---------------------------------------------------------------------------
# Scenario 5: Absent dirs on both sides → exit 0 (no entries)
# ---------------------------------------------------------------------------
if ! out5=$("$DIFF" "$TMPDIR/nonexistent-a" "$TMPDIR/nonexistent-b"); then
  fail "scenario 5: expected exit 0 for absent dirs"
fi
if [ -n "$out5" ]; then
  fail "scenario 5: expected empty output for absent dirs, got: $out5"
fi

# ---------------------------------------------------------------------------
# Scenario 6: PLANS_ONLY + MATCH together → exit 1, both line types emitted
# ---------------------------------------------------------------------------
W6="$TMPDIR/s6/working"; P6="$TMPDIR/s6/plans"
mkdir -p "$W6" "$P6/ADR"
echo "same" > "$W6/keep.md"; echo "same" > "$P6/keep.md"
echo "new" > "$P6/ADR/0020-new.md"
out6=$("$DIFF" "$W6" "$P6") && fail "scenario 6: expected exit 1, got 0" || true
echo "$out6" | grep -q "^MATCH keep.md$" || fail "scenario 6: missing MATCH line"
echo "$out6" | grep -q "^PLANS_ONLY ADR/0020-new.md$" || fail "scenario 6: missing PLANS_ONLY line"

# ---------------------------------------------------------------------------
# Scenario 7: Neither sha256sum nor shasum available → exit 2 with stderr message
# (Use env -i with a deliberately empty PATH so command -v finds neither tool.)
# ---------------------------------------------------------------------------
W7="$TMPDIR/s7/working"; P7="$TMPDIR/s7/plans"
mkdir -p "$W7" "$P7"
echo "x" > "$W7/x.md"; echo "x" > "$P7/x.md"
set +e
BASH_BIN="$(command -v bash)"
err7=$(env -i PATH="/no/such/path" "$BASH_BIN" "$REPO_ROOT/chester-util-config/chester-cascade-diff.sh" "$W7" "$P7" 2>&1 1>/dev/null)
exit7=$?
set -e
if [ "$exit7" -ne 2 ]; then
  fail "scenario 7: expected exit 2 when no hash tool available, got $exit7"
fi
echo "$err7" | grep -qi "sha256sum\|shasum" \
  || fail "scenario 7: stderr should name sha256sum or shasum, got: $err7"

# ---------------------------------------------------------------------------
# Scenario 8: sha256sum unavailable but shasum present → silent fallback to shasum
# (Constructs a fake PATH containing every command the script needs EXCEPT sha256sum.)
# ---------------------------------------------------------------------------
if command -v shasum >/dev/null 2>&1; then
  FAKE_BIN="$TMPDIR/s8/fakebin"
  mkdir -p "$FAKE_BIN"
  for cmd in bash find sort mktemp awk sed mkdir rm cp cat ls dirname; do
    src=$(command -v "$cmd" 2>/dev/null || true)
    [ -n "$src" ] && ln -sf "$src" "$FAKE_BIN/$cmd"
  done
  ln -sf "$(command -v shasum)" "$FAKE_BIN/shasum"
  W8="$TMPDIR/s8/working"; P8="$TMPDIR/s8/plans"
  mkdir -p "$W8" "$P8"
  echo "same" > "$W8/x.md"; echo "same" > "$P8/x.md"
  set +e
  out8=$(env -i PATH="$FAKE_BIN" "$FAKE_BIN/bash" "$REPO_ROOT/chester-util-config/chester-cascade-diff.sh" "$W8" "$P8" 2>&1)
  exit8=$?
  set -e
  if [ "$exit8" -ne 0 ]; then
    fail "scenario 8: expected exit 0 (shasum fallback path), got $exit8 (output: $out8)"
  fi
  echo "$out8" | grep -q "^MATCH x.md$" \
    || fail "scenario 8: expected MATCH line under shasum fallback, got: $out8"
else
  echo "INFO: skipping scenario 8 — shasum not available on this system"
fi

# ---------------------------------------------------------------------------
if [ "$ERRORS" -gt 0 ]; then echo "FAIL: $ERRORS scenario(s) failed"; exit 1; fi
echo "PASS: chester-cascade-diff exercises all categories and fallback"
