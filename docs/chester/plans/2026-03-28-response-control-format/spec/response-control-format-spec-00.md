# Spec: Response Control Format for Subagent Reports

## Overview

Replace free-form narrative in subagent findings with a structured, compact format optimized for orchestrator consumption. The format must minimize token use while preserving finding substance and enabling structural deduplication across agents.

## Structured Finding Format

Every finding produced by any in-scope subagent uses this format:

```
- **[SEVERITY]** | `LOCATION` | FINDING | EVIDENCE
```

Where:
- **SEVERITY**: `Critical`, `Serious`, `Minor` (attack-plan, smell-code) or `Critical`, `Important`, `Minor` (write-code reviewers — preserving existing vocabulary)
- **LOCATION**: file path with line number (`src/foo.ts:42`), plan section reference (`Task 3, step 2`), or construct name (`class FooHandler`) — whatever is most specific
- **FINDING**: one sentence describing what is wrong or at risk
- **EVIDENCE**: one sentence citing the concrete proof — what was found in code, plan, or behavior

### Additional Context

When a finding requires more than the base format can convey, append an indented detail block:

```
- **Critical** | `src/auth.ts:15` | Race condition between token refresh and request dispatch | Two threads access `tokenCache` without synchronization
  > Token refresh (line 15) writes to `tokenCache` while `dispatch()` (line 42) reads it. Both are called from `handleRequest()` which runs on the thread pool. A stale read produces an expired token, causing a 401 retry loop that amplifies under load.
```

The detail block is optional. Most findings should not need it. If an agent is writing detail blocks on more than ~20% of findings, the base format is being underused.

## Application by Skill Type

### attack-plan (6 agents)

Each agent's output format changes from:

```
## [Domain] Findings
### Critical
[free-form prose per finding]
### Serious
[free-form prose per finding]
### Minor
[free-form prose per finding]
### [Verified/Acknowledged section]
```

To:

```
## [Domain] Findings

### Findings
- **Critical** | `location` | finding | evidence
- **Critical** | `location` | finding | evidence
- **Serious** | `location` | finding | evidence
- **Minor** | `location` | finding | evidence

### Verified
- `location` | assertion | status
```

Changes:
- Severity is a field in each finding row, not a section header. This eliminates repeated section structure and allows the orchestrator to sort/filter mechanically.
- The Verified/Acknowledged section uses a parallel compact format: location, what was checked, status (TRUE/FALSE/UNVERIFIABLE for assumptions agent; VERIFIED for others).
- Empty sections are omitted entirely (no empty headings).

The agent prompt instructions for output format are replaced with the new format. The attack vectors, rules, and evidence requirements remain unchanged.

### smell-code (4 agents)

Same transformation as attack-plan. Each agent's output changes from severity-bucketed sections to a flat finding list with inline severity. The Risks Acknowledged section becomes:

```
### Acknowledged
- `location` | smell the plan already accounts for
```

### write-code spec reviewer

Current format:
```
- Pass: Spec compliant, commit complete
- Fail — Spec issues: [free-form list with file:line]
- Fail — Commit issues: [free-form list]
```

New format:
```
## Spec Review: [task name]

**Verdict:** Pass | Fail

### Issues
- **[Spec|Commit]** | `location` | finding | evidence

### Verified
- `location` | requirement met
```

If verdict is Pass, Issues section is omitted. The structured format makes it clear whether failures are spec gaps or commit gaps without the orchestrator parsing prose.

### write-code code quality reviewer and code reviewer

Current format:
```
### Strengths
[prose]
### Issues
#### Critical (Must Fix)
[prose with file:line]
#### Important (Should Fix)
[prose]
#### Minor (Nice to Have)
[prose]
### Recommendations
[prose]
### Assessment
Ready to merge? [Yes/No/With fixes]
Reasoning: [sentences]
```

New format:
```
## Code Review: [task name or scope]

**Verdict:** Yes | No | With fixes

### Strengths
- `location` | what is well done

### Issues
- **Critical** | `location` | finding | evidence
- **Important** | `location` | finding | evidence
- **Minor** | `location` | finding | evidence

### Recommendations
- `location` | recommendation
```

Changes:
- Strengths become structured rows (location + description) instead of prose paragraphs
- Issues use the standard finding format with inline severity
- Recommendations become structured rows
- Assessment collapses to a single Verdict field at the top — the reasoning is implicit in the findings
- "How to fix" guidance moves to the detail block mechanism when needed

### write-code implementer

Current format:
```
Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
- What you implemented
- What you tested and test results
- Files changed
- Self-review findings
- Any issues or concerns
- Commit verification: git status output
```

New format:
```
## Implementation Report: [task name]

**Status:** DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT

### Files Changed
- `path` | what changed

### Tests
- `test name or path` | Pass | Fail | description

### Self-Review Issues
- **[Severity]** | `location` | finding | evidence

### Concerns
- concern description

### Commit Verification
[git status output — kept as-is, this is terminal output not prose]
```

The "what you implemented" narrative section is removed. The files changed, tests, and self-review sections provide that information in structured form. If the implementer needs to explain something that doesn't fit, it goes in Concerns.

## Synthesized Report Format

The merged reports produced by the orchestrator after synthesis also adopt the structured format.

### attack-plan synthesized report

```
## Adversarial Review: [plan name]

**Implementation Risk: [Low | Moderate | Significant | High]**

Agents: Structural Integrity, Execution Risk, Assumptions & Edge Cases, Migration Completeness, API Surface Compatibility, Concurrency & Thread Safety.

### Findings
- **Critical** | `location` | finding | evidence | source: [agent(s)]
- **Serious** | `location` | finding | evidence | source: [agent(s)]
- **Minor** | `location` | finding | evidence | source: [agent(s)]

### Assumptions
| # | Assumption | Status | Evidence |

### Risk Rationale
- rationale statement
- rationale statement
- rationale statement
```

The Risk Rationale section remains as short prose statements because the rationale is inherently narrative — it explains how findings interact, which is a synthesis judgment, not a structured data point.

### smell-code synthesized report

```
## Smell Review: [plan name]

**Implementation Risk: [Low | Moderate | Significant | High]**

Agents: Bloaters & Dispensables, Couplers & OO Abusers, Change Preventers, SOLID Violations.

### Findings
- **Critical** | `location` | finding | evidence | smell: [category] | source: [agent(s)]
- **Serious** | `location` | finding | evidence | smell: [category] | source: [agent(s)]
- **Minor** | `location` | finding | evidence | smell: [category] | source: [agent(s)]

### Acknowledged
- `location` | smell the plan accounts for

### Risk Rationale
- rationale statement
- rationale statement
- rationale statement
```

Smell-code synthesized findings include a `smell` field identifying the specific smell category, since this is meaningful for the user's remediation decision.

## Constraints

- The format is a prompt instruction change. No code, no tooling, no runtime enforcement. Subagents are instructed to produce this format; compliance depends on the model following instructions.
- The synthesis logic (Structured Thinking MCP cross-referencing) is unchanged. It receives structured input instead of prose, which improves its deduplication reliability without requiring changes to the synthesis process.
- Agent investigation scope, rules, and evidence requirements are unchanged. Only the output format is modified.

## Testing Strategy

This is a prompt-only change to markdown skill files. There is no executable code to test. Validation is:

1. **Manual pipeline run:** Run a complete chester-build-plan cycle (which invokes attack-plan and smell-code) on a real plan and verify that subagents produce structured output and the synthesis step produces a coherent merged report.
2. **Spot check deduplication:** Verify that when two agents report the same finding, the structured format makes the overlap visible during synthesis (same location, similar finding text).
3. **Regression check:** Verify no findings are lost — the structured format should carry the same substance as the prose format, just more compact.

## Affected Files

| File | Change |
|------|--------|
| `chester-attack-plan/SKILL.md` | Replace 6 agent output format instructions + synthesized report format |
| `chester-smell-code/SKILL.md` | Replace 4 agent output format instructions + synthesized report format |
| `chester-write-code/implementer.md` | Replace report format section |
| `chester-write-code/spec-reviewer.md` | Replace report format section |
| `chester-write-code/quality-reviewer.md` | Update expected return format description to match new code-reviewer output structure |
| `chester-write-code/code-reviewer.md` | Replace output format section + example |

## Non-Goals

- Changing the synthesis/deduplication logic
- Changing the number or type of subagents
- Changing what the agents investigate or how they investigate it
- Human-readable report formatting
- Enforcing format compliance at runtime (no validation tooling)
