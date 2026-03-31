# Thinking Summary: Config Layered Settings

## Interview Timeline

### Stage 1: Config Layering Model (Q1-Q2)
- **Q1 — Merge strategy:** Deep merge vs full replacement for project-over-user config.
  - Decision: **Deep merge.** Project-local overrides only what it sets; everything else inherits. Standard pattern (VS Code, git, npm).
- **Q2 — Should `.chester/` be committed or gitignored?** Initial assumption was committed (like `.claude/`), but user corrected — keep it simple, gitignore the whole folder.
  - Decision: **`.chester/` is gitignored.** Config only, not committed.

### Stage 2: Directory Architecture (Q3-Q6)
- **Q3 — Should `.chester/` be both config and workspace?** Proposed combining config + draft workspace in one folder.
  - Decision: **No.** User wants three distinct concerns: config (`.chester/`), working directory (user-defined, gitignored), archive directory (user-defined, committed).
- **Q4 — Default paths for working and archive directories.**
  - Decision: **`docs/chester/working/`** (gitignored drafts) and **`docs/chester/plans/{sprint-name}/`** (committed archive).
- **Q5 — Single-sprint or multi-sprint working directory?**
  - Decision: **Multi-sprint.** `working/{sprint-name}/` subdirectories to support concurrent sprints.
- **Q6 — Dual-write pattern.** Working directory is in main tree, worktrees can't access it. Options: absolute path outside repo, or worktree gets its own copy.
  - Decision: **Dual-write preserved.** Main tree gets `working/{sprint-name}/` (reference), worktree gets `plans/{sprint-name}/` (committed). Same mechanics as current system, clearer naming.

### Stage 3: Config Details (Q7-Q9)
- **Q7 — Config schema contents.** Minimal: `working_dir`, `plans_dir`, `budget_guard`. No speculative fields.
  - Decision: **Minimal schema, extend later.**
- **Q8 — Migration strategy.** Auto-migrate from old locations vs fallback reads.
  - Decision: **Auto-migrate.** One-time operation, clean cut, no dual code paths.
- **Q9 — Anything unresolved?**
  - Decision: **Design complete.** Remaining work is implementation.

## Key Reasoning Shifts
- Initial assumption that `.chester/` should be committed (like `.claude/`) was wrong — user wanted simplicity over team-sharing semantics.
- Initial proposal to combine config + workspace in `.chester/` was rejected — user wanted clean separation of concerns.
- Dual-write pattern, which seemed like it might be eliminated, was preserved for practical worktree accessibility reasons.