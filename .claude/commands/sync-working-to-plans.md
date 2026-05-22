Sync the Chester working directory to the plans directory, copying new files and overwriting older plans files with newer working versions. After sync, clean up working/ by removing inactive sprint directories. Plans is never deleted from.

## Procedure

### Step 1: Read Config

```bash
eval "$(chester-config-read)"
```

Use `CHESTER_WORKING_DIR` (absolute path to gitignored working directory) and `CHESTER_PLANS_DIR` (relative path to tracked plans directory). Resolve plans to an absolute path:

```bash
REPO_ROOT="$(git rev-parse --show-toplevel)"
PLANS_ABS="$REPO_ROOT/$CHESTER_PLANS_DIR"
```

If either directory does not exist, warn and stop.

### Step 2: Resolve the Active Sprint / Master

Identify the active sprint or master plan. This name will be preserved during cleanup in Step 5.

Resolution order — first hit wins:

1. **`docs/chester/working/.active-master`** — if present, read the single-line content. That is the active master sprint name.
2. **`docs/chester/working/.active-sprint`** — if present, read the single-line content. That is the active sub-sprint path (may be nested under a master).
3. **Root `CLAUDE.md`** — grep for `**Currently active:**` line under `## Master Plan Mode`. The first backticked token on that line is the active master sprint name.
4. **Ask the user.** List top-level sprint-shaped directories in `working/` (pattern `YYYYMMDD-##-*`) and ask which is active.

Record the resolved name as `ACTIVE`. If a master was resolved AND a sub-sprint was also resolved, record both — both are preserved.

### Step 3: Dry-Run Preview (default)

Run rsync in dry-run mode and report what WOULD change. No files are written.

```bash
rsync -a --update --itemize-changes --dry-run \
      "$CHESTER_WORKING_DIR/" "$PLANS_ABS/" \
  | tee /tmp/chester-sync-preview.txt
```

Tally the preview:

```bash
NEW=$(awk '/^>f\+\+\+\+\+\+\+\+\+/ {print}' /tmp/chester-sync-preview.txt | wc -l)
UPDATED=$(awk '/^>f[^+]/ {print}' /tmp/chester-sync-preview.txt | wc -l)
NEW_DIRS=$(awk '/^cd\+\+\+\+\+\+\+\+\+/ {print}' /tmp/chester-sync-preview.txt | wc -l)
```

Print the dry-run summary:

- New directories that would be created: `$NEW_DIRS`
- New files that would be added: `$NEW`
- Existing files that would be updated (working newer): `$UPDATED`
- If all three are zero, report "Working and plans are already in sync." and skip to Step 5.

If `$UPDATED > 0`, list every path that would be overwritten (extract from `/tmp/chester-sync-preview.txt` lines beginning with `>f` and lacking the `+++++++++` suffix). The user must see these before they happen.

### Step 4: Confirm and Apply

Ask the user to confirm the sync. If `$UPDATED > 0`, explicitly call out the overwrite gate:

> "$UPDATED existing plans file(s) will be overwritten by newer working versions. Proceed? (a) yes / (b) no, abort"

Otherwise:

> "Apply the sync? (a) yes / (b) no, abort"

On `yes`, run the real sync (same command, no `--dry-run`):

```bash
rsync -a --update --itemize-changes \
      "$CHESTER_WORKING_DIR/" "$PLANS_ABS/" \
  | tee /tmp/chester-sync-report.txt
```

Recompute and print the actual tally (`$NEW`, `$UPDATED`, `$NEW_DIRS`) so the user sees what was actually written. Print the full path list below the tally.

Flag reference:
- `-a` — archive: recursive, preserve mtime / perms / symlinks. mtime preservation is required so subsequent `--update` runs see correct freshness.
- `--update` — destination wins if its mtime is newer than source. Working-side newer wins otherwise. Equal-mtime files are skipped.
- `--itemize-changes` — one line per file with a prefix code (e.g. `>f+++++++++` for new file, `>f.st......` for updated mtime+size).
- No `--delete` — plans-only files are intentionally preserved. Plans is archive.

### Step 5: Cleanup Inactive Working Sprints (confirm first)

After a successful sync, offer to clean up `working/` by removing inactive sprint directories.

**Scope:**
- **Targets:** top-level directories matching sprint patterns: `YYYYMMDD-##-*` (default sprint shape) and any master sprint dirs (e.g. `*-mp-*`).
- **Preserves:** `$ACTIVE` (and the active master if both were resolved in Step 2). Loose files at working root (e.g. `master-plan-skill-living-document-problem-brief.md`, draft notes). Non-sprint subdirectories (e.g. `stress-tests/`). Breadcrumbs (`.active-*`).

Build the deletion list:

```bash
CANDIDATES=$(find "$CHESTER_WORKING_DIR" -maxdepth 1 -type d \
  \( -name '????????-??-*' -o -name '*-mp-*' \) \
  -not -name "$ACTIVE" \
  -not -name "$ACTIVE_MASTER" 2>/dev/null)
```

(Adjust the `-not -name` clauses to cover whatever Step 2 resolved — active sprint, active master, or both.)

Print the deletion preview:

- "The following inactive working directories will be removed:" then list each path with its size (`du -sh`).
- "The following will be preserved:" then list `$ACTIVE` (and `$ACTIVE_MASTER` if set), plus a note that loose files and non-sprint subdirs at working root are untouched.

Ask:

> "Remove these inactive working directories? (a) yes / (b) no, skip cleanup"

On `yes`, remove each candidate:

```bash
for d in $CANDIDATES; do rm -rf "$d"; echo "removed: $d"; done
```

Print a final summary: number removed, total bytes freed (`du -sh` deltas).

On `no`, report "Cleanup skipped. Working directory unchanged."

### Step 6: Final Report

Print the combined report:

- Sync: $NEW new dirs, $NEW files, $UPDATED updates (or "already in sync").
- Cleanup: N directories removed (or "skipped").
- Active sprint preserved: $ACTIVE (and $ACTIVE_MASTER if applicable).

If nothing changed at all (in-sync + cleanup declined or no candidates), report "Nothing to do."
