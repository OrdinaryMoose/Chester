#!/usr/bin/env bash
# tests/test-generate-catalog.sh
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
GEN="$SCRIPT_DIR/bin/chester-generate-agents"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
ERRORS=0; fail() { echo "FAIL: $1" >&2; ERRORS=$((ERRORS+1)); }

grep -q 'emit_agent' "$SCRIPT_DIR/chester-util-config/chester-generate-agents.sh" && fail "generator still defines emit_agent — agent-mode not stripped"
grep -q 'extract_section' "$SCRIPT_DIR/chester-util-config/chester-generate-agents.sh" && fail "generator still defines extract_section — agent-mode not stripped"

mkdir -p "$TMP/agents/sources" "$TMP/skills/bravo" "$TMP/skills/alpha" "$TMP/skills/charlie" "$TMP/skills/delta" "$TMP/skills/setup-start/references"
printf -- '---\nname: bravo\ndescription: Does bravo things.\nversion: v0001\n---\n# x\n' > "$TMP/skills/bravo/SKILL.md"
printf -- '---\nname: alpha\ndescription: Does alpha things.\nversion: v0001\n---\n# x\n' > "$TMP/skills/alpha/SKILL.md"
# charlie uses a YAML folded block scalar (description: >) — 9 real Chester SKILL.md files do.
# The catalog must fold the indented continuation lines into one space-joined entry,
# NOT emit a bare ">". This fixture guards that regression.
printf -- '---\nname: charlie\ndescription: >\n  Folds line one\n  and line two.\nversion: v0001\n---\n# x\n' > "$TMP/skills/charlie/SKILL.md"
# delta uses a single-quoted inline description — exercises the quote-strip path.
printf -- "---\nname: delta\ndescription: 'Quoted delta thing.'\nversion: v0001\n---\n# x\n" > "$TMP/skills/delta/SKILL.md"
printf 'HEADER LINE\n<!-- CATALOG_SLOT -->\nFOOTER LINE\n' > "$TMP/agents/sources/catalog-template.md"
cat > "$TMP/agents/manifest.json" <<'JSON'
{ "agents": [],
  "catalog": { "output": "skills/setup-start/references/skill-index.md",
    "scan_glob": "skills/*/SKILL.md",
    "template": "agents/sources/catalog-template.md" } }
JSON

"$GEN" --root "$TMP"

OUT="$(cat "$TMP/skills/setup-start/references/skill-index.md")"
echo "$OUT" | grep -q 'HEADER LINE' || fail "template header missing"
echo "$OUT" | grep -q 'FOOTER LINE' || fail "template footer missing"
# alpha before bravo (alphabetical), both rendered as list entries
echo "$OUT" | grep -q -- '- \*\*alpha\*\* — Does alpha things.' || fail "alpha entry missing"
echo "$OUT" | grep -q -- '- \*\*bravo\*\* — Does bravo things.' || fail "bravo entry missing"
# Folded block scalar must render as one space-joined line, not a bare ">".
echo "$OUT" | grep -q -- '- \*\*charlie\*\* — Folds line one and line two.' || fail "charlie folded-block entry not folded correctly"
echo "$OUT" | grep -q -- '- \*\*charlie\*\* — >' && fail "charlie rendered bare '>' — folded block not handled"
# Single-quoted inline description must have quotes stripped.
echo "$OUT" | grep -q -- '- \*\*delta\*\* — Quoted delta thing.' || fail "delta quoted entry not quote-stripped"
LA=$(echo "$OUT" | grep -n 'alpha' | head -1 | cut -d: -f1)
LB=$(echo "$OUT" | grep -n 'bravo' | head -1 | cut -d: -f1)
[ "$LA" -lt "$LB" ] || fail "not alphabetical"
echo "$OUT" | grep -q 'CATALOG_SLOT' && fail "slot marker not replaced"

[ "$ERRORS" -eq 0 ] && echo "PASS: test-generate-catalog" || { echo "FAIL: test-generate-catalog" >&2; exit 1; }
