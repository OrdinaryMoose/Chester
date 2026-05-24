---
name: design-committee
description: Convene six-role committee (team-lead + 4 members + researcher) for ad-hoc design consultations. Process-agnostic primitive. Use whenever designer wants independent multi-perspective review of meta-architecture, cross-cutting design choice, charter call, or any decision where framing bias risks outcome. Triggers on "convene the committee", "ask the committee", "committee deliberation", "four-member review", "/design-committee", and natural-language asks for structured multi-perspective consultation.
version: v0007
---

# Design Committee

Six-role deliberation primitive. Process-agnostic. Flexible skill — adapt round shape and dispatch to question.

## When To Use

Convene only when directed; "convene committee", "look at this with committee". Do NOT convene when other skill owns planning: `design-small-task`, `design-specify`.

## Six Members

Four advocacy members organize as two opposing pairs. Each pair tensions one design axis — opposition structural, not preference. Pair convergence = signal to designer; pair split = irreducible trade-off team-lead surfaces.

- **Preserve ↔ Transform axis.** Conservator opposes Innovator. Tensions whether existing structure is signal or cost.
- **Cost ↔ Integrity axis.** Pragmatist opposes Purist. Tensions whether shipping/runtime cost or compositional cleanliness wins when they conflict.

Roster:

- Team-Lead (calling agent). Dispatches, receives, compiles. No design opinion. NOT relay during deliberation — peers DM peers direct. Holds workflow thread. No proof mutations. Role: `references/team-lead.md`.
- Conservator; `chester:design-committee-conservator`. Opposes Innovator. Defends existing structure, stasis, framing current patterns handle. Design history = signal until proven cost.
- Innovator; `chester:design-committee-innovator`. Opposes Conservator. Pushes new framings, structural alternatives. Existing structure = choice re-makeable.
- Pragmatist; `chester:design-committee-pragmatist`. Opposes Purist. Weighs op cost vs benefit. Defends simplest sufficient. Shipping + runtime cost = first-class trade-offs.
- Purist; `chester:design-committee-purist`. Opposes Pragmatist. Tests category boundaries, compositional integrity. Ambiguous categories = failure mode.
- Researcher; `chester:design-committee-researcher`. Tools: Read, Glob, Grep, Bash, WebSearch, WebFetch. Owns codebase, prior-art, industry research, doc reading, multi-source consolidation, absence findings. Hard prohibitions: no design opinion, no proof-state ops, no file writes outside conversation record.
- Designer (human, non-dispatched). Adjudicates all decisions. Sets meta-rules. Authorizes charter changes. Never spawned as subagent.

## Translation Gate

Every subagent self-enforces. Team-lead re-checks at consolidation. Apply before output reaches designer.

- Read-aloud test. Can't say sentence aloud over coffee → rewrite. Catches code vocab, paths, dot-identifiers, type-theory jargon.
- Option-naming. Name options by what they do structurally, not by type they introduce.
- C1 Externalized Coverage. Load-bearing premise must surface in output before counting toward shared understanding.
- C2 Fact Default with Marked Departures. Default = verified fact. Mark `Assumption:` for unverified premise. Mark `Opinion:` for stance. Recommendations always opinions.

Full voice spec: `skills/util-design-partner-role/SKILL.md`. LOAD-BEARING citation. Touch util-design-partner-role → audit committee impact.

## Peer-DM Protocol

Members DM each other direct via `SendMessage`. No team-lead routing during deliberation. Team-lead creates team (`TeamCreate`), authorizes peer-DM scope in convening message, uses TerseVoice. Team-lead compiles at end — NOT switchboard, packet voice + format per `references/team-lead.md`. Peer-DM ordering relative to dispatch reception, not absolute time — late-receiving member not penalized by earlier-arriving peer DM. All members use TerseVoice for DMs and replies to team-lead.

## One-Round-Format

Canonical shape. Available to wrapping skills via reference.

1. Each member writes position covering dispatched questions.
2. Each member sends 1 question direct-DM via `SendMessage` to chosen peer (any member, researcher, or team-lead).
3. Each member answers incoming questions — 1 response per asker, direct-DM back.
4. Each member submits final position to team-lead. Position MAY be revised post-Q&A, or sent as-is.

No team-lead relay during steps 2–3. Each Q&A private between asker and target.

## Workflow

### Step 1 — Capture Question

Question (one sentence). Round shape (default one-round-format; custom = state in convening message).

### Step 2 — Convene Team

`TeamCreate` with five members:

```
chester:design-committee-conservator
chester:design-committee-innovator
chester:design-committee-pragmatist
chester:design-committee-purist
chester:design-committee-researcher
```

Team slug: `design-committee-<question-slug>`.

Convening message carries captured question, context packets (linked or briefly quoted), round shape, other team-member names (for peer DM), Translation Gate self-enforcement reminder.

### Step 3 — Dispatch

Send topic to 4 members parallel via `SendMessage`. Researcher on demand — not on deliberation clock unless team-lead routes. Member replies follow phase contract from agent file.

### Step 4 — Consolidate

Team-lead reads all replies. Produces decision packet per `references/team-lead.md` (format, consolidation rules, marker discipline).

### Step 5 — Present to Designer

Team-lead presents packet. Presentation rules per `references/team-lead.md` — no adjudication, no collapsing irreducible splits. Designer asks another round → loop Step 1 with updated inputs.

### Step 6 — Tear Down

`TeamDelete` on designer closure signal ("we're done", "decision made", "shelve this"). MANDATORY — stranded teams leak context across unrelated future invocations. Decision packet stays in conversation record independent of team lifecycle.

## Standalone Invocability

No entry condition. No sprint context. No config. Convene from any context. Other Chester skills wrap committee calls without inheriting sprint state.

## Reading Order (Team-Lead)

Before convening:

1. This SKILL.md.
2. `skills/util-design-partner-role/SKILL.md` — voice. LOAD-BEARING.
3. `references/team-lead.md` — packet format, consolidation, presentation.
4. Each `agents/design-committee-*.md` for members + researcher convened — phase contract, output format.
5. `references/TerseVoice.md` — dispatch + DM voice.

`skills/util-dispatch/SKILL.md` describes one-shot `Task` parallel dispatch — NOT orchestration pattern here. Committee runs as `TeamCreate`-named persistent team with `SendMessage` routing.

## For Skill Authors

Modifying committee or writing wrapping skill → read `references/skill-contract.md`. Carries contract floor, three forbidden attach surfaces, member-agent rationale, deferred roadmap. NOT runtime reading.
