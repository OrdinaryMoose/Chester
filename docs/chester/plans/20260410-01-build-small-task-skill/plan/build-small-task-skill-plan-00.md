# design-small-task Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use execute-write (recommended) or execute-write in inline mode to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a lightweight Chester design skill that holds interactive conversations for well-bounded tasks, producing design briefs optimized for plan-build consumption.

**Architecture:** Single SKILL.md file adapting design-experimental's visible surface (observations, information package, commentary) into a single-phase conversation loop with no MCP dependency. The skill calls start-bootstrap for sprint setup and transitions directly to plan-build at closure. Registration in setup-start's skill list makes it discoverable.

**Tech Stack:** Markdown (SKILL.md), Bash (test script modification)

---

### Task 1: Create the SKILL.md

**Files:**
- Create: `skills/design-small-task/SKILL.md`

- [ ] **Step 1: Create skill directory**

```bash
mkdir -p skills/design-small-task
```

- [ ] **Step 2: Write SKILL.md with complete content**

Create `skills/design-small-task/SKILL.md` with the following complete content:

```markdown
---
name: design-small-task
description: "Lightweight design conversation for well-bounded tasks. Use when the task is clear but you want to surface considerations before jumping to planning. Holds an interactive Q&A loop with structured information packages — the agent presents observations and asks questions, never suggests proceeding. The designer explicitly directs when to write the brief. Feeds directly into plan-build, skipping design-specify."
---

# Small Task Design Conversation

A lightweight design skill for well-bounded tasks where the designer already knows roughly
what they want. The value is not deep discovery — it is surfacing considerations that might
be missed before jumping to planning.

This skill produces a design brief that feeds directly into plan-build, skipping
design-specify entirely.

<HARD-GATE>
Do not write the design brief until the designer explicitly directs you to proceed.

You do not decide when the conversation is done. The designer does.

Do not suggest, recommend, offer, hint at, or steer toward writing the brief. Do not
frame commentary to imply the conversation is wrapping up (e.g., "we seem to have
covered everything," "I think we're in good shape," "unless there's anything else").
Do not ask "ready to proceed?" or "shall I write the brief?"

Your only job is to present information and ask questions. The designer will tell you
when to write the brief. Until then, keep going.
</HARD-GATE>

## Checklist

1. **Bootstrap** — invoke `start-bootstrap`
2. **Exploration** — synthesize conversation context, inline code exploration, inline prior art scan
3. **Round one** — present gap map and first commentary
4. **Conversation loop** — per-turn cycle until designer says proceed
5. **Closure** — write design brief, invoke util-worktree, transition to plan-build

## Role: Software Architect

You are a Software Architect working through a bounded design task with a senior designer.
The designer holds the intent. You hold the codebase. Your job is to surface considerations
the designer might not have thought of — edge cases, existing patterns, constraints,
trade-offs — so the design brief captures everything plan-build needs.

Be opinionated. Share your perspective, take positions, make recommendations about
the topic at hand. The designer will correct you when you're wrong.

You may reference specific files, patterns, code structures, and implementation details
in your commentary. No translation gate — code vocabulary is welcome when it adds clarity.

---

## Phase 1: Bootstrap

Invoke `start-bootstrap`. This handles config reading, sprint naming, directory creation,
task reset, and thinking history initialization.

---

## Phase 2: Exploration

This skill is typically invoked mid-conversation after a detailed discussion. The existing
conversation context is the primary input — not fresh discovery.

Three-part exploration, all inline (no agent dispatch):

1. **Synthesize conversation context** — review what has been discussed so far. Identify
   the task, the designer's intent, decisions already made, and open questions that remain.

2. **Code exploration** — read relevant files to understand the current state of the
   areas the task will touch. Use Glob, Grep, Read as needed.

3. **Prior art scan** — check for existing patterns, similar features, or conventions
   in the codebase that should inform the design.

---

## Phase 3: Round One

Present the exploration findings as the first turn of the conversation loop.

1. Present what you know from the conversation and exploration:
   - What the task involves and what the codebase reveals about the relevant areas
   - What you can't determine and need the designer's input on
2. Offer your first commentary — share your take on the most important consideration
3. End with "What do you think?" or a natural variant
4. The conversation loop begins with the designer's response

---

## Phase 4: Conversation Loop

### Per-Turn Flow

After each designer response:

**Step 1: Choose topic.**
Select what to address this turn:

1. **Designer's lead** — if the response points to a specific area, follow it
2. **Largest gap** — the area where your understanding is weakest
3. **Coverage rotation** — next untouched consideration
4. **Uncomfortable territory** — what you've been avoiding

**Step 2: Compose information package.**
Build the three-component information package (see Visible Surface below).

**Step 3: Write commentary.**
Based on the information package and what you've learned, share your take on the topic.
Use the commentary registers: demonstrating understanding, surfacing tension, taking a
position, admitting uncertainty, or flagging risk.

**Step 4: Present to designer.**
Output observations block, then information package, then commentary with closing prompt.

### Behavioral Constraints

- One topic per turn — don't cover three things at once
- When the designer contradicts your model, update — don't argue
- Use the codebase to inform commentary — don't ask what you can look up
- Be a pessimist — continuously evaluate uncomfortable truths, unstated assumptions,
  hidden complexity. Surface through commentary, not interrogation.

---

## Visible Surface

### Observations Block (Before Commentary)

Three components, all italic single-sentence lines. Present under the heading "Observations":

1. **Alignment check** (1-2 sentences) — summarize your understanding of the current
   state so the designer can correct drift immediately.

2. **Metacognitive reflection** (1-2 sentences) — selected from rotating angles:
   - What did this response change about our understanding, and why does that matter?
   - What existing decision in the architecture does this touch or silently depend on?
   - What is the most fragile assumption in the current thinking?
   - Where does this sit uncomfortably against the current state of the system?
   - What is the single most important thing we still need to resolve?

3. **Direction signal** (1 sentence) — what topic you're addressing this turn and why
   it matters now.

### Information Package (After Observations, Before Commentary)

Each turn presents a curated information package between the observations and the
commentary. The package delivers the facts; the commentary delivers your analysis.
Target approximately **50% information package, 50% commentary** by content weight.

Each component should be **2-4 sentences** — concise, not paragraphs.

| Component | Purpose | Altitude |
|-----------|---------|----------|
| **Current facts** | What the code/system says now about this topic | Expert-level factual |
| **Surface analysis** | What's changing or under pressure in this area | Light touch, not exhaustive |
| **Uncomfortable truths** | What's fragile, contradictory, or historically painful | Pessimist stance — name what others avoid |

### Commentary Model

Each turn ends with commentary — your genuine take on the topic — followed by an
invitation for the designer to react.

**Commentary registers** — vary your approach based on what the turn needs:

- **Demonstrating understanding** — "Here's what I think is going on..."
- **Surfacing tension** — "There's something uncomfortable here..."
- **Taking a position** — "I think X fits better because..."
- **Admitting uncertainty** — "I could see this going either way..."
- **Flagging risk** — "The thing that worries me is..."

**Closing prompt** — end with "What do you think?" or a natural variant. Keep it
short and open. The designer may confirm, correct, redirect, or ignore and move on.
All four responses are productive.

**Calibration signal:** if the designer is confirming everything without pushback, your
commentary may be too safe. Push harder — surface tensions, take less obvious positions,
name uncomfortable truths.

---

## Phase 5: Closure

When the designer explicitly directs you to proceed (e.g., "go ahead," "write it up,"
"proceed," "let's build it"):

1. Write the design brief to `{CHESTER_WORKING_DIR}/{sprint-subdir}/design/{sprint-name}-design-00.md`
   using this format:

   Follow the template in `util-design-brief-small-template`:

   ```markdown
   # [Feature Name] — Design Brief

   ## Goal
   [One paragraph — what we're building and why]

   ## Prior Art
   [Findings from previous work, existing patterns, or prior attempts
   that shaped this design. What was tried before, what exists already,
   what the codebase reveals about this area.]

   ## Scope
   **In scope:**
   - [items]

   **Out of scope:**
   - [items]

   ## Key Decisions
   1. **[Decision].** [What we landed on and why. Alternative considered: X.]

   ## Constraints
   - [What limits implementation]

   ## Acceptance Criteria
   - [How we know it's done]
   ```

2. Present the brief to the designer: "Does this capture what we're building?"
3. After confirmation, invoke `util-worktree` to create the branch and worktree.
   The branch name is the sprint subdirectory name.
4. Transition to plan-build.

## Integration

- **Calls:** `start-bootstrap` (setup), `util-worktree` (closure)
- **Reads:** `util-artifact-schema` (naming/paths), `util-design-brief-small-template` (brief format), `util-budget-guard` (via bootstrap)
- **Transitions to:** `plan-build`
- **Does NOT call:** `design-specify`, any MCP server
- **Does NOT use:** `capture_thought`, `get_thinking_summary`
```

- [ ] **Step 3: Verify skill file structure**

```bash
ls -la skills/design-small-task/
cat skills/design-small-task/SKILL.md | head -5
```

Expected: Directory exists, SKILL.md starts with `---` frontmatter containing `name: design-small-task`.

- [ ] **Step 4: Commit**

```bash
git add skills/design-small-task/SKILL.md
git commit -m "feat: add design-small-task skill for lightweight bounded design conversations"
```

### Task 2: Register in setup-start

**Files:**
- Modify: `skills/setup-start/SKILL.md:246-247`

- [ ] **Step 1: Add design-small-task to the pipeline skills list**

In `skills/setup-start/SKILL.md`, find the pipeline skills section (around line 246-247) and add design-small-task between design-experimental and design-specify:

```markdown
- `design-small-task` — Lightweight design conversation for well-bounded tasks. Surfaces considerations through structured Q&A, produces a brief for plan-build. No MCP, no spec step.
```

Insert after the `design-experimental` line and before the `design-specify` line.

- [ ] **Step 2: Add design-small-task to the gate skills enumeration**

In the same file, find the gate skills priority list (the line that starts with `1. **Gate skills first**`) and add `design-small-task` to the parenthetical list, after `design-experimental`.

- [ ] **Step 3: Add util-design-brief-small-template to the utility skills list**

In the same file, find the "Utility Skills" section (around line 269) and add:

```markdown
- `util-design-brief-small-template` — Lightweight design brief template for bounded tasks (6 sections vs 13). Read, don't invoke.
```

Insert after the existing `util-design-brief-template` entry (or after `util-artifact-schema` if the full template isn't listed yet).

- [ ] **Step 4: Add design-small-task to the skill priority routing**

In the same file, find the routing section and add a routing hint after the existing `"Let's build X"` line:

```markdown
"Quick design check for X" → `design-small-task` first, then `plan-build`.
```

- [ ] **Step 5: Verify registration**

```bash
grep -c "design-small-task\|design-brief-small-template" skills/setup-start/SKILL.md
```

Expected: 4 matches — gate skills enumeration, pipeline skills list, routing section, utility skills list.

- [ ] **Step 6: Commit**

```bash
git add skills/setup-start/SKILL.md
git commit -m "feat: register design-small-task in setup-start skill registry"
```

### Task 3: Create util-design-brief-small-template

**Files:**
- Create: `skills/util-design-brief-small-template/SKILL.md`

- [ ] **Step 1: Create skill directory**

```bash
mkdir -p skills/util-design-brief-small-template
```

- [ ] **Step 2: Write SKILL.md with complete content**

Create `skills/util-design-brief-small-template/SKILL.md` with the following complete content:

```markdown
---
name: util-design-brief-small-template
description: >
  Lightweight design brief template for bounded tasks. Read this skill (don't invoke it)
  when writing the design brief artifact from design-small-task. Six sections instead of
  thirteen — optimized for plan-build consumption without multi-brief coordination overhead.
---

# Lightweight Design Brief Template

This document defines the structure for design brief artifacts produced by
`design-small-task`. It is the lightweight counterpart to `util-design-brief-template`,
which serves `design-figure-out` and `design-experimental`.

## When to Use This Template

Use this template when:
- The task is well-bounded — the designer already knows roughly what they want
- The design conversation was 2-5 rounds, not 10-20
- There are no companion briefs or multi-brief dependency chains
- The brief feeds directly into plan-build, skipping design-specify

Use the full `util-design-brief-template` when:
- The task is complex or ambiguous
- Multiple briefs interact (companion briefs, prior art chains)
- The brief will be consumed by design-specify's three architect agents
- Infrastructure dependencies need operational status tracking

## Guiding Principle

A lightweight brief must be **self-contained for plan-build**. A plan-build agent that
has never seen the design conversation should be able to write an implementation plan
from this brief alone. If a decision or scope boundary requires reading the conversation
to understand, it is not yet in the brief.

## Template Structure

Six sections, in order. All are REQUIRED.

---

### Goal (REQUIRED)

One paragraph: what is being built and why. Combines what the full template separates
into Problem Statement and Header.

```markdown
## Goal

{What we're building, why it matters, and what problem it solves — one paragraph.}
```

---

### Prior Art (REQUIRED)

Findings from previous work, existing patterns, or prior attempts that shaped this
design. This section makes the brief self-contained — without it, a reader must know
the project history to understand why the design is shaped the way it is.

```markdown
## Prior Art

{What exists already in the codebase that informed this design. What was tried before.
What patterns or conventions should be followed or avoided. If no prior art exists,
state: "No prior design work exists for this area."}
```

This is lighter than the full template's Prior Art section — no formal brief-linking
with status fields. Just the findings that matter, in prose.

---

### Scope (REQUIRED)

What is in scope and what is out of scope.

```markdown
## Scope

**In scope:**
- {Deliverable or work item}

**Out of scope:**
- {Item} — {why it's excluded}
```

Unlike the full template, out-of-scope items do not require not-yet/not-us/not-needed
tags. A brief rationale is sufficient for bounded tasks. However, every exclusion must
still have a reason — a bare list of exclusions without rationale is ambiguous.

---

### Key Decisions (REQUIRED)

Design choices made during the conversation, with rationale and alternatives considered.

```markdown
## Key Decisions

1. **{Decision}.** {What we landed on and why. Alternative considered: X.}
```

One line per decision with inline rationale. Lighter than the full template's
D1/D2 format with separated rejected alternatives prose, but the same information:
what was chosen, why, and what was not chosen.

---

### Constraints (REQUIRED)

What limits implementation.

```markdown
## Constraints

- {Constraint}
```

For bounded tasks, a simple bullet list is sufficient. The full template's
structural/normative distinction is not required but may be used if helpful.

---

### Acceptance Criteria (REQUIRED)

Observable, testable conditions for completion.

```markdown
## Acceptance Criteria

- {Condition that must be true when the work is complete}
```

Same guidance as the full template: criteria must be verifiable, not subjective.

---

## Sections Deliberately Omitted

These sections exist in the full `util-design-brief-template` and are omitted here
with rationale:

| Full template section | Why omitted |
|---|---|
| Header (Status, Date, Sprint, Parent, Companion) | Sprint context inherited from directory path. No companion briefs for bounded tasks. |
| Logic Trail | No formal proof system — no derivation chain to capture. |
| Dependencies (infrastructure status) | Bounded tasks rarely depend on partially-operational infrastructure. If they do, note it in Constraints. |
| Current State Inventory (10-20 entries) | Too heavy — reference specific files inline in Key Decisions when relevant. |
| Assumptions (CONFIRMED/CORRECTED/UNTESTED) | Bounded tasks don't accumulate testable assumptions across many rounds. Unverified claims go in Constraints or Key Decisions. |
| Residual Risks | For bounded tasks, risks go in Constraints or Key Decisions inline. |
| Follow-on Work | Bounded tasks don't typically enable dependency chains. |

If a bounded task turns out to need any of these sections, that may be a signal the
task is not actually bounded and should use the full template with `design-figure-out`
or `design-experimental`.

---

## Vocabulary Mapping

| Template section | design-small-task term |
|---|---|
| Goal | "goal" |
| Prior Art | "prior art" / "what exists already" |
| Scope | "scope" / "in and out" |
| Key Decisions | "key decisions" / "what we landed on" |
| Constraints | "constraints" |
| Acceptance Criteria | "acceptance criteria" / "how we know it's done" |

---

## The Self-Containment Test

Before finalizing the brief: **Could plan-build consume this brief and write an
implementation plan without needing to read the design conversation?** If the answer
is no, the Prior Art or Key Decisions sections are incomplete.
```

- [ ] **Step 3: Verify file structure**

```bash
ls -la skills/util-design-brief-small-template/
cat skills/util-design-brief-small-template/SKILL.md | head -5
```

Expected: Directory exists, SKILL.md starts with `---` frontmatter containing `name: util-design-brief-small-template`.

- [ ] **Step 4: Commit**

```bash
git add skills/util-design-brief-small-template/SKILL.md
git commit -m "feat: add lightweight design brief template for bounded tasks"
```

### Task 4: Update full template vocabulary mapping

**Files:**
- Modify: `skills/util-design-brief-template/SKILL.md`

- [ ] **Step 1: Add design-small-task column to vocabulary mapping**

In `skills/util-design-brief-template/SKILL.md`, find the Vocabulary Mapping table (around line 496) and add a column for design-small-task:

```markdown
| Template section | design-figure-out term | design-experimental term | design-small-task term |
|-----------------|----------------------|------------------------|----------------------|
| Design Decisions | "decision boundaries" | "necessary conditions with rationale" | "key decisions" |
| Scope (out) | "non-goals" | "out of scope" | "out of scope" |
| Constraints | "constraints" | "designer-directed restrictions" + "constraints" | "constraints" |
| Assumptions | "assumptions tested" | (embedded in proof elements — extract to this section) | (omitted — uses `util-design-brief-small-template`) |
| Logic Trail | (not produced — omit section) | "Logic Trail" (derived from proof state) | (omitted — no proof system) |
```

- [ ] **Step 2: Add note about the small template**

In the "Notes for Design Skill Implementors" section (around line 514), add after the existing text:

```markdown
### Lightweight alternative

`design-small-task` uses `util-design-brief-small-template` instead of this template.
The small template has 6 sections (Goal, Prior Art, Scope, Key Decisions, Constraints,
Acceptance Criteria) optimized for direct plan-build consumption without multi-brief
coordination overhead. See that template for details on which sections are deliberately
omitted and why.
```

- [ ] **Step 3: Commit**

```bash
git add skills/util-design-brief-template/SKILL.md
git commit -m "chore: add design-small-task to vocabulary mapping and reference small template"
```
