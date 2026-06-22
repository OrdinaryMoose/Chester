# HANDOFF — FixStart sprint, post-round05, pre-final-plan

**Written:** 2026-06-06. **Purpose:** resume after compaction. Read this first, then the files it points to.

## Where we are (one line)

Spec is DONE and finalized (Option B). Plan went through committee round04 (build) + round05
(attack) + named `plan-attacker`/`plan-smeller`. **Blocked on ONE designer decision** before the
final plan can be written: amend spec §4 (heredoc → runtime extraction) or keep heredoc as spec'd.

## The sprint arc (context)

- Sprint: `20260604-02-review-start-context` (session "FixStart"). Standalone, no master plan.
- Subject: token-frugal Chester start sequence. SessionStart hook injects full `setup-start/SKILL.md`
  body (~2,014 tok) on every `startup|clear|compact`; compaction re-pays it though only the
  behavioral mandate decays. Fix: trigger-split — full body on startup/clear, mandate-only stub on
  compact; first-run wizard gated off established projects.
- Design was ADJUDICATED before this session (Option 1, 2026-06-04) — see
  `design/committee-analysis-01.md`.
- This session ran the committee in an unusual mode at designer direction: committee DEVELOPED +
  ATTACKED the spec (rounds 02-03) and the plan (rounds 04-05). Crosses the committee's normal
  "don't convene when design-specify/plan-build own planning" contract — by explicit user
  instruction. THIS PROCESS IS TO BE CAPTURED at end of plan-build (see memory
  `project_committee_spec_plan_capture.md`) as a candidate Chester skill update — designer review
  BEFORE any skill edits.

## Committee round ledger (all on disk)

- round01 — validate adjudicated design vs 40 landed commits → 5-0 design HOLDS. One side-finding:
  stale `skill-index.md` catalog line → FIXED + committed `0e79b85` this session.
- round02 — DEVELOP spec → `committee/round02/draft-spec.md` + consolidator-output.
- round03 — ATTACK spec → flips: Option B chosen (designer, 2026-06-06). Spec finalized.
- round04 — BUILD plan → `committee/round04/draft-plan.md` + consolidator-output.
- round05 — ATTACK plan → `committee/round05/` (5 committee transcripts + researcher-findings +
  plan-attacker-findings + plan-smeller-findings + consolidator-output).
- Cross-round ledger: `committee/ledger.md`.

## Key artifacts

- **Spec (FINAL, Option B):** `spec/20260604-02-review-start-context-spec-00.md` — status "Ready
  for plan-build". The §4 amendment decision below would edit this.
- **Draft plan (attack target):** `committee/round04/draft-plan.md`.
- **Round05 attack record:** `committee/round05/consolidator-output.md` (full enumeration of all 7
  sources), `plan-attacker-findings.md`, `plan-smeller-findings.md`.

## THE PENDING DECISION (designer owns it — do not proceed without it)

**Amend spec §4: heredoc → runtime extraction?** Recommended: YES.

- Current spec §4: compact stub is a ~57-line verbatim COPY of the 8 mandate blocks living in
  `session-start` as a heredoc, guarded by a drift test (T8).
- Proposed: compact branch EXTRACTS the marked blocks from SKILL.md at hook-time via one `awk`
  pattern. No copy → drift impossible by construction → T8 collapses to a ~3-line count check.
- Why recommended (4 sources: plan-smeller HIGH, Innovator, Pragmatist "adopt", Researcher
  reinforcing): eliminates ~4 heredoc fragilities the attack found (non-contiguous copy / double-
  blank / inter-block-separator footgun / drift); ~116 gross LOC vs ~191; round03's "fragile
  multi-region awk" rejection no longer holds now that uniform markers exist.
- Risk: SKILL.md unreadable at compact — not a new class; one-line empty-extraction→full-payload
  fallback closes it.
- Alternative: keep heredoc as spec'd, accept the 4 fragilities guarded by tests.

## MANDATORY FIX (applies either way — bake into final plan)

**Conservator kill-shot (startup path, live-reproduced):** the wide-strip
`sed '/^## Session Housekeeping/,/^## How to Access Skills/{/^## How to Access Skills/!d}'` has no
end-anchor guard. Future rename of `## How to Access Skills` → range never closes → deletes to EOF
→ whole mandate bottom cluster gone; session-start exits 0; T3/T5 (absence-only) PASS. Fixes:
(a) runtime anchor-existence guard in session-start before the strip — if either heading absent,
skip strip + emit full body; (b) T3/T5 assert mandate content PRESENT (e.g. The Rule / Red Flags),
not just housekeeping absent.

## RESOLVED FORKS (bake into final plan — no decision needed)

- **Marker scheme → uniform 8 HTML** `<!-- mandate-block:{slug} start/end -->`. Two-tag (reuse XML
  for SUBAGENT-STOP/EXTREMELY-IMPORTANT) is SELF-KILLED — breaks the drift count; and XML-tag
  convention (`<HARD-GATE>`) is live in other skills, so a future XML-tagged mandate block would
  escape a marker-grep. Uniform makes `grep mandate-block:` authoritative.
- 8 slugs (SKILL.md order): `subagent-stop`, `extremely-important`, `instruction-priority`,
  `how-to-access`, `the-rule`, `red-flags`, `skill-types`, `user-instructions`.
- **XML-block marker placement (Purist Finding 6):** for SUBAGENT-STOP + EXTREMELY-IMPORTANT,
  markers wrap the ENTIRE XML block INCLUDING the `<TAG>`/`</TAG>` lines (OUTER placement). The
  extractor/heredoc includes the tag lines. Other 6 blocks unambiguous.
- **how-to-access + the-rule → ONE combined marker** spanning lines 162–172 (`# Using Skills` H1 is
  mandate, nothing non-mandate between — plan-attacker I2). NOTE: this makes 7 marked regions for 8
  logical blocks; fine for the awk (extracts regions). (Purist earlier preferred separate for
  precision — either works; combined is the plan-attacker recommendation.)
- **`## Choosing Between Skills` (lines 201–203) NOT marked** — sits between skill-types and
  user-instructions; absence of marker = non-mandate. Markers must wrap around it.
- **Compact-payload test → full-equality** (`diff EXPECTED vs STUB-minus-orientation`), NEVER
  per-block grep-presence (addition-blind). Under runtime extraction this is natural (stub == awk
  output).
- **Compact envelope preamble** → compact-specific text (NOT the current "Below is the full content
  of your setup-start skill" — false for a mandate-only stub). e.g. "You have Chester. Mandate only
  — housekeeping complete this session." Compact path DOES route through the `<EXTREMELY_IMPORTANT>`
  envelope (session-start:27).
- **jq fallback explicit:** `TRIGGER=$(... jq -r '.trigger // ""') || TRIGGER=""` — make the exit-0
  guarantee explicit, not set -e coincidence (plan-attacker M1).
- **Task split → KEEP SPLIT** (markers vs check-retirement = different blast radii; Pragmatist +
  Innovator withdrew merge). Under runtime extraction Innovator floated 4-task merge, but split
  confirmed.
- **Execution mode → inline** (unanimous; tight coupling, small LOC).
- **TDD ordering** → SKILL.md structural edits (markers, check removal) precede the test task;
  test-first applies to the session-start BEHAVIOR (the rewrite task). Acceptable, fork closed.

## GROUND TRUTH (Researcher, live-verified — trust these)

- `session-start`: 32 lines; resolves SKILL.md via `CHESTER_ROOT`
  (`dirname/../skills/setup-start/SKILL.md`); frontmatter strip `sed '1{/^---$/!q}; 1,/^---$/d'`;
  inline `escape_for_json()` (no jq on output, byte-faithful, handles backtick/`$`/quotes/XML/pipes/
  newlines); emits `printf '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"%s"}}'`;
  outer `<EXTREMELY_IMPORTANT>` envelope + preamble wraps the body at line 27.
- jq `/usr/bin/jq`; `CLAUDE_PLUGIN_ROOT` in env; `chester-config-read` on PATH.
- SKILL.md: `## Session Housekeeping` line 29; `## How to Access Skills` line 162; Checks 0–3 at
  lines 113–160 (removal target, Task 2); both wide-strip anchors unique. 8 mandate blocks:
  SUBAGENT-STOP 7–9, EXTREMELY-IMPORTANT 11–17, Instruction Priority 19–27, How-to-Access 162–164,
  Using Skills+The Rule 166–172, Red Flags 174–191, Skill Types 193–199, User Instructions 205–207.
- `sed -i "\|^$CHESTER_PLANS_DIR|d"` at line 81 (wizard — STAYS) and line 143 (Check 3 — removed).
- `jq -r` is exact inverse of `escape_for_json` (round-trip tested incl. literal quotes) → full-block
  verbatim compare viable.
- inter-block separators NOT uniform: 1 blank at most gaps; ZERO mandate separator at gap 3→4
  (134 lines housekeeping between) and gap 7→8 (Choosing). awk emits zero separator there
  automatically — heredoc footgun, runtime-extraction non-issue.
- ZERO existing tests break. `test-start-cleanup.sh` greps the housekeeping HEADING (survives).
  Harness template = `test-compaction-hooks.sh` Test 4 (~152–176); config-read mock pattern ~15–25.

## PROVISIONAL FINAL TASK PLAN (5 tasks, strict linear, inline) — pending §4 decision

1. SKILL.md: add 8 uniform mandate markers (outer placement for the 2 XML blocks; combined
   how-to-access+the-rule region; skip Choosing).
2. SKILL.md: remove Checks 0–3 (lines 113–160); bump frontmatter v0002→v0003.
3. Write `tests/test-session-start.sh` (T1–T7 + drift check), RED. Test-first for the rewrite.
4. Rewrite `session-start`: stdin `.trigger` branch (explicit `|| TRIGGER=""`); compact →
   [HEREDOC or RUNTIME-AWK-EXTRACTION per §4 decision] + orientation line through envelope w/
   compact preamble; established startup → wide-strip sed WITH anchor guard; new project → full;
   fallback → full. Tests GREEN.
5. Regression: full `tests/test-*.sh`.
   (If §4 = runtime extraction: Task 4 ~40-45 LOC, drift test → count check, possible 4-task merge.
   If heredoc: Task 4 ~95-100 LOC, full-block-diff drift test, all heredoc fragility fixes needed.)

## NEXT STEPS (after designer decides §4)

1. If amend: edit spec `spec-00` §4 (heredoc → runtime extraction) + change-log entry 02.
2. Write FINAL plan → `plan/20260604-02-review-start-context-plan-00.md` (bake in: §4 decision,
   mandatory anchor-guard fix, all resolved forks, ground truth, execution mode inline).
3. Write plan-threat-report → `plan/20260604-02-review-start-context-plan-threat-report-00.md`
   from `committee/round05/plan-attacker-findings.md` (+ smeller).
4. End-of-plan-build CAPTURE artifact (per memory `project_committee_spec_plan_capture.md`):
   write up the committee-as-spec/plan-engine adversarial process + proposed skill changes, for
   designer review before any skill edits.
5. Present to designer; on sign-off, committee TEARDOWN (TeamDelete `design-committee-validate-start-context`).
   "Only the Designer terminates the Committee."
6. Provenance stamp committee artifacts if required (`chester-trailer-write stamp design-committee@<ver>`).

## COMMITTEE TEAM STATE (important)

- Team `design-committee-validate-start-context` is LIVE. 5 members (conservator/innovator/
  pragmatist/purist/researcher) in-process, idle.
- **INFRA NOTE:** the team `config.json` was LOST mid-round05 (vanished — only inboxes/ remained)
  and was RESTORED by hand from captured content. Members reconnected and responded normally after
  restore. If it vanishes again: restore from the structure now in
  `~/.claude/teams/design-committee-validate-start-context/config.json`, or re-spawn fresh members
  grounded from the on-disk round transcripts (no work lost — everything is on disk). Ephemeral
  consolidators were spawned per round (consolidator-r02..r05); not on the roster.
- Committee NOT torn down — designer authority required.

## CONSTRAINTS IN FORCE (do not violate)

- Caveman mode full (chat output); normal voice for code/commits/spec/plan artifacts.
- Staging discipline: NEVER `git add -A`/`.`; stage by path. Commit/push only when asked.
- No ASCII tables in designer-facing output — bulleted lists. Two-part questions distinct, no
  AskUserQuestion tool. Don't coin terms. No "Mode A/B".
- Commit trailer: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
