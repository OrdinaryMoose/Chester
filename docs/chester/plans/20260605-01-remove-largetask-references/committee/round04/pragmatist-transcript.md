# Pragmatist — Round 04 Attack Transcript

**Sprint:** 20260605-01-remove-largetask-references
**Role:** Pragmatist
**Dimension:** plan-attack — decision budget, over-decomposition, OD defaults, exec mode
**Plan under review:** docs/chester/working/20260605-01-remove-largetask-references/plan/20260605-01-remove-largetask-references-plan-00.md

---

## Grounding

Read the full 10-task plan draft. Read all pinning tests (test-info-packet-style-version-bumps.sh, test-partner-role-overlay-section.sh, test-partner-role-discipline.sh, test-start-cleanup.sh, test-stamping-*.sh) in full from disk. Verified which tests pin which versions and confirmed constraints before writing any finding.

---

## 1. Decision-Budget Attack

**Draft sum = 18. Threshold for plan-attack flag = any single task > 3.**

Tasks at or near threshold: Task 4 (budget 3), Task 9 (budget 3). Both sit at the flag line, not above it. The attack question: are the cited budgets correct, or do real implementer ambiguities push either above 3?

### Task 4 (budget 3) — start-bootstrap + util-design-partner-role, two-skill lockstep

The draft budget of 3 is assigned to this task. What are the actual ambiguities a fresh implementer faces?

Ambiguity 1: identifying which three test files must be co-committed (test-info-packet-style-version-bumps.sh, test-partner-role-overlay-section.sh, test-partner-role-discipline.sh). The plan makes this explicit in the "Must remain green" field and the "Why one commit" note — no real ambiguity once the implementer reads this section. Resolves to 0 implementation-time ambiguities because the plan pre-answers it.

Ambiguity 2: the test-info-packet-style-version-bumps.sh pins both `util-design-partner-role v0004` and `start-bootstrap v0002` in a single run. The implementer must update both assertions correctly. This is a real ambiguity if the implementer doesn't read all pinning tests before starting — they might update one and miss the other. The plan lists "Modify: tests/test-info-packet-style-version-bumps.sh" with the correct assertion updates. Risk is low but real.

Ambiguity 3: test-partner-role-overlay-section.sh also pins `v0004` explicitly (`grep -q '^version: v0004$'`). The plan correctly notes this test must be updated. But the plan's Step 3 says "Edit the two version-assertion tests" — there are actually THREE version-assertion files (test-info-packet, test-partner-role-overlay-section, and test-partner-role-discipline which is listed as must-remain-green but needs no edit). Counting them correctly is a real ambiguity.

**Verdict on Task 4 budget:** 3 is correct. The plan pre-resolves ambiguity 1; ambiguities 2 and 3 are real. The plan body is sufficiently specific — budget does not exceed 3.

**One gap found:** Step 3 says "edit the two version-assertion tests" but there are two version-assertion files that require edits (test-info-packet AND test-partner-role-overlay-section). The plan's Files block already lists both. "Two" is correct — test-partner-role-discipline requires no edit. However, the Step 3 prose should say "the two version-assertion files listed above" rather than just "two" — a fresh implementer could miscount if they are rushing. Low-cost fix: clarify the step prose.

### Task 9 (budget 3) — instructions.md four-zone rewrite

The draft budget of 3 is for zone-boundary identification. Per my round-03 peer response, the zones are now documented:
- Zone 1: inline removals (~L31, L168, L211)
- Zone 2: MCP install blocks
- Zone 3: full skill description sections (L219–247, L273–295)
- Zone 4: comparison and reference table rows

The plan's Files block names all four zones with line numbers. With the zone map in the task, the implementer's ambiguities are:

Ambiguity 1: confirming the line numbers haven't drifted (the plan was written against HEAD `5a800e5`; prior tasks may shift line numbers). Real — but low risk since prior tasks don't touch instructions.md.

Ambiguity 2: the Zone 3 block-delete — identifying the exact `---` separator boundary for the design-large-task section (L247) vs the design-small-task section opening (L250). One off-by-one deletes too much or too little. Real.

Ambiguity 3: the Zone 4 comparison table correction — after deleting design-large-task row, confirming the surviving design-small-task description is accurate for the current pipeline (the plan notes "design-small-task → design-specify" correction). Requires reading the table for accuracy, not just grepping. Real.

**Verdict on Task 9 budget:** 3 is correct. Three real ambiguities, plan body addresses all three with zone line-number anchors. Does not exceed threshold.

**One gap found:** the plan tells the implementer to "ensure the surviving design path is described accurately: design-small-task → design-specify" but doesn't say what the accurate description IS. A fresh implementer needs to verify against skills/design-small-task/SKILL.md and skills/design-specify/SKILL.md to confirm the pipeline flow. This is a lookup step, not an ambiguity — but if the implementer gets it wrong, the AC-2.8 boundary (`grep -c design-large-task → 0` plus `grep -ci design-figure-out → 0`) would still pass even with an inaccurate description of the surviving pipeline. The observable boundary doesn't catch prose accuracy. This is a spec gap, not a plan gap — AC-2.8 could be strengthened with a third boundary checking design-small-task presence. Not a plan-attack finding — flag to the spec author as a low-severity observation.

**Budget attack summary:** both Tasks 4 and 9 are correctly budgeted at 3. Sum of 18 is accurate. No task exceeds the threshold. No underspec finding.

---

## 2. Over-Decomposition Attack

**Draft: 10 tasks. My round-03 proposal: 6 tasks. Question: is the finer cut justified or wasteful?**

The draft's 10 tasks vs my 6 differ in four splits:

**Split 1: Tasks 5 and 6 (design-specify + execute-write) as separate tasks.**

My round-03 Task 1 bundled five pipeline-entry skills together. The draft separates design-specify (T5) and execute-write (T6) because each has its own stamping test that pins its version number, and grouping them into one commit would require updating multiple stamping tests atomically. The draft's justification is correct: each has an independent stamping test, and isolating them keeps each commit's test-edit scope to one test file per skill. This is not overhead — it is the lockstep constraint applied correctly. The finer cut is justified.

**Split 2: Task 7 (collapsed uncoupled deletes) vs my bundling.**

My round-03 Task 5 bundled fork-policy deletion, test archive, agent archive, design-brief-small-template, and record-formats into one commit. The draft separates fork-policy + test archive (T3) from the other deletes (T7). Justified: T3 is the lockstep pair for test-ac-4-1; T7 contains files with no pinning tests. The fork-policy + test archive is structurally distinct from the reference-file deletes. Not over-decomposed.

**Split 3: Task 8 (setup-start skill-index sync) as its own task.**

My round-03 had setup-start sync as Task 2. The draft keeps it as its own task (T8) with a dependency on Tasks 4 and 5. Justified: T8 must read the finalized descriptions from T4 and T5 before updating the skill-index. The dependency makes sequencing necessary, and the test constraint (test-start-cleanup forbids design-specify in the SKILL.md body) makes this a careful one-file edit. Separate task is appropriate.

**Split 4: Task 10 (capstone) as its own task.**

Separate capstone task for AC-6.1. This is the plan template's expected structure — the capstone is always a distinct task. Not over-decomposed.

**Genuine over-decomposition candidate: none found.**

The draft's 10-task structure is fully justified by the lockstep constraint and the test-pinning reality. Each task is the right size for one safe commit. The finer cut relative to my round-03 proposal is correct — my proposal underestimated the stamping-test coupling that the developer round surfaced.

**One observation:** Task 7 bundles four distinct file edits plus two git-mv operations. The task body explicitly justifies this grouping (no pinning tests, all deletions/moves in one sprint). Budget is 2. This is at the upper edge of "appropriate bundle" — a coarser reviewer might flag it. But the pragmatist position is: the files are genuinely independent, the budget is accounted for, and adding another task for the sake of granularity adds dispatch overhead with no review benefit. Keep as-is.

---

## 3. Open Decisions — Are the Defaults the Cheapest Sound Choice?

**OD-1: Scrub all design-large-task occurrences in record-formats.md (including historical examples)**

Default (a): scrub all, substitute a surviving skill name or generic placeholder. The observable boundary demands grep-zero.

Alternative: relax AC-2.6's boundary from grep-zero to "stage-enum entry removed."

Pragmatist read: the draft's default (a) is the cheapest sound choice — it satisfies the literal AC and keeps the scrub mechanically consistent (every file reaches grep-zero; no file-by-file judgment about which hits are "acceptable"). Relaxing AC-2.6 is a spec change, which is more expensive than applying the same scrub rule uniformly. Default (a) stands.

One note: the plan says "substitute a surviving skill name or a generic placeholder" for the example occurrences. This leaves the implementer to choose which substitution. Low-cost clarification: the plan should specify "substitute `design-small-task`" (the natural surviving equivalent for historical-example purposes) rather than leaving it open. Adds precision, removes an unnecessary micro-decision.

**OD-2: Bump setup-start version frontmatter even though the substantive edit is a reference file**

Default: bump SKILL.md version per AC-5.1. No stamping test pins setup-start. test-start-cleanup greps for skill names, not versions — the bump is safe.

Pragmatist read: cheapest sound choice is correct. The bump adds one line change to a frontmatter field with zero test risk. Skipping the bump would leave AC-5.1 unsatisfied without designer override. Keep.

**OD-3: No parent bump for design-small-task or finish-write-records**

Default: no bump — their SKILL.md bodies are untouched; AC-5.1 excludes them explicitly.

Pragmatist read: correct. The normative rule is "bump when body or contract text changes." Reference files edited without touching the parent's body do not trigger the bump. AC-5.1 is the authority. Default stands.

**OD-4: Delete the upsize block without replacement**

Default: delete the upsize block, leave a one-line gap comment for designer review.

Pragmatist read: verified in peer DM to purist — neither design-committee nor design-grillme is a design entry-point skill. An honest gap beats a wrong pointer. Default (delete + gap comment) is both cheapest and most accurate. Stands.

No OD default is over-specified or under-specified. All four are the minimal sound choice.

---

## 4. Execution Mode — Does the Docs-Only Nature Flip It to Inline?

**Computed: subagent. Conditions 1 (task count) and 3 (sum budgets) both fail.**

Argument for inline: this is pure documentation editing — no runtime behavior changes, no code-producing tasks. The review value of per-task spec fidelity checking is lower when the implementer is deleting words rather than writing logic.

Counter-argument (pragmatist): the spec-fidelity risk is different here, not absent. The scrub can silently pass on the wrong observable boundary (e.g., the implementer removes a name from a list but misses a second occurrence in the same file). Per-task spec review catches "grep -c → 0 assertion failed" on the first missed occurrence. Without subagent, the implementer accumulates all twelve files' worth of missed hits before the terminal gate catches them. The regression surface on a 10-task, 18-budget documentation sprint is real — it's just structured differently than code risk.

Additionally: condition 3 (sum of budgets = 18) fails by a factor of 4.5x. The heuristic is calibrated to catch exactly this case — many tasks with moderate individual budgets that add up to a large total ambiguity surface. The subagent mode's per-task review is the mitigation.

**Verdict: subagent stands.** The docs-only nature does not flip the recommendation. The two failing conditions are not close calls.

---

## Attack Summary

**Blocking findings:** none. The plan is implementable as written.

**Non-blocking gaps (should be fixed before execution):**

Gap 1 — Task 4, Step 3 prose: "edit the two version-assertion tests" is imprecise. Should read "edit the two version-assertion test files listed in the Files block above (test-info-packet-style-version-bumps.sh and test-partner-role-overlay-section.sh)." Eliminates a counting ambiguity for zero cost.

Gap 2 — Task 7, OD-1 substitution: "substitute a surviving skill name or a generic placeholder" leaves an open choice. Should specify "substitute `design-small-task`" for the historical example occurrences in record-formats.md. Removes a micro-decision from the implementer.

**Non-finding (spec observation):** AC-2.8's observable boundary (grep-zero for large-task + figure-out) does not verify the surviving pipeline description is accurate. This is a spec weakness, not a plan error — the plan correctly implements the spec as written. Worth noting for future spec authoring: when the change is a rewrite rather than a deletion, at least one boundary should verify what remains, not just what was removed.

**Exec mode:** subagent confirmed. No argument for inline overcomes the two failing heuristic conditions.

**OD defaults:** all four are correct and require no designer override before execution.
