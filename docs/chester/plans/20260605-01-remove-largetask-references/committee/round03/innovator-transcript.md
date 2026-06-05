# Innovator Transcript — Round 03 (Plan Develop)

**Committee:** design-committee, remove-largetask-references
**Date:** 2026-06-05
**Dimension:** Decomposition shape, TDD framing, YAGNI check

---

## The Three Candidate Shapes

**By-AC (24 tasks)** — one task per acceptance criterion. Too fine. Most ACs take two minutes to implement; dispatching a fresh subagent per AC is overhead that produces no additional review value. AC-1.1 (execute-write re-point) and AC-4.1 (its pinning test) are coupled: the spec requires them to land in the same change. Treating them as separate tasks violates that constraint unless the plan explicitly orders them adjacently with no commit between them — but at that point you have lost the "one commit per task" discipline the plan template enforces.

**By-file (12+ tasks)** — one task per touched file. More natural for implementation, but breaks the lockstep pairing problem directly. The spec's primary structural constraint is that each scrub file and its pinning test change in the same commit. A by-file plan produces task N (scrub plan-build) and task N+7 (edit the heuristic test) as separate tasks with separate commits. The suite goes red between N and N+7. This is exactly the failure mode the spec calls a structural constraint to prevent.

**By-commit-unit (preferred)** — cluster the scrub file(s) and their pinning test (if one exists) into one task, one commit. This is the natural unit for this sprint because the invariant is at the commit level: the suite must be green at every commit boundary. The commit unit defines what "safe" means; the task boundary should match it.

---

## Proposed Decomposition: By Commit Unit

Ten tasks. Every task is one commit. Suite green after every task.

The key insight: three of the four pinning tests must be edited in the exact same change as their paired file scrub. That pairing drives three "bundled" tasks (one file scrub + one test edit = one commit). The fourth test (AC-4.4) is an archive move — it can travel alone since archiving it only removes a test from the suite, never breaks one. The remaining file scrubs and the version bumps are small enough to group by thematic affinity without risking cross-file ordering hazards.

### Task 1 — Scrub util-artifact-schema + lockstep test-artifact-schema + lockstep test-artifact-schema-provenance

Three files, one commit. The two provenance tests both pin the schema, so they must travel with it. The version bump on util-artifact-schema rides this task — the provenance test asserts the version number, so the bump and the test version-assertion update must be co-committed.

**Type:** docs-producing  
**Implements:** AC-2.1, AC-4.2, AC-4.3, AC-5.1 (util-artifact-schema bump)  
**Decision budget:** 1 (which producer rows to keep — spec is explicit, but implementer must read current file to confirm line numbers)  
**Must remain green:** test-artifact-schema, test-artifact-schema-provenance

TDD shape: the "failing test" is running the two tests now and confirming they reference design-large-task (they do — confirmed by grep in prior rounds). Edit the schema (remove producer rows, stamping entry), edit both tests (drop design-large-task from loops, update version assertion to v0003), run both tests → exit 0, commit.

---

### Task 2 — Scrub plan-build + lockstep test-plan-build-heuristic

Two files, one commit. The heuristic test greps plan-build for design-large-task in cascade context; the plan-build scrub removes those mentions; both must land together.

**Type:** docs-producing  
**Implements:** AC-1.3, AC-4.1, AC-5.1 (plan-build bump)  
**Decision budget:** 1 (the cascade sentence rewrite — replace the large-task clause, keep the cascade rule; the spec says "rewrite to one sentence keeping the rule" but the implementer decides the exact wording)  
**Must remain green:** test-plan-build-heuristic

TDD shape: run test now → passes (large-task still present). Plan-build scrub: drop canonical-sequence large-task member, rewrite cascade sentence (design-specify as source, drop the "design-large-task no longer produces" historical narration), simplify spec-compat note to name design-small-task and human-authored specs only. Remove the cascade assertion block from the test (lines ~63–68). Run test → exit 0. Commit.

---

### Task 3 — Scrub fork-policy + archive test-ac-4-1

Two files, one commit. Deleting the step-b rows in fork-policy breaks the ac-4-1 test on its next run; archiving the test simultaneously keeps the suite green.

**Type:** docs-producing  
**Implements:** AC-2.7, AC-4.4  
**Decision budget:** 0 (the spec is explicit: delete rows 1a–1g, move the test file — no decisions)  
**Must remain green:** (no surviving test pins fork-policy after this task)

TDD shape: run test-ac-4-1 now → passes (step-b rows still present). Delete fork-policy rows 1a–1g. Move test file to _archive/design-large-task/tests/. Verify test-ac-4-1 is absent from tests/; verify fork-policy has no step-b rows. Verify full suite (minus test-ac-4-1) still passes. Commit.

---

### Task 4 — Scrub execute-write

One file, one commit. No pinning test directly checks execute-write for design-large-task content. The version bump rides this task.

**Type:** docs-producing  
**Implements:** AC-1.1, AC-5.1 (execute-write bump)  
**Decision budget:** 0 (the worktree-creation sentence and canonical-sequence mention are explicit; the wording is straightforward substitution)  
**Must remain green:** (no test pins this file for design-large-task content)

TDD shape: grep execute-write for design-large-task → nonzero. Edit §1.2 Verify Worktree to name design-small-task as the upstream creator; drop large-task from the canonical-sequence parenthetical. Bump version v0007 → v0008. Grep → 0. Run full suite → green. Commit.

---

### Task 5 — Scrub design-specify + sync setup-start (design-specify entry)

Two files, one commit. design-specify's description change triggers the two-place-sync rule: setup-start's available-skills list entry for design-specify must update in the same commit.

**Type:** docs-producing  
**Implements:** AC-1.2, AC-1.7 (design-specify half), AC-2.3, AC-5.1 (design-specify bump)  
**Decision budget:** 1 (the Reads section rewrite — drop dead large-task template path, keep small-task path; the exact prose around it may need minor adjustment)  
**Must remain green:** (no test pins design-specify for design-large-task content)

TDD shape: grep design-specify and setup-start for design-large-task → nonzero. Edit design-specify (description, entry condition, standalone note, invoked-by, Reads dead path). Sync setup-start's design-specify entry to match new description. Bump design-specify v0003 → v0004. Grep both → 0. Run full suite → green. Commit.

---

### Task 6 — Scrub start-bootstrap + sync setup-start (start-bootstrap entry)

Two files, one commit. Same two-place-sync rule: start-bootstrap's description change must sync to setup-start in the same commit.

**Type:** docs-producing  
**Implements:** AC-1.4, AC-1.7 (start-bootstrap half), AC-2.4, AC-5.1 (start-bootstrap bump)  
**Decision budget:** 1 (the when-to-call rewrite — the spec says design-small-task is the always-caller, design-specify and execute-write are standalone callers; the exact wording of the "When to Call" section needs judgment)  
**Must remain green:** (no test pins start-bootstrap for design-large-task content)

TDD shape: grep start-bootstrap and setup-start for design-large-task → nonzero. Edit start-bootstrap (description caller list, when-to-call section, session-meta prose removing the dead skill-version hash description). Sync setup-start's start-bootstrap entry to match new description. Bump start-bootstrap v0002 → v0003. Grep both → 0. Run full suite → green. Commit.

---

### Task 7 — Scrub util-design-partner-role

One file, one commit. Two edits: intro line (re-point) and capture-thought sentence (delete). The version bump rides this task.

**Type:** docs-producing  
**Implements:** AC-1.5, AC-2.2, AC-5.1 (util-design-partner-role bump)  
**Decision budget:** 0 (both edits are explicit in the spec; intro line rewrite is substitution; capture-thought sentence deletion is straightforward)  
**Must remain green:** (no test pins this file for design-large-task content)

TDD shape: grep util-design-partner-role for design-large-task → nonzero (3 lines). Edit line 3 (description), line 9 (intro), delete line 96 (capture-thought sentence). Bump v0004 → v0005. Grep → 0. Run full suite → green. Commit.

---

### Task 8 — Scrub util-worktree + design-small-task/references + finish-write-records/references

Three files, one commit. None has a pinning test. Grouping by "small standalone deletes" — each edit is one line or one block, low ordering hazard, version bumps apply.

**Type:** docs-producing  
**Implements:** AC-1.6, AC-2.5, AC-2.6, AC-5.1 (util-worktree bump)  
**Decision budget:** 1 (AC-2.5 says replace the upsize block with a one-line pointer to design-committee / design-grillme — the implementer must decide the exact wording of that pointer)  
**Must remain green:** (no test pins any of these files for design-large-task content)

TDD shape: grep all three files for design-large-task → nonzero. Remove util-worktree integration bullet for design-large-task (line ~199); bump util-worktree v0001 → v0002. Remove design-brief-small-template upsize block (lines ~20–24) and update the archived-template reference. Remove finish-write-records/record-formats stage-enum entry. Grep all three → 0. Run full suite → green. Commit.

---

### Task 9 — Archive agent-industry-explorer

One file move, one commit. A git mv within the worktree.

**Type:** docs-producing  
**Implements:** AC-3.1  
**Decision budget:** 0 (spec is exact: move agents/agent-industry-explorer.md → _archive/design-large-task/agent-industry-explorer.md)  
**Must remain green:** (no test references this file)

TDD shape: `[ -f agents/agent-industry-explorer.md ]` → true now. `git mv agents/agent-industry-explorer.md _archive/design-large-task/agent-industry-explorer.md`. `[ ! -f agents/agent-industry-explorer.md ]` → true. `[ -f _archive/design-large-task/agent-industry-explorer.md ]` → true. Run full suite → green. Commit.

---

### Task 10 — Rewrite docs/instructions design section + sprint capstone

One file rewrite, one commit, then the full suite sweep.

**Type:** docs-producing  
**Implements:** AC-2.8, AC-6.1  
**Decision budget:** 2 (the rewrite must accurately describe the current pipeline without referencing removed skills; the exact shape of the design section and comparison-table replacements requires judgment about what to keep and what to drop; 25 large-task hits + 17 figure-out hits across many sections means non-trivial structural decisions)  
**Must remain green:** full suite

TDD shape: `grep -c design-large-task docs/instructions.md` → 25. `grep -ci "design-figure-out\|DFO" docs/instructions.md` → 17. Rewrite the design section, comparison-table rows, and pipeline mentions as current-state (design-small-task as sole design entry feeding design-specify, not plan-build directly). Grep both → 0. Run full suite → 0 failures attributable to this sprint. Commit.

This is the highest-budget task and also the sprint capstone — the AC-6.1 suite sweep runs here, after all prior commits have landed.

---

## Why This Shape

Ten tasks is not the minimum possible (you could pack more into Task 8 or 9) but it is the right grain size for plan-build's five-step TDD discipline:

- Every task has a concrete "failing test" (a grep that returns nonzero now and must return zero after) — the TDD framing holds even for docs edits.
- Every task's "failing test" matches its "must remain green" constraint: the pinned tests (Tasks 1, 2, 3) travel with their file edits; the standalone edits (Tasks 4–9) are verified by grep + suite sweep.
- No commit boundary leaves the suite red. This is the structural invariant from the spec; the task grouping directly enforces it.
- No task bundles unrelated files that could independently fail. Task 8 groups three files with zero ordering hazard (each is a small standalone delete); Tasks 1–3 group files that are causally coupled by the test constraint.
- The highest-decision-budget task (Task 10) is last, after all mechanically-checkable changes are locked in. This is the right ordering: the implementer has the full committed scrub as context when rewriting instructions.md.

---

## TDD Shape for Docs/Test Refactors

The five-step template still works; the test primitive changes:

```
Step 1: Write the failing test
  → Run: grep -c design-large-task <file>
  → Expected: N (nonzero — the reference still exists)

Step 2: Run test to verify it fails
  → Confirm: N > 0

Step 3: Write minimal implementation
  → Make the edit (re-point, delete, rewrite, archive)

Step 4: Run test to verify it passes
  → Run: grep -c design-large-task <file>
  → Expected: 0
  (For pinning tests: bash tests/test-NAME.sh → exit 0)

Step 5: Commit
  → git add <exact files>; git commit -m "..."
```

Where a real pinning test exists (Tasks 1, 2, 3), Step 1 is running the actual test script now and confirming it passes (it pins the presence of the reference). After the edit, Step 4 is running the script again and confirming it exits 0. This is a genuine red-green cycle: the test starts green (it was green because the reference was present), the edit temporarily breaks it, the test edit restores green. The two edits travel in the same commit, so the "temporary red" never hits the repo.

---

## YAGNI Check

The shape above introduces no structural novelty. No new grouping categories, no meta-tasks, no "prepare the ground" tasks. Every task produces a directly observable outcome (grep count drops to zero, test exits 0, file moves). The one place where over-engineering tempts: Task 8 could be split into three separate tasks (one per file). That would produce more granular commits but no additional safety — none of the three files in Task 8 has ordering dependencies on the others or on any test. The grouping saves three commits with no correctness cost. That is the right call.

---

## Peer DM — and Pragmatist's Reply

Sent to pragmatist: does Task 10 scope mean section-level rewrite wherever a hit appears, or is a one-line substitution acceptable in sections that are otherwise accurate?

**Pragmatist reply (after reading instructions.md in full):** Four hit zones, each with its own treatment — no uniform "rewrite section end-to-end" rule needed.

- Zone 1 — inline list entries (lines ~31, 168, 211): one-word or one-name removal in an otherwise-accurate section. One-line substitution acceptable.
- Zone 2 — MCP install blocks (lines ~83–109, 133–135): dead setup prose for removed skills. Delete the whole block, no substitute. Removal leaves the install checklist accurate for surviving skills.
- Zone 3 — full skill description sections (lines ~219–247 design-large-task, lines ~273–295 design-figure-out): remove entire `###` sections including header, body, tips, and `---` separator. Block delete, not line-by-line scrubbing.
- Zone 4 — comparison table (lines ~697–703) and reference table (lines ~736–754): remove rows for design-large-task and design-figure-out. Surviving rows stay unchanged.

**Consequence for Task 10:** Decision budget corrected to 3 (not higher). The ambiguity is zone-boundary identification — the implementer must read the full file to locate where each zone starts and ends, then apply the right treatment per zone. No prose reconstruction needed. The spec's "deliberate rewrite" label was slightly strong; "four-zone targeted deletion" is more accurate.

---

## Summary

- Decomposition shape: by-commit-unit (ten tasks). Neither by-AC (too fine, violates lockstep) nor by-file (breaks the lockstep pairing constraint) is correct.
- The lockstep constraint — suite green at every commit — is the governing invariant. Three tasks bundle a file scrub with its pinning test; the rest are small enough to group by thematic affinity.
- TDD framing: grep-count-goes-to-zero is the failing/passing test for every docs edit. Where a real pinning test exists, it is the actual failing/passing test. The five-step shape holds throughout.
- Task 10 decision budget: 3. Four hit zones in instructions.md, each with a distinct treatment (one-line removal / block delete / section delete / table-row removal). The implementer reads the file, identifies zone boundaries, applies the right treatment per zone. No free-form prose reconstruction.
- No invented structure. YAGNI satisfied.
