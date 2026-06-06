# Consolidator output — round 05

## Alignment

Per-finding tally (ACCEPT / REJECT / DEFER) across 4 members, with majority verdict and dissent notes.

Note: Purist's F7 and F8 address different attack findings than the other three members. Purist's F7 = "two-place sync conditional" and Purist's F8 = "consolidator verbatim assertion missing Final Position specificity" — these are labeled per Purist's own numbering. The other three members' F7 = "test-prose coupling" and F8 = "scribe hardcodes template path." The tally below follows the majority-shared finding labels (F1–F10 as used by Conservator, Innovator, Pragmatist). Purist's unique F7 and F8 rulings are noted in the per-finding rows where they diverge.

| Finding | ACCEPT | REJECT | DEFER | Majority | Dissent / Split notes |
|---------|--------|--------|-------|----------|-----------------------|
| F1 | 3 (Conservator, Innovator, Purist) | 1 (Pragmatist) | 0 | ACCEPT | Pragmatist REJECTS: "Attack self-resolved it; real concern folded into F7." Pragmatist: "Attack reviewer checked this one and concluded: 'No assertion correctness failure here.'" |
| F2 | 4 (Conservator, Innovator, Pragmatist, Purist) | 0 | 0 | ACCEPT (unanimous) | — |
| F3a | 4 (Conservator, Innovator, Pragmatist, Purist) | 0 | 0 | ACCEPT (unanimous) | — |
| F3b | 4 (Conservator, Innovator, Pragmatist, Purist) | 0 | 0 | ACCEPT (unanimous) | — |
| F3c | 4 (Conservator, Innovator, Pragmatist, Purist) | 0 | 0 | ACCEPT (unanimous) | — |
| F4 | 4 (Conservator, Innovator, Pragmatist, Purist) | 0 | 0 | ACCEPT (unanimous) | — |
| F5 | 2 (Conservator-note, Pragmatist-minor) | 1 (Innovator) | 1 (Purist) | SPLIT | Innovator REJECTS: "TDD red-step guards it already." Purist DEFERS: "plan is correct" and "Adding more guard language would be describing the plain meaning of 'replace'." Conservator accepts as "plan note only." Pragmatist accepts as "minor" (verification note only). |
| F6 | 4 (Conservator, Innovator, Pragmatist, Purist-partial) | 0 | 0 | ACCEPT (unanimous; Purist partial — scribe yes, template no) | Purist partial: rejects template inclusion. "The artifact template is a structural template, not a behavioral agent." Pragmatist also excludes template: "low value to add template.md to the Mode A/B sweep." |
| F7 (test-prose coupling) | 3 partial (Conservator-partial, Innovator-partial, Pragmatist-principle-only) | 0 | 0 | ACCEPT (partial, unanimous among the three members who addressed this finding) | Purist addresses a different F7 ("two-place sync conditional") — ACCEPT for that finding. No member fully rejects F7-prose-coupling; all accept in partial/limited form. |
| F8 (scribe hardcodes template path) | 2 (Conservator, Innovator) | 1 (Pragmatist) | 0 | SPLIT | Pragmatist REJECTS: "The path is stable, researcher-confirmed, skill-internal. Adding a dispatch input field for it is unnecessary complexity." Purist addresses a different F8 ("consolidator verbatim assertion") — ACCEPT for that finding. |
| F9 | 4 (Conservator, Innovator, Pragmatist, Purist) | 0 | 0 | ACCEPT (unanimous) | — |
| F10 | 1 (Conservator) | 1 (Pragmatist) | 2 (Innovator, Purist) | SPLIT/DEFER | Innovator DEFERS: "No action — cosmetic, body ranges correct." Purist DEFERS: "Plans reference sections by identity, not by absolute line number." Pragmatist REJECTS: "Researcher says no blocker; header drift is cosmetic." Conservator ACCEPTS as "cosmetic, no structural change." |

---

## Per-member summary

- **Conservator:** Accept all 10 findings (8 full, 1 partial, 1 note-only); no rejections, no defers; every finding is a bounded fix within the spec's §9 implementation surface.
- **Innovator:** Accept 9 findings (F1, F2, F3a/b/c, F4, F6, F7-partial, F8, F9); reject F5 (TDD discipline already guards it); defer F10 (cosmetic, body ranges correct).
- **Pragmatist:** Accept 7 findings (F2, F3a, F3b, F3c, F4, F5-minor, F6, F7-principle, F9); reject 3 (F1 attack self-resolved, F8 path stable per researcher, F10 cosmetic per researcher).
- **Purist:** Accept 9 of 11 findings (F1, F2, F3a, F3b, F3c, F4, F6-partial, F7-unique, F8-unique, F9); defer 2 (F5 plan correct, F10 anchor drift harmless); reject 0.

---

## Notable quotes

- **Conservator:** "If F2 (single-source schema) is adopted, the five non-member-protocol files become citation-only; if the citation heading `§ Final Position` ever changes, all five files break in the same way — trading multi-field drift for single-heading coupling, not eliminating coupling entirely."
- **Innovator:** "F2 is load-bearing because it prevents the sprint from reproducing the exact drift class it exists to fix."
- **Pragmatist:** "Every accepted fix addresses either a live-run breakage (F3b: broken citation after Task 1; F3c: wrong stamp target) or a verifiability gap (F4: checkpoint; F9: two-round branch)."
- **Purist:** "F2 is the strongest because it reproduces the sprint's own diagnosed failure one layer down."

---

## Blocking_risk fields — verbatim

- **Conservator:** "If F2 (single-source schema) is adopted, the five non-member-protocol files become citation-only; if the citation heading `§ Final Position` ever changes, all five files break in the same way — trading multi-field drift for single-heading coupling, not eliminating coupling entirely."
- **Innovator:** "If F2 is over-scoped — if 'cite member-protocol' is read as 'also eliminate flow descriptions from SKILL.md' — Task 7 becomes ambiguous and scope-creep threatens the sprint boundary. The plan edit for F2 must explicitly state that only field-name restatement moves to single-source; flow orchestration stays in SKILL.md."
- **Pragmatist:** "Accepting F3b as a Task 1 sub-step makes Task 1 the longest task in the plan — if the member-agent find-replace produces unexpected text (e.g., one agent has a different phrasing), the implementer must improvise. Splitting F3b to its own task would isolate that risk but adds one task to the plan."
- **Purist:** "F2 citation discipline adds implementation surface — 4-5 files must cite rather than restate, and the test must verify citation presence rather than field name presence; if the citation greps are too loose they pass on any mention of 'member-protocol' regardless of whether the schema context is there."

---

## Agreed form of accepted fixes — verbatim from positions

**F1 — Task 6 replace not add (3 ACCEPT, 1 REJECT):**

- Conservator: "Task 6 Step 3: 'Remove all `committee-analysis.md` references from Folder Shape, the How To Use section, and the Template section. Replace with `alignment-map.md` (synthesize output), `verdict.md` (converge output), and the scribe-draft artifact in pipeline order.' Task 6 Step 1 assertion-add: `_check "round-format removes committee-analysis.md" "! grep -qi 'committee-analysis' '$f'"`."
- Innovator: "Task 6 Step 3 must be reworded from 'Add ... to the Folder Shape and Template' to: 'Replace the old pipeline in the Folder Shape, How To Use steps 3–4, and Template section with the new pipeline.'" and "Task 6 Step 1 must add a negative assertion: `_check "round-format removes committee-analysis.md" "! grep -qi 'committee-analysis.md' '$f'"`."
- Purist: "Task 6 Step 3 instruction changes from 'add... to the Folder Shape listing and Template section' to 'REPLACE: remove all committee-analysis.md entries from the Folder Shape, How To Use steps, and Template section; add alignment-map.md, verdict.md, and scribe-draft artifact in their place, in pipeline order.'" and "`_check "round-format removes committee-analysis (superseded)" "! grep -qi 'committee-analysis' '$f'"`"

**F2 — Single-source Final Position schema (unanimous ACCEPT):**

- Conservator concrete edits: "In Task 2 (consolidator): change the consolidator instruction from 'copy `{position, rationale, blocking_risk}` fields' to 'copy the fields of the `## Final Position` section, per `references/member-protocol.md § Final Position`'"; "In Task 3 (team-lead): instead of restating the three field names, have team-lead.md cite 'member-authored fields per `references/member-protocol.md § Final Position`'"; "In Task 7 (SKILL.md): SKILL.md's reference to the schema should be a cite, not a restatement."
- Innovator: "member-protocol.md owns and defines the schema fully: header, fields (`position`, `rationale`, `blocking_risk`), 200-word cap, `blocking_risk` semantics. This is authoritative." and "Test impact: the field-name greps (`position`, `rationale`, `blocking_risk`) should be ONLY in `assert_member_protocol`. Other task assertions check for the section-header citation (`references/member-protocol.md`) rather than field names."
- Pragmatist: "Cheapest sufficient form: member-protocol.md defines the schema once with exact field names. Consolidator, team-lead.md, and SKILL.md cite `references/member-protocol.md § Final Position` (one-line citation, no field restatement). The test's field-grep assertions (`blocking_risk`, `rationale`, `position`) live ONLY in `assert_member_protocol` — remove duplicated greps from other assert functions."
- Purist: "member-protocol.md §Final Position is the SOLE definition of the schema: exact header, last section, 200-word cap, `{position, rationale, blocking_risk}`, blocking_risk definition." and "The test keeps field-name greps (`blocking_risk`, `rationale`, `200`) ONLY in `assert_member_protocol`. `assert_consolidator`, `assert_team_lead`, `assert_skill_md` each check for the CITATION (e.g., `grep -qi 'member-protocol' '$f' && grep -qi 'Final Position' '$f'`), not for field names restated."

**F3a — Task 7 Integration scope + negative assertion (unanimous ACCEPT):**

- Conservator: "add 'Integration section (lines ~134-141)' to Task 7 Step 3 scope. Add negative assertion: `_check "SKILL no stale digest-shape reference in Integration" "! grep -qi 'digest shape' '$f'"`."
- Innovator: "Task 7 must explicitly add Integration section (lines ~134-141) to its scope and replace 'digest shape' → 'routing-signal discipline.' Add negative assertion: `! grep -qi 'digest shape' '$f'`."
- Pragmatist: "Task 7 Step 3 add explicit Integration scope; Task 7 Step 1 add negative digest-shape assertion."
- Purist: "Task 7 Step 3: add 'Integration section (lines ~134-141)' to the edit scope." and "Task 7 Step 1: add negative assertion `_check "SKILL no stale digest-shape reference in Integration" "! grep -qi 'digest shape' '$f'"`."

**F3b — Member agent digest→routing-signal (unanimous ACCEPT):**

- Conservator: "add a sub-step to Task 1 (not a new task) that updates the five member agent files' references from 'digest' to 'routing signal' where they describe the member→TL channel. This is a two-word change per file, scoped to the member-protocol cite. The sub-step adds `! grep -qiE '\bdigest\b' '$f'` to `assert_advocacy_agents` and `assert_researcher_agent`."
- Innovator: "the fix belongs in Task 1 as an additional step: after editing member-protocol, also update the five member agent files to replace 'digest' with 'typed routing signal.' Add to Task 1's commit: `git add agents/design-committee-{conservator,innovator,pragmatist,purist,researcher}.md`."
- Pragmatist: "Task 1 adds a sub-step to search-replace 'digest' → 'routing signal' across member agent files (4+1 files, each has ~3 occurrences)." and "assert_scope_and_vocab adds `! grep -qi 'digest shape'` for all committee agent files."
- Purist: "Task 1 Step 3: add a sub-step updating all five member agent files (conservator, innovator, pragmatist, purist, researcher). Replace 'digest' vocabulary with 'routing signal' vocabulary where it appears in the send-to-team-lead instruction."

**F3c — Closure stamp targets (unanimous ACCEPT):**

- Conservator: "Task 3 Step 3 must explicitly list the new stamp targets as: `alignment-map.md`, `verdict.md`, scribe draft." and "Add a test assertion: `_check "team-lead closure stamps new artifacts" "grep -qiE 'stamp.*alignment-map|stamp.*verdict' '$f'"`."
- Innovator: "Task 3 Step 3 must explicitly list new stamp targets: `alignment-map.md`, `verdict.md`, and the scribe draft path (as provided by the scribe's return message). Deprecate the `committee-analysis.md` stamp."
- Pragmatist: "Task 3 Step 3 must explicitly list new stamp targets: alignment-map.md, verdict.md, scribe draft artifact path."
- Purist: "Task 3 Step 3: explicitly state the new stamp targets for Closure: `committee/roundNN/alignment-map.md`, `committee/roundNN/verdict.md`, and the scribe draft artifact path. Remove committee-analysis.md from the stamp target list."

**F4 — Team-lead checkpoint assertion (unanimous ACCEPT):**

- Conservator: "`_check "team-lead enforces artifact checkpoint between steps" "grep -qiE 'checkpoint|prior artifact path|absence blocks' '$f'"`"
- Innovator: "`_check "team-lead enforces artifact checkpoint between steps" "grep -qiE 'checkpoint|prior artifact path|absence blocks' '$f'"`"
- Pragmatist: "`_check "team-lead enforces artifact checkpoint between steps" "grep -qiE 'checkpoint|prior artifact path|absence blocks' '$f'"`"
- Purist: "`_check "team-lead enforces artifact checkpoint between steps" "grep -qiE 'checkpoint|prior artifact path|absence blocks' '$f'"`"

**F5 — Replace-vs-append hazard (SPLIT: 2 limited-accept, 1 reject, 1 defer):**

- Conservator (note only): "add a parenthetical to Task 1 Step 1: '(This is a full replacement — the entire assert_member_protocol function body is replaced, not extended. After Step 1, verify the old `## Digest shape` check is absent from the test file before running Step 2.)'"
- Innovator (REJECT): "The TDD red-step (Step 2: confirm fail) guards against append-only error because the old `## Digest shape` check would fail post-Step 3 if not removed — the test would be red, signaling the implementer to fix it."
- Pragmatist (minor): "Add a verification note to Task 1 Step 5: 'Verify `## Digest shape` is absent from the test file before committing.'"
- Purist (DEFER): "The attack doc itself concludes this is 'handled' — the plan says 'Replace X body with' and shows the full replacement block."

**F6 — assert_scope_and_vocab extend for scribe (unanimous ACCEPT; template inclusion split):**

- Conservator: "Task 5 Step 1 should also update `assert_scope_and_vocab`'s hardcoded list to include `'$AG/design-committee-scribe.md'`."
- Innovator: "Task 5 Step 1 must also update `assert_scope_and_vocab` to include `'$AG/design-committee-scribe.md'`." and "Task 4 Step 1 should add `'$SK/references/artifact-template.md'` to the sweep."
- Pragmatist: "Task 5 Step 1: extend assert_scope_and_vocab loop to add `'$AG/design-committee-scribe.md'`." (excludes template)
- Purist: "Task 5 Step 1: add scribe agent to the `assert_scope_and_vocab` loop: extend the brace expansion to include `design-committee-scribe.md`." (rejects template)

**F7 — Test-prose coupling / per Purist: two-place sync conditional (SPLIT per finding interpretation):**

- Conservator (partial): "change `grep -qiE 'reject .*(malformed|signal)'` to `grep -qiE 'malformed.*reject|reject.*malformed'`" and "In Task 3 Step 1, change the rejection check to: `_check "team-lead rejects malformed signals" "grep -qiE 'malformed.*(signal|reject)|reject.*(malformed|signal)' '$f'"`."
- Innovator (partial): "'reject .*(malformed|signal)' → REPLACE. ... `grep -qiE 'malformed.*reject|reject.*malformed|signal.*reject' '$f'` — allow more word orderings."
- Pragmatist (principle only): "for NEW assertions being written in Tasks 1, 3, 4, 5, 7, prefer structural anchors (section headers, filename strings, version patterns) over prose-phrase greps where a structural hook exists."
- Purist (unique F7): "Task 7 Step 4: replace 'If `description` changed, update skill-index.md' with 'Description unchanged (trigger wording does not reference internal process concepts). No skill-index sync needed.'"

**F8 — Scribe template path / per Purist: consolidator verbatim assertion (SPLIT per finding interpretation):**

- Conservator (ACCEPT-scribe-template): "the team-lead passes the template path as a runtime input field at scribe dispatch (alongside verdict.md), rather than baking it into the agent prompt."
- Innovator (ACCEPT-scribe-template): "In Task 5's scribe agent definition, the Required inputs section changes: remove the hardcoded path string for the template; add `artifact-template path` as a required input field alongside verdict.md."
- Pragmatist (REJECT-scribe-template): "The path is stable, researcher-confirmed, skill-internal. Adding a dispatch input field for it is unnecessary complexity. This is over-engineering for a vanishingly small risk."
- Purist (unique F8 — consolidator verbatim assertion): "Task 2 Step 1: add `_check "consolidator copies Final Position fields verbatim" "grep -qiE 'verbatim' '$f'"`."

**F9 — Two-round branch assertion in assert_team_lead (unanimous ACCEPT):**

- Conservator: "`_check "team-lead documents two-round mode" "grep -qiE 'two-round|revision pass|alignment.map.*feedback|alignment-map.*fed.*back' '$f'"`"
- Innovator: "`_check "team-lead two-round branch described" "grep -qiE 'two-round|revision pass|alignment.map.*feedback' '$f'"`"
- Pragmatist: "`_check "team-lead defines two-round mode branch" "grep -qiE 'two-round|revision pass|alignment.map.*feedback' '$f'"`"
- Purist: "`_check "team-lead two-round branch includes member revision pass" "grep -qiE 'two-round|revision pass|alignment.map.*feedback' '$f'"`"

**F10 — 7 anchor lines off 1-2 (SPLIT: 1 accept-cosmetic, 1 reject, 2 defer):**

- Conservator (ACCEPT-cosmetic): "update the seven anchor claims in the plan document to reflect actual header locations (member-protocol `## Digest shape` → line 17 not ~18; `## Transcript` → line 43 not ~44; team-lead Per-Round Flow header → line 98 not ~99; team-lead Closure header → line 123 not ~122; round-format Folder Shape → line 38 not ~39; round-format Template → line 99 not ~100; SKILL.md Checklist → line 44 not ~46)."
- Innovator (DEFER): "No action — cosmetic, body ranges correct."
- Pragmatist (REJECT): "Not actionable. Researcher already said 'no blocker.' Anchor drift of 1-2 header lines doesn't affect the edit."
- Purist (DEFER): "Plans reference sections by identity, not by absolute line number. All section identities are correct per researcher. No material drift."
