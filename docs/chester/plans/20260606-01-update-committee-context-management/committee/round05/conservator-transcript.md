# Conservator Transcript — Round 05
# Sprint: 20260606-01-update-committee-context-management
# Date: 2026-06-06
# Role: CONSERVATOR — defend existing contracts, minimize disruption, preserve what currently works

---

## Lens statement

My job: rule each finding ACCEPT/REJECT/DEFER through the conservator lens — defend existing skill contracts, minimize disruption, prefer additive fixes over rewrites, flag any incorporation that expands scope beyond the spec's implementation surface.

---

## F1 — [attack-Critical] Task 6 adds but never removes committee-analysis.md → contradictory round-format doc

**Ruling: ACCEPT.**

The attack reviewer correctly identifies that Task 6 Step 3 says "Add" not "Replace." After Task 6, the round-format doc describes both the old pipeline (committee-analysis.md as the team-lead artifact) and the new one (alignment-map.md, verdict.md, scribe draft) simultaneously. A reader gets two incompatible answers about what a round folder contains.

The attack reviewer also correctly notes that no test assertion catches this: the `assert_round_format` check `grep -qi 'Final Recommendation'` stays green precisely because the old text is not removed. This is a real defect — the artifact is in a post-sprint state where the doc is self-contradictory and the test is blind to it.

Fix is minimal and bounded: change Task 6 Step 3 from "Add" to "Replace" with explicit removal instructions for committee-analysis.md references in Folder Shape, How To Use steps, and Template section. Add one negative assertion: `_check "round-format removes committee-analysis.md" "! grep -qi 'committee-analysis' '$f'"`.

This does not expand scope — it just makes the "replace" intent of the spec explicit. The fix is additive to the plan (one sentence of instruction + one test line). ACCEPT.

**Concrete plan edit:** Task 6 Step 3: "Remove all `committee-analysis.md` references from Folder Shape, the How To Use section, and the Template section. Replace with `alignment-map.md` (synthesize output), `verdict.md` (converge output), and the scribe-draft artifact in pipeline order." Task 6 Step 1 assertion-add: `_check "round-format removes committee-analysis.md" "! grep -qi 'committee-analysis' '$f'"`.

---

## F2 — [smell-HIGH] Final Position schema in 5 files = the drift this sprint fixes, reproduced

**Ruling: ACCEPT (constrained form).**

This is the most important structural finding. The smell reviewer's diagnosis is correct: if `{position, rationale, blocking_risk}` + 200-word cap is stated verbatim in member-protocol, consolidator, team-lead, SKILL, and test, then renaming any field touches six files. This is structurally identical to the committee-analysis.md drift the sprint is correcting.

The fix the smeller proposes is the right pattern: member-protocol already owns committee-root resolution as the single authority. Apply the same discipline to the Final Position schema — member-protocol defines it once; consolidator, team-lead, and SKILL cite `§ Final Position` (per member-protocol); the test checks only the section header in those files, and the field-name greps live only in `assert_member_protocol`.

**Conservator constraint:** the incorporation must not expand the scope of edits to member-protocol beyond what the spec already requires. The spec already requires member-protocol to define the `## Final Position` section with `{position, rationale, blocking_risk}` fields (constraints 5, 6). So the single-source refactor is fully within spec scope — it just changes how the other files reference it.

**Concrete plan edit:**
- In Task 2 (consolidator): change the consolidator instruction from "copy `{position, rationale, blocking_risk}` fields" to "copy the fields of the `## Final Position` section, per `references/member-protocol.md § Final Position`"; the test assertion checks `## Final Position` header presence (already planned) + `member-protocol.*Final Position` citation.
- In Task 3 (team-lead): instead of restating the three field names, have team-lead.md cite "member-authored fields per `references/member-protocol.md § Final Position`"; test assertion checks `Final Position` (already catches this).
- In Task 7 (SKILL.md): SKILL.md's reference to the schema should be a cite, not a restatement.
- The test's field-name greps (`blocking_risk`, `rationale`) remain only in `assert_member_protocol`. Other file asserts check only that they cite the section, not that they restate the fields.

This reduces the plan's decision budget for Tasks 2 and 3 (simpler edits — cite, don't restate) and eliminates the multi-file field-rename risk permanently. ACCEPT.

---

## F3 — [residue class] (a) stale "digest" in SKILL.md Integration + Phase4 step4 survive Task 7; (b) member agent files still say "digest"; (c) Closure stamp target still committee-analysis.md

**Ruling: SPLIT.**

**F3a — stale "digest" in SKILL.md Integration section and Phase4 step4: ACCEPT.**

The attack reviewer (Finding 3) verified the exact locations: SKILL.md line 114 (Phase 4, One-Round-Format step 4: "sends the team-lead a digest") and line 137 (Integration Reads list: "member-protocol.md (digest shape, transcript/round-folder discipline, committee-root resolution)"). Both are within the spec §9 implementation surface for SKILL.md. Task 7's scope statement covers "Phase 3/4 (lines ~64-114)" and "Integration section (lines ~134-141)" needs to be added explicitly.

Fix: add "Integration section (lines ~134-141)" to Task 7 Step 3 scope. Add negative assertion: `_check "SKILL no stale digest-shape reference in Integration" "! grep -qi 'digest shape' '$f'"`.

**F3b — member agent files (conservator/innovator/pragmatist/purist/researcher) still say "digest": ACCEPT (lightweight form).**

This is a correctness gap. The smell reviewer is right that member agent files reference "digest" (e.g. conservator agent line 10 "before sending each team-lead-facing digest"). Task 1 removes the digest concept from member-protocol, which those agents cite. If the agents still say "digest" and member-protocol now calls it "routing signal," there is a vocabulary conflict that will confuse a live committee participant.

However — the conservator lens applies here. The member agent files are NOT in spec §9's implementation surface. The smeller proposes two options: (a) add a Task 1 step updating all five agent files, or (b) lighter: add a vocab ban to `assert_scope_and_vocab`. Option (b) alone is insufficient — it would ban the word "digest" in those files but the ban going red would require a doc edit anyway, so we might as well do the edit proactively. Option (a) adds scope.

Conservator position: add a sub-step to Task 1 (not a new task) that updates the five member agent files' references from "digest" to "routing signal" where they describe the member→TL channel. This is a two-word change per file, scoped to the member-protocol cite. The sub-step adds `! grep -qiE '\bdigest\b' '$f'` to `assert_advocacy_agents` and `assert_researcher_agent`. This is within the spirit of Task 1 (it is the same vocabulary change) and does not create a new task or expand scope beyond the spec's direction.

**F3c — Closure stamp target still committee-analysis.md: ACCEPT.**

The smeller correctly flags that team-lead.md Closure stamps `committee/roundNN/committee-analysis.md`, which is superseded after this sprint. Task 3 says "adjust Closure to account for the new round-folder artifacts" but does not list the new stamp targets explicitly. This will result in an implementer making the stamp target ambiguous or wrong.

Fix: Task 3 Step 3 must explicitly list the new stamp targets as: `alignment-map.md`, `verdict.md`, scribe draft. Deprecate `committee-analysis.md` stamp. This is within Task 3's scope (the Closure section is already listed). Add a test assertion: `_check "team-lead closure stamps new artifacts" "grep -qiE 'stamp.*alignment-map|stamp.*verdict' '$f'"`.

---

## F4 — [attack] Task 3 adds NO checkpoint-enforcement assertion for team-lead.md (AC-3 tested via SKILL only)

**Ruling: ACCEPT.**

The attack reviewer is correct. Spec §8 AC-3 says "absence blocks the next dispatch" — this is a behavioral requirement on the team-lead, not just a description in SKILL.md. Task 3 Step 3 says to add checkpoint behavior to team-lead.md, but Task 3 Step 1 adds no assertion for it. An implementer could write a soft gesture ("use prior artifacts") that satisfies a human reader but misses the "absence blocks" language, and the test suite stays green.

Fix: add to Task 3 Step 1's new assertions: `_check "team-lead enforces artifact checkpoint between steps" "grep -qiE 'checkpoint|prior artifact path|absence blocks' '$f'"`.

This is a single assertion line. ACCEPT.

---

## F5 — [attack] Task 1 replace-vs-append hazard: if implementer appends, old "## Digest shape" check survives

**Ruling: ACCEPT (plan note only, no structural change).**

The attack reviewer identifies a real implementation risk: the plan says "Replace `assert_member_protocol` body with" a new block, but if the implementer appends instead of replaces, the old `## Digest shape` check survives and breaks after the doc edit.

The plan's TDD Step 2 ("confirm fail") catches whether the new assertions are red, but does NOT catch whether the old check is still present. After the doc edit, both the new checks pass AND the old `## Digest shape` check fails — causing the test to FAIL even though the edit is correct.

The attack reviewer says this is "acceptable as-is if the implementer replaces the full block, but no guard against partial edit." The conservator agrees: this is a documentation clarity issue, not a structural plan gap. The fix is a note in Task 1 Step 1, not a structural plan change.

Fix: add a parenthetical to Task 1 Step 1: "(This is a full replacement — the entire assert_member_protocol function body is replaced, not extended. After Step 1, verify the old `## Digest shape` check is absent from the test file before running Step 2.)"

Minimal. ACCEPT.

---

## F6 — [attack+smell] assert_scope_and_vocab file list not updated for new scribe + template files

**Ruling: ACCEPT.**

Both attack (Finding 6) and smell (Finding 6) agree: the brace-expansion in `assert_scope_and_vocab` does not include the scribe agent or artifact template. After Task 5, the scribe's Mode A/B compliance is checked only by `assert_scribe`. If a future edit introduces "Mode A" to the scribe, the scope-and-vocab sweep misses it.

The attack reviewer also notes that `assert_scribe` does include `! grep -qE 'Mode [AB]' '$f'` as one of its checks — so the scribe IS currently covered for this sprint. The gap is future coverage.

Fix: Task 5 Step 1 should also update `assert_scope_and_vocab`'s hardcoded list to include `"$AG/design-committee-scribe.md"`. The artifact template does not contain runtime-relevant vocabulary (it's a template with comments), so including it in the vocab sweep is less critical — but including it is harmless. Include both.

This is a two-line change in the test. ACCEPT.

---

## F7 — [smell] test-prose coupling: brittle greps that break on reword without behavior change

**Ruling: PARTIAL ACCEPT.**

The smeller is correct that prose-coupled greps are brittle. The specific patterns flagged:
- `grep -qiE '200[ -]word'` — breaks if "≤200 words" or "capped at 200 words"
- `grep -qiE 'peer.?dm'` — the attack reviewer confirmed this one works (space is matched by `.`); functionally sound
- `grep -qiE 'reject .*(malformed|signal)'` — passive "malformed signals are rejected" fails; word-order contract
- `grep -qi 'routing signal'` duplicated in member-protocol AND SKILL assertions

**Conservator position:** refactoring all assertions is scope expansion that risks introducing new bugs in the test itself. But the smeller identifies a legitimate breakage risk for the `reject .*(malformed|signal)` pattern specifically — passive voice in the doc would fail this check even though the behavior is correctly specified.

Minimal fix: change `grep -qiE 'reject .*(malformed|signal)'` to `grep -qiE '(reject|malformed).*(signal|reject)'` or better: `grep -qiE 'malformed.*reject|reject.*malformed'` → both word orders match. The `200[ -]word` pattern is low priority (the plan's Step 3 specifies exactly "200-word cap" in the text to write, so this check is fine for this sprint). The `routing signal` duplication is fine — it's testing two files, both appropriately.

Full prose-coupling refactor to header/filename anchors is a smell-class improvement that is not required for this sprint. Defer the broader refactor; accept only the `reject/malformed` pattern fix.

**Concrete plan edit:** In Task 3 Step 1, change the rejection check to: `_check "team-lead rejects malformed signals" "grep -qiE 'malformed.*(signal|reject)|reject.*(malformed|signal)' '$f'"`.

PARTIAL ACCEPT.

---

## F8 — [smell] scribe hardcodes template path → pass as runtime input instead

**Ruling: ACCEPT.**

The smeller is right: scribe agent body hardcodes `skills/design-committee/references/artifact-template.md`. If the template moves (or if a different template is needed for a different artifact type), the scribe silently uses the wrong path. The researcher confirmed the default path is valid for this sprint, but the coupling is structural.

The fix is clean and bounded: the team-lead passes the template path as a runtime input field at scribe dispatch (alongside verdict.md), rather than baking it into the agent prompt. The scribe's Required inputs section lists `artifact-template.md` as "path provided by team-lead at dispatch" instead of a hardcoded path. The Task 5 test assertion already greps for `template` (not the path), so the test stays green either way.

This is a small scope change to Task 5 Step 3 — one line of the scribe's Required inputs section changes. It also requires one line in Task 3 (team-lead.md: when dispatching scribe, include the template path as a required input field alongside verdict.md). Minimal. ACCEPT.

---

## F9 — [smell] two-round tested in one file (SKILL) → add assertion to assert_team_lead

**Ruling: ACCEPT.**

The smeller is correct. The two-round mode branch is described in SKILL.md (tested by `assert_skill_md`) and in team-lead.md's Per-Round Flow (Task 3), but `assert_team_lead` has no assertion for it. If team-lead.md's two-round branch drifts untested, the behavior can silently regress.

Fix is minimal: add to Task 3 Step 1 assertions: `_check "team-lead documents two-round mode" "grep -qiE 'two-round|revision pass|alignment.map.*feedback|alignment-map.*fed.*back' '$f'"`.

One assertion line. ACCEPT.

---

## F10 — [researcher] 7 header anchors off by 1-2 lines → cosmetic correction

**Ruling: ACCEPT (cosmetic, no structural change).**

The researcher verified all seven header anchor discrepancies — all off by 1-2 lines, all in the header line only (body ranges are accurate). This is a cosmetic cleanup: update the plan's "~line N" claims to match actual line numbers. The researcher confirmed no body-range errors; the plan reliably targets the right sections.

Fix: update the seven anchor claims in the plan document to reflect actual header locations (member-protocol `## Digest shape` → line 17 not ~18; `## Transcript` → line 43 not ~44; team-lead Per-Round Flow header → line 98 not ~99; team-lead Closure header → line 123 not ~122; round-format Folder Shape → line 38 not ~39; round-format Template → line 99 not ~100; SKILL.md Checklist → line 44 not ~46).

These are documentation corrections only. No impact on execution. ACCEPT.

---

## Big-picture conservator check

Findings accepted across both attack and smell: F1, F2, F3a, F3b (lightweight), F3c, F4, F5 (note only), F6, F7 (partial), F8, F9, F10.

None of the accepted findings expand scope beyond the spec's §9 implementation surface:
- F1, F3a, F4, F5, F7 are editorial corrections to existing task instructions.
- F2 reduces duplication; it does NOT add new content — it redirects other files to cite what member-protocol already defines.
- F3b is a vocabulary update to five files, as a sub-step of Task 1.
- F3c clarifies existing Task 3 closure instruction.
- F6 adds two filenames to an existing test sweep.
- F8 changes one line in the scribe's required-inputs section.
- F9 adds one test assertion to Task 3.
- F10 is cosmetic anchor corrections.

No findings rejected as scope-expanding. No findings deferred (all are bounded fixes).

**Total: 10 ACCEPT (8 full, 1 partial, 1 note-only), 0 REJECT, 0 DEFER.**

---

## Final Position

**position:** Accept all 10 findings. None expand scope beyond the spec's §9 surface. The highest-priority incorporations, in order: F1 (round-format add→replace, prevents self-contradictory doc), F2 (single-source Final Position schema, prevents the exact drift class this sprint targets), F3b (member-agent digest→routing-signal cleanup, prevents silent live breakage), F4 (team-lead checkpoint assertion). The remainder are editorial corrections or additive test coverage. F10 is cosmetic. The full incorporation set nets a more defensible plan with no new tasks and no structural reorganization.

**rationale:** Every finding is either a bounded test assertion, a one-line doc instruction clarification, or a vocabulary alignment that the spec already mandates (routing-signal over digest). The conservator lens does not require rejecting valid hardening; it requires ensuring hardening does not silently expand scope. None of these do. The plan's dependency graph is unchanged. The commit count and task count are unchanged.

**blocking_risk:** If F2 (single-source schema) is adopted, the five non-member-protocol files become citation-only; if the citation heading `§ Final Position` ever changes, all five files break in the same way — trading multi-field drift for single-heading coupling, not eliminating coupling entirely.

---

<!-- conservator / round05 / 2026-06-06 -->
