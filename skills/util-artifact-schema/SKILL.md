---
name: util-artifact-schema
description: >
  Single source of truth for Chester's artifact naming, versioning, directory layout,
  and path resolution. Read this skill (don't invoke it) whenever you need to create,
  find, or reference a Chester artifact — design briefs, specs, plans, summaries, audits,
  or any other sprint artifact. If you're about to write a file path or filename for a
  Chester artifact, check here first.
version: v0002
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
├── design/     ← design briefs (proof envelope), thinking summaries, process evidence
├── spec/       ← specification documents, spec-stage ground-truth reports (automatic; skipped only for greenfield)
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
| `design` | `design/` | Design brief — proof envelope (goal, necessary conditions, rules, permissions, evidence, industry context, risks, acceptance criteria). Templates live in each design skill: `design-large-task/references/design-brief-template.md` (8-section envelope) and `design-small-task/references/design-brief-small-template.md` (6-section lightweight). | `design-large-task` (8-section envelope), `design-small-task` (6-section lightweight) |
| `thinking` | `design/` | Thinking summary — decision history of how the proof reached its necessary conditions | `design-large-task` |
| `process` | `design/` | Process evidence — operational narrative (Understand Stage saturation history, Stage Transition timing, Solve Stage length) | `design-large-task` |
| `spec` | `spec/` | Specification document — architecture chosen from the brief's envelope, component structure, reuse profile, trade-off profile | `design-specify` |
| `spec-ground-truth-report` | `spec/` | Ground-truth findings — codebase verification of spec claims about existing code (automatic review; skipped only for greenfield specs) | `design-specify` (ground-truth review stage) |
| `spec-skeleton` | `spec/` | Skeleton manifest — indexes test stubs by acceptance criterion ID (`AC-N.M`) for execute-write's structural trigger-check coverage diff. Filename: `{sprint-name}-spec-skeleton-{nn}.md`. | `design-specify` (scaffolding step); consumed by `execute-write` (trigger-check step) |
| `plan` | `plan/` | Implementation plan — task-by-task build instructions | `plan-build` |
| `plan-threat-report` | `plan/` | Combined plan-attack + plan-smell findings | `plan-build` (hardening phase) |
| `deferred` | `plan/` | Items deferred during execution | `execute-write` |
| `summary` | `summary/` | Session summary — what happened and why | `finish-write-records` |
| `audit` | `summary/` | Reasoning audit — decision-level trace | `finish-write-records` |

### State Files (Non-Artifact)

Some skills write JSON state files that are not versioned artifacts:

| File | Directory | Purpose |
|------|-----------|---------|
| `{sprint-name}-understanding-state.json` | `design/` | Understanding MCP state (Understand Stage nine-dimension saturation scoring) |
| `{sprint-name}-proof-state.json` | `design/` | Design Proof MCP state (Solve Stage necessary-conditions proof) |

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

## Provenance Trailers

Every artifact produced by a stamping skill carries an HTML-comment provenance
block at the bottom of the file, separated from content by a blank line. The
block records when the artifact was created and which skill (by name and
version) produced or modified it.

### Trailer format

```
<!-- created-at: 2026-04-30T14:23:00Z -->
<!-- produced-by plan-build@v0007 -->
<!-- produced-by plan-attack@v0003 -->
```

- One `<!-- created-at: <ISO 8601 UTC> -->` line per artifact, set on first
  write and frozen thereafter.
- One `<!-- produced-by <skill>@<version> -->` line per participating skill,
  in first-touch chronological order. Each `(skill, version)` tuple appears
  at most once.

### Helper script

Skills do not write the trailer by hand. The shared bash helper handles all
trailer logic — appending, deduplication, idempotency:

```bash
chester-trailer-write stamp <skill>@<version> <artifact-path>
chester-trailer-write harvest <sprint-dir>
```

- **`stamp`** — invoked by a producer/modifier skill immediately after writing
  an artifact. If the artifact has no trailer block, creates one with a
  fresh `created-at` and the skill's `produced-by` line. If the artifact
  already has a trailer block, appends the skill's `produced-by` line. If the
  exact `<skill>@<version>` line is already present, the call is a no-op.
- **`harvest`** — invoked by `finish-write-records` against the sprint
  directory. Walks all `.md` files, extracts every `produced-by` line,
  deduplicates by `(skill, version)` tuple, and emits the consolidated
  chain in first-touch chronological order (using each artifact's
  `created-at` as the temporal anchor and in-file position as the tiebreaker).

### Stamping skills

The following skills invoke `stamp` at every artifact-write site they
own:

- `design-large-task` (design briefs, thinking files)
- `design-small-task` (design briefs)
- `design-specify` (specs, ground-truth reports, skeleton manifests)
- `plan-build` (plans, threat reports — `plan-build` writes the combined
  threat report during the Plan Hardening phase, so it owns that chain)
- `execute-write` (plan amendments)
- `finish-write-records` (summaries, audits)

### Non-stamping skills

The following skills do **not** stamp:

- `plan-attack`, `plan-smell` — these skills produce inline conversation
  output only; they do not write files. Any threat or smell report file
  is written by `plan-build` during hardening, so `plan-build` owns the
  trailer chain on those files.
- `execute-test`, `execute-prove`, `execute-verify-complete` — read-only
  with respect to artifacts.
- `finish-archive-artifacts` — bytewise copy from working to plans
  directory. Copy is not a modification; trailer chains travel intact.
- `start-bootstrap` — scaffolds directories; produces no artifact content.
- All named subagents under `agents/`. The dispatching parent skill owns
  the trailer.

### Sidecar artifacts

Sidecars (threat reports, smell reports, audits, thinking files) carry
**independent** trailer chains. A skill that produces both a primary
artifact and a sidecar in the same run calls `stamp` once on each, with
the artifact paths kept distinct.

### Manual edits

User edits to an artifact never trigger re-stamping. The chain is
provenance, not authority — it represents the last machine touch, not
the artifact's current state.

### Session-wide ledger

The session summary written by `finish-write-records` includes a
`## Session Skill Versions` section populated by the harvest subcommand.
The section is the single consolidated record of which skill versions
participated in the sprint.
