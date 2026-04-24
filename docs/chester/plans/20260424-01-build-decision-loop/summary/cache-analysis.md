# Cache Analysis: build-decision-loop session

**JSONL:** `build-decision-loop-session-00.jsonl` (16MB)
**Scope:** full session from compaction through finish sequence

## Totals

| Metric | Value |
|--------|-------|
| Assistant calls | 2,240 |
| Input tokens (non-cached) | 5,414 |
| Cache creation tokens | 19,813,440 |
| Cache read tokens | 660,844,224 |
| Total tokens | 680,663,078 |

## Cache Hit Rates

- **Average per-call hit rate:** 96.21%
- **Overall hit rate:** 97.09%

## Interpretation

Extremely high cache reuse — 97% of tokens served from cache. Cache creation (~20M tokens) is dominated by skill-file loads, spec/plan re-reads at task boundaries, and subagent dispatch prompts. Each subagent dispatch forks a new context, which is why creation-token count is non-trivial despite the high hit rate.

The 96%+ per-call hit rate confirms the sprint stayed well within the 5-minute cache TTL for most turns — rare cache-miss spikes would have dropped the average meaningfully.

Token budget was the binding constraint for this sprint (execute-write dispatched 14 tasks × implementer + 2 reviewers per code-producing task). Cache reuse kept the session viable; an uncached equivalent would have been ~22× more expensive.
