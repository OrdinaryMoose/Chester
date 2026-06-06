# Researcher — ground-truth findings — round05

Sprint: 20260606-01-update-committee-context-management
Plan: docs/chester/working/20260606-01-update-committee-context-management/plan/20260606-01-update-committee-context-management-plan-00.md

---

## 1. File existence — MODIFY paths

All MODIFY paths verified to exist:

- `skills/design-committee/references/member-protocol.md` — EXISTS
- `skills/design-committee/references/team-lead.md` — EXISTS
- `agents/design-committee-consolidator.md` — EXISTS
- `skills/design-committee/references/committee-analysis-round-format.md` — EXISTS
- `skills/design-committee/SKILL.md` — EXISTS
- `tests/test-design-committee-context-economy.sh` — EXISTS
- `skills/setup-start/references/skill-index.md` — EXISTS (checked earlier; used as sync target in Task 7)

## 2. File existence — CREATE paths

All CREATE paths verified to NOT exist:

- `skills/design-committee/references/artifact-template.md` — DOES NOT EXIST (correct — plan says create)
- `agents/design-committee-scribe.md` — DOES NOT EXIST (correct — plan says create)

No already-exists surprises.

---

## 3. Line anchor verification

### member-protocol.md (plan targets: ~18-34 for Digest shape; ~44-62 for Transcript/round-folder)

Actual section headers:

- `## Digest shape` — line **17** (plan says ~18: off by 1; section body runs lines 18–34 — body range is correct, header one line earlier)
- `## Transcript and round-folder` — line **43** (plan says ~44: off by 1; body runs 44–62 — body range is correct, header one line earlier)
- `## Write-then-send sequencing` — line **65**
- `## Committee root resolution` — line **78**

Verdict: anchors are accurate for the *body* ranges the plan targets. Header lines are one line earlier than claimed (~18 → actual 17; ~44 → actual 43). No material drift — section identities are correct.

### team-lead.md (plan targets: ~99-108 Per-Round Flow; ~115-120 Behavioral Constraints; ~122-134 Closure)

Actual section headers:

- `#### Per-Round Flow` — line **98** (plan says ~99: off by 1; content runs 99–108 — body range matches)
- `#### Behavioral Constraints` — line **115** (plan says ~115: exact match)
- `### Closure (Closing the Committee)` — line **123** (plan says ~122: off by 1; body runs 124–134)
- `version: v0007` — line **8** (plan Task 3 says v0007 → v0008: correct current version)

Verdict: Per-Round Flow header at 98 not 99; Closure header at 123 not 122. Body ranges the plan actually edits are accurate. No material drift.

### consolidator.md (plan targets: ~15-17 for Role / "Read the round folder")

Actual section headers:

- `## Role` — line **12** (plan says ~15: off by 3)
- The "Read the round folder" bullet is at lines **15–17** (plan says ~15-17: EXACT)

The plan's anchor ~15-17 targets the bullet text "Read the round folder," not the `## Role` header. Content at lines 15–17 confirmed: "**Read the round folder.** Use `Read` + `Glob` to read every member transcript and researcher findings file under the `committee/roundNN/` path you were given. Read only that round's folder; do not range across other rounds or the wider repo." This is precisely the text the plan says to replace. EXACT match.

### committee-analysis-round-format.md (plan targets: ~39-59 Folder Shape; ~100-226 Template)

Actual section headers:

- `## Folder Shape` — line **38** (plan says ~39: off by 1; body runs 39–59 — body range matches)
- `## Template — round folder files` — line **99** (plan says ~100: off by 1; body runs 100–226 — body range matches)

Verdict: headers one line earlier than plan claims; body ranges are accurate. No material drift.

### SKILL.md (plan targets: ~46-51 Checklist; ~60-63 Phase 2; ~64-114 Phase 3/4)

Actual section headers:

- `## Checklist` — line **44** (plan says ~46: off by 2; body runs 46–51 — body range correct)
- `## Phase 2: Capture Question` — line **63** (plan says ~60-63: body of Phase 2 is lines 63–65; header at 63 matches the end of plan's claimed range)
- `## Phase 3: Convene` — line **67** (plan bundles Phase 3/4 as ~64-114; Phase 3 header actual 67; Phase 4 header at line 97; combined Phase 3+4 body runs through ~114 — range covers correctly)
- `version: v0017` — line **4** (plan Task 7 says v0017 → v0018: correct current version)

Verdict: Checklist header 2 lines earlier than claimed; Phase 2/3/4 body ranges land correctly within the plan's cited span. No material drift.

### test file (plan targets: lines 11-19 assert_member_protocol; line 59 version check; line 64 digest check; line 70 version check)

Actual test file content:

- `assert_member_protocol` body — lines **11–19**: EXACT match (plan says lines 11-19)
- Line **59**: `_check "team-lead version bumped past v0006" "grep -qE '^version: v00(0[7-9]|[1-9][0-9])' '$f'"` — plan says "bump the version check at line 59 to `> v0007`"; actual line 59 checks `> v0006` (allows v0007+). After Task 3 bumps team-lead to v0008, the plan's new assertion `v00(0[8-9]|...)` is correct. CONFIRMED — current line 59 matches what the plan references.
- Line **64**: `_check "SKILL finals step = write transcript + digest" "grep -qi 'digest' '$f'"` — EXACT match at line 64; plan says to replace this. CONFIRMED.
- Line **70**: `_check "SKILL version bumped past v0016" "grep -qE '^version: v00(1[7-9]|[2-9][0-9])' '$f'"` — EXACT match at line 70; plan says to bump to `> v0017`. CONFIRMED.

No test anchor drift. All test line references are exact.

### Insert-region markers (plan says: new assert_* functions go between `# === ASSERTION FUNCTIONS` markers; new run calls go in run region above gate)

Actual markers in the test file:

- Line **10**: `# === ASSERTION FUNCTIONS — later tasks insert new assert_* functions in this region ===`
- Line **81**: `# === END ASSERTION FUNCTIONS ===`
- Line **83**: `# === RUN — later tasks insert new assert_* calls in this region, ABOVE the gate ===`
- Line **92**: `# === END RUN ===`
- Line **94**: `# --- final gate: nothing executable may be added below this line ---`

CONFIRMED. All four insert-region markers exist exactly as the plan describes. The plan's reliance on these regions is valid.

---

## 4. Acceptance criteria coverage

From plan §"Acceptance Criteria":

- **AC-1** — explicitly "owned by no task" (emergent). No task claims it as sole owner. Plan text covers this correctly; no gap.
- **AC-2** — Task 1 (Implements: AC-2, AC-4), Task 3 (Implements: AC-2, AC-3, AC-5), Task 5 (Implements: AC-2). Covered.
- **AC-3** — Task 3 (Implements: AC-2, AC-3, AC-5), Task 6 (Implements: AC-3). Covered.
- **AC-4** — Task 1 (Implements: AC-2, AC-4), Task 2 (Implements: AC-4). Covered.
- **AC-5** — Task 3 (Implements: AC-2, AC-3, AC-5), Task 4 (Implements: AC-5). Covered.

No AC with zero task coverage. AC-1 is deliberately emergent — appropriate designation.

---

## 5. util-artifact-schema verdict for template location

`skills/util-artifact-schema/SKILL.md` governs sprint artifacts (design, spec, plan, summary, audit) stored under `CHESTER_WORKING_DIR/{sprint-subdir}/{design,spec,plan,summary}/`. It does NOT govern skill-internal reference files. The artifact-schema has no jurisdiction over files in `skills/design-committee/references/` — those are skill operational files, not sprint-produced artifacts.

VERDICT: `skills/design-committee/references/artifact-template.md` is a safe and correct default. util-artifact-schema does not dictate an alternative location. No conflict. The plan's "confirm location against util-artifact-schema during the task" will confirm there is no override to apply; the default path stands.

---

## Summary of drifted anchors

| File | Plan claim | Actual | Nature |
|---|---|---|---|
| member-protocol.md | `## Digest shape` ~18 | line 17 | header 1 line earlier; body range 18–34 correct |
| member-protocol.md | `## Transcript` ~44 | line 43 | header 1 line earlier; body range 44–62 correct |
| team-lead.md | Per-Round Flow ~99 | header 98; body 99+ | header 1 line earlier; body range correct |
| team-lead.md | Closure ~122 | line 123 | header 1 line later; body range correct |
| round-format.md | Folder Shape ~39 | line 38 | header 1 line earlier; body range 39–59 correct |
| round-format.md | Template ~100 | line 99 | header 1 line earlier; body range 100–226 correct |
| SKILL.md | Checklist ~46 | line 44 | header 2 lines earlier; body range 46–51 correct |
| test file | All checked | EXACT | zero drift |

Total anchors drifted: **7 header lines** (all off by 1–2 lines); **zero body-range errors**. All section identities are correct — the plan reliably targets the right sections. No blocker.

Synthesis (facts): All MODIFY paths exist; all CREATE paths are absent. Test insert-region markers confirmed present. All five ACs covered by at least one task. util-artifact-schema does not override the template location — default path is valid. Seven anchor header-line minor drifts found, all harmless (body ranges are accurate). No blocker found.
