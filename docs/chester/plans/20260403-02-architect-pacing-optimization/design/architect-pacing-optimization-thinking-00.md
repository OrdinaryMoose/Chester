# Thinking Summary: chester-design-architect v2

How decisions were made during the design discovery interview.

## Problem Statement Evolution

### Starting Point
Sprint 01 built a subagent pipeline that produced high-quality output but 15-minute rounds. A real session archive confirmed: 30 minutes, 2 rounds, 3 substantive user interactions, user stopped early. The pacing analysis identified the cost model: 4+ subagent dispatches per cycle.

### First Narrowing
Two problems identified: (1) too slow, (2) information too dense. User scoped to pacing only: "the second is probably a matter of tuning which is a relatively easy problem."

### The Benchmark
User established figure-out as the target: "short research pause; several statements are made; and a question is asked in 2 or so minute cycles."

## Key Decision Points

### 1. "Which role to cut" → "Keep the user in a conversation"
The agent's first instinct was to ask which subagent roles were most valuable, implying fewer dispatches. The user couldn't evaluate because the experience was too poor to judge individual roles. This reframed from "reduce dispatches" to "change the delivery model."

### 2. Background async pipeline
The agent proposed: main context interviews at figure-out speed, subagents run in background and inject corrections. User accepted the direction but added presentation parity: same format, content length, and statements per turn as figure-out. Explored but not committed as the final answer.

### 3. User clarifies the original intent
The user provided the definitive framing: figure-out has a good subjective model. The goal was always to enhance it with objective information — dimension scoring, readiness gates, challenge triggers. The subagent pipeline was a means (independent context windows), not the goal. The means failed on user experience.

### 4. Internalized engine (prompt-only)
The agent proposed running all scoring in the main context with a state file. Red-teamed with six pitfalls. The critical one: the agent will skip or shortcut scoring under cognitive load. Prompt instructions are the weakest enforcement.

### 5. MCP server proposed and analyzed
The user asked: "do we make an MCP that serves as the hidden engine?" Analyzed in detail: the MCP would make scoring a tool call (can't skip), validate inputs (reject empty justifications), compute formulas in code (can't miscalculate), and return state the agent needs (creates dependency). The agent explained what MCPs can and can't do. The user asked whether structured data input alone forces genuine scoring — answer: mostly yes, especially with justification requirements and input validation.

### 6. The pullback — solution presupposition recognized
The user recognized that directing an MCP server as the solution was presupposing the answer. They asked to keep the problem statement but reframe the analysis without directing a specific mechanism. The design brief was rewritten to leave the enforcement mechanism open — the requirement is "harder to skip than a prompt instruction," not "must be an MCP server."

This was a critical reasoning shift. The interview had converged on a solution (MCP server) that felt right, had been red-teamed, and was accepted. The user then stepped back and recognized the solution had been adopted before the problem space was fully explored. The design brief now establishes the requirement (tool-based enforcement that creates a dependency) without prescribing the specific technology.

## Options Explored

| Option | Pros | Cons | Status |
|--------|------|------|--------|
| Subagent pipeline (sprint 01) | Independent perspective, genuine analysis | 15 min/round, user stops | Ruled out |
| Background async pipeline | Preserves cadence, full pipeline runs | Still has subagent overhead, injection timing unclear | Explored, not pursued |
| Internalized engine (prompt-only) | Fast, simple, no new infrastructure | Agent skips scoring under load (highest risk) | Red-teamed, risks documented |
| Tool-based enforcement | Fast (local), can't skip (dependency), validates inputs | Agent scores own work (no independence), 80/20 tradeoff | Requirements established, mechanism open |

## Requirements Established

- ~2-minute cadence per round
- Presentation parity with figure-out
- Objective analysis every cycle, not skippable
- Enforcement harder than prompt instructions
- Agent provides assessments, mechanism computes deterministically
- Supplements structured thinking MCP
- 80/20 discipline tradeoff accepted

## What Remains Open

The specific mechanism for enforcement. The design brief establishes what it must do (accept structured scoring input, validate, compute, return state) and what property it must have (harder to skip than a prompt instruction) without prescribing the technology. The specification phase will evaluate concrete options.

## Reasoning Shifts

1. **"Which role to cut" → "Change the delivery model."** The problem was pacing, not role count.

2. **"Subagents for independence" → "Enforcement for discipline."** Independent context windows were valuable for perspective but catastrophic for pacing. The core requirement is scoring discipline, not independent analysis.

3. **"Build an MCP server" → "Require tool-based enforcement, mechanism open."** The user caught that directing a specific solution presupposed the answer. The requirement is the constraint (must be harder to skip than prompt instructions); the technology is for the spec phase.

4. **"Sprint 01 needs fixing" → "Sprint 01 was learning."** Not a patch — a replacement informed by what the first attempt revealed.

5. **"Prompt instructions are sufficient" → "Prompt instructions are the weakest enforcement."** The red team of the internalized engine revealed that under cognitive load, the agent shortcuts scoring. Any solution must create a structural dependency, not just a written rule.
