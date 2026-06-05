# Researcher Findings — Round 04 (Plan Attack: Codebase Verification)

**Sprint:** 20260605-01-remove-largetask-references
**Round:** 04 (plan-attack — researcher half)
**Worktree HEAD:** 5a800e5
**Plan under review:** `docs/chester/working/20260605-01-remove-largetask-references/plan/20260605-01-remove-largetask-references-plan-00.md`

---

## 1. File:Line Verification — Actual vs Claimed

### Task 1 — plan-build SKILL.md

**Plan claims:** Drop DLT from canonical-sequence (~L43), cascade sentence (~L153-155), spec-compat note (~L312), Scope Check proof-loop clause (~L67).

**Verified actuals:**

- **L19** — `design-large-task` in task-reset sentence: "If any tasks exist from a previous skill (e.g., design-large-task)". **NOT in the plan's edit list.** This is a 5th occurrence the plan does not account for.
- **L43** — `design-large-task` in context line: "created by `design-large-task` or `design-small-task` during their Archival / closure stage". Confirmed present at approximately L43.
- **L67** — Scope Check paragraph, confirmed: "design-large-task's proof loop, or design-small-task's conversation". Confirmed present at L67.
- **L153-154** — cascade paragraph: "`design-large-task` no longer produces a design-stage ground-truth report (architecture choice and ground-truth verification are owned by `design-specify`)." Present at L153-154. **FLAG: This is load-bearing commentary explaining the cascade, not a stale membership claim. See grep-zero section below.**
- **L312** — spec-compat note: "regardless of whether the upstream brief came from `design-large-task` (nine-section) or `design-small-task` (six-section)". Confirmed at L312.

**GREP-ZERO SHORTFALL — PLAN MISS:** `grep -c design-large-task skills/plan-build/SKILL.md` = **5**, not 4. The plan lists 4 edit sites but the file has 5 occurrences. The plan does not address L19 (task-reset sentence). After applying only the 4 listed edits, grep-zero will NOT be satisfied for plan-build.

**Resolution options (designer decision):**
- (a) Add L19 edit to Task 1: change "e.g., design-large-task" to "e.g., design-small-task" (re-point).
- (b) The L153-154 cascade sentence is also a judgment call — it references DLT in past-tense explanation. Deleting it is correct if the cascade explanation belongs to design-specify's scope. The plan's current handling (delete/simplify the sentence) satisfies grep-zero for that site.

**test-plan-build-heuristic.sh — CRITICAL LINE DRIFT:**

Plan claims: remove the DLT cascade assertion block (~L62-68).

**Actual file content at L62-68:**
```
62: # Must reference design-large-task in the ground-truth cascade context
63: # (the cascade survives through design-specify because both write into the same
64: # sprint subdirectory)
65: if ! grep -q "design-large-task" "$SKILL"; then
66:   echo "FAIL: $SKILL does not reference design-large-task in cascade context"
67:   ERRORS=$((ERRORS + 1))
68: fi
```

**Confirmed match:** The plan's claimed block (~L62-68) is exactly correct. Removing lines 62-68 removes the assertion that `design-large-task` must appear in plan-build SKILL.md.

**test-stamping-plan-build.sh — Line pin:**

Plan claims: version assertion at L15 from `v0005` → `v0006`.

**Actual L15:** `[ "$CUR_VER" = "v0005" ] || fail "version not at v0005 (got $CUR_VER)"`. **Confirmed correct.**

---

### Task 2 — util-artifact-schema SKILL.md

**Plan claims:** Delete producer-row DLT half + template-path note (~L107-109), thinking-artifact row (~L108), process-artifact row (~L109), stamping-list entry (~L206); bump v0002 → v0003.

**Verified actuals:**

- **L107** — `design` row: "Templates live in each design skill: `design-large-task/references/design-brief-template.md`... | `design-large-task` (8-section envelope)...". Confirmed at L107.
- **L108** — `thinking` row: "Thinking summary... | `design-large-task`". Confirmed at L108.
- **L109** — `process` row: "Process evidence... | `design-large-task`". Confirmed at L109.
- **L206** — stamping-list: "- `design-large-task` (design briefs, thinking files)". Confirmed at L206.

**Total DLT occurrences in util-artifact-schema:** 4. All 4 covered by the plan. Grep-zero satisfied after edits. ✓

**test-artifact-schema.sh — CRITICAL CONFLICT:**

Plan claims: "drop design-large-task from the producer loop (~L17)".

**Actual L17:** `for producer in "design-large-task" "design-small-task" "design-specify" "plan-build" "execute-write" "finish-write-records"; do`

**CONFLICT:** After removing `design-large-task` from the SKILL.md producer table (L107), the test loop at L17 asserts `design-large-task` must appear in the schema. Removing DLT from the loop is correct. However — the test also does NOT check for `design-large-task` in the archived-skills block (L9: only checks `design-figure-out`). So the edit is: remove `"design-large-task"` from the producer loop. **Confirmed the plan's stated action is correct.**

**test-artifact-schema-provenance.sh — Line pins:**

- **L24:** `for skill in design-large-task design-small-task design-specify plan-build execute-write finish-write-records;` — confirmed.
- **L36 (actual):** `grep -q '^version: v0002' "$SCHEMA" || fail "version not bumped to v0002"` — **confirmed at L36** (not L35 or L37). Plan cites "~L36" — exact match.

After removing DLT from L24 loop AND updating L36 to `v0003`, both assertions are correct. ✓

---

### Task 3 — fork-policy.md

**Plan claims:** Delete step-b pole rows 1a–1g (lines ~14-20).

**Verified actuals (all 7 DLT occurrences, all in rows 1a-1g):**
- L14: row 1a (codebase explorer)
- L15: row 1b (prior-art explorer)
- L16: row 1c (industry explorer)
- L17: row 1d (step-b innovator)
- L18: row 1e (step-b conservator)
- L19: row 1f (step-b purist)
- L20: row 1g (step-b pragmatist)

**Grep-zero: 7 occurrences, all in rows 1a-1g.** Deleting L14-20 reaches grep-zero. ✓

Plan also claims: `grep -c step-b docs/fork-policy.md` → 0 after edit. Confirmed all `step-b` strings are inside rows 1d-1g (L17-20). Deleting L14-20 removes all step-b hits. ✓

---

### Task 4 — start-bootstrap + util-design-partner-role

**start-bootstrap actual DLT occurrences (3):**
- **L6:** description frontmatter: "Called by design-large-task". Confirmed.
- **L19:** when-to-call list: "- **Always:** `design-large-task` (starts fresh sprints)". Confirmed.
- **L92:** session-meta prose: "skillVersion (commit hashes for `util-design-partner-role` and `design-large-task` SKILL.md files)". Confirmed.

**Plan coverage:** All 3 listed. Grep-zero satisfied. ✓

**util-design-partner-role actual DLT occurrences (3):**
- **L3:** description frontmatter: "Read this skill (don't invoke it) when running design-large-task or design-small-task." Confirmed at L3.
- **L9:** intro line: "Both `design-large-task` and `design-small-task` read this file." Confirmed at L9.
- **L96:** capture_thought sentence: "`design-large-task` captures private precision via `capture_thought`..." Confirmed at L96.

**Plan coverage:** All 3 listed. Grep-zero satisfied. ✓

**test-info-packet-style-version-bumps.sh — Line pins:**
- **L20:** `check "skills/util-design-partner-role/SKILL.md" "v0004"` — confirmed.
- **L21:** `check "skills/start-bootstrap/SKILL.md" "v0002"` — confirmed.
- **L22:** `check "skills/design-small-task/SKILL.md" "v0003"` — confirmed. (This is a pin on design-small-task, which Task 4 does NOT bump. The assertion stays at v0003. No edit needed for L22 in Task 4.)

**Plan says:** "start-bootstrap assertion `v0002` → `v0003` (~L21); util-design-partner-role assertion `v0004` → `v0005` (~L20)". Confirmed lines are correct.

**test-partner-role-overlay-section.sh — Line pin:**
- **L32:** `grep -q '^version: v0004$' "$SKILL" || { echo "FAIL: version not v0004"` — confirmed. Plan says update to `v0005`. Correct.

---

### Task 5 — design-specify SKILL.md

**Actual DLT occurrences (5):**
- **L3:** description: "Use when a design brief exists (from design-large-task, design-small-task..." Confirmed.
- **L18:** Entry Condition: "A design brief from `design-large-task` or `design-small-task`..." Confirmed.
- **L48:** Standalone Invocation: "When invoked without a prior `design-large-task` or `design-small-task` session..." Confirmed.
- **L235:** Reads section: dead template path `../design-large-task/references/design-brief-template.md`. Confirmed.
- **L236:** Invoked by: "`design-large-task` or `design-small-task`". Confirmed.

**Plan coverage:** All 5 covered (description L3, entry condition L18, standalone L48, Reads L235, invoked-by L236). **Anchor at L236 confirmed correct** (not 237 — the plan's correction holds). Grep-zero satisfied. ✓

**test-stamping-design-specify.sh — Line pin:**
- **L15:** `[ "$CUR_VER" = "v0003" ]` — confirmed. Plan says update to `v0004`. Correct.

---

### Task 6 — execute-write SKILL.md

**Actual DLT occurrences (1):**
- **L23:** "`design-large-task` | `design-small-task` → `design-specify` → `plan-build` → execute-write". Confirmed.

**Plan coverage:** 1 occurrence, covered. Grep-zero satisfied. ✓

**test-stamping-execute-write.sh — Line pin:**
- **L12:** `[ "$CUR_VER" = "v0007" ]` — confirmed. Plan says update to `v0008`. Correct.

---

### Task 7 — util-worktree, agent-industry-explorer, design-brief-small-template, record-formats

**util-worktree actual DLT occurrences (1):**
- **L199:** "- **design-large-task** (Archival stage) - REQUIRED..." Confirmed. Grep-zero after 1 deletion. ✓

**design-brief-small-template actual DLT occurrences (6):**
- **L5:** envelope reference: "envelope used by `design-large-task`..." Confirmed.
- **L9:** counterpart reference: "lightweight counterpart to design-large-task's..." Confirmed.
- **L20:** upsize block first line: "Use the full `design-large-task template (...)`..." Confirmed.
- **L23:** upsize block: "The brief is produced by design-large-task and must match..." Confirmed.
- **L138:** archived-template reference: "full `design-large-task template (...)`..." Confirmed.
- **L152:** closing: "use the full template with `design-large-task`." Confirmed.

**Plan coverage:** L20-24 (upsize block delete), L138-139, L5/L9/L152. All 6 covered. Grep-zero satisfied. ✓

**record-formats DLT occurrences (3):**
- **L68:** inside a code block (fixture): `<!-- produced-by design-large-task@vNNNN -->`. This is a **template/example** showing what the harvest output looks like. It is a documentation fixture.
- **L193:** stage-enum: `stage: design-large-task | design-small-task | ...` — forward-facing enum entry. Confirmed.
- **L213:** field-semantics prose: "e.g., the design-large-task Solve Stage round, or the plan-build task-mapping step." — inline example in prose.
- **L229:** Example record YAML block: `stage: design-large-task` — a concrete filled-in example record.

**Total: 4 occurrences, not 3.** The plan lists "L68/L213/L229" (3 occurrences) but misses **L193** (the stage-enum). However, the plan DOES state AC-2.6 requires deleting "the stage-enum entry (~L193)" in the Files block description. So the count discrepancy is in the Steps text only, not the intent. The plan's intent covers all 4. Grep-zero requires all 4 be removed or substituted.

---

### Task 8 — setup-start

**setup-start SKILL.md DLT:** 0 at HEAD. ✓
**skill-index.md DLT:** 0 at HEAD. ✓

**test-start-cleanup.sh:** Greps for `design-figure-out` and `design-specify` in SKILL.md body (L13). Bumping the version frontmatter line does NOT introduce either string → stays green. ✓

**ADDITIONAL FINDING — test-start-cleanup.sh greps the SKILL.md body, not skill-index.md.** The Task 8 edit to skill-index.md (description-text sync) is unchecked by any test. No test pins setup-start's version. OD-2 bump is safe.

---

## 2. Grep-Zero Reachability — Summary

| File | Total DLT occurrences | Plan covers | Grep-zero after plan? |
|---|---|---|---|
| skills/plan-build/SKILL.md | 5 | 4 | **NO — L19 uncovered** |
| skills/util-artifact-schema/SKILL.md | 4 | 4 | YES ✓ |
| docs/fork-policy.md | 7 | 7 (rows 1a-1g) | YES ✓ |
| skills/start-bootstrap/SKILL.md | 3 | 3 | YES ✓ |
| skills/util-design-partner-role/SKILL.md | 3 | 3 | YES ✓ |
| skills/design-specify/SKILL.md | 5 | 5 | YES ✓ |
| skills/execute-write/SKILL.md | 1 | 1 | YES ✓ |
| skills/util-worktree/SKILL.md | 1 | 1 | YES ✓ |
| skills/design-small-task/references/design-brief-small-template.md | 6 | 6 | YES ✓ |
| skills/finish-write-records/references/record-formats.md | 4 | 4 (intent covers all — step text says 3 but Files block says L193 too) | YES ✓ (if L193 included) |
| docs/instructions.md | 25 | task says four-zone; no line-by-line claim | Needs implementer to reach 0 |

**One confirmed miss:** plan-build L19 is not in any edit list. Plan must add it to Task 1.

---

## 3. OD-1 Fact Check — record-formats L68 / L213 / L229 (and L193)

**L68 in context** (inside a fenced Markdown code block, illustrating the harvest output format):
```markdown
## Session Skill Versions

*(populated by `chester-trailer-write harvest`; see `util-artifact-schema` `## Provenance Trailers`)*

<!-- produced-by design-large-task@vNNNN -->
<!-- produced-by design-specify@vNNNN -->
```
This is a **template fixture** — it shows what the harvest-populated block looks like. Not a real produced-by claim about an existing artifact. It's a documentation example.

**L213 in context** (field-semantics prose, not a YAML fixture):
```
- **stage** — the skill where the decision crystallized (e.g., the design-large-task Solve Stage round, or the plan-build task-mapping step).
```
This is a **prose example** illustrating valid stage field values. It is not a forward-facing enum.

**L229 in context** (inside a fenced YAML block — the canonical example record):
```yaml
stage: design-large-task
```
This is a **sample record fixture** — a concrete filled-in example demonstrating the record format. Not a schema-enforced constraint. Analogous to test-decision-record-emission.sh using `stage: design-large-task` in its fixture corpus.

**L193** (forward-facing enum — this is the only schema-enforcement entry):
```
stage: design-large-task | design-small-task | design-specify | plan-build | execute-write | finish-write-records
```
This is the **actual stage-enum constraint** that governs valid values going forward.

**Does grep-zero force removal of L68/L213/L229?**

Yes, AC-2.6's `grep -c → 0` boundary is absolute. All four occurrences must be removed or substituted regardless of their semantic role.

**Classification:**
- L193 — forward-facing schema enum: must remove `design-large-task |` from it (or delete; surviving values remain). This is the right removal.
- L68 — template fixture: the historical fixture is not wrong (old sprints ran under DLT), but grep-zero forces substitution. The plan's OD-1 default (a) says "substitute a surviving skill name or generic placeholder." Replacing `design-large-task@vNNNN` with `design-small-task@vNNNN` in the example is accurate and reaches grep-zero.
- L213 — prose example: substituting "the design-small-task conversation round" or "the design-specify review round" is accurate. Reach grep-zero.
- L229 — YAML example record: substituting `stage: design-small-task` (or any surviving skill) is accurate for illustration. Reach grep-zero.

**Conclusion:** OD-1 default (a) is correct. The plan's intent covers all 4. The Steps text says "~L68/L213/L229" (3) — implementer must also hit L193. The Files block already names L193, so this is a Steps-text undercount, not a plan gap.

---

## 4. Missed Pinning Tests — Additional Sweep

**New findings beyond the 9 already documented:**

### test-partner-role-discipline.sh
Contains `design-large-task` at lines 55 and 65, but these are **comment text** and **echo string** — both are already marked "RETIRED" in the file. No grep assertion checks for DLT's presence or absence. No version pin. **Does not break on Task 4's edits.** Not a pinning test.

### test-decision-record-emission.sh
Contains `stage: design-large-task` at L15, L31, L73 — all inside a heredoc fixture corpus (temporary file, deleted by EXIT trap). Not reading any SKILL.md. Not pinning any skill version. **Immune to all plan edits.** Not a pinning test.

### test-decision-record-supersession.sh
Contains `stage: design-large-task` at L15, L29 — same pattern: heredoc fixture. **Immune.** Not a pinning test.

### test-trailer-harvest.sh
Contains `design-large-task@v0012` at L26 (fixture file content) and L56, L61 (assertions on fixture output). All inside a tmpdir created/destroyed per test. This tests harvest mechanics against fixture strings — not real skill files. **Immune.** Not a pinning test. (Confirmed in round03.)

### test-trailer-write.sh
Contains `design-large-task@v0001`/`v0002` in fixture stamp/verify operations. Same pattern: tests the stamp mechanics, not skill presence. **Immune.** (Confirmed in round03.)

**No 10th pinning test found.** The 9 assertions documented in round03 supplemental remain the complete set. No additional pinning tests discovered.

---

## 5. Task 8 — Does Bumping setup-start/SKILL.md Version Break test-start-cleanup.sh?

**test-start-cleanup.sh logic:**
```bash
if ! grep -q "Session Housekeeping" "$SKILL"; then ...
for archived in "design-figure-out" "design-specify"; do
  if grep -q "$archived" "$SKILL"; then ...
```

The test checks:
1. "Session Housekeeping" string present in SKILL.md body — unaffected by version bump.
2. "design-figure-out" absent from SKILL.md — unaffected by version bump.
3. "design-specify" absent from SKILL.md — unaffected by version bump.

**Version frontmatter line** (`version: v000N`) does not contain "Session Housekeeping", "design-figure-out", or "design-specify". Bumping the version line only changes the digit. **test-start-cleanup.sh stays green.** ✓

**No other test greps setup-start SKILL.md for a version string.** (Confirmed by the round03 sweep — no `test-stamping-setup-start.sh` exists.)

---

## 6. Summary of Findings for Plan Author

**Hard blockers (plan must be amended before execution):**

1. **plan-build L19 uncovered — grep-zero miss.** `grep -c design-large-task skills/plan-build/SKILL.md` = 5, not 4. The task-reset sentence "If any tasks exist from a previous skill (e.g., design-large-task)" at L19 is not in Task 1's edit list. Task 1 must add: change "e.g., design-large-task" to "e.g., design-small-task" or remove the example parenthetical.

**Soft clarifications (plan intent is correct; wording could mislead implementer):**

2. **record-formats Steps text says L68/L213/L229 (3 occurrences); actual count is 4.** L193 (stage-enum) is covered in the Files block description but missing from the Steps list. Implementer using only the Steps list as a checklist will miss L193. Add L193 to the Steps text.

3. **test-partner-role-discipline.sh listed as "Must remain green" for Task 4** but needs no edit — correct as stated. The two DLT strings in that file are comments, not assertions. No action needed; the listing is safe.

4. **test-decision-record-emission.sh, test-decision-record-supersession.sh, test-trailer-harvest.sh, test-trailer-write.sh** all contain `design-large-task` strings but are immune (fixture text, not skill-file assertions). The plan does not list them as needing edits — correct.

**Confirmed clean (no action needed):**

- test-start-cleanup.sh: stays green on Task 8's version-only bump. ✓
- All 9 version-pinning assertions correctly identified and covered in Tasks 1-6. ✓
- Grep-zero reachable for all files except the one plan-build miss. ✓
- No 10th pinning test found. ✓

---

### Change log

- 2026-06-05 — Round 04 researcher findings authored. Worktree verified at HEAD 5a800e5. One hard blocker found (plan-build L19 uncovered). One soft clarification (record-formats Steps text undercount). All version-pin assertions confirmed. No additional pinning tests found beyond round03 supplemental's 9.
