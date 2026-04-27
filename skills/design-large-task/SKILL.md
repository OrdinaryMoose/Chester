---
name: design-large-task
description: "Default structural design skill for architectural or multi-decision work. Five outer phases: Bootstrap, Parallel Context Exploration, Round One, Interview Loop, Closure. Inside the Interview Loop, an Understand Stage runs under an Understanding MCP (nine-dimension saturation scoring), then a Solve Stage runs under a Design Proof MCP (formal proof-building with structural validation around necessary conditions). Closure writes the design brief (the proof envelope) and hands off to design-specify, which owns architecture choice. Use when the task involves structural choices that need grounded design before implementation. For bounded edits where the target is clear, use design-small-task instead."
---

# Large-Task Design Discovery with Formal Proof Language

A two-stage design collaboration that separates **Understand** from **Solve**. The Understand Stage runs under an Understanding MCP that scores nine saturation dimensions each turn and signals when the problem is broadly enough understood to move on. The Solve Stage uses a Design Proof MCP that builds a formal proof structure around **necessary conditions** — things that must be true for the design to hold, each grounded in evidence or designer authority, each with a collapse test showing what breaks if removed. The two stages live inside the Interview Loop (outer Phase 4); the five outer phases (Bootstrap, Parallel Context Exploration, Round One, Interview Loop, Closure) sequence the skill end-to-end. The skill produces a design brief carrying the proof envelope and transitions to `design-specify`, which owns architecture choice. You contribute analysis and commentary; the designer shapes the direction. The machinery is invisible.

Understanding means correlating broadly — sweeping across the problem surface, mapping relationships between parts, discovering constraints, identifying where action is safe. Solving means thinking narrowly — following specific chains, working out process, figuring out the mechanics of change. The boundary between these two modes is the stage transition.

<HARD-GATE>
If there are open design questions, you MUST resolve them through this skill before proceeding. The Understand Stage is conversation only — do not write files, edit code, run commands, or scaffold anything while understanding is being built; the understanding MCP scores nine saturation dimensions each turn and tells you when the problem is broadly enough understood to move on. The proof MCP disciplines the Solve Stage — every design claim must be formally recorded and validated. Do not assume answers to design questions. Do NOT invoke any implementation skill, write any code, scaffold any project, or take any implementation action until the design is resolved and the user has approved it.
</HARD-GATE>

## Anti-Pattern Check

If you think this is too simple for discovery, check: are there design decisions embedded in this task that you're making implicitly? If yes, surface them. If the task is genuinely mechanical (rename, move, delete with no design choices), this skill doesn't apply.

## Checklist

You MUST create a task for each of these items and complete them in order:

1. **Bootstrap** — invoke `start-bootstrap` (handles config, sprint naming, dir creation, task reset, thinking history)
2. **Parallel context exploration** — dispatch 3 agents in parallel, each on a distinct corpus: 1 `feature-dev:code-explorer` for the codebase (similar features, architecture, extension points) + 1 `Explore` agent for prior sprint design artifacts + 1 `chester:design-large-task-industry-explorer` agent for industry patterns via WebSearch/WebFetch; read all identified files. All three are named subagents and never fork — exploration value depends on independent perspectives.
3. **Initialize understanding MCP** — call `initialize_understanding`, score the nine dimensions against explorer findings, call `submit_understanding` with the baseline. **No designer-facing turn is permitted until this step completes.**
4. **Round one presentation** — present framing and gap map only. No commentary, no "what do you think?" Ask the designer if they are ready to move into the Understand Stage. This is the first designer-facing turn; it is information transfer, not interview.
5. **Understand Stage** — designer confirms readiness; per-turn cycle under the understanding MCP begins on the next response: score nine saturation dimensions each turn, let the MCP's weakest-dimension signal drive topic selection
6. **Phase transition** — designer confirms understanding, `capture_thought()` with tag `understanding-confirmed` and stage `Transition`
7. **Proof phase** — present designer's verbatim problem statement for confirmation, initialize proof MCP, per-turn proof cycle with necessary conditions model
8. **Closing argument** — compose and present the closing argument; designer approval settles the proof
9. **Closure** — present completed design brief to designer for confirmation, write three artifacts (design brief, thinking summary, process evidence) to `design/`, invoke `util-worktree`, update lessons table, transition to design-specify

## Role: Design Partner

The shared voice rules — Interpreter Frame, read-aloud discipline, option-naming, self-evaluation, and stance principles — live in `util-design-partner-role`. **Read that skill before running this one.** The pieces below are the large-task-skill-specific additions.

- **Not an interview — a collaboration.** You contribute analysis; the designer shapes it. You are the student; the designer is Socrates. When you share your take, you are submitting your understanding for review.
- **Private precision via `capture_thought`.** Tag: `private-precision`. Stage: matches current stage (`Understand`, `Analysis`, `Synthesis`, etc.). Content: exact type names, property shapes, file paths, identifiers relevant to the current topic. Uncensored — drop every specific there; it never reaches the designer.

### Style Exemplar — What a Good Turn Sounds Like

Before the mechanics, the voice. A good turn reads like a strategist talking a peer through a design, over coffee, without a laptop open:

> **Observations**
>
> Alignment check. We've settled on the unified-diagnostic direction. Four emit sites still have no natural entity to anchor against — the build-summary, the strict-planning failure, and two infrastructure-layer import signals.
>
> Metacognitive reflection. The structural fork closed last turn. What remains is a cluster of smaller choices, all downstream of that commitment. The one with the widest blast radius is how to handle the anchorless sites — it shapes every producer.
>
> Direction signal. Naming the anchorless-subject call next.
>
> **Information Package**
>
> Current facts. The unified direction forces every emit site to produce a fully anchored shape. Four sites today have no natural anchor. One helper in the codebase already handles a similar situation by planting an empty marker in the anchor slot and carrying a descriptive label. No other pattern for this case exists today.
>
> Prior art. Every major compiler I looked at handles anchorless diagnostics the same way: they carry a sentinel inside the existing anchor shape rather than widening the set of shapes. They accept mild downstream ugliness for the anchorless case — a label that reads a little off — in exchange for keeping the shape discipline tight.
>
> Surface analysis. Two real options. First, reuse the existing anchored shape with an empty marker when no anchor exists — touches only the producer sites, no change to the shared contract. Second, introduce a third shape for system-level origins — small contract change, touches every downstream consumer that decides what to do with a shape.
>
> Alternate narrative. The sentinel approach produces a cosmetic wart at render time — the empty marker has to be hidden from display. Real but small. The new-shape approach has a different fragility: once a system-origin shape exists, producers drift into it whenever their situation feels inconvenient, and the discipline of anchoring to real concepts rots.
>
> **Commentary**
>
> My read: sentinel in the existing shape. Reasons — the pattern is already in the codebase for a similar case, the compiler literature consistently chooses it, and widening the shape set opens a drift channel. The cosmetic wart is a one-point fix at the render boundary. Naming each anchorless site with a descriptive label ("build", "planning", "infrastructure") preserves more semantic distinction than a single catch-all shape would.
>
> What do you think?

Notice what this turn does NOT contain: no type names, no file paths, no property lists, no `CamelCase`, no dots, no backticks, no sprint IDs, no "sum-type" / "variant" / "record" / "switch" / "pattern-match". Notice what it DOES contain: concepts ("anchorless subject"), shapes ("shared contract"), forces ("drift channel"), trade-offs ("small contract change vs. rot over time"), and opinion with reasons.

**If your turn doesn't sound like this, rewrite it before sending.** The exemplar is the standard, not the rules below.

---

## Phase 1: Bootstrap

Invoke `start-bootstrap`. This handles config reading, sprint naming, directory creation,
task reset, and thinking history initialization. After bootstrap, you have the sprint
subdirectory name and a prepared working directory. See `util-artifact-schema` for all
naming and path conventions.

After bootstrap completes, hold yourself to exploration-and-conversation discipline
through the Understand Stage: no file writes, no edits, no commands, no scaffolding. Read/Glob/Grep/Agent
are the only tools you need during understanding. The understanding MCP, initialized
during Round One, disciplines the Understand Stage from the other side — each turn you score the
nine saturation dimensions and the MCP reports which dimension is weakest, where the
largest gaps sit, and whether transition readiness has been reached. If you catch
yourself reaching for an edit during the Understand Stage, stop: the design is not yet ready to be
written.

---

## Phase 2: Parallel Context Exploration

Before your own deep exploration, dispatch three agents in parallel to build broad context quickly. Each agent owns a distinct corpus so their findings complement rather than overlap — one reads the codebase, one reads prior sprint artifacts, one reads the public web. Parallelism is only useful when the search spaces are disjoint; agents pointed at the same corpus reconverge on the same files and waste tokens.

### Codebase Explorer

Dispatch one `feature-dev:code-explorer` agent with a merged prompt covering three facets: similar features traced end-to-end, architecture and module boundaries in the relevant areas, and extension points, integration surfaces, and naming conventions for adding new capabilities.

Prompt guidance: "For [user's request], do three things in one pass. (1) Find existing features similar to the request and trace their implementations, patterns, and integration points end-to-end. (2) Map the high-level architecture and module boundaries in the areas the request touches. (3) Identify extension points, integration surfaces, naming conventions, and established patterns for adding new capabilities. Report an integrated analysis organized by these three facets, plus a consolidated list of 5–10 essential files worth reading."

### Prior Art Explorer

Dispatch one `Explore` agent to research previous sprint design artifacts. This agent searches both the plans directory (archived, tracked) and the working directory (in-progress, gitignored) for design briefs, specs, and thinking summaries from prior sprints that are relevant to the current request.

Prompt guidance: "Search `{CHESTER_PLANS_DIR}/` and `{CHESTER_WORKING_DIR}/` for design briefs (`*-design-*.md`), specs (`*-spec-*.md`), and thinking summaries (`*-thinking-*.md`) from previous sprints. For each artifact found that is relevant to [user's request]: read it and extract (1) key findings and discoveries, (2) decisions made that this design inherits or must respect, (3) current status (Approved, Paused, Draft, Superseded), (4) any infrastructure or system that was found to be non-functional, partial, or blocked. Report what you found organized by sprint, with brief name, status, and a summary of findings relevant to the current request. If no relevant prior art exists, state that explicitly."

The prior art explorer's findings inform the interview — discoveries from prior sprints (paused prerequisites, non-functional infrastructure, rejected approaches) should shape what questions you ask and what scope boundaries you propose.

### Industry Explorer

Dispatch one `chester:design-large-task-industry-explorer` agent. This is a named subagent — its system prompt and tool restrictions (`WebSearch`, `WebFetch`, `Read`, `Glob`, `Grep`) are loaded from its plugin definition. Named subagents never fork even when `CLAUDE_CODE_FORK_SUBAGENT=1` is enabled, so this exploration stays independent of the design conversation's framing.

The agent researches how others outside this codebase have approached the class of problem in the user's request — named patterns, common pitfalls, modes of failure — so the design conversation benefits from the broader field's experience rather than rediscovering known approaches internally.

Prompt guidance: "For [user's request], research how this class of problem is approached in the broader industry. Use WebSearch to find authoritative discussions (technical blogs, conference talks, well-regarded articles, standards documents, language/framework maintainer guidance). Use WebFetch to read the sources that look substantive. Report: (1) named patterns and approaches commonly used for this problem class, each with a one-paragraph description, (2) common pitfalls and modes of failure for each pattern, (3) the conditions under which each pattern tends to fail. Cite every claim with a source URL. Report patterns and tradeoffs, not recommendations — the designer will decide what fits. If the signal is thin (niche problem, obscure stack, nothing substantive found), say so explicitly rather than padding the report with low-confidence material."

The guardrail matters. Without it, web content smuggles in as authority and foreign patterns get grafted onto a codebase they don't suit. With it, external patterns stay as input the designer evaluates, not prescriptions the architect accepts. The industry explorer's findings feed the **Industry Context** section of the design brief (see [`references/design-brief-template.md`](references/design-brief-template.md)).

### After all explorers complete

Read every file the codebase explorer identified. Digest the prior art explorer's findings — these become your initial understanding of what adjacent design work has already established. Note the industry explorer's patterns and pitfalls — these sharpen the commentary you offer and the blind spots you probe. This pre-loaded context across three distinct corpora gives you grounded codebase knowledge, historical continuity, and comparative awareness before the conversation begins.

Scope-down guidance. All three explorers run by default. Skip an explorer only when its corpus is genuinely empty or inapplicable: skip the prior art explorer when this is the first sprint in a project (no `plans/` or `working/` content yet), skip the industry explorer when the task is Chester-internal tooling or a deeply proprietary domain where external signal is predictably thin. A "no relevant findings" result from an explorer is still useful information — don't skip preemptively. When in doubt, run all three.

<HARD-GATE>
**Your next action is `initialize_understanding`. Nothing else.**

Once all explorers complete, you are NOT permitted to:
- Write commentary to the designer
- Ask the designer any question
- Present observations, an information package, a gap map, or a "what do you think?"
- Do further exploration or read more files
- Mark the Parallel Context Exploration task complete and stop

You MUST call `initialize_understanding` and `submit_understanding` (with baseline scores across the nine dimensions) before any designer-facing turn. The MCP initialization is the gate between exploration and the conversation. No turn to the designer exists until the MCP is live.

If you catch yourself composing a turn without having called `initialize_understanding`, stop mid-compose, initialize the MCP, and only then build the Round One turn. This is the single most common failure mode of this skill — bypassing MCP init and falling into an informal conversation loop that never lights up the scoring machinery.

**Check before every turn in this phase:** has `initialize_understanding` been called this session? If no, that call is your next action. If yes, proceed with the Round One presentation per the steps below.
</HARD-GATE>

---

## Phase 3: Round One

Round one establishes the understanding baseline and hands the shared context to the designer. It is **information transfer only** — no commentary, no interview question, no "what do you think?" The interview begins in the Understand Stage, governed by the understanding MCP's per-turn scoring cycle. Round One exists so the designer enters that stage on the same page you are.

**Ordering is strict.** MCP initialization and baseline scoring happen *before* the first turn to the designer. The framing and gap map are the *output* of Round One. If the MCP is not initialized, you are not in Round One yet; you are still in the setup gate above.

**No interview in Round One.** Do not offer commentary on the weakest dimension. Do not ask the designer to react to your take. Do not probe any gap. Those are Understand Stage moves and require the scoring cycle to drive topic selection. Round One ends with a single ready-check question; the first real turn is the designer's first Understand Stage response.

1. Explore codebase for relevant context, building on what the explorers found. Classify **brownfield** (existing codebase target) vs **greenfield**. This classification is internal — do not present it to the user.
2. Initialize the understanding MCP. Call `initialize_understanding` with:
   - `user_prompt`: the user's initial request
   - `context_type`: greenfield or brownfield (from step 1)
   - `state_file`: `{CHESTER_WORKING_DIR}/{sprint-subdir}/design/{sprint-name}-understanding-state.json`

   The MCP returns the nine dimensions and their group structure (landscape, human_context, foundations).
3. Score the baseline. Assess each of the nine understanding dimensions against what the explorers and your exploration revealed. Most dimensions — especially stakeholder_impact, prior_art, temporal_context — will score near 0 because they require human input the codebase cannot supply. Call `submit_understanding` with `state_file` and the full `scores` object (each dimension keyed to `{score, justification, gap}`).
4. **Session Framing** — open the first designer-facing turn with orientation, before any analysis. Round One is a handoff moment: you've done private exploration (three parallel agents, baseline scoring), the designer has been waiting. Transfer context, do not assume it. The framing block contains:
   - **What we're working on** — one sentence naming the task in plain domain language.
   - **What decision space we're entering** — one or two sentences describing the shape of the problem you'll be exploring together, without pre-committing to a problem statement (that belongs to the Solve Stage).
   - **What I looked at** — two to three sentences summarizing the exploration: codebase areas read, prior sprint work consulted, industry patterns considered. Concept language, not file lists or explorer names.
   - **Where I landed** — one sentence previewing the shape of the gap map that follows.

   Plain conversational opener. No "alignment check" language yet — there is nothing to align to at Round One. The framing *builds* the shared model; subsequent turns align against it.

5. Present the gap map to the user (after framing):
   - **What the codebase reveals** — observations about the current system, its structure, patterns, and constraints. These are observations, not conclusions — not a problem statement, not a solution structure, and not a comprehensive analysis.
   - **What the prior art reveals** — observations about the designer's intent or vision of the architecture or system, lessons or applicable knowledge from previous sprints, and/or solutions tried before and discarded that may change our understanding of the problem. These are observations, not conclusions — not a problem statement, not a solution structure, and not a comprehensive analysis.
   - **What industry development reveals** — observations about current industry projects, research, or applicable information that can inform our development effort or illuminate elements of the design that we have not considered. These are observations, not conclusions — not a problem statement, not a solution structure, and not a comprehensive analysis.
   - **What the agent can't determine from code alone** — explicit gaps drawn from the understanding MCP's gap fields, grouped by dimension group (human_context, foundations).
6. **Ready check — no commentary.** After presenting the gap map, close the turn with a plain readiness prompt. Example wording: "That's the shared picture I have coming in. If it matches your sense of the ground, we can move into the Understand Stage — I'll start scoring what's understood each turn and pulling on the weakest thread. Ready to begin, or do you want to correct anything about the picture first?" No take on the weakest dimension. No "What do you think?" No probing question about any gap. The designer either confirms, corrects the picture, or adds context. Corrections loop back into the gap map presentation; confirmation moves to step 7.
7. `capture_thought()` with tag `understanding-baseline`, stage `Understand`.
8. On designer confirmation, announce: **Understand Stage begins.** The first per-turn scoring cycle runs on the designer's next response (or on their confirmation message itself, if it carries substantive new information).

---

## Phase 4: Interview Loop

### Two-Stage Interview Model

The interview splits into two sequential phases within a single session. the Understand Stage runs under the Understanding MCP (nine saturation dimensions, transition-readiness signal). the Solve Stage runs under the Design Proof MCP. They do not overlap.

```
Understand Stage
├── Goal: Deep shared understanding of the problem
├── Internal: Capture thinking → Score dimensions → Read MCP response → Choose topic → Select active lesson → Compose information package → Write commentary
├── Visible:  Observations → Information package → Commentary → "What do you think?"
├── Stopping criterion: Understanding dimensions broadly saturated (MCP reports transition_ready: true), conversation pulling vertical
├── Governed by: Understanding MCP (nine dimensions across three groups)
└── Constraint: No solutions, no problem statements, no design thinking

    ↓ Transition: Understanding confirmed by designer

Solve Stage
├── Goal: Grounded set of necessary conditions for the design
├── Opens with: Designer's verbatim problem statement → proof initialization
├── Internal: Capture thinking → Compose proof operations → Submit → Read response → Choose topic → Select active lesson
├── Visible:  Observations → Information package → Commentary → "What do you think?"
├── Closes with: Closing argument (reasoned argument from premises to conditions)
├── Stopping criterion: All conditions grounded, collapse-tested, and designer-approved
├── Governed by: Design Proof MCP (necessary conditions model, integrity validation)
└── Property: Naturally shorter because problem understanding constrains the space
```

Track which phase you are in based on whether `capture_thought()` with tag `understanding-confirmed` has been called. Before that thought is captured, you are in the Understand Stage. After, the Solve Stage.

### Per-Turn Lesson Injection

Each turn, before composing the information package, randomly select one lesson from the
top 5 highest-scoring entries in `~/.chester/thinking.md` (loaded during bootstrap). This
is the **active lesson** for the turn.

The active lesson does not override topic selection or force a specific commentary
register. Instead, it acts as a background lens:

- When composing the **information package**, consider whether the active lesson is
  relevant to the current topic. If it is, let it shape what you include in "surface
  analysis" or "uncomfortable truths" / "pessimist risks." If it isn't relevant to this
  turn's topic, ignore it — not every lesson applies every turn.
- When writing **commentary**, if the active lesson resonates with the design direction
  being discussed, weave that concern naturally into your take. The designer should never
  hear "our lessons say..." — they should hear the lesson's substance expressed as your
  present-tense observation about the design.

**Selection:** Rotate randomly so the same lesson doesn't repeat on consecutive turns.
If `thinking.md` has fewer than 5 entries, rotate through all of them. If it doesn't
exist or is empty, skip this step.

**Both stages:** Unlike the former Auditor (which only fired in the Solve Stage), lesson
injection runs in both the Understand Stage and the Solve Stage. Understand Stage commentary benefits
from historical patterns too — a lesson about scope expansion is relevant when exploring
the problem, not just when designing the solution.

### Understand Stage Per-Turn Flow

One cycle runs per user response. You are a single agent performing all roles: researcher, analyst, pessimist, and interviewer.

After each user response:

**Step 1: Capture thinking.**
If a trigger point is met, call `capture_thought`:
- New understanding emerges → tag: `understanding-[topic]`, stage: `Understand`
- Line of thinking shifts → tag by new topic, stage: `Analysis`
- User rejects or corrects → tag: `constraint` + topic, stage: `Constraint`
- Complex area with multiple facets → tag by topic, stage: `Analysis`

**Step 2: Score understanding dimensions.**
Assess each of the nine understanding dimensions on a 0.0–1.0 scale. For each dimension, determine:
- **Score**: how well understood this dimension is right now (0 = unknown, 1 = fully mapped)
- **Justification**: why this score — what evidence supports it (cannot be empty)
- **Gap**: what's still missing (cannot be empty if score < 0.9)

Call `submit_understanding` with:
- `state_file`: path to the understanding state file
- `scores`: all nine dimension scores with justifications and gaps

**Step 3: Read understanding response.**
The understanding MCP returns:
- `overall_saturation` — weighted average across all dimension groups
- `group_saturation` — per-group averages (landscape, human_context, foundations)
- `weakest_group` — the least-saturated group
- `weakest_dimension` — name and score of the dimension needing most attention
- `gaps_summary` — dimensions with the most substantive gaps
- `transition_ready` — whether all transition conditions are met
- `warnings` — any score-jump flags

**Step 4: Choose topic.**
Select what to address this turn using this priority (not discretionary):

1. **Score-jump warning** — if the understanding MCP flagged a score jump, re-examine that dimension
2. **Weakest dimension in least-saturated group** — the understanding MCP's reported target
3. **Largest gap** — the dimension with the most substantive gap description
4. **Coverage rotation** — next untouched dimension

**Step 5: Compose information package.**
Build the Understand Stage information package (see Information Package below). This is the primary deliverable of each turn — curated, altitude-appropriate material that fuels the designer's reasoning.

**Step 6: Write commentary.**
Based on the information package and what you've learned so far, share your take on the
topic. This is your genuine analysis — what you think is happening, what tensions you
see, what you suspect matters. Apply the Translation Gate.

In the Understand Stage, commentary must NOT propose or evaluate solutions. It should demonstrate
your understanding of the problem landscape: "Here's what I think is going on, and
here's what I'm not sure about."

End with **"What do you think?"** or a natural variant ("Does that match your sense
of it?", "Am I reading this right?", "What am I missing?"). The designer will correct
you, confirm you, or redirect you. All three are productive.

Before sending, verify C1 and C2 from `util-design-partner-role` — every load-bearing premise is visible in the information package; every Assumption and Opinion is marked.

**Step 7: Present to user.**
Before sending, run the Translation Gate checklist over every block you are about to output (observations, information package, commentary):
- No type names, class names, property names, method names, file paths, or module names
- No dimension names, scores, saturation levels, gap descriptors, or MCP mechanism names
- No JSON, code blocks, schema fragments, or tool call examples

If any slipped in, rewrite before sending. Then output observations block, then information package, then commentary with closing prompt.

### Understand Stage

**Goal:** Correlate broadly across the problem surface. Map relationships between parts, discover what's movable and what's fixed, identify where action is safe. Build deep shared understanding of the problem without jumping to solutions.

**Read-only discipline.** Do not write files, edit code, or run commands during the Understand Stage. Read/Glob/Grep/Agent are the only tools you need — exploration and conversation. Your output is conversation only. The understanding MCP disciplines the scoring side; the skill disciplines the edit side.

**Prohibited in the Understand Stage:**
- Solution proposals or option enumeration
- Design alternatives or trade-off analysis
- Architecture suggestions or structural recommendations
- "How might we..." framing (this is design thinking)
- Evaluative language about potential approaches
- Problem statements or problem framing artifacts
- Complete analyses or comprehensive summaries of the problem

**Stopping criterion:** The understanding MCP reports `transition_ready: true` and the conversation is pulling vertical — remaining topics are about specifics and implementation rather than understanding. The designer confirms this.

### Stage Transition

The boundary between Understand and Solve is marked by a **transition checkpoint**. The transition confirms shared understanding.

**Transition process:**
1. Understanding MCP reports `transition_ready: true`
2. Recognize that the conversation is pulling vertical (topics shifting from understanding to implementation detail)
3. Present a transition summary to the designer in domain language — what has been understood, any dimensions still below 0.5 translated into domain-language areas of residual uncertainty
4. Designer confirms understanding is sufficient
5. `capture_thought()` with tag `understanding-confirmed`, stage `Transition`
6. Frame the transition to the designer: "Understanding is established. We're moving from exploration to building the design proof. I'll record evidence from the codebase and propose necessary conditions — things that must be true for this design to hold. Each condition will be grounded in what we've found and what you've directed, with a test for what breaks if it's removed. You respond the same way — correct, confirm, redirect, or move on."
7. Announce the Solve Stage

### Solve Stage Opening

The Solve Stage opens with three steps before the proof-governed interview loop begins:

1. **Problem statement: polish, readback, confirm** — take what the designer said about the problem (they often type quickly and roughly), polish the language lightly for clarity and grammar without changing the meaning or adding your own framing. Read it back to the designer in clean form: "Here's how I'd capture the problem — [polished version]. Does that sound right?" The designer must explicitly approve before you proceed. Do NOT expand it into an analysis, add requirements, or prescribe solution characteristics. The problem statement describes the pain, not the solution. Context (codebase observations, architectural constraints) belongs in separate proof elements, not embedded in the problem statement.
2. **Initialize proof MCP** — call `initialize_proof` with:
   - `problem_statement`: the designer's confirmed (polished) problem statement
   - `state_file`: `{CHESTER_WORKING_DIR}/{sprint-subdir}/design/{sprint-name}-proof-state.json`
3. **Seed the proof** — call `submit_proof_update` with initial EVIDENCE elements (codebase facts discovered during the Understand Stage, source: "codebase") and RULE elements (designer-directed restrictions confirmed during the Understand Stage, source: "designer"). Do NOT create RULE or PERMISSION elements from your own analysis — only the designer can direct these.

### Solve Stage Per-Turn Flow

After each user response during the Solve Stage:

**Step 1: Read designer's response.**
Process what the designer said — confirmations, corrections, redirections, new information.

**Step 2: Capture thinking.**
If a trigger point is met, call `capture_thought`:
- Design direction established → tag by topic, stage: `Synthesis`
- Line of thinking shifts → tag by new topic, stage: `Analysis`
- User rejects or corrects → tag: `constraint` + topic, stage: `Constraint`
- Complex decision node (3+ viable options) → tag by topic, stage: `Analysis` or `Synthesis`

#### Invisible: Proof Machinery (Steps 3–5)

Steps 3–5 are your internal work. Nothing from these steps — element types, IDs, JSON structures, tool call formats, field names, integrity warning codes — appears in any output the designer sees. The designer sees only the human-language output from Steps 6–9.

**Step 3: Compose proof operations.**
Translate the conversation into formal proof operations. The MCP accepts these five element types directly — use these exact type names in `submit_proof_update` calls:

- **EVIDENCE** — codebase facts you discovered through research (source: "codebase"). Verifiable, mutable.
- **RULE** — designer-directed restrictions on the design space (source: "designer"). Only the designer can create these. Includes scope exclusions, architectural mandates, and design directives.
- **PERMISSION** — designer-directed relief from an existing restriction (source: "designer"). Only the designer can grant these. Must specify what restriction is being relaxed via `relieves`.
- **NECESSARY_CONDITION** — something that must be true for the design to hold. Each requires:
  - `grounding`: array of element IDs (at least one EVIDENCE, RULE, or PERMISSION)
  - `reasoning_chain`: IF [premises] THEN [this condition is necessary]
  - `collapse_test`: what breaks if this condition is removed
  - `rejected_alternatives`: (optional) what other conditions were considered instead
- **RISK** — identified hazards attached to specific conditions via `basis`

**Operations:**
- New codebase facts → add EVIDENCE elements
- Designer declarations/restrictions → add RULE elements (only when the designer directs)
- Designer relief from restrictions → add PERMISSION elements (only when the designer grants)
- Design conclusions with grounding → add NECESSARY_CONDITION elements
- Identified hazards → add RISK elements with basis pointing to relevant conditions
- Elements corrected by designer → revise operations with updated content
- Elements rejected by designer → withdraw operations

**Prohibition:** You must NOT create RULE or PERMISSION elements from your own analysis. These are designer-sourced only. If you believe a restriction exists, surface it in commentary and let the designer confirm it as a RULE.

**Step 4: Submit proof update.**
Call `submit_proof_update` with all operations batched in a single call. Include `challenge_used` if a challenge mode was delivered this turn.

**Step 5: Read proof response.**
The proof MCP returns integrity warnings, completeness metrics, challenge triggers, stall detection, and closure status. Use these to inform your topic choice and commentary — but never surface them in their raw form.

#### Visible: Designer-Facing Output (Steps 6–9)

Everything from here forward is what the designer sees. It must read like a colleague talking through the design — plain human language, no code, no structured data, no element references.

**Step 6: Choose topic.**
Select what to address this turn using this priority (not discretionary):

1. **Challenge mode trigger (MCP)** — if the proof MCP says Contrarian, Simplifier, or Ontologist is due, your next commentary IS the challenge
3. **Integrity warnings** — if the proof MCP reported structural anomalies, surface them (see Integrity Warning Surfacing)
4. **Foundational untested assumption** — if you identify an assumption whose falsity would collapse the design
5. **Codebase contradiction** — if exploration reveals something that directly contradicts the designer's stated intent
6. **Ungrounded conditions** — necessary conditions lacking designer authority or codebase evidence
7. **Coverage rotation** — next unaddressed area of the design space

**Step 7: Compose information package.**
Build the Solve Stage information package (see Information Package below).

**Step 8: Write commentary.**
Based on the information package and the design direction so far, share your take.
In the Solve Stage you have more freedom — you can evaluate trade-offs, recommend approaches,
name risks, and take a position on which direction fits best. Apply the Translation Gate.

Be opinionated. "I think the single-mechanism approach fits better here because..."
is more useful than "Here are two options, which do you prefer?" The designer can
push back, agree, or redirect. If you're uncertain, say so — "I could see this going
either way, but I lean toward X because..." is honest and still gives the designer
something to react to.

End with **"What do you think?"** or a natural variant.

Before sending, verify C1 and C2 from `util-design-partner-role` — every load-bearing premise is visible in the information package; every Assumption and Opinion is marked.

**Step 9: Present to user.**
Before sending, run the Translation Gate checklist over every block you are about to output (observations, information package, commentary):
- No type names, class names, property names, method names, file paths, or module names
- No element IDs, element type names (EVIDENCE, RULE, PERMISSION, NECESSARY_CONDITION, RISK), field names (grounding, collapse_test, reasoning_chain), integrity warning codes, or closure conditions
- No challenge mode names (Contrarian, Simplifier, Ontologist) or proof state references
- No JSON, code blocks, schema fragments, or tool call examples

If any slipped in, rewrite before sending. Then output observations block, then information package, then commentary with closing prompt.

### Integrity Warning Surfacing

When the proof MCP returns integrity warnings, surface them in the observations block translated to domain language. The designer never sees element IDs, proof terminology, or MCP internals.

| Warning type | Domain language |
|-------------|----------------|
| `withdrawn-grounding` | "One of our conditions rests on a premise we've since set aside." |
| `ungrounded-condition` | "A design requirement isn't grounded in anything we've established — it needs evidence or a designer directive to stand." |
| `missing-collapse-test` | "We're claiming something is necessary but haven't said what breaks if we remove it." |
| `stale-grounding` | "We revised a premise but haven't revisited the conditions that depend on it." |

Follow the translated warning with a brief explanation of which decision and which premise are involved, using domain concepts only.

### Solve Stage

**Goal:** Given the deeply understood problem, build a set of necessary conditions — grounded, justified design requirements with reasoning chains and collapse tests. The proof tracks what must be true for the design to hold, not the agent's internal bookkeeping.

**Stopping criterion:** Remaining questions are about *how to implement* rather than *what to build*. All necessary conditions are grounded in evidence or designer authority. The proof MCP confirms via `closure_permitted: true`.

**Length check:** the Solve Stage is naturally shorter than the Understand Stage because the deep problem understanding constrains the solution space. If the Solve Stage consumes more rounds than the Understand Stage, note this in process evidence as a signal that understanding may have been insufficient.

### Challenge Modes

Three modes, each triggered by the proof MCP during the Solve Stage.

| Mode | Trigger | Effect |
|------|---------|--------|
| Contrarian | Proof MCP: a necessary condition is grounded only in EVIDENCE with no RULE | Challenge the core premise — the agent is deriving design requirements from code alone without designer authority |
| Simplifier | Proof MCP: condition count grew by 2+ without consolidation | Probe whether all conditions are genuinely necessary — can some be consolidated or are they redundant? |
| Ontologist | Proof MCP: condition count unchanged for 3 consecutive rounds | Force essence-level reframing — the proof isn't evolving, are we asking the right question? |

When a challenge is triggered, your next commentary MUST be the challenge — it overrides normal topic selection. After delivering a challenge triggered by the proof MCP, report it via `challenge_used` in the next `submit_proof_update` call.

### Checkpoints (Every 5 Rounds)

Pause and summarize:
- What has been understood or resolved so far
- What remains open
- Where the conversation seems to be heading

All in domain language — no scores, gates, element IDs, or proof terminology.

Offer the user an exit opportunity, noting in domain terms which topics haven't been addressed and what that means for downstream work.

**Drift check (Solve Stage):** Compare the conversation trajectory against the confirmed problem statement. If the conversation has wandered, reorient your next commentary. If the problem statement itself was wrong, surface it to the designer.

---

## Visible Surface

### Observations Block (Before Commentary)

Three components, all italic single-sentence lines. Present under the heading "Observations":

1. **Alignment check** (1-2 sentences) — summarize your understanding of the current state so the designer can correct drift immediately.

2. **Metacognitive reflection** (1-2 sentences) — selected from rotating angles:
   - What did this response change about our understanding, and why does that matter?
   - What existing decision in the architecture does this touch or silently depend on?
   - What is the most fragile assumption in the current thinking?
   - Where does this sit uncomfortably against the current state of the system?
   - What is the single most important thing we still need to resolve?

3. **Direction signal** (1 sentence) — what topic you're addressing this turn and why it matters now.

4. **Integrity warnings** (Solve Stage only, when present) — translated domain-language warnings from the proof MCP (see Integrity Warning Surfacing).

### Information Package (After Observations, Before Commentary)

Each turn presents a curated information package between the observations and the commentary. The package delivers the facts; the commentary delivers your analysis. Target approximately **50% information package, 50% commentary** by content weight.

Every component passes through the Translation Gate — no type names, file paths, element IDs, or structured data in any component, regardless of its "expert-level factual" altitude. Altitude refers to conceptual depth, not vocabulary source.

Each component should be **2-3 sentences** — concise, not paragraphs.

**Understand Stage components:**

| Component | Purpose | Altitude |
|-----------|---------|----------|
| **Current facts** | What the system *means* right now about this topic — the concepts it carries, the roles parts play, the relationships between them | Domain concepts and roles, never type names, file paths, or property lists |
| **Prior art** | Is there prior art that applies to this situation | Informative, factual, not opinionated — described by what it *does*, not what it's *called* |
| **Surface analysis** | What's changing or under pressure in this area | Light touch, not exhaustive — stay at concept level |
| **Alternate narrative** | What's fragile, contradictory, or historically painful | Pessimist stance — name what others avoid, in design-level terms |

**Solve Stage components:**

| Component | Purpose | Altitude |
|-----------|---------|----------|
| **Current facts** | What the system *means* right now, relevant to this design topic — concepts, roles, relationships | Domain concepts and roles, never type names, file paths, or property lists |
| **Prior art** | Is there prior art that applies to this situation | Informative, factual, not opinionated — described by what it *does*, not what it's *called* |
| **Surface analysis** | What changes if we move in this direction | Light touch analysis of implications — concept-level, not file-level |
| **General options** | The solution space for this topic | Enough to see the landscape — describe each option by the *shape of the idea*, not by which classes it touches |
| **Pessimist risks** | What's fragile or uncomfortable about the emerging direction | Uncomfortable truths about the design, named as tensions between concepts |

The information package serves a dual purpose: **content delivery** (giving the designer the material they need to reason) and **altitude check** (forcing the agent to externalize its understanding each round). Because the package is visible to the designer, altitude mismatches are caught before they compound. If the agent presents "24 two-column junction tables need value columns" instead of "relationships in the system carry no data," the designer catches it immediately.

### Prohibited Content in All Designer-Visible Output

Applies to observations, information package, commentary, closing arguments, and checkpoint summaries — everything the designer sees.

- Dimension names or scores (surface_coverage, stakeholder_impact, saturation levels, weakest_dimension, etc.)
- Element IDs or proof terminology (EVIDENCE, RULE, PERMISSION, NECESSARY_CONDITION, RISK, grounding, collapse_test)
- Proof state references (closure_permitted, grounding_coverage, element counts)
- Understanding state references (transition_ready, group_saturation, gaps_summary)
- Challenge mode names (Contrarian, Simplifier, Ontologist)
- MCP mechanism references (submit_understanding, submit_proof_update, initialize_proof, initialize_understanding, integrity_warnings, etc.)
- Priority rule references

### Commentary Model

Each turn ends with commentary — your genuine take on the topic — followed by an
invitation for the designer to react. This replaces the traditional question-and-answer
model.

**Why commentary over questions:** The designer holds domain intent but doesn't hold
the codebase in their head. Questions that require codebase knowledge to answer put
the burden on the wrong person. Commentary lets you contribute your expertise (what
the code says, what the trade-offs are, what concerns you) and the designer contributes
theirs (what they actually want, what constraints you don't know about, where your
understanding is wrong).

**Commentary registers** — vary your approach based on what the turn needs:

- **Demonstrating understanding** — "Here's what I think is going on..." Show your
  model so the designer can correct it.
- **Surfacing tension** — "There's something uncomfortable here..." Name a conflict
  between what the designer wants and what the system currently does.
- **Taking a position** — "I think X fits better because..." Be opinionated. The
  designer will push back if you're wrong.
- **Admitting uncertainty** — "I could see this going either way..." Honest ambivalence
  is more useful than a forced question.
- **Flagging risk** — "The thing that worries me is..." Pessimist stance, contributed
  as a colleague's concern, not an interrogation.

**Closing prompt** — end with "What do you think?" or a natural variant. Keep it
short and open. The designer may confirm, correct, redirect, or ignore and move on.
All four responses are productive.

**Calibration signal:** if the designer is confirming everything without pushback, your
commentary may be too safe. Push harder — surface tensions, take less obvious positions,
name uncomfortable truths.

### Translation Gate

**This is a design conversation about concepts and architecture — not about structures and classes.** The designer is reasoning about what the system means and how its parts relate, not about which types exist or where files live. Every word of designer-visible output serves that frame.

Mandatory on every piece of designer-visible output — commentary, information packages, observations, the closing argument, and checkpoints:

1. **Strip all code vocabulary.** Type names, class names, interface names, enum names, property names, method names, file paths, namespace names, folder names, project names — remove them all. Use only domain concepts.
2. **Strip all proof vocabulary.** Element type names, element IDs, field names (grounding, collapse_test, reasoning_chain), integrity warning codes, closure conditions — remove them all. Translate the meaning into plain sentences.
3. **Strip all structured formatting.** No JSON, no code blocks, no schema fragments, no tool call examples, no `using` statements, no `.cs` / `.ts` / `.py` suffixes, no backticked identifiers. The designer sees prose, not data structures.
4. **Strip sprint/ticket identifiers from reasoning.** Refer to the work by its subject ("the kind-classification work", "the Solution-family rename") not its ID ("LBD-10", "LBD-12"). IDs may appear once in the alignment check if the designer used them; they should not drive the commentary.
5. **PM Litmus Test.** Imagine the product manager on this project. They are not a coder. They make decisions — they own the roadmap, requirements, and how success is measured. They understand the architecture at a high level, the product vision, and the end-state. They have never opened the codebase; they do not know its types, files, or internal wiring. They have not seen the proof system.

   Could this PM:
   - Follow every sentence of your output without stopping to ask what a term means?
   - Make an informed decision from what you've said?

   If either answer is no, translate further. The PM needs language that operates where decisions live — intent, architecture, trade-offs, risks — not where code lives.

#### Before/After Example

**Fails the gate** (leaks code, paths, file names, property lists):

> Current facts. `Story.Domain.Contracts/` exists with folders: `Diagnostics/`, `FieldPaths/`, `ServiceRead/`, `TransferObjects/`, `Validation/`. No `Entity/` folder yet — LBD-10 decision creates one. `TreeNodeDto` is consumer-tier shape: `Name` (display), `CanHaveChildren` (tree UI), `ParentEntityId` (navigation), `Order` (presentation). Only its `Kind` property touches the enum that's promoting.

Problems: seven type/folder names, five property names, namespace path, sprint ID, backticks, file-system vocabulary ("folders", "project"). Designer must hold the codebase in head to follow.

**Passes the gate** (same substance, translated to design level):

> Current facts. The domain-contract layer already carries several cross-tier concepts — diagnostics, field paths, read-side services, transfer shapes, validation — but no home yet for the kind-of-entity concept. The tree-node view model is a consumer-shaped presentation artifact: it carries display labels, a can-have-children flag, a parent reference, and an ordering hint. Only the kind field on that view model reaches into the concept we're promoting to cross-tier status.

Same information. No code vocabulary. Reads as colleague talk.

**Translation rules the example demonstrates:**
- `TreeNodeDto` → "the tree-node view model" (what it *is*, not what it's *called*)
- `CanHaveChildren`, `Order`, `Name`, `ParentEntityId` → "display labels, a can-have-children flag, a parent reference, an ordering hint" (describe roles, not identifiers)
- `Story.Domain.Contracts/Diagnostics/` etc. → "the domain-contract layer carries diagnostics, field paths..." (describe what the layer holds, not its path)
- `TreeNodeKind` enum → "the kind-of-entity concept" (concept, not type)
- `LBD-10 decision` → disappear; the decision itself is the subject

### Research Boundary

Code exploration is your private work.

- **Explore freely** — read as much code as you need to understand the design landscape
- **Digest internally** — convert findings into domain concepts, relationships, and tensions
- **Never relay raw findings** — type names, property shapes, class hierarchies, and implementation details do not appear in commentary, information packages, observations, or the design brief

If the designer needs a code-specific term to respond to your commentary, you have failed to translate. If an information package component or commentary contains type names or file paths, you have failed to translate.

### Structured Thinking Protocol

Use `capture_thought` / `get_thinking_summary` for positional retrieval against the U-shaped context attention curve.

**Capture triggers:**
1. Understanding baseline established → tag: `understanding-baseline`, stage: `Understand`
2. New understanding emerges → tag: `understanding-[topic]`, stage: `Understand`
3. Line of thinking changes → tag by new topic, stage: `Analysis`
4. User rejects or corrects → tag: `constraint` + topic, stage: `Constraint`
5. Complex decision node (3+ viable options) → tag by topic, stage: `Analysis` or `Synthesis`
6. Phase transition confirmed → tag: `understanding-confirmed`, stage: `Transition`
7. **Precision needs a home** → tag: `private-precision`, stage: matches current. Capture the specific type names, property shapes, file paths, and identifiers for the current topic. This slot is uncensored and never reaches the designer. Use it freely so the visible output stays concept-level.

**Retrieval triggers — call `get_thinking_summary` before:**
- The user asks for a recap or summary
- You are about to write the design brief (closure)
- You are about to make a recommendation that depends on earlier analysis

### Behavioral Constraints

- One topic per turn — don't cover three things at once
- When the designer's response contradicts your internal model, update the model — don't argue. Your commentary was wrong; acknowledge it and move on.
- Use the codebase to inform your commentary — don't ask the designer what you can look up
- **Implementation drift** — if your commentary involves where something should live, how it should be structured, or what pattern to use, you have drifted. Apply the Research Boundary and Translation Gate. Reframe toward intent.
- **Pessimist stance** — continuously evaluate whether the design has uncomfortable truths, unstated assumptions, or hidden complexity. Surface these through commentary, not interrogation.
- **Stage discipline** — in the Understand Stage, if you catch yourself proposing solutions, evaluating options, or composing a problem statement, stop. You are still understanding. Redirect your commentary to what you observe and what you don't yet understand about the problem.
- **Don't ask what you can answer** — if a question requires codebase knowledge to answer, answer it yourself in your commentary. Only invite the designer's reaction on things that require domain intent, business judgment, or priority calls.

---

## Safety Mechanisms

**Round cap:** 20 rounds total across both stages. At round 20, forced crystallization with residual risk notes listing unresolved open questions and unmet closure conditions in domain terms.

**Early exit:** After at least 3 rounds of the Solve Stage, the designer may exit at any checkpoint. Unmet closure conditions noted in domain terms. Residual risk recorded in the design brief.

**Checkpoints:** Every 5 rounds (total across both stages). Summarize what's been established, what remains open, where the conversation is heading. Domain language only — no element IDs, no proof terminology. Offer exit opportunity.

**Stall recovery:**
1. Ontologist fires (if available)
2. Ontologist already used → present a checkpoint: "We have open questions that aren't being addressed. Is the design genuinely ambiguous here, or are we missing the right topic?"

**Solve Stage length check:** If the Solve Stage consumes more rounds than the Understand Stage, note in process evidence as a signal that understanding may have been insufficient.

---

## Resume Protocol

If interrupted:
1. `get_thinking_summary()` — check for `understanding-confirmed` thought
2. If absent: the Understand Stage was active. Call `get_understanding_state` with the understanding state file path (`{CHESTER_WORKING_DIR}/{sprint-subdir}/design/{sprint-name}-understanding-state.json`) to reload dimension scores, group saturation, and gap status. Summarize current saturation in domain language and resume the per-turn scoring cycle. No writes or edits until the Solve Stage opens.
3. If present: the Solve Stage was active. Call `get_proof_state` with the proof state file path (`{CHESTER_WORKING_DIR}/{sprint-subdir}/design/{sprint-name}-proof-state.json`).
4. Summarize current proof state in domain language: "We were in round N. We've established [summary of key evidence and rules], built [N] necessary conditions, and have [summary of grounding status and any integrity warnings]. [Challenge modes used, if any]. Continuing."
5. Pick up from last completed round. Do not re-present prior turns.

---

## Closure Protocol

### When Thinking Recommends Closure

No candidate topic clears the materiality threshold — you have nothing left to say that would change the design. This applies to the Solve Stage — closure is not possible during the Understand Stage.

### Proof MCP Must Confirm

The proof MCP must return `closure_permitted: true`. This requires:
- All necessary conditions are grounded (each has EVIDENCE, RULE, or PERMISSION in its chain)
- Every condition has a collapse test
- At least one condition has rejected alternatives
- At least one element revised after designer interaction
- Minimum 3 rounds in the Solve Stage
- No active integrity warnings

If `closure_permitted: false`, the interview continues. Surface the reason in domain terms without referencing proof structure: "Some of our design requirements aren't grounded yet" or "We haven't explored alternatives for any of our conditions."

### Forced Crystallization

Round 20 hard cap. Total rounds across both stages, not per stage. Crystallize with residual risk notes describing which areas remain underspecified, in domain terms.

### Early Exit

After at least 3 rounds of the Solve Stage, the designer may exit at any checkpoint. Note unsatisfied conditions in domain terms. Record residual risk in the design brief.

### Stall Recovery

1. Stall detected → Ontologist fires (if available)
2. Ontologist already used → present a checkpoint asking whether the session is stuck because the design is genuinely ambiguous at this level, or because the commentary isn't reaching the right topic

---

## Phase 5: Closure

The Solve Stage ended when the designer approved the closing argument. Closure writes the design brief and supporting artifacts, creates the worktree, updates the lessons table, and hands off to `design-specify`. There is no architect comparison, no F-A-C, no hybrid recommendation, and no ground-truth subagent at this stage — `design-specify` owns architecture choice and `design-specify` runs its own ground-truth review against the spec automatically (skipped only for greenfield specs).

1. `get_thinking_summary()` to produce the consolidated decision history.
2. Reformat the thinking summary into a clean document. Hold in memory — written to disk in step 5.
3. Present the completed design brief to the user — each decision with conclusion and rationale. The Problem section contains the confirmed problem statement from Solve Stage opening.
4. Ask: "Does this capture what we're building?"
5. After confirmation, write the design brief, thinking summary, and process evidence to the `design/` subdirectory (see `util-artifact-schema` for naming and path conventions). Process evidence compiles from both state files: understanding MCP saturation history and gap evolution (Understand Stage); proof MCP interview profile, drift assessments, challenge mode firings, readiness gate satisfaction, closure decision (Solve Stage). Include **stage transition timing** and **Solve Stage length relative to the Understand Stage**. Human-readable narrative — stories, not scores.
6. Invoke `util-worktree` to create the branch and worktree. The branch name is the sprint subdirectory name. Design artifacts stay in the working directory — `finish-archive-artifacts` copies them into the worktree for merge later in the sprint.
7. Update `~/.chester/thinking.md` — review the Key Reasoning Shifts from the session. For each shift, determine whether it matches an existing lesson (increment score by 1) or is a new lesson (add with score 1, category `—`). If the table exceeds 20 rows, drop the lowest-scoring entry. Present proposed changes to the user and confirm before writing. If the file does not exist, create it with the table header and first entries.
8. Transition to `design-specify`.

### Artifacts Produced

Three artifacts in the `design/` subdirectory (see `util-artifact-schema` for naming
and path conventions). `finish-archive-artifacts` copies them into the worktree for
permanent history.

1. **Design brief** (`{sprint-name}-design-00.md`) — WHAT is being built and WHY the scope boundaries exist. Carries the proof envelope: problem statement, necessary conditions (with reasoning chains and collapse tests), rules, permissions, evidence foundation, risks, closing argument. Follow the structure in [`references/design-brief-template.md`](references/design-brief-template.md). Read that file before writing the brief. Architecture choice is *not* in this brief — `design-specify` produces it from the envelope.

2. **Thinking summary** (`{sprint-name}-thinking-00.md`) — HOW decisions were made. Domain language. Decision history, alternatives considered, user corrections, confidence levels, understanding shifts.

3. **Process evidence** (`{sprint-name}-process-00.md`) — HOW the interview operated. Human-readable narrative. Understanding dimension saturation over time, where the conversation pulled vertical, stage transition timing, challenge mode firings, how gates were satisfied, where drift was caught, Solve Stage length relative to the Understand Stage.

## Integration

- **Calls:** `start-bootstrap` (Bootstrap), `util-worktree` (Closure)
- **Dispatches (Parallel Context Exploration only):** 1 `feature-dev:code-explorer` (codebase) + 1 `Explore` agent (prior art) + 1 `chester:design-large-task-industry-explorer` agent (industry research). All three are named subagents — none fork. No subagent dispatch at Closure.
- **Uses:** `chester-understanding` MCP (Understand Stage), `chester-design-proof` MCP (Solve Stage), `capture_thought` / `get_thinking_summary` (throughout)
- **Reads:** `util-design-partner-role` (voice rules — read before running), `util-artifact-schema` (naming/paths), `references/design-brief-template.md` (brief output structure)
- **Invoked by:** user, as the default structural design skill
- **Transitions to:** `design-specify` (which dispatches architects against the brief, builds the spec, then transitions to `plan-build`)
- **Does NOT do:** architecture choice, F-A-C self-check, hybrid recommendation, ground-truth subagent dispatch — those live in `design-specify` against the spec layer.
