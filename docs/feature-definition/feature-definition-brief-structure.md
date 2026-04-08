# Feature Definition Brief: Three-Layer Structure for Design Brief Output

**Status:** Draft
**Date:** 2026-04-07

---

## Problem Statement

Chester's design-figure-out skill produces a design brief with no prescribed internal structure. The spec agent (design-specify) receives this brief and must discover the codebase implementation surface on its own — costing tokens, time, and risking missed change points. The authored-facts brief demonstrated this: it described "14 junction tables" and "the wiring is in place" without naming classes, methods, or files. The spec agent had to grep the codebase to find them.

The design-figure-out agent already explores the codebase extensively during the Socratic interview (Phase 3, Research Boundary). It discovers the implementation surface as part of its work — then discards that knowledge when writing the brief. The three-layer structure captures what the agent already knows and passes it to the spec agent.

### Prior attempts

This is the first attempt to add structure to the design brief output. The current state is not a failed attempt — it is an absence. The figure-out skill has evolved through multiple iterations focused on the interview process (question types, translation gate, thinking protocol) but the output format has never been specified beyond "each decision with conclusion and rationale."

---

## Current State Inventory

### design-figure-out (`skills/design-figure-out/SKILL.md`)

- Phase 4 Closure (lines 247–274) governs brief writing. Line 253: "Present the completed design brief to the user — each decision with conclusion and rationale." No template prescribed.
- Phase 3 Research Boundary (lines 135–141): the agent explores code extensively during the interview — reads types, traces call chains, maps hierarchies — but is instructed to "digest internally" and "never relay raw findings." This is the right instruction for the interview, but the brief is where those findings should land.
- Phase 2 (lines 112–121): establishes the problem statement as "WHAT and WHY, not HOW." This framing should carry into the brief.
- The skill writes two files: `{sprint-name}-design-00.md` (the brief) and `{sprint-name}-thinking-00.md` (the thinking summary). Only the brief needs structure changes.

### design-specify (`skills/design-specify/SKILL.md`)

- Entry condition (lines 40–44): expects a design brief at `{output_dir}/design/{sprint-name}-design-00.md`. No expectations about its internal structure.
- Spec writing guidance (lines 113–116): "Read the design brief from disk and conversation context. Synthesize into a structured spec document covering: architecture, components, data flow, error handling, testing strategy, constraints, non-goals." The agent must infer the codebase impact from whatever the brief provides.
- The spec agent is not told to flag missing information in the brief — it silently compensates by exploring the codebase itself.

### spec-reviewer (`skills/design-specify/spec-reviewer.md`)

- Checks four categories: goals coverage, constraints respected, no untraceable additions, internal consistency.
- Does not check whether the spec's codebase impact assessment is complete — only whether it aligns with the design brief.

### Exemplar briefs (produced by figure-out, consumed by specify)

- `authored-facts-improvements-design-00.md` — has Problem Statement, Background, Impact, Root Cause, Architectural Landscape, Design Direction, Consumers, Frozen Systems, Open Concerns, Explored but Deferred, Acceptance Criteria, Residual Risks. Strong on history and constraints, weak on implementation inventory.
- Other briefs at `docs/chester/plans/2026-04-01-service-error-redesign/design/` and `docs/chester/plans/20260402-01-validation-item-unification/design/` follow similar patterns with varying section names.

---

## Governing Constraints

- **The Socratic interview process (Phases 1–3) does not change.** The three-layer structure affects only Phase 4 output formatting. The interview continues to operate in domain language with code knowledge as private research.
- **The thinking summary format does not change.** It captures HOW decisions were made. The brief captures WHAT was decided and what the spec agent needs to know.
- **File naming conventions do not change.** The brief remains `{sprint-name}-design-00.md` in the `design/` subdirectory.
- **The transition to design-specify does not change.** Figure-out still always transitions to specify.
- **The Research Boundary still applies during the interview.** Code details are private during questioning. The brief is where they surface — specifically in Layer 1.
- **The spec-reviewer's four categories are sufficient for existing checks.** "Constraints respected" already covers Layer 2 checking. "Goals coverage" covers Layer 3 (the brief's problem statement maps to goals). Layer 1 coverage (did the brief name the change surface?) is the gap.

---

## Design Direction

### Rename

"Design Brief" becomes "Feature Definition Brief." The title change signals the document's purpose: defining a feature for handoff to the spec agent, not summarizing a design conversation.

### Three-layer structure added to Phase 4 output

The brief gains three required sections in addition to whatever decisions the interview produced:

**Layer 1 — Current State Inventory:** Name the key classes, files, and methods that implement the feature area being changed. Not a full code listing — 10–15 entries with one-line roles and project ownership. This is the change surface the spec agent needs to find. The figure-out agent already discovered these during Phase 3 research; this layer captures that knowledge instead of discarding it.

**Layer 2 — Governing Constraints:** Reproduce relevant constraints from CLAUDE.md, approved ADRs/TDRs, or other normative documents so the brief is self-contained. Distinguish structural constraints (can't be changed without breaking something else) from normative constraints (could be changed with justification). Include a "Frozen Systems" section for entities/interfaces that are explicitly off-limits.

**Layer 3 — Prior Attempts and History:** If prior attempts exist, describe each with the failure pattern and a rehabilitation path (under what conditions could this approach work?). If this is the first attempt, state that explicitly. If the current design direction is a rehabilitation of a prior attempt, say so.

### Three-layer rationale

The three layers come from how decision-making works when the full problem can't be held in one context:

- **Layer 1 (what exists)** determines whether the spec agent finds all the code it needs to change. A brief that names the 10–15 key classes and methods on the change surface costs the designer almost nothing (they already know these from the interview exploration) but saves the spec agent the riskiest part of its work: discovering change points in unfamiliar code where a miss becomes a bug in the implementation plan.
- **Layer 2 (what's fixed)** determines which fences are electrified. Constraints come in two flavors: structural (can't relax without breaking something else) and normative (could relax with justification). When the distinction isn't made, agents either treat all constraints as structural (generating only minor spec variations) or treat all as normative (generating specs that violate load-bearing rules).
- **Layer 3 (what was tried)** determines which approaches are credible. Without failure history, the spec agent may reinvent rejected approaches or miss that the current direction is a rehabilitation of a prior attempt. The rehabilitation path — under what conditions would a rejected alternative become viable again — pressure-tests the rejection and gives option generators a structured starting point.

### Update to design-specify

The spec agent should be told to expect the three layers and to flag when one is missing rather than silently compensating. Add to the "Writing the Spec" section: "If the design brief is missing a Current State Inventory, flag this to the user before writing the spec — the brief should name the implementation surface."

### Update to spec-reviewer

Add a fifth check category: "Implementation Surface Coverage — does the spec's layer-by-layer impact assessment account for every class/method named in the design brief's Current State Inventory? Flag any inventory item not addressed by the spec."

---

## Open Concerns

- **How prescriptive should the Layer 1 template be?** The authored-facts brief had a natural "Architectural Landscape" section that partially served this role. Should the template enforce a specific format (bulleted class inventory grouped by project) or allow organic section naming?
- **Should the three layers be mandatory or advisory?** Some design sessions (small, single-layer changes) may not need all three layers. A mandatory structure on a trivial change adds overhead. But making it advisory means agents skip it when they shouldn't.
- **Where does this guidance live in the skill?** Phase 4 is already 27 lines. Adding a detailed template could make it unwieldy. Consider a companion template file (like `spec-reviewer.md` is for specify) — a `brief-template.md` that Phase 4 references.

---

## Acceptance Criteria

- design-figure-out Phase 4 produces a brief titled "Feature Definition Brief" with three named layers
- The Current State Inventory names classes, files, and methods on the change surface (not a conceptual description)
- Governing Constraints reproduces relevant normative rules inline so the brief is self-contained
- Prior Attempts section states failure patterns and rehabilitation paths (or explicitly states "first attempt")
- design-specify flags a missing Current State Inventory rather than silently compensating
- spec-reviewer checks that the spec addresses every item in the Current State Inventory
