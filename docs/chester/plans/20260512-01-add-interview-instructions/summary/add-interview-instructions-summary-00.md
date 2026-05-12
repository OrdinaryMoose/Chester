# Session Summary: Add Interview Instructions — Session-Scoped Info-Packet Style Overlay

**Date:** 2026-05-12
**Session type:** Full-stack implementation (small-task design through execution)
**Plan:** `add-interview-instructions-plan-00.md`

## Goal

Add a session-scoped voice/style overlay capability to Chester's shared voice-rules authority (`util-design-partner-role`) so any interview-style skill that imports it can shape how information packets render during the conversation. The overlay loads a user-level Chester setting `info_packet_style` at interview start, presents the designer with a keep / adjust / default choice at the first-turn framing block, and accepts mid-session `instruction` directives that fully replace the active style. A special `instruction(save)` form persists the replacement back to `~/.claude/settings.chester.json` via a new helper script. The overlay shapes rendering only — verbosity, formatting, focus, voice flavor — and never modifies the interview's structural sequence, stage discipline, or MCP protocols.

## What Was Completed

### Design phase (design-small-task)

- Twelve key decisions reached in conversation and recorded in the brief: rule centralized in voice authority; firing site inside each interview skill's first-turn framing block; free-form prose body; keep/adjust/default mechanism; factory default `"bullet list, normal verbosity, Product Manager voice"` literal in `chester-config-read.sh` only; grammatically-anchored verbosity ladder (terse/normal/verbose); flexible-syntax `instruction` directive with `instruction(save)` as the only special form; voice-authority-wins composition with silent clamp; memory and overlay are independent layers; bootstrap-extension loading via env var; dedicated helper script for the persistence write; no archiving of active style.
- Design brief written to `design/add-interview-instructions-design-00.md` and stamped with `design-small-task@v0002`.

### Spec phase (design-specify)

- Two competing architects dispatched on opposite axes (rule centralization; instruction merge semantics — replace vs. accumulate); prior-art explorer dispatched in parallel. Hybrid recommendation built combining maximum centralization with replace semantics; designer chose the hybrid.
- 18 acceptance criteria written into the spec covering env-var emission, helper-script behavior, voice-authority section content, framing-step integration, directive protocol, composition rules, memory independence, and version bumps.
- Three reviews chained: fidelity (approved, advisory only), adversarial (3 MEDIUM findings — export count contradiction, wrong phase identifier, missing unconditional-read note — all fixed inline; spec revved to `-spec-01.md`), ground-truth (2 MEDIUM — skill-index file location, framing-block line range — fixed inline; 4 LOW carried forward).
- Spec at `spec/add-interview-instructions-spec-01.md` (revision); ground-truth report at `spec/add-interview-instructions-spec-ground-truth-report-00.md`.

### Plan phase (plan-build)

- 6-task plan written (2 code-producing for bash, 4 docs-producing for SKILL.md edits + skill-index sync) following the loop-optimized template.
- Plan review approved with 5 advisory recommendations (one wording fix applied).
- Plan hardening: smell-heuristic triggered on the word "persistence"; attacker + smeller dispatched in parallel. Five findings — 1 CRITICAL (pre-broken `test-stamping-design-large-task.sh` pinned at v0011, file at v0013), 1 HIGH (`test-stamping-design-small-task.sh` would break on Task 6 bump), 3 MEDIUM (export-idiom asymmetry without comment, line-number drift across insertions, Case 4 test bug binding HOME to eval instead of subprocess). All fixed inline in the plan (Task 5/Task 6 gained Step 3c re-pin instructions; Task 1 gained line-number caveat and inline-comment requirement; Case 4 fixed). Combined risk: Low after fixes.
- Plan at `plan/add-interview-instructions-plan-00.md`; threat report at `plan/add-interview-instructions-plan-threat-report-00.md`.
- Execution mode: subagent (heuristic recommended; user confirmed).

### Execution phase (execute-write, subagent mode)

Six tasks completed with per-task spec + quality reviews. Two issues caught and fixed inline during execution:

- **Task 1 quality finding (Critical, conf 93):** Case 4's `PATH="$stub_bin"` (empty stub) hid `git`, `head`, `sed` alongside `jq`. Script aborted at line 14; eval became a no-op; case4 false-passed by reading leftover state from case3. Fixed by building a stub PATH with symlinks for bash/git/head/sed and explicitly excluding jq, plus `unset CHESTER_INFO_PACKET_STYLE` defense-in-depth. Same commit: tightened the file's `# Exports:` header comment to list all five exports and corrected the test header count from "four" to "five".
- **Task 3 quality finding (Minor, conf 85):** Test tripwire `'composition'` was too broad — would pass even if the new `### Composition Rule` subsection vanished (because the file already contained "Composition Note" and "Composition with Translation Gate"). Tightened to pin specific H3 headings (`### Composition Rule`, etc.) and pinned skill-index check to the full phrase `'info-packet style overlay'`.

Full code review over `a064b42..4627782`: Ship. No findings at ≥ 80 confidence.

## Verification Results

| Check | Result |
|-------|--------|
| Full test suite (`for t in tests/test-*.sh`) | 54/54 passing, 0 failures |
| `tests/test-chester-config-read-info-packet-style.sh` | PASS — 5 cases (absent / custom / null / jq-unavailable / shell-special) |
| `tests/test-chester-style-write.sh` | PASS — 7 cases (AC-2.1 through AC-2.5 plus hairy-input) |
| `tests/test-partner-role-overlay-section.sh` | PASS — section + subsection + version + skill-index tripwires |
| `tests/test-info-packet-style-version-bumps.sh` | PASS — all four affected SKILL.md files at correct post-sprint versions |
| `tests/test-stamping-design-large-task.sh` | PASS (was pre-broken at v0011; re-pinned to v0014 by Task 5) |
| `tests/test-stamping-design-small-task.sh` | PASS (re-pinned to v0003 by Task 6 to match the new bump) |
| Working tree | clean |
| Checkpoint commit | `99eab78 checkpoint: execution complete` |

## Known Remaining Items

- **Out of scope, deferred to future sprint:** multi-voice selection layer (the overlay names "voice" as a forward axis but does not implement voice swapping); project-level overrides of `info_packet_style` (user-level only for now); auto-memory and overlay deep merger (currently independent layers, overlay wins for session, memory unchanged); style archiving in session-meta or design-brief artifacts (explicitly declined per Decision 12).
- **Manual-rehearsal acceptance criteria (AC-5.x, AC-6.x):** runtime behavior of `instruction` and `instruction(save)` directives, full-readout acknowledgment, composition clamp on voice-authority conflicts, memory-overlay precedence — not unit-testable in this repo by design (skill-prose behavior interpreted by an agent at runtime). Verified by manual rehearsal during the next interview session that touches these paths.
- **Root `CLAUDE.md` carries a stale pointer:** says the available-skills list lives in `setup-start/SKILL.md`, but the list actually moved to `setup-start/references/skill-index.md`. Both the original brief and the spec inherited the stale pointer; ground-truth review caught it; spec was corrected. The `CLAUDE.md` line itself was left as-is — out of scope cleanup for a future sprint.
- **Mirror-text duplication at N=2:** the handshake paragraph is byte-identical in `design-large-task/SKILL.md:264` and `design-small-task/SKILL.md:114`. Acceptable at two call sites; if a third interview skill is added, consider extracting to a shared block read from the voice authority rather than triple-pasting.

## Files Changed

**New:**
- `chester-util-config/chester-style-write.sh` — atomic merge helper for `info_packet_style` (jq --arg, mktemp + mv)
- `bin/chester-style-write` — self-resolving wrapper, forwards `"$@"`
- `tests/test-chester-config-read-info-packet-style.sh` — 5-case sandboxed env-var emit test
- `tests/test-chester-style-write.sh` — 7-case sandboxed write-path test
- `tests/test-partner-role-overlay-section.sh` — overlay section presence/tripwire test
- `tests/test-info-packet-style-version-bumps.sh` — cross-cutting version-bump assertion across the four affected SKILL.md files

**Modified:**
- `chester-util-config/chester-config-read.sh` — Insertions A/B/C/D: factory-default constant, unconditional user-config read in jq-available branch, factory-default fallback in jq-absent branch, `printf %q` emit with inline comment explaining the idiom asymmetry; `# Exports:` header updated to list all five exports
- `skills/util-design-partner-role/SKILL.md` — new "Info-Packet Style Overlay" section after Composition Note (lines 48-89); frontmatter description updated; version v0001 → v0002
- `skills/start-bootstrap/SKILL.md` — new `CHESTER_INFO_PACKET_STYLE` bullet in "What It Returns"; version v0001 → v0002
- `skills/design-large-task/SKILL.md` — new "Info-packet style handshake" paragraph in Phase 3 step 3 (line 264); version v0013 → v0014
- `skills/design-small-task/SKILL.md` — same handshake paragraph in Phase 3 step 1 (line 114, byte-identical to design-large-task's); version v0002 → v0003
- `skills/setup-start/references/skill-index.md` — `util-design-partner-role` entry updated to mention overlay capability
- `tests/test-stamping-design-large-task.sh` — re-pinned v0011 → v0014 (was pre-broken at sprint start)
- `tests/test-stamping-design-small-task.sh` — re-pinned v0002 → v0003 (would have broken on Task 6 bump)

## Commits

```
99eab78 checkpoint: execution complete
4627782 feat(design-small-task): add Phase 3 info-packet style handshake step
70bf537 feat(design-large-task): add Phase 3 info-packet style handshake step
e06a06f docs: document CHESTER_INFO_PACKET_STYLE in start-bootstrap
2307b85 test: tighten partner-role overlay tripwires
58fda69 feat: add info-packet style overlay section to util-design-partner-role
d5d934c feat: add chester-style-write helper and bin wrapper
ad043a4 fix: case4 false-pass in chester-config-read info-packet-style test
816d147 feat: emit CHESTER_INFO_PACKET_STYLE from chester-config-read
```

## Handoff Notes

- **The persistence path is invoked by skill prose, not by code.** The voice-authority section instructs the agent to call `chester-style-write "<new active style>"` when the designer issues `instruction(save) <directive>`. There is no caller in any executable file; the agent reads the directive, synthesizes the new style, and shells out. If the next session changes how directives are recognized (e.g., adds a second special form), the voice-authority section is the single place to update.
- **Pre-existing stamping-test pattern is a maintenance drag, not blocking.** Every time a skill version bumps for any reason, the corresponding `tests/test-stamping-<skill>.sh` pin must be manually updated. This sprint touched two of them; the broader pattern is unchanged. Worth a future cleanup (e.g., a programmatic version-discovery step) but out of scope.
- **The hardening gate paid for itself.** Plan-build's adversarial + smell reviews caught two execution-blocking issues (both stamping tests) and three correctness issues. Without the gate, Task 5 would have stopped mid-execution with no plan-level instruction to fix the pre-broken test, and Task 1 would have shipped a false-passing Case 4.
- **For interview-time manual rehearsal:** when the next session uses `design-large-task` or `design-small-task`, the first-turn framing should include the four moves (read env var, present three options, embed, activate directive protocol). The factory default `"bullet list, normal verbosity, Product Manager voice"` is what loads if no user setting exists. Try `instruction` mid-session to validate replace semantics with full-readout acknowledgment; try `instruction(save)` to validate persistence.

## Session Skill Versions

*(populated by `chester-trailer-write harvest`; see `util-artifact-schema` `## Provenance Trailers`)*

<!-- produced-by design-small-task@v0002 -->
<!-- produced-by design-specify@v0003 -->
<!-- produced-by plan-build@v0004 -->
<!-- produced-by finish-write-records@v0003 -->
