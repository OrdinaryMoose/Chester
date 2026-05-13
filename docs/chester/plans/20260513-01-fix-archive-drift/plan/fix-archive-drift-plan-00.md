# Plan: Fix Master-Mode Cascade Archive Drift

**Sprint:** 20260513-01-fix-archive-drift
**Spec:** `docs/chester/working/20260513-01-fix-archive-drift/spec/fix-archive-drift-spec-00.md`
**Execution mode:** subagent

> **For agentic workers:** Use execute-write to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The `Execution mode` field selects which execute-write section runs — Section 2 (subagent-driven) or Section 3 (inline). plan-build sets this field at handoff based on the Execution Mode Selection heuristic, with human confirm/override.

## Goal

Insert a tiered detection-and-reconcile pre-flight into `finish-archive-artifacts` under Master Plan Mode so that silent reversion of cascade-document edits at archive time becomes structurally impossible, while preserving current per-commit cascade-edit practice and leaving non-master mode bytewise-unchanged.

## Architecture

A new bash helper (`chester-cascade-diff`) walks `working/<master>/design-documents/` and the worktree's `plans/<master>/design-documents/`, SHA-256-hashes each file, and emits a categorized manifest (MATCH / PLANS_ONLY / WORKING_ONLY / CONFLICT). `finish-archive-artifacts` consults the manifest under three tiers: silent fast path when everything matches, automatic `working/ ← plans/` sync for PLANS_ONLY-only divergence, and an interactive halt with three named operator choices (`accept-plans` / `accept-working` / `abort`) for CONFLICT or WORKING_ONLY entries. Non-master mode skips the gate entirely. The choice is recorded in the archive commit body for audit.

## Tech Stack

- Bash (POSIX-portable; `set -euo pipefail`)
- `sha256sum` with `shasum -a 256` macOS fallback
- Existing `bin/` wrapper convention (mirrors `bin/chester-trailer-write` shape with argument forwarding)
- Existing test idiom: `mktemp -d` + `trap EXIT` (from `tests/test-decision-record-emission.sh`) and `fail()` accumulator (from `tests/test-archive-bytewise.sh`)

---

## Task 1: Build chester-cascade-diff helper, wrapper, and test

**Type:** code-producing
**Implements:** AC-4.1, AC-6.1
**Decision budget:** 3
**Must remain green:** `tests/test-cascade-archive-divergence.sh`

**Files:**
- Create: `chester-util-config/chester-cascade-diff.sh`
- Create: `bin/chester-cascade-diff`
- Test: `tests/test-cascade-archive-divergence.sh`

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Create `tests/test-cascade-archive-divergence.sh` with the following content:

```bash
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
err7=$(env -i PATH="/no/such/path" bash "$REPO_ROOT/chester-util-config/chester-cascade-diff.sh" "$W7" "$P7" 2>&1 1>/dev/null)
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash /home/mike/Documents/CodeProjects/Chester/tests/test-cascade-archive-divergence.sh`
Expected: FAIL — `bin/chester-cascade-diff` does not exist yet (every scenario will fail at the first invocation).

- [ ] **Step 3: Write minimal implementation**

Create `chester-util-config/chester-cascade-diff.sh` with:

```bash
#!/usr/bin/env bash
# chester-cascade-diff.sh — Categorize file-level divergence between two directory trees.
#
# Usage: chester-cascade-diff WORKING_PATH PLANS_PATH
#
# For each file present in WORKING_PATH and/or PLANS_PATH (by path relative to its
# parent), emits one line to stdout:
#
#   MATCH <relpath>                                — same SHA-256 on both sides
#   CONFLICT <relpath> <working-hash> <plans-hash> — different SHA-256
#   PLANS_ONLY <relpath>                           — file exists only in PLANS_PATH
#   WORKING_ONLY <relpath>                         — file exists only in WORKING_PATH
#
# Exit code:
#   0 — every emitted line is MATCH (no divergence), or no files at all
#   1 — at least one non-MATCH line emitted (divergence found)
#   2 — neither sha256sum nor shasum is available; or wrong argument count

set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "Usage: chester-cascade-diff WORKING_PATH PLANS_PATH" >&2
  exit 2
fi

WORKING_PATH="$1"
PLANS_PATH="$2"

# Detect hash tool. sha256sum is standard on Linux; shasum -a 256 is the macOS equivalent.
if command -v sha256sum >/dev/null 2>&1; then
  hash_file() { sha256sum "$1" | awk '{print $1}'; }
elif command -v shasum >/dev/null 2>&1; then
  hash_file() { shasum -a 256 "$1" | awk '{print $1}'; }
else
  echo "ERROR: neither sha256sum nor shasum is available; cannot compute hashes" >&2
  exit 2
fi

TMPDIR_DIFF="$(mktemp -d)"
trap 'rm -rf "$TMPDIR_DIFF"' EXIT

WORKING_LIST="$TMPDIR_DIFF/working.list"
PLANS_LIST="$TMPDIR_DIFF/plans.list"
: > "$WORKING_LIST"
: > "$PLANS_LIST"

# Collect relative file paths from each side (sorted, NUL-safe enough for our use).
if [ -d "$WORKING_PATH" ]; then
  (cd "$WORKING_PATH" && find . -type f | sed 's|^\./||' | LC_ALL=C sort) > "$WORKING_LIST"
fi
if [ -d "$PLANS_PATH" ]; then
  (cd "$PLANS_PATH" && find . -type f | sed 's|^\./||' | LC_ALL=C sort) > "$PLANS_LIST"
fi

DIVERGENCE=0
ALL_LIST="$TMPDIR_DIFF/all.list"
LC_ALL=C sort -u "$WORKING_LIST" "$PLANS_LIST" > "$ALL_LIST"

while IFS= read -r relpath; do
  [ -z "$relpath" ] && continue
  in_working=0; in_plans=0
  [ -f "$WORKING_PATH/$relpath" ] && in_working=1
  [ -f "$PLANS_PATH/$relpath" ] && in_plans=1
  if [ "$in_working" = 1 ] && [ "$in_plans" = 1 ]; then
    wh=$(hash_file "$WORKING_PATH/$relpath")
    ph=$(hash_file "$PLANS_PATH/$relpath")
    if [ "$wh" = "$ph" ]; then
      echo "MATCH $relpath"
    else
      # Relpath placed LAST so embedded spaces in cascade-doc filenames survive parsing.
      # Consumers parse with: read -r tag wh ph relpath <<< "$line"  (final var absorbs remainder).
      echo "CONFLICT $wh $ph $relpath"
      DIVERGENCE=1
    fi
  elif [ "$in_working" = 1 ]; then
    echo "WORKING_ONLY $relpath"
    DIVERGENCE=1
  else
    echo "PLANS_ONLY $relpath"
    DIVERGENCE=1
  fi
done < "$ALL_LIST"

exit "$DIVERGENCE"
```

Make it executable:

```bash
chmod +x /home/mike/Documents/CodeProjects/Chester/chester-util-config/chester-cascade-diff.sh
```

Create `bin/chester-cascade-diff` (matches `bin/chester-trailer-write` shape with arg-forwarding):

```bash
#!/usr/bin/env bash
# Self-resolving wrapper — added to PATH by the plugin system
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CHESTER_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
exec "$CHESTER_ROOT/chester-util-config/chester-cascade-diff.sh" "$@"
```

Make it executable:

```bash
chmod +x /home/mike/Documents/CodeProjects/Chester/bin/chester-cascade-diff
```

Also make the test executable:

```bash
chmod +x /home/mike/Documents/CodeProjects/Chester/tests/test-cascade-archive-divergence.sh
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bash /home/mike/Documents/CodeProjects/Chester/tests/test-cascade-archive-divergence.sh`
Expected: `PASS: chester-cascade-diff exercises all categories and fallback`

- [ ] **Step 5: Commit**

```bash
git add bin/chester-cascade-diff chester-util-config/chester-cascade-diff.sh tests/test-cascade-archive-divergence.sh
git commit -m "feat: add chester-cascade-diff detection helper

Categorizes file-level divergence between working/ and plans/ cascade trees
(MATCH / CONFLICT / PLANS_ONLY / WORKING_ONLY) with SHA-256 hashing and a
shasum -a 256 macOS fallback. Used by finish-archive-artifacts under Master
Plan Mode to prevent silent reversion of cascade-document edits at archive
time."
```

---

## Task 2: Insert Master-Mode tiered gate into finish-archive-artifacts

**Type:** code-producing
**Implements:** AC-1.1, AC-1.2, AC-1.3, AC-2.1, AC-3.1, AC-4.2, AC-5.2
**Decision budget:** 3
**Must remain green:** `tests/test-archive-bytewise.sh`, `tests/test-cascade-archive-divergence.sh`

**Files:**
- Modify: `skills/finish-archive-artifacts/SKILL.md` (rewrite the body; bump `version: v0002` → `version: v0003`)

**Steps:**

- [ ] **Step 1: Read current SKILL.md to confirm baseline**

Run: `cat /home/mike/Documents/CodeProjects/Chester/skills/finish-archive-artifacts/SKILL.md`
Expected: `version: v0002`; four steps (Resolve Paths / Copy / Verify / Commit); `cp -r` at line 42; bytewise prose at line 45.

- [ ] **Step 2: Replace the file content with the v0003 body**

Overwrite `skills/finish-archive-artifacts/SKILL.md` with the following exact content:

```markdown
---
name: finish-archive-artifacts
description: >
  Copy all sprint artifacts from the gitignored working directory into the worktree's
  tracked plans directory and commit them. This creates the permanent record that gets
  merged with the code. Invoke after finish-write-records (or after execute-verify-complete
  if skipping records). Under Master Plan Mode, runs a tiered cascade-document divergence
  gate before the copy to prevent silent reversion of sub-sprint cascade edits.
version: v0003
---

# Archive Artifacts

Copies all sprint artifacts from the gitignored working directory into the worktree's
tracked plans directory. This is the moment where design briefs, specs, plans, summaries,
and audits become permanent history alongside the code.

Under Master Plan Mode, sub-sprints may edit cascade documents (anything under
`design-documents/`) directly in the worktree's `plans/<master>/design-documents/` as
part of their normal commit flow. Those edits are the authoritative state of the
cascade at sub-sprint close. Because the master working tree's `design-documents/`
snapshot is stale relative to those edits, a naive `cp -r` from `working/` to
`plans/` would silently revert them. The Master-Mode gate below detects divergence
before the copy runs and reconciles it with three explicit tiers.

Outside Master Plan Mode (no `.active-master` breadcrumb), the gate is skipped and
the skill behaves bitwise-identically to `v0002`: resolve paths, copy, verify, commit.

## Step 1: Resolve Paths

```bash
eval "$(chester-config-read)"
WORKTREE_ROOT="$(git rev-parse --show-toplevel)"
```

Determine the sprint subdirectory from context (most recent sprint directory under
`{CHESTER_WORKING_DIR}/`, or from conversation).

Verify the source exists:
```bash
ls "$CHESTER_WORKING_DIR/{sprint-subdir}/"
```

If the working directory or sprint subdirectory doesn't exist, warn and stop — there's
nothing to archive.

## Step 2: Master Plan Mode Gate

Check whether Master Plan Mode is active:

```bash
if [ ! -f "$CHESTER_WORKING_DIR/.active-master" ]; then
  # Non-master mode — skip the divergence gate entirely; proceed to Step 5.
  :
else
  MASTER="$(cat "$CHESTER_WORKING_DIR/.active-master")"
  WORKING_CASCADE="$CHESTER_WORKING_DIR/$MASTER/design-documents"
  PLANS_CASCADE="$WORKTREE_ROOT/$CHESTER_PLANS_DIR/$MASTER/design-documents"
fi
```

If `.active-master` is absent, jump directly to Step 5 (Copy). The bytewise `cp -r`
runs unchanged from `v0002` — non-master mode does not invoke `chester-cascade-diff`
and never produces an archive-commit body addition.

If `.active-master` is present but `$CHESTER_WORKING_DIR/$MASTER/` does not exist on
disk, warn and stop — the breadcrumb points to a non-existent master sprint
directory, which indicates corrupt state requiring manual intervention.

## Step 3: Divergence Scan (Master Plan Mode only)

Run the detection helper and capture both stdout (the manifest) and the exit code:

```bash
MANIFEST="$(chester-cascade-diff "$WORKING_CASCADE" "$PLANS_CASCADE")" && DIFF_EXIT=0 || DIFF_EXIT=$?
```

`chester-cascade-diff` emits one line per file under either tree, tagged as one of
`MATCH`, `CONFLICT`, `PLANS_ONLY`, or `WORKING_ONLY`. Exit code `0` means every entry
is `MATCH` (or no entries exist). Exit code `1` means at least one non-MATCH entry
exists. Exit code `2` means the hash tool is missing (`sha256sum` and `shasum` both
unavailable) — surface the helper's stderr and halt. No copy proceeds when the
helper aborts.

If both `$WORKING_CASCADE` and `$PLANS_CASCADE` are absent on disk, the helper emits
no manifest entries and exits `0`. Proceed to Step 5 with no commit-body addition.

## Step 4: Tiered Resolution (Master Plan Mode only)

Branch on the manifest content. Initialize `COMMIT_TRAILER=""`; it stays empty on
the MATCH fast path and is set otherwise.

**Tier MATCH** — `DIFF_EXIT=0` (manifest contains only `MATCH` lines or is empty).
Proceed to Step 5. `COMMIT_TRAILER` stays empty.

**Tier PLANS_ONLY-only** — `DIFF_EXIT=1` and the manifest contains only `MATCH` and
`PLANS_ONLY` lines (no `CONFLICT`, no `WORKING_ONLY`). The auto-sync handles the
common case of a sub-sprint adding a new cascade file (e.g. a new ADR). The sync
makes the file visible in `working/<master>/design-documents/` so future sub-sprint
worktrees see it (AC-2.1); the `cp -r` in Step 5 would preserve it in worktree
plans/ either way, since `cp -r` does not delete destination-only files.

```bash
PLANS_ONLY_FILES=()
while IFS= read -r line; do
  case "$line" in
    "PLANS_ONLY "*)
      relpath="${line#PLANS_ONLY }"
      mkdir -p "$(dirname "$WORKING_CASCADE/$relpath")"
      cp "$PLANS_CASCADE/$relpath" "$WORKING_CASCADE/$relpath"
      PLANS_ONLY_FILES+=("$relpath")
      ;;
  esac
done <<< "$MANIFEST"
joined=$(printf '%s, ' "${PLANS_ONLY_FILES[@]}"); joined="${joined%, }"
COMMIT_TRAILER="Cascade sync: PLANS_ONLY auto-synced: $joined"
```

Proceed to Step 5.

**Tier CONFLICT-or-WORKING_ONLY** — `DIFF_EXIT=1` and the manifest contains at least
one `CONFLICT` or `WORKING_ONLY` line. Print the structured manifest to stderr and
wait for an explicit operator resolution. The prompt presents three named choices
with no default — pressing enter or typing anything else re-prompts. The
`accept-working` label explicitly contains "cascade edits lost" so the destructive
option is announced at the point of choice.

If stdin is not a TTY (`[ ! -t 0 ]`), do NOT prompt — print the manifest to stderr
and exit non-zero with the message: "non-interactive invocation cannot resolve
cascade divergence — re-run interactively or pre-sync manually". No silent default.

The interactive prompt:

```
CASCADE DIVERGENCE DETECTED — archive halted.

Conflicting files (different content between working/ and worktree-plans/):
  <list each CONFLICT line with both hashes>

Working-only files (present in working/, absent in worktree-plans/):
  <list each WORKING_ONLY line>

Plans-only files (present in worktree-plans/, absent from working/ — will be auto-synced):
  <list each PLANS_ONLY line>

Choose a resolution before proceeding:
  (a) accept-plans   — worktree-plans/ wins; sync working/ ← worktree-plans/ for every
                       CONFLICT and WORKING_ONLY entry (WORKING_ONLY files are deleted
                       from working/ since they are absent in plans/); auto-sync any
                       PLANS_ONLY entries; then archive.
  (b) accept-working — working/ wins; the subsequent cp -r overwrites worktree-plans/
                       with working/'s state. CASCADE EDITS LOST.
  (c) abort          — stop here; no files are copied; no commit; operator handles manually.

Type one of: accept-plans, accept-working, abort
```

On `accept-plans`:

```bash
SYNCED_FILES=()
while IFS= read -r line; do
  case "$line" in
    "CONFLICT "*)
      # Use read with trailing var = relpath so embedded spaces survive.
      read -r _ _ _ relpath <<< "$line"
      mkdir -p "$(dirname "$WORKING_CASCADE/$relpath")"
      cp "$PLANS_CASCADE/$relpath" "$WORKING_CASCADE/$relpath"
      SYNCED_FILES+=("$relpath")
      ;;
    "WORKING_ONLY "*)
      relpath="${line#WORKING_ONLY }"
      rm -f "$WORKING_CASCADE/$relpath"
      SYNCED_FILES+=("$relpath (deleted)")
      ;;
    "PLANS_ONLY "*)
      relpath="${line#PLANS_ONLY }"
      mkdir -p "$(dirname "$WORKING_CASCADE/$relpath")"
      cp "$PLANS_CASCADE/$relpath" "$WORKING_CASCADE/$relpath"
      SYNCED_FILES+=("$relpath")
      ;;
  esac
done <<< "$MANIFEST"
# Join with ", " — bash IFS only uses first char of separator, so build explicitly via printf+strip.
joined=$(printf '%s, ' "${SYNCED_FILES[@]}"); joined="${joined%, }"
COMMIT_TRAILER="Cascade sync: accepted plans/ for: $joined"
```

On `accept-working`: do not modify `working/`. The subsequent `cp -r` in Step 5 will
overwrite worktree-plans/'s authoritative content with working/'s state (or, for
WORKING_ONLY entries, create the working/-side files in plans/). Build the body
line listing every CONFLICT and WORKING_ONLY file:

```bash
OVERWRITTEN_FILES=()
while IFS= read -r line; do
  case "$line" in
    "CONFLICT "*)
      read -r _ _ _ relpath <<< "$line"
      OVERWRITTEN_FILES+=("$relpath")
      ;;
    "WORKING_ONLY "*)
      OVERWRITTEN_FILES+=("${line#WORKING_ONLY } (added from working/)")
      ;;
  esac
done <<< "$MANIFEST"
joined=$(printf '%s, ' "${OVERWRITTEN_FILES[@]}"); joined="${joined%, }"
COMMIT_TRAILER="Cascade OVERWRITE: reverted plans/ to working/ state for: $joined"
```

On `abort`: print `Archive halted. No files copied.` to stderr; exit non-zero. No
files in `working/` or `plans/` are mutated; no commit is created.

Proceed to Step 5 only after `accept-plans` or `accept-working`.

## Step 5: Copy

```bash
mkdir -p "$WORKTREE_ROOT/$CHESTER_PLANS_DIR/{sprint-subdir}"
cp -r "$CHESTER_WORKING_DIR/{sprint-subdir}/"* "$WORKTREE_ROOT/$CHESTER_PLANS_DIR/{sprint-subdir}/"
```

The copy is bytewise — every artifact's provenance trailer (see `util-artifact-schema`
`## Provenance Trailers`) is preserved intact in the archive. `finish-archive-artifacts`
does not stamp; copy is not a modification. Under Master Plan Mode, working/'s
cascade content has already been reconciled to the operator's intent in Step 4, so
the copy carries forward correct cascade-doc content without further intervention.

Note: `cp -r` overwrites files present in both source and destination but does NOT
delete destination-only files. This is why PLANS_ONLY entries survive the copy
without intervention, and why a WORKING_ONLY entry under accept-working would
propagate into worktree-plans/ (the gate halts on WORKING_ONLY specifically to
make this propagation an explicit operator choice).

## Step 6: Verify

```bash
ls -R "$WORKTREE_ROOT/$CHESTER_PLANS_DIR/{sprint-subdir}/"
```

Confirm the copy contains the expected artifacts. Report what was archived:

```
Archived to {CHESTER_PLANS_DIR}/{sprint-subdir}/:
- design/  ({N} files)
- spec/    ({N} files)
- plan/    ({N} files)
- summary/ ({N} files)
```

## Step 7: Commit

```bash
git add "$CHESTER_PLANS_DIR/{sprint-subdir}/"
if [ -n "$COMMIT_TRAILER" ]; then
  git commit -m "docs: archive sprint artifacts for {sprint-name}" -m "$COMMIT_TRAILER"
else
  git commit -m "docs: archive sprint artifacts for {sprint-name}"
fi
```

The optional body paragraph records the resolution outcome for audit purposes. In
non-master mode and in the MATCH fast path under Master Plan Mode, `COMMIT_TRAILER`
is empty and the commit message is the existing single-line form.

## Integration

- **Called after:** `finish-write-records` (if records were produced) or
  `execute-verify-complete` (if skipping records)
- **Leads to:** `finish-close-worktree`
- **Reads:** `util-artifact-schema` for path conventions; `chester-cascade-diff` for
  Master-Mode divergence detection
```

- [ ] **Step 3: Run the existing bytewise-invariant test to confirm no regression**

Run: `bash /home/mike/Documents/CodeProjects/Chester/tests/test-archive-bytewise.sh`
Expected: `PASS: archive preserves trailer chains bytewise`

The three grep assertions in that test (`cp -r` present, no `chester-trailer-write`, bytewise/not-a-modification prose) all remain satisfied by the v0003 body — the `cp -r` is in Step 5, no trailer-write call exists anywhere in the file, and Step 5's prose contains "bytewise" and "not a modification."

- [ ] **Step 4: Run the divergence test to confirm no regression**

Run: `bash /home/mike/Documents/CodeProjects/Chester/tests/test-cascade-archive-divergence.sh`
Expected: `PASS: chester-cascade-diff exercises all categories and fallback`

Task 1's test is independent of the SKILL.md, but running it here proves nothing was disturbed when adding the new file references in the skill.

- [ ] **Step 5: Commit**

```bash
git add skills/finish-archive-artifacts/SKILL.md
git commit -m "feat(finish-archive-artifacts): add Master-Mode cascade gate (v0003)

Inserts tiered detection-and-reconcile before the existing cp -r when Master
Plan Mode is active. chester-cascade-diff categorizes working/ vs worktree-plans/
divergence under design-documents/. Three tiers: MATCH fast path; PLANS_ONLY
auto-sync for new cascade files; CONFLICT or WORKING_ONLY halt with three
named operator choices (accept-plans / accept-working / abort) and audit
record in commit body. Non-master mode is bitwise unchanged from v0002."
```

---

## Task 3: Reconcile docs/chester/CLAUDE.md and the skill index with the new gate

**Type:** docs-producing
**Implements:** AC-5.1 (plus the repo's own description-sync rule from root CLAUDE.md, which couples skill description changes to the setup-start skill index)
**Decision budget:** 2
**Must remain green:** `tests/test-archive-bytewise.sh`, `tests/test-cascade-archive-divergence.sh` (no test covers `docs/chester/CLAUDE.md` or `skills/setup-start/references/skill-index.md` directly; the wider suite must stay green as a regression check)

**Files:**
- Modify: `docs/chester/CLAUDE.md` (three targeted amendments)
- Modify: `skills/setup-start/references/skill-index.md:36` (one-line entry sync with Task 2's new description)

**Steps:**

- [ ] **Step 1: Read current CLAUDE.md to confirm baseline**

Run: `cat /home/mike/Documents/CodeProjects/Chester/docs/chester/CLAUDE.md`
Confirm three target locations by **text search** (line numbers in this file shift as it grows — match the text, not the line):
- Section `## Structure` — the `plans/` bullet contains the literal phrase `No skill writes here except` followed by `` `finish-archive-artifacts` ``.
- Section `## Transfer Flow at Sprint Finish` — contains the four numbered steps; step 3 (`finish-archive-artifacts`) describes Master Plan Mode behavior.
- Section `## Key Properties` — contains the literal bullet starting `**One-way flow:**` and ending `Never reverse.`

- [ ] **Step 2: Amend the "plans/ — Archive Only" assertion**

In `docs/chester/CLAUDE.md`, replace the existing `plans/` bullet text under `## Structure`:

```
- `plans/` — **tracked in git.** Archive-only. Immutable record after merge. No skill writes here except `finish-archive-artifacts`.
```

with:

```
- `plans/` — **tracked in git.** Archive target. Under normal sprint operation, no skill writes here except `finish-archive-artifacts`. Under Master Plan Mode, sub-sprint execution may produce ADR-backed cascade-document edits committed directly to `plans/<master>/design-documents/` as part of the sub-sprint's normal commit flow — those edits are the authoritative cascade state at sub-sprint close, and `finish-archive-artifacts` reconciles `working/` to them at the archive boundary (see Cascade Divergence Gate below).
```

- [ ] **Step 3: Document the Cascade Divergence Gate in the Transfer Flow section**

Append a new paragraph to the description of step 3 (`finish-archive-artifacts`) under `## Transfer Flow at Sprint Finish`. Locate the existing bullet:

```
   - Master Plan Mode: copies the entire master working tree (`working/<master-sprint>/*` including master-level files and all nested sub-sprint dirs) → `plans/<master-sprint>/` in the worktree. Each sub-sprint merge carries the latest accumulated master state.
```

Replace with:

```
   - Master Plan Mode: before the `cp -r`, runs the Cascade Divergence Gate against `working/<master>/design-documents/` and the worktree's `plans/<master>/design-documents/`. The gate has three tiers — MATCH (silent fast path), PLANS_ONLY-only (automatic working/ ← plans/ sync for new cascade files), and CONFLICT or WORKING_ONLY (halt with manifest; operator types `accept-plans`, `accept-working`, or `abort`). Resolution outcome is recorded in the archive commit body. After resolution, copies the entire master working tree (`working/<master-sprint>/*` including master-level files and all nested sub-sprint dirs) → `plans/<master-sprint>/` in the worktree. Each sub-sprint merge carries the latest accumulated master state.
```

Add a new subsection between `## Transfer Flow at Sprint Finish` and `## Post-Merge State` titled `## Cascade Divergence Gate (Master Plan Mode)`:

```markdown
## Cascade Divergence Gate (Master Plan Mode)

When `finish-archive-artifacts` runs under Master Plan Mode, it compares `working/<master>/design-documents/` against the worktree's `plans/<master>/design-documents/` before the `cp -r`. The comparison uses the `chester-cascade-diff` helper (SHA-256 per file; `shasum -a 256` macOS fallback) which emits one of four categories per file: `MATCH`, `CONFLICT`, `PLANS_ONLY`, `WORKING_ONLY`.

Three tiers govern the response:

- **MATCH only** — every file is identical on both sides. The skill proceeds silently to `cp -r` with the existing single-line commit message.
- **PLANS_ONLY only** — sub-sprint added cascade files (e.g. new ADRs) absent from working/. The skill auto-syncs each `PLANS_ONLY` file from worktree-plans/ to working/ (so future sub-sprint worktrees see them) and appends `Cascade sync: PLANS_ONLY auto-synced: <file-list>` to the commit body.
- **CONFLICT or WORKING_ONLY present** — content disagreement or sub-sprint-side deletion. The skill halts and surfaces a manifest listing every diverging file with both hashes (for CONFLICT) or the relative path (for WORKING_ONLY). The operator types one of:
  - `accept-plans` — worktree-plans/ wins; working/ is reconciled to match before the copy. Commit body: `Cascade sync: accepted plans/ for: <file-list>`.
  - `accept-working` — working/ wins; the subsequent `cp -r` overwrites worktree-plans/ with the (potentially pre-edit) working/ content. Commit body: `Cascade OVERWRITE: reverted plans/ to working/ state for: <file-list>`. The label announces destruction at the point of choice; there is no default.
  - `abort` — no files copied, no commit; operator handles manually.

The gate is skipped entirely outside Master Plan Mode (no `.active-master` breadcrumb). In that path, `finish-archive-artifacts` is bytewise-identical to its `v0002` behavior.
```

- [ ] **Step 4: Amend the "One-way flow" Key Property**

Locate the bullet in `## Key Properties`:

```
- **One-way flow:** working → plans at archive step. Never reverse.
```

Replace with:

```
- **One-way flow:** working → plans at archive step. Never reverse.
  - *Exception under Master Plan Mode:* when the Cascade Divergence Gate's `accept-plans` resolution (or its automatic PLANS_ONLY-only tier) fires, the archive step performs a targeted `working/<master>/design-documents/ ← worktree-plans/<master>/design-documents/` sync immediately before the `cp -r`. This is a pre-flight sync of the specific files the operator chose, not a structural reversal of the working→plans flow — the canonical archive direction remains working → plans.
```

- [ ] **Step 5: Sync the setup-start skill index with the new description**

Root `CLAUDE.md` mandates that any skill `description:` frontmatter change must be mirrored in the skill index. Task 2 changed the `finish-archive-artifacts` description; update the index entry to match.

Locate the line in `skills/setup-start/references/skill-index.md` that currently reads:

```
- `finish-archive-artifacts` — Copy working dir artifacts to tracked plans dir and commit
```

Replace with:

```
- `finish-archive-artifacts` — Copy working-dir artifacts to tracked plans dir and commit. Under Master Plan Mode, runs a tiered cascade-document divergence gate before the copy to prevent silent reversion of sub-sprint cascade edits.
```

- [ ] **Step 6: Run both tests to confirm no regression**

Run:
```bash
bash /home/mike/Documents/CodeProjects/Chester/tests/test-archive-bytewise.sh
bash /home/mike/Documents/CodeProjects/Chester/tests/test-cascade-archive-divergence.sh
```
Expected: both `PASS:` lines.

- [ ] **Step 7: Commit**

```bash
git add docs/chester/CLAUDE.md skills/setup-start/references/skill-index.md
git commit -m "docs(chester): document Cascade Divergence Gate under Master Plan Mode

Three targeted amendments to docs/chester/CLAUDE.md:
- plans/ description softened to acknowledge sub-sprint cascade-doc edits as
  sanctioned during Master Plan Mode (still the only skill-driven plans/
  writer is finish-archive-artifacts at archive time).
- Transfer Flow step 3 documents the divergence gate; new Cascade Divergence
  Gate (Master Plan Mode) subsection describes the three tiers and named
  operator choices.
- One-way-flow Key Property gains an Exception clause naming the targeted
  pre-flight sync as non-structural.

Plus skill-index.md entry refreshed to mirror Task 2's updated SKILL.md
description (root CLAUDE.md sync rule)."
```

<!-- created-at: 2026-05-13T11:37:02Z -->
<!-- produced-by plan-build@v0004 -->
