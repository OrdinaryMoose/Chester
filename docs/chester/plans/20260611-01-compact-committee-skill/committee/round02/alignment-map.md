# Alignment map — round02 (validation) — compact-committee-skill plan

**Answer shape:** partial (plan validated + mandatory citation corrections) with one preserved-split element (Task 7 round-format sub-edit).

## Question

Is the 9-task compaction plan safe to execute as written — specifically Task 6 (team-lead Authority-Guard/warrant collapse) and Task 7 (round-format output-surface edit)?

## Alignment pattern

**3-1 on "execute Task 7 round-format sub-edit as written."** 4-0 on Task 6 being safe (no trimming of steps 6+7).

- **Execute both tasks as written** (3): Pragmatist, Purist, Innovator (Innovator conditions on a plan-precision correction).
- **Task 7 round-format sub-edit NOT safe as written — scope it to the SKILL.md edit only** (1): Conservator.

Consensus across all four: Task 6 steps 6+7 must NOT be trimmed — they are disk-write instructions, the Purist's round01 flag does not survive reading the actual lines.

## Full option set

1. **Execute the plan as written** (Pragmatist, Purist). Both flagged tasks resolve without executor ambiguity on inspection; Task 9 verification targets the exact failure modes.
2. **Execute with one precision correction to Task 6** (Innovator). Name lines 122-123 as the explicit collapse target and mark steps 6+7 as protected write-instructions, so the plan's "preserve in place if ambiguous" hedge cannot license a zero-byte Task 6.
3. **Execute, but scope Task 7's round-format sub-edit out** (Conservator). Collapsing the round-format definition strands the disambiguation clause's antecedent; do only the SKILL.md half of Task 7.

## Positions discarded with reason

- **Freeze round-format entirely** (Conservator's round01 stance) — discarded; Conservator itself narrowed to "scope out the round-format sub-edit," conceding the SKILL.md half is independently valid.
- **Cut Tasks 6+7 to ship safe ~3KB** — discarded; Pragmatist's own lens rejects it (loses ~550b of low-risk saving for no real risk reduction once ambiguity dissolves on inspection).

## Warrant record (member-supplied, team-lead-verified)

- **Task 6 safe; steps 6+7 are write-instructions, not policy restatement.** Warrant: evidence + logic (Pragmatist, Purist — direct read of team-lead.md 106-107 against §Authority Guard 320-326; the embedded "warrant" tokens name a field schema in a write-spec, the policy owner is §Authority Guard 326). VERIFIED: researcher confirms warrant-policy vocabulary IS embedded in steps 6+7, but as write-spec, not free-standing restatement — owner §Authority Guard exists and is untouched. Type fits, source traceable.
- **Task 6 real collapse targets are lines 122-123 and 343-345.** Warrant: evidence (Innovator, researcher ground truth). VERIFIED: line 122 = "Count is not a warrant" (restates §AG 323), line 123 = "Strict premise scope", lines 343-345 = Self-Eval Authority-Guard checks. NOTE (team-lead-verified fact, not member-warranted): line 121 is the unique most-informative-answer bullet — NOT a restatement; the plan's "121-123" span must exclude 121 from the collapse.
- **Plan's "preserve in place if ambiguous" hedge could license zero Task-6 savings.** Warrant: logic (Innovator — an unbounded escape hatch lets a cautious executor skip the cut). VERIFIED: inference holds; demoted to a precision-correction recommendation, not a blocker.
- **Task 7 round-format collapse strands the disambiguation antecedent.** Warrant: evidence (Conservator — direct read: 104-110 is one bullet; "This output-surface split" at 109 is anaphoric to the definition at 104-108; the plan's 107/108 split does not match the grammar). VERIFIED against researcher verbatim: confirmed single bullet, confirmed anaphor, confirmed the plan's line boundary is off.
- **Task 7 boundary is clean (counter-position).** Warrant: logic (Purist, Innovator — the disambiguation is a syntactically separate parenthetical; the replacement cite line itself names "output-surface split", restoring the antecedent). PARTIALLY VERIFIED: the parenthetical is separable, but only survives intact if the cite line re-names the concept AND the off-by-one line boundary is corrected first.

## Gaps

- **Factual, resolved by researcher (mandatory corrections, not a designer call):** plan line citations are wrong at three sites — Task 6 steps "105-106" → 106-107; Task 6 "§Behavioral Constraints 121-123" → collapse only 122-123 (121 is unique); Task 7 "SKILL.md:122" → 139. These must be fixed in the plan text before execution regardless of the Task 7 decision.
- **Value/risk, routes to designer:** Task 7 round-format sub-edit — execute with corrected boundaries (3 members) vs scope it out and keep only the SKILL.md edit (Conservator). ~100b yield against a verified structural fiddliness.

<!-- created-at: 2026-06-11T10:28:51Z -->
<!-- produced-by design-committee@v0021 -->
