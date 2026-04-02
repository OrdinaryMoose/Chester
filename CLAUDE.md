# Chester Skills

This repo contains Chester — a skill-based development workflow framework for Claude Code.

## Repository Structure

- `chester-*/SKILL.md` — Skill definitions. Each directory is one skill.
- `chester-util-config/` — Claude Code session hooks and config scripts.
- `tests/` — Bash test scripts for Chester components.
- `docs/chester/plans/` — Committed session artifacts (specs, plans, summaries, audits).
- `docs/chester/working/` — Gitignored active planning docs.

## Skill File Conventions

Every skill lives in `chester-{phase}-{name}/SKILL.md` with YAML frontmatter:

```yaml
---
name: chester-{phase}-{name}
description: <one-line trigger description for the Skill tool registry>
---
```

The `description` field is what appears in the Skill tool's available skills list. It must clearly state when to invoke the skill.

Supporting files (reviewer templates, reference docs, scripts) go in the same directory or a `references/` or `scripts/` subdirectory.

## Session Artifact Conventions

Work artifacts follow the pattern:

```
docs/chester/YYYYMMDD-##-word-word-word-word/
├── <sprint-name>-spec-NN.md
├── <sprint-name>-plan-NN.md
├── <sprint-name>-summary-NN.md
├── <sprint-name>-audit-NN.md
└── <sprint-name>-plan-threat-report-NN.md
```

Sprint name format: `YYYYMMDD-##-word-word-word-word` where `##` is the next available sprint number. This name is used for both the directory and the branch. `NN` is a zero-padded sequence number (00, 01, ...). Planning-phase docs go under `docs/chester-planning/` with the same structure.

## Commit Style

- `feat:` for new skills or capabilities
- `fix:` for bug fixes
- `chore:` for config, gitignore, non-functional changes
- `checkpoint:` for mid-session saves (e.g., `checkpoint: spec approved`)
- Merge commits: `Merge branch '<branch>' — <one-line summary>`

## Tests

Run individual tests: `bash tests/test-<name>.sh`

Tests are self-contained bash scripts. They validate hooks, config resolution, budget guards, and integration behavior.

## Key Scripts

- `chester-util-config/chester-config-read.sh` — Resolves project-scoped config. Exports `CHESTER_WORK_DIR`, `CHESTER_PLANS_DIR`, `CHESTER_CONFIG_PATH`.
- `chester-util-config/session-start` — Hook that injects `chester-setup-start` into system prompt at session startup.

## Working on Skills

When editing a SKILL.md, the `description` frontmatter field and the skill's entry in `chester-setup-start/SKILL.md` (the available skills list) must stay in sync. If you change what a skill does, update both.

Skill types: **rigid** (follow exactly — e.g., test-first, fix-bugs) vs **flexible** (adapt principles to context). The skill itself declares which.
