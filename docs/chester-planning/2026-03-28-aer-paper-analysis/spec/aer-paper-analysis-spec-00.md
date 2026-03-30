# Specification: AI Agent Effectiveness Review of CHESTER

## Sprint: 2026-03-28-aer-paper-analysis
## Status: Draft

---

## 1. Overview

This specification defines the methodology for producing an applied research paper that evaluates the CHESTER multi-agent system using the analytical framework from "Optimizing AI Agent Effectiveness Under Token Cost Constraints" (v2, March 2026). The paper applies two instruments — the qualitative decision framework and trace-based computational analysis — to each Chester pipeline stage individually, then maps cross-correlations between stages.

**Deliverable:** A .docx research paper titled "AI Agent Effectiveness Review of the CHESTER Multi-Agent System Under Token Cost Constraints" by Mike and Claude.

**Output location:** `/home/mike/.claude/skills/docs/chester/2026-03-28-chester-optimization-research`

## 2. Paper Structure

The paper consists of eight sections. Each section is a discrete unit of work during the plan phase.

### Section 1: Introduction
- Position this as an applied case study of the source paper's framework
- State what is being analyzed (Chester's multi-agent pipeline), why (formal effectiveness profile to ground future optimization), and what instruments are used
- Declare epistemological stance: this paper produces Category B (analytically derived) and Category C (illustrative estimates) findings, with Category A (empirical) findings from trace analysis where available
- Scope note: this analysis covers Chester as deployed on Claude Opus with a 1M token context window by a solo developer

### Section 2: Background
- Summarize the source paper's analytical instruments, not reproduce them:
  - AER formula: (Q x P(success)) / E[C_api] — what each term means, why it's conceptual not computational
  - D(U) context degradation model — the three regimes (negligible below 30%, U-shaped 30-50%, recency-bias above 50%)
  - Five diagnostic dimensions with their three levels each
  - Four strategy configurations (A: Production Optimization, B: Active Development, C: High-Stakes Single-Agent, D: Multi-Agent)
  - TCO framing: C_api + C_human + C_remediation
- Reference the source paper for full detail; do not duplicate its content

### Section 3: Chester Overview
- Chester's architecture: pipeline stages, multi-agent design, worktree isolation
- Pipeline flow: figure-out → build-spec → build-plan → write-code → finish-plan
- Supporting skills: attack-plan, smell-code, test-first, fix-bugs, prove-work, review-code, dispatch-agents, doc-sync
- Subagent dispatch model: per-task implementer + spec reviewer + quality reviewer
- Context management: each subagent starts fresh (~20K baseline), structured checkpoints between stages
- Design rationale for multi-agent: context isolation, independent verification, failure containment

### Section 4: Qualitative Framework Applied to Chester
This is the primary analytical section. For each Chester pipeline stage, apply the source paper's five diagnostic dimensions and classify the stage into a strategy configuration.

#### 4.1 Assessment Methodology

**Unit of analysis:** Each Chester pipeline stage assessed individually against its own mandate.

**Dimension assessment criteria adapted for Chester:**

| Dimension | What it means for a Chester stage |
|-----------|----------------------------------|
| Task Decomposability | Can this stage's work be split across independent subagents without shared state or sequential dependencies? |
| Context Stability | Does the stage's prompt/skill content remain stable across invocations, or does it change with each project/session? |
| Success Observability | Can we tell whether this stage succeeded at its specific job — not whether the overall pipeline succeeded? |
| Volume and Frequency | How often is this stage invoked per pipeline run, and how many API calls does it generate? |
| Task Stakes | What are the consequences if this stage produces incorrect output — does the error compound downstream, or is it caught immediately? |

**Level definitions per dimension (adapted from source paper):**

**Task Decomposability:**
- High: Stage work decomposes into 3+ independent sub-tasks with testable interfaces between them
- Medium: Some sub-tasks can be parallelized but share context or have ordering constraints
- Low: Stage work is a single coherent activity that loses quality if split

**Context Stability:**
- High: Stage's skill prompt is identical across all invocations; only project-specific input varies
- Medium: Skill prompt is stable but session context (design brief, spec, plan) varies significantly between projects
- Low: Stage behavior adapts substantially based on conversation history or runtime state

**Success Observability:**
- High: Stage output has clear pass/fail criteria checkable without human judgment (tests pass, document structure valid)
- Medium: Output quality requires informed review but has defined criteria (spec completeness, plan coherence)
- Low: Output quality is subjective or only apparent downstream (design quality only visible during implementation)

**Volume and Frequency:**
- High: Stage generates 10+ API calls per pipeline run or is invoked multiple times per run
- Medium: Stage generates 3-9 API calls per run, invoked once
- Low: Stage generates 1-2 API calls per run

**Task Stakes:**
- High: Error in this stage compounds through multiple downstream stages before detection
- Medium: Error is detectable within 1-2 downstream stages
- Low: Error is contained within the stage or immediately detectable

#### 4.2 Per-Stage Assessments

For each of the 13 Chester pipeline stages listed in the design brief, produce:

1. **Dimension table:** Five dimensions rated High/Medium/Low with one-sentence justification per rating
2. **Configuration classification:** Which of the source paper's four configurations (A/B/C/D) best matches this stage's dimension profile
3. **Strategy implication:** What the configuration classification suggests about optimal token strategy for this stage — referencing the source paper's recommendations for that configuration
4. **Current vs. recommended:** Where Chester's current implementation aligns with or diverges from the recommended strategy

#### 4.3 Stage Groupings

After individual assessments, group stages by configuration classification. Identify:
- Which stages share the same configuration and could benefit from the same optimization strategy
- Which stages are outliers requiring unique treatment

### Section 5: Trace Analysis

Computational analysis of Chester's actual token usage per pipeline stage.

#### 5.1 Data Collection Methodology

**Data sources (priority order):**
1. Existing trace data in `docs/chester/` from prior sessions — use if the corresponding skill has not changed since the trace was captured
2. Token usage logs from diagnostic sessions — use if available and current
3. Freshly generated traces — run the stage in a controlled scenario and capture token usage

**Staleness check:** Compare the skill's SKILL.md last-modified date against the trace data's capture date. If the skill has been modified more recently, the trace is stale and must be regenerated.

**What to capture per stage:**
- Total input tokens consumed
- Total output tokens generated
- Number of API calls (tool uses + responses)
- Subagent count (if applicable)
- Subagent baseline overhead (system prompt + CLAUDE.md + skill content per subagent)
- Session context growth (tokens at stage entry vs. tokens at stage exit)
- Cache-eligible token fraction (stable prefix content as percentage of total input)

#### 5.2 Per-Stage Trace Tables

For each stage, present a table with:

| Metric | Value | Notes |
|--------|-------|-------|
| Total input tokens | | |
| Total output tokens | | |
| API calls | | |
| Subagent launches | | |
| Baseline overhead per subagent | | |
| Context utilization at entry | | % of 1M window |
| Context utilization at exit | | % of 1M window |
| Cache-eligible fraction | | % of input tokens that are stable prefix |
| D(U) regime | | Negligible / U-shaped / Recency-bias |

#### 5.3 Aggregate Analysis

- Total pipeline token consumption for a representative run
- Breakdown by stage as percentage of total
- Identification of the top 3 token-consuming stages
- Baseline overhead as percentage of total (the "tax" paid for multi-agent architecture)
- Cache-eligible tokens as percentage of total (the theoretical maximum caching benefit)

### Section 6: Cross-Correlations

Map dependencies and coupled variables between stages.

#### 6.1 What to analyze:
- **Output-input chains:** Which stages consume another stage's output as input? Map the full dependency graph.
- **Quality propagation:** Where does a quality deficiency in one stage's output most severely impact a downstream stage's P(success)?
- **Token propagation:** Where does one stage's output size drive another stage's input cost? (e.g., a verbose spec increases build-plan's input tokens)
- **Shared resource contention:** Do any stages compete for the same context budget within the orchestrator's window?

#### 6.2 Dependency classification:
- **Hard dependency:** Stage B cannot start until Stage A completes (e.g., build-plan requires build-spec output)
- **Quality dependency:** Stage B's effectiveness is bounded by Stage A's output quality (e.g., write-code bounded by build-plan quality)
- **Token dependency:** Stage A's output volume directly affects Stage B's token cost (e.g., design brief length affects spec writing cost)

### Section 7: Counter-Analysis and Limitations

Honest assessment of limitations, adapted from source paper's Section 8 approach:

- **Framework fit:** The source paper's dimensions were designed for production API deployments, not for a skill-driven pipeline. Where do the dimensions map poorly to Chester's context?
- **Measurement limitations:** What can't we measure? Where are we estimating vs. observing?
- **Single-user bias:** Chester is currently used by one developer on one model. How does this limit the generalizability of findings?
- **Stationarity assumption:** Chester's pipeline is under active development. Today's assessment may not match next month's architecture.
- **Goodhart's Law applied:** If Chester optimizes toward the metrics identified in this analysis, which metrics are most likely to become poor proxies?

### Section 8: Conclusions

- Per-stage configuration summary table (all stages, all dimensions, all classifications — one view)
- Top intervention priorities ranked by expected AER impact
- What to measure next — specific metrics Chester should track going forward to move from Category C to Category A findings
- Recommendations for future work — which optimization experiments the analysis suggests are most promising

## 3. Output Format

### Working format
All analysis work is done in markdown files within the sprint directory structure. Each paper section is written as a separate markdown file during the plan execution phase.

### Final assembly
After all sections are complete, assemble into a single markdown document, then convert to .docx using pandoc or python-docx. The .docx is written to the output location specified in the design brief.

### Tables and charts
- Dimension tables: markdown tables in the working files, formatted tables in the .docx
- Trace analysis tables: same approach
- Dependency graph (Section 6): described textually; visual diagram optional if tooling supports it

## 4. Scope Boundaries

### In scope
- All 13 Chester pipeline stages listed in the design brief
- The source paper's five diagnostic dimensions and four configurations
- Token trace analysis with moderate rigor
- Cross-correlation mapping between stages
- Counter-analysis and limitations

### Out of scope
- Implementation of any optimization identified by the analysis
- Comparison with other multi-agent systems
- The single-context fork variant (subagent fork only)
- Empirical measurement of P(success) or Q (these require a measurement infrastructure Chester doesn't have yet — the paper will recommend building one)
- Model routing analysis (Chester uses a single model tier)

## 5. Non-Goals

- This spec does not define an optimization plan. The paper identifies WHERE interventions should apply; a separate design cycle determines WHAT to implement.
- This spec does not propose changes to Chester's architecture. It evaluates the current architecture.
- This spec does not claim computational AER scores. Consistent with the source paper's epistemology, AER is used as a reasoning scaffold, not a calculation engine.

## 6. Quality Criteria

The paper meets its spec when:
1. Every Chester pipeline stage has a completed dimension table with justified ratings
2. Every stage has a configuration classification with rationale
3. Trace data exists (measured or generated) for every stage
4. Cross-correlations are mapped with dependency classifications
5. Counter-analysis addresses at least the five limitation categories listed in Section 7
6. The paper maintains the source paper's epistemological honesty — distinguishing measured from estimated from analytically derived
