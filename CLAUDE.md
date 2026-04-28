# Chester

This repo contains Chester — a skill-based development workflow framework for Claude Code, distributed as a plugin.

## Repository Structure

- `.claude-plugin/plugin.json` — Plugin manifest (name: `chester`).
- `skills/{phase}-{name}/SKILL.md` — Skill definitions. Each directory is one skill. Invoked as `chester:{phase}-{name}`.
- `agents/{skill}-{role}.md` — Named subagent definitions used by skills for review-side dispatches that must NOT inherit parent context (spec-fidelity, adversarial review, smell forecast, code-fit-isolated test generation, independent industry research). Filename encodes the originating skill. Invoked as `chester:{skill}-{role}`. Named subagents never fork even when `CLAUDE_CODE_FORK_SUBAGENT=1` is set, so independence is preserved by construction. See `docs/fork-policy.md` for the full per-dispatch policy.
- `chester-util-config/` — Claude Code session hooks and config scripts.
- `bin/` — Executables added to PATH by the plugin system.
- `hooks/` — Plugin hook definitions (SessionStart).
- `tests/` — Bash test scripts for Chester components.
- `docs/chester/working/` — Gitignored scratch space for in-progress artifacts (design briefs, specs, plans). Lives outside worktrees.
- `docs/chester/plans/` — Tracked directory where finished artifacts are committed alongside code.

## Skill File Conventions

Every skill lives in `skills/{phase}-{name}/SKILL.md` with YAML frontmatter:

```yaml
---
name: {phase}-{name}
description: <one-line trigger description for the Skill tool registry>
version: v####
---
```

The `description` field is what appears in the Skill tool's available skills list. It must clearly state when to invoke the skill. Skills are invoked as `chester:{phase}-{name}` (plugin namespace prefix).

The `version` field is a four-digit zero-padded counter prefixed with `v` (e.g. `v0001`). Bump it on any meaningful change to the skill's behavior or contract — not on typo fixes or comment-only edits. New skills start at `v0001`.

Supporting files (reviewer templates, reference docs, scripts) go in the same directory or a `references/` or `scripts/` subdirectory.

## Session Artifact Conventions

See `skills/util-artifact-schema/SKILL.md` for the full reference. Summary:

```
docs/chester/working/YYYYMMDD-##-verb-noun-noun/   (gitignored, in-progress)
├── design/
│   ├── <sprint-name>-design-NN.md
│   └── <sprint-name>-thinking-NN.md
├── spec/
│   └── <sprint-name>-spec-NN.md
├── plan/
│   ├── <sprint-name>-plan-NN.md
│   └── <sprint-name>-plan-threat-report-NN.md
└── summary/
    ├── <sprint-name>-summary-NN.md
    └── <sprint-name>-audit-NN.md

docs/chester/plans/YYYYMMDD-##-verb-noun-noun/     (tracked, archived)
└── (same structure, copied by finish-archive-artifacts)
```

Sprint name format: `YYYYMMDD-##-verb-noun-noun` where `##` is the next available sprint number, and the three words are a verb (the action) followed by two nouns (the target). Used for both the directory and the branch. `NN` is a zero-padded sequence number (00, 01, ...).

## Commit Style

- `feat:` for new skills or capabilities
- `fix:` for bug fixes
- `chore:` for config, gitignore, non-functional changes
- `checkpoint:` for mid-session saves (e.g., `checkpoint: spec approved`)
- Merge commits: `Merge branch '<branch>' — <one-line summary>`

## Tests

Run individual tests: `bash tests/test-<name>.sh`

Tests are self-contained bash scripts. They validate hooks, config resolution, and integration behavior.

## Key Scripts

- `chester-util-config/chester-config-read.sh` — Resolves project-scoped config. Exports `CHESTER_PLANS_DIR`, `CHESTER_CONFIG_PATH`.
- `bin/chester-config-read` — PATH-available wrapper so skills can call `eval "$(chester-config-read)"` without hardcoded paths.
- `chester-util-config/session-start` — Hook that injects `setup-start` skill into system prompt at session startup.

## Working on Skills

When editing a SKILL.md, the `description` frontmatter field and the skill's entry in `skills/setup-start/SKILL.md` (the available skills list) must stay in sync. If you change what a skill does, update both. Also bump the `version` field (e.g. `v0001 → v0002`) for any behavior or contract change.

Skill types: **rigid** (follow exactly — e.g., test-first, fix-bugs) vs **flexible** (adapt principles to context). The skill itself declares which.

## Development

To develop Chester locally:

```bash
claude --plugin-dir /home/mike/Documents/CodeProjects/Chester
```

Skills are live-reloaded — edit SKILL.md files and use `/reload-plugins` to pick up changes.
