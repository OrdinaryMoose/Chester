# Thinking Summary: Token Use Limits

**Sprint:** token-use-limits
**Date:** 2026-03-27
**Confidence:** 0.85 average across 5 captured decisions

## Decision Sequence

### 1. Problem Framing — Runtime vs Baseline (score: 0.9)

Prior session (2026-03-26) established that Chester's always-on baseline is 20% of session overhead and not worth optimizing. This effort takes a different vector: reducing runtime tool call and subagent overhead during plan execution. Different problem, different ceiling, complementary efforts.

### 2. Three-Category Value Map (score: 0.85)

Tool calls during execution classified into three categories:

- **Load-bearing** — output feeds a downstream action. Structured thinking chain (capture → retrieve → summary → written artifact) and file re-reads are in this category. Worth their cost.
- **Replaceable mechanism** — the goal has value but the tool call doesn't. Think tool and Sequential thinking gate questions improve reasoning quality, but the tool call is overhead since the model reasons natively. Replace calls with inline text instructions.
- **Display-only** — no downstream consumer. Task management (TaskCreate/TaskUpdate) provides user-facing progress but no skill reads task state.

User confirmed by disabling Think tool and Sequential thinking disconnected during session.

### 3. Reviewer Consolidation (score: 0.9)

The per-task execution pattern in chester-write-code dispatches 3 subagents: implementer, spec compliance reviewer, code quality reviewer. Each carries ~20K baseline overhead.

Four options evaluated:
- **A:** Keep 3 separate (current) — independent review but highest cost
- **B:** Fold into self-review — maximum savings but loses independent verification
- **C:** Keep one, drop the other — loses a review dimension
- **D:** Merge into one combined reviewer — preserves both dimensions, one baseline cost

**Decision: Option D.** Merge spec compliance and code quality into a single combined reviewer subagent. Saves ~20K per task (~200K for a 10-task plan) while preserving independent review.

### 4. Task Management — Not Worth Changing (score: 0.85)

Actual per-task overhead is 2 TaskUpdate calls. For a 10-task plan: 10 creates + 20 updates = 30 calls. Each call is ~30 tokens. Total: ~900 tokens — negligible next to ~320K saved from subagent reduction. User confirmed task list visibility is useful. Keep current behavior.

### 5. Context Accumulation — Deferred (score: 0.75)

The orchestrator accumulates all prior task reports in its conversation history. By task 10, every orchestrator turn pays input tokens on all prior reports. This is a potential cost driver but no data is available. Deferred pending measurement from Sprint 052 diagnostic logs.

## Cross-References

- Think tool analysis → confirmed by user disabling the MCP
- Task management cost → reframed by tracing actual call sequence in chester-write-code
- Reviewer consolidation → builds on but is separate from the hardening consolidation plan (attack 6→3, smell 4→2, doc-sync 3→2)
