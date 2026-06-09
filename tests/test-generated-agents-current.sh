#!/usr/bin/env bash
# tests/test-generated-agents-current.sh
# Verify the committed skill catalog is in sync with what the generator produces
# from current frontmatter. A mismatch means a source changed without regeneration.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
GEN="$SCRIPT_DIR/bin/chester-generate-agents"
CATALOG="skills/setup-start/references/skill-index.md"
# Declare both temp dirs and their single trap up front so an early abort never
# fires the EXIT trap on an unbound $TMP2 (set -u).
TMP="$(mktemp -d)"; TMP2="$(mktemp -d)"; trap 'rm -rf "$TMP" "$TMP2"' EXIT
ERRORS=0; fail() { echo "FAIL: $1" >&2; ERRORS=$((ERRORS+1)); }

# Regenerate the catalog to a temp dir and diff against the committed file.
"$GEN" --output-dir "$TMP"
if ! diff -u "$SCRIPT_DIR/$CATALOG" "$TMP/$CATALOG" >/dev/null 2>&1; then
  fail "$CATALOG stale — run bin/chester-generate-agents"
fi

# Determinism: a second generation is byte-identical to the first.
"$GEN" --output-dir "$TMP2"
diff -u "$TMP/$CATALOG" "$TMP2/$CATALOG" >/dev/null 2>&1 || fail "generation is non-deterministic"

# AC-4.1: every skill present, including the 3 that were missing from the hand-maintained index.
for s in design-grillme util-handoff util-improve-codebase; do
  grep -q -- "- \*\*$s\*\*" "$TMP/$CATALOG" || fail "skill '$s' missing from generated catalog"
done

# No bare YAML block-scalar markers leaked into any entry.
grep -qE -- '- \*\*[a-z-]+\*\* — [>|]$' "$TMP/$CATALOG" && fail "a description rendered as a bare '>' or '|'"

[ "$ERRORS" -eq 0 ] && echo "PASS: test-generated-agents-current" || { echo "FAIL: test-generated-agents-current" >&2; exit 1; }
