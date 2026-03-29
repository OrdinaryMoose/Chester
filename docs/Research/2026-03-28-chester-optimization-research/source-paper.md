


Optimizing AI Agent Effectiveness
Under Token Cost Constraints
A Conceptual and Qualitative Framework for Agentic System Design


Revised Edition — March 2026
Incorporating peer review from: Technical/Systems, Economic/Practitioner,
and Critical/Adversarial review panels









Abstract

AI agents capable of operating over long time horizons represent a significant capability advance in software engineering, but their token consumption makes naive deployment economically unsustainable. This paper examines the central tension in agentic AI systems: the tradeoff between effectiveness and cost, where effectiveness depends on context richness and cost scales non-linearly with context size.
We make two distinct contributions. First, we present the Agent Efficiency Ratio (AER) as a conceptual instrument — an idea formula in the tradition of the Drake Equation or the IS-LM model — that names the variables governing the cost-effectiveness tradeoff and specifies their directional relationships. We explicitly position AER as a reasoning scaffold rather than a computational tool: its inputs resist precise measurement, and claiming otherwise would be false precision. The formula is valuable for the structure it provides, not for the numbers it produces.
Second, we introduce a Qualitative Decision Framework modeled on structured focused comparison methods from political science. This framework allows practitioners to reason rigorously about strategy selection without numerical inputs, using five diagnostic dimensions drawn from the theoretical model. It is the primary decision tool this paper provides.
Our survey of optimization techniques — prompt caching, model routing, context engineering, multi-agent architectures, and prompting methods — is situated within a Total Cost of Ownership (TCO) framing that includes developer time alongside API cost, addressing a systematic gap in prior treatments. We find that prompt caching is the single highest-ROI structural intervention, that context length is a degrading rather than neutral resource, and that multi-agent architectures are appropriate for a narrower set of conditions than is commonly assumed. A tiered implementation scheme with explicit scope conditions concludes the paper.
Scope note: This framework is calibrated for API-based coding agents in stable production deployments. Teams in active development mode, large-team human-agent collaborative contexts, or domains requiring mandatory human oversight should treat the qualitative framework as directional and weight the TCO model's human cost terms heavily.



1.  Introduction

The deployment of AI agents in production software engineering has moved from experimental to routine. Systems like Claude Code, GitHub Copilot Workspace, and similar agentic coding tools now execute multi-step software tasks autonomously — reading files, writing code, running tests, and committing results with minimal human oversight. This capability arrives with a structural cost problem that most practitioners underestimate until they receive their first production API bill.
Agents are not single-inference systems. They operate in loops, and each iteration re-sends accumulated context to the model. A session running twenty tool calls, each carrying a ten-thousand-token system prompt, consumes two hundred thousand input tokens before generating a single line of application code. At frontier model pricing, this is not a rounding error — it is the dominant operational cost.
Two research findings compound this problem. First, simply providing more context does not reliably improve output quality: performance degrades non-uniformly as context length increases, a phenomenon documented as context rot and the lost-in-the-middle effect. Second, multi-agent architectures — frequently proposed as solutions to the long-horizon problem — multiply token consumption while introducing coordination overhead and new failure modes.
Research question: What combination of structural choices, prompting methods, and architectural decisions maximizes the quality of AI agent output per unit of total cost?
We approach this as an analytical problem requiring two complementary tools: a formal conceptual model that names the variables and specifies their relationships, and a qualitative decision framework that allows practitioners to reason about those variables without numerical inputs. This two-tool approach is deliberate. The domain lacks the empirical data required to validate quantitative models, and pretending otherwise — presenting scenario tables as measured findings when they are modeled estimates — is a form of false precision that misleads rather than informs.
1.1  Scope and Definitions
An AI agent is a language model operating in a loop with tool access, executing multi-step actions toward a goal across one or more context windows. We focus on coding and software development agents, where the practitioner literature is most mature and where output quality has a relatively clear external criterion: code either compiles, passes tests, and does what was intended, or it does not.
Token cost is the total monetary cost of all API calls during task completion, including input tokens, output tokens, and cache write costs. This is a component of, not a synonym for, total cost.
Total Cost of Ownership (TCO) is the complete cost of completing a task using an agent system, including API cost, developer oversight and review time, failure remediation cost, and the organizational cost of operating the agent infrastructure. TCO is the quantity of ultimate interest; token cost is the tractable subset this paper can most directly address.
Agent effectiveness is the probability that a task is completed to acceptable quality without requiring human correction, where quality is assessed against external criteria rather than the agent's own tests. We distinguish automated metric quality (test passage rate, static analysis score) from actual quality (whether the software does what users need). The framework targets the former as a measurable proxy while acknowledging the gap between them.
Goodhart's Law caveat: Any optimization toward automated metric quality risks producing agents that are better at satisfying the metric than at producing correct software. This caveat applies to every quality measure used in this paper and is inherent to the domain, not a fixable limitation.
1.2  The Honest Epistemological Position
This paper cannot present empirically validated quantitative results because the required experiments have not been run. What we can offer is: (1) a conceptual model that correctly identifies the variables and their relationships; (2) a qualitative framework grounded in those relationships that provides structured guidance for practitioners; and (3) a synthesis of available evidence — from provider documentation, practitioner case studies, and empirical research on context degradation — that grounds the qualitative framework in real findings. We are explicit throughout about which claims are empirically supported, which are analytically derived, and which are reasoned estimates.



2.  Background and Prior Work

2.1  The Long-Running Agent Problem
Anthropic's engineering research characterized the discrete session problem: each new agent session begins without memory of prior work, requiring reconstruction of sufficient context to resume productively. Three recurring failure modes were identified: agents attempting to complete the entire task in a single pass, causing context exhaustion mid-implementation; agents declaring premature completion upon observing partial progress; and agents marking features complete without end-to-end verification. Their two-agent harness solution — an initializer that establishes scaffolding and a coder that operates incrementally within it — addressed all three failure modes through structural discipline rather than prompting sophistication.
2.2  Context Engineering
Anthropic's context engineering research frames the core problem as curating what enters the context window from a constantly evolving universe of possible information. This represents a conceptual progression beyond prompt engineering: where prompt engineering asks how to write instructions, context engineering asks what to include and where to place it. Three primary techniques address context pollution — the accumulation of low-signal tokens that dilute model attention to high-signal content: compaction (summarizing aging context and reinitializing with the summary), structured note-taking (agents write explicit state summaries mid-session), and multi-agent architectures (distributing context across parallel sessions). Each technique involves tradeoffs this paper analyzes in depth.
2.3  Context Rot and the Lost-in-the-Middle Effect
The foundational empirical finding is that model performance follows a U-shaped curve with respect to the position of relevant information in the context window: performance is highest when critical information appears at the beginning or end of the context, and degrades significantly when it is buried in the middle. This effect is architectural — Rotary Position Embedding (RoPE), used in most modern LLMs, introduces a long-term decay effect that causes models to attend more strongly to beginning and end tokens regardless of content relevance. Newer models have reduced the severity but not eliminated it.
Chroma's 2025 Context Rot study, evaluating eighteen frontier models including GPT-4.1, Claude Opus 4, and Gemini 2.5, found accuracy drops of twenty to fifty percent between ten thousand and one hundred thousand token context lengths. Claude models showed the slowest degradation, but no model was immune. Importantly, subsequent research by Du et al. found that performance degradation persists even when all irrelevant tokens are replaced with blank space — implying that context length itself imposes a cognitive tax independent of content quality. Adding irrelevant context does not merely fail to help; it actively hurts.
Veseli et al. refined the positional pattern: the U-shaped primacy-recency curve persists only when the context window is less than fifty percent full. Above fifty percent fill, the pattern shifts to pure recency bias — the model favors the most recent tokens, with early tokens (including the system prompt) becoming the least reliable. This has a direct implication for session management: system prompt constraints that are critical to task quality are the most degraded information in a long session.
2.4  Prompt Caching
Prompt caching is a provider-level optimization that stores the key-value cache of stable prompt prefixes and reuses them across requests, eliminating prefill computation for repeated content. Anthropic charges ten percent of the normal input token price for cached tokens — a ninety percent reduction — with cache entries persisting five to ten minutes by default and up to one hour on extended sessions. OpenAI provides a fifty percent reduction automatically for prompts over one thousand and twenty-four tokens.
A February 2026 preprint evaluating caching across five hundred agentic sessions found that caching the system prompt — which remains stable across all requests within a session — is the primary driver of cost reduction. The study confirms that caching provides both cost and latency benefits (up to eighty percent reduction in time-to-first-token) with no effect on output quality.
The critical structural requirement is exact prefix matching: any modification to the cached prefix — including reordering tool definitions, personalizing the system prompt, or inserting dynamic context before the user turn — invalidates the cache. This creates a fundamental tension with compaction: compaction improves quality by replacing degraded context with a clean summary, but necessarily modifies the prefix and breaks cache hits. The resolution of this tension is a core question the qualitative framework addresses.
2.5  Model Routing and Cost Economics
The model pricing landscape changed fundamentally in late 2024 with DeepSeek's release at approximately seventy cents per million tokens — a twenty-eight-fold cost reduction from frontier models at eighteen to twenty dollars per million tokens at the time. This created viable cascade architectures where cheap models handle routine operations while expensive models handle genuine reasoning. Google Gemini Flash, open-weight models via inference providers, and Claude Haiku offer similar economics. Cost-aware routing, which dynamically selects the cheapest model capable of handling a given query, has been shown to improve the cost-quality tradeoff by up to twenty-five percent with robust generalization across query types.
AI model pricing is highly volatile. The economic case for routing depends on price ratios that can shift significantly within months. Any routing strategy built on specific price points should be reviewed against current pricing at deployment time.
2.6  Related Frameworks
FrugalGPT (Chen et al., 2023) addresses cost-quality tradeoffs in LLM deployment through cascade architectures and prompt adaptation. The AER framework presented in this paper extends FrugalGPT's core insight — that the goal is quality per unit cost, not quality alone or cost alone — by incorporating context degradation as a quality penalty and formalizing the session management dimension. FrugalGPT does not address the context rot problem, which is the paper's primary additional contribution to the cost-quality model.
The IS-LM model in macroeconomics and the Drake Equation in astrobiology are the methodological precedents for AER as a conceptual instrument: frameworks that specify relationships between named variables and support qualitative reasoning, without claiming to be computational engines. This positioning is deliberate and consistent with the epistemological constraints of the domain.



3.  Analysis of Alternatives

We analyze each major method across four dimensions: effect on automated metric quality Q, effect on API token cost, effect on failure rate (which drives retry cost), and interaction with the context rot problem. Directional assessments replace specific multipliers where empirical data is insufficient to support numerical claims. Where provider documentation or empirical research supports specific figures, those are cited.


¹ Cache write incurs a creation cost (~25% of normal input price on Anthropic) amortized across subsequent cache hits. ² Batch API has throughput limits and introduces hours of latency; not suitable for interactive workflows.

3.1  The Dominant Interventions
Three methods stand apart from the rest in terms of cost reduction magnitude with no quality penalty: prompt caching, positional anchoring, and RCCF framing. These are the only interventions where cost decreases without any quality tradeoff — all other cost-reducing interventions either reduce quality (shorter context) or require quality verification to confirm no regression (routing). They should be applied universally before any other optimization is considered.
3.2  The Context Rot Problem as an Organizing Principle
Context rot is not simply one problem among many — it is the organizing constraint that determines which other interventions are appropriate. An agent operating below thirty percent context fill is in a qualitatively different situation from one operating above fifty percent fill: different failure modes dominate, different interventions apply, and the priority ordering of cost optimization changes. The qualitative framework in Section 5 organizes around context utilization as its primary diagnostic dimension for this reason.
3.3  The Multi-Agent Cost Accounting Correction
Prior treatments of multi-agent cost have compared cached single-agent architectures against uncached multi-agent architectures, producing misleading cost differences. A fair comparison requires both architectures to use caching. Approximate comparison for a typical coding task (details and assumptions are illustrative, not empirically measured):


Key correction from peer review: When both architectures use prompt caching, the cost gap between single-agent and multi-agent narrows from approximately 7x to approximately 1.7x. Multi-agent is still more expensive, but the magnitude is different from what uncached comparisons suggest. The routing hybrid is the most cost-effective configuration when task complexity is mixed.



4.  The Conceptual Model: AER as an Idea Formula

The Agent Efficiency Ratio is presented as a conceptual instrument, not a computational tool. Like the Drake Equation, it organizes thinking about which variables matter and how they relate — without claiming that any specific values can be reliably inserted and computed. The formula is honest about this positioning from the outset.

4.1  Why an Idea Formula
Mathematical models in systems research fall on a spectrum from computable (inputs can be measured, outputs can be validated against empirical data) to conceptual (inputs resist measurement, but the structure of relationships is analytically sound and useful for reasoning). The AER belongs firmly in the second category.
The key inputs — P(success), Q, C_retry — cannot be measured without a substantial evaluation infrastructure that most engineering teams do not have and that requires time-consuming empirical work even for teams that invest in it. Presenting specific values for these inputs in a scenario table, as the first edition of this paper did, was a form of false precision. The corrected position is: the formula is real, the relationships are real, the structure is useful — but the numbers are illustrative estimates, not measurements.
This is not a weakness. The IS-LM model in macroeconomics has structured policy thinking for decades without anyone computing precise values of investment elasticity. The Drake Equation organized the search for extraterrestrial intelligence without yielding a number anyone trusts. Conceptual instruments earn their keep by imposing structure on reasoning, not by producing outputs.
4.2  The Total Cost of Ownership Frame
Before presenting AER, we establish the broader TCO frame it sits within. The complete cost of completing a task with an AI agent is:
TCO = C_api  +  C_human  +  C_remediation

Where:
  C_api         = Total API token cost (input + output + cache write)
  C_human       = Developer oversight and review time × labor rate
  C_remediation = Cost of correcting agent errors that reach production
This paper primarily addresses Capi — the most tractable component — while acknowledging that Chuman dominates TCO in most organizations. A senior engineer reviewing agent output at $200/hour loaded cost spends more in fifteen minutes than the agent's API calls cost in a week of typical usage. Optimizing Capi while ignoring Chuman is optimizing a minor term. The honest framing is: C_api optimization is valuable because it is tractable and because it frees engineering attention for higher-value work, not because it is the largest cost driver.
Cremediation is the hardest term to estimate and the most consequential. An agent that confidently produces incorrect code that passes its own tests can generate remediation costs orders of magnitude larger than Capi — debugging time, production incidents, security vulnerabilities. The qualitative framework addresses C_remediation risk explicitly through the task stakes dimension.
4.3  The AER Formula
With the TCO frame established, AER is defined as the quality-weighted successful output per unit of expected API cost:
AER = ( Q × P(success) ) / E[C_api]

Where:
  Q           = Automated metric quality score ∈ [0,1], conditional on task completion
  P(success)  = Probability of task completion without human correction
  E[C_api]    = Expected total API cost including retry attempts
On Q: Q measures automated metric quality — test passage, static analysis score, format compliance. It is not actual quality. The gap between Q and actual quality is irreducible without human evaluation and is subject to Goodhart's Law: as agents are optimized toward Q, Q becomes a less valid proxy for actual quality. This paper treats Q as useful but imperfect, and the qualitative framework includes a task stakes dimension specifically to flag when this gap is high-risk.

4.4  The Expected Cost Model
The expected API cost of completing a task is not the cost of a single successful call. It includes the cost of all failed attempts:
E[C_api] = C_call × (1 / P(success))
         + C_corrupt × P(state_corruption | failure) × (1/P(success) - 1)

Where:
  C_call       = API cost of a single attempt
  C_corrupt    = Additional cost to restore clean state after a corrupting failure
  P(state_corruption | failure) = Probability that a failed attempt leaves
                                   codebase in a state requiring cleanup
                                   before retry can proceed
The state corruption term is a critical addition absent from prior treatments. For coding agents with write access to the filesystem and version control, failed attempts frequently produce partially modified files, broken build states, or misleading intermediate commits. Restoring clean state before a retry is non-trivial and can cost more in developer time than the API cost of the retry itself. P(state_corruption | failure) is task-dependent: exploratory planning tasks have low corruption risk; file-modifying implementation tasks have high corruption risk.
Directional insight from the formula: Any intervention that increases P(success) while holding C_call constant is always beneficial in expected cost terms, regardless of where you are on the curve. This is the single most important structural insight the formula provides — it justifies investing in quality-improving constraints even when those constraints cost tokens, because the retry cost savings dominate.
4.5  The Context Utilization Penalty
Context rot introduces a quality degradation function D(U) where U is the fraction of the context window currently in use. We present this as a parameterized approximation calibrated to available empirical research, not as a precise measured function:
D(U) ≈ 1.0                              for U ≤ 0.30  (negligible degradation)
D(U) ≈ 1.0 − α × (U − 0.30)            for 0.30 < U ≤ 0.50  (U-shaped regime)
D(U) ≈ D(0.50) − β × (U − 0.50)        for U > 0.50  (recency-bias regime)

Parameters α and β are task- and model-dependent.
Empirical bounds: D(1.0) ∈ [0.15, 0.87] across studied models and tasks.
Chroma (2025): accuracy drops 20–50% from 10K to 100K tokens.
Conservative estimate for planning purposes: D(0.50) ≈ 0.80, D(0.75) ≈ 0.65.
The important structural features of D(U) are robust even without precise parameters: degradation begins before the context is half full; degradation accelerates above fifty percent fill; Claude models degrade more slowly than average but are not immune. The exact shape of the curve should be treated as unknown and task-dependent. The practical implication — act before fifty percent fill — is robust to reasonable parameter uncertainty.
4.6  The Cache Cost Reduction
Prompt caching reduces the effective input token cost. Let fstable be the fraction of input tokens that are stable across calls (system prompt, tool definitions, cached skill content), rhit be the cache hit rate, and r_discount be the provider's cache discount (0.10 for Anthropic, 0.50 for OpenAI). The effective input cost per call is:
C_input_effective = C_input × [ (1 − f_stable) + f_stable × (1 − r_hit × (1 − r_discount)) ]
                  + C_cache_write × f_stable × (1 − r_hit)

Where C_cache_write is the cost of creating a new cache entry (~25% of normal input price).

Illustrative: f_stable=0.70, r_hit=0.85, r_discount=0.90 (Anthropic):
  C_input_effective ≈ C_input × 0.43   (57% reduction on input-side costs)

Note: r_hit depends critically on call frequency. High-frequency agent loops
  achieve r_hit ≈ 0.90. Infrequent or bursty usage may achieve r_hit ≈ 0.50–0.70.
Cache hit rate is the most volatile parameter in the cost model and the one most sensitive to deployment context. Active development mode — where the system prompt is frequently modified — can reduce r_hit to near zero, eliminating caching benefits entirely. The implementation scheme addresses this.
4.7  The Directional Relationship Map
Rather than asserting specific AER values, we present the directional relationships that the formula makes explicit. These relationships are robust regardless of parameter values:




5.  Qualitative Decision Framework

This section applies structured focused comparison — a method developed in comparative political science for systematic case analysis without quantitative data. The method identifies theoretically relevant dimensions, specifies observable indicators for each, and derives strategy recommendations from dimension configurations. It provides rigorous guidance without requiring inputs the practitioner cannot measure.

5.1  Methodological Basis
Structured focused comparison, developed by Alexander George and Andrew Bennett, is designed for domains where controlled experiments are impossible, ground truth is contested, and key variables resist precise measurement — precisely the conditions of AI agent deployment. The method works by: (1) defining the theoretically relevant dimensions from the underlying model; (2) operationalizing each dimension into observable, qualitative indicators; (3) specifying what configuration of dimensions predicts what outcome; and (4) allowing practitioners to assess their situation against the framework and receive a recommendation.
This is meaningfully different from a rubric or checklist. A rubric scores items; structured focused comparison maps configurations to causal predictions grounded in theory. The prediction for a given configuration is why a particular strategy is recommended, not just that it is. This supports adaptation when the practitioner's situation partially matches a configuration but not exactly.
A secondary method drawn from political science is congruence testing: after selecting a strategy, practitioners can ask whether the evidence they observe matches what the theory predicts. If the agent is configured for high-context single-session use but exhibits the failure pattern predicted for context rot (declining performance over the session, forgotten constraints, inconsistent decisions), that is diagnostic evidence that the context-management strategy should change.
5.2  The Five Diagnostic Dimensions
The following five dimensions are derived from the conceptual model in Section 4. Each dimension has three observable levels. Assessment of all five dimensions produces a configuration that maps to a recommended strategy in Section 5.3.
Dimension 1: Task Decomposability
Can the task be broken into discrete, independently verifiable sub-tasks with explicit interface contracts between them? This dimension determines whether multi-agent or multi-session approaches are viable without coordination overhead dominating quality gains.


Dimension 2: Context Stability
Is the system prompt and stable context likely to remain unchanged across the deployment period? This dimension determines whether caching will provide its theoretical benefit in practice.


Dimension 3: Success Observability
Can the practitioner tell, with reasonable confidence and without extended delay, whether an agent task succeeded? This dimension determines the true cost of failure and how aggressively to optimize P(success) vs. C_call.


Dimension 4: Volume and Frequency
What is the call volume and temporal pattern of agent usage? This dimension determines which cost optimizations are economically worthwhile given their implementation cost.


Dimension 5: Task Stakes
What are the consequences of agent error? This dimension determines how much human oversight is appropriate and whether AER optimization is the right goal at all.


5.3  Strategy Configurations
The following configurations map dimension combinations to recommended strategies. A practitioner assesses their situation on all five dimensions and identifies the best-matching configuration. Configurations are types, not algorithms — a partial match is informative even when exact match is unavailable.

Configuration A: The Production Optimization Case
Decomposability: High or Medium  |  Context Stability: High  |  Success Observability: High  |  Volume: High  |  Stakes: Low to Medium
This is the configuration where cost optimization provides the most direct value and the least risk. The recommended strategy, in priority order:
Implement prompt caching with Zone A / Zone B / Zone C architecture immediately. At high volume, the engineering cost (four to eight hours) is recovered within days.
Apply RCCF constraint framing to the system prompt. Replace aspirational guidelines with binary, evaluable constraints.
Implement model routing for the call mix. Classify calls by task type and route to the cheapest model that handles each type reliably. Establish a misclassification monitoring signal.
Route all non-interactive tasks (review passes, documentation generation, smell analysis) to the Batch API.
Monitor context utilization via API response metadata. Set session restart triggers at forty percent fill.
Congruence test: If you implement this strategy and observe declining agent quality over the course of long sessions, the context rot mechanism is active and the session restart threshold should be moved earlier. If you observe unexpectedly high retry rates, the model routing misclassification rate is the likely cause.
Configuration B: The Active Development Case
Decomposability: Any  |  Context Stability: Low  |  Success Observability: Medium to High  |  Volume: Low to Medium  |  Stakes: Low
Prompt caching provides minimal benefit when the system prompt is changing frequently. The cost structure is different here — engineering time for prompt iteration is the dominant cost, not API tokens. The recommended strategy:
Focus entirely on RCCF quality. Every iteration of the system prompt should tighten constraints rather than add content. Verbose prompts cost tokens on every call; dense constraint specifications do not.
Use skeleton pre-seeding for all structured code generation tasks. This reduces output tokens and structural errors without requiring prompt stability.
Establish a measurement baseline before optimizing further. Decide on a P(success) proxy (test passage rate, review acceptance rate) and measure it for two weeks before making architectural changes. You cannot improve what you do not measure.
Defer caching implementation until the system prompt has been stable for two weeks. Then implement Zone A architecture and measure the cache hit rate.
Congruence test: If you are in active development but finding that the agent's failure modes are consistent across sessions (always failing the same type of task), that is evidence that the system prompt constraints are wrong, not that the architecture is wrong. Fix the constraints before the architecture.
Configuration C: The High-Stakes Single-Agent Case
Decomposability: Low to Medium  |  Context Stability: Any  |  Success Observability: Low  |  Volume: Any  |  Stakes: High
When task stakes are high and success observability is low, the AER framework should not be the primary optimization target. The recommended strategy:
Do not optimize toward AER. The C_remediation term in TCO dominates all token cost savings. An agent that produces confidently wrong output in a high-stakes domain costs vastly more than the token savings from any optimization.
Require human checkpoints at each major decision boundary. These are not failures of the agent system — they are appropriate quality gates for the stakes involved.
Use structured output schemas that make agent reasoning visible and reviewable. The goal is to reduce the cognitive cost of human review, not to eliminate it.
Apply caching and routing for cost efficiency, but treat them as secondary to quality and oversight considerations.
Congruence test: If your stakeholders are asking you to remove human checkpoints to speed up the pipeline, that is a signal that the system is being optimized for AER in a context where AER is the wrong objective. The correct response is to make the TCO case: the cost of a single production incident in a high-stakes domain exceeds the cost of months of human review.
Configuration D: The Multi-Agent Case
Decomposability: High  |  Context Stability: High  |  Success Observability: High  |  Volume: High  |  Stakes: Low to Medium
Multi-agent architectures are appropriate only when all five of the following conditions hold. These are sequential gates, not a scoring rubric — a failure on any one condition is sufficient to recommend against multi-agent:
The task cannot be completed within forty percent of a single context window without quality degradation.
The task decomposes into sub-tasks with explicit, testable interface contracts between them — specifically, without shared mutable state. Hidden dependencies through shared state are the most common source of multi-agent failure.
Sub-tasks can be executed in parallel without sequential dependencies.
Errors from any sub-agent are catchable at integration time before they compound into downstream work.
The measured P(success) for the single-agent approach is below seventy-five percent despite caching and constraint optimization.
If all five conditions hold, implement multi-agent architecture with caching applied to each agent's stable prefix individually. The cost gap between cached single-agent and cached multi-agent is approximately 1.7x, not 7x as uncached comparisons suggest.
Congruence test: If you implement multi-agent and find that coordination overhead (routing decisions, interface contract violations, integration failures) consumes more than thirty percent of total session time, the decomposability is lower than assessed. Revert to single-agent with compaction.
5.4  The Compaction vs. Restart Decision
The tension between compaction (maintaining session continuity, breaking cache) and session restart (preserving Zone A cache, breaking continuity) was identified as an unresolved contradiction in the first edition. The qualitative resolution:
Choose compaction when: Zone B context (session-specific information: decisions made, files modified, partial results) has high reconstruction cost. Compaction preserves this information. The quality benefit of continuity exceeds the cache cost of re-establishing Zone B.
Choose restart when: Zone B context can be fully reconstructed from a structured handoff document (the progress file pattern). The Zone A cache (system prompt, tool definitions) is large enough that re-establishing it costs meaningfully more than the compaction operation. Sessions are long enough that Zone A cache hit rates are high and worth preserving.
The practical heuristic: if your agent can write a handoff document that allows the next session to resume without meaningful quality loss, restart is preferred at high volume. If the agent's session-specific state is difficult to capture in a document, compaction is preferred. Most well-structured coding agents with progress files and git history fall into the restart category.
The stuffing vs. minimum context clarification: Prompt stuffing consolidates multiple sequential calls into one — it does not advocate filling the context window maximally within a single call. The minimum coherent context principle applies within a single call; stuffing applies across multiple calls that previously required chaining. These principles operate at different levels and are not in conflict.



6.  Implementation Scheme

The implementation scheme is organized into three tiers corresponding to investment level and prerequisite. Tier 1 interventions have no quality tradeoff and should be applied universally. Tier 2 interventions improve quality at modest cost and should follow Tier 1. Tier 3 interventions are architectural and should be gated by the qualitative framework.
Step 0 — Establish measurement baseline before optimizing. Decide on a P(success) proxy, a Q proxy, and a cost measurement method before implementing any optimization. Record two weeks of baseline data. Optimizing without measurement produces change without evidence of improvement.

6.1  Tier 1: Universal Structural Interventions
6.1.1  Prompt Architecture for Cache Maximization
Reorganize every agent prompt into three zones:
Zone A — Frozen Prefix (cached): System identity, RCCF constraints, tool definitions, skill/domain content. Must be byte-identical across all calls in a session. Append-only tool registration — inserting a tool at any position other than the end invalidates the cache for all subsequent tools.
Zone B — Session Context (cached after first write): Project context loaded at session start: git log summary, progress file, feature list, architecture constraints. Updated only at session boundaries.
Zone C — Dynamic Suffix (never cached): Conversation history, tool results, current instruction. Changes every call.
For Anthropic's API, mark Zone A and Zone B with explicit cache_control markers. Measure cache hit rate via the cache_read_input_tokens field in API response metadata. Target hit rate above eighty percent; investigate structural causes if below sixty percent.
6.1.2  RCCF System Prompt Structure
Structure every system prompt as Role → Context → Constraints → Format. Constraints must be explicit, binary, and evaluable. Examples of non-evaluable constraints: 'write clean code,' 'be thorough.' Examples of evaluable constraints: 'every public method must have an XML doc comment,' 'no method body may exceed thirty lines,' 'if the implementation is unclear, write a stub with a TODO explaining what information is missing — do not guess.'
Evaluable constraints reduce both the guidance the model needs and the probability of structural errors that require retries. They are shorter and more effective than aspirational guidelines.
6.1.3  Positional Anchoring
Within Zone A, place the most critical constraints in the first five hundred tokens — the region of strongest model attention for contexts below fifty percent fill. Place the specific task specification at the end of the user turn — the region of strongest recency attention. Background material, examples, and reference content belong in the middle, where they are available for retrieval but do not compete with constraints and task specification for primary attention.
6.1.4  Context Utilization Monitoring
Track cumulative token consumption using API response usage metadata. Implement a session restart trigger at forty percent context utilization. The restart protocol: agent writes a structured handoff document (current objective, completed work, current state, next action, known constraints, open questions) and commits to git. Next session reads this document as Zone B context.
Active development mode adjustment: When the system prompt is changing frequently (context stability = Low), the forty percent threshold is less meaningful because cache benefits are not being realized. In this mode, prioritize prompt quality iteration over session length management.
6.2  Tier 2: Prompting Optimizations
6.2.1  Skeleton Pre-seeding for Code Generation
For code generation tasks with predictable structure, provide the structural skeleton at the end of the user turn: class declaration and method signatures for new classes; test class with method names and Arrange/Act/Assert comment structure for test files; section headers and length constraints for documentation. The model fills slots rather than inventing structure. This reduces output tokens and structural error rates simultaneously.
6.2.2  Selective Chain-of-Thought
Apply CoT to tasks where incorrect answers have high downstream cost: architecture decisions, security-relevant logic, complex multi-constraint satisfaction. Skip CoT for routine implementation of well-specified functions, file operations, formatting, and documentation. The decision heuristic: would a senior engineer think out loud before answering this? If yes, apply CoT. If no, do not.
6.2.3  Recitation-Before-Reasoning in Long Sessions
For sessions approaching thirty-five percent context fill where a decision depends on information established early in the session, instruct the agent to state its understanding of the relevant component before acting on it. This exploits recency bias to improve recall of buried information. Cost: one hundred to three hundred additional output tokens. Benefit: reduced misremembering of early-session decisions and constraints. Apply selectively, not universally.
6.3  Tier 3: Architectural Decisions
6.3.1  Model Routing
Implement a three-tier routing architecture guided by task complexity classification:
Tier 1 (Cheap — $0.07–$0.50/M tokens): File reading, grep result formatting, output structure validation, simple summarization. Use when failure is immediately detectable and cheap to retry.
Tier 2 (Mid — $1–$8/M tokens): Code review, test writing, documentation, well-specified implementation. Use when task structure is clear enough for reliable mid-tier performance.
Tier 3 (Frontier — $15–$25/M tokens): Architecture decisions, ambiguous specifications, security-critical logic, tasks where wrong answers have high downstream cost. Reserve for the minority of calls that genuinely require frontier reasoning.
Measure routing misclassification rates from the start. A routing system that sends complex tasks to cheap models at a rate that triggers retries more than fifteen percent of the time may cost more than flat frontier deployment. The break-even misclassification rate depends on the cost ratio between models — calculate it for your specific pricing at deployment time.
6.3.2  The Handoff Artifact Standard
Any multi-session or multi-agent workflow requires a structured handoff artifact. Minimum content: current objective (one paragraph), completed work (structured list with file or commit references), current state (specific state of the codebase or system at handoff), next action (single specific next step), known constraints (decisions that must not be reversed), open questions (ambiguities requiring human judgment). Use JSON format — agents are less likely to accidentally restructure JSON than Markdown. Validate expected fields programmatically on session load.
6.3.3  Batch Processing
Route all non-interactive tasks to the Batch API: review passes, smell analysis, documentation generation, test scaffolding, adversarial plan review. The fifty percent cost reduction applies to all tokens in the batch. Combined with prompt caching, batch processing of review tasks achieves seventy to ninety percent cost reduction relative to synchronous frontier calls. The operational constraint: batch jobs complete in minutes to hours. Design workflows so batch tasks are queued asynchronously and results are loaded at the next session's Zone B initialization.
6.3.4  Multi-Agent Implementation
If and only if the qualitative framework's Configuration D conditions are met: implement multi-agent with Zone A caching applied to each agent's stable prefix individually. The cost gap between cached single-agent and cached multi-agent is approximately 1.7x — meaningful but not the 7x that uncached comparisons suggest. Use read-only tool permissions for quality and review agents; they cannot introduce changes they have not been authorized to make.



7.  Empirical Grounding

This section presents the empirical evidence available to support the framework's recommendations. We distinguish clearly between: (A) findings from published empirical research, (B) analytically derived conclusions from provider documentation, and (C) illustrative estimates based on the conceptual model. Category C findings should not be cited as measurements.
7.1  Category A: Published Empirical Findings
Context rot is real and architectural. Eighteen frontier models tested by Chroma Research showed consistent accuracy degradation as input length increased. The degradation is non-uniform: accuracy drops of 20–50% between 10K and 100K tokens. Claude models degrade more slowly but are not immune. [Chroma Research, 2025]
Lost-in-the-middle is robust across models. GPT-3.5-Turbo performance on multi-document QA dropped more than 20% when relevant information moved from position 1 to position 10 in a 20-document context. The U-shaped curve is consistent across model families. [Liu et al., 2024]
Context length imposes a cognitive tax independent of content. Du et al. showed that performance degradation persists even when all irrelevant tokens are replaced with blank space. Length itself is costly, not just irrelevant content. [Du et al., 2025]
Prompt caching reduces costs by 90% on cached tokens with no quality change. Provider documentation and the February 2026 preprint confirm 90% reduction (Anthropic), 80% reduction in time-to-first-token, and identical output quality on cached vs. uncached calls. [Anthropic docs; arXiv:2601.06007]
Cost-aware routing improves the accuracy-cost tradeoff by up to 25%. Shirkavand et al. demonstrate this with robust generalization across model families. [Shirkavand et al., 2025]
7.2  Category B: Analytically Derived from Provider Documentation
Caching break-even depends on call volume. At $18/M input tokens, 10,000-token system prompt, 4–8 hours engineering cost ($600–$2,000): break-even at 100 calls/day is 41–136 days; at 1,000 calls/day is 4–14 days; at 10,000 calls/day is under 2 days. This is arithmetic from stated assumptions, not a measured finding.

The Batch API provides 50% cost reduction with hours of latency. This is stated pricing from Anthropic's documentation, not a measured performance finding.
Speculative decoding provides 1.5–2.5x throughput improvement with identical output quality. This is documented in Google Research (Leviathan et al.) and confirmed in production benchmarks on Qwen3-32B. It is a provider-side optimization; API users benefit transparently but cannot configure it directly.
7.3  Category C: Illustrative Estimates (Not Measurements)
The following are estimates derived from the conceptual model with stated assumptions. They are useful for reasoning but should not be cited as empirical findings:
D(U) parameter values (α, β) are calibrated to empirical bounds but are not precise measurements. Actual values are task- and model-dependent.
P(success) and Q values in any scenario comparison are hypothetical. They illustrate the direction of model predictions, not measurements from real deployments.
The 1.7x cost ratio between cached single-agent and cached multi-agent is a rough calculation from illustrative configurations, not a measured benchmark.



8.  Counter-Analysis and Limitations

8.1  The Goodhart's Law Problem Is Irreducible
The paper's quality measure Q targets automated metrics — test passage, static analysis, format compliance. As agents are optimized toward these metrics, the metrics become less valid as quality proxies. An agent that learns to write tests matching its own wrong implementations can achieve Q = 1.0 while producing software that does not work. This is not a fixable limitation; it is inherent to using measurable proxies for actual quality.
The appropriate response is not to abandon Q but to treat it as one triangulation point among several. Practitioners should track multiple Q proxies simultaneously (test passage and review acceptance and production defect rate), rotate proxies periodically to prevent gaming, and maintain human review at sufficient frequency to catch systematic proxy-gaming before it becomes entrenched. No proxy is reliable indefinitely.
8.2  The Framework Is Not Neutral on Human Oversight
The AER metric rewards high P(success), defined as task completion without human intervention. This means AER optimization systematically devalues human oversight as a quality mechanism. For low-stakes, high-observability tasks, this is appropriate — human oversight is a cost to minimize. For high-stakes, low-observability tasks, this is dangerous — appropriate oversight is a feature, not a failure.
The qualitative framework addresses this through the task stakes dimension (Configuration C explicitly de-emphasizes AER for high-stakes contexts), but practitioners should be aware that the framework's overall orientation is toward reducing human intervention. In domains where human oversight is legally or ethically required, the framework should be applied only to the portions of the workflow where automation is appropriate.
8.3  The Framework Assumes Stationary Task Distributions
The qualitative framework's five dimensions are assessed at a point in time. Real software development has a non-stationary task distribution: early-stage projects involve exploratory, ambiguous tasks; mature projects involve routine, well-specified tasks. A configuration assessed as Configuration A (production optimization) for routine maintenance tasks may be Configuration C (high-stakes, low-observability) for the architectural refactoring that precedes the next release cycle.
The practical implication: reassess dimension levels when the nature of work changes significantly. The framework is not a permanent calibration — it is a snapshot that should be revisited quarterly or at major project phase transitions.
8.4  Caching and Quality Are Not Fully Independent
Section 4.6 presents caching as having no quality effect. This is true at the call level — a cached call produces identical output to an uncached call. It is less true at the session level. The structural requirement for caching (freeze the system prompt) prevents in-session learning from constraint refinement. A session that could improve its constraint specification based on early failures — and thereby increase P(success) for later calls — cannot do so without breaking the cache. For very long sessions or novel task types, the inability to refine constraints mid-session may reduce overall session quality even while reducing cost. This is a second-order effect that practitioners in active development should be aware of.
8.5  Model Routing Misclassification Is Asymmetric
Routing errors are not symmetric. Sending a simple task to an expensive model wastes money but produces correct output. Sending a complex task to a cheap model produces wrong output that may require an expensive retry. The cost of a routing error therefore depends on which direction the error goes. Conservative routing — erring toward expensive models when uncertain — is the economically rational strategy if the cost of a wrong complex-task output exceeds the savings from occasional cheap-model routing. Measure misclassification rates directionally before setting routing thresholds.



9.  Conclusions

9.1  What This Paper Claims and Does Not Claim
This paper claims: the variables governing the cost-effectiveness tradeoff of AI agents are identifiable and their directional relationships are analytically derivable; prompt caching is empirically the highest-ROI structural optimization available; context length is a degrading resource with documented architectural causes; and the qualitative framework provides rigorous guidance for strategy selection without requiring numerical inputs.
This paper does not claim: that specific AER values can be computed and compared across configurations; that the D(U) function is precisely measured; that the scenario comparisons in Section 7 reflect empirical measurements; or that the framework applies equally to all deployment contexts. These distinctions matter for practitioners who will apply the work.
9.2  The Five Durable Findings
Prompt caching is always the first intervention. It reduces input token costs by ninety percent on stable prefixes with zero quality change. No other intervention matches this ROI profile. Implement it before anything else.
Context length is a degrading resource, not a neutral container. Performance drops non-uniformly as context fills, with the steepest degradation above fifty percent utilization. Managing session length is a quality decision, not just a cost decision.
Total cost of ownership includes human time. Token cost optimization is valuable and tractable; it is not the dominant cost driver. Developer oversight, review, and remediation time dwarf API costs in most organizations. Optimizations that reduce agent quality to save tokens are optimizing the wrong term.
Multi-agent architectures cost approximately 1.7x a cached single-agent for equivalent tasks, not 7x. The larger figure comes from comparing uncached multi-agent to cached single-agent. With caching applied to both, the gap is real but moderate. Multi-agent is appropriate for a narrow set of conditions and should not be the default.
Measurement must precede optimization. The qualitative framework provides structured reasoning without numerical inputs, but any quantitative optimization — routing thresholds, session length triggers, caching architecture decisions — requires measured baselines. Establish P(success) and Q proxies before implementing optimizations, or the optimizations cannot be validated.
9.3  Implementation Priority
Establish measurement baseline: P(success) proxy, Q proxy, and API cost tracking. (Week 1)
Implement Zone A / Zone B / Zone C prompt architecture with explicit cache markers. Measure hit rate. (Week 1–2)
Apply RCCF constraint framing to all system prompts. (Week 2)
Apply positional anchoring within prompts. (Week 2)
Implement context utilization monitoring and session restart protocol. (Week 3)
Implement model routing for mixed-complexity workloads. Monitor misclassification rates from day one. (Week 3–4)
Route non-interactive tasks to Batch API. (Week 4)
Evaluate multi-agent architecture against Configuration D conditions only if single-agent P(success) remains below 0.75 after Steps 1–7. (Ongoing)
9.4  Future Directions
Three open problems would significantly advance the framework. First, empirical measurement of D(U) for specific model families and task types — the context rot curve is the most consequential unmeasured parameter in the model. Second, a validated classification scheme for model routing — the routing decision is currently made by practitioner judgment; a lightweight, reliable routing classifier would make the cost savings more consistent. Third, case studies validating the qualitative framework's Configuration-to-strategy mappings — the structured focused comparison method requires congruence testing against real cases to confirm its predictive validity. The framework is theoretically grounded but empirically unvalidated, and both conditions are important to state.



References

[1]  Anthropic Engineering. "Effective Context Engineering for AI Agents." anthropic.com/engineering, 2025.
[2]  Liu, N.F., Lin, K., Hewitt, J., Paranjape, A., Hopkins, M., Beainy, F., and Manning, C.D. "Lost in the Middle: How Language Models Use Long Contexts." Transactions of the Association for Computational Linguistics, 2024.
[3]  Hong, E. et al. "Context Rot: How Increasing Input Tokens Impacts LLM Performance." Chroma Research, 2025.
[4]  Du, et al. "Context Dilution Study." Referenced in diffray.ai, December 2025. Original title pending publication confirmation.
[5]  Veseli, et al. "Context Degradation Patterns in Long-Context LLMs." 2025.
[6]  Anthropic API Documentation. "Prompt Caching." docs.anthropic.com, 2026.
[7]  "Don't Break the Cache: An Evaluation of Prompt Caching for Long-Horizon Agentic Tasks." arXiv:2601.06007, February 2026.
[8]  Shirkavand, R. et al. "Cost-Aware Contrastive Routing for LLMs." OpenReview, NeurIPS 2025.
[9]  Chen, L., Zaharia, M., and Zou, J. "FrugalGPT: How to Use Large Language Models While Reducing Cost and Improving Performance." arXiv:2305.05176, 2023.
[10]  Leviathan, Y., Kalman, M., and Matias, Y. "Fast Inference from Transformers via Speculative Decoding." ICML 2023.
[11]  Anthropic Engineering. "Effective Harnesses for Long-Running Agents." anthropic.com/engineering, November 2025.
[12]  Kaminski, K. "Everything Claude Code: The Agent Harness Your Team Is Missing." bighatgroup.com, March 2026.
[13]  Ben-itzhak, Y. "How I Reduced LLM Token Costs by 90% Building AI Agents With OpenAI and Claude." Medium, March 2026.
[14]  OpenAI Developer Cookbook. "Prompt Caching 201." developers.openai.com, 2025.
[15]  George, A. and Bennett, A. "Case Studies and Theory Development in the Social Sciences." MIT Press, 2005. (Methodological basis for structured focused comparison.)
[16]  LangChain. "State of Agent Engineering." langchain.com, 2025–2026 Survey, 1,300+ respondents.
[17]  Morph LLM Research. "Lost in the Middle LLM: The U-Shaped Attention Problem Explained." morphllm.com, February 2026.
[18]  agent-engineering.dev. "Harness Engineering in 2026." March 2026.
[19]  Factory.ai. "The Context Window Problem: Scaling Agents Beyond Token Limits." 2025.
[20]  Maxim AI. "Solving the Lost in the Middle Problem." getmaxim.ai, October 2025.


End of Paper — Revised Edition March 2026
