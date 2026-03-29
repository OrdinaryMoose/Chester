# Addendum 1: Response Format Control for Subagent Reports

**Implementation of AER Paper Section 8.2, Tier 1, Item 3**

**Authors:** Mike and Claude
**Date:** March 2026
**Sprint:** sprint-006-response-control-format
**Status:** Implemented and merged

---

# 1. Relationship to the Parent Analysis

This addendum documents the implementation and observed effects of the third Tier 1 intervention identified in "AI Agent Effectiveness Review of the CHESTER Multi-Agent System Under Token Cost Constraints" (March 2026), Section 8.2:

> **3. Response format control for subagent reports.**
> Affects: attack-plan, smell-code, write-code (reviewers).
> Expected impact: Q unchanged, P(success) unchanged, E[C_api] modestly reduced. Enforcing structured, concise output formats for subagent reports reduces the tokens that the orchestrator must ingest during synthesis steps. The current reports are free-form; a structured format (severity, location, finding, evidence) would reduce synthesis input and improve the reliability of cross-agent deduplication.

The parent analysis classified this as Tier 1 — universal, no quality tradeoff — because it eliminates waste in how findings are communicated without changing what findings are produced. This addendum describes what was changed, the design rationale, and the expected mechanism of effect.

# 2. The Problem: Structural Variation in Subagent Output

## 2.1 Nature of the Problem

Chester's adversarial review (`chester-attack-plan`, six parallel agents) and smell analysis (`chester-smell-code`, four parallel agents) dispatch independent subagents that each produce a findings report. The orchestrator then ingests all reports and synthesizes a merged assessment, using the Structured Thinking MCP for cross-agent deduplication.

Prior to this intervention, subagent output was free-form prose organized under severity-level headings:

```
### Critical
[narrative description of finding with varying structure,
 emphasis, and detail level]

### Serious
[narrative description with different structure from Critical
 section, sometimes including code blocks, sometimes not]

### Minor
[brief or extensive depending on agent's judgment]
```

This produced three compounding costs:

1. **Token volume in synthesis.** Prose descriptions of findings consume more tokens than structured data carrying equivalent information. The orchestrator ingests all reports — six from `chester-attack-plan`, four from `chester-smell-code` — before synthesis. Prose inflates the synthesis input.

2. **Deduplication friction.** When two agents independently identify the same underlying issue, free-form prose describes it differently — varying emphasis, different framing, different levels of detail. The Structured Thinking MCP synthesis step must parse prose to determine whether Agent 1's finding and Agent 4's finding refer to the same issue. This is unreliable at the prose level because equivalent findings get expressed in different shapes.

3. **Severity-bucketed organization.** Grouping findings by severity (Critical section, Serious section, Minor section) rather than by finding with inline severity creates a structural mismatch: the synthesis step needs to compare findings across agents, not severity levels across reports. The section-based organization forces the synthesizer to flatten the hierarchy before comparison.

## 2.2 Scope of the Problem

The problem affects every subagent that produces findings for orchestrator consumption:

| Skill | Agents | Reports Per Run | Synthesis Step |
|-------|--------|-----------------|----------------|
| `chester-attack-plan` | 6 | 6 per-agent + 1 merged | Structured Thinking cross-check |
| `chester-smell-code` | 4 | 4 per-agent + 1 merged | Structured Thinking overlap resolution |
| `chester-write-code` | 3 types | Per-task (implementer, spec, quality) | Orchestrator review |

The parent analysis estimated 46 total subagent invocations per pipeline run. Of these, approximately 13 produce structured findings that undergo synthesis or orchestrator review (6 attack agents, 4 smell agents, and per-task spec/quality reviewers across a typical 10-task plan, though spec and quality reviewers were already more structured than the adversarial agents).

# 3. The Intervention: Structured Row Format

## 3.1 Format Specification

All subagent findings were restructured from severity-bucketed prose sections to a flat list with inline severity and consistent field structure:

**Before (severity-bucketed prose):**
```markdown
### Critical
The plan references `ProjectA.Services.AuthHandler` at line 45 but this
class was renamed to `AuthenticationService` in the February refactor.
The dependency chain through `ServiceRegistry.cs` means any code targeting
the old name will fail at runtime.

### Serious
The migration path for the config schema assumes backwards compatibility
but the plan adds a required field...
```

**After (structured rows):**
```markdown
### Findings
- **Critical** | `ProjectA.Services.AuthHandler` | Plan references renamed class | AuthHandler renamed to AuthenticationService in February refactor; ServiceRegistry.cs dependency chain breaks at runtime
- **Serious** | `config/schema.json` | Migration assumes backwards compatibility | Plan adds required field without default value; existing configs will fail validation
```

Each finding is a single row with four fields:
- **Severity** — Critical, Serious, or Minor (inline, not as section heading)
- **Location** — backtick-quoted file path, class, or plan section
- **Finding** — one-clause description of the issue
- **Evidence** — concrete codebase reference supporting the finding

Complex findings that cannot be adequately expressed in a single row receive an optional indented detail block:

```markdown
- **Critical** | `location` | finding | evidence
  > Additional detail when the finding cannot be understood without context.
  > Guidelines suggest ~20% or fewer of findings should need detail blocks.
```

## 3.2 Domain-Specific Sections

Each agent type retains domain-specific output sections adapted to the same structural format:

**Attack-plan agents:**
```markdown
### Verified
- `location` | assertion verified | TRUE
```

**Attack-plan (Assumptions agent):**
```markdown
### Assumptions Register
| Assumption | Status | Evidence |
|------------|--------|----------|
| assumption text | TRUE/FALSE/UNVERIFIABLE | evidence |
```

**Smell-code agents:**
```markdown
### Acknowledged
- `location` | smell the plan accounts for
```

**Write-code (implementer):**
```markdown
### Implementation Report
**Status:** DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT

### Files Changed
- `path` | what changed

### Self-Review Issues
- **[Critical|Important|Minor]** | `location` | finding | evidence
```

**Write-code (spec reviewer):**
```markdown
## Spec Review: [task name]
**Verdict:** Pass | Fail

### Issues
- **[Spec|Commit]** | `location` | finding | evidence
```

**Write-code (code reviewer):**
```markdown
**Verdict:** Yes | No | With fixes

### Issues
- **Critical** | `location` | finding | evidence
- **Important** | `location` | finding | evidence
- **Minor** | `location` | finding | evidence
```

## 3.3 Synthesized Report Format

The merged reports produced after cross-agent synthesis were also restructured. The attack-plan merged report uses:

```markdown
### Findings
- **Critical** | `location` | finding | evidence | source: [agent(s)]
- **Serious** | `location` | finding | evidence | source: [agent(s)]
- **Minor** | `location` | finding | evidence | source: [agent(s)]
```

The `source` field attributes findings to originating agent(s) and marks deduplicated findings with multiple sources. The smell-code merged report adds a `smell: [category]` field to preserve smell classification.

# 4. Design Decisions

Five design decisions shaped the implementation. Each is documented here to provide context for future analysis.

## 4.1 Synthesis Logic Unchanged

The Structured Thinking MCP synthesis process was not modified. The hypothesis — confirmed during design — was that the existing synthesis pipeline would benefit automatically from consistently-shaped input. Fixing the input shape is the deduplication fix: when findings arrive in identical structural format, the MCP's comparison and collapsing operations work on fields rather than parsing prose.

This decision means the intervention is purely a prompt-level change with no algorithmic component. The risk profile is correspondingly low.

## 4.2 Orchestrator-Optimized Format

The output format was designed exclusively for orchestrator consumption. Human readability was not a constraint — the raw agent findings are printed to terminal before synthesis (preserving human-readable output), but the structured format is what the synthesizer ingests.

This framing enabled maximal compactness. A format optimized for human scanning (headings, whitespace, narrative flow) would have preserved more tokens; a format optimized for machine parsing (structured rows, inline fields, minimal prose) reduces synthesis input.

## 4.3 Pipe-Delimited Rows Over Alternatives

The design brief specified structural requirements (severity, location, finding, evidence) without prescribing syntax. Implementation selected pipe-delimited rows (`- **Severity** | location | finding | evidence`) over alternatives:

- **Markdown tables** — Rejected because tables require column alignment and headers on every row, adding tokens without information. Tables are used where they add clarity (Assumptions Register) but not as the default format.
- **YAML/JSON blocks** — Rejected because structured data formats add schema overhead (keys, braces, quotes) that exceeds the token savings from structuring.
- **Pipe-delimited rows** — Selected as the best balance: consistent field positions enable pattern matching, the `|` delimiter is visually scannable for human debugging, and token overhead is minimal (one `|` character per field boundary).

## 4.4 Optional Detail Blocks

Approximately 20% of findings require more context than a single row can convey — complex dependency chains, multi-step reasoning, or evidence spanning multiple files. Rather than force all findings into single-row format (losing nuance) or allow all findings to expand freely (defeating the compactness goal), the format includes an optional indented detail block using blockquote syntax (`>`). The guideline that ~20% or fewer of findings should use detail blocks is calibration, not enforcement.

## 4.5 Uniform Concept, Per-Type Adaptation

One structural concept — flat findings list with inline severity and consistent fields — was applied across all three skill types. Each skill type's domain-specific sections (Verified, Acknowledged, Assumptions Register, Implementation Report, Verdict) were adapted to the same structural discipline but not homogenized. This preserves the semantic richness of domain-specific output while standardizing the cross-agent comparison surface.

# 5. Expected Effect on AER Variables

## 5.1 Quality (Q): Unchanged

The intervention changes how findings are formatted, not what findings are produced. The same attack vectors, smell categories, and review checklists drive agent behavior. The structured format contains all four fields present in the original prose (severity, location, finding, evidence) — no information is lost. The optional detail block preserves the escape valve for complex findings.

**Evidence category:** [B] — Analytically derived. No controlled experiment comparing finding quality before and after format change has been conducted.

## 5.2 Success Probability P(success): Unchanged

Subagent success probability is governed by whether the agent correctly identifies relevant findings in the codebase. Output format does not affect the agent's ability to search, read, and reason about code. The prompt changes are confined to the output specification section; the analytical instructions (attack vectors, smell checklists, review criteria) are unchanged.

**Evidence category:** [B] — Analytically derived.

## 5.3 Expected Cost E[C_api]: Modestly Reduced

The cost reduction operates through two mechanisms:

**Mechanism 1: Reduced synthesis input tokens.** The orchestrator ingests all subagent reports during synthesis. Structured rows are more compact than prose paragraphs conveying equivalent information. For a typical attack-plan run with 6 agents producing 3-5 findings each, the per-agent report shrinks by an estimated 200-400 tokens, saving ~1,200-2,400 tokens on the synthesis input. Across both attack-plan and smell-code synthesis steps, estimated savings are ~2,000-4,000 tokens per hardening pass.

**Mechanism 2: Improved deduplication reliability.** When the Structured Thinking MCP can match findings by field comparison rather than prose parsing, fewer duplicate findings survive into the merged report. Each surviving duplicate finding inflates the threat/smell report that the human reviews and that downstream pipeline stages reference. Removing duplicates reduces propagation cost. This mechanism is harder to quantify — the savings depend on how many duplicates exist and how often prose deduplication currently fails.

**Combined estimate:** ~2,000-4,000 tokens of direct savings per hardening pass, plus an unquantified reduction in duplicate propagation. Against the parent analysis's estimated 3,700K total pipeline cost, this represents approximately 0.05-0.1% of total input tokens — genuinely modest, consistent with the parent paper's characterization of "modestly reduced."

**Evidence category:** [C] — Illustrative estimate. Actual savings depend on finding volume and prose verbosity, which vary per pipeline run.

# 6. Relationship to Other Interventions

## 6.1 Interaction with Prompt Caching (Tier 1, Item 1)

Response format control and prompt caching are orthogonal interventions. Format control reduces output tokens from subagents; prompt caching reduces input tokens to subagents. Neither depends on or interferes with the other. Both can be implemented independently and their savings are additive.

## 6.2 Interaction with Reviewer Consolidation (Tier 2, Item 5)

The structured output format strengthens the case for reviewer consolidation. If spec compliance and code quality reviews are merged into a single subagent, the combined reviewer needs a consistent output format that distinguishes spec issues from quality issues. The structured row format — with its inline severity and explicit issue-type fields (`**[Spec|Commit]**` vs. `**[Critical|Important|Minor]**`) — provides this distinction within a unified format. Sprint-006's standardization makes a future consolidation sprint simpler to implement.

## 6.3 Interaction with Plan Payload Compression (Tier 2, Item 4)

No direct interaction. Plan payload compression affects the input to subagents; response format control affects their output. However, both contribute to reducing the total token volume the orchestrator processes during hardening synthesis, so their effects compound at the synthesis step.

# 7. Limitations and Open Questions

## 7.1 No Empirical Measurement

The actual token savings from this intervention have not been measured. The estimates in Section 5 are Category C — reasoned from the format change but not validated against real pipeline runs. The parent analysis's recommendation to measure cache hit rates and per-subagent token counts (Section 8.3) would also capture the effect of format control if applied to a post-intervention pipeline run.

## 7.2 Agent Compliance

The structured format is specified in prompt instructions, not enforced programmatically. Agents may produce findings that deviate from the format — omitting fields, adding extra prose, or reverting to severity-bucketed sections. The reliability of format compliance depends on model behavior, which varies across model versions and prompt contexts. No format validation or correction step exists.

## 7.3 Detail Block Calibration

The ~20% guideline for detail block usage is a design heuristic, not an empirically calibrated threshold. Agents may under-use detail blocks (losing nuance on complex findings) or over-use them (defeating the compactness goal). Without measurement of actual detail block frequency across pipeline runs, the calibration cannot be refined.

## 7.4 Deduplication Quality

The claim that structured input improves deduplication reliability is analytical, not empirical. It is plausible — field-level comparison is more reliable than prose-level comparison — but the actual improvement depends on the Structured Thinking MCP's internal comparison logic, which is not transparent to this analysis.

# 8. Conclusion

Response format control for subagent reports was implemented as a Tier 1 intervention — zero quality tradeoff, modest cost reduction, improved deduplication reliability. The intervention replaced free-form prose findings with structured pipe-delimited rows carrying inline severity, location, finding, and evidence fields. Synthesized reports gained source attribution and domain-specific classification fields.

The design decisions — unchanged synthesis logic, orchestrator-optimized format, pipe-delimited syntax, optional detail blocks, uniform concept with per-type adaptation — collectively produce a format that is more compact for machine processing while preserving all information content. The intervention is orthogonal to and compatible with the other Tier 1 optimizations (prompt caching, context windowing).

The primary open question is empirical validation: the Category C savings estimates should be replaced with Category A measurements from an instrumented pipeline run. This applies equally to all three Tier 1 interventions and argues for a coordinated measurement effort rather than per-intervention instrumentation.
