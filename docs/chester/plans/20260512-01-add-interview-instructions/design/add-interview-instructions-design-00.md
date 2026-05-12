# Add Interview Instructions — Design Brief

## Goal

Extend Chester's shared voice-rules authority with a session-scoped overlay capability
that lets the designer shape how information packets render during any interview-style
conversation. A persistent default style loads at interview start from a Chester setting;
the designer is presented with the active style at the first-turn framing block and may
keep it, adjust it for the session, or revert to the factory default. Mid-session,
the designer can issue an `instruction` directive to update the overlay for the
remainder of the session, with a special `instruction(save)` form that persists the
update back to the settings file. The overlay shapes rendering only — verbosity,
formatting, focus, voice flavor — and never modifies the interview's overarching
agenda (Round One discipline, stage transitions, MCP protocols, structural sequence).
This is the formatting layer in a future voice → formatting → translation-gate
pipeline; multi-voice selection is out of scope for this sprint.

## Prior Art

The shared voice-rules authority already centralizes voice discipline for both
interview-style skills (the deep-design conversation and the small-task conversation):
the Interpreter Frame, read-aloud discipline, option-naming rule, externalized-coverage
and marker disciplines, and stance principles all live there, imported by both skills
to prevent drift. No prior session-style overlay mechanism exists anywhere in the
skill set — confirmed by exhaustive grep. Two existing Chester precedents inform
this design: small bash helpers under `chester-util-config/` already handle every
settings-file read/write operation in the system (`chester-config-read.sh`,
`write-session-metadata.sh`), with `bin/` wrappers exposing them by short name;
and `start-bootstrap` already exports env vars from the settings file
(`CHESTER_WORKING_DIR`, `CHESTER_PLANS_DIR`) which downstream skills consume. The
"Product Manager voice" target in the factory default refers to the existing PM
litmus test already documented in the voice-rules authority — the overlay default
names a target the agent can already orient against.

## Scope

**In scope:**

- New section in `util-design-partner-role` defining the info-packet style overlay:
  what it is, the verbosity ladder, composition rules, memory composition rule, and
  the `instruction` / `instruction(save)` directive protocol.
- Extension of `chester-config-read.sh` to read the `info_packet_style` key from
  the user-level Chester settings file and emit it as the `CHESTER_INFO_PACKET_STYLE`
  environment variable, falling back to the factory default when the setting is absent.
- Update to `start-bootstrap/SKILL.md` documenting the new env var in its "What It
  Returns" section.
- New step inside `design-large-task/SKILL.md` Round One framing block: load the
  active style from the env var, present to designer as keep / adjust / default,
  embed into orientation.
- New step inside `design-small-task/SKILL.md` Phase 3 framing block: same load,
  same present, same embed.
- New helper script `chester-util-config/chester-style-write.sh` plus
  `bin/chester-style-write` wrapper for the `instruction(save)` write path.
- Version bumps on every SKILL.md whose behavior changes
  (`util-design-partner-role`, `start-bootstrap`, `design-large-task`,
  `design-small-task`).
- Setup-start skill's available-skills list updated if any description changes.

**Out of scope:**

- Multi-voice selection layer (future scope — the overlay's contract names "voice"
  as a forward axis but does not implement voice swapping).
- Project-level overrides of `info_packet_style` — user-level only for now.
- Archiving the active style into session-meta or design-brief artifacts —
  explicitly declined; no retrospective traceability for style state.
- Deep merger between auto-memory feedback entries and the overlay — independent
  layers; deferred until friction motivates closer integration.
- Changes to `execute-write` or any non-interview pipeline skill — bootstrap
  exports the env var unconditionally; non-interview callers simply ignore it.
- Validation or schema for the free-form style string — the overlay accepts any
  prose; the voice authority enforces hard constraints.

## Key Decisions

1. **The rule lives in the shared voice-rules authority; both interview shapes
   inherit by import.** This matches the existing precedent — voice discipline
   was deliberately centralized there to prevent drift between skills. Alternative
   considered: per-skill rules duplicated in each interview SKILL. Rejected: the
   centralization already exists for exactly this reason.

2. **Firing site is inside each interview skill's first-turn framing block, not
   pre-opener.** Both interview shapes already have a framing block as their
   first designer-visible work; the style prompt embeds naturally there. One
   uniform prompt shape across both shapes; agent chooses exact phrasing.
   Alternative considered: pre-opener step in bootstrap. Rejected because
   bootstrap is shared with non-interview callers, and pre-opener placement
   would create a separate phase the interview skills currently don't have.

3. **Setting body shape is free-form prose, not structured fields.** Free-form
   accepts arbitrary composition rules (e.g., "use bulleted lists with two-to-four
   sentence bullets") that no upfront schema would express cleanly. Alternative
   considered: structured fields (verbosity / format / focus / notes). Rejected
   because structured schemas date faster than free-form and pre-decide what's
   expressible. Mitigation for free-form drift risk: designer can issue
   mid-session `instruction` directives whenever the agent's interpretation drifts.

4. **Default loads at interview start from a Chester setting; designer chooses
   keep / adjust / default.** The mechanism is always-on rather than optional —
   a default always applies. Setting key: `info_packet_style`. Location: user-level
   `~/.claude/settings.chester.json`, matching existing Chester precedent.

5. **Factory default: "bullet list, normal verbosity, Product Manager voice."**
   Names the existing PM litmus test as the orientation target. "Normal verbosity"
   is anchored in the grammatical verbosity ladder defined in the authority.

6. **Verbosity ladder anchored in grammatical definitions.** Terse: simple
   sentences only, one independent clause each, one sentence per bullet, no
   examples. Normal: simple and complex sentences mixed, at most one subordinate
   clause per sentence, one-to-two sentences per bullet, examples where load-bearing.
   Verbose: complex and compound-complex sentences with multiple subordinate
   clauses, two-to-four sentences per bullet, asides and multi-example illustration
   permitted. Alternative considered: word-count anchors. Rejected because clause
   structure translates more reliably into bullet-packet rules than raw word count.

7. **Mid-session directive uses the keyword `instruction` with flexible syntax.**
   The agent recognizes intent rather than parsing strict syntax — `instruction;`,
   `instruction:`, `instruction —`, or `instruction` followed by directive text
   all work as long as designer intent reads as a directive (not a one-off
   request). Only `instruction(save)` is special-cased syntactically — it triggers
   the persistence write path. Everything else is plain prompt and treated normally.
   Alternative considered: `Assumption;` / `Opinion;` marker-style strict parsing.
   Rejected because directives are categorically different from markers (designer
   steering agent vs agent labeling its own claims).

8. **Composition: voice authority wins on conflict, overlay silently clamped.**
   The voice-rules authority (Translation Gate, read-aloud discipline, option-naming,
   externalized coverage, marker discipline, stance principles) is hard-constraint;
   the overlay sits above and is silently clamped where it conflicts. Agent
   announces a clamp only when the entire directive becomes a no-op, so the designer
   knows the directive did not land. Otherwise, conformance is quiet. Alternative
   considered: flag every clamp. Rejected because loud announcement would turn
   every minor tweak into a rules-lawyer exchange.

9. **Memory and overlay are independent layers; overlay wins for the session on
   conflict.** Auto-memory feedback entries continue to apply as cross-session
   persistent rules. The overlay is current-session. On conflict, the more-recent
   and more-local signal (overlay) wins for the session, but memory entries are
   not modified. Removing a memory entry remains a separate explicit operation
   via the existing memory-management workflow. Alternative considered: auto-merge
   feedback memory into the loaded default. Rejected because classifying which
   memory entries are rendering-shaped versus behavioral is judgment work without
   a clear rule; deferred until friction motivates it.

10. **Loading mechanics: bootstrap-extension pattern.**
    `chester-config-read.sh` reads `info_packet_style` from the user-level settings
    file and emits `CHESTER_INFO_PACKET_STYLE`; if absent, emits the factory default
    so downstream code never sees an empty value. `start-bootstrap/SKILL.md`
    documents the new env var. Interview skills consume it at first-turn framing.
    Alternative considered: interview skills read the settings file directly.
    Rejected because bootstrap-extension matches existing Chester precedent —
    every config concern flows through `chester-config-read.sh`.

11. **Persistence write path: dedicated helper script `chester-style-write.sh`,
    invoked from the interview skill on `instruction(save)`.** Takes the new style
    text as an argument; reads the user-level settings JSON, merges in the
    `info_packet_style` key, writes back. Wrapper at `bin/chester-style-write`
    exposes it by short name. Alternative considered: inline JSON manipulation
    via Bash in the SKILL.md prose. Rejected on three axes — precedent match
    (every other settings write in Chester is a small helper), robustness
    (JSON manipulation in shell is easier to harden than prose-reconstructed
    commands), and evolution (one file changes if the settings format changes,
    not every skill).

12. **No archiving of active style.** Session-meta and design-brief artifacts
    do not record the overlay state at session start or after adjustments.
    Retrospective traceability of style is explicitly declined; the cost of
    archiving is small but the benefit was not motivating enough.

## Constraints

- The overlay must not modify any interview skill's structural sequence,
  Round One discipline, stage transitions, MCP protocols, or any contract
  the voice authority does not already enable.
- The voice-rules authority remains the single source of truth — interview
  skills consume the rule by import, not by duplication.
- `chester-config-read.sh` must remain backwards-compatible: callers that
  don't care about the new env var continue to work unchanged.
- The factory default fallback in `chester-config-read.sh` is the only place
  the literal default string lives; SKILL prose refers to it by reference,
  not by re-stating.
- The `instruction(save)` write path is the only file-modifying operation
  triggered by an in-session directive; all other directives are
  conversation-scoped only.
- Free-form setting value must survive standard shell quoting in the env-var
  export and in the helper-script invocation; the helper script must use
  `jq` argument-binding to avoid injection issues with special characters.

## Acceptance Criteria

- Reading `chester-config-read` in a shell with no `info_packet_style` set
  returns the factory default in `CHESTER_INFO_PACKET_STYLE`.
- Setting `info_packet_style` in the user-level Chester settings file and
  re-running `chester-config-read` reflects the new value in the env var.
- Invoking `chester-style-write "<new text>"` updates the user-level settings
  file with the new value and leaves other keys unchanged; re-running
  `chester-config-read` reflects the update.
- The voice-rules authority contains a new section defining the overlay,
  the verbosity ladder, the composition rules, the memory-overlay independence,
  and the directive protocol.
- Both interview skills' first-turn framing blocks contain a step that loads
  `CHESTER_INFO_PACKET_STYLE`, presents the active style to the designer with
  keep / adjust / default options, and embeds the resolved style into the
  framing.
- During an interview session, the designer can issue `instruction <directive>`
  in any conversational form and the agent updates the active overlay for the
  session, acknowledging with the new active-style readout.
- During an interview session, the designer can issue `instruction(save) <directive>`
  and the user-level settings file is updated; subsequent sessions load the
  new default.
- A directive that conflicts with the voice-rules authority is silently clamped
  in agent output; the agent announces only when the directive becomes a complete
  no-op under the voice rules.
- Auto-memory feedback entries continue to apply during interview sessions
  alongside the overlay; an overlay directive that conflicts with a memory
  entry wins for the session and does not modify the memory entry.
- Every SKILL.md whose behavior changes has its `version` field bumped.
- `setup-start/SKILL.md` available-skills list reflects any description
  changes to the affected skills.

<!-- created-at: 2026-05-12T14:00:30Z -->
<!-- produced-by design-small-task@v0002 -->
