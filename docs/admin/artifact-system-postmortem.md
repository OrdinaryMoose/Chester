# Post-Mortem: The Working/Plans Dual-Directory Artifact System

**Date:** 2026-05-01
**Subject:** the dual-directory model (`docs/chester/working/` gitignored, `docs/chester/plans/` tracked) and the worktree-commit flow that bridges them
**Author:** Mike (sole developer)
**Triggering observations:** sprint `20260430-03-add-artifact-skill-versions` produced two real artifact-system failures during execution — a filename-convention violation that survived plan-build hardening and a CWD-trap that wrote a sprint's artifacts into the wrong directory until manually corrected at finish time. Both were caught, but late. Both reveal structural issues with the dual system as currently documented.

---

## The model, briefly

Chester separates two purposes into two directories:

- **`docs/chester/working/`** — gitignored. Every sprint's design briefs, specs, plans, summaries, audits, and intermediate state files are written here during the sprint. Mutable. Cross-worktree-shared (lives at the main repo's path; one canonical location regardless of which worktree the sprint runs from). Not part of git history.
- **`docs/chester/plans/`** — tracked in git. Archive-only. Populated by exactly one skill (`finish-archive-artifacts`) at exactly one moment (immediately before merge). Each sprint gets a permanent record alongside the code in main's git history.

The `.gitignore` rule is for `docs/chester/working/` (the relative path). Any worktree shares the main repo's `.gitignore`, so a path like `<worktree>/docs/chester/working/` is also gitignored — but it is not the same directory as the main repo's `<main>/docs/chester/working/`. It is a different directory at a different absolute path that happens to share the same gitignore status.

The flow at sprint close:

1. `finish-write-records` writes the summary and audit to the canonical `<main>/docs/chester/working/<sprint>/summary/`.
2. `finish-archive-artifacts` runs inside the worktree on the feature branch. It runs `cp -r` from `$CHESTER_WORKING_DIR/<sprint>/` to `<worktree>/$CHESTER_PLANS_DIR/<sprint>/`. The destination is inside the worktree's checkout, so the copy lands in tracked-by-git territory.
3. `finish-archive-artifacts` then `git add` and `git commit -m "docs: archive sprint artifacts for <sprint>"` against the feature branch.
4. `finish-close-worktree` (option 1) merges the feature branch into main with `--no-ff`. The archive commit lands on main as part of the merge. Working dir is unchanged.

This is the design. It is well-thought-out for the failure modes it's trying to prevent (lost docs across branch switches, unclear archival timing, mutable docs polluting tracked history). But the design has a CWD pitfall, a filename-convention pitfall, and a worktree-commit subtlety that this sprint exposed in real time.

---

## Failure 1: artifacts written to the wrong working directory (CWD trap)

### What happened

The 04-30 sprint started with `create-session`, which correctly created `docs/chester/working/20260430-03-add-artifact-skill-versions/{design,spec,plan,summary}/` at the main repo's canonical path. That part worked. But once `design-large-task` (well, in this case a manual flow) wrote the brief, the brief landed at:

```
/home/mike/Documents/CodeProjects/Chester/.worktrees/20260430-03-add-artifact-skill-versions/docs/chester/working/20260430-03-add-artifact-skill-versions/design/...
```

— which is the worktree-internal path, not the main-repo canonical path. Same relative path inside two different absolute parents. Both gitignored. Both invisible to git. Easy to confuse.

The same thing happened to the plan, the threat report, and the deferred-items file. By the time `finish-write-records` ran and tried to harvest the trailer chain via `chester-trailer-write harvest`, it ran against the canonical empty path and got nothing — because all the artifacts were sitting in the wrong place.

The fix at finish time: a manual `cp -r` from the worktree-internal path to the canonical path, followed by re-running harvest. The fix worked. But it should not have been needed.

### Why it happened

Three contributing factors compounded:

- **The Write tool takes absolute paths.** I (the agent) was working inside the worktree, with the worktree path as my mental cwd. Composing absolute paths against that mental cwd produces worktree-internal absolute paths. The Write tool obeys absolute paths verbatim — it has no awareness of "is this the canonical chester working dir or a misrouted parallel one?"
- **`chester-config-read` resolves correctly, but only when a skill USES it.** The config exports `CHESTER_WORKING_DIR=/home/mike/Documents/CodeProjects/Chester/docs/chester/working` — the canonical absolute main-repo path. Skills that `eval "$(chester-config-read)"` and then write to `$CHESTER_WORKING_DIR/<sprint>/...` get the right location. Agents that compose paths from "where I am right now" don't.
- **Both directories are gitignored.** There is no error signal. `git status` is clean either way. The misroute is invisible to the normal feedback loops until something downstream (here, `finish-archive-artifacts` reading from `$CHESTER_WORKING_DIR`) reveals the mismatch by finding nothing where it expected work.

### What this means structurally

The single-source-of-truth property the dual system relies on is "all sprint artifacts live at one canonical path resolved via `chester-config-read`." This is a *convention*, enforced by skill discipline, not by mechanism. Any agent or skill that composes paths from cwd or from worktree-relative roots can violate the convention silently.

Three responses available:

- **Tighten the convention** — every skill MUST resolve `CHESTER_WORKING_DIR` and use it as the parent of all writes. No exceptions. This is already the rule but is not enforced. Documenting the rule more visibly (e.g., a `references/working-dir-rule.md`) and adding a hook that validates writes go through `CHESTER_WORKING_DIR` would tighten enforcement, but hooks have a poor cost-of-deployment profile and a history of being reverted.
- **Detect at archive time** — `finish-archive-artifacts` could `find` for stray sprint dirs at worktree-internal paths and warn (or auto-merge) before archiving. Already partially exists informally — today's manual `cp -r` was this same operation, executed by hand.
- **Redesign to make worktree-internal artifacts impossible** — e.g., have skills refuse to write to a worktree-rooted path. Heavy-handed; could break legitimate worktree-local scratch work.

The cheapest concrete fix is to add a reconciliation step to `finish-archive-artifacts`: before the canonical `cp -r`, sweep the worktree's own `docs/chester/working/<sprint>/` and merge any orphan content into the canonical working dir. Today's manual fix becomes the skill's standard procedure. One `cp -r` on each side; idempotent; covers the failure mode without enforcement infrastructure.

---

## Failure 2: filename convention drift (full prefix instead of words-only)

### What happened

The 04-30 sprint's design brief was written as `20260430-03-add-artifact-skill-versions-design-00.md` — using the full sprint name including the `YYYYMMDD-##-` date-sequence prefix. The schema (`util-artifact-schema/SKILL.md`) prescribes the file prefix should be the words-only portion, e.g. `add-artifact-skill-versions-design-00.md`. The directory name carries the date-sequence; the file prefix does not.

The plan-build hardening review noted the violation but classified it as a pre-existing inconsistency (because the brief had already been written by the time plan-build saw it). The mitigation menu offered "(f) Brief filename rename" as a recommended cheap fix, which the user accepted. The brief was renamed during plan-hardening; the plan was written with the correct convention from the start.

### Why it happened

I (the agent) wrote the brief at create-session time without consulting `util-artifact-schema/SKILL.md`. I borrowed the directory name and used it as the file prefix wholesale — natural mistake, easy to make, and not caught until plan-build hardening surfaced the inconsistency.

This is the same class of failure as Failure 1: convention enforced by skill discipline, not mechanism. The schema is the authority but only if the agent reads it.

### What this means structurally

Filename conventions are a small slice of the larger pattern: rules documented in `util-artifact-schema/SKILL.md` are normative for every skill but are not validated by any test or check. The artifact-schema test (`tests/test-artifact-schema.sh`) verifies the *schema doc itself* contains certain sections, not that artifacts in the wild conform to the schema.

A mid-cost fix: add a validator script (`bin/chester-validate-artifacts` or similar) that walks `docs/chester/working/<sprint>/` and reports any filename or directory-naming violations. Run it as part of `execute-verify-complete` or `finish-archive-artifacts`. This would catch Failure 2 (and any future filename drift) before merge, at the cost of one bash script and one new skill step.

A low-cost fix: add a one-line reminder to `create-session` and to `chester:design-large-task` / `chester:design-small-task` that filename = words-only-prefix, with a link to `util-artifact-schema/SKILL.md`. Documentation pressure rather than mechanical enforcement. Cheaper but weaker.

---

## The absence of artifacts in working/ — what it means

After today's sprint completed and merged, the canonical working-dir state is:

```
docs/chester/working/20260430-03-add-artifact-skill-versions/
├── design/  (1 file: brief)
├── execute/ (scratch — task-01/observable-behaviors.md)
├── plan/    (3 files)
├── spec/    (empty)
└── summary/ (5 files)
```

These are the post-archive remnants. They are not authoritative — the authoritative copy lives in the merged `docs/chester/plans/20260430-03-add-artifact-skill-versions/`. The working/ copy stays around because the gitignored directory is not cleaned by any skill. It accumulates over time across sprints; old sprint dirs sit there indefinitely until manually removed.

This raises three questions:

- **Should working/ be cleaned automatically?** Today: no skill cleans it. Old sprint dirs persist as dead state. The accumulating volume is not large in practice (a few hundred KB per sprint, mostly markdown), but the conceptual cost is non-zero — readers may be confused about which copy is current. Possible answer: `finish-close-worktree` could rm the sprint's working dir after archive, since it's now safely in `plans/`. Risk: if archive failed silently, removing working/ destroys evidence.
- **What if working/ goes missing entirely between sessions?** It can. Working dir is gitignored and lives outside any tracked artifact. If the directory is deleted (by hand, by a misconfigured cleanup script, by `git clean -fdx`), all in-flight sprint state is lost. The plans archive is the only durable record, and only for sprints that have already closed. Mid-sprint state is fragile. The model assumes working/ is stable; it provides no recovery mechanism if it's not.
- **What's the relationship between the worktree-internal copy and the canonical copy?** Today's sprint exposed this. They are separate directories at separate absolute paths. The canonical one is what `finish-archive-artifacts` reads. The worktree-internal one is incidental — it exists only because the worktree shares the main repo's directory tree, including paths that happen to be gitignored. Mistaking one for the other is the failure mode of Failure 1.

The absence of authoritative artifacts in working/ post-archive is intended (working = ephemeral) but the lack of explicit cleanup means working/ post-archive carries the appearance of authoritative state without being authoritative. This is a small concern, but worth naming.

---

## Worktree commits — how they work and why they matter

### The core idea

Sprints run inside git worktrees, not in the main repo's checkout. This is intentional:

- The feature branch is checked out in the worktree; main stays clean.
- All commits during the sprint go onto the feature branch, isolated from main's working state.
- The user can switch contexts (run another sprint, work on main directly) without conflicts, because the worktree is a separate working copy.

`finish-archive-artifacts` runs inside the worktree. It executes `cp -r` from the canonical working dir (outside the worktree) into the worktree's checkout under `docs/chester/plans/<sprint>/`, then `git add` and `git commit` against the feature branch. The archive commit becomes part of the feature branch's history. When the branch merges into main, the archive lands on main as part of the merge.

### What this means in practice

The canonical working dir lives at the main-repo path *and is shared by all worktrees*. The plans dir is *worktree-local territory* — each worktree's checkout has its own `docs/chester/plans/` reflecting whatever has been merged into main plus whatever the current worktree branch has committed.

This produces a subtle invariant: **the archive is committed to the worktree's branch, not to main directly.** Until merge, the archive only exists on the feature branch. If the user discards the worktree without merging (option 4 in `finish-close-worktree`), the archive evaporates with the branch. The working/ dir survives (gitignored, no commit dependency), so the artifacts are not entirely lost — but the *intended permanent record* (the archive in plans/) was never persisted into main's history.

### Why the merge step is load-bearing

The dual system's value depends on the merge step actually happening. Without merge, the archive lives on a feature branch that may or may not survive. With merge, the archive joins main and becomes part of the durable git history.

`finish-close-worktree` enumerates four options: merge locally, push and create PR, keep as-is, discard. Only options 1 and 2 result in the archive reaching main (the PR path requires later merge). Options 3 and 4 leave the archive in limbo or destroyed.

This is fine when the user is paying attention. It becomes a problem when the user picks option 3 ("keep as-is, I'll handle it later") and then doesn't handle it. The archive sits on a feature branch indefinitely; the working/ dir slowly drifts; main's history has no record of the sprint. The dual system has a sleep-deferred failure mode here.

### Worktree commit gotchas observed today

- **Don't `cd` to the main repo from a worktree session.** Memory note: this corrupts the worktree's git state. Use `git -C <main-repo>` for any cross-worktree operations. Today's merge used this pattern correctly: `git -C $MAIN merge --no-ff <branch>`.
- **Branches checked out in a worktree cannot be deleted.** `git branch -d <branch>` from main fails if the branch is in a worktree. The cleanup sequence has to be: remove worktree → delete branch. Today's `finish-close-worktree` did this correctly.
- **Stash / stash-pop interacts oddly with worktrees if the user isn't careful.** Today the main repo had `M .claude/settings.local.json` plus an untracked test file when the merge ran. Stashing only the modified file (not the untracked one) and popping after merge worked cleanly, but the user had to be told (and the agent had to ask) — the skill doesn't automate this.

---

## Challenges for the designer

The dual system is sound at the macro level — gitignored mutable scratch + tracked immutable archive is a reasonable separation. The challenges are at the boundary between the two and at the worktree-merge integration.

### Challenge 1: convention vs mechanism

Almost every artifact-system rule is a convention enforced by skill discipline:

- "Write artifacts to `$CHESTER_WORKING_DIR/<sprint>/...`."
- "Use words-only prefix in filenames."
- "Don't write to `docs/chester/plans/` outside finish-archive-artifacts."
- "Don't `cd` to main from a worktree session."

Each rule has a known failure mode. None has a mechanical check. The system relies on skill files being read carefully and agents following them. Today's sprint had two failures in two rules in one sprint. Pattern is not unique to today.

The designer's choice: tighten enforcement (validators, hooks, schema-validating CI) at cost of friction and infrastructure, or accept that conventions will drift and budget for catch-and-correct at hardening / archive / verify-complete steps.

### Challenge 2: the gitignored canonical path is invisible to most safety nets

Working/ doesn't show up in `git status`, doesn't trigger merge conflicts, doesn't exist in remote backups (unless explicitly synced), doesn't get scanned by code review tools, doesn't have file-system-level write protection. It is the load-bearing primary store for in-flight work AND it is the thing git is configured to ignore.

This is a real architectural tension. Making it tracked solves the visibility problem but pollutes main's history with mutable mid-sprint scratch. Keeping it ignored preserves clean history but accepts the invisibility. The current choice (ignore) is defensible; the cost is the silence around mistakes like Failure 1.

A possible compromise: add a sibling `docs/chester/working-meta/` (tracked) that contains a `.last-checkpoint` file written by `finish-archive-artifacts`, recording the canonical path resolution + checksums of the archived artifacts. Future sessions can verify the last-known canonical state. Doesn't solve the underlying invisibility but provides a thin tracked breadcrumb for forensics.

### Challenge 3: the archive timing is the only chance to catch drift

Drift can happen anywhere: filename, directory, content. The chain of detection is:
1. Plan-build hardening — catches filename and structural inconsistencies if they're visible to the reviewer.
2. Execute-write per-task review — catches code-level drift.
3. Execute-verify-complete — catches test-level drift.
4. Finish-archive-artifacts — last chance to catch artifact-level drift before merge.

Today's Failure 1 (CWD trap) wasn't caught until step 4 — and only because finish-write-records ran harvest first and noticed empty output. Without that signal, the archive would have proceeded with empty source, written an empty plans/ dir, committed and merged silently. The user wouldn't have known until trying to read the archive weeks later.

A targeted defense: add a precondition check to finish-archive-artifacts that the source dir contains at least the expected subdirectories (design/, plan/, summary/) with at least one file in plan/. If the source is empty or near-empty, BLOCK with a warning. This catches the Failure 1 mode at exactly the moment when correction is cheap.

### Challenge 4: option 3 ("keep as-is") is a long-tail risk

Branches with archive commits sitting un-merged on the user's machine accumulate over time. Each one represents a sprint's worth of intended-permanent history that hasn't reached main. The user can't easily see the inventory of un-merged sprint branches. `git worktree list` shows worktrees but not the merge state of their branches.

Mitigation candidates:
- A `chester-status` script that lists all worktrees with their branches' merge state vs main. Not built today.
- A scheduled agent (`/schedule`) running weekly: "list un-merged Chester sprint branches; flag any older than 14 days." Built-in mechanism. Easy to set up.

### Challenge 5: master-plan mode complicates the dual system

Today's sprint did not use master-plan mode. Sprints that do (per `/home/mike/Documents/CodeProjects/Chester/CLAUDE.md` § Master Plan Mode) nest sub-sprint dirs inside a master sprint dir. The archive flow is preserved (working/<master>/* → plans/<master>/* on each sub-sprint merge), but the cumulative archive overwrites itself across sub-sprint merges. Each sub-sprint merge writes the full master tree at that point in time. This is correct for the design's "cumulative state at most-recent-merge" property but means earlier sub-sprint archives are incomplete snapshots — they only see the master state as of their merge, not the final state.

The StoryDesigner repo uses master-plan mode actively. The Chester repo has not as of this sprint. Designer should be aware that recommendations about archive cleanup, working-dir cleanup, and branch-merge tracking don't scale uniformly across master-plan and non-master-plan sprints.

---

## Recommendation summary

The dual system is fundamentally sound. The failure modes are:

1. **Convention violations slip through silently.** Mitigate by adding validators that run at execute-verify-complete or finish-archive-artifacts. Filename, directory-name, and required-subdir-presence checks are cheap.
2. **CWD-routing failures are invisible until archive time.** Mitigate by having finish-archive-artifacts sweep worktree-internal `docs/chester/working/<sprint>/` for orphan content and merge it into canonical before archiving. Idempotent. Covers the Failure 1 mode.
3. **Empty archive source is silently archivable today.** Mitigate by having finish-archive-artifacts BLOCK if source dir is missing or has no content in plan/. Cheap precondition check.
4. **"Keep as-is" branches accumulate.** Mitigate by scheduling a periodic merge-state inventory or building a `chester-status` script. The current agent-orchestrated flow has no inventory mechanism.
5. **Working/ post-archive carries appearance-of-authority without being authoritative.** Decide whether to leave it (current behavior) or auto-clean it. Either is defensible; the current choice should be made consciously.

None of these are critical. All are real. They compound when sprints are run rapidly or when the user is context-switching across worktrees. Today's sprint hit two of them; the next one will hit at least one.

---

## Practical immediate actions

If the designer wants the system tightened in priority order:

1. Add a precondition check to `finish-archive-artifacts`: source dir has design/, plan/, summary/ each with ≥1 file. BLOCK on missing.
2. Add a sweep step to `finish-archive-artifacts`: look for orphan content at `<worktree>/docs/chester/working/<sprint>/`; if found, copy into canonical before archiving.
3. Add a one-line reminder to `create-session`, `chester:design-large-task`, `chester:design-small-task` that filenames use the words-only prefix, with link to `util-artifact-schema/SKILL.md`.
4. Build `bin/chester-status` to enumerate worktrees with merge state. Optional `/schedule` agent to run it weekly.

Items 1 and 2 together would have caught both of today's failures at the right moment. Items 3 and 4 are smaller-impact polish.

The dual system is one of Chester's better design choices. It just needs tightening at the seams the worktree integration creates.

---

## Appendix: artifacts referenced

- Working/plans split documented at: `docs/chester/CLAUDE.md` (top-level summary)
- Schema-of-record: `skills/util-artifact-schema/SKILL.md` (filenames, directory layout, versioning, provenance trailers)
- Archive flow: `skills/finish-archive-artifacts/SKILL.md`
- Branch integration: `skills/finish-close-worktree/SKILL.md`
- Today's sprint: `docs/chester/plans/20260430-03-add-artifact-skill-versions/` — Failure 1 manifested in summary preparation; Failure 2 was caught by plan-hardening mitigation (f).
- Companion post-mortem: `decision-record-postmortem.md` (same directory).
