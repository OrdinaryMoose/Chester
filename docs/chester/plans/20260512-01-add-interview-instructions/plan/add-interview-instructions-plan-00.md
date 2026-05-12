# Plan: Add Interview Instructions — Session-Scoped Info-Packet Style Overlay

**Sprint:** 20260512-01-add-interview-instructions
**Spec:** docs/chester/working/20260512-01-add-interview-instructions/spec/add-interview-instructions-spec-01.md
**Execution mode:** subagent

> **For agentic workers:** Use execute-write to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The `Execution mode` field selects which execute-write section runs — Section 2 (subagent-driven) or Section 3 (inline). plan-build sets this field at handoff based on the Execution Mode Selection heuristic, with human confirm/override.

## Goal

Add a session-scoped info-packet style overlay to Chester's shared voice-rules authority so any interview-style skill can shape rendering at first turn, mid-session via `instruction` directives, and persistently via `instruction(save)`.

## Architecture

Hybrid: the overlay contract, verbosity ladder, composition rule, memory rule, and directive protocol all live in `skills/util-design-partner-role/SKILL.md` (centralized rule). Each interview skill carries a short concrete framing step naming the four moves (load env var, present keep/adjust/default, embed, activate protocol) and defers mechanics to the voice authority. Mid-session `instruction` directives use replace semantics — each directive produces a new full active style with a full-readout acknowledgment; `instruction(save)` invokes a new helper script that atomically merges the value into `~/.claude/settings.chester.json`. Loading at interview start follows the existing bootstrap-extension pattern: `chester-config-read.sh` reads the new key and emits `CHESTER_INFO_PACKET_STYLE`; `start-bootstrap` documents the env var.

## Tech Stack

- Bash 4+ (`set -euo pipefail`)
- `jq` for JSON read/write (already a hard dependency of `chester-config-read.sh`)
- Chester test convention: self-contained bash scripts under `tests/`
- Markdown SKILL.md files with YAML frontmatter

---

## Task 1: Extend `chester-config-read.sh` to emit `CHESTER_INFO_PACKET_STYLE`

**Type:** code-producing
**Implements:** AC-1.1, AC-1.2, AC-1.3, AC-1.4
**Decision budget:** 2 (single-quote-safe export idiom; placement of unconditional user-config read relative to existing if/elif)
**Must remain green:** `tests/test-chester-config-read-info-packet-style.sh`, `tests/test-config-read-new.sh`

**Files:**
- Modify: `chester-util-config/chester-config-read.sh` (additions only — see Step 3)
- Test: `tests/test-chester-config-read-info-packet-style.sh` (new)

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Create `tests/test-chester-config-read-info-packet-style.sh`:

```bash
#!/usr/bin/env bash
# Verifies CHESTER_INFO_PACKET_STYLE export across the four spec cases.
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
SCRIPT="$REPO_ROOT/chester-util-config/chester-config-read.sh"
FACTORY_DEFAULT='bullet list, normal verbosity, Product Manager voice'
FAIL=0

# Build an isolated $HOME for each case so the user's real settings file is untouched.
make_home() {
  local sandbox
  sandbox="$(mktemp -d)"
  mkdir -p "$sandbox/.claude"
  echo "$sandbox"
}

# Case 1: setting absent — file does not exist.
case1() {
  local home; home="$(make_home)"
  HOME="$home" eval "$("$SCRIPT")"
  if [ "$CHESTER_INFO_PACKET_STYLE" != "$FACTORY_DEFAULT" ]; then
    echo "FAIL case1 (absent file): got '$CHESTER_INFO_PACKET_STYLE'" >&2; FAIL=1
  fi
  rm -rf "$home"
}

# Case 2: setting present with custom value.
case2() {
  local home; home="$(make_home)"
  printf '{"info_packet_style":"%s"}\n' "custom prose value" > "$home/.claude/settings.chester.json"
  HOME="$home" eval "$("$SCRIPT")"
  if [ "$CHESTER_INFO_PACKET_STYLE" != "custom prose value" ]; then
    echo "FAIL case2 (custom value): got '$CHESTER_INFO_PACKET_STYLE'" >&2; FAIL=1
  fi
  rm -rf "$home"
}

# Case 3: setting present but null.
case3() {
  local home; home="$(make_home)"
  printf '{"info_packet_style":null}\n' > "$home/.claude/settings.chester.json"
  HOME="$home" eval "$("$SCRIPT")"
  if [ "$CHESTER_INFO_PACKET_STYLE" != "$FACTORY_DEFAULT" ]; then
    echo "FAIL case3 (null value): got '$CHESTER_INFO_PACKET_STYLE'" >&2; FAIL=1
  fi
  rm -rf "$home"
}

# Case 4: jq unavailable. Simulate by stubbing PATH so jq is not found.
# IMPORTANT: prefix assignments must bind to the command substitution (the bash
# subprocess that runs $SCRIPT), not to the eval builtin. Writing
# `HOME=... PATH=... eval "$(bash "$SCRIPT")"` is WRONG — the assignments only
# apply to eval (a builtin that doesn't use PATH), and the command substitution
# runs with the outer shell's PATH (jq still findable). The correct form puts
# the assignments inside the command substitution so the bash subprocess
# inherits them.
case4() {
  local home; home="$(make_home)"
  local stub_bin; stub_bin="$(mktemp -d)"
  eval "$(HOME="$home" PATH="$stub_bin" bash "$SCRIPT")"
  if [ "$CHESTER_INFO_PACKET_STYLE" != "$FACTORY_DEFAULT" ]; then
    echo "FAIL case4 (no jq): got '$CHESTER_INFO_PACKET_STYLE'" >&2; FAIL=1
  fi
  rm -rf "$home" "$stub_bin"
}

# Case 5: shell-special characters in the style value — single quote, double quote, ampersand, parens, backslash.
case5() {
  local home; home="$(make_home)"
  local hairy
  hairy="bullets; it's \"loud\" & (notable) \\backslash"
  jq -n --arg s "$hairy" '{info_packet_style: $s}' > "$home/.claude/settings.chester.json"
  HOME="$home" eval "$("$SCRIPT")"
  if [ "$CHESTER_INFO_PACKET_STYLE" != "$hairy" ]; then
    echo "FAIL case5 (special chars): got '$CHESTER_INFO_PACKET_STYLE'" >&2
    echo "       expected '$hairy'" >&2; FAIL=1
  fi
  rm -rf "$home"
}

case1; case2; case3; case4; case5

if [ "$FAIL" -eq 0 ]; then
  echo "PASS test-chester-config-read-info-packet-style"
else
  exit 1
fi
```

Make the test file executable: `chmod +x tests/test-chester-config-read-info-packet-style.sh`.

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/test-chester-config-read-info-packet-style.sh`
Expected: FAIL on case1 (the script currently does not emit `CHESTER_INFO_PACKET_STYLE`, so `$CHESTER_INFO_PACKET_STYLE` is unset, which fails the comparison or — under `set -u` in the test — aborts the script).

- [ ] **Step 3: Write minimal implementation**

Edit `chester-util-config/chester-config-read.sh`. Apply these four insertions (do not modify any existing line).

**Line-number caveat.** The line numbers below describe the script's state *before any insertion is applied*. Each insertion shifts later line numbers, so use the structural landmarks (variable names, `fi`/`else` keywords, last `echo "export ..."` line) — not the raw numbers — to locate insertion points. The structural landmarks are unambiguous.

**Insertion A** — after line 21 (`DEFAULT_PLANS_DIR="docs/chester/plans"`), add:

```bash
DEFAULT_INFO_PACKET_STYLE='bullet list, normal verbosity, Product Manager voice'
```

**Insertion B** — inside the outer `if command -v jq &>/dev/null; then` branch, after the inner `fi` at line 43 (which closes the if/elif/else block that selects between project and user config for directory keys) and before the outer `else` at line 44 (which begins the jq-absent branch), add a separate unconditional read of `info_packet_style` from `$USER_CONFIG`. This is a peer concern with directory keys, not part of their authority split:

```bash
  # info_packet_style is a peer concern, read unconditionally from user config.
  # || true guards set -euo pipefail against malformed JSON in user config.
  if [ -f "$USER_CONFIG" ]; then
    CHESTER_INFO_PACKET_STYLE=$(jq -r '.info_packet_style // empty' "$USER_CONFIG" 2>/dev/null || true)
    [ -z "$CHESTER_INFO_PACKET_STYLE" ] && CHESTER_INFO_PACKET_STYLE="$DEFAULT_INFO_PACKET_STYLE"
  else
    CHESTER_INFO_PACKET_STYLE="$DEFAULT_INFO_PACKET_STYLE"
  fi
```

**Insertion C** — inside the `else` branch (jq unavailable, after line 48 `echo "# Chester: jq not available..."`), add:

```bash
  CHESTER_INFO_PACKET_STYLE="$DEFAULT_INFO_PACKET_STYLE"
```

**Insertion D** — after the last `echo "export ..."` line at line 60 (the `CHESTER_MAIN_ROOT` export), add a single-line comment explaining the idiom change and then the `printf` line. The comment is required because the four existing exports use single-quote wrapping (`echo "export VAR='$VAR'"`), and the asymmetry will read as inconsistency without it:

```bash
# CHESTER_INFO_PACKET_STYLE carries user-provided free-form prose; use %q (not single-quote wrapping) so values with quotes, backslashes, or Unicode survive eval.
printf 'export CHESTER_INFO_PACKET_STYLE=%q\n' "$CHESTER_INFO_PACKET_STYLE"
```

`printf %q` emits the value in a form that survives `eval` regardless of shell-special characters (single quotes, double quotes, backslashes, etc.). This handles AC-1.4 by construction.

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/test-chester-config-read-info-packet-style.sh`
Expected: `PASS test-chester-config-read-info-packet-style`

Also run the existing config-read test to confirm no regression:

Run: `bash tests/test-config-read-new.sh`
Expected: PASS (existing pass output).

- [ ] **Step 5: Commit**

```bash
git add chester-util-config/chester-config-read.sh tests/test-chester-config-read-info-packet-style.sh
git commit -m "feat: emit CHESTER_INFO_PACKET_STYLE from chester-config-read"
```

---

## Task 2: Create `chester-style-write.sh` helper and `bin/chester-style-write` wrapper

**Type:** code-producing
**Implements:** AC-2.1, AC-2.2, AC-2.3, AC-2.4, AC-2.5
**Decision budget:** 2 (atomic-write idiom; error-message wording)
**Must remain green:** `tests/test-chester-style-write.sh` (new), `tests/test-chester-config-read-info-packet-style.sh` (round-trip dependency from Task 1)

**Files:**
- Create: `chester-util-config/chester-style-write.sh`
- Create: `bin/chester-style-write`
- Test: `tests/test-chester-style-write.sh` (new)

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Create `tests/test-chester-style-write.sh`:

```bash
#!/usr/bin/env bash
# Verifies chester-style-write helper + bin wrapper across the AC-2.x cases.
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
HELPER="$REPO_ROOT/chester-util-config/chester-style-write.sh"
WRAPPER="$REPO_ROOT/bin/chester-style-write"
CONFIG_READ="$REPO_ROOT/chester-util-config/chester-config-read.sh"
FAIL=0

make_home() {
  local sandbox; sandbox="$(mktemp -d)"
  mkdir -p "$sandbox/.claude"
  echo "$sandbox"
}

# AC-2.2: write to absent file — creates the file with the single key.
ac22() {
  local home; home="$(make_home)"
  HOME="$home" bash "$HELPER" "new style value"
  local got
  got=$(jq -r '.info_packet_style' "$home/.claude/settings.chester.json")
  if [ "$got" != "new style value" ]; then
    echo "FAIL AC-2.2: got '$got'" >&2; FAIL=1
  fi
  rm -rf "$home"
}

# AC-2.1: write to file with other keys — preserves the other keys.
ac21() {
  local home; home="$(make_home)"
  printf '{"working_dir":"docs/keep","other":42}\n' > "$home/.claude/settings.chester.json"
  HOME="$home" bash "$HELPER" "shaped prose"
  local style other working
  style=$(jq -r '.info_packet_style' "$home/.claude/settings.chester.json")
  other=$(jq -r '.other' "$home/.claude/settings.chester.json")
  working=$(jq -r '.working_dir' "$home/.claude/settings.chester.json")
  if [ "$style" != "shaped prose" ] || [ "$other" != "42" ] || [ "$working" != "docs/keep" ]; then
    echo "FAIL AC-2.1: style=$style other=$other working=$working" >&2; FAIL=1
  fi
  rm -rf "$home"
}

# AC-2.3a: empty argument fails cleanly.
ac23a() {
  local home; home="$(make_home)"
  if HOME="$home" bash "$HELPER" "" 2>/dev/null; then
    echo "FAIL AC-2.3a: empty arg should fail" >&2; FAIL=1
  fi
  rm -rf "$home"
}

# AC-2.3b: missing jq fails cleanly. Stub PATH so jq is not found.
ac23b() {
  local home; home="$(make_home)"
  local stub_bin; stub_bin="$(mktemp -d)"
  if HOME="$home" PATH="$stub_bin" bash "$HELPER" "any value" 2>/dev/null; then
    echo "FAIL AC-2.3b: missing jq should fail" >&2; FAIL=1
  fi
  rm -rf "$home" "$stub_bin"
}

# AC-2.4: round-trip — write, then chester-config-read yields the same value.
ac24() {
  local home; home="$(make_home)"
  HOME="$home" bash "$HELPER" "round-trip prose"
  HOME="$home" eval "$(bash "$CONFIG_READ")"
  if [ "$CHESTER_INFO_PACKET_STYLE" != "round-trip prose" ]; then
    echo "FAIL AC-2.4: got '$CHESTER_INFO_PACKET_STYLE'" >&2; FAIL=1
  fi
  rm -rf "$home"
}

# AC-2.5: wrapper is invocable and forwards "$@".
ac25() {
  local home; home="$(make_home)"
  HOME="$home" bash "$WRAPPER" "wrapper value"
  local got
  got=$(jq -r '.info_packet_style' "$home/.claude/settings.chester.json")
  if [ "$got" != "wrapper value" ]; then
    echo "FAIL AC-2.5: got '$got'" >&2; FAIL=1
  fi
  rm -rf "$home"
}

# Hairy-input safety — jq --arg binding must survive single quotes, double quotes, ampersands, parens, backslashes.
ac_hairy() {
  local home; home="$(make_home)"
  local hairy
  hairy="bullets; it's \"loud\" & (notable) \\backslash"
  HOME="$home" bash "$HELPER" "$hairy"
  local got
  got=$(jq -r '.info_packet_style' "$home/.claude/settings.chester.json")
  if [ "$got" != "$hairy" ]; then
    echo "FAIL ac_hairy: got '$got'" >&2
    echo "             expected '$hairy'" >&2; FAIL=1
  fi
  rm -rf "$home"
}

ac22; ac21; ac23a; ac23b; ac24; ac25; ac_hairy

if [ "$FAIL" -eq 0 ]; then
  echo "PASS test-chester-style-write"
else
  exit 1
fi
```

`chmod +x tests/test-chester-style-write.sh`.

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/test-chester-style-write.sh`
Expected: FAIL — both `$HELPER` and `$WRAPPER` paths do not exist, so the bash invocation aborts.

- [ ] **Step 3: Write minimal implementation**

Create `chester-util-config/chester-style-write.sh`:

```bash
#!/usr/bin/env bash
# chester-style-write: merge info_packet_style into the user-level Chester settings file.
# Usage: chester-style-write <new-style-text>
set -euo pipefail

usage() {
  echo "Usage: chester-style-write <new-style-text>" >&2
  exit 2
}

[ "$#" -eq 1 ] || usage
[ -n "$1" ] || usage

if ! command -v jq >/dev/null 2>&1; then
  echo "chester-style-write: jq is required but not on PATH" >&2
  exit 1
fi

USER_CONFIG="$HOME/.claude/settings.chester.json"
mkdir -p "$(dirname "$USER_CONFIG")"

# Create empty JSON if absent so the jq merge has something to operate on.
[ -f "$USER_CONFIG" ] || echo '{}' > "$USER_CONFIG"

# Atomic write: temp file in same directory, then mv.
TMP="$(mktemp "${USER_CONFIG}.XXXXXX")"
trap 'rm -f "$TMP"' EXIT

if ! jq --arg style "$1" '. + {info_packet_style: $style}' "$USER_CONFIG" > "$TMP"; then
  echo "chester-style-write: jq merge failed (settings file may be malformed)" >&2
  exit 1
fi

mv "$TMP" "$USER_CONFIG"
trap - EXIT
```

`chmod +x chester-util-config/chester-style-write.sh`.

Create `bin/chester-style-write`:

```bash
#!/usr/bin/env bash
# Self-resolving wrapper — added to PATH by the plugin system
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CHESTER_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
exec "$CHESTER_ROOT/chester-util-config/chester-style-write.sh" "$@"
```

`chmod +x bin/chester-style-write`.

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/test-chester-style-write.sh`
Expected: `PASS test-chester-style-write`

Also confirm Task 1's test still passes (round-trip case 2.4 depends on Task 1's changes):

Run: `bash tests/test-chester-config-read-info-packet-style.sh`
Expected: `PASS test-chester-config-read-info-packet-style`

- [ ] **Step 5: Commit**

```bash
git add chester-util-config/chester-style-write.sh bin/chester-style-write tests/test-chester-style-write.sh
git commit -m "feat: add chester-style-write helper and bin wrapper"
```

---

## Task 3: Add Info-Packet Style Overlay section to `util-design-partner-role` + sync `skill-index.md`

**Type:** docs-producing
**Implements:** AC-3.1, AC-3.2, AC-3.3, AC-3.4, AC-3.5, AC-5.1, AC-5.2, AC-5.3, AC-6.1, AC-6.2, AC-7.2
**Decision budget:** 2 (exact verbosity-ladder phrasing; description-clause wording)
**Must remain green:** `tests/test-partner-role-discipline.sh` (existing — confirms the new section does not break existing discipline assertions)

**Files:**
- Modify: `skills/util-design-partner-role/SKILL.md` (frontmatter description, version field, body section insertion after Composition Note at line 46)
- Modify: `skills/setup-start/references/skill-index.md` (line 55 entry for `util-design-partner-role`)

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Add a presence-and-version assertion to a fresh test file `tests/test-partner-role-overlay-section.sh`:

```bash
#!/usr/bin/env bash
# Verifies util-design-partner-role carries the Info-Packet Style Overlay section
# and the version + description are updated to reflect it.
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
SKILL="$REPO_ROOT/skills/util-design-partner-role/SKILL.md"
INDEX="$REPO_ROOT/skills/setup-start/references/skill-index.md"
FAIL=0

# Section heading present.
grep -q '^## Info-Packet Style Overlay$' "$SKILL" || {
  echo "FAIL: Info-Packet Style Overlay section heading missing" >&2; FAIL=1; }

# Five contract pieces named in the new section (case-insensitive substring).
for needle in 'verbosity ladder' 'composition' 'memory' 'directive protocol' 'handshake'; do
  grep -qi "$needle" "$SKILL" || { echo "FAIL: section missing '$needle' coverage" >&2; FAIL=1; }
done

# Factory-default-by-reference (no restatement of the literal string).
grep -q 'factory default defined in' "$SKILL" || {
  echo "FAIL: factory default reference language missing" >&2; FAIL=1; }
# Make sure the literal string is NOT restated in the SKILL.md.
if grep -q 'bullet list, normal verbosity, Product Manager voice' "$SKILL"; then
  echo "FAIL: factory default literal restated in SKILL.md (should be by-reference only)" >&2; FAIL=1
fi

# Version bumped to v0002.
grep -q '^version: v0002$' "$SKILL" || { echo "FAIL: version not v0002" >&2; FAIL=1; }

# skill-index entry mentions the overlay so the description stays in sync.
grep -q 'overlay' "$INDEX" || { echo "FAIL: skill-index entry not updated to mention overlay" >&2; FAIL=1; }

[ $FAIL -eq 0 ] && echo "PASS test-partner-role-overlay-section" || exit 1
```

`chmod +x tests/test-partner-role-overlay-section.sh`.

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/test-partner-role-overlay-section.sh`
Expected: FAIL on the section-heading grep and on the version check.

- [ ] **Step 3: Write minimal implementation**

In `skills/util-design-partner-role/SKILL.md`:

(a) Replace the `version: v0001` line (line 4 of frontmatter) with:

```
version: v0002
```

(b) Replace the frontmatter `description` line (line 3) with:

```
description: Canonical rules for the Design Partner voice — the Interpreter Frame, read-aloud discipline, option-naming rule, self-evaluation game, and the session-scoped info-packet style overlay (verbosity ladder, composition, directive protocol). Read this skill (don't invoke it) when running design-large-task or design-small-task. Both design skills import the same voice rules from here so the discipline stays in one place.
```

(c) Immediately after the Composition Note paragraph at line 46 (preserving the blank line that precedes `## Private Precision Slot` at line 48), insert this new section:

```markdown
## Info-Packet Style Overlay

A session-scoped overlay layered on top of the voice disciplines above. Where the disciplines define **what the agent may say**, the overlay defines **how the agent renders information packets** — verbosity, formatting, focus, voice flavor. It applies only to designer-visible packet rendering during interview-style conversations; it never modifies the interview's structural sequence, stage discipline, or MCP protocols.

The active style is loaded at interview start from the env var `CHESTER_INFO_PACKET_STYLE` (exported by `start-bootstrap` via the bootstrap-extension pattern). The value is a free-form prose string. When unset or when the user has not configured a style, the script falls back to the factory default defined in `chester-config-read.sh` — refer to it by reference; never restate the literal string here.

### Verbosity Ladder

The overlay names verbosity using three grammatically-anchored levels:

- **Terse.** Simple sentences only, one independent clause each. One sentence per bullet. No examples.
- **Normal.** Simple and complex sentences mixed, at most one subordinate clause per sentence. One-to-two sentences per bullet. Examples where load-bearing.
- **Verbose.** Complex and compound-complex sentences with multiple subordinate clauses. Two-to-four sentences per bullet. Asides and multi-example illustration permitted.

These are interpretation anchors for the agent, not constraints on the storage format. The style string can name them ("terse," "normal verbosity," "verbose") or describe equivalent shapes in prose.

### Composition Rule

The voice disciplines above (Translation Gate, read-aloud, option-naming, externalized coverage, marker discipline, stance principles) are **hard constraints** — the overlay never overrides them. When an overlay directive conflicts with a discipline rule, the agent silently clamps the conflicting aspect and renders the constraint-compliant version. The agent announces a clamp only when the **entire** directive becomes a no-op under the disciplines — for example, a directive that asks the agent to use type names violates the Translation Gate completely and lands as a clamp announcement; a directive that asks for "more verbose with type names" silently clamps the type-name aspect and applies the verbosity change without comment.

### Memory Independence

The overlay is independent of auto-memory feedback entries. Memory rules continue to apply across sessions as long-lived guidance. When an overlay directive conflicts with a memory entry during the session, the overlay wins for the remainder of the session — but the memory entry is not modified by the conflict. Removing a memory entry remains an explicit user operation outside the overlay protocol.

### Directive Protocol

Mid-session, the designer can shape the active style with an `instruction` directive. Recognition is by intent, not strict syntax — `instruction;`, `instruction:`, `instruction —`, or `instruction` followed by directive text are all valid. Only `instruction(save)` is syntactically special: its presence as a literal substring triggers the persistence write path.

**Replace semantics.** Each `instruction` directive produces a single new full active style via synthesis of the prior style with the directive intent. The prior style is replaced in working memory. No layered adjustment stack is maintained. The agent acknowledges with a full readout of the new active style so the designer can detect synthesis drift immediately and correct it with another directive if needed.

**Persistence.** `instruction(save) <directive prose>` updates the session active style as above **and** invokes the helper `chester-style-write "<new active style>"` to merge the new value into `~/.claude/settings.chester.json`. If the helper invocation fails, the agent reports the failure in plain prose; the session-scoped change still applies even when persistence fails.

### First-Turn Handshake

At every interview skill's first-turn framing block, the agent executes four moves:

1. Read `CHESTER_INFO_PACKET_STYLE` from the environment.
2. Present the active style to the designer with three options: keep as-is, adjust for this session, or revert to the factory default.
3. Embed the resolved style into the orientation framing.
4. Activate the directive protocol for the remainder of the session.

Interview skills name the four moves in their own framing blocks but defer the mechanics to this section.
```

In `skills/setup-start/references/skill-index.md`, replace line 55 with:

```
- `util-design-partner-role` — Canonical voice rules for design skills (Interpreter Frame, option-naming, self-evaluation, info-packet style overlay). Read, don't invoke.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/test-partner-role-overlay-section.sh`
Expected: `PASS test-partner-role-overlay-section`

Run the existing discipline test to confirm no regression:

Run: `bash tests/test-partner-role-discipline.sh`
Expected: PASS (existing pass output).

- [ ] **Step 5: Commit**

```bash
git add skills/util-design-partner-role/SKILL.md skills/setup-start/references/skill-index.md tests/test-partner-role-overlay-section.sh
git commit -m "feat: add info-packet style overlay section to util-design-partner-role"
```

---

## Task 4: Document `CHESTER_INFO_PACKET_STYLE` in `start-bootstrap` and bump version

**Type:** docs-producing
**Implements:** AC-7.3, AC-7.1 (start-bootstrap version-bump portion)
**Decision budget:** 1 (bullet placement order within "What It Returns")
**Must remain green:** (no existing bootstrap-specific tests; rely on Task 6's cross-cutting version test)

**Files:**
- Modify: `skills/start-bootstrap/SKILL.md` (frontmatter version line; insert one bullet into "What It Returns" section)

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Inline grep assertions (no new test file — Task 6 introduces the cross-cutting version test that subsumes per-skill coverage):

```bash
grep -q '^- `CHESTER_INFO_PACKET_STYLE`' skills/start-bootstrap/SKILL.md
grep -q '^version: v0002$' skills/start-bootstrap/SKILL.md
```

Run both: `bash -c 'grep -q "^- \`CHESTER_INFO_PACKET_STYLE\`" skills/start-bootstrap/SKILL.md && grep -q "^version: v0002$" skills/start-bootstrap/SKILL.md && echo PASS || echo FAIL'`

- [ ] **Step 2: Run grep to verify it fails**

Expected: `FAIL` (neither the bullet nor the bumped version exists yet).

- [ ] **Step 3: Write minimal implementation**

In `skills/start-bootstrap/SKILL.md`:

(a) Change frontmatter line 8 from `version: v0001` to:

```
version: v0002
```

(b) In the "What It Returns" section (line 104), after the existing `CHESTER_PLANS_DIR` bullet (line 109), insert a new bullet preserving the existing order:

```
- `CHESTER_INFO_PACKET_STYLE` — the active info-packet style string (from user settings or factory default), consumed by interview skills at first-turn framing
```

Place it immediately after the `CHESTER_PLANS_DIR` line so the two env-var bullets sit together before the descriptive bullets below.

- [ ] **Step 4: Run grep to verify it passes**

Run: `bash -c 'grep -q "^- \`CHESTER_INFO_PACKET_STYLE\`" skills/start-bootstrap/SKILL.md && grep -q "^version: v0002$" skills/start-bootstrap/SKILL.md && echo PASS || echo FAIL'`
Expected: `PASS`.

- [ ] **Step 5: Commit**

```bash
git add skills/start-bootstrap/SKILL.md
git commit -m "docs: document CHESTER_INFO_PACKET_STYLE in start-bootstrap"
```

---

## Task 5: Add Phase 3 framing-step handshake to `design-large-task/SKILL.md` and bump version

**Type:** docs-producing
**Implements:** AC-4.1, AC-4.3 (design-large-task half), AC-7.1 (design-large-task version-bump portion)
**Decision budget:** 1 (insertion point within Phase 3 step 3)
**Must remain green:** `tests/test-stamping-design-large-task.sh` (after Step 3b updates its pin), `tests/test-large-task-closure.sh`

**Files:**
- Modify: `skills/design-large-task/SKILL.md` (frontmatter version line; insert handshake paragraph at the end of Phase 3 step 3, after line 262)
- Modify: `tests/test-stamping-design-large-task.sh` (line 21 — re-pin the version literal)

**Pre-task note.** `tests/test-stamping-design-large-task.sh` currently pins `v0011` while the actual `design-large-task` version is `v0013`. The test is already failing at sprint start (independent of this work). This task must re-pin it to `v0014` (the new post-bump version) as part of the implementation — see Step 3b.

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Inline grep assertions:

```bash
grep -q '^version: v0014$' skills/design-large-task/SKILL.md
grep -qi 'info-packet style handshake' skills/design-large-task/SKILL.md
grep -q 'CHESTER_INFO_PACKET_STYLE' skills/design-large-task/SKILL.md
```

Combined check command: `bash -c 'grep -q "^version: v0014$" skills/design-large-task/SKILL.md && grep -qi "info-packet style handshake" skills/design-large-task/SKILL.md && grep -q "CHESTER_INFO_PACKET_STYLE" skills/design-large-task/SKILL.md && echo PASS || echo FAIL'`

- [ ] **Step 2: Run grep to verify it fails**

Expected: `FAIL`.

- [ ] **Step 3: Write minimal implementation**

In `skills/design-large-task/SKILL.md`:

(a) Change frontmatter line 4 from `version: v0013` to:

```
version: v0014
```

(b) In Phase 3 (line 246), at the end of step 3 ("Session Framing") — immediately after the closing paragraph at line 262 ("Plain conversational opener. No 'alignment check' language yet...") and before step 4 ("Active-flow framing additions") at line 264 — insert this new paragraph (preserving the blank line that follows line 262):

```
   **Info-packet style handshake.** As part of this first turn, execute the four-move handshake defined in the Info-Packet Style Overlay section of `util-design-partner-role`: read `CHESTER_INFO_PACKET_STYLE` from the environment, present the active style to the designer with three options (keep, adjust for this session, revert to factory default), embed the resolved style into the orientation framing above, and activate the directive protocol for the remainder of the session. The handshake is a parallel operation to the framing block — it does not alter the four framing bullets the designer sees. Do not read `~/.claude/settings.chester.json` directly; the env var is the only entry path.
```

The three-space indent preserves nesting under step 3.

(c) In `tests/test-stamping-design-large-task.sh`, line 21:

Replace:

```bash
[ "$CUR_VER" = "v0011" ] || fail "version not at v0011 (got $CUR_VER)"
```

with:

```bash
[ "$CUR_VER" = "v0014" ] || fail "version not at v0014 (got $CUR_VER)"
```

Also update the comment block above (lines 16-19) to add `v0011 → v0012 → v0013 → v0014` to the bump history. The comment is non-load-bearing but should not lie about the version chain. Suggested replacement text:

```bash
# Stamping wiring landed at v0009. Post-sprint legitimate bumps:
#   v0009 → v0010 (f5bd820, FRICTION routing) → v0011 (359df3f, open_proof rename) → ... → v0014 (add-interview-instructions, info-packet style handshake step).
# Re-pin when skill bumps for reasons unrelated to stamp wiring.
```

- [ ] **Step 4: Run grep to verify it passes**

Run: `bash -c 'grep -q "^version: v0014$" skills/design-large-task/SKILL.md && grep -qi "info-packet style handshake" skills/design-large-task/SKILL.md && grep -q "CHESTER_INFO_PACKET_STYLE" skills/design-large-task/SKILL.md && echo PASS || echo FAIL'`
Expected: `PASS`.

Also run the existing skill-affecting tests:

Run: `bash tests/test-stamping-design-large-task.sh && bash tests/test-large-task-closure.sh`
Expected: PASS for both. The stamping test now pins `v0014` (per Step 3c above) and matches the bumped frontmatter. `test-large-task-closure.sh` does not pin a version literal and is expected to be unaffected by the bump.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/SKILL.md tests/test-stamping-design-large-task.sh
git commit -m "feat(design-large-task): add Phase 3 info-packet style handshake step"
```

---

## Task 6: Add Phase 3 framing-step handshake to `design-small-task/SKILL.md`, bump version, and land cross-cutting version test

**Type:** docs-producing
**Implements:** AC-4.2, AC-4.3 (design-small-task half), AC-7.1 (cross-cutting version-bump verification)
**Decision budget:** 1 (insertion point within Phase 3 step 1)
**Must remain green:** `tests/test-info-packet-style-version-bumps.sh` (new), `tests/test-stamping-design-small-task.sh` (after Step 3c updates its pin), `tests/test-small-task-artifact-handoff.sh`

**Files:**
- Modify: `skills/design-small-task/SKILL.md` (frontmatter version line; insert handshake paragraph at the end of Phase 3 step 1, after line 112)
- Modify: `tests/test-stamping-design-small-task.sh` (line 12 — re-pin the version literal)
- Create: `tests/test-info-packet-style-version-bumps.sh`

**Pre-task note.** `tests/test-stamping-design-small-task.sh` line 12 currently pins `v0002`. After this task's frontmatter bump to `v0003`, the stamping test would fail. Re-pin it to `v0003` as part of the implementation — see Step 3c.

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Create `tests/test-info-packet-style-version-bumps.sh`:

```bash
#!/usr/bin/env bash
# Cross-cutting check: all four affected SKILL.md files have been version-bumped
# per the add-interview-instructions spec.
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
FAIL=0

check() {
  local rel="$1"; local expected="$2"
  local actual
  actual=$(grep -E '^version:' "$REPO_ROOT/$rel" | head -1 | sed -E 's/^version:[[:space:]]*//')
  if [ "$actual" != "$expected" ]; then
    echo "FAIL: $rel expected '$expected', got '$actual'" >&2; FAIL=1
  fi
}

check "skills/util-design-partner-role/SKILL.md" "v0002"
check "skills/start-bootstrap/SKILL.md"           "v0002"
check "skills/design-large-task/SKILL.md"         "v0014"
check "skills/design-small-task/SKILL.md"         "v0003"

# Sanity: the design-small-task SKILL.md mentions the handshake step (the test for this task's edit).
grep -qi 'info-packet style handshake' "$REPO_ROOT/skills/design-small-task/SKILL.md" || {
  echo "FAIL: design-small-task SKILL.md missing handshake mention" >&2; FAIL=1; }

[ $FAIL -eq 0 ] && echo "PASS test-info-packet-style-version-bumps" || exit 1
```

`chmod +x tests/test-info-packet-style-version-bumps.sh`.

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/test-info-packet-style-version-bumps.sh`
Expected: FAIL on the `design-small-task` version check (v0002, not v0003) and on the handshake-mention grep.

- [ ] **Step 3: Write minimal implementation**

In `skills/design-small-task/SKILL.md`:

(a) Change frontmatter line 4 from `version: v0002` to:

```
version: v0003
```

(b) In Phase 3 (line 102), at the end of step 1 ("Session Framing") — immediately after the closing paragraph at line 112 ("This block is a paragraph or short list...") and before step 2 ("Observations / Information Package / Commentary") at line 114 — insert this new paragraph (preserving the blank line that follows line 112):

```
   **Info-packet style handshake.** As part of this first turn, execute the four-move handshake defined in the Info-Packet Style Overlay section of `util-design-partner-role`: read `CHESTER_INFO_PACKET_STYLE` from the environment, present the active style to the designer with three options (keep, adjust for this session, revert to factory default), embed the resolved style into the orientation framing above, and activate the directive protocol for the remainder of the session. The handshake is a parallel operation to the framing block — it does not alter the four framing bullets the designer sees. Do not read `~/.claude/settings.chester.json` directly; the env var is the only entry path.
```

The three-space indent preserves nesting under step 1.

(c) In `tests/test-stamping-design-small-task.sh`, line 12:

Replace:

```bash
[ "$CUR_VER" = "v0002" ] || fail "version not bumped to v0002 (got $CUR_VER)"
```

with:

```bash
[ "$CUR_VER" = "v0003" ] || fail "version not bumped to v0003 (got $CUR_VER)"
```

Also update the comment on line 11 to reflect the new baseline:

```bash
# Pre-sprint baseline: design-small-task is at v0002 → bump to v0003 (info-packet style handshake step).
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/test-info-packet-style-version-bumps.sh`
Expected: `PASS test-info-packet-style-version-bumps` (all four versions match, handshake mention found).

Also run the design-small-task-affecting tests:

Run: `bash tests/test-stamping-design-small-task.sh && bash tests/test-small-task-artifact-handoff.sh`
Expected: PASS for both.

Finally, run the full test suite to catch any regression:

Run: `for t in tests/test-*.sh; do bash "$t" || echo "FAIL: $t"; done`
Expected: every test passes; no `FAIL:` lines reported.

- [ ] **Step 5: Commit**

```bash
git add skills/design-small-task/SKILL.md tests/test-stamping-design-small-task.sh tests/test-info-packet-style-version-bumps.sh
git commit -m "feat(design-small-task): add Phase 3 info-packet style handshake step"
```

<!-- created-at: 2026-05-12T15:57:25Z -->
<!-- produced-by plan-build@v0004 -->
