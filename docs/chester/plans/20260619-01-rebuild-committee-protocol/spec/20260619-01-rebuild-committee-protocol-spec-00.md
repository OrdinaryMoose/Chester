# Spec: Rebuild Committee Deliberation Protocol

**Sprint:** 20260619-01-rebuild-committee-protocol
**Parent brief:** docs/chester/working/20260619-01-rebuild-committee-protocol/design/20260619-01-rebuild-committee-protocol-design-00.md

**Architecture:** Hybrid — discrete rounds with self-organizing in-round peer-DM over standing teammates, retaining the enumerate-only reducer. The four advocacy members and the researcher are spawned once as named background `Agent` teammates and reused for the whole consult; each round is opened by a `SendMessage` to those existing instances (never a re-spawn); within a round members address each other directly via `SendMessage` bounded by the existing 2-exchange-per-pair cap; full transcripts stay on disk and only bounded ≤200-word Final Positions enter messages; the per-round disk checkpoint, the enumerate-only Consolidator, and the bounded-input Scribe are retained unchanged. **FAC basis** — *feasible:* the change is edits to four existing files plus the member/researcher agent files, no new agents or tools, within one sprint; *acceptable:* it converts the live failure (sequential one-shots the team-lead stitches) into standing, message-driven, peer-deliberating members; *complete:* it covers standing membership, message-driven rounds, in-round peer-DM, researcher lifetime, teardown, and byte-intact context-economy preservation. **Rejected alternatives + declared sacrifices:** Architect A (pure discrete rounds) — rejected because in-round deliberation read as team-lead-sequenced; the hybrid grafts B's direct peer-DM. Architect B (free-running self-organizing grid) — rejected for non-termination risk, loss of the crash-recovery checkpoint, and pressure to pull full content into the team-lead. The hybrid's conceded sacrifice: deliberation is not fully free-running — the team-lead still opens each round, kept deliberately because the per-round disk checkpoint is load-bearing for both context economy and crash recovery. **Override note (brief D3):** the brief's Key Decision 3 tentatively allowed demoting the Consolidator to an optional helper with the team-lead compiling alignment directly from members' Final-Position messages; the settled architecture supersedes that and retains the enumerate-only Consolidator as the load-bearing reduce step — because the brief's own foundational context-economy invariant (D4; sprint `20260606-01`) requires the consolidate role to be owned by a dedicated off-team-lead reducer and explicitly forbids it co-locating on the team-lead. D3's compile-from-messages route is therefore resolved in favor of D4's non-negotiable invariant; the two brief decisions could not both hold, and D4 wins. *Producer: spec-architect (small-task path).*

## Goal

Chester's `design-committee` is meant to convene four persistent advocacy members who hold their own context across rounds and challenge each other directly until a question resolves. In practice it produces sequential one-shot agents whose outputs the team-lead stitches together — verified in a live failure transcript where the team-lead called `SendMessage` zero times, round 1 members were spawned as teammates but never resumed, and rounds 3–4 reverted to fresh one-shots (`conservator-r03`, `-r04a`, `-r04b`). The `20260618-01` migration corrected the tooling vocabulary (`TeamCreate` → named background `Agent`) but was scoped as a no-behavior change and left the deliberation protocol — per-round respawn, disk-transcript-plus-reducer synthesis — intact. This spec rebuilds that protocol so members are spawned once as standing teammates and every round advances by message to those same instances, making live persistent peer deliberation real, while preserving the committee's foundational context-economy invariant byte-for-byte.

## Components

Edits land in four skill/reference files plus the member and researcher agent files. No new agents, no new tools, no new files.

- **`skills/design-committee/SKILL.md`** (currently v0025) — orchestration layer.
  - *Phase 3 / Spawn Members as Teammates:* state explicitly that the five named background `Agent` spawns are a one-time setup step performed before the first round dispatch, and that the five teammate names/agent-ids are fixed for the whole consult — never re-spawned.
  - *Phase 4 / Deliberation:* add the rule "a round = a `SendMessage` to each standing advocacy member, not a new `Agent` dispatch" at the point a reader first meets Phase 4; add a forward pointer to `member-protocol.md` for the in-round peer-DM contract. The numbered per-round sequence is **not** written here (it stays in `team-lead.md`).
  - *Phase 5 / Tear Down:* replace the migration-era "auto-disposes at session exit; no explicit teardown" wording with the explicit `shutdown_request` flow, session-exit auto-dispose as documented fallback.
- **`skills/design-committee/references/team-lead.md`** (currently v0015) — team-lead role, sole owner of the numbered per-round flow.
  - *Per-Round Flow:* the dispatch step advances the round by `SendMessage` to the standing teammate instances spawned in Phase 3 — with an explicit "do not re-spawn" directive. The Consolidate step (one-shot Consolidator reading only `## Final Position`) is unchanged.
  - *Closure:* replace the auto-dispose-only description with the teardown sequence — send `shutdown_request` to each of the five standing teammates in parallel, wait a brief fixed period, treat non-response as implicit acknowledgment, proceed to record-completion close.
- **`skills/design-committee/references/member-protocol.md`** — member contract.
  - New `## Shutdown request` section defining member-side behavior on receiving `shutdown_request`: flush any pending transcript write, send a one-field acknowledgment, stop.
  - The in-round peer-DM section is confirmed as self-organizing (member-to-member, no team-lead relay) and bounded by the existing 2-exchange-per-pair cap; standing-membership wording added so a member knows it persists across rounds and revises in place.
- **`agents/design-committee-{conservator,innovator,pragmatist,purist}.md`** and **`agents/design-committee-researcher.md`** — add a `## Shutdown request` handler (or a forward reference to `member-protocol.md § Shutdown request`); confirm standing-teammate lifecycle wording.
- **`tests/`** — extend `test-design-committee-context-economy.sh` with assertions for the new protocol invariants; update any version-pinned assertions.

## Data Flow

Per round N (the team-lead executes the numbered flow owned by `team-lead.md`):

1. Team-lead creates `committee/roundNN/` on disk.
2. **Dispatch (message, not spawn):** team-lead sends `SendMessage` to each of the four standing advocacy teammates with the round's question; the researcher receives a `SendMessage` only if a specific research question is routed to it.
3. **In-round peer-DM (self-organizing):** members address one another directly via `SendMessage` (≤2 exchanges per pair, caveman ultra) to challenge positions; these exchanges live in members' accumulated contexts and their transcript `## Follow-ups`; nothing from them enters the team-lead's context.
4. **Member return:** each member writes its full transcript ending in `## Final Position` (≤200 words, member-authored fields) to `committee/roundNN/<member>-transcript.md`, then sends the typed routing signal `{member, status, round, transcript}` to the team-lead. The team-lead receives only the signal, not the content.
5. **Consolidate (reducer):** team-lead dispatches the one-shot Consolidator with the round-folder path; it reads only the `## Final Position` sections, writes `committee/roundNN/consolidator-output.md`, returns a compact pointer.
6. **Synthesize → Converge:** team-lead reads only `consolidator-output.md`, writes `alignment-map.md` then `verdict.md`, evicting each after write.
7. **Author:** team-lead dispatches the one-shot Scribe with verdict + consolidator-output + alignment-map + template path; Scribe writes the complete-design document, returns a pointer.
8. **Present:** team-lead presents via the decision-communication packet.

Across rounds: the same teammate instances receive the next round's `SendMessage` (no respawn). Teardown: after the designer declares sufficiency and artifacts are placed, the team-lead sends `shutdown_request` to each of the five standing teammates; session-exit auto-dispose is the fallback.

Disk-vs-message boundary: full transcripts, researcher findings, consolidator-output, alignment-map, verdict, complete-design document, and ledger live on **disk**; only typed routing signals and the Consolidator's compact pointer travel in **messages** to the team-lead; peer-DMs are member-to-member only and never reach the team-lead.

## Error Handling

- **Shutdown acknowledgment stall:** a teammate mid-exchange may not answer `shutdown_request`. Team-lead sends to all five in parallel, waits a brief fixed period, treats non-response as implicit acknowledgment, and proceeds; session-exit auto-dispose guarantees no leak.
- **Malformed routing signal:** rejected unread with one correction prompt (existing rule, unchanged).
- **Member position not reflected in Final Position:** the write-then-send sequencing rule requires the transcript — including peer-DM-driven revisions in `## Follow-ups` — to be final before the routing signal is sent; the Consolidator reads the Final Position as written.
- **Non-termination:** bounded by the 2-exchange-per-pair cap and the per-round checkpoint; a member that does not converge writes its current position and signals anyway, so the round closes on signals-received, and a preserved-split is a valid outcome.
- **`blocked` signal:** a member needing clarification sends `status: blocked`; the team-lead responds as today (the Round 1 designer-confirmation step is the primary defense against mid-round confusion).
- **Standing-member context growth:** bounded by the 200-word Final Position cap and caveman-ultra peer-DM; accepted as the cost of genuine persistence within one consult.

## Testing Strategy

- **Protocol-invariant assertions** added to `tests/test-design-committee-context-economy.sh`: (a) SKILL.md/team-lead.md describe spawning members once and advancing rounds by message, with an explicit no-re-spawn directive; (b) teardown is described as `shutdown_request` with session-exit fallback, and no `TeamCreate`/`TeamDelete` token appears; (c) the numbered per-round flow appears in `team-lead.md` only and SKILL.md carries named phases without a rival numbered list; (d) the context-economy language (Consolidator enumerate-only, team-lead reads only bounded inputs, Scribe bounded inputs) remains present and unchanged.
- **Version-stamp assertions:** the existing context-economy pins are range-based — `test-design-committee-context-economy.sh` asserts team-lead `v0008–v0099` and SKILL `v0018–v0099` — and already tolerate the planned single-step bumps (team-lead v0015→v0016, SKILL v0025→v0026). No pin edit is required for these bumps; the test work is purely additive (new protocol-invariant assertions). Move a pin only if a bump would fall outside its range.
- **Catalog freshness:** `test-generated-agents-current.sh` must stay green; regenerate `skill-index.md` only if a `description` changes.
- **Full suite:** all `tests/test-*.sh` pass.
- **Live validation (manual):** the team-lead-context envelope and genuine standing-member behavior are confirmable only by a real committee run, not the suite — call this out; do not claim machine verification of the live grid.

## Constraints

- The context-economy invariant (sprint `20260606-01`) is preserved byte-intact: team-lead never aggregates full content; full transcripts on disk; team-lead and Scribe consume only bounded inputs; Consolidator reads only `## Final Position` verbatim, enumerate-only; disk-artifact checkpoint between every step.
- The numbered per-round flow lives in `team-lead.md` only; SKILL.md holds named phases with one-sentence descriptions and no rival numbered list. This single-owner structure is **already in place on main** (verified: `team-lead.md` owns the numbered `Per-Round Flow`; SKILL.md carries a named-phase Checklist only) — the rebuild must *preserve* it, not reintroduce a rival numbered list while editing Phase 4. (Background: sprint `20260613-01` decided this split but its artifacts were never merged; the end-state nonetheless holds on main.)
- `committee-analysis-round-format.md` is a frozen file (designer decision, `20260611-01`) and is left untouched.
- `SendMessage` is the only inter-agent channel; an agent's plain text is invisible to peers; a teammate is inert until messaged — so round advance must be a message, never a respawn.
- The committee is convened from the main session only; nested teams are forbidden.
- Standalone invocability is retained — convene from any context, no sprint prerequisite.
- The Consolidator (enumerate-only) and Scribe (bounded inputs) contracts and the Final Position / routing-signal / peer-DM schemas are reused unchanged.
- Staging discipline: stage changed files explicitly by path; never `git add -A`/`git add .`.
- Every changed skill/reference/agent file carries a version bump.

## Non-Goals

- Changing the four advocacy lenses or the roster — only their lifecycle and interaction medium change.
- Changing the Scribe authoring contract or the complete-design document template / eight FAC fields.
- Changing downstream `spec-write` / `spec-harden` / `plan-build` — the committee output contract is unchanged.
- Redesigning the context-economy architecture — it is preserved, not retargeted.
- Closing the verification gaps from the `20260612-01` postmortem (false-invariant-survives-rounds) — deferred.
- A fully free-running, round-less grid — explicitly rejected in architecture selection.

## Acceptance Criteria

### AC-1.1 — Members spawned exactly once

**Observable boundary:**
- A committee consult spawns each of the four advocacy members and the researcher exactly once → no second spawn of any member appears across all rounds.
- No `-rNN` / `-r0Na` / `-r0Nb` suffixed member instances appear in the run.

**Given:** a committee consult of two or more rounds
**When:** the deliberation runs to completion
**Then:** the transcript shows five named background `Agent` spawns total for members+researcher, all before round 1, and zero member spawns thereafter

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-1.2 — Rounds advance by message, not spawn

**Observable boundary:**
- Each round after the first → advanced by a `SendMessage` to existing member agent-ids; per-round member spawn count is zero.

**Given:** the protocol described in SKILL.md and team-lead.md
**When:** a reader follows the per-round flow
**Then:** the dispatch step is a `SendMessage` to the standing instances with an explicit "do not re-spawn" directive, and no `Agent` dispatch of a member occurs within a round

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-2.1 — Self-organizing in-round peer-DM

**Observable boundary:**
- A contested round → contains at least one member-to-member `SendMessage` exchange that does not pass through the team-lead.
- Peer-DM is bounded by the 2-exchange-per-pair cap.

**Given:** a round in which members disagree
**When:** members deliberate
**Then:** members address each other directly via `SendMessage` (≤2 per pair, caveman ultra), the team-lead is not a relay, and the exchange is recorded in member transcripts, not in team-lead context

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-3.1 — Team-lead compiles from bounded inputs only

**Observable boundary:**
- The team-lead receives only typed routing signals and the Consolidator's compact pointer during a round → no full transcript body enters team-lead context.
- The Consolidator reads only `## Final Position` sections; the team-lead reads only `consolidator-output.md`.
- The team-lead does not itself aggregate member Final Positions from messages → the dedicated off-team-lead Consolidator owns the reduce step (consolidate may not co-locate on the team-lead, per the `20260606-01` invariant; supersedes brief D3 per the Architecture override note).

**Given:** the context-economy invariant from sprint `20260606-01`
**When:** the committee context-economy test suite runs
**Then:** the enumerate-only-Consolidator, bounded-team-lead, and bounded-Scribe assertions all pass, the invariant language is unchanged, and no spec section routes the consolidate step onto the team-lead

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-3.2 — Researcher standing and DM-addressable

**Observable boundary:**
- The researcher is spawned as a standing teammate at convene → it remains alive and DM-addressable from convene through teardown.

**Given:** member prompts that authorize peer-DM to the researcher
**When:** a member DMs the researcher mid-deliberation
**Then:** the researcher is a live teammate that can answer (no dead-wire: it is not a one-shot disposed before members run)

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-4.1 — Teardown via shutdown_request

**Observable boundary:**
- At consult end → the team-lead sends a `shutdown_request` `SendMessage` to each of the five standing teammates; session-exit auto-dispose is documented as fallback.
- No `TeamCreate` / `TeamDelete` token remains in any committee file.

**Given:** a completed consult with artifacts placed
**When:** the team-lead runs Closure
**Then:** Closure issues `shutdown_request` to all five teammates in parallel, treats non-response as implicit acknowledgment after a brief wait, and proceeds to record-completion close

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-5.1 — Single numbered flow in team-lead.md

**Observable boundary:**
- The numbered per-round flow appears in `team-lead.md` only → SKILL.md carries named phases with one-sentence descriptions and no rival numbered list.
- This structure already holds on main → the rebuild's Phase 4 edits introduce no rival numbered list (preserve, do not duplicate).

**Given:** the single-owner structure already in place on main (team-lead.md owns the numbered Per-Round Flow; SKILL.md is named-phases-only)
**When:** a reader looks for the per-round numbered sequence after the rebuild
**Then:** it is found in `team-lead.md` alone; SKILL.md Phase 4 names the phases and points to team-lead.md, with no rival numbered list introduced by the rebuild

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-5.2 — Frozen round-format file untouched

**Observable boundary:**
- `committee-analysis-round-format.md` → unchanged by this sprint (no diff).

**Given:** the designer freeze on that file (`20260611-01`)
**When:** the sprint diff is inspected
**Then:** the file shows no modification

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-6.1 — Tests pass, versions bumped, catalog consistent

**Observable boundary:**
- All `tests/test-*.sh` pass → including the new protocol-invariant assertions.
- Every changed skill/reference/agent file carries a version bump; `skill-index.md` is regenerated and staged iff a `description` changed.

**Given:** the completed implementation
**When:** the full test suite runs
**Then:** 0 failures, version-stamp assertions pass, and `test-generated-agents-current.sh` is green

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-6.2 — Self-contained protocol documents

**Observable boundary:**
- `SKILL.md`, `team-lead.md`, and `member-protocol.md` → describe the new protocol completely; a fresh team-lead agent can run it from these files alone with no reliance on the old per-round-respawn flow.

**Given:** a team-lead agent with no prior context
**When:** it reads the three files
**Then:** it can spawn standing members once, advance rounds by message, run in-round peer-DM, keep transcripts off its own context, and tear down via shutdown_request — with no residual instruction to re-spawn per round

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

<!-- created-at: 2026-06-19T16:12:26Z -->
<!-- produced-by spec-write@v0002 -->
