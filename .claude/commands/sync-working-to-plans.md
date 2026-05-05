Sync the Chester working directory to the plans directory, copying any files or directories that exist in working but are missing from plans. This preserves sprint artifacts before the working directory gets cleaned up.

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

### Step 2: Compare Top-Level Directories

List top-level subdirectories in both working and plans. For each directory in working that does not exist in plans, copy it entirely:

```bash
cp -r "$CHESTER_WORKING_DIR/{dir}" "$PLANS_ABS/{dir}"
```

Report each directory copied.

### Step 3: Compare Files in Shared Directories

For directories that exist in both working and plans, recursively compare files. For each file present in working but absent from plans, create the parent directory if needed and copy the file:

```bash
mkdir -p "$(dirname "$PLANS_ABS/{dir}/{relative-path}")"
cp "$CHESTER_WORKING_DIR/{dir}/{relative-path}" "$PLANS_ABS/{dir}/{relative-path}"
```

Report each file copied.

### Step 4: Report

Print a summary of everything that was copied:

- Number of full directories copied (with names)
- Number of individual files copied into existing directories (with paths)
- If nothing was missing, report "Working and plans are already in sync."
