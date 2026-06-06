# Deferred Items — 20260606-01-update-committee-context-management

Items surfaced during execute-write that are out of scope for the task in hand. Reviewed during finish.

---

## DI-1 — Routing-signal test asserts only 2 of 4 fields

- **Date:** 2026-06-06
- **Source task:** Task 1 (member-protocol)
- **Description:** `assert_member_protocol` checks the routing-signal schema with `grep -qi 'status'` + `grep -q 'transcript'`, covering 2 of the 4 declared fields. The protocol states the schema `{member, status, round, transcript}` is strict — any missing field is malformed. Adding `grep -qi 'member'` and `grep -q 'round'` would make the assertion match the full four-field contract.
- **Why deferred:** Not in plan. Task 1 spec named exactly the two representative checks to add; expanding the assertion set is a beyond-plan improvement. Quality reviewer flagged as below-threshold (minor).

## DI-2 — Routing-signal section has no concrete wire-format example

- **Date:** 2026-06-06
- **Source task:** Task 1 (member-protocol)
- **Description:** `member-protocol.md § Routing signal` defines the typed four-field schema but does not show a concrete wire format (YAML block / JSON / markdown key-value). Because members otherwise write caveman-ultra prose, "typed" could be misread at runtime as "annotated prose." A one-line example in the section would remove that ambiguity.
- **Why deferred:** Not in plan. Tasks 2/3/5/7 cite the section structurally and are unaffected; this is a runtime-clarity refinement, not a contract gap. Quality reviewer flagged as a recommendation (below blocking threshold).

## DI-3 — Consolidator bounded-read covers member transcripts but not researcher findings

- **Date:** 2026-06-06
- **Source task:** Task 2 (consolidator)
- **Description:** The consolidator Role bullet says "locate the member transcripts and researcher findings ... From each member transcript, read ONLY the `## Final Position` section." The "never the full body" bound grammatically applies only to member transcripts; the researcher findings file is left implicitly unbounded, so a large findings file could be read in full — a hole in the AC-4 bounded-input guarantee. Task 1 did add a `## Final Position` to the researcher findings file, so a parallel "read only the researcher's `## Final Position`" clause + matching test assertion would close the gap.
- **Why deferred:** Out of Task 2's defined scope (member-transcript read-scope only); the researcher-findings consumption contract is not fully specified, and the quality reviewer rated this below the blocking threshold and explicitly out of scope for the task.

## DI-4 — "Final Recommendation" vs "verdict" terminology not fully reconciled

- **Date:** 2026-06-06
- **Source task:** Task 3 (team-lead)
- **Description:** The new pipeline names the team-lead's convergence output `verdict.md`. But the older "Final Recommendation / packet" framing survives in `team-lead.md` § Internal Discipline (Consolidation/Presentation/Self-Evaluation prose) and in two test assertions: `assert_team_lead` "team-lead reads consolidator-output, writes own Final Rec" and `assert_round_format` "round-format separates team-lead Final Recommendation." Conceptually the verdict *is* the team-lead's final recommendation, so it is not contradictory, but the two vocabularies coexist. Task 6 migrates the round-format Final Recommendation framing; team-lead.md's Internal Discipline prose and the `assert_team_lead` "Final Rec" assertion are not explicitly owned by any task.
- **Why deferred:** Task 3 scoped to Per-Round Flow / Behavioral Constraints / Closure; leaving the Internal Discipline framing keeps the existing assertion green. Full terminology unification is a follow-up; reconcile during Task 6/7 if in scope, else a later cleanup pass.
- **Specific collision (quality review, Minor/81):** `team-lead.md` § Presentation Rules line ~321 reads "Surface options, not verdict" — "verdict" now also names the `verdict.md` artifact (the team-lead's internal decision), so the word carries two meanings in one document. Disambiguate during the unification pass, e.g. "Surface options, not a single collapsed recommendation."

## DI-5 — Consolidator frontmatter description still describes pre-redesign whole-transcript reading

- **Date:** 2026-06-06
- **Source task:** Task 5 (scribe) — noticed while diffing sibling agent frontmatter.
- **Description:** `agents/design-committee-consolidator.md` frontmatter `description:` reads "Reads the member transcripts and researcher findings from a single round folder and emits an enumerate-only synthesis." Task 2 changed the agent BODY to read only each transcript's bounded `## Final Position` section (never the full body), but the registry blurb still implies whole-transcript reading — it under-states the AC-4 bounded-input guarantee. The body (actual behavior) is correct; only the blurb is stale.
- **Why deferred:** Out of scope for both Task 2 (which scoped to the Role/body) and Task 5 (scribe). Registry-blurb imprecision, not a behavioral defect. A cleanup pass should align the description to "Reads each member's bounded `## Final Position` section."

## DI-6 — Round-format doc: two below-threshold wording polishes

- **Date:** 2026-06-06
- **Source task:** Task 6 (round-format) — quality-review recommendations, both below the ≥80 flag threshold.
- **Description:** (a) How To Use step 4 says alignment-map and verdict are "evicted after writing"; clarifying "evicted individually as each is written" would match team-lead.md's explicit two-stage eviction for a reader using only this doc. (b) The Folder Shape tree uses `<decision-packet>.md` as the scribe's filename placeholder with no naming hint; a parenthetical like `# named per artifact-template.md` would save a lookup.
- **Why deferred:** Pure cosmetic wording; reviewer found no ≥80 issue. Below the confidence threshold that gates action — captured for a future polish pass, not acted on, to avoid sub-threshold churn.

## DI-7 — SKILL.md Phase 5 "consolidation" word now ambiguous

- **Date:** 2026-06-06
- **Source task:** Task 7 (SKILL.md) — quality-review recommendation, below the ≥80 flag threshold; pre-existing wording.
- **Description:** SKILL.md Phase 5 (Tear Down) says "Team-lead runs consolidation, presentation, and artifact placement." Now that "Consolidate" is a named step in the Per-Round Flow (the ephemeral Consolidator dispatch), the closure-time word "consolidation" reads ambiguously. Substituting "record finalization" / "record confirmation" would distinguish closure-time record checks from the Consolidator dispatch.
- **Why deferred:** Pre-existing wording, not introduced by Task 7; below the confidence threshold. Minor clarity polish for a future pass.

<!-- created-at: 2026-06-06T14:25:44Z -->
<!-- produced-by execute-write@v0008 -->
