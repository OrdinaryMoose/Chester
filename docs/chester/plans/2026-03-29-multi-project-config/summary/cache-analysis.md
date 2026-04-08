# Cache Analysis: Sprint 006 — Multi-Project Config

**Session:** `cbdbfb87-40aa-47ce-9b9c-f2422114aa46`
**Date:** 2026-03-30

## Summary

| Metric | Value |
|--------|-------|
| API calls | 352 |
| Total input tokens (all sources) | 39,411,714 |
| Direct input tokens | 4,832 |
| Cache write tokens | 838,895 |
| Cache read tokens | 38,567,987 |
| Output tokens | 53,431 |
| **Overall cache hit rate** | **97.8%** |

## Analysis

This session made heavy use of subagents (10 hardening agents, 5 implementer agents, 2 reviewer agents, plus exploration agents during design). The 97.8% cache hit rate indicates excellent prefix caching — the system prompt, skill definitions, and conversation prefix were consistently reused across API calls.

The 352 API calls across a full pipeline run (design, spec, plan, hardening, implementation, merge) with this cache efficiency demonstrates the value of stable prompt prefixes in multi-agent workflows.

### Token Efficiency

- **Input amplification:** 39.4M input tokens served 53K output tokens — a ~740:1 ratio, heavily dominated by cache reads
- **Effective cost:** At cache read pricing (0.1x), the 38.6M cache read tokens cost equivalent to ~3.9M regular input tokens
- **Cache write overhead:** 838K tokens written to cache across the session — amortized across 352 calls, this is a small one-time cost per unique prefix
