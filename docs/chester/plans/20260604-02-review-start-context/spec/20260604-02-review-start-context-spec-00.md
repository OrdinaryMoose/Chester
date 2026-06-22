# Spec: Trigger-Split Start-Sequence Payload

**Status:** Ready for plan-build (all decisions settled; §6 resolved — Option B, wide-strip)
**Sprint:** 20260604-02-review-start-context
**Design source:** `design/committee-analysis-01.md` (Follow Up 01, ADJUDICATED Option 1, 2026-06-04)
**Spec development:** design-committee round02 (develop) + round03 (attack), 2026-06-05

## 1. Summary

The SessionStart hook injects the full `setup-start/SKILL.md` body (~2,014 tokens) on every
`startup`, `clear`, and `compact` event. Compaction re-pays the full body even though filesystem
state (config, directories) does not decay across compaction — only the behavioral
skill-discovery mandate decays. This spec changes the delivery so the hook emits:

- **`startup` / `clear`** → the full body, with the whole `## Session Housekeeping` block stripped
  on established projects (§5, Option B).
- **`compact`** → a mandate-only stub (~751 tokens).

One hook entry, unchanged. One script (`chester-util-config/session-start`) reads the stdin
`trigger` field and branches. `setup-start/SKILL.md` remains the canonical source of the mandate
text; the compact stub is a co-located copy in `session-start`, kept honest by a CI drift test.

Net effect: per-compaction cost drops from ~2,014 to ~751 tokens (~1,298 saved per compaction);
established-project startup/clear cost drops by ~1,188 tokens (the entire housekeeping block —
first-run wizard and the returning-session verification checks both). Per the §6 (Option B)
decision, the verification checks retire from the live session-start path entirely.

## 2. Ground truth (verified, round02 + round03 Researcher)

- **Branch field is `.trigger`** on SessionStart stdin JSON. Values: `"startup" | "clear" |
  "compact"`. The `hook_event_name` field is `"SessionStart"` for all three and cannot
  discriminate. Confirmed `tests/test-compaction-hooks.sh:68`.
- **`jq` is available** at `/usr/bin/jq`. `pre-compact.sh` / `post-compact.sh` use it with no
  presence guard; this spec matches that behavior (no new guard).
- **Current `session-start` reads zero stdin** — a single `cat` of the SKILL.md body. The stdin
  read and branch are net-new.
- **Frontmatter is stripped** before injection (confirmed by direct sed test); the injected body
  begins at the `<SUBAGENT-STOP>` block.
- **`hooks/hooks.json`** has one SessionStart entry, matcher `startup|clear|compact`. Unchanged
  (split-and-keep: the `compact` trigger is retained, not removed).
- **The mandate is non-contiguous** in SKILL.md: a top cluster and a bottom cluster, separated by
  the `## Session Housekeeping` block.
- **The wizard and verification checks share one heading.** `## Session Housekeeping` (line 29)
  contains a single numbered item whose `eval "$(chester-config-read)"` (line ~35) is shared
  preamble, then an `if-none` wizard branch (lines ~37–112) and an `if-not-none` checks branch
  (lines ~113–160). The next heading is `## How to Access Skills` (line ~162). There is **no
  heading or marker** separating wizard from checks.

## 3. The contract

`session-start` reads the SessionStart stdin JSON and emits the payload for the event:

- **`.trigger` == `compact`** → the compact stub only (§4).
- **`.trigger` == `startup` or `clear`, established project** (`CHESTER_CONFIG_PATH` != `none`) →
  the full body with the entire `## Session Housekeeping` block stripped (§5).
- **`.trigger` == `startup` or `clear`, new project** (`CHESTER_CONFIG_PATH` == `none`) → the full
  body including `## Session Housekeeping` (the first-run wizard runs).
- **`.trigger` absent / malformed / any other value** → the full body unmodified (safe default —
  never drop the mandate).

The payload is emitted as the hook's `additionalContext` (same output contract as today). On any
internal error, `session-start` exits 0 and emits a valid full payload — the mandate is never
lost to a script failure.

## 4. Compact stub (§4)

### 4.1 Location — inline heredoc in `session-start`

The stub is a `cat <<'EOF' … EOF` heredoc inside `session-start`, emitted on the `compact`
branch. Not a separate file (a separate file adds a path-dependency failure mode — a missing
file silently emits an empty mandate — for no correctness gain over the heredoc, since both are
copies guarded by the same drift test, §4.3).

### 4.2 Membership — exactly these blocks, verbatim, in SKILL.md order

1. `<SUBAGENT-STOP>` block
2. `<EXTREMELY-IMPORTANT>` block
3. `## Instruction Priority`
4. `## How to Access Skills` (one-liner)
5. `# Using Skills` (H1) + `## The Rule`
6. `## Red Flags` (full table)
7. `## Skill Types`
8. `## User Instructions`

Plus one orientation line at the top of the stub (state context, not a behavioral rule):
`# Session context: housekeeping already complete this session. Mandate only.`

**Excluded:** all of `## Session Housekeeping`; `## Choosing Between Skills` (a navigation
pointer to `skill-index.md`, not a behavioral rule — confirmed never stated as mandate).

Measured size: ~751 tokens (~3,004 bytes) for the 8 blocks + orientation line.

**Rationale for inclusions, from the post-compaction failure model:**
- SUBAGENT-STOP, EXTREMELY-IMPORTANT, Instruction Priority, The Rule, Red Flags — the
  skill-invocation floor; without them a post-compaction agent silently skips skills or lets a
  conflicting project instruction win with no resolution rule in context.
- Skill Types — guards the *post-invocation* failure mode (a model invokes a rigid skill, then
  adapts a step because it lost "rigid means follow exactly"). Red Flags does not cover this.
- User Instructions — a post-invocation behavior rule, self-contained, no external dependency.
- How to Access Skills one-liner — self-contained, no stripped cross-reference.

### 4.3 Drift control — bidirectional, marker-anchored CI test

The stub is a copy; the test makes it honest. A per-block verbatim compare alone is
**addition-blind** — a new mandate block added to SKILL.md but not the stub passes a verbatim
check (existing blocks still match) and a size-ceiling check (stub didn't grow). That is the
exact two-place-omission bug class this sprint already hit (the stale `design-architect-committee`
catalog entry). The drift test MUST catch all three cases:

- (a) in-place edit of a stub block → per-block verbatim mismatch;
- (b) a stub block silently dropped → membership mismatch;
- (c) a new mandate block added to SKILL.md but not the stub → membership mismatch.

**Mechanism:** delimit each of the 8 mandate blocks in `setup-start/SKILL.md` with HTML-comment
markers (e.g. `<!-- mandate-block:the-rule start -->` … `<!-- mandate-block:the-rule end -->`;
invisible in rendered Markdown, ~16 comment lines). The test collects every `mandate-block:*`
region from SKILL.md and asserts the stub heredoc contains each region's content **verbatim**,
**in order**, and contains **nothing outside** the union of marked regions plus the orientation
line. Adding a marked block absent from the stub fails the test (case c).

**Residual risk (noted, not closed):** content added to SKILL.md as mandate-class but *not*
wrapped in a marker is not detected — the marker is the declaration of "this is mandate." This is
irreducible without semantic understanding; the convention "mandate blocks are marked; markers
drive the stub" is the single rule that keeps it honest.

**Formatting constraint:** the heredoc's blank-line formatting must mirror the SKILL.md blocks
exactly — the verbatim compare fails on whitespace differences.

## 5. Full payload (startup / clear) — Option B, wide-strip

Emit the SKILL.md body (frontmatter already stripped, as today). The only conditional change is
the established-project strip:

### 5.1 Established-project strip

When `.trigger` is `startup`/`clear` and `CHESTER_CONFIG_PATH` != `none`, `session-start` removes
the entire `## Session Housekeeping` section before emitting, with a structural heading-to-heading
expression (tested):

```
sed '/^## Session Housekeeping/,/^## How to Access Skills/{/^## How to Access Skills/!d}'
```

The range runs from the housekeeping heading to the next section heading; the inner
`{/^## How to Access Skills/!d}` deletes every line in the range except the closing heading, which
is preserved. Both anchors are top-level `##` headings — robust to prose/wording edits; they break
only on a deliberate rename of either heading.

On a new project (`CHESTER_CONFIG_PATH` == `none`), the section is emitted intact and the model
runs the first-run wizard.

### 5.2 Retire the verification checks (consequence of Option B)

Under Option B the returning-session verification checks (Checks 0–3) fire in **no** path:
established startup strips them, new-project startup takes the wizard branch, compact gets the
stub. They become dead text. Per the standalone-documentation discipline (Chester docs describe
the current live behavior), **remove Checks 0–3 from `setup-start/SKILL.md`**. After removal,
`## Session Housekeeping` contains only the shared `eval` and the first-run wizard.

This is the deliberate, signed-off behavioral change of Option B: an established project no longer
runs working-dir-recreate / gitignore-auto-fix / config-key-backfill at session open. External
config drift (manually edited `.gitignore`, deleted working dir, dropped config key) is caught
later by the skill that hits it, not pre-emptively at session start.

Note: the `sed -i "\|^$CHESTER_PLANS_DIR|d"` idiom also appears in the **first-run wizard** (the
new-project gitignore step); the wizard is emitted verbatim on new projects, so that idiom stays
intact there. No prose-to-bash reconstruction risk remains, because no check bash is being
collapsed under Option B.

## 6. First-run gating — RESOLVED (Option B, wide-strip)

Round03 falsified the draft's "strip only the wizard with a heading-to-heading `sed`": the wizard
and the verification checks share one `## Session Housekeeping` heading and a shared `eval`, so no
clean anchor isolates the wizard. Resolving this surfaced a scope question — must the
returning-session verification checks run on every established-project startup? — whose answer
determines the mechanism.

**Designer decision (2026-06-06): Option B — wide-strip. The checks do NOT need to run at
established-project startup; they retire from the live path.**

Mechanism: on an established project, strip the entire `## Session Housekeeping` block (§5.1). The
checks become dead text and are removed from SKILL.md (§5.2). Largest saving (~1,188 tok/startup),
simplest mechanism, stable structural anchors, no new file, no SKILL.md restructure beyond the
check removal.

Rationale (Pragmatist + Conservator, accepted): the checks are already absent from the compact
payload, so treating them as load-bearing only at startup is incoherent; and a safety net that is
a no-op in the overwhelming majority of sessions (it acts only on rare external drift) is the same
per-startup overhead the design exists to cut.

**Alternatives considered and not taken:**
- **A1 — subheading restructure** (add `### New Project Setup` / `### Returning Project Checks`,
  strip only the wizard subsection): keeps the checks live; cleanest keep-checks option. Rejected
  with the scope decision.
- **A2 — wizard extraction** to a reference file: keeps checks; costs a new file. Rejected.
- **Narrow prose-anchor strip:** rejected as broken — the only end-anchor is indented prose; on
  any rewording the `sed` range never closes and deletes to EOF (catastrophic silent payload
  loss). Not viable under any scope.

## 7. Test plan

New `tests/test-session-start.sh`, extending the stdin→grep `additionalContext` assertion pattern
from `test-compaction-hooks.sh` (Test 4). Eight tests:

- **T1** `compact` → all 8 mandate blocks present.
- **T2** `compact` → Session Housekeeping ABSENT (inverted grep — the absence assertion proves
  the split).
- **T3** `startup` + established config → full body, entire `## Session Housekeeping` block ABSENT
  (wizard and checks both gone), `## How to Access Skills` and the mandate present.
- **T4** `startup` + no config (`CHESTER_CONFIG_PATH == none`) → `## Session Housekeeping` present
  (wizard runs).
- **T5** `clear` + established config → same as T3.
- **T6** empty / absent `.trigger` → full payload (fallback).
- **T7** malformed JSON on stdin → full payload (parse-fail fallback; `session-start` exits 0).
- **T8** drift: every `mandate-block:*` region in SKILL.md is present verbatim and in order in the
  stub, and the stub carries nothing beyond those regions + the orientation line (§4.3,
  bidirectional).

(The draft's T9 size-ceiling is dropped — redundant with T1/T2 absence assertions; addition
detection is T8's job, not a ceiling's.)

## 8. Surfaces touched

- `chester-util-config/session-start` — rewrite: stdin read, `.trigger` branch, compact-stub
  heredoc, full-payload path, established-project wide-strip of `## Session Housekeeping` (§5.1).
- `skills/setup-start/SKILL.md` — add the 8 `mandate-block:*` marker pairs; **remove Checks 0–3**
  from `## Session Housekeeping` (§5.2) so the section holds only the shared `eval` + first-run
  wizard. Version frontmatter **v0002 → v0003**.
- `tests/test-session-start.sh` — new (8 tests).
- `hooks/hooks.json` — unchanged.

(No new reference file — Option B needs none.)

**Two-place sync:** the skill's public interface (description frontmatter + the available-skills
list entry in `setup-start/SKILL.md`) is unchanged — no description-sync churn.

**Satisfied prerequisite:** the stale `design-architect-committee` entry in `skill-index.md` was
removed this sprint (commit `0e79b85`).

## 9. Estimated effect

- Per compaction: ~2,014 → ~751 tokens (~1,298 saved), every compaction, for the life of every
  long session.
- Per established-project startup/clear: ~1,188 saved (whole `## Session Housekeeping` block — the
  first-run wizard and the retired verification checks).
- Implementation size (round03 Pragmatist, tested): ~148 changed/new LOC (session-start ~65, test
  file ~83 with T8 at ~16–20 lines, SKILL.md ~30 removed). No new reference file under Option B.

## 10. Acceptance criteria

- `compact` emits the 8-block stub and nothing from Session Housekeeping (T1, T2).
- Established-project `startup`/`clear` emit the full body with the entire `## Session Housekeeping`
  block absent (T3, T5); new-project `startup` keeps it (T4).
- Absent/malformed trigger emits the full payload (T6, T7).
- The drift test fails on a block edit, a dropped block, and an added-but-uncopied marked block
  (T8).
- Checks 0–3 are removed from `setup-start/SKILL.md`; `setup-start` version bumped to v0003;
  `hooks.json` unchanged; existing `test-compaction-hooks.sh` still passes.

---

## Change log

- **00 (2026-06-05)** — Initial spec. Developed and adversarially hardened across design-committee
  round02 (develop) and round03 (attack).
- **01 (2026-06-06)** — §6 resolved: designer chose **Option B (wide-strip)**. Established-project
  startup strips the whole `## Session Housekeeping` block; verification Checks 0–3 retire and are
  removed from SKILL.md. Propagated through §1, §3, §5, §7, §8, §9, §10. Status → Ready for
  plan-build.
