# Purist Position — Round 01

## The Central Question

What rule governs each of the twelve live references — delete outright or re-point to design-small-task / the surviving pipeline? And how do the four pinning tests move in lockstep?

---

## The Purist Lens

The Purist concern is category integrity: a reference is either telling the truth, telling a half-truth, or describing something that no longer exists. Treating all twelve the same way — uniform delete or uniform re-point — produces the same half-truth the brief warns about. The correct rule is not one rule. It is the right rule per category.

Before assigning rules, the twelve references must be sorted by what they actually say and whether what they say remains true, partially true, or wholly false after the removal.

---

## Category Sort (grounded in file reads)

### Category A: "The canonical sequence has two entry points"

These references present design-large-task as one of two entry paths into design-specify or plan-build. The claim was: either skill feeds the pipeline. With large-task gone, the claim is now half-true — there is one surviving entry path.

**Files in this category:**

- `skills/execute-write/SKILL.md` line 23: names both skills as upstream worktree creators. The claim about design-small-task remains true. The claim about design-large-task is false.
- `skills/design-specify/SKILL.md` description field, lines 18, 48, 235, 236: names both skills as valid upstream sources. Same split: small-task claim stays true, large-task claim is false.
- `skills/plan-build/SKILL.md` line 43: "created by `design-large-task` or `design-small-task`". Same.
- `skills/plan-build/SKILL.md` line 67: "design-large-task's proof loop, or design-small-task's conversation". Same — small-task half is true, large-task half is false.
- `skills/plan-build/SKILL.md` line 312: Integration section lists both as upstream brief sources for spec compatibility. Small-task half remains accurate.
- `skills/start-bootstrap/SKILL.md` lines 6, 19: description field says "Called by design-large-task and execute-write (standalone)". Line 19 says "Always: design-large-task (starts fresh sprints)". With large-task gone, this is wholly false — no skill now calls start-bootstrap always.

**Rule for Category A:** Re-point, not delete. The surviving half of each paired claim is still true and still operationally needed. Deleting removes the true half. The correction is to remove the large-task mention and let the small-task mention (or standalone user path) stand alone. For start-bootstrap specifically, the "Always" bullet must be reconsidered entirely — if no design skill calls it always, the "When to Call" section needs to reflect that design-small-task is now the only design skill that triggers it, and that it is called only when standalone.

### Category B: "These artifact types have a specific producer"

The `util-artifact-schema` producer table lists skills against the artifact types they produce. `design-large-task` is listed as the producer of `design` (8-section envelope), `thinking`, and `process` artifacts. These artifact types exist in the schema as documented types. But the skill that produces them is gone.

**Files in this category:**

- `skills/util-artifact-schema/SKILL.md` line 107: producer column lists both large-task and small-task for `design` artifact. Small-task half remains true.
- `skills/util-artifact-schema/SKILL.md` lines 108-109: `thinking` and `process` artifact rows list only `design-large-task` as producer. No surviving skill produces these.
- `skills/util-artifact-schema/SKILL.md` line 206: stamping-skills list includes `design-large-task`.
- `skills/design-specify/SKILL.md` line 235: Reads section says it reads `../design-large-task/references/design-brief-template.md` (the 9-section envelope template). That file no longer exists at that path.

**Rule for Category B — split within the category:**

- For the `design` artifact row (line 107): re-point. Remove large-task, leave small-task. The artifact type still exists; small-task still produces it.
- For `thinking` and `process` artifact rows (lines 108-109): these artifact types were unique to design-large-task's proof loop. No surviving skill produces them. The Purist position is that these rows should be removed from the schema entirely — not re-pointed, because there is nothing to re-point to. Keeping the rows as "produced by: [nothing]" or leaving them orphaned falsely suggests these artifact types are still part of the pipeline.
- For the stamping-skills list (line 206): delete the large-task entry. This is not a re-point — stamping is a positive action a skill performs, and large-task performs no actions now.
- For design-specify's Reads section (line 235): The reference to the large-task template path must be removed because the file no longer exists at that path. If design-specify needs to describe what template formats it can accept, it should reference only the small-task template (or state "6-section lightweight brief from design-small-task, or human-authored brief").

### Category C: "There were pole-agent subagents registered under this skill"

`docs/fork-policy.md` rows 1d through 1g list four named subagents (`chester:design-large-task-step-b-innovator`, `-conservator`, `-purist`, `-pragmatist`). These subagents existed as files and were dispatched by design-large-task's step-b framing phase. They are archived. No surviving skill dispatches them.

**Files in this category:**

- `docs/fork-policy.md` rows 1d-1g: four entries, each naming a non-existent subagent.

**Rule for Category C:** Delete outright. There is no surviving skill to re-point these rows to. The fork-policy table documents active dispatch sites. Archived dispatch sites do not belong in this table. The question is whether a note should be left ("rows 1d-1g archived with design-large-task") or whether the rows simply disappear. The Purist position is that the rows disappear — historical record belongs in the archive, not in the live policy table.

### Category D: "This skill reads from design-large-task or uses it as context"

Some references are less about the canonical sequence and more about internal behavior notes or configuration.

**Files in this category:**

- `skills/start-bootstrap/SKILL.md` line 92: The session metadata helper records commit hashes for `util-design-partner-role` and `design-large-task` SKILL.md files. This is a concrete script call that names a now-nonexistent file. This is a false operational reference.
- `skills/util-design-partner-role/SKILL.md` description field (line 3): "Read this skill (don't invoke it) when running design-large-task or design-small-task." The large-task half is false. The small-task half remains true.
- `skills/util-design-partner-role/SKILL.md` line 9: "Both `design-large-task` and `design-small-task` read this file." Same.
- `skills/util-design-partner-role/SKILL.md` line 96: Describes how design-large-task captures private precision via `capture_thought`. This is a behavioral description of a removed skill — it is dead text.
- `skills/util-worktree/SKILL.md` line 199: "design-large-task (Archival stage) - REQUIRED when design is approved and implementation follows". This describes when util-worktree is called. It is false.
- `skills/finish-write-records/references/record-formats.md`: (checked via brief scope — contains a reference)
- `agents/agent-industry-explorer.md` description: "Used by design-large-task during Phase 2". The agent is also usable by other dispatch contexts, but the description currently attributes it only to large-task.

**Rule for Category D:** Each reference must be evaluated independently.

- start-bootstrap line 92 (session-meta script recording large-task SKILL.md hash): False operational reference. Remove or replace with design-small-task only — this script would fail or produce null if it tries to hash a nonexistent file.
- util-design-partner-role description and body: Remove the large-task mentions. Small-task still reads this file. The behavioral description of large-task's `capture_thought` usage (line 96) is dead text — delete it.
- util-worktree line 199: Delete the large-task bullet. The worktree is created by design-small-task at its Closure stage now.
- agent-industry-explorer.md description: Re-point or broaden. The agent itself is not removed — it is a general industry-research agent. Its description should either say it is available for design session fan-out (without naming a specific dispatching skill) or name design-small-task if small-task dispatches it.

---

## The "Canonical Sequence" Concept — Is It One Thing or Two?

The brief surfaces this as the central tension: does the canonical sequence `design-large-task | design-small-task → design-specify` describe one concept (an entry-point pattern), or two coupled concepts (each skill having its own distinct role)?

**The Purist answer:** It was always one concept — the pipeline entry pattern — with two members. Removing one member does not remove the concept; it reduces the arity of the entry pattern from two to one. The correct description after removal is not "design-small-task → design-specify" with no preamble, but rather "the pipeline entry skill is design-small-task." That is a true description. Replacing the pair notation with a singleton notation is a re-point, not a delete.

This distinction matters for the tests. The `test-plan-build-heuristic` test (line 65) currently asserts that plan-build references design-large-task "in the ground-truth cascade context." But the test comment (lines 62-64) explains the reason: "the cascade survives through design-specify because both write into the same sprint subdirectory." That reason is about design-specify, not about design-large-task. The test is asserting the wrong invariant — it is testing for the presence of the skill name rather than for the presence of the cascade concept. The correct fix for this test is not to keep a stale mention of design-large-task to satisfy the grep — it is to update the test to check for the cascade concept by a grep that will still pass after the reference is removed (e.g., checking that the ground-truth cascade section exists and references design-specify as the cascade source, which is already true at lines 148-156).

---

## The Producer-List Question — Historical Provenance or Live Schema?

The brief surfaces this as a residual risk: if design-large-task is removed from the producer list in `util-artifact-schema`, do provenance trailers in archived artifacts that say `produced-by design-large-task` become broken?

**The Purist answer:** No. Provenance trailers are descriptive, not prescriptive. A trailer saying `produced-by design-large-task@v0003` is a historical claim about what produced that artifact at that time. The schema's producer list is the current-state definition of which skills produce which artifact types now. These are different categories of information living in the same document.

Keeping design-large-task in the producer list to preserve archived-trailer validity conflates historical provenance (what produced this artifact at this timestamp) with current schema (what produces this artifact type today). That conflation is exactly the kind of category error the Purist lens exists to catch. The producer list should describe current producers. Archived artifacts carry their own trailers as self-contained evidence.

The one exception: the `thinking` and `process` artifact types. These are documented in the schema as types, but if the only producer no longer exists, should the types remain? The Purist position is no — removing the type rows is correct because no current skill produces these artifact types. Their presence in the schema misleads implementers into thinking these artifacts can still be produced. Remove the rows; archived artifacts with these types are still valid historical records.

---

## The Four Tests — Category Discipline

The four pinning tests each assert something different, and their correct disposition follows from the category analysis:

### test-plan-build-heuristic

Current assertion: `grep -q "design-large-task" "$SKILL"` in plan-build.

The comment says this is testing for presence in "cascade context." But after the scrub, the only remaining true mention in plan-build would be at line 153 ("design-large-task no longer produces a design-stage ground-truth report") — which is a historical narration, violating the standalone-documentation discipline, and should itself be removed. After a proper scrub, design-large-task will not appear in plan-build at all.

**Correct fix:** Update the test to check the cascade concept, not the skill name. For example, grep for "ground-truth" and "design-specify" together, confirming the cascade is documented via design-specify as the source. This preserves the test's intent (cascade structure exists and is documented) without requiring a stale name to remain.

### test-artifact-schema

Current assertion: design-large-task must appear in the producer list.

After the scrub, design-large-task should not appear as a live producer. But the test comment says "Canonical sequence producers must all appear" — with large-task gone, it is no longer a canonical sequence producer.

**Correct fix:** Remove `design-large-task` from the producers loop. The loop should now contain `design-small-task design-specify plan-build execute-write finish-write-records`. The test's intent (canonical producers are all listed) remains valid; only the enumeration changes.

### test-artifact-schema-provenance

Current assertion: stamping-skill list includes design-large-task.

After the scrub, design-large-task is not in the stamping list.

**Correct fix:** Remove `design-large-task` from the stamping-skill loop. Same logic as above.

### test-ac-4-1-fork-policy-pole-rows

Current assertion: `docs/fork-policy.md` contains `chester:design-large-task-step-b-{pole}` for each of the four poles, and at least 4 rows mentioning `step-b`.

After the scrub, these rows are deleted from fork-policy.md. The test will fail on both the grep-F and the row-count check.

**Correct fix:** This test was written to verify AC-4.1 of a spec that asserted the fork-policy table documents these dispatch sites. With design-large-task archived, the original AC-4.1 is no longer applicable — there are no active step-b pole dispatches. The test should either be archived (moved to `_archive/design-large-task/tests/`) or converted to test whatever fork-policy entries remain for currently-active named subagents. Archiving is cleaner — the test was written to pin a removed skill's behavior and belongs with that skill's archived tests.

---

## Consistent Re-Pointing Rule

To avoid the half-truth risk the brief names, the rule must be applied consistently:

- Every place that presents a pair `design-large-task | design-small-task` as equivalent entry points: remove the large-task member, leave the small-task member. This is a re-point — the concept (pipeline entry) remains, with one member.
- Every place that describes behavior unique to design-large-task (proof loop, step-b poles, capture_thought usage, proof-mcp npm install, nine-section template): delete the reference. No surviving skill exhibits this behavior. Re-pointing would invent a false equivalence.
- Every place that attributes a role to design-large-task that design-small-task now fills alone (worktree creation, sprint bootstrap, design-partner-role consumption): re-point to design-small-task.
- The fork-policy table: delete the four pole rows. These are active-dispatch-site entries; archiving the dispatch site removes the reason for the entry.
- The `thinking` and `process` artifact type rows: delete from schema. These types have no current producer.

Inconsistent application — some re-pointed, some deleted with no visible logic — would leave a reader unable to infer the rule and would require re-verification of every reference individually. Consistent application of the three cases above makes the logic auditable.

---

## Peer Question

Sent to researcher: does any surviving skill dispatch `agent-industry-explorer`, or was design-large-task its only caller?

**Researcher answer:** Complete orphan. design-small-task Phase 2 is entirely inline — no agent dispatch. No other live skill references the agent. The only live file outside archived plans referencing "industry-explorer" is `docs/fork-policy.md` row 1c, which itself names a now-nonexistent registered subagent (`chester:design-large-task-industry-explorer`). No surviving dispatch site exists anywhere.

**Implication for position:** `agent-industry-explorer.md` is an archive candidate, not a description-update candidate. It belongs in `_archive/design-large-task/` alongside the pole agents and the large-task tests. The fork-policy row 1c (industry explorer) joins rows 1d-1g (poles) as a delete, not a re-point. Row 1c was already in Category 2 (unique-to-large-task) by the skill-dispatch criterion — the researcher's answer confirms it.

---

## Summary

- Three governing rules, not one: re-point where the concept survives with one surviving member; delete where the behavior is unique to the removed skill; remove artifact-type rows whose only producer is gone.
- The canonical sequence is one concept with one surviving member — always re-point, never delete the sequence concept itself.
- The producer list in util-artifact-schema belongs to the current-state schema, not historical provenance — remove large-task as producer, and remove the `thinking`/`process` type rows entirely.
- The fork-policy pole-agent rows and the industry-explorer row describe archived dispatch sites — delete rows 1c-1g; historical record belongs in the archive.
- `agent-industry-explorer.md` is a complete orphan — archive it, do not update its description.
- Tests must be updated to test the concept (cascade exists, canonical producers enumerated, fork-policy documents active sites), not the stale name. The fork-policy test belongs in the archive.
- Inconsistent re-pointing across skills re-introduces the half-truth. Apply the three-rule sort uniformly.
