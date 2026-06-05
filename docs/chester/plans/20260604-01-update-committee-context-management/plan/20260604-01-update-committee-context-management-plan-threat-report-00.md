# Plan Threat Report — Team-Lead Context Economy in the Ad-hoc Committee

**Plan:** plan/20260604-01-update-committee-context-management-plan-00.md
**Date:** 2026-06-04
**Reviews run:** plan-attack (unconditional) + plan-smell (triggered).
**Smell triggers matched:** new contract surface (`member-protocol.md` digest schema, Consolidator role), new persistence pathway (members write `committee/` transcripts + ledger + consolidator-output), new abstraction (Consolidator role). Smell fired on these three.

## Combined Implementation Risk: MODERATE

### Why Moderate
- The contract edits are coherent, all 12 acceptance criteria trace to tasks, and the plan passed the spec-fidelity review loop on the first pass.
- plan-attack found **2 HIGH** findings, but both are *mechanical execution hazards*, not design flaws, and **both were fixed in the plan before this report** — they do not require a redesign.
- plan-smell found no blockers — its MEDIUMs are accepted design tradeoffs (single-source vs five-file duplication) or inherent LLM-as-contract trust, both already chosen by the spec.
- The residual watch-items (committee/ path-resolution duplicated across two files; Consolidator enumeration enforced by prose only) are maintenance concerns, not correctness risks for this sprint.
- Blast radius is wide (10 files) but uniform and low-complexity (markdown contract edits with grep-assertion guards).

## plan-attack findings

- **HIGH — stale `SKILL.md:115` Standalone Invocability (FIXED).** Said the record "lands in the sprint's `design/` folder"; Task 7's edit list omitted it and no assertion caught it. Fix: added Standalone Invocability (~113-115) and the ~57 persist phrasing to Task 7's Files + Step 3, plus a guard assertion `! grep -qi 'lands in the sprint'`.
- **HIGH — test-runner append hazard (FIXED).** Literal "append" of later-task functions/calls after the final gate line would never execute, silently green-passing the suite. Fix: Task 1 scaffold now has `ASSERTION FUNCTIONS` and `RUN` sentinel regions above a marked final-gate line; Tech Stack carries an explicit insertion-discipline note for Tasks 2-8.
- **MEDIUM — Closure stamp instruction stale (FIXED).** Old "for every `committee-analysis-NN.md`" naming. Fix: Task 6 Closure bullet now names the new targets (`committee/roundNN/committee-analysis.md`, `committee/ledger.md`).
- **MEDIUM — spec says "bump version" for advocacy + round-format files that have no version field.** Plan already handles this correctly (advocacy agents: explicit "no version frontmatter" note). Round-format has no version field either; left as-is. Plan is right, spec prose was loose — no action needed.
- **LOW (FIXED) — Consolidator tools regex would accept stray `Grep`.** Added `! grep -qE '^tools:.*Grep'` to `assert_consolidator`.
- **LOW (noted) — vacuous pre-edit checks** (Mode A/B in Task 3, Final Recommendation in Task 5): harmless diagnostic noise; the enclosing functions still fail correctly at Step 2.

## plan-smell findings (accepted / watch — no plan change required)

- **MEDIUM — `member-protocol.md` triple-duty.** Owns digest shape + transcript naming + sequencing; all 5 agents cite the whole file. This is the deliberate single-source-vs-five-file-duplication tradeoff the committee chose. Watch: keep the file narrow; a future carve-out for a new role type would make the five whole-file citations ambiguous.
- **MEDIUM — `committee/` path resolution forked across `SKILL.md` and `team-lead.md`.** The sprint-vs-standalone resolution now lives in two docs (the old `design/` fork lived only in team-lead.md). Watch for drift if the resolution rule changes; plan acknowledges with "mirror the team-lead.md fork" but does not DRY it.
- **MEDIUM — Consolidator enumeration ceiling is prose-only.** No mechanical/observable guard that the running agent enumerates rather than synthesizes; it is the highest-trust new dependency (sole input to the team-lead's risk-weighting). Same trust model as every existing committee agent — accepted, not a regression.
- **LOW — 5-file Write scope not mechanically enforced; round-format rewrite may strand `design-architect-committee` refs (deprecation-pending, out of scope).** Noted for awareness.

## Verified assumptions (plan-attack, no action)
SKILL.md v0016 / team-lead.md v0006 (bump targets correct); advocacy + round-format files have no version field; no Mode A/B in any touched file pre-edit; member-protocol.md and consolidator.md do not yet exist; line-number anchors in the plan match the current files.

<!-- created-at: 2026-06-05T01:04:42Z -->
<!-- produced-by plan-build@v0005 -->
