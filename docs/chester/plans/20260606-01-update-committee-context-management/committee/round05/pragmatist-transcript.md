# Pragmatist — transcript (verbatim, abridged) — round05
# Stance: Accept what's real breakage; reject/defer what's cosmetic; give cheapest sufficient form of F2 and F3

## Position

Lens: every finding earns its fix by answering "what breaks in a live committee run if we skip this?" Marginal hardening that doesn't prevent live breakage adds plan bloat and raises implementer decision budget without adding value.

---

### F1 — [attack-Critical stated, but actually NOT a real failure per attack text]

Attack reviewer checked this one and concluded: "No assertion correctness failure here. Documented because regex looks fragile but works." The smell reviewer separately flags test-prose coupling as a broader class.

Verdict for F1 as an isolated finding: **REJECT as a standalone fix**. The attack itself said it's not a real failure. The underlying concern (prose-coupled greps) is real and captured in F7 — don't duplicate it.

---

### F2 — [smell-HIGH] Final Position schema reproduced in 5 files

The smeller's framing is correct: distributing `{position, rationale, blocking_risk}` + the 200-word cap across member-protocol (definition), consolidator agent (consumes), team-lead.md (consumes), SKILL.md (references), test assertions, and scribe (copies verbatim) is the exact drift class this sprint diagnoses one layer up. The smeller is right that member-protocol already serves as the single authority for committee-root resolution — apply the same discipline here.

Cheapest sufficient form: member-protocol.md defines the schema once with exact field names. Consolidator, team-lead.md, and SKILL.md cite `references/member-protocol.md § Final Position` (one-line citation, no field restatement). The test's field-grep assertions (`blocking_risk`, `rationale`, `position`) live ONLY in `assert_member_protocol` — remove duplicated greps from other assert functions. The scribe copies verbatim from consolidator-output, not from the schema definition, so no schema reproduction in the scribe agent.

Edit cost: add citation language to Task 2 (consolidator), Task 3 (team-lead.md), Task 7 (SKILL.md) steps — roughly one sentence each, not a new file. Remove any duplicated field-name greps from the other assert functions. This is one inserted sentence per consuming task plus test cleanup — total: low.

**ACCEPT.** Cheapest form: "cite, don't restate" in each consuming file. One schema definition in member-protocol, one-line citation in each consumer. Test: field greps only in assert_member_protocol.

---

### F3 — [residue class] Three sub-items

**(a) Stale "digest" in SKILL.md Integration section and Phase 4 step 4.**
Attack correctly identifies these survive Task 7 as currently scoped. Both are in task 7's reachable scope (the plan's Step 3 focus doesn't explicitly name them, but the Integration section is adjacent). Cost of fix: add explicit scope to Task 7 Step 3 ("update Integration section Reads entry from 'digest shape' to 'routing-signal discipline'; update Phase 4 One-Round-Format step 4 from 'digest' to 'typed routing signal'") plus one negative assertion `! grep -qi 'digest shape'` in `assert_skill_md`. Low cost, prevents a live behavioral gap.
**ACCEPT (a).** Task 7 Step 3 add explicit Integration + Phase4 scope; Task 7 Step 1 add negative digest-shape assertion.

**(b) Member agent files (conservator/innovator/pragmatist/purist/researcher) still say "digest" after Task 1 kills the concept.**
Verified: all five agent files use "digest" in multiple locations, citing `§ Digest shape` of member-protocol which Task 1 removes. After Task 1, a live committee member reads its own agent file and sees instructions to "send the team-lead a digest" pointing at a section that no longer exists. This is a silent live breakage path.

Cheapest sufficient form: **NOT a per-agent full edit.** The agent files each say `digest per references/member-protocol.md § Digest shape`. After Task 1 renames that section to `## Routing signal (member → team-lead)`, the citation is broken. The cheapest fix is: a single vocabulary-ban assertion in `assert_scope_and_vocab` — `! grep -qi 'digest shape'` across the member agent files — so that any surviving stale citation fails the test. Then Task 1 adds a sub-step to search-replace "digest" → "routing signal" across member agent files (4+1 files, each has ~3 occurrences). This is more than one sentence, but less than a full new task — it's a step in Task 1.

Full per-agent content rewrite is over-decomposition; the citation chain fix is enough.
**ACCEPT (b). Cheapest form: Task 1 adds a step to update "digest" → "routing signal" citation in the five member agent files; assert_scope_and_vocab adds `! grep -qi 'digest shape'` for all committee agent files.**

**(c) Closure stamp target still committee-analysis.md.**
Team-lead.md Closure (line 130) stamps `committee/roundNN/committee-analysis.md`. After this sprint, the designer-facing artifact is the scribe draft; committee-analysis.md is superseded. Task 3 says "adjust Closure" but gives no concrete stamp target list — so the implementer might leave it wrong.
**ACCEPT (c). Task 3 Step 3 must explicitly list new stamp targets: alignment-map.md, verdict.md, scribe draft artifact path. One sentence added to the step.**

---

### F4 — [attack] Task 3 no checkpoint assertion for team-lead.md

Attack is correct: spec constraint 12 requires checkpoint enforcement in team-lead.md, but Task 3 adds no test assertion for it. The SKILL.md assertion in Task 7 doesn't proxy for team-lead.md. Cost: one `_check` line in Task 3 Step 1. Negligible edit cost; prevents the checkpoint requirement from being unverifiable.

**ACCEPT.** Task 3 Step 1: add `_check "team-lead enforces artifact checkpoint between steps" "grep -qiE 'checkpoint|prior artifact path|absence blocks' '$f'"`.

---

### F5 — [attack] Task 1 replace-vs-append hazard

Attack verdict: the plan is correct in intent (full block replacement), but no guard against partial edit. The attack self-resolves: TDD discipline (Step 2 red confirms) catches append-but-not-replace — if `## Digest shape` check survives, it goes GREEN on existing file (hasn't been removed yet) and fails AFTER the doc edit (section is gone). That means Step 4 ("confirm pass") would show both old and new results, not "ALL PASS". So the TDD discipline IS the guard. Additionally, attack confirmed "full function body replacement is explicit in the plan."

Cost of an explicit warning step: negligible. Worth adding one verification sentence to Task 1 Step 5 commit to grep for absence of `## Digest shape` in the test file. But not a new assertion.

**ACCEPT as minor.** Add a verification note to Task 1 Step 5: "Verify `## Digest shape` is absent from the test file before committing." Minimal plan edit.

---

### F6 — [attack+smell] assert_scope_and_vocab doesn't include scribe + template

Both attack and smell flag this. Cost: extend the brace expansion in the loop by two filenames. One-line change in Task 5 Step 1 (create assert_scribe) or Task 7. Low cost, correct coverage.

**ACCEPT.** Task 5 Step 1: extend assert_scope_and_vocab loop to add `"$AG/design-committee-scribe.md"`. Artifact template is in `references/`, not `$AG/`, so if the template is included in the vocab sweep the path is different — low value to add template.md to the Mode A/B sweep (template is Markdown structure, not a runtime prompt). Add only the scribe agent.

---

### F7 — [smell] Test-prose coupling: brittle greps

Smell is real and ongoing. ACCEPT the principle; the form matters. Refactoring ALL existing greps is scope expansion the plan doesn't need. The actionable version: for NEW assertions being written in Tasks 1, 3, 4, 5, 7, prefer structural anchors (section headers, filename strings, version patterns) over prose-phrase greps where a structural hook exists. Where no structural hook exists, accept prose coupling and add a comment marking it as intentionally prose-coupled. Do NOT refactor existing passing assertions — if they're green and have been green, leave them.

**ACCEPT (principle only, for new assertions).** No existing assertions rewritten. Each new-assertion step notes: prefer header/filename anchor; mark prose-coupled ones explicitly.

---

### F8 — [smell] Scribe hardcodes template path

Smell: plan has scribe agent body hardcode `skills/design-committee/references/artifact-template.md`. Researcher confirmed this is the correct path and util-artifact-schema doesn't override it. The path will not change unless someone moves the file. Pragmatist ruling: the researcher confirmed the path is stable and correct. A runtime-input approach adds one more field to the dispatch protocol without material benefit — the team-lead would have to know the path anyway to pass it, and the template is a skill-internal file with a stable location.

**REJECT.** The path is stable, researcher-confirmed, skill-internal. Adding a dispatch input field for it is unnecessary complexity. This is over-engineering for a vanishingly small risk.

---

### F9 — [smell] Two-round mode tested in SKILL.md only; team-lead.md two-round branch untested

Smell is real: team-lead.md gets a two-round branch in Task 3, but assert_team_lead has no assertion for it. Cost: one `_check` line in Task 3 Step 1. Low cost, tests a real behavioral branch.

**ACCEPT.** Task 3 Step 1: add `_check "team-lead defines two-round mode branch" "grep -qiE 'two-round|revision pass|alignment.map.*feedback' '$f'"`.

---

### F10 — [researcher] 7 anchors off 1-2 lines

Researcher verdict: all body ranges are accurate; header lines are 1-2 off. All section identities are correct. No material drift.

**REJECT.** Not actionable. Researcher already said "no blocker." Anchor drift of 1-2 header lines doesn't affect the edit — implementer uses section header as the locator, not line number.

---

### Summary ruling table

| Finding | Ruling | Form |
|---|---|---|
| F1 | REJECT | Attack self-resolved it; real concern folded into F7 |
| F2 | ACCEPT | cite-not-restate per consuming file; test field-greps only in assert_member_protocol |
| F3a | ACCEPT | Task 7 Step 3 explicit Integration scope + negative assertion |
| F3b | ACCEPT | Task 1 step: update 5 member agents digest→routing-signal; vocab ban in assert_scope_and_vocab |
| F3c | ACCEPT | Task 3 Step 3 explicit stamp target list |
| F4 | ACCEPT | One _check in Task 3 Step 1 |
| F5 | ACCEPT (minor) | Verification note in Task 1 Step 5 only |
| F6 | ACCEPT | Extend assert_scope_and_vocab brace expansion in Task 5 |
| F7 | ACCEPT (principle only) | New assertions use structural anchors; no existing rewrite |
| F8 | REJECT | Path stable and researcher-confirmed; dispatch complexity not justified |
| F9 | ACCEPT | One _check in Task 3 Step 1 |
| F10 | REJECT | Researcher says no blocker; header drift is cosmetic |

Accepts: 7 (F2, F3a, F3b, F3c, F4, F5, F6, F7, F9). Rejects: 3 (F1, F8, F10).

### Contested findings — expanded rationale

**F2 cheapest form vs. full rewrite:** The alternative is to leave the schema reproduced in each file (current plan). That's 5 drift targets for any future schema rename — exactly the class of problem the sprint exists to fix. The cheapest fix (one-line citation per consumer + test consolidation) costs less than a new task and prevents the drift. Worth it.

**F3b member agents — cheap ban vs. full rewrite:** Full per-agent rewrite of all "digest" occurrences is needed because the citation broken by Task 1 would leave member agents pointing at a nonexistent section. The vocabulary ban alone (! grep 'digest shape') helps catch regressions but doesn't fix the broken reference. The Task 1 step must do a targeted find-replace in each agent file: "digest per `references/member-protocol.md` § Digest shape" → "typed routing signal per `references/member-protocol.md` § Routing signal". This is 3-4 occurrences per file × 5 files = 15 targeted substitutions. Still cheap enough to be a Task 1 sub-step, not a new task.

## Final Position

**position:** Accept 7 findings, reject 3. Accepts: F2 (cite-not-restate schema in consuming files), F3a (Task 7 Integration scope + negative assert), F3b (Task 1 member-agent digest→routing-signal find-replace + vocab ban), F3c (Task 3 explicit stamp targets), F4 (one checkpoint assert in Task 3), F5 (verification note in Task 1 commit step), F6 (extend scope-and-vocab sweep to include scribe), F7 (structural-anchor principle for new assertions only), F9 (two-round assert in Task 3). Rejects: F1 (attack self-resolved), F8 (template path stable per researcher), F10 (anchor drift cosmetic per researcher). Total: 0 new tasks; all fixes are sub-steps or one-line additions to existing tasks.

**rationale:** Every accepted fix addresses either a live-run breakage (F3b: broken citation after Task 1; F3c: wrong stamp target) or a verifiability gap (F4: checkpoint; F9: two-round branch). Rejected findings had no live-run breakage and no verifiability gap (F1: attack self-resolved; F8: path stable; F10: cosmetic). F7 is accepted as a principle but produces no rewrites — new assertions only. The hardening round stays zero new tasks.

**blocking_risk:** Accepting F3b as a Task 1 sub-step makes Task 1 the longest task in the plan — if the member-agent find-replace produces unexpected text (e.g., one agent has a different phrasing), the implementer must improvise. Splitting F3b to its own task would isolate that risk but adds one task to the plan.
