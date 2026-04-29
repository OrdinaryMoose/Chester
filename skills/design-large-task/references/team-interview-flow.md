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

Each round produces one transcript block, written progressively as the phases run. The block is the user-visible record presented in the designer-facing turn. Layout per round:

```
### Round {N} — Opener: {Pole} ({lens-letter})

**Opening argument** — {Pole}
<3–5 sentence candidate problem statement>
*Per-lens grounding:* <which Round-Zero packet bullets back this statement>

**Opposing arguments (sequential chain)**
- {Opposer-1 Pole}: <opposition statement>
- {Opposer-2 Pole}: <opposition statement; references opposer-1 prior-chain context>
- {Opposer-3 Pole}: <opposition statement; references opposer-1 + opposer-2 prior-chain context>

**Counter-arguments** — {Opener Pole}
- vs {Opposer-1}: concede | defend | revise — <reasoning>
- vs {Opposer-2}: concede | defend | revise — <reasoning>
- vs {Opposer-3}: concede | defend | revise — <reasoning>
*Revised statement:* <opener's revised candidate>

**Idea collapse** — Lead synthesis
<surviving statement after revisions; cite which opposer concession or counter survives>

**Recommendation** — {alive | wounded | dead}
<one-paragraph rationale>
```

R5 deviates: there is no opener, no per-round phase loop. R5 transcript records the consolidated draft, the four parallel synthesis attacks, lead's revisions, and the ratification block (per the Ratification section).

## Validity-Test Checklist

After R5 ratification, the lead runs the validity-test checklist against the consolidated problem statement. The checklist is **informational** — failures do not gate the handoff, but each failure is recorded in the transcript so the designer sees the quality flag. Designer can override any failure with a logged reason.

Four categories:

- **Structural** — falsifiable (states what changes when solved); specific (domain-grounded, not generic); bounded (named surface, no sprawl); solution-free (describes the problem, not the fix); generative (admits multiple design responses, not pre-chosen).
- **Grounding** — codebase grounding present-or-disclaimed; practitioner-friction present-or-disclaimed; philosophy present-or-disclaimed; industry prior art present-or-disclaimed. **Silence on a grounding type fails this test** — the handoff artifact must explicitly mark `*(none — disclaimed during debate)*` for empty categories rather than omit them.
- **Survival** — four-pole ratification (each pole returned `ratified` after at most one revision pass); reverse test (statement remains coherent if every clause is read with "would not change if we did nothing" — sniff-test that the problem actually exists); substitution test (statement remains valid if a key noun is replaced with its closest synonym — sniff-test that the framing isn't accidental jargon-pinning).
- **Handoff** — necessary-conditions derivable (the statement plus consensus evidence is enough that Solve Stage can derive at least one necessary-condition tag without re-interviewing); scope-bounded (Solve Stage will not need to reopen scope mid-design); Solve-time estimable (the team can sketch a sprint shape from the statement, not just a research project).

Result format: each test is a checklist item per category, written into the transcript at R5 close. Failures appear as `- [ ] <test name> — <one-line reason>`; passes appear as `- [x] <test name>`.

## Termination Rules

The flow runs at most five rounds. Termination paths:

- **Normal termination** — R1, R2, R3, R4, R5 each complete; R5 ratification succeeds (with at most one revision pass and at most one designer-arbitrated dissent). Handoff artifact is written and Phase 4 Solve Stage opens.
- **Early termination — skip to synthesis** — if **3 or more** of the R1–R4 statements end status `dead`, the lead skips remaining R1–R4 rounds and goes straight to R5 with the surviving candidate(s). The synthesis runs against whatever survived (alive or wounded); if only one candidate survived, R5 ratifies that candidate directly rather than merging.
- **Stage failure — all four dead** — if **all four** R1–R4 statements end `dead`, the lead reports "no problem statement survived debate" in the next designer-facing turn. **Escalate to designer** for full reframe: designer either rewrites the original sprint scope, accepts the finding (sprint paused), or directs a re-run of the round that came closest to surviving with adjusted poles or context.
- **Stalled deadlock at R5** — ratification still blocked after one revision pass; designer arbitrates per the Ratification section.

Termination decisions are recorded as a final transcript block (`### Termination — {path}`) with a one-paragraph rationale.

## Error Handling

Two procedural handlers are scoped to mid-flow recovery (additional handlers — stalled deadlock at R5, stage failure — live under Termination Rules and Ratification).

### Mid-chain failure recovery

If a pole subagent returns an error during a Phase 2 sequential chain dispatch:

1. Lead retries the failed pole **once** with the same chain context (opener statement plus prior opposer statements).
2. If the retry also fails, lead writes the failure into the transcript at the failed pole's slot, **skips the failed pole's opposition**, and continues to the next chain step. Subsequent opposers receive the prior-chain content they would have received minus the failed pole's contribution.
3. The Recommendation phase records `"chain partial"` as a quality flag in the round transcript. The flag is informational and does not gate progression.

### Polite-collapse re-prompt

If a round ends Phase 3 with **no real attacks landing** — every opposer produced an "agreed" or near-agreed statement; counter-arguments are all `concede` or `defend` with no `revise` — the lead detects polite collapse and applies one corrective re-prompt:

1. Lead re-prompts the **weakest opposer** (the one whose statement most closely tracked the opener) with a directive to defend its lens position from first principles and *not* respond to the opener.
2. The re-prompted statement replaces the original opposer-N entry in the chain, and Phase 3 counter-arguments are regenerated against the revised chain.
3. **One re-prompt per round.** If the re-prompt also produces a polite statement, the Recommendation phase marks the round as `"shallow"` and continues. Shallow rounds are flagged in the transcript so the designer sees that pole differentiation was weak in this round.

## Proof Seeding

When Phase 4 Solve Stage runs `submit_proof_update` with the seed call (per the **Solve Stage Opening — Seed the proof** step in `skills/design-large-task/SKILL.md`), the consensus evidence and exit criteria from the handoff artifact map onto proof MCP elements per the table below. The mapping is mechanical — Solve Stage applies it without re-interviewing.

| Handoff content | Proof element | `source` field |
|---|---|---|
| Codebase grounding bullets | EVIDENCE | `"codebase"` |
| Industry prior art bullets | EVIDENCE | `"industry"` |
| Practitioner friction bullets | EVIDENCE | `"friction"` |
| Philosophy bullets | RULE | `"designer"` |
| Exit Criteria | RULE | `"designer"` |
| Ratification dissent (logged blocks) | RISK | (basis-points to disputed clause) |

### Designer-authority rationale for RULE seeding

The proof MCP locks RULE elements to `source: "designer"` because RULEs encode designer-authorized restrictions on the design space. The **Element Types and Operations** section of `skills/design-large-task/SKILL.md` states: *"You must NOT create RULE or PERMISSION elements from your own analysis. These are designer-sourced only."*

Team-interview satisfies this constraint via the **Round 5 ratification block**: the designer's ratification of the consolidated problem statement — which includes the philosophy bullets and the exit criteria — IS the designer direction. The ratification block IS the designer-authority signal. Without a complete ratification block (per the Ratification section), Solve Stage refuses to seed philosophy bullets or exit criteria as RULEs.

### EVIDENCE source-field constraint

The proof MCP's EVIDENCE element accepts any non-null `source` string that is not `"designer"` (per `proof-mcp/proof.js:38-46` — there is no enum constraint). The values `"codebase"`, `"industry"`, and `"friction"` therefore pass without a fallback. RULE elements have `source` locked to `"designer"`; team-interview's seeding satisfies this via the ratification authority above.

### RISK seeding for ratification dissent

When the Ratification block records a designer-forced ratification over a pole's surviving dissent, the dissent maps to a RISK element. The RISK basis-points to the disputed clause in the consolidated problem statement, with the dissenting pole and reason recorded. Solve Stage uses RISK elements to surface known fragility into the design without blocking convergence.

## Brief-Render Read Shape

team-interview runs no MCP server, so there is **no understanding-state file** for Phase 5 Closure to read — the absence of `{sprint-name}-understanding-state.json` for team-interview sprints is by design, not by failure. Closure renders the design brief from a different read source.

### Read source

The Phase 5 Closure brief renderer reads the **process-evidence transcript** in place of an Understanding-MCP saturation history. The process-evidence transcript is written at Closure (not incrementally during the Understand Stage); it captures the full per-round transcript blocks (per Transcript Schema), the validity-test checklist results, the handoff artifact, and the ratification block.

### Render guidance

- **Thinking summary** — captures debate evolution per round. For each R1–R4 round, summarize opener pole, surviving statement, and round status (alive/wounded/dead). For R5, summarize the consolidated draft, synthesis attacks, revisions applied, and per-pole ratification outcomes.
- **Design brief** — frames the ratified consensus problem statement as the brief's problem section. Consensus evidence (the four-type bullets with source-pole attribution) feeds the brief's evidence section. Exit criteria become the brief's necessary-conditions or scope-bounds section. Any logged dissent (designer-forced ratification reasons) is captured verbatim under a "Known dissent" subsection so downstream readers see the unresolved contention.

The renderer must not silently drop the dissent log — designer-arbitrated ratification with logged dissent is signal Solve Stage and downstream skills depend on. If the dissent log is empty (all four poles ratified cleanly), the renderer may omit the "Known dissent" subsection.

## Resume Protocol

The flow runs no MCP server, so resume cannot read `get_understanding_state`. Recovery uses the `capture_thought` history written incrementally during the Understand Stage.

### Per-round capture (procedural)

At the close of each round's **Recommendation** phase (Phase 5 for R1–R4; the ratification close for R5), the lead writes a `capture_thought` entry summarizing the round:

- R1–R4 close: `capture_thought({ tag: "team-interview-r{N}-recommendation", stage: "Understand", content: "<opener pole>: <surviving statement>; status: <alive|wounded|dead>" })`.
- R5 ratification close: `capture_thought({ tag: "team-interview-r5-ratification", stage: "Understand", content: "<consolidated statement>; per-pole signoff: <ratification block>" })`.

These captures are incremental writes during Understand Stage — `capture_thought` is allowed during Understand (read-only discipline applies to the saturated-state surface, not to the thought log). They give Resume Protocol a recoverable trail without introducing a process-evidence file before Closure.

After R5 ratification, the lead also writes the standard `understanding-confirmed` capture with stage `Transition` — `capture_thought({ tag: "understanding-confirmed", stage: "Transition", content: "<one-line summary of the ratified problem statement>" })`. This is the marker `design-large-task/SKILL.md` Stage Transition logic uses to signal the Understand Stage is complete; without it, Solve Stage cannot open.

### Recovery procedure (when invoked)

When the lead resumes a stalled session and `ACTIVE_UNDERSTANDING_MCP` is `team-interview`:

1. Call `get_thinking_summary()` and filter for tags matching `team-interview-r{N}-*`.
2. If the most recent matching tag is `team-interview-r5-ratification` and an `understanding-confirmed` (stage `Transition`) tag also exists, the Understand Stage already completed — skip ahead to Phase 4 Solve Stage opening.
3. Otherwise the most recent `team-interview-r{N}-recommendation` tag identifies which round was last closed. Reconstruct debate state from the captured contents:
   - Opener pole and surviving statement per round.
   - Round status (alive / wounded / dead).
   - Whether the count of `dead` statements has reached the early-termination threshold (3+).
4. Lead writes a one-paragraph "current debate state" summary in domain language (which rounds completed, which statements survived, what the next round is) and presents it to the designer in the next designer-facing turn before resuming.
5. Resume the next round per the Per-Round Phases procedure. If the early-termination threshold is met (3+ dead among the captured rounds), proceed straight to R5 synthesis instead of the next R{N}.

The Resume Protocol does **not** read a process-evidence transcript file — that file is written only at Phase 5 Closure and does not exist during the Understand Stage. The `capture_thought` log is the sole resume surface.

## Handoff Artifact

After Round 5 ratifies, the lead constructs the handoff artifact. Format mirrors the three-section shape adopted in sprint **20260417-03** (Optimize Throughput) so downstream Solve Stage seeding is mechanical. Three sections, in this order:

### Problem Statement

A **single sentence** describing the essential task to solve. Constraints on phrasing:

- **Solution-free.** The sentence describes the problem, not how to fix it.
- **Falsifiable.** The sentence states what would change if the problem were solved, in language a reader can check.
- **Specific.** Domain-grounded; avoids generic verbs like "improve" or "optimize" without a measurable target.
- **Bounded.** Names the surface the design must address; does not sprawl into adjacent surfaces.

If the team cannot collapse to one sentence after R5, the lead reports stalled deadlock and designer arbitrates per the Termination Rules.

### Consensus Evidence

Evidence the four poles agree the problem statement rests on. Bullets are organized into **four evidence types**, each bullet **attributed to its source pole** (the pole whose round originated the evidence):

- **Codebase grounding** — verified facts about the existing system (files, types, runtime behaviors). Source: typically S (Conservator) or grounded by Phase 3 codebase findings.
- **Practitioner friction** — concrete frictions or observations from delivery and operation. Source: typically W (Pragmatist).
- **Philosophy** — design-philosophy clauses from Chester or the parent project that constrain the problem framing. Source: typically E (Purist), authorized by designer ratification.
- **Industry prior art** — patterns, named approaches, or external solutions relevant to the framing. Source: typically N (Innovator).

Each bullet uses the form: `- [{N|S|E|W}] <evidence statement>`. If a category produced no surviving bullets, the lead writes `*(none — disclaimed during debate)*` under that subheading rather than omitting it. Empty categories are signal, not noise — they indicate the team explicitly rejected that line of evidence.

### Exit Criteria

Testable properties any subsequent design must satisfy, derived from the consensus that emerged across rounds. Each criterion is one bullet, falsifiable, and bounded to design-time verification (not runtime). If the debate produced no exit criteria, write `*None derived during debate.*` under the heading rather than omitting it.

The handoff artifact is the entire interface to Phase 4 Solve Stage — Solve reads this in place of an Understanding-MCP saturation history.

## Ratification

After the handoff artifact is drafted, the lead requests ratification from each pole and records the result as a Ratification block beneath the three sections.

Format — one line per pole:

```
- N (Innovator): ratified
- S (Conservator): ratified
- E (Purist): blocked: <reason>
- W (Pragmatist): ratified
```

Ratification is binary per pole: `ratified` or `blocked: <reason>`. Procedure:

1. Lead dispatches each pole one final time with the consolidated problem statement plus the consensus evidence and exit criteria. Pole returns its ratification line.
2. If any pole returns `blocked`, the lead applies **one revision pass** — revises the consolidated statement (and evidence/criteria as needed) addressing the block reason, then re-requests ratification from the previously-blocking pole only.
3. If the block survives the one revision pass, the lead **escalates to designer**. Designer arbitrates: either rules in favor of the blocking pole (reopen with a new round, possibly killing the consolidated draft) or forces ratification with the dissent logged verbatim under the Ratification block as `*Designer-forced ratification over <pole> dissent: <reason>*`.

The ratification block — including any logged dissent — is the designer-authority signal that authorizes Solve Stage to seed philosophy bullets and exit criteria as RULE elements. Without a ratification block, the handoff artifact is incomplete and Solve Stage refuses to seed.

## Voice Discipline

Pole transcripts and the handoff artifact apply the voice-discipline conventions defined in `util-design-partner-role`. Two markers govern this flow:

- **C1 (Externalized Coverage)** — every load-bearing premise must be visible in the transcript. Pole arguments cannot rest on unstated reasoning; if a pole concedes, defends, or revises, the prior statement that the move references must be quoted or paraphrased explicitly. Phase 4 idea-collapse must cite which opposer concession or counter survives. The `source pole` attribution on consensus-evidence bullets is the C1 trail externalized into the handoff artifact.
- **C2 (Fact Default with Marked Departures)** — the default voice is fact (verified or grounded). Departures from fact are marked: `Assumption:` for working hypotheses the team does not have evidence for, `Opinion:` for stance-driven claims (typical in philosophy bullets and ratification dissent reasons). Ratification `blocked: <reason>` lines apply C2 — the reason must mark itself if it leans on Assumption or Opinion rather than verified Fact.

Both markers are normative for transcripts and for the handoff artifact. Designers reading the transcript should be able to follow the chain of premises (C1) and distinguish what is grounded from what is asserted (C2) without external context.
