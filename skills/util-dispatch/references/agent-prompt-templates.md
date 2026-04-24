# Agent Prompt Templates & Session Examples

Exemplars and worked examples for dispatching parallel agents. Read this when you
need to see what a good agent prompt looks like in context, or how a past dispatch
decomposed a real problem. The decision procedure (when to dispatch, how to verify)
lives in SKILL.md; this file is the pattern library the procedure points at.

## Agent Prompt Structure

Good agent prompts are:

1. **Focused** — one clear problem domain.
2. **Self-contained** — all context needed to understand the problem.
3. **Specific about output** — state what the agent should return.

### Worked Example

```markdown
Fix the 3 failing tests in src/agents/agent-tool-abort.test.ts:

1. "should abort tool with partial output capture" — expects 'interrupted at' in message
2. "should handle mixed completed and aborted tools" — fast tool aborted instead of completed
3. "should properly track pendingToolCount" — expects 3 results but gets 0

These are timing/race condition issues. Your task:

1. Read the test file and understand what each test verifies
2. Identify root cause — timing issues or actual bugs?
3. Fix by:
   - Replacing arbitrary timeouts with event-based waiting
   - Fixing bugs in abort implementation if found
   - Adjusting test expectations if testing changed behavior

Do NOT just increase timeouts — find the real issue.

Return: Summary of what you found and what you fixed.
```

Notice: specific file path, numbered failures with exact test names, explicit
constraints ("do NOT just increase timeouts"), clear return contract.

## Real Example from Session

**Scenario:** 6 test failures across 3 files after major refactoring.

**Failures:**

- `agent-tool-abort.test.ts`: 3 failures (timing issues)
- `batch-completion-behavior.test.ts`: 2 failures (tools not executing)
- `tool-approval-race-conditions.test.ts`: 1 failure (execution count = 0)

**Decision:** Independent domains — abort logic is separate from batch completion is
separate from race conditions. Each can be investigated without context from the
others. Parallel dispatch fits.

**Dispatch:**

```
Agent 1 → Fix agent-tool-abort.test.ts
Agent 2 → Fix batch-completion-behavior.test.ts
Agent 3 → Fix tool-approval-race-conditions.test.ts
```

**Results:**

- Agent 1: Replaced timeouts with event-based waiting.
- Agent 2: Fixed event structure bug (`threadId` in wrong place).
- Agent 3: Added wait for async tool execution to complete.

**Integration:** All fixes independent, no conflicts, full suite green.

**Time saved:** 3 problems solved in parallel vs. sequentially.

## Real-World Impact

From debugging session (2025-10-03):

- 6 failures across 3 files
- 3 agents dispatched in parallel
- All investigations completed concurrently
- All fixes integrated successfully
- Zero conflicts between agent changes

## Takeaway for Prompt Design

Every worked example above follows the same pattern: **specific file paths + named
failures + explicit constraints + clear return contract.** Vague agent prompts
("fix the tests") lead to broad exploration; specific prompts lead to focused work.
