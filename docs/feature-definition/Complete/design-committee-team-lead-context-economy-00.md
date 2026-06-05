# Feature Definition Brief: Team-Lead Context Economy in `design-committee`

**Status:** Draft
**Date:** 2026-06-04
**Origin:** Standalone observation during a StoryDesigner token-usage review. The designer reported that the team-lead (main-thread orchestrator) context fills up fast across a committee deliberation, limiting how many rounds a committee can run before the orchestrator degrades or must be torn down. Token-log forensics on that project confirmed the general mechanism: `cache_read` is ~93% of spend in long sessions, and per-session cost is quadratic in transcript length because every turn re-reads the whole accumulated context. An orchestrator that retains every member return across rounds pays that quadratic. This brief proposes encoding orchestrator context-economy disciplines into the base skill.

---

## Problem Statement

`design-committee` runs one main-thread agent (team-lead) plus five subagents (four advocacy members + researcher). The team-lead is the only long-lived context in the deliberation: it dispatches rounds, receives every member's reply, consolidates, runs the designer conversation loop, persists the round record, and presents the decision packet. Three of those jobs retain payload in the team-lead's own context:

- **Conduit** — every member reply (four per round, plus researcher and peer-DM-surfaced evidence) arrives in the team-lead's context via `SendMessage` and stays there for the rest of the session.
- **Synthesizer** — consolidation holds all four replies simultaneously to produce the alignment pattern and the round record.
- **Controller** — dispatch, round sequencing, designer adjudication, closure. This is the only role that genuinely requires a long-lived main thread.

The Conduit and Synthesizer roles are what bloat the orchestrator. In a single-round Mode A consult the cost is tolerable. But multi-round deliberations — the two-round protocol, late-evidence Step-4 revision sub-rounds (see `design-committee-temporary-roles-and-discipline-00.md` Gap 2), Mode B sessions running many rounds — accumulate every prior round's full member returns in the team-lead context. Cost and degradation both grow quadratically with round count. The designer's symptom ("team-lead fills up fast") is the orchestrator carrying content it has already persisted to disk.

The fix is role separation: a team-lead that holds **pointers and deliberation state**, not member-return payloads. The act of combining four returns — synthesis — is exactly where an orchestrator balloons, so it should happen off-thread in a subagent, with only the result returning to the team-lead.

### Prior attempts

The skill already carries three partial context-economy measures, none of which target the Conduit/Synthesizer retention problem directly:

- **Inter-agent caveman ultra** (SKILL.md ~line 94): members use caveman ultra for peer DMs and replies to team-lead. This compresses each reply but does not stop the team-lead from retaining all of them across rounds. Compression reduces the per-item size; it does not change the quadratic-in-rounds accumulation.
- **Persist-record-every-round** (SKILL.md ~lines 57, 115; `references/team-lead.md` § Record File): the team-lead writes the committee-analysis record to disk every round. This is the right primitive — but persistence is currently *additive* (disk **and** context), not a *move*. The team-lead keeps the verbatim returns in context after persisting them.
- **Mandatory `TeamDelete` at closure** (SKILL.md ~line 111): prevents stranded teams from leaking context into *future unrelated* invocations. It does nothing for context growth *within* a single deliberation.

No prior attempt has treated the team-lead's own context as a budget to be actively held flat across rounds. This is the first brief to do so.

---

## Current State Inventory

### `skills/design-committee/SKILL.md`

- **"Six Members"** (line 17): team-lead + four advocacy members + researcher. Names the roster; does not assign the team-lead a context-retention discipline.
- **Orchestration ownership** (line 11): SKILL.md owns setup, dispatch, tear down. Team-lead role behavior (Round 1, designer conversation loop, packet format, consolidation, presentation, closure) is delegated to `references/team-lead.md`. The retention discipline, if added, lives there.
- **Phase 4 Dispatch** (line 88): "Send topic to 4 advocacy members in parallel via `SendMessage`." Members reply via `SendMessage` into the team-lead's context. No instruction on what the team-lead does with a reply after recording it.
- **Phase 4 Peer-DM Protocol** (line 92): members DM each other directly; "Team-lead compiles at end — NOT switchboard." Team-lead is already kept out of the peer-DM data path; the compile step is where it re-acquires everything.
- **One-Round-Format** (line 96): four-step protocol; finals flow to team-lead. The consolidation that follows is the synthesis bloat point.
- **Caveman-ultra rule** (line 94): "All members use caveman ultra for DMs and replies to team-lead." Existing compression measure.
- **Phase 5 Tear Down** (line 107) and **`TeamDelete`** (line 111): closure and cross-invocation leak prevention.

### `skills/design-committee/references/team-lead.md`

- Owns the team-lead's consolidation, presentation, closure, and **§ Record File** (per-round disk persistence). This is the file that would carry: (a) the move-not-copy retention discipline, (b) the delegation of consolidation to a Consolidator subagent, (c) the inter-round ledger / rehydration discipline. Not yet read in full for this brief — exact section line numbers to be confirmed at implementation.

### `skills/design-committee/references/committee-analysis-round-format.md`

- Per-question record template the team-lead writes every round. This is the on-disk artifact that the move-not-copy discipline treats as the source of truth and that a Consolidator subagent would read instead of the team-lead holding raw returns.

### `chester:design-committee-{conservator,innovator,pragmatist,purist}` and `…-researcher` agents

- Member phase contracts / Output Format shapes, loaded as each member's system prompt on dispatch (plugin top-level `agents/` directory). A member-digest-to-lead / verbatim-to-disk split (Design Direction below) would touch the Output Format sections of these agent files — the same surface the SendMessage-for-finals discipline touches in `design-committee-temporary-roles-and-discipline-00.md`.

### Existing reference for "reducer subagent"

- The **researcher** role (`chester:design-committee-researcher`) already establishes the pattern of a subagent that does heavy reading and "multi-source consolidation" and returns a result without holding a design opinion. A Consolidator subagent is the same shape pointed at the round artifacts — the closest existing model for what the new role's agent file would look like.

---

## Governing Constraints

- **Process-agnostic primitive.** The base skill must stay usable as a Mode A ad-hoc consult with no sprint context. Context-economy disciplines must not require sprint machinery, a wrapping skill, or durable external infrastructure beyond the working-dir record that already exists.
- **The committee-analysis record is already written to disk every round.** These disciplines build on that primitive — they do not add a second persistence path. The record IS the externalized memory; the change is that the team-lead stops *also* retaining what the record already holds.
- **Verbatim texture must survive.** Existing feedback requires verbatim notable quotes in consolidations (`feedback_consolidation_notable_quotes`) and verbatim pole returns persisted before adjudication (`feedback_pole_returns_persist_before_adjudicate`). Any digest-to-lead split must keep the verbatim on disk — compression applies to what crosses into the team-lead's context, never to what is recorded. The full member return still lands in the round artifact.
- **Persist-before-adjudicate timing is immovable.** Verbatim returns persist to disk BEFORE any synthesis, team-delete, or context shift. A move-not-copy discipline strengthens this (persistence becomes load-bearing, not incidental) but must not reorder it.
- **Forbidden attach surfaces / floor-not-ceiling** (per `design-committee-temporary-roles-and-discipline-00.md` and the Mode-separation sister sprint). Member agent-file edits are permitted only as generic base-skill role-contract clarifications, never as sprint-specific overlay. The digest-to-lead discipline, like the SendMessage discipline before it, is generic — it applies to every committee invocation — so it is a base-skill maintenance edit, not a Mode B overlay.
- **Single-round Mode A must not regress.** A one-round ad-hoc consult should not be forced to spawn a Consolidator or maintain a ledger. The disciplines apply where they pay — multi-round deliberations — and degrade to no-ops for a single round.
- **Inter-agent caveman ultra stays.** The compression measure is complementary, not replaced.

---

## Design Direction

Four composable disciplines, layered. Each maps onto a primitive the skill already has.

### 1. Move-not-copy persistence (Conduit fix)

Add a retention discipline to `references/team-lead.md` § Record File:

- After the team-lead writes a member's verbatim return into the round record, it retains in its own working context only a **pointer + one-line digest**: the record file path plus the member's identity, headline position, and confidence. The verbatim body is considered evicted from team-lead context — present on disk, not carried forward.
- The round record on disk is the single source of truth for verbatim member content. Anything the team-lead needs from a prior round, it re-reads from the record (pull-based) rather than holding in context.
- This makes the existing persist-every-round primitive load-bearing: it is no longer a redundant copy but the *only* full copy outside the member's own (torn-down) subagent context.

### 2. Consolidator subagent (Synthesizer fix)

Introduce a Consolidator role — a subagent, modeled on the researcher's "multi-source consolidation" discipline, that the team-lead dispatches to perform round consolidation off-thread:

- The team-lead dispatches the Consolidator with the round record path(s). The Consolidator reads the verbatim member returns from disk, produces the alignment pattern (count + who-is-on-which-side), the synthesized round summary, and the verbatim notable-quotes section, and writes them into `committee-analysis-round-NN.md`.
- The team-lead loads only the Consolidator's finished synthesis — never the four raw returns simultaneously. The act of holding four returns to combine them happens in the Consolidator's context, which is discarded after it returns.
- The Consolidator holds no design opinion and does not adjudicate (same hard prohibitions as the researcher). It is a reducer, not a fifth advocate.
- For a single-round Mode A consult the team-lead MAY consolidate inline (the four returns are already in context once and never re-billed across rounds); the Consolidator is the discipline for multi-round deliberations where inline consolidation would retain every prior round.

### 3. Digest-to-lead / verbatim-to-disk member output split

Extend member Output Format contracts (the four advocacy agent files + researcher) so that, where a wrapping skill or the team-lead enables it:

- The member writes its **full** position (already caveman-ultra) to the round folder on disk, and `SendMessage`s the team-lead a **structured digest** only: identity, headline position, chosen option, top trade-off, confidence, and the record path. The verbatim reasoning reaches the record without transiting — and lodging in — the team-lead's context.
- This reconciles the verbatim-notable-quotes and persist-verbatim requirements with orchestrator economy: verbatim lives on disk; the team-lead carries digests; the Consolidator reads the verbatim when it synthesizes.
- Like the SendMessage-for-finals discipline, this is a generic role-contract clarification (applies to every invocation), not a sprint-specific overlay — so it is a permissible base-skill edit to the agent files.

### 4. Inter-round ledger + rehydration (multi-round accumulation fix)

For multi-round protocols (two-round, Step-4 revision sub-rounds, long Mode B sessions):

- The team-lead maintains a small **deliberation-state ledger** — which round, which members have returned, the running alignment pattern, open questions, designer decisions so far. The ledger is a few hundred tokens, not a transcript.
- At a round boundary, the team-lead's working context can be reduced to (ledger + prior-round Consolidator summary + next-round prompts) rather than the full accumulated history. The team-lead is, in effect, rehydratable from the ledger plus the on-disk records at any round boundary — the same property that makes the committee record the durable memory of the deliberation.
- This bounds team-lead context to roughly `digests-this-round + one Consolidator summary + ledger`, which is **flat across rounds** instead of growing with round count.

### Net effect

Per-round team-lead context goes from `4 × full member return + accumulated prior rounds + reference corpus` down to `4 × one-line digest + 1 Consolidator summary + 1 ledger`. Roughly an order of magnitude smaller, and flat rather than quadratic across rounds — which is what lets the team-lead sustain a long deliberation without filling up.

---

## Open Concerns

- **Does a Consolidator subagent dilute the team-lead's risk-weighted judgment?** Existing feedback (`feedback_two_round_deliberation_protocol`) has the team-lead perform risk-weighted consolidation. If the Consolidator produces the synthesis, the line between "mechanical reduction" (Consolidator) and "risk-weighted judgment" (team-lead) must be drawn. Option A: Consolidator produces the neutral alignment pattern + quotes only; team-lead applies risk weighting to that compact input. Option B: Consolidator produces a full draft synthesis the team-lead edits. Option A keeps judgment with the team-lead and is the lighter context load; lean Option A.
- **Move-not-copy eviction is not literal in an append-only transcript.** A team-lead cannot actually delete a `SendMessage` it already received — the reply is in the transcript and re-billed regardless. True eviction requires either (a) members never sending verbatim to the team-lead in the first place (discipline 3 — digest-to-lead — which is the real lever) or (b) team-lead rehydration at round boundaries (discipline 4) that starts a fresh context from the ledger. Discipline 1 alone is necessary framing but insufficient mechanism; it must be paired with 3 and/or 4 to actually bound context. This should be stated plainly in the implementation so the disciplines are not adopted in a combination that doesn't bind.
- **Rehydration mechanics in a main-thread orchestrator.** The team-lead is the main thread, not a re-spawnable subagent. "Rehydration" likely means an explicit context-compaction / handoff at round boundaries rather than a process restart. Whether Chester's harness supports a clean mid-deliberation compaction for the team-lead, or whether this must be a `util-handoff`-style manual reset, needs confirmation against the runtime.
- **Single-round overhead.** Spawning a Consolidator and maintaining a ledger for a one-round Mode A consult is pure overhead. The degrade-to-no-op rule must be explicit so trivial consults stay cheap. Where is the cutover — round count, member count, or wrapping-skill declaration?
- **Interaction with caveman-ultra.** Digests are a second compression layer on top of caveman-ultra replies. Confirm the two compose without the digest stripping load-bearing texture that the notable-quotes requirement needs — resolved if verbatim-to-disk holds the full texture and only the team-lead-facing path is double-compressed.
- **Agent-file edit surface.** Discipline 3 edits four advocacy agent files plus researcher — four-plus maintenance surfaces for one clarification, the same concern raised for SendMessage discipline. Consider whether digest-to-lead belongs in a shared member-protocol reference rather than per-agent Output Format sections.

---

## Acceptance Criteria

- `references/team-lead.md` carries a move-not-copy retention discipline: after persisting a member return to the round record, the team-lead retains only pointer + one-line digest, and re-reads the record for prior-round verbatim rather than holding it in context.
- A Consolidator subagent (or an equivalent off-thread consolidation mechanism) is defined such that, for multi-round deliberations, the team-lead loads a finished synthesis rather than holding all four raw member returns simultaneously. The Consolidator holds no design opinion and does not adjudicate.
- Member Output Format contracts support a digest-to-lead / verbatim-to-disk split: full position written to the round folder, structured digest sent to the team-lead. Verbatim notable-quotes and persist-before-adjudicate requirements remain satisfied via the on-disk record.
- A deliberation-state ledger bounds team-lead context across rounds; team-lead context per round is demonstrably flat (not growing with round count) in a multi-round dry run.
- Single-round Mode A consults incur no Consolidator/ledger overhead — the disciplines degrade to no-ops below a stated cutover.
- Existing measures (inter-agent caveman ultra, persist-every-round, mandatory `TeamDelete`, linked-not-quoted context packets) remain intact and are composed with, not replaced by, the new disciplines.
- A retrospective dry-run against a prior multi-round committee session (e.g., a two-round or Step-4-revision deliberation) shows the team-lead's peak context materially reduced versus the same session run without the disciplines.
