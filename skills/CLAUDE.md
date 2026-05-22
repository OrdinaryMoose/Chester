# skills/ — CLAUDE.md

Chester skill definitions. Each subdirectory is one skill.

## Naming

`{phase}-{name}/` where phase is the workflow stage (`design-`, `plan-`, `execute-`, `finish-`, `setup-`, `util-`). Skill is invoked as `chester:{phase}-{name}` via the Skill tool (plugin namespace prefix).

## Required layout

```
{phase}-{name}/
├── SKILL.md          # frontmatter + body
├── references/       # optional — supporting templates, rubrics, reference docs
└── scripts/          # optional — helper scripts the skill shells out to
```

## SKILL.md frontmatter

```yaml
---
name: {phase}-{name}
description: <one-line trigger description; this is what Claude Code's skill registry shows>
version: v####
---
```

- `description` must clearly state WHEN to invoke. It is the routing signal.
- `version` is `v` + four-digit zero-padded counter. Bump on any behavior or contract change. New skills start at `v0001`.

## Two-place sync

`description` field + the matching entry in `skills/setup-start/SKILL.md`'s available-skills list must stay in lockstep. Change one, change the other.

## Skill type declaration

Each SKILL.md declares itself **rigid** (follow exactly — e.g. `execute-test`, `execute-prove`) or **flexible** (adapt principles). Readers must respect that contract.

## Phase index

- `setup-*` — session bootstrap
- `design-*` — problem identification, interview, brief
- `plan-*` — implementation plan + adversarial review
- `execute-*` — TDD task-by-task implementation
- `finish-*` — session records, archive, worktree close
- `util-*` — shared utilities and reference materials (read, don't invoke, unless the skill says otherwise)

## Live development

Edit a SKILL.md, then `/reload-plugins` in Claude Code to pick up changes without restarting.
