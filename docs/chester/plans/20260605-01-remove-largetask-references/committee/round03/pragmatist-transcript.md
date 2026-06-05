# Pragmatist — Round 03 Transcript

**Sprint:** 20260605-01-remove-largetask-references
**Role:** Pragmatist
**Dimension:** Task decomposition, decision budgets, execution mode recommendation
**Path:** A (ratified)

---

## Grounding

Read the approved spec (24 ACs, 6 groups), the plan template, and confirmed hit counts
per target file from disk. Task decomposition is driven by the lockstep constraint: a
scrub and its pinning test edit must land in the same commit. No intermediate commit may
leave the suite red.

Hit counts confirmed from disk:
- execute-write: 1 hit
- design-specify: 5 hits
- plan-build: 5 hits
- start-bootstrap: 3 hits
- util-design-partner-role: 3 hits
- util-worktree: 1 hit
- setup-start: 0 hits (sync target only — descriptions must match)
- util-artifact-schema: 4 hits
- design-brief-small-template: 6 hits
- record-formats: 4 hits
- fork-policy: 7 hits
- instructions.md: 25 hits (+ design-figure-out hits)
- agent-industry-explorer: 1 hit

---

## Task Decomposition Rationale

The lockstep constraint says: scrub + its pinning test edit = one safe commit unit.
Three of the four tests pin specific files:
- test-plan-build-heuristic pins plan-build
- test-artifact-schema pins util-artifact-schema
- test-artifact-schema-provenance pins util-artifact-schema (same file)
- test-ac-4-1-fork-policy-pole-rows pins fork-policy

This gives three mandatory "atomic pairs":
- pair A: util-artifact-schema edit + both artifact-schema tests (they pin the same file)
- pair B: plan-build edit + test-plan-build-heuristic
- pair C: fork-policy edit + archive test-ac-4-1

All other scrub targets (execute-write, design-specify, start-bootstrap,
util-design-partner-role, util-worktree, setup-start, design-brief-small-template,
record-formats, agent-industry-explorer, instructions.md) have no pinning test — they
can be grouped freely. The pragmatist rule: cluster them by natural file proximity and
keep individual tasks small enough to complete in minutes.

Version bumps ride with their parent skill edit — no separate task needed.

**Result: six tasks.**

---

## Task List

### Task 1: Scrub the pipeline-entry skills

Scrub all re-point targets that have no pinning test: execute-write, design-specify,
start-bootstrap, util-design-partner-role, util-worktree. Also delete the dead template
path from design-specify (AC-2.3) and the dead SKILL.md path from start-bootstrap
(AC-2.4) and the capture-thought sentence from util-design-partner-role (AC-2.2). Bump
versions on all five skills. These files are independent — no test pins them, so they
can land in one commit safely.

**Type:** docs-producing
**Implements:** AC-1.1, AC-1.2, AC-1.3 (partial — plan-build reserved for Task 3),
AC-1.4, AC-1.5, AC-1.6, AC-2.2, AC-2.3, AC-2.4, AC-5.1 (partial — bumps for
execute-write, design-specify, start-bootstrap, util-design-partner-role, util-worktree)
**Decision budget:** 2
**Must remain green:** all tests not touching these files (which is all of them — none
pin these files)

**Files:**
- Modify: `skills/execute-write/SKILL.md` (1 hit — worktree-creation parenthetical)
- Modify: `skills/design-specify/SKILL.md` (5 hits — description, entry condition,
  standalone note, Reads dead path, invoked-by)
- Modify: `skills/start-bootstrap/SKILL.md` (3 hits — description caller list,
  when-to-call, dead SKILL.md path in prose)
- Modify: `skills/util-design-partner-role/SKILL.md` (3 hits — intro line,
  capture-thought sentence)
- Modify: `skills/util-worktree/SKILL.md` (1 hit — Integration caller bullet)

**Steps (TDD — docs edits, no code; adapt to file-edit + grep-verify pattern):**

- [ ] **Step 1: For each file, grep to confirm hits before editing**

```bash
cd /path/to/worktree
for f in skills/execute-write/SKILL.md skills/design-specify/SKILL.md \
          skills/start-bootstrap/SKILL.md skills/util-design-partner-role/SKILL.md \
          skills/util-worktree/SKILL.md; do
  echo "$(grep -c design-large-task "$f") $f"
done
```
Expected: non-zero counts matching the grounding numbers above.

- [ ] **Step 2: Edit each file — re-point and delete per spec**

For each file, apply the changes described in its AC. Rules:
- Re-point: drop `design-large-task` from the clause, keep `design-small-task`.
- Delete: remove the sentence or path entirely.
- Bump: increment version frontmatter by one.
Exact edits per file derived from spec ACs 1.1–1.6, 2.2, 2.3, 2.4.

- [ ] **Step 3: Verify all hits gone and surviving references correct**

```bash
for f in skills/execute-write/SKILL.md skills/design-specify/SKILL.md \
          skills/start-bootstrap/SKILL.md skills/util-design-partner-role/SKILL.md \
          skills/util-worktree/SKILL.md; do
  COUNT=$(grep -c design-large-task "$f" || true)
  echo "$COUNT $f"
done
# Expect: all 0
grep -c design-small-task skills/execute-write/SKILL.md       # ≥ 1
grep -c design-small-task skills/design-specify/SKILL.md      # ≥ 1
grep -c design-small-task skills/start-bootstrap/SKILL.md     # ≥ 1
grep -c design-small-task skills/util-design-partner-role/SKILL.md  # ≥ 1
```

- [ ] **Step 4: Run full suite to confirm green**

```bash
for t in tests/test-*.sh; do bash "$t" || echo "FAIL: $t"; done
```
Expected: no FAIL lines (test-plan-build-heuristic will still fail until Task 3 —
this step confirms the other tests are not affected).

*Note: test-plan-build-heuristic will fail after this task because plan-build still
contains design-large-task. Do not commit until Task 3 is also done, OR commit this
task and accept one temporarily-failing test on the branch (not on main). The safest
approach: batch Tasks 1–3 as three commits on the branch, run the full suite after
Task 3 before pushing.*

- [ ] **Step 5: Commit**

```bash
git add skills/execute-write/SKILL.md skills/design-specify/SKILL.md \
        skills/start-bootstrap/SKILL.md skills/util-design-partner-role/SKILL.md \
        skills/util-worktree/SKILL.md
git commit -m "fix: re-point pipeline-entry skills from design-large-task to design-small-task"
```

---

### Task 2: Sync setup-start available-skills list

Update the setup-start available-skills list entries for start-bootstrap and
design-specify to match their updated descriptions. No design-large-task hits exist
in setup-start currently (confirmed: 0 hits), but the two-place-sync rule requires
their entries to match the updated SKILL.md descriptions. Bump setup-start version.

**Type:** docs-producing
**Implements:** AC-1.7, AC-5.1 (setup-start bump)
**Decision budget:** 1
**Must remain green:** all tests (none pin setup-start)

**Files:**
- Modify: `skills/setup-start/SKILL.md` (sync start-bootstrap + design-specify entries)

**Steps:**

- [ ] **Step 1: Read the updated descriptions from Task 1 results**

```bash
grep -A2 "^description:" skills/start-bootstrap/SKILL.md
grep -A2 "^description:" skills/design-specify/SKILL.md
```

- [ ] **Step 2: Find and update the matching entries in setup-start**

```bash
grep -n "start-bootstrap\|design-specify" skills/setup-start/SKILL.md
```
Update each entry's description to match. Bump version (v0001 → v0002).

- [ ] **Step 3: Verify no design-large-task in setup-start**

```bash
grep -c design-large-task skills/setup-start/SKILL.md
# Expect: 0
```

- [ ] **Step 4: Run full suite**

```bash
for t in tests/test-*.sh; do bash "$t" || echo "FAIL: $t"; done
```
Expected: still only test-plan-build-heuristic failing (from Task 1, pending Task 3).

- [ ] **Step 5: Commit**

```bash
git add skills/setup-start/SKILL.md
git commit -m "fix: sync setup-start available-skills list to updated skill descriptions"
```

---

### Task 3: Scrub plan-build + update test-plan-build-heuristic (lockstep pair B)

The lockstep pair: edit plan-build and remove the pinning assertion from
test-plan-build-heuristic in the same commit. After this commit, the suite is fully
green for the tests that pin plan-build.

**Type:** docs-producing
**Implements:** AC-1.3, AC-4.1, AC-5.1 (plan-build bump)
**Decision budget:** 1
**Must remain green:** `test-plan-build-heuristic` (must pass after this commit)

**Files:**
- Modify: `skills/plan-build/SKILL.md` (5 hits — canonical-sequence mention, ground-truth
  cascade sentence, spec-compat note, task-reset example, scope-check mention)
- Modify: `tests/test-plan-build-heuristic.sh` (remove stale assertion block)

**Steps:**

- [ ] **Step 1: Confirm plan-build hits before editing**

```bash
grep -n "design-large-task" skills/plan-build/SKILL.md
# Expect: 5 lines
```

- [ ] **Step 2: Edit plan-build — re-point and trim per AC-1.3**

Per spec AC-1.3: drop large-task from canonical-sequence mention, rewrite the
ground-truth cascade sentence (keep the rule, drop the large-task clause), and
update the spec-compat note. Also remove the task-reset example and scope-check
mention. Bump version v0005 → v0006.

- [ ] **Step 3: Remove the stale assertion block from the test**

The block to remove from `tests/test-plan-build-heuristic.sh`:
```bash
# Must reference design-large-task in the ground-truth cascade context
# (the cascade survives through design-specify because both write into the same
# sprint subdirectory)
if ! grep -q "design-large-task" "$SKILL"; then
  echo "FAIL: $SKILL does not reference design-large-task in cascade context"
  ERRORS=$((ERRORS + 1))
fi
```
Remove these lines. All other assertions remain.

- [ ] **Step 4: Verify plan-build clean and test passes**

```bash
grep -c design-large-task skills/plan-build/SKILL.md
# Expect: 0
bash tests/test-plan-build-heuristic.sh
# Expect: PASS: plan-build heuristic and cascade structure correct
```

- [ ] **Step 5: Commit**

```bash
git add skills/plan-build/SKILL.md tests/test-plan-build-heuristic.sh
git commit -m "fix: remove design-large-task from plan-build + update pinning test (lockstep)"
```

---

### Task 4: Scrub util-artifact-schema + update both artifact-schema tests (lockstep pair A)

The lockstep pair: edit util-artifact-schema and update both artifact-schema tests in
the same commit. Two tests pin the same file, so all three changes land together.
The version bump (v0002 → v0003) triggers the version assertion update in
test-artifact-schema-provenance.

**Type:** docs-producing
**Implements:** AC-2.1, AC-4.2, AC-4.3, AC-5.1 (util-artifact-schema bump)
**Decision budget:** 2
**Must remain green:** `test-artifact-schema`, `test-artifact-schema-provenance`

**Files:**
- Modify: `skills/util-artifact-schema/SKILL.md` (4 hits — design-row producer half +
  template-path note, thinking-artifact row, process-artifact row, stamping-list entry;
  plus version bump v0002 → v0003)
- Modify: `tests/test-artifact-schema.sh` (remove "design-large-task" from producer loop)
- Modify: `tests/test-artifact-schema-provenance.sh` (remove from stamping loop; update
  version assertion v0002 → v0003)

**Steps:**

- [ ] **Step 1: Confirm schema hits before editing**

```bash
grep -n "design-large-task" skills/util-artifact-schema/SKILL.md
# Expect: 4 lines
grep -n "version:" skills/util-artifact-schema/SKILL.md | head -1
# Expect: version: v0002
```

- [ ] **Step 2: Edit util-artifact-schema per AC-2.1**

Remove: design-row producer half + template-path note, thinking-artifact row,
process-artifact row, stamping-list entry. Bump version v0002 → v0003.
Verify design-small-task still present as producer.

- [ ] **Step 3: Edit test-artifact-schema — remove design-large-task from producer loop**

Change the for loop from:
```bash
for producer in "design-large-task" "design-small-task" "design-specify" "plan-build" "execute-write" "finish-write-records"; do
```
To:
```bash
for producer in "design-small-task" "design-specify" "plan-build" "execute-write" "finish-write-records"; do
```

- [ ] **Step 4: Edit test-artifact-schema-provenance — two changes**

(a) Remove design-large-task from the stamping loop:
```bash
# Old:
for skill in design-large-task design-small-task design-specify plan-build execute-write finish-write-records; do
# New:
for skill in design-small-task design-specify plan-build execute-write finish-write-records; do
```

(b) Update the version assertion:
```bash
# Old:
grep -q '^version: v0002' "$SCHEMA" || fail "version not bumped to v0002"
# New:
grep -q '^version: v0003' "$SCHEMA" || fail "version not bumped to v0003"
```

- [ ] **Step 5: Verify schema clean and both tests pass**

```bash
grep -c design-large-task skills/util-artifact-schema/SKILL.md
# Expect: 0
grep -c design-small-task skills/util-artifact-schema/SKILL.md
# Expect: ≥ 1
bash tests/test-artifact-schema.sh
# Expect: PASS: artifact schema correct
bash tests/test-artifact-schema-provenance.sh
# Expect: PASS: provenance convention documented
```

- [ ] **Step 6: Commit**

```bash
git add skills/util-artifact-schema/SKILL.md \
        tests/test-artifact-schema.sh \
        tests/test-artifact-schema-provenance.sh
git commit -m "fix: remove design-large-task from artifact schema + update pinning tests (lockstep)"
```

---

### Task 5: Delete fork-policy step-b rows + archive test-ac-4-1 (lockstep pair C) + remaining delete targets

Bundle the fork-policy deletion and its test archive with the remaining delete-only
targets (design-brief-small-template, record-formats) and the agent archive. None of
these have pinning tests beyond test-ac-4-1, and grouping them keeps the commit
count low without creating ordering hazard.

**Type:** docs-producing
**Implements:** AC-2.5, AC-2.6, AC-2.7, AC-3.1, AC-4.4, AC-5.1 (util-worktree — already
bumped in Task 1; no additional bumps here since design-brief-small-template and
record-formats ride their parent skill bumps from Tasks 1 and another edit in this task)
**Decision budget:** 1
**Must remain green:** all surviving tests (test-ac-4-1 will be removed from tests/)

**Files:**
- Modify: `docs/fork-policy.md` (remove rows 1a–1g — 7 hits)
- Move: `tests/test-ac-4-1-fork-policy-pole-rows.sh` →
  `_archive/design-large-task/tests/test-ac-4-1-fork-policy-pole-rows.sh`
- Modify: `skills/design-small-task/references/design-brief-small-template.md`
  (remove use-the-full-template upsize block + archived-template reference — 6 hits)
- Modify: `skills/finish-write-records/references/record-formats.md`
  (remove stage-enum entry — 4 hits)
- Move: `agents/agent-industry-explorer.md` →
  `_archive/design-large-task/agent-industry-explorer.md`

**Steps:**

- [ ] **Step 1: Confirm _archive/design-large-task/tests/ exists**

```bash
ls _archive/design-large-task/tests/
# Expect: the 27 previously archived tests (from commit 5a800e5)
```

- [ ] **Step 2: Move the test file to archive**

```bash
git mv tests/test-ac-4-1-fork-policy-pole-rows.sh \
       _archive/design-large-task/tests/test-ac-4-1-fork-policy-pole-rows.sh
```

- [ ] **Step 3: Move the agent file to archive**

```bash
git mv agents/agent-industry-explorer.md \
       _archive/design-large-task/agent-industry-explorer.md
```

- [ ] **Step 4: Edit fork-policy.md — remove rows 1a–1g**

The rows to remove span `design-large-task` codebase explorer through
`design-large-task` step-b pragmatist. After removal, the plan-build-reviewer row
becomes the first data row. No renumbering required (spec AC-2.7 confirms this).
Verify: `grep -c step-b docs/fork-policy.md` → 0.

- [ ] **Step 5: Edit design-brief-small-template — remove upsize block per AC-2.5**

Remove the "Use the full design-large-task template when:" block and the
archived-template reference. Replace the upsize pointer with a one-line note naming
design-committee / design-grillme as the surviving heavier-weight option.

- [ ] **Step 6: Edit record-formats — remove stage-enum entry per AC-2.6**

Remove `design-large-task` from the stage enum. Verify:
`grep -c design-large-task skills/finish-write-records/references/record-formats.md` → 0.

- [ ] **Step 7: Verify archive conditions and file cleanliness**

```bash
# AC-3.1: agent archived
[ ! -f agents/agent-industry-explorer.md ] && echo "OK" || echo "FAIL"
[ -f _archive/design-large-task/agent-industry-explorer.md ] && echo "OK" || echo "FAIL"
# AC-4.4: test archived
[ ! -f tests/test-ac-4-1-fork-policy-pole-rows.sh ] && echo "OK" || echo "FAIL"
[ -f _archive/design-large-task/tests/test-ac-4-1-fork-policy-pole-rows.sh ] && echo "OK" || echo "FAIL"
# AC-2.7: fork-policy clean
grep -c design-large-task docs/fork-policy.md   # Expect: 0
grep -c step-b docs/fork-policy.md              # Expect: 0
```

- [ ] **Step 8: Run surviving suite**

```bash
for t in tests/test-*.sh; do bash "$t" || echo "FAIL: $t"; done
# Expect: no FAIL lines (test-ac-4-1 is no longer in tests/)
```

- [ ] **Step 9: Commit**

```bash
git add docs/fork-policy.md \
        skills/design-small-task/references/design-brief-small-template.md \
        skills/finish-write-records/references/record-formats.md
git add _archive/design-large-task/agent-industry-explorer.md \
        _archive/design-large-task/tests/test-ac-4-1-fork-policy-pole-rows.sh
# git mv already staged the removes from agents/ and tests/
git commit -m "fix: delete step-b fork-policy rows, archive orphaned agent + test, scrub remaining delete targets"
```

---

### Task 6: Rewrite docs/instructions.md design section + terminal suite gate

Rewrite the design-large-task section, the design-figure-out section, the comparison
table rows, and the scattered pipeline mentions as current-state. This is the heaviest
single-file task (25 design-large-task hits + figure-out hits). No pinning test pins
this file, so it can land in its own commit. After this commit, run the terminal AC-6.1
gate.

**Type:** docs-producing
**Implements:** AC-2.8, AC-6.1 (terminal gate run here)
**Decision budget:** 3
**Must remain green:** all tests

**Files:**
- Modify: `docs/instructions.md` (25+ hits spanning design section, MCP setup,
  comparison table, skill reference table, pipeline description)

**Steps:**

- [ ] **Step 1: Read the full design section of instructions.md**

```bash
grep -n "design-large-task\|design-figure-out" docs/instructions.md
# Map all 33 hit lines to their surrounding context
```

- [ ] **Step 2: Rewrite the section as current-state per AC-2.8**

Approach: identify each block type:
- The `design-large-task` skill description section → remove entirely
- The `design-figure-out` skill description section → remove entirely
- The flexible-skills list → remove design-large-task and design-figure-out entries
- The MCP installation block → remove (dead proofs-MCP setup for removed skill)
- The "when to use" comparison table → remove rows that compare to design-large-task;
  surviving entry: design-small-task for bounded tasks, design-specify as the
  formalizer, design-committee/design-grillme for ambiguous cases
- The skill reference table → remove design-large-task and design-figure-out rows
- Scattered pipeline mentions → rewrite to current pipeline:
  design-small-task → design-specify → plan-build → execute-write → finish

- [ ] **Step 3: Verify no large-task or figure-out references remain**

```bash
grep -c design-large-task docs/instructions.md   # Expect: 0
grep -ci "design-figure-out\|DFO" docs/instructions.md  # Expect: 0
grep -c design-small-task docs/instructions.md   # Expect: ≥ 1
```

- [ ] **Step 4: Run terminal AC-6.1 gate**

```bash
FAILURES=0
for t in tests/test-*.sh; do
  bash "$t" || { echo "FAIL: $t"; FAILURES=$((FAILURES + 1)); }
done
[ "$FAILURES" -eq 0 ] && echo "AC-6.1: PASS — suite green" || echo "AC-6.1: FAIL — $FAILURES test(s) failed"
```
Expected: `AC-6.1: PASS — suite green`

- [ ] **Step 5: Commit**

```bash
git add docs/instructions.md
git commit -m "fix: rewrite instructions.md design section as current-state (remove design-large-task, design-figure-out)"
```

---

## Decision Budgets — Summary and Flags

| Task | Budget | Notes |
|------|--------|-------|
| Task 1 | 2 | Two ambiguities: (a) exactly which clause to drop from the design-specify Reads line (dead path vs. both paths); (b) how to rewrite the start-bootstrap when-to-call list to name the correct standalone callers. Both are spec-anchored. |
| Task 2 | 1 | One: read the updated descriptions correctly from Task 1 output before syncing. |
| Task 3 | 1 | One: exactly which five lines to remove from plan-build while keeping the surviving cascade rule. Spec is precise. |
| Task 4 | 2 | Two: (a) which rows in the artifact table to remove vs. retain; (b) the version assertion update in the test — easy to miss if reading the test too quickly. |
| Task 5 | 1 | One: correctly identifying the row range in fork-policy.md for 1a–1g without removing surrounding header/footer rows. |
| Task 6 | 3 | Three: (a) identifying all MCP-setup prose to remove (not just the skill description section); (b) rewriting the comparison table so the surviving skills are described accurately without half-truths; (c) the flexible-skills list update. Budget is at the flag threshold. |

**Flag:** Task 6 has a budget of 3 — at the edge of the plan-attack threshold (>3 signals underspec). It does not exceed it, but the implementer should read the full instructions.md before editing, not just grep for hits. The rewrite is deliberate (spec calls it out), not line-by-line scrubbing; the 25-hit count understates the scope because design-figure-out adds 8 more hits.

**Sum of decision budgets:** 2 + 1 + 1 + 2 + 1 + 3 = **10**

---

## Execution Mode Recommendation

Applying the plan-build heuristic:

**Condition 1 — task count ≤ 3:** FAIL (6 tasks)
**Condition 2 — threat risk ≤ Moderate:** PASS (assumed Low — this is a doc/test scrub with no runtime changes; plan-attack will confirm)
**Condition 3 — sum of decision budgets ≤ 4:** FAIL (sum = 10)
**Condition 4 — no multi-file code-producing tasks:** vacuously PASS (zero code-producing tasks; all docs-producing)

**Recommendation: subagent.**

Conditions 1 and 3 both fail. The vacuous condition 4 pass doesn't rescue it — conditions 1 and 3 are independent gates, either one alone triggers subagent. A 6-task sprint with sum-of-budgets 10 warrants per-task review independence.

Note: all tasks are docs-producing or config-producing (test .sh files are not code in the runtime sense, but they are config-producing per plan-build's type taxonomy — they configure the test suite's assertion set). Condition 4 is vacuous and does not affect the recommendation.

---

## Peer DM

No peer question needed for this round — the spec is precise on AC boundaries, the
test files were read in full and exact grep strings are known, and the hit counts
were confirmed from disk. The decision-budget estimates and execution-mode
computation are derivable from the spec and heuristic alone.
