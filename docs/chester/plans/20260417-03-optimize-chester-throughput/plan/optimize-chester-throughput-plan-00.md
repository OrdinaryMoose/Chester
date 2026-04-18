# Optimize Chester Throughput Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use execute-write (recommended) or execute-write in inline mode to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate `design-specify`'s earning-their-keep functions into `design-experimental`'s closure as a new Finalization stage, route experimental directly to `plan-build`, make `plan-smell` conditional via a heuristic pre-check, refactor `util-design-brief-template` to a 9-section envelope-plus-point structure, and scrub all references to archived `design-figure-out` and `design-specify` from remaining skills.

**Architecture:** Experimental gains two named contract boundaries (Envelope Handoff, Artifact Handoff) bracketing a single-pass Finalization stage that dispatches one ground-truth subagent plus three architect subagents in parallel. The ground-truth report cascades into `plan-build`, narrowing `plan-attack` to plan-specific additions. `plan-smell` fires conditionally based on a cheap keyword pre-check. The design brief template is refactored in parallel to match experimental's new envelope+point output shape.

**Tech Stack:** Markdown (SKILL.md files), Bash (test scripts), Grep-based structural assertions, Git (commit ordering for reviewability)

**Design Brief:** `docs/chester/working/20260417-03-optimize-chester-throughput/design/optimize-chester-throughput-design-00.md`

**Baseline Commit:** `69d5c0b fix(tests): align baseline with active skill registry` — all eight baseline tests pass against current main.

---

## Task Order and Commit Sequence

Per Design Brief Key Decision 10, commits land in this order:

1. **Task 1:** Refactor `util-design-brief-template` (template first — no skill depends on its content yet)
2. **Task 2:** Scrub archived-skill references from `setup-start`
3. **Task 2b:** Scrub archived-skill references from remaining skill files (`execute-write`, `plan-build` body, `start-bootstrap`, `util-design-brief-small-template`) + cross-skill grep test
4. **Task 3:** Update `util-artifact-schema` artifact table
5. **Task 4:** Add Artifact Handoff terminology to `design-small-task`
6. **Task 5:** Refactor `design-experimental` (adds Finalization + Archival stages, updates transition, replaces Phase 5: Closure heading)
7. **Task 6:** Refactor `plan-build` (smell heuristic + ground-truth cascade, with highest-version glob and error-path handling)
8. **Task 6b:** Optional — add Trust Input note to `plan-attack/SKILL.md` (skill-level acknowledgment of verified-anchor skip-list)
9. **Task 7:** Run cross-skill grep test + full test suite + `/reload-plugins` verification

Each task ends with a single commit. No task depends on the unmerged output of a later task.

---

## Task 1: Refactor `util-design-brief-template` to 9-section envelope-plus-point structure

**Files:**
- Modify: `skills/util-design-brief-template/SKILL.md` (currently 548 lines; target ~250 lines)
- Create: `tests/test-brief-template-structure.sh`

- [ ] **Step 1: Write the failing test**

Create `tests/test-brief-template-structure.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

TPL="skills/util-design-brief-template/SKILL.md"
ERRORS=0

# Required nine sections, in order
REQUIRED_SECTIONS=(
  "## Goal"
  "## Necessary Conditions"
  "## Rules"
  "## Permissions"
  "## Evidence"
  "## Chosen Approach"
  "## Alternatives Considered"
  "## Risks"
  "## Acceptance Criteria"
)

for section in "${REQUIRED_SECTIONS[@]}"; do
  if ! grep -qF "$section" "$TPL"; then
    echo "FAIL: $TPL missing required section: $section"
    ERRORS=$((ERRORS + 1))
  fi
done

# Sections must appear in order
prev_line=0
for section in "${REQUIRED_SECTIONS[@]}"; do
  line=$(grep -nF "$section" "$TPL" | head -1 | cut -d: -f1)
  if [ -z "$line" ]; then continue; fi
  if [ "$line" -le "$prev_line" ]; then
    echo "FAIL: section order violated at: $section (line $line, prev line $prev_line)"
    ERRORS=$((ERRORS + 1))
  fi
  prev_line=$line
done

# Must not reference archived skills
for archived in "design-figure-out" "design-specify"; do
  if grep -q "$archived" "$TPL"; then
    echo "FAIL: $TPL still references archived skill: $archived"
    ERRORS=$((ERRORS + 1))
  fi
done

# Line-count sanity — target is roughly 250 lines, allow 180-320 range
line_count=$(wc -l < "$TPL")
if [ "$line_count" -gt 320 ]; then
  echo "FAIL: $TPL has $line_count lines; target <=320 (refactor under-trimmed)"
  ERRORS=$((ERRORS + 1))
fi
if [ "$line_count" -lt 180 ]; then
  echo "FAIL: $TPL has $line_count lines; target >=180 (refactor over-trimmed)"
  ERRORS=$((ERRORS + 1))
fi

if [ "$ERRORS" -gt 0 ]; then
  echo "FAIL: $ERRORS errors in brief template structure"
  exit 1
fi

echo "PASS: brief template structure correct"
exit 0
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/test-brief-template-structure.sh`
Expected: FAIL — current template uses different section headings (Problem Statement, Design Decisions, Current State Inventory, Assumptions, Residual Risks, etc.) and references archived skills.

- [ ] **Step 3: Rewrite the template file**

Replace entire file content at `skills/util-design-brief-template/SKILL.md` with:

````markdown
---
name: util-design-brief-template
description: >
  Canonical template for design brief output. Read this skill (don't invoke it)
  when writing the design brief artifact at the end of `design-experimental`. Follows
  the envelope-plus-point structure: the envelope (what the proof established) plus the
  point (the architectural approach selected during Finalization).
---

# Design Brief Output Template

This document defines the required structure for design brief artifacts produced by
`design-experimental`. It is the single source of truth for what a design brief must
contain at Artifact Handoff.

A design brief has two layers. The **envelope** is what the proof established — the
goal, the necessary conditions that must hold, the designer-directed rules and
permissions, the codebase evidence the design rests on. The **point** is the
architectural approach selected during Finalization — the HOW that satisfies the
envelope, plus the alternatives considered. Both layers must be self-contained: a
reader who has never seen the design conversation should understand what is being
built, what must be true for it to hold, and how it will be implemented.

## Guiding Principle

The brief must be **self-contained for plan-build**. A plan-build agent that has
never seen the design conversation should be able to write an implementation plan
from this brief alone. Every scope boundary must have a reason legible in the brief.

## Template Structure

Nine required sections, in order.

---

### Goal (REQUIRED)

One paragraph: what is being built and why. Domain language, no code vocabulary.
States the problem from the user's or system's perspective. Does not prescribe HOW.

```markdown
## Goal

{What we're building, why it matters, what problem it solves — one paragraph.}
```

---

### Necessary Conditions (REQUIRED)

The necessary conditions (WHAT) established in the proof. Each condition is something
that must be true for the design to hold. Numbered, with reasoning chain and collapse
test per condition.

```markdown
## Necessary Conditions

1. **{Condition}.** {Reasoning chain — what premises in the envelope make this
   condition necessary.} Collapse test: {what breaks if this condition is removed}.
2. ...
```

If the proof captured rejected alternatives for a condition, note them inline:

```markdown
1. **{Condition}.** {Reasoning.} Collapse test: {what breaks}.
   Rejected alternatives: {alt 1 — why rejected}; {alt 2 — why rejected}.
```

---

### Rules (REQUIRED)

Designer-directed restrictions on the design space. Each rule shapes the envelope of
valid approaches. Scope exclusions, architectural mandates, design directives. These
are explicitly stated by the designer during the proof phase.

```markdown
## Rules

- {Rule} — {what it restricts, in domain language}
```

If the proof has no rules, state: "No designer-directed rules beyond the goal." This
is preferable to omitting the section.

---

### Permissions (REQUIRED)

Designer-directed relief from specific rules. Each permission names the rule it
relaxes and the specific allowance granted. Permissions without a corresponding rule
do not belong here.

```markdown
## Permissions

- {Permission} — relieves: {rule referenced}; {what the approach may do despite the rule}
```

If no permissions were granted, state: "No permissions granted. All rules apply as
stated."

---

### Evidence (REQUIRED)

Codebase facts the design rests on. Each entry is a claim about the current system
verified against the code at the time of the proof. Includes file/type/method anchors
where the claim references specific elements.

```markdown
## Evidence

- {Claim about the current system} ({file path or type name if anchored})
```

The ground-truth verification report produced at Envelope Handoff is a sibling
artifact and contains the full verification detail. This section captures the
evidence list the design relied on, not the verification findings.

---

### Chosen Approach (REQUIRED)

The architectural approach selected during Finalization. Describes the shape of the
solution — components, reuse profile, trade-off profile. This is the HOW. Sourced
from the architect proposal the designer adopted (or the designer's articulated
hybrid or own direction).

```markdown
## Chosen Approach

{2-4 paragraphs describing the shape — what gets built, how it integrates with
existing code, what trade-offs it makes. Domain language with specific file/type
references where needed.}

**Component Structure:**
- {New or modified unit}
- ...

**Reuse Profile:**
- {Existing code or pattern leveraged}
- ...

**Trade-off Summary:**
- Optimized for: {things this approach prioritizes}
- Sacrificed: {things this approach gives up}
```

---

### Alternatives Considered (REQUIRED)

The architectural approaches that were not adopted. Sourced from the architect
proposals the designer did not pick (or from hybrids where only part of a proposal
was folded in). For each alternative, describe the shape briefly and record why it
was rejected in favor of the Chosen Approach.

```markdown
## Alternatives Considered

### {Alternative name or trade-off lens}

{Shape summary — 2-3 sentences.}

**Why not chosen:** {rationale, typically referencing envelope constraints the
alternative violates or trade-offs the designer preferred to avoid}
```

If only one alternative was meaningfully considered, include one entry. If the
architect proposals all converged on near-identical shapes, state that explicitly
— the fact that the comparison produced narrow breadth is itself useful signal.

---

### Risks (REQUIRED)

Hazards that remain even if the Chosen Approach is implemented correctly. Sourced
from the proof's RISK elements plus any new risks surfaced during Finalization
(ground-truth findings that were noted rather than forcing revision, architect
proposal concerns adopted into the approach).

```markdown
## Risks

- {Specific failure mode — what could go wrong, not just "area of concern"}
```

Be specific. "Type placement is a risk" is not useful. "If future projects need the
canonical form types, they would reference Application.Contracts, creating a
cross-hierarchy dependency" is.

---

### Acceptance Criteria (REQUIRED)

Observable, testable conditions for completion. Each criterion is something a
developer can verify by running a test or check. Subjective criteria ("code is
clean") and restatements of the design ("the canonical form exists") do not belong.

```markdown
## Acceptance Criteria

- {Observable condition that must be true when the work is complete}
```

---

## Section Ordering Summary

1. Goal
2. Necessary Conditions
3. Rules
4. Permissions
5. Evidence
6. Chosen Approach
7. Alternatives Considered
8. Risks
9. Acceptance Criteria

All nine sections are required. If a section would be empty, include it with an
explicit "None" statement rather than omitting it — this tells the reader you
considered it.

---

## Relationship to Sibling Artifacts

The design brief is one of four artifacts produced at Artifact Handoff:

- **Design brief** (this template) — envelope + point + risks + acceptance
- **Thinking summary** — decision history including Finalization Reasoning
- **Process evidence** — operational narrative including Finalization Metrics
- **Ground-truth report** — verification findings against the Evidence section

The brief cross-references the sibling artifacts but is readable on its own.

---

## The Self-Containment Test

Before finalizing the brief: **Could a plan-build agent consume this brief and write
an implementation plan without needing to read the design conversation or the
sibling artifacts?** If the answer is no, the Evidence, Chosen Approach, or Risks
sections are incomplete.

---

## Lightweight Alternative

`design-small-task` uses `util-design-brief-small-template` instead of this template.
The small template has six sections (Goal, Prior Art, Scope, Key Decisions,
Constraints, Acceptance Criteria) optimized for direct plan-build consumption when
there is no proof phase upstream. `plan-build` reads both templates by section
heading and does not branch on which design skill produced the brief.
````

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/test-brief-template-structure.sh`
Expected: PASS

Also run full test suite to verify no regressions: `for t in tests/test-*.sh; do echo "=== $t ==="; bash "$t" 2>&1 | tail -3; done`
Expected: all eight pre-existing tests plus the new template test pass.

- [ ] **Step 5: Commit**

```bash
git -C /home/mike/Documents/CodeProjects/Chester/.worktrees/20260417-03-optimize-chester-throughput add skills/util-design-brief-template/SKILL.md tests/test-brief-template-structure.sh
git -C /home/mike/Documents/CodeProjects/Chester/.worktrees/20260417-03-optimize-chester-throughput commit -m "refactor(template): util-design-brief-template to 9-section envelope+point

Replace the 13-section template (which referenced archived design-figure-out
and design-specify) with a 9-section envelope-plus-point structure matching
design-experimental's new Finalization output. Sections: Goal, Necessary
Conditions, Rules, Permissions, Evidence, Chosen Approach, Alternatives
Considered, Risks, Acceptance Criteria. Prose density reduced to roughly 250
lines from 548.

Plain names in the artifact; semantic names (envelope, Foundation, Hazards)
stay in skill instructions and architect prompts per design brief decision 9.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Scrub archived-skill references from `setup-start`

**Files:**
- Modify: `skills/setup-start/SKILL.md`
- Modify: `tests/test-start-cleanup.sh` (add archived-skill check)

- [ ] **Step 1: Extend the failing test**

Append to `tests/test-start-cleanup.sh` before the final `echo "PASS..."` line:

```bash

# Must not reference archived skills in the available-skills list or priority
for archived in "design-figure-out" "design-specify"; do
  if grep -q "$archived" "$SKILL"; then
    echo "FAIL: $SKILL still references archived skill: $archived"
    exit 1
  fi
done
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/test-start-cleanup.sh`
Expected: FAIL — current `setup-start` mentions both archived skills in the skill list, priority section, and examples.

- [ ] **Step 3: Modify `setup-start/SKILL.md`**

Three edits to `skills/setup-start/SKILL.md`:

**Edit A — Skill Priority section.** Replace lines referencing archived skills:

Old (around line 224-231):
```
1. **Gate skills first** (`design-figure-out`, `design-experimental`, `design-small-task`, `design-specify`, `plan-build`, `execute-write`, `execute-verify-complete`, `finish-close-worktree`) — these define the overall pipeline stage and determine HOW to approach the task
2. **Review skills second** (`plan-attack`, `plan-smell`, `util-codereview`) — these harden and validate the work
3. **Behavioral skills third** (`execute-test`, `execute-debug`, `execute-prove`, `execute-review`) — these guide specific execution disciplines
4. **Utility skills fourth** (`util-worktree`, `util-dispatch`) — these support workflow mechanics

"Let's build X" → `design-figure-out` first, then `design-specify`, then `plan-build`.
"Quick design check for X" → `design-small-task` first, then `plan-build`.
"Write a spec for this" → `design-specify` directly.
"Fix this bug" → `execute-debug` first, then domain-specific skills.
```

New:
```
1. **Gate skills first** (`design-experimental`, `design-small-task`, `plan-build`, `execute-write`, `execute-verify-complete`, `finish-close-worktree`) — these define the overall pipeline stage and determine HOW to approach the task
2. **Review skills second** (`plan-attack`, `plan-smell`, `util-codereview`) — these harden and validate the work
3. **Behavioral skills third** (`execute-test`, `execute-debug`, `execute-prove`, `execute-review`) — these guide specific execution disciplines
4. **Utility skills fourth** (`util-worktree`, `util-dispatch`) — these support workflow mechanics

"Let's build X with architectural choices" → `design-experimental` first, then `plan-build`.
"Quick design check for X" → `design-small-task` first, then `plan-build`.
"Fix this bug" → `execute-debug` first, then domain-specific skills.
```

**Edit B — Available Chester Skills section.** Remove the `design-figure-out` and `design-specify` bullet entries (around lines 247 and 250). Keep `design-experimental` and `design-small-task`. Update `design-experimental`'s description to drop "Fork of design-figure-out for validating proof-based design discipline" and replace with "Default structural design skill: Plan Mode understanding phase followed by formal proof-building, with a Finalization stage that verifies the proof foundation and generates competing architectural approaches via three architect subagents."

**Edit C — Pipeline skill ordering note.** After the Pipeline Skills bullet list, the order currently implies figure-out → specify → plan-build. Update any such ordering to reflect experimental → plan-build direct.

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/test-start-cleanup.sh`
Expected: PASS

Run full suite: `for t in tests/test-*.sh; do echo "=== $t ==="; bash "$t" 2>&1 | tail -3; done`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git -C /home/mike/Documents/CodeProjects/Chester/.worktrees/20260417-03-optimize-chester-throughput add skills/setup-start/SKILL.md tests/test-start-cleanup.sh
git -C /home/mike/Documents/CodeProjects/Chester/.worktrees/20260417-03-optimize-chester-throughput commit -m "refactor(setup-start): remove references to archived design skills

Drop design-figure-out and design-specify from the skill registry,
priority section, and pipeline examples. Update design-experimental's
description to reflect its new role as the default structural design
skill (no longer 'experimental / fork of figure-out').

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2b: Scrub archived-skill references from remaining skill files

**Files:**
- Modify: `skills/execute-write/SKILL.md`
- Modify: `skills/plan-build/SKILL.md` (body text only — Integration section is updated in Task 6)
- Modify: `skills/start-bootstrap/SKILL.md`
- Modify: `skills/util-design-brief-small-template/SKILL.md`
- Create: `tests/test-no-archived-refs.sh` (cross-skill grep assertion)

This task exists because on-disk verification at the hardening gate found archived-skill references in five files beyond the scope of Task 2. The design brief's acceptance criteria #1 and #2 require zero references across any active skill file.

- [ ] **Step 1: Write the failing cross-skill grep test**

Create `tests/test-no-archived-refs.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

ERRORS=0

# Scan every active skills/*/SKILL.md for archived-skill references.
# Exclude workspace/output subdirectories (test fixtures, not live skills).
for skill in skills/*/SKILL.md; do
  for archived in "design-figure-out" "design-specify"; do
    if grep -q "$archived" "$skill"; then
      echo "FAIL: $skill references archived skill: $archived"
      ERRORS=$((ERRORS + 1))
    fi
  done
done

if [ "$ERRORS" -gt 0 ]; then
  echo "FAIL: $ERRORS archived-skill references across active skills"
  exit 1
fi

echo "PASS: no archived-skill references in any active skill"
exit 0
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/test-no-archived-refs.sh`
Expected: FAIL — references present in execute-write (line 25), plan-build body (lines 22, 45, 53), start-bootstrap (lines 6–7, 18–19), util-design-brief-small-template (lines 13, 21, 26, 155), and (depending on Task 2 status) setup-start.

- [ ] **Step 3: Modify the four files**

**Edit A — `skills/execute-write/SKILL.md`**

Find the line referencing `design-figure-out` (around line 25, Worktree Setup section):
```
- Verify that a worktree already exists (created by design-figure-out earlier in the pipeline)
```

Replace with:
```
- Verify that a worktree already exists (created by `design-experimental` or `design-small-task` earlier in the pipeline, or by `util-worktree` if invoked standalone)
```

Also check line 27 or surrounding context for "e.g., execute-write invoked standalone without a prior figure-out session" and replace references to figure-out with generic "design phase" language.

**Edit B — `skills/plan-build/SKILL.md` body text (non-Integration)**

Three locations:

Line 22 (Task reset example):
```
**Task reset (do first, do not track):** Before creating any tasks, call TaskList. If any tasks exist from a previous skill (e.g., design-figure-out), delete them all via TaskUpdate with status: `deleted`. This is housekeeping — do not create a tracked task for it.
```
Replace `e.g., design-figure-out` with `e.g., design-experimental`.

Line 45 (Context note):
```
**Context:** This should be run in a dedicated worktree (created by design-figure-out skill).
```
Replace with:
```
**Context:** This should be run in a dedicated worktree (created by `design-experimental` or `design-small-task` during their Archival / closure stage).
```

Line 53 (Scope Check):
```
If the spec covers multiple independent subsystems, it should have been broken into sub-project specs during design-figure-out. If it wasn't, suggest breaking this into separate plans — one per subsystem. Each plan should produce working, testable software on its own.
```
Replace `during design-figure-out` with `during the design phase (design-experimental's proof loop, or design-small-task's conversation)` and change "spec" to "brief" to match the new pipeline where plans consume briefs directly.

**Edit C — `skills/start-bootstrap/SKILL.md`**

Frontmatter (lines 6–7):
```
  creation, task reset, and thinking history initialization. Called by design-figure-out,
  design-specify (standalone), and execute-write (standalone).
```
Replace with:
```
  creation, task reset, and thinking history initialization. Called by design-experimental
  and execute-write (standalone).
```

Body (lines 18–19, "When to Call" section):
```
- **Always:** `design-figure-out` (starts fresh sprints)
- **Standalone only:** `design-specify`, `execute-write` (when invoked without a prior
  design phase, they need sprint context created; when invoked mid-pipeline, sprint
  context already exists)
```
Replace with:
```
- **Always:** `design-experimental` (starts fresh sprints)
- **Standalone only:** `execute-write` (when invoked without a prior
  design phase, it needs sprint context created; when invoked mid-pipeline, sprint
  context already exists)
```

Also update any other body references — the skill body section ("Step 4: Establish Sprint Name") may have figure-out references in examples.

**Edit D — `skills/util-design-brief-small-template/SKILL.md`**

Line 13 (intro prose):
```
which serves `design-figure-out` and `design-experimental`.
```
Replace with:
```
which serves `design-experimental`.
```

Line 21 (When to Use):
```
- The brief feeds directly into plan-build, skipping design-specify
```
Replace with:
```
- The brief feeds directly into plan-build (no intermediate spec step)
```

Line 26 (Use the full template when):
```
- The brief will be consumed by design-specify's three architect agents
```
Replace with:
```
- The brief is produced by design-experimental and must match its 9-section envelope+point structure (see `util-design-brief-template`)
```

Line 155 (Sections Deliberately Omitted tail):
```
task is not actually bounded and should use the full template with `design-figure-out`
or `design-experimental`.
```
Replace with:
```
task is not actually bounded and should use the full template with `design-experimental`.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/test-no-archived-refs.sh`
Expected: PASS.

Run full suite:
```bash
for t in tests/test-*.sh; do echo "=== $t ==="; bash "$t" 2>&1 | tail -3; done
```
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git -C /home/mike/Documents/CodeProjects/Chester/.worktrees/20260417-03-optimize-chester-throughput add skills/execute-write/SKILL.md skills/plan-build/SKILL.md skills/start-bootstrap/SKILL.md skills/util-design-brief-small-template/SKILL.md tests/test-no-archived-refs.sh
git -C /home/mike/Documents/CodeProjects/Chester/.worktrees/20260417-03-optimize-chester-throughput commit -m "refactor: scrub archived design-figure-out and design-specify references

Remove remaining references to the archived skills from execute-write
(worktree setup note), plan-build body (task reset example, context
note, scope check), start-bootstrap (frontmatter and When-to-Call
section), and util-design-brief-small-template (intro, When-to-Use
list, tail note).

Add tests/test-no-archived-refs.sh as a cross-skill grep assertion
that fails if any active skills/*/SKILL.md contains 'design-figure-out'
or 'design-specify'. This replaces the per-skill checks that were
added in earlier tasks with a single authoritative gate.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Update `util-artifact-schema` artifact producer table

**Files:**
- Modify: `skills/util-artifact-schema/SKILL.md`
- Create: `tests/test-artifact-schema.sh`

- [ ] **Step 1: Write the failing test**

Create `tests/test-artifact-schema.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

SCHEMA="skills/util-artifact-schema/SKILL.md"
ERRORS=0

# Must not list archived skills as producers
for archived in "design-figure-out" "design-specify"; do
  if grep -q "$archived" "$SCHEMA"; then
    echo "FAIL: $SCHEMA references archived skill: $archived"
    ERRORS=$((ERRORS + 1))
  fi
done

# Must list design-experimental as producer of design artifacts
if ! grep -q "design-experimental" "$SCHEMA"; then
  echo "FAIL: $SCHEMA does not list design-experimental as producer"
  ERRORS=$((ERRORS + 1))
fi

# Must include ground-truth-report artifact type
if ! grep -q "ground-truth" "$SCHEMA"; then
  echo "FAIL: $SCHEMA missing ground-truth artifact type"
  ERRORS=$((ERRORS + 1))
fi

if [ "$ERRORS" -gt 0 ]; then
  echo "FAIL: $ERRORS errors in artifact schema"
  exit 1
fi

echo "PASS: artifact schema correct"
exit 0
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/test-artifact-schema.sh`
Expected: FAIL — current schema lists `design-figure-out` and `design-specify` in the Artifact Types table.

- [ ] **Step 3: Modify `util-artifact-schema/SKILL.md`**

Replace the Artifact Types table (around lines 104-115) with:

```markdown
| Artifact | Directory | Purpose | Produced by |
|----------|-----------|---------|-------------|
| `design` | `design/` | Design brief — envelope + chosen approach | `design-experimental`, `design-small-task` |
| `thinking` | `design/` | Thinking summary — decision history including Finalization reasoning | `design-experimental` |
| `process` | `design/` | Process evidence — operational narrative including Finalization metrics | `design-experimental` |
| `ground-truth-report` | `design/` | Ground-truth findings — codebase verification of Evidence elements, produced at Envelope Handoff | `design-experimental` (Finalization stage) |
| `plan` | `plan/` | Implementation plan — task-by-task build instructions | `plan-build` |
| `plan-threat-report` | `plan/` | Combined plan-attack + plan-smell findings | `plan-build` (hardening phase) |
| `deferred` | `plan/` | Items deferred during execution | `execute-write` |
| `summary` | `summary/` | Session summary — what happened and why | `finish-write-records` |
| `audit` | `summary/` | Reasoning audit — decision-level trace | `finish-write-records` |
```

Also: remove the `spec` and `spec-ground-truth-report` rows entirely (design-specify is archived; ground-truth is now produced by experimental's Finalization).

Update the State Files (Non-Artifact) table:
- Remove `{sprint-name}-enforcement-state.json` (produced by archived design-figure-out)
- Replace understanding-state entry with proof-state: `{sprint-name}-proof-state.json` in `design/`, purpose "Design Proof MCP state"

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/test-artifact-schema.sh`
Expected: PASS

Run full suite: `for t in tests/test-*.sh; do echo "=== $t ==="; bash "$t" 2>&1 | tail -3; done`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git -C /home/mike/Documents/CodeProjects/Chester/.worktrees/20260417-03-optimize-chester-throughput add skills/util-artifact-schema/SKILL.md tests/test-artifact-schema.sh
git -C /home/mike/Documents/CodeProjects/Chester/.worktrees/20260417-03-optimize-chester-throughput commit -m "refactor(artifact-schema): update producer table for active pipeline

Remove design-figure-out and design-specify as artifact producers. Add
ground-truth-report as produced by design-experimental at Envelope
Handoff during the Finalization stage. Drop the spec row and
spec-ground-truth-report row (design-specify is archived). Replace
enforcement/understanding state file references with proof-state.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Add Artifact Handoff terminology to `design-small-task`

**Files:**
- Modify: `skills/design-small-task/SKILL.md`
- Create: `tests/test-small-task-artifact-handoff.sh`

- [ ] **Step 1: Write the failing test**

Create `tests/test-small-task-artifact-handoff.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

SKILL="skills/design-small-task/SKILL.md"
ERRORS=0

# Must reference Artifact Handoff at the brief-writing moment
if ! grep -q "Artifact Handoff" "$SKILL"; then
  echo "FAIL: $SKILL does not reference Artifact Handoff"
  ERRORS=$((ERRORS + 1))
fi

# Must still transition to plan-build
if ! grep -q "plan-build" "$SKILL"; then
  echo "FAIL: $SKILL does not reference plan-build"
  ERRORS=$((ERRORS + 1))
fi

# Must not reference archived skills
for archived in "design-figure-out" "design-specify"; do
  if grep -q "$archived" "$SKILL"; then
    echo "FAIL: $SKILL references archived skill: $archived"
    ERRORS=$((ERRORS + 1))
  fi
done

if [ "$ERRORS" -gt 0 ]; then
  echo "FAIL: $ERRORS errors"
  exit 1
fi

echo "PASS: design-small-task uses Artifact Handoff terminology"
exit 0
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/test-small-task-artifact-handoff.sh`
Expected: FAIL — current skill does not use "Artifact Handoff" name. It also mentions "design-specify" in the comment "skipping design-specify" (frontmatter description, line 3) and in the Integration section ("Does NOT call: design-specify"), both of which need to be updated.

- [ ] **Step 3: Modify `design-small-task/SKILL.md`**

**Edit A — Frontmatter description.** Replace:
```
description: "Lightweight design conversation for well-bounded tasks. Use when the task is clear but you want to surface considerations before jumping to planning. Holds an interactive Q&A loop with structured information packages — the agent presents observations and asks questions, never suggests proceeding. The designer explicitly directs when to write the brief. Feeds directly into plan-build, skipping design-specify."
```
With:
```
description: "Lightweight design conversation for well-bounded tasks. Use when the task is clear but you want to surface considerations before jumping to planning. Holds an interactive Q&A loop with structured information packages — the agent presents observations and asks questions, never suggests proceeding. The designer explicitly directs when to write the brief. Produces a six-section brief at Artifact Handoff and transitions directly to plan-build."
```

**Edit B — Phase 5: Closure heading.** Replace:
```
## Phase 5: Closure

When the designer explicitly directs you to proceed (e.g., "go ahead," "write it up,"
"proceed," "let's build it"):

1. Write the design brief to `{CHESTER_WORKING_DIR}/{sprint-subdir}/design/{sprint-name}-design-00.md`
   following the template in `util-design-brief-small-template`:
```
With:
```
## Phase 5: Closure (Artifact Handoff)

When the designer explicitly directs you to proceed (e.g., "go ahead," "write it up,"
"proceed," "let's build it"), perform the Artifact Handoff — crossing from in-conversation
design into durable written artifacts:

1. Write the design brief to `{CHESTER_WORKING_DIR}/{sprint-subdir}/design/{sprint-name}-design-00.md`
   following the template in `util-design-brief-small-template`:
```

**Edit C — Integration section.** Replace:
```
- **Does NOT call:** `design-specify`, any MCP server
```
With:
```
- **Does NOT call:** any MCP server; no proof phase, no architect comparison, no ground-truth verification — the bounded-task brief goes directly to plan-build
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/test-small-task-artifact-handoff.sh`
Expected: PASS

Run full suite: `for t in tests/test-*.sh; do echo "=== $t ==="; bash "$t" 2>&1 | tail -3; done`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git -C /home/mike/Documents/CodeProjects/Chester/.worktrees/20260417-03-optimize-chester-throughput add skills/design-small-task/SKILL.md tests/test-small-task-artifact-handoff.sh
git -C /home/mike/Documents/CodeProjects/Chester/.worktrees/20260417-03-optimize-chester-throughput commit -m "refactor(design-small-task): adopt Artifact Handoff terminology

Rename Phase 5 Closure to 'Closure (Artifact Handoff)' to match the
boundary terminology introduced for design-experimental. Drop the
reference to archived design-specify from the frontmatter description
and Integration section. Procedure and six-section brief template
unchanged.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Refactor `design-experimental` — add Finalization + Archival stages, update transition

**Files:**
- Modify: `skills/design-experimental/SKILL.md`
- Create: `tests/test-experimental-finalization.sh`

This is the largest task. Split into sub-tasks below.

**Sub-task 5A — Write the failing test**

- [ ] Create `tests/test-experimental-finalization.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

SKILL="skills/design-experimental/SKILL.md"
ERRORS=0

# Frontmatter description must not contain "experimental" or "fork"
# (the skill is now the default structural design path)
DESC=$(awk '/^description:/,/^---$/' "$SKILL" | head -20)
for word in "experimental" "fork"; do
  # Check only inside the description block (case-insensitive)
  if echo "$DESC" | grep -q -i "$word"; then
    echo "FAIL: frontmatter description contains forbidden word: $word"
    ERRORS=$((ERRORS + 1))
  fi
done

# Must not reference archived design-figure-out
if grep -q "design-figure-out" "$SKILL"; then
  echo "FAIL: $SKILL still references archived design-figure-out"
  ERRORS=$((ERRORS + 1))
fi

# Must define the two named boundaries
for boundary in "Envelope Handoff" "Artifact Handoff"; do
  if ! grep -q "$boundary" "$SKILL"; then
    echo "FAIL: $SKILL missing boundary: $boundary"
    ERRORS=$((ERRORS + 1))
  fi
done

# Must have Finalization and Archival stage sections
for stage in "Finalization" "Archival"; do
  if ! grep -q "## $stage\|### $stage\|# $stage" "$SKILL"; then
    echo "FAIL: $SKILL missing stage section: $stage"
    ERRORS=$((ERRORS + 1))
  fi
done

# Must transition to plan-build, not design-specify
if grep -q "Transitions to:.*design-specify\|transition to design-specify\|transition to \`design-specify\`" "$SKILL"; then
  echo "FAIL: $SKILL still transitions to design-specify"
  ERRORS=$((ERRORS + 1))
fi
if ! grep -q "Transitions to:.*plan-build\|transition to plan-build\|transition to \`plan-build\`" "$SKILL"; then
  echo "FAIL: $SKILL does not transition to plan-build"
  ERRORS=$((ERRORS + 1))
fi

# Must reference the five-step Finalization procedure
for step in "Dispatch" "Aggregate" "Recommend" "Reconcile" "Close"; do
  if ! grep -q "$step" "$SKILL"; then
    echo "FAIL: $SKILL missing Finalization step: $step"
    ERRORS=$((ERRORS + 1))
  fi
done

# Must mention ground-truth report as a produced artifact
if ! grep -q -i "ground-truth" "$SKILL"; then
  echo "FAIL: $SKILL does not reference ground-truth report"
  ERRORS=$((ERRORS + 1))
fi

# Must mention three architects with trade-off lenses
for lens in "minimal" "clean" "pragmatic"; do
  if ! grep -q -i "$lens" "$SKILL"; then
    echo "FAIL: $SKILL missing architect lens: $lens"
    ERRORS=$((ERRORS + 1))
  fi
done

if [ "$ERRORS" -gt 0 ]; then
  echo "FAIL: $ERRORS errors in design-experimental"
  exit 1
fi

echo "PASS: design-experimental Finalization stage structure correct"
exit 0
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/test-experimental-finalization.sh`
Expected: FAIL on multiple criteria — current frontmatter contains "Experimental" and "Fork", Envelope/Artifact Handoff sections absent, transition still to design-specify, Finalization steps absent, ground-truth not referenced, architect lenses absent.

**Sub-task 5B — Update frontmatter description**

- [ ] **Step 3a: Rewrite frontmatter**

Replace:
```
---
name: design-experimental
description: "Experimental two-phase design skill: Plan Mode understanding (Phase 1), formal proof-building with structural validation (Phase 2). Fork of design-figure-out for validating proof-based design discipline."
---
```

With:
```
---
name: design-experimental
description: "Default structural design skill for architectural or multi-decision work. Plan Mode understanding phase (Phase 1), formal proof-building with structural validation (Phase 2), then a Finalization stage that verifies the proof foundation against the codebase and generates competing architectural approaches via three architect subagents. Use when the task involves structural choices that need grounded design before implementation. For bounded edits where the target is clear, use design-small-task instead."
---
```

**Sub-task 5C — Update the Checklist and Closure section**

- [ ] **Step 3b: Modify the Checklist section (Phases 1-7)**

Replace the eight-item checklist with:
```markdown
## Checklist

You MUST create a task for each of these items and complete them in order:

1. **Bootstrap** — invoke `start-bootstrap` (handles config, sprint naming, dir creation, task reset, thinking history)
2. **EnterPlanMode** — call `EnterPlanMode` after bootstrap completes
3. **Parallel codebase exploration** — dispatch 4 agents in parallel: 3 `feature-dev:code-explorer` agents to scan similar features, architecture, and extension points + 1 prior art explorer to research previous sprint design artifacts; read all identified files
4. **Round one** — use explorer findings + own exploration, present gap map, offer first commentary, announce Phase 1. No MCP initialization.
5. **Understand phase** — per-turn conversational cycle (no MCP, no scoring, no structured submissions)
6. **Phase transition** — designer confirms understanding, `capture_thought()` with tag `understanding-confirmed` and stage `Transition`, call `ExitPlanMode`
7. **Proof phase** — present designer's verbatim problem statement for confirmation, initialize proof MCP, per-turn proof cycle with necessary conditions model
8. **Closing argument** — compose and present the closing argument; designer approval settles the proof
9. **Finalization (Envelope Handoff)** — dispatch parallel gate (1 ground-truth + 3 architects), aggregate findings, offer recommendation, reconcile with designer, close stage
10. **Archival (Artifact Handoff)** — write four artifacts (design brief, thinking summary, process evidence, ground-truth report), invoke `util-worktree`, update lessons table, transition to plan-build
```

**Sub-task 5D — Replace the existing Phase 5 Closure section with Finalization + Archival stages**

- [ ] **Step 3c: Replace `## Phase 5: Closure` heading and its entire body**

**Important:** This edit REPLACES the existing `## Phase 5: Closure` heading and everything under it (up to but not including the next `## ` heading — typically `## Artifacts Produced` or `## Integration`). Do NOT leave the `## Phase 5: Closure` heading in the file. The new `## Finalization Stage` and `## Archival Stage` sections below are the complete replacement.

After the replacement, the file's section progression should read: ... Phase 4 content → `## Finalization Stage` → `## Archival Stage` → `## Artifacts Produced` (existing, may need update per Sub-task 5G) → `## Integration` (updated in Sub-task 5F). No duplicated closure material.

Replacement content (substitute for the entire existing `## Phase 5: Closure` section):

```markdown
---

## Finalization Stage

Finalization operates on the settled envelope after the designer approves the closing
argument. The envelope is frozen at Envelope Handoff; Finalization selects a point
within it. The stage fires once per closing-argument approval; automatic re-runs are
not supported. Deep-case proof reopening is designer-initiated only.

### Envelope Handoff (Contract Boundary)

**Payload crossing the boundary:** the envelope — problem statement, necessary
conditions (with reasoning chains, collapse tests, rejected alternatives), rules,
permissions, evidence foundation, risks, closing argument. Frozen at designer
approval; consumers cannot modify it.

**Consumers:** four subagents dispatched in parallel in a single message.

**Ground-truth subagent input projection:**
- Problem statement (from proof initialization)
- Closing argument (inline prose)
- EVIDENCE verification rows: for each EVIDENCE element in the proof state, project
  into `{claim: <statement>, anchor: <file-path-or-symbol-extracted-from-statement>,
  proof_element_id: <element_id>}`. If no anchor can be extracted from the statement
  text, set `anchor: null` — the subagent will flag such rows as unverifiable.

**Anchor extraction convention** (worked example):

Anchors are extracted from EVIDENCE `statement` text by locating the most specific
code reference the claim names. The extraction prefers a project-relative file path
when one is present, then a fully qualified type or method name, then a symbol name.
If multiple candidates appear, pick the one the claim is primarily about.

Examples (statement → extracted anchor):

- `"Pipeline.cs has 1,481 lines and is organized as a single class."` → `Pipeline.cs`
- `"The IValidator interface declares a single Validate method on Application.Contracts."` → `IValidator`
- `"StoryDesigner.Compiler.Services.PipelineBuilder is DI-registered as singleton in Program.cs."` → `StoryDesigner.Compiler.Services.PipelineBuilder`
- `"The system has three validation layers but only two are wired in production."` → `null` (no specific anchor — flag as unverifiable)
- `"Logic/Validation/Rules/RangeRule.cs implements IValidationRule<NumericValue>."` → `Logic/Validation/Rules/RangeRule.cs`

The convention is deliberately simple: prose judgment, one anchor per row. The
ground-truth subagent uses the anchor to find the target in the codebase; the claim
text drives the verification verdict. If the subagent cannot locate the anchor, it
returns NOT-FOUND for that row.

**Architect subagent input (each of three, isolated-parallel, no cross-contamination):**
- Problem statement
- Necessary conditions (with reasoning chains and collapse tests)
- Rules (designer-directed restrictions)
- Permissions (designer-directed relief, with `relieves` references)
- Evidence foundation (all EVIDENCE elements' statements, unprojected — architects
  read the full foundation, not just anchors)
- Risks
- Closing argument (for context)
- Trade-off lens: one of minimal-changes / clean-architecture / pragmatic-balance

**Architect output (each returns, structured bulleted format, no tables):**
- **Approach Summary** — 2-3 sentences naming the shape
- **Component Structure** — bullets of new or modified units
- **Reuse Profile** — bullets of existing code or patterns leveraged
- **Trade-off Summary** — "Optimized for:" bullets + "Sacrificed:" bullets
- **Envelope Compliance** — per-necessary-condition satisfied-by, per-rule respected-how, per-permission-leveraged-where
- **Risks Introduced** — bullets

Architects do NOT produce a per-architect "Alternatives Considered" section —
aggregation across the three architects is this stage's job.

### Five Steps

1. **Dispatch** — Launch four subagents in parallel in a single message. Explicit
   dispatch directives:
   - **Ground-truth subagent:** use the default general-purpose agent with the
     ground-truth input projection above embedded in the prompt.
   - **Three architect subagents:** use `subagent_type: "feature-dev:code-architect"`
     with the minimal-changes, clean-architecture, and pragmatic-balance lens
     prompts. Each architect receives the full envelope (problem statement,
     necessary conditions, rules, permissions, evidence foundation, risks, closing
     argument) and operates in isolation — no cross-contamination between the three.

   All four dispatches go in one message so wall-clock cost is one wait regardless
   of per-subagent duration.

2. **Aggregate** — Receive all four reports. Do not present piecemeal. Assemble into
   one coherent presentation: ground-truth findings grouped by severity
   (HIGH / MEDIUM / LOW) with per-finding recommended action (accept-as-risk-note /
   revise-brief / reopen-proof), followed by three parallel bulleted blocks — one
   per architect — each using the six-section output structure.

3. **Recommend** — Offer an opinionated take: given the proof's reasoning and the
   envelope's shape, which architect approach fits best, or does the designer's
   implicit direction still fit better? Provide reasoning. The designer may agree,
   push back, or redirect.

4. **Reconcile** — Designer works two tracks:
   - **GT findings track:** per finding, accept-as-risk-note (goes into brief's
     Risks section), revise-brief (update Evidence or Chosen Approach section),
     or reopen-proof (deep case, see below).
   - **Approach track:** pick one of A1/A2/A3, articulate a hybrid, stay with the
     implicit direction from the proof, or reopen-proof. If hybrid or own direction,
     polish-readback-confirm — the agent reads back the articulated approach in
     clean language and asks for explicit approval (same pattern as problem statement
     at Phase 2 entry).

5. **Close** — When both tracks resolve, Finalization closes. Proceed to Archival.

### Deep Case — Designer-Initiated Proof Reopening

Reopening the proof is rare and only happens at the designer's explicit direction.
If a ground-truth HIGH finding demolishes a load-bearing EVIDENCE element, or an
architect proposal reveals a structural gap that invalidates a necessary condition,
the designer may choose to reopen. Procedure:

1. `get_proof_state` to load the current proof.
2. Designer identifies which elements to revise or withdraw.
3. `submit_proof_update` with the appropriate revise or withdraw operations.
4. Return to Phase 2 proof loop for at least one more round.
5. Compose a new closing argument; re-approval required.
6. Finalization stage repeats from step 1.

Reopening is never automatic. The skill surfaces the option; the designer decides.

---

## Archival Stage

After Finalization closes, the skill writes durable artifacts and hands off to
plan-build.

### Artifact Handoff (Contract Boundary)

**Payload crossing the boundary:** the design point — envelope (unchanged from
Envelope Handoff) plus chosen approach, alternatives considered, ground-truth
report, reconciled risks.

**Consumers:** file system (durable artifacts in `design/` subdirectory),
`finish-archive-artifacts` (copies artifacts into worktree plans/ at merge),
`plan-build` (reads brief + ground-truth report at next stage).

**Payload invariant:** once written, artifacts are authoritative for this sprint.
Plan-build operates on them; later skills read them without re-verification.

### Procedure

1. `get_thinking_summary()` to produce the consolidated decision history.
2. `get_proof_state()` for the final proof snapshot.
3. Write four artifacts to `{CHESTER_WORKING_DIR}/{sprint-subdir}/design/`
   (see `util-artifact-schema` for exact paths):
   - **Design brief** (`{sprint-name}-design-00.md`) — follow `util-design-brief-template`'s
     nine-section envelope-plus-point structure. Envelope sections sourced from the
     proof; Chosen Approach and Alternatives Considered sections sourced from
     Finalization.
   - **Thinking summary** (`{sprint-name}-thinking-00.md`) — decision history including
     a new "Finalization Reasoning" section covering which architect was
     adopted/rejected and why, which ground-truth findings were accepted versus
     forced brief revisions, hybrid articulation if the designer synthesized, and
     any reopen decisions.
   - **Process evidence** (`{sprint-name}-process-00.md`) — operational narrative
     including a new "Finalization Metrics" section covering dispatch timing,
     subagent return latencies, finding counts by severity, architect proposal
     count, reconciliation path taken, and outcome (pick / hybrid / stay-own /
     reopen).
   - **Ground-truth report** (`{sprint-name}-ground-truth-report-00.md`) — the
     findings report produced by the ground-truth subagent at Envelope Handoff,
     preserved as an artifact. `plan-build` reads this report at its entry.
4. Invoke `util-worktree` to create the branch and worktree — only if not already
   in a worktree. The branch name is the sprint subdirectory name.
5. Update `~/.chester/thinking.md` with Key Reasoning Shifts from the session.
6. Transition to `plan-build`.
```

**Sub-task 5E — Remove references to `design-specify`**

- [ ] **Step 3d:** Find and replace every remaining reference to `design-specify` in the file. Key locations:
  - `## Phase 5: Closure` current step 8 says "Transition to design-specify" → delete (Archival step 6 above replaces this).
  - `## Integration` section's "Transitions to: design-specify" → change to "Transitions to: `plan-build`".
  - Any "Invoked by" or "Does NOT invoke" mentions of design-specify → remove those mentions.

**Sub-task 5F — Update Integration section**

- [ ] **Step 3e: Replace the Integration section**

Replace:
```markdown
## Integration

- **Calls:** `start-bootstrap` (setup), `util-worktree` (closure)
- **Uses:** `chester-design-proof` MCP (Phase 2), `capture_thought` / `get_thinking_summary` (throughout)
- **Reads:** `util-artifact-schema` (naming/paths), `util-design-brief-template` (brief output structure), `util-budget-guard` (via bootstrap)
- **Invoked by:** user explicitly (opt-in — design-figure-out remains default)
- **Transitions to:** `design-specify`
- **Does NOT use:** `chester-understanding`, `chester-enforcement`
```

With:
```markdown
## Integration

- **Calls:** `start-bootstrap` (setup), `util-worktree` (Archival)
- **Dispatches (Finalization stage):** 1 ground-truth subagent + 3 `feature-dev:code-architect` subagents (parallel, isolated)
- **Uses:** `chester-design-proof` MCP (Phase 2), `capture_thought` / `get_thinking_summary` (throughout)
- **Reads:** `util-artifact-schema` (naming/paths), `util-design-brief-template` (brief output structure), `util-budget-guard` (via bootstrap)
- **Invoked by:** user, as the default structural design skill
- **Transitions to:** `plan-build`
- **Does NOT use:** `chester-understanding`, `chester-enforcement` (archived)
- **Does NOT call:** `design-specify` (archived — verification and architect comparison absorbed into Finalization stage)
```

**Sub-task 5G — Verify**

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/test-experimental-finalization.sh`
Expected: PASS

Run full suite: `for t in tests/test-*.sh; do echo "=== $t ==="; bash "$t" 2>&1 | tail -3; done`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git -C /home/mike/Documents/CodeProjects/Chester/.worktrees/20260417-03-optimize-chester-throughput add skills/design-experimental/SKILL.md tests/test-experimental-finalization.sh
git -C /home/mike/Documents/CodeProjects/Chester/.worktrees/20260417-03-optimize-chester-throughput commit -m "feat(design-experimental): add Finalization and Archival stages

Insert a new Finalization stage between Phase 2 closure and artifact
writing, bracketed by Envelope Handoff (proof -> finalization) and
Artifact Handoff (finalization -> archival). At Envelope Handoff, fire
a parallel gate: one ground-truth subagent verifies EVIDENCE claims
against the codebase, three architect subagents (minimal / clean /
pragmatic lenses) generate competing approaches. The designer
reconciles findings across two tracks and selects an approach.

Archival writes four artifacts: design brief (nine-section envelope+
point), thinking summary with Finalization Reasoning, process evidence
with Finalization Metrics, and ground-truth report as a durable
artifact consumed by plan-build.

Frontmatter description updated to drop 'experimental' and 'fork of
design-figure-out' — the skill is now the default structural design
path. Transition target changed from design-specify (archived) to
plan-build.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Refactor `plan-build` — smell heuristic pre-check + ground-truth cascade

**Files:**
- Modify: `skills/plan-build/SKILL.md`
- Create: `tests/test-plan-build-heuristic.sh`

**Sub-task 6A — Write the failing test**

- [ ] **Step 1: Create the test**

Create `tests/test-plan-build-heuristic.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

SKILL="skills/plan-build/SKILL.md"
ERRORS=0

# Must include the smell heuristic pre-check section
if ! grep -q -i "smell heuristic\|smell pre-check\|Smell Trigger" "$SKILL"; then
  echo "FAIL: $SKILL missing smell heuristic pre-check section"
  ERRORS=$((ERRORS + 1))
fi

# Must enumerate the five trigger categories
for category in "DI" "abstraction" "async" "persistence" "contract"; do
  if ! grep -q -i "$category" "$SKILL"; then
    echo "FAIL: $SKILL missing smell trigger category: $category"
    ERRORS=$((ERRORS + 1))
  fi
done

# Must include the keyword list (spot-check)
for keyword in "AddScoped" "SemaphoreSlim" "DbContext"; do
  if ! grep -q "$keyword" "$SKILL"; then
    echo "FAIL: $SKILL missing specific trigger keyword: $keyword"
    ERRORS=$((ERRORS + 1))
  fi
done

# Must mention ground-truth report as input
if ! grep -q -i "ground-truth" "$SKILL"; then
  echo "FAIL: $SKILL does not reference ground-truth report cascade"
  ERRORS=$((ERRORS + 1))
fi

# Must describe plan-attack scope narrowing via verified anchors
if ! grep -q -i "verified anchor\|skip-list\|plan-specific additions" "$SKILL"; then
  echo "FAIL: $SKILL does not describe plan-attack scope narrowing"
  ERRORS=$((ERRORS + 1))
fi

# Must not reference archived design-specify as invoker
if grep -q "Invoked by.*design-specify\|design-specify.*invokes" "$SKILL"; then
  echo "FAIL: $SKILL still lists design-specify as invoker"
  ERRORS=$((ERRORS + 1))
fi

# Must list design-experimental or design-small-task as invoker
if ! grep -q "design-experimental\|design-small-task" "$SKILL"; then
  echo "FAIL: $SKILL does not list experimental or small-task as invoker"
  ERRORS=$((ERRORS + 1))
fi

if [ "$ERRORS" -gt 0 ]; then
  echo "FAIL: $ERRORS errors in plan-build"
  exit 1
fi

echo "PASS: plan-build heuristic and cascade structure correct"
exit 0
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/test-plan-build-heuristic.sh`
Expected: FAIL — current `plan-build` has no smell heuristic, no ground-truth cascade, and lists `design-specify` in Integration.

**Sub-task 6B — Insert smell heuristic pre-check**

- [ ] **Step 3a: Insert smell heuristic section**

Locate the `## Plan Hardening` heading. Immediately before it, insert:

```markdown
## Smell Heuristic Pre-Check

Before the Plan Hardening dispatch, run a cheap keyword pre-check on the plan text
to decide whether `plan-smell` fires. `plan-attack` is unconditional — it runs every
hardening pass. `plan-smell`'s value is concentrated in sprints that introduce
composition, lifetimes, or persistence pathways (per the 18-sprint retrospective at
`docs/plan-hardening-effectiveness.md`); on mechanical refactors and bounded cleanups
it produces mostly polish. Conditional invocation preserves the signal and saves a
subagent dispatch on non-triggering sprints.

### Procedure

1. Read the plan text.
2. Match case-insensitively against the five trigger categories below. If any match,
   `plan-smell` fires in parallel with `plan-attack`. If no match, `plan-smell` is
   skipped and `plan-attack` runs alone.
3. Include the list of matched triggers verbatim in the combined threat report so
   the designer sees why smell fired (or didn't).

### Trigger Categories

The list is deliberately inclusive. False positives cost one extra parallel dispatch;
misses cost an uncaught real bug. Tune toward over-firing.

**DI registrations:** `AddScoped`, `AddSingleton`, `AddTransient`, `services.Add`,
`IServiceCollection`, `composition root`

**New abstractions:** `new interface`, `abstract class`, `new service class`,
`public interface I[A-Z]`, `public abstract`

**Async / concurrency primitives:** `async`, `await`, `Task.`, `Task<`,
`SemaphoreSlim`, `Semaphore`, `lock (`, `Interlocked.`, `ConcurrentDictionary`,
`ConcurrentBag`, `Channel<`

**New persistence pathways:** `SaveAsync`, `DbContext`, `IRepository`, `Repository`,
`sqlite`, `persistence`, `IDbConnection`, `SqlConnection`, `serialize`, `deserialize`

**New contract surfaces:** `new contract`, `new DTO`, `new record`, `public record`,
`public class.*Dto`, `boundary contract`

When adding new triggers, keep the category split and the inclusive bias.

---

## Ground-Truth Report Cascade

When plan-build is invoked after `design-experimental`, the design directory
contains a ground-truth report produced at Envelope Handoff. The report verifies
EVIDENCE claims the design rests on and is a trusted input at the plan stage.

### Input Contract

If the current sprint's `design/` subdirectory contains files matching
`*-ground-truth-report-*.md`, read the **highest-numbered version** (the latest
revision per `util-artifact-schema` versioning — `-01.md` wins over `-00.md`, etc.).
Extract the list of verified anchors — file paths, type names, method names that
the ground-truth subagent confirmed exist as the design describes. This list
becomes the **verified-anchor skip-list**.

If no ground-truth report exists (e.g., the design came from `design-small-task`),
skip this cascade. `plan-attack` performs its own full codebase verification in
that case.

**Error-path handling.** If the ground-truth report exists but contains zero
verified anchors (all findings are NOT-FOUND or UNVERIFIABLE, or all anchors are
`null`), pass an empty skip-list to `plan-attack`. Do not skip the cascade
entirely — the empty skip-list tells `plan-attack` that the foundation check ran
but produced no trusted anchors, which is different from "no design-stage
verification was performed." Note this condition in the combined threat report so
the designer sees that the ground-truth pass produced no usable trust boundary.

### Passing the Skip-List to plan-attack

When dispatching `plan-attack`, include the verified-anchor skip-list in the prompt
with this instruction: "The following anchors were verified against the codebase at
the design stage. Treat them as trusted (do NOT re-verify) unless the plan text
explicitly modifies them (create, rename, refactor, delete). Anchors the plan
references but does not modify are trusted. Anchors the plan modifies are
re-verified against the plan's claims."

This narrows `plan-attack`'s scope to plan-specific additions without losing
coverage. Anchors introduced or changed by the plan are still re-verified.

If the plan text modifies a verified anchor, note that in the plan-attack prompt
explicitly — the subagent must understand which anchors moved from "trusted" to
"re-verify."
```

**Sub-task 6C — Update Plan Hardening dispatch**

- [ ] **Step 3b: Modify Plan Hardening procedure**

Locate `## Plan Hardening` heading (step 2, the parallel dispatch). Replace:

```
2. Launch two Agent subagents in parallel (in a single message). For each:
   - Embed the full skill instructions from the SKILL.md you just read into the Agent prompt
   - Include the plan file path so the subagent knows what to review
   - Do NOT use `feature-dev:code-reviewer` or any other subagent_type — use the default general-purpose agent with the Chester skill instructions as the prompt
```

With:
```
2. Consult the Smell Heuristic Pre-Check result. If smell did NOT trigger, dispatch
   only `plan-attack`. If smell DID trigger, dispatch `plan-attack` and `plan-smell`
   in parallel in a single message.

   For each dispatched subagent:
   - Embed the full skill instructions from the SKILL.md you just read into the Agent prompt
   - Include the plan file path so the subagent knows what to review
   - For `plan-attack`: include the verified-anchor skip-list (from the Ground-Truth
     Report Cascade above) and the trust-boundary instruction
   - Do NOT use `feature-dev:code-reviewer` or any other subagent_type — use the default general-purpose agent with the Chester skill instructions as the prompt

   When `plan-smell` is skipped, note this in the combined threat report: "Smell
   skipped — heuristic matched zero triggers. Plan-attack was sufficient for
   hardening this sprint."
```

**Sub-task 6D — Update Integration section**

- [ ] **Step 3c: Update Integration**

Replace:
```
## Integration

- **Invoked by:** `design-specify` (primary), or user directly (standalone)
- **Calls:** `plan-attack` + `plan-smell` (parallel, during plan hardening)
- **Reads:** `util-artifact-schema` (naming/paths), `util-budget-guard`
- **Transitions to:** `execute-write` (subagent or inline mode)
- **Does NOT call:** `start-bootstrap` (inherits sprint context from upstream spec)
```

With:
```
## Integration

- **Invoked by:** `design-experimental` (primary — with ground-truth report cascade), `design-small-task` (bounded briefs — no cascade), or user directly (standalone)
- **Calls:** `plan-attack` (unconditional), `plan-smell` (conditional — only when Smell Heuristic Pre-Check matches)
- **Reads:** `util-artifact-schema` (naming/paths), `util-budget-guard`, ground-truth report from upstream `design/` subdirectory (when present)
- **Transitions to:** `execute-write` (subagent or inline mode)
- **Does NOT call:** `start-bootstrap` (inherits sprint context from upstream design)
- **Brief compatibility:** reads nine-section briefs from `design-experimental` and six-section briefs from `design-small-task` by section heading; no branching on source skill
```

**Sub-task 6E — Verify**

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/test-plan-build-heuristic.sh`
Expected: PASS

Run full suite: `for t in tests/test-*.sh; do echo "=== $t ==="; bash "$t" 2>&1 | tail -3; done`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git -C /home/mike/Documents/CodeProjects/Chester/.worktrees/20260417-03-optimize-chester-throughput add skills/plan-build/SKILL.md tests/test-plan-build-heuristic.sh
git -C /home/mike/Documents/CodeProjects/Chester/.worktrees/20260417-03-optimize-chester-throughput commit -m "feat(plan-build): smell heuristic pre-check and ground-truth cascade

Add a cheap keyword pre-check on the plan text that decides whether
plan-smell fires. plan-attack stays unconditional. Trigger categories:
DI registrations, new abstractions, async/concurrency, new persistence
pathways, new contract surfaces. Keyword list inclusive by design — false
positives cost one extra parallel dispatch, misses cost an uncaught
real bug.

Add a ground-truth report cascade: when invoked after design-experimental,
plan-build reads the ground-truth report from the design directory,
extracts verified anchors, and passes them to plan-attack as a skip-list.
plan-attack treats verified anchors as trusted unless the plan modifies
them, narrowing its scope to plan-specific additions.

Update Integration to list design-experimental and design-small-task as
invokers (design-specify is archived). Note brief shape compatibility —
plan-build reads both 9-section experimental briefs and 6-section
small-task briefs by section heading.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6b: (Optional) Trust Input note in `plan-attack/SKILL.md`

**Files:**
- Modify: `skills/plan-attack/SKILL.md`

**Purpose:** Close smell finding 3 — make the verified-anchor skip-list protocol
visible at the skill level, not only in the dispatch prompt. A reader of
`plan-attack/SKILL.md` should know a skip-list may arrive.

This task is marked optional because the skip-list works correctly without a
skill-level note (the dispatch prompt carries the full instruction). The note is a
readability/maintainability improvement, not a correctness requirement. Skip if
sprint time is tight; schedule as follow-up otherwise.

- [ ] **Step 1: Add Trust Input section to `plan-attack/SKILL.md`**

Locate the `## Evidence Standard` section in `plan-attack/SKILL.md`. Immediately
before it, insert:

```markdown
## Trust Input (Optional)

When dispatched from `plan-build` after `design-experimental`, this skill may
receive a **verified-anchor skip-list** in its prompt — a list of file paths, type
names, and method names that the ground-truth subagent verified against the
codebase during the design stage's Finalization.

If a skip-list is present:
- Treat the listed anchors as trusted — do NOT re-verify them — **unless the plan
  text explicitly modifies them** (create, rename, refactor, delete).
- Anchors the plan references but does not modify are trusted.
- Anchors the plan modifies are re-verified against the plan's claims.
- Any anchor not in the skip-list is re-verified as usual.

If no skip-list is present (e.g., dispatched from `plan-build` after
`design-small-task`, which has no ground-truth stage), perform full codebase
verification as described in Step 2.

The skip-list narrows scope without reducing rigor. Findings on plan-specific
additions are weighted the same as always.
```

- [ ] **Step 2: Commit**

```bash
git -C /home/mike/Documents/CodeProjects/Chester/.worktrees/20260417-03-optimize-chester-throughput add skills/plan-attack/SKILL.md
git -C /home/mike/Documents/CodeProjects/Chester/.worktrees/20260417-03-optimize-chester-throughput commit -m "docs(plan-attack): document optional verified-anchor skip-list

Add Trust Input (Optional) section acknowledging that plan-build may pass
a verified-anchor skip-list from design-experimental's ground-truth
verification. The skip-list narrows attack's scope to plan-specific
additions. Behavior unchanged when no skip-list is present.

This closes plan-smell finding 3 from the threat report — the protocol
is now visible at the skill level, not only in the dispatch prompt.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Full test suite + `/reload-plugins` verification

**Files:**
- No file modifications; verification only.

- [ ] **Step 1: Run cross-skill grep test first**

Run: `bash tests/test-no-archived-refs.sh`
Expected: PASS. This is the authoritative gate for acceptance criteria #1 and #2.
If it fails, return to Task 2 or Task 2b and scrub the flagged files before
proceeding.

- [ ] **Step 2: Run full test suite**

Run: `for t in tests/test-*.sh; do echo "=== $t ==="; bash "$t" 2>&1 | tail -3; done`

Expected: all tests pass, including:
- `test-artifact-schema.sh` — PASS (new)
- `test-brief-template-structure.sh` — PASS (new)
- `test-budget-guard-skills.sh` — PASS
- `test-chester-config.sh` — PASS
- `test-compaction-hooks.sh` — PASS
- `test-config-read-new.sh` — PASS
- `test-experimental-finalization.sh` — PASS (new)
- `test-integration.sh` — INTEGRATION: all tests passed
- `test-no-archived-refs.sh` — PASS (new, authoritative cross-skill gate)
- `test-plan-build-heuristic.sh` — PASS (new)
- `test-small-task-artifact-handoff.sh` — PASS (new)
- `test-start-cleanup.sh` — PASS
- `test-statusline-usage.sh` — PASS
- `test-write-code-guard.sh` — PASS

- [ ] **Step 2: Reload plugins and verify clean registry**

Run: `/reload-plugins`

Expected: reload succeeds. No references to archived `design-figure-out` or `design-specify` surface in the active skill list.

- [ ] **Step 3: Spot-check skill triggering**

Manually invoke the Skill tool for `chester:design-experimental` — verify the description shows the new wording (no "Experimental" or "Fork").

Manually invoke `chester:design-small-task` — verify description mentions Artifact Handoff.

- [ ] **Step 4: No commit — verification only**

Task 7 is a verification gate. If any test fails or any spot-check surfaces drift, return to the failing task (1-6) and fix before completing Task 7.

---

## Post-Plan Notes

- **Worktree cleanup:** After Task 7 passes, use `execute-verify-complete` to close out the execute phase, then `finish-archive-artifacts` to archive the working directory into `docs/chester/plans/`, then `finish-close-worktree` to merge or PR.
- **Deferred items (tracked for follow-up sprints, not this sprint):**
  - Renaming `design-experimental` to a non-experimental name — cascades into memory, cross-references, muscle-memory. Separate decision.
  - Extracting shared commentary prose (~80 lines duplicated between `design-experimental` and `design-small-task`) into a util skill — independent of this sprint's pipeline restructure.

## Branch Status

- Branch: `20260417-03-optimize-chester-throughput`
- Baseline commit: `69d5c0b fix(tests): align baseline with active skill registry`
- Worktree: `/home/mike/Documents/CodeProjects/Chester/.worktrees/20260417-03-optimize-chester-throughput`
- Remote: pushed to `origin/20260417-03-optimize-chester-throughput`
