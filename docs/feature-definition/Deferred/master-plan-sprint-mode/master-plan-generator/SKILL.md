---
name: master-plan-generator
description: >
  Generates a structured Master Refactor Plan document for a multi-sub-sprint refactoring
  effort. Use when the user wants to plan a large refactor that will be executed across
  multiple Claude Code sessions. Triggers on: "create a master plan", "write a refactor plan",
  "build a sprint master plan", "set up a master plan for", "/master-plan-generator".
  Also triggers when a user describes a refactoring goal with multiple phases or sub-sprints
  and asks for a plan document. Do NOT trigger for single-session implementation plans —
  use the planning workflow for those instead.
---

# Master Plan Generator

Produces a Master Refactor Plan document: the north-star governing document for a
multi-sub-sprint refactoring effort. The plan defines the endstate, sequencing constraints,
re-alignment protocol, and per-sub-sprint executable specifications.

**Read `references/template.md` before writing anything.** All section structure, placeholder
conventions, and comment block formats are defined there. Do not invent structure from scratch.

---

## When to Use This Skill

A Master Refactor Plan is appropriate when:

- The refactor spans more than one Claude Code session
- Work must be sequenced (some sub-sprints depend on others completing first)
- There are architectural constraints (TDRs, file limits, project limits) that every session must respect
- The codebase state may drift between sessions (requiring re-alignment gates)

A Master Refactor Plan is NOT appropriate for:
- Single-session tasks (use a standard implementation plan instead)
- Planning documents that do not drive Claude Code execution

---

## Workflow

### Step 1 -- Gather Context

Before generating the plan, collect the following. If any item is missing, ask for it
before proceeding. Do not generate a plan with empty or placeholder answers for these:

**Required:**
- Sprint number and short title (e.g., "026 — Data Structure Consolidation Continued")
- Problem statement: what duplication, violation, or drift is being resolved?
- Endstate: what does "done" look like? (binary, verifiable conditions)
- Governing TDRs: which approved TDRs constrain the work?
- Guiding principles: consolidation direction, what stays in place, what moves

**Strongly recommended (ask if not provided):**
- Sub-sprint breakdown: how many sub-sprints, what does each accomplish?
- Dependency order: which sub-sprints must complete before others can begin?
- Paired sessions: are any sub-sprints too coupled to survive a build-break between them?
- Step constraints: file limit per step, project limit per step (defaults: 15 files, 3 projects)
- Output directory for session summaries

**Optional (can be filled in later):**
- Known decision gates (architectural questions that must be answered before or during execution)
- Risk ratings per sub-sprint
- Specific file lists per sub-sprint (may require a codebase audit to populate accurately)

If the user says "figure it out from the codebase", run a discovery scan before generating
the plan. Do not populate file lists from memory or assumptions — verify with grep/find.

---

### Step 2 -- Determine Output Location

The master plan lives in the sprint's working documents folder.
Standard path: `Documents/Working/Refactor/Sprint [NNN] [Title]/Sprint[NNN]-Master-Refactor-Plan.md`

If the user specifies a different location, use that. If genuinely ambiguous, ask.

---

### Step 3 -- Generate the Plan

Load `references/template.md`. Populate each section using the gathered context.

**Section-by-section rules:**

**Header block**
- Set Date to today's date
- Set Status to "Draft"
- Set Predecessor only if the user identified one; otherwise omit the field

**Purpose**
- One paragraph on the problem being solved
- One sentence on the goal
- Reference the predecessor sprint if one exists

**Guiding Principles**
- Include the consolidation direction (what moves where, what stays)
- Include the build/test gate rule
- Include file and project count constraints
- Include any paired-session rules
- Be specific — "no more than 15 files" not "keep changes small"

**Governing TDRs**
- List only TDRs that directly constrain decisions in this sprint
- Include the rule each TDR encodes, not just the identifier

**Endstate**
- Each bullet must be independently verifiable (grep, build, test run)
- Use assembly-level locations for every type or file mentioned
- End with "Solution builds clean, all tests pass"

**Running Plan Estimates**
- Leave as "*(None yet)*" stubs — populated during execution

**Sub-Sprint Overview**
- Use a text list showing groupings and dependencies
- Follow with a dependency graph in a code block
- Note paired sessions explicitly

**Sub-Sprint Sections** (one per sub-sprint)
- Populate Goal, Risk, Dependencies, Projects touched from gathered context
- For each known problem area: describe the current state and the approach
- **TDD execution order:** Each sub-sprint's approach must follow a test-driven cycle. The plan specifies *what* changes, not *how* to implement line-by-line. The execution ordering within each sub-sprint is:
  1. Define contracts/interfaces first (compile, no behavior yet)
  2. Write or update tests against those contracts (red — tests fail because implementation doesn't exist)
  3. Implement until tests pass (green)
  4. Verify: build + test
  The plan should describe the contracts and expected behaviors, not prescribe implementation details. Tests are the specification; the implementation satisfies them.
- If file lists require a codebase audit, write "[REQUIRES AUDIT — re-alignment gate will verify]"
  rather than guessing
- Include Decision Gates for any judgment call the plan cannot resolve upfront
- Exit criteria: binary, verifiable conditions specific to this sub-sprint
- Mandatory Protocol Gates: copy verbatim from template — this block is boilerplate

**Risk Summary**
- One line per sub-sprint with risk level and primary risk driver
- Risk levels: Low / Low-Medium / Medium / Medium-High / High / Medium-Large

**Decision Gates Summary**
- One entry per gate across all sub-sprints
- Unresolved: include a recommendation and which TDR supports it
- Leave resolved-gate annotation blank — populated during execution

**Iterative Re-Alignment Protocol**
- Copy verbatim from template — this section is structural boilerplate
- Update only the output directory path reference

**Step Constraints**
- Populate the file and project count limits
- Update the output directory path
- All other content copies verbatim from template

---

### Step 4 -- Write the File

Write the completed plan to the output location determined in Step 2.

Confirm the file was written and provide the path.

Do not present the full document inline in the conversation — it is too long to be useful
as chat output. Instead, summarise what was generated:

```
Master Refactor Plan written to:
  [full path]

Sprint count:    [N] sub-sprints ([names])
Dependency graph: [one-line summary]
TDRs referenced: [list]
Decision gates:  [N] identified
Step constraints: [N] projects / [N] files per step

Sections requiring codebase audit before first execution:
  [list any file lists marked REQUIRES AUDIT, or "None"]
```

---

### Step 5 -- Offer Follow-On Actions

After writing the file, offer:

> "I can also:
> - Run an adversarial review of the plan structure (use the adversarial-review skill)
> - Run a plan-doc-review to verify TDR compliance before execution begins
> - Populate the file lists for sub-sprints marked REQUIRES AUDIT (needs codebase access)"

Do not automatically run any of these. The user decides.

---

## Updating an Existing Master Plan

If the user asks to update (not create) a master plan — for example, after a sub-sprint
completes — the workflow is:

1. Read the existing plan
2. Identify which section needs updating (Running Plan Estimates, a sub-sprint section, the endstate)
3. Apply the update using str_replace — never rewrite the whole file
4. Follow the append-only rule for Running Plan Estimates: never modify prior entries

Trigger phrases: "update the master plan", "add the reassessment", "mark [NNN]x complete",
"record the deviation".

---

## Boundaries

- This skill generates planning documents. It does not execute refactoring work.
- This skill does not check TDR compliance of the plan it generates — use plan-doc-review for that.
- File lists marked REQUIRES AUDIT are intentionally incomplete. Do not guess at file names.
- The Mandatory Protocol Gates block and the Iterative Re-Alignment Protocol section are
  structural boilerplate. Do not paraphrase or shorten them when populating the template.
- Running Plan Estimates entries are append-only. Never edit a prior entry.
