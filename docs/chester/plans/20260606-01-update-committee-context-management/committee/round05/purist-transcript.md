# Purist — Round 05 Transcript
# Sprint: 20260606-01-update-committee-context-management
# Role: Incorporate hardening findings into plan-00
# Date: 2026-06-06

---

## Files Read

- plan/20260606-01-update-committee-context-management-plan-00.md
- committee/round05/attack-findings.md
- committee/round05/smell-findings.md
- committee/round05/researcher-ground-truth.md

---

## Lens Statement

Purist lens applied: single-source-of-truth, category cleanliness, no contradictory/duplicated contracts. An ambiguous or duplicated contract is a failure mode, not a preference — it produces untestable behavior and divergent implementations. Every ruling below is made on that principle, not on implementation convenience.

---

## F1 — Task 6 adds not removes committee-analysis.md: ACCEPT

**Finding (attack F2):** Task 6 Step 3 says "add" new artifacts. The existing committee-analysis.md entries in round-format.md (Folder Shape, How To Use, Template section) survive, producing a doc that simultaneously describes two incompatible pipelines.

**Ruling: ACCEPT. The fix is categorical removal, not coexistence.**

The round-format doc is the single authority for what a round folder contains. Two conflicting pipeline descriptions in that document are not "transitional" — they are permanently contradictory. Anyone reading round-format.md after Task 6 gets two valid-looking answers for what the team-lead writes. That is the definition of ambiguous single-source-of-truth.

**Required plan edit:**
Task 6 Step 3 instruction changes from "add... to the Folder Shape listing and Template section" to "REPLACE: remove all committee-analysis.md entries from the Folder Shape, How To Use steps, and Template section; add alignment-map.md, verdict.md, and scribe-draft artifact in their place, in pipeline order."

Task 6 Step 1 adds a negative assertion:
```bash
_check "round-format removes committee-analysis (superseded)" "! grep -qi 'committee-analysis' '$f'"
```
The existing positive check `grep -qi 'Final Recommendation'` is also REMOVED — "Final Recommendation" is old pipeline vocabulary that should not survive.

---

## F2 — Final Position schema in 5 files: ACCEPT (strongest ruling)

**Finding (smell F2):** `{position, rationale, blocking_risk}` + 200-word cap will be restated in member-protocol.md (def), consolidator (consumes), team-lead.md (consumes), SKILL.md (references), test assertions, and scribe agent. This is the exact multi-copy drift class the sprint fixes one level up, reproduced in the files being edited.

**Ruling: ACCEPT. Single-source discipline is mandatory, not optional.**

The committee-root resolution pattern (member-protocol.md §Committee root resolution, cited everywhere, restated nowhere) is already in this codebase precisely to prevent this class of problem. The pattern exists. Apply it.

**The rule:**
- member-protocol.md §Final Position is the SOLE definition of the schema: exact header, last section, 200-word cap, `{position, rationale, blocking_risk}`, blocking_risk definition.
- consolidator.md, team-lead.md, SKILL.md, and scribe agent do NOT restate field names or cap numbers. They cite: "per `references/member-protocol.md` § Final Position" or equivalent. The citation is sufficient — the reader follows the link.
- The test keeps field-name greps (`blocking_risk`, `rationale`, `200`) ONLY in `assert_member_protocol`. `assert_consolidator`, `assert_team_lead`, `assert_skill_md` each check for the CITATION (e.g., `grep -qi 'member-protocol' '$f' && grep -qi 'Final Position' '$f'`), not for field names restated.

**Required plan edit:**
- Task 1 Step 3: member-protocol.md §Final Position is the complete schema definition.
- Task 2 Step 3: consolidator edit adds citation to member-protocol §Final Position; does NOT restate `{position, rationale, blocking_risk}` inline.
- Task 3 Step 3: team-lead edit cites member-protocol §Final Position for schema; does not restate fields.
- Task 7 Step 3: SKILL.md references cite member-protocol §Final Position; does not restate.
- Scribe agent (Task 5): cites member-protocol §Final Position for schema; copies blocking_risk verbatim "per member-protocol §Final Position."
- Test assertions: field-name greps stay in `assert_member_protocol` only; citation greps added to other assert functions.

---

## F3 — Residue class (three sub-items)

### F3a — Stale "digest" in SKILL.md: ACCEPT

**Finding (attack F3):** Two stale "digest" references survive Task 7: line 114 (One-Round-Format step 4: "sends the team-lead a digest") and line 137 (Integration section: "digest shape, transcript/round-folder discipline"). Task 7 scope explicitly covers Phase 3/4 (lines ~64-114) but not the Integration section.

**Ruling: ACCEPT.** A vocabulary mismatch between the flow text (which uses "routing signal" after Task 7) and the Integration section (which still says "digest shape") is a contradictory contract. The Integration section is exactly what a skill author reads to understand what member-protocol.md owns — it must be accurate.

**Required plan edit:**
- Task 7 Step 3: add "Integration section (lines ~134-141)" to the edit scope. Update the Reads entry from "digest shape, transcript/round-folder discipline" to "routing-signal discipline, transcript/round-folder discipline, committee-root resolution."
- Task 7 Step 1: add negative assertion `_check "SKILL no stale digest-shape reference in Integration" "! grep -qi 'digest shape' '$f'"`.

### F3b — Member agent files still say "digest": ACCEPT

**Finding (smell F5):** Four advocacy agents + researcher still reference "digest" (e.g., conservator line 10: "before sending each team-lead-facing digest"). Task 1 kills the concept in member-protocol but nothing updates the agent files.

**Ruling: ACCEPT. Task 1 is the correct home.** The concept changes in Task 1. The member agent files encode that concept. A member agent saying "send a digest" after Task 1 lands is a behavioral contradiction — during a live committee run, the member is instructed by its agent file, not by member-protocol.md alone. Silent breakage in live runs is the exact failure mode.

**Required plan edit:**
- Task 1 Step 3: add a sub-step updating all five member agent files (conservator, innovator, pragmatist, purist, researcher). Replace "digest" vocabulary with "routing signal" vocabulary where it appears in the send-to-team-lead instruction. This is a targeted word-level edit, not a full rewrite.
- Task 1 Step 1 (test assertion): add `_check "advocacy agents use routing signal not digest" "! grep -qi 'digest' '$AG/design-committee-conservator.md' && ! grep -qi 'digest' '$AG/design-committee-innovator.md' && ! grep -qi 'digest' '$AG/design-committee-pragmatist.md' && ! grep -qi 'digest' '$AG/design-committee-purist.md' && ! grep -qi 'digest' '$AG/design-committee-researcher.md'"` — or add a vocabulary ban to `assert_scope_and_vocab`. Scope-and-vocab sweep is the cleaner home since it already enforces Mode A/B bans across agents; add "digest" to that ban list for the agent files.
- Task 1 files block: add "Modify: `agents/design-committee-{conservator,innovator,pragmatist,purist,researcher}.md` — replace digest→routing-signal vocabulary."

### F3c — Closure stamp target still committee-analysis.md: ACCEPT as REMOVE

**Finding (smell F7):** team-lead.md Closure stamps committee-analysis.md. After this sprint, committee-analysis.md is superseded; the new artifacts are alignment-map.md, verdict.md, and scribe draft.

**Ruling: ACCEPT. Remove committee-analysis.md from the stamp list; do not let it coexist.**

This is the same categorical answer as F1: coexistence of old and new pipeline artifacts in the same authoritative document is not transitional, it is contradictory. The Closure stamp list is the authority for what gets stamped. committee-analysis.md should not appear there after this sprint.

**Required plan edit:**
- Task 3 Step 3: explicitly state the new stamp targets for Closure: `committee/roundNN/alignment-map.md`, `committee/roundNN/verdict.md`, and the scribe draft artifact path. Remove committee-analysis.md from the stamp target list. The plan's current "adjust Closure" is too vague to prevent the wrong stamp target surviving.

---

## F4 — AC-3 checkpoint assertion missing from team-lead.md: ACCEPT

**Finding (attack F4):** Task 3 implements AC-3 but adds no test assertion for the checkpoint rule in team-lead.md. A vague implementation passes human review but misses "absence blocks."

**Ruling: ACCEPT.** AC-3 is listed as Implements for Task 3. A task that claims to implement an AC but provides no test handle for that AC's most load-bearing clause ("absence blocks") is untestable. The fix is one line.

**Required plan edit:**
- Task 3 Step 1: add `_check "team-lead enforces artifact checkpoint between steps" "grep -qiE 'checkpoint|prior artifact path|absence blocks' '$f'"`.

---

## F5 — Replace-vs-append hazard in Task 1: DEFER

**Finding (attack F5):** Risk that implementer appends rather than replaces the assert_member_protocol body.

**Ruling: DEFER.** The attack doc itself concludes this is "handled" — the plan says "Replace X body with" and shows the full replacement block. Adding more guard language would be describing the plain meaning of "replace" in a plan that already has TDD discipline. The researcher confirms line ranges are exact. No plan edit warranted.

---

## F6 — assert_scope_and_vocab missing scribe agent: ACCEPT (partial)

**Finding (attack F6 / smell F6):** Scope-and-vocab sweep doesn't include the new scribe agent or the artifact template.

**Ruling: ACCEPT for scribe agent; REJECT for artifact template.** The scribe agent is a behavioral agent file — it must be swept for Mode A/B compliance and vocabulary discipline, same as other agent files. The artifact template is a structural template, not a behavioral agent. Mode A/B language appearing in the template body would be a template anomaly, not a behavioral agent violation. The sweep's purpose is behavioral agent vocabulary compliance; extending it to the template conflates categories.

**Required plan edit:**
- Task 5 Step 1: add scribe agent to the `assert_scope_and_vocab` loop: extend the brace expansion to include `design-committee-scribe.md`.

---

## F7 — Two-place sync conditional: ACCEPT (simplify)

**Finding (attack F7):** "If description changed, update skill-index.md" leaves implementer judgment on a known-answer question.

**Ruling: ACCEPT.** The description doesn't reference digest, routing signal, or any concept being renamed. It describes the committee's invocation triggers, which are unchanged. The conditional should resolve to "description unchanged — no sync needed" rather than leaving it open.

**Required plan edit:**
- Task 7 Step 4: replace "If `description` changed, update skill-index.md" with "Description unchanged (trigger wording does not reference internal process concepts). No skill-index sync needed."

---

## F8 — Consolidator verbatim assertion missing Final Position specificity: ACCEPT

**Finding (attack F8):** The existing verbatim language in consolidator.md applies to "notable quotes," not to Final Position field copying. Task 2 adds Final-Position-specific verbatim instruction but no corresponding assertion.

**Ruling: ACCEPT.** Spec constraint 3 is distinct from constraint 4. The assertion is one line.

**Required plan edit:**
- Task 2 Step 1: add `_check "consolidator copies Final Position fields verbatim" "grep -qiE 'verbatim' '$f'"`.

---

## F9 — Two-round tested in one file only: ACCEPT

**Finding (smell F4):** team-lead.md carries the two-round branch behavior but assert_team_lead has no two-round assertion.

**Ruling: ACCEPT.** The two-round branch is team-lead behavior, and team-lead behavior is tested in assert_team_lead. The pattern is consistent with other behavior assertions in that function.

**Required plan edit:**
- Task 3 Step 1: add `_check "team-lead two-round branch includes member revision pass" "grep -qiE 'two-round|revision pass|alignment.map.*feedback' '$f'"`.

---

## F10 — 7 anchor header lines off by 1-2: DEFER

**Finding (researcher):** Seven header line numbers in the plan are off by 1-2; all body ranges are accurate.

**Ruling: DEFER.** Plans reference sections by identity, not by absolute line number. All section identities are correct per researcher. No material drift. Plan edits targeting sections (not lines) will land correctly.

---

## Contested Question 1 — F2: exact citation discipline

The rule I adopt:

member-protocol.md §Final Position is the only place the schema fields are listed. Every other file that needs to reference the schema writes: "per `references/member-protocol.md` § Final Position" or equivalent. The test's field-name greps live only in `assert_member_protocol`. Other assert functions check for the citation string.

Why this is the right rule and not a softer "minimize duplication": the committee-root resolution pattern is already in this codebase as a proven instance. The pattern's exact form is: one authoritative section, citation-only elsewhere, one test assertion at the authority, citation check elsewhere. Applying the same pattern to Final Position is not a preference — it is applying the project's own established discipline consistently.

---

## Contested Question 2 — F3c: remove committee-analysis.md or let it coexist?

**Categorical stance: REMOVE.**

committee-analysis.md is the old pipeline's team-lead artifact. The new pipeline replaces it with alignment-map.md (synthesize output) + verdict.md (converge output) + scribe draft (authoring output). These three artifacts are not additions to committee-analysis.md — they are its replacements, each carrying one facet of what committee-analysis.md used to carry.

Allowing committee-analysis.md to coexist means:
- round-format.md describes two team-lead artifact pipelines (F1 above — contradictory)
- Closure stamps a file that may not exist (because the new flow doesn't produce it)
- Future readers cannot tell whether committee-analysis.md is still produced or not

The clean categorical move: remove committee-analysis.md from round-format.md's Folder Shape, How To Use, Template section, and from Closure's stamp target list. If a session existed that produced committee-analysis.md under the old process, that artifact remains on disk as a historical record — no cleanup required. The spec simply doesn't produce it anymore.

---

## Accept/Defer/Reject Summary

| Finding | Source | Ruling | Plan edit required |
|---------|--------|--------|--------------------|
| F1 (Task 6 add not remove) | attack-Critical | ACCEPT | Task 6 Step 3: replace not add; Task 6 Step 1: negative assertion |
| F2 (schema in 5 files) | smell-HIGH | ACCEPT | Tasks 1,2,3,5,7: cite member-protocol §Final Position; reroute test assertions |
| F3a (stale digest in SKILL.md) | attack-Important | ACCEPT | Task 7: add Integration section to scope + negative assertion |
| F3b (member agents say digest) | smell-LOW-MEDIUM | ACCEPT | Task 1: add member agent edits + vocab ban in assert_scope_and_vocab |
| F3c (Closure stamp committee-analysis.md) | smell-LOW | ACCEPT | Task 3: explicit new stamp targets, remove committee-analysis.md |
| F4 (AC-3 not tested in TL) | attack-Important | ACCEPT | Task 3 Step 1: add checkpoint assertion |
| F5 (replace-vs-append hazard) | attack-Important | DEFER | No plan edit — plan is correct |
| F6 (scope-and-vocab missing scribe) | attack+smell | ACCEPT (partial) | Task 5: add scribe to sweep; reject template inclusion |
| F7 (two-place sync conditional) | attack-Important | ACCEPT | Task 7 Step 4: resolve to "unchanged, no sync" |
| F8 (consolidator verbatim assertion) | attack-Minor | ACCEPT | Task 2 Step 1: add verbatim assertion |
| F9 (two-round in one file) | smell-MEDIUM | ACCEPT | Task 3 Step 1: add two-round assertion |
| F10 (7 anchor lines off by 1-2) | researcher | DEFER | No plan edit — body ranges correct |

Accepts: 9. Defers: 2. Rejects: 0.

---

## Final Position

**position:** Accept 9 of 11 findings; defer 2 (F5 replace-vs-append handled by existing plan; F10 anchor drift harmless). The two load-bearing structural accepts are F2 (single-source for Final Position schema — apply the committee-root citation pattern exactly) and F1+F3c (committee-analysis.md categorically removed, not coexisted with the new pipeline).

**rationale:** Every accept traces to a single principle: no duplicated or contradictory contract in an authoritative doc. F2 is the strongest because it reproduces the sprint's own diagnosed failure one layer down. F1 and F3c are the same categorical problem — an old and new pipeline description coexisting in round-format.md and Closure respectively. Removing committee-analysis.md entirely from the spec is correct because the new pipeline does not produce it; coexistence would require every future reader to determine which pipeline applies.

**blocking_risk:** F2 citation discipline adds implementation surface — 4-5 files must cite rather than restate, and the test must verify citation presence rather than field name presence; if the citation greps are too loose they pass on any mention of "member-protocol" regardless of whether the schema context is there.
