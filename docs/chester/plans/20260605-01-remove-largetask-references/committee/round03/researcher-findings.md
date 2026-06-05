# Researcher Findings — Round 03

**Sprint:** 20260605-01-remove-largetask-references
**Role:** Researcher (anchor verification, test commands, version bumps, smell pre-check)
**Date:** 2026-06-05
**Worktree:** `.worktrees/20260605-01-remove-largetask-references`
**HEAD confirmed:** 5a800e5 (matches BASE_SHA — worktree at correct state)

---

## 1. Anchor Verification — Current Line Numbers vs. Round02 Spec

All anchors verified by `grep -n "design-large-task"` against the worktree. No drift found on any spec-cited line. Every line number from round02 is valid at HEAD 5a800e5.

### execute-write/SKILL.md
- **Line 23** — CONFIRMED. Text matches round02 exactly.

### design-specify/SKILL.md
- **Line 3** (description) — CONFIRMED.
- **Line 18** (Entry Condition) — CONFIRMED.
- **Line 48** (Standalone) — CONFIRMED.
- **Line 235** (Reads — dead DLT template path) — CONFIRMED.
- **Line 236** (Invoked by) — CONFIRMED. Note: round02 cited line 237; actual line in worktree is **236**. One-line drift. Spec must use line 236.

### plan-build/SKILL.md
- **Line 19** — present but NOT in spec scope. Text: `(e.g., design-large-task)` in task-reset housekeeping paragraph. This is an illustrative example, not a caller declaration. Round02 correctly excluded it. Confirm spec excludes it.
- **Line 43** — CONFIRMED.
- **Line 67** — **NEW HIT NOT IN ROUND02 SCOPE.** Text: `sub-project briefs during the design phase (design-large-task's proof loop, or design-small-task's conversation).` This is in the Scope Check section. Round02 missed this line. Plan author must include it as an additional edit site. Repair: replace `(design-large-task's proof loop, or design-small-task's conversation)` with `(design-small-task's conversation)`.
- **Line 153** — CONFIRMED (cascade explanation DLT sentence).
- **Line 312** — CONFIRMED (spec compatibility note).

### start-bootstrap/SKILL.md
- **Line 6** (description, "Called by design-large-task") — CONFIRMED (lines 4-7 block).
- **Line 19** (When to Call "Always: design-large-task") — CONFIRMED.
- **Line 92** (session-meta hash) — CONFIRMED.

### util-design-partner-role/SKILL.md
- **Line 3** (description field) — **ADDITIONAL HIT NOT IN ROUND02 SCOPE.** Description says "Read this skill (don't invoke it) when running design-large-task or design-small-task." Round02 targeted only line 9 (body) and line 96. The description frontmatter (line 3) also contains DLT. Plan author must add this as an edit site. Repair: replace "running design-large-task or design-small-task" with "running design-small-task".
- **Line 9** — CONFIRMED.
- **Line 96** — CONFIRMED.

### util-worktree/SKILL.md
- **Line 199** — CONFIRMED.

### util-artifact-schema/SKILL.md
- **Line 107** (design row) — CONFIRMED.
- **Line 108** (thinking row) — CONFIRMED.
- **Line 109** (process row) — CONFIRMED.
- **Line 206** (stamping list) — CONFIRMED.

### design-small-task/references/design-brief-small-template.md
- **Line 5** — **ADDITIONAL HIT NOT IN ROUND02 SCOPE.** Text: `envelope used by \`design-large-task\` — optimized for design-specify consumption without`. This is in the file's introductory paragraph (line 4-5): "Six sections instead of the eight-section envelope used by `design-large-task`". Plan author must add this as an edit site. Repair: replace "the eight-section envelope used by `design-large-task`" with "the full nine-section envelope".
- **Line 9** — **ADDITIONAL HIT NOT IN ROUND02 SCOPE.** Text: `` `design-small-task`. It is the lightweight counterpart to design-large-task's `references/design-brief-template.md`. `` This is the file's intro paragraph continuation. Plan author must add. Repair: replace "the lightweight counterpart to design-large-task's `references/design-brief-template.md`" with "a lightweight alternative to the full brief format".
- **Lines 20-24** (Use-full-template block) — CONFIRMED. Round02 specified deleting lines 20-24 and replacing with one-liner.
- **Lines 138-139** (Sections Deliberately Omitted header) — CONFIRMED.
- **Line 152** — **ADDITIONAL HIT NOT IN ROUND02 SCOPE.** Text: `task is not actually bounded and should use the full template with \`design-large-task\`.` This is the paragraph immediately after the Sections table. Plan author must add. Repair: replace "use the full template with `design-large-task`" with "use `design-committee` or `design-grillme` instead".

### finish-write-records/references/record-formats.md
- **Line 68** — **NOT IN SPEC SCOPE.** This is inside a fenced code block showing a Session Summary example. Text: `<!-- produced-by design-large-task@vNNNN -->`. This is illustrative example output, not a contract definition. It accurately reflects what harvest would produce for a sprint that used DLT. Leaving it is correct — it documents real historical output format. Not a candidate for scrubbing.
- **Line 193** (stage enum) — CONFIRMED.
- **Line 213** — **NOT IN SPEC SCOPE.** This is the field-semantics description: `(e.g., the design-large-task Solve Stage round...)`. It is a parenthetical example. After DLT removal, this example becomes historically accurate but stale. Round02 correctly excluded it — the field-semantics description is documentation of what the field means, not a constraint on future values. Decision for plan author: include or exclude. Researcher finding: it is stale but not contractually wrong.
- **Line 229** — **NOT IN SPEC SCOPE.** This is inside an Example record's YAML: `stage: design-large-task`. This is a worked example of a historical decision record. Scrubbing it would falsify the example (the example sprint genuinely used DLT). Leave as-is.

### docs/fork-policy.md
- **Lines 14-20** (rows 1a-1g) — CONFIRMED. Exact lines verified.

### docs/instructions.md
- All line numbers CONFIRMED against worktree grep output. No drift from round02 enumeration.

---

## 2. Exact Test Commands — AC-4.x

All four test files confirmed present in worktree at `tests/`.

### AC-4.1: test-plan-build-heuristic.sh (modify — delete lines 63-68)
```bash
bash tests/test-plan-build-heuristic.sh
```
Expected: `PASS: plan-build heuristic and cascade structure correct` with exit 0.
After edit: lines 63-68 (DLT cascade assertion block) deleted. Remaining assertions (smell heuristic, ground-truth section, design-specify as invoker) continue to pass.

### AC-4.2: test-artifact-schema.sh (modify — remove DLT from producer loop)
```bash
bash tests/test-artifact-schema.sh
```
Expected: `PASS: artifact schema correct` with exit 0.
After edit: `"design-large-task"` removed from line 17 loop. Test verifies remaining producers still present.

### AC-4.3: test-artifact-schema-provenance.sh (modify — remove DLT from stamping loop)
```bash
bash tests/test-artifact-schema-provenance.sh
```
Expected: `PASS: provenance convention documented` with exit 0.
After edit: `design-large-task` removed from line 24 loop. Remaining skills still verified.

### AC-4.4: test-ac-4-1-fork-policy-pole-rows.sh (archive — git mv)
```bash
git -C .worktrees/20260605-01-remove-largetask-references mv \
  tests/test-ac-4-1-fork-policy-pole-rows.sh \
  _archive/design-large-task/tests/test-ac-4-1-fork-policy-pole-rows.sh
```
Target path: `_archive/design-large-task/tests/test-ac-4-1-fork-policy-pole-rows.sh`
Confirmed: `_archive/design-large-task/tests/` ALREADY EXISTS in the worktree (contains 27 other archived tests from the prior chore commit at 5a800e5). No mkdir needed.

### Capstone test command (AC-6.1)
```bash
for t in tests/test-*.sh; do bash "$t" || echo "FAIL: $t"; done
```
Run from worktree root. After all edits, this must exit with all PASS lines and no FAIL lines. test-ac-4-1 will no longer appear (archived), so it is not in the glob.

---

## 3. Current Version Values — AC-5.1 (8 skills)

All confirmed from `grep -n "^version:"` against worktree files:

| Skill file | Current version | Bump to |
|------------|----------------|---------|
| `skills/start-bootstrap/SKILL.md` | v0002 | v0003 |
| `skills/util-artifact-schema/SKILL.md` | v0002 | v0003 |
| `skills/execute-write/SKILL.md` | v0007 | v0008 |
| `skills/plan-build/SKILL.md` | v0005 | v0006 |
| `skills/util-design-partner-role/SKILL.md` | v0004 | v0005 |
| `skills/design-specify/SKILL.md` | v0003 | v0004 |
| `skills/util-worktree/SKILL.md` | v0001 | v0002 |
| `skills/design-small-task/SKILL.md` | v0003 | v0004 |

Note on design-small-task: Round02 did not include design-small-task as a version-bump candidate (its SKILL.md has no DLT references). However, its references/ file (`design-brief-small-template.md`) has multiple DLT hits. The SKILL.md itself is clean. If the spec's AC-5.1 requires a bump only for SKILL.md files with direct edits, design-small-task does NOT get bumped (the edit is to a references/ file, not the SKILL.md itself). Researcher finding: design-small-task SKILL.md version stays at v0003 unless spec explicitly includes it.

Note on `skills/setup-start/SKILL.md`: not bumped (no DLT references; sync of the available-skills list is a text edit but not a version-bump trigger per CLAUDE.md convention). Gap flagged in round02 still applies: setup-start's available-skills list must be synced when start-bootstrap and design-specify descriptions change.

---

## 4. Smell Pre-Check — 5 Trigger Categories

The work in this sprint: edit markdown text in SKILL.md files, delete lines, rewrite sentences, archive one agent file, git mv one test file.

Matching each trigger category from `skills/plan-build/references/smell-triggers.md`:

| Category | Triggers | Match in this plan? |
|----------|---------|-------------------|
| DI registrations | AddScoped, AddSingleton, AddTransient, services.Add, IServiceCollection, composition root | **NO** — no dependency injection, no service registration |
| New abstractions | new interface, abstract class, new service class, public interface I[A-Z], public abstract | **NO** — no new code abstractions; editing documentation only |
| Async/concurrency | async, await, Task., Task<, SemaphoreSlim, Semaphore, lock (, Interlocked., ConcurrentDictionary, ConcurrentBag, Channel< | **NO** — no async primitives; no code |
| New persistence pathways | SaveAsync, DbContext, IRepository, Repository, sqlite, persistence, IDbConnection, SqlConnection, serialize, deserialize | **NO** — no data persistence; markdown edits only |
| New contract surfaces | new contract, new DTO, new record, public record, public class.*Dto, boundary contract | **NO** — no new public interfaces; removing stale references |

**Result: ZERO trigger matches. plan-smell does NOT fire. plan-attack runs alone in round04.**

This is a documentation-only sprint. Every task is: read a markdown file, rewrite or delete specific lines, write it back, verify with grep. No production code introduced. No abstractions, no concurrency, no persistence, no DI, no new contract surfaces.

---

## 5. BASE_SHA Confirm + Capstone Command

**BASE_SHA confirmed:** `5a800e5` — this is HEAD of the worktree at time of verification. Commit message: `chore: archive 27 orphaned design-large-task tests`. Parent commits visible: 235b735, 5903eb0.

**Capstone test command** (run from worktree root, after all edits committed):
```bash
for t in tests/test-*.sh; do bash "$t" || echo "FAIL: $t"; done
```

**Expected outcome:** All surviving tests exit 0. The archived test (test-ac-4-1-fork-policy-pole-rows.sh) is no longer in `tests/` so it is not in the glob. No FAIL lines.

---

## Additional Gaps Surfaced for Plan Author

The following DLT references exist in the worktree that were NOT covered by round02 scope. Plan author must decide whether spec covers them (and add tasks) or explicitly excludes them:

1. **plan-build/SKILL.md line 67** — Scope Check paragraph: `design-large-task's proof loop`. Not in spec AC list. Candidate for inclusion in AC-1.x re-point tasks.

2. **util-design-partner-role/SKILL.md line 3** — frontmatter description field: "when running design-large-task or design-small-task". Not in spec AC list. Candidate for inclusion alongside AC-1.7 (line 9 edit).

3. **design-brief-small-template.md lines 5, 9, 152** — intro paragraph and closing paragraph DLT references, beyond lines 20-24 and 138-139 already in scope. Candidates for inclusion in AC-2.x delete/rewrite tasks.

4. **finish-write-records/references/record-formats.md lines 68, 213, 229** — inside example blocks and field descriptions. Researcher judgment: lines 68 and 229 are accurate historical examples (leave as-is); line 213 is a stale parenthetical example (low priority, not contractually wrong).

5. **setup-start/SKILL.md** — available-skills list must sync when start-bootstrap and design-specify descriptions change. No line number confirmed (not read in this pass); plan author must add a task.

---

## Archive Target Confirmation

- **Agent archive:** `agents/agent-industry-explorer.md` → `_archive/design-large-task/agent-industry-explorer.md` — target dir confirmed present.
- **Test archive:** `tests/test-ac-4-1-fork-policy-pole-rows.sh` → `_archive/design-large-task/tests/test-ac-4-1-fork-policy-pole-rows.sh` — target dir confirmed present (contains 27 existing tests).

---

## Supplemental: Conservator's Two Claims (added post-digest)

### Claim 1 — "7 pinning tests, not 4"

Tests with literal version-pinning assertions, per `grep -rn "CUR_VER\|version.*v000"` across all `tests/*.sh`:

| Test file | Pinned skill | Pinned version | Breaks on AC-5.1 bump? |
|-----------|-------------|---------------|----------------------|
| `test-stamping-plan-build.sh` | `skills/plan-build/SKILL.md` | `v0005` | **YES** — bumping to v0006 breaks line: `[ "$CUR_VER" = "v0005" ]` |
| `test-stamping-design-specify.sh` | `skills/design-specify/SKILL.md` | `v0003` | **YES** — bumping to v0004 breaks line: `[ "$CUR_VER" = "v0003" ]` |
| `test-stamping-execute-write.sh` | `skills/execute-write/SKILL.md` | `v0007` | **YES** — bumping to v0008 breaks line: `[ "$CUR_VER" = "v0007" ]` |
| `test-info-packet-style-version-bumps.sh` | `skills/util-design-partner-role/SKILL.md` | `v0004` | **YES** — bumping to v0005 breaks line: `check "skills/util-design-partner-role/SKILL.md" "v0004"` |
| `test-info-packet-style-version-bumps.sh` | `skills/start-bootstrap/SKILL.md` | `v0002` | **YES** — bumping to v0003 breaks line: `check "skills/start-bootstrap/SKILL.md" "v0002"` |
| `test-info-packet-style-version-bumps.sh` | `skills/design-small-task/SKILL.md` | `v0003` | **YES** — bumping to v0004 breaks line: `check "skills/design-small-task/SKILL.md" "v0003"` |
| `test-artifact-schema-provenance.sh` | `skills/util-artifact-schema/SKILL.md` | `v0002` | **YES** — bumping to v0003 breaks line: `grep -q '^version: v0002' "$SCHEMA"` |
| `test-partner-role-overlay-section.sh` | `skills/util-design-partner-role/SKILL.md` | `v0004` | **YES** — bumping to v0005 breaks line: `grep -q '^version: v0004$' "$SKILL"` |
| `test-stamping-design-small-task.sh` | `skills/design-small-task/SKILL.md` | `v0003` | **YES** — bumping to v0004 breaks line: `[ "$CUR_VER" = "v0003" ]` |

**Complete count: 9 version-pinning assertions across 7 test files that break on AC-5.1 bumps.**

Skills with NO version-pinning tests found (confirmed by full grep):
- `skills/util-worktree/SKILL.md` — no test pins it at v0001.
- `skills/finish-write-records/SKILL.md` — `test-finish-write-records-provenance.sh` pins it at v0004 (that skill is NOT in AC-5.1 bump list, so irrelevant).

**`test-trailer-write.sh`** — uses `design-large-task@v0001` and `design-large-task@v0002` as test fixture strings to verify stamp mechanics (idempotency, ordering). These are not assertions on a live skill version. This test does NOT break on any AC-5.1 bump.

**`test-design-committee-context-economy.sh`** — asserts `team-lead version bumped past v0006` (i.e., `v0007+`). This is a committee skill, not in the AC-5.1 bump list. Irrelevant.

**Summary for plan author:** Conservator is correct. There are 7 test files (not 4) that must be updated in lockstep with AC-5.1 version bumps. Each bumped skill requires its corresponding test's pinned version string to advance by one. Exact edits per test:

| Test file | Current assertion | Required edit |
|-----------|-----------------|--------------|
| `test-stamping-plan-build.sh` | `= "v0005"` | → `= "v0006"` |
| `test-stamping-design-specify.sh` | `= "v0003"` | → `= "v0004"` |
| `test-stamping-execute-write.sh` | `= "v0007"` | → `= "v0008"` |
| `test-info-packet-style-version-bumps.sh` line 20 | `"v0004"` (util-design-partner-role) | → `"v0005"` |
| `test-info-packet-style-version-bumps.sh` line 21 | `"v0002"` (start-bootstrap) | → `"v0003"` |
| `test-info-packet-style-version-bumps.sh` line 22 | `"v0003"` (design-small-task) | → `"v0004"` (only if design-small-task SKILL.md is bumped) |
| `test-artifact-schema-provenance.sh` line 36 | `'^version: v0002'` | → `'^version: v0003'` |
| `test-partner-role-overlay-section.sh` line 32 | `'^version: v0004$'` | → `'^version: v0005$'` |
| `test-stamping-design-small-task.sh` | `= "v0003"` | → `= "v0004"` (only if design-small-task SKILL.md is bumped) |

---

### Claim 2 — setup-start sync target

**(a) Does `skills/setup-start/SKILL.md` currently contain "design-large-task"?**

`grep -c "design-large-task" skills/setup-start/SKILL.md` → **0**. Zero occurrences. The file contains no DLT reference.

**(b) Does `skill-index.md` contain DLT?**

`grep -n "design-large-task" skills/setup-start/references/skill-index.md` → **0**. Zero occurrences. No DLT in skill-index.md either.

Relevant entries confirmed present in skill-index.md:
- Line 25: `start-bootstrap` entry — current text: `"Mechanical session setup: config, sprint naming, dir creation, task reset, thinking history"`
- Line 28: `design-specify` entry — long description present (confirmed).
- No `design-large-task` entry in the index.

**(c) What does `test-start-cleanup.sh` assert about `setup-start/SKILL.md`?**

Full assertion block (lines that matter):
```bash
SKILL="skills/setup-start/SKILL.md"
# Must not reference archived skills in the available-skills list or priority
for archived in "design-figure-out" "design-specify"; do
  if grep -q "$archived" "$SKILL"; then
    echo "FAIL: $SKILL still references archived skill: $archived"
    exit 1
  fi
done
```

The test asserts `design-figure-out` and `design-specify` are ABSENT from `setup-start/SKILL.md`. It does NOT assert anything about `design-large-task` (because DLT is already absent from that file — count=0 confirmed above).

**Consequence for AC-1.7 (setup-start sync):**

- `setup-start/SKILL.md` already has zero DLT occurrences. No edit to SKILL.md is needed.
- `skill-index.md` also has zero DLT occurrences. No edit to skill-index.md for DLT removal.
- The sync obligation from round02 (update start-bootstrap and design-specify entries in the available-skills list) targets `skill-index.md` lines 25 and 28 — updating the description text when those skills' `description` frontmatter fields change.
- `test-start-cleanup.sh` will NOT break due to DLT removal (DLT already absent). It WILL break if someone accidentally adds `design-specify` back to `setup-start/SKILL.md` — that test is a guard against the archived skill re-appearing.

**Conservator is correct on both sub-claims:** The available-skills list is in `skill-index.md` (not SKILL.md body), and `test-start-cleanup.sh` does not mention DLT. The AC-1.7 observable boundary checking `setup-start/SKILL.md` for DLT absence is already satisfied at HEAD — no edit needed there. The real sync work is updating skill-index.md description strings for start-bootstrap and design-specify.
