# Conservator Transcript — Round 05
# Sprint: 20260604-02-review-start-context
# Role: Conservator
# Date: 2026-06-06
# Phase: ATTACK (attack the draft plan — find broken-tree steps, rollback gaps, broken contracts)

---

## Lens

Conservator attack targets: sequencing holes, broken-tree steps, rollback gaps, broken
existing contracts. Find concrete failure sequences with file + line + failure path.
Concede what survives.

---

## Ground-Truth Read (pre-transcript)

**session-start line 27 (existing, critical):**
```bash
session_context="<EXTREMELY_IMPORTANT>\\nYou have Chester.\\n\\n**Below is the full content of your 'setup-start' skill - your introduction to using skills. For all other skills, use the 'Skill' tool:**\\n\\n---\\n${skill_escaped}\\n\\n\\n</EXTREMELY_IMPORTANT>"
```
The injected content is wrapped in an outer `<EXTREMELY_IMPORTANT>` envelope with preamble
text. The spec says "same output contract as today" (spec §3). The plan's Task 4 says
"reuse `escape_for_json()` + `printf` emitter verbatim" but does not explicitly specify
whether the compact-stub path goes through the same envelope or bypasses it.

**Wide-strip sed behavior (locally verified):**
- When `## How to Access Skills` (end-anchor) is absent/renamed: the sed range opens at
  `## Session Housekeeping` and NEVER CLOSES. Every line from `## Session Housekeeping`
  to EOF is deleted. Verified with live bash test:
  ```
  Input: ## Session Housekeeping / [content] / ## The Rule / [content]
  Output: (empty — everything from ## Session Housekeeping to EOF deleted)
  ```
  Exit 0. No error. Session-start emits a payload missing the entire mandate bottom
  cluster (~477 tokens: The Rule, Red Flags, Skill Types, User Instructions).
- When `## Session Housekeeping` (start-anchor) is absent: sed finds no range to open,
  emits full body including housekeeping. Silent no-op — wrong behavior (~1,188 tokens
  NOT saved) but mandate intact.

**DMed researcher** on: (1) whether plan Task 4 specifies outer envelope handling for
compact path; (2) whether plan includes a guard test for the sed anchor strings.
Will revise if researcher contradicts.

---

## Attack 1 — Wide-strip sed: end-anchor absent = catastrophic silent mandate deletion (KILL-SHOT)

### The failure sequence

1. A future editor renames `## How to Access Skills` in SKILL.md (e.g. to
   `## Accessing Skills` or `## Skill Access`). This is a plausible edit — the heading
   is slightly non-parallel to the other headings in the file.

2. Session-start Task 4 rewrite includes:
   ```bash
   sed '/^## Session Housekeeping/,/^## How to Access Skills/{/^## How to Access Skills/!d}'
   ```
   The end-anchor `## How to Access Skills` no longer matches anything. The range
   opens at `## Session Housekeeping` and never closes.

3. Sed deletes every line from `## Session Housekeeping` to EOF. This removes:
   - `## Session Housekeeping` through the end of the file
   - INCLUDING: `## How to Access Skills` (the renamed heading, now under a different
     name), `# Using Skills`, `## The Rule`, `## Red Flags`, `## Skill Types`,
     `## Choosing Between Skills`, `## User Instructions`
   - The entire mandate bottom cluster is gone.

4. Session-start emits exit 0. The payload contains only the mandate TOP cluster
   (SUBAGENT-STOP, EXTREMELY-IMPORTANT, Instruction Priority) plus whatever preamble
   the outer envelope provides.

5. **T3 / T5 still PASS.** These tests assert `## Session Housekeeping` is absent from
   the established-project startup payload. It is absent — along with everything after
   it. The tests check for the absence of housekeeping; they do not check for the
   PRESENCE of the mandate bottom cluster on startup paths.

6. **T1 catches this on the compact path** (mandate blocks present) — but T1 tests the
   compact trigger, not the startup path. The startup path is not tested for mandate
   presence by any test in the plan.

### The gap in the test plan

The plan has no test that asserts "on startup/clear, the mandate blocks (The Rule, Red
Flags, Skill Types, User Instructions) are PRESENT in the emitted payload." T3 and T5
only assert housekeeping is ABSENT. The full-body startup path is tested for what it
LACKS, never for what it MUST CONTAIN.

### The fix

Two options, either closes the gap:

**Option A — Anchor guard in session-start (runtime):**
Before running the wide-strip sed, assert both anchors exist:
```bash
if ! grep -q "^## Session Housekeeping" "$skill_content_file" || \
   ! grep -q "^## How to Access Skills" "$skill_content_file"; then
  # Anchors missing — skip strip, emit full body; log warning
  echo "WARN: session-start wide-strip anchors not found — emitting full body" >&2
  # fall through to full-body emit
fi
```
This converts the catastrophic-deletion failure into a safe over-emit (full body
including housekeeping, ~1,188 tokens NOT saved, but mandate intact). Exit 0 still.

**Option B — Add T3/T5 presence assertions:**
T3 and T5 currently only assert housekeeping ABSENT. Extend them to also assert
that known mandate-bottom-cluster lines are PRESENT (e.g., grep for "Invoke relevant
or requested skills" from The Rule, or a Red Flags table line). This catches the
deletion in testing but does not prevent it at runtime.

**Conservator recommendation: both.** The runtime guard is the safe-failure path; the
test assertion is the CI catch. Neither alone is sufficient: Option A alone means the
failure goes undetected in CI; Option B alone means production sessions can still
silently lose the mandate on a heading rename between test runs.

**Verdict:** the plan does not specify either fix. This is a real, unguarded failure
mode — not a theoretical edge case, but the direct consequence of the spec's explicit
statement that both anchors are "robust to prose/wording edits; they break only on a
deliberate rename of either heading." The spec acknowledges the rename risk; the plan
does not close it. KILL-SHOT STRENGTH: HIGH.

---

## Attack 2 — Outer envelope: compact-stub path unspecified (MEDIUM)

### The issue

The existing session-start line 27 wraps ALL injected content in:
```
<EXTREMELY_IMPORTANT>\nYou have Chester.\n\n**Below is the full content of your
'setup-start' skill...**\n\n---\n{content}\n\n\n</EXTREMELY_IMPORTANT>
```

The plan's Task 4 says "reuse `escape_for_json()` + `printf` emitter verbatim" but
does not explicitly address whether the compact-stub path goes through this outer
envelope or bypasses it.

### Two failure modes depending on the choice

**If the compact stub bypasses the envelope:**
- The `session_context` variable for compact would be just the escaped heredoc text,
  without the `<EXTREMELY_IMPORTANT>` wrapper, the "You have Chester" preamble, or the
  "Below is the full content..." intro.
- This changes the effective instruction framing for post-compaction sessions.
  The outer EXTREMELY_IMPORTANT wrapper is the model's first strong signal to pay
  attention to the injected content. Removing it from the compact path means the stub
  content arrives without that framing emphasis.
- Not a broken output FORMAT (the JSON shape is the same), but a behavioral regression:
  the compact mandate is less prominently framed than the startup mandate.

**If the compact stub goes through the same envelope:**
- "You have Chester. Below is the full content of your 'setup-start' skill" is
  misleading on the compact path — the stub is NOT the full content; it is a
  mandate-only subset.
- The preamble text should be updated for the compact case: something like "You have
  Chester. Mandate only — housekeeping complete this session."

### The plan's gap

The plan does not specify which path the compact stub takes through the envelope, and
does not address the preamble text update. The spec §3 says "same output contract as
today" but that refers to the JSON shape, not the envelope text. The plan needs a
concrete decision: does compact use the same envelope (with updated preamble) or emit
the stub as its own top-level content?

### Conservator recommendation

Compact path should use the same envelope structure (preserve the strong framing) with
updated preamble text. The orientation line (`# Session context: housekeeping already
complete this session. Mandate only.`) already serves this purpose — it should become
the preamble, not an inline line within the heredoc. The plan must specify this
explicitly so the implementer does not make the wrong choice silently.

**Verdict:** medium severity. Not a mandate-loss failure (the content arrives either
way), but an underspecified implementation decision that produces either a framing
regression or a misleading preamble. Plan must be explicit.

---

## Attack 3 — Task 1/2 split vs merge: concede to merge (CONCESSION)

### The Conservator's round04 position

I argued for splitting markers (Task 1) and check removal (Task 2) into separate tasks,
with separate rollback units.

### Why the merge is acceptable

The plan's draft keeps them split. Attacking this from the Conservator lens: is there
a concrete scenario where merging creates an ambiguous rollback?

The rollback scenarios:
- If markers are wrong: revert SKILL.md (same revert whether split or merged)
- If check removal is wrong: revert SKILL.md (same revert whether split or merged)
- If both are wrong: revert SKILL.md (same revert)

The rollback unit is the same file in both cases. Splitting into two commits provides
finer commit-history granularity (which is useful for git bisect), but it does not
change the rollback complexity. The Innovator/Pragmatist merge argument — "one edit
pass, one SKILL.md diff to review" — reduces cognitive load without changing rollback
risk.

**Concession:** the split is cleaner for history but the merge is acceptable. Both are
safe. No concrete broken-tree scenario distinguishes them. The plan's provisional choice
(keep split) is fine; merge is also fine. Not a kill-shot.

---

## Attack 4 — TDD ordering: Tasks 1+2 before Task 3 (tests) — acceptable (CONCESSION)

### The plan's ordering

Tasks 1 and 2 (SKILL.md edits) precede Task 3 (write test file, confirm red). The
open fork in the plan asks whether writing tests before the SKILL.md edits is "true
TDD" or whether the current order violates test-first discipline.

### Conservator verdict

This is not a broken-tree risk. The concern is about TDD philosophy, not about a step
that leaves the repo broken. In practice:
- The T8 drift test REQUIRES markers (Task 1) to exist before it can be written
  correctly — T8's logic greps SKILL.md for `mandate-block:*` slugs to derive expected
  content. Without markers, T8 cannot be written at all, only stubbed.
- T3/T5 require the post-check-removal SKILL.md body to produce correct expected-absent
  assertions — testing against the pre-removal body would make T3/T5 asserting wrong
  behavior.

Tasks 1 and 2 are not behavioral changes to session-start; they are changes to the
source material the tests will validate. It is correct to finalize the source material
before writing tests that read from it. The "red phase" in Task 3 confirms the tests
work structurally (correct syntax, correct assertions) against the un-rewritten
session-start. No violation.

**Concession:** not a plan flaw. The order is correct.

---

## Attack 5 — Fallback path: bad branch over-emits (safe) — CONFIRMED (CONCESSION)

The plan states: "Task 4's non-compact→full fallback means a bad `sed`/branch
over-emits tokens rather than dropping the mandate."

This is true for the compact branch (non-compact trigger → full body) and for the
parse-fail case (malformed JSON → empty TRIGGER → falls through to full body). It is
NOT true for the wide-strip over-deletion case (Attack 1) — that is specifically the
failure mode where the fallback does NOT protect the mandate.

But the fallback rule itself (any non-compact trigger → full body unmodified in the
`CHESTER_CONFIG_PATH == none` branch, and wide-strip-then-emit in the established
branch) is correctly specified. The catastrophic case is not a fallback logic bug —
it is the wide-strip sed silently deleting too much before the fallback can help.

**Concession:** the fallback rule is correct as stated. The attack on the fallback is
not valid. Attack 1 (sed anchor-absent) is a separate failure mode that the fallback
does not cover.

---

## Summary of Attacks

1. **Wide-strip sed end-anchor absent → catastrophic silent mandate deletion (HIGH):**
   Rename `## How to Access Skills` in SKILL.md → sed range never closes → entire
   mandate bottom cluster deleted → T3/T5 pass (housekeeping absent — yes, along with
   everything else) → silent behavioral regression on established-project startup.
   Plan has no runtime guard and no T3/T5 presence assertion for mandate-bottom content.
   Fix: add anchor-existence guard in session-start BEFORE sed + add presence assertions
   to T3/T5. Both required.

2. **Compact-stub outer envelope preamble text unspecified (MEDIUM, NARROWED):**
   Plan Task 4 line 81 DOES specify "through the existing envelope" — compact stub goes
   through the same `<EXTREMELY_IMPORTANT>` wrapper (confirmed by researcher). Attack
   narrowed: the plan does not specify whether the preamble sentence ("You have Chester.
   Below is the full content of your 'setup-start' skill — for all other skills, use
   the Skill tool") is updated for the compact path. That sentence is inaccurate for
   compact (the stub is NOT the full content). The stub carries its own orientation line.
   Fix: plan must explicitly state whether the preamble sentence is kept verbatim or
   updated for compact (e.g., "You have Chester. Mandate only — housekeeping complete
   this session.").

3. **Task 1/2 split vs merge — CONCEDE:** no concrete broken-tree scenario distinguishes
   them; merge is acceptable.

4. **TDD ordering — CONCEDE:** correct to finalize source material (Tasks 1+2) before
   writing tests that read from it (Task 3).

5. **Fallback path — CONCEDE:** fallback rule is correctly specified; Attack 1 is a
   separate failure mode, not a fallback logic bug.

---

## Peer Question

DM sent to researcher before transcript written:
> (1) Does the plan specify outer envelope handling for the compact-stub path?
> (2) Does the plan include a guard test for sed anchor strings being present?

Load-bearing for Attacks 1 and 2. Will revise if researcher confirms the plan already
addresses either.

---

## Revision Status

**Attack 1 confirmed** by researcher (2026-06-06): sed catastrophic failure reproduced
with live bash test — end-anchor absent deletes everything from `## Session Housekeeping`
to EOF, exit 0, no error. Plan draft explicitly lists "wide-strip on a SKILL.md whose
headings later change" as open fork item 5 but does NOT close it with a guard or test.
No guard in Task 4 spec, no T9 anchor-presence test. Kill-shot stands.

**Attack 2 narrowed** by researcher (2026-06-06): plan Task 4 line 81 says "through the
existing envelope" — compact path routes through the `<EXTREMELY_IMPORTANT>` wrapper.
Attack narrowed to the preamble sentence only: plan does not specify whether "Below is
the full content of your 'setup-start' skill" is updated for compact. Gap is real but
smaller — a misleading preamble, not a missing wrapper.

Position locked. Attack 1 is the kill-shot. Attack 2 survives as a medium gap.

<!-- produced-by: conservator / round05 / 2026-06-06 -->
