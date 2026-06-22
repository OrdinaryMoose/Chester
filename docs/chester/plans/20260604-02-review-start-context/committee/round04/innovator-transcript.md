# Innovator Transcript — Round 04 (BUILD — implementation plan)
# Sprint: 20260604-02-review-start-context
# Date: 2026-06-06

## Ground-Truth Pull (Pre-Position)

Direct reads before forming position.

**session-start structure (32 lines, confirmed):**
- Line 11: `raw_content=$(cat "...SKILL.md" 2>&1 || echo "Error ...")`
- Line 13: `skill_content=$(echo "$raw_content" | sed '1{/^---$/!q}; 1,/^---$/d')` — frontmatter strip
- Line 26: `skill_escaped=$(escape_for_json "$skill_content")`
- Line 27: `session_context="<EXTREMELY_IMPORTANT>\\n..."` — wraps the payload
- Line 30: `printf '...' "$session_context"` — emits JSON
- Line 32: `exit 0`
The entire current script is the "no branching" path. The rewrite replaces lines 11–32
with branching logic; lines 1–10 (shebang, set -euo pipefail, SCRIPT_DIR, CHESTER_ROOT)
are unchanged. escape_for_json() function (lines 16–24) is reused.

**Test harness pattern (test-compaction-hooks.sh, lines 11–25, Test 4 at lines 152–175):**
- TMPDIR=$(mktemp -d) + trap 'rm -rf "$TMPDIR"' EXIT
- Mock `chester-config-read` binary written to TMPDIR/bin, prepended to PATH — outputs
  `CHESTER_CONFIG_PATH` etc. from env. This is the established-project/new-project gate.
- stdin JSON piped directly: `OUTPUT=$(echo "$STDIN_JSON" | "$SCRIPT")`
- RC captured: `RC=$?`; asserted: `[ "$RC" -eq 0 ] || fail "..."`
- additionalContext extracted: `CONTEXT=$(echo "$OUTPUT" | jq -r '.hookSpecificOutput.additionalContext // empty')`
- Content asserted: `echo "$CONTEXT" | grep -q "text" || fail "..."`

**No test-session-start.sh exists.** File to be created.

**SKILL.md post-edit structure (after Checks 0–3 removal):**
- Current: 207 lines
- Remove Checks 0–3 (approx lines 116–160 = ~48 lines) → ~159 lines
- Add 8×2 = 16 HTML-comment marker lines → ~175 lines final

**Existing XML-style tags in SKILL.md:**
- `<SUBAGENT-STOP>` / `</SUBAGENT-STOP>` at lines 7/9
- `<EXTREMELY-IMPORTANT>` / `</EXTREMELY-IMPORTANT>` at lines 11/17
These are already unique-string delimiters. The awk/grep extractor can treat them as
native markers — no additional HTML comments needed for those two blocks.

---

## Plan Position

### P1. Task Decomposition

Five tasks, strictly ordered by dependency. No task is a ceremony task — each
corresponds to a spec deliverable.

**Task 1 — Edit SKILL.md: add markers + remove Checks 0–3 + version bump**

Files: `skills/setup-start/SKILL.md`
What: (a) Remove Checks 0–3 (lines ~116–160); (b) Add HTML-comment mandate-block
markers around the 6 heading-delimited blocks (SUBAGENT-STOP and EXTREMELY-IMPORTANT
already have XML tags — no new markers needed); (c) version v0002 → v0003.
Done: all 8 blocks are marked; Checks 0–3 are absent; version is v0003.
Why first: the markers are the source-of-truth for the heredoc content (Task 2) and
the drift test (Task 4). You cannot write the heredoc correctly until you know the exact
verbatim text of each marked block. You cannot write T8 until the markers exist to
extract from.

**Task 2 — Rewrite session-start: trigger branch + heredoc + wide-strip**

Files: `chester-util-config/session-start`
What: Add `INPUT=$(cat)` + `TRIGGER=$(echo "$INPUT" | jq -r '.trigger // ""')`;
compact branch emitting the mandate heredoc; full-payload path with
`eval chester-config-read` + `IS_NEW_PROJECT` gate + wide-strip sed for established
projects; fallback (empty/malformed trigger → full payload). The heredoc content is
copied verbatim from the marked blocks in Task 1's SKILL.md edit.
Done: script branches on trigger; compact emits stub; established startup emits
stripped body; new-project emits full body; malformed → full body.
Why after Task 1: the heredoc must be verbatim-copied from the marked blocks. Task 1
defines those blocks.

**Task 3 — Write tests T1–T7 (behavior tests)**

Files: `tests/test-session-start.sh` (new)
What: the seven behavior tests (compact mandate present, compact housekeeping absent,
established startup housekeeping absent, new-project startup wizard present, clear same
as established, absent trigger full payload, malformed trigger full payload). Pattern:
mock chester-config-read via TMPDIR/bin, pipe stdin JSON, assert on additionalContext.
Done: all seven tests pass (bash tests/test-session-start.sh exits 0).
Why after Task 2: the tests drive the implementation; they need the rewritten
session-start to run against.

**Task 4 — Write T8 (drift test)**

Files: `tests/test-session-start.sh` (extend Task 3's file)
What: the bidirectional marker-extraction drift test. Extract each
`mandate-block:NAME` region from SKILL.md; assert each is present verbatim and in
order in the session-start heredoc; assert nothing in the heredoc falls outside the
union of those regions + the orientation line.
Done: T8 passes; T8 fails when a block is edited in SKILL.md but not the heredoc (manually verified by temporarily altering one block).
Why after Task 3: T8 shares the test file. Task 4 extends it.
Why after Task 1: T8 reads SKILL.md markers; markers must exist.
Why after Task 2: T8 extracts the heredoc from session-start; heredoc must exist.

**Task 5 — Final integration check**

Files: none new — run all tests
What: run the full test suite (test-session-start.sh + existing test-compaction-hooks.sh
+ test-session-metadata.sh); confirm no regressions.
Done: all tests green; tree clean.

---

### P2. Sequencing — dependencies and parallelism

Strict sequence: Task 1 → Task 2 → Task 3 → Task 4 → Task 5.

- Task 1 must precede Task 2 (heredoc copies from marked blocks).
- Task 2 must precede Task 3 (tests drive the implementation).
- Task 3 must precede Task 4 (T8 extends the same file; sequential authoring is cleaner
  than splitting the file across tasks).
- Task 4 must precede Task 5 (all tests must be written before integration check).

**No parallelism is possible** given the dependency chain. The only micro-parallelism
opportunity is writing the escape_for_json function into session-start before Task 1
completes — but that function already exists in the current file and is preserved by
the rewrite, so there is nothing to parallelize.

The spec estimates ~148 changed/new LOC total. This is a single-session implementation;
parallelism buys nothing here.

---

### P3. Per-Task Contract (files + done-criteria)

**Task 1**
Files changed: `skills/setup-start/SKILL.md`
Done criteria:
- Checks 0–3 removed (grep for "Check 0:" in SKILL.md returns empty)
- 8 mandate blocks each wrapped in `<!-- mandate-block:NAME start/end -->` pairs
- SUBAGENT-STOP and EXTREMELY-IMPORTANT use their existing XML tags (no new HTML
  comments for those two — the extractor handles both tag types)
- Version field reads `v0003`
- `bash tests/test-compaction-hooks.sh` still passes (SKILL.md edit must not break
  existing hook tests — they don't depend on SKILL.md content, so this is a sanity check)

**Task 2**
Files changed: `chester-util-config/session-start`
Done criteria:
- `echo '{"trigger":"compact"}' | bash session-start` exits 0 and additionalContext
  contains "SUBAGENT-STOP" and does NOT contain "Session Housekeeping"
- `CHESTER_CONFIG_PATH=somevalue echo '{"trigger":"startup"}' | bash session-start`
  exits 0 and additionalContext does NOT contain "Session Housekeeping"
- `CHESTER_CONFIG_PATH=none echo '{"trigger":"startup"}' | bash session-start`
  exits 0 and additionalContext DOES contain "Session Housekeeping"
- `echo '{}' | bash session-start` exits 0 (fallback: full payload)

**Task 3**
Files changed: `tests/test-session-start.sh` (new)
Done criteria: `bash tests/test-session-start.sh` exits 0 with T1–T7 all PASS

**Task 4**
Files changed: `tests/test-session-start.sh` (extend)
Done criteria:
- T8 passes against the current SKILL.md + session-start
- T8 FAILS when a block in SKILL.md is temporarily altered (manual adversarial check)
- T8 FAILS when a block is removed from the heredoc (manual adversarial check)

**Task 5**
Files changed: none
Done criteria: all three test files exit 0; `git status` clean tree (no untracked
test artifacts)

---

### P4. Test Mapping — TDD order

Strict TDD is partially feasible here but has a complication: T8 (drift test) requires
both SKILL.md markers AND the session-start heredoc to exist before it can pass. The
behavior tests (T1–T7) can be written before the implementation is done (they will fail
until Task 2 is complete), but T8 requires both Task 1 and Task 2 to be complete before
it can even be written correctly (the test body extracts from actual SKILL.md markers).

**Practical TDD order:**
1. Write T1–T7 shells (define test scaffolding, mock chester-config-read pattern,
   stub assertions) — write these BEFORE implementing Task 2. They will fail.
2. Implement Task 1 (SKILL.md markers + check removal).
3. Implement Task 2 (session-start rewrite). T1–T7 should now pass.
4. Write T8 using the actual marked blocks from Task 1. T8 should pass immediately
   on first write if Task 2's heredoc was copied correctly.

Deviation from strict TDD: T8 cannot be written first because it reads runtime
artifacts (marked blocks) that don't exist until Task 1. Writing T8 as a pure stub
that always-fails is possible but adds no value — it's simpler to write T8 after Task 1.

---

### P7. Drift Test (T8) — Marker Scheme and Extraction

**Marker naming scheme:**

For the 6 heading-delimited blocks that need new markers:
```
<!-- mandate-block:instruction-priority start -->
## Instruction Priority
...
<!-- mandate-block:instruction-priority end -->

<!-- mandate-block:how-to-access start -->
## How to Access Skills
...
<!-- mandate-block:how-to-access end -->

<!-- mandate-block:using-skills-and-rule start -->
# Using Skills
...
## The Rule
...
<!-- mandate-block:using-skills-and-rule end -->

<!-- mandate-block:red-flags start -->
## Red Flags
...
<!-- mandate-block:red-flags end -->

<!-- mandate-block:skill-types start -->
## Skill Types
...
<!-- mandate-block:skill-types end -->

<!-- mandate-block:user-instructions start -->
## User Instructions
...
<!-- mandate-block:user-instructions end -->
```

For SUBAGENT-STOP and EXTREMELY-IMPORTANT: use their existing XML tags as markers.
The extractor handles two tag types:
- XML-style: `<BLOCK-NAME>` ... `</BLOCK-NAME>`
- HTML-comment: `<!-- mandate-block:NAME start -->` ... `<!-- mandate-block:NAME end -->`

**Extraction in T8 (bash + awk, ~20 lines) — corrected after purist peer input:**

Two issues identified and resolved:

**Issue 1 — awk form for closing tags (off-by-one risk):**
The correct form sets `capturing=0` in the SAME action block as the `print`, with `print`
firing before the flag resets on the next iteration. The safe form:

```bash
# Extract all mandate-block:* regions from SKILL.md in order
extract_mandate_blocks() {
  local skill_md="$1"
  awk '
    /<!-- mandate-block:.* start -->/ { capturing=1; next }
    /<!-- mandate-block:.* end -->/   { capturing=0; next }
    /<SUBAGENT-STOP>/                 { capturing=1 }
    /<\/SUBAGENT-STOP>/               { print; capturing=0; next }
    /<EXTREMELY-IMPORTANT>/           { capturing=1 }
    /<\/EXTREMELY-IMPORTANT>/         { print; capturing=0; next }
    capturing                         { print }
  ' "$skill_md"
}
```

Key: for XML-tag blocks, opening tag sets `capturing=1` and falls through to the
`capturing { print }` rule (so the opening tag line IS printed). Closing tag prints
explicitly THEN sets `capturing=0` and nexts — so the closing tag line IS printed and
capturing stops cleanly. No off-by-one.

**Contract: tag lines included in EXPECTED.** `<SUBAGENT-STOP>` and `</SUBAGENT-STOP>`
are mandate content — the model reads them as behavioral signals. The heredoc must
contain them verbatim; EXPECTED must include them.

**Issue 2 — inter-block blank lines (false positive risk):**
SKILL.md has blank lines between blocks (e.g. line 10 between `</SUBAGENT-STOP>` and
`<EXTREMELY-IMPORTANT>`). These blanks fall OUTSIDE markers (capturing=0) so the awk
naturally excludes them from EXPECTED. The heredoc must match: no blank lines between
the 8 blocks in the heredoc. This is the explicit inter-block blank line policy.

Internal blank lines (e.g. within EXTREMELY-IMPORTANT body) ARE captured (capturing=1)
and must appear in both EXPECTED and the heredoc verbatim.

**Normalization rule (belt-and-suspenders):** before diffing, strip leading/trailing
blank lines from each side only, not internal ones:

```bash
EXPECTED=$(extract_mandate_blocks "$SKILL_MD")
# Extract heredoc from session-start (between cat <<'EOF' and EOF markers)
ACTUAL=$(sed -n "/^cat <<'EOF'/,/^EOF$/p" "$SESSION_START" | sed '1d;$d')
# Diff — both sides must match exactly including internal blank lines
diff <(echo "$EXPECTED") <(echo "$ACTUAL") || fail "T8: stub drift detected"
```

If the diff produces false positives from trailing newline differences, add
`| sed '/^[[:space:]]*$/d'` to both sides — but only after verifying no mandate block
has a load-bearing internal blank line that must be preserved.

**Why this is cleaner than per-block individual diffs:**
The single awk pass produces the ordered union of all mandate blocks. The single diff
against the heredoc catches all three drift cases at once: (a) in-place edit, (b)
dropped block, (c) new marked block not copied to stub. No per-block looping, no
separate membership assertions required. The ordering check is implicit in the diff
(a reordered block produces a diff even if all content is present).

**The two-tag-type awk is the key simplification over a pure HTML-comment approach:**
The XML-style tags on SUBAGENT-STOP and EXTREMELY-IMPORTANT already demarcate those
blocks. Adding HTML comments AROUND those XML tags creates nested markers — confusing.
The awk handles both natively: XML-style for the two top blocks, HTML-comment for the
six heading blocks. Clean, no nesting, no special cases. Confirmed correct by purist.

---

### P8. Hook Test Invocation

Pattern to reuse from test-compaction-hooks.sh:

```bash
# Setup (once per test file)
TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT
CHESTER_ROOT="$(git rev-parse --show-toplevel)"
SESSION_START="$CHESTER_ROOT/chester-util-config/session-start"

# Mock chester-config-read for established-project path
MOCK_BIN="$TMPDIR/bin"
mkdir -p "$MOCK_BIN"
cat > "$MOCK_BIN/chester-config-read" <<'MOCK'
#!/bin/bash
echo "export CHESTER_WORKING_DIR='$TMPDIR/working'"
echo "export CHESTER_PLANS_DIR='plans'"
echo "export CHESTER_CONFIG_PATH='$TMPDIR/config.json'"
MOCK
chmod +x "$MOCK_BIN/chester-config-read"
export PATH="$MOCK_BIN:$PATH"

# For new-project path, write a second mock that outputs CHESTER_CONFIG_PATH=none
cat > "$MOCK_BIN/chester-config-read-new" <<'MOCK'
#!/bin/bash
echo "export CHESTER_CONFIG_PATH='none'"
MOCK
```

For each test:
```bash
OUTPUT=$(echo '{"hook_event_name":"SessionStart","trigger":"compact"}' | bash "$SESSION_START")
RC=$?
[ "$RC" -eq 0 ] || fail "T1: expected exit 0, got $RC"
CONTEXT=$(echo "$OUTPUT" | jq -r '.hookSpecificOutput.additionalContext // empty')
[ -n "$CONTEXT" ] || fail "T1: no additionalContext"
echo "$CONTEXT" | grep -q "SUBAGENT-STOP" || fail "T1: missing SUBAGENT-STOP"
echo "$CONTEXT" | grep -qv "Session Housekeeping" || fail "T1: Session Housekeeping present"
```

**Key design choice — mock vs real config:**
Use the mock chester-config-read approach (fabricated binary on PATH) rather than
writing a real config file. This is the established pattern from test-compaction-hooks.sh
and keeps the test hermetic — no dependency on actual Chester project config or
filesystem state. The new-project test (T4) requires a mock that outputs
`CHESTER_CONFIG_PATH=none`.

---

## Peer Question (to purist)

Purist: the T8 extraction uses a two-tag-type awk (XML-style for SUBAGENT-STOP +
EXTREMELY-IMPORTANT, HTML-comment for the 6 heading blocks). My argument for this is
that the XML tags are already unique delimiters — adding HTML comments around them
creates confusing nested markers.

Do you see a correctness gap in the single-awk-pass approach? Specifically: if the
SUBAGENT-STOP block content is captured via XML tag detection AND the heredoc verbatim
compare is a single diff, is there any case where the test passes despite a real drift
(false negative), or fails despite correct content (false positive)?

---

## Post-Peer Update — Purist Answer on T8 Awk

Purist identified two concrete issues. Both resolved in P7 above.

**Issue 1 (off-by-one on closing tag):** Real risk in certain awk forms. My original
form had `/<\/SUBAGENT-STOP>/ { capturing=0; print; next }` which executes
`capturing=0` THEN `print` — so the closing tag IS printed, which is correct. But
the safer canonical form makes this explicit: open-tag rule sets `capturing=1` and
falls through to `capturing { print }`; close-tag rule prints THEN sets `capturing=0`.
Corrected in P7 awk above. Contract: tag lines included in EXPECTED (they are
behavioral signals the model reads).

**Issue 2 (inter-block blank lines):** The awk naturally excludes inter-block blanks
(they fall outside markers where capturing=0). The heredoc must match: no blank lines
between the 8 blocks. Internal blank lines within blocks (e.g. EXTREMELY-IMPORTANT
body) ARE captured and must be verbatim in both. This is now the explicit policy in P7.

**Two-tag-type design confirmed sound by purist.** The structural design (XML tags for
SUBAGENT-STOP + EXTREMELY-IMPORTANT, HTML-comment markers for 6 heading blocks) is
correct. No nested-marker confusion, no off-by-one if awk form is correct.

**All other plan positions (P1, P2, P3, P4, P8) unchanged.**

<!-- created-at: 2026-06-06 -->
<!-- role: innovator -->
<!-- round: 04 -->
