# Skill Index

Reference for choosing between Chester skills. Read when multiple skills could apply to the
task at hand, or when you need to look up what a named skill does.

## Skill Priority

When multiple skills could apply, use this order:

1. **Gate skills first** (`design-small-task`, `plan-build`, `execute-write`, `execute-verify-complete`, `finish-close-worktree`) — these define the overall pipeline stage and determine HOW to approach the task
2. **Review skills second** (`plan-attack`, `plan-smell`, `util-codereview`) — these harden and validate the work
3. **Behavioral skills third** (`execute-test`, `execute-prove`) — these guide specific execution disciplines
4. **Utility skills fourth** (`util-worktree`, `util-dispatch`) — these support workflow mechanics

### Common Dispatch Patterns

- "Quick design check for X" → `design-small-task` first, then `plan-build`.
- "Convene the committee on X" / "ask the committee" / "get a multi-perspective read on X" → `design-committee` standalone (not pipeline-staged).

## Skill Catalog

<!-- CATALOG_SLOT -->

Brief templates are **not** standalone skills — they live inside each design skill as references:

- `design-small-task/references/design-brief-small-template.md` — 6-section lightweight (bounded-task briefs)
