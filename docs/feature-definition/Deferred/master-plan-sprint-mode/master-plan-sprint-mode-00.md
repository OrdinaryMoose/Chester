# Feature Definition Brief: Master Plan Sprint Mode

**Status:** Draft
**Date:** 2026-04-24

---

## Problem Statement

Multi-month architectural refactors don't fit Chester's default sprint shape. Chester's pipeline (`design-*` → `plan-*` → `execute-*` → `finish-*`) is optimized for single-session feature work with a flat directory layout — `docs/chester/working/<YYYYMMDD-NN-verb-noun-noun>/{design,spec,plan,summary}/`. When a refactor spans 10+ sub-sprints over 40+ days (StoryDesigner's `20260417-01-change-project-architecture` has shipped 5 sub-sprints plus 6 LBD design sessions in 7 days, with more queued), the flat layout fragments history into unrelated sibling folders and loses the narrative thread — which sub-sprint gated which, which LBD design drove which execution, which deferred item trace forward to which future sprint.

The StoryDesigner project solved this ad-hoc by overriding Chester's default sprint-naming via prompt-level instructions in root `CLAUDE.md § Master Plan Mode (Chester)`. The override has worked for 7 days across 11+ skill invocations — but it's a documented convention, not a Chester skill. Every new skill invocation depends on the model re-reading CLAUDE.md and correctly redirecting default naming rules. No Chester skill natively understands:

- Master-plan-versioned documents (paired top-level version bump + change-summary entry on every body edit)
- Sub-sprint IDs derived from a master plan rather than the default date-slug form
- Cross-sub-sprint branch + worktree naming consistency
- Archive payload expansion (copy entire master working tree, not just one sub-sprint)
- Deferred-item elevation from per-sprint summary to master-deferments tracker

This brief proposes promoting Master Plan Mode from CLAUDE.md convention to a first-class Chester capability: one new entry-point skill (`master-plan-start`) + two skill modifiers (`start-bootstrap` + `finish-archive-artifacts`) + one native document-versioning helper.

### Prior attempts

No prior formal attempt. Informal precedent is the CLAUDE.md override currently active in StoryDesigner's `20260417-01-change-project-architecture` sprint, plus the companion `docs/chester/CLAUDE.md § working/plans division` documentation. The `master-plan-generator` skill at `skills/master-plan-generator/SKILL.md` creates the master-plan document itself but doesn't activate Master Plan Mode — there's no breadcrumb, no directory scaffold, no archive-payload override. It writes a single markdown document that subsequent sprint work doesn't know to consult.

---

## Current State Inventory

### Existing mechanism (prompt-level override in StoryDesigner)

- **Breadcrumb:** `docs/chester/working/.active-master` — single-line file holds master sprint name (e.g., `20260417-01-change-project-architecture`). Checked at conversation start. Presence activates override.
- **Directory layout when active:**
  - Master root: `docs/chester/working/<master-sprint-name>/`
  - Master-level artifacts: `master-plan.md`, `design/`, `spec/`, `plan/`, `summary/`
  - Sub-sprint subdirs nested under master root, named `sprint-<a1|b1|b2|...>-<slug>` or `lbd-<nn>-<slug>` — NOT default `YYYYMMDD-NN-verb-noun-noun`
  - Each sub-sprint has its own `{design,spec,plan,summary}/` subtree
- **Branch + worktree naming:** mirrors sub-sprint dir name (`sprint-b2-1-diagnostic-convergence` branch → `.worktrees/sprint-b2-1-diagnostic-convergence/`)
- **Archive flow:** `finish-archive-artifacts` copies entire master working tree to `docs/chester/plans/<master-sprint-name>/` at each sub-sprint merge. Plans archive accumulates closed sub-sprints over time; each merge overwrites with then-current master state.
- **Exit:** delete `.active-master` breadcrumb. Override becomes inert.

### `master-plan-generator` skill (`skills/master-plan-generator/SKILL.md`)

- Produces one document: `master-plan.md` with phase breakdown, sub-sprint overview, LBD catalogue, endstate description.
- Does not activate Master Plan Mode — no breadcrumb creation, no directory scaffolding, no skill-behavior registration.
- Consumer of its output must separately execute the CLAUDE.md override dance.

### `start-bootstrap` skill (`skills/start-bootstrap/SKILL.md`)

- Default behavior: prompt for sub-sprint verb-noun-noun slug, generate `YYYYMMDD-NN-<slug>` ID, create `docs/chester/working/<id>/{design,spec,plan,summary}/`, write `.active-sprint` breadcrumb.
- No awareness of `.active-master` breadcrumb. Relies on prompt-level CLAUDE.md override to redirect.
- In StoryDesigner: model reads CLAUDE.md override, manually overrides naming/directory rules during each skill invocation.

### `finish-archive-artifacts` skill (`skills/finish-archive-artifacts/SKILL.md`)

- Default payload: one sub-sprint subdir copies from `working/<sprint-subdir>/` → `plans/<sprint-subdir>/` inside the merge worktree.
- No Master Plan Mode awareness natively. In StoryDesigner: model reads override instruction, substitutes "entire master working tree" for "one sub-sprint" + targets `plans/<master-sprint>/` instead of `plans/<sprint-subdir>/`.

### `finish-write-records` skill (`skills/finish-write-records/SKILL.md`)

- Produces session summary + reasoning audit + optional cache analysis.
- Does not produce a deferred-items document natively (user had to ask explicitly in Sprint B2.1).
- Does not copy session JSONL to summary folder natively (user had to ask explicitly).
- No awareness of master-deferments cross-sprint tracker.

### Root `CLAUDE.md § Master Plan Mode (Chester)` (StoryDesigner)

- ~30-line section defines the override. Current content: breadcrumb check at session start; sub-sprint naming rules; directory nesting rules; archive payload expansion; skill redirection mechanism; exit protocol.
- Load-bearing for every skill invocation during the master sprint.
- Model-prompt-level contract. No programmatic enforcement.

### Docs/chester layout documentation (StoryDesigner `docs/chester/CLAUDE.md`)

- Documents working/ vs plans/ separation, gitignore behavior, cross-worktree persistence, master-plan mode overlay rules, transfer flow, post-merge state.
- Reference documentation for a convention that isn't a skill.

### Observed pain points from 7-day Sprint 20260417-01 execution

Surfaced during Sprints A1, B1, B2, B2.1 + LBD-01/02/05/09.x/10/13 design sessions:

- **P1 — Master-plan versioning drift.** Master plan is a versioned document (v1 → v6.6 over 7 days). Per user memory `feedback_master_plan_versioning.md`: every body edit requires paired top-level version bump + change-summary entry + reassessment log entry. Easy to drift — three-way lockstep. Twice in session v6.5 was bumped by one edit path (LBD-5 relocation) while another edit path (B2.1 merge-close) required v6.6 concurrently. No skill enforces the three-way lockstep.
- **P2 — `finish-archive-artifacts` unhandled edge cases.** Archive cp succeeded, but pre-merge `git stash --include-untracked` hit permission-denied errors on `docs/architecture/.structurizr/` index files held open by a running Structurizr process. Stash partially landed, pop partially replayed, manual drop required. No skill handles externally-locked working-tree files during finish.
- **P3 — Archive payload churn.** Each sub-sprint merge copies the entire master working tree including session-JSONL files (~2.6MB per session). Sprint B2.1's archive commit: 21 files, 8868 insertions — inflated by JSONL that's useful for forensic audit but bloats `git log -p`. No option to exclude-but-reference.
- **P4 — Plans-archive path drift.** Immutable archive nature means when master-plan references to sub-sprint paths change (e.g., LBD-5 artifacts relocated from `spec/phase-b-lbd-05-*` into `lbd-05-cross-consumer-scenarios/design/`), the plans-side master-plan still references the old paths until the next archive cycle. Acknowledged in v6.5 change notes but not remediated.
- **P5 — Deferred-item elevation.** Per-sprint deferred summaries (e.g., `sprint-b2-1-diagnostic-convergence-deferred-00.md`) capture sprint-level debt. These need elevation to master-level `summary/master-deferments-current.md` for cross-sprint visibility. Currently manual — user asked "write any deferments into a summary document" in Sprint B2.1.
- **P6 — Sub-sprint insertion + splits informal.** Sprint B2.1 inserted mid-plan between B2 and B3. Sprint B3 split into B3.1 + B3.2 during plan-hardening. Both decisions land via master-plan body edits alone; no skill ritual for "master-plan renumbering" or "dependency graph update."
- **P7 — Session JSONL + deferred-summary manual.** User preference (per `feedback_session_jsonl_copy.md` memory) requires session JSONL in summary folder; `finish-write-records` doesn't do it natively. Similar for deferred-items documents.
- **P8 — First post-merge fitness scan catches latent gaps.** ARCH-151 fitness test in Sprint B2.1 passed in worktree because worktree didn't contain `Story.Domain.Repository/*` files at the current main-tree state. Merge widened scan, caught 2 legitimate indirection patterns + required refinement commit. Worktree-local fitness doesn't guarantee post-merge fitness. Master Plan Mode doesn't currently cross-check.

---

## Governing Constraints

- **Backward compatibility with non-master sprint work.** The existing date-slug sprint convention must continue to work for one-off refactors and feature work. Master Plan Mode is an overlay, not a replacement.
- **No skill-file modification pattern for dynamic behavior.** Existing CLAUDE.md override preserves this: skills stay stable; a breadcrumb activates overlay. New skill must not edit `start-bootstrap.md` or peer skill files dynamically. Detection + branching happens inside the skill.
- **One breadcrumb per mode.** `.active-sprint` already exists for sub-sprint locator. `.active-master` adds the master-sprint locator. Both present = Master Plan Mode. Only `.active-sprint` = default mode.
- **`plans/` is append-only institutional memory.** Archive flow MAY NOT retroactively rewrite old sub-sprint archives. Path drift (P4) is resolved forward, not backward.
- **Cross-worktree persistence of `working/` is load-bearing.** `master-plan.md` edits during an LBD session in worktree A must be visible from sub-sprint B's worktree. This works today because `working/` is gitignored and lives outside git entirely (one main-checkout path resolves for all worktrees via `CHESTER_WORKING_DIR`). New skill must not break this property.
- **Chester skill pipeline shape unchanged.** `design-*` → `plan-*` → `execute-*` → `finish-*` remains. Master Plan Mode adjusts what those skills name/write/archive; it does not insert new pipeline stages.
- **Master-plan document is THE north-star.** Every sub-sprint execution reads its scope from the master plan. The master plan is authoritative over any individual sub-sprint's assumptions. Skill must respect read-direction: master-plan → sub-sprint plan → execute.

---

## Design Direction

### New skill: `master-plan-start`

Activates Master Plan Mode. Consumes output of `master-plan-generator` (the document) + creates the runtime state that makes every subsequent skill master-aware.

**Inputs:**
- Master sprint name (required) — follows `YYYYMMDD-NN-<slug>` form OR explicit override (e.g., `20260417-01-change-project-architecture`).
- Path to existing `master-plan.md` OR directive to invoke `master-plan-generator` first.

**Actions:**
1. Verify master-plan document exists at `{CHESTER_WORKING_DIR}/<master-sprint>/master-plan.md`. If missing, instruct user to run `master-plan-generator` first OR pass path flag.
2. Create master-level directory scaffold: `{CHESTER_WORKING_DIR}/<master-sprint>/{design,spec,plan,summary}/`.
3. Write `{CHESTER_WORKING_DIR}/.active-master` breadcrumb — single line with master sprint name.
4. (Optional) Write `{CHESTER_WORKING_DIR}/<master-sprint>/summary/master-deferments-current.md` skeleton from template.
5. Report activation: "Master Plan Mode active. Subsequent sub-sprints will nest under `<master-sprint>/`. Sub-sprint naming uses master-plan IDs. Exit with `master-plan-close`."

**Does not:**
- Execute any sub-sprint work — that's `start-bootstrap`'s job.
- Edit the master-plan body — that's `master-plan-generator`'s job.

### New skill: `master-plan-close`

Deactivates Master Plan Mode. Intended for when the entire master sprint closes (all sub-sprints shipped or explicitly abandoned).

**Actions:**
1. Verify no open sub-sprint (`.active-sprint` absent OR user confirms closure intent with open sub-sprint).
2. Write one last master-level archive via `finish-archive-artifacts` in master-flush mode (copy entire working master tree to `plans/<master-sprint>/`).
3. Delete `.active-master` breadcrumb.
4. (Optional) Write final closure summary `{CHESTER_WORKING_DIR}/<master-sprint>/summary/master-closure-00.md`.
5. Report: "Master Plan Mode inactive. Default sprint convention restored."

### New skill modifier: `master-plan-body-edit`

Versioned-document helper. Called when ANY edit to `master-plan.md` happens. Enforces the three-way lockstep from pain point P1.

**Usage:**
Any skill or direct edit to `master-plan.md` MUST be wrapped by `master-plan-body-edit` which:

1. Asks user for (a) next version number (auto-suggests patch bump, user confirms major/minor/patch), (b) change-summary paragraph text.
2. Performs three coordinated edits: date-line entry + Status line bump + prepended change-summary paragraph.
3. If the edit is significant enough, also prepends a reassessment-log entry under `### Master Plan Reassessments`.
4. Verifies document passes a lightweight linter check (all three slots updated; version strictly increasing; change-summary paragraph non-empty).

### `start-bootstrap` skill modifier (integration, not replacement)

Add Master Plan Mode detection at skill entry:

```
1. Check for `.active-master` breadcrumb.
2. If present:
   - Read breadcrumb content → master-sprint-name.
   - Read `{CHESTER_WORKING_DIR}/<master-sprint>/master-plan.md` → derive next sub-sprint ID from the plan's "Sub-Sprint Overview" block (first unstarted entry).
   - Sub-sprint ID form: `sprint-<a1|b1|b2|...>-<short-slug>` (implementation) OR `lbd-<nn>-<short-slug>` (LBD design) per master-plan convention.
   - Create `{CHESTER_WORKING_DIR}/<master-sprint>/<sub-sprint-id>/{design,spec,plan,summary}/`.
   - Branch + worktree names mirror `<sub-sprint-id>`.
   - Write `.active-sprint` breadcrumb at `{CHESTER_WORKING_DIR}/.active-sprint` (same location as default mode; content is sub-sprint-id).
3. If absent: run default date-slug flow unchanged.
```

The existing `start-bootstrap.md` gains a `## Master Plan Mode Detection` section before its default-mode instructions.

### `finish-archive-artifacts` skill modifier (integration)

Add Master Plan Mode detection at skill entry:

```
1. Check for `.active-master` breadcrumb.
2. If present:
   - Read breadcrumb content → master-sprint-name.
   - Archive payload: copy ENTIRE `{CHESTER_WORKING_DIR}/<master-sprint>/` subtree → `<worktree-root>/<CHESTER_PLANS_DIR>/<master-sprint>/`.
   - Commit message: `docs: archive master sprint artifacts — <master-sprint> (sub-sprint <sub-sprint-id> merge)`.
3. If absent: run default one-sub-sprint cp flow unchanged.
```

Existing skill file gains a `## Master Plan Mode Detection` section.

### `finish-write-records` skill modifier (integration)

Three additions, all conditional on `.active-master` present:

1. **Auto-write deferred-items summary** — when sub-sprint has accumulated any explicitly flagged deferrals (detected by scanning plan + execution transcripts for "DEFERRED" / "defer to" / "follow-up debt"), write `{sub-sprint-id}-deferred-NN.md` to sub-sprint summary folder without requiring user to ask. Addresses pain point P7.
2. **Auto-copy session JSONL** — locate the session's JSONL file; copy to `{sub-sprint-id}-session-NN.jsonl` in sub-sprint summary folder. Addresses P7 user preference.
3. **Auto-elevate sub-sprint deferrals into master-deferments-current.md** — read just-written sub-sprint deferred doc; append/update entries in the master tracker with consistent section numbering. Addresses pain point P5.

### `util-artifact-schema` extension

Extend the schema to recognize master-plan-mode artifact paths:

- `master-plan.md` lives at master root, not under a `{design,spec,plan,summary}/` subfolder.
- `master-deferments-current.md` lives at master-level `summary/`.
- `master-closure-NN.md` optional, master-level `summary/`.
- LBD-style sub-sprint uses `lbd-<nn>-<slug>` ID pattern; sprint-style uses `sprint-<a1|b1|b2|...>-<slug>`.

### Handling for observed pain points

- **P1 Master-plan versioning drift** → `master-plan-body-edit` helper enforces three-way lockstep.
- **P2 Archive stash permission failures** → `finish-close-worktree` gains pre-stash diagnostic step: scan working-tree for known-locked paths (`.structurizr/`, `.lock` patterns), warn user before stash cycle, offer to skip those paths.
- **P3 Archive JSONL churn** → Add `.chester-archive-exclude` glob file at master-sprint root; default glob excludes `*.jsonl` from the cp payload but leaves them reachable in `working/` for forensic use. User overrides per master sprint.
- **P4 Plans archive path drift** → `finish-archive-artifacts` optionally emits a `MOVED:` note in the archive commit body when it detects path-rename between this archive and the last. Explicit, not silent.
- **P5 Deferred-item elevation** → covered by `finish-write-records` modifier auto-elevation above.
- **P6 Sub-sprint insertion + splits informal** → add `master-plan-body-edit --operation=insert-subsprint` and `--operation=split-subsprint` convenience modes that update the master-plan's sub-sprint overview + dependency graph + reassessment log in one coherent edit.
- **P7 Auto-JSONL + auto-deferred** → covered by `finish-write-records` modifier above.
- **P8 Post-merge fitness latency** → `finish-archive-artifacts` in master mode optionally re-runs the project's architecture fitness test against the merged `main` tree BEFORE completing the merge-commit. If fitness fails, abort merge + instruct hotfix on feature branch. Opt-in via master-plan metadata.

### Documentation surface

- New skill docs: `skills/master-plan-start/SKILL.md`, `skills/master-plan-close/SKILL.md`, `skills/master-plan-body-edit/SKILL.md`.
- Updated skill docs: `skills/start-bootstrap/SKILL.md` gains Master Plan Mode Detection section; `skills/finish-archive-artifacts/SKILL.md` gains same; `skills/finish-write-records/SKILL.md` gains master-aware auto-elevation section; `skills/util-artifact-schema/SKILL.md` gains master-mode path conventions.
- Existing `master-plan-generator` skill gets a cross-link: "After generating master-plan, activate via `master-plan-start`."
- One reference doc: `docs/master-plan-mode.md` — explains the overlay model, how breadcrumbs interact, the directory layout, the archive semantics, exit protocol. Replaces the load on project-level CLAUDE.md overrides.

---

## Open Concerns

- **C1: Where does master-deferments-current.md template live?** New skill ships with a template; user-per-project templates would require a hook. Default skill-shipped template is simplest start.
- **C2: How does `master-plan-body-edit` reconcile concurrent edits?** Two skill invocations racing to bump version is possible during parallel sub-sprint work (e.g., one LBD design session + one execute-write in different worktrees). Proposed mitigation: advisory lockfile `{master-sprint}/master-plan.lock` with PID + timestamp; skill aborts + advises "another edit in progress" if lock held. Not mandatory — optimistic concurrency with conflict-reconciliation after the fact is also acceptable given low edit frequency.
- **C3: Should `finish-archive-artifacts` run a "plans-drift" self-diff?** Detect paths referenced in `master-plan.md` that no longer resolve in the master working tree. Emits warnings to the archive commit body. Opt-in or always-on? Recommend opt-in at first; can become default later.
- **C4: JSONL exclude pattern backward-compat.** If a project already has committed JSONLs under `plans/` (StoryDesigner does), applying the exclude pattern retroactively would show them as tracked-but-no-longer-archived. Mitigation: exclude pattern only skips cp-over-cp updates; pre-existing tracked files remain. `.chester-archive-exclude` semantics are "do not newly archive matching files"; existing tracked state unaffected.
- **C5: Master Plan Mode activation cost.** Running `master-plan-start` as a separate skill adds one skill invocation before every master-plan workflow. Alternative: `master-plan-generator` optionally activates on completion via `--activate` flag. Recommend: separate invocations for clarity, with `master-plan-generator` reminding user to run `master-plan-start` next.
- **C6: Exit-time cleanup scope.** `master-plan-close` could also trigger a final consolidated summary across all sub-sprints. Overreach for v1 — leave as optional future work. v1 `master-plan-close` just closes the overlay; user runs any finals manually.
- **C7: Skill-file diff vs SKILL.md frontmatter discovery.** Existing Chester skills carry YAML frontmatter that drives the Skill index. New skills must integrate cleanly. No concerns specific to Master Plan Mode — follow existing patterns.

---

## Acceptance Criteria

A user experienced with Chester should be able to:

1. **Activate Master Plan Mode in under 2 minutes.** Starting from a completed `master-plan.md`, running `master-plan-start <master-sprint-name>` creates the breadcrumb + master dir scaffold + deferments skeleton. Subsequent `start-bootstrap` invocations auto-derive sub-sprint IDs from the plan without user prompting for naming.

2. **Observe correct sub-sprint placement without manual override.** `start-bootstrap` in Master Plan Mode creates `{CHESTER_WORKING_DIR}/<master-sprint>/<sub-sprint-id>/{design,spec,plan,summary}/` with branch + worktree mirroring the sub-sprint ID. No CLAUDE.md prompt-level redirection required.

3. **Observe correct archive expansion automatically.** `finish-archive-artifacts` in Master Plan Mode copies the entire master working tree (minus excluded globs from `.chester-archive-exclude`) to `plans/<master-sprint>/`. Commit message notes which sub-sprint triggered the archive.

4. **Receive deferred-items summary + session JSONL automatically at finish-write-records.** No explicit "please also write a deferred summary" ask required.

5. **See sub-sprint deferrals appear in master-deferments-current.md** at the end of `finish-write-records` without manual consolidation.

6. **Edit the master plan safely via `master-plan-body-edit`.** Every body edit results in a synchronized version bump + change-summary paragraph + (optional) reassessment-log entry. Skill refuses to save incomplete lockstep.

7. **Exit Master Plan Mode cleanly via `master-plan-close`.** Breadcrumb removed; default sprint convention auto-restored; pre-existing working/ contents retained (gitignored) as historical scratch until user manually cleans.

8. **Preserve the current manual override as backward compat.** Projects still using the CLAUDE.md `§ Master Plan Mode (Chester)` prompt-level override continue to work. New skills coexist with the override — the override acts as fallback for unmigrated projects.

9. **Pass a documentation smoke test.** A new project contributor reads `docs/master-plan-mode.md` + skill descriptions and can successfully execute one full master-sprint-cycle (activate → run 1 sub-sprint → finish → close) without reading the current StoryDesigner CLAUDE.md override text.

10. **Master-plan-aware pain points resolved.** P1 (versioning drift) + P5 (deferred elevation) + P7 (JSONL auto-copy) + P6 (sub-sprint insert/split rituals) covered by new skills; P2 (stash permission) + P3 (archive churn) + P4 (path drift) + P8 (fitness latency) covered by additive opt-in mechanisms that don't degrade default behavior.
