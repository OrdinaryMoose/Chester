# Smell Findings — Round 05 (plan-00 hardening)

Source: chester:plan-build-plan-smeller, dispatched round05. Captured to disk by team-lead (smeller role returns inline only). Verbatim digest + finding summaries below.

## Severity tally
1 HIGH, 3 MEDIUM, 3 LOW.

## FINDING 1 — Test-prose coupling (MEDIUM, HIGH confidence)
Several proposed grep assertions match incidental prose, not structure — reword the doc, test breaks, behavior unchanged:
- `grep -qiE '200[ -]word'` — "capped at 200 words" / "≤200 words" would break it.
- `grep -qiE 'peer.?dm'` — hyphenation/caps vary; plan itself mixes "peer-DM"/"peer DM".
- `grep -qiE 'reject .*(malformed|signal)'` — word-order contract; passive "malformed signals are rejected" fails to match.
- `grep -qi 'routing signal'` duplicated in member-protocol AND skill asserts — both break if reworded to "signal".
ROBUST (keep): `^#+ .*Dissent Record`, `^version: v00...`, `consolidator-output.md`, `committee/round`, `## Final Position`, `verdict.md`, `alignment-map`, `sprint-subdir|ask the designer`, `## Committee root resolution`.
Refactor: prefer header/filename anchors; where a rule has no structural hook, document the assertion as intentionally prose-coupled.

## FINDING 2 — Contract duplication: Final Position schema in 5 files (HIGH, HIGH confidence)
`{position, rationale, blocking_risk}` + 200-word cap will live in: member-protocol.md (def), consolidator agent (consumes), team-lead.md (consumes), SKILL.md (references), test (asserts) — plus scribe copies `blocking_risk`. **This is the exact multi-copy drift class the sprint fixes one layer up, reproduced here.** Renaming `blocking_risk` would touch 5-6 files.
Single-source opportunity the plan misses: member-protocol.md is ALREADY the declared single authority for committee-root resolution (existing lines 87-89). Apply the same discipline — member-protocol owns the Final Position schema; consolidator/team-lead/SKILL/scribe cite "schema per `references/member-protocol.md` § Final Position" instead of restating fields; the test checks only the header + keeps the field-name grep in the member-protocol assert alone.

## FINDING 3 — Scribe/template path coupling (MEDIUM, HIGH confidence)
Scribe agent body hardcodes `skills/design-committee/references/artifact-template.md` as a string literal; Task 5 test only greps `template`, not the path. If the template moves, scribe silently uses wrong path, no test catches. Plan Task 4 itself flags location uncertainty ("confirm against util-artifact-schema") then hardcodes anyway.
Refactor: team-lead passes the template path as a runtime input field at scribe dispatch (alongside verdict.md), not baked into the agent prompt.

## FINDING 4 — one-round/two-round tested in 1 file only (MEDIUM, MEDIUM confidence)
Mode is defined in spec §4, described in SKILL.md (Task 7) and team-lead.md two-round branch (Task 3), but `grep one-round && two-round` lives only in assert_skill_md. team-lead.md's two-round branch can drift untested. Spec constraint 7 (synthesize+converge co-locate because auditable) is not tested at all.
Refactor: add to assert_team_lead `grep -qiE 'two-round|revision pass|alignment.map.*feedback'`.

## FINDING 5 — member agents still say "digest" after Task 1 kills it (LOW-MEDIUM, MEDIUM confidence)
The four advocacy agent files (conservator/innovator/pragmatist/purist) and likely researcher reference "digest" (e.g. conservator line 10 "before sending each team-lead-facing digest"). Task 1 removes the digest concept from member-protocol, but NO task updates the member agent files, and `assert_advocacy_agents` does not ban "digest". Likely silent breakage in live committee runs.
Refactor: (a) add a Task-1 step updating the four+1 member agents digest→routing signal + a `! grep -qi 'digest'` ban in assert_advocacy_agents, OR (b) lighter: add a "digest" vocabulary ban to assert_scope_and_vocab parallel to the Mode A/B ban.

## FINDING 6 — assert_scope_and_vocab file list goes stale (LOW, HIGH confidence)
The vocab-sweep loop (test lines 73-80) enumerates files explicitly; the two new files (scribe agent, artifact-template) are not added. Scribe is covered by its own assert, but not the sweep.
Refactor: extend the sweep's file list to include design-committee-scribe.md and artifact-template.md (Task 5 or 7).

## FINDING 7 — Closure stamp target still committee-analysis.md (LOW, HIGH confidence)
Existing team-lead.md Closure stamps `committee/roundNN/committee-analysis.md`. After this sprint the designer-facing artifact is the scribe draft (+ alignment-map.md, verdict.md); committee-analysis.md is superseded. Plan Task 3 says only "adjust Closure" with no concrete stamp-target list → ambiguous/wrong stamp target.
Refactor: Task 3 explicitly lists new stamp targets (alignment-map.md, verdict.md, scribe draft); deprecate the committee-analysis.md stamp.

## Smeller's risk assessment (verbatim)
"The plan is structurally sound and its dependency ordering is correct. The single most important structural problem is Finding 2 — the Final Position schema is distributed across 5 files with no single-source citation discipline, exactly the drift class this sprint diagnoses at one level above. The pattern fix exists: member-protocol already serves as the single authority for committee-root resolution. ... Finding 5 (member agents still say 'digest') is a correctness gap that is likely to produce silent breakage in live committee runs — it should be a step in Task 1, not deferred."
