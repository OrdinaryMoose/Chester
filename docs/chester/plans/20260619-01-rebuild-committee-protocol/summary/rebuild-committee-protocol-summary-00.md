# Session Summary: Rebuild Committee Deliberation Protocol

**Date:** 2026-06-19
**Session type:** Full doc/protocol implementation (subagent-driven execute-write)
**Plan:** `20260619-01-rebuild-committee-protocol-plan-00.md`

## Goal

Rebuild the `design-committee` deliberation protocol so the four advocacy members and the researcher are spawned **once** as standing teammates and every round advances by `SendMessage` to those same instances — making live persistent peer deliberation real — while preserving the foundational context-economy invariant byte-intact (the team-lead never aggregates transcripts or Final Positions; the enumerate-only Consolidator and bounded-input Scribe do that). Teardown moved from implicit session-exit-only to an explicit `shutdown_request` message with session-exit auto-dispose as the documented fallback.

## What Was Completed

Five file-centric tasks executed task-by-task under `execute-write` Section 2 (subagent mode, fork off). Each task followed the repo's doc-change TDD shape — add a grep assertion to the bash suite, watch it go red, make the doc edit, watch it go green, commit.

### Protocol document changes

- **SKILL.md** (`v0025`→`v0026`) — Phase 3 "One-time spawn" note (five named-Agent spawns are a one-time setup step, never re-spawned per round); Phase 4 "A round is a message, not a spawn" (each round is a `SendMessage` to the standing members); Phase 5 Tear Down rewritten to `shutdown_request` + record-completion close (replacing two prior sentences as one paragraph to avoid an orphaned record-close line); Integration §Calls updated.
- **team-lead.md** (`v0015`→`v0016`) — Per-Round Flow step 1 advances rounds by `SendMessage` to the standing advocacy-member instances ("do not re-spawn"); researcher marked standing/DM-addressable; Closure step 4 sends `shutdown_request` to the five teammates in parallel, waits then treats non-response as implicit ack, record-close independent of teardown. The Consolidate step and bounded-input behavior were left untouched.
- **member-protocol.md** (added `version: v0001` — file previously had none) — standing-teammate + self-organizing peer-DM wording atop § Peer-DM; new `## Shutdown request` section established as the **single authority** for the flush → `{ack}` → stop sequence; the existing 2-exchange-per-pair and 200-word Final Position caps left intact.
- **5 agent files** (`design-committee-{conservator,innovator,pragmatist,purist,researcher}.md`, each `v0001`→`v0002`) — each gains a `## Shutdown request` section that **cites** member-protocol rather than restating its steps (single-authority discipline); advocacy members get standing/persist/revise-in-place framing, the researcher gets a remain-alive/DM-addressable variant.
- **test-design-committee-context-economy.sh** — per-task grep assertions added to `assert_skill_md`, `assert_team_lead`, `assert_member_protocol`, `assert_advocacy_agents`, `assert_researcher_agent`; plus a new cross-cutting `assert_standing_protocol` guard (AC-3.1 negative aggregation check, consolidator-output bounded-input check, shutdown_request-in-both-docs, AC-5.2 sprint-local frozen-file git-diff guard).

### Review outcomes

- Spec compliance review ran for every task (non-dialable floor) — all Pass.
- Quality review ran for Tasks 1–4 (skip gate did not qualify: multi-file or script present); skipped for Task 5 (single-file, edit-only, all-green, no cross-layer import). All Pass; the only ≥80 finding (Task 3 frontmatter description omission) was deferred, not a defect.
- Final cross-task code review over `e1f728e..47dee77`: **Yes — production ready**, zero issues ≥80. Single-authority, one-consistent-contract, context-economy-preserved, and no-residual-re-spawn all verified end-to-end.

## Verification Results

| Check | Result |
|-------|--------|
| `test-design-committee-context-economy.sh` | ALL PASS |
| Full `tests/` suite (fresh run) | 38 passed, 0 failed |
| `test-generated-agents-current.sh` (catalog freshness) | PASS — no `description` changed, no regen |
| Working tree | clean |

## Known Remaining Items

- **Deferred (1):** `member-protocol.md` frontmatter `description` does not list the new § Shutdown request. Minor doc-completeness nit; no catalog impact (reference-file descriptions don't feed the generated catalog). See `plan/rebuild-committee-protocol-deferred-00.md`.
- **Out of suite scope (by design):** live behavioral verification — that a real committee consult actually spawns members once and peer-DMs over standing instances — is confirmable only by a live consult, not by grep assertions. Called out in both spec and plan.

## Files Changed

- `skills/design-committee/SKILL.md` — Modify (version + 4 sections)
- `skills/design-committee/references/team-lead.md` — Modify (version + 2 steps)
- `skills/design-committee/references/member-protocol.md` — Modify (new version field, peer-DM intro, new § Shutdown request)
- `agents/design-committee-conservator.md` — Modify (version + § Shutdown request)
- `agents/design-committee-innovator.md` — Modify (same)
- `agents/design-committee-pragmatist.md` — Modify (same)
- `agents/design-committee-purist.md` — Modify (same)
- `agents/design-committee-researcher.md` — Modify (version + § Shutdown request, DM-addressable variant)
- `tests/test-design-committee-context-economy.sh` — Modify (per-task asserts + `assert_standing_protocol`)

## Commits

- `fd5573a` feat: SKILL.md — standing members, round-by-message, shutdown_request teardown
- `54ba06b` feat: team-lead.md — dispatch-by-message to standing members, shutdown_request closure
- `c412cd8` feat: member-protocol.md — standing membership, self-organizing peer-DM, Shutdown request
- `3630472` feat: committee agents — standing-teammate lifecycle + shutdown_request handler
- `47dee77` test: cross-cutting standing-protocol guards (AC-3.1, AC-4.1, AC-5.2)
- `156de32` checkpoint: execution complete

## Handoff Notes

Implementation is complete and verified on branch `20260619-01-rebuild-committee-protocol`; artifacts not yet archived to `plans/` and the worktree is not yet closed (next: `finish-archive-artifacts` → `finish-close-worktree`). The change is documentation-only — no executable surface — so the grep-assertion suite is the structural gate, but it does **not** prove live behavior. The single-authority for shutdown lives only in `member-protocol.md § Shutdown request`; any future change to the flush/ack/stop sequence must edit that one section and the six citers will follow. The AC-5.2 frozen-file guard is sprint-local and becomes vacuously green after merge — a future protocol sprint touching `committee-analysis-round-format.md` should drop or re-scope it. One deferred item awaits review.

## Session Skill Versions

*(populated by `chester-trailer-write harvest`; see `util-artifact-schema` `## Provenance Trailers`)*

<!-- produced-by spec-write@v0002 -->
<!-- produced-by spec-harden@v0001 -->
<!-- produced-by plan-build@v0007 -->
<!-- produced-by execute-write@v0010 -->
<!-- produced-by finish-write-records@v0004 -->
