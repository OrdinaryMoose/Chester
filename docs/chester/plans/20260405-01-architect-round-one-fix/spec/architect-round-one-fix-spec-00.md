# Spec: Architect Phase 1 Restructure — Understanding MCP

## Overview

Restructure `chester-design-architect` Phase 1 from "Problem Definition" to "Understand" — a breadth-first exploration phase governed by a new Understanding MCP that scores nine understanding dimensions. Phase 2 becomes "Solve." The problem statement relocates from a Phase 1 transition gate artifact to Phase 2's opening move. The enforcement MCP defers to Phase 2 only.

This addresses the Round 1 collapse observed in practice: the agent explores the codebase, builds a comprehensive mental model, and presents a fully formed problem statement in Round 1 — bypassing the entire multi-round discovery process. The root cause is dual: the agent's natural completion drive after codebase exploration, and structural signals in the skill (the `problem-statement` capture tag, the Phase Transition Gate's problem statement format) that point the agent toward producing a finished analysis.

The fix redirects the agent's goal rather than constraining its behavior: "understand this problem broadly" channels the agent's energy more effectively than "don't conclude yet."

## Scope

### In-Scope

- Understanding MCP server (new) — nine dimensions, score/justification/gap validation, score-jump detection, transition readiness signal
- Revised Phase 1 identity ("Understand") and instructions in `chester-design-architect/SKILL.md`
- Revised Round 1 as gap map initialization in `chester-design-architect/SKILL.md`
- Problem statement relocation from Phase 1 transition gate to Phase 2 opening move
- Enforcement MCP initialization moved from Round 1 to Phase 2 start
- Removal of "phase-aware scoring guidance" from SKILL.md (enforcement MCP only runs in one phase)
- MCP registration in Claude Code settings for the understanding MCP server

### Out-of-Scope

- Changes to enforcement MCP server code (runs Phase 2 unchanged)
- Changes to `chester-design-figure-out`
- Changes to structured thinking MCP
- Changes to downstream skills (specify, plan-build)
- Changes to enforcement MCP scoring dimensions, weights, or formulas
- Changes to challenge mode trigger conditions in the enforcement MCP

---

## Architecture

### MCP Separation Model

```
Phase 1: Understand
├── Governed by: Understanding MCP (new)
├── Initialized: Round 1
├── Purpose: Reinforce breadth-first understanding
└── Deactivated: Phase transition

    ↓ Transition: Understanding dimensions broadly saturated

Phase 2: Solve
├── Governed by: Enforcement MCP (existing, unchanged)
├── Initialized: Phase 2 opening (after problem statement)
├── Purpose: Gate design resolution and closure
└── Deactivated: Interview closure
```

No overlap. One MCP per phase.

### Understanding MCP Server

A new MCP server mirroring the enforcement MCP's architecture. Located at `chester-design-architect/understanding/`. Three tools:

#### Tool 1: `initialize_understanding`

Initializes a new understanding session with nine dimensions, all scores at 0.

**Input:**
```json
{
  "user_prompt": "string — the user's initial request",
  "context_type": "greenfield | brownfield",
  "state_file": "string — absolute path to persist state JSON"
}
```

**Output:**
```json
{
  "status": "initialized",
  "context_type": "brownfield",
  "dimensions": ["surface_coverage", "relationship_mapping", ...],
  "dimension_groups": {
    "landscape": ["surface_coverage", "relationship_mapping", "constraint_discovery", "risk_topology"],
    "human_context": ["stakeholder_impact", "prior_art"],
    "foundations": ["temporal_context", "problem_boundary", "assumption_inventory"]
  },
  "state_file": "/path/to/state.json"
}
```

**State initialized:**
```json
{
  "context_type": "brownfield",
  "round": 0,
  "user_prompt": "...",
  "scores": {
    "surface_coverage": { "score": 0, "justification": "", "gap": "" },
    "relationship_mapping": { "score": 0, "justification": "", "gap": "" },
    "constraint_discovery": { "score": 0, "justification": "", "gap": "" },
    "risk_topology": { "score": 0, "justification": "", "gap": "" },
    "stakeholder_impact": { "score": 0, "justification": "", "gap": "" },
    "prior_art": { "score": 0, "justification": "", "gap": "" },
    "temporal_context": { "score": 0, "justification": "", "gap": "" },
    "problem_boundary": { "score": 0, "justification": "", "gap": "" },
    "assumption_inventory": { "score": 0, "justification": "", "gap": "" }
  },
  "scoreHistory": [],
  "saturationHistory": [],
  "verticalPullDetected": false
}
```

#### Tool 2: `submit_understanding`

Submit dimension scores for the current understanding round. Validates input, detects score jumps, computes saturation, and detects transition readiness.

**Input:**
```json
{
  "state_file": "string",
  "scores": {
    "surface_coverage": {
      "score": 0.4,
      "justification": "Explored cache layer and entity services, haven't touched editor integration or DSL consumers",
      "gap": "Don't know how the authored DSL layer interacts with the cache"
    }
  }
}
```

**Validation (mirrors enforcement MCP):**
- `justification` is required for every dimension (error if empty)
- `gap` is required when `score < 0.9` (error if empty)
- Score-jump detection: flags jumps > 0.3 per dimension per round as warnings
- Submission rejected if any errors; accepted with warnings if only warnings

**Computation after validation:**

1. **Update scores** — replace stored scores with submitted scores
2. **Compute group saturation** — average score per group:
   - Landscape saturation = mean(surface_coverage, relationship_mapping, constraint_discovery, risk_topology)
   - Human context saturation = mean(stakeholder_impact, prior_art)
   - Foundations saturation = mean(temporal_context, problem_boundary, assumption_inventory)
3. **Compute overall saturation** — weighted average across groups:
   - Landscape: 0.40 weight
   - Human context: 0.30 weight
   - Foundations: 0.30 weight
4. **Detect weakest dimension** — lowest-scoring dimension within the least-saturated group
5. **Record saturation history** — append overall saturation to `saturationHistory`
6. **Detect transition readiness** — see Transition Signal below

**Output:**
```json
{
  "status": "accepted",
  "round": 3,
  "overall_saturation": 0.62,
  "group_saturation": {
    "landscape": 0.70,
    "human_context": 0.45,
    "foundations": 0.55
  },
  "weakest_group": "human_context",
  "weakest_dimension": { "name": "prior_art", "score": 0.3 },
  "gaps_summary": [
    { "dimension": "prior_art", "gap": "Haven't discussed previous attempts to fix the cache" },
    { "dimension": "stakeholder_impact", "gap": "Don't know which workflows are affected" }
  ],
  "transition_ready": false,
  "transition_reasons": ["human_context group below 0.6 threshold"],
  "warnings": []
}
```

#### Tool 3: `get_understanding_state`

Load current understanding state. Same pattern as enforcement MCP's `get_state`.

**Input:**
```json
{
  "state_file": "string"
}
```

**Output:** Full state object plus computed transition readiness.

### Transition Signal

Transition from Phase 1 (Understand) to Phase 2 (Solve) is ready when:

1. **Overall saturation >= 0.65** — broad coverage across all dimension groups
2. **No group saturation below 0.50** — prevents advancing with an entire group unexplored
3. **At least 3 rounds completed** — minimum engagement floor

The transition signal is advisory, not mandatory. The SKILL.md instructions tell the agent to check `transition_ready` and, when true, evaluate whether the conversation is pulling vertical (questions shifting from understanding to implementation). The agent presents a transition checkpoint to the user — it does not auto-transition.

If `transition_ready` is true but the conversation is still producing understanding-oriented questions, the interview continues. If the agent recognizes the vertical pull before `transition_ready`, it notes this but continues Phase 1 until the signal confirms.

### Saturation Weights

The group weights (Landscape 0.40, Human Context 0.30, Foundations 0.30) reflect the design principle that technical landscape understanding is necessary but not sufficient — human context and foundational assumptions carry equal combined weight to the technical picture. This prevents the agent from achieving transition by deeply exploring code while neglecting the user's perspective.

---

## SKILL.md Changes

### Phase Identity Reframe

Replace all references to "Phase 1: Problem Definition" with "Phase 1: Understand" and "Phase 2: Design Creation" with "Phase 2: Solve" throughout the skill.

**Phase 1: Understand**
- Goal: Correlate broadly across the problem surface — map relationships, discover constraints, identify safe action zones
- Identity: breadth-first exploration, not conclusion-building
- No problem statement, no solutions, no design thinking
- Governed by understanding MCP

**Phase 2: Solve**
- Goal: Think narrowly about specifics — follow chains, work out process, figure out mechanics of change
- Opens with problem statement (crystallization of Phase 1 understanding)
- Governed by enforcement MCP

### Revised Round 1

Round 1 becomes the gap map initialization. Replace the current 8-step Round 1 with:

1. Explore codebase for relevant context. Classify **brownfield** vs **greenfield**.
2. Initialize the understanding MCP:

   Call `initialize_understanding` with:
   - `user_prompt`: the user's initial request
   - `context_type`: greenfield or brownfield
   - `state_file`: `{CHESTER_WORK_DIR}/{sprint-subdir}/design/{sprint-name}-understanding-state.json`

3. Score the nine understanding dimensions based on what the codebase exploration revealed and what remains unknown. Call `submit_understanding`. Most dimensions — especially stakeholder impact, prior art, temporal context — will score near 0 because they require human input.
4. Present the gap map to the user:
   - **What the codebase reveals** — observations mapped to dimensions the agent can partially score (surface coverage, relationship mapping, some constraint discovery). These are observations, not conclusions.
   - **What the agent can't determine from code alone** — explicit gaps from the understanding MCP's gap fields, grouped by dimension group (human context, foundations)
5. Ask a **Clarifying** question targeting the weakest dimension from the least-saturated group (as reported by the understanding MCP).
6. Announce: **Phase 1 (Understand) begins.** The conversation will focus on building shared understanding of the problem before exploring solutions.
7. `capture_thought()` with tag `understanding-baseline`, stage `Understand`.
8. Interview loop starts with the user's response.

**Key differences from current Round 1:**
- Understanding MCP initializes (not enforcement MCP)
- Agent scores dimensions and presents gaps (not a problem statement)
- `capture_thought` tag is `understanding-baseline` (not `problem-statement`)
- First question targets the weakest understanding dimension (not an open-ended clarifying question)

### Revised Phase 1 Per-Turn Flow

After each user response during Phase 1:

**Step 1: Capture thinking.** Same triggers as current, but tag `understanding-[topic]` instead of `problem-statement`.

**Step 2: Score understanding dimensions.** Assess each of the nine dimensions. For each: score (0.0–1.0), justification (mandatory), gap (mandatory when < 0.9). Call `submit_understanding`.

**Step 3: Read understanding response.** The MCP returns: overall saturation, group saturations, weakest group, weakest dimension, gaps summary, transition readiness, warnings.

**Step 4: Apply priority rule.** Choose next question target:
1. Score-jump warning — if the MCP flagged a jump, re-examine that dimension
2. Weakest dimension in least-saturated group — the understanding MCP's reported target
3. Largest gap — the dimension with the most substantive gap description
4. Coverage rotation — next untouched dimension

**Step 5: Compose information package.** Same Phase 1 format as current (Current facts, Surface analysis, Uncomfortable truths). Translation Gate and Research Boundary still apply.

**Step 6: Formulate question.** Same six question types. Must pass Translation Gate. Must NOT propose solutions.

**Step 7: Present to user.** Thinking block, information package, bold question.

### Revised Phase Transition

The transition from Understand to Solve:

1. Understanding MCP reports `transition_ready: true`
2. Agent recognizes conversation is pulling vertical (questions shifting to implementation)
3. Agent presents a **transition checkpoint** to the user:
   - Summary of what has been understood (in domain language)
   - Note any dimensions still below 0.5 as areas of residual uncertainty
   - "Are we ready to move from understanding to solving?"
4. User confirms
5. `capture_thought()` with tag `understanding-confirmed`, stage `Transition`
6. Announce phase transition

**No problem statement at the transition.** The transition is about confirming shared understanding, not producing an artifact.

### Revised Phase 2 Opening

Phase 2 (Solve) opens with two steps before the interview loop resumes:

1. **Write problem statement** — crystallize Phase 1's understanding into a concise problem statement (2-4 paragraphs): what's wrong, why it matters, what's been tried, what constrains a solution. Present to user for confirmation.
2. **Initialize enforcement MCP** — call `initialize_interview` with the confirmed problem statement, context type, and state file path `{CHESTER_WORK_DIR}/{sprint-subdir}/design/{sprint-name}-enforcement-state.json`.

Phase 2 then proceeds with the existing enforcement-governed interview loop (per-turn scoring, challenge modes, closure protocol). No changes to Phase 2's interview mechanics.

### Removal of Phase-Aware Scoring Guidance

Delete the "Phase 1 scoring guidance" and "Phase 2 scoring guidance" sections from the per-turn flow. The enforcement MCP only runs in Phase 2 where all dimensions are active — no conditional guidance needed.

### Revised Phase 1 Stopping Criterion (ASCII Diagram)

```
Phase 1: Understand
├── Goal: Deep shared understanding of the problem
├── Turn structure: Thinking → Information package → understanding question
├── Stopping criterion: Understanding dimensions broadly saturated, conversation pulling vertical
└── Constraint: No solutions, no problem statement, no design thinking

    ↓ Transition: Understanding confirmed by user

Phase 2: Solve
├── Goal: Resolved design direction
├── Opens with: Problem statement (crystallization of Phase 1)
├── Turn structure: Thinking → Information package → design question
├── Stopping criterion: Remaining questions are about how to implement, not what to build
└── Governed by: Enforcement MCP (unchanged)
```

### Phase 1 Prohibited Content

Add to the existing Phase 1 prohibitions:
- Problem statements or problem framing artifacts
- Complete analyses or comprehensive summaries of the problem
- The phrase "problem statement" in any context

### Phase Tracking

Update the tracking mechanism. Currently the agent tracks phase via `capture_thought` with tag `problem-statement-confirmed`. Change to:
- Phase 1 active: before `understanding-confirmed` thought is captured
- Phase 2 active: after `understanding-confirmed` thought is captured

---

## Understanding MCP Implementation

### File Structure

```
chester-design-architect/understanding/
├── server.js       — MCP server wiring (mirrors enforcement/server.js)
├── scoring.js      — Pure computation: saturation, validation, transition
├── state.js        — State lifecycle: init, update, persist, load
├── package.json    — Dependencies (@modelcontextprotocol/sdk)
└── __tests__/
    ├── scoring.test.js
    └── state.test.js
```

### scoring.js

**Functions:**

- `validateUnderstandingSubmission(scores, previousScores)` — same validation logic as enforcement: justification required, gap required when < 0.9, score-jump detection > 0.3. Returns `{ valid, errors, warnings }`.

- `computeGroupSaturation(scores)` — returns object with per-group averages:
  ```javascript
  {
    landscape: mean(surface_coverage, relationship_mapping, constraint_discovery, risk_topology),
    human_context: mean(stakeholder_impact, prior_art),
    foundations: mean(temporal_context, problem_boundary, assumption_inventory)
  }
  ```

- `computeOverallSaturation(groupSaturation)` — weighted average: landscape 0.40, human_context 0.30, foundations 0.30.

- `findWeakestDimension(scores, groupSaturation)` — find lowest-scoring dimension within the least-saturated group.

- `checkTransitionReady(state)` — returns `{ ready, reasons }`:
  - Overall saturation >= 0.65
  - No group below 0.50
  - At least 3 rounds completed
  - Reasons array explains what's not met

### state.js

**Functions:**

- `initializeState(contextType, userPrompt)` — create initial state with nine dimensions at score 0
- `updateState(state, newScores)` — update scores, compute saturation, detect transition, record history
- `saveState(state, filePath)` / `loadState(filePath)` — JSON persistence (same as enforcement)

**Dimensions constant:**
```javascript
const DIMENSIONS = [
  'surface_coverage', 'relationship_mapping', 'constraint_discovery', 'risk_topology',
  'stakeholder_impact', 'prior_art',
  'temporal_context', 'problem_boundary', 'assumption_inventory'
];

const DIMENSION_GROUPS = {
  landscape: ['surface_coverage', 'relationship_mapping', 'constraint_discovery', 'risk_topology'],
  human_context: ['stakeholder_impact', 'prior_art'],
  foundations: ['temporal_context', 'problem_boundary', 'assumption_inventory'],
};

const GROUP_WEIGHTS = { landscape: 0.40, human_context: 0.30, foundations: 0.30 };
```

### server.js

Three tool handlers mirroring the enforcement MCP pattern:
- `initialize_understanding` → `handleInitialize`
- `submit_understanding` → `handleSubmitUnderstanding`
- `get_understanding_state` → `handleGetState`

MCP server name: `chester-understanding`, version `1.0.0`.

### MCP Registration

Add to Claude Code settings (`.claude/settings.local.json` or project-level):
```json
{
  "mcpServers": {
    "chester-understanding": {
      "command": "node",
      "args": ["chester-design-architect/understanding/server.js"],
      "cwd": "<skills-repo-path>"
    }
  }
}
```

---

## Testing Strategy

### Understanding MCP Unit Tests

1. **Validation** — justification required, gap required when < 0.9, score-jump detection
2. **Group saturation computation** — correct averaging within groups
3. **Overall saturation computation** — correct weighted average across groups
4. **Weakest dimension detection** — returns lowest score in least-saturated group
5. **Transition readiness** — true when overall >= 0.65, no group < 0.50, rounds >= 3
6. **Transition not ready** — false when any condition unmet, with correct reasons
7. **State persistence** — save and load produce identical state

### Integration Validation (Observed Sessions)

1. **Round 1 presents gap map** — observations + explicit gaps, not a problem statement
2. **Phase 1 turns scored against understanding dimensions** — nine dimensions per turn, not enforcement dimensions
3. **Gaps drive question selection** — questions target weakest dimensions
4. **Score-jump warnings surface** — rapid inflation flagged
5. **Transition checkpoint presented** — when `transition_ready: true` and conversation pulling vertical
6. **Problem statement appears in Phase 2 opening** — not before
7. **Enforcement MCP initializes in Phase 2** — not Round 1
8. **Phase 2 mechanics unchanged** — challenge modes, closure protocol, enforcement scoring all work as before

---

## Constraints

- Understanding MCP must use the same MCP SDK as enforcement (`@modelcontextprotocol/sdk`)
- Per-turn cognitive load: nine dimensions per turn (not eighteen — one MCP per phase)
- Round 1 gap map must not bloat beyond the ~2-minute cadence target
- Understanding MCP state file lives alongside enforcement state file in the sprint design directory
- The understanding MCP is specific to `chester-design-architect` — it is not a general-purpose tool

## Non-Goals

- Modifying the enforcement MCP server code
- Making the understanding MCP reusable across other skills
- Adding challenge modes to the understanding MCP (the enforcement MCP's challenge system is sufficient for Phase 2)
- Building a visual dashboard for understanding scores

---

## Integration

- **Modifies:** `chester-design-architect/SKILL.md`
- **Creates:** `chester-design-architect/understanding/` (server.js, scoring.js, state.js, package.json, tests)
- **Registers:** `chester-understanding` MCP server in Claude Code settings
- **Does not modify:** enforcement MCP server, structured thinking MCP, `chester-design-figure-out`, `chester-design-specify`, or any other skill
- **Transitions to:** `chester-design-specify` (unchanged)
