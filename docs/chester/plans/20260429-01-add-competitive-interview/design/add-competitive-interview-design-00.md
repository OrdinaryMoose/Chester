# Design Brief: Competitive Interview Flow for Step B

**Status:** Draft
**Date:** 2026-04-29
**Sprint:** 20260429-01-add-competitive-interview

## Problem Statement

`design-large-task`'s Phase 4 Understand Stage grounds rigor in single-agent saturation scoring across nine dimensions. The pipeline has no mechanism to externalize perspective contention before Solve Stage, leaving anchoring bias undetectable and producing framings that reach Solve under-cooked despite saturation closure. The single-voice rule (`util-design-partner-role`) governs designer-facing turns but does not prohibit multi-voice scaffolding behind the scenes — the design space for an externalized contention mechanism is unexplored.

**Essential task:** Externalize perspective contention during Chester's framing phase without violating single-voice designer flow.

## Prior Art

- **Linstone Multiple Perspectives / TOP (1984)** — sociotechnical decision framework with incommensurate lenses; basis for early roster experiments before settling on Cartesian opposition
- **Multi-Agent Debate (Du et al, 2023)** — empirical evidence that N-agent debate over K rounds improves LLM convergence; primary external validation that the pattern works for LLMs specifically
- **Lincoln-Douglas / Oxford / Policy debate formats** — formal opening/opposing/counter/collapse structures; basis for the per-round phase structure
- **IBIS-structured argumentation (Issue / Position / Argument / Resolution)** — basis for the per-round transcribed format
- **Chester's existing `fork-policy.md` and named-subagent pattern (`agents/`)** — review independence by construction; precedent for per-role agent definitions
- **Chester's existing `design-large-task` Phase 4 Understand Stage** — saturation scoring under Understanding MCP, single-perspective; this is what Step B replaces in the team-mode swap

## Design Decisions

### D1 — Four-pole Cartesian lens roster

Two opposing-pair axes:

- **N (Innovator)** ↔ **S (Conservator)** — advocacy axis (change vs. stasis)
- **E (Purist — "Chester philosophy alone drives the answer")** ↔ **W (Pragmatist — "ship what works")** — principle axis

Forced opposition between paired poles eliminates polite collapse by construction. Four poles produce four quadrants (NE/NW/SE/SW); strongest framings survive cross-quadrant pressure (diagonal attacks). Linstone-style "incommensurability" replaced with explicit advocacy positions; each pole argues *for* a stance rather than *from* a perspective.

**Rejected alternatives:**

- **Linstone TOP (Technical / Organizational / Personal)** — three orthogonal lenses; insufficient adversarial pressure, lenses can converge politely without real conflict
- **IDEO triangle (Desirability / Feasibility / Viability)** — product-framing standard; doesn't carve cleanly for Chester's internal-tooling context
- **Six Thinking Hats (de Bono)** — six lenses too many for LLM team; coordination overhead exceeds value
- **T / O / Operator / Consumer (4 lenses)** — separated practitioner concerns but lacked advocacy axis; weaker debate

### D2 — Five-round formal debate sequence

Per-round phases (Lincoln-Douglas / IBIS shape): **opening argument → opposing arguments → counter-arguments → idea collapse → recommendation (alive / wounded / dead)**.

Round sequence:

- **R1:** N opens — Innovator's candidate problem statement
- **R2:** S opens — Conservator's candidate
- **R3:** E opens — Purist's candidate
- **R4:** W opens — Pragmatist's candidate
- **R5:** Synthesis — survivors merged, all four poles attack the consolidated draft, ratify or block

Hard cap five rounds. Early termination if 3+ statements die in their rounds (skip to synthesis with lone survivor). Stage failure if all four die — escalate to designer for full reframe.

**Rejected alternatives:**

- **Axis-alternating rounds (one axis per round)** — hides diagonal tensions, suppresses real argument; problems don't decompose linearly
- **All-four-active per round (no rotation)** — too much surface area, no forcing function for who advocates
- **Unstructured multi-agent debate** — no per-round closure, hard to bound or audit

### D3 — Agent consensus as convergence (no MCP)

Convergence = all four poles ratify in Round 5, or designer arbitrates dissent with logged reason. Honor system enforced by **transcript visibility** — cosmetic ratification surfaces in round transcripts (no real attacks, no real concessions, polite collapse). Lead is responsible for re-prompting poles to defend harder if shallow consensus suspected.

Validity tests run by lead before ratification closes (informational, not gating):

- **Structural:** falsifiable, specific, bounded, solution-free, generative
- **Grounding:** codebase / practitioner-friction / philosophy / industry — present or explicitly disclaimed (silence fails)
- **Survival:** four-pole ratification, reverse test, substitution test
- **Handoff:** necessary-conditions derivable, scope-bounded, Solve-time estimable

Designer can override any test failure with logged reason.

**Rejected alternatives:**

- **Framing Convergence MCP** — heavy, premature instrumentation; lightweight first matches `design-large-task` historical arc (Understand Stage went un-instrumented before Understanding MCP existed)
- **Quantitative agreement scores** — invite gaming; transcripts are already visible and auditable

### D4 — Three-section handoff artifact

The ratified output handed to Solve Stage:

1. **Problem statement** — single sentence, essential task to solve, solution-free language
2. **Consensus evidence** — organized by type (codebase / practitioner friction / philosophy / industry prior art), attributed to source pole; each type either populated or explicitly `*(none — disclaimed during debate)*`
3. **Exit criteria** — minimum testable properties any design must satisfy, or `*None derived during debate — Solve Stage has full design freedom.*`

Plus a **ratification block** listing per-pole signoff with logged dissent.

Solve Stage consumes: statement = the proof's claim; evidence = axioms; exit criteria = proof obligations / collapse tests.

**Rejected alternatives:**

- **Free-form handoff narrative** — unstructured input to Solve, hard to verify completeness
- **Multi-paragraph problem statement** — defers distillation discipline to Solve, dilutes the claim

### D5 — Composition: replace Phase 4 Understand Stage only

Step B (competitive interview) plugs in as a Phase 4 Understand Stage replacement. Phases 1–3 (Bootstrap, Parallel Context Exploration, Round One) unchanged. Phase 5 (Solve Stage) unchanged — it consumes the new three-section handoff artifact in place of the old saturation history.

**Rejected alternatives:**

- **New skill (`design-large-task-team`)** — heavier than needed; Step B is a stage swap, not a skill rewrite
- **Replace both Understand and Solve** — Solve's necessary-conditions proof machinery is well-tested; no reason to disturb

### D6 — Implementation home: `references/team-interview-flow.md`

Full Step B mechanics live in a references file inside `skills/design-large-task/references/team-interview-flow.md`, plugin-style (matching existing `classic-mcp-flow.md` and `architectural-mcp-flow.md`). `design-large-task/SKILL.md` gets a swap-line at the top selecting the active understanding flow:

```
ACTIVE_UNDERSTANDING_FLOW: classic | architectural | team-interview
```

Per-pole subagents follow Chester's named-subagent pattern in `agents/`:

- `agents/design-large-task-step-b-innovator.md`
- `agents/design-large-task-step-b-conservator.md`
- `agents/design-large-task-step-b-purist.md`
- `agents/design-large-task-step-b-pragmatist.md`

Lead orchestration (round structure, transcript generation, ratification gate) is the skill body — kept simple, no separate state file.

**Rejected alternatives:**

- **Inline flow in `SKILL.md`** — overgrows skill body; existing pattern is references-file-per-flow
- **Separate skill** — see D5 rejection

## Scope

### In scope

- New references file: `skills/design-large-task/references/team-interview-flow.md`
- Four pole subagent definitions in `agents/`
- Swap-line in `design-large-task/SKILL.md` to select the active understanding flow
- Process evidence schema for Step B (per-round transcripts + ratification block + validity-test outcomes)
- Three-section handoff artifact spec

### Out of scope

- **MCP for convergence tracking** — _not yet_: lightweight first; instrument only if pattern proves itself across multiple sprints
- **Modifying Solve Stage / Design Proof MCP** — _not needed_: Solve consumes the new handoff artifact unchanged; the Stage's internal machinery stays put
- **Modifying Phases 1–3** — _not needed_: team-interview replaces only Phase 4 Understand
- **`plan-build` / `execute-write` team-mode** — _not yet_: pattern could be revisited for review-phase skills if Step B succeeds, but separate scope and review-phase has different independence requirements
- **Migration of existing sprints** — _not needed_: classic flow remains supported; team-interview is opt-in via swap-line

## Constraints

- Must preserve single-voice rule for designer-facing turns _(structural — `util-design-partner-role`)_
- Must produce auditable per-round transcripts as process evidence _(structural — Chester evidence convention)_
- Must converge in bounded rounds; no unbounded debate _(structural — practical limit)_
- Must distinguish framing-phase rules from review-phase rules explicitly _(normative — derived from review-independence pattern in `docs/fork-policy.md`)_
- Subagent definitions follow existing `agents/{skill}-{role}.md` naming convention _(structural — plugin schema)_
- References file follows existing per-flow pattern (`{name}-mcp-flow.md` or `{name}-flow.md`) _(structural — `design-large-task` references convention)_

## Assumptions

- **"Multi-agent debate empirically improves LLM convergence in this context"** — UNTESTED in Chester. Du et al 2023 establishes pattern for general reasoning; first Chester deployment validates for problem-statement framing.
- **"Designer can read ~25-line debate transcripts per round without fatigue"** — UNTESTED. Cognitive-load estimate is informed (Lincoln-Douglas transcripts are roughly comparable) but not measured. Mitigation: optional `show debate` / `@pole explain` escape hatches if compression too aggressive.
- **"Agent consensus enforced by transcript visibility prevents cosmetic ratification"** — UNTESTED. Honor system relies on lead reliably detecting and re-prompting weak engagement. May need lead-side rules formalized if cosmetic ratification proves common.
- **"Subagent definitions in `agents/` work as both delegated subagents and (eventually) Agent Team teammates"** — UNTESTED across both invocation paths. For Step B initial implementation, subagent dispatch is sufficient; team-mode is a follow-on if `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` is enabled.

## Residual Risks

- **Polite collapse** — opposing poles agree without real attack despite Cartesian opposition. Mitigation: lead detects "no attack landed" per round and re-prompts pole to defend harder; process evidence flags affected rounds.
- **Stalled deadlock** — axis can't synthesize after rounds; designer arbitration needed. Mitigation: explicit escalation path with logged reason; deadlocked statements can carry into synthesis as "wounded" rather than forcing kill.
- **Token cost** — five rounds × four poles × subagent context windows may exceed budget for routine framings. Mitigation: opt-in via swap-line; classic flow remains the default until team-interview proves cost/value ratio.
- **Composition fragility** — if Solve Stage's necessary-conditions proof depends on Understanding MCP saturation history rather than just the design brief, swapping Step B may starve Solve of expected inputs. Verification needed: read Solve's actual evidence consumption before building.
- **Subagent context isolation** — fork policy requires named subagents for review-side dispatches because they must not inherit framing. Step B's poles intentionally inherit Phase 1–3 context (problem domain, prior art, codebase exploration). The fork-policy distinction holds (Step B is framing, not review), but worth documenting explicitly to prevent confusion.

## Acceptance Criteria

- `references/team-interview-flow.md` exists and is loadable as the active understanding flow via the swap-line in `design-large-task/SKILL.md`
- Four pole subagents exist in `agents/` following Chester's naming convention; each has a clear lens-specific system prompt
- A test sprint can run end-to-end: `design-large-task` with `ACTIVE_UNDERSTANDING_FLOW: team-interview` → ratified problem statement → `design-specify` → `plan-build`
- Per-round transcripts capture in process evidence per the schema in D3 (opening, attacks, counters, collapse, recommendation, ratification)
- Solve Stage consumes the three-section handoff artifact (statement / evidence / exit criteria) without modification to its existing machinery
- Single-voice rule remains intact: designer talks to one voice (lead) per turn; teammate voices are scaffolding only
- Classic flow still works unchanged when `ACTIVE_UNDERSTANDING_FLOW: classic` is selected
