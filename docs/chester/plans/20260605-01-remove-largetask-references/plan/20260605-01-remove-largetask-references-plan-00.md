# Plan: Complete the design-large-task Reference Removal

**Sprint:** 20260605-01-remove-largetask-references
**Spec:** docs/chester/working/20260605-01-remove-largetask-references/spec/20260605-01-remove-largetask-references-spec-00.md
**Execution mode:** subagent

> **For agentic workers:** Use execute-write to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Execution mode is `subagent` — each task is dispatched to a fresh implementer and spec-reviewed independently. This was set by the design-committee (round 03 develop / round 04 attack) per the plan-build Execution Mode heuristic; see the Execution Mode Rationale section below.

## Goal

Finish the ratified removal of `design-large-task` by scrubbing every live reference across the skill, agent, and documentation corpus, archiving the one orphaned agent and the one orphaned test, and bumping the eight modified skills — keeping the full test suite green after every commit.

## Architecture

By-commit-unit decomposition. Each task is exactly one lockstep-safe commit: a file scrub lands together with every test that pins it (text assertions **and** version assertions), so the suite never observes a half-applied change. Tasks are grouped by commit-safety, not by acceptance-criterion number — the lockstep constraint makes "one AC = one task" unsafe, because a scrubbed file and its pinning test are different files that must co-commit.

## Tech Stack

Bash test scripts (`tests/test-*.sh`), Markdown skill/agent/doc files, `git mv` for archival moves, `grep -c` as the per-file observable-boundary gate. No runtime code. No build step. `chester-trailer-write` provenance is unaffected (round-01 ground truth: harvest reads trailers in files, never the producer list).

---

## Framing (hard constraint — carried from the spec)

`design-large-task` is **removed, not renamed**. `design-small-task` is a distinct surviving skill, never a continuation. "Re-point" means *drop the dead member from a list that already named design-small-task* or *name the surviving skill that factually owns a role now* — never "design-large-task became design-small-task." Where design-large-task is the sole named actor for a job no surviving skill performs, the mention is **deleted**, not re-pointed.

## Canonical-Sequence Wording (fixed — use verbatim across all tasks)

Four tasks (1, 5, 6, and the instructions rewrite in 9) independently rewrite the canonical-sequence phrase. To prevent inconsistent re-pointing (the round-01 risk), every task that names the sequence uses this exact wording:

> **design-small-task → design-specify → plan-build → execute-write**

No task invents its own phrasing. Where the old text said "`design-large-task` | `design-small-task` → …", the replacement is simply "`design-small-task` → …" (drop the alternation, keep the surviving member). The capstone (Task 10) greps for residual `design-large-task` across all four files, which catches any task that deviated.

## TDD Regime (which tasks are genuine red/green)

- **Tasks 1–3** carry genuine red/green cycles — they edit real test scripts (`test-plan-build-heuristic`, the two `test-artifact-schema*`, the archived pole-row test), so the test is a true failing-then-passing gate.
- **Tasks 4–9** are verification-discipline, not classic TDD: the `grep -c … → 0` check is post-hoc verification of a documentation edit, not a unit test written before code. The per-task suite-relevant test runs (version-pin tests in 4–6) are the real safety net; the grep gates confirm the scrub is complete. The implementer should understand they are in the verification regime, not writing failing tests first.

## Ground-Truth Corrections Folded Into This Plan

The develop round (round 03) re-verified the spec against the worktree at HEAD `5a800e5` and found four facts the spec's line lists did not capture. The plan implements the corrected reality:

1. **Nine version-pinning assertions across seven test files break on the AC-5.1 bumps** — not the four tests AC-4.x enumerates. The spec's AC-4.x covers only the tests that grep for `design-large-task` text; it does not mention the `test-stamping-*` and version-assertion tests that pin exact version numbers. Every bumped skill except util-worktree has at least one version-pinning test that must be edited in the same commit. (See the per-task "Must remain green" and the Open Decisions.)
2. **AC-1.7's premise is already satisfied.** `skills/setup-start/SKILL.md` and `skills/setup-start/references/skill-index.md` both have zero `design-large-task` occurrences at HEAD. The real sync work is a **description-text sync** of the start-bootstrap and design-specify entries in `skill-index.md` (lines ~25, ~28) so they match those skills' updated descriptions. `test-start-cleanup.sh` forbids `design-specify` in `setup-start/SKILL.md` body — do not touch that body except its version frontmatter line.
3. **Anchor drift:** design-specify "Invoked by" is line **236**, not 237.
4. **New per-file hits beyond the spec's cited lines** (plan-build L67 "proof loop"; util-design-partner-role L3 description frontmatter; design-brief-small-template L5/L9/L152; record-formats L68/L213/L229). The re-point/delete ACs use a `grep -c design-large-task <file> → 0` observable boundary, which is **stricter than the spec's line list** — so each task scrubs *every* occurrence in its file and gates on the count reaching zero, not on the specific lines.

## Open Decisions (for the designer — surfaced by the develop round, to be hardened in round 04)

- **OD-1 — record-formats occurrences vs AC-2.6 grep-zero (RESOLVED per-occurrence in round 04).** All four `design-large-task` occurrences must go to reach `grep -c → 0`, but the *treatment* differs per occurrence (purist category ruling — uniform substitution would assert false equivalence; conservator surgical-deletion hazard on L68):
  - **L193** (stage-enum, forward-facing): delete the entry, no substitute.
  - **L68** (inside the `Session Skill Versions` example block, L59–72): remove **only L68**, no substitute. Do **not** delete the surrounding block — `test-finish-write-records-provenance` greps record-formats for the `Session Skill Versions` heading; disturbing L59–67 / L69–72 fails that test.
  - **L213** (field-description parenthetical): delete the `design-large-task` clause, no substitute (design-small-task has no Solve Stage — substituting would be false).
  - **L229** (example record stage field): update the field value to a surviving skill name — this is accurate, not false equivalence.
- **OD-2 — setup-start version bump on a reference-only change (RESOLVED: keep, relabel).** AC-5.1 lists setup-start to bump. No setup-start version-pinning test exists and the body has no behavioral change, so per the strict versioning rule this is not a behavior/contract bump. Cost is near-zero. **Resolution: bump the SKILL.md version frontmatter line per AC-5.1 as a precautionary frontmatter edit** (not a "description sync" — see Task 8). Safe against `test-start-cleanup.sh` (greps skill names, not version digits).
- **OD-3 — reference-file edits without a parent bump.** `design-brief-small-template.md` (parent: design-small-task) and `record-formats.md` (parent: finish-write-records) are edited, but the spec deliberately excludes those parents from AC-5.1. Reference files "ride the parent's bump," but the parents are not bumping. **Resolution: no bump for design-small-task / finish-write-records** — follow the spec's explicit AC-5.1 list. (Confirmed safe: their stamping/provenance tests grep the parent SKILL.md, not the reference files.)
- **OD-4 — design-brief-small-template upsize block (RESOLVED: delete entirely, no comment).** Purist verified neither design-committee nor design-grillme is an entry-point design skill, so no correct re-point target exists. **Resolution: delete the upsize block entirely — no gap comment in the body.** A gap comment is historical narration in the main body, which violates standalone-documentation discipline (current-state only). The rationale (no surviving upsize target) goes in the commit message, not the file.

---

## Task 1: Scrub plan-build + lockstep its tests (commit pair B)

**Type:** docs-producing
**Implements:** AC-1.3, AC-4.1, AC-5.1 (plan-build)
**Decision budget:** 2
**Must remain green:** `test-plan-build-heuristic.sh`, `test-stamping-plan-build.sh`

**Files:**
- Modify: `skills/plan-build/SKILL.md` — **five** design-large-task occurrences (round-04 researcher confirmed the draft's original four missed one): the canonical-sequence mention (~L43), the ground-truth cascade sentence (~L153-155), the spec-compatibility note (~L312), the Scope Check "proof loop" clause (~L67), **and the TaskCreate-reset example at ~L19** ("If any tasks exist from a previous skill (e.g., design-large-task)" → "(e.g., design-small-task)" — design-small-task is a real prior skill that creates tasks, so this is a factual re-point). Bump `version: v0005` → `v0006`. **All five must go or `grep -c → 0` returns 1.**
- Modify: `tests/test-plan-build-heuristic.sh` — remove the design-large-task cascade assertion block (~L62-68)
- Modify: `tests/test-stamping-plan-build.sh` — change the `v0005` version assertion to `v0006`

**Steps (TDD):**

- [ ] **Step 1: Establish the failing gate**

Run: `grep -c design-large-task skills/plan-build/SKILL.md`
Expected now: non-zero (the gate fails — references still present)

- [ ] **Step 2: Confirm the pinning tests currently pass at the old version**

Run: `bash tests/test-plan-build-heuristic.sh && bash tests/test-stamping-plan-build.sh`
Expected: both exit 0 (green before the change)

- [ ] **Step 3: Apply the scrub + bump + test edits together**

Edit `skills/plan-build/SKILL.md`: drop the large-task member from the canonical-sequence list (use the fixed wording from the Canonical-Sequence note), rewrite the cascade sentence to one sentence that keeps the rule and cites design-specify as the spec-stage report source, drop the section-count split from the spec-compat note (name design-small-task / human-authored specs), remove the "design-large-task's proof loop" clause from Scope Check, and change the TaskCreate-reset example at ~L19 to "(e.g., design-small-task)". Bump the version frontmatter to `v0006`.
Edit `tests/test-plan-build-heuristic.sh`: delete the cascade assertion block (~L62-68); leave all other assertions.
Edit `tests/test-stamping-plan-build.sh`: update the asserted version string to `v0006`.

- [ ] **Step 4: Run the gate and the tests to verify green**

Run: `grep -c design-large-task skills/plan-build/SKILL.md` → expect `0`
Run: `grep -c design-small-task skills/plan-build/SKILL.md` → expect `≥ 1`
Run: `bash tests/test-plan-build-heuristic.sh && bash tests/test-stamping-plan-build.sh` → both exit 0

- [ ] **Step 5: Commit**

```bash
git add skills/plan-build/SKILL.md tests/test-plan-build-heuristic.sh tests/test-stamping-plan-build.sh
git commit -m "refactor(plan-build): scrub design-large-task refs; bump v0006; lockstep tests"
```

---

## Task 2: Scrub util-artifact-schema + lockstep both schema tests (commit pair A)

**Type:** docs-producing
**Implements:** AC-2.1, AC-4.2, AC-4.3, AC-5.1 (util-artifact-schema)
**Decision budget:** 2
**Must remain green:** `test-artifact-schema.sh`, `test-artifact-schema-provenance.sh`

**Files:**
- Modify: `skills/util-artifact-schema/SKILL.md` — delete the design-row producer half + template-path note (~L107-109), the thinking-artifact row, the process-artifact row, and the stamping-list entry (~L206); leave the design-small-task producer; bump `version: v0002` → `v0003`
- Modify: `tests/test-artifact-schema.sh` — drop design-large-task from the producer loop (~L17)
- Modify: `tests/test-artifact-schema-provenance.sh` — drop design-large-task from the stamping-skill loop (~L24) AND update the version assertion `^version: v0002` → `v0003` (~L36)

**Steps (TDD):**

- [ ] **Step 1: Establish the failing gate**

Run: `grep -c design-large-task skills/util-artifact-schema/SKILL.md`
Expected now: non-zero

- [ ] **Step 2: Confirm both tests pass at the old version**

Run: `bash tests/test-artifact-schema.sh && bash tests/test-artifact-schema-provenance.sh`
Expected: both exit 0

- [ ] **Step 3: Apply the deletes + bump + both test edits together**

Edit the SKILL.md: remove the five large-task entries, substitute nothing for the producer half, keep the design-small-task producer; bump to `v0003`.
Edit `test-artifact-schema.sh`: remove design-large-task from the producer loop.
Edit `test-artifact-schema-provenance.sh`: remove design-large-task from the stamping loop AND flip the version assertion to `v0003`. **Both edits in this file are mandatory** — the version assertion breaks on the bump if not updated.

- [ ] **Step 4: Verify green**

Run: `grep -c design-large-task skills/util-artifact-schema/SKILL.md` → `0`
Run: `grep -c design-small-task skills/util-artifact-schema/SKILL.md` → `≥ 1`
Run: `bash tests/test-artifact-schema.sh && bash tests/test-artifact-schema-provenance.sh` → both exit 0

- [ ] **Step 5: Commit**

```bash
git add skills/util-artifact-schema/SKILL.md tests/test-artifact-schema.sh tests/test-artifact-schema-provenance.sh
git commit -m "refactor(util-artifact-schema): delete design-large-task entries; bump v0003; lockstep tests"
```

---

## Task 3: Delete fork-policy step-b rows + archive the orphaned test (commit pair C)

**Type:** docs-producing
**Implements:** AC-2.7, AC-4.4
**Decision budget:** 1
**Must remain green:** (none pin fork-policy; the archived test leaves the suite glob)

**Files:**
- Modify: `docs/fork-policy.md` — delete the step-b pole-agent rows 1a–1g (lines ~14-20); keep the table header and the plan-build-reviewer row as the new first data row
- Move: `git mv tests/test-ac-4-1-fork-policy-pole-rows.sh _archive/design-large-task/tests/`

**Steps (TDD):**

- [ ] **Step 1: Establish the failing gates**

Run: `grep -c design-large-task docs/fork-policy.md` (non-zero now) and `grep -c step-b docs/fork-policy.md` (non-zero now)

- [ ] **Step 2: Confirm the orphaned test currently passes**

Run: `bash tests/test-ac-4-1-fork-policy-pole-rows.sh`
Expected: exit 0 (it still pins the rows that exist now)

- [ ] **Step 3: Delete the rows and move the test**

Edit `docs/fork-policy.md`: remove rows 1a–1g; leave the header intact.

```bash
git mv tests/test-ac-4-1-fork-policy-pole-rows.sh _archive/design-large-task/tests/
```

- [ ] **Step 4: Verify**

Run: `grep -c design-large-task docs/fork-policy.md` → `0`
Run: `grep -c step-b docs/fork-policy.md` → `0`
Run: `[ ! -f tests/test-ac-4-1-fork-policy-pole-rows.sh ] && [ -f _archive/design-large-task/tests/test-ac-4-1-fork-policy-pole-rows.sh ] && echo OK` → `OK`

- [ ] **Step 5: Commit**

```bash
git add docs/fork-policy.md tests/test-ac-4-1-fork-policy-pole-rows.sh _archive/design-large-task/tests/test-ac-4-1-fork-policy-pole-rows.sh
git commit -m "refactor(fork-policy): delete dead step-b pole rows; archive pinning test"
```

---

## Task 4: Scrub start-bootstrap + util-design-partner-role together (two-pin lockstep)

**Type:** docs-producing
**Implements:** AC-1.4, AC-1.5, AC-2.2, AC-2.4, AC-5.1 (start-bootstrap + util-design-partner-role)
**Decision budget:** 3
**Must remain green:** `test-info-packet-style-version-bumps.sh`, `test-partner-role-overlay-section.sh`, `test-partner-role-discipline.sh`

**Files:**
- Modify: `skills/start-bootstrap/SKILL.md` — re-point the description caller list and the when-to-call list (drop design-large-task, name design-small-task as always-caller; list design-specify + execute-write as standalone callers); delete the dead design-large-task SKILL.md path in the skill-version description prose (~L92); bump `v0002` → `v0003`
- Modify: `skills/util-design-partner-role/SKILL.md` — re-point the intro line (~L9) to name design-small-task as reader; delete the capture-thought sentence (~L96); drop design-large-task from the description frontmatter (~L3); bump `v0004` → `v0005`
- Modify: `tests/test-info-packet-style-version-bumps.sh` — start-bootstrap assertion `v0002` → `v0003` (~L21); util-design-partner-role assertion `v0004` → `v0005` (~L20)
- Modify: `tests/test-partner-role-overlay-section.sh` — version assertion `^version: v0004$` → `v0005` (~L32)

**Why one commit:** `test-info-packet-style-version-bumps.sh` pins *both* skills' versions in a single run. Splitting start-bootstrap and util-design-partner-role into separate commits leaves the suite red between them (one skill bumped, the test still asserting the old pair).

**Steps (TDD):**

- [ ] **Step 1: Establish the failing gates**

Run: `grep -c design-large-task skills/start-bootstrap/SKILL.md` and `grep -c design-large-task skills/util-design-partner-role/SKILL.md` (both non-zero now)

- [ ] **Step 2: Confirm the three version-pinning tests pass at old versions**

Run: `bash tests/test-info-packet-style-version-bumps.sh && bash tests/test-partner-role-overlay-section.sh && bash tests/test-partner-role-discipline.sh`
Expected: all exit 0

- [ ] **Step 3: Apply both scrubs + both bumps + all three test edits in one change**

Edit both SKILL.md files per the Files block. **start-bootstrap has zero `design-small-task` occurrences today** — its re-point is an explicit **insert**: name design-small-task as the always-caller in both the description caller list and the when-to-call list (and list design-specify + execute-write as standalone callers). Deletion alone leaves the AC-1.4 presence check failing.

Edit the **two** named version-assertion tests: `tests/test-info-packet-style-version-bumps.sh` (L21 start-bootstrap v0002→v0003; L20 util-design-partner-role v0004→v0005) **and** `tests/test-partner-role-overlay-section.sh` (L32 v0004→v0005). The `design-small-task` assertion (v0003) in test-info-packet-style-version-bumps.sh is **correct and unchanged** — design-small-task is not bumped this sprint; do not touch it.

`test-partner-role-discipline.sh` needs no edit (it checks the C1/C2 sections, not the intro line or capture-thought sentence) — it is listed as must-remain-green to confirm the scrub didn't disturb those sections.

- [ ] **Step 4: Verify green**

Run: `grep -c design-large-task skills/start-bootstrap/SKILL.md` → `0`; `grep -c design-large-task skills/util-design-partner-role/SKILL.md` → `0`
Run (start-bootstrap presence — insert landed): `grep -c design-small-task skills/start-bootstrap/SKILL.md` → `≥ 1`
Run (util-design-partner-role **intro-line** presence — a file-wide count is insufficient because the surviving capture-thought sentence at L96 keeps the count positive even if the intro re-point is skipped): `grep -q "design-small-task" skills/util-design-partner-role/SKILL.md` on the **intro line specifically** — confirm the intro line (~L9) now names design-small-task as the reader, not "both" / design-large-task.
Run: `bash tests/test-info-packet-style-version-bumps.sh && bash tests/test-partner-role-overlay-section.sh && bash tests/test-partner-role-discipline.sh` → all exit 0

- [ ] **Step 5: Commit**

```bash
git add skills/start-bootstrap/SKILL.md skills/util-design-partner-role/SKILL.md tests/test-info-packet-style-version-bumps.sh tests/test-partner-role-overlay-section.sh
git commit -m "refactor(start-bootstrap,partner-role): scrub design-large-task; bump versions; lockstep tests"
```

---

## Task 5: Scrub design-specify + lockstep its stamping test

**Type:** docs-producing
**Implements:** AC-1.2, AC-2.3, AC-5.1 (design-specify)
**Decision budget:** 2
**Must remain green:** `test-stamping-design-specify.sh`, `test-no-archived-refs.sh`

**Files:**
- Modify: `skills/design-specify/SKILL.md` — re-point description (L3), entry condition (L18), standalone note (L48), invoked-by (**L236**, not 237); delete the dead design-large-task template path in the Reads section (~L235); bump `v0003` → `v0004`
- Modify: `tests/test-stamping-design-specify.sh` — version assertion `v0003` → `v0004`

**Steps (TDD):**

- [ ] **Step 1: Establish the failing gate** — `grep -c design-large-task skills/design-specify/SKILL.md` (non-zero now)
- [ ] **Step 2: Confirm tests pass** — `bash tests/test-stamping-design-specify.sh && bash tests/test-no-archived-refs.sh` → exit 0 (test-no-archived-refs checks design-figure-out only; stays green either way)
- [ ] **Step 3: Apply scrub + bump + test edit** — re-point the four entry-path locations to design-small-task, delete the dead template path from Reads, bump to `v0004`, flip the stamping assertion to `v0004`
- [ ] **Step 4: Verify** — `grep -c design-large-task skills/design-specify/SKILL.md` → `0`; `grep -c design-small-task skills/design-specify/SKILL.md` → `≥ 1`; `bash tests/test-stamping-design-specify.sh` → exit 0
- [ ] **Step 5: Commit**

```bash
git add skills/design-specify/SKILL.md tests/test-stamping-design-specify.sh
git commit -m "refactor(design-specify): re-point entry path to design-small-task; bump v0004; lockstep test"
```

---

## Task 6: Scrub execute-write + lockstep its stamping test

**Type:** docs-producing
**Implements:** AC-1.1, AC-5.1 (execute-write)
**Decision budget:** 1
**Must remain green:** `test-stamping-execute-write.sh`

**Files:**
- Modify: `skills/execute-write/SKILL.md` — re-point the worktree-creation sentence and the canonical-sequence mention (~L23) to design-small-task; bump `v0007` → `v0008`
- Modify: `tests/test-stamping-execute-write.sh` — version assertion `v0007` → `v0008`

**Steps (TDD):**

- [ ] **Step 1: Failing gate** — `grep -c design-large-task skills/execute-write/SKILL.md` (non-zero now)
- [ ] **Step 2: Confirm test passes** — `bash tests/test-stamping-execute-write.sh` → exit 0
- [ ] **Step 3: Apply** — re-point both mentions (the sentence names design-small-task at closure as worktree creator; the sequence drops the large-task member), bump to `v0008`, flip the stamping assertion
- [ ] **Step 4: Verify** — `grep -c design-large-task skills/execute-write/SKILL.md` → `0`; `grep -c design-small-task skills/execute-write/SKILL.md` → `≥ 1`; `bash tests/test-stamping-execute-write.sh` → exit 0
- [ ] **Step 5: Commit**

```bash
git add skills/execute-write/SKILL.md tests/test-stamping-execute-write.sh
git commit -m "refactor(execute-write): re-point worktree-creation to design-small-task; bump v0008; lockstep test"
```

---

## Task 7: Collapsed uncoupled deletes + archives (util-worktree, agent, two reference files)

**Type:** docs-producing
**Implements:** AC-1.6, AC-2.5, AC-2.6, AC-3.1, AC-5.1 (util-worktree)
**Decision budget:** 2
**Must remain green:** `test-stamping-design-small-task.sh`, `test-finish-write-records-provenance.sh`

**Files:**
- Modify: `skills/util-worktree/SKILL.md` — remove the design-large-task caller bullet in Integration (~L199); ensure the surviving worktree-creation obligation names design-small-task at closure; bump `v0001` → `v0002`
- Move: `git mv agents/agent-industry-explorer.md _archive/design-large-task/`
- Modify: `skills/design-small-task/references/design-brief-small-template.md` — delete the upsize block (~L20-24) **entirely, no gap comment** (OD-4 resolved — rationale goes in the commit message, not the body); rewrite the archived-template reference (~L138-139) and the intro/closing mentions (~L5/L9/L152) to remove every design-large-task occurrence
- Modify: `skills/finish-write-records/references/record-formats.md` — **four occurrences, per-occurrence treatment** (OD-1 resolved): L193 stage-enum → delete entry; L68 (inside `Session Skill Versions` block) → remove **only that line**, leave the block heading intact; L213 parenthetical → delete the design-large-task clause; L229 example stage field → update to a surviving skill name. All four must go to reach grep-zero.

**Steps (TDD):**

- [ ] **Step 1: Failing gates**

Run: `grep -c design-large-task skills/util-worktree/SKILL.md`, `… skills/design-small-task/references/design-brief-small-template.md`, `… skills/finish-write-records/references/record-formats.md` (all non-zero now); `[ -f agents/agent-industry-explorer.md ]` (true now)

- [ ] **Step 2: Confirm the proximate provenance tests pass** — `bash tests/test-stamping-design-small-task.sh && bash tests/test-finish-write-records-provenance.sh` → exit 0 (both grep their parent SKILL.md, not the reference files; stay green)
- [ ] **Step 3: Apply the four edits + two moves**

Edit util-worktree (remove the design-large-task caller bullet, confirm the surviving obligation names design-small-task, bump v0002). `git mv` the agent. Edit design-brief-small-template (delete upsize block entirely — **no gap comment** — + scrub remaining hits). Edit record-formats per the four per-occurrence rulings in the Files block — in particular **remove only L68, never the surrounding `Session Skill Versions` block** (`test-finish-write-records-provenance` greps that heading). **Do not bump design-small-task or finish-write-records** (OD-3 — their SKILL.md bodies are untouched; AC-5.1 excludes them).

- [ ] **Step 4: Verify**

Run: `grep -c design-large-task skills/util-worktree/SKILL.md` → `0`; `… design-brief-small-template.md` → `0`; `… record-formats.md` → `0`
Run (util-worktree presence — AC-1.6 requires the surviving obligation to name design-small-task; the absence check alone is insufficient): `grep -c design-small-task skills/util-worktree/SKILL.md` → `≥ 1`
Run: `[ ! -f agents/agent-industry-explorer.md ] && [ -f _archive/design-large-task/agent-industry-explorer.md ] && echo OK` → `OK`
Run: `bash tests/test-stamping-design-small-task.sh && bash tests/test-finish-write-records-provenance.sh` → exit 0

- [ ] **Step 5: Commit**

```bash
git add skills/util-worktree/SKILL.md agents/agent-industry-explorer.md _archive/design-large-task/agent-industry-explorer.md skills/design-small-task/references/design-brief-small-template.md skills/finish-write-records/references/record-formats.md
git commit -m "refactor: scrub util-worktree + reference files; archive agent-industry-explorer

Upsize block removed without replacement — no surviving entry-point design
skill fills the design-large-task role (design-committee and design-grillme
are not entry-point design skills). An honest gap beats a wrong pointer."
```

---

## Task 8: setup-start — verify AC-1.7 gate, conditional skill-index sync, version bump

**Type:** docs-producing
**Implements:** AC-1.7, AC-5.1 (setup-start)
**Decision budget:** 1
**Must remain green:** `test-start-cleanup.sh`, `test-partner-role-overlay-section.sh`

**Round-04 reframe (IMPORTANT-2).** AC-1.7's absence gate is **already satisfied** at HEAD — both `setup-start/SKILL.md` and `skill-index.md` are grep-zero. The skill-index entries are **independent summaries, not mirrors** of the description frontmatter, so the "description sync" may be a no-op. This task is therefore: (1) confirm the gate, (2) sync the two entries **only if** they carry caller text that became stale from Tasks 4/5, (3) bump setup-start's version frontmatter (precautionary, per AC-5.1 / OD-2). If step (2) is a no-op, the task reduces to the bump — that is acceptable and expected; do not invent an edit.

**Files:**
- Modify (conditional): `skills/setup-start/references/skill-index.md` — sync the start-bootstrap entry (~L25) and the design-specify entry (~L28) **only if** their text names a caller relationship that Tasks 4/5 changed. **Do NOT touch the util-design-partner-role entry at ~L56** — `test-partner-role-overlay-section.sh` greps that exact line for "info-packet style overlay"; disturbing it fails that test.
- Modify: `skills/setup-start/SKILL.md` — bump the version frontmatter line only (per AC-5.1 / OD-2; precautionary frontmatter edit). **Do not touch the SKILL.md body** — `test-start-cleanup.sh` asserts design-specify is absent from it.

**Depends on:** Tasks 4 and 5 (reads their finalized descriptions to judge whether the skill-index entries need a sync). Land after both.

**Steps (TDD):**

- [ ] **Step 1: Confirm AC-1.7's absence gate is already satisfied** — `grep -c design-large-task skills/setup-start/SKILL.md` → `0`; `grep -c design-large-task skills/setup-start/references/skill-index.md` → `0`
- [ ] **Step 2: Confirm both pinning tests pass** — `bash tests/test-start-cleanup.sh && bash tests/test-partner-role-overlay-section.sh` → exit 0
- [ ] **Step 3: Read skill-index L25 and L28; decide** — if either entry carries stale caller text from the Task 4/5 description changes, edit it to match. If neither does (likely — they are independent summaries), make no skill-index edit. Either way, bump `skills/setup-start/SKILL.md` version frontmatter by one. **Do not touch skill-index L56.**
- [ ] **Step 4: Verify** — `bash tests/test-start-cleanup.sh && bash tests/test-partner-role-overlay-section.sh` → both exit 0; `grep -c design-specify skills/setup-start/SKILL.md` unchanged from baseline (body untouched)
- [ ] **Step 5: Commit**

```bash
git add skills/setup-start/SKILL.md  # add skills/setup-start/references/skill-index.md only if it was edited
git commit -m "docs(setup-start): bump version; sync skill-index entries if stale"
```

---

## Task 9: Rewrite docs/instructions.md (four-zone targeted deletion)

**Type:** docs-producing
**Implements:** AC-2.8
**Decision budget:** 3
**Must remain green:** (no test pins instructions.md)

**Files:**
- Modify: `docs/instructions.md` — four hit zones (read the full file before editing; the budget is zone-boundary identification, not prose reconstruction):
  - **Zone 1** — inline name removals (~L31, L168, L211): one-line substitution, no section rewrite
  - **Zone 2** — dead MCP install blocks: delete the entire block, substitute nothing
  - **Zone 3** — full skill description sections (design-large-task ~L219-247; design-figure-out ~L273-295): block-delete the entire `###` section
  - **Zone 4** — comparison and reference table rows: remove the two design-large-task / design-figure-out rows, leave surviving rows untouched
  - Ensure the surviving design path is described accurately: **design-small-task → design-specify** (design-small-task feeds design-specify, not plan-build directly)

**Steps (TDD):**

- [ ] **Step 1: Failing gates** — `grep -c design-large-task docs/instructions.md` (non-zero now); `grep -ci "design-figure-out\|DFO" docs/instructions.md` (non-zero now)
- [ ] **Step 2: Read the full file** — identify the four zones and their exact boundaries before editing
- [ ] **Step 3: Apply the four-zone deletion** — per the Files block; correct the design-small-task → design-specify flow description
- [ ] **Step 4: Verify** — `grep -c design-large-task docs/instructions.md` → `0`; `grep -ci "design-figure-out\|DFO" docs/instructions.md` → `0`; read the design section once to confirm current-state accuracy (no historical narration in the body — change log only)
- [ ] **Step 5: Commit**

```bash
git add docs/instructions.md
git commit -m "docs(instructions): rewrite design section to current state; drop design-large-task + design-figure-out"
```

---

## Task 10: Sprint capstone — full suite green

**Type:** config-producing (verification only; no file change)
**Implements:** AC-6.1
**Decision budget:** 0
**Must remain green:** the entire `tests/test-*.sh` suite

**Depends on:** Tasks 1–9 all landed.

**Steps (TDD):**

- [ ] **Step 1: Run the full suite**

```bash
for t in tests/test-*.sh; do bash "$t" || echo "FAIL: $t"; done
```

- [ ] **Step 2: Confirm zero sprint-attributable failures** — no `FAIL:` line for any test this sprint touched or any test that pins a scrubbed/bumped file. Pre-existing unrelated failures (if any) must be unchanged base-to-HEAD; record them explicitly.
- [ ] **Step 3: Record the result** — capture the pass count and any pre-existing failures in the execute-write completion notes
- [ ] **Step 4: Checkpoint** (handled by execute-verify-complete)

```bash
git commit --allow-empty -m "checkpoint: design-large-task removal complete, suite green"
```

---

## Execution Mode Rationale

Heuristic computed against this 10-task plan (subagent unless all four conditions hold):

- Condition 1 — task count ≤ 3: **fail** (10 tasks)
- Condition 2 — threat risk ≤ Moderate: **pass** (documentation/test scrub, no runtime change; smell did not fire)
- Condition 3 — sum of decision budgets ≤ 4: **fail** (sum = 17: T1=2, T2=2, T3=1, T4=3, T5=2, T6=1, T7=2, T8=1, T9=3, T10=0)
- Condition 4 — no multi-file code-producing task: **pass, vacuous** (zero code-producing tasks)

Two conditions fail independently → **subagent**. Per-task spec review is the safety net that catches a scrub touching the wrong assertion or missing the second version-pin in a two-test commit; the extra dispatch cost is cheap for documentation edits.

## AC → Task Coverage (all 24 ACs homed; no orphan tasks)

- AC-1.1 → T6 · AC-1.2 → T5 · AC-1.3 → T1 · AC-1.4 → T4 · AC-1.5 → T4 · AC-1.6 → T7 · AC-1.7 → T8
- AC-2.1 → T2 · AC-2.2 → T4 · AC-2.3 → T5 · AC-2.4 → T4 · AC-2.5 → T7 · AC-2.6 → T7 · AC-2.7 → T3 · AC-2.8 → T9
- AC-3.1 → T7
- AC-4.1 → T1 · AC-4.2 → T2 · AC-4.3 → T2 · AC-4.4 → T3
- AC-5.1 → T1, T2, T4, T5, T6, T7, T8 (all eight skills)
- AC-6.1 → T10

## Ordering

No required ordering among Tasks 1–7 and 9. Task 8 lands after Tasks 4 and 5 (reads their finalized descriptions). Task 10 (capstone) is last and depends on all others. Conservator's recommended sequence for the most conservative green path: lock the test-pinned tasks first (T1, T2, T3, T4), then the remaining scrubs (T5, T6, T7, T8, T9), then T10.

---

### Change log

- 2026-06-05 — Draft authored by the design-committee (round 03 develop). By-commit-unit decomposition synthesized from conservator's lockstep-pairing analysis, corrected with researcher's ground truth (9 version-pinning assertions across 7 test files; setup-start already grep-zero with skill-index description-sync as the real work; design-specify invoked-by L236; new per-file hits beyond the spec's line lists). Purist AC-trace (24/24 homed), pragmatist budgets + subagent mode, innovator four-zone instructions handling. Four Open Decisions (OD-1..4) flagged for the designer and round 04 attack.
- 2026-06-05 — Hardened by the design-committee (round 04 attack; plan-attack only — smell pre-check matched zero triggers, so plan-smell did not fire). Folded in: **blocker** — plan-build L19 (5th occurrence; draft would have failed AC-1.3 grep-zero). **Presence-check defects** — AC-1.4 start-bootstrap requires an explicit insert (zero design-small-task today); AC-1.5/1.6 need targeted intro-line greps, not file-wide counts (surviving sentences keep the count positive). **OD-1 resolved per-occurrence** (purist category ruling + conservator surgical-L68 hazard inside the `Session Skill Versions` block). **OD-4 resolved** — upsize block deleted entirely, no gap comment (standalone-doc discipline); rationale moved to commit message. **Task 8 reframed** (Innovator) — gate already satisfied, skill-index sync conditional, version bump relabeled precautionary; added `test-partner-role-overlay-section` to must-remain-green and the L56 no-touch hazard (Conservator). **Canonical-sequence wording fixed** verbatim to prevent inconsistent re-pointing (Innovator). Plus prose clarifications (named version-test files in Task 4; unchanged design-small-task v0003 assertion; L193 added to Task 7 steps). Combined risk: **Low** after hardening — no structural/lockstep defect (conservator certified the 10-commit walk green-by-construction); all findings were task-prose precision gaps.

<!-- created-at: 2026-06-05T11:04:44Z -->
<!-- produced-by plan-build@v0005 -->
