#!/usr/bin/env bash
# chester-cascade-diff.sh — Categorize file-level divergence between two directory trees.
#
# Usage: chester-cascade-diff WORKING_PATH PLANS_PATH
#
# For each file present in WORKING_PATH and/or PLANS_PATH (by path relative to its
# parent), emits one line to stdout:
#
#   MATCH <relpath>                                — same SHA-256 on both sides
#   CONFLICT <working-hash> <plans-hash> <relpath> — different SHA-256 (relpath LAST so spaces survive)
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
