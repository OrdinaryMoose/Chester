# Thinking Summary: Cache Subagent Prefix

Sprint: sprint-007-cache-subagent-prefix
Date: 2026-03-29

## How Decisions Were Made

### Stage 1: Understanding the Problem Space

The investigation began with the AER research paper's Tier 1 recommendation: prompt caching for subagent stable prefixes. The paper claimed 23% cost reduction by achieving cache hits on the ~18-19K token prefix shared across 46 subagent invocations.

Initial exploration revealed a critical architectural question: Chester operates one layer above the API. Skills are SKILL.md files that instruct Claude Code on how to use the Agent tool. The system prompt, CLAUDE.md, and tool definitions are injected by Claude Code's harness — invisible and uncontrollable from Chester's perspective.

### Stage 2: Identifying Chester's Actual Lever

Research into Anthropic's prompt caching mechanics and Claude Code's implementation revealed:

- **API-level caching** works on byte-identical prefix matching in strict order: tools -> system -> messages
- **Claude Code already caches** the system prefix (reported 92% cache reuse rate for main agent loop)
- **Chester controls only the user message** — the `prompt` parameter of the Agent tool

This reframed the problem: Chester can't improve system-level caching, but it CAN maximize caching within the user message by structuring shared content as a byte-identical prefix.

### Stage 3: Cross-Skill Analysis

Exploration of all affected skills revealed two groups:

1. **Plan-level agents** (attack-plan: 6 agents, smell-code: 4 agents) — all receive identical full plan text
2. **Task-level agents** (write-code: implementer, spec reviewer, quality reviewer) — receive per-task text that's shared within a task's lifecycle

This means 10 subagents can share one cached plan prefix if structured identically.

### Stage 4: Role Description Decision

A conceptual question surfaced: do role descriptions ("You are a structural integrity auditor") actually improve output quality on frontier models, or can well-written task instructions achieve the same scoping?

Analysis: Role descriptions were important for earlier models but frontier models respond primarily to specific task instructions. The role frame is syntactic sugar around the actual constraint. Removing roles provides a triple benefit: smaller prompts, better cache prefix matching (no divergent role text before shared content), and no expected quality loss.

Decision: Remove role descriptions. This was an untested assumption (Chester has always used roles) but the reasoning is sound and the risk is low.

### Stage 5: Prefix Structure Design

Two options for cross-skill prefix sharing:

- **Option A**: Byte-identical plan preamble across both attack-plan and smell-code (one cache entry for all 10 agents)
- **Option B**: Skill-specific framing before plan text (two cache entries, one per skill)

Decision: Option A. The content is the same either way — just ordering. Since both skills share a pipeline lifecycle (dispatched together by build-plan), the coupling cost is low.

### Stage 6: Measurement Strategy

The user asked whether cache metrics are visible from the CLI. Research revealed:
- Claude Code session JSONL files contain `cache_read_input_tokens` and `cache_creation_input_tokens` per API call
- Chester's debug logger doesn't parse these (only reads high-level usage.json)
- Tools like ccusage already parse JSONL for cache stats

Decision: Add a post-session JSONL analysis option to chester-finish-plan rather than building runtime debugging. Simpler, no overhead, uses data that already exists.

## Confidence Assessment

| Decision | Confidence | Risk |
|----------|-----------|------|
| Remove role descriptions | Medium-high | Low — can revert if quality degrades |
| Shared content first | High | Minimal — pure structural change |
| Cross-skill prefix sharing | High | Low — same content, different order |
| Write-code same pattern | High | Minimal — same principle applied |
| Leave build-plan/spec reviewers unchanged | High | None — low call count |
| JSONL analysis in finish-plan | High | None — additive option |

## Key Technical Context

- Anthropic cache: byte-identical prefix matching, tools -> system -> messages order
- Minimum prefix: 4,096 tokens (Opus 4.6), 2,048 tokens (Sonnet 4.6)
- Cache TTL: 5 minutes default, extendable to 1 hour
- Cache reads: 10% of base input cost; writes: 125% (5min) or 200% (1hr)
- Up to 4 explicit breakpoints per request
- Claude Code manages system prompt + CLAUDE.md + tools (Chester can't control)
- Chester controls user message content (prompt parameter of Agent tool)