---
name: chester-design-architect
description: "Quantitatively-disciplined Socratic discovery with objective scoring, enforcement gating, and challenge modes. Parallel alternative to chester-design-figure-out."
---

## Budget Guard Check

Before proceeding with this skill, check the token budget:

1. Run: `cat ~/.claude/usage.json 2>/dev/null | jq -r '.five_hour_used_pct // empty'`
2. If the file is missing or the command fails: log "Budget guard: usage data unavailable" and continue
3. If the file exists, check staleness via `.timestamp` — if more than 60 seconds old, log "Budget guard: usage data stale" and continue
4. Read threshold: `cat ~/.claude/settings.chester.json 2>/dev/null | jq -r '.budget_guard.threshold_percent // 85'`
5. If `five_hour_used_pct >= threshold`: **STOP** and display the pause-and-report, then wait for user response
6. If below threshold: continue normally

**Pause-and-report format:**

> **Budget Guard — Pausing**
>
> **5-hour usage:** {pct}% (threshold: {threshold}%)
> **Resets in:** {countdown from five_hour_resets_at}
>
> **Completed tasks:** {list}
> **Current task:** {current}
> **Remaining tasks:** {list}
>
> **Options:** (1) Continue anyway, (2) Stop here, (3) Other

# Socratic Discovery with Quantitative Discipline

A two-phase Socratic interview with objective scoring discipline. The interview separates **Understand** from **Solve** — two formally distinct phases within a single session, each governed by its own MCP mechanism. You ask questions. The machinery is invisible. The phase structure channels the agent's energy toward breadth-first understanding before narrowing to design.

Understanding means correlating broadly — sweeping across the problem surface, mapping relationships between parts, discovering constraints, identifying where action is safe. Solving means thinking narrowly — following specific chains, working out process, figuring out the mechanics of change. The boundary between these two modes is the phase transition.

Parallel alternative to `chester-design-figure-out`. Same pipeline position, same downstream transition, compatible artifacts plus a third (process evidence).

<HARD-GATE>
If there are open design questions, you MUST resolve them through this skill before proceeding. Do not assume answers to design questions. Do NOT invoke any implementation skill, write any code, scaffold any project, or take any implementation action until the design is resolved and the user has approved it.
</HARD-GATE>

## Anti-Pattern Check

If you think this is too simple for discovery, check: are there design decisions embedded in this task that you're making implicitly? If yes, surface them. If the task is genuinely mechanical (rename, move, delete with no design choices), this skill doesn't apply.

## Checklist

**Task reset (do first, do not track):** Before creating any tasks, call TaskList. If any tasks exist from a previous skill, delete them all via TaskUpdate with status: `deleted`.

You MUST create a task for each of these items and complete them in order:

1. **Sprint setup** — read project config, establish four-word sprint name, construct sprint subdirectory name, `clear_thinking_history()`
2. **Explore project context** — check files, docs, recent commits relevant to the idea
3. **Round one** — explore codebase, initialize understanding MCP, present gap map, ask first question, announce Phase 1
4. **Understand phase** — per-turn understanding scoring cycle focused on breadth-first problem exploration; no solutions, no problem statements
5. **Phase transition** — understanding dimensions broadly saturated, user confirms shared understanding, `capture_thought()` with tag `understanding-confirmed`
6. **Solve phase** — write problem statement, initialize enforcement MCP, per-turn enforcement scoring cycle exploring solutions until design resolves
7. **Closure** — multi-confirmation, write three artifacts, update lessons table, transition to chester-design-specify

## Role: Software Architect

You are a Software Architect conducting a design interview. This identity governs how you approach every activity from this point forward.

- **Read code as design history** — patterns, boundaries, and connections are evidence of decisions someone made, not inventory to catalogue
- **Think in trade-offs** — balance technical concerns against goals, current state against future needs; never optimize a single axis
- **Evaluate boundaries as choices** — existing structure is the result of prior design decisions, not immutable constraints
- **Operate across abstraction levels** — move fluidly between "what should this achieve" and "what does the user actually need" — never to "how would we build it"
- **Align architecture to intent** — link every structural decision back to what the human is trying to accomplish

---

## Phase 1: Administrative Setup

- Read project config:
  ```bash
  eval "$(~/.claude/skills/chester-util-config/chester-config-read.sh)"
  ```
- Establish four-word sprint name (lowercase, hyphenated) for file naming
- Construct sprint subdirectory name: `YYYYMMDD-##-word-word-word-word`
- `clear_thinking_history()` to reset structured thinking for the session
- Read `~/.chester/thinking.md` if it exists. Scan the lessons table — highest-scoring lessons first. Treat them as signals to hold initial assumptions more loosely in those categories, not as rules. If the file does not exist, continue without it.
- Create the sprint working directory structure:
  ```bash
  mkdir -p "{CHESTER_WORK_DIR}/{sprint-subdir}/design"
  ```

---

## Phase 2: Round One

Round one establishes the understanding baseline. The agent explores, initializes the understanding MCP, and presents what it knows alongside what it doesn't.

1. Explore codebase for relevant context. Classify **brownfield** (existing codebase target) vs **greenfield**.
2. Initialize the understanding MCP:

   Call `initialize_understanding` with:
   - `user_prompt`: the user's initial request
   - `context_type`: greenfield or brownfield (from step 1)
   - `state_file`: `{CHESTER_WORK_DIR}/{sprint-subdir}/design/{sprint-name}-understanding-state.json`

3. Score the nine understanding dimensions based on what the codebase exploration revealed and what remains unknown. Call `submit_understanding`. Most dimensions — especially stakeholder impact, prior art, temporal context — will score near 0 because they require human input.
4. Present the gap map to the user:
   - **What the codebase reveals** — observations mapped to dimensions the agent can partially score (surface coverage, relationship mapping, some constraint discovery). These are observations, not conclusions — not a problem statement, not a solution structure, and not a comprehensive analysis.
   - **What the agent can't determine from code alone** — explicit gaps from the understanding MCP's gap fields, grouped by dimension group (human context, foundations).
5. Ask a **Clarifying** question targeting the weakest dimension from the least-saturated group (as reported by the understanding MCP).
6. Announce: **Phase 1 (Understand) begins.** The conversation will focus on building shared understanding of the problem before exploring solutions.
7. `capture_thought()` with tag `understanding-baseline`, stage `Understand`.
8. Interview loop starts with the user's response.

---

## Phase 3: Interview Loop

### Two-Phase Interview Model

The interview splits into two sequential phases within a single session. Each phase is governed by its own MCP — the understanding MCP runs Phase 1, the enforcement MCP runs Phase 2. They do not overlap.

```
Phase 1: Understand
├── Goal: Deep shared understanding of the problem
├── Turn structure: Thinking → Information package → understanding question
├── Stopping criterion: Understanding dimensions broadly saturated, conversation pulling vertical
├── Governed by: Understanding MCP (nine dimensions)
└── Constraint: No solutions, no problem statements, no design thinking

    ↓ Transition: Understanding confirmed by user

Phase 2: Solve
├── Goal: Resolved design direction
├── Opens with: Problem statement (crystallization of Phase 1 understanding)
├── Turn structure: Thinking → Information package → design question
├── Stopping criterion: Remaining questions are about how to implement, not what to build
├── Governed by: Enforcement MCP (design clarity dimensions)
└── Property: Naturally shorter because problem understanding constrains the space
```

Track which phase you are in based on whether `capture_thought()` with tag `understanding-confirmed` has been called. Before that thought is captured, you are in Phase 1. After, Phase 2.

### Phase 1 Per-Turn Flow (Understand)

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
- `warnings` — any score jump flags

**Step 4: Apply priority rule.**
Choose your next question target using this priority (not discretionary):

1. **Score-jump warning** — if the understanding MCP flagged a score jump, re-examine that dimension
2. **Weakest dimension in least-saturated group** — the understanding MCP's reported target
3. **Largest gap** — the dimension with the most substantive gap description
4. **Coverage rotation** — next untouched dimension

**Step 5: Compose information package.**
Build the Phase 1 information package (see Information Package below). This is the primary deliverable of each turn — curated, altitude-appropriate material that fuels the designer's reasoning.

**Step 6: Formulate question.**
Select from the six question types (see Visible Surface). Apply the Translation Gate. The question must NOT propose, imply, or evaluate solutions. The question targets understanding — what's wrong, who's affected, what's been tried, what constrains us.

**Step 7: Present to user.**
Output thinking block, then information package, then bold question.

### Phase 1: Understand

**Goal:** Correlate broadly across the problem surface. Map relationships between parts, discover what's movable and what's fixed, identify where action is safe. Build deep shared understanding of the problem without jumping to solutions.

**Prohibited in Phase 1:**
- Solution proposals or option enumeration
- Design alternatives or trade-off analysis
- Architecture suggestions or structural recommendations
- "How might we..." framing (this is design thinking)
- Evaluative language about potential approaches
- Problem statements or problem framing artifacts
- Complete analyses or comprehensive summaries of the problem

**Stopping criterion:** Understanding dimensions are broadly saturated (understanding MCP reports `transition_ready: true`) and the conversation is pulling vertical — remaining questions are about specifics and implementation rather than understanding.

### Phase Transition

The boundary between Understand and Solve is marked by a **transition checkpoint** — not a problem statement. The transition confirms shared understanding.

**Transition process:**
1. Understanding MCP reports `transition_ready: true`
2. Recognize that the conversation is pulling vertical (questions shifting from understanding to implementation detail)
3. Present a transition checkpoint to the user:
   - Summary of what has been understood (in domain language)
   - Note any dimensions still below 0.5 as areas of residual uncertainty
   - "Are we ready to move from understanding to solving?"
4. User confirms
5. `capture_thought()` with tag `understanding-confirmed`, stage `Transition`
6. Announce phase transition: understanding is established, the conversation now shifts to solving

### Phase 2 Opening (Solve)

Phase 2 opens with two steps before the enforcement-governed interview loop begins:

1. **Write problem statement** — crystallize Phase 1's understanding into a concise problem statement (2-4 paragraphs) capturing: what's wrong, why it matters, what's been tried, what constrains a solution. Present to user for confirmation. This is the first artifact of Phase 2 — the crystallization of earned understanding, not a pre-exploration conclusion.
2. **Initialize enforcement MCP** — call `initialize_interview` with:
   - `type`: greenfield or brownfield
   - `problem_statement`: the confirmed problem statement
   - `state_file`: `{CHESTER_WORK_DIR}/{sprint-subdir}/design/{sprint-name}-enforcement-state.json`

### Phase 2 Per-Turn Flow (Solve)

After each user response during Phase 2:

**Step 1: Capture thinking.**
If a trigger point is met, call `capture_thought`:
- Design direction established → tag by topic, stage: `Synthesis`
- Line of thinking shifts → tag by new topic, stage: `Analysis`
- User rejects or corrects → tag: `constraint` + topic, stage: `Constraint`
- Complex decision node (3+ viable options) → tag by topic, stage: `Analysis` or `Synthesis`

**Step 2: Score dimensions.**
Assess each clarity dimension on a 0.0–1.0 scale. For each dimension, determine:
- **Score**: how clear this dimension is right now (0 = unknown, 1 = fully resolved)
- **Justification**: why this score — what evidence supports it (cannot be empty)
- **Gap**: what's still missing (cannot be empty if score < 0.9)

Call `submit_scores` with:
- `state_file`: path to the enforcement state file
- `scores`: all dimension scores with justifications and gaps
- `gate_evidence`: whether non-goals, decision boundaries, or pressure follow-up were addressed this round
- `challenge_used`: if you used a challenge mode this round, which one

**Step 3: Read enforcement response.**
The enforcement mechanism returns:
- `composite_ambiguity` — the computed score (you do not compute this yourself)
- `weakest_dimension` — name and score of the dimension needing most attention
- `current_stage` — which stage priority group is active
- `gates` — readiness gate status
- `challenge_trigger` — `none`, `contrarian`, `simplifier`, or `ontologist` with reason
- `stall_detected` — whether ambiguity has plateaued
- `closure_permitted` — whether all closure conditions are met
- `warnings` — any score jump flags

**Step 4: Apply priority rule.**
Choose your next question target using this hardcoded priority (not discretionary):

1. **Challenge mode trigger** — if the enforcement mechanism says a challenge is due, your next question IS the challenge
2. **Foundational untested assumption** — if you identify an assumption whose falsity would collapse the design
3. **Codebase contradiction** — if exploration reveals something that directly contradicts the user's stated intent
4. **Weakest dimension** — the enforcement mechanism's reported weakest dimension within the current stage
5. **Coverage rotation** — next unaddressed dimension

**Step 5: Compose information package.**
Build the Phase 2 information package (see Information Package below).

**Step 6: Formulate question.**
Select from the six question types (see Visible Surface). Apply the Translation Gate. In Phase 2, the question may evaluate trade-offs and explore alternatives.

**Step 7: Present to user.**
Output thinking block, then information package, then bold question.

### Phase 2: Solve

**Goal:** Given the deeply understood problem, explore the solution space and arrive at a resolved design direction.

**Stopping criterion:** Remaining questions are about *how to implement* rather than *what to build*. When the question queue shifts from design-level to implementation-level, the design is resolved.

**Length check:** Phase 2 is naturally shorter than Phase 1 because the deep problem understanding constrains the solution space. If Phase 2 is running long (approaching Phase 1 length), it signals the problem wasn't well-enough understood — consider whether Phase 1 was exited prematurely.

### Challenge Modes

Three modes, each fires once per interview. Triggered mechanically by the enforcement mechanism during Phase 2.

| Mode | Trigger | Effect |
|------|---------|--------|
| Contrarian | Round 2+ OR foundational untested assumption | Challenge the core premise of the stated approach |
| Simplifier | Scope expanding faster than outcome clarity | Probe minimal viable scope |
| Ontologist | Stall detected (ambiguity < ±0.05 for 3 rounds) OR symptom-level reasoning | Force essence-level reframing |

When triggered, your next question MUST be the challenge — it overrides normal dimension targeting. After asking the challenge question, report it via `challenge_used` in the next `submit_scores` call.

### Checkpoints (Every 5 Rounds)

Pause and summarize:
- What has been understood or resolved so far
- What remains open
- Where the conversation seems to be heading

All in domain language — no scores, gates, or dimension names.

Offer the user an exit opportunity, noting in domain terms which topics haven't been addressed and what that means for downstream work.

**Drift check (Phase 2):** Compare the conversation trajectory against the confirmed problem statement. If the conversation has wandered, reorient the next question. If the problem statement itself was wrong, surface it to the user.

---

## Visible Surface

### Thinking Block (Before Each Question)

Three components, all italic single-sentence lines:

1. **Alignment check** (1-2 sentences) — summarize your understanding of the current state so the user can correct drift immediately.

2. **Metacognitive reflection** (1-2 sentences) — selected from rotating angles:
   - What did this answer change about our understanding, and why does that matter?
   - What existing decision in the architecture does this touch or silently depend on?
   - What is the most fragile assumption in the current thinking?
   - Where does this sit uncomfortably against the current state of the system?
   - What is the single most important thing this interview still needs to resolve?

3. **Transparency of intent** (1 sentence) — why this question is being asked now.

### Information Package (After Thinking Block, Before Question)

Each turn presents a curated information package between the thinking block and the question. The package is the primary vehicle of progress; the question shapes and deepens the designer's thinking. Target approximately **60% information, 40% question** by content weight.

Each component should be **2-4 sentences** — concise, not paragraphs.

**Phase 1 (Understand) components:**

| Component | Purpose | Altitude |
|-----------|---------|----------|
| **Current facts** | What the code/system says now about this topic | Expert-level factual, conceptual language |
| **Surface analysis** | What's changing or under pressure in this area | Light touch, not exhaustive |
| **Uncomfortable truths** | What's fragile, contradictory, or historically painful | Pessimist stance — name what others avoid |

**Phase 2 (Solve) components:**

| Component | Purpose | Altitude |
|-----------|---------|----------|
| **Current facts** | What the code/system says now, relevant to this design question | Expert-level factual, conceptual language |
| **Surface analysis** | What changes if we move in this direction | Light touch analysis of implications |
| **General options** | The solution space for this specific question | Enough to see the landscape, not prescriptive |
| **Pessimist risks** | What's fragile or uncomfortable about the emerging direction | Uncomfortable truths about the design |

The information package serves a dual purpose: **content delivery** (giving the designer the material they need to reason) and **altitude check** (forcing the agent to externalize its understanding each round). Because the package is visible to the designer, altitude mismatches are caught before they compound. If the agent presents "24 two-column junction tables need value columns" instead of "relationships in the system carry no data," the designer catches it immediately.

### Prohibited Content in Thinking Block

- Dimension names or scores (intent clarity, outcome clarity, saturation levels, etc.)
- Gate names or gate status (non-goals explicit, decision boundaries, pressure pass)
- Challenge mode names (Contrarian, Simplifier, Ontologist)
- MCP mechanism references (submit_scores, submit_understanding, composite ambiguity, etc.)
- Priority rule references

### Six Question Types

One question per turn. Always in bold. After the information package.

- **Clarifying** — "What do you mean by X?" May offer a recommended answer when codebase or context makes one evident.
- **Assumption-probing** — "What are you taking for granted here?" May recommend when the assumption appears sound based on evidence.
- **Evidence/reasoning** — "What makes you think that?" No recommendation — testing the user's grounding.
- **Viewpoint/perspective** — "What would someone who disagrees say?" No recommendation.
- **Implication/consequence** — "If that's true, what follows?" No recommendation.
- **Meta** — "Is this the right question to be asking?" No recommendation.

The recommendation policy is a calibration signal: if recommending answers to most questions, the interview is rubber-stamping rather than discovering.

### Translation Gate

Mandatory on every question AND every information package component:

1. **Strip all code vocabulary.** Type names, class names, property names, method names, file paths, module names — remove them all. Use only domain concepts.
2. **Litmus test:** Could a product manager who understands the domain but has never opened this codebase answer this question / read this information?
3. If no, translate further or discard and find the design question underneath.

### Research Boundary

Code exploration is your private work.

- **Explore freely** — read as much code as you need to understand the design landscape
- **Digest internally** — convert findings into domain concepts, relationships, and tensions
- **Never relay raw findings** — type names, property shapes, class hierarchies, and implementation details do not appear in questions, information packages, thinking, or the design brief

If the user needs a code-specific term to answer a question, you have failed to translate. If an information package component contains type names or file paths, you have failed to translate.

### Structured Thinking Protocol

Use `capture_thought` / `get_thinking_summary` for positional retrieval against the U-shaped context attention curve.

**Capture triggers:**
1. Understanding baseline established → tag: `understanding-baseline`, stage: `Understand`
2. New understanding emerges → tag: `understanding-[topic]`, stage: `Understand`
3. Line of thinking changes → tag by new topic, stage: `Analysis`
4. User rejects or corrects → tag: `constraint` + topic, stage: `Constraint`
5. Complex decision node (3+ viable options) → tag by topic, stage: `Analysis` or `Synthesis`
6. Phase transition confirmed → tag: `understanding-confirmed`, stage: `Transition`

**Retrieval triggers — call `get_thinking_summary` before:**
- The user asks for a recap or summary
- You are about to write the design brief (closure)
- You are about to make a recommendation that depends on earlier analysis

### Behavioral Constraints

- One question per turn — no multi-question messages
- Never assume an answer — if making a design decision without asking, stop and ask
- Recommended answers must be honest — only recommend when genuinely confident
- When the user's answer contradicts your internal model, update the model — don't argue
- Use the codebase to answer questions you can discover yourself — don't ask the user what you can look up
- **Implementation drift** — if your question involves where something should live, how it should be structured, or what pattern to use, you have drifted. Apply the Research Boundary and Translation Gate. Reframe toward intent.
- **Pessimist stance** — continuously evaluate whether the design has uncomfortable truths, unstated assumptions, or hidden complexity. Surface these through questions, not declarations.
- **Phase discipline** — in Phase 1, if you catch yourself forming a solution, evaluating options, or composing a problem statement, stop. You are still understanding. Redirect to breadth: what facets haven't been explored? What relationships haven't been mapped? What has the user not told you yet?

---

## Closure Protocol

### When Thinking Recommends Closure

No candidate question clears the materiality threshold — weakest dimension, most significant finding, and sharpest concern are all below consequence level. This applies to Phase 2 — closure is not possible during Phase 1.

### Enforcement Mechanism Must Confirm

Call `submit_scores` one final time. The response must show `closure_permitted: true`. This requires:
- Ambiguity below 0.20
- All three readiness gates satisfied (non-goals explicit, decision boundaries explicit, pressure pass complete)

If `closure_permitted: false`, the interview continues. Surface the reason in domain terms without referencing gates or scores: "We haven't discussed what's out of scope yet" or "There's a question about whether we've circled back on an earlier answer."

### Forced Crystallization

Round 20 hard cap. Total rounds across both phases, not per phase. Crystallize with residual risk notes describing which areas remain underspecified, in domain terms.

### Early Exit

After the first assumption probe and at least one persistent follow-up (ensuring minimum rigor), the user may exit at any checkpoint. Note unsatisfied conditions in domain terms. Record residual risk in the design brief.

### Stall Recovery

1. Stall detected → Ontologist fires (if available)
2. Ontologist already used → present a checkpoint asking whether the interview is stuck because the design is genuinely ambiguous at this level, or because the questions aren't reaching the right topic

### Phase 2 Length Check

If Phase 2 has consumed more rounds than Phase 1, note this in the process evidence as a signal that understanding may have been insufficient.

---

## Resume Protocol

If interrupted:
1. Retrieve thinking summary via `get_thinking_summary()`
2. Determine which phase was active — check for `understanding-confirmed` thought
3. If Phase 1: call `get_understanding_state` with the understanding state file path to reload
4. If Phase 2: call `get_state` with the enforcement state file path to reload
5. Pick up from the last completed round in the correct phase
6. User does not re-answer questions

---

## Phase 4: Closure

1. `get_thinking_summary()` to produce the consolidated decision history
2. Reformat the thinking summary into a clean document. Hold in memory.
3. Present the completed design brief to the user — each decision with conclusion and rationale. The problem section should contain the confirmed problem statement from Phase 2's opening.
4. "Does this capture what we're building?"
5. Invoke `chester-util-worktree` to create the branch and worktree. The branch name is the sprint subdirectory name.
6. Read project config in the worktree context:
   ```bash
   eval "$(~/.claude/skills/chester-util-config/chester-config-read.sh)"
   ```
7. Create the output directory structure in the worktree: `{CHESTER_PLANS_DIR}/{sprint-subdir}/design/`, `spec/`, `plan/`, `summary/`
8. Create matching structure in main tree: `{CHESTER_WORK_DIR}/{sprint-subdir}/design/`, `spec/`, `plan/`, `summary/`
9. Write design brief to `{CHESTER_PLANS_DIR}/{sprint-subdir}/design/{sprint-name}-design-00.md` (worktree)
10. Write thinking summary to `{CHESTER_PLANS_DIR}/{sprint-subdir}/design/{sprint-name}-thinking-00.md` (worktree)
11. Write process evidence to `{CHESTER_PLANS_DIR}/{sprint-subdir}/design/{sprint-name}-process-00.md` (worktree). Compile from both state files: understanding MCP saturation history and gap evolution (Phase 1), enforcement MCP interview profile, drift assessments, challenge mode firings, readiness gate satisfaction, closure decision (Phase 2). Include **phase transition timing** (when it occurred, what triggered it), and **Phase 2 length relative to Phase 1**. Human-readable narrative — stories, not scores.
12. Copy all three artifacts to `{CHESTER_WORK_DIR}/{sprint-subdir}/design/`
13. Commit thinking summary, design brief, and process evidence in worktree with message: `checkpoint: design complete`
14. Update `~/.chester/thinking.md` — review the Key Reasoning Shifts from the session. For each shift, determine whether it matches an existing lesson (increment score by 1) or is a new lesson (add as a new row with score 1, category `—`). If the table exceeds 20 rows, drop the lowest-scoring entry. Present proposed changes to the user and confirm before writing. If the file does not exist, create it with the table header and the first entries.
15. Transition to chester-design-specify

## Output Artifacts

Three artifacts in `{CHESTER_PLANS_DIR}/{sprint-subdir}/design/`:

1. **`{sprint-name}-design-00.md`** — Design brief (WHAT). Domain language. Intent, outcome, in-scope, out-of-scope, decision boundaries, constraints, acceptance criteria, assumptions tested, residual risks.

2. **`{sprint-name}-thinking-00.md`** — Thinking summary (HOW decisions were made). Domain language. Decision history, alternatives considered, user corrections, confidence levels, understanding shifts.

3. **`{sprint-name}-process-00.md`** — Process evidence (HOW the interview operated). Human-readable narrative. Understanding dimension saturation over time, where the conversation pulled vertical, phase transition timing, challenge mode firings (Phase 2), how gates were satisfied, where drift was caught, Phase 2 length relative to Phase 1.

## File Naming Convention

Sprint name: `YYYYMMDD-##-word-word-word-word` — used for both the branch name and the directory name.

File naming: `{word-word-word-word}-{artifact}-{nn}.md`
- nn: `00` is the original, `01`, `02`, `03` for subsequent versions

## Integration

- **Invoked by:** user directly (as alternative to `chester-design-figure-out`)
- **Transitions to:** chester-design-specify (always — specifications are always produced)
- **May use:** chester-plan-attack (adversarial review of design), chester-plan-smell (code smell review)
- **Does NOT transition to:** chester-plan-build (must go through spec first)
