# docs/chester/ — CLAUDE.md

Chester sprint work lives here. Two directories with different permanence and roles:

## Structure

- `working/` — **gitignored.** Single write target for all in-progress artifacts: designs, specs, plans, summaries, thinking state, proof state, audit logs. Mutable source of truth during a sprint.
- `plans/` — **tracked in git.** Archive target. No skill writes here except `finish-archive-artifacts`.

## working/ — Single Source During Sprints

- **Lives outside worktrees at main repo path.** One working dir serves all worktrees via `CHESTER_WORKING_DIR`.
- **Survives branch switches, worktree creates/removes, and any git ops** — because gitignored, it's outside git entirely.
- **Cross-worktree persistence.** `master-plan.md` edited from one cluster's worktree is visible from another cluster's worktree because both resolve `CHESTER_WORKING_DIR` to the same absolute path.
- **Per-sprint structure:** `<sprint-dir>/{design,spec,plan,summary}/`.
- **Master Plan Mode overlay:** when `.active-master` breadcrumb is present, sub-sprint dirs nest under `working/<master-sprint>/` instead of living at top level. Master-level artifacts (`master-plan.md`, master `CLAUDE.md`, concept briefs, master-wide LBD specs) sit at the master root.
- **Breadcrumbs** at `working/.active-master` (and optionally `working/.active-sprint`) locate current work without searching.

**Rule:** any sprint artifact a human browses — plan, spec, design, summary, threat report, LBD brief — is written to `working/...` in the main repo checkout. Never to a worktree-local copy. Worktrees hold branch-scoped code; working/ holds cross-branch docs.

## plans/ — Archive Only

- **Permanent record** alongside the code. Part of the sprint's merge commit.
- **Same subdir shape as working/** (`design/ spec/ plan/ summary/`) for each archived sprint.
- **No skill ever reads from plans/ to resume work.** plans/ is read-only institutional memory.
- **Master Plan Mode overlay:** `plans/<master-sprint>/` accumulates over time. Each sub-sprint's finish replicates the entire master working tree (master-level files + all nested sub-sprint dirs) into the master plans dir. Plans archive grows forward as sub-sprints close.

## Transfer Flow at Sprint Finish

Order is fixed. Each step gates the next.

1. **`execute-verify-complete`** — tests green, tree clean, checkpoint commit on the sub-sprint branch. Gates the finish phase.
2. **`finish-write-records`** — writes `summary/<slug>-summary-NN.md` and `summary/<slug>-audit-NN.md` into `working/` sub-sprint dir. No commits.
3. **`finish-archive-artifacts`** — runs inside the worktree on the sub-sprint branch:
   - Non-master mode: copies `working/<sprint-dir>/` (entire subtree) → `plans/<sprint-dir>/` in the worktree.
   - Master Plan Mode: copies the entire master working tree (`working/<master-sprint>/*` including master-level files and all nested sub-sprint dirs) → `plans/<master-sprint>/` in the worktree. Each sub-sprint merge carries the latest accumulated master state.
   - Stages and commits the archive: `docs: archive sprint artifacts for <sprint-name>`.
4. **`finish-close-worktree`** — four-option menu: merge locally / create PR / keep worktree / discard.
   - On merge: `git checkout main && git merge --no-ff <branch>`. Archive commit lands on main; plans/ archive becomes part of main's history.
   - Worktree removed (options 1, 4); retained (options 2, 3).
   - Sub-sprint branch deleted (option 1).

## Post-Merge State

- `working/` sub-sprint dir stays in place (gitignored, no cleanup — acts as historical scratch). Safe to delete manually later.
- `plans/` sub-sprint dir (or full master tree under Master Plan Mode) lives permanently on main, reachable via git history.
- Next sub-sprint's `finish-archive-artifacts` overwrites `plans/<master-sprint>/` with the then-current working master tree — plans always carries the latest master snapshot as of the last merged sub-sprint.

## Key Properties

- **One-way flow:** working → plans at archive step. Never reverse.
- **working/ mutable, plans/ immutable.** plans/ only grows via archive merges.
- **Master Plan Mode changes archive payload, not mechanism.** Same `finish-archive-artifacts` skill runs; it copies more (whole master tree instead of single sprint). Earliest sub-sprint merge has smallest master archive; latest merge has most complete.
- **gitignored working/ is what makes cross-worktree persistence possible.** Worktrees isolate code branches but share working/ because it's outside git entirely.

## Living-Document Persistence Gap

`master-plan.md` and any cross-sprint living document (e.g. a master deferments tracker) currently reach git only via `finish-archive-artifacts` at sub-sprint merge. Intermediate edits between merges have no commit-level history. Concrete failure mode: stale entries in the master plan can drift for days without `git diff` detection. Candidate solutions (manual snapshot slash command, PostToolUse hook on master-plan.md edits, per-version snapshot files, embedded git in working/, sibling repo) are surveyed in `docs/chester/working/master-plan-skill-living-document-problem-brief.md` when present. This gap is acknowledged, not yet addressed.

## Integration with Root CLAUDE.md

Root `CLAUDE.md` §"Master Plan Mode" establishes the breadcrumb toggle, the directory overlay when `.active-master` is present, and the sub-sprint naming conventions (`cluster-<letter>-<verb-slug>` for cluster sub-sprints; other patterns per master). This file documents the working/plans division and the archive flow that Master Plan Mode inherits.
