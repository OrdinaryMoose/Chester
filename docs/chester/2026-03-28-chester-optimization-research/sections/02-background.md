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
