---
name: spec-architect
description: "Settle the architecture for a FAC-incomplete design before spec authoring. Use when a design brief from design-small-task exists but its architecture is not yet settled — runs competing-architecture review (two code-architect axes + prior-art explorer), F-A-C self-checks, and a user-selection gate, producing a FAC-complete design. Invoked only on the small-task path; the committee path skips it. Transitions to spec-write."
version: v0002
---

# Settle Architecture

Settle the architecture for a FAC-incomplete design: compare competing approaches, survey prior art, run feasibility/acceptability/completeness checks, and take a user selection. Produces a FAC-complete design that `spec-write` authors into a spec.

This is a **flexible** skill — adapt the axis selection and hybrid construction to the brief.

## Entry Condition

A FAC-incomplete design exists — an architecture not yet settled. Either:
- A design brief from `design-small-task` at `{CHESTER_WORKING_DIR}/{sprint-subdir}/design/{sprint-name}-design-00.md`
- A human-written brief whose architecture is unsettled
- A design described in conversation context with the architecture still open

Invoked **only** by the FAC-incomplete entry path. The committee path produces a FAC-complete design and goes straight to `spec-write` — `spec-architect` is never on that path.

The working directory and subdirectories should already exist (created by the upstream design skill). If invoked standalone, this skill creates them.

## Checklist

You MUST create a task for each of these items and complete them in order:

1. **Setup** — if invoked standalone (no upstream design skill), invoke `start-bootstrap`; otherwise sprint context already exists
2. **Read design brief** — read the design brief from disk or gather the design from conversation context
3. **Competing architectures + prior art** — dispatcher reads the brief, names the two sharpest tensions, defines an axis for each, then dispatches 3 agents in parallel: 2 `feature-dev:code-architect` agents on dispatcher-assigned axes (each self-checking against F-A-C: feasibility / acceptability / completeness) + 1 prior-art explorer. Dispatcher constructs a hybrid recommendation. Present three blocks to the user (Architect A / Architect B / Hybrid Recommendation) with prior-art context; user picks direction.
4. **Transition** — the user's selected direction completes the FAC-complete design. Invoke `spec-write` to author the spec.

## Standalone Invocation

When invoked without a prior `design-small-task` session, invoke `start-bootstrap` to set up the sprint context (config, naming, directories, task reset).

## Competing Architectures + Prior Art

After reading the design brief but before writing the spec, dispatch three agents in parallel. Two are architects exploring competing structural approaches along dispatcher-assigned axes; one researches prior art from adjacent sprints. The dispatcher then constructs a hybrid recommendation from the architect outputs.

### Acceptance Preconditions (F-A-C)

Every architect option (and the dispatcher-built hybrid) must pass three preconditions. Architects self-check their designs against these before returning; the dispatcher re-checks the hybrid it constructs. Every option the user sees is therefore implementable by construction — no strawmen, no decoy extremes.

A design is **suitable** exactly when it passes all three: suitability is the umbrella the F-A-C preconditions jointly establish, not a fourth sibling.

- **Feasible** — the design can be performed within normal sprint constraints. Time, team capacity, ops tolerance, deployment windows. A design that requires a wave-front migration the sprint cannot absorb fails feasibility.
- **Acceptable** — the design solves the problem the brief specifies. Not a related problem, not a broader problem — the one stated. A design that solves something adjacent fails acceptability.
- **Complete** — the design addresses the full scope of what the brief asks. A great solution to one of three tasks is not complete. Partial coverage fails completeness.

Architects and the dispatcher must cite *specific* evidence for each precondition — concrete sprint-constraint values, concrete brief goals solved, concrete scope items covered. Vague claims do not count as passing.

### Axis Selection (Dispatcher)

Before dispatching architects, the dispatcher reads the design brief and identifies the **two sharpest tensions** for this sprint. Tensions come from the brief's actual content — competing goals, scope-vs-time trade-offs, quality-vs-risk splits, decisions the brief explicitly left open, conflicts between constraints. Not from a fixed menu.

For each tension, the dispatcher defines an axis of variation. Example axes (illustrative, not prescribed):

- "Minimal change surface vs. clean abstraction"
- "Reuse existing infrastructure vs. introduce purpose-built layer"
- "Atomic cutover vs. staged rollout"
- "Strict typing vs. ergonomic developer surface"

Each architect is assigned one axis with explicit framing: "optimize for one end, accept sacrifice at the other end." Architects do not see each other's axes.

**Dispatcher discipline:** axes must come from *this* brief, not from the dispatcher's priors. If the dispatcher cannot point to the brief content (a goal, a constraint, a decision left open) that makes an axis sharp, the axis is fabricated — drop it and look again.

### Architect Subagents

Dispatch two `feature-dev:code-architect` agents in parallel, isolated, no cross-contamination. Each receives:

- The full design brief
- Codebase context for the relevant areas
- **Assigned axis** — the dispatcher-defined axis with directive to optimize for one end and accept sacrifice at the other
- **F-A-C definitions and self-check directive** — the architect must self-check its design against feasibility, acceptability, and completeness before returning; iterate privately until pass; if the axis genuinely cannot satisfy all three, return a null result with reasoning rather than a weakened design claiming to pass

**Architect output (each returns, structured bulleted format, no tables):**

- **Approach Summary** — 2-3 sentences naming the shape
- **Axis Position** — explicit statement of where on the assigned axis this design sits and what it sacrifices at the other end
- **Component Structure** — bullets of new or modified units
- **Reuse Profile** — bullets of existing code or patterns leveraged
- **Brief Compliance** — per-goal addressed-by, per-constraint respected-how, per-decision honored-where
- **Risks Introduced** — bullets
- **Feasibility Evidence** — specific reasoning showing the design fits normal sprint constraints (cite concrete constraints, not vague claims)
- **Acceptability Evidence** — specific reasoning showing the design solves the problem the brief asks (cite concrete brief goals)
- **Completeness Evidence** — specific reasoning showing the full scope is covered (cite concrete scope items)

Architects do NOT produce a per-architect "Alternatives Considered" section — hybrid construction across the two architects is the dispatcher's job.

**Null result format:** if an architect determines no design along the assigned axis can satisfy all three preconditions, it returns a brief report: which precondition fails, why the axis forces the failure, and what the architect tried before concluding null. Do not return a weakened design claiming to pass. Honesty about impossibility carries more signal than a compromised design.

### Prior Art Explorer

Dispatch one `Explore` agent in parallel with the two architects. This agent searches both the plans directory (archived, tracked) and the working directory (in-progress, gitignored) for design briefs, specs, plans, and thinking summaries from prior sprints relevant to the current design brief.

| Agent | Focus | Prompt guidance |
|-------|-------|-----------------|
| Explorer | **Prior art & companion work** | "Search `{CHESTER_PLANS_DIR}/` and `{CHESTER_WORKING_DIR}/` for design briefs (`*-design-*.md`), specs (`*-spec-*.md`), plans (`*-plan-*.md`), and thinking summaries (`*-thinking-*.md`) from previous sprints. For each artifact found that is relevant to [design brief summary]: read it and extract (1) key findings and discoveries, (2) decisions made that constrain or inform the current design, (3) current status (Approved, Paused, Draft, Superseded), (4) any infrastructure or system that was found to be non-functional, partial, or blocked, (5) any code, types, or patterns that were built by prior sprints and could be reused or must be respected. Report organized by sprint, with brief name, status, and a summary of findings relevant to the current design." |

The prior art explorer's findings serve two purposes:

- **Context for the comparison** — when presenting Architect A, Architect B, and the hybrid to the user, prior art findings may favor one approach over another (e.g., a prior sprint built infrastructure that one architect's approach can reuse, or a paused sprint found that a pattern another architect proposes doesn't work)
- **Constraint for the spec** — decisions, conventions, and non-functional infrastructure from companion work become constraints in the spec, preventing the spec from planning work against broken plumbing or contradicting adjacent design decisions

### Hybrid Recommendation (Dispatcher)

After both architects return, the dispatcher constructs a hybrid as a recommendation. Hybrid is one of:

1. **Principled merge** — a design combining elements of both architects' approaches with its own named optimization target and its own declared sacrifices. Not "balance". Not "middle". Name the optimization target explicitly; name what the hybrid trades away.
2. **Third shape** — a different approach suggested by the tension between the two axes, optimized along its own dimension (e.g., staging the work temporally, deferring one tension to a later sprint, running parallel systems with eventual consolidation).
3. **No merge possible** — honest null from the dispatcher: the two architects' axes are structurally incompatible; pick one. Rare but legitimate.

**Hybrid must pass F-A-C.** Dispatcher self-checks the hybrid the same way architects self-check their designs, with the same evidence-citation standard. A hybrid that cannot pass all three is not presented.

**Null-architect handling.** If one architect returns null, the dispatcher constructs the hybrid from the surviving architect's output plus a dispatcher-proposed variant along a different angle of the same axis. If both architects return null, escalate to user: "Neither axis admits a design that passes F-A-C. Here's what each architect reported — relax a precondition, adjust scope, or revisit the brief?"

### After all dispatched agents complete

**Present the comparison to the user** as three parallel blocks plus prior-art context:

1. **Framing** — one to two sentences: which two tensions you picked from the brief, why those, and what the dispatcher constructed (hybrid type: principled merge / third shape / honest null).
2. **Prior art summary** — if the explorer found relevant companion work, note how it affects each block (e.g., "Architect A's approach aligns with types built in sprint X" or "Architect B's approach depends on validation wiring that sprint Y found non-functional"). If no relevant prior art, state that explicitly.
3. **Three parallel bulleted blocks** — Architect A, Architect B, Hybrid Recommendation. Each block uses the architect output structure above with F-A-C evidence inline. For any architect that returned null, show the null report in place of a design block.
4. **Recommendation** — the hybrid is the dispatcher's recommendation by construction. Explain the reasoning: why this hybrid, why its sacrifices are acceptable, which tensions it resolves and which it defers.
5. **Ask the user which they prefer** — Architect A, Architect B, the hybrid, or articulate their own variant. If the user says "whatever you think," go with the hybrid but state the choice explicitly so it is on record.

The user's choice (or articulated variant) becomes the architectural foundation for the spec.

This step exists because humans evaluate *comparisons* far better than *single proposals*. Presenting one architecture and asking "is this good?" is a weaker gate than presenting two real options and a hybrid and asking "which fits?" The prior art explorer ensures all three options are grounded in what adjacent work has actually established. The F-A-C self-check ensures every option presented is implementable — no decoy extremes that exist only to make the middle look reasonable.

## Integration

- **Calls:** `start-bootstrap` (standalone only)
- **Dispatches:** two `feature-dev:code-architect` agents (competing axes), one `Explore` agent (prior art)
- **Reads:** `util-artifact-schema` (naming/paths), the upstream brief's source template `../design-small-task/references/design-brief-small-template.md` (6-section lightweight)
- **Invoked by:** `design-small-task` (FAC-incomplete path), or user directly (standalone, when a brief exists with unsettled architecture)
- **Transitions to:** `spec-write`
- **Does NOT:** author the spec (that is `spec-write`), run review passes (that is `spec-harden`), or get invoked on the committee path (committee output is already FAC-complete)
