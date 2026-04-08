# Code Smell Review: chester-util-config/

**Scope:** `session-start`, `chester-config-read.sh`

---

## session-start

### 1. Fragile frontmatter stripping (Brittle Parser)

**Lines 12-13:**
```bash
raw_content=$(cat "${CHESTER_ROOT}/chester-setup-start/SKILL.md" 2>&1 || echo "Error reading chester-setup-start skill")
skill_content=$(echo "$raw_content" | sed '1{/^---$/!q}; 1,/^---$/d')
```

- The `sed` pattern assumes the frontmatter delimiter is exactly `---` on its own line with no trailing whitespace. A trailing space or `---\r` (Windows line endings) would silently pass the entire file including frontmatter into the system prompt.
- The `2>&1` on the `cat` merges stderr into stdout, so if the file is missing, the error message ("Error reading chester-setup-start skill" or a cat error) gets silently embedded into `raw_content` and injected into the system prompt as skill content. The `|| echo` fallback compounds this — the user sees no failure, just a corrupted prompt.

**Recommendation:** Fail explicitly if the file is missing. Use a dedicated frontmatter-strip approach that handles edge cases, or at minimum validate the result is non-empty and does not contain the error sentinel.

### 2. Incomplete JSON escaping (Correctness)

**Lines 16-24:** The `escape_for_json` function handles `\`, `"`, newline, carriage return, and tab — but JSON requires escaping all control characters U+0000 through U+001F. Characters like form feed (`\f`), backspace (`\b`), and other control characters would produce invalid JSON if present in the skill file. This is a latent bug that surfaces whenever skill content contains unusual characters.

### 3. Manual JSON construction (Fragility / Maintenance Burden)

**Line 30:**
```bash
printf '{\n  "hookSpecificOutput": {\n    "hookEventName": "SessionStart",\n    "additionalContext": "%s"\n  }\n}\n' "$session_context"
```

Building JSON by hand with `printf` and string interpolation is a classic smell. If the escaped content still contains a stray `%` or unhandled character, the output breaks silently. Using `jq` (or even `python3 -c "import json; ..."`) to construct the JSON would eliminate this entire class of bugs.

### 4. Redundant `exit 0`

**Line 32:** With `set -e` active, reaching the end of the script already implies success. The explicit `exit 0` is harmless but unnecessary clutter.

### 5. Double-escaping risk in `session_context`

**Line 27:** The variable `session_context` embeds literal `\\n` sequences (backslash-n in the source) alongside the already-escaped `$skill_escaped`. This mixes two escaping layers in one string — the `\\n` are intended to become JSON newlines, but a reader (or future editor) must mentally track which `\n` is a bash escape, which is a JSON escape, and which is literal. This is error-prone and hard to maintain.

---

## chester-config-read.sh

### 6. Shell injection via jq output (Security)

**Lines 42-44:**
```bash
echo "export CHESTER_WORK_DIR='$CHESTER_WORK_DIR'"
echo "export CHESTER_PLANS_DIR='$CHESTER_PLANS_DIR'"
echo "export CHESTER_CONFIG_PATH='$CHESTER_CONFIG_PATH'"
```

This script is designed to be consumed via `eval`. The values from `jq -r` are interpolated directly into single-quoted shell strings. If a config file contains a value with a single quote (e.g., `doc's/chester`), the `eval` at the call site would break or execute arbitrary code. This is the most serious smell in the codebase.

**Recommendation:** Either escape single quotes in the values before emitting, or use `printf '%q'` to produce safely-quoted output.

### 7. jq invocations embed shell variables inside JSON strings (Fragility)

**Lines 22-23:**
```bash
CHESTER_WORK_DIR=$(jq -r '.working_dir // "'"$DEFAULT_WORK_DIR"'"' "$PROJECT_CONFIG")
```

The quoting gymnastics (`"'"$VAR"'"`) work but are notoriously hard to read and easy to break during edits. Using `jq --arg` would be cleaner:
```bash
jq -r --arg default "$DEFAULT_WORK_DIR" '.working_dir // $default' "$PROJECT_CONFIG"
```

### 8. Silent fallback when jq is missing (Hidden Failure)

**Lines 35-39:** When `jq` is not available, the script silently falls back to defaults and emits a stderr comment. If a project config exists with custom paths, the user gets default paths with no visible warning in the eval output. The stderr message is easy to miss, especially when the output is captured via `eval "$(...)"` which does not display stderr by default in all contexts.

### 9. Duplicated default assignment blocks (DRY Violation)

The same three-line block assigning `CHESTER_WORK_DIR`, `CHESTER_PLANS_DIR`, and `CHESTER_CONFIG_PATH` to defaults appears three times (lines 27-29, 31-33, 36-38). Extracting a function or setting defaults before the conditional and only overriding on match would reduce duplication.

### 10. `git rev-parse` failure mode

**Line 8:**
```bash
PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
```

If run outside a git repo, `PROJECT_ROOT` becomes the current working directory. This is reasonable, but the config path then becomes `$PWD/.claude/settings.chester.local.json` — which depends on where the caller invoked the script from, not where the project actually lives. This could silently resolve the wrong config.

---

## Summary

| # | File | Smell | Severity |
|---|------|-------|----------|
| 1 | session-start | Fragile frontmatter stripping | Medium |
| 2 | session-start | Incomplete JSON escaping | Medium |
| 3 | session-start | Manual JSON construction | Medium |
| 4 | session-start | Redundant exit 0 | Low |
| 5 | session-start | Double-escaping layers | Low |
| 6 | chester-config-read.sh | Shell injection via eval | High |
| 7 | chester-config-read.sh | jq quoting gymnastics | Low |
| 8 | chester-config-read.sh | Silent jq-missing fallback | Medium |
| 9 | chester-config-read.sh | Duplicated default blocks | Low |
| 10 | chester-config-read.sh | Ambiguous PROJECT_ROOT outside git | Low |

The most actionable item is #6 (shell injection risk in the eval-consumed output). The next tier would be #1-3 in session-start, which collectively make the JSON output fragile.
