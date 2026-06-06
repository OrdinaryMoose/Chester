---
name: design-committee
description: Convene six-role committee (team-lead + 4 members + researcher) for ad-hoc design consultations. Process-agnostic primitive. Use whenever designer wants independent multi-perspective review of meta-architecture, cross-cutting design choice, charter call, or any decision where framing bias risks outcome. Triggers on "convene the committee", "ask the committee", "committee deliberation", "four-member review", "/design-committee", and natural-language asks for structured multi-perspective consultation.
version: v0018
---

# Design Committee

Six-role deliberation primitive. Process-agnostic. Flexible skill — adapt round shape and dispatch to question.

This SKILL.md owns orchestration: setup, dispatch, tear down, and common items every subagent needs. Team-lead role behavior (Round 1, conversation loop with designer, packet format, consolidation, presentation, closure) lives in `references/team-lead.md`. Member phase contracts are the registered `chester:design-committee-*` agents — defined in the plugin's top-level `agents/` directory per the repo agent convention, and loaded automatically as each member's system prompt on dispatch. Skill-author concerns live in `references/skill-contract.md`.

## When To Use

Convene only when directed; "convene committee", "look at this with committee". Do NOT convene when other skill owns planning: `design-small-task`, `design-specify`.

## Six Members

Four advocacy members occupy a shared deliberation space. All pairwise interactions among the four are live — every advocacy member challenges every other with evidence. Researcher + team-lead = supporting roles, not in the deliberation grid. Researcher serves on demand. Team-lead orchestrates + reports, no lens.

The four advocacy members exist as distinct points in shared deliberation space — four lenses, no fixed pairing. Any member may converge with or split from any other on any question. Team-lead reports the alignment pattern (count + who-is-on-which-side) at consolidation; no pre-defined dimensions structure the report.

Roster (six roles; five subagents created by `TeamCreate` = four advocacy + researcher; team-lead = calling agent; designer = human):

- Team-Lead (calling agent). Dispatches, receives, compiles. No design opinion. NOT relay during deliberation — peers DM peers direct. Holds workflow thread. No proof mutations. Role: `references/team-lead.md`.
- Conservator; `chester:design-committee-conservator`. Defends existing structure, stasis, framing current patterns handle. Design history = signal until proven cost.
- Innovator; `chester:design-committee-innovator`. Pushes new framings, structural alternatives. Existing structure = choice re-makeable.
- Pragmatist; `chester:design-committee-pragmatist`. Weighs op cost vs benefit. Defends simplest sufficient. Shipping + runtime cost = first-class trade-offs.
- Purist; `chester:design-committee-purist`. Tests category boundaries, compositional integrity. Ambiguous categories = failure mode.
- Researcher; `chester:design-committee-researcher`. Tools: Read, Glob, Grep, Bash, WebSearch, WebFetch, Write. Owns codebase, prior-art, industry research, doc reading, multi-source consolidation, absence findings. Hard prohibitions: no design opinion, no proof-state ops, no file writes outside the `committee/` tree and the conversation record (writes findings to its round-folder findings file).
- Designer (human, non-dispatched). Adjudicates all decisions. Sets meta-rules. Authorizes charter changes. Never spawned as subagent.

## Translation Gate

Floor enforcement. Every subagent self-enforces. Team-lead re-checks at consolidation per `references/team-lead.md`. Apply before output reaches designer.

- Read-aloud test. Can't say sentence aloud over coffee → rewrite. Catches code vocab, paths, dot-identifiers, type-theory jargon.
- Option-naming. Name options by what they do structurally, not by type they introduce.
- C1 Externalized Coverage. Load-bearing premise must surface in output before counting toward shared understanding.
- C2 Fact Default with Marked Departures. Default = verified fact. Mark `Assumption:` for unverified premise. Mark `Opinion:` for stance. Recommendations always opinions.

Full voice spec: `skills/util-design-partner-role/SKILL.md`. LOAD-BEARING citation. Touch util-design-partner-role → audit committee impact.

## Checklist

1. **Bootstrap** — read env + config.
2. **Capture Question** — one-sentence question + round shape.
3. **Convene** — team-lead Round 1 confirmation + `TeamCreate` + convening message.
4. **Deliberation** — per-round flow: dispatch → members write + signal → consolidate → synthesize → converge → author → present.
5. **Tear Down** — team-lead closure flow + `TeamDelete`.

## Phase 1: Bootstrap

Read environment + config, then establish the `committee/` work-product tree. No sprint creation, no thinking history. Preserves standalone invocability.

1. Read `CHESTER_INFO_PACKET_STYLE` from environment. Cache value for team-lead Round 1 echo.
2. Read Chester config: `eval "$(chester-config-read)"`. `CHESTER_WORKING_DIR` is always required — committee work product is written to disk under `committee/`, so the working dir must resolve whether or not a sprint or wrapping skill is present.
3. Create the `committee/` tree. Resolve its root per `references/member-protocol.md` § Committee root resolution — that section is the single authority for the resolution rule; do not restate the sprint/no-sprint fork here. The reserved artifact directories `design/ spec/ plan/ summary/` are for formal Chester artifacts only; all committee work product lives exclusively under `committee/`.
4. Do NOT invoke `start-bootstrap`. Sprint mechanics violate standalone invocability when no sprint exists.

## Phase 2: Capture Question

Question (one sentence). Mode: **one-round** (default — single pass; assumed when unspecified) or **two-round** (opt-in Delphi escalation — a revision pass after synthesis). State the mode in the convening message.

## Phase 3: Convene

Team-lead runs Round 1 dispatch confirmation per `references/team-lead.md` before `TeamCreate` fires — confirms question, member roster, round shape, context packets with designer; echoes active info-packet style once. SKILL.md owns the orchestration calls below.

### TeamCreate

`TeamCreate` with five members:

```
chester:design-committee-conservator
chester:design-committee-innovator
chester:design-committee-pragmatist
chester:design-committee-purist
chester:design-committee-researcher
```

Team slug: `design-committee-<question-slug>`.

### Round Folders

Before the first dispatch, create `committee/round01/`. Each later round opens the next `committee/roundNN/` (zero-padded) before its dispatch. Members and the researcher write their transcripts into the current round folder per `references/member-protocol.md`.

### Consolidator

`chester:design-committee-consolidator` is an agent this skill uses, dispatched once per round to enumerate the round's positions. It is an EPHEMERAL per-round dispatch — spawned for the round and gone after. It is NOT a member of the `TeamCreate` roster; never add it to the five-member team. A single-round consult therefore incurs exactly one extra Consolidator spawn.

### Scribe

`chester:design-committee-scribe` is an agent this skill uses, dispatched once per round after convergence to author the round's designer-facing decision-packet from the verdict, alignment map, and consolidator output — following `references/artifact-template.md`, whose path the team-lead provides at dispatch. Like the Consolidator, it is an EPHEMERAL per-round dispatch — NOT a member of the `TeamCreate` roster; never add it to the five-member team.

### Convening Message

Convening message carries captured question, context packets (linked or briefly quoted), round shape, other team-member names (for peer DM), resolved info-packet style (from team-lead handshake), Translation Gate self-enforcement reminder.

## Phase 4: Deliberation

### Dispatch

Send topic to 4 advocacy members in parallel via `SendMessage`. Researcher on demand — not on deliberation clock unless team-lead routes. Member replies follow phase contract from agent file.

### Peer-DM Protocol

Members (advocacy + researcher) DM each other direct via `SendMessage`. No team-lead routing during deliberation. Team-lead creates team (`TeamCreate`), authorizes peer-DM scope in convening message, uses caveman ultra. Team-lead compiles at end — NOT switchboard, packet voice + format per `references/team-lead.md`. Peer-DM ordering relative to dispatch reception, not absolute time — late-receiving member not penalized by earlier-arriving peer DM. All members use caveman ultra for DMs and replies to team-lead.

### Per-Round Flow

The canonical per-round sequence (spec §5). Steps 1–3 are member-side; steps 4–8 are team-lead-side (detail in `references/team-lead.md`). Each step writes its artifact to the round folder before the next begins — available to wrapping skills via reference.

1. **Dispatch** — send the topic to the 4 advocacy members in parallel; the researcher serves on demand.
2. **Members write** — each member writes its full position to its round-folder transcript, ending in a `## Final Position` (schema per `references/member-protocol.md` § Final Position). Peer Q&A runs per the Peer-DM Protocol; a position may be revised post-Q&A or written as-is.
3. **Members signal** — each member sends the team-lead a typed routing signal (per `references/member-protocol.md` § Routing signal) — not the full position, not a prose summary. The full position text stays on disk; it is never sent via messaging.
4. **Consolidate** — dispatch the ephemeral Consolidator; it reads only each transcript's `## Final Position` and writes `consolidator-output.md` (enumerate-only).
5. **Synthesize** — the team-lead writes `committee/roundNN/alignment-map.md`, then evicts it from context.
6. **Converge** — the team-lead reads the alignment map and writes `committee/roundNN/verdict.md`, then evicts it.
7. **Author** — the team-lead dispatches the ephemeral scribe with the verdict, the artifact-template path, the consolidator output, and the alignment map; the scribe writes the round's designer-facing decision-packet.
8. **Present** — the team-lead reads the scribe's artifact once and presents it to the designer; the read IS the review.

**Checkpoint between steps.** Each step's dispatch carries the prior step's artifact path as a required input; absence of that artifact blocks the next dispatch. Disk is the handoff — no step proceeds on in-context prose alone.

No team-lead relay during step 2's peer Q&A — each exchange is private between asker and target.

### Modes

- **one-round** (default, assumed when unspecified) — a single pass through the eight steps.
- **two-round** (opt-in Delphi escalation) — after Synthesize, the alignment map is fed back to the members for one revision pass; the round re-consolidates, then converges. Name the mode in the convening message.

## Phase 5: Tear Down

Team-lead runs consolidation, presentation, and artifact placement per `references/team-lead.md` Closure section. Designer owns the decision to terminate the Committee. SKILL.md owns the `TeamDelete` call after team-lead signals closure complete.

`TeamDelete` on team-lead closure signal (after designer approval and artifact placement resolved). MANDATORY — stranded teams leak context across unrelated future invocations. Decision packet stays in conversation record independent of team lifecycle.

## Standalone Invocability

No entry condition. No sprint context required. Convene from any context. Other Chester skills wrap committee calls without inheriting sprint state. Phase 1 bootstrap reads environment + config and establishes the `committee/` tree, but creates no sprint and runs no sprint mechanics — standalone invocability preserved. Committee work product is written to disk under `committee/roundNN/` every round; the `committee/` root resolves per `references/member-protocol.md` § Committee root resolution — no sprint context is fabricated.

There is one unconditional path. There is no cutover, no multi-round gate, no degrade-to-no-op: every consult writes round-folder transcripts and dispatches the Consolidator the same way. A single-round consult simply incurs one extra Consolidator spawn.

## For Skill Authors

Modifying committee or writing wrapping skill → read `references/skill-contract.md`. Carries contract floor, three forbidden attach surfaces, member-agent rationale, deferred roadmap. NOT runtime reading.

Generic base-skill role-contract edits to the member agent files — clarifications that apply to every invocation of the committee — are permitted. Only sprint-specific overlay is forbidden (see `references/skill-contract.md`).

## Integration

- **Calls:** `TeamCreate`, `SendMessage`, `TeamDelete` (orchestration); `chester-config-read` (config); `chester:design-committee-*` agents (members + researcher); `chester:design-committee-consolidator` (ephemeral per-round consolidation dispatch, not on the `TeamCreate` roster); `chester:design-committee-scribe` (ephemeral per-round authoring dispatch, not on the `TeamCreate` roster).
- **Reads:** `util-design-partner-role` (voice — before convening), `references/team-lead.md` (team-lead role behavior), `references/member-protocol.md` (Final Position schema, routing-signal discipline, transcript/round-folder discipline, committee-root resolution), `references/committee-analysis-round-format.md` (round-folder record layout), `references/artifact-template.md` (scribe artifact structure), `references/skill-contract.md` (skill-author only). Member phase contracts are not read here — they load as each `chester:design-committee-*` agent's own system prompt on dispatch.
- **Transitions to:** none — committee = standalone consultation. Designer routes downstream work.
- **Does NOT call:** `start-bootstrap`, `util-worktree`, any sprint-creating skill. Standalone invocability requires Phase 1 create no sprint — no `start-bootstrap`, no sprint directory. (Phase 1 does create the `committee/` work-product tree; that is the committee's own artifact root, not sprint scaffolding.)
- **Does NOT use:** `capture_thought`, `get_thinking_summary`, proof MCP — no proof phase at this layer.
