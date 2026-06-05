# Purist Transcript — Round 03 (Develop)

**Sprint:** 20260605-01-remove-largetask-references
**Round:** 03 — Implementation plan development
**Role:** Purist (AC-trace completeness + category integrity)

---

## 1. Task Decomposition Proposal

The 24 ACs map to ten tasks. The decomposition is driven by two constraints: (a) files that receive both a re-point and a delete must be handled in a single task to keep the file's net state coherent in one commit; (b) test-lockstep edits must land in the same task as the file they pin, not in a separate test-cleanup sweep.

### Task 1 — Re-point execute-write
**Type:** docs-producing
**Implements:** AC-1.1
**Decision budget:** 1 (which phrasing to use for the singular small-task canonical-sequence line)
**Must remain green:** (no test directly pins execute-write; AC-6.1 is the coverage gate)

**Files:**
- Modify: `skills/execute-write/SKILL.md`

One re-point only. No delete operations on this file. Clean category.

---

### Task 2 — Re-point + delete design-specify (entry path + stale template path + version bump)
**Type:** docs-producing
**Implements:** AC-1.2, AC-2.3, AC-5.1 (design-specify version v0003 → v0004)
**Decision budget:** 1 (whether the Reads section retains a one-line note about human-authored briefs after removing the large-task path, or becomes a single-path statement)
**Must remain green:** (no test directly pins design-specify alone; AC-6.1 covers)

**Files:**
- Modify: `skills/design-specify/SKILL.md`

**Category split reasoning:** AC-1.2 and AC-2.3 both touch design-specify, but they touch different locations — the entry condition / invoked-by (re-point) vs. the Reads section template path (delete). One file, two action categories, one task. This is acceptable because the net edit is coherent: the file ends with design-large-task completely absent and design-small-task present in the right locations. Splitting into two tasks would require two commits to the same file, which creates an intermediate red state (e.g., the entry condition is re-pointed but the stale Reads path survives a commit boundary). One task, one commit, category-coherent outcome.

The version bump belongs here because this task changes the contract text.

---

### Task 3 — Re-point + delete util-design-partner-role (intro line + capture-thought sentence + version bump)
**Type:** docs-producing
**Implements:** AC-1.5, AC-2.2, AC-5.1 (util-design-partner-role v0004 → v0005)
**Decision budget:** 1 (whether to replace the intro line with a single "design-small-task reads this file" statement or fold it into the description field only)
**Must remain green:** (no direct test pin; AC-6.1)

**Files:**
- Modify: `skills/util-design-partner-role/SKILL.md`

**Category split reasoning:** AC-1.5 is a re-point (intro line: "Both X and Y" → "design-small-task only"). AC-2.2 is a delete (capture-thought sentence, sole-actor mention of large-task behavior). These are different paragraphs in the same file, different categories, one task. Same reasoning as Task 2: coherent net edit, one commit, no intermediate red state.

---

### Task 4 — Re-point plan-build (sequence + cascade simplification + spec-compat note) + lockstep test-plan-build-heuristic + version bump
**Type:** docs-producing
**Implements:** AC-1.3, AC-4.1, AC-5.1 (plan-build v0005 → v0006)
**Decision budget:** 2 (cascade sentence rewrite: how to state the rule without the historical large-task clause; and spec-compat note: whether to name "human-authored brief" explicitly or just drop the section-count split)
**Must remain green:** `test-plan-build-heuristic` (this task edits it)

**Files:**
- Modify: `skills/plan-build/SKILL.md`
- Modify: `tests/test-plan-build-heuristic.sh`

**Lockstep enforcement:** The test pins plan-build. Both files change in the same task and same commit. The task cannot be split — editing plan-build without updating the test produces a red suite at commit boundary, violating the structural constraint in the spec.

**Note on the cascade line (AC-1.3):** The spec says this is a re-point (simplify — drop the large-task clause, keep the cascade rule). The surviving observable boundary is that `ground-truth` and `design-specify` remain present as the cascade concept. The test replacement assertion (drop the `grep -q "design-large-task"` block; add a check that the cascade concept survives via a grep for `ground-truth` and `design-specify`) must land in the same commit.

---

### Task 5 — Delete util-artifact-schema (producer entries + thinking/process rows + stamping entry) + lockstep test-artifact-schema + lockstep test-artifact-schema-provenance + version bump
**Type:** docs-producing
**Implements:** AC-2.1, AC-4.2, AC-4.3, AC-5.1 (util-artifact-schema v0002 → v0003)
**Decision budget:** 1 (whether the thinking/process rows get a "removed" comment or simply disappear — spec says delete, no historical narration in main body)
**Must remain green:** `test-artifact-schema`, `test-artifact-schema-provenance` (both pin util-artifact-schema; both update here)

**Files:**
- Modify: `skills/util-artifact-schema/SKILL.md`
- Modify: `tests/test-artifact-schema.sh`
- Modify: `tests/test-artifact-schema-provenance.sh`

**Lockstep enforcement:** Two tests pin this single file. Both must update in the same task and commit. Splitting would leave one test failing at a commit boundary.

**Category note:** This task is pure delete (AC-2.1) — no re-point. The design row's surviving producer (design-small-task) was already there; we're only removing the large-task half. The test updates drop design-large-task from loops but add nothing new. The category is clean: delete + test-lockstep.

**Special note on AC-4.3 version assertion:** test-artifact-schema-provenance asserts `version: v0002` currently. After this task bumps util-artifact-schema to v0003, the test's version assertion must also update to `v0003`. This is the only test where the version bump directly changes a test assertion — both changes must land in the same commit.

---

### Task 6 — Re-point + delete start-bootstrap (caller list + when-to-call re-point; session-meta prose delete) + version bump
**Type:** docs-producing
**Implements:** AC-1.4, AC-2.4, AC-5.1 (start-bootstrap v0002 → v0003)
**Decision budget:** 2 (how to restate the when-to-call list after large-task is gone: is design-small-task now "Always" or is it "when invoked by design-small-task or standalone"? And whether to simplify the session-meta prose to just "skillVersion (commit hash for `util-design-partner-role` SKILL.md)" or drop the hash note entirely)
**Must remain green:** (no direct test pin; AC-6.1)

**Files:**
- Modify: `skills/start-bootstrap/SKILL.md`

**Category split reasoning:** AC-1.4 (re-point the caller list/when-to-call) and AC-2.4 (delete the dead SKILL.md path from the session-meta prose) both touch start-bootstrap but at different locations. One task, one commit. Same reasoning as Tasks 2 and 3.

---

### Task 7 — Re-point util-worktree (Integration caller bullet) + version bump
**Type:** docs-producing
**Implements:** AC-1.6, AC-5.1 (util-worktree v0001 → v0002)
**Decision budget:** 0 (the surviving caller is design-small-task at Closure; this is a clear single substitution)
**Must remain green:** (no direct test pin; AC-6.1)

**Files:**
- Modify: `skills/util-worktree/SKILL.md`

Pure re-point. Clean category.

---

### Task 8 — Sync setup-start skill-index (AC-1.7 two-place sync)
**Type:** docs-producing
**Implements:** AC-1.7, AC-5.1 (setup-start v0001 → v0002)
**Decision budget:** 1 (the skill-index description for start-bootstrap currently omits the caller context; after start-bootstrap's description changes, the skill-index entry must match — needs a judgment call about how much detail to carry)
**Must remain green:** (no direct test pin; AC-6.1)

**Files:**
- Modify: `skills/setup-start/SKILL.md` (version bump)
- Modify: `skills/setup-start/references/skill-index.md` (updated start-bootstrap entry)

**Note:** The spec says "setup-start — increment by one from its current value (confirm current at implementation)." Current value is v0001; bump to v0002. The skill-index.md entry for start-bootstrap (line 25) currently reads "Mechanical session setup: config, sprint naming, dir creation, task reset, thinking history" with no caller mention — it does not currently say "Called by design-large-task." So the two-place sync for start-bootstrap only needs to update if the start-bootstrap description frontmatter changes the content of its description field (not just drop design-large-task from the body). The skill-index entry for design-specify (line 28) is also not affected since it already has no design-large-task mention.

**Implementation check required:** before this task executes, verify what the updated start-bootstrap description field says (Task 6 determines this), then sync the skill-index to match.

---

### Task 9 — Delete-only files (design-brief-small-template, record-formats, fork-policy) + archive agent + archive test-ac-4-1 + version bump execute-write
**Type:** docs-producing
**Implements:** AC-2.5, AC-2.6, AC-2.7, AC-3.1, AC-4.4, AC-5.1 (execute-write v0007 → v0008)
**Decision budget:** 2 (design-brief-small-template upsize block: delete without replacement — see pragmatist peer Q&A below; and whether the archived-template reference in lines ~138-139 stays as a "see historical template" note or is fully removed)
**Must remain green:** `test-ac-4-1-fork-policy-pole-rows` is being archived; the archive removes it from the suite, so it can no longer fail. AC-6.1 verifies the suite passes without it.

**Files:**
- Modify: `skills/design-small-task/references/design-brief-small-template.md`
- Modify: `skills/finish-write-records/references/record-formats.md`
- Modify: `docs/fork-policy.md`
- Move: `agents/agent-industry-explorer.md` → `_archive/design-large-task/agent-industry-explorer.md`
- Move: `tests/test-ac-4-1-fork-policy-pole-rows.sh` → `_archive/design-large-task/tests/test-ac-4-1-fork-policy-pole-rows.sh`
- Modify: `skills/execute-write/SKILL.md` (version bump only — no body changes in this task, the body change was Task 1)

**Wait — version bump conflict check:** Task 1 (re-point execute-write body) and Task 9 (execute-write version bump) both touch execute-write/SKILL.md. These must be the same task, not two. See correction below under "Task boundary corrections."

**Task 9 revised (without execute-write version):** execute-write's version bump belongs in Task 1 since Task 1 makes the body change.

**Implements (revised):** AC-2.5, AC-2.6, AC-2.7, AC-3.1, AC-4.4
**Files (revised):**
- Modify: `skills/design-small-task/references/design-brief-small-template.md`
- Modify: `skills/finish-write-records/references/record-formats.md`
- Modify: `docs/fork-policy.md`
- Move: `agents/agent-industry-explorer.md` → `_archive/design-large-task/agent-industry-explorer.md`
- Move: `tests/test-ac-4-1-fork-policy-pole-rows.sh` → `_archive/design-large-task/tests/test-ac-4-1-fork-policy-pole-rows.sh`

**Category integrity:** This task bundles three deletes, one archive move (agent), one test archive move. The agent and test-archive moves are both AC-3.x and AC-4.x category — they are distinct from the deletes but all land cleanly here because none of these files overlap with each other or with other tasks. The fork-policy delete (AC-2.7) and the test-ac-4-1 archive (AC-4.4) are tightly coupled: the test pins the rows, the rows are deleted, the test must leave the suite simultaneously. Same-task, same-commit enforces this.

---

### Task 10 — Deliberate rewrite docs/instructions.md
**Type:** docs-producing
**Implements:** AC-2.8
**Decision budget:** 3 (how much of the design section to rewrite vs. prune; whether design-figure-out gets a brief mention as a historical fallback or disappears entirely; how to describe the surviving pipeline without implying design-small-task feeds plan-build directly — the spec correction says it feeds design-specify first)
**Must remain green:** (no direct test pin; AC-6.1)

**Files:**
- Modify: `docs/instructions.md`

Standalone rewrite task. The spec says "rewrite the section as current-state rather than scrubbing line by line." High decision budget because the content is prose-heavy and the rewrite scope is broad (the whole design section, comparison table, pipeline diagram). This task goes last so the implementer has all the other changes settled as ground truth before writing the current-state description.

### Task 11 — Sprint capstone: verify suite green (AC-6.1)
**Type:** config-producing (verification-only)
**Implements:** AC-6.1
**Decision budget:** 0
**Must remain green:** all tests in `tests/test-*.sh`

**Files:** none modified
**Steps:** run the full suite, confirm zero failures attributable to this sprint.

---

## 2. Task Boundary Corrections (self-audit)

During task design I caught one boundary error:

- **execute-write version bump** belongs in Task 1 (body change is there), not Task 9. A version bump without a corresponding body change in the same commit would be a spurious bump. Conversely, a body change without a version bump violates the skill-versioning rule. Task 1 must include both the body edit (AC-1.1) and the version bump (AC-5.1 for execute-write).

Corrected Task 1 Implements: AC-1.1, AC-5.1 (execute-write v0007 → v0008).

---

## 3. AC → Task Coverage Map

| AC | Task | Action category |
|----|------|----------------|
| AC-1.1 | Task 1 | Re-point |
| AC-1.2 | Task 2 | Re-point |
| AC-1.3 | Task 4 | Re-point (simplify) |
| AC-1.4 | Task 6 | Re-point |
| AC-1.5 | Task 3 | Re-point |
| AC-1.6 | Task 7 | Re-point |
| AC-1.7 | Task 8 | Re-point (sync) |
| AC-2.1 | Task 5 | Delete |
| AC-2.2 | Task 3 | Delete |
| AC-2.3 | Task 2 | Delete |
| AC-2.4 | Task 6 | Delete |
| AC-2.5 | Task 9 | Delete (rewrite) |
| AC-2.6 | Task 9 | Delete |
| AC-2.7 | Task 9 | Delete |
| AC-2.8 | Task 10 | Delete (rewrite) |
| AC-3.1 | Task 9 | Archive |
| AC-4.1 | Task 4 | Test-lockstep |
| AC-4.2 | Task 5 | Test-lockstep |
| AC-4.3 | Task 5 | Test-lockstep |
| AC-4.4 | Task 9 | Test-lockstep (archive) |
| AC-5.1 (execute-write) | Task 1 | Version bump |
| AC-5.1 (design-specify) | Task 2 | Version bump |
| AC-5.1 (util-design-partner-role) | Task 3 | Version bump |
| AC-5.1 (plan-build) | Task 4 | Version bump |
| AC-5.1 (util-artifact-schema) | Task 5 | Version bump |
| AC-5.1 (start-bootstrap) | Task 6 | Version bump |
| AC-5.1 (util-worktree) | Task 7 | Version bump |
| AC-5.1 (setup-start) | Task 8 | Version bump |
| AC-6.1 | Task 11 | Suite gate |

**Coverage check:** all 24 ACs have at least one task home. No orphan ACs. No orphan tasks (every task implements at least one AC).

**AC-5.1 is one AC with 8 version-bump instances** — each file's bump rides with the task that makes that file's body change. The coverage map above expands the sub-instances for clarity; the spec's AC-5.1 is a single criterion with observable boundaries for all eight files.

---

## 4. Category Integrity Analysis — Files with Mixed Operations

Three files get both a re-point and a delete. The Purist concern is that these must not blur "drop dead member from a list" (re-point) with "delete sole-actor mention" (delete). Here is the defense for each:

### design-specify (Tasks 2): AC-1.2 re-point + AC-2.3 delete

- **AC-1.2 locations:** description field (line 3), entry condition (line 18), standalone note (line 48), invoked-by (line 237). In each: design-large-task appears paired with design-small-task. Drop the dead member; the small-task half survives. Re-point.
- **AC-2.3 location:** Reads section (lines ~233–235). The large-task template path `../design-large-task/references/design-brief-template.md` is the only entry for that path. No surviving skill owns that template. Delete the path. The small-task template path stays. This is not a paired-mention drop — it is a sole-actor reference (this specific file path, tied to this specific skill's template) that is deleted.

These are distinct edits at distinct locations. The net file state: design-large-task entirely absent, design-small-task present in the re-pointed locations AND in the surviving Reads path. The observable boundaries for AC-1.2 (small-task present in description/entry/standalone/invoked-by) and AC-2.3 (large-task template path absent, small-task template path present) are independently checkable.

### util-design-partner-role (Task 3): AC-1.5 re-point + AC-2.2 delete

- **AC-1.5 location:** intro line (line 9). "Both X and Y read this file" → "design-small-task reads this file." Drop the dead member. Re-point.
- **AC-2.2 location:** private-precision note (line ~96). "design-large-task captures private precision via capture_thought with tag private-precision." No surviving skill does this. Delete the sentence. Nothing substituted.

Different sentences, different paragraphs, different categories. The private-precision sentence is sole-actor (only design-large-task had a capture_thought discipline with this tag); the intro line was paired. Distinct locations, distinct categories, clean split in one task.

### start-bootstrap (Task 6): AC-1.4 re-point + AC-2.4 delete

- **AC-1.4 locations:** description field + When to Call list. Both listed design-large-task as the always-caller. Drop the dead member; design-small-task takes the role. Re-point.
- **AC-2.4 location:** session-meta prose (line ~92). "skillVersion (commit hashes for `util-design-partner-role` and `design-large-task` SKILL.md files)." This is a prose description of a script's behavior that named a file that no longer exists. The surviving prose drops the large-task SKILL.md mention; util-design-partner-role reference survives. This is a sole-actor reference (the script tracked large-task's version specifically) being deleted from the prose. Delete, not re-point — design-small-task does not replace the hash; the field is deprecated for that skill.

Observable boundaries: AC-1.4 checks description + when-to-call (design-small-task present as caller); AC-2.4 checks the session-meta prose (design-large-task SKILL.md mention absent, util-design-partner-role mention present). Independently checkable. Distinct categories.

---

## 5. Two-Part Observable Boundary — Re-point Verification

Every re-point task's verification must carry both greps: (1) design-large-task absent AND (2) design-small-task present. Checking only absence would pass even if the re-point edit was accidentally omitted (design-small-task was already present in most of these files).

Per-task check:

| Task | File | Absence grep | Presence grep |
|------|------|-------------|--------------|
| Task 1 | execute-write/SKILL.md | `grep -c design-large-task` → 0 | `grep -c design-small-task` → ≥ 1 |
| Task 2 | design-specify/SKILL.md | `grep -c design-large-task` → 0 | `grep -c design-small-task` → ≥ 1 |
| Task 3 | util-design-partner-role/SKILL.md | `grep -c design-large-task` → 0 | `grep -c design-small-task` → ≥ 1 |
| Task 4 | plan-build/SKILL.md | `grep -c design-large-task` → 0 | `grep -c design-small-task` → ≥ 1 |
| Task 6 | start-bootstrap/SKILL.md | `grep -c design-large-task` → 0 | `grep -c design-small-task` → ≥ 1 |
| Task 7 | util-worktree/SKILL.md | `grep -c design-large-task` → 0 | `grep -c design-small-task` → ≥ 1 |
| Task 8 | setup-start/references/skill-index.md | `grep -c design-large-task` → 0 | (no design-small-task presence check needed — setup-start does not enumerate callers) |

Note on Task 8: setup-start/skill-index.md already has zero design-large-task references; the change is to update the start-bootstrap and design-specify description entries. The presence check is "the entry matches the updated description" — not a design-small-task grep, because skill-index doesn't enumerate caller skill names. The observable boundary for AC-1.7 is: `grep -c design-large-task skills/setup-start/SKILL.md` → 0 AND the start-bootstrap/design-specify entries in skill-index.md match their updated description fields (verifiable by reading both and comparing).

---

## 6. Task Ordering — No Red Suite Between Commits

Recommended commit order:

1. Task 5 first: util-artifact-schema + both pinning tests. This resolves the two test-loop entries early.
2. Task 4: plan-build + heuristic test. Resolves the third pinning test.
3. Task 9: fork-policy delete + test-ac-4-1 archive + agent archive + design-brief-small-template + record-formats.
4. Tasks 1, 2, 3, 6, 7, 8 in any order — none have pinning tests, none depend on each other's output.
5. Task 10: instructions.md rewrite last — it is prose-heavy and should describe the system after all skill edits are settled.
6. Task 11: suite verification after all commits land.

The ordering constraint is only: test-lockstep tasks (4, 5, 9) must land with their corresponding file edits. Within that constraint, the docs-only tasks are order-independent.

---

## 7. Peer Question — Pragmatist Q&A (resolved)

Asked pragmatist: which surviving skill to name in the design-brief-small-template upsize block — design-committee, design-grillme, or a condition.

**Pragmatist answer:** Neither is the right substitute. design-grillme is a stress-test interview for a plan the user already has; design-committee is a consultation primitive for a specific architectural question. Neither serves as a design entry point for "this task is too complex for design-small-task." The original upsize pointer's role has no surviving equivalent. Pragmatist position: delete the upsize block without a replacement sentence — an absent pointer is honest; a wrong pointer creates confusion. If the designer wants a replacement, they decide during execution review, not during planning.

**Verified against skill descriptions:** confirmed correct. design-grillme description reads "Interview the user relentlessly about a plan or design until reaching shared understanding." design-committee description reads "process-agnostic primitive... for meta-architecture, cross-cutting design choice, charter call." Neither is an entry-point design skill.

**Impact on Task 9:** the upsize block is deleted, not rewritten to name another skill. The decision budget for this file drops from 2 to 1 (only the archived-template reference at lines ~138-139 remains ambiguous). The implementer does not choose a replacement destination — they delete the block and leave a one-line gap comment for designer review.

**Impact on AC-2.5 observable boundary:** the observable boundary (`grep -q "design-large-task/references" skills/design-small-task/references/design-brief-small-template.md` exits non-zero) is unchanged. The absence check is still the right test; the absence is now achieved by deletion rather than replacement.

---

## Change log

- 2026-06-05 — Round 03 position written. Ten tasks proposed (plus Task 11 capstone). AC-trace coverage complete: 24 ACs, no orphans. Version bump assignments corrected (execute-write bump moved to Task 1 after self-audit catches split boundary error). Category integrity defended for three mixed-operation files. Two-part presence/absence observable boundary documented per task.
- 2026-06-05 — Pragmatist peer Q&A resolved: design-brief-small-template upsize block deleted without replacement — neither design-committee nor design-grillme fills the role. Task 9 decision budget reduced from 2 to 1. Verified against actual skill descriptions.
