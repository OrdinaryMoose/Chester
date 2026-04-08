# Design Brief: Response Control Format for Subagent Reports

## Problem

Free-form narrative in subagent findings inflates the tokens the orchestrator processes and makes cross-agent deduplication unreliable because equivalent findings get expressed in different shapes. The Chester AER optimization research paper (Section 8.2, Tier 1, Item 3) identifies this as a zero-quality-tradeoff intervention.

## Scope

All subagents whose reports the orchestrator must synthesize:

- **attack-plan** — 6 parallel agents (structural integrity, execution risk, assumptions & edge cases, migration completeness, API surface compatibility, concurrency & thread safety)
- **smell-code** — 4 parallel agents (bloaters & dispensables, couplers & OO abusers, change preventers, SOLID violations)
- **write-code reviewers** — spec reviewer, code quality reviewer, code reviewer

## Decisions

1. **Structured format replaces free-form prose within findings.** The specific syntax is an implementation detail. The requirement is that every finding has a consistent shape with fixed fields — enabling structural comparison across agents.

2. **One format concept across all three skill types.** The write-code reviewers have different report structures (pass/fail, strengths/issues/assessment) but the same principle applies: structured findings, not narrative.

3. **Complex findings get optional additional context.** An expansion mechanism allows findings that need more than the base fields to carry extra detail without inflating the common case. Mechanism is an implementation detail.

4. **Synthesis logic unchanged.** The existing Structured Thinking MCP synthesis process is not modified. Structured input makes the existing deduplication more reliable at the source.

5. **Optimized for orchestrator consumption.** No human-readability constraint. Format can be maximally compact — no prose preamble, framing, or explanatory narrative.

6. **Design constraint: minimize context and token use.** Every finding's substance must be preserved (severity, location, what's wrong, evidence) while eliminating narrative inflation.

## Non-Goals

- Changing the synthesis/deduplication logic
- Changing the number or type of subagents
- Changing what the agents investigate or how they investigate it
- Human-readable report formatting

## Affected Files

- `chester-attack-plan/SKILL.md` — 6 agent prompt templates + synthesized report format
- `chester-smell-code/SKILL.md` — 4 agent prompt templates + synthesized report format
- `chester-write-code/implementer.md` — implementer report format
- `chester-write-code/spec-reviewer.md` — spec reviewer report format
- `chester-write-code/quality-reviewer.md` — quality reviewer dispatch format
- `chester-write-code/code-reviewer.md` — code reviewer output format

## Origin

Paper reference: Section 8.2, Tier 1, Item 3 — "Response format control for subagent reports"

Expected impact per paper: Q unchanged, P(success) unchanged, E[C_api] modestly reduced. Enforcing structured, concise output formats reduces the tokens the orchestrator must ingest during synthesis steps and improves reliability of cross-agent deduplication.
