# Innovator — Round 05 Transcript
# Sprint: 20260606-01-update-committee-context-management
# Role: Innovator — cleanest structure, push single-source idea as far as it should go

---

## Task: Rule each finding ACCEPT / REJECT / DEFER

Innovator lens: existing structure re-makeable; push single-source discipline as far as it should go; challenge task boundaries that are awkward.

---

## F1 [attack-Critical] — Task 6 add-not-replace leaves round-format.md contradictory

**ACCEPT — structural fix required.**

The attack is correct. Task 6 Step 3 says "Add" without a corresponding remove instruction. The result is `committee-analysis-round-format.md` describing both the old pipeline (`committee-analysis.md` as team-lead artifact) and the new pipeline (`alignment-map.md` → `verdict.md` → scribe draft) simultaneously. That is not a "richer document" — it is an incorrect document. The existing assertion `grep -qi 'Final Recommendation'` stays green because the old text is not removed, so no test catches it.

**Concrete plan edit:**

Task 6 Step 3 must be reworded from "Add ... to the Folder Shape and Template" to: "Replace the old pipeline in the Folder Shape, How To Use steps 3–4, and Template section with the new pipeline." Specifically: remove `committee-analysis.md` from the Folder Shape listing, remove the "team-lead writes committee-analysis.md" step from How To Use, remove the `### committee-analysis.md` template block, and replace all three with `alignment-map.md`, `verdict.md`, and scribe-draft entries.

Task 6 Step 1 must add a negative assertion: `_check "round-format removes committee-analysis.md" "! grep -qi 'committee-analysis.md' '$f'"`.

This is F3b-adjacent: `committee-analysis.md` also appears in the team-lead.md Closure stamp target (F7/smell). Those are two separate edits in two separate tasks — F1 fixes the round-format doc, F7 fixes team-lead's stamp list.

---

## F2 [smell-HIGH] — Final Position schema in 5 files = drift reproduced

**ACCEPT — push the single-source discipline, but scope it correctly.**

This is the strongest structural finding and the one I push hardest. The sprint's rationale is "the artifact is the boundary; the enemy is invisible drift." Reproducing that exact drift class at the schema level in the same sprint is self-defeating.

The pattern already exists: member-protocol is the single authority for committee-root resolution (lines 78–89 of the current file). The same discipline should apply to the Final Position schema: member-protocol.md owns the schema definition; every other file that references it cites "schema per `references/member-protocol.md` § Final Position" instead of restating fields.

**How far does the citation discipline extend?**

- **member-protocol.md** — owns and defines the schema fully: header, fields (`position`, `rationale`, `blocking_risk`), 200-word cap, `blocking_risk` semantics. This is authoritative.
- **consolidator agent** — currently reads "only the `## Final Position` section." After F2, it does not need to name the individual fields; it cites the section and reads what it finds. The instruction becomes: "Read the member's `## Final Position` section (per `references/member-protocol.md` § Final Position`); copy fields verbatim." Clean — no field restating.
- **team-lead.md** — references what the signal routing produces and what the scribe receives. It does not need to enumerate `{position, rationale, blocking_risk}` — it can say "typed routing signal per `references/member-protocol.md` § Routing signal" and "Final Position schema per `references/member-protocol.md` § Final Position." Clean.
- **SKILL.md** — the per-round flow description references that members write a `## Final Position` section. It does not need to enumerate fields — just "ending with a mandatory `## Final Position` section (see `references/member-protocol.md` § Final Position for the full schema)." Clean.
- **scribe agent** — receives `consolidator-output.md` which already contains the Final Position fields. The scribe copies `blocking_risk` values verbatim from the consolidator output — it does not need to know the field names independently. The scribe's prohibition stays as written; no schema restatement needed.

**Does citation discipline mean SKILL.md stops restating the flow too?**

No — and this is the boundary. The flow steps (dispatch → members write → signal → consolidate → synthesize → converge → scribe → present) are orchestration, not schema. SKILL.md owns orchestration. Only the schema (field names, caps, semantics) moves to single-source. This is a targeted application of the principle, not a wholesale re-architecture. SKILL.md keeps its flow description; it just cites member-protocol for schema specifics instead of restating them inline.

**Concrete plan edit:**

Task 1: member-protocol.md defines the schema in full — no change to what goes into the file.
Task 2: consolidator agent — after the read-scoping edit, remove any field-name restatement; cite "§ Final Position" for schema.
Task 3: team-lead.md — routing-signal and Final Position references cite member-protocol section headers, not field names inline.
Task 7: SKILL.md per-round flow step cites member-protocol for schema; does not enumerate fields.

Test impact: the field-name greps (`position`, `rationale`, `blocking_risk`) should be ONLY in `assert_member_protocol`. Other task assertions check for the section-header citation (`references/member-protocol.md`) rather than field names — this is more robust (F7-smell aligned) because it tests the structural fact that the file cites the authority, not the incidental string that happens to appear.

---

## F3 [residue class] — (a) stale "digest" in SKILL.md, (b) member agents still say "digest," (c) Closure stamp target wrong

**F3a — ACCEPT (already covered by attack F3/Task 7 scope fix).**
Task 7 must explicitly add Integration section (lines ~134-141) to its scope and replace "digest shape" → "routing-signal discipline." Add negative assertion: `! grep -qi 'digest shape' '$f'`. The attack finding gives the exact text; just incorporate it.

**F3b — ACCEPT — member agent cleanup belongs in Task 1, not deferred.**
The four advocacy agents and the researcher agent currently describe "digest" (e.g., conservator: "before sending each team-lead-facing digest"). Task 1 kills the digest concept in member-protocol. Leaving the member agent files saying "digest" is a silent live breakage — a member running its agent file will see "send a digest" while member-protocol now says "send a typed routing signal." These are incompatible. 

The smeller is right: this is a correctness gap, not style drift. The fix belongs in Task 1 as an additional step: after editing member-protocol, also update the five member agent files to replace "digest" with "typed routing signal." Add to Task 1's commit: `git add agents/design-committee-{conservator,innovator,pragmatist,purist,researcher}.md`. Add to `assert_advocacy_agents` (or as new inline check in Task 1): `_check "advocacy agents ban digest vocabulary" "! grep -qi 'digest' '$f'"` run over each file. This is the right scope boundary — Task 1 defines the new routing-signal contract; Task 1 must also close out the old contract in every file that enacts it.

Does this make Task 1 too large? No. The member agent edits are each a one-line substitution ("digest" → "typed routing signal" in one sentence per file). The decision budget does not increase meaningfully. The commit is slightly larger but stays thematically unified: "kill the digest concept everywhere."

**F3c — ACCEPT (belongs in Task 3).**
Closure section currently stamps `committee/roundNN/committee-analysis.md`. After this sprint, `committee-analysis.md` is superseded by the alignment-map/verdict/scribe-draft pipeline. Task 3 Step 3 must explicitly list new stamp targets: `alignment-map.md`, `verdict.md`, and the scribe draft path (as provided by the scribe's return message). Deprecate the `committee-analysis.md` stamp. The smeller is correct that Task 3's current "adjust Closure" instruction is too vague — it needs to name the targets.

---

## F4 [attack] — Task 3 no checkpoint-enforcement assertion for team-lead.md

**ACCEPT — straightforward addition.**
The spec constraint 12 ("each dispatch carries the prior artifact path") should be testably enforced in team-lead.md, not only in SKILL.md. The attack's proposed assertion is correct:

`_check "team-lead enforces artifact checkpoint between steps" "grep -qiE 'checkpoint|prior artifact path|absence blocks' '$f'"`

Add to Task 3 Step 1. No controversy.

---

## F5 [attack] — Task 1 replace-vs-append hazard

**REJECT — the plan is correct in intent; this is a writer-discipline observation, not a plan defect.**
The attack itself says "The plan is correct in intent" and "Acceptable as-is if the implementer replaces the full block." The TDD red-step (Step 2: confirm fail) guards against append-only error because the old `## Digest shape` check would fail post-Step 3 if not removed — the test would be red, signaling the implementer to fix it. The discipline is already encoded. Adding a "verify old check is absent" instruction would be belt-and-suspenders that inflates the plan without improving the contract. The TDD cycle handles this.

**No plan edit needed.**

---

## F6 [attack+smell] — assert_scope_and_vocab file list not updated for scribe + template

**ACCEPT — simple and correct.**
The scribe agent and the artifact template are new files with vocabulary discipline requirements. The Mode A/B ban and any future vocab additions should sweep them. Adding both to the brace expansion in `assert_scope_and_vocab` is the right place. 

Concrete: Task 5 Step 1 must also update `assert_scope_and_vocab` to include `"$AG/design-committee-scribe.md"`. The artifact-template is a reference doc, not an agent — but it still should not contain banned vocabulary (Mode A/B). Task 4 Step 1 should add `"$SK/references/artifact-template.md"` to the sweep.

---

## F7 [smell] — Test-prose coupling: brittle greps

**PARTIAL ACCEPT — apply where robustness clearly improves; do not force structural anchors where none exist.**

The smeller is right that header/filename anchors are more robust than incidental prose greps. But not every rule has a structural hook. My ruling per assertion:

- `grep -qiE '200[ -]word'` → REPLACE with F2 resolution: after F2, the cap lives only in member-protocol.md, and the assertion there becomes the canonical one. No other file restates "200 words" — no other assertion needs it. Problem solved by F2, not by regex hardening.
- `grep -qiE 'peer.?dm'` → KEEP. The attack verified it works correctly against "peer DM" (space as the any-char). This is not fragile in practice.
- `grep -qiE 'reject .*(malformed|signal)'` → REPLACE. The smeller is right that passive voice ("malformed signals are rejected") fails. Replace with a structural check: the routing-signal section is citable by header in member-protocol, so `assert_member_protocol` can check `grep -q '## Routing signal' '$f'` as the primary structural anchor, plus `grep -qi 'reject' '$f'` as the behavior check. Team-lead.md's rejection behavior check becomes `grep -qiE 'malformed.*reject|reject.*malformed|signal.*reject' '$f'` — allow more word orderings.
- `grep -qi 'routing signal'` duplicated in member-protocol and SKILL.md asserts → after F2 resolution, member-protocol asserts the section header; SKILL.md asserts it cites member-protocol (a different structural fact). Not redundant — different assertions about different files. Keep both, but make them anchor-based.

**Concrete plan edit:** Primarily resolved by F2 (schema single-source removes the multi-file field-name greps). Routing-signal rejection pattern gets word-order flexibility fix.

---

## F8 [smell] — Scribe hardcodes template path → runtime input instead

**ACCEPT — correct structural direction.**

If the template moves (and the researcher confirmed location is uncertain enough that Task 4 says "confirm during the task"), the scribe agent silently uses a wrong path. Making the template path a runtime input field (passed by team-lead at dispatch alongside verdict.md) is the right pattern — it matches how verdict.md is passed, it removes the hardcoded coupling, and it gives the team-lead one place to configure both inputs. 

**Concrete plan edit:** In Task 5's scribe agent definition, the Required inputs section changes: remove the hardcoded path string for the template; add `artifact-template path` as a required input field alongside verdict.md. The team-lead.md dispatch instruction (Task 3) already says "dispatch scribe with verdict.md + annotated template + consolidator-output.md" — make the template reference a path field in the dispatch message, not baked into the agent file. No change to agent capability; just moves the path from static text to runtime field. Task 5's assertion `grep -qi 'template'` still passes (the word "template" appears in the inputs description). No new assertion needed.

---

## F9 [smell] — Two-round tested in one file only → add assert_team_lead check

**ACCEPT — correct but limited scope.**

Mode selection is defined at both SKILL.md (dispatch) and team-lead.md (two-round branch execution). Testing it only in SKILL.md leaves the team-lead.md two-round description drift-undetected. Add to Task 3 Step 1's `assert_team_lead` additions:

`_check "team-lead two-round branch described" "grep -qiE 'two-round|revision pass|alignment.map.*feedback' '$f'"`

This is narrow and won't fail on benign prose changes — "two-round" is specific enough to be a structural anchor, not incidental prose.

---

## F10 [researcher] — 7 header anchors off 1-2 lines

**DEFER — cosmetic, no action needed.**

The researcher's own verdict: "No blocker." Body ranges are accurate; header-line drift is 1–2 lines and harmless because the plan describes edits in terms of section content, not absolute line numbers. No plan edit needed. Log it as resolved-by-researcher.

---

## Cross-finding coherence check

F2 (single-source schema) and F7 (robust assertions) interact: once the schema fields live only in member-protocol.md, the multi-file field-name greps disappear naturally. F2 resolves most of F7's prose-coupling concern without separate regex surgery. This is the right order of resolution — fix the architecture, then the test assertions follow.

F3b (member agents say "digest") and F1 (round-format contradictory) are both residue-class problems: the plan adds new behavior without removing old behavior. Both get the same fix pattern: replace, not append. F3b belongs in Task 1; F1 belongs in Task 6.

F8 (scribe runtime template path) and F6 (vocab sweep) are both about new files the plan creates but doesn't fully integrate. Both belong in Tasks 4-5.

---

## Summary ruling

| Finding | Ruling | Plan edit location |
|---|---|---|
| F1 | ACCEPT | Task 6 Step 3 (replace, not add) + Task 6 Step 1 (negative assertion) |
| F2 | ACCEPT | Tasks 2, 3, 7 (cite member-protocol §Final Position); asserts in Tasks 2,3,7 check citation, not field names |
| F3a | ACCEPT | Task 7 Step 3 (Integration section scope) + Task 7 Step 1 (negative assertion) |
| F3b | ACCEPT | Task 1 Step 3 (update member agent files) + Task 1 Step 1 (advocacy-agents ban assertion) |
| F3c | ACCEPT | Task 3 Step 3 (explicit stamp targets) |
| F4 | ACCEPT | Task 3 Step 1 (checkpoint assertion) |
| F5 | REJECT | No plan edit — TDD red-step guards it already |
| F6 | ACCEPT | Task 4 Step 1 + Task 5 Step 1 (extend vocab sweep) |
| F7 | PARTIAL ACCEPT | Resolved primarily by F2; routing-signal rejection regex gets word-order fix in Task 3 Step 1 |
| F8 | ACCEPT | Task 5 (scribe Required inputs → runtime template path field); Task 3 (team-lead dispatch specifies template path) |
| F9 | ACCEPT | Task 3 Step 1 (assert_team_lead two-round check) |
| F10 | DEFER | No action — cosmetic, body ranges correct |

Total: 9 ACCEPT (1 partial), 1 REJECT, 1 DEFER.

---

## Final Position

**position:** Accept 9 findings (F1, F2, F3a/b/c, F4, F6, F7-partial, F8, F9), reject F5, defer F10. F2 (single-source schema) is the structural move that matters most — it corrects an architectural self-contradiction in the sprint by applying the same authority pattern member-protocol already uses for committee-root resolution.

**rationale:** F2 is load-bearing because it prevents the sprint from reproducing the exact drift class it exists to fix. The fix is bounded: member-protocol owns the schema definition; every other file cites the section header instead of restating fields. This is not a re-architecture — SKILL.md keeps its flow; only field-name restatement moves to single-source. F3b (member agents still say "digest") is a live correctness gap that belongs in Task 1, not deferred. F1 (round-format add-not-replace) and F8 (scribe hardcoded template path) are structural problems the plan should catch but doesn't. F5 is rejected because the TDD red-step already guards against the append hazard the attack describes.

**blocking_risk:** If F2 is over-scoped — if "cite member-protocol" is read as "also eliminate flow descriptions from SKILL.md" — Task 7 becomes ambiguous and scope-creep threatens the sprint boundary. The plan edit for F2 must explicitly state that only field-name restatement moves to single-source; flow orchestration stays in SKILL.md.
