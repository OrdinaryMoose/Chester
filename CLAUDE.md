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

Run all: `for t in tests/test-*.sh; do bash "$t" || echo "FAIL: $t"; done`

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

## Master Plan Mode

**Currently active:** `20260430-02-rebuild-design-derivation` (per `docs/chester/working/.active-master`). Read `docs/chester/working/20260430-02-rebuild-design-derivation/CLAUDE.md` after this file before sub-cluster work.

Some pieces of Chester work span multiple sub-sprints under one umbrella plan (e.g. `20260430-02-rebuild-design-derivation` with three cluster sub-sprints). Master Plan Mode is a breadcrumb-toggled overlay over the default sprint conventions.

At session start, check for an active master plan breadcrumb:

```
docs/chester/working/.active-master
```

If the file **exists**, read its single-line content — that is the **active master sprint name** (e.g. `20260430-02-rebuild-design-derivation`). While the breadcrumb is present, operate in **Master Plan Mode** and override the default sprint-directory conventions as follows:

- **Master root:** `docs/chester/working/<master-sprint-name>/` holds `master-plan.md`, the master-level `CLAUDE.md` (master-specific commitments), master-level `design/ spec/ plan/ summary/` directories, and all sub-sprint subdirectories nested inside it.
- **Sub-sprint naming uses master-plan-derived IDs, not the default `YYYYMMDD-##-verb-noun-noun`:**
  - Cluster sub-sprints: `cluster-<letter>-<verb-slug>` (e.g. `cluster-a-define-solve`, `cluster-b-define-transition`).
  - Other sub-sprint types (LBDs, follow-up cycles, etc.) follow whatever pattern the master plan defines.
- **New sub-sprint creation:**
  - Derive the ID from `master-plan.md` (next pending cluster or open LBD).
  - Create `docs/chester/working/<master-sprint-name>/<sub-sprint-id>/` with `design/ spec/ plan/ summary/`.
  - Branch and worktree names mirror the sub-sprint dir name.
  - Do **not** create top-level `docs/chester/working/YYYYMMDD-##-*` dirs while in this mode.
- **Plans archive:** `finish-archive-artifacts` copies the entire master working tree (master-level files + all nested sub-sprints) to `docs/chester/plans/<master-sprint-name>/` at each sub-sprint merge. The plans archive accumulates closed sub-sprints over time. Each merge carries the latest cumulative state. Plans remain archive-only — never write there outside the archive step.
- **Skill redirection:** when `start-bootstrap` or any `design-*` / `plan-*` / `execute-*` skill tries to follow the default sprint-naming or top-level-dir convention, redirect it to the master-plan naming rules above. Skill files are **not** modified for this — override by prompt.
- **Master-level CLAUDE.md:** `docs/chester/working/<master-sprint-name>/CLAUDE.md` (when present) is normative for sub-sprints inside that master. Read it after the root `CLAUDE.md` and before reading the master plan.

If the breadcrumb file **does not exist**, ignore this section entirely and use the default sprint conventions in `Session Artifact Conventions` above.

**Exiting Master Plan Mode:** delete `docs/chester/working/.active-master`. This section becomes inert automatically.

**Starting a new master plan later:** recreate the breadcrumb with the new master sprint name and create the corresponding master working directory with its `master-plan.md` and (optionally) its master-scoped `CLAUDE.md`.

**Known gap — living-document persistence.** `master-plan.md` and any cross-sprint living document (e.g. a master deferments tracker) currently reach git only via `finish-archive-artifacts` at sub-sprint merge. Intermediate edits between merges have no commit-level history. See `docs/chester/working/master-plan-skill-living-document-problem-brief.md` (when present) for the candidate-solution survey. This gap is acknowledged, not yet addressed.
