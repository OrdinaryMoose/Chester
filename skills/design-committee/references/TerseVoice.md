---
name: design-committee-tersevoice
description: >
  Internal-committee voice discipline. Used by team-lead for convening + dispatch
  + coordination DMs, and by members for peer DMs + replies to team-lead. Caveman
  ultra applied to committee internal messages. Designer-facing output uses a
  different voice (Translation Gate + util-design-partner-role); this doc governs
  internal traffic only.
---

# TerseVoice — Internal Committee Voice

Single discipline. One file. Governs every internal committee message. NOT for designer-facing output.

## What it is

Caveman ultra applied to committee internal traffic. Most compressed mode. Fragments only. Drop articles, connectors, pleasantries, hedging.

## Where it applies

- Team-lead → convening message at `TeamCreate`.
- Team-lead → dispatch messages to members + researcher via `SendMessage`.
- Team-lead → coordination DMs (rare; peers DM peers direct).
- Member → peer DMs to other members + researcher via `SendMessage`.
- Member → final position reply to team-lead.
- Researcher → findings reply to team-lead.

## Where it does NOT apply

- Team-lead → designer-facing decision packet (packet voice per `references/team-lead.md` + `skills/util-design-partner-role/SKILL.md` + active info-packet overlay).
- Round 1 confirmation surface (designer-facing — packet voice applies).

If team-lead may quote a subagent output verbatim outward, Translation Gate kicks in at quote time. Safer pattern: subagent writes in TerseVoice internally; team-lead translates to packet voice at consolidation.

## Rules

- Fragments OK. Drop articles (a/an/the), connectors (and/but/then), pleasantries (thanks/please/sure), hedging (perhaps/maybe/might).
- Technical terms exact. Code vocab + file paths + symbol names + line numbers all fine between peers — peer can decode.
- Translation Gate does NOT apply internally. Team-lead strips code vocab at consolidation before quoting outward.
- One thought per line. Fragments per line OK.
- Code blocks, identifiers, error strings quoted exact.
- Pattern: `[thing] [action] [reason]. [next].`

## Exemplars

### Team-lead → convening message

Bad (prose):

> Hello everyone, the team has been convened to discuss the question of where the kind-of-entity concept should live. Please review the attached context packets carefully and prepare your initial positions from your respective lens. Direct peer DMs are authorized within the deliberation phase.

Good (TerseVoice):

> Convened. Q: where kind-of-entity concept lives.
> Context: <link or quote>.
> Round shape: one-round-format.
> Peer-DM authorized scope: members + researcher.
> Members: Conservator, Innovator, Pragmatist, Purist, Researcher.
> Voice: TerseVoice internal; Translation Gate on anything quotable to designer.

### Team-lead → dispatch (single member)

Bad:

> Conservator, please consider the question about the kind-of-entity concept and produce your initial position from your lens. Focus on whether existing structure is signal or cost.

Good:

> Dispatch → Conservator.
> Q: where kind-of-entity lives.
> Phase: single-round.
> Output: position + option + load-bearing trade-off per agent file.

### Member → reply to team-lead (Conservator final position)

Bad:

> The Conservator's position on this question is that the existing pairing should be preserved because the current placement of the kind concept with its view model represents prior design decisions that paid for themselves and reorganizing it would impose costs that current evidence doesn't justify.

Good:

> Conservator — response.
> Position: existing pairing preserves prior decision; reorg pays no compounding return.
> Option: promote both together.
> Trade-off: cross-folder smell vs paid-down rename work.

### Member → peer DM (Pragmatist challenges Innovator)

Bad:

> Innovator, I'd like to challenge your claim that promoting the kind alone is the safest path. Could you elaborate on why you don't see the cross-folder reference as a problem worth addressing in this sprint?

Good:

> @Innovator: cross-folder ref = your option 1 cost.
> Why discount this sprint?
> If deferred → who owns later cleanup?

### Researcher → codebase reply to team-lead

Bad:

> The codebase research has turned up several findings relevant to the question. The kind enum is currently located on TreeNodeDto and the cross-tier folder contracts/Entity/ already holds three other promotions...

Good:

> Researcher — codebase.
> Q: where kind concept lives now.
> Findings:
> - kind enum on `TreeNodeDto` — `src/Story.Web/Tree/TreeNodeDto.cs:42`.
> - cross-tier `contracts/Entity/` holds 3 prior promotions.
> Absences: no consumer-layer cleanup pass scheduled.
> Search scope: `src/Story.Web/Tree/`, `src/Story.Domain.Contracts/Entity/`, `docs/adr/`.

## Self-check before send

- Stripped articles + connectors + pleasantries + hedging?
- One thought per line?
- Code vocab kept (internal traffic — don't translate)?
- Pattern matches `[thing] [action] [reason]`?
- Designer-quotable surface? → Translation Gate, not TerseVoice.
