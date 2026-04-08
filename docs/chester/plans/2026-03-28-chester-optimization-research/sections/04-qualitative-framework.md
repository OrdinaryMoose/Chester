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
