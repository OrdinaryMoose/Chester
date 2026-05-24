# Classic Understanding-MCP Flow

**For:** `ACTIVE_UNDERSTANDING_MCP: classic`
**MCP server:** `chester-design-understanding-classic`
**Tools:** `initialize_understanding`, `submit_understanding`, `get_understanding_state`

This file specifies the Understand-Stage per-turn cycle and transition gate
when the swap line in `SKILL.md` is set to `classic`. Load and follow this
file's instructions whenever SKILL.md directs you to consult the active
MCP-flow reference.

## Round-One Initialization (executed once, before first designer-facing turn)

1. Classify the task internally: **brownfield** (existing codebase target) or **greenfield**. Internal-only — never present to the designer.
2. Call `initialize_understanding` with:
   - `user_prompt`: the designer's initial request
   - `context_type`: greenfield or brownfield (from step 1)
   - `state_file`: `{CHESTER_WORKING_DIR}/{sprint-subdir}/design/{sprint-name}-understanding-state.json`

   The MCP returns nine dimensions and their group structure (landscape, human_context, foundations).
3. Score the baseline. Assess each of the nine dimensions against what the explorers and your own exploration revealed. Most dimensions — especially `stakeholder_impact`, `prior_art`, `temporal_context` — score near 0 because they require human input the codebase cannot supply. Call `submit_understanding` with `state_file` and the full `scores` object (each dimension keyed to `{score, justification, gap}`).
4. Proceed to Round-One framing and gap-map presentation as described in SKILL.md Phase 3.

### Gap-map data shape

The "what the agent can't determine from code alone" section of the gap map presents explicit gaps drawn from the understanding MCP's gap fields, **grouped by dimension group** (`human_context`, `foundations`).

## Understand-Stage Per-Turn Flow

One cycle runs per designer response. You are a single agent performing all roles: researcher, analyst, pessimist, interviewer.

### Step 1: Capture thinking
If a trigger point is met, call `capture_thought`:
- New understanding emerges → tag: `understanding-[topic]`, stage: `Understand`
- Line of thinking shifts → tag by new topic, stage: `Analysis`
- User rejects or corrects → tag: `constraint` + topic, stage: `Constraint`
- Complex area with multiple facets → tag by topic, stage: `Analysis`

### Step 2: Score understanding dimensions
Assess each of the nine dimensions on a 0.0–1.0 scale. For each dimension determine:
- **Score**: how well understood this dimension is right now (0 = unknown, 1 = fully mapped)
- **Justification**: why this score — what evidence supports it (cannot be empty)
- **Gap**: what's still missing (cannot be empty if score < 0.9)

Call `submit_understanding` with:
- `state_file`: path to the understanding state file
- `scores`: all nine dimension scores with justifications and gaps

### Step 3: Read understanding response
The MCP returns:
- `overall_saturation` — weighted average across all dimension groups
- `group_saturation` — per-group averages (landscape, human_context, foundations)
- `weakest_group` — least-saturated group
- `weakest_dimension` — name and score of the dimension needing most attention
- `gaps_summary` — dimensions with the most substantive gaps
- `transition_ready` — whether all transition conditions are met
- `warnings` — any score-jump flags

### Step 4: Choose topic
Select what to address this turn using this priority (not discretionary):

1. **Score-jump warning** — if the MCP flagged a score jump, re-examine that dimension
2. **Weakest dimension in least-saturated group** — the MCP's reported target
3. **Largest gap** — the dimension with the most substantive gap description
4. **Coverage rotation** — next untouched dimension

### Step 5: Compose information package
Build the Understand-Stage information package (see SKILL.md Information Package). This is the primary deliverable of each turn — curated, altitude-appropriate material that fuels the designer's reasoning.

### Step 6: Write commentary
Based on the information package and what you've learned so far, share your take on the topic. Genuine analysis — what you think is happening, what tensions you see, what you suspect matters. Apply the Translation Gate.

In the Understand Stage, commentary must NOT propose or evaluate solutions. It should demonstrate your understanding of the problem landscape: "Here's what I think is going on, and here's what I'm not sure about."

End with **"What do you think?"** or a natural variant ("Does that match your sense of it?", "Am I reading this right?", "What am I missing?"). The designer will correct, confirm, or redirect.

Before sending, verify C1 and C2 from `util-design-partner-role` — every load-bearing premise is visible in the information package; every Assumption and Opinion is marked.

### Step 7: Present to designer
Translation Gate over every block (observations, information package, commentary):
- No type/class/property/method names, file paths, or module names
- No dimension names, scores, saturation levels, gap descriptors, or MCP mechanism names
- No JSON, code blocks, schema fragments, or tool-call examples

If any slipped in, rewrite before sending. Then output observations block, information package, commentary with closing prompt.

## Stage Transition

**Transition criteria:**
1. Understanding MCP reports `transition_ready: true` (overall ≥ 0.65, every group ≥ 0.50, ≥ 4 rounds)
2. Conversation pulling vertical (topics shifting from understanding to implementation detail)
3. Designer confirms understanding is sufficient

**Transition process:**
1. Recognize the pull-vertical signal
2. Present a transition summary in domain language — what has been understood, any dimensions still below 0.5 translated into domain-language areas of residual uncertainty
3. Designer confirms
4. `capture_thought()` with tag `understanding-confirmed`, stage `Transition`
5. Announce the Solve Stage opening (proceeds per SKILL.md Phase 4)

## State-Resume on Compaction

If you resume the session and `understanding-confirmed` thought is absent, the Understand Stage was active. Call `get_understanding_state` with the state file path to reload dimension scores, group saturation, and gap status. Summarize current saturation in domain language and resume the per-turn scoring cycle. No writes or edits until the Solve Stage opens.

## Brief-Render Read Shape

At Closure (SKILL.md Phase 5), the design brief reads from the understanding state file. Classic state shape includes:
- `scores` — per-dimension `{score, justification, gap}`
- `groupSaturationHistory`, `transitionHistory`, `warningsHistory` — telemetry
- `saturationHistory`, `scoreHistory` — score evolution

Render guidance: thinking summary captures the per-round scoring evolution; the design brief summarizes saturation by group with domain-language translation of any sub-0.5 dimensions.
