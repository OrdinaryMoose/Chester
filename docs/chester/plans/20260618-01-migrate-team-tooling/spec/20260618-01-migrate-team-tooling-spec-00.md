# Spec: Migrate committee and execute-write to post-v2.1.178 agent-teams model

**Sprint:** 20260618-01-migrate-team-tooling
**Parent brief:** docs/chester/working/20260618-01-migrate-team-tooling/design/20260618-01-migrate-team-tooling-design-00.md
**Architecture:** A documentation/vocabulary migration, not a structural redesign — the post-v2.1.178 Claude Code agent-teams model maps onto Chester's existing committee structure with no residue. Keep every category, the Dispatch Discipline section shape, the per-round flow, and the context-economy invariant; change only the dead API verbs (`TeamCreate`/`TeamDelete`), the stale discriminator vocabulary (`roster`/`off-roster` → `teammate`/`subagent`), and the obsolete justifications. FAC basis: feasible (every change is a localized text edit, no behavioral rewrite); acceptable (4–0 committee convergence, ratified by the designer; the migration was dogfooded — the committee that produced this design ran on the target model end-to-end); complete (covers both skills, both references, and both stale memories). Rejected alternative: structural redesign (4–0 reject — no category gap exposed). Rejected alternative: Phase-1 runtime nested-teams check (withdrawn after peer-DM — documented precondition, not a guard). Declared sacrifice: the nested-teams constraint is documented, not tool-enforced. Provenance: design-committee complete-design document, round 01.

## Goal

Remove every reference to the two Claude Code tools that no longer exist (`TeamCreate`, `TeamDelete`) from Chester's live skills, replace the `team_name`-based "roster/off-roster" discriminator vocabulary with the spawn-shape "teammate/subagent" discriminator, delete justifications that defend a failure mode that can no longer occur, document the nested-teams precondition, and correct the two memory entries whose rationale is obsolete — all without altering any skill's behavior, category structure, or the committee context-economy invariant.

## Components

**Modified — design-committee skill** (`skills/design-committee/`):
- `SKILL.md` — Phase 3 Convene (remove `TeamCreate`, becomes "spawn members as teammates"); Phase 5 Tear Down (remove `TeamDelete`, becomes record-completion); Dispatch Discipline section (vocabulary swap, mechanism-description replacement); Phase 1 Bootstrap + Integration (nested-teams precondition note); Integration "Calls" list (drop `TeamCreate`/`TeamDelete`). Version bump.
- `references/team-lead.md` — fuller surface than the SKILL.md alone: remove the `TeamDelete` closure step (`:141`); rephrase the `TeamCreate` references (`:38`, `:59`, `:73`, `:77`, `:331`) to the auto-forming team / spawn-as-teammates framing; and replace the `team_name`/`off-roster` discriminator language in the Consolidate and Author steps (`:99`, `:102`) with the spawn-shape framing (one-shot subagent dispatch). Closure becomes record-completion. Covered by the SKILL.md version bump. (Line numbers indicative — the AC-1.1/AC-1.2 gates assert on text across the whole `skills/design-committee/` tree, not on these positions.)

**Modified — execute-write skill** (`skills/execute-write/`):
- `SKILL.md` (`:96-98`) and `references/{implementer,code-reviewer,quality-reviewer,spec-reviewer}.md` — keep the one-shot dispatch instruction; delete/replace the `TeamDelete`-stranding justification. Version bump on SKILL.md.

**Modified — memories** (`/home/mike/.claude/projects/-home-mike-Documents-CodeProjects-Chester/memory/`):
- `project_committee_teardown_gap.md` — deleted; its `MEMORY.md` index line removed.
- `project_subagent_disposal_offroster.md` — body rewritten to the new model; file retained.

## Data Flow

The migration changes how Chester *documents* the deliberates-vs-produces distinction, not how agents flow:

- **Old discriminator:** the `team_name` parameter value (present → persistent roster teammate that peer-DMs; absent → off-roster one-shot). Required affirmative discipline at every dispatch site.
- **New discriminator:** spawn shape. A named background `Agent` dispatch = a teammate under the single implicit team, peer-DM-capable via `SendMessage`. A one-shot `Agent` dispatch (returns-and-disposes) = a subagent, no peer-DM. The distinction is structural in the tool call, not a parameter the author must remember to set.
- **Team lifecycle:** team auto-forms on first teammate spawn; main session is the fixed lead; teardown is automatic at session exit. Chester's record-only ledger close replaces the `TeamDelete` call.
- **Unchanged:** the context-economy flow (team-lead never aggregates content; consolidator enumerates; scribe authors from bounded inputs). This flow is orthogonal to the API change and its describing language must read identically after the edit.

## Error Handling

- **Nested-teams precondition:** the committee must run from the main session (the fixed lead), not nested inside another agent team — Claude Code forbids nested teams. Documented as a precondition note in Phase 1 Bootstrap and Integration; not enforced at runtime (declared sacrifice). Failure mode if violated: the committee cannot spawn members. Detectable, not silent.
- **Memory rewrite leakage:** the `disposal_offroster` rewrite must leave no legacy `team_name`/`TeamDelete` vocabulary that would mislead a future reader (mitigation for the Innovator dissent).

## Testing Strategy

This is a documentation change to agent-read Markdown — verification is grep-based assertion, not unit tests:
- Absence assertions: no `TeamCreate`/`TeamDelete` in the two live skills + references; no `roster`/`off-roster` as a discriminator concept in committee docs.
- Presence assertions: `teammate`/`subagent` discriminator vocabulary present; nested-teams note present in both target sections; `disposal_offroster` rewritten.
- Invariant assertion: context-economy language byte-unchanged.
- Catalog/version assertions: both SKILL.md versions bumped; `test-generated-agents-current` still passes (descriptions unchanged → no catalog regen required).
- Scope assertion: archived plan artifacts under `docs/chester/plans/` are untouched (they are historical records).

## Constraints

- Do not alter the categorical structure of the Dispatch Discipline section — replace only the mechanism description.
- Do not alter the per-round flow, the phase names, or the context-economy invariant language.
- Edit only the two live skills, their references, and the two memories. Archived sprint artifacts under `docs/chester/plans/` are records — leave untouched.
- Catalog-freshness invariant: SKILL.md `description` fields are NOT changed by this work, so the change is catalog-safe — bump the `version` field on each edited SKILL.md, but do NOT regenerate `skill-index.md`. (Per `project_catalog_freshness_invariant`: version bumps are catalog-safe; only add/remove/rename or description edits require regen.)
- Staging discipline: stage edited files explicitly by path; never `git add -A`/`.` (the tree carries unrelated `D`/`??` entries).
- The `disposal_offroster` rewrite must contain no surviving legacy vocabulary.
- **Word-sense guard (no blind grep-replace):** "roster" must be removed only in its *dispatch-discriminator* sense (`roster dispatch`, `off-roster dispatch`, `roster-only`, "needs a shared roster + `team_name`"). Its *member-list* sense — `SKILL.md:34` "Roster (six roles…)", "member roster" (`SKILL.md:103`, `team-lead.md:66`), and the consolidator's "a count and a roster" — is correct and stays. The agent files under `agents/design-committee-*` are out of scope (Non-Goals) and their "roster" uses are the member-list sense regardless.

## Non-Goals

- No structural redesign of the committee workflow — no new phases, categories, or tools.
- No behavioral change to any skill.
- No runtime enforcement of the nested-teams constraint (documentation only).
- No broader codification of nested-teams guardrails across other skills or as a framework-level mechanism.
- No edits to committee member agent files (`agents/design-committee-*.md`) — their advocacy-lens contracts are unaffected.
- No edits to archived `docs/chester/plans/` artifacts.

## Acceptance Criteria

### AC-1.1 — design-committee free of dead verbs

**Observable boundary:**
- `grep -rn "TeamCreate\|TeamDelete" skills/design-committee/` → no matches.
- Phase 3 reads as a "spawn members as teammates" step; Phase 5 reads as record-completion close.

**Given:** the migrated `skills/design-committee/SKILL.md` and `references/team-lead.md`
**When:** searched for `TeamCreate` or `TeamDelete`
**Then:** zero occurrences; Convene and Tear Down phases describe the auto-forming team and record-only teardown instead.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-1.2 — discriminator vocabulary replaced

**Observable boundary:**
- The *dispatch-discriminator* phrases are gone: no `roster dispatch`, `off-roster dispatch`, `roster-only`, or `team_name`-based "needs a shared roster" rationale remains in committee docs.
- The *member-list* sense of "roster" is PRESERVED — `SKILL.md:34` "Roster (six roles…)", "member roster" (`SKILL.md:103`, `team-lead.md:66`), and the consolidator agent's "a count and a roster" (a who-is-on-which-side list) are legitimate and must NOT be deleted. This AC targets a word-sense, not the string "roster"; it is a judgment read, not a bare grep.
- Dispatch Discipline describes the spawn-shape discriminator (`teammate dispatch` = named background, peer-DM-capable; `subagent dispatch` = one-shot, returns-and-disposes).

**Given:** the migrated Dispatch Discipline section
**When:** read for how it distinguishes deliberating members from one-shot consolidator/scribe
**Then:** it uses the teammate/subagent spawn-shape distinction; the dispatch-discriminator uses of "roster"/"off-roster" are gone; the member-list uses of "roster" remain; and the section's categorical structure (two categories, guard-both-directions) is preserved.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-1.3 — nested-teams precondition documented

**Observable boundary:**
- Phase 1 Bootstrap contains a note that the committee must run from the main session (not nested in another agent team), nested inside the existing latent-risk framing rather than as a new subsection (honors the design's "no new machinery").
- The Integration section contains the same precondition note.

**Given:** the migrated SKILL.md
**When:** read at Phase 1 Bootstrap and Integration
**Then:** both carry the nested-teams precondition as documentation (no runtime check added), and the Bootstrap note adds no new structural subsection.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-1.4 — context-economy invariant language unchanged

**Observable boundary:**
- The invariant is expressed diffusely, not as one canonical sentence. The specific load-bearing passages that must survive the edit unchanged in meaning are: the team-lead "compiles at end — NOT switchboard" language (`SKILL.md:172` and the Peer-DM Protocol), the consolidator's "enumerate-only / never holds the full returns" role, and the scribe's "authors from bounded inputs" role. None of these passages is rewritten, weakened, or removed by the migration.
- The migration touches none of these passages directly (it edits Convene/Tear Down/Dispatch Discipline/Bootstrap/Integration). If an adjacent rewrite reflows a line near them, the passage text itself stays unchanged.

**Given:** the named context-economy passages before and after the migration
**When:** each passage is located by its text and compared
**Then:** each is unchanged — no aggregation responsibility added to the team-lead, no bounded-input constraint relaxed.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-2.1 — execute-write false justification removed, instruction preserved

**Observable boundary:**
- `grep -rn "TeamCreate\|TeamDelete" skills/execute-write/` → no matches.
- Each of the five sites still instructs one-shot dispatch, but with no claim that omitting `team_name` prevents stranding-until-`TeamDelete`.

**Given:** `skills/execute-write/SKILL.md` and its four references
**When:** read at each former dispatch-discipline site
**Then:** the one-shot dispatch instruction remains; the `TeamDelete`-stranding justification is gone or replaced with a correct rationale (one-shot returns-and-disposes).

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-3.1 — teardown-gap memory retired

**Observable boundary:**
- `project_committee_teardown_gap.md` does not exist.
- Its line is removed from `MEMORY.md`.

**Given:** the memory directory and index after the edit
**When:** checked for the teardown-gap file and its index line
**Then:** both are absent.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-3.2 — disposal/off-roster memory rewritten in place

**Observable boundary:**
- `project_subagent_disposal_offroster.md` still exists; its body describes the teammate-vs-subagent spawn-shape model and contains no `team_name`/`TeamDelete`-based mechanism language.
- Its `MEMORY.md` line reflects the new model.

**Given:** the rewritten memory file
**When:** read for its disposal mechanism
**Then:** it explains disposal via spawn shape (one-shot subagent auto-disposes; teammate persists to session end), with no surviving legacy vocabulary.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-4.1 — catalog-safe version bumps

**Observable boundary:**
- `skills/design-committee/SKILL.md` and `skills/execute-write/SKILL.md` `version` fields are incremented.
- `skill-index.md` is unchanged (descriptions not edited); `bash tests/test-generated-agents-current.sh` passes.

**Given:** the edited skills
**When:** versions and the generated catalog are checked
**Then:** both versions bumped, catalog unchanged, catalog-currency test green.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

<!-- created-at: 2026-06-19T09:03:54Z -->
<!-- produced-by spec-write@v0002 -->
