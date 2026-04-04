# Design Brief: chester-design-architect v2

## Intent

Redesign the `chester-design-architect` skill so that objective scoring discipline is delivered at figure-out's conversational speed. Sprint 01 proved the objective measures produce better design insights. Sprint 01 also proved the subagent delivery mechanism destroys the user experience. This sprint finds a delivery mechanism that preserves both.

## Desired Outcome

A skill that feels like figure-out to the user — same format, same pacing, same approximate content length per turn — but with objective scoring discipline that is structurally difficult for the agent to skip. The user stays in a ~2-minute conversational loop. The objective analysis runs in every cycle.

## What Sprint 01 Proved

### The value is real
In a real session (diagnostic-pipeline-type-cleanup), the objective engine surfaced a foundational assumption the subjective interview would likely have missed: the convergence target type doesn't exist yet. That insight reframed the entire sprint from "cleanup" to "design." This happened at Round 2.

### The delivery failed
The same session took 30 minutes for 2 rounds — 15 minutes per question. The user gave 3 substantive responses and stopped. The subagent pipeline (4 dispatches per cycle minimum) made each round feel like waiting for a committee report. Information density was also too high (separate problem, deferred).

### The benchmark
Figure-out delivers: short research pause, several statements, one question, ~2-minute cycles. That's the target cadence.

## What the Objective Engine Must Do

These are the capabilities that produced value in sprint 01:

1. **Dimension scoring** — score clarity across weighted dimensions (intent, outcome, scope, constraints, success criteria, context) after each user response. Greenfield and brownfield variants with different weights.

2. **Ambiguity computation** — compute a composite score from dimension weights using a deterministic formula. The agent provides assessments; the math is fixed.

3. **Readiness gates** — track three gates that must be satisfied before closure, independent of the ambiguity score:
   - Non-goals must be explicit
   - Decision boundaries must be explicit
   - Pressure pass must be complete (at least one earlier answer revisited)

4. **Pressure tracking** — track which user answers have been followed up on and which have been accepted without testing.

5. **Challenge mode triggers** — fire three named challenge modes when mechanical conditions are met:
   - Contrarian: round 2+ or foundational untested assumption
   - Simplifier: scope expanding faster than outcome clarity
   - Ontologist: ambiguity stalled (< ±0.05 for 3 rounds) or symptom-level reasoning

6. **Stall detection** — detect when ambiguity isn't changing across rounds.

7. **Problem statement drift** — at checkpoint intervals, compare the conversation trajectory against the confirmed problem statement.

## Requirements

### Pacing
- ~2-minute cadence per round (figure-out benchmark)
- Presentation parity: same format, approximate content length, number of statements per turn as figure-out

### Enforcement
- Objective analysis must be in the loop every cycle — not optional, not skippable
- The enforcement mechanism must make scoring harder to skip than a prompt instruction
- The agent provides subjective assessments; the mechanism enforces that they're provided and computes from them deterministically

### Integration
- Supplements (does not replace) the structured thinking MCP
- Structured thinking continues to handle decision capture and attention-curve retrieval
- Chester's conversational surface is primary: six question types, translation gate, stream-of-consciousness thinking, pessimist stance, research boundary, cross-session learning

### Tradeoffs accepted
- 80/20 discipline tradeoff: ~80% of sprint 01's scoring discipline, accepting loss of genuinely independent perspective, in exchange for conversational pacing
- The agent scores its own work (no independent scorer) — but must explicitly provide scores with justifications, which is a higher bar than implicit judgment

## Options Explored

### 1. Subagent pipeline (sprint 01)
Independent context windows. Genuinely independent analysis. 15 minutes per round. **Ruled out:** latency is unacceptable.

### 2. Background async pipeline
Subagents run behind the scenes while the main context interviews. **Explored, not pursued:** still carries subagent overhead; unclear when to inject results; adds complexity without clear pacing guarantee.

### 3. Internalized engine (prompt-only)
Scoring, gates, and triggers as main-context reasoning steps. **Red-teamed, risks identified:**
- High: agent skips scoring under cognitive load (grading own homework)
- Medium-high: can't adversarially review own questions
- Medium: exploration bias without independent Researcher
- Medium: context exhaustion from bookkeeping
- Low-medium: state file becomes ritual
- Non-risk: challenge modes work fine (trigger-based)

### 4. Tool-based enforcement
A mechanism the agent must call each round that accepts structured scoring input, validates it, computes deterministically, and returns state the agent needs. **Analyzed, requirements established:** makes scoring a dependency rather than an instruction; requires justifications with scores; can reject invalid inputs; computes formulas in code. Specific implementation mechanism left open.

## Out-of-Scope / Non-Goals

- Information density tuning (separate problem, separate sprint)
- Independent adversarial perspective on individual questions (accepted loss)
- Changes to figure-out itself
- Subagent dispatch for the per-round pipeline
- Replacing the structured thinking MCP

## What's Open for Specification

- The specific mechanism that enforces objective scoring (tool-based, file-based, MCP-based, hook-based, or hybrid)
- Implementation language and runtime model
- Installation and configuration
- Lifecycle (when the mechanism starts/stops, whether state persists across sessions)
- Exact tool/API surface (inputs, outputs, validation rules)
- Challenge mode trigger thresholds (exact values)
- How sprint 01's skill files are cleaned up

## Sprint 01 Files to Replace

The following files in `~/.claude/skills/chester-design-architect/` are superseded:
- `SKILL.md` (412 lines — subagent pipeline orchestrator)
- `researcher-prompt.md`
- `analyst-prompt.md`
- `pessimist-prompt.md`
- `adversary-prompt.md`
- `architect-prompt.md`
- `spec-reviewer.md` (may be reused if still applicable)

## Pipeline Integration

- **Transitions to:** chester-design-specify (always)
- **May use:** chester-plan-attack, chester-plan-smell
- **Does NOT transition to:** chester-plan-build (must go through spec first)
- Same sprint naming, directory structure, file naming conventions
- Same worktree workflow for branch isolation
- Same budget guard at skill entry
