#!/usr/bin/env bash
# chester-trailer-write: append-only artifact provenance trailer manager.
# See skills/util-artifact-schema/SKILL.md for the convention this implements.
set -euo pipefail

usage() {
  cat <<'EOF' >&2
Usage:
  chester-trailer-write stamp <skill>@<version> <artifact-path>
  chester-trailer-write harvest <sprint-dir>
EOF
  exit 2
}

# --- stamp subcommand ----------------------------------------------------------

do_stamp() {
  [ "$#" -eq 2 ] || usage
  local skill_at_ver="$1"
  local path="$2"
  [ -f "$path" ] || { echo "chester-trailer-write: file not found: $path" >&2; exit 1; }

  # Validate skill@version format (loose).
  case "$skill_at_ver" in
    *@v*) : ;;
    *) echo "chester-trailer-write: expected <skill>@<version> (got '$skill_at_ver')" >&2; exit 2 ;;
  esac

  local stamp_line="<!-- produced-by ${skill_at_ver} -->"

  # Idempotency: if the exact stamp line is already present, no-op.
  if grep -Fxq "$stamp_line" "$path"; then
    return 0
  fi

  local now
  now="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  local created_line="<!-- created-at: ${now} -->"

  # Detect existing trailer block — anchor to the last 20 lines of the file
  # so that column-0 examples inside mid-file fenced code blocks (e.g., the
  # schema's docs of the trailer format itself) do not falsely register as
  # the artifact's own trailer block.
  if tail -n 20 "$path" | grep -Eq '^<!-- (created-at|produced-by) '; then
    # Append to existing block: insert before EOF, after the last produced-by line.
    # Strategy: append the new produced-by line as a new last line.
    # If file doesn't end with newline, fix that first.
    [ -z "$(tail -c1 "$path")" ] || printf '\n' >> "$path"
    printf '%s\n' "$stamp_line" >> "$path"
  else
    # No existing trailer block: ensure file ends with newline, add blank line,
    # then created-at + produced-by.
    [ -z "$(tail -c1 "$path")" ] || printf '\n' >> "$path"
    printf '\n%s\n%s\n' "$created_line" "$stamp_line" >> "$path"
  fi
}

# --- harvest subcommand (added in Task 2) -------------------------------------

do_harvest() {
  [ "$#" -eq 1 ] || usage
  local sprint_dir="$1"
  [ -d "$sprint_dir" ] || { echo "chester-trailer-write: dir not found: $sprint_dir" >&2; exit 1; }

  # Walk all .md files in sprint_dir. For each, extract the artifact's created-at
  # (one per file) and the in-file order of produced-by entries.
  # Emit lines: <created_at>\t<file_path>\t<position>\t<full produced-by line>
  # Sort by (created_at, file_path, position) — file_path is the secondary key
  # so that artifacts sharing a created-at second produce a deterministic order
  # rather than depending on filesystem traversal. Dedupe by produced-by line
  # keeping the first occurrence, then strip the sort prefix.

  local tmp
  tmp="$(mktemp)"
  trap 'rm -f "$tmp"' RETURN

  while IFS= read -r -d '' file; do
    local created
    created="$(grep -E '^<!-- created-at: ' "$file" | head -1 | sed -E 's/^<!-- created-at: (.*) -->$/\1/' || :)"
    [ -n "$created" ] || created="9999-99-99T99:99:99Z"  # files without created-at sort last
    # Audit (task-02): awk does not return non-zero for no-match — pipeline is no-match-safe.
    awk -v ts="$created" -v fp="$file" '
      /^<!-- produced-by .* -->$/ { printf("%s\t%s\t%06d\t%s\n", ts, fp, NR, $0) }
    ' "$file" >> "$tmp"
  done < <(find "$sprint_dir" -type f -name '*.md' -print0)

  # Sort by (timestamp, file_path, position), dedupe by produced-by line, keep first.
  # Audit (task-02): sort and awk both exit 0 on empty input — pipeline is empty-input-safe under the loop's current contract.
  sort -t $'\t' -k1,1 -k2,2 -k3,3n "$tmp" \
    | awk -F'\t' '!seen[$4]++ { print $4 }'
}

# --- dispatcher ---------------------------------------------------------------

cmd="${1:-}"
case "$cmd" in
  stamp)   shift; do_stamp "$@" ;;
  harvest) shift; do_harvest "$@" ;;
  *)       usage ;;
esac
