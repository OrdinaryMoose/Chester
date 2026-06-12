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

1. **Agent files** (`agents/design-committee-*.md`, plugin top-level). Edits persist invisibly across invocations, drift accumulates silently. Agent files carry lens, voice, phase contract only. No sprint refs, no schemas, no product names, no gating conditions.
2. **`SKILL.md`.** Persistent floor doc. Contamination = most durable category drift. Audits compare against this file; corrupted floor breaks audit.
3. **Output-format field labels.** Interface between deliberation and external readers. Wrapping skills MAY append fields; MAY NOT redefine existing label meaning. Redefinition makes output illegible outside wrapping context.

## Why Four Members (Not Three or Five)

Four members = four distinct lenses positioned as points in shared deliberation space. Each lens covers a recurring tension in Chester design work. No fixed pairing; every advocacy member may challenge every other on any question.

- **Conservator** — defends existing structure as evidence of prior decisions that paid for themselves.
- **Innovator** — pushes new framings; treats current structure as choice re-makeable.
- **Pragmatist** — weighs shipping and runtime cost against benefit; defends simplest sufficient.
- **Purist** — tests category boundaries; treats compositional integrity as load-bearing.

Adding lenses risks redundancy (new lens overlaps an existing one) or false coverage (new lens not actually distinct in substance). Removing lenses costs the designer signal on that tension. Researcher = sixth role with no advocacy, owns grounding and absence findings.

## Why Member Agents Live in the Plugin Top-Level `agents/`

Member agent files at `agents/design-committee-{member}.md` (plugin top-level) declare committee-specific phase contract: solution-space discussion permitted, peer-DM enabled, decision-packet output expected. Lens + voice imported from `util-design-partner-role`. Placement is forced by registration, not preference: Claude Code's plugin resolver scans only the top-level `agents/` directory — agent files in skill-local `agents/` subdirs never register and dispatch fails silently. The `chester:design-committee-{role}` naming convention (filename encodes the originating skill) keeps the phase contract traceable to this skill without co-location. Other deliberation skills wanting different phase contract write own parallel `agents/{skill}-*.md` files; do NOT mutate committee's.

## util-design-partner-role Coupling

`skills/util-design-partner-role/SKILL.md` carries voice spec. Cited from `SKILL.md` as LOAD-BEARING. Touching util-design-partner-role → audit committee impact. Drop citation only with explicit justification, never as simplification.

## Teardown Scope (cross-session, cross-project)

The team registry is user-global: `~/.claude/teams/<name>/` and `~/.claude/tasks/<name>/` live under `$HOME`, shared across every project on the account.
The committee team slug (`design-committee-<question-slug>`) carries no project token, so committees from different projects sit side by side in one registry and can collide on an identical question-slug.
In-flow teardown stays correctly scoped on its own: the Phase 5 `TeamDelete` keys off the current session's team context, so it can only remove the committee this session convened.
The hazard is out-of-band cleanup — a "dismiss the committee" meant as sweeping strays — which must NEVER reach another project's teams.
The project discriminator is each team's recorded `members[].cwd` in `config.json`, resolved to repo identity: compare `git -C <cwd> rev-parse --git-common-dir` against the current repo's, so a worktree session resolves back to its main repo instead of mis-bucketing as a different project.
Cross-session strays of the same project may be swept only after the repo-identity match AND a not-live check (dead `leadSessionId`, zero non-empty `tmuxPaneId`), and only on explicit user confirmation — `rm` here is irreversible and cross-session.
A `design-committee-*` name alone never licenses deletion; project-namespacing the slug was considered and rejected as awkward inside the project, since `cwd` already carries the difference.

## Deferred Roadmap

Out of scope for current committee skill, candidates for future work:

- Multi-round protocol round-by-round transcript schema.
- Member-only sub-invocations (e.g. `--member=conservator`).
- Mechanical enforcement of three forbidden surfaces (pre-commit hooks, CI checks).
- Project-scoped team listing and dismissal tooling keyed on the `cwd` → `git-common-dir` discriminator (see § Teardown Scope).
