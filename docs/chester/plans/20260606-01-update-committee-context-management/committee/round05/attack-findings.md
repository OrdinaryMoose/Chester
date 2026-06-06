# Attack Findings — Committee Context Redesign Plan

**Reviewer:** plan-attack subagent
**Date:** 2026-06-06
**Plan:** docs/chester/working/20260606-01-update-committee-context-management/plan/20260606-01-update-committee-context-management-plan-00.md
**Suite baseline:** All 61 checks PASS before any edit.

---

## Finding 1 — CRITICAL — Task 1 peer-DM assertion fails to go red before the edit

**Confidence:** High (verified by bash simulation)

**The problem.**
Task 1 Step 1 adds this check to `assert_member_protocol`:

```bash
_check "member-protocol caps peer-DM exchanges" "grep -qiE 'peer.?dm' '$f' && grep -qiE '2 (exchanges|per pair)|max 2' '$f'"
```

The `peer.?dm` pattern (dot = any single character) requires a literal letter between "peer" and "dm" — it matches "peer-dm" or "peer dm" but NOT a match if the text only mentions "peer DM" (uppercase) OR "Peer DM" in prose that doesn't include a hyphen or adjacent single character. The critical problem is different: the FIRST half of the AND (`grep -qiE 'peer.?dm'`) tests member-protocol.md for the string "peer" followed by one char followed by "dm". The current member-protocol.md has no such string, so Step 2 ("confirm fail") would pass — the check IS red, as expected.

**BUT:** after Step 3, the plan says to add a `## Peer-DM` section with the schema `[sender]→[target]: [one sentence] / [target]: [one sentence], max 2 exchanges per pair`. The section heading `## Peer-DM` matches `peer.?dm` (the hyphen is the "any char"). The body contains "max 2 exchanges per pair", which matches `2 (exchanges|per pair)|max 2`. So Step 4 ("confirm pass") would pass.

The assertion is **technically valid for the described edit** — it goes red before, green after. No failure here for the assertion correctness attack surface.

**However**, there is a real defect: the `peer.?dm` regex uses `.?` (zero-or-one ANY character), which means it would also match the string "peerXdm" or "peersdm". It will NOT match "peer DM" if the space character is present (space is matched by `.`). Tested: `echo "peer DM" | grep -qiE 'peer.?dm'` → MATCHES (space is the "any char"). So the regex is functional even against "peer DM". **No assertion correctness failure here.**

**Verdict:** Not a real failure. Documented because the regex looks fragile but works.

---

## Finding 2 — CRITICAL — Task 6 adds but does not replace: round-format.md ends up with two conflicting pipeline descriptions

**Confidence:** High (file read + plan text)

**The problem.**
Task 6 Step 3 says: "Add `alignment-map.md` (synthesize output), `verdict.md` (converge output), and the scribe draft to the Folder Shape listing and Template section, in pipeline order."

The word is ADD, not REPLACE. The current `committee-analysis-round-format.md` (`skills/design-committee/references/committee-analysis-round-format.md`) describes the OLD pipeline with:
- Folder Shape (lines 40–59): lists `committee-analysis.md` as the team-lead artifact
- How To Use (lines 61–76): step 4 says "team-lead writes `committee-analysis.md` for the round: Round Overview, then a Final Recommendation"
- Template section (lines 99–226): a full `### committee-analysis.md` template block

After Task 6, these OLD entries survive alongside the new `alignment-map.md`, `verdict.md`, and scribe-draft entries. The round-format doc becomes a contradiction: it says the team-lead writes `committee-analysis.md` AND that it writes `alignment-map.md`/`verdict.md`. Anyone reading the doc to understand the round-folder shape gets two incompatible answers.

**Evidence:**
- `skills/design-committee/references/committee-analysis-round-format.md` lines 49, 59, 73–74, 91, 93, 163 all reference `committee-analysis.md` as a current round artifact.
- Plan Task 6 Step 3 uses only "Add" — no removal instruction.
- The existing assertion `assert_round_format` line: `_check "round-format separates team-lead Final Recommendation" "grep -qi 'Final Recommendation' '$f'"` — this check STAYS GREEN because "Final Recommendation" is not removed, so no test catches the contradiction.

**Fix:** Task 6 Step 3 must explicitly say: remove `committee-analysis.md` from the Folder Shape, the How To Use steps, and the Template section, and replace with `alignment-map.md`, `verdict.md`, and the scribe-draft artifact. Add a corresponding assertion: `_check "round-format removes committee-analysis.md" "! grep -qi 'committee-analysis' '$f'"` (or weaker: check it appears only in a change-log note).

---

## Finding 3 — IMPORTANT — Task 7 scope does not cover two stale "digest" references in SKILL.md

**Confidence:** High (file read + plan scope)

**The problem.**
After all tasks complete, SKILL.md retains two "digest" references the plan's edits do not touch:

1. **Line 114** (Phase 4, One-Round-Format step 4): "sends the team-lead a digest (see `references/member-protocol.md`)" — this is inside Task 7's stated scope "Phase 3/4 (lines ~64-114)", but the plan's Step 3 description focuses only on adding the new eight-step sequence and mode selection. Whether the implementer rewrites the existing One-Round-Format step 4 is unstated.

2. **Line 137** (Integration section, Reads list): "member-protocol.md (digest shape, transcript/round-folder discipline, committee-root resolution)" — the Integration section is at line 134–141 and is NOT listed in Task 7's scope (which covers Checklist lines ~46-51, Phase 2 lines ~60-63, Phase 3/4 lines ~64-114).

After Task 7, the `SKILL members send typed routing signal (not digest)` assertion passes (routing signal is in the new flow text), but the Integration section still says "digest shape" and Phase 4 step 4 still says "sends the team-lead a digest". This is a functional doc bug: the Integration section is what implementers read to understand what member-protocol.md owns.

**Evidence:**
- `skills/design-committee/SKILL.md` lines 114 and 137 contain "digest".
- Task 7 Step 3 names scope "Phase 2 (lines ~60-63), Phase 3/4 (lines ~64-114)" and "Update description". No mention of the Integration section.
- No assertion checks for `! grep -qi 'digest shape'` on SKILL.md.

**Fix:** Task 7 Step 3 must add "Integration section (lines ~134-141)" to its scope, update the Reads entry from "digest shape" to "routing-signal discipline", and update Phase 4 One-Round-Format step 4. Add a negative assertion: `_check "SKILL no stale digest-shape reference in Integration" "! grep -qi 'digest shape' '$f'"`.

---

## Finding 4 — IMPORTANT — AC-3 checkpoint enforcement is undertested: only SKILL.md is asserted, team-lead.md is not

**Confidence:** High (test file read + spec)

**The problem.**
Spec §6 constraint 12: "A disk-artifact checkpoint is enforced between every step — each dispatch carries the prior artifact path as a required input field."

The only test assertion for this constraint is in Task 7's `assert_skill_md`:
```bash
_check "SKILL enforces disk-artifact checkpoint between steps" "grep -qiE 'checkpoint|prior artifact path' '$f'"
```

Task 3 Step 3 says to add checkpoint behavior to `team-lead.md` ("each step's dispatch carries the prior step's artifact path as a required input field; absence blocks the next dispatch"), but Task 3 adds NO test assertion for this in `assert_team_lead`. A passing SKILL.md check does not prove team-lead.md carries the enforcement instruction. An implementer could write a vague gesture in team-lead.md ("use artifacts from prior steps") that satisfies a human reader but misses the "absence blocks" requirement entirely, and the suite stays green.

**Evidence:**
- `tests/test-design-committee-context-economy.sh` lines 52–60 (`assert_team_lead`): no checkpoint assertion.
- Plan Task 3 Step 1 (assertions): four new checks added, none reference checkpoint or "prior artifact path".
- Spec §8 AC-3: "absence blocks the next dispatch."

**Fix:** Task 3 Step 1 should add: `_check "team-lead enforces artifact checkpoint between steps" "grep -qiE 'checkpoint|prior artifact path|absence blocks' '$f'"`.

---

## Finding 5 — IMPORTANT — "member-protocol has citable section headings" check is NOT removed; after Task 1 it checks '## Digest shape' which is GONE

**Confidence:** High (test file line 17, plan Task 1 replacement scope)

**The problem.**
The EXISTING `assert_member_protocol` (lines 11–19) includes:
```bash
_check "member-protocol has citable section headings" "grep -q '## Digest shape' '$f' && grep -q '## Committee root resolution' '$f'"
```

Task 1 Step 1 says to "Replace `assert_member_protocol` body with" a new function body. The new body correctly replaces this check with:
```bash
_check "member-protocol has citable section headings" "grep -q '## Committee root resolution' '$f'"
```

This is handled — the full function body replacement is explicit in the plan. **BUT** the plan describes the function body as spanning "lines 11-19". The actual function body in the test file is lines 11–19 (closing brace at line 19, the next function `assert_consolidator` starts at line 20). This is accurate.

The concern: the plan must perform a TRUE block replacement (not just append lines). If the implementer appends rather than replaces (a common mistake with "Replace X with Y" instruction), the old `## Digest shape` check survives alongside the new checks and fails after the doc edit. The plan's TDD discipline (Step 2: "confirm fail") only confirms that the new checks fail — it does not confirm the old `## Digest shape` check was removed. After the doc edit, the new checks pass, but the old one now also FAILS (because `## Digest shape` is gone), making the test FAIL even though the doc edit is correct.

**Evidence:**
- Test line 17: `_check "member-protocol has citable section headings" "grep -q '## Digest shape' '$f' && grep -q '## Committee root resolution' '$f'"`
- Plan Task 1: "Replace `assert_member_protocol` body with" (full block shown)
- `member-protocol.md` line 17: `## Digest shape` heading

**Fix:** The plan is correct in intent (full replacement), but the commit step should verify the old `## Digest shape` check is absent from the test file. Acceptable as-is if the implementer replaces the full block, but no guard against partial edit.

---

## Finding 6 — IMPORTANT — `assert_scope_and_vocab` Mode A/B loop does not include the new scribe agent

**Confidence:** High (test file line 77, plan Task 5)

**The problem.**
`assert_scope_and_vocab` (lines 72–80) iterates over a hardcoded list of committee files including `consolidator.md` and the four advocacy agents, but NOT `design-committee-scribe.md`. After Task 5 creates the scribe agent, its Mode A/B compliance is checked only by `assert_scribe`'s `! grep -qE 'Mode [AB]' '$f'`. If a future edit introduces "Mode A" or "Mode B" language to the scribe, `assert_scope_and_vocab` will not catch it.

This is a coverage gap rather than an immediate failure (the scribe template in the plan has no Mode A/B text). The plan does not update `assert_scope_and_vocab` to include the scribe.

**Evidence:**
- `tests/test-design-committee-context-economy.sh` line 77: `for f in "$SK/SKILL.md" ... "$AG"/design-committee-{conservator,innovator,pragmatist,purist,researcher,consolidator}.md`
- Plan Task 5 Step 1: adds `assert_scribe` but no update to `assert_scope_and_vocab`.

**Fix:** Task 5 Step 1 should also update the `assert_scope_and_vocab` loop to include `"$AG/design-committee-scribe.md"`.

---

## Finding 7 — IMPORTANT — Task 7 two-place sync is stated as conditional but the trigger condition is not verifiable from the plan

**Confidence:** Medium (plan text + SKILL.md description)

**The problem.**
Task 7 Step 4: "If `description` changed, update `skills/setup-start/references/skill-index.md:27` to match."

The plan's Task 7 Step 3 says "Update `description` if trigger wording changed" — leaving this as implementer judgment. The existing description in SKILL.md:

> "Convene six-role committee (team-lead + 4 members + researcher) for ad-hoc design consultations. Process-agnostic primitive. Use whenever designer wants independent multi-perspective review..."

The description does not currently reference "digest" or any concept being renamed by this sprint. If the description is NOT updated (which the plan permits), the `skill-index.md:27` sync is skipped — and no test catches whether `skill-index.md` entry matches the SKILL.md description. No existing assertion checks description-to-skill-index parity.

**Evidence:**
- `skills/design-committee/SKILL.md` lines 3–6: description field (does not mention digest or old concepts).
- `skills/setup-start/references/skill-index.md` line 27: the `design-committee` entry.
- Plan Task 7 Step 4: conditional sync "only if description changes."

**Fix:** The plan should state explicitly whether the description changes (likely it does not, since the trigger wording is about "convene committee" not about internal process). If it does not change, Step 4 should say "description unchanged — no sync needed" rather than leaving it conditional. This prevents an implementer from making a gratuitous description edit that then requires a skill-index sync they might miss.

---

## Finding 8 — Minor — Spec constraint 3 (verbatim copy of Final Position fields) has no test assertion in Task 2

**Confidence:** High (test file + spec)

**The problem.**
Spec §6 constraint 3: "The consolidator copies member-authored fields verbatim — no summarizing, no selection." After Task 2 changes the consolidator to read only `## Final Position`, the relevant verbatim requirement applies to those fields specifically. Task 2's new assertion only checks:

```bash
_check "consolidator reads only Final Position section" "grep -qi 'Final Position' '$f'"
```

It does not check that the consolidator's output instruction says to copy Final Position fields verbatim (not summarize them). The existing "verbatim notable quotes" text in the consolidator passes a generic verbatim check, but that applies to the old notable-quotes section, not to the new Final Position field copy requirement.

**Evidence:**
- `agents/design-committee-consolidator.md` lines 57–63: verbatim language applies to "notable quotes" output, not to member-authored position/rationale/blocking_risk fields.
- Spec §6 constraint 3 is distinct from constraint 4 (enumerate-only ceiling).
- Plan Task 2 adds no assertion for "verbatim" applied to Final Position fields.

**Fix:** Task 2's new assertion should add: `_check "consolidator copies Final Position fields verbatim" "grep -qiE 'verbatim' '$f'"` (already passes on existing file, but the plan's Step 3 adds the Final-Position-specific verbatim instruction, so this becomes load-bearing for constraint 3). Weak but better than nothing.

---

## Verified Assumptions (correct — reduces implementer uncertainty)

- **Baseline suite is all-green** (61 checks PASS) before any edit. Confirmed by running the test.
- **team-lead.md version is v0007**, matching the plan's stated starting point for the v0007→v0008 bump.
- **SKILL.md version is v0017**, matching Task 7's stated v0017→v0018 bump.
- **`design-committee-scribe.md` does not exist**, so Task 5 Step 2 ("confirm fail") on `[ -f '$f' ]` will correctly be red.
- **`artifact-template.md` does not exist**, so Task 4 Step 2 will correctly be red.
- **`util-artifact-schema`** has no committee artifact entry that would override the `skills/design-committee/references/artifact-template.md` default path.
- **Task 1 full-function-replacement scope** (lines 11–19) is accurate — the closing brace is at line 19.
- **`assert_scope_and_vocab` does not check scribe** (hardcoded brace expansion, confirmed by grep), so creating the scribe file will not fail the existing scope-and-vocab check.
- **All Task 3 assertion regex patterns** (alignment-map+evict, verdict.md, reject+malformed, read+artifact+present) match the plan's prose when simulated against the strings the plan says to write.
- **All Task 1 assertion regex patterns** (200-word, routing signal, reject, status, transcript, 200-word, peer-dm via section heading `## Peer-DM`) match against the strings the plan says to write.

---

## Risk Assessment

The plan lands cleanly on its primary TDD mechanics — all stated assertion patterns are syntactically valid and will go red/green as described. The single most dangerous finding is **Finding 2**: Task 6 adds new artifacts to round-format.md without removing the old `committee-analysis.md` pipeline, creating an internally contradictory doc that no test assertion catches (the `Final Recommendation` presence check stays green precisely because the old text is not removed). Findings 3 and 4 are also load-bearing: two stale "digest" references in SKILL.md survive Task 7, and the checkpoint enforcement rule in team-lead.md has no test assertion to ensure it was actually written. Together these mean the sprint can pass all tests while leaving the round-format doc self-contradictory and the team-lead's checkpoint behavior untestable.

---

## Change Log

- 2026-06-06 — Initial attack. Eight findings (2 Critical, 4 Important, 2 Minor). Most dangerous: Task 6 add-not-replace leaves round-format.md with contradictory OLD and NEW pipeline descriptions.
