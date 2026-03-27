# Socratic Interview Improvement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use chester-write-code (recommended) or chester-write-code in inline mode to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the chester-figure-out SKILL.md to sustain the design frame across all sections through persona injection and vocabulary consistency.

**Architecture:** Five targeted text edits plus one new section insertion to a single Markdown document. All edits use exact string matching (Edit tool) to avoid line-number sensitivity. No executable code, no dependencies, no build steps.

**Tech Stack:** Markdown, git

---

### Task 1: Apply Edits to SKILL.md

**Files:**
- Modify: `chester-figure-out/SKILL.md`

**Note to implementer:** All edits use exact string matching via the Edit tool. Order does not matter for correctness, but the steps below proceed from smallest change to largest for easy verification.

- [ ] **Step 1: Change 1 — Frontmatter description**

Edit `chester-figure-out/SKILL.md`:

old_string:
```
before implementation."
```

new_string:
```
before creating a specification."
```

Verify: `git diff` shows only "before implementation" → "before creating a specification" on line 3.

- [ ] **Step 2: Change 4 — Question type vocabulary**

Edit `chester-figure-out/SKILL.md`:

old_string:
```
evident from context or codebase exploration.
```

new_string:
```
evident from context or codebase design.
```

Verify: `git diff` shows only "codebase exploration" → "codebase design" in the Clarifying question type.

- [ ] **Step 3: Change 5 — Stopping criterion**

Edit `chester-figure-out/SKILL.md`:

old_string:
```
- Soft — when remaining decisions become minor (implementation details any competent implementer could resolve)
```

new_string:
```
- Soft — when remaining design decisions become minor and will have little influence on patterns, boundaries, or architecture
```

Verify: `git diff` shows the stopping criterion replacement. The secondary signal on the next line is untouched.

- [ ] **Step 4: Change 3 — Phase 2 anchor sentence**

Edit `chester-figure-out/SKILL.md`:

old_string:
```
- Explore project context — read code, docs, recent commits relevant to the idea
```

new_string:
```
- Study the codebase as a record of design decisions — understand the patterns chosen, the boundaries drawn, and the intent behind the existing architecture. Prepare yourself to serve in your role of Software Architect.
```

Verify: `git diff` shows the Phase 2 first bullet replacement. The remaining bullets (Assess scope, Present problem statement, User confirms) are untouched.

- [ ] **Step 5: Change 2 — Insert Role: Software Architect section**

Edit `chester-figure-out/SKILL.md`:

old_string:
```
**Sprint auto-detection:** Scan for existing `Documents/Refactor/Sprint NNN` directories. Extract the highest NNN, increment by 1, zero-pad to 3 digits. If the suggested number already exists, increment until a free number is found.

## Phase 2: Context & Problem Statement
```

new_string:
```
**Sprint auto-detection:** Scan for existing `Documents/Refactor/Sprint NNN` directories. Extract the highest NNN, increment by 1, zero-pad to 3 digits. If the suggested number already exists, increment until a free number is found.

## Role: Software Architect

You are a Software Architect conducting a design interview. This identity governs how you approach every activity from this point forward.

- **Read code as design history** — patterns, boundaries, and connections are evidence of decisions someone made, not inventory to catalogue
- **Think in trade-offs** — balance technical concerns against goals, current state against future needs; never optimize a single axis
- **Evaluate boundaries as choices** — existing structure is the result of prior design decisions, not immutable constraints
- **Operate across abstraction levels** — move fluidly between "what should this achieve" and "what pattern supports that"
- **Align architecture to intent** — link every structural decision back to what the human is trying to accomplish

## Phase 2: Context & Problem Statement
```

Verify: `git diff` shows the new section inserted between Phase 1 and Phase 2. No existing content is modified — only new lines added.

---

### Task 2: Verify Complete Diff

**Files:**
- Review: `chester-figure-out/SKILL.md`

- [ ] **Step 1: Review the full diff**

Run: `git diff chester-figure-out/SKILL.md`

Verify exactly five changes appear:
1. Line 3: "before implementation" → "before creating a specification"
2. New section "Role: Software Architect" (~10 lines) between Phase 1 and Phase 2
3. Phase 2 first bullet: "Explore project context..." → "Study the codebase as a record..."
4. Clarifying question type: "codebase exploration" → "codebase design"
5. Stopping criterion: full bullet replacement

No other lines should be modified. If the diff shows any unintended changes, investigate and revert.

- [ ] **Step 2: Linguistic audit**

Read the modified file from Phase 1 through Phase 3. At each section boundary, confirm:
- The Role section activates the Software Architect identity before any codebase interaction
- Phase 2 frames code-reading as studying design decisions
- Phase 3 question types use "codebase design" not "codebase exploration"
- The stopping criterion references design impact, not implementation skill
- Behavioral constraints are unchanged (persona provides sufficient framing)

- [ ] **Step 3: AAR failure trace**

For each of the four Sprint 050 AAR failures, confirm the prevention mechanism is present:
- Mechanism before design → architect trait "operate across abstraction levels" + Phase 2 anchor
- Boundaries as constraints → architect trait "evaluate boundaries as choices"
- Planning/spec bleed → stopping criterion reframed around design decisions
- Missing abstraction checks → architect trait "operate across abstraction levels"

---

### Task 3: Commit

**Files:**
- Commit: `chester-figure-out/SKILL.md`

- [ ] **Step 1: Stage and commit**

```bash
git add chester-figure-out/SKILL.md
git commit -m "refactor: rewrite figure-out skill language to sustain design frame

Add Software Architect persona section between Phase 1 and Phase 2.
Reframe Phase 2 codebase exploration as studying design decisions.
Replace implementation vocabulary with architect-consistent language
in frontmatter, question types, and stopping criterion."
```

- [ ] **Step 2: Verify clean working tree**

Run: `git status`

Expected: nothing to commit, working tree clean.
