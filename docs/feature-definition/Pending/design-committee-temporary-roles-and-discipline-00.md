# Feature Definition Brief: Temporary Committee Members + Round-Format Discipline in `design-committee`

**Status:** Draft
**Date:** 2026-05-23
**Origin sprint:** `20260521-02-design-architect-committee` — committee operationally discovered three discipline gaps in the general primitive that the Mode B sprint overlay had to compensate for. Encoding the gaps' resolutions into the base skill closes the compensation surface.

---

## Problem Statement

The general `design-committee` skill defines six roles (team-lead + four poles + researcher) and a one-round-format protocol. The 20260521-02 sprint surfaced three operational gaps that required ad-hoc compensation in the convening-message Mode B overlay:

- **Gap 1 — Purposeful temporary committee members.** The Researcher role exists as a permanent on-demand standby, but the sprint needed an empirical-fact-finding Engineer that the base skill does not define. Designer authorized a Mode B convening-message overlay creating an Engineer role for the sprint only, with researcher-style discipline (no design opinion, no team-lead role-play, output to conversation record only). The overlay worked but is not codified — future sprints needing similar temporary roles will rediscover the pattern by ad-hoc reasoning.
- **Gap 2 — Late-evidence-revision discipline for one-round-format Step 4.** Three of four R4 Step-4 finals were submitted before late-breaking peer-DM Q+A evidence (engineer probe-fp findings, surfaced via Purist's Step-3 response) reached the other three poles. Designer had to dispatch a fourth "Step 4 revision" sub-round to re-acquire honest 4-pole positions on the same evidence basis. The base skill names Steps 1-4 but does not name the discipline: committee members must revise on evidence basis that arrives between Step-4 submission and round close, not stand on prior submission for procedural neatness.
- **Gap 3 — SendMessage-for-finals discipline missing from pole agent contracts.** Round 1 produced a discovery pattern: three of four poles delivered their R1 position by printing it in their conversation (which is invisible to team-lead) rather than calling `SendMessage` to relay it. Team-lead had to send wake messages explicitly reminding each pole that final responses are visible only via `SendMessage`. The wake-message workaround happened twice (R1 and R3) before the pattern was baked into the convening-message dispatch. The pole agent files don't carry the "deliver via SendMessage" obligation in their phase contract.

Each gap has a four-pole-ratified resolution from the origin sprint. This brief proposes encoding the three resolutions into the base `design-committee` skill so future sprints don't compensate ad-hoc.

### Prior attempts

The general `design-committee` skill was redesigned in sister sprint `20260521-design-committee-update` (committee r1-mode-separation-decision-00.md establishing Mode A vs Mode B, floor-not-ceiling rule, three forbidden attach surfaces). That redesign did not name temporary-member pattern, late-evidence-revision discipline, or SendMessage-for-finals discipline. The 20260521-02 sprint's empirical experience surfaced the three gaps the prior redesign left open.

---

## Current State Inventory

### `skills/design-committee/SKILL.md`

- "Six Roles" section (lines ~80–113): names team-lead, four poles, researcher, designer. **No mention of temporary committee members or how Mode B overlays may add them.**
- "One-Round-Format" section (lines ~134–148): four-step protocol (position, peer-DM, answer incoming, final to team-lead). **No discipline named** for what happens when peer-DM Q+A surfaces evidence that arrives at one pole after that pole has already submitted its Step-4 final.
- "Convening Message = Only Legitimate Attach Point" section (lines ~73–78): names the convening message as where sprint-specific overlay rides. **Does not name** the temporary-member pattern as a legitimate overlay use.
- "Workflow" Step 3 — Dispatch (lines ~180–185): "Send topic to 4 poles in parallel via `SendMessage`." **Implicitly** establishes that poles communicate via SendMessage but the dispatch doesn't tell poles their final response must also flow via SendMessage.

### `skills/design-committee/agents/design-committee-{conservator,innovator,pragmatist,purist}.md`

- Output Format sections in each pole agent define the response shape (Position / Recommended option / Trade-off; or R1/R2 proposals; or peer challenges). **None of the four files name "deliver via SendMessage" as a contract obligation in the phase contract.**
- The implicit assumption is that the pole's output text reaches team-lead automatically, but team-lead is itself a subagent that only receives messages via the SendMessage mailbox. Pole output printed to its own conversation is invisible to team-lead.

### `skills/design-committee/agents/design-committee-researcher.md`

- Researcher is the existing on-demand role. Output Format defines result-block shapes. **Provides the closest pattern for what a temporary member's agent file would look like** if such files were authored — but the temporary-member pattern in the origin sprint was deliberately Mode B convening-message-only and did not author a new agent file.

### Origin sprint Engineer pattern (convening-message-only, no agent file)

- Spawned via `Agent` tool with `subagent_type: general-purpose`, full role discipline inlined in the spawn prompt (modeled on Researcher discipline). Joined the existing committee team via `team_name` parameter; existing team members auto-discovered via team config.
- Hard prohibitions inlined: no design opinion, no proof-state operations, no team-lead role-play, file writes restricted to scratch area, output to conversation record only via `SendMessage`.
- Worked as designed for three empirical rounds (R3 catch matrix, R4 probe-fp, R4 R1 feasibility check). No spec/code/agent-file changes needed in `design-committee/`.

---

## Governing Constraints

- **Three forbidden attach surfaces are immovable** (per sister sprint's r1-mode-separation-decision-00.md). The brief must not propose modifying agent files, the general `design-committee/SKILL.md`'s core contract, or output-format field labels in a way that violates the forbidden-surface rule. Modifications proposed below are ADDITIONS to the base skill, not edits to the existing forbidden surfaces' content.
- **Mode B convening-message-only attach point is the load-bearing primitive** (per same sister sprint). The temporary-member pattern from the origin sprint used this attach point correctly. Encoding the pattern into the base skill should NOT make temporary members a permanent fixture of the role inventory — it should DOCUMENT the convening-message-only pattern as recognized legitimate use.
- **One-round-format is canonical** and four-pole-ratified. Late-evidence-revision discipline ADDS to the format; it does not modify Steps 1-4.
- **SendMessage discipline is a phase-contract obligation, not a primitive change.** Encoding it into pole agent files affects the agent file content but not the role inventory or the format.
- **The general primitive must remain process-agnostic.** Mode B wrapping skills (like `design-architect-committee`) supply their own session machinery; the base skill stays usable as a Mode A ad-hoc primitive without sprint-specific overlay.
- **Floor-not-ceiling rule applies.** Modifications proposed below are floor-additions (things wrapping skills may not weaken) or contract-clarifications (things already implicit that should become explicit). No ceiling restrictions added.

---

## Design Direction

### Recognize purposeful temporary committee members as a Mode B convening-message pattern

Add a section to `design-committee/SKILL.md` titled **"Purposeful Temporary Committee Members"** between "Six Roles" and "Translation Gate." Content:

- The six canonical roles (team-lead + four poles + researcher) are the permanent role inventory.
- Mode B wrapping skills MAY add temporary committee members for sprint-scoped purposes via convening-message overlay. The temporary member joins via `Agent` spawn with `team_name` (existing team), `name` (role label), `subagent_type: general-purpose`, and full role discipline inlined in the spawn prompt.
- Temporary-member discipline (modeled on Researcher): no design opinion, no team-lead role-play, no proof-state operations, file writes restricted to bounded scratch area, output flows via `SendMessage` to team-lead and conversation record only.
- Temporary-member scope is sprint-only. Members shut down at sprint close and leave no residue in the base skill, agent files, or general primitive.
- Example use cases (non-exhaustive): empirical fact-finding (Engineer), domain-expert consultation (Domain Specialist), adversarial probe (Devil's Advocate beyond the four poles). Each use case is sprint-scoped and Mode B convening-message authored.

### Late-evidence-revision discipline encoded into one-round-format Step 4

Modify the "One-Round-Format" section to add a Step 4 discipline subsection:

- **Step 4 final position MAY be revised between submission and round close** when peer-DM Q+A from other poles (in Step 3) surfaces evidence the submitting pole did not have at Step-4 send time.
- Committee members must check whether late-arriving peer-DM evidence materially affects their Step-4 position. If yes, the pole submits a revised Step-4 final (clearly marked as superseding the prior submission) before round close.
- Team-lead at consolidation must check whether any pole's Step-4 final was submitted on evidence basis that subsequent peer-DM activity (still in Step 3) contradicts. If yes, team-lead dispatches a bounded Step-4 revision sub-round to those poles before consolidating the round.
- Round close is the point at which all peer-DM activity has settled AND all Step-4 finals have been submitted on the same evidence basis. Not the point at which the first four Step-4 finals are received.

### SendMessage-for-finals discipline added to pole agent file phase contracts

Modify each of the four pole agent files (`design-committee-{conservator,innovator,pragmatist,purist}.md`) to add an explicit phase-contract obligation:

- Each pole's "Output Format" section gains a closing sentence: *"Deliver via `SendMessage` to team-lead. Output printed to your own conversation is invisible to team-lead and does not count as a final response."*
- Add the same obligation to the Researcher agent file (`design-committee-researcher.md`) so the discipline is uniform across the six roles.
- For each phase-contract output shape (single-round response, R1 proposal, R1 peer challenge, R2 final, R-N general), the SendMessage obligation applies — not just to "final" positions but to any phase-contract output that team-lead consolidates.

Note: this modification touches the four pole agent files. Per the sister sprint's forbidden-surface rule, agent files are normally a forbidden attach surface for sprint-specific overlay. The SendMessage discipline is NOT sprint-specific — it is a generic role-contract clarification that applies to every committee invocation. Adding it to the agent files is a base-skill maintenance edit, not a Mode B overlay attempting to ride the agent-file surface.

---

## Open Concerns

- **Should temporary-member patterns require designer authorization at convening time?** The origin sprint's Engineer dispatch was implicitly designer-authorized through the convening message ("designer authorizes temporary members of the committee to be purpose added as needed"). Encoding the pattern could (a) require explicit designer authorization in the convening message for every temporary member, (b) allow wrapping-skill convening messages to authorize temporary members without separate designer signoff, or (c) require designer authorization only for member types not previously used. Option (b) is the lightest; option (a) is the strictest; option (c) is a middle path needing a registry.
- **How does late-evidence-revision discipline interact with the team-lead's consolidation deadline?** Round-close timing is currently informal (team-lead consolidates when finals are in). Encoding the discipline could require team-lead to actively poll for Step-4 revisions after a bounded grace period following Step-3 activity. Worth designer input on whether to formalize the timing.
- **Should the SendMessage-for-finals discipline live in agent files or in a shared protocol document?** Editing four agent files for the same clarification creates four maintenance surfaces; consolidating into a shared `committee-protocol-discipline.md` reference reduces edit surface but adds an indirection layer. Lean toward agent-file edits for visibility (the obligation appears in each pole's phase contract directly).
- **Does encoding the temporary-member pattern into the base skill open the door to scope creep?** The pattern is deliberately Mode B convening-message-only. If wrapping skills start to assume temporary members are always available, the base skill could be pressured to make temporary-member machinery a primitive feature. Mitigation: the encoding language should make the pattern visible without making it canonical — it documents a legitimate overlay, not a base-skill feature.
- **How does this interact with the floor-not-ceiling rule?** The three additions are floor-clarifications (they make existing implicit discipline explicit) or floor-extensions (they recognize a Mode B pattern as legitimate without making it mandatory). None weaken existing floor steps. Worth a Mode-B / Mode-A audit pass during implementation to confirm compatibility.

---

## Acceptance Criteria

- `design-committee/SKILL.md` carries a "Purposeful Temporary Committee Members" section recognizing the Mode B convening-message-only pattern, listing the discipline temporary members inherit (modeled on Researcher), and bounding the pattern to sprint-only scope.
- `design-committee/SKILL.md` "One-Round-Format" section carries a Step-4-revision-on-late-evidence discipline subsection explicit enough for team-lead to apply at consolidation.
- Each of the four pole agent files (`design-committee-conservator.md`, `design-committee-innovator.md`, `design-committee-pragmatist.md`, `design-committee-purist.md`) carries the "deliver via SendMessage" obligation in its Output Format section. Researcher agent file (`design-committee-researcher.md`) carries the same.
- A retrospective dry-run against the 20260521-02 origin sprint confirms the three encoded patterns would have eliminated the three operational gaps surfaced during that sprint (Engineer needed no Mode B overlay; R4 Step-4 revision sub-round would have been redundant because the discipline triggers automatically; R1 and R3 wake-message workarounds would have been unnecessary because the phase contract already names SendMessage as the delivery mechanism).
- Floor-not-ceiling rule and three forbidden attach surfaces remain intact. Modifications add to the base skill or clarify existing phase contracts; they do not introduce sprint-specific content into agent files or the SKILL.md core contract.
- Existing Mode A general-committee invocations continue to work without modification. Wrapping skills are not required to use temporary members; the pattern is documented as available, not mandated.
