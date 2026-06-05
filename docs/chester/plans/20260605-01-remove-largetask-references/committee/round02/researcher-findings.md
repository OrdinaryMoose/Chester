# Researcher Findings — Round 02

**Sprint:** 20260605-01-remove-largetask-references
**Role:** Researcher (exact anchors for spec authoring)
**Date:** 2026-06-05

Pinned edit sites for every item in the Path A cleanup. Format per site: file path, line(s), current text, exact replacement or deletion instruction.

---

## RE-POINT SITES

### execute-write/SKILL.md — §1.2 Verify Worktree

**File:** `skills/execute-write/SKILL.md`
**Line:** 23
**Current text:**
```
  (`design-large-task` | `design-small-task` → `design-specify` → `plan-build` → execute-write), the worktree is created upstream during the design phase (by `design-large-task` at Archival or `design-small-task` at Closure) and inherited through `design-specify` and `plan-build` unchanged.
```
**Replacement:**
```
  (`design-small-task` → `design-specify` → `plan-build` → execute-write), the worktree is created upstream during the design phase (by `design-small-task` at Closure) and inherited through `design-specify` and `plan-build` unchanged.
```

---

### design-specify/SKILL.md — frontmatter description

**File:** `skills/design-specify/SKILL.md`
**Line:** 3
**Current text:**
```
description: "Formalize an approved design brief into a durable spec document. Use when a design brief exists (from design-large-task, design-small-task, a whiteboard, a previous session, or a human-written brief) and needs to be written as a formal spec with competing-architecture review, automated fidelity review, and codebase ground-truth verification before plan-build."
```
**Replacement:**
```
description: "Formalize an approved design brief into a durable spec document. Use when a design brief exists (from design-small-task, a whiteboard, a previous session, or a human-written brief) and needs to be written as a formal spec with competing-architecture review, automated fidelity review, and codebase ground-truth verification before plan-build."
```

---

### design-specify/SKILL.md — Entry Condition

**File:** `skills/design-specify/SKILL.md`
**Line:** 18
**Current text:**
```
- A design brief from `design-large-task` or `design-small-task` at `{CHESTER_WORKING_DIR}/{sprint-subdir}/design/{sprint-name}-design-00.md`
```
**Replacement:**
```
- A design brief from `design-small-task` at `{CHESTER_WORKING_DIR}/{sprint-subdir}/design/{sprint-name}-design-00.md`
```

---

### design-specify/SKILL.md — Standalone Invocation section

**File:** `skills/design-specify/SKILL.md`
**Line:** 48
**Current text:**
```
When invoked without a prior `design-large-task` or `design-small-task` session, invoke `start-bootstrap` to set up the sprint context (config, naming, directories, task reset).
```
**Replacement:**
```
When invoked without a prior `design-small-task` session, invoke `start-bootstrap` to set up the sprint context (config, naming, directories, task reset).
```

---

### design-specify/SKILL.md — Integration Reads (dead path ref → delete)

**File:** `skills/design-specify/SKILL.md`
**Line:** 235
**Current text:**
```
- **Reads:** `references/adversarial-spec-review.md` (inline adversarial review pattern, modeled on `chester:plan-attack`), `util-artifact-schema` (naming/paths), the upstream brief's source template: `../design-large-task/references/design-brief-template.md` (9-section envelope including Concerns and Resolve Conditions) or `../design-small-task/references/design-brief-small-template.md` (6-section lightweight) — read whichever matches the upstream design skill that produced the brief
```
**Replacement:**
```
- **Reads:** `references/adversarial-spec-review.md` (inline adversarial review pattern, modeled on `chester:plan-attack`), `util-artifact-schema` (naming/paths), `../design-small-task/references/design-brief-small-template.md` (6-section lightweight brief format, for context when the upstream brief came from `design-small-task`)
```

---

### design-specify/SKILL.md — Integration Invoked-by

**File:** `skills/design-specify/SKILL.md`
**Line:** 237
**Current text:**
```
- **Invoked by:** `design-large-task` or `design-small-task` (mandatory in the canonical sequence), or user directly (standalone)
```
**Replacement:**
```
- **Invoked by:** `design-small-task` (mandatory in the canonical sequence), or user directly (standalone)
```

---

### plan-build/SKILL.md — line 43 worktree context

**File:** `skills/plan-build/SKILL.md`
**Line:** 43
**Current text:**
```
**Context:** This should be run in a dedicated worktree (created by `design-large-task` or `design-small-task` during their Archival / closure stage).
```
**Replacement:**
```
**Context:** This should be run in a dedicated worktree (created by `design-small-task` during its closure stage).
```

---

### plan-build/SKILL.md — lines 153-154 cascade explanation (simplify)

**File:** `skills/plan-build/SKILL.md`
**Lines:** 153–155
**Current text:**
```
`design-large-task` no longer produces a design-stage ground-truth report
(architecture choice and ground-truth verification are owned by `design-specify`).
The cascade reads only the spec-stage report when present.
```
**Replacement:**
```
The cascade reads only the spec-stage report when present (produced by `design-specify`; architecture choice and ground-truth verification are owned by that stage).
```

---

### plan-build/SKILL.md — line 312 spec compatibility

**File:** `skills/plan-build/SKILL.md`
**Line:** 312
**Current text:**
```
- **Spec compatibility:** reads spec documents written by `design-specify`, regardless of whether the upstream brief came from `design-large-task` (nine-section) or `design-small-task` (six-section) — design-specify normalizes both into the spec contract
```
**Replacement:**
```
- **Spec compatibility:** reads spec documents written by `design-specify`, which normalizes upstream briefs (from `design-small-task` or human-authored sources) into the spec contract
```

---

### start-bootstrap/SKILL.md — frontmatter description (lines 4-7)

**File:** `skills/start-bootstrap/SKILL.md`
**Lines:** 4–7
**Current text:**
```
  Mechanical session setup for pipeline skills. Invoke this skill at the start of any
  pipeline skill that needs a sprint context — config reading, sprint naming, directory
  creation, task reset, and thinking history initialization. Called by design-large-task
  and execute-write (standalone).
```
**Replacement:**
```
  Mechanical session setup for pipeline skills. Invoke this skill at the start of any
  pipeline skill that needs a sprint context — config reading, sprint naming, directory
  creation, task reset, and thinking history initialization. Called by design-small-task,
  design-specify (standalone), and execute-write (standalone).
```

---

### start-bootstrap/SKILL.md — When to Call section

**File:** `skills/start-bootstrap/SKILL.md`
**Lines:** 18–22
**Current text:**
```
## When to Call

- **Always:** `design-large-task` (starts fresh sprints)
- **Standalone only:** `execute-write` (when invoked without a prior
  design phase, it needs sprint context created; when invoked mid-pipeline, sprint
  context already exists)
```
**Replacement:**
```
## When to Call

- **Always:** `design-small-task` (starts fresh sprints)
- **Standalone only:** `design-specify` (when invoked without a prior design phase), `execute-write` (when invoked without a prior design phase, it needs sprint context created; when invoked mid-pipeline, sprint context already exists)
```

---

### util-design-partner-role/SKILL.md — line 9

**File:** `skills/util-design-partner-role/SKILL.md`
**Line:** 9
**Current text:**
```
Both `design-large-task` and `design-small-task` read this file. Defines designer-visible voice. Each skill keeps own framing + style exemplar (different conversation shapes), mechanics below shared.
```
**Replacement:**
```
`design-small-task` reads this file. Defines designer-visible voice. Skill keeps own framing + style exemplar, mechanics below shared.
```

---

### util-worktree/SKILL.md — Integration bullet

**File:** `skills/util-worktree/SKILL.md`
**Line:** 199
**Current text:**
```
- **design-large-task** (Archival stage) - REQUIRED when design is approved and implementation follows
```
**Action:** Delete this line entirely. Lines 200–202 remain unchanged.

---

## DELETE SITES

### util-artifact-schema/SKILL.md — design row: dead template reference in Purpose cell

**File:** `skills/util-artifact-schema/SKILL.md`
**Line:** 107
**Current text:**
```
| `design` | `design/` | Design brief — proof envelope (goal, necessary conditions, rules, permissions, evidence, industry context, risks, acceptance criteria). Templates live in each design skill: `design-large-task/references/design-brief-template.md` (8-section envelope) and `design-small-task/references/design-brief-small-template.md` (6-section lightweight). | `design-large-task` (8-section envelope), `design-small-task` (6-section lightweight) |
```
**Replacement:**
```
| `design` | `design/` | Design brief — structured summary of what is being built and why, including scope, key decisions, constraints, and acceptance criteria. Template: `design-small-task/references/design-brief-small-template.md` (6-section lightweight). | `design-small-task` |
```

---

### util-artifact-schema/SKILL.md — delete thinking artifact-type row

**File:** `skills/util-artifact-schema/SKILL.md`
**Line:** 108
**Current text:**
```
| `thinking` | `design/` | Thinking summary — decision history of how the proof reached its necessary conditions | `design-large-task` |
```
**Action:** Delete line 108 entirely.

---

### util-artifact-schema/SKILL.md — delete process artifact-type row

**File:** `skills/util-artifact-schema/SKILL.md`
**Line:** 109
**Current text:**
```
| `process` | `design/` | Process evidence — operational narrative (Understand Stage saturation history, Stage Transition timing, Solve Stage length) | `design-large-task` |
```
**Action:** Delete line 109 entirely.

---

### util-artifact-schema/SKILL.md — stamping-skills list entry

**File:** `skills/util-artifact-schema/SKILL.md`
**Line:** 206
**Current text:**
```
- `design-large-task` (design briefs, thinking files)
```
**Action:** Delete line 206 entirely.

---

### util-design-partner-role/SKILL.md — line 96 capture_thought sentence

**File:** `skills/util-design-partner-role/SKILL.md`
**Line:** 96
**Current text:**
```
`design-large-task` captures private precision via `capture_thought` with tag `private-precision`. `design-small-task` uses whatever scratch note habit fits session — point = precision captured *somewhere that isn't designer-facing output*. Knowing precision safely stored reduces pressure to smuggle it into visible output.
```
**Replacement** (delete DLT sentence, keep DST sentence):
```
`design-small-task` uses whatever scratch note habit fits session — point = precision captured *somewhere that isn't designer-facing output*. Knowing precision safely stored reduces pressure to smuggle it into visible output.
```

---

### start-bootstrap/SKILL.md — session-meta hash line

**File:** `skills/start-bootstrap/SKILL.md`
**Line:** 92
**Current text:**
```
The helper writes `design/{sprint-name}-session-meta.json` with sprintName, branchName, sessionStartTimestamp (ISO 8601 UTC), jsonlSessionId (best-effort from `CLAUDE_SESSION_ID`; null if unavailable), and skillVersion (commit hashes for `util-design-partner-role` and `design-large-task` SKILL.md files).
```
**Replacement:**
```
The helper writes `design/{sprint-name}-session-meta.json` with sprintName, branchName, sessionStartTimestamp (ISO 8601 UTC), jsonlSessionId (best-effort from `CLAUDE_SESSION_ID`; null if unavailable), and skillVersion (commit hash for `util-design-partner-role` SKILL.md).
```

---

### design-specify/SKILL.md — already covered above under Re-point (line 235 dead path)

(Covered in Re-point section — the `design-large-task/references/design-brief-template.md` path reference is removed and the Reads line is rewritten.)

---

### design-brief-small-template.md — lines 20-23 + 138-139

**File:** `skills/design-small-task/references/design-brief-small-template.md`
**Lines:** 20–24
**Current text:**
```
Use the full `design-large-task template (`../../design-large-task/references/design-brief-template.md`)` when:
- The task is complex or ambiguous
- Multiple briefs interact (companion briefs, prior art chains)
- The brief is produced by design-large-task and must match its 9-section envelope+point structure (see `design-large-task template (`../../design-large-task/references/design-brief-template.md`)`)
- Infrastructure dependencies need operational status tracking
```
**Action:** Delete lines 20–24 entirely. The preceding line 19 (`- The brief feeds directly into plan-build (no intermediate spec step)`) and the following line 26 (`## Guiding Principle`) remain. Note: after deletion this creates a logical gap — the "When to Use This Template" section loses the "use the full template when" guidance. A replacement sentence is appropriate:

**Replacement for lines 20–24:**
```
For tasks that are complex, ambiguous, or involve companion briefs and multi-brief dependency chains, use `design-committee` or `design-grillme` instead.
```

**Lines:** 138–139
**Current text:**
```
These sections exist in the full `design-large-task template (`../../design-large-task/references/design-brief-template.md`)` and are omitted here
with rationale:
```
**Replacement:**
```
These sections exist in the full design-large-task brief template (now archived) and are omitted here with rationale:
```

---

### record-formats.md — stage enum entry

**File:** `skills/finish-write-records/references/record-formats.md`
**Line:** 193
**Current text:**
```
stage: design-large-task | design-small-task | design-specify | plan-build | execute-write | finish-write-records
```
**Replacement:**
```
stage: design-small-task | design-specify | plan-build | execute-write | finish-write-records
```

---

## ARCHIVE SITE

### agents/agent-industry-explorer.md

**Source:** `/home/mike/Documents/CodeProjects/Chester/agents/agent-industry-explorer.md`
**Destination:** `/home/mike/Documents/CodeProjects/Chester/_archive/design-large-task/agent-industry-explorer.md`

`_archive/design-large-task/` already exists (confirmed: directory present with existing archived content).

**Action:** `git mv agents/agent-industry-explorer.md _archive/design-large-task/agent-industry-explorer.md`

---

## FORK-POLICY.MD — EXACT ROW RANGE TO DELETE

**File:** `docs/fork-policy.md`
**Lines:** 14–20 (rows 1a through 1g inclusive)

**Line 14 (row 1a):**
```
| 1a | `design-large-task` codebase explorer | `feature-dev:code-explorer` | No | Independent perspectives are the point of fan-out. |
```
**Line 15 (row 1b):**
```
| 1b | `design-large-task` prior-art explorer | `Explore` | No | Same — divergent corpus search. |
```
**Line 16 (row 1c):**
```
| 1c | `design-large-task` industry explorer | `chester:design-large-task-industry-explorer` | No | External research must not inherit design framing. |
```
**Line 17 (row 1d):**
```
| 1d | `design-large-task` step-b innovator | `chester:design-large-task-step-b-innovator` | No | Framing-side dispatch — pole must not inherit sibling poles' framing or lead's analysis. |
```
**Line 18 (row 1e):**
```
| 1e | `design-large-task` step-b conservator | `chester:design-large-task-step-b-conservator` | No | Framing-side dispatch — same rationale as 1d. |
```
**Line 19 (row 1f):**
```
| 1f | `design-large-task` step-b purist | `chester:design-large-task-step-b-purist` | No | Framing-side dispatch — same rationale as 1d. |
```
**Line 20 (row 1g):**
```
| 1g | `design-large-task` step-b pragmatist | `chester:design-large-task-step-b-pragmatist` | No | Framing-side dispatch — same rationale as 1d. |
```

**Action:** Delete lines 14–20. Surviving table begins at line 21 (row 2, plan-build plan reviewer). Row numbers in the table (2 through 11) become the new first through tenth rows — no renumbering is required unless the spec calls for it; the `#` column values are labels, not constraints.

**Note on design-committee poles:** No design-committee rows exist in fork-policy.md. If the spec includes adding new rows for `chester:design-committee-{conservator,innovator,purist,pragmatist}`, those are additions, not re-points, and require new row content. This is outside the delete scope — flag for the spec author.

---

## DOCS/INSTRUCTIONS.MD — FULL LINE SCOPE

All `design-large-task` and `design-figure-out` hits in the file, with line numbers and action:

| Line | Current content | Action |
|------|----------------|--------|
| 31 | `design-large-task`, `design-figure-out`, `design-small-task` in flexible-skills list | Remove `design-large-task`, `design-figure-out` from list |
| 85 | `npm install --prefix skills/design-large-task/proof-mcp` | Delete line |
| 109 | `"args": ["/your/path/to/Chester/skills/design-large-task/proof-mcp/server.js"]` | Delete this MCP entry block (lines 107-110 are the design-large-task proof-mcp server block) |
| 135 | `npm install --prefix skills/design-large-task/proof-mcp` (in Updating section) | Delete line |
| 168 | `design-large-task OR design-small-task OR design-figure-out` in pipeline diagram | Replace with `design-small-task OR design-committee OR design-grillme` |
| 211 | `start-bootstrap` called internally by `design-large-task`, `design-figure-out`, `design-small-task` | Remove `design-large-task`, `design-figure-out` |
| 219–248 | Full `### \`chester:design-large-task\`` section | Delete lines 219–248 entirely (section ends before `### \`chester:design-small-task\`` at line 250) |
| 252 | design-small-task description: "Produces a design brief that feeds directly into `plan-build`, skipping `design-specify`." | This is inaccurate per current SKILL.md (DST now feeds design-specify). Update to match current SKILL.md description. |
| 256 | "How it differs from design-large-task:" bullet header | This is inside the design-small-task section — remove "How it differs from design-large-task:" heading and its bullets (lines 256–269 approximately) or rewrite section |
| 267 | "you probably need `design-large-task` instead" tip | Replace `design-large-task` with `design-committee` or `design-grillme` |
| 273–296 | Full `### \`chester:design-figure-out\`` section | Delete lines 273–296 (section ends before `### \`chester:design-specify\`` at line 298) |
| 300 | design-specify description: "Takes the design brief from `design-large-task` or `design-figure-out`" | Replace with "Takes the design brief from `design-small-task`, a whiteboard, or a human-authored source" |
| 306 | "Automatically after `design-large-task` or `design-figure-out`" | Replace with "Automatically after `design-small-task`" |
| 313 | Architecture comparison table: "three architect agents each with different trade-off profile" | Accurate; no change needed |
| 570 | `util-worktree` when-to-invoke: "Automatically called by `design-large-task` and `design-figure-out` at closure" | Replace with "Automatically called by `design-small-task` at closure" |
| 643 | Design brief templates table: `design-large-task/references/design-brief-template.md` row | Delete that row from the table |
| 672 | "Chester will invoke `design-large-task` automatically" | Replace with "Chester will invoke `design-small-task` or `design-committee` automatically" |
| 684 | Resume: "`design-large-task` and `design-figure-out`: the agent calls `get_thinking_summary()`" | Delete that bullet; `design-small-task` resume guidance (if needed) is a separate item |
| 697 | Section heading: "When to use design-large-task vs. design-small-task" | Replace heading and rewrite section for surviving skills |
| 701 | "New feature with open design questions | `design-large-task`" | Replace with `design-committee` or `design-grillme` |
| 703 | "`design-large-task` MCP servers unavailable | `design-figure-out`" | Delete row |
| 736 | Quick Reference table: `design-large-task` row | Delete row |
| 738 | Quick Reference table: `design-figure-out` row | Delete row |
| 754 | Quick Reference table: `design-large-task/references/design-brief-template.md` row | Delete row |

**Note on lines 83–85 / 107–110 / 133–135 (MCP server install blocks):** These reference the proof-mcp server that was part of design-large-task. The install block in Step 2 (lines 83–85) and the Updating section (lines 133–135) each include `npm install --prefix skills/design-large-task/proof-mcp`. Delete those individual lines. The .mcp.json example (lines 107–110) includes the chester-design-proof server block — delete that block. After deletion, two MCP servers remain: chester-enforcement and chester-understanding (both under design-figure-out). If design-figure-out is also being removed from the active pipeline, those blocks may need removal too — but that is scope outside the brief for this sprint, which targets design-large-task references only. Flag for spec author.

---

## FOUR TESTS — EXACT EDITS

### test-plan-build-heuristic.sh — line 65

**File:** `tests/test-plan-build-heuristic.sh`
**Lines:** 63–68 (the block with comment + assertion)
**Current text:**
```bash
# Must reference design-large-task in the ground-truth cascade context
# (the cascade survives through design-specify because both write into the same
# sprint subdirectory)
if ! grep -q "design-large-task" "$SKILL"; then
  echo "FAIL: $SKILL does not reference design-large-task in cascade context"
  ERRORS=$((ERRORS + 1))
fi
```
**Action:** Delete lines 63–68 entirely. The cascade section in plan-build/SKILL.md (lines 153–155) is being rewritten to remove `design-large-task` — the assertion would fail. No surviving obligation requires DLT to appear in that file. The other assertions in the test (smell heuristic, ground-truth cascade section presence, design-specify as invoker) remain valid and stay.

---

### test-artifact-schema.sh — lines 17-19

**File:** `tests/test-artifact-schema.sh`
**Lines:** 17–19
**Current text:**
```bash
for producer in "design-large-task" "design-small-task" "design-specify" "plan-build" "execute-write" "finish-write-records"; do
  if ! grep -q "$producer" "$SCHEMA"; then
    echo "FAIL: $SCHEMA does not list $producer as producer"
```
**Replacement:**
```bash
for producer in "design-small-task" "design-specify" "plan-build" "execute-write" "finish-write-records"; do
  if ! grep -q "$producer" "$SCHEMA"; then
    echo "FAIL: $SCHEMA does not list $producer as producer"
```
(Remove `"design-large-task"` from the loop list. Lines 20–21 unchanged.)

---

### test-artifact-schema-provenance.sh — lines 24-25

**File:** `tests/test-artifact-schema-provenance.sh`
**Lines:** 24–25
**Current text:**
```bash
for skill in design-large-task design-small-task design-specify plan-build execute-write finish-write-records; do
  grep -q "$skill" "$SCHEMA" || fail "stamping-skill list missing $skill"
```
**Replacement:**
```bash
for skill in design-small-task design-specify plan-build execute-write finish-write-records; do
  grep -q "$skill" "$SCHEMA" || fail "stamping-skill list missing $skill"
```
(Remove `design-large-task` from the loop list. Line 26 unchanged.)

---

### test-ac-4-1-fork-policy-pole-rows.sh — archive the test

**File:** `tests/test-ac-4-1-fork-policy-pole-rows.sh`
**Action:** `git mv tests/test-ac-4-1-fork-policy-pole-rows.sh _archive/design-large-task/tests/test-ac-4-1-fork-policy-pole-rows.sh`

Rationale: The test asserts `chester:design-large-task-step-b-{innovator,conservator,purist,pragmatist}` exist in fork-policy.md, counts `step-b` rows (≥4), and checks for "framing-side" rationale. After deleting rows 1a–1g from fork-policy.md, all three assertions fail. No surviving fork-policy rows use `step-b`. The design-committee poles have no fork-policy rows at all (confirmed: zero such rows exist), so there is nothing to redirect the test toward. The test's AC (AC-4.1) was specific to the design-large-task step-b mechanism; that AC no longer applies.

Target archive path: `_archive/design-large-task/tests/` — create that subdirectory as part of the git mv.

**Note:** If a new AC for design-committee pole fork-policy coverage is added to the spec, a new test should be written from scratch targeting `chester:design-committee-{conservator,innovator,purist,pragmatist}` in fork-policy.md. That is a new test, not a re-point of this one.

---

## VERSION BUMPS — 6 SKILL.MD FILES

All six files have behavior or contract changes (callers listed, integration section, producer lists, voice rules). All qualify for a version bump per CLAUDE.md convention ("any meaningful change to the skill's behavior or contract").

| File | Current version | Next version |
|------|----------------|-------------|
| `skills/start-bootstrap/SKILL.md` | v0002 | v0003 |
| `skills/util-artifact-schema/SKILL.md` | v0002 | v0003 |
| `skills/execute-write/SKILL.md` | v0007 | v0008 |
| `skills/plan-build/SKILL.md` | v0005 | v0006 |
| `skills/util-design-partner-role/SKILL.md` | v0004 | v0005 |
| `skills/design-specify/SKILL.md` | v0003 | v0004 |

Files NOT bumped (changes are documentation-only, not skill behavior/contract):
- `skills/util-worktree/SKILL.md` (v0001) — deleting a stale caller bullet from Integration; no behavior change to the skill itself. Call it borderline — the Integration section is a contract declaration. Spec author should decide. Researcher finding: the deletion removes a caller that no longer exists, which is factually correcting the Integration section. On balance, this qualifies as a contract change (the declared caller list changes). Bump to v0002 if the spec treats Integration sections as contract.
- `skills/design-small-task/SKILL.md` — not in the twelve-file list; no direct edits required by Path A.
- `skills/finish-write-records/references/record-formats.md` — this is a references/ file, not a SKILL.md; no version bump field exists.
- `skills/design-small-task/references/design-brief-small-template.md` — references/ file; no version bump.

---

## SETUP-START/SKILL.MD NOTE

`skills/setup-start/SKILL.md` contains the available-skills list that must stay in sync with skill descriptions. CLAUDE.md requires: "When editing a SKILL.md, the `description` frontmatter field and the skill's entry in `skills/setup-start/SKILL.md` (the available skills list) must stay in sync." The following description changes must be mirrored in setup-start's list:

- `start-bootstrap` description updated → update its entry in setup-start
- `design-specify` description updated → update its entry in setup-start

Researcher did not read setup-start/SKILL.md in this pass. Spec author must include that sync as an edit site.
