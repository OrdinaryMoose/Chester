# Thinking Summary: Token Budget Guard

## Session Context
- **Date:** 2026-03-27
- **Sprint:** token-budget-guard
- **Participants:** Mike, Claude (chester-figure-out)
- **Total design questions:** 10
- **Revisions:** 0

## Decision Timeline

### 1. Problem Definition (Thought 1, score 0.9)
Chester needs runtime token budget awareness — the ability to know where it is relative to its allocation and adjust behavior before hitting the hard limit. This is explicitly NOT about making prompts smaller (that was the prior no-go decision from 2026-03-26). This is about graceful degradation — sensing and responding.

### 2. Which Allocation? (Thought 2, score 0.85)
The target is the **Anthropic 5-hour rolling rate limit** — the hourly usage cap imposed by the subscription tier. Not the context window (1M tokens), not a dollar budget. When Chester exhausts the 5-hour limit, the session hard-stops until the window resets.

### 3. Observability Discovery (Thoughts 3-4, score 0.9)
Mike has a custom status bar in Claude Code CLI (`~/.claude/statusline-command.sh`) that receives real-time JSON from the harness containing:
- `rate_limits.five_hour.used_percentage`
- `rate_limits.five_hour.resets_at`
- `rate_limits.seven_day.used_percentage` / `resets_at`
- `context_window.used_percentage` / `remaining_percentage`

**Key constraint discovered:** This data is piped to the statusline script via stdin on each render cycle. It is NOT stored in a file, NOT exposed as an environment variable, and NOT queryable by skills. Skills running inside Claude Code cannot access it directly.

### 4. Desired Behavior at Threshold (Thought 5, score 0.9)
**Pause and report.** Not graceful degradation, not skipping steps autonomously. Stop what you're doing and hand control back to the user with a status update. The user wants to decide what happens next.

### 5. Data Bridge Approach (Thought 6, score 0.85)
Modify `statusline-command.sh` to also write usage data to `~/.claude/usage.json` on each render cycle. Chester reads this file at decision points. User confirmed no concerns about the script doing double duty.

### 6. Check Granularity (Thought 7, score 0.9)
Check before **every task** in `write-code` (the heaviest consumer) plus at **skill transition boundaries**. Impact analysis: 5-15 reads of a ~100 byte file per session — trivially cheap compared to subagent dispatches costing thousands of tokens each.

### 7. Diagnostic Logging (Thought 8, score 0.85)
Per plan section and per subagent usage delta logging. Read `usage.json` before and after each major step, log the delta. Gives the user visibility into where tokens are actually being spent across sessions.

### 8. Toggle Mechanism (Thought 9, score 0.9)
Two entry points: `chester-start` (normal) and `chester-start-debug` (diagnostic). The guard is always active in both modes. Only the diagnostic logging toggles.

### 9. Debug Flag Propagation (Thought 10, score 0.9)
`~/.claude/chester-debug.json` with a session timestamp. Created by `chester-start-debug`, removed by `chester-start`. Timestamp enables stale detection — if a debug session crashes, the next normal session can identify and ignore the orphaned flag.

### 10. Threshold Configurability (Thought 13, score 0.9)
The 85% threshold is configurable, stored in `~/.claude/chester-config.json` (persistent across sessions, separate from the session-scoped debug flag). Default value: 85.

### 11. Diagnostic Log Location (score 0.85)
Sprint output directory `summary/token-usage-log.md` when a sprint directory exists. Fallback to `~/.claude/chester-usage.log` when no sprint is active.

## Cross-References
- **Prior decision:** Token optimization no-go (2026-03-26) — Chester's 20% of baseline not worth optimizing. This design is complementary, not contradictory — it's about runtime awareness, not prompt reduction.
- **Status bar infrastructure:** `~/.claude/statusline-command.sh` and `~/.claude/settings.json` statusLine config.

## Confidence Assessment
All decisions resolved at 0.85-0.9 confidence. No revisions needed. No low-confidence decisions flagged. The design is straightforward — the hardest part was discovering that the data bridge was needed (the observability gap between the statusline and skills).
