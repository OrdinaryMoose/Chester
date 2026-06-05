# Pragmatist Position — Round 01

**Sprint:** 20260605-01-remove-largetask-references
**Role:** Pragmatist
**Question:** What rule governs each of the twelve live references — delete outright or re-point — and how do the four pinning tests move in lockstep?

---

## Grounding

Read all twelve files and all four tests before writing this position. The analysis
is anchored to actual file content, not assumptions from the brief.

---

## The Core Rule

The scrub has two populations, not one:

- **Dead-end mentions** — the name appears and removing it leaves the sentence still true, complete, and useful. Delete.
- **Sequence mentions** — the name appears as one half of a canonical path that still exists in the other half. Re-point to `design-small-task`.

That boundary resolves all twelve cases without requiring judgment on each file individually.

---

## Per-File Classification

### Delete outright (nine files)

**`skills/start-bootstrap/SKILL.md`**
- The frontmatter description says "Called by design-large-task and execute-write (standalone)."
- The `When to Call` body section repeats "Always: design-large-task (starts fresh sprints)."
- `design-small-task` also calls `start-bootstrap`. Removing `design-large-task` from both places and adding `design-small-task` is the correct fix — but "delete" in the sense of removing the stale name. Replace with `design-small-task`.
- Net: **re-point**, not pure delete. One-word swap in frontmatter description + one-word swap in the body list.

**`skills/execute-write/SKILL.md`** (line 23)
- "the worktree is created upstream during the design phase (by `design-large-task` at Archival or `design-small-task` at Closure)"
- `design-large-task` is gone. The surviving half of the parenthetical is true. Delete the `design-large-task` clause, leave `design-small-task`.
- Net: **delete the stale clause**, sentence stays true.

**`skills/util-design-partner-role/SKILL.md`** (line 9)
- "Both `design-large-task` and `design-small-task` read this file."
- Delete `design-large-task` from the intro; sentence still names the one skill that actually reads it.
- Net: **delete**.

**`skills/util-worktree/SKILL.md`** — brief mentions design-large-task in usage context.
- Same pattern: design-small-task is the surviving caller. Delete stale name, leave surviving caller.
- Net: **delete**.

**`skills/finish-write-records/references/record-formats.md`** — the decision record `stage` field includes `design-large-task` in its enumerated values.
- Remove `design-large-task` from the stage enum. `design-small-task` stays.
- Net: **delete from enum**.

**`agents/agent-industry-explorer.md`** — the description says "Used by design-large-task during Phase 2."
- The agent is now only used by `design-small-task` (or would be, if it is). Verify actual caller before deleting — but the removal is a description update, not a behavior change.
- Net: **re-point description** to `design-small-task`.

**`docs/instructions.md`** — multiple references across skill listing, installation, and the "when to use" table.
- The section `design-large-task` as a skill listing is describing a removed skill. Those rows/sections should be removed entirely. References to it as a fallback or comparison point likewise delete or re-point.
- Net: **mixed delete + re-point** depending on sentence. No single sentence is hard.

### Re-point (two files with load-bearing sequence text)

**`skills/plan-build/SKILL.md`**
- Three references found:
  1. Task reset comment: "If any tasks exist from a previous skill (e.g., design-large-task)" — **delete**, example still works without it.
  2. Context line: "created by `design-large-task` or `design-small-task` during their Archival / closure stage" — **delete the large-task half**, leave small-task.
  3. Scope-check paragraph: "design-large-task's proof loop, or design-small-task's conversation" — **delete the large-task half**.
  4. Integration section: "Spec compatibility: reads spec documents written by design-specify, regardless of whether the upstream brief came from `design-large-task` (nine-section) or `design-small-task` (six-section)" — this is technically accurate (design-specify normalizes both) but `design-large-task` no longer produces briefs. **Re-point**: drop the parenthetical "(nine-section)" claim that names the removed skill; keep the spirit ("regardless of brief origin, design-specify normalizes into the spec contract").
  5. Ground-truth cascade section: "`design-large-task` no longer produces a design-stage ground-truth report" — this is historically accurate but describes a removed skill's former behavior. **Delete** this sentence; it's commentary on a decision that's now moot.
- **Critical:** the pinning test (`test-plan-build-heuristic`) checks `grep -q "design-large-task" "$SKILL"`. This test must be updated to remove that assertion. The test's actual purpose is to verify the cascade and invocation structure — the `design-large-task` grep was incidentally verifying that the cascade commentary was still present. The test should be updated to verify the surviving structure without requiring the removed name.

**`skills/util-artifact-schema/SKILL.md`**
- Artifact table: `design-large-task (8-section envelope)` in the "Produced by" column for `design` artifact type.
- Stamping skills list: `design-large-task` listed as a stamping skill.
- Both the `test-artifact-schema` test and `test-artifact-schema-provenance` test explicitly `grep -q "design-large-task"` to verify it is present in the producer list and stamping-skill list.
- **The right call:** Remove `design-large-task` from both the producer list and the stamping-skill list. Move it to a brief historical note or simply drop it — artifacts produced by the removed skill already carry `produced-by design-large-task@vNNNN` in their trailers; the schema does not need to name the producer for those trailers to remain valid. The provenance chain in archived artifacts is self-contained. Removing from the live schema does not break archived artifacts.
- **Both pinning tests must be updated** to remove the `grep -q "design-large-task"` assertion for the producer list and stamping-skill list.

### Delete entirely (one file's rows)

**`docs/fork-policy.md`** — rows 1a through 1g are all `design-large-task` dispatch sites.
- These rows describe dispatches from a removed skill. The dispatches no longer exist. The rows should be removed entirely.
- **`test-ac-4-1-fork-policy-pole-rows`** greps for `chester:design-large-task-step-b-{pole}` in the policy. When the rows are removed, this test fails. The test must be updated — either removed, or redirected to verify that `design-committee` poles (the live equivalent) are documented. Assumption: `design-committee` already has its own poles in `agents/`. The test's purpose was to verify the framing-side dispatch sites are documented; that purpose survives by verifying the committee poles instead.

**`skills/design-specify/SKILL.md`**
- Entry condition: "A design brief from `design-large-task` or `design-small-task`..."
- Integration section: "Invoked by: `design-large-task` or `design-small-task`..."
- Integration section also reads: "Reads... `../design-large-task/references/design-brief-template.md` (9-section envelope...)"
- The "Invoked by" line: **re-point** to `design-small-task` only.
- The entry condition: **re-point** to `design-small-task` only.
- The "Reads" reference to the large-task brief template: **delete** — the template directory no longer exists in live skills, and design-specify normalizes all brief formats anyway.

---

## The Four Tests — Lockstep Changes

### `test-plan-build-heuristic`

Current failing assertion: `grep -q "design-large-task" "$SKILL"`.
Fix: Remove this one assertion. The test's other assertions (ground-truth cascade, smell heuristic, invocation by design-specify) all survive. The test remains meaningful.

### `test-artifact-schema`

Current failing assertion: `grep -q "design-large-task"` in the producer loop.
Fix: Remove `design-large-task` from the producer loop. The test's purpose is to verify canonical producers are listed — the producer list after scrub is `design-small-task`, `design-specify`, `plan-build`, `execute-write`, `finish-write-records`. Update the loop to match.

### `test-artifact-schema-provenance`

Current failing assertion: `grep -q "design-large-task"` in the stamping-skill list check (step 5).
Fix: Remove `design-large-task` from the `for skill in ...` loop. The surviving stamping skills (`design-small-task`, `design-specify`, `plan-build`, `execute-write`, `finish-write-records`) remain in the assertion.

### `test-ac-4-1-fork-policy-pole-rows`

Current failing assertions: all four `grep -F "chester:design-large-task-step-b-{pole}"` calls.
Fix: The test must pivot. Two options:
- (a) Delete the test entirely — it documented dispatch sites for a removed skill, and there is no direct structural equivalent to assert.
- (b) Redirect it to verify that `design-committee` poles are documented in `docs/fork-policy.md` — if the committee's pole-agent dispatches are already in the policy table, the test survives with updated grep targets.
- **Pragmatist recommendation: option (b) if committee poles are in fork-policy.md; option (a) if they are not.** Do not add committee poles to fork-policy just to make the test pass — the tail wags the dog. Verify first; delete if not there.

---

## The Single Rule

> For each reference: if removing the name leaves the claim complete and true with `design-small-task` as the surviving entry point, re-point. If the entire sentence or row exists only because the removed skill existed, delete.

This rule is consistent, applies mechanically to all twelve, and closes the scrub in one sprint.

---

## Version Bumps

Every SKILL.md whose body text changes gets a version bump. Affected skills:
- `plan-build` — multiple body changes
- `util-artifact-schema` — producer list + stamping list
- `design-specify` — entry condition + integration section
- `util-design-partner-role` — intro line
- `start-bootstrap` — description + When to Call
- `execute-write` — one parenthetical clause
- `finish-write-records/references/record-formats.md` — stage enum (this is a reference file, not a SKILL.md — check whether version bumps apply to reference files under the skill's directory)

`design-brief-small-template.md` is a reference file inside `design-small-task/`. Its mentions of `design-large-task` are directional guidance ("use the full template with design-large-task when..."). These become stale advice pointing to a removed skill. **Delete** those "use the full template when..." rows, since the referenced template no longer exists. No version bump needed on a reference file unless the skill's contract changes.

---

## Risk: Orphaned Provenance Trailers

Archived artifacts (in `docs/chester/plans/`) carry `<!-- produced-by design-large-task@vNNNN -->` in their trailers. Removing `design-large-task` from the schema's stamping-skill list does not invalidate those trailers — they are self-contained. The schema describes live producer skills; historical trailers in archived files remain accurate to their time. No risk.

---

## Summary

Nine files: delete stale name, leave or re-point to surviving skill. Three files: delete entire row/section (fork-policy rows 1a-1g, ground-truth cascade commentary in plan-build, and the large-task brief template reference in design-specify). Four tests: three need one assertion removed each; one needs a choice. All changes land in one coherent sprint. No framing redesign required.

---

## Q&A Resolution (post-round, researcher reply)

**Question asked:** Do design-committee pole rows exist in fork-policy.md, enabling a test redirect?

**Researcher answer:** No. Zero design-committee rows in fork-policy.md. The agents exist under agents/ but have no policy table entries. No redirect target exists.

**Pragmatist resolution:** The test-ac-4-1-fork-policy-pole-rows test must be deleted, not redirected. Adding committee rows to fork-policy.md solely to make the test pass is tail-wagging-dog — the policy table should reflect actual dispatch structure, not test needs. If the committee's pole dispatches warrant fork-policy documentation, that is a separate sprint concern, not a constraint on this scrub.

Revised position on the four tests:
- test-plan-build-heuristic: remove one assertion
- test-artifact-schema: remove design-large-task from producer loop
- test-artifact-schema-provenance: remove design-large-task from stamping-skill loop
- test-ac-4-1-fork-policy-pole-rows: **delete the test**
