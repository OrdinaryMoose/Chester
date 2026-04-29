# Team-Interview Understanding-Flow

**For:** `ACTIVE_UNDERSTANDING_MCP: team-interview`
**MCP server:** none (agent-consensus convergence; no MCP)
**Tools:** none (lead orchestrates pole subagents per the procedural steps below)

This file specifies the Phase 4 Understand-Stage replacement when the swap line in `SKILL.md` is set to `team-interview`. Load and follow this file's instructions whenever SKILL.md directs you to consult the active flow reference.

Unlike `classic-mcp-flow.md` and `problemfocused-mcp-flow.md`, this flow runs no MCP server. Convergence is achieved by agent consensus across four named pole subagents over five debate rounds.

## Round-Zero Initialization (executed once, before first designer-facing turn)

Run this exactly once, after Phase 3 completes and before the first designer-facing turn of Phase 4. Do not call `initialize_understanding` — team-interview runs no MCP server; convergence is by agent consensus across the four poles.

1. **Classify the task internally** as brownfield or greenfield. The classification informs how the lead weights codebase findings versus prior-art findings in the context packet, but does not change subsequent procedure.
2. **Build the Round-Zero context packet** by distilling Phase 1–3 outputs:
   - Problem domain (from Phase 1 — what the sprint is trying to solve, in domain language).
   - Prior-art findings (from Phase 2 — adjacent sprints, briefs, paused work, decisions that constrain this sprint).
   - Codebase exploration (from Phase 3 — files, types, runtime behaviors verified against the actual repository).
   - Framing + gap map (from Phase 3 — what is known versus what remains ambiguous).
3. **Freeze the packet** as the prompt prefix that every pole subagent receives in addition to its phase-specific instructions. The packet does not change between rounds; only the per-phase instructions and the prior-pole context (for sequential chains) vary.

The packet is the lead's working memory — keep it a focused brief, not a transcript dump. Poles must be able to argue from the packet without re-reading the entire conversation.

## Round Sequence

The flow runs five rounds. Each round explores the problem space from one lens; the fifth round consolidates and ratifies.

- **R1 — Innovator (N) opens.** N argues for the most ambitious problem framing the evidence supports. The other three poles oppose.
- **R2 — Conservator (S) opens.** S argues for the framing that least disturbs the existing system. The other three poles oppose.
- **R3 — Purist (E) opens.** E argues for the framing that most cleanly aligns with stated design philosophy. The other three poles oppose.
- **R4 — Pragmatist (W) opens.** W argues for the framing that best fits practitioner friction and delivery constraints. The other three poles oppose.
- **R5 — Synthesis.** No single opener. The lead drafts a consolidated problem statement merging surviving claims from R1–R4, then dispatches all four poles in parallel for synthesis attacks against the consolidated draft, applies revisions, and requests ratification.

The N→S→E→W rotation ensures each pole gets exactly one round to put its position on offense, and each pole spends three rounds on defense. R5 has no opener because the consolidated draft is the target, not a pole's claim.

## Per-Round Phases

Rounds R1–R4 each run five phases in strict order. The lead orchestrates; pole subagents are dispatched per phase. Phase 4 is lead-only (no subagent dispatch). R5 deviates per the Round 5 specifics below.

### Phase 1 — Opening argument

Lead dispatches the round's designated opener pole (R1=N, R2=S, R3=E, R4=W) with the Round-Zero context packet and an opener instruction. Opener returns a candidate problem statement (3–5 sentences) plus per-lens grounding (which packet bullets the statement rests on).

### Phase 2 — Opposing arguments (sequential chain)

Lead dispatches the three opposer poles in roster order (the three poles that are not the round's opener). This is a **sequential chain**, not parallel: each opposer's prompt contains the opener's actual statement plus all prior opposer statements from this round.

- **Opposer-1** receives only the opener's statement.
- **Opposer-2** (the second opposer) receives the opener's statement plus opposer-1's actual statement.
- **Opposer-3** (the third opposer) receives the opener's statement plus opposer-1 and opposer-2's actual statements.

Sequential chain dispatch is what prevents three opposers from independently making the same critique. Each pole sees the prior-chain content and is instructed to add new ground or sharpen disagreement, not duplicate.

### Phase 3 — Counter-arguments

Lead dispatches the opener pole again, this time with the full opposition chain attached. Opener produces one counter per opposer (concede / defend / revise) and a revised statement.

### Phase 4 — Idea collapse

Lead synthesizes the surviving statement from the opener's revisions and the opposition chain. **No subagent dispatch** — the lead writes directly into the transcript. This is the only phase where the lead works alone; it is also the phase most prone to lead-author drift, so the synthesis must cite which opposer concession or counter survives.

### Phase 5 — Recommendation

Lead writes the round status — `alive` / `wounded` / `dead` — and a one-paragraph rationale. Transcript section closed. Lead presents the closed transcript block in the designer-facing turn; designer responds with accept-and-continue (default), push-back (lead reopens specific point), or veto (skip to R5).

### Round 5 specifics — Synthesis

R5 is structurally different. Procedure:

1. Lead enumerates surviving candidates from R1–R4 (statements with status `alive` or `wounded`).
2. Lead drafts a consolidated problem statement merging surviving claims into a single sentence.
3. Lead dispatches **all four poles in parallel** for synthesis attacks against the consolidated draft. Parallel dispatch is correct here — and only here — because each pole attacks the same target and sharing prior-pole context would cause attack convergence rather than independent surfaces of attack.
4. Lead applies revisions to the consolidated draft if any attack lands.
5. Lead requests ratification from each pole: each returns `ratified` or `blocked: <reason>`.
6. If a pole blocks, one revision pass; if the block survives revision, designer arbitrates with logged reason.

### Orchestrator-side dispatch/completion printing

Per sprint **2026-03-31** (Subagent Progress Surface), every pole subagent dispatch in this flow must surface its dispatch and completion lines on the main screen via orchestrator-side printing — not buried in subagent output panels. The lead is the orchestrator for pole dispatches and is responsible for printing both lines.

- On dispatch, lead prints: `Dispatched: design-large-task-step-b-{pole}:R{N}-{phase}`.
- On completion, lead prints: `Completed: design-large-task-step-b-{pole}:R{N}-{phase}`.

This applies to every per-phase pole dispatch in R1–R4 (Phase 1 opener, Phase 2 sequential opposers, Phase 3 opener counter) and to the parallel synthesis attacks in R5. The completion line must follow each dispatch line so designers reading the main screen can correlate dispatch to completion without opening subagent panels.

## Transcript Schema

(content added in Task 5)

## Handoff Artifact

(content added in Task 4)

## Ratification

(content added in Task 4)

## Validity-Test Checklist

(content added in Task 5)

## Termination Rules

(content added in Task 5)

## Proof Seeding

(content added in Task 6)

## Brief-Render Read Shape

(content added in Task 6)

## Resume Protocol

(content added in Task 5)
