# Master-Plan Skill — Living-Document Persistence Problem Brief

File: `docs/chester/working/master-plan-skill-living-document-problem-brief.md` dtd 2026-04-24

For: a Chester-skill-development session building the master-plan skill.
Author context: this brief was authored from a different conversation. It is self-contained — the reader has no prior context about this discussion.

---

## What this brief is about

The existing Chester `working/` + `plans/` directory model handles **immutable sprint artifacts** well but does not handle **living documents** that are edited continuously across multiple sub-sprints. The master plan (`master-plan.md`) and the master deferments tracker (`master-deferments-current.md`) are the canonical living documents in Master Plan Mode. Both currently lack incremental version history during sprint execution. This brief enumerates the problem, the constraints, and a set of candidate solutions for the master-plan skill author to choose among.

---

## Problem statement

The master plan and master deferments doc evolve continuously as sub-sprints close, LBDs resolve, scope shifts, and decisions accumulate. Today, the only path to git history for these documents is the `finish-archive-artifacts` step, which runs once per sub-sprint merge.

Concrete failure modes observed today:

- **Stale-entry detection latency.** A real audit caught five stale entries in the master plan that had been wrong for at least three days. Without intermediate commits, no `git diff` could be run to detect the drift early.
- **Lost intermediate state.** If `master-plan.md` is edited from v6.6 → v6.7 with multiple touch-ups, the in-between states are unrecoverable. Only v6.7 (or whatever lands at next archive) reaches git.
- **No accountability narrative.** "When did we decide X?" is answerable only by walking the change-summary blocks at the top of the master plan, which depend entirely on the editor's discipline at writing them.
- **Plan-state-vs-reality drift goes silent.** Sprints close, the master plan should flip status markers, but if the editor forgets, no commit hook flags it.

The same failure modes apply to `master-deferments-current.md` (the cross-sprint debt tracker) and to any other document that lives in `working/` longer than one sprint.

---

## Why the existing model has the gap

The Chester directory split is documented in `docs/chester/CLAUDE.md`:

- `working/` is gitignored. Lives outside git entirely. Cross-worktree-stable because it sits at one absolute path on disk regardless of which sub-sprint worktree is active.
- `plans/` is tracked. Archive-only. Written by `finish-archive-artifacts` at sub-sprint close.

That split was designed for **sprint artifacts** — designs, specs, plans, summaries — that get authored once during a sprint and then archived. The split makes deliberate tradeoffs:

- Working/ wins on stable-location and worktree-safety.
- Plans/ wins on history and immutability.
- The handoff between them is one-directional and happens at one moment per sprint.

For sprint artifacts this is correct. For documents that span sprints and get continuously edited, the once-per-sprint handoff is too coarse.

---

## Constraints any solution must respect

- **Stable location preserved.** The working/ being at one absolute path regardless of worktree is a load-bearing property — humans browse it, multiple worktrees write to it, and the wiki convention assumes it. Do not move the master plan into a worktree-relative path.
- **No regression on archive immutability.** Plans/ today carries an "archive-only, never overwritten" guarantee. Sub-sprint artifacts in plans/ should remain immutable after first archive. Any solution that adds living-document tracking to plans/ must distinguish living documents from archived sprint artifacts so the immutability guarantee for archived items is not undermined.
- **Worktree-safe.** Sub-sprint worktrees must not be able to corrupt the living-document state by accident. The git operations that record version history must run only from a known-safe context (for example, only from main worktree, or only against a dedicated branch).
- **No new mental-model burden on the human editor.** The human edits master-plan.md in working/ today. They should continue editing the same file in the same place. The history mechanism should be invisible to the editor.
- **Recoverable.** If the mechanism stops running for a while, the next run should re-establish a consistent state without manual intervention.
- **Compatible with Master Plan Mode and non-Master-Plan-Mode.** Some sprints run under the master breadcrumb, others do not. The mechanism should degrade cleanly when no master is active (or simply not fire).

---

## Existing infrastructure to know about

Before designing a solution, the master-plan skill author should know what already exists in this codebase.

- **`sync-working-to-plans` slash command.** Lives at `.claude/commands/sync-working-to-plans.md`. Copies files from working/ to plans/ that are present in the former and missing in the latter. **Critically, it is additive-only**: if a file exists in plans/ already, the skill will not overwrite it. This is correct semantics for sprint-artifact archiving but wrong semantics for living documents. The skill resolves the plans dir via `git rev-parse --show-toplevel`, which returns the current worktree's root — so invoking it from a sub-sprint worktree writes into that worktree's plans/, not main's plans/.
- **`finish-archive-artifacts` skill.** Runs once at sub-sprint close. Copies the entire master working tree (in Master Plan Mode) into plans/. Currently this is the only path master-plan.md reaches plans/ — and only because plans/ does not have it yet from a prior archive (so additive-copy works). Once it exists in plans/, future archive cycles also do not update it (per the additive-only behavior).
- **Master-plan version-block convention.** Every version bump appends a `**vN.N changes (YYYY-MM-DD):**` block at the top of the master plan describing what changed. Five-version-deep change-summary stack is observable in the current master plan. Editors are disciplined about this. A solution can detect version increments by parsing the `Status: Draft vN.N` line in the header.
- **Chester worktree convention.** Sub-sprint worktrees live under `.worktrees/<sprint-slug>/`. Main checkout is at the repo root. `git worktree list --porcelain` produces a structured listing, with the main worktree as the first entry without `.worktrees/` in its path.
- **Hook system.** Claude Code supports `PostToolUse` hooks that fire after a tool call (Edit, Write, Bash, etc.). Hooks run shell commands and have access to the tool name and target path. They are the natural fit for "fire on every master-plan.md edit."

---

## Solution candidates

Five candidates, ordered roughly by infrastructure invasiveness (least → most).

### A. Manual slash command — editor types `/snapshot-master-plan` after every version bump

Simplest possible implementation.

- The skill is one slash command that runs from main worktree, copies master-plan.md + master-deferments-current.md from working/ → plans/, stages, commits with a generated message.
- Cost is zero infrastructure.
- Cost is also zero discipline tolerance — if the editor forgets, history is lost. The original problem (drift goes silent) recurs.
- Worth shipping as a baseline even if a more automated option is also adopted.

### B. PostToolUse hook on master-plan.md edits — fire-per-version-bump

Hook intercepts every `Edit` or `Write` whose target path matches `master-plan.md`. On fire:

- Read the version from the file header (regex on `Status: Draft v(\d+\.\d+)`).
- Compare to a state file (e.g., `.claude/.master-plan-last-version`).
- If unchanged, no-op.
- If changed, copy living-document set from working/ → plans/ in the main worktree, stage, commit.
- Skip silently if not in main worktree (`git rev-parse --abbrev-ref HEAD` returns something other than `main`, or `git rev-parse --show-toplevel` is under `.worktrees/`).

Properties:

- **Zero editor burden.** Edits trigger snapshots automatically.
- **Cost paid only when something interesting happens.** Version-bump granularity, not per-edit churn. Plan history is meaningful.
- **Worktree-safe via guard.** Hook self-skips when called from sub-sprint contexts.
- **Recoverable.** Missing state file → force snapshot on next fire. Mismatched state file → re-detect and snapshot. Failure to commit (e.g., dirty index) → log and continue; next bump retries.
- **Edge case: editor edits from sub-sprint worktree.** Hook self-skips. Loss is bounded — next main-worktree edit catches up. Worth documenting as a usage convention: master-plan edits should happen from main worktree.

### C. Per-version snapshot files in plans/

Instead of overwriting `plans/<master>/master-plan.md`, write `plans/<master>/master-plan-v6.7.md` etc. Each version is a new file. Existing additive-copy `sync-working-to-plans` works as-is.

Properties:

- Reuses existing skill, no new tooling.
- Plans dir grows linearly with version count.
- Version-to-version diff is `diff master-plan-v6.6.md master-plan-v6.7.md`, not `git log master-plan.md` — less ergonomic.
- "Current state" requires the human to know which version file is latest, or rely on a `master-plan-current.md` symlink.
- Reasonable fallback if hook infrastructure is unavailable. Not the strongest primary option.

### D. Embedded git in working/ — dedicated `chester-working` branch

The working/ directory becomes a git worktree of a dedicated long-lived branch (e.g., `chester-working`). Edits in working/ are git-aware; commits go to that branch independently of any sub-sprint branch.

Properties:

- Stable location preserved.
- Full history with normal git semantics (`git log`, `git diff`, `git blame`).
- No conflict with sub-sprint branches because the chester-working branch is never merged.
- Setup is unusual: a git worktree of branch X embedded inside a directory that is gitignored from branch Y. Mental model is non-obvious.
- Risk: human pushes the chester-working branch by accident, or merges it into main by accident. Branch should be protected.
- Cleanup story is awkward — you cannot rm -rf working/ to start fresh without first deinitializing the embedded worktree.

Workable but heavier. Best fit for editors who already think in terms of git plumbing and want native git tools to work over working/.

### E. Sibling git repository — `~/RiderProjects/StoryDesigner-docs/`

Move docs entirely out of the main repo into a separate sibling repo. Symlink or env var connects them.

Properties:

- Cleanest separation of concerns: code commits in one repo, doc commits in another.
- Doc history fully decoupled from code branches.
- Worktrees of code repo do not see doc state at all (or see it via symlink).
- Loses one property the existing model gives: doc commits are not coupled to code commits in the same merge boundary. A reader cannot do `git log` on the code repo and see doc evolution interleaved.
- Significant migration cost: existing plans/ archives, existing references in code-side CLAUDE.md, existing sub-sprint workflow all assume docs and code share a tree.
- Probably overkill for this problem. Worth considering only if doc volume grows significantly past the current master plan's footprint.

---

## How the candidates compose

These options are not mutually exclusive.

- A + B is a natural pairing — hook automates the common case, slash command is the manual fallback for off-the-happy-path situations.
- A + C is a degenerate version of A + B that swaps automation for explicit per-version files.
- D is an alternative to A/B/C, not a complement.
- E replaces the entire current model and is the heaviest change.

---

## Recommended decision framing for the skill author

Before designing the skill, decide three things in order:

- **Question 1: Should the master-plan skill itself own the persistence mechanism, or should it be a separate concern?**
  Living-document persistence applies to any document that lives in working/ across sprints, not just the master plan. If the skill owns persistence, only documents the skill manages get tracked. If persistence is a separate concern (e.g., a hook + a generic "snapshot any file matching pattern X" rule), it generalizes to any future living document.
- **Question 2: Editor discipline or hook automation?**
  Manual slash command (Option A) trusts the editor. Hook (Option B) does not. The drift problem this solves is "humans forget bookkeeping." That argues for the hook. But hooks are harder to debug, harder to disable temporarily, and add a layer of magic to the workflow.
- **Question 3: Overwriting commits or per-version snapshots?**
  Overwriting (Option B's commit semantics) gives `git log master-plan.md` a meaningful history. Per-version files (Option C) makes snapshots inspectable as static files but loses the natural git-diff workflow. Choose based on which workflow the master-plan skill primarily supports — single-file editing or version-snapshot inspection.

---

## Concrete deliverables the master-plan skill should consider providing

If the skill takes on persistence as part of its scope, the smallest workable bundle is roughly:

- A `snapshot` operation that runs from main worktree, copies the living-document set from working/<master>/ to plans/<master>/, stages, commits with a message including the detected version.
- A version-detection helper that reads master-plan.md and returns the current version string.
- A guard that refuses to run from any worktree under `.worktrees/`.
- A state file or commit-message-derived state for "what was the last version snapshotted." A commit-message scan is more robust than a state file (no extra file to keep in sync).
- An optional hook configuration documented or installed by the skill itself, so adopting the skill enables the automation without manual hook editing.

If the skill explicitly does not own persistence, the skill author should at minimum document the persistence gap so future readers know it exists and know which other tool addresses it.

---

## Open questions for the skill author

- Should snapshot commits go to main, or to a dedicated `chester-master-plan-snapshots` branch that never merges? Main keeps history visible to anyone running `git log` on the repo. Dedicated branch isolates noise but reduces visibility.
- How often is "too often" for snapshot commits? Version-bump granularity probably gives 1–5 snapshots per week during active sprints. That is fine. Per-edit granularity would give 50+ per week and pollute history.
- What happens if two different living documents (master-plan.md, master-deferments-current.md) are edited in the same conversation? One commit covering both, or two separate commits? Probably one combined commit per snapshot trigger.
- Does the skill need to handle the case where a snapshot is requested but plans/ has uncommitted changes from another flow? Either refuse to snapshot or stage everything. Refuse is safer.
- How does the snapshot interact with `finish-archive-artifacts`? They run from different triggers; both write to plans/; they should not conflict but should be tested. Probably the snapshot path only touches the two living-document files, while finish-archive-artifacts touches the entire sub-sprint subtree — different file sets, no overlap.

---

## Pointers to authoritative context

- `docs/chester/CLAUDE.md` — working/plans split rationale and rules.
- `CLAUDE.md` (root) — Master Plan Mode overlay rules.
- `.claude/commands/sync-working-to-plans.md` — existing additive-copy skill.
- `docs/chester/working/20260417-01-change-project-architecture/master-plan.md` — example of a real living document; see version-block convention at the top.
- `docs/chester/working/20260417-01-change-project-architecture/summary/master-deferments-current.md` — second example of a living document, edited every sprint close.
- `docs/chester/working/20260417-01-change-project-architecture/summary/viability-audit-00.md` — recent audit that concretely demonstrated the cost of missing intermediate history.
