# Rebuild Committee Deliberation Protocol — Design Brief

## Goal

The `design-committee` skill is meant to convene four persistent advocacy members who hold their own context across rounds and challenge each other directly until a question resolves. In practice it produces sequential one-shot agents whose outputs the team-lead stitches together — the exact "generic agents in disguise" the protocol exists to prevent. The recent `20260618-01-migrate-team-tooling` sprint swapped the removed `TeamCreate`/`TeamDelete` tooling for the named-background-`Agent` model, but it was scoped as a vocabulary-only change and left the deliberation protocol untouched. This work rebuilds that protocol so members are spawned once as standing teammates and every round advances by message to those same instances — making the live, persistent, peer-to-peer deliberation real rather than nominal, while preserving the committee's foundational context-economy invariant.

## Prior Art

The diagnosis is grounded in a live failure and its transcript, not theory.

- **Live failure.** A StoryDesigner committee consult (`sprint-s6aU3-bridge-split`, session transcript `1d58cabe`, 2026-06-19) ran the post-migration model and still degraded. Round 1 correctly spawned the four advocacy members as named background teammates (`bg=True`). Rounds 3 and 4 abandoned that shape entirely, spawning fresh one-shots named `conservator-r03`, `conservator-r04a`, `conservator-r04b` — a new instance per wave, each re-reading disk with no memory of its prior argument.
- **Zero `SendMessage` calls.** Across the entire session the team-lead called `SendMessage` zero times. The 62 textual matches were all prompt instructions telling members to peer-DM, never actual tool calls. A named background teammate is inert until it receives a message; spawned and never messaged, it behaves as a one-shot with an unused mailbox.
- **The load-bearing data path is disk, not the grid.** Members write full transcripts to `committee/roundNN/*.md`, signal `main` done, and go idle. The team-lead waits for four done-signals, then dispatches a context-isolated one-shot Consolidator to re-read those files and enumerate positions. The answer is built from the file-reader's enumeration — so even if members peer-DM in their own sidechains, that deliberation never reaches the synthesis. This is the fan-out → write-to-disk → one-shot-reduce → re-spawn pipeline, and it produces one-shots regardless of how correct the spawn shape is.
- **Researcher is a dead DM wire.** The researcher spawns as a one-shot (`bg=None`) and disposes before the members run, yet member prompts authorize "peer-DM the researcher." That DM target does not exist at deliberation time.
- **Migration sprint, by its own summary**, was "a pure documentation/vocabulary change with no behavior … change." Tool names were corrected (`TeamCreate` → named background `Agent`; teardown → session-exit). The protocol — per-round respawn, disk transcripts, Consolidator reduce — was preserved verbatim. That is why landing it cannot resolve a behavior complaint.
- **Context-economy invariant is foundational and must survive.** Established in sprint `20260606-01`: the team-lead never aggregates full content; full transcripts live on disk; the team-lead and scribe operate only on bounded inputs (each member's ≤200-word Final Position). Any redesign must preserve this — the fix cannot route full transcripts into the team-lead's context.
- **Current tooling, verified this session.** `TeamCreate`/`TeamDelete` no longer exist. Persistence is a function of spawn shape: a named `Agent` with `run_in_background: true` is a teammate that persists to session exit and is resumable via `SendMessage` by name/agent-id; a one-shot `Agent` returns and disposes. `SendMessage` is the only inter-agent channel. Nested teams are forbidden — the committee must be convened from the main session.

## Scope

**In scope:**
- Rewrite the dispatch + per-round model in `skills/design-committee/SKILL.md` so the four advocacy members and the researcher are spawned once as standing teammates and never re-spawned per round.
- Rewrite `references/team-lead.md` per-round flow so each round advances by `SendMessage` to the standing members, and the team-lead compiles each round's outcome from the members' bounded Final-Position messages.
- Update `references/member-protocol.md` to define standing membership, peer-DM as the deliberation medium, and the rule that a member revises in place across rounds from its own accumulated context.
- Make the researcher a standing teammate so it stays DM-addressable for the whole consult.
- Define teardown via `SendMessage` `shutdown_request` to each standing member (with session-exit auto-disposal as the documented fallback).
- Version-bump every changed skill/reference file; update committee tests; regenerate the skill catalog only if a `description` field changes.

**Out of scope:**
- The four advocacy lenses and their content — the roster and each member's lens are unchanged; only their lifecycle and interaction medium change.
- The scribe's authoring contract and the complete-design document template / FAC fields — the scribe stays a one-shot authoring from bounded inputs.
- Downstream `spec-write` / `spec-harden` / `plan-build` — the committee's output contract is unchanged, so consumers are untouched.
- Re-litigating the context-economy architecture — it is a constraint to preserve, not a target to redesign.

## Key Decisions

1. **Members are standing teammates, spawned once.** At convene, spawn the four advocacy members and the researcher as named background `Agent` teammates and reuse them for every round. Alternative considered: keep per-round spawning but "carry context" via prompt — rejected, because re-spawning is a fresh mind by construction and prompt-stuffing prior context is precisely the disk-re-read pattern that fails.
2. **A round is a message, not a spawn.** The team-lead advances each round by `SendMessage` to the existing members; the member revises in place from its own memory. Alternative considered: spawn round-N members seeded with round-(N−1) outputs — rejected for the same reason as D1, and because it loses the member's lived stake in its prior argument.
3. **Deliberation happens via peer-DM and is compiled from messages.** Members challenge each other directly with `SendMessage`; each member sends its bounded Final Position to `main`; the team-lead compiles the round's alignment from those bounded messages. Alternative considered: keep the one-shot Consolidator re-reading disk as the sole synthesis path — rejected because it routes the live deliberation out of the answer. The Consolidator may be retained as an optional enumerate-only helper, but it is no longer the load-bearing path.
4. **Full transcripts stay on disk; only bounded Final Positions enter team-lead/peer messages.** This preserves the context-economy invariant: the team-lead never receives a full transcript, and the scribe still authors from bounded inputs. Alternative considered: have members message full transcripts to the team-lead — rejected, it violates the foundational invariant and bloats the team-lead context.
5. **Researcher is a standing teammate, alive for the whole consult.** It serves on demand via `SendMessage` and remains a valid peer-DM target. Alternative considered: keep researcher as a one-shot and remove the DM-researcher authorization from member prompts — rejected because live, mid-deliberation fact-checking is a genuine need; keeping researcher alive is the higher-value option, and it closes the dead-wire bug.
6. **Teardown is an explicit `shutdown_request` to each standing member, with session-exit disposal as fallback.** Alternative considered: rely solely on session-exit auto-disposal — acceptable as a fallback but rejected as the primary path, because explicit shutdown bounds teammate lifetime to the consult and prevents stranded members leaking context into later unrelated work.

## Constraints

- The context-economy invariant is preserved unchanged: the team-lead never aggregates full content; full transcripts remain on disk; the team-lead and scribe consume only bounded inputs.
- `SendMessage` is the only inter-agent channel; an agent's plain-text output is not visible to other agents, and a teammate is inert until messaged — so round advance must be a message, never a respawn.
- The committee is convened from the main session only; nested teams are forbidden by Claude Code, so a nested committee cannot spawn its members.
- Standalone invocability is retained — the committee convenes from any context with no sprint prerequisite.
- Persistence depends on spawn shape (named background `Agent` = teammate; one-shot `Agent` = subagent); the Consolidator and Scribe remain one-shot subagents.
- Catalog freshness: if any skill `description` changes, regenerate and stage `skills/setup-start/references/skill-index.md` in the same commit; version bumps alone are catalog-safe.
- Staging discipline: stage changed files explicitly by path; never `git add -A`/`git add .`.

## Acceptance Criteria

- A committee consult spawns each of the four advocacy members and the researcher exactly once; no member is spawned a second time across all rounds (no `-rNN` / `-r0Na`/`-r0Nb` instances appear in the transcript).
- Every round after the first advances by `SendMessage` to the existing member agent-ids; the per-round spawn count for members is zero.
- A contested round shows at least one member-to-member `SendMessage` exchange that does not pass through the team-lead.
- The team-lead compiles each round's outcome from members' bounded Final-Position messages; no full transcript enters the team-lead's context (context-economy assertions in the committee test suite still pass).
- The researcher remains alive and DM-addressable from convene through teardown.
- Teardown issues a `shutdown_request` to each standing member (or documents session-exit disposal as the fallback); no reference to `TeamCreate`/`TeamDelete` remains.
- All committee tests pass; changed skill/reference files carry version bumps; the skill catalog is regenerated and staged if and only if a `description` changed.
- `SKILL.md`, `team-lead.md`, and `member-protocol.md` are self-contained: a fresh team-lead agent can run the new protocol from these files alone, with no reliance on the old per-round-respawn flow.
