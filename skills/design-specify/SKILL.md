---
name: design-specify
description: "Formalize an approved design brief into a durable spec document. Use when a design brief exists (from design-experimental, design-small-task, a whiteboard, a previous session, or a human-written brief) and needs to be written as a formal spec with competing-architecture review, automated fidelity review, and optional codebase ground-truth verification before plan-build."
---

# Build Spec

Formalize an approved design into a durable spec document, validate it through automated and human review.

<HARD-GATE>
Do NOT invoke plan-build or any implementation skill until the spec has passed automated review AND the user has approved it. Only then proceed to invoke plan-build.
</HARD-GATE>

## Entry Condition

A design exists — either:
- A design brief from `design-experimental` or `design-small-task` at `{CHESTER_WORKING_DIR}/{sprint-subdir}/design/{sprint-name}-design-00.md`
- A human-written brief or design from an external source
- A design described in conversation context

The working directory and subdirectories should already exist (created by the upstream design skill). If invoked standalone, this skill creates them.

## Checklist

You MUST create a task for each of these items and complete them in order:

1. **Setup** — if invoked standalone (no figure-out), invoke `start-bootstrap`; otherwise sprint context already exists
2. **Read design brief** — read the design brief from disk or gather design from conversation context
3. **Competing architectures + prior art** — dispatcher reads the brief, names the two sharpest tensions, defines an axis for each, then dispatches 3 agents in parallel: 2 `feature-dev:code-architect` agents on dispatcher-assigned axes (each self-checking against F-A-C: feasibility / suitability / completeness) + 1 prior art explorer. Dispatcher constructs a hybrid recommendation from architect outputs. Present three blocks to user (Architect A / Architect B / Hybrid Recommendation) with prior art context; user picks direction.
4. **Write spec document** — synthesize design into structured spec based on chosen architecture (see `util-artifact-schema` for output path and naming)
5. **Spec fidelity review (single pass)** — dispatch spec-document-reviewer subagent once with the design brief, address any returned issues inline (no loop, no iteration cap)
6. **Adversarial spec review (inline)** — read `references/adversarial-spec-review.md` and apply the spec-flavored adversarial pattern (modeled on `chester:plan-attack` but tuned for the spec stage). No subagent dispatch. Address findings inline.
7. **Ground-truth review (opt-in)** — after the two reviews pass, offer codebase verification; if accepted, dispatch ground-truth-reviewer subagent, fix HIGH/MEDIUM findings, write report to `spec/` subdirectory
8. **User review gate** — present clean spec (and ground-truth report if generated) to user for review; if changes requested, apply changes and ask user which review(s) to re-run (fidelity / adversarial / both / neither). User dictates re-run scope.
9. **Transition** — invoke plan-build (spec is NOT committed here — `finish-archive-artifacts` copies all artifacts into the worktree for merge)

## Process Flow

If invoked standalone, ask for the output directory and create subdirectories first; otherwise the sprint context already exists. Read the design brief. Dispatch the three parallel agents (two architects on dispatcher-assigned axes plus one prior-art explorer), build the hybrid recommendation, and present all three blocks for the user to pick a direction. Write the spec. Run the spec fidelity reviewer once (subagent dispatch, single pass, address findings inline). Then run the adversarial spec review inline (no subagent — see `references/adversarial-spec-review.md` for the procedure). Once both reviews are clean, offer the opt-in ground-truth review; on findings, fix HIGH/MEDIUM, write the report. Present the spec (and report, if any) to the user — on changes-requested, apply changes and ask the user which review(s) to re-run; on approval, invoke plan-build.

**The terminal state is invoking plan-build.** Do NOT invoke any other implementation skill.

## Standalone Invocation

When invoked without a prior `design-experimental` or `design-small-task` session, invoke `start-bootstrap` to set up the sprint context (config, naming, directories, task reset).

## Competing Architectures + Prior Art

After reading the design brief but before writing the spec, dispatch three agents in parallel. Two are architects exploring competing structural approaches along dispatcher-assigned axes; one researches prior art from adjacent sprints. The dispatcher then constructs a hybrid recommendation from the architect outputs.

### Acceptance Preconditions (F-A-C)

Every architect option (and the dispatcher-built hybrid) must pass three preconditions. Architects self-check their designs against these before returning; the dispatcher re-checks the hybrid it constructs. Every option the user sees is therefore implementable by construction — no strawmen, no decoy extremes.

- **Feasible** — the design can be performed within normal sprint constraints. Time, team capacity, ops tolerance, deployment windows. A design that requires a wave-front migration the sprint cannot absorb fails feasibility.
- **Suitable** — the design solves the problem the brief specifies. Not a related problem, not a broader problem — the one stated. A design that solves something adjacent fails suitability.
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
- **F-A-C definitions and self-check directive** — the architect must self-check its design against feasibility, suitability, and completeness before returning; iterate privately until pass; if the axis genuinely cannot satisfy all three, return a null result with reasoning rather than a weakened design claiming to pass

**Architect output (each returns, structured bulleted format, no tables):**

- **Approach Summary** — 2-3 sentences naming the shape
- **Axis Position** — explicit statement of where on the assigned axis this design sits and what it sacrifices at the other end
- **Component Structure** — bullets of new or modified units
- **Reuse Profile** — bullets of existing code or patterns leveraged
- **Brief Compliance** — per-goal addressed-by, per-constraint respected-how, per-decision honored-where
- **Risks Introduced** — bullets
- **Feasibility Evidence** — specific reasoning showing the design fits normal sprint constraints (cite concrete constraints, not vague claims)
- **Suitability Evidence** — specific reasoning showing the design solves the problem the brief asks (cite concrete brief goals)
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

## Writing the Spec

- Read the design brief from disk (if it exists) and conversation context
- Using the user's chosen architecture as the structural foundation, synthesize into a structured spec document covering: architecture, components, data flow, error handling, testing strategy, constraints, non-goals
- Scale each section to its complexity — a few sentences if straightforward, detailed if nuanced
- No YAML frontmatter is needed in spec documents. All skills read output paths from the project config, not from document frontmatter.
- Write to the `spec/` subdirectory (see `util-artifact-schema` for exact path and naming)

## Spec Fidelity Review (single pass)

**Review purpose: Design Alignment** — does the spec faithfully address the design brief's goals, constraints, and decisions?

After writing the spec:

1. Dispatch spec-document-reviewer subagent **once** (see `spec-reviewer.md` in this skill directory).
   - Provide both the spec path AND the design brief path.
   - If no design brief exists (standalone invocation), dispatch with spec only — the reviewer falls back to internal-consistency checking.
2. The reviewer checks: goals coverage, constraints respected, no untraceable additions, internal consistency.
3. **Address any returned issues inline** — for each finding, ask silently: "Is this issue valid given the spec's stated intent? What is the minimal fix? Does this fix affect any adjacent section of the spec?" Apply the fix, move to the next issue. Bump the version number (`util-artifact-schema` versioning) after the fixes land.

No re-dispatch loop, no iteration cap. The single pass is the gate. If the reviewer returned so many issues that fidelity confidence is shaken, escalate to the user with the reviewer report and ask whether to accept the fixes, revise the spec further, or revisit the architecture choice.

## Adversarial Spec Review (inline)

**Review purpose: Adversarial Hardening** — what gaps, contradictions, and unstated assumptions exist in the spec that could cause the plan stage to plan against false premises?

After spec fidelity passes, run this review inline (no subagent dispatch). Read [`references/adversarial-spec-review.md`](references/adversarial-spec-review.md) for the full procedure: dimensions covered (structural integrity, execution risk, unstated assumptions, contract gaps, concurrency hazards), evidence rule (every finding cites file:line or concrete spec passage — speculative concerns are not findings), severity scale, and fix-and-version-bump discipline.

The single inline pass is the gate. If findings are so numerous that confidence in the spec is shaken, escalate to the user with the review notes; do not loop.

## Ground-Truth Review (Opt-In)

After the fidelity review and the adversarial spec review both pass, offer the ground-truth review:

> "Spec fidelity and adversarial reviews passed. Would you like to run a ground-truth
> review to verify spec claims against the actual codebase? This is recommended for
> specs that reference existing types, APIs, file paths, or runtime behavior. Skip
> for greenfield specs with no existing code references."

If the user declines, proceed directly to the user review gate.

If the user requests changes at the user review gate and the flow loops back through the two upstream reviews, do not re-offer the ground-truth review if it already ran in this session — proceed directly to the user review gate unless the user's changes materially alter code references.

If the user accepts:

1. Dispatch ground-truth-reviewer subagent (see ground-truth-reviewer.md in this skill directory)
   - Provide: spec path AND design brief path
   - The subagent reads source files to verify every claim the spec makes about existing code
2. On return, evaluate findings by severity:
   - **HIGH findings:** Fix the spec (increment version per `util-artifact-schema`). Re-run the ground-truth review only — do not re-run the fidelity or adversarial reviews, since the fix targets codebase accuracy. Exception: if the fix changes the spec's architectural approach (not just correcting a reference), re-run the fidelity and adversarial reviews as well.
   - **MEDIUM findings:** Fix the spec. No re-review needed unless the fix is substantial.
   - **LOW findings:** Note in the report. Do not fix the spec — these are context for the implementer.
   - **Iteration cap:** ground-truth re-review is capped at one re-run after fixes. If HIGH findings persist after one re-run, escalate to user.
3. Write the ground-truth report to the `spec/` subdirectory as `{sprint-name}-spec-ground-truth-report-00.md` (see `util-artifact-schema`)
4. Present the report summary to the user alongside the spec at the user review gate

The ground-truth report is preserved as an artifact. In a future iteration, `plan-build`
could pass the ground-truth report to plan-attack to reduce redundant verification at the
plan stage — but that is out of scope for this change.

## User Review Gate

After the fidelity and adversarial reviews pass (and ground-truth review if accepted):

> "Spec written and reviewed at `{path}`. Please review and let me know if you want changes before we proceed to the implementation plan."

If a ground-truth review was performed, also present:

> "Ground-truth review report at `{report-path}`. [N] findings ([breakdown by severity]). [1-sentence risk summary from report]."

Wait for the user's response. If they request changes, apply them, then ask the user which review(s) to re-run: fidelity, adversarial, both, or neither. The user dictates the re-run scope — do not assume. Only proceed to plan-build once the user approves the spec.

## Post-Approval

After the user approves the spec, it remains in the working directory. The spec is NOT committed here — `finish-archive-artifacts` copies all artifacts into the worktree for merge.

## MCP Usage

- **Think** only — per-issue evaluation during the fidelity review and during the inline adversarial review
- Sequential and Structured thinking are not used; spec writing is craft, and the single-pass review structure does not warrant structured cross-referencing

## Integration

- **Calls:** `start-bootstrap` (standalone only)
- **Dispatches:** spec-document-reviewer subagent (single pass, fidelity), ground-truth-reviewer subagent (opt-in, after both reviews)
- **Reads:** `references/adversarial-spec-review.md` (inline adversarial review pattern, modeled on `chester:plan-attack`), `util-artifact-schema` (naming/paths), `util-design-brief-template` (brief structure reference), `util-budget-guard`
- **Invoked by:** `design-experimental` or `design-small-task` (mandatory in the canonical sequence), or user directly (standalone)
- **Transitions to:** `plan-build`
- **Does NOT invoke as a separate skill flow:** plan-attack (used inline only — spec stage), plan-smell (deferred to plan-build's hardening gate), or any implementation skill
