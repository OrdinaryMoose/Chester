# Design Brief — Chester Commit Strategy

## Problem

Chester's current commit strategy produces too many undifferentiated commits that make it difficult for the developer to see how code progressed. Commits lack sprint context, phase boundaries, and consistent naming. The branch history reads as a flat wall of `feat:` and `fix:` messages with no structure.

## Context

- Solo developer, beginner git user
- Works primarily on main; branches are created and managed by Chester
- Reviews commit history for narrative understanding of code progression, not micro-level diffs
- Existing branch naming convention: `sprint-NNN-descriptive-slug`

## Design

### Branch Lifecycle

The worktree/branch is created at the start of `chester-figure-out` — when the effort is named and the sprint identity is established. All pipeline artifacts live on the branch:

- Design brief and thinking summary
- Specification documents
- Implementation plan and hardening results
- All implementation code and tests
- Session summary and reasoning audit

The branch is merged to main at the end of `chester-finish-plan`.

### Merge Strategy

Regular merge (`git merge`) to preserve the branch rail in the commit log. The branch visually groups the effort. Default git merge commit message (`Merge branch 'sprint-NNN-descriptive-slug'`). No squash merge, no fast-forward.

### Branch Naming

Follows existing convention: `sprint-NNN-descriptive-slug`

Examples:
- `sprint-040-editor-viewmodel-solid`
- `sprint-041-commit-strategy-design`

### Commit Structure

Two tiers of commits on the branch:

**Checkpoint commits** mark pipeline phase transitions. No prefix — the word "checkpoint" is self-documenting:

```
checkpoint: design complete
checkpoint: spec approved
checkpoint: plan approved
checkpoint: execution complete
checkpoint: artifacts saved
```

**Subagent working commits** use conventional type prefixes. No sprint identifier — the branch provides that context:

```
feat: add validation schema and error types
fix: update domain entity tests for Localizations
test: add DSL parser tests for grammar changes
refactor: extract shared validation logic
docs: add implementation plan
```

### Naming Hierarchy

Big to small: type → description. Sprint context comes from the branch name, not individual commit messages.

### History Preservation

No squashing or rebasing. All commits are preserved. Clarity comes from naming conventions and the checkpoint/working-commit structure, not from hiding history.

## Resulting Log Structure

```
main ──────────────────────────────────────────────────── Merge branch 'sprint-040-...' ──▶
       \                                                  /
        checkpoint: design complete
        checkpoint: spec approved
        checkpoint: plan approved
        feat: update DomainStructuralFieldPaths for Localizations
        feat: update ConversationMapper for Localizations
        fix: update domain entity tests for Localizations
        test: add DSL parser tests for grammar changes
        fix: resolve remaining ContentKey references
        checkpoint: execution complete
        docs: design spec
        docs: implementation plan
        docs: session summary
        checkpoint: artifacts saved
```

## Skills Affected

| Skill | Change |
|-------|--------|
| `chester-figure-out` | Create worktree/branch at sprint start; checkpoint commit after design |
| `chester-build-spec` | Checkpoint commit after spec approval |
| `chester-build-plan` | Checkpoint commit after plan approval; update commit step format in task templates |
| `chester-write-code` | Detect existing worktree instead of creating one; enforce conventional prefix on subagent commits |
| `chester-finish-plan` | Regular merge (not squash); checkpoint commits for execution complete and artifacts saved |
| `chester-make-worktree` | Support earlier invocation from figure-out |

## Constraints

- Chester handles all git mechanics — the user should never need to run git commands manually
- Commit conventions must be enforced in skill instructions and subagent templates, not external tooling
- The design must work with the existing worktree infrastructure
