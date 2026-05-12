# Spec: Add Interview Instructions — Session-Scoped Info-Packet Style Overlay

**Sprint:** 20260512-01-add-interview-instructions
**Parent brief:** docs/chester/working/20260512-01-add-interview-instructions/design/add-interview-instructions-design-00.md
**Architecture:** Hybrid — rule and protocol centralized in `util-design-partner-role`; each interview skill carries a short concrete framing step naming the four moves; `instruction` directives use replace semantics with full-readout acknowledgment.

## Goal

Add a session-scoped info-packet style overlay to Chester's shared voice-rules authority so any interview-style skill that imports it (`design-large-task`, `design-small-task`, and future siblings) can shape how information packets render during the conversation. The overlay loads a user-level Chester setting `info_packet_style` at interview start via the existing `chester-config-read.sh` bootstrap-extension pattern, presents the active style to the designer with a keep / adjust / default choice at the first-turn framing block, and accepts mid-session `instruction` directives that fully replace the active style. A special `instruction(save)` form persists the replacement back to `~/.claude/settings.chester.json` via a new helper script. The overlay shapes rendering only — verbosity, formatting, focus, voice flavor — and never modifies the interview's structural sequence, stage discipline, or MCP protocols. This is the formatting layer in the future voice → formatting → translation-gate pipeline; multi-voice selection is explicitly out of scope.

## Components

### Modified files

- **`chester-util-config/chester-config-read.sh`** — extended to read `info_packet_style` from the user-level settings file and emit `CHESTER_INFO_PACKET_STYLE` as an additional `export` line alongside the four existing exports (`CHESTER_WORKING_DIR`, `CHESTER_PLANS_DIR`, `CHESTER_CONFIG_PATH`, `CHESTER_MAIN_ROOT`). Factory default literal `"bullet list, normal verbosity, Product Manager voice"` lives here and only here. Emit happens in both the `jq`-available and `jq`-absent branches so callers in degraded environments still see a non-empty value. The user-config read for `info_packet_style` runs unconditionally against `$USER_CONFIG` (when `jq` is available and the file exists), separate from the existing if/elif branching that selects which config file is authoritative for directory keys.
- **`skills/util-design-partner-role/SKILL.md`** — new section "Info-Packet Style Overlay" inserted after the Composition Note. Carries: the overlay contract (session-scoped rendering shape, distinct from the structural rules above it); the verbosity ladder (terse/normal/verbose, each defined grammatically by clause count, sentence type, and examples policy); the composition rule (voice authority wins on conflict; overlay silently clamped; agent announces only when the entire directive becomes a no-op); the memory independence rule (auto-memory feedback continues to apply; overlay wins for the session on conflict; memory entries are not modified); the directive protocol (intent-based recognition of `instruction`; `instruction(save)` as the only syntactically special form; replace semantics with full-readout acknowledgment); and the first-turn handshake mechanics referenced by interview skills. Version bump: `v0001` → `v0002`.
- **`skills/start-bootstrap/SKILL.md`** — "What It Returns" section gains a new bullet documenting `CHESTER_INFO_PACKET_STYLE`. Version bump: `v0001` → `v0002`.
- **`skills/design-large-task/SKILL.md`** — Phase 3 Round One Session Framing block (the framing sub-step is at lines 256-262 of the current file; Phase 3 itself begins at line 246) gains a short concrete framing step naming the four moves: read `CHESTER_INFO_PACKET_STYLE`, present the three-option choice to the designer, embed the resolved style into orientation, activate the directive protocol. The new step is inserted alongside or inside the existing step 3 ("Session Framing"), not in the Phase 3 preamble or in step 4 ("Active-flow framing additions"). Defers mechanics-detail to the voice authority's overlay section. Version bump: `v0013` → `v0014`.
- **`skills/design-small-task/SKILL.md`** — Phase 3 Session Framing block gains the same short concrete framing step (mirrors `design-large-task`). Version bump: `v0002` → `v0003`.
- **`skills/setup-start/references/skill-index.md`** — the per-skill descriptions referenced by setup-start's "available skills" guidance live here, not in `setup-start/SKILL.md` itself. The entry for `util-design-partner-role` is updated if its description changes to reflect the overlay capability; other entries are updated only if their descriptions change. (Note: root `CLAUDE.md` currently describes this list as living in `setup-start/SKILL.md`; that pointer is stale and may be corrected in a future cleanup, but is out of scope for this sprint.)

### New files

- **`chester-util-config/chester-style-write.sh`** — helper script taking a single argument (the new style text). Reads `~/.claude/settings.chester.json` (creates as `{}` if absent), merges `info_packet_style` via `jq --arg style "$1" '. + {info_packet_style: $style}'`, writes back atomically via temp-file + `mv`. Errors to stderr on empty argument, missing `jq`, or unwritable file. Uses `set -euo pipefail`. Follows the structural pattern of `chester-trailer-write.sh` and `write-session-metadata.sh`.
- **`bin/chester-style-write`** — three-line self-resolving wrapper matching the pattern of `bin/chester-config-read` and `bin/chester-trailer-write`: resolves `CHESTER_ROOT` from `SCRIPT_DIR`, execs `chester-util-config/chester-style-write.sh "$@"`.

## Data Flow

The active style flows through three stages, each at a distinct boundary.

**At interview start (session boundary).** `start-bootstrap` invokes `eval "$(chester-config-read)"`. The config-read script reads `info_packet_style` from `~/.claude/settings.chester.json` if present, otherwise emits the factory default literal. The resulting `CHESTER_INFO_PACKET_STYLE` env var is now in the agent's shell environment. The interview skill's first-turn framing step reads this env var and presents the value to the designer as the active style with three options (keep, adjust for this session, revert to factory default). The designer selects; the chosen value becomes the active style for the remainder of the session, held in agent working memory.

**Mid-session (turn boundary).** The directive protocol in the voice authority runs the agent's interpretation pass on every designer message. If the message reads as an `instruction` directive (intent recognition, flexible syntax — `instruction;`, `instruction:`, `instruction —`, or `instruction` followed by directive text), the agent synthesizes a new full active style string from prior active style plus directive intent, replaces the held string in working memory, and acknowledges with a full readout of the new active style so the designer can detect synthesis drift immediately. If the message contains the literal substring `instruction(save)`, the agent additionally invokes `chester-style-write "<new active style>"` to persist the replacement to the settings file.

**At rendering (per-information-packet boundary).** Every information packet the agent composes during the interview reads the active style from working memory and applies it to the rendering. The overlay sits above the voice authority's hard constraints (Translation Gate, read-aloud discipline, option-naming, externalized coverage, marker disciplines, stance principles): if any directive in the overlay would violate those constraints, the agent silently clamps that aspect of the overlay and renders the constraint-compliant version. Only when the entire directive collapses to a no-op does the agent announce the clamp.

## Error Handling

- **`jq` unavailable.** `chester-config-read.sh` falls back to the existing `jq`-absent branch, emitting the factory default for `CHESTER_INFO_PACKET_STYLE` so callers never see an empty value.
- **`info_packet_style` key absent from settings file.** `chester-config-read.sh` emits the factory default via the same fallback path the existing config keys use.
- **`info_packet_style` key present but null or empty string.** Treated as absent — factory default emitted.
- **Single-quote characters in the style string.** `chester-config-read.sh` escapes single quotes in the emitted `export VAR='...'` line so the resulting `eval` does not break (same constraint as the existing `CHESTER_WORKING_DIR` and `CHESTER_PLANS_DIR` exports — but the existing exports do not contain user-provided strings, so the new export introduces a quoting concern the existing code does not face).
- **`chester-style-write` invoked with no argument or empty argument.** Helper exits non-zero with a usage error to stderr.
- **`chester-style-write` invoked when `~/.claude/settings.chester.json` does not exist.** Helper creates the file as `{}` first, then merges. No error.
- **`chester-style-write` invoked when settings file exists but is unreadable or unwritable.** Helper exits non-zero with a diagnostic to stderr.
- **`chester-style-write` invoked when `jq` is unavailable.** Helper exits non-zero with a diagnostic to stderr (the write path requires `jq` for argument-binding safety).
- **Designer issues `instruction` directive that fully conflicts with voice authority (full no-op clamp).** Agent announces the clamp in plain prose at the next packet, identifying which authority rule the directive violated and explaining that the directive did not land.
- **Designer issues `instruction(save)` and the helper invocation fails.** Agent reports the failure to the designer in plain prose and does not silently swallow the error; the active style for the session is still updated even though persistence failed.

## Testing Strategy

Chester's existing test convention is self-contained bash scripts under `tests/` (one per behavior). The spec calls for three new tests:

- **`tests/test-chester-config-read-info-packet-style.sh`** — verifies the four cases: setting absent, setting present, setting null, `jq` unavailable. Each case asserts the value of `CHESTER_INFO_PACKET_STYLE` after `eval "$(chester-config-read)"`.
- **`tests/test-chester-style-write.sh`** — verifies: write to absent file (creates file as `{}` first, then merges); write to file with other keys (preserves other keys); write with empty argument fails; round-trip — write then config-read returns the written value; write a value containing single quotes, double quotes, ampersands, and parentheses (jq argument-binding safety).
- **`tests/test-info-packet-style-version-bumps.sh`** — verifies that the `version` field has been bumped on all four affected SKILL.md files (`util-design-partner-role`, `start-bootstrap`, `design-large-task`, `design-small-task`).

Interview-time behavior (directive recognition, replace semantics, full-readout acknowledgment, composition clamp) is not unit-testable in this repo because it is skill-prose behavior interpreted by an agent at runtime. It is verified at acceptance time by manual interview rehearsal. The spec acknowledges this and the AC blocks for those behaviors specify observable boundaries the designer can verify in a real session.

## Constraints

- **Single source of truth for the factory default literal.** The literal `"bullet list, normal verbosity, Product Manager voice"` exists in exactly one place: `chester-util-config/chester-config-read.sh`. SKILL.md prose refers to it as "the factory default" or "the factory default defined in `chester-config-read.sh`" and never restates the string.
- **Single source of truth for the rule.** The voice-rules authority (`util-design-partner-role`) owns the overlay contract, the verbosity ladder, the composition rules, the memory-independence rule, and the directive protocol. Interview skills do not duplicate any rule prose; their framing steps name the four moves and defer to the authority for mechanics.
- **Backwards compatibility on `chester-config-read.sh`.** The new export is additive. Existing callers that do not consume `CHESTER_INFO_PACKET_STYLE` are unaffected. The existing three exports (`CHESTER_WORKING_DIR`, `CHESTER_PLANS_DIR`, `CHESTER_CONFIG_PATH`, `CHESTER_MAIN_ROOT`) are unchanged.
- **User-level authority only.** `info_packet_style` is read only from the user-level `~/.claude/settings.chester.json`, never from the project-level `.claude/settings.chester.local.json`. This mirrors the inverse split of the existing directory keys (which are project-level only). Implementation note: the read for `info_packet_style` runs unconditionally against `$USER_CONFIG` when `jq` is available and the file exists, independent of which config file `chester-config-read.sh` selects as the directory-key authority. The existing if/elif structure (lines 29-43 of the current script) chooses between project and user config for *directory* keys only — `info_packet_style` is a peer concern with its own read path.
- **`instruction(save)` is the only file-modifying directive.** All other `instruction` forms update working memory only. The settings file is written only when the literal substring `instruction(save)` is present in the directive.
- **`jq` argument binding required.** `chester-style-write.sh` must use `jq --arg` for the style string. Inline string interpolation is prohibited because the style is free-form prose and may contain special characters.
- **Shell-quoting safety in the env-var export.** `chester-config-read.sh` must emit the export line in a form that survives `eval`. Single quotes in the user's style string must be escaped or the export wrapped to avoid breaking the surrounding `eval`.
- **No structural changes to interview skills.** The new framing step is additive within the existing Round One / Phase 3 framing block. Stage transitions, MCP protocols, Round One discipline, and the conversation loop are untouched.
- **No archiving.** Session-meta files, design briefs, specs, plans, and summaries do not record the overlay state at any point. Style is session-ephemeral; persistence happens only through `instruction(save)` writing to the user settings file.

## Non-Goals

- **Multi-voice selection.** The overlay contract names "voice" as a forward axis (the future voice → formatting → translation-gate pipeline), but voice swapping is not implemented in this sprint. The factory default names "Product Manager voice" by reference to the existing PM litmus test in the voice authority.
- **Project-level overrides of `info_packet_style`.** User-level only for now.
- **Structured fields for the setting body.** The setting value is free-form prose. No schema, no validation, no expressible-property enumeration. The verbosity ladder is grammatical but applies to interpretation, not to the storage format.
- **Auto-memory and overlay merger.** Memory entries continue to apply as cross-session persistent rules; the overlay applies for the session only; overlay wins for the session on conflict; memory entries are not modified. Deeper merger (classifying which memory entries are rendering-shaped versus behavioral) is deferred until friction motivates it.
- **Style archiving in session-meta or design-brief artifacts.** Explicitly declined per Decision 12 of the design brief.
- **Validation of `instruction` directive prose.** The agent recognizes intent and synthesizes a replacement style; no schema checks the user's directive content.
- **Changes to non-interview skills.** `execute-write`, `plan-build`, `finish-write-records`, and other non-interview skills do not consume `CHESTER_INFO_PACKET_STYLE`. The env var is exported unconditionally; non-interview callers simply ignore it.

## Acceptance Criteria

### AC-1.1 — `chester-config-read` emits factory default when setting absent

**Observable boundary:**
- `chester-config-read` invoked with `~/.claude/settings.chester.json` either absent or present-without-`info_packet_style` → stdout includes `export CHESTER_INFO_PACKET_STYLE='bullet list, normal verbosity, Product Manager voice'`
- After `eval "$(chester-config-read)"`, `$CHESTER_INFO_PACKET_STYLE` is the factory default literal

**Given:** `~/.claude/settings.chester.json` does not contain the `info_packet_style` key (or the file does not exist)
**When:** `chester-config-read` is invoked
**Then:** stdout contains a fourth `export` line for `CHESTER_INFO_PACKET_STYLE` carrying the factory default literal

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-1.2 — `chester-config-read` emits user-set value when setting present

**Observable boundary:**
- `~/.claude/settings.chester.json` contains `"info_packet_style": "<custom value>"` → `chester-config-read` stdout includes `export CHESTER_INFO_PACKET_STYLE='<custom value>'`
- Other emitted exports (`CHESTER_WORKING_DIR`, `CHESTER_PLANS_DIR`, `CHESTER_CONFIG_PATH`, `CHESTER_MAIN_ROOT`) are unchanged from their existing behavior

**Given:** `~/.claude/settings.chester.json` exists and contains `info_packet_style` set to an arbitrary prose string
**When:** `chester-config-read` is invoked
**Then:** the `CHESTER_INFO_PACKET_STYLE` export reflects the user-set value verbatim, and the existing four exports are emitted exactly as before

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-1.3 — `chester-config-read` emits factory default when `jq` unavailable

**Observable boundary:**
- `chester-config-read` invoked in a shell where `jq` is not on `PATH` → stdout includes `export CHESTER_INFO_PACKET_STYLE='<factory default>'` even though the script's `jq`-absent branch handles the existing config keys via defaults
- `CHESTER_CONFIG_PATH` is `none` (existing behavior unchanged)

**Given:** `jq` is not available on `PATH`
**When:** `chester-config-read` is invoked
**Then:** the factory-default `CHESTER_INFO_PACKET_STYLE` export is emitted alongside the existing default-path exports

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-1.4 — Style values containing shell-special characters survive `eval`

**Observable boundary:**
- `info_packet_style` set to a string containing single quotes, double quotes, ampersands, parentheses, or backslashes → `eval "$(chester-config-read)"` exits zero and `$CHESTER_INFO_PACKET_STYLE` matches the input string

**Given:** `~/.claude/settings.chester.json` contains `info_packet_style` with shell-special characters (at minimum: single quote, double quote, backslash)
**When:** `eval "$(chester-config-read)"` runs in a bash shell
**Then:** the eval succeeds and the env var equals the input value

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-2.1 — `chester-style-write` updates settings file with new value

**Observable boundary:**
- `chester-style-write "<new value>"` invoked → `~/.claude/settings.chester.json` contains `"info_packet_style": "<new value>"` after the call
- Other keys in the settings file are unchanged (verified by diff before/after on a file with `working_dir` and other pre-existing keys present)

**Given:** `~/.claude/settings.chester.json` exists with arbitrary content (with or without prior `info_packet_style`)
**When:** `chester-style-write "<new value>"` is invoked
**Then:** the file contains `info_packet_style` set to `<new value>`; all other keys retain their prior values

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-2.2 — `chester-style-write` creates settings file when absent

**Observable boundary:**
- `chester-style-write "<value>"` invoked with `~/.claude/settings.chester.json` absent → file is created containing `{"info_packet_style": "<value>"}`

**Given:** `~/.claude/settings.chester.json` does not exist
**When:** `chester-style-write "<value>"` is invoked
**Then:** the file is created with the single key `info_packet_style` set to `<value>`

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-2.3 — `chester-style-write` fails cleanly on bad input

**Observable boundary:**
- `chester-style-write` invoked with no argument or empty argument → exit code nonzero, diagnostic message to stderr, settings file unchanged
- `chester-style-write` invoked when `jq` is absent → exit code nonzero, diagnostic message to stderr, settings file unchanged

**Given:** invocation with empty argument, or environment with `jq` absent
**When:** `chester-style-write` is invoked
**Then:** exit code is nonzero, a single-line diagnostic appears on stderr, and `~/.claude/settings.chester.json` is unchanged

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-2.4 — `chester-style-write` round-trips with `chester-config-read`

**Observable boundary:**
- After `chester-style-write "<value>"`, running `chester-config-read` and `eval`-ing its output yields `$CHESTER_INFO_PACKET_STYLE == "<value>"`

**Given:** any value written via `chester-style-write`
**When:** `chester-config-read` is invoked next and its output is `eval`-ed
**Then:** `CHESTER_INFO_PACKET_STYLE` equals the value just written

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-2.5 — `bin/chester-style-write` wrapper exposes the helper on PATH

**Observable boundary:**
- `chester-style-write` is invocable by short name from any directory in a shell where the Chester plugin is loaded
- The wrapper resolves to `chester-util-config/chester-style-write.sh` and forwards all arguments verbatim

**Given:** a shell with the Chester plugin loaded (Chester's `bin/` on PATH)
**When:** `chester-style-write "<value>"` is invoked from any working directory
**Then:** the helper script executes with the given argument and produces the AC-2.1 outcome

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-3.1 — Voice authority contains the "Info-Packet Style Overlay" section

**Observable boundary:**
- `skills/util-design-partner-role/SKILL.md` contains a new top-level section heading "Info-Packet Style Overlay" inserted after the Composition Note section
- The section's prose covers the five contract pieces (overlay definition, verbosity ladder, composition rule, memory-independence rule, directive protocol)
- The section names the factory default by reference ("the factory default defined in `chester-config-read.sh`") and does not restate the literal string

**Given:** the spec is implemented
**When:** a reader opens `skills/util-design-partner-role/SKILL.md`
**Then:** the new section is present in the documented position with all five contract pieces and the by-reference factory-default name

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-3.2 — Verbosity ladder is grammatically anchored

**Observable boundary:**
- The Info-Packet Style Overlay section defines three verbosity levels — terse, normal, verbose — each in terms of clause count, sentence type (simple / complex / compound-complex), and examples policy
- The definitions match the verbosity ladder specified in Key Decision 6 of the design brief

**Given:** the new section is written
**When:** a reader looks for the verbosity ladder
**Then:** terse, normal, and verbose are each defined with the grammatical anchors specified in the brief (simple sentences only at terse; mixed simple/complex with at most one subordinate clause at normal; complex and compound-complex with multiple subordinate clauses at verbose; one bullet per sentence at terse, one-to-two at normal, two-to-four at verbose; no examples at terse, examples where load-bearing at normal, asides and multi-example illustration at verbose)

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-3.3 — Composition rule specifies silent clamp with announced full-no-op

**Observable boundary:**
- The Info-Packet Style Overlay section's composition rule states: voice authority constraints win on conflict; overlay is silently clamped where it conflicts with an authority rule; the agent announces a clamp only when the entire directive becomes a no-op under the voice rules

**Given:** the new section is written
**When:** a reader looks at the composition rule
**Then:** the silent-clamp + announce-on-full-no-op behavior is specified explicitly

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-3.4 — Memory-independence rule specifies overlay-wins-for-session

**Observable boundary:**
- The Info-Packet Style Overlay section's memory rule states: auto-memory feedback entries continue to apply during interview sessions; on conflict between an overlay directive and a memory entry, the overlay wins for the session; memory entries are not modified by overlay directives

**Given:** the new section is written
**When:** a reader looks at the memory rule
**Then:** the three statements above are explicit and unambiguous

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-3.5 — Directive protocol specifies replace semantics with full readout

**Observable boundary:**
- The Info-Packet Style Overlay section's directive protocol states: the keyword `instruction` is recognized by intent and flexible syntax (semicolons, colons, em-dashes, or following whitespace all valid); only `instruction(save)` is special-cased and triggers persistence; every directive produces a full new active style via synthesis, replacing the prior style in working memory; the agent acknowledges with a full readout of the new active style after every directive

**Given:** the new section is written
**When:** a reader looks at the directive protocol
**Then:** intent recognition, the `instruction(save)` special form, replace semantics, and full-readout acknowledgment are all specified

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-4.1 — `design-large-task` framing block includes the four moves

**Observable boundary:**
- `skills/design-large-task/SKILL.md` Phase 3 Round One Session Framing block contains a new step naming the four moves: read `CHESTER_INFO_PACKET_STYLE`, present the three-option choice (keep / adjust for session / revert to factory default), embed the resolved style into orientation, activate the directive protocol
- The step does not restate the mechanics; it refers to the overlay handshake defined in `util-design-partner-role`

**Given:** the spec is implemented
**When:** a reader opens `skills/design-large-task/SKILL.md` and locates the Phase 3 Round One Session Framing block
**Then:** a new step is present naming the four moves and pointing to the voice authority's overlay section

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-4.2 — `design-small-task` framing block includes the same four moves

**Observable boundary:**
- `skills/design-small-task/SKILL.md` Phase 3 Session Framing block contains the same new step, mirroring the placement and wording of `design-large-task`'s step
- The step does not restate the mechanics; it refers to the same overlay handshake defined in `util-design-partner-role`

**Given:** the spec is implemented
**When:** a reader opens `skills/design-small-task/SKILL.md` and locates the Phase 3 Session Framing block
**Then:** the same step is present in the same structural position

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-4.3 — Both framing steps consume `CHESTER_INFO_PACKET_STYLE` via bootstrap

**Observable boundary:**
- Neither interview skill reads `~/.claude/settings.chester.json` directly
- Both interview skills' framing steps reference the env var `CHESTER_INFO_PACKET_STYLE` and rely on bootstrap having exported it

**Given:** the spec is implemented
**When:** a reader checks how the active style enters each interview skill
**Then:** the only entry path is the env var; no direct file reads exist in either skill's framing step

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-5.1 — Designer can issue a free-form `instruction` directive mid-session and the active style updates

**Observable boundary (manual rehearsal):**
- In an interview session, after the active style is loaded, the designer issues a message containing `instruction` followed by directive prose
- The agent acknowledges with a full readout of the new active style
- Subsequent information packets render in the new style

**Given:** an active interview session with a loaded active style
**When:** the designer issues `instruction <directive prose>` (in any flexible syntax — `instruction;`, `instruction:`, `instruction —`, or `instruction <text>`)
**Then:** the agent acknowledges with the full new active style readout and renders subsequent packets in the new style

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-5.2 — `instruction(save)` persists the new style to the settings file

**Observable boundary (manual rehearsal + file check):**
- Designer issues `instruction(save) <directive>` during an interview session
- The agent invokes `chester-style-write` with the new active style string
- `~/.claude/settings.chester.json` reflects the new value after the call
- A subsequent session starts with the new value as its loaded active style

**Given:** an active interview session
**When:** the designer issues a message containing the literal substring `instruction(save)` followed by directive prose
**Then:** the active style updates for the current session AND is written to the settings file via `chester-style-write`; the next session's bootstrap loads the new value

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-5.3 — Replace semantics — each directive produces a single new full style

**Observable boundary (manual rehearsal):**
- The agent does not maintain a stack of layered adjustments
- After two sequential `instruction` directives, the active style is the result of the second directive, not an accumulation
- The agent's full-readout acknowledgment after the second directive shows the complete synthesized style, not a delta

**Given:** an active interview session
**When:** the designer issues two sequential `instruction` directives
**Then:** the active style after the second is a single coherent prose string produced by synthesis; no layered history is referenced or visible

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-6.1 — Voice authority hard constraints win on conflict

**Observable boundary (manual rehearsal):**
- Designer issues an `instruction` directive that would violate a Translation Gate, read-aloud, option-naming, externalized-coverage, marker, or stance-principle rule
- Agent's subsequent information packets continue to honor the voice authority rule, not the conflicting directive aspect
- If the directive collapses to a complete no-op, the agent announces the clamp in plain prose at the next packet

**Given:** an active interview session with a directive that conflicts with a voice authority rule
**When:** the agent composes the next information packet
**Then:** the authority rule is honored and the conflicting overlay aspect is silently clamped; full no-ops are announced

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-6.2 — Auto-memory entries continue to apply; overlay wins for session

**Observable boundary (manual rehearsal):**
- An auto-memory feedback entry exists that bears on rendering (e.g., "use bulleted lists, not paragraphs")
- The designer issues an overlay directive that conflicts with the memory entry (e.g., "switch to paragraph form for this session")
- The agent applies the overlay for the remainder of the session
- The memory entry remains in `~/.claude/projects/.../memory/` unchanged

**Given:** an active interview session and a conflicting auto-memory entry
**When:** the designer issues an overlay directive in conflict
**Then:** subsequent packets reflect the overlay (not the memory rule), and the memory file is unmodified

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-7.1 — Version bumps on all changed SKILL.md files

**Observable boundary:**
- `skills/util-design-partner-role/SKILL.md` `version` field is bumped (from `v0001` to `v0002`)
- `skills/start-bootstrap/SKILL.md` `version` field is bumped (from `v0001` to `v0002`)
- `skills/design-large-task/SKILL.md` `version` field is bumped (from `v0013` to `v0014`)
- `skills/design-small-task/SKILL.md` `version` field is bumped (from `v0002` to `v0003`)

**Given:** the spec is implemented and the four SKILL.md files have behavior changes
**When:** the version fields are inspected
**Then:** every changed file's version is one step above the value present at sprint start

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-7.2 — `setup-start/references/skill-index.md` reflects any description changes

**Observable boundary:**
- If any of the four affected skills' `description` frontmatter changes, the corresponding entry in `skills/setup-start/references/skill-index.md` is updated to match
- If no descriptions change, no update is required

**Given:** the spec is implemented
**When:** the descriptions of the four affected skills are compared to their entries in `setup-start/references/skill-index.md`
**Then:** every entry matches its skill's current description

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-7.3 — `start-bootstrap` documents the new env var in "What It Returns"

**Observable boundary:**
- `skills/start-bootstrap/SKILL.md`'s "What It Returns" section lists `CHESTER_INFO_PACKET_STYLE` alongside the existing entries (`CHESTER_WORKING_DIR`, `CHESTER_PLANS_DIR`, etc.)
- The bullet describes the value as the active info-packet style string from user settings or factory default

**Given:** the spec is implemented
**When:** a reader opens `start-bootstrap/SKILL.md` and locates "What It Returns"
**Then:** `CHESTER_INFO_PACKET_STYLE` appears as a peer entry with the described meaning

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

<!-- created-at: 2026-05-12T15:26:36Z -->
<!-- produced-by design-specify@v0003 -->
