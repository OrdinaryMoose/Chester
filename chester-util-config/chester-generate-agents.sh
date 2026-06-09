#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CHESTER_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
OUT_DIR=""
while [ $# -gt 0 ]; do
  case "$1" in
    --root) CHESTER_ROOT="$(cd "$2" && pwd)"; shift 2 ;;
    --output-dir) OUT_DIR="$2"; shift 2 ;;
    *) echo "chester-generate-agents: unknown arg: $1" >&2; exit 2 ;;
  esac
done
[ -n "$OUT_DIR" ] || OUT_DIR="$CHESTER_ROOT"
MANIFEST="$CHESTER_ROOT/agents/manifest.json"
command -v jq >/dev/null 2>&1 || { echo "chester-generate-agents: jq required" >&2; exit 3; }
[ -f "$MANIFEST" ] || { echo "chester-generate-agents: manifest not found: $MANIFEST" >&2; exit 3; }

emit_catalog() {
  [ "$(jq -r '.catalog' "$MANIFEST")" != "null" ] || { echo "chester-generate-agents: no catalog entry in manifest" >&2; exit 4; }
  local out tmpl tmpl_abs dest list glob
  out="$(jq -r '.catalog.output' "$MANIFEST")"
  tmpl="$(jq -r '.catalog.template' "$MANIFEST")"
  tmpl_abs="$CHESTER_ROOT/$tmpl"
  glob="$(jq -r '.catalog.scan_glob' "$MANIFEST")"
  dest="$OUT_DIR/$out"; mkdir -p "$(dirname "$dest")"
  [ -f "$tmpl_abs" ] || { echo "catalog template not found: $tmpl_abs" >&2; exit 4; }
  # Build the flat, alphabetically-sorted "- **name** — description" list from each SKILL.md frontmatter.
  list="$(
    for f in "$CHESTER_ROOT"/$glob; do
      [ -f "$f" ] || continue
      local name desc
      name="$(awk '/^---$/{c++; next} c==1 && /^name:/{sub(/^name:[ ]*/,""); print; exit}' "$f")"
      # description may be inline ("description: text", optionally quoted) OR a YAML
      # folded/literal block scalar ("description: >" / "| " then indented continuation
      # lines). Fold continuation lines into one space-joined line for the catalog entry.
      desc="$(awk '
        /^---$/ { c++; next }
        c==1 && /^description:/ {
          val = $0; sub(/^description:[ \t]*/, "", val)
          if (val ~ /^[>|]/) {
            d = ""
            while ((getline line) > 0) {
              if (line ~ /^---$/) break
              if (line ~ /^[ \t]*$/) continue
              if (line !~ /^[ \t]/) break
              sub(/^[ \t]+/, "", line)
              d = (d == "" ? line : d " " line)
            }
            print d
          } else {
            gsub(/^["'"'"']|["'"'"']$/, "", val); print val
          }
          exit
        }
      ' "$f")"
      [ -n "$name" ] && printf '%s\t%s\n' "$name" "$desc"
    done | LC_ALL=C sort | awk -F'\t' '{printf "- **%s** — %s\n", $1, $2}'
  )"
  # Splice the list into the template slot (replace the CATALOG_SLOT marker line).
  local tmp; tmp="$(mktemp)"
  awk -v list="$list" '/<!-- CATALOG_SLOT -->/{print list; next} {print}' "$tmpl_abs" > "$tmp"
  mv "$tmp" "$dest"
}

emit_catalog
