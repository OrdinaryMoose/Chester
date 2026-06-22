# DRAFT PLAN (round04 output) — Trigger-Split Start-Sequence Implementation

**Status:** PROVISIONAL. Team-lead synthesis of round04 build digests. Input to round05 ATTACK
(committee lenses + `plan-build-plan-attacker` + `plan-build-plan-smeller` subagents).
**Spec:** `spec/20260604-02-review-start-context-spec-00.md` (Option B, wide-strip).
**Execution mode:** inline (round04 unanimous — ~148 LOC, tight marker coupling between tasks;
subagent coordination overhead would exceed the work).

Fork resolutions marked **[PROVISIONAL — attack target]** are not settled.

## Ground truth (round04 Researcher, DECISIVE)

- `chester-util-config/session-start` today: 32 lines, reads zero stdin, resolves SKILL.md via
  `CHESTER_ROOT` (`dirname/../skills/setup-start/SKILL.md`), strips frontmatter with
  `sed '1{/^---$/!q}; 1,/^---$/d'`, escapes via inline-bash `escape_for_json()` (no jq on output),
  emits `printf '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"%s"}}'`.
  Output contract MUST survive the rewrite.
- jq at `/usr/bin/jq` (input parse only, no guard, matches pre/post-compact.sh). `CLAUDE_PLUGIN_ROOT`
  in env. `chester-config-read` on PATH via plugin `bin/`.
- SKILL.md line numbers: `## Session Housekeeping` 29; `## How to Access Skills` 162 (wide-strip
  end-anchor); Checks 0–3 at 113–160 (removal target). 8 mandate blocks: SUBAGENT-STOP 7–9,
  EXTREMELY-IMPORTANT 11–17, Instruction Priority 19–27, How-to-Access 162–164, Using Skills+The
  Rule 166–172, Red Flags 174–191, Skill Types 193–199, User Instructions 205–207.
- `sed -i "\|^$CHESTER_PLANS_DIR|d"` appears at line 81 (wizard — STAYS) and line 143 (Check 3 —
  removed). Removal doesn't touch the wizard copy.
- Zero existing tests break. `test-start-cleanup.sh` greps the `## Session Housekeeping` heading
  (survives removal). New-vs-established testing needs a `chester-config-read` PATH mock
  (pattern at `test-compaction-hooks.sh:15–25`); harness template = Test 4 (`test-compaction-hooks.sh:152–176`).

## Task list (strict linear — no parallelism, single-session scope)

### Task 1 — Establish mandate markers in SKILL.md
- **Responsibility:** the mandate-reading contract. Insert marker pairs at the 8 block boundaries.
  No content change, no version bump.
- **Marker scheme [PROVISIONAL — attack target #1]:** uniform 8 HTML-comment pairs
  `<!-- mandate-block:{slug} start -->` / `<!-- mandate-block:{slug} end -->`. Slugs in SKILL.md
  order: `subagent-stop`, `extremely-important`, `instruction-priority`, `how-to-access`,
  `the-rule`, `red-flags`, `skill-types`, `user-instructions`. (Innovator's alternative: reuse the
  existing `<TAG>` XML delimiters for the first two, 6 HTML pairs only — round05 decides. Uniform
  chosen provisionally: one convention, single dynamic grep, no author footgun.)
- **Contract:** marker immediately before first content line / after last; blank lines between
  blocks are OUTSIDE markers. `## Choosing Between Skills` NOT marked (absence = non-mandate).
- **Done:** 16 marker lines present; HTML comments invisible in render; existing tests still pass.
- **Open:** `how-to-access` (162–164) + `the-rule` (166–172) — one combined marker or two
  (Purist DMed Researcher; resolve at implementation per whether non-mandate content sits between).

### Task 2 — Retire Checks 0–3; bump v0003
- **Responsibility:** behavioral scope retirement (distinct concern from Task 1 — different
  failure mode, different rollback). Remove the `if-not-none` checks branch (lines 113–160) from
  `## Session Housekeeping`. Bump frontmatter v0002 → v0003.
- **After:** `## Session Housekeeping` holds only the shared `eval` + first-run wizard; the
  wide-strip anchor pair (29 → 162) stays intact; mandate blocks untouched; wizard's line-81 `sed`
  stays.
- **Done:** zero Check-N lines; v0003 in frontmatter; `test-start-cleanup.sh` still passes
  (heading survives).
- **[PROVISIONAL — attack target #2]:** Task 1 + Task 2 kept separate (Purist/Conservator).
  Innovator/Pragmatist merge them into one SKILL.md edit. Round05 decides split vs merge.

### Task 3 — Write tests/test-session-start.sh (T1–T8), RED
- **Responsibility:** the test contract, written test-first (Chester `execute-test` discipline).
  All 8 fail red against the current (un-rewritten) session-start.
- **Harness:** clone `test-compaction-hooks.sh` Test-4 pattern — TMPDIR + mock
  `chester-config-read` on PATH; pipe stdin JSON; extract `jq -r '.hookSpecificOutput.additionalContext // empty'`;
  grep-assert. Established mock emits a real config path; new-project mock emits
  `CHESTER_CONFIG_PATH=none`.
- **Tests:** T1 compact→8 blocks present; T2 compact→housekeeping absent; T3 established
  startup→housekeeping absent; T4 new startup→wizard present; T5 clear+established→as T3;
  T6 empty trigger→full; T7 malformed JSON→full (exit 0); T8 drift.
- **T8 [PROVISIONAL — attack target #3]:** full-block verbatim (Purist) — dynamically grep all
  `mandate-block:*` slugs from SKILL.md (NOT a hardcoded list), extract each marked region's full
  content, concatenate in order → EXPECTED; extract the compact `additionalContext` → STUB; assert
  each block's full text present verbatim. Dynamic slug extraction is load-bearing: a new marked
  block auto-enters EXPECTED, so an uncopied block fails the diff (case c). (Pragmatist's lighter
  first-line-grep rejected — misses mid-block edits; spec §4.3 requires verbatim.)
- **Done:** test file present; all 8 RED.

### Task 4 — Rewrite session-start, tests GREEN
- **Responsibility:** the delivery mechanism. Insert `INPUT=$(cat)` +
  `TRIGGER=$(echo "$INPUT" | jq -r '.trigger // ""')` after `CHESTER_ROOT` setup; branch:
  - `compact` → emit the 8-block heredoc stub (verbatim from post-Task-1/2 SKILL.md) + orientation
    line, through the existing envelope/`escape_for_json`/`printf`.
  - `startup`/`clear` + established (`CHESTER_CONFIG_PATH` != none) → SKILL.md body, frontmatter
    stripped, then wide-strip
    `sed '/^## Session Housekeeping/,/^## How to Access Skills/{/^## How to Access Skills/!d}'`.
  - `startup`/`clear` + new (`== none`) → full body.
  - any other / empty / malformed → full body (fallback; mandate never dropped).
  - reuse `escape_for_json()` + `printf` emitter verbatim.
- **Done:** all 8 tests green; ~95–105 lines (heredoc content ~57 lines is the bulk).

### Task 5 — Regression
- **Responsibility:** confirm no collateral. Run `test-compaction-hooks.sh` + full
  `tests/test-*.sh` suite.
- **Done:** entire suite green.

## Sequencing & dependencies

Task 1 → Task 2 → Task 3 → Task 4 → Task 5 (strict linear).
- Task 1 before Task 3 (T8 greps markers) and before Task 4 (heredoc copies marked blocks).
- Task 2 before Task 4 (heredoc copies final SKILL.md state — avoids a second heredoc edit;
  Conservator's load-bearing constraint).
- Task 3 (red) before Task 4 (green) — test-first.

## Rollback safety (Conservator P5)

Until Task 4 lands, current session-start emits the full body unconditionally — mandate never at
risk. Task 4's non-compact→full fallback means a bad `sed`/branch over-emits tokens rather than
dropping the mandate; T1 (mandate present in compact) catches over-strip. Each task reverts cleanly.

## Open forks handed to round05 ATTACK

1. Marker scheme — uniform 8 HTML vs 6 HTML + 2 XML-reuse (doc cleanliness vs test uniformity).
2. Task 1/Task 2 split vs merge (clean responsibilities vs one-edit-pass).
3. T8 assertion — full-block verbatim feasibility (jq -r decode of escaped `additionalContext` for
   a full-text compare) vs Pragmatist's first-line grep.
4. TDD ordering — is writing all of SKILL.md (Tasks 1–2) before the test (Task 3) acceptable
   test-first, or should a structural test precede the marker edit?
5. Did the build miss a failure mode? — envelope/escape interaction with the heredoc;
   wide-strip on a SKILL.md whose headings later change; `clear` trigger real value;
   mock-config-read fidelity; the line-81 vs line-143 `sed` (only 143 removed).
