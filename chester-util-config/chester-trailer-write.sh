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
  echo "harvest: not yet implemented" >&2
  exit 99
}

# --- dispatcher ---------------------------------------------------------------

cmd="${1:-}"
case "$cmd" in
  stamp)   shift; do_stamp "$@" ;;
  harvest) shift; do_harvest "$@" ;;
  *)       usage ;;
esac
