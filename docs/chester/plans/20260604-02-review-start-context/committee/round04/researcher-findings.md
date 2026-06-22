# Researcher Findings — round04 — Build Phase Ground Truth
# Sprint: 20260604-02-review-start-context · Round: 04 · dtd 2026-06-06

All findings DECISIVE from direct file reads. No inference.

---

## 1. session-start — full current content (rewrite target)

`chester-util-config/session-start` — 33 lines total.

**Path resolution:** uses `SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"` then
`CHESTER_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"`. SKILL.md path is
`"${CHESTER_ROOT}/skills/setup-start/SKILL.md"` — relative via CHESTER_ROOT, NOT
`CLAUDE_PLUGIN_ROOT`. The hook command in hooks.json uses
`${CLAUDE_PLUGIN_ROOT}/chester-util-config/session-start` so at runtime
`SCRIPT_DIR` resolves to the plugin root's `chester-util-config/` and
`CHESTER_ROOT` = plugin root. Both paths resolve to the same directory.

**Frontmatter strip:** `sed '1{/^---$/!q}; 1,/^---$/d'` — strips lines from
line 1 to the second `---` delimiter.

**Stdin:** zero stdin read. No `INPUT=$(cat)`, no `jq`, no trigger check.

**Output contract:** emits a JSON object to stdout:
```
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "<escaped string>"
  }
}
```
The `additionalContext` value is the frontmatter-stripped SKILL.md body,
wrapped in `<EXTREMELY_IMPORTANT>` tags with a Chester preamble sentence,
JSON-escaped via the inline `escape_for_json()` function (handles `\`, `"`,
newline, CR, tab).

**escape_for_json logic:** bash string substitutions only — no `jq`/`python`.
The rewrite must preserve or replicate this escaping for the heredoc stub
content.

Full verbatim content (33 lines):
```
#!/usr/bin/env bash
# SessionStart hook for Chester skill set
# Injects setup-start skill content into Claude Code system prompt

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CHESTER_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Read setup-start skill content, strip YAML frontmatter
raw_content=$(cat "${CHESTER_ROOT}/skills/setup-start/SKILL.md" 2>&1 || echo "Error reading setup-start skill")
# Remove frontmatter (everything between first and second ---)
skill_content=$(echo "$raw_content" | sed '1{/^---$/!q}; 1,/^---$/d')

# Escape string for JSON embedding
escape_for_json() {
    local s="$1"
    s="${s//\\/\\\\}"
    s="${s//\"/\\\"}"
    s="${s//$'\n'/\\n}"
    s="${s//$'\r'/\\r}"
    s="${s//$'\t'/\\t}"
    printf '%s' "$s"
}

skill_escaped=$(escape_for_json "$skill_content")
session_context="<EXTREMELY_IMPORTANT>\\nYou have Chester.\\n\\n**Below is the full content of your 'setup-start' skill - your introduction to using skills. For all other skills, use the 'Skill' tool:**\\n\\n---\\n${skill_escaped}\\n\\n\\n</EXTREMELY_IMPORTANT>"

# Claude Code hook output format
printf '{\n  "hookSpecificOutput": {\n    "hookEventName": "SessionStart",\n    "additionalContext": "%s"\n  }\n}\n' "$session_context"

exit 0
```

---

## 2. test-compaction-hooks.sh harness pattern — Test 4 (template for test-session-start.sh)

The reusable pattern is the **Test 4 block** (lines 152–176):

```bash
OUTPUT=$(echo "$STDIN_JSON" | "$CHESTER_ROOT/chester-util-config/hooks/post-compact.sh")
RC=$?

[ "$RC" -eq 0 ] || fail "Test 4: expected exit 0, got $RC"

CONTEXT=$(echo "$OUTPUT" | jq -r '.hookSpecificOutput.additionalContext // empty')
if [ -z "$CONTEXT" ]; then
  fail "Test 4: no additionalContext in output"
else
  echo "$CONTEXT" | grep -q "Phase" || fail "Test 4: missing phase in context"
  echo "$CONTEXT" | grep -q "Round" || fail "Test 4: missing round in context"
  echo "$CONTEXT" | grep -q "stakeholder_impact" || fail "Test 4: missing weakest dimension"
  echo "$CONTEXT" | grep -q "Resume" || fail "Test 4: missing resume directive"
  echo "PASS: Test 4 — PostCompact produces additionalContext"
fi
```

**Pattern for test-session-start.sh:**
1. Set `STDIN_JSON='{"session_id":"...","transcript_path":"...","cwd":"...","hook_event_name":"SessionStart","trigger":"<value>"}'`
2. `OUTPUT=$(echo "$STDIN_JSON" | "$CHESTER_ROOT/chester-util-config/session-start")`
3. `CONTEXT=$(echo "$OUTPUT" | jq -r '.hookSpecificOutput.additionalContext // empty')`
4. `echo "$CONTEXT" | grep -q "<marker>" || fail "..."` — presence assertions
5. `echo "$CONTEXT" | grep -vq "<marker>" || fail "..."` — absence assertions (inverted)

The STDIN_JSON `trigger` field value drives the branch under test.
For new-project vs established-project distinction: the script calls
`chester-config-read` internally, so the test harness must mock
`chester-config-read` in PATH (same pattern as test-compaction-hooks.sh
lines 15–25) to control `CHESTER_CONFIG_PATH` output.

---

## 3. SKILL.md exact line numbers

From direct read (207 lines + final line 208 = `## User Instructions` body):

**8 mandate blocks (marker insertion targets):**

| Block | Start line | End line | Start content |
|-------|-----------|---------|---------------|
| `<SUBAGENT-STOP>` | 7 | 9 | `<SUBAGENT-STOP>` |
| `<EXTREMELY-IMPORTANT>` | 11 | 17 | `<EXTREMELY-IMPORTANT>` |
| `## Instruction Priority` | 19 | 27 | `## Instruction Priority` |
| `## How to Access Skills` | 162 | 164 | `## How to Access Skills` |
| `# Using Skills` + `## The Rule` | 166 | 172 | `# Using Skills` |
| `## Red Flags` | 174 | 191 | `## Red Flags` |
| `## Skill Types` | 193 | 199 | `## Skill Types` |
| `## User Instructions` | 205 | 207 | `## User Instructions` |

**`## Session Housekeeping` block (§5.1 wide-strip target):**
- Heading: line 29 (`## Session Housekeeping`)
- Next heading: line 162 (`## How to Access Skills`)
- Strip range: lines 29–161 inclusive (the heading line through the blank line before `## How to Access Skills`)

**Checks 0–3 region (§5.2 removal target):**
- Checks begin: line 113 (`   If \`CHESTER_CONFIG_PATH\` is not \`none\`...`)
- Checks end: line 160 (blank line before the path-echo block ends; the path-echo format block ends at line 160, `## How to Access Skills` starts at 162 with blank at 161)
- Actually: Checks 0–3 + path-echo = lines 113–160. The eval+wizard = lines 33–111. Both under `## Session Housekeeping` (line 29).

**Note on §5.2 (Option B — remove checks from SKILL.md):** After checks removal, `## Session Housekeeping` (line 29) contains:
- Lines 31–32: `At the start of every session:` + blank
- Lines 33–111: item 1 with eval + first-run wizard
- Then immediately `## How to Access Skills`

After removal: `## Session Housekeeping` = ~83 lines (down from ~133). The wide-strip sed range still works: `## Session Housekeeping` to `## How to Access Skills` — headings unchanged.

---

## 4. Hook output contract — exact shape

`session-start` must emit to stdout:
```json
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "<JSON-escaped string>"
  }
}
```

The `printf` call (line 30 of current session-start) is the emitter:
```bash
printf '{\n  "hookSpecificOutput": {\n    "hookEventName": "SessionStart",\n    "additionalContext": "%s"\n  }\n}\n' "$session_context"
```

The `additionalContext` string value is JSON-escaped (all `\`, `"`, newlines,
CR, tabs replaced). The wrapping `<EXTREMELY_IMPORTANT>` envelope and preamble
are embedded inside the string. The rewrite must produce this same shape — same
`printf` call or equivalent.

Exit code: always `exit 0`. On any error, emit a valid full payload anyway.

---

## 5. Hook registration and environment

`hooks/hooks.json` (verbatim, lines 1–36):
```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|clear|compact",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/chester-util-config/session-start",
            "async": false
          }
        ]
      }
    ],
    ...
  }
}
```

**`CLAUDE_PLUGIN_ROOT`** — set by the Claude Code plugin system; available to
all hook commands as an env var. The session-start script uses it implicitly
via `SCRIPT_DIR` resolution (dirname of `$0` = `CLAUDE_PLUGIN_ROOT/chester-util-config`).

**`jq` path:** `/usr/bin/jq`. Available without a PATH guard (confirmed from
pre-compact.sh which uses `jq` on line 41 with no `command -v jq` guard;
session-start rewrite follows same convention per spec §2).

**`chester-config-read`:** available via PATH (added by plugin system from
`bin/`). The pre-compact.sh uses a belt-and-suspenders:
```bash
if [ -n "${CLAUDE_PLUGIN_ROOT:-}" ] && [ -x "$CLAUDE_PLUGIN_ROOT/bin/chester-config-read" ]; then
  CONFIG_CMD="$CLAUDE_PLUGIN_ROOT/bin/chester-config-read"
elif command -v chester-config-read >/dev/null 2>&1; then
  CONFIG_CMD="chester-config-read"
else
  exit 0
fi
```
session-start rewrite may adopt the same guard or use simpler `eval "$(chester-config-read)"` —
spec §3.2 shows the latter; the plan author must decide whether to add the
CLAUDE_PLUGIN_ROOT guard (pre-compact.sh has it, session-start today does not).

---

## 6. `sed -i "\|^$CHESTER_PLANS_DIR|d"` — location in wizard vs. checks

SKILL.md line 81:
```bash
sed -i "\|^$CHESTER_PLANS_DIR|d" .gitignore
```
This is inside the **first-run wizard** (`if CHESTER_CONFIG_PATH is none` branch),
specifically wizard step **f** (lines 77–85: "Ensure the plans directory is NOT
in .gitignore"). Line 81 is at SKILL.md:81.

Also appears at line 143 inside **Check 3** (the returning-session verification check):
```bash
sed -i "\|^$CHESTER_PLANS_DIR|d" .gitignore
```
Under Option B, Checks 0–3 are **removed from SKILL.md** (§5.2). The Check 3
instance (line 143) goes away. The wizard instance (line 81) stays — it is
inside the first-run wizard which is emitted verbatim on new projects.
No prose-to-bash reconstruction risk: neither instance is being collapsed to
prose under Option B.

---

## 7. Existing tests that would BREAK from these changes

**BREAKS: `tests/test-start-cleanup.sh`**

Lines 6–10:
```bash
# Verify setup-start has session housekeeping
if ! grep -q "Session Housekeeping" "$SKILL"; then
  echo "FAIL: setup-start missing Session Housekeeping"
  exit 1
fi
```

After Option B: `## Session Housekeeping` heading and the wizard body remain
in SKILL.md (only Checks 0–3 are removed). The `grep -q "Session Housekeeping"`
assertion PASSES — the heading and wizard text survive.

**HOWEVER:** the assertion tests for presence of the string. After removing
Checks 0–3, the heading is still there. This test will NOT break.

**Revised conclusion — no existing test breaks:**
- `test-start-cleanup.sh` grep is for `"Session Housekeeping"` — heading stays, PASSES.
- `test-compaction-hooks.sh` tests PreCompact/PostCompact hooks only — zero
  dependency on session-start output content. NOT affected.
- `test-partner-role-overlay-section.sh` references `skill-index.md` only —
  NOT affected.

**New break risk to verify:** `test-start-cleanup.sh` also checks for absence
of `design-figure-out` and `design-specify` (lines 13–18). Neither is being
touched. PASSES.

**No existing test breaks.** The new `test-session-start.sh` is entirely
additive.

---

## Summary for plan-builders

| Fact | Value |
|------|-------|
| session-start SKILL.md path | `"${CHESTER_ROOT}/skills/setup-start/SKILL.md"` (CHESTER_ROOT = dirname of script / ..) |
| Frontmatter strip sed | `sed '1{/^---$/!q}; 1,/^---$/d'` |
| Output shape | `{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"<escaped>"}}` |
| Stdin reads today | zero |
| jq path | `/usr/bin/jq`, no guard needed |
| `## Session Housekeeping` heading | line 29 |
| `## How to Access Skills` heading | line 162 |
| Checks 0–3 region | lines 113–160 |
| wizard `sed -i` idiom | line 81 (wizard), line 143 (Check 3, to be deleted) |
| Test harness template | test-compaction-hooks.sh Test 4 (lines 152–176) |
| Mock chester-config-read pattern | test-compaction-hooks.sh lines 15–25 |
| Existing tests broken | zero |

<!-- created-at: 2026-06-06 -->
