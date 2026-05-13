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
COMMIT_TRAILER=""
```

`COMMIT_TRAILER` is initialized unconditionally so Step 7's `[ -n "$COMMIT_TRAILER" ]`
test is safe under `set -eu` in both modes. The Master-Mode tiers may overwrite it in
Step 4; non-master mode leaves it empty.

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
