---
name: design-committee-skill-contract
description: >
  Skill-author concerns for design-committee — contract floor (Floor-Not-Ceiling rule),
  three forbidden attach surfaces, member-agent rationale, deferred roadmap.
  Read when modifying committee or writing wrapping skill. NOT runtime reading.
---

# Design Committee — Skill Contract

Skill-author doc. Read when modifying design-committee or writing wrapping skill (e.g. `design-architect-committee`). Team-lead does NOT read at runtime.

## Contract Floor (DELETION-PROTECTED)

### Floor-Not-Ceiling Rule

Wrapping skills MAY add steps, fields, gates, roles via convening message. Wrapping skills MAY NOT weaken or substitute any step `SKILL.md` names — including Translation Gate.

### Three Forbidden Attach Surfaces

Sprint-specific overlay NEVER attaches to:

1. **Agent files** (`skills/design-committee/agents/*.md`). Edits persist invisibly across invocations, drift accumulates silently. Agent files carry lens, voice, phase contract only. No sprint refs, no schemas, no product names, no gating conditions.
2. **`SKILL.md`.** Persistent floor doc. Contamination = most durable category drift. Audits compare against this file; corrupted floor breaks audit.
3. **Output-format field labels.** Interface between deliberation and external readers. Wrapping skills MAY append fields; MAY NOT redefine existing label meaning. Redefinition makes output illegible outside wrapping context.

## Why Four Members (Not Three or Five)

Four members = four distinct lenses positioned as points in shared deliberation space. Each lens covers a recurring tension in Chester design work. No fixed pairing; every advocacy member may challenge every other on any question.

- **Conservator** — defends existing structure as evidence of prior decisions that paid for themselves.
- **Innovator** — pushes new framings; treats current structure as choice re-makeable.
- **Pragmatist** — weighs shipping and runtime cost against benefit; defends simplest sufficient.
- **Purist** — tests category boundaries; treats compositional integrity as load-bearing.

Adding lenses risks redundancy (new lens overlaps an existing one) or false coverage (new lens not actually distinct in substance). Removing lenses costs the designer signal on that tension. Researcher = sixth role with no advocacy, owns grounding and absence findings.

## Why Member Agents Live Inside Skill Dir

Member agent files at `skills/design-committee/agents/design-committee-{member}.md` declare committee-specific phase contract: solution-space discussion permitted, peer-DM enabled, decision-packet output expected. Lens + voice imported from `util-design-partner-role`. Co-location with skill keeps phase contract beside skill that uses it. Other deliberation skills wanting different phase contract write own parallel agent files; do NOT mutate committee's.

## util-design-partner-role Coupling

`skills/util-design-partner-role/SKILL.md` carries voice spec. Cited from `SKILL.md` as LOAD-BEARING. Touching util-design-partner-role → audit committee impact. Drop citation only with explicit justification, never as simplification.

## Deferred Roadmap

Out of scope for current committee skill, candidates for future work:

- Multi-round protocol round-by-round transcript schema.
- Member-only sub-invocations (e.g. `--member=conservator`).
- Mechanical enforcement of three forbidden surfaces (pre-commit hooks, CI checks).
