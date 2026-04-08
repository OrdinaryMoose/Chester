# Spec: Rename Skill Directories to `chester-{phase}-{name}` Convention

## Overview

Rename all 18 Chester skill directories from flat `chester-{name}` to phased `chester-{phase}-{name}` naming, and update every internal reference to match. This is a mechanical rename-and-replace task with no design decisions — the mapping is fully specified.

## Motivation

The current flat naming makes it hard to see which phase of the Chester pipeline a skill belongs to. Phased naming groups skills visually (in `ls`, tab-completion, and the skill registry) by their role: setup, design, plan, execute, finish, util.

## Directory Rename Mapping

18 directories, organized by target phase:

| Old Name | New Name | Phase |
|---|---|---|
| `chester-start` | `chester-setup-start` | setup |
| `chester-start-debug` | `chester-setup-start-debug` | setup |
| `chester-figure-out` | `chester-design-figure-out` | design |
| `chester-build-spec` | `chester-design-specify` | design |
| `chester-build-plan` | `chester-plan-build` | plan |
| `chester-attack-plan` | `chester-plan-attack` | plan |
| `chester-smell-code` | `chester-plan-smell` | plan |
| `chester-write-code` | `chester-execute-write` | execute |
| `chester-test-first` | `chester-execute-test` | execute |
| `chester-fix-bugs` | `chester-execute-debug` | execute |
| `chester-prove-work` | `chester-execute-prove` | execute |
| `chester-review-code` | `chester-execute-review` | execute |
| `chester-finish-plan` | `chester-finish` | finish |
| `chester-write-summary` | `chester-finish-write-session-summary` | finish |
| `chester-trace-reasoning` | `chester-finish-write-reasoning-audit` | finish |
| `chester-make-worktree` | `chester-util-worktree` | util |
| `chester-dispatch-agents` | `chester-util-dispatch` | util |
| `chester-hooks` | `chester-util-config` | util |

## Scope of Changes

### 1. Directory renames

All 18 directories renamed via `mv`. No dependency ordering required — these are independent filesystem operations.

### 2. SKILL.md `name:` frontmatter updates

Each of the 17 SKILL.md files (all directories except `chester-util-config`, which has no SKILL.md) has a `name:` field in YAML frontmatter that must match its directory name. One substitution per file.

### 3. Cross-references inside skill content files

All `.md` and `.sh` files under `chester-*/` contain references to skill names. Global find-and-replace across all these files. Substitution order matters: longer/more-specific names must be replaced before shorter ones to prevent partial matches.

**Critical ordering constraint:** `chester-start` is a prefix of `chester-start-debug`. The `chester-start-debug` substitution must run before `chester-start`. Similarly, `chester-finish` (the new name for `chester-finish-plan`) is a prefix of `chester-finish-write-*` — the `chester-finish-plan` → `chester-finish` substitution must run before any hypothetical bare `chester-finish` replacement. In practice, `chester-finish` only appears as the replacement target for `chester-finish-plan`, so no bare `chester-finish` substitution is needed.

The `chester-start` replacement must use a word boundary (`\b`) to avoid matching `chester-start-debug` (which will have already been renamed to `chester-setup-start-debug` by that point in the sequence).

### 4. CLAUDE.md updates

Three changes in the repo-root `CLAUDE.md`:
- Update the structure description prose to reflect phased naming
- Update the "Working on Skills" reference from `chester-start/SKILL.md` to `chester-setup-start/SKILL.md`
- Update the frontmatter example from `chester-<name>` to `chester-{phase}-{name}`

### 5. Test script updates

9 test scripts in `tests/` reference old skill names. Same substitution approach as skill content files, scoped to `tests/*.sh`.

Test scripts to update:
- `test-budget-guard-skills.sh`
- `test-chester-config.sh`
- `test-config-read-new.sh`
- `test-debug-flag.sh`
- `test-integration.sh`
- `test-log-usage-script.sh`
- `test-start-cleanup.sh`
- `test-statusline-usage.sh`
- `test-write-code-guard.sh`

All tests must pass after updates.

### 6. Config scripts inside `chester-util-config/`

The renamed `chester-hooks` → `chester-util-config` directory contains:
- `chester-config-read.sh` — may reference old skill directory paths
- `session-start` — injects `chester-start` into the system prompt; must reference `chester-setup-start`

These are covered by the cross-reference substitution in scope item 3, but called out explicitly because they are load-bearing runtime scripts (not just documentation).

## Exclusions

- **`docs/chester/plans/`** — Historical session artifacts. Old names in committed archives are expected and correct. No updates.
- **`docs/chester/working/`** — Gitignored transient files. No updates.
- **`.claude/settings.chester.local.json`** — Contains directory paths (`working_dir`, `plans_dir`), not skill names. No updates needed.
- **Memory files** (`~/.claude/projects/*/memory/`) — These are conversation-scoped and will naturally reflect new names going forward.

## Constraints

- **No behavior changes.** Every skill must function identically after renaming. The only change is the name.
- **Atomic commits per logical step.** Each of the 6 tasks gets its own commit for clean revert capability.
- **Word-boundary matching for `chester-start`.** The shortest old name is a prefix of another, requiring `\b` or equivalent to avoid false matches.
- **Longer-first substitution order.** Prevents partial-match corruption (e.g., replacing `chester-start` inside `chester-start-debug` before the latter has been handled).

## Testing Strategy

- After directory renames: `ls -d chester-*/` confirms 18 directories with new names, none with old names.
- After frontmatter updates: `grep "^name:" chester-*/SKILL.md` confirms all 17 match their directory.
- After cross-reference updates: `grep -rn` for all 18 old names across `chester-*/` returns zero matches.
- After CLAUDE.md update: `grep "chester-" CLAUDE.md` shows only new names.
- After test script updates: all 9 test scripts pass.
- Final sweep: `grep -rn` for old names across `*.md`, `*.sh`, `*.json` (excluding `docs/`) returns zero matches.

## Non-Goals

- Changing skill behavior, content, or structure beyond name references.
- Updating historical documents in `docs/chester/plans/`.
- Renaming files within skill directories (only directories and name references change).
- Updating the skill registry in `chester-setup-start/SKILL.md` — this is handled automatically by the cross-reference substitution since the registry lists skill names inline.
