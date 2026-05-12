#!/usr/bin/env bash
# chester-style-write: merge info_packet_style into the user-level Chester settings file.
# Usage: chester-style-write <new-style-text>
set -euo pipefail

usage() {
  echo "Usage: chester-style-write <new-style-text>" >&2
  exit 2
}

[ "$#" -eq 1 ] || usage
[ -n "$1" ] || usage

if ! command -v jq >/dev/null 2>&1; then
  echo "chester-style-write: jq is required but not on PATH" >&2
  exit 1
fi

USER_CONFIG="$HOME/.claude/settings.chester.json"
mkdir -p "$(dirname "$USER_CONFIG")"

# Create empty JSON if absent so the jq merge has something to operate on.
[ -f "$USER_CONFIG" ] || echo '{}' > "$USER_CONFIG"

# Atomic write: temp file in same directory, then mv.
TMP="$(mktemp "${USER_CONFIG}.XXXXXX")"
trap 'rm -f "$TMP"' EXIT

if ! jq --arg style "$1" '. + {info_packet_style: $style}' "$USER_CONFIG" > "$TMP"; then
  echo "chester-style-write: jq merge failed (settings file may be malformed)" >&2
  exit 1
fi

mv "$TMP" "$USER_CONFIG"
trap - EXIT
