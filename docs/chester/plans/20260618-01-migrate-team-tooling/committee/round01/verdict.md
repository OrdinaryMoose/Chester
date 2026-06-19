# Verdict — round 01

## Chosen architecture

**A documentation/vocabulary migration, not a structural redesign.** The committee converged
4–0: the post-v2.1.178 model maps onto Chester's existing committee structure with no residue.
Keep every category, the Dispatch Discipline section shape, the per-round flow, and the
context-economy invariant. Change only the dead API verbs, the stale discriminator vocabulary,
and the obsolete justifications.

## Settled (4–0)

1. **Approach:** minimal edit, no structural redesign.
2. **Vocabulary:** retire `roster` / `off-roster` (the `team_name`-based discriminator) → replace
   with `teammate` / `subagent` (a spawn-shape discriminator). Named background agent = peer-DM-
   capable teammate; one-shot Agent dispatch = caller-returns-only subagent.
3. **`TeamCreate`:** remove. Phase 3 Convene becomes a "spawn members as teammates" step — the
   team auto-forms on first spawn; the main session is the fixed lead.
4. **`TeamDelete`:** remove. Phase 5 Tear Down becomes record-completion only (ledger stamped
   DISMISSED); team dirs auto-clean at session exit.
5. **execute-write:** the "dispatch one-shot, no `team_name`" instruction stays correct; only the
   "strands until `TeamDelete`" justification is deleted/replaced (that failure mode cannot occur
   now — `team_name` is ignored).
6. **Context-economy invariant:** preserved unchanged; orthogonal to the API change.

## Two splits — team-lead recommended resolution (designer adjudicates)

**Split A — nested-teams constraint placement.** 3 (Conservator/Pragmatist/Purist) want a
one-sentence documentation note; 1 (Innovator) wants a Phase-1 runtime precondition check.
→ **Recommend the one-sentence note** (in Standalone Invocability / Integration). A runtime
check over-engineers a constraint that is satisfied whenever the committee is invoked from the
main session (the normal path); document the precondition, don't guard it. Consistent with
"documentation exercise, not design exercise."

**Split B — memory handling.** 2 update-in-place (Conservator/Pragmatist) vs 2 replace
(Innovator/Purist).
→ **Recommend: retire `project_committee_teardown_gap`** (delete + drop its MEMORY.md line). Its
durable lesson — "keep ephemerals off-roster so they don't wedge `TeamDelete`" — is obsolete:
`team_name` is ignored and `TeamDelete` is gone, so the whole bug class evaporated. Nothing true
remains to fold.
→ **Rewrite `project_subagent_disposal_offroster` in place** to the new model (teammate vs
subagent = spawn shape, not `team_name`). Keep the file, replace the body.

## Dissent record

- Innovator dissents on Split A (wants runtime check) and favored full memory replacement
  (Split B). Recorded; majority + minimal-change principle resolve against the runtime check.
- No member dissented from any 4–0 item.
