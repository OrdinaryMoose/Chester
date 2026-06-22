# Pragmatist Transcript — Round 04
# Sprint: 20260604-02-review-start-context
# Role: Pragmatist
# Date: 2026-06-06
# Task: Build the implementation plan. Lens = fewest tasks, buildable, concrete bash.

## Ground-Truth Gathered Before Writing

All verified via direct reads before writing any plan claim.

**session-start current structure (32 lines):**
- No stdin read, no chester-config-read call
- Line 11: `raw_content=$(cat "${CHESTER_ROOT}/skills/setup-start/SKILL.md"...)`
- Line 13: `skill_content=$(echo "$raw_content" | sed '1{/^---$/!q}; 1,/^---$/d')`
- Lines 16–24: `escape_for_json()` function (8 lines, unchanged in rewrite)
- Line 27: `session_context=` assembly with `<EXTREMELY_IMPORTANT>` wrapper
- Line 30: `printf` JSON output — hardcodes `"hookEventName": "SessionStart"`
- jq path confirmed: `.hookSpecificOutput.additionalContext`

**Output wrapper confirmed:** `additionalContext` includes the `<EXTREMELY_IMPORTANT>` 
wrapper text. Tests grep the content INSIDE that wrapper. Both compact and full paths
must produce the same output structure (wrapper + content). The `escape_for_json`
function and `printf` line are shared between both paths — only the content variable
differs. This is the key structural insight: the rewrite is a branch + merge, not a fork.

**chester-config-read mock pattern (from test-compaction-hooks.sh lines 17–25):**
The session-start rewrite calls `eval "$(chester-config-read)"` — it will use PATH
resolution (pre-compact.sh pattern: `CLAUDE_PLUGIN_ROOT` preferred, PATH fallback).
The test mock sets `PATH="$MOCK_BIN:$PATH"` and places a mock `chester-config-read`
in `$MOCK_BIN/`. For new-project: mock returns `CHESTER_CONFIG_PATH='none'`. For
established: mock returns `CHESTER_CONFIG_PATH='$TMPDIR/config.json'`.

**HTML comments in SKILL.md:** pass through the frontmatter sed strip unchanged.
The `escape_for_json` function does not strip HTML comments — they appear in the
injected `additionalContext` as literal text `<!-- mandate-block:X start -->`.
This is acceptable (invisible in rendered Markdown to the model; parseable by the
T8 awk extractor). The markers DO end up in the injected payload but are semantically
inert.

**T8 approach:** test-runs compact trigger → extracts `additionalContext` → extracts
mandate-block regions from SKILL.md via awk marker matching → asserts each region's
text appears in the compact output. Does NOT parse the heredoc from the script source.
~18 lines.

---

## P1 — Task Decomposition

**Four tasks, ordered by dependency.** No over-splitting: each task is independently
buildable, has clear done criteria, and maps to a distinct surface from the spec.

```
Task 1: Edit SKILL.md — add mandate-block markers + remove Checks 0-3 + version bump
Task 2: Rewrite session-start — trigger branch + compact stub heredoc + full-path gate
Task 3: New test-session-start.sh — 8 tests (T1-T8)
Task 4: Smoke-check — run full test suite, confirm existing tests unbroken
```

**Dependency order:** Task 1 before Task 2 (session-start heredoc copies from marked
blocks; markers must exist first). Task 1 + 2 before Task 3 (tests run against the
rewritten script and the marked SKILL.md). Task 3 before Task 4 (suite includes T1-T8).

**Why not split further:**
- Session-start rewrite is one atomic change (trigger branch + stub + full-path gate).
  Splitting compact path from full path creates an intermediate state where compact fires
  but full path is broken — not independently verifiable.
- SKILL.md edits (markers + check removal + version bump) are one atomic surface change.
  Markers must be in place before the session-start heredoc references them (for T8).
- No task for hooks.json — it's explicitly unchanged (spec §8).

---

## P3 — Per-Task Contract

### Task 1: SKILL.md edits

**Files:** `skills/setup-start/SKILL.md`

**Changes:**
1. Add `<!-- mandate-block:NAME start -->` / `<!-- mandate-block:NAME end -->` pairs
   around each of the 8 mandate blocks. Exact block names:
   - `subagent-stop`, `extremely-important`, `instruction-priority`,
     `how-to-access`, `using-skills-h1-the-rule`, `red-flags`, `skill-types`,
     `user-instructions`
   Note: `# Using Skills` (H1) + `## The Rule` are spec-listed as a single stub
   block (#5 in spec §4.2). The marker wraps both together.
2. Remove the `**Check 0` through `**Check 3` blocks (lines ~116–161) from
   `## Session Housekeeping`. Leave the shared `eval "$(chester-config-read)"` line
   and the `1. **First-run project configuration:**` block intact. Remove the
   `If \`CHESTER_CONFIG_PATH\` is not \`none\`...` paragraph and the four check blocks.
3. Bump frontmatter version: `v0002` → `v0003`.

**Done criteria:**
- `grep -c 'mandate-block' SKILL.md` == 16 (8 start + 8 end markers)
- `grep -c 'Check [0-3]' SKILL.md` == 0 (checks removed)
- Frontmatter shows `version: v0003`
- File still passes `bash tests/test-start-cleanup.sh`

**LOC:** ~16 lines added (markers), ~49 lines removed (Checks 0–3), net ~33 removed.
~207 → ~174 lines.

---

### Task 2: session-start rewrite

**Files:** `chester-util-config/session-start`

**Changes (full rewrite of the 32-line script to ~67 lines):**

Structure (branch + merge):
```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CHESTER_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# ── Trigger detection ──────────────────────────────────────────
INPUT=$(cat)
TRIGGER=$(echo "$INPUT" | jq -r '.trigger // ""' 2>/dev/null || echo "")

# ── escape_for_json (unchanged, 8 lines) ──────────────────────
escape_for_json() { ... }

# ── Compact path ───────────────────────────────────────────────
if [ "$TRIGGER" = "compact" ]; then
  skill_content=$(cat <<'STUB'
# Session context: housekeeping already complete this session. Mandate only.
<!-- mandate-block:subagent-stop start -->
<SUBAGENT-STOP>
...
</SUBAGENT-STOP>
<!-- mandate-block:subagent-stop end -->
[... remaining 7 blocks verbatim from SKILL.md ...]
STUB
)
# → shared escape + wrap + printf + exit 0

# ── Full path (startup / clear / unknown) ─────────────────────
else
  # Config read (for established-project gate)
  eval "$(chester-config-read 2>/dev/null)" 2>/dev/null || true

  raw_content=$(cat "${CHESTER_ROOT}/skills/setup-start/SKILL.md" 2>&1 \
    || echo "Error reading setup-start skill")
  skill_content=$(echo "$raw_content" | sed '1{/^---$/!q}; 1,/^---$/d')

  # Established-project: strip entire Session Housekeeping block
  if [ "${CHESTER_CONFIG_PATH:-none}" != "none" ]; then
    skill_content=$(echo "$skill_content" | \
      sed '/^## Session Housekeeping/,/^## How to Access Skills/{/^## How to Access Skills/!d}')
  fi
fi

# ── Shared: escape + wrap + emit ──────────────────────────────
skill_escaped=$(escape_for_json "$skill_content")
session_context="<EXTREMELY_IMPORTANT>\\nYou have Chester.\\n\\n..."
printf '{\n  "hookSpecificOutput": {\n    "hookEventName": "SessionStart",\n    "additionalContext": "%s"\n  }\n}\n' \
  "$session_context"
exit 0
```

**Done criteria:**
- `echo '{"trigger":"compact"}' | session-start` → output contains "SUBAGENT-STOP",
  does NOT contain "Session Housekeeping"
- With established-project mock + `startup` trigger → contains "How to Access Skills",
  does NOT contain "Session Housekeeping"
- With new-project mock + `startup` trigger → contains "First-run project configuration"
- `echo '{}' | session-start` → full payload (no crash)

**LOC:** 32 → ~67 lines (+35 net). Stub heredoc ~35 lines for 8 blocks.

---

### Task 3: test-session-start.sh

**Files:** `tests/test-session-start.sh` (new)

**8 tests, following test-compaction-hooks.sh pattern:**

Setup:
```bash
TMPDIR=$(mktemp -d); trap 'rm -rf "$TMPDIR"' EXIT
MOCK_BIN="$TMPDIR/bin"; mkdir -p "$MOCK_BIN"
SESSION_START="$CHESTER_ROOT/chester-util-config/session-start"
SKILL="$CHESTER_ROOT/skills/setup-start/SKILL.md"
# Established-project mock (CHESTER_CONFIG_PATH != none)
cat > "$MOCK_BIN/chester-config-read-established" << ...
# New-project mock (CHESTER_CONFIG_PATH = none)
cat > "$MOCK_BIN/chester-config-read-new" << ...
```

T1 — compact → all mandate blocks present:
```bash
STDIN='{"trigger":"compact"}'
OUT=$(echo "$STDIN" | "$SESSION_START")
CTX=$(echo "$OUT" | jq -r '.hookSpecificOutput.additionalContext // empty')
echo "$CTX" | grep -q "SUBAGENT-STOP" || fail "T1: missing SUBAGENT-STOP"
echo "$CTX" | grep -q "Instruction Priority" || fail "T1: missing Instruction Priority"
echo "$CTX" | grep -q "Red Flags" || fail "T1: missing Red Flags"
echo "$CTX" | grep -q "Skill Types" || fail "T1: missing Skill Types"
```

T2 — compact → Session Housekeeping ABSENT:
```bash
echo "$CTX" | grep -qv "Session Housekeeping" || fail "T2: housekeeping in compact stub"
echo "$CTX" | grep -qv "First-run project" || fail "T2: wizard in compact stub"
```

T3 — startup + established → housekeeping absent:
```bash
STDIN='{"trigger":"startup"}'
OUT=$(echo "$STDIN" | PATH="$ESTABLISHED_BIN:$PATH" "$SESSION_START")
CTX=$(echo "$OUT" | jq -r '.hookSpecificOutput.additionalContext // empty')
echo "$CTX" | grep -qv "Session Housekeeping" || fail "T3: housekeeping present on established startup"
echo "$CTX" | grep -q "Instruction Priority" || fail "T3: mandate missing on established startup"
```

T4 — startup + new project → housekeeping present:
```bash
OUT=$(echo '{"trigger":"startup"}' | PATH="$NEW_BIN:$PATH" "$SESSION_START")
CTX=$(echo "$OUT" | jq -r '.hookSpecificOutput.additionalContext // empty')
echo "$CTX" | grep -q "First-run project" || fail "T4: wizard absent on new project startup"
```

T5 — clear + established → same as T3:
```bash
OUT=$(echo '{"trigger":"clear"}' | PATH="$ESTABLISHED_BIN:$PATH" "$SESSION_START")
CTX=$(echo "$OUT" | jq -r '.hookSpecificOutput.additionalContext // empty')
echo "$CTX" | grep -qv "Session Housekeeping" || fail "T5: housekeeping present on clear"
```

T6 — absent trigger → full payload:
```bash
OUT=$(echo '{}' | PATH="$ESTABLISHED_BIN:$PATH" "$SESSION_START")
CTX=$(echo "$OUT" | jq -r '.hookSpecificOutput.additionalContext // empty')
[ -n "$CTX" ] || fail "T6: no output on absent trigger"
echo "$CTX" | grep -q "Instruction Priority" || fail "T6: mandate missing on fallback"
```

T7 — malformed JSON → full payload, exit 0:
```bash
OUT=$(echo 'NOT JSON' | "$SESSION_START")
RC=$?
[ "$RC" -eq 0 ] || fail "T7: non-zero exit on malformed JSON"
CTX=$(echo "$OUT" | jq -r '.hookSpecificOutput.additionalContext // empty')
[ -n "$CTX" ] || fail "T7: empty output on malformed JSON"
```

T8 — drift: every mandate-block region in SKILL.md present in compact output:
```bash
STDIN='{"trigger":"compact"}'
OUT=$(echo "$STDIN" | "$SESSION_START")
CTX=$(echo "$OUT" | jq -r '.hookSpecificOutput.additionalContext // empty')
# Extract each marked region from SKILL.md and assert present in compact output
awk '
  /<!-- mandate-block:[^ ]+ start -->/ { in_block=1; block=""; next }
  /<!-- mandate-block:[^ ]+ end -->/   {
    if (in_block) { blocks[++n] = block }
    in_block=0; next
  }
  in_block { block = block $0 "\n" }
  END {
    for (i=1; i<=n; i++) {
      # write each block to a temp file for comparison
      print blocks[i] > "/tmp/mandate_block_" i ".txt"
    }
    print n  # print count
  }
' "$SKILL" > /tmp/mandate_count.txt
NBLOCKS=$(cat /tmp/mandate_count.txt)
[ "$NBLOCKS" -eq 8 ] || fail "T8: expected 8 mandate blocks in SKILL.md, found $NBLOCKS"
for i in $(seq 1 "$NBLOCKS"); do
  block_text=$(cat "/tmp/mandate_block_${i}.txt")
  # Check first distinctive line of each block appears in output
  first_line=$(echo "$block_text" | head -1)
  echo "$CTX" | grep -qF "$first_line" || fail "T8: mandate block $i missing from compact stub"
done
echo "PASS: T8 — all $NBLOCKS mandate blocks present in compact stub"
```

**Done criteria:** all 8 tests pass, exit 0.
**LOC:** ~80 lines (setup ~20, 8 tests ~60).

---

### Task 4: Smoke-check

**Files:** none modified

**Action:** `for t in tests/test-*.sh; do bash "$t" || echo "FAIL: $t"; done`

**Done criteria:**
- All existing tests pass (especially `test-compaction-hooks.sh`, `test-start-cleanup.sh`)
- `test-session-start.sh` T1–T8 all pass
- No regressions

**LOC:** 0 (run only).

---

## P5 — Execution Mode

**Recommendation: inline.**

Rationale:
- 3 code tasks (Task 1 + 2 + 3) + 1 run task (Task 4). Small total surface (~148 LOC).
- Tasks are tightly coupled: Task 2's heredoc copies from Task 1's markers; Task 3's T8
  depends on both markers (Task 1) and the rewritten session-start (Task 2). Subagent
  dispatch would require each subagent to re-read all prior outputs, adding coordination
  overhead that exceeds the work itself.
- Each task is small enough that an inline executor can hold all context across tasks
  without needing to partition.
- The test-first discipline applies inline: write T1-T8 stubs (failing) before
  implementing Task 2, then green them.

**Subagent would be appropriate if:** tasks were >200 LOC each, independently deployable,
or if there were parallel execution opportunities. None of these apply here.

---

## P7 — T8 Concrete Bash

Full T8 implementation (~22 lines). **Revised after Purist ruling: full-block verbatim equality required; first-line grep insufficient.**

Purist confirmed (with round-trip test): `jq -r` is the exact inverse of `escape_for_json` (five bijective substitutions — backslash, double-quote, newline, CR, tab). Instruction Priority text (contains literal double-quotes) decoded byte-for-byte identical to source. Full-block diff is achievable.

First-line grep misses in-place word edits inside a block (e.g., "1% chance" → "2% chance" in EXTREMELY-IMPORTANT). That is spec §4.3 case (a). Insufficient.

Blank-line treatment: awk prints only inside `capturing=1`. Intra-block blank lines included; inter-block blanks (between `end` and next `start`) excluded naturally. Do NOT strip all blanks globally.

```bash
# T8: drift — mandate-block regions in SKILL.md verbatim in compact output
COMPACT_STDIN='{"hook_event_name":"SessionStart","trigger":"compact","session_id":"t8","cwd":"/tmp"}'
COMPACT_OUT=$(echo "$COMPACT_STDIN" | "$CHESTER_ROOT/chester-util-config/session-start")
COMPACT_CTX=$(echo "$COMPACT_OUT" | jq -r '.hookSpecificOutput.additionalContext // empty')
[ -n "$COMPACT_CTX" ] || fail "T8: compact emitted no additionalContext"

# Block counts (spec §4.3 cases b, c)
BLOCK_COUNT=$(grep -c 'mandate-block:.*start' "$CHESTER_ROOT/skills/setup-start/SKILL.md" || true)
[ "$BLOCK_COUNT" -eq 8 ] || fail "T8: expected 8 mandate blocks in SKILL.md, found $BLOCK_COUNT"
STUB_COUNT=$(printf '%s' "$COMPACT_CTX" | grep -c 'mandate-block:.*start' || true)
[ "$STUB_COUNT" -eq 8 ] || fail "T8: expected 8 mandate blocks in compact stub, found $STUB_COUNT"

# Extract all mandate content from SKILL.md (intra-block blanks preserved, inter-block blanks excluded)
EXPECTED=$(awk '
  /<!-- mandate-block:.*start -->/ { capturing=1; next }
  /<!-- mandate-block:.*end -->/   { capturing=0; next }
  capturing { print }
' "$CHESTER_ROOT/skills/setup-start/SKILL.md")

# Extract same regions from decoded additionalContext by same markers
ACTUAL=$(printf '%s' "$COMPACT_CTX" | awk '
  /<!-- mandate-block:.*start -->/ { capturing=1; next }
  /<!-- mandate-block:.*end -->/   { capturing=0; next }
  capturing { print }
')

# Full-block verbatim equality (spec §4.3 case a)
diff <(printf '%s\n' "$EXPECTED") <(printf '%s\n' "$ACTUAL") \
  || fail "T8: compact stub diverges from SKILL.md mandate blocks"
echo "PASS: T8 — all 8 mandate blocks verbatim in compact stub"
```

This covers all three cases from spec §4.3:
- (a) in-place edit of a stub block: `diff` catches the changed line
- (b) stub block silently dropped: `STUB_COUNT` != 8 fails
- (c) new marked block added to SKILL.md but not copied: `BLOCK_COUNT` check + `diff` on extracted content catches the gap

The awk extractor uses open/close marker anchors (not line numbers), making it rename-safe.
`jq -r` exactly inverts `escape_for_json`; no extra normalization needed.

---

## P8 — Total Cost

**Confirmed against task split:**

| Surface | Change | LOC |
|---|---|---|
| `session-start` | Rewrite 32→67 lines | +35 net |
| `SKILL.md` | +16 markers, −49 checks, bump | −33 net |
| `test-session-start.sh` | New file | +80 |
| `hooks.json` | Unchanged | 0 |

**Total new/changed LOC:** 35 (session-start) + 80 (test file) = 115 new lines.
**Net LOC change including removals:** 115 − 33 = 82 net.

**Reconciliation with prior estimate (~148 LOC):**
- Prior ~65 for session-start was gross lines in rewritten file (67 ✓).
- Prior ~83 for test file: 80 is close (within rounding).
- Prior ~30 removed from SKILL.md: actual is ~33 removed (checks) + 16 added (markers)
  = ~17 net removed. Prior estimate was net-removed only; both are accurate.
- The ~148 was "new/changed" counting: 67 (session-start full file) + 80 (test file) +
  1 (SKILL.md net change rounds to nothing significant) ≈ 147. Confirmed.

---

## Peer Question

→ **To: purist**

On Task 3 T8: I've specced the drift test to extract mandate blocks by marker name from
SKILL.md and assert each block's first distinctive line appears in the compact output
(via `grep -qF`). This tests presence of each block, not byte-exact verbatim equality
of the full block text. The spec §4.3 says "verbatim" — but extracting the full block
text and doing a substring comparison (grep -F) vs a full-equality check (diff) are
different things. Is `grep -qF first_line` of each block sufficient for the verbatim
requirement, or does the spec require full-block diff equality? The practical concern:
full-block diff requires getting newline handling right across the escape_for_json
transformation (which converts `\n` to literal backslash-n in the JSON string). First-
line grep avoids that escaping complexity entirely.

---

## Peer exchanges (round04)

### Researcher findings confirmation (Q1 + Q2 + Q3)

Researcher confirmed all three questions independently. No position changes.

**Q1 (mock setup):** session-start rewrite calls `chester-config-read` via plain PATH
(no CLAUDE_PLUGIN_ROOT guard needed — spec §3.2 is simple PATH lookup). Test mock:
prepend `$TMPDIR/bin` to PATH with mock `chester-config-read` binary returning
`CHESTER_CONFIG_PATH='$TMPDIR/config.json'` (established) or `CHESTER_CONFIG_PATH='none'`
(new project). Exact same pattern as test-compaction-hooks.sh lines 14–25. Two mock
variants needed: one per established/new-project branch test.

**Q2 (output contract):** current session-start line 30 hardcodes `"hookEventName":
"SessionStart"` — not copied from stdin. jq path `.hookSpecificOutput.additionalContext`
confirmed correct for T1–T7 assertions. Rewrite keeps the printf verbatim.

**Q3 (HTML comments survive full pipeline):** confirmed by live bash test. Three layers:
(1) frontmatter sed passes comments unchanged; (2) `escape_for_json` does not alter
`<!-- -->` characters (none of `<`, `>`, `!`, `-`, `:` are in the substitution set);
(3) comments land in additionalContext as literal text, readable by the model and parseable
by T8's awk extractor. The same marker syntax used in SKILL.md can also be used to
extract from the jq-decoded additionalContext — both use identical awk range anchors.

**Implication for T8 (upgrading from first-line grep):** since HTML markers survive into
additionalContext intact and `jq -r` decodes the JSON string (restoring literal newlines),
T8 can extract mandate blocks from the COMPACT_CTX using the same awk marker pattern it
uses on SKILL.md. This makes T8 a true bidirectional match:
- Extract each block from SKILL.md by marker → normalize
- Extract same-named block from compact additionalContext by marker → normalize
- Diff the two
This is more precise than first-line grep and avoids the escaping complexity entirely
(jq -r handles the decode). Pending purist's answer on whether this is required.

### Pragmatist → Purist → resolved

**Question:** is `grep -qF first_line` sufficient for the spec's "verbatim" requirement, or
does T8 require full-block diff equality?

**Purist ruling (DECISIVE — closes the question):**

Full-block verbatim equality is required. First-line grep is insufficient.

Verification: `jq -r` is the exact inverse of `escape_for_json` (five bijective substitutions).
Round-trip test on Instruction Priority text (contains literal double-quotes): byte-for-byte
identical to source. Full-block diff is achievable.

First-line grep misses: a word-level edit inside a block (e.g., "1% chance" → "2% chance" in
EXTREMELY-IMPORTANT). First line still matches; T8 silently passes. That is spec §4.3 case (a) —
the primary case the verbatim check exists to catch.

Blank-line treatment: awk naturally handles this. Print inside `capturing=1` → intra-block
blanks included, inter-block blanks (between `end` and next `start`, when `capturing=0`) excluded.
Do NOT strip all blank lines globally.

**Position change:** T8 revised from first-line grep to full-block `diff` (see P7 above).

---
<!-- created-at: 2026-06-06 -->
<!-- role: pragmatist -->
<!-- round: 04 -->
