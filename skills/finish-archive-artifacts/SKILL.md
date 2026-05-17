---
name: finish-archive-artifacts
description: >
  Copy all sprint artifacts from the gitignored working directory into the worktree's
  tracked plans directory and commit them. This creates the permanent record that gets
  merged with the code. Invoke after finish-write-records (or after execute-verify-complete
  if skipping records).
version: v0004
---

# Archive Artifacts

Copies all sprint artifacts from the gitignored working directory into the worktree's
tracked plans directory. This is the moment where design briefs, specs, plans, summaries,
and audits become permanent history alongside the code.

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

## Step 2: Copy

```bash
mkdir -p "$WORKTREE_ROOT/$CHESTER_PLANS_DIR/{sprint-subdir}"
cp -r "$CHESTER_WORKING_DIR/{sprint-subdir}/"* "$WORKTREE_ROOT/$CHESTER_PLANS_DIR/{sprint-subdir}/"
```

The copy is bytewise — every artifact's provenance trailer (see `util-artifact-schema`
`## Provenance Trailers`) is preserved intact in the archive. `finish-archive-artifacts`
does not stamp; copy is not a modification.

Note: `cp -r` overwrites files present in both source and destination but does NOT
delete destination-only files.

## Step 3: Verify

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

## Step 4: Commit

```bash
git add "$CHESTER_PLANS_DIR/{sprint-subdir}/"
git commit -m "docs: archive sprint artifacts for {sprint-name}"
```

## Integration

- **Called after:** `finish-write-records` (if records were produced) or
  `execute-verify-complete` (if skipping records)
- **Leads to:** `finish-close-worktree`
- **Reads:** `util-artifact-schema` for path conventions
