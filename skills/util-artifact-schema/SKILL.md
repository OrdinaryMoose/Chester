---
name: util-artifact-schema
description: >
  Single source of truth for Chester's artifact naming, versioning, directory layout,
  and path resolution. Read this skill (don't invoke it) whenever you need to create,
  find, or reference a Chester artifact — design briefs, specs, plans, summaries, audits,
  or any other sprint artifact. If you're about to write a file path or filename for a
  Chester artifact, check here first.
---

# Artifact Schema

This document defines how Chester organizes work artifacts on disk. Every skill that
creates or reads artifacts follows these rules. When in doubt about where something
goes or what to call it, this is the authority.

## Config Resolution

Read project config before any artifact operations:

```bash
eval "$(chester-config-read)"
```

This exports two variables:

| Variable | Meaning | Example |
|----------|---------|---------|
| `CHESTER_WORKING_DIR` | Absolute path to gitignored scratch space — **all skills write here** | `/home/user/project/docs/chester/working` |
| `CHESTER_PLANS_DIR` | Relative path to archive target — **populated only at merge time** | `docs/chester/plans` |

**Directory model:** All artifact writes during a sprint go exclusively to `CHESTER_WORKING_DIR`.
No skill other than `finish-archive-artifacts` writes to `CHESTER_PLANS_DIR`.

- **Working directory** — the single write target for all pipeline work. Gitignored.
  Every skill in the design → spec → plan → execute → summary pipeline writes here.
  This directory lives outside worktrees so documents persist across branch switches
  and remain in the same location throughout the session.
- **Plans directory** — a merge-time archive, not an active destination. Tracked in git.
  `finish-archive-artifacts` copies the entire sprint subdirectory from working to plans
  exactly once, immediately before closing the worktree. No other skill touches this
  directory. Do not write artifact files here directly.

If `CHESTER_CONFIG_PATH` is `none`, no Chester config exists for this project. Run
`setup-start` first or use the defaults (`docs/chester/working/` and `docs/chester/plans/`).

## Sprint Naming

Every unit of work gets a sprint name that drives the directory name, branch name, and
file prefix.

**Format:** `YYYYMMDD-##-verb-noun-noun`

| Part | Rule | Example |
|------|------|---------|
| `YYYYMMDD` | Today's date | `20260407` |
| `##` | Next available sequence number for that date | `01` |
| `verb-noun-noun` | Three lowercase hyphenated words: a verb (the action) followed by two nouns (the target). Derived from the problem statement. | `strip-console-reports` |

To find the next sequence number:
```bash
ls "$CHESTER_WORKING_DIR/" 2>/dev/null | grep "^$(date +%Y%m%d)" | sort | tail -1
```

The sprint name is used for:
- **Directory name:** `{CHESTER_WORKING_DIR}/20260407-01-strip-console-reports/`
- **Branch name:** `20260407-01-strip-console-reports`
- **File prefix:** `strip-console-reports-{artifact}-{nn}.md`

Note that the file prefix uses only the three-word portion, not the date-sequence prefix.

## Directory Layout

Each sprint gets four subdirectories under the working directory:

```
{CHESTER_WORKING_DIR}/{sprint-subdir}/
├── design/     ← design briefs, thinking summaries, process evidence
├── spec/       ← specification documents
├── plan/       ← implementation plans, threat reports, deferred items
└── summary/    ← session summaries, reasoning audits, cache analysis
```

Create the full structure when starting a new sprint:
```bash
mkdir -p "{CHESTER_WORKING_DIR}/{sprint-subdir}/design" \
         "{CHESTER_WORKING_DIR}/{sprint-subdir}/spec" \
         "{CHESTER_WORKING_DIR}/{sprint-subdir}/plan" \
         "{CHESTER_WORKING_DIR}/{sprint-subdir}/summary"
```

## File Naming

**Format:** `{sprint-name}-{artifact}-{nn}.md`

| Part | Rule |
|------|------|
| `{sprint-name}` | The three-word verb-noun-noun portion only (e.g., `strip-console-reports`) |
| `{artifact}` | The artifact type (see table below) |
| `{nn}` | Zero-padded version number: `00` is the original, `01`, `02`, `03` for revisions |

### Artifact Types

| Artifact | Directory | Purpose | Produced by |
|----------|-----------|---------|-------------|
| `design` | `design/` | Design brief — WHAT is being built and WHY | `design-figure-out` |
| `thinking` | `design/` | Thinking summary — HOW decisions were made | `design-figure-out` |
| `process` | `design/` | Process evidence — HOW the interview operated | `design-figure-out` |
| `spec` | `spec/` | Specification — formal requirements document | `design-specify` |
| `plan` | `plan/` | Implementation plan — task-by-task build instructions | `plan-build` |
| `plan-threat-report` | `plan/` | Combined plan-attack + plan-smell findings | `plan-build` (hardening phase) |
| `deferred` | `plan/` | Items deferred during execution | `execute-write` |
| `summary` | `summary/` | Session summary — what happened and why | `finish-write-records` |
| `audit` | `summary/` | Reasoning audit — decision-level trace | `finish-write-records` |

### State Files (Non-Artifact)

Some skills write JSON state files that are not versioned artifacts:

| File | Directory | Purpose |
|------|-----------|---------|
| `{sprint-name}-understanding-state.json` | `design/` | Understanding MCP state | 
| `{sprint-name}-enforcement-state.json` | `design/` | Enforcement MCP state |

## Versioning

- `00` is always the original
- When a skill revises an artifact (e.g., spec reviewer finds issues), it writes
  the next version: `01`, `02`, etc.
- The latest version is the current one — skills should read the highest-numbered
  version when loading an artifact
- Previous versions are kept for history, not deleted

## Refactor Artifacts

Refactoring work uses a separate directory and slightly different naming:

```
docs/refactor/{slug}/
├── {slug}-brief-00.md      ← evaluation brief (unique to refactors)
├── {slug}-summary-00.md    ← session summary (same format as sprint summaries)
└── {slug}-audit-00.md      ← reasoning audit (same format as sprint audits)
```

**Slug format:** `YYYYMMDD-##-word-word-word` (3-5 words, not fixed at four)

Refactor artifacts are committed directly — they don't go through the working dir →
plans dir archival flow because refactors don't use the sprint pipeline.

## Inheriting Sprint Context

When a skill is invoked mid-pipeline (not at the start), it inherits the sprint
subdirectory from the upstream artifact's path. For example, `plan-build` reads the
spec and derives the sprint subdir from the spec's parent directory. Skills should
not re-derive the sprint name when one is already established.
