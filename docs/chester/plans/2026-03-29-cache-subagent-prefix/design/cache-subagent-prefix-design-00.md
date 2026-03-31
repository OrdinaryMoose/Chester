# Design Brief: Cache Subagent Prefix

Sprint: sprint-007-cache-subagent-prefix
Date: 2026-03-29
Status: Approved

## Problem

Chester's pipeline dispatches ~46 subagents across five skills. Each invocation carries an identical ~18-19K token system prefix (managed by Claude Code) plus shared payload content (plan text or task text) that Chester injects into the user message. Currently, subagent prompts lead with agent-specific content (role descriptions, framing), which means the user message diverges immediately between agents — preventing cache reuse on the shared payload.

## Goal

Restructure all subagent prompts so that shared content forms a byte-identical prefix at the start of the user message, maximizing prompt cache hit rates across subagent invocations. Expected cost reduction: up to 23% of total pipeline API cost.

## Design Decisions

### D1: Remove Role Descriptions

**Decision:** Eliminate persona framing ("You are a structural integrity auditor") from all subagent prompts. Replace with clear, specific task instructions that achieve the same domain scoping.

**Rationale:** Role descriptions diverge immediately between agents, breaking prefix sharing. On frontier models, well-written task instructions provide equivalent scoping without the prefix-breaking persona preamble. Triple benefit: smaller prompts, better cache prefix matching, no expected quality loss.

**Affects:** chester-attack-plan (6 agents), chester-smell-code (4 agents), chester-write-code (implementer, spec reviewer, quality reviewer, code reviewer)

### D2: Shared Content First

**Decision:** All subagent prompts place byte-identical shared content as the first bytes of the user message. Agent-specific instructions follow after a delimiter.

**Structure:**
```
[shared content — plan text or task text, byte-identical across agents]

---

[agent-specific task instructions — varies per agent]
```

**Rationale:** Anthropic's prompt cache matches byte-identical prefixes. By placing shared content first, the cache prefix extends through the entire shared payload. Agent-specific instructions at the end don't break the shared prefix — they simply aren't cached.

### D3: Cross-Skill Prefix Sharing

**Decision:** chester-attack-plan's 6 agents and chester-smell-code's 4 agents use a byte-identical plan text preamble. One cache write serves all 10 agents.

**Rationale:** Both skills receive the same plan document during the plan hardening phase of build-plan. Identical bytes at the start means cross-skill cache hits. The coupling cost is low because these skills already share a pipeline lifecycle.

### D4: Write-Code Same Pattern

**Decision:** Per-task agents in chester-write-code (implementer, spec reviewer, quality reviewer) place task text first, with additional context (implementer reports, code diffs) appended after.

**Rationale:** Within a single task's lifecycle, 2-3 agents share the same task text. Smaller cache win per instance but consistent pattern across the system.

### D5: Build-Plan/Build-Spec Reviewers Unchanged

**Decision:** Plan reviewer and spec reviewer subagents (which pass file paths rather than pasting content) remain as-is.

**Rationale:** These are 1-3 calls each with file-path-based prompts. Minimal cache benefit, not worth restructuring.

### D6: Post-Session Cache Analysis in Finish-Plan

**Decision:** Add an option to chester-finish-plan that parses session JSONL files and reports cache hit rates per subagent call.

**Rationale:** Claude Code session JSONL files already contain `cache_read_input_tokens` and `cache_creation_input_tokens` per API call. A post-session parser provides verification without runtime overhead. Surfaced as an option (not mandatory) during the finish-plan workflow.

## Scope

### In Scope
- Restructure subagent prompt templates in: chester-attack-plan, chester-smell-code, chester-write-code
- Remove role descriptions from all affected subagent prompts
- Define shared prefix format for plan-level and task-level agents
- Add JSONL cache analysis option to chester-finish-plan
- Update chester-dispatch-agents guidance if needed

### Out of Scope
- Changes to Claude Code's harness or API call construction
- Modifications to build-plan or build-spec reviewer subagents
- Runtime cache monitoring or debug logging
- TTL configuration (uses Claude Code defaults)

## Technical Context

- Anthropic prompt cache: byte-identical prefix matching in order tools -> system -> messages
- Minimum cacheable prefix: 4,096 tokens (Opus 4.6)
- Cache TTL: 5 minutes default
- Cache reads: 10% of base input cost
- Cache writes: 125% of base input cost (5min TTL)
- Up to 4 cache breakpoints per API request
- Claude Code manages system prefix (~18-19K tokens); Chester controls user message content

## Success Criteria

1. All subagent prompts in attack-plan, smell-code, and write-code restructured with shared content first
2. Role descriptions removed; task instructions provide equivalent domain scoping
3. Attack-plan and smell-code prompts share byte-identical plan preamble
4. Post-session JSONL analysis option available in finish-plan
5. No regression in subagent output quality (verified by running a full pipeline)