# Researcher Findings — Round 02 (Develop phase: spec ground-truth)
# Sprint: 20260604-02-review-start-context
# Date: 2026-06-05

## Scope

Nail down exact ground-truth the trigger-split specification needs. Concrete facts, no
opinion. Seven areas: stub block boundaries, stdin JSON shape, jq availability, current
session-start content, hooks.json verbatim, first-run wizard gate mechanics, version/sync
surfaces.

---

## 1. Stub Block Boundaries — Verbatim Text + Line Ranges

**DECISIVE.** All measurements from SKILL.md at HEAD 1265069 (post-range). Frontmatter is
lines 1–5; injected body starts at line 6 (blank) or effectively line 7 (first content).

### SUBAGENT-STOP block
Lines 7–9:
```
<SUBAGENT-STOP>
If you were dispatched as a subagent to execute a specific task, skip this skill.
</SUBAGENT-STOP>
```
Token measure (prior analysis): ~29 tokens.

### EXTREMELY-IMPORTANT block
Lines 11–17:
```
<EXTREMELY-IMPORTANT>
If you think there is even a 1% chance a skill might apply to what you are doing, you ABSOLUTELY MUST invoke the skill.

IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.

This is not negotiable. This is not optional. You cannot rationalize your way out of this.
</EXTREMELY-IMPORTANT>
```
Token measure: ~84 tokens.

### Instruction Priority section
Lines 19–27:
```
## Instruction Priority

Chester skills override default system prompt behavior, but **user instructions always take precedence**:

1. **User's explicit instructions** (CLAUDE.md, direct requests) — highest priority
2. **Chester skills** — override default system behavior where they conflict
3. **Default system prompt** — lowest priority

If CLAUDE.md says "don't use TDD" and a skill says "always use TDD," follow the user's instructions. The user is in control.
```
Token measure: ~118 tokens.

### Session Housekeeping header + first-run wizard block
Lines 29–111 (first-run wizard gated by CHESTER_CONFIG_PATH==none):
- Line 29: `## Session Housekeeping`
- Line 33: `1. **First-run project configuration:**` (wizard starts)
- Line 37: `If \`CHESTER_CONFIG_PATH\` is \`none\`, this is a new project.`
- Line 111: end of wizard announcement block (blank line before returning-session section)
Token measure (wizard 33–111): ~696 tokens.

### Verification checks 0–3 block (returning session)
Lines 113–160:
- Line 113: `If \`CHESTER_CONFIG_PATH\` is not \`none\`, this is a returning session.`
- Lines 116–148: Check 0, Check 1, Check 2, Check 3 with inline bash
- Lines 150–160: mandatory path-echo block
Token measure: ~492 tokens.

### How to Access Skills + mandate sections
Lines 162–208 (end of file):

**How to Access Skills** (lines 162–164, ~15 tokens — preamble only):
```
## How to Access Skills

**In Claude Code:** Use the `Skill` tool.
```

**The Rule** (lines 168–172):
```
## The Rule

**Invoke relevant or requested skills BEFORE any response or action.** Even a 1% chance a skill might apply means that you should invoke the skill to check. If an invoked skill turns out to be wrong for the situation, you don't need to use it.

At every user message: ask "might any skill apply?" — if yes (even 1%), invoke the Skill tool before replying. If the skill has a checklist, create one TodoWrite item per checklist step, then follow the skill exactly. Clarifying questions count as responses — check for skills before asking them. If you're about to enter plan mode and haven't brainstormed yet, invoke the brainstorming skill first.
```
Token measure: ~166 tokens.

**Red Flags table** (lines 174–191):
```
## Red Flags

These thoughts mean STOP — you're rationalizing:

| Thought | Reality |
|---------|---------|
| "This is just a simple question" | Questions are tasks. Check for skills. |
| "I need more context first" | Skill check comes BEFORE clarifying questions. |
| "Let me explore the codebase first" | Skills tell you HOW to explore. Check first. |
| "I can check git/files quickly" | Files lack conversation context. Check for skills. |
| "Let me gather information first" | Skills tell you HOW to gather information. |
| "This doesn't need a formal skill" | If a skill exists, use it. |
| "I remember this skill" | Skills evolve. Read current version. |
| "This doesn't count as a task" | Action = task. Check for skills. |
| "The skill is overkill" | Simple things become complex. Use it. |
| "I'll just do this one thing first" | Check BEFORE doing anything. |
| "This feels productive" | Undisciplined action wastes time. Skills prevent this. |
| "I know what that means" | Knowing the concept ≠ using the skill. Invoke it. |
```
Token measure: ~260 tokens.

**Skill Types** (lines 193–199):
```
## Skill Types

**Rigid** (`execute-test`, `execute-prove`): Follow exactly. Don't adapt away discipline.

**Flexible** (patterns): Adapt principles to context.

The skill itself tells you which.
```
Token measure: ~49 tokens.

**Choosing Between Skills** (lines 201–203):
```
## Choosing Between Skills

When multiple skills could apply, or when you need to look up what a named skill does, read [`references/skill-index.md`](references/skill-index.md). It contains the priority order (gate > review > behavioral > utility), dispatch patterns for common prompts, and the full skill catalog grouped by role.
```
Token measure: ~109 tokens (includes User Instructions at lines 205–207).

**User Instructions** (lines 205–207):
```
## User Instructions

Instructions say WHAT, not HOW. "Add X" or "Fix Y" doesn't mean skip workflows.
```
Included in the ~109 above.

### Compaction stub content (what MUST survive)
Per adjudicated design — lines in SKILL.md that must be included in the compact stub:
- SUBAGENT-STOP (lines 7–9): ~29 tokens
- EXTREMELY-IMPORTANT (lines 11–17): ~84 tokens
- Instruction Priority (lines 19–27): ~118 tokens
- The Rule (lines 168–172): ~166 tokens
- Red Flags table (lines 174–191): ~260 tokens
- Skill Types (lines 193–199): ~49 tokens
- **Core floor total: ~706 tokens** (SUBAGENT-STOP + EXTREMELY-IMPORTANT + Instruction Priority + The Rule + Red Flags + Skill Types)

Note: prior analysis quoted ~417 as "core floor" (without Red Flags) and ~700 "with Red Flags."
The adjudicated design keeps Red Flags in the stub (unanimous), so stub = ~700 tokens.

### What is DROPPED from the compact stub
- `## Session Housekeeping` header + first-run wizard (lines 29–111): ~696 tokens + header
- Verification checks 0–3 + path-echo (lines 113–160): ~492 tokens
- `## How to Access Skills` preamble (lines 162–164): ~15 tokens
- `## Choosing Between Skills` (lines 201–203): ~55 tokens (part of the ~109)
- `## User Instructions` (lines 205–207): ~54 tokens (part of the ~109)

---

## 2. SessionStart Stdin JSON Shape

**DECISIVE.** From `tests/test-compaction-hooks.sh` line 68 (the real test fixture):

```json
{
  "session_id": "test-session-001",
  "transcript_path": "/tmp/transcript.jsonl",
  "cwd": "/tmp",
  "hook_event_name": "PreCompact",
  "trigger": "auto"
}
```

Two relevant fields for branching:
- `hook_event_name` — the hook event type. For SessionStart hook: always `"SessionStart"`.
  For PreCompact: `"PreCompact"`. For PostCompact: `"PostCompact"`.
- `trigger` — WHY the event fired. This is the branching field.
  - For SessionStart on true startup: `"startup"`
  - For SessionStart on /clear: `"clear"`
  - For SessionStart on compaction: `"compact"`
  - For PreCompact/PostCompact: `"auto"`

**DECISIVE — branching field for the spec is `trigger`, NOT `hook_event_name`.**
`hook_event_name` is always `"SessionStart"` for all three SessionStart cases — it cannot
distinguish startup from compact. `trigger` carries the actual event sub-type.

This matches the prior committee analysis wording: Pragmatist said "branch on trigger,"
Purist said "reads stdin trigger field." Both correct.

The `INPUT=$(cat)` + jq pattern to copy from pre-compact.sh (exact lines):

```bash
INPUT=$(cat)
# ...
TRIGGER=$(echo "$INPUT" | jq -r '.trigger // ""')
```

Full branch skeleton for session-start:
```bash
INPUT=$(cat)
TRIGGER=$(echo "$INPUT" | jq -r '.trigger // ""')
if [ "$TRIGGER" = "compact" ]; then
    # emit mandate-only stub
else
    # emit full body (startup, clear, or unrecognized)
fi
```

---

## 3. jq Availability

**DECISIVE — confirmed available.**

`which jq` returns `/usr/bin/jq`. Pre-compact.sh and post-compact.sh both use it
extensively. The Chester hook execution environment has jq. Safe to use in session-start
without a fallback.

If belt-and-suspenders desired: pre-compact.sh pattern is to call
`command -v chester-config-read` as availability check — could do same for jq. But given
it's already used by two other hooks with no fallback, jq availability is a safe assumption.

---

## 4. Current session-start Content (Verbatim)

**DECISIVE.** Full current script at `chester-util-config/session-start`:

```bash
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

Key observations for the spec:
- `set -euo pipefail` — strict mode. Any new code must handle errors or the hook fails.
- `escape_for_json()` function already present — reuse for compact stub string.
- The wrapper string is hardcoded on line 27: `"<EXTREMELY_IMPORTANT>\\nYou have Chester..."`
  The compact stub needs its own wrapper or a simplified version of this.
- Zero stdin read. No `INPUT=$(cat)`.

---

## 5. hooks/hooks.json SessionStart Entry (Verbatim)

**DECISIVE.** Current full SessionStart entry:

```json
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
]
```

One entry only. One command. `async: false`.

**For the one-hook-with-branching approach (adjudicated): hooks.json does NOT change.**
The single entry fires the single `session-start` script on all three events. The script
reads `trigger` from stdin and branches. hooks.json is untouched.

If the two-hook approach were used (Innovator's rejected option): hooks.json would need
a second entry with `"matcher": "compact"` and a different command. Not pursued.

---

## 6. First-Run Wizard Gate Mechanics

**DECISIVE.**

**Current gate: model-executed prose, NOT script-level.**

The wizard block (SKILL.md lines 33–111) is injected as plain text instructions. The model
reads: "If `CHESTER_CONFIG_PATH` is `none`, this is a new project. Run the first-run
setup." The model then executes `eval "$(chester-config-read)"` as a bash command in its
tool calls, reads the output to get `CHESTER_CONFIG_PATH`, and branches.

The script (`session-start`) currently has no awareness of config state. It reads
SKILL.md, strips frontmatter, emits body. It does not check config.

**For script-level gating (the adjudicated design):** session-start would need to:
1. `eval "$(${CHESTER_ROOT}/bin/chester-config-read)"` — or use the same
   `CLAUDE_PLUGIN_ROOT`-relative path that pre-compact.sh uses:
   ```bash
   if [ -n "${CLAUDE_PLUGIN_ROOT:-}" ] && [ -x "$CLAUDE_PLUGIN_ROOT/bin/chester-config-read" ]; then
     CONFIG_CMD="$CLAUDE_PLUGIN_ROOT/bin/chester-config-read"
   elif command -v chester-config-read >/dev/null 2>&1; then
     CONFIG_CMD="chester-config-read"
   else
     # fallback: emit full body (can't determine config state)
     CONFIG_CMD=""
   fi
   ```
2. If `CONFIG_CMD` available: `eval "$("$CONFIG_CMD")" 2>/dev/null` to get `CHESTER_CONFIG_PATH`
3. Check `[ "${CHESTER_CONFIG_PATH:-none}" = "none" ]` — if true, include wizard; if false, omit wizard from startup payload.

`chester-config-read` is confirmed available in the hook environment (used by pre/post-compact.sh
with the same CLAUDE_PLUGIN_ROOT pattern, and confirmed in PATH directly).

**CHESTER_CONFIG_PATH "none" semantics:** Set to the string `"none"` (not empty) when no
`.claude/settings.chester.local.json` AND no `~/.claude/settings.chester.json` exist.
On any configured project: it's the actual path to `settings.chester.local.json`.
Gate condition: `[ "$CHESTER_CONFIG_PATH" = "none" ]` = new project / first run.

---

## 7. Version/Sync Surfaces

**DECISIVE.**

Current state:
- `skills/setup-start/SKILL.md` frontmatter version: `v0002`
- `skills/setup-start/SKILL.md` description: "Use when starting any conversation - establishes
  how to find and use Chester skills, requiring Skill tool invocation before ANY response
  including clarifying questions"
- `skills/setup-start/references/skill-index.md` line 24: `- \`setup-start\` — Entry point;
  establishes the pipeline and skill usage rules (this skill)`

**Two-place sync rule** (from CLAUDE.md): `description` field in SKILL.md frontmatter +
matching entry in `skills/setup-start/SKILL.md`'s available-skills list. In practice, the
"available-skills list" IS `skill-index.md` — it lives in `references/skill-index.md`.

**What a payload-split touches:**

1. `chester-util-config/session-start` — major change (add stdin read + branch + compact stub).
   **This is the primary implementation surface.**

2. `skills/setup-start/SKILL.md` body — changes if first-run wizard is physically removed
   from the file (one approach: the spec could require gating in the script without touching
   SKILL.md body). OR: if the compact stub text is carved out as a named section in SKILL.md
   (another approach: SKILL.md gets a `## Compact Stub` section that session-start reads
   separately for the compact payload).
   - Version bump required if SKILL.md body changes: v0002 → v0003.
   - If SKILL.md body is UNCHANGED (script gates via config check, compact stub is hardcoded
     or assembled in-script): no version bump, no description change, no skill-index change.

3. `hooks/hooks.json` — NOT changed (one-hook approach, adjudicated).

4. `skills/setup-start/references/skill-index.md` — NOT changed (description and behavior
   from the user's perspective is unchanged; setup-start still does the same thing at startup).

5. **CLAUDE.md sync surfaces** — none directly. The trigger-split is a delivery-mechanism
   change, not a skill-contract change visible in CLAUDE.md.

**Cleanest option for the spec**: keep SKILL.md body unchanged; all gating and stub assembly
in `session-start`. Pros: zero version bump, zero skill-index churn, one file changed.
Cons: the compact stub content lives in the script, not in SKILL.md — harder to review at
a glance. This is an implementation choice for the spec to resolve.

---

## Summary of DECISIVE Facts

| Fact | Value |
|------|-------|
| SUBAGENT-STOP location | lines 7–9, ~29 tokens |
| EXTREMELY-IMPORTANT location | lines 11–17, ~84 tokens |
| Instruction Priority location | lines 19–27, ~118 tokens |
| The Rule location | lines 168–172, ~166 tokens |
| Red Flags table location | lines 174–191, ~260 tokens |
| Skill Types location | lines 193–199, ~49 tokens |
| Compact stub total (adjudicated, w/Red Flags) | ~706 tokens |
| Branching field | `trigger` in stdin JSON |
| Compact trigger value | `"compact"` |
| Startup trigger values | `"startup"` and `"clear"` |
| hook_event_name for SessionStart | always `"SessionStart"` — NOT the branching field |
| jq available | yes, /usr/bin/jq |
| INPUT=$(cat) pattern | from pre-compact.sh lines 7/9 |
| TRIGGER extraction | `TRIGGER=$(echo "$INPUT" \| jq -r '.trigger // "")` |
| hooks.json changes needed | none (one-hook approach) |
| First-run wizard gate type | currently model-prose; for gating: script reads CHESTER_CONFIG_PATH via chester-config-read |
| chester-config-read availability | yes, in PATH and via CLAUDE_PLUGIN_ROOT/bin/ |
| CHESTER_CONFIG_PATH "none" meaning | no config files exist anywhere (new project) |
| SKILL.md changes if stub in-script | none required (version stays v0002) |
| SKILL.md changes if stub carved out | body changes → v0002 → v0003 + description/index check |
| session-start current lines | 33 lines, zero stdin read |

<!-- created-at: 2026-06-05 -->
