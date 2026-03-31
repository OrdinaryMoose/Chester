# AI Agent Effectiveness Review of the CHESTER Multi-Agent System Under Token Cost Constraints

**Authors:** Mike and Claude
**Date:** March 2026

---

# 1. Introduction

This paper is an applied case study. It takes the analytical framework developed in "Optimizing AI Agent Effectiveness Under Token Cost Constraints: A Conceptual and Qualitative Framework for Agentic System Design" (v2, March 2026) and applies it to a specific system: Chester, a multi-agent development workflow for Claude Code. The source paper provides the instruments. This paper uses them to produce a formal effectiveness profile of Chester's architecture, stage by stage.

## What Is Being Analyzed

Chester is a thirteen-stage pipeline that manages the full lifecycle of a development task — from problem discovery through implementation to documentation. The pipeline includes a Socratic design interview (`figure-out`), specification formalization (`build-spec`), adversarial plan creation (`build-plan`), subagent-driven implementation (`write-code`), and structured completion (`finish-plan`), supported by specialized skills for adversarial review, code smell prediction, TDD enforcement, debugging, verification, code review handling, subagent coordination, and documentation maintenance. Each stage operates with its own mandate: some run as single-context operations within the orchestrator's session, others dispatch parallel subagents that start with fresh context windows.

Chester is not a production API deployment in the sense the source paper targets. It is a skill-driven development companion used by a solo developer on a single model tier. This difference matters for how the framework's dimensions map to Chester's context, and the paper addresses this gap explicitly.

## Why This Analysis

Chester's token consumption is substantial — a full pipeline run through all primary stages can consume millions of tokens across the orchestrator and its subagents. Prior informal analysis established that Chester's overhead is approximately twenty percent above baseline Claude Code usage, and concluded that ad-hoc optimization was not worth pursuing. This paper replaces that informal assessment with a structured one.

The goal is not to reduce Chester's token cost. The goal is to produce an architectural specification — a formal effectiveness profile — so that any future optimization work has a rigorous analytical foundation rather than intuition. Where should interventions apply? Which stages would benefit from which strategies? Where would cost reduction degrade effectiveness? These questions require the kind of structured reasoning the source paper's framework was designed to support.

## Instruments Used

Two analytical instruments from the source paper are applied here.

The **qualitative decision framework** (source Section 5) provides the primary analytical tool. Five diagnostic dimensions — Task Decomposability, Context Stability, Success Observability, Volume and Frequency, and Task Stakes — are assessed for each Chester pipeline stage at three levels (High, Medium, Low). The resulting dimension profiles are classified into one of four strategy configurations (A: Production Optimization, B: Active Development, C: High-Stakes Single-Agent, D: Multi-Agent), each carrying specific recommendations about where and how to manage token cost. The dimension definitions have been adapted for Chester's context: "Volume and Frequency" means something different for a developer tool invoked a few times per day than for a production API handling thousands of requests per hour.

**Trace analysis** provides computational grounding. Real token usage data from prior Chester sessions is collected where available and fresh traces are generated where data is missing or stale. This produces per-stage measurements of input tokens, output tokens, API call counts, subagent overhead, context utilization, and cache-eligible fractions. The trace data anchors the qualitative assessments in observed behavior rather than pure analytical reasoning.

## Epistemological Stance

The source paper distinguishes three categories of findings: Category A (published empirical research), Category B (analytically derived from documented facts), and Category C (illustrative estimates from the conceptual model). This paper operates primarily in Categories B and C. The qualitative dimension assessments are Category B — they are analytical conclusions derived from Chester's documented architecture and observed behavior, not from controlled experiments. The strategy classifications and their implications are also Category B. The trace analysis produces Category A findings where real token data is measured, but per-stage effectiveness estimates (P(success), Q) remain Category C — reasoned estimates that should not be cited as measurements.

This distinction is maintained throughout. Where the paper states a finding, it identifies whether the finding was measured, derived, or estimated.

## Scope

This analysis covers Chester as deployed on Claude Opus with a one-million-token context window, used by a single developer. The model tier is fixed — Chester does not implement model routing. The context window size affects where D(U) thresholds apply and how much baseline overhead matters as a fraction of available context. The single-user deployment means the analysis cannot speak to how Chester's effectiveness profile would change under team use or with different interaction patterns.

Thirteen pipeline stages are assessed individually. Cross-correlations between stages — where one stage's output quality or volume affects another stage's effectiveness or cost — are mapped after individual assessments are complete.

## Paper Structure

Section 2 summarizes the source paper's analytical instruments for readers who have not read it, without reproducing it. Section 3 describes Chester's architecture in enough detail to ground the per-stage assessments. Section 4 applies the qualitative decision framework to each of Chester's thirteen stages and groups stages by configuration classification. Section 5 presents the trace analysis with per-stage token measurements and aggregate pipeline costs. Section 6 maps cross-correlations and dependency chains between stages. Section 7 provides counter-analysis and an honest assessment of the framework's limitations when applied to Chester. Section 8 presents conclusions, intervention priorities, and recommendations for what to measure next.


# 2. Background: Instruments from the Source Framework

This section summarizes the analytical instruments from "Optimizing AI Agent Effectiveness Under Token Cost Constraints" (v2, March 2026) that are applied in this paper. The summaries provide enough context to follow the per-stage assessments in Section 4 and the trace analysis in Section 5. Readers should consult the source paper for full derivations, indicator tables, and implementation details.

## Total Cost of Ownership

The source paper frames all cost analysis within a Total Cost of Ownership model:

    TCO = C_api + C_human + C_remediation

C_api is the total API token cost across all calls. C_human is developer oversight and review time valued at labor rate. C_remediation is the cost of correcting agent errors that reach production or corrupt working state. The source paper is explicit that C_human dominates TCO in most organizations — a senior engineer reviewing agent output at loaded cost rates spends more in fifteen minutes of review than a typical week of API calls costs. C_api optimization is valuable because it is tractable and because it frees engineering attention, not because it is the largest cost driver. C_remediation is the hardest to estimate and the most consequential: confidently incorrect output that passes automated checks can generate remediation costs orders of magnitude larger than C_api.

This framing matters for the Chester analysis because Chester's pipeline includes explicit human review checkpoints (spec approval, plan approval, merge decision) that are C_human costs by design, not inefficiencies to be optimized away.

## The Agent Efficiency Ratio

The AER is presented in the source paper as a conceptual instrument — an idea formula in the tradition of the Drake Equation — that names the variables governing cost-effectiveness and specifies their directional relationships:

    AER = (Q * P(success)) / E[C_api]

Q is the automated metric quality score in [0,1], conditional on task completion — test passage rate, static analysis score, format compliance. It is explicitly not actual quality; the gap between Q and actual quality is irreducible without human evaluation. P(success) is the probability of task completion without human correction. E[C_api] is the expected total API cost including retry attempts.

The source paper is emphatic that AER is a reasoning scaffold, not a computational tool. Its key inputs resist precise measurement, and presenting specific computed values would be false precision. The formula earns its value by structuring thinking about which variables matter and how they interact — particularly the insight that interventions increasing P(success) while holding per-call cost constant are always beneficial in expected cost terms, because retry cost savings dominate.

The expected cost model expands E[C_api] to include failure and state corruption:

    E[C_api] = C_call * (1 / P(success))
             + C_corrupt * P(state_corruption | failure) * (1/P(success) - 1)

The state corruption term is critical for coding agents with filesystem and version control access. Failed attempts frequently produce partially modified files, broken build states, or misleading intermediate commits. Restoring clean state before retry can cost more in developer time than the API cost of the retry itself. This term varies by task type: planning tasks carry low corruption risk; file-modifying implementation tasks carry high corruption risk.

## Context Degradation: D(U)

The source paper models context rot through a degradation function D(U), where U is the fraction of the context window currently in use. D(U) is a parameterized approximation calibrated to empirical research, not a precisely measured function:

    D(U) ~ 1.0                           for U <= 0.30   (negligible degradation)
    D(U) ~ 1.0 - a * (U - 0.30)          for 0.30 < U <= 0.50  (U-shaped regime)
    D(U) ~ D(0.50) - b * (U - 0.50)      for U > 0.50   (recency-bias regime)

Three regimes govern behavior. Below thirty percent context utilization, degradation is negligible — the model attends well to all content. Between thirty and fifty percent, the classic U-shaped lost-in-the-middle effect applies: information at the beginning and end of context is attended to more strongly than information in the middle. Above fifty percent, the pattern shifts to pure recency bias — the model favors the most recent tokens, and early tokens including the system prompt become the least reliable information in the window.

Empirical bounds from the literature place D(1.0) between 0.15 and 0.87 across studied models and tasks — meaning a fully utilized context window retains between fifteen and eighty-seven percent of peak quality depending on the model and task. Conservative planning values recommended by the source paper: D(0.50) is approximately 0.80, D(0.75) is approximately 0.65. Claude models show the slowest degradation among those studied but are not immune.

The practical implication — act before fifty percent context fill — is robust to reasonable parameter uncertainty. This threshold drives several of the per-stage findings in Section 4.

## Five Diagnostic Dimensions

The source paper's qualitative decision framework uses structured focused comparison — a method from comparative political science for systematic case analysis without quantitative data. Five diagnostic dimensions, derived from the conceptual model, are assessed at three levels (High, Medium, Low) to produce a configuration that maps to a recommended strategy.

**Task Decomposability** asks whether the task can be broken into discrete, independently verifiable sub-tasks with explicit interface contracts. High decomposability means clean boundaries and independent verification; low means the task requires holistic reasoning across a single context.

**Context Stability** asks whether the system prompt and stable context remain unchanged across the deployment period. High stability enables prompt caching at theoretical efficiency; low stability (frequent prompt iteration) can reduce cache hit rates to near zero.

**Success Observability** asks whether the practitioner can determine, with reasonable confidence and without extended delay, whether an agent task succeeded. High observability means automated verification (tests pass, build succeeds); low means success requires extended human evaluation.

**Volume and Frequency** asks about call volume and temporal pattern. High volume at consistent frequency maximizes cache hit rates and amortizes engineering investment; low or bursty volume reduces the return on optimization work.

**Task Stakes** asks about the consequences of agent error. High stakes mean C_remediation dominates all token cost savings; low stakes mean errors are cheap to detect and fix.

Each dimension has detailed indicator tables in the source paper (Section 5.2) specifying observable criteria for each level. The per-stage assessments in Section 4 of this paper reference those indicators but do not reproduce them.

## Four Strategy Configurations

Dimension profiles map to four strategy configurations, each carrying specific recommendations:

**Configuration A — Production Optimization.** High decomposability, high context stability, high observability, high volume, low-to-medium stakes. The case where cost optimization provides the most value and least risk. Priority: prompt caching, constraint framing, model routing, batch API for non-interactive work.

**Configuration B — Active Development.** Any decomposability, low context stability, medium-to-high observability, low-to-medium volume, low stakes. Prompt caching provides minimal benefit when the system prompt changes frequently. Priority: constraint quality over architecture, measurement baseline before optimization, defer caching until prompt stabilizes.

**Configuration C — High-Stakes Single-Agent.** Low-to-medium decomposability, any context stability, low observability, any volume, high stakes. AER should not be the primary optimization target. C_remediation dominates all token savings. Priority: human checkpoints at decision boundaries, structured output for reviewability, cost optimization as secondary concern.

**Configuration D — Multi-Agent.** Requires high decomposability, high context stability, high observability, high volume, low-to-medium stakes. The source paper specifies five sequential gates — failure on any one is sufficient to recommend against multi-agent architecture: (1) the task cannot be completed within forty percent of a single context window without quality degradation; (2) sub-tasks have explicit, testable interface contracts without shared mutable state; (3) sub-tasks can execute in parallel without sequential dependencies; (4) sub-agent errors are catchable at integration time before compounding; (5) measured single-agent P(success) is below seventy-five percent despite caching and constraint optimization.

The source paper notes that when both architectures use prompt caching, the cost gap between single-agent and multi-agent narrows from approximately 7x to approximately 1.7x — a correction from earlier treatments that compared cached single-agent against uncached multi-agent.

These configurations are types, not algorithms. A partial match is informative even when exact match is unavailable. This flexibility is important for the Chester analysis, where several stages partially match multiple configurations.


# 3. Chester: System Under Analysis

This section introduces Chester as the subject system for the applied analysis. It describes the pipeline architecture, multi-agent design, and cost structure in enough detail that a reader who has never used Chester can follow the per-stage assessments in Section 4 and the trace analysis in Section 5.

## What Chester Does

Chester is a development workflow system built as a skill layer on top of Claude Code, Anthropic's CLI agent. It replaces the common pattern of asking an AI agent to "build this feature" with a structured pipeline that separates discovery, specification, planning, adversarial review, implementation, and verification into distinct stages. Each stage produces a written artifact — a design brief, a specification, an implementation plan, task-level reports — that becomes the input to the next stage.

The system is designed for a solo developer working with Claude Code on a personal or small-team codebase. It prioritizes correctness and auditability over speed: the pipeline imposes human approval gates at three points (design sign-off, spec approval, plan approval with risk assessment), and every stage commits its artifacts to version control before proceeding. A typical Chester run for a ten-task feature takes two to four hours of wall-clock time, most of it unattended.

## Pipeline Architecture

Chester's pipeline consists of five core stages that execute in strict sequence, supported by review skills and utility skills that are invoked within specific stages.

### Core Pipeline

**chester-figure-out** conducts a Socratic design interview. The agent acts as a software architect, asking one question per turn from six question types (clarifying, assumption-probing, evidence/reasoning, viewpoint/perspective, implication/consequence, meta). The interview produces a design brief documenting all resolved decisions and their rationale. This stage requires active human participation — it is the primary mechanism for aligning the agent's understanding to the developer's intent.

**chester-build-spec** formalizes the design brief into a structured specification. The spec goes through an automated review loop (up to three iterations with a subagent reviewer) followed by a human approval gate. The spec covers architecture, components, data flow, error handling, testing strategy, constraints, and non-goals. Nothing proceeds until the human approves.

**chester-build-plan** transforms the approved spec into a task-by-task implementation plan. Each task specifies exact file paths, complete code (not pseudocode or stubs), test-driven development steps, and shell commands with expected output. After an internal review loop, the plan enters a mandatory hardening gate where chester-attack-plan and chester-smell-code run in parallel to stress-test it. The combined risk assessment is presented to the human, who decides whether to proceed, request mitigations, return to design, or stop.

**chester-write-code** executes the approved plan. In its recommended mode, it dispatches a fresh subagent for each task, followed by two review subagents (spec compliance and code quality). All work happens in a git worktree isolated from the main branch. Each task is committed independently before proceeding to the next.

**chester-finish-plan** runs the full test suite, checks for stale documentation, and presents the developer with options: merge locally, open a pull request, keep the branch, or discard it. It also generates a session summary and archives the plan alongside the design artifacts.

### Review Skills

Two review skills provide adversarial analysis during the plan hardening gate:

**chester-attack-plan** launches six parallel subagents, each attacking the plan from a different angle: structural integrity (do the file paths and interfaces actually exist?), execution risk (what breaks if a step fails partway?), assumptions and edge cases (what does the plan take for granted?), migration completeness (are all call sites accounted for?), API surface compatibility (do contract changes break downstream callers?), and concurrency/thread safety (are there race conditions or deadlock risks?). Each agent searches the actual codebase for evidence — findings without file paths and line numbers are discarded. The six reports are synthesized into a single threat report with a combined risk level.

**chester-smell-code** launches four parallel subagents that predict code smells the plan would introduce: bloaters and dispensables (long methods, duplicate code, speculative generality), couplers and OO abusers (feature envy, inappropriate intimacy, refused bequest), change preventers (divergent change, shotgun surgery), and SOLID violations. Overlapping findings across agents are deduplicated during synthesis.

### Development Discipline Skills

Three skills enforce development discipline at the task level:

**chester-test-first** enforces test-driven development: the failing test must exist before any implementation code is written. **chester-fix-bugs** requires root cause investigation before any fix attempt. **chester-prove-work** requires running verification commands and confirming output before claiming work is complete.

### Utility Skills

**chester-dispatch-agents** provides the parallel coordination pattern used by attack-plan, smell-code, and write-code. **chester-doc-sync** detects documentation that has gone stale after implementation changes. **chester-make-worktree** creates the isolated git worktree where all implementation work happens. **chester-review-code** handles code review feedback with verification requirements. **chester-write-summary** and **chester-trace-reasoning** produce end-of-session documentation.

## Multi-Agent Design

Chester's architecture is fundamentally multi-agent. Rather than maintaining a single long-running context that accumulates all pipeline state, Chester dispatches specialized subagents with narrow scope and reviews their output before proceeding.

### Subagent Model in Write-Code

For each task in the implementation plan, chester-write-code dispatches three subagents sequentially:

1. An **implementer** subagent receives the full task description, architectural context, and dependencies. It writes code, writes tests, runs them, and commits. It returns a status code (DONE, DONE_WITH_CONCERNS, NEEDS_CONTEXT, or BLOCKED) and a report of what it did.
2. A **spec compliance reviewer** receives the task requirements and the implementer's report. It verifies that the implementation matches the spec and that the commit history is clean.
3. A **code quality reviewer** receives the implementation and checks for critical issues (must fix), important issues (should fix), and minor issues (note and move on).

Each subagent starts with a fresh context. The implementer does not inherit the previous task's conversation history. The reviewers do not inherit the implementer's reasoning — they receive only the artifacts (code, tests, commits, reports).

### Parallel Dispatch in Review Skills

chester-attack-plan dispatches six agents simultaneously, each with a different attack mission. chester-smell-code dispatches four agents simultaneously, each focused on a different smell category. All review agents operate in read-only mode (they search and read the codebase but cannot modify files). Their findings are synthesized by the orchestrating agent after all parallel agents return.

### Context Isolation

Every subagent starts with approximately 20,000 tokens of baseline context: the system prompt, skill instructions, and task-specific payload. This is by design. A fresh context means no accumulated confusion from prior tasks, no context window pressure from irrelevant history, and independent verification — each reviewer forms its own assessment without being anchored by the implementer's framing.

### Structured Checkpoints

The pipeline stages connect through written artifacts, not shared context:

- chester-figure-out produces a **design brief** (written to disk, committed)
- chester-build-spec produces a **specification** (written to disk, committed)
- chester-build-plan produces an **implementation plan** (written to disk, committed)
- chester-write-code produces **per-task commit reports** (tracked in the orchestrator's context)
- chester-finish-plan produces a **session summary** (written to disk, committed)

Each artifact is the complete interface between stages. A stage reads the previous artifact from disk; it does not depend on conversational context from the previous stage's session.

## Cost Structure

The multi-agent design carries a measurable token overhead. Each subagent invocation loads roughly 20,000 tokens of baseline context regardless of task complexity.

For a typical ten-task implementation plan, chester-write-code dispatches:

- 10 implementer subagents
- 10 spec compliance reviewers
- 10 code quality reviewers
- 1 final code reviewer
- Plus 6 attack-plan agents and 4 smell-code agents during plan hardening
- Plus 2 spec review agents during build-spec

That is approximately 43 subagent invocations. At 20,000 tokens of baseline overhead each, the structural cost is roughly 860,000 tokens before any task-specific work begins. Actual runs are higher: implementer subagents consume additional tokens proportional to task complexity, and review agents consume tokens proportional to the code they read.

This is the core tradeoff Chester makes: it pays a significant token cost in exchange for context isolation, independent verification, and failure containment. A single-context alternative could complete the same work with lower total token consumption but would face context degradation (see D(U) in Section 2), accumulated confusion across tasks, and no independent review.

Whether this tradeoff is favorable depends on where the system sits across the five diagnostic dimensions. The per-stage assessments in Section 4 evaluate this systematically.

## Pipeline Stages Under Analysis

The following table lists all thirteen stages assessed in this paper.

| Stage | Function |
|---|---|
| chester-figure-out | Socratic design interview with human; produces design brief |
| chester-build-spec | Formalizes design into reviewed specification |
| chester-build-plan | Creates task-level implementation plan with TDD steps |
| chester-write-code | Dispatches per-task implementer and reviewer subagents |
| chester-finish-plan | Final verification, documentation sync, merge/PR decision |
| chester-attack-plan | Six parallel agents stress-testing plan feasibility |
| chester-smell-code | Four parallel agents predicting introduced code smells |
| chester-test-first | Enforces failing test before implementation code |
| chester-fix-bugs | Requires root cause investigation before any fix |
| chester-prove-work | Requires verification evidence before success claims |
| chester-review-code | Handles code review feedback with technical rigor |
| chester-dispatch-agents | Parallel subagent coordination pattern |
| chester-doc-sync | Detects stale documentation after implementation |


# 4. Qualitative Framework Applied to Chester

This section applies the source paper's five diagnostic dimensions to each of Chester's thirteen pipeline stages individually, classifies each stage into a strategy configuration, and identifies where Chester's current implementation aligns with or diverges from the recommended strategy for that configuration.

## 4.1 Assessment Methodology

### Unit of Analysis

Each Chester pipeline stage is assessed individually against its own mandate. chester-write-code's effectiveness is evaluated on how well it implements a plan, not on whether the plan was good. chester-attack-plan is evaluated on whether it finds real weaknesses, not on whether the plan survives. This separation is essential: coupling a stage's assessment to the quality of its inputs conflates the stage's performance with its predecessor's performance.

### Adapted Dimension Definitions

The source paper's five diagnostic dimensions are adapted below for application to a skill-driven pipeline rather than a production API deployment.

| Dimension | What It Means for a Chester Stage |
|---|---|
| Task Decomposability | Can this stage's work be split across independent subagents without shared state or sequential dependencies? |
| Context Stability | Does the stage's prompt/skill content remain stable across invocations, or does it change with each project/session? |
| Success Observability | Can we tell whether this stage succeeded at its specific job -- not whether the overall pipeline succeeded? |
| Volume and Frequency | How often is this stage invoked per pipeline run, and how many API calls does it generate? |
| Task Stakes | What are the consequences if this stage produces incorrect output -- does the error compound downstream, or is it caught immediately? |

### Level Definitions

**Task Decomposability:**
- **High:** Stage work decomposes into 3+ independent sub-tasks with testable interfaces between them
- **Medium:** Some sub-tasks can be parallelized but share context or have ordering constraints
- **Low:** Stage work is a single coherent activity that loses quality if split

**Context Stability:**
- **High:** Stage's skill prompt is identical across all invocations; only project-specific input varies
- **Medium:** Skill prompt is stable but session context varies significantly between projects
- **Low:** Stage behavior adapts substantially based on conversation history or runtime state

**Success Observability:**
- **High:** Stage output has clear pass/fail criteria checkable without human judgment
- **Medium:** Output quality requires informed review but has defined criteria
- **Low:** Output quality is subjective or only apparent downstream

**Volume and Frequency:**
- **High:** 10+ API calls per pipeline run or invoked multiple times per run
- **Medium:** 3-9 API calls per run, invoked once
- **Low:** 1-2 API calls per run

**Task Stakes:**
- **High:** Error in this stage compounds through multiple downstream stages before detection
- **Medium:** Error is detectable within 1-2 downstream stages
- **Low:** Error is contained within the stage or immediately detectable

### Strategy Configurations

The four configurations from the source paper, summarized for reference:

- **Configuration A (Production Optimization):** High decomposability, high context stability, high success observability, high volume, low-medium stakes. Recommended strategy: optimize for throughput and caching; reduce per-call overhead.
- **Configuration B (Active Development):** Any decomposability, low context stability, medium-high observability, low-medium volume, low stakes. Recommended strategy: prioritize flexibility over structure; accept higher per-call cost for adaptability.
- **Configuration C (High-Stakes Single-Agent):** Low-medium decomposability, any stability, low observability, any volume, high stakes. Recommended strategy: single capable agent with minimal context overhead; invest in quality over throughput.
- **Configuration D (Multi-Agent):** High decomposability, high stability, high observability, high volume, low-medium stakes -- AND all five sequential gates pass. Recommended strategy: multi-agent dispatch with per-task isolation and independent verification.

---

## 4.2 Per-Stage Assessments

### 4.2.1 chester-figure-out

chester-figure-out conducts a Socratic design interview with the human developer. It asks one question per turn from six question types, tracks resolved and open decisions, and produces a design brief documenting all decisions and their rationale.

| Dimension | Level | Justification |
|---|---|---|
| Task Decomposability | Low | The interview is a single conversational thread where each question builds on the prior answer; splitting it across agents would destroy the coherence of the design exploration. |
| Context Stability | Medium | The skill prompt (question types, process flow, closure criteria) is stable across invocations, but the session context -- codebase state, user's answers, decision tree -- varies completely per project. |
| Success Observability | Low | Design brief quality is subjective and only apparent downstream when the spec, plan, and implementation reveal whether the right questions were asked and the right decisions reached. |
| Volume and Frequency | High | A typical interview involves 8-15 questions plus setup, codebase exploration, checkpoint summaries, and design brief writing, totaling approximately 15-25 API calls; invoked once per pipeline run. |
| Task Stakes | High | A flawed design brief propagates through specification, planning, and implementation -- every downstream stage operates on incorrect assumptions, with the error often not surfacing until code fails to meet actual requirements. |

**Configuration:** C (High-Stakes Single-Agent). The combination of low decomposability, low observability, and high stakes is the defining signature of Configuration C. The design interview is the highest-leverage stage in the pipeline: it determines what gets built.

**Strategy implication:** The source paper recommends investing in a single capable agent with minimal context overhead for Configuration C stages. Chester's current implementation aligns well: figure-out runs in the orchestrator's main context (not as a subagent), uses structured thinking MCP for complex decision nodes, and imposes no artificial decomposition. The one area of potential divergence is context growth -- a long interview accumulates substantial conversation history, which could push the orchestrator toward the D(U) degradation regime identified in the source paper. However, because the interview typically concludes before context utilization reaches 30%, this is a theoretical rather than practical concern for most sessions.

---

### 4.2.2 chester-build-spec

chester-build-spec formalizes the design brief into a structured specification covering architecture, components, data flow, error handling, testing strategy, constraints, and non-goals. The spec passes through an automated review loop (up to three iterations with a subagent reviewer) and a human approval gate.

| Dimension | Level | Justification |
|---|---|---|
| Task Decomposability | Low | The specification sections are interdependent -- architecture informs testing strategy, constraints inform non-goals -- and splitting them across agents would produce inconsistencies that the review loop would then need to resolve. |
| Context Stability | Medium | The skill prompt and review criteria are stable, but the design brief being formalized varies completely per project, and the review loop adapts based on the specific issues the reviewer finds. |
| Success Observability | Medium | The automated reviewer checks defined criteria (completeness, consistency, clarity, scope, YAGNI), and the human approval gate provides a binary decision, but "good spec" ultimately requires informed judgment about whether the spec captures the design intent. |
| Volume and Frequency | Medium | Writing the spec plus 1-3 review iterations plus the human review gate generates approximately 5-10 API calls; invoked once per pipeline run. |
| Task Stakes | High | Specification errors -- a missing requirement, a wrong constraint, an ambiguous interface -- propagate directly into the implementation plan and from there into every task in the code, compounding through multiple stages before detection. |

**Configuration:** C (High-Stakes Single-Agent). Same structural profile as figure-out: low decomposability, high stakes, with medium observability providing some mitigation through the review loop.

**Strategy implication:** The source paper recommends single capable agent with minimal context overhead. Chester aligns: the spec is written by the orchestrator (not delegated to a subagent), preserving the full design context from the figure-out session. The automated review loop is a lightweight quality gate, not a decomposition strategy. One notable alignment: Chester's use of a review subagent for spec validation matches the source paper's recommendation to invest in verification for high-stakes stages, even though the verification itself is low-cost relative to the writing.

---

### 4.2.3 chester-build-plan

chester-build-plan transforms the approved specification into a task-by-task implementation plan with exact file paths, complete code, TDD steps, and shell commands. After an internal review loop, the plan enters a mandatory hardening gate where chester-attack-plan (six agents) and chester-smell-code (four agents) run in parallel.

| Dimension | Level | Justification |
|---|---|---|
| Task Decomposability | Medium | Individual plan tasks could theoretically be written in parallel, but they share a common file structure map and have ordering dependencies; the review loop and hardening gate are inherently sequential. |
| Context Stability | Medium | The skill prompt, task template, and review criteria are stable, but the specification content and codebase structure that inform task design vary completely per project. |
| Success Observability | Medium | The plan review subagent, attack-plan, and smell-code provide structured feedback with defined severity levels, but plan quality is ultimately tested during implementation -- a plan can pass all reviews and still produce poor code if its task decomposition was subtly wrong. |
| Volume and Frequency | High | Writing plan tasks, the review loop (1-3 iterations), attack-plan dispatch (6 agents), smell-code dispatch (4 agents), synthesis, and the human risk presentation easily generate 20-30+ API calls per pipeline run. |
| Task Stakes | High | Plan errors -- wrong file paths, missing dependencies, incorrect task ordering, incomplete code -- propagate into every implementation task; a single ordering error can cascade into blocked subagents, wasted re-dispatches, and compounding context cost. |

**Configuration:** C (High-Stakes Single-Agent). Despite medium decomposability and high volume, the high stakes and the requirement for coherent cross-task reasoning dominate the classification. A plan where each task was written by a different agent without shared context would almost certainly produce inconsistencies at task boundaries.

**Strategy implication:** The source paper recommends single capable agent with quality investment for Configuration C. Chester aligns on the writing side (the plan is written by the orchestrator with full spec context) but diverges constructively on the verification side: the adversarial review uses multi-agent dispatch (Configuration D pattern) to stress-test the plan from six independent angles. This hybrid -- single-agent creation with multi-agent verification -- is not one of the source paper's four configurations but appears to be a natural pattern for high-stakes stages where the creation requires coherent reasoning but the review benefits from independent perspectives. The source paper's framework does not explicitly address this hybrid, which may represent a gap in the configuration taxonomy.

---

### 4.2.4 chester-write-code

chester-write-code executes the approved plan by dispatching a fresh subagent for each task (implementer), followed by two review subagents (spec compliance and code quality). Each subagent starts with a clean context. All work happens in an isolated git worktree.

| Dimension | Level | Justification |
|---|---|---|
| Task Decomposability | High | Each task is explicitly designed to be independent with testable interfaces (commit exists, tests pass, reviews pass); the plan's task boundaries are the decomposition boundaries. |
| Context Stability | High | The skill prompt and all three subagent templates (implementer, spec reviewer, quality reviewer) are identical across invocations; only the task-specific payload varies. |
| Success Observability | High | Each task has objective pass/fail criteria: tests pass, spec review passes, quality review passes, commit exists; failure at any gate is immediately visible and actionable. |
| Volume and Frequency | High | For a ten-task plan: 10 implementers + 10 spec reviewers + 10 quality reviewers + 1 final code reviewer = 31+ subagent invocations, each generating multiple API calls. |
| Task Stakes | Low-Medium | Errors in a single task are caught by the spec reviewer and quality reviewer within that same task cycle; error propagation is contained to at most the immediately adjacent task if a dependency was missed. |

**Configuration:** D (Multi-Agent). This is the textbook case for Configuration D: all five dimensions align with the multi-agent profile. High decomposability with testable interfaces, high context stability across invocations, high observability with objective pass/fail gates, high volume, and contained stakes.

**Strategy implication:** The source paper recommends multi-agent dispatch with per-task isolation and independent verification for Configuration D, and this is exactly what Chester implements. Each implementer gets a fresh context (no accumulated confusion), each reviewer forms an independent assessment (no anchoring to the implementer's framing), and failures are contained to the task level. Chester's current implementation is the strongest alignment with the source paper's recommendations across all thirteen stages.

The one area where Chester could further optimize under the source paper's guidance is caching: the baseline overhead (approximately 20,000 tokens per subagent of system prompt, skill instructions, and CLAUDE.md content) is identical across all subagent invocations within a pipeline run. The source paper identifies cache-eligible stable prefixes as a primary optimization target for Configuration D stages. Chester does not currently manage caching explicitly -- it relies on the underlying API's prompt caching behavior.

---

### 4.2.5 chester-finish-plan

chester-finish-plan runs the full test suite, verifies a clean working tree, presents the developer with four options (merge, PR, keep, discard), executes the chosen option, and optionally generates session artifacts.

| Dimension | Level | Justification |
|---|---|---|
| Task Decomposability | Low | The process is a sequential checklist where each step depends on the prior (cannot present merge options before verifying tests pass); the only parallelizable work is the optional artifact generation at the end. |
| Context Stability | High | The process is identical every time: verify tests, verify tree, present options, execute choice, clean up; only the branch name, test command, and user's choice vary. |
| Success Observability | High | Every gate is binary: tests pass or fail, tree is clean or not, option is selected or not, merge succeeds or fails; there is no subjective quality judgment. |
| Volume and Frequency | Low | Runs the test suite, executes git commands, presents options -- approximately 3-5 API calls; invoked once at the end of the pipeline. |
| Task Stakes | Low | This is the terminal pipeline stage with no downstream consumers; errors are immediately visible (merge fails, tests fail) and do not propagate. |

**Configuration:** A (Production Optimization), with caveats. The high stability, high observability, and low stakes align with Configuration A, but the low decomposability and low volume diverge. In practice, finish-plan is a lightweight verification and cleanup stage that does not warrant optimization effort -- it consumes a negligible fraction of total pipeline token cost.

**Strategy implication:** The source paper recommends throughput optimization and caching for Configuration A. Given finish-plan's low volume and negligible cost, neither recommendation produces meaningful savings. Chester's current implementation is appropriately simple. The stage's value is in its discipline (refusing to proceed with failing tests, requiring typed confirmation for discard) rather than in its token efficiency.

---

### 4.2.6 chester-attack-plan

chester-attack-plan launches six parallel subagents, each attacking the implementation plan from a different angle (structural integrity, execution risk, assumptions/edge cases, migration completeness, API surface compatibility, concurrency/thread safety). Findings are synthesized into a single threat report with a combined risk level.

| Dimension | Level | Justification |
|---|---|---|
| Task Decomposability | High | Six agents with completely independent attack missions, no shared state, no ordering dependencies; this is textbook parallel decomposition. |
| Context Stability | High | Each agent's prompt template is fixed; only the plan text injected into the template varies between invocations. |
| Success Observability | Medium | Individual findings are evidence-based (must cite file paths and line numbers -- findings without evidence are discarded), but the overall risk synthesis is a judgment call that requires cross-referencing findings across agents. |
| Volume and Frequency | High | Six parallel agents plus structured thinking synthesis generates 7-10+ API calls; invoked once per pipeline run during the plan hardening gate. |
| Task Stakes | Medium | If attack-plan misses a genuine weakness, the error surfaces during implementation (1-2 stages downstream); if it over-reports, the human approval gate filters false positives. |

**Configuration:** D (Multi-Agent). High decomposability, high stability, high volume, and medium stakes align with Configuration D. The medium observability is a slight divergence from the ideal D profile, driven by the subjective synthesis step.

**Strategy implication:** The source paper recommends multi-agent dispatch for Configuration D. Chester's implementation directly matches: six parallel read-only agents with independent contexts, followed by orchestrator-level synthesis using structured thinking to deduplicate and cross-reference. The read-only constraint (agents can search the codebase but cannot modify files) is an additional safeguard not explicitly addressed in the source paper's framework but consistent with the principle of containing risk in parallel dispatch.

One area of potential improvement: the synthesis step currently runs in the orchestrator's context, which means all six agents' findings must fit within the orchestrator's remaining context budget. For large codebases with many findings, this could create context pressure. The source paper's D(U) model would predict quality degradation if the synthesis pushes the orchestrator past the 30% utilization threshold.

---

### 4.2.7 chester-smell-code

chester-smell-code launches four parallel subagents predicting code smells the plan would introduce: bloaters/dispensables, couplers/OO abusers, change preventers, and SOLID violations. Findings are synthesized into a single smell report.

| Dimension | Level | Justification |
|---|---|---|
| Task Decomposability | High | Four agents with independent smell categories, no shared state; the only interaction is during synthesis where overlapping findings (e.g., Feature Envy and SRP violation on the same class) are deduplicated. |
| Context Stability | High | Each agent's prompt template is fixed; only the plan text varies between invocations. |
| Success Observability | Medium | Findings are evidence-based with severity classification, but the synthesis step and overall risk judgment require cross-category reasoning that is not mechanically verifiable. |
| Volume and Frequency | Medium | Four parallel agents plus synthesis generates 5-7 API calls; invoked once per pipeline run during the plan hardening gate. |
| Task Stakes | Medium | Missed code smells surface during implementation or code review (1-2 stages downstream); smell predictions are advisory and filtered by the human at the approval gate. |

**Configuration:** D (Multi-Agent). Same structural profile as attack-plan: high decomposability, high stability, medium observability. The slightly lower volume (four agents versus six) keeps it in the medium range but does not change the configuration classification.

**Strategy implication:** The source paper's recommendations for Configuration D apply. Chester's implementation matches: parallel read-only agents with structured thinking synthesis. The deduplication step (collapsing Refused Bequest findings with LSP violation findings when they target the same class) demonstrates a synthesis sophistication that the source paper's framework acknowledges as necessary for multi-agent configurations but does not provide detailed guidance on. Chester's use of structured thinking MCP to formalize the cross-agent deduplication is a practical implementation of this requirement.

---

### 4.2.8 chester-test-first

chester-test-first enforces TDD discipline: write the failing test, verify it fails, write minimal code, verify it passes, refactor. It is a behavioral protocol invoked per-task within chester-write-code, not a standalone API-call-generating stage.

| Dimension | Level | Justification |
|---|---|---|
| Task Decomposability | Low | The red-green-refactor cycle is a tight sequential loop where each step depends on the outcome of the previous; splitting it would break the cycle's verification logic. |
| Context Stability | High | The TDD process, rules, and verification checklist are identical across every invocation; only the specific feature being tested varies. |
| Success Observability | High | Test fails (red) then passes (green) -- this is the most objectively observable stage in the entire pipeline, with binary pass/fail at every gate. |
| Volume and Frequency | Low | Per invocation: write test, run test (fail), write code, run test (pass) -- approximately 2-4 API calls; the skill itself is a protocol governing the implementer's behavior rather than a standalone dispatch. |
| Task Stakes | Low | If TDD discipline lapses on one task, the spec compliance reviewer and code quality reviewer catch missing or inadequate tests within that same task cycle. |

**Configuration:** A (Production Optimization), with a significant caveat. The high stability, high observability, and low stakes align with Configuration A, but the low decomposability and low volume diverge. More fundamentally, chester-test-first is a behavioral constraint rather than a task-generating stage -- it governs how work is done within other stages rather than producing its own artifacts. The source paper's configuration taxonomy assumes stages that generate API calls and produce outputs; test-first's role as a discipline protocol fits awkwardly into this taxonomy.

**Strategy implication:** The source paper recommends throughput optimization for Configuration A. For a behavioral protocol, "throughput optimization" translates to minimizing the overhead of enforcing the discipline -- ensuring that the TDD verification steps (running tests, checking output) add the minimum necessary cost. Chester's current implementation is already lean: the protocol adds two test runs per task (verify fail, verify pass), each costing only the test execution time and a brief API call to confirm the result. There is no meaningful optimization to extract.

---

### 4.2.9 chester-fix-bugs

chester-fix-bugs requires systematic root cause investigation before any fix attempt. It enforces four phases: root cause investigation, pattern analysis, hypothesis testing, and implementation. The process adapts heavily to runtime state -- the specific error, the codebase context, and the debugging history all shape behavior.

| Dimension | Level | Justification |
|---|---|---|
| Task Decomposability | Low | Root cause investigation is inherently sequential: reproduce the bug, trace data flow, form hypothesis, test hypothesis; each step depends on findings from the previous, and splitting would lose the investigative thread. |
| Context Stability | Medium | The four-phase process is stable, but the actual debugging adapts substantially based on error output, codebase state, and the conversation history of prior failed hypotheses. |
| Success Observability | Medium | The bug is ultimately fixed or not (observable), but root cause identification quality is only apparent if the fix holds over time; the defined phases provide intermediate checkpoints but no definitive pass/fail gate until the fix is verified. |
| Volume and Frequency | Low | Invoked reactively when bugs are encountered, not as part of the standard pipeline flow; when invoked, generates 3-8 API calls depending on the complexity of the investigation. |
| Task Stakes | Medium | If the root cause is wrong, the fix will not hold and the bug will recur, but this is detectable within 1-2 stages (the next test run or the next session reveals the regression). |

**Configuration:** B (Active Development). The medium context stability (adapting to runtime state), medium observability, low volume, and medium stakes align with Configuration B. This is the classic reactive development pattern: the stage must be flexible enough to handle whatever bug appears, and imposing rigid structure beyond the four-phase framework would reduce effectiveness.

**Strategy implication:** The source paper recommends prioritizing flexibility over structure for Configuration B, accepting higher per-call cost for adaptability. Chester aligns well: the four phases provide enough structure to prevent guess-and-check thrashing, but within each phase the agent adapts freely to what it discovers. The think gate after each diagnostic step is a lightweight reasoning checkpoint, not a rigid protocol. Chester does not attempt to decompose debugging across subagents, which is correct -- debugging requires maintaining the full investigative thread in a single context.

---

### 4.2.10 chester-prove-work

chester-prove-work requires running verification commands and confirming output before making any success claims. It is a gate function: identify the verification command, run it, read the full output, confirm the claim, then (and only then) report the result.

| Dimension | Level | Justification |
|---|---|---|
| Task Decomposability | Low | The gate is a single sequential check: identify command, run, read output, verify; there is nothing to parallelize. |
| Context Stability | High | The gate function is identical every time; only the specific verification command and expected output vary. |
| Success Observability | High | The verification command either confirms the claim or does not -- this is a binary gate with no subjective judgment. |
| Volume and Frequency | Low | Each invocation generates 1-2 API calls (run command, report result); invoked multiple times per pipeline run but each invocation is minimal. |
| Task Stakes | Low | prove-work is the final check before the human sees the work; if it fails to catch an issue, the error is immediately visible to the human rather than compounding through further automated stages. |

**Configuration:** A (Production Optimization), with the same caveat as test-first. High stability, high observability, and low stakes align with A, but low decomposability and low volume diverge. Like test-first, prove-work is a behavioral gate rather than a task-generating stage. The source paper's configuration taxonomy does not have a natural home for lightweight verification protocols.

**Strategy implication:** The source paper recommends throughput optimization for Configuration A. For a verification gate, the relevant optimization would be reducing the cost of running the verification command -- but since the command itself (running tests, checking build output) is the irreducible work, there is no token-level optimization to extract. Chester's implementation is already minimal. The stage's value is entirely in its discipline, not in its token cost.

---

### 4.2.11 chester-review-code

chester-review-code handles incoming code review feedback with a structured response pattern: read, understand, verify against the codebase, evaluate technically, respond or push back, and implement one item at a time. It requires technical evaluation rather than performative agreement.

| Dimension | Level | Justification |
|---|---|---|
| Task Decomposability | Low | Review feedback items may be interdependent (understanding item 4 may require context from item 1); the skill explicitly warns against implementing understood items before clarifying unclear ones. |
| Context Stability | Medium | The response pattern is stable, but behavior adapts based on the specific review feedback, the codebase context, and whether the feedback conflicts with prior architectural decisions. |
| Success Observability | Medium | Review items are either addressed or not (observable), but the quality of the response -- whether pushback was warranted, whether implementation was technically sound -- requires informed judgment. |
| Volume and Frequency | Low | Invoked reactively when code review feedback arrives, not as part of the standard pipeline; generates 3-6 API calls per invocation depending on the number of review items. |
| Task Stakes | Low | Review feedback is typically the last check before merge; errors in handling individual review items are contained within the review cycle and do not propagate to downstream stages. |

**Configuration:** B (Active Development). Medium stability, medium observability, low volume, and low stakes align with Configuration B. Like fix-bugs, this is a reactive stage that must adapt to whatever feedback arrives.

**Strategy implication:** The source paper recommends flexibility over structure for Configuration B. Chester provides a structured response pattern (the six-step protocol) while allowing the agent to exercise judgment at each step -- particularly the push-back decision, which requires evaluating the reviewer's technical context against the codebase reality. This is appropriate: too much structure would produce blind agreement; too little would produce inconsistent responses. Chester's explicit prohibition on performative agreement ("Never: 'You're absolutely right!'") is a behavioral constraint that the source paper's framework does not address but that directly supports P(success) by preventing social compliance from overriding technical correctness.

---

### 4.2.12 chester-dispatch-agents

chester-dispatch-agents provides the parallel coordination pattern used by attack-plan, smell-code, write-code, and doc-sync. It is a meta-utility: it does not produce analytical content itself but manages the dispatch, monitoring, and collection of parallel subagent results.

| Dimension | Level | Justification |
|---|---|---|
| Task Decomposability | High | The skill's entire purpose is decomposition -- it splits work across parallel agents with independent contexts. |
| Context Stability | High | The dispatch pattern (identify independent domains, create focused tasks, dispatch in parallel, review and integrate) is identical across every invocation; only the agent payloads vary. |
| Success Observability | High | Agents return results or fail; the collection step verifies completeness; conflicts between agent outputs are detected during integration -- all checkable without subjective judgment. |
| Volume and Frequency | High | Invoked by multiple stages across a pipeline run: attack-plan (6 agents), smell-code (4 agents), write-code (30+ agents), doc-sync (3 agents) -- total invocations easily exceed 40 across a full run. |
| Task Stakes | Low | Dispatch failures are immediately visible (agent returns error or times out); a coordination failure does not silently propagate downstream because the calling stage checks results before proceeding. |

**Configuration:** D (Multi-Agent). This is, by definition, the multi-agent coordination mechanism. All five dimensions align with Configuration D: high decomposability, high stability, high observability, high volume, low stakes.

**Strategy implication:** The source paper recommends multi-agent dispatch with isolation and independent verification for Configuration D. chester-dispatch-agents is the implementation of this recommendation -- it is the mechanism through which Chester achieves the multi-agent pattern. The relevant optimization target from the source paper is reducing per-dispatch overhead: the baseline context loaded into each subagent (approximately 20,000 tokens) is the dominant cost driver for parallel invocations. Prompt caching of the stable prefix (system prompt + skill content + CLAUDE.md) would directly reduce this overhead, and dispatch-agents is the point in the architecture where such caching would have maximum leverage.

---

### 4.2.13 chester-doc-sync

chester-doc-sync detects documentation staleness after implementation by dispatching three parallel subagents: a CLAUDE.md staleness checker, an approved document conflict checker, and a documentation gap detector. Findings are synthesized into a report.

| Dimension | Level | Justification |
|---|---|---|
| Task Decomposability | High | Three independent subagents with distinct scopes (CLAUDE.md files, approved documents, documentation gaps); no shared state between them. |
| Context Stability | High | Subagent prompt templates are fixed; only the git diff summary and audit path vary between invocations. |
| Success Observability | Medium | Findings are structured with severity levels, but completeness -- whether the skill detected ALL stale documentation -- is not verifiable without exhaustive manual review. |
| Volume and Frequency | Medium | Three subagents plus synthesis plus optional fixes generates approximately 5-7 API calls; invoked once at pipeline end. |
| Task Stakes | Low | Documentation staleness does not affect code correctness; the worst outcome is that stale documentation persists until the next session or manual review. |

**Configuration:** A (Production Optimization), though the profile is ambiguous. High decomposability and high stability suggest D, but medium volume and low stakes pull toward A. The stage currently uses multi-agent dispatch (three parallel subagents), which is a Configuration D pattern applied to a Configuration A workload.

**Strategy implication:** The source paper would suggest that a stage with medium volume and low stakes does not warrant the overhead of multi-agent dispatch. The three-subagent architecture imposes approximately 60,000 tokens of baseline overhead (20,000 per subagent) for work that could plausibly be performed by a single agent in the orchestrator's context at lower total cost. This is the clearest case across all thirteen stages where Chester's current implementation diverges from the source paper's recommendations: the stage uses a Configuration D architecture where a Configuration A approach would likely suffice. Whether this divergence is costly depends on the absolute token budget available -- in a context where the pipeline's total cost is dominated by write-code's 30+ subagent invocations, the incremental cost of three doc-sync subagents may be negligible.

---

## 4.3 Stage Groupings

### By Configuration

**Configuration C (High-Stakes Single-Agent): chester-figure-out, chester-build-spec, chester-build-plan**

The three upstream design stages share a common profile: low decomposability, high stakes, and medium-to-low observability. These are the stages where the most consequential decisions are made -- what to build, how to specify it, how to plan the implementation. Errors at these stages have the longest propagation path before detection.

All three run in the orchestrator's main context rather than as subagents, which aligns with the source paper's recommendation for Configuration C. The design intent is clear: these stages require coherent reasoning across the full problem space, and context isolation (the defining feature of Chester's multi-agent architecture) would be counterproductive here.

Chester's hybrid approach for build-plan -- single-agent creation with multi-agent verification via attack-plan and smell-code -- is a pattern worth noting. It applies Configuration D techniques to the verification of a Configuration C stage, capturing the benefits of independent review without sacrificing the coherent reasoning needed for plan creation.

**Configuration D (Multi-Agent): chester-write-code, chester-attack-plan, chester-smell-code, chester-dispatch-agents**

The execution and review stages share a common profile: high decomposability, high context stability, high volume, and contained stakes. These stages represent the bulk of Chester's token expenditure and are the stages where the multi-agent architecture delivers its primary value: context isolation prevents accumulated confusion, independent review catches errors that a single agent might normalize, and failure is contained to individual tasks.

chester-write-code is the strongest Configuration D fit across all thirteen stages, and it is also the largest single consumer of tokens. This alignment is significant: the source paper's recommendations for Configuration D -- prompt caching, per-task isolation, independent verification -- have maximum leverage on the highest-cost stage.

**Configuration A (Production Optimization): chester-finish-plan, chester-test-first, chester-prove-work, chester-doc-sync**

The verification and cleanup stages share a common profile: high stability, high observability, and low stakes. They are lightweight stages that enforce discipline (test-first, prove-work), perform final checks (finish-plan), or handle ancillary work (doc-sync).

Three of the four (test-first, prove-work, finish-plan) are behavioral protocols or sequential checklists with low volume and low decomposability, which means the "production optimization" label is somewhat misleading -- there is nothing to optimize because the stages are already near-minimal cost. The source paper's Configuration A recommendations (caching, throughput optimization) do not produce meaningful savings for stages that generate only a handful of API calls.

chester-doc-sync is the exception: it uses multi-agent dispatch despite a Configuration A profile. This is the most notable divergence between Chester's current implementation and the source paper's recommendations (see Section 4.2.13).

**Configuration B (Active Development): chester-fix-bugs, chester-review-code**

The reactive stages share a common profile: medium context stability, medium observability, and low volume. They are invoked on demand rather than as part of the standard pipeline flow, and their behavior adapts substantially to the specific situation (the bug being investigated, the review feedback being addressed).

These stages are the least relevant to pipeline optimization because they are not invoked on every run, their cost is low when invoked, and their value lies in adaptability rather than efficiency. The source paper's Configuration B recommendation -- prioritize flexibility over structure -- aligns with Chester's approach of providing structured frameworks (four debugging phases, six-step review response) while allowing free adaptation within those frameworks.

### Cross-Cutting Observations

**Stakes decrease as the pipeline progresses.** The highest-stakes stages (figure-out, build-spec, build-plan) are at the front of the pipeline, where errors have the longest propagation path. The lowest-stakes stages (finish-plan, prove-work, doc-sync) are at the end, where errors are immediately visible. This is a natural consequence of Chester's sequential architecture: each stage narrows the scope of what downstream stages can get wrong.

**Observability increases as work becomes more concrete.** Design work (figure-out) has low observability; specification work (build-spec) has medium; code work (write-code) has high. The more concrete the output, the more objective the success criteria. This pattern suggests that Chester's investment in multi-agent verification is correctly concentrated on the stages where verification is most feasible.

**The framework's configuration taxonomy does not naturally accommodate behavioral protocols.** chester-test-first and chester-prove-work are discipline constraints, not task-generating stages. They govern how other stages work rather than producing their own outputs. Classifying them into configurations designed for content-producing stages requires treating them as lightweight versions of Configuration A, which captures their stability and observability but misses their essential nature as behavioral constraints rather than optimization targets.

**The hybrid pattern (C creation + D verification) may represent a missing configuration.** chester-build-plan writes the plan as a single-agent Configuration C activity, then verifies it through multi-agent Configuration D review (attack-plan + smell-code). This hybrid is not one of the source paper's four configurations but appears repeatedly in Chester's architecture -- anywhere that creation requires coherent reasoning but verification benefits from independent perspectives. Section 7 discusses whether this represents a gap in the source paper's framework or a natural combination that the framework already supports implicitly.


# 5. Trace Analysis

This section provides computational estimates of Chester's token consumption across a representative pipeline run. Where empirical data exists, it is used directly. Where it does not, estimates are derived from skill structure, conversation patterns, and the known baselines established in prior measurement sessions. All estimates are explicitly labeled.

## 5.1 Data Collection Methodology

### Available Empirical Data (Category A)

Three sources provide measured token data:

**Session JSONL measurement (2026-03-26).** A live Chester session was instrumented by parsing the Claude Code session JSONL for `usage` fields. This session ran chester-figure-out through the design interview phase (65 API calls). Measured values:

- Starting context at call #1: 20,349 input tokens
- Context at call #65: 45,356 input tokens (2.2x growth)
- Total input tokens consumed across all 65 calls: approximately 2.1M
- Context growth trajectory: roughly linear over the session

**Baseline decomposition (2026-03-26).** The 20,349-token starting baseline was decomposed into controllable and non-controllable components:

| Component | Tokens | % of Baseline |
|-----------|--------|---------------|
| Claude Code system prompt | ~16,193 | 80% |
| chester-start SKILL.md | ~1,625 | 8% |
| Skill descriptions (system-reminder) | ~1,399 | 7% |
| CLAUDE.md | ~1,081 | 5% |
| **Total Chester** | **~4,156** | **20%** |

**Token usage log (diagnostic session, 2026-03-27).** Two entries captured via the chester-start-debug diagnostic mode:

| Section | Step | Context % |
|---------|------|-----------|
| figure-out | skill-entry | 19% |
| build-spec | skill-entry | 20% |

This confirms that at the transition between figure-out and build-spec, the orchestrator context is at approximately 19-20% of the 1M window (~190K-200K tokens).

**Subagent consolidation analysis (2026-03-27).** The token-use-limits spec documented the subagent dispatch pattern and calculated baseline overhead savings from consolidation. Key values: 43 subagent launches in a 10-task plan, ~20K baseline per subagent, proposed reduction to 27 launches saving ~320K tokens.

### Estimation Methodology for Unmeasured Stages (Category C)

For stages without direct empirical measurement, estimates are derived from:

1. **Skill word counts.** Each SKILL.md and subagent template was measured. Word counts are converted to token estimates at a ratio of approximately 1.3 tokens per word (consistent with the character-based estimation used in the baseline decomposition, where chars/4 and words*1.3 converge).

2. **Conversation turn modeling.** For stages running in the orchestrator's main context, each API call contributes the growing context (all prior turns) plus the new turn's content. For stages dispatching subagents, each subagent starts with the ~20K baseline plus its task-specific payload.

3. **Structural analysis of skill definitions.** The number of steps, review iterations, and subagent dispatches specified in each SKILL.md provides a lower bound on API call count.

4. **Context growth rates.** The empirical measurement shows context growing from ~20K to ~45K over 65 calls in the figure-out phase. This implies roughly 385 tokens of net context growth per API call (new content minus any compaction). This rate is used to estimate context growth in other main-context stages.

All Category C estimates are labeled with "[C]" in the trace tables below.

---

## 5.2 Per-Stage Trace Tables

The following tables estimate token usage for a representative pipeline run: a 10-task implementation plan on a medium-complexity feature, with one review iteration at each review gate. The orchestrator's context window is 1M tokens.

### 5.2.1 chester-figure-out

Empirical data available from the 2026-03-26 measurement session.

| Metric | Value | Notes |
|--------|-------|-------|
| Total input tokens | ~1,200K | [A] Measured: ~2.1M over 65 calls in a session that ran primarily figure-out. Adjusted downward for a typical 12-question interview (~40 calls). |
| Total output tokens | ~40K [C] | Estimated: ~1,000 tokens per response x 40 calls |
| API calls | ~40 [C] | 12 questions + setup + codebase exploration + checkpoints + design brief |
| Subagent launches | 0 | Runs in orchestrator context |
| Baseline overhead per subagent | N/A | |
| Context utilization at entry | 2% | [A] 20,349 tokens / 1M = ~2% |
| Context utilization at exit | 19% | [A] Measured from diagnostic log |
| Cache-eligible fraction | ~50% [C] | System prompt + skill content is stable; conversation turns are not |
| D(U) regime | Negligible | Exit at 19%, well below 30% threshold |

**Notes:** This is Chester's most empirically grounded stage. The 2.1M total input measurement was from a 65-call session that included some post-interview analysis beyond the standard figure-out scope. A typical figure-out interview runs 35-45 API calls. The growing-context pattern is clearly visible: early calls send ~20K tokens, late calls send ~45K+, and the cumulative sum over 40 calls approximates 1.2M input tokens.

---

### 5.2.2 chester-build-spec

Partially empirical: the diagnostic log confirms entry context at 20%.

| Metric | Value | Notes |
|--------|-------|-------|
| Total input tokens | ~250K [C] | Estimated: ~8 API calls at average context of ~31K (growing from 200K entry) |
| Total output tokens | ~15K [C] | Spec document (~3K) + review exchanges (~12K) |
| API calls | ~8 [C] | Write spec + 1 review subagent dispatch + review cycle + human gate |
| Subagent launches | 1 [C] | Spec reviewer subagent for automated review |
| Baseline overhead per subagent | ~20K | Standard subagent baseline |
| Context utilization at entry | 20% | [A] Measured from diagnostic log |
| Context utilization at exit | 23% [C] | Estimated: entry + spec content + review exchanges |
| Cache-eligible fraction | ~55% [C] | System prompt + skill content stable; design brief from figure-out is stable within the session |
| D(U) regime | Negligible | Exit at ~23%, below 30% threshold |

**Notes:** Build-spec is a moderate-cost main-context stage. The spec reviewer subagent adds ~20K of baseline overhead. The primary cost driver is the accumulated context from figure-out that is re-sent on every API call during spec writing.

---

### 5.2.3 chester-build-plan

No direct empirical data. Estimated from skill structure.

| Metric | Value | Notes |
|--------|-------|-------|
| Total input tokens | ~350K [C] | Estimated: ~12 API calls at average context of ~29K (growing from ~230K entry), plus internal review cycles |
| Total output tokens | ~30K [C] | Plan document (10 tasks with full code, ~20K) + review exchanges (~10K) |
| API calls | ~12 [C] | Write plan tasks + internal review + revisions |
| Subagent launches | 1 [C] | Plan reviewer subagent |
| Baseline overhead per subagent | ~20K | Standard subagent baseline |
| Context utilization at entry | 23% [C] | Estimated from build-spec exit |
| Context utilization at exit | 28% [C] | Entry + plan content + review exchanges |
| Cache-eligible fraction | ~50% [C] | System prompt + skill content stable; spec is stable input |
| D(U) regime | Negligible | Exit at ~28%, near but below 30% threshold |

**Notes:** Build-plan is the last main-context stage before the pipeline transitions to subagent-dominated execution. The orchestrator context is approaching the 30% D(U) threshold by the end of plan writing. For complex plans requiring multiple revision cycles, context utilization could push into the U-shaped regime.

---

### 5.2.4 chester-attack-plan

No direct empirical data. Estimated from skill structure (6 parallel subagents).

| Metric | Value | Notes |
|--------|-------|-------|
| Total input tokens | ~210K [C] | 6 subagents x ~30K each (20K baseline + ~10K plan payload) + orchestrator synthesis (~30K) |
| Total output tokens | ~18K [C] | 6 agent reports (~2K each) + synthesis (~6K) |
| API calls | ~10 [C] | 6 parallel agent dispatches + collection + synthesis + structured thinking |
| Subagent launches | 6 | Six parallel attack agents |
| Baseline overhead per subagent | ~20K | Standard subagent baseline |
| Context utilization at entry | 28% [C] | Orchestrator context from build-plan exit |
| Context utilization at exit | 30% [C] | Entry + synthesis of 6 agent reports |
| Cache-eligible fraction | ~65% [C] | Subagent prompts are identical across invocations; only plan payload varies |
| D(U) regime | Negligible to U-shaped (border) | Orchestrator exits at ~30%, right at the threshold |

**Notes:** The dominant cost is subagent baseline overhead: 6 x 20K = 120K tokens of structural cost before any plan analysis begins. The attack agents themselves are read-only and terminate quickly. The synthesis step adds the six reports to the orchestrator's already-large context.

---

### 5.2.5 chester-smell-code

No direct empirical data. Estimated from skill structure (4 parallel subagents).

| Metric | Value | Notes |
|--------|-------|-------|
| Total input tokens | ~150K [C] | 4 subagents x ~30K each (20K baseline + ~10K plan payload) + orchestrator synthesis (~30K) |
| Total output tokens | ~12K [C] | 4 agent reports (~2K each) + synthesis (~4K) |
| API calls | ~7 [C] | 4 parallel agent dispatches + collection + synthesis |
| Subagent launches | 4 | Four parallel smell-detection agents |
| Baseline overhead per subagent | ~20K | Standard subagent baseline |
| Context utilization at entry | 30% [C] | Orchestrator context from attack-plan exit |
| Context utilization at exit | 32% [C] | Entry + synthesis of 4 agent reports |
| Cache-eligible fraction | ~65% [C] | Same pattern as attack-plan: stable prompts, varying plan payload |
| D(U) regime | U-shaped | Orchestrator is in the 30-50% range |

**Notes:** Smell-code runs immediately after attack-plan in the hardening gate. The orchestrator's context now holds the full design brief, spec, plan, and attack-plan synthesis. At ~32% context utilization, the orchestrator enters the U-shaped D(U) regime where middle-positioned content (the spec, likely) receives less attention than the plan and the most recent smell findings.

---

### 5.2.6 chester-build-plan (hardening synthesis and human presentation)

This entry covers the orchestrator's work after attack-plan and smell-code return: synthesizing the combined risk assessment and presenting it to the human for approval.

| Metric | Value | Notes |
|--------|-------|-------|
| Total input tokens | ~100K [C] | ~3 API calls at ~33K average context |
| Total output tokens | ~5K [C] | Risk summary + human-facing presentation |
| API calls | ~3 [C] | Synthesize findings + present to human + process decision |
| Subagent launches | 0 | Runs in orchestrator context |
| Baseline overhead per subagent | N/A | |
| Context utilization at entry | 32% [C] | From smell-code exit |
| Context utilization at exit | 33% [C] | Modest growth from synthesis |
| Cache-eligible fraction | ~45% [C] | Growing conversation reduces stable prefix ratio |
| D(U) regime | U-shaped | In the 30-50% range |

**Notes:** This is a brief but significant moment: the human's go/no-go decision happens while the orchestrator is in the U-shaped regime. The risk is that the synthesized findings, positioned in the middle of a large context, receive less attention than they should. In practice, the structured thinking MCP provides a reasoning checkpoint that partially mitigates this.

---

### 5.2.7 chester-write-code (10 tasks)

No direct empirical data for the full execution phase. Estimated from skill structure. This is the dominant cost stage.

| Metric | Value | Notes |
|--------|-------|-------|
| Total input tokens | ~1,500K [C] | 30 subagents x ~40K average (20K baseline + ~20K task payload/code context) + orchestrator overhead (~300K for task management across 10 cycles) |
| Total output tokens | ~150K [C] | 10 implementers (~10K each) + 10 spec reviewers (~2K each) + 10 quality reviewers (~2K each) + orchestrator task management |
| API calls | ~80 [C] | 30 subagent dispatches + orchestrator management calls (2-3 per task cycle) + 1 final code reviewer |
| Subagent launches | 31 | 10 implementers + 10 spec reviewers + 10 quality reviewers + 1 final code reviewer |
| Baseline overhead per subagent | ~20K | Standard subagent baseline |
| Context utilization at entry | 33% [C] | Orchestrator context from plan approval |
| Context utilization at exit | 45% [C] | Entry + 10 task cycle reports accumulated in orchestrator |
| Cache-eligible fraction | ~70% [C] | Subagent stable prefix (system prompt + skill + template) is ~20K of each ~40K call |
| D(U) regime | U-shaped | Orchestrator moves from 33% to ~45% over 10 task cycles |

**Notes:** Write-code is the largest single consumer of tokens. The 31 subagent invocations alone account for 620K tokens of baseline overhead (31 x 20K). The remaining ~880K is task-specific: code context loaded by implementers, review artifacts read by reviewers, and the orchestrator's growing task management context. The orchestrator's context grows by approximately 12K per task cycle (implementer report + review summaries), pushing it deeper into the U-shaped D(U) regime as later tasks execute. This is the primary mechanism by which context degradation could affect later tasks in a long plan.

---

### 5.2.8 chester-finish-plan

No direct empirical data. Estimated from skill structure.

| Metric | Value | Notes |
|--------|-------|-------|
| Total input tokens | ~50K [C] | ~5 API calls at average ~10K context per call (lower because some calls are simple git operations) |
| Total output tokens | ~5K [C] | Test output, merge status, session summary |
| API calls | ~5 [C] | Run tests + verify tree + present options + execute choice + cleanup |
| Subagent launches | 0 | Runs in orchestrator context |
| Baseline overhead per subagent | N/A | |
| Context utilization at entry | 45% [C] | From write-code exit |
| Context utilization at exit | 46% [C] | Minimal growth |
| Cache-eligible fraction | ~40% [C] | Large accumulated conversation reduces stable prefix ratio |
| D(U) regime | U-shaped | In the 30-50% range |

**Notes:** Finish-plan is lightweight in token cost. Its value is in discipline (refusing to proceed with failing tests), not in token consumption. The orchestrator is in the U-shaped regime, but the tasks are simple and binary (tests pass/fail, git commands succeed/fail), so degradation has minimal practical impact.

---

### 5.2.9 chester-test-first

Test-first is a behavioral protocol, not a standalone stage with its own API calls. Its token cost is embedded within chester-write-code's implementer subagent calls.

| Metric | Value | Notes |
|--------|-------|-------|
| Total input tokens | Included in write-code | Protocol cost embedded in implementer subagent |
| Total output tokens | Included in write-code | |
| API calls | ~20 [C] | 2 test runs per task x 10 tasks (verify-fail + verify-pass), embedded in implementer calls |
| Subagent launches | 0 | Behavioral constraint, not a dispatch |
| Baseline overhead per subagent | N/A | |
| Context utilization at entry | N/A | Runs within implementer subagent context |
| Context utilization at exit | N/A | |
| Cache-eligible fraction | N/A | |
| D(U) regime | N/A | Each implementer starts fresh |

**Notes:** Test-first's incremental cost is the additional API calls for running tests within the implementer's context. Each test execution adds minimal tokens (the test command and its output). The protocol's cost is negligible relative to the implementer's total work, but it generates approximately 20 additional API calls across a 10-task plan.

---

### 5.2.10 chester-fix-bugs

Fix-bugs is invoked reactively, not on every pipeline run. Estimated for a single invocation.

| Metric | Value | Notes |
|--------|-------|-------|
| Total input tokens | ~50K [C] | Estimated: ~6 API calls at average ~8K context (fresh investigation context) |
| Total output tokens | ~8K [C] | Investigation findings + fix + verification |
| API calls | ~6 [C] | Reproduce + trace + hypothesize + test hypothesis + implement fix + verify |
| Subagent launches | 0 | Runs in current context |
| Baseline overhead per subagent | N/A | |
| Context utilization at entry | Varies | Depends on when in the session a bug is encountered |
| Context utilization at exit | Varies | |
| Cache-eligible fraction | ~50% [C] | System prompt + skill stable; investigation content varies |
| D(U) regime | Varies | Depends on entry point |

**Notes:** Fix-bugs is not part of the standard pipeline flow. When it is invoked (typically during write-code when an implementer encounters an unexpected failure), it adds approximately 50K input tokens to the session. For a 10-task plan that proceeds without bugs, this stage contributes zero tokens.

---

### 5.2.11 chester-prove-work

Prove-work is a lightweight verification gate. Estimated per invocation.

| Metric | Value | Notes |
|--------|-------|-------|
| Total input tokens | ~5K [C] | 1-2 API calls at current context level |
| Total output tokens | ~1K [C] | Verification result |
| API calls | ~2 [C] | Run verification command + confirm result |
| Subagent launches | 0 | Behavioral gate |
| Baseline overhead per subagent | N/A | |
| Context utilization at entry | Varies | Invoked at various points |
| Context utilization at exit | Varies | Negligible growth |
| Cache-eligible fraction | N/A | Cost too small to meaningfully analyze |
| D(U) regime | N/A | Binary check, degradation-resistant |

**Notes:** Prove-work adds negligible token cost per invocation. Even if invoked 10 times across a pipeline run, total additional input is approximately 50K tokens -- less than 2% of total pipeline cost.

---

### 5.2.12 chester-review-code

Review-code is invoked reactively when code review feedback arrives. Not part of the standard pipeline flow.

| Metric | Value | Notes |
|--------|-------|-------|
| Total input tokens | ~40K [C] | Estimated: ~5 API calls at ~8K average context |
| Total output tokens | ~6K [C] | Technical responses to review items |
| API calls | ~5 [C] | Read feedback + evaluate each item + implement/pushback + verify |
| Subagent launches | 0 | Runs in current context |
| Baseline overhead per subagent | N/A | |
| Context utilization at entry | Varies | Depends on when review feedback arrives |
| Context utilization at exit | Varies | |
| Cache-eligible fraction | ~50% [C] | System prompt + skill stable; review content varies |
| D(U) regime | Varies | |

**Notes:** Like fix-bugs, review-code is reactive and not part of the standard pipeline token budget. It is excluded from the aggregate analysis below.

---

### 5.2.13 chester-dispatch-agents

Dispatch-agents is a meta-utility whose token cost is embedded in the stages that use it (attack-plan, smell-code, write-code, doc-sync). It does not generate independent API calls.

| Metric | Value | Notes |
|--------|-------|-------|
| Total input tokens | Included in calling stages | Coordination overhead embedded in attack-plan, smell-code, write-code, doc-sync |
| Total output tokens | Included in calling stages | |
| API calls | ~5 [C] | Orchestrator calls for dispatch setup and result collection, distributed across calling stages |
| Subagent launches | 0 | Dispatches are attributed to the calling stage |
| Baseline overhead per subagent | N/A | |
| Context utilization at entry | N/A | Runs within calling stage's context |
| Context utilization at exit | N/A | |
| Cache-eligible fraction | N/A | |
| D(U) regime | N/A | |

**Notes:** Dispatch-agents adds a small amount of orchestration overhead (dispatch setup instructions, result collection parsing) to each calling stage. This is estimated at 1-2 additional API calls per dispatch batch, already included in the calling stage estimates above.

---

### 5.2.14 chester-doc-sync

No direct empirical data. Estimated from skill structure (3 parallel subagents).

| Metric | Value | Notes |
|--------|-------|-------|
| Total input tokens | ~100K [C] | 3 subagents x ~25K each (20K baseline + ~5K git diff payload) + orchestrator synthesis (~25K) |
| Total output tokens | ~8K [C] | 3 agent reports (~2K each) + synthesis (~2K) |
| API calls | ~6 [C] | 3 parallel agent dispatches + collection + synthesis |
| Subagent launches | 3 | CLAUDE.md checker + approved doc checker + gap detector |
| Baseline overhead per subagent | ~20K | Standard subagent baseline |
| Context utilization at entry | 46% [C] | Orchestrator context from finish-plan exit |
| Context utilization at exit | 47% [C] | Entry + synthesis of 3 reports |
| Cache-eligible fraction | ~65% [C] | Subagent prompts stable; git diff payload varies |
| D(U) regime | U-shaped | In the 30-50% range |

**Notes:** Doc-sync is invoked within finish-plan. Its three subagents add 60K tokens of baseline overhead. As noted in Section 4.2.13, this stage uses a Configuration D architecture where a Configuration A approach would likely suffice -- the token overhead of three subagents may exceed what a single-agent approach would cost for this low-stakes, low-complexity work.

---

## 5.3 Aggregate Analysis

### Total Pipeline Token Consumption

The following table summarizes estimated token consumption for a representative 10-task pipeline run (no bugs encountered, one review iteration at each gate, no reactive stages invoked).

| Stage | Input Tokens | % of Total | Output Tokens | API Calls | Subagent Launches |
|-------|-------------|-----------|--------------|-----------|-------------------|
| figure-out | 1,200K | 32.3% | 40K | 40 | 0 |
| build-spec | 250K | 6.7% | 15K | 8 | 1 |
| build-plan | 350K | 9.4% | 30K | 12 | 1 |
| attack-plan | 210K | 5.7% | 18K | 10 | 6 |
| smell-code | 150K | 4.0% | 12K | 7 | 4 |
| hardening synthesis | 100K | 2.7% | 5K | 3 | 0 |
| write-code (10 tasks) | 1,500K | 40.4% | 150K | 80 | 31 |
| finish-plan | 50K | 1.3% | 5K | 5 | 0 |
| doc-sync | 100K | 2.7% | 8K | 6 | 3 |
| test-first | (included in write-code) | -- | -- | ~20 | 0 |
| prove-work | (included in calling stages) | -- | -- | ~10 | 0 |
| dispatch-agents | (included in calling stages) | -- | -- | ~5 | 0 |
| **Total** | **~3,710K [C]** | **100%** | **~283K [C]** | **~171** | **46** |

### Consistency Check Against Empirical Data

The measured session consumed ~2.1M input tokens over 65 API calls, covering primarily the figure-out phase. Our estimate for figure-out alone is 1.2M over ~40 calls. The measured session ran longer (65 calls vs. estimated 40), which accounts for the difference: the additional 25 calls at the session's higher context levels (~40-45K each) would add approximately 900K-1,000K, bringing the total close to the measured 2.1M. The estimates are consistent with the empirical data at the stage level where measurement exists.

The total pipeline estimate of ~3.7M input tokens is plausible for a full pipeline run. This represents approximately 47% of the theoretical maximum if every API call sent the full 1M context window (171 calls x 1M = 171M), confirming that Chester operates well within the context budget for a single pipeline run.

### Top 3 Token-Consuming Stages

1. **chester-write-code: ~1,500K (40.4%)** -- Dominated by 31 subagent invocations, each loading ~20K of baseline overhead plus task-specific code context. This is the stage where prompt caching would deliver the highest absolute savings.

2. **chester-figure-out: ~1,200K (32.3%)** -- Dominated by growing-context conversation in the orchestrator's main window. Each API call re-sends the full conversation history. This is the stage most affected by the "re-send everything" cost model of LLM APIs.

3. **chester-build-plan: ~350K (9.4%)** -- Combines growing orchestrator context with the overhead of writing a detailed plan (complete code for all tasks). The plan itself can be 15-20K tokens of content that is then re-sent on every subsequent call.

These three stages account for **82.1%** of total estimated pipeline input tokens.

### Baseline Overhead: The Multi-Agent Tax

Total subagent launches in the pipeline: **46** (including 2 spec/plan reviewers, 6 attack agents, 4 smell agents, 31 write-code agents, 3 doc-sync agents).

Baseline overhead per subagent: ~20,000 tokens.

**Total baseline overhead: ~920K tokens (24.8% of total pipeline input).**

This is the structural cost of Chester's multi-agent architecture -- the tokens consumed loading the system prompt, CLAUDE.md, and skill context into each fresh subagent, before any task-specific work begins. Nearly one quarter of all input tokens in a pipeline run are spent on this baseline repetition.

For the 31 write-code subagents alone, baseline overhead is ~620K tokens (16.7% of total). This is the single largest optimization target identified in the trace analysis, and it aligns with the source paper's identification of prompt caching as the highest-ROI structural intervention for Configuration D stages.

### Cache-Eligible Tokens

Estimating the cache-eligible fraction across the full pipeline:

- **Subagent calls (46 launches):** The system prompt (~16K) and CLAUDE.md (~1K) are identical across all subagent invocations within a session. The skill-specific content (~2-3K) is identical across invocations of the same skill type. Combined stable prefix per subagent: ~18-19K of the ~20K baseline. **Estimated cache-eligible tokens from subagent baselines: ~850K (23% of total).**

- **Orchestrator calls (~90 calls across main-context stages):** The system prompt (~16K) and CLAUDE.md (~1K) are identical across all calls. Conversation history is additive (grows but prior turns do not change). Estimated stable prefix averages ~40% of each call's input. **Estimated cache-eligible tokens from orchestrator calls: ~720K (19% of total).**

- **Combined cache-eligible estimate: ~1,570K (42% of total pipeline input).**

At Anthropic's cached token pricing (10% of standard input price), achieving full cache utilization across these tokens would reduce the effective input token cost by approximately 38% (42% of tokens at 90% discount). This represents the theoretical upper bound; actual cache hit rates depend on prefix matching discipline and cache TTL relative to call timing.

### Context Utilization Trajectory

The orchestrator's context utilization follows a predictable trajectory across the pipeline:

| Pipeline Point | Context Utilization | D(U) Regime |
|---|---|---|
| Session start | 2% | Negligible |
| End of figure-out | 19% | Negligible |
| End of build-spec | 23% | Negligible |
| End of build-plan | 28% | Negligible |
| End of hardening gate | 33% | U-shaped |
| End of write-code (task 5) | 39% | U-shaped |
| End of write-code (task 10) | 45% | U-shaped |
| End of finish-plan | 46% | U-shaped |
| End of doc-sync | 47% | U-shaped |

Key observations:

- The orchestrator stays in the Negligible regime through the entire design phase (figure-out, build-spec, build-plan). This is fortunate, as these are the highest-stakes stages where context degradation would be most costly.
- The transition to the U-shaped regime occurs during the hardening gate, after the high-stakes design work is complete.
- The orchestrator never reaches the Recency-bias regime (>50%) in a standard 10-task run. For longer plans (15+ tasks), the orchestrator could approach or enter this regime.
- Subagents are unaffected by the orchestrator's context growth because each starts fresh at ~2% utilization.

This trajectory explains why Chester's multi-agent architecture is effective despite its token overhead: the stages most susceptible to context degradation (write-code's later tasks) are the stages where subagent context isolation provides the most value. Each implementer starts fresh regardless of how much context the orchestrator has accumulated.


# 6. Cross-Correlations

Sections 4 and 5 assessed Chester's thirteen stages individually — Section 4 through the source paper's qualitative framework, Section 5 through token consumption estimates. This section connects those assessments into a system-level view. Chester is a pipeline, not a collection of independent agents. Upstream quality constrains downstream success. Upstream verbosity inflates downstream cost.

## 6.1 Dependency Graph

Chester's pipeline has three types of dependencies between stages.

### Hard Dependencies

The core pipeline forms a strict linear chain: figure-out -> build-spec -> build-plan -> hardening gate -> write-code -> finish-plan. Each stage requires its predecessor's artifact to begin. There is no stage-level parallelism. The only concurrency is internal: attack-plan's six agents run alongside smell-code's four agents during hardening.

### Quality Dependencies

Quality dependencies are softer: Stage B can execute regardless of Stage A's output quality, but Stage B's effectiveness is bounded by how good that output is.

- **figure-out -> everything downstream:** The design brief is the highest-leverage artifact. A brief that misidentifies the problem propagates through every subsequent stage. Build-spec formalizes the wrong requirement, build-plan plans the wrong implementation, write-code executes it correctly. The pipeline delivers a well-tested implementation of the wrong thing.

- **build-spec -> build-plan -> write-code:** Specification ambiguity forces the plan to make assumptions that implementer subagents inherit without the context to question. A spec that says "handle errors appropriately" produces tasks that invent independent error handling strategies, yielding inconsistent behavior.

- **build-plan -> write-code:** Incorrect file paths cause implementers to waste tokens searching. Incomplete dependency ordering causes tasks to fail when expected prior-task code does not exist. Pseudocode instead of complete code forces implementers to make design decisions that should have been resolved upstream.

- **attack-plan + smell-code -> build-plan:** The hardening gate's synthesis step is where quality most easily degrades (Section 4: medium observability). A weak synthesis that misses a genuine structural risk has the same downstream effect as not running the gate at all.

### Token Dependencies

Token dependencies describe how one stage's output volume drives the next stage's input cost.

- **figure-out -> build-spec -> build-plan (orchestrator context growth):** These three stages run in the orchestrator's main context, re-sending all prior content on every API call. Section 5 quantified this: the orchestrator grows from 2% to 28% utilization across these stages, consuming ~1,800K input tokens (48.5% of total pipeline cost).

- **build-plan -> all downstream subagents (plan payload multiplication):** The plan is injected into 41 subagent contexts (6 attack + 4 smell + 31 write-code). A 20K-token plan becomes 820K tokens of payload. A plan achieving the same specificity at 12K tokens would save ~328K (9% of total cost).

- **hardening reports -> orchestrator synthesis:** The ten agent reports push the orchestrator from 28% to 33% utilization, entering the U-shaped D(U) regime where middle-positioned content receives less attention.

## 6.2 Quality Propagation: The Critical Path

The critical path for quality runs through the three Configuration C stages: **figure-out -> build-spec -> build-plan**. Their shared characteristic is low success observability — errors are invisible at the stage that introduces them and only surface two or three stages later. A flawed assumption in the design interview appears as a test failure during write-code's seventh task, after ~3,000K tokens have been spent executing tasks 1 through 6 on that assumption.

The hardening gate is Chester's primary defense. Its placement is structurally correct: it sits at the boundary between the high-stakes design phase and the high-cost execution phase. Every plan weakness caught prevents ~150K tokens of wasted implementation cost per affected task (one implementer + two reviewers at ~50K each).

However, a cross-correlation limitation emerges that individual stage assessments did not expose: the synthesis step runs at 30-33% context utilization, right at the U-shaped D(U) threshold. The attack and smell agents operate in fresh contexts, but their findings are synthesized by an orchestrator whose attention to middle-positioned content is diminishing. The gate is most reliable for prominent, high-severity findings and least reliable for findings requiring cross-reference against design decisions buried in the conversation history.

## 6.3 Token Propagation: The Cost Amplifier

Two mechanisms amplify token cost across stage boundaries.

**Mechanism 1: Growing orchestrator context.** Section 5's utilization trajectory (2% -> 19% -> 23% -> 28% -> 33% -> 45% -> 47%) shows monotonic growth. The figure-out phase produces ~170K tokens of conversation history re-sent on every subsequent orchestrator call — approximately 58 calls across downstream stages. The marginal cost of verbose figure-out output is those tokens multiplied by every subsequent API call.

**Mechanism 2: Plan payload multiplication.** The plan is loaded into 41 subagent contexts. Unlike orchestrator context (which benefits from prompt caching of stable prefixes), plan payload sits after the stable prefix and is less cache-eligible. Every additional plan token costs approximately 41 tokens across the pipeline.

These mechanisms interact. A verbose figure-out session produces a verbose design brief, which produces a verbose spec, which produces a verbose plan — then multiplied 41 times through subagent dispatch. Upstream verbosity compounds through both channels simultaneously.

## 6.4 Shared Resource Contention

Chester's stages compete for a single shared resource: the orchestrator's context window. This is not concurrent-access contention — stages run sequentially — but budget contention: every token consumed by an earlier stage is unavailable to later stages.

The high-stakes design phase consumes ~28% of the 1M window. The remaining 72% must accommodate hardening, 10+ task management cycles, finish-plan, and doc-sync. For a standard 10-task plan this is adequate. For a 20-task plan, the orchestrator would approach 60-65% utilization, entering the Recency-bias D(U) regime.

This creates a tension: the design phase should be thorough to improve quality propagation, but thoroughness consumes context budget that degrades downstream orchestrator performance. Chester resolves this through its multi-agent architecture — subagents start fresh regardless of orchestrator context growth — so the contention primarily affects orchestrator decision-making during task management and hardening synthesis, not the subagents doing implementation and review.

## 6.5 Summary of Cross-Correlations

Three system-level patterns emerge from connecting the individual stage assessments:

1. **Quality flows downstream, cost flows forward.** The three Configuration C stages at the pipeline's front determine what gets built. The Configuration D stages that follow determine how much it costs to build it. Optimizing cost without protecting upstream quality is counterproductive — a cheaper pipeline that builds the wrong thing saves nothing.

2. **The hardening gate is correctly positioned but operates under context pressure.** It sits at the quality-cost boundary, catching plan weaknesses before they multiply through 31 subagent invocations. But its synthesis step runs at the D(U) threshold, creating a reliability gradient where recent, prominent findings are synthesized well and older, cross-referencing-dependent findings may be missed.

3. **Verbosity compounds through two independent mechanisms.** Orchestrator context growth multiplies upstream verbosity across all downstream API calls. Plan payload duplication multiplies plan verbosity across 41 subagent contexts. These mechanisms are independent and additive — reducing verbosity at the source reduces cost through both channels simultaneously.


# 7. Counter-Analysis and Limitations

This section identifies the ways in which the preceding analysis may be wrong, incomplete, or misleading. The source paper's Section 8 was epistemologically rigorous about the boundaries of its claims. This paper must meet the same standard, particularly because the evidence base here is thinner.

## 7.1 Framework Fit

The source paper's five diagnostic dimensions were designed for production API deployments — systems where the unit of analysis is a stateless API call serving external users. Chester is a developer tool where the unit of analysis is a pipeline stage executing within a long-running interactive session. Several mapping problems follow.

**Behavioral skills have no natural home.** chester-test-first and chester-prove-work are discipline constraints that govern how other stages work rather than producing their own artifacts or generating their own API calls. Section 4 classified them as Configuration A, but this is a forced fit: the configuration taxonomy assumes stages that consume tokens and produce outputs, and "behavioral protocol" is not a category the framework recognizes. The assessments for these stages describe what the stages are rather than applying the framework to them in any meaningful diagnostic sense.

**The hybrid pattern is invisible to the taxonomy.** chester-build-plan's architecture — single-agent creation followed by multi-agent adversarial verification — does not map to any of the four configurations. Section 4 classified the creation as Configuration C and the verification as Configuration D, but the interaction between them (the synthesis step where findings re-enter the single-agent context) is where the interesting dynamics occur, and the framework provides no vocabulary for analyzing that boundary. If this hybrid pattern is common in real-world agent systems, the four-configuration taxonomy may systematically miss the most architecturally interesting stages.

**Stakes are assessed relative to this pipeline, not absolutely.** A "high-stakes" classification for chester-figure-out means errors propagate through Chester's pipeline. Whether that propagation matters depends on the cost of re-running the pipeline, which for a solo developer using a personal tool is low. The framework's stakes dimension conflates propagation distance with actual consequence.

## 7.2 Measurement Limitations

Section 5 was transparent about its evidence categories, but the implications deserve emphasis. Of the thirteen stage assessments, only one (figure-out) has Category A empirical data, and even that measurement covers a single session. The remaining twelve stages rely on Category C estimates derived from skill word counts, structural analysis, and the assumption that context growth rates generalize from the one measured session.

The specific vulnerabilities are:

- **Write-code's 1,500K estimate is the most consequential and least empirical.** It accounts for 40% of estimated pipeline cost and is built entirely from structural assumptions about subagent payload sizes and orchestrator management overhead. If actual implementer subagents load substantially more code context than the estimated 20K task payload (plausible for tasks touching large files), write-code's true cost could be 30-50% higher.

- **Cache-eligible fractions are theoretical.** The 42% pipeline-wide cache-eligible estimate assumes perfect prefix matching and cache hits within the API's TTL window. Actual cache behavior depends on implementation details of Anthropic's caching layer that are not publicly documented with enough precision to validate the estimate.

- **Context utilization percentages assume linear token accumulation.** The 2% -> 19% -> 23% -> 28% trajectory was measured at two points (2% and 19%) and extrapolated for the rest. If the orchestrator compresses or summarizes intermediate content (a behavior that some Claude Code versions exhibit), the actual trajectory could be substantially flatter.

A single instrumented end-to-end pipeline run would resolve most of these uncertainties. That this measurement has not been performed is itself a limitation of the analysis.

## 7.3 Single-User Bias

Chester is used by one developer (the author) on one model (Claude Opus with a 1M context window) for one category of work (personal development tools). Every assessment in Sections 4-6 reflects this usage pattern.

- **Interaction style shapes figure-out's cost.** The 1,200K token estimate for figure-out reflects one person's conversational style during the Socratic interview. A more concise user would produce a shorter interview with less context growth. A more exploratory user would produce a longer one. The estimate is a sample of one.

- **Project complexity is narrow.** All observations come from small-to-medium feature work on a single codebase. Chester's behavior on a large enterprise codebase with complex dependency chains, or on a greenfield project with no existing code to reference, is unobserved.

- **Model-specific behaviors are treated as general.** The D(U) degradation thresholds (30% for U-shaped, 50% for recency-bias) are taken from the source paper's analysis of Claude models. Other model families may degrade at different utilization levels, which would change every context utilization assessment in Section 5.

## 7.4 Stationarity Assumption

The analysis treats Chester as a fixed system. It is not. Chester is under active development, and several of the assessments are sensitive to changes already under consideration.

**Subagent consolidation would invalidate the multi-agent tax calculation.** The token-use-limits work (2026-03-27) proposed reducing write-code's subagent launches from 31 to 27 by consolidating spec and quality reviewers. If implemented, Section 5's baseline overhead figure (920K, 24.8% of total) drops to approximately 780K. The percentage changes, the ranking of optimization targets may change, and the relative attractiveness of caching versus consolidation shifts.

**Skill prompt edits change cache-eligible fractions.** Any edit to a SKILL.md file invalidates the cache prefix for all subagents using that skill. During active development periods, cache hit rates could be substantially lower than the steady-state estimate. The 42% cache-eligible figure assumes a stable codebase that does not describe Chester's current state.

**New stages change the pipeline profile.** Adding a stage between build-plan and write-code (e.g., a dependency resolution stage) would shift the context utilization trajectory and move the D(U) threshold crossing point. The specific trajectory in Section 5 is a snapshot, not a durable property.

## 7.5 Goodhart's Risk

If Chester's development is guided by the metrics identified in this analysis, several metrics are at risk of becoming poor proxies for what they are intended to measure.

**Optimizing cache-eligible fraction could over-stabilize prompts.** Cache hits require identical prefixes. Maximizing cache hits creates pressure to never change skill prompts, which conflicts with iterating on skill quality. A skill prompt that is cache-optimal but outdated is worse than a cache-busting prompt that reflects current best practice.

**Minimizing context utilization could shorten the design phase.** If the 28% utilization at the end of build-plan is treated as a budget to minimize, the natural response is to make the design interview shorter and the spec less detailed. This directly undermines the quality propagation that Section 6 identified as the pipeline's most important property. The cheapest pipeline run is one that skips figure-out entirely — and produces the worst outcomes.

**Reducing subagent count could eliminate independent verification.** The 920K baseline overhead is a tempting optimization target. But the independence of each subagent's assessment is what makes the review architecture reliable. Consolidating the spec reviewer and quality reviewer into a single agent saves 20K tokens per task but introduces anchoring effects where the same agent that checked spec compliance is now primed to approve code quality. The savings are measurable; the quality loss is not — which is exactly the condition under which Goodhart's Law operates.

The general pattern: the metrics most amenable to optimization (token counts, cache hit rates, subagent counts) are structural proxies for properties that matter but resist measurement (design quality, review independence, appropriate thoroughness). Optimizing the proxy while losing the property is the central risk of any metrics-driven improvement effort applied to Chester.


# 8. Conclusions

This section consolidates the per-stage assessments, trace analysis, cross-correlations, and counter-analysis into actionable conclusions. The summary table provides the paper's key reference artifact. The intervention priorities, measurement recommendations, and future work sections translate the analysis into a concrete path forward.

## 8.1 Per-Stage Configuration Summary

The following table presents all thirteen stages across all five diagnostic dimensions with their configuration classification. Dimension levels are abbreviated: H = High, M = Medium, L = Low.

| Stage | Decomp. | Stability | Observ. | Volume | Stakes | Config |
|-------|---------|-----------|---------|--------|--------|--------|
| chester-figure-out | L | M | L | H | H | C |
| chester-build-spec | L | M | M | M | H | C |
| chester-build-plan | M | M | M | H | H | C |
| chester-write-code | H | H | H | H | L-M | D |
| chester-finish-plan | L | H | H | L | L | A |
| chester-attack-plan | H | H | M | H | M | D |
| chester-smell-code | H | H | M | M | M | D |
| chester-test-first | L | H | H | L | L | A |
| chester-fix-bugs | L | M | M | L | M | B |
| chester-prove-work | L | H | H | L | L | A |
| chester-review-code | L | M | M | L | L | B |
| chester-dispatch-agents | H | H | H | H | L | D |
| chester-doc-sync | H | H | M | M | L | A |

**Distribution:** Three Configuration C stages (the design phase), four Configuration D stages (execution and adversarial review), four Configuration A stages (verification and cleanup), two Configuration B stages (reactive). The pipeline's cost structure follows this distribution: the three Configuration C stages account for 48.4% of estimated input tokens, the four Configuration D stages account for approximately 50%, and the remaining six stages account for under 5% combined.

Two structural patterns are visible in the table. First, stakes decrease monotonically as the pipeline progresses — the highest-stakes stages sit at the front where errors have the longest propagation path. Second, observability increases as outputs become more concrete — design work resists automated verification while code has objective pass/fail criteria. These patterns are not accidental; they reflect Chester's architectural decision to invest human oversight at the front (where errors are invisible and consequential) and automated verification at the back (where errors are detectable and contained).

## 8.2 Top Intervention Priorities

Interventions are ranked by expected AER impact, considering both the magnitude of the affected token volume and the risk of quality degradation.

### Tier 1 — Universal, No Quality Tradeoff

**1. Prompt caching for subagent stable prefixes.**
Affects: write-code, attack-plan, smell-code, doc-sync, dispatch-agents.
Expected impact: Q unchanged, P(success) unchanged, E[C_api] reduced by up to 23% of total pipeline cost. The 46 subagent invocations share ~18-19K tokens of identical prefix (system prompt + CLAUDE.md). At Anthropic's cached pricing (10% of standard input), achieving consistent cache hits on this prefix saves approximately 850K tokens worth of effective cost per pipeline run. This is the single highest-ROI intervention identified in the analysis and requires no architectural change — only prefix-matching discipline in how subagent contexts are constructed.

**2. Context windowing for orchestrator conversation history.**
Affects: figure-out, build-spec, build-plan, hardening synthesis, write-code (orchestrator), finish-plan.
Expected impact: Q unchanged (with careful implementation), P(success) slightly improved (reduced D(U) pressure), E[C_api] reduced. The orchestrator re-sends its full conversation history on every API call, growing from 20K to 470K tokens across the pipeline. A sliding window or summarization strategy for older conversation turns would reduce the per-call cost of downstream stages. The risk is that aggressive windowing drops design context that later stages need — but the artifact-based handoff architecture (design brief on disk, spec on disk, plan on disk) means the orchestrator can re-read artifacts rather than relying on conversation history. Estimated savings: 15-25% reduction in orchestrator-stage input tokens (~300-500K).

**3. Response format control for subagent reports.**
Affects: attack-plan, smell-code, write-code (reviewers).
Expected impact: Q unchanged, P(success) unchanged, E[C_api] modestly reduced. Enforcing structured, concise output formats for subagent reports reduces the tokens that the orchestrator must ingest during synthesis steps. The current reports are free-form; a structured format (severity, location, finding, evidence) would reduce synthesis input and improve the reliability of cross-agent deduplication.

### Tier 2 — Quality Improvement at Modest Cost

**4. Plan payload compression.**
Affects: All 41 subagents that receive the plan (attack-plan, smell-code, write-code).
Expected impact: Q unchanged, P(success) unchanged, E[C_api] reduced. Section 6 identified plan payload multiplication as a cost amplifier: every additional plan token costs approximately 41 tokens across the pipeline. A plan that achieves the same specificity at 12K tokens instead of 20K saves approximately 328K tokens (9% of total). This is a Tier 2 intervention because it requires changes to the plan format and carries risk that compression loses task-critical detail.

**5. Reviewer consolidation in write-code.**
Affects: write-code.
Expected impact: Q slightly reduced (anchoring risk), P(success) unchanged, E[C_api] reduced by ~6-8%. The token-use-limits work (2026-03-27) proposed consolidating spec and quality reviewers from two subagents to one per task, reducing launches from 31 to 21 and saving approximately 200K tokens. Section 7 identified the Goodhart's risk: consolidation saves measurable tokens but introduces anchoring effects where the same agent that checked spec compliance is primed to approve code quality. The savings are real; the quality tradeoff is real but difficult to measure.

### Tier 3 — Architectural, Gated

**6. Doc-sync consolidation to single-agent.**
Affects: doc-sync.
Expected impact: Q unchanged, P(success) unchanged, E[C_api] reduced by ~40K (1% of total). Section 4 identified doc-sync as using a Configuration D architecture (three parallel subagents) for Configuration A workload (low stakes, low complexity). Consolidating to a single agent saves 40K tokens of baseline overhead per pipeline run. This is Tier 3 only because it requires an architectural change to the skill, not because the risk is high — the stakes are low and the quality impact is negligible.

**7. Adaptive interview length in figure-out.**
Affects: figure-out.
Expected impact: Q potentially reduced (shorter interviews may miss design issues), P(success) potentially reduced, E[C_api] reduced. Figure-out consumes 32.3% of pipeline input tokens. Shorter interviews produce less context growth, reducing cost through both orchestrator re-send and downstream propagation. But Section 6 established that figure-out quality is the highest-leverage variable in the pipeline — a cheaper interview that misidentifies the problem produces a well-tested implementation of the wrong thing. This intervention must be gated on evidence that current interviews are longer than necessary, not applied as a cost reduction measure.

## 8.3 Measurement Recommendations

The analysis identified that twelve of thirteen stage assessments rely on Category C estimates. Moving to Category A empirical data requires specific instrumentation.

**Immediate (no code changes required):**

The Anthropic API returns `input_tokens`, `output_tokens`, and `cache_read_input_tokens` on every response. Claude Code's session JSONL already captures these values. A post-session script that parses the JSONL and attributes token usage to pipeline stages (using skill-entry markers already present in chester-start-debug) would provide per-stage empirical data for every pipeline run. This single measurement would resolve the largest uncertainty in the analysis: whether write-code's 1,500K estimate (40% of total, entirely Category C) is accurate.

**Short-term (minor instrumentation):**

- **Per-subagent token tracking:** Log the input_tokens and output_tokens for each subagent invocation, tagged with the calling stage and task number. This resolves the baseline overhead estimate (currently 20K assumed uniform) and the task payload variance (currently assumed at 20K average for write-code implementers).
- **Cache hit rate measurement:** Log `cache_read_input_tokens` per call to determine actual cache utilization. The 42% cache-eligible estimate is theoretical; actual rates may be significantly lower if prefix matching is inconsistent or TTL windows expire between subagent dispatches.
- **Context utilization at stage boundaries:** Extend the chester-start-debug diagnostic entries to log context percentage at every stage transition, not just skill entry. This validates the 2% -> 19% -> 23% -> 28% -> 33% -> 45% -> 47% trajectory.

**Medium-term (requires framework):**

- **P(success) estimation per stage:** Track how often each stage requires human correction or re-running. Over 10-20 pipeline runs, this provides empirical P(success) values that replace the current analytical estimates. This is the measurement most needed to make AER calculations meaningful rather than illustrative.
- **Quality regression detection:** Track whether reviewer-consolidated runs produce different defect rates than dual-reviewer runs, providing empirical data for the Tier 2 consolidation decision.

## 8.4 Future Work

Three directions emerge from the analysis as most promising for follow-up.

**1. Instrumented pipeline profiling.** A single fully instrumented end-to-end run — parsing the session JSONL for per-call token usage and mapping calls to pipeline stages — would resolve most Category C estimates in a few hours of analysis work. This is the highest-value next step because every intervention decision in Section 8.2 depends on cost estimates that have not been empirically validated. The token-use-limits work at `/home/mike/.claude/skills/docs/chester/2026-03-27-token-use-limits/` already established the subagent dispatch model and proposed consolidation targets; empirical profiling would validate or correct those targets before implementation.

**2. Prompt caching experiment.** The Tier 1 caching intervention (Section 8.2, item 1) has the highest expected ROI and zero quality risk. An experiment that measures cache hit rates across a standard pipeline run — before and after ensuring prefix-matching discipline in subagent construction — would quantify the actual savings available. The gap between the theoretical 23% savings and achievable savings is the key unknown.

**3. Source framework extension for hybrid configurations.** Sections 4 and 7 identified that Chester's build-plan stage uses a hybrid pattern (Configuration C creation + Configuration D verification) that does not map to any of the source paper's four configurations. If this pattern is common in real-world agent systems — and the architectural logic suggests it would be, since many high-stakes stages benefit from independent verification — then the source framework's configuration taxonomy may need a fifth configuration or an explicit treatment of hybrid patterns. This is a theoretical contribution rather than an engineering task, but it would strengthen the analytical foundation for future applied analyses.

**4. Single-context variant comparison.** The Chester fork discussion (single-context vs. multi-agent) identified in the project memory would provide a natural experiment: run the same feature task through both variants and compare total token cost, P(success), and defect rate. The multi-agent tax (920K baseline overhead, 24.8% of total) is the cost of context isolation and independent review. Whether that cost is justified depends on how much quality the isolation actually provides — a question this analysis raises but cannot answer without the comparison data.


