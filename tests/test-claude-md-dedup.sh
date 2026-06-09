#!/usr/bin/env bash
# tests/test-claude-md-dedup.sh
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ROOT="$REPO_ROOT/CLAUDE.md"
SKILLS="$REPO_ROOT/skills/CLAUDE.md"
ERRORS=0; fail() { echo "FAIL: $1" >&2; ERRORS=$((ERRORS+1)); }

# Root carries the version rule WITH the carve-out, stated once.
grep -qi "not on typo fixes or comment-only edits" "$ROOT" || fail "root CLAUDE.md missing the version-rule carve-out"

# skills/CLAUDE.md no longer carries the version-rule body — it points up to root.
grep -qi "four-digit zero-padded" "$SKILLS" && fail "skills/CLAUDE.md still restates the version-rule body"
grep -qi "root \`CLAUDE.md\`\|root CLAUDE.md" "$SKILLS" || fail "skills/CLAUDE.md does not point up to root for the version rule"

# Phantom pointer fixed: the generated catalog is named; the phantom list path is gone.
grep -q "skills/setup-start/references/skill-index.md" "$ROOT" || fail "root CLAUDE.md does not name the generated catalog"
grep -q "skills/setup-start/references/skill-index.md" "$SKILLS" || fail "skills/CLAUDE.md does not name the generated catalog"
grep -q "setup-start/SKILL.md" "$ROOT" && fail "root CLAUDE.md still names the phantom setup-start/SKILL.md list"
grep -q "setup-start/SKILL.md" "$SKILLS" && fail "skills/CLAUDE.md still names the phantom setup-start/SKILL.md list"

[ "$ERRORS" -eq 0 ] && echo "PASS: test-claude-md-dedup" || { echo "FAIL: test-claude-md-dedup" >&2; exit 1; }
