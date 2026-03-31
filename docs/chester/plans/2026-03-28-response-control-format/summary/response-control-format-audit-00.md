# Reasoning Audit: Structured Output Formats for Subagent Reports

**Date:** 2026-03-28
**Session:** `00`
**Plan:** `response-control-format-plan-00.md`

---

## Executive Summary

This session implemented the Tier 1 response format control intervention from the Chester AER optimization research paper, traversing the full Chester pipeline from design through merge in a single session. The most consequential decision was the user's reframe that "fixing the input shape IS the deduplication fix" — which collapsed a three-option analysis about whether to change synthesis logic into a non-decision, keeping the intervention squarely in Tier 1 (zero quality tradeoff) territory. Implementation stayed exactly on-plan with no deviations; the only post-plan changes came from code review findings (heading hierarchy, table format consistency, task name placeholders).

---

## Plan Development

The plan originated from Section 8.2, Tier 1, Item 3 of the Chester AER optimization research paper written in a prior session. The design interview resolved 7 decisions across 6 questions — a short interview because the problem was well-scoped by the paper's analysis. The spec was written and approved on first automated review iteration with one advisory recommendation applied. The plan itself was a 6-task structure organized by file, each task being a text find-and-replace operation on markdown skill files. Adversarial review (6 agents) and smell review (consolidated) both returned Low Risk after synthesis downgraded all initially-flagged Critical findings.

---

## Decision Log

---

### Synthesis Logic Scope Exclusion

**Context:**
The agent analyzed three options for how to handle the orchestrator's synthesis logic when input format changes: (A) change only input, keep synthesis unchanged; (B) change both input and synthesis; (C) change input, drop MCP synthesis entirely. This was a genuine design fork that would have changed the intervention's risk profile.

**Information used:**
- Chester AER paper Section 8.2 classifying this as Tier 1 (zero quality tradeoff)
- Current synthesis logic in `chester-attack-plan/SKILL.md` Step 3 and `chester-smell-code/SKILL.md` Step 3 using Structured Thinking MCP
- User's reframe: "free-form narrative in findings inflates the tokens the orchestrator processes, and makes cross-agent deduplication unreliable because equivalent findings get expressed in different shapes"

**Alternatives considered:**
- `Option B — change synthesis to leverage structure` — higher value but couples two changes, introduces quality risk, moves toward Tier 2
- `Option C — drop MCP synthesis` — cheapest but loses semantic dedup capability

**Decision:** Option A — change input format only, leave synthesis logic unchanged.

**Rationale:** The user reframed the question: fixing the input shape IS the deduplication fix. The synthesis logic benefits automatically from structured input without needing changes. Touching synthesis would push the intervention from Tier 1 to Tier 2 territory.

**Confidence:** High — user explicitly directed this reframe and the agent adopted it.

---

### Orchestrator-Only Optimization Target

**Context:**
The format could be optimized for human readability, orchestrator consumption, or both. This determines whether prose framing, section preambles, and explanatory text are retained.

**Information used:**
- User confirmed they don't read the reports directly — the orchestrator does
- Design constraint: minimize context and token use

**Alternatives considered:**
- `Human-readable format` — rejected by user: "lets go with orchestrator consumption"
- `Dual-purpose format` — not explicitly considered; user's answer was definitive

**Decision:** Optimize purely for orchestrator consumption with no human-readability constraint.

**Rationale:** User stated they don't consume the reports. The format can be maximally compact.

**Confidence:** High — explicit user direction.

---

### Format Syntax Left as Implementation Detail

**Context:**
The user initially proposed "markdown tables" as the specific format. The agent began anchoring on table design (columns, expansion mechanism, deduplication keys). The user corrected: "Table is just one form of structured information, just keep the metric as minimizing context and token use."

**Information used:**
- User's correction that tables were just one option
- Design constraint: minimize tokens, not prescribe syntax

**Alternatives considered:**
- `Markdown tables` — initially proposed by user, then reframed as one option among many
- `YAML blocks` — not explicitly discussed but implied as another option
- `Pipe-delimited rows` — what the spec ultimately chose (inferred as best balance of structure and compactness)

**Decision:** Defer specific syntax choice to the spec phase; design brief specifies structural requirements only.

**Rationale:** The user explicitly corrected premature anchoring on a specific syntax. The design constraint is structure and minimal tokens, not a particular format.

**Confidence:** High — explicit user correction.

---

### Uniform Format Across All Three Skill Types

**Context:**
Attack-plan and smell-code agents share nearly identical format structures, but write-code reviewers (implementer, spec reviewer, code reviewer) each serve different purposes with different output shapes (pass/fail, strengths/issues/assessment, status codes).

**Information used:**
- Current formats read from all 6 affected files
- Exploration agent's comprehensive analysis of current report structures

**Alternatives considered:**
- `Two separate formats` — one for attack/smell agents, another for write-code reviewers
- *(No other alternatives visible in context)*

**Decision:** One format concept across all three skill types, with per-type adaptations.

**Rationale:** User confirmed uniform application. The spec adapted the core finding format (`SEVERITY | location | finding | evidence`) to each skill type's specific needs while maintaining structural consistency. (inferred)

**Confidence:** Medium — user said "yes" to uniformity but the per-type adaptation details were agent-driven.

---

### Inline Execution for Tasks 4-6

**Context:**
The write-code skill recommends subagent-driven execution. Tasks 1-3 were dispatched as subagents (attack-plan agents, synthesized report, smell-code). Tasks 4-6 were small, focused edits (one find-replace each in implementer.md, spec-reviewer.md, and code-reviewer.md + quality-reviewer.md).

**Information used:**
- Task complexity: Tasks 4-6 are single edit operations in small files
- Subagent overhead: dispatching a fresh agent for a one-line change is disproportionate

**Alternatives considered:**
- `Subagent per task for all 6` — plan's default recommendation
- *(No other alternatives visible)*

**Decision:** Dispatch subagents for Tasks 1-3, execute Tasks 4-6 inline.

**Rationale:** Balanced subagent overhead against task complexity. Tasks 4-6 were trivial text replacements that didn't benefit from isolated subagent context. (inferred)

**Confidence:** Medium — decision visible in execution pattern, rationale inferred.

---

### Skipping Per-Task Spec/Quality Review

**Context:**
The write-code skill specifies a three-stage review per task: implementer → spec reviewer → quality reviewer. These changes are markdown text replacements with no executable code, no tests, and no build.

**Information used:**
- All changes are prompt template text in markdown files
- No test suite, no build, no runtime behavior
- Full code review dispatched at the end across all changes

**Alternatives considered:**
- `Per-task spec + quality review` — skill's standard process
- *(No other alternatives visible)*

**Decision:** Skip per-task reviews; run one full code review across all changes at the end.

**Rationale:** Per-task reviews are designed for code changes where spec compliance and code quality are meaningful checks. For markdown text replacements, a single end-to-end review checking consistency and completeness is more appropriate than 6 separate spec compliance checks. (inferred)

**Confidence:** Medium — decision visible in execution, rationale inferred from context.

---

### Assumptions Register Table Format Fix

**Context:**
Code review identified that the agent-level Assumptions Register in attack-plan used a flat list format (`- location | assumption | status | evidence`) while the synthesized report expected a markdown table (`| # | Assumption | Status | Evidence |`). This mismatch would require the orchestrator to convert between formats during synthesis.

**Information used:**
- Code reviewer's finding comparing agent output format (line 155) with synthesized report format (line 348)
- Spec's table format for the synthesized Assumptions Register

**Alternatives considered:**
- `Keep flat list, document conversion requirement` — reviewer suggested this as an option
- `Change synthesized report to flat list` — not considered; table format is more appropriate for tabular data

**Decision:** Change agent-level Assumptions Register to produce table rows matching the synthesized report format.

**Rationale:** Eliminating the format mismatch removes an implicit conversion step from synthesis, which is exactly the kind of friction this sprint was designed to eliminate.

**Confidence:** High — explicit code review finding with clear fix direction.
