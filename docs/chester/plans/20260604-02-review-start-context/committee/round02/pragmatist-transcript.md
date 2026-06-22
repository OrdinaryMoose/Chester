# Pragmatist Transcript — Round 02
# Sprint: 20260604-02-review-start-context
# Role: Pragmatist
# Date: 2026-06-05
# Task: Develop concrete spec answers for A-H (trigger-split design).
# Priority lens: D + G + total LOC. Simplest sufficient. Least code.

## Ground-Truth Verification (pre-position)

Read directly before writing any spec claim:

**Stdin schema (from test-compaction-hooks.sh line 68):**
```json
{
  "session_id": "test-session-001",
  "transcript_path": "/tmp/transcript.jsonl",
  "cwd": "/tmp",
  "hook_event_name": "PreCompact",
  "trigger": "auto"
}
```
The field is `hook_event_name`. The `trigger` field is a separate value ("auto") — NOT
the event discriminator. jq path: `.hook_event_name`.

**Content-assertion test pattern (from test-compaction-hooks.sh Tests 4 + 8):**
```bash
OUTPUT=$(echo "$STDIN_JSON" | "$CHESTER_ROOT/chester-util-config/session-start")
CONTEXT=$(echo "$OUTPUT" | jq -r '.hookSpecificOutput.additionalContext // empty')
echo "$CONTEXT" | grep -q "SUBAGENT-STOP" || fail "missing mandate"
```
This is the established pattern. Content-assertion tests already exist in the suite.
A new session-start test is an EXTENSION of the existing pattern, not a new pattern.

**session-start current structure (32 lines):**
- Line 11: `raw_content=$(cat "${CHESTER_ROOT}/skills/setup-start/SKILL.md" ...)`
- Line 13: strip frontmatter via sed
- Lines 15–24: `escape_for_json` function
- Line 26: `skill_escaped=$(escape_for_json "$skill_content")`
- Line 27: assemble `session_context` string
- Line 30: printf JSON output

**Token measures (confirmed unchanged from round01):**
- Full body: ~2,014 tokens
- Core compact floor: ~417 tokens (SUBAGENT-STOP + EXTREMELY-IMPORTANT + Instruction Priority + The Rule + Skill Types)
- With Red Flags: ~700 tokens
- Deferrable on compact: ~1,557 tokens
- Saving per compaction: ~1,300–1,580 tokens

---

## Spec Positions A–H

### A. Payload assembly — WHERE stub lives

**Recommendation: inline heredoc in session-start (option ii).**

Rationale:
- A separate stub file (option i) requires a second file to maintain and a second read
  path in session-start. Two files that must stay in sync is the drift risk we're trying
  to minimize.
- Split SKILL.md (option iii) changes the structure of the skill file. session-start
  already strips frontmatter and reads the full body. Splitting SKILL.md means adding a
  section-detection or frontmatter-block mechanism to session-start — more code, not less.
- Inline heredoc: the compact stub content is ~30 lines / ~700 tokens. It fits cleanly
  as a bash heredoc variable in session-start, right next to the full-payload assembly.
  The two payloads are in the same file, visible side-by-side — the cheapest drift-check
  is reading one file.

Selection mechanism: read `hook_event_name` from stdin, branch on value.

```bash
INPUT=$(cat)
TRIGGER=$(echo "$INPUT" | jq -r '.hook_event_name // "SessionStart"')
```

If `TRIGGER` == `"PreCompact"` (i.e., the compaction event fired the SessionStart hook),
emit the compact stub. Otherwise emit the full payload. See D for full shape.

NOTE on field value: the hooks.json matcher is `startup|clear|compact`. The
`hook_event_name` field in the stdin JSON carries the raw event name as sent by the
Claude Code runtime — `SessionStart` for all three trigger variants, OR the trigger
value string itself. The compaction-hooks test uses `hook_event_name: "PreCompact"` for
the PreCompact hook, but for SessionStart the field will be `"SessionStart"` regardless
of whether it fired on startup, clear, or compact. Therefore the correct discriminator
is NOT `hook_event_name` alone — it is the `trigger` field, which carries `"startup"`,
`"clear"`, or `"compact"`.

CORRECTION (based on test fixture at line 68 and line 259):
```
"hook_event_name": "PreCompact", "trigger": "auto"   ← PreCompact hook
"hook_event_name": "PostCompact", "trigger": "auto"  ← PostCompact hook
```
For SessionStart, `hook_event_name` will be `"SessionStart"` in all cases. The
discriminator that distinguishes startup vs compact within SessionStart is the `trigger`
field. jq path: `.trigger`.

**Revised selection mechanism:**
```bash
INPUT=$(cat)
TRIGGER=$(echo "$INPUT" | jq -r '.trigger // ""')
```
Branch: if `TRIGGER` == `"compact"`, emit stub; else emit full payload.
Fallback `// ""` (empty string, per researcher-confirmed pre-compact.sh pattern) is
safe — empty string does not match "compact", so absent/unknown trigger falls through
to the full payload. Cleaner than defaulting to "startup" since it doesn't paper over
a missing field with an assumed value. Safe direction: over-inject rather than
under-inject mandate.

### B. Stub content + order

Compact stub — verbatim blocks, in this order:

1. SUBAGENT-STOP block (~29 tokens) — verbatim copy from SKILL.md
2. EXTREMELY-IMPORTANT block (~84 tokens) — verbatim copy
3. Instruction Priority section (~118 tokens) — verbatim copy
4. The Rule section (~166 tokens) — verbatim copy
5. Red Flags table (~260 tokens) — verbatim copy (unanimous-keep from round01)
6. Skill Types section (~49 tokens) — verbatim copy (REVISED — see peer exchange below)
7. One-line orientation: `# Housekeeping already ran this session. Config and directories are live.`
   (~10 tokens) — signals that the session-start ran; no action needed on startup checks

Do NOT include: first-run wizard, verification checks 0–3, path-echo, Choosing Between
Skills, User Instructions section. These are either irrelevant post-compaction (wizard,
checks) or lookup/pointer content that adds friction but not behavioral failure if absent.

Stub total: ~716 tokens. Saving vs full payload: ~1,298 tokens per compaction.

**REVISED from initial position:** initial position excluded Skill Types. Purist's
peer response accepted — see "Peer exchanges" section below.

**Verbatim vs maintained:** blocks 1–6 are verbatim copies of the corresponding sections
in SKILL.md. They do not reference the SKILL.md file at runtime — the stub is
self-contained in the heredoc. See F for drift control.

**Verbatim vs maintained:** blocks 1–5 are verbatim copies of the corresponding sections
in SKILL.md. They do not reference the SKILL.md file at runtime — the stub is
self-contained in the heredoc. See F for drift control.

### C. First-run gating

Gate location: in session-start, AFTER the trigger branch. The first-run wizard executes
only when: (a) trigger != compact (i.e., this is startup or clear) AND (b) config read
returns `CHESTER_CONFIG_PATH == none`.

```bash
# First-run check (startup/clear only — already excluded from compact path)
eval "$(chester-config-read 2>/dev/null)" || true
if [ "${CHESTER_CONFIG_PATH:-none}" = "none" ]; then
  # emit first-run payload (includes wizard)
  ...
else
  # emit returning-session full payload (strips first-run wizard)
  ...
fi
```

This does NOT require restructuring SKILL.md. session-start reads the raw SKILL.md
content and currently emits it wholesale. Post-change, session-start makes two decisions:
(1) compact vs full, (2) within full: new-project vs returning-session.

The returning-session full payload is SKILL.md minus lines 33–111 (the first-run wizard
block). session-start strips the frontmatter already (line 13 via sed). Add a second sed
pass to strip lines 33–111 when config != none.

Saving: ~696 tokens off every startup/clear on established projects. Since Chester is
almost always on an established project, this is effectively ~696 tokens off every
non-compaction event.

Whether this spec is IN SCOPE for this round: yes. The designer explicitly asked for
"minimize INITIAL context AND COMPACTED context." Both cuts belong in the same spec.

### D. Trigger detection — concrete bash shape

Full ~8-line shape for session-start branching:

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CHESTER_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

INPUT=$(cat)
TRIGGER=$(echo "$INPUT" | jq -r '.trigger // "startup"')

# ── Compact path: mandate-only stub ─────────────────────────────
if [ "$TRIGGER" = "compact" ]; then
  stub_content=$(cat <<'STUB'
<SUBAGENT-STOP>
If you were dispatched as a subagent to execute a specific task, skip this skill.
</SUBAGENT-STOP>

<EXTREMELY-IMPORTANT>
[... verbatim from SKILL.md ...]
</EXTREMELY-IMPORTANT>

## Instruction Priority
[... verbatim from SKILL.md ...]

## The Rule
[... verbatim from SKILL.md ...]

## Red Flags
[... verbatim table from SKILL.md ...]

<!-- Housekeeping already ran this session. Config and directories are live. -->
STUB
)
  # escape + emit stub
  ...
  exit 0
fi

# ── Full path: startup or clear ──────────────────────────────────
eval "$(chester-config-read 2>/dev/null)" || true
raw_content=$(cat "${CHESTER_ROOT}/skills/setup-start/SKILL.md" 2>&1 || echo "Error reading setup-start skill")
skill_content=$(echo "$raw_content" | sed '1{/^---$/!q}; 1,/^---$/d')

# Gate first-run wizard on established projects
if [ "${CHESTER_CONFIG_PATH:-none}" != "none" ]; then
  # Strip first-run wizard block (lines containing the wizard prose)
  skill_content=$(echo "$skill_content" | sed '/^1\. \*\*First-run project/,/^   If .CHESTER_CONFIG_PATH. is not .none./d')
fi

# ... escape_for_json + printf output (unchanged from current script)
```

Total new LOC: ~12–15 (INPUT/TRIGGER read, compact branch, heredoc stub, exit).
Refactor of existing path: ~3–5 lines (config gate + sed strip).
Net change: ~20 LOC added/modified in session-start.

**Fallback safety:** `jq -r '.trigger // "startup"'` defaults to "startup" if field
absent or jq fails. The `|| true` on the jq call (implicit via the default) means
session-start never exits non-zero from trigger detection alone. If jq is not installed,
the `// "startup"` default still fires via bash string handling — but jq IS a hard
dependency already (pre-compact.sh line 41 uses it). Safe to require jq.

### E. Startup trim (collapse verification bash to 1 line, keep `sed` verbatim)

**Recommendation: YES, in scope for this spec.**

The designer asked for both startup and compaction savings. The startup trim is:
- Collapse the four verification-check bash blocks (lines 113–161) from inline code
  fences to prose descriptions, EXCEPT keep the `sed -i "\|^$CHESTER_PLANS_DIR|d"`
  snippet verbatim (silent failure if reconstructed wrong: plans dir stays gitignored,
  caught only at sprint finish when archive artifacts land untracked).
- This change is in SKILL.md, not session-start. It is a content edit, not a mechanism
  change.
- Saving: ~300 tokens off every startup/clear (verification bash prose is ~492 tokens;
  prose descriptions ≈ ~4 lines × ~15 tokens = ~60 tokens; net ~430 tokens saved minus
  the kept `sed` snippet ≈ ~300 tokens).

This is a separate SKILL.md edit from the session-start mechanism change. Both belong
in the same implementation ticket. Separate commits, same branch.

### F. Drift control

**Recommendation: comment + verbatim-copy. No sync-checker.**

The stub is a heredoc in session-start. Add a comment above it:
```bash
# STUB CONTENT: verbatim copy of the mandate blocks from skills/setup-start/SKILL.md.
# When updating SKILL.md mandate sections (SUBAGENT-STOP, EXTREMELY-IMPORTANT,
# Instruction Priority, The Rule, Red Flags), update this stub to match.
# Stub last synced: setup-start v0002.
```

The "last synced" version tag gives a mechanical check: if setup-start version bumps and
the stub version tag in session-start doesn't, a reviewer sees the gap. This is ~4 lines
of comment, not a test or tooling.

**Why not a sync-checker test:** the stub content is behavioral mandate — its value is
whether the MODEL follows it, not whether it literally matches character-for-character.
Minor diffs (whitespace, phrasing) between the stub and SKILL.md are not failures. A
character-exact diff test would flag false positives and need updating on every whitespace
change. The comment is cheaper and sufficient.

**Two-place sync still applies for the skill description:** if the mandate changes
substantively (new rule added, Red Flags row added), the stub must get that change. The
comment + version tag makes this visible without automation.

### G. Test plan — minimal assertions that actually prove it

The existing test pattern (test-compaction-hooks.sh Test 4) is:
```bash
OUTPUT=$(echo "$STDIN_JSON" | "$CHESTER_ROOT/path/to/script")
CONTEXT=$(echo "$OUTPUT" | jq -r '.hookSpecificOutput.additionalContext // empty')
echo "$CONTEXT" | grep -q "expected text" || fail "missing expected text"
```

New test file: `tests/test-session-start.sh`. Minimal assertions:

**Test 1: Startup trigger — full payload emitted**
```bash
STDIN='{"hook_event_name":"SessionStart","trigger":"startup","session_id":"t1","cwd":"/tmp"}'
OUTPUT=$(echo "$STDIN" | CLAUDE_PLUGIN_ROOT="$CHESTER_ROOT" "$CHESTER_ROOT/chester-util-config/session-start")
CONTEXT=$(echo "$OUTPUT" | jq -r '.hookSpecificOutput.additionalContext // empty')
[ -n "$CONTEXT" ] || fail "Test 1: no additionalContext on startup"
echo "$CONTEXT" | grep -q "Session Housekeeping" || fail "Test 1: full payload missing housekeeping"
echo "$CONTEXT" | grep -q "SUBAGENT-STOP" || fail "Test 1: missing mandate on startup"
```

**Test 2: Compact trigger — stub emitted, housekeeping absent**
```bash
STDIN='{"hook_event_name":"SessionStart","trigger":"compact","session_id":"t2","cwd":"/tmp"}'
OUTPUT=$(echo "$STDIN" | CLAUDE_PLUGIN_ROOT="$CHESTER_ROOT" "$CHESTER_ROOT/chester-util-config/session-start")
CONTEXT=$(echo "$OUTPUT" | jq -r '.hookSpecificOutput.additionalContext // empty')
[ -n "$CONTEXT" ] || fail "Test 2: no additionalContext on compact"
echo "$CONTEXT" | grep -q "SUBAGENT-STOP" || fail "Test 2: mandate missing from compact stub"
echo "$CONTEXT" | grep -q "Instruction Priority" || fail "Test 2: Instruction Priority missing from stub"
echo "$CONTEXT" | grep -q "Red Flags" || fail "Test 2: Red Flags missing from stub"
echo "$CONTEXT" | grep -qv "Session Housekeeping" || fail "Test 2: housekeeping present in compact stub (should be absent)"
echo "$CONTEXT" | grep -qv "First-run" || fail "Test 2: first-run wizard present in compact stub (should be absent)"
```

**Test 3: Compact trigger — no first-run wizard, no verification checks**
```bash
# Same STDIN as Test 2
echo "$CONTEXT" | grep -qv "mkdir -p" || fail "Test 3: bash setup commands present in compact stub"
echo "$CONTEXT" | grep -qv "chester-config-read" || fail "Test 3: config read present in compact stub"
```

**Test 4: Unknown/absent trigger — full payload (safe fallback)**
```bash
STDIN='{"hook_event_name":"SessionStart","session_id":"t4","cwd":"/tmp"}'
OUTPUT=$(echo "$STDIN" | CLAUDE_PLUGIN_ROOT="$CHESTER_ROOT" "$CHESTER_ROOT/chester-util-config/session-start")
CONTEXT=$(echo "$OUTPUT" | jq -r '.hookSpecificOutput.additionalContext // empty')
echo "$CONTEXT" | grep -q "Session Housekeeping" || fail "Test 4: missing full payload on absent trigger"
```

**Test 5: Returning-session startup — no first-run wizard (config gate)**
```bash
# Requires mock chester-config-read returning a non-none CHESTER_CONFIG_PATH
# (same mock pattern as test-compaction-hooks.sh lines 17-25)
STDIN='{"hook_event_name":"SessionStart","trigger":"startup","session_id":"t5","cwd":"/tmp"}'
OUTPUT=$(echo "$STDIN" | CLAUDE_PLUGIN_ROOT="$MOCK_BIN_ROOT" "$CHESTER_ROOT/chester-util-config/session-start")
CONTEXT=$(echo "$OUTPUT" | jq -r '.hookSpecificOutput.additionalContext // empty')
echo "$CONTEXT" | grep -qv "new project" || fail "Test 5: first-run wizard present for returning session"
echo "$CONTEXT" | grep -q "Session Housekeeping" || fail "Test 5: housekeeping missing on returning-session startup"
```

**Total: 5 tests, ~50 lines.** All use the established pattern. No new test infrastructure.

The grep-qv (inverted match) assertions for Tests 2-3 are the critical ones: they prove
the compact payload does NOT carry the expensive blocks. Presence assertions alone are
insufficient — you need to assert absence of the housekeeping content.

### H. Version bump + two-place sync

- Bump setup-start version: v0002 → v0003 (the startup-trim SKILL.md edit is a behavior
  change; the trigger-split is a delivery-mechanism change that doesn't touch SKILL.md
  content, but the startup-trim does).
- Two-place sync: update the stub comment's "last synced" version tag to v0003.
- No change to the `description` frontmatter field (trigger-split doesn't alter what the
  skill does; it alters how the hook delivers it). Two-place sync for `description` is not
  triggered.
- If startup trim changes any text in the mandate sections, update the stub heredoc to
  match. The stub "last synced" tag makes this visible.

---

## Summary (total LOC + saving numbers)

**session-start changes:**
- Add `INPUT=$(cat)` + `TRIGGER=$(...)` + compact branch + heredoc stub + exit: ~35 LOC added
- Add config gate + sed strip for first-run wizard: ~5 LOC added
- Net: ~40 LOC total change to the 32-line script (script roughly doubles in size)

**SKILL.md changes (startup trim, E):**
- Collapse verification bash to prose: ~4 blocks → ~4 description lines
- Keep `sed -i "\|^$CHESTER_PLANS_DIR|d"` verbatim
- Net: ~30 lines removed from SKILL.md (207 → ~177 lines)

**test-session-start.sh:** ~50–60 lines (5 tests)

**Saving numbers (confirmed, revised after peer exchange on B):**
- Per-compaction: ~1,298 tokens (full 2,014 → stub ~716 with Skill Types included)
- Per-startup on established project: ~700 tokens (first-run gate) + ~300 tokens (bash
  trim) = ~1,000 tokens off every non-compaction event
- Cumulative over a 10-compaction session: ~12,980 tokens returned to user work
- Prior range ~1,300–1,580 was pre-Skill-Types-revision; ~1,298 is the settled number

---

## Peer exchanges (round02)

### Pragmatist → Purist

Asked: is Skill Types (~49 tokens) load-bearing for the compact stub, or recoverable
via skill invocation and safely in the deferrable bucket?

**Purist answer (accepted):** Skill Types is load-bearing. The failure mode: a
post-compaction model invokes a rigid skill correctly (mandate survived), reads SKILL.md,
sees the checklist — but without the meta-rule "rigid = follow exactly, don't adapt away
discipline," it adapts a step it judges unnecessary. The deviation is silent and fires
inside skill execution, after invocation, before any re-read could intervene. The Red
Flags table does not catch this — it covers invocation skipping, not post-invocation
adaptation. At ~45 tokens the inclusion cost is negligible relative to the failure mode.

Purist's underlying category principle: the compact floor is not just "what cannot be
found elsewhere" — it is "what, if absent, produces a failure mode that fires before any
recovery mechanism can intervene." Skill Types meets that bar. Choosing Between Skills
does not (lookup/navigation pointer; friction without failure if absent).

**Position revised:** Skill Types added to stub (block 6). Stub total revised to ~716
tokens. Saving revised to ~1,298 tokens per compaction.

### Researcher findings confirmation (D + G)

Researcher confirmed all three ground-truth questions independently:

1. Trigger field: `.trigger` (values "startup" | "clear" | "compact"). `hook_event_name`
   is always "SessionStart" for all three SessionStart events — useless for branching.
   Confirmed. Exact pattern from pre-compact.sh: `INPUT=$(cat)` then
   `jq -r '.trigger // ""'`. Fallback `// ""` (empty string) confirmed — cleaner than
   my initial `// "startup"` since it doesn't assume a value for a missing field.
   Transcript updated to use `// ""`.

2. Test coverage: ZERO existing tests touch session-start, hooks.json, or SessionStart.
   `test-session-start.sh` will be the first coverage for the hook output. This raises
   the importance of G — the absence assertions (`grep -qv "First-run project
   configuration"`, `grep -qv "Check 0:"`) are the only thing that will catch a broken
   split after implementation.

3. Content-assertion pattern: established in test-compaction-hooks.sh Tests 4 + 8
   (lines 166–174, 269–281). Pattern confirmed: pipe STDIN_JSON → capture output →
   `jq -r '.hookSpecificOutput.additionalContext // empty'` → `grep -q`. New
   test-session-start.sh follows the exact same shape.

No position changes from researcher findings. D fallback expression updated (`// ""` vs
`// "startup"` — equivalent behavior, `// ""` is more idiomatically correct).

---

## Confidence

High on D (trigger detection confirmed from test fixture), G (test plan extends
established pattern), saving arithmetic, and now B (stub content settled after purist
exchange). Medium on C (the sed-strip for first-run gating is functionally correct but
the exact sed address pattern needs confirmation against SKILL.md content — use
content-anchors, not line numbers, e.g., from `^1\. \*\*First-run` to
`^   If.*CHESTER_CONFIG_PATH.*is not.*none`). Spec-level note for the implementer, not
a reason to revise the approach.

---
<!-- created-at: 2026-06-05 -->
<!-- role: pragmatist -->
<!-- round: 02 -->
