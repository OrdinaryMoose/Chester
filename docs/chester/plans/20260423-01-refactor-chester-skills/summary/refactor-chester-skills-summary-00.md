# Session Summary: Refactor Chester Skills

**Date:** 2026-04-24
**Session type:** Full-stack refactoring implementation
**Plan:** No plan file — refactor was conversation-driven with audit-guided course corrections.

## Goal

Streamline the Chester skill framework, which had grown bloated and hard to navigate. Consolidate overlapping responsibilities, unify conventions, remove unused skills, and fix a latent compaction-hook bug — producing a main branch that cleanly represents the refactor's intent in four logical commits.

## What Was Completed

### Pipeline reshape

- Reinstated `design-specify` between design and plan stages. Two-architect review on dispatcher-assigned axes with F-A-C self-check. Single-pass spec fidelity review (subagent) plus inline adversarial review.
- Reworked `design-experimental` (later renamed): stripped Finalization entirely since architecture choice now lives in `design-specify`. Renamed inner Phase 1/Phase 2 to Understand Stage / Solve Stage. Brief became the proof envelope — eight sections, envelope-only.
- Synced `util-artifact-schema` with the new canonical sequence: `design-large-task|design-small-task → design-specify → plan-build → execute-write → finish-*`.

### Reference organization

- Extracted inline reference content into `references/` subfolders:
  - `execute-test/references/tdd-exemplars.md`
  - `plan-build/references/{plan-template.md, smell-triggers.md}`
  - `util-dispatch/references/agent-prompt-templates.md`
  - `design-specify/references/{spec-reviewer.md, ground-truth-reviewer.md, adversarial-spec-review.md}`
  - `execute-write/references/{implementer.md, spec-reviewer.md, quality-reviewer.md, code-reviewer.md}`
- Moved design brief templates into owning skills' `references/` folders, replacing standalone `util-design-brief-template` / `util-design-brief-small-template` skills.
- Every multi-file skill now uses the `references/` convention.

### Removals (usage-driven + scope-driven)

- `util-budget-guard` skill and all touchpoints (18-file sweep across hooks, commands, tests, citations).
- `execute-review` and `execute-debug` skills — never invoked by the user.
- Legacy eval workspaces: `design-experimental-workspace/`, `setup-start-workspace/`.
- Dangling `_archive/design-experimental-workspace/` (removed via `git clean -fd`).

### Rename

- `skills/design-experimental/` → `skills/design-large-task/`. Reflects intent (the dedicated design pathway for large, multi-decision architectural work, paired with `design-small-task`) rather than provenance.
- MCP server names (`chester-design-proof`, `chester-design-understanding`) unchanged, so existing state files remain valid.
- Historical plan records under `docs/chester/plans/**` left intact — they describe decisions made under the old name at the time they had that name.

### Hook fix

Compaction hooks (`pre-compact.sh`, `post-compact.sh`) failed when run from the installed plugin cache because `chester-config-read` was not on PATH in the hook subshell. The existing `2>/dev/null` guard suppressed the command-not-found stderr, but `set -u` then tripped on the unbound `CHESTER_WORKING_DIR`. Fix: prefer `${CLAUDE_PLUGIN_ROOT}/bin/chester-config-read`, fall back to PATH (preserves test mocking), explicitly guard against unbound var after eval.

### Merge strategy

Branch was 14 commits ahead. Squashed into 4 logical groups via rebase with a custom todo file. Safety tag `chester-presquash-backup` held the pre-squash state; final tree diff against the tag was 0 bytes. Fast-forward merged to main.

## Catalog changes

| Before | After |
|---|---|
| 24 skills | 21 skills |
| `execute-*` cluster: 5 | `execute-*` cluster: 4 |
| `util-design-brief-*` (2 skills) | templates inside owning skills |
| `util-budget-guard` | removed |

## Verification Results

| Check | Result |
|---|---|
| Full test suite on main post-merge | 9/9 PASS |
| Tree diff vs pre-squash safety tag | 0 bytes |
| Dead skill cross-references | 0 |
| Stale `design-experimental` / `budget` / `execute-review` / `execute-debug` references in live code | 0 |
| Residual orphans in `references/` folders | 0 |

## Known Remaining Items

- **`/refresh-chester`** — the OrdinaryMoose marketplace plugin cache still references old paths (`skills/design-experimental/`). User-triggered command needed to sync the cache; otherwise fresh Claude Code sessions using the installed plugin will fail to launch the MCP servers.
- **Optional hardening** — `test-compaction-hooks.sh` currently tests only the PATH-fallback branch of the new resolver (via mock). Adding a `CLAUDE_PLUGIN_ROOT` mock case would lock in the primary path under which the hook actually runs.

## Files Changed (merged to main)

Aggregated across the four commits (see individual commit bodies for per-commit detail):

- `skills/` — every skill directory touched; one directory renamed (`design-experimental` → `design-large-task`), two skill directories deleted (`execute-review`, `execute-debug`, `util-budget-guard`, `util-design-brief-template`, `util-design-brief-small-template`); new skill `design-specify/` (reinstated from archive) + `util-design-partner-role/` (shared voice rules).
- `tests/` — one test renamed (`test-experimental-closure.sh` → `test-large-task-closure.sh`); stale budget-guard/integration/statusline tests removed; active tests updated to match new sequence.
- `chester-util-config/hooks/` — pre-compact.sh, post-compact.sh patched with resolver block.
- `.claude-plugin/mcp.json` — MCP server paths updated to `design-large-task/`.
- `docs/instructions.md`, `README.md`, `CLAUDE.md` — citation sweeps.

## Commits (on main)

```
26c6a40 chore: finish references/ convention and rename design-experimental
29cc0af fix: resolve chester-config-read via CLAUDE_PLUGIN_ROOT in compaction hooks
19a85bc chore: unify reference organization and remove unused skills
00bda7d feat: streamline Chester pipeline and reinstate design-specify
```

All four pushed to `origin/main`.

## Handoff Notes

- The refactor is complete on `main`. Before the next Chester work begins in a new session, run `/refresh-chester` to sync the plugin cache. Until that runs, MCP server launches from the installed plugin will fail (paths reference the renamed directory).
- The squash strategy (rebase with custom todo + conflict resolution via original post-commit checkout) is documented in the audit; it's the right approach for future multi-commit refactors where commit interleaving creates apparent conflicts that resolve cleanly to the original intent.
- The `chester-baseline-20260423` tag (created at the start of the sprint arc) is still available if a full before/after diff of this refactor is ever useful: `git diff chester-baseline-20260423..main`.
- The sprint's `design/`, `spec/`, `plan/` subdirectories in `docs/chester/working/` are empty — this sprint was conversation-driven, not pipeline-driven. That's fine; `finish-archive-artifacts` should still copy the working sprint directory as a permanent record, even though only `summary/` has content.
