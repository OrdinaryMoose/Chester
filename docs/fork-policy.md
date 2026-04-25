# Fork Policy for Chester Subagent Dispatches

This document is the authoritative per-dispatch fork policy for Chester. It exists because Claude Code's "forked subagents" feature (v2.1.117+, env var `CLAUDE_CODE_FORK_SUBAGENT=1`) is **session-global** — there is no per-call fork toggle. The only per-dispatch lever is `subagent_type`:

- `general-purpose` → **forks** when `CLAUDE_CODE_FORK_SUBAGENT=1` is set.
- Any **named** subagent (`chester:*`, `feature-dev:*`, `Explore`, etc.) → **never forks**, even when fork mode is enabled.

Chester uses this distinction deliberately. The implementer and other context-fidelity-positive sites stay `general-purpose` so they auto-fork under fork mode. Review-side and exploration sites use named subagents in `agents/` so they remain isolated regardless of the env var.

## Per-Dispatch Policy

| # | Spawn site | subagent_type | Fork under env var? | Why this policy |
|---|-----------|---------------|---------------------|-----------------|
| 1a | `design-large-task` codebase explorer | `feature-dev:code-explorer` | No | Independent perspectives are the point of fan-out. |
| 1b | `design-large-task` prior-art explorer | `Explore` | No | Same — divergent corpus search. |
| 1c | `design-large-task` industry explorer | `chester:design-large-task-industry-explorer` | No | External research must not inherit design framing. |
| 2 | `plan-build` plan reviewer | `chester:plan-build-plan-reviewer` | No | Spec-fidelity review needs independence from planner. |
| 3 | `plan-build` plan attacker | `chester:plan-build-plan-attacker` | No | Adversarial review requires fresh skepticism. |
| 4 | `plan-build` plan smeller | `chester:plan-build-plan-smeller` | No | Forward-looking critique requires independence. |
| 5 | `execute-write` implementer | `general-purpose` | **Yes** | Big context-fidelity win across N tasks; cache prefix reuse. |
| 6 | `execute-write` test generator | `chester:execute-write-test-generator` | No (mandatory) | Forking would leak implementer code and break the anti-drift lock. |
| 7 | `execute-write` spec reviewer | `chester:execute-write-spec-reviewer` | No | Independence from implementer's framing is the safeguard. |
| 8 | `execute-write` quality reviewer | `chester:execute-write-quality-reviewer` | No | Same — review must not inherit implementer's narrative. |
| 9 | `execute-write` full code review | `general-purpose` | **Yes** | Cache reuse over BASE..HEAD range is high; bias mitigated by reading actual diff. |
| 10 | `util-dispatch` parallel problems | `general-purpose` | **Yes** | Problems explicitly independent; cache reuse is pure cost win. |
| 11 | `execute-verify-complete` execute-prove | (Skill, not Agent dispatch) | n/a | Inline skill invocation; no dispatch occurs. |

## Adding New Dispatch Sites

When adding a new dispatch in any skill, decide the policy explicitly:

1. **Does the dispatch's value depend on independence from the parent's framing?** (Reviewer, critic, exploration of an alternate corpus.) → Use a named subagent in `agents/`.
2. **Does the dispatch benefit from inheriting the parent's plan/spec/architectural context?** (Implementer, mechanical verification, parallel-independent fan-out.) → Use `general-purpose` so it forks under fork mode.
3. **Document the choice at the dispatch site** — both the SKILL.md prose and the reference template should carry a `Fork policy: forked / isolated` note explaining the reasoning.

Default: when in doubt, use a named subagent. Independence is recoverable at higher cost; lost independence is invisible damage.

## Why This Matters

Chester's architecture leans heavily on the implementer-vs-reviewer split. The reviewer's job is to fail when the implementer drifted. If the reviewer inherits the implementer's framing, the split collapses into rubber-stamp review. Forking the wrong dispatch is silent — there is no warning or test that catches it. This document is the contract that prevents that silent failure.

## Enabling Fork Mode

Set the env var before launching Claude Code:

```bash
export CLAUDE_CODE_FORK_SUBAGENT=1
claude
```

With this enabled and the policy table above honored, fork mode is a pure cost win: the four `general-purpose` sites benefit from cache-prefix reuse, and the seven named-subagent sites stay isolated regardless.

Without the env var, all dispatches behave as normal (non-forked) subagents. Chester's reviewer guarantees still hold.
