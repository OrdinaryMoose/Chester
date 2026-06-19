# Complete Design — Chester committee and execute-write migration to post-v2.1.178 agent-teams model

**Date:** 2026-06-18

**Sprint:** 20260618-01-migrate-team-tooling

**Source:** verdict from `committee/round01/verdict.md`; synthesis from `committee/round01/alignment-map.md`; member positions from `committee/round01/consolidator-output.md`

---

## Summary

- **Goal:** The committee was asked to determine how to update Chester's design-committee skill, execute-write skill, and two stale memory entries to reflect the post-v2.1.178 Claude Code agent-teams API — specifically: whether the change requires structural redesign of the committee workflow, and what to do with API calls (`TeamCreate`, `TeamDelete`), discriminator vocabulary (`roster`/`off-roster`), and memory entries whose rationale is now obsolete. The verdict is a documentation/vocabulary migration only — the committee's existing categorical structure maps cleanly onto the new model with no residue — and the downstream spec-write must produce a concrete editing pass covering specific files, dead verbs, vocabulary replacements, justification rewrites, and memory dispositions.

## Verdict

- **Chosen architecture:** A documentation/vocabulary migration, not a structural redesign: the post-v2.1.178 model maps onto Chester's existing committee structure with no residue; keep every category, the Dispatch Discipline section shape, the per-round flow, and the context-economy invariant; change only the dead API verbs, the stale discriminator vocabulary, and the obsolete justifications.

## Rationale

The migration is unanimously framed as documentation, not design. The old `team_name` discriminator encoded intent as a fragile parameter value requiring affirmative discipline at every dispatch site; the new `teammate`/`subagent` spawn-shape encodes the same intent structurally in the tool call. The underlying two-category intent (persistent peer vs one-shot worker) maps onto the new spawn types with no ambiguous roles and no residue. Because the intent maps cleanly, implementation risk is near-zero and no structural category needs to change.

The two splits the committee recorded are about emphasis and housekeeping, not architecture. Both were resolved by the minimal-change principle: when two options both satisfy the migration goal, prefer the lighter-touch path.

- **Rejected alternatives + sacrifices:**
  - Structural redesign — rejected 4–0. No member found a gap in the existing category structure that the new API exposes; redesign would have introduced churn with no functional gain.
  - Phase-1 runtime nested-teams precondition check (Innovator) — dropped by consensus after peer-DM. Innovator conceded the runtime check; all four converged on a documentation note in Phase 1 Bootstrap (two sentences, landing inside the existing latent-risk item — no new machinery). The constraint (committee must be invoked from the main session) is satisfied on every normal invocation path. Residual micro-split is on the note's *second* location only: Pragmatist favors Standalone Invocability; Innovator + Purist favor Integration (Purist's category argument: Standalone Invocability covers sprint mechanics, not session topology). Resolved to Bootstrap + Integration.
  - Full memory replacement of both entries (Innovator) / retire-teardown-gap-and-rewrite-disposal (Purist) vs. update-in-place of both (Conservator/Pragmatist) — the 2–2 split on memory handling was resolved by the team-lead. The chosen path is: retire `project_committee_teardown_gap` outright (delete file, drop MEMORY.md line); rewrite `project_subagent_disposal_offroster` in place to the new model. Pure update-in-place of both (Conservator/Pragmatist position) was set aside because `project_committee_teardown_gap`'s durable lesson — keep ephemerals off-roster so they don't wedge `TeamDelete` — is now false: `team_name` is ignored and `TeamDelete` is gone, so the bug class no longer exists and nothing true remains to fold in.

- **Prior-art findings:** none surfaced this round.

- **Ground-truth-verified facts:**
  - `TeamCreate` and `TeamDelete` are dead API calls in the post-v2.1.178 model; the team auto-forms on first spawn and the main session is the fixed lead.
  - `team_name` is ignored in the new model; the discriminator between persistent teammates and one-shot workers is now spawn shape, not a parameter value.
  - The context-economy invariant (team-lead never aggregates content; scribe authors from bounded inputs) is orthogonal to the API change and is preserved unchanged.
  - The execute-write instruction to dispatch one-shot with no `team_name` remains correct in its effect; only its `TeamDelete`-stranding justification is now false (that failure mode cannot occur because `team_name` is ignored).
  - The nested-teams constraint (committee must not be nested inside another agent team) is a precondition that is satisfied whenever the committee is invoked from the main session, which is the normal and expected path.

- **Constraints / guardrails:**
  - Do not alter the categorical structure of the Dispatch Discipline section — only replace the mechanism description (team_name discriminator → spawn-shape discriminator).
  - Do not alter the per-round flow, the phase names, or the context-economy invariant.
  - The nested-teams constraint must be documented as a two-sentence note in **Phase 1 Bootstrap** (primary, unanimous) and the **Integration** section (second location) — not implemented as a runtime check. It lands inside the existing latent-risk framing; no new machinery.
  - `project_committee_teardown_gap` must be retired (file deleted, MEMORY.md line removed) — do not update in place.
  - `project_subagent_disposal_offroster` must be rewritten in place to reflect the new model (teammate vs subagent as spawn shape, not `team_name` presence/absence) — the file is kept, the body is replaced.
  - The execute-write skill: keep the instruction to dispatch one-shot; delete or replace the justification that cited TeamDelete stranding as the reason. **Urgent (category-1), not cosmetic** — the stale justification actively misleads a reader about a failure mode that can no longer occur (Purist; Pragmatist concurred post-DM).

- **Acceptance-criteria seeds:**
  - No occurrence of `TeamCreate` or `TeamDelete` remains in the design-committee skill or execute-write skill after the edit.
  - No occurrence of `roster` or `off-roster` as a discriminator concept remains in the committee skill documentation.
  - `teammate` and `subagent` (spawn-shape discriminator) appear in the Dispatch Discipline section replacing the former `team_name`-based vocabulary.
  - Phase 1 Bootstrap and the Integration section of design-committee each contain a note on the nested-teams precondition (committee must run from the main session, not nested inside another agent team).
  - `project_committee_teardown_gap` memory file is deleted and its MEMORY.md entry is removed.
  - `project_subagent_disposal_offroster` memory file body is rewritten to the new model vocabulary; the file itself is retained.
  - The execute-write skill contains no reference to TeamDelete-stranding as a justification for its dispatch instruction.
  - The context-economy invariant language is unchanged in the committee skill.

## Dissent Record

**Alignment:** 4–0 on all six settled questions. After peer-DM, Split A (nested-teams) converged further: unanimous on a Bootstrap note, runtime check withdrawn; residual micro-split on second location only (Pragmatist: Standalone Invocability | Innovator + Purist: Integration), resolved to Integration. Split B (memory handling) remains 2–2, resolved by team-lead recommendation.

**Dissenting / residual positions:**

- Split A residual (post-DM) — Pragmatist preferred the second-location note in Standalone Invocability; Innovator + Purist (and the resolution) place it in Integration, on the category argument that Standalone Invocability covers sprint mechanics, not session topology. Bootstrap placement is unanimous; this is a placement preference, not a blocking dissent. Innovator's original runtime-check demand was conceded.
- Innovator dissents on Split B — favored full replacement of both memory entries rather than the chosen retire-one / rewrite-one split — blocking risk: "Updating disposal/offroster in place risks leaving stale phrasing or partial old-model language that could mislead a future reader; a clean replacement guarantees no legacy vocabulary survives." (Mitigated by acceptance criterion requiring no legacy vocabulary survives the rewrite.)

## Deferred / Open

- **Deferred / non-goals:** None. The scope is fully settled: this is a vocabulary/documentation migration pass only. No new phases, no new categories, no new tools, no behavioral changes to any skill are in scope. The question of whether to codify nested-teams constraints more broadly (across other skills or as a framework-level guardrail) is not addressed by this sprint.

---

<!-- produced-by: scribe / round01 / 2026-06-18 -->
