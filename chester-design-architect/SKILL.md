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

A single-agent Socratic interview with objective scoring discipline. You ask questions. An enforcement mechanism tracks clarity scores, detects stalls, triggers challenges, and gates closure — all deterministically, in code, not in your head.

The user experiences one thoughtful architect asking good questions. The scoring machinery is invisible.

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
3. **Round one** — present problem statement (WHAT/WHY), user confirms, initialize enforcement mechanism
4. **Interview loop** — per-turn scoring cycle until closure conditions met
5. **Closure** — multi-confirmation, write three artifacts, update lessons table, transition to chester-design-specify

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

Round one is setup. No enforcement calls yet.

1. Explore codebase for relevant context. Classify **brownfield** (existing codebase target) vs **greenfield**.
2. For brownfield, collect relevant codebase context before questioning.
3. Present a refined problem statement in two parts:
   - **WHAT** the user wants to achieve
   - **WHY** this is relevant to the current architecture and design
   - Include neutral domain-language facts from code exploration
   - It is NOT a HOW, not a solution structure, and not a decision inventory
4. User confirms or corrects the problem statement. If the user corrects, revise and re-present.
5. `capture_thought()` with tag `problem-statement`, stage `Problem Definition`.
6. Initialize the enforcement mechanism:

   Call `initialize_interview` with:
   - `type`: greenfield or brownfield (from step 1)
   - `problem_statement`: the confirmed statement
   - `state_file`: `{CHESTER_WORK_DIR}/{sprint-subdir}/design/{sprint-name}-enforcement-state.json`

7. Full interview loop starts with the user's first design-relevant response.

---

## Phase 3: Interview Loop

One cycle runs per user response. You are a single agent performing all roles: researcher, analyst, pessimist, and interviewer.

### Per-Turn Flow

After each user response:

**Step 1: Capture thinking.**
If a trigger point is met, call `capture_thought`:
- Problem statement confirmed → tag: `problem-statement`, stage: `Problem Definition`
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

**Step 5: Formulate question.**
Select from the six question types (see Visible Surface). Apply the translation gate. Construct thinking block + question.

**Step 6: Present to user.**
Output thinking block, then bold question.

### Challenge Modes

Three modes, each fires once per interview. Triggered mechanically by the enforcement mechanism.

| Mode | Trigger | Effect |
|------|---------|--------|
| Contrarian | Round 2+ OR foundational untested assumption | Challenge the core premise of the stated approach |
| Simplifier | Scope expanding faster than outcome clarity | Probe minimal viable scope |
| Ontologist | Stall detected (ambiguity < ±0.05 for 3 rounds) OR symptom-level reasoning | Force essence-level reframing |

When triggered, your next question MUST be the challenge — it overrides normal dimension targeting. After asking the challenge question, report it via `challenge_used` in the next `submit_scores` call.

### Checkpoints (Every 5 Rounds)

Pause and summarize:
- What has been resolved so far
- What remains open
- Where the conversation seems to be heading

All in domain language — no scores, gates, or dimension names.

Offer the user an exit opportunity, noting in domain terms which topics haven't been addressed and what that means for downstream work.

**Drift check:** Compare the conversation trajectory against the confirmed problem statement. If the conversation has wandered, reorient the next question. If the problem statement itself was wrong, surface it to the user.

---

## Visible Surface

### Thinking Block (Before Each Question)

Three components, all italic single-sentence lines:

1. **Alignment check** (1-2 sentences) — summarize your understanding of the current design state so the user can correct drift immediately.

2. **Metacognitive reflection** (1-2 sentences) — selected from rotating angles:
   - What did this answer change about the design, and why does that matter?
   - What existing decision in the architecture does this touch or silently depend on?
   - What is the most fragile assumption in the current thinking?
   - Where does this sit uncomfortably against the current state of the system?
   - What is the single most important thing this interview still needs to resolve?

3. **Transparency of intent** (1 sentence) — why this question is being asked now.

### Prohibited Content in Thinking Block

- Dimension names or scores (intent clarity, outcome clarity, etc.)
- Gate names or gate status (non-goals explicit, decision boundaries, pressure pass)
- Challenge mode names (Contrarian, Simplifier, Ontologist)
- Enforcement mechanism references (submit_scores, composite ambiguity, etc.)
- Priority rule references

### Six Question Types

One question per turn. Always in bold. After the thinking block.

- **Clarifying** — "What do you mean by X?" May offer a recommended answer when codebase or context makes one evident.
- **Assumption-probing** — "What are you taking for granted here?" May recommend when the assumption appears sound based on evidence.
- **Evidence/reasoning** — "What makes you think that?" No recommendation — testing the user's grounding.
- **Viewpoint/perspective** — "What would someone who disagrees say?" No recommendation.
- **Implication/consequence** — "If that's true, what follows?" No recommendation.
- **Meta** — "Is this the right question to be asking?" No recommendation.

The recommendation policy is a calibration signal: if recommending answers to most questions, the interview is rubber-stamping rather than discovering.

### Translation Gate

Mandatory on every question, including challenge mode questions:

1. **Strip all code vocabulary.** Type names, class names, property names, method names, file paths, module names — remove them all. Use only domain concepts.
2. **Litmus test:** Could a product manager who understands the domain but has never opened this codebase answer this question?
3. If no, translate further or discard and find the design question underneath.

### Research Boundary

Code exploration is your private work.

- **Explore freely** — read as much code as you need to understand the design landscape
- **Digest internally** — convert findings into domain concepts, relationships, and tensions
- **Never relay raw findings** — type names, property shapes, class hierarchies, and implementation details do not appear in questions, thinking, or the design brief

If the user needs a code-specific term to answer a question, you have failed to translate.

### Structured Thinking Protocol

Use `capture_thought` / `get_thinking_summary` for positional retrieval against the U-shaped context attention curve.

**Capture triggers:**
1. Problem statement established → tag: `problem-statement`, stage: `Problem Definition`
2. Line of thinking changes → tag by new topic, stage: `Analysis`
3. User rejects or corrects → tag: `constraint` + topic, stage: `Constraint`
4. Complex decision node (3+ viable options) → tag by topic, stage: `Analysis` or `Synthesis`

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

---

## Closure Protocol

### When Thinking Recommends Closure

No candidate question clears the materiality threshold — weakest dimension, most significant finding, and sharpest concern are all below consequence level.

### Enforcement Mechanism Must Confirm

Call `submit_scores` one final time. The response must show `closure_permitted: true`. This requires:
- Ambiguity below 0.20
- All three readiness gates satisfied (non-goals explicit, decision boundaries explicit, pressure pass complete)

If `closure_permitted: false`, the interview continues. Surface the reason in domain terms without referencing gates or scores: "We haven't discussed what's out of scope yet" or "There's a question about whether we've circled back on an earlier answer."

### Forced Crystallization

Round 20 hard cap. Crystallize with residual risk notes describing which areas remain underspecified, in domain terms.

### Early Exit

After the first assumption probe and at least one persistent follow-up (ensuring minimum rigor), the user may exit at any checkpoint. Note unsatisfied conditions in domain terms. Record residual risk in the design brief.

### Stall Recovery

1. Stall detected → Ontologist fires (if available)
2. Ontologist already used → present a checkpoint asking whether the interview is stuck because the design is genuinely ambiguous at this level, or because the questions aren't reaching the right topic

---

## Resume Protocol

If interrupted:
1. Retrieve thinking summary via `get_thinking_summary()`
2. Call `get_state` with the state file path to reload enforcement state
3. Pick up from the last completed round
4. User does not re-answer questions

---

## Phase 4: Closure

1. `get_thinking_summary()` to produce the consolidated decision history
2. Reformat the thinking summary into a clean document. Hold in memory.
3. Present the completed design brief to the user — each decision with conclusion and rationale
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
11. Write process evidence to `{CHESTER_PLANS_DIR}/{sprint-subdir}/design/{sprint-name}-process-00.md` (worktree). Compile from the enforcement state file: interview profile, drift assessments, challenge mode firings, readiness gate satisfaction, closure decision. Human-readable narrative — stories, not scores.
12. Copy all three artifacts to `{CHESTER_WORK_DIR}/{sprint-subdir}/design/`
13. Commit thinking summary, design brief, and process evidence in worktree with message: `checkpoint: design complete`
14. Update `~/.chester/thinking.md` — review the Key Reasoning Shifts from the session. For each shift, determine whether it matches an existing lesson (increment score by 1) or is a new lesson (add as a new row with score 1, category `—`). If the table exceeds 20 rows, drop the lowest-scoring entry. Present proposed changes to the user and confirm before writing. If the file does not exist, create it with the table header and the first entries.
15. Transition to chester-design-specify

## Output Artifacts

Three artifacts in `{CHESTER_PLANS_DIR}/{sprint-subdir}/design/`:

1. **`{sprint-name}-design-00.md`** — Design brief (WHAT). Domain language. Intent, outcome, in-scope, out-of-scope, decision boundaries, constraints, acceptance criteria, assumptions tested, residual risks.

2. **`{sprint-name}-thinking-00.md`** — Thinking summary (HOW decisions were made). Domain language. Decision history, alternatives considered, user corrections, confidence levels, problem statement shifts.

3. **`{sprint-name}-process-00.md`** — Process evidence (HOW the interview operated). Human-readable narrative. Where challenges fired, how gates were satisfied, where drift was caught, how the interview self-corrected. Compiled from the enforcement mechanism's state at closure.

## File Naming Convention

Sprint name: `YYYYMMDD-##-word-word-word-word` — used for both the branch name and the directory name.

File naming: `{word-word-word-word}-{artifact}-{nn}.md`
- nn: `00` is the original, `01`, `02`, `03` for subsequent versions

## Integration

- **Invoked by:** user directly (as alternative to `chester-design-figure-out`)
- **Transitions to:** chester-design-specify (always — specifications are always produced)
- **May use:** chester-plan-attack (adversarial review of design), chester-plan-smell (code smell review)
- **Does NOT transition to:** chester-plan-build (must go through spec first)
