# Innovator Transcript — Round 04 (Plan Attack)

**Committee:** design-committee, remove-largetask-references
**Date:** 2026-06-05
**Lens:** structural assumptions, hidden coupling, degenerate tasks, cargo-cult

---

## Attack 1 — Shape Blind Spot: Hidden Wording Coupling

The by-commit-unit shape protects against the suite going red between commits. It does not protect against a subtler coupling: the plan requires the same canonical-sequence phrase to be rewritten consistently across four files (execute-write §1.2, plan-build L43, design-specify L18/L236, start-bootstrap), each in a separate task.

No test enforces consistent cross-file phrasing. Each task gates on `grep -c design-large-task <file> → 0` — a presence check, not a consistency check. Task 1 could rewrite plan-build's cascade to say "design-small-task feeds design-specify," and Task 6 could rewrite execute-write's canonical-sequence parenthetical to say "design-small-task at Closure" — both pass their gates, but the phrasing differs. A reader of plan-build sees one framing; a reader of execute-write sees another. This is the same half-truth risk the committee spent round 01 establishing as the primary risk.

**Severity:** Important. Not a test-breaking bug — the suite stays green. But it is exactly the "inconsistent re-pointing" failure mode the spec named. The plan has no guard against it.

**Proposed fix:** Add a cross-file consistency check to Task 10's Step 4 (already the suite capstone step) — before committing, grep all four re-point targets for a canonical phrasing token (e.g., `design-small-task` followed by `design-specify` in reasonable proximity). This is cheap: one grep command added to the verification step. Alternatively, the plan could specify the exact wording for the canonical-sequence phrase once (in a preamble or plan note) so each task's implementer is not making an independent wording judgment.

**Does not require task restructuring.** The coupling is a wording-consistency gap, not a commit-ordering hazard.

---

## Attack 2 — AC-1.7 / Task 8: Degenerate Task Analysis

Task 8 implements AC-1.7 (sync setup-start available-skills list) and OD-2 (bump setup-start version). The plan correctly notes that setup-start SKILL.md and setup-start/references/skill-index.md are already grep-zero for design-large-task. The work is described as a "description-text sync."

**Ground truth check reveals a deeper degeneracy than the plan admits:**

The two-place-sync rule (CLAUDE.md L86) is: "When editing a SKILL.md, the `description` frontmatter field and the skill's entry in `skills/setup-start/SKILL.md` (the available skills list) must stay in sync." The normative sync target is `setup-start/SKILL.md` — the available-skills list that Claude Code's Skill tool registry reads.

The plan's Task 8 targets `setup-start/references/skill-index.md` — a different file, a human-readable reference catalog with independent prose summaries. The two-place-sync rule does not mention skill-index.md. Checking the current skill-index entries:

- start-bootstrap entry: "Mechanical session setup: config, sprint naming, dir creation, task reset, thinking history" — no mention of design-large-task, no mention of which skill calls it. This entry does not become inaccurate when start-bootstrap's description field drops the design-large-task caller.
- design-specify entry: long description, accurate current-state prose, zero design-large-task hits.

**Consequence:** The description-text sync in skill-index.md is not mandatory under the two-place-sync rule and may have no actual content to change (the skill-index entries don't mirror the description frontmatter — they're independent summaries). Task 8's stated work may be empty or near-empty in practice.

**The genuine work in Task 8 is only OD-2: bump setup-start's version frontmatter.** That is a one-line edit to one file. The description-sync framing is inflated.

**Should Task 8 merge into another task?** Yes, but carefully. The version bump happens after Tasks 4 and 5 (because the skill-index would reflect their finalized descriptions if there is real sync work). If there is no real sync work, the bump is entirely independent and can travel with Task 7 (the "collapsed uncoupled deletes" batch) or be dropped into Task 5 or Task 6 — either neighbor is fine. The plan's dependency note ("Land after Tasks 4 and 5") is load-bearing only if there is real skill-index content to sync. If there is none, the dependency evaporates and Task 8 merges freely.

**Severity:** Important. Task 8 as written risks the implementer spending time looking for description-sync work that does not exist. The plan should be explicit: if skill-index.md requires no substantive edit, the task collapses to a one-line frontmatter bump and can be merged into Task 7.

---

## Attack 3 — OD-2: Setup-start Version Bump — Cargo Cult?

The versioning rule (CLAUDE.md L31): "Bump it on any meaningful change to the skill's behavior or contract — not on typo fixes or comment-only edits."

Task 8 bumps setup-start's version frontmatter. The SKILL.md body is untouched. The only edit to any setup-start file (if the skill-index sync has content at all) is to `references/skill-index.md` — a reference file, not the skill body.

**Is this a "meaningful change to the skill's behavior or contract"?**

Updating skill-index.md to reflect other skills' updated descriptions is a documentation-maintenance edit to a reference catalog. The setup-start skill's own behavior does not change: it still sets up sessions identically, lists the same skills in the same priority order, fires the same hooks. The skill-index entries for start-bootstrap and design-specify describe those skills' behavior — not setup-start's. Updating them is maintenance of a reference document, not a change to setup-start's contract.

**Structurally-honest call:** The version bump on setup-start is cargo-cult ritual. CLAUDE.md's two-place-sync rule says to bump when you change what a skill does — setup-start's behavior is unchanged. AC-5.1's explicit list includes setup-start, but the spec authored that list before the ground truth established that setup-start's SKILL.md body would remain untouched. The bump satisfies the AC formally while violating the spirit of the versioning rule.

**However:** this is a low-risk cargo-cult. A spurious bump does no damage — it slightly inflates the version counter and requires updating any test that pins setup-start's exact version (no such test exists, confirmed by grep). The cost of the cargo-cult is near-zero. The cost of arguing with the spec over one frontmatter line is higher.

**Recommendation:** Keep the bump, note in the plan that it is a precautionary frontmatter edit with no behavioral change, and flag it as a candidate for the deferred follow-up list. Do not hold the plan over it. But the plan should stop calling it a "description-text sync" and call it what it is: a precautionary version bump on a skill whose reference file changed but whose behavior did not.

---

## Attack 4 — TDD Framing: Theater vs Genuine Red/Green

The plan uses grep-count-to-zero as the Step 1 "failing test" and the same grep returning 0 as Step 4 "passing test." Is this genuine TDD or theater?

**Genuine red/green (Tasks 1, 2, 3):** The three tasks that bundle a file scrub with its pinning test script run a real test in Step 2 that passes, make edits that would break that test if committed alone, then fix the test so it passes again. This is a genuine red/green cycle — the test starts passing, the file edit without the test edit would make it red, the co-committed test edit restores green. The discipline is real.

**Theater (Tasks 4, 5, 6, 7, 9):** The grep-count gate is not a test in the TDD sense. It is a post-hoc verification. Step 1 ("run grep, get nonzero") is not a failing test — it is confirming the precondition that there is work to do. Step 4 ("run grep, get zero") is confirming the work happened correctly. This is verification, not TDD. The five-step shape is applied by convention; the discipline it enforces (write the test before the implementation) is not present — you cannot write "grep returning zero" before making the edit.

**Does this matter?** For this sprint, the theater does not introduce risk. The real risk management for docs edits is:
- The suite runs at the end of every task (Step 4's "run tests") — this catches any collateral damage.
- The co-commit constraint for Tasks 1–3 is where the real safety comes from.

Calling Tasks 4–9's grep gate "TDD" is cosmetically inaccurate but operationally harmless. The plan would be more honest to call it "verification by observable boundary" rather than "failing test." The five-step shape is still worth keeping for its commit-discipline value (one file change, verify, commit) even when the "test" is just a grep.

**Severity:** Minor. No action required. The plan should not be rewritten over this, but the implementer should understand which tasks have genuine red/green discipline (1, 2, 3) and which have verification discipline (4–9, 10).

---

## Attack 5 — Task 4 Two-Skill Bundle: Hidden Version-Assertion Coupling

The plan's Task 4 bundles start-bootstrap and util-design-partner-role into one commit because `test-info-packet-style-version-bumps.sh` pins both versions in a single test run. This is the right call — the test is confirmed to assert `util-design-partner-role v0004` and `start-bootstrap v0002` in the same execution.

**One genuine coupling the plan does not explicitly flag:** `test-info-packet-style-version-bumps.sh` also asserts `design-small-task v0003` and checks for a handshake phrase in design-small-task SKILL.md. Task 4 updates the test's start-bootstrap assertion (v0002→v0003) and util-design-partner-role assertion (v0004→v0005) but does NOT update the design-small-task assertion — because design-small-task stays at v0003 (OD-3, no bump). This is correct, but the plan does not say so explicitly. An implementer editing the test in Task 4 who sees the design-small-task assertion at v0003 may wonder: is this intentional? Should I update it?

**Severity:** Minor. The plan should add one sentence to Task 4 Step 3: "The design-small-task assertion in this test (`v0003`) is correct and intentionally unchanged — design-small-task is not bumped in this sprint."

---

## Summary of Findings

| # | Issue | Severity | Action |
|---|---|---|---|
| 1 | No cross-file phrasing consistency guard on canonical-sequence re-points | Important | Add consistency grep to Task 10 Step 4, or specify canonical wording in a plan note |
| 2 | Task 8 description-sync may be empty; real work is only a frontmatter bump | Important | Plan should say: if skill-index requires no edit, collapse Task 8 into Task 7 (or drop the dependency on Tasks 4/5) |
| 3 | Setup-start version bump is cargo-cult ritual — no behavioral change | Minor | Keep the bump; relabel it "precautionary frontmatter edit," stop calling it description-sync |
| 4 | TDD framing for Tasks 4–9 is verification discipline, not genuine TDD | Minor | No action; note in plan which tasks have genuine red/green vs verification |
| 5 | Task 4 does not explicitly say the design-small-task v0003 assertion is intentional | Minor | Add one-sentence note to Task 4 Step 3 |

**Plan is sound.** Two Important findings require targeted additions to Task 8 and Task 10; they do not require task restructuring. Three Minor findings are documentation improvements. No Critical findings.
