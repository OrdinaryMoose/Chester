# Chester AER Paper Analysis — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use chester-write-code to implement this plan task-by-task. Each task produces a paper section (markdown), not code. The "implementer" reasons about AER and Chester's architecture; the "reviewer" verifies analytical rigor. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce an applied research paper that evaluates each Chester pipeline stage against the AER paper's qualitative decision framework and trace analysis methodology.

**Architecture:** Each task writes one paper section as a standalone markdown file. Tasks 1-3 provide context; Tasks 4-5 are the primary analysis; Tasks 6-8 synthesize findings. Task 9 assembles and converts to .docx.

**Deliverable:** `/home/mike/.claude/skills/docs/chester/2026-03-28-chester-optimization-research/chester-optimization-research.docx`

**Source paper:** `/home/mike/Documents/ClaudeCode/Docs/agent_efficiency_paper_v2.docx` (convert with python-docx to read)

**Pre-execution setup (orchestrator runs before Task 1):**
```bash
# Create output directory structure
mkdir -p /home/mike/.claude/skills/docs/chester/2026-03-28-chester-optimization-research/sections

# Ensure conversion tooling is available
pip3 install markdown 2>/dev/null

# Pre-extract source paper to markdown for subagent access
python3 -c "
from docx import Document
d = Document('/home/mike/Documents/ClaudeCode/Docs/agent_efficiency_paper_v2.docx')
with open('/home/mike/.claude/skills/docs/chester/2026-03-28-chester-optimization-research/source-paper.md', 'w') as f:
    for p in d.paragraphs:
        f.write(p.text + '\n')
"
```

**Note for orchestrator:** When dispatching Tasks 6-8, provide explicit absolute file paths to completed prior sections so subagents can read them.

---

### Task 1: Write Section 1 — Introduction

**Files:**
- Create: `/home/mike/.claude/skills/docs/chester/2026-03-28-chester-optimization-research/sections/01-introduction.md`

**Context for implementer:**
This paper is an applied case study. The source paper ("Optimizing AI Agent Effectiveness Under Token Cost Constraints," v2, March 2026) provides the general framework. This paper applies that framework to a specific system: Chester.

- [ ] **Step 1: Read the source paper**

Read `/home/mike/.claude/skills/docs/chester/2026-03-28-chester-optimization-research/source-paper.md` (pre-extracted markdown). Understand the paper's structure, instruments, and epistemological stance.

- [ ] **Step 2: Read the design brief and spec**

Read:
- `/home/mike/.claude/skills/.worktrees/sprint-005-aer-paper-analysis/docs/chester/2026-03-28-aer-paper-analysis/design/aer-paper-analysis-design-00.md`
- `/home/mike/.claude/skills/.worktrees/sprint-005-aer-paper-analysis/docs/chester/2026-03-28-aer-paper-analysis/spec/aer-paper-analysis-spec-00.md`

These define what the paper covers and how.

- [ ] **Step 3: Write the introduction**

Write `/home/mike/.claude/skills/docs/chester/2026-03-28-chester-optimization-research/sections/01-introduction.md` covering:
- Position this as an applied case study of the source paper's framework
- What is being analyzed: Chester's multi-agent pipeline (13 stages)
- Why: formal effectiveness profile to ground future optimization work
- Instruments used: qualitative decision framework (5 dimensions, 4 configurations) + trace analysis
- Epistemological stance: Category B (analytically derived) and Category C (illustrative estimates) findings, with some Category A from trace data
- Scope note: Chester deployed on Claude Opus with 1M context window, solo developer
- Paper structure overview

Target length: 500-800 words. Match the source paper's tone — precise, honest about limitations, no marketing language.

- [ ] **Step 4: Self-review**

Verify: Does the introduction accurately represent the paper's scope? Does it set expectations correctly? Is the epistemological stance clear?

- [ ] **Step 5: Commit**

```bash
git add /home/mike/.claude/skills/docs/chester/2026-03-28-chester-optimization-research/sections/01-introduction.md
git commit -m "paper: write introduction section"
```

---

### Task 2: Write Section 2 — Background

**Files:**
- Create: `/home/mike/.claude/skills/docs/chester/2026-03-28-chester-optimization-research/sections/02-background.md`

**Context for implementer:**
Summarize the source paper's instruments — don't reproduce them. The reader of this applied paper needs enough context to follow the analysis, but should reference the source for full detail.

- [ ] **Step 1: Read the source paper**

Read `/home/mike/.claude/skills/docs/chester/2026-03-28-chester-optimization-research/source-paper.md`. Focus on Sections 4 and 5 — the conceptual model and qualitative framework.

- [ ] **Step 2: Write the background section**

Write `/home/mike/.claude/skills/docs/chester/2026-03-28-chester-optimization-research/sections/02-background.md` summarizing:

**AER Formula:**
- AER = (Q × P(success)) / E[C_api]
- What each term means, why it's conceptual not computational
- The expected cost model including retry and state corruption terms

**D(U) Context Degradation Model:**
- Three regimes: negligible (U ≤ 0.30), U-shaped (0.30 < U ≤ 0.50), recency-bias (U > 0.50)
- Empirical bounds: D(1.0) ∈ [0.15, 0.87]
- Conservative planning values: D(0.50) ≈ 0.80, D(0.75) ≈ 0.65

**Five Diagnostic Dimensions:**
- Task Decomposability, Context Stability, Success Observability, Volume/Frequency, Task Stakes
- Three levels each (High/Medium/Low) — describe briefly, reference source for full indicator tables

**Four Strategy Configurations:**
- A: Production Optimization, B: Active Development, C: High-Stakes Single-Agent, D: Multi-Agent
- Key conditions for each, especially Config D's five sequential gates

**TCO Framing:**
- TCO = C_api + C_human + C_remediation
- Note that C_human dominates in most organizations

Reference the source paper for full detail throughout. Target length: 800-1200 words.

- [ ] **Step 3: Self-review**

Verify: Could a reader follow the analysis sections (4-6) with only this background? Is anything over-reproduced from the source?

- [ ] **Step 4: Commit**

```bash
git add /home/mike/.claude/skills/docs/chester/2026-03-28-chester-optimization-research/sections/02-background.md
git commit -m "paper: write background section"
```

---

### Task 3: Write Section 3 — Chester Overview

**Files:**
- Create: `/home/mike/.claude/skills/docs/chester/2026-03-28-chester-optimization-research/sections/03-chester-overview.md`

**Context for implementer:**
This replaces the source paper's "Analysis of Alternatives." It describes Chester as the system under analysis, presenting its architecture, pipeline flow, and multi-agent design rationale. Written for a reader who has never used Chester.

- [ ] **Step 1: Read Chester's architecture**

Read these files to understand Chester's current architecture:
- `~/.claude/skills/CLAUDE.md` — overall description
- `~/.claude/skills/chester-write-code/SKILL.md` — subagent dispatch model
- `~/.claude/skills/chester-figure-out/SKILL.md` — discovery pipeline
- `~/.claude/skills/chester-build-plan/SKILL.md` — plan creation with hardening
- `~/.claude/skills/chester-attack-plan/SKILL.md` — adversarial review (6 agents)
- `~/.claude/skills/chester-smell-code/SKILL.md` — code smell review (4 agents)
- `~/.claude/skills/chester-dispatch-agents/SKILL.md` — parallel coordination

- [ ] **Step 2: Write the Chester overview**

Write `/home/mike/.claude/skills/docs/chester/2026-03-28-chester-optimization-research/sections/03-chester-overview.md` covering:

**Architecture:**
- Pipeline stages and their flow (figure-out → build-spec → build-plan → write-code → finish-plan)
- Supporting skills grouped by function (review, discipline, utility)
- How stages connect — output of one becomes input to the next

**Multi-Agent Design:**
- Subagent dispatch model in write-code: per-task implementer + spec reviewer + quality reviewer
- Parallel dispatch in attack-plan (6 agents) and smell-code (4 agents)
- Context isolation: each subagent starts fresh (~20K baseline)
- Structured checkpoints between stages (design brief → spec → plan → task reports)

**Design Rationale:**
- Why multi-agent: independent verification, failure containment, context hygiene
- The cost: ~20K baseline per subagent × 43 subagents for a 10-task plan = ~860K overhead
- The tradeoff Chester makes: token cost for architectural discipline

**Table: Pipeline stages under analysis** — list all 13 stages with one-line description of each.

Target length: 1000-1500 words.

- [ ] **Step 3: Self-review**

Verify: Would someone unfamiliar with Chester understand the system well enough to follow the dimension assessments in Section 4? Is the multi-agent cost structure clear?

- [ ] **Step 4: Commit**

```bash
git add /home/mike/.claude/skills/docs/chester/2026-03-28-chester-optimization-research/sections/03-chester-overview.md
git commit -m "paper: write chester overview section"
```

---

### Task 4: Write Section 4 — Qualitative Framework Applied to Chester

**Files:**
- Create: `/home/mike/.claude/skills/docs/chester/2026-03-28-chester-optimization-research/sections/04-qualitative-framework.md`

**Context for implementer:**
This is the primary analytical section. For each of Chester's 13 pipeline stages, assess against the five diagnostic dimensions and classify into a configuration. This is analytical work — reason carefully about each dimension for each stage.

**The 13 stages:** chester-figure-out, chester-build-spec, chester-build-plan, chester-write-code, chester-finish-plan, chester-attack-plan, chester-smell-code, chester-test-first, chester-fix-bugs, chester-prove-work, chester-review-code, chester-dispatch-agents, chester-doc-sync.

- [ ] **Step 1: Read assessment methodology from spec**

Read `/home/mike/.claude/skills/.worktrees/sprint-005-aer-paper-analysis/docs/chester/2026-03-28-aer-paper-analysis/spec/aer-paper-analysis-spec-00.md` — Section 4.1 defines the adapted dimension criteria and level definitions.

- [ ] **Step 2: Read each skill's SKILL.md**

For each of the 13 stages, read the corresponding `~/.claude/skills/chester-{name}/SKILL.md`. Understand what the stage does, how it operates, whether it dispatches subagents, and what its success criteria are.

- [ ] **Step 3: Write Section 4.1 — Assessment Methodology**

Reproduce the adapted dimension definitions from the spec. Present the assessment criteria so the reader understands how ratings were determined.

- [ ] **Step 4: Write Section 4.2 — Per-Stage Assessments**

For each of the 13 stages, produce:

**Dimension table:**

| Dimension | Level | Justification |
|-----------|-------|---------------|
| Task Decomposability | H/M/L | One sentence explaining why |
| Context Stability | H/M/L | One sentence |
| Success Observability | H/M/L | One sentence |
| Volume and Frequency | H/M/L | One sentence |
| Task Stakes | H/M/L | One sentence |

**Configuration:** Which configuration (A/B/C/D) best matches, with rationale.

**Strategy implication:** What the source paper recommends for this configuration. Where Chester's current implementation aligns or diverges.

Assess each stage against its own mandate. Be honest — if a dimension is ambiguous, say so. If a stage doesn't fit neatly into any configuration, explain the mismatch.

- [ ] **Step 5: Write Section 4.3 — Stage Groupings**

After all individual assessments, group stages by configuration classification. Identify:
- Which stages share the same configuration
- Which stages are outliers
- What patterns emerge (e.g., do all discovery stages share a configuration?)

- [ ] **Step 6: Self-review**

Verify: Is every rating justified? Are any ratings inconsistent with the dimension definitions? Do the configuration classifications follow logically from the dimension profiles? Are there any stages where the assessment feels forced?

- [ ] **Step 7: Commit**

```bash
git add /home/mike/.claude/skills/docs/chester/2026-03-28-chester-optimization-research/sections/04-qualitative-framework.md
git commit -m "paper: write qualitative framework analysis section"
```

---

### Task 5: Write Section 5 — Trace Analysis

**Files:**
- Create: `/home/mike/.claude/skills/docs/chester/2026-03-28-chester-optimization-research/sections/05-trace-analysis.md`

**Context for implementer:**
Computational analysis of Chester's token usage. Use existing trace data where valid, estimate where not. The key existing data source is the 2026-03-26 token-diet-skills audit which has empirical session JSONL data.

**Existing trace data locations:**
- `/home/mike/.claude/skills/docs/chester/2026-03-26-token-diet-skills/` — baseline measurements from JSONL parsing (most authoritative)
- `/home/mike/.claude/skills/docs/chester/2026-03-27-token-use-limits/` — subagent consolidation analysis
- `/home/mike/.claude/skills/docs/chester/2026-03-27-token-use-limits/summary/token-usage-log.md` — diagnostic token usage log
- `/home/mike/.claude/chester-usage.log` — figure-out entries

**Known baselines from prior analysis:**
- Session start baseline: ~20,349 tokens
- Session after 65 calls: ~45,356 tokens (2.2x growth)
- Total input consumed in measured session: ~2.1M tokens
- Claude Code system prompt: ~16,193 tokens (80% of baseline)
- Chester components: ~4,156 tokens (20% of baseline)
- Per-subagent baseline overhead: ~20K tokens

- [ ] **Step 1: Read existing trace data**

Read:
- `/home/mike/.claude/skills/docs/chester/2026-03-26-token-diet-skills/token-diet-skills-audit-00.md`
- `/home/mike/.claude/skills/docs/chester/2026-03-26-token-diet-skills/token-diet-skills-summary-00.md`
- `/home/mike/.claude/skills/docs/chester/2026-03-27-token-use-limits/spec/token-use-limits-spec-00.md`
- `/home/mike/.claude/skills/docs/chester/2026-03-27-token-use-limits/summary/token-usage-log.md`
- `/home/mike/.claude/chester-usage.log`

Note: Some of these files may have been deleted or moved. Read what exists, skip what doesn't.

- [ ] **Step 2: Estimate per-stage token usage**

For each of the 13 stages, estimate:
- Total input tokens consumed (based on number of API calls × average context size at that point)
- Total output tokens generated
- Number of API calls (count tool uses from skill structure)
- Subagent launches (from skill architecture)
- Baseline overhead per subagent (~20K)
- Context utilization at entry and exit (as % of 1M window)
- Cache-eligible fraction (stable prefix / total input)
- D(U) regime (which degradation zone the stage operates in)

Use existing empirical data where available. For stages without data, estimate from the skill's structure (number of steps, expected conversation turns, subagent dispatch patterns). Label all estimates clearly.

- [ ] **Step 3: Write Section 5.1 — Data Collection Methodology**

Describe what data was available, what was estimated, how estimates were derived. Be explicit about Category A vs. Category C.

- [ ] **Step 4: Write Section 5.2 — Per-Stage Trace Tables**

For each stage, present the trace table from the spec (input tokens, output tokens, API calls, subagent launches, baseline overhead, context utilization, cache-eligible fraction, D(U) regime).

- [ ] **Step 5: Write Section 5.3 — Aggregate Analysis**

- Total pipeline token consumption for a representative 10-task plan run
- Breakdown by stage as percentage of total
- Top 3 token-consuming stages identified
- Baseline overhead as percentage of total (the multi-agent tax)
- Cache-eligible tokens as percentage of total (theoretical maximum caching benefit)

- [ ] **Step 6: Self-review**

Verify: Are estimates clearly labeled as estimates? Are empirical values correctly attributed? Do the per-stage numbers sum to a plausible total? Is the aggregate analysis consistent with the known ~2.1M total from the baseline measurement?

- [ ] **Step 7: Commit**

```bash
git add /home/mike/.claude/skills/docs/chester/2026-03-28-chester-optimization-research/sections/05-trace-analysis.md
git commit -m "paper: write trace analysis section"
```

---

### Task 6: Write Section 6 — Cross-Correlations

**Files:**
- Create: `/home/mike/.claude/skills/docs/chester/2026-03-28-chester-optimization-research/sections/06-cross-correlations.md`

**Context for implementer:**
Map dependencies between stages. This section connects the individual assessments from Sections 4 and 5 into a system-level view.

- [ ] **Step 1: Read Sections 4 and 5**

Read the completed qualitative framework and trace analysis sections to understand each stage's profile.

- [ ] **Step 2: Map the dependency graph**

Identify all dependencies between the 13 stages:
- **Hard dependencies:** Stage B cannot start until Stage A completes (e.g., build-plan requires build-spec)
- **Quality dependencies:** Stage B's effectiveness is bounded by Stage A's output quality
- **Token dependencies:** Stage A's output volume drives Stage B's input cost

Present as a dependency table or textual graph.

- [ ] **Step 3: Analyze quality propagation**

Where does a quality deficiency in one stage most severely impact downstream P(success)? Identify the critical path — the chain where quality degradation has the highest multiplicative effect.

- [ ] **Step 4: Analyze token propagation**

Where does output verbosity in one stage inflate costs in downstream stages? For example: does a verbose design brief increase spec-writing cost, which increases plan-writing cost?

- [ ] **Step 5: Identify shared resource contention**

Do any stages compete for the same context budget within the orchestrator's window? How does the orchestrator's own context growth affect downstream stages?

- [ ] **Step 6: Write the section**

Write `/home/mike/.claude/skills/docs/chester/2026-03-28-chester-optimization-research/sections/06-cross-correlations.md` with the dependency graph, quality propagation analysis, token propagation analysis, and shared resource contention findings.

Target length: 800-1200 words.

- [ ] **Step 7: Self-review and commit**

```bash
git add /home/mike/.claude/skills/docs/chester/2026-03-28-chester-optimization-research/sections/06-cross-correlations.md
git commit -m "paper: write cross-correlations section"
```

---

### Task 7: Write Section 7 — Counter-Analysis and Limitations

**Files:**
- Create: `/home/mike/.claude/skills/docs/chester/2026-03-28-chester-optimization-research/sections/07-counter-analysis.md`

**Context for implementer:**
Honest assessment of what this analysis can and cannot claim. Follow the source paper's epistemological discipline.

- [ ] **Step 1: Read Sections 4-6**

Read the completed analysis sections to understand what claims are being made.

- [ ] **Step 2: Write the counter-analysis**

Write `/home/mike/.claude/skills/docs/chester/2026-03-28-chester-optimization-research/sections/07-counter-analysis.md` addressing:

**Framework fit:** The source paper's dimensions were designed for production API deployments. Where do they map poorly to Chester's skill-driven pipeline? Are there Chester-specific dimensions the framework misses?

**Measurement limitations:** Which trace values are empirical (Category A), which are analytically derived (B), which are estimates (C)? What would change if we had Category A data for everything?

**Single-user bias:** Chester is used by one developer on one model (Claude Opus, 1M context). How does this constrain generalizability? Would a different user, model, or context window change the dimension assessments?

**Stationarity assumption:** Chester is under active development. Which assessments are most sensitive to future skill changes?

**Goodhart's Law:** If Chester optimizes toward the metrics identified here, which metrics are most likely to become poor proxies? (e.g., if we optimize for cache-eligible fraction, do we risk over-stabilizing prompts at the expense of adaptability?)

Target length: 600-900 words.

- [ ] **Step 3: Self-review and commit**

```bash
git add /home/mike/.claude/skills/docs/chester/2026-03-28-chester-optimization-research/sections/07-counter-analysis.md
git commit -m "paper: write counter-analysis section"
```

---

### Task 8: Write Section 8 — Conclusions

**Files:**
- Create: `/home/mike/.claude/skills/docs/chester/2026-03-28-chester-optimization-research/sections/08-conclusions.md`

**Context for implementer:**
Synthesize findings from all prior sections into actionable conclusions.

- [ ] **Step 1: Read all prior sections**

Read Sections 1-7 to have the full analysis in context.

- [ ] **Step 2: Write the conclusions**

Write `/home/mike/.claude/skills/docs/chester/2026-03-28-chester-optimization-research/sections/08-conclusions.md` covering:

**Per-stage configuration summary table:** All 13 stages, all 5 dimensions, configuration classification — one consolidated view.

**Top intervention priorities:** Ranked by expected AER impact. For each:
- What the intervention is
- Which stages it affects
- Expected direction of impact on Q, P(success), and E[C_api]
- Whether it's a Tier 1 (universal, no quality tradeoff), Tier 2 (quality at modest cost), or Tier 3 (architectural, gated by framework) intervention per the source paper's scheme

**Measurement recommendations:** What Chester should track going forward to move from Category C estimates to Category A empirical findings. Specific metrics, not aspirational goals. Note the API token usage data availability (per-call input_tokens, output_tokens, cache_read_input_tokens) as a known capability for future measurement infrastructure.

**Future work:** Which optimization experiments the analysis suggests are most promising. Reference the existing reviewer consolidation work at `/home/mike/.claude/skills/docs/chester/2026-03-27-token-use-limits/` if relevant.

Target length: 800-1200 words.

- [ ] **Step 3: Self-review and commit**

```bash
git add /home/mike/.claude/skills/docs/chester/2026-03-28-chester-optimization-research/sections/08-conclusions.md
git commit -m "paper: write conclusions section"
```

---

### Task 9: Assemble and Convert to .docx

**Files:**
- Create: `/home/mike/.claude/skills/docs/chester/2026-03-28-chester-optimization-research/assembled-paper.md`
- Create: `/home/mike/.claude/skills/docs/chester/2026-03-28-chester-optimization-research/chester-optimization-research.docx`

**Context for implementer:**
Assemble all sections into a single document and convert to .docx format.

- [ ] **Step 1: Assemble markdown**

Concatenate all section files from `/home/mike/.claude/skills/docs/chester/2026-03-28-chester-optimization-research/sections/` in order (01 through 08) into `assembled-paper.md`. Add:
- Title page: "AI Agent Effectiveness Review of the CHESTER Multi-Agent System Under Token Cost Constraints"
- Authors: Mike and Claude
- Date: March 2026
- "Revised Edition" note if applicable

- [ ] **Step 2: Convert to .docx**

Use python-docx to convert the assembled markdown to .docx:

```python
# Install if needed: pip3 install python-docx markdown
from docx import Document
from docx.shared import Pt, Inches
import markdown
import re

OUTPUT_DIR = '/home/mike/.claude/skills/docs/chester/2026-03-28-chester-optimization-research'

# Read assembled markdown
with open(f'{OUTPUT_DIR}/assembled-paper.md', 'r') as f:
    md_content = f.read()

# Create .docx with basic formatting
doc = Document()
# ... (parse markdown headings, paragraphs, tables into docx elements)
doc.save(f'{OUTPUT_DIR}/chester-optimization-research.docx')
```

Note: The conversion doesn't need to be publication-quality. Readable, properly structured, tables intact. If pandoc is available (`which pandoc`), prefer: `pandoc /home/mike/.claude/skills/docs/chester/2026-03-28-chester-optimization-research/assembled-paper.md -o /home/mike/.claude/skills/docs/chester/2026-03-28-chester-optimization-research/chester-optimization-research.docx`

- [ ] **Step 3: Verify .docx**

Confirm the file exists, has reasonable size, and the conversion didn't corrupt structure.

- [ ] **Step 4: Commit**

```bash
git add /home/mike/.claude/skills/docs/chester/2026-03-28-chester-optimization-research/
git commit -m "paper: assemble and convert to docx"
```
