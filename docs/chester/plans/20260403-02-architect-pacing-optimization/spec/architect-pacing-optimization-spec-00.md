# Spec: chester-design-architect v2

## Overview

Redesign the `chester-design-architect` skill to deliver objective scoring discipline at figure-out's conversational speed (~2-minute rounds). The skill replaces sprint 01's subagent pipeline entirely.

The skill has two parts:
1. A revised SKILL.md that runs like figure-out but includes per-turn objective scoring steps
2. An enforcement mechanism that makes scoring structurally difficult to skip

## Scope

### In-Scope
- Revised SKILL.md for `~/.claude/skills/chester-design-architect/`
- Design of the enforcement mechanism (tool surface, inputs, outputs, validation)
- Implementation of the enforcement mechanism
- Cleanup of sprint 01 files (subagent templates removed)
- Update to `chester-setup-start` skill description if needed

### Out-of-Scope
- Information density tuning (separate sprint)
- Changes to `chester-design-figure-out`
- Subagent dispatch in the per-round pipeline
- Replacing the structured thinking MCP

---

## Architecture

### The Skill (SKILL.md)

Structured like figure-out with three additions per turn:

**Same as figure-out:**
- Software Architect role identity
- Six question types with recommendation policy
- Translation gate (strip code vocabulary, product manager litmus test)
- Stream-of-consciousness thinking block (italic lines before bold question)
- Research boundary (private codebase exploration, domain-language output)
- Pessimist stance (continuous, not triggered)
- Structured thinking protocol (capture_thought / get_thinking_summary)
- Cross-session learning via `~/.chester/thinking.md`
- Sprint naming, directory structure, file naming conventions
- Budget guard, worktree integration

**Added per turn (after user responds, before formulating question):**

1. **Score dimensions** — assess each clarity dimension on 0–1 scale with justification and gap description. Submit to the enforcement mechanism.

2. **Check state** — read back from the enforcement mechanism: composite ambiguity, weakest dimension, gate status, challenge triggers, stall detection. Use this to inform question targeting.

3. **Apply priority rule** — if the enforcement mechanism returns a challenge trigger or a stall signal, the next question must address it. Priority: foundational untested assumption > codebase contradiction > weakest dimension > coverage rotation. Hardcoded, not discretionary.

**Added at checkpoints (every 5 rounds):**

4. **Drift check** — compare the conversation trajectory against the confirmed problem statement. If the conversation has wandered, reorient the next question. If the problem statement itself was wrong, surface it to the user.

**Modified closure:**

5. **Closure confirmation** — Thinking recommends closure when no question clears the materiality threshold. The enforcement mechanism must confirm: ambiguity below threshold, all gates satisfied, pressure pass complete. If it objects, the interview continues. The Interviewer surfaces the reason in domain terms.

### The Enforcement Mechanism

A tool or service the agent calls each round that:

**Accepts (from the agent):**
- Six dimension scores (0.0–1.0), each with:
  - Justification (why this score — cannot be empty)
  - Gap description (what's still missing — cannot be empty if score < 0.9)
- Gate evidence: whether non-goals, decision boundaries, or pressure pass were addressed this round
- Round metadata: round number, which answer (if any) was followed up on

**Validates:**
- Rejects submissions with empty justifications
- Flags score jumps > 0.3 in a single round (requires explanation)
- Rejects gap descriptions that are empty when score < 0.9

**Computes (deterministically):**
- Composite ambiguity using the fixed formula:
  - Greenfield: `1 - (intent×0.30 + outcome×0.25 + scope×0.20 + constraints×0.15 + success×0.10)`
  - Brownfield: `1 - (intent×0.25 + outcome×0.20 + scope×0.20 + constraints×0.15 + success×0.10 + context×0.10)`
- Stage priority (intent-first → feasibility → brownfield-grounding)
- Weakest dimension within the current stage

**Tracks (across rounds):**
- Dimension score history (for trend detection)
- Readiness gate status:
  - Non-goals explicit (true/false)
  - Decision boundaries explicit (true/false)
  - Pressure pass complete (true/false)
- Pressure tracking: which rounds' answers have been followed up on
- Challenge mode state: which modes have fired, which are available
- Stall detection: ambiguity change < ±0.05 for 3 consecutive rounds

**Returns (to the agent):**
- Composite ambiguity score
- Weakest dimension (name + score)
- Current stage
- Gate status (all three gates)
- Challenge trigger: `none | contrarian | simplifier | ontologist` with reason
- Stall detected: true/false
- Closure permitted: true/false (all gates + threshold + pressure pass)
- Validation warnings (if any score jumps flagged)

**Properties required:**
- Must be callable from the agent each round (creates dependency — can't skip)
- Must be fast (sub-second — preserves ~2-minute cadence)
- Must persist state across rounds within an interview
- Must be able to initialize fresh for a new interview
- Must be able to reload state for interview resume
- Must supplement (not replace) the structured thinking MCP

### Implementation Mechanism — Evaluation Criteria

The design brief intentionally leaves the specific technology open. The spec phase must evaluate candidate mechanisms against these criteria:

| Criterion | Weight | Description |
|-----------|--------|-------------|
| Skip resistance | High | How hard is it for the agent to bypass scoring? |
| Latency | High | Does it preserve ~2-minute round cadence? |
| State persistence | Medium | Can it resume across sessions? |
| Complexity | Medium | How much new infrastructure does it require? |
| Validation capability | Medium | Can it reject bad inputs? |
| Deterministic computation | Medium | Does it compute formulas in code, not in the agent's head? |

**Candidate mechanisms to evaluate during planning:**

1. **Custom MCP server** — a dedicated MCP that exposes scoring tools. Skip-resistant (tool call dependency), fast (local process), full validation, deterministic. Requires writing and maintaining a server.

2. **Structured thinking MCP extension** — extend the existing structured thinking MCP with scoring-specific tools. Same skip resistance. Less new infrastructure. May not be feasible if the MCP isn't extensible.

3. **File-based protocol with hook validation** — agent writes scores to a fixed-format file each round; a Claude Code hook validates the file before the agent can proceed. Skip resistance depends on hook enforcement. No new server.

4. **Prompt-only with structured thinking anchoring** — scoring runs as main-context reasoning; scores are captured via structured thinking and written to a state file. Weakest skip resistance but simplest. The baseline to beat.

The planning phase selects the mechanism based on evaluation against the criteria. The spec defines what the mechanism must do, not which technology implements it.

---

## Ambiguity Scoring

### Dimensions

| Dimension | Greenfield Weight | Brownfield Weight | What It Measures |
|-----------|------------------|-------------------|-----------------|
| Intent Clarity | 0.30 | 0.25 | Why the user wants this change |
| Outcome Clarity | 0.25 | 0.20 | What end state they want |
| Scope Clarity | 0.20 | 0.20 | How far the change should go |
| Constraint Clarity | 0.15 | 0.15 | Technical or business limits |
| Success Criteria | 0.10 | 0.10 | How completion will be judged |
| Context Clarity | — | 0.10 | Shared understanding of existing system |

Greenfield weights sum to 1.0. Brownfield weights sum to 1.0.

### Stage Priority

Dimensions grouped by stage. Target the weakest dimension within the earliest unsatisfied stage:

1. **Intent-first:** Intent, Outcome, Scope, Non-goals, Decision Boundaries
2. **Feasibility:** Constraints, Success Criteria
3. **Brownfield grounding:** Context Clarity (brownfield only)

### Threshold

Single threshold: **0.20**. No depth profiles — the interview self-adjusts.

### Readiness Gates

Independent of ambiguity score. All must be satisfied before closure:

1. Non-goals explicit
2. Decision boundaries explicit
3. Pressure pass complete (at least one earlier answer revisited with deeper follow-up)

---

## Challenge Modes

Three modes, each fires once per interview. Triggered by mechanical conditions from the enforcement mechanism's state.

| Mode | Trigger | Effect |
|------|---------|--------|
| Contrarian | Round 2+ OR foundational untested assumption | Next question challenges the core premise |
| Simplifier | Scope expanding faster than outcome clarity | Next question probes minimal viable scope |
| Ontologist | Stall detected (ambiguity < ±0.05 for 3 rounds) OR symptom-level reasoning | Next question forces essence-level reframing |

When triggered, the agent's next question must be the challenge — it overrides normal dimension targeting.

---

## Priority Rule (Hardcoded)

When choosing what to ask next:

1. **Challenge mode trigger** — if the enforcement mechanism says a challenge is due, ask it
2. **Foundational untested assumption** — if the agent identifies an assumption whose falsity would collapse the design
3. **Codebase contradiction** — if exploration reveals something that directly contradicts the user's stated intent
4. **Weakest dimension** — the enforcement mechanism's reported weakest dimension
5. **Coverage rotation** — next unaddressed dimension

This is not discretionary. The agent follows the highest applicable level.

---

## Visible Surface

Presentation parity with figure-out:

### Thinking Block
- Alignment check (1-2 italic sentences)
- Metacognitive reflection (1-2 italic sentences)
- Transparency of intent (1 italic sentence)
- **Prohibited:** dimension names/scores, gate names/status, challenge mode names, enforcement mechanism references

### Questions
- One per turn, bold
- Six types: clarifying, assumption-probing, evidence/reasoning, viewpoint/perspective, implication/consequence, meta
- Recommendation policy: only on clarifying and assumption-probing when genuinely confident

### Translation Gate
- Strip all code vocabulary
- Product manager litmus test
- If it fails, translate or discard

### Checkpoints (every 5 rounds)
- Summarize resolved, open, trajectory — domain language
- Offer exit opportunity with domain-language note on what's unaddressed
- Trigger drift check

---

## Closure

### When Thinking Recommends Closure
No candidate question clears the materiality threshold — weakest dimension, most significant finding, and sharpest concern are all below consequence level.

### Enforcement Mechanism Must Confirm
- Ambiguity below 0.20
- All three readiness gates satisfied
- Pressure pass complete

If it objects, interview continues. Interviewer surfaces the reason in domain terms.

### Forced Crystallization
Round 20 hard cap. Interviewer crystallizes with residual risk notes in domain terms.

### Early Exit
After first assumption probe + one persistent follow-up. Interviewer notes unaddressed areas. Residual risk in design brief.

### Stall Recovery
1. Stall detected → Ontologist fires (if available)
2. Ontologist already used → meta checkpoint (structural-level question about whether the interview is stuck)

---

## Output Artifacts

Three artifacts in `{CHESTER_PLANS_DIR}/{sprint-subdir}/design/`:

1. **`{sprint-name}-design-00.md`** — Design brief. Domain language. Intent, outcome, in-scope, out-of-scope, decision boundaries, constraints, acceptance criteria, assumptions tested, residual risks.

2. **`{sprint-name}-thinking-00.md`** — Thinking summary. Domain language. Decision history, alternatives, user corrections, confidence, problem statement shifts.

3. **`{sprint-name}-process-00.md`** — Process evidence. Human-readable narrative. Where challenges fired, how gates were satisfied, where drift was caught, how the interview self-corrected. Compiled from the enforcement mechanism's state at closure.

---

## Resume

If interrupted:
1. Retrieve thinking summary via structured thinking MCP
2. Reload scoring state from the enforcement mechanism
3. Pick up from last completed round
4. User does not re-answer questions

---

## Cleanup

Sprint 01 files to remove from `~/.claude/skills/chester-design-architect/`:
- `researcher-prompt.md`
- `analyst-prompt.md`
- `pessimist-prompt.md`
- `adversary-prompt.md`
- `architect-prompt.md`

`spec-reviewer.md` is retained (used by downstream skills).
`SKILL.md` is replaced with the v2 version.

---

## Testing Strategy

The skill is primarily prompt-based. Validation through use:

1. Run the skill on a known design problem
2. Verify the enforcement mechanism is called each round (not skipped)
3. Verify scores include justifications and gap descriptions
4. Verify the enforcement mechanism rejects empty justifications
5. Verify challenge modes fire at their trigger conditions
6. Verify closure is blocked when gates are unsatisfied
7. Verify all three output artifacts are produced
8. Verify the translation gate holds (no code vocabulary in user-facing output)
9. Verify presentation parity with figure-out (format, length, cadence)
10. Compare round cadence against figure-out benchmark (~2 minutes)

---

## Constraints

- Must maintain ~2-minute cadence per round
- Must maintain presentation parity with figure-out
- Must supplement (not replace) the structured thinking MCP
- Must produce artifacts compatible with `chester-design-specify` entry conditions
- Must use Chester's existing sprint naming, directory structure, file naming conventions
- Sprint 01 subagent templates must be removed (not left alongside)

---

## Integration

- **Invoked by:** user directly (as alternative to `chester-design-figure-out`)
- **Transitions to:** `chester-design-specify` (always)
- **May use:** `chester-plan-attack`, `chester-plan-smell`
- **Does NOT transition to:** `chester-plan-build` (must go through spec first)
